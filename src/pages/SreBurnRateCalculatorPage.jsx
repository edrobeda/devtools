import React, { useMemo, useState } from 'react'
import {
  Typography,
  Card,
  InputNumber,
  Space,
  Slider,
  Row,
  Col,
  Statistic,
  Tag,
  Alert,
  Collapse,
  Button,
  Table,
  Select,
  Progress,
  Tooltip,
} from 'antd'
import {
  FireOutlined,
  InfoCircleOutlined,
  SyncOutlined,
  DashboardOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  calculateErrorBudget,
  getWindowOptions,
  getAlertRules,
  getPresets,
  formatNumber,
  formatDuration,
} from '../utils/sreBurnRateCalculator'

const { Title, Paragraph, Text } = Typography
const { Panel } = Collapse

const sourceCode = `import { calculateErrorBudget } from '../utils/sreBurnRateCalculator'

// SLO de 99.9% com taxa de erros atual de 0.5%
calculateErrorBudget({
  slo: 0.999,
  errorRate: 0.005,
  totalRequests: 1_000_000,
  windowDays: 30,
})
// {
//   slo: 0.999,
//   errorRate: 0.005,
//   errorBudget: 0.001,
//   burnRate: 5,
//   timeToExhaustHours: 144,
//   recommendedAlert: { burnRate: 14.4, severity: 'page' },
//   absolute: {
//     totalRequests: 1_000_000,
//     errorBudgetAbsolute: 1_000,
//     errorsAbsolute: 5_000,
//     budgetRemainingAbsolute: -4_000,
//     budgetConsumedRatio: 1,
//   },
// }
`

const translations = {
  pt: {
    title: 'Calculadora de Burn Rate SRE',
    subtitle: 'Error budget, burn rate e alertas',
    intro: 'Estime se o ritmo atual de erros consome o error budget dentro da janela de conformidade do SLO. Use os presets para cenários comuns e a tabela de regras para decidir quando pagear, abrir ticket ou apenas enviar e-mail.',
    slo: 'SLO (objetivo)',
    sloHelp: 'Porcentagem de sucesso esperada (ex.: 99.9%).',
    errorRate: 'Taxa de erros atual',
    errorRateHelp: 'Porcentagem de requests que falham agora (ex.: 0.5%).',
    totalRequests: 'Volume total de requests',
    totalRequestsHelp: 'Opcional. Converte o budget em números absolutos.',
    window: 'Janela de conformidade',
    presets: 'Exemplos de um clique',
    results: 'Resultados',
    errorBudget: 'Error budget',
    burnRate: 'Burn rate',
    timeToExhaust: 'Tempo até esgotar',
    recommendedAlert: 'Alerta recomendado',
    budgetConsumed: 'Budget consumido',
    absoluteNumbers: 'Números absolutos',
    totalReq: 'Total',
    budgetReq: 'Budget permitido',
    errorsReq: 'Erros observados',
    remainingReq: 'Budget restante',
    alertRules: 'Regras de alerta',
    severity: 'Severidade',
    threshold: 'Threshold',
    action: 'Ação',
    exhausted: 'Esgotado',
    noRisk: 'Sem risco',
    note: 'O burn rate é a taxa de erros atual dividida pelo error budget. Um burn rate de 1× significa que o budget durará exatamente a janela escolhida. Acima de 1×, o budget esgota antes do previsto.',
    clear: 'Limpar',
    sourceTitle: 'Motor de cálculo',
    sourceIntro: 'O motor é puro JavaScript client-side — nenhum dado sai do navegador.',
  },
  en: {
    title: 'SRE Burn Rate Calculator',
    subtitle: 'Error budget, burn rate and alerts',
    intro: 'Estimate whether the current error rate will consume the error budget within the SLO compliance window. Use the presets for common scenarios and the alert rules table to decide when to page, open a ticket, or just send an email.',
    slo: 'SLO target',
    sloHelp: 'Expected success percentage (e.g. 99.9%).',
    errorRate: 'Current error rate',
    errorRateHelp: 'Percentage of failing requests right now (e.g. 0.5%).',
    totalRequests: 'Total request volume',
    totalRequestsHelp: 'Optional. Converts the budget into absolute numbers.',
    window: 'Compliance window',
    presets: 'One-click examples',
    results: 'Results',
    errorBudget: 'Error budget',
    burnRate: 'Burn rate',
    timeToExhaust: 'Time to exhaust',
    recommendedAlert: 'Recommended alert',
    budgetConsumed: 'Budget consumed',
    absoluteNumbers: 'Absolute numbers',
    totalReq: 'Total',
    budgetReq: 'Allowed budget',
    errorsReq: 'Observed errors',
    remainingReq: 'Remaining budget',
    alertRules: 'Alert rules',
    severity: 'Severity',
    threshold: 'Threshold',
    action: 'Action',
    exhausted: 'Exhausted',
    noRisk: 'No risk',
    note: 'Burn rate is the current error rate divided by the error budget. A burn rate of 1× means the budget will last exactly the chosen window. Above 1×, the budget will be exhausted sooner than expected.',
    clear: 'Clear',
    sourceTitle: 'Calculation engine',
    sourceIntro: 'The engine is pure client-side JavaScript — no data leaves the browser.',
  },
}

