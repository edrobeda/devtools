import React, { useMemo, useState } from 'react'
import {
  Typography, Card, Space, Slider, Segmented, Alert, Button, Collapse,
  message, ColorPicker, Row, Col, Input, Tabs, Switch,
} from 'antd'
import { BgColorsOutlined, CopyOutlined, PlayCircleOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  buildCarouselCss,
  buildCarouselHtml,
  buildCarouselFullDemo,
  PRESETS,
  DEFAULTS,
} from '../utils/cssCarouselGenerator'

const { Title, Paragraph, Text } = Typography
const { useMessage } = message

const PRESET_ORDER = ['default', 'gallery', 'testimonials', 'products', 'minimal']

const ASPECT_RATIO_OPTIONS = [
  { label: '16:9', value: '16/9' },
  { label: '4:3', value: '4/3' },
  { label: '1:1', value: '1/1' },
  { label: '3:2', value: '3/2' },
  { label: '21:9', value: '21/9' },
]

const EASING_OPTIONS = [
  { label: 'ease-in-out', value: 'ease-in-out' },
  { label: 'ease', value: 'ease' },
  { label: 'linear', value: 'linear' },
  { label: 'cubic-bezier', value: 'cubic-bezier(0.4, 0, 0.2, 1)' },
]

const DOT_SHAPE_OPTIONS = [
  { label: 'Circle', value: 'circle' },
  { label: 'Square', value: 'square' },
]

const WIDTH_UNIT_OPTIONS = {
  pt: [
    { label: '%', value: '%' },
    { label: 'px', value: 'px' },
  ],
  en: [
    { label: '%', value: '%' },
    { label: 'px', value: 'px' },
  ],
}

