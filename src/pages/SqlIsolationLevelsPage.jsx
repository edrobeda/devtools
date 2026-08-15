import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Typography,
  Card,
  Space,
  Button,
  Row,
  Col,
  Tag,
  Select,
  Collapse,
  Alert,
  Table,
  Empty,
  Statistic,
  Tooltip,
} from 'antd'
import {
  DatabaseOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
  CopyOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  ISOLATION_LEVELS,
  getScenarioList,
  getScenario,
  simulateScenario,
  ANOMALY_INFO,
  sourceCode,
} from '../utils/sqlIsolationLevels'

const { Title, Paragraph, Text } = Typography
const { Panel } = Collapse
const { Option } = Select

const translations = {
  pt: {
    title: 'Simulador de Níveis de Isolação SQL',
    intro:
      'Visualize passo a passo como READ UNCOMMITTED, READ COMMITTED, REPEATABLE READ e SERIALIZABLE se comportam diante de dirty read, non-repeatable read, phantom read e lost update. Tudo é simulado 100% no navegador.',
    scenarioLabel: 'Cenário',
    isolationLabel: 'Nível de isolação',
    runButton: 'Simular',
    resetButton: 'Limpar',
    presetsTitle: 'Cenários rápidos',
    timelineTitle: 'Linha do tempo',
    stepLabel: 'Passo',
    opLabel: 'Operação',
    resultLabel: 'Resultado',
    databaseState: 'Estado atual do banco',
    finalState: 'Estado final',
    noSimulation: 'Escolha um cenário e um nível de isolação e clique em Simular.',
    anomalyTitle: 'Anomalia detectada',
    noAnomalyTitle: 'Nenhuma anomalia detectada',
    serializationError: 'Erro de serialização',
    serializationErrorText:
      'No nível SERIALIZABLE esse passo não pode ser executado porque conflita com uma leitura ativa de outra transação (simulação de conflito de serialização).',
    howItWorks: 'Como funciona',
    howItWorksText:
      'Cada nível de isolação define o quanto uma transação enxerga das alterações feitas por outras transações. READ UNCOMMITTED é o mais permissivo (e perigoso); SERIALIZABLE é o mais restrito, executando as transações como se fossem uma após a outra. A simulação mantém versões de cada linha e aplica regras de visibilidade simplificadas para demonstrar as anomalias clássicas.',
    sourceCode: 'Código-fonte do motor',
    copy: 'Copiar',
    copied: 'Copiado',
    preventionTitle: 'Prevenção de anomalias por nível',
    levelColumn: 'Nível',
    allows: 'Permite',
    prevents: 'Evita',
    dirtyRead: 'Dirty read',
    nonRepeatable: 'Non-repeatable read',
    phantom: 'Phantom read',
    lostUpdate: 'Lost update',
    begin: 'BEGIN T',
    commit: 'COMMIT T',
    rollback: 'ROLLBACK T',
    select: 'SELECT T',
    update: 'UPDATE T',
    insert: 'INSERT T',
    delete: 'DELETE T',
    where: 'WHERE',
    row: 'linha',
    rows: 'linhas',
    rangeResult: 'registros',
    txLabel: 'Transação',
    active: 'ativa',
    committed: 'commitada',
    aborted: 'abortada',
  },
  en: {
    title: 'SQL Transaction Isolation Levels Simulator',
    intro:
      'Step through how READ UNCOMMITTED, READ COMMITTED, REPEATABLE READ and SERIALIZABLE behave against dirty read, non-repeatable read, phantom read and lost update. Everything is simulated 100% in the browser.',
    scenarioLabel: 'Scenario',
    isolationLabel: 'Isolation level',
    runButton: 'Simulate',
    resetButton: 'Clear',
    presetsTitle: 'Quick scenarios',
    timelineTitle: 'Timeline',
    stepLabel: 'Step',
    opLabel: 'Operation',
    resultLabel: 'Result',
    databaseState: 'Current database state',
    finalState: 'Final state',
    noSimulation: 'Choose a scenario and isolation level and click Simulate.',
    anomalyTitle: 'Anomaly detected',
    noAnomalyTitle: 'No anomaly detected',
    serializationError: 'Serialization error',
    serializationErrorText:
      'At the SERIALIZABLE level this step cannot be executed because it conflicts with an active read from another transaction (serialization conflict simulation).',
    howItWorks: 'How it works',
    howItWorksText:
      'Each isolation level defines how much a transaction can see of changes made by other transactions. READ UNCOMMITTED is the most permissive (and dangerous); SERIALIZABLE is the strictest, executing transactions as if they ran one after another. The simulation keeps versions of each row and applies simplified visibility rules to demonstrate the classic anomalies.',
    sourceCode: 'Engine source code',
    copy: 'Copy',
    copied: 'Copied',
    preventionTitle: 'Anomaly prevention by level',
    levelColumn: 'Level',
    allows: 'Allows',
    prevents: 'Prevents',
    dirtyRead: 'Dirty read',
    nonRepeatable: 'Non-repeatable read',
    phantom: 'Phantom read',
    lostUpdate: 'Lost update',
    begin: 'BEGIN T',
    commit: 'COMMIT T',
    rollback: 'ROLLBACK T',
    select: 'SELECT T',
    update: 'UPDATE T',
    insert: 'INSERT T',
    delete: 'DELETE T',
    where: 'WHERE',
    row: 'row',
    rows: 'rows',
    rangeResult: 'records',
    txLabel: 'Transaction',
    active: 'active',
    committed: 'committed',
    aborted: 'aborted',
  },
}

