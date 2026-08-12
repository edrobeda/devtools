import React, { useMemo, useState } from 'react'
import {
  Typography, Card, Space, Slider, Segmented, Alert, Button, Collapse,
  message, ColorPicker, Row, Col, Input, Switch, InputNumber,
} from 'antd'
import { CopyOutlined, FieldTimeOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  buildTimelineCss,
  buildTimelineHtml,
  buildTimelineFullDemo,
  TIMELINE_PRESETS,
} from '../utils/cssTimelineGenerator'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input

const DEFAULT_ITEMS = {
  pt: [
    'Ideação | 2026-01-05 | O projeto nasceu de uma necessidade interna de catalogar utilitários.',
    'Protótipo | 2026-03-12 | Primeira versão funcional com as ferramentas essenciais.',
    'Lançamento | 2026-06-20 | Deploy público e feedback da comunidade.',
    'Expansão | 2026-09-08 | Novos geradores, snippets e referências adicionados.',
  ],
  en: [
    'Ideation | 2026-01-05 | The project was born from an internal need to catalog utilities.',
    'Prototype | 2026-03-12 | First working version with the essential tools.',
    'Launch | 2026-06-20 | Public deploy and community feedback.',
    'Expansion | 2026-09-08 | New generators, snippets and references added.',
  ],
}

const LAYOUT_OPTIONS = {
  pt: [
    { label: 'Centralizado', value: 'center' },
    { label: 'Esquerda', value: 'left' },
    { label: 'Direita', value: 'right' },
  ],
  en: [
    { label: 'Center', value: 'center' },
    { label: 'Left', value: 'left' },
    { label: 'Right', value: 'right' },
  ],
}

const LINE_STYLE_OPTIONS = {
  pt: [
    { label: 'Sólido', value: 'solid' },
    { label: 'Tracejado', value: 'dashed' },
    { label: 'Pontilhado', value: 'dotted' },
  ],
  en: [
    { label: 'Solid', value: 'solid' },
    { label: 'Dashed', value: 'dashed' },
    { label: 'Dotted', value: 'dotted' },
  ],
}

const DOT_STYLE_OPTIONS = {
  pt: [
    { label: 'Preenchido', value: 'filled' },
    { label: 'Contorno', value: 'outline' },
    { label: 'Numerado', value: 'number' },
  ],
  en: [
    { label: 'Filled', value: 'filled' },
    { label: 'Outline', value: 'outline' },
    { label: 'Numbered', value: 'number' },
  ],
}

