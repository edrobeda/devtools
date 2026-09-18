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
  solveLittleLaw,
  formatNumber,
  getPresets,
} from '../utils/littlesLawCalculator'

const { Title, Paragraph, Text } = Typography
const { Panel } = Collapse

const sourceCode = `import { solveLittleLaw } from '../utils/littlesLawCalculator'

// Lei de Little: L = λ × W
// Com think time (T) > 0 o modelo vira λ = L / (W + T): L vira usuários
// concorrentes, W o tempo de resposta e T o "think time".

// Dados λ e W, encontre L
solveLittleLaw({ lambda: 100, w: 0.5 })
// { l: 50, lambda: 100, w: 0.5, solved: true }

// Dados L e W, encontre λ
solveLittleLaw({ l: 50, w: 0.5 })
// { l: 50, lambda: 100, w: 0.5, solved: true }

// Dados L e λ, encontre W
solveLittleLaw({ l: 50, lambda: 100 })
// { l: 50, lambda: 100, w: 0.5, solved: true }

// Modo concorrência: think time e W na mesma unidade base.
solveLittleLaw({ lambda: 1000, w: 0.15, thinkTime: 0.05, requestsPerUser: 20 })
// l ≈ 200 (usuários concorrentes), cycleTime = 0.2, utilization = 0.75,
// sessionDuration = 4

// Valide a consistência dos três valores
solveLittleLaw({ l: 50, lambda: 100, w: 0.5 })
// { ..., solved: true, consistent: true, relativeError: 0 }
`