const translations = {
  pt: {
    heading: 'Gerador de Carrossel CSS',
    intro: (
      <>
        Crie carrosséis funcionais usando só CSS e inputs radio ocultos. O track
        desliza com <Text code>transform</Text>, as setas (prev/next) e os dots
        são <Text code>label</Text> vinculados aos radios — sem JavaScript.
        Personalize largura, aspect ratio, slides visíveis, gap, cores e animação.
      </>
    ),
    tipTitle: 'Como funciona',
    tipBody: (
      <>
        Cada slide é um <Text code>radio</Text> com um <Text code>id</Text>. A
        regra <Text code>#slide-N:checked ~ .carousel__viewport .carousel__track</Text>{' '}
        move o track para a posição correta com <Text code>translateX</Text>. As
        setas são labels que apontam para o slide anterior/próximo e só aparecem
        quando o slide atual as exige. Dots usam a mesma técnica para destacar o
        slide ativo.
      </>
    ),
    settings: 'Configurações',
    output: 'Saída gerada',
    presets: 'Presets',
    containerWidth: 'Largura do container',
    widthUnit: 'Unidade',
    visibleSlides: 'Slides visíveis',
    numSlides: 'Total de slides',
    aspectRatio: 'Proporção dos slides',
    gap: 'Espaçamento (px)',
    borderRadius: 'Arredondamento (px)',
    duration: 'Duração da transição (s)',
    easing: 'Curva de easing',
    slideText: 'Texto dos slides',
    showArrows: 'Mostrar setas',
    showDots: 'Mostrar dots',
    dotShape: 'Formato dos dots',
    slideBg: 'Fundo dos slides',
    slideTextColor: 'Cor do texto',
    activeDotColor: 'Cor do dot ativo',
    inactiveDotColor: 'Cor do dot inativo',
    arrowBg: 'Fundo das setas',
    arrowColor: 'Cor das setas',
    className: 'Nome da classe CSS',
    preview: 'Pré-visualização',
    previewHint: 'O carrossel abaixo usa exatamente o CSS e o HTML gerados. Clique nas setas e nos dots.',
    replayAnimation: 'Atualizar preview',
    outputCss: 'CSS gerado',
    outputHtml: 'HTML de exemplo',
    outputFull: 'Bloco completo',
    copy: 'Copiar',
    copied: 'Copiado!',
    copyError: 'Não foi possível copiar',
    sourceCol: 'Código-fonte',
    sourceBody:
      'O núcleo vive em src/utils/cssCarouselGenerator.js. buildCarouselCss gera as regras dos radios, do viewport, do track, dos slides, setas e dots; buildCarouselHtml monta o markup semântico com labels e SVGs inline.',
  },
  en: {
    heading: 'CSS Carousel Generator',
    intro: (
      <>
        Build functional carousels using only CSS and hidden radio inputs. The
        track slides with <Text code>transform</Text>, while arrows (prev/next) and
        dots are <Text code>label</Text> elements wired to the radios — no
        JavaScript needed. Customize width, aspect ratio, visible slides, gap,
        colors and animation.
      </>
    ),
    tipTitle: 'How it works',
    tipBody: (
      <>
        Each slide is a <Text code>radio</Text> with an <Text code>id</Text>. The rule{' '}
        <Text code>#slide-N:checked ~ .carousel__viewport .carousel__track</Text>{' '}
        moves the track to the right position with <Text code>translateX</Text>.
        Arrows are labels pointing to the previous/next slide and only show up when
        the current slide requires them. Dots use the same trick to highlight the
        active slide.
      </>
    ),
    settings: 'Settings',
    output: 'Generated output',
    presets: 'Presets',
    containerWidth: 'Container width',
    widthUnit: 'Unit',
    visibleSlides: 'Visible slides',
    numSlides: 'Total slides',
    aspectRatio: 'Slide aspect ratio',
    gap: 'Gap (px)',
    borderRadius: 'Border radius (px)',
    duration: 'Transition duration (s)',
    easing: 'Easing curve',
    slideText: 'Slide text',
    showArrows: 'Show arrows',
    showDots: 'Show dots',
    dotShape: 'Dot shape',
    slideBg: 'Slide background',
    slideTextColor: 'Text color',
    activeDotColor: 'Active dot color',
    inactiveDotColor: 'Inactive dot color',
    arrowBg: 'Arrow background',
    arrowColor: 'Arrow color',
    className: 'CSS class name',
    preview: 'Preview',
    previewHint: 'The carousel below uses the exact generated CSS and HTML. Click the arrows and dots.',
    replayAnimation: 'Refresh preview',
    outputCss: 'Generated CSS',
    outputHtml: 'Example HTML',
    outputFull: 'Full block',
    copy: 'Copy',
    copied: 'Copied!',
    copyError: 'Could not copy',
    sourceCol: 'Source code',
    sourceBody:
      'The core lives in src/utils/cssCarouselGenerator.js. buildCarouselCss generates the rules for radios, viewport, track, slides, arrows and dots; buildCarouselHtml builds semantic markup with labels and inline SVGs.',
  },
}

