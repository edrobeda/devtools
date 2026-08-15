import React, { useMemo, useState } from 'react'
import {
  Typography,
  Card,
  InputNumber,
  Select,
  Space,
  Button,
  Alert,
  Collapse,
  Row,
  Col,
  Tag,
  Statistic,
  Table,
  Divider,
} from 'antd'
import {
  CalculatorOutlined,
  BankOutlined,
  CopyOutlined,
  PercentageOutlined,
  WalletOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  calculateAmortization,
  getSummary,
  formatCurrency,
  formatPercent,
  AMORTIZATION_SYSTEMS,
  EXAMPLES,
} from '../utils/loanAmortizationCalculator'

const { Title, Paragraph, Text } = Typography
const { Option } = Select
const { Panel } = Collapse

const sourceCode = `import {
  calculateAmortization,
  getSummary,
  formatCurrency,
} from '../utils/loanAmortizationCalculator'

// Simular R$ 300.000 em 360 meses a 9,9% ao ano pelo sistema Price
const rows = calculateAmortization(300000, 0.099, 360, 'PRICE')
const summary = getSummary(rows)

formatCurrency(summary.firstPayment) // primeira prestacao
formatCurrency(summary.lastPayment)    // ultima prestacao
formatCurrency(summary.totalPaid)      // total pago
formatCurrency(summary.totalInterest)  // total de juros
`

const translations = {
  pt: {
    title: 'Calculadora de Amortizacao SAC / Price',
    intro: 'Simule financiamentos com os dois sistemas de amortizacao mais usados no Brasil. Compare prestacoes, juros totais e veja a evolucao do saldo devedor mes a mes.',
    principalLabel: 'Valor financiado',
    rateLabel: 'Taxa de juros anual',
    monthsLabel: 'Prazo (meses)',
    systemLabel: 'Sistema de amortizacao',
    resultsTitle: 'Resultados',
    firstPayment: 'Primeira prestacao',
    lastPayment: 'Ultima prestacao',
    averagePayment: 'Prestacao media',
    totalPaid: 'Total pago',
    totalInterest: 'Total de juros',
    totalAmortization: 'Total amortizado',
    chartBalanceTitle: 'Evolucao do saldo devedor',
    chartCompositionTitle: 'Composicao das prestacoes',
    chartInterest: 'Juros',
    chartAmortization: 'Amortizacao',
    chartBalance: 'Saldo devedor',
    tableTitle: 'Tabela de amortizacao',
    monthColumn: 'Mes',
    startBalanceColumn: 'Saldo inicial',
    amortizationColumn: 'Amortizacao',
    interestColumn: 'Juros',
    paymentColumn: 'Prestacao',
    endBalanceColumn: 'Saldo final',
    presetsTitle: 'Exemplos rapidos',
    reset: 'Limpar',
    copy: 'Copiar codigo',
    copied: 'Copiado',
    invalid: 'Preencha valores validos para calcular.',
    sourceTitle: 'Motor de calculo',
    sourceIntro: 'O motor e puro JavaScript client-side e nao envia dados para lugar nenhum. A taxa anual e dividida por 12 para obter a taxa mensal.',
    priceNote: 'No sistema Price as prestacoes sao fixas, exceto possiveis ajustes de centavos no ultimo mes.',
    sacNote: 'No sistema SAC a amortizacao e constante, entao as prestacoes diminuem ao longo do tempo.',
  },
  en: {
    title: 'SAC / Loan Amortization Calculator',
    intro: 'Simulate loans using the two most common amortization systems. Compare installments, total interest and see the outstanding balance month by month.',
    principalLabel: 'Loan amount',
    rateLabel: 'Annual interest rate',
    monthsLabel: 'Term (months)',
    systemLabel: 'Amortization system',
    resultsTitle: 'Results',
    firstPayment: 'First installment',
    lastPayment: 'Last installment',
    averagePayment: 'Average installment',
    totalPaid: 'Total paid',
    totalInterest: 'Total interest',
    totalAmortization: 'Total amortized',
    chartBalanceTitle: 'Outstanding balance evolution',
    chartCompositionTitle: 'Installment composition',
    chartInterest: 'Interest',
    chartAmortization: 'Amortization',
    chartBalance: 'Outstanding balance',
    tableTitle: 'Amortization table',
    monthColumn: 'Month',
    startBalanceColumn: 'Starting balance',
    amortizationColumn: 'Amortization',
    interestColumn: 'Interest',
    paymentColumn: 'Installment',
    endBalanceColumn: 'Ending balance',
    presetsTitle: 'Quick examples',
    reset: 'Reset',
    copy: 'Copy code',
    copied: 'Copied',
    invalid: 'Fill in valid values to calculate.',
    sourceTitle: 'Calculation engine',
    sourceIntro: 'The engine is pure client-side JavaScript and does not send data anywhere. The annual rate is divided by 12 to get the monthly rate.',
    priceNote: 'In the Price system installments are fixed, except for possible rounding adjustments in the last month.',
    sacNote: 'In the SAC system amortization is constant, so installments decrease over time.',
  },
}

