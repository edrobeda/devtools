/**
 * Motor de cálculo de Unit Economics de SaaS.
 * 100% client-side — nenhum dado financeiro sai do navegador.
 *
 * Fórmulas:
 *   ARPU  = MRR / clientes
 *   LTV   = (ARPU * margemBruta) / churnMensal
 *   LTV/CAC = LTV / CAC
 *   Payback CAC (meses) = CAC / (ARPU * margemBruta)
 *   ARR   = MRR * 12
 *   NRR aproximado = 1 + taxaExpansão - taxaChurn
 */

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

export function formatMonths(value, t) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  const rounded = Math.round(value * 10) / 10
  if (!t) return `${rounded} meses`
  return `${rounded} ${rounded === 1 ? t.monthSingular : t.monthPlural}`
}

export function calculateUnitEconomics(mrr, customers, cac, grossMargin, churn, expansion = 0) {
  const m = toNumber(mrr)
  const c = toNumber(customers)
  const acquisitionCost = toNumber(cac)
  const margin = toNumber(grossMargin)
  const churnRate = toNumber(churn)
  const expansionRate = toNumber(expansion)

  if (
    m === null ||
    c === null ||
    acquisitionCost === null ||
    margin === null ||
    churnRate === null ||
    c <= 0 ||
    acquisitionCost < 0 ||
    margin < 0 ||
    margin > 1 ||
    churnRate < 0 ||
    churnRate > 1
  ) {
    return null
  }

  const arpu = m / c
  const grossProfitPerCustomer = arpu * margin
  const ltv = churnRate > 0 ? grossProfitPerCustomer / churnRate : null
  const ltvCac = ltv !== null && acquisitionCost > 0 ? ltv / acquisitionCost : null
  const paybackMonths = grossProfitPerCustomer > 0 ? acquisitionCost / grossProfitPerCustomer : null
  const arr = m * 12
  const nrr = 1 + expansionRate - churnRate

  return {
    arpu,
    grossProfitPerCustomer,
    ltv,
    ltvCac,
    paybackMonths,
    arr,
    nrr,
    mrr: m,
    customers: c,
    cac: acquisitionCost,
    grossMargin: margin,
    churnRate,
    expansionRate,
  }
}

export function healthSummary(metrics, t) {
  if (!metrics) return null
  const checks = []

  // LTV/CAC: saudável > 3, preocupante 1-3, ruim < 1
  const ltvCac = metrics.ltvCac
  if (ltvCac !== null) {
    if (ltvCac >= 3) checks.push({ label: t.ltvCac, status: 'good', message: t.ltvCacGood })
    else if (ltvCac >= 1) checks.push({ label: t.ltvCac, status: 'warning', message: t.ltvCacWarning })
    else checks.push({ label: t.ltvCac, status: 'bad', message: t.ltvCacBad })
  }

  // Payback: saudável <= 12 meses
  const payback = metrics.paybackMonths
  if (payback !== null) {
    if (payback <= 12) checks.push({ label: t.payback, status: 'good', message: t.paybackGood })
    else if (payback <= 18) checks.push({ label: t.payback, status: 'warning', message: t.paybackWarning })
    else checks.push({ label: t.payback, status: 'bad', message: t.paybackBad })
  }

  // Margem bruta: saudável >= 70%
  const margin = metrics.grossMargin
  if (margin >= 0.7) checks.push({ label: t.grossMargin, status: 'good', message: t.marginGood })
  else if (margin >= 0.5) checks.push({ label: t.grossMargin, status: 'warning', message: t.marginWarning })
  else checks.push({ label: t.grossMargin, status: 'bad', message: t.marginBad })

  // Churn: saudável <= 5% mensal
  const churn = metrics.churnRate
  if (churn <= 0.05) checks.push({ label: t.churn, status: 'good', message: t.churnGood })
  else if (churn <= 0.1) checks.push({ label: t.churn, status: 'warning', message: t.churnWarning })
  else checks.push({ label: t.churn, status: 'bad', message: t.churnBad })

  const score = checks.reduce((sum, c) => sum + (c.status === 'good' ? 1 : c.status === 'warning' ? 0.5 : 0), 0)
  const max = checks.length || 1

  return { checks, score, max, ratio: score / max }
}

