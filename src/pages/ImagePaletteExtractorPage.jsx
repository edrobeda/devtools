import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Typography, Card, Space, Button, InputNumber, Switch, Segmented,
  Upload, message, Collapse, Alert, Spin, Tag, Row, Col,
} from 'antd'
import {
  PictureOutlined, CopyOutlined, UploadOutlined, BgColorsOutlined,
  ClearOutlined, FileImageOutlined, FormatPainterOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  extractPalette,
  createSampleImage,
  QUALITY_OPTIONS,
  rgbToHex,
} from '../utils/imagePaletteExtractor'

const { Title, Paragraph, Text } = Typography
const { Panel } = Collapse

const translations = {
  pt: {
    title: 'Extrator de Paleta de Cores',
    intro: 'Extraia as cores dominantes de qualquer imagem diretamente no navegador. A análise acontece em um canvas local — a imagem nunca sai do dispositivo.',
    upload: 'Carregar imagem',
    sampleGradient: 'Gradiente',
    sampleShapes: 'Formas',
    sampleLandscape: 'Paisagem',
    clear: 'Limpar',
    preview: 'Preview',
    noImage: 'Nenhuma imagem selecionada.',
    options: 'Opções',
    colorCount: 'Quantidade de cores',
    ignoreGrays: 'Ignorar tons de cinza',
    ignoreWB: 'Ignorar branco/preto',
    quality: 'Qualidade da análise',
    qualityLow: 'Rápida',
    qualityMedium: 'Equilibrada',
    qualityHigh: 'Precisa',
    loading: 'Analisando...',
    palette: 'Paleta dominante',
    percent: '% dos pixels',
    copy: 'Copiar',
    copied: 'Copiado',
    copyAll: 'Copiar tudo',
    exportAs: 'Exportar como',
    exportCss: 'CSS variables',
    exportJson: 'JSON',
    noPalette: 'Nenhuma cor encontrada com os filtros atuais.',
    tipTitle: 'Dica',
    tipBody: 'Use a qualidade "Rápida" para imagens grandes e "Precisa" quando quiser capturar nuances de cor. Filtros de branco/preto/cinza ajudam a ignorar fundos e focar na identidade visual.',
    sourceTitle: 'Código-fonte',
    sourceBody: 'O motor em src/utils/imagePaletteExtractor.js redimensiona a imagem para um canvas, lê os pixels com getImageData, agrupa cores similares em buckets de 5 bits e devolve as mais frequentes com porcentagem.',
  },
  en: {
    title: 'Image Palette Extractor',
    intro: 'Extract dominant colors from any image right in the browser. Analysis runs on a local canvas — the image never leaves the device.',
    upload: 'Upload image',
    sampleGradient: 'Gradient',
    sampleShapes: 'Shapes',
    sampleLandscape: 'Landscape',
    clear: 'Clear',
    preview: 'Preview',
    noImage: 'No image selected.',
    options: 'Options',
    colorCount: 'Color count',
    ignoreGrays: 'Ignore grays',
    ignoreWB: 'Ignore white/black',
    quality: 'Analysis quality',
    qualityLow: 'Fast',
    qualityMedium: 'Balanced',
    qualityHigh: 'Precise',
    loading: 'Analyzing...',
    palette: 'Dominant palette',
    percent: '% of pixels',
    copy: 'Copy',
    copied: 'Copied',
    copyAll: 'Copy all',
    exportAs: 'Export as',
    exportCss: 'CSS variables',
    exportJson: 'JSON',
    noPalette: 'No colors found with the current filters.',
    tipTitle: 'Tip',
    tipBody: 'Use "Fast" quality for large images and "Precise" to capture subtle color variations. White/black/gray filters help ignore backgrounds and focus on the brand identity.',
    sourceTitle: 'Source code',
    sourceBody: 'The engine in src/utils/imagePaletteExtractor.js resizes the image onto a canvas, reads pixels with getImageData, groups similar colors into 5-bit buckets and returns the most frequent ones with percentages.',
  },
}

