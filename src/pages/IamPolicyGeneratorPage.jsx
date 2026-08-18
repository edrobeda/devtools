import React, { useCallback, useMemo, useState } from 'react'
import {
  Typography,
  Card,
  Space,
  Button,
  Select,
  Input,
  Row,
  Col,
  Collapse,
  Alert,
  Tag,
  Statistic,
  Divider,
  Tooltip,
} from 'antd'
import {
  CloudOutlined,
  SafetyCertificateOutlined,
  PlusOutlined,
  DeleteOutlined,
  CopyOutlined,
  DownloadOutlined,
  InfoCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  POLICY_VERSIONS,
  EFFECTS,
  CONDITION_OPERATORS,
  createPolicy,
  createStatement,
  createCondition,
  generatePolicy,
  countPolicyStats,
  getPresets,
  downloadFile,
} from '../utils/iamPolicyGenerator'

const { Title, Paragraph, Text } = Typography
const { Panel } = Collapse
const { TextArea } = Input

const sourceCode = `import {
  createPolicy,
  createStatement,
  createCondition,
  generatePolicy,
  getPresets,
} from '../utils/iamPolicyGenerator'

// Cria uma política com um statement padrão
const policy = createPolicy()

// Adiciona um statement manualmente
policy.statements.push(createStatement())
policy.statements[0].actions = ['s3:GetObject']
policy.statements[0].resources = ['arn:aws:s3:::bucket/*']

// Gera o JSON final
const { json, payload, valid, errors } = generatePolicy(policy)
console.log(json)

// Aplica um preset
const preset = getPresets('en').find((p) => p.key === 's3ReadOnly')
const presetResult = generatePolicy(preset.policy)
`

const translations = {
  pt: {
    title: 'Gerador de Política IAM AWS',
    subtitle: 'Monte políticas AWS IAM em JSON 100% no navegador',
    intro: 'Adicione statements, defina Effect, Principal, Action, Resource e Condition e gere uma política IAM válida para a AWS. Nenhum dado sai do navegador — revise sempre o JSON antes de aplicá-lo em produção.',
    presets: 'Presets rápidos',
    version: 'Versão da política',
    addStatement: 'Adicionar statement',
    statement: 'Statement',
    sid: 'Sid',
    effect: 'Effect',
    principal: 'Principal',
    principalHint: 'Deixe em branco para a política ser anexada a um usuário/role. Use * para qualquer um ou um ARN de conta/root para cross-account.',
    actions: 'Action(s)',
    actionsHint: 'Ex: s3:GetObject, ec2:*, lambda:InvokeFunction',
    notActions: 'NotAction(s)',
    resources: 'Resource(s)',
    resourcesHint: 'Ex: arn:aws:s3:::bucket/*, *',
    notResources: 'NotResource(s)',
    conditions: 'Condition(s)',
    operator: 'Operador',
    conditionKey: 'Key',
    conditionValues: 'Values',
    addAction: 'Adicionar action',
    addResource: 'Adicionar resource',
    addNotAction: 'Adicionar NotAction',
    addNotResource: 'Adicionar NotResource',
    addCondition: 'Adicionar condition',
    removeCondition: 'Remover condition',
    removeStatement: 'Remover statement',
    preview: 'Preview da política',
    copy: 'Copiar JSON',
    download: 'Baixar .json',
    copied: 'Copiado!',
    stats: 'Estatísticas',
    statements: 'Statements',
    actionsCount: 'Actions',
    resourcesCount: 'Resources',
    conditionsCount: 'Conditions',
    validation: 'Validação',
    warnings: 'Avisos',
    noWarnings: 'Nenhum aviso — política válida.',
    allowWildcardWarning: 'Allow com Resource "*" é muito permissivo.',
    sourceTitle: 'Motor de geração',
    sourceIntro: 'O motor é puro JavaScript client-side — nenhum dado sai do navegador.',
    emptyListPlaceholder: 'Uma por linha',
    actionPlaceholder: 's3:GetObject',
    resourcePlaceholder: 'arn:aws:s3:::bucket/*',
  },
  en: {
    title: 'AWS IAM Policy Generator',
    subtitle: 'Build AWS IAM policies as JSON 100% in the browser',
    intro: 'Add statements, set Effect, Principal, Action, Resource and Condition, and generate a valid AWS IAM policy. No data leaves the browser — always review the JSON before applying it in production.',
    presets: 'Quick presets',
    version: 'Policy version',
    addStatement: 'Add statement',
    statement: 'Statement',
    sid: 'Sid',
    effect: 'Effect',
    principal: 'Principal',
    principalHint: 'Leave blank when attaching the policy to a user/role. Use * for anyone or an account/root ARN for cross-account.',
    actions: 'Action(s)',
    actionsHint: 'e.g. s3:GetObject, ec2:*, lambda:InvokeFunction',
    notActions: 'NotAction(s)',
    resources: 'Resource(s)',
    resourcesHint: 'e.g. arn:aws:s3:::bucket/*, *',
    notResources: 'NotResource(s)',
    conditions: 'Condition(s)',
    operator: 'Operator',
    conditionKey: 'Key',
    conditionValues: 'Values',
    addAction: 'Add action',
    addResource: 'Add resource',
    addNotAction: 'Add NotAction',
    addNotResource: 'Add NotResource',
    addCondition: 'Add condition',
    removeCondition: 'Remove condition',
    removeStatement: 'Remove statement',
    preview: 'Policy preview',
    copy: 'Copy JSON',
    download: 'Download .json',
    copied: 'Copied!',
    stats: 'Statistics',
    statements: 'Statements',
    actionsCount: 'Actions',
    resourcesCount: 'Resources',
    conditionsCount: 'Conditions',
    validation: 'Validation',
    warnings: 'Warnings',
    noWarnings: 'No warnings — policy is valid.',
    allowWildcardWarning: 'Allow with Resource "*" is very permissive.',
    sourceTitle: 'Generation engine',
    sourceIntro: 'The engine is pure client-side JavaScript — no data leaves the browser.',
    emptyListPlaceholder: 'One per line',
    actionPlaceholder: 's3:GetObject',
    resourcePlaceholder: 'arn:aws:s3:::bucket/*',
  },
}

