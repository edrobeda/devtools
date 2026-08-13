import React, { useMemo, useState } from 'react'
import {
  Typography, Card, Space, Slider, Segmented, Alert, Button, Collapse,
  message, ColorPicker, Row, Col, InputNumber, Tabs, Switch, Input,
} from 'antd'
import { BgColorsOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  buildMarqueeCss,
  buildMarqueeHtml,
  buildMarqueeFullDemo,
  MARQUEE_PRESETS,
} from '../utils/cssMarqueeGenerator'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input

const translations = {
  pt: {
    title: 'Gerador de Marquee CSS',
    intro: (
      <>
        Crie faixas de rolagem infinita (marquees) usando só CSS e HTML
        semântico. Escolha direção horizontal/vertical, modo loop/uma vez/bounce,
        pause no hover e copie o código pronto.
      </>
    ),
    tipTitle: 'Como usar (e as pegadinhas)',
    tipBody: (
      <>
        O truque do marquee infinito é duplicar o conteúdo e animar a trilha em
        -50%, criando uma costura invisível. No modo <Text code>{'uma vez'}</Text>{' '}
        o conteúdo entra e para — se for maior que o container, a parte excedente
        ficará escondida por <Text code>{'overflow: hidden'}</Text>. Para acessibilidade,
        a segunda trilha duplicada recebe <Text code>{'aria-hidden="true"'}</Text>.
      </>
    ),
    settings: 'Configurações',
    presets: 'Presets',
    direction: 'Direção',
    directionLeft: 'Esquerda',
    directionRight: 'Direita',
    directionUp: 'Cima',
    directionDown: 'Baixo',
    mode: 'Modo',
    modeLoop: 'Loop',
    modeOnce: 'Uma vez',
    modeBounce: 'Bounce',
    duration: 'Duração (s)',
    pauseOnHover: 'Pausar no hover',
    width: 'Largura do container',
    height: 'Altura (vertical)',
    gap: 'Espaço entre itens (px)',
    paddingX: 'Padding horizontal (px)',
    paddingY: 'Padding vertical (px)',
    fontSize: 'Tamanho da fonte (px)',
    borderRadius: 'Border radius (px)',
    colors: 'Cores',
    backgroundColor: 'Fundo',
    textColor: 'Texto',
    items: 'Itens (um por linha)',
    preview: 'Pré-visualização',
    previewHint: 'O marquee abaixo usa exatamente o CSS gerado. Passe o mouse para testar o pause.',
    outputCss: 'CSS gerado',
    outputHtml: 'HTML de exemplo',
    outputFull: 'Bloco completo',
    copy: 'Copiar',
    copied: 'Copiado!',
    copyError: 'Não foi possível copiar',
    sourceCol: 'Código-fonte',
    sourceBody:
      'O núcleo vive em src/utils/cssMarqueeGenerator.js. buildMarqueeCss monta as regras do container, da trilha e dos keyframes conforme direção e modo. buildMarqueeHtml gera o markup, duplicando a trilha quando necessário.',
  },
  en: {
    title: 'CSS Marquee Generator',
    intro: (
      <>
        Create infinite scrolling tickers (marquees) using only CSS and semantic
        HTML. Choose horizontal/vertical direction, loop/once/bounce mode, hover
        pause, and copy the ready-to-use code.
      </>
    ),
    tipTitle: 'How to use (and the gotchas)',
    tipBody: (
      <>
        The infinite marquee trick is duplicating the content and animating the
        track by -50%, creating a seamless loop. In <Text code>{'once'}</Text>{' '}
        mode the content slides in and stops — if it is larger than the container,
        the overflow will be clipped by <Text code>{'overflow: hidden'}</Text>. For
        accessibility, the duplicated track receives{' '}
        <Text code>{'aria-hidden="true"'}</Text>.
      </>
    ),
    settings: 'Settings',
    presets: 'Presets',
    direction: 'Direction',
    directionLeft: 'Left',
    directionRight: 'Right',
    directionUp: 'Up',
    directionDown: 'Down',
    mode: 'Mode',
    modeLoop: 'Loop',
    modeOnce: 'Once',
    modeBounce: 'Bounce',
    duration: 'Duration (s)',
    pauseOnHover: 'Pause on hover',
    width: 'Container width',
    height: 'Height (vertical)',
    gap: 'Gap between items (px)',
    paddingX: 'Horizontal padding (px)',
    paddingY: 'Vertical padding (px)',
    fontSize: 'Font size (px)',
    borderRadius: 'Border radius (px)',
    colors: 'Colors',
    backgroundColor: 'Background',
    textColor: 'Text',
    items: 'Items (one per line)',
    preview: 'Preview',
    previewHint: 'The marquee below uses exactly the generated CSS. Hover to test pause.',
    outputCss: 'Generated CSS',
    outputHtml: 'Example HTML',
    outputFull: 'Full snippet',
    copy: 'Copy',
    copied: 'Copied!',
    copyError: 'Could not copy',
    sourceCol: 'Source code',
    sourceBody:
      'The core lives in src/utils/cssMarqueeGenerator.js. buildMarqueeCss builds the container, track and keyframe rules according to direction and mode. buildMarqueeHtml generates the markup, duplicating the track when needed.',
  },
}

