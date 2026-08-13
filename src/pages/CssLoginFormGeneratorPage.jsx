import React, { useMemo, useState } from 'react'
import {
  Typography, Card, Space, Slider, Segmented, Alert, Button, Collapse,
  message, ColorPicker, Row, Col, Input, Tabs, Switch,
} from 'antd'
import { BgColorsOutlined, CopyOutlined, PlayCircleOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  buildLoginFormCss,
  buildLoginFormHtml,
  buildLoginFormFullDemo,
  PRESETS,
  DEFAULTS,
} from '../utils/cssLoginFormGenerator'

const { Title, Paragraph, Text } = Typography
const { useMessage } = message

const PRESET_ORDER = ['default', 'minimal', 'dark', 'outline', 'soft']

const VARIANT_OPTIONS = [
  { label: 'Card', value: 'card' },
  { label: 'Split', value: 'split' },
  { label: 'Centered', value: 'centered' },
  { label: 'Minimal', value: 'minimal' },
]

const translations = {
  pt: {
    heading: 'Gerador de CSS Login Form',
    intro: (
      <>
        Crie formulários de login e autenticação usando só CSS. Escolha entre
        variações de card, split, centralizado ou minimal; ajuste cores, dimensões,
        tipografia, ícones e estados de erro/sucesso. Gera CSS pronto para copiar e
        HTML semântico de exemplo.
      </>
    ),
    tipTitle: 'Como funciona',
    tipBody: (
      <>
        O formulário usa markup semântico com <Text code>{'<label>'}</Text>,{' '}
        <Text code>{'<input>'}</Text> e <Text code>{'<button type="submit">'}</Text>.
        Os estados de foco usam <Text code>:focus</Text> e{' '}
        <Text code>box-shadow</Text>; o estado de erro é demonstrado com uma classe
        utilitária como <Text code>.login-form__group--error</Text>.
      </>
    ),
    settings: 'Configurações',
    output: 'Saída gerada',
    presets: 'Presets',
    variant: 'Variação de layout',
    maxWidth: 'Largura máxima',
    padding: 'Padding interno',
    gap: 'Espaçamento entre campos',
    borderRadius: 'Arredondamento',
    borderWidth: 'Espessura da borda',
    fontSize: 'Tamanho da fonte',
    titleSize: 'Tamanho do título',
    title: 'Título',
    subtitle: 'Subtítulo',
    submitText: 'Texto do botão',
    rememberText: 'Texto do checkbox',
    forgotText: 'Texto do link de recuperação',
    signupText: 'Texto do rodapé',
    emailPlaceholder: 'Placeholder do email',
    passwordPlaceholder: 'Placeholder da senha',
    showRemember: 'Mostrar "lembrar-me"',
    showForgot: 'Mostrar "esqueci a senha"',
    showSignup: 'Mostrar link de cadastro',
    showIcons: 'Mostrar ícones nos inputs',
    showErrorState: 'Demonstrar estado de erro',
    showSuccessState: 'Demonstrar estado de sucesso',
    bgColor: 'Fundo do card',
    textColor: 'Cor do texto',
    borderColor: 'Cor da borda',
    inputBg: 'Fundo do input',
    inputBorderColor: 'Borda do input',
    inputFocusColor: 'Cor de foco',
    primaryColor: 'Cor primária',
    primaryTextColor: 'Cor do texto no botão',
    linkColor: 'Cor dos links',
    errorColor: 'Cor de erro',
    successColor: 'Cor de sucesso',
    className: 'Nome da classe CSS',
    preview: 'Pré-visualização',
    previewHint: 'O formulário abaixo usa exatamente o CSS e o HTML gerados.',
    replayAnimation: 'Atualizar preview',
    outputCss: 'CSS gerado',
    outputHtml: 'HTML de exemplo',
    outputFull: 'Bloco completo',
    copy: 'Copiar',
    copied: 'Copiado!',
    copyError: 'Não foi possível copiar',
    sourceCol: 'Código-fonte',
    sourceBody:
      'O núcleo vive em src/utils/cssLoginFormGenerator.js. buildLoginFormCss monta as regras conforme a variação escolhida; buildLoginFormHtml gera o markup semântico com ícones SVG inline.',
  },
  en: {
    heading: 'CSS Login Form Generator',
    intro: (
      <>
        Build login and authentication forms using only CSS. Choose between card,
        split, centered or minimal variations; customize colors, dimensions,
        typography, icons and error/success states. Generates copy-ready CSS and
        semantic example HTML.
      </>
    ),
    tipTitle: 'How it works',
    tipBody: (
      <>
        The form uses semantic markup with <Text code>{'<label>'}</Text>,{' '}
        <Text code>{'<input>'}</Text> and <Text code>{'<button type="submit">'}</Text>.
        Focus states use <Text code>:focus</Text> and <Text code>box-shadow</Text>; the
        error state is shown with a utility class like{' '}
        <Text code>.login-form__group--error</Text>.
      </>
    ),
    settings: 'Settings',
    output: 'Generated output',
    presets: 'Presets',
    variant: 'Layout variation',
    maxWidth: 'Max width',
    padding: 'Inner padding',
    gap: 'Field spacing',
    borderRadius: 'Border radius',
    borderWidth: 'Border width',
    fontSize: 'Font size',
    titleSize: 'Title size',
    title: 'Title',
    subtitle: 'Subtitle',
    submitText: 'Button text',
    rememberText: 'Checkbox text',
    forgotText: 'Recovery link text',
    signupText: 'Footer text',
    emailPlaceholder: 'Email placeholder',
    passwordPlaceholder: 'Password placeholder',
    showRemember: 'Show "remember me"',
    showForgot: 'Show "forgot password"',
    showSignup: 'Show signup link',
    showIcons: 'Show input icons',
    showErrorState: 'Demonstrate error state',
    showSuccessState: 'Demonstrate success state',
    bgColor: 'Card background',
    textColor: 'Text color',
    borderColor: 'Border color',
    inputBg: 'Input background',
    inputBorderColor: 'Input border',
    inputFocusColor: 'Focus color',
    primaryColor: 'Primary color',
    primaryTextColor: 'Button text color',
    linkColor: 'Link color',
    errorColor: 'Error color',
    successColor: 'Success color',
    className: 'CSS class name',
    preview: 'Preview',
    previewHint: 'The form below uses the exact generated CSS and HTML.',
    replayAnimation: 'Refresh preview',
    outputCss: 'Generated CSS',
    outputHtml: 'Example HTML',
    outputFull: 'Full block',
    copy: 'Copy',
    copied: 'Copied!',
    copyError: 'Could not copy',
    sourceCol: 'Source code',
    sourceBody:
      'The core lives in src/utils/cssLoginFormGenerator.js. buildLoginFormCss builds the rules based on the chosen variation; buildLoginFormHtml generates semantic markup with inline SVG icons.',
  },
}

