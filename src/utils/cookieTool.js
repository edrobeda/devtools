/**
 * HTTP Cookie Parser / Builder
 *
 * Implementação pura em JavaScript (sem dependências) para analisar e montar
 * cabeçalhos `Set-Cookie` e `Cookie` no padrão RFC 6265, com suporte aos
 * atributos mais comuns do dia a dia (Expires, Max-Age, Domain, Path, Secure,
 * HttpOnly, SameSite, Partitioned, Priority) e prefixos `__Host-`/`__Secure-`.
 *
 * Tudo roda no navegador: nenhum dado sai da máquina.
 */

export const SAME_SITE_OPTIONS = ['Strict', 'Lax', 'None']
export const PRIORITY_OPTIONS = ['Low', 'Medium', 'High']

export const SAMPLE_SET_COOKIE = [
  'sessionId=abc123; Path=/; HttpOnly; Secure; SameSite=Lax',
  'id=a3fWa; Expires=Wed, 21 Oct 2025 07:28:00 GMT; Secure; HttpOnly; SameSite=None',
  'theme=dark; Path=/; Domain=example.com; Max-Age=2592000; SameSite=Strict',
  '__Host-session=xyz789; Path=/; Secure; HttpOnly; SameSite=Lax',
].join('\n')

export const SAMPLE_COOKIE = 'sessionId=abc123; theme=dark; lang=pt-BR'

function trim(str) {
  return String(str ?? '').trim()
}

function parseNameValue(pair) {
  const idx = pair.indexOf('=')
  if (idx === -1) {
    return { name: pair, value: '' }
  }
  let name = trim(pair.slice(0, idx))
  let value = trim(pair.slice(idx + 1))
  // Remove aspas envolvendo o valor, se houver (RFC 6265 permite quoted-string)
  if (value.length >= 2 && value[0] === '"' && value[value.length - 1] === '"') {
    value = value.slice(1, -1)
  }
  return { name, value }
}

/**
 * Analisa um único cabeçalho Set-Cookie.
 * Retorna um objeto com name, value e os atributos reconhecidos.
 */
export function parseSetCookie(header) {
  if (!header) return null
  const parts = header.split(';')
  const { name, value } = parseNameValue(trim(parts[0]))

  const cookie = {
    name,
    value,
    expires: '',
    maxAge: '',
    domain: '',
    path: '',
    secure: false,
    httpOnly: false,
    sameSite: '',
    partitioned: false,
    priority: '',
    raw: header,
  }

  for (let i = 1; i < parts.length; i++) {
    const part = trim(parts[i])
    if (!part) continue
    const { name: attrName, value: attrValue } = parseNameValue(part)
    const key = attrName.toLowerCase()

    switch (key) {
      case 'expires':
        cookie.expires = attrValue
        break
      case 'max-age':
        cookie.maxAge = attrValue
        break
      case 'domain':
        cookie.domain = attrValue
        break
      case 'path':
        cookie.path = attrValue
        break
      case 'secure':
        cookie.secure = true
        break
      case 'httponly':
        cookie.httpOnly = true
        break
      case 'samesite':
        cookie.sameSite = attrValue
        break
      case 'partitioned':
        cookie.partitioned = true
        break
      case 'priority':
        cookie.priority = attrValue
        break
      default:
        // Atributos desconhecidos são ignorados no parser principal
        break
    }
  }

  return cookie
}

/**
 * Analisa um texto com múltiplos cabeçalhos Set-Cookie (um por linha).
 */
export function parseSetCookieList(text) {
  if (!text) return []
  return text
    .split(/\r?\n/)
    .map(trim)
    .filter(Boolean)
    .map(parseSetCookie)
    .filter(Boolean)
}

/**
 * Analisa um cabeçalho `Cookie` (requisição) em pares nome=valor.
 */
export function parseCookieHeader(header) {
  if (!header) return []
  return header
    .split(';')
    .map(trim)
    .filter(Boolean)
    .map(parseNameValue)
}

function isCookieOctet(code) {
  // RFC 6265: cookie-octet = %x21 / %x23-2B / %x2D-3A / %x3C-5B / %x5D-7E
  return (
    code === 0x21 ||
    (code >= 0x23 && code <= 0x2b) ||
    (code >= 0x2d && code <= 0x3a) ||
    (code >= 0x3c && code <= 0x5b) ||
    (code >= 0x5d && code <= 0x7e)
  )
}

function isValueSafeForRaw(value) {
  // Basicamente: sem espaço, ;, ,, \\, \" e controles.
  if (value === '') return true
  for (let i = 0; i < value.length; i++) {
    if (!isCookieOctet(value.charCodeAt(i))) return false
  }
  return true
}

function encodeCookieValue(value) {
  // Codifica tudo que não for cookie-octet como %XX, mantendo o alfabeto seguro.
  return value
    .split('')
    .map((ch) => {
      const code = ch.charCodeAt(0)
      if (isCookieOctet(code)) return ch
      return `%${code.toString(16).padStart(2, '0').toUpperCase()}`
    })
    .join('')
}

export function serializeCookieValue(value, { encode = false } = {}) {
  if (encode || !isValueSafeForRaw(value)) {
    return encodeCookieValue(value)
  }
  return value
}

