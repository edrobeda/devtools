import React, { useMemo, useState } from 'react'
import {
  Typography, Card, Space, Segmented, Input, Slider, Select, Button,
  Table, Collapse, message, Alert, Row, Col, Tag,
} from 'antd'
import { LineChartOutlined, CopyOutlined, CaretRightOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography
const { useMessage } = message

const FLY_KEYFRAMES =
  '@keyframes devtools-ease-fly {\n' +
  '  from { left: 0; }\n' +
  '  to { left: calc(100% - 14px); }\n' +
  '}'

const SAMPLE_CSS =
  '.box {\n' +
  '  transition: transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1);\n' +
  '}\n\n' +
  '@keyframes slide-in {\n' +
  '  from { transform: translateX(-24px); opacity: 0; }\n' +
  '  to { transform: translateX(0); opacity: 1; }\n' +
  '}\n\n' +
  '.modal {\n' +
  '  animation: slide-in 220ms ease-out both;\n' +
  '}'

const EASINGS = [
  { cat: 'keys', name: 'linear', value: 'linear', kind: 'curve', bezier: [0, 0, 1, 1],
    use: { pt: 'Velocidade constante do início ao fim. Boa pra barras de progresso e transições de cor.', en: 'Constant speed end to end. Good for progress bars and color transitions.' } },
  { cat: 'keys', name: 'ease', value: 'ease', kind: 'curve', bezier: [0.25, 0.1, 0.25, 1],
    use: { pt: 'Padrão das transitions: começa rápida e desacelera no fim.', en: 'Default for transitions: starts fast and decelerates at the end.' } },
  { cat: 'keys', name: 'ease-in', value: 'ease-in', kind: 'curve', bezier: [0.42, 0, 1, 1],
    use: { pt: 'Começa lenta e acelera. Boa pra coisas entrando em alta velocidade.', en: 'Starts slow and accelerates. Good for things entering at speed.' } },
  { cat: 'keys', name: 'ease-out', value: 'ease-out', kind: 'curve', bezier: [0, 0, 0.58, 1],
    use: { pt: 'Começa rápida e desacelera. A mais usada pra UI pousando no lugar.', en: 'Starts fast and decelerates. The go-to for UI settling into place.' } },
  { cat: 'keys', name: 'ease-in-out', value: 'ease-in-out', kind: 'curve', bezier: [0.42, 0, 0.58, 1],
    use: { pt: 'Lenta nas pontas, rápida no meio. Ideal pra fades e movimento simétrico.', en: 'Slow at both ends, fast in the middle. Ideal for fades and symmetric motion.' } },

  { cat: 'poly', name: 'easeInQuad', value: 'cubic-bezier(0.11, 0, 0.5, 0)', kind: 'curve', bezier: [0.11, 0, 0.5, 0],
    use: { pt: 'Entrada com aceleração constante (t²).', en: 'Entry with constant acceleration (t²).' } },
  { cat: 'poly', name: 'easeOutQuad', value: 'cubic-bezier(0.5, 1, 0.89, 1)', kind: 'curve', bezier: [0.5, 1, 0.89, 1],
    use: { pt: 'Saída com desaceleração constante (1-(1-t)²).', en: 'Exit with constant deceleration (1-(1-t)²).' } },
  { cat: 'poly', name: 'easeInOutQuad', value: 'cubic-bezier(0.45, 0, 0.55, 1)', kind: 'curve', bezier: [0.45, 0, 0.55, 1],
    use: { pt: 'Entrada e saída quadráticas; meio neutro.', en: 'Quadratic ease-in and ease-out; neutral middle.' } },
  { cat: 'poly', name: 'easeInCubic', value: 'cubic-bezier(0.32, 0, 0.67, 0)', kind: 'curve', bezier: [0.32, 0, 0.67, 0],
    use: { pt: 'Acelera mais intensamente que a Quad (t³).', en: 'Accelerates harder than Quad (t³).' } },
  { cat: 'poly', name: 'easeOutCubic', value: 'cubic-bezier(0.33, 1, 0.68, 1)', kind: 'curve', bezier: [0.33, 1, 0.68, 1],
    use: { pt: 'Deceleração cúbica; a preferida de muitos designers.', en: 'Cubic deceleration; a favorite among designers.' } },
  { cat: 'poly', name: 'easeInOutCubic', value: 'cubic-bezier(0.65, 0, 0.35, 1)', kind: 'curve', bezier: [0.65, 0, 0.35, 1],
    use: { pt: 'Cúbica simétrica: lenta nas pontas.', en: 'Symmetric cubic: slow at the ends.' } },
  { cat: 'poly', name: 'easeInQuart', value: 'cubic-bezier(0.5, 0, 0.75, 0)', kind: 'curve', bezier: [0.5, 0, 0.75, 0],
    use: { pt: 'Entrada quártica, bem enérgica.', en: 'Quartic entry, quite energetic.' } },
  { cat: 'poly', name: 'easeOutQuart', value: 'cubic-bezier(0.25, 1, 0.5, 1)', kind: 'curve', bezier: [0.25, 1, 0.5, 1],
    use: { pt: 'Parada bem suave no fim.', en: 'Very smooth landing at the end.' } },
  { cat: 'poly', name: 'easeInOutQuart', value: 'cubic-bezier(0.76, 0, 0.24, 1)', kind: 'curve', bezier: [0.76, 0, 0.24, 1],
    use: { pt: 'Quártica simétrica, pra movimentos mais longos.', en: 'Symmetric quartic for longer motion.' } },
  { cat: 'poly', name: 'easeInQuint', value: 'cubic-bezier(0.64, 0, 0.78, 0)', kind: 'curve', bezier: [0.64, 0, 0.78, 0],
    use: { pt: 'Entrada quinta: quase uma queda livre.', en: 'Quintic entry: almost a free fall.' } },
  { cat: 'poly', name: 'easeOutQuint', value: 'cubic-bezier(0.22, 1, 0.36, 1)', kind: 'curve', bezier: [0.22, 1, 0.36, 1],
    use: { pt: 'Frenagem quinta: bem suave no fim.', en: 'Quintic braking: very soft at the end.' } },
  { cat: 'poly', name: 'easeInOutQuint', value: 'cubic-bezier(0.83, 0, 0.17, 1)', kind: 'curve', bezier: [0.83, 0, 0.17, 1],
    use: { pt: 'Quinta simétrica, bem dramática.', en: 'Symmetric quintic, quite dramatic.' } },

  { cat: 'expo', name: 'easeInExpo', value: 'cubic-bezier(0.7, 0, 0.84, 0)', kind: 'curve', bezier: [0.7, 0, 0.84, 0],
    use: { pt: 'Exponencial: quase parada e dispara no fim.', en: 'Exponential: nearly still, then takes off at the end.' } },
  { cat: 'expo', name: 'easeOutExpo', value: 'cubic-bezier(0.16, 1, 0.3, 1)', kind: 'curve', bezier: [0.16, 1, 0.3, 1],
    use: { pt: 'Exponencial de saída: chega voando e estanca.', en: 'Exponential exit: arrives flying, stops dead.' } },
  { cat: 'expo', name: 'easeInOutExpo', value: 'cubic-bezier(0.87, 0, 0.13, 1)', kind: 'curve', bezier: [0.87, 0, 0.13, 1],
    use: { pt: 'A mais "lenta no meio" das exponenciais.', en: 'The slowest-in-the-middle of the exponentials.' } },
  { cat: 'expo', name: 'easeInCirc', value: 'cubic-bezier(0.55, 0, 1, 0.45)', kind: 'curve', bezier: [0.55, 0, 1, 0.45],
    use: { pt: 'Circular: acelera ao longo de um arco.', en: 'Circular: accelerates along an arc.' } },
  { cat: 'expo', name: 'easeOutCirc', value: 'cubic-bezier(0, 0.55, 0.45, 1)', kind: 'curve', bezier: [0, 0.55, 0.45, 1],
    use: { pt: 'Circular de saída, com cauda longa.', en: 'Circular exit with a long tail.' } },
  { cat: 'expo', name: 'easeInOutCirc', value: 'cubic-bezier(0.85, 0, 0.15, 1)', kind: 'curve', bezier: [0.85, 0, 0.15, 1],
    use: { pt: 'Circular simétrica.', en: 'Symmetric circular.' } },

  { cat: 'back', name: 'easeInBack', value: 'cubic-bezier(0.36, 0, 0.66, -0.56)', kind: 'curve', bezier: [0.36, 0, 0.66, -0.56],
    use: { pt: 'Puxa pra trás antes de avançar.', en: 'Pulls back before moving forward.' } },
  { cat: 'back', name: 'easeOutBack', value: 'cubic-bezier(0.34, 1.56, 0.64, 1)', kind: 'curve', bezier: [0.34, 1.56, 0.64, 1],
    use: { pt: 'Ultrapassa o alvo e volta; o efeito "spring".', en: 'Overshoots the target, then settles; the "spring" feel.' } },
  { cat: 'back', name: 'easeInOutBack', value: 'cubic-bezier(0.68, -0.6, 0.32, 1.6)', kind: 'curve', bezier: [0.68, -0.6, 0.32, 1.6],
    use: { pt: 'Spring com overshoot nas duas pontas.', en: 'Spring with overshoot at both ends.' } },

  { cat: 'material', name: 'standard', value: 'cubic-bezier(0.4, 0, 0.2, 1)', kind: 'curve', bezier: [0.4, 0, 0.2, 1],
    use: { pt: 'Movimento dentro da tela (Material Design).', en: 'In-screen motion (Material Design).' } },
  { cat: 'material', name: 'decelerate', value: 'cubic-bezier(0, 0, 0.2, 1)', kind: 'curve', bezier: [0, 0, 0.2, 1],
    use: { pt: 'Elementos entrando na tela.', en: 'Elements entering the screen.' } },
  { cat: 'material', name: 'accelerate', value: 'cubic-bezier(0.4, 0, 1, 1)', kind: 'curve', bezier: [0.4, 0, 1, 1],
    use: { pt: 'Elementos saindo da tela.', en: 'Elements leaving the screen.' } },
  { cat: 'material', name: 'sharp', value: 'cubic-bezier(0.4, 0, 0.6, 1)', kind: 'curve', bezier: [0.4, 0, 0.6, 1],
    use: { pt: 'Rápida, pra elementos pequenos.', en: 'Fast curve for small elements.' } },

  { cat: 'steps', name: 'step-start', value: 'step-start', kind: 'step', steps: 1, jump: 'start',
    use: { pt: 'Salta direto pro estado final; ideal pra mudanças on/off.', en: 'Jumps straight to the end state; best for on/off changes.' } },
  { cat: 'steps', name: 'step-end', value: 'step-end', kind: 'step', steps: 1, jump: 'end',
    use: { pt: 'Espera a duração inteira e salta no fim.', en: 'Waits out the whole duration, then jumps at the end.' } },
  { cat: 'steps', name: 'steps(4)', value: 'steps(4)', kind: 'step', steps: 4, jump: 'end',
    use: { pt: '4 quadros discretos; o padrão é jump-end.', en: '4 discrete frames; the default is jump-end.' } },
  { cat: 'steps', name: 'steps(4, jump-start)', value: 'steps(4, jump-start)', kind: 'step', steps: 4, jump: 'start',
    use: { pt: '4 passos, o primeiro quadro sai imediatamente.', en: '4 steps; the first frame plays immediately.' } },
  { cat: 'steps', name: 'steps(4, jump-none)', value: 'steps(4, jump-none)', kind: 'step', steps: 4, jump: 'none',
    use: { pt: 'Sem salto no início nem no fim (n-1 divisões).', en: 'No jump at either end (n-1 divisions).' } },
  { cat: 'steps', name: 'steps(4, jump-both)', value: 'steps(4, jump-both)', kind: 'step', steps: 4, jump: 'both',
    use: { pt: 'Saltos nas duas pontas; dobra o nº de passos.', en: 'Jumps at both ends; doubles the step count.' } },
]

const CATEGORIES = [
  { value: 'all', pt: 'Todas', en: 'All' },
  { value: 'keys', pt: 'Palavras-chave', en: 'Keywords' },
  { value: 'poly', pt: 'Polinomiais (Quad→Quint)', en: 'Polynomial (Quad→Quint)' },
  { value: 'expo', pt: 'Expo & Circular', en: 'Expo & Circular' },
  { value: 'back', pt: 'Back (overshoot)', en: 'Back (overshoot)' },
  { value: 'material', pt: 'Material Design', en: 'Material Design' },
  { value: 'steps', pt: 'Stepping (passos)', en: 'Stepping' },
]

const DEFAULT_RACE = ['ease-in-out', 'easeOutCubic', 'easeOutBack', 'standard']

function parseCubicBezier(value) {
  const m = value.match(/^cubic-bezier\(\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*\)$/)
  if (!m) return null
  return m.slice(1).map(Number)
}

function keywordBezier(value) {
  const map = {
    linear: [0, 0, 1, 1],
    ease: [0.25, 0.1, 0.25, 1],
    'ease-in': [0.42, 0, 1, 1],
    'ease-out': [0, 0, 0.58, 1],
    'ease-in-out': [0.42, 0, 0.58, 1],
  }
  return map[value] || null
}

function bezierPoint(c, t) {
  const u = 1 - t
  const [x1, y1, x2, y2] = c
  return {
    x: 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t,
    y: 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t,
  }
}

function curvePolyline(c, w, h, pad) {
  const samples = 64
  const pts = []
  for (let i = 0; i <= samples; i += 1) {
    const p = bezierPoint(c, i / samples)
    pts.push([pad + p.x * (w - 2 * pad), h - pad - p.y * (h - 2 * pad)])
  }
  return pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
}

function stepValue(t, steps, jump) {
  const x = Math.min(1, Math.max(0, t))
  if (steps <= 1) return jump === 'start' ? 1 : x >= 1 ? 1 : 0
  if (jump === 'start') return Math.min(1, (Math.floor(x * steps) + 1) / steps)
  if (jump === 'none') return Math.min(1, Math.floor(x * steps) / (steps - 1))
  if (jump === 'both') return Math.min(1, (Math.floor(x * steps) + 0.5) / steps)
  return x >= 1 ? 1 : Math.floor(x * steps) / steps
}

function stepPolyline(steps, jump, w, h, pad) {
  const n = Math.max(1, steps)
  const pts = []
  for (let i = 0; i < n; i += 1) {
    const x0 = pad + (i / n) * (w - 2 * pad)
    const x1 = pad + ((i + 1) / n) * (w - 2 * pad)
    const yTop = h - pad - stepValue(i / n, n, jump) * (h - 2 * pad)
    const yNext = h - pad - stepValue((i + 1) / n, n, jump) * (h - 2 * pad)
    pts.push(`${x0.toFixed(1)},${yTop.toFixed(1)}`)
    pts.push(`${x1.toFixed(1)},${yTop.toFixed(1)}`)
    pts.push(`${x1.toFixed(1)},${yNext.toFixed(1)}`)
  }
  return pts.join(' ')
}

function EaseCurve({ item, width = 132, height = 48 }) {
  const pad = 4
  let pts
  if (item.kind === 'step') {
    pts = stepPolyline(item.steps, item.jump, width, height, pad)
  } else {
    const bez = item.bezier || parseCubicBezier(item.value) || keywordBezier(item.value) || [0, 0, 1, 1]
    pts = curvePolyline(bez, width, height, pad)
  }
  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <line x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} stroke="#d9d9d9" strokeWidth={1} />
      <line x1={pad} y1={height - pad} x2={width - pad} y2={pad} stroke="#f0f0f0" strokeWidth={1} />
      <polyline points={pts} fill="none" stroke="#1677ff" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

const translations = {
  pt: {
    title: 'Cheat Sheet: Funções de Easing CSS',
    intro: (
      <>
        Catálogo das funções de temporização do CSS: palavras-chave, o conjunto
        clássico de <Text code>cubic-bezier()</Text> (baseado no easings.net),
        as curvas do Material Design e as funções de passo. Cada entrada mostra
        a curva, o valor prontinho pra copiar e quando usá-la — e dá pra
        comparar várias ao vivo abaixo.
      </>
    ),
    noteTitle: 'Como ler',
    noteBody: (
      <>
        Em <Text code>cubic-bezier(x1, y1, x2, y2)</Text>, <Text code>x1</Text> e{' '}
        <Text code>x2</Text> controlam o <em>progresso</em> ao longo do tempo e
        ficam sempre em 0–1; <Text code>y1</Text> e <Text code>y2</Text> controlam a{' '}
        <em>velocidade</em> e podem passar de 1 (ou abaixo de 0) — é isso que
        gera o overshoot dos easings <Text code>back</Text>. Já{' '}
        <Text code>steps()</Text> não interpola: divide a transição em quadros
        discretos (útil pra animação de sprites e contadores).
      </>
    ),
    raceTitle: 'Comparador ao vivo',
    raceHint: 'Escolha até 4 easings e aperte "Rodar" — ou mexa na duração, que a corrida recomeça.',
    raceSelect: 'Easings na pista',
    raceDuration: 'Duração',
    raceRun: 'Rodar',
    referenceTitle: 'Referência',
    searchPlaceholder: 'Filtrar por nome, valor ou uso…',
    showing: 'Mostrando',
    col: { curve: 'Curva', name: 'Nome', value: 'Valor CSS', use: 'Quando usar' },
    copy: 'Copiar',
    copied: 'Copiado!',
    copyError: 'Não foi possível copiar',
    exampleTitle: 'Exemplo de uso',
    sourceTitle: 'Código-fonte',
    sourceBody: 'parseCubicBezier e keywordBezier extraem os pontos de controle; curvePolyline amostra a curva Bézier cúbica e stepPolyline desenha a escadinha das funções steps().',
    catKeys: 'Palavras-chave',
    catPoly: 'Polinomiais',
    catExpo: 'Expo & Circular',
    catBack: 'Back (overshoot)',
    catMaterial: 'Material Design',
    catSteps: 'Stepping (passos)',
  },
  en: {
    title: 'Cheat Sheet: CSS Easing Functions',
    intro: (
      <>
        A catalog of CSS timing functions: keywords, the classic{' '}
        <Text code>cubic-bezier()</Text> set (based on easings.net), the Material
        Design curves and the stepping functions. Each entry shows the curve,
        the copy-ready value and when to use it — and you can race several of
        them live below.
      </>
    ),
    noteTitle: 'How to read it',
    noteBody: (
      <>
        In <Text code>cubic-bezier(x1, y1, x2, y2)</Text>, <Text code>x1</Text>{' '}
        and <Text code>x2</Text> drive <em>progress</em> over time and always
        stay in 0–1; <Text code>y1</Text> and <Text code>y2</Text> drive{' '}
        <em>speed</em> and may exceed 1 (or drop below 0) — that is what creates
        the overshoot of the <Text code>back</Text> easings. In contrast,{' '}
        <Text code>steps()</Text> does not interpolate: it slices the transition
        into discrete frames (handy for sprite animation and counters).
      </>
    ),
    raceTitle: 'Live racer',
    raceHint: 'Pick up to 4 easings and hit "Run" — or drag the duration slider, which restarts the race.',
    raceSelect: 'Easings on track',
    raceDuration: 'Duration',
    raceRun: 'Run',
    referenceTitle: 'Reference',
    searchPlaceholder: 'Filter by name, value or use…',
    showing: 'Showing',
    col: { curve: 'Curve', name: 'Name', value: 'CSS value', use: 'When to use' },
    copy: 'Copy',
    copied: 'Copied!',
    copyError: 'Could not copy',
    exampleTitle: 'Usage example',
    sourceTitle: 'Source code',
    sourceBody: 'parseCubicBezier and keywordBezier extract the control points; curvePolyline samples the cubic Bézier and stepPolyline draws the staircase of the steps() functions.',
    catKeys: 'Keywords',
    catPoly: 'Polynomials',
    catExpo: 'Expo & Circular',
    catBack: 'Back (overshoot)',
    catMaterial: 'Material Design',
    catSteps: 'Stepping',
  },
}

export default function CssEasingCheatsheetPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [messageApi, messageContextHolder] = useMessage()

  const [category, setCategory] = useState('all')
  const [query, setQuery] = useState('')
  const [raceNames, setRaceNames] = useState(DEFAULT_RACE)
  const [duration, setDuration] = useState(1200)
  const [runId, setRunId] = useState(0)

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return EASINGS.filter((item) => {
      if (category !== 'all' && item.cat !== category) return false
      if (!q) return true
      const haystack = `${item.name} ${item.value} ${item.use.pt} ${item.use.en}`.toLowerCase()
      return haystack.includes(q)
    })
  }, [category, query])

  const raceItems = useMemo(
    () => raceNames.map((name) => EASINGS.find((e) => e.name === name)).filter(Boolean),
    [raceNames]
  )

  const catOptions = CATEGORIES.map((c) => ({ value: c.value, label: c[lang] }))
  const valueOptions = EASINGS.map((e) => ({ value: e.name, label: e.name }))

  const copy = async (value) => {
    try {
      await navigator.clipboard.writeText(value)
      messageApi.success(t.copied)
    } catch {
      messageApi.error(t.copyError)
    }
  }

  const columns = [
    {
      title: t.col.curve,
      dataIndex: 'name',
      width: 160,
      render: (_, item) => <EaseCurve item={item} />,
    },
    {
      title: t.col.name,
      dataIndex: 'name',
      width: 190,
      render: (v) => <Text strong>{v}</Text>,
    },
    {
      title: t.col.value,
      dataIndex: 'value',
      width: 240,
      render: (v) => (
        <Space size={4} wrap>
          <Text code>{v}</Text>
          <Button size="small" type="text" icon={<CopyOutlined />} onClick={() => copy(v)} />
        </Space>
      ),
    },
    {
      title: t.col.use,
      dataIndex: ['use', lang],
      render: (v) => <Text type="secondary">{v}</Text>,
    },
  ]

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {messageContextHolder}
      <Title level={2}><LineChartOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <style>{FLY_KEYFRAMES}</style>

      <Alert type="info" showIcon message={t.noteTitle} description={t.noteBody} />

      <Card title={t.raceTitle}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} md={10}>
              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text type="secondary">{t.raceSelect}</Text>
                <Select
                  mode="multiple"
                  maxCount={4}
                  maxTagCount="responsive"
                  value={raceNames}
                  onChange={setRaceNames}
                  options={valueOptions}
                  style={{ width: '100%' }}
                />
              </Space>
            </Col>
            <Col xs={24} md={8}>
              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text type="secondary">{t.raceDuration}: {duration}ms</Text>
                <Slider min={100} max={2000} step={50} value={duration} onChange={setDuration} />
              </Space>
            </Col>
            <Col xs={24} md={6}>
              <Button type="primary" icon={<CaretRightOutlined />} onClick={() => setRunId((r) => r + 1)}>
                {t.raceRun}
              </Button>
            </Col>
          </Row>

          <Space direction="vertical" size={8} style={{ width: '100%' }}>
            {raceItems.map((item) => (
              <div key={`${item.name}-${runId}-${duration}`} style={{ width: '100%' }}>
                <Space direction="vertical" size={2} style={{ width: '100%' }}>
                  <Space size={6} wrap>
                    <Tag color="blue">{item.name}</Tag>
                    <Text code>{item.value}</Text>
                  </Space>
                  <div
                    style={{
                      position: 'relative',
                      height: 18,
                      width: '100%',
                      background: '#fafafa',
                      border: '1px solid #f0f0f0',
                      borderRadius: 999,
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        top: 2,
                        left: 0,
                        width: 14,
                        height: 14,
                        borderRadius: '50%',
                        background: '#1677ff',
                        boxShadow: '0 0 0 2px rgba(22,119,255,0.25)',
                        animation: `devtools-ease-fly ${duration}ms ${item.value} forwards`,
                      }}
                    />
                  </div>
                </Space>
              </div>
            ))}
          </Space>
          <Paragraph type="secondary" style={{ margin: 0 }}>{t.raceHint}</Paragraph>
        </Space>
      </Card>

      <Card title={t.referenceTitle}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Space wrap>
            <Segmented value={category} onChange={setCategory} options={catOptions} />
            <Input.Search
              allowClear
              placeholder={t.searchPlaceholder}
              style={{ width: 320 }}
              onChange={(e) => setQuery(e.target.value)}
            />
            <Text type="secondary">{t.showing} {visible.length}</Text>
          </Space>
          <Table
            columns={columns}
            dataSource={visible}
            pagination={false}
            size="small"
            scroll={{ x: 720 }}
            rowKey={(r) => r.name}
          />
        </Space>
      </Card>

      <Collapse
        items={[
          { key: 'example', label: t.exampleTitle, children: <pre style={{ margin: 0, overflowX: 'auto' }}><code>{SAMPLE_CSS}</code></pre> },
          {
            key: 'source',
            label: `${t.sourceTitle} — parseCubicBezier / curvePolyline / stepPolyline`,
            children: (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Paragraph type="secondary">{t.sourceBody}</Paragraph>
                <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 320 }}>
                  <code>{parseCubicBezier.toString()}{'\n\n'}{curvePolyline.toString()}{'\n\n'}{stepPolyline.toString()}</code>
                </pre>
              </Space>
            ),
          },
        ]}
      />
    </Space>
  )
}