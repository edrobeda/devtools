const DEFAULTS = {
  className: 'star-rating',
  starCount: 5,
  starSize: 32,
  gap: 4,
  activeColor: '#f5a623',
  inactiveColor: '#d9d9d9',
  hoverColor: '#f5a623',
  transitionDuration: 200,
  symbol: 'star',
  scaleOnHover: 1.15,
}

const SYMBOLS = {
  star: '★',
  heart: '♥',
  thumb: '👍',
  sparkle: '🌟',
  diamond: '◆',
}

export const SYMBOL_OPTIONS = Object.keys(SYMBOLS)

export function getSymbol(name) {
  return SYMBOLS[name] ?? SYMBOLS.star
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function buildStarRatingCss(options = {}) {
  const opts = { ...DEFAULTS, ...options }
  const cn = opts.className
  const size = opts.starSize

  return `.${cn} {
  display: inline-flex;
  flex-direction: row-reverse;
  align-items: center;
  gap: ${opts.gap}px;
  border: none;
  padding: 0;
  margin: 0;
}

.${cn}__stars {
  display: inline-flex;
  flex-direction: row-reverse;
  gap: ${opts.gap}px;
}

.${cn} input[type="radio"] {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
  pointer-events: none;
}

.${cn} label {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: ${size}px;
  height: ${size}px;
  font-size: ${size}px;
  line-height: 1;
  color: ${opts.inactiveColor};
  cursor: pointer;
  transition: color ${opts.transitionDuration}ms ease, transform ${opts.transitionDuration}ms ease;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.${cn} input:checked + label,
.${cn} input:checked ~ label {
  color: ${opts.activeColor};
}

.${cn} label:hover,
.${cn} label:hover ~ label {
  color: ${opts.hoverColor};
  transform: scale(${opts.scaleOnHover});
}

.${cn} input:focus-visible + label {
  outline: 2px solid #1677ff;
  outline-offset: 2px;
  border-radius: ${Math.max(2, Math.round(size / 8))}px;
}`
}

export function buildStarRatingHtml(options = {}) {
  const opts = { ...DEFAULTS, ...options }
  const cn = opts.className
  const symbol = getSymbol(opts.symbol)
  const count = Math.max(1, Math.min(20, Number(opts.starCount) || 5))
  const name = opts.name || 'rating'
  const idPrefix = opts.idPrefix || `${cn}-${name}`

  let inputs = ''
  for (let value = count; value >= 1; value -= 1) {
    const id = `${idPrefix}-${value}`
    const label = `${value} ${value === 1 ? 'star' : 'stars'}`
    inputs += `  <input type="radio" id="${id}" name="${name}" value="${value}"><label for="${id}" aria-label="${label}">${escapeHtml(symbol)}</label>\n`
  }

  return `<fieldset class="${cn}">
  <legend>${opts.legend || 'Rate this'}</legend>
  <div class="${cn}__stars" role="radiogroup" aria-label="Rating">
${inputs}  </div>
</fieldset>`
}

export function buildStarRatingFullDemo(options = {}) {
  const opts = { ...DEFAULTS, ...options }
  const css = buildStarRatingCss(opts)
  const html = buildStarRatingHtml({ ...opts, legend: opts.legend || 'Rate this product' })

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Star Rating Demo</title>
  <style>
${css.split('\n').map((line) => `    ${line}`).join('\n')}
  </style>
</head>
<body style="font-family: system-ui, sans-serif; padding: 40px;">
  ${html.replace(/\n/g, '\n  ')}
</body>
</html>`
}

export function buildPreviewStyle(options = {}) {
  const opts = { ...DEFAULTS, ...options }
  return {
    display: 'inline-flex',
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: opts.gap,
  }
}

export const STAR_RATING_PRESETS = [
  {
    key: 'default',
    name: { pt: 'Padrão', en: 'Default' },
    opts: {
      activeColor: '#f5a623',
      inactiveColor: '#d9d9d9',
      hoverColor: '#f5a623',
      symbol: 'star',
      starSize: 32,
      gap: 4,
      scaleOnHover: 1.15,
    },
  },
  {
    key: 'amazon',
    name: { pt: 'Amazon', en: 'Amazon' },
    opts: {
      activeColor: '#ffa41c',
      inactiveColor: '#d9d9d9',
      hoverColor: '#ff9900',
      symbol: 'star',
      starSize: 28,
      gap: 2,
      scaleOnHover: 1.1,
    },
  },
  {
    key: 'netflix',
    name: { pt: 'Netflix', en: 'Netflix' },
    opts: {
      activeColor: '#e50914',
      inactiveColor: '#564d4d',
      hoverColor: '#ff0a16',
      symbol: 'star',
      starSize: 30,
      gap: 6,
      scaleOnHover: 1.2,
    },
  },
  {
    key: 'hearts',
    name: { pt: 'Corações', en: 'Hearts' },
    opts: {
      activeColor: '#ff4d4f',
      inactiveColor: '#d9d9d9',
      hoverColor: '#ff7875',
      symbol: 'heart',
      starSize: 32,
      gap: 4,
      scaleOnHover: 1.15,
    },
  },
  {
    key: 'dark',
    name: { pt: 'Escuro', en: 'Dark' },
    opts: {
      activeColor: '#ffd666',
      inactiveColor: '#434343',
      hoverColor: '#ffc53d',
      symbol: 'star',
      starSize: 36,
      gap: 6,
      scaleOnHover: 1.1,
    },
  },
]
