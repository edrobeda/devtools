// Analisador de cabeçalhos de cache HTTP — 100% client-side.
// Faz parse de uma resposta HTTP crua (ou semente dos cabeçalhos),
// extrai as diretivas de Cache-Control e calcula TTL, revalidação,
// cacheabilidade e alertas de conflito.

export const CACHEABLE_STATUS_CODES = new Set([
  200, 203, 204, 206, 300, 301, 302, 304, 307, 308, 404, 405, 410, 414, 501,
])

export const CACHEABLE_BY_DEFAULT = new Set([200, 203, 204, 206, 300, 301, 308, 404, 405, 410, 414, 501])

const DIRECTIVE_DEFINITIONS = {
  'max-age': { type: 'seconds', pt: 'TTL em segundos', en: 'TTL in seconds' },
  's-maxage': { type: 'seconds', pt: 'TTL em caches compartilhados (segundos)', en: 'TTL in shared caches (seconds)' },
  'no-cache': { type: 'flag', pt: 'Revalidar antes de usar', en: 'Revalidate before use' },
  'no-store': { type: 'flag', pt: 'Não armazenar em cache', en: 'Do not store' },
  'private': { type: 'flag', pt: 'Apenas cache do navegador', en: 'Browser cache only' },
  'public': { type: 'flag', pt: 'Cache público permitido', en: 'Public cache allowed' },
  'must-revalidate': { type: 'flag', pt: 'Obedecer TTL estritamente', en: 'Strict TTL obedience' },
  'proxy-revalidate': { type: 'flag', pt: 'Revalidação obrigatória em proxies', en: 'Mandatory proxy revalidation' },
  'immutable': { type: 'flag', pt: 'Conteúdo não muda durante a vida útil', en: 'Content does not change during lifetime' },
  'no-transform': { type: 'flag', pt: 'Proibir transformação do corpo', en: 'Disallow body transformation' },
  'stale-while-revalidate': { type: 'seconds', pt: 'Servir stale por X segundos enquanto revalida', en: 'Serve stale for X seconds while revalidating' },
  'stale-if-error': { type: 'seconds', pt: 'Servir stale por X segundos em erro', en: 'Serve stale for X seconds on error' },
}

export function parseStatusLine(line) {
  const trimmed = line.trim()
  if (!trimmed.startsWith('HTTP/')) return null
  const match = trimmed.match(/^HTTP\/(\d\.\d)\s+(\d{3})(?:\s+(.*))?$/)
  if (!match) return null
  return { version: match[1], status: parseInt(match[2], 10), reason: match[3] || '' }
}

export function parseHeaders(raw) {
  const lines = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
  let statusLine = null
  let started = false
  const headers = []

  for (const rawLine of lines) {
    const line = rawLine.trimEnd()
    if (!started) {
      const parsed = parseStatusLine(line)
      if (parsed) {
        statusLine = parsed
        started = true
        continue
      }
      // Sem status line — trata a primeira linha não vazia como cabeçalho
      if (line.trim() === '') continue
      started = true
    }
    if (line.trim() === '') continue
    const idx = line.indexOf(':')
    if (idx === -1) {
      // Pode ser continuação de cabeçalho RFC 2616 (começa com espaço)
      if (line.startsWith(' ') || line.startsWith('\t')) {
        const last = headers[headers.length - 1]
        if (last) last.value += ' ' + line.trim()
      }
      continue
    }
    const name = line.slice(0, idx).trim()
    const value = line.slice(idx + 1).trim()
    headers.push({ name, value, original: line })
  }

  // Agrupa cabeçalhos repetidos (Cache-Control costuma vir numa linha só,
  // mas técnicamente pode ser combinado por vírgula).
  const byName = new Map()
  for (const h of headers) {
    const key = h.name.toLowerCase()
    const existing = byName.get(key)
    if (existing) {
      existing.value += ', ' + h.value
    } else {
      byName.set(key, { name: h.name, value: h.value })
    }
  }

  return { statusLine, headers: Array.from(byName.values()) }
}