const translations = {
  pt: {
    title: 'Calculadora da Lei de Little',
    subtitle: 'L = λ × W — filas, capacidade, latência e concorrência',
    intro: 'A Lei de Little relaciona o número médio de itens em um sistema (L), a taxa de chegada (λ) e o tempo médio de permanência (W). Preencha dois valores para descobrir o terceiro. É uma ferramenta clássica para estimar capacidade de APIs, filas de suporte, bancos de dados, logística e muito mais. Preencha também o think time (T) para ligar o modelo à concorrência de aplicações web (λ = L / (W + T)).',
    lLabel: 'L — Itens no sistema',
    lHelp: 'Número médio de itens em fila + em atendimento. Com think time > 0, vira usuários concorrentes.',
    lambdaLabel: 'λ — Taxa de chegada',
    lambdaHelp: 'Itens que chegam por unidade de tempo (ex.: req/s, tickets/h).',
    wLabel: 'W — Tempo no sistema',
    wHelp: 'Tempo médio que um item permanece no sistema, incluindo fila e serviço. Com think time > 0, é o tempo médio de resposta.',
    unitLabel: 'Unidade de tempo de W e T',
    unitSeconds: 'segundos',
    unitMinutes: 'minutos',
    unitHours: 'horas',
    unitDays: 'dias',
    thinkTimeLabel: 'Think time (T) — opcional',
    thinkTimeHelp: 'Tempo de "pensamento" entre requisições (0 = Lei de Little clássica; > 0 liga o modo concorrência web).',
    requestsPerUserLabel: 'Requisições por usuário',
    requestsPerUserHelp: 'Quantas requisições um usuário faz em uma sessão (usado para duração total).',
    presets: 'Exemplos de um clique',
    solveMode: 'Modo de cálculo',
    solveModeAuto: 'Auto (preencha 2 campos)',
    solveModeL: 'Calcular L',
    solveModeLambda: 'Calcular λ',
    solveModeW: 'Calcular W',
    resultL: 'Itens no sistema (L)',
    resultLambda: 'Taxa de chegada (λ)',
    resultW: 'Tempo no sistema (W)',
    resultWInUnit: 'Tempo no sistema (na unidade escolhida)',
    resultCycleTime: 'Ciclo por requisição',
    resultSessionDuration: 'Duração da sessão',
    resultUtilization: 'Utilização',
    equation: 'Equação',
    equationClassic: 'L = λ × W',
    equationWeb: 'λ = L / (W + T)',
    equationClassicDesc: 'Relação clássica entre itens no sistema, taxa de chegada e tempo de permanência.',
    equationWebDesc: 'Modo concorrência: cada usuário gera uma requisição a cada ciclo resposta + think time.',
    stable: 'Sistema estável?',
    stableYes: 'Sim — λ × W está coerente com L.',
    stableNo: 'Verifique os valores: λ deve ser positivo e W não pode ser zero ao calcular λ.',
    consistentYes: 'Valores consistentes com L = λ × W.',
    consistentNo: 'Os três valores não satisfazem exatamente L = λ × W.',
    needTwo: 'Preencha pelo menos dois valores para resolver o terceiro.',
    negativeResidenceTime: 'Atenção: essa combinação exigiria um W negativo; o resultado foi ajustado para zero. Aumente L ou reduza λ.',
    unitNote: 'A unidade selecionada afeta a exibição de W e T. λ deve usar a mesma unidade de tempo no denominador (ex.: se W está em segundos, λ deve ser itens/segundo).',
    sourceTitle: 'Motor de cálculo',
    sourceIntro: 'O motor é puro JavaScript client-side — nenhum dado sai do navegador.',
    legend: 'Legenda',
    legendL: 'L = itens em média no sistema',
    legendLambda: 'λ = taxa de chegada (itens / tempo)',
    legendW: 'W = tempo médio no sistema',
    perSecond: '/s',
    perMinute: '/min',
    perHour: '/h',
    perDay: '/dia',
  },
  en: {
    title: "Little's Law Calculator",
    subtitle: 'L = λ × W — queues, capacity, latency and concurrency',
    intro: "Little's Law relates the average number of items in a system (L), the arrival rate (λ) and the average time spent in the system (W). Fill in two values to find the third. It is a classic tool for estimating the capacity of APIs, support queues, databases, logistics and more. Also fill in the think time (T) to connect the model to web concurrency (λ = L / (W + T)).",
    lLabel: 'L — Items in system',
    lHelp: 'Average number of items waiting + being served. With think time > 0, becomes concurrent users.',
    lambdaLabel: 'λ — Arrival rate',
    lambdaHelp: 'Items arriving per unit of time (e.g. req/s, tickets/h).',
    wLabel: 'W — Time in system',
    wHelp: 'Average time an item stays in the system, including queue and service. With think time > 0, becomes average response time.',
    unitLabel: 'Time unit for W and T',
    unitSeconds: 'seconds',
    unitMinutes: 'minutes',
    unitHours: 'hours',
    unitDays: 'days',
    thinkTimeLabel: 'Think time (T) — optional',
    thinkTimeHelp: 'Time "thinking" between requests (0 = classic Little\'s Law; > 0 turns on web-concurrency mode).',
    requestsPerUserLabel: 'Requests per user',
    requestsPerUserHelp: 'How many requests a user makes in one session (used for total session duration).',
    presets: 'One-click examples',
    solveMode: 'Calculation mode',
    solveModeAuto: 'Auto (fill 2 fields)',
    solveModeL: 'Calculate L',
    solveModeLambda: 'Calculate λ',
    solveModeW: 'Calculate W',
    resultL: 'Items in system (L)',
    resultLambda: 'Arrival rate (λ)',
    resultW: 'Time in system (W)',
    resultWInUnit: 'Time in system (in chosen unit)',
    resultCycleTime: 'Cycle per request',
    resultSessionDuration: 'Session duration',
    resultUtilization: 'Utilization',
    equation: 'Equation',
    equationClassic: 'L = λ × W',
    equationWeb: 'λ = L / (W + T)',
    equationClassicDesc: 'Classic relation between items in the system, arrival rate and residence time.',
    equationWebDesc: 'Concurrency mode: each user generates one request every response + think time cycle.',
    stable: 'Stable system?',
    stableYes: 'Yes — λ × W is consistent with L.',
    stableNo: 'Check the values: λ must be positive and W cannot be zero when solving for λ.',
    consistentYes: 'Values consistent with L = λ × W.',
    consistentNo: 'The three values do not exactly satisfy L = λ × W.',
    needTwo: 'Fill at least two values to solve for the third.',
    negativeResidenceTime: 'Warning: this combination would require a negative W; result adjusted to zero. Increase L or lower λ.',
    unitNote: 'The selected unit affects only the display of W and T. λ must use the same time unit in the denominator (e.g. if W is in seconds, λ must be items/second).',
    sourceTitle: 'Calculation engine',
    sourceIntro: 'The engine is pure client-side JavaScript — no data leaves the browser.',
    legend: 'Legend',
    legendL: 'L = average items in the system',
    legendLambda: 'λ = arrival rate (items / time)',
    legendW: 'W = average time in the system',
    perSecond: '/s',
    perMinute: '/min',
    perHour: '/h',
    perDay: '/day',
  },
}

