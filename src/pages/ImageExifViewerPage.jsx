import React, { useCallback, useMemo, useRef, useState } from 'react'
import {
  Typography,
  Card,
  Space,
  Upload,
  Button,
  Row,
  Col,
  Tag,
  Alert,
  Collapse,
  Descriptions,
  Statistic,
  Empty,
  message,
} from 'antd'
import {
  FileImageOutlined,
  InboxOutlined,
  DownloadOutlined,
  GlobalOutlined,
  ClockCircleOutlined,
  CameraOutlined,
  ColumnHeightOutlined,
  InfoCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import { parseExif, exifToFlat } from '../utils/exifParser'

const { Title, Paragraph, Text } = Typography
const { Dragger } = Upload
const { Panel } = Collapse

const ACCEPT_MIME = ['image/jpeg', 'image/jpg']
const MAX_FILE_BYTES = 50 * 1024 * 1024

// Rótulos dos campos EXIF para mostrar em PT/EN. Mantém a mesma key que
// o parser emite, pra casar direto com entries.
const FIELD_LABELS = {
  pt: {
    camera: 'Câmera',
    exposure: 'Exposição',
    dimensions: 'Dimensões',
    datetime: 'Data e hora',
    gps: 'Localização (GPS)',
    other: 'Outros',
    // keys
    make: 'Fabricante',
    model: 'Modelo',
    software: 'Software',
    ownerName: 'Proprietário',
    bodySerialNumber: 'Nº de série do corpo',
    lensMake: 'Fabricante da lente',
    lensModel: 'Modelo da lente',
    lensSerialNumber: 'Nº de série da lente',
    exposureTime: 'Tempo de exposição',
    fNumber: 'Abertura',
    iso: 'Sensibilidade ISO',
    exifVersion: 'Versão EXIF',
    shutterSpeed: 'Velocidade do obturador (APEX)',
    aperture: 'Abertura (APEX)',
    brightness: 'Brilho (APEX)',
    exposureBias: 'Compensação de exposição',
    maxAperture: 'Abertura máxima',
    meteringMode: 'Modo de medição',
    flash: 'Flash',
    focalLength: 'Distância focal',
    focalLengthIn35mm: 'Equivalente 35mm',
    lensSpec: 'Especificação da lente',
    imageWidth: 'Largura (IFD0)',
    imageHeight: 'Altura (IFD0)',
    pixelXDimension: 'Largura em pixels',
    pixelYDimension: 'Altura em pixels',
    orientation: 'Orientação',
    modifyDate: 'Data de modificação',
    dateTimeOriginal: 'Data original',
    dateTimeDigitized: 'Data de digitalização',
    gpsVersionId: 'Versão do GPS IFD',
    gpsLatitudeRef: 'Ref. latitude',
    gpsLatitude: 'Latitude',
    gpsLongitudeRef: 'Ref. longitude',
    gpsLongitude: 'Longitude',
    gpsAltitudeRef: 'Ref. altitude',
    gpsAltitude: 'Altitude',
    gpsTimeStamp: 'Horário GPS (UTC)',
    gpsDateStamp: 'Data GPS',
    gpsStatus: 'Status do GPS',
    userComment: 'Comentário',
    imageUniqueId: 'ID único da imagem',
    colorSpace: 'Espaço de cor',
  },
  en: {
    camera: 'Camera',
    exposure: 'Exposure',
    dimensions: 'Dimensions',
    datetime: 'Date & time',
    gps: 'Location (GPS)',
    other: 'Other',
    make: 'Make',
    model: 'Model',
    software: 'Software',
    ownerName: 'Owner',
    bodySerialNumber: 'Body serial number',
    lensMake: 'Lens make',
    lensModel: 'Lens model',
    lensSerialNumber: 'Lens serial number',
    exposureTime: 'Exposure time',
    fNumber: 'Aperture',
    iso: 'ISO speed',
    exifVersion: 'EXIF version',
    shutterSpeed: 'Shutter speed (APEX)',
    aperture: 'Aperture (APEX)',
    brightness: 'Brightness (APEX)',
    exposureBias: 'Exposure bias',
    maxAperture: 'Max aperture',
    meteringMode: 'Metering mode',
    flash: 'Flash',
    focalLength: 'Focal length',
    focalLengthIn35mm: '35mm equivalent',
    lensSpec: 'Lens spec',
    imageWidth: 'Width (IFD0)',
    imageHeight: 'Height (IFD0)',
    pixelXDimension: 'Pixel width',
    pixelYDimension: 'Pixel height',
    orientation: 'Orientation',
    modifyDate: 'Modify date',
    dateTimeOriginal: 'Date taken',
    dateTimeDigitized: 'Date digitized',
    gpsVersionId: 'GPS IFD version',
    gpsLatitudeRef: 'Latitude ref',
    gpsLatitude: 'Latitude',
    gpsLongitudeRef: 'Longitude ref',
    gpsLongitude: 'Longitude',
    gpsAltitudeRef: 'Altitude ref',
    gpsAltitude: 'Altitude',
    gpsTimeStamp: 'GPS time (UTC)',
    gpsDateStamp: 'GPS date',
    gpsStatus: 'GPS status',
    userComment: 'Comment',
    imageUniqueId: 'Image unique ID',
    colorSpace: 'Color space',
  },
}

const GROUP_ICONS = {
  camera: <CameraOutlined />,
  exposure: <InfoCircleOutlined />,
  dimensions: <ColumnHeightOutlined />,
  datetime: <ClockCircleOutlined />,
  gps: <GlobalOutlined />,
  other: <InfoCircleOutlined />,
}

const translations = {
  pt: {
    title: 'Visualizador de EXIF / Metadados de Imagem',
    intro: (
      <>
        Cole um arquivo JPEG e veja todos os metadados EXIF decodificados na hora —
        câmera, lente, exposição (tempo, abertura, ISO, flash), dimensões, data,
        espaço de cor, proprietário e, quando houver, <Text strong>coordenadas GPS</Text> com
        link direto pro mapa. Tudo roda no navegador: o arquivo não sai do seu
        dispositivo. Suporta JPEG com EXIF nos dois byte orders (Intel
        <Text code>II</Text> e Motorola <Text code>MM</Text>); PNG/WebP/GIF não têm EXIF —
        aparece uma mensagem explicando.
      </>
    ),
    dropTitle: 'Arraste um JPEG ou clique para escolher',
    dropHint: 'JPEG com EXIF, até 50 MB',
    onlyBrowser: 'Nenhum byte sai do seu navegador — leitura e parsing 100% locais.',
    onlyJpeg: 'Apenas JPEG tem EXIF. PNG, WebP, GIF e outros formatos não têm o bloco APP1/Exif.',
    tooBig: (mb) => `Arquivo maior que ${mb} MB.`,
    loadError: 'Não consegui ler esse arquivo como JPEG.',
    fileLoaded: (name) => `Arquivo carregado: ${name}`,
    changeFile: 'Trocar arquivo',
    summary: 'Resumo',
    fieldsFound: 'Campos',
    bytesFound: 'Bytes EXIF',
    groupsFound: 'Grupos',
    hasGps: 'Possui GPS',
    yesNo: (b) => (b ? 'Sim' : 'Não'),
    groupsTitle: 'Metadados por seção',
    noData: 'Nenhum EXIF encontrado nesse arquivo.',
    noDataHint: 'O JPEG existe mas não tem bloco APP1/Exif — pode ter sido re-salvo por uma ferramenta que remove metadados (WhatsApp faz isso).',
    flatTitle: 'JSON completo',
    downloadJson: 'Baixar JSON',
    copyJson: 'Copiar JSON',
    openInMaps: 'Abrir no mapa',
    privacy: 'Privacidade',
    privacyText: (
      <>
        A leitura do EXIF acontece via <Text code>FileReader</Text> e{' '}
        <Text code>ArrayBuffer</Text> no navegador — nenhuma requisição de rede sai
        daqui. O arquivo <Text strong>não é enviado</Text> pra lugar nenhum. Boa
        prática: antes de postar uma foto online, rode ela aqui e veja se{' '}
        <Text code>GPS</Text> ou <Text code>DateTimeOriginal</Text> estão presentes (e
        remova-os se for o caso).
      </>
    ),
    sourceTitle: 'O que o parser cobre',
    sourceText: (
      <>
        IFD0 + subIFDs <Text code>Exif</Text>, <Text code>GPS</Text> e{' '}
        <Text code>Interoperability</Text>. Tipos EXIF 2.3: BYTE, ASCII, SHORT, LONG,
        RATIONAL, SLONG, SRATIONAL, UNDEFINED. Decodifica user comment com prefixo
        de character code (ASCII/UNICODE), GPS em DMS + decimal, exposição em fração
        de segundos (1/250s) e abertura em f/N. Não tenta ler MakerNote (vendor
        específico, fora de escopo). Tolerante a writers que gravam data de 4 bytes
        como offset em vez de inline.
      </>
    ),
  },
  en: {
    title: 'EXIF / Image Metadata Viewer',
    intro: (
      <>
        Drop a JPEG file and see every EXIF tag decoded in real time — camera and
        lens, exposure (shutter, aperture, ISO, flash), dimensions, date, color
        space, owner and, when present, <Text strong>GPS coordinates</Text> with a
        direct map link. Everything runs in the browser: the file never leaves your
        device. Supports JPEG with EXIF in either byte order (Intel{' '}
        <Text code>II</Text> and Motorola <Text code>MM</Text>); PNG/WebP/GIF have no
        EXIF — a friendly message explains that.
      </>
    ),
    dropTitle: 'Drop a JPEG or click to choose',
    dropHint: 'JPEG with EXIF, up to 50 MB',
    onlyBrowser: 'No byte leaves your browser — reading and parsing are 100% local.',
    onlyJpeg: 'Only JPEG has EXIF. PNG, WebP, GIF and other formats do not have an APP1/Exif segment.',
    tooBig: (mb) => `File larger than ${mb} MB.`,
    loadError: 'Could not read that file as JPEG.',
    fileLoaded: (name) => `Loaded: ${name}`,
    changeFile: 'Change file',
    summary: 'Summary',
    fieldsFound: 'Fields',
    bytesFound: 'EXIF bytes',
    groupsFound: 'Groups',
    hasGps: 'Has GPS',
    yesNo: (b) => (b ? 'Yes' : 'No'),
    groupsTitle: 'Metadata by section',
    noData: 'No EXIF found in this file.',
    noDataHint: 'The JPEG exists but has no APP1/Exif block — it may have been re-saved by a tool that strips metadata (WhatsApp does that).',
    flatTitle: 'Full JSON',
    downloadJson: 'Download JSON',
    copyJson: 'Copy JSON',
    openInMaps: 'Open in map',
    privacy: 'Privacy',
    privacyText: (
      <>
        EXIF is read via <Text code>FileReader</Text> and <Text code>ArrayBuffer</Text>{' '}
        in the browser — no network request is made. The file <Text strong>never leaves</Text>{' '}
        your device. Good practice: before posting a photo online, run it through this
        page and check whether <Text code>GPS</Text> or <Text code>DateTimeOriginal</Text> are
        present (and strip them if needed).
      </>
    ),
    sourceTitle: 'What the parser covers',
    sourceText: (
      <>
        IFD0 + subIFDs <Text code>Exif</Text>, <Text code>GPS</Text> and{' '}
        <Text code>Interoperability</Text>. EXIF 2.3 types: BYTE, ASCII, SHORT, LONG,
        RATIONAL, SLONG, SRATIONAL, UNDEFINED. Decodes user comment with character
        code prefix (ASCII/UNICODE), GPS in DMS + decimal, exposure as a fraction of
        a second (1/250s) and aperture as f/N. Skips MakerNote (vendor-specific, out
        of scope). Tolerates writers that store small values as offset instead of
        inline.
      </>
    ),
  },
}

function makeMapUrl(lat, lon) {
  // OpenStreetMap é o mapa neutro que não exige chave de API e não telemetra.
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=15/${lat}/${lon}`
}

export default function ImageExifViewerPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const labels = FIELD_LABELS[lang]

  const [fileMeta, setFileMeta] = useState(null) // { name, size, type, dataUrl }
  const [exifResult, setExifResult] = useState(null) // { ok, error?, groups, totalFields, totalEntries }
  const [parseErrorMsg, setParseErrorMsg] = useState(null)

  // useRef em vez de useState pra evitar re-render quando o mesmo arquivo
  // for selecionado duas vezes seguidas (input change nem dispara, mas drag
  // de arquivo idêntico cairia no else se não fizéssemos nada).
  const beforeUpload = useCallback((file) => {
    if (!ACCEPT_MIME.includes(file.type) && !file.name.toLowerCase().endsWith('.jpg') && !file.name.toLowerCase().endsWith('.jpeg')) {
      message.warning(t.onlyJpeg)
      return Upload.LIST_IGNORE
    }
    if (file.size > MAX_FILE_BYTES) {
      message.warning(t.tooBig(50))
      return Upload.LIST_IGNORE
    }
    void processFile(file)
    return Upload.LIST_IGNORE // nunca deixa o Upload despachar via fetch
  }, [lang])

  const processFile = useCallback((file) => {
    setParseErrorMsg(null)
    const reader = new FileReader()
    reader.onload = () => {
      const ab = reader.result
      const buf = new Uint8Array(ab)
      // Sanidade mínima: JPEG começa com FF D8 FF. Aceita o arquivo, mas
      // loga aviso se não bater — alguns JPEGs têm preâmbulo.
      if (buf.length < 12 || buf[0] !== 0xff || buf[1] !== 0xd8) {
        setParseErrorMsg(t.loadError)
        setFileMeta({ name: file.name, size: file.size, type: file.type, dataUrl: null })
        setExifResult(null)
        return
      }
      const result = parseExif(ab)
      // Cria data URL só pra preview; pra JPEG é barato.
      const dataUrl = `data:${file.type || 'image/jpeg'};base64,${arrayBufferToBase64(ab)}`
      setFileMeta({ name: file.name, size: file.size, type: file.type, dataUrl })
      setExifResult(result)
    }
    reader.onerror = () => {
      setParseErrorMsg(t.loadError)
    }
    reader.readAsArrayBuffer(file)
  }, [lang])

  // Reset: limpa arquivo + resultado.
  const handleReset = useCallback(() => {
    setFileMeta(null)
    setExifResult(null)
    setParseErrorMsg(null)
  }, [])

  // Serializa o EXIF em JSON pra download/copy.
  const flatJson = useMemo(() => {
    if (!exifResult || !exifResult.ok) return ''
    return JSON.stringify(
      {
        file: fileMeta ? { name: fileMeta.name, size: fileMeta.size, type: fileMeta.type } : null,
        exif: exifResult.groups,
        stats: { totalFields: exifResult.totalFields, totalEntries: exifResult.totalEntries },
      },
      null,
      2,
    )
  }, [exifResult, fileMeta])

  const handleDownload = useCallback(() => {
    if (!flatJson) return
    const blob = new Blob([flatJson], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const base = fileMeta ? fileMeta.name.replace(/\.(jpe?g)$/i, '') : 'exif'
    a.download = `${base}.exif.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [flatJson, fileMeta])

  const handleCopy = useCallback(() => {
    if (!flatJson) return
    navigator.clipboard.writeText(flatJson).then(() => {
      message.success(lang === 'pt' ? 'JSON copiado!' : 'JSON copied!')
    })
  }, [flatJson, lang])

  // Construção do painel de grupos.
  const gpsCoord = useMemo(() => {
    if (!exifResult || !exifResult.ok) return null
    const lat = exifResult.groups.gps.find((e) => e.key === 'gpsLatitude')
    const lon = exifResult.groups.gps.find((e) => e.key === 'gpsLongitude')
    if (!lat || !lon || lat.decimal == null || lon.decimal == null) return null
    return { lat: lat.decimal, lon: lon.decimal }
  }, [exifResult])

  const groupOrder = ['camera', 'exposure', 'dimensions', 'datetime', 'gps', 'other']

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><FileImageOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card>
        <Dragger
          accept={ACCEPT_MIME.join(',')}
          beforeUpload={beforeUpload}
          showUploadList={false}
          multiple={false}
          maxCount={1}
        >
          <p className="ant-upload-drag-icon" style={{ marginBottom: 8 }}>
            <InboxOutlined style={{ fontSize: 48, color: '#1677ff' }} />
          </p>
          <p className="ant-upload-text" style={{ fontSize: 16, fontWeight: 600 }}>
            {t.dropTitle}
          </p>
          <p className="ant-upload-hint" style={{ color: '#8c8c8c' }}>{t.dropHint}</p>
        </Dragger>
        <Paragraph type="secondary" style={{ marginTop: 12, marginBottom: 0, fontSize: 12 }}>
          <Tag color="green" style={{ marginRight: 6 }}>100% local</Tag> {t.onlyBrowser}
        </Paragraph>
      </Card>

      {parseErrorMsg && (
        <Alert type="error" showIcon message={parseErrorMsg} />
      )}

      {fileMeta && exifResult && !parseErrorMsg && (
        <>
          <Card
            title={t.summary}
            extra={
              <Space>
                <Button icon={<ReloadOutlined />} onClick={handleReset}>{t.changeFile}</Button>
              </Space>
            }
          >
            <Paragraph type="secondary" style={{ marginTop: -4 }}>{t.fileLoaded(fileMeta.name)}</Paragraph>
            <Row gutter={[24, 16]}>
              <Col xs={12} sm={6}>
                <Statistic title={t.fieldsFound} value={exifResult.ok ? exifResult.totalFields : 0} />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic title={t.bytesFound} value={exifResult.ok ? exifResult.totalEntries : 0} />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic
                  title={t.groupsFound}
                  value={exifResult.ok ? groupOrder.filter((g) => exifResult.groups[g].length > 0).length : 0}
                />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic
                  title={t.hasGps}
                  value={t.yesNo(Boolean(gpsCoord))}
                  valueStyle={{ color: gpsCoord ? '#52c41a' : undefined }}
                />
              </Col>
            </Row>

            {gpsCoord && (
              <div style={{ marginTop: 16 }}>
                <Alert
                  type="info"
                  showIcon
                  message={
                    <Space>
                      <Text>
                        {labels.gpsLatitude}: {gpsCoord.lat.toFixed(6)}° &nbsp;
                        {labels.gpsLongitude}: {gpsCoord.lon.toFixed(6)}°
                      </Text>
                      <Button
                        size="small"
                        type="primary"
                        icon={<GlobalOutlined />}
                        href={makeMapUrl(gpsCoord.lat, gpsCoord.lon)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {t.openInMaps}
                      </Button>
                    </Space>
                  }
                />
              </div>
            )}
          </Card>

          <Card title={t.groupsTitle} extra={<Tag>{fileMeta.size.toLocaleString()} bytes</Tag>}>
            {!exifResult.ok ? (
              <Empty description={t.noData}>
                <Text type="secondary" style={{ fontSize: 13 }}>{t.noDataHint}</Text>
              </Empty>
            ) : (
              <Collapse
                defaultActiveKey={['camera', 'exposure', 'datetime', 'gps']}
                ghost
              >
                {groupOrder.map((gKey) => {
                  const entries = exifResult.groups[gKey]
                  if (!entries || entries.length === 0) return null
                  return (
                    <Panel
                      header={
                        <Space>
                          {GROUP_ICONS[gKey]}
                          <Text strong>{labels[gKey] || gKey}</Text>
                          <Tag>{entries.length}</Tag>
                        </Space>
                      }
                      key={gKey}
                    >
                      <Descriptions
                        size="small"
                        column={{ xs: 1, sm: 1, md: 2 }}
                        bordered
                        style={{ background: '#fafafa' }}
                      >
                        {entries.map((e) => (
                          <React.Fragment key={e.key}>
                            <Descriptions.Item
                              label={labels[e.key] || e.key}
                              style={{ verticalAlign: 'top' }}
                            >
                              <Text code style={{ wordBreak: 'break-word' }}>{e.value == null ? '—' : String(e.value)}</Text>
                            </Descriptions.Item>
                            <Descriptions.Item style={{ color: '#8c8c8c', fontSize: 12 }}>
                              <Text type="secondary" style={{ fontSize: 12 }}>{e.key}</Text>
                            </Descriptions.Item>
                          </React.Fragment>
                        ))}
                      </Descriptions>
                    </Panel>
                  )
                })}
              </Collapse>
            )}
          </Card>

          {exifResult.ok && exifResult.totalFields > 0 && (
            <Card
              title={t.flatTitle}
              extra={
                <Space>
                  <Button icon={<DownloadOutlined />} onClick={handleDownload}>{t.downloadJson}</Button>
                  <Button onClick={handleCopy}>{t.copyJson}</Button>
                </Space>
              }
            >
              <pre
                style={{
                  margin: 0,
                  background: '#fafafa',
                  padding: 12,
                  borderRadius: 6,
                  maxHeight: 360,
                  overflow: 'auto',
                  fontSize: 12,
                }}
              >
                <code>{flatJson}</code>
              </pre>
            </Card>
          )}
        </>
      )}

      <Card title={t.privacy}>
        <Paragraph type="secondary" style={{ marginBottom: 0 }}>{t.privacyText}</Paragraph>
      </Card>

      <Card title={t.sourceTitle}>
        <Paragraph type="secondary" style={{ marginBottom: 0 }}>{t.sourceText}</Paragraph>
      </Card>
    </Space>
  )
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.slice(i, i + chunk))
  }
  return btoa(binary)
}