function formatOp(step, t) {
  switch (step.op) {
    case 'begin':
      return `${t.begin}${step.tx}`
    case 'commit':
      return `${t.commit}${step.tx}`
    case 'rollback':
      return `${t.rollback}${step.tx}`
    case 'select':
      if (step.predicate) {
        return `${t.select}${step.tx} ${t.where} balance > 600`
      }
      return `${t.select}${step.tx} id = ${step.rowId}`
    case 'update':
      return `${t.update}${step.tx} id = ${step.rowId}`
    case 'insert':
      return `${t.insert}${step.tx} ${JSON.stringify(step.data).replace(/"/g, '')}`
    case 'delete':
      return `${t.delete}${step.tx} id = ${step.rowId}`
    default:
      return step.op
  }
}

function formatResult(opResult, t) {
  if (!opResult || opResult.value === undefined || opResult.value === null) {
    if (opResult && opResult.serializationConflict) return t.serializationError
    return '—'
  }
  if (Array.isArray(opResult.value)) {
    return `${opResult.value.length} ${t.rangeResult}`
  }
  if (typeof opResult.value === 'object') {
    return Object.entries(opResult.value)
      .map(([k, v]) => `${k}=${v}`)
      .join(', ')
  }
  return String(opResult.value)
}

function getTxColor(txId) {
  const colors = ['#1677ff', '#52c41a', '#faad14', '#eb2f96', '#722ed1']
  return colors[(txId - 1) % colors.length]
}

function DatabaseTable({ rows, lang }) {
  if (!rows || rows.length === 0) {
    return <Empty description={lang === 'pt' ? 'Tabela vazia' : 'Empty table'} />
  }

  const columns = [
    {
      title: 'id',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: 'name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'balance',
      dataIndex: 'balance',
      key: 'balance',
      align: 'right',
    },
  ]

  const data = rows.map((row) => {
    const latest = row.versions[row.versions.length - 1]
    const visible = latest.deleted ? null : latest.data
    return visible ? { ...visible, key: row.id } : { id: row.id, name: '(deleted)', balance: '—', key: row.id }
  })

  return <Table dataSource={data} columns={columns} pagination={false} size="small" bordered />
}

function Timeline({ result, stepIndex, setStepIndex, t }) {
  if (!result || !result.history) return null

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8 }}>
        {result.history.map((h, idx) => {
          const isActive = idx === stepIndex
          const hasResult = h.opResult && (h.opResult.value !== undefined || h.opResult.serializationConflict)
          return (
            <button
              key={idx}
              type="button"
              onClick={() => setStepIndex(idx)}
              style={{
                flex: '0 0 auto',
                border: `2px solid ${isActive ? '#1677ff' : '#d9d9d9'}`,
                borderRadius: 8,
                padding: '8px 12px',
                background: isActive ? '#e6f4ff' : '#fff',
                cursor: 'pointer',
                minWidth: 120,
                textAlign: 'left',
              }}
            >
              <div style={{ fontSize: 11, color: '#8c8c8c' }}>
                {t.stepLabel} {idx + 1}
              </div>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{formatOp(h.step, t)}</div>
              {hasResult && (
                <div style={{ marginTop: 4, fontSize: 12, color: '#595959' }}>
                  → {formatResult(h.opResult, t)}
                </div>
              )}
            </button>
          )
        })}
      </div>
    </Space>
  )
}

