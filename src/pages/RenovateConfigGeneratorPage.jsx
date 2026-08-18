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
  Tag,
  message,
  Divider,
} from 'antd'
import {
  FileTextOutlined,
  CopyOutlined,
  DownloadOutlined,
  CodeOutlined,
  PlusOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  buildRenovateConfig,
  PRESETS,
  EXTENDS_OPTIONS,
  PLATFORMS,
  SCHEDULE_OPTIONS,
  RANGE_STRATEGIES,
  REBASE_OPTIONS,
  AUTOMERGE_TYPES,
  PACKAGE_MANAGERS,
  UPDATE_TYPES,
} from '../utils/renovateConfigGenerator'

const { Title, Paragraph, Text } = Typography

const SOURCE = `
export function buildRenovateConfig(options) {
  const out = {}

  if (options.platform && options.platform !== 'github') {
    out.platform = options.platform
  }

  const extendsArr = cleanArray(options.extends)
  if (extendsArr.length) out.extends = extendsArr

  if (options.schedule && options.schedule !== 'at any time') {
    out.schedule = options.schedule
  }

  if (options.timezone) out.timezone = options.timezone
  if (options.labels?.length) out.labels = cleanArray(options.labels)
  if (options.assignees?.length) out.assignees = cleanArray(options.assignees)
  if (options.reviewers?.length) out.reviewers = cleanArray(options.reviewers)

  if (options.branchPrefix && options.branchPrefix !== 'renovate/') {
    out.branchPrefix = options.branchPrefix
  }

  if (options.automerge === true) out.automerge = true
  if (options.rangeStrategy && options.rangeStrategy !== 'auto') {
    out.rangeStrategy = options.rangeStrategy
  }

  if (options.lockFileMaintenance === true) {
    out.lockFileMaintenance = { enabled: true }
  }

  if (options.vulnerabilityAlerts === true) {
    out.vulnerabilityAlerts = { enabled: true }
  }

  const rules = Array.isArray(options.packageRules)
    ? options.packageRules.map(cleanPackageRule).filter(Boolean)
    : []
  if (rules.length) out.packageRules = rules

  return JSON.stringify(out, null, 2)
}
`

