import React, { useMemo, useState } from 'react'
import { Typography, Card, Space, Tag, Table, Select, Alert, Row, Col, Input, Button, Tooltip } from 'antd'
import { FieldTimeOutlined, CopyOutlined, CheckOutlined, ThunderboltOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const FIELD_MIN = [0, 0, 1, 1, 0]
const FIELD_MAX = [59, 23, 31, 12, 6]

const WEEKDAY_NAMES = {
  pt: ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'],
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
}
const MONTH_NAMES = {
  pt: ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
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
]

const translations = {
  pt: {
    title: 'Debugger de Expressao Cron',
    intro: (
      <>
        Cole uma expressao cron de 5 campos (<Text code>minuto hora dia-do-mes mes dia-da-semana</Text>)
        e veja quando ela sera executada nas proximas vezes. Valida cada campo, descreve o que cada parte
        significa e mostra a proxima execucao real — util pra confirmar que a expressao faz o que voce espera.
      </>
    ),
    inputPlaceholder: 'ex.: 0 9 * * 1-5',
    descriptionLabel: 'Descricao',
    noDescription: 'Expressao nao reconhecida.',
    nextRuns: 'Proximas execucoes',
    noRuns: 'Nenhuma execucao encontrada nos proximos 4 anos.',
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
  },
  en: {
    title: 'Cron Expression Debugger',
    intro: (
      <>
        Paste a 5-field cron expression (<Text code>minute hour day-of-month month day-of-week</Text>)
        and see when it will fire next. Validates each field, describes what each part means, and shows
        the next real execution times — useful to confirm the expression does what you expect.
      </>
    ),
    inputPlaceholder: 'e.g.: 0 9 * * 1-5',
    descriptionLabel: 'Description',
    noDescription: 'Expression not recognized.',
    nextRuns: 'Next executions',
    noRuns: 'No executions found in the next 4 years.',
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
  },
}

function parseField(raw, min, max) {
  const values = new Set()
  const parts = raw.split(',')
  for (const part of parts) {
    if (part === '*') {
      for (let i = min; i <= max; i++) values.add(i)
      continue
    }
    const stepMatch = part.match(/^(\S+?)\/(\d+)$/)
    const base = stepMatch ? stepMatch[1] : part
    const step = stepMatch ? parseInt(stepMatch[2], 10) : null
    if (step !== null && (step <= 0 || isNaN(step))) return null

    let lo, hi
    if (base === '*') {
      lo = min
      hi = max
    } else if (base.includes('-')) {
      const [a, b] = base.split('-')
      lo = parseInt(a, 10)
      hi = parseInt(b, 10)
      if (isNaN(lo) || isNaN(hi)) return null
    } else {
      const v = parseInt(base, 10)
      if (isNaN(v)) return null
      lo = v
      hi = v
    }
    if (lo < min || hi > max || lo > hi) return null

    if (step !== null) {
      for (let i = lo; i <= hi; i += step) values.add(i)
    } else if (lo === hi) {
      values.add(lo)
    } else {
      for (let i = lo; i <= hi; i++) values.add(i)
    }
  }
  return values.size > 0 ? values : null
}

function parseCron(expr) {
  const trimmed = expr.trim().replace(/\s+/g, ' ')
  const parts = trimmed.split(' ')
  if (parts.length !== 5) return { error: true }
  const fields = []
  for (let i = 0; i < 5; i++) {
    const parsed = parseField(parts[i], FIELD_MIN[i], FIELD_MAX[i])
    if (!parsed) return { error: true }
    fields.push(parsed)
  }
  return { fields, error: false }
}

function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate()
}

function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
}

function fieldHuman(field, raw, min, max) {
  if (raw === '*') return null
  const stepMatch = raw.match(/^(\S+?)\/(\d+)$/)
  if (stepMatch) {
    const base = stepMatch[1]
    const step = stepMatch[2]
    if (base === '*') return { type: 'step', step, from: min, to: max }
    if (base.includes('-')) {
      const [a, b] = base.split('-')
      return { type: 'step-range', step, from: parseInt(a, 10), to: parseInt(b, 10) }
    }
    const v = parseInt(base, 10)
    return { type: 'step-from', step, from: v, to: max }
  }
  if (raw.includes('-') && !raw.includes(',')) {
    const [a, b] = raw.split('-')
    return { type: 'range', from: parseInt(a, 10), to: parseInt(b, 10) }
  }
  if (raw.includes(',')) {
    return { type: 'list', values: raw.split(',').map(Number) }
  }
  return { type: 'exact', value: parseInt(raw, 10) }
}

