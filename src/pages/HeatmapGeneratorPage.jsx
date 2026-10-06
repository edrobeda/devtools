import React, { useMemo, useState } from 'react'
import {
  Typography,
  Card,
  Space,
  Input,
  Select,
  Button,
  Tag,
  Statistic,
  Row,
  Col,
  Alert,
  Empty,
  Tooltip,
  Segmented,
} from 'antd'
import {
  CalendarOutlined,
  ReloadOutlined,
  ThunderboltOutlined,
  FireOutlined,
  RiseOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

// ─── Datas e grid ────────────────────────────────────────────────
// Recebe um ano e devolve um array de "cells" para o grid de 53x7
// (estilo GitHub contribution). Cada cell tem { date, iso, count,
// level (0-3), inYear, future }. O grid começa no domingo anterior
// (ou igual) ao 1º de janeiro e cobre 53 semanas completas — assim o
// 1º de janeiro sempre cai na coluna certa sem precisar de lógica de
// fuso horário (todas as datas são "meio-dia local" para evitar o
// bug clássico de horário de verão).
function startOfYear(year) {
  return new Date(year, 0, 1)
}

function daysInYear(year) {
  const start = startOfYear(year)
  const end = new Date(year + 1, 0, 1)
  return Math.round((end - start) / 86400000)
}

function dateKey(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function parseDate(s) {
  if (!s) return null
  const trimmed = s.trim()
  if (!trimmed) return null
  // Aceita YYYY-MM-DD, YYYY/MM/DD, DD/MM/YYYY, MM/DD/YYYY (com heurística)
  let m = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/)
  if (m) {
    const y = Number(m[1])
    const mo = Number(m[2])
    const d = Number(m[3])
    if (mo >= 1 && mo <= 12 && d >= 1 && d <= 31) return new Date(y, mo - 1, d)
    return null
  }
  m = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/)
  if (m) {
    const a = Number(m[1])
    const b = Number(m[2])
    const y = Number(m[3])
    // Heurística: se o primeiro número > 12, é DD/MM; senão vira DD/MM
    // (PT/BR antes que US, como no resto do devtools).
    if (a > 12 && b >= 1 && b <= 12) {
      const d = a
      const mo = b
      if (d >= 1 && d <= 31) return new Date(y, mo - 1, d)
    } else if (a >= 1 && a <= 12 && b >= 1 && b <= 31) {
      // DD/MM/YYYY quando possível; cai pra MM/DD/YYYY se DD > 12.
      const d = b > 12 ? a : b
      const mo = b > 12 ? b : a
      return new Date(y, mo - 1, d)
    }
    return null
  }
  // ISO completo (com hora)
  const d = new Date(trimmed)
  if (!Number.isNaN(d.getTime())) return d
  return null
}

function buildGrid(year) {
  const cells = []
  const first = startOfYear(year)
  const offset = first.getDay() // 0=Sun..6=Sat
  // O grid começa `offset` dias antes do 1º de janeiro.
  const gridStart = new Date(first)
  gridStart.setDate(first.getDate() - offset)
  const today = new Date()
  const todayKey = dateKey(today)
  const total = 53 * 7
  for (let i = 0; i < total; i++) {
    const d = new Date(gridStart)
    d.setDate(gridStart.getDate() + i)
    const k = dateKey(d)
    cells.push({
      date: new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12),
      iso: k,
      year: d.getFullYear(),
      month: d.getMonth(),
      day: d.getDate(),
      weekday: d.getDay(),
      inYear: d.getFullYear() === year,
      future: k > todayKey,
    })
  }
  return cells
}

// Buckets de intensidade (0=nada, 1=pouco, 2=médio, 3=bastante, 4=intenso).
// Calculado a partir dos counts reais com quebras por quartis — melhor do
// que threshold fixo, porque o usuário cola datasets com magnitudes
// diferentes (10 eventos/dia vs 10000/dia) e o heatmap precisa ser legível
// em ambos.
function bucketize(counts) {
  const values = Object.values(counts).filter((v) => v > 0).sort((a, b) => a - b)
  if (values.length === 0) return () => 0
  const q1 = values[Math.floor(values.length * 0.25)] || values[0]
  const q2 = values[Math.floor(values.length * 0.5)] || values[0]
  const q3 = values[Math.floor(values.length * 0.75)] || values[values.length - 1]
  return (count) => {
    if (count <= 0) return 0
    if (count <= q1) return 1
    if (count <= q2) return 2
    if (count <= q3) return 3
    return 4
  }
}

