# Login (Cognito) local com domínio real apontando para o localhost — macOS

Guia de estudo: rodar um front **local** que faz login pelo Cognito usando uma callback URL de um
domínio real (`https://admin.sandbox.example.com`), com um servidor DNS próprio (projeto `3-3-Projetos-DNS-Proxy-TLS-Cognito-Callback-Local`) e um
proxy local para a API.

> **Última revisão:** 08/10/2026, depois de rodar o roteiro num Mac (Flutter web + `tls-proxy`).
>
> **O que foi confirmado na prática:** o servidor DNS responde `127.0.0.1` (flag `aa`) para o domínio; o arquivo
> em `/etc/resolver` faz o macOS usar esse DNS; `curl` conecta em `127.0.0.1:443` e recebe o certificado do
> `mkcert` sem erro; o desfazer (`rm` do resolver, flush, `ping` com IP real, portas livres) funcionou.
>
> **O que NÃO foi confirmado:** o login completo no Cognito voltando para o domínio local, o hot reload do Flutter
> através do `tls-proxy`, e se o Cognito compara o `redirect_uri` de forma exata ou aceita curinga.
> Os testes automáticos do projeto (75) rodaram num ambiente Linux; a regra de HTTPS/localhost do Cognito foi
> conferida na documentação da AWS (link no final).

---

## 1. Ideia central

O Cognito **não conecta** na callback URL. Ele só confere se ela está cadastrada e responde ao navegador
com um redirect. Quem resolve o nome e abre a URL é o **navegador**.

```
1. Front manda o navegador ao Cognito          (redirect_uri = https://admin.sandbox.example.com/auth/signin)
2. Usuário faz login no Cognito
3. Cognito redireciona o navegador para        https://admin.sandbox.example.com/auth/signin?code=...
4. O NAVEGADOR resolve admin.sandbox.example.com  -> 127.0.0.1   (override local: é aqui que o DNS atua)
5. O front local (HTTPS, porta 443) recebe o code e troca por tokens no Cognito
6. O front chama o proxy local com o token; o proxy chama o gateway real
```

Consequência: basta fazer **o seu Mac** resolver esse nome para `127.0.0.1` e servir o front em HTTPS com um
certificado que o navegador aceite. Ninguém além de você é afetado.

## 2. Peças e para que servem

| Peça | O que é | Por que é necessária |
|---|---|---|
| **Servidor DNS** (`3-3-Projetos-DNS-Proxy-TLS-Cognito-Callback-Local`, porta 5300) | Resolver recursivo em Node.js com uma "zona local" (`zones.json`) | Responde `127.0.0.1` para o domínio escolhido e resolve o resto pela internet. O proxy o usa para achar o gateway |
| **Override no macOS** | Arquivo em `/etc/resolver/` (ou linha no `/etc/hosts`) | O navegador usa o DNS do sistema, não o seu servidor; isso o faz perguntar ao seu servidor só por esse nome |
| **Certificado local** (`mkcert`) | Autoridade certificadora só da sua máquina + certificado para o domínio | A callback é HTTPS e nenhuma CA pública emite certificado para um domínio que você não controla |
| **Front** | Seu app, em HTTPS na porta 443 | Recebe o redirect do Cognito |
| **Proxy** (`src/proxy.js`, porta 5556) | Repassa as chamadas do front ao gateway, com CORS | O gateway pode não aceitar a origem local; o proxy responde o CORS e remove `Origin`/`Referer` |

```
Navegador ──► https://admin.sandbox.example.com (443)  ──► Front local
Front ──► http://127.0.0.1:5556 (proxy) ──► DNS local 127.0.0.1:5300 ──► IP do gateway ──► https gateway real
```

## 3. Pré-requisitos

