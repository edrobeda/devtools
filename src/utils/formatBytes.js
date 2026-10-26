/**
 * Helpers genéricos de formatação de tamanho em bytes (base 1024) —
 * compartilhados pelos utils e páginas que precisam exibir "X B / KB / MB /
 * ..." pro usuário.
 *
 * Antes cada util/página reescrevia a própria cópia deste helper (algumas
 * byte a byte idênticas, outras com diferenças reais: lista de unidades,
 * nº de casas decimais, tratamento de entrada inválida e arredondamento).
 * Este módulo centraliza a lógica preservando todas essas diferenças via
 * `options`, de modo que a saída de cada página permaneça exatamente a
 * mesma.
 *
 * 100% client-side.
 */

/**
 * Predicate de "entrada inválida" que dispara `fallback`:
 *   exactZero          — bytes === 0
 *   zeroOrNaN          — bytes === 0 || Number.isNaN(bytes)
 *   notFinite          — !Number.isFinite(bytes); 0 não conta como inválido
 *   notFiniteOrNegative— !Number.isFinite(bytes) || bytes < 0
 *   none               — nunca dispara (assume bytes >= 0 finito)
 */
export const FORMAT_BYTES_INVALID = Object.freeze({
  EXACT_ZERO: 'exactZero',
  ZERO_OR_NAN: 'zeroOrNaN',
  NOT_FINITE: 'notFinite',
  NOT_FINITE_OR_NEGATIVE: 'notFiniteOrNegative',
  NONE: 'none',
})

/**
 * Formata um tamanho em bytes como string legível (B/KB/MB/...).
 *
 * @param {number} bytes
 * @param {object} [options]
 * @param {string[]} [options.units] - lista ordenada de unidades, do menor pro
 *   maior. Default: ['B', 'KB', 'MB', 'GB', 'TB', 'PB'].
 * @param {string} [options.fallback='0 B'] - texto devolvido quando a
 *   entrada casa o predicate `invalid`.
 * @param {string} [options.invalid='exactZero'] - uma das constantes de
 *   `FORMAT_BYTES_INVALID`.
 * @param {boolean} [options.clamp=true] - limita o índice calculado à última
 *   unidade (necessário para ranges finitos, ex.: B..TB). Sem clamp, valores
 *   que excedem a maior unidade viram string quebrada (mesmo comportamento
 *   das cópias originais sem clamp).
 * @param {boolean} [options.stripZeros=false] - se true, passa o `toFixed`
 *   por `parseFloat` pra remover zeros à direita.
 * @param {number|function} [options.decimals=2] - casas decimais:
 *   - number: fixo em todas as unidades
 *   - function(value, index): dinâmico. `value` é o número já escalado pela
 *     unidade escolhida (sem casas decimais forçadas); `index` é o índice em
 *     `units` (0 = B, 1 = KB, ...).
 * @returns {string}
 */
export function formatBytes(bytes, options = {}) {
  const {
    units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'],
    fallback = '0 B',
    invalid = FORMAT_BYTES_INVALID.EXACT_ZERO,
    clamp = true,
    stripZeros = false,
    decimals = 2,
  } = options

  switch (invalid) {
    case FORMAT_BYTES_INVALID.EXACT_ZERO:
      if (bytes === 0) return fallback
      break
    case FORMAT_BYTES_INVALID.ZERO_OR_NAN:
      if (bytes === 0 || Number.isNaN(bytes)) return fallback
      break
    case FORMAT_BYTES_INVALID.NOT_FINITE:
      if (!Number.isFinite(bytes)) return fallback
      break
    case FORMAT_BYTES_INVALID.NOT_FINITE_OR_NEGATIVE:
      if (!Number.isFinite(bytes) || bytes < 0) return fallback
      break
    case FORMAT_BYTES_INVALID.NONE:
      break
    default:
      throw new Error(`formatBytes: invalid mode "${invalid}"`)
  }

  const k = 1024
  // Math.log(0) = -Infinity ⇒ iRaw seria -Infinity e Math.log(bytes<0) =
  // NaN ⇒ iRaw seria NaN. Como `invalid` já cobriu o caso "0 precisa de
  // fallback", aqui só sobra o 0 que o caller deixou passar (ex.: sseTester
  // deixa pois !Number.isFinite(0)=false). Forçamos i=0 nesse caso, igual
  // ao while-loop das cópias originais.
  const iRaw = bytes === 0 ? 0 : Math.floor(Math.log(bytes) / Math.log(k))
  const i = clamp ? Math.min(Math.max(0, iRaw), units.length - 1) : iRaw
  const value = bytes / k ** i

  const d = typeof decimals === 'function' ? decimals(value, i) : decimals
  const formatted = value.toFixed(d)
  const final = stripZeros ? parseFloat(formatted) : formatted
  return `${final} ${units[i]}`
}
