import React, { useMemo, useState } from 'react'
import {
  Typography,
  Card,
  InputNumber,
  Space,
  Row,
  Col,
  Statistic,
  Tag,
  Alert,
  Collapse,
  Button,
  Select,
  Radio,
} from 'antd'
import {
  CalculatorOutlined,
  InfoCircleOutlined,
  SyncOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  solveConcurrencyThroughput,
  formatNumber,
  getPresets,
  toMs,
  fromMs,
  toRps,
  fromRps,
} from '../utils/concurrencyThroughputCalculator'

const { Title, Paragraph, Text } = Typography
const { Panel } = Collapse

const sourceCode = `import {
  solveConcurrencyThroughput,
  toMs,
  toRps,
  fromRps,
} from '../utils/concurrencyThroughputCalculator'

// Dados N usuários concorrentes, tempo de resposta e think time,
// descubra o throughput em req/s.
solveConcurrencyThroughput({
  concurrentUsers: 200,
  throughput: null,
  responseTimeMs: toMs(150, 'ms'),
  thinkTimeMs: toMs(50, 'ms'),
  requestsPerUser: 20,
})
// throughputRps ≈ 1000, cycleMs = 200, utilization = 75%

// Dados um throughput-alvo, descubra quantos usuários são necessários.
solveConcurrencyThroughput({
  concurrentUsers: null,
  throughput: toRps(1000, 'rps'),
  responseTimeMs: toMs(150, 'ms'),
  thinkTimeMs: toMs(50, 'ms'),
  requestsPerUser: 20,
})
// concurrentUsers ≈ 200

// Dados N usuários e um throughput-alvo, descubra o tempo de resposta máximo.
solveConcurrencyThroughput({
  concurrentUsers: 200,
  throughput: toRps(1000, 'rps'),
  responseTimeMs: null,
  thinkTimeMs: toMs(50, 'ms'),
  requestsPerUser: 20,
})
// responseTimeMs ≈ 150
`

