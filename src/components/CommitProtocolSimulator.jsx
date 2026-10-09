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

const { Title, Paragraph, Text } = Typography
const { Panel } = Collapse
const { Option } = Select

// Textos comuns aos dois simuladores de commit distribuido. Cada pagina traz
// apenas as diferencas (titulo, intro, labels das fases/labels de falha do
// protocolo, opcoes de falha do coordenador e o "Como funciona"); o resto do
// dicionario pt/en vive aqui.
export const baseCommitTranslations = {
  pt: {
    configTitle: 'Configuracao',
    participantsLabel: 'Numero de participantes',
    voteLabel: 'Voto',
    coordinatorCrashLabel: 'Falha do coordenador',
    coordinatorCrashNone: 'Nenhuma',
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
    sourceCode: 'Codigo-fonte do motor',
    copy: 'Copiar',
    copied: 'Copiado',
    milliseconds: 'ms',
    finished: 'Transacao finalizada',
    running: 'Executando...',
  },
  en: {
    configTitle: 'Configuration',
    participantsLabel: 'Number of participants',
    voteLabel: 'Vote',
    coordinatorCrashLabel: 'Coordinator failure',
    coordinatorCrashNone: 'None',
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
    sourceCode: 'Engine source code',
    copy: 'Copy',
    copied: 'Copied',
    milliseconds: 'ms',
    finished: 'Transaction finished',
    running: 'Running...',
  },
}

function resolveConfig({ participantCount, votes, crashFlags, coordinatorCrashes }, crashFields) {
  const resolved = {
    participantCount,
    votes: votes.slice(0, participantCount),
    coordinatorCrashes,
  }
  crashFields.forEach((field) => {
    resolved[field.key] = crashFlags[field.key].slice(0, participantCount)
  })
  return resolved
}

