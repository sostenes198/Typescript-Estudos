'use strict';

// Root hints: endereços IPv4 dos 13 root servers (A–M).
// Fonte: https://www.internic.net/domain/named.root (versão de 2026-10-07).
// Obs.: o b.root-servers.net mudou de IP (antes 199.9.14.201); aqui está o atual.
const ROOT_HINTS = [
  '198.41.0.4',     // a.root-servers.net (Verisign)
  '170.247.170.2',  // b.root-servers.net (USC-ISI)
  '192.33.4.12',    // c.root-servers.net (Cogent)
  '199.7.91.13',    // d.root-servers.net (Univ. of Maryland)
  '192.203.230.10', // e.root-servers.net (NASA)
  '192.5.5.241',    // f.root-servers.net (ISC)
  '192.112.36.4',   // g.root-servers.net (DISA)
  '198.97.190.53',  // h.root-servers.net (US Army)
  '192.36.148.17',  // i.root-servers.net (Netnod)
  '192.58.128.30',  // j.root-servers.net (Verisign)
  '193.0.14.129',   // k.root-servers.net (RIPE NCC)
  '199.7.83.42',    // l.root-servers.net (ICANN)
  '202.12.27.33',   // m.root-servers.net (WIDE)
];

module.exports = { ROOT_HINTS };
