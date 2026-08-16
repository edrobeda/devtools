import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react'
import {
  Typography,
  Card,
  Space,
  InputNumber,
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
  Tooltip,
} from 'antd'
import {
  ThunderboltOutlined,
  CheckOutlined,
  CloseOutlined,
  RedoOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  CopyOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  STATES,
  PRESETS,
  defaultConfig,
  initialState,
  resetState,
  recordEvent,
  stateColor,
  stateLabel,
  sourceCode,
} from '../utils/circuitBreakerSimulator'

const { Title, Paragraph, Text } = Typography
const { Panel } = Collapse

const translations = {
  pt: {
    title: 'Simulador de Circuit Breaker',
    intro:
      'Experimente o padrao de resiliencia Circuit Breaker 100% no navegador. Controle quando o circuito fecha, abre e testa recuperacao apos falhas. Ideal para entender thresholds, janelas deslizantes e o estado half-open antes de colocar em producao.',
    configTitle: 'Configuracao',
    failureThresholdLabel: 'Falhas para abrir',
    failureThresholdHelp: 'Quantas falhas consecutivas dentro da janela abrem o circuito.',
    successThresholdLabel: 'Sucessos para fechar',
    successThresholdHelp: 'Em half-open, quantos sucessos consecutivos fecham o circuito.',
    timeoutLabel: 'Timeout (ms)',
    timeoutHelp: 'Tempo que o circuito fica ABERTO antes de testar novamente.',
    windowLabel: 'Janela deslizante (ms)',
    windowHelp: 'Apenas falhas dentro dessa janela contam para o threshold.',
    applyConfig: 'Aplicar e reiniciar',
    presetsTitle: 'Cenarios rapidos',
    stateTitle: 'Estado atual',
    closedDescription: 'Circuito FECHADO — requests passam normalmente.',
    openDescription: 'Circuito ABERTO — requests sao rejeitados ate o timeout passar.',
    halfOpenDescription: 'Circuito MEIO ABERTO — testando recuperacao com poucos requests.',
    actionsTitle: 'Acoes manuais',
    successButton: 'Request com sucesso',
    failureButton: 'Request com falha',
    resetButton: 'Reiniciar',
    autoTitle: 'Simulacao automatica',
    autoToggle: 'Ativar simulacao',
    intervalLabel: 'Intervalo entre requests (ms)',
    failureRateLabel: 'Taxa de falha',
    statsTitle: 'Estatisticas',
    total: 'Total',
    success: 'Sucessos',
    failure: 'Falhas',
    rejected: 'Rejeitados',
    transitions: 'Transicoes',
    historyTitle: 'Historico de requests',
    noHistory: 'Nenhum request registrado ainda.',
    historyRejected: 'Rejeitado',
    historySuccess: 'Sucesso',
    historyFailure: 'Falha',
    explanationTitle: 'Como funciona',
    explanation: (
      <>
        O <Text code>Circuit Breaker</Text> evita cascatas de falha em chamadas externas.
        Ele comeca <Text code>CLOSED</Text> (tudo passa). Apos{' '}
        <Text code>failureThreshold</Text> falhas dentro da janela deslizante, vai para{' '}
        <Text code>OPEN</Text> e rejeita requests imediatamente. Apos{' '}
        <Text code>timeoutDuration</Text> ele tenta <Text code>HALF_OPEN</Text>: se obtiver{' '}
        <Text code>successThreshold</Text> sucessos consecutivos, fecha novamente; qualquer
        falha reabre o circuito.
      </>
    ),
    sourceCode: 'Codigo-fonte do motor',
    copy: 'Copiar',
    copied: 'Copiado',
    milliseconds: 'ms',
  },
  en: {
    title: 'Circuit Breaker Simulator',
    intro:
      'Experiment with the Circuit Breaker resilience pattern 100% in the browser. Control when the circuit closes, opens, and tests recovery after failures. Great for understanding thresholds, sliding windows, and the half-open state before going to production.',
    configTitle: 'Configuration',
    failureThresholdLabel: 'Failures to open',
    failureThresholdHelp: 'How many failures within the window trigger OPEN.',
    successThresholdLabel: 'Successes to close',
    successThresholdHelp: 'In half-open, how many consecutive successes close the circuit.',
    timeoutLabel: 'Timeout (ms)',
    timeoutHelp: 'How long the circuit stays OPEN before trying again.',
    windowLabel: 'Sliding window (ms)',
    windowHelp: 'Only failures inside this window count toward the threshold.',
    applyConfig: 'Apply & restart',
    presetsTitle: 'Quick scenarios',
    stateTitle: 'Current state',
    closedDescription: 'Circuit CLOSED — requests flow normally.',
    openDescription: 'Circuit OPEN — requests are rejected until timeout expires.',
    halfOpenDescription: 'Circuit HALF-OPEN — testing recovery with a trickle of requests.',
    actionsTitle: 'Manual actions',
    successButton: 'Successful request',
    failureButton: 'Failed request',
    resetButton: 'Reset',
    autoTitle: 'Automatic simulation',
    autoToggle: 'Enable simulation',
    intervalLabel: 'Interval between requests (ms)',
    failureRateLabel: 'Failure rate',
    statsTitle: 'Statistics',
    total: 'Total',
    success: 'Successes',
    failure: 'Failures',
    rejected: 'Rejected',
    transitions: 'Transitions',
    historyTitle: 'Request history',
    noHistory: 'No requests recorded yet.',
    historyRejected: 'Rejected',
    historySuccess: 'Success',
    historyFailure: 'Failure',
    explanationTitle: 'How it works',
    explanation: (
      <>
        The <Text code>Circuit Breaker</Text> prevents failure cascades in external calls.
        It starts <Text code>CLOSED</Text> (everything passes). After{' '}
        <Text code>failureThreshold</Text> failures inside the sliding window it goes{' '}
        <Text code>OPEN</Text> and rejects requests immediately. After{' '}
        <Text code>timeoutDuration</Text> it tries <Text code>HALF_OPEN</Text>: if it gets{' '}
        <Text code>successThreshold</Text> consecutive successes the circuit closes again;
        any failure reopens it.
      </>
    ),
    sourceCode: 'Engine source code',
    copy: 'Copy',
    copied: 'Copied',
    milliseconds: 'ms',
  },
}

export default function CircuitBreakerSimulatorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const presets = PRESETS[lang]

  const [failureThreshold, setFailureThreshold] = useState(defaultConfig().failureThreshold)
  const [successThreshold, setSuccessThreshold] = useState(defaultConfig().successThreshold)
  const [timeoutDuration, setTimeoutDuration] = useState(defaultConfig().timeoutDuration)
  const [slidingWindowSize, setSlidingWindowSize] = useState(defaultConfig().slidingWindowSize)

  const config = useMemo(
    () => ({
      failureThreshold,
      successThreshold,
      timeoutDuration,
      slidingWindowSize,
    }),
    [failureThreshold, successThreshold, timeoutDuration, slidingWindowSize]
  )

  const [simState, setSimState] = useState(() => initialState(config))

  const [running, setRunning] = useState(false)
  const [intervalMs, setIntervalMs] = useState(600)
  const [failureRate, setFailureRate] = useState(0.4)
  const failureRateRef = useRef(failureRate)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    failureRateRef.current = failureRate
  }, [failureRate])

  useEffect(() => {
    if (!running) return undefined
    const id = setInterval(() => {
      const isFailure = Math.random() < failureRateRef.current
      setSimState((prev) => recordEvent(prev, !isFailure))
    }, intervalMs)
    return () => clearInterval(id)
  }, [running, intervalMs])

  const applyConfig = useCallback(() => {
    setSimState(initialState(config))
  }, [config])

  const applyPreset = useCallback((preset) => {
    setFailureThreshold(preset.failureThreshold)
    setSuccessThreshold(preset.successThreshold)
    setTimeoutDuration(preset.timeoutDuration)
    setSlidingWindowSize(preset.slidingWindowSize)
    setFailureRate(preset.failureRate)
    setSimState(
      initialState({
        failureThreshold: preset.failureThreshold,
        successThreshold: preset.successThreshold,
        timeoutDuration: preset.timeoutDuration,
        slidingWindowSize: preset.slidingWindowSize,
      })
    )
  }, [])

  const recordSuccess = useCallback(() => {
    setSimState((prev) => recordEvent(prev, true))
  }, [])

  const recordFailure = useCallback(() => {
    setSimState((prev) => recordEvent(prev, false))
  }, [])

  const reset = useCallback(() => {
    setSimState(resetState(simState))
  }, [simState])

  const copySource = useCallback(() => {
    navigator.clipboard.writeText(sourceCode()).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }, [])

  const currentColor = stateColor(simState.state)
  const currentLabel = stateLabel(simState.state, lang)
  const stateDescription =
    simState.state === STATES.CLOSED
      ? t.closedDescription
      : simState.state === STATES.OPEN
      ? t.openDescription
      : t.halfOpenDescription

  const historyList = useMemo(
    () =>
      simState.history.map((entry) => {
        let color = 'default'
        let text = ''
        if (entry.rejected) {
          color = 'error'
          text = t.historyRejected
        } else if (entry.success) {
          color = 'success'
          text = t.historySuccess
        } else {
          color = 'warning'
          text = t.historyFailure
        }
        return { ...entry, color, text }
      }),
    [simState.history, t]
  )

  const stats = simState.stats

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}>
        <ThunderboltOutlined /> {t.title}
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
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12}>
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <Text strong>{t.failureThresholdLabel}</Text>
                    <InputNumber
                      min={1}
                      max={20}
                      value={failureThreshold}
                      onChange={(v) => setFailureThreshold(v ?? 1)}
                      style={{ width: '100%' }}
                    />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {t.failureThresholdHelp}
                    </Text>
                  </Space>
                </Col>
                <Col xs={24} sm={12}>
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <Text strong>{t.successThresholdLabel}</Text>
                    <InputNumber
                      min={1}
                      max={10}
                      value={successThreshold}
                      onChange={(v) => setSuccessThreshold(v ?? 1)}
                      style={{ width: '100%' }}
                    />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {t.successThresholdHelp}
                    </Text>
                  </Space>
                </Col>
                <Col xs={24} sm={12}>
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <Text strong>{t.timeoutLabel}</Text>
                    <InputNumber
                      min={100}
                      max={60000}
                      step={100}
                      value={timeoutDuration}
                      onChange={(v) => setTimeoutDuration(v ?? 100)}
                      style={{ width: '100%' }}
                    />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {t.timeoutHelp}
                    </Text>
                  </Space>
                </Col>
                <Col xs={24} sm={12}>
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <Text strong>{t.windowLabel}</Text>
                    <InputNumber
                      min={100}
                      max={60000}
                      step={100}
                      value={slidingWindowSize}
                      onChange={(v) => setSlidingWindowSize(v ?? 100)}
                      style={{ width: '100%' }}
                    />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {t.windowHelp}
                    </Text>
                  </Space>
                </Col>
              </Row>
              <Button onClick={applyConfig} block>
                {t.applyConfig}
              </Button>
            </Space>
          </Card>

          <Card title={t.actionsTitle} style={{ marginTop: 16 }}>
            <Space wrap>
              <Button type="primary" icon={<CheckOutlined />} onClick={recordSuccess}>
                {t.successButton}
              </Button>
              <Button danger icon={<CloseOutlined />} onClick={recordFailure}>
                {t.failureButton}
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
                  checked={running}
                  onChange={setRunning}
                  checkedChildren={<PlayCircleOutlined />}
                  unCheckedChildren={<PauseCircleOutlined />}
                />
              </div>
              <div>
                <Text strong>{t.intervalLabel}</Text>
                <Slider
                  min={100}
                  max={2000}
                  step={100}
                  value={intervalMs}
                  onChange={setIntervalMs}
                  tooltip={{ formatter: (v) => `${v} ${t.milliseconds}` }}
                />
              </div>
              <div>
                <Text strong>{t.failureRateLabel}: {(failureRate * 100).toFixed(0)}%</Text>
                <Slider
                  min={0}
                  max={1}
                  step={0.05}
                  value={failureRate}
                  onChange={setFailureRate}
                  tooltip={{ formatter: (v) => `${(v * 100).toFixed(0)}%` }}
                />
              </div>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title={t.stateTitle}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }} align="center">
              <div
                style={{
                  width: 160,
                  height: 160,
                  borderRadius: '50%',
                  background: currentColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: 22,
                  fontWeight: 700,
                  textAlign: 'center',
                  boxShadow: `0 0 0 8px ${currentColor}33`,
                }}
              >
                {currentLabel}
              </div>
              <Alert
                type={
                  simState.state === STATES.CLOSED
                    ? 'success'
                    : simState.state === STATES.OPEN
                    ? 'error'
                    : 'warning'
                }
                message={stateDescription}
                showIcon
                style={{ width: '100%' }}
              />
              {simState.state === STATES.HALF_OPEN && (
                <Text>
                  {lang === 'pt' ? 'Sucessos no half-open: ' : 'Half-open successes: '}
                  <Text strong>{simState.halfOpenSuccesses}</Text> / {simState.config.successThreshold}
                </Text>
              )}
              {simState.state === STATES.OPEN && simState.openedAt && (
                <OpenCountdown openedAt={simState.openedAt} timeout={simState.config.timeoutDuration} lang={lang} />
              )}
            </Space>
          </Card>

          <Card title={t.statsTitle} style={{ marginTop: 16 }}>
            <Row gutter={[16, 16]}>
              <Col xs={12} sm={8}>
                <Card size="small">
                  <Statistic title={t.total} value={stats.total} />
                </Card>
              </Col>
              <Col xs={12} sm={8}>
                <Card size="small">
                  <Statistic title={t.success} value={stats.success} />
                </Card>
              </Col>
              <Col xs={12} sm={8}>
                <Card size="small">
                  <Statistic title={t.failure} value={stats.failure} />
                </Card>
              </Col>
              <Col xs={12} sm={8}>
                <Card size="small">
                  <Statistic title={t.rejected} value={stats.rejected} />
                </Card>
              </Col>
              <Col xs={12} sm={8}>
                <Card size="small">
                  <Statistic title={t.transitions} value={stats.transitions} />
                </Card>
              </Col>
              <Col xs={12} sm={8}>
                <Card size="small">
                  <Statistic
                    title={lang === 'pt' ? 'Falhas ativas' : 'Active failures'}
                    value={simState.failures.length}
                    suffix={`/ ${simState.config.failureThreshold}`}
                  />
                </Card>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      <Card title={t.historyTitle}>
        {historyList.length === 0 ? (
          <Empty description={t.noHistory} image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <List
            size="small"
            dataSource={historyList.slice(0, 50)}
            renderItem={(entry) => (
              <List.Item>
                <Space>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </Text>
                  <Tag color={entry.color}>{entry.text}</Tag>
                  <Tooltip title={`${entry.stateBefore} → ${entry.stateAfter}`}>
                    <Tag>{entry.stateBefore} → {entry.stateAfter}</Tag>
                  </Tooltip>
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

function OpenCountdown({ openedAt, timeout, lang }) {
  const [, setTick] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 250)
    return () => clearInterval(id)
  }, [])

  const remaining = Math.max(0, timeout - (Date.now() - openedAt))
  const seconds = (remaining / 1000).toFixed(1)
  return (
    <Text type="secondary">
      {lang === 'pt' ? 'Timeout em ' : 'Timeout in '}
      <Text strong>{seconds}s</Text>
    </Text>
  )
}
