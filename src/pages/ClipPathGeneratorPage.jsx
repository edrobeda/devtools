import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Typography, Card, Space, Button, Switch, Alert, Collapse, message, InputNumber, Row, Col, Tag } from 'antd'
import { ScissorOutlined, CopyOutlined, UndoOutlined, PlusOutlined, DeleteOutlined, SwapOutlined, ColumnWidthOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const round2 = (v) => Math.round(v * 100) / 100
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))

// Polígono regular de N lados, centrado no viewport 0..100.
function ring(n) {
  return Array.from({ length: n }, (_, i) => {
    const a = (((-90 + (360 / n) * i) * Math.PI) / 180)
    return { x: round2(50 + 50 * Math.cos(a)), y: round2(50 + 50 * Math.sin(a)) }
  })
}

// Estrela com n pontas (2n vértices alternando raio externo/interno).
function star(n, inner) {
  return Array.from({ length: n * 2 }, (_, i) => {
    const a = ((i * (180 / n) - 90) * Math.PI) / 180
    const r = i % 2 === 0 ? 50 : inner
    return { x: round2(50 + r * Math.cos(a)), y: round2(50 + r * Math.sin(a)) }
  })
}

const PRESETS = [
  { key: 'diagonal', label: { pt: 'Diagonal', en: 'Diagonal' }, make: () => [{ x: 0, y: 0 }, { x: 70, y: 0 }, { x: 100, y: 100 }, { x: 30, y: 100 }] },
  { key: 'triangle', label: { pt: 'Triângulo', en: 'Triangle' }, make: () => [{ x: 50, y: 12 }, { x: 90, y: 88 }, { x: 10, y: 88 }] },
  { key: 'notch', label: { pt: 'Entalhe à direita', en: 'Right notch' }, make: () => [{ x: 0, y: 0 }, { x: 72, y: 0 }, { x: 100, y: 50 }, { x: 72, y: 100 }, { x: 0, y: 100 }] },
  { key: 'cutCorner', label: { pt: 'Canto cortado', en: 'Cut corner' }, make: () => [{ x: 0, y: 0 }, { x: 70, y: 0 }, { x: 100, y: 30 }, { x: 100, y: 100 }, { x: 0, y: 100 }] },
  { key: 'zap', label: { pt: 'Relâmpago', en: 'Zap' }, make: () => [{ x: 50, y: 0 }, { x: 100, y: 50 }, { x: 60, y: 50 }, { x: 60, y: 100 }, { x: 0, y: 50 }, { x: 40, y: 50 }] },
  { key: 'hexagon', label: { pt: 'Hexágono', en: 'Hexagon' }, make: () => ring(6) },
  { key: 'pentagon', label: { pt: 'Pentágono', en: 'Pentagon' }, make: () => ring(5) },
  { key: 'star', label: { pt: 'Estrela', en: 'Star' }, make: () => star(5, 22) },
]

// Acha a aresta mais longa e devolve o ponto médio dela — o vértice novo
// nasce no lugar mais "seguro" do contorno, pronto pra arrastar.
function insertAtLongestEdge(points) {
  let best = 0
  let bestLen = -1
  for (let i = 0; i < points.length; i++) {
    const a = points[i]
    const b = points[(i + 1) % points.length]
    const len = (b.x - a.x) ** 2 + (b.y - a.y) ** 2
    if (len > bestLen) {
      bestLen = len
      best = i
    }
  }
  const a = points[best]
  const b = points[(best + 1) % points.length]
  return { x: round2((a.x + b.x) / 2), y: round2((a.y + b.y) / 2) }
}

function buildPolygon(points) {
  return `polygon(${points.map((p) => `${p.x}% ${p.y}%`).join(', ')})`
}

