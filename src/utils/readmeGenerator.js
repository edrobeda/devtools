export const OUTPUT_LANGS = ['pt', 'en', 'es']

export const TEMPLATES = ['minimal', 'standard', 'library', 'opensource']

export const PACKAGE_MANAGERS = {
  npm: { install: 'npm install', run: 'npm run', addDev: 'npm install --save-dev' },
  yarn: { install: 'yarn', run: 'yarn', addDev: 'yarn add --dev' },
  pnpm: { install: 'pnpm install', run: 'pnpm', addDev: 'pnpm add -D' },
}

export const LICENSES = [
  'MIT',
  'Apache-2.0',
  'GPL-3.0',
  'LGPL-3.0',
  'BSD-3-Clause',
  'MPL-2.0',
  'Unlicense',
  'none',
]

export const CODE_LANGS = ['bash', 'js', 'jsx', 'ts', 'tsx', 'json', 'yaml', 'python', 'go', 'rust', 'text']

export const SECTION_KEYS = [
  'features',
  'stack',
  'prerequisites',
  'install',
  'usage',
  'structure',
  'scripts',
  'testing',
  'roadmap',
  'contributing',
  'license',
  'author',
]

export const BADGE_KEYS = ['build', 'license', 'npm', 'coverage', 'issues', 'prs', 'stars', 'lastCommit']

export const TEMPLATE_PRESETS = {
  minimal: {
    sections: ['install', 'usage', 'license'],
    badges: [],
    usageLang: 'bash',
  },
  standard: {
    sections: ['features', 'stack', 'prerequisites', 'install', 'usage', 'structure', 'license'],
    badges: ['license'],
    usageLang: 'bash',
  },
  library: {
    sections: ['features', 'install', 'usage', 'scripts', 'testing', 'license'],
    badges: ['npm', 'license'],
    usageLang: 'js',
  },
  opensource: {
    sections: ['features', 'stack', 'prerequisites', 'install', 'usage', 'structure', 'testing', 'roadmap', 'contributing', 'license', 'author'],
    badges: ['build', 'license', 'stars', 'issues', 'prs'],
    usageLang: 'bash',
  },
}

export const EMPTY_CONFIG = {
  template: 'standard',
  lang: 'pt',
  name: '',
  tagline: '',
  repoUrl: '',
  homepage: '',
  author: '',
  contact: '',
  license: 'MIT',
  pm: 'npm',
  packageName: '',
  usageLang: 'bash',
  sections: {
    features: true,
    stack: false,
    prerequisites: false,
    install: true,
    usage: true,
    structure: false,
    scripts: false,
    testing: false,
    roadmap: false,
    contributing: false,
    license: true,
    author: false,
  },
  badges: {
    build: false,
    license: true,
    npm: false,
    coverage: false,
    issues: false,
    prs: false,
    stars: false,
    lastCommit: false,
  },
  features: '',
  stack: '',
  prerequisites: '',
  install: '',
  usage: '',
  structure: '',
  scripts: '',
  testing: '',
  roadmap: '',
  contributing: '',
}

