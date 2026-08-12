import React, { useMemo, useRef, useState } from 'react'
import {
  Typography, Card, Space, Button, Slider, Alert, Collapse, message, ColorPicker,
  Row, Col, Input, Segmented, Radio,
} from 'antd'
import { BgColorsOutlined, CopyOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import { buildGradientTextCss, buildPreviewStyle, PRESETS } from '../utils/gradientTextGenerator'

const { Title, Paragraph, Text } = Typography
const { useMessage } = message

const PRESET_KEYS = ['sunset', 'ocean', 'forest', 'berry', 'midnight', 'citrus', 'neon', 'fire']

const PRESET_LABEL = {
  sunset: { pt: 'Pôr do sol', en: 'Sunset' },
  ocean: { pt: 'Oceano', en: 'Ocean' },
  forest: { pt: 'Floresta', en: 'Forest' },
  berry: { pt: 'Frutas vermelhas', en: 'Berry' },
  midnight: { pt: 'Meia-noite', en: 'Midnight' },
  citrus: { pt: 'Cítrico', en: 'Citrus' },
  neon: { pt: 'Neon', en: 'Neon' },
  fire: { pt: 'Fogo', en: 'Fire' },
}

function makeStop(id, color, position) {
  return { id, color, position }
}

const FONT_WEIGHTS = [300, 400, 500, 600, 700, 800, 900]

const translations = {
  pt: {
    title: 'Gerador de Texto com Gradiente CSS',
    intro: (
      <>
        Crie títulos com gradiente usando <Text code>background-clip: text</Text>.
        Ajuste cores, ângulo, tipografia e copie o CSS pronto para colar no projeto.
      </>
    ),
    tipTitle: 'Como funciona (e as pegadinhas)',
    tipBody: (
      <>
        O truque é combinar <Text code>background: linear-gradient(...)</Text> com{' '}
        <Text code>-webkit-background-clip: text</Text> e{' '}
        <Text code>-webkit-text-fill-color: transparent</Text>. Sempre defina uma{' '}
        <Text code>color</Text> de fallback para navegadores que não suportam o efeito.
        O elemento precisa ter <Text code>display</Text> diferente de <Text code>inline</Text>{' '}
        para o background-clip funcionar corretamente — por isso usamos <Text code>inline-block</Text>.
      </>
    ),
    preset: 'Preset',
    previewText: 'Texto de preview',
    fontSize: 'Tamanho da fonte',
    fontWeight: 'Peso da fonte',
    textAlign: 'Alinhamento',
    fallbackColor: 'Cor de fallback',
    gradientType: 'Tipo de gradiente',
    linear: 'Linear',
    radial: 'Radial',
    angle: 'Ângulo',
    stops: 'Stops de cor',
    addStop: 'Adicionar stop',
    position: 'Posição',
    remove: 'Remover',
    preview: 'Pré-visualização',
    previewHint: 'O texto abaixo usa exatamente o CSS gerado.',
    output: 'CSS gerado',
    copy: 'Copiar',
    copied: 'CSS copiado!',
    copyError: 'Não foi possível copiar',
    minStops: 'É preciso ter pelo menos 2 stops.',
    sourceCol: 'Código-fonte',
    sourceBody:
      'O núcleo vive em src/utils/gradientTextGenerator.js. buildGradientTextCss ordena os stops, monta o gradiente linear ou radial e embrulha as regras de background-clip/text-fill-color em uma classe pronta; buildPreviewStyle devolve o objeto de estilo para o preview ao vivo.',
  },
  en: {
    title: 'CSS Gradient Text Generator',
    intro: (
      <>
        Create gradient headings using <Text code>background-clip: text</Text>.
        Tweak colors, angle, typography and copy the ready-to-paste CSS.
      </>
    ),
    tipTitle: 'How it works (and the gotchas)',
    tipBody: (
      <>
        The trick is combining <Text code>background: linear-gradient(...)</Text> with{' '}
        <Text code>-webkit-background-clip: text</Text> and{' '}
        <Text code>-webkit-text-fill-color: transparent</Text>. Always set a fallback{' '}
        <Text code>color</Text> for browsers that do not support the effect.
        The element needs a <Text code>display</Text> other than <Text code>inline</Text>{' '}
        for background-clip to work — that is why we use <Text code>inline-block</Text>.
      </>
    ),
    preset: 'Preset',
    previewText: 'Preview text',
    fontSize: 'Font size',
    fontWeight: 'Font weight',
    textAlign: 'Alignment',
    fallbackColor: 'Fallback color',
    gradientType: 'Gradient type',
    linear: 'Linear',
    radial: 'Radial',
    angle: 'Angle',
    stops: 'Color stops',
    addStop: 'Add stop',
    position: 'Position',
    remove: 'Remove',
    preview: 'Preview',
    previewHint: 'The text below uses exactly the generated CSS.',
    output: 'Generated CSS',
    copy: 'Copy',
    copied: 'CSS copied!',
    copyError: 'Could not copy',
    minStops: 'You need at least 2 stops.',
    sourceCol: 'Source code',
    sourceBody:
      'The core lives in src/utils/gradientTextGenerator.js. buildGradientTextCss sorts the stops, builds the linear or radial gradient and wraps the background-clip/text-fill-color rules in a paste-ready class; buildPreviewStyle returns the style object for the live preview.',
  },
}

export default function GradientTextGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [messageApi, messageContextHolder] = useMessage()

  const idCounter = useRef(0)
  const [previewText, setPreviewText] = useState('DevTools')
  const [fontSize, setFontSize] = useState(72)
  const [fontWeight, setFontWeight] = useState(700)
  const [textAlign, setTextAlign] = useState('center')
  const [fallbackColor, setFallbackColor] = useState('#333333')
  const [gradientType, setGradientType] = useState('linear')
  const [angle, setAngle] = useState(90)
  const [stops, setStops] = useState(() => [
    makeStop(idCounter.current++, '#1677ff', 0),
    makeStop(idCounter.current++, '#eb2f96', 100),
  ])

  const gradient = useMemo(
    () => ({ type: gradientType, angle, stops }),
    [gradientType, angle, stops]
  )

  const previewStyle = useMemo(
    () => buildPreviewStyle({ gradient, fallbackColor }),
    [gradient, fallbackColor]
  )

  const fullCss = useMemo(
    () => buildGradientTextCss({ gradient, fontSize, fontWeight, textAlign, fallbackColor }),
    [gradient, fontSize, fontWeight, textAlign, fallbackColor]
  )

  const updateStop = (id, patch) => {
    setStops((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)))
  }

  const addStop = () => {
    setStops((prev) => [
      ...prev,
      makeStop(idCounter.current++, '#ffffff', 50),
    ])
  }

  const removeStop = (id) => {
    if (stops.length <= 2) {
      messageApi.warning(t.minStops)
      return
    }
    setStops((prev) => prev.filter((s) => s.id !== id))
  }

  const applyPreset = (key) => {
    const colors = PRESETS[key]
    if (!colors || colors.length < 2) return
    const step = 100 / (colors.length - 1)
    setStops(colors.map((color, idx) => makeStop(idCounter.current++, color, Math.round(idx * step))))
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(fullCss)
      messageApi.success(t.copied)
    } catch {
      messageApi.error(t.copyError)
    }
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {messageContextHolder}
      <Title level={2}><BgColorsOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Alert type="info" showIcon message={t.tipTitle} description={t.tipBody} />

      <Row gutter={[24, 24]}>
        <Col xs={24} md={10}>
          <Card>
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

              <Space direction="vertical" size={4} style={{ width: '100%' }}>
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

              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.fontWeight}</Text>
                <Segmented
                  value={fontWeight}
                  onChange={setFontWeight}
                  options={FONT_WEIGHTS.map((w) => ({ value: w, label: String(w) }))}
                />
              </Space>

              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.textAlign}</Text>
                <Radio.Group value={textAlign} onChange={(e) => setTextAlign(e.target.value)} optionType="button">
                  <Radio.Button value="left">left</Radio.Button>
                  <Radio.Button value="center">center</Radio.Button>
                  <Radio.Button value="right">right</Radio.Button>
                </Radio.Group>
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>{t.fallbackColor}</Text>
                <ColorPicker value={fallbackColor} onChange={(c) => setFallbackColor(c.toHexString())} showText />
              </Space>

              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.gradientType}</Text>
                <Radio.Group value={gradientType} onChange={(e) => setGradientType(e.target.value)} optionType="button">
                  <Radio.Button value="linear">{t.linear}</Radio.Button>
                  <Radio.Button value="radial">{t.radial}</Radio.Button>
                </Radio.Group>
              </Space>

              {gradientType === 'linear' && (
                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text>{t.angle}</Text>
                    <Text code>{angle}°</Text>
                  </Space>
                  <Slider min={0} max={360} value={angle} onChange={setAngle} />
                </Space>
              )}

              <Space style={{ width: '100%', justifyContent: 'space-between', marginTop: 8 }}>
                <Text strong>{t.stops}</Text>
                <Button size="small" icon={<PlusOutlined />} onClick={addStop}>{t.addStop}</Button>
              </Space>

              {stops.map((stop) => (
                <Card
                  key={stop.id}
                  size="small"
                  extra={
                    <Button size="small" danger icon={<DeleteOutlined />} onClick={() => removeStop(stop.id)}>
                      {t.remove}
                    </Button>
                  }
                >
                  <Space align="center" wrap>
                    <ColorPicker
                      value={stop.color}
                      onChange={(c) => updateStop(stop.id, { color: c.toHexString() })}
                      showText
                    />
                    <Text code>{stop.color}</Text>
                    <Text type="secondary">{t.position}:</Text>
                    <Slider
                      min={0}
                      max={100}
                      value={stop.position}
                      onChange={(v) => updateStop(stop.id, { position: v })}
                      style={{ width: 120 }}
                    />
                    <Text style={{ width: 40 }}>{stop.position}%</Text>
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
                background: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 220,
              }}
            >
              <div
                style={{
                  ...previewStyle,
                  fontSize,
                  fontWeight,
                  textAlign,
                  wordBreak: 'break-word',
                  display: 'inline-block',
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
          <code>{fullCss}</code>
        </pre>
      </Card>

      <Collapse
        items={[
          {
            key: 'source',
            label: `${t.sourceCol} — buildGradientTextCss / buildPreviewStyle`,
            children: (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Paragraph type="secondary">{t.sourceBody}</Paragraph>
                <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 320 }}>
                  <code>{buildGradientTextCss.toString()}</code>
                </pre>
              </Space>
            ),
          },
        ]}
      />
    </Space>
  )
}
