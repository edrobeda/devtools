// Ferramenta de escape/unescape de string para vários contextos.
// 100% client-side — nenhum dado sai do navegador.

export function escapeJsString(s, quote = '"') {
  let out = s
    .replace(/\\/g, '\\\\')
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n')
    .replace(/\t/g, '\\t')
    .replace(/\v/g, '\\v')
    .replace(/\b/g, '\\b')
    .replace(/\f/g, '\\f')
  if (quote === '"') out = out.replace(/"/g, '\\"')
  else if (quote === "'") out = out.replace(/'/g, "\\'")
  else if (quote === '`') {
    out = out.replace(/`/g, '\\`').replace(/\$/g, '\\$')
  }
  return out
}

export function unescapeJsString(s) {
  return s
    .replace(/\\'/g, "'")
    .replace(/\\"/g, '"')
    .replace(/\\`/g, '`')
    .replace(/\\\\/g, '\\')
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\v/g, '\v')
    .replace(/\\b/g, '\b')
    .replace(/\\f/g, '\f')
    .replace(/\\x([0-9a-fA-F]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/\\u\{([0-9a-fA-F]+)\}/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
}

export function escapeJsonString(s) {
  return JSON.stringify(s)
}

export function unescapeJsonString(s) {
  const str = s.trim()
  if (!str) return ''
  const wrapped = str.startsWith('"') ? str : '"' + str.replace(/"/g, '\\"') + '"'
  return JSON.parse(wrapped)
}

const HTML_NAMED = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

export function escapeHtml(s, nonAscii = false) {
  let out = s.replace(/[&<>"']/g, (ch) => HTML_NAMED[ch])
  if (nonAscii) {
    out = out.replace(/[^\x00-\x7F]/gu, (ch) => `&#${ch.codePointAt(0)};`)
  }
  return out
}

export function unescapeHtml(s) {
  const doc = new DOMParser().parseFromString(s, 'text/html')
  return doc.documentElement.textContent
}

const XML_NAMED = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&apos;',
}

export function escapeXml(s) {
  return s.replace(/[&<>"']/g, (ch) => XML_NAMED[ch])
}

export function unescapeXml(s) {
  const doc = new DOMParser().parseFromString(`<x>${s}</x>`, 'application/xml')
  return doc.documentElement.textContent
}

export function escapeUrlComponent(s) {
  return encodeURIComponent(s)
}

export function unescapeUrlComponent(s) {
  return decodeURIComponent(s)
}

export function escapeUrlFull(s) {
  return encodeURI(s)
}

export function unescapeUrlFull(s) {
  return decodeURI(s)
}

export function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function unescapeRegex(s) {
  return s.replace(/\\([.*+?^${}()|[\]\\])/g, '$1')
}

export function escapeSqlLike(s) {
  return s.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_')
}

export function unescapeSqlLike(s) {
  return s.replace(/\\%/g, '%').replace(/\\_/g, '_').replace(/\\\\/g, '\\')
}

export function escapeMarkdown(s) {
  return s.replace(/([\\`*_{}[\]()#+\-.!|])/g, '\\$1')
}

export function unescapeMarkdown(s) {
  return s.replace(/\\([\\`*_{}[\]()#+\-.!|])/g, '$1')
}

export function escapeCsv(s, delimiter = ',', quote = '"') {
  if (
    s.includes(quote) ||
    s.includes(delimiter) ||
    s.includes('\n') ||
    s.includes('\r')
  ) {
    const escapedQuote = quote + quote
    return quote + s.replace(new RegExp(quote, 'g'), escapedQuote) + quote
  }
  return s
}

export function unescapeCsv(s, delimiter = ',', quote = '"') {
  if (s.startsWith(quote) && s.endsWith(quote)) {
    return s.slice(1, -1).replace(new RegExp(quote + quote, 'g'), quote)
  }
  return s
}

export function escapeUnicode(s) {
  return s.replace(/[^\x00-\x7F]/gu, (ch) => {
    const cp = ch.codePointAt(0)
    return cp > 0xffff ? `\\u{${cp.toString(16)}}` : `\\u${cp.toString(16).padStart(4, '0')}`
  })
}

export function escapeHex(s) {
  return s.replace(/[\x00-\xff]/g, (ch) => `\\x${ch.charCodeAt(0).toString(16).padStart(2, '0')}`)
}
