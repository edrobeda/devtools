// Calculadora de disponibilidade (uptime / SLA / nines).
// 100% client-side — nenhum dado sai do navegador.

const SECONDS_IN_YEAR = 365.25 * 24 * 60 * 60 // 31.557.600s
const SECONDS_IN_MONTH = SECONDS_IN_YEAR / 12 // ~2.629.800s
const SECONDS_IN_WEEK = 7 * 24 * 60 * 60 // 604.800s
const SECONDS_IN_DAY = 24 * 60 * 60 // 86.400s
const SECONDS_IN_HOUR = 60 * 60 // 3.600s
const SECONDS_IN_MINUTE = 60

/**
 * Converte um valor de tempo na unidade escolhida para segundos.
 * @param {number} value
 * @param {'seconds'|'minutes'|'hours'|'days'|'weeks'|'months'|'years'} unit
 * @returns {number}
 */
export function toSeconds(value, unit) {
  const multipliers = {
    seconds: 1,
    minutes: SECONDS_IN_MINUTE,
    hours: SECONDS_IN_HOUR,
    days: SECONDS_IN_DAY,
    weeks: SECONDS_IN_WEEK,
    months: SECONDS_IN_MONTH,
    years: SECONDS_IN_YEAR,
  }
  return value * (multipliers[unit] ?? 1)
}

/**
 * Formata uma duração em segundos para leitura humana (até anos).
 * @param {number} totalSeconds
 * @returns {string}
 */
export function formatDuration(totalSeconds) {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return '—'
  if (totalSeconds === 0) return '0s'

  const years = Math.floor(totalSeconds / SECONDS_IN_YEAR)
  let rest = totalSeconds % SECONDS_IN_YEAR
  const months = Math.floor(rest / SECONDS_IN_MONTH)
  rest %= SECONDS_IN_MONTH
  const days = Math.floor(rest / SECONDS_IN_DAY)
  rest %= SECONDS_IN_DAY
  const hours = Math.floor(rest / SECONDS_IN_HOUR)
  rest %= SECONDS_IN_HOUR
  const minutes = Math.floor(rest / SECONDS_IN_MINUTE)
  const seconds = Math.round(rest % SECONDS_IN_MINUTE)

  const parts = []
  if (years) parts.push(`${years}a`)
  if (months) parts.push(`${months}mo`)
  if (days) parts.push(`${days}d`)
  if (hours) parts.push(`${hours}h`)
  if (minutes) parts.push(`${minutes}min`)
  if (seconds) parts.push(`${seconds}s`)

  return parts.slice(0, 4).join(' ') || '< 1s'
}

/**
 * Calcula o uptime percentual a partir do tempo total e do tempo de inatividade.
 * @param {number} totalSeconds
 * @param {number} downtimeSeconds
 * @returns {number} uptime em % (0-100)
 */
export function uptimeFromDowntime(totalSeconds, downtimeSeconds) {
  if (totalSeconds <= 0) return 0
  const uptimeSeconds = Math.max(0, totalSeconds - downtimeSeconds)
  return (uptimeSeconds / totalSeconds) * 100
}

/**
 * Calcula o tempo de inatividade (em segundos) para um dado uptime percentual
 * considerando um ano como base.
 * @param {number} uptimePercent
 * @returns {number} downtime em segundos
 */
export function downtimeSecondsFromUptime(uptimePercent) {
  if (!Number.isFinite(uptimePercent)) return 0
  const clamped = Math.max(0, Math.min(100, uptimePercent))
  return ((100 - clamped) / 100) * SECONDS_IN_YEAR
}

/**
 * Retorna quantos "nines" um uptime percentual representa.
 * Ex.: 99.9 -> 1 nine, 99.99 -> 2 nines, 99.999 -> 3 nines.
 * @param {number} uptimePercent
 * @returns {number}
 */
export function countNines(uptimePercent) {
  if (!Number.isFinite(uptimePercent) || uptimePercent <= 0 || uptimePercent >= 100) return 0
  const downtimeRatio = (100 - uptimePercent) / 100
  let nines = 0
  let acc = 0.1
  while (downtimeRatio <= acc && nines < 10) {
    nines += 1
    acc /= 10
  }
  return nines
}

/**
 * Calcula o downtime budget em várias janelas de tempo para um uptime percentual.
 * @param {number} uptimePercent
 * @returns {{
 *   year: number,
 *   month: number,
 *   week: number,
 *   day: number
 * }}
 */
