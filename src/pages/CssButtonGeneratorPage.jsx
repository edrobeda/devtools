import React, { useMemo, useState } from 'react'
import {
  Typography, Card, Space, Slider, Segmented, Alert, Button, Collapse,
  message, ColorPicker, Row, Col, Input, Switch, Tabs,
} from 'antd'
import { BgColorsOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  buildButtonCss,
  buildButtonHtml,
  buildButtonFullDemo,
  ICON_SVGS,
  PRESETS,
  DEFAULTS,
} from '../utils/cssButtonGenerator'

const { Title, Paragraph, Text } = Typography
const { useMessage } = message

const VARIANT_OPTIONS = {
  pt: [
    { label: 'Sólido', value: 'solid' },
    { label: 'Contorno', value: 'outline' },
    { label: 'Suave', value: 'soft' },
    { label: 'Ghost', value: 'ghost' },
    { label: 'Gradiente', value: 'gradient' },
  ],
  en: [
    { label: 'Solid', value: 'solid' },
    { label: 'Outline', value: 'outline' },
    { label: 'Soft', value: 'soft' },
    { label: 'Ghost', value: 'ghost' },
    { label: 'Gradient', value: 'gradient' },
  ],
}

const SHAPE_OPTIONS = {
  pt: [
    { label: 'Pílula', value: 'pill' },
    { label: 'Arredondado', value: 'rounded' },
    { label: 'Quadrado', value: 'square' },
  ],
  en: [
    { label: 'Pill', value: 'pill' },
    { label: 'Rounded', value: 'rounded' },
    { label: 'Square', value: 'square' },
  ],
}

const ICON_OPTIONS = {
  pt: [
    { label: 'Nenhum', value: 'none' },
    { label: 'Seta', value: 'arrow' },
    { label: 'Check', value: 'check' },
    { label: 'Coração', value: 'heart' },
    { label: 'Estrela', value: 'star' },
    { label: 'Mais', value: 'plus' },
    { label: 'Download', value: 'download' },
  ],
  en: [
    { label: 'None', value: 'none' },
    { label: 'Arrow', value: 'arrow' },
    { label: 'Check', value: 'check' },
    { label: 'Heart', value: 'heart' },
    { label: 'Star', value: 'star' },
    { label: 'Plus', value: 'plus' },
    { label: 'Download', value: 'download' },
  ],
}

const PRESET_ORDER = ['default', 'primary', 'success', 'danger', 'warning', 'outline', 'soft', 'ghost', 'dark', 'gradient']

