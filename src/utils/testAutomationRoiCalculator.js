/**
 * Motor de cálculo de ROI de Testes Automatizados.
 * 100% client-side — nenhum dado financeiro sai do navegador.
 *
 * Fórmulas:
 *   custoHora            = salarioMensal / (horasTrabalhadasPorMes)
 *   execucoesPorMes      = frequenciaPorDia * diasUteisPorMes
 *   tempoManualPorMes    = execucoesPorMes * tempoManualMinutos / 60
 *   custoManualPorMes    = tempoManualPorMes * custoHora
 *   investimentoInicial  = tempoAutomacaoHoras * custoHora
 *   custoManutencaoPorMes= tempoManutencaoHoras * custoHora
 *   economiaMensal       = custoManualPorMes - custoManutencaoPorMes
 *   paybackMeses         = investimentoInicial / economiaMensal
 *   roiAcumulado(m)      = (economiaMensal * m - investimentoInicial) / investimentoInicial
 *   economiaAcumulada(m) = economiaMensal * m - investimentoInicial
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

export function formatHours(value, decimals = 1) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return `${value.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}h`
}

export function formatNumber(value, decimals = 0) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return value.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

export function calculateRoi(
  monthlySalary,
  workHoursPerMonth,
  manualMinutes,
  runsPerDay,
  workDaysPerMonth,
  automationHours,
  maintenanceHoursPerMonth,
  projectionMonths
) {
  const salary = toNumber(monthlySalary)
  const workHours = toNumber(workHoursPerMonth)
  const manualMin = toNumber(manualMinutes)
  const runs = toNumber(runsPerDay)
  const workDays = toNumber(workDaysPerMonth)
  const autoHours = toNumber(automationHours)
  const maintenanceHours = toNumber(maintenanceHoursPerMonth)
  const months = toNumber(projectionMonths)

  if (
    salary === null ||
    workHours === null ||
    manualMin === null ||
    runs === null ||
    workDays === null ||
    autoHours === null ||
    maintenanceHours === null ||
    months === null ||
    salary < 0 ||
    workHours <= 0 ||
    manualMin < 0 ||
    runs < 0 ||
    workDays <= 0 ||
    autoHours < 0 ||
    maintenanceHours < 0 ||
    months <= 0 ||
    months > 120
  ) {
    return null
  }

  const hourlyCost = salary / workHours
  const runsPerMonth = runs * workDays
  const manualHoursPerMonth = (runsPerMonth * manualMin) / 60
  const manualCostPerMonth = manualHoursPerMonth * hourlyCost
  const initialInvestment = autoHours * hourlyCost
  const maintenanceCostPerMonth = maintenanceHours * hourlyCost
  const monthlySavings = manualCostPerMonth - maintenanceCostPerMonth

  const timeline = []
  let cumulativeManual = 0
  let cumulativeAutomation = initialInvestment

  for (let m = 1; m <= months; m++) {
    cumulativeManual += manualCostPerMonth
    cumulativeAutomation += maintenanceCostPerMonth
    const netSavings = cumulativeManual - cumulativeAutomation
    const roi = initialInvestment > 0 ? netSavings / initialInvestment : 0
    timeline.push({
      month: m,
      manualCost: cumulativeManual,
      automationCost: cumulativeAutomation,
      netSavings,
      roi,
    })
  }

  const final = timeline[timeline.length - 1]
  const paybackMonths = monthlySavings > 0 ? initialInvestment / monthlySavings : null
  const totalRoi = final ? final.roi : 0
  const breakEvenMonth = timeline.find((t) => t.netSavings >= 0)?.month || null

  return {
    hourlyCost,
    runsPerMonth,
    manualHoursPerMonth,
    manualCostPerMonth,
    initialInvestment,
    maintenanceCostPerMonth,
    monthlySavings,
    paybackMonths,
    totalRoi,
    breakEvenMonth,
    totalMonths: months,
    finalNetSavings: final?.netSavings ?? 0,
    finalManualCost: final?.manualCost ?? 0,
    finalAutomationCost: final?.automationCost ?? 0,
    timeline,
    inputs: {
      monthlySalary: salary,
      workHoursPerMonth: workHours,
      manualMinutes: manualMin,
      runsPerDay: runs,
      workDaysPerMonth: workDays,
      automationHours: autoHours,
      maintenanceHoursPerMonth: maintenanceHours,
      projectionMonths: months,
    },
  }
}

export const PRESETS = {
  smokeDaily: {
    pt: 'Smoke test diário',
    en: 'Daily smoke test',
    monthlySalary: 12000,
    workHoursPerMonth: 168,
    manualMinutes: 20,
    runsPerDay: 1,
    workDaysPerMonth: 22,
    automationHours: 16,
    maintenanceHoursPerMonth: 4,
    projectionMonths: 24,
  },
  regressionCritical: {
    pt: 'Regressão crítica por release',
    en: 'Critical regression per release',
    monthlySalary: 14000,
    workHoursPerMonth: 168,
    manualMinutes: 180,
    runsPerDay: 0.25,
    workDaysPerMonth: 22,
    automationHours: 40,
    maintenanceHoursPerMonth: 6,
    projectionMonths: 24,
  },
  apiMonitoring: {
    pt: 'Monitoramento de API',
    en: 'API health monitoring',
    monthlySalary: 15000,
    workHoursPerMonth: 168,
    manualMinutes: 10,
    runsPerDay: 12,
    workDaysPerMonth: 30,
    automationHours: 24,
    maintenanceHoursPerMonth: 3,
    projectionMonths: 24,
  },
  e2eSprint: {
    pt: 'E2E a cada sprint',
    en: 'E2E every sprint',
    monthlySalary: 13000,
    workHoursPerMonth: 168,
    manualMinutes: 240,
    runsPerDay: 0.1,
    workDaysPerMonth: 22,
    automationHours: 60,
    maintenanceHoursPerMonth: 8,
    projectionMonths: 24,
  },
  legacyProject: {
    pt: 'Projeto legado com muita manutenção',
    en: 'Legacy project with high maintenance',
    monthlySalary: 11000,
    workHoursPerMonth: 168,
    manualMinutes: 45,
    runsPerDay: 0.5,
    workDaysPerMonth: 22,
    automationHours: 80,
    maintenanceHoursPerMonth: 16,
    projectionMonths: 36,
  },
}

export function exportMarkdown(result, t) {
  if (!result) return ''
  const lines = [
    `# ${t.title}`,
    '',
    t.intro,
    '',
    `## ${t.resultsTitle}`,
    '',
    `- **${t.hourlyCost}:** ${formatCurrency(result.hourlyCost)}`,
    `- **${t.runsPerMonth}:** ${formatNumber(result.runsPerMonth)}`,
    `- **${t.manualHoursPerMonth}:** ${formatHours(result.manualHoursPerMonth)}`,
    `- **${t.manualCostPerMonth}:** ${formatCurrency(result.manualCostPerMonth)}`,
    `- **${t.initialInvestment}:** ${formatCurrency(result.initialInvestment)}`,
    `- **${t.maintenanceCostPerMonth}:** ${formatCurrency(result.maintenanceCostPerMonth)}`,
    `- **${t.monthlySavings}:** ${formatCurrency(result.monthlySavings)}`,
    `- **${t.payback}:** ${result.paybackMonths !== null ? formatNumber(result.paybackMonths, 1) + ' ' + t.months : '—'}`,
    `- **${t.breakEvenMonth}:** ${result.breakEvenMonth !== null ? result.breakEvenMonth : '—'}`,
    `- **${t.totalRoi}:** ${(result.totalRoi * 100).toFixed(1)}%`,
    `- **${t.finalNetSavings}:** ${formatCurrency(result.finalNetSavings)}`,
    '',
    `## ${t.timelineTitle}`,
    '',
    `| ${t.month} | ${t.cumulativeManual} | ${t.cumulativeAutomation} | ${t.netSavings} | ${t.roi} |`,
    `|---|---|---|---|---|`,
    ...result.timeline.map((row) => {
      return `| ${row.month} | ${formatCurrency(row.manualCost)} | ${formatCurrency(row.automationCost)} | ${formatCurrency(row.netSavings)} | ${(row.roi * 100).toFixed(1)}% |`
    }),
  ]
  return lines.join('\n')
}
