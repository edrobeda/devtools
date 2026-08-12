import React, { useMemo, useState } from 'react'
import {
  Typography, Card, Space, Slider, Segmented, Alert, Button, Collapse,
  message, ColorPicker, Row, Col, Switch, Tabs,
} from 'antd'
import { BgColorsOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  buildSkeletonCss,
  buildSkeletonHtml,
  buildSkeletonFullDemo,
  PRESETS,
  DEFAULTS,
} from '../utils/cssSkeletonGenerator'

const { Title, Paragraph, Text } = Typography
const { useMessage } = message

const VARIANT_OPTIONS = {
  pt: [
    { label: 'Shimmer', value: 'shimmer' },
    { label: 'Pulse', value: 'pulse' },
    { label: 'Wave', value: 'wave' },
  ],
  en: [
    { label: 'Shimmer', value: 'shimmer' },
    { label: 'Pulse', value: 'pulse' },
    { label: 'Wave', value: 'wave' },
  ],
}

const LAYOUT_OPTIONS = {
  pt: [
    { label: 'Linhas', value: 'lines' },
    { label: 'Círculo', value: 'circle' },
    { label: 'Retângulo', value: 'rect' },
    { label: 'Misto', value: 'mixed' },
  ],
  en: [
    { label: 'Lines', value: 'lines' },
    { label: 'Circle', value: 'circle' },
    { label: 'Rectangle', value: 'rect' },
    { label: 'Mixed', value: 'mixed' },
  ],
}

const ALIGN_OPTIONS = {
  pt: [
    { label: 'Esquerda', value: 'left' },
    { label: 'Centro', value: 'center' },
    { label: 'Direita', value: 'right' },
  ],
  en: [
    { label: 'Left', value: 'left' },
    { label: 'Center', value: 'center' },
    { label: 'Right', value: 'right' },
  ],
}

const translations = {
  pt: {
    title: 'Gerador de Skeleton CSS',
    intro: (
      <>
        Crie estados de carregamento (skeleton/placeholder) usando só CSS:
        escolha entre as animações shimmer, pulse ou wave, ajuste as cores de
        base e destaque, o arredondamento e a duração; o preview usa exatamente o
        CSS gerado, então você vê o efeito final em tempo real.
      </>
    ),
    tipTitle: 'Como funciona (e as pegadinhas)',
    tipBody: (
      <>
        Cada bloco <Text code>{'.skeleton__block'}</Text> recebe um fundo cinza
        e, no caso do shimmer, um pseudo-elemento <Text code>::after</Text> com
        um gradiente linear que atravessa a peça de um lado a outro. O wave usa
        <Text code>background-size: 200%</Text> e desloca o gradiente
        continuamente. Sempre respeite{' '}
        <Text code>{'prefers-reduced-motion'}</Text> para usuários que
        desativam animações.
      </>
    ),
    settings: 'Configurações',
    variant: 'Animação',
    baseColor: 'Cor base',
    highlightColor: 'Cor de destaque',
    borderRadius: 'Border radius (px)',
    duration: 'Duração da animação (ms)',
    layout: 'Layout do preview',
    lineHeight: 'Altura das linhas (px)',
    lineGap: 'Espaço entre linhas (px)',
    lineCount: 'Quantidade de linhas',
    circleSize: 'Tamanho do círculo (px)',
    rectWidth: 'Largura do retângulo (px)',
    rectHeight: 'Altura do retângulo (px)',
    textAlign: 'Alinhamento',
    preview: 'Pré-visualização',
    previewHint: 'O skeleton abaixo usa exatamente o CSS gerado — ajuste os parâmetros e veja a animação ao vivo.',
    outputCss: 'CSS gerado',
    outputHtml: 'HTML de exemplo',
    outputFull: 'Bloco completo',
    copy: 'Copiar',
    copied: 'Copiado!',
    copyError: 'Não foi possível copiar',
    presets: 'Presets',
    sourceCol: 'Código-fonte',
    sourceBody:
      'O núcleo vive em src/utils/cssSkeletonGenerator.js. buildSkeletonCss monta as regras de .skeleton, .skeleton__block e os @keyframes conforme a animação escolhida; buildSkeletonHtml gera o markup semântico com role="status" aria-busy="true".',
  },
  en: {
    title: 'CSS Skeleton Generator',
    intro: (
      <>
        Build loading states (skeleton/placeholder) using only CSS: choose
        between shimmer, pulse or wave animations, tweak base and highlight
        colors, border radius and duration; the preview uses the exact generated
        CSS, so you see the final effect in real time.
      </>
    ),
    tipTitle: 'How it works (and the gotchas)',
    tipBody: (
      <>
        Each <Text code>{'.skeleton__block'}</Text> gets a gray background and,
        for shimmer, a <Text code>::after</Text> pseudo-element with a linear
        gradient that sweeps across the block. Wave uses{' '}
        <Text code>background-size: 200%</Text> and continuously shifts the
        gradient. Always respect <Text code>{'prefers-reduced-motion'}</Text>{' '}
        for users who disable animations.
      </>
    ),
    settings: 'Settings',
    variant: 'Animation',
    baseColor: 'Base color',
    highlightColor: 'Highlight color',
    borderRadius: 'Border radius (px)',
    duration: 'Animation duration (ms)',
    layout: 'Preview layout',
    lineHeight: 'Line height (px)',
    lineGap: 'Gap between lines (px)',
    lineCount: 'Number of lines',
    circleSize: 'Circle size (px)',
    rectWidth: 'Rectangle width (px)',
    rectHeight: 'Rectangle height (px)',
    textAlign: 'Alignment',
    preview: 'Preview',
    previewHint: 'The skeleton below uses exactly the generated CSS — tweak the parameters and watch the animation live.',
    outputCss: 'Generated CSS',
    outputHtml: 'Example HTML',
    outputFull: 'Full block',
    copy: 'Copy',
    copied: 'Copied!',
    copyError: 'Could not copy',
    presets: 'Presets',
    sourceCol: 'Source code',
    sourceBody:
      'The core lives in src/utils/cssSkeletonGenerator.js. buildSkeletonCss builds the rules for .skeleton, .skeleton__block and the @keyframes according to the chosen animation; buildSkeletonHtml generates semantic markup with role="status" aria-busy="true".',
  },
}

