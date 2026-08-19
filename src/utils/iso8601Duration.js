// Conversor / parser de duração ISO 8601 (PnYnMnDTnHnMnS) — 100% client-side.
//
// Formato: P[nY][nM][nW][nD][T[nH][nM][nS]]
//   - "P" é obrigatório; "T" separa a parte de data da parte de hora.
//   - Cada valor pode ter fração decimal (ex.: PT1.5H = 1h30min); a fração é
//     válida apenas na menor unidade presente (apontamos quando não é).
//   - Semanas (PnW) só podem aparecer sozinhas no ISO 8601; aceitamos o parse
//     mas marcamos aviso quando misturada com outras unidades.
//   - Sinal: aceita "-P1D" e também "P-1D".
//
// Conversão total: para transformar a duração em segundos/dias, usamos as
// convenções mais comuns em ferramentas de calendário: 1 ano = 365 dias e
// 1 mês = 30 dias. Essas suposições são exibidas na página.

export const YEAR_DAYS = 365
export const MONTH_DAYS = 30
export const WEEK_DAYS = 7

const DAY_S = 86400
const HOUR_S = 3600
const MINUTE_S = 60

function toNumber(s) {
  return Number(String(s).replace(',', '.'))
}

// Arredonda para exibir sem ruído de ponto flutuante (1.5 - 0.5 etc.).
export function cleanNumber(n) {
  return Math.round(n * 1e9) / 1e9
}

const COMPONENT_ORDER = ['years', 'months', 'weeks', 'days', 'hours', 'minutes', 'seconds']

// Parseia "P1Y2M3W4DT5H6M7.5S" (com sinal opcional) em componentes.
// Retorna { ok: true, sign, parts, totalSeconds, warning }
// ou { ok: false, error } onde error é 'empty' | 'invalid'.
export function parseDuration(input) {
  const raw = String(input || '').trim()
  if (!raw) return { ok: false, error: 'empty' }

  let body = raw
  let sign = 1
  if (body[0] === '-' || body[0] === '+') {
    if (body[0] === '-') sign = -1
    body = body.slice(1)
  }
  // Também aceita o sinal logo após o "P" (P-1D / P+1D).
  if (/^P[-+]/.test(body)) {
    if (body[1] === '-') sign *= -1
    body = `P${body.slice(2)}`
  }

  const match = body.match(
    /^P(?=.)(?:(\d+(?:[.,]\d+)?)Y)?(?:(\d+(?:[.,]\d+)?)M)?(?:(\d+(?:[.,]\d+)?)W)?(?:(\d+(?:[.,]\d+)?)D)?(?:T(?=.)(?:(\d+(?:[.,]\d+)?)H)?(?:(\d+(?:[.,]\d+)?)M)?(?:(\d+(?:[.,]\d+)?)S)?)?$/
  )
  if (!match) return { ok: false, error: 'invalid' }

  const parts = {
    years: match[1] === undefined ? 0 : toNumber(match[1]),
    months: match[2] === undefined ? 0 : toNumber(match[2]),
    weeks: match[3] === undefined ? 0 : toNumber(match[3]),
    days: match[4] === undefined ? 0 : toNumber(match[4]),
    hours: match[5] === undefined ? 0 : toNumber(match[5]),
    minutes: match[6] === undefined ? 0 : toNumber(match[6]),
    seconds: match[7] === undefined ? 0 : toNumber(match[7]),
  }

  let warning = null
  if (parts.weeks > 0 && COMPONENT_ORDER.some((k) => k !== 'weeks' && parts[k] > 0)) {
    warning = 'weekMix'
  } else if (hasFractionOnNonSmallest(parts)) {
    warning = 'fractionNotSmallest'
  }

  const totalSeconds =
    sign *
    (parts.years * YEAR_DAYS * DAY_S +
      parts.months * MONTH_DAYS * DAY_S +
      parts.weeks * WEEK_DAYS * DAY_S +
      parts.days * DAY_S +
      parts.hours * HOUR_S +
      parts.minutes * MINUTE_S +
      parts.seconds)

  return { ok: true, sign, parts, totalSeconds: cleanNumber(totalSeconds), warning }
}

function hasFractionOnNonSmallest(parts) {
  const nonZero = COMPONENT_ORDER.filter((k) => parts[k] > 0)
  if (nonZero.length === 0) return false
  const smallest = nonZero[nonZero.length - 1]
  return nonZero.some((k) => k !== smallest && !Number.isInteger(parts[k]))
}

// Decompõe um total de segundos em dias/horas/min/seg (e semanas).
export function breakdownTotal(totalSeconds) {
  const abs = Math.abs(totalSeconds)
  const days = cleanNumber(abs / DAY_S)
  const hours = cleanNumber(abs / HOUR_S)
  const minutes = cleanNumber(abs / MINUTE_S)
  const weeks = cleanNumber(days / 7)
  return {
    weeks,
    days,
    hours,
    minutes,
    seconds: abs,
  }
}

