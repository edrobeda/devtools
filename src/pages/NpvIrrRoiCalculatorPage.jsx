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
  Table,
  Tooltip,
} from 'antd'
import {
  CalculatorOutlined,
  PlusOutlined,
  DeleteOutlined,
  CopyOutlined,
  FileMarkdownOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import useCopyToClipboard from '../hooks/useCopyToClipboard'
import {
  calculateSummary,
  buildCashFlowTable,
  formatCurrency,
  formatPercent,
  makeCashFlow,
  PRESETS,
  PERIOD_TYPES,
  exportMarkdown,
} from '../utils/npvIrrRoiCalculator'

const { Title, Paragraph, Text } = Typography
const { Panel } = Collapse

const sourceCode = `import {
  calculateSummary,
  buildCashFlowTable,
  calculateNpv,
  calculateIrr,
  calculateRoi,
} from '../utils/npvIrrRoiCalculator'

// Investimento inicial de R$ 100.000 com fluxos anuais
const initialInvestment = 100000
const cashFlows = [30000, 40000, 50000, 45000]
const discountRate = 0.10 // 10% ao ano

const summary = calculateSummary(discountRate, initialInvestment, cashFlows)
// { npv, irr, roi, payback, discountedPayback, totalReturn, netProfit }

const table = buildCashFlowTable(discountRate, initialInvestment, cashFlows)
// [{ period, cashFlow, presentValue, accumulatedPv, accumulatedNominal }, ...]

formatCurrency(summary.npv)   // R$ ...
formatPercent(summary.irr)    // xx,xx%
`

const translations = {
  pt: {
    title: 'Calculadora de VPL, TIR e ROI',
    subtitle: 'Avaliação de investimentos',
    intro: 'Avalie a viabilidade financeira de um investimento projetado. Informe o investimento inicial, a taxa de desconto e os fluxos de caixa período a período para obter o VPL (Valor Presente Líquido), a TIR (Taxa Interna de Retorno), o ROI e os paybacks simples e descontado.',
    rateLabel: 'Taxa de desconto por período',
    investmentLabel: 'Investimento inicial',
    periodTypeLabel: 'Período',
    periodsLabel: 'Fluxos de caixa',
    period: 'Período',
    cashFlow: 'Fluxo de caixa',
    addPeriod: 'Adicionar período',
    removePeriod: 'Remover',
    presets: 'Exemplos rápidos',
    summaryTitle: 'Resultados',
    npv: 'VPL',
    irr: 'TIR',
    roi: 'ROI',
    payback: 'Payback simples',
    discountedPayback: 'Payback descontado',
    totalReturn: 'Retorno total',
    netProfit: 'Lucro líquido',
    chartTitle: 'Fluxos de caixa e acumulado descontado',
    chartCashFlow: 'Fluxo do período',
    chartAccumulated: 'VPL acumulado',
    tableTitle: 'Tabela de fluxos de caixa',
    periodCol: 'Período',
    cashFlowCol: 'Fluxo de caixa',
    presentValueCol: 'Valor presente',
    accumulatedPvCol: 'VPL acumulado',
    sourceTitle: 'Motor de cálculo',
    sourceIntro: 'O motor é puro JavaScript client-side — nenhum dado financeiro sai do navegador.',
    formulaTitle: 'Fórmulas usadas',
    formulaText: 'VPL = -I₀ + Σ CFₜ / (1 + r)ᵗ · TIR = taxa em que VPL = 0 · ROI = (Σ CFₜ - I₀) / I₀ · Payback = período em que o acumulado zera',
    emptyHint: 'Preencha um investimento inicial positivo e ao menos um fluxo de caixa válido.',
    invalidIrr: 'TIR não encontrada',
    invalidPayback: 'Não recupera',
    copyMarkdown: 'Copiar Markdown',
    copied: 'Copiado!',
    copyCode: 'Copiar código',
    year: 'ano',
    years: 'anos',
    month: 'mês',
    months: 'meses',
  },
  en: {
    title: 'NPV, IRR & ROI Calculator',
    subtitle: 'Investment appraisal',
    intro: 'Evaluate the financial viability of a projected investment. Enter the initial investment, discount rate and period-by-period cash flows to get the NPV (Net Present Value), IRR (Internal Rate of Return), ROI and both simple and discounted payback periods.',
    rateLabel: 'Discount rate per period',
    investmentLabel: 'Initial investment',
    periodTypeLabel: 'Period',
    periodsLabel: 'Cash flows',
    period: 'Period',
    cashFlow: 'Cash flow',
    addPeriod: 'Add period',
    removePeriod: 'Remove',
    presets: 'Quick examples',
    summaryTitle: 'Results',
    npv: 'NPV',
    irr: 'IRR',
    roi: 'ROI',
    payback: 'Simple payback',
    discountedPayback: 'Discounted payback',
    totalReturn: 'Total return',
    netProfit: 'Net profit',
    chartTitle: 'Cash flows and discounted accumulated NPV',
    chartCashFlow: 'Period cash flow',
    chartAccumulated: 'Accumulated NPV',
    tableTitle: 'Cash flow table',
    periodCol: 'Period',
    cashFlowCol: 'Cash flow',
    presentValueCol: 'Present value',
    accumulatedPvCol: 'Accumulated NPV',
    sourceTitle: 'Calculation engine',
    sourceIntro: 'The engine is pure client-side JavaScript — no financial data leaves the browser.',
    formulaTitle: 'Formulas used',
    formulaText: 'NPV = -I₀ + Σ CFₜ / (1 + r)ᵗ · IRR = rate where NPV = 0 · ROI = (Σ CFₜ - I₀) / I₀ · Payback = period when accumulated value crosses zero',
    emptyHint: 'Fill in a positive initial investment and at least one valid cash flow.',
    invalidIrr: 'IRR not found',
    invalidPayback: 'Does not pay back',
    copyMarkdown: 'Copy Markdown',
    copied: 'Copied!',
    copyCode: 'Copy code',
    year: 'year',
    years: 'years',
    month: 'month',
    months: 'months',
  },
}

function CashFlowChart({ table, t }) {
  if (table.length <= 1) return null
  const width = 640
  const height = 260
  const padding = { top: 24, right: 24, bottom: 48, left: 64 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  const maxAbs = Math.max(
    Math.abs(Math.min(...table.map((r) => r.cashFlow))),
    Math.max(...table.map((r) => r.cashFlow)),
    1
  )
  const maxAccumulated = Math.max(...table.map((r) => r.accumulatedPv), 1)
  const minAccumulated = Math.min(...table.map((r) => r.accumulatedPv), 0)

  const n = table.length
  const stepX = n > 1 ? chartWidth / (n - 1) : 0

  const yTicks = 5
  const yMax = Math.max(maxAbs, maxAccumulated)
  const yMin = Math.min(-maxAbs, minAccumulated)
  const yRange = yMax - yMin || 1

  const yFor = (value) => padding.top + chartHeight - ((value - yMin) / yRange) * chartHeight
  const xFor = (index) => padding.left + index * stepX

  const yTickValues = Array.from({ length: yTicks + 1 }, (_, i) => yMin + (yRange / yTicks) * i)

  const linePoints = table.map((row, i) => `${xFor(i)},${yFor(row.accumulatedPv)}`).join(' ')

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', maxWidth: 720 }}>
      {yTickValues.map((v, i) => {
        const y = yFor(v)
        return (
          <g key={i}>
            <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#e5e7eb" strokeDasharray="4 4" />
            <text x={padding.left - 8} y={y + 4} textAnchor="end" fontSize="10" fill="#6b7280">
              {formatCurrency(v, 'pt-BR', 'BRL').replace('R$', '')}
            </text>
          </g>
        )
      })}

      <line x1={padding.left} y1={yFor(0)} x2={width - padding.right} y2={yFor(0)} stroke="#9ca3af" />

      {table.map((row, i) => {
        if (i === 0) return null
        const barWidth = stepX * 0.45
        const x = xFor(i) - barWidth / 2
        const yBase = yFor(0)
        const yTop = yFor(row.cashFlow)
        const height = Math.abs(yBase - yTop) || 0
        const y = Math.min(yBase, yTop)
        const fill = row.cashFlow >= 0 ? '#52c41a' : '#ff4d4f'
        return (
          <g key={`bar-${i}`}>
            <rect x={x} y={y} width={barWidth} height={height} fill={fill} rx={2} opacity={0.85} />
          </g>
        )
      })}

      <polyline points={linePoints} fill="none" stroke="#1890ff" strokeWidth={2.5} />
      {table.map((row, i) => (
        <circle key={`dot-${i}`} cx={xFor(i)} cy={yFor(row.accumulatedPv)} r={3} fill="#1890ff" />
      ))}

      {table.map((row, i) => (
        <text key={`label-${i}`} x={xFor(i)} y={height - 16} textAnchor="middle" fontSize="10" fill="#374151">
          {row.period}
        </text>
      ))}

      <text x={padding.left - 40} y={height - 16} textAnchor="start" fontSize="10" fill="#6b7280">
        {t.period}
      </text>
    </svg>
  )
}

export default function NpvIrrRoiCalculatorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [rate, setRate] = useState(0.10)
  const [initialInvestment, setInitialInvestment] = useState(120000)
  const [periodType, setPeriodType] = useState('year')
  const [cashFlows, setCashFlows] = useState(() =>
    [45000, 52000, 58000, 64000, 70000].map((v) => makeCashFlow(v))
  )
  const [copiedMarkdown, copyMarkdown] = useCopyToClipboard()
  const [copiedCode, copyCode] = useCopyToClipboard()

  const periodLabel = useMemo(() => {
    const type = PERIOD_TYPES.find((p) => p.key === periodType)
    if (!type) return ''
    return lang === 'pt' ? type.labelPlPt : type.labelPlEn
  }, [periodType, lang])

  const numericFlows = useMemo(
    () => cashFlows.map((cf) => (cf.value === '' ? null : Number(cf.value))),
    [cashFlows]
  )

  const isValid = useMemo(
    () =>
      Number.isFinite(initialInvestment) &&
      initialInvestment > 0 &&
      numericFlows.length > 0 &&
      numericFlows.every((v) => Number.isFinite(v)),
    [initialInvestment, numericFlows]
  )

  const summary = useMemo(() => {
    if (!isValid) return null
    return calculateSummary(rate, initialInvestment, numericFlows)
  }, [isValid, rate, initialInvestment, numericFlows])

  const table = useMemo(() => {
    if (!isValid) return []
    return buildCashFlowTable(rate, initialInvestment, numericFlows)
  }, [isValid, rate, initialInvestment, numericFlows])

  const handleFlowChange = useCallback((id, value) => {
    const normalized = value === null || value === undefined || value === '' ? null : Number(value)
    setCashFlows((prev) => prev.map((cf) => (cf.id === id ? { ...cf, value: normalized } : cf)))
  }, [])

  const handleAddFlow = useCallback(() => {
    setCashFlows((prev) => [...prev, makeCashFlow('')])
  }, [])

  const handleRemoveFlow = useCallback((id) => {
    setCashFlows((prev) => (prev.length > 1 ? prev.filter((cf) => cf.id !== id) : prev))
  }, [])

  const handlePreset = useCallback(
    (preset) => {
      setRate(preset.rate)
      setInitialInvestment(preset.initialInvestment)
      setPeriodType(preset.periodType)
      setCashFlows(preset.cashFlows.map((v) => makeCashFlow(v)))
    },
    []
  )

  const handleCopyMarkdown = useCallback(() => {
    if (!summary || !table.length) return
    copyMarkdown(exportMarkdown(rate, initialInvestment, numericFlows, summary, table, periodLabel, t))
  }, [copyMarkdown, rate, initialInvestment, numericFlows, summary, table, periodLabel, t])

  const periodOptions = useMemo(
    () =>
      PERIOD_TYPES.map((p) => ({
        label: lang === 'pt' ? p.labelPt : p.labelEn,
        value: p.key,
      })),
    [lang]
  )

  const columns = useMemo(
    () => [
      {
        title: t.periodCol,
        dataIndex: 'period',
        key: 'period',
        align: 'center',
      },
      {
        title: t.cashFlowCol,
        dataIndex: 'cashFlow',
        key: 'cashFlow',
        render: (v) => formatCurrency(v, 'pt-BR', 'BRL'),
      },
      {
        title: t.presentValueCol,
        dataIndex: 'presentValue',
        key: 'presentValue',
        render: (v) => formatCurrency(v, 'pt-BR', 'BRL'),
      },
      {
        title: t.accumulatedPvCol,
        dataIndex: 'accumulatedPv',
        key: 'accumulatedPv',
        render: (v) => (
          <Text strong type={v >= 0 ? 'success' : 'danger'}>
            {formatCurrency(v, 'pt-BR', 'BRL')}
          </Text>
        ),
      },
    ],
    [t]
  )

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}>
        <CalculatorOutlined /> {t.title}
      </Title>
      <Paragraph type="secondary">{t.subtitle}</Paragraph>
      <Paragraph>{t.intro}</Paragraph>

      <Alert type="info" showIcon icon={<InfoCircleOutlined />} message={t.formulaTitle} description={t.formulaText} />

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card size="small" title={t.rateLabel}>
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              max={100}
              step={0.5}
              suffix="%"
              value={rate * 100}
              onChange={(v) => setRate((v ?? 0) / 100)}
              formatter={(value) => `${value}`.replace('.', ',')}
              parser={(value) => value.replace(',', '.')}
            />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card size="small" title={t.investmentLabel}>
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              step={1000}
              prefix="R$"
              value={initialInvestment}
              onChange={(v) => setInitialInvestment(v ?? 0)}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
              parser={(value) => value.replace(/\./g, '').replace(',', '.')}
            />
          </Card>
        </Col>
      </Row>

      <Card size="small" title={t.periodTypeLabel}>
        <Segmented options={periodOptions} value={periodType} onChange={setPeriodType} />
      </Card>

      <Card
        size="small"
        title={t.periodsLabel}
        extra={
          <Button icon={<PlusOutlined />} onClick={handleAddFlow}>
            {t.addPeriod}
          </Button>
        }
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          {cashFlows.map((cf, index) => (
            <Row key={cf.id} gutter={[8, 8]} align="middle">
              <Col style={{ width: 80 }}>
                <Text type="secondary">
                  {t.period} {index + 1}
                </Text>
              </Col>
              <Col flex="auto">
                <InputNumber
                  style={{ width: '100%' }}
                  step={1000}
                  prefix="R$"
                  value={cf.value}
                  onChange={(v) => handleFlowChange(cf.id, v)}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
                  parser={(value) => value.replace(/\./g, '').replace(',', '.')}
                />
              </Col>
              <Col>
                <Tooltip title={t.removePeriod}>
                  <Button icon={<DeleteOutlined />} type="text" danger onClick={() => handleRemoveFlow(cf.id)} disabled={cashFlows.length <= 1} />
                </Tooltip>
              </Col>
            </Row>
          ))}
        </Space>

        <Space style={{ marginTop: 16 }} wrap>
          <Text type="secondary">{t.presets}:</Text>
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
          <Card title={t.summaryTitle} size="small">
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} lg={8}>
                <Statistic title={t.npv} value={formatCurrency(summary.npv, 'pt-BR', 'BRL')} valueStyle={{ color: summary.npv >= 0 ? '#52c41a' : '#ff4d4f' }} />
              </Col>
              <Col xs={24} sm={12} lg={8}>
                <Statistic title={t.irr} value={summary.irr !== null ? formatPercent(summary.irr) : t.invalidIrr} valueStyle={{ color: '#1890ff' }} />
              </Col>
              <Col xs={24} sm={12} lg={8}>
                <Statistic title={t.roi} value={summary.roi !== null ? formatPercent(summary.roi) : '—'} valueStyle={{ color: summary.roi >= 0 ? '#52c41a' : '#ff4d4f' }} />
              </Col>
              <Col xs={24} sm={12} lg={8}>
                <Statistic
                  title={t.payback}
                  value={summary.payback !== null ? `${summary.payback.toFixed(2)} ${periodLabel}` : t.invalidPayback}
                />
              </Col>
              <Col xs={24} sm={12} lg={8}>
                <Statistic
                  title={t.discountedPayback}
                  value={summary.discountedPayback !== null ? `${summary.discountedPayback.toFixed(2)} ${periodLabel}` : t.invalidPayback}
                />
              </Col>
              <Col xs={24} sm={12} lg={8}>
                <Statistic title={t.totalReturn} value={formatCurrency(summary.totalReturn, 'pt-BR', 'BRL')} />
              </Col>
            </Row>
            {summary.netProfit !== null && (
              <Row style={{ marginTop: 16 }}>
                <Col>
                  <Text strong>{t.netProfit}: </Text>
                  <Tag color={summary.netProfit >= 0 ? 'green' : 'red'}>
                    {formatCurrency(summary.netProfit, 'pt-BR', 'BRL')}
                  </Tag>
                </Col>
              </Row>
            )}
          </Card>

          <Card title={t.chartTitle} size="small">
            <div style={{ display: 'flex', gap: 24, marginBottom: 16 }}>
              <Tag color="green">{t.chartCashFlow}</Tag>
              <Tag color="blue">{t.chartAccumulated}</Tag>
            </div>
            <CashFlowChart table={table} t={t} />
          </Card>

          <Card title={t.tableTitle} size="small">
            <Table dataSource={table} columns={columns} rowKey="period" pagination={false} size="small" bordered />
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
