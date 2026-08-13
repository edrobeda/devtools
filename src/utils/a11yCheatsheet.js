// Dados da referência de acessibilidade web (a11y).
// 100% client-side; textos em pt/en para suporte bilíngue da página.

export const CATEGORIES = [
  'landmarks',
  'roles',
  'states',
  'focus',
  'forms',
  'media',
  'color',
  'semantics',
  'sr',
  'testing',
]

export const CATEGORY_COLOR = {
  landmarks: 'geekblue',
  roles: 'purple',
  states: 'magenta',
  focus: 'volcano',
  forms: 'gold',
  media: 'cyan',
  color: 'green',
  semantics: 'blue',
  sr: 'lime',
  testing: 'orange',
}

export const labelOf = {
  landmarks: { pt: 'Landmarks', en: 'Landmarks' },
  roles: { pt: 'Roles ARIA', en: 'ARIA Roles' },
  states: { pt: 'Estados e Propriedades ARIA', en: 'ARIA States & Properties' },
  focus: { pt: 'Foco e Teclado', en: 'Focus & Keyboard' },
  forms: { pt: 'Formulários', en: 'Forms' },
  media: { pt: 'Imagens e Mídia', en: 'Images & Media' },
  color: { pt: 'Cor e Contraste', en: 'Color & Contrast' },
  semantics: { pt: 'Semântica HTML', en: 'HTML Semantics' },
  sr: { pt: 'Leitores de Tela', en: 'Screen Readers' },
  testing: { pt: 'Testes', en: 'Testing' },
}

