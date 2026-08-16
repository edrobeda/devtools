import React, { useMemo, useState, useCallback } from 'react'
import {
  Typography,
  Card,
  InputNumber,
  Space,
  Select,
  Row,
  Col,
  Statistic,
  Tag,
  Alert,
  Collapse,
  Button,
  Tooltip,
} from 'antd'
import {
  DollarOutlined,
  CopyOutlined,
  InfoCircleOutlined,
  ExperimentOutlined,
  FileTextOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  calculateDowntimeCost,
  annualRevenueToHourlyRate,
  hourlyRateToRate,
  formatCurrency,
  formatNumber,
  makePresets,
  exportReport,
  TIME_UNITS,
  CURRENCIES,
} from '../utils/downtimeCostCalculator'
import useCopyToClipboard from '../hooks/useCopyToClipboard'

const { Title, Paragraph, Text } = Typography
const { Panel } = Collapse
const { Option } = Select

const sourceCode = `import {
  calculateDowntimeCost,
  annualRevenueToHourlyRate,
  hourlyRateToRate,
} from '../utils/downtimeCostCalculator'

// Custo total de um incidente combinando fontes de perda
const result = calculateDowntimeCost({
  annualRevenue: 5_000_000,
  uptimeRatio: 1,
  affectedUsers: 12_000,
  averageOrderValue: 80,
  conversionRate: 2.5,
  engineers: 6,
  hourlySalary: 75,
  monthlyRecurringRevenue: 0,
  penaltyRate: 0,
  exceededDuration: 0,
  duration: 2,
  durationUnit: 'hour',
})
// result.total, result.revenueLoss, result.userLoss, result.teamCost, result.slaPenalty

// Receita anual → taxa por unidade de tempo
const hourly = annualRevenueToHourlyRate(5_000_000)
const perMinute = hourlyRateToRate(hourly, 'minute')
`

const translations = {
  pt: {
    title: 'Calculadora de Custo de Downtime',
    subtitle: 'Estime o impacto financeiro de incidentes em produção',
    intro: 'Some receita direta perdida, pedidos não convertidos, custo salarial da equipe envolvida e possíveis penalidades de SLA para dimensionar o prejuízo real de uma indisponibilidade. Tudo acontece no navegador — nenhum dado financeiro sai daqui.',
    durationLabel: 'Duração do incidente',
    durationUnitLabel: 'Unidade',
    revenueSection: 'Receita',
    annualRevenueLabel: 'Receita anual',
    uptimeRatioLabel: 'Taxa de uptime esperada',
    usersSection: 'Impacto em usuários',
    affectedUsersLabel: 'Usuários afetados',
    averageOrderValueLabel: 'Ticket médio',
    conversionRateLabel: 'Taxa de conversão (%)',
    teamSection: 'Custo da equipe',
    engineersLabel: 'Engenheiros envolvidos',
    hourlySalaryLabel: 'Custo/hora por engenheiro',
    slaSection: 'Penalidade de SLA',
    monthlyRecurringRevenueLabel: 'MRR (receita recorrente mensal)',
    penaltyRateLabel: 'Taxa de penalidade (%)',
    exceededDurationLabel: 'Tempo excedido ao SLA',
    resultTitle: 'Custo estimado do incidente',
    revenueLoss: 'Receita direta perdida',
    userLoss: 'Pedidos perdidos',
    teamCost: 'Custo da equipe',
    slaPenalty: 'Penalidade SLA',
    total: 'Total estimado',
    perHour: 'custo/hora',
    perMinute: 'custo/minuto',
    perSecond: 'custo/segundo',
    presets: 'Cenários rápidos',
    currencyLabel: 'Moeda',
    sourceTitle: 'Motor de cálculo',
    sourceIntro: 'O motor é puro JavaScript client-side — nenhum dado financeiro sai do navegador.',
    copy: 'Copiar relatório',
    copied: 'Copiado!',
    reset: 'Limpar tudo',
    chartTitle: 'Composição do custo',
    chartCaption: 'Soma das fontes de perda que tiveram valores preenchidos.',
    emptyWarning: 'Preencha ao menos uma fonte de custo (receita, usuários, equipe ou SLA).',
    uptimeHint: 'Fator que reflete a parcela da receita que depende diretamente do sistema online. 100% significa que toda a receita está em risco durante a indisponibilidade.',
  },
  en: {
    title: 'Downtime Cost Calculator',
    subtitle: 'Estimate the financial impact of production incidents',
    intro: 'Add up direct revenue loss, missed conversions, team wages during the incident and possible SLA penalties to size the real damage of an outage. Everything runs in the browser — no financial data leaves your machine.',
    durationLabel: 'Incident duration',
    durationUnitLabel: 'Unit',
    revenueSection: 'Revenue',
    annualRevenueLabel: 'Annual revenue',
    uptimeRatioLabel: 'Expected uptime ratio',
    usersSection: 'User impact',
    affectedUsersLabel: 'Affected users',
    averageOrderValueLabel: 'Average order value',
    conversionRateLabel: 'Conversion rate (%)',
    teamSection: 'Team cost',
    engineersLabel: 'Engineers involved',
    hourlySalaryLabel: 'Hourly cost per engineer',
    slaSection: 'SLA penalty',
    monthlyRecurringRevenueLabel: 'MRR (monthly recurring revenue)',
    penaltyRateLabel: 'Penalty rate (%)',
    exceededDurationLabel: 'Time exceeded beyond SLA',
    resultTitle: 'Estimated incident cost',
    revenueLoss: 'Direct revenue loss',
    userLoss: 'Missed orders',
    teamCost: 'Team cost',
    slaPenalty: 'SLA penalty',
    total: 'Estimated total',
    perHour: 'cost/hour',
    perMinute: 'cost/minute',
    perSecond: 'cost/second',
    presets: 'Quick scenarios',
    currencyLabel: 'Currency',
    sourceTitle: 'Calculation engine',
    sourceIntro: 'The engine is pure client-side JavaScript — no financial data leaves the browser.',
    copy: 'Copy report',
    copied: 'Copied!',
    reset: 'Clear all',
    chartTitle: 'Cost breakdown',
    chartCaption: 'Sum of the loss sources that have values filled in.',
    emptyWarning: 'Fill in at least one cost source (revenue, users, team or SLA).',
    uptimeHint: 'Factor reflecting how much revenue directly depends on the system being online. 100% means all revenue is at risk during downtime.',
  },
}

