/**
 * Helpers genéricos de formatação numérica compartilhados pelos utils das
 * calculadoras (moeda, percentual e número).
 *
 * Antes cada util reescrevia a própria cópia destes helpers (algumas
 * byte-a-byte idênticas). Este módulo centraliza a lógica; as pequenas
 * diferenças entre as cópias originais (locale/moeda default, número fixo de
 * casas vs. default da moeda, arredondamento via toFixed vs. toLocaleString,
 * remoção de zeros à direita e o placeholder para valores não-finitos)
 * continuam sendo preservadas via o parâmetro `options`, de modo que a saída
 * de cada página permaneça exatamente a mesma.
 *
 * 100% client-side.
 */

/**
 * Converte um valor em número, devolvendo null para vazio/ inválido.
 * @param {*} value
 * @returns {number|null}
 */
export function toNumber(value) {
  if (value === null || value === undefined || value === '') return null
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : null
}

/**
 * Formata um valor como moeda.
 *
 * @param {number} value
 * @param {string} [locale='pt-BR']
 * @param {string} [currency='BRL']
 * @param {object} [options]
 * @param {number} [options.minimumFractionDigits] - força o mínimo de casas
 * @param {number} [options.maximumFractionDigits] - força o máximo de casas
 * @param {string} [options.nonFinite='—'] - placeholder para não-finitos
 * @param {boolean} [options.finiteCheck=true] - true usa Number.isFinite;
 *   false usa a checagem histórica null/undefined/NaN (que ainda formata
 *   Infinity/-Infinity pela moeda).
 * @returns {string}
 */
export function formatCurrency(value, locale = 'pt-BR', currency = 'BRL', options = {}) {
  const {
    minimumFractionDigits,
    maximumFractionDigits,
    nonFinite = '—',
    finiteCheck = true,
  } = options

  if (finiteCheck) {
    if (!Number.isFinite(value)) return nonFinite
  } else if (value === null || value === undefined || Number.isNaN(value)) {
    return nonFinite
  }

  const intlOptions = { style: 'currency', currency }
  if (minimumFractionDigits !== undefined) intlOptions.minimumFractionDigits = minimumFractionDigits
  if (maximumFractionDigits !== undefined) intlOptions.maximumFractionDigits = maximumFractionDigits
  return new Intl.NumberFormat(locale, intlOptions).format(value)
}

/**
 * Formata um decimal como percentual.
 *
 * @param {number} value
 * @param {number} [fractionDigits=2]
 * @param {object} [options]
 * @param {boolean} [options.useLocale=false] - true usa toLocaleString(segue o
 *   locale do navegador, ou options.locale); false usa toFixed com vírgula.
 * @param {string} [options.locale] - locale do toLocaleString
 * @param {string} [options.nonFinite='—'] - placeholder para não-finitos
 * @returns {string}
 */
export function formatPercent(value, fractionDigits = 2, options = {}) {
  const { useLocale = false, locale, nonFinite = '—' } = options

  if (useLocale) {
    if (value === null || value === undefined || Number.isNaN(value)) return nonFinite
    return `${(value * 100).toLocaleString(locale, { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits })}%`
  }

  if (!Number.isFinite(value)) return nonFinite
  return `${(value * 100).toFixed(fractionDigits).replace('.', ',')}%`
}

/**
 * Formata um número.
 *
 * @param {number} value
 * @param {number} [digits=2]
 * @param {object} [options]
 * @param {'locale'|'strip'} [options.style='locale'] - 'strip' usa toFixed e
 *   remove zeros decimais à direita; 'locale' usa toLocaleString com casas
 *   fixas.
 * @param {string} [options.locale] - locale do toLocaleString (default do navegador)
 * @param {string} [options.nonFinite='—'] - placeholder para não-finitos
 * @param {boolean} [options.finiteOnly=false] - true usa !Number.isFinite(value)
 *   como gatilho do placeholder (cobre null/undefined/NaN/Infinity); false usa
 *   a checagem histórica null/undefined/NaN.
 * @param {boolean} [options.castNumber=false] - faz Number(value) antes do
 *   toLocaleString.
 * @returns {string}
 */
export function formatNumber(value, digits = 2, options = {}) {
  const {
    style = 'locale',
    locale,
    nonFinite = '—',
    finiteOnly = false,
    castNumber = false,
  } = options

  if (style === 'strip') {
    if (value === null || value === undefined || Number.isNaN(value)) return nonFinite
    const n = Number(value)
    if (!Number.isFinite(n)) return nonFinite
    const fixed = n.toFixed(digits)
    return fixed.replace(/\.(\d+)$/, (match, dec) => (parseInt(dec, 10) ? match : ''))
  }

  if (finiteOnly) {
    if (!Number.isFinite(value)) return nonFinite
  } else if (value === null || value === undefined || Number.isNaN(value)) {
    return nonFinite
  }

  const n = castNumber ? Number(value) : value
  return n.toLocaleString(locale, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}
