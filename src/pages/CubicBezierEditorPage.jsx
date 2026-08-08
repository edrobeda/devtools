import React, { useMemo, useRef, useState } from 'react'
import {
  Row, Col, Card, Space, Typography, Button, InputNumber,
  Alert, Collapse, Slider, Switch, message,
} from 'antd'
import { LineChartOutlined, CopyOutlined, CheckOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

// ─── Geometria do gráfico (SVG) ──────────────────────────────────────────
const X = 500            // viewBox X
const H = 240            // viewBox Y
const Y_MIN = -0.7       // faixa visível de y (permite overshoot / negativo)
const Y_MAX = 1.7

const toX = (v) => v * X
const toY = (v) => ((Y_MAX - v) / (Y_MAX - Y_MIN)) * H
const fromSvg = (sx, sy) => ({
  x: Math.min(1, Math.max(0, sx / X)),
  y: Math.min(Y_MAX, Math.max(Y_MIN, Y_MAX - (sy / H) * (Y_MAX - Y_MIN))),
})
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))

// ─── Matemática de Bézier ────────────────────────────────────────────────
// P0=(0,0), P3=(1,1); a curva é B(t) = (1-t)³·P0 + 3(1-t)²t·P1 + 3(1-t)t²·P2 + t³·P3
function makeEasing(x1, y1, x2, y2) {
  const cx = 3 * x1
  const bx = 3 * (x2 - x1) - cx
  const ax = 1 - cx - bx
  const cy = 3 * y1
  const by = 3 * (y2 - y1) - cy
  const ay = 1 - cy - by
  const Xt = (t) => ((ax * t + bx) * t + cx) * t
  const Yt = (t) => ((ay * t + by) * t + cy) * t
  const dXt = (t) => (3 * ax * t + 2 * bx) * t + cx
  // dado um progresso p (0..1), acha o t que faz X(t)=p e devolve Y(t).
  // x1,x2 em [0,1] garantem que X é estritamente crescente = solução única.
  return (p) => {
    let t = p
    for (let i = 0; i < 8; i++) {          // Newton-Raphson
      const err = Xt(t) - p
      if (Math.abs(err) < 1e-6) return Yt(t)
      const d = dXt(t)
      if (Math.abs(d) < 1e-8) break
      t -= err / d
    }
    let lo = 0, hi = 1
    for (let i = 0; i < 24; i++) {         // fallback: bissecção
      const mid = (lo + hi) / 2
      if (Xt(mid) < p) lo = mid
      else hi = mid
    }
    return Yt((lo + hi) / 2)
  }
}

// ponto paramétrico B(t) — desenha a curva e o marcador animado
function curvePoint(t, p1, p2) {
  const u = 1 - t
  const a = u * u * u
  const b = 3 * u * u * t
  const c = 3 * u * t * t
  const d = t * t * t
  return {
    x: b * p1.x + c * p2.x + d,
    y: b * p1.y + c * p2.y + d,
  }
}

const fmt = (n) => String(Math.round(n * 10000) / 10000)

const presets = {
  keywords: [
    { label: 'linear', x1: 0, y1: 0, x2: 1, y2: 1 },
    { label: 'ease', x1: 0.25, y1: 0.1, x2: 0.25, y2: 1 },
    { label: 'ease-in', x1: 0.42, y1: 0, x2: 1, y2: 1 },
    { label: 'ease-out', x1: 0, y1: 0, x2: 0.58, y2: 1 },
    { label: 'ease-in-out', x1: 0.42, y1: 0, x2: 0.58, y2: 1 },
  ],
  overshoot: [
    { label: 'ease-in-back', x1: 0.6, y1: -0.28, x2: 0.74, y2: 0.05 },
    { label: 'ease-out-back', x1: 0.34, y1: 1.56, x2: 0.64, y2: 1 },
    { label: 'ease-in-out-back', x1: 0.68, y1: -0.6, x2: 0.32, y2: 1.6 },
    { label: 'out-elastic-lite', x1: 0.25, y1: 1, x2: 0.45, y2: 1.05 },
    { label: 'snap-in', x1: 0.55, y1: 0.005, x2: 1, y2: 1 },
  ],
}

