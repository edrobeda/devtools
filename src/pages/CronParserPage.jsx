import React, { useMemo, useState } from 'react'
import { Typography, Card, Input, Space, Alert, List, Tag } from 'antd'
import { FieldTimeOutlined } from '@ant-design/icons'
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

const translations = {
  pt: {
    title: 'Explicador de Expressão Cron',
    intro: (
      <>
        Digite uma expressão cron de 5 campos (<Text code>minuto hora dia-do-mês mês dia-da-semana</Text>)
        ou um atalho como <Text code>@daily</Text>. Tudo calculado no navegador — mostra a descrição em
        português e os próximos horários de execução a partir de agora.
      </>
    ),
    invalidExpressionTitle: 'Expressão inválida',
    nextRunsTitle: 'Próximas 5 execuções',
    noRunsFound: 'Nenhuma execução encontrada nos próximos 4 anos (combinação de dia/mês pode ser impossível, ex.: 31 de fevereiro).',
    quickReferenceTitle: 'Referência rápida',
    fieldNames: { minute: 'minuto', hour: 'hora', dom: 'dia do mês', month: 'mês', dow: 'dia da semana' },
    weekdayNames: ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'],
    monthNames: ['', 'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'],
    locale: 'pt-BR',
    invalidValue: (token, fieldName) => `Valor inválido "${token}" no campo ${fieldName}.`,
    invalidStep: (part, fieldName) => `Passo inválido em "${part}" no campo ${fieldName}.`,
    outOfRange: (min, max, fieldName, part) => `Valor fora do intervalo (${min}-${max}) no campo ${fieldName}: "${part}".`,
    noValues: (fieldName) => `Campo ${fieldName} não resultou em nenhum valor válido.`,
    fieldCountError: 'A expressão precisa ter 5 campos: minuto hora dia-do-mês mês dia-da-semana (ou um atalho como @daily).',
    everyHourAtMinuteZero: 'A cada hora, no minuto 0.',
    everyHourAtMinute: (m) => `A cada hora, no minuto ${m}.`,
    everyDayAt: (h, m) => `Todos os dias às ${h}:${m}.`,
    atTimeOnDays: (h, m, days) => `Às ${h}:${m}, nos dias: ${days}.`,
    everyMinute: 'a cada minuto',
    everyHour: 'a cada hora',
    minuteLabel: (desc) => `minuto(s) ${desc}`,
    hourLabel: (desc) => `hora(s) ${desc}`,
    domLabel: (desc) => `dia(s) do mês ${desc}`,
    monthLabel: (desc) => `mês(es) ${desc}`,
    dowLabel: (desc) => `dia(s) da semana ${desc}`,
    executesPrefix: (parts) => `Executa: ${parts.join(' — ')}.`,
    referenceCode: `* * * * *
│ │ │ │ │
│ │ │ │ └── dia da semana (0-6, 0=domingo, aceita sun-sat)
│ │ │ └──── mês (1-12, aceita jan-dec)
│ │ └────── dia do mês (1-31)
│ └──────── hora (0-23)
└────────── minuto (0-59)

Suporta: * , - / e atalhos @yearly @monthly @weekly @daily @hourly`,
  },
  en: {
    title: 'Cron Expression Explainer',
    intro: (
      <>
        Type a 5-field cron expression (<Text code>minute hour day-of-month month day-of-week</Text>)
        or a shorthand like <Text code>@daily</Text>. Everything is computed in the browser — it shows an
        English description and the next run times starting from now.
      </>
    ),
    invalidExpressionTitle: 'Invalid expression',
    nextRunsTitle: 'Next 5 runs',
    noRunsFound: 'No runs found in the next 4 years (the day/month combination may be impossible, e.g. February 31).',
    quickReferenceTitle: 'Quick reference',
    fieldNames: { minute: 'minute', hour: 'hour', dom: 'day of month', month: 'month', dow: 'day of week' },
    weekdayNames: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    monthNames: ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    locale: 'en-US',
    invalidValue: (token, fieldName) => `Invalid value "${token}" in field ${fieldName}.`,
    invalidStep: (part, fieldName) => `Invalid step in "${part}" in field ${fieldName}.`,
    outOfRange: (min, max, fieldName, part) => `Value out of range (${min}-${max}) in field ${fieldName}: "${part}".`,
    noValues: (fieldName) => `Field ${fieldName} produced no valid values.`,
    fieldCountError: 'The expression needs 5 fields: minute hour day-of-month month day-of-week (or a shorthand like @daily).',
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
    executesPrefix: (parts) => `Runs: ${parts.join(' — ')}.`,
    referenceCode: `* * * * *
│ │ │ │ │
│ │ │ │ └── day of week (0-6, 0=Sunday, accepts sun-sat)
│ │ │ └──── month (1-12, accepts jan-dec)
│ │ └────── day of month (1-31)
│ └──────── hour (0-23)
└────────── minute (0-59)

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
  return { minute, hour, dom, month, dow, domRestricted, dowRestricted }
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

function nextRuns(parsed, count = 5) {
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

function describeField(set, def, t) {
  if (set.size === def.max - def.min + 1) return null
  const sorted = [...set].sort((a, b) => a - b)
  if (def.key === 'dow') return sorted.map((v) => t.weekdayNames[v]).join(', ')
  if (def.key === 'month') return sorted.map((v) => t.monthNames[v]).join(', ')
  return sorted.join(', ')
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

export default function CronParserPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [expr, setExpr] = useState('0 0 * * *')

  const result = useMemo(() => {
    if (!expr.trim()) return { data: null, error: null }
    try {
      const parsed = parseCron(expr, t)
      return {
        data: {
          description: describeCron(parsed, t),
          runs: nextRuns(parsed, 5),
        },
        error: null,
      }
    } catch (err) {
      return { data: null, error: err.message }
    }
  }, [expr, t])

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><FieldTimeOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card>
        <Input
          placeholder="0 0 * * *"
          value={expr}
          onChange={(e) => setExpr(e.target.value)}
          style={{ fontFamily: 'monospace' }}
        />
      </Card>

      {result.error && (
        <Alert type="error" showIcon message={t.invalidExpressionTitle} description={result.error} />
      )}

      {result.data && (
        <>
          <Alert type="success" showIcon message={result.data.description} />

          <Card title={t.nextRunsTitle}>
            {result.data.runs.length === 0 ? (
              <Text type="secondary">{t.noRunsFound}</Text>
            ) : (
              <List
                dataSource={result.data.runs}
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

      <Card title={t.quickReferenceTitle}>
        <pre style={{ margin: 0, overflowX: 'auto' }}>
          <code>{t.referenceCode}</code>
        </pre>
      </Card>
    </Space>
  )
}
