// Gerador de flip card CSS puro.
//
// Cria cards 3D que viram no hover ou no clique usando apenas CSS:
// perspective, transform-style: preserve-3d, backface-visibility e rotateX/Y.

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

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

const DEFAULTS = {
  axis: 'horizontal',
  trigger: 'hover',
  width: 280,
  height: 360,
  borderRadius: 16,
  perspective: 1000,
  duration: 600,
  easing: 'ease',
  frontBg: '#1677ff',
  frontText: '#ffffff',
  backBg: '#52c41a',
  backText: '#ffffff',
  borderWidth: 0,
  borderColor: '#e5e5ea',
  shadow: '0 12px 40px rgba(0,0,0,0.18)',
  hoverShadow: '0 20px 56px rgba(0,0,0,0.22)',
  shadowOnFlip: true,
  frontTitle: 'Frente',
  frontBody: 'Passe o mouse ou clique para ver o verso.',
  backTitle: 'Verso',
  backBody: 'Aqui está o conteúdo de trás do card. Puro CSS!',
  showIcon: true,
  iconSize: 48,
  contentPadding: 24,
  titleSize: 24,
  bodySize: 14,
}

const PRESETS = {
  default: {
    axis: 'horizontal',
    frontBg: '#1677ff',
    frontText: '#ffffff',
    backBg: '#52c41a',
    backText: '#ffffff',
    borderWidth: 0,
    shadow: '0 12px 40px rgba(0,0,0,0.18)',
  },
  dark: {
    axis: 'horizontal',
    frontBg: '#1f1f1f',
    frontText: '#f5f5f7',
    backBg: '#3a3a3a',
    backText: '#f5f5f7',
    borderWidth: 0,
    shadow: '0 12px 40px rgba(0,0,0,0.45)',
  },
  gradient: {
    axis: 'vertical',
    frontBg: 'linear-gradient(135deg, #1677ff, #722ed1)',
    frontText: '#ffffff',
    backBg: 'linear-gradient(135deg, #eb2f96, #fa8c16)',
    backText: '#ffffff',
    borderWidth: 0,
    shadow: '0 16px 48px rgba(114, 46, 209, 0.28)',
  },
  minimal: {
    axis: 'horizontal',
    frontBg: '#ffffff',
    frontText: '#262626',
    backBg: '#f5f5f7',
    backText: '#262626',
    borderWidth: 1,
    borderColor: '#d9d9d9',
    shadow: '0 4px 12px rgba(0,0,0,0.06)',
  },
  playful: {
    axis: 'horizontal',
    frontBg: '#faad14',
    frontText: '#1f1f1f',
    backBg: '#13c2c2',
    backText: '#1f1f1f',
    borderWidth: 0,
    shadow: '0 16px 40px rgba(250, 173, 20, 0.35)',
  },
}

export { DEFAULTS, PRESETS }

