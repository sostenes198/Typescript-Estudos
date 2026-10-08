'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { promisify } = require('node:util');
const { DnsServer } = require('../src/server');
const { Resolver } = require('../src/resolver');
const { createDnsLookup } = require('../src/dns-lookup');
const { buildWorld, ROOT } = require('./helpers');

async function withLookup(fn) {
  const resolver = new Resolver({ transport: buildWorld(), roots: [ROOT] });
  const server = new DnsServer({ resolver, host: '127.0.0.1', port: 0 });
  const { port } = await server.start();
  try {
    await fn(createDnsLookup({ server: '127.0.0.1', port, timeoutMs: 3000 }));
  } finally {
    await server.stop();
  }
}

test('lookup { all: true } devolve lista de { address, family } (formato do autoSelectFamily)', async () => {
  await withLookup(async (lookup) => {
    const out = await promisify(lookup)('www.example.com', { all: true });
    assert.deepEqual(out, [{ address: '93.184.216.34', family: 4 }]);
  });
});

test('lookup simples devolve (address, family)', async () => {
  await withLookup(async (lookup) => {
    const out = await new Promise((resolve, reject) =>
      lookup('mail.example.com', {}, (err, address, family) => (err ? reject(err) : resolve({ address, family }))),
    );
    assert.deepEqual(out, { address: '93.184.216.35', family: 4 });
  });
});

test('segue CNAME: o IP final vem do alvo', async () => {
  await withLookup(async (lookup) => {
    const out = await promisify(lookup)('alias.example.com', { all: true });
    assert.deepEqual(out.map((o) => o.address), ['93.184.216.34']);
  });
});

test('nome inexistente vira ENOTFOUND, como no getaddrinfo', async () => {
  await withLookup(async (lookup) => {
    await assert.rejects(promisify(lookup)('nonexistent.example.com', {}), { code: 'ENOTFOUND' });
  });
});

test('IP literal passa direto, sem consultar DNS', async () => {
  const lookup = createDnsLookup({ server: '127.0.0.1', port: 1, timeoutMs: 100 }); // porta sem servidor
  const out = await promisify(lookup)('10.1.2.3', { all: true });
  assert.deepEqual(out, [{ address: '10.1.2.3', family: 4 }]);
});

test('servidor DNS fora do ar: EAI_AGAIN (erro temporário), sem travar', async () => {
  const lookup = createDnsLookup({ server: '127.0.0.1', port: 9, timeoutMs: 300 });
  await assert.rejects(promisify(lookup)('www.example.com', {}), { code: 'EAI_AGAIN' });
});
