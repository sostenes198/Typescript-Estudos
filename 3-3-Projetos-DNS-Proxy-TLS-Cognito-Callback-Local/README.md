# 3-3-Projetos-DNS-Proxy-TLS-Cognito-Callback-Local

Servidor DNS **recursivo** em Node.js, sem dependências, e o seu proxy de desenvolvimento
configurado para **resolver o host do upstream por ele** (em vez de usar o DNS do sistema).

Requer Node 18+ (testado no 22). Nenhum `npm install` necessário.

## Como usar

Três terminais:

```bash
# 1) servidor DNS (porta 5300, só em 127.0.0.1). --trace mostra root -> TLD -> autoritativo
npm run dns:trace

# 2) proxy (resolve api-gateway.release.example.com pelo servidor acima)
npm run proxy

# 3) consultas de teste
npm run query -- example.com            # mini "dig" incluído
npm run query -- example.com MX
dig @127.0.0.1 -p 5300 example.com      # ou nslookup -port=5300 example.com 127.0.0.1
```

Rode a mesma consulta duas vezes e compare: a primeira passa por root/TLD/autoritativo, a segunda
sai do cache (`cache` no log). Uma consulta nova no mesmo domínio já pula o root (o NS está em cache).

Variáveis do proxy: `ALLOWED_ORIGIN` (origem do front; aceita várias separadas por vírgula; padrão
`http://localhost:5555`); `DNS_MODE=system` volta a usar o resolver do sistema; `DNS_SERVER=host:porta`
aponta para outro servidor DNS (padrão `127.0.0.1:5300`).

> A porta 53 exige root e costuma estar ocupada (systemd-resolved, mDNSResponder). Como o proxy
> consulta o servidor direto, não é preciso mudar o DNS do sistema. Se quiser, `--port 53` com sudo.

## Estrutura

| Arquivo | O que faz |
|---|---|
| `src/codec.js` | Pacote DNS <-> objeto: cabeçalho, perguntas, registros, compressão de nomes, EDNS0 |
| `src/resolver.js` | Resolução iterativa: referrals, glue, CNAME, NXDOMAIN/NODATA, cache, proteções |
| `src/cache.js` | Cache com TTL decrescente, cache negativo (RFC 2308), limite de entradas |
| `src/local-zone.js` | Zona local: domínios falsos definidos em `zones.json` (curingas, CNAME, `.localhost`) |
| `src/transport.js` | Consultas upstream por UDP, com fallback para TCP quando a resposta vem truncada |
| `src/server.js` | Servidor UDP + TCP que atende os clientes |
| `src/dns-lookup.js` | Função `lookup` para `http(s).request`, que consulta o servidor acima |
| `src/proxy.js` | Seu proxy, usando o `lookup` acima |
| `src/tls-proxy.js` | Terminador HTTPS: recebe HTTPS (certificado do mkcert) e repassa para um dev server HTTP, como o do Flutter web (inclui WebSocket) |
| `src/index.js`, `src/cli.js` | Executáveis: servidor e mini-dig |

## Domínios locais (zona local)

Para criar um domínio falso de desenvolvimento (callbacks, webhooks, redirect de OAuth), edite o
`zones.json` na raiz do projeto:

```json
{
  "callback.test":     { "A": "127.0.0.1" },
  "*.hooks.test":      { "A": "127.0.0.1", "ttl": 10 },
  "api.callback.test": { "CNAME": "callback.test" }
}
```

```bash
npm run query -- callback.test          # NOERROR, flag aa, 127.0.0.1
npm run query -- qualquer.hooks.test    # casa com o curinga
```

- Tipos: `A`, `AAAA`, `CNAME`, `TXT`, `MX` (`"10 mail.exemplo.test"`) e `ttl` opcional (padrão 30 s).
- O curinga `*.hooks.test` casa com qualquer nome abaixo (`a.b.hooks.test`), mas não com `hooks.test`.
- A zona local **vence a internet**: dá para sobrescrever até um nome real (`"api.meusite.com": { "A": "127.0.0.1" }`),
  mas só para quem usa este servidor DNS.
- `localhost` e `*.localhost` apontam para o loopback. Nomes sob `.test`, `.invalid` e `.example` que você
  não definiu recebem NXDOMAIN local, sem ir aos root servers. Prefira `.test` para domínios falsos:
  é reservado (RFC 6761) e nunca vai existir na internet.
- **Atualizando o projeto (zip novo)?** O `zones.json` do zip é o de exemplo e sobrescreve o seu. Sem a sua entrada, o
  servidor resolve o nome pela internet e devolve o IP real. Faça backup do seu antes de extrair por cima.
- Salvou o arquivo, a zona recarrega sozinha. Se o JSON estiver inválido, o servidor registra o erro e
  **mantém a versão anterior**.
- Respostas locais saem autoritativas (`aa`) e aparecem no log como `zona local`.

### Fazendo suas aplicações enxergarem a zona

O servidor escuta na porta 5300, que o sistema operacional não usa sozinho:

- **App Node**: use o `lookup` do projeto (devolve só endereços IPv4):
  ```js
  const { createDnsLookup } = require('./src/dns-lookup');
  const lookup = createDnsLookup({ port: 5300 });
  http.request({ host: 'callback.test', port: 3000, path: '/', lookup }, (res) => { /* ... */ });
  ```
