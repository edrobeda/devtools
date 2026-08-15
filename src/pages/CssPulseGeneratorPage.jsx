import React, { useMemo, useState } from 'react'
import {
  Typography, Card, Space, Slider, Segmented, Alert, Button, Collapse,
  message, ColorPicker, Row, Col, Input, Switch, Tabs, InputNumber,
} from 'antd'
import { BgColorsOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  buildPulseCss,
  buildPulseHtml,
  buildPulseFullDemo,
  buildPreviewStyle,
  buildPreviewKeyframes,
  PRESETS,
  DEFAULTS,
} from '../utils/cssPulseGenerator'

const { Title, Paragraph, Text } = Typography
const { useMessage } = message

const EASING_OPTIONS = [
  { label: 'ease-out', value: 'ease-out' },
  { label: 'ease-in-out', value: 'ease-in-out' },
  { label: 'linear', value: 'linear' },
  { label: 'ease', value: 'ease' },
]

const PRESET_ORDER = ['default', 'soft-blue', 'success', 'warning', 'error', 'ripple']

const translations = {
  pt: {
    title: 'Gerador de Efeito Pulse CSS',
    intro: (
      <>
        Crie animações de pulsação usando só CSS: um elemento escala e emite
        ondas de <Text code>box-shadow</Text> que se dissipam. Ideal para
        indicadores de status, notificações não lidas, botões de call-to-action
        e estados de loading.
      </>
    ),
    tipTitle: 'Como funciona',
    tipBody: (
      <>
        A animação combina <Text code>transform: scale()</Text> com{' '}
        <Text code>box-shadow</Text> cujo blur é zero e o spread cresce — isso
        cria um anel sólido que parece uma onda saindo do elemento. Use cores
        com opacidade média no início e zero no final para o efeito ficar
        suave. O preview usa exatamente o CSS gerado.
      </>
    ),
    settings: 'Configurações',
    presets: 'Código gerado',
    preview: 'Pré-visualização',
    previewHint: 'O bloco abaixo usa exatamente o CSS gerado. Ajuste os controles e veja a pulsação em tempo real.',
    color: 'Cor principal',
    size: 'Tamanho do elemento (px)',
    borderRadius: 'Arredondamento (%)',
    duration: 'Duração da animação (s)',
    scale: 'Escala máxima',
    startOpacity: 'Opacidade inicial da onda',
    finalOpacity: 'Opacidade final da onda',
    waves: 'Número de ondas',
    infinite: 'Loop infinito',
    easing: 'Curva de easing',
    className: 'Nome da classe CSS',
    outputCss: 'CSS gerado',
    outputHtml: 'HTML de exemplo',
    outputFull: 'Bloco completo',
    copy: 'Copiar',
    copied: 'Copiado!',
    copyError: 'Não foi possível copiar',
    sourceCol: 'Código-fonte',
    sourceBody:
      'O núcleo vive em src/utils/cssPulseGenerator.js. buildPulseCss monta as regras de .pulse e os keyframes com paradas distribuídas para cada onda; buildPulseHtml gera o markup, buildPulseFullDemo monta um documento completo e buildPreviewStyle retorna o objeto de estilo inline usado pelo preview ao vivo.',
  },
  en: {
    title: 'CSS Pulse Effect Generator',
    intro: (
      <>
        Create pulse animations using only CSS: an element scales while emitting
        fading <Text code>box-shadow</Text> rings. Perfect for status indicators,
        unread badges, call-to-action buttons and loading states.
      </>
    ),
    tipTitle: 'How it works',
    tipBody: (
      <>
        The animation combines <Text code>transform: scale()</Text> with a{' '}
        <Text code>box-shadow</Text> that has zero blur and an increasing spread
        — creating a solid ring that looks like a wave leaving the element. Use
        colors with medium starting opacity and zero ending opacity for a smooth
        effect. The preview uses the exact generated CSS.
      </>
    ),
    settings: 'Settings',
    presets: 'Generated code',
    preview: 'Preview',
    previewHint: 'The block below uses the exact generated CSS. Adjust the controls and watch the pulse update in real time.',
    color: 'Main color',
    size: 'Element size (px)',
    borderRadius: 'Border radius (%)',
    duration: 'Animation duration (s)',
    scale: 'Max scale',
    startOpacity: 'Initial wave opacity',
    finalOpacity: 'Final wave opacity',
    waves: 'Number of waves',
    infinite: 'Infinite loop',
    easing: 'Easing curve',
    className: 'CSS class name',
    outputCss: 'Generated CSS',
    outputHtml: 'Example HTML',
    outputFull: 'Full block',
    copy: 'Copy',
    copied: 'Copied!',
    copyError: 'Could not copy',
    sourceCol: 'Source code',
    sourceBody:
      'The core lives in src/utils/cssPulseGenerator.js. buildPulseCss builds the .pulse rules and keyframes with distributed stops for each wave; buildPulseHtml generates the markup, buildPulseFullDemo assembles a full document and buildPreviewStyle returns the inline style object used by the live preview.',
  },
}