export function buildFlipCardCss(options = {}) {
  const opts = { ...DEFAULTS, ...options }
  const axis = opts.axis === 'vertical' ? 'vertical' : 'horizontal'
  const trigger = opts.trigger === 'click' ? 'click' : 'hover'
  const width = clamp(Number(opts.width) || DEFAULTS.width, 120, 600)
  const height = clamp(Number(opts.height) || DEFAULTS.height, 120, 800)
  const borderRadius = clamp(Number(opts.borderRadius) || DEFAULTS.borderRadius, 0, 120)
  const perspective = clamp(Number(opts.perspective) || DEFAULTS.perspective, 200, 3000)
  const duration = clamp(Number(opts.duration) || DEFAULTS.duration, 100, 3000)
  const easing = opts.easing || 'ease'
  const frontBg = parseColor(opts.frontBg)
  const frontText = parseColor(opts.frontText)
  const backBg = parseColor(opts.backBg)
  const backText = parseColor(opts.backText)
  const borderWidth = clamp(Number(opts.borderWidth) || 0, 0, 16)
  const borderColor = parseColor(opts.borderColor)
  const shadow = opts.shadow || 'none'
  const hoverShadow = opts.hoverShadow || shadow
  const shadowOnFlip = Boolean(opts.shadowOnFlip)
  const iconSize = clamp(Number(opts.iconSize) || 48, 16, 120)
  const contentPadding = clamp(Number(opts.contentPadding) || 24, 8, 64)
  const titleSize = clamp(Number(opts.titleSize) || 24, 12, 64)
  const bodySize = clamp(Number(opts.bodySize) || 14, 10, 32)

  const rotateAxis = axis === 'vertical' ? 'rotateX' : 'rotateY'
  const flipSelector = trigger === 'click'
    ? '.flip-card__toggle:checked ~ .flip-card__inner'
    : '.flip-card:hover .flip-card__inner'

  const lines = [
    '/* Flip card container */',
    '.flip-card {',
    `  display: inline-block;`,
    `  width: ${toPx(width)};`,
    `  perspective: ${toPx(perspective)};`,
    `  cursor: ${trigger === 'click' ? 'pointer' : 'default'};`,
    '}',
    '',
    '/* Checkbox hack (só aparece quando trigger=click) */',
    '.flip-card__toggle {',
    '  position: absolute;',
    '  width: 1px;',
    '  height: 1px;',
    '  padding: 0;',
    '  margin: -1px;',
    '  overflow: hidden;',
    '  clip: rect(0, 0, 0, 0);',
    '  white-space: nowrap;',
    '  border: 0;',
    '}',
    '',
    '/* Inner wrapper com 3D preservado */',
    '.flip-card__inner {',
    `  position: relative;`,
    `  width: 100%;`,
    `  height: ${toPx(height)};`,
    `  transform-style: preserve-3d;`,
    `  transition: transform ${duration}ms ${easing};`,
    shadowOnFlip ? `  filter: drop-shadow(0 0 0 transparent);` : null,
    '}',
    '',
    `/* Estado virado — ${trigger === 'click' ? 'checkbox marcada' : 'hover'} */`,
    `${flipSelector} {`,
    `  transform: ${rotateAxis}(180deg);`,
    shadowOnFlip ? `  filter: drop-shadow(${hoverShadow});` : null,
    '}',
    '',
    '/* Faces da frente e de trás */',
    '.flip-card__front,',
    '.flip-card__back {',
    `  position: absolute;`,
    `  inset: 0;`,
    `  width: 100%;`,
    `  height: 100%;`,
    `  backface-visibility: hidden;`,
    `  -webkit-backface-visibility: hidden;`,
    `  border-radius: ${toPx(borderRadius)};`,
    borderWidth > 0 ? `  border: ${toPx(borderWidth)} solid ${borderColor};` : null,
    `  box-shadow: ${shadow};`,
    `  box-sizing: border-box;`,
    `  padding: ${toPx(contentPadding)};`,
    `  display: flex;`,
    `  flex-direction: column;`,
    `  align-items: center;`,
    `  justify-content: center;`,
    `  text-align: center;`,
    `  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;`,
    `  overflow: hidden;`,
    '}',
    '',
    '/* Face da frente */',
    '.flip-card__front {',
    `  background: ${frontBg};`,
    `  color: ${frontText};`,
    '}',
    '',
    '/* Face de trás (inverte para ficar de pé depois da rotação) */',
    '.flip-card__back {',
    `  background: ${backBg};`,
    `  color: ${backText};`,
    `  transform: ${rotateAxis}(180deg);`,
    '}',
    '',
    '/* Ícone decorativo */',
    '.flip-card__icon {',
    `  width: ${toPx(iconSize)};`,
    `  height: ${toPx(iconSize)};`,
    `  margin-bottom: 16px;`,
    `  fill: currentColor;`,
    `  opacity: 0.9;`,
    '}',
    '',
    '/* Título */',
    '.flip-card__title {',
    `  margin: 0 0 12px;`,
    `  font-size: ${toPx(titleSize)};`,
    `  font-weight: 700;`,
    `  line-height: 1.2;`,
    '}',
    '',
    '/* Corpo de texto */',
    '.flip-card__body {',
    `  margin: 0;`,
    `  font-size: ${toPx(bodySize)};`,
    `  line-height: 1.5;`,
    `  opacity: 0.95;`,
    '}',
    '',
    '/* Dica visual de interação no hover (qualquer trigger) */',
    '.flip-card:hover .flip-card__front {',
    '  filter: brightness(1.02);',
    '}',
    '',
    '/* Layout de exemplo */',
    '.flip-card-wrapper {',
    '  display: flex;',
    '  flex-wrap: wrap;',
    '  gap: 24px;',
    '  justify-content: center;',
    '}',
  ]

  return lines.filter((line) => line !== null).join('\n')
}

function iconSvg(name) {
  const icons = {
    star: `<svg class="flip-card__icon" viewBox="0 0 24 24"><path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>`,
    heart: `<svg class="flip-card__icon" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`,
    info: `<svg class="flip-card__icon" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>`,
  }
  return icons[name] || icons.info
}

export function buildFlipCardHtml(options = {}) {
  const opts = { ...DEFAULTS, ...options }
  const trigger = opts.trigger === 'click' ? 'click' : 'hover'
  const frontTitle = escapeHtml(opts.frontTitle || DEFAULTS.frontTitle)
  const frontBody = escapeHtml(opts.frontBody || DEFAULTS.frontBody)
  const backTitle = escapeHtml(opts.backTitle || DEFAULTS.backTitle)
  const backBody = escapeHtml(opts.backBody || DEFAULTS.backBody)
  const showIcon = Boolean(opts.showIcon)
  const icon = showIcon ? iconSvg(opts.iconName || 'info') : ''

  const front = [
    '    <div class="flip-card__front">',
    `      ${icon}`,
    `      <h3 class="flip-card__title">${frontTitle}</h3>`,
    `      <p class="flip-card__body">${frontBody}</p>`,
    '    </div>',
  ].join('\n')

  const back = [
    '    <div class="flip-card__back">',
    `      <h3 class="flip-card__title">${backTitle}</h3>`,
    `      <p class="flip-card__body">${backBody}</p>`,
    '    </div>',
  ].join('\n')

  const labelOpen = trigger === 'click' ? '<label class="flip-card">' : '<div class="flip-card">'
  const labelClose = trigger === 'click' ? '</label>' : '</div>'
  const input = trigger === 'click'
    ? '  <input type="checkbox" class="flip-card__toggle" aria-label="Virar card">'
    : ''

  return [
    labelOpen,
    input,
    '  <div class="flip-card__inner">',
    front,
    back,
    '  </div>',
    labelClose,
  ].join('\n')
}

export function buildFlipCardFullDemo(options = {}) {
  return `${buildFlipCardCss(options)}\n\n${buildFlipCardHtml(options)}`
}
