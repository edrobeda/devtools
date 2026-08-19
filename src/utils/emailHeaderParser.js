// Email header parser — 100% client-side engine for the E-mail Header
// Analyzer tool. Parses a raw RFC 5322 header block (as found in the
// "Show original" option of any mail client), unfolds folded lines, decodes
// RFC 2047 encoded-words ("=?utf-8?B?...?=" / "=?utf-8?Q?...?="),
// reconstructs the Received hop chain and surfaces SPF / DKIM / DMARC
// results embedded in Authentication-Results.
//
// Everything here runs in the browser with no external API.

const NEWLINE_RE = /\r\n|\r|\n/g

// First blank line separates headers from body — only analyze the header part
// (people often paste "show original" content that continues with the body).
export function headerBlock(raw) {
  const s = String(raw == null ? '' : raw).replace(NEWLINE_RE, '\n')
  const idx = s.indexOf('\n\n')
  return idx === -1 ? s : s.slice(0, idx)
}

const NAME_RE = /^([!-9;-~]+):\s?(.*)$/

// Splits the raw text into a list of { name, lower, value } in order.
// Handles unfolded continuation lines (lines starting with space/tab).
export function parseHeaders(raw) {
  const block = headerBlock(raw)
  if (!block.trim()) return { ok: false, error: 'empty' }

  const lines = block.split('\n')
  const unfolded = []
  let cur = null
  for (const line of lines) {
    if (/^[ \t]/.test(line) && cur !== null) {
      cur += ' ' + line.trim()
    } else {
      if (cur !== null) unfolded.push(cur)
      cur = line
    }
  }
  if (cur !== null) unfolded.push(cur)

  const headers = []
  for (const line of unfolded) {
    const m = line.match(NAME_RE)
    if (!m) continue
    headers.push({ name: m[1], lower: m[1].toLowerCase(), value: m[2] })
  }
  if (headers.length === 0) return { ok: false, error: 'no-headers' }
  return { ok: true, headers }
}

export function getHeader(headers, name) {
  const lower = String(name).toLowerCase()
  for (const h of headers) if (h.lower === lower) return h.value
  return null
}

export function getAllHeaders(headers, name) {
  const lower = String(name).toLowerCase()
  return headers.filter((h) => h.lower === lower)
}

// ---------- RFC 2047 encoded-word decoding ----------

const CHARSET_ALIAS = {
  'utf8': 'utf-8',
  'utf-8': 'utf-8',
  'us-ascii': 'utf-8',
  'ascii': 'utf-8',
  'iso-8859-1': 'windows-1252', // latin-1 superset, safer default
  'latin1': 'windows-1252',
  'base64': '',
}

function normalizeCharset(charset) {
  let c = String(charset || '').trim().replace(/^"|"$/g, '').toLowerCase()
  if (c in CHARSET_ALIAS) c = CHARSET_ALIAS[c]
  return c
}

function bytesToLatin1(bytes) {
  let out = ''
  for (let i = 0; i < bytes.length; i++) out += String.fromCharCode(bytes[i])
  return out
}

function decodeBytes(bytes, charset) {
  const label = normalizeCharset(charset)
  if (label === 'utf-8') {
    try {
      return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
    } catch {
      return bytesToLatin1(bytes)
    }
  }
  try {
    return new TextDecoder(label).decode(bytes)
  } catch {
    return bytesToLatin1(bytes)
  }
}

const ENCODED_WORD_RE = /=\?([^?]+)\?([bBqQ])\?([^?]*)\?=/g

export function decodeMimeWords(str) {
  if (!str) return str
  return String(str).replace(ENCODED_WORD_RE, (_match, charset, encoding, text) => {
    try {
      if (encoding.toUpperCase() === 'B') {
        const clean = text.replace(/\s+/g, '')
        const binary = atob(clean)
        const bytes = new Uint8Array(binary.length)
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
        return decodeBytes(bytes, charset)
      }
      const bytes = new Uint8Array(text.length)
      let o = 0
      for (let i = 0; i < text.length; i++) {
        const ch = text[i]
        if (ch === '=' && i + 2 < text.length) {
          const hex = parseInt(text.substr(i + 1, 2), 16)
          if (!Number.isNaN(hex)) {
            bytes[o++] = hex
            i += 2
            continue
          }
          bytes[o++] = 0x3d
        } else if (ch === '_') {
          bytes[o++] = 0x20
        } else {
          bytes[o++] = ch.charCodeAt(0)
        }
      }
      return decodeBytes(bytes.subarray(0, o), charset)
    } catch {
      return _match
    }
  })
}

// ---------- Address parsing ----------

const EMAIL_RE = /^[^\s@<>]+@[^\s@<>]+$/