const sourceCode = `// src/utils/imagePaletteExtractor.js
export async function extractPalette(source, options = {}) {
  const img = await loadImage(source)
  const dims = getAnalysisDimensions(img, options.maxDimension || 120)

  const canvas = document.createElement('canvas')
  canvas.width = dims.width
  canvas.height = dims.height
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  ctx.drawImage(img, 0, 0, dims.width, dims.height)

  const { data } = ctx.getImageData(0, 0, dims.width, dims.height)
  const buckets = new Map()
  let total = 0

  for (let i = 0; i < data.length; i += 4) {
    const [r, g, b, a] = [data[i], data[i + 1], data[i + 2], data[i + 3]]
    if (a < 128) continue
    if (options.ignoreNearWhiteBlack &&
        (isNearWhite(r, g, b) || isNearBlack(r, g, b))) continue
    if (options.ignoreGrays && isGray(r, g, b)) continue

    total += 1
    const key = [r >> 3, g >> 3, b >> 3].join(',')
    const bucket = buckets.get(key) || { r: 0, g: 0, b: 0, count: 0 }
    bucket.r += r; bucket.g += g; bucket.b += b; bucket.count += 1
    buckets.set(key, bucket)
  }

  return Array.from(buckets.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, options.colorCount || 8)
    .map((b) => ({
      r: Math.round(b.r / b.count),
      g: Math.round(b.g / b.count),
      b: Math.round(b.b / b.count),
      hex: rgbToHex(b.r / b.count, b.g / b.count, b.b / b.count),
      percent: b.count / total,
    }))
}`