export function getHeader(parsed, name) {
  const key = name.toLowerCase()
  const h = parsed.headers.find((h) => h.name.toLowerCase() === key)
  return h ? h.value.trim() : null
}

export function parseCacheControl(value) {
  if (!value) return { directives: [], raw: '' }
  const directives = []
  const parts = value.split(',').map((s) => s.trim()).filter(Boolean)
  for (const part of parts) {
    const [rawName, rawVal] = part.split('=', 2)
    const name = rawName.trim().toLowerCase()
    const val = rawVal === undefined ? null : rawVal.trim()
    const def = DIRECTIVE_DEFINITIONS[name]
    const parsedVal = def && def.type === 'seconds' && val !== null ? parseInt(val, 10) : val
    directives.push({
      name,
      value: parsedVal,
      raw: part,
      definition: def,
      isValid: def !== undefined && (def.type === 'flag' ? val === null : Number.isFinite(parsedVal)),
    })
  }
  return { directives, raw: value }
}

function directiveValue(directives, name) {
  const d = directives.find((d) => d.name === name)
  return d ? d.value : undefined
}

function hasDirective(directives, name) {
  return directives.some((d) => d.name === name)
}

export function parseHttpDate(value) {
  if (!value) return null
  const ts = Date.parse(value)
  return Number.isNaN(ts) ? null : new Date(ts)
}

export function formatDuration(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0s'
  const units = [
    { label: 'd', value: 86400 },
    { label: 'h', value: 3600 },
    { label: 'm', value: 60 },
    { label: 's', value: 1 },
  ]
  let remaining = Math.round(seconds)
  const parts = []
  for (const u of units) {
    if (remaining >= u.value) {
      const n = Math.floor(remaining / u.value)
      parts.push(`${n}${u.label}`)
      remaining -= n * u.value
    }
  }
  return parts.length ? parts.join(' ') : '0s'
}