// ─── Parser de input ─────────────────────────────────────────────
// Aceita:
//   - uma data por linha (com ou sem hora)
//   - CSV com cabeçalho onde a primeira coluna é data e uma coluna
//     numérica opcional (count/contagem/qty/valor) determina a
//     intensidade de cada célula.
function parseInput(raw, delimiter) {
  const counts = {}
  const lines = raw.split(/\r?\n/)
  let dateColumnIndex = 0
  let countColumnIndex = -1
  let hasHeader = false
  let parsedLines = 0
  let skipped = 0

  // Detecta cabeçalho na primeira linha (contém palavras-chave conhecidas).
  const firstLine = lines[0] || ''
  const firstCells = firstLine.split(delimiter).map((c) => c.trim().toLowerCase())
  const dateColumnNames = ['date', 'day', 'data', 'timestamp', 'created_at', 'createdat', 'occurred_at', 'iso', 'time']
  const countColumnNames = ['count', 'contagem', 'qty', 'quantity', 'valor', 'value', 'amount', 'total', 'weight']
  if (firstCells.some((c) => dateColumnNames.includes(c))) {
    hasHeader = true
    dateColumnIndex = firstCells.findIndex((c) => dateColumnNames.includes(c))
    countColumnIndex = firstCells.findIndex((c) => countColumnNames.includes(c))
  }

  const startIdx = hasHeader ? 1 : 0
  for (let i = startIdx; i < lines.length; i++) {
    const line = lines[i]
    if (!line || !line.trim()) continue
    const cells = line.split(delimiter).map((c) => c.trim())
    if (cells.length === 0) continue
    const dateStr = cells[dateColumnIndex] ?? cells[0]
    const date = parseDate(dateStr)
    if (!date) {
      skipped++
      continue
    }
    const k = dateKey(date)
    let count = 1
    if (countColumnIndex >= 0 && cells[countColumnIndex] != null) {
      const n = Number(cells[countColumnIndex])
      if (Number.isFinite(n) && n >= 0) count = n
    }
    counts[k] = (counts[k] || 0) + count
    parsedLines++
  }
  return { counts, parsedLines, skipped, hasHeader }
}

function findStreaks(counts) {
  // longest = maior seq de dias consecutivos com count > 0
  // current = streak atual terminada em hoje/ontem
  const keys = Object.keys(counts).filter((k) => counts[k] > 0).sort()
  if (keys.length === 0) return { longest: 0, current: 0 }
  let longest = 1
  let run = 1
  for (let i = 1; i < keys.length; i++) {
    const prev = new Date(keys[i - 1])
    const cur = new Date(keys[i])
    if ((cur - prev) === 86400000) {
      run++
      longest = Math.max(longest, run)
    } else {
      run = 1
    }
  }
  // current: começa em hoje, anda pra trás contando
  const today = new Date()
  today.setHours(12, 0, 0, 0)
  let cur = 0
  const probe = new Date(today)
  // se hoje não tem evento, começa em ontem
  if (!counts[dateKey(probe)]) probe.setDate(probe.getDate() - 1)
  while (counts[dateKey(probe)] > 0) {
    cur++
    probe.setDate(probe.getDate() - 1)
  }
  return { longest, current: cur }
}

const MONTH_NAMES_PT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
const MONTH_NAMES_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const WEEKDAY_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const WEEKDAY_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const SAMPLE_INPUT = `2026-01-04,3
2026-01-07
2026-01-08,2
2026-01-09
2026-01-12,5
2026-01-13
2026-01-15,4
2026-01-19
2026-01-22,2
2026-02-01
2026-02-02,3
2026-02-05
2026-02-10,6
2026-03-03
2026-03-15,2
2026-04-02
2026-04-10
2026-04-22,4
2026-05-05
2026-05-15,2
2026-06-01
2026-06-08
2026-06-22,3
2026-07-04
2026-07-15
2026-08-01,2
2026-08-15
2026-09-01
2026-09-15,4
2026-10-01
2026-10-02
2026-10-03
2026-10-04
2026-10-05`

