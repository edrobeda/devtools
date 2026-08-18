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
  Collapse,
  Tag,
  Table,
  Alert,
  Segmented,
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
  PRESETS,
  MODULATIONS,
  toHz,
  snrDbToLinear,
  snrLinearToDb,
  shannonCapacity,
  formatBitsPerSecond,
  formatNumber,
  requiredBandwidthForCapacity,
  buildCapacityCurve,
  modulationComparison,
} from '../utils/shannonCapacityCalculator'

const { Title, Paragraph, Text } = Typography
const { Option } = Select
const { Panel } = Collapse

const sourceCode = `import {
  toHz,
  snrDbToLinear,
  shannonCapacity,
} from '../utils/shannonCapacityCalculator'

// Exemplo: canal de 20 MHz com SNR de 25 dB
const bandwidthHz = toHz(20, 'MHz')
const snrLinear = snrDbToLinear(25)
const capacity = shannonCapacity(bandwidthHz, snrLinear)

console.log(capacity) // ~133.8 Mbps (limite teórico de Shannon)
`

const translations = {
  pt: {
    title: 'Calculadora de Capacidade de Shannon',
    subtitle: 'Teorema de Shannon-Hartley',
    intro: 'Calcule o limite teórico máximo de transmissão de um canal ruidoso a partir da largura de banda e da relação sinal-ruído (SNR). Útil para dimensionar enlaces de rádio, Wi-Fi, fibra e entender por que modulações mais densas exigem SNR cada vez maiores.',
    bandwidth: 'Largura de banda',
    snrMode: 'Modo de entrada do SNR',
    snrDb: 'SNR (dB)',
    signalPower: 'Potência do sinal (mW)',
    noisePower: 'Potência do ruído (mW)',
    presets: 'Cenários rápidos',
    results: 'Resultados',
    capacity: 'Capacidade máxima (Shannon)',
    spectralEfficiency: 'Eficiência espectral',
    snrLinear: 'SNR linear',
    bitsPerHz: 'bits/s/Hz',
    currentPoint: 'Ponto atual',
    modulationTable: 'Modulações vs limite de Shannon',
    modulation: 'Modulação',
    bitsPerSymbol: 'bits/símbolo',
    theoreticalRate: 'Taxa teórica',
    feasible: 'Viável',
    efficiency: 'Eficiência',
    yes: 'Sim',
    no: 'Não',
    targetCapacity: 'Capacidade-alvo',
    requiredBandwidth: 'Banda mínima necessária',
    note: 'O limite de Shannon assume ruído branco gaussiano aditivo (AWGN) e codificação ideal. Sistemas reais operam abaixo desse limite devido a overhead, codificação e interferência.',
    sourceCode: 'Código-fonte do motor',
    sourceIntro: 'O motor aplica a fórmula C = B × log₂(1 + SNR). Tudo roda no navegador — nenhum dado de rede sai daqui.',
    graphTitle: 'Capacidade × SNR (dB)',
  },
  en: {
    title: 'Shannon Capacity Calculator',
    subtitle: 'Shannon-Hartley theorem',
    intro: 'Calculate the theoretical maximum transmission rate of a noisy channel from its bandwidth and signal-to-noise ratio (SNR). Useful for sizing radio links, Wi-Fi, fiber and understanding why denser modulations require ever higher SNR.',
    bandwidth: 'Bandwidth',
    snrMode: 'SNR input mode',
    snrDb: 'SNR (dB)',
    signalPower: 'Signal power (mW)',
    noisePower: 'Noise power (mW)',
    presets: 'Quick scenarios',
    results: 'Results',
    capacity: 'Maximum capacity (Shannon)',
    spectralEfficiency: 'Spectral efficiency',
    snrLinear: 'Linear SNR',
    bitsPerHz: 'bits/s/Hz',
    currentPoint: 'Current point',
    modulationTable: 'Modulations vs Shannon limit',
    modulation: 'Modulation',
    bitsPerSymbol: 'bits/symbol',
    theoreticalRate: 'Theoretical rate',
    feasible: 'Feasible',
    efficiency: 'Efficiency',
    yes: 'Yes',
    no: 'No',
    targetCapacity: 'Target capacity',
    requiredBandwidth: 'Minimum required bandwidth',
    note: 'The Shannon limit assumes additive white Gaussian noise (AWGN) and ideal coding. Real systems operate below this limit due to overhead, coding and interference.',
    sourceCode: 'Engine source code',
    sourceIntro: 'The engine applies the formula C = B × log₂(1 + SNR). Everything runs in the browser — no network data leaves this page.',
    graphTitle: 'Capacity × SNR (dB)',
  },
}

