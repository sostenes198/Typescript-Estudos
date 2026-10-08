'use strict';

// Codec DNS (RFC 1035): converte entre Buffer (formato de rede) e objetos JS.
// Suporta compressão de nomes (leitura e escrita), EDNS0 (registro OPT) e os
// tipos A, AAAA, NS, CNAME, PTR, MX, TXT e SOA. Tipos desconhecidos viram Buffer.

const crypto = require('node:crypto');

const TYPE = { A: 1, NS: 2, CNAME: 5, SOA: 6, PTR: 12, MX: 15, TXT: 16, AAAA: 28, OPT: 41, ANY: 255 };
const TYPE_NAME = Object.fromEntries(Object.entries(TYPE).map(([name, num]) => [num, name]));
const CLASS_IN = 1;
const RCODE = { NOERROR: 0, FORMERR: 1, SERVFAIL: 2, NXDOMAIN: 3, NOTIMP: 4, REFUSED: 5 };
const RCODE_NAME = Object.fromEntries(Object.entries(RCODE).map(([name, num]) => [num, name]));

class DnsFormatError extends Error {
  constructor(message) {
    super(message);
    this.name = 'DnsFormatError';
  }
}

// ---------------------------------------------------------------- utilitários

function typeFromString(s) {
  const up = String(s).toUpperCase();
  if (TYPE[up] !== undefined) return TYPE[up];
  const m = /^TYPE(\d+)$/.exec(up);
  if (m) return Number(m[1]);
  throw new Error(`tipo de registro desconhecido: ${s}`);
}

function typeToString(n) {
  return TYPE_NAME[n] || `TYPE${n}`;
}

// "WWW.Example.COM." -> "www.example.com"  (a raiz "." vira "")
function normalizeName(name) {
  let n = String(name).trim().toLowerCase();
  if (n.endsWith('.')) n = n.slice(0, -1);
  return n;
}

// "a.b.example.com" está dentro da zona "example.com"? A zona raiz ("") contém tudo.
function isSubdomain(name, zone) {
  return zone === '' || name === zone || name.endsWith(`.${zone}`);
}

function randomId() {
  return crypto.randomInt(0, 65536);
}

function formatIPv6(buf) {
  const groups = [];
  for (let i = 0; i < 16; i += 2) groups.push(buf.readUInt16BE(i));
  // maior sequência de grupos zero (>= 2) vira "::"
  let bestStart = -1;
  let bestLen = 0;
  let curStart = -1;
  let curLen = 0;
  for (let i = 0; i < 8; i++) {
    if (groups[i] === 0) {
      if (curStart < 0) {
        curStart = i;
        curLen = 0;
      }
      curLen++;
      if (curLen > bestLen) {
        bestStart = curStart;
        bestLen = curLen;
      }
    } else {
      curStart = -1;
      curLen = 0;
    }
  }
  const hex = groups.map((g) => g.toString(16));
  if (bestLen < 2) return hex.join(':');
  return `${hex.slice(0, bestStart).join(':')}::${hex.slice(bestStart + bestLen).join(':')}`;
}

function parseIPv6(str) {
  const halves = str.split('::');
  if (halves.length > 2) throw new Error(`IPv6 inválido: ${str}`);
  const parse = (s) =>
    s === ''
      ? []
      : s.split(':').map((g) => {
          if (!/^[0-9a-f]{1,4}$/i.test(g)) throw new Error(`IPv6 inválido: ${str}`);
          return parseInt(g, 16);
        });
  const head = parse(halves[0]);
  const tail = halves.length === 2 ? parse(halves[1]) : [];
  const missing = 8 - head.length - tail.length;
  if (halves.length === 1 ? missing !== 0 : missing < 1) throw new Error(`IPv6 inválido: ${str}`);
  const groups = [...head, ...new Array(halves.length === 2 ? missing : 0).fill(0), ...tail];
  const buf = Buffer.alloc(16);
  groups.forEach((g, i) => buf.writeUInt16BE(g, i * 2));
  return buf;
}

// ------------------------------------------------------------------- leitura

