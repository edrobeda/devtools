import React, { useCallback, useMemo, useState } from 'react'
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
  Table,
  Empty,
  Tooltip,
  message,
} from 'antd'
import {
  ExperimentOutlined,
  PlusOutlined,
  ReloadOutlined,
  CompressOutlined,
  DeleteOutlined,
  CopyOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  ALGORITHMS,
  allocate,
  compact,
  computeStats,
  createInitialState,
  deallocate,
  PRESETS,
  resetState,
  sourceCode,
} from '../utils/memoryAllocationSimulator'

const { Title, Paragraph, Text } = Typography
const { Panel } = Collapse
const { Option } = Select

const translations = {
  pt: {
    title: 'Simulador de Alocação de Memória',
    intro:
      'Visualize como os algoritmos de alocação contígua gerenciam a memória: First Fit, Best Fit, Worst Fit e Next Fit. Aloque processos, libere blocos e veja como a fragmentação externa evolui. Tudo roda 100% no navegador.',
    configTitle: 'Configuração',
    memorySizeLabel: 'Tamanho da memória',
    algorithmLabel: 'Algoritmo de alocação',
    processNameLabel: 'Nome do processo',
    processNamePlaceholder: 'Ex.: Kernel',
    processSizeLabel: 'Tamanho (unidades)',
    allocateButton: 'Alocar',
    resetButton: 'Resetar',
    compactButton: 'Compactar',
    processesTitle: 'Processos alocados',
    processColumn: 'Processo',
    sizeColumn: 'Tamanho',
    addressColumn: 'Endereço',
    actionColumn: 'Ação',
    removeTooltip: 'Desalocar',
    visualizationTitle: 'Mapa de memória',
    statsTitle: 'Estatísticas',
    totalLabel: 'Total',
    usedLabel: 'Usado',
    freeLabel: 'Livre',
    processesLabel: 'Processos',
    largestFreeLabel: 'Maior bloco livre',
    fragmentationLabel: 'Fragmentação externa',
    presetsTitle: 'Cenários rápidos',
    noSpaceAlert: 'Não há bloco livre contíguo grande o suficiente para essa alocação.',
    invalidSizeAlert: 'O tamanho deve ser pelo menos 1 unidade.',
    emptyMemory: 'Memória vazia',
    freeBlockLabel: 'Livre',
    howItWorks: 'Como funciona',
    howItWorksText:
      'A memória física é modelada como um vetor contíguo de blocos. Cada algoritmo escolhe um bloco livre de forma diferente: First Fit pega o primeiro que serve; Best Fit escolhe o menor possível, deixando o menor desperdício; Worst Fit escolhe o maior, tentando preservar blocos médios; Next Fit lembra onde parou na última alocação. Quando um processo é liberado, blocos livres adjacentes são unidos (coalescência). A compactação move todos os processos alocados para o início da memória, eliminando a fragmentação externa.',
    sourceCode: 'Código-fonte do motor',
    copy: 'Copiar',
    copied: 'Copiado',
  },
  en: {
    title: 'Memory Allocation Simulator',
    intro:
      'Visualize how contiguous memory allocation algorithms manage memory: First Fit, Best Fit, Worst Fit and Next Fit. Allocate processes, free blocks and watch external fragmentation evolve. Everything runs 100% in the browser.',
    configTitle: 'Configuration',
    memorySizeLabel: 'Memory size',
    algorithmLabel: 'Allocation algorithm',
    processNameLabel: 'Process name',
    processNamePlaceholder: 'E.g. Kernel',
    processSizeLabel: 'Size (units)',
    allocateButton: 'Allocate',
    resetButton: 'Reset',
    compactButton: 'Compact',
    processesTitle: 'Allocated processes',
    processColumn: 'Process',
    sizeColumn: 'Size',
    addressColumn: 'Address',
    actionColumn: 'Action',
    removeTooltip: 'Deallocate',
    visualizationTitle: 'Memory map',
    statsTitle: 'Statistics',
    totalLabel: 'Total',
    usedLabel: 'Used',
    freeLabel: 'Free',
    processesLabel: 'Processes',
    largestFreeLabel: 'Largest free block',
    fragmentationLabel: 'External fragmentation',
    presetsTitle: 'Quick scenarios',
    noSpaceAlert: 'There is no contiguous free block large enough for this allocation.',
    invalidSizeAlert: 'Size must be at least 1 unit.',
    emptyMemory: 'Empty memory',
    freeBlockLabel: 'Free',
    howItWorks: 'How it works',
    howItWorksText:
      'Physical memory is modeled as a contiguous vector of blocks. Each algorithm picks a free block differently: First Fit takes the first one that fits; Best Fit chooses the smallest possible block, leaving the least waste; Worst Fit chooses the largest, trying to preserve medium-sized blocks; Next Fit remembers where it stopped during the last allocation. When a process is freed, adjacent free blocks are merged (coalescing). Compaction moves all allocated processes to the beginning of memory, eliminating external fragmentation.',
    sourceCode: 'Engine source code',
    copy: 'Copy',
    copied: 'Copied',
  },
}

