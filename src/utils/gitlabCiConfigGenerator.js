// Gerador de .gitlab-ci.yml — 100% client-side.
// Monta pipelines do GitLab CI com stages, jobs, variáveis, cache, artifacts,
// services, needs, rules e workflow. Tudo é gerado como texto YAML manualmente,
// sem depender de bibliotecas externas.

export function clone(o) {
  try {
    return JSON.parse(JSON.stringify(o))
  } catch {
    return o
  }
}

export function createJob() {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: '',
    stage: '',
    image: '',
    script: '',
    beforeScript: '',
    afterScript: '',
    rules: '',
    tags: '',
    allowFailure: false,
    timeout: '',
    artifactsPaths: '',
    artifactsExpire: '',
    cacheKey: '',
    cachePaths: '',
    services: '',
    dependencies: '',
    needs: '',
    when: '',
  }
}

function parseLines(raw) {
  const text = Array.isArray(raw) ? raw.join('\n') : String(raw || '')
  return text
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
}

function parseVariables(raw) {
  return parseLines(raw).map((line) => {
    const idx = line.indexOf('=')
    if (idx === -1) return { key: line, value: '' }
    return { key: line.slice(0, idx).trim(), value: line.slice(idx + 1).trim() }
  })
}

function q(s) {
  return JSON.stringify(String(s))
}

function addScalar(lines, key, value) {
  const v = String(value || '').trim()
  if (v !== '') lines.push(`${key}: ${q(v)}`)
}

function addList(lines, key, items, indent = 2) {
  if (!items.length) return
  const pad = ' '.repeat(indent)
  lines.push(`${key}:`)
  for (const item of items) {
    lines.push(`${pad}- ${q(item)}`)
  }
}

function addRawBlock(lines, header, rawLines, indent = 2) {
  if (!rawLines.length) return
  const pad = ' '.repeat(indent)
  lines.push(`${header}:`)
  for (const line of rawLines) {
    lines.push(`${pad}- ${q(line)}`)
  }
}

export const WHEN_OPTIONS = [
  { value: '', label: { pt: 'padrão (on_success)', en: 'default (on_success)' } },
  { value: 'on_success', label: { pt: 'on_success', en: 'on_success' } },
  { value: 'on_failure', label: { pt: 'on_failure', en: 'on_failure' } },
  { value: 'always', label: { pt: 'always', en: 'always' } },
  { value: 'manual', label: { pt: 'manual', en: 'manual' } },
  { value: 'delayed', label: { pt: 'delayed', en: 'delayed' } },
]

function makePreset(labelPt, labelEn, overrides) {
  return {
    label: { pt: labelPt, en: labelEn },
    image: '',
    stages: [],
    variables: '',
    beforeScript: '',
    afterScript: '',
    defaultTags: '',
    workflowRules: '',
    jobs: [createJob()],
    ...overrides,
  }
}