const solverSource = `// aCurve: P0=(0,0) e P3=(1,1); P1/P2 são os dois handles arrastáveis.
// B(t) = (1-t)³·P0 + 3(1-t)²·t·P1 + 3(1-t)·t²·P2 + t³·P3
function makeEasing(x1, y1, x2, y2) {
  const cx = 3 * x1
  const bx = 3 * (x2 - x1) - cx
  const ax = 1 - cx - bx
  const cy = 3 * y1
  const by = 3 * (y2 - y1) - cy
  const ay = 1 - cy - by

  const Xt = (t) => ((ax * t + bx) * t + cx) * t   // Horner
  const Yt = (t) => ((ay * t + by) * t + cy) * t
  const dXt = (t) => (3 * ax * t + 2 * bx) * t + cx

  // dado progresso p (0..1), acha t com Xt(t)=p e devolve Yt(t).
  // x1,x2 em [0,1] -> Xt estritamente crescente -> solução única
  return (p) => {
    let t = p
    for (let i = 0; i < 8; i++) {           // 1) Newton-Raphson
      const err = Xt(t) - p
      if (Math.abs(err) < 1e-6) return Yt(t)
      const d = dXt(t)
      if (Math.abs(d) < 1e-8) break
      t -= err / d
    }
    let lo = 0, hi = 1                      // 2) fallback: bissecção
    for (let i = 0; i < 24; i++) {
      const mid = (lo + hi) / 2
      if (Xt(mid) < p) lo = mid
      else hi = mid
    }
    return Yt((lo + hi) / 2)
  }
}`.trim()

