import React, { useMemo, useState, useCallback } from 'react'
import {
  Typography,
  Card,
  Space,
  Select,
  Button,
  Row,
  Col,
  Table,
  Tag,
  Collapse,
  Alert,
  Radio,
  Divider,
} from 'antd'
import {
  ClockCircleOutlined,
  SendOutlined,
  PlusOutlined,
  ReloadOutlined,
  CopyOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  CLOCK_MODES,
  EVENT_TYPES,
  createProcess,
  createState,
  addLocalEvent,
  addSendEvent,
  addReceiveEvent,
  compareEvents,
  formatVector,
  eventsByProcess,
  PRESETS,
  getScenario,
  sourceCode,
} from '../utils/logicalClocksSimulator'

const { Title, Paragraph, Text } = Typography
const { Option } = Select
const { Panel } = Collapse

const translations = {
  pt: {
    title: 'Simulador de Relógios Lógicos',
    subtitle: 'Lamport Timestamps & Vector Clocks',
    intro:
      'Experimente como processos em um sistema distribuído ordenam eventos. Adicione eventos locais e mensagens entre processos para ver Lamport timestamps e vector clocks em tempo real, e teste relações de causalidade (happens-before, concorrente).',
    clockMode: 'Modo de relógio',
    lamport: 'Lamport timestamp',
    vector: 'Vector clock',
    scenario: 'Cenário',
    processes: 'Processos',
    addLocal: 'Evento local',
    sendMessage: 'Enviar mensagem',
    from: 'De',
    to: 'Para',
    reset: 'Resetar',
    timeline: 'Timeline por processo',
    eventsTable: 'Todos os eventos',
    compare: 'Comparar causalidade',
    selectTwo: 'Selecione dois eventos na tabela',
    relation: 'Relação',
    equal: 'Iguais (mesmo evento)',
    before: 'A acontece antes de B (A → B)',
    after: 'B acontece antes de A (B → A)',
    concurrent: 'A e B são concorrentes',
    legend: 'Legenda',
    local: 'Evento local',
    send: 'Envio de mensagem',
    receive: 'Recebimento de mensagem',
    sourceTitle: 'Motor de relógios lógicos',
    sourceIntro: 'Motor puro em JavaScript client-side — nenhum dado sai do navegador.',
    copy: 'Copiar',
    copied: 'Copiado',
    eventCol: 'Evento',
    processCol: 'Processo',
    typeCol: 'Tipo',
    labelCol: 'Rótulo',
    lamportCol: 'Lamport',
    vectorCol: 'Vector',
    targetCol: 'Destino',
    empty: 'Nenhum evento ainda. Escolha um cenário ou adicione eventos.',
    autoMessage: 'msg auto',
  },
  en: {
    title: 'Logical Clocks Simulator',
    subtitle: 'Lamport Timestamps & Vector Clocks',
    intro:
      'Experiment how distributed processes order events. Add local events and messages between processes to see Lamport timestamps and vector clocks in real time, and test causality relations (happens-before, concurrent).',
    clockMode: 'Clock mode',
    lamport: 'Lamport timestamp',
    vector: 'Vector clock',
    scenario: 'Scenario',
    processes: 'Processes',
    addLocal: 'Local event',
    sendMessage: 'Send message',
    from: 'From',
    to: 'To',
    reset: 'Reset',
    timeline: 'Timeline by process',
    eventsTable: 'All events',
    compare: 'Causality comparison',
    selectTwo: 'Select two events in the table',
    relation: 'Relation',
    equal: 'Equal (same event)',
    before: 'A happens before B (A → B)',
    after: 'B happens before A (B → A)',
    concurrent: 'A and B are concurrent',
    legend: 'Legend',
    local: 'Local event',
    send: 'Message send',
    receive: 'Message receive',
    sourceTitle: 'Logical clocks engine',
    sourceIntro: 'Pure client-side JavaScript engine — no data leaves the browser.',
    copy: 'Copy',
    copied: 'Copied',
    eventCol: 'Event',
    processCol: 'Process',
    typeCol: 'Type',
    labelCol: 'Label',
    lamportCol: 'Lamport',
    vectorCol: 'Vector',
    targetCol: 'Target',
    empty: 'No events yet. Pick a scenario or add events.',
    autoMessage: 'auto msg',
  },
}

