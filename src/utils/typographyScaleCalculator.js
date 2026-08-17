/**
 * Motor da Calculadora de Escala Tipográfica.
 *
 * Gera uma escala modular (modular scale) a partir de um tamanho base e uma
 * razão. Cada passo sobe/desce multiplicando/dividindo pela razão, produzindo
 * uma progressão geométrica harmoniosa usada em sistemas de design.
 */

export const PRESETS = [
  { key: 'golden', label: { pt: 'Proporção Áurea', en: 'Golden Ratio' }, ratio: 1.618 },
  { key: 'fourth', label: { pt: 'Quarta Justa', en: 'Perfect Fourth' }, ratio: 1.333 },
  { key: 'majorThird', label: { pt: 'Terça Maior', en: 'Major Third' }, ratio: 1.25 },
  { key: 'minorThird', label: { pt: 'Terça Menor', en: 'Minor Third' }, ratio: 1.2 },
  { key: 'majorSecond', label: { pt: 'Segunda Maior', en: 'Major Second' }, ratio: 1.125 },
  { key: 'custom', label: { pt: 'Personalizada', en: 'Custom' }, ratio: 1.25 },
]

export const STEP_NAMES = [
  '2xs',
  'xs',
  'sm',
  'base',
  'md',
  'lg',
  'xl',
  '2xl',
  '3xl',
  '4xl',
  '5xl',
  '6xl',
]

const DEFAULT_BASE = 16
const DEFAULT_RATIO = 1.25

function round(value, decimals) {
  const factor = 10 ** Math.max(0, decimals)
  return Math.round(value * factor) / factor
}

function toUnit(px, unit) {
  if (unit === 'rem') return px / 16
  return px
}

function formatValue(value, decimals, unit) {
  const converted = toUnit(value, unit)
  const rounded = round(converted, decimals)
  return `${rounded}${unit}`
}

/**
 * Gera os passos da escala tipográfica.
 *
 * @param {Object} opts
 * @param {number} opts.base - Tamanho base em pixels (default 16)
 * @param {number} opts.ratio - Razão da escala (default 1.25)
 * @param {number} opts.up - Quantidade de passos acima do base (default 4)
 * @param {number} opts.down - Quantidade de passos abaixo do base (default 2)
 * @param {number} opts.decimals - Casas decimais nos valores (default 3)
 * @param {string} opts.unit - 'px' ou 'rem' (default 'rem')
 * @param {number} opts.lineHeight - Altura de linha multiplicadora (default 1.5)
 *
 * @returns {Array<{key: string, label: string, px: number, value: string, lineHeight: string}>}
 */
export function buildScale({
  base = DEFAULT_BASE,
  ratio = DEFAULT_RATIO,
  up = 4,
  down = 2,
  decimals = 3,
  unit = 'rem',
  lineHeight = 1.5,
} = {}) {
  const safeBase = Math.max(1, Number(base) || DEFAULT_BASE)
  const safeRatio = Math.max(1.001, Number(ratio) || DEFAULT_RATIO)
  const safeUp = Math.max(0, Math.min(8, Number(up) || 0))
  const safeDown = Math.max(0, Math.min(4, Number(down) || 0))
  const safeDecimals = Math.max(0, Math.min(6, Number(decimals) || 0))
  const safeLineHeight = Math.max(1, Number(lineHeight) || 1.5)

  const steps = []
  const baseIndex = safeDown

  for (let i = -safeDown; i <= safeUp; i += 1) {
    const px = safeBase * safeRatio ** i
    const nameIndex = baseIndex + i
    const key = STEP_NAMES[nameIndex] || `step-${i >= 0 ? i + 1 : i}`
    const label = key === 'base' ? 'base' : key

    steps.push({
      key,
      label,
      px,
      value: formatValue(px, safeDecimals, unit),
      lineHeight: round(safeLineHeight, 3),
      lineHeightValue: formatValue(px * safeLineHeight, safeDecimals, unit),
      step: i,
    })
  }

  return steps
}

/**
 * Gera as variáveis CSS custom properties a partir da escala.
 *
 * @param {Array} steps - Saída de buildScale
 * @param {string} prefix - Prefixo das variáveis (default '--font-size-')
 *
 * @returns {string}
 */
export function generateCssVariables(steps, prefix = '--font-size-') {
  const lines = steps.map((s) => `  ${prefix}${s.key}: ${s.value};`)
  return [':root {', ...lines, '}', ''].join('\n')
}

/**
 * Gera um snippet CSS com classes utilitárias para cada passo.
 *
 * @param {Array} steps - Saída de buildScale
 * @param {string} prefix - Prefixo da classe (default 'text-')
 *
 * @returns {string}
 */
export function generateUtilityClasses(steps, prefix = 'text-') {
  const lines = steps.map(
    (s) => `.${prefix}${s.key} {\n  font-size: var(--font-size-${s.key});\n  line-height: ${s.lineHeight};\n}`
  )
  return lines.join('\n\n')
}

/**
 * Gera um resumo em Markdown da escala.
 *
 * @param {Array} steps - Saída de buildScale
 * @param {string} unit - Unidade usada
 *
 * @returns {string}
 */
export function generateMarkdownTable(steps, unit = 'rem') {
  const header = `| Step | Size (${unit}) | Line height |`
  const separator = '|------|-------------:|------------:|'
  const rows = steps.map((s) => `| ${s.label} | ${s.value} | ${s.lineHeight} |`)
  return [header, separator, ...rows].join('\n')
}

/**
 * Calcula a altura de linha ideal mínima para manter legibilidade com
 * tamanhos muito grandes (títulos precisam de line-height menor).
 *
 * @param {number} px - Tamanho em pixels
 * @param {number} base - Tamanho base
 *
 * @returns {number}
 */
export function suggestLineHeight(px, base = DEFAULT_BASE) {
  const ratio = px / base
  if (ratio >= 4) return 1.0
  if (ratio >= 2) return 1.1
  if (ratio >= 1.5) return 1.25
  if (ratio >= 1) return 1.5
  return 1.6
}
