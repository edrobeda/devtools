import React, { useMemo, useState } from 'react'
import { Typography, Card, Space, Slider, Switch, Alert, Collapse, Row, Col, Button, message, Divider } from 'antd'
import { BgColorsOutlined, CopyOutlined, UndoOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const DEFAULTS = {
  grayscale: 0,
  sepia: 0,
  saturate: 100,
  hueRotate: 0,
  invert: 0,
  opacity: 100,
  brightness: 100,
  contrast: 100,
  blur: 0,
  dsOn: false,
  dsX: 2,
  dsY: 4,
  dsBlur: 4,
  dsColor: '#0b1520',
}

function buildFilterParts(f) {
  const p = []
  if (f.blur > 0) p.push(`blur(${f.blur}px)`)
  if (f.brightness !== 100) p.push(`brightness(${f.brightness}%)`)
  if (f.contrast !== 100) p.push(`contrast(${f.contrast}%)`)
  if (f.grayscale > 0) p.push(`grayscale(${f.grayscale}%)`)
  if (f.hueRotate > 0) p.push(`hue-rotate(${f.hueRotate}deg)`)
  if (f.invert > 0) p.push(`invert(${f.invert}%)`)
  if (f.opacity !== 100) p.push(`opacity(${f.opacity}%)`)
  if (f.saturate !== 100) p.push(`saturate(${f.saturate}%)`)
  if (f.sepia > 0) p.push(`sepia(${f.sepia}%)`)
  if (f.dsOn) p.push(`drop-shadow(${f.dsX}px ${f.dsY}px ${f.dsBlur}px ${f.dsColor})`)
  return p
}

const SAMPLE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="320" viewBox="0 0 640 320">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#4aa5ff"/>
      <stop offset="1" stop-color="#62d977"/>
    </linearGradient>
  </defs>
  <rect width="640" height="320" fill="url(#sky)"/>
  <circle cx="120" cy="84" r="46" fill="#ffd166"/>
  <circle cx="512" cy="60" r="10" fill="#ffffff" opacity="0.8"/>
  <circle cx="556" cy="158" r="4" fill="#ffffff" opacity="0.5"/>
  <path d="M0 320 V210 C 165 150 300 245 455 232 C 560 214 610 200 640 188 V320 Z" fill="#3f9e5a"/>
  <path d="M0 320 V250 C 180 212 260 280 430 260 C 540 245 585 260 640 252 V320 Z" fill="#2e7d44"/>
  <path d="M86 150 L148 216 L210 150 Z" fill="#f4f6f8" opacity="0.92"/>
</svg>`

const SAMPLE_URI = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(SAMPLE_SVG)}`

const PRESETS = [
  { key: 'original', labelKey: 'original', f: {} },
  { key: 'sepia', labelKey: 'presetSepia', f: { sepia: 80, saturate: 210, contrast: 92, brightness: 106 } },
  { key: 'noir', labelKey: 'noir', f: { grayscale: 100, contrast: 128, brightness: 112 } },
  { key: 'vivid', labelKey: 'vivid', f: { saturate: 200, contrast: 120, brightness: 106 } },
  { key: 'cool', labelKey: 'cool', f: { hueRotate: 150, saturate: 165, contrast: 112 } },
  { key: 'vintage', labelKey: 'vintage', f: { sepia: 45, saturate: 130, brightness: 108, contrast: 88, hueRotate: 18 } },
  { key: 'invertP', labelKey: 'presetInvert', f: { invert: 100, hueRotate: 180 } },
]

const SLIDERS = [
  { key: 'brightness', min: 0, max: 300, unit: '%' },
  { key: 'contrast', min: 0, max: 300, unit: '%' },
  { key: 'saturate', min: 0, max: 300, unit: '%' },
  { key: 'hueRotate', min: 0, max: 360, unit: 'deg' },
  { key: 'grayscale', min: 0, max: 100, unit: '%' },
  { key: 'sepia', min: 0, max: 100, unit: '%' },
  { key: 'invert', min: 0, max: 100, unit: '%' },
  { key: 'opacity', min: 0, max: 100, unit: '%' },
  { key: 'blur', min: 0, max: 20, unit: 'px' },
]

const translations = {
  pt: {
    title: 'Gerador de Filtros CSS',
    intro:
      'Monta a regra CSS de filtros, com as funções em ordem canônica, pronta pra colar. A imagem de exemplo é um SVG gerado na própria página — nada sai do navegador.',
    preview: 'Pré-visualização ao vivo',
    noneBadge: 'CSS: ',
    filters: 'Filtros',
    brightness: 'Brilho',
    contrast: 'Contraste',
    saturate: 'Saturação',
    hueRotate: 'Matiz',
    grayscale: 'Escala de cinza',
    sepia: 'Sépia',
    invert: 'Inverter',
    opacity: 'Opacidade',
    blur: 'Desfoque',
    dropShadow: 'Drop-shadow',
    dsX: 'Deslocamento X',
    dsY: 'Deslocamento Y',
    dsBlur: 'Desfoque',
    dsColor: 'Cor',
    presets: 'Efeitos prontos de um clique',
    original: 'Original',
    presetSepia: 'Sépia',
    noir: 'Noir (P&B)',
    vivid: 'Vívido',
    cool: 'Frio',
    vintage: 'Vintage',
    presetInvert: 'Invertido',
    output: 'CSS gerado',
    copy: 'Copiar',
    copied: 'CSS de filtro copiado!',
    reset: 'Restaurar',
    activeN: 'funções ativas',
    sourceCol: 'Código-fonte',
    sourceBody: 'O coração é o agregador buildFilterParts que descarta cada função no valor neutro e devolve a lista em ordem fixa — "none" quando nada está ativo.',
    sampleSub: 'Texto real estilizado pela mesma regra',
    tipTitle: 'Regras que importam',
    tipBody: (
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        <li>
          <Text strong>Ordem importa</Text>: o navegador aplica as funções da esquerda pra direita, alimentando a seguinte —{' '}
          <Text code>sepia(1) hue-rotate(90deg)</Text> não é igual a{' '}
          <Text code>hue-rotate(90deg) sepia(1)</Text>.
        </li>
        <li>
          <Text strong>Neutro = descartado</Text>: <Text code>blur(0)</Text>,{' '}
          <Text code>brightness(100%)</Text> etc. não mudam nada — a página os
          omite pra o CSS ficar curto.
        </li>
        <li>
          <Text strong>Custo de renderização</Text>: <Text code>filter</Text> cria
          uma camada de composição própria — áreas grandes animadas ficam caras, e
          o blur mexe só no próprio elemento, não no que está atrás.
        </li>
        <li>
          <Text strong>drop-shadow ≠ box-shadow</Text>: segue o contorno real
          (alpha) dos pixels, não o retângulo do elemento.
        </li>
        <li>
          <Text strong>backdrop-filter</Text> é outra coisa: afeta o que está{' '}
          <em>atrás</em> do elemento, não o elemento em si.
        </li>
      </ul>
    ),
  },
  en: {
    title: 'CSS Filter Generator',
    intro: 'Visually build a CSS filter rule, with the functions in canonical order, ready to paste. The sample image is an SVG generated locally — nothing leaves the browser.',
    preview: 'Live preview',
    noneBadge: 'CSS: ',
    filters: 'Filters',
    brightness: 'Brightness',
    contrast: 'Contrast',
    saturate: 'Saturation',
    hueRotate: 'Hue',
    grayscale: 'Grayscale',
    sepia: 'Sepia',
    invert: 'Invert',
    opacity: 'Opacity',
    blur: 'Blur',
    dropShadow: 'Drop-shadow',
    dsX: 'Offset X',
    dsY: 'Offset Y',
    dsBlur: 'Blur',
    dsColor: 'Color',
    presets: 'One-click effects',
    original: 'Original',
    presetSepia: 'Sepia',
    noir: 'Noir (B&W)',
    vivid: 'Vivid',
    cool: 'Cool',
    vintage: 'Vintage',
    presetInvert: 'Inverted',
    output: 'Generated CSS',
    copy: 'Copy',
    copied: 'Filter CSS copied!',
    reset: 'Reset',
    activeN: 'active filter(s)',
    sourceCol: 'Source code',
    sourceBody: 'The heart is the buildFilterParts helper below — it drops every function sitting at its neutral value and returns the list in a fixed order ("none" when nothing is active).',
    sampleSub: 'Real text styled by the same rule',
    tipTitle: 'Rules that matter',
    tipBody: (
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        <li>
          <Text strong>Order matters</Text>: the browser applies functions left to
          right, feeding the next one —{' '}
          <Text code>sepia(1) hue-rotate(90deg)</Text> is not{' '}
          <Text code>hue-rotate(90deg) sepia(1)</Text>.
        </li>
        <li>
          <Text strong>Neutral = skipped</Text>: <Text code>blur(0)</Text>,{' '}
          <Text code>brightness(100%)</Text>, etc. change nothing — they&apos;re
          omitted so the CSS stays tight.
        </li>
        <li>
          <Text strong>Render cost</Text>: <Text code>filter</Text> triggers a new
          compositing layer — large animated regions get expensive, and blur only
          affects the element&apos;s own pixels, not what lies behind.
        </li>
        <li>
          <Text strong>drop-shadow ≠ box-shadow</Text>: it follows the real (alpha)
          outline of the pixels, not the element&apos;s rectangle.
        </li>
        <li>
          <Text strong>backdrop-filter</Text> is different: it affects what is{' '}
          <em>behind</em> the element, not the element itself.
        </li>
      </ul>
    ),
  },
}

export default function CssFilterGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [f, setF] = useState(DEFAULTS)

  const applyField = (key, value) => setF((prev) => ({ ...prev, [key]: value }))

  const applyPreset = (key) => {
    const preset = PRESETS.find((p) => p.key === key)
    if (!preset) return
    setF((prev) => ({ ...prev, ...preset.f }))
  }

  const reset = () => setF(DEFAULTS)

  const parts = useMemo(() => buildFilterParts(f), [f])
  const filterCss = parts.length ? parts.join(' ') : 'none'
  const fullCss = `filter: ${filterCss};`

  const copy = () => {
    navigator.clipboard.writeText(fullCss)
    message.success(t.copied)
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><BgColorsOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Alert type="info" showIcon message={t.tipTitle} description={t.tipBody} />

      <Card
        title={t.preview}
        extra={
          parts.length > 0 ? (
            <Text type="secondary">{parts.length} {t.activeN}</Text>
          ) : (
            <Text type="secondary">{t.noneBadge}<Text code>filter: none</Text></Text>
          )
        }
      >
        <div
          style={{
            padding: 8,
            borderRadius: 10,
            background: 'repeating-conic-gradient(#e7eaf0 0% 25%, #ffffff 0% 50%) 0 0 / 20px 20px',
          }}
        >
          <div style={{ borderRadius: 10, overflow: 'hidden', filter: filterCss }}>
            <img src={SAMPLE_URI} alt="Sample" style={{ width: '100%', display: 'block' }} />
            <div style={{ padding: '10px 16px', background: '#f2f5fa' }}>
              <Space direction="vertical" size={0}>
                <Text strong style={{ fontSize: 15 }}>Aa 123</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>{t.sampleSub}</Text>
              </Space>
            </div>
          </div>
        </div>
      </Card>

      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
        <Text strong>{t.presets}</Text>
        <Button size="small" icon={<UndoOutlined />} onClick={reset}>{t.reset}</Button>
      </Space>
      <Space wrap>
        {PRESETS.map((p) => (
          <Button key={p.key} size="small" onClick={() => applyPreset(p.key)}>{t[p.labelKey]}</Button>
        ))}
      </Space>

      <Card title={t.filters}>
        <Row gutter={[32, 8]}>
          {SLIDERS.map((s) => (
            <Col key={s.key} xs={24} sm={12} md={8}>
              <Space direction="vertical" style={{ width: '100%' }} size={0}>
                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                  <Text>{t[s.key]}</Text>
                  <Text code>{f[s.key]}{s.unit}</Text>
                </Space>
                <Slider
                  min={s.min}
                  max={s.max}
                  value={f[s.key]}
                  onChange={(v) => applyField(s.key, v)}
                />
              </Space>
            </Col>
          ))}
        </Row>

        <Divider style={{ margin: '8px 0' }} />

        <Space direction="vertical" style={{ width: '100%' }} size="small">
          <Space align="center">
            <Switch checked={f.dsOn} onChange={(v) => applyField('dsOn', v)} />
            <Text>{t.dropShadow}</Text>
          </Space>
          {f.dsOn && (
            <Row gutter={[32, 8]}>
              <Col xs={24} sm={8}>
                <Space direction="vertical" style={{ width: '100%' }} size={0}>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text>{t.dsX}</Text>
                    <Text code>{f.dsX}px</Text>
                  </Space>
                  <Slider min={-60} max={60} value={f.dsX} onChange={(v) => applyField('dsX', v)} />
                </Space>
              </Col>
              <Col xs={24} sm={8}>
                <Space direction="vertical" style={{ width: '100%' }} size={0}>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text>{t.dsY}</Text>
                    <Text code>{f.dsY}px</Text>
                  </Space>
                  <Slider min={-60} max={60} value={f.dsY} onChange={(v) => applyField('dsY', v)} />
                </Space>
              </Col>
              <Col xs={24} sm={8}>
                <Space direction="vertical" style={{ width: '100%' }} size={0}>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text>{t.dsBlur}</Text>
                    <Text code>{f.dsBlur}px</Text>
                  </Space>
                  <Slider min={0} max={40} value={f.dsBlur} onChange={(v) => applyField('dsBlur', v)} />
                </Space>
              </Col>
              <Col xs={24}>
                <Space align="center">
                  <Text>{t.dsColor}:</Text>
                  <input
                    type="color"
                    value={f.dsColor}
                    onChange={(e) => applyField('dsColor', e.target.value)}
                    style={{ width: 40, height: 32, border: 'none', cursor: 'pointer', background: 'none' }}
                  />
                  <Text code>{f.dsColor}</Text>
                </Space>
              </Col>
            </Row>
          )}
        </Space>
      </Card>

      <Card
        title={t.output}
        extra={<Button size="small" icon={<CopyOutlined />} onClick={copy}>{t.copy}</Button>}
      >
        <pre style={{ margin: 0, overflowX: 'auto' }}>
          <code>{fullCss}</code>
        </pre>
      </Card>

      <Collapse
        items={[
          {
            key: 'source',
            label: `${t.sourceCol} — buildFilterParts`,
            children: (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Paragraph type="secondary">{t.sourceBody}</Paragraph>
                <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 320 }}>
                  <code>{buildFilterParts.toString()}</code>
                </pre>
              </Space>
            ),
          },
        ]}
      />
    </Space>
  )
}