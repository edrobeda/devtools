/**
 * Motor de cálculo financeiro: VPL (NPV), TIR (IRR), ROI e payback.
 * Todas as operações são puras e 100% client-side.
 *
 * Fórmulas:
 *   NPV  = -I0 + Σ (CFt / (1 + r)^t)
 *   IRR  = taxa r tal que NPV(r) = 0
 *   ROI  = (Σ CFt - I0) / I0
 *   Payback simples      = período em que o fluxo acumulado nominal zera
 *   Payback descontado   = período em que o fluxo acumulado descontado zera
 */

export const PERIOD_TYPES = [
  { key: 'year', labelPt: 'ano', labelEn: 'year', labelPlPt: 'anos', labelPlEn: 'years' },
  { key: 'month', labelPt: 'mês', labelEn: 'month', labelPlPt: 'meses', labelPlEn: 'months' },
]

function toNumber(value) {
  if (value === null || value === undefined || value === '') return null
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : null
}

export function formatCurrency(value, locale = 'pt-BR', currency = 'BRL') {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value)
}

export function formatPercent(value, decimals = 2) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return `${(value * 100).toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}%`
}

export function calculateNpv(rate, initialInvestment, cashFlows) {
  const r = toNumber(rate)
  const i0 = toNumber(initialInvestment)
  if (r === null || i0 === null || !Array.isArray(cashFlows)) return null
  if (r <= -1) return null

  let npv = -Math.abs(i0)
  for (let t = 0; t < cashFlows.length; t++) {
    const cf = toNumber(cashFlows[t])
    if (cf === null) return null
    npv += cf / Math.pow(1 + r, t + 1)
  }
  return npv
}

export function calculateIrr(initialInvestment, cashFlows, maxRate = 10) {
  const i0 = toNumber(initialInvestment)
  if (i0 === null || i0 <= 0 || !Array.isArray(cashFlows) || cashFlows.length === 0) return null

  const flows = cashFlows.map(toNumber)
  if (flows.some((v) => v === null)) return null

  const npvAt = (rate) => {
    let total = -i0
    for (let t = 0; t < flows.length; t++) {
      total += flows[t] / Math.pow(1 + rate, t + 1)
    }
    return total
  }

  let low = 0
  let high = 1
  let npvLow = npvAt(low)
  let npvHigh = npvAt(high)

  // Se a 0% já é negativo, não existe raiz real positiva comum.
  if (npvLow <= 0) return null

  // Expande o intervalo até encontrar mudança de sinal ou limite.
  while (npvHigh > 0 && high < maxRate) {
    high *= 2
    npvHigh = npvAt(high)
  }
  if (npvHigh > 0) return null
  if (npvHigh === 0) return high

  for (let iter = 0; iter < 100; iter++) {
    const mid = (low + high) / 2
    const npvMid = npvAt(mid)
    if (Math.abs(npvMid) < 1e-9) return mid
    if (npvMid > 0) {
      low = mid
      npvLow = npvMid
    } else {
      high = mid
      npvHigh = npvMid
    }
    if (high - low < 1e-12) return mid
  }

  return (low + high) / 2
}

export function calculateRoi(initialInvestment, cashFlows) {
  const i0 = toNumber(initialInvestment)
  if (i0 === null || i0 <= 0 || !Array.isArray(cashFlows)) return null
  const totalReturn = cashFlows.reduce((sum, cf) => sum + (toNumber(cf) || 0), 0)
  return (totalReturn - i0) / i0
}

export function calculatePayback(initialInvestment, cashFlows) {
  const i0 = toNumber(initialInvestment)
  if (i0 === null || i0 <= 0 || !Array.isArray(cashFlows)) return null

  let accumulated = -i0
  for (let t = 0; t < cashFlows.length; t++) {
    const cf = toNumber(cashFlows[t])
    if (cf === null) return null
    const prev = accumulated
    accumulated += cf
    if (prev < 0 && accumulated >= 0) {
      return t + (-prev / cf)
    }
  }
  return null
}

export function calculateDiscountedPayback(rate, initialInvestment, cashFlows) {
  const r = toNumber(rate)
  const i0 = toNumber(initialInvestment)
  if (r === null || i0 === null || r <= -1 || !Array.isArray(cashFlows)) return null

  let accumulated = -Math.abs(i0)
  for (let t = 0; t < cashFlows.length; t++) {
    const cf = toNumber(cashFlows[t])
    if (cf === null) return null
    const pv = cf / Math.pow(1 + r, t + 1)
    const prev = accumulated
    accumulated += pv
    if (prev < 0 && accumulated >= 0) {
      return t + (-prev / pv)
    }
  }
  return null
}