- **Navegador e outros programas**: o DNS do sistema precisa encaminhar esses nomes para o servidor.
  Estas receitas **não foram testadas aqui**; confira na sua máquina:
  - macOS: crie `/etc/resolver/test` com as linhas `nameserver 127.0.0.1` e `port 5300`. Só os nomes
    `*.test` vão para o servidor, e o resto do DNS fica intacto.
  - Linux com systemd-resolved (versões recentes): `resolvectl dns lo 127.0.0.1:5300` e
    `resolvectl domain lo '~test'`.
  - Windows: a regra NRPT não aceita porta customizada. Rode o servidor com `--port 53` (como administrador) e
    `Add-DnsClientNrptRule -Namespace ".test" -NameServers "127.0.0.1"`.
  - Para um único nome numa única máquina, uma linha no `/etc/hosts` é mais simples.

## Login (Cognito) com callback em domínio falso

O Cognito só redireciona o navegador para a callback URL cadastrada; quem resolve o nome e conecta é o
**navegador**. Basta, então, que `app.callback.test` aponte para a sua máquina e que o front responda em HTTPS ali.

1. **Cognito** (app client de *desenvolvimento*): cadastre `https://app.callback.test:5555/auth/signin` e use
   exatamente essa URL como `redirect_uri` no front. O Cognito exige HTTPS, exceto para localhost.
2. **zones.json**: já tem `app.callback.test -> 127.0.0.1`.
3. **Resolução no sistema**: o navegador precisa resolver o nome para 127.0.0.1. Use o DNS do projeto (receitas
   acima) ou, mais simples, a linha `127.0.0.1 app.callback.test` no arquivo hosts. Confira com
   `ping app.callback.test` (o `dig` não usa a configuração do sistema, então não serve para esse teste).
4. **Certificado local** (mkcert):
   ```bash
   mkcert -install                    # cria uma CA local e a registra como confiável (uma vez)
   mkcert app.callback.test           # gera app.callback.test.pem e app.callback.test-key.pem
   ```
   Configure o dev server do front com host `app.callback.test`, porta 5555 e HTTPS usando esses dois arquivos.
   Se ele reclamar de host não permitido, adicione o nome em `allowedHosts`.
5. **Proxy**: `ALLOWED_ORIGIN=https://app.callback.test:5555 npm run proxy`
   (Windows: `set ALLOWED_ORIGIN=https://app.callback.test:5555` e depois `npm run proxy`).
   Para aceitar também localhost: `ALLOWED_ORIGIN=http://localhost:5555,https://app.callback.test:5555`.

### Front que só fala HTTP (ex.: Flutter web): `tls-proxy`

Dev servers como o do Flutter web servem HTTP. Para abri-los em `https://app.callback.test` (ou no domínio real
que você sobrescreveu), ponha o `tls-proxy` na frente, com o certificado do mkcert:

```bash
sudo "$(which node)" src/tls-proxy.js --cert app.callback.test.pem --key app.callback.test-key.pem \
  --listen 443 --target 5555 --verbose
```

`--target` aceita `5555` ou `host:porta` (use `127.0.0.1:5555` se o `localhost` for para o IPv6 e o front só escutar em IPv4).
A 443 é porta privilegiada; para estudar sem `sudo`, use `--listen 8443` e cadastre `https://app.callback.test:8443/...`.
Sem destino rodando, ele responde `502` com uma mensagem explicando.

## O que mudou em relação ao artigo

- Responde ao cliente (UDP **e** TCP, com TC/fallback) e tem cache com TTL integrado ao fluxo.
- Segue **CNAME** (inclusive para outra zona) e resolve **NS sem glue**.
- Cache **negativo** (NXDOMAIN e NODATA) e coalescência de consultas idênticas simultâneas.
- Mantém todos os servidores da zona (não só o primeiro IP do glue) e tenta o próximo se um falhar.
- Segurança: checagem de ID, pergunta e origem; **bailiwick** (glue forjado e registros alheios
  são descartados); limites de profundidade, de consultas e de tempo; detecção de loops.
- Root hints atualizados (o B-root mudou para `170.247.170.2`).

## Mudanças no proxy (`src/proxy.js`)

O código é o seu, com estas diferenças:

1. `lookup` customizado no `https.request`, apontando para o servidor DNS local.
2. Erro do upstream **depois** de `writeHead` agora destrói a resposta, em vez de lançar
   `ERR_HTTP_HEADERS_SENT`.
3. Se o cliente desistir da requisição, a conexão upstream é encerrada.

O SNI/validação TLS continuam usando o hostname, não o IP.

## Testes

```bash
npm test     # 75 testes: codec, cache, resolver (internet falsa em memória), servidor, zona local, integração, tls-proxy
```

Os testes do resolver usam uma "mini-internet" em memória (root, TLDs, autoritativos) e cobrem
referral com e sem glue, CNAME, cache/TTL, NXDOMAIN/NODATA, envenenamento de cache e loops.

## Limitações (é um projeto de estudo)

- Sem DNSSEC (não valida assinaturas) e sem suporte a IPv6 no transporte (consulta só A/AAAA em IPv4).
- Não implementa randomização 0x20 nem rate limiting; **por isso escuta só em 127.0.0.1**.
  Não exponha na rede: um resolver aberto vira vetor de amplificação (DDoS).
- Não responde ANY/AXFR (devolve NOTIMP) nem classes diferentes de IN.
