// Gerador de card CSS puro.
//
// Monta um componente de card acessível com variações visuais, sombra,
// bordas, hover e estrutura semântica (article > header/body/footer).

function parseColor(color) {
  if (!color) return '#ffffff'
  if (typeof color === 'string') return color
  if (color && typeof color.toHexString === 'function') return color.toHexString()
  return String(color)
}

function toPx(v) {
  const n = Number(v)
  return Number.isFinite(n) ? `${Math.round(n)}px` : '0px'
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n))
}

const DEFAULTS = {
  variant: 'raised',
  width: 320,
  padding: 24,
  borderRadius: 12,
  bgColor: '#ffffff',
  textColor: '#262626',
  borderColor: '#e5e5ea',
  borderWidth: 0,
  shadow: '0 4px 20px rgba(0,0,0,0.08)',
  hoverLift: true,
  hoverShadow: '0 12px 32px rgba(0,0,0,0.12)',
  hoverTranslateY: -4,
  transitionDuration: 250,
  headerDivider: true,
  footerDivider: true,
  dividerColor: '#f0f0f0',
  dividerWidth: 1,
  mediaHeight: 160,
  mediaRadius: true,
  showMedia: true,
  showHeader: true,
  showFooter: true,
  showButton: true,
  buttonBg: '#1677ff',
  buttonColor: '#ffffff',
  buttonRadius: 6,
  align: 'left',
}

const PRESETS = {
  raised: {
    variant: 'raised',
    borderWidth: 0,
    bgColor: '#ffffff',
    textColor: '#262626',
    borderColor: '#e5e5ea',
    shadow: '0 4px 20px rgba(0,0,0,0.08)',
    hoverLift: true,
    hoverShadow: '0 12px 32px rgba(0,0,0,0.12)',
    hoverTranslateY: -4,
  },
  flat: {
    variant: 'flat',
    borderWidth: 0,
    bgColor: '#ffffff',
    textColor: '#262626',
    borderColor: '#e5e5ea',
    shadow: 'none',
    hoverLift: false,
    hoverShadow: 'none',
    hoverTranslateY: 0,
  },
  outlined: {
    variant: 'outlined',
    borderWidth: 1,
    bgColor: '#ffffff',
    textColor: '#262626',
    borderColor: '#d9d9d9',
    shadow: 'none',
    hoverLift: false,
    hoverShadow: 'none',
    hoverTranslateY: 0,
  },
  soft: {
    variant: 'soft',
    borderWidth: 0,
    bgColor: '#f5f5f7',
    textColor: '#262626',
    borderColor: '#e5e5ea',
    shadow: 'none',
    hoverLift: false,
    hoverShadow: 'none',
    hoverTranslateY: 0,
  },
  dark: {
    variant: 'dark',
    borderWidth: 0,
    bgColor: '#1f1f1f',
    textColor: '#f5f5f7',
    borderColor: '#3a3a3a',
    shadow: '0 8px 24px rgba(0,0,0,0.35)',
    hoverLift: true,
    hoverShadow: '0 16px 40px rgba(0,0,0,0.45)',
    hoverTranslateY: -4,
  },
}

export { PRESETS, DEFAULTS }

