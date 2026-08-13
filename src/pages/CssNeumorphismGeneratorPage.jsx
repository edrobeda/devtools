import React, { useMemo, useState } from 'react'
import {
  Typography, Card, Space, Slider, Segmented, Alert, Button, Collapse,
  message, ColorPicker, Row, Col, Input, Switch, Tabs,
} from 'antd'
import { BgColorsOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  buildNeumorphismCss,
  buildNeumorphismHtml,
  buildNeumorphismFullDemo,
  PRESETS,
  DEFAULTS,
} from '../utils/cssNeumorphismGenerator'

const { Title, Paragraph, Text } = Typography
const { useMessage } = message

const SHAPE_OPTIONS = {
  pt: [
    { label: 'Elevado', value: 'raised' },
    { label: 'Pressionado', value: 'pressed' },
    { label: 'Côncavo', value: 'concave' },
    { label: 'Convexo', value: 'convex' },
  ],
  en: [
    { label: 'Raised', value: 'raised' },
    { label: 'Pressed', value: 'pressed' },
    { label: 'Concave', value: 'concave' },
    { label: 'Convex', value: 'convex' },
  ],
}

const DIRECTION_OPTIONS = {
  pt: [
    { label: '↖ Superior esquerdo', value: 'top-left' },
    { label: '↗ Superior direito', value: 'top-right' },
    { label: '↙ Inferior esquerdo', value: 'bottom-left' },
    { label: '↘ Inferior direito', value: 'bottom-right' },
  ],
  en: [
    { label: '↖ Top left', value: 'top-left' },
    { label: '↗ Top right', value: 'top-right' },
    { label: '↙ Bottom left', value: 'bottom-left' },
    { label: '↘ Bottom right', value: 'bottom-right' },
  ],
}

const PRESET_ORDER = [
  'lightSoft',
  'lightStrong',
  'darkSoft',
  'darkStrong',
  'minimal',
  'pressed',
  'concave',
  'convex',
]