const PREVIEW_CLASS = 'devtools-marquee-preview'

export default function CssMarqueeGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [messageApi, messageContextHolder] = message.useMessage()

  const [direction, setDirection] = useState('left')
  const [mode, setMode] = useState('loop')
  const [duration, setDuration] = useState(10)
  const [pauseOnHover, setPauseOnHover] = useState(true)
  const [width, setWidth] = useState('100%')
  const [height, setHeight] = useState(160)
  const [gap, setGap] = useState(24)
  const [paddingX, setPaddingX] = useState(16)
  const [paddingY, setPaddingY] = useState(12)
  const [fontSize, setFontSize] = useState(16)
  const [borderRadius, setBorderRadius] = useState(8)
  const [backgroundColor, setBackgroundColor] = useState('#f0f0f0')
  const [textColor, setTextColor] = useState('#262626')
  const [itemsText, setItemsText] = useState(
    'Lorem ipsum dolor sit amet\nConsectetur adipiscing elit\nSed do eiusmod tempor incididunt'
  )

  const items = useMemo(
    () => itemsText.split('\n').map((s) => s.trim()).filter(Boolean),
    [itemsText]
  )

  const options = useMemo(
    () => ({
      className: PREVIEW_CLASS,
      direction,
      mode,
      duration,
      pauseOnHover,
      width,
      height,
      gap,
      paddingX,
      paddingY,
      fontSize,
      borderRadius,
      backgroundColor,
      textColor,
      items,
    }),
    [
      direction, mode, duration, pauseOnHover, width, height, gap, paddingX,
      paddingY, fontSize, borderRadius, backgroundColor, textColor, items,
    ]
  )

  const css = useMemo(() => buildMarqueeCss(options), [options])
  const html = useMemo(() => buildMarqueeHtml(options), [options])
  const fullDemo = useMemo(() => buildMarqueeFullDemo(options), [options])

  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      messageApi.success(t.copied)
    } catch {
      messageApi.error(t.copyError)
    }
  }

  const applyPreset = (key) => {
    const preset = MARQUEE_PRESETS.find((p) => p.key === key)
    if (!preset) return
    const o = preset.opts
    if (o.direction !== undefined) setDirection(o.direction)
    if (o.mode !== undefined) setMode(o.mode)
    if (o.duration !== undefined) setDuration(o.duration)
    if (o.pauseOnHover !== undefined) setPauseOnHover(o.pauseOnHover)
    if (o.width !== undefined) setWidth(o.width)
    if (o.height !== undefined) setHeight(o.height)
    if (o.gap !== undefined) setGap(o.gap)
    if (o.paddingX !== undefined) setPaddingX(o.paddingX)
    if (o.paddingY !== undefined) setPaddingY(o.paddingY)
    if (o.fontSize !== undefined) setFontSize(o.fontSize)
    if (o.borderRadius !== undefined) setBorderRadius(o.borderRadius)
    if (o.backgroundColor !== undefined) setBackgroundColor(o.backgroundColor)
    if (o.textColor !== undefined) setTextColor(o.textColor)
    if (o.items !== undefined) setItemsText(o.items.join('\n'))
  }

  const renderPreview = () => {
    const isVertical = direction === 'up' || direction === 'down'
    const needsDuplicate = mode === 'loop' || mode === 'bounce'
    const itemEls = items.map((item, idx) => (
      <span key={idx} className="marquee-item">{item}</span>
    ))
    return (
      <div className={PREVIEW_CLASS}>
        <div className="marquee-track">
          {itemEls}
        </div>
        {needsDuplicate && (
          <div className="marquee-track" aria-hidden="true">
            {itemEls}
          </div>
        )}
      </div>
    )
  }

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
                options={MARQUEE_PRESETS.map((p) => ({
                  value: p.key,
                  label: p.name[lang],
                }))}
              />

              <Space direction="vertical" size={4} style={{ width: '100%', marginTop: 8 }}>
                <Text>{t.direction}</Text>
                <Segmented
                  style={{ width: '100%' }}
                  block
                  value={direction}
                  onChange={setDirection}
                  options={[
                    { label: t.directionLeft, value: 'left' },
                    { label: t.directionRight, value: 'right' },
                    { label: t.directionUp, value: 'up' },
                    { label: t.directionDown, value: 'down' },
                  ]}
                />
              </Space>

              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.mode}</Text>
                <Segmented
                  style={{ width: '100%' }}
                  block
                  value={mode}
                  onChange={setMode}
                  options={[
                    { label: t.modeLoop, value: 'loop' },
                    { label: t.modeOnce, value: 'once' },
                    { label: t.modeBounce, value: 'bounce' },
                  ]}
                />
              </Space>

              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.duration}</Text>
                <Slider min={1} max={60} step={1} value={duration} onChange={setDuration} />
              </Space>

              <Row gutter={16}>
                <Col span={12}>
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Text>{t.width}</Text>
                    <Input value={width} onChange={(e) => setWidth(e.target.value)} placeholder="100%" />
                  </Space>
                </Col>
                <Col span={12}>
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Text>{t.height}</Text>
                    <InputNumber min={40} max={600} value={height} onChange={setHeight} style={{ width: '100%' }} />
                  </Space>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Text>{t.gap}</Text>
                    <InputNumber min={0} max={200} value={gap} onChange={setGap} style={{ width: '100%' }} />
                  </Space>
                </Col>
                <Col span={12}>
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Text>{t.fontSize}</Text>
                    <InputNumber min={10} max={72} value={fontSize} onChange={setFontSize} style={{ width: '100%' }} />
                  </Space>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Text>{t.paddingX}</Text>
                    <InputNumber min={0} max={64} value={paddingX} onChange={setPaddingX} style={{ width: '100%' }} />
                  </Space>
                </Col>
                <Col span={12}>
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Text>{t.paddingY}</Text>
                    <InputNumber min={0} max={64} value={paddingY} onChange={setPaddingY} style={{ width: '100%' }} />
                  </Space>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Text>{t.borderRadius}</Text>
                    <InputNumber min={0} max={64} value={borderRadius} onChange={setBorderRadius} style={{ width: '100%' }} />
                  </Space>
                </Col>
                <Col span={12}>
                  <Space style={{ width: '100%', height: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text>{t.pauseOnHover}</Text>
                    <Switch checked={pauseOnHover} onChange={setPauseOnHover} />
                  </Space>
                </Col>
              </Row>

              <Text strong>{t.colors}</Text>
              <Row gutter={[16, 12]}>
                <Col span={12}>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text>{t.backgroundColor}</Text>
                    <ColorPicker value={backgroundColor} onChange={setBackgroundColor} showText />
                  </Space>
                </Col>
                <Col span={12}>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text>{t.textColor}</Text>
                    <ColorPicker value={textColor} onChange={setTextColor} showText />
                  </Space>
                </Col>
              </Row>

              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.items}</Text>
                <TextArea
                  rows={4}
                  value={itemsText}
                  onChange={(e) => setItemsText(e.target.value)}
                  placeholder="Item 1&#10;Item 2&#10;Item 3"
                />
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
                minHeight: 240,
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
            label: `${t.sourceCol} — buildMarqueeCss / buildMarqueeHtml`,
            children: (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Paragraph type="secondary">{t.sourceBody}</Paragraph>
                <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 420 }}>
                  <code>{buildMarqueeCss.toString()}</code>
                </pre>
              </Space>
            ),
          },
        ]}
      />
    </Space>
  )
}
