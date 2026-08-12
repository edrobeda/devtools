import dayjs from 'dayjs'

export const UNITS = ['year', 'month', 'week', 'day', 'hour', 'minute', 'second']

export function toLocalInputValue(d) {
  return d.format('YYYY-MM-DDTHH:mm')
}

export function parseLocalInput(value) {
  const d = dayjs(value)
  return d.isValid() ? d : null
}

export function nowLocalInputValue() {
  return toLocalInputValue(dayjs())
}

export function diffCalendar(start, end) {
  let a = start
  let b = end
  let sign = 1
  if (a.isAfter(b)) {
    const tmp = a
    a = b
    b = tmp
    sign = -1
  }

  let cursor = a.clone()
  const years = b.diff(cursor, 'year')
  cursor = cursor.add(years, 'year')
  const months = b.diff(cursor, 'month')
  cursor = cursor.add(months, 'month')
  const days = b.diff(cursor, 'day')
  cursor = cursor.add(days, 'day')
  const hours = b.diff(cursor, 'hour')
  cursor = cursor.add(hours, 'hour')
  const minutes = b.diff(cursor, 'minute')
  cursor = cursor.add(minutes, 'minute')
  const seconds = b.diff(cursor, 'second')

  return { sign, years, months, days, hours, minutes, seconds }
}

export function diffTotals(start, end) {
  const ms = end.diff(start)
  const absMs = Math.abs(ms)
  const sign = ms < 0 ? -1 : 1
  const seconds = absMs / 1000
  const minutes = seconds / 60
  const hours = minutes / 60
  const days = hours / 24
  const weeks = days / 7
  return { sign, ms: absMs, seconds, minutes, hours, days, weeks }
}

export function addDuration(base, value, unit) {
  return base.add(value, unit)
}

export function formatDurationBreakdown(parts, t) {
  const tokens = []
  if (parts.years) tokens.push(`${parts.years} ${parts.years === 1 ? t.year : t.years}`)
  if (parts.months) tokens.push(`${parts.months} ${parts.months === 1 ? t.month : t.months}`)
  if (parts.days) tokens.push(`${parts.days} ${parts.days === 1 ? t.day : t.days}`)
  if (parts.hours) tokens.push(`${parts.hours} ${parts.hours === 1 ? t.hour : t.hours}`)
  if (parts.minutes) tokens.push(`${parts.minutes} ${parts.minutes === 1 ? t.minute : t.minutes}`)
  if (parts.seconds) tokens.push(`${parts.seconds} ${parts.seconds === 1 ? t.second : t.seconds}`)
  if (!tokens.length) tokens.push(`0 ${t.seconds}`)
  return tokens.join(', ')
}

export function formatTotals(totals, t) {
  const lines = []
  lines.push(`${Math.round(totals.ms).toLocaleString()} ${t.ms}`)
  if (totals.seconds >= 1) lines.push(`${totals.seconds.toLocaleString(undefined, { maximumFractionDigits: 3 })} ${t.secondsTotal}`)
  if (totals.minutes >= 1) lines.push(`${totals.minutes.toLocaleString(undefined, { maximumFractionDigits: 3 })} ${t.minutesTotal}`)
  if (totals.hours >= 1) lines.push(`${totals.hours.toLocaleString(undefined, { maximumFractionDigits: 3 })} ${t.hoursTotal}`)
  if (totals.days >= 1) lines.push(`${totals.days.toLocaleString(undefined, { maximumFractionDigits: 3 })} ${t.daysTotal}`)
  if (totals.weeks >= 1) lines.push(`${totals.weeks.toLocaleString(undefined, { maximumFractionDigits: 3 })} ${t.weeksTotal}`)
  return lines.join(' / ')
}

export function prettySign(sign, t) {
  return sign < 0 ? t.past : sign > 0 ? t.future : t.same
}