- macOS, Node 18+ e o projeto `3-3-Projetos-DNS-Proxy-TLS-Cognito-Callback-Local` (sem dependências, não precisa de `npm install`).
- Homebrew para instalar o `mkcert`.
- Um app client do Cognito de **desenvolvimento** (não use o de produção).
- Máquina corporativa? VPN, proxy ou PAC podem ignorar o `/etc/resolver` (veja a seção 5).
- Atualizando o `3-3-Projetos-DNS-Proxy-TLS-Cognito-Callback-Local` (extraindo um zip novo)? **Guarde o seu `zones.json` antes**: o do zip não tem as suas
  entradas e o servidor volta a devolver o IP real (foi exatamente o que aconteceu no estudo).

## 4. Passo a passo

### Passo 1 — Cognito

No app client de dev, confira em *Allowed callback URLs* (a regra é: HTTPS, exceto `localhost`):

```
https://admin.sandbox.example.com/auth/signin      # ajuste para o caminho que o seu front usa
```

- O `redirect_uri` enviado pelo front e usado na troca do code por tokens deve ser **idêntico** ao cadastrado
  (esquema, host, porta, caminho, barra final).
- Se o front usa `logout_uri`, ele fica em *Allowed sign-out URLs*, separado.
- Se essa URL já está cadastrada (porque o site real usa), nada muda no Cognito.

### Passo 2 — Zona local do DNS

No `zones.json` do projeto, adicione o domínio (recarrega sozinho ao salvar):

```json
{
  "admin.sandbox.example.com": { "A": "127.0.0.1" },
  "app.callback.test": { "A": "127.0.0.1" },
  "callback.test": { "A": "127.0.0.1" },
  "*.hooks.test": { "A": "127.0.0.1", "ttl": 10 },
  "api.callback.test": { "CNAME": "callback.test" },
  "dual.test": { "A": "127.0.0.1", "AAAA": "::1" },
  "notas.test": { "TXT": "dominio falso de desenvolvimento" }
}
```

A entrada é **exata**: só `admin.sandbox.example.com` é sobrescrito. O gateway e os outros nomes continuam
resolvendo pela internet.

> **Armadilha:** se o `zones.json` em uso não tiver essa entrada, o servidor DNS resolve o nome pela internet e
> devolve o **IP real**. O navegador abre o site verdadeiro e parece um bug do front ou do middleware. Antes de
> culpar o código, rode o `npm run query` do passo 3.

### Passo 3 — Subir o DNS e conferir

```bash
cd 3-3-Projetos-DNS-Proxy-TLS-Cognito-Callback-Local
npm run dns:trace                              # terminal 1; deve listar a zona carregada
npm run query -- admin.sandbox.example.com --server 127.0.0.1:5300   # NOERROR, flag aa, 127.0.0.1
npm run query -- www.example.com                # resolve pela internet (prova que o resto segue normal)
```

### Passo 4 — Fazer o Mac resolver o nome para 127.0.0.1

**Opção A — usar o seu DNS** (precisa do `npm run dns` rodando). O arquivo tem o nome **exato** do domínio e
vale para ele e seus subdomínios:

```bash
sudo mkdir -p /etc/resolver
printf "nameserver 127.0.0.1\nport 5300\n" | sudo tee /etc/resolver/admin.sandbox.example.com
```

**Opção B — arquivo hosts** (não depende do DNS):

```bash
echo "127.0.0.1 admin.sandbox.example.com" | sudo tee -a /etc/hosts
```

Nos dois casos, limpe o cache e confira:

```bash
sudo dscacheutil -flushcache && sudo killall -HUP mDNSResponder
ping -c1 admin.sandbox.example.com        # deve mostrar 127.0.0.1
```

`dig` e `nslookup` **não** passam pela configuração do sistema; use `ping` ou
`dscacheutil -q host -a name admin.sandbox.example.com`. Se o Chrome/Firefox estiverem com "DNS seguro" (DoH)
ligado, desligue para este teste.

O teste mais informativo é o `curl`, porque mostra o IP **e** quem emitiu o certificado:

