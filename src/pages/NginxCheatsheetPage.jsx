import React, { useCallback, useMemo, useState } from 'react'
import { Typography, Card, Space, Input, List, Tag, Radio, Alert, Button, message } from 'antd'
import { ReadOutlined, SearchOutlined, CodeOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const CATEGORIES = ['core', 'location', 'proxy', 'upstream', 'static', 'tls', 'sec', 'log']

const CATEGORY_COLOR = {
  core: 'blue',
  location: 'geekblue',
  proxy: 'cyan',
  upstream: 'purple',
  static: 'green',
  tls: 'magenta',
  sec: 'volcano',
  log: 'gold',
}

const labelOf = {
  core: { pt: 'Configuração & comandos', en: 'Config & commands' },
  location: { pt: 'location (matcher)', en: 'location matching' },
  proxy: { pt: 'Reverse proxy', en: 'Reverse proxy' },
  upstream: { pt: 'Load balancing', en: 'Load balancing' },
  static: { pt: 'Arquivos estáticos', en: 'Static files' },
  tls: { pt: 'HTTPS & TLS', en: 'HTTPS & TLS' },
  sec: { pt: 'Segurança & limites', en: 'Security & limits' },
  log: { pt: 'Logs', en: 'Logs' },
}

const ITEMS = [
  // ─── Configuração & comandos ──────────────────────────────────────────
  { code: 'nginx -t', cat: 'core',
    pt: 'Valida a configuração e imprime o caminho de cada arquivo lido — o PRIMEIRO passo antes de qualquer reload. Sai com exit 1 se houver erro de sintaxe.',
    en: 'Validates the config and prints the path of each file read — the FIRST step before any reload. Exits 1 on syntax errors.' },
  { code: 'nginx -s reload', cat: 'core',
    pt: 'Recarrega a configuração SEM downtime: o master relê os arquivos e os workers antigos terminam as requisições em andamento antes de morrer.',
    en: 'Reloads config with NO downtime: the master re-reads the files and old workers finish in-flight requests before dying.' },
  { code: 'nginx -s stop\nnginx -s quit', cat: 'core',
    pt: '`stop` derruba tudo na hora; `quit` é o encerramento gracioso (termina as requisições ativas antes de sair). No reload quebrado, `reopen` religa os logs.',
    en: '`stop` drops everything immediately; `quit` is the graceful shutdown (finishes active requests first). After a broken reload, `reopen` reopens the log files.' },
  { code: 'nginx -T', cat: 'core',
    pt: 'Despeja a configuração EFETIVA completa (já com todos os includes resolvidos) no stdout — o mesmo dump que o `nginx -t` aponta no erro.',
    en: 'Dumps the full EFFECTIVE config (with every include already resolved) to stdout — the same dump `nginx -t` points you to on error.' },
  { code: "nginx -g 'daemon off;'", cat: 'core',
    pt: 'Roda em foreground no PID 1 — o padrão dentro de container Docker (a imagem nginx oficial usa isso no entrypoint).',
    en: 'Runs in foreground as PID 1 — the standard pattern inside Docker containers (the official nginx image does this in its entrypoint).' },
  { code: 'server {\n    listen 80;\n    server_name example.com;\n    root /var/www/example;\n}', cat: 'core',
    pt: 'O esqueleto de um server block: `listen` a porta, `server_name` o domínio, `root` o diretório base. Cada site/domínio = um bloco desses.',
    en: 'The server block skeleton: `listen` the port, `server_name` the domain, `root` the base directory. Each site/domain = one of these blocks.' },
  { code: 'server_name example.com www.example.com;', cat: 'core',
    pt: 'Vários domínios no mesmo bloco. A precedência do matching: nome exato > curinga inicial `*.example.com` > curinga final `example.*` > regex `~^...$`.',
    en: 'Multiple domains in one block. Matching precedence: exact name > leading wildcard `*.example.com` > trailing wildcard `example.*` > regex `~^...$`.' },
  { code: 'listen 80 default_server;', cat: 'core',
    pt: 'O server que recebe qualquer request que não case com nenhum `server_name` — o bloco de fallback/erro 404 da sua stack.',
    en: 'The server that receives any request that matches no `server_name` — the fallback/404 block of your stack.' },
  { code: 'server_name _;', cat: 'core',
    pt: 'Nome curinga explícito pra "qualquer coisa" (em geral junto do `default_server`). Muito usado pra hospedar vários apps num só IP por host header.',
    en: 'Explicit catch-all name for "anything" (usually alongside `default_server`). Often used to host several apps on one IP by host header.' },
  { code: 'include /etc/nginx/conf.d/*.conf;', cat: 'core',
    pt: 'O bloco http que espalha a config em arquivos por site — cada `.conf` vira um `server {}`. Nginx é um include-tree: `main → http → server → location`.',
    en: 'The http block that splits the config into per-site files — each `.conf` becomes a `server {}`. nginx is an include-tree: `main → http → server → location`.' },

  // ─── location (matcher) ───────────────────────────────────────────────
  { code: 'location = /exato { ... }', cat: 'location',
    pt: 'Casamento EXATO: só aquele caminho literal. Maior precedência de todos — usado pra páginas críticas onde prefixo não pode enganar.',
    en: 'EXACT match: only that literal path. Highest precedence of all — used for critical pages where a prefix could mislead.' },
  { code: 'location ^~ /api/ { ... }', cat: 'location',
    pt: 'Prefixo que PARA a busca: casa o prefixo mais longo e NÃO testa mais regex depois. O jeito de "eu mando nesta parte da árvore".',
    en: 'Prefix that STOPS the search: matches the longest prefix and skips regex checks afterwards. The way to say "I own this part of the tree".' },
  { code: 'location ~ \\.php$ { ... }\nlocation ~* \\.(js|css|png)$ { ... }', cat: 'location',
    pt: 'Regex: `~` sensível a case, `~*` ignora. Testadas EM ORDEM de aparição, a primeira que casa vence. `~*` é o padrão pros assets estáticos.',
    en: 'Regex: `~` case-sensitive, `~*` case-insensitive. Tested IN ORDER of appearance, the first match wins. `~*` is the norm for static assets.' },
  { code: 'location /images/ { ... }', cat: 'location',
    pt: 'Prefixo simples (sem modificador): pega o prefixo MAIS LONGO, mas ainda testa as regex depois — é a menor prioridade entre os match.',
    en: 'Plain prefix (no modifier): takes the LONGEST prefix match, but regexes are still tested afterwards — the lowest priority of all matches.' },
  { code: 'location / { try_files $uri $uri/ /index.html; }', cat: 'location',
    pt: 'O fallback do SPA: tenta o arquivo, tenta o diretório, e no fim entrega o `index.html` (react-router/vue-router assumem a rota).',
    en: 'The SPA fallback: try the file, try the directory, and finally serve `index.html` (react-router/vue-router take over the route).' },
  { code: "location @fallback { ... }\n# referenciado via try_files ... @fallback", cat: 'location',
    pt: 'Location NOMEADO (prefixo `@`): nunca casado por request, só usado como alvo de `try_files`/`error_page` — bloco interno reutilizável.',
    en: 'NAMED location (`@` prefix): never matched by requests, only referenced from `try_files`/`error_page` — a reusable internal block.' },
  { code: 'location /api/ {\n    alias /srv/app/api/;\n}', cat: 'location',
    pt: '`alias` troca a parte casada do URI pelo caminho: `/api/users` → `/srv/app/api/users`. Diferente de `root`, que APENDA o URI inteiro ao caminho.',
    en: '`alias` swaps the matched URI part for the path: `/api/users` → `/srv/app/api/users`. Unlike `root`, which APPENDS the whole URI to the path.' },
  { code: "location /docs/ {\n    root /srv/app;\n}\n# /docs/guia.html -> /srv/app/docs/guia.html", cat: 'location',
    pt: '`root` mantém o URI no caminho final (a parte casada do location CONTINUA no arquivo). O erro clássico é usar `root` onde deveria ser `alias`.',
    en: '`root` keeps the URI in the final path (the matched location part REMAINS in the file path). The classic mistake is using `root` where `alias` was meant.' },

  // ─── Reverse proxy ────────────────────────────────────────────────────
  { code: "location /app/ {\n    proxy_pass http://127.0.0.1:8080;\n}", cat: 'proxy',
    pt: 'O proxy básico: sem URI no `proxy_pass`, o request vai INTEGRO pro backend (`/app/x` chega como `/app/x`).',
    en: 'Basic proxy: with no URI in `proxy_pass`, the request goes to the backend UNCHANGED (`/app/x` arrives as `/app/x`).' },
  { code: "location /app/ {\n    proxy_pass http://127.0.0.1:8080/;\n}\n# /app/x -> /x", cat: 'proxy',
    pt: 'Com URI (`/`) no `proxy_pass`, a parte casada do location É SUBSTITUÍDA: `/app/x` vira `/x`. É a diferença que decide se o backend enxerga o prefixo.',
    en: 'With a URI (`/`) in `proxy_pass`, the matched location part IS REPLACED: `/app/x` becomes `/x`. This difference decides whether the backend sees the prefix.' },
  { code: "proxy_set_header Host $host;\nproxy_set_header X-Real-IP $remote_addr;\nproxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\nproxy_set_header X-Forwarded-Proto $scheme;", cat: 'proxy',
    pt: 'O trio que o backend PRECISA pra enxergar o request real: `$host` do cabeçalho original, o IP do cliente e o esquema (http/https). Sem isso, o app vê só o nginx.',
    en: 'The trio the backend NEEDS to see the real request: `$host` from the original header, the client IP and the scheme. Without it the app only sees nginx.' },
  { code: 'proxy_pass http://upstream_servers;', cat: 'proxy',
    pt: 'Proxy pra um bloco `upstream` (abaixo) em vez de um endereço fixo — o load balancing entra aqui, com retry automático de servidor.',
    en: 'Proxy to an `upstream` block (below) instead of a fixed address — load balancing kicks in here, with automatic server retry.' },
  { code: 'proxy_http_version 1.1;\nproxy_set_header Connection "";', cat: 'proxy',
    pt: 'Habilita keep-alive do nginx pro backend (HTTP/1.1, sem header `Connection`), o pré-requisito pro `keepalive` do upstream funcionar.',
    en: 'Enables keep-alive from nginx to the backend (HTTP/1.1, no `Connection` header), the prerequisite for the upstream `keepalive` directive to work.' },
  { code: 'proxy_connect_timeout 5s;\nproxy_read_timeout 60s;', cat: 'proxy',
    pt: 'Timeouts do proxy: `connect` é a mão de TCP pro backend, `read` é a espera pela resposta. Um backend que segura request derruba o nginx se o timeout for curto demais.',
    en: 'Proxy timeouts: `connect` is the TCP handshake to the backend, `read` is the wait for a response. A backend that holds requests breaks nginx if the timeout is too short.' },
  { code: 'proxy_redirect http:// https://;', cat: 'proxy',
    pt: 'Reescreve o `Location:` de redirects do backend (ex.: http → https). Sem isso o navegador segue um redirect direto pro backend, pulando o nginx.',
    en: 'Rewrites the `Location:` of backend redirects (e.g. http → https). Without it the browser follows a redirect straight to the backend, bypassing nginx.' },

  // ─── Load balancing ───────────────────────────────────────────────────
  { code: 'upstream api {\n    server 10.0.0.1:3000;\n    server 10.0.0.2:3000;\n}', cat: 'upstream',
    pt: 'Um grupo de servidores de backend (o pool). O default é round-robin: um request pra cada em sequência, pesos iguais.',
    en: 'A backend server pool. Default is round-robin: one request to each in turn, equal weights.' },
  { code: 'upstream api {\n    least_conn;\n    server 10.0.0.1:3000;\n    server 10.0.0.2:3000;\n}', cat: 'upstream',
    pt: '`least_conn` manda pro servidor com MENOS conexões ativas — o certo quando o backend é IO-bound e a conexão custa (WebSocket, streams).',
    en: '`least_conn` sends to the server with the FEWEST active connections — right when the backend is connection-bound (WebSocket, streams).' },
  { code: 'upstream api {\n    ip_hash;\n    server 10.0.0.1:3000;\n    server 10.0.0.2:3000;\n}', cat: 'upstream',
    pt: '`ip_hash` prende o cliente ao MESMO servidor pelo hash do IP — "sticky session" sem cookie, o jeito cru de aguentar sessão em memória.',
    en: '`ip_hash` pins a client to the SAME server by IP hash — cookie-less "sticky session", the crude way to survive in-memory sessions.' },
  { code: 'upstream api {\n    server 10.0.0.1:3000 weight=3 max_fails=3 fail_timeout=30s;\n    server 10.0.0.2:3000;\n}', cat: 'upstream',
    pt: '`weight` divide a carga proporcional (3× pro primeiro); `max_fails` + `fail_timeout` tiram do pool um backend que falha 3× em 30s — o health-check passivo.',
    en: '`weight` splits load proportionally (3× to the first); `max_fails` + `fail_timeout` drop a backend that fails 3× in 30s from the pool — the passive health check.' },
  { code: 'upstream api {\n    keepalive 32;\n    server 10.0.0.1:3000;\n}\n# + proxy_http_version 1.1 + proxy_set_header Connection ""', cat: 'upstream',
    pt: '`keepalive` mantém conexões reutilizáveis do nginx pros backends (não é pro cliente!) — com HTTP/1.1 acima. Sem isso, cada request abre TCP novo.',
    en: '`keepalive` keeps reusable nginx→backend connections (not client-side!) — together with HTTP/1.1 above. Without it, each request opens a fresh TCP.' },
  { code: "server 10.0.0.1:3000 down;\nserver 10.0.0.1:3000 backup;", cat: 'upstream',
    pt: '`down` tira o servidor do pool manualmente (manutenção); `backup` só entra quando os principais caem — o failover "reserva quente".',
    en: '`down` removes a server from the pool manually (maintenance); `backup` only kicks in when the primaries are down — the "hot standby" failover.' },

  // ─── Arquivos estáticos ───────────────────────────────────────────────
  { code: 'gzip on;\ngzip_types text/plain text/css application/json application/javascript image/svg+xml;\ngzip_min_length 1024;', cat: 'static',
    pt: 'Compressão de resposta: o nginx gzipa na hora conforme o `Accept-Encoding`. Só os tipos listados e acima de 1 KB — binário/imagem já comprimido não ganha nada.',
    en: 'Response compression: nginx gzips on the fly based on `Accept-Encoding`. Only listed types and above 1 KB — already-compressed binaries gain nothing.' },
  { code: "location ~* \\.(js|css|png|jpg|woff2)$ {\n    expires 30d;\n    add_header Cache-Control \"public, immutable\";\n}", cat: 'static',
    pt: 'Cache de assets com hash no nome: `expires 30d` gera `Expires`+`Cache-Control: max-age`. `immutable` diz que a URL nunca muda — ideal pra builds versionados.',
    en: 'Hashed-asset caching: `expires 30d` emits `Expires`+`Cache-Control: max-age`. `immutable` tells browsers the URL never changes — ideal for versioned builds.' },
  { code: 'try_files $uri $uri/ =404;', cat: 'static',
    pt: 'Tenta na ordem: arquivo, diretório (com `index`), e o último é o fallback (aqui `=404`). A base do roteamento de qualquer site estático.',
    en: 'Tries in order: file, directory (with `index`), then the last arg is the fallback (here `=404`). The basis of any static site routing.' },
  { code: 'location / {\n    index index.html;\n    autoindex off;\n}', cat: 'static',
    pt: '`index` é o arquivo que serve quando o request é um diretório; `autoindex on` liga a listagem de diretórios (nunca deixe em produção).',
    en: '`index` is the file served when the request is a directory; `autoindex on` enables directory listing (never leave it on in production).' },
  { code: 'location /files/ {\n    alias /data/downloads/;\n}', cat: 'static',
    pt: 'Servir arquivos de FORA do `root` do site: o `alias` mapeia `/files/x` → `/data/downloads/x` sem expor o caminho real no URL.',
    en: 'Serve files from OUTSIDE the site `root`: `alias` maps `/files/x` → `/data/downloads/x` without exposing the real path in the URL.' },
  { code: 'sendfile on;\ntcp_nopush on;\ntcp_nodelay on;', cat: 'static',
    pt: 'O trio de performance pro tráfego de arquivo: `sendfile` entrega direto do disco (sem copiar pro user-space do nginx), `tcp_nopush` agrupa pacotes de resposta grande.',
    en: 'The file-traffic performance trio: `sendfile` serves straight from disk (no user-space copy through nginx), `tcp_nopush` coalesces large response packets.' },

  // ─── HTTPS & TLS ──────────────────────────────────────────────────────
  { code: "server {\n    listen 443 ssl;\n    server_name example.com;\n    ssl_certificate     /etc/nginx/certs/fullchain.pem;\n    ssl_certificate_key /etc/nginx/certs/privkey.pem;\n}", cat: 'tls',
    pt: 'O server HTTPS mínimo: `listen 443 ssl`, cert público (`fullchain` inclui a cadeia) e a chave privada. O resto (protocolos/ciphers) tem defaults razoáveis.',
    en: 'The minimal HTTPS server: `listen 443 ssl`, public cert (`fullchain` includes the chain) and the private key. The rest (protocols/ciphers) has sane defaults.' },
  { code: 'server {\n    listen 80;\n    server_name example.com;\n    return 301 https://$host$request_uri;\n}', cat: 'tls',
    pt: 'O redirect http→https canônico: `return 301` com o host e o URI originais. Um server block por domínio só pra isso.',
    en: 'The canonical http→https redirect: `return 301` with the original host and URI. One server block per domain just for this.' },
  { code: 'ssl_protocols TLSv1.2 TLSv1.3;', cat: 'tls',
    pt: 'Os protocolos aceitos — tire o TLSv1/1.1 de vez. TLS 1.3 (e 1.2) é o que o mundo moderno usa; o 1.0/1.1 virou risco.',
    en: 'The accepted protocols — drop TLSv1/1.1 for good. TLS 1.3 (and 1.2) is what the modern web uses; 1.0/1.1 became a risk.' },
  { code: 'add_header Strict-Transport-Security "max-age=31536000" always;', cat: 'tls',
    pt: 'HSTS: manda o browser SÓ falar HTTPS com o domínio pelo tempo indicado. O `always` garante que o header saia até em respostas de erro.',
    en: 'HSTS: tells the browser to ONLY talk HTTPS to the domain for the given time. The `always` keyword ensures the header goes out even on error responses.' },
  { code: 'ssl_ciphers HIGH:!aNULL:!MD5;', cat: 'tls',
    pt: 'A seleção de cipher suites (string estilo openssl). O default do nginx já é bom; mexa só quando uma auditoria pedir — escolha errada quebra clientes antigos.',
    en: 'The cipher suites selection (openssl-style string). nginx defaults are already good; only touch when an audit asks — a wrong pick breaks old clients.' },
  { code: 'ssl_session_cache shared:SSL:10m;\nssl_session_timeout 10m;', cat: 'tls',
    pt: 'Cache de sessão TLS compartilhado entre workers: o handshake completo não repete em cada request — corte grande de CPU no tráfego HTTPS.',
    en: 'Shared TLS session cache between workers: the full handshake is not repeated per request — a big CPU save on HTTPS traffic.' },

  // ─── Segurança & limites ──────────────────────────────────────────────
  { code: "limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;\n\nlocation /api/ {\n    limit_req zone=api burst=20 nodelay;\n}", cat: 'sec',
    pt: 'Rate limit por IP: a `zone` (memória 10m) guarda o contador e a taxa (10 req/s). `burst` tolera picos até 20 além da fila; `nodelay` não segura a fila.',
    en: 'Per-IP rate limit: the `zone` (10m memory) holds counters and the rate (10 req/s). `burst` tolerates spikes of up to 20 queued; `nodelay` skips the queue wait.' },
  { code: "limit_conn_zone $binary_remote_addr zone=conn:10m;\n\nlocation /downloads/ {\n    limit_conn conn 10;\n}", cat: 'sec',
    pt: 'Limite de conexões CONCORRENTES por IP — o freio pra download em massa e hotlink. Diferente do `limit_req`, que limita por tempo.',
    en: 'Concurrent-connection limit per IP — the brake for bulk downloads and hotlinking. Unlike `limit_req`, which limits by time.' },
  { code: "location /admin/ {\n    allow 192.168.1.0/24;\n    deny all;\n}", cat: 'sec',
    pt: 'ACL por IP: `allow` libera uma rede e `deny all` bloqueia o resto — firewallzinho no nível do nginx pra área administrativa.',
    en: 'IP ACL: `allow` permits a network and `deny all` blocks the rest — a mini-firewall at the nginx level for the admin area.' },
  { code: 'client_max_body_size 1m;', cat: 'sec',
    pt: 'Limite de upload por request. O erro clássico: o app reclama de request grande e o nginx respondeu `413 Request Entity Too Large` ANTES do app ver.',
    en: 'Upload limit per request. The classic gotcha: the app complains about a big request but nginx answered `413 Request Entity Too Large` BEFORE the app saw it.' },
  { code: "server_tokens off;", cat: 'sec',
    pt: 'Remove a versão do nginx do header `Server:` e das páginas de erro — a primeira linha de defesa contra fingerprinting do servidor.',
    en: 'Removes the nginx version from the `Server:` header and error pages — the first line of defense against server fingerprinting.' },
  { code: 'add_header X-Content-Type-Options "nosniff" always;\nadd_header X-Frame-Options "SAMEORIGIN" always;', cat: 'sec',
    pt: 'Headers de segurança no bloco http inteiro: `nosniff` impede MIME-sniffing, `SAMEORIGIN` bloqueia iframe de fora. `always` vale pra todos os status.',
    en: 'Security headers across the whole http block: `nosniff` blocks MIME sniffing, `SAMEORIGIN` stops off-site framing. `always` applies to every status.' },

  // ─── Logs ─────────────────────────────────────────────────────────────
  { code: "log_format main '$remote_addr - $remote_user [$time_local] \"$request\" '\n    '$status $body_bytes_sent \"$http_referer\" '\n    '\"$http_user_agent\" $request_time';", cat: 'log',
    pt: 'Definição de formato custom: cada `$variavel` é um campo. O `$request_time` (tempo de resposta em segundos) é ouro pra achar request lento.',
    en: 'Custom format definition: each `$variable` is a field. `$request_time` (response time in seconds) is gold for finding slow requests.' },
  { code: "access_log /var/log/nginx/access.log main;\naccess_log off;", cat: 'log',
    pt: 'Liga o access log num arquivo (com o formato `main` acima) ou DESLIGA — health-checks e assets estáticos poluem horrores; filtre com `map` se precisar manter.',
    en: 'Turns the access log on to a file (with the `main` format above) or OFF — health checks and static assets pollute a lot; filter with `map` if you must keep it.' },
  { code: 'error_log /var/log/nginx/error.log warn;', cat: 'log',
    pt: 'Log de erros por nível: `debug info notice warn error crit`. O `warn` é o equilíbrio do dia a dia — o `debug` é caro e verboso, só pra investigação pontual.',
    en: 'Error log by level: `debug info notice warn error crit`. `warn` is the daily sweet spot — `debug` is expensive and noisy, only for targeted investigation.' },
  { code: "map $status $loggable {\n    ~^[23] 0;\n    default 1;\n}\naccess_log /var/log/nginx/access.log main if=$loggable;", cat: 'log',
    pt: 'Access log CONDICIONAL: só registra 4xx/5xx. O jeito de despoluir o log sem desligar — health-check 200 some, erro fica.',
    en: 'CONDITIONAL access log: only records 4xx/5xx. The way to declutter without turning it off — 200 health checks disappear, errors stay.' },
  { code: 'nginx -s reopen', cat: 'log',
    pt: 'Reabre os arquivos de log — usado depois do `logrotate` pra quebrar o arquivo velho e começar um novo sem reiniciar o nginx.',
    en: 'Reopens the log files — used after `logrotate` to rotate the old file and start a fresh one without restarting nginx.' },
]

const translations = {
  pt: {
    title: 'Cheat Sheet de Nginx',
    intro: (
      <>
        <Text code>nginx</Text> como web server e reverse proxy — o arquivo{' '}
        <Text code>nginx.conf</Text>, os <Text code>location</Text> e os{' '}
        <Text code>server</Text> blocks que sustentam metade da internet. O
        irmão que faltava ao lado do{' '}
        <Text code>caddyfile-generator</Text> (Caddy, não nginx) e dos cheat
        sheets de <Text code>docker</Text>/<Text code>systemd</Text>: aqui é o
        servidor HTTP e proxy na frente da sua app.
      </>
    ),
    search: 'Buscar por diretiva, comando ou descrição...',
    all: 'Todas',
    empty: 'Nenhuma entrada encontrada. Tente outra busca ou categoria.',
    tipTitle: 'O que mais pega no nginx',
    tipBody: (
      <>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>location tem hierarquia.</Text> O{' '}
          <Text code>=</Text> exato e o <Text code>^~</Text> prefixo param a
          busca; os prefixos comuns usam o <Text code>MAIS LONGO</Text> e as
          regex (<Text code>~</Text>/<Text code>~*</Text>) são testadas em
          ordem de aparição — e qualquer regex que case{' '}
          <Text strong>vence</Text> o prefixo simples.
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>root ≠ alias.</Text>{' '}
          <Text code>root</Text> mantém o URI no caminho final;{' '}
          <Text code>alias</Text> substitui a parte casada. Usar um onde o
          outro deveria ser é o 404 mais difícil de debugar.
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>reload não derruba nada.</Text>{' '}
          <Text code>nginx -s reload</Text> re-lê a config e os workers
          antigos terminam o que estavam fazendo — o deploy de config sem
          downtime. Sempre <Text code>nginx -t</Text> antes.
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>proxy_pass tem duas formas.</Text> Sem URI, o request
          vai inteiro pro backend; com URI, a parte casada do location é{' '}
          substituída. E o backend só enxerga o cliente real se você mandar os
          headers <Text code>X-Forwarded-*</Text> e o{' '}
          <Text code>Host</Text> certos.
        </Paragraph>
        <Paragraph style={{ marginBottom: 0 }}>
          <Text strong>O nginx está na frente.</Text>{' '}
          <Text code>413</Text> de upload é o nginx, não o app;{' '}
          <Text code>server_tokens off</Text> esconde a versão; e o{' '}
          <Text code>$request_time</Text> no log acha o request lento antes
          de qualquer APM.
        </Paragraph>
      </>
    ),
    resultsOne: 'entrada encontrada',
    resultsMany: 'entradas encontradas',
    copy: 'Copiar como Markdown',
    copyCode: 'Copiar comando',
    copiedCode: 'Comando copiado',
    copiedList: 'Lista Markdown copiada',
    copyError: 'Não foi possível copiar',
  },
  en: {
    title: 'Nginx Cheat Sheet',
    intro: (
      <>
        <Text code>nginx</Text> as a web server and reverse proxy — the{' '}
        <Text code>nginx.conf</Text> file, the <Text code>location</Text> and{' '}
        <Text code>server</Text> blocks that sustain half the internet. The
        sibling that was missing next to the <Text code>caddyfile-generator</Text>{' '}
        (Caddy, not nginx) and the <Text code>docker</Text>/<Text code>systemd</Text>{' '}
        cheat sheets: here it's the HTTP server and proxy in front of your app.
      </>
    ),
    search: 'Search by directive, command or description...',
    all: 'All',
    empty: 'No entry found. Try a different search or category.',
    tipTitle: 'What trips people up the most',
    tipBody: (
      <>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>location has a hierarchy.</Text> The{' '}
          <Text code>=</Text> exact and <Text code>^~</Text> prefix stop the
          search; plain prefixes use the <Text code>LONGEST</Text> match and
          regexes (<Text code>~</Text>/<Text code>~*</Text>) are tested in
          order of appearance — and any matching regex{' '}
          <Text strong>beats</Text> a plain prefix.
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>root ≠ alias.</Text>{' '}
          <Text code>root</Text> keeps the URI in the final path;{' '}
          <Text code>alias</Text> replaces the matched part. Using one where
          the other is meant is the hardest 404 to debug.
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>reload drops nothing.</Text>{' '}
          <Text code>nginx -s reload</Text> re-reads the config and old
          workers finish what they were doing — downtime-free config deploys.
          Always <Text code>nginx -t</Text> first.
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>proxy_pass has two forms.</Text> Without a URI the
          request goes to the backend unchanged; with a URI, the matched
          location part is replaced. And the backend only sees the real client
          if you forward the <Text code>X-Forwarded-*</Text> headers and the
          right <Text code>Host</Text>.
        </Paragraph>
        <Paragraph style={{ marginBottom: 0 }}>
          <Text strong>nginx is in front.</Text>{' '}
          <Text code>413</Text> on upload is nginx, not the app;{' '}
          <Text code>server_tokens off</Text> hides the version; and the{' '}
          <Text code>$request_time</Text> in the log finds the slow request
          before any APM does.
        </Paragraph>
      </>
    ),
    resultsOne: 'entry found',
    resultsMany: 'entries found',
    copy: 'Copy as Markdown',
    copyCode: 'Copy command',
    copiedCode: 'Command copied',
    copiedList: 'Markdown list copied',
    copyError: 'Could not copy',
  },
}

export default function NginxCheatsheetPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [messageApi, messageContextHolder] = message.useMessage()

  const normalized = useCallback((s) => String(s).trim().toLowerCase(), [])

  const catCounts = useMemo(() => {
    const counts = { all: ITEMS.length }
    for (const cat of CATEGORIES) {
      counts[cat] = ITEMS.filter((it) => it.cat === cat).length
    }
    return counts
  }, [])

  const filtered = useMemo(() => {
    const q = normalized(query)
    return ITEMS.filter((it) => {
      if (category !== 'all' && it.cat !== category) return false
      if (!q) return true
      return (
        it.code.toLowerCase().includes(q) ||
        (it[lang] || '').toLowerCase().includes(q)
      )
    })
  }, [query, category, lang, normalized])

  const mdList = useMemo(() => {
    const header = '# nginx (cheat sheet)\n\n'
    const body = filtered
      .map((it) =>
        [
          `### ${labelOf[it.cat][lang]}`,
          '',
          '```nginx',
          it.code,
          '```',
          '',
          it[lang],
        ].join('\n')
      )
      .join('\n\n---\n\n')
    return header + body
  }, [filtered, lang])

  const copyCode = useCallback(
    async (code) => {
      try {
        await navigator.clipboard.writeText(code)
        messageApi.success(t.copiedCode)
      } catch {
        messageApi.error(t.copyError)
      }
    },
    [messageApi, t]
  )

  const copyMarkdown = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(mdList)
      messageApi.success(t.copiedList)
    } catch {
      messageApi.error(t.copyError)
    }
  }, [mdList, messageApi, t])

  const resultLabel = filtered.length === 1 ? t.resultsOne : t.resultsMany

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {messageContextHolder}
      <Title level={2}><ReadOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Alert
        type="warning"
        showIcon
        icon={<CodeOutlined />}
        message={t.tipTitle}
        description={t.tipBody}
      />

      <Space direction="vertical" style={{ width: '100%' }}>
        <Input
          prefix={<SearchOutlined />}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.search}
          allowClear
        />
        <Radio.Group value={category} onChange={(e) => setCategory(e.target.value)} optionType="button">
          <Radio.Button value="all">{t.all} ({catCounts.all})</Radio.Button>
          {CATEGORIES.map((cat) => (
            <Radio.Button key={cat} value={cat}>
              {labelOf[cat][lang]} ({catCounts[cat]})
            </Radio.Button>
          ))}
        </Radio.Group>
      </Space>

      <Space style={{ width: '100%', justifyContent: 'space-between', flexWrap: 'wrap', rowGap: 8 }}>
        <Text type="secondary">
          {filtered.length} {resultLabel}
        </Text>
        {filtered.length > 0 && (
          <Button size="small" icon={<CopyOutlined />} onClick={copyMarkdown}>
            {t.copy}
          </Button>
        )}
      </Space>

      <Card>
        <List
          dataSource={filtered}
          locale={{ emptyText: t.empty }}
          renderItem={(item) => (
            <List.Item key={`${item.cat}-${item.code}`}>
              <Space direction="vertical" size={6} style={{ width: '100%' }}>
                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                  <Tag color={CATEGORY_COLOR[item.cat]}>{labelOf[item.cat][lang]}</Tag>
                  <Button
                    size="small"
                    type="text"
                    icon={<CopyOutlined />}
                    title={t.copyCode}
                    onClick={() => copyCode(item.code)}
                  />
                </Space>
                <pre
                  style={{
                    margin: 0,
                    padding: '8px 12px',
                    background: '#f5f5f5',
                    borderRadius: 6,
                    fontSize: 12.5,
                    lineHeight: 1.65,
                    overflowX: 'auto',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    color: '#262626',
                  }}
                >
                  {item.code}
                </pre>
                <Text type="secondary">{item[lang]}</Text>
              </Space>
            </List.Item>
          )}
        />
      </Card>
    </Space>
  )
}
