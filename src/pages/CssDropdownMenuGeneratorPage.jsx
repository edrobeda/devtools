import React, { useId, useMemo, useState } from 'react'
import {
  Typography, Card, Space, Slider, Segmented, Alert, Button, Collapse,
  message, ColorPicker, Row, Col, Input, InputNumber, Switch, Tabs,
} from 'antd'
import { BgColorsOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  buildDropdownMenuCss,
  buildDropdownMenuHtml,
  buildDropdownMenuFullDemo,
  PRESETS,
  DEFAULTS,
} from '../utils/cssDropdownMenuGenerator'

const { Title, Paragraph, Text } = Typography
const { useMessage } = message

const MODE_OPTIONS = {
  pt: [
    { label: 'Hover', value: 'hover' },
    { label: 'Foco', value: 'focus' },
    { label: 'Clique', value: 'click' },
  ],
  en: [
    { label: 'Hover', value: 'hover' },
    { label: 'Focus', value: 'focus' },
    { label: 'Click', value: 'click' },
  ],
}

const POSITION_OPTIONS = {
  pt: [
    { label: 'Abaixo', value: 'bottom' },
    { label: 'Acima', value: 'top' },
    { label: 'Esquerda', value: 'left' },
    { label: 'Direita', value: 'right' },
  ],
  en: [
    { label: 'Bottom', value: 'bottom' },
    { label: 'Top', value: 'top' },
    { label: 'Left', value: 'left' },
    { label: 'Right', value: 'right' },
  ],
}

const ALIGN_OPTIONS = {
  pt: [
    { label: 'Início', value: 'start' },
    { label: 'Centro', value: 'center' },
    { label: 'Fim', value: 'end' },
  ],
  en: [
    { label: 'Start', value: 'start' },
    { label: 'Center', value: 'center' },
    { label: 'End', value: 'end' },
  ],
}

const ANIMATION_OPTIONS = {
  pt: [
    { label: 'Fade', value: 'fade' },
    { label: 'Slide', value: 'slide' },
    { label: 'Scale', value: 'scale' },
    { label: 'Nenhuma', value: 'none' },
  ],
  en: [
    { label: 'Fade', value: 'fade' },
    { label: 'Slide', value: 'slide' },
    { label: 'Scale', value: 'scale' },
    { label: 'None', value: 'none' },
  ],
}