function BreakdownChart({ parts, currency, lang }) {
  if (!parts.length) return null
  const max = Math.max(...parts.map((p) => p.value))
  const fmt = (v) => formatCurrency(v, currency, lang === 'pt' ? 'pt-BR' : 'en-US')
  const colors = ['#1677ff', '#52c41a', '#faad14', '#eb2f96']

  return (
    <div style={{ marginTop: 8 }}>
      <Text strong>{translations[lang].chartTitle}</Text>
      <Space direction="vertical" size="small" style={{ width: '100%', marginTop: 8 }}>
        {parts.map((p, i) => (
          <div key={p.key}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <Text>{p.label}</Text>
              <Text strong>{fmt(p.value)}</Text>
            </div>
            <div
              style={{
                height: 18,
                width: '100%',
                background: '#f0f0f0',
                borderRadius: 4,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${max > 0 ? (p.value / max) * 100 : 0}%`,
                  background: colors[i % colors.length],
                  borderRadius: 4,
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          </div>
        ))}
      </Space>
      <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 8 }}>
        {translations[lang].chartCaption}
      </Text>
    </div>
  )
}

export default function DowntimeCostCalculatorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [copied, copy] = useCopyToClipboard()

  const [duration, setDuration] = useState(2)
  const [durationUnit, setDurationUnit] = useState('hour')
  const [currency, setCurrency] = useState('USD')

  const [annualRevenue, setAnnualRevenue] = useState(5000000)
  const [uptimeRatio, setUptimeRatio] = useState(1)

  const [affectedUsers, setAffectedUsers] = useState(12000)
  const [averageOrderValue, setAverageOrderValue] = useState(80)
  const [conversionRate, setConversionRate] = useState(2.5)

  const [engineers, setEngineers] = useState(6)
  const [hourlySalary, setHourlySalary] = useState(75)

  const [monthlyRecurringRevenue, setMonthlyRecurringRevenue] = useState(0)
  const [penaltyRate, setPenaltyRate] = useState(0)
  const [exceededDuration, setExceededDuration] = useState(0)

  const params = useMemo(
    () => ({
      annualRevenue,
      uptimeRatio,
      affectedUsers,
      averageOrderValue,
      conversionRate,
      engineers,
      hourlySalary,
      monthlyRecurringRevenue,
      penaltyRate,
      exceededDuration,
      duration,
      durationUnit,
    }),
    [
      annualRevenue,
      uptimeRatio,
      affectedUsers,
      averageOrderValue,
      conversionRate,
      engineers,
      hourlySalary,
      monthlyRecurringRevenue,
      penaltyRate,
      exceededDuration,
      duration,
      durationUnit,
    ]
  )

  const result = useMemo(() => calculateDowntimeCost(params), [params])

  const hourlyRate = useMemo(
    () => annualRevenueToHourlyRate(annualRevenue, uptimeRatio),
    [annualRevenue, uptimeRatio]
  )

  const fmt = useCallback(
    (v) => formatCurrency(v, currency, lang === 'pt' ? 'pt-BR' : 'en-US'),
    [currency, lang]
  )

  const handlePreset = useCallback(
    (preset) => {
      setDuration(preset.duration)
      setDurationUnit(preset.durationUnit)
      setAnnualRevenue(preset.annualRevenue)
      setUptimeRatio(preset.uptimeRatio)
      setAffectedUsers(preset.affectedUsers)
      setAverageOrderValue(preset.averageOrderValue)
      setConversionRate(preset.conversionRate)
      setEngineers(preset.engineers)
      setHourlySalary(preset.hourlySalary)
      setMonthlyRecurringRevenue(preset.monthlyRecurringRevenue)
      setPenaltyRate(preset.penaltyRate)
      setExceededDuration(preset.exceededDuration)
    },
    []
  )

  const handleCopy = useCallback(() => {
    copy(exportReport(params, result, currency, lang))
  }, [copy, params, result, currency, lang])

  const handleReset = useCallback(() => {
    setDuration(1)
    setDurationUnit('hour')
    setAnnualRevenue(0)
    setUptimeRatio(1)
    setAffectedUsers(0)
    setAverageOrderValue(0)
    setConversionRate(0)
    setEngineers(0)
    setHourlySalary(0)
    setMonthlyRecurringRevenue(0)
    setPenaltyRate(0)
    setExceededDuration(0)
  }, [])

  const hasInput =
    Number(annualRevenue) > 0 ||
    Number(affectedUsers) > 0 ||
    Number(engineers) > 0 ||
    Number(monthlyRecurringRevenue) > 0

  const presets = useMemo(() => makePresets(lang), [lang])

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}>
        <DollarOutlined /> {t.title}
      </Title>
      <Paragraph type="secondary">{t.subtitle}</Paragraph>
      <Paragraph>{t.intro}</Paragraph>

      <Card size="small" title={t.durationLabel}>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Text strong>{t.durationLabel}</Text>
            <InputNumber
              value={duration}
              onChange={setDuration}
              style={{ width: '100%' }}
              min={0}
              step={0.1}
            />
          </Col>
          <Col xs={24} md={12}>
            <Text strong>{t.durationUnitLabel}</Text>
            <Select
              value={durationUnit}
              onChange={setDurationUnit}
              style={{ width: '100%' }}
              options={TIME_UNITS.map((u) => ({
                label: lang === 'pt' ? u.labelPt : u.labelEn,
                value: u.key,
              }))}
            />
          </Col>
        </Row>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card size="small" title={t.revenueSection}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Text strong>{t.annualRevenueLabel}</Text>
                <InputNumber
                  value={annualRevenue}
                  onChange={setAnnualRevenue}
                  style={{ width: '100%' }}
                  min={0}
                  step={1000}
                  prefix={currency}
                />
              </div>
              <div>
                <Text strong>
                  {t.uptimeRatioLabel}
                  <Tooltip title={t.uptimeHint}>
                    <InfoCircleOutlined style={{ marginLeft: 6, color: '#8c8c8c' }} />
                  </Tooltip>
                </Text>
                <InputNumber
                  value={uptimeRatio}
                  onChange={setUptimeRatio}
                  style={{ width: '100%' }}
                  min={0}
                  max={1}
                  step={0.05}
                  formatter={(v) => `${Number(v || 0).toFixed(2)}`}
                />
              </div>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card size="small" title={t.usersSection}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Text strong>{t.affectedUsersLabel}</Text>
                <InputNumber
                  value={affectedUsers}
                  onChange={setAffectedUsers}
                  style={{ width: '100%' }}
                  min={0}
                  step={100}
                />
              </div>
              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <Text strong>{t.averageOrderValueLabel}</Text>
                  <InputNumber
                    value={averageOrderValue}
                    onChange={setAverageOrderValue}
                    style={{ width: '100%' }}
                    min={0}
                    step={1}
                  />
                </Col>
                <Col xs={24} md={12}>
                  <Text strong>{t.conversionRateLabel}</Text>
                  <InputNumber
                    value={conversionRate}
                    onChange={setConversionRate}
                    style={{ width: '100%' }}
                    min={0}
                    step={0.1}
                  />
                </Col>
              </Row>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card size="small" title={t.teamSection}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <Text strong>{t.engineersLabel}</Text>
                  <InputNumber
                    value={engineers}
                    onChange={setEngineers}
                    style={{ width: '100%' }}
                    min={0}
                    step={1}
                  />
                </Col>
                <Col xs={24} md={12}>
                  <Text strong>{t.hourlySalaryLabel}</Text>
                  <InputNumber
                    value={hourlySalary}
                    onChange={setHourlySalary}
                    style={{ width: '100%' }}
                    min={0}
                    step={5}
                  />
                </Col>
              </Row>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card size="small" title={t.slaSection}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Text strong>{t.monthlyRecurringRevenueLabel}</Text>
                <InputNumber
                  value={monthlyRecurringRevenue}
                  onChange={setMonthlyRecurringRevenue}
                  style={{ width: '100%' }}
                  min={0}
                  step={1000}
                  prefix={currency}
                />
              </div>
              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <Text strong>{t.penaltyRateLabel}</Text>
                  <InputNumber
                    value={penaltyRate}
                    onChange={setPenaltyRate}
                    style={{ width: '100%' }}
                    min={0}
                    step={0.5}
                  />
                </Col>
                <Col xs={24} md={12}>
                  <Text strong>{t.exceededDurationLabel}</Text>
                  <InputNumber
                    value={exceededDuration}
                    onChange={setExceededDuration}
                    style={{ width: '100%' }}
                    min={0}
                    step={0.1}
                  />
                </Col>
              </Row>
            </Space>
          </Card>
        </Col>
      </Row>

      <Card title={t.resultTitle} size="small">
        {hasInput ? (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Row gutter={[16, 16]}>
              <Col xs={24} md={8}>
                <Statistic title={t.total} value={fmt(result.total)} valueStyle={{ color: '#cf1322' }} />
              </Col>
              <Col xs={24} md={8}>
                <Statistic
                  title={t.perHour}
                  value={hourlyRate != null ? fmt(hourlyRate) : '—'}
                />
              </Col>
              <Col xs={24} md={8}>
                <Statistic
                  title={t.perMinute}
                  value={hourlyRate != null ? fmt(hourlyRateToRate(hourlyRate, 'minute')) : '—'}
                />
              </Col>
            </Row>
            <Row gutter={[16, 16]}>
              <Col xs={24} md={6}>
                <Statistic title={t.revenueLoss} value={fmt(result.revenueLoss)} />
              </Col>
              <Col xs={24} md={6}>
                <Statistic title={t.userLoss} value={fmt(result.userLoss)} />
              </Col>
              <Col xs={24} md={6}>
                <Statistic title={t.teamCost} value={fmt(result.teamCost)} />
              </Col>
              <Col xs={24} md={6}>
                <Statistic title={t.slaPenalty} value={fmt(result.slaPenalty)} />
              </Col>
            </Row>
            <BreakdownChart parts={result.parts} currency={currency} lang={lang} />
          </Space>
        ) : (
          <Alert type="warning" showIcon message={t.emptyWarning} />
        )}
      </Card>

      <Space wrap>
        <Text type="secondary">{t.presets}:</Text>
        {presets.map((preset) => (
          <Tooltip key={preset.name} title={preset.name}>
            <Button size="small" icon={<ExperimentOutlined />} onClick={() => handlePreset(preset)}>
              {preset.name}
            </Button>
          </Tooltip>
        ))}
      </Space>

      <Space wrap>
        <Text strong>{t.currencyLabel}:</Text>
        <Select value={currency} onChange={setCurrency} style={{ width: 120 }}>
          {CURRENCIES.map((c) => (
            <Option key={c.key} value={c.key}>
              {c.label}
            </Option>
          ))}
        </Select>
      </Space>

      <Space>
        <Button icon={<CopyOutlined />} onClick={handleCopy}>
          {copied ? t.copied : t.copy}
        </Button>
        <Button icon={<FileTextOutlined />} onClick={handleReset}>
          {t.reset}
        </Button>
      </Space>

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
