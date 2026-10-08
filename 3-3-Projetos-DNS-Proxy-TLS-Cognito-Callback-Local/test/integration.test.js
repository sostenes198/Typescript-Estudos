'use strict';

// Testes de integração com sockets reais em loopback (sem a rede falsa em memória).

const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { DnsServer } = require('../src/server');
const { Resolver } = require('../src/resolver');
const { createDnsLookup } = require('../src/dns-lookup');
const { TYPE, RCODE } = require('../src/codec');
const { A, TXT } = require('./helpers');

// "Servidor autoritativo" de mentira: um DnsServer cujo resolver devolve respostas prontas.
function stubResolver(answersFor) {
  return { resolve: async (name, type) => ({ rcode: RCODE.NOERROR, answers: answersFor(name, type), authority: [] }) };
}

test('Resolver fala UDP e TCP reais com um servidor em loopback (TC -> fallback TCP)', async () => {
  const auth = new DnsServer({
    resolver: stubResolver((name, type) =>
      type === TYPE.TXT
        ? Array.from({ length: 30 }, (_, i) => TXT(name, [`${i}-${'y'.repeat(100)}`], 60))
        : [A(name, '192.0.2.1', 60)],
    ),
    host: '127.0.0.1',
    port: 0,
  });
  const { port } = await auth.start();
  try {
    const resolver = new Resolver({ roots: [{ address: '127.0.0.1', port }] }); // transporte REAL
    const a = await resolver.resolve('real.test', TYPE.A);
    assert.equal(a.rcode, RCODE.NOERROR);
    assert.equal(a.answers[0].data, '192.0.2.1');

    const big = await resolver.resolve('big.test', TYPE.TXT); // > 1232 bytes: UDP vem truncado
    assert.equal(big.rcode, RCODE.NOERROR);
    assert.equal(big.answers.length, 30);
  } finally {
    await auth.stop();
  }
});

test('http.request do Node usa o nosso lookup (é assim que o proxy resolve o upstream)', async () => {
  // DNS que responde 127.0.0.1 para qualquer nome
  const dns = new DnsServer({ resolver: stubResolver((name) => [A(name, '127.0.0.1', 60)]), host: '127.0.0.1', port: 0 });
  const { port: dnsPort } = await dns.start();

  const web = http.createServer((req, res) => res.end(`host=${req.headers.host}`));
  await new Promise((resolve) => web.listen(0, '127.0.0.1', resolve));
  const webPort = web.address().port;

  const lookups = [];
  const base = createDnsLookup({ server: '127.0.0.1', port: dnsPort, timeoutMs: 3000, log: (m) => lookups.push(m) });
  try {
    const body = await new Promise((resolve, reject) => {
      const req = http.request({ host: 'upstream.test', port: webPort, path: '/', lookup: base }, (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => resolve(data));
      });
      req.on('error', reject);
      req.end();
    });
    assert.equal(body, `host=upstream.test:${webPort}`);
    assert.ok(lookups.some((l) => l.includes('upstream.test -> 127.0.0.1')), 'o lookup customizado deveria ter sido usado');
  } finally {
    web.close();
    web.closeAllConnections?.();
    await dns.stop();
  }
});