```bash
curl -sv https://admin.sandbox.example.com 2>&1 | grep -E "Connected to|issuer"
```

| Resultado | Significa |
|---|---|
| `127.0.0.1` e emissor `mkcert development CA` | Tudo certo: DNS, `tls-proxy` na 443 e CA confiável |
| IP real e emissor `Let's Encrypt` (ou outra CA pública) | O override **não** está valendo: veja a seção 5 |
| `127.0.0.1` e `Connection refused` | O DNS está certo, mas nada escuta na 443 (falta o `tls-proxy`) |

### Passo 5 — Certificado local

```bash
brew install mkcert nss          # nss: o Firefox usa o seu próprio repositório de certificados
mkcert -install                  # uma vez; pede a senha e confia na autoridade local no Keychain
mkdir -p certs && cd certs
mkcert admin.sandbox.example.com  # gera admin.sandbox.example.com.pem e admin.sandbox.example.com-key.pem
```

Coloque `certs/` no `.gitignore`: **a chave não deve ser versionada**.

### Passo 6 — Front em HTTPS na porta 443

O navegador vai abrir `https://admin.sandbox.example.com` (porta 443, implícita). Alguém precisa **escutar HTTPS na 443**;
se ninguém escuta, o Chrome mostra `ERR_CONNECTION_REFUSED` (o nome até resolveu para 127.0.0.1, mas a porta está fechada).

#### 6A — Front Flutter (web): `tls-proxy` na frente (recomendado)

O servidor de desenvolvimento do Flutter fala **HTTP**. Em vez de brigar com certificado dentro do Flutter, deixe-o em
HTTP na 5555 e ponha na frente o `src/tls-proxy.js` do projeto: ele recebe HTTPS na 443 (com o certificado do mkcert) e
repassa para `http://localhost:5555`. Também repassa WebSocket (usado pelo debug/hot reload do Flutter web).

```bash
# terminal 3: o Flutter, em HTTP, na porta fixa 5555
flutter run -d web-server --web-port=5555
#   (ou -d chrome --web-port=5555; nesse caso ele abre uma janela do Chrome em localhost:5555,
#    que você pode fechar e usar a aba normal em https://admin.sandbox.example.com)

# terminal 4: HTTPS na 443 -> Flutter na 5555 (443 é porta privilegiada: sudo)
cd 3-3-Projetos-DNS-Proxy-TLS-Cognito-Callback-Local            # a pasta do projeto, onde está src/tls-proxy.js
sudo "$(which node)" src/tls-proxy.js \
  --cert ../meu-front/certs/admin.sandbox.example.com.pem \
  --key  ../meu-front/certs/admin.sandbox.example.com-key.pem \
  --listen 443 --target 5555 --verbose
```

- Ajuste os caminhos de `--cert` e `--key` para onde o `mkcert` gerou os arquivos (passo 5). Caminhos relativos
  valem a partir da pasta onde você roda o comando. Em uma linha só:
  `sudo "$(which node)" src/tls-proxy.js --cert CAMINHO/admin.sandbox.example.com.pem --key CAMINHO/admin.sandbox.example.com-key.pem --listen 443 --target 5555 --verbose`
- Deve aparecer `tls-proxy: https://127.0.0.1:443 -> http://localhost:5555`. Daí abra `https://admin.sandbox.example.com`.
- `sudo "$(which node)"` evita o erro "node: command not found" de quem instalou o Node com nvm.
- Se aparecer `502 ... ECONNREFUSED`: o Flutter não está rodando na 5555, ou escuta só em IPv4/IPv6 e o `localhost`
  foi para o outro. Tente `--target 127.0.0.1:5555` (ou `--target "[::1]:5555"`).
- Os sinalizadores `--web-port` e `-d web-server` são o que eu conheço do Flutter; **não havia documentação do Flutter
  disponível para consulta aqui**, então confirme com `flutter run -h` e `flutter devices` na sua versão.
