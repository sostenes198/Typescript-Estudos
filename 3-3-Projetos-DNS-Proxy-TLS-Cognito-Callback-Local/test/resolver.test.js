'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { Resolver } = require('../src/resolver');
const { DnsCache } = require('../src/cache');
const { TYPE, RCODE } = require('../src/codec');
const {
  buildWorld, ROOT, TLD_COM, TLD_NET, TLD_ORG, AUTH_EXAMPLE, AUTH_OTHER, AUTH_HOSTING, AUTH_ORG,
} = require('./helpers');

function setup(roots = [ROOT]) {
  const net = buildWorld();
  const clock = { t: 1_000_000 };
  const cache = new DnsCache({ now: () => clock.t });
  const resolver = new Resolver({ cache, transport: net, roots, now: () => clock.t });
  return { net, clock, cache, resolver };
}

test('segue root -> TLD -> autoritativo e devolve o IP', async () => {
  const { net, resolver } = setup();
  const r = await resolver.resolve('www.example.com', TYPE.A);
  assert.equal(r.rcode, RCODE.NOERROR);
  assert.deepEqual(r.answers.map((a) => a.data), ['93.184.216.34']);
  assert.deepEqual(net.log.map((l) => l.address), [ROOT, TLD_COM, AUTH_EXAMPLE]);
  assert.equal(r.upstream, 3);
  assert.equal(r.cached, false);
});

test('segunda consulta idêntica sai do cache, sem rede', async () => {
  const { net, resolver } = setup();
  await resolver.resolve('www.example.com', TYPE.A);
  net.clearLog();
  const r = await resolver.resolve('www.example.com', TYPE.A);
  assert.equal(net.log.length, 0);
  assert.equal(r.cached, true);
  assert.equal(r.answers[0].data, '93.184.216.34');
});

test('outro nome da mesma zona vai direto ao autoritativo (NS/glue em cache)', async () => {
  const { net, resolver } = setup();
  await resolver.resolve('www.example.com', TYPE.A);
  net.clearLog();
  const r = await resolver.resolve('mail.example.com', TYPE.A);
  assert.deepEqual(net.log.map((l) => l.address), [AUTH_EXAMPLE]);
  assert.equal(r.answers[0].data, '93.184.216.35');
});

test('outro domínio do mesmo TLD pula o root e começa no servidor do .com', async () => {
  const { net, resolver } = setup();
  await resolver.resolve('www.example.com', TYPE.A);
  net.clearLog();
  await resolver.resolve('other.com', TYPE.A);
  assert.deepEqual(net.log.map((l) => l.address), [TLD_COM, AUTH_OTHER]);
});

test('o TTL manda: depois de expirar o registro é buscado de novo, mas o NS segue em cache', async () => {
  const { net, clock, resolver } = setup();
  await resolver.resolve('www.example.com', TYPE.A);
  clock.t += 100_000; // 100s: ainda vale, com TTL decrescendo
  const mid = await resolver.resolve('www.example.com', TYPE.A);
  assert.equal(mid.cached, true);
  assert.equal(mid.answers[0].ttl, 200);
  clock.t += 201_000; // passou dos 300s
  net.clearLog();
  const r = await resolver.resolve('www.example.com', TYPE.A);
  assert.deepEqual(net.log.map((l) => l.address), [AUTH_EXAMPLE]);
  assert.equal(r.answers[0].ttl, 300);
});

test('NXDOMAIN: devolve SOA e entra no cache negativo até o TTL acabar', async () => {
  const { net, clock, resolver } = setup();
  const r1 = await resolver.resolve('nonexistent.example.com', TYPE.A);
  assert.equal(r1.rcode, RCODE.NXDOMAIN);
  assert.equal(r1.authority[0].type, TYPE.SOA);
  net.clearLog();
  const r2 = await resolver.resolve('nonexistent.example.com', TYPE.MX); // NXDOMAIN vale p/ qualquer tipo
  assert.equal(r2.rcode, RCODE.NXDOMAIN);
  assert.equal(net.log.length, 0);
  clock.t += 61_000; // minimum do SOA = 60
  await resolver.resolve('nonexistent.example.com', TYPE.A);
  assert.equal(net.log.length, 1);
});

test('NODATA: nome existe, tipo não; fica em cache só para aquele tipo', async () => {
  const { net, resolver } = setup();
  const r = await resolver.resolve('www.example.com', TYPE.AAAA);
  assert.equal(r.rcode, RCODE.NOERROR);
  assert.equal(r.answers.length, 0);
  assert.equal(r.authority[0].type, TYPE.SOA);
  net.clearLog();
  await resolver.resolve('www.example.com', TYPE.AAAA);
  assert.equal(net.log.length, 0);
  const a = await resolver.resolve('www.example.com', TYPE.A); // o tipo A continua funcionando
  assert.equal(a.answers.length, 1);
});

