import React, { useMemo, useState } from 'react'
import { Typography, Card, Input, Space, Alert, List, Tag } from 'antd'
import { FieldTimeOutlined } from '@ant-design/icons'

const { Title, Paragraph, Text } = Typography

const FIELD_DEFS = [
  { name: 'minuto', min: 0, max: 59, aliases: {} },
  { name: 'hora', min: 0, max: 23, aliases: {} },
  { name: 'dia do mês', min: 1, max: 31, aliases: {} },
  {
    name: 'mês',
    min: 1,
    max: 12,
    aliases: {
      jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
      jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
    },
  },
  {
    name: 'dia da semana',
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

const WEEKDAY_NAMES = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado']
const MONTH_NAMES = [
  '', 'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
]

function resolveToken(token, def) {
  const lower = token.toLowerCase()
  if (lower in def.aliases) return def.aliases[lower]
  const n = Number(token)
  if (!Number.isInteger(n)) {
    throw new Error(`Valor inválido "${token}" no campo ${def.name}.`)
  }
  return n
}

function parseField(rawField, def) {
  const values = new Set()
  const parts = rawField.split(',')
  for (const part of parts) {
    let [range, stepRaw] = part.split('/')
    const step = stepRaw !== undefined ? Number(stepRaw) : 1
    if (stepRaw !== undefined && (!Number.isInteger(step) || step <= 0)) {
      throw new Error(`Passo inválido em "${part}" no campo ${def.name}.`)
    }
    let start = def.min
    let end = def.max
    if (range !== '*') {
      if (range.includes('-')) {
        const [a, b] = range.split('-')
        start = resolveToken(a, def)
        end = resolveToken(b, def)
      } else {
        start = end = resolveToken(range, def)
      }
    }
    if (start < def.min || end > def.max || start > end) {
      throw new Error(`Valor fora do intervalo (${def.min}-${def.max}) no campo ${def.name}: "${part}".`)
    }
    for (let v = start; v <= end; v += step) values.add(v)
  }
  if (values.size === 0) {
    throw new Error(`Campo ${def.name} não resultou em nenhum valor válido.`)
  }
  return values
}

function parseCron(rawExpr) {
  const expr = SHORTHANDS[rawExpr.trim().toLowerCase()] || rawExpr.trim()
  const fields = expr.split(/\s+/)
  if (fields.length !== 5) {
    throw new Error('A expressão precisa ter 5 campos: minuto hora dia-do-mês mês dia-da-semana (ou um atalho como @daily).')
  }
  const [minute, hour, dom, month, dow] = fields.map((raw, i) => parseField(raw, FIELD_DEFS[i]))
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

function describeField(set, def) {
  if (set.size === def.max - def.min + 1) return null
  const sorted = [...set].sort((a, b) => a - b)
  if (def.name === 'dia da semana') return sorted.map((v) => WEEKDAY_NAMES[v]).join(', ')
  if (def.name === 'mês') return sorted.map((v) => MONTH_NAMES[v]).join(', ')
  return sorted.join(', ')
}

function describeCron(parsed) {
  const { minute, hour, dom, month, dow } = parsed
  const isEvery = (set, def) => set.size === def.max - def.min + 1

  if (minute.size === 1 && isEvery(hour, FIELD_DEFS[1]) && isEvery(dom, FIELD_DEFS[2]) && isEvery(month, FIELD_DEFS[3]) && isEvery(dow, FIELD_DEFS[4])) {
    const m = [...minute][0]
    return m === 0 ? 'A cada hora, no minuto 0.' : `A cada hora, no minuto ${m}.`
  }
  if (minute.size === 1 && hour.size === 1 && isEvery(dom, FIELD_DEFS[2]) && isEvery(month, FIELD_DEFS[3]) && isEvery(dow, FIELD_DEFS[4])) {
    const m = String([...minute][0]).padStart(2, '0')
    const h = String([...hour][0]).padStart(2, '0')
    return `Todos os dias às ${h}:${m}.`
  }
  if (minute.size === 1 && hour.size === 1 && isEvery(dom, FIELD_DEFS[2]) && isEvery(month, FIELD_DEFS[3]) && dow.size < FIELD_DEFS[4].max - FIELD_DEFS[4].min + 1) {
    const m = String([...minute][0]).padStart(2, '0')
    const h = String([...hour][0]).padStart(2, '0')
    const days = [...dow].sort((a, b) => a - b).map((v) => WEEKDAY_NAMES[v]).join(', ')
    return `Às ${h}:${m}, nos dias: ${days}.`
  }

  const parts = []
  const minuteDesc = describeField(minute, FIELD_DEFS[0])
  const hourDesc = describeField(hour, FIELD_DEFS[1])
  const domDesc = describeField(dom, FIELD_DEFS[2])
  const monthDesc = describeField(month, FIELD_DEFS[3])
  const dowDesc = describeField(dow, FIELD_DEFS[4])
  parts.push(minuteDesc ? `minuto(s) ${minuteDesc}` : 'a cada minuto')
  parts.push(hourDesc ? `hora(s) ${hourDesc}` : 'a cada hora')
  if (domDesc) parts.push(`dia(s) do mês ${domDesc}`)
  if (monthDesc) parts.push(`mês(es) ${monthDesc}`)
  if (dowDesc) parts.push(`dia(s) da semana ${dowDesc}`)
  return `Executa: ${parts.join(' — ')}.`
}

export default function CronParserPage() {
  const [expr, setExpr] = useState('0 0 * * *')

  const result = useMemo(() => {
    if (!expr.trim()) return { data: null, error: null }
    try {
      const parsed = parseCron(expr)
      return {
        data: {
          description: describeCron(parsed),
          runs: nextRuns(parsed, 5),
        },
        error: null,
      }
    } catch (err) {
      return { data: null, error: err.message }
    }
  }, [expr])

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><FieldTimeOutlined /> Explicador de Expressão Cron</Title>
      <Paragraph type="secondary">
        Digite uma expressão cron de 5 campos (<Text code>minuto hora dia-do-mês mês dia-da-semana</Text>)
        ou um atalho como <Text code>@daily</Text>. Tudo calculado no navegador — mostra a descrição em
        português e os próximos horários de execução a partir de agora.
      </Paragraph>

      <Card>
        <Input
          placeholder="0 0 * * *"
          value={expr}
          onChange={(e) => setExpr(e.target.value)}
          style={{ fontFamily: 'monospace' }}
        />
      </Card>

      {result.error && (
        <Alert type="error" showIcon message="Expressão inválida" description={result.error} />
      )}

      {result.data && (
        <>
          <Alert type="success" showIcon message={result.data.description} />

          <Card title="Próximas 5 execuções">
            {result.data.runs.length === 0 ? (
              <Text type="secondary">Nenhuma execução encontrada nos próximos 4 anos (combinação de dia/mês pode ser impossível, ex.: 31 de fevereiro).</Text>
            ) : (
              <List
                dataSource={result.data.runs}
                renderItem={(d) => (
                  <List.Item>
                    <Tag color="blue">{d.toLocaleString('pt-BR')}</Tag>
                  </List.Item>
                )}
              />
            )}
          </Card>
        </>
      )}

      <Card title="Referência rápida">
        <pre style={{ margin: 0, overflowX: 'auto' }}>
          <code>{`* * * * *
│ │ │ │ │
│ │ │ │ └── dia da semana (0-6, 0=domingo, aceita sun-sat)
│ │ │ └──── mês (1-12, aceita jan-dec)
│ │ └────── dia do mês (1-31)
│ └──────── hora (0-23)
└────────── minuto (0-59)

Suporta: * , - / e atalhos @yearly @monthly @weekly @daily @hourly`}</code>
        </pre>
      </Card>
    </Space>
  )
}
