import React, { useEffect, useMemo, useState } from 'react'
import {
  Typography,
  Card,
  Space,
  Slider,
  Select,
  Switch,
  Button,
  Alert,
  Upload,
  Input,
  Row,
  Col,
  Statistic,
  Collapse,
  message,
} from 'antd'
import {
  PictureOutlined,
  UploadOutlined,
  CopyOutlined,
  DownloadOutlined,
  SwapOutlined,
  FontSizeOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography
const { Dragger } = Upload

// Ramps ordenadas do char MAIS CLARO (menos tinta) para o MAIS ESCURO
// (mais tinta) — luminância alta → início, luminância baixa → fim.
const RAMPS = {
  classic: ' .:-=+*#%@',
  detailed:
    " .'`^\",:;Il!i><~+_-?][}{1)(|/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$",
  blocks: ' ░▒▓█',
  binary: '01',
  dots: ' .oO0@',
}

const RAMP_OPTIONS = [
  { value: 'classic', label: ' .:-=+*#%@' },
  { value: 'detailed', label: ".'`,:;Il!i>..." },
  { value: 'blocks', label: '░▒▓█' },
  { value: 'binary', label: '01' },
  { value: 'dots', label: '.oO0@' },
  { value: 'custom', label: '✎' },
]

// Chars monoespaçados são ~2× mais altos que largos — corrige a proporção
// para o ASCII não ficar esticado na vertical.
const CHAR_ASPECT = 0.5

function escapeHtml(c) {
  if (c === '&') return '&amp;'
  if (c === '<') return '&lt;'
  if (c === '>') return '&gt;'
  return c
}

// Desenha uma esfera com gradiente radial num canvas e devolve um data URL —
// usado como imagem de exemplo inicial (sem nenhuma chamada de rede).
function buildSampleDataUrl() {
  const c = document.createElement('canvas')
  c.width = 280
  c.height = 280
  const ctx = c.getContext('2d')
  ctx.fillStyle = '#0f0f0f'
  ctx.fillRect(0, 0, 280, 280)
  const g = ctx.createRadialGradient(108, 108, 6, 140, 140, 132)
  g.addColorStop(0, '#ffffff')
  g.addColorStop(0.45, '#9a9a9a')
  g.addColorStop(1, '#0f0f0f')
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.arc(140, 140, 132, 0, Math.PI * 2)
  ctx.fill()
  return c.toDataURL('image/png')
}

function loadImageFromDataUrl(url) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = url
  })
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

const translations = {
  pt: {
    title: 'Imagem → ASCII',
    intro: (
      <>
        Transforma uma imagem em arte ASCII usando a luminância de cada
        pixel mapeada para uma rampa de caracteres — útil para banners de
        terminal, assinaturas de e-mail, <Text code>motd</Text> e
        depuração visual. Tudo roda no navegador via{' '}
        <Text code>&lt;canvas&gt;</Text>; a imagem nunca sai daqui.
      </>
    ),
    sourceTitle: 'Imagem de origem',
    uploadHint: 'Clique ou arraste uma imagem aqui (PNG, JPG, WebP, GIF…)',
    useSample: 'Usar exemplo',
    sampleName: 'exemplo.png',
    optionsTitle: 'Opções',
    width: 'Largura (colunas)',
    ramp: 'Rampa de caracteres',
    customRamp: 'Rampa personalizada',
    customRampHint: 'do mais claro (esquerda) ao mais escuro (direita)',
    invert: 'Inverter (claro/escuro)',
    color: 'Colorir (cor original do pixel)',
    bgDark: 'Fundo escuro',
    previewTitle: 'Preview',
    empty: 'Carregue uma imagem acima para gerar o ASCII.',
    tooWide:
      'Mais de 160 colunas — pode estourar terminais padrão e ficar pesado de renderizar.',
    statsCols: 'Colunas',
    statsRows: 'Linhas',
    statsChars: 'Caracteres',
    copy: 'Copiar',
    copied: 'ASCII copiado!',
    download: 'Baixar .txt',
    source: 'Código-fonte do algoritmo',
    loadError: 'Não foi possível carregar a imagem.',
  },
  en: {
    title: 'Image → ASCII',
    intro: (
      <>
        Turns an image into ASCII art by mapping each pixel's luminance to a
        ramp of characters — great for terminal banners, e-mail signatures,{' '}
        <Text code>motd</Text> and visual debugging. Everything runs in the
        browser via <Text code>&lt;canvas&gt;</Text>; the image never leaves
        here.
      </>
    ),
    sourceTitle: 'Source image',
    uploadHint: 'Click or drop an image here (PNG, JPG, WebP, GIF…)',
    useSample: 'Use sample',
    sampleName: 'sample.png',
    optionsTitle: 'Options',
    width: 'Width (columns)',
    ramp: 'Character ramp',
    customRamp: 'Custom ramp',
    customRampHint: 'from lightest (left) to darkest (right)',
    invert: 'Invert (light/dark)',
    color: 'Colorize (original pixel color)',
    bgDark: 'Dark background',
    previewTitle: 'Preview',
    empty: 'Load an image above to generate the ASCII.',
    tooWide:
      'More than 160 columns — may overflow standard terminals and get heavy to render.',
    statsCols: 'Columns',
    statsRows: 'Lines',
    statsChars: 'Characters',
    copy: 'Copy',
    copied: 'ASCII copied!',
    download: 'Download .txt',
    source: 'Algorithm source code',
    loadError: 'Could not load the image.',
  },
}

