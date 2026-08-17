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
  Table,
  Tag,
} from 'antd'
import {
  CalculatorOutlined,
  InfoCircleOutlined,
  PlusOutlined,
  DeleteOutlined,
  SyncOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  PRESETS,
  calculateRegression,
  predict,
  formatNumber,
} from '../utils/linearRegressionCalculator'

const { Title, Paragraph, Text } = Typography
const { Panel } = Collapse

const sourceCode = `import { calculateRegression, predict } from '../utils/linearRegressionCalculator'

const points = [
  { x: 1, y: 2.1 },
  { x: 2, y: 4.0 },
  { x: 3, y: 6.2 },
  { x: 4, y: 7.8 },
]

const result = calculateRegression(points)
// {
//   ok: true,
//   n: 4,
//   slope: 1.93,
//   intercept: 0.15,
//   equation: 'y = 1.9300x + 0.1500',
//   r: 0.9987,
//   rSquared: 0.9973,
//   stdError: 0.1844,
//   predicted: [...]
// }

predict(result, 5) // ~9.8
`

const translations = {
  pt: {
    title: 'Calculadora de Regressão Linear',
    subtitle: 'Ajuste de mínimos quadrados, correlação e reta de regressão',
    intro: 'Insira pares de dados (x, y) para obter a reta de regressão linear pelo método dos mínimos quadrados. A ferramenta calcula inclinação, intercepto, coeficiente de correlação de Pearson (r), coeficiente de determinação (R²), erros padrão e desvio padrão dos resíduos — tudo no navegador.',
    pointsTitle: 'Pontos de dados',
    xLabel: 'x',
    yLabel: 'y',
    addPoint: 'Adicionar ponto',
    removePoint: 'Remover',
    clearAll: 'Limpar',
    presets: 'Cenários rápidos',
    resultsTitle: 'Resultados',
    n: 'Observações (n)',
    equation: 'Equação da reta',
    slope: 'Inclinação (β₁)',
    intercept: 'Intercepto (β₀)',
    correlation: 'Correlação de Pearson (r)',
    rSquared: 'Coeficiente de determinação (R²)',
    stdError: 'Erro padrão dos resíduos',
    slopeStdError: 'Erro padrão de β₁',
    interceptStdError: 'Erro padrão de β₀',
    direction: 'Direção',
    positive: 'Positiva',
    negative: 'Negativa',
    none: 'Nenhuma',
    strength: 'Força',
    weak: 'Fraca',
    moderate: 'Moderada',
    strong: 'Forte',
    chartTitle: 'Dispersão e reta de regressão',
    chartX: 'x',
    chartY: 'y',
    tableTitle: 'Valores previstos e resíduos',
    colX: 'x',
    colY: 'y',
    colPredicted: 'ŷ',
    colResidual: 'Resíduo',
    sourceTitle: 'Motor de cálculo',
    sourceIntro: 'O motor é puro JavaScript client-side — nenhum dado sai do navegador.',
    note: 'A regressão assume uma relação linear aproximada entre x e y. Valores ausentes ou não numéricos são ignorados.',
    invalid: 'Adicione pelo menos 2 pontos válidos e com variância em x.',
  },
  en: {
    title: 'Linear Regression Calculator',
    subtitle: 'Least-squares fit, correlation and regression line',
    intro: 'Enter (x, y) data pairs to compute the linear regression line using the least-squares method. The tool calculates slope, intercept, Pearson correlation coefficient (r), coefficient of determination (R²), standard errors and residual standard error — all in the browser.',
    pointsTitle: 'Data points',
    xLabel: 'x',
    yLabel: 'y',
    addPoint: 'Add point',
    removePoint: 'Remove',
    clearAll: 'Clear',
    presets: 'Quick scenarios',
    resultsTitle: 'Results',
    n: 'Observations (n)',
    equation: 'Line equation',
    slope: 'Slope (β₁)',
    intercept: 'Intercept (β₀)',
    correlation: 'Pearson correlation (r)',
    rSquared: 'Coefficient of determination (R²)',
    stdError: 'Residual standard error',
    slopeStdError: 'Std. error of β₁',
    interceptStdError: 'Std. error of β₀',
    direction: 'Direction',
    positive: 'Positive',
    negative: 'Negative',
    none: 'None',
    strength: 'Strength',
    weak: 'Weak',
    moderate: 'Moderate',
    strong: 'Strong',
    chartTitle: 'Scatter plot and regression line',
    chartX: 'x',
    chartY: 'y',
    tableTitle: 'Predicted values and residuals',
    colX: 'x',
    colY: 'y',
    colPredicted: 'ŷ',
    colResidual: 'Residual',
    sourceTitle: 'Calculation engine',
    sourceIntro: 'The engine is pure client-side JavaScript — no data leaves the browser.',
    note: 'Regression assumes an approximate linear relationship between x and y. Missing or non-numeric values are ignored.',
    invalid: 'Add at least 2 valid points with variance in x.',
  },
}

