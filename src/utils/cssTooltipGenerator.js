// Gerador de tooltips CSS puro (sem JS, sem biblioteca).
//
// O padrão usa um wrapper com `position: relative`, o tooltip com
// `position: absolute` e um pseudo-elemento `::after` como seta. O estado
// visível/invisível é controlado por `:hover` e `:focus-within` no wrapper,
// com transição suave de opacity + transform.

function parseColor(color) {
  if (!color) return '#1f2937'
  if (typeof color === 'string') return color
  if (color && typeof color.toHexString === 'function') return color.toHexString()
  return String(color)
}

function toPx(v, fallback = 0) {
  const n = Number(v)
  return Number.isFinite(n) ? `${Math.max(0, n)}px` : `${fallback}px`
}

function toMs(v, fallback = 200) {
  const n = Number(v)
  return Number.isFinite(n) ? `${Math.max(0, n)}ms` : `${fallback}ms`
}

// Escapa o nome da classe para uso em seletor CSS (não permite espaço).
function safeClass(name) {
  const s = String(name || 'tooltip').trim()
  return s.replace(/\s+/g, '-') || 'tooltip'
}

// Monta o CSS da tooltip a partir das opções.
//
// Opções:
//   position:   'top' | 'bottom' | 'left' | 'right'
//   align:      'start' | 'center' | 'end'
//   bg:         cor de fundo
//   color:      cor do texto
//   paddingX, paddingY
//   radius
//   fontSize
//   maxWidth
//   arrow:      boolean
//   arrowSize
//   offset
//   animation:  'fade' | 'scale' | 'slide'
//   duration
//   delay
//   shadow:     boolean
//   shadowColor
//   className
export function buildTooltipCss(options = {}) {
  const {
    position = 'top',
    align = 'center',
    bg = '#1f2937',
    color = '#ffffff',
    paddingX = 12,
    paddingY = 8,
    radius = 6,
    fontSize = 14,
    maxWidth = 220,
    arrow = true,
    arrowSize = 6,
    offset = 8,
    animation = 'fade',
    duration = 200,
    delay = 0,
    shadow = true,
    shadowColor = 'rgba(0, 0, 0, 0.2)',
    className = 'tooltip',
  } = options

  const c = safeClass(className)
  const background = parseColor(bg)
  const textColor = parseColor(color)
  const shadowValue = shadow
    ? `box-shadow: 0 4px 12px ${parseColor(shadowColor)};`
    : ''

  const px = toPx(paddingX)
  const py = toPx(paddingY)
  const r = toPx(radius)
  const fs = toPx(fontSize)
  const mw = toPx(maxWidth)
  const as = Math.max(0, Number(arrowSize) || 0)
  const off = Math.max(0, Number(offset) || 0)
  const dur = toMs(duration)
  const dly = toMs(delay)

  // Posição base do tooltip
  let posRules = ''
  let activeTransform = ''
  let inactiveTransform = ''

  switch (position) {
    case 'top':
      posRules = `bottom: calc(100% + ${toPx(off)});`
      if (align === 'start') {
        posRules += '\n  left: 0;\n  transform: translateX(0);'
      } else if (align === 'end') {
        posRules += '\n  right: 0;\n  left: auto;\n  transform: translateX(0);'
      } else {
        posRules += '\n  left: 50%;\n  transform: translateX(-50%);'
      }
      inactiveTransform = animation === 'slide' ? 'translateY(-8px)' : ''
      activeTransform = animation === 'slide' ? 'translateY(0)' : ''
      break
    case 'bottom':
      posRules = `top: calc(100% + ${toPx(off)});`
      if (align === 'start') {
        posRules += '\n  left: 0;\n  transform: translateX(0);'
      } else if (align === 'end') {
        posRules += '\n  right: 0;\n  left: auto;\n  transform: translateX(0);'
      } else {
        posRules += '\n  left: 50%;\n  transform: translateX(-50%);'
      }
      inactiveTransform = animation === 'slide' ? 'translateY(8px)' : ''
      activeTransform = animation === 'slide' ? 'translateY(0)' : ''
      break
    case 'left':
      posRules = `right: calc(100% + ${toPx(off)});`
      if (align === 'start') {
        posRules += '\n  top: 0;\n  transform: translateY(0);'
      } else if (align === 'end') {
        posRules += '\n  bottom: 0;\n  top: auto;\n  transform: translateY(0);'
      } else {
        posRules += '\n  top: 50%;\n  transform: translateY(-50%);'
      }
      inactiveTransform = animation === 'slide' ? 'translateX(-8px)' : ''
      activeTransform = animation === 'slide' ? 'translateX(0)' : ''
      break
    case 'right':
      posRules = `left: calc(100% + ${toPx(off)});`
      if (align === 'start') {
        posRules += '\n  top: 0;\n  transform: translateY(0);'
      } else if (align === 'end') {
        posRules += '\n  bottom: 0;\n  top: auto;\n  transform: translateY(0);'
      } else {
        posRules += '\n  top: 50%;\n  transform: translateY(-50%);'
      }
      inactiveTransform = animation === 'slide' ? 'translateX(8px)' : ''
      activeTransform = animation === 'slide' ? 'translateX(0)' : ''
      break
    default:
      break
  }

  const hasTranslate = posRules.includes('translateX') || posRules.includes('translateY')
  const baseTransform = hasTranslate
    ? posRules.match(/transform:\s*([^;]+);/)[1]
    : 'none'

  const scaleIn = animation === 'scale' ? 'scale(0.95)' : ''
  const scaleOut = animation === 'scale' ? 'scale(1)' : ''

  const buildTransform = (extra) => {
    const parts = [baseTransform, scaleOut, extra].filter(Boolean)
    return parts.length ? `transform: ${parts.join(' ')};` : ''
  }

  const buildInactiveTransform = (extra) => {
    const parts = [baseTransform, scaleIn, extra].filter(Boolean)
    return parts.length ? `transform: ${parts.join(' ')};` : ''
  }

  const transitionProps = ['opacity', 'visibility']
  if (animation === 'scale' || animation === 'slide') {
    transitionProps.push('transform')
  }
  const transition = `transition: ${transitionProps.join(', ')} ${dur} ease ${dly};`

  // Regras da seta (pseudo-elemento ::after)
  let arrowRules = ''
  if (arrow && as > 0) {
    let borderWidth = ''
    let borderColor = ''
    let arrowPos = ''
    let arrowTransform = ''

    switch (position) {
      case 'top':
        borderWidth = `${toPx(as)} ${toPx(as)} 0 ${toPx(as)}`
        borderColor = `${background} transparent transparent transparent`
        arrowPos = `bottom: -${toPx(as)};`
        if (align === 'start') {
          arrowPos += '\n    left: 12px;'
        } else if (align === 'end') {
          arrowPos += '\n    right: 12px;\n    left: auto;'
        } else {
          arrowPos += '\n    left: 50%;\n    transform: translateX(-50%);'
        }
        break
      case 'bottom':
        borderWidth = `0 ${toPx(as)} ${toPx(as)} ${toPx(as)}`
        borderColor = `transparent transparent ${background} transparent`
        arrowPos = `top: -${toPx(as)};`
        if (align === 'start') {
          arrowPos += '\n    left: 12px;'
        } else if (align === 'end') {
          arrowPos += '\n    right: 12px;\n    left: auto;'
        } else {
          arrowPos += '\n    left: 50%;\n    transform: translateX(-50%);'
        }
        break
      case 'left':
        borderWidth = `${toPx(as)} ${toPx(as)} ${toPx(as)} 0`
        borderColor = `transparent ${background} transparent transparent`
        arrowPos = `right: -${toPx(as)};`
        if (align === 'start') {
          arrowPos += '\n    top: 12px;'
        } else if (align === 'end') {
          arrowPos += '\n    bottom: 12px;\n    top: auto;'
        } else {
          arrowPos += '\n    top: 50%;\n    transform: translateY(-50%);'
        }
        break
      case 'right':
        borderWidth = `${toPx(as)} 0 ${toPx(as)} ${toPx(as)}`
        borderColor = `transparent transparent transparent ${background}`
        arrowPos = `left: -${toPx(as)};`
        if (align === 'start') {
          arrowPos += '\n    top: 12px;'
        } else if (align === 'end') {
          arrowPos += '\n    bottom: 12px;\n    top: auto;'
        } else {
          arrowPos += '\n    top: 50%;\n    transform: translateY(-50%);'
        }
        break
      default:
        break
    }

    arrowRules = `\n.${c}::after {\n  content: '';\n  position: absolute;\n  width: 0;\n  height: 0;\n  border-style: solid;\n  border-width: ${borderWidth};\n  border-color: ${borderColor};\n  ${arrowPos}\n}`
  }

  const inactiveTransformRule = buildInactiveTransform(inactiveTransform)
  const activeTransformRule = buildTransform(activeTransform)

  const css = [
    `.${c}-wrapper {`,
    '  position: relative;',
    '  display: inline-block;',
    '}',
    '',
    `.${c} {`,
    '  position: absolute;',
    `  z-index: 1000;`,
    posRules,
    '  visibility: hidden;',
    '  opacity: 0;',
    inactiveTransformRule,
    transition,
    '  pointer-events: none;',
    `  background: ${background};`,
    `  color: ${textColor};`,
    `  padding: ${py} ${px};`,
    `  border-radius: ${r};`,
    `  font-size: ${fs};`,
    `  max-width: ${mw};`,
    '  white-space: normal;',
    '  word-wrap: break-word;',
    shadowValue,
    '}',
    '',
    `.${c}-wrapper:hover .${c},`,
    `.${c}-wrapper:focus-within .${c} {`,
    '  visibility: visible;',
    '  opacity: 1;',
    activeTransformRule,
    '}',
    arrowRules,
  ]
    .filter((line) => line.trim() !== '')
    .join('\n')

  return {
    css,
    className: c,
    wrapperClass: `${c}-wrapper`,
    position,
    align,
    background,
    textColor,
  }
}

// HTML de exemplo pronto para colar.
export function buildTooltipHtml(className = 'tooltip', text = 'Dica rápida') {
  const c = safeClass(className)
  return `<span class="${c}-wrapper" tabindex="0">
  <button>Hover me</button>
  <span class="${c}">${text}</span>
</span>`
}

// Junta HTML + CSS num bloco completo.
export function buildFullDemo(options = {}, text = 'Dica rápida') {
  const result = buildTooltipCss(options)
  const html = buildTooltipHtml(result.className, text)
  return `<style>\n${result.css}\n</style>\n\n${html}`
}
