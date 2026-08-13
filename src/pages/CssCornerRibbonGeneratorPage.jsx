import React, { useMemo, useState } from 'react'
import {
  Typography, Card, Space, Slider, Segmented, Alert, Button, Collapse,
  message, ColorPicker, Row, Col, Input, Switch, Tabs, InputNumber,
} from 'antd'
import { BgColorsOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  buildRibbonCss,
  buildRibbonHtml,
  buildRibbonFullDemo,
  PRESETS,
  DEFAULTS,
  POSITIONS,
} from '../utils/cssCornerRibbonGenerator'

const { Title, Paragraph, Text } = Typography
const { useMessage } = message

const POSITION_OPTIONS = {
  pt: [
    { label: 'Superior esquerdo', value: 'top-left' },
    { label: 'Superior direito', value: 'top-right' },
    { label: 'Inferior esquerdo', value: 'bottom-left' },
    { label: 'Inferior direito', value: 'bottom-right' },
  ],
  en: [
    { label: 'Top left', value: 'top-left' },
    { label: 'Top right', value: 'top-right' },
    { label: 'Bottom left', value: 'bottom-left' },
    { label: 'Bottom right', value: 'bottom-right' },
  ],
}

const PRESET_ORDER = ['default', 'sale', 'new', 'beta', 'hot', 'dark', 'minimal']

const translations = {
  pt: {
    heading: 'Gerador de Corner Ribbon CSS',
    intro: (
      <>
        Crie faixas diagonais (ribbons) para cantos de cards, boxes ou páginas
        usando só CSS. Perfeitas para selos "New", "Beta", "Sale" e "Pro".
        O preview injeta exatamente o CSS gerado, então você vê o resultado
        final em tempo real.
      </>
    ),
    tipTitle: 'Como funciona (e as pegadinhas)',
    tipBody: (
      <>
        O ribbon é um elemento <Text code>{'<div>'}</Text> posicionado com{' '}
        <Text code>position: absolute</Text> num canto do container. O truque
        está em centralizar o ribbon no canto usando{' '}
        <Text code>transform: translate(-50%, -50%) rotate(-45deg)</Text> (ou
        variações para os outros cantos). O pai precisa de{' '}
        <Text code>position: relative</Text> e, geralmente,{' '}
        <Text code>overflow: hidden</Text> para cortar as sobras. Ajuste a
        largura para evitar que o texto fique cortado em telas pequenas.
      </>
    ),
    settings: 'Configurações',
    presets: 'Presets',
    position: 'Posição',
    text: 'Texto do ribbon',
    bgColor: 'Cor de fundo',
    textColor: 'Cor do texto',
    autoTextColor: 'Automática',
    width: 'Largura (px)',
    height: 'Altura (px)',
    fontSize: 'Tamanho da fonte (px)',
    fontWeight: 'Peso da fonte',
    letterSpacing: 'Espaçamento entre letras (px)',
    shadow: 'Box-shadow',
    zIndex: 'z-index',
    fold: 'Efeito de dobra/relevo',
    container: 'Container de preview',
    containerWidth: 'Largura do container (px)',
    containerHeight: 'Altura do container (px)',
    containerRadius: 'Border-radius do container (px)',
    containerBg: 'Fundo do container',
    className: 'Nome da classe CSS',
    preview: 'Pré-visualização',
    previewHint: 'O card abaixo usa exatamente o CSS gerado. O ribbon é real.',
    outputCss: 'CSS gerado',
    outputHtml: 'HTML de exemplo',
    outputFull: 'Bloco completo',
    copy: 'Copiar',
    copied: 'Copiado!',
    copyError: 'Não foi possível copiar',
    sourceCol: 'Código-fonte',
    sourceBody:
      'O núcleo vive em src/utils/cssCornerRibbonGenerator.js. buildRibbonCss monta as regras do container e do ribbon para cada uma das quatro posições; buildRibbonHtml gera o markup semântico; buildRibbonFullDemo junta CSS + HTML num arquivo pronto.',
  },
  en: {
    heading: 'CSS Corner Ribbon Generator',
    intro: (
      <>
        Build diagonal corner ribbons for cards, boxes or pages using only CSS.
        Perfect for "New", "Beta", "Sale" and "Pro" badges. The preview injects
        the exact generated CSS, so you see the final result in real time.
      </>
    ),
    tipTitle: 'How it works (and the gotchas)',
    tipBody: (
      <>
        The ribbon is a <Text code>{'<div>'}</Text> absolutely positioned in a
        corner of its container. The trick is to center the ribbon on the
        corner using{' '}
        <Text code>transform: translate(-50%, -50%) rotate(-45deg)</Text> (or
        variations for the other corners). The parent needs{' '}
        <Text code>position: relative</Text> and usually{' '}
        <Text code>overflow: hidden</Text> to clip the overflow. Adjust the
        width to keep the text from getting cut on small screens.
      </>
    ),
    settings: 'Settings',
    presets: 'Presets',
    position: 'Position',
    text: 'Ribbon text',
    bgColor: 'Background color',
    textColor: 'Text color',
    autoTextColor: 'Auto',
    width: 'Width (px)',
    height: 'Height (px)',
    fontSize: 'Font size (px)',
    fontWeight: 'Font weight',
    letterSpacing: 'Letter spacing (px)',
    shadow: 'Box-shadow',
    zIndex: 'z-index',
    fold: 'Fold / relief effect',
    container: 'Preview container',
    containerWidth: 'Container width (px)',
    containerHeight: 'Container height (px)',
    containerRadius: 'Container border-radius (px)',
    containerBg: 'Container background',
    className: 'CSS class name',
    preview: 'Preview',
    previewHint: 'The card below uses the exact generated CSS. The ribbon is real.',
    outputCss: 'Generated CSS',
    outputHtml: 'Example HTML',
    outputFull: 'Full block',
    copy: 'Copy',
    copied: 'Copied!',
    copyError: 'Could not copy',
    sourceCol: 'Source code',
    sourceBody:
      'The core lives in src/utils/cssCornerRibbonGenerator.js. buildRibbonCss builds the container and ribbon rules for each of the four positions; buildRibbonHtml generates the semantic markup; buildRibbonFullDemo combines CSS + HTML into a ready-to-use file.',
  },
}

