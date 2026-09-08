import React, { useCallback, useMemo, useState } from 'react'
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
  Tabs,
  Segmented,
  List,
  Descriptions,
  Progress,
  Divider,
  message,
} from 'antd'
import {
  CheckCircleOutlined,
  HistoryOutlined,
  InfoCircleOutlined,
  DashboardOutlined,
  PlusOutlined,
  DeleteOutlined,
  CopyOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  uptimeFromDowntime,
  downtimeSecondsFromUptime,
  downtimeBudget,
  countNines,
  availabilityFromMtbfMttr,
  mttrForAvailability,
  mtbfForAvailability,
  formatDuration,
  formatPercent,
  getNinesTable,
  getPresets,
  toSeconds,
} from '../utils/availabilityCalculator'

const { Title, Paragraph, Text } = Typography
const { Panel } = Collapse
const { TabPane } = Tabs

const sourceCode = `import {
  uptimeFromDowntime,
  downtimeBudget,
  countNines,
  availabilityFromMtbfMttr,
  formatDuration,
} from '../utils/availabilityCalculator'

// Uptime a partir de 1 ano com 8h de downtime
uptimeFromDowntime(365.25 * 24 * 3600, 8 * 3600)
// 99.9086...

// Janela de downtime para 99.99% de uptime
downtimeBudget(99.99)
// { year: ~52min, month: ~4min, week: ~1min, day: ~8.6s }

countNines(99.999)
// 4

// Disponibilidade a partir de MTBF e MTTR
availabilityFromMtbfMttr(720, 0.5) // 720h MTBF, 0.5h MTTR
// 99.9306...

formatDuration(3661)
// '1h 1min 1s'
`

