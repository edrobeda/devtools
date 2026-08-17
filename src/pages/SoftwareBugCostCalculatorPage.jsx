import React, { useMemo, useState, useCallback } from 'react'
import {
  Typography,
  Card,
  InputNumber,
  Select,
  Space,
  Row,
  Col,
  Statistic,
  Tag,
  Alert,
  Collapse,
  Button,
  Tooltip,
  Divider,
} from 'antd'
import {
  CalculatorOutlined,
  DollarOutlined,
  CopyOutlined,
  FileMarkdownOutlined,
  InfoCircleOutlined,
  BugOutlined,
  CodeOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import useCopyToClipboard from '../hooks/useCopyToClipboard'
import {
  calculateBugCost,
  formatCurrency,
  formatHours,
  PHASES,
  ACTIVITIES,
  PRESETS,
  exportMarkdown,
} from '../utils/softwareBugCostCalculator'

const { Title, Paragraph, Text } = Typography
const { Panel } = Collapse

const sourceCode = `import { calculateBugCost } from '../utils/softwareBugCostCalculator'

const result = calculateBugCost({
  monthlySalary: 12000,        // salário bruto mensal
  hoursPerMonth: 168,          // horas trabalhadas por mês
  teamSize: 2,                 // desenvolvedores envolvidos
  phase: 'production',         // fase de descoberta
  hours: {
    detection: 2,
    report: 1,
    fix: 4,
    testing: 2,
    deploy: 1,
    support: 6,
  },
  indirectCost: 2000,          // custo indireto fixo
  affectedCustomers: 100,      // clientes afetados
  revenueLossPerCustomer: 10,  // receita perdida por cliente
})

// result.totalCost contém o custo total ajustado pela fase
formatCurrency(result.totalCost) // R$ ...
`

const translations = {
  pt: {
    title: 'Calculadora de Custo de Bug de Software',
    subtitle: 'Estime o custo real de um defeito',
    intro: 'Calcule quanto um bug custa com base no salário do time, tamanho da equipe, horas gastas em cada etapa e a fase do ciclo de vida em que o defeito foi detectado. O multiplicador por fase reflete a realidade de que bugs encontrados mais tarde custam exponencialmente mais caro.',
    monthlySalary: 'Salário bruto mensal',
    hoursPerMonth: 'Horas trabalhadas / mês',
    teamSize: 'Desenvolvedores envolvidos',
    phase: 'Fase de descoberta',
    totalHours: 'Total de horas',
    hourlyRate: 'Custo / hora do time',
    directCost: 'Custo direto',
    phaseMultiplier: 'Multiplicador da fase',
    adjustedDirectCost: 'Custo direto ajustado',
    indirectCost: 'Custo indireto / impacto',
    businessImpact: 'Impacto de negócio',
    totalCost: 'Custo total do bug',
    savingsIfEarlier: 'Economia se detectado em desenvolvimento',
    affectedCustomers: 'Clientes afetados',
    revenueLossPerCustomer: 'Prejuízo por cliente',
    resultsTitle: 'Resultados',
    detailsTitle: 'Breakdown por atividade',
    chartTitle: 'Custo por atividade',
    presets: 'Exemplos rápidos',
    sourceTitle: 'Motor de cálculo',
    sourceIntro: 'O motor é puro JavaScript client-side — nenhum dado sai do navegador.',
    copyMarkdown: 'Copiar Markdown',
    copied: 'Copiado!',
    copyCode: 'Copiar código',
    emptyHint: 'Preencha salário, horas/mês e time com valores válidos.',
    hourSuffix: 'h',
    hourLabel: 'horas',
    phaseHelp: 'Quanto mais tarde no ciclo de vida, maior o custo.',
    valueLabel: 'Valor',
    inputLabel: 'Entrada',
    resultLabel: 'Resultado',
    development: 'Desenvolvimento',
    testing: 'Testes / QA',
    staging: 'Homologação',
    production: 'Produção',
    detection: 'Detecção / identificação',
    report: 'Report / triagem',
    fix: 'Correção',
    testingActivity: 'Testes / QA',
    deploy: 'Deploy / liberação',
    support: 'Suporte pós-produção',
  },
  en: {
    title: 'Software Bug Cost Calculator',
    subtitle: 'Estimate the real cost of a defect',
    intro: 'Calculate how much a bug costs based on team salary, team size, hours spent on each step, and the lifecycle phase where the defect was found. The phase multiplier reflects the reality that bugs found later are exponentially more expensive.',
    monthlySalary: 'Monthly gross salary',
    hoursPerMonth: 'Worked hours / month',
    teamSize: 'Developers involved',
    phase: 'Discovery phase',
    totalHours: 'Total hours',
    hourlyRate: 'Team cost / hour',
    directCost: 'Direct cost',
    phaseMultiplier: 'Phase multiplier',
    adjustedDirectCost: 'Adjusted direct cost',
    indirectCost: 'Indirect cost / impact',
    businessImpact: 'Business impact',
    totalCost: 'Total bug cost',
    savingsIfEarlier: 'Savings if found in development',
    affectedCustomers: 'Affected customers',
    revenueLossPerCustomer: 'Loss per customer',
    resultsTitle: 'Results',
    detailsTitle: 'Breakdown by activity',
    chartTitle: 'Cost by activity',
    presets: 'Quick examples',
    sourceTitle: 'Calculation engine',
    sourceIntro: 'The engine is pure client-side JavaScript — no data leaves the browser.',
    copyMarkdown: 'Copy Markdown',
    copied: 'Copied!',
    copyCode: 'Copy code',
    emptyHint: 'Fill in salary, hours/month and team with valid values.',
    hourSuffix: 'h',
    hourLabel: 'hours',
    phaseHelp: 'The later in the lifecycle, the higher the cost.',
    valueLabel: 'Value',
    inputLabel: 'Input',
    resultLabel: 'Result',
    development: 'Development',
    testing: 'Testing / QA',
    staging: 'Staging',
    production: 'Production',
    detection: 'Detection / identification',
    report: 'Report / triage',
    fix: 'Fix',
    testingActivity: 'Testing / QA',
    deploy: 'Deploy / release',
    support: 'Post-production support',
  },
}

function PhaseTag({ phase, t }) {
  if (!phase) return null
  const colors = {
    development: 'green',
    testing: 'blue',
    staging: 'orange',
    production: 'red',
  }
  const label = t[phase.key] || phase.labelEn
  return (
    <Tag color={colors[phase.key]}>
      {label} ({phase.multiplier}x)
    </Tag>
  )
}

function CostChart({ result, t }) {
  if (!result) return null
  const values = ACTIVITIES.map((act) => ({
    key: act.key,
    label: t[act.key] || act.labelEn,
    value: result.activityCosts[act.key] ?? 0,
  })).filter((v) => v.value > 0)

  if (values.length === 0) return null

  const max = Math.max(...values.map((v) => v.value), 1)
  const width = 560
  const height = 240
  const padding = { top: 24, right: 24, bottom: 80, left: 24 }
  const chartWidth = width - padding.left - padding.right
  const barSlot = chartWidth / values.length
  const barWidth = Math.min(barSlot * 0.6, 72)

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', maxWidth: 640 }}>
      <line
        x1={padding.left}
        y1={height - padding.bottom}
        x2={width - padding.right}
        y2={height - padding.bottom}
        stroke="#d9d9d9"
      />
      {values.map((v, i) => {
        const x = padding.left + i * barSlot + (barSlot - barWidth) / 2
        const h = (v.value / max) * (height - padding.top - padding.bottom)
        const y = height - padding.bottom - h
        return (
          <g key={v.key}>
            <rect x={x} y={y} width={barWidth} height={h} fill="#1890ff" rx={4} opacity={0.85} />
            <text x={x + barWidth / 2} y={y - 8} textAnchor="middle" fontSize="11" fill="#374151">
              {formatCurrency(v.value)}
            </text>
            <text
              x={x + barWidth / 2}
              y={height - padding.bottom + 16}
              textAnchor="middle"
              fontSize="10"
              fill="#6b7280"
            >
              {v.label.length > 14 ? `${v.label.slice(0, 12)}...` : v.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

export default function SoftwareBugCostCalculatorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const presets = PRESETS[lang]

  const [monthlySalary, setMonthlySalary] = useState(12000)
  const [hoursPerMonth, setHoursPerMonth] = useState(168)
  const [teamSize, setTeamSize] = useState(2)
  const [phase, setPhase] = useState('production')
  const [hours, setHours] = useState({
    detection: 2,
    report: 1,
    fix: 4,
    testing: 2,
    deploy: 1,
    support: 6,
  })
  const [indirectCost, setIndirectCost] = useState(2000)
  const [affectedCustomers, setAffectedCustomers] = useState(100)
  const [revenueLossPerCustomer, setRevenueLossPerCustomer] = useState(10)

  const [copiedMarkdown, copyMarkdown] = useCopyToClipboard()
  const [copiedCode, copyCode] = useCopyToClipboard()

  const input = useMemo(
    () => ({
      monthlySalary,
      hoursPerMonth,
      teamSize,
      phase,
      hours,
      indirectCost,
      affectedCustomers,
      revenueLossPerCustomer,
    }),
    [monthlySalary, hoursPerMonth, teamSize, phase, hours, indirectCost, affectedCustomers, revenueLossPerCustomer]
  )

  const result = useMemo(() => calculateBugCost(input), [input])

  const handleHourChange = useCallback((key, value) => {
    setHours((prev) => ({ ...prev, [key]: value ?? 0 }))
  }, [])

  const handlePreset = useCallback(
    (preset) => {
      setMonthlySalary(preset.monthlySalary)
      setHoursPerMonth(preset.hoursPerMonth)
      setTeamSize(preset.teamSize)
      setPhase(preset.phase)
      setHours(preset.hours)
      setIndirectCost(preset.indirectCost)
      setAffectedCustomers(preset.affectedCustomers)
      setRevenueLossPerCustomer(preset.revenueLossPerCustomer)
    },
    []
  )

  const handleCopyMarkdown = useCallback(() => {
    if (!result) return
    copyMarkdown(exportMarkdown(result, t))
  }, [copyMarkdown, result, t])

  const isValid = result !== null

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}>
        <BugOutlined style={{ marginRight: 12 }} />
        {t.title}
      </Title>
      <Paragraph>{t.intro}</Paragraph>

      <Card title={t.presets} size="small">
        <Space wrap>
          {presets.map((preset) => (
            <Button key={preset.name} onClick={() => handlePreset(preset)}>
              {preset.name}
            </Button>
          ))}
        </Space>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title={t.inputLabel}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Text strong>{t.monthlySalary}</Text>
                  <InputNumber
                    min={0}
                    step={100}
                    value={monthlySalary}
                    onChange={setMonthlySalary}
                    style={{ width: '100%' }}
                    formatter={(v) => `R$ ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
                    parser={(v) => v?.replace(/[^\d]/g, '')}
                    prefix={<DollarOutlined />}
                  />
                </Col>
                <Col span={12}>
                  <Text strong>{t.hoursPerMonth}</Text>
                  <InputNumber min={1} max={744} value={hoursPerMonth} onChange={setHoursPerMonth} style={{ width: '100%' }} />
                </Col>
                <Col span={12}>
                  <Text strong>{t.teamSize}</Text>
                  <InputNumber min={1} max={50} value={teamSize} onChange={setTeamSize} style={{ width: '100%' }} />
                </Col>
                <Col span={12}>
                  <Text strong>
                    {t.phase}{' '}
                    <Tooltip title={t.phaseHelp}>
                      <InfoCircleOutlined />
                    </Tooltip>
                  </Text>
                  <Select value={phase} onChange={setPhase} style={{ width: '100%' }}>
                    {PHASES.map((p) => (
                      <Select.Option key={p.key} value={p.key}>
                        {t[p.key] || p.labelEn} ({p.multiplier}x)
                      </Select.Option>
                    ))}
                  </Select>
                </Col>
              </Row>

              <Divider orientation="left">{t.detailsTitle}</Divider>

              <Row gutter={[16, 16]}>
                {ACTIVITIES.map((act) => (
                  <Col span={12} key={act.key}>
                    <Text strong>{t[act.key] || act.labelEn}</Text>
                    <InputNumber
                      min={0}
                      step={0.5}
                      value={hours[act.key]}
                      onChange={(v) => handleHourChange(act.key, v)}
                      style={{ width: '100%' }}
                      addonAfter={t.hourSuffix}
                    />
                  </Col>
                ))}
              </Row>

              <Divider orientation="left">{t.indirectCost}</Divider>

              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Text strong>{t.indirectCost}</Text>
                  <InputNumber
                    min={0}
                    step={100}
                    value={indirectCost}
                    onChange={setIndirectCost}
                    style={{ width: '100%' }}
                    formatter={(v) => `R$ ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
                    parser={(v) => v?.replace(/[^\d]/g, '')}
                  />
                </Col>
                <Col span={12}>
                  <Text strong>{t.affectedCustomers}</Text>
                  <InputNumber min={0} value={affectedCustomers} onChange={setAffectedCustomers} style={{ width: '100%' }} />
                </Col>
                <Col span={12}>
                  <Text strong>{t.revenueLossPerCustomer}</Text>
                  <InputNumber
                    min={0}
                    step={1}
                    value={revenueLossPerCustomer}
                    onChange={setRevenueLossPerCustomer}
                    style={{ width: '100%' }}
                    formatter={(v) => `R$ ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
                    parser={(v) => v?.replace(/[^\d]/g, '')}
                  />
                </Col>
              </Row>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title={t.resultsTitle}>
            {!isValid ? (
              <Alert message={t.emptyHint} type="warning" showIcon />
            ) : (
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text strong>{t.phase}</Text>
                  <PhaseTag phase={result.phase} t={t} />
                </div>

                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Statistic title={t.hourlyRate} value={formatCurrency(result.teamHourlyRate)} suffix="/h" />
                  </Col>
                  <Col span={12}>
                    <Statistic title={t.totalHours} value={formatHours(result.totalHours, t)} />
                  </Col>
                  <Col span={12}>
                    <Statistic title={t.directCost} value={formatCurrency(result.directCost)} />
                  </Col>
                  <Col span={12}>
                    <Statistic title={t.adjustedDirectCost} value={formatCurrency(result.adjustedDirectCost)} />
                  </Col>
                  <Col span={12}>
                    <Statistic title={t.indirectCost} value={formatCurrency(result.indirectCost)} />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title={t.totalCost}
                      value={formatCurrency(result.totalCost)}
                      valueStyle={{ color: '#cf1322' }}
                      prefix={<CalculatorOutlined />}
                    />
                  </Col>
                </Row>

                {result.savingsIfDetectedEarlier > 0 && (
                  <Alert
                    message={`${t.savingsIfEarlier}: ${formatCurrency(result.savingsIfDetectedEarlier)}`}
                    type="info"
                    showIcon
                  />
                )}

                <Card title={t.chartTitle} size="small" style={{ marginTop: 8 }}>
                  <CostChart result={result} t={t} />
                </Card>

                <Space>
                  <Button icon={<FileMarkdownOutlined />} onClick={handleCopyMarkdown}>
                    {copiedMarkdown ? t.copied : t.copyMarkdown}
                  </Button>
                </Space>
              </Space>
            )}
          </Card>
        </Col>
      </Row>

      <Collapse>
        <Panel header={t.sourceTitle} extra={<CodeOutlined />}>
          <Paragraph>{t.sourceIntro}</Paragraph>
          <pre
            style={{
              background: '#f6f8fa',
              padding: 16,
              borderRadius: 8,
              overflow: 'auto',
            }}
          >
            <code>{sourceCode}</code>
          </pre>
          <Button icon={<CopyOutlined />} onClick={() => copyCode(sourceCode)}>
            {copiedCode ? t.copied : t.copyCode}
          </Button>
        </Panel>
      </Collapse>
    </Space>
  )
}
