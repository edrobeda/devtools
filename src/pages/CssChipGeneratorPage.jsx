import React, { useMemo, useState } from 'react'
import {
  Typography, Card, Space, Slider, Segmented, Alert, Button, Collapse,
  message, ColorPicker, Row, Col,   Input, Switch, Tabs,
} from 'antd'
import { BgColorsOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  buildChipCss,
  buildChipHtml,
  buildChipFullDemo,
  ICON_SVGS,
  DISMISS_SVG,
  PRESETS,
  DEFAULTS,
} from '../utils/cssChipGenerator'

const { Title, Paragraph, Text } = Typography
const { useMessage } = message

const VARIANT_OPTIONS = {
  pt: [
    { label: 'Sólido', value: 'solid' },
    { label: 'Suave', value: 'soft' },
    { label: 'Contorno', value: 'outline' },
  ],
  en: [
    { label: 'Solid', value: 'solid' },
    { label: 'Soft', value: 'soft' },
    { label: 'Outline', value: 'outline' },
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

const SIZE_OPTIONS = {
  pt: [
    { label: 'P', value: 'sm' },
    { label: 'M', value: 'md' },
    { label: 'G', value: 'lg' },
  ],
  en: [
    { label: 'S', value: 'sm' },
    { label: 'M', value: 'md' },
    { label: 'L', value: 'lg' },
  ],
}

const ICON_OPTIONS = {
  pt: [
    { label: 'Estrela', value: 'star' },
    { label: 'Coração', value: 'heart' },
    { label: 'Check', value: 'check' },
    { label: 'Sino', value: 'bell' },
    { label: 'Usuário', value: 'user' },
    { label: 'Tag', value: 'tag' },
  ],
  en: [
    { label: 'Star', value: 'star' },
    { label: 'Heart', value: 'heart' },
    { label: 'Check', value: 'check' },
    { label: 'Bell', value: 'bell' },
    { label: 'User', value: 'user' },
    { label: 'Tag', value: 'tag' },
  ],
}

const translations = {
  pt: {
    title: 'Gerador de Chip/Badge CSS',
    intro: (
      <>
        Crie chips e badges customizados usando só CSS. Escolha entre os estilos
        sólido, suave ou contorno, ajuste cores, formato, ícone, indicador de
        status e botão de remover; o preview injeta exatamente o CSS gerado,
        então você vê o resultado final em tempo real.
      </>
    ),
    tipTitle: 'Como funciona (e as pegadinhas)',
    tipBody: (
      <>
        Um chip é tipicamente um <Text code>{'<span class="chip">'}</Text> com
        filhos <Text code>{'.chip-text'}</Text>,{' '}
        <Text code>{'.chip-dot'}</Text>, <Text code>{'.chip-icon'}</Text> e{' '}
        <Text code>{'.chip-dismiss'}</Text>. As variações sólida/suave/contorno
        usam a mesma estrutura HTML e só trocam <Text code>background</Text>,{' '}
        <Text code>color</Text> e <Text code>border</Text>. Se o chip for
        clicável, prefira <Text code>{'<button type="button">'}</Text> ou{' '}
        <Text code>{'<a>'}</Text> para manter a acessibilidade. O hover com{' '}
        <Text code>{'transform: scale(...)'}</Text> só é aplicado a elementos
        interativos.
      </>
    ),
    settings: 'Configurações',
    content: 'Conteúdo',
    text: 'Texto do chip',
    variant: 'Variação',
    shape: 'Forma',
    size: 'Tamanho base',
    color: 'Cor principal',
    textColor: 'Cor do texto',
    autoText: 'Texto automático (contraste)',
    borderColor: 'Cor da borda',
    borderWidth: 'Espessura da borda',
    shadow: 'Sombra',
    fontSize: 'Tamanho da fonte (px)',
    fontWeight: 'Peso da fonte',
    paddingX: 'Padding horizontal (px)',
    paddingY: 'Padding vertical (px)',
    gap: 'Espaço interno (px)',
    hasDot: 'Indicador de status (dot)',
    dotColor: 'Cor do indicador',
    hasIcon: 'Ícone à esquerda',
    iconType: 'Ícone',
    hasDismiss: 'Botão de remover (×)',
    dismissColor: 'Cor do botão remover',
    interactive: 'Chip interativo (tag <button>)',
    hoverScale: 'Escala no hover',
    transitionDuration: 'Duração da transição (ms)',
    preview: 'Pré-visualização',
    previewHint: 'Os chips abaixo usam exatamente o CSS gerado. Passe o mouse para testar o hover.',
    outputCss: 'CSS gerado',
    outputHtml: 'HTML de exemplo',
    outputFull: 'Bloco completo',
    copy: 'Copiar',
    copied: 'Copiado!',
    copyError: 'Não foi possível copiar',
    presets: 'Presets',
    sourceCol: 'Código-fonte',
    sourceBody:
      'O núcleo vive em src/utils/cssChipGenerator.js. buildChipCss monta as regras de .chip, .chip-icon, .chip-dot e .chip-dismiss a partir da variação (solid/soft/outline) e da forma (pill/rounded/square); buildChipHtml gera o markup semântico com escape básico do texto.',
  },
  en: {
    title: 'CSS Chip/Badge Generator',
    intro: (
      <>
        Build custom chips and badges using only CSS. Choose solid, soft or
        outline styles, tweak colors, shape, icon, status dot and dismiss button;
        the preview injects the exact generated CSS, so you see the final result
        in real time.
      </>
    ),
    tipTitle: 'How it works (and the gotchas)',
    tipBody: (
      <>
        A chip is typically a <Text code>{'<span class="chip">'}</Text> with
        children <Text code>{'.chip-text'}</Text>,{' '}
        <Text code>{'.chip-dot'}</Text>, <Text code>{'.chip-icon'}</Text> and{' '}
        <Text code>{'.chip-dismiss'}</Text>. The solid/soft/outline variants share
        the same HTML structure and only swap <Text code>background</Text>,{' '}
        <Text code>color</Text> and <Text code>border</Text>. If the chip is
        clickable, use <Text code>{'<button type="button">'}</Text> or{' '}
        <Text code>{'<a>'}</Text> for accessibility. The hover{' '}
        <Text code>{'transform: scale(...)'}</Text> is only applied to
        interactive elements.
      </>
    ),
    settings: 'Settings',
    content: 'Content',
    text: 'Chip text',
    variant: 'Variant',
    shape: 'Shape',
    size: 'Base size',
    color: 'Main color',
    textColor: 'Text color',
    autoText: 'Auto text color (contrast)',
    borderColor: 'Border color',
    borderWidth: 'Border width',
    shadow: 'Shadow',
    fontSize: 'Font size (px)',
    fontWeight: 'Font weight',
    paddingX: 'Horizontal padding (px)',
    paddingY: 'Vertical padding (px)',
    gap: 'Inner gap (px)',
    hasDot: 'Status dot',
    dotColor: 'Dot color',
    hasIcon: 'Left icon',
    iconType: 'Icon',
    hasDismiss: 'Dismiss button (×)',
    dismissColor: 'Dismiss color',
    interactive: 'Interactive chip (<button> tag)',
    hoverScale: 'Hover scale',
    transitionDuration: 'Transition duration (ms)',
    preview: 'Preview',
    previewHint: 'The chips below use the exact generated CSS. Hover to test the effect.',
    outputCss: 'Generated CSS',
    outputHtml: 'Example HTML',
    outputFull: 'Full block',
    copy: 'Copy',
    copied: 'Copied!',
    copyError: 'Could not copy',
    presets: 'Presets',
    sourceCol: 'Source code',
    sourceBody:
      'The core lives in src/utils/cssChipGenerator.js. buildChipCss builds the rules for .chip, .chip-icon, .chip-dot and .chip-dismiss based on the variant (solid/soft/outline) and shape (pill/rounded/square); buildChipHtml generates semantic markup with basic text escaping.',
  },
}

const PRESET_ORDER = ['default', 'success', 'warning', 'error', 'info', 'outline', 'soft', 'dark']
const SIZE_OVERRIDES = {
  sm: { fontSize: 12, paddingX: 8, paddingY: 4 },
  md: { fontSize: 14, paddingX: 12, paddingY: 6 },
  lg: { fontSize: 16, paddingX: 16, paddingY: 8 },
}

export default function CssChipGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [messageApi, messageContextHolder] = useMessage()

  const [text, setText] = useState(DEFAULTS.text)
  const [variant, setVariant] = useState(DEFAULTS.variant)
  const [shape, setShape] = useState(DEFAULTS.shape)
  const [size, setSize] = useState(DEFAULTS.size)
  const [color, setColor] = useState(DEFAULTS.color)
  const [textColor, setTextColor] = useState(DEFAULTS.textColor)
  const [autoText, setAutoText] = useState(DEFAULTS.autoText)
  const [borderColor, setBorderColor] = useState(DEFAULTS.borderColor)
  const [borderWidth, setBorderWidth] = useState(DEFAULTS.borderWidth)
  const [shadow, setShadow] = useState(DEFAULTS.shadow)
  const [fontSize, setFontSize] = useState(DEFAULTS.fontSize)
  const [fontWeight, setFontWeight] = useState(DEFAULTS.fontWeight)
  const [paddingX, setPaddingX] = useState(DEFAULTS.paddingX)
  const [paddingY, setPaddingY] = useState(DEFAULTS.paddingY)
  const [gap, setGap] = useState(DEFAULTS.gap)
  const [hasDot, setHasDot] = useState(DEFAULTS.hasDot)
  const [dotColor, setDotColor] = useState(DEFAULTS.dotColor)
  const [hasIcon, setHasIcon] = useState(DEFAULTS.hasIcon)
  const [iconType, setIconType] = useState(DEFAULTS.iconType)
  const [hasDismiss, setHasDismiss] = useState(DEFAULTS.hasDismiss)
  const [dismissColor, setDismissColor] = useState(DEFAULTS.dismissColor)
  const [interactive, setInteractive] = useState(false)
  const [hoverScale, setHoverScale] = useState(DEFAULTS.hoverScale)
  const [transitionDuration, setTransitionDuration] = useState(DEFAULTS.transitionDuration)

  const handleSizeChange = (value) => {
    const override = SIZE_OVERRIDES[value]
    if (override) {
      setFontSize(override.fontSize)
      setPaddingX(override.paddingX)
      setPaddingY(override.paddingY)
    }
    setSize(value)
  }

  const applyPreset = (key) => {
    const p = PRESETS[key]
    if (!p) return
    setText(p.text)
    setVariant(p.variant)
    setShape(p.shape)
    setSize(p.size)
    setColor(p.color)
    setTextColor(p.textColor)
    setAutoText(p.autoText)
    setBorderColor(p.borderColor)
    setBorderWidth(p.borderWidth)
    setShadow(p.shadow)
    setFontSize(p.fontSize)
    setFontWeight(p.fontWeight)
    setPaddingX(p.paddingX)
    setPaddingY(p.paddingY)
    setGap(p.gap)
    setHasDot(p.hasDot)
    setDotColor(p.dotColor)
    setHasIcon(p.hasIcon)
    setIconType(p.iconType)
    setHasDismiss(p.hasDismiss)
    setDismissColor(p.dismissColor)
    setHoverScale(p.hoverScale)
    setTransitionDuration(p.transitionDuration)
  }

  const settings = useMemo(
    () => ({
      text,
      variant,
      shape,
      size,
      color,
      textColor,
      autoText,
      borderColor,
      borderWidth,
      shadow,
      fontSize,
      fontWeight,
      paddingX,
      paddingY,
      gap,
      hasDot,
      dotColor,
      hasIcon,
      iconType,
      hasDismiss,
      dismissColor,
      interactive,
      hoverScale,
      transitionDuration,
    }),
    [
      text,
      variant,
      shape,
      size,
      color,
      textColor,
      autoText,
      borderColor,
      borderWidth,
      shadow,
      fontSize,
      fontWeight,
      paddingX,
      paddingY,
      gap,
      hasDot,
      dotColor,
      hasIcon,
      iconType,
      hasDismiss,
      dismissColor,
      interactive,
      hoverScale,
      transitionDuration,
    ]
  )

  const cssOutput = useMemo(() => buildChipCss(settings), [settings])
  const htmlOutput = useMemo(() => buildChipHtml(settings), [settings])
  const fullOutput = useMemo(() => buildChipFullDemo(settings), [settings])

  const copy = async (value) => {
    try {
      await navigator.clipboard.writeText(value)
      messageApi.success(t.copied)
    } catch {
      messageApi.error(t.copyError)
    }
  }

  const renderChip = (label) => {
    const Tag = interactive ? 'button' : 'span'
    return (
      <Tag
        key={label}
        type={interactive ? 'button' : undefined}
        className="chip"
      >
        {hasDot && <span className="chip-dot" />}
        {hasIcon && (
          <span
            className="chip-icon"
            dangerouslySetInnerHTML={{ __html: ICON_SVGS[iconType] || ICON_SVGS.star }}
          />
        )}
        <span className="chip-text">{label}</span>
        {hasDismiss && (
          <span
            className="chip-dismiss"
            dangerouslySetInnerHTML={{ __html: DISMISS_SVG }}
          />
        )}
      </Tag>
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

              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.size}</Text>
                <Segmented
                  style={{ width: '100%' }}
                  block
                  value={size}
                  onChange={handleSizeChange}
                  options={SIZE_OPTIONS[lang]}
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
              <Slider min={0} max={6} step={1} value={borderWidth} onChange={setBorderWidth} />

              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.shadow}</Text>
                <Input
                  value={shadow}
                  onChange={(e) => setShadow(e.target.value)}
                  placeholder="0 2px 4px rgba(0,0,0,0.15)"
                />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.fontSize}</Text>
                <Text code>{fontSize}px</Text>
              </Space>
              <Slider min={10} max={32} value={fontSize} onChange={setFontSize} />

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.fontWeight}</Text>
                <Text code>{fontWeight}</Text>
              </Space>
              <Slider min={100} max={900} step={100} value={fontWeight} onChange={setFontWeight} />

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.paddingX}</Text>
                <Text code>{paddingX}px</Text>
              </Space>
              <Slider min={0} max={48} value={paddingX} onChange={setPaddingX} />

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.paddingY}</Text>
                <Text code>{paddingY}px</Text>
              </Space>
              <Slider min={0} max={32} value={paddingY} onChange={setPaddingY} />

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.gap}</Text>
                <Text code>{gap}px</Text>
              </Space>
              <Slider min={0} max={24} value={gap} onChange={setGap} />

              <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>{t.hasDot}</Text>
                <Switch size="small" checked={hasDot} onChange={setHasDot} />
              </Space>

              {hasDot && (
                <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text>{t.dotColor}</Text>
                  <ColorPicker value={dotColor} onChange={setDotColor} showText />
                </Space>
              )}

              <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>{t.hasIcon}</Text>
                <Switch size="small" checked={hasIcon} onChange={setHasIcon} />
              </Space>

              {hasIcon && (
                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                  <Text>{t.iconType}</Text>
                  <Segmented
                    style={{ width: '100%' }}
                    block
                    value={iconType}
                    onChange={setIconType}
                    options={ICON_OPTIONS[lang]}
                  />
                </Space>
              )}

              <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>{t.hasDismiss}</Text>
                <Switch size="small" checked={hasDismiss} onChange={setHasDismiss} />
              </Space>

              {hasDismiss && (
                <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text>{t.dismissColor}</Text>
                  <ColorPicker value={dismissColor} onChange={setDismissColor} showText />
                </Space>
              )}

              <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>{t.interactive}</Text>
                <Switch size="small" checked={interactive} onChange={setInteractive} />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.hoverScale}</Text>
                <Text code>{hoverScale.toFixed(2)}</Text>
              </Space>
              <Slider min={0.8} max={1.2} step={0.01} value={hoverScale} onChange={setHoverScale} />

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.transitionDuration}</Text>
                <Text code>{transitionDuration}ms</Text>
              </Space>
              <Slider min={0} max={600} value={transitionDuration} onChange={setTransitionDuration} />
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
              }}
            >
              {renderChip(text)}
              {renderChip(t.title)}
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
            label: `${t.sourceCol} — buildChipCss / buildChipHtml`,
            children: (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Paragraph type="secondary">{t.sourceBody}</Paragraph>
                <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 320 }}>
                  <code>{buildChipCss.toString()}</code>
                </pre>
              </Space>
            ),
          },
        ]}
      />
    </Space>
  )
}
