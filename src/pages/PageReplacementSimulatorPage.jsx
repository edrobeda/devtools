import React, { useMemo, useState, useCallback, useEffect } from 'react'
import {
  Typography,
  Card,
  Input,
  InputNumber,
  Space,
  Button,
  Row,
  Col,
  Tag,
  Statistic,
  Collapse,
  Alert,
  Select,
  Radio,
  Empty,
} from 'antd'
import {
  ExperimentOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
  CopyOutlined,
  StepForwardOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  ALGORITHMS,
  simulatePageReplacement,
  PRESETS,
  sourceCode,
} from '../utils/pageReplacementSimulator'

const { Title, Paragraph, Text } = Typography
const { Panel } = Collapse
const { Option } = Select

const translations = {
  pt: {
    title: 'Simulador de Substituição de Página',
    intro:
      'Visualize como diferentes algoritmos de substituição de página gerenciam a memória. Compare FIFO, LRU, LFU, Optimal e Clock (Second Chance) passo a passo. Tudo roda 100% no navegador.',
    inputTitle: 'Sequência de referências',
    inputPlaceholder: 'Ex.: 1 2 3 4 1 2 5 1 2 3 4 5',
    frameCountLabel: 'Quadros de memória',
    algorithmLabel: 'Algoritmo',
    runButton: 'Simular',
    resetButton: 'Limpar',
    stepButton: 'Passo',
    presetsTitle: 'Cenários rápidos',
    resultsTitle: 'Resultados',
    timelineTitle: 'Linha do tempo',
    statsTitle: 'Estatísticas',
    referenceLabel: 'Ref',
    faultLabel: 'Falta',
    hitLabel: 'Hit',
    replacedLabel: 'Vítima',
    hitRateLabel: 'Taxa de hit',
    faultsLabel: 'Page faults',
    hitsLabel: 'Hits',
    emptyState: 'Configure a sequência e clique em Simular para ver a evolução.',
    howItWorks: 'Como funciona',
    howItWorksText:
      'A memória física é dividida em quadros (frames). Quando um processo referencia uma página que não está na memória, ocorre um page fault e o sistema operacional precisa escolher uma página para remover. Cada algoritmo usa uma estratégia diferente: FIFO remove a mais antiga, LRU a menos recentemente usada, LFU a menos frequentemente usada, Optimal a que demorará mais a ser usada (olhando o futuro) e Clock usa um bit de referência circular.',
    sourceCode: 'Código-fonte do motor',
    copy: 'Copiar',
    copied: 'Copiado',
    compareMode: 'Modo de comparação',
    singleMode: 'Único algoritmo',
    allMode: 'Todos os algoritmos',
    comparisonTitle: 'Comparação de algoritmos',
    bestHitRate: 'Melhor taxa de hit',
  },
  en: {
    title: 'Page Replacement Simulator',
    intro:
      'Visualize how different page replacement algorithms manage memory. Compare FIFO, LRU, LFU, Optimal and Clock (Second Chance) step by step. Everything runs 100% in the browser.',
    inputTitle: 'Reference sequence',
    inputPlaceholder: 'E.g. 1 2 3 4 1 2 5 1 2 3 4 5',
    frameCountLabel: 'Memory frames',
    algorithmLabel: 'Algorithm',
    runButton: 'Simulate',
    resetButton: 'Clear',
    stepButton: 'Step',
    presetsTitle: 'Quick scenarios',
    resultsTitle: 'Results',
    timelineTitle: 'Timeline',
    statsTitle: 'Statistics',
    referenceLabel: 'Ref',
    faultLabel: 'Fault',
    hitLabel: 'Hit',
    replacedLabel: 'Victim',
    hitRateLabel: 'Hit rate',
    faultsLabel: 'Page faults',
    hitsLabel: 'Hits',
    emptyState: 'Set the reference sequence and click Simulate to see the evolution.',
    howItWorks: 'How it works',
    howItWorksText:
      'Physical memory is divided into frames. When a process references a page that is not in memory, a page fault occurs and the operating system must choose a page to evict. Each algorithm uses a different strategy: FIFO evicts the oldest, LRU the least recently used, LFU the least frequently used, Optimal the page that will not be used for the longest time (looking into the future), and Clock uses a circular reference bit.',
    sourceCode: 'Engine source code',
    copy: 'Copy',
    copied: 'Copied',
    compareMode: 'Comparison mode',
    singleMode: 'Single algorithm',
    allMode: 'All algorithms',
    comparisonTitle: 'Algorithm comparison',
    bestHitRate: 'Best hit rate',
  },
}