const translations = {
  pt: {
    title: 'Gerador de Neumorfismo CSS',
    intro: (
      <>
        Crie elementos em estilo neumórfico / Soft UI usando só CSS: escolha a
        cor de fundo, direção da luz, profundidade, desfoque, intensidade e
        formato (elevado, pressionado, côncavo ou convexo). O preview usa o CSS
        exato que será copiado.
      </>
    ),
    tipTitle: 'Como funciona (e as pegadinhas)',
    tipBody: (
      <>
        O efeito neumórfico depende de duas sombras opostas — uma escura e uma
        clara — a partir da mesma cor do fundo. Para funcionar, o elemento
        precisa estar sobre um fundo da <Text code>{'cor exata'}</Text> usada
        nas sombras. Use <Text code>{'box-shadow'}</Text> com valores simétricos
        e, no estado pressionado, inverta para <Text code>{'inset'}</Text>.
        Cores muito claras ou muito escuras geram sombras fracas — prefira tons
        de cinza médio.
      </>
    ),
    settings: 'Configurações',
    shape: 'Formato',
    direction: 'Direção da luz',
    bgColor: 'Cor de fundo',
    textColor: 'Cor do texto',
    width: 'Largura (px)',
    height: 'Altura (px)',
    borderRadius: 'Border radius (px)',
    depth: 'Profundidade (px)',
    blur: 'Desfoque (px)',
    intensity: 'Intensidade das sombras (%)',
    transitionDuration: 'Duração da transição (ms)',
    content: 'Conteúdo de exemplo',
    titleLabel: 'Título',
    bodyLabel: 'Texto',
    buttonLabel: 'Botão',
    showButton: 'Mostrar botão',
    preview: 'Pré-visualização',
    previewHint: 'O elemento abaixo usa exatamente o CSS gerado — passe o mouse ou clique para testar.',
    outputCss: 'CSS gerado',
    outputHtml: 'HTML de exemplo',
    outputFull: 'Bloco completo',
    copy: 'Copiar',
    copied: 'Copiado!',
    copyError: 'Não foi possível copiar',
    presets: 'Presets',
    presetLabels: {
      lightSoft: 'Claro suave',
      lightStrong: 'Claro forte',
      darkSoft: 'Escuro suave',
      darkStrong: 'Escuro forte',
      minimal: 'Minimal',
      pressed: 'Pressionado',
      concave: 'Côncavo',
      convex: 'Convexo',
    },
    sourceCol: 'Código-fonte',
    sourceBody:
      'O núcleo vive em src/utils/cssNeumorphismGenerator.js. shadeColor clareia/escurece a cor base; buildNeumorphismCss calcula os deslocamentos conforme a direção da luz e monta as sombras normais ou inset para cada formato.',
  },
  en: {
    title: 'CSS Neumorphism Generator',
    intro: (
      <>
        Create neumorphic / Soft UI elements using only CSS: pick the
        background color, light direction, depth, blur, shadow intensity and
        shape (raised, pressed, concave or convex). The preview uses the exact
        CSS that will be copied.
      </>
    ),
    tipTitle: 'How it works (and the gotchas)',
    tipBody: (
      <>
        The neumorphic effect relies on two opposing shadows — one dark, one
        light — derived from the same background color. For it to work, the
        element must sit on a background of the <Text code>{'exact color'}</Text>{' '}
        used in the shadows. Use symmetric <Text code>{'box-shadow'}</Text>{' '}
        values and, for the pressed state, flip to <Text code>{'inset'}</Text>.
        Very light or very dark colors produce weak shadows — medium gray tones
        work best.
      </>
    ),
    settings: 'Settings',
    shape: 'Shape',
    direction: 'Light direction',
    bgColor: 'Background color',
    textColor: 'Text color',
    width: 'Width (px)',
    height: 'Height (px)',
    borderRadius: 'Border radius (px)',
    depth: 'Depth (px)',
    blur: 'Blur (px)',
    intensity: 'Shadow intensity (%)',
    transitionDuration: 'Transition duration (ms)',
    content: 'Sample content',
    titleLabel: 'Title',
    bodyLabel: 'Text',
    buttonLabel: 'Button',
    showButton: 'Show button',
    preview: 'Preview',
    previewHint: 'The element below uses exactly the generated CSS — hover or click to test.',
    outputCss: 'Generated CSS',
    outputHtml: 'Example HTML',
    outputFull: 'Full block',
    copy: 'Copy',
    copied: 'Copied!',
    copyError: 'Could not copy',
    presets: 'Presets',
    presetLabels: {
      lightSoft: 'Light soft',
      lightStrong: 'Light strong',
      darkSoft: 'Dark soft',
      darkStrong: 'Dark strong',
      minimal: 'Minimal',
      pressed: 'Pressed',
      concave: 'Concave',
      convex: 'Convex',
    },
    sourceCol: 'Source code',
    sourceBody:
      'The core lives in src/utils/cssNeumorphismGenerator.js. shadeColor lightens/darkens the base color; buildNeumorphismCss computes offsets based on light direction and builds normal or inset shadows for each shape.',
  },
}