export const PRESETS = {
  pt: [
    {
      name: 'SaaS B2B saudável',
      mrr: 120000,
      customers: 200,
      cac: 3000,
      grossMargin: 0.78,
      churn: 0.02,
      expansion: 0.01,
    },
    {
      name: 'SaaS B2C em escala',
      mrr: 50000,
      customers: 5000,
      cac: 45,
      grossMargin: 0.65,
      churn: 0.08,
      expansion: 0,
    },
    {
      name: 'Crescimento agressivo',
      mrr: 80000,
      customers: 400,
      cac: 5000,
      grossMargin: 0.72,
      churn: 0.04,
      expansion: 0.02,
    },
    {
      name: 'Self-serve estável',
      mrr: 40000,
      customers: 800,
      cac: 150,
      grossMargin: 0.82,
      churn: 0.045,
      expansion: 0.005,
    },
    {
      name: 'Mínimo',
      mrr: 10000,
      customers: 50,
      cac: 500,
      grossMargin: 0.8,
      churn: 0.05,
      expansion: 0,
    },
  ],
  en: [
    {
      name: 'Healthy B2B SaaS',
      mrr: 120000,
      customers: 200,
      cac: 3000,
      grossMargin: 0.78,
      churn: 0.02,
      expansion: 0.01,
    },
    {
      name: 'B2C SaaS at scale',
      mrr: 50000,
      customers: 5000,
      cac: 45,
      grossMargin: 0.65,
      churn: 0.08,
      expansion: 0,
    },
    {
      name: 'Aggressive growth',
      mrr: 80000,
      customers: 400,
      cac: 5000,
      grossMargin: 0.72,
      churn: 0.04,
      expansion: 0.02,
    },
    {
      name: 'Stable self-serve',
      mrr: 40000,
      customers: 800,
      cac: 150,
      grossMargin: 0.82,
      churn: 0.045,
      expansion: 0.005,
    },
    {
      name: 'Minimal',
      mrr: 10000,
      customers: 50,
      cac: 500,
      grossMargin: 0.8,
      churn: 0.05,
      expansion: 0,
    },
  ],
}

export function exportMarkdown(metrics, health, t) {
  if (!metrics) return ''
  const lines = [
    `## ${t.title}`,
    '',
    `| ${t.metric} | ${t.value} |`,
    `|---|---|`,
    `| ${t.mrr} | ${formatCurrency(metrics.mrr)} |`,
    `| ${t.customers} | ${metrics.customers.toLocaleString()} |`,
    `| ${t.cac} | ${formatCurrency(metrics.cac)} |`,
    `| ${t.grossMargin} | ${formatPercent(metrics.grossMargin)} |`,
    `| ${t.churn} | ${formatPercent(metrics.churnRate)} |`,
    `| ${t.expansion} | ${formatPercent(metrics.expansionRate)} |`,
    `| ${t.arpu} | ${formatCurrency(metrics.arpu)} |`,
    `| ${t.grossProfitPerCustomer} | ${formatCurrency(metrics.grossProfitPerCustomer)} |`,
    `| ${t.ltv} | ${metrics.ltv !== null ? formatCurrency(metrics.ltv) : '—'} |`,
    `| ${t.ltvCac} | ${metrics.ltvCac !== null ? metrics.ltvCac.toFixed(2) : '—'} |`,
    `| ${t.payback} | ${metrics.paybackMonths !== null ? formatMonths(metrics.paybackMonths) : '—'} |`,
    `| ${t.arr} | ${formatCurrency(metrics.arr)} |`,
    `| ${t.nrr} | ${formatPercent(metrics.nrr - 1)} |`,
  ]

  if (health) {
    lines.push('', `**${t.healthScore}:** ${Math.round((health.score / health.max) * 100)}%`)
  }

  return lines.join('\n')
}
