// Motor do Explorador de Logs (/devops/log-explorer).
//
// 100% client-side: nada sai do navegador. A entrada é texto colado (docker
// compose logs, kubectl logs, pm2, journalctl, saída de aplicação) e a saída
// é uma lista estruturada de linhas: nível, timestamp, origem (container) e
// mensagem — mais resumo e linha do tempo.
//
// Camadas de parsing, nesta ordem:
//   1. Prefixo de container do docker compose (`api-1  | ...`) → origem.
//   2. Linha JSON (docker json-file `{"log","time"}`, pino/bunyan
//      `{"level":30,"time":...,"msg"}` ou chaves genéricas).
//   3. Linha em texto puro: timestamp ISO/`YYYY-MM-DD HH:MM:SS`, syslog
//      (`Oct 14 12:00:00`) ou só hora; nível por token no início da linha
//      (`[ERROR]`, `WARN:`, `INFO 12 ---`).
//
// O que NÃO faz: decodificar escapes ANSI (isso é /devops/ansi-colors) nem
// estimar custo de armazenamento (/tools/log-storage-cost-calculator).

export const LEVELS = ['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'unknown']

export const LEVEL_LABELS = {
  fatal: { pt: 'Fatal', en: 'Fatal' },
  error: { pt: 'Erro', en: 'Error' },
  warn: { pt: 'Aviso', en: 'Warning' },
  info: { pt: 'Info', en: 'Info' },
  debug: { pt: 'Debug', en: 'Debug' },
  trace: { pt: 'Trace', en: 'Trace' },
  unknown: { pt: 'Sem nível', en: 'No level' },
}

export const LEVEL_COLORS = {
  fatal: '#a8071a',
  error: '#cf1322',
  warn: '#d46b08',
  info: '#1677ff',
  debug: '#722ed1',
  trace: '#8c8c8c',
  unknown: '#bfbfbf',
}

const LEVEL_ALIASES = {
  fatal: 'fatal',
  panic: 'fatal',
  crit: 'fatal',
  critical: 'fatal',
  emerg: 'fatal',
  emergency: 'fatal',
  alert: 'fatal',
  error: 'error',
  err: 'error',
  warn: 'warn',
  warning: 'warn',
  info: 'info',
  information: 'info',
  notice: 'info',
  debug: 'debug',
  dbg: 'debug',
  verbose: 'debug',
  trace: 'trace',
  silly: 'trace',
}

function levelFromNumber(n) {
  if (n >= 60) return 'fatal'
  if (n >= 50) return 'error'
  if (n >= 40) return 'warn'
  if (n >= 30) return 'info'
  if (n >= 20) return 'debug'
  if (n >= 10) return 'trace'
  return 'unknown'
}

function normalizeLevel(value) {
  if (value == null) return null
  if (typeof value === 'number') return Number.isFinite(value) ? levelFromNumber(value) : null
  const s = String(value).toLowerCase().trim()
  if (!s) return null
  if (LEVEL_ALIASES[s]) return LEVEL_ALIASES[s]
  if (/^\d+$/.test(s)) return levelFromNumber(Number(s))
  if (s.startsWith('level_')) return normalizeLevel(s.slice(6))
  return null
}

const LEVEL_WORDS =
  'trace|debug|info|information|notice|warn|warning|error|err|fatal|critical|crit|alert|emerg|emergency|panic|silly|verbose|dbg'

// Nível no INÍCIO da mensagem, com delimitadores opcionais: [ERROR] / ERROR: / (warn) / - info -
const LEVEL_PREFIX_RE = new RegExp(
  '^\\s*[[(<]?\\s*(' + LEVEL_WORDS + ')\\s*[\\])>]?\\s*(?::|[-\\u2013\\u2014])?\\s+',
  'i',
)

// Nível em qualquer lugar do trecho inicial da linha (fallback).
const LEVEL_TOKEN_RE = new RegExp(
  '(?:^|[\\s[\\(<])(' + LEVEL_WORDS + ')(?=$|[\\s\\]\\)><:,\\-])',
  'i',
)

const TIMESTAMP_RE = /(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2}:\d{2})(?:[.,](\d{1,9}))?\s*(Z|[+-]\d{2}:?\d{2})?/
const SYSLOG_RE = /^([A-Z][a-z]{2}\s{1,2}\d{1,2}\s+\d{2}:\d{2}:\d{2})/
const TIME_ONLY_RE = /^(\d{2}:\d{2}:\d{2})(?:[.,](\d{1,9}))?(\s|$)/
const DOCKER_PREFIX_RE = /^([A-Za-z0-9_.\-/]+)\s{1,4}\|\s?/

