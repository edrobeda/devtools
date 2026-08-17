// Gerador de workflow do GitHub Actions — 100% client-side.
// Monta arquivos .github/workflows/*.yml com nome, triggers, jobs, steps,
// variáveis, permissões, matrix e services. Tudo é gerado como texto YAML
// manualmente, sem depender de bibliotecas externas.

export function clone(o) {
  try {
    return JSON.parse(JSON.stringify(o))
  } catch {
    return o
  }
}

export function createStep() {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: '',
    uses: '',
    run: '',
    with: '',
    env: '',
    if: '',
    workingDirectory: '',
  }
}

export function createJob() {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: '',
    runsOn: 'ubuntu-latest',
    needs: '',
    if: '',
    env: '',
    strategyMatrix: '',
    timeoutMinutes: '',
    outputs: '',
    steps: [createStep()],
  }
}

export const RUNNER_OPTIONS = [
  { value: 'ubuntu-latest', label: 'ubuntu-latest' },
  { value: 'ubuntu-24.04', label: 'ubuntu-24.04' },
  { value: 'ubuntu-22.04', label: 'ubuntu-22.04' },
  { value: 'windows-latest', label: 'windows-latest' },
  { value: 'windows-2022', label: 'windows-2022' },
  { value: 'macos-latest', label: 'macos-latest' },
  { value: 'macos-14', label: 'macos-14' },
  { value: 'macos-13', label: 'macos-13' },
  { value: '${{ matrix.os }}', label: 'matrix.os' },
]

export const PERMISSION_OPTIONS = [
  { value: '', label: { pt: 'padrão (não definir)', en: 'default (do not set)' } },
  { value: 'read-all', label: 'read-all' },
  { value: 'write-all', label: 'write-all' },
  { value: 'contents: read', label: 'contents: read' },
  { value: 'contents: write', label: 'contents: write' },
  { value: 'pull-requests: write', label: 'pull-requests: write' },
  { value: 'packages: write', label: 'packages: write' },
  { value: 'id-token: write', label: 'id-token: write' },
  { value: 'actions: read', label: 'actions: read' },
  { value: 'security-events: write', label: 'security-events: write' },
]

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

function indent(level) {
  return '  '.repeat(level)
}

function addScalar(lines, key, value, level = 0) {
  const v = String(value || '').trim()
  if (v !== '') lines.push(`${indent(level)}${key}: ${q(v)}`)
}

function addRawScalar(lines, key, value, level = 0) {
  const v = String(value || '').trim()
  if (v !== '') lines.push(`${indent(level)}${key}: ${v}`)
}

function addVariables(lines, header, raw, level = 0) {
  const vars = parseVariables(raw)
  if (!vars.length) return
  lines.push(`${indent(level)}${header}:`)
  for (const { key, value } of vars) {
    lines.push(`${indent(level + 1)}${key}: ${q(value)}`)
  }
}

function addList(lines, key, raw, level = 0) {
  const items = parseLines(raw)
  if (!items.length) return
  lines.push(`${indent(level)}${key}:`)
  for (const item of items) {
    lines.push(`${indent(level + 1)}- ${q(item)}`)
  }
}

function addObjectFromKeyValue(lines, header, raw, level = 0) {
  const vars = parseVariables(raw)
  if (!vars.length) return
  lines.push(`${indent(level)}${header}:`)
  for (const { key, value } of vars) {
    lines.push(`${indent(level + 1)}${key}: ${q(value)}`)
  }
}

function addWorkflowDispatchInputs(lines, raw, level = 0) {
  const inputs = parseVariables(raw)
  if (!inputs.length) return
  lines.push(`${indent(level)}workflow_dispatch:`)
  lines.push(`${indent(level + 1)}inputs:`)
  for (const { key, value } of inputs) {
    const [type, desc, defaultVal] = value.split('|').map((s) => s.trim())
    lines.push(`${indent(level + 2)}${key}:`)
    addScalar(lines, 'description', desc || key, level + 3)
    addRawScalar(lines, 'type', type || 'string', level + 3)
    if (defaultVal !== undefined) {
      addScalar(lines, 'default', defaultVal, level + 3)
    }
    lines.push(`${indent(level + 3)}required: false`)
  }
}