// Lê um nome (com ponteiros de compressão). Retorna { name, offset } onde offset
// é a posição logo após o nome no ponto de leitura original.
function decodeName(buf, offset, preserveCase = false) {
  const labels = [];
  let pos = offset;
  let end = -1;
  let jumps = 0;
  let total = 0;
  for (;;) {
    if (pos >= buf.length) throw new DnsFormatError('nome fora dos limites do pacote');
    const len = buf[pos];
    if (len === 0) {
      if (end < 0) end = pos + 1;
      break;
    }
    if ((len & 0xc0) === 0xc0) {
      if (pos + 1 >= buf.length) throw new DnsFormatError('ponteiro truncado');
      if (end < 0) end = pos + 2;
      if (++jumps > 64) throw new DnsFormatError('ponteiros de compressão demais (loop?)');
      pos = ((len & 0x3f) << 8) | buf[pos + 1];
      continue;
    }
    if ((len & 0xc0) !== 0) throw new DnsFormatError('tipo de label não suportado');
    if (pos + 1 + len > buf.length) throw new DnsFormatError('label truncado');
    total += len + 1;
    if (total > 255) throw new DnsFormatError('nome maior que 255 bytes');
    labels.push(buf.toString('latin1', pos + 1, pos + 1 + len));
    pos += len + 1;
  }
  const name = labels.join('.');
  return { name: preserveCase ? name : name.toLowerCase(), offset: end };
}

function decodeRdata(buf, type, pos, end) {
  switch (type) {
    case TYPE.A:
      if (end - pos !== 4) throw new DnsFormatError('rdata de A com tamanho inválido');
      return `${buf[pos]}.${buf[pos + 1]}.${buf[pos + 2]}.${buf[pos + 3]}`;
    case TYPE.AAAA:
      if (end - pos !== 16) throw new DnsFormatError('rdata de AAAA com tamanho inválido');
      return formatIPv6(buf.subarray(pos, end));
    case TYPE.NS:
    case TYPE.CNAME:
    case TYPE.PTR: {
      const n = decodeName(buf, pos);
      if (n.offset > end) throw new DnsFormatError('nome excede o rdata');
      return n.name;
    }
    case TYPE.MX: {
      const preference = buf.readUInt16BE(pos);
      const n = decodeName(buf, pos + 2);
      if (n.offset > end) throw new DnsFormatError('nome excede o rdata');
      return { preference, exchange: n.name };
    }
    case TYPE.TXT: {
      const strings = [];
      let p = pos;
      while (p < end) {
        const len = buf[p++];
        if (p + len > end) throw new DnsFormatError('TXT truncado');
        strings.push(buf.toString('latin1', p, p + len));
        p += len;
      }
      return strings;
    }
    case TYPE.SOA: {
      const m = decodeName(buf, pos);
      const r = decodeName(buf, m.offset);
      if (r.offset + 20 > end) throw new DnsFormatError('SOA truncado');
      const o = r.offset;
      return {
        mname: m.name,
        rname: r.name,
        serial: buf.readUInt32BE(o),
        refresh: buf.readUInt32BE(o + 4),
        retry: buf.readUInt32BE(o + 8),
        expire: buf.readUInt32BE(o + 12),
        minimum: buf.readUInt32BE(o + 16),
      };
    }
    default:
      return Buffer.from(buf.subarray(pos, end));
  }
}

function decodeRecord(buf, offset) {
  const n = decodeName(buf, offset);
  let pos = n.offset;
  if (pos + 10 > buf.length) throw new DnsFormatError('registro truncado');
  const type = buf.readUInt16BE(pos);
  const klass = buf.readUInt16BE(pos + 2);
  const ttl = buf.readUInt32BE(pos + 4);
  const rdlength = buf.readUInt16BE(pos + 8);
  pos += 10;
  if (pos + rdlength > buf.length) throw new DnsFormatError('rdata truncado');
  const end = pos + rdlength;
  return { record: { name: n.name, type, class: klass, ttl, data: decodeRdata(buf, type, pos, end) }, offset: end };
}

