import React, { useMemo, useState } from 'react'
import {
  Typography,
  Card,
  InputNumber,
  Space,
  Collapse,
  Row,
  Col,
  Statistic,
  Tag,
  Button,
  Divider,
  Alert,
  Radio,
} from 'antd'
import { ExperimentOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  calculateAbTest,
  proportionConfidenceInterval,
  formatPercent,
  formatNumber,
  PRESETS,
} from '../utils/abTestCalculator'

const { Title, Paragraph, Text } = Typography
const { Panel } = Collapse

const sourceCode = `import { calculateAbTest, formatPercent } from '../utils/abTestCalculator'

const result = calculateAbTest(
  10000, 500,   // controle: visitantes, conversoes
  10000, 580,   // variante: visitantes, conversoes
  0.95          // nivel de confianca
)

console.log(result.pValue)                          // 0.0123
console.log(formatPercent(result.relativeUplift))   // +16.00%
console.log(result.winner)                          // 'variant'
`

const translations = {
  pt: {
    title: 'Calculadora de Teste A/B',
    intro: 'Calcule a significancia estatistica entre uma variante e um controle. Informe visitantes e conversoes, escolha o nivel de confianca e veja taxas, uplift, intervalos de confianca, z-score, p-value e qual versao vence.',
    control: 'Controle',
    variant: 'Variante',
    visitors: 'Visitantes',
    conversions: 'Conversoes',
    confidence: 'Nivel de confianca',
    confidence90: '90%',
    confidence95: '95%',
    confidence99: '99%',
    scenarios: 'Cenarios rapidos',
    rate: 'Taxa de conversao',
    ci: 'Intervalo de confianca',
    difference: 'Diferenca absoluta',
    relativeUplift: 'Uplift relativo',
    zScore: 'Z-score',
    pValue: 'P-value',
    decision: 'Decisao',
    winnerVariant: 'Variante vence',
    winnerControl: 'Controle vence',
    inconclusive: 'Inconclusivo',
    significantHint: 'Diferenca estatisticamente significativa ao nivel de confianca escolhido.',
    notSignificantHint: 'Diferenca nao e estatisticamente significativa — considere aumentar a amostra.',
    invalidData: 'Verifique os valores: visitantes > 0 e conversoes entre 0 e visitantes.',
    chartTitle: 'Comparativo visual',
    chartControl: 'Controle',
    chartVariant: 'Variante',
    sourceTitle: 'Motor de calculo',
    sourceIntro: 'O motor e puro JavaScript client-side e nao envia dados para lugar nenhum.',
  },
  en: {
    title: 'A/B Test Calculator',
    intro: 'Calculate statistical significance between a variant and a control. Enter visitors and conversions, choose the confidence level, and see conversion rates, uplift, confidence intervals, z-score, p-value and which version wins.',
    control: 'Control',
    variant: 'Variant',
    visitors: 'Visitors',
    conversions: 'Conversions',
    confidence: 'Confidence level',
    confidence90: '90%',
    confidence95: '95%',
    confidence99: '99%',
    scenarios: 'Quick scenarios',
    rate: 'Conversion rate',
    ci: 'Confidence interval',
    difference: 'Absolute difference',
    relativeUplift: 'Relative uplift',
    zScore: 'Z-score',
    pValue: 'P-value',
    decision: 'Decision',
    winnerVariant: 'Variant wins',
    winnerControl: 'Control wins',
    inconclusive: 'Inconclusive',
    significantHint: 'The difference is statistically significant at the chosen confidence level.',
    notSignificantHint: 'The difference is not statistically significant — consider increasing the sample size.',
    invalidData: 'Check the inputs: visitors > 0 and conversions between 0 and visitors.',
    chartTitle: 'Visual comparison',
    chartControl: 'Control',
    chartVariant: 'Variant',
    sourceTitle: 'Calculation engine',
    sourceIntro: 'The engine is pure client-side JavaScript and does not send data anywhere.',
  },
}