function describeField(fieldIdx, raw, lang) {
  const t = translations[lang]
  const fieldNames = [t.fieldMinute, t.fieldHour, t.fieldDom, t.fieldMonth, t.fieldDow]
  const wk = WEEKDAY_NAMES[lang]
  const mo = MONTH_NAMES[lang]
  if (raw === '*') return `${fieldNames[fieldIdx]}: ${lang === 'pt' ? 'qualquer' : 'any'}`

  const fmt = (v) => {
    if (fieldIdx === 4 && wk[v]) return wk[v]
    if (fieldIdx === 3 && mo[v - 1]) return mo[v - 1]
    return String(v)
  }

  const stepMatch = raw.match(/^(\S+?)\/(\d+)$/)
  if (stepMatch) {
    const base = stepMatch[1]
    const step = parseInt(stepMatch[2], 10)
    const lo = base === '*' ? FIELD_MIN[fieldIdx] : base.includes('-') ? parseInt(base.split('-')[0], 10) : parseInt(base, 10)
    const hi = base === '*' ? FIELD_MAX[fieldIdx] : base.includes('-') ? parseInt(base.split('-')[1], 10) : lo
    return `${fieldNames[fieldIdx]}: ${lang === 'pt' ? 'de' : 'from'} ${fmt(lo)} ${lang === 'pt' ? 'ate' : 'to'} ${fmt(hi)} ${lang === 'pt' ? 'a cada' : 'every'} ${step}`
  }
  if (raw.includes('-') && !raw.includes(',')) {
    const [a, b] = raw.split('-').map(Number)
    return `${fieldNames[fieldIdx]}: ${fmt(a)}–${fmt(b)}`
  }
  if (raw.includes(',')) {
    const vals = raw.split(',').map(Number)
    return `${fieldNames[fieldIdx]}: ${vals.map(fmt).join(', ')}`
  }
  return `${fieldNames[fieldIdx]}: ${fmt(parseInt(raw, 10))}`
}

function describeCron(fields, rawParts, lang) {
  const descs = fields.map((_, i) => describeField(i, rawParts[i], lang))
  return descs.join(' | ')
}

function findNextRuns(fields, count) {
  const now = new Date()
  const runs = []
  const d = new Date(now)
  d.setSeconds(0)
  d.setMilliseconds(0)
  d.setTime(d.getTime() + 60000)

  const maxIter = 366 * 24 * 60
  for (let iter = 0; iter < maxIter && runs.length < count; iter++) {
    const minute = d.getMinutes()
    const hour = d.getHours()
    const dom = d.getDate()
    const month = d.getMonth() + 1
    const dow = d.getDay()

    if (
      fields[0].has(minute) &&
      fields[1].has(hour) &&
      fields[3].has(month) &&
      (fields[2].has(dom) || fields[4].has(dow))
    ) {
      runs.push(new Date(d))
    }
    d.setTime(d.getTime() + 60000)
  }
  return runs
}

function formatRelative(date, now, lang) {
  const t = translations[lang]
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

export default function CronExpressionDebuggerPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [expr, setExpr] = useState('0 9 * * 1-5')
  const [copied, setCopied] = useState(false)

  const parsed = useMemo(() => parseCron(expr), [expr])

  const rawParts = useMemo(() => expr.trim().replace(/\s+/g, ' ').split(' '), [expr])

  const description = useMemo(() => {
    if (parsed.error) return null
    return describeCron(parsed.fields, rawParts, lang)
  }, [parsed, rawParts, lang])

  const nextRuns = useMemo(() => {
    if (parsed.error) return []
    return findNextRuns(parsed.fields, 15)
  }, [parsed])

  const handleCopy = () => {
    navigator.clipboard.writeText(expr)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const fieldTable = useMemo(() => {
    if (parsed.error) return []
    const labels = [t.fieldMinute, t.fieldHour, t.fieldDom, t.fieldMonth, t.fieldDow]
    const mins = ['0', '0', '1', '1', '0']
    const maxs = ['59', '23', '31', '12', '6']
    const rawFields = rawParts
    return labels.map((label, i) => ({
      key: i,
      field: label,
      raw: rawFields[i] || '',
      min: mins[i],
      max: maxs[i],
      count: parsed.fields[i].size,
      values: [...parsed.fields[i]].slice(0, 20).join(', ') + (parsed.fields[i].size > 20 ? ' ...' : ''),
    }))
  }, [parsed, rawParts, t])

  const columns = [
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
      render: (_, r) => <Text type="secondary">{r.min}–{r.max}</Text>,
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
  ]

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

      {!parsed.error && description && (
        <Card size="small" title={t.descriptionLabel}>
          <Space wrap>
            {description.split(' | ').map((part, i) => (
              <Tag key={i} color="blue" style={{ fontSize: 13, padding: '2px 8px' }}>{part}</Tag>
            ))}
          </Space>
        </Card>
      )}

      {!parsed.error && (
        <Card size="small" title={lang === 'pt' ? 'Detalhes por campo' : 'Field details'}>
          <Table
            dataSource={fieldTable}
            columns={columns}
            pagination={false}
            size="small"
            bordered
          />
        </Card>
      )}

      {parsed.error && expr.trim() && (
        <Alert
          type="error"
          showIcon
          message={`${t.errorPrefix}: ${t.noDescription}`}
          description={
            <Text type="secondary">
              {lang === 'pt'
                ? 'Uma expressao cron valida tem exatamente 5 campos separados por espacos: minuto (0-59), hora (0-23), dia do mes (1-31), mes (1-12) e dia da semana (0-6,-dom=0).'
                : 'A valid cron expression has exactly 5 space-separated fields: minute (0-59), hour (0-23), day of month (1-31), month (1-12), and day of week (0-6, Sun=0).'}
            </Text>
          }
        />
      )}

      {!parsed.error && nextRuns.length > 0 && (
        <Card title={t.nextRuns}>
          <Table
            dataSource={nextRuns.map((d, i) => ({ key: i, date: d }))}
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
                  <Tag color="green">{formatRelative(d, new Date(), lang)}</Tag>
                ),
              },
            ]}
            pagination={false}
            size="small"
            bordered
          />
        </Card>
      )}

      {!parsed.error && nextRuns.length === 0 && (
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
    </Space>
  )
}
