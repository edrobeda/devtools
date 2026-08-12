import React, { useMemo, useState } from 'react'
import {
  Typography, Card, Space, Slider, Segmented, Alert, Button, Collapse,
  message, ColorPicker, Row, Col, Input,
} from 'antd'
import { BgColorsOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  buildGlassmorphismCss,
  buildGlassmorphismHtml,
  buildGlassmorphismFullDemo,
  GLASS_PRESETS,
  BACKGROUND_PRESETS,
} from '../utils/cssGlassmorphismGenerator'

const { Title, Paragraph, Text } = Typography

const translations = {
  pt: {
    title: 'Gerador de Glassmorphism CSS',
    intro: (
      <>
        Monte cards e paineis no estilo vidro fosco usando só CSS. Ajuste a
        transparência, o blur, a saturação, a borda e a sombra; o preview mostra
        o efeito exato sobre um fundo gradiente.
      </>
    ),
    tipTitle: 'Como funciona (e as pegadinhas)',
    tipBody: (
      <>
        O efeito depende de <Text code>backdrop-filter: blur()</Text> para
        borrar o conteúdo que está atrás do elemento. Por isso ele só funciona
        bem sobre cores, imagens ou gradientes fortes — sem contraste, o blur
        não tem o que borrar. Safari também precisa do prefixo{' '}
        <Text code>-webkit-backdrop-filter</Text>. Use{' '}
        <Text code>background-clip: padding-box</Text> para evitar que bordas
        transparentes fiquem com artefatos em alguns navegadores.
      </>
    ),
    settings: 'Configurações do card',
    preset: 'Preset do card',
    className: 'Classe CSS',
    bgColor: 'Cor de fundo',
    opacity: 'Opacidade do fundo',
    blur: 'Blur (backdrop-filter)',
    saturate: 'Saturacao',
    borderWidth: 'Espessura da borda',
    borderColor: 'Cor da borda',
    borderOpacity: 'Opacidade da borda',
    borderRadius: 'Border radius',
    padding: 'Padding interno',
    shadow: 'Sombra',
    shadowX: 'Deslocamento X',
    shadowY: 'Deslocamento Y',
    shadowBlur: 'Desfoque',
    shadowSpread: 'Spread',
    shadowColor: 'Cor da sombra',
    shadowOpacity: 'Opacidade da sombra',
    preview: 'Preview',
    previewHint: 'O card abaixo usa exatamente o CSS gerado. O fundo e so para visualização.',
    previewText: 'Texto do preview',
    bgPreset: 'Fundo do preview',
    bgColor1: 'Cor 1 do fundo',
    bgColor2: 'Cor 2 do fundo',
    bgAngle: 'Angulo do gradiente',
    outputCss: 'CSS gerado',
    outputHtml: 'HTML de exemplo',
    outputFull: 'Bloco completo',
    copy: 'Copiar',
    copied: 'Copiado!',
    copyError: 'Não foi possível copiar',
    sourceCol: 'Código-fonte',
    sourceBody:
      'O nucleo vive em src/utils/cssGlassmorphismGenerator.js. buildGlassmorphismCss converte as cores para rgba usando a opacidade escolhida, monta as regras de backdrop-filter (com prefixo WebKit), borda, border-radius, padding, background-clip e box-shadow. buildGlassmorphismHtml gera o markup de exemplo e buildGlassmorphismFullDemo junta tudo num único bloco.',
  },
  en: {
    title: 'CSS Glassmorphism Generator',
    intro: (
      <>
        Build frosted-glass cards and panels with CSS only. Adjust transparency,
        blur, saturation, border and shadow; the preview shows the exact effect
        over a gradient background.
      </>
    ),
    tipTitle: 'How it works (and the gotchas)',
    tipBody: (
      <>
        The effect relies on <Text code>backdrop-filter: blur()</Text> to blur
        whatever is behind the element, so it only looks good over strong colors,
        images or gradients — without contrast there is nothing for the blur to
        blur. Safari also needs the <Text code>-webkit-backdrop-filter</Text>{' '}
        prefix. Use <Text code>background-clip: padding-box</Text> to prevent
        transparent borders from showing artifacts in some browsers.
      </>
    ),
    settings: 'Card settings',
    preset: 'Card preset',
    className: 'CSS class',
    bgColor: 'Background color',
    opacity: 'Background opacity',
    blur: 'Blur (backdrop-filter)',
    saturate: 'Saturation',
    borderWidth: 'Border width',
    borderColor: 'Border color',
    borderOpacity: 'Border opacity',
    borderRadius: 'Border radius',
    padding: 'Inner padding',
    shadow: 'Shadow',
    shadowX: 'X offset',
    shadowY: 'Y offset',
    shadowBlur: 'Blur',
    shadowSpread: 'Spread',
    shadowColor: 'Shadow color',
    shadowOpacity: 'Shadow opacity',
    preview: 'Preview',
    previewHint: 'The card below uses exactly the generated CSS. The background is only for visualization.',
    previewText: 'Preview text',
    bgPreset: 'Preview background',
    bgColor1: 'Background color 1',
    bgColor2: 'Background color 2',
    bgAngle: 'Gradient angle',
    outputCss: 'Generated CSS',
    outputHtml: 'Example HTML',
    outputFull: 'Full snippet',
    copy: 'Copy',
    copied: 'Copied!',
    copyError: 'Could not copy',
    sourceCol: 'Source code',
    sourceBody:
      'The core lives in src/utils/cssGlassmorphismGenerator.js. buildGlassmorphismCss converts the colors to rgba using the chosen opacity, builds the backdrop-filter rules (with WebKit prefix), border, border-radius, padding, background-clip and box-shadow. buildGlassmorphismHtml generates the example markup and buildGlassmorphismFullDemo joins everything in a single block.',
  },
}