const translations = {
  pt: {
    title: 'Gerador de Dropdown Menu CSS',
    intro: (
      <>
        Crie menus suspensos funcionais usando só CSS. Escolha como o menu
        abre — hover, foco ou clique (checkbox hack) —, a posição em relação ao
        botão, alinhamento, cores, animação e estrutura dos itens; o preview
        injeta exatamente o CSS gerado, então você interage com o resultado
        final em tempo real.
      </>
    ),
    tipTitle: 'Como funciona (e as pegadinhas)',
    tipBody: (
      <>
        O container <Text code>{'.dropdown'}</Text> envolve o botão e a lista{' '}
        <Text code>{'.dropdown-menu'}</Text>. O menu é posicionado com{' '}
        <Text code>position: absolute</Text> e revelado com{' '}
        <Text code>{':hover'}</Text>, <Text code>{':focus-within'}</Text> ou um{' '}
        <Text code>{'input[type="checkbox"]'}</Text> oculto controlado por uma{' '}
        <Text code>{'<label>'}</Text>. No modo <Text code>focus</Text>, o menu
        fecha ao clicar fora (perda de foco). No modo{' '}
        <Text code>click</Text>, cada dropdown precisa de um <Text code>id</Text>{' '}
        único no <Text code>input</Text> e no <Text code>for</Text> da label.
        Sempre use <Text code>role="menu"</Text>,{' '}
        <Text code>role="menuitem"</Text> e <Text code>aria-haspopup</Text> para
        manter a acessibilidade.
      </>
    ),
    settings: 'Configurações',
    triggerMode: 'Modo de abertura',
    position: 'Posição do menu',
    align: 'Alinhamento',
    minWidth: 'Largura mínima (px)',
    gap: 'Espaço do menu até o botão (px)',
    paddingX: 'Padding horizontal do menu (px)',
    paddingY: 'Padding vertical do menu (px)',
    itemPaddingX: 'Padding horizontal dos itens (px)',
    itemPaddingY: 'Padding vertical dos itens (px)',
    borderRadius: 'Border-radius do menu (px)',
    itemRadius: 'Border-radius dos itens (px)',
    fontSize: 'Tamanho da fonte (px)',
    transitionDuration: 'Duração da transição (ms)',
    animation: 'Animação de entrada',
    triggerText: 'Texto do botão',
    itemCount: 'Quantidade de itens',
    hasArrow: 'Mostrar seta no botão',
    hasDivider: 'Dividir itens com linha',
    background: 'Fundo do menu',
    textColor: 'Cor do texto dos itens',
    hoverBackground: 'Fundo no hover',
    hoverTextColor: 'Texto no hover',
    triggerBackground: 'Fundo do botão',
    triggerTextColor: 'Cor do texto do botão',
    triggerBorderColor: 'Cor da borda do botão',
    triggerBorderWidth: 'Espessura da borda do botão',
    borderColor: 'Cor da borda do menu',
    borderWidth: 'Espessura da borda do menu',
    shadow: 'Sombra do menu',
    preview: 'Pré-visualização',
    previewHint: 'O dropdown abaixo usa exatamente o CSS gerado. Passe o mouse, clique ou use o teclado para testar.',
    outputCss: 'CSS gerado',
    outputHtml: 'HTML de exemplo',
    outputFull: 'Bloco completo',
    copy: 'Copiar',
    copied: 'Copiado!',
    copyError: 'Não foi possível copiar',
    presets: 'Presets',
    sourceCol: 'Código-fonte',
    sourceBody:
      'O núcleo vive em src/utils/cssDropdownMenuGenerator.js. buildDropdownMenuCss monta as regras do container, do botão, da seta, do menu posicionado e dos itens; buildDropdownMenuHtml gera o markup semântico com roles ARIA e, no modo click, o checkbox hack com label.',
  },
  en: {
    title: 'CSS Dropdown Menu Generator',
    intro: (
      <>
        Build working dropdown menus using only CSS. Choose how the menu opens
        — hover, focus or click (checkbox hack) —, its position relative to the
        trigger, alignment, colors, animation and item structure; the preview
        injects the exact generated CSS, so you interact with the final result
        in real time.
      </>
    ),
    tipTitle: 'How it works (and the gotchas)',
    tipBody: (
      <>
        The <Text code>{'.dropdown'}</Text> wrapper holds the button and the{' '}
        <Text code>{'.dropdown-menu'}</Text> list. The menu is positioned with{' '}
        <Text code>position: absolute</Text> and revealed via{' '}
        <Text code>{':hover'}</Text>, <Text code>{':focus-within'}</Text> or a
        hidden <Text code>{'input[type="checkbox"]'}</Text> controlled by a{' '}
        <Text code>{'<label>'}</Text>. In <Text code>focus</Text> mode, the menu
        closes when clicking outside (focus loss). In <Text code>click</Text>{' '}
        mode, each dropdown needs a unique <Text code>id</Text> on the{' '}
        <Text code>input</Text> and matching <Text code>for</Text> on the label.
        Always use <Text code>role="menu"</Text>,{' '}
        <Text code>role="menuitem"</Text> and <Text code>aria-haspopup</Text> to
        keep it accessible.
      </>
    ),
    settings: 'Settings',
    triggerMode: 'Open mode',
    position: 'Menu position',
    align: 'Alignment',
    minWidth: 'Min width (px)',
    gap: 'Gap between menu and button (px)',
    paddingX: 'Menu horizontal padding (px)',
    paddingY: 'Menu vertical padding (px)',
    itemPaddingX: 'Item horizontal padding (px)',
    itemPaddingY: 'Item vertical padding (px)',
    borderRadius: 'Menu border-radius (px)',
    itemRadius: 'Item border-radius (px)',
    fontSize: 'Font size (px)',
    transitionDuration: 'Transition duration (ms)',
    animation: 'Entry animation',
    triggerText: 'Button text',
    itemCount: 'Number of items',
    hasArrow: 'Show arrow on button',
    hasDivider: 'Divide items with line',
    background: 'Menu background',
    textColor: 'Item text color',
    hoverBackground: 'Hover background',
    hoverTextColor: 'Hover text color',
    triggerBackground: 'Button background',
    triggerTextColor: 'Button text color',
    triggerBorderColor: 'Button border color',
    triggerBorderWidth: 'Button border width',
    borderColor: 'Menu border color',
    borderWidth: 'Menu border width',
    shadow: 'Menu shadow',
    preview: 'Preview',
    previewHint: 'The dropdown below uses the exact generated CSS. Hover, click or use the keyboard to test it.',
    outputCss: 'Generated CSS',
    outputHtml: 'Example HTML',
    outputFull: 'Full block',
    copy: 'Copy',
    copied: 'Copied!',
    copyError: 'Could not copy',
    presets: 'Presets',
    sourceCol: 'Source code',
    sourceBody:
      'The core lives in src/utils/cssDropdownMenuGenerator.js. buildDropdownMenuCss builds the rules for the container, button, arrow, positioned menu and items; buildDropdownMenuHtml generates semantic markup with ARIA roles and, in click mode, the checkbox hack with a label.',
  },
}

