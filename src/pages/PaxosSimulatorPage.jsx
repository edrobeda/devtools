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
  Input,
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
  PROPOSER_STATES,
  ACCEPTOR_STATES,
  LEARNER_STATES,
  PHASES,
  PRESETS,
  defaultConfig,
  createSimulation,
  step,
  resetSimulation,
  crashNode,
  recoverNode,
  stateColor,
  sourceCode,
} from '../utils/paxosSimulator'

const { Title, Paragraph, Text } = Typography
const { Panel } = Collapse

const translations = {
  pt: {
    title: 'Simulador de Paxos',
    intro:
      'Experimente o protocolo Paxos para consenso distribuido 100% no navegador. Acompanhe as fases PREPARE/PROMISE e ACCEPT/ACCEPTED entre um proposer, varios acceptors e um learner. Veja como maioria, numeros de proposta e falhas determinam se um valor e escolhido.',
    configTitle: 'Configuracao',
    acceptorsLabel: 'Numero de acceptors',
    proposalNumberLabel: 'Numero da proposta (n)',
    proposalValueLabel: 'Valor proposto (v)',
    rejectPrepareLabel: 'Rejeitar PREPARE',
    rejectAcceptLabel: 'Rejeitar ACCEPT',
    crashedLabel: 'Caido',
    applyConfig: 'Aplicar e reiniciar',
    presetsTitle: 'Cenarios rapidos',
    stateTitle: 'Estado dos nos',
    proposer: 'Proposer',
    acceptor: 'Acceptor',
    learner: 'Learner',
    phaseTitle: 'Fase atual',
    chosenValueTitle: 'Valor escolhido',
    actionsTitle: 'Acoes manuais',
    stepButton: 'Proximo passo',
    resetButton: 'Reiniciar',
    crashButton: 'Derrubar',
    recoverButton: 'Recuperar',
    autoTitle: 'Simulacao automatica',
    autoToggle: 'Avancar passos sozinho',
    intervalLabel: 'Intervalo entre passos (ms)',
    statsTitle: 'Estatisticas',
    promises: 'Promises',
    rejects: 'Rejeicoes',
    accepts: 'Accepts',
    learned: 'Learns',
    crashed: 'Caidos',
    logTitle: 'Log de mensagens',
    noLog: 'Nenhuma mensagem ainda.',
    explanationTitle: 'Como funciona',
    explanation: (
      <>
        O <Text code>Paxos</Text> escolhe um unico valor entre processos distribuidos.
        O <Text code>proposer</Text> inicia enviando <Text code>PREPARE(n)</Text> para os{' '}
        <Text code>acceptors</Text>. Cada acceptor promete nao aceitar propostas com numero
        menor e responde <Text code>PROMISE</Text> com qualquer valor ja aceito. Se o
        proposer obtem uma <Text code>maioria de promises</Text>, ele escolhe o valor do
        maior <Text code>acceptedN</Text> ja registrado (ou seu proprio valor se nenhum) e
        envia <Text code>ACCEPT(n, v)</Text>. Acceptors aceitam se{' '}
        <Text code>n &gt;= maxPromiseN</Text>. Quando uma maioria de acceptors aceita o
        mesmo valor, o <Text code>learner</Text> descobre que o valor foi escolhido.
      </>
    ),
    sourceCode: 'Codigo-fonte do motor',
    copy: 'Copiar',
    copied: 'Copiado',
    milliseconds: 'ms',
    finished: 'Rodada finalizada',
    running: 'Executando...',
    none: 'Nenhum',
    phaseLabels: {
      [PHASES.IDLE]: 'Ocioso',
      [PHASES.PREPARE_SENT]: 'PREPARE enviado',
      [PHASES.PROMISES_RECEIVED]: 'PROMISEs recebidos',
      [PHASES.ACCEPT_SENT]: 'ACCEPT enviado',
      [PHASES.ACCEPTS_RECEIVED]: 'ACCEPTs recebidos',
      [PHASES.DONE]: 'Finalizado',
    },
  },
  en: {
    title: 'Paxos Simulator',
    intro:
      'Experiment with the Paxos protocol for distributed consensus 100% in the browser. Follow the PREPARE/PROMISE and ACCEPT/ACCEPTED phases between a proposer, several acceptors and a learner. See how majority, proposal numbers and failures determine whether a value is chosen.',
    configTitle: 'Configuration',
    acceptorsLabel: 'Number of acceptors',
    proposalNumberLabel: 'Proposal number (n)',
    proposalValueLabel: 'Proposed value (v)',
    rejectPrepareLabel: 'Reject PREPARE',
    rejectAcceptLabel: 'Reject ACCEPT',
    crashedLabel: 'Crashed',
    applyConfig: 'Apply & restart',
    presetsTitle: 'Quick scenarios',
    stateTitle: 'Node states',
    proposer: 'Proposer',
    acceptor: 'Acceptor',
    learner: 'Learner',
    phaseTitle: 'Current phase',
    chosenValueTitle: 'Chosen value',
    actionsTitle: 'Manual actions',
    stepButton: 'Next step',
    resetButton: 'Reset',
    crashButton: 'Crash',
    recoverButton: 'Recover',
    autoTitle: 'Automatic simulation',
    autoToggle: 'Auto-advance steps',
    intervalLabel: 'Interval between steps (ms)',
    statsTitle: 'Statistics',
    promises: 'Promises',
    rejects: 'Rejects',
    accepts: 'Accepts',
    learned: 'Learns',
    crashed: 'Crashed',
    logTitle: 'Message log',
    noLog: 'No messages yet.',
    explanationTitle: 'How it works',
    explanation: (
      <>
        <Text code>Paxos</Text> chooses a single value among distributed processes. The{' '}
        <Text code>proposer</Text> starts by sending <Text code>PREPARE(n)</Text> to the{' '}
        <Text code>acceptors</Text>. Each acceptor promises not to accept proposals with a
        lower number and replies with <Text code>PROMISE</Text>, including any previously
        accepted value. If the proposer gets a <Text code>majority of promises</Text>, it
        picks the value with the highest <Text code>acceptedN</Text> (or its own value if
        none) and sends <Text code>ACCEPT(n, v)</Text>. Acceptors accept when{' '}
        <Text code>n &gt;= maxPromiseN</Text>. Once a majority of acceptors accepts the
        same value, the <Text code>learner</Text> learns that the value has been chosen.
      </>
    ),
    sourceCode: 'Engine source code',
    copy: 'Copy',
    copied: 'Copied',
    milliseconds: 'ms',
    finished: 'Round finished',
    running: 'Running...',
    none: 'None',
    phaseLabels: {
      [PHASES.IDLE]: 'Idle',
      [PHASES.PREPARE_SENT]: 'PREPARE sent',
      [PHASES.PROMISES_RECEIVED]: 'PROMISEs received',
      [PHASES.ACCEPT_SENT]: 'ACCEPT sent',
      [PHASES.ACCEPTS_RECEIVED]: 'ACCEPTs received',
      [PHASES.DONE]: 'Done',
    },
  },
}

