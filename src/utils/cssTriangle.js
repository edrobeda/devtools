// Gerador de triângulos CSS via bordas transparentes.
//
// O truque clássico: um elemento com width/height 0 e bordas grossas
// transparentes, exceto a borda oposta à direção desejada, que recebe a
// cor. Ajustando as espessuras das bordas laterais controlamos a largura
// da base; a espessura da borda colorida controla a altura.

const round = (v, digits = 2) => {
  const f = 10 ** digits
  return Math.round(v * f) / f
}

function parseColor(color) {
  if (!color) return '#1677ff'
  if (typeof color === 'string') return color
  if (color && typeof color.toHexString === 'function') return color.toHexString()
  return String(color)
}

function toCssNumber(v) {
  const n = Number(v)
  return Number.isFinite(n) && n !== 0 ? `${round(n)}px` : '0'
}

// Gera o objeto de descrição de um triângulo CSS.
//
// direction: 'up' | 'down' | 'left' | 'right'
// base:      largura da base em px
// height:    altura em px (usado quando kind !== 'equilateral')
// color:     cor do triângulo
// kind:      'isosceles' | 'equilateral'
export function buildTriangle({ direction = 'up', base = 100, height = 86, color = '#1677ff', kind = 'isosceles' } = {}) {
  let b = Math.max(0, Number(base) || 0)
  let h = Math.max(0, Number(height) || 0)

  if (kind === 'equilateral') {
    h = (b * Math.sqrt(3)) / 2
  }

  if (h === 0 && b === 0) b = 100
  if (h === 0) h = b

  const c = parseColor(color)
  const halfBase = b / 2
  const halfHeight = h / 2

  const transparent = 'transparent'

  let borderTop = '0'
  let borderRight = '0'
  let borderBottom = '0'
  let borderLeft = '0'
  let borderTopColor = transparent
  let borderRightColor = transparent
  let borderBottomColor = transparent
  let borderLeftColor = transparent

  switch (direction) {
    case 'up':
      borderLeft = toCssNumber(halfBase)
      borderRight = toCssNumber(halfBase)
      borderBottom = toCssNumber(h)
      borderBottomColor = c
      break
    case 'down':
      borderLeft = toCssNumber(halfBase)
      borderRight = toCssNumber(halfBase)
      borderTop = toCssNumber(h)
      borderTopColor = c
      break
    case 'left':
      borderTop = toCssNumber(halfHeight)
      borderBottom = toCssNumber(halfHeight)
      borderRight = toCssNumber(b)
      borderRightColor = c
      break
    case 'right':
      borderTop = toCssNumber(halfHeight)
      borderBottom = toCssNumber(halfHeight)
      borderLeft = toCssNumber(b)
      borderLeftColor = c
      break
    default:
      break
  }

  const css = [
    'width: 0;',
    'height: 0;',
    'border-style: solid;',
    `border-width: ${borderTop} ${borderRight} ${borderBottom} ${borderLeft};`,
    `border-color: ${borderTopColor} ${borderRightColor} ${borderBottomColor} ${borderLeftColor};`,
  ].join('\n')

  return {
    css,
    direction,
    base: round(b),
    height: round(h),
    color: c,
    kind,
  }
}

// Gera uma regra de classe pronta para colar.
export function buildTriangleClass(triangle, className = 'triangle') {
  return `.${className} {\n${triangle.css.split('\n').map((l) => `  ${l}`).join('\n')}\n}`
}
