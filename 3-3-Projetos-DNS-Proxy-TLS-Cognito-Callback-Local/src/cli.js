#!/usr/bin/env node
'use strict';

// Mini "dig" para testar o servidor sem depender de ferramentas externas.
//   node src/cli.js example.com [A|AAAA|MX|TXT|NS|CNAME|SOA] [--server 127.0.0.1:5300]

const { query } = require('./transport');
const { buildQuery, typeFromString, typeToString, RCODE_NAME, TYPE } = require('./codec');

function formatData(r) {
  switch (r.type) {
    case TYPE.MX:
      return `${r.data.preference} ${r.data.exchange}.`;
    case TYPE.TXT:
      return r.data.map((s) => `"${Buffer.from(s, 'latin1').toString('utf8')}"`).join(' ');
    case TYPE.SOA: {
      const d = r.data;
      return `${d.mname}. ${d.rname}. ${d.serial} ${d.refresh} ${d.retry} ${d.expire} ${d.minimum}`;
    }
    case TYPE.NS:
    case TYPE.CNAME:
    case TYPE.PTR:
      return `${r.data}.`;
    case TYPE.A:
    case TYPE.AAAA:
      return r.data;
    default:
      return Buffer.isBuffer(r.data) ? `\\# ${r.data.length} ${r.data.toString('hex')}` : String(r.data);
  }
}

function printSection(title, records) {
  if (!records.length) return;
  console.log(`\n;; ${title}`);
  for (const r of records) {
    console.log(`${(r.name || '.') + (r.name ? '.' : '')}\t${r.ttl}\tIN\t${typeToString(r.type)}\t${formatData(r)}`);
  }
}

async function main() {
  const argv = process.argv.slice(2);
  let serverArg = process.env.DNS_SERVER || '127.0.0.1:5300';
  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--server') serverArg = argv[++i];
    else positional.push(argv[i]);
  }
  if (!positional.length) {
    console.error('uso: node src/cli.js <nome> [tipo] [--server host:porta]');
    process.exit(2);
  }
  const [name, typeArg = 'A'] = positional;
  const [host, port = '53'] = serverArg.split(':');

  const started = Date.now();
  const q = buildQuery({ name, type: typeFromString(typeArg), rd: true });
  const resp = await query({ address: host, port: Number(port) }, q, { timeoutMs: 20000 });

  const flags = ['qr', resp.aa && 'aa', resp.tc && 'tc', resp.rd && 'rd', resp.ra && 'ra'].filter(Boolean).join(' ');
  console.log(`;; status: ${RCODE_NAME[resp.rcode] ?? resp.rcode}, id: ${resp.id}, flags: ${flags}`);
  console.log(`;; QUESTION: ${name} ${typeToString(q.questions[0].type)}`);
  printSection('ANSWER', resp.answers);
  printSection('AUTHORITY', resp.authorities);
  console.log(`\n;; servidor: ${host}:${port}  tempo: ${Date.now() - started} ms`);
}

main().catch((err) => {
  console.error(`erro: ${err.message}`);
  process.exit(1);
});
