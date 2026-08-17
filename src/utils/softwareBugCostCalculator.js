/**
 * Motor de cálculo de custo de bug/defeito de software.
 * 100% client-side — nenhum dado sai do navegador.
 *
 * Referência de multiplicadores por fase (ordem de grandeza usada no mercado,
 * baseada em estudos clássicos como IBM System Sciences Institute):
 *   desenvolvimento: 1x
 *   testes/QA:        5x
 *   homologação:      10x
 *   produção:        100x
 *
 * O custo direto é a soma das horas de cada atividade × custo/hora do time.
 * O custo ajustado aplica o multiplicador da fase de descoberta.
 * O custo indireto inclui perda de produtividade, suporte e impacto de negócio.
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

export const PHASES = [
  { key: 'development', multiplier: 1, labelPt: 'Desenvolvimento', labelEn: 'Development' },
  { key: 'testing', multiplier: 5, labelPt: 'Testes / QA', labelEn: 'Testing / QA' },
  { key: 'staging', multiplier: 10, labelPt: 'Homologação', labelEn: 'Staging' },
  { key: 'production', multiplier: 100, labelPt: 'Produção', labelEn: 'Production' },
]

export const ACTIVITIES = [
  { key: 'detection', labelPt: 'Detecção / identificação', labelEn: 'Detection / identification' },
  { key: 'report', labelPt: 'Report / triagem', labelEn: 'Report / triage' },
  { key: 'fix', labelPt: 'Correção', labelEn: 'Fix' },
  { key: 'testing', labelPt: 'Testes / QA', labelEn: 'Testing / QA' },
  { key: 'deploy', labelPt: 'Deploy / liberação', labelEn: 'Deploy / release' },
  { key: 'support', labelPt: 'Suporte pós-produção', labelEn: 'Post-production support' },
]

export function calculateBugCost(input) {
  const monthlySalary = toNumber(input.monthlySalary)
  const hoursPerMonth = toNumber(input.hoursPerMonth)
  const teamSize = toNumber(input.teamSize)
  const indirectCost = toNumber(input.indirectCost) ?? 0
  const affectedCustomers = toNumber(input.affectedCustomers) ?? 0
  const revenueLossPerCustomer = toNumber(input.revenueLossPerCustomer) ?? 0

  const phase = PHASES.find((p) => p.key === input.phase) ?? PHASES[0]

  const hours = {}
  let totalHours = 0
  for (const act of ACTIVITIES) {
    const h = toNumber(input.hours[act.key]) ?? 0
    hours[act.key] = Math.max(0, h)
    totalHours += hours[act.key]
  }

  if (
    monthlySalary === null ||
    hoursPerMonth === null ||
    teamSize === null ||
    monthlySalary < 0 ||
    hoursPerMonth <= 0 ||
    teamSize <= 0
  ) {
    return null
  }

  const hourlyRate = monthlySalary / hoursPerMonth
  const teamHourlyRate = hourlyRate * teamSize
  const directCost = totalHours * teamHourlyRate
  const adjustedDirectCost = directCost * phase.multiplier
  const businessImpact = affectedCustomers * revenueLossPerCustomer
  const totalIndirect = Math.max(0, indirectCost + businessImpact)
  const totalCost = adjustedDirectCost + totalIndirect

  const activityCosts = {}
  for (const act of ACTIVITIES) {
    activityCosts[act.key] = hours[act.key] * teamHourlyRate
  }

  // Se o mesmo bug tivesse sido detectado em desenvolvimento, quanto teria custado?
  const hypotheticalDevCost = directCost + totalIndirect
  const savingsIfDetectedEarlier = Math.max(0, totalCost - hypotheticalDevCost)

  return {
    monthlySalary,
    hoursPerMonth,
    teamSize,
    hourlyRate,
    teamHourlyRate,
    hours,
    totalHours,
    directCost,
    phase,
    phaseMultiplier: phase.multiplier,
    adjustedDirectCost,
    indirectCost: totalIndirect,
    businessImpact,
    totalCost,
    activityCosts,
    hypotheticalDevCost,
    savingsIfDetectedEarlier,
  }
}

export function formatHours(value, t) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  const rounded = Math.round(value * 10) / 10
  if (!t) return `${rounded} h`
  return `${rounded} ${t.hourSuffix}`
}

export const PRESETS = {
  pt: [
    {
      name: 'Bug crítico em produção',
      monthlySalary: 15000,
      hoursPerMonth: 168,
      teamSize: 3,
      phase: 'production',
      hours: { detection: 4, report: 2, fix: 8, testing: 4, deploy: 2, support: 12 },
      indirectCost: 5000,
      affectedCustomers: 200,
      revenueLossPerCustomer: 15,
    },
    {
      name: 'Bug médio encontrado em QA',
      monthlySalary: 12000,
      hoursPerMonth: 168,
      teamSize: 2,
      phase: 'testing',
      hours: { detection: 1, report: 0.5, fix: 3, testing: 2, deploy: 0.5, support: 0 },
      indirectCost: 0,
      affectedCustomers: 0,
      revenueLossPerCustomer: 0,
    },
    {
      name: 'Bug pequeno no desenvolvimento',
      monthlySalary: 12000,
      hoursPerMonth: 168,
      teamSize: 1,
      phase: 'development',
      hours: { detection: 0.25, report: 0, fix: 1, testing: 0.5, deploy: 0, support: 0 },
      indirectCost: 0,
      affectedCustomers: 0,
      revenueLossPerCustomer: 0,
    },
    {
      name: 'Regressão custosa em homologação',
      monthlySalary: 14000,
      hoursPerMonth: 168,
      teamSize: 2,
      phase: 'staging',
      hours: { detection: 2, report: 1, fix: 6, testing: 4, deploy: 1, support: 0 },
      indirectCost: 1000,
      affectedCustomers: 0,
      revenueLossPerCustomer: 0,
    },
    {
      name: 'Incidente de segurança em produção',
      monthlySalary: 18000,
      hoursPerMonth: 168,
      teamSize: 4,
      phase: 'production',
      hours: { detection: 6, report: 4, fix: 16, testing: 8, deploy: 4, support: 20 },
      indirectCost: 15000,
      affectedCustomers: 500,
      revenueLossPerCustomer: 10,
    },
  ],
  en: [
    {
      name: 'Critical production bug',
      monthlySalary: 15000,
      hoursPerMonth: 168,
      teamSize: 3,
      phase: 'production',
      hours: { detection: 4, report: 2, fix: 8, testing: 4, deploy: 2, support: 12 },
      indirectCost: 5000,
      affectedCustomers: 200,
      revenueLossPerCustomer: 15,
    },
    {
      name: 'Medium bug found in QA',
      monthlySalary: 12000,
      hoursPerMonth: 168,
      teamSize: 2,
      phase: 'testing',
      hours: { detection: 1, report: 0.5, fix: 3, testing: 2, deploy: 0.5, support: 0 },
      indirectCost: 0,
      affectedCustomers: 0,
      revenueLossPerCustomer: 0,
    },
    {
      name: 'Small development bug',
      monthlySalary: 12000,
      hoursPerMonth: 168,
      teamSize: 1,
      phase: 'development',
      hours: { detection: 0.25, report: 0, fix: 1, testing: 0.5, deploy: 0, support: 0 },
      indirectCost: 0,
      affectedCustomers: 0,
      revenueLossPerCustomer: 0,
    },
    {
      name: 'Costly regression in staging',
      monthlySalary: 14000,
      hoursPerMonth: 168,
      teamSize: 2,
      phase: 'staging',
      hours: { detection: 2, report: 1, fix: 6, testing: 4, deploy: 1, support: 0 },
      indirectCost: 1000,
      affectedCustomers: 0,
      revenueLossPerCustomer: 0,
    },
    {
      name: 'Production security incident',
      monthlySalary: 18000,
      hoursPerMonth: 168,
      teamSize: 4,
      phase: 'production',
      hours: { detection: 6, report: 4, fix: 16, testing: 8, deploy: 4, support: 20 },
      indirectCost: 15000,
      affectedCustomers: 500,
      revenueLossPerCustomer: 10,
    },
  ],
}

export function exportMarkdown(result, t) {
  if (!result) return ''
  const lines = [
    `## ${t.title}`,
    '',
    `| ${t.inputLabel} | ${t.valueLabel} |`,
    `|---|---|`,
    `| ${t.monthlySalary} | ${formatCurrency(result.monthlySalary)} |`,
    `| ${t.hoursPerMonth} | ${result.hoursPerMonth} h |`,
    `| ${t.teamSize} | ${result.teamSize} |`,
    `| ${t.phase} | ${t[result.phase.key] || result.phase.labelEn} |`,
    `| ${t.totalHours} | ${formatHours(result.totalHours)} |`,
    `| ${t.hourlyRate} | ${formatCurrency(result.teamHourlyRate)}/h |`,
    '',
    `| ${t.resultLabel} | ${t.valueLabel} |`,
    `|---|---|`,
    `| ${t.directCost} | ${formatCurrency(result.directCost)} |`,
    `| ${t.phaseMultiplier} | ${result.phaseMultiplier}x |`,
    `| ${t.adjustedDirectCost} | ${formatCurrency(result.adjustedDirectCost)} |`,
    `| ${t.indirectCost} | ${formatCurrency(result.indirectCost)} |`,
    `| ${t.totalCost} | **${formatCurrency(result.totalCost)}** |`,
    `| ${t.savingsIfEarlier} | ${formatCurrency(result.savingsIfDetectedEarlier)} |`,
  ]
  return lines.join('\n')
}