function addSchedule(lines, raw, level = 0) {
  const items = parseLines(raw)
  if (!items.length) return
  lines.push(`${indent(level)}schedule:`)
  for (const item of items) {
    lines.push(`${indent(level + 1)}- cron: ${q(item)}`)
  }
}

function addReleaseTrigger(lines, raw, level = 0) {
  const items = parseLines(raw)
  if (!items.length) return
  lines.push(`${indent(level)}release:`)
  lines.push(`${indent(level + 1)}types:`)
  for (const item of items) {
    lines.push(`${indent(level + 2)}- ${q(item)}`)
  }
}

function addPermissions(lines, raw, level = 0) {
  const v = String(raw || '').trim()
  if (!v) return
  if (v === 'read-all' || v === 'write-all') {
    lines.push(`${indent(level)}permissions: ${v}`)
    return
  }
  const [scope, access] = v.split(':').map((s) => s.trim())
  if (scope && access) {
    lines.push(`${indent(level)}permissions:`)
    lines.push(`${indent(level + 1)}${scope}: ${access}`)
  }
}

function addStep(lines, step, level = 0) {
  lines.push(`${indent(level)}-`)
  addScalar(lines, 'name', step.name, level + 1)
  addScalar(lines, 'uses', step.uses, level + 1)
  if (String(step.run || '').trim()) {
    const runLines = String(step.run).split('\n')
    if (runLines.length === 1) {
      addScalar(lines, 'run', step.run, level + 1)
    } else {
      lines.push(`${indent(level + 1)}run: |`)
      for (const runLine of runLines) {
        lines.push(`${indent(level + 2)}${runLine}`)
      }
    }
  }
  addObjectFromKeyValue(lines, 'with', step.with, level + 1)
  addVariables(lines, 'env', step.env, level + 1)
  addRawScalar(lines, 'if', step.if, level + 1)
  addScalar(lines, 'working-directory', step.workingDirectory, level + 1)
}

function addJob(lines, job, level = 0) {
  lines.push(`${indent(level)}${job.name || 'job'}:`)
  const inner = level + 1
  addScalar(lines, 'name', job.name, inner)
  addRawScalar(lines, 'runs-on', job.runsOn || 'ubuntu-latest', inner)
  addList(lines, 'needs', job.needs, inner)
  addRawScalar(lines, 'if', job.if, inner)
  addVariables(lines, 'env', job.env, inner)
  if (String(job.strategyMatrix || '').trim()) {
    const matrixVars = parseVariables(job.strategyMatrix)
    if (matrixVars.length) {
      lines.push(`${indent(inner)}strategy:`)
      lines.push(`${indent(inner + 1)}matrix:`)
      for (const { key, value } of matrixVars) {
        const values = value.split(',').map((s) => s.trim()).filter(Boolean)
        if (values.length) {
          lines.push(`${indent(inner + 2)}${key}:`)
          for (const val of values) {
            lines.push(`${indent(inner + 3)}- ${q(val)}`)
          }
        }
      }
    }
  }
  if (String(job.timeoutMinutes || '').trim()) {
    lines.push(`${indent(inner)}timeout-minutes: ${Number(job.timeoutMinutes) || 0}`)
  }
  addObjectFromKeyValue(lines, 'outputs', job.outputs, inner)
  if (job.steps && job.steps.length) {
    lines.push(`${indent(inner)}steps:`)
    for (const step of job.steps) {
      addStep(lines, step, inner + 1)
    }
  }
}

