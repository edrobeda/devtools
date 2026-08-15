// Gerador de assinatura de e-mail HTML
// 100% client-side — nenhum dado sai do navegador.
//
// Gera tabelas HTML inline com estilos inline, compatíveis com a maioria dos
// clientes de e-mail (que ignoram <style> externo).

export const TEMPLATES = [
  { key: 'clean', labelKey: 'templateClean' },
  { key: 'modern', labelKey: 'templateModern' },
  { key: 'compact', labelKey: 'templateCompact' },
  { key: 'vertical', labelKey: 'templateVertical' },
  { key: 'minimal', labelKey: 'templateMinimal' },
]

export const DEFAULTS = {
  template: 'clean',
  name: '',
  role: '',
  company: '',
  email: '',
  phone: '',
  website: '',
  linkedIn: '',
  github: '',
  photoUrl: '',
  primaryColor: '#1677ff',
  secondaryColor: '#595959',
}

export const PRESETS = [
  {
    key: 'developer',
    label: { pt: 'Desenvolvedor(a)', en: 'Developer' },
    state: {
      name: 'Ana Silva',
      role: 'Software Engineer',
      company: 'EventifyLab',
      email: 'ana.silva@eventifylab.com',
      phone: '+55 11 91234-5678',
      website: 'https://eventifylab.com',
      linkedIn: 'https://linkedin.com/in/anasilva',
      github: 'https://github.com/anasilva',
      photoUrl: '',
      primaryColor: '#1677ff',
      secondaryColor: '#595959',
    },
  },
  {
    key: 'designer',
    label: { pt: 'Designer', en: 'Designer' },
    state: {
      name: 'Bruno Costa',
      role: 'Product Designer',
      company: 'Studio Digital',
      email: 'bruno@studiodigital.com',
      phone: '+55 21 99876-5432',
      website: 'https://studiodigital.com',
      linkedIn: 'https://linkedin.com/in/brunocosta',
      github: '',
      photoUrl: '',
      primaryColor: '#722ed1',
      secondaryColor: '#595959',
    },
  },
  {
    key: 'founder',
    label: { pt: 'Fundador(a)', en: 'Founder' },
    state: {
      name: 'Carolina Mendes',
      role: 'CEO & Co-founder',
      company: 'StartupX',
      email: 'carolina@startupx.io',
      phone: '+55 31 98765-4321',
      website: 'https://startupx.io',
      linkedIn: 'https://linkedin.com/in/carolinamendes',
      github: '',
      photoUrl: '',
      primaryColor: '#cf1322',
      secondaryColor: '#262626',
    },
  },
]

