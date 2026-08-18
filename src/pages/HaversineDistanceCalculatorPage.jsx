import React, { useMemo, useState } from 'react'
import {
  Typography,
  Card,
  InputNumber,
  Space,
  Button,
  Row,
  Col,
  Select,
  Table,
  Input,
  message,
  Alert,
  Collapse,
  Tag,
} from 'antd'
import {
  EnvironmentOutlined,
  SwapOutlined,
  CopyOutlined,
  GlobalOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  haversineKm,
  distance,
  initialBearingDeg,
  finalBearingDeg,
  greatCircleMidpoint,
  greatCircleSamples,
  greatCirclePathSegments,
  projectEquirectangular,
  formatDistance,
  parseCoordinateLines,
  CITY_PRESETS,
  ROUTE_PRESETS,
  BATCH_SAMPLE,
} from '../utils/haversineDistance'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input
const { Option } = Select
const { Panel } = Collapse

const MAP_W = 800
const MAP_H = 400

const sourceCode = `import { haversineKm, initialBearingDeg, greatCircleMidpoint } from './haversineDistance'

// Distância entre dois pontos (fórmula de Haversine)
const km = haversineKm(-23.5505, -46.6333, 40.7128, -74.006)
// ≈ 7681 km

// Rumo inicial (bearing) em graus, do norte em sentido horário
const bearing = initialBearingDeg(-23.5505, -46.6333, 40.7128, -74.006)

// Ponto médio sobre o grande círculo (funciona na antimeridiana)
const mid = greatCircleMidpoint(-23.5505, -46.6333, 40.7128, -74.006)

// Fórmula por trás (Haversine), com R = raio médio da Terra:
// a = sin²(Δφ/2) + cos φ1 · cos φ2 · sin²(Δλ/2)
// d = 2 · R · asin(√a)
`

