/**
 * Motor de cálculo PERT (Program Evaluation and Review Technique).
 * Todas as operações são puras e 100% client-side.
 *
 * Fórmulas:
 *   PERT        = (O + 4M + P) / 6
 *   StdDev      = (P - O) / 6
 *   Variance    = StdDev²
 *   CI          = PERT ± Z × StdDev
 */

export const CONFIDENCE_LEVELS = [
  { key: '68', label: '68%', z: 1.0 },
  { key: '90', label: '90%', z: 1.645 },
  { key: '95', label: '95%', z: 1.96 },
  { key: '99', label: '99%', z: 2.576 },
]

export const TIME_UNITS = [
  { key: 'hours', labelPt: 'horas', labelEn: 'hours', factor: 1 },
  { key: 'days', labelPt: 'dias', labelEn: 'days', factor: 8 },
  { key: 'weeks', labelPt: 'semanas', labelEn: 'weeks', factor: 40 },
]

function toNumber(value) {
  if (value === null || value === undefined || value === '') return null
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : null
}

export function calculateTask(optimistic, mostLikely, pessimistic) {
  const o = toNumber(optimistic)
  const m = toNumber(mostLikely)
  const p = toNumber(pessimistic)

  if (o === null || m === null || p === null) {
    return { pert: null, stdDev: null, variance: null, valid: false }
  }

  const min = Math.min(o, m, p)
  const max = Math.max(o, m, p)
  const pert = (o + 4 * m + p) / 6
  const stdDev = (p - o) / 6
  const variance = stdDev * stdDev

  return {
    pert,
    stdDev,
    variance,
    min,
    max,
    valid: true,
    inputs: { o, m, p },
  }
}

export function calculateSummary(tasks) {
  const results = tasks.map((t) =>
    calculateTask(t.optimistic, t.mostLikely, t.pessimistic)
  )

  const validResults = results.filter((r) => r.valid)

  if (validResults.length === 0) {
    return {
      taskResults: results,
      totalPert: null,
      totalVariance: null,
      totalStdDev: null,
      count: tasks.length,
      validCount: 0,
    }
  }

  const totalPert = validResults.reduce((sum, r) => sum + r.pert, 0)
  const totalVariance = validResults.reduce((sum, r) => sum + r.variance, 0)
  const totalStdDev = Math.sqrt(totalVariance)

  return {
    taskResults: results,
    totalPert,
    totalVariance,
    totalStdDev,
    count: tasks.length,
    validCount: validResults.length,
  }
}

export function confidenceInterval(mean, stdDev, z) {
  if (mean === null || stdDev === null || z === null || z === undefined) {
    return { lower: null, upper: null }
  }
  const margin = z * stdDev
  return { lower: mean - margin, upper: mean + margin }
}

export function probabilityOfCompletion(mean, stdDev, target) {
  if (mean === null || stdDev === null || target === null || stdDev <= 0) {
    return null
  }
  // Aproximação polinomial para a CDF da normal padrão (Abramowitz & Stegun)
  const z = (target - mean) / stdDev
  const b1 = 0.31938153
  const b2 = -0.356563782
  const b3 = 1.781477937
  const b4 = -1.821255978
  const b5 = 1.330274429
  const p = 0.2316419
  const c = Math.abs(z) >= 0 ? 1 : -1

  const t = 1 / (1 + p * Math.abs(z))
  const phi =
    1 -
    Math.exp((-z * z) / 2) / Math.sqrt(2 * Math.PI) *
      (b1 * t + b2 * t ** 2 + b3 * t ** 3 + b4 * t ** 4 + b5 * t ** 5)

  return Math.min(1, Math.max(0, z >= 0 ? phi : 1 - phi))
}

export function convertTime(value, fromUnitKey, toUnitKey) {
  if (value === null || value === undefined) return null
  const fromFactor = TIME_UNITS.find((u) => u.key === fromUnitKey)?.factor ?? 1
  const toFactor = TIME_UNITS.find((u) => u.key === toUnitKey)?.factor ?? 1
  return (value * fromFactor) / toFactor
}

export function formatNumber(value, decimals = 2) {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—'
  return value.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

export function makeTask(name = '', optimistic = '', mostLikely = '', pessimistic = '') {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    name,
    optimistic,
    mostLikely,
    pessimistic,
  }
}