const BANDWIDTH_UNIT_KEYS = Object.keys(BANDWIDTH_UNITS)

const SPEED_UNITS = [
  { unit: 'bps', divisor: 1 },
  { unit: 'Kbps', divisor: 1_000 },
  { unit: 'Mbps', divisor: 1_000_000 },
  { unit: 'Gbps', divisor: 1_000_000_000 },
  { unit: 'Tbps', divisor: 1_000_000_000_000 },
]

export default function ShannonCapacityCalculatorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [bandwidth, setBandwidth] = useState(20)
  const [bandwidthUnit, setBandwidthUnit] = useState('MHz')
  const [snrMode, setSnrMode] = useState('db')
  const [snrDb, setSnrDb] = useState(25)
  const [signalMw, setSignalMw] = useState(100)
  const [noiseMw, setNoiseMw] = useState(1)
  const [targetCapacity, setTargetCapacity] = useState(100)
  const [targetUnit, setTargetUnit] = useState('Mbps')

  const bandwidthHz = useMemo(() => toHz(bandwidth, bandwidthUnit), [bandwidth, bandwidthUnit])

  const snrLinear = useMemo(() => {
    if (snrMode === 'db') return snrDbToLinear(snrDb)
    return noiseMw > 0 ? signalMw / noiseMw : 0
  }, [snrMode, snrDb, signalMw, noiseMw])

  const result = useMemo(() => {
    const capacity = shannonCapacity(bandwidthHz, snrLinear)
    return {
      capacity,
      capacityFormatted: formatBitsPerSecond(capacity),
      spectralEfficiency: bandwidthHz > 0 ? capacity / bandwidthHz : 0,
      snrDb: snrLinearToDb(snrLinear),
    }
  }, [bandwidthHz, snrLinear])

  const curve = useMemo(() => buildCapacityCurve(bandwidthHz), [bandwidthHz])

  const targetBps = useMemo(() => {
    const unit = SPEED_UNITS.find((u) => u.unit === targetUnit)
    return (targetCapacity || 0) * (unit?.divisor || 1_000_000)
  }, [targetCapacity, targetUnit])

  const requiredBw = useMemo(
    () => requiredBandwidthForCapacity(targetBps, snrLinear),
    [targetBps, snrLinear]
  )

  const modulations = useMemo(() => modulationComparison(bandwidthHz, snrLinear), [bandwidthHz, snrLinear])

  function applyPreset(key) {
    const p = PRESETS[key]
    if (!p) return
    setBandwidth(p.bandwidth)
    setBandwidthUnit(p.bandwidthUnit)
    setSnrMode('db')
    setSnrDb(p.snrDb)
  }

  const renderBandwidthInput = () => (
    <Space direction="vertical" size="small" style={{ width: '100%' }}>
      <Text strong>{t.bandwidth}</Text>
      <Row gutter={[8, 8]}>
        <Col xs={16}>
          <InputNumber
            min={0}
            step={bandwidthUnit === 'Hz' ? 100 : 0.1}
            value={bandwidth}
            onChange={(v) => setBandwidth(v ?? 0)}
            style={{ width: '100%' }}
          />
        </Col>
        <Col xs={8}>
          <Select value={bandwidthUnit} onChange={setBandwidthUnit} style={{ width: '100%' }}>
            {BANDWIDTH_UNIT_KEYS.map((u) => (
              <Option key={u} value={u}>{u}</Option>
            ))}
          </Select>
        </Col>
      </Row>
    </Space>
  )

  const renderGraph = () => {
    const width = 600
    const height = 240
    const padding = { top: 10, right: 20, bottom: 40, left: 60 }
    const innerWidth = width - padding.left - padding.right
    const innerHeight = height - padding.top - padding.bottom

    const maxCapacity = Math.max(...curve.map((p) => p.capacity), result.capacity)
    const minDb = curve[0].db
    const maxDb = curve[curve.length - 1].db

    const xScale = (db) => padding.left + ((db - minDb) / (maxDb - minDb)) * innerWidth
    const yScale = (capacity) => padding.top + innerHeight - (capacity / (maxCapacity || 1)) * innerHeight

    const pathD = curve
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(p.db)} ${yScale(p.capacity)}`)
      .join(' ')

    const currentX = xScale(result.snrDb)
    const currentY = yScale(result.capacity)

    return (
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: '100%', height: 'auto', maxWidth: 700, background: 'transparent' }}
        role="img"
        aria-label={t.graphTitle}
      >
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = padding.top + innerHeight * ratio
          return (
            <line
              key={ratio}
              x1={padding.left}
              y1={y}
              x2={width - padding.right}
              y2={y}
              stroke="#e0e0e0"
              strokeDasharray="3 3"
            />
          )
        })}
        {/* Axes */}
        <line
          x1={padding.left}
          y1={padding.top + innerHeight}
          x2={width - padding.right}
          y2={padding.top + innerHeight}
          stroke="#999"
        />
        <line
          x1={padding.left}
          y1={padding.top}
          x2={padding.left}
          y2={padding.top + innerHeight}
          stroke="#999"
        />
        {/* Capacity curve */}
        <path d={pathD} fill="none" stroke="#1677ff" strokeWidth={2} />
        {/* Current point */}
        {Number.isFinite(currentX) && Number.isFinite(currentY) && (
          <>
            <circle cx={currentX} cy={currentY} r={5} fill="#ff4d4f" />
            <text x={currentX + 8} y={currentY - 8} fontSize={11} fill="#ff4d4f">
              {t.currentPoint}
            </text>
          </>
        )}
        {/* X labels */}
        {[minDb, (minDb + maxDb) / 2, maxDb].map((db) => (
          <text key={db} x={xScale(db)} y={height - 10} fontSize={11} textAnchor="middle" fill="#666">
            {Math.round(db)} dB
          </text>
        ))}
        {/* Y label */}
        <text
          x={20}
          y={height / 2}
          fontSize={11}
          textAnchor="middle"
          fill="#666"
          transform={`rotate(-90, 20, ${height / 2})`}
        >
          {formatBitsPerSecond(maxCapacity).unit}
        </text>
      </svg>
    )
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><CalculatorOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.subtitle}</Paragraph>
      <Paragraph>{t.intro}</Paragraph>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title={<><ThunderboltOutlined /> {t.bandwidth}</>}>
            {renderBandwidthInput()}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title={<><GlobalOutlined /> {t.snrMode}</>}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Segmented
                value={snrMode}
                onChange={setSnrMode}
                block
                options={[
                  { label: 'SNR (dB)', value: 'db' },
                  { label: lang === 'pt' ? 'Sinal / Ruído (mW)' : 'Signal / Noise (mW)', value: 'mw' },
                ]}
              />
              {snrMode === 'db' ? (
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <Text strong>{t.snrDb}</Text>
                  <InputNumber
                    min={-50}
                    max={100}
                    step={0.1}
                    value={snrDb}
                    onChange={(v) => setSnrDb(v ?? 0)}
                    style={{ width: '100%' }}
                  />
                </Space>
              ) : (
                <Row gutter={[8, 8]}>
                  <Col xs={12}>
                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                      <Text strong>{t.signalPower}</Text>
                      <InputNumber
                        min={0}
                        step={0.1}
                        value={signalMw}
                        onChange={(v) => setSignalMw(v ?? 0)}
                        style={{ width: '100%' }}
                      />
                    </Space>
                  </Col>
                  <Col xs={12}>
                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                      <Text strong>{t.noisePower}</Text>
                      <InputNumber
                        min={0.0001}
                        step={0.1}
                        value={noiseMw}
                        onChange={(v) => setNoiseMw(v ?? 0.0001)}
                        style={{ width: '100%' }}
                      />
                    </Space>
                  </Col>
                </Row>
              )}
            </Space>
          </Card>
        </Col>
      </Row>

      <Card title={t.presets}>
        <Space wrap>
          {Object.entries(PRESETS).map(([key, p]) => (
            <Button key={key} onClick={() => applyPreset(key)}>
              {p.label[lang]}
            </Button>
          ))}
        </Space>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card>
            <Statistic
              title={t.capacity}
              value={result.capacityFormatted.value}
              suffix={result.capacityFormatted.unit}
              precision={2}
            />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic
              title={t.spectralEfficiency}
              value={formatNumber(result.spectralEfficiency, 2)}
              suffix={t.bitsPerHz}
            />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic
              title={t.snrLinear}
              value={formatNumber(snrLinear, 4)}
              prefix={`${formatNumber(result.snrDb, 1)} dB · `}
            />
          </Card>
        </Col>
      </Row>

      <Card title={t.graphTitle}>{renderGraph()}</Card>

      <Card title={t.modulationTable}>
        <Table
          size="small"
          rowKey="name"
          pagination={false}
          dataSource={modulations}
          columns={[
            { title: t.modulation, dataIndex: 'name', key: 'name' },
            { title: t.bitsPerSymbol, dataIndex: 'bitsPerHz', key: 'bitsPerHz' },
            {
              title: t.theoreticalRate,
              dataIndex: 'theoreticalBps',
              key: 'theoreticalBps',
              render: (v) => {
                const f = formatBitsPerSecond(v)
                return `${formatNumber(f.value, 2)} ${f.unit}`
              },
            },
            {
              title: t.feasible,
              dataIndex: 'feasible',
              key: 'feasible',
              render: (v) => (
                <Tag color={v ? 'green' : 'red'}>{v ? t.yes : t.no}</Tag>
              ),
            },
            {
              title: t.efficiency,
              dataIndex: 'efficiency',
              key: 'efficiency',
              render: (v) => `${formatNumber(v, 1)}%`,
            },
          ]}
        />
      </Card>

      <Card title={t.targetCapacity}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={16} md={8}>
            <InputNumber
              min={0}
              step={1}
              value={targetCapacity}
              onChange={(v) => setTargetCapacity(v ?? 0)}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={8} md={4}>
            <Select value={targetUnit} onChange={setTargetUnit} style={{ width: '100%' }}>
              {SPEED_UNITS.map((u) => (
                <Option key={u.unit} value={u.unit}>{u.unit}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} md={12}>
            <Text>
              {t.requiredBandwidth}: {' '}
              <Text strong>
                {requiredBw !== null && requiredBw !== Infinity
                  ? `${formatNumber(requiredBw / 1_000_000, 3)} MHz`
                  : '—'}
              </Text>
            </Text>
          </Col>
        </Row>
      </Card>

      <Alert type="info" showIcon icon={<InfoCircleOutlined />} message={t.note} />

      <Collapse>
        <Panel header={t.sourceCode} key="source">
          <Paragraph>{t.sourceIntro}</Paragraph>
          <pre style={{ overflow: 'auto' }}><code>{sourceCode}</code></pre>
        </Panel>
      </Collapse>
    </Space>
  )
}