const translations = {
  pt: {
    title: 'Gerador de Button CSS',
    intro: (
      <>
        Crie botões customizados usando só CSS. Escolha entre os estilos sólido,
        contorno, suave, ghost e gradiente, ajuste cores, formato, sombra,
        estados hover/active/disabled, ícones e largura total. O preview injeta
        exatamente o CSS gerado, então você vê o resultado final em tempo real.
      </>
    ),
    tipTitle: 'Como funciona (e as pegadinhas)',
    tipBody: (
      <>
        Um botão é tipicamente um <Text code>{'<button class="btn">'}</Text> com
        filhos <Text code>{'.btn__icon'}</Text> e{' '}
        <Text code>{'.btn__text'}</Text>. As variações compartilham a mesma
        estrutura HTML e só trocam <Text code>background</Text>,{' '}
        <Text code>color</Text> e <Text code>border</Text>. Prefira sempre{' '}
        <Text code>type="button"</Text> quando o botão não for submit de
        formulário, e mantenha <Text code>focus-visible</Text> visível para
        acessibilidade. No estado <Text code>disabled</Text>, remova transformações
        e sombras para evitar estados visuais conflitantes.
      </>
    ),
    settings: 'Configurações',
    presets: 'Presets',
    content: 'Conteúdo',
    text: 'Texto do botão',
    variant: 'Variação',
    shape: 'Forma',
    color: 'Cor principal',
    textColor: 'Cor do texto',
    autoText: 'Texto automático (contraste)',
    borderColor: 'Cor da borda',
    borderWidth: 'Espessura da borda',
    fontSize: 'Tamanho da fonte (px)',
    fontWeight: 'Peso da fonte',
    paddingX: 'Padding horizontal (px)',
    paddingY: 'Padding vertical (px)',
    shadow: 'Sombra normal',
    hoverShadow: 'Sombra no hover',
    hoverLift: 'Levantar no hover (translateY)',
    transitionDuration: 'Duração da transição (ms)',
    activeScale: 'Escala no active',
    fullWidth: 'Largura total',
    leftIcon: 'Ícone à esquerda',
    rightIcon: 'Ícone à direita',
    disabled: 'Estado disabled',
    loading: 'Estado loading',
    className: 'Nome da classe CSS',
    preview: 'Pré-visualização',
    previewHint: 'Os botões abaixo usam exatamente o CSS gerado. Passe o mouse e clique para testar os estados.',
    outputCss: 'CSS gerado',
    outputHtml: 'HTML de exemplo',
    outputFull: 'Bloco completo',
    copy: 'Copiar',
    copied: 'Copiado!',
    copyError: 'Não foi possível copiar',
    sourceCol: 'Código-fonte',
    sourceBody:
      'O núcleo vive em src/utils/cssButtonGenerator.js. buildButtonCss monta as regras de .btn e seus estados a partir da variação (solid/outline/soft/ghost/gradient) e da forma (pill/rounded/square); buildButtonHtml gera o markup semântico com escape básico do texto e ícones/spinner inline.',
  },
  en: {
    title: 'CSS Button Generator',
    intro: (
      <>
        Build custom buttons using only CSS. Choose solid, outline, soft, ghost or
        gradient styles, tweak colors, shape, shadow, hover/active/disabled states,
        icons and full width. The preview injects the exact generated CSS, so you
        see the final result in real time.
      </>
    ),
    tipTitle: 'How it works (and the gotchas)',
    tipBody: (
      <>
        A button is typically a <Text code>{'<button class="btn">'}</Text> with
        children <Text code>{'.btn__icon'}</Text> and{' '}
        <Text code>{'.btn__text'}</Text>. Variants share the same HTML structure
        and only swap <Text code>background</Text>, <Text code>color</Text> and{' '}
        <Text code>border</Text>. Always prefer <Text code>type="button"</Text>{' '}
        when the button is not a form submit, and keep{' '}
        <Text code>focus-visible</Text> visible for accessibility. In the{' '}
        <Text code>disabled</Text> state, remove transforms and shadows to avoid
        conflicting visuals.
      </>
    ),
    settings: 'Settings',
    presets: 'Presets',
    content: 'Content',
    text: 'Button text',
    variant: 'Variant',
    shape: 'Shape',
    color: 'Main color',
    textColor: 'Text color',
    autoText: 'Auto text color (contrast)',
    borderColor: 'Border color',
    borderWidth: 'Border width',
    fontSize: 'Font size (px)',
    fontWeight: 'Font weight',
    paddingX: 'Horizontal padding (px)',
    paddingY: 'Vertical padding (px)',
    shadow: 'Normal shadow',
    hoverShadow: 'Hover shadow',
    hoverLift: 'Lift on hover (translateY)',
    transitionDuration: 'Transition duration (ms)',
    activeScale: 'Active scale',
    fullWidth: 'Full width',
    leftIcon: 'Left icon',
    rightIcon: 'Right icon',
    disabled: 'Disabled state',
    loading: 'Loading state',
    className: 'CSS class name',
    preview: 'Preview',
    previewHint: 'The buttons below use the exact generated CSS. Hover and click to test the states.',
    outputCss: 'Generated CSS',
    outputHtml: 'Example HTML',
    outputFull: 'Full block',
    copy: 'Copy',
    copied: 'Copied!',
    copyError: 'Could not copy',
    sourceCol: 'Source code',
    sourceBody:
      'The core lives in src/utils/cssButtonGenerator.js. buildButtonCss builds the rules for .btn and its states based on the variant (solid/outline/soft/ghost/gradient) and shape (pill/rounded/square); buildButtonHtml generates semantic markup with basic text escaping and inline icons/spinner.',
  },
}

