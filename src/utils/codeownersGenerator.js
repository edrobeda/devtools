// Gerador de CODEOWNERS
// 100% client-side: monta o arquivo CODEOWNERS usado pelo GitHub/GitLab/Bitbucket
// para definir responsáveis por padrões de arquivo. Nenhum dado sai do navegador.

export const PRESETS = {
  minimal: {
    label: { pt: 'Mínimo', en: 'Minimal' },
    rules: [{ pattern: '*', owners: ['@my-org/team'] }],
  },
  monorepo: {
    label: { pt: 'Monorepo', en: 'Monorepo' },
    rules: [
      { pattern: '*', owners: ['@my-org/maintainers'] },
      { pattern: '/apps/web/**', owners: ['@my-org/frontend'] },
      { pattern: '/apps/api/**', owners: ['@my-org/backend'] },
      { pattern: '/packages/**', owners: ['@my-org/platform'] },
      { pattern: '/packages/ui/**', owners: ['@my-org/frontend'] },
      { pattern: '/infra/**', owners: ['@my-org/devops'] },
      { pattern: 'package.json', owners: ['@my-org/platform'] },
      { pattern: 'pnpm-lock.yaml', owners: ['@my-org/platform'] },
    ],
  },
  security: {
    label: { pt: 'Segurança', en: 'Security' },
    rules: [
      { pattern: '*', owners: ['@my-org/engineering'] },
      { pattern: '/.github/workflows/**', owners: ['@my-org/security', '@my-org/devops'] },
      { pattern: '/.github/**', owners: ['@my-org/security'] },
      { pattern: '**/secrets*', owners: ['@my-org/security'] },
      { pattern: 'package-lock.json', owners: ['@my-org/security', '@my-org/platform'] },
      { pattern: 'yarn.lock', owners: ['@my-org/security', '@my-org/platform'] },
      { pattern: 'pnpm-lock.yaml', owners: ['@my-org/security', '@my-org/platform'] },
    ],
  },
  docs: {
    label: { pt: 'Documentação', en: 'Docs' },
    rules: [
      { pattern: '*', owners: ['@my-org/engineering'] },
      { pattern: '*.md', owners: ['@my-org/docs'] },
      { pattern: '/docs/**', owners: ['@my-org/docs'] },
      { pattern: '/i18n/**', owners: ['@my-org/docs'] },
      { pattern: 'README*', owners: ['@my-org/docs'] },
      { pattern: 'CONTRIBUTING*', owners: ['@my-org/docs'] },
    ],
  },
}

function formatComment(text) {
  if (!text) return ''
  return String(text)
    .split('\n')
    .map((line) => (line.trim() ? `# ${line.trim()}` : '#'))
    .join('\n')
}

function validateOwner(owner) {
  const trimmed = owner.trim()
  if (!trimmed) return false
  if (trimmed.startsWith('@')) return trimmed.length > 1
  // Aceita e-mail simples como owner
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)
}

export function buildCodeowners({ header, headerText, rules }) {
  const lines = []

  if (header && headerText) {
    const comment = formatComment(headerText)
    if (comment) lines.push(comment, '')
  }

  for (const rule of rules || []) {
    const pattern = (rule.pattern || '').trim()
    const owners = (rule.owners || [])
      .map((o) => o.trim())
      .filter(validateOwner)
    if (!pattern || owners.length === 0) continue
    lines.push(`${pattern} ${owners.join(' ')}`)
  }

  return lines.join('\n')
}

export function validateCodeowners({ rules }) {
  const errors = []
  for (let i = 0; i < (rules || []).length; i++) {
    const rule = rules[i]
    const pattern = (rule.pattern || '').trim()
    const owners = (rule.owners || [])
      .map((o) => o.trim())
      .filter(Boolean)
    if (!pattern) {
      errors.push({ index: i, message: 'missing-pattern' })
      continue
    }
    if (owners.length === 0) {
      errors.push({ index: i, message: 'missing-owners' })
      continue
    }
    const invalidOwners = owners.filter((o) => !validateOwner(o))
    if (invalidOwners.length) {
      errors.push({ index: i, message: 'invalid-owners', owners: invalidOwners })
    }
  }
  return errors
}
