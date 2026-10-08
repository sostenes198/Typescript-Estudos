'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { LocalZone, LocalZoneError } = require('../src/local-zone');
const { Resolver } = require('../src/resolver');
const { DnsServer } = require('../src/server');
const { query } = require('../src/transport');
const { TYPE, RCODE, buildQuery } = require('../src/codec');
const { buildWorld, ROOT } = require('./helpers');

const CONFIG = {
  'callback.test': { A: '127.0.0.1' },
  '*.hooks.test': { A: ['127.0.0.1', '127.0.0.2'], ttl: 10 },
  'api.callback.test': { CNAME: 'callback.test' },
  'v6.test': { A: '127.0.0.1', AAAA: '::1', TXT: 'dev', MX: '10 mail.v6.test' },
  'ext.test': { CNAME: 'www.example.com' }, // alvo na "internet"
  'loop-a.test': { CNAME: 'loop-b.test' },
  'loop-b.test': { CNAME: 'loop-a.test' },
  'mail.example.com': { A: '127.0.0.1' }, // sobrescreve um nome que existe na "internet"
};

function setup(config = CONFIG) {
  const net = buildWorld();
  const zone = new LocalZone(config);
  const resolver = new Resolver({ transport: net, roots: [ROOT], localZone: zone });
  return { net, zone, resolver };
}

test('nome exato é respondido localmente, sem tocar na rede', async () => {
  const { net, resolver } = setup();
  const r = await resolver.resolve('callback.test', TYPE.A);
  assert.equal(r.rcode, RCODE.NOERROR);
  assert.deepEqual(r.answers.map((a) => a.data), ['127.0.0.1']);
  assert.equal(r.answers[0].ttl, 30); // padrão
  assert.equal(r.local, true);
  assert.equal(r.cached, false);
  assert.equal(net.log.length, 0);
});

test('curinga casa com qualquer profundidade, usa o nome perguntado como dono e respeita o ttl', async () => {
  const { resolver } = setup();
  const r = await resolver.resolve('X.y.hooks.test', TYPE.A);
  assert.deepEqual(r.answers.map((a) => [a.name, a.data, a.ttl]), [
    ['x.y.hooks.test', '127.0.0.1', 10],
    ['x.y.hooks.test', '127.0.0.2', 10],
  ]);
});

test('o curinga não casa com o próprio apex', async () => {
  const { resolver } = setup();
  const r = await resolver.resolve('hooks.test', TYPE.A);
  assert.equal(r.rcode, RCODE.NXDOMAIN); // .test é reservado: NXDOMAIN local
});

test('nome definido sem o tipo pedido => NODATA com SOA', async () => {
  const { resolver } = setup();
  const r = await resolver.resolve('callback.test', TYPE.AAAA);
  assert.equal(r.rcode, RCODE.NOERROR);
  assert.equal(r.answers.length, 0);
  assert.equal(r.authority[0].type, TYPE.SOA);
  assert.equal(r.local, true);
});

test('CNAME local para nome local: devolve a cadeia sem usar a rede', async () => {
  const { net, resolver } = setup();
  const r = await resolver.resolve('api.callback.test', TYPE.A);
  assert.deepEqual(r.answers.map((a) => [a.type, a.data]), [[TYPE.CNAME, 'callback.test'], [TYPE.A, '127.0.0.1']]);
  assert.equal(r.local, true);
  assert.equal(net.log.length, 0);
});

test('CNAME local para nome externo: segue pela internet e a resposta deixa de ser "local"', async () => {
  const { resolver } = setup();
  const r = await resolver.resolve('ext.test', TYPE.A);
  assert.deepEqual(r.answers.map((a) => [a.type, a.data]), [[TYPE.CNAME, 'www.example.com'], [TYPE.A, '93.184.216.34']]);
  assert.equal(r.local, false);
  assert.equal(r.upstream, 3);
});

test('perguntar o tipo CNAME devolve só o alias, sem seguir', async () => {
  const { resolver } = setup();
  const r = await resolver.resolve('api.callback.test', TYPE.CNAME);
  assert.deepEqual(r.answers.map((a) => [a.type, a.data]), [[TYPE.CNAME, 'callback.test']]);
});

test('AAAA, TXT e MX', async () => {
  const { resolver } = setup();
  assert.equal((await resolver.resolve('v6.test', TYPE.AAAA)).answers[0].data, '::1');
  assert.deepEqual((await resolver.resolve('v6.test', TYPE.TXT)).answers[0].data, ['dev']);
  assert.deepEqual((await resolver.resolve('v6.test', TYPE.MX)).answers[0].data, { preference: 10, exchange: 'mail.v6.test' });
});

