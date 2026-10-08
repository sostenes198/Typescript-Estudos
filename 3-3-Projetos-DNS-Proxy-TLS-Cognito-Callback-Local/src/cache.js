'use strict';

// Cache DNS com TTL (RFC 1035) e cache negativo (RFC 2308).
//
// - Positivo: guarda o RRset (todos os registros de um nome+tipo) até o menor TTL expirar.
// - Negativo: guarda NXDOMAIN (nome não existe, vale para todos os tipos) e NODATA
//   (nome existe, mas não tem aquele tipo), usando o TTL do SOA da resposta.
// - Ao ler, o TTL devolvido é o que ainda resta, não o original.

class DnsCache {
  constructor({ maxEntries = 10000, maxTtl = 86400, now = Date.now } = {}) {
    this.map = new Map(); // a ordem de inserção serve de "fila" para remover o mais antigo
    this.maxEntries = maxEntries;
    this.maxTtl = maxTtl;
    this.now = now;
  }

  get size() {
    return this.map.size;
  }

  clear() {
    this.map.clear();
  }

  // Remove entradas expiradas (a leitura já ignora, isto só libera memória).
  prune() {
    const t = this.now();
    for (const [key, entry] of this.map) {
      if (entry.expiresAt <= t) this.map.delete(key);
    }
  }

  _live(key) {
    const entry = this.map.get(key);
    if (!entry) return null;
    if (entry.expiresAt <= this.now()) {
      this.map.delete(key);
      return null;
    }
    return entry;
  }

  _put(key, entry) {
    this.map.delete(key); // reinserir move para o fim da fila
    this.map.set(key, entry);
    while (this.map.size > this.maxEntries) {
      this.map.delete(this.map.keys().next().value);
    }
  }

  _remaining(entry) {
    return Math.max(1, Math.ceil((entry.expiresAt - this.now()) / 1000));
  }

  // ---- positivo

  getRecords(name, type) {
    const entry = this._live(`p|${name}|${type}`);
    if (!entry) return null;
    const ttl = this._remaining(entry);
    return entry.records.map((r) => ({ ...r, ttl }));
  }

  setRecords(name, type, records) {
    if (!records || records.length === 0) return;
    const ttl = Math.min(this.maxTtl, ...records.map((r) => r.ttl));
    if (ttl <= 0) return;
    this._put(`p|${name}|${type}`, { records, expiresAt: this.now() + ttl * 1000 });
  }

  // ---- negativo ("*" = NXDOMAIN, vale para qualquer tipo)

  getNegative(name, type) {
    const entry = this._live(`n|${name}|${type}`) || this._live(`n|${name}|*`);
    if (!entry) return null;
    const ttl = this._remaining(entry);
    return { rcode: entry.rcode, soa: entry.soa ? { ...entry.soa, ttl } : null };
  }

  setNegative(name, type, rcode, soa) {
    if (!soa) return; // sem SOA não há TTL negativo confiável
    const ttl = Math.min(this.maxTtl, soa.ttl, soa.data.minimum);
    if (ttl <= 0) return;
    this._put(`n|${name}|${type}`, { rcode, soa, expiresAt: this.now() + ttl * 1000 });
  }
}

module.exports = { DnsCache };
