import React, { useMemo, useState } from 'react'
import {
  Typography,
  Card,
  InputNumber,
  Select,
  Space,
  Button,
  Row,
  Col,
  Statistic,
  Tag,
  Alert,
  Collapse,
  Slider,
  Table,
  Tooltip,
} from 'antd'
import {
  HddOutlined,
  ThunderboltOutlined,
  InfoCircleOutlined,
  CalculatorOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  BLOCK_UNITS,
  DRIVE_TYPES,
  getDriveTypes,
  getRaidLevels,
  getPresets,
  formatNumber,
  calculateDiskPerformance,
} from '../utils/diskPerformanceCalculator'
import sourceCode from '../utils/diskPerformanceCalculator.js?raw'

const { Title, Paragraph, Text } = Typography
const { Option } = Select
const { Panel } = Collapse

const sourceExample = `import { calculateDiskPerformance } from '../utils/diskPerformanceCalculator'

// Exemplo: array de 4 SSDs NVMe em RAID 10, bloco 8 KB,
// padrão 70% leitura e 90% aleatório (OLTP típico)
const result = calculateDiskPerformance({
  driveType: 'nvme_ssd',
  diskCount: 4,
  raidLevel: '10',
  blockSize: 8,
  blockUnit: 'KB',
  readRatio: 70,
  randomRatio: 90,
})

// result.random.mixedIops  -> IOPS mistos aleatórios
// result.random.mixedMBps  -> throughput correspondente
// result.latencyMs         -> latência estimada por op
// result.usableCapacityRatio -> fração útil da capacidade bruta
`

const translations = {
  pt: {
    title: 'Calculadora de Performance de Disco',
    subtitle: 'IOPS, throughput, latência e impacto do RAID',
    intro: 'Estime a performance de storage a partir do tipo de drive, tamanho do bloco de I/O, mix de leitura/escrita, padrão aleatório/sequencial e configuração RAID. Útil para dimensionar bancos de dados, servidores de arquivos, arrays de discos e entender por que nem sempre mais discos significam mais IOPS.',
    driveType: 'Tipo de drive',
    customDrive: 'Drive personalizado',
    seekMs: 'Seek time (ms)',
    rotationalLatencyMs: 'Latência rotacional (ms)',
    controllerMs: 'Latência do controlador (ms)',
    sequentialMBps: 'Throughput sequencial (MB/s)',
    diskCount: 'Quantidade de discos',
    raidLevel: 'Nível RAID',
    blockSize: 'Tamanho do bloco',
    readRatio: 'Leitura',
    writeRatio: 'Escrita',
    randomRatio: 'Acesso aleatório',
    sequentialRatio: 'Acesso sequencial',
    accessPattern: 'Padrão de acesso',
    presets: 'Cenários rápidos',
    results: 'Resultados',
    iops: 'IOPS',
    throughput: 'Throughput',
    latency: 'Latência estimada',
    random: 'Aleatório',
    sequential: 'Sequencial',
    mixed: 'Misto',
    read: 'Leitura',
    write: 'Escrita',
    effective: 'Efetivo',
    writePenalty: 'Write penalty RAID',
    usableCapacity: 'Capacidade útil',
    note: 'Os valores são estimativas de ordem de grandeza. Performance real depende de firmware, fila de comandos (queue depth), cache, protocolo de interface (SATA, SAS, NVMe), rede em storage compartilhado e carga de trabalho específica.',
    sourceCode: 'Código-fonte do motor',
    sourceIntro: 'O motor calcula IOPS a partir das latências mecânicas e eletrônicas, aplica o fator RAID e deriva throughput. Tudo roda no navegador — nenhum dado sai daqui.',
    pattern: 'Padrão',
  },
  en: {
    title: 'Disk Performance Calculator',
    subtitle: 'IOPS, throughput, latency and RAID impact',
    intro: 'Estimate storage performance from the drive type, I/O block size, read/write mix, random/sequential pattern and RAID configuration. Useful for sizing databases, file servers, disk arrays and understanding why more disks do not always mean more IOPS.',
    driveType: 'Drive type',
    customDrive: 'Custom drive',
    seekMs: 'Seek time (ms)',
    rotationalLatencyMs: 'Rotational latency (ms)',
    controllerMs: 'Controller latency (ms)',
    sequentialMBps: 'Sequential throughput (MB/s)',
    diskCount: 'Number of disks',
    raidLevel: 'RAID level',
    blockSize: 'Block size',
    readRatio: 'Read',
    writeRatio: 'Write',
    randomRatio: 'Random access',
    sequentialRatio: 'Sequential access',
    accessPattern: 'Access pattern',
    presets: 'Quick scenarios',
    results: 'Results',
    iops: 'IOPS',
    throughput: 'Throughput',
    latency: 'Estimated latency',
    random: 'Random',
    sequential: 'Sequential',
    mixed: 'Mixed',
    read: 'Read',
    write: 'Write',
    effective: 'Effective',
    writePenalty: 'RAID write penalty',
    usableCapacity: 'Usable capacity',
    note: 'Values are order-of-magnitude estimates. Real performance depends on firmware, queue depth, cache, interface protocol (SATA, SAS, NVMe), network in shared storage, and the actual workload.',
    sourceCode: 'Engine source code',
    sourceIntro: 'The engine calculates IOPS from mechanical and electronic latencies, applies the RAID factor and derives throughput. Everything runs in the browser — no data leaves this page.',
    pattern: 'Pattern',
  },
}

export default function DiskPerformanceCalculatorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [driveType, setDriveType] = useState('nvme_ssd')
  const [seekMs, setSeekMs] = useState(DRIVE_TYPES.nvme_ssd.seekMs)
  const [rotationalLatencyMs, setRotationalLatencyMs] = useState(DRIVE_TYPES.nvme_ssd.rotationalLatencyMs)
  const [controllerMs, setControllerMs] = useState(DRIVE_TYPES.nvme_ssd.controllerMs)
  const [sequentialMBps, setSequentialMBps] = useState(DRIVE_TYPES.nvme_ssd.sequentialMBps)
  const [diskCount, setDiskCount] = useState(4)
  const [raidLevel, setRaidLevel] = useState('10')
  const [blockSize, setBlockSize] = useState(8)
  const [blockUnit, setBlockUnit] = useState('KB')
  const [readRatio, setReadRatio] = useState(70)
  const [randomRatio, setRandomRatio] = useState(90)

  const driveTypes = useMemo(() => getDriveTypes(lang), [lang])
  const raidLevels = useMemo(() => getRaidLevels(lang), [lang])
  const presets = useMemo(() => getPresets(lang), [lang])

  const isCustom = driveType === 'custom'

  const result = useMemo(() => {
    return calculateDiskPerformance({
      driveType,
      customDrive: {
        seekMs,
        rotationalLatencyMs,
        controllerMs,
        sequentialMBps,
        label: { pt: 'Personalizado', en: 'Custom' },
      },
      diskCount,
      raidLevel,
      blockSize,
      blockUnit,
      readRatio,
      randomRatio,
    })
  }, [
    driveType,
    seekMs,
    rotationalLatencyMs,
    controllerMs,
    sequentialMBps,
    diskCount,
    raidLevel,
    blockSize,
    blockUnit,
    readRatio,
    randomRatio,
  ])

  const handleDriveChange = (value) => {
    setDriveType(value)
    if (value !== 'custom') {
      const drive = DRIVE_TYPES[value]
      setSeekMs(drive.seekMs)
      setRotationalLatencyMs(drive.rotationalLatencyMs)
      setControllerMs(drive.controllerMs)
      setSequentialMBps(drive.sequentialMBps)
    }
  }

  const applyPreset = (preset) => {
    setDriveType(preset.driveType)
    setDiskCount(preset.diskCount)
    setRaidLevel(preset.raidLevel)
    setBlockSize(preset.blockSize)
    setBlockUnit(preset.blockUnit)
    setReadRatio(preset.readRatio)
    setRandomRatio(preset.randomRatio)
    const drive = DRIVE_TYPES[preset.driveType]
    if (drive) {
      setSeekMs(drive.seekMs)
      setRotationalLatencyMs(drive.rotationalLatencyMs)
      setControllerMs(drive.controllerMs)
      setSequentialMBps(drive.sequentialMBps)
    }
  }

  const tableColumns = [
    { title: t.pattern, dataIndex: 'pattern', key: 'pattern' },
    { title: `${t.iops} (${t.read})`, dataIndex: 'readIops', key: 'readIops', align: 'right' },
    { title: `${t.iops} (${t.write})`, dataIndex: 'writeIops', key: 'writeIops', align: 'right' },
    { title: `${t.iops} (${t.mixed})`, dataIndex: 'mixedIops', key: 'mixedIops', align: 'right' },
    { title: `${t.throughput} (${t.read})`, dataIndex: 'readMBps', key: 'readMBps', align: 'right' },
    { title: `${t.throughput} (${t.write})`, dataIndex: 'writeMBps', key: 'writeMBps', align: 'right' },
    { title: `${t.throughput} (${t.mixed})`, dataIndex: 'mixedMBps', key: 'mixedMBps', align: 'right' },
  ]

  const tableData = useMemo(() => {
    if (!result) return []
    const fmt = (n) => `${formatNumber(n)} MB/s`
    return [
      {
        key: 'random',
        pattern: t.random,
        readIops: formatNumber(result.random.readIops, 0),
        writeIops: formatNumber(result.random.writeIops, 0),
        mixedIops: formatNumber(result.random.mixedIops, 0),
        readMBps: fmt(result.random.readMBps),
        writeMBps: fmt(result.random.writeMBps),
        mixedMBps: fmt(result.random.mixedMBps),
      },
      {
        key: 'sequential',
        pattern: t.sequential,
        readIops: '—',
        writeIops: '—',
        mixedIops: '—',
        readMBps: fmt(result.sequential.readMBps),
        writeMBps: fmt(result.sequential.writeMBps),
        mixedMBps: fmt(result.sequential.mixedMBps),
      },
      {
        key: 'effective',
        pattern: t.effective,
        readIops: formatNumber(result.effective.readIops, 0),
        writeIops: formatNumber(result.effective.writeIops, 0),
        mixedIops: formatNumber(result.effective.mixedIops, 0),
        readMBps: fmt(result.effective.readMBps),
        writeMBps: fmt(result.effective.writeMBps),
        mixedMBps: fmt(result.effective.mixedMBps),
      },
    ]
  }, [result, t])

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}>
        <HddOutlined /> {t.title}
      </Title>
      <Paragraph>{t.intro}</Paragraph>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card
            title={
              <span>
                <CalculatorOutlined /> {t.presets}
              </span>
            }
            size="small"
          >
            <Space wrap>
              {presets.map((preset) => (
                <Button key={preset.key} onClick={() => applyPreset(preset)}>
                  {preset.label[lang] || preset.label.pt}
                </Button>
              ))}
            </Space>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title={t.driveType} size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Select value={driveType} onChange={handleDriveChange} style={{ width: '100%' }}>
                {driveTypes.map((d) => (
                  <Option key={d.key} value={d.key}>
                    {d.label}
                  </Option>
                ))}
              </Select>

              {isCustom && (
                <Row gutter={[8, 8]}>
                  <Col span={12}>
                    <Text type="secondary">{t.seekMs}</Text>
                    <InputNumber
                      value={seekMs}
                      onChange={(v) => setSeekMs(v || 0)}
                      step={0.01}
                      min={0}
                      style={{ width: '100%' }}
                    />
                  </Col>
                  <Col span={12}>
                    <Text type="secondary">{t.rotationalLatencyMs}</Text>
                    <InputNumber
                      value={rotationalLatencyMs}
                      onChange={(v) => setRotationalLatencyMs(v || 0)}
                      step={0.01}
                      min={0}
                      style={{ width: '100%' }}
                    />
                  </Col>
                  <Col span={12}>
                    <Text type="secondary">{t.controllerMs}</Text>
                    <InputNumber
                      value={controllerMs}
                      onChange={(v) => setControllerMs(v || 0)}
                      step={0.01}
                      min={0}
                      style={{ width: '100%' }}
                    />
                  </Col>
                  <Col span={12}>
                    <Text type="secondary">{t.sequentialMBps}</Text>
                    <InputNumber
                      value={sequentialMBps}
                      onChange={(v) => setSequentialMBps(v || 0)}
                      step={10}
                      min={1}
                      style={{ width: '100%' }}
                    />
                  </Col>
                </Row>
              )}

              <Row gutter={[8, 8]} align="middle">
                <Col span={12}>
                  <Text type="secondary">{t.diskCount}</Text>
                  <InputNumber
                    value={diskCount}
                    onChange={(v) => setDiskCount(v || 1)}
                    min={1}
                    max={128}
                    style={{ width: '100%' }}
                  />
                </Col>
                <Col span={12}>
                  <Text type="secondary">{t.raidLevel}</Text>
                  <Select value={raidLevel} onChange={setRaidLevel} style={{ width: '100%' }}>
                    {raidLevels.map((r) => (
                      <Option key={r.key} value={r.key}>
                        {r.label}
                      </Option>
                    ))}
                  </Select>
                </Col>
              </Row>

              <Row gutter={[8, 8]} align="middle">
                <Col span={12}>
                  <Text type="secondary">{t.blockSize}</Text>
                  <InputNumber
                    value={blockSize}
                    onChange={(v) => setBlockSize(v || 1)}
                    min={1}
                    style={{ width: '100%' }}
                  />
                </Col>
                <Col span={12}>
                  <Text type="secondary">&nbsp;</Text>
                  <Select value={blockUnit} onChange={setBlockUnit} style={{ width: '100%' }}>
                    {Object.keys(BLOCK_UNITS).map((u) => (
                      <Option key={u} value={u}>
                        {u}
                      </Option>
                    ))}
                  </Select>
                </Col>
              </Row>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title={t.accessPattern} size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text>
                  {t.readRatio}: <strong>{readRatio}%</strong> / {t.writeRatio}: <strong>{100 - readRatio}%</strong>
                </Text>
                <Slider value={readRatio} onChange={setReadRatio} min={0} max={100} tooltip={{ formatter: (v) => `${v}%` }} />
              </div>
              <div>
                <Text>
                  {t.randomRatio}: <strong>{randomRatio}%</strong> / {t.sequentialRatio}: <strong>{100 - randomRatio}%</strong>
                </Text>
                <Slider value={randomRatio} onChange={setRandomRatio} min={0} max={100} tooltip={{ formatter: (v) => `${v}%` }} />
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      {result && (
        <>
          <Row gutter={[16, 16]}>
            <Col xs={24}>
              <Card title={<span><ThunderboltOutlined /> {t.results}</span>} size="small">
                <Row gutter={[16, 16]}>
                  <Col xs={12} md={6}>
                    <Statistic title={`${t.iops} ${t.mixed}`} value={formatNumber(result.random.mixedIops, 0)} />
                  </Col>
                  <Col xs={12} md={6}>
                    <Statistic title={`${t.throughput} ${t.mixed} (MB/s)`} value={formatNumber(result.effective.mixedMBps)} />
                  </Col>
                  <Col xs={12} md={6}>
                    <Tooltip title="Latência estimada por operação aleatória no array">
                      <Statistic title={t.latency} value={`${formatNumber(result.latencyMs, 3)} ms`} />
                    </Tooltip>
                  </Col>
                  <Col xs={12} md={6}>
                    <Statistic title={t.writePenalty} value={`×${result.raidWritePenalty}`} />
                  </Col>
                  <Col xs={12} md={6}>
                    <Statistic title={t.usableCapacity} value={`${formatNumber(result.usableCapacityRatio * 100, 1)}%`} />
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24}>
              <Card size="small">
                <Table
                  columns={tableColumns}
                  dataSource={tableData}
                  pagination={false}
                  size="small"
                  bordered
                />
              </Card>
            </Col>
          </Row>
        </>
      )}

      <Alert message={t.note} type="info" showIcon icon={<InfoCircleOutlined />} />

      <Collapse>
        <Panel header={t.sourceCode} key="source">
          <Paragraph>{t.sourceIntro}</Paragraph>
          <pre style={{ fontSize: 12, maxHeight: 400, overflow: 'auto' }}>
            <code>{sourceCode}</code>
          </pre>
          <Paragraph>Exemplo de uso:</Paragraph>
          <pre style={{ fontSize: 12 }}>
            <code>{sourceExample}</code>
          </pre>
        </Panel>
      </Collapse>
    </Space>
  )
}