export function escapeHtml(text) {
  if (text == null) return ''
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function normalizeUrl(url) {
  if (!url) return ''
  const trimmed = url.trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

export function displayUrl(url) {
  if (!url) return ''
  return url.replace(/^https?:\/\//i, '').replace(/\/$/, '')
}

function socialLinks(state) {
  const links = []
  if (state.website) {
    links.push({
      href: normalizeUrl(state.website),
      text: displayUrl(state.website),
      icon: '🌐',
    })
  }
  if (state.linkedIn) {
    links.push({
      href: normalizeUrl(state.linkedIn),
      text: 'LinkedIn',
      icon: '💼',
    })
  }
  if (state.github) {
    links.push({
      href: normalizeUrl(state.github),
      text: 'GitHub',
      icon: '🐙',
    })
  }
  return links
}

function photoCell(photoUrl, primaryColor) {
  if (!photoUrl.trim()) return ''
  return `
              <td style="padding-right: 16px; vertical-align: top;">
                <img src="${escapeHtml(photoUrl)}" alt="" width="80" height="80" style="border-radius: 50%; border: 2px solid ${escapeHtml(primaryColor)}; display: block;" />
              </td>`
}

function nameBlock(name, role, company, primaryColor, secondaryColor) {
  const parts = []
  if (name.trim()) {
    parts.push(`<div style="margin: 0 0 4px 0; font-size: 18px; font-weight: 700; color: ${escapeHtml(primaryColor)}; line-height: 1.2;">${escapeHtml(name)}</div>`)
  }
  if (role.trim()) {
    parts.push(`<div style="margin: 0 0 4px 0; font-size: 14px; font-weight: 600; color: ${escapeHtml(secondaryColor)}; line-height: 1.3;">${escapeHtml(role)}</div>`)
  }
  if (company.trim()) {
    parts.push(`<div style="margin: 0 0 8px 0; font-size: 13px; color: #8c8c8c; line-height: 1.3;">${escapeHtml(company)}</div>`)
  }
  return parts.join('')
}

function contactLines(state, secondaryColor) {
  const lines = []
  if (state.email.trim()) {
    lines.push(`<a href="mailto:${escapeHtml(state.email)}" style="color: ${escapeHtml(secondaryColor)}; text-decoration: none;">${escapeHtml(state.email)}</a>`)
  }
  if (state.phone.trim()) {
    lines.push(`<a href="tel:${escapeHtml(state.phone.replace(/\s/g, ''))}" style="color: ${escapeHtml(secondaryColor)}; text-decoration: none;">${escapeHtml(state.phone)}</a>`)
  }
  return lines
}

function socialLine(links, primaryColor) {
  if (!links.length) return ''
  const items = links.map((link) => `
                    <a href="${escapeHtml(link.href)}" style="color: ${escapeHtml(primaryColor)}; text-decoration: none; font-size: 13px;">${link.icon} ${escapeHtml(link.text)}</a>`)
  return `
                  <div style="margin-top: 8px; line-height: 1.6;">
                    ${items.join('<span style="color: #d9d9d9; margin: 0 8px;">|</span>')}
                  </div>`
}

function renderClean(state) {
  const links = socialLinks(state)
  const contacts = contactLines(state, state.secondaryColor)
  const hasPhoto = state.photoUrl.trim()

  return `<table cellpadding="0" cellspacing="0" border="0" style="font-family: Arial, Helvetica, sans-serif; color: #262626;">
  <tr>
${photoCell(state.photoUrl, state.primaryColor)}
    <td style="vertical-align: top;">
      ${nameBlock(state.name, state.role, state.company, state.primaryColor, state.secondaryColor)}
      <div style="font-size: 13px; line-height: 1.6; color: ${escapeHtml(state.secondaryColor)};">
        ${contacts.join('<br>')}
      </div>
      ${socialLine(links, state.primaryColor)}
    </td>
  </tr>
</table>`
}

function renderModern(state) {
  const links = socialLinks(state)
  const contacts = contactLines(state, state.secondaryColor)
  const hasPhoto = state.photoUrl.trim()

  return `<table cellpadding="0" cellspacing="0" border="0" style="font-family: Arial, Helvetica, sans-serif; color: #262626; border-left: 4px solid ${escapeHtml(state.primaryColor)}; padding-left: 16px;">
  <tr>
${photoCell(state.photoUrl, state.primaryColor)}
    <td style="vertical-align: top;">
      ${nameBlock(state.name, state.role, state.company, state.primaryColor, state.secondaryColor)}
      <div style="font-size: 13px; line-height: 1.6; color: ${escapeHtml(state.secondaryColor)};">
        ${contacts.join('<br>')}
      </div>
      ${socialLine(links, state.primaryColor)}
    </td>
  </tr>
</table>`
}

function renderCompact(state) {
  const links = socialLinks(state)
  const contacts = contactLines(state, state.secondaryColor)
  const allParts = [
    state.name && `<strong style="color: ${escapeHtml(state.primaryColor)};">${escapeHtml(state.name)}</strong>`,
    state.role && escapeHtml(state.role),
    state.company && escapeHtml(state.company),
    ...contacts,
    ...links.map((l) => `<a href="${escapeHtml(l.href)}" style="color: ${escapeHtml(state.primaryColor)}; text-decoration: none;">${escapeHtml(l.text)}</a>`),
  ].filter(Boolean)

  return `<div style="font-family: Arial, Helvetica, sans-serif; font-size: 13px; color: ${escapeHtml(state.secondaryColor)}; line-height: 1.6;">
  ${allParts.join('<span style="color: #d9d9d9; margin: 0 8px;">|</span>')}
</div>`
}

function renderVertical(state) {
  const links = socialLinks(state)
  const contacts = contactLines(state, state.secondaryColor)
  const photo = state.photoUrl.trim()
    ? `<img src="${escapeHtml(state.photoUrl)}" alt="" width="90" height="90" style="border-radius: 50%; border: 3px solid ${escapeHtml(state.primaryColor)}; display: block; margin: 0 auto 12px auto;" />`
    : ''

  return `<table cellpadding="0" cellspacing="0" border="0" style="font-family: Arial, Helvetica, sans-serif; color: #262626; text-align: center;">
  <tr>
    <td style="padding: 16px; border: 1px solid #f0f0f0; border-radius: 12px;">
      ${photo}
      ${nameBlock(state.name, state.role, state.company, state.primaryColor, state.secondaryColor).replace(/text-align:/g, '').replace(/style="/g, 'style="text-align: center; ')}
      <div style="font-size: 13px; line-height: 1.6; color: ${escapeHtml(state.secondaryColor)}; text-align: center;">
        ${contacts.join('<br>')}
      </div>
      ${socialLine(links, state.primaryColor).replace(/margin-top: 8px;/g, 'margin-top: 12px; text-align: center;')}
    </td>
  </tr>
</table>`
}

function renderMinimal(state) {
  const contacts = contactLines(state, state.secondaryColor)
  const links = socialLinks(state)

  return `<div style="font-family: Arial, Helvetica, sans-serif; color: #262626; line-height: 1.5;">
  <div style="font-size: 16px; font-weight: 700; color: ${escapeHtml(state.primaryColor)};">${escapeHtml(state.name)}</div>
  ${state.role ? `<div style="font-size: 13px; color: ${escapeHtml(state.secondaryColor)};">${escapeHtml(state.role)}${state.company ? ` · ${escapeHtml(state.company)}` : ''}</div>` : ''}
  ${contacts.length ? `<div style="font-size: 13px; color: ${escapeHtml(state.secondaryColor)}; margin-top: 6px;">${contacts.join(' · ')}</div>` : ''}
  ${links.length ? `<div style="font-size: 13px; margin-top: 6px;">${links.map((l) => `<a href="${escapeHtml(l.href)}" style="color: ${escapeHtml(state.primaryColor)}; text-decoration: none;">${escapeHtml(l.text)}</a>`).join(' · ')}</div>` : ''}
</div>`
}

export function generateSignature(state) {
  switch (state.template) {
    case 'modern':
      return renderModern(state)
    case 'compact':
      return renderCompact(state)
    case 'vertical':
      return renderVertical(state)
    case 'minimal':
      return renderMinimal(state)
    case 'clean':
    default:
      return renderClean(state)
  }
}

export function generatePlainText(state) {
  const lines = [
    state.name,
    state.role,
    state.company,
    state.email,
    state.phone,
    state.website,
    state.linkedIn,
    state.github,
  ].filter(Boolean)
  return lines.join('\n')
}

export function isValidHex(value) {
  return /^#([0-9a-fA-F]{3}){1,2}$/.test(value || '')
}
