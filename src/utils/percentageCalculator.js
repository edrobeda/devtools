// Motor 100% client-side para calculos comuns de porcentagem.
// Nao envia dados para lugar nenhum.

/**
 * Quanto e `percent`% de `total`?
 * @param {number} percent - porcentagem (ex.: 20 para 20%)
 * @param {number} total - valor base
 * @returns {number}
 */
export function percentageOf(percent, total) {
  return (percent / 100) * total
}

/**
 * `part` representa quantos por cento de `total`?
 * @param {number} part - parcela
 * @param {number} total - valor base
 * @returns {number} porcentagem em pontos percentuais (ex.: 25 para 25%)
 */
export function whatPercentage(part, total) {
  if (total === 0) return 0
  return (part / total) * 100
}

/**
 * Variação percentual de `from` para `to`.
 * @param {number} from - valor inicial
 * @param {number} to - valor final
 * @returns {number} pontos percentuais (positivo = aumento, negativo = reducao)
 */
export function percentageChange(from, to) {
  if (from === 0) return 0
  return ((to - from) / from) * 100
}

/**
 * Aplica uma porcentagem a um valor.
 * Percent positivo = aumento; negativo = desconto.
 * @param {number} value - valor base
 * @param {number} percent - porcentagem a aplicar
 * @returns {number}
 */
export function applyPercentage(value, percent) {
  return value * (1 + percent / 100)
}

/**
 * Divide um valor entre `people` pessoas, acrescentando gorjeta percentual.
 * @param {number} total - valor total da conta
 * @param {number} people - numero de pessoas
 * @param {number} tipPercent - gorjeta em %
 * @returns {{totalWithTip: number, tipAmount: number, perPerson: number}}
 */
export function splitWithTip(total, people, tipPercent) {
  const tipAmount = (total * tipPercent) / 100
  const totalWithTip = total + tipAmount
  const perPerson = people > 0 ? totalWithTip / people : 0
  return { totalWithTip, tipAmount, perPerson }
}

/**
 * Converte uma fracao para porcentagem.
 * @param {number} numerator
 * @param {number} denominator
 * @returns {number}
 */
export function fractionToPercentage(numerator, denominator) {
  if (denominator === 0) return 0
  return (numerator / denominator) * 100
}

/**
 * Regra de tres simples: A esta para B assim como C esta para X.
 * @param {number} a
 * @param {number} b
 * @param {number} c
 * @returns {number}
 */
export function ruleOfThree(a, b, c) {
  if (a === 0) return 0
  return (b * c) / a
}

/**
 * Formata um numero com casas decimais configuraveis.
 * @param {number} value
 * @param {number} [fractionDigits=2]
 * @returns {string}
 */
export function formatNumber(value, fractionDigits = 2) {
  if (!Number.isFinite(value)) return '—'
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })
}

/**
 * Formata um numero como moeda.
 * @param {number} value
 * @param {string} [locale='pt-BR']
 * @param {string} [currency='BRL']
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
