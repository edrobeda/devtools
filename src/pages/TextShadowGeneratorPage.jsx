import React, { useMemo, useRef, useState } from 'react'
import {
  Typography, Card, Space, Button, Slider, Alert, Collapse, message, ColorPicker,
  Row, Col, Input, Segmented,
} from 'antd'
import { FontSizeOutlined, CopyOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import { buildTextShadow, buildClassCss, PRESETS } from '../utils/textShadowGenerator'

const { Title, Paragraph, Text } = Typography
const { useMessage } = message

function makeLayer(id, overrides = {}) {
  return {
    id,
    x: 0,
    y: 4,
    blur: 12,
    color: '#000000',
    opacity: 25,
    ...overrides,
  }
}

const PRESET_KEYS = ['soft', 'glow', 'neon', 'retro', 'depth', 'outline']

const PRESET_LABEL = {
  soft: { pt: 'Suave', en: 'Soft' },
  glow: { pt: 'Brilho', en: 'Glow' },
  neon: { pt: 'Neon', en: 'Neon' },
  retro: { pt: 'Retrô', en: 'Retro' },
  depth: { pt: 'Profundidade', en: 'Depth' },
  outline: { pt: 'Contorno', en: 'Outline' },
}

const translations = {
  pt: {
    title: 'Gerador de Text Shadow',
    intro: (
      <>
        Monte sombras em texto (<Text code>text-shadow</Text>) com uma ou várias camadas,
        ajuste deslocamento, desfoque, cor e opacidade, e copie o CSS pronto.
        Ótimo para títulos, efeitos de brilho e contornos sem imagens.
      </>
    ),
    tipTitle: 'Como funciona (e as pegadinhas)',
    tipBody: (
      <>
        A sintaxe é <Text code>text-shadow: offset-x offset-y blur-radius cor</Text>.
        Diferente do <Text code>box-shadow</Text>, o <Text code>text-shadow</Text> não aceita
        <Text code>inset</Text> nem <Text code>spread</Text>. Camadas são aplicadas na ordem
        listada — a primeira fica por baixo e as seguintes por cima. Sombras com{' '}
        <Text code>blur: 0</Text> e offsets de ±1px são o truque clássico para simular um contorno.
      </>
    ),
    layers: 'Camadas',
    addLayer: 'Adicionar camada',
    removeLayer: 'Remover',
    previewText: 'Texto de preview',
    fontSize: 'Tamanho da fonte',
    offsetX: 'Deslocamento X',
    offsetY: 'Deslocamento Y',
    blur: 'Desfoque',
    opacity: 'Opacidade',
    color: 'Cor',
    preset: 'Preset',
    preview: 'Pré-visualização',
    previewHint: 'O texto abaixo usa exatamente o CSS gerado.',
    output: 'CSS gerado',
    copy: 'Copiar',
    copied: 'CSS copiado!',
    copyError: 'Não foi possível copiar',
    minLayers: 'É preciso ter pelo menos 1 camada.',
    sourceCol: 'Código-fonte',
    sourceBody:
      'O núcleo vive em src/utils/textShadowGenerator.js. hexToRgba converte hex + opacidade para rgba; buildLayerCss monta cada camada no formato offset-x offset-y blur cor; buildTextShadow une as camadas com vírgula; buildClassCss embrulha em uma classe pronta para colar.',
  },
  en: {
    title: 'Text Shadow Generator',
    intro: (
      <>
        Build <Text code>text-shadow</Text> effects with one or more layers,
        tweak offset, blur, color and opacity, then copy the ready-to-use CSS.
        Great for headings, glow effects and outlines without images.
      </>
    ),
    tipTitle: 'How it works (and the gotchas)',
    tipBody: (
      <>
        The syntax is <Text code>text-shadow: offset-x offset-y blur-radius color</Text>.
        Unlike <Text code>box-shadow</Text>, <Text code>text-shadow</Text> does not accept
        <Text code>inset</Text> or <Text code>spread</Text>. Layers are applied in the listed order —
        the first one sits at the bottom and later layers stack on top. Shadows with{' '}
        <Text code>blur: 0</Text> and ±1px offsets are the classic trick to fake an outline.
      </>
    ),
    layers: 'Layers',
    addLayer: 'Add layer',
    removeLayer: 'Remove',
    previewText: 'Preview text',
    fontSize: 'Font size',
    offsetX: 'Offset X',
    offsetY: 'Offset Y',
    blur: 'Blur',
    opacity: 'Opacity',
    color: 'Color',
    preset: 'Preset',
    preview: 'Preview',
    previewHint: 'The text below uses exactly the generated CSS.',
    output: 'Generated CSS',
    copy: 'Copy',
    copied: 'CSS copied!',
    copyError: 'Could not copy',
    minLayers: 'You need at least 1 layer.',
    sourceCol: 'Source code',
    sourceBody:
      'The core lives in src/utils/textShadowGenerator.js. hexToRgba converts hex + opacity to rgba; buildLayerCss formats each layer as offset-x offset-y blur color; buildTextShadow joins layers with commas; buildClassCss wraps everything in a paste-ready class.',
  },
}

export default function TextShadowGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [messageApi, messageContextHolder] = useMessage()

  const idCounter = useRef(0)
  const [layers, setLayers] = useState(() => [
    makeLayer(idCounter.current++, { x: 0, y: 4, blur: 12, opacity: 25 }),
  ])
  const [previewText, setPreviewText] = useState('DevTools')
  const [fontSize, setFontSize] = useState(64)
  const [previewColor, setPreviewColor] = useState('#ffffff')

  const textShadow = useMemo(() => buildTextShadow(layers), [layers])
  const classCss = useMemo(
    () => buildClassCss(layers, 'text-shadow', fontSize),
    [layers, fontSize]
  )

  const updateLayer = (id, patch) => {
    setLayers((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)))
  }

  const addLayer = () => {
    setLayers((prev) => [...prev, makeLayer(idCounter.current++)])
  }

  const removeLayer = (id) => {
    if (layers.length <= 1) {
      messageApi.warning(t.minLayers)
      return
    }
    setLayers((prev) => prev.filter((l) => l.id !== id))
  }

  const applyPreset = (key) => {
    const preset = PRESETS[key]
    if (!preset) return
    setLayers(preset.map((l) => makeLayer(idCounter.current++, l)))
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(classCss)
      messageApi.success(t.copied)
    } catch {
      messageApi.error(t.copyError)
    }
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {messageContextHolder}
      <Title level={2}><FontSizeOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Alert type="info" showIcon message={t.tipTitle} description={t.tipBody} />

      <Row gutter={[24, 24]}>
        <Col xs={24} md={10}>
          <Card title={t.layers}>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.preset}</Text>
                <Segmented
                  style={{ width: '100%' }}
                  block
                  value={null}
                  onChange={applyPreset}
                  options={PRESET_KEYS.map((key) => ({
                    value: key,
                    label: PRESET_LABEL[key][lang],
                  }))}
                />
              </Space>

              <Space direction="vertical" size={4} style={{ width: '100%', marginTop: 8 }}>
                <Text>{t.previewText}</Text>
                <Input value={previewText} onChange={(e) => setPreviewText(e.target.value)} maxLength={40} showCount />
              </Space>

              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                  <Text>{t.fontSize}</Text>
                  <Text code>{fontSize}px</Text>
                </Space>
                <Slider min={16} max={120} value={fontSize} onChange={setFontSize} />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>{t.color}</Text>
                <ColorPicker value={previewColor} onChange={(c) => setPreviewColor(c.toHexString())} showText />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between', marginTop: 8 }}>
                <Text strong>{t.layers}</Text>
                <Button size="small" icon={<PlusOutlined />} onClick={addLayer}>{t.addLayer}</Button>
              </Space>

              {layers.map((layer) => (
                <Card
                  key={layer.id}
                  size="small"
                  extra={
                    <Button size="small" danger icon={<DeleteOutlined />} onClick={() => removeLayer(layer.id)}>
                      {t.removeLayer}
                    </Button>
                  }
                >
                  <Space direction="vertical" style={{ width: '100%' }} size="small">
                    <Space wrap size="large">
                      <div style={{ width: 160 }}>
                        <Text>{t.offsetX}: {layer.x}px</Text>
                        <Slider min={-50} max={50} value={layer.x} onChange={(v) => updateLayer(layer.id, { x: v })} />
                      </div>
                      <div style={{ width: 160 }}>
                        <Text>{t.offsetY}: {layer.y}px</Text>
                        <Slider min={-50} max={50} value={layer.y} onChange={(v) => updateLayer(layer.id, { y: v })} />
                      </div>
                      <div style={{ width: 160 }}>
                        <Text>{t.blur}: {layer.blur}px</Text>
                        <Slider min={0} max={100} value={layer.blur} onChange={(v) => updateLayer(layer.id, { blur: v })} />
                      </div>
                      <div style={{ width: 160 }}>
                        <Text>{t.opacity}: {layer.opacity}%</Text>
                        <Slider min={0} max={100} value={layer.opacity} onChange={(v) => updateLayer(layer.id, { opacity: v })} />
                      </div>
                    </Space>
                    <Space align="center">
                      <Text>{t.color}:</Text>
                      <ColorPicker
                        value={layer.color}
                        onChange={(c) => updateLayer(layer.id, { color: c.toHexString() })}
                        showText
                      />
                    </Space>
                  </Space>
                </Card>
              ))}
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={14}>
          <Card title={t.preview}>
            <div
              style={{
                border: '1px solid #f0f0f0',
                borderRadius: 8,
                padding: 40,
                background: '#141414',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 220,
              }}
            >
              <div
                style={{
                  fontSize,
                  fontWeight: 700,
                  color: previewColor,
                  textShadow,
                  textAlign: 'center',
                  wordBreak: 'break-word',
                }}
              >
                {previewText || 'DevTools'}
              </div>
            </div>
            <Paragraph type="secondary" style={{ marginTop: 12, marginBottom: 0 }}>
              {t.previewHint}
            </Paragraph>
          </Card>
        </Col>
      </Row>

      <Card
        title={t.output}
        extra={<Button size="small" icon={<CopyOutlined />} onClick={copy}>{t.copy}</Button>}
      >
        <pre style={{ margin: 0, overflowX: 'auto' }}>
          <code>{classCss}</code>
        </pre>
      </Card>

      <Collapse
        items={[
          {
            key: 'source',
            label: `${t.sourceCol} — buildTextShadow / buildClassCss`,
            children: (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Paragraph type="secondary">{t.sourceBody}</Paragraph>
                <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 320 }}>
                  <code>{buildTextShadow.toString()}</code>
                </pre>
              </Space>
            ),
          },
        ]}
      />
    </Space>
  )
}
