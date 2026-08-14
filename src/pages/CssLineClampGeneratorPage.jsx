import React, { useMemo, useState } from 'react'
import {
  Typography, Card, Space, Slider, Segmented, Alert, Button, Collapse,
  message, ColorPicker, Row, Col, Input, Switch, Tabs, InputNumber,
} from 'antd'
import { FontSizeOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  buildLineClampCss,
  buildLineClampHtml,
  buildLineClampFullDemo,
  buildPreviewStyle,
  buildFadeOverlayStyle,
  PRESETS,
  DEFAULTS,
} from '../utils/cssLineClampGenerator'

const { Title, Paragraph, Text } = Typography
const { useMessage } = message

const MODE_OPTIONS = {
  pt: [
    { label: 'Múltiplas linhas', value: 'multi-line' },
    { label: 'Linha única', value: 'single-line' },
  ],
  en: [
    { label: 'Multiple lines', value: 'multi-line' },
    { label: 'Single line', value: 'single-line' },
  ],
}

const ALIGN_OPTIONS = {
  pt: [
    { label: 'Esquerda', value: 'left' },
    { label: 'Centro', value: 'center' },
    { label: 'Direita', value: 'right' },
    { label: 'Justificado', value: 'justify' },
  ],
  en: [
    { label: 'Left', value: 'left' },
    { label: 'Center', value: 'center' },
    { label: 'Right', value: 'right' },
    { label: 'Justify', value: 'justify' },
  ],
}

const WIDTH_UNIT_OPTIONS = [
  { label: 'px', value: 'px' },
  { label: '%', value: '%' },
  { label: 'rem', value: 'rem' },
  { label: 'ch', value: 'ch' },
]

const PRESET_ORDER = ['default', 'single-line', 'card', 'paragraph', 'fade-out']