export default function CssLoginFormGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [messageApi, messageContextHolder] = useMessage()

  const [variant, setVariant] = useState(DEFAULTS.variant)
  const [maxWidth, setMaxWidth] = useState(DEFAULTS.maxWidth)
  const [padding, setPadding] = useState(DEFAULTS.padding)
  const [gap, setGap] = useState(DEFAULTS.gap)
  const [borderRadius, setBorderRadius] = useState(DEFAULTS.borderRadius)
  const [borderWidth, setBorderWidth] = useState(DEFAULTS.borderWidth)
  const [fontSize, setFontSize] = useState(DEFAULTS.fontSize)
  const [titleSize, setTitleSize] = useState(DEFAULTS.titleSize)
  const [title, setTitle] = useState(DEFAULTS.title)
  const [subtitle, setSubtitle] = useState(DEFAULTS.subtitle)
  const [submitText, setSubmitText] = useState(DEFAULTS.submitText)
  const [rememberText, setRememberText] = useState(DEFAULTS.rememberText)
  const [forgotText, setForgotText] = useState(DEFAULTS.forgotText)
  const [signupText, setSignupText] = useState(DEFAULTS.signupText)
  const [emailPlaceholder, setEmailPlaceholder] = useState(DEFAULTS.emailPlaceholder)
  const [passwordPlaceholder, setPasswordPlaceholder] = useState(DEFAULTS.passwordPlaceholder)
  const [showRemember, setShowRemember] = useState(DEFAULTS.showRemember)
  const [showForgot, setShowForgot] = useState(DEFAULTS.showForgot)
  const [showSignup, setShowSignup] = useState(DEFAULTS.showSignup)
  const [showIcons, setShowIcons] = useState(DEFAULTS.showIcons)
  const [showErrorState, setShowErrorState] = useState(DEFAULTS.showErrorState)
  const [showSuccessState, setShowSuccessState] = useState(DEFAULTS.showSuccessState)
  const [bgColor, setBgColor] = useState(DEFAULTS.bgColor)
  const [textColor, setTextColor] = useState(DEFAULTS.textColor)
  const [borderColor, setBorderColor] = useState(DEFAULTS.borderColor)
  const [inputBg, setInputBg] = useState(DEFAULTS.inputBg)
  const [inputBorderColor, setInputBorderColor] = useState(DEFAULTS.inputBorderColor)
  const [inputFocusColor, setInputFocusColor] = useState(DEFAULTS.inputFocusColor)
  const [primaryColor, setPrimaryColor] = useState(DEFAULTS.primaryColor)
  const [primaryTextColor, setPrimaryTextColor] = useState(DEFAULTS.primaryTextColor)
  const [linkColor, setLinkColor] = useState(DEFAULTS.linkColor)
  const [errorColor, setErrorColor] = useState(DEFAULTS.errorColor)
  const [successColor, setSuccessColor] = useState(DEFAULTS.successColor)
  const [className, setClassName] = useState(DEFAULTS.className)
  const [previewKey, setPreviewKey] = useState(0)

  const applyPreset = (key) => {
    const p = PRESETS[key]
    if (!p) return
    setVariant(p.variant)
    setMaxWidth(p.maxWidth)
    setPadding(p.padding)
    setGap(p.gap)
    setBorderRadius(p.borderRadius)
    setBorderWidth(p.borderWidth)
    setFontSize(p.fontSize)
    setTitleSize(p.titleSize)
    setTitle(p.title)
    setSubtitle(p.subtitle)
    setSubmitText(p.submitText)
    setRememberText(p.rememberText)
    setForgotText(p.forgotText)
    setSignupText(p.signupText)
    setEmailPlaceholder(p.emailPlaceholder)
    setPasswordPlaceholder(p.passwordPlaceholder)
    setShowRemember(p.showRemember)
    setShowForgot(p.showForgot)
    setShowSignup(p.showSignup)
    setShowIcons(p.showIcons)
    setShowErrorState(p.showErrorState)
    setShowSuccessState(p.showSuccessState)
    setBgColor(p.bgColor)
    setTextColor(p.textColor)
    setBorderColor(p.borderColor)
    setInputBg(p.inputBg)
    setInputBorderColor(p.inputBorderColor)
    setInputFocusColor(p.inputFocusColor)
    setPrimaryColor(p.primaryColor)
    setPrimaryTextColor(p.primaryTextColor)
    setLinkColor(p.linkColor)
    setErrorColor(p.errorColor)
    setSuccessColor(p.successColor)
    setClassName(p.className)
    setPreviewKey((k) => k + 1)
  }

  const settings = useMemo(
    () => ({
      variant,
      maxWidth,
      padding,
      gap,
      borderRadius,
      borderWidth,
      fontSize,
      titleSize,
      title,
      subtitle,
      submitText,
      rememberText,
      forgotText,
      signupText,
      emailPlaceholder,
      passwordPlaceholder,
      showRemember,
      showForgot,
      showSignup,
      showIcons,
      showErrorState,
      showSuccessState,
      bgColor,
      textColor,
      borderColor,
      inputBg,
      inputBorderColor,
      inputFocusColor,
      primaryColor,
      primaryTextColor,
      linkColor,
      errorColor,
      successColor,
      className,
    }),
    [
      variant,
      maxWidth,
      padding,
      gap,
      borderRadius,
      borderWidth,
      fontSize,
      titleSize,
      title,
      subtitle,
      submitText,
      rememberText,
      forgotText,
      signupText,
      emailPlaceholder,
      passwordPlaceholder,
      showRemember,
      showForgot,
      showSignup,
      showIcons,
      showErrorState,
      showSuccessState,
      bgColor,
      textColor,
      borderColor,
      inputBg,
      inputBorderColor,
      inputFocusColor,
      primaryColor,
      primaryTextColor,
      linkColor,
      errorColor,
      successColor,
      className,
    ]
  )

  const cssOutput = useMemo(() => buildLoginFormCss(settings), [settings])
  const htmlOutput = useMemo(() => buildLoginFormHtml(settings), [settings])
  const fullOutput = useMemo(() => buildLoginFormFullDemo(settings), [settings])

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

              <Space direction="vertical" size={4} style={{ width: '100%', marginTop: 8 }}>
                <Text>{t.variant}</Text>
                <Segmented
                  style={{ width: '100%' }}
                  block
                  value={variant}
                  onChange={setVariant}
                  options={VARIANT_OPTIONS}
                />
              </Space>

              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.title}</Text>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              </Space>

              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.subtitle}</Text>
                <Input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.maxWidth}</Text>
                <Text code>{maxWidth}px</Text>
              </Space>
              <Slider min={280} max={800} value={maxWidth} onChange={setMaxWidth} />

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.padding}</Text>
                <Text code>{padding}px</Text>
              </Space>
              <Slider min={0} max={80} value={padding} onChange={setPadding} />

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.gap}</Text>
                <Text code>{gap}px</Text>
              </Space>
              <Slider min={8} max={64} value={gap} onChange={setGap} />

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.borderRadius}</Text>
                <Text code>{borderRadius}px</Text>
              </Space>
              <Slider min={0} max={64} value={borderRadius} onChange={setBorderRadius} />

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.borderWidth}</Text>
                <Text code>{borderWidth}px</Text>
              </Space>
              <Slider min={0} max={8} value={borderWidth} onChange={setBorderWidth} />

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.fontSize}</Text>
                <Text code>{fontSize}px</Text>
              </Space>
              <Slider min={12} max={32} value={fontSize} onChange={setFontSize} />

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.titleSize}</Text>
                <Text code>{titleSize}px</Text>
              </Space>
              <Slider min={16} max={64} value={titleSize} onChange={setTitleSize} />

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.showRemember}</Text>
                <Switch checked={showRemember} onChange={setShowRemember} />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.showForgot}</Text>
                <Switch checked={showForgot} onChange={setShowForgot} />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.showSignup}</Text>
                <Switch checked={showSignup} onChange={setShowSignup} />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.showIcons}</Text>
                <Switch checked={showIcons} onChange={setShowIcons} />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.showErrorState}</Text>
                <Switch checked={showErrorState} onChange={setShowErrorState} />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.showSuccessState}</Text>
                <Switch checked={showSuccessState} onChange={setShowSuccessState} />
              </Space>

              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.bgColor}</Text>
                <ColorPicker value={bgColor} onChange={(c) => setBgColor(c.toHexString())} showText />
              </Space>

              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.textColor}</Text>
                <ColorPicker value={textColor} onChange={(c) => setTextColor(c.toHexString())} showText />
              </Space>

              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.borderColor}</Text>
                <ColorPicker value={borderColor} onChange={(c) => setBorderColor(c.toHexString())} showText />
              </Space>

              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.inputBg}</Text>
                <ColorPicker value={inputBg} onChange={(c) => setInputBg(c.toHexString())} showText />
              </Space>

              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.inputBorderColor}</Text>
                <ColorPicker value={inputBorderColor} onChange={(c) => setInputBorderColor(c.toHexString())} showText />
              </Space>

              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.inputFocusColor}</Text>
                <ColorPicker value={inputFocusColor} onChange={(c) => setInputFocusColor(c.toHexString())} showText />
              </Space>

              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.primaryColor}</Text>
                <ColorPicker value={primaryColor} onChange={(c) => setPrimaryColor(c.toHexString())} showText />
              </Space>

              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.primaryTextColor}</Text>
                <ColorPicker value={primaryTextColor} onChange={(c) => setPrimaryTextColor(c.toHexString())} showText />
              </Space>

              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.linkColor}</Text>
                <ColorPicker value={linkColor} onChange={(c) => setLinkColor(c.toHexString())} showText />
              </Space>

              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.errorColor}</Text>
                <ColorPicker value={errorColor} onChange={(c) => setErrorColor(c.toHexString())} showText />
              </Space>

              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.successColor}</Text>
                <ColorPicker value={successColor} onChange={(c) => setSuccessColor(c.toHexString())} showText />
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
                minHeight: 320,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
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
            label: `${t.sourceCol} — buildLoginFormCss / buildLoginFormHtml`,
            children: (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Paragraph type="secondary">{t.sourceBody}</Paragraph>
                <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 320 }}>
                  <code>{buildLoginFormCss.toString()}</code>
                </pre>
              </Space>
            ),
          },
        ]}
      />
    </Space>
  )
}
