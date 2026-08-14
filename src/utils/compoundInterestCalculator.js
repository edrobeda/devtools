// Motor 100% client-side para calculos de juros compostos.
// Considera capitalizacao periodica e aportes mensais recorrentes.

/**
 * Numero de periodos de capitalizacao por ano.
 */
export const COMPOUND_FREQUENCIES = [
  { key: 'annually', periodsPerYear: 1, labelPt: 'Anual', labelEn: 'Annually' },
  { key: 'semiannually', periodsPerYear: 2, labelPt: 'Semestral', labelEn: 'Semiannually' },
  { key: 'quarterly', periodsPerYear: 4, labelPt: 'Trimestral', labelEn: 'Quarterly' },
  { key: 'monthly', periodsPerYear: 12, labelPt: 'Mensal', labelEn: 'Monthly' },
  { key: 'daily', periodsPerYear: 365, labelPt: 'Diaria', labelEn: 'Daily' },
]

const FREQUENCY_BY_KEY = Object.fromEntries(
  COMPOUND_FREQUENCIES.map((f) => [f.key, f])
)

/**
 * Calcula a evolucao ano a ano de um investimento com juros compostos.
 *
 * Aporte mensal e convertido para o numero efetivo de aportes por ano
 * (12) e a taxa efetiva por periodo e anualRate / periodsPerYear.
 *
 * @param {number} principal - valor inicial investido
 * @param {number} monthlyContribution - aporte mensal recorrente
 * @param {number} annualRate - taxa anual em decimal (ex.: 0.12 para 12%)
 * @param {number} years - prazo em anos
 * @param {string} frequencyKey - chave de COMPOUND_FREQUENCIES
 * @returns {Array<{year: number, startBalance: number, totalContributions: number, totalInterest: number, endBalance: number}>}
 */
export function calculateCompoundInterest(
  principal,
  monthlyContribution,
  annualRate,
  years,
  frequencyKey = 'monthly'
) {
  const frequency = FREQUENCY_BY_KEY[frequencyKey] || FREQUENCY_BY_KEY.monthly
  const periodsPerYear = frequency.periodsPerYear
  const ratePerPeriod = annualRate / periodsPerYear
  const monthlyToPeriod = periodsPerYear / 12
  const contributionPerPeriod = monthlyContribution * monthlyToPeriod

  let balance = principal
  let totalContributions = principal
  let totalInterest = 0

  const rows = []

  for (let year = 1; year <= years; year++) {
    const startBalance = balance
    let yearContributions = 0
    let yearInterest = 0

    for (let p = 0; p < periodsPerYear; p++) {
      const interest = balance * ratePerPeriod
      balance += interest + contributionPerPeriod
      yearInterest += interest
      yearContributions += contributionPerPeriod
    }

    totalContributions += yearContributions
    totalInterest += yearInterest

    rows.push({
      year,
      startBalance,
      yearContributions,
      yearInterest,
      endBalance: balance,
      totalContributions,
      totalInterest,
    })
  }

  return rows
}

/**
 * Retorna o resumo final de uma simulacao.
 * @param {ReturnType<calculateCompoundInterest>} rows
 * @returns {{finalBalance: number, totalContributions: number, totalInterest: number}}
 */
export function getSummary(rows) {
  if (!rows.length) {
    return { finalBalance: 0, totalContributions: 0, totalInterest: 0 }
  }
  const last = rows[rows.length - 1]
  return {
    finalBalance: last.endBalance,
    totalContributions: last.totalContributions,
    totalInterest: last.totalInterest,
  }
}

/**
 * Formata um numero como moeda corrente (BRL/USD simplificado).
 * @param {number} value
 * @param {string} locale - ex.: 'pt-BR' ou 'en-US'
 * @param {string} currency - ex.: 'BRL' ou 'USD'
 * @returns {string}
 */
export function formatCurrency(value, locale = 'pt-BR', currency = 'BRL') {
  if (!Number.isFinite(value)) return '—'
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

/**
 * Formata um numero decimal como percentual.
 * @param {number} value
 * @param {number} [fractionDigits=2]
 * @returns {string}
 */
export function formatPercent(value, fractionDigits = 2) {
  if (!Number.isFinite(value)) return '—'
  return `${(value * 100).toFixed(fractionDigits).replace('.', ',')}%`
}

/**
 * Arredonda um numero para duas casas decimais.
 * @param {number} value
 * @returns {number}
 */
export function round2(value) {
  return Math.round(value * 100) / 100
}

/**
 * Exemplos rapidos de um clique.
 */
export const EXAMPLES = [
  {
    key: 'conservative',
    labelPt: 'Conservador',
    labelEn: 'Conservative',
    principal: 10000,
    monthlyContribution: 500,
    annualRate: 0.08,
    years: 10,
    frequencyKey: 'monthly',
  },
  {
    key: 'moderate',
    labelPt: 'Moderado',
    labelEn: 'Moderate',
    principal: 25000,
    monthlyContribution: 1000,
    annualRate: 0.12,
    years: 20,
    frequencyKey: 'monthly',
  },
  {
    key: 'aggressive',
    labelPt: 'Agressivo',
    labelEn: 'Aggressive',
    principal: 5000,
    monthlyContribution: 2000,
    annualRate: 0.15,
    years: 15,
    frequencyKey: 'monthly',
  },
]
