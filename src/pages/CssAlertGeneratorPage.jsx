import React, { useMemo, useState } from 'react'
import {
  Typography, Card, Space, Slider, Segmented, Alert, Button, Collapse,
  message, ColorPicker, Row, Col, Input, Switch, Tabs,
} from 'antd'
import { BgColorsOutlined, CopyOutlined, PlayCircleOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  buildAlertCss,
  buildAlertHtml,
  buildAlertFullDemo,
  ICON_SVGS,
  PRESETS,
  DEFAULTS,
} from '../utils/cssAlertGenerator'

const { Title, Paragraph, Text } = Typography
const { useMessage } = message

const TYPE_OPTIONS = {
  pt: [
    { label: 'Info', value: 'info' },
    { label: 'Sucesso', value: 'success' },
    { label: 'Aviso', value: 'warning' },
    { label: 'Erro', value: 'error' },
  ],
  en: [
    { label: 'Info', value: 'info' },
    { label: 'Success', value: 'success' },
    { label: 'Warning', value: 'warning' },
    { label: 'Error', value: 'error' },
  ],
}

const VARIANT_OPTIONS = {
  pt: [
    { label: 'Preenchido', value: 'filled' },
    { label: 'Contorno', value: 'outlined' },
    { label: 'Suave', value: 'soft' },
    { label: 'Subtle', value: 'subtle' },
  ],
  en: [
    { label: 'Filled', value: 'filled' },
    { label: 'Outline', value: 'outlined' },
    { label: 'Soft', value: 'soft' },
    { label: 'Subtle', value: 'subtle' },
  ],
}

const ANIMATION_OPTIONS = {
  pt: [
    { label: 'Nenhuma', value: 'none' },
    { label: 'Fade', value: 'fade' },
    { label: 'Slide', value: 'slide' },
    { label: 'Scale', value: 'scale' },
  ],
  en: [
    { label: 'None', value: 'none' },
    { label: 'Fade', value: 'fade' },
    { label: 'Slide', value: 'slide' },
    { label: 'Scale', value: 'scale' },
  ],
}

const PRESET_ORDER = ['default', 'info', 'success', 'warning', 'error', 'outline', 'soft', 'subtle', 'minimal']

const translations = {
  pt: {
    heading: 'Gerador de Alert CSS',
    intro: (
      <>
        Crie alertas/notificações usando só CSS. Escolha o tipo semântico
        (info, sucesso, aviso, erro), a variação visual (preenchido, contorno,
        suave, subtle), ícone, botão de fechar, borda lateral e animação de
        entrada. O preview injeta exatamente o CSS gerado, então você vê o
        resultado final em tempo real.
      </>
    ),
    tipTitle: 'Como funciona (e as pegadinhas)',
    tipBody: (
      <>
        Um alert é tipicamente um <Text code>{'<div role="alert">'}</Text>{' '}
        com filhos <Text code>{'.alert__icon'}</Text>,{' '}
        <Text code>{'.alert__content'}</Text> e{' '}
        <Text code>{'.alert__close'}</Text>. O atributo{' '}
        <Text code>role="alert"</Text> comunica a mudança aos leitores de tela.
        Use a variação <Text code>filled</Text> para destaque máximo e{' '}
        <Text code>subtle</Text> para mensagens de baixa prioridade. A animação
        de entrada é feita com <Text code>@keyframes</Text> — lembre-se de
        respeitar <Text code>prefers-reduced-motion</Text> em produção.
      </>
    ),
    settings: 'Configurações',
    presets: 'Presets',
    type: 'Tipo semântico',
    variant: 'Variação visual',
    title: 'Título',
    message: 'Mensagem',
    showIcon: 'Mostrar ícone',
    showClose: 'Botão de fechar',
    borderLeft: 'Borda lateral colorida',
    borderLeftWidth: 'Espessura da borda lateral (px)',
    borderRadius: 'Arredondamento (px)',
    padding: 'Padding interno (px)',
    gap: 'Espaço entre ícone e texto (px)',
    fontSize: 'Tamanho da fonte (px)',
    iconSize: 'Tamanho do ícone (px)',
    titleFontWeight: 'Peso da fonte do título',
    shadow: 'Box-shadow',
    animation: 'Animação de entrada',
    animationDuration: 'Duração da animação (ms)',
    className: 'Nome da classe CSS',
    preview: 'Pré-visualização',
    previewHint: 'O alerta abaixo usa exatamente o CSS gerado. Clique em "Reproduzir animação" para ver a entrada novamente.',
    replayAnimation: 'Reproduzir animação',
    outputCss: 'CSS gerado',
    outputHtml: 'HTML de exemplo',
    outputFull: 'Bloco completo',
    copy: 'Copiar',
    copied: 'Copiado!',
    copyError: 'Não foi possível copiar',
    sourceCol: 'Código-fonte',
    sourceBody:
      'O núcleo vive em src/utils/cssAlertGenerator.js. buildAlertCss monta as regras de .alert e seus filhos a partir do tipo semântico e da variação (filled/outlined/soft/subtle); buildAlertHtml gera o markup semântico com escape básico do texto e ícones inline.',
  },
  en: {
    heading: 'CSS Alert Generator',
    intro: (
      <>
        Build alerts/notifications using only CSS. Choose the semantic type
        (info, success, warning, error), visual variant (filled, outlined, soft,
        subtle), icon, close button, side border and entrance animation. The
        preview injects the exact generated CSS, so you see the final result in
        real time.
      </>
    ),
    tipTitle: 'How it works (and the gotchas)',
    tipBody: (
      <>
        An alert is typically a <Text code>{'<div role="alert">'}</Text> with
        children <Text code>{'.alert__icon'}</Text>,{' '}
        <Text code>{'.alert__content'}</Text> and{' '}
        <Text code>{'.alert__close'}</Text>. The{' '}
        <Text code>role="alert"</Text> attribute announces changes to screen
        readers. Use the <Text code>filled</Text> variant for maximum emphasis
        and <Text code>subtle</Text> for low-priority messages. The entrance
        animation uses <Text code>@keyframes</Text> — remember to respect{' '}
        <Text code>prefers-reduced-motion</Text> in production.
      </>
    ),
    settings: 'Settings',
    presets: 'Presets',
    type: 'Semantic type',
    variant: 'Visual variant',
    title: 'Title',
    message: 'Message',
    showIcon: 'Show icon',
    showClose: 'Close button',
    borderLeft: 'Colored side border',
    borderLeftWidth: 'Side border width (px)',
    borderRadius: 'Border radius (px)',
    padding: 'Padding (px)',
    gap: 'Gap between icon and text (px)',
    fontSize: 'Font size (px)',
    iconSize: 'Icon size (px)',
    titleFontWeight: 'Title font weight',
    shadow: 'Box-shadow',
    animation: 'Entrance animation',
    animationDuration: 'Animation duration (ms)',
    className: 'CSS class name',
    preview: 'Preview',
    previewHint: 'The alert below uses the exact generated CSS. Click "Replay animation" to see the entrance again.',
    replayAnimation: 'Replay animation',
    outputCss: 'Generated CSS',
    outputHtml: 'Example HTML',
    outputFull: 'Full block',
    copy: 'Copy',
    copied: 'Copied!',
    copyError: 'Could not copy',
    sourceCol: 'Source code',
    sourceBody:
      'The core lives in src/utils/cssAlertGenerator.js. buildAlertCss builds the rules for .alert and its children based on the semantic type and variant (filled/outlined/soft/subtle); buildAlertHtml generates semantic markup with basic text escaping and inline icons.',
  },
}

