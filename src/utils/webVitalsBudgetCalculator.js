/**
 * Calculadora de Orçamento de Web Vitals — 100% client-side.
 *
 * Recebe as métricas medidas de uma página (LCP, INP, CLS, TTFB, FCP, TTI,
 * FID), compara com os thresholds oficiais do Core Web Vitals e com budgets
 * customizáveis, e devolve uma nota geral, classificação por métrica e o
 * quanto cada uma precisa melhorar para atingir o próximo tier.
 */

export const METRICS = [
  {
    key: 'lcp',
    unit: 's',
    internalUnit: 'ms',
    multiplier: 1000,
    good: 2500,
    poor: 4000,
    weight: 0.25,
  },
  {
    key: 'inp',
    unit: 'ms',
    internalUnit: 'ms',
    multiplier: 1,
    good: 200,
    poor: 500,
    weight: 0.25,
  },
  {
    key: 'cls',
    unit: 'score',
    internalUnit: 'score',
    multiplier: 1,
    good: 0.1,
    poor: 0.25,
    weight: 0.2,
  },
  {
    key: 'ttfb',
    unit: 'ms',
    internalUnit: 'ms',
    multiplier: 1,
    good: 800,
    poor: 1800,
    weight: 0.1,
  },
  {
    key: 'fcp',
    unit: 's',
    internalUnit: 'ms',
    multiplier: 1000,
    good: 1800,
    poor: 3000,
    weight: 0.1,
  },
  {
    key: 'tti',
    unit: 's',
    internalUnit: 'ms',
    multiplier: 1000,
    good: 3800,
    poor: 7300,
    weight: 0.05,
  },
  {
    key: 'fid',
    unit: 'ms',
    internalUnit: 'ms',
    multiplier: 1,
    good: 100,
    poor: 300,
    weight: 0.05,
  },
]

export function formatNumber(value, digits = 2) {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—'
  return value.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

function toInternalValue(metricKey, value) {
  const m = METRICS.find((x) => x.key === metricKey)
  if (!m) return value
  return (value ?? null) === null ? null : value * m.multiplier
}

function classify(value, good, poor) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return { tier: 'missing', ratio: null }
  }
  if (value <= good) return { tier: 'good', ratio: value / good }
  if (value <= poor) return { tier: 'needs-improvement', ratio: value / poor }
  return { tier: 'poor', ratio: value / poor }
}

function tierScore(tier) {
  if (tier === 'good') return 100
  if (tier === 'needs-improvement') return 60
  if (tier === 'poor') return 25
  return 0
}

function improvementToGood(value, good, poor, unit) {
  if (value === null || value === undefined || !Number.isFinite(value)) return null
  if (value <= good) return 0
  const diff = value - good
  if (unit === 'ms') return Math.ceil(diff)
  if (unit === 's') return Math.ceil(diff / 100) / 10
  if (unit === 'score') return Math.ceil(diff * 1000) / 1000
  return diff
}

function formatImprovement(value, unit) {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—'
  if (unit === 'ms') return `${formatNumber(value, 0)} ms`
  if (unit === 's') return `${formatNumber(value, 2)} s`
  if (unit === 'score') return `${formatNumber(value, 3)}`
  return formatNumber(value, 2)
}

