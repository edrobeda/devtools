import React, { useMemo, useState } from 'react'
import {
  Typography, Card, Space, Slider, Segmented, Alert, Button, Collapse,
  message, ColorPicker, Row, Col, Input, InputNumber, Switch, Tabs,
} from 'antd'
import { BgColorsOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  buildCardCss,
  buildCardHtml,
  buildCardFullDemo,
  PRESETS,
  DEFAULTS,
} from '../utils/cssCardGenerator'

const { Title, Paragraph, Text } = Typography
const { useMessage } = message

const VARIANT_OPTIONS = {
  pt: [
    { label: 'Elevado', value: 'raised' },
    { label: 'Plano', value: 'flat' },
    { label: 'Contorno', value: 'outlined' },
    { label: 'Suave', value: 'soft' },
    { label: 'Escuro', value: 'dark' },
  ],
  en: [
    { label: 'Raised', value: 'raised' },
    { label: 'Flat', value: 'flat' },
    { label: 'Outlined', value: 'outlined' },
    { label: 'Soft', value: 'soft' },
    { label: 'Dark', value: 'dark' },
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

const translations = {
  pt: {
    title: 'Gerador de Card CSS',
    intro: (
      <>
        Crie cards customizados usando só CSS: escolha a variação visual
        (elevado, plano, contorno, suave ou escuro), ajuste dimensões, cores,
        sombra, bordas, alinhamento e efeito de hover; o preview usa o CSS
        exato que será copiado, então você vê o resultado final em tempo real.
      </>
    ),
    tipTitle: 'Como funciona (e as pegadinhas)',
    tipBody: (
      <>
        O card usa a tag semântica <Text code>{'<article>'}</Text> com
        classes BEM: <Text code>{'.card__media'}</Text>,{' '}
        <Text code>{'.card__header'}</Text>, <Text code>{'.card__body'}</Text> e{' '}
        <Text code>{'.card__footer'}</Text>. Variáveis CSS no <Text code>:root</Text>{' '}
        do card facilitam trocar cores sem reescrever regras. Cuidado com o{' '}
        <Text code>overflow: hidden</Text> — ele arredonda a imagem interna, mas
        esconde qualquer conteúdo que extrapole os limites.
      </>
    ),
    settings: 'Configurações',
    variant: 'Variação',
    width: 'Largura máxima (px)',
    padding: 'Padding interno (px)',
    borderRadius: 'Border radius (px)',
    bgColor: 'Cor de fundo',
    textColor: 'Cor do texto',
    borderColor: 'Cor da borda',
    borderWidth: 'Espessura da borda (px)',
    shadow: 'Box-shadow',
    hover: 'Hover',
    hoverLift: 'Levantar no hover',
    hoverShadow: 'Sombra no hover',
    hoverTranslateY: 'Deslocamento Y no hover (px)',
    transitionDuration: 'Duração da transição (ms)',
    headerDivider: 'Divisor abaixo do header',
    footerDivider: 'Divisor acima do footer',
    dividerColor: 'Cor do divisor',
    dividerWidth: 'Espessura do divisor (px)',
    media: 'Imagem de capa',
    showMedia: 'Mostrar imagem',
    mediaHeight: 'Altura da imagem (px)',
    mediaRadius: 'Arredondar topo da imagem',
    structure: 'Estrutura',
    showHeader: 'Mostrar header',
    showFooter: 'Mostrar footer',
    showButton: 'Mostrar botão',
    buttonBg: 'Fundo do botão',
    buttonColor: 'Cor do texto do botão',
    buttonRadius: 'Border radius do botão (px)',
    align: 'Alinhamento do texto',
    content: 'Conteúdo de exemplo',
    cardTitle: 'Título',
    cardSubtitle: 'Subtítulo',
    cardBody: 'Texto do corpo',
    cardButtonText: 'Texto do botão',
    preview: 'Pré-visualização',
    previewHint: 'O card abaixo usa exatamente o CSS gerado — passe o mouse para testar o hover.',
    outputCss: 'CSS gerado',
    outputHtml: 'HTML de exemplo',
    outputFull: 'Bloco completo',
    copy: 'Copiar',
    copied: 'Copiado!',
    copyError: 'Não foi possível copiar',
    presets: 'Presets',
    sourceCol: 'Código-fonte',
    sourceBody:
      'O núcleo vive em src/utils/cssCardGenerator.js. buildCardCss monta as regras do container, media, header, body, footer e botão, além do estado :hover quando habilitado. buildCardHtml gera o markup semântico com <article>, <header>, <div class="card__body"> e <footer>.',
  },
  en: {
    title: 'CSS Card Generator',
    intro: (
      <>
        Build customized cards using only CSS: pick a visual variant (raised,
        flat, outlined, soft or dark), tweak dimensions, colors, shadow,
        borders, alignment and hover effect; the preview uses the exact CSS that
        will be copied, so you see the final result in real time.
      </>
    ),
    tipTitle: 'How it works (and the gotchas)',
    tipBody: (
      <>
        The card uses the semantic <Text code>{'<article>'}</Text> tag with BEM
        classes: <Text code>{'.card__media'}</Text>,{' '}
        <Text code>{'.card__header'}</Text>, <Text code>{'.card__body'}</Text> and{' '}
        <Text code>{'.card__footer'}</Text>. CSS custom properties inside the{' '}
        <Text code>.card</Text> scope make it easy to change colors without
        rewriting rules. Watch out for <Text code>overflow: hidden</Text> — it
        rounds the inner image but clips anything that overflows the card.
      </>
    ),
    settings: 'Settings',
    variant: 'Variant',
    width: 'Max width (px)',
    padding: 'Inner padding (px)',
    borderRadius: 'Border radius (px)',
    bgColor: 'Background color',
    textColor: 'Text color',
    borderColor: 'Border color',
    borderWidth: 'Border width (px)',
    shadow: 'Box-shadow',
    hover: 'Hover',
    hoverLift: 'Lift on hover',
    hoverShadow: 'Hover shadow',
    hoverTranslateY: 'Hover translate Y (px)',
    transitionDuration: 'Transition duration (ms)',
    headerDivider: 'Divider below header',
    footerDivider: 'Divider above footer',
    dividerColor: 'Divider color',
    dividerWidth: 'Divider width (px)',
    media: 'Cover image',
    showMedia: 'Show image',
    mediaHeight: 'Image height (px)',
    mediaRadius: 'Round image top',
    structure: 'Structure',
    showHeader: 'Show header',
    showFooter: 'Show footer',
    showButton: 'Show button',
    buttonBg: 'Button background',
    buttonColor: 'Button text color',
    buttonRadius: 'Button border radius (px)',
    align: 'Text alignment',
    content: 'Sample content',
    cardTitle: 'Title',
    cardSubtitle: 'Subtitle',
    cardBody: 'Body text',
    cardButtonText: 'Button text',
    preview: 'Preview',
    previewHint: 'The card below uses exactly the generated CSS — hover over it to test the hover effect.',
    outputCss: 'Generated CSS',
    outputHtml: 'Example HTML',
    outputFull: 'Full block',
    copy: 'Copy',
    copied: 'Copied!',
    copyError: 'Could not copy',
    presets: 'Presets',
    sourceCol: 'Source code',
    sourceBody:
      'The core lives in src/utils/cssCardGenerator.js. buildCardCss builds the rules for the container, media, header, body, footer and button, plus the :hover state when enabled. buildCardHtml generates semantic markup with <article>, <header>, <div class="card__body"> and <footer>.',
  },
}

const PRESET_ORDER = ['raised', 'flat', 'outlined', 'soft', 'dark']

export default function CssCardGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [messageApi, messageContextHolder] = useMessage()

  const [variant, setVariant] = useState(DEFAULTS.variant)
  const [width, setWidth] = useState(DEFAULTS.width)
  const [padding, setPadding] = useState(DEFAULTS.padding)
  const [borderRadius, setBorderRadius] = useState(DEFAULTS.borderRadius)
  const [bgColor, setBgColor] = useState(DEFAULTS.bgColor)
  const [textColor, setTextColor] = useState(DEFAULTS.textColor)
  const [borderColor, setBorderColor] = useState(DEFAULTS.borderColor)
  const [borderWidth, setBorderWidth] = useState(DEFAULTS.borderWidth)
  const [shadow, setShadow] = useState(DEFAULTS.shadow)
  const [hoverLift, setHoverLift] = useState(DEFAULTS.hoverLift)
  const [hoverShadow, setHoverShadow] = useState(DEFAULTS.hoverShadow)
  const [hoverTranslateY, setHoverTranslateY] = useState(DEFAULTS.hoverTranslateY)
  const [transitionDuration, setTransitionDuration] = useState(DEFAULTS.transitionDuration)
  const [headerDivider, setHeaderDivider] = useState(DEFAULTS.headerDivider)
  const [footerDivider, setFooterDivider] = useState(DEFAULTS.footerDivider)
  const [dividerColor, setDividerColor] = useState(DEFAULTS.dividerColor)
  const [dividerWidth, setDividerWidth] = useState(DEFAULTS.dividerWidth)
  const [mediaHeight, setMediaHeight] = useState(DEFAULTS.mediaHeight)
  const [mediaRadius, setMediaRadius] = useState(DEFAULTS.mediaRadius)
  const [showMedia, setShowMedia] = useState(DEFAULTS.showMedia)
  const [showHeader, setShowHeader] = useState(DEFAULTS.showHeader)
  const [showFooter, setShowFooter] = useState(DEFAULTS.showFooter)
  const [showButton, setShowButton] = useState(DEFAULTS.showButton)
  const [buttonBg, setButtonBg] = useState(DEFAULTS.buttonBg)
  const [buttonColor, setButtonColor] = useState(DEFAULTS.buttonColor)
  const [buttonRadius, setButtonRadius] = useState(DEFAULTS.buttonRadius)
  const [align, setAlign] = useState(DEFAULTS.align)

  const [titleText, setTitleText] = useState('Título do card')
  const [subtitleText, setSubtitleText] = useState('Subtítulo descritivo')
  const [bodyText, setBodyText] = useState(
    'Este é um exemplo de corpo de card. Você pode substituir este texto por qualquer conteúdo: descrições, listas, formulários, etc.'
  )
  const [buttonText, setButtonText] = useState('Saiba mais')

  const settings = useMemo(
    () => ({
      variant,
      width,
      padding,
      borderRadius,
      bgColor,
      textColor,
      borderColor,
      borderWidth,
      shadow,
      hoverLift,
      hoverShadow,
      hoverTranslateY,
      transitionDuration,
      headerDivider,
      footerDivider,
      dividerColor,
      dividerWidth,
      mediaHeight,
      mediaRadius,
      showMedia,
      showHeader,
      showFooter,
      showButton,
      buttonBg,
      buttonColor,
      buttonRadius,
      align,
      title: titleText,
      subtitle: subtitleText,
      body: bodyText,
      buttonText,
    }),
    [
      variant,
      width,
      padding,
      borderRadius,
      bgColor,
      textColor,
      borderColor,
      borderWidth,
      shadow,
      hoverLift,
      hoverShadow,
      hoverTranslateY,
      transitionDuration,
      headerDivider,
      footerDivider,
      dividerColor,
      dividerWidth,
      mediaHeight,
      mediaRadius,
      showMedia,
      showHeader,
      showFooter,
      showButton,
      buttonBg,
      buttonColor,
      buttonRadius,
      align,
      titleText,
      subtitleText,
      bodyText,
      buttonText,
    ]
  )

  const cssOutput = useMemo(() => buildCardCss(settings), [settings])
  const htmlOutput = useMemo(() => buildCardHtml(settings), [settings])
  const fullOutput = useMemo(() => buildCardFullDemo(settings), [settings])

  const applyPreset = (key) => {
    const p = PRESETS[key]
    if (!p) return
    setVariant(key)
    setBorderWidth(p.borderWidth)
    setBgColor(p.bgColor)
    setTextColor(p.textColor)
    setBorderColor(p.borderColor)
    setShadow(p.shadow)
    setHoverLift(p.hoverLift)
    setHoverShadow(p.hoverShadow)
    setHoverTranslateY(p.hoverTranslateY)
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

  const previewTitle = lang === 'pt' ? titleText : titleText
  const previewSubtitle = lang === 'pt' ? subtitleText : subtitleText
  const previewBody = lang === 'pt' ? bodyText : bodyText
  const previewButton = lang === 'pt' ? buttonText : buttonText

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
                  label: VARIANT_OPTIONS[lang].find((s) => s.value === key)?.label || key,
                }))}
              />

              <Space direction="vertical" size={4} style={{ width: '100%', marginTop: 8 }}>
                <Text>{t.variant}</Text>
                <Segmented
                  style={{ width: '100%' }}
                  block
                  value={variant}
                  onChange={setVariant}
                  options={VARIANT_OPTIONS[lang]}
                />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.width}</Text>
                <Text code>{width}px</Text>
              </Space>
              <Slider min={160} max={600} value={width} onChange={setWidth} />

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.padding}</Text>
                <Text code>{padding}px</Text>
              </Space>
              <Slider min={0} max={64} value={padding} onChange={setPadding} />

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.borderRadius}</Text>
                <Text code>{borderRadius}px</Text>
              </Space>
              <Slider min={0} max={48} value={borderRadius} onChange={setBorderRadius} />

              <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>{t.bgColor}</Text>
                <ColorPicker value={bgColor} onChange={setBgColor} showText />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>{t.textColor}</Text>
                <ColorPicker value={textColor} onChange={setTextColor} showText />
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
                  placeholder="0 4px 20px rgba(0,0,0,0.08)"
                />
              </Space>

              <Space direction="vertical" size={4} style={{ width: '100%', marginTop: 8 }}>
                <Text strong>{t.hover}</Text>
                <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text>{t.hoverLift}</Text>
                  <Switch size="small" checked={hoverLift} onChange={setHoverLift} />
                </Space>
              </Space>

              {hoverLift && (
                <>
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Text>{t.hoverShadow}</Text>
                    <Input
                      value={hoverShadow}
                      onChange={(e) => setHoverShadow(e.target.value)}
                      placeholder="0 12px 32px rgba(0,0,0,0.12)"
                    />
                  </Space>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text>{t.hoverTranslateY}</Text>
                    <Text code>{hoverTranslateY}px</Text>
                  </Space>
                  <Slider min={-32} max={32} value={hoverTranslateY} onChange={setHoverTranslateY} />
                </>
              )}

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.transitionDuration}</Text>
                <Text code>{transitionDuration}ms</Text>
              </Space>
              <Slider min={0} max={1000} value={transitionDuration} onChange={setTransitionDuration} />

              <Space direction="vertical" size={4} style={{ width: '100%', marginTop: 8 }}>
                <Text strong>{t.structure}</Text>
                <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text>{t.showHeader}</Text>
                  <Switch size="small" checked={showHeader} onChange={setShowHeader} />
                </Space>
                <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text>{t.showFooter}</Text>
                  <Switch size="small" checked={showFooter} onChange={setShowFooter} />
                </Space>
                <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text>{t.showButton}</Text>
                  <Switch size="small" checked={showButton} onChange={setShowButton} disabled={!showFooter} />
                </Space>
              </Space>

              {showHeader && (
                <>
                  <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text>{t.headerDivider}</Text>
                    <Switch size="small" checked={headerDivider} onChange={setHeaderDivider} />
                  </Space>
                </>
              )}

              {showFooter && (
                <>
                  <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text>{t.footerDivider}</Text>
                    <Switch size="small" checked={footerDivider} onChange={setFooterDivider} />
                  </Space>
                </>
              )}

              {(headerDivider || footerDivider) && (
                <>
                  <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text>{t.dividerColor}</Text>
                    <ColorPicker value={dividerColor} onChange={setDividerColor} showText />
                  </Space>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text>{t.dividerWidth}</Text>
                    <Text code>{dividerWidth}px</Text>
                  </Space>
                  <Slider min={0} max={8} value={dividerWidth} onChange={setDividerWidth} />
                </>
              )}

              <Space direction="vertical" size={4} style={{ width: '100%', marginTop: 8 }}>
                <Text strong>{t.media}</Text>
                <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text>{t.showMedia}</Text>
                  <Switch size="small" checked={showMedia} onChange={setShowMedia} />
                </Space>
              </Space>

              {showMedia && (
                <>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text>{t.mediaHeight}</Text>
                    <Text code>{mediaHeight}px</Text>
                  </Space>
                  <Slider min={0} max={400} value={mediaHeight} onChange={setMediaHeight} />
                  <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text>{t.mediaRadius}</Text>
                    <Switch size="small" checked={mediaRadius} onChange={setMediaRadius} />
                  </Space>
                </>
              )}

              <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>{t.buttonBg}</Text>
                <ColorPicker value={buttonBg} onChange={setButtonBg} showText />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>{t.buttonColor}</Text>
                <ColorPicker value={buttonColor} onChange={setButtonColor} showText />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.buttonRadius}</Text>
                <Text code>{buttonRadius}px</Text>
              </Space>
              <Slider min={0} max={32} value={buttonRadius} onChange={setButtonRadius} />

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

              <Space direction="vertical" size={4} style={{ width: '100%', marginTop: 8 }}>
                <Text strong>{t.content}</Text>
                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                  <Text>{t.cardTitle}</Text>
                  <Input value={titleText} onChange={(e) => setTitleText(e.target.value)} />
                </Space>
                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                  <Text>{t.cardSubtitle}</Text>
                  <Input value={subtitleText} onChange={(e) => setSubtitleText(e.target.value)} />
                </Space>
                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                  <Text>{t.cardBody}</Text>
                  <Input.TextArea
                    rows={3}
                    value={bodyText}
                    onChange={(e) => setBodyText(e.target.value)}
                  />
                </Space>
                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                  <Text>{t.cardButtonText}</Text>
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
                alignItems: 'flex-start',
                justifyContent: 'center',
                minHeight: 320,
              }}
            >
              <style>{cssOutput}</style>
              <article className="card">
                {showMedia && (
                  <img
                    className="card__media"
                    src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='640' height='360'%3E%3Crect width='640' height='360' fill='%231677ff'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23ffffff' font-family='sans-serif' font-size='32'%3ECard Preview%3C/text%3E%3C/svg%3E"
                    alt="Card preview"
                  />
                )}
                {showHeader && (
                  <header className="card__header">
                    <h3 className="card__title">{previewTitle}</h3>
                    <p className="card__subtitle">{previewSubtitle}</p>
                  </header>
                )}
                <div className="card__body">
                  <p>{previewBody}</p>
                </div>
                {showFooter && (
                  <footer className="card__footer">
                    {showButton && <button className="card__button">{previewButton}</button>}
                  </footer>
                )}
              </article>
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
            label: `${t.sourceCol} — buildCardCss / buildCardHtml`,
            children: (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Paragraph type="secondary">{t.sourceBody}</Paragraph>
                <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 320 }}>
                  <code>{buildCardCss.toString()}</code>
                </pre>
              </Space>
            ),
          },
        ]}
      />
    </Space>
  )
}
