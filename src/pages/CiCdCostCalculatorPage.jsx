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
  Alert,
  Collapse,
  Button,
  Tooltip,
} from 'antd'
import {
  DollarOutlined,
  CopyOutlined,
  ExperimentOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  calculateCiCdCost,
  providerByKey,
  formatCurrency,
  formatNumber,
  makePresets,
  exportReport,
  PROVIDERS,
  CURRENCIES,
} from '../utils/ciCdCostCalculator'
import useCopyToClipboard from '../hooks/useCopyToClipboard'

const { Title, Paragraph, Text } = Typography
const { Panel } = Collapse
const { Option } = Select

const sourceCode = `import {
  calculateCiCdCost,
  providerByKey,
} from '../utils/ciCdCostCalculator'

const result = calculateCiCdCost({
  minutesPerBuild: 8,
  buildsPerDay: 25,
  workdaysPerMonth: 22,
  concurrentRunners: 2,
  costPerMinute: providerByKey('github-actions').costPerMinute,
  overheadPercent: 15,
})
// result.monthlyMinutes, result.monthlyCost, result.annualCost, result.costPerBuild
`

const translations = {
  pt: {
    title: 'Calculadora de Custo de CI/CD',
    subtitle: 'Estime quanto sua pipeline de build gasta por mês/ano',
    intro: 'Some o tempo dos jobs, a frequência de builds e o custo por minuto do runner para dimensionar o gasto real com CI/CD. Tudo acontece no navegador — nenhum dado sai daqui.',
    providerLabel: 'Provedor / runner',
    minutesPerBuildLabel: 'Minutos por build',
    buildsPerDayLabel: 'Builds por dia',
    workdaysPerMonthLabel: 'Dias úteis por mês',
    concurrentRunnersLabel: 'Runners concorrentes',
    costPerMinuteLabel: 'Custo por minuto',
    overheadLabel: 'Overhead (retentativas, fila, %)',
    resultTitle: 'Custo estimado',
    monthlyCost: 'Custo mensal',
    annualCost: 'Custo anual',
    costPerBuild: 'Custo por build',
    monthlyMinutes: 'Minutos/mês',
    monthlyHours: 'Horas/mês',
    runnerUtilization: 'Utilização/runner',
    selfHostedHint: 'Equivalente em VM auto-hospedada (~$0.12/hora)',
    presets: 'Cenários rápidos',
    currencyLabel: 'Moeda',
    sourceTitle: 'Motor de cálculo',
    sourceIntro: 'O motor é puro JavaScript client-side — nenhum dado sai do navegador.',
    copy: 'Copiar relatório',
    copied: 'Copiado!',
    reset: 'Limpar tudo',
    chartTitle: 'Comparação de custo',
    chartCaption: 'Runners gerenciados vs estimativa de VM auto-hospedada.',
    emptyWarning: 'Preencha ao menos minutos por build e builds por dia.',
    overheadHint: 'Percentual extra para retentativas, jobs de limpeza, filas e builds fora do caminho feliz.',
  },
  en: {
    title: 'CI/CD Cost Calculator',
    subtitle: 'Estimate how much your build pipeline spends per month/year',
    intro: 'Add up job time, build frequency and runner cost per minute to size the real CI/CD spend. Everything runs in the browser — no data leaves your machine.',
    providerLabel: 'Provider / runner',
    minutesPerBuildLabel: 'Minutes per build',
    buildsPerDayLabel: 'Builds per day',
    workdaysPerMonthLabel: 'Workdays per month',
    concurrentRunnersLabel: 'Concurrent runners',
    costPerMinuteLabel: 'Cost per minute',
    overheadLabel: 'Overhead (retries, queue, %)',
    resultTitle: 'Estimated cost',
    monthlyCost: 'Monthly cost',
    annualCost: 'Annual cost',
    costPerBuild: 'Cost per build',
    monthlyMinutes: 'Minutes/month',
    monthlyHours: 'Hours/month',
    runnerUtilization: 'Utilization/runner',
    selfHostedHint: 'Equivalent self-hosted VM cost (~$0.12/hour)',
    presets: 'Quick scenarios',
    currencyLabel: 'Currency',
    sourceTitle: 'Calculation engine',
    sourceIntro: 'The engine is pure client-side JavaScript — no data leaves the browser.',
    copy: 'Copy report',
    copied: 'Copied!',
    reset: 'Clear all',
    chartTitle: 'Cost comparison',
    chartCaption: 'Managed runners vs estimated self-hosted VM cost.',
    emptyWarning: 'Fill in at least minutes per build and builds per day.',
    overheadHint: 'Extra percentage for retries, cleanup jobs, queue time and builds off the happy path.',
  },
}

