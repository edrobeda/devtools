import React, { useMemo, useState } from 'react'
import { Typography, Card, Space, InputNumber, Segmented, Button, Slider, Radio, Switch, Alert, Collapse, message } from 'antd'
import { PictureOutlined, CopyOutlined, CheckOutlined, DownloadOutlined, ThunderboltOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

// ─── Geometria do blob ────────────────────────────────────────────────────
// O raio de cada ponto é um senoide composto (2a, 3a e 5a harmônicos com
// fases aleatórias) — periódico em 2π, então o contorno fecha sem degrau.
// A curva é então suavizada com Catmull-Rom (tensão 1/6), que vira pares de
// Bézier cúbicos e produz o contorno orgânico "molenga".
function mulberry32(seed) {
  let a = seed >>> 0
  return function () {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function catmullRomClosed(pts) {
  const n = pts.length
  const at = (i) => pts[((i % n) + n) % n]
  let d = `M${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`
  for (let i = 0; i < n; i++) {
    const p0 = at(i - 1)
    const p1 = at(i)
    const p2 = at(i + 1)
    const p3 = at(i + 2)
    const c1x = p1.x + (p2.x - p0.x) / 6
    const c1y = p1.y + (p2.y - p0.y) / 6
    const c2x = p2.x - (p3.x - p1.x) / 6
    const c2y = p2.y - (p3.y - p1.y) / 6
    d += ` C${c1x.toFixed(2)} ${c1y.toFixed(2)},${c2x.toFixed(2)} ${c2y.toFixed(2)},${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`
  }
  return d + ' Z'
}

function buildBlobD({ seed, count, irregularity, radius, cx, cy, rotate }) {
  const rand = mulberry32(seed)
  const p2 = rand() * Math.PI * 2
  const p3 = rand() * Math.PI * 2
  const p5 = rand() * Math.PI * 2
  const pts = []
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + (rotate * Math.PI) / 180
    const s =
      0.5 * Math.sin(2 * angle + p2) +
      0.3 * Math.sin(3 * angle + p3) +
      0.2 * Math.sin(5 * angle + p5)
    const rad = Math.max(2, radius * (1 + irregularity * s))
    pts.push({ x: cx + rad * Math.cos(angle), y: cy + rad * Math.sin(angle) })
  }
  return catmullRomClosed(pts)
}

// ─── Algoritmo-fonte exibido na página ───────────────────────────────────
const SOURCE = `// RNG determinístico (mulberry32) — mesma seed, mesmo blob.
function mulberry32(seed) {
  let a = seed >>> 0
  return function () {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Fecha o loop com Bézier cúbicos via Catmull-Rom (tensão 1/6).
function catmullRomClosed(pts) {
  const n = pts.length
  const at = (i) => pts[((i % n) + n) % n]
  let d = 'M' + pts[0].x.toFixed(2) + ' ' + pts[0].y.toFixed(2)
  for (let i = 0; i < n; i++) {
    const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2)
    const c1x = p1.x + (p2.x - p0.x) / 6
    const c1y = p1.y + (p2.y - p0.y) / 6
    const c2x = p2.x - (p3.x - p1.x) / 6
    const c2y = p2.y - (p3.y - p1.y) / 6
    d += ' C' + c1x.toFixed(2) + ' ' + c1y.toFixed(2) + ',' +
         c2x.toFixed(2) + ' ' + c2y.toFixed(2) + ',' +
         p2.x.toFixed(2) + ' ' + p2.y.toFixed(2)
  }
  return d + ' Z'
}

// Cada ponto tem raio modulado por harmônicos senoidais com fase aleatória
// (periódico em 2π — o contorno fecha liso) e posição girada por 'rotate'.
function buildBlobD({ seed, count, irregularity, radius, cx, cy, rotate }) {
  const rand = mulberry32(seed)
  const p2 = rand() * Math.PI * 2
  const p3 = rand() * Math.PI * 2
  const p5 = rand() * Math.PI * 2
  const pts = []
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + (rotate * Math.PI) / 180
    const s = 0.5 * Math.sin(2 * angle + p2) +
              0.3 * Math.sin(3 * angle + p3) +
              0.2 * Math.sin(5 * angle + p5)
    const rad = Math.max(2, radius * (1 + irregularity * s))
    pts.push({ x: cx + rad * Math.cos(angle), y: cy + rad * Math.sin(angle) })
  }
  return catmullRomClosed(pts)
}`

const translations = {
  pt: {
    title: 'Gerador de Blob SVG',
    intro: (
      <>
        Monta formas orgânicas tipo "blob" em SVG — o fundo de hero, o card de
        avatar, a textura de landing. O raio de cada ponto é modulado por
        harmônicos senoidais com fases aleatórias e a curva fecha suave via
        Catmull-Rom → Bézier cúbico. Gire a seed, ajuste irregularidade e
        pontos, e copie o SVG pronto ou a regra CSS{' '}
        <Text code>background-image</Text> com data URI. 100% client-side.
      </>
    ),
    shapeTitle: 'Forma',
    seed: 'Seed',
    points: 'Pontos',
    irregularity: 'Irregularidade',
    radius: 'Raio',
    rotate: 'Rotação',
    rx: 'X',
    ry: 'Rotação',
    random: 'Sorteia',
    sizeTitle: 'Tamanho',
    width: 'Largura',
    height: 'Altura',
    colorTitle: 'Preenchimento',
    fillSolid: 'Sólido',
    fillGradient: 'Gradiente',
    color1: 'Cor 1',
    color2: 'Cor 2',
    angle: 'Ângulo',
    strokeTitle: 'Contorno',
    strokeWidth: 'Espessura',
    strokeColor: 'Cor',
    none: 'Sem contorno',
    presetsTitle: 'Exemplos de um clique',
    previewTitle: 'Preview ao vivo',
    previewHint: 'Aqui o SVG renderiza exatamente como sairá no código abaixo.',
    outputsTitle: 'Versões prontas pra copiar',
    svgLabel: 'SVG fonte',
    cssLabel: 'CSS background-image (data URI)',
    download: 'Baixar .svg',
    copy: 'Copiar',
    copied: 'Copiado!',
    copyError: 'Não foi possível copiar',
    bytes: (n) => `${n} ${n === 1 ? 'byte' : 'bytes'}`,
    tipTitle: 'Como usar o blob',
    tipBody: (
      <>
        Use como <Text code>background-image</Text> em cards e avatares, ou
        dentro de um <Text code>{'<svg>'}</Text> com{' '}
        <Text code>preserveAspectRatio="none"</Text> pra esticar como uma
        textura de seção. A mesma seed + mesma configuração de pontos sempre
        produz exatamente o mesmo contorno — use isso a favor: definida a
        forma, os sliders de cor/contorno não mudam o path. Data URIs são uma
        requisição a menos, mas não são cacheadas como arquivo — pra uso
        definitivo prefira o .svg baixado.
      </>
    ),
    howItWorks: 'Como funciona — algoritmo-fonte',
    howItWorksDesc:
      'Cada ponto fica num ângulo equidistante com raio r = R·(1 + irr·s), onde s = 0.5·sen(2θ+φ₁) + 0.3·sen(3θ+φ₂) + 0.2·sen(5θ+φ₃) — combinação de harmônicos BAIXOS, então o contorno ondula de forma orgânica sem espículas. A curva fecha passando pelos pontos com Catmull-Rom de tensão 1/6 convertido em Bézier cúbico (C c1 c2 p). Tudo é determinístico em função da seed.',
  },
  en: {
    title: 'SVG Blob Generator',
    intro: (
      <>
        Builds organic "blob" shapes in SVG — the hero background, the avatar
        card, the landing texture. Each point&apos;s radius is modulated by
        sine harmonics with random phases and the loop closes smoothly via
        Catmull-Rom → cubic Bézier. Roll the seed, tune irregularity and point
        count, then copy the standalone SVG or the CSS{' '}
        <Text code>background-image</Text> rule with a data URI. 100%
        client-side.
      </>
    ),
    shapeTitle: 'Shape',
    seed: 'Seed',
    points: 'Points',
    irregularity: 'Irregularity',
    radius: 'Radius',
    rotate: 'Rotation',
    random: 'Randomize',
    sizeTitle: 'Size',
    width: 'Width',
    height: 'Height',
    colorTitle: 'Fill',
    fillSolid: 'Solid',
    fillGradient: 'Gradient',
    color1: 'Color 1',
    color2: 'Color 2',
    angle: 'Angle',
    strokeTitle: 'Stroke',
    strokeWidth: 'Width',
    strokeColor: 'Color',
    none: 'No stroke',
    presetsTitle: 'One-click presets',
    previewTitle: 'Live preview',
    previewHint: 'The SVG here renders exactly as it will come out below.',
    outputsTitle: 'Ready-to-copy outputs',
    svgLabel: 'Source SVG',
    cssLabel: 'CSS background-image (data URI)',
    download: 'Download .svg',
    copy: 'Copy',
    copied: 'Copied!',
    copyError: 'Could not copy',
    bytes: (n) => `${n} ${n === 1 ? 'byte' : 'bytes'}`,
    tipTitle: 'How to use the blob',
    tipBody: (
      <>
        Use it as a <Text code>background-image</Text> on cards and avatars, or
        inside an <Text code>{'<svg>'}</Text> with{' '}
        <Text code>preserveAspectRatio="none"</Text> to stretch it as a section
        texture. The same seed + point configuration always produces exactly
        the same outline — the color/stroke sliders never change the path.
        Data URIs save one request but are not cached like files — for
        permanent use prefer the downloaded .svg.
      </>
    ),
    howItWorks: 'How it works — source algorithm',
    howItWorksDesc:
      'Each point sits at an equally spaced angle with radius r = R·(1 + irr·s), where s = 0.5·sin(2θ+φ₁) + 0.3·sin(3θ+φ₂) + 0.2·sin(5θ+φ₃) — only LOW harmonics, so the outline undulates organically without spikes. The loop closes through the points with Catmull-Rom tension 1/6 converted to cubic Bézier (C c1 c2 p). Everything is deterministic from the seed.',
  },
}

const DEFAULT_W = 400
const DEFAULT_H = 400

function makePreset(overrides = {}) {
  return {
    seed: 7,
    count: 16,
    irregularity: 0.35,
    radius: 130,
    rotate: 0,
    color1: '#8b5cf6',
    color2: '#ec4899',
    gradient: true,
    gradAngle: 135,
    strokeW: 0,
    strokeColor: '#ffffff',
    ...overrides,
  }
}

const PRESETS = [
  { key: 'aurora', label: 'Aurora', enLabel: 'Aurora', cfg: makePreset({ seed: 7, color1: '#8b5cf6', color2: '#ec4899' }) },
  { key: 'ocean', label: 'Oceano', enLabel: 'Ocean', cfg: makePreset({ seed: 11, color1: '#2dd4bf', color2: '#2563eb', irregularity: 0.28, count: 20 }) },
  { key: 'toxic', label: 'Tóxico', enLabel: 'Toxic', cfg: makePreset({ seed: 23, color1: '#a3e635', color2: '#059669' }) },
  { key: 'sunset', label: 'Pôr do sol', enLabel: 'Sunset', cfg: makePreset({ seed: 42, color1: '#fbbf24', color2: '#f43f5e', irregularity: 0.45, strokeW: 2, strokeColor: '#ffffff' }) },
  { key: 'mono', label: 'Monocromático', enLabel: 'Monochrome', cfg: makePreset({ seed: 99, color1: '#c0c4cc', color2: '#7f8794', gradient: false, irregularity: 0.2 }) },
]

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))

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

