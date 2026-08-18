import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Typography,
  Card,
  Button,
  Space,
  Tag,
  Row,
  Col,
  Badge,
  List,
  Collapse,
  Alert,
  Select,
  Switch,
} from 'antd'
import {
  TrophyOutlined,
  StepForwardOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  ReloadOutlined,
  ThunderboltOutlined,
  CloseCircleOutlined,
  CheckCircleOutlined,
  ApartmentOutlined,
  SyncOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  createInitialState,
  resetState,
  stepSimulation,
  startElection,
  toggleNodeFailure,
  setPreset,
  sourceCode,
  STATES,
  MESSAGE_TYPES,
  nextActiveNode,
} from '../utils/ringElectionSimulator'

const { Title, Paragraph, Text } = Typography
const { Panel } = Collapse
const { Option } = Select

const translations = {
  pt: {
    title: 'Simulador de Eleição em Anel',
    intro:
      'Visualize passo a passo o algoritmo de Chang-Roberts para eleição de líder em sistemas distribuídos 100% no navegador. Os nós formam um anel lógico; a mensagem de eleição circula até o maior ID ativo se reconhecer como líder.',
    configTitle: 'Controles',
    nodeCountLabel: 'Número de nós',
    stepButton: 'Próximo evento',
    autoPlayButton: 'Auto-play',
    pauseButton: 'Pausar',
    resetButton: 'Resetar',
    startElectionButton: 'Iniciar eleição',
    presetsTitle: 'Cenários rápidos',
    presetElection: 'Eleição simples',
    presetLeaderFailure: 'Falha do líder',
    presetHighestRecovers: 'Maior ID falha e recupera',
    presetMidFailure: 'Falha no meio do anel',
    presetTwoNodes: 'Anel com 2 nós',
    pendingMessages: 'Mensagens no anel',
    eventLog: 'Log de eventos',
    stateLabel: 'Estado',
    priorityLabel: 'Prioridade (ID)',
    leaderLabel: 'Líder',
    nextLabel: 'Próximo ativo',
    failSwitch: 'Falhar',
    recoverSwitch: 'Recuperar',
    noLeader: 'Sem líder',
    howItWorks: 'Como funciona',
    howItWorksText:
      'No algoritmo de eleição em anel (Chang-Roberts), cada processo conhece apenas seu vizinho seguinte no anel. Quando uma eleição começa, um nó envia uma mensagem ELECTION com seu próprio ID. Ao receber uma mensagem, o nó compara o ID recebido com o seu: se for maior, repassa adiante; se for menor, descarta e envia seu próprio ID; se for igual a si mesmo, deu a volta completa e ele é o líder. O líder então envia uma mensagem COORDINATOR pelo anel para que todos saibam quem venceu. No pior caso a mensagem pode dar até N voltas, resultando em O(N²) mensagens trocadas.',
    sourceCode: 'Código-fonte do motor',
    emptyLog: 'Nenhum evento ainda.',
    messageTypes: {
      ELECTION: 'ELECTION',
      COORDINATOR: 'COORDINATOR',
    },
    states: {
      NORMAL: 'Normal',
      ELECTION: 'Em eleição',
      LEADER: 'Líder',
      FAILED: 'Falho',
    },
  },
  en: {
    title: 'Ring Election Simulator',
    intro:
      'Step through the Chang-Roberts leader-election algorithm for distributed systems 100% in the browser. Nodes form a logical ring; the election message circulates until the highest active ID recognizes itself as leader.',
    configTitle: 'Controls',
    nodeCountLabel: 'Node count',
    stepButton: 'Next event',
    autoPlayButton: 'Auto-play',
    pauseButton: 'Pause',
    resetButton: 'Reset',
    startElectionButton: 'Start election',
    presetsTitle: 'Quick scenarios',
    presetElection: 'Simple election',
    presetLeaderFailure: 'Leader failure',
    presetHighestRecovers: 'Highest ID fails and recovers',
    presetMidFailure: 'Mid-ring failure',
    presetTwoNodes: 'Two-node ring',
    pendingMessages: 'Messages in the ring',
    eventLog: 'Event log',
    stateLabel: 'State',
    priorityLabel: 'Priority (ID)',
    leaderLabel: 'Leader',
    nextLabel: 'Next active',
    failSwitch: 'Fail',
    recoverSwitch: 'Recover',
    noLeader: 'No leader',
    howItWorks: 'How it works',
    howItWorksText:
      'In the ring election algorithm (Chang-Roberts), each process knows only its next neighbor in the ring. When an election starts, a node sends an ELECTION message containing its own ID. Upon receiving a message, the node compares the received ID with its own: if higher, it forwards it; if lower, it discards the message and sends its own ID; if equal to itself, the message has made a full round and this node is the leader. The leader then sends a COORDINATOR message around the ring so everyone knows the winner. In the worst case the message may travel up to N rounds, resulting in O(N²) messages exchanged.',
    sourceCode: 'Engine source code',
    emptyLog: 'No events yet.',
    messageTypes: {
      ELECTION: 'ELECTION',
      COORDINATOR: 'COORDINATOR',
    },
    states: {
      NORMAL: 'Normal',
      ELECTION: 'In election',
      LEADER: 'Leader',
      FAILED: 'Failed',
    },
  },
}

