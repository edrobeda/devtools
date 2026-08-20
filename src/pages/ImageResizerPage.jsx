import React, { useEffect, useRef, useState } from 'react'
import {
  Typography,
  Card,
  Space,
  Button,
  Row,
  Col,
  Upload,
  InputNumber,
  Slider,
  Segmented,
  Select,
  Tag,
  Alert,
  Collapse,
} from 'antd'
import {
  DownloadOutlined,
  FileImageOutlined,
  UndoOutlined,
  InboxOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  computeTargetSize,
  drawResizedToCanvas,
  formatBytes,
  getEngineSource,
  outputFileName,
  sizeDeltaPercent,
} from '../utils/imageResizer'

const { Title, Paragraph, Text } = Typography
const { Dragger } = Upload
const { Panel } = Collapse

const ACCEPT_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/bmp', 'image/gif']
const MAX_FILE_BYTES = 50 * 1024 * 1024

const MODE_DEFAULTS = { percent: 50, width: 1920, height: 1080, max: 1600 }
const MAX_PRESETS = [256, 512, 800, 1280, 1920]

const translations = {
  pt: {
    title: 'Redimensionador de Imagem',
    intro: (
      <>
        Redimensiona e comprime imagens direto no navegador — JPG, PNG, WebP,
        BMP e GIF. Nada é enviado pra lugar nenhum: o processamento é feito
        com <Text code>&lt;canvas&gt;</Text> e o resultado baixado na hora.
        GIF vira imagem estática (primeiro quadro).
      </>
    ),
    dropTitle: 'Arraste uma imagem ou clique para escolher',
    dropHint: 'JPG, PNG, WebP, BMP ou GIF, até 50 MB',
    onlyBrowser: 'Todo o processamento acontece no seu navegador.',
    invalidFile: 'Formato não suportado. Aceitamos JPG, PNG, WebP, BMP e GIF (até 50 MB).',
    tooBig: (mb) => `Arquivo maior que ${mb} MB. Escolha uma imagem menor.`,
    loadError: 'Não foi possível carregar essa imagem — o arquivo pode estar corrompido ou o formato não é suportado pelo navegador.',
    loadedFile: 'Arquivo carregado',
    changeFile: 'Trocar imagem',
    settings: 'Configurações',
    mode: 'Como redimensionar',
    modePercent: 'Porcentagem',
    modeWidth: 'Largura',
    modeHeight: 'Altura',
    modeMax: 'Maior lado',
    percentLabel: 'Escala',
    widthLabel: 'Largura (px)',
    heightLabel: 'Altura (px)',
    maxLabel: 'Maior lado (px)',
    originalDims: (w, h) => `Original: ${w} × ${h} px`,
    format: 'Formato de saída',
    formatOriginal: 'Original',
    quality: 'Qualidade (só JPG/WebP)',
    qualityHint: 'PNG é sem perdas e ignora esse controle. Valores menores comprimem mais, mas perdem detalhe.',
    presets: 'Atalhos rápidos (maior lado)',
    transparencyNote: 'JPG não suporta transparência — o fundo transparente será preenchido com branco.',
    upscaleWarning: 'Redimensionando para cima: a imagem perde nitidez (blur). Prefira trabalhar com a maior resolução disponível.',
    gifNote: 'Animações GIF viram a imagem do primeiro quadro.',
    original: 'Original',
    result: 'Resultado',
    size: 'Tamanho',
    dimensions: 'Dimensões',
    download: 'Baixar',
    deltaLabel: (delta) => `${delta > 0 ? '+' : ''}${delta.toFixed(1)}%`,
    saved: 'menor que o original',
    grew: 'maior que o original',
    sameSize: 'sem mudança de tamanho',
    waiting: 'Ajuste as opções para gerar o resultado.',
    howTitle: 'Como funciona',
    how: (
      <>
        A imagem é desenhada num <Text code>&lt;canvas&gt;</Text> na dimensão
        calculada (mantendo sempre a proporção) e o navegador re-encoda no
        formato escolhido com <Text code>canvas.toBlob()</Text>. Comprimir
        JPG/WebP é baixar a <Text code>quality</Text>; também dá pra reduzir
        a resolução — ou os dois. PNG só diminui de tamanho quando as
        dimensões diminuem, já que o encode é sem perdas.
      </>
    ),
    source: 'Código-fonte do motor',
    reset: 'Restaurar padrões',
    max: 'máx.',
  },
  en: {
    title: 'Image Resizer',
    intro: (
      <>
        Resize and compress images right in the browser — JPG, PNG, WebP,
        BMP and GIF. Nothing is uploaded anywhere: processing happens with{' '}
        <Text code>&lt;canvas&gt;</Text> and the result downloads instantly.
        GIF becomes a static image (first frame).
      </>
    ),
    dropTitle: 'Drag an image here or click to browse',
    dropHint: 'JPG, PNG, WebP, BMP or GIF, up to 50 MB',
    onlyBrowser: 'All processing happens in your browser.',
    invalidFile: 'Unsupported format. We accept JPG, PNG, WebP, BMP and GIF (up to 50 MB).',
    tooBig: (mb) => `File larger than ${mb} MB. Pick a smaller image.`,
    loadError: 'Could not load this image — the file may be corrupted or its format is not supported by the browser.',
    loadedFile: 'Loaded file',
    changeFile: 'Change image',
    settings: 'Settings',
    mode: 'Resize mode',
    modePercent: 'Percent',
    modeWidth: 'Width',
    modeHeight: 'Height',
    modeMax: 'Longest side',
    percentLabel: 'Scale',
    widthLabel: 'Width (px)',
    heightLabel: 'Height (px)',
    maxLabel: 'Longest side (px)',
    originalDims: (w, h) => `Original: ${w} × ${h} px`,
    format: 'Output format',
    formatOriginal: 'Original',
    quality: 'Quality (JPEG/WebP only)',
    qualityHint: 'PNG is lossless and ignores this control. Lower values compress more but lose detail.',
    presets: 'Quick presets (longest side)',
    transparencyNote: 'JPEG has no transparency — transparent backgrounds are filled with white.',
    upscaleWarning: 'Upscaling: the image will look blurry. Prefer working from the highest resolution available.',
    gifNote: 'GIF animations become the first frame.',
    original: 'Original',
    result: 'Result',
    size: 'Size',
    dimensions: 'Dimensions',
    download: 'Download',
    deltaLabel: (delta) => `${delta > 0 ? '+' : ''}${delta.toFixed(1)}%`,
    saved: 'smaller than original',
    grew: 'larger than original',
    sameSize: 'no size change',
    waiting: 'Tweak the options to generate the result.',
    howTitle: 'How it works',
    how: (
      <>
        The image is drawn on a <Text code>&lt;canvas&gt;</Text> at the
        computed size (aspect ratio always preserved) and the browser
        re-encodes it in the chosen format with <Text code>canvas.toBlob()</Text>.
        Compressing JPEG/WebP means lowering <Text code>quality</Text>; you can
        also reduce resolution — or both. PNG only shrinks when the dimensions
        shrink, since the encoding is lossless.
      </>
    ),
    source: 'Engine source code',
    reset: 'Reset to defaults',
    max: 'max.',
  },
}