export function buildCardCss(options = {}) {
  const opts = { ...DEFAULTS, ...options }
  const variant = opts.variant || 'raised'
  const width = clamp(Number(opts.width) || DEFAULTS.width, 160, 600)
  const padding = clamp(Number(opts.padding) || DEFAULTS.padding, 0, 64)
  const borderRadius = clamp(Number(opts.borderRadius) || DEFAULTS.borderRadius, 0, 48)
  const bg = parseColor(opts.bgColor)
  const text = parseColor(opts.textColor)
  const border = parseColor(opts.borderColor)
  const borderWidth = clamp(Number(opts.borderWidth) || 0, 0, 16)
  const shadow = opts.shadow || 'none'
  const duration = clamp(Number(opts.transitionDuration) || 250, 0, 1000)
  const hoverLift = Boolean(opts.hoverLift)
  const hoverShadow = opts.hoverShadow || 'none'
  const hoverTranslateY = clamp(Number(opts.hoverTranslateY) || -4, -32, 32)
  const headerDivider = Boolean(opts.headerDivider)
  const footerDivider = Boolean(opts.footerDivider)
  const dividerColor = parseColor(opts.dividerColor)
  const dividerWidth = clamp(Number(opts.dividerWidth) || 1, 0, 8)
  const mediaHeight = clamp(Number(opts.mediaHeight) || 160, 0, 400)
  const mediaRadius = Boolean(opts.mediaRadius)
  const buttonBg = parseColor(opts.buttonBg)
  const buttonColor = parseColor(opts.buttonColor)
  const buttonRadius = clamp(Number(opts.buttonRadius) || 6, 0, 32)
  const align = ['left', 'center', 'right'].includes(opts.align) ? opts.align : 'left'

  const hasBorder = borderWidth > 0
  const contentRadius = Math.max(0, borderRadius - borderWidth)

  const lines = [
    '/* Card container */',
    '.card {',
    `  --card-bg: ${bg};`,
    `  --card-text: ${text};`,
    `  --card-border: ${border};`,
    `  --card-divider: ${dividerColor};`,
    `  --card-button-bg: ${buttonBg};`,
    `  --card-button-color: ${buttonColor};`,
    '',
    '  position: relative;',
    `  width: 100%;`,
    `  max-width: ${toPx(width)};`,
    `  background: var(--card-bg);`,
    `  color: var(--card-text);`,
    `  border-radius: ${toPx(borderRadius)};`,
    hasBorder ? `  border: ${toPx(borderWidth)} solid var(--card-border);` : '  border: none;',
    `  box-shadow: ${shadow};`,
    `  overflow: hidden;`,
    `  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;`,
    `  text-align: ${align};`,
    `  transition: transform ${duration}ms ease, box-shadow ${duration}ms ease;`,
    '}',
    '',
    '/* Remove margens padrão dos filhos para controle interno */',
    '.card * {',
    '  box-sizing: border-box;',
    '}',
    '',
    '/* Imagem/topo do card */',
    '.card__media {',
    `  width: 100%;`,
    `  height: ${toPx(mediaHeight)};`,
    `  object-fit: cover;`,
    `  display: block;`,
    mediaRadius ? `  border-radius: ${toPx(contentRadius)} ${toPx(contentRadius)} 0 0;` : null,
    '}',
    '',
    '/* Cabeçalho */',
    '.card__header {',
    `  padding: ${toPx(padding)} ${toPx(padding)} ${headerDivider ? toPx(Math.max(0, padding - dividerWidth)) : toPx(padding)};`,
    headerDivider && dividerWidth > 0
      ? `  border-bottom: ${toPx(dividerWidth)} solid var(--card-divider);`
      : null,
    '}',
    '',
    '.card__title {',
    '  margin: 0;',
    '  font-size: 1.25rem;',
    '  font-weight: 600;',
    '  line-height: 1.3;',
    '}',
    '',
    '.card__subtitle {',
    '  margin: 4px 0 0;',
    '  font-size: 0.875rem;',
    '  opacity: 0.7;',
    '}',
    '',
    '/* Corpo */',
    '.card__body {',
    `  padding: ${toPx(padding)};`,
    `  font-size: 0.9375rem;`,
    '  line-height: 1.6;',
    '}',
    '',
    '.card__body p {',
    '  margin: 0 0 0.75em;',
    '}',
    '',
    '.card__body p:last-child {',
    '  margin-bottom: 0;',
    '}',
    '',
    '/* Rodapé */',
    '.card__footer {',
    `  padding: ${footerDivider ? toPx(Math.max(0, padding - dividerWidth)) : toPx(padding)} ${toPx(padding)} ${toPx(padding)};`,
    footerDivider && dividerWidth > 0
      ? `  border-top: ${toPx(dividerWidth)} solid var(--card-divider);`
      : null,
    `  display: flex;`,
    `  gap: 8px;`,
    align === 'center' ? '  justify-content: center;' : align === 'right' ? '  justify-content: flex-end;' : '  justify-content: flex-start;',
    '}',
    '',
    '/* Botão de ação */',
    '.card__button {',
    `  display: inline-flex;`,
    `  align-items: center;`,
    `  justify-content: center;`,
    `  padding: 8px 16px;`,
    `  background: var(--card-button-bg);`,
    `  color: var(--card-button-color);`,
    `  border: none;`,
    `  border-radius: ${toPx(buttonRadius)};`,
    `  font-size: 0.875rem;`,
    `  font-weight: 500;`,
    `  text-decoration: none;`,
    `  cursor: pointer;`,
    `  transition: filter ${duration}ms ease, transform ${duration}ms ease;`,
    '}',
    '',
    '.card__button:hover {',
    '  filter: brightness(1.1);',
    '}',
    '',
    '.card__button:active {',
    '  transform: scale(0.98);',
    '}',
  ]

  if (hoverLift) {
    lines.push(
      '',
      '/* Efeito hover */',
      '.card:hover {',
      `  transform: translateY(${toPx(hoverTranslateY)});`,
      `  box-shadow: ${hoverShadow};`,
      '}',
      '',
      '.card:hover .card__media {',
      '  opacity: 0.95;',
      '}'
    )
  }

  lines.push(
    '',
    '/* Foco via teclado */',
    '.card:focus-within {',
    `  outline: 2px solid var(--card-button-bg);`,
    '  outline-offset: 2px;',
    '}',
    '',
    '/* Stack semântico de exemplo */',
    '.card-wrapper {',
    '  display: flex;',
    '  flex-wrap: wrap;',
    '  gap: 24px;',
    '}',
    '',
    '.card-wrapper > .card {',
    '  flex: 1 1 280px;',
    '}'
  )

  return lines.filter((line) => line !== null).join('\n')
}