function decodeMessageUnsafe(buf) {
  if (buf.length < 12) throw new DnsFormatError('mensagem menor que o cabeçalho (12 bytes)');
  const flags = buf.readUInt16BE(2);
  const qd = buf.readUInt16BE(4);
  const an = buf.readUInt16BE(6);
  const ns = buf.readUInt16BE(8);
  const ar = buf.readUInt16BE(10);
  // proteção: cada pergunta ocupa >= 5 bytes e cada registro >= 11
  if (qd * 5 + (an + ns + ar) * 11 > buf.length - 12) {
    throw new DnsFormatError('contagens do cabeçalho maiores que o pacote');
  }
  let offset = 12;
  const questions = [];
  for (let i = 0; i < qd; i++) {
    const n = decodeName(buf, offset, true); // preserva maiúsculas/minúsculas da pergunta
    offset = n.offset;
    if (offset + 4 > buf.length) throw new DnsFormatError('pergunta truncada');
    questions.push({ name: n.name, type: buf.readUInt16BE(offset), class: buf.readUInt16BE(offset + 2) });
    offset += 4;
  }
  const readSection = (count) => {
    const out = [];
    for (let i = 0; i < count; i++) {
      const r = decodeRecord(buf, offset);
      out.push(r.record);
      offset = r.offset;
    }
    return out;
  };
  const answers = readSection(an);
  const authorities = readSection(ns);
  const additionals = readSection(ar);
  return {
    id: buf.readUInt16BE(0),
    qr: !!((flags >> 15) & 1),
    opcode: (flags >> 11) & 0xf,
    aa: !!((flags >> 10) & 1),
    tc: !!((flags >> 9) & 1),
    rd: !!((flags >> 8) & 1),
    ra: !!((flags >> 7) & 1),
    ad: !!((flags >> 5) & 1),
    cd: !!((flags >> 4) & 1),
    rcode: flags & 0xf,
    questions,
    answers,
    authorities,
    additionals,
  };
}

function decodeMessage(buf) {
  try {
    return decodeMessageUnsafe(buf);
  } catch (err) {
    if (err instanceof DnsFormatError) throw err;
    throw new DnsFormatError(`mensagem inválida: ${err.message}`); // ex.: RangeError de leitura
  }
}

// ------------------------------------------------------------------ escrita

class Writer {
  constructor() {
    this.buf = Buffer.alloc(512);
    this.pos = 0;
    this.names = new Map(); // sufixo -> offset (compressão)
  }

  ensure(n) {
    if (this.pos + n > this.buf.length) {
      const bigger = Buffer.alloc(Math.max(this.buf.length * 2, this.pos + n));
      this.buf.copy(bigger, 0, 0, this.pos);
      this.buf = bigger;
    }
  }

  u8(v) {
    this.ensure(1);
    this.buf[this.pos++] = v;
  }

  u16(v) {
    this.ensure(2);
    this.buf.writeUInt16BE(v, this.pos);
    this.pos += 2;
  }

  u32(v) {
    this.ensure(4);
    this.buf.writeUInt32BE(v, this.pos);
    this.pos += 4;
  }

  bytes(b) {
    this.ensure(b.length);
    b.copy(this.buf, this.pos);
    this.pos += b.length;
  }

  writeName(name, compress = true) {
    // Mantém a caixa original no fio (clientes com randomização 0x20 esperam o eco exato);
    // a chave de compressão é minúscula porque nomes DNS não diferenciam caixa.
    const n = String(name).trim().replace(/\.$/, '');
    const labels = n === '' ? [] : n.split('.');
    if (n.length > 253) throw new Error(`nome longo demais: ${n}`);
    for (let i = 0; i < labels.length; i++) {
      const suffix = labels.slice(i).join('.').toLowerCase();
      if (compress && this.names.has(suffix)) {
        this.u16(0xc000 | this.names.get(suffix));
        return;
      }
      if (this.pos < 0x3fff) this.names.set(suffix, this.pos);
      const label = Buffer.from(labels[i], 'latin1');
      if (label.length === 0 || label.length > 63) throw new Error(`label inválido em ${n}`);
      this.u8(label.length);
      this.bytes(label);
    }
    this.u8(0);
  }

  writeRdata(r) {
    const d = r.data;
    switch (r.type) {
      case TYPE.A: {
        const parts = String(d).split('.').map(Number);
        if (parts.length !== 4 || parts.some((p) => !Number.isInteger(p) || p < 0 || p > 255)) {
          throw new Error(`IPv4 inválido: ${d}`);
        }
        this.bytes(Buffer.from(parts));
        break;
      }
      case TYPE.AAAA:
        this.bytes(parseIPv6(String(d)));
        break;
      case TYPE.NS:
      case TYPE.CNAME:
      case TYPE.PTR:
        this.writeName(d);
        break;
      case TYPE.MX:
        this.u16(d.preference);
        this.writeName(d.exchange);
        break;
      case TYPE.TXT:
        for (const s of d) {
          const b = Buffer.from(s, 'latin1');
          if (b.length > 255) throw new Error('string TXT maior que 255 bytes');
          this.u8(b.length);
          this.bytes(b);
        }
        break;
      case TYPE.SOA:
        this.writeName(d.mname);
        this.writeName(d.rname);
        this.u32(d.serial);
        this.u32(d.refresh);
        this.u32(d.retry);
        this.u32(d.expire);
        this.u32(d.minimum);
        break;
      default:
        if (!Buffer.isBuffer(d)) throw new Error(`rdata de tipo ${r.type} precisa ser Buffer`);
        this.bytes(d);
    }
  }