const translations = {
  pt: {
    title: 'Calculadora de Distância Geográfica (Haversine)',
    intro: (
      <>
        Calcula a distância entre dois pontos da superfície da Terra pelo grande
        círculo, usando a fórmula de <Text strong>Haversine</Text>. Útil para
        geolocalização, logística, mapas e qualquer feature com coordenadas
        (lat/lon).
      </>
    ),
    twoPoints: 'Dois pontos',
    batch: 'Múltiplos pontos (lote)',
    pointA: 'Ponto A (origem)',
    pointB: 'Ponto B (destino)',
    lat: 'Latitude',
    lon: 'Longitude',
    cityPresets: 'Cidades de exemplo',
    routePresets: 'Rotas de exemplo',
    unit: 'Unidade',
    swap: 'Inverter A ↔ B',
    result: 'Resultado',
    distanceLabel: 'Distância',
    bearingInit: 'Rumo inicial',
    bearingFinal: 'Rumo final',
    midpoint: 'Ponto médio',
    midLatLon: 'Lat / Lon',
    samePoint: 'Os dois pontos são os mesmos',
    invalidPoint: 'Coordenada inválida',
    outOfRange: 'Latitude deve estar entre -90 e 90 e longitude entre -180 e 180',
    mapTitle: 'Grande círculo na projeção equiretangular',
    batchSample: 'Carregar exemplo',
    batchTextPlaceholder: 'Uma coordenada por linha:\nnome, lat, lon   ou   lat, lon',
    batchOrigin: 'Ponto de referência',
    batchOriginHint: 'A distância de cada linha é calculada até este ponto.',
    batchResults: 'Resultados',
    nearest: 'mais próximo',
    name: 'Nome',
    bearing: 'Rumo',
    copy: 'Copiar',
    copied: 'Copiado',
    copyMarkdown: 'Copiar Markdown',
    rowsValid: (valid, total) => `${valid} de ${total} linhas válidas`,
    errorFormat: 'Formato não reconhecido (use: nome, lat, lon)',
    errorNumber: 'Valores não são números',
    errorRange: 'Fora dos limites de lat/lon',
    emptyBatch: 'Cole linhas com coordenadas para ver os resultados.',
    explanationTitle: 'Como funciona',
    explanation: (
      <>
        A fórmula de <Text strong>Haversine</Text> calcula a distância entre
        dois pontos sobre uma esfera perfeita de raio médio 6.371 km. A rota
        desenhada no mapa é o <em>grande círculo</em> — a interseção da esfera
        com o plano que passa pelos dois pontos e pelo centro da Terra — que é
        o caminho mais curto entre eles. A interpolação usa <em>slerp</em>{' '}
        (interpolação linear esférica em vetores 3D), o que também resolve o
        caso de rotas que cruzam a antimeridiana (o meridiano 180°).
      </>
    ),
    sourceCode: 'Código-fonte do motor',
    origin: 'Origem',
    destination: 'Destino',
  },
  en: {
    title: 'Geographic Distance Calculator (Haversine)',
    intro: (
      <>
        Calculates the great-circle distance between two points on the Earth's
        surface using the <Text strong>Haversine</Text> formula. Useful for
        geolocation, logistics, maps, and any feature dealing with lat/lon
        coordinates.
      </>
    ),
    twoPoints: 'Two points',
    batch: 'Multiple points (batch)',
    pointA: 'Point A (origin)',
    pointB: 'Point B (destination)',
    lat: 'Latitude',
    lon: 'Longitude',
    cityPresets: 'Sample cities',
    routePresets: 'Sample routes',
    unit: 'Unit',
    swap: 'Swap A ↔ B',
    result: 'Result',
    distanceLabel: 'Distance',
    bearingInit: 'Initial bearing',
    bearingFinal: 'Final bearing',
    midpoint: 'Midpoint',
    midLatLon: 'Lat / Lon',
    samePoint: 'Both points are the same',
    invalidPoint: 'Invalid coordinate',
    outOfRange: 'Latitude must be between -90 and 90 and longitude between -180 and 180',
    mapTitle: 'Great circle on the equirectangular projection',
    batchSample: 'Load sample',
    batchTextPlaceholder: 'One coordinate per line:\nname, lat, lon   or   lat, lon',
    batchOrigin: 'Reference point',
    batchOriginHint: 'The distance of each line is measured to this point.',
    batchResults: 'Results',
    nearest: 'closest',
    name: 'Name',
    bearing: 'Bearing',
    copy: 'Copy',
    copied: 'Copied',
    copyMarkdown: 'Copy Markdown',
    rowsValid: (valid, total) => `${valid} of ${total} lines valid`,
    errorFormat: 'Unrecognized format (use: name, lat, lon)',
    errorNumber: 'Values are not numbers',
    errorRange: 'Out of lat/lon bounds',
    emptyBatch: 'Paste coordinate lines to see the results.',
    explanationTitle: 'How it works',
    explanation: (
      <>
        The <Text strong>Haversine</Text> formula computes the distance between
        two points on a perfect sphere with a mean radius of 6,371 km. The path
        drawn on the map is the <em>great circle</em> — the intersection of the
        sphere with the plane passing through both points and the Earth's
        center — which is the shortest path between them. The interpolation
        uses <em>slerp</em> (spherical linear interpolation on 3D vectors),
        which also handles routes crossing the antimeridian (180° meridian).
      </>
    ),
    sourceCode: 'Engine source code',
    origin: 'Origin',
    destination: 'Destination',
  },
}

function MapSvg({ pointA, pointB, t, height }) {
  const a = projectEquirectangular(pointA.lat, pointA.lon, MAP_W, MAP_H)
  const b = projectEquirectangular(pointB.lat, pointB.lon, MAP_W, MAP_H)
  const paths = useMemo(
    () =>
      greatCirclePathSegments(
        greatCircleSamples(pointA.lat, pointA.lon, pointB.lat, pointB.lon, 96),
        MAP_W,
        MAP_H
      ),
    [pointA.lat, pointA.lon, pointB.lat, pointB.lon]
  )

  const latLines = []
  for (let lat = -90; lat <= 90; lat += 30) {
    latLines.push(projectEquirectangular(lat, -180, MAP_W, MAP_H).y)
  }
  const lonLines = []
  for (let lon = -180; lon <= 180; lon += 30) {
    lonLines.push(projectEquirectangular(0, lon, MAP_W, MAP_H).x)
  }

  return (
    <svg
      viewBox={`0 0 ${MAP_W} ${MAP_H}`}
      style={{ width: '100%', maxWidth: MAP_W + 40, display: 'block', margin: '0 auto' }}
      role="img"
      aria-label={t.mapTitle}
    >
      <rect x="0" y="0" width={MAP_W} height={MAP_H} fill="#f5f7fa" rx="8" />
      {latLines.map((y) => (
        <line key={`lat-${y}`} x1="0" y1={y} x2={MAP_W} y2={y} stroke="#e3e8ef" strokeWidth="1" />
      ))}
      {lonLines.map((x) => (
        <line key={`lon-${x}`} x1={x} y1="0" x2={x} y2={MAP_H} stroke="#e3e8ef" strokeWidth="1" />
      ))}
      {paths.map((path, i) => (
        <polyline
          key={`path-${i}`}
          points={path.map((p) => `${p.x},${p.y}`).join(' ')}
          fill="none"
          stroke="#52c41a"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
      ))}
      <circle cx={a.x} cy={a.y} r="5" fill="#1677ff" stroke="#fff" strokeWidth="1.5" />
      <text x={a.x + 7} y={a.y - 5} fontSize="11" fill="#1677ff">
        {t.origin}
      </text>
      <circle cx={b.x} cy={b.y} r="5" fill="#eb2f96" stroke="#fff" strokeWidth="1.5" />
      <text x={b.x + 7} y={b.y - 5} fontSize="11" fill="#eb2f96">
        {t.destination}
      </text>
    </svg>
  )
}

