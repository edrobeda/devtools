// Gerador de cabeçalhos de segurança HTTP.
// 100% client-side: monta snippets para Nginx, Apache, Express, Netlify,
// Vercel e meta tags HTML a partir de um conjunto de opções.

export const PERMISSIONS_FEATURES = [
  'camera',
  'microphone',
  'geolocation',
  'payment',
  'usb',
  'magnetometer',
  'gyroscope',
  'fullscreen',
  'display-capture',
  'picture-in-picture',
  'autoplay',
  'encrypted-media',
]

export const DEFAULT_DIRECTIVES = {
  camera: '()',
  microphone: '()',
  geolocation: '()',
  payment: '()',
  usb: '()',
  magnetometer: '()',
  gyroscope: '()',
  fullscreen: '*',
  'display-capture': '()',
  'picture-in-picture': '*',
  autoplay: '(self)',
  'encrypted-media': '*',
}

export const PRESETS = {
  strict: {
    hstsEnabled: true,
    hstsMaxAge: '31536000',
    hstsSubDomains: true,
    hstsPreload: true,
    contentTypeEnabled: true,
    frameEnabled: true,
    frameValue: 'DENY',
    frameAllowFrom: '',
    referrerEnabled: true,
    referrerValue: 'strict-origin-when-cross-origin',
    permissionsEnabled: true,
    permissionsDirectives: { ...DEFAULT_DIRECTIVES },
    xssEnabled: true,
    xssValue: '0',
    cspEnabled: false,
    cspValue: "default-src 'self'; object-src 'none';",
    coepEnabled: true,
    coepValue: 'require-corp',
    coopEnabled: true,
    coopValue: 'same-origin',
    corpEnabled: true,
    corpValue: 'same-origin',
  },
  api: {
    hstsEnabled: true,
    hstsMaxAge: '31536000',
    hstsSubDomains: true,
    hstsPreload: false,
    contentTypeEnabled: true,
    frameEnabled: true,
    frameValue: 'DENY',
    frameAllowFrom: '',
    referrerEnabled: true,
    referrerValue: 'strict-origin-when-cross-origin',
    permissionsEnabled: false,
    permissionsDirectives: { ...DEFAULT_DIRECTIVES },
    xssEnabled: true,
    xssValue: '0',
    cspEnabled: false,
    cspValue: "default-src 'self'; object-src 'none';",
    coepEnabled: false,
    coepValue: 'require-corp',
    coopEnabled: true,
    coopValue: 'same-origin',
    corpEnabled: false,
    corpValue: 'same-origin',
  },
  static: {
    hstsEnabled: true,
    hstsMaxAge: '31536000',
    hstsSubDomains: true,
    hstsPreload: false,
    contentTypeEnabled: true,
    frameEnabled: true,
    frameValue: 'SAMEORIGIN',
    frameAllowFrom: '',
    referrerEnabled: true,
    referrerValue: 'strict-origin-when-cross-origin',
    permissionsEnabled: true,
    permissionsDirectives: { ...DEFAULT_DIRECTIVES },
    xssEnabled: true,
    xssValue: '0',
    cspEnabled: true,
    cspValue: "default-src 'self'; object-src 'none';",
    coepEnabled: false,
    coepValue: 'require-corp',
    coopEnabled: true,
    coopValue: 'same-origin',
    corpEnabled: true,
    corpValue: 'same-origin',
  },
  minimal: {
    hstsEnabled: false,
    hstsMaxAge: '31536000',
    hstsSubDomains: false,
    hstsPreload: false,
    contentTypeEnabled: true,
    frameEnabled: false,
    frameValue: 'DENY',
    frameAllowFrom: '',
    referrerEnabled: true,
    referrerValue: 'strict-origin-when-cross-origin',
    permissionsEnabled: false,
    permissionsDirectives: { ...DEFAULT_DIRECTIVES },
    xssEnabled: false,
    xssValue: '0',
    cspEnabled: false,
    cspValue: "default-src 'self'; object-src 'none';",
    coepEnabled: false,
    coepValue: 'require-corp',
    coopEnabled: false,
    coopValue: 'same-origin',
    corpEnabled: false,
    corpValue: 'same-origin',
  },
}

function buildHstsValue(options) {
  if (!options.hstsEnabled) return null
  const parts = [`max-age=${options.hstsMaxAge || '31536000'}`]
  if (options.hstsSubDomains) parts.push('includeSubDomains')
  if (options.hstsPreload) parts.push('preload')
  return parts.join('; ')
}

