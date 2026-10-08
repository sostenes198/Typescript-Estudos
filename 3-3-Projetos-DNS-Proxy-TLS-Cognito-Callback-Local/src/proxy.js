// Local dev proxy: lets the localhost example app reach the release GraphQL gateway.
// - Forwards ONLY to UPSTREAM_HOST (never an open proxy), listening on 127.0.0.1 only.
// - Drops Origin/Referer/Sec-Fetch-* on the upstream request (server-side client behaviour).
// - Answers CORS for ALLOWED_ORIGIN only (default http://localhost:5555). It accepts a comma-separated
//   list, e.g. ALLOWED_ORIGIN=http://localhost:5555,https://app.callback.test:5555
//   Logs method/path/status, never headers or bodies.
// - DNS: by default the upstream hostname is resolved by OUR DNS server (see src/server.js),
//   not by the operating system. Set DNS_MODE=system to use the OS resolver instead.
//     DNS_MODE=local|system   (default: local)
//     DNS_SERVER=host:port    (default: 127.0.0.1:5300)
const http = require('http');
const https = require('https');
const { createDnsLookup } = require('./dns-lookup');

const UPSTREAM_HOST = 'api-gateway.release.example.com';
// Origem(ns) do front. new URL(...).origin normaliza (tira barra final, porta padrão etc.),
// ficando igual ao cabeçalho Origin que o navegador envia.
function parseOrigins(raw) {
  try {
    return new Set(raw.split(',').map((s) => s.trim()).filter(Boolean).map((s) => new URL(s).origin));
  } catch {
    console.error(`ALLOWED_ORIGIN inválida: "${raw}". Exemplo: https://app.callback.test:5555`);
    process.exit(1);
  }
}
const ALLOWED_ORIGINS = parseOrigins(process.env.ALLOWED_ORIGIN || 'http://localhost:5555');
const PORT = 5556;

const DNS_MODE = (process.env.DNS_MODE || 'local').toLowerCase();
const [DNS_HOST, DNS_PORT = '5300'] = (process.env.DNS_SERVER || '127.0.0.1:5300').split(':');

const DROPPED_HEADERS = new Set(['host', 'origin', 'referer', 'connection']);

const stamp = () => new Date().toISOString().slice(11, 19);

// undefined => o Node usa o resolver do sistema (dns.lookup / getaddrinfo)
const lookup =
  DNS_MODE === 'system'
    ? undefined
    : createDnsLookup({ server: DNS_HOST, port: Number(DNS_PORT), log: (msg) => console.log(stamp(), msg) });

function corsHeaders(req) {
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.has(req.headers.origin) ? req.headers.origin : [...ALLOWED_ORIGINS][0],
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': req.headers['access-control-request-headers'] || 'content-type, authorization, x-appcheck',
    'Access-Control-Expose-Headers': '*',
    'Access-Control-Max-Age': '600',
    Vary: 'Origin',
  };
}

function log(req, status) {
  console.log(stamp(), req.method, req.url.split('?')[0], '->', status);
}

const server = http.createServer((req, res) => {
  const cors = corsHeaders(req);

  if (req.headers.origin && !ALLOWED_ORIGINS.has(req.headers.origin)) {
    res.writeHead(403, cors).end();
    return log(req, 403);
  }
  if (!req.url.startsWith('/')) {
    res.writeHead(400, cors).end();
    return log(req, 400);
  }
  if (req.method === 'OPTIONS') {
    res.writeHead(204, cors).end();
    return log(req, 204);
  }
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.writeHead(405, cors).end();
    return log(req, 405);
  }

  const headers = {};
  for (const [name, value] of Object.entries(req.headers)) {
    if (DROPPED_HEADERS.has(name) || name.startsWith('sec-fetch-')) continue;
    headers[name] = value;
  }
  headers.host = UPSTREAM_HOST;

  const upstream = https.request(
    { host: UPSTREAM_HOST, port: 443, method: req.method, path: req.url, headers, lookup },
    (upstreamRes) => {
      const out = { ...upstreamRes.headers };
      for (const name of Object.keys(out)) {
        if (name.startsWith('access-control-')) delete out[name];
      }
      res.writeHead(upstreamRes.statusCode, { ...out, ...cors });
      upstreamRes.pipe(res);
      log(req, upstreamRes.statusCode);
    },
  );
  upstream.on('error', (err) => {
    if (res.headersSent) {
      // o erro veio no meio da resposta: já não dá para enviar 502
      res.destroy();
      return log(req, `aborted (${err.code || 'upstream error'})`);
    }
    res.writeHead(502, cors).end();
    log(req, `502 (${err.code || 'upstream error'})`);
  });
  // se o cliente desistir antes do fim, não deixa a conexão upstream aberta
  res.on('close', () => {
    if (!res.writableFinished) upstream.destroy();
  });
  req.pipe(upstream);
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`release gateway proxy: http://127.0.0.1:${PORT} -> https://${UPSTREAM_HOST} (CORS: ${[...ALLOWED_ORIGINS].join(', ')}). Ctrl-C to stop.`);
  console.log(
    DNS_MODE === 'system'
      ? 'DNS: system resolver'
      : `DNS: local server ${DNS_HOST}:${DNS_PORT} (start it with: npm run dns)`,
  );
});
