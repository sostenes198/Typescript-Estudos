#!/usr/bin/env node
'use strict';

// Terminador TLS para desenvolvimento: recebe HTTPS e repassa para um servidor HTTP local.
// Serve para dar HTTPS a front-ends que só falam HTTP (ex.: `flutter run -d web-server --web-port=5555`).
//
//   node src/tls-proxy.js --cert cert.pem --key key.pem [--listen 443] [--target 5555] [--host 127.0.0.1]
//                         [--rewrite-host] [--verbose]
//
//   --cert/--key     certificado e chave (ex.: gerados pelo mkcert)
//   --listen         porta HTTPS onde escutar (padrão 443; portas < 1024 podem exigir sudo)
//   --host           endereço onde escutar (padrão 127.0.0.1: só esta máquina)
//   --target         porta ou host:porta do servidor HTTP de destino (padrão 5555)
//   --rewrite-host   troca o cabeçalho Host pelo do destino (por padrão mantém o original)
//   --verbose        loga todas as requisições (por padrão só erros e upgrades)
//
// Repassa requisições normais, respostas em streaming (SSE) e upgrades (WebSocket).

const fs = require('node:fs');
const http = require('node:http');
const https = require('node:https');
const net = require('node:net');

// cabeçalhos "hop-by-hop" não devem ser repassados em respostas normais
const HOP_BY_HOP = new Set(['connection', 'keep-alive', 'proxy-connection', 'transfer-encoding', 'te', 'trailer', 'upgrade']);

function parseTarget(value) {
  const text = String(value);
  if (/^\d+$/.test(text)) return { host: 'localhost', port: Number(text) };
  const idx = text.lastIndexOf(':');
  if (idx > 0 && /^\d+$/.test(text.slice(idx + 1))) return { host: text.slice(0, idx), port: Number(text.slice(idx + 1)) };
  throw new Error(`destino inválido: "${value}" (use 5555 ou host:5555)`);
}

function createTlsProxy({ cert, key, target, rewriteHost = false, log = () => {}, verbose = false }) {
  const targetHost = `${target.host}:${target.port}`;
  const server = https.createServer({ cert, key });

  server.on('request', (req, res) => {
    const headers = { ...req.headers };
    headers['x-forwarded-proto'] = 'https';
    headers['x-forwarded-host'] = req.headers.host || '';
    headers['x-forwarded-for'] = req.socket.remoteAddress || '';
    if (rewriteHost) headers.host = targetHost;

    // autoSelectFamily: "localhost" pode ser ::1 ou 127.0.0.1 conforme o sistema; tenta os dois (Node >= 18.13)
    const upstream = http.request({ host: target.host, port: target.port, method: req.method, path: req.url, headers, autoSelectFamily: true }, (upRes) => {
      const out = {};
      for (const [name, value] of Object.entries(upRes.headers)) {
        if (!HOP_BY_HOP.has(name)) out[name] = value;
      }
      res.writeHead(upRes.statusCode, upRes.statusMessage, out);
      upRes.pipe(res);
      if (verbose || upRes.statusCode >= 400) log(`${req.method} ${req.url.split('?')[0]} -> ${upRes.statusCode}`);
    });

    upstream.on('error', (err) => {
      log(`${req.method} ${req.url.split('?')[0]} -> 502 (${err.code || err.message})`);
      if (res.headersSent) return res.destroy();
      res.writeHead(502, { 'content-type': 'text/plain; charset=utf-8' });
      res.end(`502: não foi possível falar com ${targetHost} (${err.code || err.message}).\nO front está rodando nessa porta?\n`);
    });
    // se o navegador desistir, não deixa a conexão com o destino aberta
    res.on('close', () => {
      if (!res.writableFinished) upstream.destroy();
    });
    req.pipe(upstream);
  });

  // WebSocket e outros upgrades: reescreve o pedido original e liga os dois sockets
  server.on('upgrade', (req, socket, head) => {
    const upstream = net.connect({ port: target.port, host: target.host, autoSelectFamily: true }, () => {
      const lines = [`${req.method} ${req.url} HTTP/${req.httpVersion}`];
      for (let i = 0; i < req.rawHeaders.length; i += 2) {
        const name = req.rawHeaders[i];
        const value = rewriteHost && name.toLowerCase() === 'host' ? targetHost : req.rawHeaders[i + 1];
        lines.push(`${name}: ${value}`);
      }
      upstream.write(`${lines.join('\r\n')}\r\n\r\n`);
      if (head && head.length) upstream.write(head);
      upstream.pipe(socket);
      socket.pipe(upstream);
      if (verbose) log(`UPGRADE ${req.url.split('?')[0]}`);
    });
    const close = () => {
      upstream.destroy();
      socket.destroy();
    };
    upstream.on('error', (err) => {
      log(`UPGRADE ${req.url.split('?')[0]} -> falhou (${err.code || err.message})`);
      close();
    });
    socket.on('error', close);
    upstream.on('close', close);
    socket.on('close', close);
  });

  // o navegador recusou o certificado (ou o handshake falhou)
  server.on('tlsClientError', (err) => log(`falha no handshake TLS: ${err.code || err.message}`));
  return server;
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--cert') args.cert = argv[++i];
    else if (a === '--key') args.key = argv[++i];
    else if (a === '--listen') args.listen = argv[++i];
    else if (a === '--host') args.host = argv[++i];
    else if (a === '--target') args.target = argv[++i];
    else if (a === '--rewrite-host') args.rewriteHost = true;
    else if (a === '--verbose') args.verbose = true;
    else if (a === '-h' || a === '--help') args.help = true;
    else throw new Error(`argumento desconhecido: ${a}`);
  }
  return args;
}

function main() {
  const usage = 'uso: node src/tls-proxy.js --cert cert.pem --key key.pem [--listen 443] [--target 5555] [--host 127.0.0.1] [--rewrite-host] [--verbose]';
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (err) {
    console.error(`${err.message}\n${usage}`);
    process.exit(2);
  }
  if (args.help || !args.cert || !args.key) {
    console.error(usage);
    process.exit(args.help ? 0 : 2);
  }

  let cert;
  let key;
  let target;
  try {
    cert = fs.readFileSync(args.cert);
    key = fs.readFileSync(args.key);
    target = parseTarget(args.target || 5555);
  } catch (err) {
    console.error(`erro: ${err.message}`);
    process.exit(1);
  }

  const port = Number(args.listen || 443);
  const host = args.host || '127.0.0.1';
  const stamp = () => new Date().toISOString().slice(11, 19);
  const server = createTlsProxy({
    cert,
    key,
    target,
    rewriteHost: !!args.rewriteHost,
    verbose: !!args.verbose,
    log: (msg) => console.log(stamp(), msg),
  });

  server.on('error', (err) => {
    if (err.code === 'EACCES') console.error(`sem permissão para a porta ${port}. Portas < 1024 exigem privilégio: rode com sudo (veja o README).`);
    else if (err.code === 'EADDRINUSE') console.error(`a porta ${port} já está em uso (outro servidor ou um tls-proxy anterior).`);
    else console.error(err);
    process.exit(1);
  });
  server.listen(port, host, () => {
    console.log(`tls-proxy: https://${host}:${port}  ->  http://${target.host}:${target.port}   (Ctrl-C para parar)`);
  });
  process.on('SIGINT', () => process.exit(0));
}

if (require.main === module) main();

module.exports = { createTlsProxy, parseTarget };
