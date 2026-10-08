'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const dgram = require('node:dgram');
const net = require('node:net');
const { DnsServer } = require('../src/server');
const { Resolver } = require('../src/resolver');
const { query, queryUdp, queryTcp } = require('../src/transport');
const { TYPE, RCODE, buildQuery, encodeMessage, decodeMessage } = require('../src/codec');
const { buildWorld, ROOT } = require('./helpers');

async function withServer(fn) {
  const resolver = new Resolver({ transport: buildWorld(), roots: [ROOT] });
  const server = new DnsServer({ resolver, host: '127.0.0.1', port: 0 });
  const { port } = await server.start();
  try {
    await fn({ port, target: { address: '127.0.0.1', port }, resolver });
  } finally {
    await server.stop();
  }
}

test('responde A por UDP com RA=1 e o IP correto', async () => {
  await withServer(async ({ target }) => {
    const resp = await query(target, buildQuery({ name: 'www.example.com', type: TYPE.A, rd: true }));
    assert.equal(resp.qr, true);
    assert.equal(resp.ra, true);
    assert.equal(resp.rd, true);
    assert.equal(resp.rcode, RCODE.NOERROR);
    assert.deepEqual(resp.answers.map((a) => a.data), ['93.184.216.34']);
  });
});

test('mantém as maiúsculas/minúsculas da pergunta na resposta', async () => {
  await withServer(async ({ target }) => {
    const q = buildQuery({ name: 'WWW.Example.COM', type: TYPE.A, rd: true });
    const resp = await query(target, q);
    assert.equal(resp.questions[0].name, 'WWW.Example.COM');
    assert.equal(resp.answers.length, 1);
  });
});

test('NXDOMAIN chega ao cliente com o SOA na seção de autoridade', async () => {
  await withServer(async ({ target }) => {
    const resp = await query(target, buildQuery({ name: 'nonexistent.example.com', type: TYPE.A, rd: true }));
    assert.equal(resp.rcode, RCODE.NXDOMAIN);
    assert.equal(resp.authorities[0].type, TYPE.SOA);
  });
});

test('resposta grande: UDP volta truncado (TC) e o TCP traz tudo', async () => {
  await withServer(async ({ target }) => {
    const q = () => buildQuery({ name: 'big.example.com', type: TYPE.TXT, rd: true, udpSize: 0 });
    const udp = await queryUdp(target, q(), 3000);
    assert.equal(udp.tc, true);
    assert.equal(udp.answers.length, 0);
    const tcp = await queryTcp(target, q(), 3000);
    assert.equal(tcp.tc, false);
    assert.equal(tcp.answers.length, 30);
    // o cliente padrão faz essa troca sozinho
    const auto = await query(target, q());
    assert.equal(auto.answers.length, 30);
  });
});

test('TCP aceita várias consultas no mesmo pacote (pipelining)', async () => {
  await withServer(async ({ port }) => {
    const names = ['www.example.com', 'mail.example.com'];
    const frames = names.map((name) => {
      const wire = encodeMessage(buildQuery({ name, type: TYPE.A, rd: true }));
      const f = Buffer.alloc(2 + wire.length);
      f.writeUInt16BE(wire.length, 0);
      wire.copy(f, 2);
      return f;
    });
    const responses = await new Promise((resolve, reject) => {
      const socket = net.createConnection({ host: '127.0.0.1', port });
      let buf = Buffer.alloc(0);
      const out = [];
      socket.on('error', reject);
      socket.on('connect', () => socket.write(Buffer.concat(frames)));
      socket.on('data', (d) => {
        buf = Buffer.concat([buf, d]);
        while (buf.length >= 2 && buf.length >= 2 + buf.readUInt16BE(0)) {
          const len = buf.readUInt16BE(0);
          out.push(decodeMessage(buf.subarray(2, 2 + len)));
          buf = buf.subarray(2 + len);
        }
        if (out.length === 2) {
          socket.destroy();
          resolve(out);
        }
      });
    });
    const got = responses.flatMap((r) => r.answers.map((a) => a.data)).sort();
    assert.deepEqual(got, ['93.184.216.34', '93.184.216.35']);
  });
});

test('ANY recebe NOTIMP; classe CH recebe REFUSED', async () => {
  await withServer(async ({ target }) => {
    const any = await query(target, buildQuery({ name: 'example.com', type: TYPE.ANY, rd: true }));
    assert.equal(any.rcode, RCODE.NOTIMP);
    const q = buildQuery({ name: 'version.bind', type: TYPE.TXT, rd: true });
    q.questions[0].class = 3; // CHAOS
    const ch = await query(target, q);
    assert.equal(ch.rcode, RCODE.REFUSED);
  });
});

test('lixo no pacote: FORMERR com o mesmo ID; pacote minúsculo é ignorado', async () => {
  await withServer(async ({ port }) => {
    const send = (payload, expectReply) =>
      new Promise((resolve) => {
        const s = dgram.createSocket('udp4');
        const timer = setTimeout(() => { s.close(); resolve(null); }, expectReply ? 2000 : 300);
        s.on('message', (m) => { clearTimeout(timer); s.close(); resolve(m); });
        s.send(payload, port, '127.0.0.1');
      });
    const garbage = Buffer.from('abcd0100000500000000000001', 'hex'); // diz ter 5 perguntas, mas não tem
    const reply = await send(garbage, true);
    const msg = decodeMessage(reply);
    assert.equal(msg.id, 0xabcd);
    assert.equal(msg.rcode, RCODE.FORMERR);
    assert.equal(await send(Buffer.from([1]), false), null);
  });
});

test('ignora pacotes que já são respostas (evita loops entre servidores)', async () => {
  await withServer(async ({ port }) => {
    const q = buildQuery({ name: 'www.example.com', type: TYPE.A });
    q.qr = true;
    const got = await new Promise((resolve) => {
      const s = dgram.createSocket('udp4');
      const timer = setTimeout(() => { s.close(); resolve(null); }, 300);
      s.on('message', (m) => { clearTimeout(timer); s.close(); resolve(m); });
      s.send(encodeMessage(q), port, '127.0.0.1');
    });
    assert.equal(got, null);
  });
});
