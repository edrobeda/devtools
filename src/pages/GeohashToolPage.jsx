import React, { useMemo, useState } from 'react'
import {
  Typography,
  Card,
  InputNumber,
  Input,
  Select,
  Space,
  Button,
  Row,
  Col,
  Table,
  Tag,
  message,
  Alert,
  Collapse,
  Segmented,
  Descriptions,
} from 'antd'
import {
  EnvironmentOutlined,
  SwapOutlined,
  CopyOutlined,
  GlobalOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  CITY_PRESETS,
  PRECISION_TABLE,
  cellGrid,
  cellMeters,
  decode,
  encode,
  getEngineSource,
  humanDistance,
  isBase32Character,
  cleanInput,
} from '../utils/geohash'

const { Title, Paragraph, Text } = Typography
const { Option } = Select
const { Panel } = Collapse

const MAP_W = 720
const MAP_H = 400

// Formata graus sem sujeira de ponto flutuante (e sem zeros à direita).
function fmtDeg(v) {
  if (v == null) return '—'
  if (Number.isInteger(v)) return String(v)
  const s = String(Math.round(v * 1e6) / 1e6)
  return s.replace(/\.?0+$/, '')
}

function fmtCoord(v, digits) {
  return v.toFixed(digits)
}

// Direções em cada idioma, na ordem usada na tabela de vizinhos.
const DIR_LABELS = {
  pt: {
    n: 'Norte',
    s: 'Sul',
    e: 'Leste',
    w: 'Oeste',
    ne: 'Nordeste',
    nw: 'Noroeste',
    se: 'Sudeste',
    sw: 'Sudoeste',
  },
  en: {
    n: 'North',
    s: 'South',
    e: 'East',
    w: 'West',
    ne: 'Northeast',
    nw: 'Northwest',
    se: 'Southeast',
    sw: 'Southwest',
  },
}