const translations = {
  pt: {
    title: 'Gerador de clip-path (Polygon)',
    intro: (
      <>
        Monta o recorte <Text code>clip-path: polygon(...)</Text> de um elemento
        arrastando os vértices direto no preview — cada ponto vira uma dupla{' '}
        <Text code>x% y%</Text> —, com polígonos prontos (estrela, hexágono,
        relâmpago...), espelhamento e CSS final com um clique de copiar.
        Complementa o <Text code>/frontend/border-radius-generator</Text>: lá a
        borda é cortada com raio; aqui a forma pode ser qualquer polígono. Tudo
        client-side, nada sai do navegador.
      </>
    ),
    tipTitle: 'Como clip-path se comporta',
    tipBody: (
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        <li>
          <Text strong>Recorta a pintura, não a caixa</Text>: o elemento continua
          ocupando a mesma área pra layout e eventos — um link que foi cortado{" "}
          <Text code>visivelmente</Text> ainda recebe clique fora do corte
          (pegadinha clássica com <Text code>z-index</Text>/overlay).
        </li>
        <li>
          <Text strong>Porcentagens √ da própria caixa</Text>: cada coordenada é
          relativa ao border box do elemento, então o mesmo polígono se adapta
          a qualquer tamanho — e ele corta também as bordas e o
          <Text code>box-shadow</Text> do elemento, que "morrem" na aresta.
        </li>
        <li>
          <Text strong>Outras formas</Text>: <Text code>circle()</Text>,{' '}
          <Text code>ellipse()</Text>, <Text code>inset()</Text> e{' '}
          <Text code>path()</Text> (curvas/arredondados, que poligono não tem).
        </li>
        <li>
          <Text strong>Sem transição entre formas</Text>: o navegador não interpola{' '}
          <Text code>polygon()</Text>→<Text code>circle()</Text> — a mudança
          "salta". Animar <Text code>clip-path</Text> com o mesmo número de
          vértices também é instável entre motores.
        </li>
      </ul>
    ),
    preview: 'Pré-visualização',
    guides: 'Mostrar guias',
    flipH: 'Espelhar horizontal',
    flipV: 'Espelhar vertical',
    reset: 'Restaurar',
    presets: 'Formas prontas',
    pointsTitle: 'Vértices do polígono',
    addPoint: 'Adicionar vértice na maior aresta',
    removePoint: 'Remover vértice',
    output: 'CSS gerado',
    copy: 'Copiar',
    copied: 'CSS copiado!',
    sourceCol: 'Código-fonte',
    sourceBody:
      'O essencial é buildPolygon (duplas x% y% separadas por vírgula) em cima do estado de pontos, o insertAtLongestEdge (acha a aresta mais longa e devolve o ponto médio), o mapeamento de clique em coordenadas 0..100 via getBoundingClientRect no drag e os geradores ring/star dos presets regulares.',
    xLabel: 'X',
    yLabel: 'Y',
    vertices: (n) => `${n} ${n === 1 ? 'vértice' : 'vértices'}`,
  },
  en: {
    title: 'clip-path Generator (Polygon)',
    intro: (
      <>
        Build the <Text code>clip-path: polygon(...)</Text> cut of an element by
        dragging vertices right on the preview — each one becomes an{' '}
        <Text code>x% y%</Text> pair —, with ready-made shapes (star, hexagon,
        zap...) and horizontal/vertical mirroring, ending in copy-ready CSS.
        Complements <Text code>/frontend/border-radius-generator</Text>: that
        one rounds corners, this one cuts arbitrary polygons. 100% client-side.
      </>
    ),
    tipTitle: 'How clip-path behaves',
    tipBody: (
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        <li>
          <Text code>clip-path</Text> clips the paint, not the box: layout and
          pointer events keep using the full area — a link that looks cut off is
          still clickable outside the visible shape (classic pitfall).
        </li>
        <li>
          <Text strong>Percentages are relative to the element itself</Text>:{' '}
          each pair maps to the border box, so the same polygon rescales to any
          size — and borders and <Text code>box-shadow</Text> get clipped too
          (they "die" at the edge).
        </li>
        <li>
          <Text strong>Other shapes</Text>: <Text code>circle()</Text>,{' '}
          <Text code>ellipse()</Text>, <Text code>inset()</Text> and{' '}
          <Text code>path()</Text> (for rounded/complex silhouettes — polygons
          have no rounded corners).
        </li>
        <li>
          <Text strong>No interpolation between functions</Text>: browsers won't
          tween <Text code>polygon()</Text>→<Text code>circle()</Text> — the
          change jumps. Animating between polygons with the same vertex count is
          also engine-dependent.
        </li>
      </ul>
    ),
    preview: 'Live preview',
    guides: 'Show guides',
    flipH: 'Flip horizontal',
    flipV: 'Flip vertical',
    reset: 'Reset',
    presets: 'Ready shapes',
    pointsTitle: 'Polygon vertices',
    addPoint: 'Add vertex on longest edge',
    removePoint: 'Remove vertex',
    output: 'Generated CSS',
    copy: 'Copy',
    copied: 'CSS copied!',
    sourceCol: 'Source code',
    sourceBody:
      'buildPolygon (x% y% pairs joined by commas) on top of the points state, insertAtLongestEdge (finds the longest edge and inserts its midpoint), the drag mapping into 0..100 coordinates via getBoundingClientRect, and the ring/star generators behind the regular presets.',
    xLabel: 'X',
    yLabel: 'Y',
    vertices: (n) => `${n} ${n === 1 ? 'vertex' : 'vertices'}`,
  },
}