test('CNAME na mesma zona: devolve a cadeia e cacheia CNAME e A', async () => {
  const { net, cache, resolver } = setup();
  const r = await resolver.resolve('alias.example.com', TYPE.A);
  assert.deepEqual(r.answers.map((a) => a.type), [TYPE.CNAME, TYPE.A]);
  assert.ok(cache.getRecords('alias.example.com', TYPE.CNAME));
  net.clearLog();
  const again = await resolver.resolve('alias.example.com', TYPE.A);
  assert.equal(net.log.length, 0);
  assert.deepEqual(again.answers.map((a) => a.type), [TYPE.CNAME, TYPE.A]);
});

test('CNAME para outra zona: o resolver segue o alvo por conta própria', async () => {
  const { resolver } = setup();
  const r = await resolver.resolve('cdn.example.com', TYPE.A);
  assert.equal(r.rcode, RCODE.NOERROR);
  assert.deepEqual(r.answers.map((a) => [a.name, a.type, a.data]), [
    ['cdn.example.com', TYPE.CNAME, 'edge.other.com'],
    ['edge.other.com', TYPE.A, '198.51.100.7'],
  ]);
});

test('referral sem glue: resolve o nome do servidor de NS antes de continuar', async () => {
  const { net, resolver } = setup();
  const r = await resolver.resolve('www.example.org', TYPE.A);
  assert.equal(r.rcode, RCODE.NOERROR);
  assert.equal(r.answers[0].data, '192.0.2.80');
  const visited = new Set(net.log.map((l) => l.address));
  for (const addr of [ROOT, TLD_ORG, TLD_NET, AUTH_HOSTING, AUTH_ORG]) assert.ok(visited.has(addr), `faltou ${addr}`);
});

test('segurança: glue fora do bailiwick/não citado em NS é ignorado', async () => {
  const { cache, resolver } = setup();
  await resolver.resolve('www.example.com', TYPE.A);
  assert.equal(cache.getRecords('evil.invalid', TYPE.A), null); // root mandou glue forjado
  assert.ok(cache.getRecords('a.gtld-servers.net', TYPE.A)); // o legítimo foi aceito
});

test('segurança: registros alheios na seção de resposta não são cacheados', async () => {
  const { cache, resolver } = setup();
  const r = await resolver.resolve('extra.example.com', TYPE.A);
  assert.deepEqual(r.answers.map((a) => a.data), ['93.184.216.99']);
  assert.equal(cache.getRecords('bank.com', TYPE.A), null);
});

test('segurança: CNAME apontando para outra zona não permite injetar o A de lá', async () => {
  const { resolver } = setup();
  const r = await resolver.resolve('evil.example.com', TYPE.A);
  const final = r.answers.find((a) => a.type === TYPE.A);
  assert.equal(final.data, '1.2.3.4'); // veio do autoritativo de bank.com, não do 6.6.6.6 forjado
  assert.ok(!r.answers.some((a) => a.data === '6.6.6.6'));
});

test('loop de CNAME termina em SERVFAIL (sem travar)', async () => {
  const { resolver } = setup();
  const r = await resolver.resolve('loop1.example.com', TYPE.A);
  assert.equal(r.rcode, RCODE.SERVFAIL);
});

test('servidor que não responde: tenta o próximo', async () => {
  const { resolver } = setup(['10.255.255.1', ROOT]); // o primeiro não existe
  for (let i = 0; i < 5; i++) {
    resolver.cache.clear();
    const r = await resolver.resolve('www.example.com', TYPE.A);
    assert.equal(r.rcode, RCODE.NOERROR);
  }
});

test('todos os servidores mortos: SERVFAIL', async () => {
  const { resolver } = setup(['10.255.255.1', '10.255.255.2']);
  const r = await resolver.resolve('www.example.com', TYPE.A);
  assert.equal(r.rcode, RCODE.SERVFAIL);
});

test('consultas simultâneas idênticas são coalescidas numa só resolução', async () => {
  const { net, resolver } = setup();
  const results = await Promise.all(Array.from({ length: 5 }, () => resolver.resolve('www.example.com', TYPE.A)));
  assert.equal(net.log.length, 3); // e não 15
  for (const r of results) assert.equal(r.answers[0].data, '93.184.216.34');
});

test('limite de consultas upstream protege contra resolução descontrolada', async () => {
  const net = buildWorld();
  const resolver = new Resolver({ transport: net, roots: [ROOT], maxUpstream: 2 });
  const r = await resolver.resolve('www.example.com', TYPE.A); // precisaria de 3
  assert.equal(r.rcode, RCODE.SERVFAIL);
});

test('nome inexistente em TLD: NXDOMAIN vindo do TLD', async () => {
  const { resolver } = setup();
  const r = await resolver.resolve('nada.com', TYPE.A);
  assert.equal(r.rcode, RCODE.NXDOMAIN);
});