/**
 * Monta um cabeçalho `Set-Cookie` a partir de um objeto de cookie.
 */
export function buildSetCookie(cookie, { encodeValue = false } = {}) {
  const parts = [
    `${cookie.name}=${serializeCookieValue(String(cookie.value ?? ''), { encode: encodeValue })}`,
  ]
  if (cookie.expires) parts.push(`Expires=${cookie.expires}`)
  if (cookie.maxAge !== '' && cookie.maxAge != null) parts.push(`Max-Age=${cookie.maxAge}`)
  if (cookie.domain) parts.push(`Domain=${cookie.domain}`)
  if (cookie.path) parts.push(`Path=${cookie.path}`)
  if (cookie.secure) parts.push('Secure')
  if (cookie.httpOnly) parts.push('HttpOnly')
  if (cookie.sameSite) parts.push(`SameSite=${cookie.sameSite}`)
  if (cookie.partitioned) parts.push('Partitioned')
  if (cookie.priority) parts.push(`Priority=${cookie.priority}`)
  return parts.join('; ')
}

/**
 * Monta um cabeçalho `Cookie` a partir de um array de {name, value}.
 */
export function buildCookieHeader(cookies, { encodeValue = false } = {}) {
  if (!cookies || cookies.length === 0) return ''
  return cookies
    .map(
      (c) =>
        `${c.name}=${serializeCookieValue(String(c.value ?? ''), { encode: encodeValue })}`
    )
    .join('; ')
}

/**
 * Retorna uma versão JSON amigável do cookie (para cópia/exportação).
 */
export function cookieToJson(cookie) {
  const obj = { name: cookie.name, value: cookie.value }
  if (cookie.expires) obj.expires = cookie.expires
  if (cookie.maxAge !== '' && cookie.maxAge != null) obj.maxAge = Number(cookie.maxAge)
  if (cookie.domain) obj.domain = cookie.domain
  if (cookie.path) obj.path = cookie.path
  if (cookie.secure) obj.secure = true
  if (cookie.httpOnly) obj.httpOnly = true
  if (cookie.sameSite) obj.sameSite = cookie.sameSite
  if (cookie.partitioned) obj.partitioned = true
  if (cookie.priority) obj.priority = cookie.priority
  return obj
}

/**
 * Verifica se o nome do cookie usa os prefixos __Host- ou __Secure-.
 */
export function getCookiePrefix(name) {
  if (name.startsWith('__Host-')) return '__Host-'
  if (name.startsWith('__Secure-')) return '__Secure-'
  return ''
}

/**
 * Valida regras básicas de prefixos __Host- e __Secure-.
 */
export function validatePrefixRules(cookie) {
  const warnings = []
  const prefix = getCookiePrefix(cookie.name)
  if (prefix === '__Host-') {
    if (cookie.path !== '/') warnings.push('__Host- exige Path=/')
    if (!cookie.secure) warnings.push('__Host- exige Secure')
    if (cookie.domain) warnings.push('__Host- não permite Domain')
  }
  if (prefix === '__Secure-') {
    if (!cookie.secure) warnings.push('__Secure- exige Secure')
  }
  return warnings
}

/**
 * Formata um cookie parseado como string legível, similar a devtools.
 */
export function formatCookieForDisplay(cookie) {
  const attrs = []
  if (cookie.domain) attrs.push(`Domain=${cookie.domain}`)
  if (cookie.path) attrs.push(`Path=${cookie.path}`)
  if (cookie.expires) attrs.push(`Expires=${cookie.expires}`)
  if (cookie.maxAge !== '' && cookie.maxAge != null) attrs.push(`Max-Age=${cookie.maxAge}`)
  if (cookie.sameSite) attrs.push(`SameSite=${cookie.sameSite}`)
  if (cookie.priority) attrs.push(`Priority=${cookie.priority}`)
  if (cookie.secure) attrs.push('Secure')
  if (cookie.httpOnly) attrs.push('HttpOnly')
  if (cookie.partitioned) attrs.push('Partitioned')
  return `${cookie.name}=${cookie.value}` + (attrs.length ? `; ${attrs.join('; ')}` : '')
}

/**
 * Cria um objeto de cookie vazio para o modo "builder".
 */
export function createEmptyCookie() {
  return {
    name: '',
    value: '',
    expires: '',
    maxAge: '',
    domain: '',
    path: '/',
    secure: false,
    httpOnly: false,
    sameSite: 'Lax',
    partitioned: false,
    priority: '',
  }
}

/**
 * Verifica se uma string parece ser um header Set-Cookie (tem atributos).
 */
export function looksLikeSetCookie(text) {
  return /\b(Expires|Max-Age|Domain|Path|Secure|HttpOnly|SameSite|Partitioned|Priority)\b/i.test(
    text
  )
}

/**
 * Detecta se um texto colado tem múltiplas linhas → Set-Cookie,
 * ou uma única linha → Cookie header.
 */
export function detectCookieInputType(text) {
  if (!text) return 'cookie'
  if (looksLikeSetCookie(text)) return 'set-cookie'
  if (/\r?\n/.test(text)) return 'set-cookie'
  return 'cookie'
}
