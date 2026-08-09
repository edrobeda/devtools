# Ideias para o devtools

Lista abrangente de possibilidades pra crescer o projeto. `[x]` = já existe
no projeto. `[ ]` = ainda não.

Serve como banco de ideias pra rodadas manuais ou pro agente noturno puxar
quando quiser fugir do óbvio (ver `.agent-prompt.md`).

## 📋 Código — formatadores, encoders, geradores

- [x] Decodificador de JWT — `/tools/jwt-decoder`
- [x] Explicador de expressão Cron (Cron Human Reader) — `/tools/cron-parser`
- [x] Gerador de Hash (MD5/SHA-1/256/384/512) — `/tools/hash-generator`
- [x] Formatador/Validador de JSON — `/tools/json-formatter`
- [x] Conversor de Cor (HEX/RGB/HSL) — `/tools/color-converter`
- [x] Conversor de Timestamp Unix — `/tools/timestamp-converter`
- [ ] Snippets favoritos/compartilháveis (biblioteca pessoal de trechos de código)
- [x] Regex Tester (com highlight de matches, inclui padrões comuns prontos: email, telefone, CPF, URL) — `/tools/regex-tester`
- [x] SQL Formatter — `/database/sql-formatter`
- [ ] XML Formatter
- [x] CSS Minify/Beautify — `/tools/css-formatter`
- [ ] YAML Formatter
- [ ] TOML Formatter
- [ ] Markdown Preview (ao vivo)
- [ ] Diff Checker (texto x texto, lado a lado)
- [x] JSON Diff (estrutural, não linha a linha) — `/data/json-diff`
- [x] Base64 Encode/Decode (texto e arquivo) — `/tools/base64-tool`
- [ ] URL Encode/Decode
- [x] HTML Entity Encode/Decode — `/tools/html-entity-encoder`
- [x] JWT Generator (pra testes, monta um JWT válido a partir de payload) — `/tools/jwt-generator`
- [x] JWT Timeline 🔥 (linha do tempo visual mostrando quando expira) — `/tools/jwt-timeline`
- [x] UUID Generator (v4, vários de uma vez) — `/tools/uuid-generator`
- [x] NanoID Generator — `/tools/nanoid-generator`
- [x] UUID Collision Simulator 🔥 — `/extras/uuid-collision-simulator`
- [x] HMAC Generator — `/tools/hmac-generator`
- [ ] Password Generator (com opções de comprimento/símbolos)
- [ ] Password Entropy Checker 🔥
- [x] Lorem Ipsum Generator — `/tools/lorem-ipsum-generator`
- [ ] Faker (nomes, CPF/CNPJ, endereços, emails, telefones)
- [ ] Faker Dataset Generator 🔥 (gera um CSV/JSON inteiro de dados fake)
- [x] Cron Expression Builder (visual, o inverso do que já existe) — `/tools/cron-builder`
- [ ] Cron Timeline 🔥 (mostra visualmente as próximas execuções numa linha do tempo)
- [ ] CSS Minify/Beautify
- [ ] JS Minify/Beautify
- [ ] HTML Minify/Beautify
- [x] JSON Path Explorer 🔥 (testa expressões JSONPath contra um JSON colado) — `/data/json-path-explorer`
- [x] Conversor de base numérica (bin/oct/dec/hex) — `/tools/base-converter`
- [x] Conversor de case (camelCase, snake_case, kebab-case, PascalCase, Title Case) — `/tools/case-converter`
- [x] Gerador de slug (texto → url-slug) — `/tools/slug-generator`
- [x] Conversor CSV ↔ JSON — `/data/csv-json-converter`
- [x] CSV/TSV → Tabela Markdown e HTML — `/data/csv-markdown-table`
- [x] Gerador/validador de CPF e CNPJ fake (dígitos verificadores corretos) — `/tools/cpf-cnpj-generator`
- [x] Comparador/validador de SemVer — `/tools/semver-comparator`
- [x] Validador de JSON Schema — `/data/json-schema-validator`
- [x] JSON Schema Generator (a partir de um JSON de exemplo)
- [x] Conversor JSON → YAML — `/data/json-to-yaml`
- [ ] Formatador de query GraphQL

## 🎨 Front-end — CSS, design, playgrounds

