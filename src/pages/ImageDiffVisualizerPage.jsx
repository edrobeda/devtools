import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Typography, Card, Space, Button, Upload, Slider, Segmented, Switch,
  Row, Col, Statistic, Collapse, Alert, ColorPicker, message,
} from 'antd'
import {
  PictureOutlined, UploadOutlined, DownloadOutlined, EyeOutlined,
  BgColorsOutlined, DiffOutlined, ColumnWidthOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  VIEW_MODES,
  loadImage,
  readFileAsDataURL,
  renderComparison,
  createSamplePair,
  downloadCanvas,
} from '../utils/imageDiffVisualizer'

const { Title, Paragraph, Text } = Typography
const { Panel } = Collapse

const translations = {
  pt: {
    title: 'Visualizador de Diff de Imagens',
    intro: 'Compare duas imagens pixel a pixel diretamente no navegador. Use para validar screenshots, revisões visuais ou regression tests. As imagens nunca saem do dispositivo.',
    uploadA: 'Imagem A (base)',
    uploadB: 'Imagem B (comparada)',
    sampleShapes: 'Formas',
    sampleText: 'Texto',
    mode: 'Modo de visualização',
    sideBySide: 'Lado a lado',
    overlay: 'Sobreposição',
    diff: 'Diff',
    blend: 'Blend',
    onionSkin: 'Onion skin',
    threshold: 'Tolerância de diferença',
    opacity: 'Opacidade',
    ignoreAlpha: 'Ignorar canal alpha',
    diffColor: 'Cor do diff',
    stats: 'Estatísticas',
    dimensions: 'Dimensões',
    differentPixels: 'Pixels diferentes',
    percentage: 'Porcentagem',
    boundingBox: 'Bounding box',
    none: 'nenhum',
    download: 'Baixar resultado',
    noImages: 'Carregue duas imagens para começar.',
    sourceTitle: 'Código-fonte',
    sourceBody: 'O motor em src/utils/imageDiffVisualizer.js redimensiona ambas as imagens para o mesmo canvas, lê os pixels com getImageData e compara a distância de cor. Modos como blend, overlay e onion skin usam composição de canvas; o modo diff gera uma máscara colorida dos pixels divergentes.',
  },
  en: {
    title: 'Image Diff Visualizer',
    intro: 'Compare two images pixel by pixel right in the browser. Useful for validating screenshots, visual reviews or regression tests. Images never leave the device.',
    uploadA: 'Image A (base)',
    uploadB: 'Image B (compared)',
    sampleShapes: 'Shapes',
    sampleText: 'Text',
    mode: 'View mode',
    sideBySide: 'Side by side',
    overlay: 'Overlay',
    diff: 'Diff',
    blend: 'Blend',
    onionSkin: 'Onion skin',
    threshold: 'Difference tolerance',
    opacity: 'Opacity',
    ignoreAlpha: 'Ignore alpha channel',
    diffColor: 'Diff color',
    stats: 'Statistics',
    dimensions: 'Dimensions',
    differentPixels: 'Different pixels',
    percentage: 'Percentage',
    boundingBox: 'Bounding box',
    none: 'none',
    download: 'Download result',
    noImages: 'Upload two images to start.',
    sourceTitle: 'Source code',
    sourceBody: 'The engine in src/utils/imageDiffVisualizer.js resizes both images onto the same canvas size, reads pixels with getImageData and compares color distance. Blend, overlay and onion-skin modes use canvas composition; diff mode generates a colored mask of divergent pixels.',
  },
}

const sourceCode = `// src/utils/imageDiffVisualizer.js
export function computeDiff(dataA, dataB, options = {}) {
  const { threshold = 0, ignoreAlpha = false } = options
  const length = Math.min(dataA.length, dataB.length)
  const diff = new Uint8ClampedArray(length)
  let different = 0

  for (let i = 0; i < length; i += 4) {
    const r1 = dataA[i], g1 = dataA[i + 1], b1 = dataA[i + 2], a1 = dataA[i + 3]
    const r2 = dataB[i], g2 = dataB[i + 1], b2 = dataB[i + 2], a2 = dataB[i + 3]
    const dist = colorDistance(
      r1, g1, b1, ignoreAlpha ? 255 : a1,
      r2, g2, b2, ignoreAlpha ? 255 : a2
    )
    if (dist > threshold) {
      different += 1
      diff[i] = 255; diff[i + 1] = 0; diff[i + 2] = 0; diff[i + 3] = 255
    } else {
      diff[i] = 0; diff[i + 1] = 0; diff[i + 2] = 0; diff[i + 3] = 0
    }
  }

  return {
    diff,
    different,
    totalPixels: length / 4,
    percentage: (different / (length / 4)) * 100,
  }
}

export function renderComparison(imgA, imgB, options = {}) {
  const { mode, threshold, opacity, ignoreAlpha, diffMaskColor, maxDimension } = options
  const dims = getFitDimensions(imgA, imgB, maxDimension)
  const { width, height } = dims
  const dataA = getImageData(imgA, width, height).data
  const dataB = getImageData(imgB, width, height).data
  // ... retorna canvas, estatísticas e dimensões conforme o modo
}`

