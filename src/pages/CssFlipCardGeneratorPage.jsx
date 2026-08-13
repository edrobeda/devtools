import React, { useMemo, useState } from 'react'
import {
  Typography, Card, Space, Slider, Segmented, Alert, Button, Collapse,
  message, ColorPicker, Row, Col, Input, InputNumber, Switch, Tabs,
} from 'antd'
import { BgColorsOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  buildFlipCardCss,
  buildFlipCardHtml,
  buildFlipCardFullDemo,
  PRESETS,
  DEFAULTS,
} from '../utils/cssFlipCardGenerator'

const { Title, Paragraph, Text } = Typography
const { useMessage } = message

const AXIS_OPTIONS = {
  pt: [
    { label: 'Horizontal', value: 'horizontal' },
    { label: 'Vertical', value: 'vertical' },
  ],
  en: [
    { label: 'Horizontal', value: 'horizontal' },
    { label: 'Vertical', value: 'vertical' },
  ],
}

const TRIGGER_OPTIONS = {
  pt: [
    { label: 'Hover', value: 'hover' },
    { label: 'Clique', value: 'click' },
  ],
  en: [
    { label: 'Hover', value: 'hover' },
    { label: 'Click', value: 'click' },
  ],
}

const EASING_OPTIONS = {
  pt: [
    { label: 'Ease', value: 'ease' },
    { label: 'Linear', value: 'linear' },
    { label: 'Ease-in-out', value: 'ease-in-out' },
    { label: 'Bounce', value: 'cubic-bezier(0.68, -0.55, 0.27, 1.55)' },
  ],
  en: [
    { label: 'Ease', value: 'ease' },
    { label: 'Linear', value: 'linear' },
    { label: 'Ease-in-out', value: 'ease-in-out' },
    { label: 'Bounce', value: 'cubic-bezier(0.68, -0.55, 0.27, 1.55)' },
  ],
}