export default function ImageToAsciiPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [imgEl, setImgEl] = useState(null)
  const [imgName, setImgName] = useState(t.sampleName)
  const [width, setWidth] = useState(100)
  const [rampKey, setRampKey] = useState('classic')
  const [customRamp, setCustomRamp] = useState(' .:-=+*#%@')
  const [invert, setInvert] = useState(false)
  const [color, setColor] = useState(false)
  const [bgDark, setBgDark] = useState(true)

  // Carrega a imagem de exemplo na montagem — dá um preview imediato sem
  // precisar de upload. Roda uma única vez.
  useEffect(() => {
    let alive = true
    loadImageFromDataUrl(buildSampleDataUrl())
      .then((img) => {
        if (alive) setImgEl(img)
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])

  const ramp = useMemo(() => {
    if (rampKey === 'custom') {
      const r = customRamp || ' '
      // Ignora ramps de 1 char (não há escala) e duplicatas implícitas —
      // o usuário é livre pra repetir, só precisa de >=2 símbolos.
      return r.length >= 2 ? r : ' .'
    }
    return RAMPS[rampKey] || RAMPS.classic
  }, [rampKey, customRamp])

  // Memo que faz o processamento pesado (canvas + getImageData). Deps são
  // todas primitivas/estáveis: imgEl só muda no load, o resto é estado
  // escalar — então o efeito não roda em loop.
  const result = useMemo(() => {
    if (!imgEl) return { text: '', html: '', cols: 0, rows: 0 }
    const cols = Math.max(8, Math.min(400, Math.round(width)))
    const aspect = (imgEl.naturalHeight || 1) / (imgEl.naturalWidth || 1)
    const rows = Math.max(1, Math.round(cols * aspect * CHAR_ASPECT))

    const canvas = document.createElement('canvas')
    canvas.width = cols
    canvas.height = rows
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    ctx.drawImage(imgEl, 0, 0, cols, rows)
    let data
    try {
      data = ctx.getImageData(0, 0, cols, rows).data
    } catch {
      return { text: '', html: '', cols, rows: 0 }
    }

    const bg = bgDark ? [0, 0, 0] : [255, 255, 255]
    const last = ramp.length - 1
    const lines = []
    const htmlLines = []

    for (let r = 0; r < rows; r++) {
      let textLine = ''
      let htmlLine = ''
      for (let c = 0; c < cols; c++) {
        const i = (r * cols + c) * 4
        let rd = data[i]
        let gn = data[i + 1]
        let bl = data[i + 2]
        const a = data[i + 3] / 255
        // Mistura com a cor de fundo pra tratar transparência de forma
        // coerente (áreas transparentes viram o char do fundo).
        rd = Math.round(rd * a + bg[0] * (1 - a))
        gn = Math.round(gn * a + bg[1] * (1 - a))
        bl = Math.round(bl * a + bg[2] * (1 - a))
        // Luminância perceptual (Rec. 709).
        let lum = (0.2126 * rd + 0.7152 * gn + 0.0722 * bl) / 255
        let idx = Math.round(lum * last)
        if (invert) idx = last - idx
        const ch = ramp[idx] || ramp[last] || ' '
        textLine += ch
        if (color) {
          htmlLine += `<span style="color:rgb(${rd},${gn},${bl})">${escapeHtml(ch)}</span>`
        }
      }
      lines.push(textLine)
      if (color) htmlLines.push(htmlLine)
    }

    return {
      text: lines.join('\n'),
      html: htmlLines.join('\n'),
      cols,
      rows,
    }
  }, [imgEl, width, ramp, invert, color, bgDark])

  function handleCopy() {
    if (!result.text) return
    navigator.clipboard.writeText(result.text)
    message.success(t.copied)
  }

  function handleDownload() {
    if (!result.text) return
    const blob = new Blob([result.text + '\n'], {
      type: 'text/plain;charset=utf-8',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'ascii-art.txt'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  async function handleFile(file) {
    try {
      const url = await readFileAsDataUrl(file)
      const img = await loadImageFromDataUrl(url)
      setImgEl(img)
      setImgName(file.name || 'image')
    } catch {
      message.error(t.loadError)
    }
  }

  async function handleSample() {
    try {
      const img = await loadImageFromDataUrl(buildSampleDataUrl())
      setImgEl(img)
      setImgName(t.sampleName)
    } catch {
      message.error(t.loadError)
    }
  }

  const previewStyle = {
    margin: 0,
    overflowX: 'auto',
    fontFamily:
      'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace',
    fontSize: 10,
    lineHeight: 1.05,
    padding: 16,
    borderRadius: 8,
    background: bgDark ? '#0d0d0d' : '#ffffff',
    color: bgDark ? '#e6e6e6' : '#111111',
    whiteSpace: 'pre',
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}>
        <PictureOutlined /> {t.title}
      </Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card title={t.sourceTitle}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Dragger
            accept="image/*"
            showUploadList={false}
            multiple={false}
            beforeUpload={(file) => {
              handleFile(file)
              return false
            }}
          >
            <p className="ant-upload-drag-icon">
              <UploadOutlined />
            </p>
            <p className="ant-upload-text">{t.uploadHint}</p>
          </Dragger>
          <Space wrap>
            <Button icon={<PictureOutlined />} onClick={handleSample}>
              {t.useSample}
            </Button>
            {imgEl && (
              <Text type="secondary">
                {imgName} · {imgEl.naturalWidth}×{imgEl.naturalHeight}
              </Text>
            )}
          </Space>
        </Space>
      </Card>

      <Card title={t.optionsTitle}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div>
            <Text strong>{t.width}</Text>
            <Slider
              min={20}
              max={200}
              value={width}
              onChange={setWidth}
              marks={{ 40: '40', 80: '80', 120: '120', 160: '160', 200: '200' }}
            />
          </div>
          <Space wrap align="center">
            <Text strong>{t.ramp}</Text>
            <Select
              value={rampKey}
              onChange={setRampKey}
              options={RAMP_OPTIONS}
              style={{ minWidth: 160 }}
            />
          </Space>
          {rampKey === 'custom' && (
            <div>
              <Input
                value={customRamp}
                onChange={(e) => setCustomRamp(e.target.value)}
                placeholder={t.customRamp}
                style={{ fontFamily: 'monospace' }}
              />
              <Text type="secondary" style={{ fontSize: 12 }}>
                {t.customRampHint}
              </Text>
            </div>
          )}
          <Space wrap>
            <Switch checked={invert} onChange={setInvert} />
            <Text>{t.invert}</Text>
          </Space>
          <Space wrap>
            <Switch checked={color} onChange={setColor} />
            <Text>{t.color}</Text>
          </Space>
          <Space wrap>
            <Switch checked={bgDark} onChange={setBgDark} />
            <Text>{t.bgDark}</Text>
          </Space>
        </Space>
      </Card>

      <Card
        title={t.previewTitle}
        extra={
          result.cols ? (
            <Text code>
              {result.cols}×{result.rows}
            </Text>
          ) : null
        }
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          {result.cols > 160 && (
            <Alert type="warning" showIcon message={t.tooWide} />
          )}
          {!result.text ? (
            <Alert type="info" showIcon message={t.empty} />
          ) : color ? (
            <pre style={previewStyle} dangerouslySetInnerHTML={{ __html: result.html }} />
          ) : (
            <pre style={previewStyle}>
              <code>{result.text}</code>
            </pre>
          )}
          <Row gutter={[16, 16]}>
            <Col xs={8} sm={6}>
              <Card size="small">
                <Statistic title={t.statsCols} value={result.cols} />
              </Card>
            </Col>
            <Col xs={8} sm={6}>
              <Card size="small">
                <Statistic title={t.statsRows} value={result.rows} />
              </Card>
            </Col>
            <Col xs={8} sm={6}>
              <Card size="small">
                <Statistic title={t.statsChars} value={result.text.length} />
              </Card>
            </Col>
          </Row>
          <Space wrap>
            <Button
              type="primary"
              icon={<CopyOutlined />}
              onClick={handleCopy}
              disabled={!result.text}
            >
              {t.copy}
            </Button>
            <Button
              icon={<DownloadOutlined />}
              onClick={handleDownload}
              disabled={!result.text}
            >
              {t.download}
            </Button>
          </Space>
        </Space>
      </Card>

      <Collapse
        items={[
          {
            key: 'source',
            label: t.source,
            children: (
              <pre style={{ margin: 0, overflowX: 'auto' }}>
                <code>{`// núcleo: canvas escala a imagem para cols×rows, lê os pixels
// e mapeia a luminância de cada um para um char da rampa.

const cols = width
const rows = Math.round(cols * (imgH / imgW) * 0.5) // chars são 2× mais altos
const ctx = canvas.getContext('2d')
ctx.drawImage(img, 0, 0, cols, rows)
const data = ctx.getImageData(0, 0, cols, rows).data
const last = ramp.length - 1

for (let r = 0; r < rows; r++) {
  let line = ''
  for (let c = 0; c < cols; c++) {
    const i = (r * cols + c) * 4
    const [rd, gn, bl] = [data[i], data[i+1], data[i+2]]
    const lum = (0.2126*rd + 0.7152*gn + 0.0722*bl) / 255  // Rec. 709
    let idx = Math.round(lum * last)            // claro → início
    if (invert) idx = last - idx                 // inverte o tom
    line += ramp[idx]
  }
  out.push(line)
}`}</code>
              </pre>
            ),
          },
        ]}
      />
    </Space>
  )
}