- [ ] CSS Playground
- [ ] Tailwind Playground
- [ ] Flexbox Builder (visual, interativo)
- [ ] Grid Builder (visual, interativo)
- [ ] Box Shadow Generator (visual, com camadas)
- [x] Border Radius Generator (cantos independentes) — `/frontend/border-radius-generator`
- [ ] Glassmorphism Generator
- [ ] Neumorphism Generator
- [ ] Gradient Generator
- [ ] SVG Background Generator
- [ ] SVG Blob Generator
- [x] SVG Wave Generator (ondas decorativas empilhadas em SVG, com data URI) — `/frontend/svg-wave-generator`
- [ ] SVG Icon Browser
- [ ] Google Fonts Preview
- [ ] Breakpoint Preview / Responsive Preview (site num iframe redimensionável)
- [ ] Favicon Generator
- [ ] OpenGraph Preview (como o link aparece ao compartilhar)
- [ ] CSS Animation Builder
- [ ] Keyframe Generator
- [x] CSS Specificity Calculator 🔥 — `/tools/css-specificity-calculator`
- [ ] CSS Performance Analyzer 🔥
- [x] Conversor de unidades CSS (px ↔ rem ↔ em ↔ vh/vw) — `/tools/css-unit-converter`
- [x] Checador de contraste de cores (WCAG AA/AAA) 🔥 — `/frontend/contrast-checker`
- [x] Gerador de paleta de cores a partir de uma cor base — `/frontend/palette-generator`

## 🌐 APIs

- [ ] REST Client (tipo mini Postman)
- [ ] GraphQL Playground
- [ ] WebSocket Tester
- [ ] SSE Tester (Server-Sent Events)
- [ ] Webhook Tester (recebe e mostra payloads)
- [ ] HTTP Header Inspector
- [x] cURL Generator (monta comando curl a partir de uma requisição) — `/apis/curl-generator`
- [ ] HTTP Request Replay 🔥
- [ ] Postman Import/Export
- [ ] OpenAPI Viewer
- [ ] API Mock Server instantâneo 🔥
- [ ] API Flow Designer 🔥 (desenha visualmente uma sequência de chamadas)
- [ ] Simulador de mock de resposta de API (cola um JSON, vira endpoint fake local)

## 🛠 Desenvolvimento & DevOps

- [ ] Environment Variables Manager
- [x] Parser/validador de arquivo `.env` — `/devops/env-tool`
- [ ] Docker Compose Generator
- [ ] Docker Compose Visualizer 🔥
- [x] Dockerfile Generator — `/devops/dockerfile-generator`
- [ ] Docker Logs Viewer
- [ ] Docker Layer Explorer 🔥
- [ ] Bundle Size Estimator 🔥
- [ ] nginx Config Generator
- [x] Caddyfile Generator — `/devops/caddyfile-generator`
- [ ] Apache Config Builder
- [ ] PM2 Config Generator
- [x] `.gitignore` Generator (por linguagem/framework) — `/devops/gitignore-generator`
- [ ] License Generator
- [ ] README Generator
- [ ] Changelog Generator (a partir de commits colados)
- [ ] Semantic Version Helper (quando sobe major/minor/patch)
- [x] Gerador de nome de branch git a partir de descrição de feature — `/devops/branch-name-generator`
- [x] Gerador de mensagem de commit (Conventional Commits) — `/devops/commit-message-generator`
- [x] Cheat sheet de comandos kubectl — `/devops/kubectl-commands`
- [ ] Git Commit Generator por IA 🔥
- [ ] GitHub Actions YAML Validator
- [ ] GitLab CI Validator
- [ ] Kubernetes Manifest Explorer
- [ ] Kubernetes YAML Validator
- [x] Editor de HTML com preview ao vivo (mini CodePen)
- [x] Timer Pomodoro — `/extras/pomodoro-timer`
- [ ] Teste de digitação (WPM)

## 💾 Banco de Dados

- [ ] SQL Runner
- [x] SQL Formatter / Query Formatter — `/database/sql-formatter`
- [ ] Explain Visualizer / SQL Explain Visualizer 🔥
- [ ] ER Diagram Generator
- [x] JSON → SQL Insert — `/database/json-to-sql`
- [ ] CSV → SQL / SQL → CSV
- [ ] SQL Data Generator 🔥
- [ ] Mongo Query Builder
- [ ] Redis Command Helper
- [ ] Redis TTL Simulator 🔥
- [x] Rate Limit Calculator 🔥 — `/database/rate-limit-calculator`

## ☁ Cloud

- [x] AWS ARN Parser — `/cloud/arn-parser`
- [ ] IAM Policy Visualizer
- [ ] S3 Policy Generator
- [ ] Cloudflare Rules Helper
- [ ] Docker Hub Tags (lookup de tags disponíveis de uma imagem)

## 🔒 Segurança

- [ ] CORS Tester
- [x] CSP Generator / CSP Validator — `/security/csp-generator` (só o gerador; validar uma CSP colada continua em aberto)
- [ ] SSL Checker
- [ ] Certificate Decoder
- [ ] CSR Generator
- [x] Robots.txt Generator — `/security/robots-txt-generator`
- [ ] Security Headers Checker
- [x] Checador de força de senha — `/security/password-strength`

## 📁 Arquivos & 📊 Dados