const translations = {
  pt: {
    title: 'Editor de Curva de Easing (cubic-bezier)',
    intro: (
      <>
        Ajuste visualmente a função de temporização de uma <Text code>transition</Text>{' '}
        ou <Text code>animation</Text> CSS. Arraste os dois pontos de controle{' '}
        <Text code>P1</Text> e <Text code>P2</Text> sobre o gráfico e o valor{' '}
        <Text code>cubic-bezier(x1, y1, x2, y2)</Text> pronto pra copiar sai junto.
        A curva é o "feeling" do movimento: começo lento e acelera, overshoot no
        final, começa rápido e desacelera etc. 100% client-side, nada sai do
        navegador.
      </>
    ),
    curveCard: 'Curva',
    dragHint: 'Arraste os pontos de controle. P1 fora de [0,1] conserva o eixo x; movendo P2 além de y=1 (ou abaixo de 0) cria o efeito "back", que volta além do alvo antes de assentar.',
    valuesCard: 'Pontos de controle',
    resetValues: 'Resetar curva',
    resetPreview: 'Voltar ao início',
    presetsCard: 'Atalhos CSS (keywords)',
    presetsOvershoot: 'Curvas de efeito (overshoot)',
    outputCard: 'Valor pronto pra copiar',
    cssUsage: 'Uso numa transição',
    usageBody: 'O mesmo easing funciona em qualquer transition/animation — é só trocar o nome da propriedade. As keywords (ease, ease-in…) o navegador resolve sozinho; são atalhos pra curvas fixas.',
    previewTitle: 'Preview animado',
    playLabel: 'Rodar',
    stopLabel: 'Parar',
    durationLabel: 'Duração (ms)',
    loopLabel: 'Loop',
    easedAt: 'saída em',
    noteTitle: 'Como ler a curva',
    noteBody: (
      <>
        A curva é <Text code>B(t) = (1−t)³·P0 + 3(1−t)²t·P1 + 3(1−t)t²·P2 + t³·P3</Text>{' '}
        com P0=(0,0) e P3=(1,1). O progresso do tempo é o eixo horizontal (0→1) e
        o resultado animado é o eixo vertical (0→1). Toda curva anda de baixo pra
        cima; o que muda é a <i>velocidade</i>: mais inclinada no começo = começa
        rápido, mais plana no fim = desacelera. Ponto com y fora de [0,1] dá graça:
        negativo "antecipa" (afasta antes de ir) e acima de 1 "estoura" além do
        alvo (o efeito back). Regra do CSS: <Text code>x1</Text>/<Text code>x2</Text>{' '}
        precisam estar em [0,1] — senão a curva não é função do progresso — enquanto
        y é livre.
      </>
    ),
    noteBody2:
      'As keywords CSS são atalhos de curvas fixas: linear = (0,0,1,1), ease = (0.25, 0.1, 0.25, 1), ease-in = (0.42, 0, 1, 1), ease-out = (0, 0, 0.58, 1), ease-in-out = (0.42, 0, 0.58, 1). O preview abaixo anima um retângulo com a curva gerada e o marcador vermelho percorre exatamente B(t).',
    sourceTitle: 'Como funciona — algoritmo-fonte',
    sourceDesc: (
      <>
        Desenhar a curva é direto: amostra <Text code>B(t)</Text> em ~60 pontos e
        liga. O truque é o <i>inverso</i>: dado o progresso p (tempo 0..1), achar
        o t em que <Text code>X(t) = p</Text> e devolver <Text code>Y(t)</Text>.
        Como x1,x2 ∈ [0,1] tornam X(t) estritamente crescente, Newton-Raphson
        converge depressa, com bissecção como fallback.
      </>
    ),
    copy: 'Copiar',
    copied: 'Copiado!',
    copyError: 'Não foi possível copiar',
  },
  en: {
    title: 'Cubic Bézier Easing Editor',
    intro: (
      <>
        Tune the timing curve of a CSS <Text code>transition</Text> or{' '}
        <Text code>animation</Text> visually: drag the two handles{' '}
        <Text code>P1</Text> and <Text code>P2</Text> on the chart and the{' '}
        <Text code>cubic-bezier(x1, y1, x2, y2)</Text> value is generated. The
        curve IS the feel of motion — starts slow then flies, overshoots the
        target, brakes at the end, etc. 100% client-side, nothing leaves the
        browser.
      </>
    ),
    curveCard: 'Curve',
    dragHint: 'Drag the control points. P1 outside [0,1]? x is kept in range; pushing P2 past y=1 (or below 0) creates the "back" overshoot feel that settles into the target.',
    valuesCard: 'Control points',
    resetValues: 'Reset curve',
    presetsCard: 'CSS keywords',
    presetsOvershoot: 'Effect curves (overshoot)',
    resetPreview: 'Back to start',
    outputCard: 'Ready-to-copy value',
    cssUsage: 'Usage in a transition',
    usageBody: 'Works in any transition/animation — just swap the animated property. The keywords (ease, ease-in…) are built-in shortcuts for fixed curves.',
    previewTitle: 'Animated preview',
    playLabel: 'Play',
    stopLabel: 'Stop',
    durationLabel: 'Duration (ms)',
    loopLabel: 'Loop',
    easedAt: 'output at',
    noteTitle: 'How to read the curve',
    noteBody: (
      <>
        The curve is <Text code>B(t) = (1−t)³·P0 + 3(1−t)²t·P1 + 3(1−t)t²·P2 + t³·P3</Text>{' '}
        with P0 = (0,0) and P3 = (1,1). Time progress runs on the x axis (0→1)
        and the animation output on the y axis (0→1). Every curve travels
        bottom-left to top-right; what varies is the <i>speed</i>: steeper at the
        start = quick begin, flatter near the top = easing out. Values of y below
        0 "anticipate" (pull back first) and above 1 "overshoot" past the target
        (the back effect). CSS rule: <Text code>x1</Text>/<Text code>x2</Text> must
        stay in [0,1] so the curve stays a function of progress — y is free.
      </>
    ),
    noteBody2:
      'The built-in keywords are shortcuts for fixed curves: linear = (0,0,1,1), ease = (0.25, 0.1, 0.25, 1), ease-in = (0.42, 0, 1, 1), ease-out = (0, 0, 0.58, 1), ease-in-out = (0.42, 0, 0.58, 1). The preview below animates a box with the exact generated curve and the red marker walks the B(t) path.',
    sourceTitle: 'How it works — source algorithm',
    sourceDesc: (
      <>
        Drawing the curve is just sampling <Text code>B(t)</Text> at ~60 points.
        The real trick is the inverse: for a given progress p, find the t such
        that <Text code>X(t) = p</Text> and read off <Text code>Y(t)</Text>.
        Because x1, x2 ∈ [0,1] make X(t) strictly increasing, Newton-Raphson
        converges fast, with bisection as a safe fallback.
      </>
    ),
    copy: 'Copy',
    copied: 'Copied!',
    copyError: 'Could not copy',
  },
}

