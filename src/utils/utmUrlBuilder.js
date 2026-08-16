// Motor 100% client-side do Construtor de URL com UTM.
// Nenhuma URL ou parâmetro sai do navegador.

export const UTM_KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_id',
  'utm_term',
  'utm_content',
]

// Lista de canais comuns e os valores padrão recomendados de source/medium.
export const UTM_PRESETS = {
  googleAds: { source: 'google', medium: 'cpc' },
  facebook: { source: 'facebook', medium: 'social' },
  instagram: { source: 'instagram', medium: 'social' },
  linkedin: { source: 'linkedin', medium: 'social' },
  twitter: { source: 'twitter', medium: 'social' },
  newsletter: { source: 'newsletter', medium: 'email' },
  email: { source: 'email', medium: 'email' },
  youtube: { source: 'youtube', medium: 'video' },
  organic: { source: 'google', medium: 'organic' },
  referral: { source: 'referral', medium: 'referral' },
}

export function isValidUrl(input) {
  if (!input || typeof input !== 'string') return false
  try {
    const url = new URL(input.trim())
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export function parseBaseUrl(input) {
  const trimmed = (input || '').trim()
  if (!trimmed) return { ok: false, error: 'empty' }
  try {
    const url = new URL(trimmed)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return { ok: false, error: 'protocol' }
    }
    return { ok: true, url }
  } catch {
    return { ok: false, error: 'invalid' }
  }
}

export function normalizeUtmValue(value) {
  if (value === null || value === undefined) return ''
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_\-./]/g, '-')
}

export function buildUtmUrl(baseUrl, params) {
  const parsed = parseBaseUrl(baseUrl)
  if (!parsed.ok) return ''

  const url = new URL(parsed.url.href)

  // Remove UTM params antigos para não duplicar ou misturar campanhas.
  UTM_KEYS.forEach((key) => url.searchParams.delete(key))

  // Adiciona params na ordem padrão UTM primeiro.
  UTM_KEYS.forEach((key) => {
    const value = params[key]
    if (value && String(value).trim()) {
      url.searchParams.set(key, String(value).trim())
    }
  })

  // Parâmetros customizados (não-UTM) adicionados depois.
  Object.entries(params).forEach(([key, value]) => {
    if (UTM_KEYS.includes(key)) return
    if (key && String(value).trim()) {
      url.searchParams.set(key, String(value).trim())
    }
  })

  return url.toString()
}

export function extractUtmParams(inputUrl) {
  const parsed = parseBaseUrl(inputUrl)
  if (!parsed.ok) return {}
  const result = {}
  UTM_KEYS.forEach((key) => {
    const value = parsed.url.searchParams.get(key)
    if (value) result[key] = value
  })
  return result
}

export function validateUtmParams(params) {
  const warnings = []
  const source = (params.utm_source || '').trim()
  const medium = (params.utm_medium || '').trim()
  const campaign = (params.utm_campaign || '').trim()

  if (!source) warnings.push({ field: 'utm_source', type: 'required' })
  if (!medium) warnings.push({ field: 'utm_medium', type: 'required' })
  if (!campaign) warnings.push({ field: 'utm_campaign', type: 'required' })

  if (source && /[A-Z\s]/.test(source)) {
    warnings.push({ field: 'utm_source', type: 'case' })
  }
  if (medium && /[A-Z\s]/.test(medium)) {
    warnings.push({ field: 'utm_medium', type: 'case' })
  }
  if (campaign && /\s/.test(campaign)) {
    warnings.push({ field: 'utm_campaign', type: 'whitespace' })
  }

  return warnings
}

export function applyPreset(presetKey, campaign = '') {
  const preset = UTM_PRESETS[presetKey]
  if (!preset) return {}
  return {
    utm_source: preset.source,
    utm_medium: preset.medium,
    utm_campaign: campaign.trim(),
  }
}

export function buildShortLabel(params) {
  const source = (params.utm_source || '').trim()
  const medium = (params.utm_medium || '').trim()
  const campaign = (params.utm_campaign || '').trim()
  const parts = [source, medium, campaign].filter(Boolean)
  return parts.join(' / ') || '-'
}
