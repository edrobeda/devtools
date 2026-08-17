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
  GitlabOutlined,
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
  WHEN_OPTIONS,
  createJob,
  buildConfig,
  validateConfig,
  clone,
} from '../utils/gitlabCiConfigGenerator'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input
const { Panel } = Collapse

const translations = {
  pt: {
    title: 'Gerador de .gitlab-ci.yml',
    intro: (
      <>
        Monte pipelines do GitLab CI (<Text code>.gitlab-ci.yml</Text>) com stages,
        jobs, variáveis, cache, artifacts, services, needs e rules. Tudo no
        navegador — nenhuma configuração sai da máquina.
      </>
    ),
    presetsTitle: 'Modelo',
    presetsHint: 'Escolha um ponto de partida e edite à vontade.',
    custom: 'Personalizado',
    globalSection: 'Configuração global',
    imageLabel: 'Imagem padrão',
    imageHint: 'node:20-alpine',
    stagesLabel: 'Stages (uma por linha)',
    stagesHint: 'build\ntest\ndeploy',
    variablesLabel: 'Variáveis globais',
    variablesHint: 'KEY=value (uma por linha)',
    defaultTagsLabel: 'Tags padrão dos runners',
    tagsHint: 'docker\nlinux',
    beforeScriptLabel: 'before_script global',
    scriptHint: 'npm ci\nnpm test',
    afterScriptLabel: 'after_script global',
    workflowRulesLabel: 'Workflow rules',
    workflowRulesHint: '- if: \'$CI_PIPELINE_SOURCE == "push"\'',
    jobsSection: 'Jobs',
    addJob: 'Adicionar job',
    noJobsMessage: 'Adicione pelo menos um job para gerar o arquivo.',
    unnamedJob: '(job sem nome)',
    remove: 'Remover',
    jobNameLabel: 'Nome do job',
    jobNameHint: 'build',
    jobStageLabel: 'Stage',
    jobStageHint: 'build',
    jobImageLabel: 'Imagem do job',
    jobScriptLabel: 'script',
    jobBeforeScriptLabel: 'before_script',
    jobAfterScriptLabel: 'after_script',
    jobRulesLabel: 'rules',
    rulesHint: '- if: \'$CI_PIPELINE_SOURCE == "merge_request_event"\'',
    jobTagsLabel: 'tags (uma por linha)',
    jobWhenLabel: 'when',
    jobTimeoutLabel: 'timeout',
    timeoutHint: '1h',
    artifactsPathsLabel: 'artifacts paths',
    artifactsPathsHint: 'dist\nbuild',
    artifactsExpireLabel: 'artifacts expire_in',
    artifactsExpireHint: '1 week',
    cacheKeyLabel: 'cache key',
    cacheKeyHint: '${CI_COMMIT_REF_SLUG}',
    cachePathsLabel: 'cache paths',
    cachePathsHint: 'node_modules\n.npm',
    servicesLabel: 'services (um por linha)',
    servicesHint: 'docker:24-dind',
    needsLabel: 'needs (um por linha)',
    needsHint: 'build',
    dependenciesLabel: 'dependencies (uma por linha)',
    dependenciesHint: 'build',
    allowFailureLabel: 'allow_failure',
    outTitle: 'Arquivo gerado',
    copy: 'Copiar',
    copied: 'Copiado!',
    copyErr: 'Não foi possível copiar',
    download: 'Baixar',
    stats: (lines, bytes) =>
      `${lines} ${lines === 1 ? 'linha' : 'linhas'} · ${bytes} ${bytes === 1 ? 'byte' : 'bytes'}`,
    warningsTitle: 'Avisos — confira antes de usar:',
    warningsNone: 'Nenhum aviso. Salve como .gitlab-ci.yml na raiz do repositório.',
    wNoJobs: 'Não há jobs definidos.',
    wJobNameEmpty: 'Um job está sem nome.',
    wJobNameInvalid: 'O nome do job "{name}" só pode conter letras, números, hífen e underscore.',
    wJobNameDuplicate: 'O nome do job "{name}" está duplicado.',
    wStageMissing: 'O job "{name}" usa o stage "{stage}", que não está na lista de stages.',
    wJobNoScript: 'O job "{name}" não tem script.',
    tipTitle: 'Dicas de uso',
    tipBody: (
      <>
        Salve o arquivo como <Text code>.gitlab-ci.yml</Text> na raiz do repositório. O GitLab
        o detecta automaticamente em pushes e merge requests.
        <pre style={{ margin: '8px 0', fontSize: 12, lineHeight: 1.6 }}>
          {'# validação local (com gitlab-runner instalado)\ngitlab-runner exec docker test\n\n# ver logs de uma pipeline\ngitlab-ci-lint .gitlab-ci.yml'}
        </pre>
      </>
    ),
    howTitle: 'Como funciona — algoritmo-fonte',
    howDesc:
      'O builder monta o YAML manualmente: imagem, stages, variáveis, scripts globais, workflow rules e, depois, cada job com seus campos opcionais preenchidos. A validação verifica nomes, stages e scripts.',
  },
  en: {
    title: '.gitlab-ci.yml Generator',
    intro: (
      <>
        Build GitLab CI pipelines (<Text code>.gitlab-ci.yml</Text>) with stages, jobs,
        variables, cache, artifacts, services, needs and rules. All in the browser —
        no configuration leaves the machine.
      </>
    ),
    presetsTitle: 'Template',
    presetsHint: 'Pick a starting point and edit freely.',
    custom: 'Custom',
    globalSection: 'Global configuration',
    imageLabel: 'Default image',
    imageHint: 'node:20-alpine',
    stagesLabel: 'Stages (one per line)',
    stagesHint: 'build\ntest\ndeploy',
    variablesLabel: 'Global variables',
    variablesHint: 'KEY=value (one per line)',
    defaultTagsLabel: 'Default runner tags',
    tagsHint: 'docker\nlinux',
    beforeScriptLabel: 'Global before_script',
    scriptHint: 'npm ci\nnpm test',
    afterScriptLabel: 'Global after_script',
    workflowRulesLabel: 'Workflow rules',
    workflowRulesHint: '- if: \'$CI_PIPELINE_SOURCE == "push"\'',
    jobsSection: 'Jobs',
    addJob: 'Add job',
    noJobsMessage: 'Add at least one job to generate the file.',
    unnamedJob: '(unnamed job)',
    remove: 'Remove',
    jobNameLabel: 'Job name',
    jobNameHint: 'build',
    jobStageLabel: 'Stage',
    jobStageHint: 'build',
    jobImageLabel: 'Job image',
    jobScriptLabel: 'script',
    jobBeforeScriptLabel: 'before_script',
    jobAfterScriptLabel: 'after_script',
    jobRulesLabel: 'rules',
    rulesHint: '- if: \'$CI_PIPELINE_SOURCE == "merge_request_event"\'',
    jobTagsLabel: 'tags (one per line)',
    jobWhenLabel: 'when',
    jobTimeoutLabel: 'timeout',
    timeoutHint: '1h',
    artifactsPathsLabel: 'artifacts paths',
    artifactsPathsHint: 'dist\nbuild',
    artifactsExpireLabel: 'artifacts expire_in',
    artifactsExpireHint: '1 week',
    cacheKeyLabel: 'cache key',
    cacheKeyHint: '${CI_COMMIT_REF_SLUG}',
    cachePathsLabel: 'cache paths',
    cachePathsHint: 'node_modules\n.npm',
    servicesLabel: 'services (one per line)',
    servicesHint: 'docker:24-dind',
    needsLabel: 'needs (one per line)',
    needsHint: 'build',
    dependenciesLabel: 'dependencies (one per line)',
    dependenciesHint: 'build',
    allowFailureLabel: 'allow_failure',
    outTitle: 'Generated file',
    copy: 'Copy',
    copied: 'Copied!',
    copyErr: 'Could not copy',
    download: 'Download',
    stats: (lines, bytes) =>
      `${lines} ${lines === 1 ? 'line' : 'lines'} · ${bytes} ${bytes === 1 ? 'byte' : 'bytes'}`,
    warningsTitle: 'Warnings — review before using:',
    warningsNone: 'No warnings. Save as .gitlab-ci.yml at the repository root.',
    wNoJobs: 'No jobs defined.',
    wJobNameEmpty: 'A job has no name.',
    wJobNameInvalid: 'Job name "{name}" may only contain letters, numbers, hyphens and underscores.',
    wJobNameDuplicate: 'Job name "{name}" is duplicated.',
    wStageMissing: 'Job "{name}" uses stage "{stage}", which is not in the stages list.',
    wJobNoScript: 'Job "{name}" has no script.',
    tipTitle: 'Usage tips',
    tipBody: (
      <>
        Save the file as <Text code>.gitlab-ci.yml</Text> at the repository root. GitLab
        detects it automatically on pushes and merge requests.
        <pre style={{ margin: '8px 0', fontSize: 12, lineHeight: 1.6 }}>
          {'# local validation (requires gitlab-runner)\ngitlab-runner exec docker test\n\n# lint a pipeline\ngitlab-ci-lint .gitlab-ci.yml'}
        </pre>
      </>
    ),
    howTitle: 'How it works — source code',
    howDesc:
      'The builder assembles the YAML manually: image, stages, variables, global scripts, workflow rules, and then each job with only its filled optional fields. Validation checks names, stages, and scripts.',
  },
}

