import React, { useMemo, useRef, useState } from 'react'
import { Typography, Card, Space, Input, Segmented, Button, ColorPicker, Switch, Alert, Collapse, message } from 'antd'
import { PictureOutlined, CopyOutlined, CheckOutlined, DownloadOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import { buildBadgeSvg, buildBadgeMarkdown, buildBadgeHtml, buildBadgeRst, measureTexts, STYLE_CONFIG } from '../utils/svgBadgeGenerator'

const { Title, Paragraph, Text } = Typography

const SOURCE = `// src/utils/svgBadgeGenerator.js (resumo)
// 1. Mede os textos no <canvas> com a fonte e tamanho do estilo escolhido.
function measureTexts(label, message, styleKey, logo, canvasCtx) {
  const style = STYLE_CONFIG[styleKey]
  canvasCtx.font = \`\${style.fontWeight} \${style.fontSize}px Verdana,...\`
  return {
    labelWidth: Math.ceil(canvasCtx.measureText(label).width),
    messageWidth: Math.ceil(canvasCtx.measureText(message).width),
    logoWidth: logo ? style.height - 4 : 0,
  }
}

// 2. Calcula as dimensões totais a partir das larguras.
function computeDimensions(measurements, styleKey, hasLabel) {
  const style = STYLE_CONFIG[styleKey]
  const labelW = hasLabel ? measurements.labelWidth + style.padX * 2 + measurements.logoWidth : 0
  const messageW = measurements.messageWidth + style.padX * 2
  return { width: labelW + messageW, height: style.height, splitX: labelW }
}

// 3. Desenha cada lado como um path com cantos arredondados apenas nas pontas,
//    injetando gradiente linear (plastic) e filtro de sombra quando ativados.
function roundedRectPath(x, y, w, h, r, left, right) { ... }

// 4. Monta a string SVG final com <text> centralizados e logo opcional.
function buildBadgeSvg(measurements, options) { ... }`

const PRESETS = [
  { key: 'build', label: 'Build passing', message: 'passing', color: '#4c1', labelColor: '#555', logo: '' },
  { key: 'coverage', label: 'coverage', message: '92%', color: '#007ec6', labelColor: '#555', logo: '' },
  { key: 'version', label: 'npm', message: 'v5.2.0', color: '#cb3837', labelColor: '#555', logo: '📦' },
  { key: 'license', label: 'license', message: 'MIT', color: '#97ca00', labelColor: '#555', logo: '' },
  { key: 'downloads', label: 'downloads', message: '1M/mo', color: '#9f9f9f', labelColor: '#555', logo: '⬇' },
]

const translations = {
  pt: {
    title: 'Gerador de Badge SVG',
    intro: (
      <>
        Crie badges/shields no estilo shields.io diretamente no navegador,
        prontos para READMEs, documentação e sites. Personalize label, mensagem,
        cores, estilo e logo; copie o SVG, Markdown, HTML ou reStructuredText.
        100% client-side, nada sai do navegador.
      </>
    ),
    contentTitle: 'Conteúdo',
    label: 'Label',
    message: 'Mensagem',
    logo: 'Logo (emoji/letra)',
    style: 'Estilo',
    colorsTitle: 'Cores',
    labelColor: 'Fundo do label',
    messageColor: 'Fundo da mensagem',
    textColor: 'Cor do texto',
    logoColor: 'Cor do logo',
    optionsTitle: 'Opções',
    presetsTitle: 'Exemplos de um clique',
    previewTitle: 'Preview ao vivo',
    previewHint: 'O SVG abaixo é exatamente o que será copiado.',
    outputsTitle: 'Versões prontas pra copiar',
    svgLabel: 'SVG',
    markdownLabel: 'Markdown',
    htmlLabel: 'HTML',
    rstLabel: 'reStructuredText',
    download: 'Baixar .svg',
    copy: 'Copiar',
    copied: 'Copiado!',
    copyError: 'Não foi possível copiar',
    bytes: (n) => `${n} ${n === 1 ? 'byte' : 'bytes'}`,
    tipTitle: 'Como usar',
    tipBody: (
      <>
        Cole o Markdown direto no README do GitHub/GitLab ou use o SVG inline no
        seu site. Para READMEs prefira o SVG inline ou data URI (Markdown), já
        que shields de terceiros podem ficar offline. Se quiser hospedar o
        arquivo, baixe o <Text code>.svg</Text> e referencie-o normalmente.
      </>
    ),
    howItWorks: 'Como funciona — algoritmo-fonte',
    howItWorksDesc:
      'Como a largura de textos em SVG depende da fonte renderizadora, medimos label e message em um <canvas> com a mesma família tipográfica e peso do estilo escolhido. A partir das larguras calculamos a largura total, dividimos o badge em dois retângulos com cantos arredondados apenas nas pontas e centralizamos os textos em cada lado.',
    styleOptions: {
      flat: 'Flat',
      'flat-square': 'Flat square',
      plastic: 'Plastic',
      'for-the-badge': 'For the Badge',
    },
  },
  en: {
    title: 'SVG Badge Generator',
    intro: (
      <>
        Create shields.io-style badges directly in the browser, ready for
        READMEs, documentation and websites. Customize label, message, colors,
        style and logo; copy the SVG, Markdown, HTML or reStructuredText output.
        100% client-side, nothing leaves the browser.
      </>
    ),
    contentTitle: 'Content',
    label: 'Label',
    message: 'Message',
    logo: 'Logo (emoji/letter)',
    style: 'Style',
    colorsTitle: 'Colors',
    labelColor: 'Label background',
    messageColor: 'Message background',
    textColor: 'Text color',
    logoColor: 'Logo color',
    optionsTitle: 'Options',
    presetsTitle: 'One-click presets',
    previewTitle: 'Live preview',
    previewHint: 'The SVG below is exactly what will be copied.',
    outputsTitle: 'Ready-to-copy outputs',
    svgLabel: 'SVG',
    markdownLabel: 'Markdown',
    htmlLabel: 'HTML',
    rstLabel: 'reStructuredText',
    download: 'Download .svg',
    copy: 'Copy',
    copied: 'Copied!',
    copyError: 'Could not copy',
    bytes: (n) => `${n} ${n === 1 ? 'byte' : 'bytes'}`,
    tipTitle: 'How to use',
    tipBody: (
      <>
        Paste the Markdown directly into a GitHub/GitLab README or use the
        inline SVG on your site. For READMEs prefer inline SVG or data URI
        Markdown, since third-party shields can go offline. If you want to host
        the file, download the <Text code>.svg</Text> and reference it as usual.
      </>
    ),
    howItWorks: 'How it works — source algorithm',
    howItWorksDesc:
      'Because SVG text width depends on the renderer font, we measure label and message on an off-screen <canvas> using the same font family and weight as the chosen style. From those widths we compute the total badge width, split it into two rectangles with rounded corners only at the outer edges, and center the texts on each side.',
    styleOptions: {
      flat: 'Flat',
      'flat-square': 'Flat square',
      plastic: 'Plastic',
      'for-the-badge': 'For the Badge',
    },
  },
}

function OutputBlock({ label, value, copied, onCopy, copyLabel, copiedLabel }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <Text strong style={{ fontSize: 13 }}>{label}</Text>
        <Button size="small" type="primary" icon={copied ? <CheckOutlined /> : <CopyOutlined />} onClick={onCopy}>
          {copied ? copiedLabel : copyLabel}
        </Button>
      </div>
      <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 150, overflowY: 'auto', fontSize: 12, background: '#fafafa', padding: '8px 10px', borderRadius: 6 }}>
        <code>{value}</code>
      </pre>
    </div>
  )
}