const LABELS = {
  pt: {
    untitled: 'Meu Projeto',
    features: 'Funcionalidades',
    stack: 'Stack',
    prerequisites: 'Pré-requisitos',
    install: 'Instalação',
    usage: 'Uso',
    structure: 'Estrutura do projeto',
    scripts: 'Scripts disponíveis',
    testing: 'Testes',
    roadmap: 'Roadmap',
    contributing: 'Contribuindo',
    license: 'Licença',
    contact: 'Contato',
    clone: 'clonar o repositório',
    enter: 'entrar na pasta',
    installDeps: 'instalar as dependências',
    runDev: 'rodar em desenvolvimento',
    build: 'gerar build de produção',
    test: 'rodar os testes',
    scriptCol: 'Script',
    descCol: 'Descrição',
    viewDemo: 'Demo',
    viewDocs: 'Documentação',
    licenseLine: (license, author) => {
      if (license === 'none') return 'Este projeto não possui uma licença definida.'
      const who = author ? ` © ${new Date().getFullYear()} ${author}.` : ''
      return `Distribuído sob a licença ${license}.${who} Veja o arquivo [LICENSE](LICENSE) para mais detalhes.`
    },
    authorLine: 'Feito e mantido por',
    repoFallback: 'https://github.com/usuario/projeto',
  },
  en: {
    untitled: 'My Project',
    features: 'Features',
    stack: 'Tech Stack',
    prerequisites: 'Prerequisites',
    install: 'Installation',
    usage: 'Usage',
    structure: 'Project Structure',
    scripts: 'Available Scripts',
    testing: 'Testing',
    roadmap: 'Roadmap',
    contributing: 'Contributing',
    license: 'License',
    contact: 'Contact',
    clone: 'clone the repository',
    enter: 'enter the folder',
    installDeps: 'install dependencies',
    runDev: 'run in development',
    build: 'build for production',
    test: 'run the tests',
    scriptCol: 'Script',
    descCol: 'Description',
    viewDemo: 'Demo',
    viewDocs: 'Docs',
    licenseLine: (license, author) => {
      if (license === 'none') return 'This project has no license defined.'
      const who = author ? ` © ${new Date().getFullYear()} ${author}.` : ''
      return `Distributed under the ${license} license.${who} See [LICENSE](LICENSE) for more details.`
    },
    authorLine: 'Made and maintained by',
    repoFallback: 'https://github.com/user/project',
  },
  es: {
    untitled: 'Mi Proyecto',
    features: 'Características',
    stack: 'Stack',
    prerequisites: 'Requisitos previos',
    install: 'Instalación',
    usage: 'Uso',
    structure: 'Estructura del proyecto',
    scripts: 'Scripts disponibles',
    testing: 'Pruebas',
    roadmap: 'Roadmap',
    contributing: 'Contribuir',
    license: 'Licencia',
    contact: 'Contacto',
    clone: 'clonar el repositorio',
    enter: 'entrar en la carpeta',
    installDeps: 'instalar las dependencias',
    runDev: 'ejecutar en desarrollo',
    build: 'generar build de producción',
    test: 'ejecutar las pruebas',
    scriptCol: 'Script',
    descCol: 'Descripción',
    viewDemo: 'Demo',
    viewDocs: 'Documentación',
    licenseLine: (license, author) => {
      if (license === 'none') return 'Este proyecto no tiene una licencia definida.'
      const who = author ? ` © ${new Date().getFullYear()} ${author}.` : ''
      return `Distribuido bajo la licencia ${license}.${who} Consulta el archivo [LICENSE](LICENSE) para más detalles.`
    },
    authorLine: 'Hecho y mantenido por',
    repoFallback: 'https://github.com/usuario/proyecto',
  },
}

export function labelsFor(lang) {
  return LABELS[lang] || LABELS.en
}

