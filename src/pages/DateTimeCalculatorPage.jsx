import React, { useCallback, useMemo, useState } from 'react'
import { Typography, Card, Space, DatePicker, InputNumber, Select, Segmented, Button, Alert, Descriptions, Collapse, Tag, Statistic, message } from 'antd'
import { FieldTimeOutlined, SwapOutlined, PlusOutlined, MinusOutlined, CopyOutlined, CalculatorOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { useLanguage } from '../i18n/LanguageContext'
import {
  UNITS,
  toLocalInputValue,
  parseLocalInput,
  nowLocalInputValue,
  diffCalendar,
  diffTotals,
  addDuration,
  formatDurationBreakdown,
  formatTotals,
  prettySign,
} from '../utils/dateTimeCalculator'

const { Title, Paragraph, Text } = Typography

const MODE_KEYS = ['diff', 'add']

const PRESETS = [
  { key: 'now', offset: [0, 'second'] },
  { key: 'tomorrow', offset: [1, 'day'] },
  { key: 'nextWeek', offset: [1, 'week'] },
  { key: 'nextMonth', offset: [1, 'month'] },
  { key: 'nextYear', offset: [1, 'year'] },
]

const ADD_PRESETS = [
  { key: 'plus1d', value: 1, unit: 'day' },
  { key: 'plus7d', value: 7, unit: 'day' },
  { key: 'plus30d', value: 30, unit: 'day' },
  { key: 'plus1h', value: 1, unit: 'hour' },
  { key: 'minus1h', value: -1, unit: 'hour' },
  { key: 'minus1d', value: -1, unit: 'day' },
]

const translations = {
  pt: {
    title: 'Calculadora de Data e Hora',
    intro: (
      <>
        Calcula a <Text strong>diferença entre duas datas</Text> em várias unidades
        (anos, meses, dias, horas, minutos, segundos e totais) ou{' '}
        <Text strong>adiciona/subtrai um intervalo</Text> de uma data. Tudo roda
        com <Text code>dayjs</Text> no navegador — nenhuma informação sai da máquina.
      </>
    ),
    alertTitle: 'Por que essa calculadora?',
    alertBody: (
      <>
        Diferenças de data têm duas visões: a <Text strong>calendária</Text>{' '}
        ("1 ano, 2 meses e 5 dias") e a <Text strong>total</Text>{' '}
        ("428 dias"). A primeira respeita meses de tamanhos diferentes; a segunda
        é a duração brisa em milissegundos. Use a que fizer sentido pro seu caso.
      </>
    ),
    mode: 'Modo',
    modeDiff: 'Diferença entre datas',
    modeAdd: 'Adicionar / subtrair',
    start: 'Data inicial',
    end: 'Data final',
    base: 'Data base',
    swap: 'Trocar datas',
    duration: 'Intervalo',
    value: 'Valor',
    unit: 'Unidade',
    presets: 'Presets',
    result: 'Resultado',
    calendarDiff: 'Diferença calendárica',
    totalDiff: 'Diferença total',
    resultDate: 'Data resultante',
    copy: 'Copiar resultado',
    copied: 'Copiado',
    copyErr: 'Falha ao copiar',
    future: 'depois',
    past: 'antes',
    same: 'mesmo instante',
    year: 'ano',
    years: 'anos',
    month: 'mês',
    months: 'meses',
    week: 'semana',
    weeks: 'semanas',
    day: 'dia',
    days: 'dias',
    hour: 'hora',
    hours: 'horas',
    minute: 'minuto',
    minutes: 'minutos',
    second: 'segundo',
    seconds: 'segundos',
    ms: 'milissegundos',
    secondsTotal: 'segundos no total',
    minutesTotal: 'minutos no total',
    hoursTotal: 'horas no total',
    daysTotal: 'dias no total',
    weeksTotal: 'semanas no total',
    empty: '—',
    sourceTitle: 'Algoritmo-fonte',
    now: 'Agora',
    tomorrow: 'Amanhã',
    nextWeek: 'Próxima semana',
    nextMonth: 'Próximo mês',
    nextYear: 'Próximo ano',
    plus1d: '+1 dia',
    plus7d: '+7 dias',
    plus30d: '+30 dias',
    plus1h: '+1 hora',
    minus1h: '−1 hora',
    minus1d: '−1 dia',
  },
  en: {
    title: 'Date & Time Calculator',
    intro: (
      <>
        Computes the <Text strong>difference between two dates</Text> in several
        units (years, months, days, hours, minutes, seconds and totals) or{' '}
        <Text strong>adds/subtracts an interval</Text> from a date. Everything runs
        with <Text code>dayjs</Text> in the browser — no data leaves your machine.
      </>
    ),
    alertTitle: 'Why this calculator?',
    alertBody: (
      <>
        Date differences have two views: <Text strong>calendar</Text>{' '}
        ("1 year, 2 months and 5 days") and <Text strong>total</Text>{' '}
        ("428 days"). The former respects months of different lengths; the latter
        is the raw duration in milliseconds. Use whichever fits your use case.
      </>
    ),
    mode: 'Mode',
    modeDiff: 'Difference between dates',
    modeAdd: 'Add / subtract',
    start: 'Start date',
    end: 'End date',
    base: 'Base date',
    swap: 'Swap dates',
    duration: 'Interval',
    value: 'Value',
    unit: 'Unit',
    presets: 'Presets',
    result: 'Result',
    calendarDiff: 'Calendar difference',
    totalDiff: 'Total difference',
    resultDate: 'Resulting date',
    copy: 'Copy result',
    copied: 'Copied',
    copyErr: 'Copy failed',
    future: 'after',
    past: 'before',
    same: 'same instant',
    year: 'year',
    years: 'years',
    month: 'month',
    months: 'months',
    week: 'week',
    weeks: 'weeks',
    day: 'day',
    days: 'days',
    hour: 'hour',
    hours: 'hours',
    minute: 'minute',
    minutes: 'minutes',
    second: 'second',
    seconds: 'seconds',
    ms: 'milliseconds',
    secondsTotal: 'seconds in total',
    minutesTotal: 'minutes in total',
    hoursTotal: 'hours in total',
    daysTotal: 'days in total',
    weeksTotal: 'weeks in total',
    empty: '—',
    sourceTitle: 'Source algorithm',
    now: 'Now',
    tomorrow: 'Tomorrow',
    nextWeek: 'Next week',
    nextMonth: 'Next month',
    nextYear: 'Next year',
    plus1d: '+1 day',
    plus7d: '+7 days',
    plus30d: '+30 days',
    plus1h: '+1 hour',
    minus1h: '−1 hour',
    minus1d: '−1 day',
  },
}

export default function DateTimeCalculatorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [messageApi, messageContextHolder] = message.useMessage()

  const [mode, setMode] = useState('diff')
  const [start, setStart] = useState(dayjs())
  const [end, setEnd] = useState(dayjs().add(1, 'day'))
  const [base, setBase] = useState(dayjs())
  const [addValue, setAddValue] = useState(1)
  const [addUnit, setAddUnit] = useState('day')

  const calendarDiff = useMemo(() => diffCalendar(start, end), [start.valueOf(), end.valueOf()])
  const totals = useMemo(() => diffTotals(start, end), [start.valueOf(), end.valueOf()])
  const addedDate = useMemo(() => addDuration(base, addValue, addUnit), [base.valueOf(), addValue, addUnit])

  const applyPreset = useCallback(
    (key) => {
      const preset = PRESETS.find((p) => p.key === key)
      if (!preset) return
      const [value, unit] = preset.offset
      if (mode === 'diff') {
        setStart(dayjs())
        setEnd(dayjs().add(value, unit))
      } else {
        setBase(dayjs())
        setAddValue(value)
        setAddUnit(unit)
      }
    },
    [mode]
  )

  const applyAddPreset = useCallback((p) => {
    setAddValue(p.value)
    setAddUnit(p.unit)
  }, [])

  const swapDates = useCallback(() => {
    setStart(end)
    setEnd(start)
  }, [start, end])

  const copyResult = useCallback(async () => {
    try {
      let text = ''
      if (mode === 'diff') {
        const signText = prettySign(calendarDiff.sign, t)
        text = `${toLocalInputValue(start)} → ${toLocalInputValue(end)}\n${t.calendarDiff}: ${formatDurationBreakdown(calendarDiff, t)} (${signText})\n${t.totalDiff}: ${formatTotals(totals, t)}`
      } else {
        text = `${toLocalInputValue(base)} ${addValue >= 0 ? '+' : ''}${addValue} ${addUnit} = ${toLocalInputValue(addedDate)}`
      }
      await navigator.clipboard.writeText(text)
      messageApi.success(t.copied)
    } catch {
      messageApi.error(t.copyErr)
    }
  }, [mode, start, end, base, addValue, addUnit, addedDate, calendarDiff, totals, t, messageApi])

  const modeOptions = useMemo(
    () => [
      { value: 'diff', label: t.modeDiff },
      { value: 'add', label: t.modeAdd },
    ],
    [t]
  )

  const unitOptions = useMemo(
    () =>
      UNITS.map((u) => ({
        value: u,
        label: t[`${u}s`],
      })),
    [t]
  )

  const source = useMemo(
    () => `function diffCalendar(start, end) {
  // garante start <= end e guarda o sinal
  let a = start, b = end, sign = 1
  if (a.isAfter(b)) { [a, b] = [b, a]; sign = -1 }

  // quebra calendárica: anos → meses → dias → horas → minutos → segundos
  const years = b.diff(a, 'year')
  a = a.add(years, 'year')
  const months = b.diff(a, 'month')
  a = a.add(months, 'month')
  const days = b.diff(a, 'day')
  a = a.add(days, 'day')
  const hours = b.diff(a, 'hour')
  a = a.add(hours, 'hour')
  const minutes = b.diff(a, 'minute')
  a = a.add(minutes, 'minute')
  const seconds = b.diff(a, 'second')
  return { sign, years, months, days, hours, minutes, seconds }
}

function diffTotals(start, end) {
  const ms = Math.abs(end.diff(start))
  return {
    ms,
    seconds: ms / 1000,
    minutes: ms / 60000,
    hours: ms / 3600000,
    days: ms / 86400000,
    weeks: ms / 604800000,
  }
}

function addDuration(base, value, unit) {
  return base.add(value, unit) // dayjs lida com valores negativos (subtração)
}`,
    []
  )

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {messageContextHolder}
      <Title level={2}><CalculatorOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Alert type="info" showIcon message={t.alertTitle} description={t.alertBody} />

      <Card>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Space wrap align="center">
            <Text strong>{t.mode}:</Text>
            <Segmented options={modeOptions} value={mode} onChange={setMode} />
          </Space>

          {mode === 'diff' ? (
            <Space wrap align="end" size="large">
              <div>
                <Text strong>{t.start}</Text>
                <div>
                  <DatePicker
                    showTime
                    value={start}
                    onChange={(v) => v && setStart(v)}
                    format="DD/MM/YYYY HH:mm"
                    style={{ width: 220 }}
                  />
                </div>
              </div>
              <Button icon={<SwapOutlined />} onClick={swapDates}>{t.swap}</Button>
              <div>
                <Text strong>{t.end}</Text>
                <div>
                  <DatePicker
                    showTime
                    value={end}
                    onChange={(v) => v && setEnd(v)}
                    format="DD/MM/YYYY HH:mm"
                    style={{ width: 220 }}
                  />
                </div>
              </div>
            </Space>
          ) : (
            <Space wrap align="end" size="large">
              <div>
                <Text strong>{t.base}</Text>
                <div>
                  <DatePicker
                    showTime
                    value={base}
                    onChange={(v) => v && setBase(v)}
                    format="DD/MM/YYYY HH:mm"
                    style={{ width: 220 }}
                  />
                </div>
              </div>
              <Space align="end">
                <div>
                  <Text strong>{t.value}</Text>
                  <div>
                    <InputNumber
                      value={addValue}
                      onChange={setAddValue}
                      style={{ width: 90 }}
                    />
                  </div>
                </div>
                <div>
                  <Text strong>{t.unit}</Text>
                  <div>
                    <Select
                      value={addUnit}
                      onChange={setAddUnit}
                      options={unitOptions}
                      style={{ width: 130 }}
                    />
                  </div>
                </div>
              </Space>
            </Space>
          )}

          <Space wrap size="small">
            <Text type="secondary">{t.presets}:</Text>
            {PRESETS.map((p) => (
              <Tag
                key={p.key}
                color="default"
                style={{ cursor: 'pointer' }}
                onClick={() => applyPreset(p.key)}
              >
                {t[p.key]}
              </Tag>
            ))}
            {mode === 'add' &&
              ADD_PRESETS.map((p) => (
                <Tag
                  key={p.key}
                  color="default"
                  style={{ cursor: 'pointer' }}
                  onClick={() => applyAddPreset(p)}
                >
                  {t[p.key]}
                </Tag>
              ))}
          </Space>
        </Space>
      </Card>

      <Card
        title={
          <Space>
            <FieldTimeOutlined />
            {t.result}
          </Space>
        }
        extra={
          <Button size="small" icon={<CopyOutlined />} onClick={copyResult}>
            {t.copy}
          </Button>
        }
      >
        {mode === 'diff' ? (
          <Descriptions bordered size="small" column={1}>
            <Descriptions.Item label={t.calendarDiff}>
              <Space wrap>
                <Text strong style={{ fontSize: 16 }}>
                  {formatDurationBreakdown(calendarDiff, t)}
                </Text>
                <Tag color={calendarDiff.sign > 0 ? 'blue' : calendarDiff.sign < 0 ? 'orange' : 'default'}>
                  {prettySign(calendarDiff.sign, t)}
                </Tag>
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label={t.totalDiff}>
              <Text code>{formatTotals(totals, t)}</Text>
            </Descriptions.Item>
          </Descriptions>
        ) : (
          <Descriptions bordered size="small" column={1}>
            <Descriptions.Item label={t.resultDate}>
              <Text strong style={{ fontSize: 16 }}>
                {addedDate.format('DD/MM/YYYY HH:mm:ss')}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label={t.duration}>
              <Text code>
                {addValue >= 0 ? '+' : ''}{addValue} {t[`${addUnit}s`]}
              </Text>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Card>

      <Collapse
        items={[
          {
            key: 'src',
            label: t.sourceTitle,
            children: (
              <pre
                style={{
                  margin: 0,
                  fontSize: 12.5,
                  lineHeight: 1.6,
                  background: '#f5f5f5',
                  padding: 12,
                  borderRadius: 6,
                  overflowX: 'auto',
                }}
              >
                {source}
              </pre>
            ),
          },
        ]}
      />
    </Space>
  )
}
