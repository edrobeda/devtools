import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Typography,
  Card,
  Button,
  Space,
  Input,
  Tag,
  Row,
  Col,
  Badge,
  List,
  Collapse,
  Alert,
  Tooltip,
  Select,
  Switch,
} from 'antd'
import {
  ApartmentOutlined,
  StepForwardOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  ReloadOutlined,
  SendOutlined,
  DisconnectOutlined,
  GlobalOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  createInitialState,
  resetState,
  stepSimulation,
  proposeCommand,
  toggleNodeIsolation,
  setPreset,
  sourceCode,
  STATES,
  MESSAGE_TYPES,
} from '../utils/raftSimulator'

const { Title, Paragraph, Text } = Typography
const { Panel } = Collapse
const { Option } = Select

const translations = {
  pt: {
    title: 'Simulador de Raft',
    intro:
      'Visualize passo a passo o algoritmo de consenso Raft 100% no navegador: eleição de líder, heartbeats, replicação de log e partições de rede. Controle cada evento manualmente ou deixe rodar automaticamente.',
    configTitle: 'Controles',
    nodeCountLabel: 'Número de nós',
    stepButton: 'Próximo evento',
    autoPlayButton: 'Auto-play',
    pauseButton: 'Pausar',
    resetButton: 'Resetar',
    proposeButton: 'Propor',
    commandPlaceholder: 'Comando, ex: SET x = 1',
    noLeaderWarning: 'Não há líder no momento. Inicie uma eleição ou aguarde um timeout.',
    presetsTitle: 'Cenários rápidos',
    presetStartup: 'Inicialização + eleição',
    presetLeaderFailure: 'Falha do líder',
    presetPartition: 'Partição de rede',
    presetLogReplication: 'Replicação de log',
    pendingMessages: 'Mensagens pendentes',
    eventLog: 'Log de eventos',
    nodeLog: 'Log do nó',
    stateLabel: 'Estado',
    termLabel: 'Termo',
    votesLabel: 'Votos',
    commitLabel: 'Commit',
    isolateLabel: 'Isolar',
    restoreLabel: 'Restaurar',
    partitionHint:
      'Nós isolados não enviam nem recebem mensagens. Use para simular partições de rede.',
    howItWorks: 'Como funciona',
    howItWorksText:
      'Raft organiza um cluster em torno de um líder eleito. Cada nó começa como follower e, se não ouvir do líder dentro de um timeout aleatório, vira candidato e solicita votos. O candidato com maioria torna-se líder e envia heartbeats periódicos. Para cada comando, o líder acrescenta uma entrada ao log e a replica à maioria; só então o comando é considerado commitado. Se o líder falhar ou for isolado, um novo follower estoura timeout e inicia nova eleição.',
    sourceCode: 'Código-fonte do motor',
    emptyLog: 'Nenhum evento ainda.',
    messageTypes: {
      REQUEST_VOTE: 'Pedir voto',
      REQUEST_VOTE_RESPONSE: 'Resposta de voto',
      APPEND_ENTRIES: 'AppendEntries',
      APPEND_ENTRIES_RESPONSE: 'Resposta AppendEntries',
    },
    states: {
      FOLLOWER: 'Follower',
      CANDIDATE: 'Candidate',
      LEADER: 'Leader',
    },
  },
  en: {
    title: 'Raft Consensus Simulator',
    intro:
      'Step through the Raft consensus algorithm 100% in the browser: leader election, heartbeats, log replication and network partitions. Control each event manually or let it run automatically.',
    configTitle: 'Controls',
    nodeCountLabel: 'Node count',
    stepButton: 'Next event',
    autoPlayButton: 'Auto-play',
    pauseButton: 'Pause',
    resetButton: 'Reset',
    proposeButton: 'Propose',
    commandPlaceholder: 'Command, e.g. SET x = 1',
    noLeaderWarning: 'There is no leader right now. Start an election or wait for a timeout.',
    presetsTitle: 'Quick scenarios',
    presetStartup: 'Startup + election',
    presetLeaderFailure: 'Leader failure',
    presetPartition: 'Network partition',
    presetLogReplication: 'Log replication',
    pendingMessages: 'Pending messages',
    eventLog: 'Event log',
    nodeLog: 'Node log',
    stateLabel: 'State',
    termLabel: 'Term',
    votesLabel: 'Votes',
    commitLabel: 'Commit',
    isolateLabel: 'Isolate',
    restoreLabel: 'Restore',
    partitionHint:
      'Isolated nodes cannot send or receive messages. Use this to simulate network partitions.',
    howItWorks: 'How it works',
    howItWorksText:
      'Raft organizes a cluster around an elected leader. Every node starts as a follower; if it does not hear from the leader within a random timeout, it becomes a candidate and asks for votes. The candidate with a majority becomes leader and sends periodic heartbeats. For every command, the leader appends an entry to its log and replicates it to a majority; only then is the command considered committed. If the leader fails or is isolated, a new follower times out and starts a new election.',
    sourceCode: 'Engine source code',
    emptyLog: 'No events yet.',
    messageTypes: {
      REQUEST_VOTE: 'RequestVote',
      REQUEST_VOTE_RESPONSE: 'Vote response',
      APPEND_ENTRIES: 'AppendEntries',
      APPEND_ENTRIES_RESPONSE: 'AppendEntries response',
    },
    states: {
      FOLLOWER: 'Follower',
      CANDIDATE: 'Candidate',
      LEADER: 'Leader',
    },
  },
}

