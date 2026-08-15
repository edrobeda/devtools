import React, { useMemo, useState } from 'react'
import {
  Typography,
  Card,
  InputNumber,
  Select,
  Space,
  Button,
  Alert,
  Collapse,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
} from 'antd'
import {
  HistoryOutlined,
  CalculatorOutlined,
  FieldTimeOutlined,
  SyncOutlined,
  CopyOutlined,
  BarChartOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  calculateRetrySchedule,
  formatDurationMs,
  formatNumber,
  JITTER_MODES,
  RETRY_PRESETS,
  jsExample,
  pythonExample,
  bashExample,
} from '../utils/retryCalculator'

const { Title, Paragraph, Text } = Typography
const { Option } = Select
const { Panel } = Collapse

const translations = {
  pt: {
    title: 'Calculadora de Retry com Exponential Backoff',
    intro:
      'Calcule a janela total de retries de uma operacao usando exponential backoff e jitter. Util para dimensionar chamadas de API, jobs em background, consumidores de fila e qualquer fluxo que precise esperar antes de tentar novamente.',
    retriesLabel: 'Numero de retries',
    baseDelayLabel: 'Delay inicial',
    baseDelayUnit: 'ms',
    multiplierLabel: 'Multiplicador',
    capLabel: 'Delay maximo (cap)',
    capUnit: 'ms',
    jitterLabel: 'Jitter',
    jitterNone: 'Nenhum',
    jitterFull: 'Full — aleatorio entre 0 e o delay',
    jitterEqual: 'Equal — metade fixa + metade aleatoria',
    jitterDecorrelated: 'Decorrelated — aleatorio ate 2x o delay anterior',
    presetsTitle: 'Presets rapidos',
    resultsTitle: 'Resultados',
    totalWindow: 'Janela total',
    maxDelay: 'Maior delay',
    averageDelay: 'Delay medio',
    totalAttempts: 'Tentativas',
    scheduleTitle: 'Agenda de retries',
    attemptCol: 'Tentativa',
    typeCol: 'Tipo',
    baseDelayCol: 'Delay base',
    actualDelayCol: 'Delay real',
    cumulativeCol: 'Tempo acumulado',
    chartTitle: 'Grafico de delays',
    initial: 'Inicial',
    retry: 'Retry',
    explanationTitle: 'Como funciona o exponential backoff?',
    explanation:
      'Apos uma falha, esperar um tempo crescente antes de repetir a operacao reduz a carga no servidor e melhora a chance de sucesso. O jitter evita que varios clientes re-tentem ao mesmo tempo (thundering herd).',
    sourceCode: 'Codigo-fonte de exemplo',
    jsTab: 'JavaScript',
    pythonTab: 'Python',
    bashTab: 'Bash',
    copy: 'Copiar',
    copied: 'Copiado',
  },
  en: {
    title: 'Retry Calculator with Exponential Backoff',
    intro:
      'Calculate the total retry window of an operation using exponential backoff and jitter. Useful for sizing API calls, background jobs, queue consumers and any flow that needs to wait before trying again.',
    retriesLabel: 'Number of retries',
    baseDelayLabel: 'Initial delay',
    baseDelayUnit: 'ms',
    multiplierLabel: 'Multiplier',
    capLabel: 'Max delay (cap)',
    capUnit: 'ms',
    jitterLabel: 'Jitter',
    jitterNone: 'None',
    jitterFull: 'Full — random between 0 and the delay',
    jitterEqual: 'Equal — half fixed + half random',
    jitterDecorrelated: 'Decorrelated — random up to 2x previous delay',
    presetsTitle: 'Quick presets',
    resultsTitle: 'Results',
    totalWindow: 'Total window',
    maxDelay: 'Max delay',
    averageDelay: 'Average delay',
    totalAttempts: 'Attempts',
    scheduleTitle: 'Retry schedule',
    attemptCol: 'Attempt',
    typeCol: 'Type',
    baseDelayCol: 'Base delay',
    actualDelayCol: 'Actual delay',
    cumulativeCol: 'Cumulative time',
    chartTitle: 'Delay chart',
    initial: 'Initial',
    retry: 'Retry',
    explanationTitle: 'How does exponential backoff work?',
    explanation:
      'Waiting an increasing amount of time after a failure before retrying reduces load on the server and improves the chance of success. Jitter prevents multiple clients from retrying at the same time (thundering herd).',
    sourceCode: 'Example source code',
    jsTab: 'JavaScript',
    pythonTab: 'Python',
    bashTab: 'Bash',
    copy: 'Copy',
    copied: 'Copied',
  },
}