export function buildCashFlowTable(rate, initialInvestment, cashFlows) {
  const r = toNumber(rate)
  const i0 = toNumber(initialInvestment)
  if (r === null || i0 === null || !Array.isArray(cashFlows)) return []

  const rows = []
  let accumulatedPv = -Math.abs(i0)
  let accumulatedNominal = -Math.abs(i0)

  rows.push({
    period: 0,
    cashFlow: -Math.abs(i0),
    presentValue: -Math.abs(i0),
    accumulatedPv,
    accumulatedNominal,
  })

  for (let t = 0; t < cashFlows.length; t++) {
    const cf = toNumber(cashFlows[t])
    if (cf === null) continue
    const pv = cf / Math.pow(1 + r, t + 1)
    accumulatedPv += pv
    accumulatedNominal += cf
    rows.push({
      period: t + 1,
      cashFlow: cf,
      presentValue: pv,
      accumulatedPv,
      accumulatedNominal,
    })
  }

  return rows
}

export function calculateSummary(rate, initialInvestment, cashFlows) {
  const npv = calculateNpv(rate, initialInvestment, cashFlows)
  const irr = calculateIrr(initialInvestment, cashFlows)
  const roi = calculateRoi(initialInvestment, cashFlows)
  const payback = calculatePayback(initialInvestment, cashFlows)
  const discountedPayback = calculateDiscountedPayback(rate, initialInvestment, cashFlows)
  const totalReturn = cashFlows.reduce((sum, cf) => sum + (toNumber(cf) || 0), 0)

  return {
    npv,
    irr,
    roi,
    payback,
    discountedPayback,
    totalReturn,
    netProfit: totalReturn - Math.abs(initialInvestment || 0),
  }
}

export function makeCashFlow(value = '') {
  return { id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`, value }
}

export const PRESETS = {
  pt: [
    {
      name: 'Projeto de software',
      rate: 0.10,
      periodType: 'year',
      initialInvestment: 120000,
      cashFlows: [45000, 52000, 58000, 64000, 70000],
    },
    {
      name: 'Expansão de infra',
      rate: 0.12,
      periodType: 'year',
      initialInvestment: 200000,
      cashFlows: [35000, 42000, 50000, 60000, 72000, 85000],
    },
    {
      name: 'Campanha de marketing',
      rate: 0.15,
      periodType: 'month',
      initialInvestment: 30000,
      cashFlows: [8000, 9500, 11000, 12500, 14000, 15500],
    },
    {
      name: 'Aquisição de equipamento',
      rate: 0.08,
      periodType: 'year',
      initialInvestment: 80000,
      cashFlows: [22000, 24000, 26000, 28000, 30000],
    },
    {
      name: 'Mínimo',
      rate: 0.10,
      periodType: 'year',
      initialInvestment: 10000,
      cashFlows: [3000, 4000, 5000],
    },
  ],
  en: [
    {
      name: 'Software project',
      rate: 0.10,
      periodType: 'year',
      initialInvestment: 120000,
      cashFlows: [45000, 52000, 58000, 64000, 70000],
    },
    {
      name: 'Infrastructure expansion',
      rate: 0.12,
      periodType: 'year',
      initialInvestment: 200000,
      cashFlows: [35000, 42000, 50000, 60000, 72000, 85000],
    },
    {
      name: 'Marketing campaign',
      rate: 0.15,
      periodType: 'month',
      initialInvestment: 30000,
      cashFlows: [8000, 9500, 11000, 12500, 14000, 15500],
    },
    {
      name: 'Equipment purchase',
      rate: 0.08,
      periodType: 'year',
      initialInvestment: 80000,
      cashFlows: [22000, 24000, 26000, 28000, 30000],
    },
    {
      name: 'Minimal',
      rate: 0.10,
      periodType: 'year',
      initialInvestment: 10000,
      cashFlows: [3000, 4000, 5000],
    },
  ],
}

export function exportMarkdown(rate, initialInvestment, cashFlows, summary, table, periodLabel, t) {
  const lines = [
    `| ${t.periodCol} | ${t.cashFlowCol} | ${t.presentValueCol} | ${t.accumulatedPvCol} |`,
    `|---|---|---|---|`,
  ]
  for (const row of table) {
    lines.push(`| ${row.period} | ${formatCurrency(row.cashFlow, 'pt-BR', 'BRL')} | ${formatCurrency(row.presentValue, 'pt-BR', 'BRL')} | ${formatCurrency(row.accumulatedPv, 'pt-BR', 'BRL')} |`)
  }
  lines.push('')
  lines.push(`**NPV:** ${formatCurrency(summary.npv, 'pt-BR', 'BRL')}`)
  lines.push(`**IRR:** ${formatPercent(summary.irr)}`)
  lines.push(`**ROI:** ${formatPercent(summary.roi)}`)
  if (summary.payback !== null) lines.push(`**${t.payback}:** ${summary.payback.toFixed(2)} ${periodLabel}`)
  if (summary.discountedPayback !== null) lines.push(`**${t.discountedPayback}:** ${summary.discountedPayback.toFixed(2)} ${periodLabel}`)
  return lines.join('\n')
}