export function downtimeBudget(uptimePercent) {
  const year = downtimeSecondsFromUptime(uptimePercent)
  return {
    year,
    month: (year / SECONDS_IN_YEAR) * SECONDS_IN_MONTH,
    week: (year / SECONDS_IN_YEAR) * SECONDS_IN_WEEK,
    day: (year / SECONDS_IN_YEAR) * SECONDS_IN_DAY,
  }
}

/**
 * Calcula a disponibilidade a partir de MTBF e MTTR.
 * availability = MTBF / (MTBF + MTTR)
 * @param {number} mtbf - mean time between failures
 * @param {number} mttr - mean time to recovery
 * @returns {number} disponibilidade em %
 */
export function availabilityFromMtbfMttr(mtbf, mttr) {
  if (mtbf <= 0 || mttr < 0) return 0
  return (mtbf / (mtbf + mttr)) * 100
}

/**
 * Calcula o MTTR necessário para atingir uma disponibilidade-alvo dado o MTBF.
 * @param {number} mtbf
 * @param {number} targetAvailabilityPercent
 * @returns {number} MTTR em mesma unidade do MTBF
 */
export function mttrForAvailability(mtbf, targetAvailabilityPercent) {
  if (mtbf <= 0 || targetAvailabilityPercent <= 0 || targetAvailabilityPercent >= 100) return 0
  const a = targetAvailabilityPercent / 100
  return (mtbf * (1 - a)) / a
}

/**
 * Calcula o MTBF necessário para atingir uma disponibilidade-alvo dado o MTTR.
 * @param {number} mttr
 * @param {number} targetAvailabilityPercent
 * @returns {number} MTBF em mesma unidade do MTTR
 */
export function mtbfForAvailability(mttr, targetAvailabilityPercent) {
  if (mttr < 0 || targetAvailabilityPercent <= 0 || targetAvailabilityPercent >= 100) return 0
  const a = targetAvailabilityPercent / 100
  return (mttr * a) / (1 - a)
}

/**
 * Tabela de referência dos níveis clássicos de "nines".
 */
export function getNinesTable() {
  return [
    { nines: 1, uptime: 90, label: '90%' },
    { nines: 2, uptime: 99, label: '99%' },
    { nines: 3, uptime: 99.9, label: '99.9%' },
    { nines: 4, uptime: 99.99, label: '99.99%' },
    { nines: 5, uptime: 99.999, label: '99.999%' },
    { nines: 6, uptime: 99.9999, label: '99.9999%' },
    { nines: 7, uptime: 99.99999, label: '99.99999%' },
  ]
}

/**
 * Cenários rápidos de um clique.
 * @param {string} lang - 'pt' | 'en'
 * @returns {Array<{key: string, label: string, uptime: number}>}
 */
export function getPresets(lang = 'pt') {
  const labels = {
    pt: {
      cloud: 'Cloud típica (99.9%)',
      enterprise: 'Enterprise (99.99%)',
      critical: 'Missão crítica (99.999%)',
      almost: 'Quase perfeito (99.9999%)',
      monthly: 'Uptime mensal 99%',
      yearly: 'Uptime anual 99.9%',
    },
    en: {
      cloud: 'Typical cloud (99.9%)',
      enterprise: 'Enterprise (99.99%)',
      critical: 'Mission critical (99.999%)',
      almost: 'Near perfect (99.9999%)',
      monthly: 'Monthly uptime 99%',
      yearly: 'Yearly uptime 99.9%',
    },
  }
  const l = labels[lang] || labels.en
  return [
    { key: 'cloud', label: l.cloud, uptime: 99.9 },
    { key: 'enterprise', label: l.enterprise, uptime: 99.99 },
    { key: 'critical', label: l.critical, uptime: 99.999 },
    { key: 'almost', label: l.almost, uptime: 99.9999 },
    { key: 'monthly', label: l.monthly, uptime: 99 },
    { key: 'yearly', label: l.yearly, uptime: 99.9 },
  ]
}

/**
 * Formata um percentual com até 6 casas decimais, removendo zeros à direita.
 * @param {number} value
 * @returns {string}
 */
export function formatPercent(value) {
  if (!Number.isFinite(value)) return '—'
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 6,
  })
}
