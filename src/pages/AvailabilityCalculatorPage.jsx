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
  Tabs,
} from 'antd'
import {
  CheckCircleOutlined,
  HistoryOutlined,
  InfoCircleOutlined,
  DashboardOutlined,
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
      </Tabs>

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
