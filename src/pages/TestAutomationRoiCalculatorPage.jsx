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
  Tooltip,
  Table,
} from 'antd'
import {
  CalculatorOutlined,
  DollarOutlined,
  CopyOutlined,
  FileMarkdownOutlined,
  InfoCircleOutlined,
  ExperimentOutlined,
  CodeOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import useCopyToClipboard from '../hooks/useCopyToClipboard'
import {
  calculateRoi,
  formatCurrency,
  formatHours,
  formatNumber,
  PRESETS,
  exportMarkdown,
} from '../utils/testAutomationRoiCalculator'

const { Title, Paragraph, Text } = Typography
const { Panel } = Collapse

const sourceCode = `import {
  calculateRoi,
  formatCurrency,
  formatHours,
} from '../utils/testAutomationRoiCalculator'

const result = calculateRoi(
  12000,   // salário bruto mensal
  168,     // horas trabalhadas por mês
  20,      // minutos para executar manualmente
  1,       // execuções por dia
  22,      // dias úteis por mês
  16,      // horas para automatizar
  4,       // horas de manutenção por mês
  24       // meses de projeção
)

// result: { hourlyCost, monthlySavings, paybackMonths,
//           totalRoi, finalNetSavings, timeline, ... }
formatCurrency(result.monthlySavings) // R$ ...
formatHours(result.manualHoursPerMonth) // ...h
`

const translations = {
  pt: {
    title: 'Calculadora de ROI de Testes Automatizados',
    subtitle: 'Quando a automação de testes começa a pagar?',
    intro: 'Estime o retorno sobre investimento de automatizar um teste ou suite recorrente. Informe o custo do profissional, o tempo gasto na execução manual, a frequência de execução, o esforço para automatizar e a manutenção mensal esperada. A ferramenta projeta economia acumulada, payback e ROI ao longo do tempo.',
    monthlySalary: 'Salário bruto mensal',
    workHoursPerMonth: 'Horas trabalhadas/mês',
    manualMinutes: 'Tempo manual por execução',
    runsPerDay: 'Execuções por dia',
    workDaysPerMonth: 'Dias úteis/mês',
    automationHours: 'Horas para automatizar',
    maintenanceHoursPerMonth: 'Manutenção mensal (horas)',
    projectionMonths: 'Projeção (meses)',
    resultsTitle: 'Resultados',
    hourlyCost: 'Custo/hora',
    runsPerMonth: 'Execuções/mês',
    manualHoursPerMonth: 'Horas manuais/mês',
    manualCostPerMonth: 'Custo manual/mês',
    initialInvestment: 'Investimento inicial',
    maintenanceCostPerMonth: 'Manutenção/mês',
    monthlySavings: 'Economia líquida/mês',
    payback: 'Payback',
    breakEvenMonth: 'Mês do break-even',
    totalRoi: 'ROI total',
    finalNetSavings: 'Economia acumulada',
    timelineTitle: 'Projeção mensal',
    chartTitle: 'Custo acumulado: manual × automatizado',
    presets: 'Cenários rápidos',
    sourceTitle: 'Motor de cálculo',
    sourceIntro: 'O motor é puro JavaScript client-side — nenhum dado financeiro sai do navegador.',
    copyMarkdown: 'Copiar Markdown',
    copied: 'Copiado!',
    copyCode: 'Copiar código',
    emptyHint: 'Preencha todos os campos com valores válidos para ver a projeção.',
    months: 'meses',
    month: 'Mês',
    cumulativeManual: 'Custo manual',
    cumulativeAutomation: 'Custo automação',
    netSavings: 'Economia líquida',
    roi: 'ROI',
    manualSeries: 'Manual',
    automationSeries: 'Automação',
    savingsSeries: 'Economia líq.',
  },
  en: {
    title: 'Test Automation ROI Calculator',
    subtitle: 'When does test automation start paying off?',
    intro: 'Estimate the return on investment of automating a recurring test or suite. Enter the professional cost, time spent on manual execution, execution frequency, automation effort and expected monthly maintenance. The tool projects cumulative savings, payback and ROI over time.',
    monthlySalary: 'Gross monthly salary',
    workHoursPerMonth: 'Working hours/month',
    manualMinutes: 'Manual time per run',
    runsPerDay: 'Runs per day',
    workDaysPerMonth: 'Working days/month',
    automationHours: 'Hours to automate',
    maintenanceHoursPerMonth: 'Monthly maintenance (hours)',
    projectionMonths: 'Projection (months)',
    resultsTitle: 'Results',
    hourlyCost: 'Hourly cost',
    runsPerMonth: 'Runs/month',
    manualHoursPerMonth: 'Manual hours/month',
    manualCostPerMonth: 'Monthly manual cost',
    initialInvestment: 'Initial investment',
    maintenanceCostPerMonth: 'Maintenance/month',
    monthlySavings: 'Monthly net savings',
    payback: 'Payback',
    breakEvenMonth: 'Break-even month',
    totalRoi: 'Total ROI',
    finalNetSavings: 'Cumulative savings',
    timelineTitle: 'Monthly projection',
    chartTitle: 'Cumulative cost: manual vs automated',
    presets: 'Quick scenarios',
    sourceTitle: 'Calculation engine',
    sourceIntro: 'The engine is pure client-side JavaScript — no financial data leaves the browser.',
    copyMarkdown: 'Copy Markdown',
    copied: 'Copied!',
    copyCode: 'Copy code',
    emptyHint: 'Fill in all fields with valid values to see the projection.',
    months: 'months',
    month: 'Month',
    cumulativeManual: 'Manual cost',
    cumulativeAutomation: 'Automation cost',
    netSavings: 'Net savings',
    roi: 'ROI',
    manualSeries: 'Manual',
    automationSeries: 'Automation',
    savingsSeries: 'Net savings',
  },
}

function statusColor(value) {
  if (value >= 1) return '#52c41a'
  if (value >= 0.5) return '#faad14'
  return '#ff4d4f'
}

function RoiChart({ result, t }) {
  if (!result || !result.timeline.length) return null
  const width = 640
  const height = 260
  const padding = { top: 24, right: 24, bottom: 48, left: 64 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  const maxCost = Math.max(
    result.finalManualCost,
    result.finalAutomationCost,
    Math.abs(result.finalNetSavings)
  ) || 1

  const xFor = (month) => padding.left + ((month - 1) / (result.totalMonths - 1 || 1)) * chartWidth
  const yFor = (value) => padding.top + chartHeight - (value / (maxCost * 1.1)) * chartHeight

  const manualPoints = result.timeline.map((row) => `${xFor(row.month)},${yFor(row.manualCost)}`).join(' ')
  const autoPoints = result.timeline.map((row) => `${xFor(row.month)},${yFor(row.automationCost)}`).join(' ')
  const savingsPoints = result.timeline.map((row) => `${xFor(row.month)},${yFor(Math.max(0, row.netSavings))}`).join(' ')

  const ticks = [0, result.totalMonths / 2, result.totalMonths].filter((v) => Number.isFinite(v))

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', maxWidth: 640 }}>
      {/* axes */}
      <line x1={padding.left} y1={height - padding.bottom} x2={width - padding.right} y2={height - padding.bottom} stroke="#d9d9d9" />
      <line x1={padding.left} y1={padding.top} x2={padding.left} y2={height - padding.bottom} stroke="#d9d9d9" />

      {/* zero line */}
      <line x1={padding.left} y1={yFor(0)} x2={width - padding.right} y2={yFor(0)} stroke="#f0f0f0" strokeDasharray="4 4" />

      {/* lines */}
      <polyline points={manualPoints} fill="none" stroke="#1890ff" strokeWidth="2.5" />
      <polyline points={autoPoints} fill="none" stroke="#ff4d4f" strokeWidth="2.5" />
      <polyline points={savingsPoints} fill="none" stroke="#52c41a" strokeWidth="2" strokeDasharray="6 4" />

      {/* dots at break-even */}
      {result.breakEvenMonth !== null && (
        <circle cx={xFor(result.breakEvenMonth)} cy={yFor(0)} r="5" fill="#52c41a" />
      )}

      {/* x ticks */}
      {ticks.map((m) => (
        <g key={m}>
          <line x1={xFor(m)} y1={height - padding.bottom} x2={xFor(m)} y2={height - padding.bottom + 4} stroke="#d9d9d9" />
          <text x={xFor(m)} y={height - padding.bottom + 20} textAnchor="middle" fontSize="11" fill="#6b7280">
            {m === 0 ? 1 : Math.round(m)}
          </text>
        </g>
      ))}
      <text x={padding.left + chartWidth / 2} y={height - 10} textAnchor="middle" fontSize="11" fill="#6b7280">
        {t.month.toLowerCase()}
      </text>

      {/* legend */}
      <g transform={`translate(${width - padding.right - 150}, ${padding.top})`}>
        <rect x="-6" y="-6" width="158" height="54" fill="rgba(255,255,255,0.85)" rx="4" stroke="#f0f0f0" />
        <line x1="0" y1="6" x2="16" y2="6" stroke="#1890ff" strokeWidth="2.5" />
        <text x="22" y="10" fontSize="11" fill="#374151">{t.manualSeries}</text>
        <line x1="0" y1="24" x2="16" y2="24" stroke="#ff4d4f" strokeWidth="2.5" />
        <text x="22" y="28" fontSize="11" fill="#374151">{t.automationSeries}</text>
        <line x1="0" y1="42" x2="16" y2="42" stroke="#52c41a" strokeWidth="2" strokeDasharray="6 4" />
        <text x="22" y="46" fontSize="11" fill="#374151">{t.savingsSeries}</text>
      </g>
    </svg>
  )
}

export default function TestAutomationRoiCalculatorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [monthlySalary, setMonthlySalary] = useState(12000)
  const [workHoursPerMonth, setWorkHoursPerMonth] = useState(168)
  const [manualMinutes, setManualMinutes] = useState(20)
  const [runsPerDay, setRunsPerDay] = useState(1)
  const [workDaysPerMonth, setWorkDaysPerMonth] = useState(22)
  const [automationHours, setAutomationHours] = useState(16)
  const [maintenanceHoursPerMonth, setMaintenanceHoursPerMonth] = useState(4)
  const [projectionMonths, setProjectionMonths] = useState(24)

  const [copiedMarkdown, copyMarkdown] = useCopyToClipboard()
  const [copiedCode, copyCode] = useCopyToClipboard()

  const result = useMemo(
    () =>
      calculateRoi(
        monthlySalary,
        workHoursPerMonth,
        manualMinutes,
        runsPerDay,
        workDaysPerMonth,
        automationHours,
        maintenanceHoursPerMonth,
        projectionMonths
      ),
    [
      monthlySalary,
      workHoursPerMonth,
      manualMinutes,
      runsPerDay,
      workDaysPerMonth,
      automationHours,
      maintenanceHoursPerMonth,
      projectionMonths,
    ]
  )

  const handlePreset = useCallback((preset) => {
    setMonthlySalary(preset.monthlySalary)
    setWorkHoursPerMonth(preset.workHoursPerMonth)
    setManualMinutes(preset.manualMinutes)
    setRunsPerDay(preset.runsPerDay)
    setWorkDaysPerMonth(preset.workDaysPerMonth)
    setAutomationHours(preset.automationHours)
    setMaintenanceHoursPerMonth(preset.maintenanceHoursPerMonth)
    setProjectionMonths(preset.projectionMonths)
  }, [])

  const handleCopyMarkdown = useCallback(() => {
    if (!result) return
    copyMarkdown(exportMarkdown(result, t))
  }, [copyMarkdown, result, t])

  const isValid = result !== null

  const columns = useMemo(
    () => [
      { title: t.month, dataIndex: 'month', key: 'month' },
      { title: t.cumulativeManual, dataIndex: 'manualCost', key: 'manualCost', render: (v) => formatCurrency(v) },
      { title: t.cumulativeAutomation, dataIndex: 'automationCost', key: 'automationCost', render: (v) => formatCurrency(v) },
      { title: t.netSavings, dataIndex: 'netSavings', key: 'netSavings', render: (v) => formatCurrency(v) },
      { title: t.roi, dataIndex: 'roi', key: 'roi', render: (v) => `${(v * 100).toFixed(1)}%` },
    ],
    [t]
  )

  const tableData = useMemo(
    () => result?.timeline.map((row, idx) => ({ ...row, key: idx })) || [],
    [result]
  )

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}>
        <CalculatorOutlined /> <ExperimentOutlined /> {t.title}
      </Title>
      <Paragraph type="secondary">{t.subtitle}</Paragraph>
      <Paragraph>{t.intro}</Paragraph>

      <Alert
        type="info"
        showIcon
        icon={<InfoCircleOutlined />}
        message={t.resultsTitle}
        description={
          lang === 'pt'
            ? 'Economia = custo manual − custo de manutenção · Payback = investimento inicial ÷ economia mensal · ROI = economia acumulada ÷ investimento inicial.'
            : 'Savings = manual cost − maintenance cost · Payback = initial investment ÷ monthly savings · ROI = cumulative savings ÷ initial investment.'
        }
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12} lg={8}>
          <Card size="small" title={t.monthlySalary}>
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              step={1000}
              prefix="R$"
              value={monthlySalary}
              onChange={(v) => setMonthlySalary(v ?? 0)}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
              parser={(value) => value.replace(/\./g, '').replace(',', '.')}
            />
          </Card>
        </Col>
        <Col xs={24} md={12} lg={8}>
          <Card size="small" title={t.workHoursPerMonth}>
            <InputNumber
              style={{ width: '100%' }}
              min={1}
              step={8}
              suffix="h"
              value={workHoursPerMonth}
              onChange={(v) => setWorkHoursPerMonth(v ?? 1)}
            />
          </Card>
        </Col>
        <Col xs={24} md={12} lg={8}>
          <Card size="small" title={t.manualMinutes}>
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              step={5}
              suffix="min"
              value={manualMinutes}
              onChange={(v) => setManualMinutes(v ?? 0)}
            />
          </Card>
        </Col>
        <Col xs={24} md={12} lg={8}>
          <Card size="small" title={t.runsPerDay}>
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              step={0.5}
              value={runsPerDay}
              onChange={(v) => setRunsPerDay(v ?? 0)}
            />
          </Card>
        </Col>
        <Col xs={24} md={12} lg={8}>
          <Card size="small" title={t.workDaysPerMonth}>
            <InputNumber
              style={{ width: '100%' }}
              min={1}
              max={31}
              step={1}
              value={workDaysPerMonth}
              onChange={(v) => setWorkDaysPerMonth(v ?? 1)}
            />
          </Card>
        </Col>
        <Col xs={24} md={12} lg={8}>
          <Card size="small" title={t.automationHours}>
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              step={4}
              suffix="h"
              value={automationHours}
              onChange={(v) => setAutomationHours(v ?? 0)}
            />
          </Card>
        </Col>
        <Col xs={24} md={12} lg={8}>
          <Card size="small" title={t.maintenanceHoursPerMonth}>
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              step={1}
              suffix="h"
              value={maintenanceHoursPerMonth}
              onChange={(v) => setMaintenanceHoursPerMonth(v ?? 0)}
            />
          </Card>
        </Col>
        <Col xs={24} md={12} lg={8}>
          <Card size="small" title={t.projectionMonths}>
            <InputNumber
              style={{ width: '100%' }}
              min={1}
              max={120}
              step={6}
              suffix="meses"
              value={projectionMonths}
              onChange={(v) => setProjectionMonths(v ?? 1)}
            />
          </Card>
        </Col>
      </Row>

      <Card size="small" title={t.presets}>
        <Space wrap>
          {Object.entries(PRESETS).map(([key, preset]) => (
            <Button key={key} size="small" onClick={() => handlePreset(preset)}>
              {preset[lang]}
            </Button>
          ))}
        </Space>
      </Card>

      {!isValid && (
        <Alert type="warning" showIcon message={t.emptyHint} />
      )}

      {isValid && (
        <>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic title={t.hourlyCost} value={formatCurrency(result.hourlyCost)} />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic title={t.runsPerMonth} value={formatNumber(result.runsPerMonth)} />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic title={t.manualHoursPerMonth} value={formatHours(result.manualHoursPerMonth)} />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic title={t.manualCostPerMonth} value={formatCurrency(result.manualCostPerMonth)} />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic title={t.initialInvestment} value={formatCurrency(result.initialInvestment)} />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic title={t.maintenanceCostPerMonth} value={formatCurrency(result.maintenanceCostPerMonth)} />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title={t.monthlySavings}
                  value={formatCurrency(result.monthlySavings)}
                  valueStyle={{ color: result.monthlySavings >= 0 ? '#52c41a' : '#ff4d4f' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title={t.payback}
                  value={result.paybackMonths !== null ? formatNumber(result.paybackMonths, 1) : '—'}
                  suffix={result.paybackMonths !== null ? t.months : ''}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title={t.breakEvenMonth}
                  value={result.breakEvenMonth !== null ? result.breakEvenMonth : '—'}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title={t.totalRoi}
                  value={`${(result.totalRoi * 100).toFixed(1)}%`}
                  valueStyle={{ color: statusColor(result.totalRoi) }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title={t.finalNetSavings}
                  value={formatCurrency(result.finalNetSavings)}
                  valueStyle={{ color: result.finalNetSavings >= 0 ? '#52c41a' : '#ff4d4f' }}
                />
              </Card>
            </Col>
          </Row>

          <Card title={t.chartTitle}>
            <RoiChart result={result} t={t} />
          </Card>

          <Card
            title={t.timelineTitle}
            extra={
              <Tooltip title={copiedMarkdown ? t.copied : t.copyMarkdown}>
                <Button icon={<FileMarkdownOutlined />} size="small" onClick={handleCopyMarkdown}>
                  {t.copyMarkdown}
                </Button>
              </Tooltip>
            }
          >
            <Table
              dataSource={tableData}
              columns={columns}
              pagination={{ pageSize: 12, hideOnSinglePage: true }}
              size="small"
              scroll={{ x: 'max-content' }}
            />
          </Card>
        </>
      )}

      <Collapse bordered>
        <Panel
          header={
            <Space>
              <CodeOutlined />
              <span>{t.sourceTitle}</span>
            </Space>
          }
          key="source"
          extra={
            <Tooltip title={copiedCode ? t.copied : t.copyCode}>
              <Button icon={<CopyOutlined />} size="small" onClick={(e) => { e.stopPropagation(); copyCode(sourceCode) }}>
                {t.copyCode}
              </Button>
            </Tooltip>
          }
        >
          <Paragraph>{t.sourceIntro}</Paragraph>
          <pre style={{ background: '#f6ffed', padding: 16, borderRadius: 8, overflow: 'auto' }}>
            <code>{sourceCode}</code>
          </pre>
        </Panel>
      </Collapse>
    </Space>
  )
}
