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
  ForkOutlined,
  StepForwardOutlined,
  RedoOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  CopyOutlined,
  ThunderboltOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  STATES,
  STRATEGIES,
  PRESETS,
  defaultConfig,
  createSimulation,
  step,
  runTicks,
  resetSimulation,
  stateColor,
  strategyLabel,
  sourceCode,
} from '../utils/diningPhilosophersSimulator'

const { Title, Paragraph, Text } = Typography
const { Panel } = Collapse
const { Option } = Select

const translations = {
  pt: {
    title: 'Simulador de Filosofos Jantando',
    intro:
      'Experimente o classico problema de sincronizacao 100% no navegador. Cinco filosofos alternam entre pensar e comer, mas precisam de dois garfos para comer. Teste estrategias que evitam deadlock e starvation, e veja a mesa circular evoluir passo a passo.',
    configTitle: 'Configuracao',
    philosopherCountLabel: 'Numero de filosofos',
    strategyLabel: 'Estrategia',
    eatDurationLabel: 'Duracao da refeicao (ticks)',
    thinkDurationLabel: 'Duracao do pensamento (ticks)',
    timeoutLabel: 'Limite de timeout (ticks)',
    applyConfig: 'Aplicar e reiniciar',
    presetsTitle: 'Cenarios rapidos',
    tableTitle: 'Mesa circular',
    actionsTitle: 'Acoes manuais',
    stepButton: 'Proximo tick',
    step5Button: 'Avancar 5 ticks',
    resetButton: 'Reiniciar',
    autoTitle: 'Simulacao automatica',
    autoToggle: 'Rodar sozinho',
    intervalLabel: 'Intervalo entre ticks (ms)',
    statsTitle: 'Estatisticas',
    tick: 'Tick',
    totalMeals: 'Refeicoes totais',
    deadlock: 'Deadlock',
    maxEating: 'Maximo comendo juntos',
    avgHunger: 'Maior tempo com fome',
    logTitle: 'Log de eventos',
    noLog: 'Nenhum evento ainda.',
    explanationTitle: 'Como funciona',
    explanation: (
      <>
        O problema dos <Text code>Filosofos Jantando</Text> ilustra competicao por recursos
        compartilhados. Cada filosofo precisa dos dois garfos adjacentes para comer. Se todos
        pegarem o garfo da esquerda ao mesmo tempo, o sistema entra em <Text code>deadlock</Text>.
        Estrategias como <Text code>hierarquia de recursos</Text> (sempre pegar o de menor ID primeiro),
        um <Text code>arbitrador</Text> (so pegar se ambos estiverem livres) ou{' '}
        <Text code>timeout</Text> (soltar garfos apos esperar demais) eliminam o deadlock, mas ainda
        podem sofrer <Text code>starvation</Text> se um filosofo nunca conseguir os dois garfos.
      </>
    ),
    sourceCode: 'Codigo-fonte do motor',
    copy: 'Copiar',
    copied: 'Copiado',
    milliseconds: 'ms',
    thinking: 'Pensando',
    hungry: 'Com fome',
    eating: 'Comendo',
    heldBy: 'segurado por',
    free: 'livre',
    deadlockAlert: 'DEADLOCK detectado na mesa!',
  },
  en: {
    title: 'Dining Philosophers Simulator',
    intro:
      'Experiment with the classic synchronization problem 100% in the browser. Five philosophers alternate between thinking and eating, but each needs two forks to eat. Test strategies that avoid deadlock and starvation, and watch the circular table evolve step by step.',
    configTitle: 'Configuration',
    philosopherCountLabel: 'Number of philosophers',
    strategyLabel: 'Strategy',
    eatDurationLabel: 'Meal duration (ticks)',
    thinkDurationLabel: 'Thinking duration (ticks)',
    timeoutLabel: 'Timeout threshold (ticks)',
    applyConfig: 'Apply & restart',
    presetsTitle: 'Quick scenarios',
    tableTitle: 'Circular table',
    actionsTitle: 'Manual actions',
    stepButton: 'Next tick',
    step5Button: 'Advance 5 ticks',
    resetButton: 'Reset',
    autoTitle: 'Automatic simulation',
    autoToggle: 'Run automatically',
    intervalLabel: 'Interval between ticks (ms)',
    statsTitle: 'Statistics',
    tick: 'Tick',
    totalMeals: 'Total meals',
    deadlock: 'Deadlock',
    maxEating: 'Max eating concurrently',
    avgHunger: 'Longest hungry wait',
    logTitle: 'Event log',
    noLog: 'No events yet.',
    explanationTitle: 'How it works',
    explanation: (
      <>
        The <Text code>Dining Philosophers</Text> problem illustrates contention for shared resources.
        Each philosopher needs both adjacent forks to eat. If everyone grabs the left fork at the
        same time, the system enters a <Text code>deadlock</Text>. Strategies like{' '}
        <Text code>resource hierarchy</Text> (always pick the lower-ID fork first), an{' '}
        <Text code>arbitrator</Text> (only pick both when both are free), or <Text code>timeout</Text>{' '}
        (release forks after waiting too long) eliminate deadlock, but may still suffer from{' '}
        <Text code>starvation</Text> if one philosopher never gets both forks.
      </>
    ),
    sourceCode: 'Engine source code',
    copy: 'Copy',
    copied: 'Copied',
    milliseconds: 'ms',
    thinking: 'Thinking',
    hungry: 'Hungry',
    eating: 'Eating',
    heldBy: 'held by',
    free: 'free',
    deadlockAlert: 'DEADLOCK detected at the table!',
  },
}