function toEpoch(value) {
  if (value == null) return null
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return null
    return value > 1e11 ? Math.round(value) : Math.round(value * 1000)
  }
  const raw = String(value).trim()
  if (!raw) return null
  if (/^\d+$/.test(raw)) return toEpoch(Number(raw))
  // Nanossegundos (RFC3339 do docker) estouram o Date — trunca em milissegundos.
  const m = raw.match(/^(.*[.,]\d{3})\d+(Z|[+-]\d{2}:?\d{2})?$/)
  const norm = m ? m[1].replace(',', '.') + (m[2] || '') : raw.replace(',', '.')
  const ms = Date.parse(norm)
  return Number.isNaN(ms) ? null : ms
}

function resolveLevel(message) {
  const prefix = message.match(LEVEL_PREFIX_RE)
  if (prefix) {
    return { level: normalizeLevel(prefix[1]) || 'unknown', message: message.slice(prefix[0].length).trim() }
  }
  const token = message.slice(0, 60).match(LEVEL_TOKEN_RE)
  if (token) return { level: normalizeLevel(token[1]) || 'unknown', message }
  return { level: 'unknown', message }
}

function parseJsonLine(rest) {
  if (rest.charAt(0) !== '{') return null
  let obj
  try {
    obj = JSON.parse(rest)
  } catch (e) {
    return null
  }
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return null

  const source = obj.container || obj.service || obj.serviceName || obj.name || obj.hostname || null
  const time = toEpoch(
    obj.time !== undefined ? obj.time
      : obj.timestamp !== undefined ? obj.timestamp
        : obj['@timestamp'] !== undefined ? obj['@timestamp']
          : obj.ts !== undefined ? obj.ts
            : obj.date !== undefined ? obj.date : obj.datetime,
  )
  let level = normalizeLevel(
    obj.level !== undefined ? obj.level
      : obj.severity !== undefined ? obj.severity
        : obj.lvl !== undefined ? obj.lvl
          : obj.levelname !== undefined ? obj.levelname
            : obj.loglevel !== undefined ? obj.loglevel : obj.logLevel,
  )

  let message = obj.msg !== undefined ? obj.msg
    : obj.message !== undefined ? obj.message
      : obj.log !== undefined ? obj.log
        : obj.text !== undefined ? obj.text
          : obj.event !== undefined ? obj.event : obj.payload
  if (message == null) message = rest
  if (typeof message !== 'string') {
    try {
      message = JSON.stringify(message)
    } catch (e) {
      message = String(message)
    }
  }
  message = message.replace(/\s+$/, '')
  if (level == null) {
    const resolved = resolveLevel(message)
    level = resolved.level
    message = resolved.message
  }
  return { source, time, timeText: null, level, message, json: obj }
}

function parsePlainLine(text) {
  let rest = text

  let time = null
  let timeText = null

  const ts = rest.match(TIMESTAMP_RE)
  if (ts) {
    time = toEpoch(ts[1] + 'T' + ts[2] + (ts[3] ? '.' + ts[3].slice(0, 3) : '') + (ts[4] || ''))
    timeText = ts[0]
    rest = rest.slice(0, ts.index) + rest.slice(ts.index + ts[0].length)
  } else {
    const sys = rest.match(SYSLOG_RE)
    if (sys) {
      timeText = sys[1]
      rest = rest.slice(sys[1].length)
    } else {
      const tonly = rest.match(TIME_ONLY_RE)
      if (tonly) {
        timeText = tonly[1] + (tonly[2] && tonly[2] !== ' ' ? '.' + tonly[2] : '')
        rest = rest.slice(tonly[0].length)
      }
    }
  }

  let message = rest.replace(/\s+/g, ' ').replace(/^[\s|\-:\u2013\u2014]+/, '').trim()
  if (!message) message = text.trim()

  const resolved = resolveLevel(message)
  return { time, timeText, level: resolved.level, message: resolved.message, json: null }
}

