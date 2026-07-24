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
- Ferramenta: Explicador de Expressão Cron — `/tools/cron-parser` (parser próprio de expressões cron de 5 campos com suporte a `*`, `,`, `-`, `/`, nomes de mês/dia e atalhos `@daily`/`@hourly`/etc.; gera descrição em português e lista as próximas 5 execuções, respeitando a regra OR entre dia-do-mês e dia-da-semana quando ambos são restritos)
- Ferramenta: Gerador de Hash — `/tools/hash-generator` (calcula SHA-1/256/384/512 de um texto via `crypto.subtle`, com botão de copiar por hash; tudo local, nenhum dado sai do navegador)
- Estilo: Botão de Copiar Animado — `/styles/copy-button` (componente `CopyButton` reutilizável com micro-interação de ícone copiar → check via transição CSS de escala/rotação; código-fonte exibido na página)
- Snippet: `useLocalStorage` — `/snippets/use-local-storage` (hook em `src/hooks/useLocalStorage.js` que sincroniza estado com `localStorage`; página mostra o código e uma demo com input e contador que persistem entre reloads)
- Ferramenta: Decodificador de JWT — `/tools/jwt-decoder` (decodifica header/payload de um JWT colado, mostra status de expiração via `exp`; tudo client-side, sem verificar assinatura)
- Estilo: Glass Card (glassmorphism) — `/styles/glass-card` (cartão translúcido com blur, borda sutil e sombra, mostrado sobre fundo gradiente; código-fonte exibido na própria página)
- Snippet: `useDebounce` — `/snippets/use-debounce` (hook em `src/hooks/useDebounce.js` que atrasa atualização de um valor até parar de mudar; página mostra o código, explicação e uma demo ao vivo com input)
