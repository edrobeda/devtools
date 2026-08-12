export const AXIS_OPTIONS = ['x', 'y', 'block', 'inline']
export const STRICTNESS_OPTIONS = ['mandatory', 'proximity']
export const ALIGN_OPTIONS = ['start', 'center', 'end', 'none']
export const STOP_OPTIONS = ['normal', 'always']

export const DEFAULT_SETTINGS = {
  axis: 'x',
  strictness: 'mandatory',
  align: 'center',
  stop: 'normal',
  snapPadding: 16,
  snapMargin: 0,
  itemWidth: 75,
  itemHeight: 220,
  gap: 16,
  itemCount: 5,
  hideScrollbar: false,
  smoothScroll: true,
}

export const PRESETS = [
  {
    key: 'carousel',
    settings: {
      axis: 'x',
      strictness: 'mandatory',
      align: 'start',
      stop: 'normal',
      snapPadding: 16,
      snapMargin: 0,
      itemWidth: 80,
      itemHeight: 220,
      gap: 16,
      itemCount: 5,
      hideScrollbar: false,
      smoothScroll: true,
    },
  },
  {
    key: 'gallery',
    settings: {
      axis: 'y',
      strictness: 'proximity',
      align: 'center',
      stop: 'normal',
      snapPadding: 0,
      snapMargin: 0,
      itemWidth: '100',
      itemHeight: 70,
      gap: 16,
      itemCount: 4,
      hideScrollbar: false,
      smoothScroll: true,
    },
  },
  {
    key: 'pagination',
    settings: {
      axis: 'x',
      strictness: 'mandatory',
      align: 'center',
      stop: 'always',
      snapPadding: 0,
      snapMargin: 0,
      itemWidth: 100,
      itemHeight: 220,
      gap: 0,
      itemCount: 4,
      hideScrollbar: true,
      smoothScroll: true,
    },
  },
  {
    key: 'vertical-list',
    settings: {
      axis: 'y',
      strictness: 'mandatory',
      align: 'start',
      stop: 'normal',
      snapPadding: 8,
      snapMargin: 0,
      itemWidth: '100',
      itemHeight: 120,
      gap: 8,
      itemCount: 6,
      hideScrollbar: false,
      smoothScroll: true,
    },
  },
]

function sanitizeClassName(name) {
  return (name || 'snap-container').replace(/[^a-zA-Z0-9_-]/g, '-')
}

export function buildScrollSnapCss(settings, className = 'snap-container') {
  const safe = sanitizeClassName(className)
  const {
    axis,
    strictness,
    align,
    stop,
    snapPadding,
    snapMargin,
    itemWidth,
    itemHeight,
    gap,
    hideScrollbar,
    smoothScroll,
  } = settings

  const isHorizontal = axis === 'x' || axis === 'inline'
  const flow = isHorizontal ? 'row' : 'column'
  const sizeProp = isHorizontal ? 'width' : 'height'
  const crossSize = isHorizontal ? 'height' : 'width'

  const itemSize = `${itemWidth}%`

  const containerRules = [
    `  display: flex;`,
    `  flex-direction: ${flow};`,
    `  gap: ${gap}px;`,
    `  overflow-${isHorizontal ? 'x' : 'y'}: auto;`,
    `  scroll-snap-type: ${axis} ${strictness};`,
  ]

  if (snapPadding > 0) {
    containerRules.push(`  scroll-padding-${isHorizontal ? 'inline' : 'block'}: ${snapPadding}px;`)
  }

  if (smoothScroll) {
    containerRules.push(`  scroll-behavior: smooth;`)
  }

  if (hideScrollbar) {
    containerRules.push(`  scrollbar-width: none; /* Firefox */`)
    containerRules.push(`  -ms-overflow-style: none; /* IE 10+ */`)
  }

  const itemRules = [
    `  flex: 0 0 ${itemSize};`,
    `  ${crossSize}: ${itemHeight}px;`,
    `  scroll-snap-align: ${align};`,
  ]

  if (snapMargin > 0) {
    itemRules.push(`  scroll-margin-${isHorizontal ? 'inline' : 'block'}: ${snapMargin}px;`)
  }

  if (stop !== 'normal') {
    itemRules.push(`  scroll-snap-stop: ${stop};`)
  }

  const containerBlock = `.${safe} {\n${containerRules.join('\n')}\n}`
  const itemBlock = `.${safe}__item {\n${itemRules.join('\n')}\n}`

  return `${containerBlock}\n\n${itemBlock}`
}

export function buildScrollSnapHtml(settings, className = 'snap-container') {
  const safe = sanitizeClassName(className)
  const { itemCount } = settings
  const items = Array.from({ length: itemCount }, (_, i) => i + 1)
    .map((n) => `  <div class="${safe}__item">${n}</div>`)
    .join('\n')

  return `<div class="${safe}">\n${items}\n</div>`
}

export function buildFullDemo(settings, className = 'snap-container') {
  const css = buildScrollSnapCss(settings, className)
  const html = buildScrollSnapHtml(settings, className)
  const safe = sanitizeClassName(className)
  return `/* CSS */
${css}

/* Ajuste visual opcional */
.${safe}__item {
  display: grid;
  place-items: center;
  border-radius: 12px;
  background: #e6f7ff;
  color: #0958d9;
  font-weight: 700;
  font-size: 2rem;
}

/* HTML */
${html}`
}
