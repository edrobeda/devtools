const DEFAULTS = {
  className: 'progress',
  direction: 'horizontal',
  width: 320,
  height: 16,
  value: 65,
  max: 100,
  showLabel: true,
  labelInside: false,
  rounded: true,
  trackColor: '#f0f0f0',
  fillColor: '#1677ff',
  borderColor: '#d9d9d9',
  borderWidth: 0,
  textColor: '#595959',
  animation: false,
  animationDuration: 1000,
}

export function buildProgressBarCss(options = {}) {
  const opts = { ...DEFAULTS, ...options }
  const cn = opts.className
  const percent = Math.max(0, Math.min(100, (opts.value / Math.max(opts.max, 1)) * 100))
  const radius = opts.rounded ? `${opts.height / 2}px` : '0'

  const isVertical = opts.direction === 'vertical'
  const sizeProp = isVertical ? 'height' : 'width'
  const crossProp = isVertical ? 'width' : 'height'
  const mainSize = isVertical ? opts.height : opts.width
  const crossSize = isVertical ? opts.width : opts.height

  let css = `.${cn} {
  ${sizeProp}: ${mainSize}px;
  ${crossProp}: ${crossSize}px;
  background: ${opts.trackColor};
  border: ${opts.borderWidth}px solid ${opts.borderColor};
  border-radius: ${radius};
  overflow: hidden;
  position: relative;
}

.${cn} .progress-fill {
  ${isVertical ? 'width' : 'height'}: 100%;
  ${isVertical ? 'height' : 'width'}: ${percent.toFixed(2)}%;
  ${isVertical ? 'position: absolute;\n  bottom: 0;\n  left: 0;' : ''}
  background: ${opts.fillColor};
  border-radius: ${opts.rounded ? 'inherit' : '0'};
  transition: ${isVertical ? 'height' : 'width'} ${opts.animationDuration}ms ease;
}

.${cn} .progress-label {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${opts.textColor};
  font-size: ${Math.max(10, Math.round(crossSize * 0.5))}px;
  font-weight: 600;
  pointer-events: none;
}`

  if (opts.animation) {
    css += `

.${cn} .progress-fill.animated {
  background-image: linear-gradient(
    45deg,
    rgba(255, 255, 255, 0.2) 25%,
    transparent 25%,
    transparent 50%,
    rgba(255, 255, 255, 0.2) 50%,
    rgba(255, 255, 255, 0.2) 75%,
    transparent 75%,
    transparent
  );
  background-size: 1rem 1rem;
  animation: ${cn}-stripes 1s linear infinite;
}

@keyframes ${cn}-stripes {
  from {
    background-position: 1rem 0;
  }
  to {
    background-position: 0 0;
  }
}`
  }
  return css
}

export function buildProgressBarHtml(options = {}) {
  const opts = { ...DEFAULTS, ...options }
  const cn = opts.className
  const percent = Math.round(Math.max(0, Math.min(100, (opts.value / Math.max(opts.max, 1)) * 100)))
  const animClass = opts.animation ? ' animated' : ''
  const label = `${percent}%`

  return `<div class="${cn}">
  <div class="progress-fill${animClass}" style="${opts.direction === 'vertical' ? 'height' : 'width'}: ${percent}%" aria-valuenow="${opts.value}" aria-valuemin="0" aria-valuemax="${opts.max}" role="progressbar"></div>
  ${opts.showLabel ? `<span class="progress-label">${label}</span>` : ''}
</div>`
}

export function buildProgressBarFullDemo(options = {}) {
  const css = buildProgressBarCss(options)
  const html = buildProgressBarHtml(options)
  return `<!-- HTML -->
${html}

/* CSS */
${css}`
}

export const PROGRESS_PRESETS = [
  {
    key: 'linear',
    name: { pt: 'Linear padrão', en: 'Default linear' },
    opts: { direction: 'horizontal', fillColor: '#1677ff' },
  },
  {
    key: 'success',
    name: { pt: 'Sucesso', en: 'Success' },
    opts: { fillColor: '#52c41a', trackColor: '#f6ffed', value: 80 },
  },
  {
    key: 'warning',
    name: { pt: 'Aviso', en: 'Warning' },
    opts: { fillColor: '#faad14', trackColor: '#fffbe6', value: 45, animation: true },
  },
  {
    key: 'vertical',
    name: { pt: 'Vertical', en: 'Vertical' },
    opts: { direction: 'vertical', width: 32, height: 180, fillColor: '#722ed1' },
  },
]
