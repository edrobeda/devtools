import React, { useMemo, useState } from 'react'
import {
  Typography, Card, Space, Slider, Segmented, Alert, Button, Collapse,
  message, ColorPicker, Row, Col, Input, Select, Tabs, InputNumber,
} from 'antd'
import { BgColorsOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  buildCursorCss,
  buildCursorHtml,
  buildCursorFullDemo,
  buildSvgString,
  svgToDataUri,
  PRESETS,
  DEFAULTS,
  SHAPES,
  FALLBACK_OPTIONS,
} from '../utils/cssCursorGenerator'

const { Title, Paragraph, Text } = Typography
const { useMessage } = message

const PRESET_ORDER = ['default', 'pointer', 'crosshair', 'text', 'move', 'help', 'zoom-in', 'heart']

const translations = {
  pt: {
    heading: 'Gerador de Cursor Personalizado CSS',
    intro: (
      <>
        Crie cursores customizados para aplicações web usando SVG embutido em
        data URI puramente no navegador. Escolha uma forma pronta ou cole um SVG
        próprio, ajuste o hotspot (ponto de clique) e o fallback, e copie a
        regra CSS gerada.
      </>
    ),
    tipTitle: 'Dicas e limitações',
    tipBody: (
      <>
        O cursor é aplicado pela propriedade{' '}
        <Text code>{'cursor: url("...") X Y, fallback;'}</Text>. O hotspot X/Y
        indica em qual pixel da imagem fica a "ponta" do clique. Cursores
        personalizados funcionam na maioria dos navegadores desktop modernos, mas
        podem ser ignorados em dispositivos touch. SVGs muito grandes podem ser
        rejeitados — mantenha a imagem pequena (máx. recomendado 128×128).
      </>
    ),
    settings: 'Configurações',
    presets: 'Presets',
    shape: 'Forma do cursor',
    shapeCustom: 'SVG próprio',
    color: 'Cor do SVG',
    customSvg: 'SVG customizado',
    customSvgHint: 'Cole um SVG completo. Use {COLOR} para substituir pela cor acima.',
    size: 'Tamanho da imagem (px)',
    hotspot: 'Hotspot (ponto de clique)',
    hotspotX: 'X',
    hotspotY: 'Y',
    fallback: 'Cursor de fallback',
    className: 'Classe CSS alvo',
    preview: 'Pré-visualização',
    previewHint: 'Passe o mouse sobre a área abaixo para ver o cursor gerado.',
    svgPreview: 'Preview do SVG',
    outputCss: 'CSS gerado',
    outputHtml: 'HTML de exemplo',
    outputFull: 'Bloco completo',
    copy: 'Copiar',
    copied: 'Copiado!',
    copyError: 'Não foi possível copiar',
    sourceCol: 'Código-fonte',
    sourceBody:
      'O núcleo vive em src/utils/cssCursorGenerator.js. buildSvgString monta o SVG final a partir de um preset ou de um SVG customizado; svgToDataUri converte para data URI; buildCursorValue monta o valor da propriedade cursor com hotspot e fallback; buildCursorCss gera a regra pronta.',
  },
  en: {
    heading: 'CSS Custom Cursor Generator',
    intro: (
      <>
        Create custom web cursors using inline SVG data URIs, entirely in the
        browser. Pick a preset shape or paste your own SVG, adjust the click
        hotspot and fallback cursor, and copy the generated CSS rule.
      </>
    ),
    tipTitle: 'Tips and limitations',
    tipBody: (
      <>
        The cursor is set via{' '}
        <Text code>{'cursor: url("...") X Y, fallback;'}</Text>. The X/Y hotspot
        marks where the click point is inside the image. Custom cursors work on
        most modern desktop browsers but may be ignored on touch devices. Very
        large SVGs can be rejected — keep the image small (max recommended
        128×128).
      </>
    ),
    settings: 'Settings',
    presets: 'Presets',
    shape: 'Cursor shape',
    shapeCustom: 'Custom SVG',
    color: 'SVG color',
    customSvg: 'Custom SVG',
    customSvgHint: 'Paste a complete SVG. Use {COLOR} to replace with the color above.',
    size: 'Image size (px)',
    hotspot: 'Hotspot (click point)',
    hotspotX: 'X',
    hotspotY: 'Y',
    fallback: 'Fallback cursor',
    className: 'Target CSS class',
    preview: 'Preview',
    previewHint: 'Hover over the area below to see the generated cursor.',
    svgPreview: 'SVG preview',
    outputCss: 'Generated CSS',
    outputHtml: 'Example HTML',
    outputFull: 'Full block',
    copy: 'Copy',
    copied: 'Copied!',
    copyError: 'Could not copy',
    sourceCol: 'Source code',
    sourceBody:
      'The core lives in src/utils/cssCursorGenerator.js. buildSvgString builds the final SVG from a preset or custom input; svgToDataUri converts it to a data URI; buildCursorValue assembles the cursor property with hotspot and fallback; buildCursorCss returns the ready-to-use rule.',
  },
}