function describeCorrelation(r) {
  const abs = Math.abs(r)
  if (abs < 0.3) return { strength: 'weak', direction: r >= 0 ? 'positive' : 'negative' }
  if (abs < 0.7) return { strength: 'moderate', direction: r >= 0 ? 'positive' : 'negative' }
  return { strength: 'strong', direction: r >= 0 ? 'positive' : 'negative' }
}

function buildChartModel(points, result) {
  const xs = points.map((p) => p.x).filter(Number.isFinite)
  const ys = points.map((p) => p.y).filter(Number.isFinite)
  if (xs.length === 0 || ys.length === 0) return null

  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)

  const xPad = (maxX - minX) * 0.1 || 1
  const yPad = (maxY - minY) * 0.1 || 1

  const viewMinX = minX - xPad
  const viewMaxX = maxX + xPad
  const viewMinY = minY - yPad
  const viewMaxY = maxY + yPad

  const width = 500
  const height = 260
  const padding = { left: 50, right: 20, top: 20, bottom: 40 }
  const plotWidth = width - padding.left - padding.right
  const plotHeight = height - padding.top - padding.bottom

  const scaleX = (x) => padding.left + ((x - viewMinX) / (viewMaxX - viewMinX)) * plotWidth
  const scaleY = (y) => height - padding.bottom - ((y - viewMinY) / (viewMaxY - viewMinY)) * plotHeight

  return {
    width,
    height,
    padding,
    viewMinX,
    viewMaxX,
    viewMinY,
    viewMaxY,
    scaleX,
    scaleY,
    lineStart: result.ok ? { x: scaleX(viewMinX), y: scaleY(predict(result, viewMinX)) } : null,
    lineEnd: result.ok ? { x: scaleX(viewMaxX), y: scaleY(predict(result, viewMaxX)) } : null,
  }
}

