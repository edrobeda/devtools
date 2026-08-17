import React, { useMemo, useState } from 'react'
import {
  Typography,
  Card,
  InputNumber,
  Space,
  Row,
  Col,
  Statistic,
  Alert,
  Collapse,
  Button,
  Select,
} from 'antd'
import {
  CalculatorOutlined,
  InfoCircleOutlined,
  SyncOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  MODELS,
  MODEL_LABELS,
  PRESETS,
  calculateQueueing,
  FORMULAS,
} from '../utils/queueingTheoryCalculator'

const { Title, Paragraph, Text } = Typography
const { Panel } = Collapse
const { Option } = Select

const sourceCode = `import { calculateQueueing, MODELS } from '../utils/queueingTheoryCalculator'

// M/M/1 — um servidor com chegadas e serviços exponenciais
calculateQueueing({ model: MODELS.MM1, lambda: 10, mu: 12 })
// { ok: true, rho: 0.8333, L: 5, Lq: 4.1667, W: 0.5, Wq: 0.4167, ... }

// M/M/c — múltiplos servidores (Erlang C)
calculateQueueing({ model: MODELS.MMc, lambda: 120, mu: 30, servers: 5 })
// { ok: true, rho: 0.8, Pw: 0.5541, Lq: 2.2162, L: 6.2162, ... }

// M/D/1 — serviço determinístico (variabilidade mínima)
calculateQueueing({ model: MODELS.MD1, lambda: 8, mu: 10 })
// { ok: true, rho: 0.8, Lq: 1.6, L: 2.4, W: 0.3, ... }
`

const translations = {
  pt: {
    title: 'Calculadora de Teoria das Filas',
    subtitle: 'M/M/1, M/M/c e M/D/1 — filas, utilização e tempo de espera',
    intro: 'Modele filas de atendimento com os modelos clássicos da teoria das filas. Escolha o modelo, informe a taxa de chegada (λ), a taxa de serviço (μ) e, no caso M/M/c, o número de servidores (c). A ferramenta calcula utilização, probabilidade de espera, número médio de itens no sistema e na fila, e os tempos médios de permanência.',
    modelLabel: 'Modelo',
    lambdaLabel: 'λ — Taxa de chegada',
    lambdaHelp: 'Itens que chegam por unidade de tempo (ex.: req/s, clientes/min).',
    muLabel: 'μ — Taxa de serviço',
    muHelp: 'Itens atendidos por servidor por unidade de tempo.',
    serversLabel: 'c — Servidores',
    serversHelp: 'Apenas para M/M/c.',
    presets: 'Cenários rápidos',
    resultUtilization: 'Utilização (ρ)',
    resultIdle: 'Prob. de sistema ocioso (P₀)',
    resultWait: 'Prob. de esperar (Erlang C)',
    resultL: 'Itens no sistema (L)',
    resultLq: 'Itens na fila (Lq)',
    resultW: 'Tempo no sistema (W)',
    resultWq: 'Tempo na fila (Wq)',
    resultThroughput: 'Throughput efetivo',
    stability: 'Estabilidade',
    stable: 'Sistema estável — ρ < 1.',
    unstable: 'Sistema instável — ρ ≥ 1. Aumente μ, c ou reduza λ.',
    invalid: 'Preencha valores válidos e positivos.',
    chartTitle: 'Número médio no sistema (L) × utilização (ρ)',
    chartX: 'ρ (utilização)',
    chartY: 'L',
    sourceTitle: 'Motor de cálculo',
    sourceIntro: 'O motor é puro JavaScript client-side — nenhum dado sai do navegador.',
    formulasTitle: 'Fórmulas',
    note: 'λ e μ devem usar a mesma unidade de tempo. O resultado W e Wq será exibido na unidade mais conveniente (ms, s, min).',
    legendRho: 'ρ = utilização média dos servidores',
    legendL: 'L = itens em média no sistema (fila + serviço)',
    legendLq: 'Lq = itens em média apenas na fila',
    legendW: 'W = tempo médio no sistema',
    legendWq: 'Wq = tempo médio apenas na fila',
    legendPw: 'Pw = probabilidade de um cliente ter de esperar (Erlang C)',
  },
  en: {
    title: 'Queueing Theory Calculator',
    subtitle: 'M/M/1, M/M/c and M/D/1 — queues, utilization and waiting time',
    intro: 'Model service queues using classic queueing theory. Choose the model, enter the arrival rate (λ), service rate (μ) and, for M/M/c, the number of servers (c). The tool calculates utilization, probability of waiting, average number of items in the system and in the queue, and the average times spent.',
    modelLabel: 'Model',
    lambdaLabel: 'λ — Arrival rate',
    lambdaHelp: 'Items arriving per unit of time (e.g. req/s, customers/min).',
    muLabel: 'μ — Service rate',
    muHelp: 'Items served per server per unit of time.',
    serversLabel: 'c — Servers',
    serversHelp: 'Only for M/M/c.',
    presets: 'Quick scenarios',
    resultUtilization: 'Utilization (ρ)',
    resultIdle: 'Idle probability (P₀)',
    resultWait: 'Wait probability (Erlang C)',
    resultL: 'Items in system (L)',
    resultLq: 'Items in queue (Lq)',
    resultW: 'Time in system (W)',
    resultWq: 'Time in queue (Wq)',
    resultThroughput: 'Effective throughput',
    stability: 'Stability',
    stable: 'Stable system — ρ < 1.',
    unstable: 'Unstable system — ρ ≥ 1. Increase μ, c or reduce λ.',
    invalid: 'Fill in valid positive values.',
    chartTitle: 'Average items in system (L) × utilization (ρ)',
    chartX: 'ρ (utilization)',
    chartY: 'L',
    sourceTitle: 'Calculation engine',
    sourceIntro: 'The engine is pure client-side JavaScript — no data leaves the browser.',
    formulasTitle: 'Formulas',
    note: 'λ and μ must use the same time unit. W and Wq are shown in the most convenient unit (ms, s, min).',
    legendRho: 'ρ = average server utilization',
    legendL: 'L = average items in the system (queue + service)',
    legendLq: 'Lq = average items waiting in queue',
    legendW: 'W = average time in the system',
    legendWq: 'Wq = average time waiting in queue',
    legendPw: 'Pw = probability a customer has to wait (Erlang C)',
  },
}

