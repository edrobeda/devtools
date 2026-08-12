// Gerador de Skeleton/Placeholder CSS puro.
//
// Cria blocos de loading placeholder com animações pulse, shimmer (deslize de
// brilho) ou wave (gradiente se movendo continuamente). Totalmente client-side
// e sem depender de bibliotecas externas.

function parseColor(color) {
  if (!color) return '#e5e5ea'
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
  variant: 'shimmer',
  baseColor: '#e5e5ea',
  highlightColor: '#f5f5f7',
  borderRadius: 8,
  duration: 1600,
  lineHeight: 16,
  lineGap: 12,
  circleSize: 64,
  rectWidth: 320,
  rectHeight: 160,
  layout: 'lines',
  textAlign: 'left',
  waveWidth: '200%',
}

const PRESETS = {
  shimmer: {
    variant: 'shimmer',
    baseColor: '#e5e5ea',
    highlightColor: '#f5f5f7',
    duration: 1600,
  },
  pulse: {
    variant: 'pulse',
    baseColor: '#e5e5ea',
    highlightColor: '#f5f5f7',
    duration: 1500,
  },
  wave: {
    variant: 'wave',
    baseColor: '#e5e5ea',
    highlightColor: '#f2f2f7',
    duration: 2000,
  },
  dark: {
    variant: 'shimmer',
    baseColor: '#2a2a2a',
    highlightColor: '#3a3a3a',
    duration: 1800,
  },
  minimal: {
    variant: 'pulse',
    baseColor: '#f0f0f0',
    highlightColor: '#fafafa',
    duration: 1200,
  },
}

export { PRESETS, DEFAULTS }

export function buildSkeletonCss(options = {}) {
  const opts = { ...DEFAULTS, ...options }
  const variant = ['pulse', 'shimmer', 'wave'].includes(opts.variant) ? opts.variant : 'shimmer'
  const base = parseColor(opts.baseColor)
  const highlight = parseColor(opts.highlightColor)
  const borderRadius = clamp(Number(opts.borderRadius) || DEFAULTS.borderRadius, 0, 999)
  const duration = clamp(Number(opts.duration) || DEFAULTS.duration, 200, 5000)
  const lineHeight = clamp(Number(opts.lineHeight) || DEFAULTS.lineHeight, 4, 128)
  const lineGap = clamp(Number(opts.lineGap) || DEFAULTS.lineGap, 0, 64)
  const circleSize = clamp(Number(opts.circleSize) || DEFAULTS.circleSize, 16, 400)
  const rectWidth = clamp(Number(opts.rectWidth) || DEFAULTS.rectWidth, 32, 800)
  const rectHeight = clamp(Number(opts.rectHeight) || DEFAULTS.rectHeight, 16, 600)

  const lines = [
    '/* Skeleton container */',
    '.skeleton {',
    `  --skeleton-base: ${base};`,
    `  --skeleton-highlight: ${highlight};`,
    '  display: flex;',
    '  flex-direction: column;',
    '  gap: 0;',
    '  width: 100%;',
    '  max-width: 100%;',
    '}',
    '',
    '.skeleton * {',
    '  box-sizing: border-box;',
    '}',
    '',
    '/* Base block */',
    '.skeleton__block {',
    '  background: var(--skeleton-base);',
    `  border-radius: ${toPx(borderRadius)};`,
    '  position: relative;',
    '  overflow: hidden;',
    '}',
    '',
    '/* Text lines */',
    '.skeleton__line {',
    `  height: ${toPx(lineHeight)};`,
    `  margin-bottom: ${toPx(lineGap)};`,
    '  width: 100%;',
    '}',
    '',
    '.skeleton__line:last-child {',
    '  margin-bottom: 0;',
    '  width: 60%;',
    '}',
    '',
    '/* Circle */',
    '.skeleton__circle {',
    `  width: ${toPx(circleSize)};`,
    `  height: ${toPx(circleSize)};`,
    '  border-radius: 50%;',
    '  flex-shrink: 0;',
    '}',
    '',
    '/* Rectangle */',
    '.skeleton__rect {',
    `  width: ${toPx(rectWidth)};`,
    `  height: ${toPx(rectHeight)};`,
    '  max-width: 100%;',
    '}',
    '',
    '/* Horizontal row with circle + lines */',
    '.skeleton__row {',
    '  display: flex;',
    '  align-items: center;',
    '  gap: 16px;',
    '  width: 100%;',
    '}',
    '',
    '.skeleton__row .skeleton__lines {',
    '  flex: 1;',
    '}',
  ]

  if (variant === 'pulse') {
    lines.push(
      '',
      '/* Pulse animation */',
      '.skeleton__block {',
      `  animation: skeleton-pulse ${duration}ms ease-in-out infinite;`,
      '}',
      '',
      '@keyframes skeleton-pulse {',
      '  0%, 100% { opacity: 1; }',
      '  50% { opacity: 0.55; }',
      '}',
      '',
      '@media (prefers-reduced-motion: reduce) {',
      '  .skeleton__block {',
      '    animation: none;',
      '  }',
      '}'
    )
  } else if (variant === 'shimmer') {
    lines.push(
      '',
      '/* Shimmer overlay */',
      '.skeleton__block::after {',
      '  content: "";',
      '  position: absolute;',
      '  inset: 0;',
      '  transform: translateX(-100%);',
      `  background: linear-gradient(90deg, transparent 0%, var(--skeleton-highlight) 50%, transparent 100%);`,
      `  animation: skeleton-shimmer ${duration}ms infinite;`,
      '}',
      '',
      '@keyframes skeleton-shimmer {',
      '  100% { transform: translateX(100%); }',
      '}',
      '',
      '@media (prefers-reduced-motion: reduce) {',
      '  .skeleton__block::after {',
      '    animation: none;',
      '  }',
      '}'
    )
  } else if (variant === 'wave') {
    lines.push(
      '',
      '/* Wave gradient animation */',
      '.skeleton__block {',
      `  background: linear-gradient(90deg, var(--skeleton-base) 25%, var(--skeleton-highlight) 50%, var(--skeleton-base) 75%);`,
      '  background-size: 200% 100%;',
      `  animation: skeleton-wave ${duration}ms linear infinite;`,
      '}',
      '',
      '@keyframes skeleton-wave {',
      '  0% { background-position: 200% 0; }',
      '  100% { background-position: -200% 0; }',
      '}',
      '',
      '@media (prefers-reduced-motion: reduce) {',
      '  .skeleton__block {',
      '    animation: none;',
      '    background: var(--skeleton-base);',
      '  }',
      '}'
    )
  }

  lines.push(
    '',
    '/* Visually hidden while loading (accessibility helper) */',
    '.skeleton--hidden-content .skeleton__block {',
    '  color: transparent;',
    '}',
    '',
    '/* Utility: compact spacing between rows */',
    '.skeleton--compact {',
    '  gap: 8px;',
    '}'
  )

  return lines.join('\n')
}