const translations = {
  pt: {
    title: 'Calculadora de Concorrência & Throughput',
    subtitle: 'Dimensione APIs e aplicações web: usuários, RPS e latência',
    intro: 'Modele quantos usuários concorrentes uma aplicação web precisa — ou consegue — atender. A calculadora considera o tempo médio de resposta e o tempo de "pensamento" entre requisições, ligando throughput (RPS), concorrência e latência de forma equivalente à Lei de Little.',
    modeLabel: 'O que calcular?',
    modeThroughput: 'Throughput (RPS)',
    modeUsers: 'Usuários concorrentes',
    modeResponseTime: 'Tempo de resposta máx.',
    concurrentUsersLabel: 'Usuários concorrentes (N)',
    concurrentUsersHelp: 'Número de usuários/requests simultâneos no sistema.',
    throughputLabel: 'Throughput (λ)',
    throughputHelp: 'Requisições por unidade de tempo que o sistema deve atender.',
    responseTimeLabel: 'Tempo médio de resposta (W)',
    responseTimeHelp: 'Tempo entre enviar a requisição e receber a resposta.',
    thinkTimeLabel: 'Think time (T)',
    thinkTimeHelp: 'Tempo que o usuário "pensa" entre uma requisição e outra.',
    requestsPerUserLabel: 'Requisições por usuário',
    requestsPerUserHelp: 'Quantas requisições um usuário faz em uma sessão/iteração (usado para estimar duração total).',
    presets: 'Exemplos de um clique',
    clear: 'Limpar',
    results: 'Resultados',
    resultThroughput: 'Throughput',
    resultUsers: 'Usuários concorrentes',
    resultResponseTime: 'Tempo de resposta',
    resultThinkTime: 'Think time',
    resultCycleTime: 'Ciclo por requisição',
    resultSessionDuration: 'Duração da sessão',
    resultUtilization: 'Utilização',
    resultRequests: 'Total de requisições',
    equation: 'Equação',
    equationDesc: 'λ = N / (W + T) — cada usuário gera uma requisição a cada ciclo de resposta + think time.',
    stable: 'Sistema estável?',
    stableYes: 'Sim — os valores são consistentes com λ = N / (W + T).',
    stableNo: 'Verifique os valores: W + T deve ser maior que zero e os campos preenchidos devem ser positivos.',
    needTwo: 'Preencha pelo menos dois valores entre usuários, throughput e tempo de resposta para calcular o terceiro.',
    negativeResponseTime: 'Atenção: o throughput desejado exigiria tempo de resposta negativo; o resultado foi ajustado para zero. Aumente usuários ou reduza o alvo.',
    unitNote: 'As unidades afetam apenas a exibição. O cálculo interno sempre usa segundos.',
    sourceTitle: 'Motor de cálculo',
    sourceIntro: 'O motor é puro JavaScript client-side — nenhum dado sai do navegador.',
    perSecond: '/s',
    perMinute: '/min',
    perHour: '/h',
    perDay: '/dia',
  },
  en: {
    title: 'Concurrency & Throughput Calculator',
    subtitle: 'Size web APIs and apps: users, RPS and latency',
    intro: 'Model how many concurrent users a web application needs — or can handle. The calculator takes average response time and "think time" between requests into account, linking throughput (RPS), concurrency and latency in a way equivalent to Little\'s Law.',
    modeLabel: 'What to calculate?',
    modeThroughput: 'Throughput (RPS)',
    modeUsers: 'Concurrent users',
    modeResponseTime: 'Max response time',
    concurrentUsersLabel: 'Concurrent users (N)',
    concurrentUsersHelp: 'Number of simultaneous users/requests in the system.',
    throughputLabel: 'Throughput (λ)',
    throughputHelp: 'Requests per unit of time the system must serve.',
    responseTimeLabel: 'Average response time (W)',
    responseTimeHelp: 'Time from sending a request to receiving the response.',
    thinkTimeLabel: 'Think time (T)',
    thinkTimeHelp: 'Time the user "thinks" between requests.',
    requestsPerUserLabel: 'Requests per user',
    requestsPerUserHelp: 'How many requests a user makes in one session/iteration (used to estimate total session duration).',
    presets: 'One-click examples',
    clear: 'Clear',
    results: 'Results',
    resultThroughput: 'Throughput',
    resultUsers: 'Concurrent users',
    resultResponseTime: 'Response time',
    resultThinkTime: 'Think time',
    resultCycleTime: 'Cycle per request',
    resultSessionDuration: 'Session duration',
    resultUtilization: 'Utilization',
    resultRequests: 'Total requests',
    equation: 'Equation',
    equationDesc: 'λ = N / (W + T) — each user generates one request every response + think time cycle.',
    stable: 'Stable system?',
    stableYes: 'Yes — values are consistent with λ = N / (W + T).',
    stableNo: 'Check the values: W + T must be greater than zero and filled fields must be positive.',
    needTwo: 'Fill at least two values among users, throughput and response time to calculate the third.',
    negativeResponseTime: 'Warning: the target throughput would require a negative response time; result adjusted to zero. Increase users or lower the target.',
    unitNote: 'Units affect display only. Internal calculation always uses seconds.',
    sourceTitle: 'Calculation engine',
    sourceIntro: 'The engine is pure client-side JavaScript — no data leaves the browser.',
    perSecond: '/s',
    perMinute: '/min',
    perHour: '/h',
    perDay: '/day',
  },
}

const timeUnits = [
  { value: 'ms', label: { pt: 'ms', en: 'ms' } },
  { value: 's', label: { pt: 's', en: 's' } },
  { value: 'min', label: { pt: 'min', en: 'min' } },
  { value: 'h', label: { pt: 'h', en: 'h' } },
]