export function calculateWebVitalsBudget(inputs, customBudgets = {}) {
  const resultByMetric = METRICS.map((m) => {
    const raw = inputs[m.key]
    const value = toInternalValue(m.key, raw)
    const budget =
      customBudgets[m.key] !== undefined && customBudgets[m.key] !== null
        ? toInternalValue(m.key, customBudgets[m.key])
        : null
    const good = budget !== null ? budget : m.good
    const poor = budget !== null ? budget * 1.6 : m.poor
    const classification = classify(value, good, poor)
    const score = tierScore(classification.tier)
    const improvement = improvementToGood(value, good, poor, m.internalUnit)

    return {
      key: m.key,
      unit: m.unit,
      internalUnit: m.internalUnit,
      multiplier: m.multiplier,
      rawValue: raw ?? null,
      value,
      good,
      poor,
      budget,
      tier: classification.tier,
      ratio: classification.ratio,
      score,
      improvement,
      weight: m.weight,
    }
  })

  const present = resultByMetric.filter((r) => r.tier !== 'missing')
  const totalWeight = present.reduce((sum, r) => sum + r.weight, 0)
  const overallScore =
    totalWeight > 0
      ? present.reduce((sum, r) => sum + r.score * r.weight, 0) / totalWeight
      : 0

  let overallTier = 'poor'
  if (overallScore >= 90) overallTier = 'good'
  else if (overallScore >= 70) overallTier = 'needs-improvement'

  const presentCount = present.length
  const goodCount = present.filter((r) => r.tier === 'good').length
  const poorCount = present.filter((r) => r.tier === 'poor').length

  return {
    metrics: resultByMetric,
    overallScore,
    overallTier,
    presentCount,
    goodCount,
    poorCount,
  }
}

export function getMetricMeta(lang = 'pt') {
  const labels = {
    pt: {
      lcp: 'LCP',
      inp: 'INP',
      cls: 'CLS',
      ttfb: 'TTFB',
      fcp: 'FCP',
      tti: 'TTI',
      fid: 'FID',
      lcpDesc: 'Largest Contentful Paint',
      inpDesc: 'Interaction to Next Paint',
      clsDesc: 'Cumulative Layout Shift',
      ttfbDesc: 'Time to First Byte',
      fcpDesc: 'First Contentful Paint',
      ttiDesc: 'Time to Interactive',
      fidDesc: 'First Input Delay',
    },
    en: {
      lcp: 'LCP',
      inp: 'INP',
      cls: 'CLS',
      ttfb: 'TTFB',
      fcp: 'FCP',
      tti: 'TTI',
      fid: 'FID',
      lcpDesc: 'Largest Contentful Paint',
      inpDesc: 'Interaction to Next Paint',
      clsDesc: 'Cumulative Layout Shift',
      ttfbDesc: 'Time to First Byte',
      fcpDesc: 'First Contentful Paint',
      ttiDesc: 'Time to Interactive',
      fidDesc: 'First Input Delay',
    },
  }
  return labels[lang]
}

export function getPresets(lang = 'pt') {
  const data = [
    {
      key: 'landing-good',
      pt: { label: 'Landing page saudável', desc: 'Métricas rápidas, todas no tier good' },
      en: { label: 'Healthy landing page', desc: 'Fast metrics, all in the good tier' },
      inputs: { lcp: 1.8, inp: 120, cls: 0.05, ttfb: 400, fcp: 1.2, tti: 2.5, fid: 20 },
      budgets: {},
    },
    {
      key: 'ecommerce-mixed',
      pt: { label: 'E-commerce médio', desc: 'LCP e INP no limite; CLS precisa de atenção' },
      en: { label: 'Average e-commerce', desc: 'LCP and INP on the edge; CLS needs attention' },
      inputs: { lcp: 3.2, inp: 280, cls: 0.18, ttfb: 900, fcp: 2.0, tti: 5.5, fid: 80 },
      budgets: {},
    },
    {
      key: 'saas-heavy',
      pt: { label: 'SaaS dashboard pesado', desc: 'JS pesado deixa INP e TTI altos' },
      en: { label: 'Heavy SaaS dashboard', desc: 'Heavy JS pushes INP and TTI up' },
      inputs: { lcp: 2.8, inp: 520, cls: 0.12, ttfb: 700, fcp: 1.6, tti: 9.2, fid: 150 },
      budgets: {},
    },
    {
      key: 'blog-light',
      pt: { label: 'Blog leve', desc: 'Página estática com pouco JS' },
      en: { label: 'Light blog', desc: 'Static page with little JavaScript' },
      inputs: { lcp: 1.2, inp: 80, cls: 0.02, ttfb: 250, fcp: 0.8, tti: 1.8, fid: 15 },
      budgets: {},
    },
    {
      key: 'mobile-3g',
      pt: { label: 'Mobile 3G', desc: 'Conexão lenta mostra gargalo de rede' },
      en: { label: 'Mobile 3G', desc: 'Slow connection exposes network bottleneck' },
      inputs: { lcp: 5.5, inp: 320, cls: 0.08, ttfb: 1600, fcp: 3.5, tti: 11.0, fid: 90 },
      budgets: {},
    },
  ]

  return data.map((item) => ({
    key: item.key,
    label: item[lang].label,
    desc: item[lang].desc,
    inputs: item.inputs,
    budgets: item.budgets,
  }))
}

