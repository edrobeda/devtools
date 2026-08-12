export const PROPERTIES = [
  'all',
  'transform',
  'opacity',
  'color',
  'background-color',
  'border-color',
  'border-width',
  'border-radius',
  'width',
  'height',
  'max-width',
  'max-height',
  'margin',
  'padding',
  'top',
  'left',
  'right',
  'bottom',
  'box-shadow',
  'filter',
  'flex-grow',
  'flex-shrink',
  'font-size',
  'line-height',
  'letter-spacing',
]

export const TIMING_FUNCTIONS = [
  'ease',
  'linear',
  'ease-in',
  'ease-out',
  'ease-in-out',
  'step-start',
  'step-end',
  'cubic-bezier',
  'steps',
]

export const STEP_POSITIONS = ['start', 'end', 'both', 'none']

export const DEFAULT_SETTINGS = {
  properties: ['all'],
  duration: 300,
  timingFunction: 'ease',
  cubicBezier: [0.4, 0, 0.2, 1],
  steps: 5,
  stepPosition: 'end',
  delay: 0,
  willChange: false,
}

export const PRESETS = [
  {
    key: 'smooth',
    settings: {
      properties: ['all'],
      duration: 300,
      timingFunction: 'ease',
      cubicBezier: [0.4, 0, 0.2, 1],
      steps: 5,
      stepPosition: 'end',
      delay: 0,
      willChange: false,
    },
  },
  {
    key: 'snappy',
    settings: {
      properties: ['transform', 'opacity'],
      duration: 150,
      timingFunction: 'cubic-bezier',
      cubicBezier: [0.4, 0, 1, 1],
      steps: 5,
      stepPosition: 'end',
      delay: 0,
      willChange: true,
    },
  },
  {
    key: 'bounce',
    settings: {
      properties: ['transform'],
      duration: 600,
      timingFunction: 'cubic-bezier',
      cubicBezier: [0.68, -0.55, 0.27, 1.55],
      steps: 5,
      stepPosition: 'end',
      delay: 0,
      willChange: true,
    },
  },
  {
    key: 'steps',
    settings: {
      properties: ['background-color', 'color'],
      duration: 500,
      timingFunction: 'steps',
      cubicBezier: [0.4, 0, 0.2, 1],
      steps: 8,
      stepPosition: 'end',
      delay: 0,
      willChange: false,
    },
  },
  {
    key: 'slow-fade',
    settings: {
      properties: ['opacity', 'filter'],
      duration: 800,
      timingFunction: 'ease-in-out',
      cubicBezier: [0.4, 0, 0.2, 1],
      steps: 5,
      stepPosition: 'end',
      delay: 100,
      willChange: true,
    },
  },
]

function sanitizeClassName(name) {
  return (name || 'transition-demo').replace(/[^a-zA-Z0-9_-]/g, '-')
}

export function buildTimingValue(settings) {
  const { timingFunction, cubicBezier, steps, stepPosition } = settings

  if (timingFunction === 'cubic-bezier') {
    return `cubic-bezier(${cubicBezier.join(', ')})`
  }

  if (timingFunction === 'steps') {
    return `steps(${steps}, ${stepPosition})`
  }

  return timingFunction
}

export function buildTransitionValue(settings) {
  const { properties, duration, delay } = settings
  const timing = buildTimingValue(settings)
  const propertyList = properties.length ? properties.join(', ') : 'all'
  const delayPart = delay > 0 ? ` ${delay}ms` : ''

  return `${propertyList} ${duration}ms ${timing}${delayPart}`
}

export function buildTransitionCss(settings, className = 'box') {
  const safe = sanitizeClassName(className)
  const timing = buildTimingValue(settings)
  const { properties, duration, delay, willChange } = settings
  const propertyList = properties.length ? properties.join(', ') : 'all'
  const delayPart = delay > 0 ? `\n  transition-delay: ${delay}ms;` : ''
  const willChangePart = willChange
    ? `\n  will-change: ${properties.length ? properties.join(', ') : 'auto'};`
    : ''

  const shorthand = `.${safe} {\n  transition: ${propertyList} ${duration}ms ${timing};${delayPart}${willChangePart}\n}`

  const longhand = [
    `.${safe} {`,
    `  transition-property: ${propertyList};`,
    `  transition-duration: ${duration}ms;`,
    `  transition-timing-function: ${timing};`,
  ]

  if (delay > 0) {
    longhand.push(`  transition-delay: ${delay}ms;`)
  }

  if (willChange) {
    longhand.push(`  will-change: ${properties.length ? properties.join(', ') : 'auto'};`)
  }

  longhand.push('}')

  return `${shorthand}\n\n${longhand.join('\n')}`
}

export function buildDemoHtml(settings, className = 'box') {
  const safe = sanitizeClassName(className)
  return `<div class="${safe}">\n  Hover me\n</div>`
}

export function buildFullDemo(settings, className = 'box') {
  const safe = sanitizeClassName(className)
  const css = buildTransitionCss(settings, className)
  const html = buildDemoHtml(settings, className)

  return `/* CSS */
${css}

/* Estado ativado (hover, por exemplo) */
.${safe}:hover {
  transform: scale(1.05);
  background-color: #1890ff;
  color: #fff;
}

/* HTML */
${html}`
}

export function buildPreviewStyle(settings) {
  const { properties, duration, delay, willChange } = settings
  return {
    transitionProperty: properties.length ? properties.join(', ') : 'all',
    transitionDuration: `${duration}ms`,
    transitionTimingFunction: buildTimingValue(settings),
    transitionDelay: `${delay}ms`,
    willChange: willChange ? (properties.length ? properties.join(', ') : 'auto') : undefined,
  }
}