function Timeline({ result, t, stepIndex, setStepIndex }) {
  const { references, steps } = result

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8 }}>
        {references.map((ref, idx) => {
          const step = steps[idx]
          const isActive = idx === stepIndex
          return (
            <button
              key={idx}
              type="button"
              onClick={() => setStepIndex(idx)}
              style={{
                flex: '0 0 auto',
                border: `2px solid ${isActive ? '#1677ff' : '#d9d9d9'}`,
                borderRadius: 8,
                padding: '8px 12px',
                background: isActive ? '#e6f4ff' : '#fff',
                cursor: 'pointer',
                minWidth: 72,
                textAlign: 'center',
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 16 }}>{ref}</div>
              <Tag color={step.fault ? 'red' : 'green'} style={{ marginTop: 4 }}>
                {step.fault ? t.faultLabel : t.hitLabel}
              </Tag>
            </button>
          )
        })}
      </div>

      {stepIndex >= 0 && stepIndex < steps.length && (
        <Card
          size="small"
          title={
            <Space>
              <Text strong>
                {t.referenceLabel}: {steps[stepIndex].reference}
              </Text>
              <Tag color={steps[stepIndex].fault ? 'red' : 'green'}>
                {steps[stepIndex].fault ? t.faultLabel : t.hitLabel}
              </Tag>
              {steps[stepIndex].replaced && (
                <Text type="secondary">
                  {t.replacedLabel}: {steps[stepIndex].replaced}
                </Text>
              )}
            </Space>
          }
        >
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {steps[stepIndex].frames.map((frame, i) => (
              <div
                key={i}
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 8,
                  border: '2px solid #1677ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  background: frame ? '#f6ffed' : '#fafafa',
                }}
              >
                <Text strong style={{ fontSize: 18 }}>
                  {frame ? frame.page : '-'}
                </Text>
                {frame && result.algorithm === 'Clock' && (
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    R={frame.r}
                  </Text>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </Space>
  )
}

function ResultCard({ result, t, stepIndex, setStepIndex }) {
  return (
    <Card
      size="small"
      title={
        <Space>
          <Text strong>{result.algorithm}</Text>
          <Tag color="blue">{result.frameCount} frames</Tag>
        </Space>
      }
    >
      <Row gutter={[16, 16]}>
        <Col xs={8}>
          <Statistic title={t.faultsLabel} value={result.faults} />
        </Col>
        <Col xs={8}>
          <Statistic title={t.hitsLabel} value={result.hits} />
        </Col>
        <Col xs={8}>
          <Statistic
            title={t.hitRateLabel}
            value={result.hitRate.toFixed(2)}
            suffix="%"
          />
        </Col>
      </Row>
      <div style={{ marginTop: 16 }}>
        <Timeline result={result} t={t} stepIndex={stepIndex} setStepIndex={setStepIndex} />
      </div>
    </Card>
  )
}

export default function PageReplacementSimulatorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const presets = PRESETS[lang]

  const [references, setReferences] = useState('1 2 3 4 1 2 5 1 2 3 4 5')
  const [frameCount, setFrameCount] = useState(3)
  const [algorithm, setAlgorithm] = useState('FIFO')
  const [mode, setMode] = useState('single')
  const [results, setResults] = useState(null)
  const [stepIndex, setStepIndex] = useState(0)
  const [copied, setCopied] = useState(false)

  const runSimulation = useCallback(() => {
    if (mode === 'single') {
      const res = simulatePageReplacement(algorithm, references, frameCount)
      setResults([res])
    } else {
      const all = ALGORITHMS.map((alg) =>
        simulatePageReplacement(alg, references, frameCount)
      )
      setResults(all)
    }
    setStepIndex(0)
  }, [algorithm, references, frameCount, mode])

  useEffect(() => {
    runSimulation()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handlePreset = useCallback(
    (preset) => {
      setReferences(preset.references)
      setFrameCount(preset.frames)
      setTimeout(() => {
        const all = ALGORITHMS.map((alg) =>
          simulatePageReplacement(alg, preset.references, preset.frames)
        )
        setResults(mode === 'single' ? [all[ALGORITHMS.indexOf(algorithm)]] : all)
        setStepIndex(0)
      }, 0)
    },
    [algorithm, mode]
  )

  const handleCopySource = useCallback(() => {
    navigator.clipboard.writeText(sourceCode()).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }, [])

  const bestHitRate = useMemo(() => {
    if (!results || results.length === 0) return null
    return Math.max(...results.map((r) => r.hitRate))
  }, [results])

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div>
        <Title level={2}>
          <ExperimentOutlined style={{ marginRight: 8 }} />
          {t.title}
        </Title>
        <Paragraph>{t.intro}</Paragraph>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card title={t.inputTitle}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Input.TextArea
                rows={4}
                value={references}
                onChange={(e) => setReferences(e.target.value)}
                placeholder={t.inputPlaceholder}
              />
              <Row gutter={[16, 16]}>
                <Col xs={12}>
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <Text>{t.frameCountLabel}</Text>
                    <InputNumber
                      min={1}
                      max={8}
                      value={frameCount}
                      onChange={(v) => setFrameCount(v)}
                      style={{ width: '100%' }}
                    />
                  </Space>
                </Col>
                <Col xs={12}>
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <Text>{t.algorithmLabel}</Text>
                    <Select
                      value={algorithm}
                      onChange={setAlgorithm}
                      style={{ width: '100%' }}
                      disabled={mode === 'all'}
                    >
                      {ALGORITHMS.map((alg) => (
                        <Option key={alg} value={alg}>
                          {alg}
                        </Option>
                      ))}
                    </Select>
                  </Space>
                </Col>
              </Row>

              <Radio.Group
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                buttonStyle="solid"
              >
                <Radio.Button value="single">{t.singleMode}</Radio.Button>
                <Radio.Button value="all">{t.allMode}</Radio.Button>
              </Radio.Group>

              <Space>
                <Button
                  type="primary"
                  icon={<PlayCircleOutlined />}
                  onClick={runSimulation}
                >
                  {t.runButton}
                </Button>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={() => {
                    setReferences('')
                    setResults(null)
                    setStepIndex(0)
                  }}
                >
                  {t.resetButton}
                </Button>
              </Space>
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card title={t.presetsTitle}>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              {presets.map((preset) => (
                <Button
                  key={preset.key}
                  block
                  onClick={() => handlePreset(preset)}
                >
                  {preset.label}
                </Button>
              ))}
            </Space>
          </Card>
        </Col>
      </Row>

      {results && results.length > 0 && (
        <>
          {mode === 'all' && bestHitRate !== null && (
            <Alert
              message={
                <Space>
                  <Text strong>{t.bestHitRate}:</Text>
                  <Text>{bestHitRate.toFixed(2)}%</Text>
                </Space>
              }
              type="info"
              showIcon
            />
          )}

          <Title level={4}>{mode === 'all' ? t.comparisonTitle : t.resultsTitle}</Title>
          <Row gutter={[16, 16]}>
            {results.map((result, idx) => (
              <Col xs={24} md={mode === 'all' ? 12 : 24} key={result.algorithm}>
                <ResultCard
                  result={result}
                  t={t}
                  stepIndex={stepIndex}
                  setStepIndex={setStepIndex}
                />
              </Col>
            ))}
          </Row>
        </>
      )}

      {!results && (
        <Card>
          <Empty description={t.emptyState} />
        </Card>
      )}

      <Alert message={t.howItWorks} description={t.howItWorksText} type="info" showIcon />

      <Collapse>
        <Panel
          header={t.sourceCode}
          extra={
            <Button
              size="small"
              icon={<CopyOutlined />}
              onClick={(e) => {
                e.stopPropagation()
                handleCopySource()
              }}
            >
              {copied ? t.copied : t.copy}
            </Button>
          }
        >
          <pre>
            <code>{sourceCode()}</code>
          </pre>
        </Panel>
      </Collapse>
    </Space>
  )
}