const translations = {
  pt: {
    title: 'Gerador de Heatmap de Calendário',
    intro: 'Cole uma lista de datas (uma por linha, com ou sem contagem) e veja um heatmap estilo contribution graph do GitHub — útil pra visualizar a frequência de commits, logins, deploys, exercícios, leituras ou qualquer evento datado. O eixo são quartis calculados a partir dos próprios dados, então datasets com magnitudes diferentes (10/dia ou 10.000/dia) ficam legíveis.',
    inputTitle: 'Dados',
    inputPlaceholder: 'Cole aqui uma data por linha, ou CSV com cabeçalho (date, count)…',
    sample: 'Aplicar exemplo',
    clear: 'Limpar',
    configTitle: 'Configuração',
    delimiterLabel: 'Delimitador CSV',
    delimiterAuto: 'Auto',
    delimiterComma: 'Vírgula ,',
    delimiterSemicolon: 'Ponto-e-vírgula ;',
    delimiterTab: 'Tabulação',
    yearLabel: 'Ano',
    previousYear: '← Ano anterior',
    nextYear: 'Próximo ano →',
    statsTitle: 'Estatísticas',
    totalEvents: 'Total de eventos',
    activeDays: 'Dias com atividade',
    avgPerActive: 'Bens/dia ativo',
    busiestDay: 'Pico em um dia',
    longestStreak: 'Maior sequência',
    currentStreak: 'Sequência atual',
    calendarTitle: 'Calendário',
    calendarNote: 'Cada célula é um dia. Cinza = sem evento. Cores mais escuras = mais quartis.',
    legendTitle: 'Legenda',
    legendLess: 'menos',
    legendMore: 'mais',
    summaryTitle: 'Resumo',
    summaryEmpty: 'Sem eventos no ano selecionado.',
    summary: (year, days, total, busiest, longest, current) =>
      `Em ${year}, ${days} ${days === 1 ? 'dia teve' : 'dias tiveram'} atividade (${total} eventos no ano). Maior sequência: ${longest} ${longest === 1 ? 'dia' : 'dias'}. Sequência atual: ${current}.`,
    tooltips: {
      date: (iso, count, weekday) => `${count} evento${count !== 1 ? 's' : ''} em ${weekday}, ${iso}`,
    },
    weekdayLabels: WEEKDAY_PT,
    monthLabels: MONTH_NAMES_PT,
    inputHelpTitle: 'Como funciona o input',
    inputHelp: (
      <>
        Cole uma data por linha (qualquer formato razoável: <Text code>YYYY-MM-DD</Text>,
        <Text code>YYYY/MM/DD</Text>, <Text code>DD/MM/YYYY</Text>, ou ISO completo com hora). Para
        intensidade por contagem, use CSV com cabeçalho — a primeira coluna é a data, e qualquer
        coluna chamada <Text code>count</Text>, <Text code>qty</Text>, <Text code>valor</Text>,
        <Text code>weight</Text> etc. é usada como peso.
      </>
    ),
    noEvents: 'Nenhum evento válido encontrado — confira o formato das datas.',
    skipped: (n) => `${n} linha${n !== 1 ? 's' : ''} ignorada${n !== 1 ? 's' : ''} (data inválida)`,
  },
  en: {
    title: 'Calendar Heatmap Generator',
    intro: 'Paste a list of dates (one per line, with or without a count) and see a GitHub-style contribution heatmap — handy to visualize the frequency of commits, logins, deploys, workouts, reading or any dated event. Levels are computed from your data via quartiles, so datasets with very different magnitudes (10/day or 10,000/day) stay legible.',
    inputTitle: 'Data',
    inputPlaceholder: 'Paste one date per line, or CSV with header (date, count)…',
    sample: 'Apply sample',
    clear: 'Clear',
    configTitle: 'Configuration',
    delimiterLabel: 'CSV delimiter',
    delimiterAuto: 'Auto',
    delimiterComma: 'Comma ,',
    delimiterSemicolon: 'Semicolon ;',
    delimiterTab: 'Tab',
    yearLabel: 'Year',
    previousYear: '← Previous year',
    nextYear: 'Next year →',
    statsTitle: 'Statistics',
    totalEvents: 'Total events',
    activeDays: 'Active days',
    avgPerActive: 'Avg per active day',
    busiestDay: 'Busiest single day',
    longestStreak: 'Longest streak',
    currentStreak: 'Current streak',
    calendarTitle: 'Calendar',
    calendarNote: 'Each cell is one day. Gray = no event. Darker tones mean more quartiles.',
    legendTitle: 'Legend',
    legendLess: 'less',
    legendMore: 'more',
    summaryTitle: 'Summary',
    summaryEmpty: 'No events in the selected year.',
    summary: (year, days, total, busiest, longest, current) =>
      `In ${year}, ${days} ${days === 1 ? 'day was' : 'days were'} active (${total} events that year). Longest streak: ${longest} ${longest === 1 ? 'day' : 'days'}. Current streak: ${current}.`,
    tooltips: {
      date: (iso, count, weekday) => `${count} event${count !== 1 ? 's' : ''} on ${weekday}, ${iso}`,
    },
    weekdayLabels: WEEKDAY_EN,
    monthLabels: MONTH_NAMES_EN,
    inputHelpTitle: 'Input format',
    inputHelp: (
      <>
        Paste one date per line (any reasonable format: <Text code>YYYY-MM-DD</Text>,
        <Text code>YYYY/MM/DD</Text>, <Text code>DD/MM/YYYY</Text>, or full ISO with time). For
        weighted intensity use CSV with a header — first column is the date and any column named
        <Text code>count</Text>, <Text code>qty</Text>, <Text code>value</Text>,
        <Text code>weight</Text> etc. is used as the weight.
      </>
    ),
    noEvents: 'No valid events found — check the date format.',
    skipped: (n) => `${n} line${n === 1 ? '' : 's'} skipped (invalid date)`,
  },
}