const translations = {
  pt: {
    title: 'Codificador / Decodificador de Geohash',
    intro: (
      <>
        Codifica latitude/longitude numa string curta (<Text strong>geohash</Text>)
        e decodifica a string de volta numa célula da superfície da Terra, com
        os vizinhos ao redor. Quanto maior a string, menor a célula — e
        prefixos comuns indicam proximidade. 100% no navegador, nada sai dele.
      </>
    ),
    mode: 'Modo',
    modeEncode: 'Codificar',
    modeDecode: 'Decodificar',
    modeRef: 'Referência rápida',
    lat: 'Latitude',
    lon: 'Longitude',
    precision: 'Precisão (caracteres)',
    precisionHint: 'Cada caractere extra subdivide a célula: mais caracteres = célula menor e mais precisa.',
    cityPresets: 'Cidades de exemplo',
    encodeResult: 'Geohash gerado',
    copy: 'Copiar',
    copied: 'Copiado',
    outOfRange: 'Latitude deve ficar entre -90 e 90 e longitude entre -180 e 180.',
    decodedCell: 'Célula decodificada',
    decodedCellHint: 'O geohash representa um retângulo inteiro, não um ponto — o centro é apenas a referência visual.',
    box: 'Caixa delimitadora',
    center: 'Centro',
    cellSize: 'Tamanho da célula',
    cellDegrees: 'Em graus',
    cellMeters: 'Aproximadamente (no centro da célula)',
    anywhereInBox: 'Qualquer ponto dentro dessa caixa gera o mesmo geohash (ou com o mesmo prefixo para versões maiores).',
    neighbors: 'Células vizinhas (8)',
    neighborsHint: 'Útil para indexar “ao redor de”: com saída de um ponto, os 8 vizinhos cobrem o entorno.',
    mapTitle: 'Célula e vizinhos (grade 3×3)',
    decodeInput: 'String Geohash',
    decodePlaceholder: 'Ex.: 6gyf4bf (São Paulo)',
    decodeSamples: 'Exemplos',
    errEmpty: 'Digite uma string geohash (ex.: 6gyf4bf).',
    errLength: 'String muito curta ou longa. Use entre 1 e 24 caracteres.',
    errInvalid: 'Caractere inválido. Alfabeto base32: 0123456789bcdefghjkmnpqrstuvwxyz (sem a, i, l e o).',
    direction: 'Direção',
    geohash: 'Geohash',
    referenceTitle: 'Tamanho da célula por precisão',
    refEquatorNote: 'Tamanhos aproximados no equador (~111 km por grau). A largura em longitude encolhe com o cosseno da latitude (ex.: no paralelo 60° ela cai pela metade).',
    refPrecision: 'Precisão',
    refBits: 'Bits lon / lat',
    refDegrees: 'Graus (lon × lat)',
    refSize: 'Tamanho (lon × lat)',
    cellsTableHint: '4 chars ≈ uma cidade; 6 ≈ um quarteirão; 7 ≈ uma rua; 9 ≈ uma casa.',
    howItWorksTitle: 'Como funciona',
    howItWorks: (
      <>
        Um geohash é uma string base32 que codifica uma célula num mapa-múndi
        hierárquico. O mundo é dividido ao meio primeiro na longitude, depois
        na latitude, e assim por diante — cada bit refina a metade, e cada
        caractere vale 5 bits. Células idênticas por prefixo são vizinhas ou
        estão próximas: <Text code>9q8yyk</Text> e <Text code>9q8yyj</Text>{' '}
        dividem <Text code>9q8yy</Text>, logo são adjacentes. Para achar os
        vizinhos de uma célula basta deslocar o centro dela pela altura e
        largura da célula e re-codificar no mesmo nível (o que o botão acima
        já faz para você).
      </>
    ),
    source: 'Código-fonte do motor',
  },
  en: {
    title: 'Geohash Encode / Decode',
    intro: (
      <>
        Encode latitude/longitude into a short string (<Text strong>geohash</Text>)
        or decode a string back into an Earth cell, with its surrounding
        neighbors. The longer the string, the smaller the cell — and common
        prefixes mean close cells. 100% in the browser, nothing leaves it.
      </>
    ),
    mode: 'Mode',
    modeEncode: 'Encode',
    modeDecode: 'Decode',
    modeRef: 'Quick reference',
    lat: 'Latitude',
    lon: 'Longitude',
    precision: 'Precision (characters)',
    precisionHint: 'Each extra character subdivides the cell further: more characters = smaller, more precise cell.',
    cityPresets: 'Sample cities',
    encodeResult: 'Generated geohash',
    copy: 'Copy',
    copied: 'Copied',
    outOfRange: 'Latitude must be between -90 and 90 and longitude between -180 and 180.',
    decodedCell: 'Decoded cell',
    decodedCellHint: 'A geohash encodes a whole rectangle, not a point — the center is just a visual reference.',
    box: 'Bounding box',
    center: 'Center',
    cellSize: 'Cell size',
    cellDegrees: 'In degrees',
    cellMeters: 'Roughly (at the cell center)',
    anywhereInBox: 'Any point inside this box yields the same geohash (or shares its prefix for longer versions).',
    neighbors: 'Neighbor cells (8)',
    neighborsHint: 'Handy for “around me” indexing: once you have a point, the 8 neighbors cover the surroundings.',
    mapTitle: 'Cell and neighbors (3×3 grid)',
    decodeInput: 'Geohash string',
    decodePlaceholder: 'e.g. 6gyf4bf (São Paulo)',
    decodeSamples: 'Examples',
    errEmpty: 'Type a geohash string (e.g. 6gyf4bf).',
    errLength: 'String too short or too long. Use between 1 and 24 characters.',
    errInvalid: 'Invalid character. Base32 alphabet: 0123456789bcdefghjkmnpqrstuvwxyz (no a, i, l or o).',
    direction: 'Direction',
    geohash: 'Geohash',
    referenceTitle: 'Cell size by precision',
    refEquatorNote: 'Approximate sizes at the equator (~111 km per degree). Longitude width shrinks with the cosine of the latitude (e.g. halved at latitude 60°).',
    refPrecision: 'Precision',
    refBits: 'Lon / lat bits',
    refDegrees: 'Degrees (lon × lat)',
    refSize: 'Size (lon × lat)',
    cellsTableHint: '4 chars ≈ a city; 6 ≈ a block; 7 ≈ a street; 9 ≈ a house.',
    howItWorksTitle: 'How it works',
    howItWorks: (
      <>
        A geohash is a base32 string that encodes a cell on a hierarchical
        world grid. The world is cut in half first on longitude, then on
        latitude, and so on — each bit refines one half and each character is
        worth 5 bits. Cells sharing a prefix are neighbors or nearby:{' '}
        <Text code>9q8yyk</Text> and <Text code>9q8yyj</Text> share{' '}
        <Text code>9q8yy</Text>, so they are adjacent. To find the neighbors of
        a cell you just shift its center by the cell width and height and
        re-encode at the same level (which the button above already does for
        you).
      </>
    ),
    source: 'Engine source code',
  },
}

