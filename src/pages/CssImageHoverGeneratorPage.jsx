import React, { useMemo, useState } from 'react'
import {
  Typography, Card, Space, Slider, Segmented, Alert, Button, Collapse,
  message, ColorPicker, Row, Col, Input, Switch, Tabs,
} from 'antd'
import { BgColorsOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  buildImageHoverCss,
  buildImageHoverHtml,
  buildImageHoverFullDemo,
  PRESETS,
  DEFAULTS,
  DEFAULT_IMAGE,
} from '../utils/cssImageHoverGenerator'

const { Title, Paragraph, Text } = Typography
const { useMessage } = message

const OBJECT_FIT_OPTIONS = {
  pt: [
    { label: 'Cobrir', value: 'cover' },
    { label: 'Conter', value: 'contain' },
    { label: 'Preencher', value: 'fill' },
  ],
  en: [
    { label: 'Cover', value: 'cover' },
    { label: 'Contain', value: 'contain' },
    { label: 'Fill', value: 'fill' },
  ],
}

const OVERLAY_POSITION_OPTIONS = {
  pt: [
    { label: 'Centro', value: 'center' },
    { label: 'Topo', value: 'top' },
    { label: 'Base', value: 'bottom' },
    { label: 'Esquerda', value: 'left' },
    { label: 'Direita', value: 'right' },
  ],
  en: [
    { label: 'Center', value: 'center' },
    { label: 'Top', value: 'top' },
    { label: 'Bottom', value: 'bottom' },
    { label: 'Left', value: 'left' },
    { label: 'Right', value: 'right' },
  ],
}

const PRESET_ORDER = ['default', 'zoom', 'lift', 'grayscale', 'blur', 'overlay', 'circle', 'vintage']

