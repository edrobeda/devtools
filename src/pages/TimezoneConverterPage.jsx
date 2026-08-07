import React, { useMemo, useState } from 'react'
import { Typography, Card, Space, Select, Button, Input, Tag, List, Alert, Empty } from 'antd'
import { GlobalOutlined, DeleteOutlined, PlusOutlined, ClockCircleOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

// ─── Catálogo de fusos ───────────────────────────────────────────
// Conjunto curado dos fusos mais comuns no dia a dia de um dev
// (deploy, oncall, reunião com time remoto...). Qualquer ID IANA
// válido funciona — este é só o atalho com nome amigável.
const ZONES = [
  { id: 'Etc/UTC', city: 'UTC' },
  { id: 'America/New_York', city: 'New York' },
  { id: 'America/Chicago', city: 'Chicago' },
  { id: 'America/Denver', city: 'Denver' },
  { id: 'America/Los_Angeles', city: 'Los Angeles' },
  { id: 'America/Toronto', city: 'Toronto' },
  { id: 'America/Mexico_City', city: 'Cidade do México' },
  { id: 'America/Sao_Paulo', city: 'São Paulo' },
  { id: 'America/Buenos_Aires', city: 'Buenos Aires' },
  { id: 'Europe/London', city: 'Londres' },
  { id: 'Europe/Lisbon', city: 'Lisboa' },
  { id: 'Europe/Paris', city: 'Paris' },
  { id: 'Europe/Berlin', city: 'Berlim' },
  { id: 'Europe/Madrid', city: 'Madri' },
  { id: 'Europe/Rome', city: 'Roma' },
  { id: 'Europe/Amsterdam', city: 'Amsterdã' },
  { id: 'Europe/Stockholm', city: 'Estocolmo' },
  { id: 'Europe/Warsaw', city: 'Varsóvia' },
  { id: 'Europe/Istanbul', city: 'Istambul' },
  { id: 'Europe/Moscow', city: 'Moscou' },
  { id: 'Africa/Cairo', city: 'Cairo' },
  { id: 'Africa/Johannesburg', city: 'Joanesburgo' },
  { id: 'Asia/Dubai', city: 'Dubai' },
  { id: 'Asia/Kolkata', city: 'Índia (IST)' },
  { id: 'Asia/Bangkok', city: 'Bangkok' },
  { id: 'Asia/Singapore', city: 'Singapura' },
  { id: 'Asia/Hong_Kong', city: 'Hong Kong' },
  { id: 'Asia/Shanghai', city: 'Xangai' },
  { id: 'Asia/Taipei', city: 'Taipei' },
  { id: 'Asia/Tokyo', city: 'Tóquio' },
  { id: 'Asia/Seoul', city: 'Seul' },
  { id: 'Australia/Sydney', city: 'Sydney' },
  { id: 'Australia/Melbourne', city: 'Melbourne' },
  { id: 'Pacific/Auckland', city: 'Auckland' },
  { id: 'Pacific/Honolulu', city: 'Honolulu' },
]

const DEFAULT_TARGETS = ['Etc/UTC', 'America/Sao_Paulo', 'America/New_York', 'Europe/London', 'Asia/Tokyo']

const cityOf = (id) => {
  const z = ZONES.find((x) => x.id === id)
  return z ? z.city : id
}

// ─── Núcleo de conversão entre fusos ─────────────────────────────
// A pegada difícil é o campo de data/hora: ele é interpretado como
// horário de PAREDE no fuso de origem (não no fuso do navegador).
// Pra achar o instante certo existe um passo intermediário — assume
// UTC, descobre o offset no fuso, corrige e confere de novo (DST).
function pad2(n) {
  return String(n).padStart(2, '0')
}

function zoneParts(ms, zone) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: zone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(new Date(ms))
  const o = {}
  parts.forEach((p) => { o[p.type] = p.value })
  let hour = parseInt(o.hour, 10)
  if (hour === 24) hour = 0
  return {
    year: parseInt(o.year, 10),
    month: parseInt(o.month, 10),
    day: parseInt(o.day, 10),
    hour,
    minute: parseInt(o.minute, 10),
    second: parseInt(o.second, 10),
    date: `${o.year}-${o.month}-${o.day}`,
  }
}

function offsetMinutes(ms, zone) {
  const p = zoneParts(ms, zone)
  const wallAsUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second)
  return Math.round((wallAsUtc - ms) / 60000)
}

function wallTimeToInstant(str, zone) {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(str)
  if (!m) return null
  const y = +m[1]
  const mo = +m[2]
  const d = +m[3]
  const h = +m[4]
  const mi = +m[5]
  const asUtc = Date.UTC(y, mo - 1, d, h, mi)
  const o1 = offsetMinutes(asUtc, zone)
  let cand = new Date(asUtc - o1 * 60000)
  const o2 = offsetMinutes(cand.getTime(), zone)
  if (o1 !== o2) cand = new Date(asUtc - o2 * 60000)
  return cand.getTime()
}

