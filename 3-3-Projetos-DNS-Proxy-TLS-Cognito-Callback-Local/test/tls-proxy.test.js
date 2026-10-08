'use strict';

// Testes do proxy TLS. Precisam do `openssl` para gerar um certificado autoassinado
// (já vem no macOS e no Linux); sem ele, os testes são pulados.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const https = require('node:https');
const path = require('node:path');
const tls = require('node:tls');
const { execFileSync } = require('node:child_process');
const { createTlsProxy, parseTarget } = require('../src/tls-proxy');

const dir = fs.mkdtempSync(path.join(__dirname, '.tmp-tls-'));
let cert;
let key;
let opensslOk = true;
try {
  execFileSync('openssl', [
    'req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-days', '1', '-subj', '/CN=localhost',
    '-addext', 'subjectAltName=DNS:localhost,IP:127.0.0.1',
    '-keyout', path.join(dir, 'key.pem'), '-out', path.join(dir, 'cert.pem'),
  ], { stdio: 'ignore' });
  cert = fs.readFileSync(path.join(dir, 'cert.pem'));
  key = fs.readFileSync(path.join(dir, 'key.pem'));
} catch {
  opensslOk = false;
}
test.after(() => fs.rmSync(dir, { recursive: true, force: true }));

const listen = (server) => new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server.address().port)));
const close = (server) => new Promise((resolve) => { server.closeAllConnections?.(); server.close(resolve); });

// servidor HTTP de destino: eco, streaming, 404 e upgrade (eco de bytes)
function makeBackend() {
  const server = http.createServer((req, res) => {
    if (req.url === '/sse') {
      res.writeHead(200, { 'content-type': 'text/event-stream' });
      res.write('data: um\n\n');
      setTimeout(() => { res.write('data: dois\n\n'); res.end(); }, 500);
      return;
    }
    if (req.url === '/missing') {
      res.writeHead(404);
      return res.end('nada aqui');
    }
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ method: req.method, url: req.url, host: req.headers.host, proto: req.headers['x-forwarded-proto'], body }));
    });
  });
  server.on('upgrade', (req, socket) => {
    socket.write('HTTP/1.1 101 Switching Protocols\r\nConnection: Upgrade\r\nUpgrade: echo\r\n\r\n');
    socket.on('data', (d) => socket.write(d));
    // o http.Server do Node usa allowHalfOpen: sem isto o socket fica meio aberto e server.close() nunca termina
    socket.on('end', () => socket.end());
  });
  return server;
}

function request(port, { method = 'GET', path: p = '/', body } = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request({ host: '127.0.0.1', port, method, path: p, ca: cert, servername: 'localhost' }, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function setup(options = {}) {
  const backend = makeBackend();
  const backendPort = await listen(backend);
  const logs = [];
  const proxy = createTlsProxy({ cert, key, target: { host: '127.0.0.1', port: backendPort }, log: (m) => logs.push(m), ...options });
  const proxyPort = await listen(proxy);
  return { backend, backendPort, proxy, proxyPort, logs, done: () => Promise.all([close(proxy), close(backend)]) };
}

test('parseTarget aceita porta ou host:porta', () => {
  assert.deepEqual(parseTarget('5555'), { host: 'localhost', port: 5555 });
  assert.deepEqual(parseTarget('127.0.0.1:8080'), { host: '127.0.0.1', port: 8080 });
  assert.throws(() => parseTarget('abc'));
});

test('GET: repassa para o destino por HTTP, mantém o Host original e marca x-forwarded-proto', { skip: !opensslOk && 'sem openssl' }, async () => {
  const env = await setup();
  try {
    const r = await request(env.proxyPort, { path: '/main.dart.js?v=1' });
    const seen = JSON.parse(r.body);
    assert.equal(r.status, 200);
    assert.equal(seen.url, '/main.dart.js?v=1');
    assert.equal(seen.proto, 'https');
    assert.equal(seen.host, `127.0.0.1:${env.proxyPort}`); // Host original preservado
  } finally {
    await env.done();
  }
});

test('--rewrite-host troca o Host pelo do destino', { skip: !opensslOk && 'sem openssl' }, async () => {
  const env = await setup({ rewriteHost: true });
  try {
    const seen = JSON.parse((await request(env.proxyPort)).body);
    assert.equal(seen.host, `127.0.0.1:${env.backendPort}`);
  } finally {
    await env.done();
  }
});

test('POST: o corpo chega ao destino', { skip: !opensslOk && 'sem openssl' }, async () => {
  const env = await setup();
  try {
    const seen = JSON.parse((await request(env.proxyPort, { method: 'POST', path: '/graphql', body: '{"q":1}' })).body);
    assert.equal(seen.method, 'POST');
    assert.equal(seen.body, '{"q":1}');
  } finally {
    await env.done();
  }
});

test('erros do destino passam e são logados; sucessos só aparecem em --verbose', { skip: !opensslOk && 'sem openssl' }, async () => {
  const env = await setup();
  try {
    assert.equal((await request(env.proxyPort, { path: '/missing' })).status, 404);
    await request(env.proxyPort, { path: '/ok' });
    assert.deepEqual(env.logs, ['GET /missing -> 404']);
  } finally {
    await env.done();
  }
});

test('streaming (SSE): o primeiro pedaço chega antes de a resposta terminar', { skip: !opensslOk && 'sem openssl' }, async () => {
  const env = await setup();
  try {
    const started = Date.now();
    const firstChunkAt = await new Promise((resolve, reject) => {
      const req = https.request({ host: '127.0.0.1', port: env.proxyPort, path: '/sse', ca: cert, servername: 'localhost' }, (res) => {
        let t = null;
        res.on('data', () => { if (t === null) t = Date.now() - started; });
        res.on('end', () => resolve(t));
      });
      req.on('error', reject);
      req.end();
    });
    assert.ok(firstChunkAt < 400, `primeiro pedaço demorou ${firstChunkAt}ms (deveria chegar antes de 500ms)`);
  } finally {
    await env.done();
  }
});

test('upgrade (WebSocket): responde 101 e repassa bytes nos dois sentidos', { skip: !opensslOk && 'sem openssl' }, async () => {
  const env = await setup();
  try {
    const received = await new Promise((resolve, reject) => {
      const socket = tls.connect({ host: '127.0.0.1', port: env.proxyPort, ca: cert, servername: 'localhost' }, () => {
        socket.write('GET /ws HTTP/1.1\r\nHost: x\r\nConnection: Upgrade\r\nUpgrade: echo\r\n\r\n');
      });
      let buf = '';
      let sentPing = false;
      socket.on('data', (d) => {
        buf += d.toString();
        if (!sentPing && buf.includes('\r\n\r\n')) {
          sentPing = true;
          socket.write('ping-123');
        }
        if (buf.includes('ping-123')) {
          socket.destroy();
          resolve(buf);
        }
      });
      socket.on('error', reject);
    });
    assert.match(received, /^HTTP\/1\.1 101/);
    assert.ok(received.endsWith('ping-123'));
  } finally {
    await env.done();
  }
});

test('destino fora do ar: 502 com mensagem clara', { skip: !opensslOk && 'sem openssl' }, async () => {
  const env = await setup();
  await close(env.backend); // derruba só o destino
  try {
    const r = await request(env.proxyPort);
    assert.equal(r.status, 502);
    assert.match(r.body, /rodando/);
    assert.ok(env.logs.some((l) => l.includes('502')));
  } finally {
    await close(env.proxy);
  }
});