const typeColors = {
  [EVENT_TYPES.LOCAL]: 'blue',
  [EVENT_TYPES.SEND]: 'orange',
  [EVENT_TYPES.RECEIVE]: 'green',
}

const typeLabels = {
  pt: {
    [EVENT_TYPES.LOCAL]: 'local',
    [EVENT_TYPES.SEND]: 'send',
    [EVENT_TYPES.RECEIVE]: 'receive',
  },
  en: {
    [EVENT_TYPES.LOCAL]: 'local',
    [EVENT_TYPES.SEND]: 'send',
    [EVENT_TYPES.RECEIVE]: 'receive',
  },
}

function cloneState(state) {
  return {
    processes: state.processes.map((p) => ({ ...p })),
    events: state.events.map((e) => ({ ...e, vector: { ...e.vector } })),
    nextIndex: { ...state.nextIndex },
    lastVector: { ...state.lastVector },
    messageCounter: state.messageCounter,
  }
}

export default function LogicalClocksSimulatorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const initialState = useMemo(() => getScenario('simpleMessage'), [])
  const [state, setState] = useState(initialState)
  const [clockMode, setClockMode] = useState(CLOCK_MODES.VECTOR)
  const [selectedEventIds, setSelectedEventIds] = useState([])
  const [copiedKey, setCopiedKey] = useState(null)
  const [sendFrom, setSendFrom] = useState('')
  const [sendTo, setSendTo] = useState('')

  const byProcess = useMemo(() => eventsByProcess(state), [state])

  const applyScenario = useCallback((key) => {
    const next = getScenario(key)
    setState(next)
    setSelectedEventIds([])
    if (next.processes.length > 1) {
      setSendFrom(next.processes[0].id)
      setSendTo(next.processes[1].id)
    }
  }, [])

  const reset = useCallback(() => {
    const empty = createState(state.processes)
    setState(empty)
    setSelectedEventIds([])
  }, [state.processes])

  const addLocal = useCallback((processId) => {
    setState((prev) => {
      const next = cloneState(prev)
      addLocalEvent(next, processId, 'e')
      return next
    })
  }, [])

  const sendMessage = useCallback(() => {
    if (!sendFrom || !sendTo || sendFrom === sendTo) return
    setState((prev) => {
      const next = cloneState(prev)
      const { sendEvent, messageId, sendVector } = addSendEvent(next, sendFrom, sendTo, t.autoMessage)
      const receiveEvent = addReceiveEvent(next, sendTo, messageId, sendVector, t.autoMessage)
      sendEvent.pairEventId = receiveEvent.id
      receiveEvent.pairEventId = sendEvent.id
      return next
    })
  }, [sendFrom, sendTo, t.autoMessage])

  const copy = useCallback((text, key) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 1500)
  }, [])

  const processOptions = useMemo(() => state.processes.map((p) => ({ value: p.id, label: p.label })), [state.processes])

  const maxIndex = useMemo(() => {
    return Math.max(1, ...state.events.map((e) => e.index))
  }, [state.events])

  const columns = [
    {
      title: t.eventCol,
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: t.processCol,
      dataIndex: 'processId',
      key: 'processId',
      render: (pid) => {
        const p = state.processes.find((x) => x.id === pid)
        return <Tag color={p?.color}>{p?.label || pid}</Tag>
      },
    },
    {
      title: t.typeCol,
      dataIndex: 'type',
      key: 'type',
      render: (type) => <Tag color={typeColors[type]}>{typeLabels[lang][type]}</Tag>,
    },
    {
      title: t.labelCol,
      dataIndex: 'label',
      key: 'label',
    },
    {
      title: t.targetCol,
      dataIndex: 'targetId',
      key: 'targetId',
      render: (targetId, row) =>
        targetId ? (
          <Text type="secondary">
            {row.type === EVENT_TYPES.SEND ? '→' : '←'} {targetId}
          </Text>
        ) : (
          <Text type="secondary">—</Text>
        ),
    },
    {
      title: t.lamportCol,
      dataIndex: 'lamport',
      key: 'lamport',
      render: (v) => <Text code>{v}</Text>,
    },
    {
      title: t.vectorCol,
      dataIndex: 'vector',
      key: 'vector',
      render: (v) => <Text code>{formatVector(v)}</Text>,
    },
  ]

  const rowSelection = {
    selectedRowKeys: selectedEventIds,
    onChange: (keys) => setSelectedEventIds(keys.slice(0, 2)),
    type: 'checkbox',
  }

  const comparison = useMemo(() => {
    if (selectedEventIds.length !== 2) return null
    const a = state.events.find((e) => e.id === selectedEventIds[0])
    const b = state.events.find((e) => e.id === selectedEventIds[1])
    if (!a || !b) return null
    return { relation: compareEvents(a, b), a, b }
  }, [selectedEventIds, state.events])

  const comparisonText = useMemo(() => {
    if (!comparison) return null
    const map = {
      equal: t.equal,
      before: t.before,
      after: t.after,
      concurrent: t.concurrent,
    }
    return map[comparison.relation]
  }, [comparison, t])

  const timelineHeight = 48 + maxIndex * 56

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}>
        <ClockCircleOutlined /> {t.title}
      </Title>
      <Paragraph type="secondary">{t.subtitle}</Paragraph>
      <Paragraph>{t.intro}</Paragraph>

      <Card>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={8}>
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <Text strong>{t.clockMode}</Text>
                <Radio.Group
                  value={clockMode}
                  onChange={(e) => setClockMode(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <Radio.Button value={CLOCK_MODES.LAMPORT}>{t.lamport}</Radio.Button>
                  <Radio.Button value={CLOCK_MODES.VECTOR}>{t.vector}</Radio.Button>
                </Radio.Group>
              </Space>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <Text strong>{t.scenario}</Text>
                <Select
                  style={{ width: '100%' }}
                  defaultValue="simpleMessage"
                  onChange={applyScenario}
                >
                  {Object.entries(PRESETS[lang]).map(([key, { label, description }]) => (
                    <Option key={key} value={key} title={description}>
                      {label}
                    </Option>
                  ))}
                </Select>
              </Space>
            </Col>
          </Row>

          <div>
            <Text strong>{t.addLocal}</Text>
            <Space size={[8, 8]} wrap style={{ marginTop: 8 }}>
              {state.processes.map((p) => (
                <Button key={p.id} size="small" icon={<PlusOutlined />} onClick={() => addLocal(p.id)}>
                  {p.label}
                </Button>
              ))}
            </Space>
          </div>

          <div>
            <Text strong>{t.sendMessage}</Text>
            <Space size={[8, 8]} wrap style={{ marginTop: 8 }}>
              <Select
                value={sendFrom || undefined}
                placeholder={t.from}
                style={{ width: 100 }}
                onChange={setSendFrom}
                options={processOptions}
              />
              <Select
                value={sendTo || undefined}
                placeholder={t.to}
                style={{ width: 100 }}
                onChange={setSendTo}
                options={processOptions}
              />
              <Button type="primary" icon={<SendOutlined />} onClick={sendMessage} disabled={!sendFrom || !sendTo || sendFrom === sendTo}>
                {t.sendMessage}
              </Button>
            </Space>
          </div>

          <Button icon={<ReloadOutlined />} onClick={reset}>
            {t.reset}
          </Button>
        </Space>
      </Card>

      <Card title={t.timeline}>
        {state.events.length === 0 ? (
          <Alert type="info" showIcon message={t.empty} />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <svg
              width="100%"
              height={timelineHeight}
              role="img"
              aria-label={t.timeline}
              style={{ minWidth: 360 }}
            >
              {state.processes.map((p, pIdx) => {
                const y = 32 + pIdx * 56
                return (
                  <g key={p.id}>
                    <text x={8} y={y + 5} fontSize={12} fill="currentColor" fontWeight={600}>
                      {p.label}
                    </text>
                    <line x1={48} y1={y} x2="98%" y2={y} stroke="#d9d9d9" strokeWidth={2} />
                    {byProcess[p.id].map((e, i) => {
                      const cx = 64 + i * 52
                      const display = clockMode === CLOCK_MODES.LAMPORT ? e.lamport : formatVector(e.vector)
                      const isSelected = selectedEventIds.includes(e.id)
                      return (
                        <g key={e.id} style={{ cursor: 'pointer' }} onClick={() => {
                          setSelectedEventIds((prev) => {
                            if (prev.includes(e.id)) return prev.filter((id) => id !== e.id)
                            if (prev.length >= 2) return [prev[1], e.id]
                            return [...prev, e.id]
                          })
                        }}>
                          <circle
                            cx={cx}
                            cy={y}
                            r={isSelected ? 14 : 10}
                            fill={p.color}
                            stroke={isSelected ? '#000' : '#fff'}
                            strokeWidth={isSelected ? 2 : 1}
                          />
                          <text x={cx} y={y + 4} textAnchor="middle" fontSize={9} fill="#fff">
                            {clockMode === CLOCK_MODES.LAMPORT ? display : 'v'}
                          </text>
                          <text x={cx} y={y + 24} textAnchor="middle" fontSize={10} fill="currentColor">
                            {e.id}
                          </text>
                        </g>
                      )
                    })}
                  </g>
                )
              })}
            </svg>
            <Divider />
            <Space size="middle">
              <Text type="secondary">
                <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#1677ff', marginRight: 6 }} />
                {t.local}
              </Text>
              <Text type="secondary">
                <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#faad14', marginRight: 6 }} />
                {t.send}
              </Text>
              <Text type="secondary">
                <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#52c41a', marginRight: 6 }} />
                {t.receive}
              </Text>
            </Space>
          </div>
        )}
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title={t.eventsTable}>
            <Table
              dataSource={state.events}
              columns={columns}
              rowKey="id"
              pagination={false}
              size="small"
              rowSelection={rowSelection}
              scroll={{ x: 'max-content' }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title={t.compare}>
            {comparison ? (
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <div>
                  <Text strong>A:</Text>{' '}
                  <Tag color={comparison.a.type === EVENT_TYPES.LOCAL ? 'blue' : comparison.a.type === EVENT_TYPES.SEND ? 'orange' : 'green'}>
                    {comparison.a.id} ({comparison.a.processId})
                  </Tag>
                  <br />
                  <Text code>{formatVector(comparison.a.vector)}</Text>
                </div>
                <div>
                  <Text strong>B:</Text>{' '}
                  <Tag color={comparison.b.type === EVENT_TYPES.LOCAL ? 'blue' : comparison.b.type === EVENT_TYPES.SEND ? 'orange' : 'green'}>
                    {comparison.b.id} ({comparison.b.processId})
                  </Tag>
                  <br />
                  <Text code>{formatVector(comparison.b.vector)}</Text>
                </div>
                <Alert
                  type={comparison.relation === 'concurrent' ? 'warning' : 'info'}
                  showIcon
                  message={t.relation}
                  description={comparisonText}
                />
              </Space>
            ) : (
              <Alert type="info" showIcon message={t.selectTwo} />
            )}
          </Card>
        </Col>
      </Row>

      <Collapse>
        <Panel header={t.sourceTitle} key="source">
          <Paragraph>{t.sourceIntro}</Paragraph>
          <div style={{ position: 'relative' }}>
            <Button
              size="small"
              icon={<CopyOutlined />}
              style={{ position: 'absolute', top: 8, right: 8 }}
              onClick={() => copy(sourceCode(), 'source')}
            >
              {copiedKey === 'source' ? t.copied : t.copy}
            </Button>
            <pre style={{ margin: 0, overflow: 'auto', padding: 16 }}>
              <code>{sourceCode()}</code>
            </pre>
          </div>
        </Panel>
      </Collapse>
    </Space>
  )
}
