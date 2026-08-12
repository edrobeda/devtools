import React, { useMemo, useState } from 'react'
import {
  Typography, Card, Space, Slider, Segmented, Alert, Button, Collapse,
  message, ColorPicker, Row, Col, Input, Switch, InputNumber,
} from 'antd'
import { BgColorsOutlined, CopyOutlined, PartitionOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  buildBreadcrumbsCss,
  buildBreadcrumbsHtml,
  buildBreadcrumbsFullDemo,
  getSeparatorChar,
  BREADCRUMBS_PRESETS,
} from '../utils/cssBreadcrumbsGenerator'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input

const SEPARATOR_OPTIONS = {
  pt: [
    { label: 'Barra /', value: 'slash' },
    { label: 'Seta >', value: 'arrow' },
    { label: 'Chevron ›', value: 'chevron' },
    { label: 'Pipe |', value: 'pipe' },
    { label: 'Bolinha •', value: 'bullet' },
    { label: '»', value: 'gt' },
    { label: '//', value: 'double-slash' },
    { label: 'Til ~', value: 'tilde' },
    { label: '→', value: 'arrowhead' },
  ],
  en: [
    { label: 'Slash /', value: 'slash' },
    { label: 'Arrow >', value: 'arrow' },
    { label: 'Chevron ›', value: 'chevron' },
    { label: 'Pipe |', value: 'pipe' },
    { label: 'Bullet •', value: 'bullet' },
    { label: '»', value: 'gt' },
    { label: '//', value: 'double-slash' },
    { label: 'Tilde ~', value: 'tilde' },
    { label: 'Arrow →', value: 'arrowhead' },
  ],
}

const DEFAULT_ITEMS = {
  pt: ['Início', 'Categorias', 'Eletrônicos', 'Notebooks'],
  en: ['Home', 'Categories', 'Electronics', 'Laptops'],
}

const translations = {
  pt: {
    title: 'Gerador de Breadcrumbs CSS',
    intro: (
      <>
        Monte breadcrumbs acessíveis usando só CSS. Escolha o separador, as
        cores, o espaçamento e o comportamento de hover; o preview usa o
        CSS exato que será copiado, então você vê o resultado final em tempo
        real.
      </>
    ),
    tipTitle: 'Como usar (e as pegadinhas)',
    tipBody: (
      <>
        O HTML gerado envolve os itens numa <Text code>{'<ol>'}</Text> com{' '}
        <Text code>{'aria-label="breadcrumb"'}</Text> e o último elemento usa{' '}
        <Text code>{'aria-current="page"'}</Text>. Os separadores são inseridos
        via pseudo-elemento <Text code>::after</Text>, então não precisam estar
        no markup.         Use <Text code>margin-inline-start</Text> no separador para
        que a direção <Text code>rtl</Text> funcione sem regras extras; se
        precisar de suporte a navegadores muito antigos, troque por{' '}
        <Text code>margin-left</Text>.
      </>
    ),
    settings: 'Configurações',
    items: 'Itens do breadcrumb (um por linha)',
    separator: 'Separador',
    direction: 'Direção',
    directionLtr: 'Esquerda → Direita',
    directionRtl: 'Direita → Esquerda',
    fontSize: 'Tamanho da fonte',
    gap: 'Espaço entre itens',
    paddingX: 'Padding horizontal',
    paddingY: 'Padding vertical',
    borderRadius: 'Arredondamento',
    colors: 'Cores',
    textColor: 'Texto',
    activeColor: 'Texto ativo',
    separatorColor: 'Separador',
    bgColor: 'Fundo',
    hoverBgColor: 'Fundo no hover',
    activeBgColor: 'Fundo ativo',
    behavior: 'Comportamento',
    underlineOnHover: 'Sublinhar no hover',
    preview: 'Pré-visualização',
    previewHint: 'O breadcrumb abaixo usa exatamente o CSS gerado.',
    outputCss: 'CSS gerado',
    outputHtml: 'HTML de exemplo',
    outputFull: 'Bloco completo',
    copy: 'Copiar',
    copied: 'Copiado!',
    copyError: 'Não foi possível copiar',
    presets: 'Presets',
    sourceCol: 'Código-fonte',
    sourceBody:
      'O núcleo vive em src/utils/cssBreadcrumbsGenerator.js. buildBreadcrumbsCss monta a regra a partir das opções, escapa o caractere do separador para o content pseudo-elemento e usa variáveis locais de opções. buildBreadcrumbsHtml gera o markup semântico com <nav>, <ol> e aria-current no último item.',
  },
  en: {
    title: 'CSS Breadcrumbs Generator',
    intro: (
      <>
        Build accessible breadcrumbs using CSS only. Pick the separator, colors,
        spacing and hover behavior; the preview uses the exact CSS that will be
        copied, so you see the final result in real time.
      </>
    ),
    tipTitle: 'How to use (and the gotchas)',
    tipBody: (
      <>
        The generated HTML wraps items in an <Text code>{'<ol>'}</Text> with{' '}
        <Text code>{'aria-label="breadcrumb"'}</Text> and the last item uses{' '}
        <Text code>{'aria-current="page"'}</Text>. Separators are injected via
        the <Text code>::after</Text> pseudo-element, so they do not need to be
        in the markup. Use <Text code>margin-inline-start</Text> on the separator
        so <Text code>rtl</Text> direction works without extra rules; if you need
        to support very old browsers, switch to <Text code>margin-left</Text>.
      </>
    ),
    settings: 'Settings',
    items: 'Breadcrumb items (one per line)',
    separator: 'Separator',
    direction: 'Direction',
    directionLtr: 'Left → Right',
    directionRtl: 'Right → Left',
    fontSize: 'Font size',
    gap: 'Gap between items',
    paddingX: 'Horizontal padding',
    paddingY: 'Vertical padding',
    borderRadius: 'Border radius',
    colors: 'Colors',
    textColor: 'Text',
    activeColor: 'Active text',
    separatorColor: 'Separator',
    bgColor: 'Background',
    hoverBgColor: 'Hover background',
    activeBgColor: 'Active background',
    behavior: 'Behavior',
    underlineOnHover: 'Underline on hover',
    preview: 'Preview',
    previewHint: 'The breadcrumb below uses exactly the generated CSS.',
    outputCss: 'Generated CSS',
    outputHtml: 'Example HTML',
    outputFull: 'Full snippet',
    copy: 'Copy',
    copied: 'Copied!',
    copyError: 'Could not copy',
    presets: 'Presets',
    sourceCol: 'Source code',
    sourceBody:
      'The core lives in src/utils/cssBreadcrumbsGenerator.js. buildBreadcrumbsCss builds the rule from the options, escapes the separator character for the pseudo-element content and uses local option variables. buildBreadcrumbsHtml generates the semantic markup with <nav>, <ol> and aria-current on the last item.',
  },
}

