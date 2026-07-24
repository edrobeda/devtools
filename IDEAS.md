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
- [ ] Regex Tester (com highlight de matches)
- [ ] Regex Library (padrões comuns prontos: email, telefone, CPF, URL)
- [ ] SQL Formatter
- [ ] XML Formatter
- [ ] YAML Formatter
- [ ] TOML Formatter
- [ ] Markdown Preview (ao vivo)
- [ ] Diff Checker (texto x texto, lado a lado)
- [ ] JSON Diff (estrutural, não linha a linha)
- [ ] Base64 Encode/Decode (texto e arquivo)
- [ ] URL Encode/Decode
- [ ] HTML Entity Encode/Decode
- [ ] JWT Generator (pra testes, monta um JWT válido a partir de payload)
- [ ] JWT Timeline 🔥 (linha do tempo visual mostrando quando expira)
- [ ] UUID Generator (v4, vários de uma vez)
- [ ] NanoID Generator
- [ ] UUID Collision Simulator 🔥
- [ ] HMAC Generator
- [ ] Password Generator (com opções de comprimento/símbolos)
- [ ] Password Entropy Checker 🔥
- [ ] Lorem Ipsum Generator
- [ ] Faker (nomes, CPF/CNPJ, endereços, emails, telefones)
- [ ] Faker Dataset Generator 🔥 (gera um CSV/JSON inteiro de dados fake)
- [ ] Cron Expression Builder (visual, o inverso do que já existe)
- [ ] Cron Timeline 🔥 (mostra visualmente as próximas execuções numa linha do tempo)
- [ ] CSS Minify/Beautify
- [ ] JS Minify/Beautify
- [ ] HTML Minify/Beautify
- [ ] JSON Path Explorer 🔥 (testa expressões JSONPath contra um JSON colado)
- [ ] Conversor de base numérica (bin/oct/dec/hex)
- [ ] Conversor de case (camelCase, snake_case, kebab-case, PascalCase, Title Case)
- [ ] Gerador de slug (texto → url-slug)
- [ ] Conversor CSV ↔ JSON
- [ ] Gerador/validador de CPF e CNPJ fake (dígitos verificadores corretos)
- [ ] Comparador/validador de SemVer
- [ ] Validador de JSON Schema
- [ ] JSON Schema Generator (a partir de um JSON de exemplo)
- [ ] Formatador de query GraphQL

## 🎨 Front-end — CSS, design, playgrounds

- [ ] CSS Playground
- [ ] Tailwind Playground
- [ ] Flexbox Builder (visual, interativo)
- [ ] Grid Builder (visual, interativo)
- [ ] Box Shadow Generator (visual, com camadas)
- [ ] Border Radius Generator (cantos independentes)
- [ ] Glassmorphism Generator
- [ ] Neumorphism Generator
- [ ] Gradient Generator
- [ ] SVG Background Generator
- [ ] SVG Blob Generator
- [ ] SVG Wave Generator
- [ ] SVG Icon Browser
- [ ] Google Fonts Preview
- [ ] Breakpoint Preview / Responsive Preview (site num iframe redimensionável)
- [ ] Favicon Generator
- [ ] OpenGraph Preview (como o link aparece ao compartilhar)
- [ ] CSS Animation Builder
- [ ] Keyframe Generator
- [ ] CSS Specificity Calculator 🔥
- [ ] CSS Performance Analyzer 🔥
- [ ] Conversor de unidades CSS (px ↔ rem ↔ em ↔ vh/vw)
- [ ] Checador de contraste de cores (WCAG AA/AAA) 🔥
- [ ] Gerador de paleta de cores a partir de uma cor base

## 🌐 APIs

- [ ] REST Client (tipo mini Postman)
- [ ] GraphQL Playground
- [ ] WebSocket Tester
- [ ] SSE Tester (Server-Sent Events)
- [ ] Webhook Tester (recebe e mostra payloads)
- [ ] HTTP Header Inspector
- [ ] cURL Generator (monta comando curl a partir de uma requisição)
- [ ] HTTP Request Replay 🔥
- [ ] Postman Import/Export
- [ ] OpenAPI Viewer
- [ ] API Mock Server instantâneo 🔥
- [ ] API Flow Designer 🔥 (desenha visualmente uma sequência de chamadas)
- [ ] Simulador de mock de resposta de API (cola um JSON, vira endpoint fake local)

