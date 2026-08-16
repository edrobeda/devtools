import React, { useMemo, useState } from 'react'
import {
  Typography,
  Card,
  Select,
  InputNumber,
  Space,
  Row,
  Col,
  Statistic,
  Button,
  Table,
  Collapse,
  Alert,
  Slider,
} from 'antd'
import { ThunderboltOutlined, GlobalOutlined, InfoCircleOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  CLOUD_REGIONS,
  PRESETS,
  haversineDistance,
  calculateLatency,
  getRegionById,
  formatNumber,
  buildQuickTable,
  DEFAULT_CABLE_FACTOR,
  DEFAULT_REALISTIC_FACTOR,
} from '../utils/networkLatencyCalculator'

const { Title, Paragraph, Text } = Typography
const { Panel } = Collapse
const { Option, OptGroup } = Select

const sourceCode = `import {
  haversineDistance,
  calculateLatency,
  getRegionById,
} from '../utils/networkLatencyCalculator'

const saoPaulo = getRegionById('sa-east-1')
const virginia = getRegionById('us-east-1')

const distance = haversineDistance(
  saoPaulo.lat, saoPaulo.lon,
  virginia.lat, virginia.lon
)
// ~7666 km

const { rttMinMs, rttRealisticMs } = calculateLatency(distance)
// rttMinMs ≈ 76.6 ms, rttRealisticMs ≈ 99.6 ms
`

const translations = {
  pt: {
    title: 'Calculadora de Latência de Rede',
    subtitle: 'Estimativa de RTT entre regiões e coordenadas',
    intro: 'Estime o tempo de ida e volta (RTT) entre dois pontos na rede a partir da distância geodésica. Use regiões de nuvem pré-cadastradas ou coordenadas manualmente. O valor real varia com rotas de backbone, congestionamento e infraestrutura do provedor.',
    origin: 'Origem',
    destination: 'Destino',
    region: 'Região de nuvem',
    latitude: 'Latitude',
    longitude: 'Longitude',
    cableFactor: 'Fator do cabo de fibra',
    realisticFactor: 'Fator realista de infraestrutura',
    results: 'Resultados',
    distance: 'Distância geodésica',
    oneWayMin: 'Latência mínima (one-way)',
    rttMin: 'RTT mínimo teórico',
    rttRealistic: 'RTT estimado (realista)',
    presets: 'Cenários rápidos',
    quickTable: 'Tabela rápida entre regiões populares',
    from: 'Origem',
    to: 'Destino',
    rtt: 'RTT estimado',
    sourceTitle: 'Motor de cálculo',
    sourceIntro: 'O motor usa a fórmula de Haversine e a velocidade de propagação no cabo de fibra. Tudo roda no navegador — nenhuma coordenada sai daqui.',
    disclaimer: 'Valores são estimativas teóricas. Latências reais podem ser 20–100% maiores dependendo da rota, provedor e condições da rede.',
  },
  en: {
    title: 'Network Latency Calculator',
    subtitle: 'RTT estimate between regions and coordinates',
    intro: 'Estimate round-trip time (RTT) between two network points from the geodesic distance. Use preloaded cloud regions or enter coordinates manually. Actual values vary with backbone routes, congestion and provider infrastructure.',
    origin: 'Origin',
    destination: 'Destination',
    region: 'Cloud region',
    latitude: 'Latitude',
    longitude: 'Longitude',
    cableFactor: 'Fiber cable factor',
    realisticFactor: 'Realistic infrastructure factor',
    results: 'Results',
    distance: 'Geodesic distance',
    oneWayMin: 'Minimum one-way latency',
    rttMin: 'Minimum theoretical RTT',
    rttRealistic: 'Estimated realistic RTT',
    presets: 'Quick scenarios',
    quickTable: 'Quick table between popular regions',
    from: 'Origin',
    to: 'Destination',
    rtt: 'Estimated RTT',
    sourceTitle: 'Calculation engine',
    sourceIntro: 'The engine uses the Haversine formula and fiber propagation speed. Everything runs in the browser — no coordinates leave this page.',
    disclaimer: 'Values are theoretical estimates. Real-world latency can be 20–100% higher depending on route, provider and network conditions.',
  },
}

const providerLabels = {
  pt: { AWS: 'AWS', GCP: 'GCP', Azure: 'Azure', Manual: 'Manual' },
  en: { AWS: 'AWS', GCP: 'GCP', Azure: 'Azure', Manual: 'Manual' },
}

const regionsByProvider = CLOUD_REGIONS.reduce((acc, region) => {
  if (!acc[region.provider]) acc[region.provider] = []
  acc[region.provider].push(region)
  return acc
}, {})

const POPULAR_REGIONS = [
  'sa-east-1',
  'us-east-1',
  'us-west-2',
  'eu-west-1',
  'eu-central-1',
  'ap-southeast-1',
  'ap-northeast-1',
  'ap-southeast-2',
]

export default function NetworkLatencyCalculatorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [originRegionId, setOriginRegionId] = useState('sa-east-1')
  const [destRegionId, setDestRegionId] = useState('us-east-1')
  const [originLat, setOriginLat] = useState(-23.55)
  const [originLon, setOriginLon] = useState(-46.63)
  const [destLat, setDestLat] = useState(37.93)
  const [destLon, setDestLon] = useState(-78.24)
  const [useManualOrigin, setUseManualOrigin] = useState(false)
  const [useManualDest, setUseManualDest] = useState(false)
  const [cableFactor, setCableFactor] = useState(DEFAULT_CABLE_FACTOR)
  const [realisticFactor, setRealisticFactor] = useState(DEFAULT_REALISTIC_FACTOR)

  const applyRegion = (id, setterLat, setterLon, setterManual) => {
    const region = getRegionById(id)
    if (region) {
      setterLat(region.lat)
      setterLon(region.lon)
      setterManual(false)
    }
  }

  const handleOriginRegionChange = (id) => {
    setOriginRegionId(id)
    applyRegion(id, setOriginLat, setOriginLon, setUseManualOrigin)
  }

  const handleDestRegionChange = (id) => {
    setDestRegionId(id)
    applyRegion(id, setDestLat, setDestLon, setUseManualDest)
  }

  const effectiveOrigin = useMemo(
    () => ({ lat: originLat, lon: originLon }),
    [originLat, originLon]
  )
  const effectiveDest = useMemo(
    () => ({ lat: destLat, lon: destLon }),
    [destLat, destLon]
  )

  const result = useMemo(() => {
    const distance = haversineDistance(
      effectiveOrigin.lat,
      effectiveOrigin.lon,
      effectiveDest.lat,
      effectiveDest.lon
    )
    return calculateLatency(distance, cableFactor, realisticFactor)
  }, [effectiveOrigin, effectiveDest, cableFactor, realisticFactor])

  const quickTable = useMemo(() => buildQuickTable(POPULAR_REGIONS), [])

  const applyPreset = (presetId) => {
    const [fromId, toId] = presetId.split(':')
    handleOriginRegionChange(fromId)
    handleDestRegionChange(toId)
  }

  const columns = [
    {
      title: t.from,
      dataIndex: 'from',
      render: (region) => (
        <Text strong>{region.name}</Text>
      ),
    },
    {
      title: t.to,
      dataIndex: 'to',
      render: (region) => (
        <Text strong>{region.name}</Text>
      ),
    },
    {
      title: t.distance,
      dataIndex: 'distanceKm',
      render: (v) => `${formatNumber(v)} km`,
    },
    {
      title: t.rtt,
      dataIndex: 'rttMs',
      render: (v) => `${formatNumber(v)} ms`,
    },
  ]

  return (
    <div style={{ padding: 24, maxWidth: 960, margin: '0 auto' }}>
      <Title level={2}>
        <ThunderboltOutlined style={{ marginRight: 12 }} />
        {t.title}
      </Title>
      <Paragraph type="secondary" style={{ marginTop: -8, marginBottom: 24 }}>
        {t.subtitle}
      </Paragraph>
      <Paragraph>{t.intro}</Paragraph>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card title={<span><GlobalOutlined style={{ marginRight: 8 }} />{t.origin}</span>}>
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <div>
                <Text strong>{t.region}</Text>
                <Select
                  style={{ width: '100%' }}
                  value={useManualOrigin ? 'manual' : originRegionId}
                  onChange={(v) => {
                    if (v === 'manual') {
                      setUseManualOrigin(true)
                    } else {
                      handleOriginRegionChange(v)
                    }
                  }}
                  showSearch
                  filterOption={(input, option) => {
                    const text = option?.children?.join('').toLowerCase() || ''
                    return text.includes(input.toLowerCase())
                  }}
                >
                  <Option value="manual">{providerLabels[lang].Manual}</Option>
                  {Object.keys(regionsByProvider).map((provider) => (
                    <OptGroup label={provider} key={provider}>
                      {regionsByProvider[provider].map((region) => (
                        <Option value={region.id} key={region.id}>
                          {region.name} ({region.country}) — {region.id}
                        </Option>
                      ))}
                    </OptGroup>
                  ))}
                </Select>
              </div>
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Text strong>{t.latitude}</Text>
                  <InputNumber
                    style={{ width: '100%' }}
                    value={originLat}
                    min={-90}
                    max={90}
                    step={0.01}
                    onChange={(v) => {
                      setOriginLat(v ?? 0)
                      setUseManualOrigin(true)
                    }}
                  />
                </Col>
                <Col span={12}>
                  <Text strong>{t.longitude}</Text>
                  <InputNumber
                    style={{ width: '100%' }}
                    value={originLon}
                    min={-180}
                    max={180}
                    step={0.01}
                    onChange={(v) => {
                      setOriginLon(v ?? 0)
                      setUseManualOrigin(true)
                    }}
                  />
                </Col>
              </Row>
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card title={<span><GlobalOutlined style={{ marginRight: 8 }} />{t.destination}</span>}>
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <div>
                <Text strong>{t.region}</Text>
                <Select
                  style={{ width: '100%' }}
                  value={useManualDest ? 'manual' : destRegionId}
                  onChange={(v) => {
                    if (v === 'manual') {
                      setUseManualDest(true)
                    } else {
                      handleDestRegionChange(v)
                    }
                  }}
                  showSearch
                  filterOption={(input, option) => {
                    const text = option?.children?.join('').toLowerCase() || ''
                    return text.includes(input.toLowerCase())
                  }}
                >
                  <Option value="manual">{providerLabels[lang].Manual}</Option>
                  {Object.keys(regionsByProvider).map((provider) => (
                    <OptGroup label={provider} key={provider}>
                      {regionsByProvider[provider].map((region) => (
                        <Option value={region.id} key={region.id}>
                          {region.name} ({region.country}) — {region.id}
                        </Option>
                      ))}
                    </OptGroup>
                  ))}
                </Select>
              </div>
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Text strong>{t.latitude}</Text>
                  <InputNumber
                    style={{ width: '100%' }}
                    value={destLat}
                    min={-90}
                    max={90}
                    step={0.01}
                    onChange={(v) => {
                      setDestLat(v ?? 0)
                      setUseManualDest(true)
                    }}
                  />
                </Col>
                <Col span={12}>
                  <Text strong>{t.longitude}</Text>
                  <InputNumber
                    style={{ width: '100%' }}
                    value={destLon}
                    min={-180}
                    max={180}
                    step={0.01}
                    onChange={(v) => {
                      setDestLon(v ?? 0)
                      setUseManualDest(true)
                    }}
                  />
                </Col>
              </Row>
            </Space>
          </Card>
        </Col>
      </Row>

      <Card style={{ marginTop: 16 }} title={t.results}>
        <Row gutter={[16, 16]}>
          <Col xs={12} md={6}>
            <Statistic
              title={t.distance}
              value={`${formatNumber(result.distanceKm)} km`}
            />
          </Col>
          <Col xs={12} md={6}>
            <Statistic
              title={t.oneWayMin}
              value={`${formatNumber(result.oneWayMinMs)} ms`}
            />
          </Col>
          <Col xs={12} md={6}>
            <Statistic
              title={t.rttMin}
              value={`${formatNumber(result.rttMinMs)} ms`}
            />
          </Col>
          <Col xs={12} md={6}>
            <Statistic
              title={t.rttRealistic}
              value={`${formatNumber(result.rttRealisticMs)} ms`}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
        </Row>
      </Card>

      <Card style={{ marginTop: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div>
            <Text strong>{t.cableFactor}: {cableFactor.toFixed(1)}x</Text>
            <Slider
              min={1}
              max={2.5}
              step={0.1}
              value={cableFactor}
              onChange={setCableFactor}
              marks={{ 1: '1.0x', 1.5: '1.5x', 2.5: '2.5x' }}
            />
          </div>
          <div>
            <Text strong>{t.realisticFactor}: {realisticFactor.toFixed(1)}x</Text>
            <Slider
              min={1}
              max={2.5}
              step={0.1}
              value={realisticFactor}
              onChange={setRealisticFactor}
              marks={{ 1: '1.0x', 1.3: '1.3x', 2.5: '2.5x' }}
            />
          </div>
        </Space>
      </Card>

      <Card style={{ marginTop: 16 }} title={t.presets}>
        <Space wrap>
          {PRESETS.map((preset) => (
            <Button key={preset.id} size="small" onClick={() => applyPreset(preset.id)}>
              {preset.label[lang]}
            </Button>
          ))}
        </Space>
      </Card>

      <Card style={{ marginTop: 16 }} title={t.quickTable}>
        <Table
          dataSource={quickTable}
          columns={columns}
          pagination={false}
          size="small"
          rowKey="key"
        />
      </Card>

      <Alert
        type="info"
        showIcon
        icon={<InfoCircleOutlined />}
        message={t.disclaimer}
        style={{ marginTop: 16 }}
      />

      <Collapse style={{ marginTop: 24 }}>
        <Panel header={t.sourceTitle} key="source">
          <Paragraph>{t.sourceIntro}</Paragraph>
          <pre style={{ background: '#f6ffed', padding: 16, borderRadius: 8, overflow: 'auto' }}>
            <code>{sourceCode}</code>
          </pre>
        </Panel>
      </Collapse>
    </div>
  )
}
