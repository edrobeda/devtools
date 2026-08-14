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
  Tabs,
  Row,
  Col,
  Tag,
  Statistic,
  Table,
  Divider,
} from 'antd'
import {
  LineChartOutlined,
  CalculatorOutlined,
  CopyOutlined,
  PercentageOutlined,
  WalletOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  calculateCompoundInterest,
  getSummary,
  formatCurrency,
  formatPercent,
  COMPOUND_FREQUENCIES,
  EXAMPLES,
} from '../utils/compoundInterestCalculator'

const { Title, Paragraph, Text } = Typography
const { Option } = Select
const { Panel } = Collapse
const { TabPane } = Tabs

const sourceCode = `import {
  calculateCompoundInterest,
  getSummary,
  formatCurrency,
} from '../utils/compoundInterestCalculator'

// Simular R$ 10.000 iniciais + R$ 500/mes a 10% ao ano por 10 anos
const rows = calculateCompoundInterest(10000, 500, 0.10, 10, 'monthly')
const summary = getSummary(rows)

formatCurrency(summary.finalBalance)        // montante final
formatCurrency(summary.totalContributions)    // total investido
formatCurrency(summary.totalInterest)         // juros ganhos
`

const translations = {
  pt: {
    title: 'Calculadora de Juros Compostos',
    intro: (
      <>Simule o crescimento de um investimento com capitalizacao periodica e aportes mensais recorrentes. Veja o montante final, quanto foi investido, quanto rendeu em juros e a evolucao ano a ano.</>
    ),
    tabSimulator: 'Simulador',
    tabTable: 'Tabela ano a ano',
    tabSource: 'Codigo-fonte',
    principalLabel: 'Valor inicial',
    contributionLabel: 'Aporte mensal',
    rateLabel: 'Taxa de juros anual',
    yearsLabel: 'Prazo (anos)',
    frequencyLabel: 'Capitalizacao',
    frequencyHelp: 'Frequencia em que os juros sao incorporados ao montante. Mensal e a mais comum em renda fixa brasileira (CDB, Tesouro).',
    resultsTitle: 'Resultados',
    finalBalance: 'Montante final',
    totalContributions: 'Total investido',
    totalInterest: 'Juros ganhos',
    interestRate: 'Rendimento percentual',
    chartTitle: 'Evolucao do patrimonio',
    chartInvested: 'Investido',
    chartInterest: 'Juros',
    yearColumn: 'Ano',
    startBalanceColumn: 'Saldo inicial',
    contributionsColumn: 'Aportes no ano',
    interestColumn: 'Juros no ano',
    endBalanceColumn: 'Saldo final',
    presetsTitle: 'Exemplos rapidos',
    reset: 'Limpar',
    copy: 'Copiar codigo',
    copied: 'Copiado',
    invalid: 'Preencha valores validos para calcular.',
    sourceTitle: 'Motor de calculo',
    sourceIntro: 'O motor e puro JavaScript client-side e nao envia dados para lugar nenhum.',
  },
  en: {
    title: 'Compound Interest Calculator',
    intro: (
      <>Simulate the growth of an investment with periodic compounding and recurring monthly contributions. See the final balance, total invested, interest earned and year-by-year evolution.</>
    ),
    tabSimulator: 'Simulator',
    tabTable: 'Year-by-year table',
    tabSource: 'Source code',
    principalLabel: 'Initial amount',
    contributionLabel: 'Monthly contribution',
    rateLabel: 'Annual interest rate',
    yearsLabel: 'Time (years)',
    frequencyLabel: 'Compounding',
    frequencyHelp: 'How often interest is added to the balance. Monthly is common for Brazilian fixed-income investments (CDB, Treasury).',
    resultsTitle: 'Results',
    finalBalance: 'Final balance',
    totalContributions: 'Total invested',
    totalInterest: 'Interest earned',
    interestRate: 'Return percentage',
    chartTitle: 'Wealth evolution',
    chartInvested: 'Invested',
    chartInterest: 'Interest',
    yearColumn: 'Year',
    startBalanceColumn: 'Starting balance',
    contributionsColumn: 'Yearly contributions',
    interestColumn: 'Yearly interest',
    endBalanceColumn: 'Ending balance',
    presetsTitle: 'Quick examples',
    reset: 'Reset',
    copy: 'Copy code',
    copied: 'Copied',
    invalid: 'Fill in valid values to calculate.',
    sourceTitle: 'Calculation engine',
    sourceIntro: 'The engine is pure client-side JavaScript and does not send data anywhere.',
  },
}

