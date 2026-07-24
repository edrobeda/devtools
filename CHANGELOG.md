# Changelog do devtools

Histórico do que o agente noturno (cron 00:00) adicionou em cada execução.
Lido por ele mesmo no início de cada rodada, pra nunca repetir algo que já
existe. Sem categorias fixas — cada rodada decide livremente o que faz
sentido adicionar (pode ser 1 item ou vários).

<!-- NOVAS ENTRADAS ENTRAM NO TOPO, formato:
## AAAA-MM-DD
- <tipo do item>: <nome> — <rota> (<descrição curta>)
-->

## 2026-07-24 (pontapé inicial de categorias)
Rodada especial: cobre as 13 categorias que estavam totalmente zeradas em `IDEAS.md` (incluindo Front-end, que também não tinha nenhum `[x]`), pegando um item de cada uma. Categorias já com itens (Código, Estilos, Snippets) foram puladas de propósito. Nenhuma categoria precisou ser abandonada — todos os itens escolhidos são 100% client-side.
- Front-end: Checador de Contraste de Cores (WCAG) — `/frontend/contrast-checker` (calcula razão de contraste via luminância relativa entre duas cores e mostra se passa AA/AAA pra texto normal/grande, fórmula da própria spec WCAG)
- APIs: Gerador de comando cURL — `/apis/curl-generator` (monta um comando `curl` a partir de método, URL, headers e corpo digitados num formulário; nunca dispara uma requisição de verdade, só gera o texto)
- DevOps: Gerador de .gitignore — `/devops/gitignore-generator` (combina templates embutidos — Node, Python, Java, React, macOS, Windows, VSCode, IntelliJ, Docker, Terraform — removendo linhas duplicadas)
- Banco de Dados: Calculadora de Rate Limit — `/database/rate-limit-calculator` (converte um limite de requisições por janela em taxa por segundo/minuto/hora/dia, intervalo mínimo entre requisições e burst máximo num esquema fixed window)
- Cloud: AWS ARN Parser — `/cloud/arn-parser` (decompõe um ARN colado em partition/service/region/account/resource type/resource id)
- Segurança: Checador de Força de Senha — `/security/password-strength` (estima entropia em bits a partir do alfabeto usado e um tempo aproximado de quebra por força bruta; senha nunca sai do navegador)
- Arquivos & Dados: Visualizador de Árvore JSON — `/data/json-tree-viewer` (renderiza um JSON colado como árvore colapsável via componente `Tree` do Ant Design)
- Rede: Calculadora de Sub-rede IP (CIDR) — `/network/subnet-calculator` (calcula máscara, wildcard, endereço de rede, broadcast, range de hosts utilizáveis e total de endereços a partir de operações de bits)
- IA: Calculadora de Custo Anthropic — `/ai/anthropic-cost-calculator` (estima custo de uma requisição por modelo Claude e quantidade de tokens de entrada/saída, com suporte a escrita/leitura de prompt cache; preços fixos embutidos na página, podem ficar desatualizados)
- Mobile: Testador de Deep Link — `/mobile/deep-link-tester` (parseia uma URL/deep link — esquema customizado ou universal link — em scheme/host/path/query params via `URL` do navegador, com botão pra tentar abrir)
- Texto: Contador de Palavras/Caracteres/Linhas — `/text/word-counter` (conta palavras, caracteres com/sem espaço, linhas, frases aproximadas e tempo de leitura estimado enquanto digita)
- Referências: Comandos Git Essenciais — `/references/git-commands` (cheat sheet pesquisável dos comandos git mais usados, com descrição PT/EN de cada um)
- Fora da caixa: Quantos dias até... — `/extras/days-until` (contagem regressiva ao vivo até uma data escolhida, padrão próxima sexta-feira às 18h)
- Ajuste: `AppLayout.jsx` ganhou 13 grupos de menu novos (um por categoria), `routes.jsx` ganhou as 13 rotas correspondentes, `package.json` passou a declarar `dayjs` explicitamente (já vinha como dependência transitiva do Ant Design, usado direto na página de contagem regressiva)