const translations = {
  pt: {
    title: 'Gerador de Configuração Renovate',
    intro:
      'Monta arquivos renovate.json 100% no navegador. Escolha presets, plataforma, agendamento, regras de automerge e packageRules; o JSON gerado está pronto para copiar ou baixar.',
    presets: 'Modelos de um clique',
    platform: 'Plataforma',
    extends: 'Extends (presets)',
    schedule: 'Agendamento',
    timezone: 'Fuso horário',
    dependencyDashboard: 'Habilitar Dependency Dashboard',
    automerge: 'Automerge',
    automergeType: 'Tipo de automerge',
    platformAutomerge: 'Usar platform automerge',
    rangeStrategy: 'Estratégia de range',
    rebaseWhen: 'Rebase quando',
    labels: 'Labels (vírgula ou Enter)',
    assignees: 'Assignees (vírgula ou Enter)',
    reviewers: 'Reviewers (vírgula ou Enter)',
    branchPrefix: 'Prefixo de branch',
    commitMessagePrefix: 'Prefixo de commit',
    prConcurrentLimit: 'Limite de PRs concurrentes',
    prHourlyLimit: 'Limite de PRs por hora',
    lockFileMaintenance: 'Manutenção de lockfile',
    vulnerabilityAlerts: 'Alertas de vulnerabilidade',
    packageRules: 'Package Rules',
    noPackageRules: 'Nenhuma package rule. Adicione pelo preset ou manualmente.',
    addPackageRule: 'Adicionar regra',
    matchDepTypes: 'matchDepTypes',
    matchUpdateTypes: 'matchUpdateTypes',
    matchManagers: 'matchManagers',
    matchPackageNames: 'matchPackageNames',
    matchPackagePatterns: 'matchPackagePatterns (regex)',
    groupName: 'groupName',
    enabled: 'Habilitado',
    output: 'renovate.json gerado',
    copy: 'Copiar',
    copied: 'Configuração copiada!',
    download: 'Baixar renovate.json',
    lineCount: (n) => `${n} linha${n === 1 ? '' : 's'}`,
    byteCount: (n) => `${n} bytes`,
    sourceTitle: 'Algoritmo-fonte',
    sourceBody:
      'buildRenovateConfig monta um objeto de configuração do Renovate a partir das opções escolhidas, remove campos padrão e serializa a saída como JSON formatado.',
    tipsTitle: 'Dicas do Renovate',
    tipsBody: (
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        <li>
          O preset <Text code>config:recommended</Text> é um bom ponto de partida para a maioria dos projetos.
        </li>
        <li>
          Use <Text code>:dependencyDashboard</Text> para ter um issue/tracker com todas as atualizações pendentes.
        </li>
        <li>
          <Text code>rangeStrategy: bump</Text> atualiza package.json para a versão mais recente; <Text code>pin</Text> trava versões exatas.
        </li>
        <li>
          Package rules permitem comportamentos diferentes por gerenciador de pacotes, tipo de update ou padrão de nome.
        </li>
      </ul>
    ),
  },
  en: {
    title: 'Renovate Config Generator',
    intro:
      'Builds renovate.json files 100% in the browser. Choose presets, platform, schedule, automerge rules and packageRules; the generated JSON is ready to copy or download.',
    presets: 'One-click templates',
    platform: 'Platform',
    extends: 'Extends (presets)',
    schedule: 'Schedule',
    timezone: 'Timezone',
    dependencyDashboard: 'Enable Dependency Dashboard',
    automerge: 'Automerge',
    automergeType: 'Automerge type',
    platformAutomerge: 'Use platform automerge',
    rangeStrategy: 'Range strategy',
    rebaseWhen: 'Rebase when',
    labels: 'Labels (comma or Enter)',
    assignees: 'Assignees (comma or Enter)',
    reviewers: 'Reviewers (comma or Enter)',
    branchPrefix: 'Branch prefix',
    commitMessagePrefix: 'Commit message prefix',
    prConcurrentLimit: 'Concurrent PR limit',
    prHourlyLimit: 'PRs per hour limit',
    lockFileMaintenance: 'Lock file maintenance',
    vulnerabilityAlerts: 'Vulnerability alerts',
    packageRules: 'Package Rules',
    noPackageRules: 'No package rules. Add one from a preset or manually.',
    addPackageRule: 'Add rule',
    matchDepTypes: 'matchDepTypes',
    matchUpdateTypes: 'matchUpdateTypes',
    matchManagers: 'matchManagers',
    matchPackageNames: 'matchPackageNames',
    matchPackagePatterns: 'matchPackagePatterns (regex)',
    groupName: 'groupName',
    enabled: 'Enabled',
    output: 'Generated renovate.json',
    copy: 'Copy',
    copied: 'Configuration copied!',
    download: 'Download renovate.json',
    lineCount: (n) => `${n} line${n === 1 ? '' : 's'}`,
    byteCount: (n) => `${n} bytes`,
    sourceTitle: 'Source code',
    sourceBody:
      'buildRenovateConfig builds a Renovate configuration object from the selected options, removes default fields and serializes the output as formatted JSON.',
    tipsTitle: 'Renovate tips',
    tipsBody: (
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        <li>
          The <Text code>config:recommended</Text> preset is a good starting point for most projects.
        </li>
        <li>
          Use <Text code>:dependencyDashboard</Text> to get an issue tracker with all pending updates.
        </li>
        <li>
          <Text code>rangeStrategy: bump</Text> updates package.json to the latest version; <Text code>pin</Text> locks exact versions.
        </li>
        <li>
          Package rules allow different behavior per package manager, update type or package name pattern.
        </li>
      </ul>
    ),
  },
}

function commaStringToArray(value) {
  if (!value || typeof value !== 'string') return []
  return value
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean)
}

function arrayToCommaString(arr) {
  if (!Array.isArray(arr)) return ''
  return arr.join(', ')
}