- Hot reload/restart através do proxy: o WebSocket é repassado, mas **não foi testado com o Flutter de verdade**.
  Se o hot reload falhar só pelo domínio HTTPS, recarregue a página manualmente (ou use `localhost:5555` para
  desenvolver e o domínio apenas para testar o login).
- A primeira carga do Flutter web em modo debug é lenta (compila no navegador): a tela de splash pode ficar
  30 s a 1 min ou mais. Se ficar parada para sempre, veja o Console do Chrome (F12) e o terminal do `flutter run`.
- A URL de retorno (`redirect_uri`) e a base da API vivem na **configuração do app Flutter** (`--dart-define`, `.env`,
  um arquivo de config ou flavor, conforme o seu projeto). Troque-as para `https://admin.sandbox.example.com/...` e
  para `http://127.0.0.1:5556`.

#### 6B — Front com dev server próprio (Vite etc.)

Exemplo com Vite (`vite.config.ts`):

```ts
import fs from 'node:fs'

export default defineConfig({
  server: {
    host: true,            // veja a nota abaixo
    port: 443,
    strictPort: true,
    https: {
      key: fs.readFileSync('./certs/admin.sandbox.example.com-key.pem'),
      cert: fs.readFileSync('./certs/admin.sandbox.example.com.pem'),
    },
    allowedHosts: ['admin.sandbox.example.com'],   // sem isso o Vite recusa o host "estranho"
  },
})
```

- A porta 443 costuma exigir privilégio. No macOS recente, escutar em todas as interfaces (`host: true`) tende
  a funcionar sem `sudo` (**não confirmado**), mas isso expõe o dev server à rede local; use só em rede confiável.
  Alternativa: rodar com `sudo`.
- Também dá para usar o `tls-proxy` do 6A na frente de qualquer dev server HTTP.
- A base da API no front deve apontar para o proxy: `http://127.0.0.1:5556`. Se o Safari bloquear (mixed
  content, HTTPS chamando HTTP), o proxy precisaria de TLS também.

### Passo 7 — Proxy

```bash
ALLOWED_ORIGIN=https://admin.sandbox.example.com npm run proxy      # terminal 2
```

- A origem é `https://admin.sandbox.example.com` **sem porta** (443 é implícita).
- Aceita várias origens separadas por vírgula: `ALLOWED_ORIGIN=http://localhost:5555,https://admin.sandbox.example.com`.
- Variáveis úteis: `DNS_MODE=system` (usa o DNS do sistema em vez do servidor local) e `DNS_SERVER=host:porta`.

### Passo 8 — Testar o login

Ordem de execução: DNS (terminal 1) → proxy (terminal 2) → front (terminal 3) → `tls-proxy` na 443 (terminal 4, só no 6A).

0. Antes do navegador, rode o `curl` do passo 4: deve mostrar `127.0.0.1` e o emissor `mkcert`.
1. Abra `https://admin.sandbox.example.com` no navegador: deve aparecer o **seu front local**, com cadeado e sem alerta.
   Cada requisição aparece como `GET ...` no terminal do `tls-proxy` (`--verbose`): se nada aparece lá, o navegador
   não está chegando na sua máquina.
2. Faça o login. O Cognito deve devolver para `https://admin.sandbox.example.com/auth/signin?code=...`.
3. O front passa a chamar a API pelo proxy. Nos logs:

```
# proxy
dns api-gateway.release.example.com -> <IP> (XXms)
POST /graphql -> 200

# dns
... udp api-gateway.release.example.com A -> NOERROR 1 resp. (XXms, N consultas upstream)
```

O login em si não aparece nos logs do DNS nem do proxy, porque o navegador fala direto com o Cognito.

### Passo 9 — Desfazer ao terminar (importante)

Enquanto o override estiver ativo, **esta máquina não alcança o admin sandbox de verdade**:

```bash
sudo rm -f /etc/resolver/admin.sandbox.example.com       # ou remova a linha do /etc/hosts
sudo dscacheutil -flushcache && sudo killall -HUP mDNSResponder
```

Deixar a entrada no `zones.json` é inofensivo se o sistema não estiver apontando para o servidor para esse nome.

O checklist completo do que desfazer (sistema, navegador, certificados, código, Cognito) está na **seção 10**.

## 5. Problemas comuns

**Primeiro, descubra em que camada está o problema.** Rode nesta ordem e pare no primeiro que falhar:

```bash
cat /etc/resolver/admin.sandbox.example.com           # nameserver 127.0.0.1 / port 5300
lsof -nP -iUDP:5300                                  # o servidor DNS está rodando?
npm run query -- admin.sandbox.example.com --server 127.0.0.1:5300   # o DNS responde 127.0.0.1 (aa)?
sudo dscacheutil -flushcache && sudo killall -HUP mDNSResponder
curl -sv https://admin.sandbox.example.com 2>&1 | grep -E "Connected to|issuer"   # o que o sistema enxerga
```

O `query` isola o servidor DNS da configuração do macOS: se ele responde certo e o `curl` não, o defeito está
entre o sistema e o servidor (arquivo do resolver, cache, VPN/proxy).

| Sintoma | Causa provável |
|---|---|
| O navegador abre o **site real** e o redirect do middleware parece "ir para o lugar errado" | O nome está resolvendo para o IP real. O caso do estudo: o `zones.json` em uso (de um zip novo) **não tinha** a entrada `admin.sandbox.example.com`. Confirme com o `query` do passo 3 e com o `curl` do passo 4 antes de mexer no código |
| O `curl` mostra IP real mesmo com o arquivo do resolver certo e o DNS respondendo 127.0.0.1 | Cache (faça o flush), VPN/proxy corporativo que resolve fora da máquina (`scutil --proxy`), ou DNS seguro (DoH) no navegador |
| `npm` dá `EPERM: operation not permitted, uv_cwd` | O terminal está numa pasta que foi apagada/substituída (por exemplo, ao extrair o zip por cima), ou o macOS negou acesso à pasta. Faça `cd ~` e entre de novo na pasta; se persistir, libere o terminal em *Ajustes do Sistema → Privacidade e Segurança → Arquivos e Pastas* |
| O navegador abre o site real (ou não acha o site) | O nome não resolve para 127.0.0.1: refaça o `ping`, limpe o cache, confira o arquivo em `/etc/resolver` e se o DNS está rodando |
| Alerta de certificado | `mkcert -install` não rodou, ou Firefox sem `nss`, ou certificado gerado para outro nome |
| `ERR_CONNECTION_REFUSED` em `https://admin.sandbox.example.com` | O nome resolve, mas **nada escuta na 443**: suba o `tls-proxy` (6A) ou o dev server em HTTPS (6B). Confira com `sudo lsof -nP -iTCP:443 -sTCP:LISTEN` |
| `tls-proxy` responde `502` | O front não está rodando na porta do `--target`, ou o IPv4/IPv6 não bate: use `--target 127.0.0.1:5555` |
| "Host not allowed" / "Invalid Host header" | Falta `allowedHosts` (ou equivalente) no dev server |
| `EACCES` ao subir na porta 443 | Porta privilegiada: `host: true`, `sudo` ou outro redirecionamento de porta |
| Erro do Cognito sobre `redirect_uri` | A URL enviada não é idêntica à cadastrada no app client |
| Proxy responde `403` | `ALLOWED_ORIGIN` diferente da origem exata do front (esquema, host e porta) |
| Proxy responde `502 (EAI_AGAIN)` | O servidor DNS não está rodando (suba o terminal 1 ou use `DNS_MODE=system`) |
| `401`/`403` vindo do gateway | A conexão funcionou; o problema é o token ou os headers |
| Erro de CORS no navegador | Origem diferente da permitida, ou header que o front envia fora da lista do proxy |
| Mudou o `zones.json` e nada mudou | JSON inválido: o servidor mantém a versão anterior e registra o erro no log do DNS |

