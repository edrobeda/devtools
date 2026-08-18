// Calculadora de Dias Úteis 100% client-side. O motor trabalha com datas
// ISO "YYYY-MM-DD" (formato do <input type="date">) e só faz aritmética de
// dias inteiros via UTC, então regras de fuso/horário de verão não afetam
// a contagem — cada dia é uma unidade atômica.
//
// Convenção adotada para "adicionar N dias úteis": o dia de início NÃO é
// contado (somar 1 dia útil a uma sexta-feira sem feriados dá segunda).

export function todayIso() {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${dd}`
}

// Dia da semana (0 = domingo ... 6 = sábado) a partir do ISO local.
export function isoWeekday(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).getDay()
}

// Converte "YYYY-MM-DD" no número do dia relativo ao epoch (dias inteiros em UTC).
export function toDayNum(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return Math.floor(Date.UTC(y, m - 1, d) / 86400000)
}

// Converte o número do dia de volta em "YYYY-MM-DD".
export function fromDayNum(n) {
  return new Date(n * 86400000).toISOString().slice(0, 10)
}

export function addDaysIso(iso, delta) {
  return fromDayNum(toDayNum(iso) + delta)
}

export function formatIso(iso) {
  return addDaysIso(iso, 0)
}

// Um dia é "útil" quando não cai em fim de semana (lista de índices) nem em
// feriado (Set de datas ISO).
export function isWorkingDay(iso, weekend, holidays) {
  if (weekend.includes(isoWeekday(iso))) return false
  if (holidays.has(iso)) return false
  return true
}

// Conta os dias do intervalo [start, end] (inclusive), separando úteis,
// fins de semana e feriados. A ordem das datas não importa.
export function countWorkingDays(start, end, weekend, holidays) {
  const d0 = toDayNum(start)
  const d1 = toDayNum(end)
  const lo = Math.min(d0, d1)
  const hi = Math.max(d0, d1)
  let working = 0
  let weekendDays = 0
  let holidaysInRange = 0
  for (let n = lo; n <= hi; n++) {
    const iso = fromDayNum(n)
    if (weekend.includes(isoWeekday(iso))) {
      weekendDays++
    } else if (holidays.has(iso)) {
      holidaysInRange++
    } else {
      working++
    }
  }
  return {
    working,
    weekendDays,
    holidaysInRange,
    total: hi - lo + 1,
    inverted: d0 > d1,
  }
}

// Soma N dias úteis a partir de `start` (a data inicial não é contada; se o
// intervalo conter feriados, eles pulam a contagem também).
export function addWorkingDays(start, n, weekend, holidays) {
  if (n < 0) return subtractWorkingDays(start, -n, weekend, holidays)
  let iso = start
  let remaining = n
  let guard = 0
  while (remaining > 0 && guard < 100000) {
    iso = addDaysIso(iso, 1)
    guard++
    if (isWorkingDay(iso, weekend, holidays)) remaining--
  }
  return iso
}

// Subtrai N dias úteis a partir de `start` (a data inicial não é contada).
export function subtractWorkingDays(start, n, weekend, holidays) {
  if (n < 0) return addWorkingDays(start, -n, weekend, holidays)
  let iso = start
  let remaining = n
  let guard = 0
  while (remaining > 0 && guard < 100000) {
    iso = addDaysIso(iso, -1)
    guard++
    if (isWorkingDay(iso, weekend, holidays)) remaining--
  }
  return iso
}

// Faz o parse do textarea de feriados (uma data ISO por linha): devolve as
// linhas válidas em um array e as inválidas em outro, para o UI alertar.
export function parseHolidays(text) {
  const valid = []
  const invalid = []
  if (!text) return { valid, invalid }
  text.split(/\r?\n/).forEach((line) => {
    const s = line.trim()
    if (!s) return
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
      const [y, m, d] = s.split('-').map(Number)
      const dt = new Date(y, m - 1, d)
      if (
        dt.getFullYear() === y &&
        dt.getMonth() === m - 1 &&
        dt.getDate() === d
      ) {
        valid.push(s)
      } else {
        invalid.push(s)
      }
    } else {
      invalid.push(s)
    }
  })
  return { valid, invalid }
}

// Feriados nacionais fixos do Brasil — dados inline, nada sai do navegador.
export const BR_HOLIDAYS_2025 = [
  '2025-01-01', // Confraternização Universal
  '2025-03-03', // Carnaval (2ª feira)
  '2025-03-04', // Carnaval (3ª feira)
  '2025-04-18', // Sexta-feira Santa
  '2025-04-21', // Tiradentes
  '2025-05-01', // Dia do Trabalho
  '2025-06-19', // Corpus Christi
  '2025-09-07', // Independência do Brasil
  '2025-10-12', // Nossa Senhora Aparecida
  '2025-11-02', // Finados
  '2025-11-15', // Proclamação da República
  '2025-11-20', // Consciência Negra (feriado nacional desde 2023)
  '2025-12-25', // Natal
]

export const BR_HOLIDAYS_2026 = [
  '2026-01-01', // Confraternização Universal
  '2026-02-16', // Carnaval (2ª feira)
  '2026-02-17', // Carnaval (3ª feira)
  '2026-04-03', // Sexta-feira Santa
  '2026-04-21', // Tiradentes
  '2026-05-01', // Dia do Trabalho
  '2026-06-04', // Corpus Christi
  '2026-09-07', // Independência do Brasil
  '2026-10-12', // Nossa Senhora Aparecida
  '2026-11-02', // Finados
  '2026-11-15', // Proclamação da República
  '2026-11-20', // Consciência Negra (feriado nacional desde 2023)
  '2026-12-25', // Natal
]

export function getEngineSource() {
  return [
    "// Núcleo: cada dia vira um número inteiro (epoch/86400000 em UTC), o que",
    "// elimina dependência de fuso/horário de verão na aritmética.",
    "export function isWorkingDay(iso, weekend, holidays) {",
    "  if (weekend.includes(isoWeekday(iso))) return false",
    "  if (holidays.has(iso)) return false",
    "  return true",
    "}",
    "",
    "export function countWorkingDays(start, end, weekend, holidays) {",
    "  for (let n = min(toDayNum(start), toDayNum(end)); n <= max(...); n++) {",
    "    if (weekend.includes(isoWeekday(iso))) weekendDays++",
    "    else if (holidays.has(iso)) holidaysInRange++",
    "    else working++",
    "  }",
    "}",
    "",
    "export function addWorkingDays(start, n, weekend, holidays) {",
    "  // a data de início não é contada: cada avanço pula fim de semana e feriado",
    "  while (remaining > 0) {",
    "    iso = addDaysIso(iso, 1)",
    "    if (isWorkingDay(iso, weekend, holidays)) remaining--",
    "  }",
    "}",
  ].join('\n')
}