function stripName(name) {
  return String(name || '').trim().replace(/^(['"])(.*)\1$/, '$2')
}

// Best-effort parse of "Name <email@example.com>" or a bare address/name.
export function parseAddress(str) {
  const s = String(str == null ? '' : str).trim()
  if (!s) return null
  const lt = s.lastIndexOf('<')
  const gt = s.lastIndexOf('>')
  if (lt >= 0 && gt > lt) {
    return {
      name: stripName(s.slice(0, lt)),
      email: s.slice(lt + 1, gt).trim(),
    }
  }
  if (EMAIL_RE.test(s)) return { name: '', email: s }
  return { name: stripName(s), email: '' }
}

// ---------- Received hop chain ----------

const IP_RE = /\b(?:\d{1,3}\.){3}\d{1,3}\b/

export function extractHopDate(datePart) {
  if (!datePart) return null
  const d = new Date(datePart)
  if (Number.isNaN(d.getTime())) return null
  return d
}

function cleanHopHost(raw) {
  let s = String(raw || '').trim()
  s = s.replace(/^helo\s+/i, '').replace(/^\[[^\]]*\](?=\s)/, '')
  return s || null
}

function parseHopExact(value) {
  // Format: "from HOST (desc) by HOST (desc) with ESMTP (desc) id X for <y>; Date"
  const out = { from: null, by: null, withInfo: null, id: null, forAddr: null, date: null, raw: value }

  const semi = value.lastIndexOf(';')
  const datePart = semi !== -1 ? value.slice(semi + 1).trim() : null
  out.date = extractHopDate(datePart)
  const core = semi !== -1 ? value.slice(0, semi).trim() : value.trim()

  let before = core
  const withMatch = core.match(/^(.*?)\s+with\s+(.*)$/is)
  if (withMatch) {
    before = withMatch[1].trim()
    const rem = withMatch[2]
    const remMatch = rem.match(/^(.*?)(?:\s+id\s+([^\s]+))?(?:\s+for\s+<([^;>]*)>)?$/is)
    out.withInfo = remMatch[1].trim() || null
    out.id = remMatch[2] || null
    out.forAddr = (remMatch[3] || '').trim() || null
  }

  const fromMatch = before.match(/^(?:from\s+)?(.*?)\s+by\s+(.*)$/is)
  if (fromMatch) {
    out.from = cleanHopHost(fromMatch[1])
    out.by = cleanHopHost(fromMatch[2])
  } else {
    out.from = cleanHopHost(before.replace(/^from\s+/i, ''))
  }

  if (out.by) {
    const byParts = out.by.match(/^(.*?)\s+id\s+([^\s]+)(?:\s+for\s+<([^;>]*)>)?$/is)
    if (byParts) {
      out.by = byParts[1].trim()
      out.id = out.id || byParts[2] || null
      out.forAddr = out.forAddr || (byParts[3] || '').trim() || null
    }
  }
  return out
}

export function extractIp(hostStr) {
  const m = String(hostStr || '').match(IP_RE)
  return m ? m[0] : null
}

// Received headers appear newest-first; reading top-down is the delivery chain
// from the last hop before your mailbox down to the originator.
export function parseReceivedChain(headers) {
  const received = []
  for (const h of headers) {
    if (h.lower === 'received' || h.lower === 'x-received') {
      received.push(parseHopExact(h.value))
    }
  }
  return received
}

// ---------- Authentication results (SPF / DKIM / DMARC) ----------

function parseAuthResult(str) {
  let s = String(str || '').trim().replace(/^auth\s+/i, '')
  const statusMatch = s.match(/^(pass|fail|softfail|neutral|none|temperror|permerror|bestguesspars)/i)
  const status = statusMatch ? statusMatch[1].toLowerCase() : null
  const domainMatch = s.match(/(?:smtp\.mailfrom|header\.from|header\.d|mailfrom|envelope-from)=([^;\s]+)/i)
  return { status, domain: domainMatch ? domainMatch[1] : null, raw: s }
}

// Walk Authentication-Results, Received-SPF and DKIM-Signature headers to
// summarize how the message fared; unknown headers simply don't contribute.
export function getSecurity(headers) {
  const spf = []
  const dkim = []
  const dmarc = []
  const authResults = []
  const spam = []

  for (const h of headers) {
    const n = h.lower
    if (n === 'authentication-results') {
      authResults.push(decodeMimeWords(h.value))
      const segments = h.value.split(';')
      for (const seg of segments) {
        const token = seg.trim()
        if (/^spf=/i.test(token)) spf.push(parseAuthResult(token.slice(4)))
        else if (/^dkim=/i.test(token)) dkim.push(parseAuthResult(token.slice(5)))
        else if (/^dmarc=/i.test(token)) dmarc.push(parseAuthResult(token.slice(6)))
      }
    } else if (n === 'received-spf') {
      const value = h.value
      const statusMatch = value.match(/spf=(\S+)/i) || value.match(/^([a-z]+)\b/i)
      const domainMatch = value.match(/(?:smtp\.mailfrom|mailfrom|envelope-from)=[^@;\s]*@?([^;\s ]+)/i)
      spf.push({
        status: statusMatch ? statusMatch[1].toLowerCase() : 'none',
        domain: domainMatch ? domainMatch[1] : null,
        raw: decodeMimeWords(value),
      })
    } else if (n === 'dkim-signature') {
      const d = h.value.match(/\bd=([^;\s]+)/i)
      const sel = h.value.match(/\bs=([^;\s]+)/i)
      dkim.push({
        present: true,
        domain: d ? d[1] : null,
        selector: sel ? sel[1] : null,
        raw: h.value,
      })
    } else if (n === 'x-spam-status') {
      spam.push({ name: h.name, value: decodeMimeWords(h.value) })
    }
  }

  return { spf, dkim, dmarc, authResults, spam }
}

// ---------- Convenience facade used by the page ----------

export function analyze(raw) {
  const parsed = parseHeaders(raw)
  if (!parsed.ok) return { ok: false, error: parsed.error }

  const subject = decodeMimeWords(getHeader(parsed.headers, 'Subject') || '')
  const from = parseAddress(decodeMimeWords(getHeader(parsed.headers, 'From') || ''))
  const to = parseAddress(decodeMimeWords(getHeader(parsed.headers, 'To') || ''))
  const replyTo = parseAddress(decodeMimeWords(getHeader(parsed.headers, 'Reply-To') || ''))

  const dateHeader = getHeader(parsed.headers, 'Date')
  const dateObj = extractHopDate(dateHeader)
  const messageId = getHeader(parsed.headers, 'Message-ID')
  const returnPath = getHeader(parsed.headers, 'Return-Path')
  const deliveredTo = getHeader(parsed.headers, 'Delivered-To')
  const envelopeTo = getHeader(parsed.headers, 'Envelope-to')

  const received = parseReceivedChain(parsed.headers)
  const security = getSecurity(parsed.headers)

  return {
    ok: true,
    headers: parsed.headers.map((h, i) => ({
      key: i,
      name: h.name,
      lower: h.lower,
      value: decodeMimeWords(h.value),
      rawValue: h.value,
    })),
    summary: { subject, from, to, replyTo, dateHeader, dateObj, messageId, returnPath, deliveredTo, envelopeTo },
    received,
    security,
  }
}

export function getEngineSource() {
  return [
    '// Email header parser (RFC 5322 + RFC 2047) — engine essencial.',
    '',
    '// 1. Pega o bloco de cabeçalhos (até a primeira linha em branco).',
    '// 2. Desdobra linhas de continuação (iniciam com espaço/tab).',
    '// 3. Quebra em "name: value" e decodifica palavras MIME (=?utf-8?B?...).',
    'const NAME_RE = /^([!-9;-~]+):\\s?(.*)$/',
    '',
    'export function parseHeaders(raw) {',
    '  const lines = headerBlock(raw).split("\\n")',
    '  const headers = []',
    '  let cur = null',
    '  for (const line of lines) {',
    '    if (/^[ \\t]/.test(line) && cur) cur += " " + line.trim()',
    '    else {',
    '      if (cur) headers.push(cur)',
    '      cur = line',
    '    }',
    '  }',
    '  if (cur) headers.push(cur)',
    '  return headers.map((l) => {',
    '    const m = l.match(NAME_RE)',
    '    return m ? { name: m[1], lower: m[1].toLowerCase(), value: m[2] } : null',
    '  }).filter(Boolean)',
    '}',
    '',
    '// Decodifica "=?utf-8?B?...?=" (base64) e "=?utf-8?Q?...?=" (quoted-printable):',
    '// Q: _ vira espaço, %HH vira byte; depois TextDecoder(charset).decode(bytes).',
    'export function decodeMimeWords(str) {',
    '  return String(str).replace(/=\\?([^?]+)\\?([bBqQ])\\?([^?]*)\\?=/g, (m, cs, enc, txt) => {',
    '    const bytes = enc.toUpperCase() === "B"',
    '      ? atob(txt.replace(/\\s+/g, "")).split("").map((c) => c.charCodeAt(0))',
    '      : decodeQ(txt)',
    '    return new TextDecoder(cs).decode(new Uint8Array(bytes))',
    '  })',
    '}',
    '',
    '// Received: each hop = "from X by Y with Z; <data>". Os cabeçalhos',
    '// aparecem do mais recente (topo) ao mais antigo — é a trilha que o',
    '// e-mail percorreu até a sua caixa. Datas viram Date para ordenar.',
    '',
    '// SPF/DKIM/DMARC: vêm dentro de Authentication-Results como palavras',
    '// "spf=pass smtp.mailfrom=example.com; dkim=pass header.d=ex.com" etc.',
    '// A página pinta pass/fail/softfail/neutral em Tags coloridas.',
    '',
    '// Tudo client-side: os cabeçalhos nunca saem do navegador.',
  ].join('\n')
}