export default function CssCornerRibbonGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [messageApi, messageContextHolder] = useMessage()

  const [position, setPosition] = useState(DEFAULTS.position)
  const [text, setText] = useState(DEFAULTS.text)
  const [bgColor, setBgColor] = useState(DEFAULTS.bgColor)
  const [textColor, setTextColor] = useState(DEFAULTS.textColor)
  const [autoTextColorEnabled, setAutoTextColorEnabled] = useState(false)
  const [width, setWidth] = useState(DEFAULTS.width)
  const [height, setHeight] = useState(DEFAULTS.height)
  const [fontSize, setFontSize] = useState(DEFAULTS.fontSize)
  const [fontWeight, setFontWeight] = useState(DEFAULTS.fontWeight)
  const [letterSpacing, setLetterSpacing] = useState(DEFAULTS.letterSpacing)
  const [shadow, setShadow] = useState(DEFAULTS.shadow)
  const [zIndex, setZIndex] = useState(DEFAULTS.zIndex)
  const [fold, setFold] = useState(DEFAULTS.fold)
  const [containerWidth, setContainerWidth] = useState(DEFAULTS.containerWidth)
  const [containerHeight, setContainerHeight] = useState(DEFAULTS.containerHeight)
  const [containerRadius, setContainerRadius] = useState(DEFAULTS.containerRadius)
  const [containerBg, setContainerBg] = useState(DEFAULTS.containerBg)
  const [className, setClassName] = useState(DEFAULTS.className)

  const options = useMemo(() => ({
    position,
    text,
    bgColor,
    textColor: autoTextColorEnabled ? undefined : textColor,
    width,
    height,
    fontSize,
    fontWeight,
    letterSpacing,
    shadow,
    zIndex,
    fold,
    containerWidth,
    containerHeight,
    containerRadius,
    containerBg,
    className,
  }), [
    position, text, bgColor, textColor, autoTextColorEnabled,
    width, height, fontSize, fontWeight, letterSpacing,
    shadow, zIndex, fold,
    containerWidth, containerHeight, containerRadius, containerBg, className,
  ])

  const css = useMemo(() => buildRibbonCss(options), [options])
  const html = useMemo(() => buildRibbonHtml(options), [options])
  const full = useMemo(() => buildRibbonFullDemo(options), [options])

  const applyPreset = (key) => {
    const p = PRESETS[key]
    if (!p) return
    setPosition(p.position)
    setText(p.text)
    setBgColor(p.bgColor)
    setTextColor(p.textColor)
    setAutoTextColorEnabled(false)
    setWidth(p.width)
    setHeight(p.height)
    setFontSize(p.fontSize)
    setFontWeight(p.fontWeight)
    setLetterSpacing(p.letterSpacing)
    setShadow(p.shadow)
    setZIndex(p.zIndex)
    setFold(p.fold)
    setContainerBg(p.containerBg)
  }

  const copyToClipboard = async (value) => {
    try {
      await navigator.clipboard.writeText(value)
      messageApi.success(t.copied)
    } catch {
      messageApi.error(t.copyError)
    }
  }

  const positionOptions = POSITION_OPTIONS[lang]

  return (
    <div style={{ paddingBottom: 40 }}>
      {messageContextHolder}
      <Title level={2}>
        <BgColorsOutlined style={{ marginRight: 12 }} />
        {t.heading}
      </Title>
      <Paragraph>{t.intro}</Paragraph>

      <Alert
        message={t.tipTitle}
        description={t.tipBody}
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={10}>
          <Card title={t.presets} size="small" style={{ marginBottom: 24 }}>
            <Space wrap>
              {PRESET_ORDER.map((key) => (
                <Button key={key} onClick={() => applyPreset(key)}>
                  {PRESETS[key].text}
                </Button>
              ))}
            </Space>
          </Card>

          <Card title={t.settings} size="small">
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <div>
                <Text strong>{t.position}</Text>
                <Segmented
                  options={positionOptions}
                  value={position}
                  onChange={(v) => setPosition(v)}
                  block
                />
              </div>

              <div>
                <Text strong>{t.text}</Text>
                <Input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  maxLength={30}
                  showCount
                />
              </div>

              <Row gutter={16}>
                <Col span={12}>
                  <div>
                    <Text strong>{t.bgColor}</Text>
                    <div>
                      <ColorPicker
                        value={bgColor}
                        onChange={(c) => setBgColor(c.toHexString())}
                        showText
                      />
                    </div>
                  </div>
                </Col>
                <Col span={12}>
                  <div>
                    <Text strong>{t.textColor}</Text>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <ColorPicker
                        value={textColor}
                        onChange={(c) => {
                          setTextColor(c.toHexString())
                          setAutoTextColorEnabled(false)
                        }}
                        showText
                        disabled={autoTextColorEnabled}
                      />
                      <Switch
                        checked={autoTextColorEnabled}
                        onChange={setAutoTextColorEnabled}
                        checkedChildren={t.autoTextColor}
                        unCheckedChildren={t.autoTextColor}
                      />
                    </div>
                  </div>
                </Col>
              </Row>

              <div>
                <Text strong>{t.width}</Text>
                <Slider min={60} max={400} value={width} onChange={setWidth} />
              </div>

              <div>
                <Text strong>{t.height}</Text>
                <Slider min={16} max={120} value={height} onChange={setHeight} />
              </div>

              <div>
                <Text strong>{t.fontSize}</Text>
                <Slider min={8} max={32} value={fontSize} onChange={setFontSize} />
              </div>

              <div>
                <Text strong>{t.fontWeight}</Text>
                <Slider min={100} max={900} step={100} value={fontWeight} onChange={setFontWeight} />
              </div>

              <div>
                <Text strong>{t.letterSpacing}</Text>
                <Slider min={0} max={8} value={letterSpacing} onChange={setLetterSpacing} />
              </div>

              <div>
                <Text strong>{t.shadow}</Text>
                <Input
                  value={shadow}
                  onChange={(e) => setShadow(e.target.value)}
                />
              </div>

              <Row gutter={16}>
                <Col span={12}>
                  <div>
                    <Text strong>{t.zIndex}</Text>
                    <InputNumber
                      min={0}
                      max={9999}
                      value={zIndex}
                      onChange={(v) => setZIndex(v ?? 10)}
                      style={{ width: '100%' }}
                    />
                  </div>
                </Col>
                <Col span={12}>
                  <div>
                    <Text strong>{t.fold}</Text>
                    <div>
                      <Switch checked={fold} onChange={setFold} />
                    </div>
                  </div>
                </Col>
              </Row>

              <div>
                <Text strong>{t.className}</Text>
                <Input
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                />
              </div>

              <Card type="inner" title={t.container} size="small">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Text strong>{t.containerWidth}</Text>
                      <InputNumber
                        min={120}
                        max={800}
                        value={containerWidth}
                        onChange={(v) => setContainerWidth(v ?? 280)}
                        style={{ width: '100%' }}
                      />
                    </Col>
                    <Col span={12}>
                      <Text strong>{t.containerHeight}</Text>
                      <InputNumber
                        min={80}
                        max={600}
                        value={containerHeight}
                        onChange={(v) => setContainerHeight(v ?? 180)}
                        style={{ width: '100%' }}
                      />
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Text strong>{t.containerRadius}</Text>
                      <InputNumber
                        min={0}
                        max={64}
                        value={containerRadius}
                        onChange={(v) => setContainerRadius(v ?? 12)}
                        style={{ width: '100%' }}
                      />
                    </Col>
                    <Col span={12}>
                      <Text strong>{t.containerBg}</Text>
                      <div>
                        <ColorPicker
                          value={containerBg}
                          onChange={(c) => setContainerBg(c.toHexString())}
                          showText
                        />
                      </div>
                    </Col>
                  </Row>
                </Space>
              </Card>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={14}>
          <Card title={t.preview} style={{ marginBottom: 24 }}>
            <Paragraph type="secondary">{t.previewHint}</Paragraph>
            <div style={{ display: 'flex', justifyContent: 'center', padding: 24, background: 'rgba(0,0,0,0.02)', borderRadius: 8 }}>
              <style>{css}</style>
              <div className="ribbon-box">
                <div className="ribbon">{text}</div>
                <div style={{ padding: 24, paddingTop: 48, textAlign: 'center' }}>
                  <Text type="secondary">Your content here</Text>
                </div>
              </div>
            </div>
          </Card>

          <Card
            title={t.outputCss}
            extra={
              <Button icon={<CopyOutlined />} onClick={() => copyToClipboard(css)}>
                {t.copy}
              </Button>
            }
            style={{ marginBottom: 24 }}
          >
            <Tabs
              defaultActiveKey="css"
              items={[
                {
                  key: 'css',
                  label: t.outputCss,
                  children: (
                    <pre style={{ overflow: 'auto', maxHeight: 360, background: '#f6f8fa', padding: 16, borderRadius: 8 }}>
                      <code>{css}</code>
                    </pre>
                  ),
                },
                {
                  key: 'html',
                  label: t.outputHtml,
                  children: (
                    <pre style={{ overflow: 'auto', maxHeight: 360, background: '#f6f8fa', padding: 16, borderRadius: 8 }}>
                      <code>{html}</code>
                    </pre>
                  ),
                },
                {
                  key: 'full',
                  label: t.outputFull,
                  children: (
                    <pre style={{ overflow: 'auto', maxHeight: 360, background: '#f6f8fa', padding: 16, borderRadius: 8 }}>
                      <code>{full}</code>
                    </pre>
                  ),
                },
              ]}
            />
          </Card>

          <Collapse
            items={[
              {
                key: 'source',
                label: t.sourceCol,
                children: <Paragraph>{t.sourceBody}</Paragraph>,
              },
            ]}
          />
        </Col>
      </Row>
    </div>
  )
}