const translations = {
  pt: {
    title: 'Calculadora de Disponibilidade',
    subtitle: 'Uptime, SLA, Nines e MTBF/MTTR',
    intro: 'Calcule a disponibilidade de um sistema a partir do tempo de atividade ou das métricas MTBF/MTTR. Veja o downtime budget para diferentes janelas de tempo e compare com os níveis clássicos de "nines".',
    uptimeTab: 'Por uptime',
    mtbfTab: 'Por MTBF/MTTR',
    uptime: 'Uptime',
    downtime: 'Downtime',
    uptimePercent: 'Uptime (%)',
    downtimeDuration: 'Downtime informado',
    totalDuration: 'Período total',
    unit: 'Unidade',
    nines: 'Nines',
    downtimeBudget: 'Downtime budget',
    perYear: 'Por ano',
    perMonth: 'Por mês',
    perWeek: 'Por semana',
    perDay: 'Por dia',
    presets: 'Exemplos de um clique',
    mtbf: 'MTBF (Mean Time Between Failures)',
    mttr: 'MTTR (Mean Time To Recover)',
    availability: 'Disponibilidade',
    targetAvailability: 'Disponibilidade-alvo (%)',
    requiredMttr: 'MTTR necessário',
    requiredMtbf: 'MTBF necessário',
    ninesTable: 'Tabela de Nines',
    sourceTitle: 'Motor de cálculo',
    sourceIntro: 'O motor é puro JavaScript client-side — nenhum dado sai do navegador.',
    note: 'Os valores de downtime budget usam um ano de 365,25 dias como referência. O cálculo MTBF/MTTR assume que todas as unidades são as mesmas (horas, minutos etc.).',
    invalid: 'Valor inválido',
    incidentsTab: 'Checar incidentes',
    incidentsTitle: 'Conferir incidentes reais',
    incidentsIntro: 'Registre as durações dos incidentes do período pra ver quanto do SLA foi consumido.',
    incident: 'Incidente',
    addIncident: 'Adicionar incidente',
    totalIncident: 'Downtime total registrado',
    effectiveAvail: 'Disponibilidade efetiva',
    budgetStatus: 'Status vs. orçamento',
    withinBudget: 'Dentro do orçamento',
    withinBudgetDesc: 'Sobrou',
    overBudget: 'Orçamento estourado',
    overBudgetDesc: 'Estourou em',
    periodLabel: 'Período avaliado',
    periodDay: '1 dia',
    periodWeek: '7 dias',
    periodMonth: '30 dias',
    periodYear: '1 ano',
    periodCustom: 'Período customizado',
    customDays: 'Dias',
    copy: 'Copiar resultado',
    copied: 'Copiado',
    copyErr: 'Falha ao copiar',
    ninesInfo: (target, periodDays, budgetSeconds) =>
      `SLA ${target}% em ${periodDays} dia(s): orçamento de downtime = ${formatDuration(budgetSeconds)}.`,
  },
  en: {
    title: 'Availability Calculator',
    subtitle: 'Uptime, SLA, Nines and MTBF/MTTR',
    intro: 'Calculate system availability from uptime duration or MTBF/MTTR metrics. See downtime budget across different time windows and compare against classic "nines" levels.',
    uptimeTab: 'By uptime',
    mtbfTab: 'By MTBF/MTTR',
    uptime: 'Uptime',
    downtime: 'Downtime',
    uptimePercent: 'Uptime (%)',
    downtimeDuration: 'Entered downtime',
    totalDuration: 'Total period',
    unit: 'Unit',
    nines: 'Nines',
    downtimeBudget: 'Downtime budget',
    perYear: 'Per year',
    perMonth: 'Per month',
    perWeek: 'Per week',
    perDay: 'Per day',
    presets: 'One-click examples',
    mtbf: 'MTBF (Mean Time Between Failures)',
    mttr: 'MTTR (Mean Time To Recover)',
    availability: 'Availability',
    targetAvailability: 'Target availability (%)',
    requiredMttr: 'Required MTTR',
    requiredMtbf: 'Required MTBF',
    ninesTable: 'Nines Table',
    sourceTitle: 'Calculation engine',
    sourceIntro: 'The engine is pure client-side JavaScript — no data leaves the browser.',
    note: 'Downtime budget values use a 365.25-day year as reference. The MTBF/MTTR calculation assumes all values share the same unit (hours, minutes, etc.).',
    invalid: 'Invalid value',
    incidentsTab: 'Incident checker',
    incidentsTitle: 'Check real incidents',
    incidentsIntro: 'Log the incident durations in the period to see how much of the SLA has been consumed.',
    incident: 'Incident',
    addIncident: 'Add incident',
    totalIncident: 'Total logged downtime',
    effectiveAvail: 'Effective availability',
    budgetStatus: 'Status vs. budget',
    withinBudget: 'Within budget',
    withinBudgetDesc: 'Left over',
    overBudget: 'Budget exceeded',
    overBudgetDesc: 'Exceeded by',
    periodLabel: 'Evaluation period',
    periodDay: '1 day',
    periodWeek: '7 days',
    periodMonth: '30 days',
    periodYear: '1 year',
    periodCustom: 'Custom period',
    customDays: 'Days',
    copy: 'Copy result',
    copied: 'Copied',
    copyErr: 'Copy failed',
    ninesInfo: (target, periodDays, budgetSeconds) =>
      `SLA ${target}% over ${periodDays} day(s): downtime budget = ${formatDuration(budgetSeconds)}.`,
  },
}

const units = [
  { value: 'seconds', label: { pt: 'Segundos', en: 'Seconds' } },
  { value: 'minutes', label: { pt: 'Minutos', en: 'Minutes' } },
  { value: 'hours', label: { pt: 'Horas', en: 'Hours' } },
  { value: 'days', label: { pt: 'Dias', en: 'Days' } },
  { value: 'weeks', label: { pt: 'Semanas', en: 'Weeks' } },
  { value: 'months', label: { pt: 'Meses', en: 'Months' } },
  { value: 'years', label: { pt: 'Anos', en: 'Years' } },
]

