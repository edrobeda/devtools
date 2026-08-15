import React, { useMemo, useState } from 'react'
import {
  Typography,
  Card,
  InputNumber,
  Select,
  Space,
  Button,
  Alert,
  Collapse,
  Tabs,
  Row,
  Col,
  Tag,
  Statistic,
} from 'antd'
import {
  ClockCircleOutlined,
  ThunderboltOutlined,
  CopyOutlined,
  CalculatorOutlined,
  SwapOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  sizeToBytes,
  speedToBps,
  calculateTransferTime,
  calculateMaxSize,
  formatDuration,
  formatDurationDetailed,
  humanizeSpeed,
  humanizeByteSpeed,
  formatNumber,
  TRANSFER_PRESETS,
  SIZE_UNIT_KEYS,
  SPEED_UNIT_KEYS,
} from '../utils/bandwidthCalculator'

const { Title, Paragraph, Text } = Typography
const { Option } = Select
const { Panel } = Collapse
const { TabPane } = Tabs

const sourceCode = `import {
  sizeToBytes,
  speedToBps,
  calculateTransferTime,
  calculateMaxSize,
  formatDuration,
  humanizeSpeed,
} from '../utils/bandwidthCalculator'

// Tempo para transferir 2 GB a 100 Mbps
const bytes = sizeToBytes(2, 'GB')           // 2_000_000_000 bytes
const bps = speedToBps(100, 'Mbps')          // 100_000_000 bps
const seconds = calculateTransferTime(bytes, bps)
formatDuration(seconds)                      // { value: 2.7, unit: 'min', ... }

// Tamanho maximo em 1 hora a 1 Gbps
const maxBytes = calculateMaxSize(speedToBps(1, 'Gbps'), 3600)
`

const translations = {
  pt: {
    title: 'Calculadora de Largura de Banda',
    intro: (
      <>Estime o tempo de transferencia de arquivos ou o tamanho maximo transferivel dados uma velocidade de conexao e um prazo. Util para dimensionar backups, uploads, deploys e sincronizacoes.</>
    ),
    tabTime: 'Tempo de Transferencia',
    tabSize: 'Tamanho Maximo',
    sizeLabel: 'Tamanho do arquivo',
    speedLabel: 'Velocidade da conexao',
    overheadLabel: 'Overhead de protocolo',
    overheadHelp: 'Redes reais perdem parte da vazao com headers TCP/IP, TLS, retransmissao etc. Use ~10% como estimativa conservadora.',
    duration: 'Tempo estimado',
    durationDetailed: 'Detalhado',
    effectiveSpeed: 'Vazao efetiva',
    maxSize: 'Tamanho maximo',
    timeLabel: 'Tempo disponivel',
    timeUnitLabel: 'Unidade de tempo',
    copy: 'Copiar',
    copied: 'Copiado',
    presets: 'Presets rapidos',
    explanationTitle: 'Por que o tempo real pode ser maior?',
    explanation: (
      <>
        A velocidade anunciada pela conexao (ex.: <Text code>100 Mbps</Text>) e a taxa de dados uteis sao diferentes.
        Protocolos como TCP/IP, TLS e retransmissoes consomem parte da banda.
        Um overhead de <Text code>10%</Text> e uma estimativa conservadora comum; em redes moveis ou congestionadas pode ser maior.
        <br /><br />
        Lembre-se tambem que <Text code>MB</Text> e <Text code>Mb</Text> sao distintos: 1 byte = 8 bits.
      </>
    ),
    sourceCode: 'Codigo-fonte do motor',
    seconds: 'segundos',
    minutes: 'minutos',
    hours: 'horas',
    days: 'dias',
    timeUnits: {
      s: 'segundos',
      m: 'minutos',
      h: 'horas',
      d: 'dias',
    },
  },
  en: {
    title: 'Bandwidth Calculator',
    intro: (
      <>Estimate file transfer time or the maximum transferable size given a connection speed and deadline. Useful for sizing backups, uploads, deployments and syncs.</>
    ),
    tabTime: 'Transfer Time',
    tabSize: 'Max Transfer Size',
    sizeLabel: 'File size',
    speedLabel: 'Connection speed',
    overheadLabel: 'Protocol overhead',
    overheadHelp: 'Real networks lose some throughput to TCP/IP headers, TLS, retransmissions, etc. Use ~10% as a conservative estimate.',
    duration: 'Estimated time',
    durationDetailed: 'Detailed',
    effectiveSpeed: 'Effective throughput',
    maxSize: 'Maximum size',
    timeLabel: 'Available time',
    timeUnitLabel: 'Time unit',
    copy: 'Copy',
    copied: 'Copied',
    presets: 'Quick presets',
    explanationTitle: 'Why actual time can be longer',
    explanation: (
      <>
        The advertised connection speed (e.g. <Text code>100 Mbps</Text>) is not the same as useful data throughput.
        Protocols such as TCP/IP, TLS and retransmissions consume part of the bandwidth.
        An overhead of <Text code>10%</Text> is a common conservative estimate; on mobile or congested networks it may be higher.
        <br /><br />
        Also remember that <Text code>MB</Text> and <Text code>Mb</Text> are different: 1 byte = 8 bits.
      </>
    ),
    sourceCode: 'Engine source code',
    seconds: 'seconds',
    minutes: 'minutes',
    hours: 'hours',
    days: 'days',
    timeUnits: {
      s: 'seconds',
      m: 'minutes',
      h: 'hours',
      d: 'days',
    },
  },
}

