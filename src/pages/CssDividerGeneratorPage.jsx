import React, { useMemo, useState } from 'react'
import {
  Typography, Card, Space, Slider, Segmented, Alert, Button, Collapse,
  message, ColorPicker, Row, Col, Input, Tabs,
} from 'antd'
import { BgColorsOutlined, CopyOutlined, PlayCircleOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  buildDividerCss,
  buildDividerHtml,
  buildDividerFullDemo,
  ICON_SVGS,
  PRESETS,
  DEFAULTS,
} from '../utils/cssDividerGenerator'

const { Title, Paragraph, Text } = Typography
const { useMessage } = message

const TYPE_OPTIONS = {
  pt: [
    { label: 'Sólido', value: 'solid' },
    { label: 'Tracejado', value: 'dashed' },
    { label: 'Pontilhado', value: 'dotted' },
    { label: 'Duplo', value: 'double' },
    { label: 'Gradiente', value: 'gradient' },
    { label: 'Sombra', value: 'shadow' },
    { label: 'Com texto', value: 'text' },
    { label: 'Com ícone', value: 'icon' },
  ],
  en: [
    { label: 'Solid', value: 'solid' },
    { label: 'Dashed', value: 'dashed' },
    { label: 'Dotted', value: 'dotted' },
    { label: 'Double', value: 'double' },
    { label: 'Gradient', value: 'gradient' },
    { label: 'Shadow', value: 'shadow' },
    { label: 'With text', value: 'text' },
    { label: 'With icon', value: 'icon' },
  ],
}

const ORIENTATION_OPTIONS = {
  pt: [
    { label: 'Horizontal', value: 'horizontal' },
    { label: 'Vertical', value: 'vertical' },
  ],
  en: [
    { label: 'Horizontal', value: 'horizontal' },
    { label: 'Vertical', value: 'vertical' },
  ],
}