export const PRESETS = {
  pt: [
    {
      name: 'Projeto web simples',
      tasks: [
        { name: 'Setup e arquitetura', optimistic: 4, mostLikely: 8, pessimistic: 16 },
        { name: 'UI / componentes', optimistic: 16, mostLikely: 24, pessimistic: 40 },
        { name: 'Integração de API', optimistic: 8, mostLikely: 16, pessimistic: 32 },
        { name: 'Testes e ajustes', optimistic: 8, mostLikely: 12, pessimistic: 24 },
      ],
    },
    {
      name: 'Sprint de 2 semanas',
      tasks: [
        { name: 'Análise técnica', optimistic: 2, mostLikely: 4, pessimistic: 8 },
        { name: 'Desenvolvimento feature A', optimistic: 8, mostLikely: 16, pessimistic: 28 },
        { name: 'Desenvolvimento feature B', optimistic: 6, mostLikely: 12, pessimistic: 20 },
        { name: 'Code review e fixes', optimistic: 2, mostLikely: 4, pessimistic: 8 },
        { name: 'QA e homologação', optimistic: 2, mostLikely: 6, pessimistic: 12 },
      ],
    },
    {
      name: 'Release mobile',
      tasks: [
        { name: 'Refinamento de escopo', optimistic: 4, mostLikely: 8, pessimistic: 16 },
        { name: 'Implementação iOS', optimistic: 24, mostLikely: 40, pessimistic: 64 },
        { name: 'Implementação Android', optimistic: 24, mostLikely: 40, pessimistic: 64 },
        { name: 'Backend de suporte', optimistic: 12, mostLikely: 20, pessimistic: 36 },
        { name: 'Testes beta', optimistic: 8, mostLikely: 16, pessimistic: 28 },
      ],
    },
  ],
  en: [
    {
      name: 'Simple web project',
      tasks: [
        { name: 'Setup and architecture', optimistic: 4, mostLikely: 8, pessimistic: 16 },
        { name: 'UI / components', optimistic: 16, mostLikely: 24, pessimistic: 40 },
        { name: 'API integration', optimistic: 8, mostLikely: 16, pessimistic: 32 },
        { name: 'Testing and fixes', optimistic: 8, mostLikely: 12, pessimistic: 24 },
      ],
    },
    {
      name: 'Two-week sprint',
      tasks: [
        { name: 'Technical analysis', optimistic: 2, mostLikely: 4, pessimistic: 8 },
        { name: 'Feature A development', optimistic: 8, mostLikely: 16, pessimistic: 28 },
        { name: 'Feature B development', optimistic: 6, mostLikely: 12, pessimistic: 20 },
        { name: 'Code review and fixes', optimistic: 2, mostLikely: 4, pessimistic: 8 },
        { name: 'QA and staging', optimistic: 2, mostLikely: 6, pessimistic: 12 },
      ],
    },
    {
      name: 'Mobile release',
      tasks: [
        { name: 'Scope refinement', optimistic: 4, mostLikely: 8, pessimistic: 16 },
        { name: 'iOS implementation', optimistic: 24, mostLikely: 40, pessimistic: 64 },
        { name: 'Android implementation', optimistic: 24, mostLikely: 40, pessimistic: 64 },
        { name: 'Support backend', optimistic: 12, mostLikely: 20, pessimistic: 36 },
        { name: 'Beta testing', optimistic: 8, mostLikely: 16, pessimistic: 28 },
      ],
    },
  ],
}

export function exportMarkdown(tasks, summary, unitLabel, confidence, t) {
  const header = [
    `| ${t.taskCol} | ${t.optimisticCol} | ${t.mostLikelyCol} | ${t.pessimisticCol} | ${t.pertCol} | ${t.stdDevCol} | ${t.varianceCol} |`,
    `|---|---|---|---|---|---|---|`,
  ]

  const rows = tasks.map((task, i) => {
    const r = summary.taskResults[i]
    if (!r.valid) {
      return `| ${task.name || '-'} | — | — | — | — | — | — |`
    }
    return `| ${task.name || '-'} | ${formatNumber(task.optimistic)} | ${formatNumber(task.mostLikely)} | ${formatNumber(task.pessimistic)} | ${formatNumber(r.pert)} | ${formatNumber(r.stdDev)} | ${formatNumber(r.variance)} |`
  })

  const total = summary.validCount > 0
    ? [
        '',
        `**${t.totalPert}:** ${formatNumber(summary.totalPert)} ${unitLabel}`,
        `**${t.totalStdDev}:** ${formatNumber(summary.totalStdDev)} ${unitLabel}`,
        `**${t.totalVariance}:** ${formatNumber(summary.totalVariance)} ${unitLabel}²`,
        '',
        `**${t.confidenceInterval} (${confidence.label}):** ${formatNumber(confidence.lower)} — ${formatNumber(confidence.upper)} ${unitLabel}`,
      ]
    : []

  return header.concat(rows).concat(total).join('\n')
}
