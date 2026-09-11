import React, { useMemo, useState, useEffect } from 'react'
import { Typography, Card, Space, Input, Table, Tag, Empty, Alert, Tooltip } from 'antd'
import { FieldTimeOutlined, CalendarOutlined, ClockCircleOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const MONTH_NAMES_EN = ['January','February','March','April','May','June','July','August','September','October','November','December']
const MONTH_NAMES_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const DOW_NAMES_EN = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const DOW_NAMES_PT = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']

const PRESETS = [
  { label: '* * * * *', desc: { pt: 'A cada minuto', en: 'Every minute' } },
  { label: '0 * * * *', desc: { pt: 'Topo da hora', en: 'Top of every hour' } },
  { label: '0 0 * * *', desc: { pt: 'Todo dia à meia-noite', en: 'Daily at midnight' } },
  { label: '0 9 * * 1-5', desc: { pt: 'Seg-Sex às 9h', en: 'Weekdays at 9am' } },
  { label: '0 0 1 * *', desc: { pt: 'Dia 1 de cada mês', en: '1st of every month' } },
  { label: '*/15 * * * *', desc: { pt: 'A cada 15 min', en: 'Every 15 min' } },
  { label: '0 */2 * * *', desc: { pt: 'A cada 2h', en: 'Every 2 hours' } },
  { label: '30 4 1,15 * *', desc: { pt: 'Dia 1 e 15 às 4:30', en: '1st & 15th at 4:30am' } },
  { label: '0 22 * * 5', desc: { pt: 'Sexta às 22h', en: 'Fridays at 10pm' } },
]

const translations = {
  pt: {
    title: 'Linha do Tempo de Cron',
    intro: 'Digite uma expressão cron de 5 campos e veja as próximas execuções numa tabela e num calendário mensal. Útil pra entender exatamente quando um cron job vai rodar.',
    inputLabel: 'Expressão cron',
    inputPlaceholder: 'minuto hora dia-do-mês mês dia-da-semana',
    invalid: 'Expressão inválida. Use 5 campos: minuto (0-59), hora (0-23), dia-do-mês (1-31), mês (1-12), dia-da-semana (0-6).',
    nextRuns: 'Próximas 50 execuções',
    calendarTitle: 'Calendário mensal',
    calendarNote: 'Dias com execuções programadas estão destacados.',
    presets: 'Exemplos prontos',
    noRuns: 'Nenhuma execução encontrada nos próximos 5 anos.',
    colDate: 'Data',
    colTime: 'Hora',
    colDow: 'Dia',
    colCronDay: 'Dia do mês',
    colCronMonth: 'Mês',
    colCronDow: 'Dia semana',
    weekdays: DOW_NAMES_PT,
    months: MONTH_NAMES_PT,
    dowNames: ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'],
  },
  en: {
    title: 'Cron Schedule Timeline',
    intro: 'Enter a 5-field cron expression and see upcoming runs in a table and monthly calendar. Useful for understanding exactly when a cron job will fire.',
    inputLabel: 'Cron expression',
    inputPlaceholder: 'minute hour day-of-month month day-of-week',
    invalid: 'Invalid expression. Use 5 fields: minute (0-59), hour (0-23), day-of-month (1-31), month (1-12), day-of-week (0-6).',
    nextRuns: 'Next 50 executions',
    calendarTitle: 'Monthly calendar',
    calendarNote: 'Days with scheduled runs are highlighted.',
    presets: 'Quick presets',
    noRuns: 'No executions found in the next 5 years.',
    colDate: 'Date',
    colTime: 'Time',
    colDow: 'Day',
    colCronDay: 'DoM',
    colCronMonth: 'Month',
    colCronDow: 'DoW',
    weekdays: DOW_NAMES_EN,
    months: MONTH_NAMES_EN,
    dowNames: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],
  },
}

function parseCronField(field, min, max) {
  const values = new Set()
  for (const part of field.split(',')) {
    const stepMatch = part.match(/^(.+)\/(\d+)$/)
    if (stepMatch) {
      const step = parseInt(stepMatch[2], 10)
      if (step <= 0) continue
      let rangeStart = min
      let rangeEnd = max
      if (stepMatch[1] !== '*') {
        if (stepMatch[1].includes('-')) {
          const [a, b] = stepMatch[1].split('-').map(Number)
          rangeStart = a
          rangeEnd = b
        } else {
          rangeStart = parseInt(stepMatch[1], 10)
          rangeEnd = max
        }
      }
      for (let i = rangeStart; i <= rangeEnd; i += step) values.add(i)
    } else if (part.includes('-')) {
      const [a, b] = part.split('-').map(Number)
      for (let i = a; i <= b; i++) values.add(i)
    } else if (part === '*') {
      for (let i = min; i <= max; i++) values.add(i)
    } else {
      values.add(parseInt(part, 10))
    }
  }
  return values
}

