import React, { useMemo, useState, useCallback } from 'react'
import {
  Typography, Card, Space, Slider, Segmented, Alert, Button, Collapse,
  message, ColorPicker, Row, Col, Input, InputNumber, Tabs, Switch, Divider,
} from 'antd'
import { BgColorsOutlined, ContainerOutlined, CopyOutlined, PlusOutlined, MinusOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  buildAccordionCss,
  buildAccordionHtml,
  buildAccordionFullDemo,
  ACCORDION_PRESETS,
} from '../utils/cssAccordionGenerator'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input

const translations = {
  pt: {
    title: 'Gerador de Accordion CSS',
    intro: (
      <>
        Monte accordions funcionais usando só CSS + os elementos nativos{' '}
        <Text code>{'<details>'}</Text> e <Text code>{'<summary>'}</Text>. Escolha
        cores, ícones, animação e comportamento; o preview abaixo usa o CSS exato
        que será copiado, então você expande e recolhe o resultado final em tempo real.
      </>
    ),
    tipTitle: 'Como usar (e as pegadinhas)',
    tipBody: (
      <>
        Cada item é um <Text code>{'<details class="accordion-item">'}</Text> com um{' '}
        <Text code>{'<summary>'}</Text> como cabeçalho clicável. A animação de altura
        usa o truque do <Text code>{'grid-template-rows: 0fr / 1fr'}</Text> — o conteúdo
        interno precisa de <Text code>{'overflow: hidden'}</Text>. Para permitir que só
        um item fique aberto por vez, use o atributo <Text code>{'name="grupo"'}</Text>{' '}
        (suporte moderno a accordions exclusivos). Acessibilidade vem de graça: teclado,
        leitores de tela e foco nativos do navegador.
      </>
    ),
    settings: 'Configurações',
    items: 'Itens',
    addItem: 'Adicionar item',
    removeItem: 'Remover',
    itemTitle: 'Título',
    itemContent: 'Conteúdo',
    behavior: 'Comportamento',
    allowMultiple: 'Permitir vários abertos',
    appearance: 'Aparência',
    headerColors: 'Cabeçalho',
    contentColors: 'Conteúdo',
    headerBg: 'Fundo',
    headerColor: 'Texto',
    headerActiveBg: 'Fundo ativo',
    headerActiveColor: 'Texto ativo',
    contentBg: 'Fundo',
    contentColor: 'Texto',
    borderColor: 'Cor da borda',
    borderWidth: 'Espessura da borda',
    borderRadius: 'Arredondamento',
    padding: 'Padding',
    paddingHeader: 'Cabeçalho',
    paddingContent: 'Conteúdo',
    fontSize: 'Tamanho da fonte',
    fontSizeHeader: 'Cabeçalho',
    fontSizeContent: 'Conteúdo',
    gap: 'Espaço entre itens',
    icon: 'Ícone',
    iconChevron: 'Chevron',
    iconArrow: 'Seta',
    iconPlusMinus: 'Plus/minus',
    iconNone: 'Nenhum',
    iconPosition: 'Posição do ícone',
    iconLeft: 'Esquerda',
    iconRight: 'Direita',
    animation: 'Animação',
    animationSlide: 'Slide',
    animationFade: 'Fade',
    animationNone: 'Nenhuma',
    duration: 'Duração (ms)',
    easing: 'Easing',
    preview: 'Pré-visualização',
    previewHint: 'O accordion abaixo usa exatamente o CSS gerado — clique nos itens para testar.',
    outputCss: 'CSS gerado',
    outputHtml: 'HTML de exemplo',
    outputFull: 'Bloco completo',
    copy: 'Copiar',
    copied: 'Copiado!',
    copyError: 'Não foi possível copiar',
    presets: 'Presets',
    sourceCol: 'Código-fonte',
    sourceBody:
      'O núcleo vive em src/utils/cssAccordionGenerator.js. buildAccordionCss monta as regras para <details>, <summary>, o truque de grid-template-rows para animação e os ícones via pseudo-elemento; buildAccordionHtml gera o markup semântico.',
  },
  en: {
    title: 'CSS Accordion Generator',
    intro: (
      <>
        Build working accordions using only CSS + the native{' '}
        <Text code>{'<details>'}</Text> and <Text code>{'<summary>'}</Text> elements.
        Choose colors, icons, animation and behavior; the preview below uses the exact
        CSS that will be copied, so you can expand and collapse the final result in real time.
      </>
    ),
    tipTitle: 'How to use (and the gotchas)',
    tipBody: (
      <>
        Each item is a <Text code>{'<details class="accordion-item">'}</Text> with a{' '}
        <Text code>{'<summary>'}</Text> as the clickable header. The height animation
        uses the <Text code>{'grid-template-rows: 0fr / 1fr'}</Text> trick — the inner
        content must have <Text code>{'overflow: hidden'}</Text>. To allow only one
        open item at a time, use the <Text code>{'name="group"'}</Text> attribute
        (modern exclusive accordion support). Accessibility is free: keyboard, screen
        reader and native browser focus.
      </>
    ),
    settings: 'Settings',
    items: 'Items',
    addItem: 'Add item',
    removeItem: 'Remove',
    itemTitle: 'Title',
    itemContent: 'Content',
    behavior: 'Behavior',
    allowMultiple: 'Allow multiple open',
    appearance: 'Appearance',
    headerColors: 'Header',
    contentColors: 'Content',
    headerBg: 'Background',
    headerColor: 'Text',
    headerActiveBg: 'Active background',
    headerActiveColor: 'Active text',
    contentBg: 'Background',
    contentColor: 'Text',
    borderColor: 'Border color',
    borderWidth: 'Border width',
    borderRadius: 'Border radius',
    padding: 'Padding',
    paddingHeader: 'Header',
    paddingContent: 'Content',
    fontSize: 'Font size',
    fontSizeHeader: 'Header',
    fontSizeContent: 'Content',
    gap: 'Gap between items',
    icon: 'Icon',
    iconChevron: 'Chevron',
    iconArrow: 'Arrow',
    iconPlusMinus: 'Plus/minus',
    iconNone: 'None',
    iconPosition: 'Icon position',
    iconLeft: 'Left',
    iconRight: 'Right',
    animation: 'Animation',
    animationSlide: 'Slide',
    animationFade: 'Fade',
    animationNone: 'None',
    duration: 'Duration (ms)',
    easing: 'Easing',
    preview: 'Preview',
    previewHint: 'The accordion below uses exactly the generated CSS — click the items to test.',
    outputCss: 'Generated CSS',
    outputHtml: 'Example HTML',
    outputFull: 'Full snippet',
    copy: 'Copy',
    copied: 'Copied!',
    copyError: 'Could not copy',
    presets: 'Presets',
    sourceCol: 'Source code',
    sourceBody:
      'The core lives in src/utils/cssAccordionGenerator.js. buildAccordionCss builds the rules for <details>, <summary>, the grid-template-rows animation trick and icons via pseudo-element; buildAccordionHtml generates the semantic markup.',
  },
}