export default function RetryCalculatorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [retries, setRetries] = useState(5)
  const [baseDelayMs, setBaseDelayMs] = useState(1000)
  const [multiplier, setMultiplier] = useState(2)
  const [capMs, setCapMs] = useState(30000)
  const [jitter, setJitter] = useState('equal')
  const [copiedKey, setCopiedKey] = useState(null)

  const schedule = useMemo(
    () =>
      calculateRetrySchedule({
        retries,
        baseDelayMs,
        multiplier,
        capMs,
        jitter,
      }),
    [retries, baseDelayMs, multiplier, capMs, jitter]
  )

  const last = schedule[schedule.length - 1]
  const totalWindowMs = last ? last.cumulativeMs : 0
  const retryRows = schedule.filter((r) => r.type === 'retry')
  const maxDelayMs = retryRows.length
    ? Math.max(...retryRows.map((r) => r.actualDelayMs))
    : 0
  const averageDelayMs = retryRows.length
    ? retryRows.reduce((sum, r) => sum + r.actualDelayMs, 0) / retryRows.length
    : 0

  function applyPreset(p) {
    setRetries(p.retries)
    setBaseDelayMs(p.baseDelayMs)
    setMultiplier(p.multiplier)
    setCapMs(p.capMs)
    setJitter(p.jitter)
  }

  function copy(text, key) {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 1500)
  }

  const columns = [
    {
      title: '#',
      dataIndex: 'attempt',
      key: 'attempt',
      width: 70,
    },
    {
      title: t.typeCol,
      dataIndex: 'type',
      key: 'type',
      render: (type) => (
        <Tag color={type === 'initial' ? 'blue' : 'orange'}>
          {type === 'initial' ? t.initial : t.retry}
        </Tag>
      ),
    },
    {
      title: t.baseDelayCol,
      dataIndex: 'baseDelayMs',
      key: 'baseDelayMs',
      render: (v, row) =>
        row.type === 'initial' ? '—' : formatDurationMs(v),
    },
    {
      title: t.actualDelayCol,
      dataIndex: 'actualDelayMs',
      key: 'actualDelayMs',
      render: (v, row) =>
        row.type === 'initial' ? '—' : formatDurationMs(v),
    },
    {
      title: t.cumulativeCol,
      dataIndex: 'cumulativeMs',
      key: 'cumulativeMs',
      render: (v) => formatDurationMs(v),
    },
  ]

  const maxBar = Math.max(1, maxDelayMs)
  const chartHeight = 160
  const barWidth = Math.max(4, 320 / Math.max(schedule.length, 1) - 8)

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}>
        <SyncOutlined /> {t.title}
      </Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={8}>
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <Text strong>{t.retriesLabel}</Text>
                <InputNumber
                  min={0}
                  max={100}
                  step={1}
                  value={retries}
                  onChange={(v) => setRetries(v ?? 0)}
                  style={{ width: '100%' }}
                />
              </Space>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <Text strong>{t.baseDelayLabel} ({t.baseDelayUnit})</Text>
                <InputNumber
                  min={0}
                  step={100}
                  value={baseDelayMs}
                  onChange={(v) => setBaseDelayMs(v ?? 0)}
                  style={{ width: '100%' }}
                />
              </Space>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <Text strong>{t.multiplierLabel}</Text>
                <InputNumber
                  min={1}
                  step={0.1}
                  value={multiplier}
                  onChange={(v) => setMultiplier(v ?? 1)}
                  style={{ width: '100%' }}
                />
              </Space>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <Text strong>{t.capLabel} ({t.capUnit})</Text>
                <InputNumber
                  min={0}
                  step={1000}
                  value={capMs}
                  onChange={(v) => setCapMs(v ?? 0)}
                  style={{ width: '100%' }}
                />
              </Space>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <Text strong>{t.jitterLabel}</Text>
                <Select value={jitter} onChange={setJitter} style={{ width: '100%' }}>
                  <Option value="none">{t.jitterNone}</Option>
                  <Option value="full">{t.jitterFull}</Option>
                  <Option value="equal">{t.jitterEqual}</Option>
                  <Option value="decorrelated">{t.jitterDecorrelated}</Option>
                </Select>
              </Space>
            </Col>
          </Row>

          <div>
            <Text strong>{t.presetsTitle}: </Text>
            <Space size={[8, 8]} wrap>
              {RETRY_PRESETS.map((p) => (
                <Button key={p.key} size="small" onClick={() => applyPreset(p)}>
                  {lang === 'pt' ? p.labelPt : p.labelEn}
                </Button>
              ))}
            </Space>
          </div>

          <Row gutter={[16, 16]}>
            <Col xs={12} sm={6}>
              <Card size="small">
                <Statistic
                  title={t.totalWindow}
                  value={formatDurationMs(totalWindowMs)}
                  prefix={<FieldTimeOutlined />}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card size="small">
                <Statistic
                  title={t.maxDelay}
                  value={formatDurationMs(maxDelayMs)}
                  prefix={<CalculatorOutlined />}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card size="small">
                <Statistic
                  title={t.averageDelay}
                  value={formatDurationMs(averageDelayMs)}
                  prefix={<HistoryOutlined />}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card size="small">
                <Statistic
                  title={t.totalAttempts}
                  value={schedule.length}
                  prefix={<SyncOutlined />}
                />
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} lg={14}>
              <Card size="small" title={t.scheduleTitle}>
                <Table
                  dataSource={schedule}
                  columns={columns}
                  rowKey="attempt"
                  pagination={false}
                  size="small"
                  scroll={{ x: 'max-content' }}
                />
              </Card>
            </Col>
            <Col xs={24} lg={10}>
              <Card size="small" title={t.chartTitle}>
                <svg
                  width="100%"
                  height={chartHeight}
                  viewBox={`0 0 360 ${chartHeight}`}
                  role="img"
                  aria-label={t.chartTitle}
                >
                  {retryRows.map((row, idx) => {
                    const h = Math.max(2, (row.actualDelayMs / maxBar) * (chartHeight - 32))
                    const x = 20 + idx * (barWidth + 8)
                    const y = chartHeight - h - 24
                    return (
                      <g key={row.attempt}>
                        <rect
                          x={x}
                          y={y}
                          width={barWidth}
                          height={h}
                          fill="#1677ff"
                          rx={3}
                        />
                        <text
                          x={x + barWidth / 2}
                          y={chartHeight - 6}
                          textAnchor="middle"
                          fontSize={10}
                          fill="currentColor"
                        >
                          {row.attempt}
                        </text>
                      </g>
                    )
                  })}
                </svg>
              </Card>
            </Col>
          </Row>
        </Space>
      </Card>

      <Alert
        type="info"
        showIcon
        message={t.explanationTitle}
        description={t.explanation}
      />

      <Collapse>
        <Panel header={`${t.sourceCode} — ${t.jsTab}`} key="js">
          <div style={{ position: 'relative' }}>
            <Button
              size="small"
              icon={<CopyOutlined />}
              style={{ position: 'absolute', top: 8, right: 8 }}
              onClick={() => copy(jsExample, 'js')}
            >
              {copiedKey === 'js' ? t.copied : t.copy}
            </Button>
            <pre style={{ margin: 0, overflow: 'auto', padding: 16 }}>
              <code>{jsExample}</code>
            </pre>
          </div>
        </Panel>
        <Panel header={`${t.sourceCode} — ${t.pythonTab}`} key="python">
          <div style={{ position: 'relative' }}>
            <Button
              size="small"
              icon={<CopyOutlined />}
              style={{ position: 'absolute', top: 8, right: 8 }}
              onClick={() => copy(pythonExample, 'python')}
            >
              {copiedKey === 'python' ? t.copied : t.copy}
            </Button>
            <pre style={{ margin: 0, overflow: 'auto', padding: 16 }}>
              <code>{pythonExample}</code>
            </pre>
          </div>
        </Panel>
        <Panel header={`${t.sourceCode} — ${t.bashTab}`} key="bash">
          <div style={{ position: 'relative' }}>
            <Button
              size="small"
              icon={<CopyOutlined />}
              style={{ position: 'absolute', top: 8, right: 8 }}
              onClick={() => copy(bashExample, 'bash')}
            >
              {copiedKey === 'bash' ? t.copied : t.copy}
            </Button>
            <pre style={{ margin: 0, overflow: 'auto', padding: 16 }}>
              <code>{bashExample}</code>
            </pre>
          </div>
        </Panel>
      </Collapse>
    </Space>
  )
}