export default function CssButtonGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [messageApi, messageContextHolder] = useMessage()

  const [text, setText] = useState(DEFAULTS.text)
  const [variant, setVariant] = useState(DEFAULTS.variant)
  const [shape, setShape] = useState(DEFAULTS.shape)
  const [color, setColor] = useState(DEFAULTS.color)
  const [textColor, setTextColor] = useState(DEFAULTS.textColor)
  const [autoText, setAutoText] = useState(DEFAULTS.autoText)
  const [borderColor, setBorderColor] = useState(DEFAULTS.borderColor)
  const [borderWidth, setBorderWidth] = useState(DEFAULTS.borderWidth)
  const [fontSize, setFontSize] = useState(DEFAULTS.fontSize)
  const [fontWeight, setFontWeight] = useState(DEFAULTS.fontWeight)
  const [paddingX, setPaddingX] = useState(DEFAULTS.paddingX)
  const [paddingY, setPaddingY] = useState(DEFAULTS.paddingY)
  const [shadow, setShadow] = useState(DEFAULTS.shadow)
  const [hoverShadow, setHoverShadow] = useState(DEFAULTS.hoverShadow)
  const [hoverLift, setHoverLift] = useState(DEFAULTS.hoverLift)
  const [transitionDuration, setTransitionDuration] = useState(DEFAULTS.transitionDuration)
  const [activeScale, setActiveScale] = useState(DEFAULTS.activeScale)
  const [fullWidth, setFullWidth] = useState(DEFAULTS.fullWidth)
  const [leftIcon, setLeftIcon] = useState(DEFAULTS.leftIcon)
  const [rightIcon, setRightIcon] = useState(DEFAULTS.rightIcon)
  const [disabled, setDisabled] = useState(DEFAULTS.disabled)
  const [loading, setLoading] = useState(DEFAULTS.loading)
  const [className, setClassName] = useState(DEFAULTS.className)

  const applyPreset = (key) => {
    const p = PRESETS[key]
    if (!p) return
    setText(p.text)
    setVariant(p.variant)
    setShape(p.shape)
    setColor(p.color)
    setTextColor(p.textColor)
    setAutoText(p.autoText)
    setBorderColor(p.borderColor)
    setBorderWidth(p.borderWidth)
    setFontSize(p.fontSize)
    setFontWeight(p.fontWeight)
    setPaddingX(p.paddingX)
    setPaddingY(p.paddingY)
    setShadow(p.shadow)
    setHoverShadow(p.hoverShadow)
    setHoverLift(p.hoverLift)
    setTransitionDuration(p.transitionDuration)
    setActiveScale(p.activeScale)
    setFullWidth(p.fullWidth)
    setLeftIcon(p.leftIcon)
    setRightIcon(p.rightIcon)
    setDisabled(p.disabled)
    setLoading(p.loading)
    setClassName(p.className)
  }

  const settings = useMemo(
    () => ({
      text,
      variant,
      shape,
      color,
      textColor,
      autoText,
      borderColor,
      borderWidth,
      fontSize,
      fontWeight,
      paddingX,
      paddingY,
      shadow,
      hoverShadow,
      hoverLift,
      transitionDuration,
      activeScale,
      fullWidth,
      leftIcon,
      rightIcon,
      disabled,
      loading,
      className,
    }),
    [
      text,
      variant,
      shape,
      color,
      textColor,
      autoText,
      borderColor,
      borderWidth,
      fontSize,
      fontWeight,
      paddingX,
      paddingY,
      shadow,
      hoverShadow,
      hoverLift,
      transitionDuration,
      activeScale,
      fullWidth,
      leftIcon,
      rightIcon,
      disabled,
      loading,
      className,
    ]
  )

  const cssOutput = useMemo(() => buildButtonCss(settings), [settings])
  const htmlOutput = useMemo(() => buildButtonHtml(settings), [settings])
  const fullOutput = useMemo(() => buildButtonFullDemo(settings), [settings])

  const copy = async (value) => {
    try {
      await navigator.clipboard.writeText(value)
      messageApi.success(t.copied)
    } catch {
      messageApi.error(t.copyError)
    }
  }

  const renderIcon = (type) => {
    if (!type || type === 'none') return null
    const svg = ICON_SVGS[type]
    if (!svg) return null
    return <span className={`${className}__icon`} dangerouslySetInnerHTML={{ __html: svg }} />
  }

  const renderButton = (overrideText) => {
    const left = renderIcon(leftIcon)
    const right = renderIcon(rightIcon)
    const spinner = loading ? (
      <span className={`${className}__spinner`} dangerouslySetInnerHTML={{ __html: ICON_SVGS.spinner }} />
    ) : null

    return (
      <button
        type="button"
        className={className}
        disabled={disabled}
        aria-busy={loading || undefined}
        style={{ pointerEvents: disabled ? 'none' : undefined }}
      >
        {spinner}
        {left}
        <span className={`${className}__text`}>{overrideText || text}</span>
        {right}
      </button>
    )
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
                <Text>{t.variant}</Text>
                <Segmented
                  style={{ width: '100%' }}
                  block
                  value={variant}
                  onChange={setVariant}
                  options={VARIANT_OPTIONS[lang]}
                />
              </Space>

              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.shape}</Text>
                <Segmented
                  style={{ width: '100%' }}
                  block
                  value={shape}
                  onChange={setShape}
                  options={SHAPE_OPTIONS[lang]}
                />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>{t.color}</Text>
                <ColorPicker value={color} onChange={setColor} showText />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>{t.autoText}</Text>
                <Switch size="small" checked={autoText} onChange={setAutoText} />
              </Space>

              {!autoText && (
                <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text>{t.textColor}</Text>
                  <ColorPicker value={textColor} onChange={setTextColor} showText />
                </Space>
              )}

              <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>{t.borderColor}</Text>
                <ColorPicker value={borderColor} onChange={setBorderColor} showText />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.borderWidth}</Text>
                <Text code>{borderWidth}px</Text>
              </Space>
              <Slider min={0} max={8} step={1} value={borderWidth} onChange={setBorderWidth} />

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.fontSize}</Text>
                <Text code>{fontSize}px</Text>
              </Space>
              <Slider min={10} max={40} value={fontSize} onChange={setFontSize} />

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.fontWeight}</Text>
                <Text code>{fontWeight}</Text>
              </Space>
              <Slider min={100} max={900} step={100} value={fontWeight} onChange={setFontWeight} />

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.paddingX}</Text>
                <Text code>{paddingX}px</Text>
              </Space>
              <Slider min={0} max={64} value={paddingX} onChange={setPaddingX} />

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.paddingY}</Text>
                <Text code>{paddingY}px</Text>
              </Space>
              <Slider min={0} max={40} value={paddingY} onChange={setPaddingY} />

              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.shadow}</Text>
                <Input
                  value={shadow}
                  onChange={(e) => setShadow(e.target.value)}
                  placeholder="0 2px 4px rgba(0,0,0,0.15)"
                />
              </Space>

              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.hoverShadow}</Text>
                <Input
                  value={hoverShadow}
                  onChange={(e) => setHoverShadow(e.target.value)}
                  placeholder="0 4px 12px rgba(0,0,0,0.2)"
                />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.transitionDuration}</Text>
                <Text code>{transitionDuration}ms</Text>
              </Space>
              <Slider min={0} max={600} value={transitionDuration} onChange={setTransitionDuration} />

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.activeScale}</Text>
                <Text code>{activeScale.toFixed(2)}</Text>
              </Space>
              <Slider min={0.8} max={1} step={0.01} value={activeScale} onChange={setActiveScale} />

              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.leftIcon}</Text>
                <Segmented
                  style={{ width: '100%' }}
                  block
                  value={leftIcon}
                  onChange={setLeftIcon}
                  options={ICON_OPTIONS[lang]}
                />
              </Space>

              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.rightIcon}</Text>
                <Segmented
                  style={{ width: '100%' }}
                  block
                  value={rightIcon}
                  onChange={setRightIcon}
                  options={ICON_OPTIONS[lang]}
                />
              </Space>

              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.className}</Text>
                <Input value={className} onChange={(e) => setClassName(e.target.value)} />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>{t.hoverLift}</Text>
                <Switch size="small" checked={hoverLift} onChange={setHoverLift} />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>{t.fullWidth}</Text>
                <Switch size="small" checked={fullWidth} onChange={setFullWidth} />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>{t.disabled}</Text>
                <Switch size="small" checked={disabled} onChange={setDisabled} />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>{t.loading}</Text>
                <Switch size="small" checked={loading} onChange={setLoading} />
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
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 16,
                minHeight: 180,
                flexDirection: 'column',
              }}
            >
              {renderButton()}
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', width: fullWidth ? '100%' : undefined }}>
                {renderButton(t.title)}
                {renderButton('OK')}
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
            label: `${t.sourceCol} — buildButtonCss / buildButtonHtml`,
            children: (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Paragraph type="secondary">{t.sourceBody}</Paragraph>
                <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 320 }}>
                  <code>{buildButtonCss.toString()}</code>
                </pre>
              </Space>
            ),
          },
        ]}
      />
    </Space>
  )
}
