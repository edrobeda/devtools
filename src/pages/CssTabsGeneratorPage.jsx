import React, { useMemo, useState } from 'react'
import {
  Typography, Card, Space, Slider, Segmented, Alert, Button, Collapse,
  message, ColorPicker, Row, Col, Input, InputNumber, Tabs,
} from 'antd'
import { BgColorsOutlined, CopyOutlined, LayoutOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  buildTabsCss,
  buildTabsHtml,
  buildTabsFullDemo,
  TABS_PRESETS,
} from '../utils/cssTabsGenerator'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input

const DEFAULT_ITEMS = {
  pt: ['Visão geral', 'Detalhes', 'Configurações', 'Ajuda'],
  en: ['Overview', 'Details', 'Settings', 'Help'],
}

const translations = {
  pt: {
    title: 'Gerador de Tabs CSS',
    intro: (
      <>
        Monte abas (tabs) funcionais usando só CSS + radio buttons. Escolha a
        orientação, o estilo visual, as cores e o espaçamento; o preview usa o
        CSS exato que será copiado, então você vê e clica no resultado final em
        tempo real.
      </>
    ),
    tipTitle: 'Como usar (e as pegadinhas)',
    tipBody: (
      <>
        Cada aba é um <Text code>{'<label>'}</Text> vinculado a um{' '}
        <Text code>{'<input type="radio">'}</Text> oculto. O estado ativo é
        controlado pelo seletor <Text code>{':checked'}</Text> do CSS, então as
        abas funcionam sem JavaScript. Use um <Text code>{'name'}</Text>{' '}
        igual em todos os radios do mesmo grupo e ids únicos para cada par
        input/label. A acessibilidade é razoável para conteúdo estático, mas
        para apps complexos prefira o padrão ARIA com botões e{' '}
        <Text code>{'tabpanel'}</Text> gerenciados por JS.
      </>
    ),
    settings: 'Configurações',
    items: 'Rótulos das abas (um por linha)',
    orientation: 'Orientação',
    orientationHorizontal: 'Horizontal',
    orientationVertical: 'Vertical',
    variant: 'Estilo',
    variantUnderline: 'Underline',
    variantPills: 'Pills',
    variantCards: 'Cards',
    variantBorder: 'Borda',
    fontSize: 'Tamanho da fonte',
    gap: 'Espaço entre abas',
    paddingX: 'Padding horizontal',
    paddingY: 'Padding vertical',
    borderRadius: 'Arredondamento',
    borderWidth: 'Espessura da borda ativa',
    contentPadding: 'Padding do conteúdo',
    transitionDuration: 'Duração da transição (ms)',
    colors: 'Cores',
    textColor: 'Texto',
    activeColor: 'Texto ativo',
    bgColor: 'Fundo da aba',
    hoverBgColor: 'Fundo no hover',
    activeBgColor: 'Fundo ativo',
    borderColor: 'Cor da borda',
    activeBorderColor: 'Cor da borda ativa',
    contentBg: 'Fundo do conteúdo',
    preview: 'Pré-visualização',
    previewHint: 'As abas abaixo usam exatamente o CSS gerado — clique para testar.',
    outputCss: 'CSS gerado',
    outputHtml: 'HTML de exemplo',
    outputFull: 'Bloco completo',
    copy: 'Copiar',
    copied: 'Copiado!',
    copyError: 'Não foi possível copiar',
    presets: 'Presets',
    sourceCol: 'Código-fonte',
    sourceBody:
      'O núcleo vive em src/utils/cssTabsGenerator.js. buildTabsCss monta as regras do container, dos inputs ocultos, das labels, das regras :checked e dos painéis. buildTabsHtml gera o markup com radio buttons, labels vinculadas por for e painéis com role="tabpanel".',
  },
  en: {
    title: 'CSS Tabs Generator',
    intro: (
      <>
        Build working tabs using only CSS + radio buttons. Pick the orientation,
        visual style, colors and spacing; the preview uses the exact CSS that
        will be copied, so you see and click the final result in real time.
      </>
    ),
    tipTitle: 'How to use (and the gotchas)',
    tipBody: (
      <>
        Each tab is a <Text code>{'<label>'}</Text> tied to a hidden{' '}
        <Text code>{'<input type="radio">'}</Text>. The active state is handled
        by the CSS <Text code>{':checked'}</Text> selector, so the tabs work
        without JavaScript. Use the same <Text code>{'name'}</Text> for every
        radio in the same group and unique ids for each input/label pair.
        Accessibility is fine for static content, but for complex apps prefer
        the ARIA pattern with buttons and JS-managed{' '}
        <Text code>{'tabpanel'}</Text>.
      </>
    ),
    settings: 'Settings',
    items: 'Tab labels (one per line)',
    orientation: 'Orientation',
    orientationHorizontal: 'Horizontal',
    orientationVertical: 'Vertical',
    variant: 'Style',
    variantUnderline: 'Underline',
    variantPills: 'Pills',
    variantCards: 'Cards',
    variantBorder: 'Border',
    fontSize: 'Font size',
    gap: 'Gap between tabs',
    paddingX: 'Horizontal padding',
    paddingY: 'Vertical padding',
    borderRadius: 'Border radius',
    borderWidth: 'Active border width',
    contentPadding: 'Content padding',
    transitionDuration: 'Transition duration (ms)',
    colors: 'Colors',
    textColor: 'Text',
    activeColor: 'Active text',
    bgColor: 'Tab background',
    hoverBgColor: 'Hover background',
    activeBgColor: 'Active background',
    borderColor: 'Border color',
    activeBorderColor: 'Active border color',
    contentBg: 'Content background',
    preview: 'Preview',
    previewHint: 'The tabs below use exactly the generated CSS — click to test.',
    outputCss: 'Generated CSS',
    outputHtml: 'Example HTML',
    outputFull: 'Full snippet',
    copy: 'Copy',
    copied: 'Copied!',
    copyError: 'Could not copy',
    presets: 'Presets',
    sourceCol: 'Source code',
    sourceBody:
      'The core lives in src/utils/cssTabsGenerator.js. buildTabsCss builds the rules for the container, hidden inputs, labels, :checked selectors and panels. buildTabsHtml generates the markup with radio buttons, labels linked by for and panels with role="tabpanel".',
  },
}

