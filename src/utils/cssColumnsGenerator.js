/**
 * Motor do Gerador de CSS Columns (Multicol).
 * Tudo roda no cliente — nenhuma chamada de rede.
 */

export const COLUMN_COUNTS = [1, 2, 3, 4, 5, 6]
export const COLUMN_WIDTHS = ['auto', 120, 160, 200, 240, 300, 360]
export const GAPS = [0, 8, 12, 16, 24, 32, 40, 64]
export const RULE_WIDTHS = [0, 1, 2, 3, 4, 6]
export const RULE_STYLES = ['solid', 'dashed', 'dotted', 'double', 'groove', 'ridge']
export const COLUMN_SPANS = ['none', 'all']
export const COLUMN_FILLS = ['balance', 'auto']
export const BREAK_INSIDES = ['auto', 'avoid', 'avoid-column']

export const DEFAULT_SETTINGS = {
  columnCount: 3,
  columnWidth: 'auto',
  gap: 24,
  ruleWidth: 1,
  ruleStyle: 'solid',
  ruleColor: '#d9d9d9',
  span: 'none',
  fill: 'balance',
  breakInside: 'auto',
}

export const PRESETS = [
  {
    key: 'magazine',
    label: { pt: 'Revista', en: 'Magazine' },
    settings: {
      columnCount: 3,
      columnWidth: 'auto',
      gap: 32,
      ruleWidth: 1,
      ruleStyle: 'solid',
      ruleColor: '#d9d9d9',
      span: 'all',
      fill: 'balance',
      breakInside: 'auto',
    },
  },
  {
    key: 'newspaper',
    label: { pt: 'Jornal', en: 'Newspaper' },
    settings: {
      columnCount: 4,
      columnWidth: 'auto',
      gap: 20,
      ruleWidth: 1,
      ruleStyle: 'solid',
      ruleColor: '#bfbfbf',
      span: 'none',
      fill: 'balance',
      breakInside: 'auto',
    },
  },
  {
    key: 'gallery',
    label: { pt: 'Galeria responsiva', en: 'Responsive gallery' },
    settings: {
      columnCount: 'auto',
      columnWidth: 200,
      gap: 16,
      ruleWidth: 0,
      ruleStyle: 'solid',
      ruleColor: '#d9d9d9',
      span: 'none',
      fill: 'balance',
      breakInside: 'avoid',
    },
  },
  {
    key: 'two-col',
    label: { pt: 'Duas colunas', en: 'Two columns' },
    settings: {
      columnCount: 2,
      columnWidth: 'auto',
      gap: 40,
      ruleWidth: 2,
      ruleStyle: 'dashed',
      ruleColor: '#1890ff',
      span: 'all',
      fill: 'balance',
      breakInside: 'auto',
    },
  },
]

function pxValue(value) {
  if (value === 'auto' || value === undefined || value === null || value === '') return undefined
  return `${value}px`
}

export function buildContainerStyle(settings) {
  const style = {}
  if (settings.columnCount !== 'auto') style.columnCount = settings.columnCount
  const width = pxValue(settings.columnWidth)
  if (width) style.columnWidth = width
  if (settings.gap > 0) style.columnGap = `${settings.gap}px`
  if (settings.ruleWidth > 0) {
    style.columnRuleWidth = `${settings.ruleWidth}px`
    style.columnRuleStyle = settings.ruleStyle
    style.columnRuleColor = settings.ruleColor
  }
  if (settings.fill && settings.fill !== 'balance') {
    style.columnFill = settings.fill
  }
  return style
}

export function buildChildStyle(settings) {
  const style = {}
  if (settings.span && settings.span !== 'none') style.columnSpan = settings.span
  if (settings.breakInside && settings.breakInside !== 'auto') style.breakInside = settings.breakInside
  return style
}

export function buildColumnsCss(settings, opts = {}) {
  const { selector = '.multicol', childSelector = '.multicol h2' } = opts
  const lines = []
  const props = []

  if (settings.columnCount !== 'auto') {
    props.push(`  column-count: ${settings.columnCount};`)
  }
  const width = pxValue(settings.columnWidth)
  if (width) {
    props.push(`  column-width: ${width};`)
  }
  if (settings.gap > 0) {
    props.push(`  column-gap: ${settings.gap}px;`)
  }
  if (settings.ruleWidth > 0) {
    props.push(`  column-rule: ${settings.ruleWidth}px ${settings.ruleStyle} ${settings.ruleColor};`)
  }
  if (settings.fill && settings.fill !== 'balance') {
    props.push(`  column-fill: ${settings.fill};`)
  }

  if (props.length === 0) return ''

  lines.push(`${selector} {`)
  lines.push(...props)
  lines.push('}')

  const childProps = []
  if (settings.span && settings.span !== 'none') {
    childProps.push(`  column-span: ${settings.span};`)
  }
  if (settings.breakInside && settings.breakInside !== 'auto') {
    childProps.push(`  break-inside: ${settings.breakInside};`)
  }
  if (childProps.length > 0) {
    lines.push('')
    lines.push(`${childSelector} {`)
    lines.push(...childProps)
    lines.push('}')
  }

  return lines.join('\n')
}

export function buildDemoHtml() {
  return `<div class="multicol">
  <h2>Título que pode atravessar as colunas</h2>
  <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
  <p>Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
  <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.</p>
</div>`
}

export function buildFullDemo(settings) {
  return `${buildColumnsCss(settings)}

${buildDemoHtml()}`
}

export function buildSummary(settings) {
  const parts = []
  if (settings.columnCount !== 'auto') parts.push(`${settings.columnCount} cols`)
  const width = pxValue(settings.columnWidth)
  if (width) parts.push(`min ${width}`)
  if (settings.gap > 0) parts.push(`gap ${settings.gap}px`)
  if (settings.ruleWidth > 0) parts.push(`rule ${settings.ruleWidth}px`)
  if (settings.span !== 'none') parts.push(`span ${settings.span}`)
  if (settings.breakInside !== 'auto') parts.push(`${settings.breakInside}`)
  return parts.join(' · ') || 'default'
}
