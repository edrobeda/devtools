// Gerador de configuração Renovate
// 100% client-side: monta arquivos renovate.json sem nenhuma chamada de rede.

export const EXTENDS_OPTIONS = [
  { value: 'config:recommended', label: 'config:recommended' },
  { value: 'config:best-practices', label: 'config:best-practices' },
  { value: 'config:js-app', label: 'config:js-app' },
  { value: 'config:ts-app', label: 'config:ts-app' },
  { value: 'config:node', label: 'config:node' },
  { value: 'config:python', label: 'config:python' },
  { value: 'config:docker', label: 'config:docker' },
  { value: 'config:github-actions', label: 'config:github-actions' },
  { value: 'config:base', label: 'config:base' },
  { value: 'group:all', label: 'group:all' },
  { value: 'group:monorepos', label: 'group:monorepos' },
  { value: 'group:test', label: 'group:test' },
  { value: 'group:linters', label: 'group:linters' },
  { value: ':dependencyDashboard', label: ':dependencyDashboard' },
  { value: ':maintainLockFilesMonthly', label: ':maintainLockFilesMonthly' },
  { value: ':pinAllExceptPeerDependencies', label: ':pinAllExceptPeerDependencies' },
  { value: ':automergePatch', label: ':automergePatch' },
  { value: ':automergeMinor', label: ':automergeMinor' },
  { value: ':automergeDigest', label: ':automergeDigest' },
  { value: ':semanticCommits', label: ':semanticCommits' },
  { value: ':semanticCommitTypeAll(fix)', label: ':semanticCommitTypeAll(fix)' },
  { value: ':timezone(America/Sao_Paulo)', label: ':timezone(America/Sao_Paulo)' },
]

export const PLATFORMS = [
  { value: 'github', label: 'GitHub' },
  { value: 'gitlab', label: 'GitLab' },
  { value: 'bitbucket', label: 'Bitbucket' },
  { value: 'azure', label: 'Azure DevOps' },
  { value: 'gitea', label: 'Gitea' },
]

export const SCHEDULE_OPTIONS = [
  { value: 'at any time', label: { pt: 'A qualquer momento', en: 'At any time' } },
  { value: 'before 5am on monday', label: { pt: 'Antes das 5h às segundas', en: 'Before 5am on Monday' } },
  { value: 'after 10pm every weekday', label: { pt: 'Após 22h em dias úteis', en: 'After 10pm every weekday' } },
  { value: 'every weekend', label: { pt: 'Todo fim de semana', en: 'Every weekend' } },
  { value: 'on the first day of the month', label: { pt: 'No primeiro dia do mês', en: 'On the first day of the month' } },
  { value: 'between 00:00 and 04:00', label: { pt: 'Entre 00:00 e 04:00', en: 'Between 00:00 and 04:00' } },
]

export const RANGE_STRATEGIES = [
  { value: 'auto', label: 'auto' },
  { value: 'pin', label: 'pin' },
  { value: 'bump', label: 'bump' },
  { value: 'replace', label: 'replace' },
  { value: 'widen', label: 'widen' },
]

export const REBASE_OPTIONS = [
  { value: 'auto', label: 'auto' },
  { value: 'conflicted', label: 'conflicted' },
  { value: 'never', label: 'never' },
  { value: 'behind-base-branch', label: 'behind-base-branch' },
]

export const AUTOMERGE_TYPES = [
  { value: 'pr', label: 'pr' },
  { value: 'branch', label: 'branch' },
]

export const PACKAGE_MANAGERS = [
  { value: 'npm', label: 'npm' },
  { value: 'yarn', label: 'yarn' },
  { value: 'pnpm', label: 'pnpm' },
  { value: 'pip', label: 'pip' },
  { value: 'poetry', label: 'poetry' },
  { value: 'dockerfile', label: 'Dockerfile' },
  { value: 'github-actions', label: 'GitHub Actions' },
  { value: 'gitlabci', label: 'GitLab CI' },
  { value: 'terraform', label: 'Terraform' },
  { value: 'gomod', label: 'Go modules' },
]

export const DEFAULT_PACKAGE_RULE = {
  matchDepTypes: [],
  matchUpdateTypes: [],
  matchManagers: [],
  matchPackageNames: [],
  matchPackagePatterns: [],
  groupName: '',
  enabled: true,
  automerge: false,
}

export const UPDATE_TYPES = [
  { value: 'major', label: 'major' },
  { value: 'minor', label: 'minor' },
  { value: 'patch', label: 'patch' },
  { value: 'digest', label: 'digest' },
  { value: 'lockFileMaintenance', label: 'lockFileMaintenance' },
  { value: 'rollback', label: 'rollback' },
]