- [ ] CSV Viewer / Editor / Merge
- [ ] Excel Viewer
- [ ] PDF Metadata
- [ ] Image Compressor
- [ ] SVG Optimizer
- [ ] Image Metadata (EXIF)
- [ ] QR Code Generator (incl. QR pra Wi-Fi)
- [ ] Gerador/leitor de código de barras
- [ ] ZIP Preview
- [x] JSON Viewer / Tree Viewer — `/data/json-tree-viewer`
- [ ] XML Tree / YAML Tree

## 🌍 Rede

- [ ] IP Lookup
- [ ] DNS Lookup
- [ ] WHOIS
- [ ] Port Checker
- [ ] Ping / Traceroute
- [ ] HTTP Status Checker
- [ ] Redirect Checker
- [ ] User-Agent Parser
- [x] Calculadora de sub-rede IP (CIDR, máscara, range) — `/network/subnet-calculator`
- [ ] Simulador de latência de rede (throttling visual) 🔥
- [x] User-Agent Parser — infere navegador/OS/dispositivo de uma UA string — `/network/user-agent-parser`
- [x] Referência pesquisável de HTTP status codes
- [x] Lookup de MIME type por extensão — `/network/mime-lookup`

## 🤖 IA

- [ ] Prompt Library
- [ ] Prompt Variables / Versioning / Compare
- [x] Token Counter — `/ai/token-counter`
- [ ] Embedding Visualizer
- [ ] OpenAI Cost Calculator
- [x] Anthropic Cost Calculator — `/ai/anthropic-cost-calculator`
- [ ] Ollama Playground
- [ ] RAG Chunk Visualizer

## 📱 Mobile

- [ ] Android Intent Generator
- [x] Deep Link Tester — `/mobile/deep-link-tester`
- [ ] APK Manifest Viewer
- [ ] QR for App Links

## 🔤 Texto

- [ ] Case Converter
- [x] Remove Accents — `/text/remove-accents`
- [x] Remove Duplicates (linhas)
- [x] Sort Lines
- [x] Line Number Generator — coberto pelo `/text/lines-tool`
- [x] Contador de palavras/caracteres/linhas — `/text/word-counter`

## ✨ Estilos — componentes e padrões visuais (UI)

- [x] Glass Card (glassmorphism) — `/styles/glass-card`
- [x] Botão de Copiar Animado — `/styles/copy-button`
- [x] Skeleton Shimmer — `/styles/skeleton-shimmer`
- [x] Botão com Borda Gradiente Animada — `/styles/gradient-border-button`
- [ ] Botão neumórfico (soft UI)
- [x] Botão com efeito ripple ao clicar — `/styles/ripple-button`
- [ ] Botão com hover magnético (segue o cursor levemente)
- [x] Input com label flutuante (floating label) — `/styles/floating-label-input`
- [x] Input OTP (código de verificação, um dígito por caixa) — `/styles/otp-input`
- [ ] Input de busca com sugestões animadas
- [x] Loading: dots pulando (bouncing dots) — `/styles/bouncing-dots-loader`
- [ ] Loading: anel de progresso circular animado
- [ ] Card com efeito flip (vira ao clicar/hover)
- [ ] Card com hover-lift (sombra e elevação suave)
- [ ] Badge/tag com animação de entrada
- [x] Switch/toggle customizado (estilo iOS, ou com ícones) — `/styles/ios-toggle-switch`
- [ ] Tooltip customizado com seta e animação
- [ ] Modal com animação de entrada (scale/slide/fade combinados)
- [x] Toast/notificação estilizada com barra de progresso de auto-dismiss — `/styles/toast-notification`
- [ ] Dropdown/menu customizado com submenu animado
- [ ] Tabs com indicador animado deslizando
- [ ] Accordion customizado com altura animada
- [ ] Progress bar linear com gradiente animado
- [ ] Avatar com indicador de status (online/ausente/offline)
- [ ] Empty state ilustrado (SVG + texto)
- [x] Dark mode toggle animado (sol/lua) — `/styles/dark-mode-toggle`
- [x] Indicador de progresso de scroll da página — `/styles/scroll-progress-bar`
- [ ] Header sticky com efeito de blur ao rolar
- [ ] Texto com efeito de revelação (reveal on scroll)
- [x] Efeito de máquina de escrever (typewriter) — `/styles/typewriter-effect`
- [x] Efeito confete/celebração — `/styles/confetti-effect`
- [ ] Carrossel/marquee infinito
- [ ] Cursor customizado que reage a elementos interativos

## 🧩 Snippets — hooks, algoritmos, padrões de código

