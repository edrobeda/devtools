import React, { useEffect, useMemo, useState } from 'react'
import { Typography, Card, Space, Button, Slider, InputNumber, Tag, Alert } from 'antd'
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  StepForwardOutlined,
  RotateLeftOutlined,
  SearchOutlined,
  AimOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

// Gera um array ordenado de N valores únicos no intervalo [1, 99].
function randomSortedArray(n) {
  const set = new Set()
  while (set.size < n) set.add(1 + Math.floor(Math.random() * 99))
  return [...set].sort((a, b) => a - b)
}

// Pré-calcula TODOS os passos da busca binária como snapshots imutáveis.
// Cada frame registra o intervalo ativo [low, high], o índice mid sendo
// comparado, se achou, se terminou e quantas comparações já foram feitas.
// A reprodução depois só avança um índice — sem async que corrompa estado.
function generateSteps(arr, target) {
  const steps = []
  let low = 0
  let high = arr.length - 1
  let comparisons = 0

  steps.push({
    low,
    high,
    mid: -1,
    found: null,
    done: false,
    comparisons,
    message: { kind: 'start', high, n: arr.length },
  })

  while (low <= high) {
    const mid = Math.floor((low + high) / 2)
    comparisons++
    if (arr[mid] === target) {
      steps.push({
        low,
        high,
        mid,
        found: mid,
        done: true,
        comparisons,
        message: { kind: 'found', mid, value: arr[mid], target },
      })
      return steps
    } else if (arr[mid] < target) {
      steps.push({
        low,
        high,
        mid,
        found: null,
        done: false,
        comparisons,
        message: { kind: 'go-right', mid, value: arr[mid], target },
      })
      low = mid + 1
    } else {
      steps.push({
        low,
        high,
        mid,
        found: null,
        done: false,
        comparisons,
        message: { kind: 'go-left', mid, value: arr[mid], target },
      })
      high = mid - 1
    }
  }

  steps.push({
    low,
    high,
    mid: -1,
    found: null,
    done: true,
    comparisons,
    message: { kind: 'not-found', target },
  })
  return steps
}

function idleFrame(n) {
  return { low: 0, high: n - 1, mid: -1, found: null, done: false, comparisons: 0, message: { kind: 'idle' } }
}

const sourceCode = `// Busca binária: pré-calcula todos os passos como snapshots.
// A reprodução só avança um índice — sem async que corrompa o estado.
function generateSteps(arr, target) {
  const steps = []
  let low = 0
  let high = arr.length - 1
  let comparisons = 0

  // frame inicial: intervalo completo, sem comparação ainda
  steps.push({ low, high, mid: -1, done: false, comparisons })

  while (low <= high) {
    const mid = Math.floor((low + high) / 2)
    comparisons++
    if (arr[mid] === target) {
      steps.push({ low, high, mid, found: mid, done: true, comparisons })
      return steps          // achou!
    } else if (arr[mid] < target) {
      steps.push({ low, high, mid, done: false, comparisons })
      low = mid + 1          // descarta a metade esquerda
    } else {
      steps.push({ low, high, mid, done: false, comparisons })
      high = mid - 1         // descarta a metade direita
    }
  }
  // intervalo vazio (low > high) -> não está no array
  steps.push({ low, high, mid: -1, found: null, done: true, comparisons })
  return steps
}`

const CELL_STYLES = {
  eliminated: { background: '#f5f5f5', color: '#bfbfbf', border: '1px solid #e8e8e8' },
  range: { background: '#e6f4ff', color: '#0958d9', border: '1px solid #91caff' },
  mid: { background: '#fff7e6', color: '#d4380d', border: '2px solid #fa8c16', fontWeight: 700 },
  found: { background: '#f6ffed', color: '#389e0d', border: '2px solid #52c41a', fontWeight: 700 },
}

const LOW_COLOR = '#1677ff'
const MID_COLOR = '#fa8c16'
const HIGH_COLOR = '#722ed1'

