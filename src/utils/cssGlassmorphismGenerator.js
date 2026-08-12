// Gerador de cards/paineis no estilo glassmorphism (vidro fosco) usando CSS puro.
//
// O efeito combina background semi-transparente (rgba), backdrop-filter blur +
// saturate, borda sutil e sombra suave. Funciona melhor sobre fundos coloridos
// ou gradientes, porque senao o blur nao tem o que borrar.

const DEFAULTS = {
  className: 'glass-card',
  bgColor: '#ffffff',
  opacity: 0.12,
  blur: 14,
  saturate: 150,
  borderWidth: 1,
  borderColor: '#ffffff',
  borderOpacity: 0.25,
  borderRadius: 16,
  padding: 24,
  shadowX: 0,
  shadowY: 8,
  shadowBlur: 32,
  shadowSpread: 0,
  shadowColor: '#1f26a9',
  shadowOpacity: 0.25,
}

export const GLASS_PRESETS = [
  {
    key: 'default',
    name: { pt: 'Padrão', en: 'Default' },
    opts: {
      bgColor: '#ffffff', opacity: 0.12, blur: 14, saturate: 150,
      borderWidth: 1, borderColor: '#ffffff', borderOpacity: 0.25,
      borderRadius: 16, padding: 24,
      shadowX: 0, shadowY: 8, shadowBlur: 32, shadowSpread: 0,
      shadowColor: '#1f26a9', shadowOpacity: 0.25,
    },
  },
  {
    key: 'dark',
    name: { pt: 'Escuro', en: 'Dark' },
    opts: {
      bgColor: '#000000', opacity: 0.3, blur: 18, saturate: 120,
      borderWidth: 1, borderColor: '#ffffff', borderOpacity: 0.1,
      borderRadius: 12, padding: 32,
      shadowX: 0, shadowY: 12, shadowBlur: 40, shadowSpread: 0,
      shadowColor: '#000000', shadowOpacity: 0.5,
    },
  },
  {
    key: 'frosted',
    name: { pt: 'Frosted', en: 'Frosted' },
    opts: {
      bgColor: '#ffffff', opacity: 0.25, blur: 20, saturate: 180,
      borderWidth: 2, borderColor: '#ffffff', borderOpacity: 0.4,
      borderRadius: 24, padding: 28,
      shadowX: 0, shadowY: 4, shadowBlur: 20, shadowSpread: 0,
      shadowColor: '#ffffff', shadowOpacity: 0.15,
    },
  },
  {
    key: 'neon',
    name: { pt: 'Neon', en: 'Neon' },
    opts: {
      bgColor: '#c026d3', opacity: 0.15, blur: 16, saturate: 200,
      borderWidth: 1, borderColor: '#f0abfc', borderOpacity: 0.6,
      borderRadius: 12, padding: 24,
      shadowX: 0, shadowY: 0, shadowBlur: 30, shadowSpread: 0,
      shadowColor: '#c026d3', shadowOpacity: 0.5,
    },
  },
  {
    key: 'pastel',
    name: { pt: 'Pastel', en: 'Pastel' },
    opts: {
      bgColor: '#f472b6', opacity: 0.2, blur: 12, saturate: 140,
      borderWidth: 1, borderColor: '#ffffff', borderOpacity: 0.5,
      borderRadius: 32, padding: 20,
      shadowX: 0, shadowY: 8, shadowBlur: 24, shadowSpread: 0,
      shadowColor: '#f472b6', shadowOpacity: 0.2,
    },
  },
  {
    key: 'minimal',
    name: { pt: 'Minimal', en: 'Minimal' },
    opts: {
      bgColor: '#ffffff', opacity: 0.05, blur: 8, saturate: 100,
      borderWidth: 1, borderColor: '#ffffff', borderOpacity: 0.15,
      borderRadius: 8, padding: 16,
      shadowX: 0, shadowY: 0, shadowBlur: 0, shadowSpread: 0,
      shadowColor: '#000000', shadowOpacity: 0,
    },
  },
]

