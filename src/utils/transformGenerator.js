const UNITS = {
  translateX: 'px',
  translateY: 'px',
  translateZ: 'px',
  rotateX: 'deg',
  rotateY: 'deg',
  rotateZ: 'deg',
  scaleX: '',
  scaleY: '',
  skewX: 'deg',
  skewY: 'deg',
}

const ORDER = [
  'translateX',
  'translateY',
  'translateZ',
  'rotateX',
  'rotateY',
  'rotateZ',
  'scaleX',
  'scaleY',
  'skewX',
  'skewY',
]

export const DEFAULTS = {
  translateX: 0,
  translateY: 0,
  translateZ: 0,
  rotateX: 0,
  rotateY: 0,
  rotateZ: 0,
  scaleX: 1,
  scaleY: 1,
  skewX: 0,
  skewY: 0,
  perspective: 0,
  originX: 'center',
  originY: 'center',
  originZ: '',
  transformStyle: 'preserve-3d',
}

export function buildTransform(values) {
  const parts = []
  for (const key of ORDER) {
    const value = values[key]
    if (value == null) continue
    if (key.startsWith('scale')) {
      if (Number(value) !== 1) parts.push(`${key}(${Number(value)})`)
    } else if (Number(value) !== 0) {
      parts.push(`${key}(${Number(value)}${UNITS[key]})`)
    }
  }
  return parts.length === 0 ? 'none' : parts.join(' ')
}

export function buildClassCss(values, className = 'transform-box') {
  const transform = buildTransform(values)
  const originZ = values.originZ ? ` ${values.originZ}px` : ''
  const origin = `${values.originX || 'center'} ${values.originY || 'center'}${originZ}`
  const perspective = Number(values.perspective) > 0 ? `  perspective: ${values.perspective}px;` : ''
  const style = values.transformStyle === 'preserve-3d' ? 'preserve-3d' : 'flat'

  return `.${className} {
  transform: ${transform};${perspective}
  transform-origin: ${origin};
  transform-style: ${style};
}`
}

export function makeValues(overrides = {}) {
  return { ...DEFAULTS, ...overrides }
}

export const PRESETS = {
  none: makeValues(),
  rotateY: makeValues({ rotateY: 45 }),
  rotateX: makeValues({ rotateX: 45 }),
  isometric: makeValues({ rotateX: 54.7356, rotateY: 45, rotateZ: 0, scaleX: 1, scaleY: 1 }),
  cardFlip: makeValues({ rotateY: 180, perspective: 800, transformStyle: 'preserve-3d' }),
  perspective: makeValues({
    rotateX: -15,
    rotateY: 30,
    translateZ: 80,
    perspective: 800,
    transformStyle: 'preserve-3d',
  }),
  skew: makeValues({ skewX: 20, skewY: -10 }),
  scale: makeValues({ scaleX: 1.25, scaleY: 0.85, rotateZ: -5 }),
  hoverLift: makeValues({
    translateZ: 60,
    rotateX: -10,
    rotateY: 10,
    scaleX: 1.05,
    scaleY: 1.05,
    perspective: 1000,
    transformStyle: 'preserve-3d',
  }),
}