const translations = {
  pt: {
    title: 'Gerador de Line Clamp / Truncamento de Texto CSS',
    intro: (
      <>
        Gere CSS para truncar texto com reticências de forma elegante. Suporte
        para <Text code>text-overflow: ellipsis</Text> em linha única e{' '}
        <Text code>-webkit-line-clamp</Text> em múltiplas linhas, com fade-out
        opcional por gradiente. O preview usa exatamente o CSS gerado.
      </>
    ),
    tipTitle: 'Compatibilidade e dicas',
    tipBody: (
      <>
        <Text code>-webkit-line-clamp</Text> funciona em todos os navegadores
        modernos, apesar do prefixo. Para truncamento em linha única, a
        combinação <Text code>white-space: nowrap</Text>,{' '}
        <Text code>overflow: hidden</Text> e{' '}
        <Text code>text-overflow: ellipsis</Text> é universal. O fade-out é
        implementado com um pseudo-elemento <Text code>::after</Text> e
        gradiente — útil quando você quer uma transição suave em vez de
        reticências. O elemento precisa de largura máxima definida para que o
        truncamento aconteça.
      </>
    ),
    settings: 'Configurações',
    presets: 'Código gerado',
    text: 'Texto de exemplo',
    mode: 'Modo de truncamento',
    lines: 'Número de linhas',
    lineHeight: 'Altura da linha',
    maxWidth: 'Largura máxima',
    widthUnit: 'Unidade',
    fontSize: 'Tamanho da fonte (px)',
    textAlign: 'Alinhamento',
    color: 'Cor do texto',
    backgroundColor: 'Cor de fundo do preview',
    useFadeOut: 'Fade-out no final (gradiente)',
    className: 'Nome da classe CSS',
    preview: 'Pré-visualização',
    previewHint: 'O texto abaixo usa exatamente o CSS gerado. Ajuste os controles e veja o truncamento em tempo real.',
    outputCss: 'CSS gerado',
    outputHtml: 'HTML de exemplo',
    outputFull: 'Bloco completo',
    copy: 'Copiar',
    copied: 'Copiado!',
    copyError: 'Não foi possível copiar',
    sourceCol: 'Código-fonte',
    sourceBody:
      'O núcleo vive em src/utils/cssLineClampGenerator.js. buildLineClampCss monta as regras de .line-clamp para os modos single-line e multi-line, incluindo o pseudo-elemento ::after quando o fade-out está ativado; buildLineClampHtml gera o markup semântico e buildPreviewStyle retorna o objeto de estilo inline usado no preview ao vivo.',
  },
  en: {
    title: 'CSS Line Clamp / Text Truncation Generator',
    intro: (
      <>
        Generate CSS to truncate text with ellipsis elegantly. Supports{' '}
        <Text code>text-overflow: ellipsis</Text> for single-line and{' '}
        <Text code>-webkit-line-clamp</Text> for multiple lines, with an
        optional gradient fade-out. The preview uses the exact generated CSS.
      </>
    ),
    tipTitle: 'Compatibility and tips',
    tipBody: (
      <>
        <Text code>-webkit-line-clamp</Text> works in all modern browsers
        despite the prefix. For single-line truncation, the combination of{' '}
        <Text code>white-space: nowrap</Text>,{' '}
        <Text code>overflow: hidden</Text> and{' '}
        <Text code>text-overflow: ellipsis</Text> is universal. The fade-out
        is implemented with an <Text code>::after</Text> pseudo-element and a
        gradient — useful when you want a smooth transition instead of
        ellipsis. The element needs a defined max-width for truncation to occur.
      </>
    ),
    settings: 'Settings',
    presets: 'Generated code',
    text: 'Sample text',
    mode: 'Truncation mode',
    lines: 'Number of lines',
    lineHeight: 'Line height',
    maxWidth: 'Max width',
    widthUnit: 'Unit',
    fontSize: 'Font size (px)',
    textAlign: 'Text align',
    color: 'Text color',
    backgroundColor: 'Preview background color',
    useFadeOut: 'Fade-out at the end (gradient)',
    className: 'CSS class name',
    preview: 'Preview',
    previewHint: 'The text below uses the exact generated CSS. Adjust the controls and watch the truncation update in real time.',
    outputCss: 'Generated CSS',
    outputHtml: 'Example HTML',
    outputFull: 'Full block',
    copy: 'Copy',
    copied: 'Copied!',
    copyError: 'Could not copy',
    sourceCol: 'Source code',
    sourceBody:
      'The core lives in src/utils/cssLineClampGenerator.js. buildLineClampCss builds the .line-clamp rules for both single-line and multi-line modes, including the ::after pseudo-element when fade-out is enabled; buildLineClampHtml generates the semantic markup and buildPreviewStyle returns the inline style object used by the live preview.',
  },
}

