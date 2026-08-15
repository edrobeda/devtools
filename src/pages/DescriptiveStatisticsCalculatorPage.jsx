import React, { useMemo, useState } from 'react'
import {
  Typography,
  Card,
  Input,
  InputNumber,
  Space,
  Collapse,
  Row,
  Col,
  Statistic,
  Button,
  Alert,
  Table,
} from 'antd'
import { CalculatorOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  parseNumberList,
  descriptiveStatistics,
  buildHistogram,
  formatNumber,
  PRESETS,
} from '../utils/descriptiveStatisticsCalculator'

const { Title, Paragraph, Text } = Typography
const { Panel } = Collapse
const { TextArea } = Input

const sourceCode = `import {
  parseNumberList,
  descriptiveStatistics,
  buildHistogram,
} from '../utils/descriptiveStatisticsCalculator'

const values = parseNumberList('120, 145, 132, 189, 201')
const stats = descriptiveStatistics(values)
const histogram = buildHistogram(values, 5)

console.log(stats.mean)     // 157.4
console.log(stats.median)   // 145
console.log(stats.stdDev)   // 35.33
`

const translations = {
  pt: {
    title: 'Calculadora de Estatistica Descritiva',
    intro: 'Cole ou digite uma lista de numeros para calcular medidas de tendencia central, dispersao, quartis, assimetria, curtose e outliers. Util para analisar metricas de performance, logs, benchmarks e qualquer conjunto de dados rapido.',
    dataLabel: 'Dados (separados por virgula, espaco ou nova linha)',
    binsLabel: 'Numero de bins do histograma',
    scenarios: 'Cenarios rapidos',
    calculate: 'Calcular',
    clear: 'Limpar',
    noData: 'Insira pelo menos um numero valido para comecar.',
    count: 'Quantidade',
    sum: 'Soma',
    sumOfSquares: 'Soma dos quadrados',
    min: 'Minimo',
    max: 'Maximo',
    range: 'Amplitude',
    mean: 'Media',
    median: 'Mediana',
    mode: 'Moda',
    noMode: 'Amodal',
    modeFrequency: 'Frequencia da moda',
    populationVariance: 'Variancia populacional',
    sampleVariance: 'Variancia amostral',
    populationStdDev: 'Desvio padrao populacional',
    sampleStdDev: 'Desvio padrao amostral',
    coefficientOfVariation: 'Coeficiente de variacao (%)',
    quartile1: '1o quartil (Q1)',
    quartile2: '2o quartil (Q2)',
    quartile3: '3o quartil (Q3)',
    iqr: 'Intervalo interquartil (IQR)',
    skewness: 'Assimetria (skewness)',
    kurtosis: 'Curtose excesso',
    outliers: 'Outliers (regra do 1,5x IQR)',
    outliersCount: 'Outliers',
    histogramTitle: 'Histograma',
    tableHeaderMetric: 'Metrica',
    tableHeaderValue: 'Valor',
    sourceTitle: 'Motor de calculo',
    sourceIntro: 'O motor e puro JavaScript client-side e nao envia dados para lugar nenhum.',
  },
  en: {
    title: 'Descriptive Statistics Calculator',
    intro: 'Paste or type a list of numbers to calculate measures of central tendency, dispersion, quartiles, skewness, kurtosis and outliers. Useful for analyzing performance metrics, logs, benchmarks and any quick dataset.',
    dataLabel: 'Data (comma, space or newline separated)',
    binsLabel: 'Histogram bins',
    scenarios: 'Quick scenarios',
    calculate: 'Calculate',
    clear: 'Clear',
    noData: 'Enter at least one valid number to get started.',
    count: 'Count',
    sum: 'Sum',
    sumOfSquares: 'Sum of squares',
    min: 'Minimum',
    max: 'Maximum',
    range: 'Range',
    mean: 'Mean',
    median: 'Median',
    mode: 'Mode',
    noMode: 'No mode',
    modeFrequency: 'Mode frequency',
    populationVariance: 'Population variance',
    sampleVariance: 'Sample variance',
    populationStdDev: 'Population standard deviation',
    sampleStdDev: 'Sample standard deviation',
    coefficientOfVariation: 'Coefficient of variation (%)',
    quartile1: '1st quartile (Q1)',
    quartile2: '2nd quartile (Q2)',
    quartile3: '3rd quartile (Q3)',
    iqr: 'Interquartile range (IQR)',
    skewness: 'Skewness',
    kurtosis: 'Excess kurtosis',
    outliers: 'Outliers (1.5x IQR rule)',
    outliersCount: 'Outliers',
    histogramTitle: 'Histogram',
    tableHeaderMetric: 'Metric',
    tableHeaderValue: 'Value',
    sourceTitle: 'Calculation engine',
    sourceIntro: 'The engine is pure client-side JavaScript and does not send data anywhere.',
  },
}

export default function DescriptiveStatisticsCalculatorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const presets = PRESETS[lang]

  const [rawData, setRawData] = useState(presets.responseTimes.data)
  const [binInput, setBinInput] = useState(5)

  const numbers = useMemo(() => parseNumberList(rawData), [rawData])
  const stats = useMemo(() => descriptiveStatistics(numbers), [numbers])
  const histogram = useMemo(
    () => buildHistogram(numbers, binInput),
    [numbers, binInput]
  )

  const applyPreset = (key) => {
    setRawData(presets[key].data)
  }

  const handleBinChange = (value) => {
    const v = Number(value)
    if (Number.isFinite(v) && v >= 1 && v <= 50) {
      setBinInput(v)
    } else if (value === '' || value === null) {
      setBinInput('')
    }
  }

  const modeDisplay = stats.mode.length > 0
    ? stats.mode.map((m) => formatNumber(m)).join(', ')
    : t.noMode

  const tableData = [
    { key: 'count', metric: t.count, value: stats.count },
    { key: 'sum', metric: t.sum, value: formatNumber(stats.sum) },
    { key: 'sumOfSquares', metric: t.sumOfSquares, value: formatNumber(stats.sumOfSquares) },
    { key: 'min', metric: t.min, value: formatNumber(stats.min) },
    { key: 'max', metric: t.max, value: formatNumber(stats.max) },
    { key: 'range', metric: t.range, value: formatNumber(stats.range) },
    { key: 'mean', metric: t.mean, value: formatNumber(stats.mean) },
    { key: 'median', metric: t.median, value: formatNumber(stats.median) },
    { key: 'mode', metric: t.mode, value: modeDisplay },
    { key: 'modeFrequency', metric: t.modeFrequency, value: stats.modeFrequency },
    { key: 'populationVariance', metric: t.populationVariance, value: formatNumber(stats.populationVariance) },
    { key: 'sampleVariance', metric: t.sampleVariance, value: formatNumber(stats.sampleVariance) },
    { key: 'populationStdDev', metric: t.populationStdDev, value: formatNumber(stats.populationStandardDeviation) },
    { key: 'sampleStdDev', metric: t.sampleStdDev, value: formatNumber(stats.sampleStandardDeviation) },
    { key: 'cv', metric: t.coefficientOfVariation, value: `${formatNumber(stats.coefficientOfVariation)}%` },
    { key: 'q1', metric: t.quartile1, value: formatNumber(stats.quartile1) },
    { key: 'q2', metric: t.quartile2, value: formatNumber(stats.quartile2) },
    { key: 'q3', metric: t.quartile3, value: formatNumber(stats.quartile3) },
    { key: 'iqr', metric: t.iqr, value: formatNumber(stats.interquartileRange) },
    { key: 'skewness', metric: t.skewness, value: formatNumber(stats.skewness) },
    { key: 'kurtosis', metric: t.kurtosis, value: formatNumber(stats.kurtosis) },
  ]

  const columns = [
    {
      title: t.tableHeaderMetric,
      dataIndex: 'metric',
      key: 'metric',
      width: '60%',
    },
    {
      title: t.tableHeaderValue,
      dataIndex: 'value',
      key: 'value',
      align: 'right',
      render: (value) => <Text strong>{value}</Text>,
    },
  ]

  // Dimensões e escala do histograma SVG
  const chartHeight = 200
  const chartWidth = 560
  const padding = { top: 20, right: 16, bottom: 40, left: 48 }
  const innerWidth = chartWidth - padding.left - padding.right
  const innerHeight = chartHeight - padding.top - padding.bottom
  const maxCount = histogram.bins.length > 0
    ? Math.max(...histogram.bins.map((b) => b.count), 1)
    : 1
  const binWidth = histogram.bins.length > 0
    ? innerWidth / histogram.bins.length
    : 0

  return (
    <div style={{ padding: 24, maxWidth: 960, margin: '0 auto' }}>
      <Title level={2}>
        <CalculatorOutlined style={{ marginRight: 12 }} />
        {t.title}
      </Title>
      <Paragraph>{t.intro}</Paragraph>

      <Card>
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <div>
            <Text strong>{t.dataLabel}</Text>
            <TextArea
              rows={4}
              value={rawData}
              onChange={(e) => setRawData(e.target.value)}
              placeholder="120, 145, 132, 189, 201"
              style={{ marginTop: 8 }}
            />
          </div>

          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={12}>
              <Text strong>{t.binsLabel}</Text>
              <InputNumber
                style={{ width: '100%', marginTop: 8 }}
                min={1}
                max={50}
                value={binInput}
                onChange={handleBinChange}
              />
            </Col>
            <Col xs={24} sm={12}>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>{t.scenarios}</Text>
              <Space wrap>
                {Object.keys(presets).map((key) => (
                  <Button key={key} size="small" onClick={() => applyPreset(key)}>
                    {presets[key].label}
                  </Button>
                ))}
              </Space>
            </Col>
          </Row>
        </Space>
      </Card>

      {!stats.valid ? (
        <Alert message={t.noData} type="info" showIcon style={{ marginTop: 16 }} />
      ) : (
        <>
          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col xs={12} sm={8} md={6}>
              <Card>
                <Statistic title={t.count} value={stats.count} />
              </Card>
            </Col>
            <Col xs={12} sm={8} md={6}>
              <Card>
                <Statistic title={t.mean} value={formatNumber(stats.mean)} />
              </Card>
            </Col>
            <Col xs={12} sm={8} md={6}>
              <Card>
                <Statistic title={t.median} value={formatNumber(stats.median)} />
              </Card>
            </Col>
            <Col xs={12} sm={8} md={6}>
              <Card>
                <Statistic title={t.sampleStdDev} value={formatNumber(stats.sampleStandardDeviation)} />
              </Card>
            </Col>
            <Col xs={12} sm={8} md={6}>
              <Card>
                <Statistic title={t.min} value={formatNumber(stats.min)} />
              </Card>
            </Col>
            <Col xs={12} sm={8} md={6}>
              <Card>
                <Statistic title={t.max} value={formatNumber(stats.max)} />
              </Card>
            </Col>
            <Col xs={12} sm={8} md={6}>
              <Card>
                <Statistic title={t.range} value={formatNumber(stats.range)} />
              </Card>
            </Col>
            <Col xs={12} sm={8} md={6}>
              <Card>
                <Statistic title={t.outliersCount} value={stats.outliers.length} />
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col xs={24} md={12}>
              <Card title={t.histogramTitle}>
                <svg
                  viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                  width="100%"
                  style={{ maxWidth: 560, display: 'block', margin: '0 auto' }}
                  role="img"
                  aria-label={t.histogramTitle}
                >
                  {/* eixo Y */}
                  <line
                    x1={padding.left}
                    y1={padding.top}
                    x2={padding.left}
                    y2={chartHeight - padding.bottom}
                    stroke="#d9d9d9"
                    strokeWidth="1"
                  />
                  {/* eixo X */}
                  <line
                    x1={padding.left}
                    y1={chartHeight - padding.bottom}
                    x2={chartWidth - padding.right}
                    y2={chartHeight - padding.bottom}
                    stroke="#d9d9d9"
                    strokeWidth="1"
                  />
                  {/* linha de grade no topo */}
                  <line
                    x1={padding.left}
                    y1={padding.top}
                    x2={chartWidth - padding.right}
                    y2={padding.top}
                    stroke="#f0f0f0"
                    strokeWidth="1"
                  />
                  {/* rotulo do maximo no eixo Y */}
                  <text
                    x={padding.left - 8}
                    y={padding.top + 4}
                    textAnchor="end"
                    fontSize="10"
                    fill="rgba(0,0,0,0.45)"
                  >
                    {maxCount}
                  </text>
                  {/* rotulo zero */}
                  <text
                    x={padding.left - 8}
                    y={chartHeight - padding.bottom + 4}
                    textAnchor="end"
                    fontSize="10"
                    fill="rgba(0,0,0,0.45)"
                  >
                    0
                  </text>
                  {histogram.bins.map((bin, i) => {
                    const barHeight = (bin.count / maxCount) * innerHeight
                    const x = padding.left + i * binWidth + binWidth * 0.1
                    const w = binWidth * 0.8
                    const y = chartHeight - padding.bottom - barHeight
                    return (
                      <g key={i}>
                        <rect
                          x={x}
                          y={y}
                          width={Math.max(w, 1)}
                          height={barHeight}
                          fill="#1677ff"
                          rx="2"
                        />
                        {bin.count > 0 && (
                          <text
                            x={x + w / 2}
                            y={y - 4}
                            textAnchor="middle"
                            fontSize="10"
                            fill="rgba(0,0,0,0.65)"
                          >
                            {bin.count}
                          </text>
                        )}
                      </g>
                    )
                  })}
                  {/* rotulos do eixo X (primeiro, meio e ultimo bin) */}
                  {histogram.bins.length > 0 && (
                    <>
                      <text
                        x={padding.left}
                        y={chartHeight - padding.bottom + 16}
                        textAnchor="middle"
                        fontSize="10"
                        fill="rgba(0,0,0,0.45)"
                      >
                        {formatNumber(histogram.min, 1)}
                      </text>
                      <text
                        x={chartWidth - padding.right}
                        y={chartHeight - padding.bottom + 16}
                        textAnchor="middle"
                        fontSize="10"
                        fill="rgba(0,0,0,0.45)"
                      >
                        {formatNumber(histogram.max, 1)}
                      </text>
                    </>
                  )}
                </svg>
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card title={t.outliers}>
                {stats.outliers.length === 0 ? (
                  <Text type="secondary">—</Text>
                ) : (
                  <Text code>
                    {stats.outliers.map((v) => formatNumber(v)).join(', ')}
                  </Text>
                )}
              </Card>
            </Col>
          </Row>

          <Card title={t.title} style={{ marginTop: 16 }}>
            <Table
              columns={columns}
              dataSource={tableData}
              pagination={false}
              size="small"
              rowKey="key"
            />
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
