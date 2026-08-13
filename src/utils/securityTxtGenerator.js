// Gerador de arquivo security.txt (RFC 9116).
// 100% client-side: monta o texto a partir de contatos, data de expiração
// e campos opcionais reconhecidos pela especificação.

export const FIELD_NAMES = {
  contact: 'Contact',
  expires: 'Expires',
  acknowledgments: 'Acknowledgments',
  canonical: 'Canonical',
  encryption: 'Encryption',
  hiring: 'Hiring',
  policy: 'Policy',
  preferredLanguages: 'Preferred-Languages',
  csaf: 'CSAF',
}

export const PRESETS = {
  minimal: {
    contact: ['mailto:security@example.com'],
    expires: addOneYear(),
    acknowledgments: '',
    canonical: '',
    encryption: '',
    hiring: '',
    policy: '',
    preferredLanguages: '',
    csaf: '',
    includeSignature: false,
  },
  complete: {
    contact: ['mailto:security@example.com', 'https://example.com/security-contact'],
    expires: addOneYear(),
    acknowledgments: 'https://example.com/security/hall-of-fame',
    canonical: 'https://example.com/.well-known/security.txt',
    encryption: 'https://example.com/security/pgp-key.txt',
    hiring: 'https://example.com/careers#security',
    policy: 'https://example.com/security/policy',
    preferredLanguages: 'en, pt-BR',
    csaf: 'https://example.com/.well-known/csaf/provider-metadata.json',
    includeSignature: false,
  },
}

function addOneYear() {
  const d = new Date()
  d.setFullYear(d.getFullYear() + 1)
  return toLocalIsoString(d)
}

function toLocalIsoString(date) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}${formatTimezoneOffset(date)}`
}

function formatTimezoneOffset(date) {
  const offset = date.getTimezoneOffset()
  const sign = offset <= 0 ? '+' : '-'
  const abs = Math.abs(offset)
  const h = String(Math.floor(abs / 60)).padStart(2, '0')
  const m = String(abs % 60).padStart(2, '0')
  return `${sign}${h}:${m}`
}

function escapeField(value) {
  return String(value).replace(/\n/g, ' ').replace(/\r/g, '').trim()
}

export function buildSecurityTxt(options) {
  const lines = []

  const contacts = (options.contact || [])
    .map((c) => String(c).trim())
    .filter(Boolean)

  contacts.forEach((c) => {
    lines.push(`${FIELD_NAMES.contact}: ${escapeField(c)}`)
  })

  if (options.expires) {
    lines.push(`${FIELD_NAMES.expires}: ${escapeField(options.expires)}`)
  }

  ;[
    'acknowledgments',
    'canonical',
    'encryption',
    'hiring',
    'policy',
    'preferredLanguages',
    'csaf',
  ].forEach((key) => {
    const value = options[key]
    if (value && String(value).trim()) {
      lines.push(`${FIELD_NAMES[key]}: ${escapeField(value)}`)
    }
  })

  if (options.includeSignature) {
    lines.push('')
    lines.push('-----BEGIN PGP SIGNATURE-----')
    lines.push('')
    lines.push('-----END PGP SIGNATURE-----')
  }

  const text = lines.join('\n')
  return text.endsWith('\n') ? text : `${text}\n`
}

export function validateSecurityTxt(options) {
  const errors = []
  const warnings = []

  const contacts = (options.contact || [])
    .map((c) => String(c).trim())
    .filter(Boolean)

  if (contacts.length === 0) {
    errors.push('contactRequired')
  } else {
    contacts.forEach((c) => {
      if (!/^mailto:|^https?:\/\//.test(c) && !/^\+?[\d\s\-()]+$/.test(c)) {
        warnings.push('contactLooksInvalid')
      }
    })
  }

  if (!options.expires || !String(options.expires).trim()) {
    errors.push('expiresRequired')
  } else {
    const d = new Date(options.expires)
    if (Number.isNaN(d.getTime())) {
      errors.push('expiresInvalid')
    }
  }

  ;[
    { key: 'acknowledgments', type: 'url' },
    { key: 'canonical', type: 'url' },
    { key: 'encryption', type: 'url-or-key' },
    { key: 'hiring', type: 'url' },
    { key: 'policy', type: 'url' },
    { key: 'csaf', type: 'url' },
  ].forEach(({ key, type }) => {
    const value = options[key]
    if (!value || !String(value).trim()) return

    if (type === 'url' && !/^https?:\/\//.test(value)) {
      warnings.push(`${key}NotUrl`)
    }
    if (type === 'url-or-key' && !/^https?:\/\//.test(value) && !/^openpgp4fpr:/i.test(value)) {
      warnings.push(`${key}NotUrlOrFingerprint`)
    }
  })

  if (options.canonical) {
    const values = String(options.canonical)
      .split(/\s+/)
      .map((s) => s.trim())
      .filter(Boolean)
    if (values.length > 1) {
      warnings.push('canonicalMultiple')
    }
  }

  return { errors, warnings }
}

export function buildHtmlExample(options) {
  return `<a href="${options.policy || '#'}" rel="nofollow">${options.policy || 'Security policy'}</a>`
}