function parseCronExpression(expr) {
  const parts = expr.trim().split(/\s+/)
  if (parts.length !== 5) return null
  const fields = [
    { name: 'minute', min: 0, max: 59 },
    { name: 'hour', min: 0, max: 23 },
    { name: 'dom', min: 1, max: 31 },
    { name: 'month', min: 1, max: 12 },
    { name: 'dow', min: 0, max: 6 },
  ]
  const parsed = {}
  for (let i = 0; i < 5; i++) {
    try {
      parsed[fields[i].name] = parseCronField(parts[i], fields[i].min, fields[i].max)
    } catch {
      return null
    }
    if (parsed[fields[i].name].size === 0) return null
  }
  return parsed
}

function cronMatches(cron, date) {
  const m = date.getMinutes()
  const h = date.getHours()
  const d = date.getDate()
  const mo = date.getMonth() + 1
  const dow = date.getDay()
  if (!cron.minute.has(m)) return false
  if (!cron.hour.has(h)) return false
  if (!cron.month.has(mo)) return false
  const domRestricted = !cron.dom.has(-1) && cron.dom.size < 31
  const dowRestricted = cron.dow.size < 7
  if (domRestricted && dowRestricted) {
    if (!cron.dom.has(d) && !cron.dow.has(dow)) return false
  } else {
    if (!cron.dom.has(d)) return false
    if (!cron.dow.has(dow)) return false
  }
  return true
}

function findNextExecutions(cron, from, count) {
  const results = []
  const start = new Date(from)
  start.setSeconds(0)
  start.setMilliseconds(0)
  start.setMinutes(start.getMinutes() + 1)
  let current = new Date(start)
  let iterations = 0
  const maxIterations = count * 1440 * 31
  while (results.length < count && iterations < maxIterations) {
    if (cronMatches(cron, current)) {
      results.push(new Date(current))
    }
    current = new Date(current.getTime() + 60000)
    iterations++
  }
  return results
}

function getMonthCalendarData(year, month, cron) {
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDow = new Date(year, month, 1).getDay()
  const runDays = new Set()
  if (cron) {
    for (let d = 1; d <= daysInMonth; d++) {
      const testDate = new Date(year, month, d, 0, 0, 0)
      for (let min = 0; min < 1440; min++) {
        testDate.setMinutes(min)
        if (cronMatches(cron, testDate)) {
          runDays.add(d)
          break
        }
      }
    }
  }
  return { daysInMonth, firstDow, runDays }
}

