'use strict';

// Utilitários dos testes: construtores de registros e uma "internet falsa" em memória.
// A rede falsa passa cada resposta por encode -> decode, então o codec real
// (inclusive a compressão de nomes) participa de todos os testes do resolver.

const { encodeMessage, decodeMessage, TYPE } = require('../src/codec');

const rr = (name, type, data, ttl = 300) => ({ name, type, class: 1, ttl, data });
const A = (name, ip, ttl) => rr(name, TYPE.A, ip, ttl);
const NS = (name, target, ttl = 172800) => rr(name, TYPE.NS, target, ttl);
const CNAME = (name, target, ttl) => rr(name, TYPE.CNAME, target, ttl);
const TXT = (name, strings, ttl) => rr(name, TYPE.TXT, strings, ttl);
const SOA = (zone, ttl = 300, minimum = 60) =>
  rr(zone, TYPE.SOA, { mname: `ns1.${zone}`, rname: `hostmaster.${zone}`, serial: 1, refresh: 7200, retry: 900, expire: 1209600, minimum }, ttl);

function reply(query, { rcode = 0, aa = false, answers = [], authorities = [], additionals = [] } = {}) {
  return {
    id: query.id,
    qr: true,
    opcode: 0,
    aa,
    tc: false,
    rd: false,
    ra: false,
    ad: false,
    cd: false,
    rcode,
    questions: query.questions,
    answers,
    authorities,
    additionals,
  };
}

class FakeNetwork {
  constructor() {
    this.handlers = new Map();
    this.log = []; // { address, name, type } de cada consulta feita
  }

  on(address, fn) {
    this.handlers.set(address, fn);
    return this;
  }

  async query(server, queryMsg) {
    const q = queryMsg.questions[0];
    this.log.push({ address: server.address, name: q.name.toLowerCase(), type: q.type });
    const fn = this.handlers.get(server.address);
    if (!fn) throw new Error(`timeout (sem servidor em ${server.address})`);
    const out = fn({ name: q.name.toLowerCase(), type: q.type }, queryMsg);
    if (!out) throw new Error('timeout');
    return decodeMessage(encodeMessage(reply(queryMsg, out)));
  }

  count(address) {
    return this.log.filter((l) => l.address === address).length;
  }

  clearLog() {
    this.log = [];
  }
}

const ROOT = '198.41.0.4';
const TLD_COM = '192.5.6.30';
const TLD_NET = '192.5.6.31';
const TLD_ORG = '192.5.6.32';
const AUTH_EXAMPLE = '203.0.113.10';
const AUTH_OTHER = '203.0.113.20';
const AUTH_BANK = '203.0.113.30';
const AUTH_HOSTING = '203.0.113.40';
const AUTH_ORG = '203.0.113.50';

const under = (name, zone) => name === zone || name.endsWith(`.${zone}`);

