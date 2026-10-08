'use strict';

// Servidor DNS (UDP + TCP) que recebe consultas de clientes (dig, nslookup, o sistema
// operacional, o proxy...) e delega a resolução ao Resolver.

const dgram = require('node:dgram');
const net = require('node:net');
const {
  TYPE,
  RCODE,
  RCODE_NAME,
  CLASS_IN,
  decodeMessage,
  encodeMessage,
  encodeForTransport,
  getEdnsSize,
  makeOpt,
  normalizeName,
  typeToString,
} = require('./codec');

const MAX_UDP_PAYLOAD = 1232; // tamanho "seguro" recomendado para EDNS0 (evita fragmentação IP)
const UNSUPPORTED_TYPES = new Set([251, 252, 253, 254, 255]); // IXFR, AXFR, MAILB, MAILA, ANY

class DnsServer {
  constructor({ resolver, host = '127.0.0.1', port = 5300, log = () => {} } = {}) {
    this.resolver = resolver;
    this.host = host;
    this.port = port;
    this.log = log;
    this.udp = null;
    this.tcp = null;
    this.pruneTimer = null;
    this.tcpSockets = new Set();
  }

  start() {
    return new Promise((resolve, reject) => {
      this.udp = dgram.createSocket('udp4');
      this.udp.once('error', reject);
      this.udp.on('message', (msg, rinfo) => {
        const remote = `${rinfo.address}:${rinfo.port}`;
        this.handle(msg, { tcp: false, remote })
          .then((out) => {
            if (out) this.udp.send(out, rinfo.port, rinfo.address);
          })
          .catch((err) => this.log(`${remote} erro: ${err.message}`));
      });
      this.udp.bind(this.port, this.host, () => {
        this.port = this.udp.address().port; // útil quando port = 0 (testes)
        this.udp.removeListener('error', reject);
        this.udp.on('error', (err) => this.log(`erro UDP: ${err.message}`));
        this.tcp = net.createServer((socket) => this._onTcp(socket));
        this.tcp.once('error', reject);
        this.tcp.listen(this.port, this.host, () => {
          this.tcp.removeListener('error', reject);
          this.tcp.on('error', (err) => this.log(`erro TCP: ${err.message}`));
          const cache = this.resolver.cache;
          if (cache && typeof cache.prune === 'function') {
            this.pruneTimer = setInterval(() => cache.prune(), 60000);
            this.pruneTimer.unref();
          }
          resolve({ host: this.host, port: this.port });
        });
      });
    });
  }

  stop() {
    clearInterval(this.pruneTimer);
    for (const s of this.tcpSockets) s.destroy();
    const closeUdp = new Promise((resolve) => (this.udp ? this.udp.close(resolve) : resolve()));
    const closeTcp = new Promise((resolve) => (this.tcp ? this.tcp.close(resolve) : resolve()));
    return Promise.all([closeUdp, closeTcp]).then(() => {});
  }

  _onTcp(socket) {
    const remote = `${socket.remoteAddress}:${socket.remotePort}`;
    this.tcpSockets.add(socket);
    socket.on('close', () => this.tcpSockets.delete(socket));
    socket.on('error', () => {}); // reset do cliente etc.: ignorar
    socket.setTimeout(10000, () => socket.destroy());
    let buffer = Buffer.alloc(0);
    socket.on('data', (chunk) => {
      buffer = Buffer.concat([buffer, chunk]);
      // cada mensagem vem com 2 bytes de tamanho; pode haver várias no mesmo pacote
      while (buffer.length >= 2) {
        const len = buffer.readUInt16BE(0);
        if (buffer.length < 2 + len) break;
        const wire = buffer.subarray(2, 2 + len);
        buffer = buffer.subarray(2 + len);
        this.handle(wire, { tcp: true, remote })
          .then((out) => {
            if (!out || socket.destroyed) return;
            const frame = Buffer.alloc(2 + out.length);
            frame.writeUInt16BE(out.length, 0);
            out.copy(frame, 2);
            socket.write(frame);
          })
          .catch((err) => this.log(`${remote} erro: ${err.message}`));
      }
    });
  }

  // Processa uma mensagem DNS crua e devolve a resposta crua (ou null para ignorar).
  async handle(wire, { tcp = false, remote = '?' } = {}) {
    const started = Date.now();
    let req;
    try {
      req = decodeMessage(wire);
    } catch (err) {
      this.log(`${remote} pacote inválido: ${err.message}`);
      if (wire.length < 2) return null;
      return encodeMessage(this._response({ id: wire.readUInt16BE(0), rd: false, questions: [] }, RCODE.FORMERR));
    }
    if (req.qr) return null; // é uma resposta, não uma pergunta: ignorar

    const edns = getEdnsSize(req);
    const maxSize = tcp ? 65535 : Math.min(Math.max(edns || 512, 512), MAX_UDP_PAYLOAD);
    const finish = (rcode, answers = [], authority = [], note = '', aa = false) => {
      const resp = this._response(req, rcode, answers, authority, edns ? [makeOpt(MAX_UDP_PAYLOAD)] : [], aa);
      const q = req.questions[0];
      this.log(
        `${remote} ${tcp ? 'tcp' : 'udp'} ${q ? `${normalizeName(q.name)} ${typeToString(q.type)}` : '(sem pergunta)'} ` +
          `-> ${RCODE_NAME[rcode] ?? rcode} ${answers.length} resp. (${Date.now() - started}ms${note ? `, ${note}` : ''})`,
      );
      return encodeForTransport(resp, maxSize);
    };

    if (req.opcode !== 0) return finish(RCODE.NOTIMP);
    if (req.questions.length !== 1) return finish(RCODE.FORMERR);
    const q = req.questions[0];
    if (q.class !== CLASS_IN) return finish(RCODE.REFUSED);
    if (UNSUPPORTED_TYPES.has(q.type)) return finish(RCODE.NOTIMP);

    const result = await this.resolver.resolve(normalizeName(q.name), q.type);
    const note = result.local ? 'zona local' : result.cached ? 'cache' : `${result.upstream} consultas upstream`;
    // respostas da zona local são autoritativas (aa=1); as demais vêm de terceiros (aa=0)
    return finish(result.rcode, result.answers, result.authority, note, !!result.local);
  }

  _response(req, rcode, answers = [], authorities = [], additionals = [], aa = false) {
    return {
      id: req.id,
      qr: true,
      opcode: 0,
      aa, // só é verdadeiro para respostas da zona local
      tc: false,
      rd: req.rd,
      ra: true,
      ad: false,
      cd: false,
      rcode,
      questions: req.questions,
      answers,
      authorities,
      additionals,
    };
  }
}

module.exports = { DnsServer, MAX_UDP_PAYLOAD, TYPE };
