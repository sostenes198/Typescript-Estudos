'use strict';

// Zona local: nomes que o servidor responde sozinho, sem consultar a internet.
// Serve para criar domínios falsos de desenvolvimento (callbacks, webhooks, OAuth...).
//
// Formato do arquivo (JSON):
//   {
//     "callback.test":     { "A": "127.0.0.1" },
//     "*.hooks.test":      { "A": ["127.0.0.1"], "ttl": 10 },   // curinga: qualquer nome abaixo de hooks.test
//     "api.callback.test": { "CNAME": "callback.test" }
//   }
// Tipos aceitos: A, AAAA, CNAME, TXT, MX ("10 mail.test"). "ttl" é opcional (segundos).
//
// Regras:
//  - A zona local tem precedência sobre o cache e sobre a internet.
//  - Nome definido mas sem o tipo pedido => NODATA. CNAME não convive com outros tipos.
//  - O curinga não casa com o próprio apex (*.hooks.test não cobre hooks.test).
//  - Padrões da RFC 6761: localhost e *.localhost => 127.0.0.1 / ::1; nomes sob .test,
//    .invalid e .example que você não definiu => NXDOMAIN local (nem chegam aos root servers).

const fs = require('node:fs');
const net = require('node:net');
const { TYPE, normalizeName, parseIPv6 } = require('./codec');

class LocalZoneError extends Error {
  constructor(message) {
    super(message);
    this.name = 'LocalZoneError';
  }
}

const TYPE_KEYS = ['A', 'AAAA', 'CNAME', 'TXT', 'MX'];
const RESERVED_TLDS = new Set(['test', 'invalid', 'example']);
const NEGATIVE_TTL = 5; // curto de propósito: editou o arquivo, quer ver o efeito já

function validName(name, where) {
  const n = normalizeName(name);
  if (n === '') throw new LocalZoneError(`${where}: nome vazio`);
  for (const label of n.split('.')) {
    if (label.length > 63 || !/^[a-z0-9_]([a-z0-9_-]*[a-z0-9_])?$/.test(label)) {
      throw new LocalZoneError(`${where}: nome inválido "${name}"`);
    }
  }
  return n;
}

function parseMx(key, v) {
  if (typeof v === 'string') {
    const m = /^(\d+)\s+(\S+)$/.exec(v.trim());
    if (m && Number(m[1]) <= 65535) return { preference: Number(m[1]), exchange: validName(m[2], `"${key}" MX`) };
  } else if (v && Number.isInteger(v.preference) && typeof v.exchange === 'string') {
    return { preference: v.preference, exchange: validName(v.exchange, `"${key}" MX`) };
  }
  throw new LocalZoneError(`"${key}": MX inválido ${JSON.stringify(v)} (use "10 mail.exemplo.test")`);
}

// TXT: cada string do array vira um registro; strings > 255 bytes são divididas em pedaços.
function parseTxt(key, v) {
  if (typeof v !== 'string') throw new LocalZoneError(`"${key}": TXT precisa ser texto`);
  const bytes = Buffer.from(v, 'utf8');
  const chunks = [];
  for (let i = 0; i < bytes.length || i === 0; i += 255) chunks.push(bytes.subarray(i, i + 255).toString('latin1'));
  return chunks;
}

function parseValues(key, type, value) {
  const list = Array.isArray(value) ? value : [value];
  if (list.length === 0) throw new LocalZoneError(`"${key}": lista de ${type} vazia`);
  switch (type) {
    case 'A':
      return list.map((x) => {
        if (typeof x !== 'string' || !net.isIPv4(x)) throw new LocalZoneError(`"${key}": A inválido ${JSON.stringify(x)}`);
        return x;
      });
    case 'AAAA':
      return list.map((x) => {
        try {
          parseIPv6(String(x));
        } catch {
          throw new LocalZoneError(`"${key}": AAAA inválido ${JSON.stringify(x)}`);
        }
        return String(x);
      });
    case 'CNAME':
      if (list.length !== 1 || typeof list[0] !== 'string') throw new LocalZoneError(`"${key}": CNAME aceita um único alvo`);
      return [validName(list[0], `"${key}" CNAME`)];
    case 'TXT':
      return list.map((x) => parseTxt(key, x));
    case 'MX':
      return list.map((x) => parseMx(key, x));
    default:
      throw new LocalZoneError(`tipo ${type} não suportado`);
  }
}

function parseEntry(key, spec) {
  if (!spec || typeof spec !== 'object' || Array.isArray(spec)) {
    throw new LocalZoneError(`"${key}": esperado um objeto com os registros (ex.: { "A": "127.0.0.1" })`);
  }
  const entry = { ttl: undefined, records: new Map() };
  for (const [k, v] of Object.entries(spec)) {
    if (k.toLowerCase() === 'ttl') {
      if (!Number.isInteger(v) || v < 0 || v > 86400) throw new LocalZoneError(`"${key}": ttl precisa ser um inteiro entre 0 e 86400`);
      entry.ttl = v;
      continue;
    }
    const t = k.toUpperCase();
    if (!TYPE_KEYS.includes(t)) {
      throw new LocalZoneError(`"${key}": tipo "${k}" não suportado (use ${TYPE_KEYS.join(', ')} e ttl)`);
    }
    entry.records.set(TYPE[t], parseValues(key, t, v));
  }
  if (entry.records.size === 0) throw new LocalZoneError(`"${key}": nenhum registro definido`);
  if (entry.records.has(TYPE.CNAME) && entry.records.size > 1) {
    throw new LocalZoneError(`"${key}": CNAME não pode coexistir com outros tipos`);
  }
  return entry;
}

