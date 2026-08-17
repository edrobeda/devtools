// Motor 100% client-side para estimativa de custo de CI/CD.
// Calcula gastos mensais/anuais de runners/agentes de build a partir do
// tempo médio por build, frequência de commits/dias e custo por minuto.

export const PROVIDERS = [
  {
    key: 'github-actions',
    namePt: 'GitHub Actions (público)',
    nameEn: 'GitHub Actions (public)',
    costPerMinute: 0.008,
    currency: 'USD',
  },
  {
    key: 'github-actions-windows',
    namePt: 'GitHub Actions (Windows)',
    nameEn: 'GitHub Actions (Windows)',
    costPerMinute: 0.016,
    currency: 'USD',
  },
  {
    key: 'github-actions-macos',
    namePt: 'GitHub Actions (macOS)',
    nameEn: 'GitHub Actions (macOS)',
    costPerMinute: 0.032,
    currency: 'USD',
  },
  {
    key: 'gitlab-ci',
    namePt: 'GitLab CI/CD (1.000 min grátis, depois pago)',
    nameEn: 'GitLab CI/CD (1,000 free mins, then paid)',
    costPerMinute: 0.01,
    currency: 'USD',
  },
  {
    key: 'circleci',
    namePt: 'CircleCI',
    nameEn: 'CircleCI',
    costPerMinute: 0.015,
    currency: 'USD',
  },
  {
    key: 'travis-ci',
    namePt: 'Travis CI',
    nameEn: 'Travis CI',
    costPerMinute: 0.018,
    currency: 'USD',
  },
  {
    key: 'azure-pipelines',
    namePt: 'Azure Pipelines (Microsoft-hosted)',
    nameEn: 'Azure Pipelines (Microsoft-hosted)',
    costPerMinute: 0.012,
    currency: 'USD',
  },
  {
    key: 'bitbucket-pipelines',
    namePt: 'Bitbucket Pipelines',
    nameEn: 'Bitbucket Pipelines',
    costPerMinute: 0.014,
    currency: 'USD',
  },
  {
    key: 'aws-codebuild',
    namePt: 'AWS CodeBuild (build.general1.small)',
    nameEn: 'AWS CodeBuild (build.general1.small)',
    costPerMinute: 0.005,
    currency: 'USD',
  },
  {
    key: 'custom',
    namePt: 'Customizado',
    nameEn: 'Custom',
    costPerMinute: 0.01,
    currency: 'USD',
  },
]

export const CURRENCIES = [
  { key: 'USD', label: 'USD ($)' },
  { key: 'EUR', label: 'EUR (€)' },
  { key: 'GBP', label: 'GBP (£)' },
  { key: 'BRL', label: 'BRL (R$)' },
]

export function providerByKey(key) {
  return PROVIDERS.find((p) => p.key === key) || PROVIDERS[0]
}