## 2026-07-24 (rodada 2)
- Ferramenta: Conversor de Timestamp — `/tools/timestamp-converter` (converte timestamp Unix em segundos ou milissegundos, com detecção automática da unidade, para data local e UTC ISO 8601; e o caminho inverso, de um `DatePicker` para timestamp em segundos/ms, com botão "usar agora" e copiar; tudo client-side via `Date`)
- Estilo: Botão com Borda Gradiente Animada — `/styles/gradient-border-button` (contorno em `conic-gradient` girando continuamente via `@keyframes` e variável CSS `--gradient-angle`, usando pseudo-elementos `::before`/`::after`; sem biblioteca de animação; código-fonte exibido na página)
- Snippet: `useMediaQuery` — `/snippets/use-media-query` (hook em `src/hooks/useMediaQuery.js` que retorna se uma media query CSS está ativa e atualiza sozinho via `window.matchMedia`/evento `change`; página mostra o código e uma demo ao vivo com breakpoint mobile/desktop e preferência de tema do sistema)
- Ajuste: `HomePage.jsx` ganhou uma esteira animada em SVG explicando que o devtools cresce sozinho todas as noites (sem rota nova, só redesign do texto/visual da Home, PT/EN mantido)

## 2026-07-24 (retrofit)
- Todas as páginas existentes em `src/pages/` (exceto `NotFoundPage.jsx`) ganharam suporte PT/EN, seguindo o padrão local `translations = { pt, en }` + `useLanguage()` já usado em `HomePage.jsx`.

## 2026-07-24
- Ferramenta: Formatador e Validador de JSON — `/tools/json-formatter` (formata com indentação, minifica e valida sintaxe via `JSON.parse`/`JSON.stringify`, mostra contagem de chaves e tamanho em bytes, com botão de copiar; tudo client-side)
- Ferramenta: Conversor de Cor — `/tools/color-converter` (converte HEX ↔ RGB ↔ HSL em tempo real a partir de um seletor de cor nativo ou input de texto, com swatch de preview e botão de copiar por formato)
- Estilo: Skeleton Shimmer — `/styles/skeleton-shimmer` (placeholder de carregamento com brilho animado via gradiente CSS e `@keyframes`, alternativa mais viva ao `Skeleton` padrão do Ant Design; demo com toggle carregando/carregado e código-fonte exibido na página)
- Snippet: `useClickOutside` — `/snippets/use-click-outside` (hook em `src/hooks/useClickOutside.js` que dispara um callback ao clicar fora de um elemento via `ref`, útil pra fechar dropdowns/menus customizados; página mostra o código e uma demo com um menu que fecha ao clicar fora)
- Ferramenta: Explicador de Expressão Cron — `/tools/cron-parser` (parser próprio de expressões cron de 5 campos com suporte a `*`, `,`, `-`, `/`, nomes de mês/dia e atalhos `@daily`/`@hourly`/etc.; gera descrição em português e lista as próximas 5 execuções, respeitando a regra OR entre dia-do-mês e dia-da-semana quando ambos são restritos)
- Ferramenta: Gerador de Hash — `/tools/hash-generator` (calcula SHA-1/256/384/512 de um texto via `crypto.subtle`, com botão de copiar por hash; tudo local, nenhum dado sai do navegador)
- Estilo: Botão de Copiar Animado — `/styles/copy-button` (componente `CopyButton` reutilizável com micro-interação de ícone copiar → check via transição CSS de escala/rotação; código-fonte exibido na página)
- Snippet: `useLocalStorage` — `/snippets/use-local-storage` (hook em `src/hooks/useLocalStorage.js` que sincroniza estado com `localStorage`; página mostra o código e uma demo com input e contador que persistem entre reloads)
- Ferramenta: Decodificador de JWT — `/tools/jwt-decoder` (decodifica header/payload de um JWT colado, mostra status de expiração via `exp`; tudo client-side, sem verificar assinatura)
- Estilo: Glass Card (glassmorphism) — `/styles/glass-card` (cartão translúcido com blur, borda sutil e sombra, mostrado sobre fundo gradiente; código-fonte exibido na própria página)
- Snippet: `useDebounce` — `/snippets/use-debounce` (hook em `src/hooks/useDebounce.js` que atrasa atualização de um valor até parar de mudar; página mostra o código, explicação e uma demo ao vivo com input)