const translations = {
  pt: {
    title: 'Gerador de Efeitos de Hover em Imagens CSS',
    intro: (
      <>
        Crie efeitos de hover para imagens usando só CSS: zoom, rotação, filtros
        (grayscale, blur, sepia, brightness etc.), sombra, border-radius e overlay
        com texto. O preview injeta exatamente o CSS gerado, então você vê o
        resultado final ao passar o mouse.
      </>
    ),
    tipTitle: 'Como funciona (e as pegadinhas)',
    tipBody: (
      <>
        O truque é envolver a imagem num container com{' '}
        <Text code>{'overflow: hidden'}</Text> e aplicar{' '}
        <Text code>{'transform'}</Text> e <Text code>{'filter'}</Text> apenas no
        estado <Text code>{':hover img'}</Text>. Para overlays, use pseudo-elementos
        (aqui <Text code>{'::before'}</Text> para o fundo e{' '}
        <Text code>{'::after'}</Text> para o texto) para não poluir o HTML. Lembre-se
        de respeitar <Text code>{'prefers-reduced-motion'}</Text> em produção.
      </>
    ),
    settings: 'Configurações',
    presets: 'Presets',
    container: 'Container',
    filters: 'Filtros no hover',
    transform: 'Transformação',
    overlay: 'Overlay',
    outputCss: 'CSS gerado',
    outputHtml: 'HTML de exemplo',
    outputFull: 'Bloco completo',
    copy: 'Copiar',
    copied: 'Copiado!',
    copyError: 'Não foi possível copiar',
    sourceCol: 'Código-fonte',
    sourceBody:
      'O núcleo vive em src/utils/cssImageHoverGenerator.js. buildImageHoverCss monta as regras do container, da imagem e dos pseudo-elementos de overlay; buildImageHoverHtml gera o markup semântico com <figure> e <img>.',
    presetLabels: {
      default: 'Padrão',
      zoom: 'Zoom suave',
      lift: 'Levantar',
      grayscale: 'Preto e branco → cor',
      blur: 'Desfoque → nítido',
      overlay: 'Overlay central',
      circle: 'Círculo',
      vintage: 'Vintage',
    },
    width: 'Largura (px)',
    height: 'Altura (px)',
    borderRadius: 'Arredondamento normal (%)',
    borderRadiusHover: 'Arredondamento no hover (%)',
    borderWidth: 'Espessura da borda (px)',
    borderColor: 'Cor da borda',
    objectFit: 'Ajuste da imagem',
    objectPosition: 'Posição da imagem',
    scale: 'Escala no hover',
    rotate: 'Rotação no hover (deg)',
    translateX: 'Translação X no hover (px)',
    translateY: 'Translação Y no hover (px)',
    shadow: 'Sombra normal',
    shadowHover: 'Sombra no hover',
    transitionDuration: 'Duração da transição (ms)',
    transitionEasing: 'Easing da transição',
    className: 'Nome da classe CSS',
    imageUrl: 'URL da imagem (deixe vazio para placeholder SVG)',
    overlayToggle: 'Ativar overlay',
    overlayColor: 'Cor do fundo do overlay',
    overlayOpacity: 'Opacidade do overlay',
    overlayTextColor: 'Cor do texto do overlay',
    overlayPosition: 'Posição do texto',
    overlayTitle: 'Título do overlay',
    overlayText: 'Texto do overlay',
    preview: 'Pré-visualização',
    previewHint: 'Passe o mouse sobre a imagem abaixo — ela usa exatamente o CSS gerado.',
    filterGrayscale: 'Grayscale (%)',
    filterSepia: 'Sepia (%)',
    filterBlur: 'Blur (px)',
    filterBrightness: 'Brightness',
    filterContrast: 'Contrast',
    filterSaturate: 'Saturate',
    filterHueRotate: 'Hue-rotate (deg)',
  },
  en: {
    title: 'CSS Image Hover Effects Generator',
    intro: (
      <>
        Build image hover effects using only CSS: zoom, rotation, filters
        (grayscale, blur, sepia, brightness, etc.), shadow, border-radius and
        text overlay. The preview injects the exact generated CSS, so you see the
        final result on hover.
      </>
    ),
    tipTitle: 'How it works (and the gotchas)',
    tipBody: (
      <>
        The trick is wrapping the image in a container with{' '}
        <Text code>{'overflow: hidden'}</Text> and applying{' '}
        <Text code>{'transform'}</Text> and <Text code>{'filter'}</Text> only on
        the <Text code>{':hover img'}</Text> state. For overlays, use pseudo-elements
        (here <Text code>{'::before'}</Text> for the background and{' '}
        <Text code>{'::after'}</Text> for the text) to keep the HTML clean. Remember
        to respect <Text code>{'prefers-reduced-motion'}</Text> in production.
      </>
    ),
    settings: 'Settings',
    presets: 'Presets',
    container: 'Container',
    filters: 'Hover filters',
    transform: 'Transform',
    overlay: 'Overlay',
    outputCss: 'Generated CSS',
    outputHtml: 'Example HTML',
    outputFull: 'Full block',
    copy: 'Copy',
    copied: 'Copied!',
    copyError: 'Could not copy',
    sourceCol: 'Source code',
    sourceBody:
      'The core lives in src/utils/cssImageHoverGenerator.js. buildImageHoverCss builds the container, image and overlay pseudo-element rules; buildImageHoverHtml generates semantic markup with <figure> and <img>.',
    presetLabels: {
      default: 'Default',
      zoom: 'Smooth zoom',
      lift: 'Lift up',
      grayscale: 'Grayscale → color',
      blur: 'Blur → sharp',
      overlay: 'Center overlay',
      circle: 'Circle',
      vintage: 'Vintage',
    },
    width: 'Width (px)',
    height: 'Height (px)',
    borderRadius: 'Normal border radius (%)',
    borderRadiusHover: 'Hover border radius (%)',
    borderWidth: 'Border width (px)',
    borderColor: 'Border color',
    objectFit: 'Object fit',
    objectPosition: 'Object position',
    scale: 'Hover scale',
    rotate: 'Hover rotation (deg)',
    translateX: 'Hover translate X (px)',
    translateY: 'Hover translate Y (px)',
    shadow: 'Normal shadow',
    shadowHover: 'Hover shadow',
    transitionDuration: 'Transition duration (ms)',
    transitionEasing: 'Transition easing',
    className: 'CSS class name',
    imageUrl: 'Image URL (leave empty for SVG placeholder)',
    overlayToggle: 'Enable overlay',
    overlayColor: 'Overlay background color',
    overlayOpacity: 'Overlay opacity',
    overlayTextColor: 'Overlay text color',
    overlayPosition: 'Text position',
    overlayTitle: 'Overlay title',
    overlayText: 'Overlay text',
    preview: 'Preview',
    previewHint: 'Hover over the image below — it uses exactly the generated CSS.',
    filterGrayscale: 'Grayscale (%)',
    filterSepia: 'Sepia (%)',
    filterBlur: 'Blur (px)',
    filterBrightness: 'Brightness',
    filterContrast: 'Contrast',
    filterSaturate: 'Saturate',
    filterHueRotate: 'Hue-rotate (deg)',
  },
}