export default function SvgBadgeGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [label, setLabel] = useState('build')
  const [message, setMessage] = useState('passing')
  const [logo, setLogo] = useState('')
  const [style, setStyle] = useState('flat')
  const [labelColor, setLabelColor] = useState('#555555')
  const [color, setColor] = useState('#44cc11')
  const [textColor, setTextColor] = useState('#ffffff')
  const [logoColor, setLogoColor] = useState('#ffffff')
  const [copied, setCopied] = useState(null)

  const canvasRef = useRef(null)

  const measurements = useMemo(() => {
    const canvas = canvasRef.current || document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    return measureTexts(label, message, style, logo, ctx)
  }, [label, message, style, logo])

  const options = useMemo(
    () => ({ label, message, labelColor, color, style, logo, logoColor, textColor }),
    [label, message, labelColor, color, style, logo, logoColor, textColor]
  )

  const svgCode = useMemo(() => buildBadgeSvg(measurements, options), [measurements, options])
  const markdownCode = useMemo(() => buildBadgeMarkdown(label, message, svgCode), [label, message, svgCode])
  const htmlCode = useMemo(() => buildBadgeHtml(svgCode), [svgCode])
  const rstCode = useMemo(() => buildBadgeRst(label, message, svgCode), [label, message, svgCode])

  async function copy(text, key) {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(key)
      setTimeout(() => setCopied(null), 1500)
    } catch {
      message.error(t.copyError)
    }
  }

  function downloadSvg() {
    const blob = new Blob([svgCode], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `badge-${label || 'shield'}.svg`
    a.click()
    URL.revokeObjectURL(url)
  }

  function applyPreset(p) {
    setLabel(p.label)
    setMessage(p.message)
    setColor(p.color)
    setLabelColor(p.labelColor)
    setLogo(p.logo || '')
  }

  const styleOptions = [
    { label: t.styleOptions.flat, value: 'flat' },
    { label: t.styleOptions['flat-square'], value: 'flat-square' },
    { label: t.styleOptions.plastic, value: 'plastic' },
    { label: t.styleOptions['for-the-badge'], value: 'for-the-badge' },
  ]

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><PictureOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <Card title={t.contentTitle}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Space wrap align="center">
            <Space>
              <Text type="secondary">{t.label}</Text>
              <Input value={label} onChange={(e) => setLabel(e.target.value)} style={{ width: 160 }} />
            </Space>
            <Space>
              <Text type="secondary">{t.message}</Text>
              <Input value={message} onChange={(e) => setMessage(e.target.value)} style={{ width: 160 }} />
            </Space>
            <Space>
              <Text type="secondary">{t.logo}</Text>
              <Input value={logo} onChange={(e) => setLogo(e.target.value)} style={{ width: 80 }} maxLength={2} />
            </Space>
          </Space>
          <Space wrap align="center">
            <Text type="secondary">{t.style}</Text>
            <Segmented value={style} onChange={setStyle} options={styleOptions} />
          </Space>
        </Space>
      </Card>

      <Card title={t.colorsTitle}>
        <Space wrap align="center" size="large">
          <Space>
            <Text type="secondary">{t.labelColor}</Text>
            <ColorPicker value={labelColor} onChange={(c) => setLabelColor(c.toHexString())} showText />
          </Space>
          <Space>
            <Text type="secondary">{t.messageColor}</Text>
            <ColorPicker value={color} onChange={(c) => setColor(c.toHexString())} showText />
          </Space>
          <Space>
            <Text type="secondary">{t.textColor}</Text>
            <ColorPicker value={textColor} onChange={(c) => setTextColor(c.toHexString())} showText />
          </Space>
          <Space>
            <Text type="secondary">{t.logoColor}</Text>
            <ColorPicker value={logoColor} onChange={(c) => setLogoColor(c.toHexString())} showText />
          </Space>
        </Space>
      </Card>

      <Card title={t.presetsTitle}>
        <Space size={[8, 8]} wrap>
          {PRESETS.map((p) => (
            <Button key={p.key} size="small" onClick={() => applyPreset(p)}>
              {p.label} — {p.message}
            </Button>
          ))}
        </Space>
      </Card>

      <Card title={t.previewTitle}>
        <div style={{ marginBottom: 8, fontSize: 12, color: '#999' }}>{t.previewHint}</div>
        <div style={{ border: '1px solid #e8e8e8', borderRadius: 8, padding: 24, background: 'repeating-conic-gradient(#f6f6f6 0% 25%, #fff 0% 50%) 0 0 / 20px 20px' }}>
          <div dangerouslySetInnerHTML={{ __html: svgCode }} />
        </div>
      </Card>

      <Card title={t.outputsTitle}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <OutputBlock label={t.svgLabel} value={svgCode} copied={copied === 'svg'} onCopy={() => copy(svgCode, 'svg')} copyLabel={t.copy} copiedLabel={t.copied} />
          <OutputBlock label={t.markdownLabel} value={markdownCode} copied={copied === 'md'} onCopy={() => copy(markdownCode, 'md')} copyLabel={t.copy} copiedLabel={t.copied} />
          <OutputBlock label={t.htmlLabel} value={htmlCode} copied={copied === 'html'} onCopy={() => copy(htmlCode, 'html')} copyLabel={t.copy} copiedLabel={t.copied} />
          <OutputBlock label={t.rstLabel} value={rstCode} copied={copied === 'rst'} onCopy={() => copy(rstCode, 'rst')} copyLabel={t.copy} copiedLabel={t.copied} />
          <Space>
            <Button icon={<DownloadOutlined />} onClick={downloadSvg}>{t.download}</Button>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {t.svgLabel}: {t.bytes(svgCode.length)}
            </Text>
          </Space>
        </Space>
      </Card>

      <Alert type="info" showIcon message={t.tipTitle} description={t.tipBody} />

      <Card title={t.howItWorks}>
        <Paragraph type="secondary">{t.howItWorksDesc}</Paragraph>
        <Collapse
          items={[
            {
              key: 'src',
              label: <Text code>svgBadgeGenerator.js</Text>,
              children: <pre style={{ margin: 0, fontSize: 12, lineHeight: 1.6 }}>{SOURCE}</pre>,
            },
          ]}
        />
      </Card>
    </Space>
  )
}