export default function RenovateConfigGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [options, setOptions] = useState({ ...PRESETS.recommended })
  const [activePreset, setActivePreset] = useState('recommended')

  const buildOptions = useMemo(() => {
    return {
      ...options,
      labels: commaStringToArray(options.labels),
      assignees: commaStringToArray(options.assignees),
      reviewers: commaStringToArray(options.reviewers),
    }
  }, [options])

  const output = useMemo(() => buildRenovateConfig(buildOptions), [buildOptions])
  const lineCount = output ? output.split('\n').length : 0
  const byteCount = useMemo(() => new Blob([output]).size, [output])

  const applyPreset = (key) => {
    const preset = PRESETS[key]
    if (!preset) return
    setActivePreset(key)
    setOptions({
      ...preset,
      labels: arrayToCommaString(preset.labels),
      assignees: arrayToCommaString(preset.assignees),
      reviewers: arrayToCommaString(preset.reviewers),
    })
  }

  const updateField = (field, value) => {
    setOptions((prev) => ({ ...prev, [field]: value }))
    setActivePreset('')
  }

  const copyOutput = () => {
    navigator.clipboard.writeText(output)
    message.success(t.copied)
  }

  const downloadOutput = () => {
    const blob = new Blob([output], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'renovate.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const addPackageRule = () => {
    const current = Array.isArray(options.packageRules) ? [...options.packageRules] : []
    current.push({
      matchManagers: [],
      matchUpdateTypes: [],
      matchPackagePatterns: [],
      groupName: '',
      automerge: false,
      enabled: true,
    })
    updateField('packageRules', current)
  }

  const updatePackageRule = (index, key, value) => {
    const current = Array.isArray(options.packageRules) ? [...options.packageRules] : []
    current[index] = { ...current[index], [key]: value }
    updateField('packageRules', current)
  }

  const removePackageRule = (index) => {
    const current = Array.isArray(options.packageRules) ? [...options.packageRules] : []
    current.splice(index, 1)
    updateField('packageRules', current)
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}>
        <FileTextOutlined /> {t.title}
      </Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Alert type="info" showIcon message={t.tipsTitle} description={t.tipsBody} />

      <Card title={t.presets}>
        <Space wrap>
          {Object.entries(PRESETS).map(([key, preset]) => (
            <Button
              key={key}
              type={activePreset === key ? 'primary' : 'default'}
              size="small"
              onClick={() => applyPreset(key)}
            >
              {preset.label[lang]}
            </Button>
          ))}
        </Space>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title={t.platform}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
                  {t.platform}
                </Text>
                <Select
                  style={{ width: '100%' }}
                  value={options.platform}
                  onChange={(v) => updateField('platform', v)}
                  options={PLATFORMS.map((o) => ({ value: o.value, label: o.label }))}
                />
              </div>

              <div>
                <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
                  {t.extends}
                </Text>
                <Select
                  mode="multiple"
                  allowClear
                  style={{ width: '100%' }}
                  value={options.extends}
                  onChange={(v) => updateField('extends', v)}
                  options={EXTENDS_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                />
              </div>

              <div>
                <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
                  {t.schedule}
                </Text>
                <Select
                  style={{ width: '100%' }}
                  value={options.schedule}
                  onChange={(v) => updateField('schedule', v)}
                  options={SCHEDULE_OPTIONS.map((o) => ({
                    value: o.value,
                    label: o.label[lang],
                  }))}
                />
              </div>

              <div>
                <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
                  {t.timezone}
                </Text>
                <Input
                  value={options.timezone}
                  onChange={(e) => updateField('timezone', e.target.value)}
                  placeholder="America/Sao_Paulo"
                />
              </div>

              <div>
                <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
                  {t.labels}
                </Text>
                <Input
                  value={options.labels}
                  onChange={(e) => updateField('labels', e.target.value)}
                  placeholder="dependencies"
                />
              </div>

              <div>
                <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
                  {t.assignees}
                </Text>
                <Input
                  value={options.assignees}
                  onChange={(e) => updateField('assignees', e.target.value)}
                  placeholder="usuario1, usuario2"
                />
              </div>

              <div>
                <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
                  {t.reviewers}
                </Text>
                <Input
                  value={options.reviewers}
                  onChange={(e) => updateField('reviewers', e.target.value)}
                  placeholder="time/backend"
                />
              </div>

              <div>
                <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
                  {t.branchPrefix}
                </Text>
                <Input
                  value={options.branchPrefix}
                  onChange={(e) => updateField('branchPrefix', e.target.value)}
                  placeholder="renovate/"
                />
              </div>

              <div>
                <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
                  {t.commitMessagePrefix}
                </Text>
                <Input
                  value={options.commitMessagePrefix}
                  onChange={(e) => updateField('commitMessagePrefix', e.target.value)}
                  placeholder="chore(deps):"
                />
              </div>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title={t.automerge}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Switch
                  checked={options.automerge}
                  onChange={(v) => updateField('automerge', v)}
                  style={{ marginRight: 8 }}
                />
                <Text>{t.automerge}</Text>
              </div>

              <div>
                <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
                  {t.automergeType}
                </Text>
                <Select
                  style={{ width: '100%' }}
                  value={options.automergeType}
                  onChange={(v) => updateField('automergeType', v)}
                  options={AUTOMERGE_TYPES.map((o) => ({ value: o.value, label: o.label }))}
                />
              </div>

              <div>
                <Switch
                  checked={options.platformAutomerge}
                  onChange={(v) => updateField('platformAutomerge', v)}
                  style={{ marginRight: 8 }}
                />
                <Text>{t.platformAutomerge}</Text>
              </div>

              <div>
                <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
                  {t.rangeStrategy}
                </Text>
                <Select
                  style={{ width: '100%' }}
                  value={options.rangeStrategy}
                  onChange={(v) => updateField('rangeStrategy', v)}
                  options={RANGE_STRATEGIES.map((o) => ({ value: o.value, label: o.label }))}
                />
              </div>

              <div>
                <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
                  {t.rebaseWhen}
                </Text>
                <Select
                  style={{ width: '100%' }}
                  value={options.rebaseWhen}
                  onChange={(v) => updateField('rebaseWhen', v)}
                  options={REBASE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                />
              </div>

              <Row gutter={16}>
                <Col span={12}>
                  <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
                    {t.prConcurrentLimit}
                  </Text>
                  <Input
                    type="number"
                    min={0}
                    value={options.prConcurrentLimit}
                    onChange={(e) => updateField('prConcurrentLimit', Number(e.target.value))}
                  />
                </Col>
                <Col span={12}>
                  <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
                    {t.prHourlyLimit}
                  </Text>
                  <Input
                    type="number"
                    min={0}
                    value={options.prHourlyLimit}
                    onChange={(e) => updateField('prHourlyLimit', Number(e.target.value))}
                  />
                </Col>
              </Row>

              <div>
                <Switch
                  checked={options.dependencyDashboard}
                  onChange={(v) => updateField('dependencyDashboard', v)}
                  style={{ marginRight: 8 }}
                />
                <Text>{t.dependencyDashboard}</Text>
              </div>

              <div>
                <Switch
                  checked={options.lockFileMaintenance}
                  onChange={(v) => updateField('lockFileMaintenance', v)}
                  style={{ marginRight: 8 }}
                />
                <Text>{t.lockFileMaintenance}</Text>
              </div>

              <div>
                <Switch
                  checked={options.vulnerabilityAlerts}
                  onChange={(v) => updateField('vulnerabilityAlerts', v)}
                  style={{ marginRight: 8 }}
                />
                <Text>{t.vulnerabilityAlerts}</Text>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      <Card
        title={t.packageRules}
        extra={
          <Button size="small" icon={<PlusOutlined />} onClick={addPackageRule}>
            {t.addPackageRule}
          </Button>
        }
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          {(!Array.isArray(options.packageRules) || options.packageRules.length === 0) && (
            <Paragraph type="secondary">{t.noPackageRules}</Paragraph>
          )}

          {Array.isArray(options.packageRules) &&
            options.packageRules.map((rule, index) => (
              <Card
                key={index}
                size="small"
                type="inner"
                title={
                  <Space>
                    <CodeOutlined />
                    <Text strong>rule #{index + 1}</Text>
                    {rule.groupName && <Tag color="blue">{rule.groupName}</Tag>}
                  </Space>
                }
                extra={
                  <Button size="small" danger onClick={() => removePackageRule(index)}>
                    ×
                  </Button>
                }
              >
                <Row gutter={[12, 12]}>
                  <Col xs={24} md={12}>
                    <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
                      {t.matchManagers}
                    </Text>
                    <Select
                      mode="multiple"
                      allowClear
                      style={{ width: '100%' }}
                      value={rule.matchManagers}
                      onChange={(v) => updatePackageRule(index, 'matchManagers', v)}
                      options={PACKAGE_MANAGERS.map((o) => ({ value: o.value, label: o.label }))}
                    />
                  </Col>
                  <Col xs={24} md={12}>
                    <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
                      {t.matchUpdateTypes}
                    </Text>
                    <Select
                      mode="multiple"
                      allowClear
                      style={{ width: '100%' }}
                      value={rule.matchUpdateTypes}
                      onChange={(v) => updatePackageRule(index, 'matchUpdateTypes', v)}
                      options={UPDATE_TYPES.map((o) => ({ value: o.value, label: o.label }))}
                    />
                  </Col>
                  <Col xs={24} md={12}>
                    <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
                      {t.matchDepTypes}
                    </Text>
                    <Select
                      mode="tags"
                      allowClear
                      style={{ width: '100%' }}
                      value={rule.matchDepTypes}
                      onChange={(v) => updatePackageRule(index, 'matchDepTypes', v)}
                      placeholder="devDependencies, dependencies"
                    />
                  </Col>
                  <Col xs={24} md={12}>
                    <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
                      {t.matchPackageNames}
                    </Text>
                    <Select
                      mode="tags"
                      allowClear
                      style={{ width: '100%' }}
                      value={rule.matchPackageNames}
                      onChange={(v) => updatePackageRule(index, 'matchPackageNames', v)}
                      placeholder="lodash, express"
                    />
                  </Col>
                  <Col xs={24}>
                    <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
                      {t.matchPackagePatterns}
                    </Text>
                    <Select
                      mode="tags"
                      allowClear
                      style={{ width: '100%' }}
                      value={rule.matchPackagePatterns}
                      onChange={(v) => updatePackageRule(index, 'matchPackagePatterns', v)}
                      placeholder="^@company/.+"
                    />
                  </Col>
                  <Col xs={24} md={12}>
                    <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
                      {t.groupName}
                    </Text>
                    <Input
                      value={rule.groupName}
                      onChange={(e) => updatePackageRule(index, 'groupName', e.target.value)}
                    />
                  </Col>
                  <Col xs={24} md={6}>
                    <div style={{ marginTop: 24 }}>
                      <Switch
                        checked={rule.automerge === true}
                        onChange={(v) => updatePackageRule(index, 'automerge', v)}
                        style={{ marginRight: 8 }}
                      />
                      <Text>{t.automerge}</Text>
                    </div>
                  </Col>
                  <Col xs={24} md={6}>
                    <div style={{ marginTop: 24 }}>
                      <Switch
                        checked={rule.enabled !== false}
                        onChange={(v) => updatePackageRule(index, 'enabled', v)}
                        style={{ marginRight: 8 }}
                      />
                      <Text>{t.enabled}</Text>
                    </div>
                  </Col>
                </Row>
              </Card>
            ))}
        </Space>
      </Card>

      <Card
        title={t.output}
        extra={
          <Space>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {t.lineCount(lineCount)} · {t.byteCount(byteCount)}
            </Text>
            <Button size="small" icon={<CopyOutlined />} onClick={copyOutput}>
              {t.copy}
            </Button>
            <Button size="small" icon={<DownloadOutlined />} onClick={downloadOutput}>
              {t.download}
            </Button>
          </Space>
        }
      >
        <pre
          style={{
            margin: 0,
            overflowX: 'auto',
            background: '#0d1117',
            color: '#e6edf3',
            padding: 12,
            borderRadius: 8,
            maxHeight: 420,
            fontSize: 12.5,
            lineHeight: 1.6,
          }}
        >
          <code>{output}</code>
        </pre>
      </Card>

      <Collapse
        items={[
          {
            key: 'source',
            label: t.sourceTitle,
            children: (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Paragraph type="secondary">{t.sourceBody}</Paragraph>
                <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 400 }}>
                  <code>{SOURCE}</code>
                </pre>
              </Space>
            ),
          },
        ]}
      />
    </Space>
  )
}