const PREVIEW_CLASS = 'devtools-glass-preview'

export default function CssGlassmorphismGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [messageApi, messageContextHolder] = message.useMessage()

  const [className, setClassName] = useState('glass-card')
  const [bgColor, setBgColor] = useState('#ffffff')
  const [opacity, setOpacity] = useState(0.12)
  const [blur, setBlur] = useState(14)
  const [saturate, setSaturate] = useState(150)
  const [borderWidth, setBorderWidth] = useState(1)
  const [borderColor, setBorderColor] = useState('#ffffff')
  const [borderOpacity, setBorderOpacity] = useState(0.25)
  const [borderRadius, setBorderRadius] = useState(16)
  const [padding, setPadding] = useState(24)
  const [shadowX, setShadowX] = useState(0)
  const [shadowY, setShadowY] = useState(8)
  const [shadowBlur, setShadowBlur] = useState(32)
  const [shadowSpread, setShadowSpread] = useState(0)
  const [shadowColor, setShadowColor] = useState('#1f26a9')
  const [shadowOpacity, setShadowOpacity] = useState(0.25)
  const [previewText, setPreviewText] = useState('Glassmorphism')

  const [bgColor1, setBgColor1] = useState('#667eea')
  const [bgColor2, setBgColor2] = useState('#764ba2')
  const [bgAngle, setBgAngle] = useState(135)

  const options = useMemo(
    () => ({
      className: PREVIEW_CLASS,
      bgColor,
      opacity,
      blur,
      saturate,
      borderWidth,
      borderColor,
      borderOpacity,
      borderRadius,
      padding,
      shadowX,
      shadowY,
      shadowBlur,
      shadowSpread,
      shadowColor,
      shadowOpacity,
    }),
    [
      bgColor, opacity, blur, saturate, borderWidth, borderColor, borderOpacity,
      borderRadius, padding, shadowX, shadowY, shadowBlur, shadowSpread, shadowColor,
      shadowOpacity,
    ]
  )

  const css = useMemo(() => buildGlassmorphismCss(options), [options])
  const html = useMemo(() => buildGlassmorphismHtml(PREVIEW_CLASS, previewText), [previewText])
  const fullDemo = useMemo(() => buildGlassmorphismFullDemo(options, previewText), [options, previewText])

  const applyPreset = (key) => {
    const p = GLASS_PRESETS.find((x) => x.key === key)
    if (!p) return
    const o = p.opts
    setBgColor(o.bgColor)
    setOpacity(o.opacity)
    setBlur(o.blur)
    setSaturate(o.saturate)
    setBorderWidth(o.borderWidth)
    setBorderColor(o.borderColor)
    setBorderOpacity(o.borderOpacity)
    setBorderRadius(o.borderRadius)
    setPadding(o.padding)
    setShadowX(o.shadowX)
    setShadowY(o.shadowY)
    setShadowBlur(o.shadowBlur)
    setShadowSpread(o.shadowSpread)
    setShadowColor(o.shadowColor)
    setShadowOpacity(o.shadowOpacity)
  }

  const applyBgPreset = (key) => {
    const p = BACKGROUND_PRESETS.find((x) => x.key === key)
    if (!p) return
    setBgColor1(p.opts.color1)
    setBgColor2(p.opts.color2)
    setBgAngle(p.opts.angle)
  }

  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      messageApi.success(t.copied)
    } catch {
      messageApi.error(t.copyError)
    }
  }

  const labelValue = (value, unit = '') => (
    <Space style={{ width: '100%', justifyContent: 'space-between' }}>
      <Text>{value}</Text>
      <Text code>{unit}</Text>
    </Space>
  )

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
                options={GLASS_PRESETS.map((p) => ({ value: p.key, label: p.name[lang] }))}
              />

              <Space direction="vertical" size={4} style={{ width: '100%', marginTop: 8 }}>
                <Text>{t.className}</Text>
                <Input value={className} onChange={(e) => setClassName(e.target.value)} />
              </Space>

              <Row gutter={[16, 12]}>
                <Col span={12}>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text>{t.bgColor}</Text>
                    <ColorPicker value={bgColor} onChange={(c) => setBgColor(c.toHexString())} showText />
                  </Space>
                </Col>
                <Col span={12}>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text>{t.borderColor}</Text>
                    <ColorPicker value={borderColor} onChange={(c) => setBorderColor(c.toHexString())} showText />
                  </Space>
                </Col>
              </Row>

              {labelValue(t.opacity, opacity.toFixed(2))}
              <Slider min={0.01} max={1} step={0.01} value={opacity} onChange={setOpacity} />

              {labelValue(t.blur, `${blur}px`)}
              <Slider min={0} max={40} value={blur} onChange={setBlur} />

              {labelValue(t.saturate, `${saturate}%`)}
              <Slider min={100} max={200} value={saturate} onChange={setSaturate} />

              {labelValue(t.borderWidth, `${borderWidth}px`)}
              <Slider min={0} max={8} value={borderWidth} onChange={setBorderWidth} />

              {labelValue(t.borderOpacity, borderOpacity.toFixed(2))}
              <Slider min={0} max={1} step={0.01} value={borderOpacity} onChange={setBorderOpacity} />

              {labelValue(t.borderRadius, `${borderRadius}px`)}
              <Slider min={0} max={48} value={borderRadius} onChange={setBorderRadius} />

              {labelValue(t.padding, `${padding}px`)}
              <Slider min={0} max={64} value={padding} onChange={setPadding} />

              <Text strong>{t.shadow}</Text>

              <Row gutter={16}>
                <Col span={12}>
                  {labelValue(t.shadowX, `${shadowX}px`)}
                  <Slider min={-40} max={40} value={shadowX} onChange={setShadowX} />
                </Col>
                <Col span={12}>
                  {labelValue(t.shadowY, `${shadowY}px`)}
                  <Slider min={0} max={60} value={shadowY} onChange={setShadowY} />
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  {labelValue(t.shadowBlur, `${shadowBlur}px`)}
                  <Slider min={0} max={80} value={shadowBlur} onChange={setShadowBlur} />
                </Col>
                <Col span={12}>
                  {labelValue(t.shadowSpread, `${shadowSpread}px`)}
                  <Slider min={-20} max={40} value={shadowSpread} onChange={setShadowSpread} />
                </Col>
              </Row>

              <Row gutter={[16, 12]}>
                <Col span={12}>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text>{t.shadowColor}</Text>
                    <ColorPicker value={shadowColor} onChange={(c) => setShadowColor(c.toHexString())} showText />
                  </Space>
                </Col>
                <Col span={12}>
                  {labelValue(t.shadowOpacity, shadowOpacity.toFixed(2))}
                  <Slider min={0} max={1} step={0.01} value={shadowOpacity} onChange={setShadowOpacity} />
                </Col>
              </Row>
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={14}>
          <Card title={t.preview}>
            <style>{css.css}</style>
            <div
              style={{
                border: '1px solid #f0f0f0',
                borderRadius: 8,
                padding: 32,
                minHeight: 260,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: `linear-gradient(${bgAngle}deg, ${bgColor1}, ${bgColor2})`,
              }}
            >
              <div className={PREVIEW_CLASS} style={{ color: '#fff', minWidth: 220 }}>
                <Text style={{ fontSize: 22, fontWeight: 700, color: 'inherit', display: 'block' }}>
                  {previewText}
                </Text>
                <Paragraph style={{ color: 'rgba(255,255,255,0.85)', margin: '8px 0 0' }}>
                  {lang === 'pt'
                    ? 'Ajuste os controles ao lado para ver o efeito de vidro fosco em tempo real.'
                    : 'Adjust the controls to see the frosted-glass effect in real time.'}
                </Paragraph>
              </div>
            </div>

            <Space direction="vertical" size="small" style={{ width: '100%', marginTop: 16 }}>
              <Text>{t.previewText}</Text>
              <Input value={previewText} onChange={(e) => setPreviewText(e.target.value)} />

              <Text>{t.bgPreset}</Text>
              <Segmented
                style={{ width: '100%' }}
                block
                value={null}
                onChange={applyBgPreset}
                options={BACKGROUND_PRESETS.map((p) => ({ value: p.key, label: p.name[lang] }))}
              />

              <Row gutter={[16, 12]}>
                <Col span={12}>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text>{t.bgColor1}</Text>
                    <ColorPicker value={bgColor1} onChange={(c) => setBgColor1(c.toHexString())} showText />
                  </Space>
                </Col>
                <Col span={12}>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text>{t.bgColor2}</Text>
                    <ColorPicker value={bgColor2} onChange={(c) => setBgColor2(c.toHexString())} showText />
                  </Space>
                </Col>
              </Row>

              {labelValue(t.bgAngle, `${bgAngle}°`)}
              <Slider min={0} max={360} value={bgAngle} onChange={setBgAngle} />
            </Space>

            <Paragraph type="secondary" style={{ marginTop: 12, marginBottom: 0 }}>
              {t.previewHint}
            </Paragraph>
          </Card>
        </Col>
      </Row>

      <Collapse
        defaultActiveKey={['css']}
        items={[
          {
            key: 'css',
            label: t.outputCss,
            children: (
              <Card
                extra={(
                  <Button size="small" icon={<CopyOutlined />} onClick={() => copy(css.css)}>
                    {t.copy}
                  </Button>
                )}
              >
                <pre style={{ margin: 0, overflowX: 'auto' }}>
                  <code>{css.css}</code>
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
            label: `${t.sourceCol} — buildGlassmorphismCss`,
            children: (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Paragraph type="secondary">{t.sourceBody}</Paragraph>
                <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 420 }}>
                  <code>{buildGlassmorphismCss.toString()}</code>
                </pre>
              </Space>
            ),
          },
        ]}
      />
    </Space>
  )
}
