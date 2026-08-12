// Gerador de estilização para <input type="range"> usando só CSS.
//
// A dificuldade real de customizar range é que cada engine usa pseudo-elementos
// diferentes: WebKit usa ::-webkit-slider-runnable-track e
// ::-webkit-slider-thumb; Firefox usa ::-moz-range-track, ::-moz-range-progress e
// ::-moz-range-thumb. Geramos os dois blocos para cobrir os principais
// navegadores. O preenchimento até o thumb ("progress") é feito no WebKit via
// linear-gradient controlado pelas variáveis --value/--min/--max; no Firefox
// usamos ::-moz-range-progress.

function parseColor(color) {
  if (!color) return '#000000'
  if (typeof color === 'string') return color
  if (color && typeof color.toHexString === 'function') return color.toHexString()
  return String(color)
}

function toPx(v, fallback = 0) {
  const n = Number(v)
  return Number.isFinite(n) ? `${Math.max(0, n)}px` : `${fallback}px`
}

function safeClass(name) {
  const s = String(name || 'range-slider').trim()
  return s.replace(/\s+/g, '-') || 'range-slider'
}

// Opções:
//   className, min, max, value,
//   trackHeight, trackColor, trackRadius,
//   fillColor, showFill,
//   thumbWidth, thumbHeight, thumbColor,
//   thumbBorderWidth, thumbBorderColor, thumbRadius,
//   hoverThumbColor, activeThumbColor,
//   disabledTrackColor, disabledThumbColor
export function buildRangeSliderCss(options = {}) {
  const {
    className = 'range-slider',
    min = 0,
    max = 100,
    value = 50,
    trackHeight = 8,
    trackColor = '#e5e7eb',
    trackRadius = 999,
    fillColor = '#3b82f6',
    showFill = true,
    thumbWidth = 20,
    thumbHeight = 20,
    thumbColor = '#2563eb',
    thumbBorderWidth = 2,
    thumbBorderColor = '#ffffff',
    thumbRadius = 50,
    hoverThumbColor = '#1d4ed8',
    activeThumbColor = '#1e40af',
    disabledTrackColor = '#d1d5db',
    disabledThumbColor = '#9ca3af',
  } = options

  const c = safeClass(className)
  const tc = parseColor(trackColor)
  const fc = parseColor(fillColor)
  const thc = parseColor(thumbColor)
  const tbc = parseColor(thumbBorderColor)
  const htc = parseColor(hoverThumbColor)
  const atc = parseColor(activeThumbColor)
  const dtc = parseColor(disabledTrackColor)
  const dhc = parseColor(disabledThumbColor)

  const th = toPx(trackHeight)
  const tr = toPx(trackRadius)
  const tw = toPx(thumbWidth)
  const thh = toPx(thumbHeight)
  const tbw = toPx(thumbBorderWidth)
  const tbr = toPx(thumbRadius)
  const marginTop = (Number(trackHeight) - Number(thumbHeight)) / 2

  const fillStop = `calc((var(--value, ${value}) - var(--min, ${min})) / (var(--max, ${max}) - var(--min, ${min})) * 100%)`
  const trackBg = showFill
    ? `linear-gradient(to right, ${fc} 0%, ${fc} ${fillStop}, ${tc} ${fillStop}, ${tc} 100%)`
    : tc

  const webkit = [
    `.${c} {`,
    '  -webkit-appearance: none;',
    '  -moz-appearance: none;',
    '  appearance: none;',
    '  width: 100%;',
    '  background: transparent;',
    '  cursor: pointer;',
    '}',
    '',
    `.${c}:focus {`,
    '  outline: none;',
    '}',
    '',
    `.${c}::-webkit-slider-runnable-track {`,
    `  width: 100%;`,
    `  height: ${th};`,
    `  background: ${trackBg};`,
    `  border-radius: ${tr};`,
    '}',
    '',
    `.${c}::-webkit-slider-thumb {`,
    '  -webkit-appearance: none;',
    '  appearance: none;',
    `  margin-top: ${marginTop}px;`,
    `  width: ${tw};`,
    `  height: ${thh};`,
    `  background: ${thc};`,
    `  border: ${tbw} solid ${tbc};`,
    `  border-radius: ${tbr};`,
    '  cursor: pointer;',
    '  transition: background 0.15s ease, transform 0.15s ease;',
    '}',
    '',
    `.${c}:hover::-webkit-slider-thumb {`,
    `  background: ${htc};`,
    '  transform: scale(1.05);',
    '}',
    '',
    `.${c}:active::-webkit-slider-thumb {`,
    `  background: ${atc};`,
    '  transform: scale(0.95);',
    '}',
    '',
    `.${c}:disabled::-webkit-slider-runnable-track {`,
    `  background: ${dtc};`,
    '  cursor: not-allowed;',
    '}',
    '',
    `.${c}:disabled::-webkit-slider-thumb {`,
    `  background: ${dhc};`,
    '  cursor: not-allowed;',
    '  transform: none;',
    '}',
  ]

  const moz = [
    `.${c}::-moz-range-track {`,
    `  width: 100%;`,
    `  height: ${th};`,
    `  background: ${tc};`,
    `  border-radius: ${tr};`,
    '}',
    '',
    `.${c}::-moz-range-progress {`,
    `  height: ${th};`,
    `  background: ${showFill ? fc : tc};`,
    `  border-radius: ${tr};`,
    '}',
    '',
    `.${c}::-moz-range-thumb {`,
    '  -moz-appearance: none;',
    '  appearance: none;',
    `  width: ${tw};`,
    `  height: ${thh};`,
    `  background: ${thc};`,
    `  border: ${tbw} solid ${tbc};`,
    `  border-radius: ${tbr};`,
    '  cursor: pointer;',
    '  transition: background 0.15s ease, transform 0.15s ease;',
    '}',
    '',
    `.${c}:hover::-moz-range-thumb {`,
    `  background: ${htc};`,
    '  transform: scale(1.05);',
    '}',
    '',
    `.${c}:active::-moz-range-thumb {`,
    `  background: ${atc};`,
    '  transform: scale(0.95);',
    '}',
    '',
    `.${c}:disabled::-moz-range-track {`,
    `  background: ${dtc};`,
    '  cursor: not-allowed;',
    '}',
    '',
    `.${c}:disabled::-moz-range-progress {`,
    `  background: ${dtc};`,
    '}',
    '',
    `.${c}:disabled::-moz-range-thumb {`,
    `  background: ${dhc};`,
    '  cursor: not-allowed;',
    '  transform: none;',
    '}',
  ]

  const css = [...webkit, '', ...moz].join('\n')

  return { css, className: c }
}

// HTML de exemplo. As variáveis CSS controlam o preenchimento do WebKit.
export function buildRangeSliderHtml(className = 'range-slider', min = 0, max = 100, value = 50) {
  const c = safeClass(className)
  return `<input
  type="range"
  class="${c}"
  min="${min}"
  max="${max}"
  value="${value}"
  style="--value: ${value}; --min: ${min}; --max: ${max};"
/>`
}

// Junta HTML + CSS num bloco completo.
export function buildRangeSliderFullDemo(options = {}) {
  const result = buildRangeSliderCss(options)
  const html = buildRangeSliderHtml(result.className, options.min, options.max, options.value)
  return `<style>\n${result.css}\n</style>\n\n${html}`
}
