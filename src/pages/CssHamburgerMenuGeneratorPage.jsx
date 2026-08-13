import React, { useMemo, useState } from 'react'
import {
  Typography, Card, Space, Slider, Segmented, Alert, Button, Collapse,
  message, ColorPicker, Row, Col, Input, Switch, Tabs, Select,
} from 'antd'
import { MenuOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  buildHamburgerCss,
  buildHamburgerHtml,
  buildHamburgerFullDemo,
  PRESETS,
  DEFAULTS,
} from '../utils/cssHamburgerMenuGenerator'

const { Title, Paragraph, Text } = Typography
const { useMessage } = message

const ANIMATION_OPTIONS = {
  pt: [
    { label: 'X (fechar)', value: 'x' },
    { label: 'Seta ←', value: 'arrow-left' },
    { label: 'Seta →', value: 'arrow-right' },
    { label: 'Traço (minus)', value: 'minus' },
  ],
  en: [
    { label: 'X (close)', value: 'x' },
    { label: 'Arrow ←', value: 'arrow-left' },
    { label: 'Arrow →', value: 'arrow-right' },
    { label: 'Minus', value: 'minus' },
  ],
}

const EASING_OPTIONS = {
  pt: [
    { label: 'Ease', value: 'ease' },
    { label: 'Ease-in-out', value: 'ease-in-out' },
    { label: 'Linear', value: 'linear' },
  ],
  en: [
    { label: 'Ease', value: 'ease' },
    { label: 'Ease-in-out', value: 'ease-in-out' },
    { label: 'Linear', value: 'linear' },
  ],
}

const PRESET_ORDER = ['default', 'minimal', 'thick', 'rounded', 'arrow-left', 'arrow-right', 'minus']

const translations = {
  pt: {
    title: 'Gerador de Hambúrguer Menu CSS',
    intro: (
      <>
        Crie ícones de menu hambúrguer funcionais usando só CSS + um checkbox.
        Escolha a animação (X, seta para esquerda/direita ou traço), ajuste as
        barras, cores, padding, borda e transição; o preview usa o CSS exato que
        será copiado, então você clica e vê a animação em tempo real.
      </>
    ),
    tipTitle: 'Como funciona',
    tipBody: (
      <>
        O input real fica invisível (mas acessível) e o{' '}
        <Text code>{'<label>'}</Text> envolve um{' '}
        <Text code>{'<span class="hamburger-box">'}</Text> com três barras. As
        transformações no estado <Text code>:checked</Text> usam{' '}
        <Text code>translateY</Text> + <Text code>rotate</Text> para formar o X
        ou as setas, e <Text code>scaleX</Text> para encurtar a barra do meio.
        Use <Text code>aria-label</Text> e <Text code>aria-expanded</Text> se
        controlar o menu via JavaScript.
      </>
    ),
    settings: 'Configurações',
    animation: 'Animação',
    width: 'Largura das barras (px)',
    barHeight: 'Altura de cada barra (px)',
    gap: 'Espaçamento entre barras (px)',
    barRadius: 'Arredondamento das barras (px)',
    padding: 'Padding do botão (px)',
    buttonRadius: 'Arredondamento do botão (px)',
    borderWidth: 'Espessura da borda (px)',
    color: 'Cor das barras',
    activeColor: 'Cor das barras (ativo)',
    background: 'Fundo do botão',
    borderColor: 'Cor da borda',
    transitionDuration: 'Duração da transição (ms)',
    easing: 'Easing',
    hoverScale: 'Escala no hover',
    ariaLabel: 'aria-label',
    checked: 'Marcado por padrão no preview',
    preview: 'Pré-visualização',
    previewHint: 'Clique no ícone abaixo para testar o CSS gerado.',
    outputCss: 'CSS gerado',
    outputHtml: 'HTML de exemplo',
    outputFull: 'Bloco completo',
    copy: 'Copiar',
    copied: 'Copiado!',
    copyError: 'Não foi possível copiar',
    presets: 'Presets',
    sourceCol: 'Código-fonte',
    sourceBody:
      'O núcleo vive em src/utils/cssHamburgerMenuGenerator.js. buildHamburgerCss monta as regras do container, do checkbox oculto, do botão, das três barras e dos estados :checked para cada animação. buildHamburgerHtml gera o markup semântico com aria-label opcional.',
  },
  en: {
    title: 'CSS Hamburger Menu Generator',
    intro: (
      <>
        Build working hamburger menu icons using only CSS + a checkbox. Choose
        the animation (X, left/right arrow or minus), tweak the bars, colors,
        padding, border and transition; the preview uses the exact CSS that will
        be copied, so click it and see the animation in real time.
      </>
    ),
    tipTitle: 'How it works',
    tipBody: (
      <>
        The real input is visually hidden (but accessible) and the{' '}
        <Text code>{'<label>'}</Text> wraps a{' '}
        <Text code>{'<span class="hamburger-box">'}</Text> with three bars. The
        transformations in the <Text code>:checked</Text> state use{' '}
        <Text code>translateY</Text> + <Text code>rotate</Text> to form the X or
        arrows, and <Text code>scaleX</Text> to shorten the middle bar. Use{' '}
        <Text code>aria-label</Text> and <Text code>aria-expanded</Text> if you
        control the menu with JavaScript.
      </>
    ),
    settings: 'Settings',
    animation: 'Animation',
    width: 'Bar width (px)',
    barHeight: 'Bar height (px)',
    gap: 'Gap between bars (px)',
    barRadius: 'Bar border radius (px)',
    padding: 'Button padding (px)',
    buttonRadius: 'Button border radius (px)',
    borderWidth: 'Border width (px)',
    color: 'Bar color',
    activeColor: 'Bar color (active)',
    background: 'Button background',
    borderColor: 'Border color',
    transitionDuration: 'Transition duration (ms)',
    easing: 'Easing',
    hoverScale: 'Hover scale',
    ariaLabel: 'aria-label',
    checked: 'Checked by default in preview',
    preview: 'Preview',
    previewHint: 'Click the icon below to test the generated CSS.',
    outputCss: 'Generated CSS',
    outputHtml: 'Example HTML',
    outputFull: 'Full block',
    copy: 'Copy',
    copied: 'Copied!',
    copyError: 'Could not copy',
    presets: 'Presets',
    sourceCol: 'Source code',
    sourceBody:
      'The core lives in src/utils/cssHamburgerMenuGenerator.js. buildHamburgerCss builds the rules for the container, hidden checkbox, button, three bars and :checked states for each animation. buildHamburgerHtml generates semantic markup with optional aria-label.',
  },
}