export default function CssLineClampGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [messageApi, messageContextHolder] = useMessage()

  const [text, setText] = useState(DEFAULTS.text)
  const [mode, setMode] = useState(DEFAULTS.mode)
  const [lines, setLines] = useState(DEFAULTS.lines)
  const [lineHeight, setLineHeight] = useState(DEFAULTS.lineHeight)
  const [maxWidth, setMaxWidth] = useState(DEFAULTS.maxWidth)
  const [widthUnit, setWidthUnit] = useState(DEFAULTS.widthUnit)
  const [fontSize, setFontSize] = useState(DEFAULTS.fontSize)
  const [textAlign, setTextAlign] = useState(DEFAULTS.textAlign)
  const [color, setColor] = useState(DEFAULTS.color)
  const [backgroundColor, setBackgroundColor] = useState(DEFAULTS.backgroundColor)
  const [useFadeOut, setUseFadeOut] = useState(DEFAULTS.useFadeOut)
  const [className, setClassName] = useState(DEFAULTS.className)

  const applyPreset = (key) => {
    const p = PRESETS[key]
    if (!p) return
    setText(p.text)
    setMode(p.mode)
    setLines(p.lines)
    setLineHeight(p.lineHeight)
    setMaxWidth(p.maxWidth)
    setWidthUnit(p.widthUnit)
    setFontSize(p.fontSize)
    setTextAlign(p.textAlign)
    setColor(p.color)
    setBackgroundColor(p.backgroundColor)
    setUseFadeOut(p.useFadeOut)
  }

  const settings = useMemo(
    () => ({
      text,
      mode,
      lines,
      lineHeight,
      maxWidth,
      widthUnit,
      fontSize,
      textAlign,
      color,
      backgroundColor,
      useFadeOut,
      className,
    }),
    [
      text,
      mode,
      lines,
      lineHeight,
      maxWidth,
      widthUnit,
      fontSize,
      textAlign,
      color,
      backgroundColor,
      useFadeOut,
      className,
    ]
  )

  const cssOutput = useMemo(() => buildLineClampCss(settings), [settings])
  const htmlOutput = useMemo(() => buildLineClampHtml(settings), [settings])
  const fullOutput = useMemo(() => buildLineClampFullDemo(settings), [settings])
  const previewStyle = useMemo(() => buildPreviewStyle(settings), [settings])
  const fadeOverlayStyle = useMemo(() => buildFadeOverlayStyle(settings), [settings])

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
      <Title level={2}><FontSizeOutlined /> {t.title}</Title>
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
                  label: key.charAt(0).toUpperCase() + key.slice(1).replace(/-/g, ' '),
                }))}
              />

              <Space direction="vertical" size={4} style={{ width: '100%', marginTop: 8 }}>
                <Text>{t.text}</Text>
                <Input.TextArea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={4}
                  placeholder={t.text}
                />
              </Space>

              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.mode}</Text>
                <Segmented
                  style={{ width: '100%' }}
                  block
                  value={mode}
                  onChange={setMode}
                  options={MODE_OPTIONS[lang]}
                />
              </Space>

              {mode === 'multi-line' && (
                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                  <Text>{t.lines}</Text>
                  <Slider min={1} max={10} step={1} value={lines} onChange={setLines} />
                </Space>
              )}

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.lineHeight}</Text>
                <Text code>{lineHeight.toFixed(1)}</Text>
              </Space>
              <Slider min={0.8} max={2.5} step={0.05} value={lineHeight} onChange={setLineHeight} />

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.fontSize}</Text>
                <Text code>{fontSize}px</Text>
              </Space>
              <Slider min={10} max={48} step={1} value={fontSize} onChange={setFontSize} />

              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.maxWidth}</Text>
                <Space.Compact style={{ width: '100%' }}>
                  <InputNumber
                    style={{ width: '100%' }}
                    min={1}
                    max={widthUnit === '%' ? 100 : 1200}
                    value={maxWidth}
                    onChange={(v) => setMaxWidth(v || 1)}
                  />
                  <Segmented
                    value={widthUnit}
                    onChange={setWidthUnit}
                    options={WIDTH_UNIT_OPTIONS}
                  />
                </Space.Compact>
              </Space>

              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.textAlign}</Text>
                <Segmented
                  style={{ width: '100%' }}
                  block
                  value={textAlign}
                  onChange={setTextAlign}
                  options={ALIGN_OPTIONS[lang]}
                />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>{t.color}</Text>
                <ColorPicker value={color} onChange={setColor} showText />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>{t.backgroundColor}</Text>
                <ColorPicker value={backgroundColor} onChange={setBackgroundColor} showText />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>{t.useFadeOut}</Text>
                <Switch size="small" checked={useFadeOut} onChange={setUseFadeOut} />
              </Space>

              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.className}</Text>
                <Input value={className} onChange={(e) => setClassName(e.target.value)} />
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
                padding: 32,
                background: backgroundColor,
                display: 'flex',
                justifyContent: 'center',
                minHeight: 220,
              }}
            >
              <div style={{ position: 'relative' }}>
                <div style={previewStyle}>
                  {text || DEFAULTS.text}
                </div>
                {useFadeOut && <div style={fadeOverlayStyle} aria-hidden="true" />}
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
            label: `${t.sourceCol} — buildLineClampCss / buildLineClampHtml`,
            children: (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Paragraph type="secondary">{t.sourceBody}</Paragraph>
                <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 320 }}>
                  <code>{buildLineClampCss.toString()}</code>
                </pre>
              </Space>
            ),
          },
        ]}
      />
    </Space>
  )
}