export default function AvailabilityCalculatorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [uptimePercent, setUptimePercent] = useState(99.9)
  const [downtimeValue, setDowntimeValue] = useState(8)
  const [downtimeUnit, setDowntimeUnit] = useState('hours')
  const [totalPeriodValue, setTotalPeriodValue] = useState(1)
  const [totalPeriodUnit, setTotalPeriodUnit] = useState('years')

  const [mtbf, setMtbf] = useState(720)
  const [mttr, setMttr] = useState(0.5)
  const [targetAvailability, setTargetAvailability] = useState(99.99)

  const presets = useMemo(() => getPresets(lang), [lang])

  const derivedFromUptime = useMemo(() => {
    const budget = downtimeBudget(uptimePercent)
    return {
      uptimePercent,
      downtimeYear: budget.year,
      downtimeMonth: budget.month,
      downtimeWeek: budget.week,
      downtimeDay: budget.day,
      nines: countNines(uptimePercent),
    }
  }, [uptimePercent])

  const derivedFromDowntime = useMemo(() => {
    const totalSeconds = toSeconds(totalPeriodValue, totalPeriodUnit)
    const downtimeSeconds = toSeconds(downtimeValue, downtimeUnit)
    const uptime = uptimeFromDowntime(totalSeconds, downtimeSeconds)
    const budget = downtimeBudget(uptime)
    return {
      uptime,
      nines: countNines(uptime),
      downtimeYear: budget.year,
      downtimeMonth: budget.month,
      downtimeWeek: budget.week,
      downtimeDay: budget.day,
      valid: totalSeconds > 0 && downtimeSeconds >= 0,
    }
  }, [downtimeValue, downtimeUnit, totalPeriodValue, totalPeriodUnit])

  const derivedFromMtbf = useMemo(() => {
    const availability = availabilityFromMtbfMttr(mtbf, mttr)
    const budget = downtimeBudget(availability)
    return {
      availability,
      nines: countNines(availability),
      downtimeYear: budget.year,
      downtimeMonth: budget.month,
      downtimeWeek: budget.week,
      downtimeDay: budget.day,
      valid: mtbf > 0 && mttr >= 0,
    }
  }, [mtbf, mttr])

  const targetCalculations = useMemo(() => {
    const reqMttr = mttrForAvailability(mtbf, targetAvailability)
    const reqMtbf = mtbfForAvailability(mttr, targetAvailability)
    return { reqMttr, reqMtbf }
  }, [mtbf, mttr, targetAvailability])

  const ninesColumns = [
    { title: 'Nines', dataIndex: 'nines', align: 'center' },
    { title: t.uptimePercent, dataIndex: 'uptime', align: 'center' },
    {
      title: t.downtimeBudget,
      dataIndex: 'uptime',
      align: 'center',
      render: (uptime) => formatDuration(downtimeSecondsFromUptime(uptime)),
    },
  ]

  const ninesData = useMemo(() => getNinesTable(), [])

  const renderBudget = (seconds) => (
    <div>
      <Text strong>{formatDuration(seconds)}</Text>
      <br />
      <Text type="secondary" style={{ fontSize: 12 }}>
        {formatPercent(seconds)}s
      </Text>
    </div>
  )

  const [messageApi, messageContextHolder] = message.useMessage()
  const [incidentTarget, setIncidentTarget] = useState(99.9)
  const [incidentPeriodKey, setIncidentPeriodKey] = useState('month')
  const [incidentCustomDays, setIncidentCustomDays] = useState(30)
  const [incidents, setIncidents] = useState([{ id: 1, value: 30, unit: 'min' }])

  const INCIDENT_UNITS = { s: 1, min: 60, h: 3600, d: 86400 }
  const INCIDENT_PERIODS = { day: 1, week: 7, month: 30, year: 365 }

  const incidentPeriodDays = useMemo(() => {
    if (incidentPeriodKey === 'custom') return incidentCustomDays || 0
    return INCIDENT_PERIODS[incidentPeriodKey] || 0
  }, [incidentPeriodKey, incidentCustomDays])

  const incidentPeriodSeconds = incidentPeriodDays * 86400

  const incidentBudgetSeconds = useMemo(() => {
    if (incidentPeriodSeconds <= 0) return 0
    return incidentPeriodSeconds * (1 - incidentTarget / 100)
  }, [incidentPeriodSeconds, incidentTarget])

  const totalIncidentSeconds = useMemo(
    () =>
      incidents.reduce((sum, inc) => sum + (Number(inc.value) || 0) * (INCIDENT_UNITS[inc.unit] || 1), 0),
    [incidents]
  )

  const incidentActualAvailability = useMemo(() => {
    if (incidentPeriodSeconds <= 0) return 0
    return 100 * (1 - totalIncidentSeconds / incidentPeriodSeconds)
  }, [incidentPeriodSeconds, totalIncidentSeconds])

  const incidentRemainingSeconds = incidentBudgetSeconds - totalIncidentSeconds
  const incidentConsumedPct = useMemo(() => {
    if (incidentPeriodSeconds <= 0 || incidentBudgetSeconds <= 0) return 0
    return Math.min(100, Math.max(0, (totalIncidentSeconds / incidentBudgetSeconds) * 100))
  }, [incidentPeriodSeconds, incidentBudgetSeconds, totalIncidentSeconds])

  const setIncident = useCallback((id, patch) => {
    setIncidents((list) => list.map((inc) => (inc.id === id ? { ...inc, ...patch } : inc)))
  }, [])

  const removeIncident = useCallback((id) => {
    setIncidents((list) => list.filter((inc) => inc.id !== id))
  }, [])

  const addIncident = useCallback(() => {
    setIncidents((list) => {
      const nextId = list.reduce((m, inc) => Math.max(m, inc.id), 0) + 1
      return [...list, { id: nextId, value: 1, unit: 'h' }]
    })
  }, [])

  const copyIncidentResult = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(
        t.ninesInfo(incidentTarget, incidentPeriodDays, incidentBudgetSeconds)
      )
      messageApi.success(t.copied)
    } catch {
      messageApi.error(t.copyErr)
    }
  }, [t, incidentTarget, incidentPeriodDays, incidentBudgetSeconds, messageApi])

  const incidentBudgetStatus =
    incidentRemainingSeconds >= 0
      ? {
          key: 'withinBudget',
          tag: 'green',
          desc: t.withinBudgetDesc,
          val: formatDuration(incidentRemainingSeconds),
        }
      : {
          key: 'overBudget',
          tag: 'red',
          desc: t.overBudgetDesc,
          val: formatDuration(-incidentRemainingSeconds),
        }

  const incidentPeriodOptions = Object.keys(INCIDENT_PERIODS).map((k) => ({
    value: k,
    label: t[`period${k[0].toUpperCase()}${k.slice(1)}`],
  }))

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

      <Tabs defaultActiveKey="uptime">
        <TabPane tab={t.uptimeTab} key="uptime">
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Card>
                <Space direction="vertical" style={{ width: '100%' }} size="large">
                  <div>
                    <Text strong>{t.uptimePercent}</Text>
                    <Row gutter={16} align="middle">
                      <Col flex="auto">
                        <Slider
                          min={90}
                          max={99.9999}
                          step={0.0001}
                          value={uptimePercent}
                          onChange={(v) => setUptimePercent(v)}
                          tooltip={{ formatter: (v) => `${formatPercent(v)}%` }}
                        />
                      </Col>
                      <Col style={{ width: 120 }}>
                        <InputNumber
                          style={{ width: '100%' }}
                          min={0}
                          max={100}
                          step={0.0001}
                          value={uptimePercent}
                          onChange={(v) => setUptimePercent(v ?? 0)}
                          formatter={(v) => `${v}%`}
                          parser={(v) => parseFloat((v || '').replace('%', ''))}
                        />
                      </Col>
                    </Row>
                  </div>

                  <div>
                    <Text strong style={{ display: 'block', marginBottom: 8 }}>{t.presets}</Text>
                    <Space wrap>
                      {presets.map((preset) => (
                        <Button key={preset.key} size="small" onClick={() => setUptimePercent(preset.uptime)}>
                          {preset.label}
                        </Button>
                      ))}
                    </Space>
                  </div>
                </Space>
              </Card>
            </Col>

            <Col xs={24} md={12}>
              <Card style={{ height: '100%' }}>
                <Space direction="vertical" style={{ width: '100%' }} size="large">
                  <Statistic
                    title={t.uptime}
                    value={`${formatPercent(derivedFromUptime.uptimePercent)}%`}
                    valueStyle={{ fontSize: 40, color: '#52c41a' }}
                  />
                  <div>
                    <Text strong>{t.nines}: </Text>
                    <Tag color="blue">{derivedFromUptime.nines} nines</Tag>
                  </div>
                  <div>
                    <Text strong>{t.downtimeBudget}</Text>
                    <Row gutter={[8, 8]} style={{ marginTop: 8 }}>
                      <Col span={12}>{renderBudget(derivedFromUptime.downtimeYear)}</Col>
                      <Col span={12}>{renderBudget(derivedFromUptime.downtimeMonth)}</Col>
                      <Col span={12}>{renderBudget(derivedFromUptime.downtimeWeek)}</Col>
                      <Col span={12}>{renderBudget(derivedFromUptime.downtimeDay)}</Col>
                    </Row>
                  </div>
                </Space>
              </Card>
            </Col>
          </Row>

          <Card style={{ marginTop: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <Text strong>{t.downtimeDuration}</Text>
              <Row gutter={[16, 16]}>
                <Col xs={12} md={6}>
                  <Text type="secondary">{t.downtime}</Text>
                  <InputNumber
                    style={{ width: '100%' }}
                    min={0}
                    step={0.1}
                    value={downtimeValue}
                    onChange={(v) => setDowntimeValue(v ?? 0)}
                  />
                </Col>
                <Col xs={12} md={6}>
                  <Text type="secondary">{t.unit}</Text>
                  <Select
                    style={{ width: '100%' }}
                    value={downtimeUnit}
                    onChange={(v) => setDowntimeUnit(v)}
                    options={units.map((u) => ({ value: u.value, label: u.label[lang] }))}
                  />
                </Col>
                <Col xs={12} md={6}>
                  <Text type="secondary">{t.totalDuration}</Text>
                  <InputNumber
                    style={{ width: '100%' }}
                    min={0.0001}
                    step={0.1}
                    value={totalPeriodValue}
                    onChange={(v) => setTotalPeriodValue(v ?? 0)}
                  />
                </Col>
                <Col xs={12} md={6}>
                  <Text type="secondary">{t.unit}</Text>
                  <Select
                    style={{ width: '100%' }}
                    value={totalPeriodUnit}
                    onChange={(v) => setTotalPeriodUnit(v)}
                    options={units.map((u) => ({ value: u.value, label: u.label[lang] }))}
                  />
                </Col>
              </Row>

              {!derivedFromDowntime.valid ? (
                <Alert type="error" message={t.invalid} />
              ) : (
                <Row gutter={[16, 16]} align="middle">
                  <Col xs={24} md={8}>
                    <Statistic
                      title={t.uptime}
                      value={`${formatPercent(derivedFromDowntime.uptime)}%`}
                      valueStyle={{ color: '#52c41a' }}
                    />
                  </Col>
                  <Col xs={24} md={8}>
                    <Statistic title={t.nines} value={`${derivedFromDowntime.nines} nines`} />
                  </Col>
                  <Col xs={24} md={8}>
                    <Statistic
                      title={t.downtimeBudget}
                      value={formatDuration(derivedFromDowntime.downtimeYear)}
                      prefix={<HistoryOutlined />}
                    />
                  </Col>
                </Row>
              )}
            </Space>
          </Card>
        </TabPane>

        <TabPane tab={t.mtbfTab} key="mtbf">
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Card>
                <Space direction="vertical" style={{ width: '100%' }} size="large">
                  <div>
                    <Text strong>{t.mtbf}</Text>
                    <InputNumber
                      style={{ width: '100%' }}
                      min={0.0001}
                      step={1}
                      value={mtbf}
                      onChange={(v) => setMtbf(v ?? 0)}
                    />
                  </div>
                  <div>
                    <Text strong>{t.mttr}</Text>
                    <InputNumber
                      style={{ width: '100%' }}
                      min={0}
                      step={0.1}
                      value={mttr}
                      onChange={(v) => setMttr(v ?? 0)}
                    />
                  </div>
                </Space>
              </Card>
            </Col>

            <Col xs={24} md={12}>
              <Card style={{ height: '100%' }}>
                <Space direction="vertical" style={{ width: '100%' }} size="large">
                  <Statistic
                    title={t.availability}
                    value={`${formatPercent(derivedFromMtbf.availability)}%`}
                    valueStyle={{ fontSize: 40, color: '#52c41a' }}
                    prefix={<CheckCircleOutlined />}
                  />
                  <div>
                    <Text strong>{t.nines}: </Text>
                    <Tag color="blue">{derivedFromMtbf.nines} nines</Tag>
                  </div>
                  <div>
                    <Text strong>{t.downtimeBudget}</Text>
                    <Row gutter={[8, 8]} style={{ marginTop: 8 }}>
                      <Col span={12}>{renderBudget(derivedFromMtbf.downtimeYear)}</Col>
                      <Col span={12}>{renderBudget(derivedFromMtbf.downtimeMonth)}</Col>
                      <Col span={12}>{renderBudget(derivedFromMtbf.downtimeWeek)}</Col>
                      <Col span={12}>{renderBudget(derivedFromMtbf.downtimeDay)}</Col>
                    </Row>
                  </div>
                </Space>
              </Card>
            </Col>
          </Row>

          <Card style={{ marginTop: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <Text strong>{t.targetAvailability}</Text>
              <Row gutter={16} align="middle">
                <Col flex="auto">
                  <Slider
                    min={90}
                    max={99.9999}
                    step={0.0001}
                    value={targetAvailability}
                    onChange={(v) => setTargetAvailability(v)}
                    tooltip={{ formatter: (v) => `${formatPercent(v)}%` }}
                  />
                </Col>
                <Col style={{ width: 120 }}>
                  <InputNumber
                    style={{ width: '100%' }}
                    min={0}
                    max={100}
                    step={0.0001}
                    value={targetAvailability}
                    onChange={(v) => setTargetAvailability(v ?? 0)}
                    formatter={(v) => `${v}%`}
                    parser={(v) => parseFloat((v || '').replace('%', ''))}
                  />
                </Col>
              </Row>
              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <Card size="small">
                    <Statistic
                      title={t.requiredMttr}
                      value={formatPercent(targetCalculations.reqMttr)}
                      suffix={` (${formatDuration(targetCalculations.reqMttr * 3600)})`}
                    />
                  </Card>
                </Col>
                <Col xs={24} md={12}>
                  <Card size="small">
                    <Statistic
                      title={t.requiredMtbf}
                      value={formatPercent(targetCalculations.reqMtbf)}
                      suffix={` (${formatDuration(targetCalculations.reqMtbf * 3600)})`}
                    />
                  </Card>
                </Col>
              </Row>
            </Space>
          </Card>
        </TabPane>
        <TabPane tab={t.incidentsTab} key="incidents">
          <Alert type="info" showIcon message={t.incidentsTitle} description={t.incidentsIntro} style={{ marginBottom: 16 }} />
          <Card style={{ marginBottom: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <Space wrap align="center">
                <Text strong>{t.uptimePercent}:</Text>
                <InputNumber
                  min={0}
                  max={100}
                  step={0.001}
                  precision={4}
                  value={incidentTarget}
                  onChange={setIncidentTarget}
                  addonAfter="%"
                  style={{ width: 150 }}
                />
              </Space>
              <Space wrap align="center" size="large">
                <Segmented options={incidentPeriodOptions} value={incidentPeriodKey} onChange={setIncidentPeriodKey} />
                {incidentPeriodKey === 'custom' && (
                  <Space align="center">
                    <Text>{t.customDays}</Text>
                    <InputNumber
                      min={1}
                      value={incidentCustomDays}
                      onChange={setIncidentCustomDays}
                      style={{ width: 100 }}
                    />
                  </Space>
                )}
              </Space>
            </Space>
          </Card>

          <Card
            title={t.downtimeBudget}
            extra={
              <Button size="small" icon={<CopyOutlined />} onClick={copyIncidentResult}>
                {t.copy}
              </Button>
            }
            style={{ marginBottom: 16 }}
          >
            <Descriptions bordered size="small" column={1}>
              <Descriptions.Item label={t.uptimePercent}>
                {formatPercent(incidentTarget)}%
              </Descriptions.Item>
              <Descriptions.Item label={t.downtimeBudget}>
                <Text strong style={{ fontSize: 15 }}>{formatDuration(incidentBudgetSeconds)}</Text>
              </Descriptions.Item>
              <Descriptions.Item label={t.periodLabel}>
                {incidentPeriodDays} {incidentPeriodDays === 1 ? 'day' : 'days'}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title={t.incidentsTitle}>
            <Paragraph type="secondary">{t.incidentsIntro}</Paragraph>
            <List
              size="small"
              dataSource={incidents}
              locale={{ emptyText: ' ' }}
              renderItem={(inc) => (
                <List.Item
                  actions={[
                    <Button
                      key="del"
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      disabled={incidents.length === 1}
                      onClick={() => removeIncident(inc.id)}
                    />,
                  ]}
                >
                  <Space wrap>
                    <Text type="secondary" style={{ width: 90, display: 'inline-block' }}>
                      {t.incident} #{inc.id}
                    </Text>
                    <InputNumber
                      min={0}
                      value={inc.value}
                      onChange={(v) => setIncident(inc.id, { value: v })}
                      style={{ width: 110 }}
                    />
                    <Select
                      value={inc.unit}
                      onChange={(v) => setIncident(inc.id, { unit: v })}
                      style={{ width: 90 }}
                      options={Object.keys(INCIDENT_UNITS).map((u) => ({ value: u, label: u }))}
                    />
                  </Space>
                </List.Item>
              )}
            />
            <Button icon={<PlusOutlined />} style={{ marginTop: 12 }} onClick={addIncident}>
              {t.addIncident}
            </Button>

            <Divider />
            <Progress
              percent={incidentConsumedPct}
              status={incidentRemainingSeconds >= 0 ? 'active' : 'exception'}
              format={() => formatDuration(totalIncidentSeconds)}
            />
            <Descriptions bordered size="small" column={2} style={{ marginTop: 12 }}>
              <Descriptions.Item label={t.totalIncident}>
                <Text strong>{formatDuration(totalIncidentSeconds)}</Text>
              </Descriptions.Item>
              <Descriptions.Item label={t.effectiveAvail}>
                {incidentActualAvailability >= 0 ? `${formatPercent(incidentActualAvailability)}%` : '0%'}
              </Descriptions.Item>
              <Descriptions.Item label={t.budgetStatus} span={2}>
                <Tag color={incidentBudgetStatus.tag}>{t[incidentBudgetStatus.key]}</Tag>{' '}
                {incidentBudgetStatus.desc}: <Text code>{incidentBudgetStatus.val}</Text>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </TabPane>
      </Tabs>
      {messageContextHolder}

      <Card style={{ marginTop: 16 }} title={t.ninesTable}>
        <Table
          dataSource={ninesData}
          columns={ninesColumns}
          pagination={false}
          size="small"
          rowKey="nines"
          rowClassName={(record) => (record.uptime === 99.9 ? 'availability-highlight-row' : '')}
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
        .availability-highlight-row {
          background: #f6ffed !important;
        }
      `}</style>
    </div>
  )
}