const STATE_COLORS = {
  [STATES.NORMAL]: 'default',
  [STATES.ELECTION]: 'processing',
  [STATES.LEADER]: 'success',
  [STATES.FAILED]: 'error',
}

function nodePositions(count, radius, centerX, centerY) {
  return Array.from({ length: count }, (_, i) => {
    const angle = (2 * Math.PI * i) / count - Math.PI / 2
    return {
      id: i,
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    }
  })
}

export default function RingElectionSimulatorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [nodeCount, setNodeCount] = useState(5)
  const [state, setState] = useState(() => createInitialState(5))
  const [autoPlay, setAutoPlay] = useState(false)

  useEffect(() => {
    if (!autoPlay) return
    const id = setInterval(() => {
      setState((prev) => stepSimulation(prev) || prev)
    }, 750)
    return () => clearInterval(id)
  }, [autoPlay])

  const handleStep = useCallback(() => {
    setState((prev) => stepSimulation(prev) || prev)
  }, [])

  const handleReset = useCallback(() => {
    setAutoPlay(false)
    setState(resetState(nodeCount))
  }, [nodeCount])

  const handleNodeCountChange = useCallback((value) => {
    const count = Math.max(2, Math.min(7, Number(value) || 5))
    setNodeCount(count)
    setAutoPlay(false)
    setState(resetState(count))
  }, [])

  const handleStartElection = useCallback(() => {
    const active = state.nodes.filter((n) => !n.failed)
    if (active.length === 0) return
    const lowest = active.reduce((a, b) => (a.id < b.id ? a : b))
    setState((prev) => startElection(prev, lowest.id))
  }, [state.nodes])

  const handleToggleFailure = useCallback((id) => {
    setAutoPlay(false)
    setState((prev) => toggleNodeFailure(prev, id))
  }, [])

  const handlePreset = useCallback((preset) => {
    setAutoPlay(false)
    setState(setPreset(preset, nodeCount))
  }, [nodeCount])

  const pending = useMemo(
    () => state.messages.filter((m) => !m.delivered),
    [state.messages]
  )

  const leaderExists = useMemo(
    () => state.nodes.some((n) => n.state === STATES.LEADER && !n.failed),
    [state.nodes]
  )

  const positions = useMemo(
    () => nodePositions(state.nodes.length, 130, 200, 160),
    [state.nodes.length]
  )

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div>
        <Title level={2}>
          <SyncOutlined style={{ marginRight: 8 }} />
          {t.title}
        </Title>
        <Paragraph>{t.intro}</Paragraph>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title={t.configTitle}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Row gutter={[16, 16]} align="middle">
                <Col xs={12} sm={8}>
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <Text strong>{t.nodeCountLabel}</Text>
                    <Select
                      value={nodeCount}
                      onChange={handleNodeCountChange}
                      style={{ width: '100%' }}
                    >
                      {[2, 3, 4, 5, 6, 7].map((n) => (
                        <Option key={n} value={n}>
                          {n}
                        </Option>
                      ))}
                    </Select>
                  </Space>
                </Col>
                <Col xs={12} sm={16}>
                  <Space wrap>
                    <Button
                      type="primary"
                      icon={<StepForwardOutlined />}
                      onClick={handleStep}
                    >
                      {t.stepButton}
                    </Button>
                    <Button
                      icon={autoPlay ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                      onClick={() => setAutoPlay((v) => !v)}
                    >
                      {autoPlay ? t.pauseButton : t.autoPlayButton}
                    </Button>
                    <Button icon={<ReloadOutlined />} onClick={handleReset}>
                      {t.resetButton}
                    </Button>
                    <Button icon={<ThunderboltOutlined />} onClick={handleStartElection}>
                      {t.startElectionButton}
                    </Button>
                  </Space>
                </Col>
              </Row>

              {!leaderExists && (
                <Alert
                  message={t.noLeader}
                  type="warning"
                  showIcon
                  icon={<CloseCircleOutlined />}
                />
              )}
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title={t.presetsTitle}>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              {[
                { key: 'election', label: t.presetElection },
                { key: 'leader-failure', label: t.presetLeaderFailure },
                { key: 'highest-recovers', label: t.presetHighestRecovers },
                { key: 'mid-failure', label: t.presetMidFailure },
                { key: 'two-nodes', label: t.presetTwoNodes },
              ].map((p) => (
                <Button key={p.key} block onClick={() => handlePreset(p.key)}>
                  {p.label}
                </Button>
              ))}
            </Space>
          </Card>
        </Col>
      </Row>

      <Card>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <svg width={400} height={320} viewBox="0 0 400 320" role="img" aria-label="ring">
              {/* anel */}
              <circle
                cx={200}
                cy={160}
                r={130}
                fill="none"
                stroke="#d9d9d9"
                strokeWidth={2}
                strokeDasharray="8 6"
              />

              {/* mensagens pendentes como setas ao longo do anel */}
              {pending.map((m) => {
                const fromPos = positions[m.from]
                const toPos = positions[m.to]
                if (!fromPos || !toPos) return null
                const mx = (fromPos.x + toPos.x) / 2
                const my = (fromPos.y + toPos.y) / 2
                return (
                  <g key={m.id}>
                    <defs>
                      <marker id={`arrow-${m.id}`} markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto" markerUnits="strokeWidth">
                        <path d="M0,0 L0,6 L9,3 z" fill={m.type === MESSAGE_TYPES.ELECTION ? '#1677ff' : '#52c41a'} />
                      </marker>
                    </defs>
                    <line
                      x1={fromPos.x}
                      y1={fromPos.y}
                      x2={toPos.x}
                      y2={toPos.y}
                      stroke={m.type === MESSAGE_TYPES.ELECTION ? '#1677ff' : '#52c41a'}
                      strokeWidth={2}
                      markerEnd={`url(#arrow-${m.id})`}
                    />
                    <g transform={`translate(${mx} ${my})`}>
                      <rect
                        x={-42}
                        y={-12}
                        width={84}
                        height={20}
                        rx={4}
                        fill="rgba(255,255,255,0.9)"
                        stroke={m.type === MESSAGE_TYPES.ELECTION ? '#1677ff' : '#52c41a'}
                        strokeWidth={1}
                      />
                      <text
                        x={0}
                        y={3}
                        textAnchor="middle"
                        fontSize={10}
                        fill={m.type === MESSAGE_TYPES.ELECTION ? '#1677ff' : '#52c41a'}
                        fontWeight={600}
                      >
                        {m.type}({m.candidateId})
                      </text>
                    </g>
                  </g>
                )
              })}

              {/* nós */}
              {state.nodes.map((node) => {
                const pos = positions[node.id]
                const nextId = nextActiveNode(state, node.id)
                return (
                  <g key={node.id} transform={`translate(${pos.x} ${pos.y})`}>
                    <circle
                      r={28}
                      fill={node.failed ? '#f5f5f5' : node.state === STATES.LEADER ? '#f6ffed' : '#ffffff'}
                      stroke={node.failed ? '#d9d9d9' : node.color}
                      strokeWidth={node.state === STATES.LEADER ? 4 : 2}
                      opacity={node.failed ? 0.7 : 1}
                    />
                    <text y={-4} textAnchor="middle" fontSize={12} fontWeight={700} fill={node.failed ? '#8c8c8c' : '#262626'}>
                      N{node.id}
                    </text>
                    <text y={10} textAnchor="middle" fontSize={9} fill="#595959">
                      ID {node.priority}
                    </text>
                    {node.state === STATES.LEADER && (
                      <text y={-34} textAnchor="middle" fontSize={10} fill="#52c41a" fontWeight={700}>
                        ★
                      </text>
                    )}
                  </g>
                )
              })}
            </svg>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            {state.nodes.map((node) => {
              const nextId = nextActiveNode(state, node.id)
              return (
                <div
                  key={node.id}
                  style={{
                    width: 120,
                    border: `2px solid ${node.failed ? '#d9d9d9' : node.color}`,
                    borderRadius: 10,
                    padding: 10,
                    background: node.failed ? '#f5f5f5' : '#ffffff',
                    opacity: node.failed ? 0.6 : 1,
                    textAlign: 'center',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: 16 }}>N{node.id}</div>
                  <div style={{ fontSize: 12, color: '#595959' }}>
                    {t.priorityLabel}: {node.priority}
                  </div>
                  <div style={{ marginTop: 4 }}>
                    <Badge
                      status={STATE_COLORS[node.state]}
                      text={
                        <Text strong style={{ fontSize: 12 }}>
                          {t.states[node.state]}
                        </Text>
                      }
                    />
                  </div>
                  <div style={{ fontSize: 11, marginTop: 4, color: '#595959' }}>
                    {node.leaderId !== null && !node.failed ? (
                      <span>
                        {t.leaderLabel}: N{node.leaderId}
                      </span>
                    ) : (
                      '—'
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: '#8c8c8c' }}>
                    {t.nextLabel}: {nextId !== null ? `N${nextId}` : '—'}
                  </div>
                  <div style={{ marginTop: 6 }}>
                    <Switch
                      size="small"
                      checked={node.failed}
                      onChange={() => handleToggleFailure(node.id)}
                      checkedChildren={<CloseCircleOutlined />}
                      unCheckedChildren={<CheckCircleOutlined />}
                    />
                    <Text style={{ marginLeft: 6, fontSize: 11 }}>
                      {node.failed ? t.recoverSwitch : t.failSwitch}
                    </Text>
                  </div>
                </div>
              )
            })}
          </div>
        </Space>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title={t.pendingMessages}>
            {pending.length === 0 ? (
              <Text type="secondary">{t.emptyLog}</Text>
            ) : (
              <List
                size="small"
                dataSource={pending}
                renderItem={(m) => (
                  <List.Item>
                    <Tag color={m.type === MESSAGE_TYPES.ELECTION ? 'blue' : 'green'}>
                      {t.messageTypes[m.type] || m.type}({m.candidateId})
                    </Tag>
                    <Text style={{ fontSize: 12 }}>
                      N{m.from} → N{m.to}
                    </Text>
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title={t.eventLog}>
            {state.log.length === 0 ? (
              <Text type="secondary">{t.emptyLog}</Text>
            ) : (
              <List
                size="small"
                dataSource={state.log.slice(0, 50)}
                renderItem={(entry) => (
                  <List.Item>
                    <Text style={{ fontSize: 12 }}>
                      <Tag color="default">#{entry.step}</Tag> {entry.text}
                    </Text>
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
      </Row>

      <Alert message={t.howItWorks} description={t.howItWorksText} type="info" showIcon />

      <Collapse>
        <Panel header={t.sourceCode} key="source">
          <pre style={{ fontSize: 12 }}>
            <code>{sourceCode()}</code>
          </pre>
        </Panel>
      </Collapse>
    </Space>
  )
}