export default function ImagePaletteExtractorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [source, setSource] = useState(createSampleImage('gradient'))
  const [fileName, setFileName] = useState('')
  const [colorCount, setColorCount] = useState(8)
  const [ignoreGrays, setIgnoreGrays] = useState(false)
  const [ignoreWB, setIgnoreWB] = useState(false)
  const [quality, setQuality] = useState('medium')
  const [palette, setPalette] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [exportMode, setExportMode] = useState('css')
  const cancelledRef = useRef(false)

  const maxDimension = useMemo(() => QUALITY_OPTIONS[quality] || 120, [quality])

  const runExtraction = useCallback(async () => {
    if (!source) {
      setPalette([])
      return
    }
    cancelledRef.current = false
    setLoading(true)
    setError('')
    try {
      const colors = await extractPalette(source, {
        colorCount,
        ignoreGrays,
        ignoreNearWhiteBlack: ignoreWB,
        maxDimension,
      })
      if (!cancelledRef.current) {
        setPalette(colors)
      }
    } catch (err) {
      if (!cancelledRef.current) {
        setError(err.message || String(err))
      }
    } finally {
      if (!cancelledRef.current) {
        setLoading(false)
      }
    }
  }, [source, colorCount, ignoreGrays, ignoreWB, maxDimension])

  useEffect(() => {
    runExtraction()
    return () => {
      cancelledRef.current = true
    }
  }, [runExtraction])

  const loadSample = (type) => {
    setSource(createSampleImage(type))
    setFileName('')
  }

  const handleFile = ({ file }) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      setSource(String(e.target.result))
      setFileName(file.name)
    }
    reader.onerror = () => setError('Erro ao ler arquivo / Error reading file')
    reader.readAsDataURL(file)
  }

  const copyHex = (hex) => {
    navigator.clipboard.writeText(hex)
    message.success(t.copied)
  }

  const exportText = useMemo(() => {
    if (!palette.length) return ''
    if (exportMode === 'json') {
      return JSON.stringify(
        palette.map((c) => ({ hex: c.hex, rgb: [c.r, c.g, c.b], percent: +(c.percent * 100).toFixed(2) })),
        null,
        2
      )
    }
    return palette
      .map((c, i) => `  --color-${i + 1}: ${c.hex};`)
      .join('\n')
  }, [palette, exportMode])

  const copyExport = () => {
    if (!exportText) return
    navigator.clipboard.writeText(exportText)
    message.success(t.copied)
  }

  const qualityOptions = [
    { label: t.qualityLow, value: 'low' },
    { label: t.qualityMedium, value: 'medium' },
    { label: t.qualityHigh, value: 'high' },
  ]

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><PictureOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card title={t.preview}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          {source ? (
            <img
              src={source}
              alt="preview"
              style={{ maxWidth: '100%', maxHeight: 300, objectFit: 'contain', borderRadius: 8 }}
            />
          ) : (
            <Alert type="info" message={t.noImage} />
          )}

          <Space wrap>
            <Upload beforeUpload={() => false} onChange={handleFile} showUploadList={false}>
              <Button icon={<UploadOutlined />}>{t.upload}</Button>
            </Upload>
            <Button icon={<BgColorsOutlined />} onClick={() => loadSample('gradient')}>{t.sampleGradient}</Button>
            <Button icon={<FormatPainterOutlined />} onClick={() => loadSample('shapes')}>{t.sampleShapes}</Button>
            <Button icon={<FileImageOutlined />} onClick={() => loadSample('landscape')}>{t.sampleLandscape}</Button>
            <Button icon={<ClearOutlined />} onClick={() => { setSource(null); setFileName('') }}>{t.clear}</Button>
          </Space>

          {fileName && <Text type="secondary">{fileName}</Text>}
        </Space>
      </Card>

      <Card title={t.options}>
        <Row gutter={[24, 24]}>
          <Col xs={24} sm={12} md={8}>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Text strong>{t.colorCount}</Text>
              <InputNumber
                min={1}
                max={32}
                value={colorCount}
                onChange={(v) => setColorCount(v ?? 8)}
                style={{ width: '100%' }}
              />
            </Space>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Text strong>{t.quality}</Text>
              <Segmented
                value={quality}
                onChange={setQuality}
                options={qualityOptions}
                block
              />
            </Space>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Text strong>{t.options}</Text>
              <Space>
                <Switch checked={ignoreGrays} onChange={setIgnoreGrays} />
                <Text>{t.ignoreGrays}</Text>
              </Space>
              <Space>
                <Switch checked={ignoreWB} onChange={setIgnoreWB} />
                <Text>{t.ignoreWB}</Text>
              </Space>
            </Space>
          </Col>
        </Row>
      </Card>

      {error && <Alert type="error" message={error} />}

      <Card title={t.palette}>
        <Spin spinning={loading} tip={t.loading}>
          {!palette.length ? (
            <Alert type="info" message={t.noPalette} />
          ) : (
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <Space size="middle" wrap>
                {palette.map((color) => (
                  <Card
                    key={color.hex}
                    bodyStyle={{ padding: 12, textAlign: 'center' }}
                    style={{ width: 120 }}
                  >
                    <Space direction="vertical" align="center" size={8}>
                      <div
                        style={{
                          width: 80,
                          height: 80,
                          borderRadius: 12,
                          background: color.hex,
                          border: '1px solid #d9d9d9',
                        }}
                      />
                      <Text code>{color.hex}</Text>
                      <Tag>{(color.percent * 100).toFixed(1)}%</Tag>
                      <Button size="small" icon={<CopyOutlined />} onClick={() => copyHex(color.hex)}>
                        {t.copy}
                      </Button>
                    </Space>
                  </Card>
                ))}
              </Space>

              <Card size="small" title={t.exportAs}>
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  <Segmented
                    value={exportMode}
                    onChange={setExportMode}
                    options={[
                      { label: t.exportCss, value: 'css' },
                      { label: t.exportJson, value: 'json' },
                    ]}
                  />
                  <pre style={{ background: '#f6f6f6', padding: 12, borderRadius: 8, overflow: 'auto' }}>
                    <code>{exportText || (exportMode === 'css' ? ':root {}' : '[]')}</code>
                  </pre>
                  <Button icon={<CopyOutlined />} onClick={copyExport} disabled={!palette.length}>
                    {t.copyAll}
                  </Button>
                </Space>
              </Card>
            </Space>
          )}
        </Spin>
      </Card>

      <Alert type="info" message={t.tipTitle} description={t.tipBody} />

      <Collapse>
        <Panel header={t.sourceTitle} key="source">
          <Paragraph>{t.sourceBody}</Paragraph>
          <pre style={{ background: '#f6f6f6', padding: 12, borderRadius: 8, overflow: 'auto' }}>
            <code>{sourceCode}</code>
          </pre>
        </Panel>
      </Collapse>
    </Space>
  )
}
