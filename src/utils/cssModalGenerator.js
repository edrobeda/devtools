const DEFAULTS = {
  className: 'modal',
  modalId: 'myModal',
  title: 'Modal title',
  body: 'Modal body content goes here.',
  type: 'centered',
  width: 520,
  maxWidthPct: 90,
  height: 320,
  maxHeightPct: 80,
  padding: 24,
  borderRadius: 12,
  bgColor: '#ffffff',
  overlayColor: '#000000',
  overlayOpacity: 0.55,
  shadow: '0 20px 60px rgba(0, 0, 0, 0.25)',
  animation: 'scale',
  duration: 250,
  easing: 'ease-out',
  closeButton: true,
  closeButtonSize: 24,
  closeButtonColor: '#8c8c8c',
  closeButtonPosition: 'top-right',
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function rgba(hex, alpha) {
  const clean = hex.replace('#', '')
  const bigint = parseInt(clean, 16)
  const r = (bigint >> 16) & 255
  const g = (bigint >> 8) & 255
  const b = bigint & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function formatBorderRadius(value) {
  if (typeof value === 'string') return value
  return `${value}px`
}

function getBox(type, width, maxWidthPct, height, maxHeightPct) {
  if (type === 'centered') {
    return {
      width: `${width}px`,
      maxWidth: `${maxWidthPct}%`,
      height: 'auto',
      maxHeight: `${maxHeightPct}%`,
      top: '50%',
      left: '50%',
      right: 'auto',
      bottom: 'auto',
      initialTranslate: 'translate(-50%, -50%)',
    }
  }
  if (type === 'drawer-left') {
    return {
      width: `${width}px`,
      maxWidth: `${maxWidthPct}%`,
      height: '100vh',
      maxHeight: '100vh',
      top: 0,
      left: 0,
      right: 'auto',
      bottom: 'auto',
      initialTranslate: 'translateX(-100%)',
    }
  }
  if (type === 'drawer-right') {
    return {
      width: `${width}px`,
      maxWidth: `${maxWidthPct}%`,
      height: '100vh',
      maxHeight: '100vh',
      top: 0,
      right: 0,
      left: 'auto',
      bottom: 'auto',
      initialTranslate: 'translateX(100%)',
    }
  }
  if (type === 'drawer-top') {
    return {
      width: '100vw',
      maxWidth: '100vw',
      height: `${height}px`,
      maxHeight: `${maxHeightPct}%`,
      top: 0,
      left: 0,
      right: 'auto',
      bottom: 'auto',
      initialTranslate: 'translateY(-100%)',
    }
  }
  if (type === 'drawer-bottom' || type === 'bottom-sheet') {
    return {
      width: '100vw',
      maxWidth: '100vw',
      height: `${height}px`,
      maxHeight: `${maxHeightPct}%`,
      left: 0,
      right: 'auto',
      bottom: 0,
      top: 'auto',
      initialTranslate: 'translateY(100%)',
    }
  }
  return getBox('centered', width, maxWidthPct, height, maxHeightPct)
}

function getAnimationTransform(type, animation, box) {
  if (animation === 'fade') {
    return `${box.initialTranslate}`
  }
  if (animation === 'scale') {
    if (type === 'centered') {
      return `${box.initialTranslate} scale(0.92)`
    }
    return `${box.initialTranslate} scale(0.96)`
  }
  return box.initialTranslate
}

function getFinalTransform(box) {
  if (box.initialTranslate.includes('translate(-50%, -50%)')) {
    return 'translate(-50%, -50%)'
  }
  if (box.initialTranslate.includes('translateX(-100%)')) {
    return 'translateX(0)'
  }
  if (box.initialTranslate.includes('translateX(100%)')) {
    return 'translateX(0)'
  }
  if (box.initialTranslate.includes('translateY(-100%)')) {
    return 'translateY(0)'
  }
  if (box.initialTranslate.includes('translateY(100%)')) {
    return 'translateY(0)'
  }
  return 'none'
}

function positionStyles(box) {
  const rightLine = box.right !== 'auto' ? `\n  right: ${box.right};` : ''
  const bottomLine = box.bottom !== 'auto' ? `\n  bottom: ${box.bottom};` : ''
  return `  top: ${box.top};
  left: ${box.left};${rightLine}${bottomLine}
  width: ${box.width};
  max-width: ${box.maxWidth};
  height: ${box.height};
  max-height: ${box.maxHeight};`
}

export function buildModalCss(options = {}) {
  const opts = { ...DEFAULTS, ...options }
  const cn = opts.className
  const box = getBox(opts.type, opts.width, opts.maxWidthPct, opts.height, opts.maxHeightPct)
  const overlayBg = rgba(opts.overlayColor, opts.overlayOpacity)
  const startTransform = getAnimationTransform(opts.type, opts.animation, box)
  const finalTransform = getFinalTransform(box)
  const borderRadius = formatBorderRadius(opts.borderRadius)
  const closeHoverColor = opts.closeButtonColor === '#8c8c8c' ? '#434343' : opts.closeButtonColor
  const closePos = opts.closeButtonPosition === 'top-left'
    ? { top: '12px', left: '12px', right: 'auto' }
    : { top: '12px', right: '12px', left: 'auto' }

  const contentBase = `${positionStyles(box)}
  position: fixed;
  overflow: auto;
  background: ${opts.bgColor};
  border-radius: ${borderRadius};
  padding: ${opts.padding}px;
  z-index: 1001;
  box-shadow: ${opts.shadow};
  transform: ${startTransform};
  opacity: 0;
  transition: transform ${opts.duration}ms ${opts.easing}, opacity ${opts.duration}ms ${opts.easing};`

  const closeBase = `  position: absolute;
  top: ${closePos.top};
  ${opts.closeButtonPosition === 'top-left' ? `left: ${closePos.left};` : `right: ${closePos.right};`}
  width: ${opts.closeButtonSize}px;
  height: ${opts.closeButtonSize}px;
  line-height: ${opts.closeButtonSize}px;
  text-align: center;
  font-size: ${Math.round(opts.closeButtonSize * 0.85)}px;
  color: ${opts.closeButtonColor};
  text-decoration: none;
  cursor: pointer;
  transition: color 150ms ease;`

  return `.${cn} {
  visibility: hidden;
  opacity: 0;
  transition: opacity ${opts.duration}ms ${opts.easing}, visibility ${opts.duration}ms ${opts.easing};
}

.${cn}:target {
  visibility: visible;
  opacity: 1;
}

.${cn}-overlay {
  position: fixed;
  inset: 0;
  background: ${overlayBg};
  z-index: 1000;
  cursor: default;
}

.${cn}-content {
${contentBase}}

.${cn}:target .${cn}-content {
  transform: ${finalTransform};
  opacity: 1;
}

.${cn}-close {
${closeBase}}

.${cn}-close:hover,
.${cn}-close:focus {
  color: ${closeHoverColor};
}

.${cn}-title {
  margin: 0 0 12px;
  font-size: ${Math.round(opts.padding * 0.85)}px;
  line-height: 1.3;
}

.${cn}-body {
  font-size: ${Math.max(13, Math.round(opts.padding * 0.55))}px;
  line-height: 1.5;
}`
}

export function buildModalHtml(options = {}) {
  const opts = { ...DEFAULTS, ...options }
  const cn = opts.className
  const titleId = `${opts.modalId}-title`
  const title = escapeHtml(opts.title)
  const body = escapeHtml(opts.body)
  const closeTag = opts.closeButton
    ? `\n    <a href="#" class="${cn}-close" aria-label="Close">&times;</a>`
    : ''

  return `<a href="#${opts.modalId}">Open modal</a>

<div id="${opts.modalId}" class="${cn}" role="dialog" aria-modal="true" aria-labelledby="${titleId}">
  <a href="#" class="${cn}-overlay" aria-label="Close"></a>
  <div class="${cn}-content">${closeTag}
    <h2 id="${titleId}" class="${cn}-title">${title}</h2>
    <div class="${cn}-body">
      <p>${body}</p>
    </div>
  </div>
</div>`
}

export function buildModalFullDemo(options = {}) {
  const css = buildModalCss(options)
  const html = buildModalHtml(options)
  return `<!-- HTML -->
${html}

/* CSS */
${css}`
}

export const MODAL_PRESETS = [
  {
    key: 'default',
    name: { pt: 'Padrão', en: 'Default' },
    opts: {
      type: 'centered',
      animation: 'scale',
      width: 520,
      maxWidthPct: 90,
      height: 320,
      maxHeightPct: 80,
      padding: 24,
      borderRadius: 12,
      bgColor: '#ffffff',
      overlayOpacity: 0.55,
      closeButton: true,
    },
  },
  {
    key: 'drawer-right',
    name: { pt: 'Drawer direita', en: 'Right drawer' },
    opts: {
      type: 'drawer-right',
      animation: 'slide',
      width: 380,
      maxWidthPct: 85,
      height: 320,
      maxHeightPct: 100,
      padding: 24,
      borderRadius: 0,
      bgColor: '#ffffff',
      overlayOpacity: 0.45,
      closeButton: true,
      closeButtonPosition: 'top-left',
    },
  },
  {
    key: 'drawer-left',
    name: { pt: 'Drawer esquerda', en: 'Left drawer' },
    opts: {
      type: 'drawer-left',
      animation: 'slide',
      width: 380,
      maxWidthPct: 85,
      height: 320,
      maxHeightPct: 100,
      padding: 24,
      borderRadius: 0,
      bgColor: '#ffffff',
      overlayOpacity: 0.45,
      closeButton: true,
    },
  },
  {
    key: 'bottom-sheet',
    name: { pt: 'Bottom sheet', en: 'Bottom sheet' },
    opts: {
      type: 'bottom-sheet',
      animation: 'slide',
      width: 520,
      maxWidthPct: 100,
      height: 340,
      maxHeightPct: 70,
      padding: 24,
      borderRadius: '16px 16px 0 0',
      bgColor: '#ffffff',
      overlayOpacity: 0.4,
      closeButton: true,
    },
  },
  {
    key: 'minimal',
    name: { pt: 'Minimal', en: 'Minimal' },
    opts: {
      type: 'centered',
      animation: 'fade',
      width: 420,
      maxWidthPct: 90,
      height: 220,
      maxHeightPct: 70,
      padding: 20,
      borderRadius: 4,
      bgColor: '#ffffff',
      overlayOpacity: 0.35,
      closeButton: true,
      closeButtonColor: '#595959',
      shadow: '0 4px 20px rgba(0, 0, 0, 0.12)',
    },
  },
]
