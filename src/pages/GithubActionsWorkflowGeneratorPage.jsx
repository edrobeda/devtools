import React, { useMemo, useState } from 'react'
import {
  Typography,
  Card,
  Space,
  Input,
  Select,
  Switch,
  Button,
  Alert,
  Collapse,
  Row,
  Col,
  Segmented,
  message,
} from 'antd'
import {
  GithubOutlined,
  CopyOutlined,
  CheckOutlined,
  DownloadOutlined,
  PlusOutlined,
  DeleteOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  PRESETS,
  DEFAULTS,
  RUNNER_OPTIONS,
  PERMISSION_OPTIONS,
  createJob,
  createStep,
  buildWorkflow,
  validateWorkflow,
  clone,
} from '../utils/githubActionsWorkflowGenerator'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input
const { Panel } = Collapse

const translations = {
  pt: {
    title: 'Gerador de GitHub Actions Workflow',
    intro: (
      <>
        Monte workflows do GitHub Actions (<Text code>.github/workflows/*.yml</Text>) com
        triggers, jobs, steps, variáveis, permissões, matrix e concurrency. Tudo no
        navegador — nenhuma configuração sai da máquina.
      </>
    ),
    presetsTitle: 'Modelo',
    presetsHint: 'Escolha um ponto de partida e edite à vontade.',
    custom: 'Personalizado',
    globalSection: 'Configuração global',
    nameLabel: 'Nome do workflow',
    nameHint: 'CI',
    triggersSection: 'Triggers (on)',
    pushBranchesLabel: 'push → branches',
    pushBranchesHint: 'main\nmaster',
    pushTagsLabel: 'push → tags',
    pushTagsHint: 'v*',
    pullRequestBranchesLabel: 'pull_request → branches',
    pullRequestBranchesHint: 'main\nmaster',
    workflowDispatchLabel: 'workflow_dispatch → inputs',
    workflowDispatchHint: 'environment=string|Ambiente (dev/prod)|dev\ndeploy=boolean|Fazer deploy|false',
    scheduleCronLabel: 'schedule → cron (um por linha)',
    scheduleCronHint: '0 4 * * 1\n0 0 1 * *',
    releaseTypesLabel: 'release → types',
    releaseTypesHint: 'published\ncreated',
    permissionsLabel: 'Permissões globais',
    concurrencyGroupLabel: 'Concurrency group',
    concurrencyGroupHint: '${ CI workflow }-${{ github.ref }}',
    concurrencyCancelLabel: 'Cancelar execuções em andamento',
    envLabel: 'Variáveis de ambiente globais',
    envHint: 'CI=true\nNODE_ENV=test',
    jobsSection: 'Jobs',
    addJob: 'Adicionar job',
    noJobsMessage: 'Adicione pelo menos um job para gerar o workflow.',
    unnamedJob: '(job sem nome)',
    remove: 'Remover',
    jobNameLabel: 'Nome do job',
    jobNameHint: 'test',
    jobRunsOnLabel: 'runs-on',
    jobNeedsLabel: 'needs (um por linha)',
    jobNeedsHint: 'build',
    jobIfLabel: 'if',
    jobIfHint: "github.event_name == 'push'",
    jobEnvLabel: 'env do job',
    jobEnvHint: 'NODE_ENV=test',
    jobMatrixLabel: 'strategy.matrix',
    jobMatrixHint: 'node-version: 18, 20, 22\nos: ubuntu-latest, windows-latest',
    jobTimeoutLabel: 'timeout-minutes',
    jobTimeoutHint: '30',
    jobOutputsLabel: 'outputs',
    jobOutputsHint: 'version=v1.0.0\nstatus=ok',
    stepsSection: 'Steps',
    addStep: 'Adicionar step',
    stepNameLabel: 'name',
    stepNameHint: 'Checkout',
    stepUsesLabel: 'uses',
    stepUsesHint: 'actions/checkout@v4',
    stepRunLabel: 'run',
    stepRunHint: 'npm ci\nnpm test',
    stepWithLabel: 'with',
    stepWithHint: 'node-version: 20\ncache: npm',
    stepEnvLabel: 'env',
    stepEnvHint: 'NODE_ENV: test',
    stepIfLabel: 'if',
    stepIfHint: "github.event_name == 'pull_request'",
    stepWorkingDirectoryLabel: 'working-directory',
    stepWorkingDirectoryHint: './app',
    outTitle: 'Workflow gerado',
    copy: 'Copiar',
    copied: 'Copiado!',
    copyErr: 'Não foi possível copiar',
    download: 'Baixar',
    stats: (lines, bytes) =>
      `${lines} ${lines === 1 ? 'linha' : 'linhas'} · ${bytes} ${bytes === 1 ? 'byte' : 'bytes'}`,
    warningsTitle: 'Avisos — confira antes de usar:',
    warningsNone: 'Nenhum aviso. Salve como .github/workflows/ci.yml.',
    wNameEmpty: 'O workflow está sem nome.',
    wNoTrigger: 'Nenhum trigger foi configurado (será usado push por padrão).',
    wNoJobs: 'Não há jobs definidos.',
    wJobNameEmpty: 'Um job está sem nome.',
    wJobNameInvalid: 'O nome do job "{name}" só pode conter letras, números, hífen e underscore.',
    wJobNameDuplicate: 'O nome do job "{name}" está duplicado.',
    wJobNoSteps: 'O job "{name}" não tem steps.',
    wJobNoRunOrUses: 'O job "{name}" precisa de pelo menos um step com run ou uses.',
    tipTitle: 'Dicas de uso',
    tipBody: (
      <>
        Salve o arquivo em <Text code>.github/workflows/</Text> na raiz do repositório. O GitHub
        detecta automaticamente em pushes e pull requests.
        <pre style={{ margin: '8px 0', fontSize: 12, lineHeight: 1.6 }}>
          {'# validação local (com actionlint)\nactionlint .github/workflows/ci.yml\n\n# dry-run de uma trigger manual\ngh workflow run ci.yml'}
        </pre>
      </>
    ),
    howTitle: 'Como funciona — algoritmo-fonte',
    howDesc:
      'O builder monta o YAML manualmente: nome, triggers (push, PR, dispatch, schedule, release), permissões, concurrency, env global e cada job com runs-on, needs, if, matrix, timeout, outputs e steps. A validação verifica nome, triggers, nomes de jobs e steps.',
  },
  en: {
    title: 'GitHub Actions Workflow Generator',
    intro: (
      <>
        Build GitHub Actions workflows (<Text code>.github/workflows/*.yml</Text>) with
        triggers, jobs, steps, variables, permissions, matrix and concurrency. All in the
        browser — no configuration leaves the machine.
      </>
    ),
    presetsTitle: 'Template',
    presetsHint: 'Pick a starting point and edit freely.',
    custom: 'Custom',
    globalSection: 'Global configuration',
    nameLabel: 'Workflow name',
    nameHint: 'CI',
    triggersSection: 'Triggers (on)',
    pushBranchesLabel: 'push → branches',
    pushBranchesHint: 'main\nmaster',
    pushTagsLabel: 'push → tags',
    pushTagsHint: 'v*',
    pullRequestBranchesLabel: 'pull_request → branches',
    pullRequestBranchesHint: 'main\nmaster',
    workflowDispatchLabel: 'workflow_dispatch → inputs',
    workflowDispatchHint: 'environment=string|Environment (dev/prod)|dev\ndeploy=boolean|Deploy|false',
    scheduleCronLabel: 'schedule → cron (one per line)',
    scheduleCronHint: '0 4 * * 1\n0 0 1 * *',
    releaseTypesLabel: 'release → types',
    releaseTypesHint: 'published\ncreated',
    permissionsLabel: 'Global permissions',
    concurrencyGroupLabel: 'Concurrency group',
    concurrencyGroupHint: '${ CI workflow }-${{ github.ref }}',
    concurrencyCancelLabel: 'Cancel in-progress runs',
    envLabel: 'Global environment variables',
    envHint: 'CI=true\nNODE_ENV=test',
    jobsSection: 'Jobs',
    addJob: 'Add job',
    noJobsMessage: 'Add at least one job to generate the workflow.',
    unnamedJob: '(unnamed job)',
    remove: 'Remove',
    jobNameLabel: 'Job name',
    jobNameHint: 'test',
    jobRunsOnLabel: 'runs-on',
    jobNeedsLabel: 'needs (one per line)',
    jobNeedsHint: 'build',
    jobIfLabel: 'if',
    jobIfHint: "github.event_name == 'push'",
    jobEnvLabel: 'job env',
    jobEnvHint: 'NODE_ENV=test',
    jobMatrixLabel: 'strategy.matrix',
    jobMatrixHint: 'node-version: 18, 20, 22\nos: ubuntu-latest, windows-latest',
    jobTimeoutLabel: 'timeout-minutes',
    jobTimeoutHint: '30',
    jobOutputsLabel: 'outputs',
    jobOutputsHint: 'version=v1.0.0\nstatus=ok',
    stepsSection: 'Steps',
    addStep: 'Add step',
    stepNameLabel: 'name',
    stepNameHint: 'Checkout',
    stepUsesLabel: 'uses',
    stepUsesHint: 'actions/checkout@v4',
    stepRunLabel: 'run',
    stepRunHint: 'npm ci\nnpm test',
    stepWithLabel: 'with',
    stepWithHint: 'node-version: 20\ncache: npm',
    stepEnvLabel: 'env',
    stepEnvHint: 'NODE_ENV: test',
    stepIfLabel: 'if',
    stepIfHint: "github.event_name == 'pull_request'",
    stepWorkingDirectoryLabel: 'working-directory',
    stepWorkingDirectoryHint: './app',
    outTitle: 'Generated workflow',
    copy: 'Copy',
    copied: 'Copied!',
    copyErr: 'Could not copy',
    download: 'Download',
    stats: (lines, bytes) =>
      `${lines} ${lines === 1 ? 'line' : 'lines'} · ${bytes} ${bytes === 1 ? 'byte' : 'bytes'}`,
    warningsTitle: 'Warnings — review before using:',
    warningsNone: 'No warnings. Save as .github/workflows/ci.yml.',
    wNameEmpty: 'The workflow has no name.',
    wNoTrigger: 'No trigger configured (push will be used by default).',
    wNoJobs: 'No jobs defined.',
    wJobNameEmpty: 'A job has no name.',
    wJobNameInvalid: 'Job name "{name}" can only contain letters, numbers, hyphen and underscore.',
    wJobNameDuplicate: 'Job name "{name}" is duplicated.',
    wJobNoSteps: 'Job "{name}" has no steps.',
    wJobNoRunOrUses: 'Job "{name}" needs at least one step with run or uses.',
    tipTitle: 'Usage tips',
    tipBody: (
      <>
        Save the file under <Text code>.github/workflows/</Text> at the repository root. GitHub
        detects it automatically on pushes and pull requests.
        <pre style={{ margin: '8px 0', fontSize: 12, lineHeight: 1.6 }}>
          {'# local validation (with actionlint)\nactionlint .github/workflows/ci.yml\n\n# manual trigger dry-run\ngh workflow run ci.yml'}
        </pre>
      </>
    ),
    howTitle: 'How it works — source algorithm',
    howDesc:
      'The builder assembles YAML manually: name, triggers (push, PR, dispatch, schedule, release), permissions, concurrency, global env, and each job with runs-on, needs, if, matrix, timeout, outputs and steps. Validation checks name, triggers, job names and steps.',
  },
}

const WARNING_MESSAGES = {
  pt: {
    wNameEmpty: 'O workflow está sem nome.',
    wNoTrigger: 'Nenhum trigger foi configurado (será usado push por padrão).',
    wNoJobs: 'Não há jobs definidos.',
    wJobNameEmpty: 'Um job está sem nome.',
    wJobNameInvalid: (data) => `O nome do job "${data.name}" só pode conter letras, números, hífen e underscore.`,
    wJobNameDuplicate: (data) => `O nome do job "${data.name}" está duplicado.`,
    wJobNoSteps: (data) => `O job "${data.name}" não tem steps.`,
    wJobNoRunOrUses: (data) => `O job "${data.name}" precisa de pelo menos um step com run ou uses.`,
  },
  en: {
    wNameEmpty: 'The workflow has no name.',
    wNoTrigger: 'No trigger configured (push will be used by default).',
    wNoJobs: 'No jobs defined.',
    wJobNameEmpty: 'A job has no name.',
    wJobNameInvalid: (data) => `Job name "${data.name}" can only contain letters, numbers, hyphen and underscore.`,
    wJobNameDuplicate: (data) => `Job name "${data.name}" is duplicated.`,
    wJobNoSteps: (data) => `Job "${data.name}" has no steps.`,
    wJobNoRunOrUses: (data) => `Job "${data.name}" needs at least one step with run or uses.`,
  },
}

function formatWarning(w, lang) {
  const fn = WARNING_MESSAGES[lang][w.key]
  return typeof fn === 'function' ? fn(w.data) : fn
}

function downloadFile(content, filename) {
  const blob = new Blob([content], { type: 'text/yaml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export default function GithubActionsWorkflowGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [presetKey, setPresetKey] = useState('node')
  const [config, setConfig] = useState(() => clone(PRESETS.node))
  const [copied, setCopied] = useState(false)

  const workflow = useMemo(() => buildWorkflow(config), [config])
  const warnings = useMemo(() => validateWorkflow(config), [config])

  const applyPreset = (key) => {
    setPresetKey(key)
    setConfig(clone(key === 'custom' ? DEFAULTS : PRESETS[key]))
  }

  const updateField = (field, value) => {
    setConfig((prev) => ({ ...prev, [field]: value }))
  }

  const updateJob = (jobId, field, value) => {
    setConfig((prev) => ({
      ...prev,
      jobs: prev.jobs.map((job) => (job.id === jobId ? { ...job, [field]: value } : job)),
    }))
  }

  const updateStep = (jobId, stepId, field, value) => {
    setConfig((prev) => ({
      ...prev,
      jobs: prev.jobs.map((job) =>
        job.id === jobId
          ? {
              ...job,
              steps: job.steps.map((step) =>
                step.id === stepId ? { ...step, [field]: value } : step
              ),
            }
          : job
      ),
    }))
  }

  const addJob = () => {
    setConfig((prev) => ({
      ...prev,
      jobs: [...prev.jobs, createJob()],
    }))
  }

  const removeJob = (jobId) => {
    setConfig((prev) => ({
      ...prev,
      jobs: prev.jobs.filter((job) => job.id !== jobId),
    }))
  }

  const addStep = (jobId) => {
    setConfig((prev) => ({
      ...prev,
      jobs: prev.jobs.map((job) =>
        job.id === jobId ? { ...job, steps: [...job.steps, createStep()] } : job
      ),
    }))
  }

  const removeStep = (jobId, stepId) => {
    setConfig((prev) => ({
      ...prev,
      jobs: prev.jobs.map((job) =>
        job.id === jobId
          ? { ...job, steps: job.steps.filter((step) => step.id !== stepId) }
          : job
      ),
    }))
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(workflow)
      setCopied(true)
      message.success(t.copied)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      message.error(t.copyErr)
    }
  }

  const handleDownload = () => {
    const filename = (config.name || 'ci').toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.yml'
    downloadFile(workflow, filename)
  }

  const presetKeys = useMemo(() => ['node', 'python', 'go', 'docker', 'pages', 'custom'], [])
  const presetOptions = useMemo(
    () =>
      presetKeys.map((key) => ({
        label: key === 'custom' ? t.custom : PRESETS[key]?.label?.[lang] || key,
        value: key,
      })),
    [presetKeys, t.custom, lang]
  )

  const lines = workflow.split('\n').length
  const bytes = new Blob([workflow]).size

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}>
        <GithubOutlined /> {t.title}
      </Title>
      <Paragraph>{t.intro}</Paragraph>

      <Card title={t.presetsTitle}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Segmented value={presetKey} onChange={applyPreset} options={presetOptions} block />
          <Text type="secondary">{t.presetsHint}</Text>
        </Space>
      </Card>

      <Card title={t.globalSection}>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>{t.nameLabel}</Text>
              <Input
                value={config.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder={t.nameHint}
              />
            </Space>
          </Col>
          <Col xs={24} md={12}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>{t.permissionsLabel}</Text>
              <Select
                value={config.permissions}
                onChange={(value) => updateField('permissions', value)}
                options={PERMISSION_OPTIONS.map((opt) => ({
                  value: opt.value,
                  label: typeof opt.label === 'string' ? opt.label : opt.label[lang],
                }))}
                style={{ width: '100%' }}
                allowClear
                placeholder={t.permissionsLabel}
              />
            </Space>
          </Col>
        </Row>

        <Title level={5} style={{ marginTop: 24 }}>
          {t.triggersSection}
        </Title>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>{t.pushBranchesLabel}</Text>
              <TextArea
                value={config.pushBranches}
                onChange={(e) => updateField('pushBranches', e.target.value)}
                placeholder={t.pushBranchesHint}
                rows={2}
              />
            </Space>
          </Col>
          <Col xs={24} md={12}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>{t.pushTagsLabel}</Text>
              <TextArea
                value={config.pushTags}
                onChange={(e) => updateField('pushTags', e.target.value)}
                placeholder={t.pushTagsHint}
                rows={2}
              />
            </Space>
          </Col>
          <Col xs={24} md={12}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>{t.pullRequestBranchesLabel}</Text>
              <TextArea
                value={config.pullRequestBranches}
                onChange={(e) => updateField('pullRequestBranches', e.target.value)}
                placeholder={t.pullRequestBranchesHint}
                rows={2}
              />
            </Space>
          </Col>
          <Col xs={24} md={12}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>{t.workflowDispatchLabel}</Text>
              <TextArea
                value={config.workflowDispatchInputs}
                onChange={(e) => updateField('workflowDispatchInputs', e.target.value)}
                placeholder={t.workflowDispatchHint}
                rows={2}
              />
            </Space>
          </Col>
          <Col xs={24} md={12}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>{t.scheduleCronLabel}</Text>
              <TextArea
                value={config.scheduleCron}
                onChange={(e) => updateField('scheduleCron', e.target.value)}
                placeholder={t.scheduleCronHint}
                rows={2}
              />
            </Space>
          </Col>
          <Col xs={24} md={12}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>{t.releaseTypesLabel}</Text>
              <TextArea
                value={config.releaseTypes}
                onChange={(e) => updateField('releaseTypes', e.target.value)}
                placeholder={t.releaseTypesHint}
                rows={2}
              />
            </Space>
          </Col>
        </Row>

        <Title level={5} style={{ marginTop: 24 }}>
          Concurrency &amp; Env
        </Title>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>{t.concurrencyGroupLabel}</Text>
              <Input
                value={config.concurrencyGroup}
                onChange={(e) => updateField('concurrencyGroup', e.target.value)}
                placeholder={t.concurrencyGroupHint}
              />
              <Switch
                checked={config.concurrencyCancelInProgress}
                onChange={(checked) => updateField('concurrencyCancelInProgress', checked)}
                checkedChildren={t.concurrencyCancelLabel}
                unCheckedChildren={t.concurrencyCancelLabel}
              />
            </Space>
          </Col>
          <Col xs={24} md={12}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>{t.envLabel}</Text>
              <TextArea
                value={config.env}
                onChange={(e) => updateField('env', e.target.value)}
                placeholder={t.envHint}
                rows={3}
              />
            </Space>
          </Col>
        </Row>
      </Card>

      <Card
        title={
          <Space>
            {t.jobsSection}
            <Button type="primary" icon={<PlusOutlined />} onClick={addJob}>
              {t.addJob}
            </Button>
          </Space>
        }
      >
        {config.jobs.length === 0 ? (
          <Alert type="info" message={t.noJobsMessage} />
        ) : (
          <Collapse defaultActiveKey={config.jobs[0]?.id}>
            {config.jobs.map((job) => (
              <Panel
                key={job.id}
                header={job.name || t.unnamedJob}
                extra={
                  <Button
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={(e) => {
                      e.stopPropagation()
                      removeJob(job.id)
                    }}
                  >
                    {t.remove}
                  </Button>
                }
              >
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Row gutter={[16, 16]}>
                    <Col xs={24} md={12}>
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <Text strong>{t.jobNameLabel}</Text>
                        <Input
                          value={job.name}
                          onChange={(e) => updateJob(job.id, 'name', e.target.value)}
                          placeholder={t.jobNameHint}
                        />
                      </Space>
                    </Col>
                    <Col xs={24} md={12}>
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <Text strong>{t.jobRunsOnLabel}</Text>
                        <Select
                          value={job.runsOn}
                          onChange={(value) => updateJob(job.id, 'runsOn', value)}
                          options={RUNNER_OPTIONS}
                          style={{ width: '100%' }}
                          showSearch
                        />
                      </Space>
                    </Col>
                    <Col xs={24} md={12}>
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <Text strong>{t.jobNeedsLabel}</Text>
                        <TextArea
                          value={job.needs}
                          onChange={(e) => updateJob(job.id, 'needs', e.target.value)}
                          placeholder={t.jobNeedsHint}
                          rows={2}
                        />
                      </Space>
                    </Col>
                    <Col xs={24} md={12}>
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <Text strong>{t.jobIfLabel}</Text>
                        <Input
                          value={job.if}
                          onChange={(e) => updateJob(job.id, 'if', e.target.value)}
                          placeholder={t.jobIfHint}
                        />
                      </Space>
                    </Col>
                    <Col xs={24} md={12}>
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <Text strong>{t.jobEnvLabel}</Text>
                        <TextArea
                          value={job.env}
                          onChange={(e) => updateJob(job.id, 'env', e.target.value)}
                          placeholder={t.jobEnvHint}
                          rows={2}
                        />
                      </Space>
                    </Col>
                    <Col xs={24} md={12}>
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <Text strong>{t.jobMatrixLabel}</Text>
                        <TextArea
                          value={job.strategyMatrix}
                          onChange={(e) => updateJob(job.id, 'strategyMatrix', e.target.value)}
                          placeholder={t.jobMatrixHint}
                          rows={2}
                        />
                      </Space>
                    </Col>
                    <Col xs={24} md={12}>
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <Text strong>{t.jobTimeoutLabel}</Text>
                        <Input
                          type="number"
                          value={job.timeoutMinutes}
                          onChange={(e) => updateJob(job.id, 'timeoutMinutes', e.target.value)}
                          placeholder={t.jobTimeoutHint}
                        />
                      </Space>
                    </Col>
                    <Col xs={24} md={12}>
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <Text strong>{t.jobOutputsLabel}</Text>
                        <TextArea
                          value={job.outputs}
                          onChange={(e) => updateJob(job.id, 'outputs', e.target.value)}
                          placeholder={t.jobOutputsHint}
                          rows={2}
                        />
                      </Space>
                    </Col>
                  </Row>

                  <Title level={5} style={{ marginTop: 16 }}>
                    {t.stepsSection}
                  </Title>
                  <Button type="dashed" icon={<PlusOutlined />} onClick={() => addStep(job.id)} block>
                    {t.addStep}
                  </Button>

                  {job.steps.map((step, idx) => (
                    <Card
                      key={step.id}
                      size="small"
                      title={`${t.stepsSection} ${idx + 1}`}
                      extra={
                        <Button
                          danger
                          size="small"
                          icon={<DeleteOutlined />}
                          onClick={() => removeStep(job.id, step.id)}
                        >
                          {t.remove}
                        </Button>
                      }
                    >
                      <Row gutter={[16, 16]}>
                        <Col xs={24} md={12}>
                          <Space direction="vertical" style={{ width: '100%' }}>
                            <Text strong>{t.stepNameLabel}</Text>
                            <Input
                              value={step.name}
                              onChange={(e) => updateStep(job.id, step.id, 'name', e.target.value)}
                              placeholder={t.stepNameHint}
                            />
                          </Space>
                        </Col>
                        <Col xs={24} md={12}>
                          <Space direction="vertical" style={{ width: '100%' }}>
                            <Text strong>{t.stepUsesLabel}</Text>
                            <Input
                              value={step.uses}
                              onChange={(e) => updateStep(job.id, step.id, 'uses', e.target.value)}
                              placeholder={t.stepUsesHint}
                            />
                          </Space>
                        </Col>
                        <Col xs={24}>
                          <Space direction="vertical" style={{ width: '100%' }}>
                            <Text strong>{t.stepRunLabel}</Text>
                            <TextArea
                              value={step.run}
                              onChange={(e) => updateStep(job.id, step.id, 'run', e.target.value)}
                              placeholder={t.stepRunHint}
                              rows={3}
                            />
                          </Space>
                        </Col>
                        <Col xs={24} md={12}>
                          <Space direction="vertical" style={{ width: '100%' }}>
                            <Text strong>{t.stepWithLabel}</Text>
                            <TextArea
                              value={step.with}
                              onChange={(e) => updateStep(job.id, step.id, 'with', e.target.value)}
                              placeholder={t.stepWithHint}
                              rows={2}
                            />
                          </Space>
                        </Col>
                        <Col xs={24} md={12}>
                          <Space direction="vertical" style={{ width: '100%' }}>
                            <Text strong>{t.stepEnvLabel}</Text>
                            <TextArea
                              value={step.env}
                              onChange={(e) => updateStep(job.id, step.id, 'env', e.target.value)}
                              placeholder={t.stepEnvHint}
                              rows={2}
                            />
                          </Space>
                        </Col>
                        <Col xs={24} md={12}>
                          <Space direction="vertical" style={{ width: '100%' }}>
                            <Text strong>{t.stepIfLabel}</Text>
                            <Input
                              value={step.if}
                              onChange={(e) => updateStep(job.id, step.id, 'if', e.target.value)}
                              placeholder={t.stepIfHint}
                            />
                          </Space>
                        </Col>
                        <Col xs={24} md={12}>
                          <Space direction="vertical" style={{ width: '100%' }}>
                            <Text strong>{t.stepWorkingDirectoryLabel}</Text>
                            <Input
                              value={step.workingDirectory}
                              onChange={(e) =>
                                updateStep(job.id, step.id, 'workingDirectory', e.target.value)
                              }
                              placeholder={t.stepWorkingDirectoryHint}
                            />
                          </Space>
                        </Col>
                      </Row>
                    </Card>
                  ))}
                </Space>
              </Panel>
            ))}
          </Collapse>
        )}
      </Card>

      <Card title={t.outTitle}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <TextArea value={workflow} readOnly rows={18} style={{ fontFamily: 'monospace' }} />
          <Space wrap>
            <Button icon={copied ? <CheckOutlined /> : <CopyOutlined />} onClick={handleCopy}>
              {t.copy}
            </Button>
            <Button icon={<DownloadOutlined />} onClick={handleDownload}>
              {t.download}
            </Button>
            <Text type="secondary">{t.stats(lines, bytes)}</Text>
          </Space>

          {warnings.length > 0 ? (
            <Alert
              type="warning"
              message={t.warningsTitle}
              description={
                <ul style={{ margin: 0, paddingLeft: 16 }}>
                  {warnings.map((w, i) => (
                    <li key={i}>{formatWarning(w, lang)}</li>
                  ))}
                </ul>
              }
            />
          ) : (
            <Alert type="success" message={t.warningsNone} />
          )}
        </Space>
      </Card>

      <Card title={t.tipTitle}>{t.tipBody}</Card>

      <Collapse>
        <Panel header={t.howTitle} key="how">
          <Paragraph>{t.howDesc}</Paragraph>
          <pre style={{ fontSize: 12, lineHeight: 1.6, overflow: 'auto' }}>
            <code>{buildWorkflow.toString()}</code>
          </pre>
        </Panel>
      </Collapse>
    </Space>
  )
}
