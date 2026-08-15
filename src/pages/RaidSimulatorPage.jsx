import React, { useCallback, useMemo, useState } from 'react'
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
  Select,
  InputNumber,
  Tooltip,
  Empty,
  Divider,
} from 'antd'
import {
  ExperimentOutlined,
  CopyOutlined,
  ReloadOutlined,
  HddOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  RAID_LEVELS,
  RAID_CONFIG,
  calculateCapacity,
  calculateMetrics,
  distributeBlocks,
  isDataLost,
  PRESETS,
  sourceCode,
} from '../utils/raidSimulator'

const { Title, Paragraph, Text } = Typography
const { Panel } = Collapse
const { Option } = Select

const translations = {
  pt: {
    title: 'Simulador de RAID',
    intro:
      'Visualize como os dados sao distribuidos entre discos nos niveis RAID mais comuns. Calcule capacidade efetiva, tolerancia a falhas e entenda porque cada configuracao e mais rapida ou mais segura. Tudo roda 100% no navegador.',
    configTitle: 'Configuracao',
    levelLabel: 'Nivel RAID',
    diskCountLabel: 'Numero de discos',
    diskSizeLabel: 'Tamanho de cada disco (GB)',
    blockCountLabel: 'Blocos a visualizar',
    disksTitle: 'Discos',
    diskLabel: 'Disco',
    statsTitle: 'Metricas',
    rawCapacityLabel: 'Capacidade bruta',
    usableCapacityLabel: 'Capacidade util',
    efficiencyLabel: 'Eficiencia',
    faultToleranceLabel: 'Tolerancia a falhas',
    guaranteed: 'garantida',
    bestCase: 'melhor caso',
    diskFailed: 'falhou',
    dataLost: 'Dados perdidos',
    dataLostText: 'A configuracao atual perdeu dados. Recupere ou reconstrua os discos.',
    degraded: 'Degradado',
    degradedText: 'O arranjo ainda funciona, mas esta vulneravel a mais falhas.',
    healthy: 'Saudavel',
    healthyText: 'Todos os discos estao operacionais.',
    clickToFail: 'Clique para simular falha/ recuperacao',
    resetButton: 'Limpar falhas',
    presetsTitle: 'Cenarios rapidos',
    sourceCode: 'Codigo-fonte do motor',
    copy: 'Copiar',
    copied: 'Copiado',
    dataBlock: 'Dado',
    parityBlock: 'Paridade',
    mirrorBlock: 'Espelho',
    emptyBlock: 'Vazio',
    legendTitle: 'Legenda',
    blockIndex: 'Bloco',
    minDisksError: 'Este nivel requer pelo menos',
    disks: 'discos',
    evenDisksError: 'RAID 10 requer numero par de discos',
    performanceTitle: 'Performance relativa',
    readPenalty: 'Leitura',
    writePenalty: 'Escrita',
    descriptionTitle: 'Sobre este nivel',
    noDataLost: 'Nenhum dado perdido',
    noDataLostText: 'Mesmo com os discos marcados como falhos, os dados ainda podem ser reconstruidos.',
  },
  en: {
    title: 'RAID Simulator',
    intro:
      'Visualize how data is spread across disks in the most common RAID levels. Calculate usable capacity, fault tolerance and understand why each setup is faster or safer. Everything runs 100% in the browser.',
    configTitle: 'Configuration',
    levelLabel: 'RAID level',
    diskCountLabel: 'Number of disks',
    diskSizeLabel: 'Size of each disk (GB)',
    blockCountLabel: 'Blocks to visualize',
    disksTitle: 'Disks',
    diskLabel: 'Disk',
    statsTitle: 'Metrics',
    rawCapacityLabel: 'Raw capacity',
    usableCapacityLabel: 'Usable capacity',
    efficiencyLabel: 'Efficiency',
    faultToleranceLabel: 'Fault tolerance',
    guaranteed: 'guaranteed',
    bestCase: 'best case',
    diskFailed: 'failed',
    dataLost: 'Data lost',
    dataLostText: 'The current configuration has lost data. Recover or rebuild the disks.',
    degraded: 'Degraded',
    degradedText: 'The array still works, but is vulnerable to further failures.',
    healthy: 'Healthy',
    healthyText: 'All disks are operational.',
    clickToFail: 'Click to simulate failure / recovery',
    resetButton: 'Clear failures',
    presetsTitle: 'Quick scenarios',
    sourceCode: 'Engine source code',
    copy: 'Copy',
    copied: 'Copied',
    dataBlock: 'Data',
    parityBlock: 'Parity',
    mirrorBlock: 'Mirror',
    emptyBlock: 'Empty',
    legendTitle: 'Legend',
    blockIndex: 'Block',
    minDisksError: 'This level requires at least',
    disks: 'disks',
    evenDisksError: 'RAID 10 requires an even number of disks',
    performanceTitle: 'Relative performance',
    readPenalty: 'Read',
    writePenalty: 'Write',
    descriptionTitle: 'About this level',
    noDataLost: 'No data lost',
    noDataLostText: 'Even with the marked disks failed, the data can still be reconstructed.',
  },
}