export const PRESETS = {
  node: makePreset('Aplicação Node.js', 'Node.js application', {
    image: 'node:20-alpine',
    stages: ['install', 'test', 'build', 'deploy'],
    variables: 'NODE_ENV=production\nCI=true',
    beforeScript: 'npm ci --cache .npm --prefer-offline',
    afterScript: 'echo "Pipeline finalizado"',
    defaultTags: 'docker\nlinux',
    workflowRules: '- if: \'$CI_PIPELINE_SOURCE == "push"\'',
    jobs: [
      { ...createJob(), name: 'install', stage: 'install', script: 'npm ci --cache .npm --prefer-offline' },
      { ...createJob(), name: 'test', stage: 'test', script: 'npm test', needs: 'install' },
      { ...createJob(), name: 'build', stage: 'build', script: 'npm run build', needs: 'test', artifactsPaths: 'dist\nbuild' },
      { ...createJob(), name: 'deploy', stage: 'deploy', script: 'echo "Deploy para produção"', needs: 'build' },
    ],
  }),
  python: makePreset('Aplicação Python', 'Python application', {
    image: 'python:3.12-slim',
    stages: ['lint', 'test', 'build', 'deploy'],
    variables: 'PIP_NO_CACHE_DIR=1',
    beforeScript: 'pip install -r requirements.txt',
    afterScript: 'echo "Pipeline finalizado"',
    defaultTags: 'docker',
    workflowRules: '- if: \'$CI_PIPELINE_SOURCE == "push"\'',
    jobs: [
      { ...createJob(), name: 'lint', stage: 'lint', script: 'flake8 src tests' },
      { ...createJob(), name: 'test', stage: 'test', script: 'pytest -q', needs: 'lint' },
      { ...createJob(), name: 'build', stage: 'build', script: 'python setup.py bdist_wheel', needs: 'test', artifactsPaths: 'dist' },
      { ...createJob(), name: 'deploy', stage: 'deploy', script: 'echo "Deploy para produção"', needs: 'build' },
    ],
  }),
  go: makePreset('Aplicação Go', 'Go application', {
    image: 'golang:1.22-alpine',
    stages: ['build', 'test', 'deploy'],
    variables: 'CGO_ENABLED=0',
    beforeScript: 'go mod download',
    afterScript: 'echo "Pipeline finalizado"',
    defaultTags: 'docker',
    workflowRules: '- if: \'$CI_PIPELINE_SOURCE == "push"\'',
    jobs: [
      { ...createJob(), name: 'build', stage: 'build', script: 'go build -o bin/app ./cmd/app', artifactsPaths: 'bin' },
      { ...createJob(), name: 'test', stage: 'test', script: 'go test ./...', needs: 'build' },
      { ...createJob(), name: 'deploy', stage: 'deploy', script: 'echo "Deploy para produção"', needs: 'test' },
    ],
  }),
  docker: makePreset('Build & push Docker', 'Docker build & push', {
    image: 'docker:24-dind',
    stages: ['build', 'push'],
    variables: 'DOCKER_DRIVER=overlay2\nDOCKER_TLS_CERTDIR=/certs',
    beforeScript: 'docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $CI_REGISTRY',
    afterScript: 'docker logout $CI_REGISTRY',
    defaultTags: 'docker',
    services: 'docker:24-dind',
    workflowRules: '- if: \'$CI_PIPELINE_SOURCE == "push"\'',
    jobs: [
      { ...createJob(), name: 'build-image', stage: 'build', script: 'docker build -t $CI_REGISTRY_IMAGE:$CI_COMMIT_SHORT_SHA .', services: 'docker:24-dind' },
      { ...createJob(), name: 'push-image', stage: 'push', script: 'docker push $CI_REGISTRY_IMAGE:$CI_COMMIT_SHORT_SHA', needs: 'build-image' },
    ],
  }),
  static: makePreset('Site estático', 'Static site', {
    image: 'node:20-alpine',
    stages: ['build', 'deploy'],
    variables: 'NODE_ENV=production',
    beforeScript: 'npm ci',
    afterScript: 'echo "Pipeline finalizado"',
    defaultTags: 'docker',
    workflowRules: '- if: \'$CI_PIPELINE_SOURCE == "push"\'',
    jobs: [
      { ...createJob(), name: 'build', stage: 'build', script: 'npm run build', artifactsPaths: 'dist' },
      { ...createJob(), name: 'deploy', stage: 'deploy', script: 'rsync -avz dist/ user@server:/var/www/site', needs: 'build' },
    ],
  }),
}

export const DEFAULTS = clone(PRESETS.node)