export default function CssNeumorphismGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [messageApi, messageContextHolder] = useMessage()

  const [shape, setShape] = useState(DEFAULTS.shape)
  const [direction, setDirection] = useState(DEFAULTS.direction)
  const [bgColor, setBgColor] = useState(DEFAULTS.bgColor)
  const [textColor, setTextColor] = useState(DEFAULTS.textColor)
  const [width, setWidth] = useState(DEFAULTS.width)
  const [height, setHeight] = useState(DEFAULTS.height)
  const [borderRadius, setBorderRadius] = useState(DEFAULTS.borderRadius)
  const [depth, setDepth] = useState(DEFAULTS.depth)
  const [blur, setBlur] = useState(DEFAULTS.blur)
  const [intensity, setIntensity] = useState(DEFAULTS.intensity)
  const [transitionDuration, setTransitionDuration] = useState(DEFAULTS.transitionDuration)
  const [showButton, setShowButton] = useState(DEFAULTS.showButton)
  const [titleText, setTitleText] = useState('Soft UI')
  const [bodyText, setBodyText] = useState('Neumorphism card')
  const [buttonText, setButtonText] = useState('Button')

  const settings = useMemo(
    () => ({
      shape,
      direction,
      bgColor,
      textColor,
      width,
      height,
      borderRadius,
      depth,
      blur,
      intensity,
      transitionDuration,
      showButton,
      title: titleText,
      body: bodyText,
      buttonText,
    }),
    [
      shape,
      direction,
      bgColor,
      textColor,
      width,
      height,
      borderRadius,
      depth,
      blur,
      intensity,
      transitionDuration,
      showButton,
      titleText,
      bodyText,
      buttonText,
    ]
  )

  const cssOutput = useMemo(() => buildNeumorphismCss(settings), [settings])
  const htmlOutput = useMemo(() => buildNeumorphismHtml(settings), [settings])
  const fullOutput = useMemo(() => buildNeumorphismFullDemo(settings), [settings])

  const applyPreset = (key) => {
    const p = PRESETS[key]
    if (!p) return
    setShape(p.shape)
    setDirection(p.direction)
    setBgColor(p.bgColor)
    setTextColor(p.textColor)
    setDepth(p.depth)
    setBlur(p.blur)
    setIntensity(p.intensity)
    setBorderRadius(p.borderRadius)
  }

  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
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
              <Text strong>{t.presets}</Text>
              <Segmented
                style={{ width: '100%' }}
                block
                value={null}
                onChange={applyPreset}
                options={PRESET_ORDER.map((key) => ({
                  value: key,
                  label: t.presetLabels[key] || key,
                }))}
              />

              <Space direction="vertical" size={4} style={{ width: '100%', marginTop: 8 }}>
                <Text>{t.shape}</Text>
                <Segmented
                  style={{ width: '100%' }}
                  block
                  value={shape}
                  onChange={setShape}
                  options={SHAPE_OPTIONS[lang]}
                />
              </Space>

              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.direction}</Text>
                <Segmented
                  style={{ width: '100%' }}
                  block
                  value={direction}
                  onChange={setDirection}
                  options={DIRECTION_OPTIONS[lang]}
                />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>{t.bgColor}</Text>
                <ColorPicker value={bgColor} onChange={setBgColor} showText />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>{t.textColor}</Text>
                <ColorPicker value={textColor} onChange={setTextColor} showText />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.width}</Text>
                <Text code>{width}px</Text>
              </Space>
              <Slider min={80} max={400} value={width} onChange={setWidth} />

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.height}</Text>
                <Text code>{height}px</Text>
              </Space>
              <Slider min={40} max={300} value={height} onChange={setHeight} />

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.borderRadius}</Text>
                <Text code>{borderRadius}px</Text>
              </Space>
              <Slider min={0} max={80} value={borderRadius} onChange={setBorderRadius} />

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.depth}</Text>
                <Text code>{depth}px</Text>
              </Space>
              <Slider min={0} max={48} value={depth} onChange={setDepth} />

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.blur}</Text>
                <Text code>{blur}px</Text>
              </Space>
              <Slider min={0} max={80} value={blur} onChange={setBlur} />

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.intensity}</Text>
                <Text code>{intensity}%</Text>
              </Space>
              <Slider min={0} max={60} value={intensity} onChange={setIntensity} />

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.transitionDuration}</Text>
                <Text code>{transitionDuration}ms</Text>
              </Space>
              <Slider min={0} max={1000} value={transitionDuration} onChange={setTransitionDuration} />

              <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>{t.showButton}</Text>
                <Switch size="small" checked={showButton} onChange={setShowButton} />
              </Space>

              <Space direction="vertical" size={4} style={{ width: '100%', marginTop: 8 }}>
                <Text strong>{t.content}</Text>
                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                  <Text>{t.titleLabel}</Text>
                  <Input value={titleText} onChange={(e) => setTitleText(e.target.value)} />
                </Space>
                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                  <Text>{t.bodyLabel}</Text>
                  <Input value={bodyText} onChange={(e) => setBodyText(e.target.value)} />
                </Space>
                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                  <Text>{t.buttonLabel}</Text>
                  <Input value={buttonText} onChange={(e) => setButtonText(e.target.value)} />
                </Space>
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
                background: '#fafafa',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 320,
              }}
            >
              <style>{cssOutput}</style>
              <div className="neu-wrapper">
                <div className="neu">
                  <div className="neu__content">
                    <div className="neu__title">{titleText}</div>
                    <div>{bodyText}</div>
                    {showButton && <button className="neu__button">{buttonText}</button>}
                  </div>
                </div>
              </div>
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
            label: `${t.sourceCol} — buildNeumorphismCss / buildNeumorphismHtml`,
            children: (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Paragraph type="secondary">{t.sourceBody}</Paragraph>
                <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 320 }}>
                  <code>{buildNeumorphismCss.toString()}</code>
                </pre>
              </Space>
            ),
          },
        ]}
      />
    </Space>
  )
}
