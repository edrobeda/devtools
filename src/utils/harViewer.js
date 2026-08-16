// Utilitários para análise de arquivos HAR (HTTP Archive) 100% client-side.
// Nenhum dado sai do navegador.

export function parseHar(text) {
  try {
    const data = JSON.parse(text)
    if (!data || typeof data !== 'object' || !data.log || !Array.isArray(data.log.entries)) {
      return { ok: false, error: 'Invalid HAR: expected an object with log.entries array.' }
    }
    return { ok: true, data }
  } catch (err) {
    return { ok: false, error: err.message }
  }
}

export function summarizeHar(data) {
  const entries = data?.log?.entries || []
  let totalSize = 0
  let totalTime = 0
  const domains = new Set()
  const methods = {}
  const statusGroups = { success: 0, redirect: 0, clientError: 0, serverError: 0, other: 0 }
  const types = {}

  entries.forEach((entry) => {
    const req = entry.request || {}
    const res = entry.response || {}

    const size = Math.max(0, res.bodySize ?? res._transferSize ?? res.content?.size ?? 0)
    const time = Math.max(0, entry.time ?? 0)
    totalSize += size
    totalTime += time

    let hostname = ''
    try {
      hostname = new URL(req.url).hostname
    } catch {
      hostname = req.url || ''
    }
    if (hostname) domains.add(hostname)

    const method = (req.method || 'GET').toUpperCase()
    methods[method] = (methods[method] || 0) + 1

    const status = res.status || 0
    if (status >= 200 && status < 300) statusGroups.success += 1
    else if (status >= 300 && status < 400) statusGroups.redirect += 1
    else if (status >= 400 && status < 500) statusGroups.clientError += 1
    else if (status >= 500 && status < 600) statusGroups.serverError += 1
    else statusGroups.other += 1

    const mime = (res.content && res.content.mimeType) || 'unknown'
    const type = mime.split(';')[0].trim()
    types[type] = (types[type] || 0) + 1
  })

  return {
    totalRequests: entries.length,
    totalSize,
    totalTime,
    domains: Array.from(domains).sort(),
    methods,
    statusGroups,
    types,
  }
}

export function filterEntries(data, filters) {
  const { search = '', method = '', status = '', type = '', domain = '' } = filters || {}
  const entries = data?.log?.entries || []
  return entries.filter((entry) => {
    const req = entry.request || {}
    const res = entry.response || {}

    if (method && (req.method || '').toUpperCase() !== method.toUpperCase()) return false
    if (status && String(res.status || '') !== String(status)) return false
    if (type) {
      const mime = (res.content && res.content.mimeType) || ''
      if (!mime.toLowerCase().includes(type.toLowerCase())) return false
    }
    if (domain) {
      let hostname = ''
      try {
        hostname = new URL(req.url).hostname
      } catch {}
      if (!hostname.includes(domain)) return false
    }
    if (search) {
      const haystack = `${req.method || ''} ${req.url || ''} ${res.status || ''} ${res.statusText || ''}`.toLowerCase()
      if (!haystack.includes(search.toLowerCase())) return false
    }
    return true
  })
}

export function formatBytes(bytes) {
  if (bytes === 0 || Number.isNaN(bytes)) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1)
  return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`
}

export function formatDuration(ms) {
  if (ms === 0 || Number.isNaN(ms)) return '0 ms'
  if (ms < 1000) return `${Math.round(ms)} ms`
  return `${(ms / 1000).toFixed(2)} s`
}

export function getStatusColor(status) {
  if (!status) return 'default'
  if (status >= 200 && status < 300) return 'success'
  if (status >= 300 && status < 400) return 'warning'
  if (status >= 400) return 'error'
  return 'default'
}

export function safeJsonParse(text) {
  try {
    return { ok: true, value: JSON.parse(text) }
  } catch {
    return { ok: false }
  }
}

export function formatHeaders(headers = []) {
  return headers.map((h) => ({ name: h.name || '', value: h.value || '' }))
}

export function getQueryParams(entry) {
  return entry?.request?.queryString || []
}

export function truncateUrl(url, max = 90) {
  if (!url || url.length <= max) return url
  return `${url.slice(0, max - 3)}...`
}

export function getRequestBody(entry) {
  return entry?.request?.postData?.text || ''
}

export function getResponseBody(entry) {
  return entry?.response?.content?.text || ''
}