## 🛠 Desenvolvimento & DevOps

- [ ] Environment Variables Manager
- [ ] Parser/validador de arquivo `.env`
- [ ] Docker Compose Generator
- [ ] Docker Compose Visualizer 🔥
- [ ] Dockerfile Generator
- [ ] Docker Logs Viewer
- [ ] Docker Layer Explorer 🔥
- [ ] Bundle Size Estimator 🔥
- [ ] nginx Config Generator
- [ ] Caddyfile Generator
- [ ] Apache Config Builder
- [ ] PM2 Config Generator
- [ ] `.gitignore` Generator (por linguagem/framework)
- [ ] License Generator
- [ ] README Generator
- [ ] Changelog Generator (a partir de commits colados)
- [ ] Semantic Version Helper (quando sobe major/minor/patch)
- [ ] Gerador de nome de branch git a partir de descrição de feature
- [ ] Gerador de mensagem de commit (Conventional Commits)
- [ ] Git Commit Generator por IA 🔥
- [ ] GitHub Actions YAML Validator
- [ ] GitLab CI Validator
- [ ] Kubernetes Manifest Explorer
- [ ] Kubernetes YAML Validator
- [ ] Editor de HTML com preview ao vivo (mini CodePen)
- [ ] Timer Pomodoro
- [ ] Teste de digitação (WPM)

## 💾 Banco de Dados

- [ ] SQL Runner
- [ ] SQL Formatter / Query Formatter
- [ ] Explain Visualizer / SQL Explain Visualizer 🔥
- [ ] ER Diagram Generator
- [ ] JSON → SQL Insert
- [ ] CSV → SQL / SQL → CSV
- [ ] SQL Data Generator 🔥
- [ ] Mongo Query Builder
- [ ] Redis Command Helper
- [ ] Redis TTL Simulator 🔥
- [ ] Rate Limit Calculator 🔥

## ☁ Cloud

- [ ] AWS ARN Parser
- [ ] IAM Policy Visualizer
- [ ] S3 Policy Generator
- [ ] Cloudflare Rules Helper
- [ ] Docker Hub Tags (lookup de tags disponíveis de uma imagem)

## 🔒 Segurança

- [ ] CORS Tester
- [ ] CSP Generator / CSP Validator
- [ ] SSL Checker
- [ ] Certificate Decoder
- [ ] CSR Generator
- [ ] Robots.txt Generator
- [ ] Security Headers Checker
- [ ] Checador de força de senha

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
- [ ] JSON Viewer / Tree Viewer
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
- [ ] Calculadora de sub-rede IP (CIDR, máscara, range)
- [ ] Simulador de latência de rede (throttling visual) 🔥
- [ ] Referência pesquisável de HTTP status codes
- [ ] Lookup de MIME type por extensão

## 🤖 IA

- [ ] Prompt Library
- [ ] Prompt Variables / Versioning / Compare
- [ ] Token Counter
- [ ] Embedding Visualizer
- [ ] OpenAI Cost Calculator
- [ ] Anthropic Cost Calculator
- [ ] Ollama Playground
- [ ] RAG Chunk Visualizer

## 📱 Mobile

- [ ] Android Intent Generator
- [ ] Deep Link Tester
- [ ] APK Manifest Viewer
- [ ] QR for App Links

## 🔤 Texto

- [ ] Case Converter
- [ ] Remove Accents
- [ ] Remove Duplicates (linhas)
- [ ] Sort Lines
- [ ] Line Number Generator
- [ ] Contador de palavras/caracteres/linhas

## ✨ Estilos — componentes e padrões visuais (UI)