export function buildReport(result, lang = 'pt') {
  const t = {
    pt: {
      title: 'Relatório de Orçamento de Web Vitals',
      summary: 'Resumo',
      overallScore: 'Pontuação geral',
      overallTier: 'Classificação geral',
      metric: 'Métrica',
      value: 'Valor',
      budget: 'Budget customizado',
      tier: 'Classificação',
      improvement: 'Melhoria necessária para "good"',
      good: 'Bom',
      needsImprovement: 'Precisa melhorar',
      poor: 'Ruim',
      missing: 'Não informado',
      tiers: {
        good: 'Bom',
        'needs-improvement': 'Precisa melhorar',
        poor: 'Ruim',
        missing: 'Não informado',
      },
      notes: 'Notas',
      notesText:
        'Os thresholds seguem as diretrizes do Core Web Vitals do Google. Valores acima de "poor" devem ser tratados como prioridade.',
    },
    en: {
      title: 'Web Vitals Budget Report',
      summary: 'Summary',
      overallScore: 'Overall score',
      overallTier: 'Overall tier',
      metric: 'Metric',
      value: 'Value',
      budget: 'Custom budget',
      tier: 'Tier',
      improvement: 'Improvement needed to "good"',
      good: 'Good',
      needsImprovement: 'Needs improvement',
      poor: 'Poor',
      missing: 'Not provided',
      tiers: {
        good: 'Good',
        'needs-improvement': 'Needs improvement',
        poor: 'Poor',
        missing: 'Not provided',
      },
      notes: 'Notes',
      notesText:
        'Thresholds follow Google Core Web Vitals guidelines. Values above the "poor" threshold should be treated as high priority.',
    },
  }[lang]

  const formatValue = (r) => {
    if (r.rawValue === null || r.rawValue === undefined) return '—'
    if (r.unit === 'score') return formatNumber(r.rawValue, 3)
    if (r.unit === 's') return `${formatNumber(r.rawValue, 2)} s`
    return `${formatNumber(r.rawValue, 0)} ms`
  }

  const formatBudget = (r) => {
    if (r.budget === null) return '—'
    if (r.unit === 'score') return formatNumber(r.budget, 3)
    if (r.unit === 's') return `${formatNumber(r.budget / 1000, 2)} s`
    return `${formatNumber(r.budget, 0)} ms`
  }

  const lines = [
    `# ${t.title}`,
    '',
    `## ${t.summary}`,
    '',
    `- ${t.overallScore}: ${formatNumber(result.overallScore, 1)}/100`,
    `- ${t.overallTier}: ${t.tiers[result.overallTier] || result.overallTier}`,
    '',
    `| ${t.metric} | ${t.value} | ${t.budget} | ${t.tier} | ${t.improvement} |`,
    '| --- | --- | --- | --- | --- |',
  ]

  result.metrics.forEach((r) => {
    lines.push(
      `| ${r.key.toUpperCase()} | ${formatValue(r)} | ${formatBudget(r)} | ${t.tiers[r.tier]} | ${formatImprovement(r.improvement, r.internalUnit)} |`
    )
  })

  lines.push(
    '',
    `## ${t.notes}`,
    '',
    t.notesText
  )

  return lines.join('\n')
}
