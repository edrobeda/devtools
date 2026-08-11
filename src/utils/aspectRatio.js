/**
 * Utilitários para trabalhar com proporções (aspect ratio).
 * Tudo é 100% client-side; nenhum dado sai do navegador.
 */

/**
 * Calcula o MDC (máximo divisor comum) de dois inteiros usando o
 * algoritmo de Euclides. Aceita valores negativos devolvendo sempre
 * um valor positivo.
 */
export function gcd(a, b) {
  a = Math.abs(Math.round(a))
  b = Math.abs(Math.round(b))
  while (b !== 0) {
    const tmp = b
    b = a % b
    a = tmp
  }
  return a
}

/**
 * Simplifica uma proporção width:height para os menores inteiros
 * possíveis. Se a proporção for inválida (zero ou não-numérica),
 * devolve null.
 */
export function simplifyRatio(width, height) {
  const w = Number(width)
  const h = Number(height)
  if (!Number.isFinite(w) || !Number.isFinite(h) || w === 0 || h === 0) {
    return null
  }
  const divisor = gcd(w, h)
  if (divisor === 0) return null
  return { width: Math.round(w / divisor), height: Math.round(h / divisor) }
}

/**
 * Converte uma proporção width:height em um valor decimal
 * (width / height). Útil para comparações e para o CSS
 * `aspect-ratio` quando se quer a forma decimal.
 */
export function ratioDecimal(width, height) {
  const w = Number(width)
  const h = Number(height)
  if (!Number.isFinite(w) || !Number.isFinite(h) || h === 0) return null
  return w / h
}

/**
 * Calcula a dimensão faltante mantendo a proporção.
 * - Se width for fornecido, devolve a altura proporcional.
 * - Se height for fornecido, devolve a largura proporcional.
 * Se ambos forem fornecidos, width tem prioridade.
 */
export function fitDimension(ratioW, ratioH, { width, height } = {}) {
  const rw = Number(ratioW)
  const rh = Number(ratioH)
  if (!Number.isFinite(rw) || !Number.isFinite(rh) || rw === 0 || rh === 0) {
    return null
  }
  const w = Number(width)
  const h = Number(height)
  if (Number.isFinite(w) && w >= 0) {
    return { width: w, height: (w * rh) / rw }
  }
  if (Number.isFinite(h) && h >= 0) {
    return { width: (h * rw) / rh, height: h }
  }
  return null
}

/**
 * Gera o snippet CSS para aplicar a proporção. Inclui a propriedade
 * moderna `aspect-ratio` e o hack de `padding-bottom` para casos em
 * que se precisa de suporte mais amplo (o container pai precisa ter
 * `position: relative` e o filho `position: absolute; inset: 0`).
 */
export function buildAspectRatioCss(ratioW, ratioH, className = 'ratio-box') {
  const w = Number(ratioW)
  const h = Number(ratioH)
  if (!Number.isFinite(w) || !Number.isFinite(h) || w === 0 || h === 0) {
    return ''
  }
  const simplified = simplifyRatio(w, h)
  const sw = simplified ? simplified.width : w
  const sh = simplified ? simplified.height : h
  const paddingBottom = ((h / w) * 100).toFixed(4)
  return `/* Proporção ${sw}:${sh} */
.${className} {
  aspect-ratio: ${sw} / ${sh};
}

/* Fallback com padding-bottom (pne position:relative no pai) */
.${className}::before {
  content: '';
  display: block;
  padding-bottom: ${paddingBottom}%;
}
.${className} > * {
  position: absolute;
  inset: 0;
}`
}

/**
 * Lista de proporções comuns para fotografia, vídeo e telas.
 */
export const COMMON_RATIOS = [
  { label: '1:1', width: 1, height: 1 },
  { label: '4:3', width: 4, height: 3 },
  { label: '3:2', width: 3, height: 2 },
  { label: '16:9', width: 16, height: 9 },
  { label: '16:10', width: 16, height: 10 },
  { label: '21:9', width: 21, height: 9 },
  { label: '9:16', width: 9, height: 16 },
  { label: '2.35:1', width: 2.35, height: 1 },
  { label: '2.39:1', width: 2.39, height: 1 },
  { label: '5:4', width: 5, height: 4 },
  { label: '3:4', width: 3, height: 4 },
  { label: '32:9', width: 32, height: 9 },
]
