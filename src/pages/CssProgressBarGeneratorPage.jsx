import React, { useMemo, useState } from 'react'
import {
  Typography, Card, Space, Slider, Segmented, Alert, Button, Collapse,
  message, ColorPicker, Row, Col, InputNumber, Tabs, Switch,
} from 'antd'
import { BgColorsOutlined, CopyOutlined, LoadingOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  buildProgressBarCss,
  buildProgressBarHtml,
  buildProgressBarFullDemo,
  PROGRESS_PRESETS,
} from '../utils/cssProgressBarGenerator'

const { Title, Paragraph, Text } = Typography

const translations = {
  pt: {
    title: 'Gerador de Progress Bar CSS',
    intro: (
      <>
        Monte barras e anéis de progresso usando só CSS. Escolha entre linear
        (horizontal/vertical) ou circular, ajuste cores, dimensões e valor; o
        preview usa o CSS exato que será copiado.
      </>
    ),
    tipTitle: 'Como usar (e as pegadinhas)',
    tipBody: (
      <>
        A versão linear usa um container com uma div filha cujo{' '}
        <Text code>{'width/height'}</Text> representa o percentual. A versão
        circular usa <Text code>{'conic-gradient'}</Text> controlado pela
        variável <Text code>{'--value'}</Text>. Adicione atributos{' '}
        <Text code>{'aria-*'}</Text> para acessibilidade e lembre-se: animações
        de <Text code>{'conic-gradient'}</Text> só funcionam quando a variável
        muda, não quando a cor é trocada diretamente.
      </>
    ),
    settings: 'Configurações',
    type: 'Tipo',
    typeLinear: 'Linear',
    typeCircular: 'Circular',
    direction: 'Direção',
    directionHorizontal: 'Horizontal',
    directionVertical: 'Vertical',
    width: 'Largura (px)',
    height: 'Altura (px)',
    size: 'Diâmetro (px)',
    thickness: 'Espessura do anel (px)',
    value: 'Valor atual',
    max: 'Valor máximo',
    showLabel: 'Mostrar percentual',
    rounded: 'Bordas arredondadas',
    roundedCap: 'Ponta arredondada',
    animation: 'Animação',
    animationDuration: 'Duração da animação (ms)',
    colors: 'Cores',
    trackColor: 'Fundo (track)',
    fillColor: 'Preenchimento',
    borderColor: 'Cor da borda',
    textColor: 'Cor do texto',
    borderWidth: 'Espessura da borda',
    preview: 'Pré-visualização',
    previewHint: 'A barra abaixo usa exatamente o CSS gerado.',
    outputCss: 'CSS gerado',
    outputHtml: 'HTML de exemplo',
    outputFull: 'Bloco completo',
    copy: 'Copiar',
    copied: 'Copiado!',
    copyError: 'Não foi possível copiar',
    presets: 'Presets',
    sourceCol: 'Código-fonte',
    sourceBody:
      'O núcleo vive em src/utils/cssProgressBarGenerator.js. buildProgressBarCss monta as regras para a barra linear, a barra vertical e o círculo/donut. buildProgressBarHtml gera o markup semântico com atributos ARIA.',
  },
  en: {
    title: 'CSS Progress Bar Generator',
    intro: (
      <>
        Build progress bars and rings using only CSS. Choose linear
        (horizontal/vertical) or circular, adjust colors, dimensions and value;
        the preview uses the exact CSS that will be copied.
      </>
    ),
    tipTitle: 'How to use (and the gotchas)',
    tipBody: (
      <>
        The linear version uses a container with a child div whose{' '}
        <Text code>{'width/height'}</Text> represents the percentage. The
        circular version uses a <Text code>{'conic-gradient'}</Text> driven by
        the <Text code>{'--value'}</Text> variable. Add{' '}
        <Text code>{'aria-*'}</Text> attributes for accessibility and remember:
        <Text code>{'conic-gradient'}</Text> animations only work when the
        variable changes, not when the color itself is swapped.
      </>
    ),
    settings: 'Settings',
    type: 'Type',
    typeLinear: 'Linear',
    typeCircular: 'Circular',
    direction: 'Direction',
    directionHorizontal: 'Horizontal',
    directionVertical: 'Vertical',
    width: 'Width (px)',
    height: 'Height (px)',
    size: 'Diameter (px)',
    thickness: 'Ring thickness (px)',
    value: 'Current value',
    max: 'Max value',
    showLabel: 'Show percentage',
    rounded: 'Rounded corners',
    roundedCap: 'Rounded cap',
    animation: 'Animation',
    animationDuration: 'Animation duration (ms)',
    colors: 'Colors',
    trackColor: 'Track background',
    fillColor: 'Fill color',
    borderColor: 'Border color',
    textColor: 'Text color',
    borderWidth: 'Border width',
    preview: 'Preview',
    previewHint: 'The bar below uses exactly the generated CSS.',
    outputCss: 'Generated CSS',
    outputHtml: 'Example HTML',
    outputFull: 'Full snippet',
    copy: 'Copy',
    copied: 'Copied!',
    copyError: 'Could not copy',
    presets: 'Presets',
    sourceCol: 'Source code',
    sourceBody:
      'The core lives in src/utils/cssProgressBarGenerator.js. buildProgressBarCss builds the rules for linear, vertical and circular/donut bars. buildProgressBarHtml generates semantic markup with ARIA attributes.',
  },
}

