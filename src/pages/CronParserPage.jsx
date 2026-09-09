import React, { useMemo, useState, useCallback } from 'react'
import { Typography, Card, Input, Space, Alert, Table, Tag, Tooltip, Button } from 'antd'
import { FieldTimeOutlined, CopyOutlined, CheckOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const FIELD_DEFS = [
  { key: 'minute', min: 0, max: 59, aliases: {} },
  { key: 'hour', min: 0, max: 23, aliases: {} },
  { key: 'dom', min: 1, max: 31, aliases: {} },
  {
    key: 'month',
    min: 1,
    max: 12,
    aliases: {
      jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
      jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
    },
  },
  {
    key: 'dow',
    min: 0,
    max: 6,
    aliases: { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 },
  },
]

const SHORTHANDS = {
  '@yearly': '0 0 1 1 *',
  '@annually': '0 0 1 1 *',
  '@monthly': '0 0 1 * *',
  '@weekly': '0 0 * * 0',
  '@daily': '0 0 * * *',
  '@midnight': '0 0 * * *',
  '@hourly': '0 * * * *',
}

const PRESETS = [
  { expr: '* * * * *', key: 'every-minute' },
  { expr: '*/5 * * * *', key: 'every-5min' },
  { expr: '0 * * * *', key: 'every-hour' },
  { expr: '0 0 * * *', key: 'daily-midnight' },
  { expr: '0 9 * * 1-5', key: 'weekdays-9am' },
  { expr: '0 18 * * 5', key: 'friday-6pm' },
  { expr: '0 0 1 * *', key: 'first-of-month' },
  { expr: '0 0 * * 0', key: 'weekly-sunday' },
  { expr: '30 4 1,15 * *', key: 'twice-monthly' },
  { expr: '0 22 * * 1-5', key: 'weekdays-10pm' },
  { expr: '*/15 * * * *', key: 'every-15min' },
  { expr: '0 8-18/2 * * 1-5', key: 'workday-every-2h' },
  { expr: '@daily', key: 'shorthand-daily' },
  { expr: '@weekly', key: 'shorthand-weekly' },
  { expr: '@monthly', key: 'shorthand-monthly' },
]

const translations = {
  pt: {
    title: 'Explicador de Expressao Cron',
    intro: (
      <>
        Cole uma expressao cron de 5 campos (<Text code>minuto hora dia-do-mes mes dia-da-semana</Text>)
        ou um atalho como <Text code>@daily</Text>. Valida cada campo, descreve em linguagem natural e mostra
        as proximas execucoes — util pra confirmar que a expressao faz o que voce espera.
      </>
    ),
    inputPlaceholder: 'ex.: 0 9 * * 1-5 ou @daily',
    descriptionLabel: 'Descricao',
    noDescription: 'Expressao nao reconhecida.',
    nextRuns: 'Proximas execucoes',
    noRuns: 'Nenhuma execucao encontrada nos proximos 4 anos (combinacao dia/mes pode ser impossivel, ex.: 31 de fevereiro).',
    presets: 'Exemplos rapidos',
    copied: 'Copiado!',
    copy: 'Copiar',
    fieldMinute: 'Minuto',
    fieldHour: 'Hora',
    fieldDom: 'Dia do mes',
    fieldMonth: 'Mes',
    fieldDow: 'Dia da semana',
    valid: 'Valida',
    invalid: 'Invalida',
    errorPrefix: 'Erro',
    relativeNow: 'agora',
    relativeIn: 'em',
    relativeMin: 'min',
    relativeHr: 'h',
    relativeDay: 'dia',
    relativeTomorrow: 'amanha',
    relativeToday: 'hoje',
    locale: 'pt-BR',
    fieldCountError: 'A expressao precisa ter 5 campos: minuto hora dia-do-mes mes dia-da-semana (ou um atalho como @daily).',
    fieldNames: { minute: 'minuto', hour: 'hora', dom: 'dia do mes', month: 'mes', dow: 'dia da semana' },
    weekdayNames: ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'],
    monthNames: ['', 'janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'],
    invalidValue: (token, fieldName) => `Valor invalido "${token}" no campo ${fieldName}.`,
    invalidStep: (part, fieldName) => `Passo invalido em "${part}" no campo ${fieldName}.`,
    outOfRange: (min, max, fieldName, part) => `Valor fora do intervalo (${min}-${max}) no campo ${fieldName}: "${part}".`,
    noValues: (fieldName) => `Campo ${fieldName} nao resultou em nenhum valor valido.`,
    everyHourAtMinuteZero: 'A cada hora, no minuto 0.',
    everyHourAtMinute: (m) => `A cada hora, no minuto ${m}.`,
    everyDayAt: (h, m) => `Todos os dias as ${h}:${m}.`,
    atTimeOnDays: (h, m, days) => `As ${h}:${m}, nos dias: ${days}.`,
    everyMinute: 'a cada minuto',
    everyHour: 'a cada hora',
    minuteLabel: (desc) => `minuto(s) ${desc}`,
    hourLabel: (desc) => `hora(s) ${desc}`,
    domLabel: (desc) => `dia(s) do mes ${desc}`,
    monthLabel: (desc) => `mes(es) ${desc}`,
    dowLabel: (desc) => `dia(s) da semana ${desc}`,
    executesPrefix: (parts) => `Executa: ${parts.join(' \u2014 ')}.`,
    quickReferenceTitle: 'Referencia rapida',
    referenceCode: `* * * * *
| | | | |
| | | | +-- dia da semana (0-6, 0=domingo, aceita sun-sat)
| | | +---- mes (1-12, aceita jan-dec)
| | +------ dia do mes (1-31)
| +-------- hora (0-23)
+---------- minuto (0-59)

Suporta: * , - / e atalhos @yearly @monthly @weekly @daily @hourly`,
  },
  en: {
    title: 'Cron Expression Explainer',
    intro: (
      <>
        Paste a 5-field cron expression (<Text code>minute hour day-of-month month day-of-week</Text>)
        or a shorthand like <Text code>@daily</Text>. Validates each field, describes what each part means, and shows
        the next real execution times — useful to confirm the expression does what you expect.
      </>
    ),
    inputPlaceholder: 'e.g.: 0 9 * * 1-5 or @daily',
    descriptionLabel: 'Description',
    noDescription: 'Expression not recognized.',
    nextRuns: 'Next executions',
    noRuns: 'No executions found in the next 4 years (day/month combination may be impossible, e.g. February 31).',
    presets: 'Quick examples',
    copied: 'Copied!',
    copy: 'Copy',
    fieldMinute: 'Minute',
    fieldHour: 'Hour',
    fieldDom: 'Day of month',
    fieldMonth: 'Month',
    fieldDow: 'Day of week',
    valid: 'Valid',
    invalid: 'Invalid',
    errorPrefix: 'Error',
    relativeNow: 'now',
    relativeIn: 'in',
    relativeMin: 'min',
    relativeHr: 'h',
    relativeDay: 'days',
    relativeTomorrow: 'tomorrow',
    relativeToday: 'today',
    locale: 'en-US',
    fieldCountError: 'The expression needs 5 fields: minute hour day-of-month month day-of-week (or a shorthand like @daily).',
    fieldNames: { minute: 'minute', hour: 'hour', dom: 'day of month', month: 'month', dow: 'day of week' },
    weekdayNames: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    monthNames: ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    invalidValue: (token, fieldName) => `Invalid value "${token}" in field ${fieldName}.`,
    invalidStep: (part, fieldName) => `Invalid step in "${part}" in field ${fieldName}.`,
    outOfRange: (min, max, fieldName, part) => `Value out of range (${min}-${max}) in field ${fieldName}: "${part}".`,
    noValues: (fieldName) => `Field ${fieldName} produced no valid values.`,
    everyHourAtMinuteZero: 'Every hour, at minute 0.',
    everyHourAtMinute: (m) => `Every hour, at minute ${m}.`,
    everyDayAt: (h, m) => `Every day at ${h}:${m}.`,
    atTimeOnDays: (h, m, days) => `At ${h}:${m}, on: ${days}.`,
    everyMinute: 'every minute',
    everyHour: 'every hour',
    minuteLabel: (desc) => `minute(s) ${desc}`,
    hourLabel: (desc) => `hour(s) ${desc}`,
    domLabel: (desc) => `day(s) of month ${desc}`,
    monthLabel: (desc) => `month(s) ${desc}`,
    dowLabel: (desc) => `day(s) of week ${desc}`,
    executesPrefix: (parts) => `Runs: ${parts.join(' \u2014 ')}.`,
    quickReferenceTitle: 'Quick reference',
    referenceCode: `* * * * *
| | | | |
| | | | +-- day of week (0-6, 0=Sunday, accepts sun-sat)
| | | +---- month (1-12, accepts jan-dec)
| | +------ day of month (1-31)
| +-------- hour (0-23)
+---------- minute (0-59)

Supports: * , - / and shorthands @yearly @monthly @weekly @daily @hourly`,
  },
}

function resolveToken(token, def, t) {
  const lower = token.toLowerCase()
  if (lower in def.aliases) return def.aliases[lower]
  const n = Number(token)
  if (!Number.isInteger(n)) {
    throw new Error(t.invalidValue(token, t.fieldNames[def.key]))
  }
  return n
}

function parseField(rawField, def, t) {
  const values = new Set()
  const parts = rawField.split(',')
  for (const part of parts) {
    let [range, stepRaw] = part.split('/')
    const step = stepRaw !== undefined ? Number(stepRaw) : 1
    if (stepRaw !== undefined && (!Number.isInteger(step) || step <= 0)) {
      throw new Error(t.invalidStep(part, t.fieldNames[def.key]))
    }
    let start = def.min
    let end = def.max
    if (range !== '*') {
      if (range.includes('-')) {
        const [a, b] = range.split('-')
        start = resolveToken(a, def, t)
        end = resolveToken(b, def, t)
      } else {
        start = end = resolveToken(range, def, t)
      }
    }
    if (start < def.min || end > def.max || start > end) {
      throw new Error(t.outOfRange(def.min, def.max, t.fieldNames[def.key], part))
    }
    for (let v = start; v <= end; v += step) values.add(v)
  }
  if (values.size === 0) {
    throw new Error(t.noValues(t.fieldNames[def.key]))
  }
  return values
}

function parseCron(rawExpr, t) {
  const expr = SHORTHANDS[rawExpr.trim().toLowerCase()] || rawExpr.trim()
  const fields = expr.split(/\s+/)
  if (fields.length !== 5) {
    throw new Error(t.fieldCountError)
  }
  const [minute, hour, dom, month, dow] = fields.map((raw, i) => parseField(raw, FIELD_DEFS[i], t))
  const domRaw = fields[2]
  const dowRaw = fields[4]
  const domRestricted = domRaw !== '*'
  const dowRestricted = dowRaw !== '*'
  return { minute, hour, dom, month, dow, domRestricted, dowRestricted, rawFields: fields }
}

function matches(date, parsed) {
  const { minute, hour, dom, month, dow, domRestricted, dowRestricted } = parsed
  if (!minute.has(date.getMinutes())) return false
  if (!hour.has(date.getHours())) return false
  if (!month.has(date.getMonth() + 1)) return false
  const domOk = dom.has(date.getDate())
  const dowOk = dow.has(date.getDay())
  if (domRestricted && dowRestricted) return domOk || dowOk
  return domOk && dowOk
}

const MAX_MINUTES_SEARCH = 4 * 366 * 24 * 60

function findNextRuns(parsed, count) {
  const results = []
  const cursor = new Date()
  cursor.setSeconds(0, 0)
  cursor.setMinutes(cursor.getMinutes() + 1)
  let steps = 0
  while (results.length < count && steps < MAX_MINUTES_SEARCH) {
    if (matches(cursor, parsed)) results.push(new Date(cursor))
    cursor.setMinutes(cursor.getMinutes() + 1)
    steps += 1
  }
  return results
}

function formatRelative(date, now, t) {
  const diffMs = date.getTime() - now.getTime()
  const diffMin = Math.round(diffMs / 60000)
  if (diffMin === 0) return t.relativeNow
  if (diffMin < 60) return `${t.relativeIn} ${diffMin} ${t.relativeMin}`
  const diffHr = Math.round(diffMin / 60)
  if (diffHr < 24) return `${t.relativeIn} ${diffHr} ${t.relativeHr}`
  const diffDay = Math.round(diffHr / 24)
  const today = new Date(now)
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  if (date.toDateString() === today.toDateString()) return t.relativeToday
  if (date.toDateString() === tomorrow.toDateString()) return t.relativeTomorrow
  return `${t.relativeIn} ${diffDay} ${t.relativeDay}`
}

function describeCron(parsed, t) {
  const { minute, hour, dom, month, dow } = parsed
  const isEvery = (set, def) => set.size === def.max - def.min + 1

  if (minute.size === 1 && isEvery(hour, FIELD_DEFS[1]) && isEvery(dom, FIELD_DEFS[2]) && isEvery(month, FIELD_DEFS[3]) && isEvery(dow, FIELD_DEFS[4])) {
    const m = [...minute][0]
    return m === 0 ? t.everyHourAtMinuteZero : t.everyHourAtMinute(m)
  }
  if (minute.size === 1 && hour.size === 1 && isEvery(dom, FIELD_DEFS[2]) && isEvery(month, FIELD_DEFS[3]) && isEvery(dow, FIELD_DEFS[4])) {
    const m = String([...minute][0]).padStart(2, '0')
    const h = String([...hour][0]).padStart(2, '0')
    return t.everyDayAt(h, m)
  }
  if (minute.size === 1 && hour.size === 1 && isEvery(dom, FIELD_DEFS[2]) && isEvery(month, FIELD_DEFS[3]) && dow.size < FIELD_DEFS[4].max - FIELD_DEFS[4].min + 1) {
    const m = String([...minute][0]).padStart(2, '0')
    const h = String([...hour][0]).padStart(2, '0')
    const days = [...dow].sort((a, b) => a - b).map((v) => t.weekdayNames[v]).join(', ')
    return t.atTimeOnDays(h, m, days)
  }

  const parts = []
  const minuteDesc = describeField(minute, FIELD_DEFS[0], t)
  const hourDesc = describeField(hour, FIELD_DEFS[1], t)
  const domDesc = describeField(dom, FIELD_DEFS[2], t)
  const monthDesc = describeField(month, FIELD_DEFS[3], t)
  const dowDesc = describeField(dow, FIELD_DEFS[4], t)
  parts.push(minuteDesc ? t.minuteLabel(minuteDesc) : t.everyMinute)
  parts.push(hourDesc ? t.hourLabel(hourDesc) : t.everyHour)
  if (domDesc) parts.push(t.domLabel(domDesc))
  if (monthDesc) parts.push(t.monthLabel(monthDesc))
  if (dowDesc) parts.push(t.dowLabel(dowDesc))
  return t.executesPrefix(parts)
}

function describeField(set, def, t) {
  if (set.size === def.max - def.min + 1) return null
  const sorted = [...set].sort((a, b) => a - b)
  if (def.key === 'dow') return sorted.map((v) => t.weekdayNames[v]).join(', ')
  if (def.key === 'month') return sorted.map((v) => t.monthNames[v]).join(', ')
  return sorted.join(', ')
}

export default function CronParserPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [expr, setExpr] = useState('0 0 * * *')
  const [copied, setCopied] = useState(false)

  const result = useMemo(() => {
    if (!expr.trim()) return { data: null, error: null }
    try {
      const parsed = parseCron(expr, t)
      return {
        data: {
          description: describeCron(parsed, t),
          runs: findNextRuns(parsed, 15),
          parsed,
        },
        error: null,
      }
    } catch (err) {
      return { data: null, error: err.message }
    }
  }, [expr, t])

  const fieldTable = useMemo(() => {
    if (result.error || !result.data) return []
    const { parsed } = result.data
    const labels = [t.fieldMinute, t.fieldHour, t.fieldDom, t.fieldMonth, t.fieldDow]
    const mins = [String(FIELD_DEFS[0].min), String(FIELD_DEFS[1].min), String(FIELD_DEFS[2].min), String(FIELD_DEFS[3].min), String(FIELD_DEFS[4].min)]
    const maxs = [String(FIELD_DEFS[0].max), String(FIELD_DEFS[1].max), String(FIELD_DEFS[2].max), String(FIELD_DEFS[3].max), String(FIELD_DEFS[4].max)]
    const keys = ['minute', 'hour', 'dom', 'month', 'dow']
    return labels.map((label, i) => {
      const set = parsed[keys[i]]
      return {
        key: i,
        field: label,
        raw: result.data.parsed.rawFields[i] || '',
        min: mins[i],
        max: maxs[i],
        count: set.size,
        values: [...set].slice(0, 20).join(', ') + (set.size > 20 ? ' ...' : ''),
      }
    })
  }, [result, t])

  const columns = useMemo(() => [
    {
      title: lang === 'pt' ? 'Campo' : 'Field',
      dataIndex: 'field',
      key: 'field',
      render: (v) => <Text strong>{v}</Text>,
    },
    {
      title: lang === 'pt' ? 'Valor' : 'Value',
      dataIndex: 'raw',
      key: 'raw',
      render: (v) => <Text code>{v}</Text>,
    },
    {
      title: lang === 'pt' ? 'Faixa' : 'Range',
      key: 'range',
      render: (_, r) => <Text type="secondary">{r.min}\u2013{r.max}</Text>,
    },
    {
      title: lang === 'pt' ? 'Valores' : 'Values',
      key: 'values',
      render: (_, r) => (
        <Tooltip title={r.values}>
          <Tag>{r.count} {lang === 'pt' ? 'valores' : 'values'}</Tag>
        </Tooltip>
      ),
    },
  ], [lang])

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(expr)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }, [expr])

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div>
        <Title level={2}>
          <Space>
            <FieldTimeOutlined />
            {t.title}
          </Space>
        </Title>
        <Paragraph>{t.intro}</Paragraph>
      </div>

      <Card>
        <Space.Compact style={{ width: '100%' }}>
          <Input
            size="large"
            value={expr}
            onChange={(e) => setExpr(e.target.value)}
            placeholder={t.inputPlaceholder}
            style={{ fontFamily: 'monospace', fontSize: 16 }}
          />
          <Tooltip title={copied ? t.copied : t.copy}>
            <Button size="large" icon={copied ? <CheckOutlined /> : <CopyOutlined />} onClick={handleCopy} />
          </Tooltip>
        </Space.Compact>
      </Card>

      {result.error && expr.trim() && (
        <Alert
          type="error"
          showIcon
          message={`${t.errorPrefix}: ${t.noDescription}`}
          description={<Text type="secondary">{result.error}</Text>}
        />
      )}

      {result.data && (
        <>
          <Card size="small" title={t.descriptionLabel}>
            <Space wrap>
              <Tag color="blue" style={{ fontSize: 13, padding: '2px 8px' }}>{result.data.description}</Tag>
            </Space>
          </Card>

          <Card size="small" title={lang === 'pt' ? 'Detalhes por campo' : 'Field details'}>
            <Table
              dataSource={fieldTable}
              columns={columns}
              pagination={false}
              size="small"
              bordered
            />
          </Card>
        </>
      )}

      {result.data && result.data.runs.length > 0 && (
        <Card title={`${t.nextRuns} (${result.data.runs.length})`}>
          <Table
            dataSource={result.data.runs.map((d, i) => ({ key: i, date: d }))}
            columns={[
              {
                title: '#',
                key: 'idx',
                width: 50,
                render: (_, __, i) => i + 1,
              },
              {
                title: lang === 'pt' ? 'Data e hora' : 'Date & time',
                dataIndex: 'date',
                key: 'date',
                render: (d) => (
                  <Text code style={{ fontSize: 13 }}>
                    {d.toLocaleString(t.locale, {
                      weekday: 'short',
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                ),
              },
              {
                title: lang === 'pt' ? 'Relativo' : 'Relative',
                dataIndex: 'date',
                key: 'relative',
                render: (d) => (
                  <Tag color="green">{formatRelative(d, new Date(), t)}</Tag>
                ),
              },
            ]}
            pagination={false}
            size="small"
            bordered
          />
        </Card>
      )}

      {result.data && result.data.runs.length === 0 && (
        <Alert type="warning" showIcon message={t.noRuns} />
      )}

      <Card title={t.presets}>
        <Space wrap>
          {PRESETS.map((p) => (
            <Tooltip key={p.key} title={p.expr}>
              <Button
                size="small"
                onClick={() => setExpr(p.expr)}
                style={{ fontFamily: 'monospace' }}
              >
                {p.expr}
              </Button>
            </Tooltip>
          ))}
        </Space>
      </Card>

      <Card title={t.quickReferenceTitle}>
        <pre style={{ margin: 0, overflowX: 'auto' }}>
          <code>{t.referenceCode}</code>
        </pre>
      </Card>
    </Space>
  )
}