export default function ImageDiffVisualizerPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [sourceA, setSourceA] = useState('')
  const [sourceB, setSourceB] = useState('')
  const [imgA, setImgA] = useState(null)
  const [imgB, setImgB] = useState(null)
  const [mode, setMode] = useState(VIEW_MODES.SIDE_BY_SIDE)
  const [threshold, setThreshold] = useState(0)
  const [opacity, setOpacity] = useState(0.5)
  const [ignoreAlpha, setIgnoreAlpha] = useState(false)
  const [diffColor, setDiffColor] = useState('#ff0000')
  const [error, setError] = useState('')
  const [stats, setStats] = useState(null)
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })
  const canvasRef = useRef(null)
  const cancelledRef = useRef(false)

  const loadSamples = useCallback((type) => {
    const { a, b } = createSamplePair(type)
    setSourceA(a)
    setSourceB(b)
    setError('')
  }, [])

  useEffect(() => {
    loadSamples('shapes')
  }, [loadSamples])

  const options = useMemo(() => ({
    mode,
    threshold,
    opacity,
    ignoreAlpha,
    diffMaskColor: diffColor,
    maxDimension: 800,
  }), [mode, threshold, opacity, ignoreAlpha, diffColor])

  const render = useCallback(async () => {
    if (!sourceA || !sourceB) return
    cancelledRef.current = false
    setError('')
    try {
      const [loadedA, loadedB] = await Promise.all([loadImage(sourceA), loadImage(sourceB)])
      if (cancelledRef.current) return
      setImgA(loadedA)
      setImgB(loadedB)
      const { canvas, stats: s, width: w, height: h } = renderComparison(loadedA, loadedB, options)
      if (cancelledRef.current) return
      const dest = canvasRef.current
      if (dest) {
        dest.width = canvas.width
        dest.height = canvas.height
        const ctx = dest.getContext('2d')
        ctx.clearRect(0, 0, dest.width, dest.height)
        ctx.drawImage(canvas, 0, 0)
      }
      setStats(s)
      setCanvasSize({ width: w, height: h })
    } catch (err) {
      if (!cancelledRef.current) {
        setError(err.message || String(err))
      }
    }
  }, [sourceA, sourceB, options])

  useEffect(() => {
    render()
    return () => {
      cancelledRef.current = true
    }
  }, [render])

  const handleFile = async (file, setter) => {
    if (!file) return
    try {
      const dataUrl = await readFileAsDataURL(file)
      setter(dataUrl)
      setError('')
    } catch (err) {
      setError(err.message || String(err))
    }
  }

  const handleDownload = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    downloadCanvas(canvas, 'image-diff.png')
    message.success('Download iniciado / Download started')
  }

  const modeOptions = useMemo(() => [
    { label: t.sideBySide, value: VIEW_MODES.SIDE_BY_SIDE, icon: <ColumnWidthOutlined /> },
    { label: t.overlay, value: VIEW_MODES.OVERLAY, icon: <EyeOutlined /> },
    { label: t.diff, value: VIEW_MODES.DIFF, icon: <DiffOutlined /> },
    { label: t.blend, value: VIEW_MODES.BLEND, icon: <BgColorsOutlined /> },
    { label: t.onionSkin, value: VIEW_MODES.ONION_SKIN, icon: <PictureOutlined /> },
  ], [t])

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}>{t.title}</Title>
      <Paragraph>{t.intro}</Paragraph>

      {error && <Alert type="error" message={error} showIcon closable onClose={() => setError('')} />}

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card size="small" title={t.uploadA}>
            <Space wrap>
              <Upload
                beforeUpload={(file) => { handleFile(file, setSourceA); return false }}
                showUploadList={false}
                accept="image/*"
              >
                <Button icon={<UploadOutlined />}>{t.uploadA}</Button>
              </Upload>
              <Button onClick={() => loadSamples('shapes')}>{t.sampleShapes}</Button>
              <Button onClick={() => loadSamples('text')}>{t.sampleText}</Button>
            </Space>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card size="small" title={t.uploadB}>
            <Space wrap>
              <Upload
                beforeUpload={(file) => { handleFile(file, setSourceB); return false }}
                showUploadList={false}
                accept="image/*"
              >
                <Button icon={<UploadOutlined />}>{t.uploadB}</Button>
              </Upload>
              <Button onClick={() => loadSamples('shapes')}>{t.sampleShapes}</Button>
              <Button onClick={() => loadSamples('text')}>{t.sampleText}</Button>
            </Space>
          </Card>
        </Col>
      </Row>

      <Card size="small">
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text strong>{t.mode}</Text>
          <Segmented options={modeOptions} value={mode} onChange={setMode} block />

          <Row gutter={[24, 16]} align="middle">
            <Col xs={24} md={8}>
              <Text strong>{t.threshold}</Text>
              <Slider min={0} max={100} value={threshold} onChange={setThreshold} tooltip={{ formatter: (v) => `${v}%` }} />
            </Col>
            {(mode === VIEW_MODES.OVERLAY || mode === VIEW_MODES.BLEND || mode === VIEW_MODES.ONION_SKIN) && (
              <Col xs={24} md={8}>
                <Text strong>{t.opacity}</Text>
                <Slider min={0} max={1} step={0.01} value={opacity} onChange={setOpacity} tooltip={{ formatter: (v) => `${Math.round(v * 100)}%` }} />
              </Col>
            )}
            {mode === VIEW_MODES.DIFF && (
              <Col xs={24} md={8}>
                <Text strong>{t.diffColor}</Text>
                <div>
                  <ColorPicker value={diffColor} onChange={(c) => setDiffColor(c.toHexString())} showText />
                </div>
              </Col>
            )}
            <Col xs={24} md={8}>
              <Switch checked={ignoreAlpha} onChange={setIgnoreAlpha} checkedChildren={t.ignoreAlpha} unCheckedChildren={t.ignoreAlpha} />
            </Col>
          </Row>
        </Space>
      </Card>

      <Card
        title={t.title}
        extra={(
          <Button icon={<DownloadOutlined />} onClick={handleDownload} disabled={!stats}>
            {t.download}
          </Button>
        )}
      >
        <div style={{ overflow: 'auto', textAlign: 'center', background: '#f5f5f5', borderRadius: 8, padding: 12 }}>
          <canvas
            ref={canvasRef}
            style={{ maxWidth: '100%', border: '1px solid #d9d9d9', borderRadius: 4 }}
          />
          {!sourceA && !sourceB && (
            <Text type="secondary" style={{ display: 'block', padding: 32 }}>{t.noImages}</Text>
          )}
        </div>
      </Card>

      {stats && (
        <Card size="small" title={t.stats}>
          <Row gutter={[16, 16]}>
            <Col xs={12} md={6}>
              <Statistic title={t.dimensions} value={`${canvasSize.width} × ${canvasSize.height}`} />
            </Col>
            <Col xs={12} md={6}>
              <Statistic title={t.differentPixels} value={stats.different.toLocaleString(lang)} />
            </Col>
            <Col xs={12} md={6}>
              <Statistic title={t.percentage} value={`${stats.percentage.toFixed(2)}%`} />
            </Col>
            <Col xs={12} md={6}>
              <Statistic
                title={t.boundingBox}
                value={stats.boundingBox ? `${stats.boundingBox.width} × ${stats.boundingBox.height}` : t.none}
              />
            </Col>
          </Row>
        </Card>
      )}

      <Collapse defaultActiveKey={['source']}>
        <Panel header={t.sourceTitle} key="source">
          <Paragraph>{t.sourceBody}</Paragraph>
          <pre style={{ background: '#f6f8fa', padding: 16, borderRadius: 8, overflow: 'auto' }}>
            <code>{sourceCode}</code>
          </pre>
        </Panel>
      </Collapse>
    </Space>
  )
}
