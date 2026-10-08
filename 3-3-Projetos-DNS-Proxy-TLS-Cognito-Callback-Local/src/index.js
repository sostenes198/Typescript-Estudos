#!/usr/bin/env node
'use strict';

// Ponto de entrada do servidor DNS.
//   node src/index.js [--host 127.0.0.1] [--port 5300] [--zone zones.json] [--trace]
// Também aceita DNS_HOST, DNS_PORT, DNS_ZONE e DNS_TRACE=1 por variável de ambiente.
// Se existir ./zones.json, ele é carregado automaticamente (e recarregado ao ser salvo).

const fs = require('node:fs');
const { Resolver } = require('./resolver');
const { DnsServer } = require('./server');
const { LocalZone } = require('./local-zone');

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--trace') args.trace = true;
    else if (a === '--host') args.host = argv[++i];
    else if (a === '--port') args.port = argv[++i];
    else if (a === '--zone') args.zone = argv[++i];
    else if (a === '-h' || a === '--help') args.help = true;
    else {
      console.error(`argumento desconhecido: ${a}`);
      process.exit(2);
    }
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));
if (args.help) {
  console.log('uso: node src/index.js [--host 127.0.0.1] [--port 5300] [--zone zones.json] [--trace]');
  process.exit(0);
}

const host = args.host || process.env.DNS_HOST || '127.0.0.1';
const port = Number(args.port || process.env.DNS_PORT || 5300);
const trace = args.trace || process.env.DNS_TRACE === '1';
const explicitZone = args.zone || process.env.DNS_ZONE;
const zonePath = explicitZone || (fs.existsSync('zones.json') ? 'zones.json' : null);

const stamp = () => new Date().toISOString().slice(11, 19);
const log = (msg) => console.log(`${stamp()} ${msg}`);

// Zona local: sempre existe (traz localhost e os TLDs reservados); o arquivo é opcional.
let localZone;
try {
  localZone = zonePath ? LocalZone.fromFile(zonePath) : new LocalZone({});
} catch (err) {
  console.error(`zona local inválida: ${err.message}`);
  process.exit(1);
}

const resolver = new Resolver({
  localZone,
  log: trace ? (msg) => console.log(`${stamp()}     ${msg}`) : undefined,
});
const server = new DnsServer({ resolver, host, port, log });

function describeZone(prefix) {
  log(`${prefix}: ${zonePath} (${localZone.size} nomes)`);
  for (const line of localZone.describe()) log(`    ${line.replace(/\t/g, '  ')}`);
}

server
  .start()
  .then(({ host: h, port: p }) => {
    log(`servidor DNS recursivo ouvindo em ${h}:${p} (UDP+TCP)${trace ? ' [trace ligado]' : ''}`);
    if (zonePath) {
      describeZone('zona local carregada');
      // recarrega ao salvar; se o arquivo estiver inválido, mantém a versão anterior
      fs.watchFile(zonePath, { interval: 500 }, () => {
        try {
          localZone.reloadFile(zonePath);
          describeZone('zona local recarregada');
        } catch (err) {
          log(`zona local NÃO recarregada (mantendo a anterior): ${err.message}`);
        }
      });
    } else {
      log('sem zones.json: apenas localhost e os TLDs reservados (.test/.invalid/.example) são locais');
    }
    log(`teste: dig @${h} -p ${p} example.com   |   npm run query -- example.com`);
  })
  .catch((err) => {
    if (err.code === 'EACCES') console.error(`sem permissão para a porta ${port} (portas < 1024 exigem root). Use --port 5300.`);
    else if (err.code === 'EADDRINUSE') console.error(`a porta ${port} já está em uso. Use --port com outro valor.`);
    else console.error(err);
    process.exit(1);
  });

process.on('SIGINT', () => {
  log('encerrando...');
  server.stop().then(() => process.exit(0));
});