export function parseGithubRepo(repoUrl) {
  const m = /github\.com[/:]([^/\s]+)\/([^/#?\s]+)/i.exec(String(repoUrl || ''))
  if (!m) return null
  return { owner: m[1], repo: m[2].replace(/\.git$/i, '') }
}

function toList(value) {
  return String(value || '')
    .split('\n')
    .map((line) => line.replace(/^\s*[-*+]\s+/, '').trim())
    .filter(Boolean)
}

function fence(code, lang) {
  const body = String(code || '').replace(/\s+$/, '')
  return '```' + (lang || '') + '\n' + body + '\n```'
}

function slugify(name) {
  return String(name || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function buildBadges(config) {
  const badges = []
  const gh = parseGithubRepo(config.repoUrl)
  const b = config.badges || {}
  if (b.build && gh) {
    badges.push(`![Build](https://img.shields.io/github/actions/workflow/status/${gh.owner}/${gh.repo}/ci.yml?branch=main&label=build)`)
  }
  if (b.license && config.license && config.license !== 'none') {
    badges.push(`![License](https://img.shields.io/badge/license-${encodeURIComponent(config.license)}-blue)`)
  }
  if (b.npm && config.packageName) {
    badges.push(`![npm](https://img.shields.io/npm/v/${encodeURIComponent(config.packageName)})`)
  }
  if (b.coverage) {
    badges.push('![Coverage](https://img.shields.io/badge/coverage-100%25-brightgreen)')
  }
  if (gh) {
    if (b.issues) badges.push(`![Issues](https://img.shields.io/github/issues/${gh.owner}/${gh.repo})`)
    if (b.prs) badges.push(`![Pull Requests](https://img.shields.io/github/issues-pr/${gh.owner}/${gh.repo})`)
    if (b.stars) badges.push(`![Stars](https://img.shields.io/github/stars/${gh.owner}/${gh.repo})`)
    if (b.lastCommit) badges.push(`![Last Commit](https://img.shields.io/github/last-commit/${gh.owner}/${gh.repo})`)
  }
  return badges
}

export function parseScripts(value) {
  return toList(value).map((line) => {
    const m = /^([^:=-]+)\s*[:=|-]\s*(.+)$/.exec(line)
    if (m) return { name: m[1].trim(), desc: m[2].trim() }
    return { name: line.trim(), desc: '' }
  })
}

export function buildReadme(config) {
  const t = labelsFor(config.lang)
  const name = String(config.name || '').trim() || t.untitled
  const pm = PACKAGE_MANAGERS[config.pm] || PACKAGE_MANAGERS.npm
  const s = config.sections || {}
  const out = []

  out.push(`# ${name}`)
  if (config.tagline) out.push('', String(config.tagline).trim())

  const links = []
  if (config.homepage) links.push(`[${t.viewDemo}](${config.homepage.trim()})`)
  if (config.repoUrl) links.push(`[${t.viewDocs}](${config.repoUrl.trim()})`)
  if (links.length) out.push('', links.join(' · '))

  const badges = buildBadges(config)
  if (badges.length) out.push('', badges.join(' '))

  if (s.features) {
    const items = toList(config.features)
    if (items.length) {
      out.push('', `## ${t.features}`, '', ...items.map((i) => `- ${i}`))
    }
  }

  if (s.stack) {
    const items = toList(config.stack)
    if (items.length) {
      out.push('', `## ${t.stack}`, '', ...items.map((i) => `- ${i}`))
    }
  }

  const prereq = toList(config.prerequisites)
  const installSteps = toList(config.install)
  if (s.prerequisites && prereq.length) {
    out.push('', `## ${t.prerequisites}`, '', ...prereq.map((i) => `- ${i}`))
  }

  if (s.install) {
    const cmd = []
    cmd.push(`# ${t.clone}`)
    cmd.push(`git clone ${config.repoUrl ? config.repoUrl.trim() : t.repoFallback}`)
    cmd.push(`cd ${slugify(name) || 'projeto'}`)
    cmd.push('')
    cmd.push(`# ${t.installDeps}`)
    cmd.push(pm.install)
    if (installSteps.length) {
      cmd.push('', ...installSteps)
    }
    out.push('', `## ${t.install}`, '', fence(cmd.join('\n'), 'bash'))
  }

  if (s.usage) {
    const usage = String(config.usage || '').replace(/\s+$/, '')
    if (usage.trim()) {
      out.push('', `## ${t.usage}`, '', fence(usage, config.usageLang))
    }
  }

  if (s.structure) {
    const structure = String(config.structure || '').replace(/\s+$/, '')
    if (structure.trim()) {
      out.push('', `## ${t.structure}`, '', fence(structure, 'text'))
    }
  }

  if (s.scripts) {
    const scripts = parseScripts(config.scripts)
    if (scripts.length) {
      out.push('', `## ${t.scripts}`, '', `| ${t.scriptCol} | ${t.descCol} |`, '| --- | --- |')
      scripts.forEach((sc) => out.push(`| \`${pm.run} ${sc.name}\` | ${sc.desc} |`))
    }
  }

  if (s.testing) {
    const testing = String(config.testing || '').replace(/\s+$/, '')
    if (testing.trim()) {
      out.push('', `## ${t.testing}`, '', fence(testing, 'bash'))
    }
  }

  if (s.roadmap) {
    const items = toList(config.roadmap)
    if (items.length) {
      out.push('', `## ${t.roadmap}`, '', ...items.map((i) => `- [ ] ${i}`))
    }
  }

  if (s.contributing) {
    const contributing = String(config.contributing || '').trim()
    out.push('', `## ${t.contributing}`, '', contributing || '-')
  }

  if (s.license) {
    out.push('', `## ${t.license}`, '', t.licenseLine(config.license, config.author))
  }

  if (s.author) {
    const who = String(config.author || '').trim()
    if (who || config.contact) {
      out.push('', `## ${t.authorLine}`, '')
      if (who) out.push(`- ${who}`)
      if (config.contact) out.push(`- ${config.contact.trim()}`)
    }
  }

  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n'
}