const STATE_COLORS = {
  [STATES.FOLLOWER]: 'default',
  [STATES.CANDIDATE]: 'processing',
  [STATES.LEADER]: 'success',
}

export default function RaftSimulatorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [nodeCount, setNodeCount] = useState(5)
  const [state, setState] = useState(() => createInitialState(5))
  const [autoPlay, setAutoPlay] = useState(false)
  const [command, setCommand] = useState('')

  // auto-play seguro: usa callback do setState e depende só da flag
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
    const count = Math.max(3, Math.min(7, Number(value) || 5))
    setNodeCount(count)
    setAutoPlay(false)
    setState(resetState(count))
  }, [])

  const handlePropose = useCallback(() => {
    const cmd = command.trim()
    if (!cmd) return
    setState((prev) => {
      const next = proposeCommand(prev, cmd)
      return next === prev ? next : { ...next, step: next.step + 1 }
    })
    setCommand('')
  }, [command])

  const handleToggleIsolation = useCallback((id) => {
    setState((prev) => toggleNodeIsolation(prev, id))
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
    () => state.nodes.some((n) => n.state === STATES.LEADER),
    [state.nodes]
  )

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div>
        <Title level={2}>
          <ApartmentOutlined style={{ marginRight: 8 }} />
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
                      {[3, 4, 5, 6, 7].map((n) => (
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
                  </Space>
                </Col>
              </Row>

              <Space wrap style={{ width: '100%' }}>
                <Input
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                  placeholder={t.commandPlaceholder}
                  onPressEnter={handlePropose}
                  style={{ width: 240 }}
                  disabled={!leaderExists}
                />
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={handlePropose}
                  disabled={!leaderExists}
                >
                  {t.proposeButton}
                </Button>
              </Space>

              {!leaderExists && (
                <Alert message={t.noLeaderWarning} type="warning" showIcon />
              )}
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title={t.presetsTitle}>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              {[
                { key: 'startup', label: t.presetStartup },
                { key: 'leader-failure', label: t.presetLeaderFailure },
                { key: 'partition', label: t.presetPartition },
                { key: 'log-replication', label: t.presetLogReplication },
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
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 12,
              flexWrap: 'wrap',
              padding: '12px 0',
            }}
          >
            {state.nodes.map((node) => (
              <div
                key={node.id}
                style={{
                  width: 130,
                  border: `2px solid ${node.color}`,
                  borderRadius: 10,
                  padding: 10,
                  background: node.isolated ? '#fff2f0' : '#f6ffed',
                  opacity: node.isolated ? 0.7 : 1,
                  textAlign: 'center',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: 16 }}>N{node.id}</div>
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
                <div style={{ fontSize: 12, marginTop: 4, color: '#595959' }}>
                  {t.termLabel}: {node.term}
                  {node.state === STATES.CANDIDATE && (
                    <span style={{ marginLeft: 8 }}>
                      {t.votesLabel}: {node.votesReceived}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: '#595959' }}>
                  {t.commitLabel}: {node.commitIndex}
                </div>
                <div
                  style={{
                    marginTop: 6,
                    fontSize: 11,
                    color: '#8c8c8c',
                    minHeight: 18,
                  }}
                >
                  {node.log.length > 0
                    ? `${node.log.length} ${node.log.length === 1 ? 'entrada' : 'entradas'}`
                    : '—'}
                </div>
                <div style={{ marginTop: 6 }}>
                  <Switch
                    size="small"
                    checked={node.isolated}
                    onChange={() => handleToggleIsolation(node.id)}
                    checkedChildren={<DisconnectOutlined />}
                    unCheckedChildren={<GlobalOutlined />}
                  />
                  <Text style={{ marginLeft: 6, fontSize: 11 }}>
                    {node.isolated ? t.restoreLabel : t.isolateLabel}
                  </Text>
                </div>
              </div>
            ))}
          </div>
          <Alert message={t.partitionHint} type="info" showIcon />
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
                    <Tag color="blue">{t.messageTypes[m.type] || m.type}</Tag>
                    <Text style={{ fontSize: 12 }}>
                      N{m.from} → N{m.to} (term {m.term})
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

      <Card title={t.nodeLog}>
        <Row gutter={[16, 16]}>
          {state.nodes.map((node) => (
            <Col key={node.id} xs={24} sm={12} md={8} lg={6}>
              <div
                style={{
                  border: '1px solid #f0f0f0',
                  borderRadius: 8,
                  padding: 12,
                  background: '#fafafa',
                }}
              >
                <Text strong style={{ color: node.color }}>
                  N{node.id}
                </Text>
                <div style={{ marginTop: 8, fontSize: 12 }}>
                  {node.log.length === 0 ? (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {t.emptyLog}
                    </Text>
                  ) : (
                    <ul style={{ margin: 0, paddingLeft: 16 }}>
                      {node.log.map((entry, idx) => (
                        <li key={idx}>
                          <Text
                            style={{
                              fontSize: 11,
                              color:
                                idx < node.commitIndex ? '#52c41a' : '#595959',
                            }}
                          >
                            {entry.index}:{entry.term} {entry.command}
                          </Text>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </Col>
          ))}
        </Row>
      </Card>

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
