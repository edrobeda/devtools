import React, { useMemo, useState } from 'react'
import {
  Typography, Card, Space, Slider, Segmented, Alert, Button, Collapse,
  message, ColorPicker, Row, Col, Input, Switch, Tabs,
} from 'antd'
import { FontSizeOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  buildTextStrokeCss,
  buildTextStrokeHtml,
  buildTextStrokeFullDemo,
  buildPreviewStyle,
  PRESETS,
  DEFAULTS,
} from '../utils/cssTextStrokeGenerator'

const { Title, Paragraph, Text } = Typography
const { useMessage } = message

const POSITION_OPTIONS = {
  pt: [
    { label: 'Centro', value: 'center' },
    { label: 'Externo', value: 'outside' },
    { label: 'Interno', value: 'inside' },
  ],
  en: [
    { label: 'Center', value: 'center' },
    { label: 'Outside', value: 'outside' },
    { label: 'Inside', value: 'inside' },
  ],
}

const TRANSFORM_OPTIONS = {
  pt: [
    { label: 'Normal', value: 'none' },
    { label: 'Maiúsculas', value: 'uppercase' },
    { label: 'Minúsculas', value: 'lowercase' },
    { label: 'Capitalizar', value: 'capitalize' },
  ],
  en: [
    { label: 'None', value: 'none' },
    { label: 'Uppercase', value: 'uppercase' },
    { label: 'Lowercase', value: 'lowercase' },
    { label: 'Capitalize', value: 'capitalize' },
  ],
}

const ALIGN_OPTIONS = {
  pt: [
    { label: 'Esquerda', value: 'left' },
    { label: 'Centro', value: 'center' },
    { label: 'Direita', value: 'right' },
  ],
  en: [
    { label: 'Left', value: 'left' },
    { label: 'Center', value: 'center' },
    { label: 'Right', value: 'right' },
  ],
}

const PRESET_ORDER = ['default', 'neon', 'poster', 'hollow', 'retro', 'elegant']

const translations = {
  pt: {
    title: 'Gerador de Texto com Contorno CSS',
    intro: (
      <>
        Crie títulos e textos com contorno/outlined usando só CSS. Controle a cor
        de preenchimento, a cor e espessura do contorno, a posição do traço
        (centro, externo ou interno), sombra de glow e tipografia. O preview
        usa exatamente o CSS gerado, então você vê o resultado final em tempo
        real.
      </>
    ),
    tipTitle: 'Como funciona (e as pegadinhas)',
    tipBody: (
      <>
        A técnica principal é <Text code>-webkit-text-stroke</Text>, que desenha
        o contorno centrado no glifo. Para um contorno aparentemente "externo",
        use múltiplas sombras <Text code>text-shadow</Text> em várias direções —
        funciona em qualquer navegador, mas exige espessuras pequenas. Para
        "interno", combine <Text code>-webkit-text-stroke</Text> com{' '}
        <Text code>paint-order: stroke fill</Text>, que pinta o preenchimento por
        cima do traço. Sempre defina <Text code>-webkit-text-fill-color</Text>{' '}
        junto com <Text code>color</Text> para manter o preenchimento consistente.
      </>
    ),
    settings: 'Configurações',
    presets: 'Código gerado',
    text: 'Texto',
    fontSize: 'Tamanho da fonte (px)',
    fontWeight: 'Peso da fonte',
    letterSpacing: 'Espaçamento entre letras (px)',
    lineHeight: 'Altura da linha',
    textTransform: 'Transformação de texto',
    textAlign: 'Alinhamento',
    fillColor: 'Cor de preenchimento',
    strokeColor: 'Cor do contorno',
    strokeWidth: 'Espessura do contorno (px)',
    strokePosition: 'Posição do contorno',
    useShadowStack: 'Contorno denso (mais preciso, mais CSS)',
    shadowBlur: 'Glow/blur da sombra (px)',
    shadowColor: 'Cor do glow',
    backgroundColor: 'Cor de fundo do preview',
    className: 'Nome da classe CSS',
    preview: 'Pré-visualização',
    previewHint: 'O texto abaixo usa exatamente o CSS gerado. Ajuste os controles e veja o efeito em tempo real.',
    outputCss: 'CSS gerado',
    outputHtml: 'HTML de exemplo',
    outputFull: 'Bloco completo',
    copy: 'Copiar',
    copied: 'Copiado!',
    copyError: 'Não foi possível copiar',
    sourceCol: 'Código-fonte',
    sourceBody:
      'O núcleo vive em src/utils/cssTextStrokeGenerator.js. buildTextStrokeCss monta as regras de .outlined-text usando -webkit-text-stroke, text-shadow ou paint-order conforme a posição escolhida; buildTextStrokeHtml gera o markup semântico e buildPreviewStyle retorna o objeto de estilo inline usado no preview ao vivo.',
  },
  en: {
    title: 'CSS Text Stroke / Outline Generator',
    intro: (
      <>
        Create outlined text and headings using only CSS. Control the fill color,
        stroke color and width, stroke position (center, outside or inside), glow
        shadow and typography. The preview uses the exact generated CSS, so you
        see the final result in real time.
      </>
    ),
    tipTitle: 'How it works (and the gotchas)',
    tipBody: (
      <>
        The main technique is <Text code>-webkit-text-stroke</Text>, which draws
        a stroke centered on the glyph. For an apparently "outside" stroke, use
        multiple <Text code>text-shadow</Text> directions — it works in every
        browser, but works best with small widths. For "inside", combine{' '}
        <Text code>-webkit-text-stroke</Text> with{' '}
        <Text code>paint-order: stroke fill</Text>, which paints the fill over the
        stroke. Always set <Text code>-webkit-text-fill-color</Text> alongside{' '}
        <Text code>color</Text> to keep the fill consistent.
      </>
    ),
    settings: 'Settings',
    presets: 'Generated code',
    text: 'Text',
    fontSize: 'Font size (px)',
    fontWeight: 'Font weight',
    letterSpacing: 'Letter spacing (px)',
    lineHeight: 'Line height',
    textTransform: 'Text transform',
    textAlign: 'Text align',
    fillColor: 'Fill color',
    strokeColor: 'Stroke color',
    strokeWidth: 'Stroke width (px)',
    strokePosition: 'Stroke position',
    useShadowStack: 'Dense outline (more precise, more CSS)',
    shadowBlur: 'Glow/blur shadow (px)',
    shadowColor: 'Glow color',
    backgroundColor: 'Preview background color',
    className: 'CSS class name',
    preview: 'Preview',
    previewHint: 'The text below uses the exact generated CSS. Adjust the controls and see the effect in real time.',
    outputCss: 'Generated CSS',
    outputHtml: 'Example HTML',
    outputFull: 'Full block',
    copy: 'Copy',
    copied: 'Copied!',
    copyError: 'Could not copy',
    sourceCol: 'Source code',
    sourceBody:
      'The core lives in src/utils/cssTextStrokeGenerator.js. buildTextStrokeCss builds the .outlined-text rules using -webkit-text-stroke, text-shadow or paint-order depending on the chosen position; buildTextStrokeHtml generates the semantic markup and buildPreviewStyle returns the inline style object used by the live preview.',
  },
}