function buildFrameValue(options) {
  if (!options.frameEnabled) return null
  if (options.frameValue === 'ALLOW-FROM' && options.frameAllowFrom) {
    return `ALLOW-FROM ${options.frameAllowFrom}`
  }
  return options.frameValue || 'DENY'
}

function buildPermissionsValue(directives) {
  const entries = Object.entries(directives || {})
    .filter(([, v]) => v && v !== '*')
    .map(([k, v]) => `${k}=${v}`)
  if (entries.length === 0) return null
  return entries.join(', ')
}

export function buildHeaderList(options) {
  const headers = []

  const hsts = buildHstsValue(options)
  if (hsts) headers.push({ name: 'Strict-Transport-Security', value: hsts })

  if (options.contentTypeEnabled) {
    headers.push({ name: 'X-Content-Type-Options', value: 'nosniff' })
  }

  const frame = buildFrameValue(options)
  if (frame) headers.push({ name: 'X-Frame-Options', value: frame })

  if (options.referrerEnabled && options.referrerValue) {
    headers.push({ name: 'Referrer-Policy', value: options.referrerValue })
  }

  if (options.permissionsEnabled) {
    const pp = buildPermissionsValue(options.permissionsDirectives)
    if (pp) headers.push({ name: 'Permissions-Policy', value: pp })
  }

  if (options.xssEnabled && options.xssValue) {
    headers.push({ name: 'X-XSS-Protection', value: options.xssValue })
  }

  if (options.cspEnabled && options.cspValue) {
    headers.push({ name: 'Content-Security-Policy', value: options.cspValue.trim() })
  }

  if (options.coepEnabled && options.coepValue) {
    headers.push({ name: 'Cross-Origin-Embedder-Policy', value: options.coepValue })
  }

  if (options.coopEnabled && options.coopValue) {
    headers.push({ name: 'Cross-Origin-Opener-Policy', value: options.coopValue })
  }

  if (options.corpEnabled && options.corpValue) {
    headers.push({ name: 'Cross-Origin-Resource-Policy', value: options.corpValue })
  }

  return headers
}

function escapeConfig(value) {
  return String(value).replace(/"/g, '\\"')
}

export function buildNginx(headers) {
  if (headers.length === 0) return '# Nenhum cabeçalho selecionado.'
  return headers
    .map((h) => `add_header ${h.name} "${escapeConfig(h.value)}" always;`)
    .join('\n')
}

export function buildApache(headers) {
  if (headers.length === 0) return '# No headers selected.'
  return headers
    .map((h) => `Header always set ${h.name} "${escapeConfig(h.value)}"`)
    .join('\n')
}

export function buildExpress(headers) {
  if (headers.length === 0) return '// No headers selected.'
  const lines = headers.map(
    (h) => `  res.set('${h.name}', '${h.value.replace(/'/g, "\\'")}')`
  )
  return `app.use((req, res, next) => {\n${lines.join('\n')}\n  next()\n})`
}

export function buildNetlify(headers) {
  if (headers.length === 0) return '# No headers selected.'
  return ['/*', ...headers.map((h) => `  ${h.name}: ${h.value}`)].join('\n')
}

export function buildVercel(headers) {
  if (headers.length === 0) return JSON.stringify({ headers: [] }, null, 2)
  const mapped = headers.map((h) => ({ key: h.name, value: h.value }))
  return JSON.stringify(
    {
      headers: [
        {
          source: '/(.*)',
          headers: mapped,
        },
      ],
    },
    null,
    2
  )
}

export function buildHtmlMeta(headers) {
  const mappable = headers.filter((h) =>
    ['Content-Security-Policy', 'Referrer-Policy', 'X-UA-Compatible'].includes(h.name)
  )
  if (mappable.length === 0) return '<!-- No HTML meta equivalents for the selected headers. -->'
  return mappable
    .map((h) => {
      if (h.name === 'Referrer-Policy') {
        return `<meta name="referrer" content="${escapeConfig(h.value)}">`
      }
      return `<meta http-equiv="${h.name}" content="${escapeConfig(h.value)}">`
    })
    .join('\n')
}

export function buildSecurityHeaders(options, format = 'nginx') {
  const headers = buildHeaderList(options)
  switch (format) {
    case 'apache':
      return buildApache(headers)
    case 'express':
      return buildExpress(headers)
    case 'netlify':
      return buildNetlify(headers)
    case 'vercel':
      return buildVercel(headers)
    case 'html':
      return buildHtmlMeta(headers)
    case 'nginx':
    default:
      return buildNginx(headers)
  }
}
