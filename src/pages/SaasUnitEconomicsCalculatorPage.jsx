import React, { useMemo, useState, useCallback } from 'react'
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
  Progress,
  Tooltip,
} from 'antd'
import {
  CalculatorOutlined,
  DollarOutlined,
  CopyOutlined,
  FileMarkdownOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import useCopyToClipboard from '../hooks/useCopyToClipboard'
import {
  calculateUnitEconomics,
  formatCurrency,
  formatPercent,
  formatMonths,
  healthSummary,
  PRESETS,
  exportMarkdown,
} from '../utils/saasUnitEconomicsCalculator'

const { Title, Paragraph, Text } = Typography
const { Panel } = Collapse

const sourceCode = `import {
  calculateUnitEconomics,
  formatCurrency,
  formatPercent,
} from '../utils/saasUnitEconomicsCalculator'

const metrics = calculateUnitEconomics({
  mrr: 120000,        // receita recorrente mensal
  customers: 200,     // clientes ativos
  cac: 3000,          // custo de aquisição
  grossMargin: 0.78,  // margem bruta (0..1)
  churn: 0.02,        // churn mensal (0..1)
  expansion: 0.01,  // expansão mensal (0..1)
})

// metrics: { arpu, grossProfitPerCustomer, ltv, ltvCac,
//            paybackMonths, arr, nrr, ... }
formatCurrency(metrics.ltv) // R$ ...
formatPercent(metrics.churnRate) // 2,00%
`

const translations = {
  pt: {
    title: 'Calculadora de Unit Economics de SaaS',
    subtitle: 'Métricas de saúde de assinatura',
    intro: 'Calcule as métricas essenciais de um negócio SaaS a partir do MRR, número de clientes, CAC, margem bruta, churn e expansão. A ferramenta mostra ARPU, LTV, relação LTV/CAC, payback do CAC, ARR e NRR aproximado, além de uma nota de saúde com base em benchmarks usuais.',
    mrr: 'MRR',
    customers: 'Clientes ativos',
    cac: 'CAC (custo de aquisição)',
    grossMargin: 'Margem bruta',
    churn: 'Churn mensal',
    expansion: 'Expansão mensal (upsell)',
    resultsTitle: 'Resultados',
    arpu: 'ARPU mensal',
    grossProfitPerCustomer: 'Lucro bruto / cliente',
    ltv: 'LTV (Lifetime Value)',
    ltvCac: 'LTV / CAC',
    payback: 'Payback do CAC',
    arr: 'ARR',
    nrr: 'NRR aproximado',
    healthTitle: 'Diagnóstico de saúde',
    healthScore: 'Pontuação de saúde',
    chartTitle: 'Comparativo de métricas',
    chartCac: 'CAC',
    chartArpu: 'ARPU',
    chartGrossProfit: 'Lucro bruto/cliente',
    chartLtv: 'LTV',
    presets: 'Exemplos rápidos',
    sourceTitle: 'Motor de cálculo',
    sourceIntro: 'O motor é puro JavaScript client-side — nenhum dado financeiro sai do navegador.',
    copyMarkdown: 'Copiar Markdown',
    copied: 'Copiado!',
    copyCode: 'Copiar código',
    emptyHint: 'Preencha MRR, clientes, CAC, margem bruta e churn com valores válidos.',
    monthSingular: 'mês',
    monthPlural: 'meses',
    ltvCacGood: 'LTV/CAC saudável (≥ 3)',
    ltvCacWarning: 'LTV/CAC razoável (1–3)',
    ltvCacBad: 'LTV/CAC baixo (< 1)',
    paybackGood: 'Payback curto (≤ 12 meses)',
    paybackWarning: 'Payback mediano (12–18 meses)',
    paybackBad: 'Payback longo (> 18 meses)',
    marginGood: 'Margem bruta forte (≥ 70%)',
    marginWarning: 'Margem bruta mediana (50–70%)',
    marginBad: 'Margem bruta baixa (< 50%)',
    churnGood: 'Churn baixo (≤ 5% ao mês)',
    churnWarning: 'Churn moderado (5–10%)',
    churnBad: 'Churn alto (> 10%)',
    metric: 'Métrica',
    value: 'Valor',
    good: 'Bom',
    warning: 'Atenção',
    bad: 'Crítico',
  },
  en: {
    title: 'SaaS Unit Economics Calculator',
    subtitle: 'Subscription health metrics',
    intro: 'Calculate the essential metrics of a SaaS business from MRR, active customers, CAC, gross margin, churn and expansion. The tool shows ARPU, LTV, LTV/CAC ratio, CAC payback, ARR and approximate NRR, plus a health score based on common benchmarks.',
    mrr: 'MRR',
    customers: 'Active customers',
    cac: 'CAC (customer acquisition cost)',
    grossMargin: 'Gross margin',
    churn: 'Monthly churn',
    expansion: 'Monthly expansion (upsell)',
    resultsTitle: 'Results',
    arpu: 'Monthly ARPU',
    grossProfitPerCustomer: 'Gross profit / customer',
    ltv: 'LTV (Lifetime Value)',
    ltvCac: 'LTV / CAC',
    payback: 'CAC payback',
    arr: 'ARR',
    nrr: 'Approximate NRR',
    healthTitle: 'Health diagnosis',
    healthScore: 'Health score',
    chartTitle: 'Metric comparison',
    chartCac: 'CAC',
    chartArpu: 'ARPU',
    chartGrossProfit: 'Gross profit/customer',
    chartLtv: 'LTV',
    presets: 'Quick examples',
    sourceTitle: 'Calculation engine',
    sourceIntro: 'The engine is pure client-side JavaScript — no financial data leaves the browser.',
    copyMarkdown: 'Copy Markdown',
    copied: 'Copied!',
    copyCode: 'Copy code',
    emptyHint: 'Fill in MRR, customers, CAC, gross margin and churn with valid values.',
    monthSingular: 'month',
    monthPlural: 'months',
    ltvCacGood: 'LTV/CAC healthy (≥ 3)',
    ltvCacWarning: 'LTV/CAC fair (1–3)',
    ltvCacBad: 'LTV/CAC low (< 1)',
    paybackGood: 'Short payback (≤ 12 months)',
    paybackWarning: 'Median payback (12–18 months)',
    paybackBad: 'Long payback (> 18 months)',
    marginGood: 'Strong gross margin (≥ 70%)',
    marginWarning: 'Median gross margin (50–70%)',
    marginBad: 'Low gross margin (< 50%)',
    churnGood: 'Low churn (≤ 5% per month)',
    churnWarning: 'Moderate churn (5–10%)',
    churnBad: 'High churn (> 10%)',
    metric: 'Metric',
    value: 'Value',
    good: 'Good',
    warning: 'Warning',
    bad: 'Critical',
  },
}

function statusColor(status) {
  if (status === 'good') return '#52c41a'
  if (status === 'warning') return '#faad14'
  return '#ff4d4f'
}

function ComparisonChart({ metrics, t }) {
  if (!metrics) return null
  const values = [
    { key: 'cac', label: t.chartCac, value: metrics.cac, color: '#ff4d4f' },
    { key: 'arpu', label: t.chartArpu, value: metrics.arpu, color: '#1890ff' },
    { key: 'grossProfit', label: t.chartGrossProfit, value: metrics.grossProfitPerCustomer, color: '#faad14' },
    { key: 'ltv', label: t.chartLtv, value: metrics.ltv ?? 0, color: '#52c41a' },
  ]
  const max = Math.max(...values.map((v) => v.value), 1)
  const width = 560
  const height = 220
  const padding = { top: 24, right: 24, bottom: 64, left: 24 }
  const chartWidth = width - padding.left - padding.right
  const barSlot = chartWidth / values.length
  const barWidth = Math.min(barSlot * 0.55, 80)

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', maxWidth: 640 }}>
      <line x1={padding.left} y1={height - padding.bottom} x2={width - padding.right} y2={height - padding.bottom} stroke="#d9d9d9" />
      {values.map((v, i) => {
        const x = padding.left + i * barSlot + (barSlot - barWidth) / 2
        const h = (v.value / max) * (height - padding.top - padding.bottom)
        const y = height - padding.bottom - h
        return (
          <g key={v.key}>
            <rect x={x} y={y} width={barWidth} height={h} fill={v.color} rx={4} opacity={0.9} />
            <text x={x + barWidth / 2} y={y - 8} textAnchor="middle" fontSize="11" fill="#374151">
              {formatCurrency(v.value)}
            </text>
            <text x={x + barWidth / 2} y={height - padding.bottom + 18} textAnchor="middle" fontSize="11" fill="#6b7280">
              {v.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

export default function SaasUnitEconomicsCalculatorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [mrr, setMrr] = useState(120000)
  const [customers, setCustomers] = useState(200)
  const [cac, setCac] = useState(3000)
  const [grossMargin, setGrossMargin] = useState(78)
  const [churn, setChurn] = useState(2)
  const [expansion, setExpansion] = useState(1)

  const [copiedMarkdown, copyMarkdown] = useCopyToClipboard()
  const [copiedCode, copyCode] = useCopyToClipboard()

  const metrics = useMemo(
    () => calculateUnitEconomics(mrr, customers, cac, grossMargin / 100, churn / 100, expansion / 100),
    [mrr, customers, cac, grossMargin, churn, expansion]
  )

  const health = useMemo(() => healthSummary(metrics, t), [metrics, t])

  const handlePreset = useCallback((preset) => {
    setMrr(preset.mrr)
    setCustomers(preset.customers)
    setCac(preset.cac)
    setGrossMargin(preset.grossMargin * 100)
    setChurn(preset.churn * 100)
    setExpansion(preset.expansion * 100)
  }, [])

  const handleCopyMarkdown = useCallback(() => {
    if (!metrics) return
    copyMarkdown(exportMarkdown(metrics, health, t))
  }, [copyMarkdown, metrics, health, t])

  const isValid = metrics !== null

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}>
        <CalculatorOutlined /> <DollarOutlined /> {t.title}
      </Title>
      <Paragraph type="secondary">{t.subtitle}</Paragraph>
      <Paragraph>{t.intro}</Paragraph>

      <Alert
        type="info"
        showIcon
        icon={<InfoCircleOutlined />}
        message={t.healthTitle}
        description={`LTV = ARPU × Margem bruta ÷ Churn · LTV/CAC ≥ 3 é saudável · Payback ≤ 12 meses é ideal.`}
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12} lg={8}>
          <Card size="small" title={t.mrr}>
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              step={1000}
              prefix="R$"
              value={mrr}
              onChange={(v) => setMrr(v ?? 0)}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
              parser={(value) => value.replace(/\./g, '').replace(',', '.')}
            />
          </Card>
        </Col>
        <Col xs={24} md={12} lg={8}>
          <Card size="small" title={t.customers}>
            <InputNumber
              style={{ width: '100%' }}
              min={1}
              step={10}
              value={customers}
              onChange={(v) => setCustomers(v ?? 1)}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
              parser={(value) => value.replace(/\./g, '').replace(',', '.')}
            />
          </Card>
        </Col>
        <Col xs={24} md={12} lg={8}>
          <Card size="small" title={t.cac}>
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              step={100}
              prefix="R$"
              value={cac}
              onChange={(v) => setCac(v ?? 0)}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
              parser={(value) => value.replace(/\./g, '').replace(',', '.')}
            />
          </Card>
        </Col>
        <Col xs={24} md={12} lg={8}>
          <Card size="small" title={t.grossMargin}>
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              max={100}
              step={1}
              suffix="%"
              value={grossMargin}
              onChange={(v) => setGrossMargin(v ?? 0)}
              formatter={(value) => `${value}`.replace('.', ',')}
              parser={(value) => value.replace(',', '.')}
            />
          </Card>
        </Col>
        <Col xs={24} md={12} lg={8}>
          <Card size="small" title={t.churn}>
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              max={100}
              step={0.5}
              suffix="%"
              value={churn}
              onChange={(v) => setChurn(v ?? 0)}
              formatter={(value) => `${value}`.replace('.', ',')}
              parser={(value) => value.replace(',', '.')}
            />
          </Card>
        </Col>
        <Col xs={24} md={12} lg={8}>
          <Card size="small" title={t.expansion}>
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              max={100}
              step={0.5}
              suffix="%"
              value={expansion}
              onChange={(v) => setExpansion(v ?? 0)}
              formatter={(value) => `${value}`.replace('.', ',')}
              parser={(value) => value.replace(',', '.')}
            />
          </Card>
        </Col>
      </Row>

      <Card size="small" title={t.presets}>
        <Space wrap>
          {PRESETS[lang].map((preset) => (
            <Button key={preset.name} size="small" onClick={() => handlePreset(preset)}>
              {preset.name}
            </Button>
          ))}
        </Space>
      </Card>

      {!isValid ? (
        <Alert type="warning" showIcon message={t.emptyHint} />
      ) : (
        <>
          <Card title={t.resultsTitle} size="small">
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} lg={8}>
                <Statistic title={t.arpu} value={formatCurrency(metrics.arpu)} />
              </Col>
              <Col xs={24} sm={12} lg={8}>
                <Statistic title={t.grossProfitPerCustomer} value={formatCurrency(metrics.grossProfitPerCustomer)} />
              </Col>
              <Col xs={24} sm={12} lg={8}>
                <Statistic
                  title={t.ltv}
                  value={metrics.ltv !== null ? formatCurrency(metrics.ltv) : '—'}
                  valueStyle={{ color: metrics.ltv !== null && metrics.ltv >= metrics.cac * 3 ? '#52c41a' : '#1890ff' }}
                />
              </Col>
              <Col xs={24} sm={12} lg={8}>
                <Statistic
                  title={t.ltvCac}
                  value={metrics.ltvCac !== null ? metrics.ltvCac.toFixed(2) : '—'}
                  valueStyle={{ color: metrics.ltvCac !== null && metrics.ltvCac >= 3 ? '#52c41a' : metrics.ltvCac !== null && metrics.ltvCac >= 1 ? '#faad14' : '#ff4d4f' }}
                />
              </Col>
              <Col xs={24} sm={12} lg={8}>
                <Statistic
                  title={t.payback}
                  value={metrics.paybackMonths !== null ? formatMonths(metrics.paybackMonths, t) : '—'}
                  valueStyle={{ color: metrics.paybackMonths !== null && metrics.paybackMonths <= 12 ? '#52c41a' : metrics.paybackMonths !== null && metrics.paybackMonths <= 18 ? '#faad14' : '#ff4d4f' }}
                />
              </Col>
              <Col xs={24} sm={12} lg={8}>
                <Statistic title={t.arr} value={formatCurrency(metrics.arr)} />
              </Col>
            </Row>
            <Row style={{ marginTop: 16 }}>
              <Col>
                <Text strong>{t.nrr}: </Text>
                <Tag color={metrics.nrr >= 1 ? 'green' : 'red'}>{formatPercent(metrics.nrr - 1)}</Tag>
              </Col>
            </Row>
          </Card>

          {health && (
            <Card title={t.healthTitle} size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <Progress
                    type="circle"
                    percent={Math.round((health.ratio) * 100)}
                    size={80}
                    strokeColor={health.ratio >= 0.75 ? '#52c41a' : health.ratio >= 0.5 ? '#faad14' : '#ff4d4f'}
                  />
                  <Text strong>{t.healthScore}</Text>
                </div>
                <Row gutter={[8, 8]} style={{ marginTop: 8 }}>
                  {health.checks.map((check) => (
                    <Col key={check.label}>
                      <Tooltip title={check.message}>
                        <Tag color={statusColor(check.status)} style={{ cursor: 'help' }}>
                          {check.label}: {check.status === 'good' ? t.good : check.status === 'warning' ? t.warning : t.bad}
                        </Tag>
                      </Tooltip>
                    </Col>
                  ))}
                </Row>
              </Space>
            </Card>
          )}

          <Card title={t.chartTitle} size="small">
            <ComparisonChart metrics={metrics} t={t} />
          </Card>

          <Button icon={<FileMarkdownOutlined />} onClick={handleCopyMarkdown}>
            {copiedMarkdown ? t.copied : t.copyMarkdown}
          </Button>
        </>
      )}

      <Collapse>
        <Panel header={t.sourceTitle} key="source">
          <Paragraph>{t.sourceIntro}</Paragraph>
          <Button icon={<CopyOutlined />} onClick={() => copyCode(sourceCode)} style={{ marginBottom: 16 }}>
            {copiedCode ? t.copied : t.copyCode}
          </Button>
          <pre style={{ background: '#f6f8fa', padding: 16, borderRadius: 8, overflow: 'auto' }}>
            <code>{sourceCode}</code>
          </pre>
        </Panel>
      </Collapse>
    </Space>
  )
}