export default function IamPolicyGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [policy, setPolicy] = useState(() => createPolicy())
  const [copied, setCopied] = useState(false)

  const presets = useMemo(() => getPresets(lang), [lang])
  const generated = useMemo(() => generatePolicy(policy), [policy])
  const stats = useMemo(() => countPolicyStats(policy), [policy])

  const applyPreset = useCallback((preset) => {
    setPolicy(preset.policy)
  }, [])

  const updateVersion = useCallback((version) => {
    setPolicy((prev) => ({ ...prev, version }))
  }, [])

  const addStatement = useCallback(() => {
    setPolicy((prev) => ({ ...prev, statements: [...prev.statements, createStatement()] }))
  }, [])

  const removeStatement = useCallback((id) => {
    setPolicy((prev) => ({ ...prev, statements: prev.statements.filter((s) => s.id !== id) }))
  }, [])

  const updateStatementField = useCallback((id, field, value) => {
    setPolicy((prev) => ({
      ...prev,
      statements: prev.statements.map((s) => (s.id === id ? { ...s, [field]: value } : s)),
    }))
  }, [])

  const updateListField = useCallback((statementId, field, index, value) => {
    setPolicy((prev) => ({
      ...prev,
      statements: prev.statements.map((s) => {
        if (s.id !== statementId) return s
        const next = [...s[field]]
        next[index] = value
        return { ...s, [field]: next }
      }),
    }))
  }, [])

  const addListItem = useCallback((statementId, field) => {
    setPolicy((prev) => ({
      ...prev,
      statements: prev.statements.map((s) =>
        s.id === statementId ? { ...s, [field]: [...s[field], ''] } : s
      ),
    }))
  }, [])

  const removeListItem = useCallback((statementId, field, index) => {
    setPolicy((prev) => ({
      ...prev,
      statements: prev.statements.map((s) => {
        if (s.id !== statementId) return s
        const next = s[field].filter((_, i) => i !== index)
        return { ...s, [field]: next.length ? next : [''] }
      }),
    }))
  }, [])

  const addCondition = useCallback((statementId) => {
    setPolicy((prev) => ({
      ...prev,
      statements: prev.statements.map((s) =>
        s.id === statementId ? { ...s, conditions: [...s.conditions, createCondition()] } : s
      ),
    }))
  }, [])

  const removeCondition = useCallback((statementId, conditionId) => {
    setPolicy((prev) => ({
      ...prev,
      statements: prev.statements.map((s) =>
        s.id === statementId
          ? { ...s, conditions: s.conditions.filter((c) => c.id !== conditionId) }
          : s
      ),
    }))
  }, [])

  const updateCondition = useCallback((statementId, conditionId, field, value) => {
    setPolicy((prev) => ({
      ...prev,
      statements: prev.statements.map((s) => {
        if (s.id !== statementId) return s
        return {
          ...s,
          conditions: s.conditions.map((c) => (c.id === conditionId ? { ...c, [field]: value } : c)),
        }
      }),
    }))
  }, [])

  const updateConditionValues = useCallback((statementId, conditionId, value) => {
    const values = value.split('\n').map((v) => v.trim()).filter(Boolean)
    setPolicy((prev) => ({
      ...prev,
      statements: prev.statements.map((s) => {
        if (s.id !== statementId) return s
        return {
          ...s,
          conditions: s.conditions.map((c) =>
            c.id === conditionId ? { ...c, values } : c
          ),
        }
      }),
    }))
  }, [])

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(generated.json)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // ignore
    }
  }, [generated.json])

  const handleDownload = useCallback(() => {
    downloadFile(generated.json, 'policy.json')
  }, [generated.json])

  const renderListField = (statement, field, placeholder, labelAdd) => (
    <Space direction="vertical" style={{ width: '100%' }} size="small">
      {(statement[field] || []).map((item, index) => (
        <Row key={`${statement.id}-${field}-${index}`} gutter={[8, 8]} align="middle">
          <Col flex="auto">
            <Input
              value={item}
              placeholder={placeholder}
              onChange={(e) => updateListField(statement.id, field, index, e.target.value)}
            />
          </Col>
          <Col>
            <Button
              danger
              size="small"
              icon={<DeleteOutlined />}
              onClick={() => removeListItem(statement.id, field, index)}
            />
          </Col>
        </Row>
      ))}
      <Button size="small" icon={<PlusOutlined />} onClick={() => addListItem(statement.id, field)}>
        {labelAdd}
      </Button>
    </Space>
  )

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <Title level={2}>
        <CloudOutlined style={{ marginRight: 12 }} />
        {t.title}
      </Title>
      <Paragraph type="secondary" style={{ marginTop: -8, marginBottom: 24 }}>
        {t.subtitle}
      </Paragraph>
      <Paragraph>{t.intro}</Paragraph>

      <Card style={{ marginBottom: 24 }}>
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Text strong>{t.presets}</Text>
          <Space wrap>
            {presets.map((preset) => (
              <Button key={preset.key} size="small" onClick={() => applyPreset(preset)}>
                {preset.label}
              </Button>
            ))}
          </Space>
        </Space>
      </Card>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={14}>
          <Card
            title={(
              <Space>
                <SafetyCertificateOutlined />
                <span>{lang === 'pt' ? 'Editor de statements' : 'Statement editor'}</span>
              </Space>
            )}
            extra={(
              <Space>
                <Text type="secondary">{t.version}</Text>
                <Select
                  value={policy.version}
                  onChange={updateVersion}
                  options={POLICY_VERSIONS.map((v) => ({ value: v, label: v }))}
                  style={{ width: 120 }}
                />
                <Button type="primary" icon={<PlusOutlined />} onClick={addStatement}>
                  {t.addStatement}
                </Button>
              </Space>
            )}
          >
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              {policy.statements.map((statement, index) => (
                <Card
                  key={statement.id}
                  type="inner"
                  size="small"
                  title={
                    <Space>
                      <Text strong>{t.statement} #{index + 1}</Text>
                      <Tag color={statement.effect === 'Deny' ? 'red' : 'green'}>{statement.effect}</Tag>
                    </Space>
                  }
                  extra={
                    <Button
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={() => removeStatement(statement.id)}
                    >
                      {t.removeStatement}
                    </Button>
                  }
                >
                  <Space direction="vertical" style={{ width: '100%' }} size="middle">
                    <Row gutter={[16, 16]}>
                      <Col xs={24} sm={8}>
                        <Text type="secondary">{t.sid}</Text>
                        <Input
                          value={statement.sid}
                          placeholder={t.sid}
                          onChange={(e) => updateStatementField(statement.id, 'sid', e.target.value)}
                        />
                      </Col>
                      <Col xs={24} sm={8}>
                        <Text type="secondary">{t.effect}</Text>
                        <Select
                          value={statement.effect}
                          onChange={(v) => updateStatementField(statement.id, 'effect', v)}
                          options={EFFECTS.map((e) => ({ value: e, label: e }))}
                          style={{ width: '100%' }}
                        />
                      </Col>
                      <Col xs={24} sm={8}>
                        <Text type="secondary">{t.principal}</Text>
                        <Tooltip title={t.principalHint}>
                          <Input
                            value={statement.principal}
                            placeholder="*"
                            onChange={(e) => updateStatementField(statement.id, 'principal', e.target.value)}
                          />
                        </Tooltip>
                      </Col>
                    </Row>

                    <div>
                      <Text type="secondary">{t.actions}</Text>
                      <Tooltip title={t.actionsHint}>
                        <InfoCircleOutlined style={{ marginLeft: 6, color: '#999' }} />
                      </Tooltip>
                      {renderListField(statement, 'actions', t.actionPlaceholder, t.addAction)}
                    </div>

                    <div>
                      <Text type="secondary">{t.resources}</Text>
                      <Tooltip title={t.resourcesHint}>
                        <InfoCircleOutlined style={{ marginLeft: 6, color: '#999' }} />
                      </Tooltip>
                      {renderListField(statement, 'resources', t.resourcePlaceholder, t.addResource)}
                    </div>

                    <Collapse ghost size="small">
                      <Panel header={t.notActions} key="notActions">
                        {renderListField(statement, 'notActions', t.actionPlaceholder, t.addNotAction)}
                      </Panel>
                      <Panel header={t.notResources} key="notResources">
                        {renderListField(statement, 'notResources', t.resourcePlaceholder, t.addNotResource)}
                      </Panel>
                      <Panel header={t.conditions} key="conditions">
                        <Space direction="vertical" style={{ width: '100%' }} size="middle">
                          {statement.conditions.map((condition) => (
                            <Card key={condition.id} type="inner" size="small">
                              <Row gutter={[8, 8]} align="middle">
                                <Col xs={24} sm={7}>
                                  <Select
                                    value={condition.operator}
                                    onChange={(v) => updateCondition(statement.id, condition.id, 'operator', v)}
                                    options={CONDITION_OPERATORS.map((op) => ({ value: op, label: op }))}
                                    style={{ width: '100%' }}
                                  />
                                </Col>
                                <Col xs={24} sm={7}>
                                  <Input
                                    value={condition.key}
                                    placeholder={t.conditionKey}
                                    onChange={(e) => updateCondition(statement.id, condition.id, 'key', e.target.value)}
                                  />
                                </Col>
                                <Col xs={24} sm={9}>
                                  <TextArea
                                    value={condition.values.join('\n')}
                                    placeholder={t.emptyListPlaceholder}
                                    autoSize={{ minRows: 1, maxRows: 4 }}
                                    onChange={(e) => updateConditionValues(statement.id, condition.id, e.target.value)}
                                  />
                                </Col>
                                <Col xs={24} sm={1}>
                                  <Button
                                    danger
                                    size="small"
                                    icon={<DeleteOutlined />}
                                    onClick={() => removeCondition(statement.id, condition.id)}
                                  />
                                </Col>
                              </Row>
                            </Card>
                          ))}
                          <Button size="small" icon={<PlusOutlined />} onClick={() => addCondition(statement.id)}>
                            {t.addCondition}
                          </Button>
                        </Space>
                      </Panel>
                    </Collapse>
                  </Space>
                </Card>
              ))}
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <Card title={t.stats} size="small">
              <Row gutter={16}>
                <Col span={6}>
                  <Statistic title={t.statements} value={stats.statements} />
                </Col>
                <Col span={6}>
                  <Statistic title={t.actionsCount} value={stats.actions} />
                </Col>
                <Col span={6}>
                  <Statistic title={t.resourcesCount} value={stats.resources} />
                </Col>
                <Col span={6}>
                  <Statistic title={t.conditionsCount} value={stats.conditions} />
                </Col>
              </Row>
            </Card>

            <Card
              title={t.preview}
              extra={(
                <Space>
                  <Button icon={<CopyOutlined />} onClick={handleCopy}>
                    {copied ? t.copied : t.copy}
                  </Button>
                  <Button icon={<DownloadOutlined />} onClick={handleDownload}>
                    {t.download}
                  </Button>
                </Space>
              )}
            >
              <pre
                style={{
                  background: '#f6ffed',
                  padding: 16,
                  borderRadius: 8,
                  overflow: 'auto',
                  maxHeight: 400,
                  margin: 0,
                }}
              >
                <code>{generated.json}</code>
              </pre>
            </Card>

            <Card title={t.validation} size="small">
              {generated.errors.length === 0 ? (
                <Alert type="success" showIcon message={t.noWarnings} />
              ) : (
                <Space direction="vertical" style={{ width: '100%' }}>
                  {generated.errors.map((err, idx) => (
                    <Alert
                      key={idx}
                      type={err.includes('permissivo') || err.includes('permissive') ? 'warning' : 'error'}
                      showIcon
                      icon={err.includes('permissivo') || err.includes('permissive') ? <WarningOutlined /> : <InfoCircleOutlined />}
                      message={err}
                    />
                  ))}
                </Space>
              )}
            </Card>
          </Space>
        </Col>
      </Row>

      <Divider />

      <Collapse>
        <Panel header={t.sourceTitle} key="source">
          <Paragraph>{t.sourceIntro}</Paragraph>
          <pre style={{ background: '#f6ffed', padding: 16, borderRadius: 8, overflow: 'auto' }}>
            <code>{sourceCode}</code>
          </pre>
        </Panel>
      </Collapse>
    </div>
  )
}
