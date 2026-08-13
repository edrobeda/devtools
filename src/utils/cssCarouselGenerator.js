// Gerador de carrossel CSS puro.
//
// Produz um carrossel funcional usando apenas CSS + inputs radio ocultos.
// Cada slide é um flex item; o track é deslocado com transform translateX
// conforme o radio checado. Navegação por setas (prev/next) e dots.

function parseColor(color) {
  if (!color) return '#000000'
  if (typeof color === 'string') return color
  if (color && typeof color.toHexString === 'function') return color.toHexString()
  return String(color)
}

function toPx(v) {
  const n = Number(v)
  return Number.isFinite(n) ? `${Math.round(n)}px` : '0px'
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n))
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const DEFAULTS = {
  containerWidth: 100,
  containerWidthUnit: '%',
  slideAspectRatio: '16/9',
  visibleSlides: 1,
  gap: 16,
  borderRadius: 8,
  duration: 0.5,
  easing: 'ease-in-out',
  numSlides: 5,
  slideText: 'Slide',
  showArrows: true,
  showDots: true,
  dotShape: 'circle',
  slideBg: '#f0f0f0',
  slideTextColor: '#333333',
  activeDotColor: '#1677ff',
  inactiveDotColor: '#d9d9d9',
  arrowBg: 'rgba(0, 0, 0, 0.5)',
  arrowColor: '#ffffff',
  className: 'carousel',
}

const PRESETS = {
  default: { ...DEFAULTS },
  gallery: {
    ...DEFAULTS,
    slideAspectRatio: '4/3',
    visibleSlides: 1,
    borderRadius: 12,
    gap: 0,
    slideBg: '#e6f4ff',
    slideTextColor: '#0958d9',
    duration: 0.6,
  },
  testimonials: {
    ...DEFAULTS,
    slideAspectRatio: '3/1',
    visibleSlides: 1,
    borderRadius: 16,
    gap: 24,
    slideBg: '#f6ffed',
    slideTextColor: '#389e0d',
    duration: 0.7,
  },
  products: {
    ...DEFAULTS,
    slideAspectRatio: '1/1',
    visibleSlides: 3,
    borderRadius: 8,
    gap: 12,
    slideBg: '#fff2e8',
    slideTextColor: '#ad6800',
    activeDotColor: '#fa8c16',
  },
  minimal: {
    ...DEFAULTS,
    slideAspectRatio: '16/9',
    visibleSlides: 1,
    borderRadius: 0,
    gap: 0,
    slideBg: '#fafafa',
    slideTextColor: '#595959',
    showArrows: false,
    inactiveDotColor: '#bfbfbf',
  },
}

export { DEFAULTS, PRESETS }