function CoordInput({ label, value, onChange, placeholder }) {
  return (
    <Space direction="vertical" style={{ width: '100%' }} size={4}>
      <Text strong style={{ fontSize: 12 }}>{label}</Text>
      <InputNumber
        value={value}
        onChange={(v) => onChange(v ?? 0)}
        placeholder={placeholder}
        style={{ width: '100%' }}
        step={0.0001}
      />
    </Space>
  )
}

export default function HaversineDistanceCalculatorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [latA, setLatA] = useState(-23.5505)
  const [lonA, setLonA] = useState(-46.6333)
  const [latB, setLatB] = useState(40.7128)
  const [lonB, setLonB] = useState(-74.006)
  const [unit, setUnit] = useState('km')

  const [batchText, setBatchText] = useState(BATCH_SAMPLE)
  const [originLat, setOriginLat] = useState(-23.5505)
  const [originLon, setOriginLon] = useState(-46.6333)
  const [batchUnit, setBatchUnit] = useState('km')

  const pointAValid = useMemo(
    () => latA >= -90 && latA <= 90 && lonA >= -180 && lonA <= 180,
    [latA, lonA]
  )
  const pointBValid = useMemo(
    () => latB >= -90 && latB <= 90 && lonB >= -180 && lonB <= 180,
    [latB, lonB]
  )
  const bothValid = pointAValid && pointBValid

  const distKm = useMemo(() => {
    if (!bothValid) return null
    return haversineKm(latA, lonA, latB, lonB)
  }, [bothValid, latA, lonA, latB, lonB])

  const isSamePoint = bothValid && distKm !== null && distKm < 0.0005

  const bearingInit = useMemo(() => {
    if (!bothValid || isSamePoint) return null
    return initialBearingDeg(latA, lonA, latB, lonB)
  }, [bothValid, isSamePoint, latA, lonA, latB, lonB])

  const bearingFinal = useMemo(() => {
    if (!bothValid || isSamePoint) return null
    return finalBearingDeg(latA, lonA, latB, lonB)
  }, [bothValid, isSamePoint, latA, lonA, latB, lonB])

  const mid = useMemo(() => {
    if (!bothValid || isSamePoint) return null
    return greatCircleMidpoint(latA, lonA, latB, lonB)
  }, [bothValid, isSamePoint, latA, lonA, latB, lonB])

  const parsed = useMemo(() => parseCoordinateLines(batchText), [batchText])

  const originValid = useMemo(
    () => originLat >= -90 && originLat <= 90 && originLon >= -180 && originLon <= 180,
    [originLat, originLon]
  )

  const batchRows = useMemo(() => {
    if (!originValid) return []
    return parsed.points.map((p, i) => {
      const km = haversineKm(originLat, originLon, p.lat, p.lon)
      return {
        key: `${i}-${p.name}`,
        name: p.name,
        lat: p.lat,
        lon: p.lon,
        km,
        distanceLabel: formatDistance(distance(originLat, originLon, p.lat, p.lon, batchUnit), batchUnit),
        bearing: initialBearingDeg(originLat, originLon, p.lat, p.lon),
      }
    })
  }, [parsed, originValid, originLat, originLon, batchUnit])

  const sortedRows = useMemo(
    () => [...batchRows].sort((a, b) => a.km - b.km),
    [batchRows]
  )
  const nearest = sortedRows[0]

  const batchMarkdown = useMemo(() => {
    const header = `| ${t.name} | ${t.lat} | ${t.lon} | ${t.distanceLabel} (${batchUnit}) | ${t.bearing} |`
    const sep = '| --- | --- | --- | --- | --- |'
    const body = batchRows
      .map((r) => `| ${r.name} | ${r.lat} | ${r.lon} | ${r.distanceLabel} | ${r.bearing.toFixed(1)}° |`)
      .join('\n')
    return `# ${t.title}\n\n${header}\n${sep}\n${body}`
  }, [batchRows, t])

  function copy(text) {
    navigator.clipboard.writeText(text)
    message.success(t.copied)
  }

  function applyCity(city) {
    setLatA(city.lat)
    setLonA(city.lon)
  }

  function applyRoute(route) {
    setLatA(route.a.lat)
    setLonA(route.a.lon)
    setLatB(route.b.lat)
    setLonB(route.b.lon)
  }

  function swapPoints() {
    setLatA(latB)
    setLonA(lonB)
    setLatB(latA)
    setLonB(lonA)
  }

  const errorReasonText = (reason) => {
    if (reason === 'format') return t.errorFormat
    if (reason === 'number') return t.errorNumber
    if (reason === 'range') return t.errorRange
    return reason
  }

  const tableColumns = [
    {
      title: t.name,
      dataIndex: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (v) => <Text strong>{v}</Text>,
    },
    {
      title: t.lat,
      dataIndex: 'lat',
      align: 'right',
      sorter: (a, b) => a.lat - b.lat,
      render: (v) => v.toFixed(4),
    },
    {
      title: t.lon,
      dataIndex: 'lon',
      align: 'right',
      sorter: (a, b) => a.lon - b.lon,
      render: (v) => v.toFixed(4),
    },
    {
      title: `${t.distanceLabel} (${batchUnit})`,
      dataIndex: 'distanceLabel',
      align: 'right',
      sorter: (a, b) => a.km - b.km,
      render: (v, r) => (
        <Space size={6}>
          <Text>{v}</Text>
          {nearest && r.km === nearest.km && (
            <Tag color="green" style={{ fontSize: 10, lineHeight: '16px' }}>{t.nearest}</Tag>
          )}
        </Space>
      ),
    },
    {
      title: t.bearing,
      dataIndex: 'bearing',
      align: 'right',
      sorter: (a, b) => a.bearing - b.bearing,
      render: (v) => `${v.toFixed(1)}°`,
    },
  ]

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><EnvironmentOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card title={<><GlobalOutlined /> {t.twoPoints}</>}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12}>
                  <Space direction="vertical" size={8} style={{ width: '100%' }}>
                    <Text strong>{t.pointA}</Text>
                    <CoordInput label={t.lat} value={latA} onChange={setLatA} />
                    <CoordInput label={t.lon} value={lonA} onChange={setLonA} />
                    <Select
                      value={undefined}
                      placeholder={t.cityPresets}
                      onChange={(name) => applyCity(CITY_PRESETS.find((c) => c.name === name))}
                      style={{ width: '100%' }}
                      allowClear
                    >
                      {CITY_PRESETS.map((c) => (
                        <Option key={c.name} value={c.name}>{c.name}</Option>
                      ))}
                    </Select>
                  </Space>
                </Col>
                <Col xs={24} sm={12}>
                  <Space direction="vertical" size={8} style={{ width: '100%' }}>
                    <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                      <Text strong>{t.pointB}</Text>
                      <Button size="small" icon={<SwapOutlined />} onClick={swapPoints}>
                        {t.swap}
                      </Button>
                    </Space>
                    <CoordInput label={t.lat} value={latB} onChange={setLatB} />
                    <CoordInput label={t.lon} value={lonB} onChange={setLonB} />
                    <Select
                      value={undefined}
                      placeholder={t.routePresets}
                      onChange={(id) => applyRoute(ROUTE_PRESETS.find((r) => r.id === id))}
                      style={{ width: '100%' }}
                      allowClear
                    >
                      {ROUTE_PRESETS.map((r) => (
                        <Option key={r.id} value={r.id}>{r.label[lang]}</Option>
                      ))}
                    </Select>
                  </Space>
                </Col>
              </Row>

              {!pointAValid || !pointBValid ? (
                <Alert type="error" showIcon message={t.outOfRange} />
              ) : (
                <>
                  {isSamePoint && <Alert type="warning" showIcon message={t.samePoint} />}
                  <Card size="small" title={t.result}>
                    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                      <Row gutter={[16, 16]} align="middle">
                        <Col xs={24} sm={8}>
                          <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>{t.distanceLabel}</Text>
                          <Space size={8}>
                            <Text code style={{ fontSize: 18 }}>
                              {formatDistance(distance(latA, lonA, latB, lonB, unit), unit)}
                            </Text>
                            <Select
                              value={unit}
                              onChange={setUnit}
                              size="small"
                              style={{ width: 80 }}
                            >
                              {Object.keys({ km: 1, m: 1, mi: 1, nmi: 1 }).map((u) => (
                                <Option key={u} value={u}>{u}</Option>
                              ))}
                            </Select>
                          </Space>
                          <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>
                            = {formatDistance(distKm, 'km')}
                          </Text>
                        </Col>
                        <Col xs={12} sm={4}>
                          <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>{t.bearingInit}</Text>
                          <Text strong style={{ fontSize: 16 }}>
                            {bearingInit === null ? '—' : `${bearingInit.toFixed(1)}°`}
                          </Text>
                        </Col>
                        <Col xs={12} sm={4}>
                          <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>{t.bearingFinal}</Text>
                          <Text strong style={{ fontSize: 16 }}>
                            {bearingFinal === null ? '—' : `${bearingFinal.toFixed(1)}°`}
                          </Text>
                        </Col>
                        <Col xs={24} sm={8}>
                          <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>{t.midpoint}</Text>
                          <Text code style={{ fontSize: 13 }}>
                            {mid === null
                              ? '—'
                              : `${mid.lat.toFixed(4)}, ${mid.lon.toFixed(4)}`}
                          </Text>
                          <Button
                            size="small"
                            type="text"
                            icon={<CopyOutlined />}
                            disabled={mid === null}
                            onClick={() => copy(`${mid.lat.toFixed(6)}, ${mid.lon.toFixed(6)}`)}
                          >
                            {t.copy}
                          </Button>
                        </Col>
                      </Row>
                    </Space>
                  </Card>
                </>
              )}

              <Card size="small" title={t.mapTitle}>
                <MapSvg pointA={{ lat: latA, lon: lonA }} pointB={{ lat: latB, lon: lonB }} t={t} />
              </Card>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card title={<><SwapOutlined rotate={90} /> {t.batch}</>}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Space>
                <Button size="small" icon={<CopyOutlined />} onClick={() => setBatchText(BATCH_SAMPLE)}>
                  {t.batchSample}
                </Button>
                <Text type="secondary" style={{ fontSize: 12 }}>{t.rowsValid(parsed.valid, parsed.total)}</Text>
              </Space>

              <TextArea
                rows={9}
                value={batchText}
                onChange={(e) => setBatchText(e.target.value)}
                placeholder={t.batchTextPlaceholder}
                style={{ fontFamily: 'monospace', fontSize: 13 }}
              />

              {parsed.errors.length > 0 && (
                <Alert
                  type="warning"
                  showIcon
                  message={parsed.errors
                    .slice(0, 5)
                    .map((e) => `${t.lat} ${e.line}: ${errorReasonText(e.reason)}`)
                    .join('; ')}
                />
              )}

              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <CoordInput label={`${t.batchOrigin} — ${t.lat}`} value={originLat} onChange={setOriginLat} />
                </Col>
                <Col span={12}>
                  <CoordInput label={`${t.batchOrigin} — ${t.lon}`} value={originLon} onChange={setOriginLon} />
                </Col>
              </Row>
              <Text type="secondary" style={{ fontSize: 12 }}>{t.batchOriginHint}</Text>

              {batchRows.length === 0 ? (
                <Alert type="info" showIcon message={t.emptyBatch} />
              ) : (
                <>
                  <Table
                    size="small"
                    columns={tableColumns}
                    dataSource={batchRows}
                    pagination={false}
                    scroll={{ x: 520 }}
                  />
                  <Space>
                    <Select
                      value={batchUnit}
                      onChange={setBatchUnit}
                      style={{ width: 100 }}
                      size="small"
                    >
                      {Object.keys({ km: 1, m: 1, mi: 1, nmi: 1 }).map((u) => (
                        <Option key={u} value={u}>{u}</Option>
                      ))}
                    </Select>
                    <Button
                      size="small"
                      icon={<CopyOutlined />}
                      onClick={() => copy(batchMarkdown)}
                    >
                      {t.copyMarkdown}
                    </Button>
                  </Space>
                </>
              )}
            </Space>
          </Card>
        </Col>
      </Row>

      <Alert type="info" showIcon message={t.explanationTitle} description={t.explanation} />

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