export default function GitlabCiConfigGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [options, setOptions] = useState(() => clone(DEFAULTS))
  const [selectedPreset, setSelectedPreset] = useState('node')
  const [copied, setCopied] = useState(false)
  const [activeJobKeys, setActiveJobKeys] = useState(() =>
    options.jobs.map((j) => j.id)
  )

  const setGlobal = (key, value) => {
    setOptions((prev) => ({ ...prev, [key]: value }))
    setSelectedPreset('custom')
  }

  const setJob = (id, patch) => {
    setOptions((prev) => ({
      ...prev,
      jobs: prev.jobs.map((j) => (j.id === id ? { ...j, ...patch } : j)),
    }))
    setSelectedPreset('custom')
  }

  const addJob = () => {
    const job = createJob()
    setOptions((prev) => ({ ...prev, jobs: [...prev.jobs, job] }))
    setActiveJobKeys((prev) => [...prev, job.id])
    setSelectedPreset('custom')
  }

  const removeJob = (id) => {
    setOptions((prev) => ({ ...prev, jobs: prev.jobs.filter((j) => j.id !== id) }))
    setActiveJobKeys((prev) => prev.filter((k) => k !== id))
    setSelectedPreset('custom')
  }

  const applyPreset = (key) => {
    if (key === 'custom') return
    const preset = clone(PRESETS[key])
    setSelectedPreset(key)
    setOptions(preset)
    setActiveJobKeys(preset.jobs.map((j) => j.id))
  }

  const presetOptions = useMemo(
    () => [
      ...Object.keys(PRESETS).map((k) => ({
        label: PRESETS[k].label[lang],
        value: k,
      })),
      { label: t.custom, value: 'custom' },
    ],
    [lang, t.custom]
  )

  const whenOptions = useMemo(
    () => WHEN_OPTIONS.map((o) => ({ label: o.label[lang], value: o.value })),
    [lang]
  )

  const output = useMemo(() => {
    const { text, fileName } = buildConfig(options)
    const warnings = validateConfig(options, t)
    const lines = text ? text.split('\n').length : 0
    const bytes = new TextEncoder().encode(text).length
    return { text, fileName, warnings, lines, bytes }
  }, [options, t])

  const copy = () => {
    navigator.clipboard.writeText(output.text).then(
      () => {
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      },
      () => message.error(t.copyErr)
    )
  }

  const download = () => {
    const blob = new Blob([output.text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = output.fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}>
        <GitlabOutlined /> {t.title}
      </Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card title={t.presetsTitle}>
        <Paragraph type="secondary">{t.presetsHint}</Paragraph>
        <Segmented
          options={presetOptions}
          value={selectedPreset}
          onChange={applyPreset}
        />
      </Card>

      <Card title={t.globalSection}>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>{t.imageLabel}</Text>
              <Input
                value={options.image}
                onChange={(e) => setGlobal('image', e.target.value)}
                placeholder={t.imageHint}
              />
            </Space>
          </Col>
          <Col xs={24} md={12}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>{t.stagesLabel}</Text>
              <TextArea
                rows={2}
                value={Array.isArray(options.stages) ? options.stages.join('\n') : options.stages}
                onChange={(e) =>
                  setGlobal(
                    'stages',
                    e.target.value.split('\n').map((s) => s.trim())
                  )
                }
                placeholder={t.stagesHint}
              />
            </Space>
          </Col>
          <Col xs={24} md={12}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>{t.variablesLabel}</Text>
              <TextArea
                rows={3}
                value={options.variables}
                onChange={(e) => setGlobal('variables', e.target.value)}
                placeholder={t.variablesHint}
              />
            </Space>
          </Col>
          <Col xs={24} md={12}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>{t.defaultTagsLabel}</Text>
              <TextArea
                rows={2}
                value={options.defaultTags}
                onChange={(e) => setGlobal('defaultTags', e.target.value)}
                placeholder={t.tagsHint}
              />
            </Space>
          </Col>
          <Col xs={24} md={12}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>{t.beforeScriptLabel}</Text>
              <TextArea
                rows={3}
                value={options.beforeScript}
                onChange={(e) => setGlobal('beforeScript', e.target.value)}
                placeholder={t.scriptHint}
              />
            </Space>
          </Col>
          <Col xs={24} md={12}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>{t.afterScriptLabel}</Text>
              <TextArea
                rows={3}
                value={options.afterScript}
                onChange={(e) => setGlobal('afterScript', e.target.value)}
                placeholder={t.scriptHint}
              />
            </Space>
          </Col>
          <Col xs={24}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>{t.workflowRulesLabel}</Text>
              <TextArea
                rows={3}
                value={options.workflowRules}
                onChange={(e) => setGlobal('workflowRules', e.target.value)}
                placeholder={t.workflowRulesHint}
              />
            </Space>
          </Col>
        </Row>
      </Card>

      <Card
        title={t.jobsSection}
        extra={
          <Button icon={<PlusOutlined />} onClick={addJob}>
            {t.addJob}
          </Button>
        }
      >
        {options.jobs.length === 0 && (
          <Alert
            type="info"
            showIcon
            message={t.noJobsMessage}
            style={{ marginBottom: 16 }}
          />
        )}
        <Collapse activeKey={activeJobKeys} onChange={setActiveJobKeys}>
          {options.jobs.map((job) => (
            <Panel
              header={job.name || t.unnamedJob}
              key={job.id}
              extra={
                <Button
                  size="small"
                  danger
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
              <Row gutter={[16, 16]}>
                <Col xs={24} md={8}>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Text strong>{t.jobNameLabel}</Text>
                    <Input
                      value={job.name}
                      onChange={(e) =>
                        setJob(job.id, { name: e.target.value })
                      }
                      placeholder={t.jobNameHint}
                    />
                  </Space>
                </Col>
                <Col xs={24} md={8}>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Text strong>{t.jobStageLabel}</Text>
                    <Input
                      value={job.stage}
                      onChange={(e) =>
                        setJob(job.id, { stage: e.target.value })
                      }
                      placeholder={t.jobStageHint}
                    />
                  </Space>
                </Col>
                <Col xs={24} md={8}>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Text strong>{t.jobImageLabel}</Text>
                    <Input
                      value={job.image}
                      onChange={(e) =>
                        setJob(job.id, { image: e.target.value })
                      }
                      placeholder={t.imageHint}
                    />
                  </Space>
                </Col>
                <Col xs={24} md={12}>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Text strong>{t.jobScriptLabel}</Text>
                    <TextArea
                      rows={4}
                      value={job.script}
                      onChange={(e) =>
                        setJob(job.id, { script: e.target.value })
                      }
                      placeholder={t.scriptHint}
                    />
                  </Space>
                </Col>
                <Col xs={24} md={12}>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Text strong>{t.jobBeforeScriptLabel}</Text>
                    <TextArea
                      rows={4}
                      value={job.beforeScript}
                      onChange={(e) =>
                        setJob(job.id, { beforeScript: e.target.value })
                      }
                      placeholder={t.scriptHint}
                    />
                  </Space>
                </Col>
                <Col xs={24} md={12}>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Text strong>{t.jobAfterScriptLabel}</Text>
                    <TextArea
                      rows={3}
                      value={job.afterScript}
                      onChange={(e) =>
                        setJob(job.id, { afterScript: e.target.value })
                      }
                      placeholder={t.scriptHint}
                    />
                  </Space>
                </Col>
                <Col xs={24} md={12}>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Text strong>{t.jobRulesLabel}</Text>
                    <TextArea
                      rows={3}
                      value={job.rules}
                      onChange={(e) =>
                        setJob(job.id, { rules: e.target.value })
                      }
                      placeholder={t.rulesHint}
                    />
                  </Space>
                </Col>
                <Col xs={24} md={8}>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Text strong>{t.jobTagsLabel}</Text>
                    <TextArea
                      rows={2}
                      value={job.tags}
                      onChange={(e) =>
                        setJob(job.id, { tags: e.target.value })
                      }
                      placeholder={t.tagsHint}
                    />
                  </Space>
                </Col>
                <Col xs={24} md={8}>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Text strong>{t.jobWhenLabel}</Text>
                    <Select
                      value={job.when}
                      options={whenOptions}
                      onChange={(v) => setJob(job.id, { when: v })}
                      style={{ width: '100%' }}
                    />
                  </Space>
                </Col>
                <Col xs={24} md={8}>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Text strong>{t.jobTimeoutLabel}</Text>
                    <Input
                      value={job.timeout}
                      onChange={(e) =>
                        setJob(job.id, { timeout: e.target.value })
                      }
                      placeholder={t.timeoutHint}
                    />
                  </Space>
                </Col>
                <Col xs={24} md={12}>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Text strong>{t.artifactsPathsLabel}</Text>
                    <TextArea
                      rows={2}
                      value={job.artifactsPaths}
                      onChange={(e) =>
                        setJob(job.id, { artifactsPaths: e.target.value })
                      }
                      placeholder={t.artifactsPathsHint}
                    />
                  </Space>
                </Col>
                <Col xs={24} md={12}>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Text strong>{t.artifactsExpireLabel}</Text>
                    <Input
                      value={job.artifactsExpire}
                      onChange={(e) =>
                        setJob(job.id, { artifactsExpire: e.target.value })
                      }
                      placeholder={t.artifactsExpireHint}
                    />
                  </Space>
                </Col>
                <Col xs={24} md={12}>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Text strong>{t.cacheKeyLabel}</Text>
                    <Input
                      value={job.cacheKey}
                      onChange={(e) =>
                        setJob(job.id, { cacheKey: e.target.value })
                      }
                      placeholder={t.cacheKeyHint}
                    />
                  </Space>
                </Col>
                <Col xs={24} md={12}>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Text strong>{t.cachePathsLabel}</Text>
                    <TextArea
                      rows={2}
                      value={job.cachePaths}
                      onChange={(e) =>
                        setJob(job.id, { cachePaths: e.target.value })
                      }
                      placeholder={t.cachePathsHint}
                    />
                  </Space>
                </Col>
                <Col xs={24} md={12}>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Text strong>{t.servicesLabel}</Text>
                    <TextArea
                      rows={2}
                      value={job.services}
                      onChange={(e) =>
                        setJob(job.id, { services: e.target.value })
                      }
                      placeholder={t.servicesHint}
                    />
                  </Space>
                </Col>
                <Col xs={24} md={12}>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Text strong>{t.needsLabel}</Text>
                    <TextArea
                      rows={2}
                      value={job.needs}
                      onChange={(e) =>
                        setJob(job.id, { needs: e.target.value })
                      }
                      placeholder={t.needsHint}
                    />
                  </Space>
                </Col>
                <Col xs={24} md={12}>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Text strong>{t.dependenciesLabel}</Text>
                    <TextArea
                      rows={2}
                      value={job.dependencies}
                      onChange={(e) =>
                        setJob(job.id, { dependencies: e.target.value })
                      }
                      placeholder={t.dependenciesHint}
                    />
                  </Space>
                </Col>
                <Col xs={24} md={12}>
                  <Space>
                    <Switch
                      checked={job.allowFailure}
                      onChange={(v) =>
                        setJob(job.id, { allowFailure: v })
                      }
                    />
                    <Text>{t.allowFailureLabel}</Text>
                  </Space>
                </Col>
              </Row>
            </Panel>
          ))}
        </Collapse>
      </Card>

      <Card title={t.outTitle}>
        {output.warnings.length > 0 && (
          <Alert
            type="warning"
            showIcon
            message={t.warningsTitle}
            description={
              <ul style={{ margin: 0, paddingLeft: 16 }}>
                {output.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            }
            style={{ marginBottom: 16 }}
          />
        )}
        {output.warnings.length === 0 && (
          <Alert
            type="info"
            showIcon
            message={t.warningsNone}
            style={{ marginBottom: 16 }}
          />
        )}
        <TextArea
          readOnly
          value={output.text}
          rows={16}
          style={{ fontFamily: 'monospace', marginBottom: 12 }}
        />
        <Space wrap>
          <Button
            icon={copied ? <CheckOutlined /> : <CopyOutlined />}
            onClick={copy}
          >
            {copied ? t.copied : t.copy}
          </Button>
          <Button icon={<DownloadOutlined />} onClick={download}>
            {t.download}
          </Button>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {t.stats(output.lines, output.bytes)}
          </Text>
        </Space>
      </Card>

      <Card title={t.tipTitle}>
        <Paragraph style={{ marginBottom: 0 }}>{t.tipBody}</Paragraph>
      </Card>

      <Collapse>
        <Panel header={t.howTitle} key="source">
          <Paragraph>{t.howDesc}</Paragraph>
          <pre style={{ margin: 0, overflowX: 'auto' }}>
            <code>{buildConfig.toString() + '\n\n' + validateConfig.toString()}</code>
          </pre>
        </Panel>
      </Collapse>
    </Space>
  )
}