export function validateConfig(o, t) {
  const warnings = []
  const stages = parseLines(o.stages)
  const stageSet = new Set(stages)

  if (!o.jobs || o.jobs.length === 0) {
    warnings.push(t.wNoJobs || 'No jobs')
    return warnings
  }

  const names = new Set()
  for (const job of o.jobs) {
    const name = String(job.name || '').trim()
    if (!name) {
      warnings.push(t.wJobNameEmpty || 'Job name empty')
      continue
    }
    if (!/^[A-Za-z0-9_-]+$/.test(name)) {
      warnings.push((t.wJobNameInvalid || 'Invalid job name').replace('{name}', name))
    }
    if (names.has(name)) {
      warnings.push((t.wJobNameDuplicate || 'Duplicate job name').replace('{name}', name))
    }
    names.add(name)

    const stage = String(job.stage || '').trim()
    if (stage && !stageSet.has(stage) && stages.length > 0) {
      warnings.push((t.wStageMissing || 'Stage missing').replace('{stage}', stage).replace('{name}', name))
    }
    if (!parseLines(job.script).length) {
      warnings.push((t.wJobNoScript || 'Job without script').replace('{name}', name))
    }
  }

  return warnings
}

export function buildConfig(o) {
  const lines = []

  addScalar(lines, 'image', o.image)

  const stages = parseLines(o.stages)
  if (stages.length) {
    lines.push('stages:')
    for (const s of stages) lines.push(`  - ${s}`)
  }

  const vars = parseVariables(o.variables)
  if (vars.length) {
    lines.push('variables:')
    for (const { key, value } of vars) {
      if (key) lines.push(`  ${key}: ${q(value)}`)
    }
  }

  addRawBlock(lines, 'before_script', parseLines(o.beforeScript))
  addRawBlock(lines, 'after_script', parseLines(o.afterScript))

  const wf = parseLines(o.workflowRules)
  if (wf.length) {
    lines.push('workflow:')
    lines.push('  rules:')
    for (const r of wf) lines.push(`    ${r}`)
  }

  const defaultTags = parseLines(o.defaultTags)
  const globalServices = parseLines(o.services)

  for (let i = 0; i < o.jobs.length; i++) {
    const job = o.jobs[i]
    const name = String(job.name || '').trim()
    if (!name) continue

    if (i > 0) lines.push('')
    lines.push(`${name}:`)

    const stage = String(job.stage || '').trim()
    if (stage) lines.push(`  stage: ${stage}`)

    const image = String(job.image || '').trim()
    if (image) lines.push(`  image: ${q(image)}`)

    const tags = parseLines(job.tags)
    const allTags = tags.length ? tags : defaultTags
    addList(lines, '  tags', allTags, 4)

    addRawBlock(lines, '  before_script', parseLines(job.beforeScript), 4)
    addRawBlock(lines, '  script', parseLines(job.script), 4)
    addRawBlock(lines, '  after_script', parseLines(job.afterScript), 4)

    const rules = parseLines(job.rules)
    if (rules.length) {
      lines.push('  rules:')
      for (const r of rules) lines.push(`    ${r}`)
    }

    const when = String(job.when || '').trim()
    if (when) lines.push(`  when: ${when}`)
    if (job.allowFailure) lines.push('  allow_failure: true')

    const timeout = String(job.timeout || '').trim()
    if (timeout) lines.push(`  timeout: ${q(timeout)}`)

    const artPaths = parseLines(job.artifactsPaths)
    if (artPaths.length) {
      lines.push('  artifacts:')
      addList(lines, '    paths', artPaths, 6)
      const expire = String(job.artifactsExpire || '').trim()
      if (expire) lines.push(`    expire_in: ${q(expire)}`)
    }

    const cachePaths = parseLines(job.cachePaths)
    if (cachePaths.length) {
      lines.push('  cache:')
      const key = String(job.cacheKey || '').trim()
      if (key) lines.push(`    key: ${q(key)}`)
      addList(lines, '    paths', cachePaths, 6)
    }

    const services = parseLines(job.services)
    const allServices = services.length ? services : globalServices
    addList(lines, '  services', allServices, 4)

    addList(lines, '  dependencies', parseLines(job.dependencies), 4)
    addList(lines, '  needs', parseLines(job.needs), 4)
  }

  const text = lines.join('\n')
  return { text, fileName: '.gitlab-ci.yml' }
}
