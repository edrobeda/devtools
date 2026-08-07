import React, { useMemo, useState } from 'react'
import { Typography, Card, Space, Tag, Row, Col, Segmented, Alert, List, Input, Button } from 'antd'
import { FieldTimeOutlined, CopyOutlined, CheckOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const FIELD_ORDER = ['minute', 'hour', 'dom', 'month', 'dow']

const FIELD_DEFS = {
  minute: { min: 0, max: 59 },
  hour: { min: 0, max: 23 },
  dom: { min: 1, max: 31 },
  month: { min: 1, max: 12 },
  dow: { min: 0, max: 6 },
}

const translations = {
  pt: {
    title: 'Construtor de Expressão Cron',
    intro: (
      <>
        Monte uma expressão cron de 5 campos (<Text code>minuto hora dia-do-mês mês dia-da-semana</Text>)
        a partir de controles visuais — por campo, escolha se ele roda em qualquer valor (
        <Text code>*</Text>) ou num conjunto específico — e veja a expressão gerada, a descrição e as
        próximas execuções. É o caminho inverso do explicador de cron, que já existe no devtools.
      </>
    ),
    fieldNames: {
      minute: 'Minuto', hour: 'Hora', dom: 'Dia do mês', month: 'Mês', dow: 'Dia da semana',
    },
    anyLabel: 'Qualquer',
    setLabel: 'Específicos',
    anyTip: 'Qualquer valor (*). Mude pra escolher valores específicos.',
    expressionTitle: 'Expressão gerada',
    nextRunsTitle: 'Próximas 5 execuções',
    noRunsFound: 'Nenhuma execução encontrada nos próximos 4 anos (a combinação de dia/mês pode ser impossível, ex.: 31 de fevereiro).',
    previewInvalid: 'Não foi possível interpretar a expressão.',
    copied: 'Copiado!',
    copy: 'Copiar',
    buildNote: 'A regra OR entre dia-do-mês e dia-da-semana vale quando ambos estão restritos — ex.: dia 1 OU segunda-feira.',
    weekdayNames: ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'],
    monthNames: ['', 'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'],
    locale: 'pt-BR',
    description: (m, h, d) => `${d} às ${h}:${m}`,
    howTitle: 'Como os campos viram cron',
    howBody: 'Cada campo vira um token: * quando está em "Qualquer", ou a lista dos valores escolhidos separados por vírgula (ex.: 9,17 para 9h e 17h). As próximas execuções são calculadas no navegador, caminhando minuto a minuto a partir de agora — se dia-do-mês e dia-da-semana estiverem restritos, vale a regra OR da spec cron (qualquer um dos dois que casar dispara).',
  },
  en: {
    title: 'Cron Expression Builder',
    intro: (
      <>
        Build a 5-field cron expression (<Text code>minute hour day-of-month month day-of-week</Text>)
        from visual controls — per field choose whether it runs at any value (<Text code>*</Text>) or a
        specific set — and see the generated expression, a description and the next runs. This is the
        inverse of the cron explainer already on the devtools.
      </>
    ),
    fieldNames: {
      minute: 'Minute', hour: 'Hour', dom: 'Day of month', month: 'Month', dow: 'Day of week',
    },
    anyLabel: 'Any',
    setLabel: 'Specific',
    anyTip: 'Any value (*). Switch to pick specific values.',
    expressionTitle: 'Generated expression',
    nextRunsTitle: 'Next 5 runs',
    noRunsFound: 'No runs found in the next 4 years (the day/month combination may be impossible, e.g. February 31).',
    previewInvalid: 'Could not interpret the expression.',
    copied: 'Copied!',
    copy: 'Copy',
    buildNote: 'Day-of-month and day-of-week are OR-ed when both are restricted — e.g. on the 1st OR Monday.',
    weekdayNames: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    monthNames: ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    locale: 'en-US',
    description: (m, h, d) => `${d} at ${h}:${m}`,
    howTitle: 'How fields become cron',
    howBody: 'Each field becomes a token: * when it is "Any", or the comma-separated list of chosen values (e.g. 9,17 for 9am and 5pm). The next runs are computed in the browser, walking minute by minute from now — if both day-of-month and day-of-week are restricted, the OR rule of the cron spec applies (either one matching fires).',
  },
}

function defaultFields() {
  return {
    minute: { any: true, values: [] },
    hour: { any: true, values: [] },
    dom: { any: true, values: [] },
    month: { any: true, values: [] },
    dow: { any: true, values: [] },
  }
}

function rangeValues(def) {
  const out = []
  for (let v = def.min; v <= def.max; v++) out.push(v)
  return out
}

function tokenFor(field) {
  if (field.any) return '*'
  const vals = field.values.slice().sort((a, b) => a - b)
  return vals.length ? vals.join(',') : '*'
}

function valueLabel(key, v, t) {
  if (key === 'dow') return `${v} ${t.weekdayNames[v]}`
  if (key === 'month') return t.monthNames[v]
  return String(v)
}

// ─── Preview: interpreta a expressão e acha as próximas execuções ────────
function parseField(token, def) {
  const values = new Set()
  for (const part of token.split(',')) {
    let start = def.min
    let end = def.max
    let step = 1
    const sl = part.split('/')
    if (sl[1] !== undefined) step = Number(sl[1]) || 1
    if (sl[0] !== '*' && sl[0].includes('-')) {
      const [a, b] = sl[0].split('-')
      start = Number(a)
      end = Number(b)
    } else if (sl[0] !== '*') {
      start = end = Number(sl[0])
    }
    if (step <= 0) step = 1
    for (let v = start; v <= end; v += step) values.add(v)
  }
  return values
}

function matches(date, sets, domRes, dowRes) {
  if (!sets.minute.has(date.getMinutes())) return false
  if (!sets.hour.has(date.getHours())) return false
  if (!sets.month.has(date.getMonth() + 1)) return false
  const domOk = sets.dom.has(date.getDate())
  const dowOk = sets.dow.has(date.getDay())
  if (domRes && dowRes) return domOk || dowOk
  return domOk && dowOk
}

const MAX_MINUTES_SEARCH = 4 * 366 * 24 * 60

function nextRuns(sets, domRes, dowRes, count = 5) {
  const results = []
  const cursor = new Date()
  cursor.setSeconds(0, 0)
  cursor.setMinutes(cursor.getMinutes() + 1)
  let steps = 0
  while (results.length < count && steps < MAX_MINUTES_SEARCH) {
    if (matches(cursor, sets, domRes, dowRes)) results.push(new Date(cursor))
    cursor.setMinutes(cursor.getMinutes() + 1)
    steps += 1
  }
  return results
}

function describePreview(fields, t) {
  if (!fields.minute.any && !fields.hour.any && fields.dom.any && fields.month.any && fields.dow.any) {
    const minute = [...fields.minute.values].sort((a, b) => a - b)
    const hour = [...fields.hour.values].sort((a, b) => a - b)
    const h = hour.map((x) => String(x).padStart(2, '0')).join(' / ')
    const m = minute.map((x) => String(x).padStart(2, '0')).join(' / ')
    return t.description(m, h, t.weekdayNames.join('/'))
  }
  return null
}

export default function CronBuilderPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [fields, setFields] = useState(defaultFields)

  const expr = useMemo(
    () => FIELD_ORDER.map((k) => tokenFor(fields[k])).join(' '),
    [fields]
  )

  const preview = useMemo(() => {
    try {
      const sets = {
        minute: parseField(tokenFor(fields.minute), FIELD_DEFS.minute),
        hour: parseField(tokenFor(fields.hour), FIELD_DEFS.hour),
        dom: parseField(tokenFor(fields.dom), FIELD_DEFS.dom),
        month: parseField(tokenFor(fields.month), FIELD_DEFS.month),
        dow: parseField(tokenFor(fields.dow), FIELD_DEFS.dow),
      }
      return {
        error: null,
        runs: nextRuns(sets, !fields.dom.any, !fields.dow.any),
      }
    } catch (err) {
      return { error: err.message, runs: [] }
    }
  }, [fields])

  const [copied, setCopied] = useState(false)

  const copy = () => {
    navigator.clipboard.writeText(expr).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  const setAny = (k, any) => setFields((prev) => ({ ...prev, [k]: { ...prev[k], any } }))

  const toggleValue = (k, v) => {
    setFields((prev) => {
      const values = prev[k].values.includes(v)
        ? prev[k].values.filter((x) => x !== v)
        : [...prev[k].values, v]
      return { ...prev, [k]: { ...prev[k], values } }
    })
  }

  const selectAll = (k) => {
    setFields((prev) => ({ ...prev, [k]: { ...prev[k], values: rangeValues(FIELD_DEFS[k]) } }))
  }

  const clearValues = (k) => {
    setFields((prev) => ({ ...prev, [k]: { ...prev[k], values: [] } }))
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><FieldTimeOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card title={t.expressionTitle}>
        <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
          <Text code strong style={{ fontSize: 16, fontFamily: 'monospace' }}>{expr}</Text>
          <Button icon={copied ? <CheckOutlined /> : <CopyOutlined />} onClick={copy}>
            {copied ? t.copied : t.copy}
          </Button>
        </Space>
      </Card>

      <Card>
        {FIELD_ORDER.map((k) => {
          const f = fields[k]
          const def = FIELD_DEFS[k]
          return (
            <div
              key={k}
              style={{
                display: 'flex',
                gap: 16,
                alignItems: 'center',
                padding: '10px 0',
                borderBottom: '1px dashed rgba(128,128,128,0.25)',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ width: 130 }}>
                <Text strong>{t.fieldNames[k]}</Text>
                <br />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {def.min}–{def.max}
                </Text>
              </div>
              <Segmented
                size="small"
                value={f.any ? 'any' : 'set'}
                options={[
                  { label: t.anyLabel, value: 'any' },
                  { label: t.setLabel, value: 'set' },
                ]}
                onChange={(v) => setAny(k, v === 'any')}
              />
              {f.any ? (
                <Text type="secondary" style={{ fontSize: 12 }}>{t.anyTip}</Text>
              ) : (
                <Space direction="vertical" size="small" style={{ flex: 1, minWidth: 200 }}>
                  <Space wrap>
                    {rangeValues(def).map((v) => (
                      <Tag.CheckableTag
                        key={v}
                        checked={f.values.includes(v)}
                        onChange={() => toggleValue(k, v)}
                      >
                        {valueLabel(k, v, t)}
                      </Tag.CheckableTag>
                    ))}
                  </Space>
                  <Space size="small">
                    <Button size="small" onClick={() => selectAll(k)}>{t.anyLabel} *</Button>
                    <Button size="small" onClick={() => clearValues(k)}>×</Button>
                  </Space>
                </Space>
              )}
            </div>
          )
        })}
        <Paragraph type="secondary" style={{ marginTop: 12, marginBottom: 0 }}>
          {t.buildNote}
        </Paragraph>
      </Card>

      {preview.error ? (
        <Alert type="error" showIcon message={t.previewInvalid} description={preview.error} />
      ) : (
        <>
          {describePreview(fields, t) && (
            <Alert type="success" showIcon message={describePreview(fields, t)} />
          )}
          <Card title={t.nextRunsTitle}>
            {preview.runs.length === 0 ? (
              <Text type="secondary">{t.noRunsFound}</Text>
            ) : (
              <List
                dataSource={preview.runs}
                renderItem={(d) => (
                  <List.Item>
                    <Tag color="blue">{d.toLocaleString(t.locale)}</Tag>
                  </List.Item>
                )}
              />
            )}
          </Card>
        </>
      )}

      <Card title={t.howTitle}>
        <Paragraph style={{ marginBottom: 0 }}>{t.howBody}</Paragraph>
      </Card>
    </Space>
  )
}
