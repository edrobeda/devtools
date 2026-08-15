// Motor 100% client-side para calculo estatistico de testes A/B.
// Nao envia dados para lugar nenhum.

const Z_SCORES = {
  0.9: 1.645,
  0.95: 1.96,
  0.99: 2.576,
}

/**
 * Retorna o z-score para um nivel de confianca conhecido.
 * @param {number} level - nivel de confianca (0.9, 0.95 ou 0.99)
 * @returns {number}
 */
export function confidenceZ(level) {
  return Z_SCORES[level] ?? 1.96
}

/**
 * Aproximacao da funcao erro (erf) por Abramowitz & Stegun.
 * Precisa o suficiente para p-values de testes A/B.
 * @param {number} x
 * @returns {number} valor entre -1 e 1
 */
export function erf(x) {
  const sign = x >= 0 ? 1 : -1
  x = Math.abs(x)
  const a1 = 0.254829592
  const a2 = -0.284496736
  const a3 = 1.421413741
  const a4 = -1.453152027
  const a5 = 1.061405429
  const p = 0.3275911
  const t = 1 / (1 + p * x)
  const y = 1 - (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t) * Math.exp(-x * x)
  return sign * y
}

/**
 * CDF da distribuicao normal padrao N(0,1).
 * @param {number} x
 * @returns {number}
 */
export function normalCdf(x) {
  return 0.5 * (1 + erf(x / Math.SQRT2))
}

/**
 * P-value bicaudal a partir de um z-score.
 * @param {number} z
 * @returns {number}
 */
export function twoTailedPValue(z) {
  return 2 * (1 - normalCdf(Math.abs(z)))
}

/**
 * Taxa de conversao e erro padrao de uma proporcao.
 * @param {number} conversions
 * @param {number} visitors
 * @returns {{ rate: number, se: number, valid: boolean }}
 */
export function proportionStats(conversions, visitors) {
  const n = Number(visitors) || 0
  const c = Number(conversions) || 0
  if (n <= 0 || c < 0 || c > n) {
    return { rate: 0, se: 0, valid: false }
  }
  const rate = c / n
  const se = Math.sqrt((rate * (1 - rate)) / n)
  return { rate, se, valid: true }
}

/**
 * Intervalo de confianca para uma proporcao.
 * @param {number} rate
 * @param {number} se
 * @param {number} level
 * @returns {{ lower: number, upper: number }}
 */
export function proportionConfidenceInterval(rate, se, level = 0.95) {
  const z = confidenceZ(level)
  const margin = z * se
  return {
    lower: Math.max(0, rate - margin),
    upper: Math.min(1, rate + margin),
  }
}

/**
 * Calculo completo de um teste A/B entre controle e variante.
 * @param {number} controlVisitors
 * @param {number} controlConversions
 * @param {number} variantVisitors
 * @param {number} variantConversions
 * @param {number} confidenceLevel
 * @returns {object}
 */
export function calculateAbTest(
  controlVisitors,
  controlConversions,
  variantVisitors,
  variantConversions,
  confidenceLevel = 0.95
) {
  const control = proportionStats(controlConversions, controlVisitors)
  const variant = proportionStats(variantConversions, variantVisitors)

  if (!control.valid || !variant.valid) {
    return {
      control,
      variant,
      difference: 0,
      relativeUplift: 0,
      pooledSe: 0,
      zScore: 0,
      pValue: 1,
      confidenceLevel,
      significant: false,
      winner: null,
      differenceInterval: { lower: 0, upper: 0 },
    }
  }

  const difference = variant.rate - control.rate
  const relativeUplift = control.rate === 0 ? 0 : difference / control.rate

  // Erro padrao da diferenca de duas proporcoes independentes.
  const pooledSe = Math.sqrt(control.se ** 2 + variant.se ** 2)

  const zScore = pooledSe === 0 ? 0 : difference / pooledSe
  const pValue = twoTailedPValue(zScore)

  const z = confidenceZ(confidenceLevel)
  const margin = z * pooledSe
  const differenceInterval = {
    lower: difference - margin,
    upper: difference + margin,
  }

  const alpha = 1 - confidenceLevel
  const significant = pValue < alpha

  let winner = null
  if (significant) {
    winner = difference > 0 ? 'variant' : 'control'
  }

  return {
    control,
    variant,
    difference,
    relativeUplift,
    pooledSe,
    zScore,
    pValue,
    confidenceLevel,
    significant,
    winner,
    differenceInterval,
  }
}

/**
 * Formata um numero entre 0 e 1 como porcentagem.
 * @param {number} value
 * @param {number} [digits=2]
 * @returns {string}
 */
export function formatPercent(value, digits = 2) {
  if (!Number.isFinite(value)) return '—'
  return `${(value * 100).toLocaleString('pt-BR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}%`
}

/**
 * Formata um numero puro com casas decimais.
 * @param {number} value
 * @param {number} [digits=3]
 * @returns {string}
 */
export function formatNumber(value, digits = 3) {
  if (!Number.isFinite(value)) return '—'
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

/**
 * Cenarios rapidos de um clique.
 */
export const PRESETS = {
  pt: {
    baseline: {
      label: 'Baseline classico',
      controlVisitors: 10000,
      controlConversions: 500,
      variantVisitors: 10000,
      variantConversions: 580,
      confidenceLevel: 0.95,
    },
    clearWinner: {
      label: 'Vencedora clara',
      controlVisitors: 5000,
      controlConversions: 250,
      variantVisitors: 5000,
      variantConversions: 330,
      confidenceLevel: 0.95,
    },
    inconclusive: {
      label: 'Resultado inconclusivo',
      controlVisitors: 2000,
      controlConversions: 100,
      variantVisitors: 2000,
      variantConversions: 108,
      confidenceLevel: 0.95,
    },
    smallSample: {
      label: 'Amostra pequena',
      controlVisitors: 100,
      controlConversions: 10,
      variantVisitors: 100,
      variantConversions: 18,
      confidenceLevel: 0.9,
    },
  },
  en: {
    baseline: {
      label: 'Classic baseline',
      controlVisitors: 10000,
      controlConversions: 500,
      variantVisitors: 10000,
      variantConversions: 580,
      confidenceLevel: 0.95,
    },
    clearWinner: {
      label: 'Clear winner',
      controlVisitors: 5000,
      controlConversions: 250,
      variantVisitors: 5000,
      variantConversions: 330,
      confidenceLevel: 0.95,
    },
    inconclusive: {
      label: 'Inconclusive result',
      controlVisitors: 2000,
      controlConversions: 100,
      variantVisitors: 2000,
      variantConversions: 108,
      confidenceLevel: 0.95,
    },
    smallSample: {
      label: 'Small sample',
      controlVisitors: 100,
      controlConversions: 10,
      variantVisitors: 100,
      variantConversions: 18,
      confidenceLevel: 0.9,
    },
  },
}