const translations = {
  pt: {
    title: 'Gerador de Timeline CSS',
    intro: (
      <>
        Monte timelines verticais usando só CSS: escolha o layout centralizado,
        à esquerda ou à direita, personalize a linha conectora, os dots e os
        cards de conteúdo; o preview usa o CSS exato que será copiado, então
        você vê o resultado final em tempo real.
      </>
    ),
    tipTitle: 'Como usar (e as pegadinhas)',
    tipBody: (
      <>
        O HTML gerado usa uma lista <Text code>{'<ul>'}</Text> com itens{' '}
        <Text code>{'<li class="timeline__item">'}</Text>, um{' '}
        <Text code>{'<div class="timeline__dot">'}</Text> e um{' '}
        <Text code>{'<div class="timeline__content">'}</Text>. A linha é
        desenhada com o pseudo-elemento <Text code>::before</Text> do container.
        No layout centralizado, a regra alterna os cards para os lados com{' '}
        <Text code>:nth-child(odd/even)</Text>; em telas estreitas a timeline
        vira automáticamente um layout à esquerda para não quebrar.
      </>
    ),
    settings: 'Configurações',
    items: 'Eventos (título | data | descrição, um por linha)',
    layout: 'Layout',
    alternate: 'Alternar lados (layout centralizado)',
    line: 'Linha conectora',
    lineColor: 'Cor da linha',
    lineWidth: 'Espessura',
    lineStyle: 'Estilo',
    dot: 'Dot / marcador',
    dotSize: 'Tamanho',
    dotColor: 'Cor de fundo',
    dotBorderWidth: 'Espessura da borda',
    dotBorderColor: 'Cor da borda',
    dotNumberColor: 'Cor do número',
    dotStyle: 'Estilo',
    connectorOffset: 'Distância da borda',
    card: 'Card de conteúdo',
    cardBg: 'Fundo',
    cardBorderColor: 'Cor da borda',
    cardBorderWidth: 'Espessura da borda',
    cardRadius: 'Arredondamento',
    cardPadding: 'Padding',
    cardShadow: 'Sombra',
    typography: 'Tipografia',
    titleColor: 'Título',
    dateColor: 'Data',
    textColor: 'Texto',
    itemGap: 'Espaço entre itens',
    preview: 'Pré-visualização',
    previewHint: 'A timeline abaixo usa exatamente o CSS gerado.',
    outputCss: 'CSS gerado',
    outputHtml: 'HTML de exemplo',
    outputFull: 'Bloco completo',
    copy: 'Copiar',
    copied: 'Copiado!',
    copyError: 'Não foi possível copiar',
    presets: 'Presets',
    sourceCol: 'Código-fonte',
    sourceBody:
      'O núcleo vive em src/utils/cssTimelineGenerator.js. buildTimelineCss monta as regras do container, do pseudo-elemento ::before (linha), dos dots absolutos e dos cards de conteúdo conforme o layout escolhido; buildTimelineHtml gera o markup semântico a partir dos eventos.',
  },
  en: {
    title: 'CSS Timeline Generator',
    intro: (
      <>
        Build vertical timelines using CSS only: choose a centered, left or
        right layout, customize the connector line, dots and content cards; the
        preview uses the exact CSS that will be copied, so you see the final
        result in real time.
      </>
    ),
    tipTitle: 'How to use (and the gotchas)',
    tipBody: (
      <>
        The generated HTML uses a <Text code>{'<ul>'}</Text> list with{' '}
        <Text code>{'<li class="timeline__item">'}</Text> items, a{' '}
        <Text code>{'<div class="timeline__dot">'}</Text> and a{' '}
        <Text code>{'<div class="timeline__content">'}</Text>. The line is
        drawn with the container's <Text code>::before</Text> pseudo-element.
        In the centered layout, cards alternate sides via{' '}
        <Text code>:nth-child(odd/even)</Text>; on narrow screens the timeline
        automatically switches to a left layout so it doesn't break.
      </>
    ),
    settings: 'Settings',
    items: 'Events (title | date | description, one per line)',
    layout: 'Layout',
    alternate: 'Alternate sides (centered layout)',
    line: 'Connector line',
    lineColor: 'Line color',
    lineWidth: 'Width',
    lineStyle: 'Style',
    dot: 'Dot / marker',
    dotSize: 'Size',
    dotColor: 'Background color',
    dotBorderWidth: 'Border width',
    dotBorderColor: 'Border color',
    dotNumberColor: 'Number color',
    dotStyle: 'Style',
    connectorOffset: 'Distance from edge',
    card: 'Content card',
    cardBg: 'Background',
    cardBorderColor: 'Border color',
    cardBorderWidth: 'Border width',
    cardRadius: 'Border radius',
    cardPadding: 'Padding',
    cardShadow: 'Shadow',
    typography: 'Typography',
    titleColor: 'Title',
    dateColor: 'Date',
    textColor: 'Text',
    itemGap: 'Gap between items',
    preview: 'Preview',
    previewHint: 'The timeline below uses exactly the generated CSS.',
    outputCss: 'Generated CSS',
    outputHtml: 'Example HTML',
    outputFull: 'Full snippet',
    copy: 'Copy',
    copied: 'Copied!',
    copyError: 'Could not copy',
    presets: 'Presets',
    sourceCol: 'Source code',
    sourceBody:
      'The core lives in src/utils/cssTimelineGenerator.js. buildTimelineCss builds the container, ::before pseudo-element (line), absolute dots and content card rules according to the chosen layout; buildTimelineHtml generates the semantic markup from the events.',
  },
}