export function formatCurrency(value, currency = 'USD', locale = 'en-US') {
  if (value == null || Number.isNaN(value)) return '—'
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatNumber(value, digits = 0) {
  if (value == null || Number.isNaN(value)) return '—'
  return Number(value).toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

export function calculateCiCdCost({
  minutesPerBuild = 0,
  buildsPerDay = 0,
  workdaysPerMonth = 22,
  concurrentRunners = 1,
  costPerMinute = 0.01,
  overheadPercent = 0,
}) {
  const mpb = Number(minutesPerBuild) || 0
  const bpd = Number(buildsPerDay) || 0
  const wdpm = Number(workdaysPerMonth) || 0
  const runners = Math.max(1, Number(concurrentRunners) || 1)
  const cpm = Number(costPerMinute) || 0
  const overhead = Number(overheadPercent) || 0

  const baseMonthlyMinutes = mpb * bpd * wdpm
  const overheadMinutes = baseMonthlyMinutes * (overhead / 100)
  const monthlyMinutes = baseMonthlyMinutes + overheadMinutes
  const monthlyHours = monthlyMinutes / 60
  const monthlyCost = monthlyMinutes * cpm
  const annualCost = monthlyCost * 12
  const totalBuildsPerMonth = bpd * wdpm
  const costPerBuild = totalBuildsPerMonth > 0 ? monthlyCost / totalBuildsPerMonth : 0
  const costPerCommit = costPerBuild

  // Utilização média por runner: minutos que cada runner processa por mês
  // se a carga fosse dividida igualmente (número inteiro mínimo 1 runner).
  const runnerUtilization = runners > 0 ? monthlyMinutes / runners : 0

  // Custo equivalente de VM auto-hospedada: estimativa conservadora de
  // $0.002/min (~$0.12/hora) para comparação com runners gerenciados.
  const selfHostedCostPerMinute = 0.002
  const equivalentSelfHostedCost = monthlyMinutes * selfHostedCostPerMinute

  return {
    baseMonthlyMinutes,
    overheadMinutes,
    monthlyMinutes,
    monthlyHours,
    monthlyCost,
    annualCost,
    totalBuildsPerMonth,
    costPerBuild,
    costPerCommit,
    runnerUtilization,
    equivalentSelfHostedCost,
  }
}

export function makePresets(lang = 'pt') {
  const isPt = lang === 'pt'
  return [
    {
      name: isPt ? 'Startup enxuta' : 'Lean startup',
      provider: 'github-actions',
      minutesPerBuild: 4,
      buildsPerDay: 8,
      workdaysPerMonth: 22,
      concurrentRunners: 1,
      overheadPercent: 10,
    },
    {
      name: isPt ? 'Equipe média' : 'Mid-size team',
      provider: 'github-actions',
      minutesPerBuild: 8,
      buildsPerDay: 25,
      workdaysPerMonth: 22,
      concurrentRunners: 2,
      overheadPercent: 15,
    },
    {
      name: isPt ? 'Monorepo grande' : 'Large monorepo',
      provider: 'github-actions',
      minutesPerBuild: 18,
      buildsPerDay: 40,
      workdaysPerMonth: 22,
      concurrentRunners: 4,
      overheadPercent: 20,
    },
    {
      name: isPt ? 'Deploy contínuo' : 'Continuous deployment',
      provider: 'gitlab-ci',
      minutesPerBuild: 6,
      buildsPerDay: 60,
      workdaysPerMonth: 22,
      concurrentRunners: 3,
      overheadPercent: 15,
    },
    {
      name: isPt ? 'Build mobile (macOS)' : 'Mobile build (macOS)',
      provider: 'github-actions-macos',
      minutesPerBuild: 25,
      buildsPerDay: 12,
      workdaysPerMonth: 22,
      concurrentRunners: 2,
      overheadPercent: 10,
    },
  ]
}

export function exportReport(params, result, currency, lang = 'pt') {
  const isPt = lang === 'pt'
  const fmt = (v) => formatCurrency(v, currency, lang === 'pt' ? 'pt-BR' : 'en-US')
  const fmtN = (v) => formatNumber(v, 0)
  const provider = providerByKey(params.provider)
  const providerName = isPt ? provider.namePt : provider.nameEn

  const lines = []
  lines.push(isPt ? '# Relatório de Custo de CI/CD' : '# CI/CD Cost Report')
  lines.push('')
  lines.push(`**${isPt ? 'Provedor' : 'Provider'}:** ${providerName}`)
  lines.push(`**${isPt ? 'Custo por minuto' : 'Cost per minute'}:** ${fmt(params.costPerMinute)}`)
  lines.push('')
  lines.push(`**${isPt ? 'Total mensal' : 'Monthly total'}:** ${fmt(result.monthlyCost)}`)
  lines.push(`**${isPt ? 'Total anual' : 'Annual total'}:** ${fmt(result.annualCost)}`)
  lines.push(`**${isPt ? 'Custo por build' : 'Cost per build'}:** ${fmt(result.costPerBuild)}`)
  lines.push('')
  lines.push(isPt ? '## Detalhamento' : '## Breakdown')
  lines.push(`- ${isPt ? 'Minutos por build' : 'Minutes per build'}: ${params.minutesPerBuild}`)
  lines.push(`- ${isPt ? 'Builds por dia' : 'Builds per day'}: ${params.buildsPerDay}`)
  lines.push(`- ${isPt ? 'Dias úteis por mês' : 'Workdays per month'}: ${params.workdaysPerMonth}`)
  lines.push(`- ${isPt ? 'Runners concorrentes' : 'Concurrent runners'}: ${params.concurrentRunners}`)
  lines.push(`- ${isPt ? 'Overhead' : 'Overhead'}: ${params.overheadPercent}%`)
  lines.push(`- ${isPt ? 'Minutos base/mês' : 'Base minutes/month'}: ${fmtN(result.baseMonthlyMinutes)}`)
  lines.push(`- ${isPt ? 'Minutos de overhead/mês' : 'Overhead minutes/month'}: ${fmtN(result.overheadMinutes)}`)
  lines.push(`- ${isPt ? 'Minutos totais/mês' : 'Total minutes/month'}: ${fmtN(result.monthlyMinutes)}`)
  lines.push(`- ${isPt ? 'Horas/mês' : 'Hours/month'}: ${formatNumber(result.monthlyHours, 1)}`)
  lines.push('')
  lines.push(isPt ? '*Valores aproximados para comparação; preços reais podem variar por plano, região e cota.*' : '*Approximate values for comparison; actual prices may vary by plan, region and quota.*')
  return lines.join('\n')
}