const PRESET_ORDER = ['shimmer', 'pulse', 'wave', 'dark', 'minimal']

export default function CssSkeletonGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [messageApi, messageContextHolder] = useMessage()

  const [variant, setVariant] = useState(DEFAULTS.variant)
  const [baseColor, setBaseColor] = useState(DEFAULTS.baseColor)
  const [highlightColor, setHighlightColor] = useState(DEFAULTS.highlightColor)
  const [borderRadius, setBorderRadius] = useState(DEFAULTS.borderRadius)
  const [duration, setDuration] = useState(DEFAULTS.duration)
  const [layout, setLayout] = useState(DEFAULTS.layout)
  const [lineHeight, setLineHeight] = useState(DEFAULTS.lineHeight)
  const [lineGap, setLineGap] = useState(DEFAULTS.lineGap)
  const [lineCount, setLineCount] = useState(4)
  const [circleSize, setCircleSize] = useState(DEFAULTS.circleSize)
  const [rectWidth, setRectWidth] = useState(DEFAULTS.rectWidth)
  const [rectHeight, setRectHeight] = useState(DEFAULTS.rectHeight)
  const [textAlign, setTextAlign] = useState(DEFAULTS.textAlign)

  const settings = useMemo(
    () => ({
      variant,
      baseColor,
      highlightColor,
      borderRadius,
      duration,
      layout,
      lineHeight,
      lineGap,
      lineCount,
      circleSize,
      rectWidth,
      rectHeight,
      textAlign,
    }),
    [
      variant,
      baseColor,
      highlightColor,
      borderRadius,
      duration,
      layout,
      lineHeight,
      lineGap,
      lineCount,
      circleSize,
      rectWidth,
      rectHeight,
      textAlign,
    ]
  )

  const cssOutput = useMemo(() => buildSkeletonCss(settings), [settings])
  const htmlOutput = useMemo(() => buildSkeletonHtml(settings), [settings])
  const fullOutput = useMemo(() => buildSkeletonFullDemo(settings), [settings])

  const applyPreset = (key) => {
    const p = PRESETS[key]
    if (!p) return
    setVariant(p.variant)
    setBaseColor(p.baseColor)
    setHighlightColor(p.highlightColor)
    setDuration(p.duration)
  }

  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
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
                options={PRESET_ORDER.map((key) => ({
                  value: key,
                  label: key.charAt(0).toUpperCase() + key.slice(1),
                }))}
              />

              <Space direction="vertical" size={4} style={{ width: '100%', marginTop: 8 }}>
                <Text>{t.variant}</Text>
                <Segmented
                  style={{ width: '100%' }}
                  block
                  value={variant}
                  onChange={setVariant}
                  options={VARIANT_OPTIONS[lang]}
                />
              </Space>

              <Space direction="vertical" size={4} style={{ width: '100%', marginTop: 8 }}>
                <Text>{t.layout}</Text>
                <Segmented
                  style={{ width: '100%' }}
                  block
                  value={layout}
                  onChange={setLayout}
                  options={LAYOUT_OPTIONS[lang]}
                />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>{t.baseColor}</Text>
                <ColorPicker value={baseColor} onChange={setBaseColor} showText />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>{t.highlightColor}</Text>
                <ColorPicker value={highlightColor} onChange={setHighlightColor} showText />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.borderRadius}</Text>
                <Text code>{borderRadius}px</Text>
              </Space>
              <Slider min={0} max={48} value={borderRadius} onChange={setBorderRadius} />

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.duration}</Text>
                <Text code>{duration}ms</Text>
              </Space>
              <Slider min={200} max={5000} step={100} value={duration} onChange={setDuration} />

              {layout !== 'circle' && layout !== 'rect' && (
                <>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text>{t.lineHeight}</Text>
                    <Text code>{lineHeight}px</Text>
                  </Space>
                  <Slider min={4} max={64} value={lineHeight} onChange={setLineHeight} />

                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text>{t.lineGap}</Text>
                    <Text code>{lineGap}px</Text>
                  </Space>
                  <Slider min={0} max={48} value={lineGap} onChange={setLineGap} />

                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text>{t.lineCount}</Text>
                    <Text code>{lineCount}</Text>
                  </Space>
                  <Slider min={1} max={12} value={lineCount} onChange={setLineCount} />
                </>
              )}

              {layout === 'circle' || layout === 'mixed' ? (
                <>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text>{t.circleSize}</Text>
                    <Text code>{circleSize}px</Text>
                  </Space>
                  <Slider min={16} max={200} value={circleSize} onChange={setCircleSize} />
                </>
              ) : null}

              {layout === 'rect' && (
                <>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text>{t.rectWidth}</Text>
                    <Text code>{rectWidth}px</Text>
                  </Space>
                  <Slider min={32} max={800} value={rectWidth} onChange={setRectWidth} />

                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text>{t.rectHeight}</Text>
                    <Text code>{rectHeight}px</Text>
                  </Space>
                  <Slider min={16} max={400} value={rectHeight} onChange={setRectHeight} />
                </>
              )}

              <Space direction="vertical" size={4} style={{ width: '100%', marginTop: 8 }}>
                <Text>{t.textAlign}</Text>
                <Segmented
                  style={{ width: '100%' }}
                  block
                  value={textAlign}
                  onChange={setTextAlign}
                  options={ALIGN_OPTIONS[lang]}
                />
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
                padding: 40,
                background: '#fafafa',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'center',
                minHeight: 260,
              }}
            >
              <style>{cssOutput}</style>
              <div
                className="skeleton"
                role="status"
                aria-live="polite"
                aria-busy="true"
                style={{ alignItems: textAlign, width: '100%', maxWidth: 480 }}
              >
                {layout === 'lines' && (
                  <div className="skeleton__lines" style={{ width: '100%' }}>
                    {Array.from({ length: lineCount }).map((_, i) => (
                      <div key={i} className="skeleton__block skeleton__line" />
                    ))}
                  </div>
                )}
                {layout === 'circle' && (
                  <div className="skeleton__block skeleton__circle" />
                )}
                {layout === 'rect' && (
                  <div className="skeleton__block skeleton__rect" />
                )}
                {layout === 'mixed' && (
                  <div className="skeleton__row">
                    <div className="skeleton__block skeleton__circle" />
                    <div className="skeleton__lines" style={{ flex: 1 }}>
                      {Array.from({ length: Math.max(1, lineCount - 1) }).map((_, i) => (
                        <div key={i} className="skeleton__block skeleton__line" />
                      ))}
                    </div>
                  </div>
                )}
                <span className="visually-hidden">Loading...</span>
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
            label: `${t.sourceCol} — buildSkeletonCss / buildSkeletonHtml`,
            children: (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Paragraph type="secondary">{t.sourceBody}</Paragraph>
                <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 320 }}>
                  <code>{buildSkeletonCss.toString()}</code>
                </pre>
              </Space>
            ),
          },
        ]}
      />
    </Space>
  )
}
