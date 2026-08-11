// Gerador de Web App Manifest (manifest.json / .webmanifest)
// 100% client-side: monta o objeto da spec W3C a partir de campos editáveis,
// sem nenhuma chamada de rede.

export const DISPLAYS = ['fullscreen', 'standalone', 'minimal-ui', 'browser']

export const ORIENTATIONS = [
  'any',
  'natural',
  'landscape',
  'landscape-primary',
  'landscape-secondary',
  'portrait',
  'portrait-primary',
  'portrait-secondary',
]

export const DIRS = ['auto', 'ltr', 'rtl']

export const PURPOSES = ['any', 'monochrome', 'maskable', 'any maskable']

export const FORM_FACTORS = ['wide', 'narrow']

export const CATEGORIES = [
  'books',
  'business',
  'education',
  'entertainment',
  'finance',
  'fitness',
  'food',
  'games',
  'health',
  'kids',
  'lifestyle',
  'magazines',
  'medical',
  'music',
  'navigation',
  'news',
  'personalization',
  'photo',
  'politics',
  'productivity',
  'security',
  'shopping',
  'social',
  'sports',
  'travel',
  'utilities',
  'weather',
]

export const DEFAULTS = {
  name: 'DevTools',
  short_name: 'DevTools',
  description: 'Ferramentas internas de desenvolvimento.',
  start_url: '/',
  scope: '/',
  id: '/',
  display: 'standalone',
  orientation: 'any',
  theme_color: '#1677ff',
  background_color: '#ffffff',
  lang: 'pt-BR',
  dir: 'auto',
  categories: ['utilities', 'productivity'],
  icons: [
    { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
  ],
  screenshots: [],
  shortcuts: [],
  prefer_related_applications: false,
}

export const PRESETS = {
  minimal: {
    label: { pt: 'PWA mínimo', en: 'Minimal PWA' },
    ...DEFAULTS,
  },
  dashboard: {
    label: { pt: 'Dashboard / App', en: 'Dashboard / App' },
    ...DEFAULTS,
    name: 'Painel de Métricas',
    short_name: 'Métricas',
    description: 'Acompanhe métricas e relatórios em tempo real.',
    start_url: '/dashboard',
    scope: '/',
    id: '/dashboard',
    display: 'standalone',
    theme_color: '#0b1f35',
    background_color: '#0b1f35',
    categories: ['productivity', 'business'],
    icons: [
      { src: '/icons/dashboard-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/dashboard-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
    ],
    screenshots: [
      { src: '/screenshots/dashboard-wide.png', sizes: '1280x720', type: 'image/png', form_factor: 'wide', label: 'Dashboard no desktop' },
      { src: '/screenshots/dashboard-narrow.png', sizes: '750x1334', type: 'image/png', form_factor: 'narrow', label: 'Dashboard no mobile' },
    ],
  },
  blog: {
    label: { pt: 'Blog / Conteúdo', en: 'Blog / Content' },
    ...DEFAULTS,
    name: 'Blog da Empresa',
    short_name: 'Blog',
    description: 'Artigos, tutoriais e novidades da equipe.',
    start_url: '/blog',
    scope: '/',
    id: '/blog',
    display: 'minimal-ui',
    theme_color: '#ffffff',
    background_color: '#ffffff',
    categories: ['news'],
    icons: [
      { src: '/icons/blog-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/blog-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
    ],
  },
}

function clean(value) {
  if (value == null) return undefined
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed === '' ? undefined : trimmed
  }
  return value
}

function cleanArray(arr, requiredKey) {
  if (!Array.isArray(arr) || arr.length === 0) return undefined
  return arr
    .map((item) => {
      if (!item || typeof item !== 'object') return undefined
      const result = {}
      for (const [key, value] of Object.entries(item)) {
        const c = clean(value)
        if (c !== undefined) result[key] = c
      }
      return result[requiredKey] ? result : undefined
    })
    .filter(Boolean)
}

export function buildManifest(form, pretty = true) {
  const out = {}

  const name = clean(form.name)
  if (name) out.name = name

  const shortName = clean(form.short_name)
  if (shortName) out.short_name = shortName

  const description = clean(form.description)
  if (description) out.description = description

  const startUrl = clean(form.start_url)
  if (startUrl) out.start_url = startUrl

  const scope = clean(form.scope)
  if (scope) out.scope = scope

  const id = clean(form.id)
  if (id) out.id = id

  if (DISPLAYS.includes(form.display)) out.display = form.display
  if (ORIENTATIONS.includes(form.orientation)) out.orientation = form.orientation

  const themeColor = clean(form.theme_color)
  if (themeColor) out.theme_color = themeColor

  const backgroundColor = clean(form.background_color)
  if (backgroundColor) out.background_color = backgroundColor

  const lang = clean(form.lang)
  if (lang) out.lang = lang

  if (DIRS.includes(form.dir)) out.dir = form.dir

  const categories = cleanArray(form.categories?.map((c) => (typeof c === 'string' ? c : c.value)) || [], null)
  if (categories && categories.length) out.categories = categories

  const icons = cleanArray(form.icons, 'src')
  if (icons && icons.length) out.icons = icons

  const screenshots = cleanArray(form.screenshots, 'src')
  if (screenshots && screenshots.length) out.screenshots = screenshots

  const shortcuts = (form.shortcuts || [])
    .map((s) => {
      const result = {}
      const sName = clean(s.name)
      const sUrl = clean(s.url)
      if (!sName || !sUrl) return undefined
      result.name = sName
      const sShort = clean(s.short_name)
      if (sShort) result.short_name = sShort
      const sDesc = clean(s.description)
      if (sDesc) result.description = sDesc
      result.url = sUrl
      const sIcons = cleanArray(s.icons, 'src')
      if (sIcons && sIcons.length) result.icons = sIcons
      return result
    })
    .filter(Boolean)
  if (shortcuts.length) out.shortcuts = shortcuts

  if (form.prefer_related_applications === true) {
    out.prefer_related_applications = true
  }

  return JSON.stringify(out, null, pretty ? 2 : 0)
}

export function validateManifest(form) {
  const errors = []
  if (!clean(form.name)) errors.push({ field: 'name', message: 'name is required' })
  if (!clean(form.short_name)) errors.push({ field: 'short_name', message: 'short_name is required' })
  if (!clean(form.start_url)) errors.push({ field: 'start_url', message: 'start_url is required' })

  for (let i = 0; i < (form.icons || []).length; i++) {
    if (!clean(form.icons[i].src)) {
      errors.push({ field: 'icons', index: i, message: 'icon src is required' })
    }
  }
  for (let i = 0; i < (form.screenshots || []).length; i++) {
    if (!clean(form.screenshots[i].src)) {
      errors.push({ field: 'screenshots', index: i, message: 'screenshot src is required' })
    }
  }
  for (let i = 0; i < (form.shortcuts || []).length; i++) {
    if (!clean(form.shortcuts[i].name)) {
      errors.push({ field: 'shortcuts', index: i, message: 'shortcut name is required' })
    }
    if (!clean(form.shortcuts[i].url)) {
      errors.push({ field: 'shortcuts', index: i, message: 'shortcut url is required' })
    }
  }

  return errors
}