export function analyzeCache(rawHeaders, now = new Date()) {
  const parsed = parseHeaders(rawHeaders)
  const statusLine = parsed.statusLine || { status: 200, version: '1.1', reason: 'OK' }
  const cc = parseCacheControl(getHeader(parsed, 'cache-control'))
  const directives = cc.directives

  const expires = parseHttpDate(getHeader(parsed, 'expires'))
  const date = parseHttpDate(getHeader(parsed, 'date'))
  const ageHeader = getHeader(parsed, 'age')
  const age = ageHeader ? parseInt(ageHeader, 10) : null
  const etag = getHeader(parsed, 'etag')
  const lastModified = parseHttpDate(getHeader(parsed, 'last-modified'))
  const vary = getHeader(parsed, 'vary')

  const maxAge = directiveValue(directives, 'max-age')
  const sMaxage = directiveValue(directives, 's-maxage')
  const staleWhileRevalidate = directiveValue(directives, 'stale-while-revalidate')
  const staleIfError = directiveValue(directives, 'stale-if-error')

  const hasNoStore = hasDirective(directives, 'no-store')
  const hasNoCache = hasDirective(directives, 'no-cache')
  const hasPrivate = hasDirective(directives, 'private')
  const hasPublic = hasDirective(directives, 'public')
  const hasMustRevalidate = hasDirective(directives, 'must-revalidate')
  const hasProxyRevalidate = hasDirective(directives, 'proxy-revalidate')
  const hasImmutable = hasDirective(directives, 'immutable')

  // TTL efetivo: max-age tem precedência sobre Expires
  let effectiveTtl = null
  let ttlSource = null
  if (Number.isFinite(maxAge)) {
    effectiveTtl = maxAge
    ttlSource = 'max-age'
  } else if (date && expires) {
    effectiveTtl = Math.max(0, Math.floor((expires.getTime() - date.getTime()) / 1000))
    ttlSource = 'expires'
  } else if (expires) {
    effectiveTtl = Math.max(0, Math.floor((expires.getTime() - now.getTime()) / 1000))
    ttlSource = 'expires'
  }

  // TTL para cache compartilhado considera s-maxage
  const sharedTtl = Number.isFinite(sMaxage) ? sMaxage : effectiveTtl

  // Idade da resposta já armazenada
  let currentAge = 0
  if (Number.isFinite(age)) {
    currentAge = age
  } else if (date) {
    currentAge = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 1000))
  }

  const remainingTtl = effectiveTtl !== null ? Math.max(0, effectiveTtl - currentAge) : null
  const sharedRemainingTtl = sharedTtl !== null ? Math.max(0, sharedTtl - currentAge) : null

  // Decisão de cacheabilidade
  let cacheable = true
  let scope = 'public'
  let reason = ''

  if (!CACHEABLE_STATUS_CODES.has(statusLine.status)) {
    cacheable = false
    reason = 'Status code not cacheable by default'
  } else if (!CACHEABLE_BY_DEFAULT.has(statusLine.status)) {
    reason = 'Cacheable only when explicitly allowed by Cache-Control'
  }

  if (hasNoStore) {
    cacheable = false
    reason = 'no-store prevents storage'
  } else if (hasPrivate) {
    scope = 'private'
    reason = 'private — browser cache only'
  } else if (hasPublic) {
    scope = 'public'
    reason = 'public — shared caches may store'
  }

  // Authorization sem public/s-maxage geralmente impede cache compartilhado
  const auth = getHeader(parsed, 'authorization')
  if (auth && !hasPublic && !Number.isFinite(sMaxage)) {
    scope = 'private'
    if (!reason) reason = 'Authorization present without public/s-maxage — shared caches will not store'
  }

  // Vary: * proíbe cache compartilhado
  if (vary && vary.trim() === '*') {
    cacheable = false
    reason = 'Vary: * prevents caching'
  }

  // Set-Cookie sem proteção
  const setCookie = getHeader(parsed, 'set-cookie')
  const cookieWarning = !!setCookie && !hasPrivate && !hasNoStore

  // Alertas
  const warnings = []
  if (hasNoStore && (Number.isFinite(maxAge) || Number.isFinite(sMaxage))) {
    warnings.push('no-store makes max-age/s-maxage ineffective')
  }
  if (hasNoCache && hasImmutable) {
    warnings.push('immutable contradicts no-cache')
  }
  if (Number.isFinite(age) && effectiveTtl !== null && age > effectiveTtl) {
    warnings.push('Age exceeds TTL — response is already stale')
  }
  if (expires && !hasNoStore && !Number.isFinite(maxAge) && ttlSource === 'expires' && effectiveTtl === 0) {
    warnings.push('Expires is in the past or equal to Date')
  }
  if (hasPrivate && Number.isFinite(sMaxage)) {
    warnings.push('s-maxage is ignored when private is present')
  }
  if (cookieWarning) {
    warnings.push('Set-Cookie without private/no-store can leak sessions through shared caches')
  }
  if (!hasNoStore && !hasNoCache && effectiveTtl === null && !expires) {
    warnings.push('No explicit freshness information — heuristic caching may apply')
  }
  if (statusLine.status === 302 && !Number.isFinite(maxAge) && !expires) {
    warnings.push('302 without Cache-Control/Expires is historically cached heuristically')
  }

  return {
    statusLine,
    directives,
    expires,
    date,
    age,
    etag,
    lastModified,
    vary,
    maxAge,
    sMaxage,
    staleWhileRevalidate,
    staleIfError,
    hasNoStore,
    hasNoCache,
    hasPrivate,
    hasPublic,
    hasMustRevalidate,
    hasProxyRevalidate,
    hasImmutable,
    effectiveTtl,
    sharedTtl,
    ttlSource,
    currentAge,
    remainingTtl,
    sharedRemainingTtl,
    cacheable,
    scope,
    reason,
    warnings,
    setCookie,
    auth,
  }
}