function parseLine(text, line) {
  let body = text
  let source = null
  const dp = body.match(DOCKER_PREFIX_RE)
  if (dp) {
    source = dp[1]
    body = body.slice(dp[0].length)
  }

  let parsed = null
  if (body.charAt(0) === '{') parsed = parseJsonLine(body)
  if (!parsed) parsed = parsePlainLine(body)

  return {
    line,
    raw: text,
    level: parsed.level || 'unknown',
    time: parsed.time != null ? parsed.time : null,
    timeText: parsed.timeText,
    source: source || parsed.source || null,
    message: parsed.message || text.trim(),
    json: parsed.json,
  }
}

export function parseLogs(text, options = {}) {
  const maxLines = options.maxLines || 20000
  const lines = String(text == null ? '' : text).split('\n')
  const entries = []
  let truncated = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (!line.trim()) continue
    if (entries.length >= maxLines) {
      truncated = true
      break
    }
    entries.push(parseLine(line, i + 1))
  }

  return { entries, truncated, lineCount: lines.length }
}

export function summarize(entries) {
  const counts = {}
  for (const level of LEVELS) counts[level] = 0
  let withTime = 0
  for (const entry of entries) {
    counts[entry.level] = (counts[entry.level] || 0) + 1
    if (entry.time != null) withTime += 1
  }
  return { total: entries.length, withTime, counts }
}

const NICE_INTERVALS = [
  1000, 2000, 5000, 10000, 15000, 30000, 60000, 120000, 300000, 600000,
  900000, 1800000, 3600000, 7200000, 21600000, 43200000, 86400000, 259200000,
]

export function buildTimeline(entries, target = 30) {
  let min = Infinity
  let max = -Infinity
  let timed = 0
  for (const entry of entries) {
    if (entry.time == null) continue
    timed += 1
    if (entry.time < min) min = entry.time
    if (entry.time > max) max = entry.time
  }
  if (timed < 2 || !Number.isFinite(min)) return null

  const span = max - min
  const raw = span / target
  let interval = NICE_INTERVALS.find((n) => n >= raw)
  if (!interval) interval = Math.ceil(raw)

  const count = span === 0 ? 1 : Math.min(60, Math.floor(span / interval) + 1)
  const buckets = []
  for (let i = 0; i < count; i++) {
    const counts = {}
    for (const level of LEVELS) counts[level] = 0
    buckets.push({ start: min + i * interval, counts, total: 0 })
  }

  for (const entry of entries) {
    if (entry.time == null) continue
    const idx = Math.min(count - 1, Math.floor((entry.time - min) / interval))
    const bucket = buckets[idx]
    bucket.counts[entry.level] = (bucket.counts[entry.level] || 0) + 1
    bucket.total += 1
  }

  let maxTotal = 0
  for (const bucket of buckets) if (bucket.total > maxTotal) maxTotal = bucket.total

  return { min, max, interval, buckets, maxTotal: maxTotal || 1, timed }
}

function pad(n, size) {
  const s = String(n)
  return s.length >= size ? s : '0'.repeat(size - s.length) + s
}

export function formatTime(ms) {
  const d = new Date(ms)
  return (
    pad(d.getHours(), 2) + ':' + pad(d.getMinutes(), 2) + ':' + pad(d.getSeconds(), 2) +
    '.' + pad(d.getMilliseconds(), 3)
  )
}

export function formatDateTime(ms) {
  const d = new Date(ms)
  return (
    d.getFullYear() + '-' + pad(d.getMonth() + 1, 2) + '-' + pad(d.getDate(), 2) + ' ' +
    pad(d.getHours(), 2) + ':' + pad(d.getMinutes(), 2) + ':' + pad(d.getSeconds(), 2) + '.' +
    pad(d.getMilliseconds(), 3)
  )
}

export function formatInterval(ms) {
  if (ms < 1000) return ms + ' ms'
  if (ms < 60000) return ms / 1000 + ' s'
  if (ms < 3600000) return Math.round(ms / 60000) + ' min'
  if (ms < 86400000) return Math.round(ms / 3600000) + ' h'
  return Math.round(ms / 86400000) + ' d'
}