export default function CubicBezierEditorPage() {
  const { lang } = useLanguage()
  const t = translations[lang] || translations.pt

  const [p1, setP1] = useState({ x: 0.42, y: 0 })
  const [p2, setP2] = useState({ x: 0.58, y: 1 })
  const [progress, setProgress] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [dur, setDur] = useState(900)
  const [loopPlay, setLoopPlay] = useState(true)
  const [copied, setCopied] = useState(false)
  const svgRef = useRef(null)
  const dragRef = useRef(null)
  const startRef = useRef(null)

  const set1 = (v) => setP1({ x: clamp(v.x, 0, 1), y: clamp(v.y, Y_MIN, Y_MAX) })
  const set2 = (v) => setP2({ x: clamp(v.x, 0, 1), y: clamp(v.y, Y_MIN, Y_MAX) })

  const ease = useMemo(() => makeEasing(p1.x, p1.y, p2.x, p2.y), [p1, p2])

  const curvePath = useMemo(() => {
    let d = ''
    for (let i = 0; i <= 60; i++) {
      const pt = curvePoint(i / 60, p1, p2)
      d += (i === 0 ? 'M' : 'L') + toX(pt.x).toFixed(1) + ' ' + toY(pt.y).toFixed(1) + ' '
    }
    return d
  }, [p1, p2])

  const cssValue = useMemo(
    () => `cubic-bezier(${fmt(p1.x)}, ${fmt(p1.y)}, ${fmt(p2.x)}, ${fmt(p2.y)})`,
    [p1, p2]
  )

  const usageSnippet = useMemo(
    () => `.box {
  transition: transform 300ms ${cssValue};
}
.box:hover { transform: translateX(160px); }`,
    [cssValue]
  )

  const marker = useMemo(() => {
    const pt = curvePoint(clamp(progress, 0, 1), p1, p2)
    return { x: toX(pt.x), y: toY(pt.y), eased: ease(clamp(progress, 0, 1)) }
  }, [progress, p1, p2, ease])

  function play() {
    setProgress(0)
    startRef.current = null
    setPlaying(true)
  }
  function stop() {
    setPlaying(false)
  }
  function resetPreview() {
    setPlaying(false)
    setProgress(0)
    startRef.current = null
  }
  function resetCurve() {
    setPlaying(false)
    setProgress(0)
    startRef.current = null
    setP1({ x: 0.42, y: 0 })
    setP2({ x: 0.58, y: 1 })
  }
  function applyPreset(p) {
    setPlaying(false)
    setProgress(0)
    startRef.current = null
    setP1({ x: p.x1, y: p.y1 })
    setP2({ x: p.x2, y: p.y2 })
  }

  // rAF: avança o progresso enquanto playing estiver ligado
  React.useEffect(() => {
    if (!playing) {
      startRef.current = null
      return undefined
    }
    let rafId
    const step = (now) => {
      if (startRef.current === null) startRef.current = now
      const p = Math.min(1, (now - startRef.current) / dur)
      if (p >= 1) {
        if (loopPlay) {
          startRef.current = now
          setProgress(0)
        } else {
          setProgress(1)
          setPlaying(false)
          return
        }
      } else {
        setProgress(p)
      }
      rafId = requestAnimationFrame(step)
    }
    rafId = requestAnimationFrame(step)
    return () => cancelAnimationFrame(rafId)
  }, [playing, loopPlay, dur])

  function ptFromEvent(e) {
    const rect = svgRef.current.getBoundingClientRect()
    return fromSvg(
      ((e.clientX - rect.left) / rect.width) * X,
      ((e.clientY - rect.top) / rect.height) * H,
    )
  }
  function handleDown(which, e) {
    e.preventDefault()
    dragRef.current = which
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  function handleMove(e) {
    if (dragRef.current === 'p1') set1(ptFromEvent(e))
    else if (dragRef.current === 'p2') set2(ptFromEvent(e))
  }
  function handleUp(e) {
    dragRef.current = null
    if (e.currentTarget.hasPointerCapture && e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(cssValue)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      message.error(t.copyError)
    }
  }

  const p1x = p1.x, p1y = p1.y, p2x = p2.x, p2y = p2.y
  const playLabel = playing ? t.stopLabel : t.playLabel

  const gridV = [0.25, 0.5, 0.75]
  const gridH = [-0.5, -0.25, 0.25, 0.5, 0.75, 1.25, 1.5]

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><LineChartOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Row gutter={[24, 24]} justify="center">
        <Col xs={24} md={14}>
          <Card title={t.curveCard}>
            <svg
              ref={svgRef}
              viewBox={`0 0 ${X} ${H}`}
              style={{
                width: '100%',
                height: 'auto',
                display: 'block',
                touchAction: 'none',
                userSelect: 'none',
                cursor: 'default',
              }}
            >
              {/* grade vertical */}
              {gridV.map((v) => (
                <line key={`v${v}`} x1={toX(v)} y1="0" x2={toX(v)} y2={H} stroke="#f0f0f0" strokeWidth="2" />
              ))}
              {/* grade horizontal */}
              {gridH.map((v) => (
                <line key={`h${v}`} x1="0" y1={toY(v)} x2={X} y2={toY(v)} stroke="#f0f0f0" strokeWidth="2" />
              ))}
              {/* eixos y=0 e y=1 (mais fortes) */}
              <line x1="0" y1={toY(1)} x2={X} y2={toY(1)} stroke="#d9d9d9" strokeWidth="2" />
              <line x1="0" y1={toY(0)} x2={X} y2={toY(0)} stroke="#d9d9d9" strokeWidth="2" />

              {/* curva */}
              <path d={curvePath} fill="none" stroke="#1677ff" strokeWidth="5" strokeLinecap="round" />

              {/* retas de controle */}
              <line x1={toX(0)} y1={toY(0)} x2={toX(p1x)} y2={toY(p1y)} stroke="#1677ff" strokeOpacity="0.5" strokeDasharray="6 5" strokeWidth="2" />
              <line x1={toX(1)} y1={toY(1)} x2={toX(p2x)} y2={toY(p2y)} stroke="#fa8c16" strokeOpacity="0.5" strokeDasharray="6 5" strokeWidth="2" />

              {/* marcador animado */}
              <circle cx={marker.x} cy={marker.y} r="7" fill="#f5222d" stroke="#fff" strokeWidth="2" />
              <text x={marker.x} y={marker.y - 12} textAnchor="middle" fontSize="15" fill="#f5222d" fontWeight="700">
                {marker.eased.toFixed(2)}
              </text>

              {/* P1 */}
              <circle cx={toX(p1x)} cy={toY(p1y)} r="16" fill="rgba(22,119,255,0.15)" />
              <circle
                cx={toX(p1x)} cy={toY(p1y)} r="9" fill="#1677ff" stroke="#fff" strokeWidth="2"
                style={{ cursor: 'grab' }}
                onPointerDown={(e) => handleDown('p1', e)}
                onPointerMove={handleMove}
                onPointerUp={handleUp}
                onPointerCancel={handleUp}
              />
              <text x={toX(p1x)} y={toY(p1y) - 26} textAnchor="middle" fontSize="13" fill="#1677ff">P1</text>

              {/* P2 */}
              <circle cx={toX(p2x)} cy={toY(p2y)} r="16" fill="rgba(250,140,22,0.15)" />
              <circle
                cx={toX(p2x)} cy={toY(p2y)} r="9" fill="#fa8c16" stroke="#fff" strokeWidth="2"
                style={{ cursor: 'grab' }}
                onPointerDown={(e) => handleDown('p2', e)}
                onPointerMove={handleMove}
                onPointerUp={handleUp}
                onPointerCancel={handleUp}
              />
              <text x={toX(p2x)} y={toY(p2y) + 28} textAnchor="middle" fontSize="13" fill="#fa8c16">P2</text>

              {/* extremidades */}
              <circle cx={toX(0)} cy={toY(0)} r="6" fill="#fff" stroke="#1677ff" strokeWidth="2" />
              <circle cx={toX(1)} cy={toY(1)} r="6" fill="#fff" stroke="#fa8c16" strokeWidth="2" />
            </svg>
            <Paragraph type="secondary" style={{ marginTop: 10, fontSize: 12, marginBottom: 0 }}>
              {t.dragHint}
            </Paragraph>
          </Card>
        </Col>

        <Col xs={24} md={10}>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Card title={t.valuesCard}>
              <Row gutter={[8, 8]}>
                <Col span={6}><Text type="secondary">x1</Text></Col>
                <Col span={6}><Text type="secondary">y1</Text></Col>
                <Col span={6}><Text type="secondary">x2</Text></Col>
                <Col span={6}><Text type="secondary">y2</Text></Col>
                <Col span={6}>
                  <InputNumber min={0} max={1} step={0.01} value={p1x} onChange={(v) => set1({ x: v ?? 0, y: p1y })} style={{ width: '100%', fontFamily: 'monospace' }} />
                </Col>
                <Col span={6}>
                  <InputNumber min={Y_MIN} max={Y_MAX} step={0.01} value={p1y} onChange={(v) => set1({ x: p1x, y: v ?? 0 })} style={{ width: '100%', fontFamily: 'monospace' }} />
                </Col>
                <Col span={6}>
                  <InputNumber min={0} max={1} step={0.01} value={p2x} onChange={(v) => set2({ x: v ?? 0, y: p2y })} style={{ width: '100%', fontFamily: 'monospace' }} />
                </Col>
                <Col span={6}>
                  <InputNumber min={Y_MIN} max={Y_MAX} step={0.01} value={p2y} onChange={(v) => set2({ x: p2x, y: v ?? 0 })} style={{ width: '100%', fontFamily: 'monospace' }} />
                </Col>
              </Row>
              <Space style={{ marginTop: 12 }}>
                <Button size="small" onClick={resetCurve}>{t.resetValues}</Button>
              </Space>
            </Card>

            <Card title={t.outputCard}>
              <Space wrap>
                <Text code style={{ fontSize: 14 }}>{cssValue}</Text>
                <Button
                  size="small"
                  type="primary"
                  icon={copied ? <CheckOutlined /> : <CopyOutlined />}
                  onClick={copy}
                >
                  {copied ? t.copied : t.copy}
                </Button>
              </Space>
              <Text strong style={{ fontSize: 13, display: 'block', marginTop: 14 }}>{t.cssUsage}</Text>
              <pre style={{ margin: '8px 0 0', overflowX: 'auto', fontSize: 12, background: '#fafafa', padding: '10px 12px', borderRadius: 6 }}>
                <code>{usageSnippet}</code>
              </pre>
              <Paragraph type="secondary" style={{ marginTop: 8, fontSize: 12, marginBottom: 0 }}>
                {t.usageBody}
              </Paragraph>
            </Card>
          </Space>
        </Col>
      </Row>

      <Card title={t.presetsCard}>
        <Space wrap>
          {presets.keywords.map((p) => (
            <Button key={p.label} size="small" onClick={() => applyPreset(p)}>{p.label}</Button>
          ))}
        </Space>
      </Card>

      <Card title={t.presetsOvershoot}>
        <Space wrap>
          {presets.overshoot.map((p) => (
            <Button key={p.label} size="small" onClick={() => applyPreset(p)}>{p.label}</Button>
          ))}
        </Space>
      </Card>

      <Card title={t.previewTitle}>
        <Space wrap align="center" size="large">
          <Button type="primary" onClick={playing ? stop : play}>{playLabel}</Button>
          <Space>
            <Text type="secondary">{t.durationLabel}</Text>
            <Slider min={100} max={4000} step={50} value={dur} onChange={setDur} style={{ width: 180 }} />
            <Text code>{dur}ms</Text>
          </Space>
          <Space>
            <Text type="secondary">{t.loopLabel}</Text>
            <Switch checked={loopPlay} onChange={setLoopPlay} />
          </Space>
        </Space>
        <div style={{
          position: 'relative',
          height: 52,
          marginTop: 16,
          background: '#fafafa',
          borderRadius: 8,
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute',
            top: 6, bottom: 6,
            width: 44, borderRadius: 6,
            background: '#1677ff',
            left: `calc(${(marker.eased * 100).toFixed(3)}% - 22px)`,
          }} />
        </div>
      </Card>

      <Alert type="info" showIcon message={t.noteTitle} description={<>{t.noteBody} {t.noteBody2}</>} />

      <Card title={t.sourceTitle}>
        <Paragraph type="secondary">{t.sourceDesc}</Paragraph>
        <Collapse
          items={[{
            key: 'src',
            label: <Text code>cubic-bezier.js</Text>,
            children: <pre style={{ margin: 0, fontSize: 13, lineHeight: 1.65 }}>{solverSource}</pre>,
          }]}
        />
      </Card>
    </Space>
  )
}