export default function CssCarouselGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [messageApi, messageContextHolder] = useMessage()

  const [containerWidth, setContainerWidth] = useState(DEFAULTS.containerWidth)
  const [containerWidthUnit, setContainerWidthUnit] = useState(DEFAULTS.containerWidthUnit)
  const [visibleSlides, setVisibleSlides] = useState(DEFAULTS.visibleSlides)
  const [numSlides, setNumSlides] = useState(DEFAULTS.numSlides)
  const [slideAspectRatio, setSlideAspectRatio] = useState(DEFAULTS.slideAspectRatio)
  const [gap, setGap] = useState(DEFAULTS.gap)
  const [borderRadius, setBorderRadius] = useState(DEFAULTS.borderRadius)
  const [duration, setDuration] = useState(DEFAULTS.duration)
  const [easing, setEasing] = useState(DEFAULTS.easing)
  const [slideText, setSlideText] = useState(DEFAULTS.slideText)
  const [showArrows, setShowArrows] = useState(DEFAULTS.showArrows)
  const [showDots, setShowDots] = useState(DEFAULTS.showDots)
  const [dotShape, setDotShape] = useState(DEFAULTS.dotShape)
  const [slideBg, setSlideBg] = useState(DEFAULTS.slideBg)
  const [slideTextColor, setSlideTextColor] = useState(DEFAULTS.slideTextColor)
  const [activeDotColor, setActiveDotColor] = useState(DEFAULTS.activeDotColor)
  const [inactiveDotColor, setInactiveDotColor] = useState(DEFAULTS.inactiveDotColor)
  const [arrowBg, setArrowBg] = useState(DEFAULTS.arrowBg)
  const [arrowColor, setArrowColor] = useState(DEFAULTS.arrowColor)
  const [className, setClassName] = useState(DEFAULTS.className)
  const [previewKey, setPreviewKey] = useState(0)

  const applyPreset = (key) => {
    const p = PRESETS[key]
    if (!p) return
    setContainerWidth(p.containerWidth)
    setContainerWidthUnit(p.containerWidthUnit)
    setVisibleSlides(p.visibleSlides)
    setNumSlides(p.numSlides)
    setSlideAspectRatio(p.slideAspectRatio)
    setGap(p.gap)
    setBorderRadius(p.borderRadius)
    setDuration(p.duration)
    setEasing(p.easing)
    setSlideText(p.slideText)
    setShowArrows(p.showArrows)
    setShowDots(p.showDots)
    setDotShape(p.dotShape)
    setSlideBg(p.slideBg)
    setSlideTextColor(p.slideTextColor)
    setActiveDotColor(p.activeDotColor)
    setInactiveDotColor(p.inactiveDotColor)
    setArrowBg(p.arrowBg)
    setArrowColor(p.arrowColor)
    setClassName(p.className)
    setPreviewKey((k) => k + 1)
  }

  const settings = useMemo(
    () => ({
      containerWidth,
      containerWidthUnit,
      visibleSlides,
      numSlides,
      slideAspectRatio,
      gap,
      borderRadius,
      duration,
      easing,
      slideText,
      showArrows,
      showDots,
      dotShape,
      slideBg,
      slideTextColor,
      activeDotColor,
      inactiveDotColor,
      arrowBg,
      arrowColor,
      className,
    }),
    [
      containerWidth,
      containerWidthUnit,
      visibleSlides,
      numSlides,
      slideAspectRatio,
      gap,
      borderRadius,
      duration,
      easing,
      slideText,
      showArrows,
      showDots,
      dotShape,
      slideBg,
      slideTextColor,
      activeDotColor,
      inactiveDotColor,
      arrowBg,
      arrowColor,
      className,
    ]
  )

  const cssOutput = useMemo(() => buildCarouselCss(settings), [settings])
  const htmlOutput = useMemo(() => buildCarouselHtml(settings), [settings])
  const fullOutput = useMemo(() => buildCarouselFullDemo(settings), [settings])

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
      <Title level={2}><BgColorsOutlined /> {t.heading}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Alert type="info" showIcon message={t.tipTitle} description={t.tipBody} />

      <Row gutter={[24, 24]}>
        <Col xs={24} md={10}>
          <Card title={t.settings}>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Text type="secondary">{t.presets}</Text>
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

              <Space style={{ width: '100%', justifyContent: 'space-between', marginTop: 8 }}>
                <Text>{t.containerWidth}</Text>
                <Text code>{containerWidth}{containerWidthUnit}</Text>
              </Space>
              <Slider
                min={1}
                max={containerWidthUnit === '%' ? 100 : 1200}
                value={containerWidth}
                onChange={setContainerWidth}
              />

              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.widthUnit}</Text>
                <Segmented
                  style={{ width: '100%' }}
                  block
                  value={containerWidthUnit}
                  onChange={(v) => {
                    setContainerWidthUnit(v)
                    if (v === '%') setContainerWidth((w) => Math.min(w, 100))
                  }}
                  options={WIDTH_UNIT_OPTIONS[lang]}
                />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.visibleSlides}</Text>
                <Text code>{visibleSlides}</Text>
              </Space>
              <Slider min={1} max={4} value={visibleSlides} onChange={setVisibleSlides} />

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.numSlides}</Text>
                <Text code>{numSlides}</Text>
              </Space>
              <Slider min={2} max={12} value={numSlides} onChange={setNumSlides} />

              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.aspectRatio}</Text>
                <Segmented
                  style={{ width: '100%' }}
                  block
                  value={slideAspectRatio}
                  onChange={setSlideAspectRatio}
                  options={ASPECT_RATIO_OPTIONS}
                />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.gap}</Text>
                <Text code>{gap}px</Text>
              </Space>
              <Slider min={0} max={64} value={gap} onChange={setGap} />

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.borderRadius}</Text>
                <Text code>{borderRadius}px</Text>
              </Space>
              <Slider min={0} max={64} value={borderRadius} onChange={setBorderRadius} />

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.duration}</Text>
                <Text code>{duration}s</Text>
              </Space>
              <Slider min={0.1} max={2} step={0.1} value={duration} onChange={setDuration} />

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

              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.slideText}</Text>
                <Input value={slideText} onChange={(e) => setSlideText(e.target.value)} />
              </Space>

              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.dotShape}</Text>
                <Segmented
                  style={{ width: '100%' }}
                  block
                  value={dotShape}
                  onChange={setDotShape}
                  options={DOT_SHAPE_OPTIONS}
                />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.showArrows}</Text>
                <Switch checked={showArrows} onChange={setShowArrows} />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.showDots}</Text>
                <Switch checked={showDots} onChange={setShowDots} />
              </Space>

              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.slideBg}</Text>
                <ColorPicker value={slideBg} onChange={(c) => setSlideBg(c.toHexString())} showText />
              </Space>

              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.slideTextColor}</Text>
                <ColorPicker value={slideTextColor} onChange={(c) => setSlideTextColor(c.toHexString())} showText />
              </Space>

              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.activeDotColor}</Text>
                <ColorPicker value={activeDotColor} onChange={(c) => setActiveDotColor(c.toHexString())} showText />
              </Space>

              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.inactiveDotColor}</Text>
                <ColorPicker value={inactiveDotColor} onChange={(c) => setInactiveDotColor(c.toHexString())} showText />
              </Space>

              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.arrowBg}</Text>
                <ColorPicker
                  value={arrowBg}
                  onChange={(c) => {
                    const rgb = c.toRgb()
                    setArrowBg(`rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${rgb.a})`)
                  }}
                  showText
                />
              </Space>

              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.arrowColor}</Text>
                <ColorPicker value={arrowColor} onChange={(c) => setArrowColor(c.toHexString())} showText />
              </Space>

              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.className}</Text>
                <Input value={className} onChange={(e) => setClassName(e.target.value)} />
              </Space>
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={14}>
          <Card
            title={t.preview}
            extra={(
              <Button
                size="small"
                icon={<PlayCircleOutlined />}
                onClick={() => setPreviewKey((k) => k + 1)}
              >
                {t.replayAnimation}
              </Button>
            )}
          >
            <style key={previewKey}>{cssOutput}</style>
            <div
              style={{
                border: '1px solid #f0f0f0',
                borderRadius: 8,
                padding: 24,
                background: '#fafafa',
                minHeight: 260,
              }}
              dangerouslySetInnerHTML={{ __html: htmlOutput }}
            />
            <Paragraph type="secondary" style={{ marginTop: 12, marginBottom: 0 }}>
              {t.previewHint}
            </Paragraph>
          </Card>
        </Col>
      </Row>

      <Card
        title={t.output}
        extra={(
          <Button size="small" icon={<CopyOutlined />} onClick={() => copy(cssOutput)}>
            {t.copy}
          </Button>
        )}
      >
        <Tabs
          items={outputTabs}
          tabBarExtraContent={(
            <Button size="small" icon={<CopyOutlined />} onClick={() => copy(fullOutput)}>
              {t.copy}
            </Button>
          )}
        />
      </Card>

      <Collapse
        items={[
          {
            key: 'source',
            label: `${t.sourceCol} — buildCarouselCss / buildCarouselHtml`,
            children: (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Paragraph type="secondary">{t.sourceBody}</Paragraph>
                <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 320 }}>
                  <code>{buildCarouselCss.toString()}</code>
                </pre>
              </Space>
            ),
          },
        ]}
      />
    </Space>
  )
}
