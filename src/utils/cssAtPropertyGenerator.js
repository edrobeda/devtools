export const SYNTAX_OPTIONS = [
  { value: '<color>', label: '<color>' },
  { value: '<length>', label: '<length>' },
  { value: '<length-percentage>', label: '<length-percentage>' },
  { value: '<percentage>', label: '<percentage>' },
  { value: '<number>', label: '<number>' },
  { value: '<integer>', label: '<integer>' },
  { value: '<angle>', label: '<angle>' },
  { value: '<time>', label: '<time>' },
  { value: '<resolution>', label: '<resolution>' },
  { value: '<transform-function>', label: '<transform-function>' },
  { value: '<custom-ident>', label: '<custom-ident>' },
  { value: '*', label: '*' },
]

export const DEFAULTS = {
  name: '--primary-color',
  syntax: '<color>',
  inherits: false,
  initialValue: '#1677ff',
  previewText: 'CSS @property',
}

export const PRESETS = [
  {
    key: 'color',
    labelKey: 'presetColor',
    state: {
      name: '--primary-color',
      syntax: '<color>',
      inherits: false,
      initialValue: '#1677ff',
      previewText: 'Color',
    },
  },
  {
    key: 'width',
    labelKey: 'presetWidth',
    state: {
      name: '--box-width',
      syntax: '<length-percentage>',
      inherits: false,
      initialValue: '120px',
      previewText: 'Width',
    },
  },
  {
    key: 'rotation',
    labelKey: 'presetRotation',
    state: {
      name: '--rotation',
      syntax: '<angle>',
      inherits: false,
      initialValue: '0deg',
      previewText: 'Rotate',
    },
  },
  {
    key: 'opacity',
    labelKey: 'presetOpacity',
    state: {
      name: '--fade-opacity',
      syntax: '<number>',
      inherits: false,
      initialValue: '0.2',
      previewText: 'Fade',
    },
  },
  {
    key: 'radius',
    labelKey: 'presetRadius',
    state: {
      name: '--corner-radius',
      syntax: '<length-percentage>',
      inherits: false,
      initialValue: '4px',
      previewText: 'Radius',
    },
  },
]

export function normalizeName(name) {
  const trimmed = (name || '').trim()
  if (!trimmed) return ''
  if (trimmed.startsWith('--')) return trimmed
  return `--${trimmed}`
}

export function isValidPropertyName(name) {
  const normalized = normalizeName(name)
  if (normalized.length < 3) return false
  return /^--[a-zA-Z_-][a-zA-Z0-9_-]*$/.test(normalized)
}

export function buildAtPropertyRule(state) {
  const { name, syntax, inherits, initialValue } = state
  const normalized = normalizeName(name)
  const hasInitial = (initialValue || '').trim() !== ''
  const inheritsLine = `inherits: ${inherits};`
  const initialLine = hasInitial ? `  initial-value: ${initialValue.trim()};\n` : ''
  return `@property ${normalized} {\n  syntax: "${syntax}";\n  ${inheritsLine}\n${initialLine}}`
}

export function buildUsageExample(state) {
  const normalized = normalizeName(state.name)
  const value = (state.initialValue || '').trim() || 'inherit'
  return `:root {\n  ${normalized}: ${value};\n}\n\n.example {\n  background: var(${normalized});\n  transition: ${normalized} 0.3s ease;\n}`
}

export function buildAnimationExample(state) {
  const normalized = normalizeName(state.name)
  const value = (state.initialValue || '').trim() || 'inherit'
  return `@keyframes pulse-${normalized.replace(/^--/, '')} {\n  from { ${normalized}: ${value}; }\n  to { ${normalized}: ${value}; }\n}`
}

export function buildPreviewStyle(state) {
  const normalized = normalizeName(state.name)
  const value = (state.initialValue || '').trim()

  if (state.syntax === '<color>') {
    return {
      background: value || '#1677ff',
      color: '#fff',
    }
  }

  if (state.syntax === '<length>' || state.syntax === '<length-percentage>') {
    if (normalized === '--box-width') {
      return { width: value || '120px' }
    }
    if (normalized === '--corner-radius') {
      return { borderRadius: value || '4px' }
    }
    return { width: value || '120px' }
  }

  if (state.syntax === '<angle>') {
    return { transform: `rotate(${value || '0deg'})` }
  }

  if (state.syntax === '<number>' || state.syntax === '<percentage>') {
    const numeric = value.replace(/[^0-9.]/g, '') || '0.5'
    return { opacity: Number(numeric) }
  }

  return {}
}
