import React, { useCallback, useEffect, useMemo, useState } from 'react'
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
  Tooltip,
} from 'antd'
import {
  ExperimentOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
  CopyOutlined,
  DatabaseOutlined,
  StepForwardOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  MAPPINGS,
  REPLACEMENTS,
  simulateCache,
  PRESETS,
  sourceCode,
} from '../utils/cacheSimulator'

const { Title, Paragraph, Text } = Typography
const { Panel } = Collapse
const { Option } = Select

const translations = {
  pt: {
    title: 'Simulador de Cache de Memória',
    intro:
      'Visualize como endereços de memória são mapeados em uma cache. Compare mapeamento direto, totalmente associativo e associativo por conjunto com políticas LRU, FIFO, LFU e Random. Tudo roda 100% no navegador.',
    inputTitle: 'Sequência de endereços',
    inputPlaceholder: 'Ex.: 0 16 32 48 64 80',
    addressBaseLabel: 'Base dos endereços',
    decBase: 'Decimal',
    hexBase: 'Hexadecimal',
    cacheSizeLabel: 'Tamanho da cache (bytes)',
    blockSizeLabel: 'Tamanho do bloco (bytes)',
    mappingLabel: 'Mapeamento',
    waysLabel: 'Vias (ways)',
    replacementLabel: 'Política de substituição',
    runButton: 'Simular',
    resetButton: 'Limpar',
    stepButton: 'Passo',
    presetsTitle: 'Cenários rápidos',
    resultsTitle: 'Resultados',
    timelineTitle: 'Linha do tempo',
    statsTitle: 'Estatísticas',
    addressLabel: 'Endereço',
    blockLabel: 'Bloco',
    offsetLabel: 'Offset',
    setLabel: 'Conjunto',
    tagLabel: 'Tag',
    hitLabel: 'Hit',
    missLabel: 'Miss',
    victimLabel: 'Vítima',
    hitRateLabel: 'Taxa de hit',
    missRateLabel: 'Taxa de miss',
    hitsLabel: 'Hits',
    missesLabel: 'Misses',
    compulsoryLabel: 'Compulsórios',
    conflictLabel: 'Conflito',
    capacityLabel: 'Capacidade',
    emptyState: 'Configure os parâmetros e clique em Simular para ver a evolução da cache.',
    howItWorks: 'Como funciona',
    howItWorksText:
      'A memória principal é dividida em blocos do tamanho definido. Cada acesso a um endereço é dividido em tag (identifica o bloco), índice (escolhe o conjunto/linha) e offset (posição dentro do bloco). Em mapeamento direto cada bloco pode ocupar apenas uma linha; em cache associativa ele pode ir para qualquer linha de um conjunto, exigindo uma política de substituição quando o conjunto enche.',
    sourceCode: 'Código-fonte do motor',
    copy: 'Copiar',
    copied: 'Copiado',
    configTitle: 'Configuração da cache',
    configSummary: 'Resumo',
    linesLabel: 'linhas',
    setsLabel: 'conjuntos',
    offsetBits: 'bits de offset',
    indexBits: 'bits de índice',
    tagBits: 'bits de tag',
    directMapping: 'Direto',
    fullyMapping: 'Totalmente associativo',
    setMapping: 'Associativo por conjunto',
  },
  en: {
    title: 'Memory Cache Simulator',
    intro:
      'Visualize how memory addresses are mapped into a cache. Compare direct mapped, fully associative and set-associative caches with LRU, FIFO, LFU and Random replacement policies. Everything runs 100% in the browser.',
    inputTitle: 'Address sequence',
    inputPlaceholder: 'E.g. 0 16 32 48 64 80',
    addressBaseLabel: 'Address base',
    decBase: 'Decimal',
    hexBase: 'Hexadecimal',
    cacheSizeLabel: 'Cache size (bytes)',
    blockSizeLabel: 'Block size (bytes)',
    mappingLabel: 'Mapping',
    waysLabel: 'Ways',
    replacementLabel: 'Replacement policy',
    runButton: 'Simulate',
    resetButton: 'Clear',
    stepButton: 'Step',
    presetsTitle: 'Quick scenarios',
    resultsTitle: 'Results',
    timelineTitle: 'Timeline',
    statsTitle: 'Statistics',
    addressLabel: 'Address',
    blockLabel: 'Block',
    offsetLabel: 'Offset',
    setLabel: 'Set',
    tagLabel: 'Tag',
    hitLabel: 'Hit',
    missLabel: 'Miss',
    victimLabel: 'Victim',
    hitRateLabel: 'Hit rate',
    missRateLabel: 'Miss rate',
    hitsLabel: 'Hits',
    missesLabel: 'Misses',
    compulsoryLabel: 'Compulsory',
    conflictLabel: 'Conflict',
    capacityLabel: 'Capacity',
    emptyState: 'Set the parameters and click Simulate to see the cache evolution.',
    howItWorks: 'How it works',
    howItWorksText:
      'Main memory is divided into blocks of the configured size. Every address access is split into tag (identifies the block), index (selects the set/line) and offset (position inside the block). In direct mapping each block can occupy only one line; in associative caches it can go into any line of a set, requiring a replacement policy when the set is full.',
    sourceCode: 'Engine source code',
    copy: 'Copy',
    copied: 'Copied',
    configTitle: 'Cache configuration',
    configSummary: 'Summary',
    linesLabel: 'lines',
    setsLabel: 'sets',
    offsetBits: 'offset bits',
    indexBits: 'index bits',
    tagBits: 'tag bits',
    directMapping: 'Direct',
    fullyMapping: 'Fully associative',
    setMapping: 'Set associative',
  },
}