export default function SqlIsolationLevelsPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const scenarios = useMemo(() => getScenarioList(), [])
  const [scenarioKey, setScenarioKey] = useState('dirty-read')
  const [isolationLevel, setIsolationLevel] = useState('read-uncommitted')
  const [result, setResult] = useState(null)
  const [stepIndex, setStepIndex] = useState(0)
  const [copied, setCopied] = useState(false)

  const runSimulation = useCallback(() => {
    const scenario = getScenario(scenarioKey)
    const res = simulateScenario(scenario, isolationLevel)
    setResult(res)
    setStepIndex(0)
  }, [scenarioKey, isolationLevel])

  useEffect(() => {
    runSimulation()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handlePreset = useCallback((key) => {
    setScenarioKey(key)
  }, [])

  const handleCopySource = useCallback(() => {
    navigator.clipboard.writeText(sourceCode()).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }, [])

  const currentStep = useMemo(() => {
    if (!result || !result.history || stepIndex < 0 || stepIndex >= result.history.length) return null
    return result.history[stepIndex]
  }, [result, stepIndex])

  const preventionColumns = [
    { title: t.levelColumn, dataIndex: 'level', key: 'level' },
    { title: t.allows, dataIndex: 'allows', key: 'allows' },
    { title: t.prevents, dataIndex: 'prevents', key: 'prevents' },
  ]

  const preventionData = [
    {
      key: 'read-uncommitted',
      level: 'READ UNCOMMITTED',
      allows: `${t.dirtyRead}, ${t.nonRepeatable}, ${t.phantom}, ${t.lostUpdate}`,
      prevents: '—',
    },
    {
      key: 'read-committed',
      level: 'READ COMMITTED',
      allows: `${t.nonRepeatable}, ${t.phantom}, ${t.lostUpdate}`,
      prevents: t.dirtyRead,
    },
    {
      key: 'repeatable-read',
      level: 'REPEATABLE READ',
      allows: `${t.phantom}, ${t.lostUpdate}`,
      prevents: `${t.dirtyRead}, ${t.nonRepeatable}`,
    },
    {
      key: 'serializable',
      level: 'SERIALIZABLE',
      allows: '—',
      prevents: `${t.dirtyRead}, ${t.nonRepeatable}, ${t.phantom}, ${t.lostUpdate}`,
    },
  ]

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div>
        <Title level={2}>
          <DatabaseOutlined style={{ marginRight: 8 }} />
          {t.title}
        </Title>
        <Paragraph>{t.intro}</Paragraph>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={14}>
          <Card title={lang === 'pt' ? 'Configuração' : 'Configuration'}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <Text>{t.scenarioLabel}</Text>
                <Select value={scenarioKey} onChange={setScenarioKey} style={{ width: '100%' }}>
                  {scenarios.map((s) => (
                    <Option key={s.key} value={s.key}>
                      {s.label[lang]}
                    </Option>
                  ))}
                </Select>
                {result && (
                  <Paragraph type="secondary" style={{ marginTop: 4 }}>
                    {result.scenario.description[lang]}
                  </Paragraph>
                )}
              </Space>

              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <Text>{t.isolationLabel}</Text>
                <Select value={isolationLevel} onChange={setIsolationLevel} style={{ width: '100%' }}>
                  {ISOLATION_LEVELS.map((level) => (
                    <Option key={level.key} value={level.key}>
                      {level.name}
                    </Option>
                  ))}
                </Select>
              </Space>

              <Space>
                <Button type="primary" icon={<PlayCircleOutlined />} onClick={runSimulation}>
                  {t.runButton}
                </Button>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={() => {
                    setResult(null)
                    setStepIndex(0)
                  }}
                >
                  {t.resetButton}
                </Button>
              </Space>
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={10}>
          <Card title={t.presetsTitle}>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              {scenarios.map((s) => (
                <Button key={s.key} block onClick={() => handlePreset(s.key)}>
                  {s.label[lang]}
                </Button>
              ))}
            </Space>
          </Card>
        </Col>
      </Row>

      {result && result.history.length > 0 && (
        <>
          <Title level={4}>{t.timelineTitle}</Title>
          <Card>
            <Timeline result={result} stepIndex={stepIndex} setStepIndex={setStepIndex} t={t} />
          </Card>

          {currentStep && (
            <Card
              title={
                <Space>
                  <Text strong>
                    {t.stepLabel} {stepIndex + 1}: {formatOp(currentStep.step, t)}
                  </Text>
                  <Tag color={getTxColor(currentStep.step.tx)}>
                    {t.txLabel} {currentStep.step.tx}
                  </Tag>
                </Space>
              }
            >
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <Space>
                  <Text strong>{t.opLabel}:</Text>
                  <Text code>{formatOp(currentStep.step, t)}</Text>
                </Space>
                {currentStep.opResult && (
                  <Space>
                    <Text strong>{t.resultLabel}:</Text>
                    {currentStep.opResult.serializationConflict ? (
                      <Tag icon={<ExclamationCircleOutlined />} color="error">
                        {t.serializationError}
                      </Tag>
                    ) : (
                      <Text code>{formatResult(currentStep.opResult, t)}</Text>
                    )}
                  </Space>
                )}

                <div>
                  <Text strong>{t.databaseState}</Text>
                  <div style={{ marginTop: 8 }}>
                    <DatabaseTable rows={currentStep.state.rows} lang={lang} />
                  </div>
                </div>
              </Space>
            </Card>
          )}

          {result.anomaly && (
            <Alert
              message={t.anomalyTitle}
              description={
                <Space direction="vertical" size="small">
                  <Text strong>{ANOMALY_INFO[result.anomaly][lang].name}</Text>
                  <Text>{ANOMALY_INFO[result.anomaly][lang].explanation}</Text>
                  <Text type="secondary">
                    {lang === 'pt' ? 'Evitado por:' : 'Prevented by:'}{' '}
                    {ANOMALY_INFO[result.anomaly][lang].preventedBy
                      .map((key) => ISOLATION_LEVELS.find((l) => l.key === key).name)
                      .join(', ')}
                  </Text>
                </Space>
              }
              type="warning"
              showIcon
              icon={<ExclamationCircleOutlined />}
            />
          )}

          {!result.anomaly && !result.serializationError && (
            <Alert
              message={t.noAnomalyTitle}
              description={
                lang === 'pt'
                  ? 'Esse nível de isolação evitou a anomalia típica desse cenário.'
                  : 'This isolation level prevented the typical anomaly for this scenario.'
              }
              type="success"
              showIcon
              icon={<CheckCircleOutlined />}
            />
          )}

          {result.serializationError && (
            <Alert
              message={t.serializationError}
              description={t.serializationErrorText}
              type="error"
              showIcon
            />
          )}

          <Card title={t.finalState}>
            <DatabaseTable rows={result.finalState.rows} lang={lang} />
          </Card>
        </>
      )}

      {!result && (
        <Card>
          <Empty description={t.noSimulation} />
        </Card>
      )}

      <Card title={t.preventionTitle}>
        <Table dataSource={preventionData} columns={preventionColumns} pagination={false} size="small" bordered />
      </Card>

      <Alert message={t.howItWorks} description={t.howItWorksText} type="info" showIcon icon={<InfoCircleOutlined />} />

      <Collapse>
        <Panel
          header={t.sourceCode}
          extra={
            <Button
              size="small"
              icon={<CopyOutlined />}
              onClick={(e) => {
                e.stopPropagation()
                handleCopySource()
              }}
            >
              {copied ? t.copied : t.copy}
            </Button>
          }
        >
          <pre>
            <code>{sourceCode()}</code>
          </pre>
        </Panel>
      </Collapse>
    </Space>
  )
}