export default function CssAlertGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [messageApi, messageContextHolder] = useMessage()

  const [type, setType] = useState(DEFAULTS.type)
  const [variant, setVariant] = useState(DEFAULTS.variant)
  const [title, setTitle] = useState(DEFAULTS.title)
  const [messageText, setMessageText] = useState(DEFAULTS.message)
  const [showIcon, setShowIcon] = useState(DEFAULTS.showIcon)
  const [showClose, setShowClose] = useState(DEFAULTS.showClose)
  const [borderLeft, setBorderLeft] = useState(DEFAULTS.borderLeft)
  const [borderLeftWidth, setBorderLeftWidth] = useState(DEFAULTS.borderLeftWidth)
  const [borderRadius, setBorderRadius] = useState(DEFAULTS.borderRadius)
  const [padding, setPadding] = useState(DEFAULTS.padding)
  const [gap, setGap] = useState(DEFAULTS.gap)
  const [fontSize, setFontSize] = useState(DEFAULTS.fontSize)
  const [iconSize, setIconSize] = useState(DEFAULTS.iconSize)
  const [titleFontWeight, setTitleFontWeight] = useState(DEFAULTS.titleFontWeight)
  const [shadow, setShadow] = useState(DEFAULTS.shadow)
  const [animation, setAnimation] = useState(DEFAULTS.animation)
  const [animationDuration, setAnimationDuration] = useState(DEFAULTS.animationDuration)
  const [className, setClassName] = useState(DEFAULTS.className)
  const [previewKey, setPreviewKey] = useState(0)

  const applyPreset = (key) => {
    const p = PRESETS[key]
    if (!p) return
    setType(p.type)
    setVariant(p.variant)
    setTitle(p.title)
    setMessageText(p.message)
    setShowIcon(p.showIcon)
    setShowClose(p.showClose)
    setBorderLeft(p.borderLeft)
    setBorderLeftWidth(p.borderLeftWidth)
    setBorderRadius(p.borderRadius)
    setPadding(p.padding)
    setGap(p.gap)
    setFontSize(p.fontSize)
    setIconSize(p.iconSize)
    setTitleFontWeight(p.titleFontWeight)
    setShadow(p.shadow)
    setAnimation(p.animation)
    setAnimationDuration(p.animationDuration)
    setClassName(p.className)
    setPreviewKey((k) => k + 1)
  }

  const settings = useMemo(
    () => ({
      type,
      variant,
      title,
      message: messageText,
      showIcon,
      showClose,
      borderLeft,
      borderLeftWidth,
      borderRadius,
      padding,
      gap,
      fontSize,
      iconSize,
      titleFontWeight,
      shadow,
      animation,
      animationDuration,
      className,
    }),
    [
      type,
      variant,
      title,
      messageText,
      showIcon,
      showClose,
      borderLeft,
      borderLeftWidth,
      borderRadius,
      padding,
      gap,
      fontSize,
      iconSize,
      titleFontWeight,
      shadow,
      animation,
      animationDuration,
      className,
    ]
  )

  const cssOutput = useMemo(() => buildAlertCss(settings), [settings])
  const htmlOutput = useMemo(() => buildAlertHtml(settings), [settings])
  const fullOutput = useMemo(() => buildAlertFullDemo(settings), [settings])

  const copy = async (value) => {
    try {
      await navigator.clipboard.writeText(value)
      messageApi.success(t.copied)
    } catch {
      messageApi.error(t.copyError)
    }
  }

  const renderPreview = () => {
    const iconSvg = ICON_SVGS[type]
    return (
      <div
        key={previewKey}
        className={`${className} ${className}--${type}`}
        role="alert"
        style={{ maxWidth: 600, margin: '0 auto' }}
      >
        {showIcon && (
          <span className={`${className}__icon`} aria-hidden="true" dangerouslySetInnerHTML={{ __html: iconSvg }} />
        )}
        <div className={`${className}__content`}>
          {title && <strong className={`${className}__title`}>{title}</strong>}
          {messageText && <p className={`${className}__message`}>{messageText}</p>}
        </div>
        {showClose && (
          <button type="button" className={`${className}__close`} aria-label="Close" onClick={() => setPreviewKey((k) => k + 1)}>
            <span dangerouslySetInnerHTML={{ __html: ICON_SVGS.close }} />
          </button>
        )}
      </div>
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
      <Title level={2}><BgColorsOutlined /> {t.heading}</Title>
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
                <Text>{t.type}</Text>
                <Segmented
                  style={{ width: '100%' }}
                  block
                  value={type}
                  onChange={setType}
                  options={TYPE_OPTIONS[lang]}
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
                <Text>{t.title}</Text>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t.title}
                />
              </Space>

              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.message}</Text>
                <Input.TextArea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder={t.message}
                  rows={3}
                />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>{t.showIcon}</Text>
                <Switch size="small" checked={showIcon} onChange={setShowIcon} />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>{t.showClose}</Text>
                <Switch size="small" checked={showClose} onChange={setShowClose} />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>{t.borderLeft}</Text>
                <Switch size="small" checked={borderLeft} onChange={setBorderLeft} />
              </Space>

              {borderLeft && (
                <>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text>{t.borderLeftWidth}</Text>
                    <Text code>{borderLeftWidth}px</Text>
                  </Space>
                  <Slider min={1} max={16} value={borderLeftWidth} onChange={setBorderLeftWidth} />
                </>
              )}

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.borderRadius}</Text>
                <Text code>{borderRadius}px</Text>
              </Space>
              <Slider min={0} max={32} value={borderRadius} onChange={setBorderRadius} />

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.padding}</Text>
                <Text code>{padding}px</Text>
              </Space>
              <Slider min={0} max={48} value={padding} onChange={setPadding} />

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.gap}</Text>
                <Text code>{gap}px</Text>
              </Space>
              <Slider min={0} max={32} value={gap} onChange={setGap} />

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.fontSize}</Text>
                <Text code>{fontSize}px</Text>
              </Space>
              <Slider min={10} max={32} value={fontSize} onChange={setFontSize} />

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.iconSize}</Text>
                <Text code>{iconSize}px</Text>
              </Space>
              <Slider min={12} max={64} value={iconSize} onChange={setIconSize} />

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.titleFontWeight}</Text>
                <Text code>{titleFontWeight}</Text>
              </Space>
              <Slider min={100} max={900} step={100} value={titleFontWeight} onChange={setTitleFontWeight} />

              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.shadow}</Text>
                <Input
                  value={shadow}
                  onChange={(e) => setShadow(e.target.value)}
                  placeholder="0 2px 8px rgba(0, 0, 0, 0.08)"
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

              {animation !== 'none' && (
                <>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text>{t.animationDuration}</Text>
                    <Text code>{animationDuration}ms</Text>
                  </Space>
                  <Slider min={100} max={2000} value={animationDuration} onChange={setAnimationDuration} />
                </>
              )}

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
            extra={
              <Button
                size="small"
                icon={<PlayCircleOutlined />}
                onClick={() => setPreviewKey((k) => k + 1)}
              >
                {t.replayAnimation}
              </Button>
            }
          >
            <style>{cssOutput}</style>
            <div
              style={{
                border: '1px solid #f0f0f0',
                borderRadius: 8,
                padding: 40,
                background: '#fafafa',
                minHeight: 180,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {renderPreview()}
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
            label: `${t.sourceCol} — buildAlertCss / buildAlertHtml`,
            children: (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Paragraph type="secondary">{t.sourceBody}</Paragraph>
                <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 320 }}>
                  <code>{buildAlertCss.toString()}</code>
                </pre>
              </Space>
            ),
          },
        ]}
      />
    </Space>
  )
}
