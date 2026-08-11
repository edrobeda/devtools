import React, { useMemo, useState } from 'react'
import { Typography, Card, Space, Slider, Segmented, Alert, Button, Collapse, message, ColorPicker, Row, Col } from 'antd'
import { LoadingOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import { buildSpinnerCss, getSpinnerDefaults, getSpinnerTypes } from '../utils/cssSpinnerGenerator'

const { Title, Paragraph, Text } = Typography
const { useMessage } = message

const TYPES = getSpinnerTypes()

const TYPE_LABELS = {
  pt: {
    border: 'Borda girando',
    'dual-ring': 'Anéis duplos',
    pulse: 'Pulso',
    dots: 'Pontos saltitantes',
    bars: 'Barras girando',
    rolling: 'Rolo contínuo',
  },
  en: {
    border: 'Spinning border',
    'dual-ring': 'Dual ring',
    pulse: 'Pulse',
    dots: 'Bouncing dots',
    bars: 'Spinning bars',
    rolling: 'Rolling',
  },
}

const translations = {
  pt: {
    title: 'Gerador de Loading Spinner CSS',
    intro: (
      <>
        Monte loaders/spinners usando só CSS — sem imagens, sem SVG, sem
        bibliotecas. Escolha o tipo, ajuste tamanho, cores e velocidade, copie
        a classe pronta e veja o preview ao vivo com o <Text code>keyframes</Text>{' '}
        exato que será colado.
      </>
    ),
    tipTitle: 'Dicas e pegadinhas',
    tipBody: (
      <>
        Spinners CSS são leves, mas animam propriedades como{' '}
        <Text code>transform</Text> e <Text code>opacity</Text> (compostas) para
        não forçar repaint a cada frame. Cuidado com muitos spinners na tela ao
        mesmo tempo — cada um roda a animação na thread de composição, mas ainda
        consome ciclos. Em telas de alta densidade, bordas muito finas podem
        sumir por arredondamento de sub-pixel; quando possível prefira valores
        pares para <Text code>width</Text>.
      </>
    ),
    settings: 'Configurações',
    type: 'Tipo de spinner',
    preset: 'Preset',
    size: 'Tamanho',
    width: 'Espessura da borda',
    duration: 'Duração da animação',
    count: 'Elementos',
    color: 'Cor principal',
    secondaryColor: 'Cor secundária',
    preview: 'Pré-visualização',
    previewHint: 'O spinner abaixo usa exatamente o CSS gerado.',
    output: 'CSS gerado',
    copy: 'Copiar',
    copied: 'CSS copiado!',
    copyError: 'Não foi possível copiar',
    sourceCol: 'Código-fonte',
    sourceBody:
      'O motor vive em src/utils/cssSpinnerGenerator.js. Cada tipo (border, dual-ring, pulse, dots, bars, rolling) monta uma regra .loading-spinner com keyframes únicos. A função parseColor normaliza cores do ColorPicker e alphaColor deriva a faixa transparente a partir de hex (#RGB ou #RRGGBB).',
  },
  en: {
    title: 'CSS Loading Spinner Generator',
    intro: (
      <>
        Build CSS-only loaders/spinners — no images, no SVG, no libraries. Pick
        the type, tweak size, colors and speed, copy the ready-to-use class and
        see a live preview with the exact <Text code>keyframes</Text> that will be
        pasted.
      </>
    ),
    tipTitle: 'Tips and gotchas',
    tipBody: (
      <>
        CSS spinners are lightweight, but animate <Text code>transform</Text> and{' '}
        <Text code>opacity</Text> (composited properties) to avoid forcing a
        repaint every frame. Watch out for too many spinners on the same screen —
        each one still consumes compositor cycles. On high-density displays very
        thin borders may disappear due to sub-pixel rounding; prefer even values
        for <Text code>width</Text> when possible.
      </>
    ),
    settings: 'Settings',
    type: 'Spinner type',
    preset: 'Preset',
    size: 'Size',
    width: 'Border width',
    duration: 'Animation duration',
    count: 'Elements',
    color: 'Main color',
    secondaryColor: 'Secondary color',
    preview: 'Preview',
    previewHint: 'The spinner below uses exactly the generated CSS.',
    output: 'Generated CSS',
    copy: 'Copy',
    copied: 'CSS copied!',
    copyError: 'Could not copy',
    sourceCol: 'Source code',
    sourceBody:
      'The engine lives in src/utils/cssSpinnerGenerator.js. Each type (border, dual-ring, pulse, dots, bars, rolling) builds a .loading-spinner rule with unique keyframes. parseColor normalizes ColorPicker values and alphaColor derives the transparent track from hex (#RGB or #RRGGBB).',
  },
}

function buildPreviewMarkup(type, count) {
  if (type === 'dots') {
    return (
      <div className="loading-spinner">
        {Array.from({ length: count }).map((_, i) => (
          <span key={i} />
        ))}
      </div>
    )
  }
  if (type === 'bars') {
    return (
      <div className="loading-spinner">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} />
        ))}
      </div>
    )
  }
  return <div className="loading-spinner" />
}

