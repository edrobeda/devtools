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
  message,
  Alert,
  Collapse,
} from 'antd'
import { EnvironmentOutlined, CopyOutlined, SwapOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  decimalToDms,
  dmsToDecimal,
  formatDms,
  validateDecimal,
  validateDms,
  PRESETS,
} from '../utils/geoCoordinatesConverter'

const { Title, Paragraph, Text } = Typography
const { Option } = Select
const { Panel } = Collapse

const sourceCode = `import {
  decimalToDms,
  dmsToDecimal,
  formatDms,
  validateDecimal,
  validateDms,
} from '../utils/geoCoordinatesConverter'

// Decimal → DMS
const dms = decimalToDms(-23.5505, 'lat')
// { degrees: 23, minutes: 33, seconds: 1.8, direction: 'S' }
formatDms(dms) // 23° 33' 01.80" S

// DMS → Decimal
const decimal = dmsToDecimal(23, 33, 1.8, 'S') // -23.5505

// Validação
validateDecimal(-23.5505, -46.6333) // { valid: true }
validateDms(23, 33, 1.8, 'S', 'lat') // { valid: true }
`

const translations = {
  pt: {
    title: 'Conversor de Coordenadas Geográficas',
    intro: (
      <>
        Converta coordenadas entre graus decimais e o formato DMS (Degrees,
        Minutes, Seconds). Útil para mapas, GPS, geolocalização e integrações
        com APIs de localização.
      </>
    ),
    decimalToDms: 'Decimal → DMS',
    dmsToDecimal: 'DMS → Decimal',
    latLabel: 'Latitude',
    lonLabel: 'Longitude',
    degrees: 'Graus',
    minutes: 'Minutos',
    seconds: 'Segundos',
    direction: 'Direção',
    convert: 'Converter',
    copy: 'Copiar',
    copied: 'Copiado',
    presets: 'Coordenadas de exemplo',
    result: 'Resultado',
    invalidLat: 'Latitude inválida',
    invalidLon: 'Longitude inválida',
    latOutOfRange: 'Latitude deve estar entre -90 e 90',
    lonOutOfRange: 'Longitude deve estar entre -180 e 180',
    invalidDirection: 'Direção inválida para este eixo',
    minutesOutOfRange: 'Minutos devem estar entre 0 e 59',
    secondsOutOfRange: 'Segundos devem estar entre 0 e 59',
    degreesOutOfRange: 'Graus fora do intervalo permitido',
    maxDegreeExceeded: 'Graus máximos não podem ter minutos/segundos',
    sourceCode: 'Código-fonte do motor',
    explanationTitle: 'O que é DMS?',
    explanation: (
      <>
        <Text strong>DMS</Text> significa <em>Degrees, Minutes, Seconds</em>{' '}
        (Graus, Minutos, Segundos). É uma forma tradicional de expressar
        coordenadas geográficas, onde cada grau é dividido em 60 minutos e cada
        minuto em 60 segundos. A direção (N/S para latitude, E/W para
        longitude) indica o hemisfério.
        <br /><br />
        Coordenadas decimais são mais comuns em APIs e bancos de dados, enquanto
        DMS é frequentemente usado em mapas cartográficos e dispositivos GPS.
      </>
    ),
  },
  en: {
    title: 'Geographic Coordinates Converter',
    intro: (
      <>
        Convert coordinates between decimal degrees and the DMS format (Degrees,
        Minutes, Seconds). Useful for maps, GPS, geolocation, and integrations
        with location APIs.
      </>
    ),
    decimalToDms: 'Decimal → DMS',
    dmsToDecimal: 'DMS → Decimal',
    latLabel: 'Latitude',
    lonLabel: 'Longitude',
    degrees: 'Degrees',
    minutes: 'Minutes',
    seconds: 'Seconds',
    direction: 'Direction',
    convert: 'Convert',
    copy: 'Copy',
    copied: 'Copied',
    presets: 'Sample coordinates',
    result: 'Result',
    invalidLat: 'Invalid latitude',
    invalidLon: 'Invalid longitude',
    latOutOfRange: 'Latitude must be between -90 and 90',
    lonOutOfRange: 'Longitude must be between -180 and 180',
    invalidDirection: 'Invalid direction for this axis',
    minutesOutOfRange: 'Minutes must be between 0 and 59',
    secondsOutOfRange: 'Seconds must be between 0 and 59',
    degreesOutOfRange: 'Degrees out of allowed range',
    maxDegreeExceeded: 'Maximum degrees cannot have minutes/seconds',
    sourceCode: 'Engine source code',
    explanationTitle: 'What is DMS?',
    explanation: (
      <>
        <Text strong>DMS</Text> stands for <em>Degrees, Minutes, Seconds</em>.
        It is a traditional way to express geographic coordinates, where each
        degree is divided into 60 minutes and each minute into 60 seconds. The
        direction (N/S for latitude, E/W for longitude) indicates the hemisphere.
        <br /><br />
        Decimal degrees are more common in APIs and databases, while DMS is
        frequently used in cartographic maps and GPS devices.
      </>
    ),
  },
}

export default function GeoCoordinatesConverterPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [lat, setLat] = useState(-23.5505)
  const [lon, setLon] = useState(-46.6333)

  const [latDeg, setLatDeg] = useState(23)
  const [latMin, setLatMin] = useState(33)
  const [latSec, setLatSec] = useState(1.8)
  const [latDir, setLatDir] = useState('S')

  const [lonDeg, setLonDeg] = useState(46)
  const [lonMin, setLonMin] = useState(37)
  const [lonSec, setLonSec] = useState(59.88)
  const [lonDir, setLonDir] = useState('W')

  const decimalValidation = useMemo(() => validateDecimal(lat, lon), [lat, lon])

  const dmsLatValidation = useMemo(
    () => validateDms(latDeg, latMin, latSec, latDir, 'lat'),
    [latDeg, latMin, latSec, latDir]
  )
  const dmsLonValidation = useMemo(
    () => validateDms(lonDeg, lonMin, lonSec, lonDir, 'lon'),
    [lonDeg, lonMin, lonSec, lonDir]
  )

  const latDms = useMemo(() => {
    if (!decimalValidation.valid) return null
    return decimalToDms(lat, 'lat')
  }, [lat, decimalValidation.valid])

  const lonDms = useMemo(() => {
    if (!decimalValidation.valid) return null
    return decimalToDms(lon, 'lon')
  }, [lon, decimalValidation.valid])

  const latDecimal = useMemo(() => {
    if (!dmsLatValidation.valid) return null
    return dmsToDecimal(latDeg, latMin, latSec, latDir)
  }, [latDeg, latMin, latSec, latDir, dmsLatValidation.valid])

  const lonDecimal = useMemo(() => {
    if (!dmsLonValidation.valid) return null
    return dmsToDecimal(lonDeg, lonMin, lonSec, lonDir)
  }, [lonDeg, lonMin, lonSec, lonDir, dmsLonValidation.valid])

  function copy(text) {
    navigator.clipboard.writeText(text)
    message.success(t.copied)
  }

  function errorText(errorKey) {
    return t[errorKey] || errorKey
  }

  function applyPreset(p) {
    setLat(p.lat)
    setLon(p.lon)
    const latD = decimalToDms(p.lat, 'lat')
    const lonD = decimalToDms(p.lon, 'lon')
    setLatDeg(latD.degrees)
    setLatMin(latD.minutes)
    setLatSec(latD.seconds)
    setLatDir(latD.direction)
    setLonDeg(lonD.degrees)
    setLonMin(lonD.minutes)
    setLonSec(lonD.seconds)
    setLonDir(lonD.direction)
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><EnvironmentOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title={<><SwapOutlined /> {t.decimalToDms}</>}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12}>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Text strong>{t.latLabel}</Text>
                    <InputNumber
                      value={lat}
                      onChange={(v) => setLat(v ?? 0)}
                      step={0.0001}
                      style={{ width: '100%' }}
                    />
                  </Space>
                </Col>
                <Col xs={24} sm={12}>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Text strong>{t.lonLabel}</Text>
                    <InputNumber
                      value={lon}
                      onChange={(v) => setLon(v ?? 0)}
                      step={0.0001}
                      style={{ width: '100%' }}
                    />
                  </Space>
                </Col>
              </Row>

              {!decimalValidation.valid && (
                <Alert
                  type="error"
                  showIcon
                  message={errorText(decimalValidation.error)}
                />
              )}

              {decimalValidation.valid && latDms && lonDms && (
                <Card size="small" title={t.result}>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Space>
                      <Text code style={{ fontSize: 16 }}>
                        {formatDms(latDms)}
                      </Text>
                      <Button
                        size="small"
                        icon={<CopyOutlined />}
                        onClick={() => copy(formatDms(latDms))}
                      >
                        {t.copy}
                      </Button>
                    </Space>
                    <Space>
                      <Text code style={{ fontSize: 16 }}>
                        {formatDms(lonDms)}
                      </Text>
                      <Button
                        size="small"
                        icon={<CopyOutlined />}
                        onClick={() => copy(formatDms(lonDms))}
                      >
                        {t.copy}
                      </Button>
                    </Space>
                  </Space>
                </Card>
              )}
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title={<><SwapOutlined rotate={90} /> {t.dmsToDecimal}</>}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12}>
                  <Text strong>{t.latLabel}</Text>
                  <Row gutter={[8, 8]} style={{ marginTop: 8 }}>
                    <Col span={8}>
                      <InputNumber
                        min={0}
                        max={90}
                        value={latDeg}
                        onChange={(v) => setLatDeg(v ?? 0)}
                        placeholder={t.degrees}
                        style={{ width: '100%' }}
                      />
                    </Col>
                    <Col span={8}>
                      <InputNumber
                        min={0}
                        max={59}
                        value={latMin}
                        onChange={(v) => setLatMin(v ?? 0)}
                        placeholder={t.minutes}
                        style={{ width: '100%' }}
                      />
                    </Col>
                    <Col span={8}>
                      <InputNumber
                        min={0}
                        max={59.9999}
                        step={0.01}
                        value={latSec}
                        onChange={(v) => setLatSec(v ?? 0)}
                        placeholder={t.seconds}
                        style={{ width: '100%' }}
                      />
                    </Col>
                  </Row>
                  <Select
                    value={latDir}
                    onChange={setLatDir}
                    style={{ width: '100%', marginTop: 8 }}
                  >
                    <Option value="N">N</Option>
                    <Option value="S">S</Option>
                  </Select>
                </Col>
                <Col xs={24} sm={12}>
                  <Text strong>{t.lonLabel}</Text>
                  <Row gutter={[8, 8]} style={{ marginTop: 8 }}>
                    <Col span={8}>
                      <InputNumber
                        min={0}
                        max={180}
                        value={lonDeg}
                        onChange={(v) => setLonDeg(v ?? 0)}
                        placeholder={t.degrees}
                        style={{ width: '100%' }}
                      />
                    </Col>
                    <Col span={8}>
                      <InputNumber
                        min={0}
                        max={59}
                        value={lonMin}
                        onChange={(v) => setLonMin(v ?? 0)}
                        placeholder={t.minutes}
                        style={{ width: '100%' }}
                      />
                    </Col>
                    <Col span={8}>
                      <InputNumber
                        min={0}
                        max={59.9999}
                        step={0.01}
                        value={lonSec}
                        onChange={(v) => setLonSec(v ?? 0)}
                        placeholder={t.seconds}
                        style={{ width: '100%' }}
                      />
                    </Col>
                  </Row>
                  <Select
                    value={lonDir}
                    onChange={setLonDir}
                    style={{ width: '100%', marginTop: 8 }}
                  >
                    <Option value="E">E</Option>
                    <Option value="W">W</Option>
                  </Select>
                </Col>
              </Row>

              {(!dmsLatValidation.valid || !dmsLonValidation.valid) && (
                <Alert
                  type="error"
                  showIcon
                  message={errorText(
                    dmsLatValidation.error || dmsLonValidation.error
                  )}
                />
              )}

              {dmsLatValidation.valid && dmsLonValidation.valid && latDecimal !== null && lonDecimal !== null && (
                <Card size="small" title={t.result}>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Space>
                      <Text code style={{ fontSize: 16 }}>
                        {latDecimal.toFixed(6)}
                      </Text>
                      <Button
                        size="small"
                        icon={<CopyOutlined />}
                        onClick={() => copy(latDecimal.toFixed(6))}
                      >
                        {t.copy}
                      </Button>
                    </Space>
                    <Space>
                      <Text code style={{ fontSize: 16 }}>
                        {lonDecimal.toFixed(6)}
                      </Text>
                      <Button
                        size="small"
                        icon={<CopyOutlined />}
                        onClick={() => copy(lonDecimal.toFixed(6))}
                      >
                        {t.copy}
                      </Button>
                    </Space>
                  </Space>
                </Card>
              )}
            </Space>
          </Card>
        </Col>
      </Row>

      <Card title={t.presets}>
        <Space size={[8, 8]} wrap>
          {PRESETS.map((p) => (
            <Button key={p.name} size="small" onClick={() => applyPreset(p)}>
              {p[lang] || p.name}
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
