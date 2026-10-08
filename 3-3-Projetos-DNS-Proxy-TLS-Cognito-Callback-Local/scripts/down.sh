#!/bin/bash
# Desfaz o que o up.sh criou. Pode ser rodado de novo: o que já não existe é ignorado e segue para o próximo passo.
#   npm run down      (pede sudo para remover o arquivo do resolver e parar o tls-proxy da porta 443)
# Não mexe no que é seu: zones.json, mkcert e a CA local (compartilhada com outros projetos) ficam como estão.
set -u # sem -e de propósito: um passo que falhe não pode impedir os seguintes

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

DOMAIN="${DOMAIN:-app.callback.test}"
TLS_PORT="${TLS_PORT:-443}"
RESOLVER_DIR="${RESOLVER_DIR:-/etc/resolver}"
RESOLVER_FILE="$RESOLVER_DIR/$DOMAIN"
SUDO_TLS=""
if [ "$TLS_PORT" -lt 1024 ]; then SUDO_TLS="sudo"; fi

ok() { echo "  [ok]    $*"; }
feito() { echo "  [feito] $*"; }

# para NOME ARQUIVO [sudo]  -> encontra pelo caminho absoluto do script (não por porta) e encerra
para() {
  local nome="$1" padrao="$ROOT/src/$2" sudo_cmd="${3:-}"
  if ! pgrep -f "$padrao" >/dev/null; then ok "$nome não estava rodando"; return 0; fi
  $sudo_cmd pkill -f "$padrao"
  for _ in 1 2 3 4 5 6 7 8 9 10; do
    pgrep -f "$padrao" >/dev/null || break
    sleep 0.5
  done
  if pgrep -f "$padrao" >/dev/null; then $sudo_cmd pkill -9 -f "$padrao"; fi
  feito "$nome parado"
}

echo "1) Servidores"
para tls tls-proxy.js "$SUDO_TLS"
para proxy proxy.js
para dns index.js

echo "2) Resolver do macOS ($RESOLVER_FILE)"
if [ -e "$RESOLVER_FILE" ]; then
  sudo rm -f "$RESOLVER_FILE"
  sudo dscacheutil -flushcache
  sudo killall -HUP mDNSResponder || true
  feito "resolver removido e cache de DNS limpo"
else
  ok "arquivo do resolver já não existe"
fi

echo "3) Certificado de $DOMAIN"
if [ -e "$ROOT/certs/$DOMAIN.pem" ] || [ -e "$ROOT/certs/$DOMAIN-key.pem" ]; then
  rm -f "$ROOT/certs/$DOMAIN.pem" "$ROOT/certs/$DOMAIN-key.pem"
  rmdir "$ROOT/certs" 2>/dev/null || true
  feito "certificado e chave privada removidos"
else
  ok "certificado já não existe"
fi

echo "4) Logs (.run/)"
if [ -d "$ROOT/.run" ]; then rm -rf "$ROOT/.run"; feito ".run/ removido"; else ok ".run/ já não existe"; fi

cat <<EOF

Mantidos de propósito: zones.json (sua configuração), mkcert e a CA local (outros projetos usam).
Falta o que é manual: limpar cookies/service workers de $DOMAIN no navegador e tirar a callback de teste do Cognito.
Confira: ping -c1 $DOMAIN   (deve voltar ao IP real, não 127.0.0.1)
EOF