export function buildCarouselCss(options = {}) {
  const opts = { ...DEFAULTS, ...options }
  const cn = escapeHtml(opts.className || 'carousel')
  const containerWidth = clamp(Number(opts.containerWidth) || 100, 1, opts.containerWidthUnit === '%' ? 100 : 1200)
  const containerWidthUnit = opts.containerWidthUnit === 'px' ? 'px' : '%'
  const visibleSlides = clamp(Number(opts.visibleSlides) || 1, 1, 4)
  const gap = clamp(Number(opts.gap) || 0, 0, 64)
  const borderRadius = clamp(Number(opts.borderRadius) || 0, 0, 64)
  const duration = clamp(Number(opts.duration) || 0.3, 0.1, 2)
  const numSlides = clamp(Number(opts.numSlides) || 1, 2, 12)
  const slideBg = parseColor(opts.slideBg)
  const slideTextColor = parseColor(opts.slideTextColor)
  const activeDotColor = parseColor(opts.activeDotColor)
  const inactiveDotColor = parseColor(opts.inactiveDotColor)
  const arrowBg = parseColor(opts.arrowBg)
  const arrowColor = parseColor(opts.arrowColor)
  const aspectRatio = opts.slideAspectRatio || '16/9'

  const lines = [
    `.${cn} {`,
    '  position: relative;',
    `  width: ${containerWidth}${containerWidthUnit};`,
    `  max-width: 100%;`,
    `  margin: 0 auto;`,
    '  box-sizing: border-box;',
    '}',
    '',
    `.${cn}__input {`,
    '  position: absolute;',
    '  width: 1px;',
    '  height: 1px;',
    '  padding: 0;',
    '  margin: -1px;',
    '  overflow: hidden;',
    '  clip: rect(0, 0, 0, 0);',
    '  white-space: nowrap;',
    '  border: 0;',
    '}',
    '',
    `.${cn}__viewport {`,
    '  overflow: hidden;',
    `  border-radius: ${toPx(borderRadius)};`,
    '  width: 100%;',
    '}',
    '',
    `.${cn}__track {`,
    '  display: flex;',
    `  gap: ${toPx(gap)};`,
    `  width: calc((100% / ${visibleSlides}) * ${numSlides} + ${(numSlides - 1) * gap}px);`,
    `  transition: transform ${duration}s ${opts.easing || 'ease-in-out'};`,
    '}',
    '',
    `.${cn}__slide {`,
    '  flex: 0 0 auto;',
    `  width: calc(100% / ${visibleSlides} - ${((numSlides - 1) * gap) / numSlides}px);`,
    `  aspect-ratio: ${aspectRatio};`,
    `  background: ${slideBg};`,
    `  color: ${slideTextColor};`,
    '  display: flex;',
    '  align-items: center;',
    '  justify-content: center;',
    '  font-size: 1.5rem;',
    '  font-weight: 600;',
    '  user-select: none;',
    '  box-sizing: border-box;',
    '}',
    '',
  ]

  for (let i = 1; i <= numSlides; i++) {
    const step = i - 1
    lines.push(
      `#${cn}-slide-${i}:checked ~ .${cn}__viewport .${cn}__track {`,
      `  transform: translateX(calc(-${step} * (100% / ${visibleSlides}) - ${step * gap}px));`,
      '}',
      ''
    )
  }

  if (opts.showArrows) {
    lines.push(
      `.${cn}__arrow {`,
      '  position: absolute;',
      '  top: 50%;',
      '  transform: translateY(-50%);',
      `  width: ${toPx(40)};`,
      `  height: ${toPx(40)};`,
      `  background: ${arrowBg};`,
      `  color: ${arrowColor};`,
      '  border: none;',
      `  border-radius: ${toPx(20)};`,
      '  display: none;',
      '  align-items: center;',
      '  justify-content: center;',
      '  cursor: pointer;',
      '  z-index: 2;',
      '  text-decoration: none;',
      '  line-height: 1;',
      '  font-size: 1rem;',
      '}',
      '',
      `.${cn}__arrow:hover {`,
      '  opacity: 0.85;',
      '}',
      '',
      `.${cn}__arrow--prev {`,
      `  left: ${toPx(12)};`,
      '}',
      '',
      `.${cn}__arrow--next {`,
      `  right: ${toPx(12)};`,
      '}',
      '',
      `.${cn}__arrow svg {`,
      '  width: 60%;',
      '  height: 60%;',
      '  fill: currentColor;',
      '}',
      ''
    )

    for (let i = 1; i <= numSlides; i++) {
      if (i > 1) {
        lines.push(
          `#${cn}-slide-${i}:checked ~ .${cn}__controls .${cn}__arrow--prev[for="${cn}-slide-${i - 1}"] {`,
          '  display: flex;',
          '}',
          ''
        )
      }
      if (i < numSlides) {
        lines.push(
          `#${cn}-slide-${i}:checked ~ .${cn}__controls .${cn}__arrow--next[for="${cn}-slide-${i + 1}"] {`,
          '  display: flex;',
          '}',
          ''
        )
      }
    }
  }

  if (opts.showDots) {
    const dotRadius = opts.dotShape === 'square' ? toPx(4) : '50%'
    lines.push(
      `.${cn}__dots {`,
      '  display: flex;',
      '  align-items: center;',
      '  justify-content: center;',
      `  gap: ${toPx(10)};`,
      `  margin-top: ${toPx(16)};`,
      '}',
      '',
      `.${cn}__dot {`,
      `  width: ${toPx(12)};`,
      `  height: ${toPx(12)};`,
      `  border-radius: ${dotRadius};`,
      `  background: ${inactiveDotColor};`,
      '  cursor: pointer;',
      '  transition: transform 0.2s ease, background 0.2s ease;',
      '}',
      '',
      `.${cn}__dot:hover {`,
      '  opacity: 0.8;',
      '}',
      ''
    )

    for (let i = 1; i <= numSlides; i++) {
      lines.push(
        `#${cn}-slide-${i}:checked ~ .${cn}__dots .${cn}__dot[for="${cn}-slide-${i}"] {`,
        `  background: ${activeDotColor};`,
        '  transform: scale(1.25);',
        '}',
        ''
      )
    }
  }

  return lines.filter((line) => line !== null).join('\n')
}

export function buildCarouselHtml(options = {}) {
  const opts = { ...DEFAULTS, ...options }
  const cn = escapeHtml(opts.className || 'carousel')
  const numSlides = clamp(Number(opts.numSlides) || 1, 2, 12)
  const showArrows = Boolean(opts.showArrows)
  const showDots = Boolean(opts.showDots)
  const slideText = escapeHtml(opts.slideText || 'Slide')

  const inputs = []
  for (let i = 1; i <= numSlides; i++) {
    inputs.push(`<input class="${cn}__input" type="radio" name="${cn}" id="${cn}-slide-${i}"${i === 1 ? ' checked' : ''} aria-label="Slide ${i}">`)
  }

  const slides = []
  for (let i = 1; i <= numSlides; i++) {
    slides.push(`    <div class="${cn}__slide">${slideText} ${i}</div>`)
  }

  const arrows = []
  if (showArrows) {
    arrows.push('  <div class="' + cn + '__controls" aria-hidden="true">')
    for (let i = 1; i <= numSlides; i++) {
      if (i > 1) {
        arrows.push(`    <label class="${cn}__arrow ${cn}__arrow--prev" for="${cn}-slide-${i - 1}" title="Previous">${PREV_ARROW_SVG}</label>`)
      }
      if (i < numSlides) {
        arrows.push(`    <label class="${cn}__arrow ${cn}__arrow--next" for="${cn}-slide-${i + 1}" title="Next">${NEXT_ARROW_SVG}</label>`)
      }
    }
    arrows.push('  </div>')
  }

  const dots = []
  if (showDots) {
    dots.push('  <div class="' + cn + '__dots">')
    for (let i = 1; i <= numSlides; i++) {
      dots.push(`    <label class="${cn}__dot" for="${cn}-slide-${i}" aria-label="Go to slide ${i}"></label>`)
    }
    dots.push('  </div>')
  }

  return [
    `<div class="${cn}">`,
    ...inputs.map((line) => `  ${line}`),
    '  <div class="' + cn + '__viewport">',
    '    <div class="' + cn + '__track">',
    ...slides,
    '    </div>',
    '  </div>',
    ...arrows,
    ...dots,
    '</div>',
  ].join('\n')
}

const PREV_ARROW_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>'
const NEXT_ARROW_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/></svg>'

export function buildCarouselFullDemo(options = {}) {
  return `${buildCarouselCss(options)}\n\n${buildCarouselHtml(options)}`
}
