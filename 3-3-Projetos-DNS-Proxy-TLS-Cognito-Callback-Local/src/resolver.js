'use strict';

// Resolver recursivo iterativo.
//
// Para resolver "www.example.com A" ele começa nos root servers e vai seguindo
// "referrals" (indicações): root -> servidores do .com -> servidores do example.com.
// O que ele aprende (NS, glue, respostas, NXDOMAIN/NODATA) vai para o cache, então
// a próxima consulta já começa o mais perto possível do destino.
//
// Proteções implementadas:
//  - bailiwick: glue só é aceito se for de um NS citado na própria referral e dentro
//    da zona do servidor consultado; respostas só são aproveitadas se estiverem na
//    cadeia de CNAME que parte do nome perguntado e dentro da zona do servidor.
//  - ID + pergunta + origem validados no transporte.
//  - limites: nº de referrals, tamanho da cadeia de CNAME, nº total de consultas
//    upstream e prazo total por resolução; detecção de loops.
//  - coalescência: consultas idênticas simultâneas compartilham uma única resolução.

const { TYPE, RCODE, RCODE_NAME, buildQuery, isSubdomain, normalizeName, typeToString } = require('./codec');
const { DnsCache } = require('./cache');
const { createTransport, toServer } = require('./transport');
const { ROOT_HINTS } = require('./root-hints');

const MAX_REFERRALS = 16; // profundidade máxima de delegações numa resolução
const MAX_CNAME_DEPTH = 10;
const MAX_SERVERS_PER_STEP = 4; // quantos servidores de uma zona tentamos antes de desistir
const MAX_NS_LOOKUPS = 3; // quantos nomes de NS (sem glue) tentamos resolver

const servfail = () => ({ rcode: RCODE.SERVFAIL, answers: [], authority: [] });