export default function SvgBlobGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [seed, setSeed] = useState(7)
  const [count, setCount] = useState(16)
  const [irregularity, setIrregularity] = useState(0.35)
  const [radius, setRadius] = useState(130)
  const [rotate, setRotate] = useState(0)
  const [w, setW] = useState(DEFAULT_W)
  const [h, setH] = useState(DEFAULT_H)
  const [gradient, setGradient] = useState(true)
  const [color1, setColor1] = useState('#8b5cf6')
  const [color2, setColor2] = useState('#ec4899')
  const [gradAngle, setGradAngle] = useState(135)
  const [strokeW, setStrokeW] = useState(0)
  const [strokeColor, setStrokeColor] = useState('#ffffff')
  const [copied, setCopied] = useState(null)

  const W = clamp(w || 200, 200, 1500)
  const H = clamp(h || 200, 200, 1500)
  const R = clamp(Math.min(radius, Math.min(W, H) / 2 - 8), 16, 800)

  const applyPreset = (p) => {
    const c = p.cfg
    setSeed(c.seed)
    setCount(c.count)
    setIrregularity(c.irregularity)
    setRadius(c.radius)
    setRotate(c.rotate)
    setColor1(c.color1)
    setColor2(c.color2)
    setGradient(c.gradient)
    setGradAngle(c.gradAngle)
    setStrokeW(c.strokeW)
    setStrokeColor(c.strokeColor)
  }

  const randomize = () => setSeed(Math.floor(Math.random() * 100000))

  const d = useMemo(
    () =>
      buildBlobD({
        seed: Math.max(0, Math.floor(seed || 0)),
        count: Math.max(6, Math.floor(count || 6)),
        irregularity: clamp(irregularity || 0, 0, 0.75),
        radius: R,
        cx: W / 2,
        cy: H / 2,
        rotate: rotate || 0,
      }),
    [seed, count, irregularity, R, W, H, rotate]
  )

  const gradId = 'blob-grad'

  const svgCode = useMemo(() => {
    const fillAttr = gradient
      ? `fill="url(#${gradId})"`
      : `fill="${color1}"`
    const strokeAttr = strokeW > 0 ? ` stroke="${strokeColor}" stroke-width="${strokeW}"` : ''
    const defs = gradient
      ? `<defs><linearGradient id="${gradId}" gradientTransform="rotate(${gradAngle} 0.5 0.5)"><stop offset="0%" stop-color="${color1}"/><stop offset="100%" stop-color="${color2}"/></linearGradient></defs>`
      : ''
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="blob">${defs}<path ${fillAttr} ${strokeAttr} d="${d}"/></svg>`
  }, [gradient, color1, color2, gradAngle, strokeW, strokeColor, W, H, d])

  const cssUrl = useMemo(() => {
    const frag = gradient ? `#${gradId}` : ''
    return `background-image: url("data:image/svg+xml,${encodeURIComponent(svgCode)}${frag}");`
  }, [svgCode, gradient])

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
    a.download = `blob-${seed}-${W}x${H}.svg`
    a.click()
    URL.revokeObjectURL(url)
  }

  const colorStyle = { width: 40, height: 32, border: 'none', cursor: 'pointer', background: 'none', padding: 0 }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><PictureOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card title={t.shapeTitle}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Space wrap align="center">
            <Space>
              <Text type="secondary">{t.seed}</Text>
              <InputNumber min={0} max={999999} value={seed} onChange={(v) => setSeed(v ?? 0)} style={{ width: 110 }} />
            </Space>
            <Button icon={<ThunderboltOutlined />} onClick={randomize}>{t.random}</Button>
            <Space>
              <Text type="secondary">{t.points}</Text>
              <InputNumber min={6} max={40} value={count} onChange={(v) => setCount(v ?? 16)} style={{ width: 70 }} />
            </Space>
          </Space>
          <Space wrap style={{ width: '100%' }} align="start" size={24}>
            <div style={{ width: 200 }}>
              <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>{t.irregularity} · {irregularity.toFixed(2)}</Text>
              <Slider min={0} max={0.75} step={0.01} value={irregularity} onChange={setIrregularity} />
            </div>
            <div style={{ width: 200 }}>
              <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>{t.radius} · {R}px</Text>
              <Slider min={16} max={Math.min(800, Math.min(W, H) / 2 - 8)} value={R} onChange={setRadius} />
            </div>
            <div style={{ width: 200 }}>
              <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>{t.rotate} · {rotate}°</Text>
              <Slider min={0} max={360} step={5} value={rotate} onChange={setRotate} />
            </div>
          </Space>
        </Space>
      </Card>

      <Card title={t.sizeTitle}>
        <Space wrap align="center">
          <Space>
            <Text type="secondary">{t.width}</Text>
            <InputNumber min={200} max={1500} value={w} onChange={(v) => setW(v ?? 400)} style={{ width: 100 }} />
          </Space>
          <Space>
            <Text type="secondary">{t.height}</Text>
            <InputNumber min={200} max={1500} value={h} onChange={(v) => setH(v ?? 400)} style={{ width: 100 }} />
          </Space>
        </Space>
      </Card>

      <Card title={t.colorTitle}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Segmented
            value={gradient ? 'gradient' : 'solid'}
            onChange={(v) => setGradient(v === 'gradient')}
            options={[
              { label: t.fillSolid, value: 'solid' },
              { label: t.fillGradient, value: 'gradient' },
            ]}
          />
          <Space wrap align="center" size={16}>
            <Space>
              <Text type="secondary">{t.color1}</Text>
              <input type="color" value={color1} onChange={(e) => setColor1(e.target.value)} style={colorStyle} />
              <Text code>{color1}</Text>
            </Space>
            {gradient && (
              <>
                <Space>
                  <Text type="secondary">{t.color2}</Text>
                  <input type="color" value={color2} onChange={(e) => setColor2(e.target.value)} style={colorStyle} />
                  <Text code>{color2}</Text>
                </Space>
                <div style={{ width: 200 }}>
                  <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>{t.angle} · {gradAngle}°</Text>
                  <Slider min={0} max={360} step={5} value={gradAngle} onChange={setGradAngle} />
                </div>
              </>
            )}
          </Space>
        </Space>
      </Card>

      <Card title={t.strokeTitle}>
        <Space wrap align="center" size={16}>
          <div style={{ width: 200 }}>
            <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
              {t.strokeWidth} · {strokeW === 0 ? t.none : `${strokeW}px`}
            </Text>
            <Slider min={0} max={12} step={0.5} value={strokeW} onChange={setStrokeW} />
          </div>
          <Space>
            <Text type="secondary">{t.strokeColor}</Text>
            <input type="color" value={strokeColor} onChange={(e) => setStrokeColor(e.target.value)} style={colorStyle} />
            <Text code>{strokeColor}</Text>
          </Space>
        </Space>
      </Card>

      <Card title={t.presetsTitle}>
        <Space size={[8, 8]} wrap>
          {PRESETS.map((p) => (
            <Button key={p.key} size="small" onClick={() => applyPreset(p)}>
              {lang === 'pt' ? p.label : p.enLabel}
            </Button>
          ))}
        </Space>
      </Card>

      <Card title={t.previewTitle}>
        <div style={{ marginBottom: 8, fontSize: 12, color: '#999' }}>{t.previewHint}</div>
        <div
          style={{
            border: '1px solid #e8e8e8',
            borderRadius: 8,
            overflow: 'hidden',
            background: 'repeating-conic-gradient(#f6f6f6 0% 25%, #fff 0% 50%) 0 0 / 20px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <svg
            viewBox={`0 0 ${W} ${H}`}
            style={{ display: 'block', maxWidth: '100%', maxHeight: 480, height: 'auto' }}
          >
            {gradient && (
              <defs>
                <linearGradient id={gradId} gradientTransform={`rotate(${gradAngle} 0.5 0.5)`}>
                  <stop offset="0%" stopColor={color1} />
                  <stop offset="100%" stopColor={color2} />
                </linearGradient>
              </defs>
            )}
            <path
              fill={gradient ? `url(#${gradId})` : color1}
              stroke={strokeW > 0 ? strokeColor : undefined}
              strokeWidth={strokeW > 0 ? strokeW : undefined}
              d={d}
            />
          </svg>
        </div>
      </Card>

      <Card title={t.outputsTitle}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <OutputBlock label={t.svgLabel} value={svgCode} copied={copied === 'svg'} onCopy={() => copy(svgCode, 'svg')} copyLabel={t.copy} copiedLabel={t.copied} />
          <OutputBlock label={t.cssLabel} value={cssUrl} copied={copied === 'css'} onCopy={() => copy(cssUrl, 'css')} copyLabel={t.copy} copiedLabel={t.copied} />
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
              label: <Text code>svg-blob.js</Text>,
              children: <pre style={{ margin: 0, fontSize: 12, lineHeight: 1.6 }}>{SOURCE}</pre>,
            },
          ]}
        />
      </Card>
    </Space>
  )
}