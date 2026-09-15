import React, { useMemo, useState } from 'react'
import {
  Typography,
  Card,
  Space,
  Slider,
  Segmented,
  Alert,
  Button,
  Collapse,
  message,
  ColorPicker,
  Row,
  Col,
  InputNumber,
} from 'antd'
import { PicCenterOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  clampSpeed,
  layerColorString,
  buildScrollParallaxCss,
  buildStickyParallaxCss,
  buildLastHtml,
  PARALLAX_SHIFT,
} from '../utils/cssParallax'

const { Title, Paragraph, Text } = Typography
const { useMessage } = message

const LAYER_COLORS_DEFAULTS = ['#361d6e', '#1677ff', '#13c2c2', '#fa541c']
const LAYER_SPEEDS_DEFAULTS = [-0.8, -0.3, 0.4, 0.0]

function makeDefaultLayers(count) {
  return Array.from({ length: count }, (_, i) => ({
    color: LAYER_COLORS_DEFAULTS[i % LAYER_COLORS_DEFAULTS.length],
    factor: LAYER_SPEEDS_DEFAULTS[i % LAYER_SPEEDS_DEFAULTS.length],
  }))
}

const KEYFRAME_STYLE = `@keyframes devtools-parallax { from { transform: translateY(calc(var(--speed) * -${PARALLAX_SHIFT}px)); } to { transform: translateY(calc(var(--speed) * ${PARALLAX_SHIFT}px)); } }`

const translations = {
  pt: {
    title: 'Gerador de Parallax CSS',
    intro: (
      <>
        Crie efeitos de parallax com uma ou duas técnicas diferentes. A
        técnica <Text strong>Scroll Timeline</Text> usa{' '}
        <Text code>animation-timeline: scroll()</Text> para animar cada
        camada com velocidade diferente ao scrollar — é moderna, fluida e
        suportada no Chromium 115+ e Firefox 114+. A técnica{' '}
        <Text strong>Sticky</Text> usa{' '}
        <Text code>position: sticky</Text> para empilhar seções que prendem
        no topo — funciona em todos os browsers, sem animação nem JS.
      </>
    ),
    technique: 'Técnica',
    techniqueScroll: 'Scroll Timeline',
    techniqueSticky: 'Sticky (empilhado)',
    techniqueScrollDesc:
      'Cada camada anima com animation-timeline: scroll() — camadas com velocidade negativa ficam como fundo (mais lento que o conteúdo), positiva como frente (mais rápido). O conteúdo rola por cima das camadas.',
    techniqueStickyDesc:
      'Cada seção tem a mesma altura do cenário e prende no topo ao passar — ao scrollar, as seções empilham visualmente, como se revelassem camadas uma atrás da outra. Funciona em qualquer browser.',
    layers: 'Camadas',
    sceneHeight: 'Altura do cenário (px)',
    color: 'Cor',
    speed: 'Velocidade',
    preview: 'Pré-visualização',
    previewHintScroll: 'Role dentro do cenário para ver o efeito.',
    previewHintSticky: 'Role dentro do cenário para ver as camadas empilharem.',
    output: 'CSS gerado',
    htmlOutput: 'HTML sugerido',
    copy: 'Copiar',
    copied: 'CSS copiado!',
    copiedHtml: 'HTML copiado!',
    copyError: 'Não foi possível copiar',
    source: 'Código-fonte',
    sourceBody: 'O gerador vive em src/utils/cssParallax.js e a página em src/pages/CssParallaxGeneratorPage.jsx. As funções buildScrollParallaxCss e buildStickyParallaxCss constroem o CSS a partir do número de camadas, cores e velocidades, mantendo os elementos com top/bottom negativos para não expor gaps durante o scroll.',
  },
  en: {
    title: 'CSS Parallax Generator',
    intro: (
      <>
        Create parallax effects using two different techniques. The{' '}
        <Text strong>Scroll Timeline</Text> technique uses{' '}
        <Text code>animation-timeline: scroll()</Text> to animate each
        layer at a different speed while scrolling — modern, smooth, and
        supported in Chromium 115+ and Firefox 114+. The{' '}
        <Text strong>Sticky</Text> technique uses{' '}
        <Text code>position: sticky</Text> to stack full-viewport sections
        that pin at the top — works in every browser, no animation or JS
        needed.
      </>
    ),
    technique: 'Technique',
    techniqueScroll: 'Scroll Timeline',
    techniqueSticky: 'Sticky (stacked)',
    techniqueScrollDesc:
      'Each layer animates via animation-timeline: scroll() — layers with negative speed appear as background (slower than content), positive as foreground (faster). Content scrolls on top of the layers.',
    techniqueStickyDesc:
      'Each section has the same height as the scene and sticks to the top as you scroll — sections stack visually, revealing layers behind one another. Works in any browser.',
    layers: 'Layers',
    sceneHeight: 'Scene height (px)',
    color: 'Color',
    speed: 'Speed',
    preview: 'Preview',
    previewHintScroll: 'Scroll inside the scene to see the effect.',
    previewHintSticky: 'Scroll inside the scene to see the layers stack.',
    output: 'Generated CSS',
    htmlOutput: 'Suggested HTML',
    copy: 'Copy',
    copied: 'CSS copied!',
    copiedHtml: 'HTML copied!',
    copyError: 'Could not copy',
    source: 'Source code',
    sourceBody:
      'The generator lives in src/utils/cssParallax.js and the page in src/pages/CssParallaxGeneratorPage.jsx. The buildScrollParallaxCss and buildStickyParallaxCss functions build CSS from the number of layers, colors, and speeds, keeping elements with negative top/bottom values to prevent visible gaps during scrolling.',
  },
}

