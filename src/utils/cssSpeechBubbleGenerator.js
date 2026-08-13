const DEFAULTS = {
  className: 'speech-bubble',
  bg: '#ffffff',
  color: '#262626',
  borderColor: '#d9d9d9',
  borderWidth: 1,
  paddingX: 16,
  paddingY: 12,
  radius: 12,
  fontSize: 14,
  shadow: true,
  shadowColor: 'rgba(0, 0, 0, 0.12)',
  arrowPosition: 'bottom',
  arrowAlign: 'center',
  arrowSize: 10,
  type: 'speech',
  animation: 'none',
}

function toPx(value) {
  return `${value}px`
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function buildSpeechBubbleCss(options = {}) {
  const opts = { ...DEFAULTS, ...options }
  const cn = opts.className
  const hasBorder = opts.borderWidth > 0
  const isThought = opts.type === 'thought'
  const isShout = opts.type === 'shout'
  const borderRadius = isShout ? '2px' : toPx(opts.radius)

  const shadowRule = opts.shadow
    ? `  filter: drop-shadow(0 4px 12px ${opts.shadowColor});`
    : ''

  const borderRule = hasBorder
    ? `  border: ${toPx(opts.borderWidth)} solid ${opts.borderColor};`
    : ''

  // Calcula posicionamento da seta principal (::after)
  const s = opts.arrowSize
  function arrowPlacement(align, size, axis) {
    const translate = axis === 'x' ? 'translateX' : 'translateY'
    const map = {
      start: { value: '0', transform: '' },
      center: { value: '50%', transform: `${translate}(-50%)` },
      end: { value: `calc(100% - ${toPx(size)})`, transform: `${translate}(calc(-100% + ${toPx(size)}))` },
    }
    return map[align] || map.start
  }
  let afterPosition = ''
  let afterBorder = ''
  let afterMargin = ''

  if (opts.arrowPosition === 'top') {
    const place = arrowPlacement(opts.arrowAlign, s, 'x')
    afterPosition = `  top: -${toPx(s)};
  left: ${place.value};`
    afterBorder = `  border-left: ${toPx(s)} solid transparent;
  border-right: ${toPx(s)} solid transparent;
  border-bottom: ${toPx(s)} solid ${opts.bg};`
    afterMargin = place.transform ? `  transform: ${place.transform};` : ''
  } else if (opts.arrowPosition === 'bottom') {
    const place = arrowPlacement(opts.arrowAlign, s, 'x')
    afterPosition = `  bottom: -${toPx(s)};
  left: ${place.value};`
    afterBorder = `  border-left: ${toPx(s)} solid transparent;
  border-right: ${toPx(s)} solid transparent;
  border-top: ${toPx(s)} solid ${opts.bg};`
    afterMargin = place.transform ? `  transform: ${place.transform};` : ''
  } else if (opts.arrowPosition === 'left') {
    const place = arrowPlacement(opts.arrowAlign, s, 'y')
    afterPosition = `  left: -${toPx(s)};
  top: ${place.value};`
    afterBorder = `  border-top: ${toPx(s)} solid transparent;
  border-bottom: ${toPx(s)} solid transparent;
  border-right: ${toPx(s)} solid ${opts.bg};`
    afterMargin = place.transform ? `  transform: ${place.transform};` : ''
  } else {
    // right
    const place = arrowPlacement(opts.arrowAlign, s, 'y')
    afterPosition = `  right: -${toPx(s)};
  top: ${place.value};`
    afterBorder = `  border-top: ${toPx(s)} solid transparent;
  border-bottom: ${toPx(s)} solid transparent;
  border-left: ${toPx(s)} solid ${opts.bg};`
    afterMargin = place.transform ? `  transform: ${place.transform};` : ''
  }

  // Seta de borda (::before) — um pouco maior e na cor da borda
  let beforeRule = ''
  if (hasBorder && !isThought) {
    const b = opts.borderWidth
    const offset = s + b
    let beforePosition = ''
    let beforeBorder = ''
    let beforeMargin = ''

    if (opts.arrowPosition === 'top') {
      const place = arrowPlacement(opts.arrowAlign, offset, 'x')
      beforePosition = `  top: -${toPx(offset)};
  left: ${place.value};`
      beforeBorder = `  border-left: ${toPx(offset)} solid transparent;
  border-right: ${toPx(offset)} solid transparent;
  border-bottom: ${toPx(offset)} solid ${opts.borderColor};`
      beforeMargin = place.transform ? `  transform: ${place.transform};` : ''
    } else if (opts.arrowPosition === 'bottom') {
      const place = arrowPlacement(opts.arrowAlign, offset, 'x')
      beforePosition = `  bottom: -${toPx(offset)};
  left: ${place.value};`
      beforeBorder = `  border-left: ${toPx(offset)} solid transparent;
  border-right: ${toPx(offset)} solid transparent;
  border-top: ${toPx(offset)} solid ${opts.borderColor};`
      beforeMargin = place.transform ? `  transform: ${place.transform};` : ''
    } else if (opts.arrowPosition === 'left') {
      const place = arrowPlacement(opts.arrowAlign, offset, 'y')
      beforePosition = `  left: -${toPx(offset)};
  top: ${place.value};`
      beforeBorder = `  border-top: ${toPx(offset)} solid transparent;
  border-bottom: ${toPx(offset)} solid transparent;
  border-right: ${toPx(offset)} solid ${opts.borderColor};`
      beforeMargin = place.transform ? `  transform: ${place.transform};` : ''
    } else {
      const place = arrowPlacement(opts.arrowAlign, offset, 'y')
      beforePosition = `  right: -${toPx(offset)};
  top: ${place.value};`
      beforeBorder = `  border-top: ${toPx(offset)} solid transparent;
  border-bottom: ${toPx(offset)} solid transparent;
  border-left: ${toPx(offset)} solid ${opts.borderColor};`
      beforeMargin = place.transform ? `  transform: ${place.transform};` : ''
    }

    beforeRule = `
.${cn}::before {
  content: "";
  position: absolute;
  width: 0;
  height: 0;
${beforePosition}
${beforeBorder}
${beforeMargin}
  z-index: 0;
}`
  }

  // Bolhas de pensamento
  let thoughtRule = ''
  if (isThought) {
    const mainAxisProp = opts.arrowPosition === 'bottom' ? 'bottom' : opts.arrowPosition === 'top' ? 'top' : opts.arrowPosition === 'left' ? 'left' : 'right'
    const crossAxisProp = opts.arrowPosition === 'left' || opts.arrowPosition === 'right' ? 'top' : 'left'
    const crossAxis = opts.arrowPosition === 'left' || opts.arrowPosition === 'right' ? 'y' : 'x'
    const place1 = arrowPlacement(opts.arrowAlign, Math.round(s * 0.8), crossAxis)
    const place2 = arrowPlacement(opts.arrowAlign, Math.round(s * 0.45), crossAxis)

    thoughtRule = `
.${cn}--thought::before,
.${cn}--thought::after {
  content: "";
  position: absolute;
  background: ${opts.bg};
  border-radius: 50%;
  z-index: 1;
}

.${cn}--thought::before {
  width: ${toPx(Math.round(s * 0.8))};
  height: ${toPx(Math.round(s * 0.8))};
  ${mainAxisProp}: -${toPx(Math.round(s * 1.6))};
  ${crossAxisProp}: ${place1.value};
  ${place1.transform ? `transform: ${place1.transform};` : ''}
}

.${cn}--thought::after {
  width: ${toPx(Math.round(s * 0.45))};
  height: ${toPx(Math.round(s * 0.45))};
  ${mainAxisProp}: -${toPx(Math.round(s * 2.6))};
  ${crossAxisProp}: ${place2.value};
  ${place2.transform ? `transform: ${place2.transform};` : ''}
}`
  }

  const animationRule = opts.animation === 'pop'
    ? `
@keyframes ${cn}-pop {
  0%   { transform: scale(0.85); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

.${cn} {
  animation: ${cn}-pop 0.25s ease-out;
}`
    : ''

  const css = `.${cn} {
  position: relative;
  display: inline-block;
  padding: ${toPx(opts.paddingY)} ${toPx(opts.paddingX)};
  background: ${opts.bg};
  color: ${opts.color};
  font-size: ${toPx(opts.fontSize)};
  line-height: 1.5;
  border-radius: ${borderRadius};
${borderRule}${borderRule ? '\n' : ''}${shadowRule}${shadowRule ? '\n' : ''}}

.${cn}::after {
  content: "";
  position: absolute;
  width: 0;
  height: 0;
${afterPosition}
${afterBorder}
${afterMargin}
  z-index: 1;
}${beforeRule}${thoughtRule}${animationRule}`

  return {
    className: cn,
    css,
  }
}

export function buildSpeechBubbleHtml(text = '', options = {}) {
  const opts = { ...DEFAULTS, ...options }
  const cn = opts.className
  const typeClass = opts.type === 'speech' ? '' : ` ${cn}--${opts.type}`
  const safeText = escapeHtml(text) || (opts.type === 'thought' ? 'Hmm...' : 'Hello!')
  return `<div class="${cn}${typeClass}">\n  ${safeText}\n</div>`
}

export function buildSpeechBubbleFullDemo(text = '', options = {}) {
  const css = buildSpeechBubbleCss(options).css
  const html = buildSpeechBubbleHtml(text, options)
  return `<!-- HTML -->\n${html}\n\n/* CSS */\n${css}`
}

export const SPEECH_BUBBLE_PRESETS = [
  {
    key: 'default',
    name: { pt: 'Padrão', en: 'Default' },
    opts: {},
  },
  {
    key: 'comic',
    name: { pt: 'Quadrinhos', en: 'Comic' },
    opts: {
      bg: '#ffffff',
      color: '#000000',
      borderColor: '#000000',
      borderWidth: 2,
      paddingX: 18,
      paddingY: 14,
      radius: 16,
      fontSize: 16,
      shadow: false,
      arrowPosition: 'bottom',
      arrowAlign: 'start',
      arrowSize: 14,
      type: 'speech',
      animation: 'pop',
    },
  },
  {
    key: 'chat',
    name: { pt: 'Chat App', en: 'Chat App' },
    opts: {
      bg: '#1677ff',
      color: '#ffffff',
      borderColor: '#1677ff',
      borderWidth: 0,
      paddingX: 14,
      paddingY: 10,
      radius: 18,
      fontSize: 14,
      shadow: true,
      shadowColor: 'rgba(22, 119, 255, 0.25)',
      arrowPosition: 'left',
      arrowAlign: 'center',
      arrowSize: 8,
      type: 'speech',
      animation: 'none',
    },
  },
  {
    key: 'thought',
    name: { pt: 'Pensamento', en: 'Thought' },
    opts: {
      bg: '#f6ffed',
      color: '#389e0d',
      borderColor: '#b7eb8f',
      borderWidth: 1,
      paddingX: 16,
      paddingY: 12,
      radius: 20,
      fontSize: 14,
      shadow: true,
      shadowColor: 'rgba(0, 0, 0, 0.08)',
      arrowPosition: 'bottom',
      arrowAlign: 'center',
      arrowSize: 10,
      type: 'thought',
      animation: 'pop',
    },
  },
  {
    key: 'dark',
    name: { pt: 'Escuro', en: 'Dark' },
    opts: {
      bg: '#1f1f1f',
      color: '#e0e0e0',
      borderColor: '#434343',
      borderWidth: 1,
      paddingX: 16,
      paddingY: 12,
      radius: 10,
      fontSize: 14,
      shadow: true,
      shadowColor: 'rgba(0, 0, 0, 0.35)',
      arrowPosition: 'top',
      arrowAlign: 'end',
      arrowSize: 10,
      type: 'speech',
      animation: 'none',
    },
  },
]
