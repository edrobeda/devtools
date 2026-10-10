import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Typography,
  Card,
  Button,
  Space,
  Tag,
  Row,
  Col,
  List,
  Collapse,
  Alert,
  Select,
} from 'antd'
import {
  StepForwardOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  ReloadOutlined,
  ThunderboltOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography
const { Panel } = Collapse
const { Option } = Select

// Textos comuns aos dois simuladores de eleicao de lider. Cada pagina traz
// apenas as diferencas (titulo, intro, "Como funciona", labels dos presets e
// os nomes dos estados/tipos de mensagem do proprio algoritmo); o resto do
// dicionario pt/en vive aqui.
export const baseElectionTranslations = {
  pt: {
    configTitle: 'Controles',
    nodeCountLabel: 'Número de nós',
    stepButton: 'Próximo evento',
    autoPlayButton: 'Auto-play',
    pauseButton: 'Pausar',
    resetButton: 'Resetar',
    startElectionButton: 'Iniciar eleição',
    presetsTitle: 'Cenários rápidos',
    pendingMessages: 'Mensagens pendentes',
    eventLog: 'Log de eventos',
    priorityLabel: 'Prioridade (ID)',
    leaderLabel: 'Líder',
    failSwitch: 'Falhar',
    recoverSwitch: 'Recuperar',
    noLeader: 'Sem líder',
    howItWorks: 'Como funciona',
    sourceCode: 'Código-fonte do motor',
    emptyLog: 'Nenhum evento ainda.',
  },
  en: {
    configTitle: 'Controls',
    nodeCountLabel: 'Node count',
    stepButton: 'Next event',
    autoPlayButton: 'Auto-play',
    pauseButton: 'Pause',
    resetButton: 'Reset',
    startElectionButton: 'Start election',
    presetsTitle: 'Quick scenarios',
    pendingMessages: 'Pending messages',
    eventLog: 'Event log',
    priorityLabel: 'Priority (ID)',
    leaderLabel: 'Leader',
    failSwitch: 'Fail',
    recoverSwitch: 'Recover',
    noLeader: 'No leader',
    howItWorks: 'How it works',
    sourceCode: 'Engine source code',
    emptyLog: 'No events yet.',
  },
}

const NODE_COUNTS = [2, 3, 4, 5, 6, 7]

// Shell compartilhado pelas paginas /tools/bully-algorithm-simulator e
// /tools/ring-election-simulator. Cada algoritmo mantem seu proprio motor
// (Bully pergunta a todos os IDs maiores; o anel Chang-Roberts circula a
// mensagem pelo vizinho ativo), mas o cabecalho, o card de controles, o card
// de presets, as mensagens pendentes, o log de eventos, o "Como funciona" e o
// codigo-fonte ao vivo sao os mesmos e vivem aqui. As partes que dependem do
// algoritmo (visualizacao dos nos e como cada mensagem pendente e exibida) vem
// por render props. Todas as props sao constantes de modulo nas paginas, entao
// nao recriam estado/efeitos a cada render.
export default function LeaderElectionSimulator({
  engine,
  translations,
  presets,
  icon,
  renderVisualization,
  renderPendingMessage,
}) {
  const { lang } = useLanguage()
  const t = useMemo(
    () => ({ ...baseElectionTranslations[lang], ...translations[lang] }),
    [lang, translations]
  )
  const { STATES } = engine

  const [nodeCount, setNodeCount] = useState(5)
  const [state, setState] = useState(() => engine.createInitialState(5))
  const [autoPlay, setAutoPlay] = useState(false)

  // auto-play seguro
  useEffect(() => {
    if (!autoPlay) return undefined
    const id = setInterval(() => {
      setState((prev) => engine.stepSimulation(prev) || prev)
    }, 750)
    return () => clearInterval(id)
  }, [autoPlay, engine])

  const handleStep = useCallback(() => {
    setState((prev) => engine.stepSimulation(prev) || prev)
  }, [engine])

  const handleReset = useCallback(() => {
    setAutoPlay(false)
    setState(engine.resetState(nodeCount))
  }, [nodeCount, engine])

  const handleNodeCountChange = useCallback(
    (value) => {
      const count = Math.max(2, Math.min(7, Number(value) || 5))
      setNodeCount(count)
      setAutoPlay(false)
      setState(engine.resetState(count))
    },
    [engine]
  )

  const handleStartElection = useCallback(() => {
    const active = state.nodes.filter((n) => !n.failed)
    if (active.length === 0) return
    const lowest = active.reduce((a, b) => (a.id < b.id ? a : b))
    setState((prev) => engine.startElection(prev, lowest.id))
  }, [state.nodes, engine])

  const handleToggleFailure = useCallback(
    (id) => {
      setAutoPlay(false)
      setState((prev) => engine.toggleNodeFailure(prev, id))
    },
    [engine]
  )

  const handlePreset = useCallback(
    (preset) => {
      setAutoPlay(false)
      setState(engine.setPreset(preset, nodeCount))
    },
    [nodeCount, engine]
  )

  const pending = useMemo(
    () => state.messages.filter((m) => !m.delivered),
    [state.messages]
  )

  const leaderExists = useMemo(
    () => state.nodes.some((n) => n.state === STATES.LEADER && !n.failed),
    [state.nodes, STATES]
  )

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div>
        <Title level={2}>
          {icon}
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
                      {NODE_COUNTS.map((n) => (
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
              {presets.map((preset) => (
                <Button key={preset.key} block onClick={() => handlePreset(preset.key)}>
                  {t[preset.labelKey]}
                </Button>
              ))}
            </Space>
          </Card>
        </Col>
      </Row>

      <Card>{renderVisualization({ state, t, handleToggleFailure, pending })}</Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title={t.pendingMessages}>
            {pending.length === 0 ? (
              <Text type="secondary">{t.emptyLog}</Text>
            ) : (
              <List
                size="small"
                dataSource={pending}
                renderItem={(m) => <List.Item>{renderPendingMessage(m, t)}</List.Item>}
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
            <code>{engine.sourceCode()}</code>
          </pre>
        </Panel>
      </Collapse>
    </Space>
  )
}