// Uma mini-internet:
//   root -> .com / .net / .org
//   example.com, other.com, bank.com (com glue), example.org (NS fora da zona e SEM glue)
function buildWorld() {
  const net = new FakeNetwork();

  net.on(ROOT, ({ name }) => {
    const tld = name.split('.').pop();
    if (tld === 'com') return { authorities: [NS('com', 'a.gtld-servers.net')], additionals: [A('a.gtld-servers.net', TLD_COM, 172800), A('evil.invalid', '6.6.6.6')] };
    if (tld === 'net') return { authorities: [NS('net', 'b.gtld-servers.net')], additionals: [A('b.gtld-servers.net', TLD_NET, 172800)] };
    if (tld === 'org') return { authorities: [NS('org', 'c.gtld-servers.net')], additionals: [A('c.gtld-servers.net', TLD_ORG, 172800)] };
    return { rcode: 3, aa: true, authorities: [SOA('', 86400, 3600)] };
  });

  net.on(TLD_COM, ({ name }) => {
    if (under(name, 'example.com')) return { authorities: [NS('example.com', 'ns1.example.com')], additionals: [A('ns1.example.com', AUTH_EXAMPLE, 172800)] };
    if (under(name, 'other.com')) return { authorities: [NS('other.com', 'ns1.other.com')], additionals: [A('ns1.other.com', AUTH_OTHER, 172800)] };
    if (under(name, 'bank.com')) return { authorities: [NS('bank.com', 'ns1.bank.com')], additionals: [A('ns1.bank.com', AUTH_BANK, 172800)] };
    return { rcode: 3, aa: true, authorities: [SOA('com', 900, 900)] };
  });

  net.on(TLD_NET, ({ name }) => {
    if (under(name, 'hosting.net')) return { authorities: [NS('hosting.net', 'ns1.hosting.net')], additionals: [A('ns1.hosting.net', AUTH_HOSTING, 172800)] };
    return { rcode: 3, aa: true, authorities: [SOA('net', 900, 900)] };
  });

  // example.org é delegado a ns.hosting.net, que está fora da zona .org => sem glue
  net.on(TLD_ORG, ({ name }) => {
    if (under(name, 'example.org')) return { authorities: [NS('example.org', 'ns.hosting.net')] };
    return { rcode: 3, aa: true, authorities: [SOA('org', 900, 900)] };
  });

  net.on(AUTH_EXAMPLE, ({ name, type }) => {
    const zone = 'example.com';
    switch (name) {
      case 'www.example.com':
        if (type === TYPE.A) return { aa: true, answers: [A(name, '93.184.216.34', 300)] };
        return { aa: true, authorities: [SOA(zone)] }; // NODATA para outros tipos
      case 'mail.example.com':
        return { aa: true, answers: [A(name, '93.184.216.35', 300)] };
      case 'alias.example.com':
        return { aa: true, answers: [CNAME(name, 'www.example.com', 300), A('www.example.com', '93.184.216.34', 300)] };
      case 'cdn.example.com':
        return { aa: true, answers: [CNAME(name, 'edge.other.com', 300)] }; // alvo em outra zona
      case 'evil.example.com': // tenta envenenar: CNAME para bank.com + A forjado
        return { aa: true, answers: [CNAME(name, 'bank.com', 300), A('bank.com', '6.6.6.6', 300)] };
      case 'extra.example.com': // resposta com registro alheio no meio
        return { aa: true, answers: [A(name, '93.184.216.99', 300), A('bank.com', '6.6.6.6', 300)] };
      case 'loop1.example.com':
        return { aa: true, answers: [CNAME(name, 'loop2.example.com', 300), CNAME('loop2.example.com', 'loop1.example.com', 300)] };
      case 'big.example.com':
        return { aa: true, answers: Array.from({ length: 30 }, (_, i) => TXT(name, [`${i}-${'x'.repeat(100)}`], 300)) };
      case 'nonexistent.example.com':
        return { rcode: 3, aa: true, authorities: [SOA(zone, 300, 60)] };
      default:
        return { rcode: 3, aa: true, authorities: [SOA(zone, 300, 60)] };
    }
  });

  net.on(AUTH_OTHER, ({ name }) => {
    if (name === 'edge.other.com') return { aa: true, answers: [A(name, '198.51.100.7', 300)] };
    if (name === 'other.com') return { aa: true, answers: [A(name, '198.51.100.1', 300)] };
    return { rcode: 3, aa: true, authorities: [SOA('other.com')] };
  });

  net.on(AUTH_BANK, ({ name }) => {
    if (name === 'bank.com') return { aa: true, answers: [A(name, '1.2.3.4', 300)] };
    return { rcode: 3, aa: true, authorities: [SOA('bank.com')] };
  });

  net.on(AUTH_HOSTING, ({ name }) => {
    if (name === 'ns.hosting.net') return { aa: true, answers: [A(name, AUTH_ORG, 300)] };
    return { rcode: 3, aa: true, authorities: [SOA('hosting.net')] };
  });

  net.on(AUTH_ORG, ({ name }) => {
    if (under(name, 'example.org')) return { aa: true, answers: [A(name, '192.0.2.80', 300)] };
    return { rcode: 3, aa: true, authorities: [SOA('example.org')] };
  });

  return net;
}

module.exports = {
  rr, A, NS, CNAME, TXT, SOA, reply, FakeNetwork, buildWorld,
  ROOT, TLD_COM, TLD_NET, TLD_ORG, AUTH_EXAMPLE, AUTH_OTHER, AUTH_BANK, AUTH_HOSTING, AUTH_ORG,
};
