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
  Row,
  Col,
  Statistic,
  Tag,
} from 'antd'
import {
  ThunderboltOutlined,
  CalculatorOutlined,
  GlobalOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  BANDWIDTH_UNITS,
  SIZE_UNITS,
  RTT_UNITS,
  DEFAULT_MSS,
  toBps,
  toBytes,
  toSeconds,
  calculateBdp,
  idealWindowBytes,
  windowLimitedThroughput,
  mathisThroughput,
  calculateEffectiveThroughput,
  calculateTransferTime,
  formatDuration,
  humanizeSpeed,
  humanizeBytes,
  formatNumber,
  PRESETS,
} from '../utils/tcpThroughputCalculator'

const { Title, Paragraph, Text } = Typography
const { Option } = Select
const { Panel } = Collapse

const sourceCode = `import {
  toBps,
  toSeconds,
  toBytes,
  calculateBdp,
  idealWindowBytes,
  calculateEffectiveThroughput,
  calculateTransferTime,
} from '../utils/tcpThroughputCalculator'

// Exemplo: 100 Mbps, RTT 20 ms, perda 0.1%, janela 64 KB
const bandwidth = toBps(100, 'Mbps')
const rtt = toSeconds(20, 'ms')
const window = toBytes(64, 'KB')
const loss = 0.1 / 100

const bdp = calculateBdp(bandwidth, rtt)        // bits em voo
const idealWindow = idealWindowBytes(bdp)         // bytes necessários

const result = calculateEffectiveThroughput({
  bandwidthBps: bandwidth,
  rttSeconds: rtt,
  windowBytes: window,
  lossProbability: loss,
})

// Tempo para transferir 500 MB
const file = toBytes(500, 'MB')
const seconds = calculateTransferTime(file, result.effectiveBps)
`

const translations = {
  pt: {
    title: 'Calculadora de Throughput TCP',
    subtitle: 'Bandwidth-Delay Product, janela ideal e fórmula de Mathis',
    intro: 'Estime o throughput real de uma conexão TCP levando em conta a largura de banda, o RTT, o tamanho da janela de recepção e a perda de pacotes. Ideal para dimensionar links, ajustar window size e entender por que a banda anunciada nem sempre vira velocidade útil.',
    bandwidth: 'Largura de banda',
    rtt: 'RTT (ida e volta)',
    loss: 'Perda de pacotes',
    window: 'Janela TCP informada',
    fileSize: 'Tamanho do arquivo',
    mss: 'MSS (Maximum Segment Size)',
    presets: 'Cenários rápidos',
    results: 'Resultados',
    bdp: 'BDP (Bandwidth-Delay Product)',
    idealWindow: 'Janela TCP ideal',
    windowLimit: 'Limite imposto pela janela',
    mathisLimit: 'Limite de Mathis (perda)',
    effectiveThroughput: 'Throughput efetivo',
    transferTime: 'Tempo de transferência',
    limitedBy: 'Limitado por',
    bandwidthLimit: 'largura de banda',
    windowLimitLabel: 'janela TCP',
    lossLimitLabel: 'perda de pacotes',
    note: 'A fórmula de Mathis assume congestionamento leve e perda aleatória. Em cenários reais, retransmissões, bufferbloat e slow start podem reduzir ainda mais o throughput.',
    sourceCode: 'Código-fonte do motor',
    sourceIntro: 'O motor calcula BDP, janela ideal e o limite de throughput pela fórmula de Mathis. Tudo roda no navegador — nenhum dado de rede sai daqui.',
  },
  en: {
    title: 'TCP Throughput Calculator',
    subtitle: 'Bandwidth-Delay Product, ideal window and Mathis formula',
    intro: 'Estimate the real throughput of a TCP connection based on bandwidth, RTT, receive window size and packet loss. Useful for sizing links, tuning window sizes and understanding why advertised bandwidth does not always become useful speed.',
    bandwidth: 'Bandwidth',
    rtt: 'RTT (round-trip time)',
    loss: 'Packet loss',
    window: 'Advertised TCP window',
    fileSize: 'File size',
    mss: 'MSS (Maximum Segment Size)',
    presets: 'Quick scenarios',
    results: 'Results',
    bdp: 'BDP (Bandwidth-Delay Product)',
    idealWindow: 'Ideal TCP window',
    windowLimit: 'Window-imposed limit',
    mathisLimit: 'Mathis limit (loss)',
    effectiveThroughput: 'Effective throughput',
    transferTime: 'Transfer time',
    limitedBy: 'Limited by',
    bandwidthLimit: 'bandwidth',
    windowLimitLabel: 'TCP window',
    lossLimitLabel: 'packet loss',
    note: 'The Mathis formula assumes light congestion and random loss. In real scenarios, retransmissions, bufferbloat and slow start can reduce throughput further.',
    sourceCode: 'Engine source code',
    sourceIntro: 'The engine calculates BDP, ideal window and the Mathis throughput limit. Everything runs in the browser — no network data leaves this page.',
  },
}

