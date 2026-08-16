import React, { useMemo, useState, useCallback } from 'react'
import {
  Typography,
  Card,
  InputNumber,
  Space,
  Segmented,
  Row,
  Col,
  Statistic,
  Tag,
  Alert,
  Collapse,
  Button,
  Tabs,
  Tooltip,
} from 'antd'
import {
  CalculatorOutlined,
  CopyOutlined,
  InfoCircleOutlined,
  ExperimentOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  CONFIDENCE_LEVELS,
  getZ,
  confidenceIntervalMean,
  confidenceIntervalProportion,
  sampleSizeForMean,
  sampleSizeForProportion,
  formatNumber,
  formatPercent,
  PRESETS,
} from '../utils/confidenceIntervalCalculator'
import useCopyToClipboard from '../hooks/useCopyToClipboard'

const { Title, Paragraph, Text } = Typography
const { Panel } = Collapse
const { TabPane } = Tabs

const sourceCode = `import {
  confidenceIntervalMean,
  confidenceIntervalProportion,
  sampleSizeForMean,
  sampleSizeForProportion,
  getZ,
} from '../utils/confidenceIntervalCalculator'

// Intervalo de confiança para uma média
const ci = confidenceIntervalMean(120, 35, 100, getZ('95'))
// { lower: 113.14, upper: 126.86, marginOfError: 6.86, standardError: 3.5, valid: true }

// Intervalo de confiança para uma proporção
const prop = confidenceIntervalProportion(45, 200, getZ('95'))
// { proportion: 0.225, lower: 0.1672, upper: 0.2828, ... }

// Tamanho amostral necessário
const n = sampleSizeForMean(5, getZ('95'), 35)   // margem de erro 5
const np = sampleSizeForProportion(0.05, getZ('95'), 0.5)
`

const translations = {
  pt: {
    title: 'Calculadora de Intervalo de Confiança',
    subtitle: 'IC para médias, proporções e tamanho amostral',
    intro: 'Calcule intervalos de confiança e tamanhos amostrais usando a aproximação normal (Z). Útil para estimar incertezas em experimentos, pesquisas, A/B tests e métricas de software.',
    confidenceLevel: 'Nível de confiança',
    meanTab: 'Média',
    proportionTab: 'Proporção',
    sampleSizeTab: 'Tamanho amostral',
    meanLabel: 'Média amostral',
    sdLabel: 'Desvio padrão',
    nLabel: 'Tamanho da amostra (n)',
    successesLabel: 'Sucessos',
    totalLabel: 'Total da amostra',
    moeLabel: 'Margem de erro desejada',
    sdEstimatedLabel: 'Desvio padrão estimado',
    pEstimatedLabel: 'Proporção esperada',
    presets: 'Cenários rápidos',
    resultTitle: 'Resultado',
    lower: 'Limite inferior',
    upper: 'Limite superior',
    marginOfError: 'Margem de erro',
    standardError: 'Erro padrão',
    sampleSize: 'Tamanho amostral necessário',
    proportion: 'Proporção observada',
    invalidInput: 'Preencha todos os campos com valores válidos.',
    hintMean: 'Fórmula: IC = x̄ ± Z × (σ / √n)',
    hintProportion: 'Fórmula: IC = p̂ ± Z × √(p̂(1 − p̂) / n)',
    hintSampleMean: 'Fórmula: n = (Z × σ / E)²',
    hintSampleProportion: 'Fórmula: n = Z² × p × (1 − p) / E²',
    chartTitle: 'Distribuição normal e intervalo de confiança',
    chartCaption: 'A área azul representa a região coberta pelo nível de confiança escolhido.',
    tableTitle: 'Valores Z comuns',
    sourceTitle: 'Motor de cálculo',
    sourceIntro: 'O motor é puro JavaScript client-side — nenhum dado estatístico sai do navegador.',
    copy: 'Copiar resultado',
    copied: 'Copiado!',
  },
  en: {
    title: 'Confidence Interval Calculator',
    subtitle: 'CI for means, proportions and sample size',
    intro: 'Calculate confidence intervals and required sample sizes using the normal approximation (Z-score). Useful for estimating uncertainty in experiments, surveys, A/B tests and software metrics.',
    confidenceLevel: 'Confidence level',
    meanTab: 'Mean',
    proportionTab: 'Proportion',
    sampleSizeTab: 'Sample size',
    meanLabel: 'Sample mean',
    sdLabel: 'Standard deviation',
    nLabel: 'Sample size (n)',
    successesLabel: 'Successes',
    totalLabel: 'Sample total',
    moeLabel: 'Desired margin of error',
    sdEstimatedLabel: 'Estimated standard deviation',
    pEstimatedLabel: 'Expected proportion',
    presets: 'Quick scenarios',
    resultTitle: 'Result',
    lower: 'Lower bound',
    upper: 'Upper bound',
    marginOfError: 'Margin of error',
    standardError: 'Standard error',
    sampleSize: 'Required sample size',
    proportion: 'Observed proportion',
    invalidInput: 'Fill in all fields with valid values.',
    hintMean: 'Formula: CI = x̄ ± Z × (σ / √n)',
    hintProportion: 'Formula: CI = p̂ ± Z × √(p̂(1 − p̂) / n)',
    hintSampleMean: 'Formula: n = (Z × σ / E)²',
    hintSampleProportion: 'Formula: n = Z² × p × (1 − p) / E²',
    chartTitle: 'Normal distribution and confidence interval',
    chartCaption: 'The blue area represents the region covered by the selected confidence level.',
    tableTitle: 'Common Z-values',
    sourceTitle: 'Calculation engine',
    sourceIntro: 'The engine is pure client-side JavaScript — no statistical data leaves the browser.',
    copy: 'Copy result',
    copied: 'Copied!',
  },
}