function CellMap({ grid, t }) {
  return useMemo(() => {
    const centerBox = grid.center.box
    const stepW = centerBox.widthDeg
    const stepH = centerBox.heightDeg
    // Domínio da vista: engloba as 9 células do grid (ignora as que não
    // existem, na borda dos polos).
    let latMin = Infinity
    let latMax = -Infinity
    let lonMin = Infinity
    let lonMax = -Infinity
    const cells = []
    grid.rows.forEach((row) =>
      row.forEach((cell) => {
        if (!cell.box) return
        cells.push(cell)
        latMin = Math.min(latMin, cell.box.lat[0])
        latMax = Math.max(latMax, cell.box.lat[1])
        lonMin = Math.min(lonMin, cell.box.lon[0])
        lonMax = Math.max(lonMax, cell.box.lon[1])
      })
    )

    const px = (lon) => ((lon - lonMin) / (lonMax - lonMin)) * MAP_W
    const py = (lat) => ((latMax - lat) / (latMax - latMin)) * MAP_H

    const vLines = []
    for (let lon = lonMin; lon <= lonMax + stepW * 0.001; lon += stepW) {
      vLines.push(px(lon))
    }
    const hLines = []
    for (let lat = latMin; lat <= latMax + stepH * 0.001; lat += stepH) {
      hLines.push(py(lat))
    }

    const dirLabel = (cell) => {
      if (cell.dir === 'center') return null
      const map = { n: 'N', s: 'S', e: 'E', w: 'W', ne: 'NE', nw: 'NW', se: 'SE', sw: 'SW' }
      return map[cell.dir]
    }

    return (
      <div>
        <svg
          viewBox={`0 0 ${MAP_W} ${MAP_H}`}
          style={{ width: '100%', maxWidth: MAP_W + 40, display: 'block', margin: '0 auto' }}
          role="img"
          aria-label={t.mapTitle}
        >
          <rect x="0" y="0" width={MAP_W} height={MAP_H} fill="#f5f7fa" rx="8" />
          {hLines.map((y, i) => (
            <line key={`h-${i}`} x1="0" y1={y} x2={MAP_W} y2={y} stroke="#dbe3ee" strokeWidth="1" />
          ))}
          {vLines.map((x, i) => (
            <line key={`v-${i}`} x1={x} y1="0" x2={x} y2={MAP_H} stroke="#dbe3ee" strokeWidth="1" />
          ))}

          {cells.map((cell, i) => {
            const b = cell.box
            const x = px(b.lon[0])
            const y = py(b.lat[1])
            const w = px(b.lon[1]) - x
            const h = py(b.lat[0]) - y
            const isCenter = cell.dir === 'center'
            return (
              <g key={`${cell.dir}-${i}`}>
                <rect
                  x={x}
                  y={y}
                  width={w}
                  height={h}
                  fill={isCenter ? '#fff1f0' : '#ffffff'}
                  stroke={isCenter ? '#f5222d' : '#c9d1dc'}
                  strokeWidth={isCenter ? 2 : 1}
                />
                {isCenter ? (
                  <text
                    x={x + w / 2}
                    y={y + h / 2}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={13}
                    fontFamily="monospace"
                    fontWeight={700}
                    fill="#cf1322"
                  >
                    {grid.center.hash}
                  </text>
                ) : (
                  <text
                    x={x + w / 2}
                    y={y + h / 2}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={12}
                    fill="#8c8c8c"
                  >
                    {dirLabel(cell)}
                  </text>
                )}
              </g>
            )
          })}

          {/* Marcador do ponto central (modo Codificar usa o centro da célula) */}
          <circle
            cx={px(centerBox.centerLon)}
            cy={py(centerBox.centerLat)}
            r="5"
            fill="#52c41a"
            stroke="#fff"
            strokeWidth="1.5"
          />

          {/* Rótulos de coordenadas nas bordas */}
          <text x={8} y={14} fontSize="11" fill="#8c8c8c">
            lat {fmtDeg(latMax)}
          </text>
          <text x={8} y={MAP_H - 8} fontSize="11" fill="#8c8c8c">
            lat {fmtDeg(latMin)}
          </text>
          <text x={MAP_W - 8} y={14} fontSize="11" fill="#8c8c8c" textAnchor="end">
            lon {fmtDeg(lonMax)}
          </text>
          <text x={MAP_W - 8} y={MAP_H - 8} fontSize="11" fill="#8c8c8c" textAnchor="end">
            lon {fmtDeg(lonMin)}
          </text>
        </svg>
      </div>
    )
  }, [grid, t])
}