export default function CssImageHoverGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [messageApi, messageContextHolder] = useMessage()

  const [className, setClassName] = useState(DEFAULTS.className)
  const [width, setWidth] = useState(DEFAULTS.width)
  const [height, setHeight] = useState(DEFAULTS.height)
  const [borderRadius, setBorderRadius] = useState(DEFAULTS.borderRadius)
  const [borderRadiusHover, setBorderRadiusHover] = useState(DEFAULTS.borderRadiusHover)
  const [borderWidth, setBorderWidth] = useState(DEFAULTS.borderWidth)
  const [borderColor, setBorderColor] = useState(DEFAULTS.borderColor)
  const [objectFit, setObjectFit] = useState(DEFAULTS.objectFit)
  const [objectPosition, setObjectPosition] = useState(DEFAULTS.objectPosition)
  const [scale, setScale] = useState(DEFAULTS.scale)
  const [rotate, setRotate] = useState(DEFAULTS.rotate)
  const [translateX, setTranslateX] = useState(DEFAULTS.translateX)
  const [translateY, setTranslateY] = useState(DEFAULTS.translateY)
  const [grayscale, setGrayscale] = useState(DEFAULTS.grayscale)
  const [sepia, setSepia] = useState(DEFAULTS.sepia)
  const [blur, setBlur] = useState(DEFAULTS.blur)
  const [brightness, setBrightness] = useState(DEFAULTS.brightness)
  const [contrast, setContrast] = useState(DEFAULTS.contrast)
  const [saturate, setSaturate] = useState(DEFAULTS.saturate)
  const [hueRotate, setHueRotate] = useState(DEFAULTS.hueRotate)
  const [grayscaleHover, setGrayscaleHover] = useState(DEFAULTS.grayscaleHover)
  const [sepiaHover, setSepiaHover] = useState(DEFAULTS.sepiaHover)
  const [blurHover, setBlurHover] = useState(DEFAULTS.blurHover)
  const [brightnessHover, setBrightnessHover] = useState(DEFAULTS.brightnessHover)
  const [contrastHover, setContrastHover] = useState(DEFAULTS.contrastHover)
  const [saturateHover, setSaturateHover] = useState(DEFAULTS.saturateHover)
  const [hueRotateHover, setHueRotateHover] = useState(DEFAULTS.hueRotateHover)
  const [shadow, setShadow] = useState(DEFAULTS.shadow)
  const [shadowHover, setShadowHover] = useState(DEFAULTS.shadowHover)
  const [transitionDuration, setTransitionDuration] = useState(DEFAULTS.transitionDuration)
  const [transitionEasing, setTransitionEasing] = useState(DEFAULTS.transitionEasing)
  const [imageUrl, setImageUrl] = useState('')
  const [overlay, setOverlay] = useState(DEFAULTS.overlay)
  const [overlayColor, setOverlayColor] = useState(DEFAULTS.overlayColor)
  const [overlayOpacity, setOverlayOpacity] = useState(DEFAULTS.overlayOpacity)
  const [overlayTextColor, setOverlayTextColor] = useState(DEFAULTS.overlayTextColor)
  const [overlayPosition, setOverlayPosition] = useState(DEFAULTS.overlayPosition)
  const [overlayTitle, setOverlayTitle] = useState(DEFAULTS.overlayTitle)
  const [overlayText, setOverlayText] = useState(DEFAULTS.overlayText)

  const applyPreset = (key) => {
    const p = PRESETS[key]
    if (!p) return
    setClassName(p.className)
    setWidth(p.width)
    setHeight(p.height)
    setBorderRadius(p.borderRadius)
    setBorderRadiusHover(p.borderRadiusHover)
    setBorderWidth(p.borderWidth)
    setBorderColor(p.borderColor)
    setObjectFit(p.objectFit)
    setObjectPosition(p.objectPosition)
    setScale(p.scale)
    setRotate(p.rotate)
    setTranslateX(p.translateX)
    setTranslateY(p.translateY)
    setGrayscale(p.grayscale)
    setSepia(p.sepia)
    setBlur(p.blur)
    setBrightness(p.brightness)
    setContrast(p.contrast)
    setSaturate(p.saturate)
    setHueRotate(p.hueRotate)
    setGrayscaleHover(p.grayscaleHover)
    setSepiaHover(p.sepiaHover)
    setBlurHover(p.blurHover)
    setBrightnessHover(p.brightnessHover)
    setContrastHover(p.contrastHover)
    setSaturateHover(p.saturateHover)
    setHueRotateHover(p.hueRotateHover)
    setShadow(p.shadow)
    setShadowHover(p.shadowHover)
    setTransitionDuration(p.transitionDuration)
    setTransitionEasing(p.transitionEasing)
    setOverlay(p.overlay)
    setOverlayColor(p.overlayColor)
    setOverlayOpacity(p.overlayOpacity)
    setOverlayTextColor(p.overlayTextColor)
    setOverlayPosition(p.overlayPosition)
    setOverlayTitle(p.overlayTitle)
    setOverlayText(p.overlayText)
    setImageUrl('')
  }

  const settings = useMemo(
    () => ({
      className,
      width,
      height,
      borderRadius,
      borderRadiusHover,
      borderWidth,
      borderColor,
      objectFit,
      objectPosition,
      scale,
      rotate,
      translateX,
      translateY,
      grayscale,
      sepia,
      blur,
      brightness,
      contrast,
      saturate,
      hueRotate,
      grayscaleHover,
      sepiaHover,
      blurHover,
      brightnessHover,
      contrastHover,
      saturateHover,
      hueRotateHover,
      shadow,
      shadowHover,
      transitionDuration,
      transitionEasing,
      imageUrl: imageUrl.trim() || DEFAULT_IMAGE,
      overlay,
      overlayColor,
      overlayOpacity,
      overlayTextColor,
      overlayPosition,
      overlayTitle,
      overlayText,
    }),
    [
      className,
      width,
      height,
      borderRadius,
      borderRadiusHover,
      borderWidth,
      borderColor,
      objectFit,
      objectPosition,
      scale,
      rotate,
      translateX,
      translateY,
      grayscale,
      sepia,
      blur,
      brightness,
      contrast,
      saturate,
      hueRotate,
      grayscaleHover,
      sepiaHover,
      blurHover,
      brightnessHover,
      contrastHover,
      saturateHover,
      hueRotateHover,
      shadow,
      shadowHover,
      transitionDuration,
      transitionEasing,
      imageUrl,
      overlay,
      overlayColor,
      overlayOpacity,
      overlayTextColor,
      overlayPosition,
      overlayTitle,
      overlayText,
    ]
  )

  const cssOutput = useMemo(() => buildImageHoverCss(settings), [settings])
  const htmlOutput = useMemo(() => buildImageHoverHtml(settings), [settings])
  const fullOutput = useMemo(() => buildImageHoverFullDemo(settings), [settings])

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

  const overlayAttr = overlay ? `${overlayTitle}${overlayText ? `\n${overlayText}` : ''}` : undefined

  const renderFilterSliders = (hover) => {
    const prefix = hover ? 'Hover' : ''
    return (
      <>
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Text>{t.filterGrayscale}</Text>
          <Text code>{hover ? grayscaleHover : grayscale}%</Text>
        </Space>
        <Slider min={0} max={100} value={hover ? grayscaleHover : grayscale} onChange={hover ? setGrayscaleHover : setGrayscale} />

        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Text>{t.filterSepia}</Text>
          <Text code>{hover ? sepiaHover : sepia}%</Text>
        </Space>
        <Slider min={0} max={100} value={hover ? sepiaHover : sepia} onChange={hover ? setSepiaHover : setSepia} />

        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Text>{t.filterBlur}</Text>
          <Text code>{hover ? blurHover : blur}px</Text>
        </Space>
        <Slider min={0} max={16} step={0.5} value={hover ? blurHover : blur} onChange={hover ? setBlurHover : setBlur} />

        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Text>{t.filterBrightness}</Text>
          <Text code>{hover ? brightnessHover : brightness}</Text>
        </Space>
        <Slider min={0.1} max={2} step={0.05} value={hover ? brightnessHover : brightness} onChange={hover ? setBrightnessHover : setBrightness} />

        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Text>{t.filterContrast}</Text>
          <Text code>{hover ? contrastHover : contrast}</Text>
        </Space>
        <Slider min={0.1} max={2} step={0.05} value={hover ? contrastHover : contrast} onChange={hover ? setContrastHover : setContrast} />

        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Text>{t.filterSaturate}</Text>
          <Text code>{hover ? saturateHover : saturate}</Text>
        </Space>
        <Slider min={0} max={3} step={0.05} value={hover ? saturateHover : saturate} onChange={hover ? setSaturateHover : setSaturate} />

        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Text>{t.filterHueRotate}</Text>
          <Text code>{hover ? hueRotateHover : hueRotate}deg</Text>
        </Space>
        <Slider min={0} max={360} value={hover ? hueRotateHover : hueRotate} onChange={hover ? setHueRotateHover : setHueRotate} />
      </>
    )
  }

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
                  label: t.presetLabels[key] || key,
                }))}
              />

              <Space direction="vertical" size={4} style={{ width: '100%', marginTop: 8 }}>
                <Text strong>{t.container}</Text>

                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                  <Text>{t.width}</Text>
                  <Text code>{width}px</Text>
                </Space>
                <Slider min={50} max={600} value={width} onChange={setWidth} />

                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                  <Text>{t.height}</Text>
                  <Text code>{height}px</Text>
                </Space>
                <Slider min={50} max={600} value={height} onChange={setHeight} />

                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                  <Text>{t.borderRadius}</Text>
                  <Text code>{borderRadius}%</Text>
                </Space>
                <Slider min={0} max={50} value={borderRadius} onChange={setBorderRadius} />

                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                  <Text>{t.borderRadiusHover}</Text>
                  <Text code>{borderRadiusHover}%</Text>
                </Space>
                <Slider min={0} max={50} value={borderRadiusHover} onChange={setBorderRadiusHover} />

                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                  <Text>{t.borderWidth}</Text>
                  <Text code>{borderWidth}px</Text>
                </Space>
                <Slider min={0} max={16} value={borderWidth} onChange={setBorderWidth} />

                <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text>{t.borderColor}</Text>
                  <ColorPicker value={borderColor} onChange={setBorderColor} showText />
                </Space>

                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                  <Text>{t.objectFit}</Text>
                  <Segmented
                    style={{ width: '100%' }}
                    block
                    value={objectFit}
                    onChange={setObjectFit}
                    options={OBJECT_FIT_OPTIONS[lang]}
                  />
                </Space>

                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                  <Text>{t.objectPosition}</Text>
                  <Input value={objectPosition} onChange={(e) => setObjectPosition(e.target.value)} placeholder="center" />
                </Space>

                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                  <Text>{t.imageUrl}</Text>
                  <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." />
                </Space>

                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                  <Text>{t.className}</Text>
                  <Input value={className} onChange={(e) => setClassName(e.target.value)} />
                </Space>
              </Space>

              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text strong>{t.transform}</Text>

                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                  <Text>{t.scale}</Text>
                  <Text code>{scale.toFixed(2)}</Text>
                </Space>
                <Slider min={0.5} max={2} step={0.01} value={scale} onChange={setScale} />

                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                  <Text>{t.rotate}</Text>
                  <Text code>{rotate}deg</Text>
                </Space>
                <Slider min={-30} max={30} value={rotate} onChange={setRotate} />

                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                  <Text>{t.translateX}</Text>
                  <Text code>{translateX}px</Text>
                </Space>
                <Slider min={-100} max={100} value={translateX} onChange={setTranslateX} />

                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                  <Text>{t.translateY}</Text>
                  <Text code>{translateY}px</Text>
                </Space>
                <Slider min={-100} max={100} value={translateY} onChange={setTranslateY} />
              </Space>

              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text strong>{t.filters}</Text>
                {renderFilterSliders(false)}
              </Space>

              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text strong>{t.overlay}</Text>

                <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text>{t.overlayToggle}</Text>
                  <Switch size="small" checked={overlay} onChange={setOverlay} />
                </Space>

                {overlay && (
                  <>
                    <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text>{t.overlayColor}</Text>
                      <ColorPicker value={overlayColor} onChange={setOverlayColor} showText />
                    </Space>

                    <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                      <Text>{t.overlayOpacity}</Text>
                      <Text code>{overlayOpacity.toFixed(2)}</Text>
                    </Space>
                    <Slider min={0} max={1} step={0.01} value={overlayOpacity} onChange={setOverlayOpacity} />

                    <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text>{t.overlayTextColor}</Text>
                      <ColorPicker value={overlayTextColor} onChange={setOverlayTextColor} showText />
                    </Space>

                    <Space direction="vertical" size={4} style={{ width: '100%' }}>
                      <Text>{t.overlayPosition}</Text>
                      <Segmented
                        style={{ width: '100%' }}
                        block
                        value={overlayPosition}
                        onChange={setOverlayPosition}
                        options={OVERLAY_POSITION_OPTIONS[lang]}
                      />
                    </Space>

                    <Space direction="vertical" size={4} style={{ width: '100%' }}>
                      <Text>{t.overlayTitle}</Text>
                      <Input value={overlayTitle} onChange={(e) => setOverlayTitle(e.target.value)} />
                    </Space>

                    <Space direction="vertical" size={4} style={{ width: '100%' }}>
                      <Text>{t.overlayText}</Text>
                      <Input value={overlayText} onChange={(e) => setOverlayText(e.target.value)} />
                    </Space>
                  </>
                )}
              </Space>

              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text strong>Transition</Text>

                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                  <Text>{t.transitionDuration}</Text>
                  <Text code>{transitionDuration}ms</Text>
                </Space>
                <Slider min={0} max={1500} value={transitionDuration} onChange={setTransitionDuration} />

                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                  <Text>{t.transitionEasing}</Text>
                  <Input value={transitionEasing} onChange={(e) => setTransitionEasing(e.target.value)} placeholder="ease" />
                </Space>

                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                  <Text>{t.shadow}</Text>
                  <Input value={shadow} onChange={(e) => setShadow(e.target.value)} />
                </Space>

                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                  <Text>{t.shadowHover}</Text>
                  <Input value={shadowHover} onChange={(e) => setShadowHover(e.target.value)} />
                </Space>
              </Space>
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={14}>
          <Card title={t.preview}>
            <style>{cssOutput}</style>
            <div
              style={{
                border: '1px solid #f0f0f0',
                borderRadius: 8,
                padding: 40,
                background: '#fafafa',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 360,
              }}
            >
              <figure
                className={className}
                data-overlay={overlayAttr}
              >
                <img src={imageUrl.trim() || DEFAULT_IMAGE} alt="Hover demo" />
              </figure>
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
            label: `${t.sourceCol} — buildImageHoverCss / buildImageHoverHtml`,
            children: (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Paragraph type="secondary">{t.sourceBody}</Paragraph>
                <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 320 }}>
                  <code>{buildImageHoverCss.toString()}</code>
                </pre>
              </Space>
            ),
          },
        ]}
      />
    </Space>
  )
}
