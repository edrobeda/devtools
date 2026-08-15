/**
 * Retry policy calculator — 100% client-side.
 *
 * Computes an exponential backoff schedule with optional jitter.
 * Useful for sizing retry windows of API calls, background jobs and
 * queue consumers.
 */

export const JITTER_MODES = ['none', 'full', 'equal', 'decorrelated']

export const RETRY_PRESETS = [
  {
    key: 'conservative',
    labelPt: 'Conservador',
    labelEn: 'Conservative',
    retries: 5,
    baseDelayMs: 1000,
    multiplier: 2,
    capMs: 30000,
    jitter: 'equal',
  },
  {
    key: 'aggressive',
    labelPt: 'Agressivo',
    labelEn: 'Aggressive',
    retries: 8,
    baseDelayMs: 100,
    multiplier: 2,
    capMs: 5000,
    jitter: 'decorrelated',
  },
  {
    key: 'api-call',
    labelPt: 'Chamada de API',
    labelEn: 'API call',
    retries: 3,
    baseDelayMs: 500,
    multiplier: 2,
    capMs: 10000,
    jitter: 'full',
  },
  {
    key: 'background-job',
    labelPt: 'Job em background',
    labelEn: 'Background job',
    retries: 10,
    baseDelayMs: 2000,
    multiplier: 2,
    capMs: 60000,
    jitter: 'equal',
  },
]

// Deterministic pseudo-random generator so the same inputs always render the
// same illustrative jitter values. Not cryptographic.
function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function seedFromParams(params) {
  const s = `${params.retries}|${params.baseDelayMs}|${params.multiplier}|${params.capMs}|${params.jitter}`
  let h = 1779033703
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    return (h >>> 0) / 4294967296
  }
}

export function calculateRetrySchedule({ retries, baseDelayMs, multiplier, capMs, jitter }) {
  const safeRetries = Math.max(0, Math.min(retries, 100))
  const safeBase = Math.max(0, baseDelayMs)
  const safeMult = Math.max(1, multiplier)
  const safeCap = Math.max(0, capMs)
  const rnd = seedFromParams({
    retries: safeRetries,
    baseDelayMs: safeBase,
    multiplier: safeMult,
    capMs: safeCap,
    jitter,
  })

  const schedule = []
  let cumulativeMs = 0
  let previousDelay = safeBase

  for (let i = 0; i <= safeRetries; i++) {
    if (i === 0) {
      schedule.push({
        attempt: 1,
        type: 'initial',
        baseDelayMs: 0,
        jitterMs: 0,
        actualDelayMs: 0,
        cumulativeMs: 0,
      })
      continue
    }

    const raw = Math.min(safeBase * Math.pow(safeMult, i - 1), safeCap)
    let actual = raw
    if (jitter === 'full') {
      actual = rnd() * raw
    } else if (jitter === 'equal') {
      actual = raw / 2 + rnd() * (raw / 2)
    } else if (jitter === 'decorrelated') {
      actual = Math.min(safeCap, rnd() * previousDelay * 2)
    }
    actual = Math.max(0, actual)
    previousDelay = actual
    cumulativeMs += actual

    schedule.push({
      attempt: i + 1,
      type: 'retry',
      baseDelayMs: raw,
      jitterMs: actual,
      actualDelayMs: actual,
      cumulativeMs,
    })
  }

  return schedule
}

export function formatDurationMs(ms) {
  const abs = Math.abs(ms)
  if (abs < 1000) return `${formatNumber(ms)} ms`
  if (abs < 60000) return `${formatNumber(ms / 1000)} s`
  if (abs < 3600000) return `${formatNumber(ms / 60000)} min`
  return `${formatNumber(ms / 3600000)} h`
}

export function formatNumber(value, digits = 2) {
  if (Number.isNaN(value)) return '—'
  return Number(value).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  })
}

export const jsExample = `function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchWithRetry(url, options = {}, {
  retries = 3,
  baseDelayMs = 500,
  multiplier = 2,
  capMs = 10000,
  jitter = 'equal',
} = {}) {
  let attempt = 0
  while (attempt <= retries) {
    try {
      const res = await fetch(url, options)
      if (res.ok) return res
      throw new Error('HTTP ' + res.status)
    } catch (err) {
      if (attempt === retries) throw err
      const raw = Math.min(baseDelayMs * Math.pow(multiplier, attempt), capMs)
      let delay = raw
      if (jitter === 'full') delay = Math.random() * raw
      else if (jitter === 'equal') delay = raw / 2 + Math.random() * (raw / 2)
      else if (jitter === 'decorrelated') {
        delay = Math.min(capMs, Math.random() * delay * 2)
      }
      await sleep(delay)
      attempt++
    }
  }
}`

export const pythonExample = `import random
import time

def fetch_with_retry(
    fetch,
    retries=3,
    base_delay_ms=500,
    multiplier=2,
    cap_ms=10000,
    jitter='equal',
):
    delay = base_delay_ms
    for attempt in range(retries + 1):
        try:
            return fetch()
        except Exception as e:
            if attempt == retries:
                raise e
            if jitter == 'full':
                wait = random.random() * delay
            elif jitter == 'equal':
                wait = delay / 2 + random.random() * (delay / 2)
            elif jitter == 'decorrelated':
                wait = min(cap_ms, random.random() * delay * 2)
            else:
                wait = delay
            time.sleep(wait / 1000)
            delay = min(delay * multiplier, cap_ms)
    return None`

export const bashExample = `# Exponential backoff ilustrativo em bash
retries=5
base=1000      # ms
multiplier=2
cap=30000
i=0
delay=$base

while [ $i -lt $retries ]; do
  if some_command; then
    echo "OK"
    break
  fi
  echo "retry $((i+1)): esperando \${delay}ms"
  sleep $(awk "BEGIN {print $delay/1000}")
  delay=$((delay * multiplier))
  [ $delay -gt $cap ] && delay=$cap
  i=$((i+1))
done`