const SOURCE = [insertAtLongestEdge, ring, star].map((fn) => fn.toString()).join('\n\n')

export default function ClipPathGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [points, setPoints] = useState(() => PRESETS[0].make())
  const [showGuides, setShowGuides] = useState(true)
  const [dragIndex, setDragIndex] = useState(null)
  const canvasRef = useRef(null)

  const cssRule = useMemo(() => {
    if (points.length < 3) return ''
    return `clip-path: ${buildPolygon(points)};`
  }, [points])

  // Enquanto segura um vértice, um listener global de pointermove traduz o
  // cursor pra coordenadas 0..100 no espaço do preview (getBoundingClientRect)
  // e atualiza só aquele ponto. O listener sai junto com o drag.
  useEffect(() => {
    if (dragIndex === null) return
    const el = canvasRef.current
    if (!el) return

    const onMove = (e) => {
      const rect = el.getBoundingClientRect()
      const x = clamp(((e.clientX - rect.left) / rect.width) * 100, 0, 100)
      const y = clamp(((e.clientY - rect.top) / rect.height) * 100, 0, 100)
      setPoints((prev) => prev.map((p, i) => (i === dragIndex ? { x: round2(x), y: round2(y) } : p)))
    }
    const onEnd = () => setDragIndex(null)

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onEnd)
    window.addEventListener('pointercancel', onEnd)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onEnd)
      window.removeEventListener('pointercancel', onEnd)
    }
  }, [dragIndex])

  const setPoint = (i, patch) => setPoints((prev) => prev.map((p, idx) => (idx === i ? { ...p, ...patch } : p)))

  const addVertex = () => setPoints((prev) => (prev.length >= 2 ? [...prev, insertAtLongestEdge(prev)] : prev))

  const removeVertex = (i) => setPoints((prev) => (prev.length <= 3 ? prev : prev.filter((_, idx) => idx !== i)))

  const flipH = () => setPoints((prev) => prev.map((p) => ({ x: round2(100 - p.x), y: p.y })))
  const flipV = () => setPoints((prev) => prev.map((p) => ({ x: p.x, y: round2(100 - p.y) })))

  const polygonPoints = useMemo(() => points.map((p) => `${p.x},${p.y}`).join(' '), [points])

  const copy = () => {
    if (!cssRule) return
    navigator.clipboard.writeText(cssRule)
    message.success(t.copied)
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><ScissorOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Alert type="info" showIcon message={t.tipTitle} description={t.tipBody} />

      <Card title={t.preview}>
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <Space wrap>
            <Switch checked={showGuides} onChange={setShowGuides} /> <Text type="secondary" style={{ fontSize: 12 }}>{t.guides}</Text>
            <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>{t.vertices(points.length)}</Text>
          </Space>

          <div
            ref={canvasRef}
            style={{
              position: 'relative',
              width: '100%',
              height: 300,
              borderRadius: 10,
              overflow: 'hidden',
              touchAction: 'none',
              userSelect: 'none',
              cursor: dragIndex !== null ? 'grabbing' : 'default',
            }}
          >
            <div style={{ position: 'absolute', inset: 0, background: 'repeating-conic-gradient(#e7eaf0 0% 25%, #ffffff 0% 50%) 0 0 / 22px 22px' }} />

            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(135deg, #1677ff 0%, #722ed1 100%)',
                clipPath: buildPolygon(points),
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: 15,
                  textShadow: '0 2px 6px rgba(0,0,0,0.25)',
                }}
              >
                DevTools
              </div>
            </div>

            {showGuides && (
              <>
                <svg
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                >
                  <polygon
                    points={polygonPoints}
                    fill="rgba(22, 119, 255, 0.08)"
                    stroke="#1677ff"
                    strokeWidth={1.5}
                    vectorEffect="non-scaling-stroke"
                    strokeDasharray="4 3"
                  />
                </svg>
                {points.map((p, i) => (
                  <div
                    key={i}
                    role="button"
                    tabIndex={0}
                    aria-label={`point ${i + 1}`}
                    onPointerDown={(e) => {
                      if (!showGuides) return
                      e.preventDefault()
                      setDragIndex(i)
                    }}
                    style={{
                      position: 'absolute',
                      left: `${p.x}%`,
                      top: `${p.y}%`,
                      width: 20,
                      height: 20,
                      marginLeft: -10,
                      marginTop: -10,
                      borderRadius: '50%',
                      border: '2.5px solid #fff',
                      boxShadow: '0 0 0 1.5px #1677ff, 0 1px 4px rgba(0,0,0,0.2)',
                      background: dragIndex === i ? '#faad14' : '#1677ff',
                      cursor: 'grab',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontSize: 9,
                      fontWeight: 700,
                    }}
                  >
                    {i + 1}
                  </div>
                ))}
              </>
            )}
          </div>
        </Space>
      </Card>

      <Card title={t.presets}>
        <Space wrap>
          {PRESETS.map((preset) => (
            <Button key={preset.key} size="small" onClick={() => setPoints(preset.make)}>
              {preset.label[lang]}
            </Button>
          ))}
          <Button size="small" icon={<ColumnWidthOutlined />} onClick={flipH}>{t.flipH}</Button>
          <Button size="small" icon={<SwapOutlined />} onClick={flipV}>{t.flipV}</Button>
          <Button size="small" icon={<UndoOutlined />} onClick={() => setPoints(PRESETS[0].make)}>{t.reset}</Button>
        </Space>
      </Card>

      <Card
        title={`${t.pointsTitle} (${points.length})`}
        extra={
          <Space>
            <Button size="small" icon={<PlusOutlined />} onClick={addVertex}>{t.addPoint}</Button>
          </Space>
        }
      >
        <Space direction="vertical" style={{ width: '100%' }} size="small">
          {points.map((p, i) => (
            <Row key={i} gutter={[8, 8]} align="middle" wrap>
              <Col flex="none">
                <Tag style={{ minWidth: 22, textAlign: 'center' }}>{i + 1}</Tag>
              </Col>
              <Col flex="none">
                <Text code style={{ fontSize: 12 }}>({p.x}%, {p.y}%)</Text>
              </Col>
              <Col xs={12} sm={8}>
                <InputNumber
                  size="small"
                  min={0}
                  max={100}
                  step={1}
                  value={p.x}
                  onChange={(v) => setPoint(i, { x: round2(clamp(Number(v) || 0, 0, 100)) })}
                  style={{ width: '100%' }}
                  addonBefore={t.xLabel}
                />
              </Col>
              <Col xs={12} sm={8}>
                <InputNumber
                  size="small"
                  min={0}
                  max={100}
                  step={1}
                  value={p.y}
                  onChange={(v) => setPoint(i, { y: round2(clamp(Number(v) || 0, 0, 100)) })}
                  style={{ width: '100%' }}
                  addonBefore={t.yLabel}
                />
              </Col>
              <Col xs={24} sm={8}>
                <Button
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  disabled={points.length <= 3}
                  onClick={() => removeVertex(i)}
                >
                  {t.removePoint}
                </Button>
              </Col>
            </Row>
          ))}
        </Space>
      </Card>

      <Card
        title={t.output}
        extra={<Button size="small" icon={<CopyOutlined />} onClick={copy} disabled={!cssRule}>{t.copy}</Button>}
      >
        <pre style={{ margin: 0, overflowX: 'auto' }}>
          <code>{cssRule || '/* selecione pelo menos 3 vértices */'}</code>
        </pre>
      </Card>

      <Collapse
        items={[
          {
            key: 'source',
            label: `${t.sourceCol} — buildPolygon / insertAtLongestEdge / ring / star`,
            children: (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Paragraph type="secondary">{t.sourceBody}</Paragraph>
                <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 320 }}>
                  <code>{SOURCE}</code>
                </pre>
              </Space>
            ),
          },
        ]}
      />
    </Space>
  )
}