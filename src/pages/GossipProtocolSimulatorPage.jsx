import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Typography,
  Card,
  InputNumber,
  Select,
  Space,
  Button,
  Row,
  Col,
  Tag,
  Statistic,
  Collapse,
  Alert,
  List,
  Empty,
  Slider,
} from 'antd'
import {
  NodeIndexOutlined,
  StepForwardOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  ReloadOutlined,
  CopyOutlined,
  ApartmentOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  buildInitialState,
  stepGossip,
  resetSimulation,
  estimateConvergence,
  MODES,
  PRESETS,
  sourceCode,
  STATES,
} from '../utils/gossipProtocolSimulator'

const { Title, Paragraph, Text } = Typography
const { Panel } = Collapse
const { Option } = Select

const translations = {
  pt: {
    title: 'Simulador de Gossip Protocol',
    intro:
      'Visualize como uma mensagem (um "rumor") se espalha por uma rede distribuida usando gossip epidemico. Cada node que ja sabe a mensagem escolhe `fanout` vizinhos por round para tentar contagia-los. Tudo roda 100% no navegador.',
    configTitle: 'Configuracoes da rede',
    nodeCountLabel: 'Nodes (N)',
    topologyLabel: 'Topologia',
    fanoutLabel: 'Fanout',
    modeLabel: 'Modelo',
    sourceCountLabel: 'Nodes iniciadores',
    removedAfterLabel: 'Remover infectados apos',
    roundsHelp: 'rounds (somente SIR)',
    topologyRandom: 'Aleatoria',
    topologyRing: 'Anel',
    topologyMesh: 'Completa',
    topologyStar: 'Estrela',
    modeSI: 'SI — simples (sem remocao)',
    modeSIR: 'SIR — com remocao',
    speedLabel: 'Velocidade auto-play (ms)',
    controlsTitle: 'Controles',
    nextRound: 'Proximo round',
    autoPlay: 'Auto-play',
    pause: 'Pausar',
    reset: 'Resetar',
    newNetwork: 'Nova rede',
    presetsTitle: 'Cenarios rapidos',
    visualizationTitle: 'Rede',
    nodeSusceptible: 'Suscetivel',
    nodeInfected: 'Infectado',
    nodeRemoved: 'Removido',
    statsTitle: 'Estatisticas',
    round: 'Round',
    messages: 'Mensagens',
    susceptible: 'Suscetiveis',
    infected: 'Infectados',
    removed: 'Removidos',
    convergenceEstimate: 'Convergencia estimada',
    historyTitle: 'Historico de rounds',
    noHistory: 'Nenhum round executado ainda.',
    howItWorks: 'Como funciona',
    howItWorksText:
      'No inicio, alguns nodes sabem a mensagem (infectados). A cada round, cada node infectado escolhe `fanout` vizinhos aleatorios e envia a mensagem. Receptores suscetiveis passam a ser infectados. No modelo SI eles continuam propagando para sempre; no SIR eles param de propagar apos um numero fixo de rounds (removed). Quando nao ha mais nodes suscetiveis ou nenhum infectado, a simulacao converge.',
    sourceCode: 'Codigo-fonte do motor',
    copy: 'Copiar',
    copied: 'Copiado',
    converged: 'Convergencia atingida',
  },
  en: {
    title: 'Gossip Protocol Simulator',
    intro:
      'Visualize how a message (a "rumor") spreads through a distributed network using epidemic gossip. Every node that already knows the message picks `fanout` neighbors per round to try to infect them. Everything runs 100% in the browser.',
    configTitle: 'Network settings',
    nodeCountLabel: 'Nodes (N)',
    topologyLabel: 'Topology',
    fanoutLabel: 'Fanout',
    modeLabel: 'Model',
    sourceCountLabel: 'Initial sources',
    removedAfterLabel: 'Remove infected after',
    roundsHelp: 'rounds (SIR only)',
    topologyRandom: 'Random',
    topologyRing: 'Ring',
    topologyMesh: 'Full mesh',
    topologyStar: 'Star',
    modeSI: 'SI — simple (no removal)',
    modeSIR: 'SIR — with removal',
    speedLabel: 'Auto-play speed (ms)',
    controlsTitle: 'Controls',
    nextRound: 'Next round',
    autoPlay: 'Auto-play',
    pause: 'Pause',
    reset: 'Reset',
    newNetwork: 'New network',
    presetsTitle: 'Quick scenarios',
    visualizationTitle: 'Network',
    nodeSusceptible: 'Susceptible',
    nodeInfected: 'Infected',
    nodeRemoved: 'Removed',
    statsTitle: 'Statistics',
    round: 'Round',
    messages: 'Messages',
    susceptible: 'Susceptible',
    infected: 'Infected',
    removed: 'Removed',
    convergenceEstimate: 'Estimated convergence',
    historyTitle: 'Round history',
    noHistory: 'No rounds executed yet.',
    howItWorks: 'How it works',
    howItWorksText:
      'Initially a few nodes know the message (infected). Each round, every infected node randomly chooses `fanout` neighbors and sends the message. Susceptible receivers become infected. In the SI model they keep spreading forever; in the SIR model they stop spreading after a fixed number of rounds (removed). The simulation converges when there are no susceptible nodes left or no infected nodes remaining.',
    sourceCode: 'Engine source code',
    copy: 'Copy',
    copied: 'Copied',
    converged: 'Convergence reached',
  },
}