export default function PaxosSimulatorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const presets = PRESETS[lang]

  const [acceptorCount, setAcceptorCount] = useState(defaultConfig().acceptorCount)
  const [proposalNumber, setProposalNumber] = useState(defaultConfig().proposalNumber)
  const [proposalValue, setProposalValue] = useState(defaultConfig().proposalValue)
  const [rejectPrepare, setRejectPrepare] = useState(defaultConfig().rejectPrepare)
  const [rejectAccept, setRejectAccept] = useState(defaultConfig().rejectAccept)
  const [crashed, setCrashed] = useState(defaultConfig().crashed)
  const [preloadedAcceptors, setPreloadedAcceptors] = useState(defaultConfig().preloadedAcceptors)

  const config = useMemo(
    () => ({
      acceptorCount,
      proposalNumber,
      proposalValue,
      rejectPrepare: rejectPrepare.slice(0, acceptorCount),
      rejectAccept: rejectAccept.slice(0, acceptorCount),
      crashed: crashed.slice(0, acceptorCount),
      preloadedAcceptors: preloadedAcceptors.slice(0, acceptorCount),
    }),
    [acceptorCount, proposalNumber, proposalValue, rejectPrepare, rejectAccept, crashed, preloadedAcceptors]
  )

  const [sim, setSim] = useState(() => createSimulation(config))
  const [autoRun, setAutoRun] = useState(false)
  const [autoInterval, setAutoInterval] = useState(800)
  const [copied, setCopied] = useState(false)

  const applyConfig = useCallback(() => {
    setSim(createSimulation(config))
  }, [config])

  const applyPreset = useCallback((preset) => {
    setAcceptorCount(preset.acceptorCount)
    setProposalNumber(preset.proposalNumber)
    setProposalValue(preset.proposalValue)
    setRejectPrepare(preset.rejectPrepare.slice())
    setRejectAccept(preset.rejectAccept.slice())
    setCrashed(preset.crashed.slice())
    setPreloadedAcceptors(preset.preloadedAcceptors ? preset.preloadedAcceptors.map((a) => ({ ...a })) : [])
    setSim(
      createSimulation({
        acceptorCount: preset.acceptorCount,
        proposalNumber: preset.proposalNumber,
        proposalValue: preset.proposalValue,
        rejectPrepare: preset.rejectPrepare.slice(),
        rejectAccept: preset.rejectAccept.slice(),
        crashed: preset.crashed.slice(),
        preloadedAcceptors: preset.preloadedAcceptors ? preset.preloadedAcceptors.map((a) => ({ ...a })) : [],
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
      const isCrashed =
        nodeId === 'P'
          ? prev.proposer.state === PROPOSER_STATES.REJECTED
          : nodeId === 'L'
          ? false
          : prev.acceptors.find((a) => a.id === nodeId)?.crashed
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

  const phaseLabel = useMemo(() => t.phaseLabels[sim.phase] || sim.phase, [sim.phase, t])

  const chosenValue = useMemo(() => {
    if (sim.proposer.state === PROPOSER_STATES.CHOSEN) return sim.proposer.chosenValue
    if (sim.learner.state === LEARNER_STATES.LEARNED) return sim.learner.value
    return null
  }, [sim])

  const resizeArray = useCallback((arr, length, fill) => {
    const next = arr.slice(0, length)
    while (next.length < length) next.push(fill)
    return next
  }, [])

  const handleAcceptorCountChange = useCallback(
    (value) => {
      const count = Math.max(3, Math.min(7, value ?? 5))
      setAcceptorCount(count)
      setRejectPrepare((prev) => resizeArray(prev, count, false))
      setRejectAccept((prev) => resizeArray(prev, count, false))
      setCrashed((prev) => resizeArray(prev, count, false))
      setPreloadedAcceptors((prev) => resizeArray(prev, count, { state: 'IDLE', maxPromiseN: -1, acceptedN: null, acceptedV: null }))
    },
    [resizeArray]
  )

  const updateFlag = useCallback((setter, index, checked) => {
    setter((prev) => {
      const next = [...prev]
      next[index] = checked
      return next
    })
  }, [])

  const isIdle = sim.phase === PHASES.IDLE

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
                  <Text strong>{t.acceptorsLabel}</Text>
                </Col>
                <Col xs={24} sm={12}>
                  <InputNumber
                    min={3}
                    max={7}
                    value={acceptorCount}
                    onChange={handleAcceptorCountChange}
                    style={{ width: '100%' }}
                    disabled={!isIdle}
                  />
                </Col>
              </Row>

              <Row gutter={[16, 16]} align="middle">
                <Col xs={24} sm={12}>
                  <Text strong>{t.proposalNumberLabel}</Text>
                </Col>
                <Col xs={24} sm={12}>
                  <InputNumber
                    min={1}
                    value={proposalNumber}
                    onChange={(v) => setProposalNumber(v ?? 1)}
                    style={{ width: '100%' }}
                    disabled={!isIdle}
                  />
                </Col>
              </Row>

              <Row gutter={[16, 16]} align="middle">
                <Col xs={24} sm={12}>
                  <Text strong>{t.proposalValueLabel}</Text>
                </Col>
                <Col xs={24} sm={12}>
                  <Input
                    value={proposalValue}
                    onChange={(e) => setProposalValue(e.target.value)}
                    style={{ width: '100%' }}
                    disabled={!isIdle}
                    maxLength={20}
                  />
                </Col>
              </Row>

              {Array.from({ length: acceptorCount }, (_, i) => i).map((i) => (
                <Card key={i} size="small" title={`${t.acceptor} A${i + 1}`}>
                  <Row gutter={[8, 8]} align="middle">
                    <Col xs={8}>
                      <Switch
                        checked={!!crashed[i]}
                        onChange={(checked) => updateFlag(setCrashed, i, checked)}
                        disabled={!isIdle}
                        checkedChildren={<CloseOutlined />}
                        unCheckedChildren={<CheckOutlined />}
                      />
                      <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
                        {t.crashedLabel}
                      </Text>
                    </Col>
                    <Col xs={8}>
                      <Switch
                        checked={!!rejectPrepare[i]}
                        onChange={(checked) => updateFlag(setRejectPrepare, i, checked)}
                        disabled={!isIdle}
                        checkedChildren={<CloseOutlined />}
                        unCheckedChildren={<CheckOutlined />}
                      />
                      <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
                        {t.rejectPrepareLabel}
                      </Text>
                    </Col>
                    <Col xs={8}>
                      <Switch
                        checked={!!rejectAccept[i]}
                        onChange={(checked) => updateFlag(setRejectAccept, i, checked)}
                        disabled={!isIdle}
                        checkedChildren={<CloseOutlined />}
                        unCheckedChildren={<CheckOutlined />}
                      />
                      <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
                        {t.rejectAcceptLabel}
                      </Text>
                    </Col>
                  </Row>
                </Card>
              ))}

              <Button onClick={applyConfig} block disabled={!isIdle}>
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
                    node={sim.proposer}
                    label={t.proposer}
                    isProposer
                    onToggle={() => toggleCrash('P')}
                    disabled={!isIdle && !sim.finished}
                    t={t}
                  />
                </Col>
                <Col xs={24} sm={12}>
                  <Card size="small" title={t.phaseTitle}>
                    <Badge color={stateColor(sim.proposer.state)} text={<Text strong>{phaseLabel}</Text>} />
                  </Card>
                  <Card size="small" title={t.chosenValueTitle} style={{ marginTop: 8 }}>
                    <Tag color={chosenValue ? 'success' : 'default'}>{chosenValue ?? t.none}</Tag>
                  </Card>
                </Col>
              </Row>

              <Row gutter={[16, 16]}>
                {sim.acceptors.map((a) => (
                  <Col key={a.id} xs={12} sm={8}>
                    <NodeCard
                      node={a}
                      label={`${t.acceptor} ${a.id}`}
                      onToggle={() => toggleCrash(a.id)}
                      disabled={!isIdle && !sim.finished}
                      t={t}
                    />
                  </Col>
                ))}
              </Row>

              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12}>
                  <NodeCard
                    node={sim.learner}
                    label={t.learner}
                    isLearner
                    learnerValue={sim.learner.value}
                    onToggle={() => toggleCrash('L')}
                    disabled={!isIdle && !sim.finished}
                    t={t}
                  />
                </Col>
              </Row>

              {sim.finished && (
                <Alert
                  type={sim.proposer.state === PROPOSER_STATES.CHOSEN ? 'success' : 'warning'}
                  message={t.finished}
                  description={
                    sim.proposer.state === PROPOSER_STATES.CHOSEN
                      ? `Valor escolhido: "${chosenValue}"`
                      : 'Nenhum valor foi escolhido nesta rodada.'
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
                  <Statistic title={t.promises} value={sim.stats.promises} />
                </Card>
              </Col>
              <Col xs={12} sm={6}>
                <Card size="small">
                  <Statistic title={t.rejects} value={sim.stats.rejects} />
                </Card>
              </Col>
              <Col xs={12} sm={6}>
                <Card size="small">
                  <Statistic title={t.accepts} value={sim.stats.accepts} />
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
                    {entry.phase}
                  </Tag>
                  <Tooltip title={entry.phase}>
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

function NodeCard({ node, label, isProposer, isLearner, learnerValue, onToggle, disabled, t }) {
  const color = stateColor(node.state)
  const isCrashed = node.crashed || node.state === PROPOSER_STATES.REJECTED
  return (
    <Card
      size="small"
      title={
        <Space>
          {label}
          {isCrashed && <Tag color="error">CRASHED</Tag>}
        </Space>
      }
      styles={{
        body: { padding: 12, borderTop: `3px solid ${color}` },
      }}
    >
      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        <Badge color={color} text={<Text strong>{node.state}</Text>} />
        {isProposer && node.value && (
          <Text type="secondary" style={{ fontSize: 12 }}>
            n={node.proposalN} / v="{node.value}"
          </Text>
        )}
        {isLearner && learnerValue && (
          <Text type="secondary" style={{ fontSize: 12 }}>
            v="{learnerValue}"
          </Text>
        )}
        {!isLearner && (
          <Button size="small" danger={!isCrashed} onClick={onToggle} disabled={disabled}>
            {isCrashed ? t.recoverButton : t.crashButton}
          </Button>
        )}
      </Space>
    </Card>
  )
}