export default function CssSpinnerGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [messageApi, messageContextHolder] = useMessage()

  const [type, setType] = useState('border')
  const [size, setSize] = useState(40)
  const [width, setWidth] = useState(4)
  const [duration, setDuration] = useState(1)
  const [count, setCount] = useState(12)
  const [color, setColor] = useState('#1677ff')
  const [secondaryColor, setSecondaryColor] = useState('#13c2c2')

  const applyPreset = (nextType) => {
    setType(nextType)
    const defaults = getSpinnerDefaults(nextType)
    setSize(defaults.size)
    setWidth(defaults.width)
    setDuration(defaults.duration)
    setCount(defaults.count)
    setColor(defaults.color)
    setSecondaryColor(defaults.secondaryColor)
  }

  const config = useMemo(
    () => ({ type, size, width, color, secondaryColor, duration, count }),
    [type, size, width, color, secondaryColor, duration, count]
  )

  const css = useMemo(() => buildSpinnerCss(config), [config])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(css)
      messageApi.success(t.copied)
    } catch {
      messageApi.error(t.copyError)
    }
  }

  const typeOptions = TYPES.map((value) => ({
    value,
    label: TYPE_LABELS[lang][value],
  }))

  const showWidth = ['border', 'dual-ring', 'rolling'].includes(type)
  const showCount = ['dots', 'bars'].includes(type)
  const showSecondary = type === 'dual-ring'

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
              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.type}</Text>
                <Segmented
                  style={{ width: '100%' }}
                  block
                  value={type}
                  onChange={applyPreset}
                  options={typeOptions}
                />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.size}</Text>
                <Text code>{size}px</Text>
              </Space>
              <Slider min={8} max={120} value={size} onChange={setSize} />

              {showWidth && (
                <>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text>{t.width}</Text>
                    <Text code>{width}px</Text>
                  </Space>
                  <Slider min={1} max={12} value={width} onChange={setWidth} />
                </>
              )}

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.duration}</Text>
                <Text code>{duration}s</Text>
              </Space>
              <Slider min={0.3} max={3.0} step={0.1} value={duration} onChange={setDuration} />

              {showCount && (
                <>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text>{t.count}</Text>
                    <Text code>{count}</Text>
                  </Space>
                  <Slider min={2} max={16} value={count} onChange={setCount} />
                </>
              )}

              <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>{t.color}</Text>
                <ColorPicker value={color} onChange={setColor} showText />
              </Space>

              {showSecondary && (
                <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text>{t.secondaryColor}</Text>
                  <ColorPicker value={secondaryColor} onChange={setSecondaryColor} showText />
                </Space>
              )}
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={14}>
          <Card title={t.preview}>
            <div
              style={{
                border: '1px solid #f0f0f0',
                borderRadius: 8,
                padding: 40,
                background: '#fafafa',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 220,
              }}
            >
              <style>{css}</style>
              {buildPreviewMarkup(type, count)}
            </div>
            <Paragraph type="secondary" style={{ marginTop: 12, marginBottom: 0 }}>
              {t.previewHint}
            </Paragraph>
          </Card>
        </Col>
      </Row>

      <Card
        title={t.output}
        extra={<Button size="small" icon={<CopyOutlined />} onClick={copy}>{t.copy}</Button>}
      >
        <pre style={{ margin: 0, overflowX: 'auto' }}>
          <code>{css}</code>
        </pre>
      </Card>

      <Collapse
        items={[
          {
            key: 'source',
            label: `${t.sourceCol} — buildSpinnerCss`,
            children: (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Paragraph type="secondary">{t.sourceBody}</Paragraph>
                <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 320 }}>
                  <code>{buildSpinnerCss.toString()}</code>
                </pre>
              </Space>
            ),
          },
        ]}
      />
    </Space>
  )
}