  writeRecord(r) {
    this.writeName(r.name);
    this.u16(r.type);
    this.u16(r.class ?? CLASS_IN);
    this.u32(r.ttl ?? 0);
    const lenPos = this.pos;
    this.u16(0);
    const start = this.pos;
    this.writeRdata(r);
    this.buf.writeUInt16BE(this.pos - start, lenPos);
  }

  finish() {
    return Buffer.from(this.buf.subarray(0, this.pos));
  }
}

function encodeMessage(msg) {
  const w = new Writer();
  const questions = msg.questions || [];
  const answers = msg.answers || [];
  const authorities = msg.authorities || [];
  const additionals = msg.additionals || [];
  let flags = 0;
  flags |= (msg.qr ? 1 : 0) << 15;
  flags |= ((msg.opcode || 0) & 0xf) << 11;
  flags |= (msg.aa ? 1 : 0) << 10;
  flags |= (msg.tc ? 1 : 0) << 9;
  flags |= (msg.rd ? 1 : 0) << 8;
  flags |= (msg.ra ? 1 : 0) << 7;
  flags |= (msg.ad ? 1 : 0) << 5;
  flags |= (msg.cd ? 1 : 0) << 4;
  flags |= (msg.rcode || 0) & 0xf;
  w.u16(msg.id & 0xffff);
  w.u16(flags);
  w.u16(questions.length);
  w.u16(answers.length);
  w.u16(authorities.length);
  w.u16(additionals.length);
  for (const q of questions) {
    w.writeName(q.name);
    w.u16(q.type);
    w.u16(q.class ?? CLASS_IN);
  }
  for (const r of answers) w.writeRecord(r);
  for (const r of authorities) w.writeRecord(r);
  for (const r of additionals) w.writeRecord(r);
  return w.finish();
}

// Codifica respeitando um tamanho máximo (UDP). Se não couber: primeiro descarta
// a seção adicional; se ainda não couber, devolve só a pergunta com o bit TC.
function encodeForTransport(msg, maxSize) {
  let wire = encodeMessage(msg);
  if (wire.length <= maxSize) return wire;
  const opt = (msg.additionals || []).filter((r) => r.type === TYPE.OPT);
  wire = encodeMessage({ ...msg, additionals: opt });
  if (wire.length <= maxSize) return wire;
  return encodeMessage({ ...msg, tc: true, answers: [], authorities: [], additionals: opt });
}

function makeOpt(udpSize) {
  return { name: '', type: TYPE.OPT, class: udpSize, ttl: 0, data: Buffer.alloc(0) };
}

// Tamanho de payload UDP anunciado pelo cliente via EDNS0, ou null se não houver OPT.
function getEdnsSize(msg) {
  const opt = (msg.additionals || []).find((r) => r.type === TYPE.OPT);
  return opt ? opt.class : null;
}

function buildQuery({ id = randomId(), name, type, rd = false, udpSize = 1232 }) {
  return {
    id,
    qr: false,
    opcode: 0,
    aa: false,
    tc: false,
    rd,
    ra: false,
    ad: false,
    cd: false,
    rcode: 0,
    questions: [{ name, type, class: CLASS_IN }],
    answers: [],
    authorities: [],
    additionals: udpSize ? [makeOpt(udpSize)] : [],
  };
}

module.exports = {
  TYPE,
  RCODE,
  RCODE_NAME,
  CLASS_IN,
  DnsFormatError,
  typeFromString,
  typeToString,
  normalizeName,
  isSubdomain,
  randomId,
  formatIPv6,
  parseIPv6,
  decodeName,
  decodeMessage,
  encodeMessage,
  encodeForTransport,
  makeOpt,
  getEdnsSize,
  buildQuery,
};