export default function CssPulseGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [messageApi, messageContextHolder] = useMessage()

  const [color, setColor] = useState(DEFAULTS.color)
  const [size, setSize] = useState(DEFAULTS.size)
  const [borderRadius, setBorderRadius] = useState(DEFAULTS.borderRadius)
  const [duration, setDuration] = useState(DEFAULTS.duration)
  const [scale, setScale] = useState(DEFAULTS.scale)
  const [startOpacity, setStartOpacity] = useState(DEFAULTS.startOpacity)
  const [finalOpacity, setFinalOpacity] = useState(DEFAULTS.finalOpacity)
  const [waves, setWaves] = useState(DEFAULTS.waves)
  const [infinite, setInfinite] = useState(DEFAULTS.infinite)
  const [easing, setEasing] = useState(DEFAULTS.easing)
  const [className, setClassName] = useState(DEFAULTS.className)

  const applyPreset = (key) => {
    const p = PRESETS[key]
    if (!p) return
    setColor(p.color)
    setSize(p.size)
    setBorderRadius(p.borderRadius)
    setDuration(p.duration)
    setScale(p.scale)
    setStartOpacity(p.startOpacity)
    setFinalOpacity(p.finalOpacity)
    setWaves(p.waves)
    setInfinite(p.infinite)
    setEasing(p.easing)
  }

  const settings = useMemo(
    () => ({
      color,
      size,
      borderRadius,
      duration,
      scale,
      startOpacity,
      finalOpacity,
      waves,
      infinite,
      easing,
      className,
    }),
    [
      color,
      size,
      borderRadius,
      duration,
      scale,
      startOpacity,
      finalOpacity,
      waves,
      infinite,
      easing,
      className,
    ]
  )

  const cssOutput = useMemo(() => buildPulseCss(settings), [settings])
  const htmlOutput = useMemo(() => buildPulseHtml(settings), [settings])
  const fullOutput = useMemo(() => buildPulseFullDemo(settings), [settings])
  const previewStyle = useMemo(() => buildPreviewStyle(settings), [settings])
  const previewKeyframes = useMemo(() => buildPreviewKeyframes(settings), [settings])

  const copy = async (value) => {
    try {
      await navigator.clipboard.writeText(value)
      messageApi.success(t.copied)
    } catch {
      messageApi.error(t.copyError)
    }
  }

  const outputTabs = [
    {
      key: 'css',
      label: t.outputCss,
      children: (
        <pre style={{ margin: 0, overflowX: 'auto' }}>
          <code>{cssOutput}</code>
        </pre>
      ),
    },
    {
      key: 'html',
      label: t.outputHtml,
      children: (
        <pre style={{ margin: 0, overflowX: 'auto' }}>
          <code>{htmlOutput}</code>
        </pre>
      ),
    },
    {
      key: 'full',
      label: t.outputFull,
      children: (
        <pre style={{ margin: 0, overflowX: 'auto' }}>
          <code>{fullOutput}</code>
        </pre>
      ),
    },
  ]

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {messageContextHolder}
      <Title level={2}><BgColorsOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Alert type="info" showIcon message={t.tipTitle} description={t.tipBody} />

      <Row gutter={[24, 24]}>
        <Col xs={24} md={10}>
          <Card title={t.settings}>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Segmented
                style={{ width: '100%' }}
                block
                value={null}
                onChange={applyPreset}
                options={PRESET_ORDER.map((key) => ({
                  value: key,
                  label: key.charAt(0).toUpperCase() + key.slice(1).replace(/-/g, ' '),
                }))}
              />

              <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                <Text>{t.color}</Text>
                <ColorPicker value={color} onChange={setColor} showText />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.size}</Text>
                <Text code>{size}px</Text>
              </Space>
              <Slider min={16} max={200} step={4} value={size} onChange={setSize} />

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.borderRadius}</Text>
                <Text code>{borderRadius}%</Text>
              </Space>
              <Slider min={0} max={50} step={1} value={borderRadius} onChange={setBorderRadius} />

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.duration}</Text>
                <Text code>{duration.toFixed(1)}s</Text>
              </Space>
              <Slider min={0.3} max={5} step={0.1} value={duration} onChange={setDuration} />

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.scale}</Text>
                <Text code>{scale.toFixed(2)}</Text>
              </Space>
              <Slider min={1} max={3} step={0.05} value={scale} onChange={setScale} />

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.startOpacity}</Text>
                <Text code>{startOpacity.toFixed(2)}</Text>
              </Space>
              <Slider min={0} max={1} step={0.05} value={startOpacity} onChange={setStartOpacity} />

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.finalOpacity}</Text>
                <Text code>{finalOpacity.toFixed(2)}</Text>
              </Space>
              <Slider min={0} max={1} step={0.05} value={finalOpacity} onChange={setFinalOpacity} />

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.waves}</Text>
                <Text code>{Math.round(waves)}</Text>
              </Space>
              <Slider min={1} max={5} step={1} value={waves} onChange={setWaves} />

              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.easing}</Text>
                <Segmented
                  style={{ width: '100%' }}
                  block
                  value={easing}
                  onChange={setEasing}
                  options={EASING_OPTIONS}
                />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>{t.infinite}</Text>
                <Switch size="small" checked={infinite} onChange={setInfinite} />
              </Space>

              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.className}</Text>
                <Input value={className} onChange={(e) => setClassName(e.target.value)} />
              </Space>
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={14}>
          <Card title={t.preview}>
            <div
              style={{
                border: '1px solid #f0f0f0',
                borderRadius: 8,
                padding: 32,
                minHeight: 260,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#fafafa',
              }}
            >
              <style>{previewKeyframes}</style>
              <div style={previewStyle} />
            </div>
            <Paragraph type="secondary" style={{ marginTop: 12, marginBottom: 0 }}>
              {t.previewHint}
            </Paragraph>
          </Card>
        </Col>
      </Row>

      <Card
        title={t.presets}
        extra={
          <Button size="small" icon={<CopyOutlined />} onClick={() => copy(cssOutput)}>
            {t.copy}
          </Button>
        }
      >
        <Tabs
          items={outputTabs}
          tabBarExtraContent={
            <Button size="small" icon={<CopyOutlined />} onClick={() => copy(fullOutput)}>
              {t.copy}
            </Button>
          }
        />
      </Card>

      <Collapse
        items={[
          {
            key: 'source',
            label: `${t.sourceCol} — buildPulseCss / buildPulseHtml`,
            children: (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Paragraph type="secondary">{t.sourceBody}</Paragraph>
                <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 320 }}>
                  <code>{buildPulseCss.toString()}</code>
                </pre>
              </Space>
            ),
          },
        ]}
      />
    </Space>
  )
}