const throughputUnits = [
  { value: 'rps', label: { pt: 'req/s', en: 'req/s' } },
  { value: 'rpm', label: { pt: 'req/min', en: 'req/min' } },
  { value: 'rph', label: { pt: 'req/h', en: 'req/h' } },
  { value: 'rpd', label: { pt: 'req/dia', en: 'req/day' } },
]

export default function ConcurrencyThroughputCalculatorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [mode, setMode] = useState('throughput')
  const [concurrentUsers, setConcurrentUsers] = useState(200)
  const [throughput, setThroughput] = useState('')
  const [throughputUnit, setThroughputUnit] = useState('rps')
  const [responseTime, setResponseTime] = useState(150)
  const [responseTimeUnit, setResponseTimeUnit] = useState('ms')
  const [thinkTime, setThinkTime] = useState(50)
  const [thinkTimeUnit, setThinkTimeUnit] = useState('ms')
  const [requestsPerUser, setRequestsPerUser] = useState(20)

  const presets = useMemo(() => getPresets(lang), [lang])

  const inputs = useMemo(() => {
    return {
      concurrentUsers: mode === 'users' ? null : Number(concurrentUsers),
      throughput: mode === 'throughput' ? null : toRps(throughput, throughputUnit),
      responseTimeMs: mode === 'responseTime' ? null : toMs(responseTime, responseTimeUnit),
      thinkTimeMs: toMs(thinkTime, thinkTimeUnit),
      requestsPerUser,
    }
  }, [
    mode,
    concurrentUsers,
    throughput,
    throughputUnit,
    responseTime,
    responseTimeUnit,
    thinkTime,
    thinkTimeUnit,
    requestsPerUser,
  ])

  const result = useMemo(() => solveConcurrencyThroughput(inputs), [inputs])

  const display = useMemo(() => {
    if (!result.solved) return null
    const r = result.results
    return {
      throughputRps: r.throughputRps,
      throughputDisplay: {
        rps: fromRps(r.throughputRps, 'rps'),
        rpm: fromRps(r.throughputRps, 'rpm'),
        rph: fromRps(r.throughputRps, 'rph'),
        rpd: fromRps(r.throughputRps, 'rpd'),
      },
      concurrentUsers: r.concurrentUsers,
      responseTimeMs: r.responseTimeMs,
      responseTimeDisplay: fromMs(r.responseTimeMs, responseTimeUnit),
      thinkTimeMs: r.thinkTimeMs,
      thinkTimeDisplay: fromMs(r.thinkTimeMs, thinkTimeUnit),
      cycleMs: r.cycleMs,
      sessionMs: r.sessionMs,
      utilization: r.utilization,
      totalRequests: r.requestsPerUser,
    }
  }, [result, responseTimeUnit, thinkTimeUnit])

  const handlePreset = (preset) => {
    setMode(preset.concurrentUsers === null ? 'users' : preset.throughput === null ? 'throughput' : 'responseTime')
    setConcurrentUsers(preset.concurrentUsers === null ? '' : preset.concurrentUsers)
    setThroughput(preset.throughput === null ? '' : preset.throughput)
    setThroughputUnit(preset.throughputUnit)
    setResponseTime(preset.responseTime)
    setResponseTimeUnit(preset.responseTimeUnit)
    setThinkTime(preset.thinkTime)
    setThinkTimeUnit(preset.thinkTimeUnit)
    setRequestsPerUser(preset.requestsPerUser)
  }

  const clearAll = () => {
    setMode('throughput')
    setConcurrentUsers('')
    setThroughput('')
    setThroughputUnit('rps')
    setResponseTime('')
    setResponseTimeUnit('ms')
    setThinkTime('')
    setThinkTimeUnit('ms')
    setRequestsPerUser(1)
  }

  const fieldStyle = { width: '100%' }

  const renderNumberInput = (label, help, value, onChange, disabled, unit, setUnit, unitOptions) => (
    <div>
      <Text strong>{label}</Text>
      <Text type="secondary" style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>
        {help}
      </Text>
      <Row gutter={8}>
        <Col flex="auto">
          <InputNumber
            style={fieldStyle}
            min={0}
            step={unit === 'ms' || unit === 'rps' ? 1 : 0.1}
            value={value}
            onChange={(v) => onChange(v === null ? '' : v)}
            placeholder={label}
            disabled={disabled}
          />
        </Col>
        <Col style={{ width: 120 }}>
          <Select
            style={fieldStyle}
            value={unit}
            onChange={(v) => setUnit(v)}
            options={unitOptions.map((u) => ({ value: u.value, label: u.label[lang] }))}
            disabled={disabled}
          />
        </Col>
      </Row>
    </div>
  )

  return (
    <div style={{ padding: 24, maxWidth: 960, margin: '0 auto' }}>
      <Title level={2}>
        <ThunderboltOutlined style={{ marginRight: 12 }} />
        {t.title}
      </Title>
      <Paragraph type="secondary" style={{ marginTop: -8, marginBottom: 24 }}>
        {t.subtitle}
      </Paragraph>
      <Paragraph>{t.intro}</Paragraph>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card>
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <div>
                <Text strong>{t.modeLabel}</Text>
                <Radio.Group
                  value={mode}
                  onChange={(e) => setMode(e.target.value)}
                  style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8 }}
                >
                  <Radio.Button value="throughput">{t.modeThroughput}</Radio.Button>
                  <Radio.Button value="users">{t.modeUsers}</Radio.Button>
                  <Radio.Button value="responseTime">{t.modeResponseTime}</Radio.Button>
                </Radio.Group>
              </div>

              <div>
                <Text strong>{t.concurrentUsersLabel}</Text>
                <Text type="secondary" style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>
                  {t.concurrentUsersHelp}
                </Text>
                <InputNumber
                  style={fieldStyle}
                  min={0}
                  step={1}
                  value={concurrentUsers}
                  onChange={(v) => setConcurrentUsers(v === null ? '' : v)}
                  placeholder={t.concurrentUsersLabel}
                  disabled={mode === 'users'}
                />
              </div>

              {renderNumberInput(
                t.throughputLabel,
                t.throughputHelp,
                throughput,
                setThroughput,
                mode === 'throughput',
                throughputUnit,
                setThroughputUnit,
                throughputUnits
              )}

              {renderNumberInput(
                t.responseTimeLabel,
                t.responseTimeHelp,
                responseTime,
                setResponseTime,
                mode === 'responseTime',
                responseTimeUnit,
                setResponseTimeUnit,
                timeUnits
              )}

              {renderNumberInput(
                t.thinkTimeLabel,
                t.thinkTimeHelp,
                thinkTime,
                setThinkTime,
                false,
                thinkTimeUnit,
                setThinkTimeUnit,
                timeUnits
              )}

              <div>
                <Text strong>{t.requestsPerUserLabel}</Text>
                <Text type="secondary" style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>
                  {t.requestsPerUserHelp}
                </Text>
                <InputNumber
                  style={fieldStyle}
                  min={1}
                  step={1}
                  value={requestsPerUser}
                  onChange={(v) => setRequestsPerUser(v === null ? 1 : v)}
                />
              </div>

              <Space>
                <Button icon={<SyncOutlined />} onClick={clearAll}>
                  {t.clear}
                </Button>
              </Space>
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card style={{ height: '100%' }}>
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <div>
                <Text strong style={{ fontSize: 18 }}>
                  {t.equation}: <Text code>λ = N / (W + T)</Text>
                </Text>
                <Paragraph type="secondary" style={{ marginTop: 8, marginBottom: 0 }}>
                  {t.equationDesc}
                </Paragraph>
              </div>

              {!result.solved ? (
                <Alert
                  type="info"
                  showIcon
                  icon={<InfoCircleOutlined />}
                  message={t.needTwo}
                />
              ) : (
                <>
                  {display && (
                    <>
                      <Row gutter={[16, 16]}>
                        <Col xs={12}>
                          <Statistic
                            title={t.resultThroughput}
                            value={formatNumber(display.throughputDisplay.rps)}
                            suffix={t.perSecond}
                          />
                        </Col>
                        <Col xs={12}>
                          <Statistic
                            title={t.resultUsers}
                            value={formatNumber(display.concurrentUsers)}
                          />
                        </Col>
                        <Col xs={12}>
                          <Statistic
                            title={t.resultResponseTime}
                            value={formatNumber(display.responseTimeDisplay)}
                            suffix={responseTimeUnit}
                          />
                        </Col>
                        <Col xs={12}>
                          <Statistic
                            title={t.resultThinkTime}
                            value={formatNumber(display.thinkTimeDisplay)}
                            suffix={thinkTimeUnit}
                          />
                        </Col>
                        <Col xs={12}>
                          <Statistic
                            title={t.resultCycleTime}
                            value={formatNumber(fromMs(display.cycleMs, responseTimeUnit))}
                            suffix={responseTimeUnit}
                          />
                        </Col>
                        <Col xs={12}>
                          <Statistic
                            title={t.resultSessionDuration}
                            value={formatNumber(fromMs(display.sessionMs, responseTimeUnit))}
                            suffix={responseTimeUnit}
                          />
                        </Col>
                        <Col xs={12}>
                          <Statistic
                            title={t.resultUtilization}
                            value={formatNumber(display.utilization * 100)}
                            suffix="%"
                          />
                        </Col>
                        <Col xs={12}>
                          <Statistic
                            title={t.resultRequests}
                            value={formatNumber(display.totalRequests)}
                          />
                        </Col>
                      </Row>

                      <div>
                        <Text strong>{t.results}:</Text>
                        <div style={{ marginTop: 8 }}>
                          <Tag color="blue">{formatNumber(display.throughputDisplay.rpm)} {t.perMinute}</Tag>
                          <Tag color="blue">{formatNumber(display.throughputDisplay.rph)} {t.perHour}</Tag>
                          <Tag color="blue">{formatNumber(display.throughputDisplay.rpd)} {t.perDay}</Tag>
                        </div>
                      </div>

                      {result.results.consistent && (
                        <Alert type="success" showIcon message={t.stableYes} />
                      )}
                      {result.warnings.includes('negativeResponseTime') && (
                        <Alert type="warning" showIcon message={t.negativeResponseTime} />
                      )}
                    </>
                  )}
                </>
              )}

              <Alert
                type="info"
                showIcon
                icon={<CalculatorOutlined />}
                message={t.unitNote}
              />
            </Space>
          </Card>
        </Col>
      </Row>

      <Card style={{ marginTop: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Text strong>{t.presets}</Text>
          <Space wrap>
            {presets.map((preset) => (
              <Button key={preset.key} size="small" onClick={() => handlePreset(preset)}>
                {preset.label}
              </Button>
            ))}
          </Space>
          <div>
            {presets.map((preset) => {
              const active =
                (preset.concurrentUsers === null || Number(concurrentUsers) === preset.concurrentUsers) &&
                (preset.throughput === null || Number(throughput) === preset.throughput) &&
                Number(responseTime) === preset.responseTime &&
                responseTimeUnit === preset.responseTimeUnit &&
                Number(thinkTime) === preset.thinkTime &&
                thinkTimeUnit === preset.thinkTimeUnit
              if (!active) return null
              return (
                <Tag key={`desc-${preset.key}`} color="blue" style={{ marginTop: 8 }}>
                  {preset.desc[lang]}
                </Tag>
              )
            })}
          </div>
        </Space>
      </Card>

      <Collapse style={{ marginTop: 24 }}>
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