const LEVEL_COLORS = [
  '#ebedf0', // 0 = sem evento
  '#9be9a8', // 1 = pouco
  '#40c463', // 2 = médio
  '#30a14e', // 3 = bastante
  '#216e39', // 4 = intenso
]

const LEVEL_COLORS_DARK = [
  '#161b22',
  '#0e4429',
  '#006d32',
  '#26a641',
  '#39d353',
]

export default function HeatmapGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const currentYear = useMemo(() => new Date().getFullYear(), [])
  const [rawInput, setRawInput] = useState('')
  const [delimiter, setDelimiter] = useState('auto')
  const [year, setYear] = useState(currentYear)
  const [theme, setTheme] = useState('light')

  // Parse único — recalcula quando o input ou o delimiter mudam.
  const parsed = useMemo(() => {
    if (!rawInput.trim()) return { counts: {}, parsedLines: 0, skipped: 0, hasHeader: false }
    let d = delimiter
    if (delimiter === 'auto') {
      // Heurística: se aparece mais ; do que , na primeira linha não-vazia, usa ;
      const firstLine = rawInput.split('\n').find((l) => l.trim()) || ''
      const semis = (firstLine.match(/;/g) || []).length
      const commas = (firstLine.match(/,/g) || []).length
      if (semis > commas) d = ';'
      else d = ','
    } else if (delimiter === 'tab') {
      d = '\t'
    }
    return parseInput(rawInput, d)
  }, [rawInput, delimiter])

  const levelFn = useMemo(() => bucketize(parsed.counts), [parsed.counts])
  const stats = useMemo(() => {
    const counts = parsed.counts
    let total = 0
    let busiest = 0
    let busiestDate = null
    let activeDays = 0
    for (const [k, v] of Object.entries(counts)) {
      total += v
      if (v > busiest) {
        busiest = v
        busiestDate = k
      }
      activeDays++
    }
    const streaks = findStreaks(counts)
    return { total, busiest, busiestDate, activeDays, avg: activeDays > 0 ? total / activeDays : 0, ...streaks }
  }, [parsed.counts])

  const grid = useMemo(() => buildGrid(year), [year])

  // Cor por célula: paleta light por padrão, dark opcional.
  const palette = theme === 'dark' ? LEVEL_COLORS_DARK : LEVEL_COLORS
  const emptyColor = theme === 'dark' ? '#161b22' : '#ebedf0'
  const futureColor = theme === 'dark' ? '#0d1117' : '#f6f8fa'

  // Labels de mês: pega o primeiro cell de cada mês que aparece no grid.
  const monthMarkers = useMemo(() => {
    const marks = []
    let lastMonth = -1
    grid.forEach((c, idx) => {
      if (!c.inYear) return
      if (c.month !== lastMonth && c.weekday === 0) {
        marks.push({ idx, label: t.monthLabels[c.month] })
        lastMonth = c.month
      } else if (c.month !== lastMonth) {
        marks.push({ idx, label: t.monthLabels[c.month] })
        lastMonth = c.month
      }
    })
    return marks
  }, [grid, t.monthLabels])

  // Bucket visível por célula do grid.
  const cells = useMemo(() => {
    return grid.map((c) => ({
      ...c,
      count: parsed.counts[c.iso] || 0,
      level: c.inYear && !c.future ? levelFn(parsed.counts[c.iso] || 0) : 0,
    }))
  }, [grid, parsed.counts, levelFn])

  const weekdayLabel = (wd) => t.weekdayLabels[wd]

  const handleSample = () => setRawInput(SAMPLE_INPUT)
  const handleClear = () => setRawInput('')

  const summaryText = stats.activeDays > 0
    ? t.summary(year, stats.activeDays, stats.total, stats.busiest, stats.longest, stats.current)
    : t.summaryEmpty

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><CalendarOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card title={t.inputTitle} extra={
        <Space>
          <Button icon={<ThunderboltOutlined />} onClick={handleSample}>{theme === 'dark' ? t.sample : t.sample}</Button>
          <Button icon={<ReloadOutlined />} onClick={handleClear}>{t.clear}</Button>
        </Space>
      }>
        <Input.TextArea
          value={rawInput}
          onChange={(e) => setRawInput(e.target.value)}
          placeholder={t.inputPlaceholder}
          autoSize={{ minRows: 6, maxRows: 14 }}
          style={{ fontFamily: 'monospace', fontSize: 12 }}
        />
        {parsed.skipped > 0 && (
          <Alert
            type="warning"
            showIcon
            style={{ marginTop: 12 }}
            message={t.skipped(parsed.skipped)}
          />
        )}
        <Card type="inner" size="small" style={{ marginTop: 12 }} title={t.inputHelpTitle}>
          <Paragraph type="secondary" style={{ marginBottom: 0 }}>{t.inputHelp}</Paragraph>
        </Card>
      </Card>

      <Card title={t.configTitle}>
        <Row gutter={[16, 16]} wrap>
          <Col xs={24} sm={12} md={8}>
            <Space direction="vertical" size={4} style={{ width: '100%' }}>
              <Text type="secondary">{t.delimiterLabel}</Text>
              <Select
                value={delimiter}
                onChange={setDelimiter}
                style={{ width: '100%' }}
                options={[
                  { value: 'auto', label: t.delimiterAuto },
                  { value: 'comma', label: t.delimiterComma },
                  { value: 'semicolon', label: t.delimiterSemicolon },
                  { value: 'tab', label: t.delimiterTab },
                ]}
              />
            </Space>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Space direction="vertical" size={4} style={{ width: '100%' }}>
              <Text type="secondary">{t.yearLabel}</Text>
              <Input
                type="number"
                value={year}
                onChange={(e) => {
                  const n = Number(e.target.value)
                  if (Number.isFinite(n)) setYear(Math.max(1970, Math.min(2100, Math.trunc(n))))
                }}
                min={1970}
                max={2100}
              />
            </Space>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Space direction="vertical" size={4} style={{ width: '100%' }}>
              <Text type="secondary">{t.legendTitle}</Text>
              <Segmented
                value={theme}
                onChange={setTheme}
                options={[
                  { value: 'light', label: lang === 'pt' ? 'Claro' : 'Light' },
                  { value: 'dark', label: lang === 'pt' ? 'Escuro' : 'Dark' },
                ]}
                block
              />
            </Space>
          </Col>
        </Row>
      </Card>

      <Card title={t.statsTitle}>
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={8} md={4}>
            <Statistic title={t.totalEvents} value={stats.total} />
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Statistic title={t.activeDays} value={stats.activeDays} />
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Statistic
              title={t.avgPerActive}
              value={Number.isFinite(stats.avg) ? stats.avg.toFixed(1) : '0'}
            />
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Statistic
              title={t.busiestDay}
              value={stats.busiest}
              suffix={stats.busiestDate ? <Tag color="green">{stats.busiestDate}</Tag> : null}
            />
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Statistic
              title={t.longestStreak}
              value={stats.longest}
              suffix={<FireOutlined style={{ color: '#fa541c' }} />}
            />
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Statistic
              title={t.currentStreak}
              value={stats.current}
              suffix={<RiseOutlined style={{ color: '#52c41a' }} />}
            />
          </Col>
        </Row>
      </Card>

      <Card title={t.calendarTitle}>
        <Paragraph type="secondary" style={{ marginBottom: 12 }}>{t.calendarNote}</Paragraph>
        {stats.activeDays === 0 ? (
          <Empty description={t.noEvents} />
        ) : (
          <div style={{ overflowX: 'auto', paddingBottom: 8 }}>
            <div style={{ display: 'inline-block', minWidth: 'fit-content' }}>
              {/* Linha de meses */}
              <div style={{ display: 'flex', marginLeft: 30, marginBottom: 4, height: 16, position: 'relative' }}>
                {monthMarkers.map((m, i) => (
                  <span
                    key={i}
                    style={{
                      position: 'absolute',
                      left: m.idx * 13,
                      fontSize: 10,
                      color: '#8c8c8c',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {m.label}
                  </span>
                ))}
              </div>
              {/* Grid de células */}
              <div style={{ display: 'flex', gap: 2 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginRight: 4 }}>
                  {WEEKDAY_PT.map((w, i) => (
                    <div
                      key={w}
                      style={{
                        height: 11,
                        width: 24,
                        fontSize: 9,
                        color: '#8c8c8c',
                        visibility: i % 2 === 1 ? 'visible' : 'hidden',
                        lineHeight: '11px',
                      }}
                    >
                      {t.weekdayLabels[i]}
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 2 }}>
                  {Array.from({ length: 53 }).map((_, weekIdx) => (
                    <div key={weekIdx} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {Array.from({ length: 7 }).map((__, dayIdx) => {
                        const cell = cells[weekIdx * 7 + dayIdx]
                        if (!cell) return <div key={dayIdx} style={{ width: 11, height: 11 }} />
                        const bg = !cell.inYear
                          ? 'transparent'
                          : cell.future
                            ? futureColor
                            : cell.count > 0
                              ? palette[cell.level]
                              : emptyColor
                        const weekdayName = weekdayLabel(cell.weekday)
                        return (
                          <Tooltip
                            key={dayIdx}
                            title={cell.inYear && !cell.future ? t.tooltips.date(cell.iso, cell.count, weekdayName) : `${cell.iso}`}
                          >
                            <div
                              style={{
                                width: 11,
                                height: 11,
                                borderRadius: 2,
                                background: bg,
                                border: cell.inYear ? 'none' : '1px dashed #d9d9d9',
                              }}
                            />
                          </Tooltip>
                        )
                      })}
                    </div>
                  ))}
                </div>
              </div>
              {/* Legenda */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 12, fontSize: 11, color: '#8c8c8c' }}>
                <span>{t.legendLess}</span>
                {palette.map((c, i) => (
                  <span
                    key={i}
                    style={{ width: 11, height: 11, borderRadius: 2, background: c, display: 'inline-block' }}
                  />
                ))}
                <span>{t.legendMore}</span>
              </div>
            </div>
          </div>
        )}
      </Card>

      <Card title={t.summaryTitle} extra={<Tag color="blue"><ClockCircleOutlined /> {year}</Tag>}>
        <Paragraph style={{ marginBottom: 0 }}>{summaryText}</Paragraph>
      </Card>
    </Space>
  )
}