export default function CssHamburgerMenuGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [messageApi, messageContextHolder] = useMessage()

  const [animation, setAnimation] = useState(DEFAULTS.animation)
  const [width, setWidth] = useState(DEFAULTS.width)
  const [barHeight, setBarHeight] = useState(DEFAULTS.barHeight)
  const [gap, setGap] = useState(DEFAULTS.gap)
  const [barRadius, setBarRadius] = useState(DEFAULTS.barRadius)
  const [color, setColor] = useState(DEFAULTS.color)
  const [activeColor, setActiveColor] = useState(DEFAULTS.activeColor)
  const [background, setBackground] = useState(DEFAULTS.background)
  const [padding, setPadding] = useState(DEFAULTS.padding)
  const [buttonBorderRadius, setButtonBorderRadius] = useState(DEFAULTS.buttonBorderRadius)
  const [borderWidth, setBorderWidth] = useState(DEFAULTS.borderWidth)
  const [borderColor, setBorderColor] = useState(DEFAULTS.borderColor)
  const [transitionDuration, setTransitionDuration] = useState(DEFAULTS.transitionDuration)
  const [easing, setEasing] = useState(DEFAULTS.easing)
  const [hoverScale, setHoverScale] = useState(DEFAULTS.hoverScale)
  const [ariaLabel, setAriaLabel] = useState(DEFAULTS.ariaLabel)
  const [checked, setChecked] = useState(DEFAULTS.checked)

  const settings = useMemo(
    () => ({
      animation,
      width,
      barHeight,
      gap,
      barRadius,
      color,
      activeColor,
      background,
      padding,
      buttonBorderRadius,
      borderWidth,
      borderColor,
      transitionDuration,
      easing,
      hoverScale,
      ariaLabel,
      checked,
    }),
    [
      animation,
      width,
      barHeight,
      gap,
      barRadius,
      color,
      activeColor,
      background,
      padding,
      buttonBorderRadius,
      borderWidth,
      borderColor,
      transitionDuration,
      easing,
      hoverScale,
      ariaLabel,
      checked,
    ]
  )

  const cssOutput = useMemo(() => buildHamburgerCss(settings), [settings])
  const htmlOutput = useMemo(() => buildHamburgerHtml(settings), [settings])
  const fullOutput = useMemo(() => buildHamburgerFullDemo(settings), [settings])

  const applyPreset = (key) => {
    const p = PRESETS[key]
    if (!p) return
    setAnimation(p.animation)
    setWidth(p.width)
    setBarHeight(p.barHeight)
    setGap(p.gap)
    setBarRadius(p.barRadius)
    setColor(p.color)
    setActiveColor(p.activeColor)
    setBackground(p.background)
    setPadding(p.padding)
    setButtonBorderRadius(p.buttonBorderRadius)
    setBorderWidth(p.borderWidth)
    setBorderColor(p.borderColor)
    setTransitionDuration(p.transitionDuration)
    setEasing(p.easing)
    setHoverScale(p.hoverScale)
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
      <Title level={2}><MenuOutlined /> {t.title}</Title>
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
                  label: key,
                }))}
              />

              <Space direction="vertical" size={4} style={{ width: '100%', marginTop: 8 }}>
                <Text>{t.animation}</Text>
                <Segmented
                  style={{ width: '100%' }}
                  block
                  value={animation}
                  onChange={setAnimation}
                  options={ANIMATION_OPTIONS[lang]}
                />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.width}</Text>
                <Text code>{width}px</Text>
              </Space>
              <Slider min={12} max={120} value={width} onChange={setWidth} />

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.barHeight}</Text>
                <Text code>{barHeight}px</Text>
              </Space>
              <Slider min={1} max={30} value={barHeight} onChange={setBarHeight} />

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.gap}</Text>
                <Text code>{gap}px</Text>
              </Space>
              <Slider min={0} max={60} value={gap} onChange={setGap} />

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.barRadius}</Text>
                <Text code>{barRadius}px</Text>
              </Space>
              <Slider min={0} max={Math.max(15, Math.floor(barHeight / 2))} value={barRadius} onChange={setBarRadius} />

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.padding}</Text>
                <Text code>{padding}px</Text>
              </Space>
              <Slider min={0} max={40} value={padding} onChange={setPadding} />

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.buttonRadius}</Text>
                <Text code>{buttonBorderRadius}px</Text>
              </Space>
              <Slider min={0} max={200} value={buttonBorderRadius} onChange={setButtonBorderRadius} />

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.borderWidth}</Text>
                <Text code>{borderWidth}px</Text>
              </Space>
              <Slider min={0} max={10} value={borderWidth} onChange={setBorderWidth} />

              <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>{t.color}</Text>
                <ColorPicker value={color} onChange={setColor} showText />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>{t.activeColor}</Text>
                <ColorPicker value={activeColor} onChange={setActiveColor} showText />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>{t.borderColor}</Text>
                <ColorPicker value={borderColor} onChange={setBorderColor} showText />
              </Space>

              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.background}</Text>
                <Input
                  value={background}
                  onChange={(e) => setBackground(e.target.value)}
                  placeholder="transparent"
                />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.transitionDuration}</Text>
                <Text code>{transitionDuration}ms</Text>
              </Space>
              <Slider min={0} max={1000} value={transitionDuration} onChange={setTransitionDuration} />

              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.easing}</Text>
                <Select
                  style={{ width: '100%' }}
                  value={easing}
                  onChange={setEasing}
                  options={EASING_OPTIONS[lang]}
                />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.hoverScale}</Text>
                <Text code>{hoverScale.toFixed(2)}x</Text>
              </Space>
              <Slider min={1} max={1.2} step={0.01} value={hoverScale} onChange={setHoverScale} />

              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.ariaLabel}</Text>
                <Input
                  value={ariaLabel}
                  onChange={(e) => setAriaLabel(e.target.value)}
                  placeholder="Open navigation menu"
                />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>{t.checked}</Text>
                <Switch size="small" checked={checked} onChange={setChecked} />
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
                minHeight: 180,
              }}
            >
              <style>{cssOutput}</style>
              <label className="hamburger" aria-label={ariaLabel || undefined}>
                <input type="checkbox" defaultChecked={checked} />
                <span className="hamburger-box">
                  <span className="hamburger-lines">
                    <span className="hamburger-line" />
                    <span className="hamburger-line" />
                    <span className="hamburger-line" />
                  </span>
                </span>
              </label>
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
            label: `${t.sourceCol} — buildHamburgerCss / buildHamburgerHtml`,
            children: (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Paragraph type="secondary">{t.sourceBody}</Paragraph>
                <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 320 }}>
                  <code>{buildHamburgerCss.toString()}</code>
                </pre>
              </Space>
            ),
          },
        ]}
      />
    </Space>
  )
}
