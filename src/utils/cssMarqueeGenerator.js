const DEFAULTS = {
  className: 'marquee',
  direction: 'left',
  mode: 'loop',
  duration: 10,
  pauseOnHover: true,
  width: '100%',
  height: 160,
  gap: 24,
  paddingX: 16,
  paddingY: 12,
  backgroundColor: '#f0f0f0',
  textColor: '#262626',
  fontSize: 16,
  borderRadius: 8,
  items: ['Lorem ipsum dolor sit amet', 'Consectetur adipiscing elit', 'Sed do eiusmod tempor incididunt'],
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function getTimingFunction(mode) {
  if (mode === 'loop') return 'linear'
  if (mode === 'once') return 'ease-out'
  return 'ease-in-out'
}

function getAnimationFill(mode) {
  return mode === 'once' ? 'forwards' : 'none'
}

function renderItems(items) {
  return items.map((item) => `<span class="marquee-item">${escapeHtml(item)}</span>`).join('\n    ')
}

export function buildMarqueeCss(options = {}) {
  const opts = { ...DEFAULTS, ...options }
  const cn = opts.className
  const isVertical = opts.direction === 'up' || opts.direction === 'down'
  const timing = getTimingFunction(opts.mode)
  const fill = getAnimationFill(opts.mode)
  const animName = `${cn}-${opts.direction}-${opts.mode}`

  let css = `.${cn} {
  width: ${opts.width};
  overflow: hidden;
  background: ${opts.backgroundColor};
  color: ${opts.textColor};
  border-radius: ${opts.borderRadius}px;
  padding: ${opts.paddingY}px ${opts.paddingX}px;
  font-size: ${opts.fontSize}px;
}`

  if (isVertical) {
    css += `

.${cn} {
  height: ${opts.height}px;
}`
  }

  css += `

.${cn} .marquee-track {
  display: flex;
  flex-direction: ${isVertical ? 'column' : 'row'};
  gap: ${opts.gap}px;
  width: ${isVertical ? '100%' : 'max-content'};
  animation: ${animName} ${opts.duration}s ${timing} ${fill};
  ${opts.mode === 'loop' || opts.mode === 'bounce' ? `animation-iteration-count: infinite;` : ''}
}

.${cn} .marquee-item {
  display: flex;
  align-items: center;
  ${isVertical ? 'white-space: normal;' : 'white-space: nowrap;'}
}

.${cn}:hover .marquee-track {
  animation-play-state: ${opts.pauseOnHover ? 'paused' : 'running'};
}`

  const keyframes = []
  if (opts.mode === 'loop') {
    if (opts.direction === 'left') {
      keyframes.push(`@keyframes ${animName} {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}`)
    } else if (opts.direction === 'right') {
      keyframes.push(`@keyframes ${animName} {
  from { transform: translateX(-50%); }
  to { transform: translateX(0); }
}`)
    } else if (opts.direction === 'up') {
      keyframes.push(`@keyframes ${animName} {
  from { transform: translateY(0); }
  to { transform: translateY(-50%); }
}`)
    } else {
      keyframes.push(`@keyframes ${animName} {
  from { transform: translateY(-50%); }
  to { transform: translateY(0); }
}`)
    }
  } else if (opts.mode === 'once') {
    if (opts.direction === 'left') {
      keyframes.push(`@keyframes ${animName} {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}`)
    } else if (opts.direction === 'right') {
      keyframes.push(`@keyframes ${animName} {
  from { transform: translateX(-100%); }
  to { transform: translateX(0); }
}`)
    } else if (opts.direction === 'up') {
      keyframes.push(`@keyframes ${animName} {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}`)
    } else {
      keyframes.push(`@keyframes ${animName} {
  from { transform: translateY(-100%); }
  to { transform: translateY(0); }
}`)
    }
  } else if (opts.mode === 'bounce') {
    if (opts.direction === 'left' || opts.direction === 'up') {
      const axis = opts.direction === 'left' ? 'X' : 'Y'
      keyframes.push(`@keyframes ${animName} {
  0%, 100% { transform: translate${axis}(0); }
  50% { transform: translate${axis}(-50%); }
}`)
    } else {
      const axis = opts.direction === 'right' ? 'X' : 'Y'
      keyframes.push(`@keyframes ${animName} {
  0%, 100% { transform: translate${axis}(-50%); }
  50% { transform: translate${axis}(0); }
}`)
    }
  }

  if (keyframes.length) {
    css += `\n\n${keyframes.join('\n\n')}`
  }

  return css
}

export function buildMarqueeHtml(options = {}) {
  const opts = { ...DEFAULTS, ...options }
  const cn = opts.className
  const needsDuplicate = opts.mode === 'loop' || opts.mode === 'bounce'
  const itemsHtml = renderItems(opts.items)

  let html = `<div class="${cn}">
  <div class="marquee-track">
    ${itemsHtml}
  </div>`

  if (needsDuplicate) {
    html += `
  <div class="marquee-track" aria-hidden="true">
    ${itemsHtml}
  </div>`
  }

  html += `
</div>`
  return html
}

export function buildMarqueeFullDemo(options = {}) {
  const css = buildMarqueeCss(options)
  const html = buildMarqueeHtml(options)
  return `<!-- HTML -->
${html}

/* CSS */
${css}`
}

export const MARQUEE_PRESETS = [
  {
    key: 'default',
    name: { pt: 'Padrão', en: 'Default' },
    opts: { direction: 'left', mode: 'loop', duration: 10, backgroundColor: '#f0f0f0', textColor: '#262626' },
  },
  {
    key: 'news',
    name: { pt: 'News ticker', en: 'News ticker' },
    opts: {
      direction: 'left', mode: 'loop', duration: 15, backgroundColor: '#111827', textColor: '#f3f4f6',
      fontSize: 14, paddingY: 8, borderRadius: 4,
      items: ['Breaking news: nova versão publicada', 'Patch de segurança disponível', 'Confira o changelog completo'],
    },
  },
  {
    key: 'vertical',
    name: { pt: 'Ticker vertical', en: 'Vertical ticker' },
    opts: {
      direction: 'up', mode: 'loop', duration: 8, height: 120, backgroundColor: '#e6f4ff', textColor: '#0958d9',
      items: ['Primeiro aviso', 'Segundo aviso', 'Terceiro aviso'],
    },
  },
  {
    key: 'bounce',
    name: { pt: 'Bounce', en: 'Bounce' },
    opts: { direction: 'left', mode: 'bounce', duration: 6, backgroundColor: '#fff7e6', textColor: '#d46b08', gap: 48 },
  },
  {
    key: 'minimal',
    name: { pt: 'Minimal', en: 'Minimal' },
    opts: {
      direction: 'right', mode: 'loop', duration: 12, backgroundColor: 'transparent', textColor: '#595959',
      gap: 40, paddingX: 0, paddingY: 4, borderRadius: 0,
      items: ['Item A', 'Item B', 'Item C'],
    },
  },
]