export function buildWorkflow(config) {
  const lines = []
  lines.push(`name: ${q(config.name || 'CI')}`)

  const on = []
  if (config.pushBranches || config.pushTags) on.push('push')
  if (config.pullRequestBranches) on.push('pull_request')
  if (config.workflowDispatchInputs !== undefined && config.workflowDispatchInputs !== '') on.push('workflow_dispatch')
  if (config.scheduleCron) on.push('schedule')
  if (config.releaseTypes) on.push('release')

  if (on.length === 0) {
    on.push('push')
  }

  if (on.length === 1 && !config.pushBranches && !config.pushTags && !config.pullRequestBranches && !config.workflowDispatchInputs && !config.scheduleCron && !config.releaseTypes) {
    lines.push(`on: ${on[0]}`)
  } else {
    lines.push('on:')
    if (on.includes('push')) {
      lines.push('  push:')
      addList(lines, 'branches', config.pushBranches, 2)
      addList(lines, 'tags', config.pushTags, 2)
    }
    if (on.includes('pull_request')) {
      lines.push('  pull_request:')
      addList(lines, 'branches', config.pullRequestBranches, 2)
    }
    if (on.includes('workflow_dispatch')) {
      addWorkflowDispatchInputs(lines, config.workflowDispatchInputs, 1)
    }
    if (on.includes('schedule')) {
      addSchedule(lines, config.scheduleCron, 1)
    }
    if (on.includes('release')) {
      addReleaseTrigger(lines, config.releaseTypes, 1)
    }
  }

  addPermissions(lines, config.permissions, 0)

  if (String(config.concurrencyGroup || '').trim()) {
    lines.push('concurrency:')
    addScalar(lines, 'group', config.concurrencyGroup, 1)
    if (config.concurrencyCancelInProgress) {
      lines.push('  cancel-in-progress: true')
    }
  }

  addVariables(lines, 'env', config.env, 0)

  if (config.jobs && config.jobs.length) {
    lines.push('jobs:')
    for (const job of config.jobs) {
      addJob(lines, job, 1)
    }
  }

  return lines.join('\n')
}

export function validateWorkflow(config) {
  const warnings = []
  if (!String(config.name || '').trim()) warnings.push({ key: 'wNameEmpty', data: {} })

  const hasTrigger =
    config.pushBranches ||
    config.pushTags ||
    config.pullRequestBranches ||
    config.workflowDispatchInputs ||
    config.scheduleCron ||
    config.releaseTypes
  if (!hasTrigger) warnings.push({ key: 'wNoTrigger', data: {} })

  if (!config.jobs || !config.jobs.length) {
    warnings.push({ key: 'wNoJobs', data: {} })
  } else {
    const seen = new Set()
    for (const job of config.jobs) {
      const jobName = String(job.name || '').trim()
      if (!jobName) {
        warnings.push({ key: 'wJobNameEmpty', data: {} })
      } else {
        if (!/^[a-zA-Z0-9_-]+$/.test(jobName)) {
          warnings.push({ key: 'wJobNameInvalid', data: { name: jobName } })
        }
        if (seen.has(jobName)) {
          warnings.push({ key: 'wJobNameDuplicate', data: { name: jobName } })
        }
        seen.add(jobName)
      }

      if (!job.steps || !job.steps.length) {
        warnings.push({ key: 'wJobNoSteps', data: { name: jobName || '(unnamed)' } })
      } else {
        let hasRunOrUses = false
        for (const step of job.steps) {
          if (String(step.run || '').trim() || String(step.uses || '').trim()) {
            hasRunOrUses = true
            break
          }
        }
        if (!hasRunOrUses) {
          warnings.push({ key: 'wJobNoRunOrUses', data: { name: jobName || '(unnamed)' } })
        }
      }
    }
  }

  return warnings
}

function makePreset(labelPt, labelEn, overrides) {
  return {
    label: { pt: labelPt, en: labelEn },
    name: '',
    pushBranches: 'main\nmaster',
    pushTags: '',
    pullRequestBranches: 'main\nmaster',
    workflowDispatchInputs: '',
    scheduleCron: '',
    releaseTypes: '',
    permissions: '',
    concurrencyGroup: '',
    concurrencyCancelInProgress: false,
    env: 'CI: true',
    jobs: [createJob()],
    ...overrides,
  }
}