- [x] Glass Card (glassmorphism) — `/styles/glass-card`
- [x] Botão de Copiar Animado — `/styles/copy-button`
- [x] Skeleton Shimmer — `/styles/skeleton-shimmer`
- [x] Botão com Borda Gradiente Animada — `/styles/gradient-border-button`
- [ ] Botão neumórfico (soft UI)
- [ ] Botão com efeito ripple ao clicar
- [ ] Botão com hover magnético (segue o cursor levemente)
- [ ] Input com label flutuante (floating label)
- [ ] Input OTP (código de verificação, um dígito por caixa)
- [ ] Input de busca com sugestões animadas
- [ ] Loading: dots pulando (bouncing dots)
- [ ] Loading: anel de progresso circular animado
- [ ] Card com efeito flip (vira ao clicar/hover)
- [ ] Card com hover-lift (sombra e elevação suave)
- [ ] Badge/tag com animação de entrada
- [ ] Switch/toggle customizado (estilo iOS, ou com ícones)
- [ ] Tooltip customizado com seta e animação
- [ ] Modal com animação de entrada (scale/slide/fade combinados)
- [ ] Toast/notificação estilizada com barra de progresso de auto-dismiss
- [ ] Dropdown/menu customizado com submenu animado
- [ ] Tabs com indicador animado deslizando
- [ ] Accordion customizado com altura animada
- [ ] Progress bar linear com gradiente animado
- [ ] Avatar com indicador de status (online/ausente/offline)
- [ ] Empty state ilustrado (SVG + texto)
- [ ] Dark mode toggle animado (sol/lua)
- [ ] Indicador de progresso de scroll da página
- [ ] Header sticky com efeito de blur ao rolar
- [ ] Texto com efeito de revelação (reveal on scroll)
- [ ] Efeito de máquina de escrever (typewriter)
- [ ] Efeito confete/celebração
- [ ] Carrossel/marquee infinito
- [ ] Cursor customizado que reage a elementos interativos

## 🧩 Snippets — hooks, algoritmos, padrões de código

- [x] `useDebounce` — `/snippets/use-debounce`
- [x] `useLocalStorage` — `/snippets/use-local-storage`
- [x] `useClickOutside` — `/snippets/use-click-outside`
- [x] `useMediaQuery` — `/snippets/use-media-query`
- [ ] `useFetch`/`useAsync` — hook simples de requisição com loading/erro
- [ ] `usePrevious` — guarda o valor anterior de uma prop/state
- [ ] `useToggle` — boolean com toggle/set/reset
- [ ] `useCopyToClipboard` — copia texto com feedback de sucesso
- [ ] `useWindowSize` — largura/altura da janela reativas
- [ ] `useOnScreen` — Intersection Observer, sabe se um elemento está visível
- [ ] `useKeyPress` — detecta tecla específica pressionada
- [ ] `useInterval`/`useTimeout` declarativos (padrão Dan Abramov)
- [ ] `useEventListener` genérico
- [ ] `useThrottle`
- [ ] `useUndo` — histórico de estado com undo/redo
- [ ] Busca binária explicada com visualização passo a passo
- [ ] Quicksort visualizado (array animando durante a ordenação)
- [ ] Implementação de debounce/throttle do zero (sem hook, só a função)
- [ ] LRU cache implementado do zero
- [ ] Memoização manual (padrão de cache de função)
- [ ] Deep clone e deep equal implementados do zero
- [ ] Fisher-Yates shuffle
- [ ] Verificador de palíndromo (com variações: ignorar acentos/espaços)
- [ ] Fibonacci memoizado vs. não-memoizado (comparação de performance)

## 📚 Referências rápidas — cheat sheets, tabelas, atalhos

*(categoria ainda sem nenhum item — boa candidata pra próximas rodadas)*

- [ ] Atalhos de teclado do VSCode (Windows/Mac lado a lado)
- [ ] Comandos git essenciais (com exemplos)
- [ ] Comandos Docker/Docker Compose essenciais
- [ ] Cheat sheet de Flexbox (visual, interativo)
- [ ] Cheat sheet de CSS Grid (visual, interativo)
- [ ] Atalhos do terminal/bash
- [ ] Referência de sintaxe Markdown
- [ ] Comandos SQL essenciais
- [ ] npm vs yarn vs pnpm — tabela comparativa de comandos
- [ ] Conventional Commits — tabela de tipos e quando usar cada um
- [ ] Atalhos do DevTools do navegador
- [ ] Tabela de métodos HTTP e quando usar cada um

## 💡 Fora da caixa / "diferentonas"

Itens que quase ninguém oferece — bons candidatos pra se destacar:

- [ ] "Quantos dias até sexta" (ou até qualquer data escolhida)
- [ ] Roleta/sorteio simples (ex.: "quem revisa esse PR")
- [ ] CSS Specificity Calculator 🔥 *(ver também em Front-end)*
- [ ] SQL Explain Visualizer 🔥 *(ver também em Banco de Dados)*
- [ ] Docker Compose Visualizer 🔥 *(ver também em DevOps)*
- [ ] API Flow Designer 🔥 *(ver também em APIs)*
- [ ] JWT Timeline 🔥 *(ver também em Código)*
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
