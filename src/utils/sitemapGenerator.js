// Gerador de sitemap.xml (protocolo Sitemaps.org)
// 100% client-side: monta a string XML a partir de entradas editáveis e
// emite avisos de validação sem nunca enviar dados pra fora do navegador.

const VALID_CHANGEFREQ = new Set([
  'always',
  'hourly',
  'daily',
  'weekly',
  'monthly',
  'yearly',
  'never',
])

const XML_PROLOG = '<?xml version="1.0" encoding="UTF-8"?>'

export function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export function todayIso() {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function isAbsoluteUrl(url) {
  return /^https?:\/\//i.test(String(url).trim())
}

export function toAbsoluteUrl(url, baseHost) {
  const trimmed = String(url).trim()
  if (!trimmed) return ''
  if (isAbsoluteUrl(trimmed)) return trimmed
  if (!baseHost) return trimmed
  const base = String(baseHost).trim().replace(/\/$/, '')
  const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
  return `${base}${path}`
}

export function validateUrl(url) {
  const trimmed = String(url).trim()
  if (!trimmed) return { ok: false, error: 'empty' }
  try {
    // eslint-disable-next-line no-new
    new URL(trimmed)
    return { ok: true, error: null }
  } catch {
    return { ok: false, error: 'invalid' }
  }
}

export function validateLastmod(value) {
  if (!value) return { ok: true, error: null }
  // Aceita YYYY-MM-DD ou datetime ISO completo (com ou sem timezone)
  const ok = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{1,3})?(Z|[+-]\d{2}:\d{2})?)?$/.test(value)
  return { ok, error: ok ? null : 'invalid' }
}

export function validatePriority(value) {
  if (value === '' || value == null) return { ok: true, error: null }
  const n = Number(value)
  if (Number.isNaN(n)) return { ok: false, error: 'nan' }
  if (n < 0 || n > 1) return { ok: false, error: 'range' }
  return { ok: true, error: null }
}

export function validateChangefreq(value) {
  if (!value) return { ok: true, error: null }
  const ok = VALID_CHANGEFREQ.has(value)
  return { ok, error: ok ? null : 'invalid' }
}

export function buildSitemapXml(entries, options = {}) {
  const {
    baseHost = '',
    includeLastmod = true,
    pretty = true,
    indent = '  ',
  } = options

  const lines = []
  lines.push(XML_PROLOG)
  lines.push('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')

  for (const entry of entries) {
    const loc = toAbsoluteUrl(entry.loc, baseHost)
    if (!loc) continue

    const lastmod = includeLastmod ? String(entry.lastmod || '').trim() : ''
    const changefreq = String(entry.changefreq || '').trim()
    const priority = entry.priority === '' || entry.priority == null
      ? ''
      : String(entry.priority).trim()

    if (pretty) {
      lines.push(`${indent}<url>`)
      lines.push(`${indent}${indent}<loc>${escapeXml(loc)}</loc>`)
      if (lastmod) lines.push(`${indent}${indent}<lastmod>${escapeXml(lastmod)}</lastmod>`)
      if (changefreq) lines.push(`${indent}${indent}<changefreq>${escapeXml(changefreq)}</changefreq>`)
      if (priority !== '') lines.push(`${indent}${indent}<priority>${escapeXml(priority)}</priority>`)
      lines.push(`${indent}</url>`)
    } else {
      const parts = [`<loc>${escapeXml(loc)}</loc>`]
      if (lastmod) parts.push(`<lastmod>${escapeXml(lastmod)}</lastmod>`)
      if (changefreq) parts.push(`<changefreq>${escapeXml(changefreq)}</changefreq>`)
      if (priority !== '') parts.push(`<priority>${escapeXml(priority)}</priority>`)
      lines.push(`<url>${parts.join('')}</url>`)
    }
  }

  lines.push('</urlset>')
  return lines.join(pretty ? '\n' : '')
}

export function validateEntry(entry, index, baseHost) {
  const errors = []
  const rawLoc = String(entry.loc || '').trim()
  const loc = toAbsoluteUrl(rawLoc, baseHost)

  if (!rawLoc) {
    errors.push({ index, field: 'loc', type: 'empty' })
  } else {
    const urlCheck = validateUrl(loc)
    if (!urlCheck.ok) errors.push({ index, field: 'loc', type: urlCheck.error })
    else if (!isAbsoluteUrl(loc)) errors.push({ index, field: 'loc', type: 'relative' })
  }

  const lastmod = String(entry.lastmod || '').trim()
  if (lastmod) {
    const check = validateLastmod(lastmod)
    if (!check.ok) errors.push({ index, field: 'lastmod', type: check.error })
  }

  const changefreq = String(entry.changefreq || '').trim()
  if (changefreq) {
    const check = validateChangefreq(changefreq)
    if (!check.ok) errors.push({ index, field: 'changefreq', type: check.error })
  }

  if (entry.priority !== '' && entry.priority != null) {
    const check = validatePriority(entry.priority)
    if (!check.ok) errors.push({ index, field: 'priority', type: check.error })
  }

  return errors
}

export function buildWarnings(entries, baseHost) {
  const warnings = []
  const seen = new Set()
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i]
    const loc = toAbsoluteUrl(entry.loc, baseHost)
    if (!loc) continue
    if (seen.has(loc)) warnings.push({ index: i, type: 'duplicate', loc })
    seen.add(loc)
  }
  return warnings
}