function formatSize(gb) {
  if (gb >= 1000) return `${(gb / 1000).toFixed(2)} TB`
  return `${gb} GB`
}

function BlockLegend({ t }) {
  const items = [
    { color: '#1677ff', label: t.dataBlock },
    { color: '#52c41a', label: t.parityBlock },
    { color: '#722ed1', label: t.mirrorBlock },
    { color: '#f0f0f0', border: '#d9d9d9', label: t.emptyBlock },
  ]
  return (
    <Space wrap size="small">
      {items.map((item) => (
        <Space key={item.label} size={4}>
          <div
            style={{
              width: 16,
              height: 16,
              borderRadius: 4,
              background: item.color,
              border: item.border ? `1px solid ${item.border}` : 'none',
            }}
          />
          <Text type="secondary">{item.label}</Text>
        </Space>
      ))}
    </Space>
  )
}

export default function RaidSimulatorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [level, setLevel] = useState(RAID_LEVELS.RAID5)
  const [diskCount, setDiskCount] = useState(4)
  const [diskSize, setDiskSize] = useState(1000)
  const [blockCount, setBlockCount] = useState(12)
  const [failedDisks, setFailedDisks] = useState([])
  const [copyLabel, setCopyLabel] = useState(t.copy)

  const cfg = RAID_CONFIG[level]

  const validation = useMemo(() => {
    const errors = []
    if (diskCount < cfg.minDisks) {
      errors.push(`${t.minDisksError} ${cfg.minDisks} ${t.disks}`)
    }
    if (level === RAID_LEVELS.RAID10 && diskCount % 2 !== 0) {
      errors.push(t.evenDisksError)
    }
    return errors
  }, [level, diskCount, cfg.minDisks, t])

  const isValid = validation.length === 0

  const metrics = useMemo(() => {
    if (!isValid) return null
    return calculateMetrics(level, diskCount, diskSize, failedDisks)
  }, [level, diskCount, diskSize, failedDisks, isValid])

  const disks = useMemo(() => {
    if (!isValid) return []
    return distributeBlocks(level, diskCount, blockCount, failedDisks)
  }, [level, diskCount, blockCount, failedDisks, isValid])

  const toggleDiskFailure = useCallback((diskIndex) => {
    setFailedDisks((prev) => {
      if (prev.includes(diskIndex)) {
        return prev.filter((d) => d !== diskIndex)
      }
      return [...prev, diskIndex].sort((a, b) => a - b)
    })
  }, [])

  const handlePreset = useCallback((presetKey) => {
    const preset = PRESETS[presetKey]
    if (!preset) return
    setLevel(preset.level)
    setDiskCount(preset.diskCount)
    setDiskSize(preset.diskSize)
    setBlockCount(preset.blockCount)
    setFailedDisks([])
  }, [])

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(sourceCode)
      setCopyLabel(t.copied)
      setTimeout(() => setCopyLabel(t.copy), 1500)
    } catch {
      // ignore
    }
  }, [t])

  const levelOptions = useMemo(
    () => [
      RAID_LEVELS.RAID0,
      RAID_LEVELS.RAID1,
      RAID_LEVELS.RAID5,
      RAID_LEVELS.RAID6,
      RAID_LEVELS.RAID10,
    ],
    []
  )

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
        <Col xs={24} lg={8}>
          <Card title={t.configTitle}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Text strong>{t.levelLabel}</Text>
                <Select
                  value={level}
                  onChange={setLevel}
                  style={{ width: '100%', marginTop: 8 }}
                  options={levelOptions.map((l) => ({ value: l, label: l }))}
                />
              </div>

              <div>
                <Text strong>{t.diskCountLabel}</Text>
                <InputNumber
                  min={2}
                  max={16}
                  value={diskCount}
                  onChange={(value) => {
                    setDiskCount(value || 2)
                    setFailedDisks([])
                  }}
                  style={{ width: '100%', marginTop: 8 }}
                />
              </div>

              <div>
                <Text strong>{t.diskSizeLabel}</Text>
                <InputNumber
                  min={1}
                  max={100000}
                  step={100}
                  value={diskSize}
                  onChange={(value) => setDiskSize(value || 1)}
                  style={{ width: '100%', marginTop: 8 }}
                />
              </div>

              <div>
                <Text strong>{t.blockCountLabel}</Text>
                <InputNumber
                  min={1}
                  max={24}
                  value={blockCount}
                  onChange={(value) => setBlockCount(value || 1)}
                  style={{ width: '100%', marginTop: 8 }}
                />
              </div>

              {validation.length > 0 && (
                <Alert
                  type="error"
                  showIcon
                  message={validation.join(' / ')}
                />
              )}

              <Divider style={{ margin: '12px 0' }} />

              <div>
                <Text strong>{t.presetsTitle}</Text>
                <Space wrap style={{ marginTop: 8 }}>
                  {Object.keys(PRESETS).map((key) => (
                    <Button key={key} size="small" onClick={() => handlePreset(key)}>
                      {key}
                    </Button>
                  ))}
                </Space>
              </div>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={16}>
          <Card title={t.disksTitle} extra={<BlockLegend t={t} />}>
            {!isValid ? (
              <Empty description={validation[0]} />
            ) : (
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 8 }}>
                  {disks.map((disk, idx) => {
                    const dataBlocks = disk.blocks.filter((b) => b.type === 'data').length
                    const parityBlocks = disk.blocks.filter((b) => b.type === 'parity').length
                    return (
                      <Tooltip key={idx} title={t.clickToFail}>
                        <button
                          type="button"
                          onClick={() => toggleDiskFailure(idx)}
                          style={{
                            flex: '0 0 auto',
                            width: 120,
                            border: `2px solid ${disk.failed ? '#ff4d4f' : '#d9d9d9'}`,
                            borderRadius: 8,
                            padding: 12,
                            background: disk.failed ? '#fff1f0' : '#fff',
                            cursor: 'pointer',
                            textAlign: 'left',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <HddOutlined style={{ color: disk.failed ? '#ff4d4f' : '#1677ff' }} />
                            <Text strong>{`${t.diskLabel} ${idx + 1}`}</Text>
                          </div>
                          {disk.failed && (
                            <Tag color="error" style={{ marginBottom: 8 }}>
                              {t.diskFailed}
                            </Tag>
                          )}
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {disk.blocks.map((block, bidx) => {
                              let background = '#1677ff'
                              if (block.type === 'parity') background = '#52c41a'
                              if (block.type === 'empty') background = '#f0f0f0'
                              const title = block.type === 'data'
                                ? `${t.dataBlock} ${block.index}`
                                : block.type === 'parity'
                                  ? `${t.parityBlock} ${block.index}`
                                  : t.emptyBlock
                              return (
                                <Tooltip key={bidx} title={title}>
                                  <div
                                    style={{
                                      width: 22,
                                      height: 22,
                                      borderRadius: 4,
                                      background,
                                      border: block.type === 'empty' ? '1px solid #d9d9d9' : 'none',
                                      opacity: disk.failed ? 0.4 : 1,
                                    }}
                                  />
                                </Tooltip>
                              )
                            })}
                          </div>
                          <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
                            {dataBlocks > 0 && `${dataBlocks} ${t.dataBlock.toLowerCase()}`}
                            {parityBlocks > 0 && ` / ${parityBlocks} ${t.parityBlock.toLowerCase()}`}
                          </div>
                        </button>
                      </Tooltip>
                    )
                  })}
                </div>

                {metrics && (
                  <Alert
                    type={metrics.dataLost ? 'error' : metrics.degraded ? 'warning' : 'success'}
                    showIcon
                    icon={metrics.dataLost ? <CloseCircleOutlined /> : metrics.degraded ? <WarningOutlined /> : <CheckCircleOutlined />}
                    message={metrics.dataLost ? t.dataLost : metrics.degraded ? t.degraded : t.healthy}
                    description={metrics.dataLost ? t.dataLostText : metrics.degraded ? t.degradedText : t.healthyText}
                  />
                )}

                {metrics && metrics.failedCount > 0 && !metrics.dataLost && (
                  <Alert type="info" message={t.noDataLost} description={t.noDataLostText} showIcon />
                )}

                <Button icon={<ReloadOutlined />} onClick={() => setFailedDisks([])}>
                  {t.resetButton}
                </Button>
              </Space>
            )}
          </Card>
        </Col>
      </Row>

      {metrics && (
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12} lg={6}>
            <Card>
              <Statistic title={t.rawCapacityLabel} value={formatSize(metrics.rawCapacity)} />
            </Card>
          </Col>
          <Col xs={24} md={12} lg={6}>
            <Card>
              <Statistic title={t.usableCapacityLabel} value={formatSize(metrics.capacity)} />
            </Card>
          </Col>
          <Col xs={24} md={12} lg={6}>
            <Card>
              <Statistic
                title={t.efficiencyLabel}
                value={`${(metrics.efficiency * 100).toFixed(1)}%`}
              />
            </Card>
          </Col>
          <Col xs={24} md={12} lg={6}>
            <Card>
              <Statistic
                title={t.faultToleranceLabel}
                value={`${metrics.faultTolerance.guaranteed}${metrics.faultTolerance.bestCase > metrics.faultTolerance.guaranteed
                    ? ` (${metrics.faultTolerance.bestCase} ${t.bestCase})`
                    : ''}`}
                suffix={` ${t.guaranteed}`}
              />
            </Card>
          </Col>
          <Col xs={24} md={12} lg={6}>
            <Card>
              <Statistic title={`${t.performanceTitle} - ${t.readPenalty}`} value={`x${cfg.readPenalty}`} />
            </Card>
          </Col>
          <Col xs={24} md={12} lg={6}>
            <Card>
              <Statistic title={`${t.performanceTitle} - ${t.writePenalty}`} value={`x${cfg.writePenalty}`} />
            </Card>
          </Col>
        </Row>
      )}

      {cfg && (
        <Card title={t.descriptionTitle}>
          <Paragraph>{lang === 'pt' ? cfg.descriptionPt : cfg.descriptionEn}</Paragraph>
        </Card>
      )}

      <Card
        title={t.sourceCode}
        extra={
          <Button icon={<CopyOutlined />} size="small" onClick={handleCopy}>
            {copyLabel}
          </Button>
        }
      >
        <pre
          style={{
            background: '#f6ffed',
            padding: 16,
            borderRadius: 8,
            overflow: 'auto',
            fontSize: 13,
          }}
        >
          <code>{sourceCode}</code>
        </pre>
      </Card>
    </Space>
  )
}