function ComparisonChart({ managedCost, selfHostedCost, currency, lang }) {
  const max = Math.max(managedCost, selfHostedCost, 1)
  const fmt = (v) => formatCurrency(v, currency, lang === 'pt' ? 'pt-BR' : 'en-US')
  const items = [
    { key: 'managed', label: translations[lang].monthlyCost, value: managedCost, color: '#1677ff' },
    { key: 'selfhosted', label: translations[lang].selfHostedHint, value: selfHostedCost, color: '#52c41a' },
  ]

  return (
    <div style={{ marginTop: 8 }}>
      <Text strong>{translations[lang].chartTitle}</Text>
      <Space direction="vertical" size="small" style={{ width: '100%', marginTop: 8 }}>
        {items.map((item) => (
          <div key={item.key}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <Text>{item.label}</Text>
              <Text strong>{fmt(item.value)}</Text>
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
                  width: `${(item.value / max) * 100}%`,
                  background: item.color,
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

export default function CiCdCostCalculatorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [copied, copy] = useCopyToClipboard()

  const [provider, setProvider] = useState('github-actions')
  const [currency, setCurrency] = useState('USD')
  const [minutesPerBuild, setMinutesPerBuild] = useState(8)
  const [buildsPerDay, setBuildsPerDay] = useState(25)
  const [workdaysPerMonth, setWorkdaysPerMonth] = useState(22)
  const [concurrentRunners, setConcurrentRunners] = useState(2)
  const [costPerMinute, setCostPerMinute] = useState(providerByKey('github-actions').costPerMinute)
  const [overheadPercent, setOverheadPercent] = useState(15)

  const selectedProvider = useMemo(() => providerByKey(provider), [provider])

  // Atualiza custo por minuto quando o provedor muda, mas preserva valor
  // customizado quando o usuário já editou manualmente.
  const handleProviderChange = useCallback((key) => {
    setProvider(key)
    const p = providerByKey(key)
    if (key !== 'custom') {
      setCostPerMinute(p.costPerMinute)
    }
  }, [])

  const params = useMemo(
    () => ({
      provider,
      minutesPerBuild,
      buildsPerDay,
      workdaysPerMonth,
      concurrentRunners,
      costPerMinute,
      overheadPercent,
    }),
    [provider, minutesPerBuild, buildsPerDay, workdaysPerMonth, concurrentRunners, costPerMinute, overheadPercent]
  )

  const result = useMemo(() => calculateCiCdCost(params), [params])

  const fmt = useCallback(
    (v) => formatCurrency(v, currency, lang === 'pt' ? 'pt-BR' : 'en-US'),
    [currency, lang]
  )

  const handlePreset = useCallback(
    (preset) => {
      setProvider(preset.provider)
      setMinutesPerBuild(preset.minutesPerBuild)
      setBuildsPerDay(preset.buildsPerDay)
      setWorkdaysPerMonth(preset.workdaysPerMonth)
      setConcurrentRunners(preset.concurrentRunners)
      setOverheadPercent(preset.overheadPercent)
      const p = providerByKey(preset.provider)
      setCostPerMinute(p.costPerMinute)
    },
    []
  )

  const handleCopy = useCallback(() => {
    copy(exportReport(params, result, currency, lang))
  }, [copy, params, result, currency, lang])

  const handleReset = useCallback(() => {
    setProvider('github-actions')
    setMinutesPerBuild(8)
    setBuildsPerDay(25)
    setWorkdaysPerMonth(22)
    setConcurrentRunners(2)
    setOverheadPercent(15)
    setCostPerMinute(providerByKey('github-actions').costPerMinute)
  }, [])

  const hasInput = Number(minutesPerBuild) > 0 && Number(buildsPerDay) > 0

  const presets = useMemo(() => makePresets(lang), [lang])

  const providerOptions = useMemo(
    () =>
      PROVIDERS.map((p) => ({
        value: p.key,
        label: lang === 'pt' ? p.namePt : p.nameEn,
      })),
    [lang]
  )

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}>
        <DollarOutlined /> {t.title}
      </Title>
      <Paragraph type="secondary">{t.subtitle}</Paragraph>
      <Paragraph>{t.intro}</Paragraph>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card size="small" title={t.providerLabel}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Select
                value={provider}
                onChange={handleProviderChange}
                style={{ width: '100%' }}
                options={providerOptions}
              />
              <div>
                <Text strong>{t.costPerMinuteLabel}</Text>
                <InputNumber
                  value={costPerMinute}
                  onChange={setCostPerMinute}
                  style={{ width: '100%' }}
                  min={0}
                  step={0.001}
                  prefix={currency}
                  disabled={provider !== 'custom'}
                />
              </div>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card size="small" title={t.overheadLabel}>
            <Text strong>
              {t.overheadLabel}
              <Tooltip title={t.overheadHint}>
                <InfoCircleOutlined style={{ marginLeft: 6, color: '#8c8c8c' }} />
              </Tooltip>
            </Text>
            <InputNumber
              value={overheadPercent}
              onChange={setOverheadPercent}
              style={{ width: '100%' }}
              min={0}
              max={100}
              step={5}
              formatter={(v) => `${Number(v || 0).toFixed(0)}%`}
            />
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card size="small" title={t.minutesPerBuildLabel}>
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Text strong>{t.minutesPerBuildLabel}</Text>
                <InputNumber
                  value={minutesPerBuild}
                  onChange={setMinutesPerBuild}
                  style={{ width: '100%' }}
                  min={0}
                  step={1}
                />
              </Col>
              <Col xs={24} md={12}>
                <Text strong>{t.buildsPerDayLabel}</Text>
                <InputNumber
                  value={buildsPerDay}
                  onChange={setBuildsPerDay}
                  style={{ width: '100%' }}
                  min={0}
                  step={1}
                />
              </Col>
            </Row>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card size="small" title={t.workdaysPerMonthLabel}>
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Text strong>{t.workdaysPerMonthLabel}</Text>
                <InputNumber
                  value={workdaysPerMonth}
                  onChange={setWorkdaysPerMonth}
                  style={{ width: '100%' }}
                  min={1}
                  max={31}
                  step={1}
                />
              </Col>
              <Col xs={24} md={12}>
                <Text strong>{t.concurrentRunnersLabel}</Text>
                <InputNumber
                  value={concurrentRunners}
                  onChange={setConcurrentRunners}
                  style={{ width: '100%' }}
                  min={1}
                  step={1}
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      <Card title={t.resultTitle} size="small">
        {hasInput ? (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Row gutter={[16, 16]}>
              <Col xs={24} md={8}>
                <Statistic title={t.monthlyCost} value={fmt(result.monthlyCost)} valueStyle={{ color: '#cf1322' }} />
              </Col>
              <Col xs={24} md={8}>
                <Statistic title={t.annualCost} value={fmt(result.annualCost)} />
              </Col>
              <Col xs={24} md={8}>
                <Statistic title={t.costPerBuild} value={fmt(result.costPerBuild)} />
              </Col>
            </Row>
            <Row gutter={[16, 16]}>
              <Col xs={24} md={6}>
                <Statistic title={t.monthlyMinutes} value={formatNumber(result.monthlyMinutes, 0)} />
              </Col>
              <Col xs={24} md={6}>
                <Statistic title={t.monthlyHours} value={formatNumber(result.monthlyHours, 1)} />
              </Col>
              <Col xs={24} md={6}>
                <Statistic title={t.runnerUtilization} value={formatNumber(result.runnerUtilization, 0)} />
              </Col>
              <Col xs={24} md={6}>
                <Statistic title={t.selfHostedHint} value={fmt(result.equivalentSelfHostedCost)} />
              </Col>
            </Row>
            <ComparisonChart
              managedCost={result.monthlyCost}
              selfHostedCost={result.equivalentSelfHostedCost}
              currency={currency}
              lang={lang}
            />
          </Space>
        ) : (
          <Alert type="warning" showIcon message={t.emptyWarning} />
        )}
      </Card>

      <Space wrap>
        <Text type="secondary">{t.presets}:</Text>
        {presets.map((preset) => (
          <Button key={preset.name} size="small" icon={<ExperimentOutlined />} onClick={() => handlePreset(preset)}>
            {preset.name}
          </Button>
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
