'use strict';

// Função `lookup` compatível com http(s).request / net.connect, que consulta o NOSSO
// servidor DNS em vez do resolver do sistema operacional (getaddrinfo).
//
// O Node chama lookup(hostname, options, callback). Com autoSelectFamily (padrão desde
// o Node 20) ele pede options.all = true e espera uma lista [{ address, family }].

const net = require('node:net');
const { query } = require('./transport');
const { buildQuery, TYPE, RCODE } = require('./codec');

function lookupError(hostname, code) {
  const err = new Error(`getaddrinfo ${code} ${hostname}`);
  return Object.assign(err, { code, errno: code, syscall: 'getaddrinfo', hostname });
}

function createDnsLookup({ server = '127.0.0.1', port = 5300, timeoutMs = 20000, log = () => {} } = {}) {
  return function lookup(hostname, options, callback) {
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }
    options = options || {};
    const wantAll = !!options.all;
    const done = (err, addresses) => {
      if (err) return callback(err);
      if (wantAll) return callback(null, addresses.map((address) => ({ address, family: 4 })));
      return callback(null, addresses[0], 4);
    };

    // IP literal: nada a resolver
    const literal = net.isIP(hostname);
    if (literal) {
      return process.nextTick(() => {
        if (wantAll) callback(null, [{ address: hostname, family: literal }]);
        else callback(null, hostname, literal);
      });
    }
    // nosso resolver só devolve IPv4
    if (options.family === 6) return process.nextTick(() => callback(lookupError(hostname, 'ENOTFOUND')));

    const started = Date.now();
    const q = buildQuery({ name: hostname, type: TYPE.A, rd: true });
    query({ address: server, port }, q, { timeoutMs }).then(
      (resp) => {
        const addresses = resp.answers.filter((r) => r.type === TYPE.A).map((r) => r.data);
        log(`dns ${hostname} -> ${addresses.join(', ') || RCODE_NAME_OF(resp.rcode)} (${Date.now() - started}ms)`);
        if (resp.rcode === RCODE.NXDOMAIN || addresses.length === 0) return done(lookupError(hostname, 'ENOTFOUND'));
        return done(null, addresses);
      },
      (err) => {
        log(`dns ${hostname} falhou: ${err.message}`);
        done(lookupError(hostname, 'EAI_AGAIN'));
      },
    );
  };
}

function RCODE_NAME_OF(rcode) {
  return Object.keys(RCODE).find((k) => RCODE[k] === rcode) || String(rcode);
}

module.exports = { createDnsLookup };