const SPEED_LABELS = {
  pt: [
    { label: 'Fundo', value: -1 },
    { label: 'Neutro', value: 0 },
    { label: 'Frente', value: 1 },
  ],
  en: [
    { label: 'Background', value: -1 },
    { label: 'Neutral', value: 0 },
    { label: 'Foreground', value: 1 },
  ],
}

export default function CssParallaxGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [messageApi, messageContextHolder] = useMessage()

  const [technique, setTechnique] = useState('scroll')
  const [sceneHeight, setSceneHeight] = useState(360)
  const [layers, setLayers] = useState(() => makeDefaultLayers(3))

  const updateLayerCount = (count) => {
    setLayers((prev) => {
      if (count > prev.length) {
        const added = Array.from({ length: count - prev.length }, (_, i) => ({
          color: LAYER_COLORS_DEFAULTS[(prev.length + i) % LAYER_COLORS_DEFAULTS.length],
          factor: LAYER_SPEEDS_DEFAULTS[(prev.length + i) % LAYER_SPEEDS_DEFAULTS.length],
        }))
        return [...prev, ...added]
      }
      return prev.slice(0, count)
    })
  }

  const updateLayerColor = (index, color) => {
    setLayers((prev) => prev.map((l, i) => (i === index ? { ...l, color } : l)))
  }

  const updateLayerFactor = (index, factor) => {
    setLayers((prev) => prev.map((l, i) => (i === index ? { ...l, factor } : l)))
  }

  const isScroll = technique === 'scroll'

  const cssOutput = useMemo(() => {
    if (isScroll) {
      return buildScrollParallaxCss({ sceneHeight, layers })
    }
    return buildStickyParallaxCss({ sceneHeight, layers, sectionLabel: lang === 'pt' ? 'Seção' : 'Section' }).css
  }, [isScroll, sceneHeight, layers, lang])

  const htmlOutput = useMemo(() => {
    if (isScroll) {
      return buildLastHtml({
        sceneHeight,
        layers,
        scrollLabel: lang === 'pt' ? 'Role este conteúdo para ver o parallax' : 'Scroll this content to see the parallax',
      })
    }
    return buildStickyParallaxCss({ sceneHeight, layers, sectionLabel: lang === 'pt' ? 'Seção' : 'Section' }).html
  }, [isScroll, sceneHeight, layers, lang])

  const copy = async (text, successMsg) => {
    try {
      await navigator.clipboard.writeText(text)
      messageApi.success(successMsg)
    } catch {
      messageApi.error(t.copyError)
    }
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {messageContextHolder}

      <style dangerouslySetInnerHTML={{ __html: KEYFRAME_STYLE }} />

      <Title level={2}><PicCenterOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Row gutter={[24, 24]}>
        <Col xs={24} md={10}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Card>
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                  <Text strong>{t.technique}</Text>
                  <Segmented
                    style={{ width: '100%' }}
                    block
                    value={technique}
                    onChange={setTechnique}
                    options={[
                      { value: 'scroll', label: t.techniqueScroll },
                      { value: 'sticky', label: t.techniqueSticky },
                    ]}
                  />
                </Space>

                <Alert
                  type="info"
                  showIcon={false}
                  style={{ marginTop: 4, fontSize: 12 }}
                  message={isScroll ? t.techniqueScrollDesc : t.techniqueStickyDesc}
                />

                <Space style={{ width: '100%', justifyContent: 'space-between', marginTop: 8 }}>
                  <Text>{t.layers}</Text>
                  <Text code>{layers.length}</Text>
                </Space>
                <Slider
                  min={2}
                  max={4}
                  step={1}
                  value={layers.length}
                  onChange={updateLayerCount}
                  marks={{ 2: '2', 3: '3', 4: '4' }}
                />

                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                  <Text>{t.sceneHeight}</Text>
                  <Text code>{sceneHeight}px</Text>
                </Space>
                <Slider
                  min={200}
                  max={560}
                  step={10}
                  value={sceneHeight}
                  onChange={setSceneHeight}
                />
              </Space>
            </Card>

            <Card title={t.layers}>
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                {layers.map((layer, i) => (
                  <Card
                    key={i}
                    size="small"
                    title={<Text type="secondary">Layer {i + 1}</Text>}
                    style={{ background: '#fafafa' }}
                  >
                    <Space direction="vertical" size={4} style={{ width: '100%' }}>
                      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                        <Text>{t.color}</Text>
                        <ColorPicker
                          value={layer.color}
                          onChange={(c) => updateLayerColor(i, c)}
                          size="small"
                        />
                      </Space>
                      {isScroll && (
                        <>
                          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                            <Text>{t.speed}</Text>
                            <Text code style={{ minWidth: 40, textAlign: 'right' }}>
                              {clampSpeed(layer.factor)}
                            </Text>
                          </Space>
                          <Slider
                            min={-1}
                            max={1}
                            step={0.05}
                            value={clampSpeed(layer.factor)}
                            onChange={(v) => updateLayerFactor(i, v)}
                            marks={{
                              '-1': '–1',
                              0: '0',
                              1: '+1',
                            }}
                            tooltip={{
                              formatter: (v) =>
                                v < 0
                                  ? lang === 'pt'
                                    ? 'Fundo'
                                    : 'Background'
                                  : v > 0
                                    ? lang === 'pt'
                                      ? 'Frente'
                                      : 'Foreground'
                                    : lang === 'pt'
                                      ? 'Neutro'
                                      : 'Neutral',
                            }}
                          />
                        </>
                      )}
                    </Space>
                  </Card>
                ))}
              </Space>
            </Card>
          </Space>
        </Col>

        <Col xs={24} md={14}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Card title={t.preview}>
              {isScroll ? (
                <div
                  style={{
                    position: 'relative',
                    height: sceneHeight,
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    border: '1px solid #f0f0f0',
                    borderRadius: 8,
                  }}
                >
                  <div
                    style={{
                      height: sceneHeight * 2.5,
                      padding: 24,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <Text strong style={{ fontSize: 18 }}>
                        {lang === 'pt' ? '↓ Role para ver o parallax' : '↓ Scroll to see the parallax'}
                      </Text>
                      <Paragraph type="secondary" style={{ marginTop: 8, marginBottom: 0 }}>
                        {lang === 'pt'
                          ? 'As camadas coloridas atrás deste texto são fixas ao cenário, mas cada uma se move com velocidade diferente ao scrollar, criando a ilusão de profundidade.'
                          : 'The colored layers behind this text are fixed to the scene, but each one moves at a different speed while scrolling, creating a depth illusion.'}
                      </Paragraph>
                    </div>
                    <Text type="secondary">
                      {lang === 'pt' ? 'Fim do conteúdo' : 'End of content'}
                    </Text>
                  </div>

                  {layers.map((layer, i) => (
                    <div
                      key={i}
                      style={{
                        position: 'absolute',
                        top: -PARALLAX_SHIFT,
                        bottom: -PARALLAX_SHIFT,
                        left: 0,
                        right: 0,
                        pointerEvents: 'none',
                        background: layerColorString(layer.color),
                        animation: 'devtools-parallax linear both',
                        animationTimeline: 'scroll(nearest)',
                        ['--speed']: String(clampSpeed(layer.factor)),
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    height: sceneHeight,
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    border: '1px solid #f0f0f0',
                    borderRadius: 8,
                  }}
                >
                  {layers.map((layer, i) => (
                    <div
                      key={i}
                      style={{ position: 'relative', height: sceneHeight }}
                    >
                      <div
                        style={{
                          position: 'sticky',
                          top: 0,
                          height: sceneHeight,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: layerColorString(layer.color),
                          color: 'rgba(255,255,255,0.95)',
                          fontWeight: 700,
                          letterSpacing: '0.02em',
                          fontSize: 16,
                        }}
                      >
                        {lang === 'pt' ? `Camada ${i + 1}` : `Layer ${i + 1}`}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <Paragraph type="secondary" style={{ marginTop: 12, marginBottom: 0 }}>
                {isScroll ? t.previewHintScroll : t.previewHintSticky}
              </Paragraph>
            </Card>
          </Space>
        </Col>
      </Row>

      <Card
        title={t.output}
        extra={
          <Button size="small" icon={<CopyOutlined />} onClick={() => copy(cssOutput, t.copied)}>
            {t.copy}
          </Button>
        }
      >
        <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 400, fontSize: 12 }}>
          <code>{cssOutput}</code>
        </pre>
      </Card>

      <Card
        title={t.htmlOutput}
        extra={
          <Button size="small" icon={<CopyOutlined />} onClick={() => copy(htmlOutput, t.copiedHtml)}>
            {t.copy}
          </Button>
        }
      >
        <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 320, fontSize: 12 }}>
          <code>{htmlOutput}</code>
        </pre>
      </Card>

      <Collapse
        items={[
          {
            key: 'source',
            label: `${t.source} — cssParallax.js`,
            children: (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Paragraph type="secondary">{t.sourceBody}</Paragraph>
                <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 400 }}>
                  <code>{buildScrollParallaxCss.toString()}</code>
                </pre>
                <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 400 }}>
                  <code>{buildStickyParallaxCss.toString()}</code>
                </pre>
              </Space>
            ),
          },
        ]}
      />
    </Space>
  )
}