export default function CronScheduleTimelinePage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [expr, setExpr] = useState('0 9 * * 1-5')
  const [sidebarWidth, setSidebarWidth] = useState(240)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)')
    const onMq = () => setSidebarWidth(mq.matches ? 0 : 240)
    onMq()
    mq.addEventListener('change', onMq)
    return () => mq.removeEventListener('change', onMq)
  }, [])

  const cron = useMemo(() => {
    if (!expr.trim()) return null
    return parseCronExpression(expr.trim())
  }, [expr])

  const nextRuns = useMemo(() => {
    if (!cron) return []
    return findNextExecutions(cron, new Date(), 50)
  }, [cron])

  const now = useMemo(() => new Date(), [])

  const calendarData = useMemo(() => {
    return getMonthCalendarData(now.getFullYear(), now.getMonth(), cron)
  }, [now, cron])

  const monthName = useMemo(() => {
    return t.months[now.getMonth()]
  }, [now, t])

  const tableColumns = useMemo(() => [
    {
      title: t.colDate,
      dataIndex: 'dateStr',
      key: 'dateStr',
      width: 130,
    },
    {
      title: t.colTime,
      dataIndex: 'timeStr',
      key: 'timeStr',
      width: 80,
      render: (v) => <Text code>{v}</Text>,
    },
    {
      title: t.colDow,
      dataIndex: 'dow',
      key: 'dow',
      width: 60,
    },
    {
      title: t.colCronDay,
      dataIndex: 'cronDom',
      key: 'cronDom',
      width: 60,
      render: (v) => <Tag style={{ margin: 0 }}>{v}</Tag>,
    },
    {
      title: t.colCronMonth,
      dataIndex: 'cronMonth',
      key: 'cronMonth',
      width: 70,
      render: (v) => <Tag style={{ margin: 0 }}>{v}</Tag>,
    },
    {
      title: t.colCronDow,
      dataIndex: 'cronDow',
      key: 'cronDow',
      width: 60,
      render: (v) => <Tag style={{ margin: 0 }}>{v}</Tag>,
    },
  ], [t])

  const tableData = useMemo(() => {
    return nextRuns.map((d, i) => ({
      key: i,
      dateStr: d.toLocaleDateString(lang === 'pt' ? 'pt-BR' : 'en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }),
      timeStr: d.toLocaleTimeString(lang === 'pt' ? 'pt-BR' : 'en-US', { hour: '2-digit', minute: '2-digit', hour12: lang === 'en' }),
      dow: t.weekdays[d.getDay()],
      cronDom: d.getDate(),
      cronMonth: t.months[d.getMonth()].slice(0, 3),
      cronDow: t.weekdays[d.getDay()],
    }))
  }, [nextRuns, lang, t])

  const calendarWeekDays = useMemo(() => t.weekdays, [t])

  const calendarGrid = useMemo(() => {
    const cells = []
    for (let i = 0; i < calendarData.firstDow; i++) {
      cells.push({ key: `empty-${i}`, empty: true })
    }
    for (let d = 1; d <= calendarData.daysInMonth; d++) {
      cells.push({
        key: `day-${d}`,
        day: d,
        hasRun: calendarData.runDays.has(d),
        isToday: d === now.getDate(),
      })
    }
    return cells
  }, [calendarData, now])

  const calendarStyle = useMemo(() => ({
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: 4,
    width: '100%',
    maxWidth: 420,
  }), [])

  return (
    <Space direction="vertical" size="large" style={{ width: '100%', maxWidth: 900, margin: '0 auto', padding: sidebarWidth > 0 ? '0 16px' : '0 8px' }}>
      <div>
        <Title level={2}>
          <FieldTimeOutlined style={{ marginRight: 8 }} />
          {t.title}
        </Title>
        <Paragraph type="secondary">{t.intro}</Paragraph>
      </div>

      <Card>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div>
            <Text strong style={{ display: 'block', marginBottom: 4 }}>{t.inputLabel}</Text>
            <Input
              size="large"
              value={expr}
              onChange={(e) => setExpr(e.target.value)}
              placeholder={t.inputPlaceholder}
              style={{ fontFamily: 'monospace', fontSize: 16, maxWidth: 400 }}
            />
          </div>

          <div>
            <Text type="secondary" style={{ display: 'block', marginBottom: 6 }}>{t.presets}</Text>
            <Space size={[6, 6]} wrap>
              {PRESETS.map((p) => (
                <Tooltip key={p.label} title={p.desc[lang]}>
                  <Tag
                    key={p.label}
                    style={{ cursor: 'pointer', fontFamily: 'monospace' }}
                    color={expr === p.label ? 'blue' : undefined}
                    onClick={() => setExpr(p.label)}
                  >
                    {p.label}
                  </Tag>
                </Tooltip>
              ))}
            </Space>
          </div>

          {!cron && expr.trim() && (
            <Alert type="error" message={t.invalid} showIcon />
          )}
        </Space>
      </Card>

      {cron && (
        <>
          <Card title={<><ClockCircleOutlined style={{ marginRight: 6 }} />{t.nextRuns}</>}>
            {tableData.length === 0 ? (
              <Empty description={t.noRuns} />
            ) : (
              <Table
                columns={tableColumns}
                dataSource={tableData}
                size="small"
                pagination={false}
                scroll={{ y: 400 }}
                style={{ fontSize: 13 }}
              />
            )}
          </Card>

          <Card title={<><CalendarOutlined style={{ marginRight: 6 }} />{t.calendarTitle} — {monthName} {now.getFullYear()}</>}>
            <Paragraph type="secondary" style={{ marginBottom: 12 }}>{t.calendarNote}</Paragraph>
            <div style={calendarStyle}>
              {calendarWeekDays.map((d) => (
                <div key={d} style={{ textAlign: 'center', fontWeight: 600, fontSize: 12, color: '#666', padding: '4px 0' }}>
                  {d}
                </div>
              ))}
              {calendarGrid.map((cell) => {
                if (cell.empty) return <div key={cell.key} />
                return (
                  <Tooltip
                    key={cell.key}
                    title={cell.hasRun ? `${cell.day} — runs scheduled` : undefined}
                  >
                    <div
                      style={{
                        textAlign: 'center',
                        padding: '6px 2px',
                        borderRadius: 6,
                        fontSize: 13,
                        fontWeight: cell.isToday ? 700 : 400,
                        border: cell.isToday ? '2px solid #1677ff' : '1px solid transparent',
                        background: cell.hasRun ? '#f6ffed' : 'transparent',
                        color: cell.hasRun ? '#389e0d' : '#333',
                        cursor: cell.hasRun ? 'default' : undefined,
                      }}
                    >
                      {cell.day}
                      {cell.hasRun && (
                        <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#52c41a', margin: '2px auto 0' }} />
                      )}
                    </div>
                  </Tooltip>
                )
              })}
            </div>
          </Card>
        </>
      )}
    </Space>
  )
}