export const BACKGROUND_PRESETS = [
  {
    key: 'purple',
    name: { pt: 'Roxo', en: 'Purple' },
    opts: { color1: '#667eea', color2: '#764ba2', angle: 135 },
  },
  {
    key: 'sunset',
    name: { pt: 'Pôr do sol', en: 'Sunset' },
    opts: { color1: '#ff9a9e', color2: '#fecfef', angle: 90 },
  },
  {
    key: 'ocean',
    name: { pt: 'Oceano', en: 'Ocean' },
    opts: { color1: '#2193b0', color2: '#6dd5ed', angle: 135 },
  },
  {
    key: 'forest',
    name: { pt: 'Floresta', en: 'Forest' },
    opts: { color1: '#11998e', color2: '#38ef7d', angle: 135 },
  },
  {
    key: 'neon',
    name: { pt: 'Neon', en: 'Neon' },
    opts: { color1: '#f953c6', color2: '#b91d73', angle: 135 },
  },
  {
    key: 'dark',
    name: { pt: 'Escuro', en: 'Dark' },
    opts: { color1: '#232526', color2: '#414345', angle: 135 },
  },
]

function parseColor(color) {
  if (!color) return '#000000'
  if (typeof color === 'string') return color
  if (color && typeof color.toHexString === 'function') return color.toHexString()
  return String(color)
}

function hexToRgb(hex) {
  const c = parseColor(hex).replace('#', '')
  const full = c.length === 3 ? c.split('').map((ch) => ch + ch).join('') : c
  const num = parseInt(full, 16)
  if (full.length !== 6 || Number.isNaN(num)) return { r: 0, g: 0, b: 0 }
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  }
}

function toRgba(hex, alpha) {
  const { r, g, b } = hexToRgb(hex)
  const a = Math.max(0, Math.min(1, Number(alpha) || 0))
  return `rgba(${r}, ${g}, ${b}, ${a})`
}

function toPx(v, fallback = 0) {
  const n = Number(v)
  return Number.isFinite(n) ? `${Math.max(0, n)}px` : `${fallback}px`
}

function safeClass(name) {
  const s = String(name || 'glass-card').trim()
  return s.replace(/\s+/g, '-') || 'glass-card'
}

export function buildGlassmorphismCss(options = {}) {
  const opts = { ...DEFAULTS, ...options }
  const c = safeClass(opts.className)
  const bg = toRgba(opts.bgColor, opts.opacity)
  const border = opts.borderWidth > 0
    ? `${toPx(opts.borderWidth)} solid ${toRgba(opts.borderColor, opts.borderOpacity)}`
    : 'none'
  const shadow = opts.shadowOpacity > 0 && (opts.shadowBlur > 0 || opts.shadowSpread !== 0)
    ? `${toPx(opts.shadowX)} ${toPx(opts.shadowY)} ${toPx(opts.shadowBlur)} ${toPx(opts.shadowSpread)} ${toRgba(opts.shadowColor, opts.shadowOpacity)}`
    : 'none'

  const blurVal = Math.max(0, Number(opts.blur) || 0)
  const satVal = Math.max(0, Number(opts.saturate) || 100)

  const css = [
    `.${c} {`,
    `  background: ${bg};`,
    `  backdrop-filter: blur(${blurVal}px) saturate(${satVal}%);`,
    `  -webkit-backdrop-filter: blur(${blurVal}px) saturate(${satVal}%);`,
    `  border: ${border};`,
    `  border-radius: ${toPx(opts.borderRadius)};`,
    `  padding: ${toPx(opts.padding)};`,
    '  background-clip: padding-box;',
    `  box-shadow: ${shadow};`,
    '  color: inherit;',
    '}',
    '',
    `/* Opcional: garante que filhos nao "vazem" o efeito de vidro */`,
    `.${c} > * {`,
    '  position: relative;',
    '  z-index: 1;',
    '}',
  ].join('\n')

  return {
    css,
    className: c,
    background: bg,
    border,
    shadow,
  }
}

export function buildGlassmorphismHtml(className = 'glass-card', text = 'Glassmorphism card') {
  const c = safeClass(className)
  return `<div class="${c}">\n  ${text}\n</div>`
}

export function buildGlassmorphismFullDemo(options = {}, text = 'Glassmorphism card') {
  const css = buildGlassmorphismCss(options).css
  const html = buildGlassmorphismHtml(options.className, text)
  return `<!-- HTML -->\n${html}\n\n/* CSS */\n${css}`
}