export default function GossipProtocolSimulatorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const presets = PRESETS[lang]

  const [nodeCount, setNodeCount] = useState(20)
  const [topology, setTopology] = useState('random')
  const [fanout, setFanout] = useState(3)
  const [mode, setMode] = useState(MODES.SI)
  const [sourceCount, setSourceCount] = useState(1)
  const [removedAfterRounds, setRemovedAfterRounds] = useState(3)
  const [speed, setSpeed] = useState(600)
  const [seed, setSeed] = useState(() => Date.now())
  const [isPlaying, setIsPlaying] = useState(false)
  const [copiedKey, setCopiedKey] = useState(null)

  const [simState, setSimState] = useState(() =>
    buildInitialState(nodeCount, topology, sourceCount, seed)
  )
  const [history, setHistory] = useState([])

  const simStateRef = useRef(simState)
  simStateRef.current = simState

  const rngRef = useRef(() => Math.random())
  useEffect(() => {
    rngRef.current = (function mulberry32(s) {
      let seed = s
      return function random() {
        let t = (seed += 0x6d2b79f5)
        t = Math.imul(t ^ (t >>> 15), t | 1)
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
      }
    })(seed)
  }, [seed])

  const rebuild = useCallback(() => {
    const next = buildInitialState(nodeCount, topology, sourceCount, seed)
    setSimState(next)
    setHistory([])
  }, [nodeCount, topology, sourceCount, seed])

  useEffect(() => {
    rebuild()
  }, [rebuild])

  const doStep = useCallback(() => {
    setSimState((prev) => {
      if (prev.converged) return prev
      const next = stepGossip(prev, mode, fanout, removedAfterRounds, rngRef.current)
      setHistory((h) => [
        ...h,
        {
          round: next.round,
          newInfections: next.newInfectionCount,
          messages: next.lastMessages.length,
          counts: { ...next.counts },
        },
      ])
      return next
    })
  }, [mode, fanout, removedAfterRounds])

  useEffect(() => {
    if (!isPlaying) return undefined
    if (simStateRef.current.converged) {
      setIsPlaying(false)
      return undefined
    }
    const id = setInterval(() => {
      setSimState((prev) => {
        if (prev.converged) {
          setIsPlaying(false)
          return prev
        }
        const next = stepGossip(prev, mode, fanout, removedAfterRounds, rngRef.current)
        setHistory((h) => [
          ...h,
          {
            round: next.round,
            newInfections: next.newInfectionCount,
            messages: next.lastMessages.length,
            counts: { ...next.counts },
          },
        ])
        if (next.converged) setIsPlaying(false)
        return next
      })
    }, speed)
    return () => clearInterval(id)
  }, [isPlaying, speed, mode, fanout, removedAfterRounds])

  const handleReset = useCallback(() => {
    const next = resetSimulation(simState, sourceCount, rngRef.current)
    setSimState(next)
    setHistory([])
    setIsPlaying(false)
  }, [simState, sourceCount])

  const handleNewNetwork = useCallback(() => {
    const nextSeed = Date.now()
    setSeed(nextSeed)
    const next = buildInitialState(nodeCount, topology, sourceCount, nextSeed)
    setSimState(next)
    setHistory([])
    setIsPlaying(false)
  }, [nodeCount, topology, sourceCount])

  const applyPreset = useCallback(
    (p) => {
      setNodeCount(p.nodeCount)
      setTopology(p.topology)
      setFanout(p.fanout)
      setMode(p.mode)
      setSourceCount(p.sourceCount)
      setRemovedAfterRounds(p.removedAfterRounds)
      const nextSeed = Date.now()
      setSeed(nextSeed)
      setSimState(buildInitialState(p.nodeCount, p.topology, p.sourceCount, nextSeed))
      setHistory([])
      setIsPlaying(false)
    },
    []
  )

  const copy = useCallback((text, key) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 1500)
  }, [])

  const convergenceEstimate = useMemo(
    () => estimateConvergence({ nodeCount, mode, fanout, removedAfterRounds }),
    [nodeCount, mode, fanout, removedAfterRounds]
  )

  const colorForState = (state) => {
    if (state === STATES.INFECTED) return '#ff4d4f'
    if (state === STATES.REMOVED) return '#8c8c8c'
    return '#1677ff'
  }

  const cols = useMemo(() => {
    const c = Math.ceil(Math.sqrt(simState.nodes.length))
    return Math.max(1, c)
  }, [simState.nodes.length])

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}>
        <ApartmentOutlined /> {t.title}
      </Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card title={t.configTitle}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Text strong>{t.nodeCountLabel}</Text>
                <Slider
                  min={3}
                  max={100}
                  value={nodeCount}
                  onChange={(v) => setNodeCount(v)}
                />
              </div>

              <div>
                <Text strong>{t.topologyLabel}</Text>
                <Select
                  value={topology}
                  onChange={setTopology}
                  style={{ width: '100%' }}
                  options={[
                    { value: 'random', label: t.topologyRandom },
                    { value: 'ring', label: t.topologyRing },
                    { value: 'mesh', label: t.topologyMesh },
                    { value: 'star', label: t.topologyStar },
                  ]}
                />
              </div>

              <Row gutter={[16, 16]}>
                <Col xs={12}>
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <Text strong>{t.fanoutLabel}</Text>
                    <InputNumber
                      min={1}
                      max={20}
                      value={fanout}
                      onChange={(v) => setFanout(v ?? 1)}
                      style={{ width: '100%' }}
                    />
                  </Space>
                </Col>
                <Col xs={12}>
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <Text strong>{t.sourceCountLabel}</Text>
                    <InputNumber
                      min={1}
                      max={Math.max(1, nodeCount - 1)}
                      value={sourceCount}
                      onChange={(v) => setSourceCount(v ?? 1)}
                      style={{ width: '100%' }}
                    />
                  </Space>
                </Col>
              </Row>

              <div>
                <Text strong>{t.modeLabel}</Text>
                <Select
                  value={mode}
                  onChange={setMode}
                  style={{ width: '100%' }}
                  options={[
                    { value: MODES.SI, label: t.modeSI },
                    { value: MODES.SIR, label: t.modeSIR },
                  ]}
                />
              </div>

              {mode === MODES.SIR && (
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <Text strong>{t.removedAfterLabel}</Text>
                  <InputNumber
                    min={1}
                    max={20}
                    value={removedAfterRounds}
                    onChange={(v) => setRemovedAfterRounds(v ?? 1)}
                    style={{ width: '100%' }}
                    addonAfter={t.roundsHelp}
                  />
                </Space>
              )}

              <div>
                <Text strong>{t.speedLabel}</Text>
                <Slider
                  min={100}
                  max={2000}
                  step={100}
                  value={speed}
                  onChange={(v) => setSpeed(v)}
                  reverse
                />
              </div>
            </Space>
          </Card>

          <Card title={t.controlsTitle} style={{ marginTop: 16 }}>
            <Space wrap>
              <Button
                type="primary"
                icon={<StepForwardOutlined />}
                onClick={doStep}
                disabled={simState.converged}
              >
                {t.nextRound}
              </Button>
              <Button
                icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                onClick={() => setIsPlaying((p) => !p)}
                disabled={simState.converged}
              >
                {isPlaying ? t.pause : t.autoPlay}
              </Button>
              <Button icon={<ReloadOutlined />} onClick={handleReset}>
                {t.reset}
              </Button>
              <Button icon={<NodeIndexOutlined />} onClick={handleNewNetwork}>
                {t.newNetwork}
              </Button>
            </Space>
          </Card>

          <Card title={t.presetsTitle} style={{ marginTop: 16 }}>
            <Space size={[8, 8]} wrap>
              {presets.map((p) => (
                <Button key={p.key} size="small" onClick={() => applyPreset(p)}>
                  {p.label}
                </Button>
              ))}
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={16}>
          <Card
            title={
              <Space>
                {t.visualizationTitle}
                <Tag color="blue">{t.nodeSusceptible}</Tag>
                <Tag color="red">{t.nodeInfected}</Tag>
                <Tag>{t.nodeRemoved}</Tag>
              </Space>
            }
          >
            {simState.converged && (
              <Alert
                type="success"
                showIcon
                message={t.converged}
                style={{ marginBottom: 16 }}
              />
            )}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                gap: 6,
                maxHeight: 420,
                overflow: 'auto',
                padding: 4,
              }}
            >
              {simState.nodes.map((node) => (
                <div
                  key={node.id}
                  title={`node ${node.id}: ${node.state}`}
                  style={{
                    aspectRatio: '1 / 1',
                    background: colorForState(node.state),
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: 10,
                    fontWeight: 700,
                    minWidth: 20,
                    minHeight: 20,
                    opacity: node.state === STATES.SUSCEPTIBLE ? 0.45 : 1,
                  }}
                >
                  {node.id}
                </div>
              ))}
            </div>
          </Card>

          <Card title={t.statsTitle} style={{ marginTop: 16 }}>
            <Row gutter={[16, 16]}>
              <Col xs={12} sm={6}>
                <Card size="small">
                  <Statistic title={t.round} value={simState.round} />
                </Card>
              </Col>
              <Col xs={12} sm={6}>
                <Card size="small">
                  <Statistic title={t.messages} value={simState.messages} />
                </Card>
              </Col>
              <Col xs={12} sm={6}>
                <Card size="small">
                  <Statistic
                    title={t.susceptible}
                    value={simState.counts.susceptible}
                  />
                </Card>
              </Col>
              <Col xs={12} sm={6}>
                <Card size="small">
                  <Statistic title={t.infected} value={simState.counts.infected} />
                </Card>
              </Col>
              <Col xs={12} sm={6}>
                <Card size="small">
                  <Statistic title={t.removed} value={simState.counts.removed} />
                </Card>
              </Col>
              <Col xs={12} sm={6}>
                <Card size="small">
                  <Statistic title={t.convergenceEstimate} value={convergenceEstimate} />
                </Card>
              </Col>
            </Row>
          </Card>

          <Card title={t.historyTitle} style={{ marginTop: 16 }}>
            {history.length === 0 ? (
              <Empty description={t.noHistory} image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <List
                size="small"
                dataSource={history.slice().reverse()}
                renderItem={(entry) => (
                  <List.Item>
                    <Space>
                      <Tag>#{entry.round}</Tag>
                      <Text>
                        +{entry.newInfections} {t.infected.toLowerCase()} / {entry.messages}{' '}
                        {t.messages.toLowerCase()}
                      </Text>
                    </Space>
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
      </Row>

      <Alert type="info" showIcon message={t.howItWorks} description={t.howItWorksText} />

      <Collapse>
        <Panel header={t.sourceCode} key="source">
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
