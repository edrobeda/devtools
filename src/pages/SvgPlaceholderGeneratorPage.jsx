import React, { useMemo, useState } from 'react'
import { Typography, Card, Space, Input, InputNumber, Segmented, Button, Alert, Collapse, message } from 'antd'
import { PictureOutlined, CopyOutlined, CheckOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

// ─── Encoders (os mesmos exibidos como fonte da página) ─────────────────
function svgToBase64(svg) {
  const bytes = new TextEncoder().encode(svg)
  let bin = ''
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
  return btoa(bin)
}

function escXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

const ENCODER_SOURCE = `
// 1) monta o SVG como string (fundo sólido ou gradiente, texto opcional)
const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="240">…</svg>'

// 2) três formas de embutir o mesmo SVG
const inflate = encodeURIComponent(svg)         // URL-safe, menor
const srcAttr = \`data:image/svg+xml;charset=utf-8,\${inflate}\`
const base64  = \`data:image/svg+xml;base64,\${svgToBase64(svg)}\`
const cssUrl  = \`url("data:image/svg+xml;utf8,\${inflate}")\`

// base64 sem lib externa: bytes UTF-8 -> binária -> btoa
function svgToBase64(svg) {
  const bytes = new TextEncoder().encode(svg)
  let bin = ''
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
  return btoa(bin)
}
`.trim()

const EXAMPLES = [
  { label: 'Grade 320×240', w: 320, h: 240, bg: '#fafafa', to: '#dcdcdc', text: '#8c8c8c', rx: 0 },
  { label: 'Avatar 120×120', w: 120, h: 120, bg: '#1677ff', to: '#0958d9', text: '#ffffff', rx: 60 },
  { label: 'Capa OG 800×450', w: 800, h: 450, bg: '#722ed1', to: '#391085', text: '#ffffff', rx: 12 },
  { label: 'Banner 1280×300', w: 1280, h: 300, bg: '#f0f5ff', to: '#d6e4ff', text: '#1677ff', rx: 0 },
]

const translations = {
  pt: {
    title: 'Gerador de Placeholder SVG',
    intro: (
      <>
        Monta uma imagem placeholder como SVG e entrega pronta pra embutir: o
        atributo <Text code>src</Text> como data URI URL-encoded, a versão{' '}
        <Text code>base64</Text> e a regra CSS <Text code>url(...)</Text>.
        Pra mockup rápido, um <Text code>{'<img>'}</Text> sem backend ou um
        fundo de teste, um placeholder embutido evita depender de serviço
        externo nenhum. 100% client-side, nada sai do navegador.
      </>
    ),
    controlsTitle: 'Configuração',
    width: 'Largura',
    height: 'Altura',
    radius: 'Canto (raio)',
    bgType: 'Fundo',
    bgSolid: 'Sólido',
    bgTwo: 'Dois tons',
    bgColor: 'Cor de fundo',
    bgTo: 'Segunda cor',
    gradientHint: 'Em "Dois tons", aplica um gradiente diagonal da primeira à segunda cor.',
    textLabel: 'Texto central',
    textInputPlaceholder: 'Texto do placeholder...',
    autoTextHint: 'Deixe vazio pra usar "LARGURA × ALTURA".',
    textFill: 'Cor do texto',
    fontSize: 'Fonte (px)',
    autoLabel: 'Auto',
    manualLabel: 'Manual',
    examplesTitle: 'Exemplos de um clique',
    previewTitle: 'Preview ao vivo',
    outputsTitle: 'Versões prontas pra copiar',
    rawTitle: 'SVG fonte',
    uriLabel: 'src (URL-encoded)',
    uriBase64: 'src (base64)',
    cssLabel: 'CSS url(...)',
    copy: 'Copiar',
    copied: 'Copiado!',
    copyError: 'Não foi possível copiar',
    bytes: (n) => `${n} ${n === 1 ? 'byte' : 'bytes'}`,
    tipTitle: 'Quando usar data URI de SVG?',
    tipBody: (
      <>
        Data URIs embutem o recurso no próprio HTML/CSS — uma requisição a
        menos. A forma <Text code>charset=utf-8</Text> URL-encoded é menor
        que a <Text code>base64</Text> (~33% maior). Detalhes: o caractere{' '}
        <Text code>#</Text> dentro do SVG precisa permanecer codificado (
        {'%23'}) e no CSS o valor é envolvido em aspas. Pra conteúdo
        permanente prefira um arquivo separado: data URIs não são cacheados
        como um asset individual.
      </>
    ),
    howItWorks: 'Como funciona — algoritmo-fonte',
    howItWorksDesc:
      'O SVG é montado como string (fundo sólido ou gradiente diagonal, texto central opcional com XML-escape) e vira data URI por encodeURIComponent ou base64. A base64 é self-contained: o TextEncoder "achata" o UTF-8 em bytes e o btoa empacota; a forma URL-encoded precisa declarar o charset.',
  },
  en: {
    title: 'SVG Placeholder Generator',
    intro: (
      <>
        Builds a placeholder image as an inline SVG and hands it over ready to
        embed: the <Text code>src</Text> attribute as an URL-encoded data URI,
        the <Text code>base64</Text> flavor and the CSS <Text code>url(...)</Text>
        rule. For quick mockups, a backend-free <Text code>{'<img>'}</Text> or a
        test background, an embedded placeholder is 100% client-side with zero
        external dependencies.
      </>
    ),
    controlsTitle: 'Configuration',
    width: 'Width',
    height: 'Height',
    radius: 'Corner (radius)',
    bgType: 'Background',
    bgSolid: 'Solid',
    bgTwo: 'Two-tone',
    bgColor: 'Background color',
    bgTo: 'Second color',
    gradientHint: 'With "Two-tone", a diagonal gradient goes from the first to the second color.',
    textLabel: 'Center text',
    textInputPlaceholder: 'Placeholder text...',
    autoTextHint: 'Leave empty to use "WIDTH × HEIGHT".',
    textFill: 'Text color',
    fontSize: 'Font (px)',
    autoLabel: 'Auto',
    manualLabel: 'Manual',
    examplesTitle: 'One-click examples',
    previewTitle: 'Live preview',
    outputsTitle: 'Ready-to-copy outputs',
    rawTitle: 'Source SVG',
    uriLabel: 'src (URL-encoded)',
    uriBase64: 'src (base64)',
    cssLabel: 'CSS url(...)',
    copy: 'Copy',
    copied: 'Copied!',
    copyError: 'Could not copy',
    bytes: (n) => `${n} ${n === 1 ? 'byte' : 'bytes'}`,
    tipTitle: 'When to use SVG data URIs?',
    tipBody: (
      <>
        Data URIs embed the asset inside the HTML/CSS itself — one fewer
        request. The URL-encoded <Text code>charset=utf-8</Text> form is
        smaller than <Text code>base64</Text> (~33% larger). Caveats: the{' '}
        <Text code>#</Text> character inside the SVG must stay encoded (
        {'%23'}) and in CSS the value is wrapped in quotes. For permanent
        content prefer a separate file: data URIs are not cached like files.
      </>
    ),
    howItWorks: 'How it works — source algorithm',
    howItWorksDesc:
      'The SVG is built as a string (solid or diagonal-gradient background, optional XML-escaped center text) and turned into a data URI via encodeURIComponent or base64. Base64 is self-contained: TextEncoder flattens UTF-8 into bytes and btoa packs them; the URL-encoded form needs its charset declared.',
  },
}