const PREVIEW_CLASS = 'devtools-timeline-preview'

export default function CssTimelineGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [messageApi, messageContextHolder] = message.useMessage()

  const [itemsText, setItemsText] = useState(DEFAULT_ITEMS[lang].join('\n'))
  const [layout, setLayout] = useState('center')
  const [alternate, setAlternate] = useState(true)
  const [lineColor, setLineColor] = useState('#d9d9d9')
  const [lineWidth, setLineWidth] = useState(2)
  const [lineStyle, setLineStyle] = useState('solid')
  const [dotSize, setDotSize] = useState(16)
  const [dotColor, setDotColor] = useState('#1677ff')
  const [dotBorderWidth, setDotBorderWidth] = useState(3)
  const [dotBorderColor, setDotBorderColor] = useState('#ffffff')
  const [dotNumberColor, setDotNumberColor] = useState('#ffffff')
  const [dotStyle, setDotStyle] = useState('filled')
  const [connectorOffset, setConnectorOffset] = useState(24)
  const [cardBg, setCardBg] = useState('#f6ffed')
  const [cardBorderColor, setCardBorderColor] = useState('#b7eb8f')
  const [cardBorderWidth, setCardBorderWidth] = useState(1)
  const [cardRadius, setCardRadius] = useState(8)
  const [cardPadding, setCardPadding] = useState(16)
  const [cardShadow, setCardShadow] = useState('0 1px 2px rgba(0,0,0,0.06)')
  const [titleColor, setTitleColor] = useState('#262626')
  const [dateColor, setDateColor] = useState('#8c8c8c')
  const [textColor, setTextColor] = useState('#595959')
  const [itemGap, setItemGap] = useState(24)

  const items = useMemo(() => {
    return itemsText.split('\n').map((line) => {
      const parts = line.split('|').map((s) => s.trim())
      return {
        title: parts[0] || '',
        date: parts[1] || '',
        text: parts[2] || '',
      }
    }).filter((it) => it.title || it.date || it.text)
  }, [itemsText])

  const options = useMemo(
    () => ({
      className: PREVIEW_CLASS,
      layout,
      alternate,
      lineColor,
      lineWidth,
      lineStyle,
      dotSize,
      dotColor,
      dotBorderWidth,
      dotBorderColor,
      dotNumberColor,
      dotStyle,
      connectorOffset,
      cardBg,
      cardBorderColor,
      cardBorderWidth,
      cardRadius,
      cardPadding,
      cardShadow,
      titleColor,
      dateColor,
      textColor,
      itemGap,
    }),
    [
      layout, alternate, lineColor, lineWidth, lineStyle, dotSize, dotColor,
      dotBorderWidth, dotBorderColor, dotNumberColor, dotStyle, connectorOffset,
      cardBg, cardBorderColor, cardBorderWidth, cardRadius, cardPadding, cardShadow,
      titleColor, dateColor, textColor, itemGap,
    ]
  )

  const css = useMemo(() => buildTimelineCss(options), [options])
  const html = useMemo(() => buildTimelineHtml(items, options), [items, options])
  const fullDemo = useMemo(() => buildTimelineFullDemo(items, options), [items, options])

  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      messageApi.success(t.copied)
    } catch {
      messageApi.error(t.copyError)
    }
  }

  const applyPreset = (key) => {
    const preset = TIMELINE_PRESETS.find((p) => p.key === key)
    if (!preset) return
    const o = preset.opts
    if (o.layout !== undefined) setLayout(o.layout)
    if (o.alternate !== undefined) setAlternate(o.alternate)
    if (o.lineColor !== undefined) setLineColor(o.lineColor)
    if (o.lineWidth !== undefined) setLineWidth(o.lineWidth)
    if (o.lineStyle !== undefined) setLineStyle(o.lineStyle)
    if (o.dotSize !== undefined) setDotSize(o.dotSize)
    if (o.dotColor !== undefined) setDotColor(o.dotColor)
    if (o.dotBorderWidth !== undefined) setDotBorderWidth(o.dotBorderWidth)
    if (o.dotBorderColor !== undefined) setDotBorderColor(o.dotBorderColor)
    if (o.dotNumberColor !== undefined) setDotNumberColor(o.dotNumberColor)
    if (o.dotStyle !== undefined) setDotStyle(o.dotStyle)
    if (o.connectorOffset !== undefined) setConnectorOffset(o.connectorOffset)
    if (o.cardBg !== undefined) setCardBg(o.cardBg)
    if (o.cardBorderColor !== undefined) setCardBorderColor(o.cardBorderColor)
    if (o.cardBorderWidth !== undefined) setCardBorderWidth(o.cardBorderWidth)
    if (o.cardRadius !== undefined) setCardRadius(o.cardRadius)
    if (o.cardPadding !== undefined) setCardPadding(o.cardPadding)
    if (o.cardShadow !== undefined) setCardShadow(o.cardShadow)
    if (o.titleColor !== undefined) setTitleColor(o.titleColor)
    if (o.dateColor !== undefined) setDateColor(o.dateColor)
    if (o.textColor !== undefined) setTextColor(o.textColor)
    if (o.itemGap !== undefined) setItemGap(o.itemGap)
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {messageContextHolder}
      <Title level={2}><FieldTimeOutlined /> {t.title}</Title>
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
                options={TIMELINE_PRESETS.map((p) => ({
                  value: p.key,
                  label: p.name[lang],
                }))}
              />

              <Space direction="vertical" size={4} style={{ width: '100%', marginTop: 8 }}>
                <Text>{t.items}</Text>
                <TextArea
                  rows={5}
                  value={itemsText}
                  onChange={(e) => setItemsText(e.target.value)}
                  placeholder={DEFAULT_ITEMS[lang].join('\n')}
                />
              </Space>

              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.layout}</Text>
                <Segmented
                  style={{ width: '100%' }}
                  block
                  value={layout}
                  onChange={setLayout}
                  options={LAYOUT_OPTIONS[lang]}
                />
              </Space>

              {layout === 'center' && (
                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                  <Text>{t.alternate}</Text>
                  <Switch checked={alternate} onChange={setAlternate} />
                </Space>
              )}

              <Text strong>{t.line}</Text>
              <Row gutter={16}>
                <Col span={12}>
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Text>{t.lineWidth}</Text>
                    <InputNumber min={1} max={10} value={lineWidth} onChange={setLineWidth} style={{ width: '100%' }} />
                  </Space>
                </Col>
                <Col span={12}>
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Text>{t.lineStyle}</Text>
                    <Segmented
                      style={{ width: '100%' }}
                      block
                      value={lineStyle}
                      onChange={setLineStyle}
                      options={LINE_STYLE_OPTIONS[lang]}
                    />
                  </Space>
                </Col>
              </Row>
              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.lineColor}</Text>
                <ColorPicker value={lineColor} onChange={setLineColor} showText />
              </Space>

              <Text strong>{t.dot}</Text>
              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.dotStyle}</Text>
                <Segmented
                  style={{ width: '100%' }}
                  block
                  value={dotStyle}
                  onChange={setDotStyle}
                  options={DOT_STYLE_OPTIONS[lang]}
                />
              </Space>
              <Row gutter={16}>
                <Col span={12}>
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Text>{t.dotSize}</Text>
                    <InputNumber min={8} max={40} value={dotSize} onChange={setDotSize} style={{ width: '100%' }} />
                  </Space>
                </Col>
                <Col span={12}>
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Text>{t.dotBorderWidth}</Text>
                    <InputNumber min={0} max={10} value={dotBorderWidth} onChange={setDotBorderWidth} style={{ width: '100%' }} />
                  </Space>
                </Col>
              </Row>
              <Row gutter={[16, 12]}>
                <Col span={12}>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text>{t.dotColor}</Text>
                    <ColorPicker value={dotColor} onChange={setDotColor} showText />
                  </Space>
                </Col>
                <Col span={12}>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text>{t.dotBorderColor}</Text>
                    <ColorPicker value={dotBorderColor} onChange={setDotBorderColor} showText />
                  </Space>
                </Col>
                {dotStyle === 'number' && (
                  <Col span={12}>
                    <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                      <Text>{t.dotNumberColor}</Text>
                      <ColorPicker value={dotNumberColor} onChange={setDotNumberColor} showText />
                    </Space>
                  </Col>
                )}
              </Row>

              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.connectorOffset}</Text>
                <Slider min={8} max={80} value={connectorOffset} onChange={setConnectorOffset} />
              </Space>

              <Text strong>{t.card}</Text>
              <Row gutter={16}>
                <Col span={12}>
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Text>{t.cardBorderWidth}</Text>
                    <InputNumber min={0} max={10} value={cardBorderWidth} onChange={setCardBorderWidth} style={{ width: '100%' }} />
                  </Space>
                </Col>
                <Col span={12}>
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Text>{t.cardPadding}</Text>
                    <InputNumber min={0} max={40} value={cardPadding} onChange={setCardPadding} style={{ width: '100%' }} />
                  </Space>
                </Col>
              </Row>
              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.cardRadius}</Text>
                <Slider min={0} max={40} value={cardRadius} onChange={setCardRadius} />
              </Space>
              <Row gutter={[16, 12]}>
                <Col span={12}>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text>{t.cardBg}</Text>
                    <ColorPicker value={cardBg} onChange={setCardBg} showText />
                  </Space>
                </Col>
                <Col span={12}>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text>{t.cardBorderColor}</Text>
                    <ColorPicker value={cardBorderColor} onChange={setCardBorderColor} showText />
                  </Space>
                </Col>
              </Row>
              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.cardShadow}</Text>
                <Input value={cardShadow} onChange={(e) => setCardShadow(e.target.value)} />
              </Space>

              <Text strong>{t.typography}</Text>
              <Row gutter={[16, 12]}>
                <Col span={12}>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text>{t.titleColor}</Text>
                    <ColorPicker value={titleColor} onChange={setTitleColor} showText />
                  </Space>
                </Col>
                <Col span={12}>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text>{t.dateColor}</Text>
                    <ColorPicker value={dateColor} onChange={setDateColor} showText />
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
                <Text>{t.itemGap}</Text>
                <Slider min={8} max={80} value={itemGap} onChange={setItemGap} />
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
                minHeight: 220,
                overflow: 'auto',
              }}
            >
              <ul className={PREVIEW_CLASS}>
                {items.length === 0 ? (
                  <li className={`${PREVIEW_CLASS}__item`}>
                    <div className={`${PREVIEW_CLASS}__dot`} />
                    <div className={`${PREVIEW_CLASS}__content`}>
                      <h3 className={`${PREVIEW_CLASS}__title`}>No events</h3>
                    </div>
                  </li>
                ) : (
                  items.map((it, idx) => (
                    <li key={idx} className={`${PREVIEW_CLASS}__item`}>
                      <div className={`${PREVIEW_CLASS}__dot`}>
                        {dotStyle === 'number' ? idx + 1 : ''}
                      </div>
                      <div className={`${PREVIEW_CLASS}__content`}>
                        <h3 className={`${PREVIEW_CLASS}__title`}>{it.title}</h3>
                        {it.date && <time className={`${PREVIEW_CLASS}__date`}>{it.date}</time>}
                        {it.text && <p className={`${PREVIEW_CLASS}__text`}>{it.text}</p>}
                      </div>
                    </li>
                  ))
                )}
              </ul>
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
            label: `${t.sourceCol} — buildTimelineCss / buildTimelineHtml`,
            children: (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Paragraph type="secondary">{t.sourceBody}</Paragraph>
                <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 420 }}>
                  <code>{buildTimelineCss.toString()}</code>
                </pre>
              </Space>
            ),
          },
        ]}
      />
    </Space>
  )
}