export function buildSkeletonHtml(options = {}) {
  const opts = { ...DEFAULTS, ...options }
  const layout = ['lines', 'circle', 'rect', 'mixed'].includes(opts.layout) ? opts.layout : 'lines'
  const align = ['left', 'center', 'right'].includes(opts.textAlign) ? opts.textAlign : 'left'
  const lineCount = clamp(Number(opts.lineCount) || 4, 1, 12)

  let content = ''

  if (layout === 'lines') {
    content = [
      '  <div class="skeleton__lines">',
      Array.from({ length: lineCount }, () => '    <div class="skeleton__block skeleton__line"></div>').join('\n'),
      '  </div>',
    ].join('\n')
  } else if (layout === 'circle') {
    content = '  <div class="skeleton__block skeleton__circle"></div>'
  } else if (layout === 'rect') {
    content = '  <div class="skeleton__block skeleton__rect"></div>'
  } else if (layout === 'mixed') {
    content = [
      '  <div class="skeleton__row">',
      '    <div class="skeleton__block skeleton__circle"></div>',
      '    <div class="skeleton__lines">',
      Array.from({ length: Math.max(1, lineCount - 1) }, () => '      <div class="skeleton__block skeleton__line"></div>').join('\n'),
      '    </div>',
      '  </div>',
    ].join('\n')
  }

  return [
    '<div class="skeleton" role="status" aria-live="polite" aria-busy="true" style="align-items: ' + align + ';">',
    content,
    '  <span class="visually-hidden">Loading...</span>',
    '</div>',
  ].join('\n')
}

export function buildSkeletonFullDemo(options = {}) {
  return `${buildSkeletonCss(options)}\n\n${buildSkeletonHtml(options)}`
}
