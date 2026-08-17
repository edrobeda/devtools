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
  ApartmentOutlined,
  ThunderboltOutlined,
  CloseCircleOutlined,
  CheckCircleOutlined,
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
} from '../utils/bullyAlgorithmSimulator'

const { Title, Paragraph, Text } = Typography
const { Panel } = Collapse
const { Option } = Select

const translations = {
  pt: {
    title: 'Simulador do Algoritmo do Bully',
    intro:
      'Visualize passo a passo o clássico algoritmo de eleição de líder em sistemas distribuídos 100% no navegador. O nó com o maior ID entre os ativos sempre vence; falhe e recupere nós para ver novas eleições.',
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
    presetHighestRecovers: 'Maior ID recupera',
    presetPartition: 'Falha múltipla',
    presetTieBreak: 'Empate 2 nós',
    pendingMessages: 'Mensagens pendentes',
    eventLog: 'Log de eventos',
    stateLabel: 'Estado',
    priorityLabel: 'Prioridade (ID)',
    leaderLabel: 'Líder',
    failSwitch: 'Falhar',
    recoverSwitch: 'Recuperar',
    noLeader: 'Sem líder',
    howItWorks: 'Como funciona',
    howItWorksText:
      'No Algoritmo do Bully, cada processo tem um ID único e o processo ativo de maior ID é eleito coordenador. Quando um processo detecta que o líder sumiu, ele envia uma mensagem ELECTION para todos os processos de ID maior. Se algum responder ALIVE, o solicitante desiste. Se ninguém responder, ele se autodeclara líder e anuncia COORDINATOR aos demais. Se um processo de ID maior recuperar, ele inicia nova eleição e toma a liderança.',
    sourceCode: 'Código-fonte do motor',
    emptyLog: 'Nenhum evento ainda.',
    messageTypes: {
      ELECTION: 'ELECTION',
      ALIVE: 'ALIVE',
      COORDINATOR: 'COORDINATOR',
    },
    states: {
      NORMAL: 'Normal',
      ELECTION: 'Em eleição',
      WAITING: 'Aguardando',
      LEADER: 'Líder',
      FAILED: 'Falho',
    },
  },
  en: {
    title: 'Bully Algorithm Simulator',
    intro:
      'Step through the classic leader-election algorithm for distributed systems 100% in the browser. The active node with the highest ID always wins; fail and recover nodes to watch new elections.',
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
    presetHighestRecovers: 'Highest ID recovers',
    presetPartition: 'Multiple failures',
    presetTieBreak: 'Two-node tie',
    pendingMessages: 'Pending messages',
    eventLog: 'Event log',
    stateLabel: 'State',
    priorityLabel: 'Priority (ID)',
    leaderLabel: 'Leader',
    failSwitch: 'Fail',
    recoverSwitch: 'Recover',
    noLeader: 'No leader',
    howItWorks: 'How it works',
    howItWorksText:
      "In the Bully Algorithm, every process has a unique ID and the highest active ID is elected coordinator. When a process detects the leader is gone, it sends an ELECTION message to every higher-ID process. If any replies ALIVE, the requester gives up. If no one replies, it declares itself leader and broadcasts COORDINATOR to everyone else. If a higher-ID process recovers, it starts a new election and takes over.",
    sourceCode: 'Engine source code',
    emptyLog: 'No events yet.',
    messageTypes: {
      ELECTION: 'ELECTION',
      ALIVE: 'ALIVE',
      COORDINATOR: 'COORDINATOR',
    },
    states: {
      NORMAL: 'Normal',
      ELECTION: 'In election',
      WAITING: 'Waiting',
      LEADER: 'Leader',
      FAILED: 'Failed',
    },
  },
}

const STATE_COLORS = {
  [STATES.NORMAL]: 'default',
  [STATES.ELECTION]: 'processing',
  [STATES.WAITING]: 'warning',
  [STATES.LEADER]: 'success',
  [STATES.FAILED]: 'error',
}

export default function BullyAlgorithmSimulatorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [nodeCount, setNodeCount] = useState(5)
  const [state, setState] = useState(() => createInitialState(5))
  const [autoPlay, setAutoPlay] = useState(false)

  // auto-play seguro
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

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div>
        <Title level={2}>
          <TrophyOutlined style={{ marginRight: 8 }} />
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
                { key: 'partition', label: t.presetPartition },
                { key: 'tie-break', label: t.presetTieBreak },
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
                  border: `2px solid ${node.failed ? '#d9d9d9' : node.color}`,
                  borderRadius: 10,
                  padding: 10,
                  background: node.failed ? '#f5f5f5' : '#f6ffed',
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
                <div style={{ fontSize: 12, marginTop: 4, color: '#595959' }}>
                  {node.state === STATES.LEADER ? (
                    <span>
                      <CheckCircleOutlined style={{ color: '#52c41a' }} /> {t.leaderLabel}
                    </span>
                  ) : node.leaderId !== null && !node.failed ? (
                    <span>
                      {t.leaderLabel}: N{node.leaderId}
                    </span>
                  ) : (
                    '—'
                  )}
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
            ))}
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
                    <Tag color="blue">{t.messageTypes[m.type] || m.type}</Tag>
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
