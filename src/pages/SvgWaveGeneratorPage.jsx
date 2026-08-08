import React, { useMemo, useState } from 'react'
import { Typography, Card, Space, Input, InputNumber, Segmented, Button, Switch, Slider, Alert, Collapse, message } from 'antd'
import { PictureOutlined, CopyOutlined, CheckOutlined, PlusOutlined, MinusOutlined, DownloadOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

// ─── Geometria da onda ───────────────────────────────────────────────────
// t ∈ [0,1] varre a largura. Cada camada é uma onda senoidal cuja crista é
// a borda de cima do bloco; o bloco fecha descendo até a base do SVG. O
// efeito "empilhado" vem de empilhar camadas com fase/centro diferentes.
const STEPS_PER_LAYER = 0.33   // ~1 ponto por 3px (via Math.max 64)

function waveY(t, layer, h) {
  const freq = layer.cycles * 2 * Math.PI
  const phase = (layer.phase * Math.PI) / 180
  const amp = h * layer.amp
  const base = h * layer.center
  let s = Math.sin(freq * t + phase)
  if (layer.type === 'ripple') {
    s = 0.6 * s + 0.4 * Math.sin(2 * freq * t + phase * 2)
  }
  return base - amp * s
}

function layerPath(layer, w, h) {
  const steps = Math.max(64, Math.round(w * STEPS_PER_LAYER))
  let d = `M0 ${h.toFixed(1)} L0 ${waveY(0, layer, h).toFixed(1)}`
  for (let i = 1; i <= steps; i++) {
    const x = (i / steps) * w
    d += ` L${x.toFixed(1)} ${waveY(i / steps, layer, h).toFixed(1)}`
  }
  d += ` L${w.toFixed(1)} ${h.toFixed(1)} Z`
  return d
}

// ─── Algoritmo-fonte exibido na página ───────────────────────────────────
const SOURCE = `// t ∈ [0,1] varre a largura; cada camada vira um bloco fechado
// cuja borda de cima é a onda senoidal (vai até o fundo do SVG).
function waveY(t, layer, h) {
  const freq = layer.cycles * 2 * Math.PI
  const phase = (layer.phase * Math.PI) / 180
  const amp = h * layer.amp            // amplitude em px
  const base = h * layer.center        // altura da linha média (px, do topo)
  let s = Math.sin(freq * t + phase)
  if (layer.type === 'ripple') {       // harmônico em dobro -> ondinha extra
    s = 0.6 * s + 0.4 * Math.sin(2 * freq * t + phase * 2)
  }
  return base - amp * s                // sinal negativo = crista para cima
}

// Path de uma camada: sobe a onda de x=0 a x=w e fecha no fundo (Z).
function layerPath(layer, w, h) {
  const steps = Math.max(64, Math.round(w / 3))
  let d = 'M0 ' + h.toFixed(1) + ' L0 ' + waveY(0, layer, h).toFixed(1)
  for (let i = 1; i <= steps; i++) {
    const x = (i / steps) * w
    d += ' L' + x.toFixed(1) + ' ' + waveY(i / steps, layer, h).toFixed(1)
  }
  d += ' L' + w.toFixed(1) + ' ' + h.toFixed(1) + ' Z'
  return d
}

// Camadas são desenhadas na ordem do array: a última fica por cima.
// Gire com transform="scale(1,-1) translate(0,-h)" para virar o divisor.`

const translations = {
  pt: {
    title: 'Gerador de Onda SVG',
    intro: (
      <>
        Monta ondas decorativas em SVG — o divisor clássico de seção de
        landing pages, hero e rodapé. Ajuste quantas camadas empilhadas
        quiser (cada uma com cor, amplitude, ondulação e fase próprias),
        escolha o formato senoidal ou com harmônico e copie o SVG pronto ou
        a regra CSS <Text code>background-image</Text> com data URI pra usar
        sem arquivo nenhum. 100% client-side, nada sai do navegador.
      </>
    ),
    sizeTitle: 'Tamanho',
    width: 'Largura',
    height: 'Altura',
    waveType: 'Formato da onda',
    waveSine: 'Seno',
    waveRipple: 'Com harmônico',
    flipLabel: 'Inverter (topo ↔ base)',
    layersTitle: 'Camadas',
    addLayer: 'Adicionar camada',
    layer: (i) => `Camada ${i}`,
    color: 'Cor',
    opacity: 'Opacidade',
    amp: 'Amplitude',
    center: 'Linha média',
    cycles: 'Ondulações',
    phase: 'Fase',
    remove: 'Remover',
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
    tipTitle: 'Como usar o divisor',
    tipBody: (
      <>
        Coloque o SVG com <Text code>position: absolute; bottom: 0</Text> no
        fim do bloco de cima, ou use <Text code>background-image</Text> na
        parte de baixo do container. A primeira camada da lista é a de trás
        (desenhada primeiro) e a última fica na frente. Pra inverter o lado
        da onda (usar como rodapé de bloco escuro, por exemplo), ative o
        toggle acima ou aplique{' '}
        <Text code>transform="scale(1,-1) translate(0,-h)"</Text> direto no
        path. Data URIs são uma requisição a menos, mas não são cacheadas
        como arquivo — pra uso definitivo prefira o .svg baixado.
      </>
    ),
    howItWorks: 'Como funciona — algoritmo-fonte',
    howItWorksDesc:
      'Cada camada é um bloco fechado (polyline amostrada + Z) cuja borda de cima é y = center·h − amp·h·sen(2π·cycles·t + fase). A amostragem usa ~1 ponto por 3px (mínimo 64), suficiente pra ficar lisa sem inchar o atributo d. As camadas se empilham na ordem do array — a última renderiza por cima das anteriores.',
  },
  en: {
    title: 'SVG Wave Generator',
    intro: (
      <>
        Builds decorative SVG waves — the classic section divider for landing
        pages, heroes and footers. Stack as many layers as you want (each with
        its own color, amplitude, wavelength and phase), pick a pure sine or a
        harmonic ripple, then copy the standalone SVG or the CSS{' '}
        <Text code>background-image</Text> rule with a data URI to avoid any
        extra file. 100% client-side, nothing leaves the browser.
      </>
    ),
    sizeTitle: 'Size',
    width: 'Width',
    height: 'Height',
    waveType: 'Wave shape',
    waveSine: 'Sine',
    waveRipple: 'Ripple (harmonic)',
    flipLabel: 'Flip (top ↔ bottom)',
    layersTitle: 'Layers',
    addLayer: 'Add layer',
    layer: (i) => `Layer ${i}`,
    color: 'Color',
    opacity: 'Opacity',
    amp: 'Amplitude',
    center: 'Mean line',
    cycles: 'Cycles',
    phase: 'Phase',
    remove: 'Remove',
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
    tipTitle: 'How to use the divider',
    tipBody: (
      <>
        Place the SVG with <Text code>position: absolute; bottom: 0</Text> at
        the end of the top block, or use <Text code>background-image</Text> on
        the bottom of a container. The first layer in the list is the back one
        (drawn first); the last renders on top. To flip the wave side (e.g. as
        a footer of a dark block), toggle the switch above or apply{' '}
        <Text code>transform="scale(1,-1) translate(0,-h)"</Text> directly on
        the path. Data URIs save one request but are not cached like files —
        for permanent use prefer the downloaded .svg.
      </>
    ),
    howItWorks: 'How it works — source algorithm',
    howItWorksDesc:
      'Each layer is a closed shape (sampled polyline + Z) whose top edge is y = center·h − amp·h·sin(2π·cycles·t + phase). Sampling uses ~1 point per 3px (min 64) — smooth enough without bloating the d attribute. Layers stack in array order: the last one renders on top.',
  },
}

const DEFAULT_W = 1440
const DEFAULT_H = 300

function makeLayer(overrides = {}) {
  return {
    id: Math.random().toString(36).slice(2),
    color: '#1677ff',
    opacity: 1,
    amp: 0.09,
    center: 0.75,
    cycles: 3,
    phase: 0,
    type: 'sine',
    ...overrides,
  }
}

const PRESETS = [
  {
    key: 'sunset',
    label: 'Pôr do sol',
    enLabel: 'Sunset',
    layers: [
      makeLayer({ color: '#f5c6a6', opacity: 0.55, amp: 0.12, center: 0.8, cycles: 3, phase: 0 }),
      makeLayer({ color: '#ef7d74', opacity: 0.65, amp: 0.09, center: 0.62, cycles: 3, phase: 90 }),
      makeLayer({ color: '#9d4edd', amp: 0.06, center: 0.45, cycles: 3, phase: 180 }),
    ],
  },
  {
    key: 'ocean',
    label: 'Oceano',
    enLabel: 'Ocean',
    layers: [
      makeLayer({ color: '#85c8ff', opacity: 0.6, amp: 0.1, center: 0.78, cycles: 2, phase: 0 }),
      makeLayer({ color: '#3f92ff', amp: 0.07, center: 0.6, cycles: 2, phase: 120 }),
    ],
  },
  {
    key: 'ripple',
    label: 'Ondinha (harmônico)',
    enLabel: 'Ripple (harmonic)',
    layers: [
      makeLayer({ color: '#b5f0c9', opacity: 0.6, amp: 0.1, center: 0.8, cycles: 4, phase: 0, type: 'ripple' }),
      makeLayer({ color: '#28c76f', amp: 0.07, center: 0.62, cycles: 4, phase: 90, type: 'ripple' }),
    ],
  },
  {
    key: 'mono',
    label: 'Monocromático',
    enLabel: 'Monochrome',
    layers: [
      makeLayer({ color: '#c0c4cc', opacity: 0.6, amp: 0.12, center: 0.82, cycles: 5, phase: 0 }),
      makeLayer({ color: '#7f8794', amp: 0.08, center: 0.62, cycles: 5, phase: 60 }),
    ],
  },
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

export default function SvgWaveGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [w, setW] = useState(DEFAULT_W)
  const [h, setH] = useState(DEFAULT_H)
  const [flip, setFlip] = useState(false)
  const [layers, setLayers] = useState(() => PRESETS[1].layers.map((l) => ({ ...l })))
  const [copied, setCopied] = useState(null)

  const W = clamp(w || 100, 100, 4096)
  const H = clamp(h || 60, 60, 4096)

  const updateLayer = (id, patch) =>
    setLayers((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)))

  const addLayer = () => {
    const last = layers[layers.length - 1]
    setLayers((prev) => [
      ...prev,
      makeLayer({
        color: last?.color,
        opacity: Math.max(0.3, (last?.opacity ?? 1) - 0.25),
        amp: Math.max(0.04, (last?.amp ?? 0.09) - 0.03),
        center: Math.max(0.3, (last?.center ?? 0.75) - 0.2),
        type: last?.type,
      }),
    ])
  }

  const removeLayer = (id) => setLayers((prev) => prev.filter((l) => l.id !== id))

  const applyPreset = (p) => setLayers(p.layers.map((l) => ({ ...l })))

  const paths = useMemo(
    () => layers.map((l) => ({ ...l, d: layerPath(l, W, H) })),
    [layers, W, H]
  )

  const svgCode = useMemo(() => {
    const inner = paths.map((l) => {
      const attrs = `fill="${l.color}" fill-opacity="${l.opacity}"`
      return flip ? `<path transform="scale(1,-1) translate(0,${-H})" ${attrs} d="${l.d}"/>` : `<path ${attrs} d="${l.d}"/>`
    }).join('')
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-hidden="true">${inner}</svg>`
  }, [paths, W, H, flip])

  const cssUrl = useMemo(
    () => `background-image: url("data:image/svg+xml;utf8,${encodeURIComponent(svgCode)}");`,
    [svgCode]
  )

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
    a.download = `wave-${W}x${H}.svg`
    a.click()
    URL.revokeObjectURL(url)
  }

  const colorStyle = { width: 40, height: 32, border: 'none', cursor: 'pointer', background: 'none', padding: 0 }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><PictureOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card title={t.sizeTitle}>
        <Space wrap align="center">
          <Space>
            <Text type="secondary">{t.width}</Text>
            <InputNumber min={100} max={4096} value={w} onChange={(v) => setW(v ?? 100)} style={{ width: 100 }} />
          </Space>
          <Space>
            <Text type="secondary">{t.height}</Text>
            <InputNumber min={60} max={4096} value={h} onChange={(v) => setH(v ?? 60)} style={{ width: 100 }} />
          </Space>
          <Segmented
            value={layers[0]?.type ?? 'sine'}
            onChange={(v) => {
              const type = v
              setLayers((prev) => prev.map((l) => ({ ...l, type })))
            }}
            options={[
              { label: t.waveSine, value: 'sine' },
              { label: t.waveRipple, value: 'ripple' },
            ]}
          />
          <Space size={8}>
            <Switch size="small" checked={flip} onChange={setFlip} />
            <Text type="secondary" style={{ fontSize: 12 }}>{t.flipLabel}</Text>
          </Space>
        </Space>
      </Card>

      <Card title={t.layersTitle}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          {paths.map((l, i) => (
            <Card
              key={l.id}
              size="small"
              title={<Space size={8}><Text strong style={{ fontSize: 13 }}>{t.layer(i + 1)}</Text></Space>}
              extra={
                <Button
                  size="small"
                  danger
                  ghost
                  icon={<MinusOutlined />}
                  onClick={() => removeLayer(l.id)}
                  disabled={paths.length <= 1}
                >
                  {t.remove}
                </Button>
              }
            >
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <Space wrap align="center">
                  <Space>
                    <Text type="secondary">{t.color}</Text>
                    <input type="color" value={l.color} onChange={(e) => updateLayer(l.id, { color: e.target.value })} style={colorStyle} />
                    <Text code>{l.color}</Text>
                  </Space>
                  <Space size={4}>
                    <Text type="secondary">{t.opacity}</Text>
                    <Text code>{l.opacity.toFixed(2)}</Text>
                  </Space>
                </Space>
                <Space wrap style={{ width: '100%' }} align="start" size={24}>
                  <div style={{ width: 150 }}>
                    <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>{t.amp} · {l.amp.toFixed(3)}</Text>
                    <Slider min={0.02} max={0.3} step={0.005} value={l.amp} onChange={(v) => updateLayer(l.id, { amp: v })} tooltip={{ formatter: (v) => `${(v * H).toFixed(0)}px` }} />
                  </div>
                  <div style={{ width: 150 }}>
                    <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>{t.center} · {l.center.toFixed(2)}</Text>
                    <Slider min={0.2} max={1} step={0.01} value={l.center} onChange={(v) => updateLayer(l.id, { center: v })} tooltip={{ formatter: (v) => `${(v * H).toFixed(0)}px` }} />
                  </div>
                  <div style={{ width: 150 }}>
                    <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>{t.cycles} · {l.cycles.toFixed(1)}</Text>
                    <Slider min={1} max={8} step={0.5} value={l.cycles} onChange={(v) => updateLayer(l.id, { cycles: v })} />
                  </div>
                  <div style={{ width: 150 }}>
                    <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>{t.phase} · {l.phase}°</Text>
                    <Slider min={0} max={360} step={15} value={l.phase} onChange={(v) => updateLayer(l.id, { phase: v })} />
                  </div>
                </Space>
              </Space>
            </Card>
          ))}
          <Button icon={<PlusOutlined />} onClick={addLayer}>{t.addLayer}</Button>
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
        <div style={{ border: '1px solid #e8e8e8', borderRadius: 8, overflow: 'hidden', height: Math.min(320, Math.max(160, H)), position: 'relative', background: 'repeating-conic-gradient(#f6f6f6 0% 25%, #fff 0% 50%) 0 0 / 20px 20px' }}>
          <svg
            width="100%"
            height="100%"
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="none"
            style={{ display: 'block' }}
          >
            {paths.map((l) => (
              <path key={l.id} fill={l.color} fillOpacity={l.opacity} d={l.d} transform={flip ? `scale(1,-1) translate(0,${-H})` : undefined} />
            ))}
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
              {t.svgLabel}: {t.bytes(svgCode.length)} · {t.cssLabel}: {t.bytes(cssUrl.length)}
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
              label: <Text code>svg-wave.js</Text>,
              children: <pre style={{ margin: 0, fontSize: 12, lineHeight: 1.6 }}>{SOURCE}</pre>,
            },
          ]}
        />
      </Card>
    </Space>
  )
}
