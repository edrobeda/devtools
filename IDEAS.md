# Ideias para o devtools

Lista abrangente de possibilidades pra crescer o projeto — ferramentas,
estilos, snippets, referências e qualquer outra coisa útil pra quem
desenvolve. `[x]` = já existe no projeto. `[ ]` = ainda não.

Serve como banco de ideias pra rodadas manuais ou pro agente noturno puxar
quando quiser fugir do óbvio (ver `.agent-prompt.md`).

## Ferramentas — geradores, conversores, validadores, calculadoras

- [x] Decodificador de JWT — `/tools/jwt-decoder`
- [x] Explicador de expressão Cron — `/tools/cron-parser`
- [x] Gerador de Hash (SHA-1/256/384/512) — `/tools/hash-generator`
- [x] Formatador/Validador de JSON — `/tools/json-formatter`
- [x] Conversor de Cor (HEX/RGB/HSL) — `/tools/color-converter`
- [x] Conversor de Timestamp — `/tools/timestamp-converter`
- [ ] Gerador/validador de CPF e CNPJ fake (dígitos verificadores corretos)
- [ ] Gerador de UUID/GUID (v4, com opção de vários de uma vez)
- [ ] Gerador de senha aleatória (com opções de comprimento/símbolos)
- [ ] Gerador de Lorem Ipsum (parágrafos/palavras/frases)
- [ ] Base64 encode/decode (texto e arquivo)
- [ ] URL encode/decode
- [ ] HTML entity encode/decode
- [ ] Testador/construtor de regex com highlight de matches
- [ ] Preview de Markdown ao vivo
- [ ] Conversor de unidades CSS (px ↔ rem ↔ em ↔ vh/vw), com base configurável
- [ ] Diff checker (comparação de dois textos, lado a lado)
- [ ] Conversor JSON ↔ YAML ↔ XML
- [ ] Formatador de SQL
- [ ] Conversor de base numérica (binário/octal/decimal/hexadecimal)
- [ ] Conversor de case (camelCase, snake_case, kebab-case, PascalCase, Title Case)
- [ ] Contador de palavras/caracteres/linhas com estatísticas de leitura
- [ ] Gerador de slug (texto → url-slug)
- [ ] Conversor CSV ↔ JSON
- [ ] Gerador de QR code
- [ ] Gerador/leitor de código de barras
- [ ] Gerador de `.gitignore` por linguagem/framework
- [ ] Validador/formatador de `docker-compose.yml`
- [ ] Calculadora de sub-rede IP (CIDR, máscara, range)
- [ ] Parser de User-Agent (identifica navegador/OS/dispositivo)
- [ ] Referência pesquisável de HTTP status codes (com descrição)
- [ ] Lookup de MIME type por extensão
- [ ] Comparador/validador de SemVer
- [ ] Gerador de dados fake (nomes, emails, endereços, telefones — além do CPF/CNPJ)
- [ ] Parser/validador de arquivo `.env`
- [ ] Validador de JSON Schema
- [ ] Formatador de query GraphQL
- [ ] Minificador/formatador de JS/CSS colado
- [ ] Gerador de paleta de cores a partir de uma cor base
- [ ] Gerador de gradiente CSS (visual, com preview)
- [ ] Gerador de `box-shadow` (visual, com preview e camadas)
- [ ] Gerador/visualizador de `border-radius` (todos os cantos independentes)
- [ ] Checador de contraste de cores (acessibilidade, WCAG AA/AAA)
- [ ] Checador de força de senha
- [ ] Calculadora de diferença entre datas
- [ ] Conversor de fuso horário (vários fusos lado a lado)
- [ ] Gerador de nome de branch git a partir de uma descrição de feature
- [ ] Gerador de mensagem de commit seguindo Conventional Commits
- [ ] Simulador de mock de resposta de API (cola um JSON, vira endpoint fake local)
- [ ] Editor de HTML com preview ao vivo (tipo mini CodePen)
- [ ] Timer Pomodoro
- [ ] Teste de digitação (WPM)

## Estilos — componentes e padrões visuais

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
- [ ] Efeito confete/celebração (ex.: ao completar uma ação)
- [ ] Carrossel/marquee infinito (logos, texto)
- [ ] Cursor customizado que reage a elementos interativos

## Snippets — hooks, algoritmos, padrões de código

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

## Referências rápidas — cheat sheets, tabelas, atalhos

*(categoria ainda sem nenhum item — boa candidata pra próximas rodadas)*

- [ ] Atalhos de teclado do VSCode (Windows/Mac lado a lado)
- [ ] Comandos git essenciais (com exemplos)
- [ ] Comandos Docker/Docker Compose essenciais
- [ ] Cheat sheet de regex (padrões comuns: email, telefone, CPF, URL)
- [ ] Cheat sheet de Flexbox (visual, interativo)
- [ ] Cheat sheet de CSS Grid (visual, interativo)
- [ ] Atalhos do terminal/bash
- [ ] Referência de sintaxe Markdown
- [ ] Comandos SQL essenciais
- [ ] npm vs yarn vs pnpm — tabela comparativa de comandos
- [ ] Conventional Commits — tabela de tipos e quando usar cada um
- [ ] Semantic Versioning — quando sobe major/minor/patch
- [ ] Atalhos do DevTools do navegador
- [ ] Tabela de métodos HTTP e quando usar cada um
- [ ] Códigos de status HTTP organizados por categoria com exemplos de uso

## Ideias fora da caixa

- [ ] "Quantos dias até sexta" (ou até qualquer data escolhida)
- [ ] Simulador de latência de rede (throttling visual de uma requisição)
- [ ] Visualizador de JWT com cada parte destacada em cor diferente
- [ ] Roleta/sorteio simples (ex.: "quem revisa esse PR")
- [ ] Gerador de changelog a partir de uma lista de commits colada

---

Quando um item for implementado, marque `[x]` aqui também (além de
registrar no `CHANGELOG.md`), pra esse arquivo continuar sendo uma visão
confiável do que falta.