## 6. Variações

**A. Callback em `localhost` (mais simples; o Cognito aceita HTTP só para localhost)**
- Cadastre `http://localhost:5555/auth/signin` no app client de dev e use essa URL como `redirect_uri`.
- Não precisa de override de DNS, certificado nem mudança no proxy (origem padrão `http://localhost:5555`).
- Abra o front por `localhost`, nunca por `127.0.0.1`: para o Cognito e para o CORS são nomes diferentes.

**B. Domínio falso `.test`**
- Cadastre `https://app.callback.test:5555/auth/signin`; o `.test` é reservado e nunca existirá na internet.
- `zones.json`: `"app.callback.test": { "A": "127.0.0.1" }`.
- macOS: `printf "nameserver 127.0.0.1\nport 5300\n" | sudo tee /etc/resolver/test` (vale para todo `*.test`).
- Certificado: `mkcert app.callback.test`; front na porta 5555 com HTTPS.
- Proxy: `ALLOWED_ORIGIN=https://app.callback.test:5555 npm run proxy`.
- Não testado: se o Cognito aceita um domínio `.test` no cadastro.

**C. Domínio real (este guia)** — a mais arriscada: veja os cuidados abaixo.

## 7. Cuidados

- **Desfaça o override** quando terminar (passo 9). Enquanto ele estiver ativo, esta máquina não alcança o admin
  sandbox de verdade.
- **Atualizar o projeto apaga as suas zonas.** O `zones.json` que vem no zip é o de exemplo. Guarde o seu fora da
  pasta do projeto ou faça backup antes de extrair por cima.
- **`tls-proxy` com `sudo`** roda como root e escuta a 443 em `127.0.0.1`; pare-o ao terminar.
- **Máquina corporativa:** VPN, proxy ou agentes de segurança podem interferir na resolução de nomes e nas portas.
- **Cookies reais:** o navegador acredita estar no domínio verdadeiro e envia ao servidor local os cookies que o
  site real tiver gravado. Fica na sua máquina, mas trate como dados reais.
- **Não cadastre `localhost` no app client de produção.** Use um client de desenvolvimento separado.
- **Chave privada do `mkcert`:** não versione e não compartilhe. A autoridade local só vale na sua máquina.
- **O servidor DNS escuta só em `127.0.0.1` de propósito.** Sem rate limiting, um resolver aberto vira vetor de
  amplificação (DDoS); não exponha na rede.
- **Talvez o proxy seja desnecessário** com o domínio real: o gateway provavelmente já permite a origem
  `https://admin.sandbox.example.com` (não verificado). Vale testar o front chamando o gateway direto.

## 8. Referência rápida de comandos

```bash
# projeto 3-3-Projetos-DNS-Proxy-TLS-Cognito-Callback-Local
npm run dns:trace                              # servidor DNS (porta 5300) com trace
ALLOWED_ORIGIN=https://admin.sandbox.example.com npm run proxy
npm run query -- admin.sandbox.example.com      # mini "dig" que consulta o servidor local
sudo "$(which node)" src/tls-proxy.js --cert C.pem --key K.pem --listen 443 --target 5555   # HTTPS -> Flutter
npm test                                       # 75 testes

# macOS
sudo dscacheutil -flushcache && sudo killall -HUP mDNSResponder
ping -c1 admin.sandbox.example.com
curl -sv https://admin.sandbox.example.com 2>&1 | grep -E "Connected to|issuer"   # IP + emissor do certificado
mkcert -install && mkcert admin.sandbox.example.com
```

## 9. Referências