test('localhost e *.localhost apontam para o loopback; a configuração pode sobrescrever', async () => {
  const { resolver } = setup();
  assert.equal((await resolver.resolve('app.localhost', TYPE.A)).answers[0].data, '127.0.0.1');
  assert.equal((await resolver.resolve('app.localhost', TYPE.AAAA)).answers[0].data, '::1');

  const over = setup({ localhost: { A: '127.0.0.9' } });
  assert.equal((await over.resolver.resolve('localhost', TYPE.A)).answers[0].data, '127.0.0.9');
});

test('nomes sob .test/.invalid/.example não definidos => NXDOMAIN local, sem consultar os root servers', async () => {
  const { net, resolver } = setup();
  for (const name of ['qualquer.test', 'x.invalid', 'foo.example']) {
    const r = await resolver.resolve(name, TYPE.A);
    assert.equal(r.rcode, RCODE.NXDOMAIN, name);
    assert.equal(r.authority[0].type, TYPE.SOA);
    assert.equal(r.local, true);
  }
  assert.equal(net.log.length, 0);
});

test('a zona local tem precedência sobre a internet', async () => {
  const { net, resolver } = setup();
  const r = await resolver.resolve('mail.example.com', TYPE.A); // na internet falsa seria 93.184.216.35
  assert.equal(r.answers[0].data, '127.0.0.1');
  assert.equal(net.log.length, 0);
  const other = await resolver.resolve('www.example.com', TYPE.A); // fora da zona local: normal
  assert.equal(other.answers[0].data, '93.184.216.34');
  assert.equal(other.local, false);
});

test('alias local em loop termina em SERVFAIL', async () => {
  const { resolver } = setup();
  const r = await resolver.resolve('loop-a.test', TYPE.A);
  assert.equal(r.rcode, RCODE.SERVFAIL);
});

test('configuração inválida é rejeitada com mensagem clara', () => {
  const bad = [
    { x: { A: '999.1.1.1' } },
    { x: { A: '1.1.1.1', CNAME: 'y.test' } },
    { x: { MX: 'abc' } },
    { x: { FOO: '1' } },
    { 'a.*.test': { A: '1.1.1.1' } },
    { x: { A: '1.1.1.1', ttl: -1 } },
    { x: {} },
    { x: '1.1.1.1' },
    { x: { AAAA: 'zzzz' } },
    { x: { CNAME: ['a.test', 'b.test'] } },
    [],
  ];
  for (const cfg of bad) assert.throws(() => new LocalZone(cfg), LocalZoneError, JSON.stringify(cfg));
});

test('load() é atômico: configuração inválida não derruba a anterior', () => {
  const zone = new LocalZone({ 'a.test': { A: '1.1.1.1' } });
  assert.throws(() => zone.load({ 'b.test': { A: 'invalido' } }), LocalZoneError);
  assert.equal(zone.lookup('a.test', TYPE.A).records[0].data, '1.1.1.1');
  zone.load({ 'b.test': { A: '2.2.2.2' } }); // e uma configuração válida substitui por inteiro
  assert.equal(zone.lookup('a.test', TYPE.A).kind, 'nxdomain'); // sumiu; .test é reservado => NXDOMAIN local
  assert.equal(zone.lookup('b.test', TYPE.A).records[0].data, '2.2.2.2');
});

test('o zones.json que acompanha o projeto é válido e funciona', () => {
  const zone = LocalZone.fromFile(path.join(__dirname, '..', 'zones.json'));
  assert.equal(zone.lookup('callback.test', TYPE.A).records[0].data, '127.0.0.1');
  assert.equal(zone.lookup('qualquer.hooks.test', TYPE.A).records[0].data, '127.0.0.1');
  assert.ok(zone.describe().some((l) => l.startsWith('callback.test')));
});

test('servidor: respostas locais saem com aa=1 e as da internet com aa=0', async () => {
  const { resolver } = setup();
  const server = new DnsServer({ resolver, host: '127.0.0.1', port: 0 });
  const { port } = await server.start();
  try {
    const target = { address: '127.0.0.1', port };
    const local = await query(target, buildQuery({ name: 'callback.test', type: TYPE.A, rd: true }));
    assert.equal(local.aa, true);
    assert.equal(local.answers[0].data, '127.0.0.1');
    const remote = await query(target, buildQuery({ name: 'www.example.com', type: TYPE.A, rd: true }));
    assert.equal(remote.aa, false);
    assert.equal(remote.answers[0].data, '93.184.216.34');
    const nx = await query(target, buildQuery({ name: 'nada.test', type: TYPE.A, rd: true }));
    assert.equal(nx.rcode, RCODE.NXDOMAIN);
    assert.equal(nx.aa, true);
  } finally {
    await server.stop();
  }
});