function normalPdf(x, mean, sd) {
  if (sd <= 0) return 0
  const exponent = -0.5 * Math.pow((x - mean) / sd, 2)
  return (1 / (sd * Math.sqrt(2 * Math.PI))) * Math.exp(exponent)
}

function DistributionChart({ mean, marginOfError, z, sd, unit = '' }) {
  if (!mean || !marginOfError || !z || !sd) return null

  const width = 600
  const height = 180
  const padding = { top: 10, right: 20, bottom: 30, left: 20 }
  const plotWidth = width - padding.left - padding.right
  const plotHeight = height - padding.top - padding.bottom

  const sigma = sd
  const xMin = mean - 4 * sigma
  const xMax = mean + 4 * sigma
  const scaleX = (x) => padding.left + ((x - xMin) / (xMax - xMin)) * plotWidth
  const maxY = normalPdf(mean, mean, sigma)
  const scaleY = (y) => padding.top + plotHeight - (y / maxY) * plotHeight

  const points = []
  for (let i = 0; i <= 100; i++) {
    const x = xMin + (i / 100) * (xMax - xMin)
    const y = normalPdf(x, mean, sigma)
    points.push(`${scaleX(x)},${scaleY(y)}`)
  }

  const lower = mean - marginOfError
  const upper = mean + marginOfError

  const shadedPoints = []
  for (let i = 0; i <= 100; i++) {
    const x = Math.max(lower, Math.min(upper, xMin + (i / 100) * (xMax - xMin)))
    const y = normalPdf(x, mean, sigma)
    shadedPoints.push(`${scaleX(x)},${scaleY(y)}`)
  }
  shadedPoints.push(`${scaleX(upper)},${scaleY(0)}`)
  shadedPoints.push(`${scaleX(lower)},${scaleY(0)}`)

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height={height}
      style={{ display: 'block' }}
    >
      <line
        x1={padding.left}
        y1={height - padding.bottom}
        x2={width - padding.right}
        y2={height - padding.bottom}
        stroke="#d9d9d9"
        strokeWidth={1}
      />
      <polyline
        fill="none"
        stroke="#1677ff"
        strokeWidth={2}
        points={points.join(' ')}
      />
      <polygon
        fill="rgba(22, 119, 255, 0.2)"
        stroke="none"
        points={shadedPoints.join(' ')}
      />
      <line
        x1={scaleX(mean)}
        y1={padding.top}
        x2={scaleX(mean)}
        y2={height - padding.bottom}
        stroke="#1677ff"
        strokeDasharray="4 4"
        strokeWidth={1}
      />
      <text
        x={scaleX(mean)}
        y={height - 10}
        textAnchor="middle"
        style={{ fontSize: 11, fill: 'currentColor' }}
      >
        μ{unit ? ` (${unit})` : ''}
      </text>
      <text
        x={scaleX(lower)}
        y={height - 10}
        textAnchor="end"
        style={{ fontSize: 10, fill: 'currentColor' }}
      >
        {formatNumber(lower, 2)}
      </text>
      <text
        x={scaleX(upper)}
        y={height - 10}
        textAnchor="start"
        style={{ fontSize: 10, fill: 'currentColor' }}
      >
        {formatNumber(upper, 2)}
      </text>
    </svg>
  )
}

export default function ConfidenceIntervalCalculatorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [activeTab, setActiveTab] = useState('mean')
  const [confidenceKey, setConfidenceKey] = useState('95')
  const [copied, copy] = useCopyToClipboard()

  const [mean, setMean] = useState(120)
  const [sd, setSd] = useState(35)
  const [n, setN] = useState(100)

  const [successes, setSuccesses] = useState(45)
  const [total, setTotal] = useState(200)

  const [moe, setMoe] = useState(5)
  const [sampleMode, setSampleMode] = useState('mean')
  const [sampleSd, setSampleSd] = useState(35)
  const [sampleP, setSampleP] = useState(0.5)

  const z = useMemo(() => getZ(confidenceKey), [confidenceKey])

  const meanResult = useMemo(
    () => confidenceIntervalMean(mean, sd, n, z),
    [mean, sd, n, z]
  )

  const propResult = useMemo(
    () => confidenceIntervalProportion(successes, total, z),
    [successes, total, z]
  )

  const sampleSize = useMemo(() => {
    if (sampleMode === 'mean') return sampleSizeForMean(moe, z, sampleSd)
    return sampleSizeForProportion(moe, z, sampleP)
  }, [sampleMode, moe, z, sampleSd, sampleP])

  const handlePreset = useCallback(
    (preset) => {
      if (preset.mean != null) {
        setActiveTab('mean')
        setMean(preset.mean)
        setSd(preset.sd)
        setN(preset.n)
      } else if (preset.successes != null) {
        setActiveTab('proportion')
        setSuccesses(preset.successes)
        setTotal(preset.total)
      }
    },
    []
  )

  const handleCopy = useCallback(() => {
    let text = ''
    if (activeTab === 'mean' && meanResult.valid) {
      text = `CI ${confidenceKey}%: ${formatNumber(meanResult.lower, 4)} — ${formatNumber(meanResult.upper, 4)}\nMargin of error: ±${formatNumber(meanResult.marginOfError, 4)}\nStandard error: ${formatNumber(meanResult.standardError, 4)}`
    } else if (activeTab === 'proportion' && propResult.valid) {
      text = `CI ${confidenceKey}%: ${formatPercent(propResult.lower, 2)} — ${formatPercent(propResult.upper, 2)}\nObserved proportion: ${formatPercent(propResult.proportion, 2)}\nMargin of error: ±${formatPercent(propResult.marginOfError, 2)}`
    } else if (activeTab === 'sample') {
      text = `Required sample size: ${sampleSize}`
    }
    if (text) copy(text)
  }, [activeTab, confidenceKey, meanResult, propResult, sampleSize, copy])

  const confidenceOptions = useMemo(
    () => CONFIDENCE_LEVELS.map((c) => ({ label: c.label, value: c.key })),
    []
  )

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}>
        <CalculatorOutlined /> {t.title}
      </Title>
      <Paragraph type="secondary">{t.subtitle}</Paragraph>
      <Paragraph>{t.intro}</Paragraph>

      <Card title={t.confidenceLevel} size="small">
        <Segmented
          options={confidenceOptions}
          value={confidenceKey}
          onChange={setConfidenceKey}
        />
      </Card>

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab={t.meanTab} key="mean">
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Alert type="info" showIcon icon={<InfoCircleOutlined />} message={t.hintMean} />
            <Row gutter={[16, 16]}>
              <Col xs={24} md={8}>
                <Text strong>{t.meanLabel}</Text>
                <InputNumber
                  value={mean}
                  onChange={setMean}
                  style={{ width: '100%' }}
                  step={0.1}
                />
              </Col>
              <Col xs={24} md={8}>
                <Text strong>{t.sdLabel}</Text>
                <InputNumber
                  value={sd}
                  onChange={setSd}
                  style={{ width: '100%' }}
                  min={0}
                  step={0.1}
                />
              </Col>
              <Col xs={24} md={8}>
                <Text strong>{t.nLabel}</Text>
                <InputNumber
                  value={n}
                  onChange={setN}
                  style={{ width: '100%' }}
                  min={2}
                  step={1}
                />
              </Col>
            </Row>

            {meanResult.valid ? (
              <Card title={t.resultTitle} size="small">
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12} md={6}>
                    <Statistic title={t.lower} value={formatNumber(meanResult.lower, 4)} />
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <Statistic title={t.upper} value={formatNumber(meanResult.upper, 4)} />
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <Statistic title={t.marginOfError} value={formatNumber(meanResult.marginOfError, 4)} />
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <Statistic title={t.standardError} value={formatNumber(meanResult.standardError, 4)} />
                  </Col>
                </Row>
                <div style={{ marginTop: 16 }}>
                  <DistributionChart
                    mean={mean}
                    marginOfError={meanResult.marginOfError}
                    z={z}
                    sd={meanResult.standardError}
                  />
                  <Text type="secondary" style={{ fontSize: 12 }}>{t.chartCaption}</Text>
                </div>
              </Card>
            ) : (
              <Alert type="warning" showIcon message={t.invalidInput} />
            )}
          </Space>
        </TabPane>

        <TabPane tab={t.proportionTab} key="proportion">
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Alert type="info" showIcon icon={<InfoCircleOutlined />} message={t.hintProportion} />
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Text strong>{t.successesLabel}</Text>
                <InputNumber
                  value={successes}
                  onChange={setSuccesses}
                  style={{ width: '100%' }}
                  min={0}
                  step={1}
                />
              </Col>
              <Col xs={24} md={12}>
                <Text strong>{t.totalLabel}</Text>
                <InputNumber
                  value={total}
                  onChange={setTotal}
                  style={{ width: '100%' }}
                  min={1}
                  step={1}
                />
              </Col>
            </Row>

            {propResult.valid ? (
              <Card title={t.resultTitle} size="small">
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12} md={6}>
                    <Statistic title={t.proportion} value={formatPercent(propResult.proportion, 2)} />
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <Statistic title={t.lower} value={formatPercent(propResult.lower, 2)} />
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <Statistic title={t.upper} value={formatPercent(propResult.upper, 2)} />
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <Statistic title={t.marginOfError} value={formatPercent(propResult.marginOfError, 2)} />
                  </Col>
                </Row>
                <div style={{ marginTop: 16 }}>
                  <DistributionChart
                    mean={propResult.proportion}
                    marginOfError={propResult.marginOfError}
                    z={z}
                    sd={propResult.standardError}
                  />
                  <Text type="secondary" style={{ fontSize: 12 }}>{t.chartCaption}</Text>
                </div>
              </Card>
            ) : (
              <Alert type="warning" showIcon message={t.invalidInput} />
            )}
          </Space>
        </TabPane>

        <TabPane tab={t.sampleSizeTab} key="sample">
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Text strong>{t.moeLabel}</Text>
                <InputNumber
                  value={moe}
                  onChange={setMoe}
                  style={{ width: '100%' }}
                  min={0.0001}
                  step={0.1}
                />
              </Col>
              <Col xs={24} md={12}>
                <Text strong>{t.confidenceLevel}</Text>
                <div style={{ marginTop: 4 }}>
                  <Tag color="blue">{confidenceKey}%</Tag>
                </div>
              </Col>
            </Row>

            <Card size="small">
              <Segmented
                block
                options={[
                  { label: t.meanTab, value: 'mean' },
                  { label: t.proportionTab, value: 'proportion' },
                ]}
                value={sampleMode}
                onChange={setSampleMode}
              />
            </Card>

            {sampleMode === 'mean' ? (
              <>
                <Alert type="info" showIcon icon={<InfoCircleOutlined />} message={t.hintSampleMean} />
                <Text strong>{t.sdEstimatedLabel}</Text>
                <InputNumber
                  value={sampleSd}
                  onChange={setSampleSd}
                  style={{ width: '100%' }}
                  min={0.0001}
                  step={0.1}
                />
              </>
            ) : (
              <>
                <Alert type="info" showIcon icon={<InfoCircleOutlined />} message={t.hintSampleProportion} />
                <Text strong>{t.pEstimatedLabel}</Text>
                <InputNumber
                  value={sampleP}
                  onChange={setSampleP}
                  style={{ width: '100%' }}
                  min={0}
                  max={1}
                  step={0.05}
                />
              </>
            )}

            {sampleSize != null ? (
              <Card title={t.resultTitle} size="small">
                <Statistic title={t.sampleSize} value={sampleSize} />
              </Card>
            ) : (
              <Alert type="warning" showIcon message={t.invalidInput} />
            )}
          </Space>
        </TabPane>
      </Tabs>

      <Space wrap>
        <Text type="secondary">{t.presets}:</Text>
        {PRESETS[lang].map((preset) => (
          <Tooltip key={preset.name} title={preset.name}>
            <Button size="small" icon={<ExperimentOutlined />} onClick={() => handlePreset(preset)}>
              {preset.name}
            </Button>
          </Tooltip>
        ))}
      </Space>

      <Button icon={<CopyOutlined />} onClick={handleCopy}>
        {copied ? t.copied : t.copy}
      </Button>

      <Card title={t.tableTitle} size="small">
        <Row gutter={[16, 8]}>
          {CONFIDENCE_LEVELS.map((c) => (
            <Col key={c.key} xs={12} sm={8} md={4}>
              <Text>
                {c.label}: <Text strong>{c.z}</Text>
              </Text>
            </Col>
          ))}
        </Row>
      </Card>

      <Collapse>
        <Panel header={t.sourceTitle} key="source">
          <Paragraph>{t.sourceIntro}</Paragraph>
          <pre style={{ overflow: 'auto' }}>
            <code>{sourceCode}</code>
          </pre>
        </Panel>
      </Collapse>
    </Space>
  )
}