const units = [
  { value: 's', label: { pt: 'segundos', en: 'seconds' } },
  { value: 'min', label: { pt: 'minutos', en: 'minutes' } },
  { value: 'h', label: { pt: 'horas', en: 'hours' } },
  { value: 'd', label: { pt: 'dias', en: 'days' } },
]

const unitMultiplier = {
  s: 1,
  min: 60,
  h: 3600,
  d: 86400,
}

export default function LittlesLawCalculatorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [l, setL] = useState('')
  const [lambda, setLambda] = useState(100)
  const [w, setW] = useState(0.5)
  const [thinkTime, setThinkTime] = useState('')
  const [requestsPerUser, setRequestsPerUser] = useState(1)
  const [unit, setUnit] = useState('s')
  const [mode, setMode] = useState('auto')

  const presets = useMemo(() => getPresets(lang), [lang])

  const inputs = useMemo(() => {
    const parse = (v) => {
      if (v === '' || v === undefined || v === null) return null
      const n = Number(v)
      return Number.isNaN(n) ? null : n
    }

    const rawL = parse(l)
    const rawLambda = parse(lambda)
    const rawW = parse(w)
    const rawT = parse(thinkTime)
    const rawR = parse(requestsPerUser)

    // Normaliza W e T para a unidade base (segundos) antes de calcular.
    const normalizedW = rawW === null ? null : rawW * unitMultiplier[unit]
    const normalizedT = rawT === null ? null : rawT * unitMultiplier[unit]

    return { rawL, rawLambda, normalizedW, normalizedT, rawR }
  }, [l, lambda, w, thinkTime, requestsPerUser, unit])

  const result = useMemo(() => {
    return solveLittleLaw({
      l: inputs.rawL,
      lambda: inputs.rawLambda,
      w: inputs.normalizedW,
      thinkTime: inputs.normalizedT,
      requestsPerUser: inputs.rawR,
    })
  }, [inputs])

  const webMode = result.solved && result.thinkTime > 0

  const displayResult = useMemo(() => {
    if (!result.solved) return null

    let displayL = result.l
    let displayLambda = result.lambda
    let displayW = result.w

    // Se estamos no modo manual de calcular um campo, mantemos os outros
    // exatamente como o usuário digitou para evitar oscilação de exibição.
    if (mode === 'L' && inputs.rawL === null) {
      displayL = result.l
    }
    if (mode === 'lambda' && inputs.rawLambda === null) {
      displayLambda = result.lambda
    }
    if (mode === 'W' && inputs.rawW === null) {
      displayW = result.w
    }

    // Converte W da base (s) para a unidade escolhida na exibição.
    const displayWInUnit = displayW === null ? null : displayW / unitMultiplier[unit]

    const cycleInUnit = result.cycleTime === undefined ? null : result.cycleTime / unitMultiplier[unit]
    const sessionInUnit = result.sessionDuration === undefined ? null : result.sessionDuration / unitMultiplier[unit]
    const utilizationPct = result.utilization === undefined ? null : result.utilization * 100

    return { displayL, displayLambda, displayW, displayWInUnit, cycleInUnit, sessionInUnit, utilizationPct }
  }, [result, inputs, mode, unit])

  const handlePreset = (preset) => {
    setMode('auto')
    setL(preset.l)
    setLambda(preset.lambda)
    setW(preset.w)
    setUnit(preset.unit)
    setThinkTime(preset.thinkTime)
    setRequestsPerUser(preset.requestsPerUser)
  }

  const clearAll = () => {
    setL('')
    setLambda('')
    setW('')
    setThinkTime('')
    setRequestsPerUser(1)
    setMode('auto')
  }

  const renderResultValue = (label, value, suffix = '') => (
    <Card size="small" style={{ marginBottom: 12 }}>
      <Statistic title={label} value={formatNumber(value)} suffix={suffix} />
    </Card>
  )

  const fieldStyle = { width: '100%' }

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
                <Text strong>{t.solveMode}</Text>
                <Radio.Group
                  value={mode}
                  onChange={(e) => setMode(e.target.value)}
                  style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8 }}
                >
                  <Radio.Button value="auto">{t.solveModeAuto}</Radio.Button>
                  <Radio.Button value="L">{t.solveModeL}</Radio.Button>
                  <Radio.Button value="lambda">{t.solveModeLambda}</Radio.Button>
                  <Radio.Button value="W">{t.solveModeW}</Radio.Button>
                </Radio.Group>
              </div>

              <div>
                <Text strong>{t.lLabel}</Text>
                <Text type="secondary" style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>
                  {t.lHelp}
                </Text>
                <InputNumber
                  style={fieldStyle}
                  min={0}
                  step={1}
                  value={l}
                  onChange={(v) => setL(v === null ? '' : v)}
                  placeholder="L"
                  disabled={mode === 'L'}
                />
              </div>

              <div>
                <Text strong>{t.lambdaLabel}</Text>
                <Text type="secondary" style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>
                  {t.lambdaHelp}
                </Text>
                <InputNumber
                  style={fieldStyle}
                  min={0}
                  step={1}
                  value={lambda}
                  onChange={(v) => setLambda(v === null ? '' : v)}
                  placeholder="λ"
                  disabled={mode === 'lambda'}
                />
              </div>

              <div>
                <Text strong>{t.wLabel}</Text>
                <Text type="secondary" style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>
                  {t.wHelp}
                </Text>
                <Row gutter={8}>
                  <Col flex="auto">
                    <InputNumber
                      style={fieldStyle}
                      min={0}
                      step={0.1}
                      value={w}
                      onChange={(v) => setW(v === null ? '' : v)}
                      placeholder="W"
                      disabled={mode === 'W'}
                    />
                  </Col>
                  <Col style={{ width: 140 }}>
                    <Select
                      style={fieldStyle}
                      value={unit}
                      onChange={(v) => setUnit(v)}
                      options={units.map((u) => ({ value: u.value, label: u.label[lang] }))}
                    />
                  </Col>
                </Row>
              </div>

              <div>
                <Text strong>{t.thinkTimeLabel}</Text>
                <Text type="secondary" style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>
                  {t.thinkTimeHelp}
                </Text>
                <Row gutter={8}>
                  <Col flex="auto">
                    <InputNumber
                      style={fieldStyle}
                      min={0}
                      step={0.05}
                      value={thinkTime}
                      onChange={(v) => setThinkTime(v === null ? '' : v)}
                      placeholder="T"
                    />
                  </Col>
                  <Col style={{ width: 140 }}>
                    <Select
                      style={fieldStyle}
                      value={unit}
                      onChange={(v) => setUnit(v)}
                      options={units.map((u) => ({ value: u.value, label: u.label[lang] }))}
                    />
                  </Col>
                </Row>
              </div>

              {Number(thinkTime) > 0 && (
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
                  {t.equation}: <Text code>{webMode ? t.equationWeb : t.equationClassic}</Text>
                </Text>
                <Paragraph type="secondary" style={{ marginTop: 8, marginBottom: 0 }}>
                  {webMode ? t.equationWebDesc : t.equationClassicDesc}
                </Paragraph>
              </div>

              {!result.solved ? (
                <Alert type="info" showIcon icon={<InfoCircleOutlined />} message={t.needTwo} />
              ) : (
                <>
                  {result.l !== null &&
                    (mode === 'auto' || mode === 'L') &&
                    renderResultValue(t.resultL, displayResult?.displayL)}
                  {result.lambda !== null &&
                    (mode === 'auto' || mode === 'lambda') &&
                    renderResultValue(
                      t.resultLambda,
                      displayResult?.displayLambda,
                      lang === 'pt' ? ' itens/unid.' : ' items/unit'
                    )}
                  {result.w !== null &&
                    (mode === 'auto' || mode === 'W') &&
                    renderResultValue(
                      t.resultWInUnit,
                      displayResult?.displayWInUnit,
                      ` ${units.find((u) => u.value === unit)?.label[lang]}`
                    )}

                  {webMode && (
                    <>
                      <Row gutter={[12, 12]}>
                        <Col xs={8}>
                          <Statistic
                            title={t.resultCycleTime}
                            value={formatNumber(displayResult?.cycleInUnit)}
                            suffix={unit}
                          />
                        </Col>
                        <Col xs={8}>
                          <Statistic
                            title={t.resultSessionDuration}
                            value={formatNumber(displayResult?.sessionInUnit)}
                            suffix={unit}
                          />
                        </Col>
                        <Col xs={8}>
                          <Statistic
                            title={t.resultUtilization}
                            value={formatNumber(displayResult?.utilizationPct)}
                            suffix="%"
                          />
                        </Col>
                      </Row>
                      <div>
                        <Tag color="blue">{formatNumber(displayResult?.displayLambda * 60)} {t.perMinute}</Tag>
                        <Tag color="blue">{formatNumber(displayResult?.displayLambda * 3600)} {t.perHour}</Tag>
                        <Tag color="blue">{formatNumber(displayResult?.displayLambda * 86400)} {t.perDay}</Tag>
                      </div>
                    </>
                  )}

                  {result.consistent !== undefined && (
                    <Alert
                      type={result.consistent ? 'success' : 'warning'}
                      showIcon
                      message={result.consistent ? t.consistentYes : t.consistentNo}
                    />
                  )}
                  {result.warnings?.includes('negativeResidenceTime') && (
                    <Alert type="warning" showIcon icon={<ThunderboltOutlined />} message={t.negativeResidenceTime} />
                  )}
                </>
              )}

              <div>
                <Text strong>{t.legend}</Text>
                <ul style={{ paddingLeft: 18, marginBottom: 0 }}>
                  <li><Text type="secondary">{t.legendL}</Text></li>
                  <li><Text type="secondary">{t.legendLambda}</Text></li>
                  <li><Text type="secondary">{t.legendW}</Text></li>
                </ul>
              </div>
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
                (preset.l === null || Number(l) === preset.l) &&
                (preset.lambda === null || Number(lambda) === preset.lambda) &&
                Number(w) === preset.w &&
                unit === preset.unit &&
                (preset.thinkTime === 0 || Number(thinkTime) === preset.thinkTime) &&
                Number(requestsPerUser) === preset.requestsPerUser
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

      <Alert
        type="info"
        showIcon
        icon={<InfoCircleOutlined />}
        message={t.unitNote}
        style={{ marginTop: 16 }}
      />

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