const modelOptions = [MODELS.MM1, MODELS.MMc, MODELS.MD1]

function buildChartSeries(model, lambda, mu, servers) {
  const points = []
  for (let i = 1; i <= 95; i++) {
    const rhoTarget = i / 100
    let params
    if (model === MODELS.MMc) {
      const targetLambda = rhoTarget * servers * mu
      if (targetLambda <= 0) continue
      params = { model, lambda: targetLambda, mu, servers }
    } else {
      const targetLambda = rhoTarget * mu
      if (targetLambda <= 0) continue
      params = { model, lambda: targetLambda, mu }
    }
    const r = calculateQueueing(params)
    if (r.ok) points.push({ rho: rhoTarget, L: r.L })
  }
  return points
}

export default function QueueingTheoryCalculatorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [model, setModel] = useState(MODELS.MM1)
  const [lambda, setLambda] = useState(10)
  const [mu, setMu] = useState(12)
  const [servers, setServers] = useState(2)

  const inputs = useMemo(
    () => ({
      model,
      lambda: Number.isFinite(Number(lambda)) ? Number(lambda) : 0,
      mu: Number.isFinite(Number(mu)) ? Number(mu) : 0,
      servers: Number.isFinite(Number(servers)) ? Math.max(1, Math.floor(Number(servers))) : 1,
    }),
    [model, lambda, mu, servers]
  )

  const result = useMemo(() => calculateQueueing(inputs), [inputs])

  const series = useMemo(() => {
    if (!result.ok) return []
    return buildChartSeries(model, inputs.lambda, inputs.mu, inputs.servers)
  }, [result.ok, model, inputs.lambda, inputs.mu, inputs.servers])

  const handlePreset = (preset) => {
    setModel(model)
    setLambda(preset.lambda)
    setMu(preset.mu)
    setServers(preset.servers)
  }

  const clearAll = () => {
    setLambda('')
    setMu('')
    setServers(2)
  }

  const fieldStyle = { width: '100%' }

  const maxL = useMemo(() => {
    if (series.length === 0) return 0
    return Math.max(...series.map((p) => p.L))
  }, [series])

  return (
    <div style={{ padding: 24, maxWidth: 960, margin: '0 auto' }}>
      <Title level={2}>
        <CalculatorOutlined style={{ marginRight: 12 }} />
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
                <Text strong>{t.modelLabel}</Text>
                <Select
                  style={fieldStyle}
                  value={model}
                  onChange={(v) => setModel(v)}
                >
                  {modelOptions.map((m) => (
                    <Option key={m} value={m}>
                      {MODEL_LABELS[m][lang]}
                    </Option>
                  ))}
                </Select>
              </div>

              <div>
                <Text strong>{t.lambdaLabel}</Text>
                <Text type="secondary" style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>
                  {t.lambdaHelp}
                </Text>
                <InputNumber
                  style={fieldStyle}
                  min={0.001}
                  step={1}
                  value={lambda}
                  onChange={(v) => setLambda(v === null ? '' : v)}
                  placeholder="λ"
                />
              </div>

              <div>
                <Text strong>{t.muLabel}</Text>
                <Text type="secondary" style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>
                  {t.muHelp}
                </Text>
                <InputNumber
                  style={fieldStyle}
                  min={0.001}
                  step={1}
                  value={mu}
                  onChange={(v) => setMu(v === null ? '' : v)}
                  placeholder="μ"
                />
              </div>

              {model === MODELS.MMc && (
                <div>
                  <Text strong>{t.serversLabel}</Text>
                  <Text type="secondary" style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>
                    {t.serversHelp}
                  </Text>
                  <InputNumber
                    style={fieldStyle}
                    min={1}
                    max={100}
                    step={1}
                    value={servers}
                    onChange={(v) => setServers(v === null ? '' : v)}
                    placeholder="c"
                  />
                </div>
              )}

              <Space>
                <Button icon={<SyncOutlined />} onClick={clearAll}>
                  {lang === 'pt' ? 'Limpar' : 'Clear'}
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
                  {t.stability}
                </Text>
              </div>

              {!result.ok ? (
                <Alert
                  type="error"
                  showIcon
                  icon={<InfoCircleOutlined />}
                  message={result.unstable ? t.unstable : t.invalid}
                  description={
                    result.rho !== undefined
                      ? `ρ = ${result.rho}`
                      : undefined
                  }
                />
              ) : (
                <Alert type="success" showIcon message={t.stable} />
              )}

              {result.ok && (
                <>
                  <Row gutter={[12, 12]}>
                    <Col span={12}>
                      <Statistic title={t.resultUtilization} value={result.rho} suffix={` (${result.rhoPercent}%)`} />
                    </Col>
                    <Col span={12}>
                      <Statistic title={t.resultIdle} value={result.P0} />
                    </Col>
                    {model === MODELS.MMc && (
                      <Col span={12}>
                        <Statistic title={t.resultWait} value={result.Pw} />
                      </Col>
                    )}
                    <Col span={12}>
                      <Statistic title={t.resultThroughput} value={result.lambda} suffix="/s" />
                    </Col>
                  </Row>

                  <Row gutter={[12, 12]}>
                    <Col span={12}>
                      <Card size="small">
                        <Statistic title={t.resultL} value={result.L} />
                      </Card>
                    </Col>
                    <Col span={12}>
                      <Card size="small">
                        <Statistic title={t.resultLq} value={result.Lq} />
                      </Card>
                    </Col>
                    <Col span={12}>
                      <Card size="small">
                        <Statistic title={t.resultW} value={result.Wformatted} />
                      </Card>
                    </Col>
                    <Col span={12}>
                      <Card size="small">
                        <Statistic title={t.resultWq} value={result.WqFormatted} />
                      </Card>
                    </Col>
                  </Row>
                </>
              )}
            </Space>
          </Card>
        </Col>
      </Row>

      <Card style={{ marginTop: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Text strong>{t.presets}</Text>
          <Space wrap>
            {(PRESETS[model] || []).map((preset) => (
              <Button key={preset.key} size="small" onClick={() => handlePreset(preset)}>
                {preset.label[lang]}
              </Button>
            ))}
          </Space>
        </Space>
      </Card>

      {result.ok && series.length > 0 && (
        <Card style={{ marginTop: 16 }}>
          <Text strong>{t.chartTitle}</Text>
          <svg viewBox="0 0 500 220" width="100%" height="240" role="img" aria-label={t.chartTitle}>
            {/* axes */}
            <line x1="40" y1="190" x2="480" y2="190" stroke="#d9d9d9" strokeWidth={2} />
            <line x1="40" y1="190" x2="40" y2="20" stroke="#d9d9d9" strokeWidth={2} />
            <text x="250" y="212" textAnchor="middle" fill="#8c8c8c" fontSize="12">
              {t.chartX}
            </text>
            <text x="14" y="110" textAnchor="middle" fill="#8c8c8c" fontSize="12" transform="rotate(-90 14 110)">
              {t.chartY}
            </text>

            {/* x ticks */}
            {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
              const x = 40 + tick * 400
              return (
                <g key={tick}>
                  <line x1={x} y1="190" x2={x} y2="195" stroke="#d9d9d9" />
                  <text x={x} y="208" textAnchor="middle" fill="#8c8c8c" fontSize="10">
                    {tick}
                  </text>
                </g>
              )
            })}

            {/* curve */}
            <polyline
              fill="none"
              stroke="#1677ff"
              strokeWidth={2}
              points={series
                .map((p) => {
                  const x = 40 + p.rho * 400
                  const y = 190 - (maxL > 0 ? (p.L / maxL) * 150 : 0)
                  return `${x},${y}`
                })
                .join(' ')}
            />

            {/* current point */}
            {result.ok && (
              <>
                <circle
                  cx={40 + result.rho * 400}
                  cy={190 - (maxL > 0 ? (result.L / maxL) * 150 : 0)}
                  r={5}
                  fill="#faad14"
                  stroke="#fff"
                  strokeWidth={2}
                />
                <text
                  x={40 + result.rho * 400 + 10}
                  y={190 - (maxL > 0 ? (result.L / maxL) * 150 : 0) - 8}
                  fill="#faad14"
                  fontSize="11"
                >
                  L={result.L}, ρ={result.rho}
                </text>
              </>
            )}
          </svg>
        </Card>
      )}

      <Alert type="info" showIcon icon={<InfoCircleOutlined />} message={t.note} style={{ marginTop: 16 }} />

      <Collapse style={{ marginTop: 24 }}>
        <Panel header={t.formulasTitle} key="formulas">
          <pre style={{ background: '#f6ffed', padding: 16, borderRadius: 8, overflow: 'auto' }}>
            <code>{FORMULAS[model]}</code>
          </pre>
        </Panel>
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