export default function AbTestCalculatorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const presets = PRESETS[lang]

  const [cv, setCv] = useState(10000)
  const [cc, setCc] = useState(500)
  const [vv, setVv] = useState(10000)
  const [vc, setVc] = useState(580)
  const [level, setLevel] = useState(0.95)

  const result = useMemo(
    () => calculateAbTest(cv, cc, vv, vc, level),
    [cv, cc, vv, vc, level]
  )

  const controlCi = useMemo(
    () => proportionConfidenceInterval(result.control.rate, result.control.se, level),
    [result.control.rate, result.control.se, level]
  )

  const variantCi = useMemo(
    () => proportionConfidenceInterval(result.variant.rate, result.variant.se, level),
    [result.variant.rate, result.variant.se, level]
  )

  const applyPreset = (key) => {
    const p = presets[key]
    setCv(p.controlVisitors)
    setCc(p.controlConversions)
    setVv(p.variantVisitors)
    setVc(p.variantConversions)
    setLevel(p.confidenceLevel)
  }

  const formatPValue = (p) => {
    if (p < 0.0001) return '< 0.0001'
    return formatNumber(p, 4)
  }

  const renderDecision = () => {
    if (!result.control.valid || !result.variant.valid) {
      return <Tag color="default">—</Tag>
    }
    if (result.winner === 'variant') {
      return <Tag color="success">{t.winnerVariant}</Tag>
    }
    if (result.winner === 'control') {
      return <Tag color="error">{t.winnerControl}</Tag>
    }
    return <Tag color="warning">{t.inconclusive}</Tag>
  }

  // Escala o grafico usando o maior limite superior dos intervalos.
  const maxValue = Math.max(controlCi.upper, variantCi.upper, 0.001)
  const chartHeight = 160
  const chartWidth = 320
  const barWidth = 56
  const leftX = 80
  const rightX = chartWidth - leftX - barWidth
  const baselineY = chartHeight - 20

  const scale = (v) => baselineY - (v / (maxValue * 1.15)) * (chartHeight - 40)

  return (
    <div style={{ padding: 24, maxWidth: 960, margin: '0 auto' }}>
      <Title level={2}>
        <ExperimentOutlined style={{ marginRight: 12 }} />
        {t.title}
      </Title>
      <Paragraph>{t.intro}</Paragraph>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card title={t.control}>
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <div>
                <Text strong>{t.visitors}</Text>
                <InputNumber
                  style={{ width: '100%' }}
                  min={1}
                  value={cv}
                  onChange={(v) => setCv(v ?? 0)}
                />
              </div>
              <div>
                <Text strong>{t.conversions}</Text>
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  max={cv}
                  value={cc}
                  onChange={(v) => setCc(v ?? 0)}
                />
              </div>
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card title={t.variant}>
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <div>
                <Text strong>{t.visitors}</Text>
                <InputNumber
                  style={{ width: '100%' }}
                  min={1}
                  value={vv}
                  onChange={(v) => setVv(v ?? 0)}
                />
              </div>
              <div>
                <Text strong>{t.conversions}</Text>
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  max={vv}
                  value={vc}
                  onChange={(v) => setVc(v ?? 0)}
                />
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      <Card style={{ marginTop: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <div>
            <Text strong>{t.confidence}</Text>
            <Radio.Group
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              style={{ marginLeft: 12 }}
            >
              <Radio.Button value={0.9}>{t.confidence90}</Radio.Button>
              <Radio.Button value={0.95}>{t.confidence95}</Radio.Button>
              <Radio.Button value={0.99}>{t.confidence99}</Radio.Button>
            </Radio.Group>
          </div>

          <div>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>{t.scenarios}</Text>
            <Space wrap>
              {Object.keys(presets).map((key) => (
                <Button key={key} size="small" onClick={() => applyPreset(key)}>
                  {presets[key].label}
                </Button>
              ))}
            </Space>
          </div>
        </Space>
      </Card>

      {!result.control.valid || !result.variant.valid ? (
        <Alert message={t.invalidData} type="error" showIcon style={{ marginTop: 16 }} />
      ) : (
        <>
          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col xs={24} sm={12} md={8}>
              <Card>
                <Statistic
                  title={t.rate}
                  value={formatPercent(result.control.rate)}
                />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {t.ci}: {formatPercent(controlCi.lower)} – {formatPercent(controlCi.upper)}
                </Text>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card>
                <Statistic
                  title={t.rate}
                  value={formatPercent(result.variant.rate)}
                />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {t.ci}: {formatPercent(variantCi.lower)} – {formatPercent(variantCi.upper)}
                </Text>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card>
                <Statistic
                  title={t.relativeUplift}
                  value={formatPercent(result.relativeUplift)}
                  valueStyle={{ color: result.relativeUplift >= 0 ? '#52c41a' : '#ff4d4f' }}
                  prefix={result.relativeUplift > 0 ? '+' : result.relativeUplift < 0 ? '' : ''}
                />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {t.difference}: {formatPercent(result.difference)}
                </Text>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card>
                <Statistic title={t.zScore} value={formatNumber(result.zScore, 3)} />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card>
                <Statistic title={t.pValue} value={formatPValue(result.pValue)} />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>{t.decision}</Text>
                {renderDecision()}
                <Divider style={{ margin: '12px 0' }} />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {result.significant ? t.significantHint : t.notSignificantHint}
                </Text>
              </Card>
            </Col>
          </Row>

          <Card title={t.chartTitle} style={{ marginTop: 16 }}>
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              width="100%"
              style={{ maxWidth: 360, display: 'block', margin: '0 auto' }}
              role="img"
              aria-label={t.chartTitle}
            >
              {/* eixo base */}
              <line
                x1="20"
                y1={baselineY}
                x2={chartWidth - 20}
                y2={baselineY}
                stroke="#d9d9d9"
                strokeWidth="2"
              />

              {/* barra do controle */}
              <rect
                x={leftX}
                y={scale(result.control.rate)}
                width={barWidth}
                height={baselineY - scale(result.control.rate)}
                fill="#1677ff"
                rx="4"
              />
              {/* error bar controle */}
              <line
                x1={leftX + barWidth / 2}
                y1={scale(controlCi.lower)}
                x2={leftX + barWidth / 2}
                y2={scale(controlCi.upper)}
                stroke="#1677ff"
                strokeWidth="2"
              />
              <line
                x1={leftX + 8}
                y1={scale(controlCi.upper)}
                x2={leftX + barWidth - 8}
                y2={scale(controlCi.upper)}
                stroke="#1677ff"
                strokeWidth="2"
              />
              <line
                x1={leftX + 8}
                y1={scale(controlCi.lower)}
                x2={leftX + barWidth - 8}
                y2={scale(controlCi.lower)}
                stroke="#1677ff"
                strokeWidth="2"
              />

              {/* barra da variante */}
              <rect
                x={rightX}
                y={scale(result.variant.rate)}
                width={barWidth}
                height={baselineY - scale(result.variant.rate)}
                fill="#52c41a"
                rx="4"
              />
              {/* error bar variante */}
              <line
                x1={rightX + barWidth / 2}
                y1={scale(variantCi.lower)}
                x2={rightX + barWidth / 2}
                y2={scale(variantCi.upper)}
                stroke="#52c41a"
                strokeWidth="2"
              />
              <line
                x1={rightX + 8}
                y1={scale(variantCi.upper)}
                x2={rightX + barWidth - 8}
                y2={scale(variantCi.upper)}
                stroke="#52c41a"
                strokeWidth="2"
              />
              <line
                x1={rightX + 8}
                y1={scale(variantCi.lower)}
                x2={rightX + barWidth - 8}
                y2={scale(variantCi.lower)}
                stroke="#52c41a"
                strokeWidth="2"
              />

              {/* legendas */}
              <text x={leftX + barWidth / 2} y={baselineY + 16} textAnchor="middle" fontSize="12" fill="rgba(0,0,0,0.65)">
                {t.chartControl}
              </text>
              <text x={rightX + barWidth / 2} y={baselineY + 16} textAnchor="middle" fontSize="12" fill="rgba(0,0,0,0.65)">
                {t.chartVariant}
              </text>
            </svg>
          </Card>
        </>
      )}

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