export const PRESETS = {
  recommended: {
    label: { pt: 'Recomendado', en: 'Recommended' },
    platform: 'github',
    extends: ['config:recommended'],
    schedule: 'at any time',
    timezone: '',
    dependencyDashboard: true,
    automerge: false,
    automergeType: 'pr',
    platformAutomerge: false,
    rangeStrategy: 'auto',
    rebaseWhen: 'auto',
    labels: ['dependencies'],
    assignees: [],
    reviewers: [],
    branchPrefix: 'renovate/',
    commitMessagePrefix: '',
    prConcurrentLimit: 10,
    prHourlyLimit: 2,
    lockFileMaintenance: true,
    vulnerabilityAlerts: true,
    packageRules: [],
  },
  javascript: {
    label: { pt: 'JavaScript/Node.js', en: 'JavaScript/Node.js' },
    platform: 'github',
    extends: ['config:js-app', ':dependencyDashboard'],
    schedule: 'before 5am on monday',
    timezone: 'America/Sao_Paulo',
    dependencyDashboard: true,
    automerge: false,
    automergeType: 'pr',
    platformAutomerge: false,
    rangeStrategy: 'bump',
    rebaseWhen: 'auto',
    labels: ['dependencies', 'javascript'],
    assignees: [],
    reviewers: [],
    branchPrefix: 'renovate/',
    commitMessagePrefix: '',
    prConcurrentLimit: 10,
    prHourlyLimit: 2,
    lockFileMaintenance: true,
    vulnerabilityAlerts: true,
    packageRules: [
      {
        matchManagers: ['npm'],
        matchDepTypes: ['devDependencies'],
        matchUpdateTypes: ['patch', 'minor'],
        automerge: true,
        groupName: 'dev-dependencies',
      },
    ],
  },
  typescript: {
    label: { pt: 'TypeScript', en: 'TypeScript' },
    platform: 'github',
    extends: ['config:ts-app', ':dependencyDashboard'],
    schedule: 'before 5am on monday',
    timezone: 'America/Sao_Paulo',
    dependencyDashboard: true,
    automerge: false,
    automergeType: 'pr',
    platformAutomerge: false,
    rangeStrategy: 'bump',
    rebaseWhen: 'auto',
    labels: ['dependencies', 'typescript'],
    assignees: [],
    reviewers: [],
    branchPrefix: 'renovate/',
    commitMessagePrefix: '',
    prConcurrentLimit: 10,
    prHourlyLimit: 2,
    lockFileMaintenance: true,
    vulnerabilityAlerts: true,
    packageRules: [
      {
        matchManagers: ['npm'],
        matchDepTypes: ['devDependencies'],
        matchUpdateTypes: ['patch'],
        automerge: true,
        groupName: 'ts-dev-dependencies',
      },
    ],
  },
  aggressive: {
    label: { pt: 'Automerge agressivo', en: 'Aggressive automerge' },
    platform: 'github',
    extends: ['config:recommended', ':automergePatch', ':automergeMinor'],
    schedule: 'at any time',
    timezone: '',
    dependencyDashboard: true,
    automerge: true,
    automergeType: 'pr',
    platformAutomerge: true,
    rangeStrategy: 'bump',
    rebaseWhen: 'auto',
    labels: ['dependencies'],
    assignees: [],
    reviewers: [],
    branchPrefix: 'renovate/',
    commitMessagePrefix: '',
    prConcurrentLimit: 20,
    prHourlyLimit: 5,
    lockFileMaintenance: true,
    vulnerabilityAlerts: true,
    packageRules: [],
  },
  conservative: {
    label: { pt: 'Conservador', en: 'Conservative' },
    platform: 'github',
    extends: ['config:best-practices', ':dependencyDashboard'],
    schedule: 'every weekend',
    timezone: 'America/Sao_Paulo',
    dependencyDashboard: true,
    automerge: false,
    automergeType: 'pr',
    platformAutomerge: false,
    rangeStrategy: 'widen',
    rebaseWhen: 'conflicted',
    labels: ['dependencies', 'review-required'],
    assignees: [],
    reviewers: [],
    branchPrefix: 'renovate/',
    commitMessagePrefix: '',
    prConcurrentLimit: 5,
    prHourlyLimit: 1,
    lockFileMaintenance: true,
    vulnerabilityAlerts: true,
    packageRules: [
      {
        matchUpdateTypes: ['major'],
        addLabels: ['major-upgrade'],
      },
    ],
  },
  minimal: {
    label: { pt: 'Mínimo', en: 'Minimal' },
    platform: 'github',
    extends: ['config:base'],
    schedule: 'at any time',
    timezone: '',
    dependencyDashboard: false,
    automerge: false,
    automergeType: 'pr',
    platformAutomerge: false,
    rangeStrategy: 'auto',
    rebaseWhen: 'auto',
    labels: [],
    assignees: [],
    reviewers: [],
    branchPrefix: 'renovate/',
    commitMessagePrefix: '',
    prConcurrentLimit: 10,
    prHourlyLimit: 2,
    lockFileMaintenance: false,
    vulnerabilityAlerts: true,
    packageRules: [],
  },
}