const PREVIEW_CLASS = 'devtools-progress-preview'

export default function CssProgressBarGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [messageApi, messageContextHolder] = message.useMessage()

  const [type, setType] = useState('linear')
  const [direction, setDirection] = useState('horizontal')
  const [width, setWidth] = useState(320)
  const [height, setHeight] = useState(24)
  const [size, setSize] = useState(120)
  const [thickness, setThickness] = useState(12)
  const [value, setValue] = useState(65)
  const [max, setMax] = useState(100)
  const [showLabel, setShowLabel] = useState(true)
  const [rounded, setRounded] = useState(true)
  const [roundedCap, setRoundedCap] = useState(false)
  const [animation, setAnimation] = useState(false)
  const [animationDuration, setAnimationDuration] = useState(1000)
  const [trackColor, setTrackColor] = useState('#f0f0f0')
  const [fillColor, setFillColor] = useState('#1677ff')
  const [borderColor, setBorderColor] = useState('#d9d9d9')
  const [textColor, setTextColor] = useState('#595959')
  const [borderWidth, setBorderWidth] = useState(0)

  const options = useMemo(
    () => ({
      className: PREVIEW_CLASS,
      type,
      direction,
      width,
      height,
      size,
      thickness,
      value,
      max,
      showLabel,
      rounded,
      roundedCap,
      animation,
      animationDuration,
      trackColor,
      fillColor,
      borderColor,
      textColor,
      borderWidth,
    }),
    [
      type, direction, width, height, size, thickness, value, max, showLabel,
      rounded, roundedCap, animation, animationDuration, trackColor, fillColor,
      borderColor, textColor, borderWidth,
    ]
  )

  const css = useMemo(() => buildProgressBarCss(options), [options])
  const html = useMemo(() => buildProgressBarHtml(options), [options])
  const fullDemo = useMemo(() => buildProgressBarFullDemo(options), [options])

  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      messageApi.success(t.copied)
    } catch {
      messageApi.error(t.copyError)
    }
  }

  const applyPreset = (key) => {
    const preset = PROGRESS_PRESETS.find((p) => p.key === key)
    if (!preset) return
    const o = preset.opts
    if (o.type !== undefined) setType(o.type)
    if (o.direction !== undefined) setDirection(o.direction)
    if (o.width !== undefined) setWidth(o.width)
    if (o.height !== undefined) setHeight(o.height)
    if (o.size !== undefined) setSize(o.size)
    if (o.thickness !== undefined) setThickness(o.thickness)
    if (o.value !== undefined) setValue(o.value)
    if (o.max !== undefined) setMax(o.max)
    if (o.fillColor !== undefined) setFillColor(o.fillColor)
    if (o.trackColor !== undefined) setTrackColor(o.trackColor)
    if (o.animation !== undefined) setAnimation(o.animation)
    if (o.roundedCap !== undefined) setRoundedCap(o.roundedCap)
  }

  const renderPreview = () => {
    const percent = Math.round(Math.max(0, Math.min(100, (value / Math.max(max, 1)) * 100)))
    const animClass = animation ? ' animated' : ''
    const label = `${percent}%`
    if (type === 'linear') {
      return (
        <div className={PREVIEW_CLASS}>
          <div
            className={`progress-fill${animClass}`}
            style={{ [direction === 'vertical' ? 'height' : 'width']: `${percent}%` }}
            role="progressbar"
            aria-valuenow={value}
            aria-valuemin={0}
            aria-valuemax={max}
          />
          {showLabel && <span className="progress-label">{label}</span>}
        </div>
      )
    }
    return (
      <div className={`${PREVIEW_CLASS}${animClass}`} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max}>
        {showLabel && <span className="progress-label">{label}</span>}
      </div>
    )
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {messageContextHolder}
      <Title level={2}><LoadingOutlined /> {t.title}</Title>
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
                options={PROGRESS_PRESETS.map((p) => ({
                  value: p.key,
                  label: p.name[lang],
                }))}
              />

              <Space direction="vertical" size={4} style={{ width: '100%', marginTop: 8 }}>
                <Text>{t.type}</Text>
                <Segmented
                  style={{ width: '100%' }}
                  block
                  value={type}
                  onChange={setType}
                  options={[
                    { label: t.typeLinear, value: 'linear' },
                    { label: t.typeCircular, value: 'circular' },
                  ]}
                />
              </Space>

              {type === 'linear' && (
                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                  <Text>{t.direction}</Text>
                  <Segmented
                    style={{ width: '100%' }}
                    block
                    value={direction}
                    onChange={setDirection}
                    options={[
                      { label: t.directionHorizontal, value: 'horizontal' },
                      { label: t.directionVertical, value: 'vertical' },
                    ]}
                  />
                </Space>
              )}

              <Row gutter={16}>
                {type === 'linear' && (
                  <>
                    <Col span={12}>
                      <Space direction="vertical" size={4} style={{ width: '100%' }}>
                        <Text>{direction === 'vertical' ? t.height : t.width}</Text>
                        <InputNumber min={80} max={600} value={width} onChange={setWidth} style={{ width: '100%' }} />
                      </Space>
                    </Col>
                    <Col span={12}>
                      <Space direction="vertical" size={4} style={{ width: '100%' }}>
                        <Text>{direction === 'vertical' ? t.width : t.height}</Text>
                        <InputNumber min={8} max={80} value={height} onChange={setHeight} style={{ width: '100%' }} />
                      </Space>
                    </Col>
                  </>
                )}
                {type === 'circular' && (
                  <>
                    <Col span={12}>
                      <Space direction="vertical" size={4} style={{ width: '100%' }}>
                        <Text>{t.size}</Text>
                        <InputNumber min={40} max={300} value={size} onChange={setSize} style={{ width: '100%' }} />
                      </Space>
                    </Col>
                    <Col span={12}>
                      <Space direction="vertical" size={4} style={{ width: '100%' }}>
                        <Text>{t.thickness}</Text>
                        <InputNumber min={4} max={60} value={thickness} onChange={setThickness} style={{ width: '100%' }} />
                      </Space>
                    </Col>
                  </>
                )}
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Text>{t.value}</Text>
                    <InputNumber min={0} max={max} value={value} onChange={setValue} style={{ width: '100%' }} />
                  </Space>
                </Col>
                <Col span={12}>
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Text>{t.max}</Text>
                    <InputNumber min={1} max={1000} value={max} onChange={setMax} style={{ width: '100%' }} />
                  </Space>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Text>{t.borderWidth}</Text>
                    <Slider min={0} max={8} value={borderWidth} onChange={setBorderWidth} />
                  </Space>
                </Col>
                <Col span={12}>
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Text>{t.animationDuration}</Text>
                    <InputNumber min={100} max={5000} step={100} value={animationDuration} onChange={setAnimationDuration} style={{ width: '100%' }} />
                  </Space>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text>{t.showLabel}</Text>
                    <Switch checked={showLabel} onChange={setShowLabel} />
                  </Space>
                </Col>
                <Col span={12}>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text>{t.animation}</Text>
                    <Switch checked={animation} onChange={setAnimation} />
                  </Space>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text>{type === 'linear' ? t.rounded : t.roundedCap}</Text>
                    <Switch checked={type === 'linear' ? rounded : roundedCap} onChange={type === 'linear' ? setRounded : setRoundedCap} />
                  </Space>
                </Col>
              </Row>

              <Text strong>{t.colors}</Text>
              <Row gutter={[16, 12]}>
                <Col span={12}>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text>{t.trackColor}</Text>
                    <ColorPicker value={trackColor} onChange={setTrackColor} showText />
                  </Space>
                </Col>
                <Col span={12}>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text>{t.fillColor}</Text>
                    <ColorPicker value={fillColor} onChange={setFillColor} showText />
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
                    <Text>{t.textColor}</Text>
                    <ColorPicker value={textColor} onChange={setTextColor} showText />
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
            label: `${t.sourceCol} — buildProgressBarCss / buildProgressBarHtml`,
            children: (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Paragraph type="secondary">{t.sourceBody}</Paragraph>
                <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 420 }}>
                  <code>{buildProgressBarCss.toString()}</code>
                </pre>
              </Space>
            ),
          },
        ]}
      />
    </Space>
  )
}
