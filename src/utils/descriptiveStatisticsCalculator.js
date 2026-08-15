// Motor 100% client-side para calculo de estatistica descritiva.
// Nao envia dados para lugar nenhum.

/**
 * Extrai numeros validos de um texto livre.
 * Aceita separadores: virgula, ponto-e-virgula, espaco, tab ou nova linha.
 * Ignora entradas vazias e textos que nao sejam numeros.
 * @param {string} text
 * @returns {number[]}
 */
export function parseNumberList(text) {
  if (!text || typeof text !== 'string') return []
  return text
    .split(/[,;\s]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => Number(s))
    .filter((n) => Number.isFinite(n))
}

/**
 * Formata um numero com casas decimais fixas.
 * @param {number} value
 * @param {number} [digits=4]
 * @returns {string}
 */
export function formatNumber(value, digits = 4) {
  if (!Number.isFinite(value)) return '—'
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

/**
 * Ordena uma copia do array numericamente.
 * @param {number[]} values
 * @returns {number[]}
 */
function sorted(values) {
  return [...values].sort((a, b) => a - b)
}

/**
 * Calcula a media aritmetica.
 * @param {number[]} values
 * @returns {number}
 */
function mean(values) {
  if (values.length === 0) return 0
  return values.reduce((a, b) => a + b, 0) / values.length
}

/**
 * Calcula a mediana de um array ja ordenado.
 * @param {number[]} sortedValues
 * @returns {number}
 */
function medianSorted(sortedValues) {
  const n = sortedValues.length
  if (n === 0) return 0
  const mid = Math.floor(n / 2)
  if (n % 2 === 1) return sortedValues[mid]
  return (sortedValues[mid - 1] + sortedValues[mid]) / 2
}

/**
 * Calcula um percentil de um array ordenado usando interpolacao linear.
 * @param {number[]} sortedValues
 * @param {number} p - percentil entre 0 e 1
 * @returns {number}
 */
function percentileSorted(sortedValues, p) {
  const n = sortedValues.length
  if (n === 0) return 0
  if (p <= 0) return sortedValues[0]
  if (p >= 1) return sortedValues[n - 1]
  const index = p * (n - 1)
  const lower = Math.floor(index)
  const upper = Math.ceil(index)
  const weight = index - lower
  return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight
}

/**
 * Calcula a(s) moda(s) do array.
 * @param {number[]} values
 * @returns {{ modes: number[], frequency: number }}
 */
function calculateMode(values) {
  if (values.length === 0) return { modes: [], frequency: 0 }
  const counts = new Map()
  let maxCount = 0
  for (const v of values) {
    const c = (counts.get(v) || 0) + 1
    counts.set(v, c)
    if (c > maxCount) maxCount = c
  }
  if (maxCount <= 1) return { modes: [], frequency: 1 }
  const modes = []
  counts.forEach((c, v) => {
    if (c === maxCount) modes.push(v)
  })
  return { modes: modes.sort((a, b) => a - b), frequency: maxCount }
}

/**
 * Calcula variancia e desvio padrao amostral (n-1) e populacional (n)
 * usando o algoritmo de Welford para estabilidade numerica.
 * @param {number[]} values
 * @returns {{
 *   sampleVariance: number,
 *   populationVariance: number,
 *   sampleStandardDeviation: number,
 *   populationStandardDeviation: number
 * }}
 */
function varianceAndStd(values) {
  const n = values.length
  if (n === 0) {
    return {
      sampleVariance: 0,
      populationVariance: 0,
      sampleStandardDeviation: 0,
      populationStandardDeviation: 0,
    }
  }
  let m = 0
  let s = 0
  for (let i = 0; i < n; i++) {
    const x = values[i]
    const oldM = m
    m += (x - m) / (i + 1)
    s += (x - oldM) * (x - m)
  }
  return {
    sampleVariance: n > 1 ? s / (n - 1) : 0,
    populationVariance: s / n,
    sampleStandardDeviation: n > 1 ? Math.sqrt(s / (n - 1)) : 0,
    populationStandardDeviation: Math.sqrt(s / n),
  }
}

/**
 * Calcula assimetria (skewness) amostral ajustada.
 * @param {number[]} values
 * @param {number} avg
 * @param {number} sampleStd
 * @returns {number}
 */
function skewness(values, avg, sampleStd) {
  const n = values.length
  if (n < 3 || sampleStd === 0) return 0
  let sum = 0
  for (const v of values) {
    sum += Math.pow(v - avg, 3)
  }
  const g1 = (sum / n) / Math.pow(sampleStd, 3)
  return (g1 * Math.sqrt(n * (n - 1))) / (n - 2)
}

/**
 * Calcula curtose excesso (excess kurtosis) amostral ajustada.
 * @param {number[]} values
 * @param {number} avg
 * @param {number} sampleStd
 * @returns {number}
 */
function kurtosis(values, avg, sampleStd) {
  const n = values.length
  if (n < 4 || sampleStd === 0) return 0
  let sum = 0
  for (const v of values) {
    sum += Math.pow(v - avg, 4)
  }
  const m4 = sum / n
  const g2 = m4 / Math.pow(sampleStd, 4) - 3
  return ((n - 1) * ((n + 1) * g2 + 6)) / ((n - 2) * (n - 3))
}

/**
 * Calcula estatisticas descritivas completas de uma lista de numeros.
 * @param {number[]} values
 * @returns {object}
 */
export function descriptiveStatistics(values) {
  const n = values.length
  const sortedValues = sorted(values)
  const sum = values.reduce((a, b) => a + b, 0)
  const avg = mean(values)
  const min = n > 0 ? sortedValues[0] : 0
  const max = n > 0 ? sortedValues[n - 1] : 0
  const range = max - min
  const med = medianSorted(sortedValues)
  const { modes, frequency } = calculateMode(values)
  const {
    sampleVariance,
    populationVariance,
    sampleStandardDeviation,
    populationStandardDeviation,
  } = varianceAndStd(values)

  const q1 = percentileSorted(sortedValues, 0.25)
  const q2 = med
  const q3 = percentileSorted(sortedValues, 0.75)
  const iqr = q3 - q1

  const skew = skewness(values, avg, sampleStandardDeviation)
  const kurt = kurtosis(values, avg, sampleStandardDeviation)

  const cv = avg !== 0 ? (sampleStandardDeviation / Math.abs(avg)) * 100 : 0

  const lowerFence = q1 - 1.5 * iqr
  const upperFence = q3 + 1.5 * iqr
  const outliers = sortedValues.filter((v) => v < lowerFence || v > upperFence)

  const sumOfSquares = values.reduce((a, b) => a + b * b, 0)

  return {
    count: n,
    sum,
    sumOfSquares,
    min,
    max,
    range,
    mean: avg,
    median: med,
    mode: modes,
    modeFrequency: frequency,
    populationVariance,
    sampleVariance,
    populationStandardDeviation,
    sampleStandardDeviation,
    coefficientOfVariation: cv,
    quartile1: q1,
    quartile2: q2,
    quartile3: q3,
    interquartileRange: iqr,
    skewness: skew,
    kurtosis: kurt,
    lowerFence,
    upperFence,
    outliers,
    sorted: sortedValues,
    valid: n > 0,
  }
}

/**
 * Constroi dados de histograma a partir de uma lista de numeros.
 * @param {number[]} values
 * @param {number} [binCount] - numero de bins desejado; se omitido, usa regra de Sturges
 * @returns {{ bins: { min: number, max: number, count: number, frequency: number }[], binWidth: number, min: number, max: number }}
 */
export function buildHistogram(values, binCount) {
  const n = values.length
  if (n === 0) {
    return { bins: [], binWidth: 0, min: 0, max: 0 }
  }
  const sortedValues = sorted(values)
  const min = sortedValues[0]
  const max = sortedValues[n - 1]
  const range = max - min

  let bins = binCount
  if (!bins || bins < 1) {
    bins = Math.max(1, Math.ceil(Math.log2(n) + 1))
  }
  if (bins > 50) bins = 50

  const binWidth = range === 0 ? 1 : range / bins

  const bucketBins = Array.from({ length: bins }, (_, i) => ({
    min: min + i * binWidth,
    max: min + (i + 1) * binWidth,
    count: 0,
    frequency: 0,
  }))

  for (const v of values) {
    let idx = Math.floor((v - min) / binWidth)
    if (idx >= bins) idx = bins - 1
    if (idx < 0) idx = 0
    bucketBins[idx].count += 1
  }

  for (const b of bucketBins) {
    b.frequency = b.count / n
  }

  return { bins: bucketBins, binWidth, min, max }
}

/**
 * Cenarios rapidos de um clique.
 */
export const PRESETS = {
  pt: {
    responseTimes: {
      label: 'Tempos de resposta (ms)',
      data: '120,145,132,189,201,155,142,138,167,178,190,210,155,148,162',
    },
    grades: {
      label: 'Notas de avaliacao',
      data: '7.5,8.2,6.8,9.1,7.0,8.5,7.8,6.5,8.9,7.3,7.6,8.0',
    },
    salaries: {
      label: 'Salarios (mil)',
      data: '4.5,5.2,6.1,7.0,5.8,8.2,12.5,6.3,5.5,7.2,6.8,9.0',
    },
    sales: {
      label: 'Vendas diarias',
      data: '42,38,51,47,55,49,44,39,58,52,46,50,48,41,53',
    },
  },
  en: {
    responseTimes: {
      label: 'Response times (ms)',
      data: '120,145,132,189,201,155,142,138,167,178,190,210,155,148,162',
    },
    grades: {
      label: 'Exam grades',
      data: '7.5,8.2,6.8,9.1,7.0,8.5,7.8,6.5,8.9,7.3,7.6,8.0',
    },
    salaries: {
      label: 'Salaries (k)',
      data: '4.5,5.2,6.1,7.0,5.8,8.2,12.5,6.3,5.5,7.2,6.8,9.0',
    },
    sales: {
      label: 'Daily sales',
      data: '42,38,51,47,55,49,44,39,58,52,46,50,48,41,53',
    },
  },
}