const PREVIEW_CLASS = 'devtools-tabs-preview'

export default function CssTabsGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [messageApi, messageContextHolder] = message.useMessage()

  const [itemsText, setItemsText] = useState(DEFAULT_ITEMS[lang].join('\n'))
  const [orientation, setOrientation] = useState('horizontal')
  const [variant, setVariant] = useState('underline')
  const [fontSize, setFontSize] = useState(14)
  const [gap, setGap] = useState(8)
  const [paddingX, setPaddingX] = useState(16)
  const [paddingY, setPaddingY] = useState(10)
  const [borderRadius, setBorderRadius] = useState(6)
  const [borderWidth, setBorderWidth] = useState(2)
  const [contentPadding, setContentPadding] = useState(16)
  const [transitionDuration, setTransitionDuration] = useState(200)
  const [color, setColor] = useState('#595959')
  const [activeColor, setActiveColor] = useState('#1677ff')
  const [bgColor, setBgColor] = useState('transparent')
  const [hoverBgColor, setHoverBgColor] = useState('#f5f5f5')
  const [activeBgColor, setActiveBgColor] = useState('#e6f4ff')
  const [borderColor, setBorderColor] = useState('#d9d9d9')
  const [activeBorderColor, setActiveBorderColor] = useState('#1677ff')
  const [contentBg, setContentBg] = useState('#ffffff')

  const items = useMemo(
    () => itemsText.split('\n').map((s) => s.trim()).filter(Boolean),
    [itemsText]
  )

  const options = useMemo(
    () => ({
      className: PREVIEW_CLASS,
      orientation,
      variant,
      fontSize,
      gap,
      paddingX,
      paddingY,
      borderRadius,
      borderWidth,
      contentPadding,
      transitionDuration,
      color,
      activeColor,
      bgColor,
      hoverBgColor,
      activeBgColor,
      borderColor,
      activeBorderColor,
      contentBg,
    }),
    [
      orientation, variant, fontSize, gap, paddingX, paddingY, borderRadius,
      borderWidth, contentPadding, transitionDuration, color, activeColor,
      bgColor, hoverBgColor, activeBgColor, borderColor, activeBorderColor,
      contentBg,
    ]
  )

  const css = useMemo(() => buildTabsCss(options), [options])
  const html = useMemo(() => buildTabsHtml(items, options), [items, options])
  const fullDemo = useMemo(() => buildTabsFullDemo(options, items), [options, items])

  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      messageApi.success(t.copied)
    } catch {
      messageApi.error(t.copyError)
    }
  }

  const applyPreset = (key) => {
    const preset = TABS_PRESETS.find((p) => p.key === key)
    if (!preset) return
    const o = preset.opts
    if (o.orientation !== undefined) setOrientation(o.orientation)
    if (o.variant !== undefined) setVariant(o.variant)
    if (o.fontSize !== undefined) setFontSize(o.fontSize)
    if (o.gap !== undefined) setGap(o.gap)
    if (o.paddingX !== undefined) setPaddingX(o.paddingX)
    if (o.paddingY !== undefined) setPaddingY(o.paddingY)
    if (o.borderRadius !== undefined) setBorderRadius(o.borderRadius)
    if (o.borderWidth !== undefined) setBorderWidth(o.borderWidth)
    if (o.contentPadding !== undefined) setContentPadding(o.contentPadding)
    if (o.transitionDuration !== undefined) setTransitionDuration(o.transitionDuration)
    if (o.color !== undefined) setColor(o.color)
    if (o.activeColor !== undefined) setActiveColor(o.activeColor)
    if (o.bgColor !== undefined) setBgColor(o.bgColor)
    if (o.hoverBgColor !== undefined) setHoverBgColor(o.hoverBgColor)
    if (o.activeBgColor !== undefined) setActiveBgColor(o.activeBgColor)
    if (o.borderColor !== undefined) setBorderColor(o.borderColor)
    if (o.activeBorderColor !== undefined) setActiveBorderColor(o.activeBorderColor)
    if (o.contentBg !== undefined) setContentBg(o.contentBg)
  }

  const renderPreview = () => {
    const group = `${PREVIEW_CLASS}-group`
    const safeItems = items.length > 0 ? items : ['Tab 1', 'Tab 2', 'Tab 3']
    return (
      <div className={PREVIEW_CLASS} key={`${safeItems.length}-${orientation}-${variant}`}>
        {safeItems.map((_, i) => (
          <input
            key={`input-${i}`}
            type="radio"
            name={group}
            id={`${group}-${i}`}
            defaultChecked={i === 0}
          />
        ))}
        <div className="tab-labels" role="tablist">
          {safeItems.map((label, i) => (
            <label key={`label-${i}`} htmlFor={`${group}-${i}`}>
              {label}
            </label>
          ))}
        </div>
        <div className="tab-panels">
          {safeItems.map((label, i) => (
            <div
              key={`panel-${i}`}
              className="tab-panel"
              role="tabpanel"
              aria-labelledby={`${group}-${i}`}
              tabIndex={0}
            >
              {label} — {lang === 'pt' ? 'conteúdo da aba' : 'tab content'} {i + 1}
            </div>
          ))}
        </div>
      </div>
    )
  }

  const VARIANT_OPTIONS = {
    pt: [
      { label: t.variantUnderline, value: 'underline' },
      { label: t.variantPills, value: 'pills' },
      { label: t.variantCards, value: 'cards' },
      { label: t.variantBorder, value: 'border' },
    ],
    en: [
      { label: t.variantUnderline, value: 'underline' },
      { label: t.variantPills, value: 'pills' },
      { label: t.variantCards, value: 'cards' },
      { label: t.variantBorder, value: 'border' },
    ],
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {messageContextHolder}
      <Title level={2}><LayoutOutlined /> {t.title}</Title>
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
                options={TABS_PRESETS.map((p) => ({
                  value: p.key,
                  label: p.name[lang],
                }))}
              />

              <Space direction="vertical" size={4} style={{ width: '100%', marginTop: 8 }}>
                <Text>{t.items}</Text>
                <TextArea
                  rows={4}
                  value={itemsText}
                  onChange={(e) => setItemsText(e.target.value)}
                  placeholder={DEFAULT_ITEMS[lang].join('\n')}
                />
              </Space>

              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.orientation}</Text>
                <Segmented
                  style={{ width: '100%' }}
                  block
                  value={orientation}
                  onChange={setOrientation}
                  options={[
                    { label: t.orientationHorizontal, value: 'horizontal' },
                    { label: t.orientationVertical, value: 'vertical' },
                  ]}
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

              <Row gutter={16}>
                <Col span={12}>
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Text>{t.fontSize}</Text>
                    <InputNumber min={10} max={32} value={fontSize} onChange={setFontSize} style={{ width: '100%' }} />
                  </Space>
                </Col>
                <Col span={12}>
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Text>{t.gap}</Text>
                    <InputNumber min={0} max={40} value={gap} onChange={setGap} style={{ width: '100%' }} />
                  </Space>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Text>{t.paddingX}</Text>
                    <InputNumber min={0} max={48} value={paddingX} onChange={setPaddingX} style={{ width: '100%' }} />
                  </Space>
                </Col>
                <Col span={12}>
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Text>{t.paddingY}</Text>
                    <InputNumber min={0} max={48} value={paddingY} onChange={setPaddingY} style={{ width: '100%' }} />
                  </Space>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Text>{t.borderRadius}</Text>
                    <Slider min={0} max={40} value={borderRadius} onChange={setBorderRadius} />
                  </Space>
                </Col>
                <Col span={12}>
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Text>{t.borderWidth}</Text>
                    <Slider min={1} max={8} value={borderWidth} onChange={setBorderWidth} />
                  </Space>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Text>{t.contentPadding}</Text>
                    <InputNumber min={0} max={48} value={contentPadding} onChange={setContentPadding} style={{ width: '100%' }} />
                  </Space>
                </Col>
                <Col span={12}>
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Text>{t.transitionDuration}</Text>
                    <InputNumber min={0} max={1000} step={50} value={transitionDuration} onChange={setTransitionDuration} style={{ width: '100%' }} />
                  </Space>
                </Col>
              </Row>

              <Text strong>{t.colors}</Text>
              <Row gutter={[16, 12]}>
                <Col span={12}>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text>{t.textColor}</Text>
                    <ColorPicker value={color} onChange={setColor} showText />
                  </Space>
                </Col>
                <Col span={12}>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text>{t.activeColor}</Text>
                    <ColorPicker value={activeColor} onChange={setActiveColor} showText />
                  </Space>
                </Col>
                <Col span={12}>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text>{t.bgColor}</Text>
                    <ColorPicker value={bgColor} onChange={setBgColor} showText />
                  </Space>
                </Col>
                <Col span={12}>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text>{t.hoverBgColor}</Text>
                    <ColorPicker value={hoverBgColor} onChange={setHoverBgColor} showText />
                  </Space>
                </Col>
                <Col span={12}>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text>{t.activeBgColor}</Text>
                    <ColorPicker value={activeBgColor} onChange={setActiveBgColor} showText />
                  </Space>
                </Col>
                <Col span={12}>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text>{t.borderColor}</Text>
                    <ColorPicker value={borderColor} onChange={setBorderColor} showText />
                  </Space>
                </Col>
                <Col span={12}>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text>{t.activeBorderColor}</Text>
                    <ColorPicker value={activeBorderColor} onChange={setActiveBorderColor} showText />
                  </Space>
                </Col>
                <Col span={12}>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text>{t.contentBg}</Text>
                    <ColorPicker value={contentBg} onChange={setContentBg} showText />
                  </Space>
                </Col>
              </Row>
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
                padding: 32,
                background: '#fafafa',
                minHeight: 240,
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
            label: `${t.sourceCol} — buildTabsCss / buildTabsHtml`,
            children: (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Paragraph type="secondary">{t.sourceBody}</Paragraph>
                <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 420 }}>
                  <code>{buildTabsCss.toString()}</code>
                </pre>
              </Space>
            ),
          },
        ]}
      />
    </Space>
  )
}