- Regras de callback URL do app client do Cognito (HTTPS obrigatório, exceto `http://localhost`,
  `http://127.0.0.1` e `http://[::1]`; portas customizadas; sem fragmento; esquemas customizados):
  <https://docs.aws.amazon.com/sdk-for-kotlin/api/latest/cognitoidentityprovider/aws.sdk.kotlin.services.cognitoidentityprovider.model/-create-user-pool-client-request/callback-urls.html>
- Não confirmado nessa página: se a comparação do `redirect_uri` é exata e se há curingas. Confira na
  documentação de app clients do Cognito.
- RFC 6761 (nomes de uso especial: `.test`, `.localhost`, `.invalid`, `.example`) e RFC 1035 (DNS).

---

## 10. Checklist: tudo que precisa ser desfeito

Faça na ordem. Só o item 10.1 afeta o seu acesso ao site real; os demais são limpeza e segurança.
Verificado num Mac em 08/10/2026: o `rm` do resolver, o flush, o `ping` (volta ao IP real), a checagem do
`/etc/hosts` e o `lsof` (portas livres). Os demais itens (`sed`, `mkcert -uninstall`, limpeza do navegador,
Cognito) são instruções que não foram executadas durante o estudo.

### 10.1 Sistema (macOS) — obrigatório

- [ ] Remover o override de resolução (o arquivo em `/etc/resolver` e/ou as linhas do `/etc/hosts`)
- [ ] Limpar o cache de DNS do sistema
- [ ] Limpar o cache de DNS do navegador (Chrome: `chrome://net-internals/#dns` → *Clear host cache*; ou reinicie o navegador)
- [ ] Reativar o "DNS seguro" (DoH) do Chrome/Firefox, se você o desligou para o teste

```bash
# 1) faça um backup do hosts antes de editar
sudo cp /etc/hosts /etc/hosts.bak

# 2) remova os overrides (o -f ignora os que não existirem; /etc/resolver/test só existe se você usou a variação B)
sudo rm -f /etc/resolver/admin.sandbox.example.com /etc/resolver/test

# 3) remova as linhas do hosts, se você usou a opção B do passo 4 (no macOS o sed exige o '' depois do -i)
sudo sed -i '' -e '/admin\.sandbox\.example\.com/d' -e '/app\.callback\.test/d' /etc/hosts

# 4) limpe o cache de DNS do sistema
sudo dscacheutil -flushcache && sudo killall -HUP mDNSResponder
```

### 10.2 Navegador: dados do domínio

- [ ] Limpar os dados do site `admin.sandbox.example.com` (cookies, localStorage, sessionStorage)
- [ ] Em `chrome://serviceworker-internals` (ou F12 > Application > Service Workers), desregistrar qualquer service
  worker de `admin.sandbox.example.com`: apps Flutter web registram um e ele guarda cache do seu build local

O seu front local gravou tokens e estado sob a origem do site real. Sem limpar, o site verdadeiro pode ler esse
estado (e o contrário também aconteceu enquanto o override estava ativo). Tokens do Cognito de teste não devem
ficar misturados.

### 10.3 Processos e variáveis de ambiente

- [ ] Parar o front, o `tls-proxy` (rodou com `sudo`), o proxy e o servidor DNS (Ctrl-C em cada terminal)
- [ ] Conferir se `ALLOWED_ORIGIN`, `DNS_MODE` ou `DNS_SERVER` ficaram exportadas no shell ou no `~/.zshrc`
  (`env | grep -E "ALLOWED_ORIGIN|DNS_"`); no guia elas foram usadas só na linha de comando
- [ ] Remover qualquer regra de redirecionamento de porta (`pf`) que você tenha criado para a 443

### 10.4 Certificados

- [ ] Apagar a pasta `certs/` do projeto do front: ela contém a **chave privada** do certificado
- [ ] (opcional) Remover a autoridade local do `mkcert` dos repositórios de confiança:
  ```bash
  mkcert -uninstall                 # tira do Keychain (e do Firefox, se o nss estava instalado)
  rm -rf "$(mkcert -CAROOT)"        # só se não for usar mais: apaga a chave da CA local
  ```
  Atenção: remover a CA invalida **todos** os certificados do `mkcert` que você usa em outros projetos.
