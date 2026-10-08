'use strict';

// Transporte de consultas DNS: UDP primeiro; se a resposta vier truncada (TC=1),
// repete por TCP (mensagem precedida por 2 bytes com o tamanho — RFC 1035 §4.2.2).

const dgram = require('node:dgram');
const net = require('node:net');
const { encodeMessage, decodeMessage, normalizeName } = require('./codec');

function toServer(s) {
  return typeof s === 'string' ? { address: s, port: 53 } : { port: 53, ...s };
}

// A resposta só vale se o ID e a pergunta baterem com o que foi enviado
// (defesa básica contra respostas forjadas).
function responseMatches(query, resp) {
  if (!resp.qr || resp.id !== query.id) return false;
  const q = query.questions[0];
  const r = resp.questions[0];
  return !!r && r.type === q.type && normalizeName(r.name) === normalizeName(q.name);
}

function queryUdp(server, query, timeoutMs) {
  const wire = encodeMessage(query);
  return new Promise((resolve, reject) => {
    const socket = dgram.createSocket('udp4'); // porta de origem aleatória, escolhida pelo SO
    let done = false;
    let timer;
    const finish = (err, value) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      socket.close();
      if (err) reject(err);
      else resolve(value);
    };
    timer = setTimeout(() => finish(new Error(`timeout consultando ${server.address}:${server.port}`)), timeoutMs);
    socket.on('error', (err) => finish(err));
    socket.on('message', (msg, rinfo) => {
      if (rinfo.address !== server.address || rinfo.port !== server.port) return; // origem inesperada
      let resp;
      try {
        resp = decodeMessage(msg);
      } catch {
        return;
      }
      if (!responseMatches(query, resp)) return;
      finish(null, resp);
    });
    // Socket "conectado": o kernel descarta pacotes de outras origens e, se não houver
    // ninguém na porta, entrega ECONNREFUSED na hora (em vez de esperar o timeout).
    socket.connect(server.port, server.address, () => {
      socket.send(wire, (err) => {
        if (err) finish(err);
      });
    });
  });
}

function queryTcp(server, query, timeoutMs) {
  const wire = encodeMessage(query);
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host: server.address, port: server.port });
    let buffer = Buffer.alloc(0);
    let settled = false;
    const settle = (err, value) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      if (err) reject(err);
      else resolve(value);
    };
    socket.setTimeout(timeoutMs, () => settle(new Error(`timeout TCP em ${server.address}:${server.port}`)));
    socket.on('error', (err) => settle(err));
    socket.on('close', () => settle(new Error('conexão TCP fechada antes da resposta')));
    socket.on('connect', () => {
      const frame = Buffer.alloc(2 + wire.length);
      frame.writeUInt16BE(wire.length, 0);
      wire.copy(frame, 2);
      socket.write(frame);
    });
    socket.on('data', (chunk) => {
      buffer = Buffer.concat([buffer, chunk]);
      if (buffer.length < 2) return;
      const len = buffer.readUInt16BE(0);
      if (buffer.length < 2 + len) return;
      let resp;
      try {
        resp = decodeMessage(buffer.subarray(2, 2 + len));
      } catch (err) {
        return settle(err);
      }
      if (!responseMatches(query, resp)) return settle(new Error('resposta TCP não corresponde à pergunta'));
      settle(null, resp);
    });
  });
}

async function query(serverIn, queryMsg, { timeoutMs = 2000, tcpFallback = true } = {}) {
  const server = toServer(serverIn);
  const resp = await queryUdp(server, queryMsg, timeoutMs);
  if (resp.tc && tcpFallback) return queryTcp(server, queryMsg, timeoutMs);
  return resp;
}

// Objeto com a interface que o Resolver espera ({ query(server, msg) }).
// Nos testes, ele é trocado por uma "internet falsa" em memória.
function createTransport(defaults = {}) {
  return { query: (server, queryMsg) => query(server, queryMsg, defaults) };
}

module.exports = { toServer, query, queryUdp, queryTcp, createTransport, responseMatches };