function formatData(type, data) {
  if (type === TYPE.MX) return `${data.preference} ${data.exchange}`;
  if (type === TYPE.TXT) return data.map((s) => `"${Buffer.from(s, 'latin1').toString('utf8')}"`).join(' ');
  return String(data);
}

const TYPE_LABEL = { [TYPE.A]: 'A', [TYPE.AAAA]: 'AAAA', [TYPE.CNAME]: 'CNAME', [TYPE.TXT]: 'TXT', [TYPE.MX]: 'MX' };

class LocalZone {
  constructor(config = {}, { defaultTtl = 30 } = {}) {
    this.defaultTtl = defaultTtl;
    this.exact = new Map();
    this.wild = new Map();
    this.size = 0;
    this.lines = [];
    this.load(config);
  }

  static readFile(path) {
    let text;
    try {
      text = fs.readFileSync(path, 'utf8');
    } catch (err) {
      throw new LocalZoneError(`não foi possível ler ${path}: ${err.message}`);
    }
    try {
      return JSON.parse(text);
    } catch (err) {
      throw new LocalZoneError(`${path}: JSON inválido (${err.message})`);
    }
  }

  static fromFile(path, opts) {
    return new LocalZone(LocalZone.readFile(path), opts);
  }

  reloadFile(path) {
    this.load(LocalZone.readFile(path));
  }

  // Valida tudo ANTES de trocar: se algo estiver errado, a configuração anterior continua valendo.
  load(config) {
    if (!config || typeof config !== 'object' || Array.isArray(config)) {
      throw new LocalZoneError('o arquivo precisa ser um objeto: { "nome": { "A": "127.0.0.1" } }');
    }
    const exact = new Map();
    const wild = new Map();
    const lines = [];
    // padrão RFC 6761: localhost e *.localhost apontam para o loopback (a configuração pode sobrescrever)
    const loopback = { ttl: undefined, records: new Map([[TYPE.A, ['127.0.0.1']], [TYPE.AAAA, ['::1']]]) };
    exact.set('localhost', loopback);
    wild.set('localhost', loopback);

    let size = 0;
    for (const [key, spec] of Object.entries(config)) {
      const isWild = key.startsWith('*.');
      const name = validName(isWild ? key.slice(2) : key, `"${key}"`);
      const entry = parseEntry(key, spec);
      (isWild ? wild : exact).set(name, entry);
      size++;
      for (const [type, values] of entry.records) {
        for (const v of values) {
          lines.push(`${key}\t${TYPE_LABEL[type]}\t${formatData(type, v)}${entry.ttl !== undefined ? `\t(ttl ${entry.ttl})` : ''}`);
        }
      }
    }
    this.exact = exact;
    this.wild = wild;
    this.size = size;
    this.lines = lines;
  }

  describe() {
    return this.lines;
  }

  // Nome exato primeiro; senão o curinga mais próximo entre os ancestrais (a.b.c -> *.b.c -> *.c).
  _find(name) {
    const exact = this.exact.get(name);
    if (exact) return exact;
    let rest = name;
    for (;;) {
      const dot = rest.indexOf('.');
      if (dot === -1) return null;
      rest = rest.slice(dot + 1);
      const w = this.wild.get(rest);
      if (w) return w;
    }
  }

  _soa(tld) {
    return {
      name: tld,
      type: TYPE.SOA,
      class: 1,
      ttl: NEGATIVE_TTL,
      data: { mname: 'localhost', rname: 'hostmaster.localhost', serial: 1, refresh: 3600, retry: 600, expire: 86400, minimum: NEGATIVE_TTL },
    };
  }

  // Retorna null (não é com a zona local) ou:
  //   { kind: 'records', records }   resposta pronta
  //   { kind: 'cname', record }      alias: o resolver segue o alvo (local ou não)
  //   { kind: 'nodata', soa }        nome existe, tipo não
  //   { kind: 'nxdomain', soa }      nome sob TLD reservado e não definido
  lookup(name, type) {
    const tld = name.slice(name.lastIndexOf('.') + 1);
    const entry = this._find(name);
    if (!entry) return RESERVED_TLDS.has(tld) ? { kind: 'nxdomain', soa: this._soa(tld) } : null;

    const ttl = entry.ttl ?? this.defaultTtl;
    const make = (t, data) => ({ name, type: t, class: 1, ttl, data });
    const cname = entry.records.get(TYPE.CNAME);
    if (cname) {
      const record = make(TYPE.CNAME, cname[0]);
      return type === TYPE.CNAME ? { kind: 'records', records: [record] } : { kind: 'cname', record };
    }
    const values = entry.records.get(type);
    if (values) return { kind: 'records', records: values.map((v) => make(type, v)) };
    return { kind: 'nodata', soa: this._soa(tld) };
  }
}

module.exports = { LocalZone, LocalZoneError };