export default function CssTextStrokeGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [messageApi, messageContextHolder] = useMessage()

  const [text, setText] = useState(DEFAULTS.text)
  const [fontSize, setFontSize] = useState(DEFAULTS.fontSize)
  const [fontWeight, setFontWeight] = useState(DEFAULTS.fontWeight)
  const [letterSpacing, setLetterSpacing] = useState(DEFAULTS.letterSpacing)
  const [lineHeight, setLineHeight] = useState(DEFAULTS.lineHeight)
  const [textTransform, setTextTransform] = useState(DEFAULTS.textTransform)
  const [textAlign, setTextAlign] = useState(DEFAULTS.textAlign)
  const [fillColor, setFillColor] = useState(DEFAULTS.fillColor)
  const [strokeColor, setStrokeColor] = useState(DEFAULTS.strokeColor)
  const [strokeWidth, setStrokeWidth] = useState(DEFAULTS.strokeWidth)
  const [strokePosition, setStrokePosition] = useState(DEFAULTS.strokePosition)
  const [useShadowStack, setUseShadowStack] = useState(DEFAULTS.useShadowStack)
  const [shadowBlur, setShadowBlur] = useState(DEFAULTS.shadowBlur)
  const [shadowColor, setShadowColor] = useState(DEFAULTS.shadowColor)
  const [backgroundColor, setBackgroundColor] = useState(DEFAULTS.backgroundColor)
  const [className, setClassName] = useState(DEFAULTS.className)

  const applyPreset = (key) => {
    const p = PRESETS[key]
    if (!p) return
    setText(p.text)
    setFontSize(p.fontSize)
    setFontWeight(p.fontWeight)
    setLetterSpacing(p.letterSpacing)
    setLineHeight(p.lineHeight)
    setTextTransform(p.textTransform)
    setTextAlign(p.textAlign)
    setFillColor(p.fillColor)
    setStrokeColor(p.strokeColor)
    setStrokeWidth(p.strokeWidth)
    setStrokePosition(p.strokePosition)
    setUseShadowStack(p.useShadowStack)
    setShadowBlur(p.shadowBlur)
    setShadowColor(p.shadowColor)
    setBackgroundColor(p.backgroundColor)
  }

  const settings = useMemo(
    () => ({
      text,
      fontSize,
      fontWeight,
      letterSpacing,
      lineHeight,
      textTransform,
      textAlign,
      fillColor,
      strokeColor,
      strokeWidth,
      strokePosition,
      useShadowStack,
      shadowBlur,
      shadowColor,
      className,
    }),
    [
      text,
      fontSize,
      fontWeight,
      letterSpacing,
      lineHeight,
      textTransform,
      textAlign,
      fillColor,
      strokeColor,
      strokeWidth,
      strokePosition,
      useShadowStack,
      shadowBlur,
      shadowColor,
      className,
    ]
  )

  const cssOutput = useMemo(() => buildTextStrokeCss(settings), [settings])
  const htmlOutput = useMemo(() => buildTextStrokeHtml(settings), [settings])
  const fullOutput = useMemo(() => buildTextStrokeFullDemo(settings), [settings])
  const previewStyle = useMemo(() => buildPreviewStyle(settings), [settings])

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
      <Title level={2}><FontSizeOutlined /> {t.title}</Title>
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
                  label: key.charAt(0).toUpperCase() + key.slice(1),
                }))}
              />

              <Space direction="vertical" size={4} style={{ width: '100%', marginTop: 8 }}>
                <Text>{t.text}</Text>
                <Input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={t.text}
                />
              </Space>

              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.strokePosition}</Text>
                <Segmented
                  style={{ width: '100%' }}
                  block
                  value={strokePosition}
                  onChange={setStrokePosition}
                  options={POSITION_OPTIONS[lang]}
                />
              </Space>

              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.textTransform}</Text>
                <Segmented
                  style={{ width: '100%' }}
                  block
                  value={textTransform}
                  onChange={setTextTransform}
                  options={TRANSFORM_OPTIONS[lang]}
                />
              </Space>

              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.textAlign}</Text>
                <Segmented
                  style={{ width: '100%' }}
                  block
                  value={textAlign}
                  onChange={setTextAlign}
                  options={ALIGN_OPTIONS[lang]}
                />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>{t.fillColor}</Text>
                <ColorPicker value={fillColor} onChange={setFillColor} showText />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>{t.strokeColor}</Text>
                <ColorPicker value={strokeColor} onChange={setStrokeColor} showText />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>{t.shadowColor}</Text>
                <ColorPicker value={shadowColor} onChange={setShadowColor} showText />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>{t.backgroundColor}</Text>
                <ColorPicker value={backgroundColor} onChange={setBackgroundColor} showText />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.strokeWidth}</Text>
                <Text code>{strokeWidth}px</Text>
              </Space>
              <Slider min={0} max={12} step={1} value={strokeWidth} onChange={setStrokeWidth} />

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.fontSize}</Text>
                <Text code>{fontSize}px</Text>
              </Space>
              <Slider min={16} max={140} value={fontSize} onChange={setFontSize} />

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.fontWeight}</Text>
                <Text code>{fontWeight}</Text>
              </Space>
              <Slider min={100} max={900} step={100} value={fontWeight} onChange={setFontWeight} />

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.letterSpacing}</Text>
                <Text code>{letterSpacing}px</Text>
              </Space>
              <Slider min={-4} max={24} value={letterSpacing} onChange={setLetterSpacing} />

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.lineHeight}</Text>
                <Text code>{lineHeight.toFixed(1)}</Text>
              </Space>
              <Slider min={0.8} max={2} step={0.1} value={lineHeight} onChange={setLineHeight} />

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.shadowBlur}</Text>
                <Text code>{shadowBlur}px</Text>
              </Space>
              <Slider min={0} max={60} value={shadowBlur} onChange={setShadowBlur} />

              {strokePosition === 'outside' && (
                <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text>{t.useShadowStack}</Text>
                  <Switch size="small" checked={useShadowStack} onChange={setUseShadowStack} />
                </Space>
              )}

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
                padding: 40,
                background: backgroundColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 240,
                overflow: 'hidden',
              }}
            >
              <h1 style={previewStyle}>{text || DEFAULTS.text}</h1>
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
            label: `${t.sourceCol} — buildTextStrokeCss / buildTextStrokeHtml`,
            children: (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Paragraph type="secondary">{t.sourceBody}</Paragraph>
                <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 320 }}>
                  <code>{buildTextStrokeCss.toString()}</code>
                </pre>
              </Space>
            ),
          },
        ]}
      />
    </Space>
  )
}