const GID = 'g'

function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v))
}

function OutputBlock({ label, value, copied, onCopy, copyLabel, copiedLabel }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <Text strong style={{ fontSize: 13 }}>{label}</Text>
        <Button
          size="small"
          type="primary"
          icon={copied ? <CheckOutlined /> : <CopyOutlined />}
          onClick={onCopy}
        >
          {copied ? copiedLabel : copyLabel}
        </Button>
      </div>
      <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 110, overflowY: 'auto', fontSize: 12, background: '#fafafa', padding: '8px 10px', borderRadius: 6 }}>
        <code>{value}</code>
      </pre>
    </div>
  )
}

export default function SvgPlaceholderGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [w, setW] = useState(320)
  const [h, setH] = useState(240)
  const [rx, setRx] = useState(0)
  const [bgType, setBgType] = useState('two')
  const [bgColor, setBgColor] = useState('#fafafa')
  const [bgTo, setBgTo] = useState('#dcdcdc')
  const [textFill, setTextFill] = useState('#666666')
  const [textOverride, setTextOverride] = useState('')
  const [fontSize, setFontSize] = useState(0)
  const [copied, setCopied] = useState(null)

  const W = clamp(w || 16, 16, 2048)
  const H = clamp(h || 16, 16, 2048)
  const R = clamp(rx || 0, 0, Math.min(W, H) / 2)
  const fontUsed = fontSize > 0
    ? clamp(fontSize, 8, 512)
    : clamp(Math.round(Math.min(W, H) / 6), 12, 160)
  const text = textOverride.trim() ? textOverride.trim() : `${W} × ${H}`

  const svg = useMemo(() => {
    const defs = bgType === 'two'
      ? `<defs><linearGradient id="${GID}" x1="0" y1="0" x2="1" y2="1">` +
        `<stop offset="0%" stop-color="${escXml(bgColor)}"/>` +
        `<stop offset="100%" stop-color="${escXml(bgTo)}"/>` +
        `</linearGradient></defs>`
      : ''
    const fill = bgType === 'two' ? `url(#${GID})` : escXml(bgColor)
    const rect = `<rect width="100%" height="100%" rx="${R}" fill="${fill}"/>`
    const label = `<text x="50%" y="50%" fill="${escXml(textFill)}" font-family="system-ui, -apple-system, 'Segoe UI', sans-serif" font-size="${fontUsed}" text-anchor="middle" dominant-baseline="central">${escXml(text)}</text>`
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${escXml(text)}">${defs}${rect}${label}</svg>`
  }, [bgType, bgColor, bgTo, text, textFill, fontUsed, W, H, R])

  const uriEncoded = useMemo(
    () => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
    [svg]
  )
  const uriBase64 = useMemo(
    () => `data:image/svg+xml;base64,${svgToBase64(svg)}`,
    [svg]
  )
  const cssUrl = useMemo(
    () => `background-image: url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}");`,
    [svg]
  )

  async function copy(text, key) {
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      setCopied(key)
      setTimeout(() => setCopied(null), 1500)
    } catch {
      message.error(t.copyError)
    }
  }

  const applyExample = (ex) => {
    setW(ex.w)
    setH(ex.h)
    setRx(ex.rx)
    setBgType('two')
    setBgColor(ex.bg)
    setBgTo(ex.to)
    setTextFill(ex.text)
    setTextOverride('')
  }

  const colorStyle = { width: 40, height: 32, border: 'none', cursor: 'pointer', background: 'none', padding: 0 }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><PictureOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card title={t.controlsTitle}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Space wrap align="center">
            <Space>
              <Text type="secondary">{t.width}</Text>
              <InputNumber min={16} max={2048} value={w} onChange={(v) => setW(v ?? 16)} style={{ width: 90 }} />
            </Space>
            <Space>
              <Text type="secondary">{t.height}</Text>
              <InputNumber min={16} max={2048} value={h} onChange={(v) => setH(v ?? 16)} style={{ width: 90 }} />
            </Space>
            <Space>
              <Text type="secondary">{t.radius}</Text>
              <InputNumber min={0} max={Math.min(W, H) / 2} value={rx} onChange={(v) => setRx(v ?? 0)} style={{ width: 90 }} />
            </Space>
          </Space>

          <Space wrap align="center">
            <Segmented
              value={bgType}
              onChange={setBgType}
              options={[
                { label: t.bgSolid, value: 'solid' },
                { label: t.bgTwo, value: 'two' },
              ]}
            />
            {bgType === 'solid' ? (
              <Space>
                <Text type="secondary">{t.bgColor}</Text>
                <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} style={colorStyle} />
                <Text code>{bgColor}</Text>
              </Space>
            ) : (
              <Space>
                <Text type="secondary">{t.bgColor}</Text>
                <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} style={colorStyle} />
                <Text code>{bgColor}</Text>
                <Text type="secondary">{t.bgTo}</Text>
                <input type="color" value={bgTo} onChange={(e) => setBgTo(e.target.value)} style={colorStyle} />
                <Text code>{bgTo}</Text>
              </Space>
            )}
          </Space>
          {bgType === 'two' && <Text type="secondary" style={{ fontSize: 12 }}>{t.gradientHint}</Text>}

          <Space wrap align="middle">
            <Text type="secondary">{t.textLabel}</Text>
            <Input
              value={textOverride}
              onChange={(e) => setTextOverride(e.target.value)}
              placeholder={t.textInputPlaceholder}
              style={{ width: 220 }}
            />
            <Text type="secondary">{t.textFill}</Text>
            <input type="color" value={textFill} onChange={(e) => setTextFill(e.target.value)} style={colorStyle} />
            <Text code>{textFill}</Text>
          </Space>
          <Text type="secondary" style={{ fontSize: 12 }}>{t.autoTextHint}</Text>

          <Space wrap align="middle">
            <Text type="secondary">{t.fontSize}</Text>
            <Segmented
              value={fontSize > 0 ? 'manual' : 'auto'}
              onChange={(v) => setFontSize(v === 'auto' ? 0 : fontUsed)}
              options={[
                { label: t.autoLabel, value: 'auto' },
                { label: t.manualLabel, value: 'manual' },
              ]}
            />
            {fontSize > 0 && (
              <InputNumber min={8} max={512} value={fontSize} onChange={(v) => setFontSize(v ?? 8)} style={{ width: 90 }} />
            )}
            <Text type="secondary">= {fontUsed}px</Text>
          </Space>
        </Space>
      </Card>

      <Card title={t.examplesTitle}>
        <Space size={[8, 8]} wrap>
          {EXAMPLES.map((ex) => (
            <Button key={ex.label} size="small" onClick={() => applyExample(ex)}>{ex.label}</Button>
          ))}
        </Space>
      </Card>

      <Card title={t.previewTitle}>
        <div style={{ textAlign: 'center' }}>
          <img
            src={uriEncoded}
            alt="placeholder preview"
            style={{
              maxWidth: '100%',
              maxHeight: 320,
              border: '1px solid #e8e8e8',
              borderRadius: 8,
            }}
          />
        </div>
      </Card>

      <Card title={t.outputsTitle}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <OutputBlock label={t.uriLabel} value={uriEncoded} copied={copied === 'enc'} onCopy={() => copy(uriEncoded, 'enc')} copyLabel={t.copy} copiedLabel={t.copied} />
          <OutputBlock label={t.uriBase64} value={uriBase64} copied={copied === 'b64'} onCopy={() => copy(uriBase64, 'b64')} copyLabel={t.copy} copiedLabel={t.copied} />
          <OutputBlock label={t.cssLabel} value={cssUrl} copied={copied === 'css'} onCopy={() => copy(cssUrl, 'css')} copyLabel={t.copy} copiedLabel={t.copied} />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {t.uriLabel}: {t.bytes(uriEncoded.length)} · {t.uriBase64}: {t.bytes(uriBase64.length)} · {t.cssLabel}: {t.bytes(cssUrl.length)}
          </Text>
        </Space>
      </Card>

      <Card title={t.rawTitle}>
        <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 320, overflowY: 'auto', fontSize: 12 }}>
          <code>{svg}</code>
        </pre>
      </Card>

      <Alert type="info" showIcon message={t.tipTitle} description={t.tipBody} />

      <Card title={t.howItWorks}>
        <Paragraph type="secondary">{t.howItWorksDesc}</Paragraph>
        <Collapse
          items={[
            {
              key: 'src',
              label: <Text code>inline-svg.js</Text>,
              children: <pre style={{ margin: 0, fontSize: 12, lineHeight: 1.6 }}>{ENCODER_SOURCE}</pre>,
            },
          ]}
        />
      </Card>
    </Space>
  )
}