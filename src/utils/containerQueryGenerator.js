export const DEFAULT_CONTAINER = {
  name: 'card-container',
  type: 'inline-size',
}

export const CONTAINER_TYPES = ['inline-size', 'size', 'normal']

export const DEFAULT_BREAKPOINTS = [
  { minWidth: 0, maxWidth: 399, styles: { backgroundColor: '#fff2f0', color: '#cf1322', fontSize: 14, padding: 16, flexDirection: 'column', gap: 8 } },
  { minWidth: 400, maxWidth: 699, styles: { backgroundColor: '#e6f7ff', color: '#0958d9', fontSize: 16, padding: 20, flexDirection: 'row', gap: 12 } },
  { minWidth: 700, maxWidth: null, styles: { backgroundColor: '#f6ffed', color: '#389e0d', fontSize: 18, padding: 24, flexDirection: 'row', gap: 16 } },
]

const STYLE_KEYS = [
  'backgroundColor',
  'color',
  'fontSize',
  'padding',
  'flexDirection',
  'gap',
  'borderRadius',
]

function formatValue(key, value) {
  if (value == null || value === '') return null
  if (['fontSize', 'padding', 'gap', 'borderRadius'].includes(key)) {
    const num = Number(value)
    if (!Number.isNaN(num)) return `${num}px`
  }
  return value
}

export function buildBreakpointQuery(containerName, bp, index) {
  const conditions = []
  if (bp.minWidth != null && bp.minWidth !== '') conditions.push(`(min-width: ${bp.minWidth}px)`)
  if (bp.maxWidth != null && bp.maxWidth !== '') conditions.push(`(max-width: ${bp.maxWidth}px)`)
  if (conditions.length === 0) return ''

  const query = conditions.join(' and ')
  const selector = `.${containerName}__item`
  const declarations = []

  for (const key of STYLE_KEYS) {
    const raw = bp.styles?.[key]
    const value = formatValue(key, raw)
    if (value != null) declarations.push(`  ${toKebab(key)}: ${value};`)
  }

  if (declarations.length === 0) return ''

  const namePrefix = containerName && containerName !== 'none' ? `${containerName} ` : ''
  return `@container ${namePrefix}${query} {
${selector} {
${declarations.join('\n')}
}
}`
}

export function buildContainerCss(container, breakpoints) {
  const { name, type } = container
  const safeName = (name || 'container').replace(/[^a-zA-Z0-9_-]/g, '-')

  const containerRule = type === 'normal'
    ? `.${safeName} {
  container-name: ${safeName};
}`
    : `.${safeName} {
  container-type: ${type};
  container-name: ${safeName};
}`

  const baseRule = `.${safeName}__item {
  display: flex;
  transition: all 0.25s ease;
}`

  const queryBlocks = breakpoints
    .map((bp, i) => buildBreakpointQuery(safeName, bp, i))
    .filter(Boolean)

  return [containerRule, baseRule, ...queryBlocks].join('\n\n')
}

export function buildDemoHtml(container) {
  const safeName = (container.name || 'container').replace(/[^a-zA-Z0-9_-]/g, '-')
  return `<div class="${safeName}">
  <div class="${safeName}__item">
    <div>🎨</div>
    <div>
      <strong>Container Queries</strong>
      <p>Redimensione o container para ver as mudanças.</p>
    </div>
  </div>
</div>`
}

function toKebab(str) {
  return str.replace(/([A-Z])/g, '-$1').toLowerCase()
}