const TIME_UNITS = [
  { key: 's', seconds: 1 },
  { key: 'm', seconds: 60 },
  { key: 'h', seconds: 3600 },
  { key: 'd', seconds: 86400 },
]

export default function BandwidthCalculatorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [activeTab, setActiveTab] = useState('time')

  const [sizeValue, setSizeValue] = useState(100)
  const [sizeUnit, setSizeUnit] = useState('GiB')
  const [speedValue, setSpeedValue] = useState(1)
  const [speedUnit, setSpeedUnit] = useState('Gbps')
  const [overhead, setOverhead] = useState(0)

  const [availableTime, setAvailableTime] = useState(1)
  const [timeUnit, setTimeUnit] = useState('h')

  const bytes = useMemo(() => sizeToBytes(sizeValue || 0, sizeUnit), [sizeValue, sizeUnit])
  const bps = useMemo(() => speedToBps(speedValue || 0, speedUnit), [speedValue, speedUnit])

  const transferSeconds = useMemo(
    () => calculateTransferTime(bytes, bps, overhead),
    [bytes, bps, overhead]
  )
  const duration = useMemo(() => formatDuration(transferSeconds), [transferSeconds])
  const effectiveBps = useMemo(() => bps * (1 - overhead / 100), [bps, overhead])
  const effectiveSpeed = useMemo(() => humanizeByteSpeed(effectiveBps / 8), [effectiveBps])

  const availableSeconds = useMemo(
    () => (availableTime || 0) * (TIME_UNITS.find((u) => u.key === timeUnit)?.seconds || 3600),
    [availableTime, timeUnit]
  )
  const maxBytes = useMemo(
    () => calculateMaxSize(bps, availableSeconds, overhead),
    [bps, availableSeconds, overhead]
  )
  const maxSizeHuman = useMemo(() => {
    const abs = Math.abs(maxBytes)
    if (abs >= 1024 ** 5) return { value: maxBytes / 1024 ** 5, unit: 'PiB' }
    if (abs >= 1024 ** 4) return { value: maxBytes / 1024 ** 4, unit: 'TiB' }
    if (abs >= 1024 ** 3) return { value: maxBytes / 1024 ** 3, unit: 'GiB' }
    if (abs >= 1024 ** 2) return { value: maxBytes / 1024 ** 2, unit: 'MiB' }
    if (abs >= 1024) return { value: maxBytes / 1024, unit: 'KiB' }
    return { value: maxBytes, unit: 'B' }
  }, [maxBytes])

  function copy(text) {
    navigator.clipboard.writeText(text)
  }

  function applyPreset(p) {
    setSizeValue(p.sizeValue)
    setSizeUnit(p.sizeUnit)
    setSpeedValue(p.speedValue)
    setSpeedUnit(p.speedUnit)
    setOverhead(p.overhead)
    setActiveTab('time')
  }

  const renderSpeedInfo = (
    <Space direction="vertical" size="small" style={{ width: '100%' }}>
      <Text strong>{t.speedLabel}</Text>
      <Row gutter={[8, 8]}>
        <Col xs={16}>
          <InputNumber
            min={0}
            step={0.01}
            value={speedValue}
            onChange={(v) => setSpeedValue(v ?? 0)}
            style={{ width: '100%' }}
          />
        </Col>
        <Col xs={8}>
          <Select value={speedUnit} onChange={setSpeedUnit} style={{ width: '100%' }}>
            {SPEED_UNIT_KEYS.map((u) => (
              <Option key={u} value={u}>{u}</Option>
            ))}
          </Select>
        </Col>
      </Row>
      <Text type="secondary" style={{ fontSize: 12 }}>
        {formatNumber(humanizeSpeed(bps).value)} {humanizeSpeed(bps).unit}
        {' / '}{formatNumber(humanizeByteSpeed(bps / 8).value)} {humanizeByteSpeed(bps / 8).unit}
      </Text>
    </Space>
  )

  const renderOverhead = (
    <Space direction="vertical" size="small" style={{ width: '100%' }}>
      <Text strong>{t.overheadLabel}</Text>
      <InputNumber
        min={0}
        max={99}
        step={1}
        formatter={(value) => `${value}%`}
        parser={(value) => value?.replace('%', '')}
        value={overhead}
        onChange={(v) => setOverhead(v ?? 0)}
        style={{ width: '100%' }}
      />
      <Text type="secondary" style={{ fontSize: 12 }}>{t.overheadHelp}</Text>
    </Space>
  )

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><ThunderboltOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab={<span><ClockCircleOutlined /> {t.tabTime}</span>} key="time">
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <Text strong>{t.sizeLabel}</Text>
                    <Row gutter={[8, 8]}>
                      <Col xs={16}>
                        <InputNumber
                          min={0}
                          step={0.01}
                          value={sizeValue}
                          onChange={(v) => setSizeValue(v ?? 0)}
                          style={{ width: '100%' }}
                        />
                      </Col>
                      <Col xs={8}>
                        <Select value={sizeUnit} onChange={setSizeUnit} style={{ width: '100%' }}>
                          {SIZE_UNIT_KEYS.map((u) => (
                            <Option key={u} value={u}>{u}</Option>
                          ))}
                        </Select>
                      </Col>
                    </Row>
                  </Space>
                </Col>
                <Col xs={24} md={12}>
                  {renderSpeedInfo}
                </Col>
                <Col xs={24} md={12}>
                  {renderOverhead}
                </Col>
              </Row>

              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12}>
                  <Card size="small">
                    <Statistic
                      title={t.duration}
                      value={duration.text}
                      prefix={<ClockCircleOutlined />}
                    />
                    <Text type="secondary">{formatDurationDetailed(transferSeconds)}</Text>
                  </Card>
                </Col>
                <Col xs={24} sm={12}>
                  <Card size="small">
                    <Statistic
                      title={t.effectiveSpeed}
                      value={`${formatNumber(effectiveSpeed.value)} ${effectiveSpeed.unit}`}
                      prefix={<SwapOutlined />}
                    />
                    <Text type="secondary">{formatNumber(transferSeconds)} s</Text>
                  </Card>
                </Col>
              </Row>
            </Space>
          </TabPane>

          <TabPane tab={<span><CalculatorOutlined /> {t.tabSize}</span>} key="size">
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  {renderSpeedInfo}
                </Col>
                <Col xs={24} md={12}>
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <Text strong>{t.timeLabel}</Text>
                    <Row gutter={[8, 8]}>
                      <Col xs={16}>
                        <InputNumber
                          min={0}
                          step={0.01}
                          value={availableTime}
                          onChange={(v) => setAvailableTime(v ?? 0)}
                          style={{ width: '100%' }}
                        />
                      </Col>
                      <Col xs={8}>
                        <Select value={timeUnit} onChange={setTimeUnit} style={{ width: '100%' }}>
                          {TIME_UNITS.map((u) => (
                            <Option key={u.key} value={u.key}>{t.timeUnits[u.key]}</Option>
                          ))}
                        </Select>
                      </Col>
                    </Row>
                  </Space>
                </Col>
                <Col xs={24} md={12}>
                  {renderOverhead}
                </Col>
              </Row>

              <Card size="small">
                <Statistic
                  title={t.maxSize}
                  value={`${formatNumber(maxSizeHuman.value)} ${maxSizeHuman.unit}`}
                  prefix={<CalculatorOutlined />}
                />
                <Text type="secondary">{formatNumber(maxBytes)} bytes</Text>
              </Card>
            </Space>
          </TabPane>
        </Tabs>
      </Card>

      <Card size="small">
        <Text strong>{t.presets}: </Text>
        <Space size={[8, 8]} wrap>
          {TRANSFER_PRESETS.map((p) => (
            <Button key={p.label} size="small" onClick={() => applyPreset(p)}>
              {p.label}
            </Button>
          ))}
        </Space>
      </Card>

      <Alert
        type="info"
        showIcon
        message={t.explanationTitle}
        description={t.explanation}
      />

      <Collapse>
        <Panel header={t.sourceCode} key="source">
          <pre style={{ margin: 0, overflow: 'auto' }}>
            <code>{sourceCode}</code>
          </pre>
        </Panel>
      </Collapse>
    </Space>
  )
}