function BarChart({ rows, t }) {
  if (!rows.length) return null
  const width = 600
  const height = 240
  const padding = { top: 20, right: 20, bottom: 40, left: 56 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  const maxValue = Math.max(...rows.map((r) => r.endBalance))
  const barWidth = rows.length > 0 ? chartWidth / rows.length * 0.6 : 0
  const stepX = rows.length > 0 ? chartWidth / rows.length : 0

  const yTicks = 5
  const yTickValues = Array.from({ length: yTicks + 1 }, (_, i) => (maxValue / yTicks) * i)

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', maxWidth: 720 }}>
      {/* grid lines */}
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

      {/* bars */}
      {rows.map((row, i) => {
        const x = padding.left + i * stepX + (stepX - barWidth) / 2
        const investedHeight = (row.totalContributions / maxValue) * chartHeight
        const interestHeight = (row.totalInterest / maxValue) * chartHeight
        const totalHeight = investedHeight + interestHeight
        const yTotal = padding.top + chartHeight - totalHeight
        const yInvested = padding.top + chartHeight - investedHeight

        return (
          <g key={row.year}>
            <rect x={x} y={yTotal} width={barWidth} height={interestHeight} fill="#52c41a" rx={2} />
            <rect x={x} y={yInvested} width={barWidth} height={investedHeight} fill="#1890ff" rx={2} />
            <text x={x + barWidth / 2} y={padding.top + chartHeight + 16} textAnchor="middle" fontSize="10" fill="#374151">
              {row.year}
            </text>
          </g>
        )
      })}

      {/* axes */}
      <line x1={padding.left} y1={padding.top + chartHeight} x2={width - padding.right} y2={padding.top + chartHeight} stroke="#9ca3af" />
      <line x1={padding.left} y1={padding.top} x2={padding.left} y2={padding.top + chartHeight} stroke="#9ca3af" />
    </svg>
  )
}