function formatAddress(value, base) {
  if (base === 'hex') return `0x${value.toString(16).toUpperCase()}`
  return String(value)
}

function Timeline({ result, t, stepIndex, setStepIndex }) {
  const { sequence, steps } = result

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8 }}>
        {sequence.map((addr, idx) => {
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
              <div style={{ fontWeight: 700, fontSize: 16 }}>
                {formatAddress(addr, result.config.addressBase)}
              </div>
              <Tag color={step.hit ? 'green' : 'red'} style={{ marginTop: 4 }}>
                {step.hit ? t.hitLabel : t.missLabel}
              </Tag>
            </button>
          )
        })}
      </div>
    </Space>
  )
}

function CacheSnapshot({ result, stepIndex, t }) {
  const { config, steps } = result
  if (stepIndex < 0 || stepIndex >= steps.length) return null
  const step = steps[stepIndex]
  const snapshot = step.cacheSnapshot

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Row gutter={[8, 8]}>
        {snapshot.map((set, setIdx) => (
          <Col
            xs={24}
            md={config.numSets === 1 ? 24 : 12}
            lg={config.numSets === 1 ? 24 : Math.max(8, Math.floor(24 / Math.min(config.numSets, 3)))}
            key={setIdx}
          >
            <Card
              size="small"
              title={
                <Text strong>
                  {t.setLabel} {setIdx}
                  {setIdx === step.setIndex && (
                    <Tag color="blue" style={{ marginLeft: 8 }}>
                      {t.addressLabel} {formatAddress(step.address, config.addressBase)}
                    </Tag>
                  )}
                </Text>
              }
            >
              <Space wrap>
                {set.map((line, lineIdx) => {
                  const isActive = setIdx === step.setIndex && lineIdx === step.targetIndex
                  const wasVictim = step.victimLine && lineIdx === step.targetIndex && !step.hit
                  return (
                    <Tooltip
                      key={lineIdx}
                      title={
                        line.valid
                          ? `${t.tagLabel}: ${line.tag}`
                          : t.missLabel
                      }
                    >
                      <div
                        style={{
                          width: 72,
                          borderRadius: 8,
                          border: `2px solid ${isActive ? '#1677ff' : '#d9d9d9'}`,
                          background: line.valid
                            ? (isActive ? '#e6f4ff' : '#f6ffed')
                            : '#fafafa',
                          padding: '8px 4px',
                          textAlign: 'center',
                          position: 'relative',
                        }}
                      >
                        {wasVictim && step.victimLine && (
                          <div
                            style={{
                              position: 'absolute',
                              top: -8,
                              right: -8,
                              background: '#ff4d4f',
                              color: '#fff',
                              borderRadius: '50%',
                              width: 18,
                              height: 18,
                              fontSize: 10,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            ↓
                          </div>
                        )}
                        <Text strong style={{ fontSize: 16, display: 'block' }}>
                          {line.valid ? formatAddress(line.tag, config.addressBase) : '-'}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 10 }}>
                          {t.tagLabel}
                        </Text>
                      </div>
                    </Tooltip>
                  )
                })}
              </Space>
            </Card>
          </Col>
        ))}
      </Row>
    </Space>
  )
}