const PREVIEW_CLASS = 'devtools-accordion-preview'
const PREVIEW_NAME = 'devtools-accordion-preview-group'

const defaultItems = {
  pt: [
    { title: 'Primeira seção', content: 'Conteúdo da primeira seção do accordion.' },
    { title: 'Segunda seção', content: 'Conteúdo da segunda seção do accordion.' },
    { title: 'Terceira seção', content: 'Conteúdo da terceira seção do accordion.' },
  ],
  en: [
    { title: 'First section', content: 'Content of the first accordion section.' },
    { title: 'Second section', content: 'Content of the second accordion section.' },
    { title: 'Third section', content: 'Content of the third accordion section.' },
  ],
}

export default function CssAccordionGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [messageApi, messageContextHolder] = message.useMessage()

  const [items, setItems] = useState(() => defaultItems[lang])
  const [allowMultiple, setAllowMultiple] = useState(true)
  const [icon, setIcon] = useState('chevron')
  const [iconPosition, setIconPosition] = useState('right')
  const [animation, setAnimation] = useState('slide')
  const [duration, setDuration] = useState(250)
  const [easing, setEasing] = useState('ease-out')
  const [gap, setGap] = useState(8)
  const [borderWidth, setBorderWidth] = useState(1)
  const [borderRadius, setBorderRadius] = useState(8)
  const [paddingHeader, setPaddingHeader] = useState(16)
  const [paddingContent, setPaddingContent] = useState(16)
  const [fontSizeHeader, setFontSizeHeader] = useState(16)
  const [fontSizeContent, setFontSizeContent] = useState(14)
  const [headerBg, setHeaderBg] = useState('#ffffff')
  const [headerColor, setHeaderColor] = useState('#262626')
  const [headerActiveBg, setHeaderActiveBg] = useState('#f0f0ff')
  const [headerActiveColor, setHeaderActiveColor] = useState('#2f2f2f')
  const [contentBg, setContentBg] = useState('#ffffff')
  const [contentColor, setContentColor] = useState('#434343')
  const [borderColor, setBorderColor] = useState('#d9d9d9')

  const options = useMemo(
    () => ({
      className: PREVIEW_CLASS,
      items,
      allowMultiple,
      exclusiveName: PREVIEW_NAME,
      icon,
      iconPosition,
      animation,
      duration,
      easing,
      gap,
      borderWidth,
      borderRadius,
      paddingHeader,
      paddingContent,
      fontSizeHeader,
      fontSizeContent,
      headerBg,
      headerColor,
      headerActiveBg,
      headerActiveColor,
      contentBg,
      contentColor,
      borderColor,
    }),
    [
      items, allowMultiple, icon, iconPosition, animation, duration, easing, gap,
      borderWidth, borderRadius, paddingHeader, paddingContent, fontSizeHeader,
      fontSizeContent, headerBg, headerColor, headerActiveBg, headerActiveColor,
      contentBg, contentColor, borderColor,
    ]
  )

  const css = useMemo(() => buildAccordionCss(options), [options])
  const html = useMemo(() => buildAccordionHtml(options), [options])
  const fullDemo = useMemo(() => buildAccordionFullDemo(options), [options])

  const copy = useCallback(async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      messageApi.success(t.copied)
    } catch {
      messageApi.error(t.copyError)
    }
  }, [messageApi, t])

  const applyPreset = useCallback((key) => {
    const preset = ACCORDION_PRESETS.find((p) => p.key === key)
    if (!preset) return
    const o = preset.opts
    if (o.icon !== undefined) setIcon(o.icon)
    if (o.iconPosition !== undefined) setIconPosition(o.iconPosition)
    if (o.animation !== undefined) setAnimation(o.animation)
    if (o.gap !== undefined) setGap(o.gap)
    if (o.borderWidth !== undefined) setBorderWidth(o.borderWidth)
    if (o.borderRadius !== undefined) setBorderRadius(o.borderRadius)
    if (o.paddingHeader !== undefined) setPaddingHeader(o.paddingHeader)
    if (o.paddingContent !== undefined) setPaddingContent(o.paddingContent)
    if (o.headerBg !== undefined) setHeaderBg(o.headerBg)
    if (o.headerColor !== undefined) setHeaderColor(o.headerColor)
    if (o.headerActiveBg !== undefined) setHeaderActiveBg(o.headerActiveBg)
    if (o.headerActiveColor !== undefined) setHeaderActiveColor(o.headerActiveColor)
    if (o.contentBg !== undefined) setContentBg(o.contentBg)
    if (o.contentColor !== undefined) setContentColor(o.contentColor)
    if (o.borderColor !== undefined) setBorderColor(o.borderColor)
  }, [])

  const updateItem = useCallback((idx, field, value) => {
    setItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item))
    )
  }, [])

  const addItem = useCallback(() => {
    setItems((prev) => [
      ...prev,
      { title: `${t.itemTitle} ${prev.length + 1}`, content: t.itemContent },
    ])
  }, [t])

  const removeItem = useCallback((idx) => {
    setItems((prev) => prev.filter((_, i) => i !== idx))
  }, [])

  const iconOptions = [
    { label: t.iconChevron, value: 'chevron' },
    { label: t.iconArrow, value: 'arrow' },
    { label: t.iconPlusMinus, value: 'plus-minus' },
    { label: t.iconNone, value: 'none' },
  ]

  const iconPositionOptions = [
    { label: t.iconLeft, value: 'left' },
    { label: t.iconRight, value: 'right' },
  ]

  const animationOptions = [
    { label: t.animationSlide, value: 'slide' },
    { label: t.animationFade, value: 'fade' },
    { label: t.animationNone, value: 'none' },
  ]

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {messageContextHolder}
      <Title level={2}><ContainerOutlined /> {t.title}</Title>
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
                options={ACCORDION_PRESETS.map((p) => ({
                  value: p.key,
                  label: p.name[lang],
                }))}
              />

              <Divider orientation="left" style={{ marginTop: 8, marginBottom: 0 }}>
                {t.items}
              </Divider>
              {items.map((item, idx) => (
                <Card
                  key={idx}
                  size="small"
                  bodyStyle={{ padding: 12 }}
                  extra={
                    items.length > 1 ? (
                      <Button
                        size="small"
                        danger
                        icon={<MinusOutlined />}
                        onClick={() => removeItem(idx)}
                      >
                        {t.removeItem}
                      </Button>
                    ) : null
                  }
                >
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Text>{t.itemTitle}</Text>
                    <Input
                      value={item.title}
                      onChange={(e) => updateItem(idx, 'title', e.target.value)}
                    />
                    <Text>{t.itemContent}</Text>
                    <TextArea
                      rows={2}
                      value={item.content}
                      onChange={(e) => updateItem(idx, 'content', e.target.value)}
                    />
                  </Space>
                </Card>
              ))}
              <Button type="dashed" block icon={<PlusOutlined />} onClick={addItem}>
                {t.addItem}
              </Button>

              <Divider orientation="left" style={{ marginTop: 8, marginBottom: 0 }}>
                {t.behavior}
              </Divider>
              <Space>
                <Switch checked={allowMultiple} onChange={setAllowMultiple} />
                <Text>{t.allowMultiple}</Text>
              </Space>

              <Divider orientation="left" style={{ marginTop: 8, marginBottom: 0 }}>
                {t.appearance}
              </Divider>

              <Row gutter={16}>
                <Col span={12}>
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Text>{t.icon}</Text>
                    <Segmented
                      style={{ width: '100%' }}
                      block
                      value={icon}
                      onChange={setIcon}
                      options={iconOptions}
                    />
                  </Space>
                </Col>
                <Col span={12}>
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Text>{t.iconPosition}</Text>
                    <Segmented
                      style={{ width: '100%' }}
                      block
                      value={iconPosition}
                      onChange={setIconPosition}
                      options={iconPositionOptions}
                    />
                  </Space>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Text>{t.animation}</Text>
                    <Segmented
                      style={{ width: '100%' }}
                      block
                      value={animation}
                      onChange={setAnimation}
                      options={animationOptions}
                    />
                  </Space>
                </Col>
                <Col span={12}>
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Text>{t.duration}</Text>
                    <InputNumber
                      min={0}
                      max={800}
                      step={50}
                      value={duration}
                      onChange={setDuration}
                      style={{ width: '100%' }}
                    />
                  </Space>
                </Col>
              </Row>

              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.easing}</Text>
                <Input value={easing} onChange={(e) => setEasing(e.target.value)} />
              </Space>

              <Row gutter={16}>
                <Col span={12}>
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Text>{t.borderWidth}</Text>
                    <Slider min={0} max={4} step={1} value={borderWidth} onChange={setBorderWidth} />
                  </Space>
                </Col>
                <Col span={12}>
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Text>{t.borderRadius}</Text>
                    <Slider min={0} max={32} value={borderRadius} onChange={setBorderRadius} />
                  </Space>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Text>{t.paddingHeader}</Text>
                    <Slider min={8} max={32} value={paddingHeader} onChange={setPaddingHeader} />
                  </Space>
                </Col>
                <Col span={12}>
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Text>{t.paddingContent}</Text>
                    <Slider min={8} max={32} value={paddingContent} onChange={setPaddingContent} />
                  </Space>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Text>{t.fontSizeHeader}</Text>
                    <Slider min={12} max={24} value={fontSizeHeader} onChange={setFontSizeHeader} />
                  </Space>
                </Col>
                <Col span={12}>
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Text>{t.fontSizeContent}</Text>
                    <Slider min={12} max={20} value={fontSizeContent} onChange={setFontSizeContent} />
                  </Space>
                </Col>
              </Row>

              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.gap}</Text>
                <Slider min={0} max={32} value={gap} onChange={setGap} />
              </Space>

              <Text strong>{t.headerColors}</Text>
              <Row gutter={[16, 12]}>
                <Col span={12}>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text>{t.headerBg}</Text>
                    <ColorPicker value={headerBg} onChange={setHeaderBg} showText />
                  </Space>
                </Col>
                <Col span={12}>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text>{t.headerColor}</Text>
                    <ColorPicker value={headerColor} onChange={setHeaderColor} showText />
                  </Space>
                </Col>
                <Col span={12}>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text>{t.headerActiveBg}</Text>
                    <ColorPicker value={headerActiveBg} onChange={setHeaderActiveBg} showText />
                  </Space>
                </Col>
                <Col span={12}>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text>{t.headerActiveColor}</Text>
                    <ColorPicker value={headerActiveColor} onChange={setHeaderActiveColor} showText />
                  </Space>
                </Col>
              </Row>

              <Text strong>{t.contentColors}</Text>
              <Row gutter={[16, 12]}>
                <Col span={12}>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text>{t.contentBg}</Text>
                    <ColorPicker value={contentBg} onChange={setContentBg} showText />
                  </Space>
                </Col>
                <Col span={12}>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text>{t.contentColor}</Text>
                    <ColorPicker value={contentColor} onChange={setContentColor} showText />
                  </Space>
                </Col>
              </Row>

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.borderColor}</Text>
                <ColorPicker value={borderColor} onChange={setBorderColor} showText />
              </Space>
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={14}>
          <Card title={t.preview}>
            <style>{css}</style>
            <div
              style={{
                border: '1px solid #f0f0f0',
                borderRadius: 8,
                padding: 24,
                background: '#fafafa',
                minHeight: 320,
              }}
            >
              <div className={PREVIEW_CLASS}>
                {items.map((item, idx) => (
                  <details
                    key={idx}
                    className={`${PREVIEW_CLASS}-item`}
                    name={allowMultiple ? undefined : PREVIEW_NAME}
                  >
                    <summary>{item.title}</summary>
                    <div className={`${PREVIEW_CLASS}-content`}>
                      <div className={`${PREVIEW_CLASS}-inner`}>
                        {item.content}
                      </div>
                    </div>
                  </details>
                ))}
              </div>
            </div>
            <Paragraph type="secondary" style={{ marginTop: 12, marginBottom: 0 }}>
              {t.previewHint}
            </Paragraph>
          </Card>
        </Col>
      </Row>

      <Tabs
        defaultActiveKey="css"
        items={[
          {
            key: 'css',
            label: t.outputCss,
            children: (
              <Card
                extra={(
                  <Button size="small" icon={<CopyOutlined />} onClick={() => copy(css)}>
                    {t.copy}
                  </Button>
                )}
              >
                <pre style={{ margin: 0, overflowX: 'auto' }}>
                  <code>{css}</code>
                </pre>
              </Card>
            ),
          },
          {
            key: 'html',
            label: t.outputHtml,
            children: (
              <Card
                extra={(
                  <Button size="small" icon={<CopyOutlined />} onClick={() => copy(html)}>
                    {t.copy}
                  </Button>
                )}
              >
                <pre style={{ margin: 0, overflowX: 'auto' }}>
                  <code>{html}</code>
                </pre>
              </Card>
            ),
          },
          {
            key: 'full',
            label: t.outputFull,
            children: (
              <Card
                extra={(
                  <Button size="small" icon={<CopyOutlined />} onClick={() => copy(fullDemo)}>
                    {t.copy}
                  </Button>
                )}
              >
                <pre style={{ margin: 0, overflowX: 'auto' }}>
                  <code>{fullDemo}</code>
                </pre>
              </Card>
            ),
          },
        ]}
      />

      <Collapse
        items={[
          {
            key: 'source',
            label: `${t.sourceCol} — buildAccordionCss / buildAccordionHtml`,
            children: (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Paragraph type="secondary">{t.sourceBody}</Paragraph>
                <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 420 }}>
                  <code>{buildAccordionCss.toString()}</code>
                </pre>
              </Space>
            ),
          },
        ]}
      />
    </Space>
  )
}