function BalanceChart({ rows, t }) {
  if (!rows.length) return null

  const width = 600
  const height = 240
  const padding = { top: 20, right: 20, bottom: 40, left: 72 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  const maxValue = Math.max(...rows.map((r) => r.startBalance))
  const stepX = rows.length > 1 ? chartWidth / (rows.length - 1) : 0

  const yTicks = 5
  const yTickValues = Array.from({ length: yTicks + 1 }, (_, i) => (maxValue / yTicks) * i)

  const pathPoints = rows.map((r, i) => {
    const x = padding.left + i * stepX
    const y = padding.top + chartHeight - (r.startBalance / maxValue) * chartHeight
    return `${x},${y}`
  })

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', maxWidth: 720 }}>
      {yTickValues.map((v, i) => {
        const y = padding.top + chartHeight - (v / maxValue) * chartHeight
        return (
          <g key={i}>
            <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#e5e7eb" strokeDasharray="4 4" />
            <text x={padding.left - 8} y={y + 4} textAnchor="end" fontSize="10" fill="#6b7280">
              {formatCurrency(v, 'pt-BR', 'BRL').replace('R$', '')}
            </text>
          </g>
        )
      })}

      <polyline
        fill="none"
        stroke="#1890ff"
        strokeWidth={2}
        points={pathPoints.join(' ')}
      />

      <path
        d={`M ${padding.left},${padding.top + chartHeight} L ${pathPoints.join(' L ')} L ${padding.left + chartWidth},${padding.top + chartHeight} Z`}
        fill="rgba(24, 144, 255, 0.15)"
      />

      <line x1={padding.left} y1={padding.top + chartHeight} x2={padding.left + chartWidth} y2={padding.top + chartHeight} stroke="#9ca3af" />
      <line x1={padding.left} y1={padding.top} x2={padding.left} y2={padding.top + chartHeight} stroke="#9ca3af" />

      <text x={padding.left + chartWidth / 2} y={height - 8} textAnchor="middle" fontSize="11" fill="#374151">
        {t.chartBalance}
      </text>
    </svg>
  )
}

function CompositionChart({ rows, t }) {
  if (!rows.length) return null

  // Mostra no maximo 12 barras para nao sobrecarregar o SVG.
  const maxBars = 12
  let step = 1
  if (rows.length > maxBars) {
    step = Math.ceil(rows.length / maxBars)
  }
  const sampled = rows.filter((_, i) => i % step === 0)
  if (sampled[sampled.length - 1] !== rows[rows.length - 1]) {
    sampled.push(rows[rows.length - 1])
  }

  const width = 600
  const height = 220
  const padding = { top: 20, right: 20, bottom: 48, left: 56 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  const maxPayment = Math.max(...sampled.map((r) => r.payment))
  const barWidth = sampled.length > 0 ? (chartWidth / sampled.length) * 0.6 : 0
  const stepX = sampled.length > 0 ? chartWidth / sampled.length : 0

  const yTicks = 4
  const yTickValues = Array.from({ length: yTicks + 1 }, (_, i) => (maxPayment / yTicks) * i)

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', maxWidth: 720 }}>
      {yTickValues.map((v, i) => {
        const y = padding.top + chartHeight - (v / maxPayment) * chartHeight
        return (
          <g key={i}>
            <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#e5e7eb" strokeDasharray="4 4" />
            <text x={padding.left - 8} y={y + 4} textAnchor="end" fontSize="10" fill="#6b7280">
              {formatCurrency(v, 'pt-BR', 'BRL').replace('R$', '')}
            </text>
          </g>
        )
      })}

      {sampled.map((row, i) => {
        const x = padding.left + i * stepX + (stepX - barWidth) / 2
        const amortizationHeight = (row.amortization / maxPayment) * chartHeight
        const interestHeight = (row.interest / maxPayment) * chartHeight
        const totalHeight = amortizationHeight + interestHeight
        const yTotal = padding.top + chartHeight - totalHeight
        const yAmortization = padding.top + chartHeight - amortizationHeight

        return (
          <g key={row.month}>
            <rect x={x} y={yTotal} width={barWidth} height={interestHeight} fill="#ff4d4f" rx={2} />
            <rect x={x} y={yAmortization} width={barWidth} height={amortizationHeight} fill="#52c41a" rx={2} />
            <text x={x + barWidth / 2} y={padding.top + chartHeight + 16} textAnchor="middle" fontSize="9" fill="#374151">
              {row.month}
            </text>
          </g>
        )
      })}

      <line x1={padding.left} y1={padding.top + chartHeight} x2={width - padding.right} y2={padding.top + chartHeight} stroke="#9ca3af" />
      <line x1={padding.left} y1={padding.top} x2={padding.left} y2={padding.top + chartHeight} stroke="#9ca3af" />
    </svg>
  )
}

export default function LoanAmortizationCalculatorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [principal, setPrincipal] = useState(300000)
  const [annualRate, setAnnualRate] = useState(0.099)
  const [months, setMonths] = useState(360)
  const [system, setSystem] = useState('PRICE')

  const rows = useMemo(() => {
    if (!Number.isFinite(principal) || !Number.isFinite(annualRate) || !Number.isFinite(months)) {
      return []
    }
    return calculateAmortization(principal, annualRate, Math.max(1, months), system)
  }, [principal, annualRate, months, system])

  const summary = useMemo(() => getSummary(rows), [rows])

  const isValid = rows.length > 0

  const applyExample = (example) => {
    setPrincipal(example.principal)
    setAnnualRate(example.annualRate)
    setMonths(example.months)
    setSystem(example.system)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(sourceCode)
  }

  const columns = [
    { title: t.monthColumn, dataIndex: 'month', key: 'month', align: 'center' },
    {
      title: t.startBalanceColumn,
      dataIndex: 'startBalance',
      key: 'startBalance',
      render: (v) => formatCurrency(v, 'pt-BR', 'BRL'),
    },
    {
      title: t.amortizationColumn,
      dataIndex: 'amortization',
      key: 'amortization',
      render: (v) => formatCurrency(v, 'pt-BR', 'BRL'),
    },
    {
      title: t.interestColumn,
      dataIndex: 'interest',
      key: 'interest',
      render: (v) => formatCurrency(v, 'pt-BR', 'BRL'),
    },
    {
      title: t.paymentColumn,
      dataIndex: 'payment',
      key: 'payment',
      render: (v) => <Text strong>{formatCurrency(v, 'pt-BR', 'BRL')}</Text>,
    },
    {
      title: t.endBalanceColumn,
      dataIndex: 'endBalance',
      key: 'endBalance',
      render: (v) => formatCurrency(v, 'pt-BR', 'BRL'),
    },
  ]

  return (
    <div style={{ padding: 24, maxWidth: 1080, margin: '0 auto' }}>
      <Title level={2}>
        <BankOutlined style={{ marginRight: 12 }} />
        {t.title}
      </Title>
      <Paragraph>{t.intro}</Paragraph>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card>
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <div>
                <Text strong>{t.principalLabel}</Text>
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  step={1000}
                  prefix="R$"
                  value={principal}
                  onChange={(v) => setPrincipal(v ?? 0)}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
                  parser={(value) => value.replace(/\./g, '').replace(',', '.')}
                />
              </div>

              <div>
                <Text strong>{t.rateLabel}</Text>
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  step={0.5}
                  suffix="%"
                  value={annualRate * 100}
                  onChange={(v) => setAnnualRate((v ?? 0) / 100)}
                  formatter={(value) => `${value}`.replace('.', ',')}
                  parser={(value) => value.replace(',', '.')}
                />
              </div>

              <div>
                <Text strong>{t.monthsLabel}</Text>
                <InputNumber
                  style={{ width: '100%' }}
                  min={1}
                  max={600}
                  step={12}
                  value={months}
                  onChange={(v) => setMonths(v ?? 1)}
                />
              </div>

              <div>
                <Text strong>{t.systemLabel}</Text>
                <Select style={{ width: '100%' }} value={system} onChange={setSystem}>
                  {AMORTIZATION_SYSTEMS.map((s) => (
                    <Option key={s.key} value={s.key}>
                      {lang === 'pt' ? s.labelPt : s.labelEn}
                    </Option>
                  ))}
                </Select>
                <Paragraph type="secondary" style={{ marginTop: 4, fontSize: 12 }}>
                  {system === 'PRICE' ? t.priceNote : t.sacNote}
                </Paragraph>
              </div>

              <Button icon={<ReloadOutlined />} onClick={() => applyExample(EXAMPLES[0])}>
                {t.reset}
              </Button>
            </Space>
          </Card>

          <Card title={t.presetsTitle} style={{ marginTop: 16 }}>
            <Space wrap>
              {EXAMPLES.map((ex) => (
                <Button key={ex.key} onClick={() => applyExample(ex)}>
                  {lang === 'pt' ? ex.labelPt : ex.labelEn}
                </Button>
              ))}
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card title={t.resultsTitle}>
            {!isValid ? (
              <Alert message={t.invalid} type="warning" showIcon />
            ) : (
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Statistic
                    title={t.firstPayment}
                    value={formatCurrency(summary.firstPayment, 'pt-BR', 'BRL')}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title={t.lastPayment}
                    value={formatCurrency(summary.lastPayment, 'pt-BR', 'BRL')}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title={t.averagePayment}
                    value={formatCurrency(summary.averagePayment, 'pt-BR', 'BRL')}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title={t.totalPaid}
                    value={formatCurrency(summary.totalPaid, 'pt-BR', 'BRL')}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title={t.totalInterest}
                    value={formatCurrency(summary.totalInterest, 'pt-BR', 'BRL')}
                    valueStyle={{ color: '#ff4d4f' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title={t.totalAmortization}
                    value={formatCurrency(summary.totalAmortization, 'pt-BR', 'BRL')}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Col>
              </Row>
            )}
          </Card>
        </Col>
      </Row>

      {isValid && (
        <>
          <Divider />
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Card title={t.chartBalanceTitle}>
                <BalanceChart rows={rows} t={t} />
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card title={t.chartCompositionTitle}>
                <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
                  <Tag color="green">{t.chartAmortization}</Tag>
                  <Tag color="red">{t.chartInterest}</Tag>
                </div>
                <CompositionChart rows={rows} t={t} />
              </Card>
            </Col>
          </Row>

          <Divider />
          <Card title={t.tableTitle}>
            <Table
              dataSource={rows}
              columns={columns}
              rowKey="month"
              pagination={{ pageSize: 12 }}
              size="small"
              summary={() => (
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0}><Text strong>Total</Text></Table.Summary.Cell>
                  <Table.Summary.Cell index={1}>-</Table.Summary.Cell>
                  <Table.Summary.Cell index={2}>{formatCurrency(summary.totalAmortization, 'pt-BR', 'BRL')}</Table.Summary.Cell>
                  <Table.Summary.Cell index={3}>{formatCurrency(summary.totalInterest, 'pt-BR', 'BRL')}</Table.Summary.Cell>
                  <Table.Summary.Cell index={4}><Text strong>{formatCurrency(summary.totalPaid, 'pt-BR', 'BRL')}</Text></Table.Summary.Cell>
                  <Table.Summary.Cell index={5}>-</Table.Summary.Cell>
                </Table.Summary.Row>
              )}
            />
          </Card>
        </>
      )}

      <Collapse style={{ marginTop: 24 }}>
        <Panel header={t.sourceTitle} key="source">
          <Paragraph>{t.sourceIntro}</Paragraph>
          <Card
            extra={
              <Button icon={<CopyOutlined />} onClick={handleCopy}>
                {t.copy}
              </Button>
            }
          >
            <pre style={{ background: '#f6ffed', padding: 16, borderRadius: 8, overflow: 'auto' }}>
              <code>{sourceCode}</code>
            </pre>
          </Card>
        </Panel>
      </Collapse>
    </div>
  )
}
