#!/bin/bash
# Sobe o que o README descreve: ferramentas, certificado (mkcert), zona local, resolver do macOS,
# servidor DNS, proxy e tls-proxy. Pode ser interrompido (Ctrl-C) e rodado de novo: o que já existe é pulado.
#   npm run up        (pede sudo para o arquivo do resolver e para a porta 443)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

DOMAIN="${DOMAIN:-app.callback.test}"        # nome que passa a apontar para esta máquina
DNS_PORT=5300                                # servidor DNS
PROXY_PORT=5556                              # proxy do gateway (porta fixa em src/proxy.js)
TLS_PORT="${TLS_PORT:-443}"                  # HTTPS que o navegador abre
FRONT_PORT="${FRONT_PORT:-5555}"             # front HTTP (flutter run -d web-server --web-port=5555)
RESOLVER_DIR="${RESOLVER_DIR:-/etc/resolver}"

CERT="$ROOT/certs/$DOMAIN.pem"
KEY="$ROOT/certs/$DOMAIN-key.pem"
RESOLVER_FILE="$RESOLVER_DIR/$DOMAIN"
RUN="$ROOT/.run"
if [ "$TLS_PORT" = 443 ]; then ORIGIN="https://$DOMAIN"; else ORIGIN="https://$DOMAIN:$TLS_PORT"; fi
SUDO_TLS=""
if [ "$TLS_PORT" -lt 1024 ]; then SUDO_TLS="sudo"; fi # portas < 1024 exigem root

ok() { echo "  [ok]    $*"; }
feito() { echo "  [feito] $*"; }
porta_aberta() { (exec 3<>"/dev/tcp/127.0.0.1/$1") 2>/dev/null; }
instalado() { case "$1" in nss) brew list --formula nss >/dev/null 2>&1 ;; *) command -v "$1" >/dev/null 2>&1 ;; esac; }

# sobe NOME PORTA ARQUIVO COMANDO...  -> pula se este projeto já roda ARQUIVO na porta; falha se a porta é de outro
# processo (outra cópia do estudo, por exemplo); senão lança em segundo plano e espera abrir
sobe() {
  local nome="$1" porta="$2" padrao="$ROOT/src/$3"
  shift 3
  if porta_aberta "$porta"; then
    if pgrep -f "$padrao" >/dev/null; then ok "$nome já está rodando (porta $porta)"; return 0; fi
    echo "ERRO: a porta $porta está ocupada por um processo que este up não gerencia (outro projeto, ou um npm run dns/proxy/tls aberto à mão). Pare-o e rode de novo." >&2
    exit 1
  fi
  mkdir -p "$RUN"
  nohup "$@" >"$RUN/$nome.log" 2>&1 </dev/null &
  for _ in $(seq 1 50); do
    if porta_aberta "$porta"; then feito "$nome subiu (porta $porta, log em .run/$nome.log)"; return 0; fi
    sleep 0.2
  done
  echo "ERRO: $nome não subiu em 10 s. Veja $RUN/$nome.log" >&2
  exit 1
}

echo "1) Ferramentas"
command -v brew >/dev/null || { echo "ERRO: Homebrew não encontrado (https://brew.sh)." >&2; exit 1; }
for pkg in node mkcert nss; do
  if instalado "$pkg"; then ok "$pkg já instalado"; else brew install "$pkg"; feito "$pkg instalado"; fi
done
node -e 'process.exit(+process.versions.node.split(".")[0] >= 18 ? 0 : 1)' || { echo "ERRO: precisa de Node 18+." >&2; exit 1; }

echo "2) CA local do mkcert"
if security verify-cert -c "$(mkcert -CAROOT)/rootCA.pem" >/dev/null 2>&1; then
  ok "CA já é confiável"
else
  mkcert -install # pede a senha do Keychain
  feito "CA instalada"
fi

echo "3) Certificado de $DOMAIN"
if [ -f "$CERT" ] && [ -f "$KEY" ]; then
  ok "certs/$DOMAIN.pem e a chave já existem"
else
  mkdir -p "$ROOT/certs"
  (cd "$ROOT/certs" && mkcert "$DOMAIN")
  feito "certificado gerado em certs/"
fi

echo "4) Zona local (zones.json)"
if grep -q "\"$DOMAIN\"" "$ROOT/zones.json" 2>/dev/null; then
  ok "zones.json já tem $DOMAIN"
else
  node -e '
    const fs = require("fs");
    const [file, domain] = process.argv.slice(1);
    const zones = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8") || "{}") : {};
    zones[domain] = { A: "127.0.0.1" };
    fs.writeFileSync(file, JSON.stringify(zones, null, 2) + "\n");
  ' "$ROOT/zones.json" "$DOMAIN"
  feito "$DOMAIN -> 127.0.0.1 adicionado ao zones.json"
fi

echo "5) Resolver do macOS ($RESOLVER_FILE)"
CONTEUDO="nameserver 127.0.0.1"$'\n'"port $DNS_PORT"
if [ -f "$RESOLVER_FILE" ] && [ "$(cat "$RESOLVER_FILE")" = "$CONTEUDO" ]; then
  ok "arquivo do resolver já está certo"
else
  sudo mkdir -p "$RESOLVER_DIR"
  printf '%s\n' "$CONTEUDO" | sudo tee "$RESOLVER_FILE" >/dev/null
  sudo dscacheutil -flushcache
  sudo killall -HUP mDNSResponder || true
  feito "resolver criado e cache de DNS limpo"
fi

echo "6) Servidores"
sobe dns "$DNS_PORT" index.js node "$ROOT/src/index.js" --port "$DNS_PORT" --zone "$ROOT/zones.json"
sobe proxy "$PROXY_PORT" proxy.js env ALLOWED_ORIGIN="$ORIGIN" node "$ROOT/src/proxy.js"
if [ -n "$SUDO_TLS" ] && ! porta_aberta "$TLS_PORT"; then sudo -v; fi # a senha tem de ser pedida aqui, não em segundo plano
sobe tls "$TLS_PORT" tls-proxy.js $SUDO_TLS "$(command -v node)" "$ROOT/src/tls-proxy.js" \
  --cert "$CERT" --key "$KEY" --listen "$TLS_PORT" --target "$FRONT_PORT" --verbose

echo "7) Conferência"
IP="$(dscacheutil -q host -a name "$DOMAIN" 2>/dev/null | awk '/ip_address/ && !s {print $2; s=1}' || true)"
echo "  o sistema resolve $DOMAIN para: ${IP:-(nada)}   (esperado: 127.0.0.1)"
CODE="$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 "$ORIGIN/" || true)"
echo "  HTTPS $ORIGIN/ -> HTTP $CODE   (502 é normal sem o front rodando; 000 = falhou conexão ou certificado)"

cat <<EOF

Falta o que é manual:
  - Front: flutter run -d web-server --web-port=$FRONT_PORT
  - Cognito (app client de DEV): cadastrar $ORIGIN/auth/signin e usar a mesma URL como redirect_uri no front
Para desfazer tudo: npm run down
EOF
