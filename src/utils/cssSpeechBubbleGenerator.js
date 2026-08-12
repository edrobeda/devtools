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
    ? `  box-shadow: 0 4px 12px ${opts.shadowColor};`
    : ''

  const borderRule = hasBorder
    ? `  border: ${toPx(opts.borderWidth)} solid ${opts.borderColor};`
    : ''

  // Calcula posicionamento da seta principal (::after)
  const s = opts.arrowSize
  let afterPosition = ''
  let afterBorder = ''
  let afterMargin = ''

  if (opts.arrowPosition === 'top') {
    afterPosition = `  top: -${toPx(s)};
  left: ${opts.arrowAlign};`
    afterBorder = `  border-left: ${toPx(s)} solid transparent;
  border-right: ${toPx(s)} solid transparent;
  border-bottom: ${toPx(s)} solid ${opts.bg};`
    afterMargin = opts.arrowAlign === 'center'
      ? `  transform: translateX(-50%);`
      : opts.arrowAlign === 'end'
        ? `  transform: translateX(calc(-100% + ${toPx(s)}));`
        : ''
  } else if (opts.arrowPosition === 'bottom') {
    afterPosition = `  bottom: -${toPx(s)};
  left: ${opts.arrowAlign};`
    afterBorder = `  border-left: ${toPx(s)} solid transparent;
  border-right: ${toPx(s)} solid transparent;
  border-top: ${toPx(s)} solid ${opts.bg};`
    afterMargin = opts.arrowAlign === 'center'
      ? `  transform: translateX(-50%);`
      : opts.arrowAlign === 'end'
        ? `  transform: translateX(calc(-100% + ${toPx(s)}));`
        : ''
  } else if (opts.arrowPosition === 'left') {
    afterPosition = `  left: -${toPx(s)};
  top: ${opts.arrowAlign};`
    afterBorder = `  border-top: ${toPx(s)} solid transparent;
  border-bottom: ${toPx(s)} solid transparent;
  border-right: ${toPx(s)} solid ${opts.bg};`
    afterMargin = opts.arrowAlign === 'center'
      ? `  transform: translateY(-50%);`
      : opts.arrowAlign === 'end'
        ? `  transform: translateY(calc(-100% + ${toPx(s)}));`
        : ''
  } else {
    // right
    afterPosition = `  right: -${toPx(s)};
  top: ${opts.arrowAlign};`
    afterBorder = `  border-top: ${toPx(s)} solid transparent;
  border-bottom: ${toPx(s)} solid transparent;
  border-left: ${toPx(s)} solid ${opts.bg};`
    afterMargin = opts.arrowAlign === 'center'
      ? `  transform: translateY(-50%);`
      : opts.arrowAlign === 'end'
        ? `  transform: translateY(calc(-100% + ${toPx(s)}));`
        : ''
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
      beforePosition = `  top: -${toPx(offset)};
  left: ${opts.arrowAlign};`
      beforeBorder = `  border-left: ${toPx(offset)} solid transparent;
  border-right: ${toPx(offset)} solid transparent;
  border-bottom: ${toPx(offset)} solid ${opts.borderColor};`
      beforeMargin = opts.arrowAlign === 'center'
        ? `  transform: translateX(-50%);`
        : opts.arrowAlign === 'end'
          ? `  transform: translateX(calc(-100% + ${toPx(offset)}));`
          : ''
    } else if (opts.arrowPosition === 'bottom') {
      beforePosition = `  bottom: -${toPx(offset)};
  left: ${opts.arrowAlign};`
      beforeBorder = `  border-left: ${toPx(offset)} solid transparent;
  border-right: ${toPx(offset)} solid transparent;
  border-top: ${toPx(offset)} solid ${opts.borderColor};`
      beforeMargin = opts.arrowAlign === 'center'
        ? `  transform: translateX(-50%);`
        : opts.arrowAlign === 'end'
          ? `  transform: translateX(calc(-100% + ${toPx(offset)}));`
          : ''
    } else if (opts.arrowPosition === 'left') {
      beforePosition = `  left: -${toPx(offset)};
  top: ${opts.arrowAlign};`
      beforeBorder = `  border-top: ${toPx(offset)} solid transparent;
  border-bottom: ${toPx(offset)} solid transparent;
  border-right: ${toPx(offset)} solid ${opts.borderColor};`
      beforeMargin = opts.arrowAlign === 'center'
        ? `  transform: translateY(-50%);`
        : opts.arrowAlign === 'end'
          ? `  transform: translateY(calc(-100% + ${toPx(offset)}));`
          : ''
    } else {
      beforePosition = `  right: -${toPx(offset)};
  top: ${opts.arrowAlign};`
      beforeBorder = `  border-top: ${toPx(offset)} solid transparent;
  border-bottom: ${toPx(offset)} solid transparent;
  border-left: ${toPx(offset)} solid ${opts.borderColor};`
      beforeMargin = opts.arrowAlign === 'center'
        ? `  transform: translateY(-50%);`
        : opts.arrowAlign === 'end'
          ? `  transform: translateY(calc(-100% + ${toPx(offset)}));`
          : ''
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
  ${opts.arrowPosition === 'bottom' ? 'bottom' : opts.arrowPosition === 'top' ? 'top' : opts.arrowPosition === 'left' ? 'left' : 'right'}: -${toPx(Math.round(s * 1.6))};
  ${opts.arrowPosition === 'left' || opts.arrowPosition === 'right' ? 'top' : 'left'}: ${opts.arrowAlign};
  ${opts.arrowAlign === 'center' ? (opts.arrowPosition === 'left' || opts.arrowPosition === 'right' ? 'transform: translateY(-50%);' : 'transform: translateX(-50%);') : ''}
}

.${cn}--thought::after {
  width: ${toPx(Math.round(s * 0.45))};
  height: ${toPx(Math.round(s * 0.45))};
  ${opts.arrowPosition === 'bottom' ? 'bottom' : opts.arrowPosition === 'top' ? 'top' : opts.arrowPosition === 'left' ? 'left' : 'right'}: -${toPx(Math.round(s * 2.6))};
  ${opts.arrowPosition === 'left' || opts.arrowPosition === 'right' ? 'top' : 'left'}: ${opts.arrowAlign};
  ${opts.arrowAlign === 'center' ? (opts.arrowPosition === 'left' || opts.arrowPosition === 'right' ? 'transform: translateY(-50%);' : 'transform: translateX(-50%);') : ''}
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
