'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { DnsCache } = require('../src/cache');
const { TYPE } = require('../src/codec');
const { A, SOA } = require('./helpers');

function makeCache(opts = {}) {
  const clock = { t: 1_000_000 };
  const cache = new DnsCache({ now: () => clock.t, ...opts });
  return { cache, clock };
}

test('devolve o TTL restante e expira junto com o menor TTL do RRset', () => {
  const { cache, clock } = makeCache();
  cache.setRecords('a.com', TYPE.A, [A('a.com', '1.1.1.1', 300), A('a.com', '1.1.1.2', 100)]);
  assert.equal(cache.getRecords('a.com', TYPE.A)[0].ttl, 100);
  clock.t += 40_000;
  assert.equal(cache.getRecords('a.com', TYPE.A)[0].ttl, 60);
  clock.t += 60_000;
  assert.equal(cache.getRecords('a.com', TYPE.A), null);
});

test('TTL 0 não é guardado; maxTtl limita TTLs enormes', () => {
  const { cache, clock } = makeCache({ maxTtl: 10 });
  cache.setRecords('zero.com', TYPE.A, [A('zero.com', '1.1.1.1', 0)]);
  assert.equal(cache.getRecords('zero.com', TYPE.A), null);
  cache.setRecords('big.com', TYPE.A, [A('big.com', '1.1.1.1', 999999)]);
  clock.t += 11_000;
  assert.equal(cache.getRecords('big.com', TYPE.A), null);
});

test('cache negativo: NXDOMAIN vale para qualquer tipo, NODATA só para o tipo', () => {
  const { cache, clock } = makeCache();
  cache.setNegative('nao.existe.com', '*', 3, SOA('com', 900, 60)); // TTL = min(900, 60) = 60
  assert.equal(cache.getNegative('nao.existe.com', TYPE.A).rcode, 3);
  assert.equal(cache.getNegative('nao.existe.com', TYPE.MX).rcode, 3);

  cache.setNegative('so-v4.com', TYPE.AAAA, 0, SOA('so-v4.com', 300, 300));
  assert.equal(cache.getNegative('so-v4.com', TYPE.AAAA).rcode, 0);
  assert.equal(cache.getNegative('so-v4.com', TYPE.A), null);

  clock.t += 61_000;
  assert.equal(cache.getNegative('nao.existe.com', TYPE.A), null);
  assert.ok(cache.getNegative('so-v4.com', TYPE.AAAA));
});

test('sem SOA não há cache negativo', () => {
  const { cache } = makeCache();
  cache.setNegative('x.com', '*', 3, undefined);
  assert.equal(cache.getNegative('x.com', TYPE.A), null);
});

test('limite de entradas remove as mais antigas', () => {
  const { cache } = makeCache({ maxEntries: 3 });
  for (const n of ['a', 'b', 'c', 'd']) cache.setRecords(`${n}.com`, TYPE.A, [A(`${n}.com`, '1.1.1.1', 300)]);
  assert.equal(cache.size, 3);
  assert.equal(cache.getRecords('a.com', TYPE.A), null);
  assert.ok(cache.getRecords('d.com', TYPE.A));
});

test('prune remove expirados', () => {
  const { cache, clock } = makeCache();
  cache.setRecords('a.com', TYPE.A, [A('a.com', '1.1.1.1', 10)]);
  cache.setRecords('b.com', TYPE.A, [A('b.com', '1.1.1.1', 1000)]);
  clock.t += 20_000;
  cache.prune();
  assert.equal(cache.size, 1);
});
