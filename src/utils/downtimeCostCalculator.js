// Motor 100% client-side para cálculo de custo de downtime.
// Converte receita anual em taxa por tempo, estima perdas de receita por
// usuários afetados, custo salarial da equipe durante o incidente e
// possíveis penalidades de SLA.

export const HOURS_PER_YEAR = 365 * 24
export const HOURS_PER_MONTH = 365 * 24 / 12

export function annualRevenueToHourlyRate(annualRevenue, uptimeRatio = 1) {
  if (annualRevenue == null || Number.isNaN(annualRevenue)) return null
  return (Number(annualRevenue) / HOURS_PER_YEAR) * Number(uptimeRatio || 1)
}

export function hourlyRateToRate(hourlyRate, unit) {
  if (hourlyRate == null || Number.isNaN(hourlyRate)) return null
  const rate = Number(hourlyRate)
  switch (unit) {
    case 'second':
      return rate / 3600
    case 'minute':
      return rate / 60
    case 'hour':
      return rate
    case 'day':
      return rate * 24
    case 'week':
      return rate * 24 * 7
    case 'month':
      return rate * HOURS_PER_MONTH
    case 'year':
      return rate * HOURS_PER_YEAR
    default:
      return rate
  }
}

export function durationToHours(value, unit) {
  if (value == null || Number.isNaN(value)) return null
  const v = Number(value)
  switch (unit) {
    case 'second':
      return v / 3600
    case 'minute':
      return v / 60
    case 'hour':
      return v
    case 'day':
      return v * 24
    case 'week':
      return v * 24 * 7
    default:
      return v
  }
}