export function generateMarkdownSummary(analysis, lang = 'pt') {
  const t = {
    pt: {
      status: 'Status',
      ttl: 'TTL efetivo',
      source: 'Fonte',
      age: 'Idade atual',
      remaining: 'Restante',
      scope: 'Escopo',
      cacheable: 'Cacheável',
      yes: 'Sim',
      no: 'Não',
      directives: 'Diretivas Cache-Control',
      warnings: 'Alertas',
    },
    en: {
      status: 'Status',
      ttl: 'Effective TTL',
      source: 'Source',
      age: 'Current age',
      remaining: 'Remaining',
      scope: 'Scope',
      cacheable: 'Cacheable',
      yes: 'Yes',
      no: 'No',
      directives: 'Cache-Control directives',
      warnings: 'Warnings',
    },
  }[lang]

  const lines = []
  lines.push(`## HTTP Cache Analysis`)
  lines.push(`- ${t.status}: ${analysis.statusLine.status} ${analysis.statusLine.reason}`)
  lines.push(`- ${t.cacheable}: ${analysis.cacheable ? t.yes : t.no}`)
  lines.push(`- ${t.scope}: ${analysis.scope}`)
  if (analysis.effectiveTtl !== null) {
    lines.push(`- ${t.ttl}: ${formatDuration(analysis.effectiveTtl)}`)
    lines.push(`- ${t.source}: ${analysis.ttlSource}`)
  }
  if (analysis.currentAge) {
    lines.push(`- ${t.age}: ${formatDuration(analysis.currentAge)}`)
  }
  if (analysis.remainingTtl !== null) {
    lines.push(`- ${t.remaining}: ${formatDuration(analysis.remainingTtl)}`)
  }
  lines.push(`- ${t.directives}: ${analysis.directives.map((d) => d.raw).join(', ') || 'none'}`)
  if (analysis.warnings.length) {
    lines.push(`- ${t.warnings}: ${analysis.warnings.join('; ')}`)
  }
  return lines.join('\n')
}

// Cenários rápidos de exemplo
export const PRESETS = {
  pt: [
    { key: 'static', label: 'Asset estático versionado', raw: `HTTP/1.1 200 OK\nCache-Control: public, max-age=31536000, immutable\nContent-Type: application/javascript` },
    { key: 'api', label: 'Resposta de API curta', raw: `HTTP/1.1 200 OK\nCache-Control: private, no-cache\nContent-Type: application/json` },
    { key: 'cdn', label: 'CDN com stale-while-revalidate', raw: `HTTP/1.1 200 OK\nCache-Control: public, max-age=300, s-maxage=3600, stale-while-revalidate=86400\nAge: 120\nContent-Type: text/html` },
    { key: 'nocache', label: 'Sem cache', raw: `HTTP/1.1 200 OK\nCache-Control: no-store, no-cache, must-revalidate\nPragma: no-cache\nExpires: 0\nContent-Type: text/html` },
    { key: 'conflict', label: 'Conflito comum', raw: `HTTP/1.1 200 OK\nCache-Control: no-store, max-age=3600, public\nSet-Cookie: session=abc123; HttpOnly\nContent-Type: text/html` },
  ],
  en: [
    { key: 'static', label: 'Versioned static asset', raw: `HTTP/1.1 200 OK\nCache-Control: public, max-age=31536000, immutable\nContent-Type: application/javascript` },
    { key: 'api', label: 'Short API response', raw: `HTTP/1.1 200 OK\nCache-Control: private, no-cache\nContent-Type: application/json` },
    { key: 'cdn', label: 'CDN with stale-while-revalidate', raw: `HTTP/1.1 200 OK\nCache-Control: public, max-age=300, s-maxage=3600, stale-while-revalidate=86400\nAge: 120\nContent-Type: text/html` },
    { key: 'nocache', label: 'No cache', raw: `HTTP/1.1 200 OK\nCache-Control: no-store, no-cache, must-revalidate\nPragma: no-cache\nExpires: 0\nContent-Type: text/html` },
    { key: 'conflict', label: 'Common conflict', raw: `HTTP/1.1 200 OK\nCache-Control: no-store, max-age=3600, public\nSet-Cookie: session=abc123; HttpOnly\nContent-Type: text/html` },
  ],
}
