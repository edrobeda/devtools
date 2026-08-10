import React, { useCallback, useMemo, useState } from 'react'
import { Typography, Card, Space, InputNumber, Select, Segmented, Alert, List, Button, Tag, Descriptions, Collapse, Progress, message, Divider } from 'antd'
import { PlusOutlined, DeleteOutlined, ExperimentOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const DAY_MS = 86400000
const UNIT_MS = { s: 1000, min: 60000, h: 3600000, d: DAY_MS }

const TARGET_PRESETS = [99, 99.9, 99.95, 99.99, 99.999, 99.9999]

const PERIODS = [
  { key: 'day', days: 1 },
  { key: 'week', days: 7 },
  { key: 'month', days: 30 },
  { key: 'year', days: 365 },
  { key: 'custom', days: null },
]

function formatBreakdown(ms) {
  const parts = []
  const d = Math.floor(ms / DAY_MS)
  ms -= d * DAY_MS
  const h = Math.floor(ms / 3600000)
  ms -= h * 3600000
  const m = Math.floor(ms / 60000)
  ms -= m * 60000
  const s = ms / 1000
  if (d) parts.push(`${d} d`)
  if (h) parts.push(`${h} h`)
  if (m) parts.push(`${m} min`)
  if (s) parts.push(`${s.toFixed(0)} s`)
  if (!parts.length) parts.push('0 s')
  return parts.join(' ')
}

function smartDuration(ms) {
  if (!Number.isFinite(ms)) return '—'
  if (ms < 0) return `-${smartDuration(-ms)}`
  if (ms < 1000) return `${Math.round(ms)} ms`
  const s = ms / 1000
  if (s < 60) return s < 10 ? `${s.toFixed(1)} s` : `${Math.round(s)} s`
  const min = s / 60
  if (min < 60) return `${min.toFixed(1)} min`
  const h = min / 60
  if (h < 24) return `${h.toFixed(2)} h`
  const d = h / 24
  return `${d.toFixed(2)} d`
}

function pctLabel(pct) {
  return pct >= 100 ? '100%' : `${String(pct).replace(/0+$/, pct % 1 === 0 ? '.0' : '')}%`
}

const translations = {
  pt: {
    title: 'Calculadora de SLA (orçamento de downtime)',
    intro: (
      <>
        Calcula o <Text strong>orçamento de downtime</Text> que um contrato de
        disponibilidade permite — quanto tempo de indisponibilidade 'cabe'
        num período antes de quebrar o SLA — e confere se um conjunto de
        incidentes reais estourou o orçamento. Só matemática, 100% no navegador.
      </>
    ),
    targetLabel: 'Disponibilidade alvo (SLA)',
    targetPreset: 'Presets comuns',
    periodLabel: 'Período avaliado',
    periodDay: '1 dia',
    periodWeek: '7 dias',
    periodMonth: '30 dias',
    periodYear: '1 ano',
    periodCustom: 'Período customizado',
    customDays: 'Dias',
    budgetTitle: 'Orçamento de downtime',
    budgetRows: {
      allowed: 'Downtime permitido no período',
      share: 'Fatia do período',
      breakdown: 'Quebra',
    },
    incidentsTitle: 'Conferir incidentes reais',
    incidentsIntro: 'Registre as durações dos incidentes do período pra ver quanto do SLA foi consumido.',
    incident: 'Incidente',
    addIncident: 'Adicionar incidente',
    unit: 'Unidade',
    totalIncident: 'Downtime total registrado',
    actualSha: 'Disponibilidade efetiva',
    statusTitle: 'Status vs. orçamento',
    within: 'Dentro do orçamento',
    withinDesc: 'Sobrou',
    over: 'Orçamento estourado',
    overDesc: 'Estourou em',
    consumedTitle: 'Orçamento consumido',
    alertTitle: 'Os "9s" e o orçamento',
    alertBody: (
      <>
        O nome vem da notação:<Text code>99.9%</Text> = "três 9s",{' '}
        <Text code>99.99%</Text> = "quatro 9s" e assim por diante. O orçamento é{' '}
        <Text code>período × (1 − alvo)</Text>: a cada 9 adicionado o downtime
        permitido cai ~10× — 99.9% são ~43 min/mês, 99.99% são ~4 min/mês,
        99.999% são ~26 s/mês. Ter o alvo em mente muda como você
        prioriza o on-call.
      </>
    ),
    sourceTitle: 'Algoritmo-fonte',
    copy: 'Copiar resultado',
    copied: 'Copiado',
    copyErr: 'Falha ao copiar',
    resultText: (target, periodDays, budgetMs) =>
      `SLA ${pctLabel(target)} em ${periodDays} dia(s): orçamento de downtime = ${formatBreakdown(budgetMs)} (${smartDuration(budgetMs)}).`,
  },
  en: {
    title: 'SLA Calculator (downtime budget)',
    intro: (
      <>
        Computes the <Text strong>downtime budget</Text> an availability
        target allows — how much downtime fits in a period before the SLA is
        breached — and checks whether a set of real incidents blew the budget.
        Pure math, 100% in the browser.
      </>
    ),
    targetLabel: 'Target availability (SLA)',
    targetPreset: 'Common presets',
    periodLabel: 'Evaluation period',
    periodDay: '1 day',
    periodWeek: '7 days',
    periodMonth: '30 days',
    periodYear: '1 year',
    periodCustom: 'Custom period',
    customDays: 'Days',
    budgetTitle: 'Downtime budget',
    budgetRows: {
      allowed: 'Allowed downtime in period',
      share: 'Share of the period',
      breakdown: 'Breakdown',
    },
    incidentsTitle: 'Check real incidents',
    incidentsIntro: 'Log the incident durations in the period to see how much of the SLA has been consumed.',
    incident: 'Incident',
    addIncident: 'Add incident',
    unit: 'Unit',
    totalIncident: 'Total logged downtime',
    actualSha: 'Effective availability',
    statusTitle: 'Status vs. budget',
    within: 'Within budget',
    withinDesc: 'Left over',
    over: 'Budget exceeded',
    overDesc: 'Exceeded by',
    consumedTitle: 'Budget consumed',
    alertTitle: 'The "nines" and the budget',
    alertBody: (
      <>
        The name comes from the notation:<Text code>99.9%</Text> = "three
        nines", <Text code>99.99%</Text> = "four nines", and so on. The budget
        is <Text code>period × (1 − target)</Text>: each added nine shrinks the
        allowed downtime ~10× — 99.9% is ~43 min/month, 99.99% is ~4 min/day,
        99.999% is ~26 s/month. Keeping the target in mind changes how you
        prioritize on-call.
      </>
    ),
    sourceTitle: 'Source algorithm',
    copy: 'Copy result',
    copied: 'Copied',
    copyErr: 'Copy failed',
    resultText: (target, periodDays, budgetMs) =>
      `SLA ${pctLabel(target)} over ${periodDays} day(s): downtime budget = ${formatBreakdown(budgetMs)} (${smartDuration(budgetMs)}).`,
  },
}

export default function SlaCalculatorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [messageApi, messageContextHolder] = message.useMessage()

  const [target, setTarget] = useState(99.9)
  const [periodKey, setPeriodKey] = useState('month')
  const [customDays, setCustomDays] = useState(30)
  const [incidents, setIncidents] = useState([{ id: 1, value: 30, unit: 'min' }])

  const periodDays = useMemo(() => {
    const p = PERIODS.find((x) => x.key === periodKey)
    if (p && p.days) return p.days
    return customDays || 0
  }, [periodKey, customDays])

  const periodMs = periodDays * DAY_MS

  const budgetMs = useMemo(() => {
    if (periodMs <= 0) return 0
    return periodMs * (1 - target / 100)
  }, [periodMs, target])

  const totalIncidentMs = useMemo(
    () =>
      incidents.reduce((sum, inc) => sum + (Number(inc.value) || 0) * UNIT_MS[inc.unit], 0),
    [incidents]
  )

  const actualAvailability = useMemo(() => {
    if (periodMs <= 0) return 0
    return 100 * (1 - totalIncidentMs / periodMs)
  }, [periodMs, totalIncidentMs])

  const remainingMs = budgetMs - totalIncidentMs
  const consumedPct = useMemo(() => {
    if (periodMs <= 0) return 0
    return Math.min(100, Math.max(0, (totalIncidentMs / budgetMs) * 100))
  }, [totalIncidentMs, budgetMs])

  const setIncident = useCallback((id, patch) => {
    setIncidents((list) => list.map((inc) => (inc.id === id ? { ...inc, ...patch } : inc)))
  }, [])

  const removeIncident = useCallback((id) => {
    setIncidents((list) => list.filter((inc) => inc.id !== id))
  }, [])

  const addIncident = useCallback(() => {
    const nextId = incidents.reduce((m, inc) => Math.max(m, inc.id), 0) + 1
    setIncidents((list) => [...list, { id: nextId, value: 1, unit: 'h' }])
  }, [incidents])

  const copyResult = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(t.resultText(target, periodDays, budgetMs))
      messageApi.success(t.copied)
    } catch {
      messageApi.error(t.copyErr)
    }
  }, [t, target, periodDays, budgetMs, messageApi])

  const source = useMemo(() => `function budgetMs(periodMs, targetPct) {
  // orçamento = período × (1 − alvo)
  return periodMs * (1 - targetPct / 100)
}

function effectiveAvailability(periodMs, downtimeMs) {
  if (periodMs <= 0) return 0
  return 100 * (1 - downtimeMs / periodMs)
}

function formatBreakdown(ms) {
  const d = Math.floor(ms / ${DAY_MS}); ms -= d * ${DAY_MS}
  const h = Math.floor(ms / 3600000); ms -= h * 3600000
  const m = Math.floor(ms / 60000); ms -= m * 60000
  const s = ms / 1000
  return [d && \`\${d} d\`, h && \`\${h} h\`, m && \`\${m} min\`, s && \`\${s.toFixed(0)} s\`].filter(Boolean).join(' ') || '0 s'
}`, [])

  const budgetStatus =
    remainingMs >= 0
      ? { key: 'within', tag: 'green', desc: t.withinDesc, val: smartDuration(remainingMs) }
      : { key: 'over', tag: 'red', desc: t.overDesc, val: smartDuration(-remainingMs) }

  const periodOptions = PERIODS.map((p) => ({
    value: p.key,
    label: t[`period${p.key[0].toUpperCase()}${p.key.slice(1)}`],
  }))

  const budgetDescriptions = (
    <Descriptions bordered size="small" column={1}>
      <Descriptions.Item label={t.budgetRows.allowed}>
        <Text strong style={{ fontSize: 15 }}>{smartDuration(budgetMs)}</Text>
      </Descriptions.Item>
      <Descriptions.Item label={t.budgetRows.breakdown}>
        <Text code>{formatBreakdown(budgetMs)}</Text>
      </Descriptions.Item>
      <Descriptions.Item label={t.budgetRows.share}>
        {periodMs > 0 ? `${((budgetMs / periodMs) * 100).toFixed(4)}%` : '—'}
      </Descriptions.Item>
    </Descriptions>
  )

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {messageContextHolder}
      <Title level={2}><ExperimentOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Alert type="info" showIcon message={t.alertTitle} description={t.alertBody} />

      <Card title={t.targetLabel}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Space wrap size="small">
            {TARGET_PRESETS.map((p) => {
              const active = target === p
              return (
                <Tag
                  key={p}
                  color={active ? 'blue' : 'default'}
                  style={{ cursor: 'pointer', fontSize: 13, padding: '2px 10px' }}
                  onClick={() => setTarget(p)}
                >
                  {pctLabel(p)}
                </Tag>
              )
            })}
          </Space>
          <Space wrap align="center">
            <Text strong style={{ marginRight: 4 }}>{t.targetLabel}:</Text>
            <InputNumber
              min={0}
              max={100}
              step={0.001}
              precision={4}
              value={target}
              onChange={setTarget}
              addonAfter="%"
              style={{ width: 150 }}
            />
          </Space>
        </Space>
      </Card>

      <Card title={t.periodLabel}>
        <Space wrap align="center" size="large">
          <Segmented options={periodOptions} value={periodKey} onChange={setPeriodKey} />
          {periodKey === 'custom' && (
            <Space align="center">
              <Text>{t.customDays}</Text>
              <InputNumber
                min={1}
                value={customDays}
                onChange={setCustomDays}
                style={{ width: 100 }}
              />
            </Space>
          )}
        </Space>
      </Card>

      <Card
        title={t.budgetTitle}
        extra={
          <Button size="small" icon={<CopyOutlined />} onClick={copyResult}>
            {t.copy}
          </Button>
        }
      >
        {budgetDescriptions}
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
                  options={Object.keys(UNIT_MS).map((u) => ({ value: u, label: u }))}
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
          percent={consumedPct}
          status={remainingMs >= 0 ? 'active' : 'exception'}
          format={() => smartDuration(totalIncidentMs)}
        />
        <Descriptions bordered size="small" column={2} style={{ marginTop: 12 }}>
          <Descriptions.Item label={t.totalIncident}>
            <Text strong>{smartDuration(totalIncidentMs)}</Text>
          </Descriptions.Item>
          <Descriptions.Item label={t.actualSha}>
            {actualAvailability >= 0 ? `${actualAvailability.toFixed(4)}%` : '0%'}
          </Descriptions.Item>
          <Descriptions.Item label={t.statusTitle} span={2}>
            <Tag color={budgetStatus.tag}>{t[budgetStatus.key]}</Tag>{' '}
            {budgetStatus.desc}: <Text code>{budgetStatus.val}</Text>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Collapse
        items={[
          {
            key: 'src',
            label: t.sourceTitle,
            children: <pre style={{ margin: 0, fontSize: 12.5, lineHeight: 1.6, background: '#f5f5f5', padding: 12, borderRadius: 6, overflowX: 'auto' }}>{source}</pre>,
          },
        ]}
      />
    </Space>
  )
}