const BANDWIDTH_UNIT_KEYS = Object.keys(BANDWIDTH_UNITS)
const SIZE_UNIT_KEYS = Object.keys(SIZE_UNITS)
const RTT_UNIT_KEYS = Object.keys(RTT_UNITS)

export default function TcpThroughputCalculatorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [bandwidth, setBandwidth] = useState(100)
  const [bandwidthUnit, setBandwidthUnit] = useState('Mbps')
  const [rtt, setRtt] = useState(20)
  const [rttUnit, setRttUnit] = useState('ms')
  const [loss, setLoss] = useState(0.1)
  const [window, setWindow] = useState(128)
  const [windowUnit, setWindowUnit] = useState('KB')
  const [fileSize, setFileSize] = useState(500)
  const [fileSizeUnit, setFileSizeUnit] = useState('MB')
  const [mss, setMss] = useState(DEFAULT_MSS)

  const bandwidthBps = useMemo(() => toBps(bandwidth, bandwidthUnit), [bandwidth, bandwidthUnit])
  const rttSeconds = useMemo(() => toSeconds(rtt, rttUnit), [rtt, rttUnit])
  const windowBytes = useMemo(() => toBytes(window, windowUnit), [window, windowUnit])
  const lossProbability = useMemo(() => loss / 100, [loss])
  const fileBytes = useMemo(() => toBytes(fileSize, fileSizeUnit), [fileSize, fileSizeUnit])

  const bdp = useMemo(() => calculateBdp(bandwidthBps, rttSeconds), [bandwidthBps, rttSeconds])
  const idealWindow = useMemo(() => idealWindowBytes(bdp), [bdp])

  const effective = useMemo(
    () =>
      calculateEffectiveThroughput({
        bandwidthBps,
        rttSeconds,
        windowBytes,
        lossProbability,
        mssBytes: mss,
      }),
    [bandwidthBps, rttSeconds, windowBytes, lossProbability, mss]
  )

  const windowLimitBps = useMemo(
    () => (windowBytes > 0 ? windowLimitedThroughput(windowBytes, rttSeconds) : Infinity),
    [windowBytes, rttSeconds]
  )
  const mathisLimitBps = useMemo(
    () => (lossProbability > 0 ? mathisThroughput(mss, rttSeconds, lossProbability) : Infinity),
    [mss, rttSeconds, lossProbability]
  )

  const transferSeconds = useMemo(
    () => calculateTransferTime(fileBytes, effective.effectiveBps),
    [fileBytes, effective.effectiveBps]
  )

  const humanEffective = useMemo(() => humanizeSpeed(effective.effectiveBps), [effective.effectiveBps])
  const humanBdp = useMemo(() => humanizeBytes(bdp / 8, false), [bdp])
  const humanIdealWindow = useMemo(() => humanizeBytes(idealWindow, true), [idealWindow])

  function applyPreset(p) {
    setBandwidth(p.bandwidth)
    setBandwidthUnit(p.bandwidthUnit)
    setRtt(p.rtt)
    setRttUnit(p.rttUnit)
    setLoss(p.loss)
    setWindow(p.window)
    setWindowUnit(p.windowUnit)
    setFileSize(p.fileSize)
    setFileSizeUnit(p.fileSizeUnit)
  }

  const limitTags = []
  if (effective.limitedByBandwidth) limitTags.push(t.bandwidthLimit)
  if (effective.limitedByWindow) limitTags.push(t.windowLimitLabel)
  if (effective.limitedByLoss) limitTags.push(t.lossLimitLabel)

  const renderInput = (label, value, onChange, unitValue, onUnitChange, unitKeys, min = 0, step = 0.01) => (
    <Space direction="vertical" size="small" style={{ width: '100%' }}>
      <Text strong>{label}</Text>
      <Row gutter={[8, 8]}>
        <Col xs={16}>
          <InputNumber
            min={min}
            step={step}
            value={value}
            onChange={(v) => onChange(v ?? 0)}
            style={{ width: '100%' }}
          />
        </Col>
        <Col xs={8}>
          <Select value={unitValue} onChange={onUnitChange} style={{ width: '100%' }}>
            {unitKeys.map((u) => (
              <Option key={u} value={u}>{u}</Option>
            ))}
          </Select>
        </Col>
      </Row>
    </Space>
  )

  return (
    <div style={{ padding: 24, maxWidth: 960, margin: '0 auto' }}>
      <Title level={2}>
        <GlobalOutlined style={{ marginRight: 12 }} />
        {t.title}
      </Title>
      <Paragraph type="secondary" style={{ marginTop: -8, marginBottom: 24 }}>
        {t.subtitle}
      </Paragraph>
      <Paragraph>{t.intro}</Paragraph>

      <Card title={<span><CalculatorOutlined style={{ marginRight: 8 }} />{t.results}</span>}>
        <Row gutter={[16, 16]}>
          <Col xs={12} md={8}>
            <Statistic
              title={t.bdp}
              value={`${formatNumber(humanBdp.value)} ${humanBdp.unit}`}
            />
          </Col>
          <Col xs={12} md={8}>
            <Statistic
              title={t.idealWindow}
              value={`${formatNumber(humanIdealWindow.value)} ${humanIdealWindow.unit}`}
            />
          </Col>
          <Col xs={12} md={8}>
            <Statistic
              title={t.effectiveThroughput}
              value={`${formatNumber(humanEffective.value)} ${humanEffective.unit}`}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col xs={12} md={8}>
            <Statistic
              title={t.windowLimit}
              value={windowLimitBps === Infinity ? '∞' : `${formatNumber(humanizeSpeed(windowLimitBps).value)} ${humanizeSpeed(windowLimitBps).unit}`}
            />
          </Col>
          <Col xs={12} md={8}>
            <Statistic
              title={t.mathisLimit}
              value={mathisLimitBps === Infinity ? '∞' : `${formatNumber(humanizeSpeed(mathisLimitBps).value)} ${humanizeSpeed(mathisLimitBps).unit}`}
            />
          </Col>
          <Col xs={12} md={8}>
            <Statistic
              title={t.transferTime}
              value={transferSeconds !== null ? formatDuration(transferSeconds) : '—'}
            />
          </Col>
        </Row>
        {limitTags.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <Text strong>{t.limitedBy}: </Text>
            {limitTags.map((tag) => (
              <Tag color="blue" key={tag}>{tag}</Tag>
            ))}
          </div>
        )}
      </Card>

      <Card style={{ marginTop: 16 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            {renderInput(t.bandwidth, bandwidth, setBandwidth, bandwidthUnit, setBandwidthUnit, BANDWIDTH_UNIT_KEYS)}
          </Col>
          <Col xs={24} md={12}>
            {renderInput(t.rtt, rtt, setRtt, rttUnit, setRttUnit, RTT_UNIT_KEYS)}
          </Col>
          <Col xs={24} md={12}>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Text strong>{t.loss}</Text>
              <InputNumber
                min={0}
                max={100}
                step={0.001}
                value={loss}
                formatter={(value) => `${value}%`}
                parser={(value) => value?.replace('%', '')}
                onChange={(v) => setLoss(v ?? 0)}
                style={{ width: '100%' }}
              />
            </Space>
          </Col>
          <Col xs={24} md={12}>
            {renderInput(t.window, window, setWindow, windowUnit, setWindowUnit, SIZE_UNIT_KEYS)}
          </Col>
          <Col xs={24} md={12}>
            {renderInput(t.fileSize, fileSize, setFileSize, fileSizeUnit, setFileSizeUnit, SIZE_UNIT_KEYS)}
          </Col>
          <Col xs={24} md={12}>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Text strong>{t.mss}</Text>
              <InputNumber
                min={1}
                step={1}
                value={mss}
                onChange={(v) => setMss(v ?? DEFAULT_MSS)}
                style={{ width: '100%' }}
              />
              <Text type="secondary" style={{ fontSize: 12 }}>1460 bytes = IPv4/Ethernet típico</Text>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card style={{ marginTop: 16 }} title={t.presets}>
        <Space wrap>
          {PRESETS.map((p) => (
            <Button key={p.id} size="small" onClick={() => applyPreset(p)}>
              {p.label[lang]}
            </Button>
          ))}
        </Space>
      </Card>

      <Alert
        type="info"
        showIcon
        icon={<InfoCircleOutlined />}
        message={t.note}
        style={{ marginTop: 16 }}
      />

      <Collapse style={{ marginTop: 24 }}>
        <Panel header={t.sourceCode} key="source">
          <Paragraph>{t.sourceIntro}</Paragraph>
          <pre style={{ background: '#f6ffed', padding: 16, borderRadius: 8, overflow: 'auto' }}>
            <code>{sourceCode}</code>
          </pre>
        </Panel>
      </Collapse>
    </div>
  )
}
