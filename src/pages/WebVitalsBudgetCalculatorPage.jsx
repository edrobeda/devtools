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
  Table,
  Tooltip,
  Switch,
} from 'antd'
import {
  DashboardOutlined,
  InfoCircleOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
  CopyOutlined,
  DownloadOutlined,
  SyncOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  METRICS,
  calculateWebVitalsBudget,
  getPresets,
  getMetricMeta,
  buildReport,
  formatNumber,
} from '../utils/webVitalsBudgetCalculator'

const { Title, Paragraph, Text } = Typography
const { Panel } = Collapse

const sourceCode = `import { calculateWebVitalsBudget } from '../utils/webVitalsBudgetCalculator'

// Passe valores medidos e, opcionalmente, budgets customizados.
calculateWebVitalsBudget(
  { lcp: 2.5, inp: 200, cls: 0.1, ttfb: 800, fcp: 1.8 },
  { lcp: 2.0, inp: 150 } // budgets opcionais
)
// {
//   overallScore: 78.4,
//   overallTier: 'needs-improvement',
//   metrics: [ ... ],
//   goodCount: 2,
//   poorCount: 1
// }
`

const tierColors = {
  good: '#52c41a',
  'needs-improvement': '#faad14',
  poor: '#ff4d4f',
  missing: '#bfbfbf',
}

const tierIcons = {
  good: <CheckCircleOutlined />,
  'needs-improvement': <InfoCircleOutlined />,
  poor: <InfoCircleOutlined />,
  missing: null,
}

const translations = {
  pt: {
    title: 'Calculadora de Orçamento de Web Vitals',
    subtitle: 'Avalie suas métricas contra os thresholds do Core Web Vitals',
    intro:
      'Insira os valores medidos da sua página (LCP, INP, CLS, TTFB, FCP, TTI, FID). A ferramenta compara com os thresholds oficiais do Google e, opcionalmente, com budgets customizados, devolvendo uma nota geral e o quanto cada métrica precisa melhorar para atingir o tier "good".',
    inputs: 'Métricas medidas',
    budgets: 'Budgets customizados',
    budgetHelp: 'Ative para sobrescrever o threshold padrão desta métrica.',
    results: 'Resultados',
    overallScore: 'Pontuação geral',
    overallTier: 'Classificação geral',
    good: 'Bom',
    needsImprovement: 'Precisa melhorar',
    poor: 'Ruim',
    missing: 'Não informado',
    presentCount: 'Métricas preenchidas',
    goodCount: 'Métricas boas',
    poorCount: 'Métricas ruins',
    presets: 'Exemplos de um clique',
    tableTitle: 'Breakdown por métrica',
    metricColumn: 'Métrica',
    valueColumn: 'Valor medido',
    budgetColumn: 'Budget',
    tierColumn: 'Tier',
    ratioColumn: 'Uso do budget',
    improvementColumn: 'Melhoria para "good"',
    chartTitle: 'Uso do budget por métrica',
    chartLegendGood: 'good',
    chartLegendPoor: 'poor',
    formula: 'Thresholds oficiais',
    formulaText:
      'LCP ≤ 2,5 s / ≤ 4,0 s; INP ≤ 200 ms / ≤ 500 ms; CLS ≤ 0,10 / ≤ 0,25; TTFB ≤ 800 ms / ≤ 1.800 ms; FCP ≤ 1,8 s / ≤ 3,0 s; TTI ≤ 3,8 s / ≤ 7,3 s; FID ≤ 100 ms / ≤ 300 ms. Quando um budget customizado está ativo, ele substitui o valor "good" e "poor" é 1,6× o budget.',
    clear: 'Limpar',
    sourceTitle: 'Motor de cálculo',
    sourceIntro: 'O motor é puro JavaScript client-side — nenhum dado sai do navegador.',
    copyReport: 'Copiar relatório',
    downloadReport: 'Baixar relatório',
    copied: 'Copiado!',
  },
  en: {
    title: 'Web Vitals Budget Calculator',
    subtitle: 'Score your metrics against Core Web Vitals thresholds',
    intro:
      'Enter your page measurements (LCP, INP, CLS, TTFB, FCP, TTI, FID). The tool compares them to Google\'s official thresholds and, optionally, custom budgets, returning an overall score and how much each metric needs to improve to reach the "good" tier.',
    inputs: 'Measured metrics',
    budgets: 'Custom budgets',
    budgetHelp: 'Enable to override the default threshold for this metric.',
    results: 'Results',
    overallScore: 'Overall score',
    overallTier: 'Overall tier',
    good: 'Good',
    needsImprovement: 'Needs improvement',
    poor: 'Poor',
    missing: 'Not provided',
    presentCount: 'Metrics filled',
    goodCount: 'Good metrics',
    poorCount: 'Poor metrics',
    presets: 'One-click examples',
    tableTitle: 'Metric breakdown',
    metricColumn: 'Metric',
    valueColumn: 'Measured value',
    budgetColumn: 'Budget',
    tierColumn: 'Tier',
    ratioColumn: 'Budget used',
    improvementColumn: 'Improvement to "good"',
    chartTitle: 'Budget usage by metric',
    chartLegendGood: 'good',
    chartLegendPoor: 'poor',
    formula: 'Official thresholds',
    formulaText:
      'LCP ≤ 2.5 s / ≤ 4.0 s; INP ≤ 200 ms / ≤ 500 ms; CLS ≤ 0.10 / ≤ 0.25; TTFB ≤ 800 ms / ≤ 1,800 ms; FCP ≤ 1.8 s / ≤ 3.0 s; TTI ≤ 3.8 s / ≤ 7.3 s; FID ≤ 100 ms / ≤ 300 ms. When a custom budget is enabled, it replaces the "good" threshold and "poor" becomes 1.6× the budget.',
    clear: 'Clear',
    sourceTitle: 'Calculation engine',
    sourceIntro: 'The engine is pure client-side JavaScript — no data leaves the browser.',
    copyReport: 'Copy report',
    downloadReport: 'Download report',
    copied: 'Copied!',
  },
}

export default function WebVitalsBudgetCalculatorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const meta = getMetricMeta(lang)

  const [inputs, setInputs] = useState({
    lcp: 2.5,
    inp: 200,
    cls: 0.1,
    ttfb: 800,
    fcp: 1.8,
    tti: 3.8,
    fid: 100,
  })

  const [useBudgets, setUseBudgets] = useState({
    lcp: false,
    inp: false,
    cls: false,
    ttfb: false,
    fcp: false,
    tti: false,
    fid: false,
  })

  const [budgets, setBudgets] = useState({
    lcp: 2.0,
    inp: 150,
    cls: 0.08,
    ttfb: 600,
    fcp: 1.5,
    tti: 3.0,
    fid: 80,
  })

  const [copied, setCopied] = useState(false)

  const activeBudgets = useMemo(() => {
    const result = {}
    METRICS.forEach((m) => {
      if (useBudgets[m.key]) result[m.key] = budgets[m.key]
    })
    return result
  }, [useBudgets, budgets])

  const result = useMemo(
    () => calculateWebVitalsBudget(inputs, activeBudgets),
    [inputs, activeBudgets]
  )

  const presets = useMemo(() => getPresets(lang), [lang])

  const handleInputChange = (key, value) => {
    setInputs((prev) => ({ ...prev, [key]: value }))
  }

  const handleBudgetToggle = (key, checked) => {
    setUseBudgets((prev) => ({ ...prev, [key]: checked }))
  }

  const handleBudgetChange = (key, value) => {
    setBudgets((prev) => ({ ...prev, [key]: value }))
  }

  const handlePreset = (preset) => {
    setInputs(preset.inputs)
    setUseBudgets({
      lcp: false,
      inp: false,
      cls: false,
      ttfb: false,
      fcp: false,
      tti: false,
      fid: false,
    })
    setBudgets({
      lcp: 2.0,
      inp: 150,
      cls: 0.08,
      ttfb: 600,
      fcp: 1.5,
      tti: 3.0,
      fid: 80,
    })
  }

  const clearAll = () => {
    setInputs({
      lcp: null,
      inp: null,
      cls: null,
      ttfb: null,
      fcp: null,
      tti: null,
      fid: null,
    })
    setUseBudgets({
      lcp: false,
      inp: false,
      cls: false,
      ttfb: false,
      fcp: false,
      tti: false,
      fid: false,
    })
  }

  const report = useMemo(() => buildReport(result, lang), [result, lang])

  const copyReport = async () => {
    try {
      await navigator.clipboard.writeText(report)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // ignore
    }
  }

  const downloadReport = () => {
    const blob = new Blob([report], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'web-vitals-budget-report.md'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const tierLabel = (tier) => {
    if (tier === 'good') return t.good
    if (tier === 'needs-improvement') return t.needsImprovement
    if (tier === 'poor') return t.poor
    return t.missing
  }

  const columns = [
    {
      title: t.metricColumn,
      dataIndex: 'key',
      render: (key) => <Text strong>{meta[key]}</Text>,
    },
    {
      title: t.valueColumn,
      dataIndex: 'rawValue',
      render: (value, record) => {
        if (value === null || value === undefined) return '—'
        if (record.unit === 'score') return formatNumber(value, 3)
        if (record.unit === 's') return `${formatNumber(value, 2)} s`
        return `${formatNumber(value, 0)} ms`
      },
    },
    {
      title: t.budgetColumn,
      dataIndex: 'budget',
      render: (value, record) => {
        if (value === null) return '—'
        if (record.unit === 'score') return formatNumber(value, 3)
        if (record.unit === 's') return `${formatNumber(value / 1000, 2)} s`
        return `${formatNumber(value, 0)} ms`
      },
    },
    {
      title: t.tierColumn,
      dataIndex: 'tier',
      render: (tier) => (
        <Tag color={tierColors[tier]} icon={tierIcons[tier]}>
          {tierLabel(tier)}
        </Tag>
      ),
    },
    {
      title: t.ratioColumn,
      dataIndex: 'ratio',
      render: (value, record) => {
        if (record.tier === 'missing') return '—'
        const pct = value * 100
        return (
          <Text style={{ color: pct <= 100 ? '#52c41a' : '#ff4d4f' }}>
            {formatNumber(pct, 0)}%
          </Text>
        )
      },
    },
    {
      title: t.improvementColumn,
      dataIndex: 'improvement',
      render: (value, record) => {
        if (record.tier === 'missing') return '—'
        if (value === 0) return <Text type="success">OK</Text>
        if (record.internalUnit === 'score') return `${formatNumber(value, 3)}`
        if (record.internalUnit === 'ms') return `${formatNumber(value, 0)} ms`
        return formatNumber(value, 2)
      },
    },
  ]

  const chartData = result.metrics.filter((m) => m.tier !== 'missing')
  const width = 640
  const height = 280
  const padding = { top: 24, right: 24, bottom: 64, left: 80 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom
  const barCount = chartData.length || 1
  const groupGap = 24
  const barWidth = (chartWidth - groupGap * (barCount + 1)) / barCount
  const maxRatio = Math.max(1, ...chartData.map((d) => d.ratio || 0))

  return (
    <div style={{ padding: 24, maxWidth: 960, margin: '0 auto' }}>
      <Title level={2}>
        <DashboardOutlined style={{ marginRight: 12 }} />
        {t.title}
      </Title>
      <Paragraph type="secondary" style={{ marginTop: -8, marginBottom: 24 }}>
        {t.subtitle}
      </Paragraph>
      <Paragraph>{t.intro}</Paragraph>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card title={t.inputs}>
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              {METRICS.map((m) => (
                <div key={m.key}>
                  <Text strong>{meta[m.key]}</Text>
                  <Text type="secondary" style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>
                    {meta[`${m.key}Desc`]}
                  </Text>
                  <InputNumber
                    style={{ width: '100%' }}
                    min={0}
                    step={m.unit === 'score' ? 0.01 : m.unit === 's' ? 0.1 : 10}
                    value={inputs[m.key]}
                    onChange={(v) => handleInputChange(m.key, v ?? null)}
                    placeholder={m.unit === 'score' ? '0.10' : m.unit === 's' ? '2.5 s' : '200 ms'}
                    addonAfter={m.unit === 'score' ? 'score' : m.unit}
                  />
                </div>
              ))}
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card title={t.budgets}>
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <Alert type="info" showIcon message={t.budgetHelp} style={{ marginBottom: 8 }} />
              {METRICS.map((m) => (
                <Row key={m.key} gutter={16} align="middle">
                  <Col flex="none">
                    <Switch
                      size="small"
                      checked={useBudgets[m.key]}
                      onChange={(checked) => handleBudgetToggle(m.key, checked)}
                    />
                  </Col>
                  <Col flex="80px">
                    <Text strong>{meta[m.key]}</Text>
                  </Col>
                  <Col flex="auto">
                    <InputNumber
                      style={{ width: '100%' }}
                      min={0}
                      step={m.unit === 'score' ? 0.01 : m.unit === 's' ? 0.1 : 10}
                      value={budgets[m.key]}
                      disabled={!useBudgets[m.key]}
                      onChange={(v) => handleBudgetChange(m.key, v ?? 0)}
                      addonAfter={m.unit === 'score' ? 'score' : m.unit}
                    />
                  </Col>
                </Row>
              ))}
            </Space>
          </Card>

          <Card style={{ marginTop: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <Text strong style={{ fontSize: 18, display: 'block' }}>
                {t.results}
              </Text>
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Statistic
                    title={t.overallScore}
                    value={`${formatNumber(result.overallScore, 1)}/100`}
                    valueStyle={{ color: tierColors[result.overallTier] }}
                    prefix={<ThunderboltOutlined />}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title={t.overallTier}
                    value={tierLabel(result.overallTier)}
                    valueStyle={{ color: tierColors[result.overallTier] }}
                    prefix={tierIcons[result.overallTier]}
                  />
                </Col>
                <Col span={8}>
                  <Statistic title={t.presentCount} value={result.presentCount} />
                </Col>
                <Col span={8}>
                  <Statistic
                    title={t.goodCount}
                    value={result.goodCount}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title={t.poorCount}
                    value={result.poorCount}
                    valueStyle={{ color: '#ff4d4f' }}
                  />
                </Col>
              </Row>
            </Space>
          </Card>
        </Col>
      </Row>

      <Card style={{ marginTop: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Text strong>{t.presets}</Text>
          <Space wrap>
            {presets.map((preset) => (
              <Tooltip key={preset.key} title={preset.desc}>
                <Button size="small" onClick={() => handlePreset(preset)}>
                  {preset.label}
                </Button>
              </Tooltip>
            ))}
          </Space>
          <Button icon={<SyncOutlined />} size="small" onClick={clearAll}>
            {t.clear}
          </Button>
        </Space>
      </Card>

      <Card style={{ marginTop: 16 }} title={t.tableTitle}>
        <Table
          dataSource={result.metrics}
          columns={columns}
          pagination={false}
          size="small"
          rowKey="key"
        />
      </Card>

      <Card style={{ marginTop: 16 }} title={t.chartTitle}>
        <div style={{ overflowX: 'auto' }}>
          <svg
            viewBox={`0 0 ${width} ${height}`}
            width="100%"
            style={{ minWidth: 320, maxWidth: width }}
            role="img"
            aria-label={t.chartTitle}
          >
            {/* eixos */}
            <line
              x1={padding.left}
              y1={padding.top + chartHeight}
              x2={padding.left + chartWidth}
              y2={padding.top + chartHeight}
              stroke="#d9d9d9"
              strokeWidth={1}
            />
            <line
              x1={padding.left}
              y1={padding.top}
              x2={padding.left}
              y2={padding.top + chartHeight}
              stroke="#d9d9d9"
              strokeWidth={1}
            />
            {/* grid horizontal */}
            {[0, 0.5, 1, 1.5].map((ratio) => {
              const y = padding.top + chartHeight - (ratio / maxRatio) * chartHeight
              return (
                <g key={ratio}>
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={padding.left + chartWidth}
                    y2={y}
                    stroke="#f0f0f0"
                    strokeWidth={1}
                  />
                  <text
                    x={padding.left - 8}
                    y={y + 4}
                    textAnchor="end"
                    fontSize={10}
                    fill="#8c8c8c"
                  >
                    {formatNumber(ratio * 100, 0)}%
                  </text>
                </g>
              )
            })}
            {/* linha de 100% do budget */}
            <line
              x1={padding.left}
              y1={padding.top + chartHeight - (1 / maxRatio) * chartHeight}
              x2={padding.left + chartWidth}
              y2={padding.top + chartHeight - (1 / maxRatio) * chartHeight}
              stroke="#52c41a"
              strokeWidth={1}
              strokeDasharray="4 4"
            />
            <text
              x={padding.left + chartWidth - 4}
              y={padding.top + chartHeight - (1 / maxRatio) * chartHeight - 6}
              textAnchor="end"
              fontSize={10}
              fill="#52c41a"
            >
              {t.chartLegendGood}
            </text>
            {/* linha de poor */}
            {maxRatio >= 1.6 && (
              <>
                <line
                  x1={padding.left}
                  y1={padding.top + chartHeight - (1.6 / maxRatio) * chartHeight}
                  x2={padding.left + chartWidth}
                  y2={padding.top + chartHeight - (1.6 / maxRatio) * chartHeight}
                  stroke="#ff4d4f"
                  strokeWidth={1}
                  strokeDasharray="4 4"
                />
                <text
                  x={padding.left + chartWidth - 4}
                  y={padding.top + chartHeight - (1.6 / maxRatio) * chartHeight - 6}
                  textAnchor="end"
                  fontSize={10}
                  fill="#ff4d4f"
                >
                  {t.chartLegendPoor}
                </text>
              </>
            )}
            {/* barras */}
            {chartData.map((d, i) => {
              const x = padding.left + groupGap + i * (barWidth + groupGap)
              const h = Math.min(chartHeight, ((d.ratio || 0) / maxRatio) * chartHeight)
              const color = tierColors[d.tier]
              return (
                <g key={d.key}>
                  <rect
                    x={x}
                    y={padding.top + chartHeight - h}
                    width={Math.max(4, barWidth)}
                    height={h}
                    fill={color}
                    rx={4}
                    opacity={0.85}
                  />
                  <text
                    x={x + barWidth / 2}
                    y={padding.top + chartHeight + 18}
                    textAnchor="middle"
                    fontSize={10}
                    fill="#595959"
                  >
                    {meta[d.key]}
                  </text>
                </g>
              )
            })}
            {chartData.length === 0 && (
              <text
                x={padding.left + chartWidth / 2}
                y={padding.top + chartHeight / 2}
                textAnchor="middle"
                fontSize={12}
                fill="#8c8c8c"
              >
                {t.missing}
              </text>
            )}
          </svg>
        </div>
      </Card>

      <Alert
        type="info"
        showIcon
        icon={<InfoCircleOutlined />}
        message={t.formula}
        description={t.formulaText}
        style={{ marginTop: 16 }}
      />

      <Card style={{ marginTop: 16 }}>
        <Space wrap>
          <Button icon={<CopyOutlined />} onClick={copyReport}>
            {copied ? t.copied : t.copyReport}
          </Button>
          <Button icon={<DownloadOutlined />} onClick={downloadReport}>
            {t.downloadReport}
          </Button>
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