export default function ImageResizerPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [file, setFile] = useState(null)
  const [img, setImg] = useState(null)
  const [origSize, setOrigSize] = useState(null)
  const [origUrl, setOrigUrl] = useState(null)
  const [loadError, setLoadError] = useState(false)

  const [mode, setMode] = useState('percent')
  const [value, setValue] = useState(MODE_DEFAULTS.percent)
  const [format, setFormat] = useState('original')
  const [quality, setQuality] = useState(0.82)
  const [result, setResult] = useState(null)
  const [failMessage, setFailMessage] = useState(null)

  const origUrlRef = useRef(null)
  const resultUrlRef = useRef(null)

  // Libera URLs de blob pendentes ao desmontar.
  useEffect(
    () => () => {
      if (origUrlRef.current) URL.revokeObjectURL(origUrlRef.current)
      if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current)
    },
    []
  )

  // Carrega o arquivo escolhido e extrai dimensões originais.
  useEffect(() => {
    if (!file) {
      setImg(null)
      setOrigSize(null)
      setOrigUrl(null)
      setResult(null)
      return
    }
    let cancelled = false
    const url = URL.createObjectURL(file)
    if (origUrlRef.current) URL.revokeObjectURL(origUrlRef.current)
    origUrlRef.current = url
    setOrigUrl(url)
    setResult(null)

    const image = new Image()
    image.onload = () => {
      if (cancelled) return
      setLoadError(false)
      setImg(image)
      setOrigSize({ width: image.naturalWidth, height: image.naturalHeight })
    }
    image.onerror = () => {
      if (cancelled) return
      setLoadError(true)
    }
    image.src = url

    return () => {
      cancelled = true
    }
  }, [file])

  // Redimensiona / re-encoda sempre que alguma opção muda (resultado ao vivo).
  const effectiveMime = format === 'original' ? file?.type || 'image/png' : format
  const isLossy = effectiveMime === 'image/jpeg' || effectiveMime === 'image/webp'

  useEffect(() => {
    if (!img || !origSize) return
    let cancelled = false
    const target = computeTargetSize({
      w: origSize.width,
      h: origSize.height,
      mode,
      value,
    })
    drawResizedToCanvas(
      { img, width: target.width, height: target.height, mime: effectiveMime, quality },
      (blob) => {
        if (cancelled || !blob) return
        const url = URL.createObjectURL(blob)
        if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current)
        resultUrlRef.current = url
        setResult({ url, width: target.width, height: target.height, size: blob.size, mime: effectiveMime })
      }
    )
    return () => {
      cancelled = true
    }
  }, [img, origSize, mode, value, format, quality, effectiveMime])

  function changeMode(m) {
    setMode(m)
    setValue(MODE_DEFAULTS[m])
  }

  function resetAll() {
    setMode('percent')
    setValue(MODE_DEFAULTS.percent)
    setFormat('original')
    setQuality(0.82)
  }

  function beforeUpload(selectedFile) {
    if (!ACCEPT_MIME.includes(selectedFile.type)) {
      setLoadError(true)
      setFailMessage('invalid')
      return false
    }
    if (selectedFile.size > MAX_FILE_BYTES) {
      setLoadError(true)
      setFailMessage('toobig')
      return false
    }
    setFailMessage(null)
    setFile(selectedFile)
    return false
  }

  const failText = failMessage === 'toobig' ? t.tooBig(50) : failMessage === 'invalid' ? t.invalidFile : null

  const delta = result ? sizeDeltaPercent(file.size, result.size) : null
  const isUpscale = origSize && result ? result.width > origSize.width : false
  const isTransparentToJpeg = isLossy && effectiveMime === 'image/jpeg'

  const formatOptions = ['original', 'image/jpeg', 'image/png', 'image/webp'].map((m) => ({
    value: m,
    label: m === 'original' ? `${t.formatOriginal} (${file ? file.type.replace('image/', '') : 'auto'})` : m,
  }))

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div>
        <Title level={2} style={{ marginBottom: 4 }}>{t.title}</Title>
        <Paragraph type="secondary" style={{ fontSize: 15, marginBottom: 0 }}>
          {t.intro}
        </Paragraph>
      </div>

      {!origSize ? (
        <Card>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Dragger
              accept={ACCEPT_MIME.join(',')}
              maxCount={1}
              showUploadList={false}
              beforeUpload={beforeUpload}
              fileList={[]}
            >
              <p className="ant-upload-drag-icon" style={{ marginBottom: 0 }}>
                <InboxOutlined />
              </p>
              <p className="ant-upload-text" style={{ fontSize: 15 }}>{t.dropTitle}</p>
              <p className="ant-upload-hint">{t.dropHint}</p>
              <p className="ant-upload-hint">{t.onlyBrowser}</p>
            </Dragger>
            {failText && <Alert type="error" showIcon message={failText} />}
            {loadError && !failText && <Alert type="error" showIcon message={t.loadError} />}
          </Space>
        </Card>
      ) : (
        <>
          <Card size="small" title={t.loadedFile}>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Space wrap>
                <Text>
                  <FileImageOutlined style={{ marginRight: 6 }} />
                  {file.name}
                </Text>
                <Text type="secondary">{formatBytes(file.size)}</Text>
                <Text type="secondary">{t.originalDims(origSize.width, origSize.height)}</Text>
                <Button size="small" onClick={() => setFile(null)} icon={<UndoOutlined />}>
                  {t.changeFile}
                </Button>
              </Space>
              {file.type === 'image/gif' && <Alert type="info" showIcon message={t.gifNote} />}
            </Space>
          </Card>

          <Card size="small" title={t.settings}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <Space direction="vertical" style={{ width: '100%' }} size="small">
                    <Text type="secondary" style={{ fontSize: 12 }}>{t.mode}</Text>
                    <Segmented
                      block
                      value={mode}
                      onChange={changeMode}
                      options={[
                        { value: 'percent', label: t.modePercent },
                        { value: 'width', label: t.modeWidth },
                        { value: 'height', label: t.modeHeight },
                        { value: 'max', label: t.modeMax },
                      ]}
                    />
                    <Space wrap>
                      {mode === 'percent' && (
                        <>
                          <Slider
                            min={10}
                            max={200}
                            step={5}
                            value={value}
                            onChange={setValue}
                            style={{ width: 200 }}
                          />
                          <InputNumber
                            min={10}
                            max={200}
                            value={value}
                            onChange={(v) => setValue(v == null ? 10 : v)}
                            addonAfter="%"
                          />
                        </>
                      )}
                      {(mode === 'width' || mode === 'height' || mode === 'max') && (
                        <>
                          <InputNumber
                            min={1}
                            max={8192}
                            value={value}
                            onChange={(v) => setValue(v == null ? 1 : v)}
                            addonAfter="px"
                          />
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {mode === 'max' && `${t.max} ${origSize.width >= origSize.height ? origSize.width : origSize.height} px → ${value} px`}
                            {mode === 'width' && `${origSize.width} px → ${Math.round(origSize.height * (value / origSize.width))} px`}
                            {mode === 'height' && `${origSize.height} px → ${Math.round(origSize.width * (value / origSize.height))} px`}
                          </Text>
                        </>
                      )}
                    </Space>
                    {mode === 'max' && (
                      <Space wrap>
                        {MAX_PRESETS.map((p) => (
                          <Tag
                            key={p}
                            color={value === p ? 'blue' : undefined}
                            style={{ cursor: 'pointer', marginInlineEnd: 0 }}
                            onClick={() => {
                              setMode('max')
                              setValue(p)
                            }}
                          >
                            {p}
                          </Tag>
                        ))}
                      </Space>
                    )}
                  </Space>
                </Col>
                <Col xs={24} md={12}>
                  <Space direction="vertical" style={{ width: '100%' }} size="small">
                    <Text type="secondary" style={{ fontSize: 12 }}>{t.format}</Text>
                    <Select
                      style={{ width: '100%' }}
                      value={format}
                      onChange={setFormat}
                      options={formatOptions}
                    />
                    {isLossy && (
                      <>
                        <Text type="secondary" style={{ fontSize: 12 }}>{t.quality}</Text>
                        <Slider
                          min={0.1}
                          max={1}
                          step={0.01}
                          value={quality}
                          onChange={setQuality}
                          tooltip={{ formatter: (v) => `${Math.round(v * 100)}%` }}
                        />
                        <Text type="secondary" style={{ fontSize: 12 }}>{t.qualityHint}</Text>
                      </>
                    )}
                  </Space>
                </Col>
              </Row>
              <Space wrap>
                <Button size="small" icon={<UndoOutlined />} onClick={resetAll}>
                  {t.reset}
                </Button>
              </Space>
              {isTransparentToJpeg && <Alert type="warning" showIcon message={t.transparencyNote} />}
              {isUpscale && <Alert type="warning" showIcon message={t.upscaleWarning} />}
            </Space>
          </Card>

          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Card size="small" title={t.original} extra={<Text type="secondary" style={{ fontSize: 12 }}>{t.originalDims(origSize.width, origSize.height)}</Text>}>
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <div
                    style={{
                      border: '1px dashed #d9d9d9',
                      borderRadius: 8,
                      padding: 8,
                      background: '#fafafa',
                      textAlign: 'center',
                    }}
                  >
                    <img
                      src={origUrl}
                      alt="original"
                      style={{ maxWidth: '100%', maxHeight: 260, display: 'inline-block' }}
                    />
                  </div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {t.dimensions}: {origSize.width} × {origSize.height} px · {t.size}: {formatBytes(file.size)}
                  </Text>
                </Space>
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card
                size="small"
                title={t.result}
                extra={
                  result && (
                    <Tag color={delta < 0 ? 'green' : delta > 0 ? 'red' : 'default'}>
                      {t.deltaLabel(delta)} {delta < 0 ? t.saved : delta > 0 ? t.grew : t.sameSize}
                    </Tag>
                  )
                }
              >
                {result ? (
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <div
                      style={{
                        border: '1px dashed #d9d9d9',
                        borderRadius: 8,
                        padding: 8,
                        background: '#fafafa',
                        textAlign: 'center',
                      }}
                    >
                      <img
                        src={result.url}
                        alt="resized"
                        style={{ maxWidth: '100%', maxHeight: 260, display: 'inline-block' }}
                      />
                    </div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {t.dimensions}: {result.width} × {result.height} px · {t.size}: {formatBytes(result.size)}
                    </Text>
                    <Button
                      type="primary"
                      icon={<DownloadOutlined />}
                      href={result.url}
                      download={outputFileName(file.name, result.mime)}
                    >
                      {t.download}
                    </Button>
                  </Space>
                ) : (
                  <Text type="secondary">{t.waiting}</Text>
                )}
              </Card>
            </Col>
          </Row>

          <Alert type="info" showIcon message={t.howTitle} description={t.how} />

          <Collapse>
            <Panel header={t.source} key="source">
              <pre style={{ margin: 0, overflow: 'auto' }}>
                <code>{getEngineSource()}</code>
              </pre>
            </Panel>
          </Collapse>
        </>
      )}
    </Space>
  )
}