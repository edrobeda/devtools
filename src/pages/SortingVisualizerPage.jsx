import React, { useEffect, useMemo, useState } from 'react'
import { Typography, Card, Space, Button, Slider, Select, Tag } from 'antd'
import { PlayCircleOutlined, PauseCircleOutlined, RotateLeftOutlined, StepForwardOutlined, SortAscendingOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

// Cada algoritmo é um gerador de "frames". Um frame é uma snapshot do array
// num dado instante: `arr` (valores), `pos` (índices a destacar agora) e
// `done` (índices que já estão na posição final). O visualizador pré-computa
// TODOS os frames de uma vez, antes de animar — o loop de reprodução só
// avança um índice, sem pausar/retomar async que poderia corromper o estado.
function generateSteps(algo, arr) {
  const steps = []
  const a = [...arr]
  const done = new Set()
  const push = (pos = []) => steps.push({ arr: [...a], pos, done: [...done] })

  if (algo === 'bubble') {
    const n = a.length
    for (let end = n - 1; end > 0; end--) {
      let swapped = false
      for (let i = 0; i < end; i++) {
        push([i, i + 1])
        if (a[i] > a[i + 1]) {
          ;[a[i], a[i + 1]] = [a[i + 1], a[i]]
          swapped = true
          push([i, i + 1])
        }
      }
      if (!swapped) break
      done.add(end)
      push()
    }
    for (let i = 0; i < n; i++) done.add(i)
    push()
  } else if (algo === 'selection') {
    const n = a.length
    for (let i = 0; i < n - 1; i++) {
      let mi = i
      for (let j = i + 1; j < n; j++) {
        push([mi, j])
        if (a[j] < a[mi]) mi = j
      }
      if (mi !== i) {
        ;[a[i], a[mi]] = [a[mi], a[i]]
        push([i, mi])
      }
      done.add(i)
      push()
    }
    if (n > 0) done.add(n - 1)
    push()
  } else if (algo === 'insertion') {
    const n = a.length
    for (let i = 1; i < n; i++) {
      const key = a[i]
      let j = i - 1
      push([i])
      while (j >= 0 && a[j] > key) {
        a[j + 1] = a[j]
        push([j, j + 1])
        j--
      }
      a[j + 1] = key
      push([j + 1])
    }
    for (let i = 0; i < n; i++) done.add(i)
    push()
  } else if (algo === 'quick') {
    const partition = (lo, hi) => {
      const pivot = a[hi]
      let i = lo - 1
      for (let j = lo; j < hi; j++) {
        push([j, hi])
        if (a[j] < pivot) {
          i++
          if (i !== j) {
            ;[a[i], a[j]] = [a[j], a[i]]
            push([i, j])
          }
        }
      }
      ;[a[i + 1], a[hi]] = [a[hi], a[i + 1]]
      push([i + 1, hi])
      return i + 1
    }
    const qs = (lo, hi) => {
      if (lo > hi) return
      if (lo === hi) {
        done.add(lo)
        push()
        return
      }
      const p = partition(lo, hi)
      done.add(p)
      push()
      qs(lo, p - 1)
      qs(p + 1, hi)
    }
    qs(0, a.length - 1)
    for (let i = 0; i < a.length; i++) done.add(i)
    push()
  }

  return steps
}

function randomArray(n) {
  return new Array(n).fill(0).map(() => 5 + Math.floor(Math.random() * 95))
}

const sourceCode = `// A ideia: transformar a ordenação numa lista de "frames".
// Como cada frame é uma snapshot do array, a animação vira só
// um índice andando — sem async que corrompa o estado.
function generateSteps(algo, arr) {
  const steps = []
  const a = [...arr]
  const done = new Set()
  const push = (pos = []) =>
    steps.push({ arr: [...a], pos, done: [...done] })

  // Bubble sort — compara vizinhos e troca até o maior "borbulhar"
  for (let end = a.length - 1; end > 0; end--) {
    let swapped = false
    for (let i = 0; i < end; i++) {
      push([i, i + 1])            // célula comparando
      if (a[i] > a[i + 1]) {
        ;[a[i], a[i + 1]] = [a[i + 1], a[i]]
        swapped = true
        push([i, i + 1])          // célula após a troca
      }
    }
    if (!swapped) break
    done.add(end)                 // maior valor no lugar
  }
  push()
  return steps // depois é só reproduzir: steps[idx]
}`

const ALGO_OPTIONS = [
  { value: 'bubble', label: 'Bubble Sort' },
  { value: 'selection', label: 'Selection Sort' },
  { value: 'insertion', label: 'Insertion Sort' },
  { value: 'quick', label: 'Quick Sort' },
]

const BAR_BASE = '#2a78d6'
const BAR_ACT = '#eb6834'
const BAR_DONE = '#2f9d63'

const translations = {
  pt: {
    title: 'Visualizador de Ordenação',
    intro: (
      <>
        Ler um algoritmo no código nem sempre comunica o que ele{' '}
        <Text strong>faz</Text>. Esta página anima a ordenação de um array de
        barras — escolha o algoritmo, o tamanho e a velocidade e veja cada
        comparação e troca acontecendo. As barras{' '}
        <Text strong>laranjas</Text> são as que estão sendo
        comparadas/trocadas agora; as <Text strong>verdes</Text> já estão na
        posição final. O segredo pra animar sem travar nem corromper estado:
        todos os frames são pré-calculados de uma vez e a reprodução só
        avança um índice (ver o código-fonte).
      </>
    ),
    controlsTitle: 'Configuração',
    algo: 'Algoritmo',
    size: 'Tamanho',
    speed: 'Velocidade',
    speedMs: 'ms por passo',
    sort: 'Ordenar',
    pause: 'Pausar',
    reset: 'Novo array',
    step: 'Passo',
    stepOf: 'Passo {cur} de {total}',
    frames: 'Passos pré-calculados',
    highlight: 'laranja = comparando/trocando · verde = ordenado',
    chartTitle: 'Visualização',
    sortedBar: 'barras já ordenadas',
    stats: '{frames} · {done} de {size} {sortedBar}',
    notPlaying: 'Clique em "Ordenar" pra animar.',
    sourceTitle: 'Como funciona (código)',
    sourceIntro: (
      <>
        Cada algoritmo vira um gerador de <Text code>steps</Text>, onde cada
        frame é uma snapshot imutável do array. O play apenas caminha por
        eles — por isso a animação nunca depende de closures de{' '}
        <Text code>setTimeout</Text> desatualizadas.
      </>
    ),
    algsTitle: 'Algoritmos incluídos',
    algs: (
      <>
        <Text code>Bubble</Text> troca vizinhos, arrastando o maior pro fim
        (O(n²), compara e troca muito); <Text code>Selection</Text> acha o
        menor e coloca na frente (O(n²), troca pouco); <Text code>Insertion</Text>{' '}
        "encaixa" cada elemento na parte já ordenada (O(n²), ótimo pra
        quase-ordenados); <Text code>Quick</Text> particiona em volta de um
        pivô e recursa (O(n log n) médio, o mais rápido dos quatro na prática).
      </>
    ),
  },
  en: {
    title: 'Sorter Visualizer',
    intro: (
      <>
        Reading an algorithm in code rarely communicates what it{' '}
        <Text strong>does</Text>. This page animates sorting an array of
        bars — pick an algorithm, size and speed, and watch every comparison
        and swap happen. <Text strong>Orange</Text> bars are being
        compared/swapped right now; <Text strong>green</Text> ones are already
        in their final position. The trick to animating without jank or state
        corruption: every frame is precomputed up front and playback just
        advances an index (see the source).
      </>
    ),
    controlsTitle: 'Configuration',
    algo: 'Algorithm',
    size: 'Size',
    speed: 'Speed',
    speedMs: 'ms per step',
    sort: 'Sort',
    pause: 'Pause',
    reset: 'New array',
    step: 'Step',
    stepOf: 'Step {cur} of {total}',
    frames: 'Precomputed steps',
    highlight: 'orange = comparing/swapping · green = sorted',
    chartTitle: 'Visualization',
    sortedBar: 'bars already sorted',
    stats: '{frames} · {done} of {size} {sortedBar}',
    notPlaying: 'Click "Sort" to start.',
    sourceTitle: 'How it works (code)',
    sourceIntro: (
      <>
        Each algorithm becomes a generator of <Text code>steps</Text>, where
        each frame is an immutable snapshot of the array. Playback just walks
        through them — so the animation never depends on stale{' '}
        <Text code>setTimeout</Text> closures.
      </>
    ),
    algsTitle: 'Included algorithms',
    algs: (
      <>
        <Text code>Bubble</Text> swaps neighbors, bubbling the largest to the
        end (O(n²), lots of compares and swaps); <Text code>Selection</Text>{' '}
        finds the minimum and places it up front (O(n²), few swaps);{' '}
        <Text code>Insertion</Text> slots each element into the already-sorted
        prefix (O(n²), great for nearly-sorted input); <Text code>Quick</Text>{' '}
        partitions around a pivot and recurses (O(n log n) average, the
        fastest of the four in practice).
      </>
    ),
  },
}

export default function SortingVisualizerPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [algo, setAlgo] = useState('bubble')
  const [size, setSize] = useState(14)
  const [speed, setSpeed] = useState(60)
  const [arr, setArr] = useState(() => randomArray(14))
  const [steps, setSteps] = useState(() => [{ arr: randomArray(14), pos: [], done: [] }])
  const [idx, setIdx] = useState(0)
  const [playing, setPlaying] = useState(false)

  const total = steps.length
  const frame = steps[Math.min(idx, steps.length - 1)]

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

  const bars = useMemo(() => {
    const f = steps[Math.min(idx, steps.length - 1)] || { arr, pos: [], done: [] }
    const maxVal = Math.max(...f.arr, 1)
    return f.arr.map((v, i) => {
      const act = f.pos.includes(i)
      const dn = f.done.includes(i) && !act
      return {
        value: v,
        height: `${Math.round((v / maxVal) * 100)}%`,
        color: act ? BAR_ACT : dn ? BAR_DONE : BAR_BASE,
      }
    })
  }, [steps, idx, arr])

  function handleSizeChange(n) {
    const newArr = randomArray(n)
    setSize(n)
    setArr(newArr)
    setSteps(generateSteps(algo, newArr))
    setIdx(0)
    setPlaying(false)
  }

  function handleAlgoChange(al) {
    setAlgo(al)
    setSteps(generateSteps(al, arr))
    setIdx(0)
    setPlaying(false)
  }

  function startSort() {
    setSteps(generateSteps(algo, arr))
    setIdx(0)
    setPlaying(true)
  }

  function handleStepOnce() {
    setPlaying(false)
    setIdx((i) => Math.min(i + 1, steps.length - 1))
  }

  function reset() {
    setPlaying(false)
    const newArr = randomArray(size)
    setArr(newArr)
    setSteps(generateSteps(algo, newArr))
    setIdx(0)
  }

  const doneBars = frame?.done?.length || 0

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><SortAscendingOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card title={t.controlsTitle}>
        <Space wrap align="end" size="large">
          <Space direction="vertical" size={4}>
            <Text type="secondary">{t.algo}</Text>
            <Select value={algo} onChange={handleAlgoChange} options={ALGO_OPTIONS} style={{ width: 200 }} />
          </Space>
          <Space direction="vertical" size={4}>
            <Text type="secondary">{t.size}: {size}</Text>
            <Slider min={6} max={40} value={size} onChange={handleSizeChange} style={{ width: 200 }} />
          </Space>
          <Space direction="vertical" size={4}>
            <Text type="secondary">{t.speed}: {speed} {t.speedMs}</Text>
            <Slider min={10} max={300} step={10} value={speed} onChange={setSpeed} style={{ width: 200 }} />
          </Space>
        </Space>
        <Space wrap style={{ marginTop: 16 }}>
          <Button type="primary" icon={<PlayCircleOutlined />} disabled={playing} onClick={startSort}>{t.sort}</Button>
          <Button icon={<PauseCircleOutlined />} onClick={() => setPlaying(false)}>{t.pause}</Button>
          <Button icon={<StepForwardOutlined />} onClick={handleStepOnce}>{t.step}</Button>
          <Button icon={<RotateLeftOutlined />} onClick={reset}>{t.reset}</Button>
        </Space>
        <Text type="secondary" style={{ display: 'block', marginTop: 12 }}>
          {t.stepOf.replace('{cur}', Math.min(idx + 1, total)).replace('{total}', total)}
        </Text>
      </Card>

      <Card title={t.chartTitle}>
        <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>{t.highlight}</Text>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 220, borderBottom: '1px solid #d9d9d9', paddingBottom: 2 }}>
          {bars.map((b, i) => (
            <div
              key={i}
              title={String(b.value)}
              style={{ flex: 1, height: b.height, background: b.color, borderRadius: '3px 3px 0 0', transition: 'height 0.12s ease, background 0.12s ease' }}
            />
          ))}
        </div>
        <Space wrap style={{ marginTop: 8 }}>
          <Tag color="blue">{t.frames}: {total}</Tag>
          <Tag color="green">{doneBars}/{size} {t.sortedBar}</Tag>
          {!playing && <Text type="secondary" style={{ fontSize: 12 }}>{t.notPlaying}</Text>}
        </Space>
      </Card>

      <Card title={t.algsTitle}>
        <Paragraph type="secondary">{t.algs}</Paragraph>
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