const STATE_LABELS = {
  pt: {
    [STATES.THINKING]: 'Pensando',
    [STATES.HUNGRY]: 'Com fome',
    [STATES.EATING]: 'Comendo',
  },
  en: {
    [STATES.THINKING]: 'Thinking',
    [STATES.HUNGRY]: 'Hungry',
    [STATES.EATING]: 'Eating',
  },
}

export default function DiningPhilosophersSimulatorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const presets = PRESETS[lang]

  const [philosopherCount, setPhilosopherCount] = useState(defaultConfig().philosopherCount)
  const [strategy, setStrategy] = useState(defaultConfig().strategy)
  const [eatDuration, setEatDuration] = useState(defaultConfig().eatDuration)
  const [thinkDuration, setThinkDuration] = useState(defaultConfig().thinkDuration)
  const [timeoutThreshold, setTimeoutThreshold] = useState(defaultConfig().timeoutThreshold)

  const config = useMemo(
    () => ({
      philosopherCount,
      strategy,
      eatDuration,
      thinkDuration,
      timeoutThreshold,
    }),
    [philosopherCount, strategy, eatDuration, thinkDuration, timeoutThreshold]
  )

  const [sim, setSim] = useState(() => createSimulation(config))
  const [autoRun, setAutoRun] = useState(false)
  const [autoInterval, setAutoInterval] = useState(600)
  const [copied, setCopied] = useState(false)

  const applyConfig = useCallback(() => {
    setSim(createSimulation(config))
  }, [config])

  const applyPreset = useCallback(
    (preset) => {
      setPhilosopherCount(preset.philosopherCount)
      setStrategy(preset.strategy)
      setEatDuration(preset.eatDuration)
      setThinkDuration(preset.thinkDuration)
      setSim(
        createSimulation({
          philosopherCount: preset.philosopherCount,
          strategy: preset.strategy,
          eatDuration: preset.eatDuration,
          thinkDuration: preset.thinkDuration,
          timeoutThreshold: defaultConfig().timeoutThreshold,
        })
      )
    },
    []
  )

  const doStep = useCallback(() => {
    setSim((prev) => step(prev))
  }, [])

  const do5Steps = useCallback(() => {
    setSim((prev) => runTicks(prev, 5))
  }, [])

  const reset = useCallback(() => {
    setSim(resetSimulation(config))
  }, [config])

  useEffect(() => {
    if (!autoRun) return undefined
    const id = setInterval(() => {
      setSim((prev) => step(prev))
    }, autoInterval)
    return () => clearInterval(id)
  }, [autoRun, autoInterval])

  const copySource = useCallback(() => {
    navigator.clipboard.writeText(sourceCode()).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }, [])

  const maxHunger = useMemo(
    () => Math.max(0, ...sim.philosophers.map((p) => p.maxHungerTicks)),
    [sim.philosophers]
  )

  const isDeadlocked = sim.stats.deadlockTicks > 0

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}>
        <ForkOutlined /> {t.title}
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
        <Col xs={24} lg={10}>
          <Card title={t.configTitle}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Row gutter={[16, 16]} align="middle">
                <Col xs={24} sm={12}>
                  <Text strong>{t.philosopherCountLabel}</Text>
                </Col>
                <Col xs={24} sm={12}>
                  <InputNumber
                    min={3}
                    max={8}
                    value={philosopherCount}
                    onChange={(v) => setPhilosopherCount(v ?? 5)}
                    style={{ width: '100%' }}
                  />
                </Col>
              </Row>

              <Row gutter={[16, 16]} align="middle">
                <Col xs={24} sm={12}>
                  <Text strong>{t.strategyLabel}</Text>
                </Col>
                <Col xs={24} sm={12}>
                  <Select
                    value={strategy}
                    onChange={setStrategy}
                    style={{ width: '100%' }}
                  >
                    <Option value={STRATEGIES.NAIVE}>{strategyLabel(STRATEGIES.NAIVE, lang)}</Option>
                    <Option value={STRATEGIES.HIERARCHY}>{strategyLabel(STRATEGIES.HIERARCHY, lang)}</Option>
                    <Option value={STRATEGIES.ARBITRATOR}>{strategyLabel(STRATEGIES.ARBITRATOR, lang)}</Option>
                    <Option value={STRATEGIES.TIMEOUT}>{strategyLabel(STRATEGIES.TIMEOUT, lang)}</Option>
                  </Select>
                </Col>
              </Row>

              <Row gutter={[16, 16]} align="middle">
                <Col xs={24} sm={12}>
                  <Text strong>{t.eatDurationLabel}</Text>
                </Col>
                <Col xs={24} sm={12}>
                  <InputNumber
                    min={1}
                    max={10}
                    value={eatDuration}
                    onChange={(v) => setEatDuration(v ?? 3)}
                    style={{ width: '100%' }}
                  />
                </Col>
              </Row>

              <Row gutter={[16, 16]} align="middle">
                <Col xs={24} sm={12}>
                  <Text strong>{t.thinkDurationLabel}</Text>
                </Col>
                <Col xs={24} sm={12}>
                  <InputNumber
                    min={1}
                    max={10}
                    value={thinkDuration}
                    onChange={(v) => setThinkDuration(v ?? 3)}
                    style={{ width: '100%' }}
                  />
                </Col>
              </Row>

              {strategy === STRATEGIES.TIMEOUT && (
                <Row gutter={[16, 16]} align="middle">
                  <Col xs={24} sm={12}>
                    <Text strong>{t.timeoutLabel}</Text>
                  </Col>
                  <Col xs={24} sm={12}>
                    <InputNumber
                      min={2}
                      max={20}
                      value={timeoutThreshold}
                      onChange={(v) => setTimeoutThreshold(v ?? 5)}
                      style={{ width: '100%' }}
                    />
                  </Col>
                </Row>
              )}

              <Button onClick={applyConfig} block>
                {t.applyConfig}
              </Button>
            </Space>
          </Card>

          <Card title={t.actionsTitle} style={{ marginTop: 16 }}>
            <Space wrap>
              <Button type="primary" icon={<StepForwardOutlined />} onClick={doStep}>
                {t.stepButton}
              </Button>
              <Button icon={<StepForwardOutlined />} onClick={do5Steps}>
                {t.step5Button}
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
                />
              </div>
              <div>
                <Text strong>{t.intervalLabel}</Text>
                <Slider
                  min={100}
                  max={1500}
                  step={100}
                  value={autoInterval}
                  onChange={setAutoInterval}
                  tooltip={{ formatter: (v) => `${v} ${t.milliseconds}` }}
                />
              </div>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={14}>
          <Card title={`${t.tableTitle} — ${t.tick}: ${sim.tick}`}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <TableVisualization sim={sim} t={t} lang={lang} />

              {isDeadlocked && (
                <Alert
                  type="error"
                  message={t.deadlockAlert}
                  description="Todos os filosofos seguram um garfo e esperam o outro."
                  showIcon
                  icon={<WarningOutlined />}
                />
              )}
            </Space>
          </Card>

          <Card title={t.statsTitle} style={{ marginTop: 16 }}>
            <Row gutter={[16, 16]}>
              <Col xs={12} sm={8}>
                <Card size="small">
                  <Statistic title={t.totalMeals} value={sim.stats.totalMeals} />
                </Card>
              </Col>
              <Col xs={12} sm={8}>
                <Card size="small">
                  <Statistic title={t.maxEating} value={sim.stats.maxConcurrentEating} />
                </Card>
              </Col>
              <Col xs={12} sm={8}>
                <Card size="small">
                  <Statistic title={t.avgHunger} value={maxHunger} suffix={t.milliseconds.replace('ms', 'ticks')} />
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
                    T{entry.tick}
                  </Text>
                  <Tag
                    color={
                      entry.type === 'error'
                        ? 'error'
                        : entry.type === 'success'
                        ? 'success'
                        : entry.type === 'warning'
                        ? 'warning'
                        : 'default'
                    }
                  >
                    {entry.type}
                  </Tag>
                  <Tooltip title={`Tick ${entry.tick}`}>
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

