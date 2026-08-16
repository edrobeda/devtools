/**
 * Motor de cálculo de burn rate e error budget SRE.
 *
 * Termos:
 * - SLO: objetivo de confiabilidade (ex.: 99.9%)
 * - error budget: fração de falhas permitidas = 1 - SLO
 * - burn rate: (taxa de erros atual) / (error budget)
 * - time to exhaust: tempo estimado para zerar o budget no ritmo atual
 *
 * Todos os valores de entrada são frações (0..1) ou porcentagens (0..100),
 * dependendo da função. Nenhum dado sai do navegador.
 */

const WINDOW_OPTIONS = [
  { value: 30, label: { pt: '30 dias', en: '30 days' } },
  { value: 28, label: { pt: '28 dias', en: '28 days' } },
  { value: 7, label: { pt: '7 dias', en: '7 days' } },
  { value: 1, label: { pt: '24 horas', en: '24 hours' } },
]

const ALERT_RULES = [
  { burnRate: 720, severity: 'critical' },
  { burnRate: 14.4, severity: 'page' },
  { burnRate: 2, severity: 'ticket' },
  { burnRate: 1, severity: 'email' },
]

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

function formatNumber(value, digits = 4) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  if (!Number.isFinite(value)) return '∞'
  if (Math.abs(value) < 0.0001 && value !== 0) return value.toExponential(2)
  return value.toLocaleString(undefined, {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0,
  })
}

function formatDuration(hours) {
  if (!Number.isFinite(hours) || hours < 0) return '—'
  if (hours === 0) return '0h'
  if (hours < 1 / 60) return `${formatNumber(hours * 3600)}s`
  if (hours < 1) return `${formatNumber(hours * 60)}min`
  if (hours < 24) return `${formatNumber(hours)}h`
  if (hours < 24 * 30) return `${formatNumber(hours / 24)}d`
  return `${formatNumber(hours / 24 / 30)}mo`
}

/**
 * Calcula burn rate a partir do SLO (fração) e da taxa de erros (fração).
 */
export function calculateBurnRate({ slo, errorRate }) {
  const safeSlo = clamp(slo, 0.000001, 0.999999)
  const safeErrorRate = clamp(errorRate, 0, 1)
  const errorBudget = 1 - safeSlo
  const burnRate = errorBudget > 0 ? safeErrorRate / errorBudget : Infinity
  return {
    slo: safeSlo,
    errorRate: safeErrorRate,
    errorBudget,
    burnRate,
  }
}

/**
 * Calcula time to exhaust e valores absolutos quando o volume total é
 * informado.
 */
export function calculateErrorBudget({
  slo,
  errorRate,
  totalRequests,
  windowDays = 30,
}) {
  const base = calculateBurnRate({ slo, errorRate })
  const windowHours = windowDays * 24

  const timeToExhaustHours =
    base.burnRate > 0 ? windowHours / base.burnRate : Infinity

  const budgetConsumedRatio =
    base.burnRate > 0 ? 1 / base.burnRate : base.errorRate > 0 ? 1 : 0

  let absolute = null
  if (totalRequests !== null && totalRequests > 0) {
    const errorBudgetAbsolute = totalRequests * base.errorBudget
    const errorsAbsolute = totalRequests * base.errorRate
    const budgetRemainingAbsolute = errorBudgetAbsolute - errorsAbsolute
    absolute = {
      totalRequests,
      errorBudgetAbsolute,
      errorsAbsolute,
      budgetRemainingAbsolute,
      budgetConsumedRatio: Math.min(1, Math.max(0, errorsAbsolute / errorBudgetAbsolute)),
    }
  }

  const recommendedAlert = ALERT_RULES.find((rule) => base.burnRate >= rule.burnRate)

  return {
    ...base,
    windowDays,
    windowHours,
    timeToExhaustHours,
    budgetConsumedRatio: clamp(budgetConsumedRatio, 0, 1),
    absolute,
    recommendedAlert: recommendedAlert || null,
  }
}

export function getWindowOptions() {
  return WINDOW_OPTIONS
}

export function getAlertRules() {
  return ALERT_RULES.map((rule) => ({
    ...rule,
    label: {
      pt:
        rule.severity === 'critical'
          ? 'Crítico'
          : rule.severity === 'page'
          ? 'Page imediato'
          : rule.severity === 'ticket'
          ? 'Ticket'
          : 'E-mail',
      en:
        rule.severity === 'critical'
          ? 'Critical'
          : rule.severity === 'page'
          ? 'Page immediately'
          : rule.severity === 'ticket'
          ? 'Ticket'
          : 'E-mail',
    },
    description: {
      pt: `burn rate ≥ ${rule.burnRate}×`,
      en: `burn rate ≥ ${rule.burnRate}×`,
    },
  }))
}

export function getPresets(lang) {
  return [
    {
      key: 'slo-999-err-05',
      label: lang === 'pt' ? 'SLO 99.9% @ 0.5% erros' : 'SLO 99.9% @ 0.5% errors',
      desc: {
        pt: 'Burn rate 5× — budget esgota em ~6 dias (janela de 30 dias).',
        en: 'Burn rate 5× — budget exhausts in ~6 days (30-day window).',
      },
      slo: 0.999,
      errorRate: 0.005,
      totalRequests: 1_000_000,
      windowDays: 30,
    },
    {
      key: 'slo-9999-err-005',
      label: lang === 'pt' ? 'SLO 99.99% @ 0.05% erros' : 'SLO 99.99% @ 0.05% errors',
      desc: {
        pt: 'Burn rate 5× — budget esgota em ~6 dias.',
        en: 'Burn rate 5× — budget exhausts in ~6 days.',
      },
      slo: 0.9999,
      errorRate: 0.0005,
      totalRequests: 10_000_000,
      windowDays: 30,
    },
    {
      key: 'slo-99-err-2',
      label: lang === 'pt' ? 'SLO 99% @ 2% erros' : 'SLO 99% @ 2% errors',
      desc: {
        pt: 'Burn rate 2× — ticket, mas ainda dentro de 15 dias.',
        en: 'Burn rate 2× — ticket, but still within 15 days.',
      },
      slo: 0.99,
      errorRate: 0.02,
      totalRequests: 500_000,
      windowDays: 30,
    },
    {
      key: 'slo-999-err-01',
      label: lang === 'pt' ? 'SLO 99.9% @ 0.1% erros' : 'SLO 99.9% @ 0.1% errors',
      desc: {
        pt: 'Burn rate 1× — ritmo ideal, budget dura a janela inteira.',
        en: 'Burn rate 1× — ideal pace, budget lasts the whole window.',
      },
      slo: 0.999,
      errorRate: 0.001,
      totalRequests: 1_000_000,
      windowDays: 30,
    },
    {
      key: 'slo-99999-err-001',
      label: lang === 'pt' ? 'SLO 99.999% @ 0.01% erros' : 'SLO 99.999% @ 0.01% errors',
      desc: {
        pt: 'Burn rate 10× — crítico, budget esgota em ~3 dias.',
        en: 'Burn rate 10× — critical, budget exhausts in ~3 days.',
      },
      slo: 0.99999,
      errorRate: 0.0001,
      totalRequests: 100_000_000,
      windowDays: 30,
    },
  ]
}

export { formatNumber, formatDuration }