const WIDTH_UNIT_OPTIONS = {
  pt: [
    { label: '%', value: '%' },
    { label: 'px', value: 'px' },
  ],
  en: [
    { label: '%', value: '%' },
    { label: 'px', value: 'px' },
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

const ICON_OPTIONS = [
  { label: 'Star', value: 'star' },
  { label: 'Heart', value: 'heart' },
  { label: 'Diamond', value: 'diamond' },
  { label: 'Arrow', value: 'arrow' },
  { label: 'Dot', value: 'dot' },
]

const PRESET_ORDER = ['default', 'dashed', 'dotted', 'double', 'gradient', 'shadow', 'text', 'icon', 'vertical', 'minimal']

const translations = {
  pt: {
    heading: 'Gerador de Divider CSS',
    intro: (
      <>
        Crie divisores/separadores usando só CSS. Escolha entre linha sólida,
        tracejada, pontilhada, dupla, gradiente, sombra ou divisor com texto/ícone
        no centro. Suporta orientação horizontal e vertical, largura, espessura,
        cores, alinhamento e margens.
      </>
    ),
    tipTitle: 'Como funciona (e as pegadinhas)',
    tipBody: (
      <>
        Um divisor é tipicamente um <Text code>{'<div role="separator">'}</Text>.{' '}
        Os tipos <Text code>gradient</Text> e <Text code>shadow</Text> usam{' '}
        <Text code>background</Text> em vez de borda, então a espessura vira altura
        (ou largura na vertical). Os tipos <Text code>text</Text> e{' '}
        <Text code>icon</Text> usam pseudo-elementos <Text code>::before</Text> e{' '}
        <Text code>::after</Text> para criar as linhas laterais — por isso não
        funcionam bem na orientação vertical.
      </>
    ),
    settings: 'Configurações',
    presets: 'Saída gerada',
    type: 'Tipo de divisor',
    orientation: 'Orientação',
    width: 'Comprimento',
    widthUnit: 'Unidade',
    thickness: 'Espessura (px)',
    color: 'Cor principal',
    color2: 'Cor secundária',
    align: 'Alinhamento',
    marginY: 'Margem vertical (px)',
    marginX: 'Margem horizontal (px)',
    borderRadius: 'Arredondamento (px)',
    text: 'Texto central',
    icon: 'Ícone central',
    className: 'Nome da classe CSS',
    preview: 'Pré-visualização',
    previewHint: 'O divisor abaixo usa exatamente o CSS gerado.',
    replayAnimation: 'Atualizar preview',
    outputCss: 'CSS gerado',
    outputHtml: 'HTML de exemplo',
    outputFull: 'Bloco completo',
    copy: 'Copiar',
    copied: 'Copiado!',
    copyError: 'Não foi possível copiar',
    sourceCol: 'Código-fonte',
    sourceBody:
      'O núcleo vive em src/utils/cssDividerGenerator.js. buildDividerCss monta as regras de .divider conforme o tipo, orientação, largura e cores; buildDividerHtml gera o markup semântico com role="separator" e escape básico do texto.',
  },
  en: {
    heading: 'CSS Divider Generator',
    intro: (
      <>
        Build dividers/separators using only CSS. Choose from solid, dashed,
        dotted, double, gradient, shadow or a text/icon divider in the center.
        Supports horizontal and vertical orientation, width, thickness, colors,
        alignment and margins.
      </>
    ),
    tipTitle: 'How it works (and the gotchas)',
    tipBody: (
      <>
        A divider is typically a <Text code>{'<div role="separator">'}</Text>.{' '}
        The <Text code>gradient</Text> and <Text code>shadow</Text> types use{' '}
        <Text code>background</Text> instead of a border, so thickness becomes
        height (or width when vertical). The <Text code>text</Text> and{' '}
        <Text code>icon</Text> types use <Text code>::before</Text> and{' '}
        <Text code>::after</Text> pseudo-elements for the side lines — therefore
        they do not work well in vertical orientation.
      </>
    ),
    settings: 'Settings',
    presets: 'Generated output',
    type: 'Divider type',
    orientation: 'Orientation',
    width: 'Length',
    widthUnit: 'Unit',
    thickness: 'Thickness (px)',
    color: 'Primary color',
    color2: 'Secondary color',
    align: 'Alignment',
    marginY: 'Vertical margin (px)',
    marginX: 'Horizontal margin (px)',
    borderRadius: 'Border radius (px)',
    text: 'Center text',
    icon: 'Center icon',
    className: 'CSS class name',
    preview: 'Preview',
    previewHint: 'The divider below uses the exact generated CSS.',
    replayAnimation: 'Refresh preview',
    outputCss: 'Generated CSS',
    outputHtml: 'Example HTML',
    outputFull: 'Full block',
    copy: 'Copy',
    copied: 'Copied!',
    copyError: 'Could not copy',
    sourceCol: 'Source code',
    sourceBody:
      'The core lives in src/utils/cssDividerGenerator.js. buildDividerCss builds the .divider rules based on type, orientation, width and colors; buildDividerHtml generates semantic markup with role="separator" and basic text escaping.',
  },
}

export default function CssDividerGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [messageApi, messageContextHolder] = useMessage()

  const [type, setType] = useState(DEFAULTS.type)
  const [orientation, setOrientation] = useState(DEFAULTS.orientation)
  const [width, setWidth] = useState(DEFAULTS.width)
  const [widthUnit, setWidthUnit] = useState(DEFAULTS.widthUnit)
  const [thickness, setThickness] = useState(DEFAULTS.thickness)
  const [color, setColor] = useState(DEFAULTS.color)
  const [color2, setColor2] = useState(DEFAULTS.color2)
  const [align, setAlign] = useState(DEFAULTS.align)
  const [marginY, setMarginY] = useState(DEFAULTS.marginY)
  const [marginX, setMarginX] = useState(DEFAULTS.marginX)
  const [borderRadius, setBorderRadius] = useState(DEFAULTS.borderRadius)
  const [text, setText] = useState(DEFAULTS.text)
  const [icon, setIcon] = useState(DEFAULTS.icon)
  const [className, setClassName] = useState(DEFAULTS.className)
  const [previewKey, setPreviewKey] = useState(0)

  const applyPreset = (key) => {
    const p = PRESETS[key]
    if (!p) return
    setType(p.type)
    setOrientation(p.orientation)
    setWidth(p.width)
    setWidthUnit(p.widthUnit)
    setThickness(p.thickness)
    setColor(p.color)
    setColor2(p.color2)
    setAlign(p.align)
    setMarginY(p.marginY)
    setMarginX(p.marginX)
    setBorderRadius(p.borderRadius)
    setText(p.text)
    setIcon(p.icon)
    setClassName(p.className)
    setPreviewKey((k) => k + 1)
  }

  const settings = useMemo(
    () => ({
      type,
      orientation,
      width,
      widthUnit,
      thickness,
      color,
      color2,
      align,
      marginY,
      marginX,
      borderRadius,
      text,
      icon,
      className,
    }),
    [
      type,
      orientation,
      width,
      widthUnit,
      thickness,
      color,
      color2,
      align,
      marginY,
      marginX,
      borderRadius,
      text,
      icon,
      className,
    ]
  )

  const cssOutput = useMemo(() => buildDividerCss(settings), [settings])
  const htmlOutput = useMemo(() => buildDividerHtml(settings), [settings])
  const fullOutput = useMemo(() => buildDividerFullDemo(settings), [settings])

  const copy = async (value) => {
    try {
      await navigator.clipboard.writeText(value)
      messageApi.success(t.copied)
    } catch {
      messageApi.error(t.copyError)
    }
  }

  const renderPreview = () => {
    if (type === 'text') {
      return (
        <div key={previewKey} className={className} role="separator">
          <span className={`${className}__text`}>{text}</span>
        </div>
      )
    }
    if (type === 'icon') {
      const iconKey = ICON_SVGS[icon] ? icon : 'star'
      return (
        <div key={previewKey} className={className} role="separator">
          <span className={`${className}__icon`} aria-hidden="true" dangerouslySetInnerHTML={{ __html: ICON_SVGS[iconKey] }} />
        </div>
      )
    }
    return <div key={previewKey} className={className} role="separator" />
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

  const isFillType = type === 'gradient' || type === 'shadow'
  const showColor2 = type === 'gradient'
  const showText = type === 'text'
  const showIcon = type === 'icon'

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
                <Text>{t.orientation}</Text>
                <Segmented
                  style={{ width: '100%' }}
                  block
                  value={orientation}
                  onChange={setOrientation}
                  options={ORIENTATION_OPTIONS[lang]}
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

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.thickness}</Text>
                <Text code>{thickness}px</Text>
              </Space>
              <Slider min={1} max={32} value={thickness} onChange={setThickness} />

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.width}</Text>
                <Text code>{width}{widthUnit}</Text>
              </Space>
              <Slider min={1} max={widthUnit === '%' ? 100 : 800} value={width} onChange={setWidth} />

              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.widthUnit}</Text>
                <Segmented
                  style={{ width: '100%' }}
                  block
                  value={widthUnit}
                  onChange={(v) => {
                    setWidthUnit(v)
                    if (v === '%') setWidth((w) => Math.min(w, 100))
                  }}
                  options={WIDTH_UNIT_OPTIONS[lang]}
                />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.marginY}</Text>
                <Text code>{marginY}px</Text>
              </Space>
              <Slider min={0} max={120} value={marginY} onChange={setMarginY} />

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.marginX}</Text>
                <Text code>{marginX}px</Text>
              </Space>
              <Slider min={0} max={120} value={marginX} onChange={setMarginX} />

              {isFillType && (
                <>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text>{t.borderRadius}</Text>
                    <Text code>{borderRadius}px</Text>
                  </Space>
                  <Slider min={0} max={32} value={borderRadius} onChange={setBorderRadius} />
                </>
              )}

              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.color}</Text>
                <ColorPicker
                  value={color}
                  onChange={(c) => setColor(c.toHexString())}
                  showText
                />
              </Space>

              {showColor2 && (
                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                  <Text>{t.color2}</Text>
                  <ColorPicker
                    value={color2}
                    onChange={(c) => setColor2(c.toHexString())}
                    showText
                  />
                </Space>
              )}

              {showText && (
                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                  <Text>{t.text}</Text>
                  <Input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={t.text}
                  />
                </Space>
              )}

              {showIcon && (
                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                  <Text>{t.icon}</Text>
                  <Segmented
                    style={{ width: '100%' }}
                    block
                    value={icon}
                    onChange={setIcon}
                    options={ICON_OPTIONS}
                  />
                </Space>
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
                minHeight: 220,
                display: 'flex',
                flexDirection: orientation === 'horizontal' ? 'column' : 'row',
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
            label: `${t.sourceCol} — buildDividerCss / buildDividerHtml`,
            children: (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Paragraph type="secondary">{t.sourceBody}</Paragraph>
                <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 320 }}>
                  <code>{buildDividerCss.toString()}</code>
                </pre>
              </Space>
            ),
          },
        ]}
      />
    </Space>
  )
}