function TableVisualization({ sim, t, lang }) {
  const size = 360
  const center = size / 2
  const tableRadius = 90
  const philosopherRadius = 130
  const forkRadius = 108

  const philosophers = sim.philosophers
  const count = philosophers.length
  const forks = sim.forks

  const getPosition = (radius, index) => {
    const angle = (index * 2 * Math.PI) / count - Math.PI / 2
    return {
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle),
    }
  }

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      style={{ width: '100%', maxWidth: 420, height: 'auto', display: 'block', margin: '0 auto' }}
    >
      <circle
        cx={center}
        cy={center}
        r={tableRadius}
        fill="#f0f0f0"
        stroke="#d9d9d9"
        strokeWidth={2}
      />
      <text
        x={center}
        y={center}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#595959"
        fontSize={14}
        fontWeight="bold"
      >
        {t.tick} {sim.tick}
      </text>

      {forks.map((fork) => {
        const pos = getPosition(forkRadius, fork.id)
        const angle = (fork.id * 360) / count - 90
        const isHeld = fork.heldBy !== null
        const holder = philosophers.find((p) => p.id === fork.heldBy)
        return (
          <g key={`fork-${fork.id}`} transform={`rotate(${angle + 90}, ${pos.x}, ${pos.y})`}>
            <line
              x1={pos.x - 18}
              y1={pos.y}
              x2={pos.x + 18}
              y2={pos.y}
              stroke={isHeld ? '#1890ff' : '#8c8c8c'}
              strokeWidth={4}
              strokeLinecap="round"
            />
            <line
              x1={pos.x - 18}
              y1={pos.y - 5}
              x2={pos.x - 18}
              y2={pos.y + 5}
              stroke={isHeld ? '#1890ff' : '#8c8c8c'}
              strokeWidth={4}
              strokeLinecap="round"
            />
            <line
              x1={pos.x + 18}
              y1={pos.y - 5}
              x2={pos.x + 18}
              y2={pos.y + 5}
              stroke={isHeld ? '#1890ff' : '#8c8c8c'}
              strokeWidth={4}
              strokeLinecap="round"
            />
            <title>
              {isHeld ? `${t.heldBy} ${holder?.name || ''}` : t.free}
            </title>
          </g>
        )
      })}

      {philosophers.map((philosopher, index) => {
        const pos = getPosition(philosopherRadius, index)
        const color = stateColor(philosopher.state)
        const label = STATE_LABELS[lang][philosopher.state]
        return (
          <g key={`philosopher-${philosopher.id}`}>
            <circle
              cx={pos.x}
              cy={pos.y}
              r={22}
              fill={color}
              stroke="#fff"
              strokeWidth={3}
            />
            <text
              x={pos.x}
              y={pos.y - 4}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#fff"
              fontSize={12}
              fontWeight="bold"
            >
              {philosopher.name}
            </text>
            <text
              x={pos.x}
              y={pos.y + 10}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#fff"
              fontSize={9}
            >
              {label}
            </text>
            <text
              x={pos.x}
              y={pos.y + 40}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#595959"
              fontSize={11}
            >
              {philosopher.meals} {t.totalMeals.toLowerCase()}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