const PREVIEW_CLASS = 'devtools-breadcrumbs-preview'

export default function CssBreadcrumbsGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [messageApi, messageContextHolder] = message.useMessage()

  const [itemsText, setItemsText] = useState(DEFAULT_ITEMS[lang].join('\n'))
  const [separator, setSeparator] = useState('slash')
  const [direction, setDirection] = useState('ltr')
  const [fontSize, setFontSize] = useState(14)
  const [gap, setGap] = useState(8)
  const [paddingX, setPaddingX] = useState(10)
  const [paddingY, setPaddingY] = useState(6)
  const [borderRadius, setBorderRadius] = useState(6)
  const [color, setColor] = useState('#595959')
  const [activeColor, setActiveColor] = useState('#1677ff')
  const [separatorColor, setSeparatorColor] = useState('#bfbfbf')
  const [bgColor, setBgColor] = useState('transparent')
  const [hoverBgColor, setHoverBgColor] = useState('#f0f5ff')
  const [activeBgColor, setActiveBgColor] = useState('#e6f4ff')
  const [underlineOnHover, setUnderlineOnHover] = useState(false)

  const items = useMemo(
    () => itemsText.split('\n').map((s) => s.trim()).filter(Boolean),
    [itemsText]
  )

  const options = useMemo(
    () => ({
      className: PREVIEW_CLASS,
      separator,
      direction,
      fontSize,
      gap,
      paddingX,
      paddingY,
      borderRadius,
      color,
      activeColor,
      separatorColor,
      bgColor,
      hoverBgColor,
      activeBgColor,
      underlineOnHover,
    }),
    [
      separator, direction, fontSize, gap, paddingX, paddingY, borderRadius,
      color, activeColor, separatorColor, bgColor, hoverBgColor, activeBgColor,
      underlineOnHover,
    ]
  )

  const css = useMemo(() => buildBreadcrumbsCss(options), [options])
  const html = useMemo(() => buildBreadcrumbsHtml(items), [items])
  const fullDemo = useMemo(() => buildBreadcrumbsFullDemo(options, items), [options, items])

  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      messageApi.success(t.copied)
    } catch {
      messageApi.error(t.copyError)
    }
  }

  const applyPreset = (key) => {
    const preset = BREADCRUMBS_PRESETS.find((p) => p.key === key)
    if (!preset) return
    const o = preset.opts
    if (o.separator !== undefined) setSeparator(o.separator)
    if (o.color !== undefined) setColor(o.color)
    if (o.activeColor !== undefined) setActiveColor(o.activeColor)
    if (o.separatorColor !== undefined) setSeparatorColor(o.separatorColor)
    if (o.bgColor !== undefined) setBgColor(o.bgColor)
    if (o.hoverBgColor !== undefined) setHoverBgColor(o.hoverBgColor)
    if (o.activeBgColor !== undefined) setActiveBgColor(o.activeBgColor)
    if (o.borderRadius !== undefined) setBorderRadius(o.borderRadius)
    if (o.paddingX !== undefined) setPaddingX(o.paddingX)
    if (o.paddingY !== undefined) setPaddingY(o.paddingY)
    if (o.fontSize !== undefined) setFontSize(o.fontSize)
    if (o.gap !== undefined) setGap(o.gap)
    if (o.underlineOnHover !== undefined) setUnderlineOnHover(o.underlineOnHover)
  }

  const renderPreviewItems = () => {
    const lastIndex = items.length - 1
    return items.length === 0 ? (
      <li aria-current="page" className={`${PREVIEW_CLASS}-current`}>Home</li>
    ) : (
      items.map((label, idx) => {
        const key = `${label}-${idx}`
        if (idx === lastIndex) {
          return (
            <li key={key} aria-current="page" className={`${PREVIEW_CLASS}-current`}>
              {label}
            </li>
          )
        }
        return (
          <li key={key}>
            <a href="#" onClick={(e) => e.preventDefault()}>{label}</a>
          </li>
        )
      })
    )
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {messageContextHolder}
      <Title level={2}><PartitionOutlined /> {t.title}</Title>
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
                options={BREADCRUMBS_PRESETS.map((p) => ({
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
                <Text>{t.separator}</Text>
                <Segmented
                  style={{ width: '100%' }}
                  block
                  value={separator}
                  onChange={setSeparator}
                  options={SEPARATOR_OPTIONS[lang]}
                />
              </Space>

              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.direction}</Text>
                <Segmented
                  style={{ width: '100%' }}
                  block
                  value={direction}
                  onChange={setDirection}
                  options={[
                    { label: t.directionLtr, value: 'ltr' },
                    { label: t.directionRtl, value: 'rtl' },
                  ]}
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
                    <InputNumber min={0} max={40} value={paddingX} onChange={setPaddingX} style={{ width: '100%' }} />
                  </Space>
                </Col>
                <Col span={12}>
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Text>{t.paddingY}</Text>
                    <InputNumber min={0} max={40} value={paddingY} onChange={setPaddingY} style={{ width: '100%' }} />
                  </Space>
                </Col>
              </Row>

              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.borderRadius}</Text>
                <Slider min={0} max={40} value={borderRadius} onChange={setBorderRadius} />
              </Space>

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
                    <Text>{t.separatorColor}</Text>
                    <ColorPicker value={separatorColor} onChange={setSeparatorColor} showText />
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
              </Row>

              <Space style={{ width: '100%', justifyContent: 'space-between', marginTop: 8 }}>
                <Text>{t.underlineOnHover}</Text>
                <Switch checked={underlineOnHover} onChange={setUnderlineOnHover} />
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
                padding: 32,
                background: '#fafafa',
                minHeight: 160,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
              }}
            >
              <nav aria-label="breadcrumb">
                <ol className={PREVIEW_CLASS}>
                  {renderPreviewItems()}
                </ol>
              </nav>
            </div>
            <Paragraph type="secondary" style={{ marginTop: 12, marginBottom: 0 }}>
              {t.previewHint}
            </Paragraph>
          </Card>
        </Col>
      </Row>

      <Card
        title={t.outputCss}
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

      <Card
        title={t.outputHtml}
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

      <Card
        title={t.outputFull}
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

      <Collapse
        items={[
          {
            key: 'source',
            label: `${t.sourceCol} — buildBreadcrumbsCss / buildBreadcrumbsHtml`,
            children: (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Paragraph type="secondary">{t.sourceBody}</Paragraph>
                <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 420 }}>
                  <code>{buildBreadcrumbsCss.toString()}</code>
                </pre>
              </Space>
            ),
          },
        ]}
      />
    </Space>
  )
}
