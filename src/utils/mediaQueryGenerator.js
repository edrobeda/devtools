export const DEFAULT_SELECTOR = '.card'

export const DEFAULT_BREAKPOINTS = [
  {
    id: 'bp-1',
    conditions: [{ type: 'max-width', value: 767 }],
    styles: {
      backgroundColor: '#fff2f0',
      color: '#cf1322',
      fontSize: 14,
      padding: 16,
      borderRadius: 8,
      display: 'block',
      flexDirection: 'row',
      gap: 8,
    },
  },
  {
    id: 'bp-2',
    conditions: [{ type: 'min-width', value: 768 }],
    styles: {
      backgroundColor: '#f6ffed',
      color: '#389e0d',
      fontSize: 18,
      padding: 24,
      borderRadius: 12,
      display: 'flex',
      flexDirection: 'row',
      gap: 16,
    },
  },
]

export const CONDITION_TYPES = [
  { value: 'min-width', labelKey: 'minWidth', numeric: true },
  { value: 'max-width', labelKey: 'maxWidth', numeric: true },
  { value: 'width-range', labelKey: 'widthRange', numeric: true, range: true },
  { value: 'min-height', labelKey: 'minHeight', numeric: true },
  { value: 'max-height', labelKey: 'maxHeight', numeric: true },
  { value: 'orientation', labelKey: 'orientation', options: ['portrait', 'landscape'] },
  { value: 'aspect-ratio', labelKey: 'aspectRatio', text: true },
  { value: 'prefers-color-scheme', labelKey: 'prefersColorScheme', options: ['dark', 'light'] },
  { value: 'prefers-reduced-motion', labelKey: 'prefersReducedMotion', options: ['reduce', 'no-preference'] },
  { value: 'hover', labelKey: 'hover', options: ['hover', 'none'] },
  { value: 'pointer', labelKey: 'pointer', options: ['fine', 'coarse', 'none'] },
  { value: 'display-mode', labelKey: 'displayMode', options: ['fullscreen', 'standalone', 'minimal-ui', 'browser', 'window-controls-overlay'] },
]

export const DISPLAY_OPTIONS = ['block', 'flex', 'grid', 'inline-flex', 'inline-block', 'none']
export const FLEX_DIRECTION_OPTIONS = ['row', 'row-reverse', 'column', 'column-reverse']

const STYLE_KEYS = [
  'backgroundColor',
  'color',
  'fontSize',
  'padding',
  'borderRadius',
  'display',
  'flexDirection',
  'gap',
]

export function toKebab(str) {
  return str.replace(/([A-Z])/g, '-$1').toLowerCase()
}

function formatStyleValue(key, value) {
  if (value == null || value === '') return null
  if (['fontSize', 'padding', 'borderRadius', 'gap'].includes(key)) {
    const num = Number(value)
    if (!Number.isNaN(num)) return `${num}px`
  }
  return value
}

export function buildConditionString(condition, rangeSyntax = true) {
  const { type, value, valueMax } = condition

  switch (type) {
    case 'min-width':
      return rangeSyntax ? `(width >= ${value}px)` : `(min-width: ${value}px)`
    case 'max-width':
      return rangeSyntax ? `(width <= ${value}px)` : `(max-width: ${value}px)`
    case 'width-range': {
      const min = value ?? 0
      const max = valueMax ?? 99999
      return rangeSyntax
        ? `(${min}px <= width <= ${max}px)`
        : `(min-width: ${min}px) and (max-width: ${max}px)`
    }
    case 'min-height':
      return rangeSyntax ? `(height >= ${value}px)` : `(min-height: ${value}px)`
    case 'max-height':
      return rangeSyntax ? `(height <= ${value}px)` : `(max-height: ${value}px)`
    case 'orientation':
    case 'prefers-color-scheme':
    case 'prefers-reduced-motion':
    case 'hover':
    case 'pointer':
    case 'display-mode':
      return `(${type}: ${value})`
    case 'aspect-ratio':
      return `(aspect-ratio: ${value})`
    default:
      return ''
  }
}

export function buildQuery(conditions, rangeSyntax = true) {
  const parts = conditions
    .map((c) => buildConditionString(c, rangeSyntax))
    .filter(Boolean)
  return parts.join(' and ')
}

export function formatStyles(styles) {
  const declarations = []
  for (const key of STYLE_KEYS) {
    const raw = styles?.[key]
    if (key === 'flexDirection' && styles?.display !== 'flex' && styles?.display !== 'inline-flex') {
      continue
    }
    if (key === 'gap' && styles?.display !== 'flex' && styles?.display !== 'grid' && styles?.display !== 'inline-flex') {
      continue
    }
    const value = formatStyleValue(key, raw)
    if (value != null) declarations.push(`  ${toKebab(key)}: ${value};`)
  }
  return declarations.join('\n')
}

export function buildBreakpointCss(selector, query, styles) {
  const declarations = formatStyles(styles)
  if (!declarations) return ''
  return `@media ${query} {\n${selector} {\n${declarations}\n  }\n}`
}

