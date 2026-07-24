# Changelog do devtools

Histórico do que o agente noturno (cron 00:00) adicionou em cada execução.
Lido por ele mesmo no início de cada rodada, pra nunca repetir algo que já
existe. Sem categorias fixas — cada rodada decide livremente o que faz
sentido adicionar (pode ser 1 item ou vários).

<!-- NOVAS ENTRADAS ENTRAM NO TOPO, formato:
## AAAA-MM-DD
- <tipo do item>: <nome> — <rota> (<descrição curta>)
-->

## 2026-07-24
- Ferramenta: Decodificador de JWT — `/tools/jwt-decoder` (decodifica header/payload de um JWT colado, mostra status de expiração via `exp`; tudo client-side, sem verificar assinatura)
- Estilo: Glass Card (glassmorphism) — `/styles/glass-card` (cartão translúcido com blur, borda sutil e sombra, mostrado sobre fundo gradiente; código-fonte exibido na própria página)
- Snippet: `useDebounce` — `/snippets/use-debounce` (hook em `src/hooks/useDebounce.js` que atrasa atualização de um valor até parar de mudar; página mostra o código, explicação e uma demo ao vivo com input)
