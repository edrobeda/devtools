import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Typography,
  Card,
  Space,
  Button,
  Row,
  Col,
  Tag,
  Statistic,
  Collapse,
  Alert,
  List,
  Slider,
  Switch,
  Empty,
  InputNumber,
  Select,
  Tooltip,
  Badge,
} from 'antd'
import {
  ApartmentOutlined,
  StepForwardOutlined,
  RedoOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  CopyOutlined,
  ThunderboltOutlined,
  CheckOutlined,
  CloseOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  STATES,
  PHASES,
  DECISIONS,
  PRESETS,
  defaultConfig,
  createSimulation,
  step,
  resetSimulation,
  crashNode,
  recoverNode,
  stateColor,
  decisionColor,
  sourceCode,
} from '../utils/twoPhaseCommitSimulator'

const { Title, Paragraph, Text } = Typography
const { Panel } = Collapse
const { Option } = Select

const translations = {
  pt: {
    title: 'Simulador de Two-Phase Commit',
    intro:
      'Experimente o protocolo Two-Phase Commit (2PC) 100% no navegador. Acompanhe as fases de preparacao e decisao entre um coordenador e varios participantes, veja como votos, falhas e recuperacao determinam se uma transacao distribuida faz COMMIT ou ABORT.',
    configTitle: 'Configuracao',
    participantsLabel: 'Numero de participantes',
    voteLabel: 'Voto',
    crashPrepareLabel: 'Cai no prepare',
    crashDecisionLabel: 'Cai no decision',
    coordinatorCrashLabel: 'Falha do coordenador',
    coordinatorCrashNone: 'Nenhuma',
    coordinatorCrashBefore: 'Antes da decisao',
    coordinatorCrashAfter: 'Depois da decisao',
    applyConfig: 'Aplicar e reiniciar',
    presetsTitle: 'Cenarios rapidos',
    stateTitle: 'Estado dos nos',
    coordinator: 'Coordenador',
    participant: 'Participante',
    phaseTitle: 'Fase atual',
    decisionTitle: 'Decisao do coordenador',
    actionsTitle: 'Acoes manuais',
    stepButton: 'Proximo passo',
    resetButton: 'Reiniciar',
    crashButton: 'Derrubar',
    recoverButton: 'Recuperar',
    autoTitle: 'Simulacao automatica',
    autoToggle: 'Avancar passos sozinho',
    intervalLabel: 'Intervalo entre passos (ms)',
    statsTitle: 'Estatisticas',
    started: 'Iniciadas',
    committed: 'Commits',
    aborted: 'Aborts',
    crashed: 'Caidos',
    logTitle: 'Log de mensagens',
    noLog: 'Nenhuma mensagem ainda.',
    explanationTitle: 'Como funciona',
    explanation: (
      <>
        O <Text code>Two-Phase Commit</Text> garante atomicidade em transacoes distribuidas.
        Na <Text code>fase 1</Text> o coordenador envia <Text code>PREPARE</Text> e cada participante
        vota <Text code>YES</Text> ou <Text code>NO</Text>. Na <Text code>fase 2</Text>, se todos
        votaram YES, o coordenador envia <Text code>COMMIT</Text>; caso contrario envia{' '}
        <Text code>ABORT</Text>. Os participantes aplicam e respondem <Text code>ACK</Text>.
        Falhas antes da decisao podem bloquear nos ate a recuperacao do coordenador.
      </>
    ),
    sourceCode: 'Codigo-fonte do motor',
    copy: 'Copiar',
    copied: 'Copiado',
    milliseconds: 'ms',
    finished: 'Transacao finalizada',
    running: 'Executando...',
  },
  en: {
    title: 'Two-Phase Commit Simulator',
    intro:
      'Experiment with the Two-Phase Commit (2PC) protocol 100% in the browser. Follow the prepare and decision phases between a coordinator and multiple participants, and see how votes, crashes, and recovery determine whether a distributed transaction commits or aborts.',
    configTitle: 'Configuration',
    participantsLabel: 'Number of participants',
    voteLabel: 'Vote',
    crashPrepareLabel: 'Crash on prepare',
    crashDecisionLabel: 'Crash on decision',
    coordinatorCrashLabel: 'Coordinator failure',
    coordinatorCrashNone: 'None',
    coordinatorCrashBefore: 'Before decision',
    coordinatorCrashAfter: 'After decision',
    applyConfig: 'Apply & restart',
    presetsTitle: 'Quick scenarios',
    stateTitle: 'Node states',
    coordinator: 'Coordinator',
    participant: 'Participant',
    phaseTitle: 'Current phase',
    decisionTitle: 'Coordinator decision',
    actionsTitle: 'Manual actions',
    stepButton: 'Next step',
    resetButton: 'Reset',
    crashButton: 'Crash',
    recoverButton: 'Recover',
    autoTitle: 'Automatic simulation',
    autoToggle: 'Auto-advance steps',
    intervalLabel: 'Interval between steps (ms)',
    statsTitle: 'Statistics',
    started: 'Started',
    committed: 'Committed',
    aborted: 'Aborted',
    crashed: 'Crashed',
    logTitle: 'Message log',
    noLog: 'No messages yet.',
    explanationTitle: 'How it works',
    explanation: (
      <>
        The <Text code>Two-Phase Commit</Text> protocol ensures atomicity in distributed transactions.
        In <Text code>phase 1</Text> the coordinator sends <Text code>PREPARE</Text> and each participant
        votes <Text code>YES</Text> or <Text code>NO</Text>. In <Text code>phase 2</Text>, if everyone
        voted YES, the coordinator sends <Text code>COMMIT</Text>; otherwise it sends{' '}
        <Text code>ABORT</Text>. Participants apply the decision and reply with <Text code>ACK</Text>.
        Failures before the decision can block nodes until the coordinator recovers.
      </>
    ),
    sourceCode: 'Engine source code',
    copy: 'Copy',
    copied: 'Copied',
    milliseconds: 'ms',
    finished: 'Transaction finished',
    running: 'Running...',
  },
}

export default function TwoPhaseCommitSimulatorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const presets = PRESETS[lang]

  const [participantCount, setParticipantCount] = useState(defaultConfig().participantCount)
  const [votes, setVotes] = useState(defaultConfig().votes)
  const [crashPrepare, setCrashPrepare] = useState(defaultConfig().crashPrepare)
  const [crashDecision, setCrashDecision] = useState(defaultConfig().crashDecision)
  const [coordinatorCrashes, setCoordinatorCrashes] = useState(defaultConfig().coordinatorCrashes)

  const config = useMemo(
    () => ({
      participantCount,
      votes: votes.slice(0, participantCount),
      crashPrepare: crashPrepare.slice(0, participantCount),
      crashDecision: crashDecision.slice(0, participantCount),
      coordinatorCrashes,
    }),
    [participantCount, votes, crashPrepare, crashDecision, coordinatorCrashes]
  )

  const [sim, setSim] = useState(() => createSimulation(config))
  const [autoRun, setAutoRun] = useState(false)
  const [autoInterval, setAutoInterval] = useState(800)
  const [copied, setCopied] = useState(false)

  const applyConfig = useCallback(() => {
    setSim(createSimulation(config))
  }, [config])

  const applyPreset = useCallback((preset) => {
    setParticipantCount(preset.participants)
    setVotes(preset.votes.slice())
    setCrashPrepare(preset.crashPrepare.slice())
    setCrashDecision(preset.crashDecision.slice())
    setCoordinatorCrashes(preset.coordinatorCrashes)
    setSim(
      createSimulation({
        participantCount: preset.participants,
        votes: preset.votes.slice(),
        crashPrepare: preset.crashPrepare.slice(),
        crashDecision: preset.crashDecision.slice(),
        coordinatorCrashes: preset.coordinatorCrashes,
      })
    )
  }, [])

  const doStep = useCallback(() => {
    setSim((prev) => {
      if (prev.finished) return prev
      return step(prev)
    })
  }, [])

  const reset = useCallback(() => {
    setSim(resetSimulation(config))
  }, [config])

  const toggleCrash = useCallback((nodeId) => {
    setSim((prev) => {
      const isCrashed = nodeId === 'C' ? prev.coordinator.crashed : prev.participants.find((p) => p.id === nodeId)?.crashed
      return isCrashed ? recoverNode(prev, nodeId) : crashNode(prev, nodeId)
    })
  }, [])

  useEffect(() => {
    if (!autoRun) return undefined
    const id = setInterval(() => {
      setSim((prev) => {
        if (prev.finished) return prev
        return step(prev)
      })
    }, autoInterval)
    return () => clearInterval(id)
  }, [autoRun, autoInterval])

  useEffect(() => {
    if (sim.finished) setAutoRun(false)
  }, [sim.finished])

  const copySource = useCallback(() => {
    navigator.clipboard.writeText(sourceCode()).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }, [])

  const phaseLabel = useMemo(() => {
    const labels = {
      pt: {
        [PHASES.IDLE]: 'Ocioso',
        [PHASES.PREPARE_SENT]: 'PREPARE enviado',
        [PHASES.VOTES_RECEIVED]: 'Votos recebidos',
        [PHASES.DECISION_MADE]: 'Decisao tomada',
        [PHASES.DECISION_DELIVERED]: 'Decisao entregue',
        [PHASES.DONE]: 'Finalizado',
      },
      en: {
        [PHASES.IDLE]: 'Idle',
        [PHASES.PREPARE_SENT]: 'PREPARE sent',
        [PHASES.VOTES_RECEIVED]: 'Votes received',
        [PHASES.DECISION_MADE]: 'Decision made',
        [PHASES.DECISION_DELIVERED]: 'Decision delivered',
        [PHASES.DONE]: 'Done',
      },
    }
    return labels[lang][sim.phase] || sim.phase
  }, [sim.phase, lang])

  const decisionText = useMemo(() => {
    if (sim.coordinator.decision === DECISIONS.COMMIT) return 'COMMIT'
    if (sim.coordinator.decision === DECISIONS.ABORT) return 'ABORT'
    return 'PENDING'
  }, [sim.coordinator.decision])

  const currentDecisionColor = useMemo(
    () => decisionColor(sim.coordinator.decision),
    [sim.coordinator.decision]
  )

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}>
        <ApartmentOutlined /> {t.title}
      </Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card title={t.presetsTitle}>
        <Space wrap>
          {presets.map((preset) => (
            <Button key={preset.key} onClick={() => applyPreset(preset)}>
              {preset.label}
            </Button>
          ))}
        </Space>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title={t.configTitle}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Row gutter={[16, 16]} align="middle">
                <Col xs={24} sm={12}>
                  <Text strong>{t.participantsLabel}</Text>
                </Col>
                <Col xs={24} sm={12}>
                  <InputNumber
                    min={2}
                    max={5}
                    value={participantCount}
                    onChange={(v) => {
                      const count = v ?? 2
                      setParticipantCount(count)
                      setVotes((prev) => Array.from({ length: count }, (_, i) => prev[i] || 'yes'))
                      setCrashPrepare((prev) => Array.from({ length: count }, (_, i) => !!prev[i]))
                      setCrashDecision((prev) => Array.from({ length: count }, (_, i) => !!prev[i]))
                    }}
                    style={{ width: '100%' }}
                  />
                </Col>
              </Row>

              {Array.from({ length: participantCount }, (_, i) => i).map((i) => (
                <Row key={i} gutter={[8, 8]} align="middle">
                  <Col xs={24} sm={6}>
                    <Text strong>P{i + 1}</Text>
                  </Col>
                  <Col xs={24} sm={6}>
                    <Select
                      value={votes[i] || 'yes'}
                      onChange={(value) =>
                        setVotes((prev) => {
                          const next = [...prev]
                          next[i] = value
                          return next
                        })
                      }
                      style={{ width: '100%' }}
                      disabled={sim.phase !== PHASES.IDLE}
                    >
                      <Option value="yes">YES</Option>
                      <Option value="no">NO</Option>
                    </Select>
                  </Col>
                  <Col xs={12} sm={6}>
                    <Switch
                      checked={!!crashPrepare[i]}
                      onChange={(checked) =>
                        setCrashPrepare((prev) => {
                          const next = [...prev]
                          next[i] = checked
                          return next
                        })
                      }
                      disabled={sim.phase !== PHASES.IDLE}
                      checkedChildren={<CloseOutlined />}
                      unCheckedChildren={<CheckOutlined />}
                    />
                    <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
                      {t.crashPrepareLabel}
                    </Text>
                  </Col>
                  <Col xs={12} sm={6}>
                    <Switch
                      checked={!!crashDecision[i]}
                      onChange={(checked) =>
                        setCrashDecision((prev) => {
                          const next = [...prev]
                          next[i] = checked
                          return next
                        })
                      }
                      disabled={sim.phase !== PHASES.IDLE}
                      checkedChildren={<CloseOutlined />}
                      unCheckedChildren={<CheckOutlined />}
                    />
                    <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
                      {t.crashDecisionLabel}
                    </Text>
                  </Col>
                </Row>
              ))}

              <Row gutter={[16, 16]} align="middle">
                <Col xs={24} sm={12}>
                  <Text strong>{t.coordinatorCrashLabel}</Text>
                </Col>
                <Col xs={24} sm={12}>
                  <Select
                    value={coordinatorCrashes || 'none'}
                    onChange={(value) => setCoordinatorCrashes(value === 'none' ? null : value)}
                    style={{ width: '100%' }}
                    disabled={sim.phase !== PHASES.IDLE}
                  >
                    <Option value="none">{t.coordinatorCrashNone}</Option>
                    <Option value="before-decision">{t.coordinatorCrashBefore}</Option>
                    <Option value="after-decision">{t.coordinatorCrashAfter}</Option>
                  </Select>
                </Col>
              </Row>

              <Button onClick={applyConfig} block>
                {t.applyConfig}
              </Button>
            </Space>
          </Card>

          <Card title={t.actionsTitle} style={{ marginTop: 16 }}>
            <Space wrap>
              <Button type="primary" icon={<StepForwardOutlined />} onClick={doStep} disabled={sim.finished}>
                {t.stepButton}
              </Button>
              <Button icon={<RedoOutlined />} onClick={reset}>
                {t.resetButton}
              </Button>
            </Space>
          </Card>

          <Card title={t.autoTitle} style={{ marginTop: 16 }}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Text strong>{t.autoToggle}: </Text>
                <Switch
                  checked={autoRun}
                  onChange={setAutoRun}
                  checkedChildren={<PlayCircleOutlined />}
                  unCheckedChildren={<PauseCircleOutlined />}
                  disabled={sim.finished}
                />
              </div>
              <div>
                <Text strong>{t.intervalLabel}</Text>
                <Slider
                  min={200}
                  max={2000}
                  step={100}
                  value={autoInterval}
                  onChange={setAutoInterval}
                  tooltip={{ formatter: (v) => `${v} ${t.milliseconds}` }}
                />
              </div>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title={t.stateTitle}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12}>
                  <NodeCard
                    node={sim.coordinator}
                    label={t.coordinator}
                    isCoordinator
                    onToggle={() => toggleCrash('C')}
                    disabled={sim.phase !== PHASES.IDLE && sim.phase !== PHASES.DONE}
                    t={t}
                  />
                </Col>
                <Col xs={24} sm={12}>
                  <Card size="small" title={t.phaseTitle}>
                    <Badge color={stateColor(sim.coordinator.state)} text={<Text strong>{phaseLabel}</Text>} />
                  </Card>
                  <Card size="small" title={t.decisionTitle} style={{ marginTop: 8 }}>
                    <Tag color={currentDecisionColor}>{decisionText}</Tag>
                  </Card>
                </Col>
              </Row>

              <Row gutter={[16, 16]}>
                {sim.participants.map((p) => (
                  <Col key={p.id} xs={12} sm={8}>
                    <NodeCard
                      node={p}
                      label={`${t.participant} ${p.id}`}
                      onToggle={() => toggleCrash(p.id)}
                      disabled={sim.phase !== PHASES.IDLE && sim.phase !== PHASES.DONE}
                      t={t}
                    />
                  </Col>
                ))}
              </Row>

              {sim.finished && (
                <Alert
                  type={sim.coordinator.decision === DECISIONS.COMMIT ? 'success' : 'warning'}
                  message={t.finished}
                  description={
                    sim.coordinator.decision === DECISIONS.COMMIT
                      ? 'Toda a transacao foi commitada.'
                      : 'A transacao foi abortada.'
                  }
                  showIcon
                />
              )}
            </Space>
          </Card>

          <Card title={t.statsTitle} style={{ marginTop: 16 }}>
            <Row gutter={[16, 16]}>
              <Col xs={12} sm={6}>
                <Card size="small">
                  <Statistic title={t.started} value={sim.stats.started} />
                </Card>
              </Col>
              <Col xs={12} sm={6}>
                <Card size="small">
                  <Statistic title={t.committed} value={sim.stats.committed} />
                </Card>
              </Col>
              <Col xs={12} sm={6}>
                <Card size="small">
                  <Statistic title={t.aborted} value={sim.stats.aborted} />
                </Card>
              </Col>
              <Col xs={12} sm={6}>
                <Card size="small">
                  <Statistic title={t.crashed} value={sim.stats.crashed} />
                </Card>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      <Card title={t.logTitle}>
        {sim.log.length === 0 ? (
          <Empty description={t.noLog} image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <List
            size="small"
            dataSource={sim.log.slice(0, 80)}
            renderItem={(entry) => (
              <List.Item>
                <Space>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </Text>
                  <Tag color={entry.type === 'error' ? 'error' : entry.type === 'success' ? 'success' : entry.type === 'warning' ? 'warning' : 'default'}>
                    {entry.step}
                  </Tag>
                  <Tooltip title={entry.step}>
                    <ThunderboltOutlined />
                  </Tooltip>
                  <Text>{entry.message}</Text>
                </Space>
              </List.Item>
            )}
          />
        )}
      </Card>

      <Card title={t.explanationTitle}>
        <Paragraph>{t.explanation}</Paragraph>
      </Card>

      <Collapse defaultActiveKey={[]}>
        <Panel
          header={t.sourceCode}
          extra={
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined />}
              onClick={(e) => {
                e.stopPropagation()
                copySource()
              }}
            >
              {copied ? t.copied : t.copy}
            </Button>
          }
        >
          <pre style={{ margin: 0, overflow: 'auto' }}>
            <code>{sourceCode()}</code>
          </pre>
        </Panel>
      </Collapse>
    </Space>
  )
}

function NodeCard({ node, label, isCoordinator, onToggle, disabled, t }) {
  const color = stateColor(node.state)
  const isCrashed = node.crashed
  return (
    <Card
      size="small"
      title={
        <Space>
          {label}
          {isCrashed && <Tag color="error">CRASHED</Tag>}
          {!isCoordinator && node.vote && node.state !== STATES.IDLE && (
            <Tag color={node.vote === 'yes' ? 'success' : 'warning'}>{node.vote.toUpperCase()}</Tag>
          )}
        </Space>
      }
      styles={{
        body: { padding: 12, borderTop: `3px solid ${color}` },
      }}
    >
      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        <Badge color={color} text={<Text strong>{node.state}</Text>} />
        {!isCoordinator && (
          <Text type="secondary" style={{ fontSize: 12 }}>
            ACK: {node.acked ? 'yes' : 'no'}
          </Text>
        )}
        <Button size="small" danger={!isCrashed} onClick={onToggle} disabled={disabled}>
          {isCrashed ? t.recoverButton : t.crashButton}
        </Button>
      </Space>
    </Card>
  )
}