// Monta o texto em linguagem natural a partir das partes. `units` é o array
// de rótulos no idioma da página, cada um como [singular, plural], na ordem
// anos, meses, semanas, dias, horas, minutos, segundos (motor neutro).
export function describeParts(parts, units, sign = 1) {
  const entries = []
  COMPONENT_ORDER.forEach((k, i) => {
    if (parts[k] > 0) {
      const isOne = parts[k] === 1
      const word = isOne ? units[i][0] : units[i][1]
      entries.push(`${cleanNumber(parts[k])} ${word}`)
    }
  })
  const label = entries.length ? entries.join(', ') : `0 ${units[6][1]}`
  return sign < 0 ? `-${label}` : label
}

function numStr(n) {
  const c = cleanNumber(n)
  return Number.isInteger(c) ? String(c) : String(c)
}

// Monta o string ISO a partir dos componentes. Se semanas vierem misturadas
// com outras unidades (o que o ISO não permite), converte semanas em dias.
// Retorna { iso, warning }.
export function buildDuration(parts) {
  const { years, months, weeks, days, hours, minutes, seconds } = parts
  const negative = parts.negative === true || parts.negative === 1

  let warning = null
  let computedWeeks = weeks
  let computedDays = days
  if (weeks > 0 && (years > 0 || months > 0 || days > 0 || hours > 0 || minutes > 0 || seconds > 0)) {
    computedDays = days + weeks * WEEK_DAYS
    computedWeeks = 0
    warning = 'weeksToDays'
  }

  const dateUnits = [
    [computedWeeks === 0 ? years : years, 'Y'],
    [months, 'M'],
    [computedWeeks, 'W'],
    [computedDays, 'D'],
  ]
  const timeUnits = [
    [hours, 'H'],
    [minutes, 'M'],
    [seconds, 'S'],
  ]

  let body = 'P'
  let hasDate = false
  dateUnits.forEach(([value, letter]) => {
    if (value > 0) {
      body += `${numStr(value)}${letter}`
      hasDate = true
    }
  })
  let hasTime = false
  let timeBody = ''
  timeUnits.forEach(([value, letter]) => {
    if (value > 0) {
      timeBody += `${numStr(value)}${letter}`
      hasTime = true
    }
  })
  if (hasTime) body += `T${timeBody}`

  if (!hasDate && !hasTime) body = 'PT0S'

  const iso = `${negative ? '-' : ''}${body}`
  return { iso, warning }
}

// Referência rápida: duração, string ISO e total em segundos (convenções 365/30).
export const COMMON_DURATIONS = [
  { label: '1 min', iso: 'PT1M', seconds: 60 },
  { label: '30 min', iso: 'PT30M', seconds: 1800 },
  { label: '90 min', iso: 'PT1H30M', seconds: 5400 },
  { label: '1 hour', iso: 'PT1H', seconds: 3600 },
  { label: '1 hour 30 min', iso: 'PT1H30M', seconds: 5400 },
  { label: '1 day', iso: 'P1D', seconds: 86400 },
  { label: '1 day 12 hours', iso: 'P1DT12H', seconds: 129600 },
  { label: '1 week', iso: 'P1W', seconds: 604800 },
  { label: '2 weeks', iso: 'P2W', seconds: 1209600 },
  { label: '1 month', iso: 'P1M', seconds: 2592000 },
  { label: '3 months (quarter)', iso: 'P3M', seconds: 7776000 },
  { label: '1 year', iso: 'P1Y', seconds: 31536000 },
  { label: '1 year 6 months', iso: 'P1Y6M', seconds: 47304000 },
  { label: '45 seconds', iso: 'PT45S', seconds: 45 },
  { label: '1.5 seconds', iso: 'PT1.5S', seconds: 1.5 },
]

export function getEngineSource() {
  return [
    '// ISO 8601: P[nY][nM][nW][nD][T[nH][nM][nS]] — "P" fixo, "T" separa hora.',
    '// Aceita fração (PT1.5H), semanas sozinhas (P2W) e sinal (-P1D / P-1D).',
    'const RE = /^P(?=.)(?:\\d+Y)?(?:\\d+M)?(?:\\d+W)?(?:\\d+D)?(?:T(?=.)(?:\\d+H)?(?:\\d+M)?(?:\\d+S)?)?$/',
    '',
    'export function parseDuration(input) {',
    '  // sinal opcional antes do P ou após o P',
    '  // extrai cada grupo com regex e converte vírgula em ponto',
    '  parts = { years, months, weeks, days, hours, minutes, seconds }',
    '',
    '  totalSeconds = sign * (',
    '    years * 365 * 86400 + months * 30 * 86400 +',
    '    weeks * 7 * 86400 + days * 86400 +',
    '    hours * 3600 + minutes * 60 + seconds',
    '  )',
    '  // avisos: PnW só sozinho; fração só na menor unidade',
    '}',
    '',
    'export function buildDuration(parts) {',
    '  // concatena P + (nY|nM|nW|nD) + opcional T + (nH|nM|nS)',
    '  // mista com semanas -> converte semanas em dias',
    '  // tudo zero -> PT0S',
    '}',
  ].join('\n')
}