export default function LinearRegressionCalculatorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [points, setPoints] = useState([
    { x: 1, y: 2 },
    { x: 2, y: 4 },
    { x: 3, y: 5 },
    { x: 4, y: 4 },
    { x: 5, y: 5 },
  ])

  const result = useMemo(() => calculateRegression(points), [points])
  const chart = useMemo(() => buildChartModel(points, result), [points, result])
  const corrDesc = useMemo(
    () => (result.ok ? describeCorrelation(result.r) : null),
    [result]
  )

  const updatePoint = (index, field, value) => {
    setPoints((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value === null || value === '' ? '' : Number(value) }
      return next
    })
  }

  const removePoint = (index) => {
    setPoints((prev) => prev.filter((_, i) => i !== index))
  }

  const addPoint = () => {
    setPoints((prev) => [...prev, { x: '', y: '' }])
  }

  const handlePreset = (preset) => {
    setPoints(preset.points.map((p) => ({ ...p })))
  }

  const columns = [
    { title: '#', render: (_, __, i) => i + 1, width: 40 },
    {
      title: t.colX,
      dataIndex: 'x',
      render: (_, record, index) => (
        <InputNumber
          size="small"
          value={record.x}
          onChange={(v) => updatePoint(index, 'x', v)}
          style={{ width: 120 }}
        />
      ),
    },
    {
      title: t.colY,
      dataIndex: 'y',
      render: (_, record, index) => (
        <InputNumber
          size="small"
          value={record.y}
          onChange={(v) => updatePoint(index, 'y', v)}
          style={{ width: 120 }}
        />
      ),
    },
    {
      title: '',
      key: 'action',
      width: 60,
      render: (_, __, index) => (
        <Button
          size="small"
          icon={<DeleteOutlined />}
          danger
          onClick={() => removePoint(index)}
        />
      ),
    },
  ]

  const residualColumns = [
    { title: t.colX, dataIndex: 'x', render: (v) => formatNumber(v, 2) },
    { title: t.colY, dataIndex: 'y', render: (v) => formatNumber(v, 2) },
    { title: t.colPredicted, dataIndex: 'yHat', render: (v) => formatNumber(v, 2) },
    { title: t.colResidual, dataIndex: 'residual', render: (v) => formatNumber(v, 2) },
  ]

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      <Title level={2}>
        <CalculatorOutlined style={{ marginRight: 12 }} />
        {t.title}
      </Title>
      <Paragraph type="secondary" style={{ marginTop: -8, marginBottom: 24 }}>
        {t.subtitle}
      </Paragraph>
      <Paragraph>{t.intro}</Paragraph>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card title={t.pointsTitle}>
            <Table
              dataSource={points.map((p, i) => ({ ...p, key: i }))}
              columns={columns}
              pagination={false}
              size="small"
              locale={{ emptyText: lang === 'pt' ? 'Nenhum ponto' : 'No points' }}
            />
            <Space style={{ marginTop: 16 }} wrap>
              <Button icon={<PlusOutlined />} onClick={addPoint}>
                {t.addPoint}
              </Button>
              <Button icon={<SyncOutlined />} onClick={() => setPoints([{ x: '', y: '' }, { x: '', y: '' }])}>
                {t.clearAll}
              </Button>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card title={t.resultsTitle}>
            {!result.ok ? (
              <Alert type="warning" showIcon icon={<InfoCircleOutlined />} message={t.invalid} />
            ) : (
              <Space direction="vertical" style={{ width: '100%' }} size="large">
                <Row gutter={[12, 12]}>
                  <Col span={12}>
                    <Statistic title={t.n} value={result.n} />
                  </Col>
                  <Col span={12}>
                    <Statistic title={t.equation} value={result.equation} valueStyle={{ fontSize: 14 }} />
                  </Col>
                  <Col span={12}>
                    <Statistic title={t.slope} value={formatNumber(result.slope)} />
                  </Col>
                  <Col span={12}>
                    <Statistic title={t.intercept} value={formatNumber(result.intercept)} />
                  </Col>
                  <Col span={12}>
                    <Statistic title={t.correlation} value={formatNumber(result.r)} />
                  </Col>
                  <Col span={12}>
                    <Statistic title={t.rSquared} value={formatNumber(result.rSquared)} />
                  </Col>
                  <Col span={12}>
                    <Statistic title={t.stdError} value={formatNumber(result.stdError)} />
                  </Col>
                  <Col span={12}>
                    <Statistic title={t.slopeStdError} value={formatNumber(result.slopeStdError)} />
                  </Col>
                </Row>

                {corrDesc && (
                  <Space wrap>
                    <Text>{t.direction}:</Text>
                    <Tag color={corrDesc.direction === 'positive' ? 'green' : 'red'}>
                      {t[corrDesc.direction]}
                    </Tag>
                    <Text>{t.strength}:</Text>
                    <Tag color={corrDesc.strength === 'strong' ? 'blue' : corrDesc.strength === 'moderate' ? 'orange' : 'default'}>
                      {t[corrDesc.strength]}
                    </Tag>
                  </Space>
                )}
              </Space>
            )}
          </Card>
        </Col>
      </Row>

      <Card style={{ marginTop: 16 }} title={t.presets}>
        <Space wrap>
          {PRESETS.map((preset) => (
            <Button key={preset.key} size="small" onClick={() => handlePreset(preset)}>
              {preset.label[lang]}
            </Button>
          ))}
        </Space>
      </Card>

      {chart && result.ok && (
        <Card style={{ marginTop: 16 }} title={t.chartTitle}>
          <svg viewBox={`0 0 ${chart.width} ${chart.height}`} width="100%" height={chart.height} role="img" aria-label={t.chartTitle}>
            {/* axes */}
            <line x1={chart.padding.left} y1={chart.height - chart.padding.bottom} x2={chart.width - chart.padding.right} y2={chart.height - chart.padding.bottom} stroke="#d9d9d9" strokeWidth={2} />
            <line x1={chart.padding.left} y1={chart.padding.top} x2={chart.padding.left} y2={chart.height - chart.padding.bottom} stroke="#d9d9d9" strokeWidth={2} />

            {/* x label */}
            <text x={(chart.padding.left + chart.width - chart.padding.right) / 2} y={chart.height - 8} textAnchor="middle" fill="#8c8c8c" fontSize="12">
              {t.chartX}
            </text>

            {/* y label */}
            <text x={18} y={chart.height / 2} textAnchor="middle" fill="#8c8c8c" fontSize="12" transform={`rotate(-90 18 ${chart.height / 2})`}>
              {t.chartY}
            </text>

            {/* x ticks */}
            {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
              const x = chart.padding.left + tick * (chart.width - chart.padding.left - chart.padding.right)
              const value = chart.viewMinX + tick * (chart.viewMaxX - chart.viewMinX)
              return (
                <g key={`x-${tick}`}>
                  <line x1={x} y1={chart.height - chart.padding.bottom} x2={x} y2={chart.height - chart.padding.bottom + 5} stroke="#d9d9d9" />
                  <text x={x} y={chart.height - chart.padding.bottom + 18} textAnchor="middle" fill="#8c8c8c" fontSize="10">
                    {formatNumber(value, 1)}
                  </text>
                </g>
              )
            })}

            {/* y ticks */}
            {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
              const y = chart.height - chart.padding.bottom - tick * (chart.height - chart.padding.top - chart.padding.bottom)
              const value = chart.viewMinY + tick * (chart.viewMaxY - chart.viewMinY)
              return (
                <g key={`y-${tick}`}>
                  <line x1={chart.padding.left - 5} y1={y} x2={chart.padding.left} y2={y} stroke="#d9d9d9" />
                  <text x={chart.padding.left - 10} y={y + 4} textAnchor="end" fill="#8c8c8c" fontSize="10">
                    {formatNumber(value, 1)}
                  </text>
                </g>
              )
            })}

            {/* regression line */}
            {chart.lineStart && chart.lineEnd && (
              <line
                x1={chart.lineStart.x}
                y1={chart.lineStart.y}
                x2={chart.lineEnd.x}
                y2={chart.lineEnd.y}
                stroke="#1677ff"
                strokeWidth={2}
              />
            )}

            {/* points */}
            {points.map((p, i) => {
              if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) return null
              const cx = chart.scaleX(p.x)
              const cy = chart.scaleY(p.y)
              return (
                <g key={`pt-${i}`}>
                  <circle cx={cx} cy={cy} r={5} fill="#faad14" stroke="#fff" strokeWidth={2} />
                </g>
              )
            })}
          </svg>
        </Card>
      )}

      {result.ok && (
        <Card style={{ marginTop: 16 }} title={t.tableTitle}>
          <Table
            dataSource={result.predicted.map((p, i) => ({ ...p, key: i }))}
            columns={residualColumns}
            pagination={false}
            size="small"
          />
        </Card>
      )}

      <Alert type="info" showIcon icon={<InfoCircleOutlined />} message={t.note} style={{ marginTop: 16 }} />

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