export function formatCurrency(value, currency = 'USD', locale = 'en-US') {
  if (value == null || Number.isNaN(value)) return '—'
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatNumber(value, digits = 2) {
  if (value == null || Number.isNaN(value)) return '—'
  return Number(value).toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

export function calculateRevenueLoss({ annualRevenue, uptimeRatio, duration, durationUnit }) {
  const hours = durationToHours(duration, durationUnit)
  const hourlyRate = annualRevenueToHourlyRate(annualRevenue, uptimeRatio)
  if (hours == null || hourlyRate == null) return null
  return hours * hourlyRate
}

export function calculateUserLoss({ affectedUsers, averageOrderValue, conversionRate }) {
  const users = Number(affectedUsers)
  const aov = Number(averageOrderValue)
  const cr = Number(conversionRate)
  if (Number.isNaN(users) || Number.isNaN(aov) || Number.isNaN(cr)) return null
  return users * aov * (cr / 100)
}

export function calculateTeamCost({ engineers, hourlySalary, duration, durationUnit }) {
  const hours = durationToHours(duration, durationUnit)
  const n = Number(engineers)
  const sal = Number(hourlySalary)
  if (hours == null || Number.isNaN(n) || Number.isNaN(sal)) return null
  return n * sal * hours
}

export function calculateSlaPenalty({ monthlyRecurringRevenue, penaltyRate, exceededDuration, exceededUnit }) {
  const hours = durationToHours(exceededDuration, exceededUnit)
  const mrr = Number(monthlyRecurringRevenue)
  const rate = Number(penaltyRate)
  if (hours == null || Number.isNaN(mrr) || Number.isNaN(rate)) return null
  // Penalidade proporcional ao MRR mensal: MRR * taxa% * (horas_excedidas / horas_no_mês)
  return mrr * (rate / 100) * (hours / HOURS_PER_MONTH)
}

export function calculateDowntimeCost(params) {
  const revenueLoss = calculateRevenueLoss(params)
  const userLoss = calculateUserLoss(params)
  const teamCost = calculateTeamCost(params)
  const slaPenalty = calculateSlaPenalty(params)

  const parts = []
  if (revenueLoss != null) parts.push({ key: 'revenue', label: 'Receita direta', value: revenueLoss })
  if (userLoss != null) parts.push({ key: 'users', label: 'Pedidos perdidos', value: userLoss })
  if (teamCost != null) parts.push({ key: 'team', label: 'Custo da equipe', value: teamCost })
  if (slaPenalty != null) parts.push({ key: 'sla', label: 'Penalidade SLA', value: slaPenalty })

  const total = parts.reduce((sum, p) => sum + p.value, 0)

  return {
    total,
    revenueLoss,
    userLoss,
    teamCost,
    slaPenalty,
    parts,
  }
}

export const TIME_UNITS = [
  { key: 'second', labelPt: 'segundo', labelEn: 'second' },
  { key: 'minute', labelPt: 'minuto', labelEn: 'minute' },
  { key: 'hour', labelPt: 'hora', labelEn: 'hour' },
  { key: 'day', labelPt: 'dia', labelEn: 'day' },
  { key: 'week', labelPt: 'semana', labelEn: 'week' },
]

export const CURRENCIES = [
  { key: 'USD', label: 'USD ($)' },
  { key: 'EUR', label: 'EUR (€)' },
  { key: 'GBP', label: 'GBP (£)' },
  { key: 'BRL', label: 'BRL (R$)' },
]

export function makePresets(lang = 'pt') {
  const isPt = lang === 'pt'
  return [
    {
      name: isPt ? 'E-commerce médio' : 'Mid-size e-commerce',
      annualRevenue: 5000000,
      uptimeRatio: 1,
      affectedUsers: 12000,
      averageOrderValue: 80,
      conversionRate: 2.5,
      engineers: 6,
      hourlySalary: 75,
      monthlyRecurringRevenue: 0,
      penaltyRate: 0,
      exceededDuration: 0,
      duration: 2,
      durationUnit: 'hour',
    },
    {
      name: isPt ? 'SaaS B2B' : 'B2B SaaS',
      annualRevenue: 12000000,
      uptimeRatio: 1,
      affectedUsers: 2500,
      averageOrderValue: 500,
      conversionRate: 1.2,
      engineers: 8,
      hourlySalary: 90,
      monthlyRecurringRevenue: 1000000,
      penaltyRate: 5,
      exceededDuration: 1,
      duration: 1.5,
      durationUnit: 'hour',
    },
    {
      name: isPt ? 'Fintech / Pagamentos' : 'Fintech / Payments',
      annualRevenue: 50000000,
      uptimeRatio: 1,
      affectedUsers: 80000,
      averageOrderValue: 45,
      conversionRate: 6,
      engineers: 12,
      hourlySalary: 100,
      monthlyRecurringRevenue: 2000000,
      penaltyRate: 10,
      exceededDuration: 0.5,
      duration: 45,
      durationUnit: 'minute',
    },
    {
      name: isPt ? 'Streaming / Mídia' : 'Streaming / Media',
      annualRevenue: 80000000,
      uptimeRatio: 1,
      affectedUsers: 200000,
      averageOrderValue: 12,
      conversionRate: 0.8,
      engineers: 10,
      hourlySalary: 95,
      monthlyRecurringRevenue: 5000000,
      penaltyRate: 2,
      exceededDuration: 2,
      duration: 30,
      durationUnit: 'minute',
    },
    {
      name: isPt ? 'Site pequeno' : 'Small website',
      annualRevenue: 120000,
      uptimeRatio: 1,
      affectedUsers: 800,
      averageOrderValue: 30,
      conversionRate: 1.5,
      engineers: 2,
      hourlySalary: 35,
      monthlyRecurringRevenue: 0,
      penaltyRate: 0,
      exceededDuration: 0,
      duration: 4,
      durationUnit: 'hour',
    },
  ]
}

export function exportReport(params, result, currency, lang = 'pt') {
  const isPt = lang === 'pt'
  const fmt = (v) => formatCurrency(v, currency, lang === 'pt' ? 'pt-BR' : 'en-US')
  const lines = []
  lines.push(isPt ? '# Relatório de Custo de Downtime' : '# Downtime Cost Report')
  lines.push('')
  lines.push(`**${isPt ? 'Duração do incidente' : 'Incident duration'}:** ${params.duration} ${params.durationUnit}`)
  lines.push(`**${isPt ? 'Total estimado' : 'Estimated total'}:** ${fmt(result.total)}`)
  lines.push('')
  lines.push(isPt ? '## Detalhamento' : '## Breakdown')
  result.parts.forEach((p) => {
    lines.push(`- ${p.label}: ${fmt(p.value)}`)
  })
  lines.push('')
  lines.push(isPt ? '## Dados de entrada' : '## Input data')
  lines.push(`- ${isPt ? 'Receita anual' : 'Annual revenue'}: ${fmt(params.annualRevenue)}`)
  lines.push(`- ${isPt ? 'Usuários afetados' : 'Affected users'}: ${params.affectedUsers}`)
  lines.push(`- ${isPt ? 'Ticket médio' : 'Average order value'}: ${fmt(params.averageOrderValue)}`)
  lines.push(`- ${isPt ? 'Taxa de conversão' : 'Conversion rate'}: ${params.conversionRate}%`)
  lines.push(`- ${isPt ? 'Engenheiros envolvidos' : 'Engineers involved'}: ${params.engineers}`)
  lines.push(`- ${isPt ? 'Custo/hora engenheiro' : 'Engineer hourly cost'}: ${fmt(params.hourlySalary)}`)
  lines.push(`- ${isPt ? 'MRR' : 'MRR'}: ${fmt(params.monthlyRecurringRevenue)}`)
  lines.push(`- ${isPt ? 'Taxa de penalidade SLA' : 'SLA penalty rate'}: ${params.penaltyRate}%`)
  return lines.join('\n')
}
