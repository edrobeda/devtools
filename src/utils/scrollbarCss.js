// Monta o bloco CSS de scrollbar customizado a partir de um objeto de
// configuração. As pseudo-classes `::-webkit-scrollbar*` cuidam do Chromium
// e Safari, enquanto as propriedades `scrollbar-width`/`scrollbar-color`
// cobrem o Firefox — os dois sistemas convivem no mesmo arquivo.

export const DEMO_CLASS = 'devtools-scroll-demo'

const boxClip = (border) => (border > 0 ? `  background-clip: padding-box;\n` : '')

export function buildScrollbarCss(settings = {}) {
  const {
    width = 12,
    trackColor = '#e9edf3',
    trackRadius = 8,
    thumbColor = '#1677ff',
    thumbRadius = 8,
    thumbBorder = 0,
    cornerColor = '#e9edf3',
    firefoxWidth = 'thin',
  } = settings

  const sel = `.${DEMO_CLASS}`
  let out = ''

  // WebKit/Chromium/Safari — pseudo-elementos não-padrão da spec, mas que
  // são o jeito padrão de estilizar scrollbar nesses engines.
  out += `${sel}::-webkit-scrollbar {\n`
  out += `  width: ${width}px;\n`
  out += `  height: ${width}px;\n`
  out += `  background: ${trackColor};\n`
  out += `}\n\n`

  out += `${sel}::-webkit-scrollbar-track {\n`
  out += `  background: ${trackColor};\n`
  out += `  border-radius: ${trackRadius}px;\n`
  out += `}\n\n`

  out += `${sel}::-webkit-scrollbar-thumb {\n`
  out += `  background: ${thumbColor};\n`
  if (thumbBorder > 0) {
    out += `  border: ${thumbBorder}px solid ${trackColor};\n`
  }
  out += `  border-radius: ${thumbRadius}px;\n`
  if (thumbBorder > 0) {
    out += boxClip(thumbBorder)
  }
  out += `}\n\n`

  out += `${sel}::-webkit-scrollbar-corner {\n`
  out += `  background: ${cornerColor};\n`
  out += `}\n\n`

  // Firefox — uma linha única de scrollbar-color (thumb track).
  out += `${sel} {\n`
  out += `  scrollbar-width: ${firefoxWidth};\n`
  out += `  scrollbar-color: ${thumbColor} ${trackColor};\n`
  out += `}\n`

  return out
}