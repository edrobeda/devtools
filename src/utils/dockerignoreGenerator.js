// Gerador de .dockerignore
// 100% client-side: monta o arquivo .dockerignore a partir de presets e
// linhas customizadas, sem nenhuma chamada de rede.

function normalizeLine(line) {
  return line.replace(/\s+$/, '').replace(/^\s+/, '')
}

function isPattern(line) {
  return line && !line.startsWith('#')
}

export const PRESETS = {
  generic: {
    label: { pt: 'Genérico', en: 'Generic' },
    lines: [
      '# Git',
      '.git',
      '.gitignore',
      '.gitattributes',
      '.github',
      '',
      '# Editor / IDE',
      '.vscode',
      '.idea',
      '*.swp',
      '*.swo',
      '*~',
      '',
      '# OS',
      '.DS_Store',
      'Thumbs.db',
      '',
      '# Documentação',
      'README.md',
      'CHANGELOG.md',
      'LICENSE',
      'docs/',
      '',
      '# CI / CD',
      '.github/workflows/',
      '.gitlab-ci.yml',
      'Jenkinsfile',
    ],
  },
  node: {
    label: { pt: 'Node.js', en: 'Node.js' },
    lines: [
      '# Dependências',
      'node_modules/',
      '.pnpm-store/',
      '',
      '# Build / cache',
      'dist/',
      'build/',
      '.next/',
      '.nuxt/',
      '.cache/',
      '.parcel-cache/',
      '',
      '# Variáveis de ambiente',
      '.env',
      '.env.*',
      '!.env.example',
      '',
      '# Logs',
      'logs/',
      '*.log',
      'npm-debug.log*',
      'yarn-debug.log*',
      'yarn-error.log*',
      '.pnpm-debug.log*',
      '',
      '# Testes / cobertura',
      'coverage/',
      '.nyc_output/',
      '',
      '# Ferramentas',
      '.eslintcache',
      '.prettiercache',
      '.stylelintcache',
    ],
  },
  python: {
    label: { pt: 'Python', en: 'Python' },
    lines: [
      '# Ambientes virtuais',
      '.venv/',
      'venv/',
      'env/',
      '__pycache__/',
      '*.py[cod]',
      '*$py.class',
      '',
      '# Build / dist',
      'build/',
      'dist/',
      '*.egg-info/',
      '.eggs/',
      '',
      '# Testes / cobertura',
      '.pytest_cache/',
      '.coverage',
      'htmlcov/',
      '.tox/',
      '',
      '# Variáveis de ambiente',
      '.env',
      '.env.*',
      '!.env.example',
      '',
      '# Mypy / Ruff',
      '.mypy_cache/',
      '.ruff_cache/',
    ],
  },
  go: {
    label: { pt: 'Go', en: 'Go' },
    lines: [
      '# Binários',
      '*.exe',
      '*.dll',
      '*.so',
      '*.dylib',
      '/bin/',
      '/vendor/',
      '',
      '# Testes',
      '*_test.go',
      '',
      '# Coverage',
      'coverage.out',
      'coverage.html',
      '',
      '# Variáveis de ambiente',
      '.env',
      '.env.*',
      '!.env.example',
    ],
  },
  java: {
    label: { pt: 'Java (Maven/Gradle)', en: 'Java (Maven/Gradle)' },
    lines: [
      '# Build',
      'target/',
      'build/',
      'out/',
      '*.jar',
      '*.war',
      '*.ear',
      '',
      '# Gradle',
      '.gradle/',
      'gradle/',
      'gradlew',
      'gradlew.bat',
      '',
      '# Maven',
      '.mvn/',
      '',
      '# IDEs',
      '.idea/',
      '*.iml',
      '.classpath',
      '.project',
      '.settings/',
      '',
      '# Logs',
      '*.log',
    ],
  },
  ruby: {
    label: { pt: 'Ruby', en: 'Ruby' },
    lines: [
      '# Bundler',
      'vendor/bundle/',
      '.bundle/',
      '',
      '# Build / cache',
      'tmp/',
      'log/',
      'public/assets/',
      'node_modules/',
      '',
      '# Testes / cobertura',
      'coverage/',
      '',
      '# Variáveis de ambiente',
      '.env',
      '.env.*',
      '!.env.example',
    ],
  },
  php: {
    label: { pt: 'PHP / Composer', en: 'PHP / Composer' },
    lines: [
      '# Composer',
      'vendor/',
      'composer.lock',
      '',
      '# Laravel / Symfony',
      'storage/framework/cache/',
      'storage/framework/sessions/',
      'storage/framework/views/',
      'bootstrap/cache/',
      'var/cache/',
      'var/log/',
      '',
      '# Testes / cobertura',
      'coverage/',
      '',
      '# Variáveis de ambiente',
      '.env',
      '.env.*',
      '!.env.example',
    ],
  },
  rust: {
    label: { pt: 'Rust', en: 'Rust' },
    lines: [
      '# Build',
      'target/',
      '',
      '# IDEs',
      '.idea/',
      '.vscode/',
      '',
      '# Variáveis de ambiente',
      '.env',
      '.env.*',
      '!.env.example',
    ],
  },
}

// Une múltiplos presets e linhas customizadas, removendo padrões duplicados
// (mas preservando comentários e linhas em branco de separação).
// Atenção: padrões negados (começam com !) não são deduplicados, pois a ordem
// entre inclusão/negação importa no Docker.
export function buildDockerignore(presetKeys, customLines) {
  const seen = new Set()
  const out = []

  function pushLine(line) {
    const normalized = normalizeLine(line)
    if (!normalized) {
      // Preserva uma única linha em branco entre blocos, ignora múltiplas.
      if (out.length && out[out.length - 1] !== '') {
        out.push('')
      }
      return
    }
    if (normalized.startsWith('#')) {
      out.push(normalized)
      return
    }
    // Preserva negações e padrões únicos.
    if (normalized.startsWith('!')) {
      out.push(normalized)
      return
    }
    if (!seen.has(normalized)) {
      seen.add(normalized)
      out.push(normalized)
    }
  }

  for (const key of presetKeys) {
    const preset = PRESETS[key]
    if (!preset) continue
    if (presetKeys.length > 1) {
      out.push(`# ${preset.label.en}`)
    }
    for (const line of preset.lines) {
      pushLine(line)
    }
  }

  if (customLines && customLines.trim()) {
    if (out.length && out[out.length - 1] !== '') {
      out.push('')
    }
    out.push('# Custom')
    for (const line of customLines.split('\n')) {
      pushLine(line)
    }
  }

  // Remove linha em branco no início ou fim.
  while (out.length && out[0] === '') out.shift()
  while (out.length && out[out.length - 1] === '') out.pop()

  return out.join('\n')
}