function toNaiveString(ms, zone) {
  const p = zoneParts(ms, zone)
  return `${p.year}-${pad2(p.month)}-${pad2(p.day)}T${pad2(p.hour)}:${pad2(p.minute)}`
}

function fmtOffset(min) {
  const sign = min < 0 ? '-' : '+'
  const abs = Math.abs(min)
  return `UTC${sign}${pad2(Math.floor(abs / 60))}:${pad2(abs % 60)}`
}

function fmtDelta(min) {
  if (min === 0) return '±0h'
  const sign = min > 0 ? '+' : '-'
  const abs = Math.abs(min)
  const h = Math.floor(abs / 60)
  const m = abs % 60
  if (h && m) return `${sign}${h}h${m}m`
  if (h) return `${sign}${h}h`
  return `${sign}${m}m`
}

const SOURCE_SNIPPET = `// 1. Offset de um fuso num instante (minutos pra somar ao UTC)
function offsetMinutes(ms, zone) {
  const p = zoneParts(ms, zone)              // horário local via Intl
  const wallAsUtc = Date.UTC(p.year, p.month - 1, p.day,
    p.hour, p.minute, p.second)
  return Math.round((wallAsUtc - ms) / 60000)
}

// 2. Interpreta "YYYY-MM-DDTHH:mm" como horário DE PAREDE do fuso
function wallTimeToInstant(str, zone) {
  const m = /^(\\d{4})-(\\d{2})-(\\d{2})T(\\d{2}):(\\d{2})$/.exec(str)
  const asUtc = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5])
  const o1 = offsetMinutes(asUtc, zone)      // 1ª estimativa de offset
  let cand = new Date(asUtc - o1 * 60000)
  const o2 = offsetMinutes(cand.getTime(), zone) // re-conferir (DST)
  if (o1 !== o2) cand = new Date(asUtc - o2 * 60000)
  return cand.getTime()                      // instante em ms
}

// 3. Do instante pro horário de qualquer fuso:
const t = zoneParts(refInstant, targetZone)  // { hour, minute, ... }
// delta entre fusos = offset(target) - offset(source)`

const translations = {
  pt: {
    title: 'Conversor de Fuso Horário',
    intro: (
      <>
        Escolha um momento e veja a que horas ele é em qualquer outro fuso —
        perfeito pra marcar deploy, reunião com time remoto ou oncall.{' '}
        O campo de data/hora é interpretado como horário local do fuso de
        origem. 100% client-side via <Text code>Intl.DateTimeFormat</Text>,
        sem API externa.
      </>
    ),
    refTitle: 'Momento de referência',
    sourceLabel: 'Fuso de origem',
    whenLabel: 'Data e hora',
    now: 'Agora',
    targetsTitle: 'Conversões',
    addTitle: 'Adicionar fuso',
    addPlaceholder: 'Escolha um fuso para adicionar...',
    add: 'Adicionar',
    remove: 'Remover',
    sameDay: 'mesmo dia',
    nextDay: 'dia seguinte',
    prevDay: 'dia anterior',
    offsetLabel: 'Offset em relação à origem',
    noTargets: 'Adicione um fuso à direita acima para ver a conversão.',
    note: 'O campo de data/hora segue o horário de parede do fuso de origem (e não o fuso do seu navegador). Trocar o fuso de origem mantém o mesmo instante — o campo é reescrito para refletir o novo horário local.',
    sourceTitle: 'Como funciona',
  },
  en: {
    title: 'Timezone Converter',
    intro: (
      <>
        Pick a moment and see what time it is in any other timezone — handy
        for scheduling deploys, remote meetings or oncall.{' '}
        The date/time field is interpreted as the wall time of the{' '}
        <Text code>source</Text> timezone. 100% client-side via{' '}
        <Text code>Intl.DateTimeFormat</Text>, no external API.
      </>
    ),
    refTitle: 'Reference moment',
    sourceLabel: 'Source timezone',
    whenLabel: 'Date and time',
    now: 'Now',
    targetsTitle: 'Conversions',
    addTitle: 'Add timezone',
    addPlaceholder: 'Pick a timezone to add...',
    add: 'Add',
    remove: 'Remove',
    sameDay: 'same day',
    nextDay: 'next day',
    prevDay: 'previous day',
    offsetLabel: 'Offset from source',
    noTargets: 'Add a timezone on the right above to see the conversion.',
    note: 'The date/time field uses the wall time of the source timezone (not your browser zone). Switching the source timezone keeps the same instant — the field is rewritten to reflect the new local time.',
    sourceTitle: 'Under the hood',
  },
}

