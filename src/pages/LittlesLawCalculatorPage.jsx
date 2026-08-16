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

// Dados λ e W, encontre L
solveLittleLaw({ lambda: 100, w: 0.5 })
// { l: 50, lambda: 100, w: 0.5, solved: true }

// Dados L e W, encontre λ
solveLittleLaw({ l: 50, w: 0.5 })
// { l: 50, lambda: 100, w: 0.5, solved: true }

// Dados L e λ, encontre W
solveLittleLaw({ l: 50, lambda: 100 })
// { l: 50, lambda: 100, w: 0.5, solved: true }

// Valide a consistência dos três valores
solveLittleLaw({ l: 50, lambda: 100, w: 0.5 })
// { ..., solved: true, consistent: true, relativeError: 0 }
`

const translations = {
  pt: {
    title: 'Calculadora da Lei de Little',
    subtitle: 'L = λ × W — filas, capacidade e latência',
    intro: 'A Lei de Little relaciona o número médio de itens em um sistema (L), a taxa de chegada (λ) e o tempo médio de permanência (W). Preencha dois valores para descobrir o terceiro. É uma ferramenta clássica para estimar capacidade de APIs, filas de suporte, bancos de dados, logística e muito mais.',
    lLabel: 'L — Itens no sistema',
    lHelp: 'Número médio de itens em fila + em atendimento.',
    lambdaLabel: 'λ — Taxa de chegada',
    lambdaHelp: 'Itens que chegam por unidade de tempo (ex.: req/s, tickets/h).',
    wLabel: 'W — Tempo no sistema',
    wHelp: 'Tempo médio que um item permanece no sistema, incluindo fila e serviço.',
    unitLabel: 'Unidade de tempo de W',
    unitSeconds: 'segundos',
    unitMinutes: 'minutos',
    unitHours: 'horas',
    unitDays: 'dias',
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
    equation: 'Equação',
    stable: 'Sistema estável?',
    stableYes: 'Sim — λ × W está coerente com L.',
    stableNo: 'Verifique os valores: λ deve ser positivo e W não pode ser zero ao calcular λ.',
    consistentYes: 'Valores consistentes com L = λ × W.',
    consistentNo: 'Os três valores não satisfazem exatamente L = λ × W.',
    needTwo: 'Preencha pelo menos dois valores para resolver o terceiro.',
    unitNote: 'A unidade selecionada afeta apenas a exibição de W. λ deve usar a mesma unidade de tempo no denominador (ex.: se W está em segundos, λ deve ser itens/segundo).',
    sourceTitle: 'Motor de cálculo',
    sourceIntro: 'O motor é puro JavaScript client-side — nenhum dado sai do navegador.',
    legend: 'Legenda',
    legendL: 'L = itens em média no sistema',
    legendLambda: 'λ = taxa de chegada (itens / tempo)',
    legendW: 'W = tempo médio no sistema',
  },
  en: {
    title: "Little's Law Calculator",
    subtitle: 'L = λ × W — queues, capacity and latency',
    intro: "Little's Law relates the average number of items in a system (L), the arrival rate (λ) and the average time spent in the system (W). Fill in two values to find the third. It is a classic tool for estimating the capacity of APIs, support queues, databases, logistics and more.",
    lLabel: 'L — Items in system',
    lHelp: 'Average number of items waiting + being served.',
    lambdaLabel: 'λ — Arrival rate',
    lambdaHelp: 'Items arriving per unit of time (e.g. req/s, tickets/h).',
    wLabel: 'W — Time in system',
    wHelp: 'Average time an item stays in the system, including queue and service.',
    unitLabel: 'W time unit',
    unitSeconds: 'seconds',
    unitMinutes: 'minutes',
    unitHours: 'hours',
    unitDays: 'days',
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
    equation: 'Equation',
    stable: 'Stable system?',
    stableYes: 'Yes — λ × W is consistent with L.',
    stableNo: 'Check the values: λ must be positive and W cannot be zero when solving for λ.',
    consistentYes: 'Values consistent with L = λ × W.',
    consistentNo: 'The three values do not exactly satisfy L = λ × W.',
    needTwo: 'Fill at least two values to solve for the third.',
    unitNote: 'The selected unit affects only the display of W. λ must use the same time unit in the denominator (e.g. if W is in seconds, λ must be items/second).',
    sourceTitle: 'Calculation engine',
    sourceIntro: 'The engine is pure client-side JavaScript — no data leaves the browser.',
    legend: 'Legend',
    legendL: 'L = average items in the system',
    legendLambda: 'λ = arrival rate (items / time)',
    legendW: 'W = average time in the system',
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

    // Normaliza W para a unidade base (segundos) antes de calcular.
    const normalizedW = rawW === null ? null : rawW * unitMultiplier[unit]

    return { rawL, rawLambda, normalizedW }
  }, [l, lambda, w, unit])

  const result = useMemo(() => {
    return solveLittleLaw({
      l: inputs.rawL,
      lambda: inputs.rawLambda,
      w: inputs.normalizedW,
    })
  }, [inputs])

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

    return { displayL, displayLambda, displayW, displayWInUnit }
  }, [result, inputs, mode, unit])

  const handlePreset = (preset) => {
    setMode('auto')
    setL(preset.l)
    setLambda(preset.lambda)
    setW(preset.w)
    setUnit(preset.unit)
  }

  const clearAll = () => {
    setL('')
    setLambda('')
    setW('')
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
                  {t.equation}: <Text code>L = λ × W</Text>
                </Text>
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

                  {result.consistent !== undefined && (
                    <Alert
                      type={result.consistent ? 'success' : 'warning'}
                      showIcon
                      message={result.consistent ? t.consistentYes : t.consistentNo}
                    />
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
                Number(l) === preset.l &&
                Number(lambda) === preset.lambda &&
                Number(w) === preset.w &&
                unit === preset.unit
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
