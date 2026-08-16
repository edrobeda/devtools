import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react'
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
  Select,
  Empty,
  Tooltip,
} from 'antd'
import {
  DashboardOutlined,
  SendOutlined,
  RedoOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  CopyOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  ALGORITHMS,
  ALGORITHM_LABELS,
  defaultConfig,
  initialState,
  step,
  resetState,
  describeState,
  capacityForAlgorithm,
  PRESETS,
  sourceCode,
} from '../utils/rateLimiterSimulator'

const { Title, Paragraph, Text } = Typography
const { Panel } = Collapse
const { Option } = Select

const translations = {
  pt: {
    title: 'Simulador de Rate Limiter',
    intro:
      'Experimente cinco algoritmos classicos de rate limiting 100% no navegador: Token Bucket, Leaky Bucket, Fixed Window, Sliding Window Log e Sliding Window Counter. Envie requests manualmente ou rode uma simulacao automatica para ver quais sao aceitas, rejeitadas e como o estado evolui ao longo do tempo.',
    algorithmLabel: 'Algoritmo',
    configTitle: 'Configuracao',
    presetsTitle: 'Cenarios rapidos',
    capacityLabel: 'Capacidade',
    capacityHelp: 'Maximo de requests/tonis ou agua que o balde suporta.',
    refillRateLabel: 'Taxa de recarga (tokens/seg)',
    refillRateHelp: 'Quantos tokens sao adicionados por segundo no Token Bucket.',
    leakRateLabel: 'Taxa de vazamento (requests/seg)',
    leakRateHelp: 'Quantos requests saem do balde por segundo no Leaky Bucket.',
    limitLabel: 'Limite de requests',
    limitHelp: 'Maximo de requests permitidos dentro da janela.',
    windowMsLabel: 'Janela (ms)',
    windowMsHelp: 'Tamanho da janela de tempo em milissegundos.',
    initialTokensLabel: 'Tokens iniciais',
    initialVolumeLabel: 'Volume inicial',
    applyConfig: 'Aplicar e reiniciar',
    actionsTitle: 'Acoes manuais',
    sendButton: 'Enviar request',
    resetButton: 'Reiniciar',
    autoTitle: 'Simulacao automatica',
    autoToggle: 'Ativar simulacao',
    intervalLabel: 'Intervalo entre requests (ms)',
    stateTitle: 'Estado atual',
    statsTitle: 'Estatisticas',
    total: 'Total',
    allowed: 'Aceitas',
    rejected: 'Rejeitadas',
    historyTitle: 'Historico de requests',
    noHistory: 'Nenhum request registrado ainda.',
    allowedTag: 'Aceita',
    rejectedTag: 'Rejeitada',
    explanationTitle: 'Como funciona',
    explanation: (
      <>
        Rate limiters evitam sobrecarga protegendo um servico contra trafego excessivo.{' '}
        <Text code>Token Bucket</Text> permite bursts controlados;{' '}
        <Text code>Leaky Bucket</Text> suaviza a saida a uma taxa constante;{' '}
        <Text code>Fixed Window</Text> e o mais simples, mas pode causar spikes na fronteira da janela;{' '}
        <Text code>Sliding Window Log</Text> e preciso e guarda timestamps reais;{' '}
        <Text code>Sliding Window Counter</Text> aproxima o comportamento pesando a janela anterior.
      </>
    ),
    sourceCode: 'Codigo-fonte do motor',
    copy: 'Copiar',
    copied: 'Copiado',
    milliseconds: 'ms',
    remaining: 'Disponivel',
    currentWindow: 'Janela atual',
  },
  en: {
    title: 'Rate Limiter Simulator',
    intro:
      'Experiment with five classic rate limiting algorithms 100% in the browser: Token Bucket, Leaky Bucket, Fixed Window, Sliding Window Log and Sliding Window Counter. Send requests manually or run an automatic simulation to see which are allowed, rejected and how the state evolves over time.',
    algorithmLabel: 'Algorithm',
    configTitle: 'Configuration',
    presetsTitle: 'Quick scenarios',
    capacityLabel: 'Capacity',
    capacityHelp: 'Maximum tokens/water the bucket can hold.',
    refillRateLabel: 'Refill rate (tokens/sec)',
    refillRateHelp: 'How many tokens are added per second in the Token Bucket.',
    leakRateLabel: 'Leak rate (requests/sec)',
    leakRateHelp: 'How many requests leak out per second in the Leaky Bucket.',
    limitLabel: 'Request limit',
    limitHelp: 'Maximum requests allowed inside the window.',
    windowMsLabel: 'Window (ms)',
    windowMsHelp: 'Time window size in milliseconds.',
    initialTokensLabel: 'Initial tokens',
    initialVolumeLabel: 'Initial volume',
    applyConfig: 'Apply & restart',
    actionsTitle: 'Manual actions',
    sendButton: 'Send request',
    resetButton: 'Reset',
    autoTitle: 'Automatic simulation',
    autoToggle: 'Enable simulation',
    intervalLabel: 'Interval between requests (ms)',
    stateTitle: 'Current state',
    statsTitle: 'Statistics',
    total: 'Total',
    allowed: 'Allowed',
    rejected: 'Rejected',
    historyTitle: 'Request history',
    noHistory: 'No requests recorded yet.',
    allowedTag: 'Allowed',
    rejectedTag: 'Rejected',
    explanationTitle: 'How it works',
    explanation: (
      <>
        Rate limiters prevent overload by protecting a service from excessive traffic.{' '}
        <Text code>Token Bucket</Text> allows controlled bursts;{' '}
        <Text code>Leaky Bucket</Text> smooths output to a constant rate;{' '}
        <Text code>Fixed Window</Text> is the simplest but may spike at the window boundary;{' '}
        <Text code>Sliding Window Log</Text> is precise and keeps real timestamps;{' '}
        <Text code>Sliding Window Counter</Text> approximates behavior by weighting the previous window.
      </>
    ),
    sourceCode: 'Engine source code',
    copy: 'Copy',
    copied: 'Copied',
    milliseconds: 'ms',
    remaining: 'Available',
    currentWindow: 'Current window',
  },
}