function MemoryBar({ state, t }) {
  return (
    <div
      style={{
        display: 'flex',
        width: '100%',
        height: 80,
        border: '2px solid #d9d9d9',
        borderRadius: 8,
        overflow: 'hidden',
        background: '#fafafa',
      }}
    >
      {state.blocks.length === 0 ? (
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text type="secondary">{t.emptyMemory}</Text>
        </div>
      ) : (
        state.blocks.map((block) => {
          const pct = (block.size / state.memorySize) * 100
          const label = block.type === 'free' ? t.freeBlockLabel : block.processName
          return (
            <Tooltip
              key={block.id}
              title={`${label}: ${block.size} u @ ${block.start}`}
            >
              <div
                style={{
                  width: `${pct}%`,
                  minWidth: 4,
                  background: block.color,
                  borderRight: '1px solid rgba(0,0,0,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  color: block.type === 'free' ? '#8c8c8c' : '#fff',
                  fontSize: pct > 8 ? 12 : 0,
                  fontWeight: 600,
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  padding: '0 4px',
                }}
              >
                {pct > 8 && <span>{label}</span>}
                {pct > 12 && <span style={{ fontSize: 10, opacity: 0.9 }}>{block.size}u</span>}
              </div>
            </Tooltip>
          )
        })
      )}
    </div>
  )
}

export default function MemoryAllocationSimulatorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const presets = PRESETS[lang]

  const [state, setState] = useState(() => createInitialState(256))
  const [algorithm, setAlgorithm] = useState('First Fit')
  const [processName, setProcessName] = useState('')
  const [processSize, setProcessSize] = useState(32)
  const [memorySize, setMemorySize] = useState(256)
  const [copied, setCopied] = useState(false)

  const stats = useMemo(() => computeStats(state), [state])

  const allocatedProcesses = useMemo(
    () =>
      state.blocks
        .filter((b) => b.type === 'allocated')
        .map((b) => ({
          key: b.processId,
          processId: b.processId,
          name: b.processName,
          size: b.size,
          start: b.start,
        })),
    [state.blocks]
  )

  const handleAllocate = useCallback(() => {
    const nextName = processName.trim() || `P${state.nextProcessId}`
    const nextState = allocate(state, nextName, processSize, algorithm)
    if (nextState.error === 'NO_SPACE') {
      message.error(t.noSpaceAlert)
    } else if (nextState.error === 'INVALID_SIZE') {
      message.error(t.invalidSizeAlert)
    } else {
      setState(nextState)
      setProcessName('')
    }
  }, [state, processName, processSize, algorithm, t])

  const handleDeallocate = useCallback(
    (processId) => {
      setState((prev) => deallocate(prev, processId))
    },
    []
  )

  const handleCompact = useCallback(() => {
    setState((prev) => compact(prev))
  }, [])

  const handleReset = useCallback(() => {
    setState(resetState(memorySize))
  }, [memorySize])

  const handleMemorySizeChange = useCallback((value) => {
    const size = Math.max(64, Math.min(1024, Number(value) || 256))
    setMemorySize(size)
    setState(resetState(size))
  }, [])

  const handlePreset = useCallback(
    (preset) => {
      const size = Math.max(64, Math.min(1024, Number(preset.memorySize) || 256))
      setMemorySize(size)
      setAlgorithm(preset.algorithm || 'First Fit')
      let nextState = resetState(size)
      const alg = preset.algorithm || 'First Fit'
      preset.allocations.forEach((alloc) => {
        nextState = allocate(nextState, alloc.name, alloc.size, alg)
        nextState.error = null
      })
      if (preset.removals) {
        preset.removals.forEach((name) => {
          const block = nextState.blocks.find((b) => b.processName === name)
          if (block) nextState = deallocate(nextState, block.processId)
        })
      }
      if (preset.extra) {
        nextState = allocate(nextState, preset.extra.name, preset.extra.size, alg)
        nextState.error = null
      }
      setState(nextState)
    },
    []
  )

  const handleCopySource = useCallback(() => {
    navigator.clipboard.writeText(sourceCode()).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }, [])

  const processColumns = [
    {
      title: t.processColumn,
      dataIndex: 'name',
      key: 'name',
      render: (name) => <Text strong>{name}</Text>,
    },
    {
      title: t.sizeColumn,
      dataIndex: 'size',
      key: 'size',
      render: (size) => <Tag color="blue">{size} u</Tag>,
    },
    {
      title: t.addressColumn,
      dataIndex: 'start',
      key: 'start',
      render: (start, record) => (
        <Text type="secondary">
          {start}–{start + record.size - 1}
        </Text>
      ),
    },
    {
      title: t.actionColumn,
      key: 'action',
      render: (_, record) => (
        <Button
          size="small"
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleDeallocate(record.processId)}
        >
          {t.removeTooltip}
        </Button>
      ),
    },
  ]

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
          <Card title={t.configTitle}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Row gutter={[16, 16]}>
                <Col xs={12}>
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <Text>{t.memorySizeLabel}</Text>
                    <InputNumber
                      min={64}
                      max={1024}
                      value={memorySize}
                      onChange={handleMemorySizeChange}
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

              <Row gutter={[16, 16]}>
                <Col xs={12}>
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <Text>{t.processNameLabel}</Text>
                    <Input
                      value={processName}
                      onChange={(e) => setProcessName(e.target.value)}
                      placeholder={t.processNamePlaceholder}
                    />
                  </Space>
                </Col>
                <Col xs={12}>
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <Text>{t.processSizeLabel}</Text>
                    <InputNumber
                      min={1}
                      max={memorySize}
                      value={processSize}
                      onChange={(v) => setProcessSize(v)}
                      style={{ width: '100%' }}
                    />
                  </Space>
                </Col>
              </Row>

              <Space>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleAllocate}
                >
                  {t.allocateButton}
                </Button>
                <Button icon={<CompressOutlined />} onClick={handleCompact}>
                  {t.compactButton}
                </Button>
                <Button icon={<ReloadOutlined />} onClick={handleReset}>
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
                <Button key={preset.key} block onClick={() => handlePreset(preset)}>
                  {preset.label}
                </Button>
              ))}
            </Space>
          </Card>
        </Col>
      </Row>

      <Card title={t.visualizationTitle}>
        <MemoryBar state={state} t={t} />
      </Card>

      <Card title={t.statsTitle}>
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={8} md={4}>
            <Statistic title={t.totalLabel} value={stats.total} suffix="u" />
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Statistic title={t.usedLabel} value={stats.used} suffix="u" />
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Statistic title={t.freeLabel} value={stats.free} suffix="u" />
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Statistic title={t.processesLabel} value={stats.processCount} />
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Statistic title={t.largestFreeLabel} value={stats.largestFree} suffix="u" />
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Statistic
              title={t.fragmentationLabel}
              value={stats.externalFragmentation.toFixed(1)}
              suffix="%"
            />
          </Col>
        </Row>
      </Card>

      <Card title={t.processesTitle}>
        {allocatedProcesses.length > 0 ? (
          <Table
            dataSource={allocatedProcesses}
            columns={processColumns}
            pagination={false}
            size="small"
          />
        ) : (
          <Empty description={t.emptyMemory} image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </Card>

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
