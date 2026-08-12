import React, { useEffect, useMemo, useState } from 'react'
import {
  Typography, Card, Space, Slider, Segmented, Alert, Button, Collapse,
  message, ColorPicker, Row, Col, Input, InputNumber, Tabs,
} from 'antd'
import { BgColorsOutlined, CopyOutlined, StarOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  buildStarRatingCss,
  buildStarRatingHtml,
  buildStarRatingFullDemo,
  getSymbol,
  SYMBOL_OPTIONS,
  STAR_RATING_PRESETS,
} from '../utils/cssStarRatingGenerator'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input

const SYMBOL_LABELS = {
  pt: {
    star: 'Estrela ★',
    heart: 'Coração ♥',
    thumb: 'Polegar 👍',
    sparkle: 'Brilho 🌟',
    diamond: 'Diamante ◆',
  },
  en: {
    star: 'Star ★',
    heart: 'Heart ♥',
    thumb: 'Thumb 👍',
    sparkle: 'Sparkle 🌟',
    diamond: 'Diamond ◆',
  },
}

const DEFAULT_LEGEND = {
  pt: 'Avalie este item',
  en: 'Rate this item',
}

const translations = {
  pt: {
    title: 'Gerador de Star Rating CSS',
    intro: (
      <>
        Monte estrelas de avaliação funcionais usando só CSS + radio buttons.
        Escolha o símbolo, número de itens, cores, tamanho e animação; o preview
        usa o CSS exato que será copiado, então você clica e vê o resultado
        final em tempo real.
      </>
    ),
    tipTitle: 'Como funciona (e as pegadinhas)',
    tipBody: (
      <>
        Os inputs estão ocultos e os labels carregam o símbolo. A ordem no DOM
        é reversa (5, 4, 3, 2, 1) e o container usa{' '}
        <Text code>{'flex-direction: row-reverse'}</Text>, então o seletor{' '}
        <Text code>{'label:hover ~ label'}</Text> consegue iluminar a estrela
        atual e todas as anteriores sem JavaScript. Use o mesmo{' '}
        <Text code>{'name'}</Text> em todos os radios para que apenas uma nota
        fique selecionada. Navegação por teclado funciona com{' '}
        <Text code>{':focus-visible'}</Text>.
      </>
    ),
    settings: 'Configurações',
    starCount: 'Número de estrelas',
    starSize: 'Tamanho (px)',
    gap: 'Espaço entre estrelas',
    symbol: 'Símbolo',
    activeColor: 'Cor ativa',
    inactiveColor: 'Cor inativa',
    hoverColor: 'Cor no hover',
    transitionDuration: 'Duração da transição (ms)',
    scaleOnHover: 'Escala no hover',
    colors: 'Cores',
    legend: 'Texto do fieldset (legend)',
    preview: 'Pré-visualização',
    previewHint: 'As estrelas abaixo usam exatamente o CSS gerado — clique para testar.',
    selected: 'Selecionado',
    none: 'nenhuma',
    outputCss: 'CSS gerado',
    outputHtml: 'HTML de exemplo',
    outputFull: 'Bloco completo',
    copy: 'Copiar',
    copied: 'Copiado!',
    copyError: 'Não foi possível copiar',
    presets: 'Presets',
    sourceCol: 'Código-fonte',
    sourceBody:
      'O núcleo vive em src/utils/cssStarRatingGenerator.js. buildStarRatingCss monta as regras do fieldset, dos inputs ocultos, dos labels e dos seletores :checked/hover. buildStarRatingHtml gera o markup semântico com fieldset/legend e inputs em ordem reversa.',
  },
  en: {
    title: 'CSS Star Rating Generator',
    intro: (
      <>
        Build working star ratings using only CSS + radio buttons. Choose the
        symbol, item count, colors, size and animation; the preview uses the
        exact CSS that will be copied, so you click and see the final result in
        real time.
      </>
    ),
    tipTitle: 'How it works (and the gotchas)',
    tipBody: (
      <>
        The inputs are hidden and the labels carry the symbol. The DOM order is
        reversed (5, 4, 3, 2, 1) and the container uses{' '}
        <Text code>{'flex-direction: row-reverse'}</Text>, so the{' '}
        <Text code>{'label:hover ~ label'}</Text> selector can highlight the
        current star and all previous ones without JavaScript. Use the same{' '}
        <Text code>{'name'}</Text> on every radio so only one rating is
        selected. Keyboard navigation works with{' '}
        <Text code>{':focus-visible'}</Text>.
      </>
    ),
    settings: 'Settings',
    starCount: 'Number of stars',
    starSize: 'Size (px)',
    gap: 'Gap between stars',
    symbol: 'Symbol',
    activeColor: 'Active color',
    inactiveColor: 'Inactive color',
    hoverColor: 'Hover color',
    transitionDuration: 'Transition duration (ms)',
    scaleOnHover: 'Scale on hover',
    colors: 'Colors',
    legend: 'Fieldset legend text',
    preview: 'Preview',
    previewHint: 'The stars below use exactly the generated CSS — click to test.',
    selected: 'Selected',
    none: 'none',
    outputCss: 'Generated CSS',
    outputHtml: 'Example HTML',
    outputFull: 'Full snippet',
    copy: 'Copy',
    copied: 'Copied!',
    copyError: 'Could not copy',
    presets: 'Presets',
    sourceCol: 'Source code',
    sourceBody:
      'The core lives in src/utils/cssStarRatingGenerator.js. buildStarRatingCss builds the rules for the fieldset, hidden inputs, labels and :checked/hover selectors. buildStarRatingHtml generates the semantic markup with fieldset/legend and reversed inputs.',
  },
}

