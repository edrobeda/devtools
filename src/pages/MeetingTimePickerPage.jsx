import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Typography, Card, Space, Select, Button, Input, Tag, Empty, Alert, Tooltip } from 'antd'
import { GlobalOutlined, ClockCircleOutlined, PlusOutlined, DeleteOutlined, ThunderboltOutlined, ReloadOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import { ZONES, pad2, zoneParts, offsetMinutes, wallTimeToInstant, toNaiveString, fmtOffset, fmtDelta, cityOf } from '../utils/timezones'

const { Title, Paragraph, Text } = Typography

const DEFAULT_TARGETS = ['America/Sao_Paulo', 'America/New_York', 'Europe/London', 'Asia/Tokyo']
const DEFAULT_SOURCE = 'America/Sao_Paulo'

// Janela de "horário comercial" usada para colorir o grid (em hora local
// do fuso de cada linha). Pode ser customizada abaixo se o time prefere
// outro intervalo — o cálculo do "melhor horário" usa estes mesmos
// limites.
const WORK_START = 9
const WORK_END = 18
const BORDER_HOURS = 2

function weekdayOf(zone, ms) {
  return zoneParts(ms, zone).weekday
}

// Classifica uma hora local do fuso (0-23) em "trabalho", "borda" ou "descanso".
function statusOfHour(hour) {
  if (hour >= WORK_START && hour < WORK_END) return 'work'
  if (hour >= WORK_START - BORDER_HOURS && hour < WORK_END + BORDER_HOURS) return 'border'
  return 'sleep'
}

// Nomes dos dias da semana em PT/EN (alinhados com a saída do Intl em 'en-CA').
const WEEKDAY_PT = { Mon: 'Seg', Tue: 'Ter', Wed: 'Qua', Thu: 'Qui', Fri: 'Sex', Sat: 'Sáb', Sun: 'Dom' }
const WEEKDAY_EN = { Mon: 'Mon', Tue: 'Tue', Wed: 'Wed', Thu: 'Thu', Fri: 'Fri', Sat: 'Sat', Sun: 'Sun' }

const translations = {
  pt: {
    title: 'Seletor de Horário de Reunião (Multi-Fuso)',
    intro: (
      <>
        Marque uma reunião <Text strong>sem chutar</Text> em que horas fica pra cada time. Escolha um fuso
        de origem, ajuste a data/hora, e veja numa grade 24h o horário local em todos os fusos
        selecionados: verde é horário comercial, âmbar é borda (cedo/tarde) e vermelho é fora. A linha
        "Melhor horário" sugere o intervalo de 1 hora com mais sobreposição de horário comercial.
      </>
    ),
    sourceCard: 'Fuso de origem',
    sourceLabel: 'Fuso',
    whenLabel: 'Data e hora',
    now: 'Agora',
    targetsCard: 'Fusos a comparar',
    addPlaceholder: 'Adicionar fuso…',
    add: 'Adicionar',
    remove: 'Remover',
    reset: 'Restaurar padrão',
    noTargets: 'Adicione pelo menos um fuso para ver a sobreposição.',
    worldClockCard: 'Relógio mundial',
    overlapCard: 'Sobreposição de horário comercial',
    overlapHelp: (
      <>
        A grade mostra, em cada linha, a hora local do fuso correspondente a cada hora do dia no{' '}
        <Text code>fuso de origem</Text>. O cursor vertical marca o momento selecionado. Verde =
        horário comercial (09–18), âmbar = borda (2 h antes/depois), vermelho = fora.
      </>
    ),
    bestCard: 'Melhor horário sugerido',
    bestHelp: (
      <>
        A barra abaixo soma, para cada hora do dia no fuso de origem, em quantos dos fusos
        selecionados esse momento cai em horário comercial. O pico é a hora com mais gente
        disponível — o resto do time acompanha em horário de borda ou fora.
      </>
    ),
    bestAt: (hourLabel, count, total) => `Melhor: ${hourLabel} (${count} de ${total} fusos em horário comercial)`,
    noBest: 'Nenhum fuso coincide em horário comercial — considere dividir a reunião em dois turnos ou usar gravação.',
    howCard: 'Como funciona',
    how: (
      <>
        Cada coluna da grade é um instante diferente: a hora<Text code>h</Text> do dia no fuso de
        origem. Para cada fuso selecionado, a ferramenta consulta{' '}
        <Text code>Intl.DateTimeFormat</Text> e classifica a hora local em três faixas: comercial
        (verde), borda (âmbar) e descanso (vermelho). A "melhor hora" é a coluna com mais fusos em
        comercial — basta clicar no número da coluna para fixar a reunião nesse instante.
      </>
    ),
    sourceTitle: 'Pegadinha do horário de parede',
    sourceNote: (
      <>
        O campo de data/hora é interpretado como<Text strong>horário de parede</Text> do fuso de
        origem (não do seu navegador). Trocar o fuso de origem reescreve o campo para refletir o
        novo horário local mantendo o mesmo instante.
      </>
    ),
    weekday: WEEKDAY_PT,
  },
  en: {
    title: 'Meeting Time Picker (Multi-Timezone)',
    intro: (
      <>
        Schedule a meeting <Text strong>without guessing</Text> what time it lands for each team.
        Pick a source timezone, set the date/time, and read the 24-hour grid for the local hour in
        every selected timezone: green is work hours, amber is borderline (early/late), red is off.
        The "Best window" row suggests the 1-hour slot with the most work-hour overlap.
      </>
    ),
    sourceCard: 'Source timezone',
    sourceLabel: 'Timezone',
    whenLabel: 'Date & time',
    now: 'Now',
    targetsCard: 'Timezones to compare',
    addPlaceholder: 'Add timezone…',
    add: 'Add',
    remove: 'Remove',
    reset: 'Reset to default',
    noTargets: 'Add at least one timezone to see the overlap.',
    worldClockCard: 'World clock',
    overlapCard: 'Work-hour overlap',
    overlapHelp: (
      <>
        Each row shows the local hour in that timezone that corresponds to each hour of the day in
        the <Text code>source</Text> timezone. The vertical cursor marks the picked moment. Green =
        work (09–18), amber = border (2 h before/after), red = off.
      </>
    ),
    bestCard: 'Suggested best window',
    bestHelp: (
      <>
        The bar below tallies, for each hour of the day in the source timezone, how many selected
        timezones are in work hours at that moment. The peak is the slot with the most people
        available — everyone else is on the border or off.
      </>
    ),
    bestAt: (hourLabel, count, total) => `Best: ${hourLabel} (${count} of ${total} timezones in work hours)`,
    noBest: 'No timezone overlaps in work hours — consider splitting into two slots or recording the meeting.',
    howCard: 'How it works',
    how: (
      <>
        Each column is a different instant: hour <Text code>h</Text> of the day in the source
        timezone. For every selected timezone, the page queries <Text code>Intl.DateTimeFormat</Text>{' '}
        and classifies the local hour in three buckets: work (green), border (amber) and off (red).
        The "best hour" is the column with the most work-hour hits — click any column number to lock
        the meeting to that instant.
      </>
    ),
    sourceTitle: 'Wall-time gotcha',
    sourceNote: (
      <>
        The date/time field is interpreted as the <Text strong>wall time</Text> of the source
        timezone (not your browser's). Changing the source timezone rewrites the field to reflect
        the new local time while keeping the same instant.
      </>
    ),
    weekday: WEEKDAY_EN,
  },
}

// Gera os 24 instantes do "dia de origem" — 00:00 até 23:00 no fuso
// de origem, na data escolhida. Cada coluna da grade é um deles.
function buildGrid(sourceZone, pickedInstant) {
  const sp = zoneParts(pickedInstant, sourceZone)
  const date = `${sp.year}-${pad2(sp.month)}-${pad2(sp.day)}`
  const columns = []
  for (let h = 0; h < 24; h++) {
    const wall = `${date}T${pad2(h)}:00`
    const ms = wallTimeToInstant(wall, sourceZone)
    if (ms == null) {
      columns.push({ hour: h, label: pad2(h), perZone: [] })
      continue
    }
    columns.push({ hour: h, label: pad2(h), perZone: [] })
  }
  return columns
}

export default function MeetingTimePickerPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const wd = t.weekday

  const [sourceZone, setSourceZone] = useState(DEFAULT_SOURCE)
  const [pickedInstant, setPickedInstant] = useState(() => {
    // Padrão: 14:00 hoje no fuso de origem (uma hora "neutra" que costuma
    // funcionar para reuniões entre times do Brasil/Europa/EUA).
    const now = new Date()
    const todaySP = zoneParts(now.getTime(), DEFAULT_SOURCE)
    const wall = `${todaySP.year}-${pad2(todaySP.month)}-${pad2(todaySP.day)}T14:00`
    const inst = wallTimeToInstant(wall, DEFAULT_SOURCE)
    return inst != null ? inst : now.getTime()
  })
  const [isLive, setIsLive] = useState(false)
  const [targetZones, setTargetZones] = useState(DEFAULT_TARGETS)
  const [pickedToAdd, setPickedToAdd] = useState(undefined)

  // Tick do "Agora" — só monta o setInterval se isLive for true. O
  // callback usa Date.now() direto (não captura `now` por closure), e a
  // única dependência do efeito é isLive (estável), então não há risco
  // de loop.
  useEffect(() => {
    if (!isLive) return undefined
    setPickedInstant(Date.now())
    const id = setInterval(() => setPickedInstant(Date.now()), 30 * 1000)
    return () => clearInterval(id)
  }, [isLive])

  // String "YYYY-MM-DDTHH:mm" pro input datetime-local. Sempre reflete
  // pickedInstant no fuso de origem — se isLive está true e o tick
  // atualizou, o input acompanha.
  const inputValue = useMemo(() => toNaiveString(pickedInstant, sourceZone), [pickedInstant, sourceZone])

  // Partes do fuso de origem (usadas em vários pontos abaixo).
  const srcParts = useMemo(() => zoneParts(pickedInstant, sourceZone), [pickedInstant, sourceZone])
  const srcOffset = useMemo(() => offsetMinutes(pickedInstant, sourceZone), [pickedInstant, sourceZone])

  // Relógio mundial: uma linha por fuso selecionado, com a hora local no
  // instante escolhido. Memoizado em pickedInstant + targetZones para
  // não recomputar a cada render.
  const worldClock = useMemo(
    () =>
      targetZones.map((zone) => {
        const p = zoneParts(pickedInstant, zone)
        const off = offsetMinutes(pickedInstant, zone)
        const delta = off - srcOffset
        const dayShift = p.date === srcParts.date ? 0 : p.date > srcParts.date ? 1 : -1
        return {
          zone,
          city: cityOf(zone),
          time: `${pad2(p.hour)}:${pad2(p.minute)}`,
          weekday: wd[p.weekday] || p.weekday,
          date: p.date,
          offset: off,
          delta,
          dayShift,
        }
      }),
    [targetZones, pickedInstant, srcParts.date, srcOffset, wd],
  )

  // Grade 24h: para cada hora do dia no fuso de origem, computa a hora
  // local em cada fuso selecionado. Cada célula carrega o status
  // (work / border / sleep) e a hora local formatada.
  const grid = useMemo(() => {
    const columns = buildGrid(sourceZone, pickedInstant)
    return columns.map((col) => {
      const wall = `${srcParts.year}-${pad2(srcParts.month)}-${pad2(srcParts.day)}T${pad2(col.hour)}:00`
      const ms = wallTimeToInstant(wall, sourceZone)
      const perZone = targetZones.map((zone) => {
        if (ms == null) return { zone, city: cityOf(zone), label: '--:--', status: 'sleep' }
        const p = zoneParts(ms, zone)
        return {
          zone,
          city: cityOf(zone),
          label: `${pad2(p.hour)}:${pad2(p.minute)}`,
          status: statusOfHour(p.hour),
        }
      })
      return { ...col, perZone }
    })
  }, [sourceZone, pickedInstant, srcParts, targetZones])

  // Para cada coluna, conta quantos fusos estão em horário comercial —
  // é o que alimenta o gráfico de barras e a sugestão de "melhor hora".
  const bestByColumn = useMemo(
    () => grid.map((col) => col.perZone.filter((c) => c.status === 'work').length),
    [grid],
  )

  // Hora do dia no fuso de origem que tem mais fusos em horário comercial.
  // Empate: a primeira ocorrência (hora mais cedo).
  const bestIdx = useMemo(() => {
    if (bestByColumn.length === 0) return -1
    let best = -1
    let bestVal = -1
    for (let i = 0; i < bestByColumn.length; i++) {
      if (bestByColumn[i] > bestVal) {
        bestVal = bestByColumn[i]
        best = i
      }
    }
    return best
  }, [bestByColumn])

  // Índice da coluna que corresponde ao instante selecionado — marca a
  // coluna atual com um cursor vertical.
  const pickedColumnIdx = useMemo(() => {
    // Pega a hora de parede do instante selecionado no fuso de origem
    // e compara com a coluna. Se a hora tem minutos não-zero, retornamos
    // a coluna da hora (inteiro).
    const p = zoneParts(pickedInstant, sourceZone)
    return p.hour
  }, [pickedInstant, sourceZone])

  // Add/remove de fusos. Memoizados pra que o Select não reinicialize
  // a lista de opções a cada render.
  const addable = useMemo(() => ZONES.filter((z) => !targetZones.includes(z.id)), [targetZones])

  const handleInputChange = useCallback((e) => {
    const v = e.target.value
    if (!v) return
    const inst = wallTimeToInstant(v, sourceZone)
    if (inst != null) {
      setPickedInstant(inst)
      setIsLive(false)
    }
  }, [sourceZone])

  const handleSourceChange = useCallback((newZone) => {
    setSourceZone(newZone)
    // mantém o mesmo instante — useMemo/toNaiveString reescreve o input
  }, [])

  const handleNow = useCallback(() => {
    setPickedInstant(Date.now())
    setIsLive(true)
  }, [])

  const handleAdd = useCallback((zone) => {
    if (!zone) return
    setTargetZones((zs) => (zs.includes(zone) ? zs : [...zs, zone]))
    setPickedToAdd(undefined)
  }, [])

  const handleRemove = useCallback((zone) => {
    setTargetZones((zs) => zs.filter((z) => z !== zone))
  }, [])

  const handleReset = useCallback(() => {
    setTargetZones(DEFAULT_TARGETS)
    setPickedToAdd(undefined)
  }, [])

  const handlePickColumn = useCallback((hour) => {
    // Constrói o wall time na data atual do fuso de origem.
    const today = zoneParts(pickedInstant, sourceZone)
    const wall = `${today.year}-${pad2(today.month)}-${pad2(today.day)}T${pad2(hour)}:00`
    const inst = wallTimeToInstant(wall, sourceZone)
    if (inst != null) {
      setPickedInstant(inst)
      setIsLive(false)
    }
  }, [pickedInstant, sourceZone])

  // Larguras e cores das células da grade (memoizadas: dependem só de
  // coisas estáveis neste render — grid.length e targetZones.length).
  const cellStyle = useMemo(() => {
    const totalCols = 24
    return {
      width: `${100 / totalCols}%`,
      minWidth: 28,
    }
  }, [])

  const statusBg = {
    work: { bg: '#f6ffed', border: '#b7eb8f', text: '#135200' },
    border: { bg: '#fffbe6', border: '#ffe58f', text: '#874d00' },
    sleep: { bg: '#fff1f0', border: '#ffa39e', text: '#820014' },
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><GlobalOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card title={t.sourceCard}>
        <Space size="large" wrap style={{ width: '100%' }}>
          <div>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>{t.sourceLabel}</Text>
            <Select
              showSearch
              style={{ minWidth: 260 }}
              value={sourceZone}
              onChange={handleSourceChange}
              options={ZONES.map((z) => ({ label: `${z.city} (${z.id})`, value: z.id }))}
              filterOption={(input, opt) => String(opt.label).toLowerCase().includes(input.toLowerCase())}
            />
          </div>
          <div style={{ flex: 1, minWidth: 240 }}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>{t.whenLabel}</Text>
            <Space.Compact style={{ width: '100%' }}>
              <Input
                value={inputValue}
                onChange={handleInputChange}
                type="datetime-local"
                style={{ width: '100%' }}
              />
              <Button
                type={isLive ? 'primary' : 'default'}
                icon={<ClockCircleOutlined />}
                onClick={handleNow}
              >
                {t.now}
              </Button>
            </Space.Compact>
          </div>
        </Space>
      </Card>

      <Card
        title={t.targetsCard}
        extra={
          <Space>
            <Space.Compact>
              <Select
                showSearch
                style={{ minWidth: 240 }}
                placeholder={t.addPlaceholder}
                value={pickedToAdd}
                onChange={setPickedToAdd}
                options={addable.map((z) => ({ label: `${z.city} (${z.id})`, value: z.id }))}
                filterOption={(input, opt) => String(opt.label).toLowerCase().includes(input.toLowerCase())}
              />
              <Button type="primary" icon={<PlusOutlined />} onClick={() => handleAdd(pickedToAdd)}>
                {t.add}
              </Button>
            </Space.Compact>
            <Button icon={<ReloadOutlined />} onClick={handleReset}>{t.reset}</Button>
          </Space>
        }
      >
        {targetZones.length === 0 ? (
          <Empty description={t.noTargets} />
        ) : (
          <Space wrap size={[8, 8]}>
            {targetZones.map((z) => (
              <Tag
                key={z}
                color="blue"
                style={{ padding: '4px 8px', fontSize: 13 }}
                closable
                onClose={(e) => { e.preventDefault(); handleRemove(z) }}
                closeIcon={<DeleteOutlined />}
              >
                {cityOf(z)} <Text type="secondary" style={{ fontSize: 11 }}>({z})</Text>
              </Tag>
            ))}
          </Space>
        )}
      </Card>

      {targetZones.length > 0 && (
        <>
          <Card title={t.worldClockCard}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: 12,
              }}
            >
              {worldClock.map((r) => (
                <div
                  key={r.zone}
                  style={{
                    border: '1px solid #d9d9d9',
                    borderRadius: 8,
                    padding: 12,
                    background: r.zone === sourceZone ? '#e6f4ff' : '#fafafa',
                  }}
                >
                  <Text strong style={{ display: 'block', fontSize: 14 }}>{r.city}</Text>
                  <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>{r.zone}</Text>
                  <div style={{ fontSize: 24, fontVariantNumeric: 'tabular-nums', marginTop: 4, lineHeight: 1.1 }}>
                    {r.time}
                  </div>
                  <Space size={4} wrap style={{ marginTop: 6 }}>
                    <Tag color={r.offset < 0 ? 'orange' : 'cyan'} style={{ margin: 0 }}>{fmtOffset(r.offset)}</Tag>
                    {r.zone !== sourceZone && (
                      <Tag style={{ margin: 0 }}>{r.weekday} · {r.date}</Tag>
                    )}
                    {r.zone !== sourceZone && (
                      <Tag
                        color={r.dayShift === 0 ? 'default' : r.dayShift > 0 ? 'gold' : 'purple'}
                        style={{ margin: 0 }}
                      >
                        {fmtDelta(r.delta)}
                      </Tag>
                    )}
                  </Space>
                </div>
              ))}
            </div>
          </Card>

          <Card title={t.overlapCard}>
            <Paragraph type="secondary" style={{ marginTop: -4 }}>{t.overlapHelp}</Paragraph>
            <div style={{ overflowX: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'separate',
                  borderSpacing: 2,
                  minWidth: 700,
                }}
              >
                <thead>
                  <tr>
                    <th style={{ ...cellStyle, textAlign: 'left', padding: '4px 6px', background: 'transparent', borderBottom: '1px solid #d9d9d9', fontWeight: 600, position: 'sticky', left: 0, zIndex: 1 }}>
                      {t.sourceLabel}
                    </th>
                    {Array.from({ length: 24 }, (_, h) => (
                      <th
                        key={h}
                        style={{
                          ...cellStyle,
                          textAlign: 'center',
                          padding: '4px 0',
                          background: h === pickedColumnIdx ? '#e6f4ff' : 'transparent',
                          borderBottom: '1px solid #d9d9d9',
                          fontVariantNumeric: 'tabular-nums',
                          fontWeight: h === pickedColumnIdx ? 700 : 500,
                          color: h === pickedColumnIdx ? '#1677ff' : 'inherit',
                          cursor: 'pointer',
                        }}
                        onClick={() => handlePickColumn(h)}
                        title={`${pad2(h)}:00`}
                      >
                        {pad2(h)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {targetZones.map((zone) => {
                    const row = grid.map((col) => col.perZone.find((c) => c.zone === zone)).filter(Boolean)
                    const isSource = zone === sourceZone
                    return (
                      <tr key={zone}>
                        <td
                          style={{
                            ...cellStyle,
                            textAlign: 'left',
                            padding: '6px 8px',
                            background: isSource ? '#e6f4ff' : '#fafafa',
                            fontWeight: isSource ? 600 : 400,
                            position: 'sticky',
                            left: 0,
                            zIndex: 1,
                            minWidth: 120,
                            width: 120,
                          }}
                        >
                          {cityOf(zone)}
                        </td>
                        {row.map((cell, idx) => {
                          const c = statusBg[cell.status]
                          const isPicked = idx === pickedColumnIdx
                          return (
                            <td
                              key={idx}
                              style={{
                                ...cellStyle,
                                textAlign: 'center',
                                padding: '6px 0',
                                background: c.bg,
                                color: c.text,
                                border: isPicked ? `2px solid #1677ff` : `1px solid ${c.border}`,
                                fontVariantNumeric: 'tabular-nums',
                                fontSize: 12,
                                fontWeight: isPicked ? 700 : 500,
                              }}
                              title={`${cityOf(zone)} ${cell.label} — ${cell.status === 'work' ? (lang === 'pt' ? 'comercial' : 'work') : cell.status === 'border' ? (lang === 'pt' ? 'borda' : 'border') : (lang === 'pt' ? 'descanso' : 'off')}`}
                            >
                              {cell.label}
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          <Card title={t.bestCard}>
            <Paragraph type="secondary" style={{ marginTop: -4 }}>{t.bestHelp}</Paragraph>
            {bestIdx >= 0 && bestByColumn[bestIdx] > 0 ? (
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <div>
                  <ThunderboltOutlined style={{ color: '#52c41a', marginRight: 6 }} />
                  <Text strong>
                    {t.bestAt(`${pad2(bestIdx)}:00`, bestByColumn[bestIdx], targetZones.length)}
                  </Text>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 80, minWidth: 600, overflowX: 'auto' }}>
                  {bestByColumn.map((count, h) => {
                    const max = Math.max(1, ...bestByColumn)
                    const heightPct = (count / max) * 100
                    const isBest = h === bestIdx
                    const isPicked = h === pickedColumnIdx
                    return (
                      <Tooltip
                        key={h}
                        title={`${pad2(h)}:00 — ${count}/${targetZones.length}`}
                        placement="top"
                      >
                        <div
                          onClick={() => handlePickColumn(h)}
                          style={{
                            flex: 1,
                            minWidth: 18,
                            height: '100%',
                            display: 'flex',
                            alignItems: 'flex-end',
                            cursor: 'pointer',
                            background: 'transparent',
                          }}
                        >
                          <div
                            style={{
                              width: '100%',
                              height: `${Math.max(heightPct, count > 0 ? 8 : 2)}%`,
                              background: count === 0
                                ? '#f0f0f0'
                                : isBest
                                  ? '#52c41a'
                                  : isPicked
                                    ? '#1677ff'
                                    : '#bae637',
                              border: isPicked ? '2px solid #0958d9' : 'none',
                              borderRadius: 2,
                              transition: 'background 120ms',
                            }}
                          />
                        </div>
                      </Tooltip>
                    )
                  })}
                </div>
                <Space wrap size={4} style={{ width: '100%', minWidth: 600 }}>
                  {Array.from({ length: 24 }, (_, h) => (
                    <div
                      key={h}
                      style={{
                        flex: 1,
                        minWidth: 18,
                        textAlign: 'center',
                        fontSize: 11,
                        color: h === bestIdx ? '#52c41a' : h === pickedColumnIdx ? '#1677ff' : '#999',
                        fontWeight: h === bestIdx || h === pickedColumnIdx ? 700 : 400,
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {pad2(h)}
                    </div>
                  ))}
                </Space>
              </Space>
            ) : (
              <Text type="secondary">{t.noBest}</Text>
            )}
          </Card>
        </>
      )}

      <Card title={t.sourceTitle}>
        <Alert type="info" message={t.sourceNote} showIcon style={{ marginBottom: 12 }} />
        <Paragraph type="secondary" style={{ marginBottom: 0 }}>{t.how}</Paragraph>
      </Card>
    </Space>
  )
}