- [x] `useDebounce` — `/snippets/use-debounce`
- [x] `useLocalStorage` — `/snippets/use-local-storage`
- [x] `useClickOutside` — `/snippets/use-click-outside`
- [x] `useMediaQuery` — `/snippets/use-media-query`
- [ ] `useFetch`/`useAsync` — hook simples de requisição com loading/erro
- [x] `usePrevious` — guarda o valor anterior de uma prop/state — `/snippets/use-previous`
- [x] `useToggle` — boolean com toggle/set/reset — `/snippets/use-toggle`
- [x] `useCopyToClipboard` — copia texto com feedback de sucesso — `/snippets/use-copy-to-clipboard`
- [x] `useWindowSize` — largura/altura da janela reativas — `/snippets/use-window-size`
- [x] `useOnScreen` — Intersection Observer, sabe se um elemento está visível — `/snippets/use-on-screen`
- [x] `useKeyPress` — detecta tecla específica pressionada — `/snippets/use-key-press`
- [ ] `useInterval`/`useTimeout` declarativos (padrão Dan Abramov)
- [x] `useEventListener` genérico — `/snippets/use-event-listener`
- [x] `useThrottle` — `/snippets/use-throttle`
- [x] `useUndo` — histórico de estado com undo/redo — `/snippets/use-undo`
- [ ] Busca binária explicada com visualização passo a passo
- [ ] Quicksort visualizado (array animando durante a ordenação)
- [x] Implementação de debounce/throttle do zero (sem hook, só a função) — `/snippets/debounce-throttle-functions`
- [x] LRU cache implementado do zero — `/snippets/lru-cache`
- [ ] Memoização manual (padrão de cache de função)
- [x] Deep clone e deep equal implementados do zero
- [x] Fisher-Yates shuffle — `/snippets/fisher-yates-shuffle`
- [ ] Verificador de palíndromo (com variações: ignorar acentos/espaços)
- [ ] Fibonacci memoizado vs. não-memoizado (comparação de performance)

## 📚 Referências rápidas — cheat sheets, tabelas, atalhos

- [x] Atalhos de teclado do VSCode (Windows/Mac lado a lado) — `/references/vscode-shortcuts`
- [x] Comandos git essenciais (com exemplos) — `/references/git-commands`
- [ ] Comandos Docker/Docker Compose essenciais
- [x] Cheat sheet de Flexbox (visual, interativo) — `/references/flexbox-cheatsheet`
- [x] Cheat sheet de CSS Grid (visual, interativo) — `/references/css-grid-cheatsheet`
- [x] Atalhos do terminal/bash — `/references/bash-shortcuts`
- [x] Referência de sintaxe Markdown — `/references/markdown-syntax`
- [x] Comandos SQL essenciais — `/references/sql-commands`
- [x] npm vs yarn vs pnpm — tabela comparativa de comandos — `/references/package-manager-commands`
- [x] Conventional Commits — tabela de tipos e quando usar cada um — `/devops/commit-message-generator`
- [ ] Atalhos do DevTools do navegador
- [x] Tabela de métodos HTTP e quando usar cada um — `/references/http-methods`

## 💡 Fora da caixa / "diferentonas"

Itens que quase ninguém oferece — bons candidatos pra se destacar:

- [x] "Quantos dias até sexta" (ou até qualquer data escolhida) — `/extras/days-until`
- [x] Roleta/sorteio simples (ex.: "quem revisa esse PR") — `/extras/team-roulette`
- [x] CSS Specificity Calculator 🔥 *(ver também em Front-end)* — `/tools/css-specificity-calculator`
- [ ] SQL Explain Visualizer 🔥 *(ver também em Banco de Dados)*
- [ ] Docker Compose Visualizer 🔥 *(ver também em DevOps)*
- [ ] API Flow Designer 🔥 *(ver também em APIs)*
- [x] JWT Timeline 🔥 *(ver também em Código)* — `/tools/jwt-timeline`
- [ ] Redis TTL Simulator 🔥 *(ver também em Banco de Dados)*
- [ ] Rate Limit Calculator 🔥 *(ver também em Banco de Dados)*
- [ ] Password Entropy Checker 🔥 *(ver também em Código)*
- [ ] HTTP Request Replay 🔥 *(ver também em APIs)*
- [ ] Git Commit Generator por IA 🔥 *(ver também em DevOps)*
- [ ] API Mock Server instantâneo 🔥 *(ver também em APIs)*
- [ ] SQL Data Generator 🔥 / Faker Dataset Generator 🔥 *(ver também em Banco de Dados/Código)*
- [ ] Cron Timeline 🔥 *(ver também em Código)*
- [ ] UUID Collision Simulator 🔥 *(ver também em Código)*
- [ ] Docker Layer Explorer 🔥 *(ver também em DevOps)*
- [ ] CSS Performance Analyzer 🔥 *(ver também em Front-end)*
- [ ] Bundle Size Estimator 🔥 *(ver também em DevOps)*

---

Quando um item for implementado, marque `[x]` aqui também (além de
registrar no `CHANGELOG.md`), pra esse arquivo continuar sendo uma visão
confiável do que falta.