function cleanArray(value) {
  if (!value) return []
  if (Array.isArray(value)) return value.filter(Boolean)
  if (typeof value === 'string') {
    return value
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean)
  }
  return []
}

function cleanPackageRule(rule) {
  const out = {}
  const depTypes = cleanArray(rule.matchDepTypes)
  const updateTypes = cleanArray(rule.matchUpdateTypes)
  const managers = cleanArray(rule.matchManagers)
  const packageNames = cleanArray(rule.matchPackageNames)
  const packagePatterns = cleanArray(rule.matchPackagePatterns)

  if (depTypes.length) out.matchDepTypes = depTypes
  if (updateTypes.length) out.matchUpdateTypes = updateTypes
  if (managers.length) out.matchManagers = managers
  if (packageNames.length) out.matchPackageNames = packageNames
  if (packagePatterns.length) out.matchPackagePatterns = packagePatterns
  if (rule.groupName) out.groupName = rule.groupName
  if (rule.automerge === true) out.automerge = true
  if (rule.automerge === false && out.matchUpdateTypes?.length) out.automerge = false
  if (rule.enabled === false) out.enabled = false
  if (rule.addLabels?.length) out.addLabels = cleanArray(rule.addLabels)
  return Object.keys(out).length > 0 ? out : null
}

export function buildRenovateConfig(options) {
  const opts = { ...PRESETS.recommended, ...options }
  const out = {}

  if (opts.platform && opts.platform !== 'github') {
    out.platform = opts.platform
  }

  const extendsArr = cleanArray(opts.extends)
  if (extendsArr.length) out.extends = extendsArr

  if (opts.schedule && opts.schedule !== 'at any time') {
    out.schedule = opts.schedule
  }

  if (opts.timezone) out.timezone = opts.timezone

  if (opts.labels?.length) out.labels = cleanArray(opts.labels)
  if (opts.assignees?.length) out.assignees = cleanArray(opts.assignees)
  if (opts.reviewers?.length) out.reviewers = cleanArray(opts.reviewers)

  if (opts.branchPrefix && opts.branchPrefix !== 'renovate/') {
    out.branchPrefix = opts.branchPrefix
  }

  if (opts.commitMessagePrefix) out.commitMessagePrefix = opts.commitMessagePrefix

  if (opts.dependencyDashboard === false) out.dependencyDashboard = false
  if (opts.dependencyDashboard === true && !extendsArr.some((e) => e.includes('dependencyDashboard'))) {
    out.dependencyDashboard = true
  }

  if (opts.automerge === true) out.automerge = true
  if (opts.automergeType && opts.automergeType !== 'pr') out.automergeType = opts.automergeType
  if (opts.platformAutomerge === true) out.platformAutomerge = true

  if (opts.rangeStrategy && opts.rangeStrategy !== 'auto') out.rangeStrategy = opts.rangeStrategy
  if (opts.rebaseWhen && opts.rebaseWhen !== 'auto') out.rebaseWhen = opts.rebaseWhen

  if (opts.prConcurrentLimit !== undefined && opts.prConcurrentLimit !== 10) {
    out.prConcurrentLimit = Number(opts.prConcurrentLimit) || 0
  }

  if (opts.prHourlyLimit !== undefined && opts.prHourlyLimit !== 2) {
    out.prHourlyLimit = Number(opts.prHourlyLimit) || 0
  }

  if (opts.lockFileMaintenance === true && !extendsArr.some((e) => e.includes('maintainLockFiles'))) {
    out.lockFileMaintenance = { enabled: true }
  }

  if (opts.vulnerabilityAlerts === true) out.vulnerabilityAlerts = { enabled: true }

  const rules = Array.isArray(opts.packageRules)
    ? opts.packageRules.map(cleanPackageRule).filter(Boolean)
    : []
  if (rules.length) out.packageRules = rules

  return JSON.stringify(out, null, 2)
}