export const ITEMS = [
  // Landmarks
  {
    cat: 'landmarks',
    code: '<header> ... </header>',
    pt: 'Landmark de banner — conteúdo introdutório ou navegação global. Equivalente implícito a role="banner" quando filho direto de body.',
    en: 'Banner landmark — introductory content or global navigation. Implicit role="banner" when a direct child of body.',
  },
  {
    cat: 'landmarks',
    code: '<nav aria-label="Principal"> ... </nav>',
    pt: 'Landmark de navegação. Sempre que houver mais de um <nav>, use aria-label ou aria-labelledby para distinguí-los.',
    en: 'Navigation landmark. Whenever there is more than one <nav>, use aria-label or aria-labelledby to distinguish them.',
  },
  {
    cat: 'landmarks',
    code: '<main> ... </main>',
    pt: 'Landmark principal da página — deve haver apenas um por documento e conter o conteúdo central. Equivalente a role="main".',
    en: 'Main landmark of the page — only one per document, containing the central content. Equivalent to role="main".',
  },
  {
    cat: 'landmarks',
    code: '<aside aria-label="Relacionados"> ... </aside>',
    pt: 'Landmark complementar — conteúdo tangencial (sidebar, links relacionados). Equivalente a role="complementary".',
    en: 'Complementary landmark — tangential content (sidebar, related links). Equivalent to role="complementary".',
  },
  {
    cat: 'landmarks',
    code: '<footer> ... </footer>',
    pt: 'Landmark de contentinfo — informações de rodapé, copyright, links secundários. Equivalente a role="contentinfo" quando filho de body.',
    en: 'Contentinfo landmark — footer info, copyright, secondary links. Equivalent to role="contentinfo" when a child of body.',
  },
  {
    cat: 'landmarks',
    code: '<section aria-labelledby="secao-titulo">\n  <h2 id="secao-titulo">Título</h2>\n  ...\n</section>',
    pt: 'Landmark genérico de seção. Sempre que possível, dê um nome acessível com aria-labelledby ou aria-label.',
    en: 'Generic section landmark. Whenever possible, give it an accessible name via aria-labelledby or aria-label.',
  },
  {
    cat: 'landmarks',
    code: '<search role="search"> ... </search>',
    pt: 'Landmark de busca (o elemento <search> já tem role="search" implícito em navegadores modernos). Agrupa formulários ou filtros de pesquisa.',
    en: 'Search landmark (the <search> element has implicit role="search" in modern browsers). Groups search forms or filters.',
  },

  // Roles ARIA
  {
    cat: 'roles',
    code: '<div role="button" tabindex="0" aria-pressed="false">...</div>',
    pt: 'Role button para elementos customizados. Você deve implementar Enter/Space e foco visível manualmente. Prefira <button> nativo.',
    en: 'Button role for custom elements. You must implement Enter/Space and visible focus manually. Prefer the native <button>.',
  },
  {
    cat: 'roles',
    code: '<div role="link" tabindex="0" href="...">...</div>',
    pt: 'Role link para elementos clicáveis que navegam. Prefera <a href="...">; role="link" exige Enter e tratamento de URL.',
    en: 'Link role for clickable elements that navigate. Prefer <a href="...">; role="link" requires Enter handling and URL management.',
  },
  {
    cat: 'roles',
    code: '<ul role="tablist">\n  <li role="presentation"><a role="tab" aria-selected="true" ...>Aba 1</a></li>\n</ul>',
    pt: 'Role tablist/tabs para abas. Deve gerenciar aria-selected, tabindex e setas de teclado (←/→).',
    en: 'Tablist/tab roles for tabs. Must manage aria-selected, tabindex, and arrow keys (←/→).',
  },
  {
    cat: 'roles',
    code: '<div role="alert" aria-live="assertive">Erro ao salvar.</div>',
    pt: 'Role alert para mensagens urgentes.aria-live="assertive" interrompe o leitor de tela; use com parcimônia.',
    en: 'Alert role for urgent messages. aria-live="assertive" interrupts the screen reader; use sparingly.',
  },
  {
    cat: 'roles',
    code: '<div role="status" aria-live="polite">Salvo com sucesso.</div>',
    pt: 'Role status para mensagens não bloqueantes. O leitor de tela anuncia quando terminar a frase atual.',
    en: 'Status role for non-blocking messages. The screen reader announces when it finishes the current sentence.',
  },
  {
    cat: 'roles',
    code: '<div role="dialog" aria-modal="true" aria-labelledby="titulo-modal">\n  <h2 id="titulo-modal">Título</h2>\n  ...\n</div>',
    pt: 'Role dialog para modais. Combine com aria-modal="true", foco inicial no primeiro elemento e armadilha de foco.',
    en: 'Dialog role for modals. Combine with aria-modal="true", initial focus on the first element, and focus trap.',
  },
  {
    cat: 'roles',
    code: '<nav aria-label="Breadcrumbs" aria-labelledby="bc-title">\n  <h2 id="bc-title" class="visually-hidden">Breadcrumbs</h2>\n  <ol>\n    <li><a href="/">Home</a></li>\n    <li aria-current="page">Atual</li>\n  </ol>\n</nav>',
    pt: 'Navegação estruturada com aria-current="page" indicando o item ativo.',
    en: 'Structured navigation with aria-current="page" indicating the active item.',
  },
  {
    cat: 'roles',
    code: '<table role="table" aria-label="Vendas mensais">...</table>',
    pt: 'Role table reforça semântica de tabela. Para layouts de grade visuais que não são tabelas de dados, use role="grid" com cabeçalhos apropriados.',
    en: 'Table role reinforces table semantics. For visual grid layouts that are not data tables, use role="grid" with proper headers.',
  },

  // Estados e propriedades ARIA
  {
    cat: 'states',
    code: '<button aria-expanded="false" aria-controls="menu">Menu</button>\n<ul id="menu" hidden>...</ul>',
    pt: 'aria-expanded informa se um painel controlado está aberto ou fechado. Sincronize com aria-controls e o estado real do DOM.',
    en: 'aria-expanded tells whether a controlled panel is open or closed. Keep it in sync with aria-controls and the actual DOM state.',
  },
  {
    cat: 'states',
    code: '<button aria-pressed="true">Negrito</button>',
    pt: 'aria-pressed indica estado de alternância (toggle button). true/false/mixed.',
    en: 'aria-pressed indicates a toggle button state. true/false/mixed.',
  },
  {
    cat: 'states',
    code: '<input type="checkbox" aria-checked="true">',
    pt: 'aria-checked reflete o estado de checkboxes, radios, switches e widgets customizados.',
    en: 'aria-checked reflects the state of checkboxes, radios, switches, and custom widgets.',
  },
  {
    cat: 'states',
    code: '<input aria-invalid="true" aria-describedby="erro-email">\n<span id="erro-email">E-mail inválido.</span>',
    pt: 'aria-invalid="true" marca campo com erro. aria-describedby associa a mensagem de erro ao input.',
    en: 'aria-invalid="true" marks a field with an error. aria-describedby associates the error message with the input.',
  },
  {
    cat: 'states',
    code: '<input aria-required="true" required>',
    pt: 'aria-required reforça que um campo é obrigatório. O atributo required já expõe isso, então use aria-required só quando o required nativo não puder ser usado.',
    en: 'aria-required reinforces that a field is required. The required attribute already exposes this, so only use aria-required when native required cannot be used.',
  },
  {
    cat: 'states',
    code: '<input aria-disabled="true" disabled>',
    pt: 'aria-disabled indica que o controle está desabilitado sem remover a descoberta por leitores de tela. Combine com disabled para bloquear interação real.',
    en: 'aria-disabled indicates the control is disabled without hiding it from screen readers. Combine with disabled to block actual interaction.',
  },
  {
    cat: 'states',
    code: '<nav aria-label="Secundária"> ... </nav>',
    pt: 'aria-label dá um nome acessível quando não há texto visível que possa ser referenciado.',
    en: 'aria-label gives an accessible name when there is no visible text to reference.',
  },
  {
    cat: 'states',
    code: '<h2 id="titulo">Perfil</h2>\n<section aria-labelledby="titulo"> ... </section>',
    pt: 'aria-labelledby referencia o ID de outro elemento para compor o nome acessível. Preferido quando há rótulo visível.',
    en: 'aria-labelledby references another element\'s ID to compose the accessible name. Preferred when a visible label exists.',
  },
  {
    cat: 'states',
    code: '<input aria-describedby="dica">\n<span id="dica">Mínimo de 8 caracteres.</span>',
    pt: 'aria-describedby fornece descrição complementar (dicas, formatos, erros) sem alterar o nome acessível.',
    en: 'aria-describedby provides supplementary description (hints, formats, errors) without changing the accessible name.',
  },
  {
    cat: 'states',
    code: '<span aria-hidden="true">❤️</span>\n<span class="visually-hidden">Favoritar</span>',
    pt: 'aria-hidden="true" oculta um elemento da árvore de acessibilidade. Sempre ofereça uma alternativa textual para ícones decorativos que tenham significado.',
    en: 'aria-hidden="true" removes an element from the accessibility tree. Always provide a text alternative for decorative icons that carry meaning.',
  },
  {
    cat: 'states',
    code: '<a href="/conta" aria-current="page">Conta</a>',
    pt: 'aria-current="page" indica o item ativo dentro de um conjunto de navegação. Também aceita step, location, date, time, true.',
    en: 'aria-current="page" indicates the active item within a navigation set. Also accepts step, location, date, time, true.',
  },

  // Foco e teclado
  {
    cat: 'focus',
    code: ':focus-visible { outline: 3px solid #1677ff; outline-offset: 2px; }',
    pt: 'Use :focus-visible para mostrar indicador de foco apenas durante navegação por teclado, sem poluir cliques do mouse.',
    en: 'Use :focus-visible to show a focus indicator only during keyboard navigation, without cluttering mouse clicks.',
  },
  {
    cat: 'focus',
    code: ':focus:not(:focus-visible) { outline: none; }',
    pt: 'Remove outline de foco de mouse, mas mantém para teclado. Nunca remova o outline de foco sem redefini-lo.',
    en: 'Removes mouse focus outline but keeps it for keyboard. Never remove the focus outline without redefining it.',
  },
  {
    cat: 'focus',
    code: '<button>Clique</button>\n<button tabindex="-1">Só programático</button>',
    pt: 'tabindex="0" inclui no fluxo de tabulação; tabindex="-1" recebe foco programático, mas não pelo tab. Evite valores positivos.',
    en: 'tabindex="0" includes the element in the tab order; tabindex="-1" receives programmatic focus but not via Tab. Avoid positive values.',
  },
  {
    cat: 'focus',
    code: 'element.focus({ preventScroll: true })',
    pt: 'Mova o foco programaticamente sem forçar scroll abrupto. Útil em modais e notificações.',
    en: 'Move focus programmatically without forcing abrupt scrolling. Useful in modals and notifications.',
  },
  {
    cat: 'focus',
    code: 'document.addEventListener("keydown", (e) => {\n  if (e.key === "Escape") closeModal();\n});',
    pt: 'Permita fechar modais, dropdowns e toasts com a tecla Esc. Restaure o foco ao elemento que abriu o modal no fechamento.',
    en: 'Allow closing modals, dropdowns, and toasts with the Escape key. Restore focus to the element that opened the modal on close.',
  },
  {
    cat: 'focus',
    code: '<!-- Armadilha de foco com focusable sentinel -->\n<div tabindex="0" onFocus={() => focusLastInside()}></div>\n<div ref={modalRef}>...</div>\n<div tabindex="0" onFocus={() => focusFirstInside()}></div>',
    pt: 'Mantença o foco circulando dentro de modais/dialogos para usuários de teclado (focus trap).',
    en: 'Keep focus cycling inside modals/dialogs for keyboard users (focus trap).',
  },
  {
    cat: 'focus',
    code: '<a href="#conteudo" class="skip-link">Pular para conteúdo</a>',
    pt: 'Skip link visível apenas ao receber foco permite usuários de teclado pularem menus repetitivos.',
    en: 'Skip link visible only on focus lets keyboard users skip repetitive menus.',
  },

  // Formulários
  {
    cat: 'forms',
    code: '<label for="email">E-mail</label>\n<input id="email" type="email" name="email" autocomplete="email">',
    pt: 'Associe label ao input com for/id (ou aninhe). autocomplete melhora preenchimento e leitores de tela.',
    en: 'Associate label with input via for/id (or nesting). autocomplete improves filling and screen reader support.',
  },
  {
    cat: 'forms',
    code: '<fieldset>\n  <legend>Tamanho da camiseta</legend>\n  <label><input type="radio" name="tamanho" value="P"> P </label>\n  <label><input type="radio" name="tamanho" value="M"> M </label>\n</fieldset>',
    pt: 'Agrupe radios e checkboxes relacionados com fieldset/legend. O legend serve como rótulo do grupo.',
    en: 'Group related radios and checkboxes with fieldset/legend. The legend acts as the group label.',
  },
  {
    cat: 'forms',
    code: '<input id="senha" type="password" aria-describedby="regras">\n<ul id="regras"><li>Mínimo 8 caracteres</li></ul>',
    pt: 'Use aria-describedby para vincular regras, erros ou dicas a campos de formulário.',
    en: 'Use aria-describedby to link rules, errors, or hints to form fields.',
  },
  {
    cat: 'forms',
    code: '<select id="pais">\n  <option value="">Selecione...</option>\n  <option value="br">Brasil</option>\n</select>',
    pt: 'Ofereça uma opção vazia inicial em selects obrigatórios para forçar escolha consciente.',
    en: 'Provide an empty initial option in required selects to force a conscious choice.',
  },
  {
    cat: 'forms',
    code: '<input type="file" accept=".pdf" aria-describedby="limite">\n<span id="limite">PDF de até 5 MB.</span>',
    pt: 'Restrinja tipos/tamanhos e descreva restrições antes do upload para leitores de tela.',
    en: 'Restrict types/sizes and describe restrictions before upload for screen readers.',
  },
  {
    cat: 'forms',
    code: '<button type="submit">Enviar</button>\n<button type="button" onClick={cancel}>Cancelar</button>',
    pt: 'Use type="button" para botões que não submetem formulários. Botões sem type podem disparar submit acidentalmente.',
    en: 'Use type="button" for buttons that do not submit forms. Buttons without type may accidentally trigger submit.',
  },
  {
    cat: 'forms',
    code: '<input type="text" inputmode="numeric" pattern="[0-9]*">',
    pt: 'inputmode e pattern ajudam a abrir o teclado correto em dispositivos móveis.',
    en: 'inputmode and pattern help open the correct keyboard on mobile devices.',
  },

  // Imagens e mídia
  {
    cat: 'media',
    code: '<img src="foto.jpg" alt="Cachorro golden deitado no sofá">',
    pt: 'Texto alternativo descritivo para imagens com significado. Evite "imagem de..." — leitores já anunciam <img>.',
    en: 'Descriptive alternative text for meaningful images. Avoid "image of..." — screen readers already announce <img>.',
  },
  {
    cat: 'media',
    code: '<img src="decorativo.svg" alt="" role="presentation">',
    pt: 'Imagens puramente decorativas devem ter alt="" (ou role="presentation") para serem ignoradas por leitores de tela.',
    en: 'Purely decorative images should have alt="" (or role="presentation") to be ignored by screen readers.',
  },
  {
    cat: 'media',
    code: '<svg aria-hidden="true" focusable="false">...</svg>\n<span class="visually-hidden">Ícone de busca</span>',
    pt: 'SVGs decorativos devem ser aria-hidden e não focáveis. Se tiverem significado, adicione um texto alternativo.',
    en: 'Decorative SVGs should be aria-hidden and not focusable. If meaningful, add alternative text.',
  },
  {
    cat: 'media',
    code: '<figure>\n  <img src="grafico.png" alt="Vendas cresceram 20% no trimestre">\n  <figcaption>Figura 1 — Crescimento trimestral de vendas.</figcaption>\n</figure>',
    pt: 'Use figure/figcaption para imagens complexas. O alt resume; a legenda dá contexto adicional.',
    en: 'Use figure/figcaption for complex images. Alt summarizes; the caption provides additional context.',
  },
  {
    cat: 'media',
    code: '<video controls>\n  <source src="video.mp4" type="video/mp4">\n  <track kind="captions" src="legendas.vtt" srclang="pt" label="Português" default>\n</video>',
    pt: 'Forneça legendas (captions), transcrição e controles acessíveis para vídeos. Áudios precisam de transcrição.',
    en: 'Provide captions, transcripts, and accessible controls for videos. Audio needs transcripts.',
  },
  {
    cat: 'media',
    code: '<button aria-label="Fechar" aria-describedby="close-desc">\n  <span aria-hidden="true">×</span>\n</button>\n<span id="close-desc" hidden>Fechar modal</span>',
    pt: 'Ícones dentro de botões precisam de rótulo acessível. aria-label no botão ou texto oculto.',
    en: 'Icons inside buttons need an accessible label. Use aria-label on the button or visually hidden text.',
  },

  // Cor e contraste
  {
    cat: 'color',
    code: '/* Contraste mínimo WCAG 2.2 */\n.normal { color: #595959; background: #fff; } /* 7:1 AAA */\n.large { color: #949494; background: #fff; } /* 3:1 AA para texto grande */',
    pt: 'Texto normal precisa de contraste mínimo 4.5:1 (AA) e 7:1 (AAA). Texto grande (18pt+/14pt+ negrito) precisa de 3:1 (AA).',
    en: 'Normal text needs a minimum contrast of 4.5:1 (AA) and 7:1 (AAA). Large text (18pt+/14pt+ bold) needs 3:1 (AA).',
  },
  {
    cat: 'color',
    code: '<p class="error"><span aria-hidden="true">⚠️</span> Preencha o campo.</p>',
    pt: 'Nunca use cor como única forma de transmitir informação. Acrescente ícones, texto ou padrões.',
    en: 'Never use color as the only way to convey information. Add icons, text, or patterns.',
  },
  {
    cat: 'color',
    code: '@media (prefers-reduced-motion: reduce) {\n  * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }\n}',
    pt: 'Respeite prefers-reduced-motion para usuários com vestibulopatias ou sensibilidade a movimento.',
    en: 'Respect prefers-reduced-motion for users with vestibular disorders or motion sensitivity.',
  },
  {
    cat: 'color',
    code: '@media (prefers-contrast: more) {\n  .btn { border-width: 2px; }\n}',
    pt: 'Refine bordas e contraste quando o usuário solicita alto contraste no sistema operacional.',
    en: 'Enhance borders and contrast when the user requests high contrast in the operating system.',
  },
  {
    cat: 'color',
    code: ':focus-visible {\n  outline: 3px solid CanvasText;\n  outline-offset: 2px;\n}',
    pt: 'Use cores do sistema (CanvasText, Canvas, Highlight) para respeitar temas de alto contraste.',
    en: 'Use system colors (CanvasText, Canvas, Highlight) to respect high-contrast themes.',
  },

  // Semântica HTML
  {
    cat: 'semantics',
    code: '<h1>Título da página</h1>\n<h2>Seção</h2>\n<h3>Subseção</h3>',
    pt: 'Mantença hierarquia de títulos (h1–h6) sequencial e sem pular níveis. Títulos são a principal forma de navegação por leitores de tela.',
    en: 'Keep a sequential heading hierarchy (h1–h6) without skipping levels. Headings are the main navigation method for screen readers.',
  },
  {
    cat: 'semantics',
    code: '<article>\n  <header><h2>Post</h2></header>\n  <p>...</p>\n</article>',
    pt: 'Use article, section, aside, nav, header, footer, main para dar estrutura semântica em vez de <div> genéricas.',
    en: 'Use article, section, aside, nav, header, footer, main for semantic structure instead of generic <div>s.',
  },
  {
    cat: 'semantics',
    code: '<ul>\n  <li>Item 1</li>\n  <li>Item 2</li>\n</ul>',
    pt: 'Listas (ul/ol/dl) comunicam quantidade e relação entre itens. Evite simular listas apenas com CSS.',
    en: 'Lists (ul/ol/dl) communicate quantity and relationship between items. Avoid simulating lists with CSS only.',
  },
  {
    cat: 'semantics',
    code: '<dl>\n  <dt>CPU</dt><dd>Processador central</dd>\n  <dt>RAM</dt><dd>Memória de acesso aleatório</dd>\n</dl>',
    pt: 'Description list é ideal para pares termo/definição, como glossários e detalhes técnicos.',
    en: 'Description list is ideal for term/definition pairs, such as glossaries and technical details.',
  },
  {
    cat: 'semantics',
    code: '<button type="button" popovertarget="menu">Abrir</button>\n<div id="menu" popover>Conteúdo</div>',
    pt: 'Elementos nativos como popover, dialog e details já trazem comportamentos acessíveis — prefira-os a soluções customizadas.',
    en: 'Native elements like popover, dialog, and details already bring accessible behaviors — prefer them over custom solutions.',
  },
  {
    cat: 'semantics',
    code: '<time datetime="2026-08-13T14:30:00-03:00">13 de agosto de 2026, 14:30</time>',
    pt: 'O elemento <time> com datetime permite que leitores e máquinas interpretem datas/horários corretamente.',
    en: 'The <time> element with datetime lets screen readers and machines interpret dates/times correctly.',
  },

  // Leitores de tela
  {
    cat: 'sr',
    code: '.visually-hidden {\n  position: absolute;\n  width: 1px; height: 1px;\n  padding: 0; margin: -1px;\n  overflow: hidden;\n  clip: rect(0, 0, 0, 0);\n  white-space: nowrap;\n  border: 0;\n}',
    pt: 'Classe utilitária para ocultar visualmente mas manter disponível para leitores de tela. Nunca use display:none para texto acessível.',
    en: 'Utility class to hide visually but keep available to screen readers. Never use display:none for accessible text.',
  },
  {
    cat: 'sr',
    code: '<div aria-live="polite" aria-atomic="true">\n  <span id="contador">3 itens selecionados</span>\n</div>',
    pt: 'Regiões aria-live anunciam atualizações dinâmicas. aria-atomic="true" lê o conteúdo completo, não só o que mudou.',
    en: 'aria-live regions announce dynamic updates. aria-atomic="true" reads the entire content, not just what changed.',
  },
  {
    cat: 'sr',
    code: '<button aria-label="Avançar" aria-describedby="passo">Próximo</button>\n<span id="passo">Passo 2 de 5</span>',
    pt: 'aria-describedby adiciona contexto extra ao nome acessível sem substituí-lo.',
    en: 'aria-describedby adds extra context to the accessible name without replacing it.',
  },
  {
    cat: 'sr',
    code: '<span role="img" aria-label="Avaliação 4 de 5 estrelas">★★★★☆</span>',
    pt: 'Quando emoji/caracteres formam um significado, use role="img" e aria-label para dar contexto.',
    en: 'When emojis/characters carry meaning, use role="img" and aria-label to provide context.',
  },

  // Testes
  {
    cat: 'testing',
    code: 'npx playwright test --project=chromium --reporter=list\n# ou\nnpx @axe-core/cli http://localhost:5173',
    pt: 'Automatize testes de acessibilidade com Playwright + axe-core ou @axe-core/cli.axe não substitui testes manuais.',
    en: 'Automate accessibility tests with Playwright + axe-core or @axe-core/cli. axe does not replace manual testing.',
  },
  {
    cat: 'testing',
    code: 'Tab → Shift+Tab → Enter → Space → Esc → ↑ ↓ ← →',
    pt: 'Navegue a página inteira apenas com o teclado. Verifique indicador de foco, ordem lógica e fechamento de modais.',
    en: 'Navigate the entire page using only the keyboard. Check focus indicator, logical order, and modal closing.',
  },
  {
    cat: 'testing',
    code: 'Ctrl + Alt + T  (NVDA)\nCmd + F5        (VoiceOver macOS)\nAlt + F10       (JAWS)',
    pt: 'Ative um leitor de tela e teste fluxos reais: preenchimento de formulários, tabelas, modais e notificações.',
    en: 'Enable a screen reader and test real flows: form filling, tables, modals, and notifications.',
  },
  {
    cat: 'testing',
    code: 'chrome://accessibility/\nDevTools → Lighthouse → Accessibility',
    pt: 'Use as ferramentas nativas do Chrome (chrome://accessibility) e o Lighthouse para auditorias rápidas.',
    en: 'Use Chrome native tools (chrome://accessibility) and Lighthouse for quick audits.',
  },
  {
    cat: 'testing',
    code: '<html lang="pt-BR"> ... </html>',
    pt: 'Declare o idioma principal da página em <html lang="...">. Leitores usam isso para pronuncia correta. Mude lang em trechos de outro idioma.',
    en: 'Declare the page\'s primary language in <html lang="...">. Screen readers use this for correct pronunciation. Change lang for passages in other languages.',
  },
  {
    cat: 'testing',
    code: '<meta name="viewport" content="width=device-width, initial-scale=1">',
    pt: 'Viewport responsivo é critério de acessibilidade: usuários precisam ampliar até 400% sem perder funcionalidade (WCAG 1.4.10).',
    en: 'Responsive viewport is an accessibility criterion: users must be able to zoom up to 400% without losing functionality (WCAG 1.4.10).',
  },
]