const severityColor = {
  critical: 'red',
  page: 'orange',
  ticket: 'blue',
  email: 'default',
}

export default function SreBurnRateCalculatorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [slo, setSlo] = useState(99.9)
  const [errorRate, setErrorRate] = useState(0.5)
  const [totalRequests, setTotalRequests] = useState(1_000_000)
  const [windowDays, setWindowDays] = useState(30)

  const presets = useMemo(() => getPresets(lang), [lang])
  const windowOptions = useMemo(() => getWindowOptions(), [])
  const alertRules = useMemo(() => getAlertRules(), [])

  const result = useMemo(() => {
    return calculateErrorBudget({
      slo: slo / 100,
      errorRate: errorRate / 100,
      totalRequests: totalRequests || null,
      windowDays,
    })
  }, [slo, errorRate, totalRequests, windowDays])

  const handlePreset = (preset) => {
    setSlo(preset.slo * 100)
    setErrorRate(preset.errorRate * 100)
    setTotalRequests(preset.totalRequests)
    setWindowDays(preset.windowDays)
  }

  const clearAll = () => {
    setSlo(99.9)
    setErrorRate(0.5)
    setTotalRequests('')
    setWindowDays(30)
  }

  const alertColumns = [
    {
      title: t.severity,
      dataIndex: 'severity',
      render: (value) => (
        <Tag color={severityColor[value]}>
          {alertRules.find((r) => r.severity === value)?.label[lang]}
        </Tag>
      ),
    },
    {
      title: t.threshold,
      dataIndex: 'burnRate',
      render: (value) => `≥ ${formatNumber(value)}×`,
    },
    {
      title: t.action,
      dataIndex: 'description',
      render: (_, record) => record.description[lang],
    },
  ]

  const progressColor =
    result.burnRate >= 14.4 ? '#ff4d4f' : result.burnRate >= 2 ? '#faad14' : '#52c41a'

  return (
    <div style={{ padding: 24, maxWidth: 960, margin: '0 auto' }}>
      <Title level={2}>
        <FireOutlined style={{ marginRight: 12 }} />
        {t.title}
      </Title>
      <Paragraph type="secondary" style={{ marginTop: -8, marginBottom: 24 }}>
        {t.subtitle}
      </Paragraph>
      <Paragraph>{t.intro}</Paragraph>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card>
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <div>
                <Text strong>{t.slo}</Text>
                <Text type="secondary" style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>
                  {t.sloHelp}
                </Text>
                <Row gutter={16} align="middle">
                  <Col flex="auto">
                    <Slider
                      min={90}
                      max={99.9999}
                      step={0.0001}
                      value={slo}
                      onChange={(v) => setSlo(v)}
                      tooltip={{ formatter: (v) => `${formatNumber(v, 4)}%` }}
                    />
                  </Col>
                  <Col style={{ width: 120 }}>
                    <InputNumber
                      style={{ width: '100%' }}
                      min={0.0001}
                      max={99.9999}
                      step={0.0001}
                      value={slo}
                      onChange={(v) => setSlo(v ?? 0)}
                      formatter={(v) => `${v}%`}
                      parser={(v) => parseFloat((v || '').replace('%', ''))}
                    />
                  </Col>
                </Row>
              </div>

              <div>
                <Text strong>{t.errorRate}</Text>
                <Text type="secondary" style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>
                  {t.errorRateHelp}
                </Text>
                <Row gutter={16} align="middle">
                  <Col flex="auto">
                    <Slider
                      min={0}
                      max={10}
                      step={0.001}
                      value={errorRate}
                      onChange={(v) => setErrorRate(v)}
                      tooltip={{ formatter: (v) => `${formatNumber(v, 3)}%` }}
                    />
                  </Col>
                  <Col style={{ width: 120 }}>
                    <InputNumber
                      style={{ width: '100%' }}
                      min={0}
                      max={100}
                      step={0.001}
                      value={errorRate}
                      onChange={(v) => setErrorRate(v ?? 0)}
                      formatter={(v) => `${v}%`}
                      parser={(v) => parseFloat((v || '').replace('%', ''))}
                    />
                  </Col>
                </Row>
              </div>

              <div>
                <Text strong>{t.totalRequests}</Text>
                <Text type="secondary" style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>
                  {t.totalRequestsHelp}
                </Text>
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  step={1000}
                  value={totalRequests}
                  onChange={(v) => setTotalRequests(v === null ? '' : v)}
                />
              </div>

              <div>
                <Text strong>{t.window}</Text>
                <Select
                  style={{ width: '100%', marginTop: 8 }}
                  value={windowDays}
                  onChange={(v) => setWindowDays(v)}
                  options={windowOptions.map((w) => ({ value: w.value, label: w.label[lang] }))}
                />
              </div>

              <Space>
                <Button icon={<SyncOutlined />} onClick={clearAll}>
                  {t.clear}
                </Button>
              </Space>
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card style={{ height: '100%' }}>
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <div>
                <Text strong style={{ fontSize: 18, display: 'block', marginBottom: 12 }}>
                  {t.results}
                </Text>
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Statistic
                      title={t.errorBudget}
                      value={`${formatNumber(result.errorBudget * 100, 4)}%`}
                      valueStyle={{ color: '#1677ff' }}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title={t.burnRate}
                      value={`${formatNumber(result.burnRate, 2)}×`}
                      valueStyle={{
                        color:
                          result.burnRate >= 14.4
                            ? '#ff4d4f'
                            : result.burnRate >= 2
                            ? '#faad14'
                            : '#52c41a',
                      }}
                      prefix={<DashboardOutlined />}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title={t.timeToExhaust}
                      value={formatDuration(result.timeToExhaustHours)}
                      valueStyle={{ color: result.burnRate > 1 ? '#ff4d4f' : '#52c41a' }}
                      prefix={<WarningOutlined />}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title={t.recommendedAlert}
                      value={
                        result.recommendedAlert
                          ? alertRules.find((r) => r.severity === result.recommendedAlert.severity)
                              ?.label[lang]
                          : t.noRisk
                      }
                      valueStyle={{
                        color: result.recommendedAlert
                          ? severityColor[result.recommendedAlert.severity]
                          : '#52c41a',
                      }}
                    />
                  </Col>
                </Row>
              </div>

              {result.absolute && (
                <div>
                  <Text strong>{t.budgetConsumed}</Text>
                  <Progress
                    percent={Number(formatNumber(result.absolute.budgetConsumedRatio * 100, 2))}
                    strokeColor={progressColor}
                    status={result.absolute.budgetConsumedRatio >= 1 ? 'exception' : 'active'}
                    format={(percent) => `${percent}%`}
                  />

                  <Row gutter={[8, 8]} style={{ marginTop: 12 }}>
                    <Col span={12}>
                      <Card size="small">
                        <Statistic
                          title={t.totalReq}
                          value={formatNumber(result.absolute.totalRequests, 0)}
                        />
                      </Card>
                    </Col>
                    <Col span={12}>
                      <Card size="small">
                        <Statistic
                          title={t.budgetReq}
                          value={formatNumber(result.absolute.errorBudgetAbsolute, 0)}
                        />
                      </Card>
                    </Col>
                    <Col span={12}>
                      <Card size="small">
                        <Statistic
                          title={t.errorsReq}
                          value={formatNumber(result.absolute.errorsAbsolute, 0)}
                          valueStyle={{
                            color:
                              result.absolute.errorsAbsolute > result.absolute.errorBudgetAbsolute
                                ? '#ff4d4f'
                                : '#faad14',
                          }}
                        />
                      </Card>
                    </Col>
                    <Col span={12}>
                      <Card size="small">
                        <Statistic
                          title={t.remainingReq}
                          value={formatNumber(result.absolute.budgetRemainingAbsolute, 0)}
                          valueStyle={{
                            color: result.absolute.budgetRemainingAbsolute < 0 ? '#ff4d4f' : '#52c41a',
                          }}
                        />
                      </Card>
                    </Col>
                  </Row>
                </div>
              )}
            </Space>
          </Card>
        </Col>
      </Row>

      <Card style={{ marginTop: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Text strong>{t.presets}</Text>
          <Space wrap>
            {presets.map((preset) => (
              <Tooltip key={preset.key} title={preset.desc[lang]}>
                <Button size="small" onClick={() => handlePreset(preset)}>
                  {preset.label}
                </Button>
              </Tooltip>
            ))}
          </Space>
        </Space>
      </Card>

      <Card style={{ marginTop: 16 }} title={t.alertRules}>
        <Table
          dataSource={alertRules}
          columns={alertColumns}
          pagination={false}
          size="small"
          rowKey="severity"
          rowClassName={(record) =>
            result.recommendedAlert && record.severity === result.recommendedAlert.severity
              ? 'burn-rate-highlight-row'
              : ''
          }
        />
      </Card>

      <Alert
        type="info"
        showIcon
        icon={<InfoCircleOutlined />}
        message={t.note}
        style={{ marginTop: 16 }}
      />

      <Collapse style={{ marginTop: 24 }}>
        <Panel header={t.sourceTitle} key="source">
          <Paragraph>{t.sourceIntro}</Paragraph>
          <pre style={{ background: '#f6ffed', padding: 16, borderRadius: 8, overflow: 'auto' }}>
            <code>{sourceCode}</code>
          </pre>
        </Panel>
      </Collapse>

      <style>{`
        .burn-rate-highlight-row {
          background: #fff7e6 !important;
        }
      `}</style>
    </div>
  )
}