const PREVIEW_CLASS = 'devtools-star-rating-preview'

export default function CssStarRatingGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [messageApi, messageContextHolder] = message.useMessage()

  const [starCount, setStarCount] = useState(5)
  const [starSize, setStarSize] = useState(32)
  const [gap, setGap] = useState(4)
  const [activeColor, setActiveColor] = useState('#f5a623')
  const [inactiveColor, setInactiveColor] = useState('#d9d9d9')
  const [hoverColor, setHoverColor] = useState('#f5a623')
  const [transitionDuration, setTransitionDuration] = useState(200)
  const [scaleOnHover, setScaleOnHover] = useState(1.15)
  const [symbol, setSymbol] = useState('star')
  const [legend, setLegend] = useState(DEFAULT_LEGEND[lang])
  const [rating, setRating] = useState(0)

  // Reseta a nota se o número de estrelas mudar para evitar valor órfão.
  useEffect(() => {
    setRating(0)
  }, [starCount])

  const options = useMemo(
    () => ({
      className: PREVIEW_CLASS,
      starCount,
      starSize,
      gap,
      activeColor,
      inactiveColor,
      hoverColor,
      transitionDuration,
      scaleOnHover,
      symbol,
      legend,
      name: 'preview-rating',
      idPrefix: `${PREVIEW_CLASS}-item`,
    }),
    [starCount, starSize, gap, activeColor, inactiveColor, hoverColor, transitionDuration, scaleOnHover, symbol, legend]
  )

  const css = useMemo(() => buildStarRatingCss(options), [options])
  const html = useMemo(() => buildStarRatingHtml(options), [options])
  const fullDemo = useMemo(() => buildStarRatingFullDemo(options), [options])

  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      messageApi.success(t.copied)
    } catch {
      messageApi.error(t.copyError)
    }
  }

  const applyPreset = (key) => {
    const preset = STAR_RATING_PRESETS.find((p) => p.key === key)
    if (!preset) return
    const o = preset.opts
    if (o.activeColor !== undefined) setActiveColor(o.activeColor)
    if (o.inactiveColor !== undefined) setInactiveColor(o.inactiveColor)
    if (o.hoverColor !== undefined) setHoverColor(o.hoverColor)
    if (o.symbol !== undefined) setSymbol(o.symbol)
    if (o.starSize !== undefined) setStarSize(o.starSize)
    if (o.gap !== undefined) setGap(o.gap)
    if (o.scaleOnHover !== undefined) setScaleOnHover(o.scaleOnHover)
  }

  const symbolOptions = useMemo(
    () => SYMBOL_OPTIONS.map((k) => ({ label: SYMBOL_LABELS[lang][k], value: k })),
    [lang]
  )

  const renderPreview = () => {
    const count = Math.max(1, Math.min(20, Number(starCount) || 5))
    const symbolChar = getSymbol(symbol)
    const group = `${PREVIEW_CLASS}-group`
    const safeLegend = legend || DEFAULT_LEGEND[lang]

    return (
      <fieldset className={PREVIEW_CLASS}>
        <legend>{safeLegend}</legend>
        <div className={`${PREVIEW_CLASS}__stars`} role="radiogroup" aria-label="Rating">
          {Array.from({ length: count }, (_, i) => {
            const value = count - i
            const id = `${PREVIEW_CLASS}-item-${value}`
            return (
              <React.Fragment key={value}>
                <input
                  type="radio"
                  name={group}
                  id={id}
                  value={value}
                  checked={rating === value}
                  onChange={(e) => setRating(Number(e.target.value))}
                />
                <label htmlFor={id} aria-label={`${value} ${value === 1 ? 'star' : 'stars'}`}>
                  {symbolChar}
                </label>
              </React.Fragment>
            )
          })}
        </div>
      </fieldset>
    )
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {messageContextHolder}
      <Title level={2}><StarOutlined /> {t.title}</Title>
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
                options={STAR_RATING_PRESETS.map((p) => ({
                  value: p.key,
                  label: p.name[lang],
                }))}
              />

              <Space direction="vertical" size={4} style={{ width: '100%', marginTop: 8 }}>
                <Text>{t.legend}</Text>
                <Input
                  value={legend}
                  onChange={(e) => setLegend(e.target.value)}
                  placeholder={DEFAULT_LEGEND[lang]}
                />
              </Space>

              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.symbol}</Text>
                <Segmented
                  style={{ width: '100%' }}
                  block
                  value={symbol}
                  onChange={setSymbol}
                  options={symbolOptions}
                />
              </Space>

              <Row gutter={16}>
                <Col span={12}>
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Text>{t.starCount}</Text>
                    <InputNumber min={1} max={20} value={starCount} onChange={setStarCount} style={{ width: '100%' }} />
                  </Space>
                </Col>
                <Col span={12}>
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Text>{t.starSize}</Text>
                    <Slider min={16} max={64} value={starSize} onChange={setStarSize} />
                  </Space>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Text>{t.gap}</Text>
                    <Slider min={0} max={20} value={gap} onChange={setGap} />
                  </Space>
                </Col>
                <Col span={12}>
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Text>{t.transitionDuration}</Text>
                    <InputNumber min={0} max={1000} step={50} value={transitionDuration} onChange={setTransitionDuration} style={{ width: '100%' }} />
                  </Space>
                </Col>
              </Row>

              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.scaleOnHover}</Text>
                <Slider min={1} max={1.5} step={0.05} value={scaleOnHover} onChange={setScaleOnHover} />
              </Space>

              <Text strong>{t.colors}</Text>
              <Row gutter={[16, 12]}>
                <Col span={12}>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text>{t.activeColor}</Text>
                    <ColorPicker value={activeColor} onChange={setActiveColor} showText />
                  </Space>
                </Col>
                <Col span={12}>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text>{t.inactiveColor}</Text>
                    <ColorPicker value={inactiveColor} onChange={setInactiveColor} showText />
                  </Space>
                </Col>
                <Col span={12}>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text>{t.hoverColor}</Text>
                    <ColorPicker value={hoverColor} onChange={setHoverColor} showText />
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
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 16,
              }}
            >
              {renderPreview()}
              <Paragraph type="secondary" style={{ margin: 0 }}>
                {t.selected}: {rating > 0 ? `${rating}/${starCount}` : t.none}
              </Paragraph>
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
            label: `${t.sourceCol} — buildStarRatingCss / buildStarRatingHtml`,
            children: (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Paragraph type="secondary">{t.sourceBody}</Paragraph>
                <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 420 }}>
                  <code>{buildStarRatingCss.toString()}</code>
                </pre>
              </Space>
            ),
          },
        ]}
      />
    </Space>
  )
}