export function buildCardHtml(options = {}) {
  const opts = { ...DEFAULTS, ...options }
  const showMedia = Boolean(opts.showMedia)
  const showHeader = Boolean(opts.showHeader)
  const showFooter = Boolean(opts.showFooter)
  const showButton = Boolean(opts.showButton)
  const title = String(opts.title || 'Título do card')
  const subtitle = String(opts.subtitle || 'Subtítulo descritivo')
  const body = String(
    opts.body ||
      'Este é um exemplo de corpo de card. Você pode substituir este texto por qualquer conteúdo: descrições, listas, formulários, etc.'
  )
  const buttonText = String(opts.buttonText || 'Saiba mais')
  const mediaAlt = String(opts.mediaAlt || 'Imagem de capa')

  const media = showMedia
    ? `  <img class="card__media" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='640' height='360'%3E%3Crect width='640' height='360' fill='%23e5e5ea'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23666666' font-family='sans-serif' font-size='24'%3E640×360%3C/text%3E%3C/svg%3E" alt="${mediaAlt}" />`
    : ''

  const header = showHeader
    ? [
        '  <header class="card__header">',
        `    <h3 class="card__title">${title}</h3>`,
        `    <p class="card__subtitle">${subtitle}</p>`,
        '  </header>',
      ].join('\n')
    : ''

  const footer = showFooter
    ? [
        '  <footer class="card__footer">',
        showButton ? `    <button class="card__button">${buttonText}</button>` : '',
        '  </footer>',
      ]
        .filter(Boolean)
        .join('\n')
    : ''

  return [
    '<article class="card">',
    media,
    header,
    '  <div class="card__body">',
    `    <p>${body}</p>`,
    '  </div>',
    footer,
    '</article>',
  ]
    .filter(Boolean)
    .join('\n')
}

export function buildCardFullDemo(options = {}) {
  return `${buildCardCss(options)}\n\n${buildCardHtml(options)}`
}
