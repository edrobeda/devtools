import React, { useEffect, useMemo, useState } from 'react'
import { Typography, Card, Space, Slider, Switch, Segmented, Alert, Collapse, Button, message, Select, Popconfirm, Row, Col } from 'antd'
import { PlayCircleOutlined, ReloadOutlined, PlusOutlined, DeleteOutlined, UndoOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const ANIM_NAME = 'devtools-kf-anim'

let uid = 1
function nextId() {
  return uid++
}

const PROP_KEYS = ['opacity', 'translateX', 'translateY', 'scale', 'rotate']

const PROP_SLIDERS = [
  { key: 'opacity', min: 0, max: 100, unit: '%' },
  { key: 'translateX', min: -200, max: 200, unit: 'px' },
  { key: 'translateY', min: -200, max: 200, unit: 'px' },
  { key: 'scale', min: 0, max: 2, step: 0.05 },
  { key: 'rotate', min: -360, max: 360, unit: 'deg' },
]

function fmt(v) {
  const r = Math.round(v * 100) / 100
  return String(Object.is(r, -0) ? 0 : r)
}

function buildStopFrame(s) {
  const transform = `translate(${fmt(s.translateX)}px, ${fmt(s.translateY)}px) scale(${fmt(s.scale)}) rotate(${fmt(s.rotate)}deg)`
  return `  ${s.p}% { opacity: ${fmt(s.opacity / 100)}; transform: ${transform}; }`
}

function buildStopsCss(stops) {
  return [...stops].sort((a, b) => a.p - b.p).map(buildStopFrame).join('\n')
}

function buildKeyframes(stops) {
  return `@keyframes ${ANIM_NAME} {\n${buildStopsCss(stops)}\n}`
}

// Insere um frame novo no MAIOR intervalo entre stops consecutivos, interpolando
// as propriedades dos dois vizinhos na posição do meio — assim o frame extra
// nasce coerente com a curva que a animação já descreve.
function insertStop(stops) {
  const sorted = [...stops].sort((a, b) => a.p - b.p)
  let best = 0
  let bestGap = -1
  for (let i = 0; i < sorted.length - 1; i++) {
    const gap = sorted[i + 1].p - sorted[i].p
    if (gap > bestGap) {
      bestGap = gap
      best = i
    }
  }
  const a = sorted[best]
  const b = sorted[best + 1]
  const p = Math.round((a.p + b.p) / 2)
  const t = (p - a.p) / (b.p - a.p)
  const mix = (va, vb) => Math.round((va + (vb - va) * t) * 100) / 100
  const s = {}
  PROP_KEYS.forEach((k) => {
    s[k] = mix(a[k], b[k])
  })
  return { id: nextId(), p, ...s }
}

function makeDefaultStops() {
  return [
    { id: nextId(), p: 0, opacity: 100, translateX: 0, translateY: 0, scale: 1, rotate: 0 },
    { id: nextId(), p: 50, opacity: 100, translateX: 160, translateY: 0, scale: 1.15, rotate: 20 },
    { id: nextId(), p: 100, opacity: 100, translateX: 0, translateY: 0, scale: 1, rotate: 0 },
  ]
}

const EASINGS = [
  { value: 'linear', label: 'linear' },
  { value: 'ease', label: 'ease' },
  { value: 'ease-in', label: 'ease-in' },
  { value: 'ease-out', label: 'ease-out' },
  { value: 'ease-in-out', label: 'ease-in-out' },
  { value: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)', label: 'ease-out + overshoot' },
  { value: 'cubic-bezier(0.25, 0.1, 0.25, 1.45)', label: 'spring / slow' },
]

const translations = {
  pt: {
    title: 'Gerador de Keyframes (CSS Animation)',
    intro:
      'Monta a regra @keyframes de uma animação passo a passo — cada frame dita opacidade e transform (deslocamento, escala, rotação) —, ajusta duração, easing, iterações, direção e preenchimento, e copia o CSS pronto. O preview usa um @keyframes de verdade injetado na própria página; nada sai do navegador.',
    tipTitle: 'Como a animação se comporta',
    tipBody: (
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        <li>
          <Text strong>Só o par amigo da GPU</Text>: <Text code>transform</Text> e <Text code>opacity</Text> despacham direto ao
          compositor — largura/altura/<Text code>top</Text>/<Text code>left</Text> por frame forçam layout em cada tick e ficam travando.
        </li>
        <li>
          <Text strong>Ordem do transform importa</Text>: as funções são aplicadas da esquerda pra direita.{' '}
          <Text code>translate → scale → rotate</Text> é a cadeia mais natural — a rotação gira em volta da origem do
          elemento já deslocado.
        </li>
        <li>
          <Text strong>Frame repetido</Text>: o último com o mesmo <Text code>%</Text> vence. Se faltar <Text code>0%</Text>/
          <Text code>100%</Text>, o navegador injeta o estado-base do elemento.
        </li>
        <li>
          <Text strong>Easing vale por trecho</Text>: um <Text code>animation-timing-function</Text> dentro de um frame sobrepõe o
          easing global naquele intervalo — dá pra acelerar em um trecho e desacelerar no outro.
        </li>
      </ul>
    ),
    preview: 'Pré-visualização ao vivo',
    play: 'Tocar',
    pause: 'Pausar',
    replay: 'Repetir',
    timeline: 'Linha do tempo dos frames',
    controlsTitle: 'Configurações da animação',
    duration: 'Duração',
    easing: 'Easing',
    iterations: 'Iterações',
    direction: 'Direção',
    fill: 'Preenchimento (fill-mode)',
    stopsTitle: 'Frames da animação',
    addStop: 'Adicionar frame',
    reset: 'Restaurar',
    removeFrame: 'Remover este frame?',
    confirmOk: 'Remover',
    confirmCancel: 'Cancelar',
    remove: 'Remover',
    position: 'Posição',
    opacity: 'Opacidade',
    translateX: 'Desloc. X',
    translateY: 'Desloc. Y',
    scale: 'Escala',
    rotate: 'Rotação',
    output: 'CSS gerado',
    copy: 'Copiar',
    copied: 'CSS de animação copiado!',
    sourceCol: 'Código-fonte',
    sourceBody:
      'O coração é buildKeyframes (monta o bloco e o shorthand, com fmt limpando zeros à direita) + insertStop (acha o maior intervalo entre frames e insere no meio, interpolando as propriedades dos vizinhos pelo mesmo fator t).',
  },
  en: {
    title: 'CSS Keyframes Builder',
    intro:
      'Build a @keyframes rule step by step — each frame sets opacity and transform (translate, scale, rotate) — tune duration, easing, iterations, direction and fill-mode, then copy the ready CSS. The preview runs a real @keyframes block injected in this page; nothing leaves the browser.',
    tipTitle: 'How the animation behaves',
    tipBody: (
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        <li>
          <Text strong>Only the GPU-friendly pair</Text>: <Text code>transform</Text> and <Text code>opacity</Text> animate on
          the compositor — width/height/<Text code>top</Text>/<Text code>left</Text> force layout on every tick and get janky.
        </li>
        <li>
          <Text strong>Transform order matters</Text>: functions apply left to right.{' '}
          <Text code>translate → scale → rotate</Text> is the most natural chain — rotation spins around the origin of the
          already-translated box.
        </li>
        <li>
          <Text strong>Repeated key</Text>: the last stop with the same <Text code>%</Text> wins. If <Text code>0%</Text>/
          <Text code>100%</Text> are missing, the browser backfills the element&apos;s base state.
        </li>
        <li>
          <Text strong>Easing is per segment</Text>: an <Text code>animation-timing-function</Text> inside a frame overrides
          the global easing for that in-between interval — speed up one span, slow down another.
        </li>
      </ul>
    ),
    preview: 'Live preview',
    play: 'Play',
    pause: 'Pause',
    replay: 'Replay',
    timeline: 'Intervals timeline',
    controlsTitle: 'Animation settings',
    duration: 'Duration',
    easing: 'Easing',
    iterations: 'Iterations (dur.)',
    direction: 'Direction',
    fill: 'Fill-mode',
    stopsTitle: 'Keyframes',
    addStop: 'Add keyframe',
    reset: 'Reset',
    removeFrame: 'Remove this keyframe?',
    confirmOk: 'Remove',
    confirmCancel: 'Cancel',
    remove: 'Remove',
    position: 'Position',
    opacity: 'Opacity',
    translateX: 'X offset',
    translateY: 'Y offset',
    scale: 'Scale',
    rotate: 'Rotation',
    output: 'Generated CSS',
    copy: 'Copy',
    copied: 'Animation CSS copied!',
    sourceCol: 'Source code',
    sourceBody:
      'The heart is buildKeyframes (assembles the block and shorthand, normalizing trailing zeros via fmt) plus insertStop (finds the widest gap between frames and inserts the midpoint by interpolating the neighbors with factor t).',
  },
}

const SOURCE = [buildKeyframes, insertStop].map((fn) => fn.toString()).join('\n\n')

export default function KeyframeGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [stops, setStops] = useState(() => makeDefaultStops())
  const [playing, setPlaying] = useState(false)
  const [duration, setDuration] = useState(1400)
  const [easing, setEasing] = useState('ease-in-out')
  const [iteration, setIteration] = useState('infinite')
  const [direction, setDirection] = useState('normal')
  const [fill, setFill] = useState('none')
  const [runId, setRunId] = useState(0)

  const updateStop = (id, patch) => setStops((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)))

  const addStop = () => setStops((prev) => [...prev, insertStop(prev)])

  const removeStop = (id) => setStops((prev) => (prev.length <= 2 ? prev : prev.filter((s) => s.id !== id)))

  const reset = () => setStops(makeDefaultStops())

  const keyframesCss = useMemo(() => buildKeyframes(stops), [stops])
  const sortedStops = useMemo(() => [...stops].sort((a, b) => a.p - b.p), [stops])

  const animShorthand = useMemo(
    () => `animation: ${ANIM_NAME} ${duration}ms ${easing} ${iteration} ${direction} ${fill};`,
    [duration, easing, iteration, direction, fill]
  )

  const output = `${keyframesCss}\n\n${animShorthand}`

  // Enquanto a animação estiver tocando, qualquer mudança de frame/configuração
  // remonta o quadrado do preview (muda a key) e a animação recomeça do zero —
  // sem isso o navegador só reavalia os keyframes num tempo incerto.
  useEffect(() => {
    if (playing) setRunId((n) => n + 1)
  }, [playing, keyframesCss, duration, easing, iteration, direction, fill])

  const copy = () => {
    navigator.clipboard.writeText(output)
    message.success(t.copied)
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><PlayCircleOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Alert type="info" showIcon message={t.tipTitle} description={t.tipBody} />

      <Card title={t.preview}>
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <Space wrap>
            <Switch checked={playing} onChange={setPlaying} />
            <Text>{playing ? t.pause : t.play}</Text>
            <Button size="small" icon={<ReloadOutlined />} onClick={() => { setPlaying(true); setRunId((n) => n + 1) }}>
              {t.replay}
            </Button>
          </Space>

          <div
            style={{
              padding: 8,
              borderRadius: 10,
              background: 'repeating-conic-gradient(#e7eaf0 0% 25%, #ffffff 0% 50%) 0 0 / 20px 20px',
            }}
          >
            <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div
                key={playing ? `run-${runId}` : 'paused'}
                style={{
                  width: 112,
                  height: 96,
                  borderRadius: 16,
                  background: 'linear-gradient(135deg, #1677ff, #722ed1)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: 13,
                  userSelect: 'none',
                  boxShadow: '0 10px 24px rgba(22, 119, 255, 0.25)',
                  animation: playing ? animShorthand : undefined,
                }}
              >
                DevTools
              </div>
            </div>
          </div>

          <Space direction="vertical" size={4} style={{ width: '100%' }}>
            <Text type="secondary" style={{ fontSize: 12 }}>{t.timeline}</Text>
            <div style={{ position: 'relative', height: 10, borderRadius: 5, background: '#f0f0f0' }}>
              {sortedStops.map((s) => (
                <div
                  key={s.id}
                  title={`${s.p}%`}
                  style={{
                    position: 'absolute',
                    left: `${s.p}%`,
                    top: -3,
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    transform: 'translateX(-50%)',
                    border: '2px solid #fff',
                    boxShadow: '0 0 0 1px #1677ff',
                    background: '#1677ff',
                  }}
                />
              ))}
            </div>
            <Space wrap size={[4, 4]}>
              {sortedStops.map((s) => (
                <Text key={s.id} code style={{ fontSize: 11 }}>{s.p}%</Text>
              ))}
            </Space>
          </Space>
        </Space>
      </Card>

      <Card title={t.controlsTitle}>
        <Row gutter={[24, 16]}>
          <Col xs={24} md={8}>
            <Space direction="vertical" style={{ width: '100%' }} size={0}>
              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.duration}</Text>
                <Text code>{duration}ms</Text>
              </Space>
              <Slider min={100} max={5000} step={100} value={duration} onChange={setDuration} />
            </Space>
          </Col>
          <Col xs={24} md={8}>
            <Space direction="vertical" style={{ width: '100%' }} size={4}>
              <Text>{t.easing}</Text>
              <Select
                style={{ width: '100%' }}
                value={easing}
                onChange={setEasing}
                options={EASINGS}
              />
            </Space>
          </Col>
          <Col xs={24} md={8}>
            <Space direction="vertical" style={{ width: '100%' }} size={4}>
              <Text>{t.iterations}</Text>
              <Segmented
                value={iteration}
                onChange={setIteration}
                options={[
                  { label: '1', value: '1' },
                  { label: '∞', value: 'infinite' },
                ]}
              />
            </Space>
          </Col>
          <Col xs={24} md={12}>
            <Space direction="vertical" style={{ width: '100%' }} size={4}>
              <Text>{t.direction}</Text>
              <Segmented
                value={direction}
                onChange={setDirection}
                options={['normal', 'reverse', 'alternate', 'alternate-reverse']}
              />
            </Space>
          </Col>
          <Col xs={24} md={12}>
            <Space direction="vertical" style={{ width: '100%' }} size={4}>
              <Text>{t.fill}</Text>
              <Segmented
                value={fill}
                onChange={setFill}
                options={['none', 'forwards', 'backwards', 'both']}
              />
            </Space>
          </Col>
        </Row>
      </Card>

      <Card
        title={t.stopsTitle}
        extra={
          <Space>
            <Button size="small" icon={<PlusOutlined />} onClick={addStop}>{t.addStop}</Button>
            <Button size="small" icon={<UndoOutlined />} onClick={reset}>{t.reset}</Button>
          </Space>
        }
      >
        {stops.map((s) => (
          <div
            key={s.id}
            style={{
              border: '1px solid #f0f0f0',
              borderRadius: 8,
              background: '#fafafa',
              padding: '12px 16px',
              marginBottom: 12,
            }}
          >
            <Row align="middle" gutter={[16, 8]}>
              <Col xs={24} md={18}>
                <Space direction="vertical" style={{ width: '100%' }} size={0}>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text strong>{t.position}: <Text code>{s.p}%</Text></Text>
                  </Space>
                  <Slider min={0} max={100} value={s.p} onChange={(v) => updateStop(s.id, { p: v })} />
                </Space>
              </Col>
              <Col xs={24} sm={6} style={{ textAlign: 'right' }}>
                <Popconfirm
                  title={t.removeFrame}
                  okText={t.confirmOk}
                  cancelText={t.confirmCancel}
                  onConfirm={() => removeStop(s.id)}
                >
                  <Button
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    disabled={stops.length <= 2}
                  >
                    {t.remove}
                  </Button>
                </Popconfirm>
              </Col>
            </Row>
            <Row gutter={[16, 8]} style={{ marginTop: 8 }}>
              {PROP_SLIDERS.map((prop) => (
                <Col key={prop.key} xs={12} sm={8} md={7} lg={5}>
                  <Space direction="vertical" style={{ width: '100%' }} size={0}>
                    <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>{t[prop.key]}</Text>
                      <Text code style={{ fontSize: 12 }}>{fmt(s[prop.key])}{prop.unit || ''}</Text>
                    </Space>
                    <Slider
                      min={prop.min}
                      max={prop.max}
                      step={prop.step || 1}
                      value={s[prop.key]}
                      onChange={(v) => updateStop(s.id, { [prop.key]: v })}
                    />
                  </Space>
                </Col>
              ))}
            </Row>
          </div>
        ))}
      </Card>

      <Card
        title={t.output}
        extra={<Button size="small" icon={<CopyOutlined />} onClick={copy}>{t.copy}</Button>}
      >
        <pre style={{ margin: 0, overflowX: 'auto' }}>
          <code>{output}</code>
        </pre>
      </Card>

      <Collapse
        items={[
          {
            key: 'source',
            label: `${t.sourceCol} — buildKeyframes / insertStop`,
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