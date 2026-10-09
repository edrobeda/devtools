/**
 * Catálogo de fusos e primitivas de data/hora entre fusos compartilhados por
 * /tools/timezone-converter e /tools/meeting-time-picker. Antes cada página
 * carregava cópias byte a byte idênticas do catálogo ZONES e destes helpers —
 * a meeting-picker nasceu como cópia da converter, o que fazia adicionar um
 * fuso (ou corrigir um bug de DST) exigir editar os dois arquivos. Esta é a
 * versão canônica.
 *
 * A `zoneParts` daqui é o superset (sempre extrai `weekday`); a
 * timezone-converter simplesmente ignora o campo extra, então o comportamento
 * dela não muda. Os catálogos DEFAULT_TARGETS/DEFAULT_SOURCE de cada página
 * NÃO ficam aqui: são diferentes de propósito (o da converter traz `Etc/UTC`
 * no início da lista, o da meeting não) e continuam locais.
 *
 * 100% client-side via Intl.DateTimeFormat — nada sai do navegador.
 */

// Conjunto curado dos fusos mais comuns no dia a dia de um dev (deploy,
// oncall, reunião com time remoto...). Qualquer ID IANA válido funciona —
// este é só o atalho com nome amigável.
export const ZONES = [
  { id: 'Etc/UTC', city: 'UTC' },
  { id: 'America/New_York', city: 'New York' },
  { id: 'America/Chicago', city: 'Chicago' },
  { id: 'America/Denver', city: 'Denver' },
  { id: 'America/Los_Angeles', city: 'Los Angeles' },
  { id: 'America/Toronto', city: 'Toronto' },
  { id: 'America/Mexico_City', city: 'Cidade do México' },
  { id: 'America/Sao_Paulo', city: 'São Paulo' },
  { id: 'America/Buenos_Aires', city: 'Buenos Aires' },
  { id: 'Europe/London', city: 'Londres' },
  { id: 'Europe/Lisbon', city: 'Lisboa' },
  { id: 'Europe/Paris', city: 'Paris' },
  { id: 'Europe/Berlin', city: 'Berlim' },
  { id: 'Europe/Madrid', city: 'Madri' },
  { id: 'Europe/Rome', city: 'Roma' },
  { id: 'Europe/Amsterdam', city: 'Amsterdã' },
  { id: 'Europe/Stockholm', city: 'Estocolmo' },
  { id: 'Europe/Warsaw', city: 'Varsóvia' },
  { id: 'Europe/Istanbul', city: 'Istambul' },
  { id: 'Europe/Moscow', city: 'Moscou' },
  { id: 'Africa/Cairo', city: 'Cairo' },
  { id: 'Africa/Johannesburg', city: 'Joanesburgo' },
  { id: 'Asia/Dubai', city: 'Dubai' },
  { id: 'Asia/Kolkata', city: 'Índia (IST)' },
  { id: 'Asia/Bangkok', city: 'Bangkok' },
  { id: 'Asia/Singapore', city: 'Singapura' },
  { id: 'Asia/Hong_Kong', city: 'Hong Kong' },
  { id: 'Asia/Shanghai', city: 'Xangai' },
  { id: 'Asia/Taipei', city: 'Taipei' },
  { id: 'Asia/Tokyo', city: 'Tóquio' },
  { id: 'Asia/Seoul', city: 'Seul' },
  { id: 'Australia/Sydney', city: 'Sydney' },
  { id: 'Australia/Melbourne', city: 'Melbourne' },
  { id: 'Pacific/Auckland', city: 'Auckland' },
  { id: 'Pacific/Honolulu', city: 'Honolulu' },
]

export function cityOf(id) {
  const z = ZONES.find((x) => x.id === id)
  return z ? z.city : id
}

// ─── Núcleo de conversão entre fusos ─────────────────────────────
// A pegada difícil é o campo de data/hora: ele é interpretado como
// horário de PAREDE no fuso de origem (não no fuso do navegador).
// Pra achar o instante certo existe um passo intermediário — assume
// UTC, descobre o offset no fuso, corrige e confere de novo (DST).
export function pad2(n) {
  return String(n).padStart(2, '0')
}

export function zoneParts(ms, zone) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: zone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    weekday: 'short',
  }).formatToParts(new Date(ms))
  const o = {}
  parts.forEach((p) => { o[p.type] = p.value })
  let hour = parseInt(o.hour, 10)
  if (hour === 24) hour = 0
  return {
    year: parseInt(o.year, 10),
    month: parseInt(o.month, 10),
    day: parseInt(o.day, 10),
    hour,
    minute: parseInt(o.minute, 10),
    second: parseInt(o.second, 10),
    weekday: o.weekday,
    date: `${o.year}-${o.month}-${o.day}`,
  }
}

export function offsetMinutes(ms, zone) {
  const p = zoneParts(ms, zone)
  const wallAsUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second)
  return Math.round((wallAsUtc - ms) / 60000)
}

export function wallTimeToInstant(str, zone) {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(str)
  if (!m) return null
  const y = +m[1]
  const mo = +m[2]
  const d = +m[3]
  const h = +m[4]
  const mi = +m[5]
  const asUtc = Date.UTC(y, mo - 1, d, h, mi)
  const o1 = offsetMinutes(asUtc, zone)
  let cand = new Date(asUtc - o1 * 60000)
  const o2 = offsetMinutes(cand.getTime(), zone)
  if (o1 !== o2) cand = new Date(asUtc - o2 * 60000)
  return cand.getTime()
}

export function toNaiveString(ms, zone) {
  const p = zoneParts(ms, zone)
  return `${p.year}-${pad2(p.month)}-${pad2(p.day)}T${pad2(p.hour)}:${pad2(p.minute)}`
}

export function fmtOffset(min) {
  const sign = min < 0 ? '-' : '+'
  const abs = Math.abs(min)
  return `UTC${sign}${pad2(Math.floor(abs / 60))}:${pad2(abs % 60)}`
}

export function fmtDelta(min) {
  if (min === 0) return '±0h'
  const sign = min > 0 ? '+' : '-'
  const abs = Math.abs(min)
  const h = Math.floor(abs / 60)
  const m = abs % 60
  if (h && m) return `${sign}${h}h${m}m`
  if (h) return `${sign}${h}h`
  return `${sign}${m}m`
}