function shuffle(list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

class Resolver {
  constructor(opts = {}) {
    this.cache = opts.cache || new DnsCache();
    this.transport = opts.transport || createTransport();
    this.roots = (opts.roots || ROOT_HINTS).map(toServer);
    this.log = opts.log || (() => {});
    this.now = opts.now || Date.now;
    this.maxUpstream = opts.maxUpstream ?? 40;
    this.deadlineMs = opts.deadlineMs ?? 15000;
    this.localZone = opts.localZone || null; // nomes respondidos localmente (veja local-zone.js)
    this.inflight = new Map();
  }

  // API pública. Nunca rejeita: falhas viram SERVFAIL.
  // Retorna { rcode, answers, authority, upstream, cached }.
  resolve(name, type) {
    const qname = normalizeName(name);
    const key = `${qname}|${type}`;
    const pending = this.inflight.get(key);
    if (pending) return pending;
    const promise = this._resolveTop(qname, type).finally(() => this.inflight.delete(key));
    this.inflight.set(key, promise);
    return promise;
  }

  async _resolveTop(name, type) {
    const ctx = { upstream: 0, deadline: this.now() + this.deadlineMs, stack: new Set() };
    try {
      const result = await this._resolve(name, type, ctx, 0);
      return { ...result, upstream: ctx.upstream, cached: ctx.upstream === 0 && !result.local, local: !!result.local };
    } catch (err) {
      this.log(`erro resolvendo ${name} ${typeToString(type)}: ${err.message}`);
      return { ...servfail(), upstream: ctx.upstream, cached: false, error: err.message };
    }
  }

  // Cache primeiro; se não resolver, vai à rede.
  async _resolve(name, type, ctx, depth) {
    if (depth > MAX_CNAME_DEPTH) throw new Error('cadeia de CNAME longa demais');
    const key = `${name}|${type}`;
    if (ctx.stack.has(key)) throw new Error(`loop de resolução em ${name} ${typeToString(type)}`);
    ctx.stack.add(key);
    try {
      // A zona local vem antes de tudo: cache e internet nunca contradizem o que você definiu.
      const local = this.localZone && this.localZone.lookup(name, type);
      if (local) return await this._fromLocal(local, name, type, ctx, depth);

      const negative = this.cache.getNegative(name, type);
      if (negative) {
        this.log(`cache negativo: ${name} ${typeToString(type)} (${RCODE_NAME[negative.rcode]})`);
        return { rcode: negative.rcode, answers: [], authority: negative.soa ? [negative.soa] : [] };
      }
      const direct = this.cache.getRecords(name, type);
      if (direct) {
        this.log(`cache: ${name} ${typeToString(type)}`);
        return { rcode: RCODE.NOERROR, answers: direct, authority: [] };
      }
      if (type !== TYPE.CNAME) {
        const cname = this.cache.getRecords(name, TYPE.CNAME);
        if (cname) {
          this.log(`cache: ${name} é CNAME de ${cname[0].data}`);
          const sub = await this._resolve(normalizeName(cname[0].data), type, ctx, depth + 1);
          return { rcode: sub.rcode, answers: [...cname, ...sub.answers], authority: sub.authority };
        }
      }
      return await this._iterate(name, type, ctx, depth);
    } finally {
      ctx.stack.delete(key);
    }
  }

  async _fromLocal(local, name, type, ctx, depth) {
    this.log(`zona local: ${name} ${typeToString(type)} (${local.kind})`);
    switch (local.kind) {
      case 'records':
        return { rcode: RCODE.NOERROR, answers: local.records, authority: [], local: true };
      case 'nodata':
        return { rcode: RCODE.NOERROR, answers: [], authority: [local.soa], local: true };
      case 'nxdomain':
        return { rcode: RCODE.NXDOMAIN, answers: [], authority: [local.soa], local: true };
      case 'cname': {
        // o alvo pode ser local ou externo; a resposta só é "local" se tudo veio daqui
        const sub = await this._resolve(normalizeName(local.record.data), type, ctx, depth + 1);
        return { rcode: sub.rcode, answers: [local.record, ...sub.answers], authority: sub.authority, local: !!sub.local };
      }
      default:
        return servfail();
    }
  }

  // Zona conhecida mais próxima do nome (com pelo menos um servidor de IP conhecido).
  _closestServers(name) {
    let zone = name;
    while (zone !== '') {
      const addrs = this._cachedAddresses(zone);
      if (addrs.length) return { zone, servers: addrs };
      const dot = zone.indexOf('.');
      zone = dot === -1 ? '' : zone.slice(dot + 1);
    }
    return { zone: '', servers: this.roots };
  }

  _cachedAddresses(zone) {
    const ns = this.cache.getRecords(zone, TYPE.NS);
    if (!ns) return [];
    const addrs = [];
    for (const r of ns) {
      const a = this.cache.getRecords(normalizeName(r.data), TYPE.A);
      if (a) for (const x of a) addrs.push({ address: x.data, port: 53 });
    }
    return addrs;
  }

  // Endereços dos servidores de uma zona recém-delegada. Se a referral veio sem glue,
  // resolve o nome de um dos NS (recursivamente) para descobrir o IP.
  async _serversForZone(zone, ctx, depth) {
    const addrs = this._cachedAddresses(zone);
    if (addrs.length) return addrs;
    const ns = this.cache.getRecords(zone, TYPE.NS) || [];
    const targets = ns.map((r) => normalizeName(r.data)).slice(0, MAX_NS_LOOKUPS);
    for (const target of targets) {
      try {
        this.log(`referral sem glue: resolvendo o servidor ${target}`);
        const r = await this._resolve(target, TYPE.A, ctx, depth + 1);
        for (const x of r.answers) if (x.type === TYPE.A) addrs.push({ address: x.data, port: 53 });
        if (addrs.length) break;
      } catch (err) {
        this.log(`não foi possível resolver ${target}: ${err.message}`);
      }
    }
    return addrs;
  }

  async _iterate(name, type, ctx, depth) {
    let { zone, servers } = this._closestServers(name);
    for (let hop = 0; hop < MAX_REFERRALS; hop++) {
      if (this.now() > ctx.deadline) throw new Error('tempo limite da resolução');
      this.log(`zona "${zone || '.'}": perguntando por ${name} ${typeToString(type)}`);
      const step = await this._askZone(servers, zone, name, type, ctx);
      if (!step) return servfail();

      switch (step.kind) {
        case 'answer': {
          for (const cn of step.chain) this.cache.setRecords(cn.name, TYPE.CNAME, [cn]);
          this.cache.setRecords(step.owner, type, step.final);
          return { rcode: RCODE.NOERROR, answers: [...step.chain, ...step.final], authority: [] };
        }
        case 'cname': {
          for (const cn of step.chain) this.cache.setRecords(cn.name, TYPE.CNAME, [cn]);
          this.log(`${name} é CNAME de ${step.target}; seguindo`);
          const sub = await this._resolve(step.target, type, ctx, depth + step.chain.length);
          return { rcode: sub.rcode, answers: [...step.chain, ...sub.answers], authority: sub.authority };
        }
        case 'nxdomain':
          this.cache.setNegative(name, '*', RCODE.NXDOMAIN, step.soa);
          return { rcode: RCODE.NXDOMAIN, answers: [], authority: step.soa ? [step.soa] : [] };
        case 'nodata':
          this.cache.setNegative(name, type, RCODE.NOERROR, step.soa);
          return { rcode: RCODE.NOERROR, answers: [], authority: step.soa ? [step.soa] : [] };
        case 'referral': {
          this._learnReferral(step, zone);
          const next = await this._serversForZone(step.zone, ctx, depth);
          if (!next.length) return servfail();
          this.log(`referral: zona "${step.zone}" -> ${next.map((s) => s.address).join(', ')}`);
          zone = step.zone;
          servers = next;
          break;
        }
        default:
          return servfail();
      }
    }
    throw new Error('referrals demais (delegação em loop?)');
  }

  // Guarda o NS da zona filha e o glue — apenas o que passa na checagem de bailiwick.
  _learnReferral(step, parentZone) {
    this.cache.setRecords(step.zone, TYPE.NS, step.ns);
    const targets = new Set(step.ns.map((r) => normalizeName(r.data)));
    const glue = new Map();
    for (const r of step.additionals) {
      if (r.type !== TYPE.A) continue;
      if (!targets.has(r.name) || !isSubdomain(r.name, parentZone)) continue; // ignora lixo/forjado
      if (!glue.has(r.name)) glue.set(r.name, []);
      glue.get(r.name).push(r);
    }
    for (const [name, records] of glue) this.cache.setRecords(name, TYPE.A, records);
  }

  // Tenta os servidores da zona (em ordem aleatória) até algum dar uma resposta útil.
  async _askZone(servers, zone, name, type, ctx) {
    for (const server of shuffle(servers).slice(0, MAX_SERVERS_PER_STEP)) {
      const msg = await this._ask(server, name, type, ctx);
      if (!msg) continue; // timeout / erro de rede: próximo servidor
      const step = this._classify(msg, name, type, zone);
      if (step) return step;
      this.log(`  resposta inútil de ${server.address} (rcode=${RCODE_NAME[msg.rcode] ?? msg.rcode}); tentando outro`);
    }
    return null;
  }

  async _ask(server, name, type, ctx) {
    if (++ctx.upstream > this.maxUpstream) throw new Error('limite de consultas upstream excedido');
    this.log(`  -> ${server.address}:${server.port}  ${name} ${typeToString(type)}`);
    try {
      const msg = await this.transport.query(server, buildQuery({ name, type }));
      this.log(
        `  <- ${RCODE_NAME[msg.rcode] ?? msg.rcode} aa=${+msg.aa} answers=${msg.answers.length} ` +
          `authority=${msg.authorities.length} additional=${msg.additionals.length}`,
      );
      return msg;
    } catch (err) {
      this.log(`  !! ${server.address}: ${err.message}`);
      return null;
    }
  }

  // Descobre o que a resposta significa: resposta final, CNAME, NXDOMAIN, NODATA,
  // referral — ou null se o servidor foi inútil (erro, lame, etc.).
  _classify(msg, name, type, zone) {
    if (msg.rcode !== RCODE.NOERROR && msg.rcode !== RCODE.NXDOMAIN) return null;

    // Só aproveitamos registros alcançáveis pela cadeia que parte do nome perguntado
    // e que estejam dentro da zona do servidor. O resto da seção de resposta é descartado.
    const chain = [];
    const seen = new Set();
    let cur = name;
    let final = [];
    while (isSubdomain(cur, zone)) {
      const direct = msg.answers.filter((r) => r.name === cur && r.type === type);
      if (direct.length) {
        final = direct;
        break;
      }
      if (type === TYPE.CNAME) break;
      const cn = msg.answers.find((r) => r.name === cur && r.type === TYPE.CNAME);
      if (!cn || seen.has(cur)) break;
      seen.add(cur);
      chain.push(cn);
      cur = normalizeName(cn.data);
    }
    if (final.length) return { kind: 'answer', chain, final, owner: cur };
    if (chain.length) return { kind: 'cname', chain, target: cur };

    const soa = msg.authorities.find(
      (r) => r.type === TYPE.SOA && isSubdomain(name, r.name) && isSubdomain(r.name, zone),
    );
    if (msg.rcode === RCODE.NXDOMAIN) return msg.aa ? { kind: 'nxdomain', soa } : null;
    if (soa && msg.aa) return { kind: 'nodata', soa };

    // referral: NS de uma zona mais específica que a atual e que contém o nome
    const ns = msg.authorities.filter(
      (r) => r.type === TYPE.NS && r.name !== zone && isSubdomain(r.name, zone) && isSubdomain(name, r.name),
    );
    if (ns.length) {
      const child = ns.reduce((a, b) => (b.name.length > a.name.length ? b : a)).name;
      return { kind: 'referral', zone: child, ns: ns.filter((r) => r.name === child), additionals: msg.additionals };
    }
    if (msg.aa) return { kind: 'nodata', soa };
    return null;
  }
}

module.exports = { Resolver };