export default function GeohashToolPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const dirLabels = DIR_LABELS[lang]

  const [mode, setMode] = useState('encode')

  // ---------- encode ----------
  const [lat, setLat] = useState(-23.5505)
  const [lon, setLon] = useState(-46.6333)
  const [precision, setPrecision] = useState(7)

  const coordsValid = useMemo(
    () => Number.isFinite(lat) && Number.isFinite(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180,
    [lat, lon]
  )

  const encoded = useMemo(() => (coordsValid ? encode(lat, lon, precision) : null), [coordsValid, lat, lon, precision])
  const encodedGrid = useMemo(() => (encoded ? cellGrid(encoded) : null), [encoded])
  const encodedCell = useMemo(() => (encodedGrid ? encodedGrid.center.box : null), [encodedGrid])

  // ---------- decode ----------
  const [decodeInput, setDecodeInput] = useState('6gyf4bf')

  const decoded = useMemo(() => {
    const raw = cleanInput(decodeInput)
    if (!raw) return { status: 'empty' }
    if (raw.length > 24) return { status: 'length' }
    for (const c of raw) {
      if (!isBase32Character(c)) return { status: 'invalid', char: c }
    }
    return decode(raw)
  }, [decodeInput])

  const decodeGrid = useMemo(
    () => (decoded && decoded.ok ? cellGrid(decoded.hash) : null),
    [decoded]
  )

  const decodedMetrics = useMemo(
    () => (decoded && decoded.ok ? { box: decoded, meters: cellMeters(decoded) } : null),
    [decoded]
  )

  function applyCity(city) {
    setLat(city.lat)
    setLon(city.lon)
  }

  function copy(text) {
    navigator.clipboard.writeText(text)
    message.success(t.copied)
  }

  const neighborsColumns = [
    {
      title: t.direction,
      dataIndex: 'dir',
      width: 120,
      render: (v) => <Text strong>{dirLabels[v]}</Text>,
    },
    {
      title: t.geohash,
      dataIndex: 'hash',
      render: (v) => (
        <Space size={8}>
          <Text code>{v}</Text>
          <Button size="small" type="text" icon={<CopyOutlined />} onClick={() => copy(v)} />
        </Space>
      ),
    },
  ]

  const refColumns = [
    {
      title: t.refPrecision,
      dataIndex: 'precision',
      width: 90,
      render: (v) => <Text strong>P{v}</Text>,
    },
    {
      title: t.refBits,
      dataIndex: 'bits',
      width: 110,
      render: (v) => <Text code style={{ fontSize: 12 }}>{v}</Text>,
    },
    {
      title: t.refDegrees,
      dataIndex: 'degrees',
      render: (v) => <Text style={{ fontFamily: 'monospace' }}>{v}</Text>,
    },
    {
      title: t.refSize,
      dataIndex: 'size',
      render: (v) => <Text style={{ fontFamily: 'monospace' }}>{v}</Text>,
    },
  ]

  const refData = PRECISION_TABLE.map((r) => ({
    key: r.precision,
    precision: r.precision,
    bits: `${r.lonBits} / ${r.latBits}`,
    degrees: `${fmtDeg(r.widthDeg)}° × ${fmtDeg(r.heightDeg)}°`,
    size: r.size,
  }))

  const errText = (st) => {
    if (st.status === 'empty') return t.errEmpty
    if (st.status === 'length') return t.errLength
    return `${t.errInvalid} (${st.char})`
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}>
        <EnvironmentOutlined /> {t.title}
      </Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card title={t.mode}>
        <Segmented
          block
          value={mode}
          onChange={setMode}
          options={[
            { label: t.modeEncode, value: 'encode' },
            { label: t.modeDecode, value: 'decode' },
            { label: t.modeRef, value: 'ref' },
          ]}
        />
      </Card>

      {mode === 'encode' && (
        <>
          <Card
            title={<><SwapOutlined /> {t.modeEncode}</>}
            extra={
              <Text type="secondary" style={{ fontSize: 12 }}>
                {lat.toFixed(4)}, {lon.toFixed(4)} → P{precision}
              </Text>
            }
          >
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={8}>
                  <Text strong style={{ fontSize: 12 }}>{t.lat}</Text>
                  <InputNumber
                    value={lat}
                    onChange={(v) => setLat(v)}
                    style={{ width: '100%' }}
                    step={0.01}
                  />
                </Col>
                <Col xs={24} sm={8}>
                  <Text strong style={{ fontSize: 12 }}>{t.lon}</Text>
                  <InputNumber
                    value={lon}
                    onChange={(v) => setLon(v)}
                    style={{ width: '100%' }}
                    step={0.01}
                  />
                </Col>
                <Col xs={24} sm={8}>
                  <Text strong style={{ fontSize: 12 }}>{t.precision}</Text>
                  <Select value={precision} onChange={setPrecision} style={{ width: '100%' }}>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((p) => (
                      <Option key={p} value={p}>P{p}</Option>
                    ))}
                  </Select>
                </Col>
              </Row>
              <Text type="secondary" style={{ fontSize: 12 }}>{t.precisionHint}</Text>

              <Select allowClear placeholder={t.cityPresets} style={{ width: '100%' }} onChange={(name) => applyCity(CITY_PRESETS.find((c) => c.name === name))}>
                {CITY_PRESETS.map((c) => (
                  <Option key={c.name} value={c.name}>{c.name}</Option>
                ))}
              </Select>

              {!coordsValid ? (
                <Alert type="error" showIcon message={t.outOfRange} />
              ) : (
                <>
                  <Descriptions column={1} bordered size="small">
                    <Descriptions.Item label={t.encodeResult}>
                      <Space size={8}>
                        <Text code strong style={{ fontSize: 18 }}>
                          {encoded}
                        </Text>
                        <Button size="small" icon={<CopyOutlined />} onClick={() => copy(encoded)}>
                          {t.copy}
                        </Button>
                      </Space>
                    </Descriptions.Item>
                  </Descriptions>

                  <Card size="small" title={t.decodedCell}>
                    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>{t.decodedCellHint}</Text>
                      <Row gutter={[16, 16]}>
                        <Col xs={24} sm={8}>
                          <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>{t.cellSize}</Text>
                          <Text strong style={{ fontSize: 14 }}>
                            {humanDistance(encodedCell && cellMeters(encodedCell).lonM)} × {humanDistance(encodedCell && cellMeters(encodedCell).latM)}
                          </Text>
                        </Col>
                        <Col xs={24} sm={8}>
                          <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>{t.center}</Text>
                          <Text code style={{ fontSize: 13 }}>
                            {fmtCoord(encodedCell.centerLat, 6)}, {fmtCoord(encodedCell.centerLon, 6)}
                          </Text>
                        </Col>
                        <Col xs={24} sm={8}>
                          <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>{t.cellSize} ({t.cellDegrees})</Text>
                          <Text style={{ fontFamily: 'monospace', fontSize: 13 }}>
                            {fmtDeg(encodedCell.widthDeg)}° × {fmtDeg(encodedCell.heightDeg)}°
                          </Text>
                        </Col>
                      </Row>
                    </Space>
                  </Card>

                  <Card size="small" title={t.mapTitle}>
                    <CellMap grid={encodedGrid} t={t} />
                  </Card>

                  <Card size="small" title={t.neighbors} extra={<Text type="secondary" style={{ fontSize: 12 }}>{t.neighborsHint}</Text>}>
                    <Space size={[8, 8]} wrap>
                      {neighborListFromGrid(encodedGrid).map((n) => (
                        <Tag
                          key={n.dir}
                          style={{ cursor: 'pointer' }}
                          onClick={() => copy(n.hash)}
                        >
                          {dirLabels[n.dir]}: <Text code>{n.hash}</Text>
                        </Tag>
                      ))}
                    </Space>
                  </Card>
                </>
              )}
            </Space>
          </Card>
        </>
      )}

      {mode === 'decode' && (
        <>
          <Card title={<><GlobalOutlined /> {t.modeDecode}</>}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Input
                value={decodeInput}
                onChange={(e) => setDecodeInput(e.target.value)}
                placeholder={t.decodePlaceholder}
                style={{ fontFamily: 'monospace' }}
              />
              <Space wrap>
                <Text type="secondary">{t.decodeSamples}</Text>
                {CITY_PRESETS.slice(0, 6).map((c) => (
                  <Button key={c.name} size="small" onClick={() => setDecodeInput(encode(c.lat, c.lon, 7))}>
                    <Text code>{encode(c.lat, c.lon, 7)}</Text>
                  </Button>
                ))}
              </Space>
            </Space>
          </Card>

          {!decoded.ok ? (
            <Alert type="error" showIcon message={errText(decoded)} />
          ) : (
            <>
              <Card size="small" title={t.decodedCell} extra={<Tag color="green">P{decoded.precision}</Tag>}>
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>{t.decodedCellHint}</Text>
                  <Descriptions column={1} bordered size="small">
                    <Descriptions.Item label={t.box}>
                      <Text code>
                        lat [{fmtDeg(decoded.lat[0])}, {fmtDeg(decoded.lat[1])}] · lon [{fmtDeg(decoded.lon[0])}, {fmtDeg(decoded.lon[1])}]
                      </Text>
                    </Descriptions.Item>
                    <Descriptions.Item label={t.center}>
                      <Text code>{fmtCoord(decoded.centerLat, 6)}, {fmtCoord(decoded.centerLon, 6)}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label={t.cellSize}>
                      {humanDistance(decodedMetrics.meters.lonM)} × {humanDistance(decodedMetrics.meters.latM)}{' '}
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        ({fmtDeg(decoded.widthDeg)}° × {fmtDeg(decoded.heightDeg)}°)
                      </Text>
                    </Descriptions.Item>
                  </Descriptions>
                  <Text type="secondary" style={{ fontSize: 12 }}>{t.anywhereInBox}</Text>
                </Space>
              </Card>

              <Card size="small" title={t.mapTitle}>
                <CellMap grid={decodeGrid} t={t} />
              </Card>

              <Card size="small" title={t.neighbors} extra={<Text type="secondary" style={{ fontSize: 12 }}>{t.neighborsHint}</Text>}>
                <Table
                  size="small"
                  columns={neighborsColumns}
                  dataSource={neighborListFromGrid(decodeGrid)}
                  pagination={false}
                />
              </Card>
            </>
          )}
        </>
      )}

      {mode === 'ref' && (
        <Card title={t.referenceTitle}>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Paragraph type="secondary">{t.refEquatorNote}</Paragraph>
            <Table size="small" columns={refColumns} dataSource={refData} pagination={false} scroll={{ x: 520 }} />
            <Paragraph type="secondary">{t.cellsTableHint}</Paragraph>
          </Space>
        </Card>
      )}

      <Alert type="info" showIcon message={t.howItWorksTitle} description={t.howItWorks} />

      <Collapse>
        <Panel header={t.source} key="source">
          <pre style={{ margin: 0, overflow: 'auto' }}>
            <code>{getEngineSource()}</code>
          </pre>
        </Panel>
      </Collapse>
    </Space>
  )
}

// Extrai a lista plana de vizinhos (com correção para a fonte de dados).
function neighborListFromGrid(grid) {
  const dirs = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw']
  const out = []
  grid.rows.forEach((row) =>
    row.forEach((cell) => {
      if (cell.dir !== 'center' && cell.box && dirs.includes(cell.dir)) out.push(cell)
    })
  )
  return out
}