export default function CssCursorGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [messageApi, messageContextHolder] = useMessage()

  const [shape, setShape] = useState(DEFAULTS.shape)
  const [color, setColor] = useState(DEFAULTS.color)
  const [customSvg, setCustomSvg] = useState(DEFAULTS.customSvg)
  const [size, setSize] = useState(DEFAULTS.size)
  const [hotspotX, setHotspotX] = useState(DEFAULTS.hotspotX)
  const [hotspotY, setHotspotY] = useState(DEFAULTS.hotspotY)
  const [fallback, setFallback] = useState(DEFAULTS.fallback)
  const [className, setClassName] = useState(DEFAULTS.className)

  const options = useMemo(() => ({
    shape,
    color,
    customSvg,
    size,
    hotspotX,
    hotspotY,
    fallback,
    className,
  }), [shape, color, customSvg, size, hotspotX, hotspotY, fallback, className])

  const css = useMemo(() => buildCursorCss(options), [options])
  const html = useMemo(() => buildCursorHtml(options), [options])
  const full = useMemo(() => buildCursorFullDemo(options), [options])
  const svgString = useMemo(() => buildSvgString(shape, color, customSvg, size), [shape, color, customSvg, size])
  const svgDataUri = useMemo(() => svgToDataUri(svgString), [svgString])

  const applyPreset = (key) => {
    const p = PRESETS[key]
    if (!p) return
    setShape(p.shape)
    setColor(p.color)
    setCustomSvg(p.customSvg)
    setSize(p.size)
    setHotspotX(p.hotspotX)
    setHotspotY(p.hotspotY)
    setFallback(p.fallback)
  }

  const copyToClipboard = async (value) => {
    try {
      await navigator.clipboard.writeText(value)
      messageApi.success(t.copied)
    } catch {
      messageApi.error(t.copyError)
    }
  }

  const shapeOptions = useMemo(() => {
    const entries = Object.keys(SHAPES).map((key) => ({ label: key, value: key }))
    return [...entries, { label: t.shapeCustom, value: 'custom' }]
  }, [t.shapeCustom])

  const fallbackOptions = useMemo(() => FALLBACK_OPTIONS.map((v) => ({ label: v, value: v })), [])

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
                  {key}
                </Button>
              ))}
            </Space>
          </Card>

          <Card title={t.settings} size="small">
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <div>
                <Text strong>{t.shape}</Text>
                <Segmented
                  options={shapeOptions}
                  value={customSvg.trim() ? 'custom' : shape}
                  onChange={(v) => {
                    if (v === 'custom') {
                      setCustomSvg(customSvg || SHAPES[shape]?.svg || '')
                    } else {
                      setShape(v)
                      setCustomSvg('')
                    }
                  }}
                  block
                />
              </div>

              <div>
                <Text strong>{t.color}</Text>
                <div>
                  <ColorPicker
                    value={color}
                    onChange={(c) => setColor(c.toHexString())}
                    showText
                  />
                </div>
              </div>

              {customSvg.trim() && (
                <div>
                  <Text strong>{t.customSvg}</Text>
                  <Paragraph type="secondary" style={{ fontSize: 12 }}>
                    {t.customSvgHint}
                  </Paragraph>
                  <Input.TextArea
                    value={customSvg}
                    onChange={(e) => setCustomSvg(e.target.value)}
                    rows={6}
                    spellCheck={false}
                  />
                </div>
              )}

              <div>
                <Text strong>{t.size}</Text>
                <Slider min={8} max={128} value={size} onChange={setSize} />
              </div>

              <Row gutter={16}>
                <Col span={12}>
                  <Text strong>{t.hotspotX}</Text>
                  <InputNumber
                    min={0}
                    max={999}
                    value={hotspotX}
                    onChange={(v) => setHotspotX(v ?? 0)}
                    style={{ width: '100%' }}
                  />
                </Col>
                <Col span={12}>
                  <Text strong>{t.hotspotY}</Text>
                  <InputNumber
                    min={0}
                    max={999}
                    value={hotspotY}
                    onChange={(v) => setHotspotY(v ?? 0)}
                    style={{ width: '100%' }}
                  />
                </Col>
              </Row>

              <div>
                <Text strong>{t.fallback}</Text>
                <Select
                  options={fallbackOptions}
                  value={fallback}
                  onChange={setFallback}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <Text strong>{t.className}</Text>
                <Input
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                />
              </div>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={14}>
          <Card title={t.preview} style={{ marginBottom: 24 }}>
            <Paragraph type="secondary">{t.previewHint}</Paragraph>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 220,
                background: 'rgba(0,0,0,0.02)',
                borderRadius: 8,
                border: '1px dashed #d9d9d9',
              }}
            >
              <style>{css}</style>
              <div className={className || 'custom-cursor'}>
                <Text type="secondary">{t.previewHint}</Text>
              </div>
            </div>

            <div style={{ marginTop: 16 }}>
              <Text strong>{t.svgPreview}</Text>
              <div style={{ marginTop: 8, padding: 16, background: '#f6f8fa', borderRadius: 8, display: 'inline-block' }}>
                <img src={svgDataUri} alt="cursor" width={size} height={size} style={{ display: 'block' }} />
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