// Shell compartilhado pelas paginas /tools/two-phase-commit-simulator e
// /tools/three-phase-commit-simulator. Cada protocolo mantem seu proprio motor
// (maquinas de fase distintas), mas a UI — painel de config, grade de
// participantes/coordenador, log, banner de decisao e dicionario pt/en — e a
// mesma e vive aqui, parametrizada por props. As props sao constantes de
// modulo nas paginas, entao nao recriam estado/efeitos a cada render.
export default function CommitProtocolSimulator({
  engine,
  translations,
  crashFields,
  coordinatorCrashOptions,
  rowLayout,
  phaseLabels,
  renderNodeAck,
  finishedDescription,
  sourceCode,
}) {
  const { lang } = useLanguage()
  const t = useMemo(
    () => ({ ...baseCommitTranslations[lang], ...translations[lang] }),
    [lang, translations]
  )
  const presets = engine.PRESETS[lang]
  const { STATES, PHASES, DECISIONS } = engine

  const [participantCount, setParticipantCount] = useState(() => engine.defaultConfig().participantCount)
  const [votes, setVotes] = useState(() => engine.defaultConfig().votes)
  const [crashFlags, setCrashFlags] = useState(() => {
    const cfg = engine.defaultConfig()
    const flags = {}
    crashFields.forEach((field) => {
      flags[field.key] = cfg[field.key]
    })
    return flags
  })
  const [coordinatorCrashes, setCoordinatorCrashes] = useState(() => engine.defaultConfig().coordinatorCrashes)

  const config = useMemo(
    () => resolveConfig({ participantCount, votes, crashFlags, coordinatorCrashes }, crashFields),
    [participantCount, votes, crashFlags, coordinatorCrashes]
  )

  const [sim, setSim] = useState(() => engine.createSimulation(config))
  const [autoRun, setAutoRun] = useState(false)
  const [autoInterval, setAutoInterval] = useState(800)
  const [copied, setCopied] = useState(false)

  const applyConfig = useCallback(() => {
    setSim(engine.createSimulation(config))
  }, [config, engine])

  const applyPreset = useCallback(
    (preset) => {
      setParticipantCount(preset.participants)
      setVotes(preset.votes.slice())
      const flags = {}
      crashFields.forEach((field) => {
        flags[field.key] = preset[field.key].slice()
      })
      setCrashFlags(flags)
      setCoordinatorCrashes(preset.coordinatorCrashes)
      setSim(
        engine.createSimulation(
          resolveConfig(
            {
              participantCount: preset.participants,
              votes: preset.votes.slice(),
              crashFlags: flags,
              coordinatorCrashes: preset.coordinatorCrashes,
            },
            crashFields
          )
        )
      )
    },
    [crashFields, engine]
  )

  const doStep = useCallback(() => {
    setSim((prev) => {
      if (prev.finished) return prev
      return engine.step(prev)
    })
  }, [engine])

  const reset = useCallback(() => {
    setSim(engine.resetSimulation(config))
  }, [config, engine])

  const toggleCrash = useCallback(
    (nodeId) => {
      setSim((prev) => {
        const isCrashed =
          nodeId === 'C' ? prev.coordinator.crashed : prev.participants.find((p) => p.id === nodeId)?.crashed
        return isCrashed ? engine.recoverNode(prev, nodeId) : engine.crashNode(prev, nodeId)
      })
    },
    [engine]
  )

  useEffect(() => {
    if (!autoRun) return undefined
    const id = setInterval(() => {
      setSim((prev) => {
        if (prev.finished) return prev
        return engine.step(prev)
      })
    }, autoInterval)
    return () => clearInterval(id)
  }, [autoRun, autoInterval, engine])

  useEffect(() => {
    if (sim.finished) setAutoRun(false)
  }, [sim.finished])

  const copySource = useCallback(() => {
    navigator.clipboard.writeText(sourceCode()).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }, [sourceCode])

  const phaseLabel = useMemo(() => {
    return phaseLabels[lang][sim.phase] || sim.phase
  }, [lang, phaseLabels, sim.phase])

  const decisionText = useMemo(() => {
    if (sim.coordinator.decision === DECISIONS.COMMIT) return 'COMMIT'
    if (sim.coordinator.decision === DECISIONS.ABORT) return 'ABORT'
    return 'PENDING'
  }, [sim.coordinator.decision, DECISIONS])

  const currentDecisionColor = useMemo(
    () => engine.decisionColor(sim.coordinator.decision),
    [sim.coordinator.decision, engine]
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
                      setCrashFlags((prev) => {
                        const next = {}
                        crashFields.forEach((field) => {
                          next[field.key] = Array.from({ length: count }, (_, i) => !!prev[field.key][i])
                        })
                        return next
                      })
                    }}
                    style={{ width: '100%' }}
                  />
                </Col>
              </Row>

              {Array.from({ length: participantCount }, (_, i) => i).map((i) => (
                <Row key={i} gutter={[8, 8]} align="middle">
                  <Col xs={24} sm={rowLayout.label}>
                    <Text strong>P{i + 1}</Text>
                  </Col>
                  <Col xs={24} sm={rowLayout.vote}>
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
                  {crashFields.map((field) => (
                    <Col key={field.key} xs={rowLayout.switchXs} sm={rowLayout.switch}>
                      <Switch
                        checked={!!crashFlags[field.key][i]}
                        onChange={(checked) =>
                          setCrashFlags((prev) => {
                            const next = { ...prev }
                            next[field.key] = [...prev[field.key]]
                            next[field.key][i] = checked
                            return next
                          })
                        }
                        disabled={sim.phase !== PHASES.IDLE}
                        checkedChildren={<CloseOutlined />}
                        unCheckedChildren={<CheckOutlined />}
                      />
                      <Text
                        type="secondary"
                        style={{ fontSize: rowLayout.switchLabelFontSize, marginLeft: rowLayout.switchLabelMarginLeft }}
                      >
                        {t[field.labelKey]}
                      </Text>
                    </Col>
                  ))}
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
                    {coordinatorCrashOptions.map((option) => (
                      <Option key={option.value} value={option.value}>
                        {t[option.labelKey]}
                      </Option>
                    ))}
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
                    STATES={STATES}
                    stateColor={engine.stateColor}
                    renderNodeAck={renderNodeAck}
                  />
                </Col>
                <Col xs={24} sm={12}>
                  <Card size="small" title={t.phaseTitle}>
                    <Badge color={engine.stateColor(sim.coordinator.state)} text={<Text strong>{phaseLabel}</Text>} />
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
                      STATES={STATES}
                      stateColor={engine.stateColor}
                      renderNodeAck={renderNodeAck}
                    />
                  </Col>
                ))}
              </Row>

              {sim.finished && (
                <Alert
                  type={sim.coordinator.decision === DECISIONS.COMMIT ? 'success' : 'warning'}
                  message={t.finished}
                  description={finishedDescription(sim)}
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

function NodeCard({ node, label, isCoordinator, onToggle, disabled, t, STATES, stateColor, renderNodeAck }) {
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
        {!isCoordinator && renderNodeAck && (
          <Text type="secondary" style={{ fontSize: 12 }}>
            {renderNodeAck(node)}
          </Text>
        )}
        <Button size="small" danger={!isCrashed} onClick={onToggle} disabled={disabled}>
          {isCrashed ? t.recoverButton : t.crashButton}
        </Button>
      </Space>
    </Card>
  )
}
