'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  TYPE, DnsFormatError, buildQuery, encodeMessage, decodeMessage, encodeForTransport,
  formatIPv6, parseIPv6, isSubdomain, normalizeName,
} = require('../src/codec');
const { A, NS, CNAME, TXT, SOA, rr, reply } = require('./helpers');

test('codifica uma consulta exatamente como manda a RFC 1035', () => {
  const q = buildQuery({ id: 0x1234, name: 'example.com', type: TYPE.A, rd: true, udpSize: 0 });
  assert.equal(
    encodeMessage(q).toString('hex'),
    '1234' + '0100' + '0001' + '0000' + '0000' + '0000' + // cabeçalho: id, flags (RD), qdcount=1
      '07' + Buffer.from('example').toString('hex') + '03' + Buffer.from('com').toString('hex') + '00' + // QNAME
      '0001' + '0001', // QTYPE=A, QCLASS=IN
  );
});

test('decodifica o que codificou (ida e volta) e usa compressão de nomes', () => {
  const q = buildQuery({ id: 7, name: 'www.example.com', type: TYPE.A });
  const msg = reply(q, {
    aa: true,
    answers: [
      CNAME('www.example.com', 'edge.example.com', 60),
      A('edge.example.com', '10.0.0.1', 60),
      rr('edge.example.com', TYPE.AAAA, '2001:db8::1', 60),
      rr('example.com', TYPE.MX, { preference: 10, exchange: 'mail.example.com' }, 60),
      TXT('example.com', ['v=spf1', 'include:x'], 60),
    ],
    authorities: [NS('example.com', 'ns1.example.com'), SOA('example.com')],
    additionals: [A('ns1.example.com', '10.0.0.53', 60)],
  });
  const wire = encodeMessage(msg);
  assert.ok(wire.includes(0xc0), 'deveria haver ponteiros de compressão');
  const back = decodeMessage(wire);
  assert.equal(back.id, 7);
  assert.equal(back.aa, true);
  assert.deepEqual(back.answers, msg.answers);
  assert.deepEqual(back.authorities, msg.authorities);
  assert.deepEqual(back.additionals, msg.additionals);
  assert.equal(back.questions[0].name, 'www.example.com');
});

test('a pergunta preserva maiúsculas/minúsculas, o resto é normalizado', () => {
  const q = buildQuery({ name: 'WwW.ExAmPlE.com', type: TYPE.A });
  const back = decodeMessage(encodeMessage(q));
  assert.equal(back.questions[0].name, 'WwW.ExAmPlE.com');
});

test('IPv6: formata e interpreta', () => {
  for (const ip of ['2001:db8::1', '::', '::1', 'fe80::1:2', '2001:db8:0:1:1:1:1:1', '1:2:3:4:5:6:7:8']) {
    assert.equal(formatIPv6(parseIPv6(ip)), ip);
  }
  assert.throws(() => parseIPv6('1::2::3'));
  assert.throws(() => parseIPv6('zzzz::1'));
});

test('ponteiro de compressão em loop é rejeitado', () => {
  const header = Buffer.from('000001000001000000000000', 'hex'); // 1 pergunta
  const loop = Buffer.from([0xc0, 0x0c, 0x00, 0x01, 0x00, 0x01]); // nome = ponteiro para si mesmo
  assert.throws(() => decodeMessage(Buffer.concat([header, loop])), DnsFormatError);
});

test('pacote truncado em qualquer ponto lança DnsFormatError (nunca outro erro)', () => {
  const q = buildQuery({ name: 'www.example.com', type: TYPE.A });
  const wire = encodeMessage(reply(q, { aa: true, answers: [A('www.example.com', '1.2.3.4', 60)], authorities: [NS('example.com', 'ns1.example.com')] }));
  for (let i = 0; i < wire.length; i++) {
    assert.throws(() => decodeMessage(wire.subarray(0, i)), DnsFormatError, `corte em ${i}`);
  }
});

test('contagens absurdas no cabeçalho são rejeitadas', () => {
  const evil = Buffer.from('0000800000000000ffff0000', 'hex'); // ancount = 65535 sem dados
  assert.throws(() => decodeMessage(evil), DnsFormatError);
});

test('encodeForTransport: descarta adicionais e depois marca TC', () => {
  const q = buildQuery({ name: 'big.example.com', type: TYPE.TXT, udpSize: 0 });
  const answers = Array.from({ length: 30 }, (_, i) => TXT('big.example.com', [`${i}-${'x'.repeat(100)}`], 60));
  const msg = reply(q, { aa: true, answers });
  assert.ok(encodeMessage(msg).length > 512);
  const wire = encodeForTransport(msg, 512);
  const back = decodeMessage(wire);
  assert.equal(back.tc, true);
  assert.equal(back.answers.length, 0);
  assert.equal(back.questions[0].name, 'big.example.com');
  assert.ok(wire.length <= 512);
});

test('helpers de nome', () => {
  assert.equal(normalizeName('WWW.Example.COM.'), 'www.example.com');
  assert.equal(normalizeName('.'), '');
  assert.ok(isSubdomain('a.b.example.com', 'example.com'));
  assert.ok(isSubdomain('example.com', 'example.com'));
  assert.ok(!isSubdomain('badexample.com', 'example.com'));
  assert.ok(isSubdomain('qualquer.coisa', ''));
});