export default function CacheSimulatorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const presets = PRESETS[lang]

  const [sequence, setSequence] = useState('0 16 32 48 64 80 96 112 128 144')
  const [addressBase, setAddressBase] = useState('dec')
  const [cacheSize, setCacheSize] = useState(64)
  const [blockSize, setBlockSize] = useState(16)
  const [mapping, setMapping] = useState('direct')
  const [ways, setWays] = useState(1)
  const [replacement, setReplacement] = useState('LRU')
  const [result, setResult] = useState(null)
  const [stepIndex, setStepIndex] = useState(0)
  const [copied, setCopied] = useState(false)

  const runSimulation = useCallback(() => {
    const res = simulateCache({
      sequence,
      addressBase,
      cacheSize,
      blockSize,
      mapping,
      ways,
      replacement,
    })
    setResult(res)
    setStepIndex(0)
  }, [sequence, addressBase, cacheSize, blockSize, mapping, ways, replacement])

  useEffect(() => {
    runSimulation()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handlePreset = useCallback((preset) => {
    setSequence(preset.sequence)
    setAddressBase(preset.addressBase)
    setCacheSize(preset.cacheSize)
    setBlockSize(preset.blockSize)
    setMapping(preset.mapping)
    setWays(preset.ways)
    setReplacement(preset.replacement)
    // Deixa o proximo tick rodar a simulacao com os novos estados.
    setTimeout(() => {
      const res = simulateCache(preset)
      setResult(res)
      setStepIndex(0)
    }, 0)
  }, [])

  const handleCopySource = useCallback(() => {
    navigator.clipboard.writeText(sourceCode()).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }, [])

  const mappingLabel = useMemo(() => {
    if (mapping === 'direct') return t.directMapping
    if (mapping === 'fully-associative') return t.fullyMapping
    return t.setMapping
  }, [mapping, t])

  const showWays = mapping === 'set-associative'

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div>
        <Title level={2}>
          <DatabaseOutlined style={{ marginRight: 8 }} />
          {t.title}
        </Title>
        <Paragraph>{t.intro}</Paragraph>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={14}>
          <Card title={t.configTitle}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <Text>{t.inputTitle}</Text>
                <Input.TextArea
                  rows={3}
                  value={sequence}
                  onChange={(e) => setSequence(e.target.value)}
                  placeholder={t.inputPlaceholder}
                />
              </Space>

              <Radio.Group
                value={addressBase}
                onChange={(e) => setAddressBase(e.target.value)}
                buttonStyle="solid"
              >
                <Radio.Button value="dec">{t.decBase}</Radio.Button>
                <Radio.Button value="hex">{t.hexBase}</Radio.Button>
              </Radio.Group>

              <Row gutter={[16, 16]}>
                <Col xs={12}>
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <Text>{t.cacheSizeLabel}</Text>
                    <InputNumber
                      min={16}
                      max={8192}
                      step={16}
                      value={cacheSize}
                      onChange={(v) => setCacheSize(v)}
                      style={{ width: '100%' }}
                    />
                  </Space>
                </Col>
                <Col xs={12}>
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <Text>{t.blockSizeLabel}</Text>
                    <InputNumber
                      min={8}
                      max={512}
                      step={8}
                      value={blockSize}
                      onChange={(v) => setBlockSize(v)}
                      style={{ width: '100%' }}
                    />
                  </Space>
                </Col>
              </Row>

              <Row gutter={[16, 16]}>
                <Col xs={12}>
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <Text>{t.mappingLabel}</Text>
                    <Select value={mapping} onChange={setMapping} style={{ width: '100%' }}>
                      <Option value="direct">{t.directMapping}</Option>
                      <Option value="fully-associative">{t.fullyMapping}</Option>
                      <Option value="set-associative">{t.setMapping}</Option>
                    </Select>
                  </Space>
                </Col>
                <Col xs={12}>
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <Text>{t.replacementLabel}</Text>
                    <Select
                      value={replacement}
                      onChange={setReplacement}
                      style={{ width: '100%' }}
                      disabled={mapping === 'direct'}
                    >
                      {REPLACEMENTS.map((r) => (
                        <Option key={r} value={r}>
                          {r}
                        </Option>
                      ))}
                    </Select>
                  </Space>
                </Col>
              </Row>

              {showWays && (
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <Text>{t.waysLabel}</Text>
                  <InputNumber
                    min={1}
                    max={32}
                    value={ways}
                    onChange={(v) => setWays(v)}
                    style={{ width: '100%' }}
                  />
                </Space>
              )}

              <Space>
                <Button type="primary" icon={<PlayCircleOutlined />} onClick={runSimulation}>
                  {t.runButton}
                </Button>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={() => {
                    setSequence('')
                    setResult(null)
                    setStepIndex(0)
                  }}
                >
                  {t.resetButton}
                </Button>
              </Space>
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={10}>
          <Card title={t.presetsTitle}>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              {presets.map((preset) => (
                <Button key={preset.key} block onClick={() => handlePreset(preset)}>
                  {preset.label}
                </Button>
              ))}
            </Space>
          </Card>
        </Col>
      </Row>

      {result && result.steps.length > 0 && (
        <>
          <Title level={4}>{t.resultsTitle}</Title>

          <Row gutter={[16, 16]}>
            <Col xs={12} sm={6}>
              <Statistic title={t.hitRateLabel} value={result.stats.hitRate.toFixed(2)} suffix="%" />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic title={t.missRateLabel} value={result.stats.missRate.toFixed(2)} suffix="%" />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic title={t.hitsLabel} value={result.stats.hits} />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic title={t.missesLabel} value={result.stats.misses} />
            </Col>
            <Col xs={12} sm={8}>
              <Statistic title={t.compulsoryLabel} value={result.stats.compulsory} />
            </Col>
            <Col xs={12} sm={8}>
              <Statistic title={t.conflictLabel} value={result.stats.conflict} />
            </Col>
            <Col xs={12} sm={8}>
              <Statistic title={t.capacityLabel} value={result.stats.capacity} />
            </Col>
          </Row>

          <Card
            size="small"
            title={
              <Space>
                <Text strong>{mappingLabel}</Text>
                <Tag color="blue">
                  {result.config.numBlocks} {t.linesLabel}
                </Tag>
                {result.config.numSets > 1 && (
                  <Tag color="cyan">
                    {result.config.numSets} {t.setsLabel}
                  </Tag>
                )}
                <Tag>{result.config.offsetBits} {t.offsetBits}</Tag>
                {result.config.indexBits > 0 && (
                  <Tag>{result.config.indexBits} {t.indexBits}</Tag>
                )}
                <Tag>{result.config.tagBits} {t.tagBits}</Tag>
              </Space>
            }
          >
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Timeline result={result} t={t} stepIndex={stepIndex} setStepIndex={setStepIndex} />

              {stepIndex >= 0 && stepIndex < result.steps.length && (
                <Card
                  size="small"
                  title={
                    <Space>
                      <Text strong>
                        {t.addressLabel}: {formatAddress(result.steps[stepIndex].address, result.config.addressBase)}
                      </Text>
                      <Tag color={result.steps[stepIndex].hit ? 'green' : 'red'}>
                        {result.steps[stepIndex].hit ? t.hitLabel : t.missLabel}
                      </Tag>
                      {!result.steps[stepIndex].hit && result.steps[stepIndex].missType && (
                        <Tag>{result.steps[stepIndex].missType}</Tag>
                      )}
                    </Space>
                  }
                >
                  <Space wrap>
                    <Text>
                      {t.blockLabel}: {formatAddress(result.steps[stepIndex].blockAddress, result.config.addressBase)}
                    </Text>
                    <Text>
                      {t.offsetLabel}: {formatAddress(result.steps[stepIndex].offset, result.config.addressBase)}
                    </Text>
                    <Text>
                      {t.setLabel}: {result.steps[stepIndex].setIndex}
                    </Text>
                    <Text>
                      {t.tagLabel}: {formatAddress(result.steps[stepIndex].tag, result.config.addressBase)}
                    </Text>
                    {result.steps[stepIndex].victimLine && (
                      <Text type="danger">
                        {t.victimLabel}: {formatAddress(result.steps[stepIndex].victimLine.tag, result.config.addressBase)}
                      </Text>
                    )}
                  </Space>
                </Card>
              )}

              <CacheSnapshot result={result} stepIndex={stepIndex} t={t} />
            </Space>
          </Card>
        </>
      )}

      {!result && (
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