export function buildCss(selector, breakpoints, rangeSyntax = true) {
  return breakpoints
    .map((bp) => {
      const query = buildQuery(bp.conditions, rangeSyntax)
      if (!query) return ''
      return buildBreakpointCss(selector, query, bp.styles)
    })
    .filter(Boolean)
    .join('\n\n')
}

export function buildHtmlExample(selector) {
  const className = selector.startsWith('.') ? selector.slice(1) : selector
  return `<div class="${className}">\n  <h2>Responsive element</h2>\n  <p>Resize the viewport to see the media query styles in action.</p>\n</div>`
}

export function evaluateWidthConditions(conditions, width) {
  if (!conditions || conditions.length === 0) return false
  let hasWidth = false
  for (const c of conditions) {
    if (c.type === 'min-width') {
      hasWidth = true
      if (width < Number(c.value)) return false
    } else if (c.type === 'max-width') {
      hasWidth = true
      if (width > Number(c.value)) return false
    } else if (c.type === 'width-range') {
      hasWidth = true
      const min = Number(c.value ?? 0)
      const max = Number(c.valueMax ?? Infinity)
      if (width < min || width > max) return false
    }
  }
  return hasWidth
}

export function getActiveBreakpointIndex(breakpoints, width, rangeSyntax = true) {
  for (let i = 0; i < breakpoints.length; i++) {
    if (evaluateWidthConditions(breakpoints[i].conditions, width)) return i
  }
  return -1
}

export function getActiveStyles(breakpoints, width, rangeSyntax = true) {
  const index = getActiveBreakpointIndex(breakpoints, width, rangeSyntax)
  return index >= 0 ? breakpoints[index].styles : {}
}

export const PRESETS = [
  { key: 'mobile-first', labelKey: 'presetMobileFirst' },
  { key: 'desktop-first', labelKey: 'presetDesktopFirst' },
  { key: 'dark-mode', labelKey: 'presetDarkMode' },
  { key: 'reduced-motion', labelKey: 'presetReducedMotion' },
  { key: 'portrait', labelKey: 'presetPortrait' },
]

export function getPresetBreakpoints(key) {
  switch (key) {
    case 'mobile-first':
      return [
        {
          id: 'bp-mobile',
          conditions: [{ type: 'max-width', value: 767 }],
          styles: { backgroundColor: '#fff2f0', color: '#cf1322', fontSize: 14, padding: 16, borderRadius: 8, display: 'block', flexDirection: 'row', gap: 8 },
        },
        {
          id: 'bp-tablet',
          conditions: [{ type: 'min-width', value: 768 }, { type: 'max-width', value: 1023 }],
          styles: { backgroundColor: '#e6f7ff', color: '#0958d9', fontSize: 16, padding: 20, borderRadius: 10, display: 'flex', flexDirection: 'row', gap: 12 },
        },
        {
          id: 'bp-desktop',
          conditions: [{ type: 'min-width', value: 1024 }],
          styles: { backgroundColor: '#f6ffed', color: '#389e0d', fontSize: 18, padding: 24, borderRadius: 12, display: 'flex', flexDirection: 'row', gap: 16 },
        },
      ]
    case 'desktop-first':
      return [
        {
          id: 'bp-desktop',
          conditions: [{ type: 'min-width', value: 1024 }],
          styles: { backgroundColor: '#f6ffed', color: '#389e0d', fontSize: 18, padding: 24, borderRadius: 12, display: 'flex', flexDirection: 'row', gap: 16 },
        },
        {
          id: 'bp-tablet',
          conditions: [{ type: 'min-width', value: 768 }, { type: 'max-width', value: 1023 }],
          styles: { backgroundColor: '#e6f7ff', color: '#0958d9', fontSize: 16, padding: 20, borderRadius: 10, display: 'flex', flexDirection: 'row', gap: 12 },
        },
        {
          id: 'bp-mobile',
          conditions: [{ type: 'max-width', value: 767 }],
          styles: { backgroundColor: '#fff2f0', color: '#cf1322', fontSize: 14, padding: 16, borderRadius: 8, display: 'block', flexDirection: 'row', gap: 8 },
        },
      ]
    case 'dark-mode':
      return [
        {
          id: 'bp-dark',
          conditions: [{ type: 'prefers-color-scheme', value: 'dark' }],
          styles: { backgroundColor: '#141414', color: '#ffffff', fontSize: 16, padding: 20, borderRadius: 8, display: 'block', flexDirection: 'row', gap: 8 },
        },
      ]
    case 'reduced-motion':
      return [
        {
          id: 'bp-motion',
          conditions: [{ type: 'prefers-reduced-motion', value: 'reduce' }],
          styles: { backgroundColor: '#fafafa', color: '#000000', fontSize: 16, padding: 20, borderRadius: 8, display: 'block', flexDirection: 'row', gap: 8 },
        },
      ]
    case 'portrait':
      return [
        {
          id: 'bp-portrait',
          conditions: [{ type: 'orientation', value: 'portrait' }],
          styles: { backgroundColor: '#f9f0ff', color: '#531dab', fontSize: 16, padding: 20, borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 12 },
        },
      ]
    default:
      return DEFAULT_BREAKPOINTS
  }
}