export default function RateLimiterSimulatorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const labels = ALGORITHM_LABELS[lang]
  const presets = PRESETS[lang]

  const [algorithm, setAlgorithm] = useState(ALGORITHMS.TOKEN_BUCKET)
  const [configValues, setConfigValues] = useState(() => defaultConfig(ALGORITHMS.TOKEN_BUCKET))

  const [simState, setSimState] = useState(() => initialState(algorithm, configValues))

  const [running, setRunning] = useState(false)
  const [intervalMs, setIntervalMs] = useState(400)

  const [copied, setCopied] = useState(false)

  const applyAlgorithm = useCallback((nextAlgorithm, nextConfig) => {
    setAlgorithm(nextAlgorithm)
    setConfigValues(nextConfig)
    setSimState(initialState(nextAlgorithm, nextConfig))
  }, [])

  const applyPreset = useCallback((preset) => {
    applyAlgorithm(preset.algorithm, preset.config)
  }, [applyAlgorithm])

  const handleAlgorithmChange = useCallback((value) => {
    applyAlgorithm(value, defaultConfig(value))
  }, [applyAlgorithm])

  const applyConfig = useCallback(() => {
    setSimState(initialState(algorithm, configValues))
  }, [algorithm, configValues])

  const sendRequest = useCallback(() => {
    setSimState((prev) => step(prev))
  }, [])

  const reset = useCallback(() => {
    setSimState(resetState(simState))
  }, [simState])

  useEffect(() => {
    if (!running) return undefined
    const id = setInterval(() => {
      setSimState((prev) => step(prev))
    }, intervalMs)
    return () => clearInterval(id)
  }, [running, intervalMs])

  const copySource = useCallback(() => {
    navigator.clipboard.writeText(sourceCode()).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }, [])

  const snapshot = describeState(simState)
  const isCapacityBased = capacityForAlgorithm(algorithm)

  const historyList = useMemo(
    () =>
      simState.history.map((entry) => ({
        ...entry,
        color: entry.allowed ? 'success' : 'error',
        text: entry.allowed ? t.allowedTag : t.rejectedTag,
      })),
    [simState.history, t]
  )

  function updateConfig(key, value) {
    setConfigValues((prev) => ({ ...prev, [key]: value }))
  }

  const barPercent = useMemo(() => {
    if (isCapacityBased && snapshot.capacity) {
      const value = algorithm === ALGORITHMS.TOKEN_BUCKET ? snapshot.tokens : snapshot.capacity - snapshot.volume
      return Math.min(100, Math.max(0, (value / snapshot.capacity) * 100))
    }
    if (snapshot.limit) {
      const value = snapshot.count ?? snapshot.current ?? 0
      return Math.min(100, Math.max(0, (value / snapshot.limit) * 100))
    }
    return 0
  }, [snapshot, algorithm, isCapacityBased])

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}>
        <DashboardOutlined /> {t.title}
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
              <div>
                <Text strong>{t.algorithmLabel}</Text>
                <Select value={algorithm} onChange={handleAlgorithmChange} style={{ width: '100%' }}>
                  {Object.values(ALGORITHMS).map((alg) => (
                    <Option key={alg} value={alg}>
                      {labels[alg]}
                    </Option>
                  ))}
                </Select>
              </div>

              <Row gutter={[16, 16]}>
                {(algorithm === ALGORITHMS.TOKEN_BUCKET || algorithm === ALGORITHMS.LEAKY_BUCKET) && (
                  <Col xs={24} sm={12}>
                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                      <Text strong>{t.capacityLabel}</Text>
                      <InputNumber
                        min={1}
                        max={1000}
                        value={configValues.capacity}
                        onChange={(v) => updateConfig('capacity', v ?? 1)}
                        style={{ width: '100%' }}
                      />
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {t.capacityHelp}
                      </Text>
                    </Space>
                  </Col>
                )}

                {algorithm === ALGORITHMS.TOKEN_BUCKET && (
                  <>
                    <Col xs={24} sm={12}>
                      <Space direction="vertical" size="small" style={{ width: '100%' }}>
                        <Text strong>{t.refillRateLabel}</Text>
                        <InputNumber
                          min={0.1}
                          max={1000}
                          step={0.1}
                          value={configValues.refillRate}
                          onChange={(v) => updateConfig('refillRate', v ?? 0.1)}
                          style={{ width: '100%' }}
                        />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {t.refillRateHelp}
                        </Text>
                      </Space>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Space direction="vertical" size="small" style={{ width: '100%' }}>
                        <Text strong>{t.initialTokensLabel}</Text>
                        <InputNumber
                          min={0}
                          max={1000}
                          value={configValues.initialTokens}
                          onChange={(v) => updateConfig('initialTokens', v ?? 0)}
                          style={{ width: '100%' }}
                        />
                      </Space>
                    </Col>
                  </>
                )}

                {algorithm === ALGORITHMS.LEAKY_BUCKET && (
                  <>
                    <Col xs={24} sm={12}>
                      <Space direction="vertical" size="small" style={{ width: '100%' }}>
                        <Text strong>{t.leakRateLabel}</Text>
                        <InputNumber
                          min={0.1}
                          max={1000}
                          step={0.1}
                          value={configValues.leakRate}
                          onChange={(v) => updateConfig('leakRate', v ?? 0.1)}
                          style={{ width: '100%' }}
                        />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {t.leakRateHelp}
                        </Text>
                      </Space>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Space direction="vertical" size="small" style={{ width: '100%' }}>
                        <Text strong>{t.initialVolumeLabel}</Text>
                        <InputNumber
                          min={0}
                          max={1000}
                          value={configValues.initialVolume}
                          onChange={(v) => updateConfig('initialVolume', v ?? 0)}
                          style={{ width: '100%' }}
                        />
                      </Space>
                    </Col>
                  </>
                )}

                {(algorithm === ALGORITHMS.FIXED_WINDOW ||
                  algorithm === ALGORITHMS.SLIDING_WINDOW_LOG ||
                  algorithm === ALGORITHMS.SLIDING_WINDOW_COUNTER) && (
                  <>
                    <Col xs={24} sm={12}>
                      <Space direction="vertical" size="small" style={{ width: '100%' }}>
                        <Text strong>{t.limitLabel}</Text>
                        <InputNumber
                          min={1}
                          max={10000}
                          value={configValues.limit}
                          onChange={(v) => updateConfig('limit', v ?? 1)}
                          style={{ width: '100%' }}
                        />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {t.limitHelp}
                        </Text>
                      </Space>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Space direction="vertical" size="small" style={{ width: '100%' }}>
                        <Text strong>{t.windowMsLabel}</Text>
                        <InputNumber
                          min={100}
                          max={60000}
                          step={100}
                          value={configValues.windowMs}
                          onChange={(v) => updateConfig('windowMs', v ?? 100)}
                          style={{ width: '100%' }}
                        />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {t.windowMsHelp}
                        </Text>
                      </Space>
                    </Col>
                  </>
                )}
              </Row>

              <Button onClick={applyConfig} block>
                {t.applyConfig}
              </Button>
            </Space>
          </Card>

          <Card title={t.actionsTitle} style={{ marginTop: 16 }}>
            <Space wrap>
              <Button type="primary" icon={<SendOutlined />} onClick={sendRequest}>
                {t.sendButton}
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
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title={t.stateTitle}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div
                  style={{
                    width: 120,
                    height: 120,
                    borderRadius: '50%',
                    background: isCapacityBased ? '#1677ff' : '#52c41a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: 28,
                    fontWeight: 700,
                    boxShadow: `0 0 0 8px ${isCapacityBased ? '#1677ff33' : '#52c41a33'}`,
                  }}
                >
                  {isCapacityBased ? Math.floor(barPercent) : Math.floor((1 - barPercent) * 100)}%
                </div>
                <Space direction="vertical" size="small">
                  <Text strong>{labels[algorithm]}</Text>
                  <Text>
                    {t.remaining}: <Text strong>{formatRemaining(snapshot, algorithm)}</Text>
                  </Text>
                  {snapshot.capacity && (
                    <Text type="secondary">
                      {algorithm === ALGORITHMS.TOKEN_BUCKET
                        ? `tokens ${format(snapshot.tokens)} / ${snapshot.capacity}`
                        : `volume ${format(snapshot.volume)} / ${snapshot.capacity}`}
                    </Text>
                  )}
                  {(snapshot.count !== undefined || snapshot.current !== undefined) && (
                    <Text type="secondary">
                      {snapshot.count !== undefined
                        ? `${t.currentWindow}: ${snapshot.count} / ${snapshot.limit}`
                        : `${t.currentWindow}: ${snapshot.current} + ${snapshot.previous} (prev) / ${snapshot.limit}`}
                    </Text>
                  )}
                </Space>
              </div>

              <div
                style={{
                  height: 16,
                  width: '100%',
                  background: '#f0f0f0',
                  borderRadius: 8,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${barPercent}%`,
                    background: isCapacityBased ? '#1677ff' : '#52c41a',
                    transition: 'width 0.2s ease',
                  }}
                />
              </div>

              <Alert
                type="info"
                message={describeAlgorithm(algorithm, lang)}
                showIcon
                style={{ width: '100%' }}
              />
            </Space>
          </Card>

          <Card title={t.statsTitle} style={{ marginTop: 16 }}>
            <Row gutter={[16, 16]}>
              <Col xs={12} sm={8}>
                <Card size="small">
                  <Statistic title={t.total} value={simState.stats.total} />
                </Card>
              </Col>
              <Col xs={12} sm={8}>
                <Card size="small">
                  <Statistic title={t.allowed} value={simState.stats.allowed} />
                </Card>
              </Col>
              <Col xs={12} sm={8}>
                <Card size="small">
                  <Statistic title={t.rejected} value={simState.stats.rejected} />
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
                  <Tooltip title={JSON.stringify(entry.stateSnapshot)}>
                    <Tag>{renderSnapshot(entry.stateSnapshot, algorithm)}</Tag>
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

function format(n) {
  return Number.isFinite(n) ? (Math.round(n * 100) / 100).toString() : '—'
}

function formatRemaining(snapshot, algorithm) {
  if (algorithm === ALGORITHMS.TOKEN_BUCKET) {
    return `${format(snapshot.tokens)} tokens`
  }
  if (algorithm === ALGORITHMS.LEAKY_BUCKET) {
    return `${format(snapshot.capacity - snapshot.volume)} slots`
  }
  if (snapshot.count !== undefined) {
    return `${Math.max(0, snapshot.limit - snapshot.count)} requests`
  }
  if (snapshot.current !== undefined) {
    const est = snapshot.current + snapshot.previous
    return `${Math.max(0, Math.floor((snapshot.limit - est) * 10) / 10)} requests`
  }
  return '—'
}

function renderSnapshot(snapshot, algorithm) {
  if (algorithm === ALGORITHMS.TOKEN_BUCKET) {
    return `${format(snapshot.tokens)}/${snapshot.capacity}`
  }
  if (algorithm === ALGORITHMS.LEAKY_BUCKET) {
    return `${format(snapshot.volume)}/${snapshot.capacity}`
  }
  if (algorithm === ALGORITHMS.FIXED_WINDOW) {
    return `${snapshot.count}/${snapshot.limit}`
  }
  if (algorithm === ALGORITHMS.SLIDING_WINDOW_LOG) {
    return `${snapshot.count}/${snapshot.limit}`
  }
  if (algorithm === ALGORITHMS.SLIDING_WINDOW_COUNTER) {
    return `${snapshot.current}+${snapshot.previous}/${snapshot.limit}`
  }
  return ''
}

function describeAlgorithm(algorithm, lang) {
  const texts = {
    pt: {
      tokenBucket: 'Token Bucket: tokens recarregam continuamente. Um request consome 1 token. Sem tokens = rejeitado.',
      leakyBucket:
        'Leaky Bucket: requests entram no balde e vazam a taxa fixa. Se o balde transbordar, request e rejeitado.',
      fixedWindow:
        'Fixed Window: contador zerado a cada janela de tempo. Simples, mas permite spike na fronteira.',
      slidingWindowLog:
        'Sliding Window Log: mantem timestamps dentro da janela. Preciso, mas custo de memoria proporcional ao limite.',
      slidingWindowCounter:
        'Sliding Window Counter: aproxima a janela deslizante pesando a janela anterior. Equilibrio entre precisao e memoria.',
    },
    en: {
      tokenBucket: 'Token Bucket: tokens refill continuously. A request consumes 1 token. No tokens = rejected.',
      leakyBucket:
        'Leaky Bucket: requests enter the bucket and leak at a fixed rate. If the bucket overflows, the request is rejected.',
      fixedWindow:
        'Fixed Window: counter resets each time window. Simple, but may cause a spike at the boundary.',
      slidingWindowLog:
        'Sliding Window Log: keeps timestamps inside the window. Precise, but memory cost grows with the limit.',
      slidingWindowCounter:
        'Sliding Window Counter: approximates sliding window by weighting the previous window. Good precision/memory balance.',
    },
  }
  return texts[lang][algorithm] || ''
}