- [ ] (opcional) `brew uninstall mkcert nss`

### 10.5 Código do front

- [ ] Reverter o `vite.config.ts` (ou equivalente): `https`, `port: 443`, `host: true` e `allowedHosts`
- [ ] Flutter: voltar o `redirect_uri`, a base da API e as variáveis de ambiente que apontavam para o domínio
  real (`--dart-define`, `.env`, flavor); o `flutter run` em si não foi alterado
- [ ] Rodar `git diff` antes de commitar: não deixe caminhos de certificado, chave ou `host: true`
  (que expõe o dev server na rede local) irem para o repositório
- [ ] Se você rodou o dev server com `sudo`, arquivos de cache podem ter ficado com dono `root`
  (ex.: `node_modules/.vite`): `sudo chown -R "$USER" .` na pasta do front

### 10.6 Cognito

- [ ] Remover do app client de **dev** as callback e sign-out URLs que você adicionou só para este teste
  (se o site real já usava `https://admin.sandbox.example.com/...`, deixe como estava)
- [ ] Confirmar que nenhuma URL de `localhost` ou de domínio de teste foi parar no app client de **produção**

### 10.7 Projeto `3-3-Projetos-DNS-Proxy-TLS-Cognito-Callback-Local`

- [ ] (opcional) Remover do `zones.json` a entrada `admin.sandbox.example.com` e as de teste (ou guardar o arquivo
  para a próxima vez). Deixá-las é
  inofensivo se o sistema não aponta para o servidor, mas evita surpresas se alguém reaproveitar o arquivo
- [ ] Variação A (`localhost`): nada a desfazer além de parar os processos
- [ ] Variação B (`.test`): além do 10.1, remover o certificado de `app.callback.test` (10.4)

### 10.8 Verificação final

```bash
ls /etc/resolver 2>/dev/null                         # não deve listar os arquivos que você criou
grep -n "example\.com\|callback\.test" /etc/hosts           # sem nenhuma saída
ping -c1 admin.sandbox.example.com                    # deve mostrar o IP REAL, não 127.0.0.1
sudo lsof -nP -iTCP:443 -iTCP:5555 -iTCP:5556 -iUDP:5300 | grep -E "LISTEN|UDP"   # nenhum dos seus processos ainda escutando
```

Se o `ping` ainda mostrar `127.0.0.1`: repita o flush do 10.1, limpe o cache do navegador e reinicie-o.
Se mostrar um IP real, o site verdadeiro voltou a ser acessível. O IP muda (é um CDN): o importante é **não** ser
`127.0.0.1`.

---

## 11. Lições do estudo

1. **Quem resolve o nome é o navegador**, não o Cognito. Por isso o override de DNS local basta para "enganar"
   o redirect do login.
2. **Resolver e servir são problemas separados.** `ERR_CONNECTION_REFUSED` = o nome resolveu para a sua máquina
   mas ninguém escuta a porta. Abrir o site real = o nome não resolveu para a sua máquina.
3. **Isole as camadas**: `query --server` (o servidor DNS), `ping`/`dscacheutil` (o sistema), `curl -sv` (IP e
   certificado), log do `tls-proxy` (o navegador chegou?).
4. **`dig`/`nslookup` não passam pelo `/etc/resolver`**; `ping`, `curl` e o navegador passam.
5. **Zona local vence a internet**, e por isso uma entrada ausente no `zones.json` é silenciosa: o servidor só
   resolve o nome pela internet.
6. **Dev servers que falam HTTP (Flutter web)** ganham HTTPS com um terminador TLS na frente (`tls-proxy`),
   sem mexer no app. A 443 exige `sudo`.
7. **Overrides locais precisam de um plano de desfazer** (seção 10): enquanto ativos, você não alcança o site real.
