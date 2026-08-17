export const CONDITION_TYPES = [
  { value: 'property', label: 'property: value' },
  { value: 'selector', label: 'selector(...)' },
  { value: 'font-format', label: 'font-format(...)' },
  { value: 'font-tech', label: 'font-tech(...)' },
]

export const OPERATORS = [
  { value: 'and', label: 'and' },
  { value: 'or', label: 'or' },
]

export const COMMON_PROPERTIES = [
  'display',
  'grid',
  'flex',
  'container-type',
  'container-name',
  'aspect-ratio',
  'clip-path',
  'mask',
  'backdrop-filter',
  'filter',
  'scroll-timeline',
  'view-timeline',
  'animation-timeline',
  'anchor-name',
  'anchor-default',
  'position-anchor',
  'offset-anchor',
  'field-sizing',
  'text-wrap',
  'transition-behavior',
  'color-mix',
  'calc',
  'min',
  'max',
  'clamp',
  'var',
  'env',
]

export const COMMON_VALUES = {
  display: ['grid', 'flex', 'contents', 'flow-root', 'subgrid'],
  'container-type': ['size', 'inline-size', 'normal'],
  'aspect-ratio': ['16 / 9', '1 / 1', '4 / 3'],
  'clip-path': ['circle(50%)', 'polygon(0 0, 100% 0, 50% 100%)', 'inset(10px)'],
  'backdrop-filter': ['blur(10px)', 'grayscale(1)'],
  filter: ['blur(10px)', 'grayscale(1)', 'drop-shadow(0 0 5px #000)'],
  'scroll-timeline': ['--timeline', 'none'],
  'view-timeline': ['--timeline', 'none'],
  'animation-timeline': ['--timeline', 'none', 'scroll()'],
  'anchor-name': ['--anchor'],
  'anchor-default': ['--anchor'],
  'position-anchor': ['--anchor'],
  'offset-anchor': ['center', 'auto'],
  'field-sizing': ['content', 'fixed'],
  'text-wrap': ['balance', 'pretty', 'stable'],
  'transition-behavior': ['allow-discrete', 'normal'],
  'color-mix': ['in srgb', 'in oklab', 'in hsl'],
}

export const DEFAULTS = {
  conditions: [
    { id: '1', type: 'property', property: 'display', value: 'grid', negate: false },
  ],
  operator: 'and',
  negateGroup: false,
  styles: '.box {\n  display: grid;\n  gap: 1rem;\n}',
}

export const PRESETS = [
  {
    key: 'grid',
    labelKey: 'presetGrid',
    state: {
      conditions: [{ id: '1', type: 'property', property: 'display', value: 'grid', negate: false }],
      operator: 'and',
      negateGroup: false,
      styles: '.grid {\n  display: grid;\n  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));\n  gap: 1rem;\n}',
    },
  },
  {
    key: 'container-queries',
    labelKey: 'presetContainerQueries',
    state: {
      conditions: [{ id: '1', type: 'property', property: 'container-type', value: 'size', negate: false }],
      operator: 'and',
      negateGroup: false,
      styles: '.wrapper {\n  container-type: inline-size;\n}\n\n@container (min-width: 400px) {\n  .card { flex-direction: row; }\n}',
    },
  },
  {
    key: 'has',
    labelKey: 'presetHas',
    state: {
      conditions: [{ id: '1', type: 'selector', property: ':has(*)', value: '', negate: false }],
      operator: 'and',
      negateGroup: false,
      styles: '.card:has(.badge) {\n  border-color: #1677ff;\n}',
    },
  },
  {
    key: 'scroll-driven',
    labelKey: 'presetScrollDriven',
    state: {
      conditions: [
        { id: '1', type: 'property', property: 'animation-timeline', value: 'scroll()', negate: false },
        { id: '2', type: 'property', property: 'animation-range', value: 'entry 0% cover 50%', negate: false },
      ],
      operator: 'and',
      negateGroup: false,
      styles: '.reveal {\n  animation: fade-in linear both;\n  animation-timeline: view();\n  animation-range: entry 25% cover 50%;\n}\n\n@keyframes fade-in {\n  from { opacity: 0; }\n  to { opacity: 1; }\n}',
    },
  },
  {
    key: 'anchor',
    labelKey: 'presetAnchor',
    state: {
      conditions: [
        { id: '1', type: 'property', property: 'anchor-name', value: '--anchor', negate: false },
        { id: '2', type: 'property', property: 'position-anchor', value: '--anchor', negate: false },
      ],
      operator: 'and',
      negateGroup: false,
      styles: '.anchor {\n  anchor-name: --anchor;\n}\n\n.tooltip {\n  position: absolute;\n  position-anchor: --anchor;\n  inset-area: bottom;\n}',
    },
  },
]

export function buildConditionText(condition) {
  const { type, property, value } = condition
  const trimmedProperty = (property || '').trim()
  const trimmedValue = (value || '').trim()

  switch (type) {
    case 'selector':
      return `selector(${trimmedProperty || ':has(*)'})`
    case 'font-format':
      return `font-format(${trimmedProperty || 'woff2'})`
    case 'font-tech':
      return `font-tech(${trimmedProperty || 'color-COLRv1'})`
    case 'property':
    default:
      return `${trimmedProperty || 'display'}: ${trimmedValue || 'grid'}`
  }
}

export function buildFeatureQuery(state) {
  const { conditions, operator, negateGroup } = state
  if (!conditions || conditions.length === 0) return ''

  const parts = conditions.map((c) => {
    const text = buildConditionText(c)
    return c.negate ? `not (${text})` : `(${text})`
  })

  let inner = parts.join(` ${operator} `)
  if (conditions.length > 1 && !negateGroup) {
    inner = `(${inner})`
  }

  return negateGroup ? `not ${inner}` : inner
}

export function buildSupportsRule(state) {
  const query = buildFeatureQuery(state)
  if (!query) return ''
  const styles = (state.styles || '').trim()
  const body = styles ? `\n${styles}\n` : '\n'
  return `@supports ${query} {${body}}`
}

export function buildNegatedRule(state) {
  const { conditions, operator } = state
  const parts = conditions.map((c) => {
    const text = buildConditionText(c)
    return c.negate ? `(${text})` : `not (${text})`
  })
  const query = parts.join(` ${operator} `)
  const styles = (state.styles || '').trim()
  const body = styles ? `\n${styles}\n` : '\n'
  return `@supports ${query} {${body}}`
}

export function checkBrowserSupport(state) {
  const query = buildFeatureQuery(state)
  if (!query) return { supported: false, error: 'empty query' }
  try {
    const rawQuery = state.negateGroup
      ? query.replace(/^not\s+/, '')
      : query
    const supports = typeof CSS !== 'undefined' && CSS.supports(rawQuery)
    return { supported: state.negateGroup ? !supports : supports }
  } catch (err) {
    return { supported: false, error: err.message }
  }
}

export function validateCondition(condition) {
  const { type, property, value } = condition
  const trimmedProperty = (property || '').trim()
  if (!trimmedProperty) return false
  if (type === 'property') {
    const trimmedValue = (value || '').trim()
    if (!trimmedValue) return false
  }
  return true
}

export function allConditionsValid(conditions) {
  return conditions.every(validateCondition)
}

export function getPlaceholderByType(type) {
  switch (type) {
    case 'selector':
      return ':has(*)'
    case 'font-format':
      return 'woff2'
    case 'font-tech':
      return 'color-COLRv1'
    case 'property':
    default:
      return 'grid'
  }
}