function formatMessage(msg, t) {
  switch (msg.kind) {
    case 'idle':
      return t.msgIdle
    case 'start':
      return t.msgStart(msg.high, msg.n)
    case 'go-right':
      return t.msgGoRight(msg.mid, msg.value, msg.target)
    case 'go-left':
      return t.msgGoLeft(msg.mid, msg.value, msg.target)
    case 'found':
      return t.msgFound(msg.mid, msg.value, msg.target)
    case 'not-found':
      return t.msgNotFound(msg.target)
    default:
      return ''
  }
}

const translations = {
  pt: {
    title: 'Visualizador de Busca Binária',
    intro: (
      <>
        A busca binária encontra um valor num array <Text strong>ordenado</Text> em
        O(log n) — a cada passo ela compara o elemento do meio com o alvo e descarta
        metade do intervalo. Esta página anima o processo passo a passo: escolha o
        tamanho do array e o valor procurado e veja o intervalo [low, high] encolher
        até encontrar (ou não). As células <Text strong>acinzentadas</Text> já foram
        descartadas; a <Text strong>laranja</Text> é o meio sendo comparado agora; a
        <Text strong> verde</Text> é o resultado encontrado.
      </>
    ),
    controlsTitle: 'Configuração',
    size: 'Tamanho do array',
    target: 'Valor procurado',
    speed: 'Velocidade',
    speedMs: 'ms por passo',
    search: 'Buscar',
    pause: 'Pausar',
    step: 'Passo',
    reset: 'Novo array',
    randomTarget: 'Aleatório',
    stepOf: 'Passo {cur} de {total}',
    frames: 'Passos pré-calculados',
    chartTitle: 'Visualização',
    legendTitle: 'Legenda',
    legEliminated: 'descartado',
    legRange: 'no intervalo',
    legMid: 'meio (comparando)',
    legFound: 'encontrado',
    legLow: 'low',
    legMid2: 'mid',
    legHigh: 'high',
    stats: 'Comparações',
    statsMax: 'máx teórico',
    statsEntries: 'entradas',
    logTitle: 'Passo a passo',
    resultFound: 'Encontrado no índice {idx} após {c} comparações.',
    resultNotFound: 'Não encontrado após {c} comparações.',
    waiting: 'Clique em "Buscar" para animar.',
    enterTarget: 'Digite um valor procurado.',
    prereqTitle: 'Pré-requisito e complexidade',
    prereq: (
      <>
        A busca binária só funciona em arrays <Text strong>ordenados</Text> — é o que
        permite descartar metade a cada comparação. Num array de n elementos são
        necessários no máximo ⌊log₂ n⌋ + 1 comparações: para 1.000.000 de entradas,
        cerca de 20. Compare com a busca linear (O(n)), que precisaria de até
        1.000.000.
      </>
    ),
    sourceTitle: 'Como funciona (código)',
    sourceIntro: (
      <>
        Todos os frames são pré-calculados como snapshots imutáveis antes de animar.
        O play apenas caminha por eles — por isso a animação nunca depende de closures
        de <Text code>setTimeout</Text> desatualizadas.
      </>
    ),
    msgIdle: 'Defina um valor procurado e clique em "Buscar".',
    msgStart: (high, n) => `Intervalo inicial [0, ${high}] — ${n} elementos candidatos.`,
    msgGoRight: (mid, value, target) => `arr[${mid}] = ${value} < ${target} → descartar a esquerda, buscar na metade direita.`,
    msgGoLeft: (mid, value, target) => `arr[${mid}] = ${value} > ${target} → descartar a direita, buscar na metade esquerda.`,
    msgFound: (mid, value, target) => `arr[${mid}] = ${value} = ${target} → encontrado no índice ${mid}!`,
    msgNotFound: (target) => `Intervalo vazio (low > high) — ${target} não está no array.`,
  },
  en: {
    title: 'Binary Search Visualizer',
    intro: (
      <>
        Binary search finds a value in a <Text strong>sorted</Text> array in
        O(log n) — at each step it compares the middle element with the target and
        discards half of the range. This page animates the process step by step: pick
        the array size and the target value and watch the [low, high] range shrink
        until it finds it (or doesn't). <Text strong>Gray</Text> cells have been
        discarded; the <Text strong>orange</Text> one is the middle being compared
        now; the <Text strong>green</Text> one is the found result.
      </>
    ),
    controlsTitle: 'Configuration',
    size: 'Array size',
    target: 'Target value',
    speed: 'Speed',
    speedMs: 'ms per step',
    search: 'Search',
    pause: 'Pause',
    step: 'Step',
    reset: 'New array',
    randomTarget: 'Random',
    stepOf: 'Step {cur} of {total}',
    frames: 'Precomputed steps',
    chartTitle: 'Visualization',
    legendTitle: 'Legend',
    legEliminated: 'discarded',
    legRange: 'in range',
    legMid: 'middle (comparing)',
    legFound: 'found',
    legLow: 'low',
    legMid2: 'mid',
    legHigh: 'high',
    stats: 'Comparisons',
    statsMax: 'theoretical max',
    statsEntries: 'entries',
    logTitle: 'Step by step',
    resultFound: 'Found at index {idx} after {c} comparisons.',
    resultNotFound: 'Not found after {c} comparisons.',
    waiting: 'Click "Search" to animate.',
    enterTarget: 'Enter a target value.',
    prereqTitle: 'Prerequisite & complexity',
    prereq: (
      <>
        Binary search only works on <Text strong>sorted</Text> arrays — that's what
        lets it discard half on every comparison. In an array of n elements it takes
        at most ⌊log₂ n⌋ + 1 comparisons: for 1,000,000 entries, about 20. Compare
        with linear search (O(n)), which could need up to 1,000,000.
      </>
    ),
    sourceTitle: 'How it works (code)',
    sourceIntro: (
      <>
        Every frame is precomputed as an immutable snapshot before animating. Playback
        just walks through them — so the animation never depends on stale
        <Text code> setTimeout</Text> closures.
      </>
    ),
    msgIdle: 'Set a target value and click "Search".',
    msgStart: (high, n) => `Initial range [0, ${high}] — ${n} candidate elements.`,
    msgGoRight: (mid, value, target) => `arr[${mid}] = ${value} < ${target} → discard left, search the right half.`,
    msgGoLeft: (mid, value, target) => `arr[${mid}] = ${value} > ${target} → discard right, search the left half.`,
    msgFound: (mid, value, target) => `arr[${mid}] = ${value} = ${target} → found at index ${mid}!`,
    msgNotFound: (target) => `Empty range (low > high) — ${target} is not in the array.`,
  },
}

export default function BinarySearchVisualizerPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [size, setSize] = useState(15)
  const [arr, setArr] = useState(() => randomSortedArray(15))
  const [target, setTarget] = useState(() => arr[Math.floor(Math.random() * arr.length)])
  const [steps, setSteps] = useState(() => generateSteps(arr, target))
  const [idx, setIdx] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(80)

  const total = steps.length
  const frame = steps[Math.min(idx, steps.length - 1)]
  const targetValid = Number.isFinite(target)

  useEffect(() => {
    if (!playing) return undefined
    const id = setInterval(() => {
      setIdx((i) => {
        if (i + 1 >= steps.length) {
          setPlaying(false)
          return i
        }
        return i + 1
      })
    }, speed)
    return () => clearInterval(id)
  }, [playing, speed, steps])

  const cells = useMemo(() => {
    const f = steps[Math.min(idx, steps.length - 1)] || idleFrame(arr.length)
    return arr.map((value, i) => {
      let state
      if (f.found != null) {
        state = i === f.found ? 'found' : 'eliminated'
      } else if (f.done) {
        state = 'eliminated'
      } else if (i < f.low || i > f.high) {
        state = 'eliminated'
      } else if (f.mid >= 0 && i === f.mid) {
        state = 'mid'
      } else {
        state = 'range'
      }
      return {
        value,
        index: i,
        state,
        isLow: i === f.low,
        isMid: f.mid >= 0 && i === f.mid,
        isHigh: i === f.high,
      }
    })
  }, [steps, idx, arr])

  const theoreticalMax = useMemo(
    () => (arr.length > 0 ? Math.floor(Math.log2(arr.length)) + 1 : 0),
    [arr.length]
  )

  function newArray(n) {
    const next = randomSortedArray(n)
    const tgt = next[Math.floor(Math.random() * next.length)]
    setSize(n)
    setArr(next)
    setTarget(tgt)
    setSteps(generateSteps(next, tgt))
    setIdx(0)
    setPlaying(false)
  }

  function handleSizeChange(n) {
    newArray(n)
  }

  function handleTargetChange(value) {
    const v = value == null ? null : Number(value)
    setTarget(v)
    if (Number.isFinite(v)) {
      setSteps(generateSteps(arr, v))
    } else {
      setSteps([idleFrame(arr.length)])
    }
    setIdx(0)
    setPlaying(false)
  }

  function handleRandomTarget() {
    let v
    if (Math.random() < 0.6) {
      v = arr[Math.floor(Math.random() * arr.length)]
    } else {
      v = 1 + Math.floor(Math.random() * 99)
    }
    setTarget(v)
    setSteps(generateSteps(arr, v))
    setIdx(0)
    setPlaying(false)
  }

  function startSearch() {
    if (Number.isFinite(target)) {
      setSteps(generateSteps(arr, target))
    }
    setIdx(0)
    setPlaying(true)
  }

  function handleStepOnce() {
    setPlaying(false)
    setIdx((i) => Math.min(i + 1, steps.length - 1))
  }

  function handleReset() {
    newArray(size)
  }

  const isLast = idx >= steps.length - 1
  const resultText = frame?.done
    ? frame.found != null
      ? t.resultFound.replace('{idx}', frame.found).replace('{c}', frame.comparisons)
      : t.resultNotFound.replace('{c}', frame.comparisons)
    : null

  const legendItem = (color, label) => (
    <Space size={6} align="center">
      <span style={{ display: 'inline-block', width: 14, height: 14, borderRadius: 3, background: color }} />
      <Text type="secondary" style={{ fontSize: 12 }}>{label}</Text>
    </Space>
  )

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><SearchOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card title={t.controlsTitle}>
        <Space wrap align="end" size="large">
          <Space direction="vertical" size={4}>
            <Text type="secondary">{t.size}: {size}</Text>
            <Slider min={4} max={31} value={size} onChange={handleSizeChange} style={{ width: 200 }} />
          </Space>
          <Space direction="vertical" size={4}>
            <Text type="secondary">{t.target}</Text>
            <Space size={8}>
              <InputNumber value={targetValid ? target : undefined} min={1} max={99} onChange={handleTargetChange} style={{ width: 120 }} placeholder={t.enterTarget} />
              <Button icon={<AimOutlined />} onClick={handleRandomTarget}>{t.randomTarget}</Button>
            </Space>
          </Space>
          <Space direction="vertical" size={4}>
            <Text type="secondary">{t.speed}: {speed} {t.speedMs}</Text>
            <Slider min={20} max={400} step={20} value={speed} onChange={setSpeed} style={{ width: 200 }} />
          </Space>
        </Space>
        <Space wrap style={{ marginTop: 16 }}>
          <Button type="primary" icon={<PlayCircleOutlined />} disabled={!targetValid || (playing && !isLast)} onClick={startSearch}>{t.search}</Button>
          <Button icon={<PauseCircleOutlined />} disabled={!playing} onClick={() => setPlaying(false)}>{t.pause}</Button>
          <Button icon={<StepForwardOutlined />} disabled={!targetValid || isLast} onClick={handleStepOnce}>{t.step}</Button>
          <Button icon={<RotateLeftOutlined />} onClick={handleReset}>{t.reset}</Button>
        </Space>
        <Text type="secondary" style={{ display: 'block', marginTop: 12 }}>
          {t.stepOf.replace('{cur}', Math.min(idx + 1, total)).replace('{total}', total)}
        </Text>
      </Card>

      <Card title={t.chartTitle}>
        <Space wrap size="middle" style={{ marginBottom: 12 }}>
          {legendItem('#e6f4ff', t.legRange)}
          {legendItem('#fff7e6', t.legMid)}
          {legendItem('#f6ffed', t.legFound)}
          {legendItem('#f5f5f5', t.legEliminated)}
          <span style={{ color: LOW_COLOR, fontSize: 12 }}>↓ {t.legLow}</span>
          <span style={{ color: MID_COLOR, fontSize: 12 }}>↓ {t.legMid2}</span>
          <span style={{ color: HIGH_COLOR, fontSize: 12 }}>↓ {t.legHigh}</span>
        </Space>

        <div style={{ overflowX: 'auto', paddingBottom: 8 }}>
          <div style={{ display: 'flex', gap: 4, minWidth: 'min-content' }}>
            {cells.map((c) => (
              <div
                key={c.index}
                style={{ flex: '1 0 38px', minWidth: 38, display: 'flex', flexDirection: 'column', alignItems: 'center' }}
              >
                <div style={{ height: 46, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', gap: 1 }}>
                  {c.isLow && <span style={{ color: LOW_COLOR, fontSize: 10, lineHeight: 1 }}>↓ {t.legLow}</span>}
                  {c.isMid && <span style={{ color: MID_COLOR, fontSize: 10, lineHeight: 1 }}>↓ {t.legMid2}</span>}
                  {c.isHigh && <span style={{ color: HIGH_COLOR, fontSize: 10, lineHeight: 1 }}>↓ {t.legHigh}</span>}
                </div>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 6,
                    fontSize: 14,
                    transition: 'background 0.15s ease, color 0.15s ease, border 0.15s ease',
                    ...CELL_STYLES[c.state],
                  }}
                >
                  {c.value}
                </div>
                <div style={{ fontSize: 10, color: '#bfbfbf', marginTop: 2 }}>{c.index}</div>
              </div>
            ))}
          </div>
        </div>

        <Space wrap size="middle" style={{ marginTop: 12 }}>
          <Tag color="blue">{t.frames}: {total}</Tag>
          <Tag color="orange">{t.stats}: {frame?.comparisons ?? 0}</Tag>
          <Tag color="purple">{t.statsMax}: {theoreticalMax}</Tag>
          <Tag>{t.statsEntries}: {arr.length}</Tag>
        </Space>

        <div style={{ marginTop: 12 }}>
          {resultText ? (
            <Alert
              type={frame.found != null ? 'success' : 'warning'}
              showIcon
              message={resultText}
            />
          ) : (
            <Alert
              type={targetValid ? 'info' : 'warning'}
              showIcon
              message={targetValid ? formatMessage(frame?.message, t) : t.enterTarget}
            />
          )}
        </div>
      </Card>

      <Card title={t.logTitle}>
        <div style={{ maxHeight: 220, overflow: 'auto', fontFamily: 'monospace', fontSize: 12, lineHeight: 1.6 }}>
          {steps.map((s, i) => (
            <div
              key={i}
              style={{
                padding: '4px 8px',
                background: i === idx ? '#e6f4ff' : 'transparent',
                borderLeft: i === idx ? '3px solid #1677ff' : '3px solid transparent',
                color: i === idx ? '#0958d9' : 'rgba(0, 0, 0, 0.65)',
              }}
            >
              <span style={{ color: '#bfbfbf', marginRight: 8 }}>[{i}]</span>
              {formatMessage(s.message, t)}
            </div>
          ))}
        </div>
      </Card>

      <Card title={t.prereqTitle}>
        <Paragraph type="secondary">{t.prereq}</Paragraph>
      </Card>

      <Card title={t.sourceTitle}>
        <Paragraph type="secondary">{t.sourceIntro}</Paragraph>
        <pre style={{ margin: 0, overflowX: 'auto' }}>
          <code>{sourceCode}</code>
        </pre>
      </Card>
    </Space>
  )
}
