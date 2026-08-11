// Tipografia fluida com `font-size: clamp(min, vw + px, max)`.
//
// A fórmula clássica traça uma reta entre os dois pontos
// (minVw, min) e (maxVw, max) do gráfico "tamanho × largura do viewport":
// o trecho da reta vira `Xvw + Ypx` e as pontas viram os limites do clamp —
// antes de minVw o tamanho congela no mínimo, depois de maxVw congela no
// máximo, e entre eles escala linearmente com a largura da tela.

export const BASE_FONT_SIZE = 16

const round = (v, digits = 3) => {
  const f = 10 ** digits
  return Math.round(v * f) / f
}

// Normaliza entradas: troca min/max se vierem invertidos e garante um
// intervalo de viewport estritamente positivo (evita divisão por zero
// enquanto o usuário arrasta os sliders).
function normalize({ min, max, minVw, maxVw } = {}) {
  let lo = Number(min) || 0
  let hi = Number(max) || 0
  if (hi < lo) {
    const t = lo
    lo = hi
    hi = t
  }
  let vwLo = Number(minVw) || 0
  let vwHi = Number(maxVw) || 1
  if (vwHi <= vwLo) vwHi = vwLo + 1
  return { min: lo, max: hi, minVw: vwLo, maxVw: vwHi }
}

// Monta o clamp() pronto pra colar e expõe a matemática (slope/intercept)
// pra exibir na página. `unit` aceita 'px' ou 'rem' (rem relativo ao
// font-size da raiz, 16px por padrão).
export function buildClamp(raw = {}) {
  const s = normalize(raw)
  const unit = raw.unit === 'rem' ? 'rem' : 'px'
  const toUnit = (px) => (unit === 'rem' ? round(px / BASE_FONT_SIZE, 4) : round(px))

  const slope = (s.max - s.min) / (s.maxVw - s.minVw) // px por px de viewport
  const intercept = s.min - slope * s.minVw // px no viewport 0
  const vwCoeff = slope * 100 // px por 100vw

  return {
    css: `clamp(${toUnit(s.min)}${unit}, ${round(vwCoeff, 4)}vw + ${toUnit(intercept)}${unit}, ${toUnit(s.max)}${unit})`,
    slope,
    vwCoeff,
    intercept,
    unit,
    min: s.min,
    max: s.max,
    minVw: s.minVw,
    maxVw: s.maxVw,
  }
}

// Tamanho efetivo numa largura de viewport qualquer, com o comportamento do
// clamp (congela fora do intervalo).
export function sizeAt(raw, viewportWidth) {
  const s = normalize(raw)
  const width = Number(viewportWidth) || 0
  if (width <= s.minVw) return s.min
  if (width >= s.maxVw) return s.max
  return s.min + ((s.max - s.min) * (width - s.minVw)) / (s.maxVw - s.minVw)
}