export const PRESETS = {
  node: makePreset('Node.js CI', 'Node.js CI', {
    name: 'Node.js CI',
    pushBranches: 'main',
    pullRequestBranches: 'main',
    env: 'CI: true\nNODE_ENV: test',
    jobs: [
      {
        ...createJob(),
        name: 'test',
        runsOn: 'ubuntu-latest',
        strategyMatrix: 'node-version: 18, 20, 22',
        steps: [
          { ...createStep(), name: 'Checkout', uses: 'actions/checkout@v4' },
          { ...createStep(), name: 'Setup Node.js', uses: 'actions/setup-node@v4', with: 'node-version: ${{ matrix.node-version }}\ncache: npm' },
          { ...createStep(), name: 'Install', run: 'npm ci' },
          { ...createStep(), name: 'Test', run: 'npm test' },
        ],
      },
    ],
  }),
  python: makePreset('Python CI', 'Python CI', {
    name: 'Python CI',
    pushBranches: 'main',
    pullRequestBranches: 'main',
    env: 'CI: true',
    jobs: [
      {
        ...createJob(),
        name: 'test',
        runsOn: 'ubuntu-latest',
        strategyMatrix: 'python-version: 3.10, 3.11, 3.12',
        steps: [
          { ...createStep(), name: 'Checkout', uses: 'actions/checkout@v4' },
          { ...createStep(), name: 'Setup Python', uses: 'actions/setup-python@v5', with: 'python-version: ${{ matrix.python-version }}' },
          { ...createStep(), name: 'Install', run: 'pip install -r requirements.txt' },
          { ...createStep(), name: 'Test', run: 'pytest' },
        ],
      },
    ],
  }),
  go: makePreset('Go CI', 'Go CI', {
    name: 'Go CI',
    pushBranches: 'main',
    pullRequestBranches: 'main',
    env: 'CI: true\nGOFLAGS: -mod=readonly',
    jobs: [
      {
        ...createJob(),
        name: 'build',
        runsOn: 'ubuntu-latest',
        steps: [
          { ...createStep(), name: 'Checkout', uses: 'actions/checkout@v4' },
          { ...createStep(), name: 'Setup Go', uses: 'actions/setup-go@v5', with: 'go-version: 1.22' },
          { ...createStep(), name: 'Build', run: 'go build ./...' },
          { ...createStep(), name: 'Test', run: 'go test ./...' },
        ],
      },
    ],
  }),
  docker: makePreset('Docker Build & Push', 'Docker Build & Push', {
    name: 'Docker Build & Push',
    pushBranches: 'main',
    pullRequestBranches: 'main',
    permissions: 'packages: write\nid-token: write',
    concurrencyGroup: 'docker-${{ github.ref }}',
    concurrencyCancelInProgress: true,
    env: 'REGISTRY: ghcr.io',
    jobs: [
      {
        ...createJob(),
        name: 'build-and-push',
        runsOn: 'ubuntu-latest',
        steps: [
          { ...createStep(), name: 'Checkout', uses: 'actions/checkout@v4' },
          { ...createStep(), name: 'Set up QEMU', uses: 'docker/setup-qemu-action@v3' },
          { ...createStep(), name: 'Set up Buildx', uses: 'docker/setup-buildx-action@v3' },
          { ...createStep(), name: 'Login to GHCR', uses: 'docker/login-action@v3', with: 'registry: ghcr.io\nusername: ${{ github.actor }}\npassword: ${{ secrets.GITHUB_TOKEN }}' },
          { ...createStep(), name: 'Build and push', uses: 'docker/build-push-action@v5', with: 'context: .\npush: ${{ github.event_name != \"pull_request\" }}\ntags: ghcr.io/${{ github.repository }}:latest' },
        ],
      },
    ],
  }),
  pages: makePreset('Deploy to GitHub Pages', 'Deploy to GitHub Pages', {
    name: 'Deploy to GitHub Pages',
    pushBranches: 'main',
    permissions: 'contents: read\npages: write\nid-token: write',
    concurrencyGroup: 'pages-${{ github.ref }}',
    concurrencyCancelInProgress: true,
    jobs: [
      {
        ...createJob(),
        name: 'build',
        runsOn: 'ubuntu-latest',
        steps: [
          { ...createStep(), name: 'Checkout', uses: 'actions/checkout@v4' },
          { ...createStep(), name: 'Setup Node.js', uses: 'actions/setup-node@v4', with: 'node-version: 20\ncache: npm' },
          { ...createStep(), name: 'Install', run: 'npm ci' },
          { ...createStep(), name: 'Build', run: 'npm run build' },
          { ...createStep(), name: 'Upload artifact', uses: 'actions/upload-pages-artifact@v3', with: 'path: ./dist' },
        ],
      },
      {
        ...createJob(),
        name: 'deploy',
        runsOn: 'ubuntu-latest',
        needs: 'build',
        if: "github.ref == 'refs/heads/main'",
        steps: [
          { ...createStep(), name: 'Deploy to GitHub Pages', uses: 'actions/deploy-pages@v4' },
        ],
      },
    ],
  }),
}

export const DEFAULTS = makePreset('Personalizado', 'Custom')