const PRESET_ORDER = ['default', 'dark', 'minimal', 'material', 'rounded']

export default function CssDropdownMenuGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [messageApi, messageContextHolder] = useMessage()
  const previewId = useId().replace(/:/g, '')

  const [triggerMode, setTriggerMode] = useState(DEFAULTS.triggerMode)
  const [position, setPosition] = useState(DEFAULTS.position)
  const [align, setAlign] = useState(DEFAULTS.align)
  const [minWidth, setMinWidth] = useState(DEFAULTS.minWidth)
  const [gap, setGap] = useState(DEFAULTS.gap)
  const [paddingX, setPaddingX] = useState(DEFAULTS.paddingX)
  const [paddingY, setPaddingY] = useState(DEFAULTS.paddingY)
  const [itemPaddingX, setItemPaddingX] = useState(DEFAULTS.itemPaddingX)
  const [itemPaddingY, setItemPaddingY] = useState(DEFAULTS.itemPaddingY)
  const [borderRadius, setBorderRadius] = useState(DEFAULTS.borderRadius)
  const [itemRadius, setItemRadius] = useState(DEFAULTS.itemRadius)
  const [fontSize, setFontSize] = useState(DEFAULTS.fontSize)
  const [transitionDuration, setTransitionDuration] = useState(DEFAULTS.transitionDuration)
  const [animation, setAnimation] = useState(DEFAULTS.animation)
  const [triggerText, setTriggerText] = useState('Menu')
  const [itemCount, setItemCount] = useState(DEFAULTS.itemCount)
  const [hasArrow, setHasArrow] = useState(DEFAULTS.hasArrow)
  const [hasDivider, setHasDivider] = useState(DEFAULTS.hasDivider)
  const [background, setBackground] = useState(DEFAULTS.background)
  const [textColor, setTextColor] = useState(DEFAULTS.textColor)
  const [hoverBackground, setHoverBackground] = useState(DEFAULTS.hoverBackground)
  const [hoverTextColor, setHoverTextColor] = useState(DEFAULTS.hoverTextColor)
  const [triggerBackground, setTriggerBackground] = useState(DEFAULTS.triggerBackground)
  const [triggerTextColor, setTriggerTextColor] = useState(DEFAULTS.triggerTextColor)
  const [triggerBorderColor, setTriggerBorderColor] = useState(DEFAULTS.triggerBorderColor)
  const [triggerBorderWidth, setTriggerBorderWidth] = useState(DEFAULTS.triggerBorderWidth)
  const [borderColor, setBorderColor] = useState(DEFAULTS.borderColor)
  const [borderWidth, setBorderWidth] = useState(DEFAULTS.borderWidth)
  const [shadow, setShadow] = useState(DEFAULTS.shadow)

  const settings = useMemo(
    () => ({
      triggerMode,
      position,
      align,
      minWidth,
      gap,
      paddingX,
      paddingY,
      itemPaddingX,
      itemPaddingY,
      borderRadius,
      itemRadius,
      fontSize,
      transitionDuration,
      animation,
      triggerText,
      itemCount,
      hasArrow,
      hasDivider,
      background,
      textColor,
      hoverBackground,
      hoverTextColor,
      triggerBackground,
      triggerTextColor,
      triggerBorderColor,
      triggerBorderWidth,
      borderColor,
      borderWidth,
      shadow,
    }),
    [
      triggerMode,
      position,
      align,
      minWidth,
      gap,
      paddingX,
      paddingY,
      itemPaddingX,
      itemPaddingY,
      borderRadius,
      itemRadius,
      fontSize,
      transitionDuration,
      animation,
      triggerText,
      itemCount,
      hasArrow,
      hasDivider,
      background,
      textColor,
      hoverBackground,
      hoverTextColor,
      triggerBackground,
      triggerTextColor,
      triggerBorderColor,
      triggerBorderWidth,
      borderColor,
      borderWidth,
      shadow,
    ]
  )

  const cssOutput = useMemo(() => buildDropdownMenuCss(settings), [settings])
  const htmlOutput = useMemo(() => buildDropdownMenuHtml(settings), [settings])
  const fullOutput = useMemo(() => buildDropdownMenuFullDemo(settings), [settings])

  const applyPreset = (key) => {
    const p = PRESETS[key]
    if (!p) return
    setTriggerMode(p.triggerMode)
    setPosition(p.position)
    setAlign(p.align)
    setMinWidth(p.minWidth)
    setGap(p.gap)
    setPaddingX(p.paddingX)
    setPaddingY(p.paddingY)
    setItemPaddingX(p.itemPaddingX)
    setItemPaddingY(p.itemPaddingY)
    setBorderRadius(p.borderRadius)
    setItemRadius(p.itemRadius)
    setFontSize(p.fontSize)
    setTransitionDuration(p.transitionDuration)
    setAnimation(p.animation)
    setHasArrow(p.hasArrow)
    setHasDivider(p.hasDivider)
    setBackground(p.background)
    setTextColor(p.textColor)
    setHoverBackground(p.hoverBackground)
    setHoverTextColor(p.hoverTextColor)
    setTriggerBackground(p.triggerBackground)
    setTriggerTextColor(p.triggerTextColor)
    setTriggerBorderColor(p.triggerBorderColor)
    setTriggerBorderWidth(p.triggerBorderWidth)
    setBorderColor(p.borderColor)
    setBorderWidth(p.borderWidth)
    setShadow(p.shadow)
  }

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

  const previewHtml = useMemo(() => {
    const base = buildDropdownMenuHtml(settings)
    if (triggerMode === 'click') {
      return base
        .replace(/id="dropdown-toggle"/g, `id="dropdown-toggle-${previewId}"`)
        .replace(/for="dropdown-toggle"/g, `for="dropdown-toggle-${previewId}"`)
        .replace(/id="dropdown-menu"/g, `id="dropdown-menu-${previewId}"`)
    }
    return base
  }, [settings, triggerMode, previewId])

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
                <Text>{t.triggerMode}</Text>
                <Segmented
                  style={{ width: '100%' }}
                  block
                  value={triggerMode}
                  onChange={setTriggerMode}
                  options={MODE_OPTIONS[lang]}
                />
              </Space>

              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.position}</Text>
                <Segmented
                  style={{ width: '100%' }}
                  block
                  value={position}
                  onChange={setPosition}
                  options={POSITION_OPTIONS[lang]}
                />
              </Space>

              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.align}</Text>
                <Segmented
                  style={{ width: '100%' }}
                  block
                  value={align}
                  onChange={setAlign}
                  options={ALIGN_OPTIONS[lang]}
                />
              </Space>

              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.animation}</Text>
                <Segmented
                  style={{ width: '100%' }}
                  block
                  value={animation}
                  onChange={setAnimation}
                  options={ANIMATION_OPTIONS[lang]}
                />
              </Space>

              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.triggerText}</Text>
                <Input
                  value={triggerText}
                  onChange={(e) => setTriggerText(e.target.value)}
                  placeholder={t.triggerText}
                />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.itemCount}</Text>
                <Text code>{itemCount}</Text>
              </Space>
              <Slider min={1} max={12} value={itemCount} onChange={setItemCount} />

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.minWidth}</Text>
                <Text code>{minWidth}px</Text>
              </Space>
              <Slider min={80} max={500} value={minWidth} onChange={setMinWidth} />

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.gap}</Text>
                <Text code>{gap}px</Text>
              </Space>
              <Slider min={0} max={48} value={gap} onChange={setGap} />

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.paddingX}</Text>
                <Text code>{paddingX}px</Text>
              </Space>
              <Slider min={0} max={48} value={paddingX} onChange={setPaddingX} />

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.paddingY}</Text>
                <Text code>{paddingY}px</Text>
              </Space>
              <Slider min={0} max={48} value={paddingY} onChange={setPaddingY} />

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.itemPaddingX}</Text>
                <Text code>{itemPaddingX}px</Text>
              </Space>
              <Slider min={0} max={48} value={itemPaddingX} onChange={setItemPaddingX} />

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.itemPaddingY}</Text>
                <Text code>{itemPaddingY}px</Text>
              </Space>
              <Slider min={0} max={32} value={itemPaddingY} onChange={setItemPaddingY} />

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.borderRadius}</Text>
                <Text code>{borderRadius}px</Text>
              </Space>
              <Slider min={0} max={40} value={borderRadius} onChange={setBorderRadius} />

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.itemRadius}</Text>
                <Text code>{itemRadius}px</Text>
              </Space>
              <Slider min={0} max={40} value={itemRadius} onChange={setItemRadius} />

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.fontSize}</Text>
                <Text code>{fontSize}px</Text>
              </Space>
              <Slider min={10} max={32} value={fontSize} onChange={setFontSize} />

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.transitionDuration}</Text>
                <Text code>{transitionDuration}ms</Text>
              </Space>
              <Slider min={0} max={1000} value={transitionDuration} onChange={setTransitionDuration} />

              <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>{t.hasArrow}</Text>
                <Switch size="small" checked={hasArrow} onChange={setHasArrow} />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>{t.hasDivider}</Text>
                <Switch size="small" checked={hasDivider} onChange={setHasDivider} />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>{t.background}</Text>
                <ColorPicker value={background} onChange={setBackground} showText />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>{t.textColor}</Text>
                <ColorPicker value={textColor} onChange={setTextColor} showText />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>{t.hoverBackground}</Text>
                <ColorPicker value={hoverBackground} onChange={setHoverBackground} showText />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>{t.hoverTextColor}</Text>
                <ColorPicker value={hoverTextColor} onChange={setHoverTextColor} showText />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>{t.triggerBackground}</Text>
                <ColorPicker value={triggerBackground} onChange={setTriggerBackground} showText />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>{t.triggerTextColor}</Text>
                <ColorPicker value={triggerTextColor} onChange={setTriggerTextColor} showText />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>{t.triggerBorderColor}</Text>
                <ColorPicker value={triggerBorderColor} onChange={setTriggerBorderColor} showText />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.triggerBorderWidth}</Text>
                <Text code>{triggerBorderWidth}px</Text>
              </Space>
              <Slider min={0} max={8} value={triggerBorderWidth} onChange={setTriggerBorderWidth} />

              <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>{t.borderColor}</Text>
                <ColorPicker value={borderColor} onChange={setBorderColor} showText />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.borderWidth}</Text>
                <Text code>{borderWidth}px</Text>
              </Space>
              <Slider min={0} max={8} value={borderWidth} onChange={setBorderWidth} />

              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.shadow}</Text>
                <Input
                  value={shadow}
                  onChange={(e) => setShadow(e.target.value)}
                  placeholder="0 4px 12px rgba(0,0,0,0.15)"
                />
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
                padding: 60,
                background: '#fafafa',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 280,
              }}
            >
              <style>{cssOutput}</style>
              <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
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
            label: `${t.sourceCol} — buildDropdownMenuCss / buildDropdownMenuHtml`,
            children: (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Paragraph type="secondary">{t.sourceBody}</Paragraph>
                <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 320 }}>
                  <code>{buildDropdownMenuCss.toString()}</code>
                </pre>
              </Space>
            ),
          },
        ]}
      />
    </Space>
  )
}