export default function TimezoneConverterPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [sourceZone, setSourceZone] = useState('America/Sao_Paulo')
  const [refInstant, setRefInstant] = useState(() => Date.now())
  const [targetZones, setTargetZones] = useState(DEFAULT_TARGETS)
  const [picked, setPicked] = useState(undefined)

  const inputValue = useMemo(() => toNaiveString(refInstant, sourceZone), [refInstant, sourceZone])

  const srcParts = useMemo(() => zoneParts(refInstant, sourceZone), [refInstant, sourceZone])
  const srcOffset = useMemo(() => offsetMinutes(refInstant, sourceZone), [refInstant, sourceZone])

  const rows = useMemo(
    () =>
      targetZones.map((zone) => {
        const p = zoneParts(refInstant, zone)
        const off = offsetMinutes(refInstant, zone)
        const delta = off - srcOffset
        const dayShift = p.date === srcParts.date ? 0 : p.date > srcParts.date ? 1 : -1
        return {
          zone,
          city: cityOf(zone),
          time: `${pad2(p.hour)}:${pad2(p.minute)}:${pad2(p.second)}`,
          date: p.date,
          offset: off,
          delta,
          dayShift,
        }
      }),
    [targetZones, refInstant, srcParts.date, srcOffset]
  )

  const addable = useMemo(() => ZONES.filter((z) => !targetZones.includes(z.id)), [targetZones])

  function handleInputChange(e) {
    const v = e.target.value
    if (!v) return
    const inst = wallTimeToInstant(v, sourceZone)
    if (inst != null) setRefInstant(inst)
  }

  function handleAdd(zone) {
    if (!zone) return
    setTargetZones((zs) => (zs.includes(zone) ? zs : [...zs, zone]))
    setPicked(undefined)
  }

  function handleRemove(zone) {
    setTargetZones((zs) => zs.filter((z) => z !== zone))
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><GlobalOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card title={t.refTitle}>
        <Space size="large" wrap style={{ width: '100%' }}>
          <div>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>{t.sourceLabel}</Text>
            <Select
              showSearch
              style={{ minWidth: 260 }}
              value={sourceZone}
              onChange={setSourceZone}
              options={ZONES.map((z) => ({ label: `${z.city} (${z.id})`, value: z.id }))}
              filterOption={(input, opt) => String(opt.label).toLowerCase().includes(input.toLowerCase())}
            />
          </div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>{t.whenLabel}</Text>
            <Space.Compact style={{ width: '100%' }}>
              <Input
                value={inputValue}
                onChange={handleInputChange}
                type="datetime-local"
                style={{ width: '100%' }}
              />
              <Button type="primary" icon={<ClockCircleOutlined />} onClick={() => setRefInstant(Date.now())}>
                {t.now}
              </Button>
            </Space.Compact>
          </div>
        </Space>
      </Card>

      <Card
        title={t.targetsTitle}
        extra={
          <Space.Compact>
            <Select
              showSearch
              style={{ minWidth: 240 }}
              placeholder={t.addPlaceholder}
              value={picked}
              onChange={setPicked}
              options={addable.map((z) => ({ label: `${z.city} (${z.id})`, value: z.id }))}
              filterOption={(input, opt) => String(opt.label).toLowerCase().includes(input.toLowerCase())}
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={() => handleAdd(picked)}>
              {t.add}
            </Button>
          </Space.Compact>
        }
      >
        {rows.length === 0 ? (
          <Empty description={t.noTargets} />
        ) : (
          <List
            size="small"
            dataSource={rows}
            renderItem={(r) => (
              <List.Item
                actions={[
                  <Button
                    key="rm"
                    size="small"
                    type="text"
                    icon={<DeleteOutlined />}
                    onClick={() => handleRemove(r.zone)}
                    aria-label={t.remove}
                  />,
                ]}
              >
                <Space size="large" wrap style={{ width: '100%' }}>
                  <div style={{ minWidth: 150 }}>
                    <Text strong>{r.city}</Text>
                    <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>{r.zone}</Text>
                  </div>
                  <Text style={{ fontSize: 18, fontVariantNumeric: 'tabular-nums' }}>{r.time}</Text>
                  <Text type="secondary">{r.date}</Text>
                  <Tag color={r.offset < 0 ? 'orange' : 'blue'}>{fmtOffset(r.offset)}</Tag>
                  <Tag
                    color={r.dayShift === 0 ? 'default' : r.dayShift > 0 ? 'gold' : 'purple'}
                    style={{ marginRight: 0 }}
                  >
                    {r.dayShift === 0 ? t.sameDay : r.dayShift > 0 ? t.nextDay : t.prevDay}
                  </Tag>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {t.offsetLabel}: <Text code>{fmtDelta(r.delta)}</Text>
                  </Text>
                </Space>
              </List.Item>
            )}
          />
        )}
      </Card>

      <Alert type="info" message={t.note} showIcon />

      <Card title={t.sourceTitle}>
        <pre style={{ margin: 0, overflowX: 'auto' }}><code>{SOURCE_SNIPPET}</code></pre>
      </Card>
    </Space>
  )
}