export default function CompoundInterestCalculatorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [principal, setPrincipal] = useState(10000)
  const [monthlyContribution, setMonthlyContribution] = useState(500)
  const [annualRate, setAnnualRate] = useState(0.10)
  const [years, setYears] = useState(10)
  const [frequencyKey, setFrequencyKey] = useState('monthly')

  const rows = useMemo(() => {
    if (!Number.isFinite(annualRate) || !Number.isFinite(principal) || !Number.isFinite(monthlyContribution) || !Number.isFinite(years)) {
      return []
    }
    return calculateCompoundInterest(
      principal,
      monthlyContribution,
      annualRate,
      Math.max(0, years),
      frequencyKey
    )
  }, [principal, monthlyContribution, annualRate, years, frequencyKey])

  const summary = useMemo(() => getSummary(rows), [rows])

  const returnPercent = useMemo(() => {
    if (summary.totalContributions <= 0) return 0
    return summary.totalInterest / summary.totalContributions
  }, [summary])

  const isValid = rows.length > 0

  const applyExample = (example) => {
    setPrincipal(example.principal)
    setMonthlyContribution(example.monthlyContribution)
    setAnnualRate(example.annualRate)
    setYears(example.years)
    setFrequencyKey(example.frequencyKey)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(sourceCode)
  }

  const columns = [
    { title: t.yearColumn, dataIndex: 'year', key: 'year', align: 'center' },
    {
      title: t.startBalanceColumn,
      dataIndex: 'startBalance',
      key: 'startBalance',
      render: (v) => formatCurrency(v, 'pt-BR', 'BRL'),
    },
    {
      title: t.contributionsColumn,
      dataIndex: 'yearContributions',
      key: 'yearContributions',
      render: (v) => formatCurrency(v, 'pt-BR', 'BRL'),
    },
    {
      title: t.interestColumn,
      dataIndex: 'yearInterest',
      key: 'yearInterest',
      render: (v) => formatCurrency(v, 'pt-BR', 'BRL'),
    },
    {
      title: t.endBalanceColumn,
      dataIndex: 'endBalance',
      key: 'endBalance',
      render: (v) => <Text strong>{formatCurrency(v, 'pt-BR', 'BRL')}</Text>,
    },
  ]

  return (
    <div style={{ padding: 24, maxWidth: 960, margin: '0 auto' }}>
      <Title level={2}>
        <PercentageOutlined style={{ marginRight: 12 }} />
        {t.title}
      </Title>
      <Paragraph>{t.intro}</Paragraph>

      <Tabs defaultActiveKey="simulator" type="card">
        <TabPane tab={t.tabSimulator} key="simulator">
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Card>
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                  <div>
                    <Text strong>{t.principalLabel}</Text>
                    <InputNumber
                      style={{ width: '100%' }}
                      min={0}
                      step={100}
                      prefix="R$"
                      value={principal}
                      onChange={(v) => setPrincipal(v ?? 0)}
                      formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
                      parser={(value) => value.replace(/\./g, '').replace(',', '.')}
                    />
                  </div>

                  <div>
                    <Text strong>{t.contributionLabel}</Text>
                    <InputNumber
                      style={{ width: '100%' }}
                      min={0}
                      step={50}
                      prefix="R$"
                      value={monthlyContribution}
                      onChange={(v) => setMonthlyContribution(v ?? 0)}
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
                    <Text strong>{t.yearsLabel}</Text>
                    <InputNumber
                      style={{ width: '100%' }}
                      min={1}
                      max={100}
                      step={1}
                      value={years}
                      onChange={(v) => setYears(v ?? 1)}
                    />
                  </div>

                  <div>
                    <Text strong>{t.frequencyLabel}</Text>
                    <Select
                      style={{ width: '100%' }}
                      value={frequencyKey}
                      onChange={setFrequencyKey}
                    >
                      {COMPOUND_FREQUENCIES.map((f) => (
                        <Option key={f.key} value={f.key}>
                          {lang === 'pt' ? f.labelPt : f.labelEn}
                        </Option>
                      ))}
                    </Select>
                    <Paragraph type="secondary" style={{ marginTop: 4, fontSize: 12 }}>
                      {t.frequencyHelp}
                    </Paragraph>
                  </div>

                  <Button icon={<ReloadOutlined />} onClick={() => applyExample(EXAMPLES[0])}>
                    {t.reset}
                  </Button>
                </Space>
              </Card>
            </Col>

            <Col xs={24} md={12}>
              <Card title={t.presetsTitle}>
                <Space wrap>
                  {EXAMPLES.map((ex) => (
                    <Button key={ex.key} onClick={() => applyExample(ex)}>
                      {lang === 'pt' ? ex.labelPt : ex.labelEn}
                    </Button>
                  ))}
                </Space>
              </Card>

              <Card title={t.resultsTitle} style={{ marginTop: 16 }}>
                {!isValid ? (
                  <Alert message={t.invalid} type="warning" showIcon />
                ) : (
                  <Row gutter={[16, 16]}>
                    <Col span={12}>
                      <Statistic
                        title={t.finalBalance}
                        value={formatCurrency(summary.finalBalance, 'pt-BR', 'BRL')}
                        valueStyle={{ color: '#1890ff' }}
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title={t.totalContributions}
                        value={formatCurrency(summary.totalContributions, 'pt-BR', 'BRL')}
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title={t.totalInterest}
                        value={formatCurrency(summary.totalInterest, 'pt-BR', 'BRL')}
                        valueStyle={{ color: '#52c41a' }}
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title={t.interestRate}
                        value={formatPercent(returnPercent)}
                        valueStyle={{ color: '#722ed1' }}
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
              <Card title={t.chartTitle}>
                <div style={{ display: 'flex', gap: 24, marginBottom: 16 }}>
                  <Tag color="blue">{t.chartInvested}</Tag>
                  <Tag color="green">{t.chartInterest}</Tag>
                </div>
                <BarChart rows={rows} t={t} />
              </Card>
            </>
          )}
        </TabPane>

        <TabPane tab={t.tabTable} key="table">
          <Card>
            {isValid ? (
              <Table
                dataSource={rows}
                columns={columns}
                rowKey="year"
                pagination={{ pageSize: 10 }}
                size="small"
                summary={() => (
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0}><Text strong>Total</Text></Table.Summary.Cell>
                    <Table.Summary.Cell index={1}>-</Table.Summary.Cell>
                    <Table.Summary.Cell index={2}>{formatCurrency(summary.totalContributions - (rows[0]?.startBalance || 0), 'pt-BR', 'BRL')}</Table.Summary.Cell>
                    <Table.Summary.Cell index={3}>{formatCurrency(summary.totalInterest, 'pt-BR', 'BRL')}</Table.Summary.Cell>
                    <Table.Summary.Cell index={4}><Text strong>{formatCurrency(summary.finalBalance, 'pt-BR', 'BRL')}</Text></Table.Summary.Cell>
                  </Table.Summary.Row>
                )}
              />
            ) : (
              <Alert message={t.invalid} type="warning" showIcon />
            )}
          </Card>
        </TabPane>

        <TabPane tab={t.tabSource} key="source">
          <Card
            title={t.sourceTitle}
            extra={
              <Button icon={<CopyOutlined />} onClick={handleCopy}>
                {t.copy}
              </Button>
            }
          >
            <Paragraph>{t.sourceIntro}</Paragraph>
            <pre style={{ background: '#f6f8fa', padding: 16, borderRadius: 8, overflow: 'auto' }}>
              <code>{sourceCode}</code>
            </pre>
          </Card>

          <Collapse style={{ marginTop: 16 }}>
            <Panel header="compoundInterestCalculator.js" key="engine">
              <pre style={{ background: '#f6f8fa', padding: 16, borderRadius: 8, overflow: 'auto', fontSize: 12 }}>
                <code>{`
export const COMPOUND_FREQUENCIES = [
  { key: 'annually', periodsPerYear: 1 },
  { key: 'semiannually', periodsPerYear: 2 },
  { key: 'quarterly', periodsPerYear: 4 },
  { key: 'monthly', periodsPerYear: 12 },
  { key: 'daily', periodsPerYear: 365 },
]

export function calculateCompoundInterest(
  principal, monthlyContribution, annualRate, years, frequencyKey = 'monthly'
) {
  const { periodsPerYear } = COMPOUND_FREQUENCIES
    .find(f => f.key === frequencyKey) || { periodsPerYear: 12 }

  const ratePerPeriod = annualRate / periodsPerYear
  const contributionPerPeriod = monthlyContribution * (periodsPerYear / 12)

  let balance = principal
  let totalContributions = principal
  let totalInterest = 0
  const rows = []

  for (let year = 1; year <= years; year++) {
    const startBalance = balance
    let yearContributions = 0
    let yearInterest = 0

    for (let p = 0; p < periodsPerYear; p++) {
      const interest = balance * ratePerPeriod
      balance += interest + contributionPerPeriod
      yearInterest += interest
      yearContributions += contributionPerPeriod
    }

    totalContributions += yearContributions
    totalInterest += yearInterest

    rows.push({ year, startBalance, yearContributions, yearInterest, endBalance: balance, totalContributions, totalInterest })
  }

  return rows
}
                `.trim()}</code>
              </pre>
            </Panel>
          </Collapse>
        </TabPane>
      </Tabs>
    </div>
  )
}