const translations = {
  pt: {
    title: 'Gerador de Flip Card CSS',
    intro: (
      <>
        Crie cards 3D que viram no hover ou no clique usando só CSS: escolha
        o eixo (horizontal/vertical), ajuste dimensões, perspectiva, cores das
        faces, duração da transição e sombra. O preview usa o CSS exato que
        será copiado.
      </>
    ),
    tipTitle: 'Como funciona (e as pegadinhas)',
    tipBody: (
      <>
        A mágica está em <Text code>transform-style: preserve-3d</Text> no
        wrapper interno e <Text code>backface-visibility: hidden</Text> nas
        duas faces. A face de trás é pré-virada com{' '}
        <Text code>rotateY(180deg)</Text> (ou <Text code>rotateX</Text> no modo
        vertical), então quando o inner gira 180° ela aparece de pé. No modo
        clique, um checkbox oculto dentro do <Text code>{'<label>'}</Text>{' '}
        dispara o estado via <Text code>:checked ~ .flip-card__inner</Text>.
      </>
    ),
    settings: 'Configurações',
    geometry: 'Geometria',
    axis: 'Eixo de rotação',
    trigger: 'Gatilho',
    width: 'Largura (px)',
    height: 'Altura (px)',
    borderRadius: 'Border radius (px)',
    perspective: 'Perspectiva (px)',
    duration: 'Duração (ms)',
    easing: 'Timing function',
    appearance: 'Aparência',
    frontBg: 'Fundo da frente',
    frontText: 'Texto da frente',
    backBg: 'Fundo do verso',
    backText: 'Texto do verso',
    borderWidth: 'Espessura da borda (px)',
    borderColor: 'Cor da borda',
    shadow: 'Sombra',
    shadowOnFlip: 'Intensificar sombra ao virar',
    hoverShadowLabel: 'Sombra ao virar',
    content: 'Conteúdo',
    frontTitle: 'Título da frente',
    frontBody: 'Texto da frente',
    backTitle: 'Título do verso',
    backBody: 'Texto do verso',
    showIcon: 'Mostrar ícone na frente',
    iconSize: 'Tamanho do ícone (px)',
    contentPadding: 'Padding interno (px)',
    titleSize: 'Tamanho do título (px)',
    bodySize: 'Tamanho do corpo (px)',
    preview: 'Pré-visualização',
    previewHover: 'Passe o mouse no card para ver a animação.',
    previewClick: 'Clique no card para ver a animação.',
    outputCss: 'CSS gerado',
    outputHtml: 'HTML de exemplo',
    outputFull: 'Bloco completo',
    copy: 'Copiar',
    copied: 'Copiado!',
    copyError: 'Não foi possível copiar',
    presets: 'Presets',
    sourceCol: 'Código-fonte',
    sourceBody:
      'O núcleo vive em src/utils/cssFlipCardGenerator.js. buildFlipCardCss monta as regras de .flip-card, .flip-card__inner, .flip-card__front e .flip-card__back, incluindo o seletor de virada conforme o gatilho escolhido. buildFlipCardHtml gera o markup semântico com <label> quando o gatilho é clique.',
  },
  en: {
    title: 'CSS Flip Card Generator',
    intro: (
      <>
        Build 3D cards that flip on hover or click using only CSS: choose the
        axis (horizontal/vertical), tweak dimensions, perspective, face colors,
        transition duration and shadow. The preview uses the exact CSS that
        will be copied.
      </>
    ),
    tipTitle: 'How it works (and the gotchas)',
    tipBody: (
      <>
        The trick is <Text code>transform-style: preserve-3d</Text> on the
        inner wrapper and <Text code>backface-visibility: hidden</Text> on
        both faces. The back face is pre-rotated with{' '}
        <Text code>rotateY(180deg)</Text> (or <Text code>rotateX</Text> in
        vertical mode), so when the inner rotates 180° it shows upright. In
        click mode, a hidden checkbox inside the <Text code>{'<label>'}</Text>{' '}
        triggers the state via <Text code>:checked ~ .flip-card__inner</Text>.
      </>
    ),
    settings: 'Settings',
    geometry: 'Geometry',
    axis: 'Flip axis',
    trigger: 'Trigger',
    width: 'Width (px)',
    height: 'Height (px)',
    borderRadius: 'Border radius (px)',
    perspective: 'Perspective (px)',
    duration: 'Duration (ms)',
    easing: 'Timing function',
    appearance: 'Appearance',
    frontBg: 'Front background',
    frontText: 'Front text',
    backBg: 'Back background',
    backText: 'Back text',
    borderWidth: 'Border width (px)',
    borderColor: 'Border color',
    shadow: 'Shadow',
    shadowOnFlip: 'Intensify shadow on flip',
    hoverShadowLabel: 'Shadow on flip',
    content: 'Content',
    frontTitle: 'Front title',
    frontBody: 'Front body',
    backTitle: 'Back title',
    backBody: 'Back body',
    showIcon: 'Show icon on front',
    iconSize: 'Icon size (px)',
    contentPadding: 'Inner padding (px)',
    titleSize: 'Title size (px)',
    bodySize: 'Body size (px)',
    preview: 'Preview',
    previewHover: 'Hover over the card to see the animation.',
    previewClick: 'Click the card to see the animation.',
    outputCss: 'Generated CSS',
    outputHtml: 'Example HTML',
    outputFull: 'Full block',
    copy: 'Copy',
    copied: 'Copied!',
    copyError: 'Could not copy',
    presets: 'Presets',
    sourceCol: 'Source code',
    sourceBody:
      'The core lives in src/utils/cssFlipCardGenerator.js. buildFlipCardCss builds the rules for .flip-card, .flip-card__inner, .flip-card__front and .flip-card__back, including the flipped selector based on the chosen trigger. buildFlipCardHtml generates semantic markup with <label> when the trigger is click.',
  },
}

const PRESET_ORDER = ['default', 'dark', 'gradient', 'minimal', 'playful']
const PRESET_LABELS = {
  pt: { default: 'Padrão', dark: 'Escuro', gradient: 'Gradiente', minimal: 'Minimal', playful: 'Divertido' },
  en: { default: 'Default', dark: 'Dark', gradient: 'Gradient', minimal: 'Minimal', playful: 'Playful' },
}

export default function CssFlipCardGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [messageApi, messageContextHolder] = useMessage()

  const [axis, setAxis] = useState(DEFAULTS.axis)
  const [trigger, setTrigger] = useState(DEFAULTS.trigger)
  const [width, setWidth] = useState(DEFAULTS.width)
  const [height, setHeight] = useState(DEFAULTS.height)
  const [borderRadius, setBorderRadius] = useState(DEFAULTS.borderRadius)
  const [perspective, setPerspective] = useState(DEFAULTS.perspective)
  const [duration, setDuration] = useState(DEFAULTS.duration)
  const [easing, setEasing] = useState(DEFAULTS.easing)
  const [frontBg, setFrontBg] = useState(DEFAULTS.frontBg)
  const [frontText, setFrontText] = useState(DEFAULTS.frontText)
  const [backBg, setBackBg] = useState(DEFAULTS.backBg)
  const [backText, setBackText] = useState(DEFAULTS.backText)
  const [borderWidth, setBorderWidth] = useState(DEFAULTS.borderWidth)
  const [borderColor, setBorderColor] = useState(DEFAULTS.borderColor)
  const [shadow, setShadow] = useState(DEFAULTS.shadow)
  const [hoverShadow, setHoverShadow] = useState(DEFAULTS.hoverShadow)
  const [shadowOnFlip, setShadowOnFlip] = useState(DEFAULTS.shadowOnFlip)
  const [frontTitle, setFrontTitle] = useState('Frente')
  const [frontBody, setFrontBody] = useState('Passe o mouse ou clique para virar.')
  const [backTitle, setBackTitle] = useState('Verso')
  const [backBody, setBackBody] = useState('Conteúdo de trás do card. Puro CSS!')
  const [showIcon, setShowIcon] = useState(DEFAULTS.showIcon)
  const [iconSize, setIconSize] = useState(DEFAULTS.iconSize)
  const [contentPadding, setContentPadding] = useState(DEFAULTS.contentPadding)
  const [titleSize, setTitleSize] = useState(DEFAULTS.titleSize)
  const [bodySize, setBodySize] = useState(DEFAULTS.bodySize)

  const settings = useMemo(
    () => ({
      axis,
      trigger,
      width,
      height,
      borderRadius,
      perspective,
      duration,
      easing,
      frontBg,
      frontText,
      backBg,
      backText,
      borderWidth,
      borderColor,
      shadow,
      hoverShadow,
      shadowOnFlip,
      frontTitle,
      frontBody,
      backTitle,
      backBody,
      showIcon,
      iconSize,
      contentPadding,
      titleSize,
      bodySize,
    }),
    [
      axis,
      trigger,
      width,
      height,
      borderRadius,
      perspective,
      duration,
      easing,
      frontBg,
      frontText,
      backBg,
      backText,
      borderWidth,
      borderColor,
      shadow,
      hoverShadow,
      shadowOnFlip,
      frontTitle,
      frontBody,
      backTitle,
      backBody,
      showIcon,
      iconSize,
      contentPadding,
      titleSize,
      bodySize,
    ]
  )

  const cssOutput = useMemo(() => buildFlipCardCss(settings), [settings])
  const htmlOutput = useMemo(() => buildFlipCardHtml(settings), [settings])
  const fullOutput = useMemo(() => buildFlipCardFullDemo(settings), [settings])

  const applyPreset = (key) => {
    const p = PRESETS[key]
    if (!p) return
    setAxis(p.axis)
    setFrontBg(p.frontBg)
    setFrontText(p.frontText)
    setBackBg(p.backBg)
    setBackText(p.backText)
    setBorderWidth(p.borderWidth)
    setBorderColor(p.borderColor)
    setShadow(p.shadow)
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
                  label: PRESET_LABELS[lang][key] || key,
                }))}
              />

              <Text strong style={{ marginTop: 8 }}>{t.geometry}</Text>

              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.axis}</Text>
                <Segmented
                  style={{ width: '100%' }}
                  block
                  value={axis}
                  onChange={setAxis}
                  options={AXIS_OPTIONS[lang]}
                />
              </Space>

              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.trigger}</Text>
                <Segmented
                  style={{ width: '100%' }}
                  block
                  value={trigger}
                  onChange={setTrigger}
                  options={TRIGGER_OPTIONS[lang]}
                />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.width}</Text>
                <Text code>{width}px</Text>
              </Space>
              <Slider min={120} max={600} value={width} onChange={setWidth} />

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.height}</Text>
                <Text code>{height}px</Text>
              </Space>
              <Slider min={120} max={800} value={height} onChange={setHeight} />

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.borderRadius}</Text>
                <Text code>{borderRadius}px</Text>
              </Space>
              <Slider min={0} max={120} value={borderRadius} onChange={setBorderRadius} />

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.perspective}</Text>
                <Text code>{perspective}px</Text>
              </Space>
              <Slider min={200} max={3000} value={perspective} onChange={setPerspective} />

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.duration}</Text>
                <Text code>{duration}ms</Text>
              </Space>
              <Slider min={100} max={3000} value={duration} onChange={setDuration} />

              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.easing}</Text>
                <Segmented
                  style={{ width: '100%' }}
                  block
                  value={easing}
                  onChange={setEasing}
                  options={EASING_OPTIONS[lang]}
                />
              </Space>

              <Text strong style={{ marginTop: 8 }}>{t.appearance}</Text>

              <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>{t.frontBg}</Text>
                <ColorPicker value={frontBg} onChange={setFrontBg} showText />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>{t.frontText}</Text>
                <ColorPicker value={frontText} onChange={setFrontText} showText />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>{t.backBg}</Text>
                <ColorPicker value={backBg} onChange={setBackBg} showText />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>{t.backText}</Text>
                <ColorPicker value={backText} onChange={setBackText} showText />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>{t.borderColor}</Text>
                <ColorPicker value={borderColor} onChange={setBorderColor} showText />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.borderWidth}</Text>
                <Text code>{borderWidth}px</Text>
              </Space>
              <Slider min={0} max={16} value={borderWidth} onChange={setBorderWidth} />

              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.shadow}</Text>
                <Input
                  value={shadow}
                  onChange={(e) => setShadow(e.target.value)}
                  placeholder="0 12px 40px rgba(0,0,0,0.18)"
                />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>{t.shadowOnFlip}</Text>
                <Switch size="small" checked={shadowOnFlip} onChange={setShadowOnFlip} />
              </Space>

              {shadowOnFlip && (
                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                  <Text>{t.hoverShadowLabel}</Text>
                  <Input
                    value={hoverShadow}
                    onChange={(e) => setHoverShadow(e.target.value)}
                    placeholder="0 20px 56px rgba(0,0,0,0.22)"
                  />
                </Space>
              )}

              <Text strong style={{ marginTop: 8 }}>{t.content}</Text>

              <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>{t.showIcon}</Text>
                <Switch size="small" checked={showIcon} onChange={setShowIcon} />
              </Space>

              {showIcon && (
                <>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text>{t.iconSize}</Text>
                    <Text code>{iconSize}px</Text>
                  </Space>
                  <Slider min={16} max={120} value={iconSize} onChange={setIconSize} />
                </>
              )}

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.contentPadding}</Text>
                <Text code>{contentPadding}px</Text>
              </Space>
              <Slider min={8} max={64} value={contentPadding} onChange={setContentPadding} />

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.titleSize}</Text>
                <Text code>{titleSize}px</Text>
              </Space>
              <Slider min={12} max={64} value={titleSize} onChange={setTitleSize} />

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.bodySize}</Text>
                <Text code>{bodySize}px</Text>
              </Space>
              <Slider min={10} max={32} value={bodySize} onChange={setBodySize} />

              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.frontTitle}</Text>
                <Input value={frontTitle} onChange={(e) => setFrontTitle(e.target.value)} />
              </Space>

              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.frontBody}</Text>
                <Input.TextArea rows={2} value={frontBody} onChange={(e) => setFrontBody(e.target.value)} />
              </Space>

              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.backTitle}</Text>
                <Input value={backTitle} onChange={(e) => setBackTitle(e.target.value)} />
              </Space>

              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.backBody}</Text>
                <Input.TextArea rows={2} value={backBody} onChange={(e) => setBackBody(e.target.value)} />
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
                alignItems: 'flex-start',
                justifyContent: 'center',
                minHeight: 320,
              }}
            >
              <style>{cssOutput}</style>
              {trigger === 'click' ? (
                <label className="flip-card" style={{ cursor: 'pointer' }}>
                  <input type="checkbox" className="flip-card__toggle" aria-label="Virar card" />
                  <div className="flip-card__inner">
                    <div className="flip-card__front">
                      {showIcon && (
                        <svg className="flip-card__icon" viewBox="0 0 24 24">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
                        </svg>
                      )}
                      <h3 className="flip-card__title">{frontTitle}</h3>
                      <p className="flip-card__body">{frontBody}</p>
                    </div>
                    <div className="flip-card__back">
                      <h3 className="flip-card__title">{backTitle}</h3>
                      <p className="flip-card__body">{backBody}</p>
                    </div>
                  </div>
                </label>
              ) : (
                <div className="flip-card">
                  <div className="flip-card__inner">
                    <div className="flip-card__front">
                      {showIcon && (
                        <svg className="flip-card__icon" viewBox="0 0 24 24">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
                        </svg>
                      )}
                      <h3 className="flip-card__title">{frontTitle}</h3>
                      <p className="flip-card__body">{frontBody}</p>
                    </div>
                    <div className="flip-card__back">
                      <h3 className="flip-card__title">{backTitle}</h3>
                      <p className="flip-card__body">{backBody}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <Paragraph type="secondary" style={{ marginTop: 12, marginBottom: 0 }}>
              {trigger === 'click' ? t.previewClick : t.previewHover}
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
            label: `${t.sourceCol} — buildFlipCardCss / buildFlipCardHtml`,
            children: (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Paragraph type="secondary">{t.sourceBody}</Paragraph>
                <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 320 }}>
                  <code>{buildFlipCardCss.toString()}</code>
                </pre>
              </Space>
            ),
          },
        ]}
      />
    </Space>
  )
}
