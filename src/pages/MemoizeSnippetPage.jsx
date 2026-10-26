import React, { useState } from 'react'
import { Typography, Card, Space, Button, Tag, Slider, Statistic, Row, Col, Alert } from 'antd'
import { ThunderboltOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const sourceCode = `// Versao generica: guarda o resultado por chave e devolve o cache.
function memoize(fn) {
  const cache = new Map()
  function memoized(...args) {
    // chave simples: um argumento usa ele direto; varios viram JSON.
    // (cuidado: objetos/arrays por referencia contam como chave nova)
    const key = args.length === 1 ? args[0] : JSON.stringify(args)
    if (cache.has(key)) return cache.get(key)
    const value = fn.apply(this, args)
    cache.set(key, value)
    return value
  }
  memoized.cache = cache // exponha se quiser inspecionar/limpar
  return memoized
}

// Recursao ingenua: refaz o mesmo subproblema milhoes de vezes -> O(2^n).
function fib(n) {
  if (n < 2) return n
  return fib(n - 1) + fib(n - 2)
}

// Com memoize o mesmo fib cai para O(n): cada n e calculado uma unica vez.
const fibMemo = memoize(function (n) {
  if (n < 2) return n
  return fibMemo(n - 1) + fibMemo(n - 2) // recursao chama a versao memoizada
})`

function runNaive(n) {
  let calls = 0
  function fib(k) {
    calls++
    if (k < 2) return k
    return fib(k - 1) + fib(k - 2)
  }
  const t0 = performance.now()
  const value = fib(n)
  const ms = performance.now() - t0
  return { value, calls, ms }
}

function runMemo(n) {
  let calls = 0
  const cache = new Map()
  function fib(k) {
    calls++
    if (k < 2) return k
    if (cache.has(k)) return cache.get(k)
    const value = fib(k - 1) + fib(k - 2)
    cache.set(k, value)
    return value
  }
  const t0 = performance.now()
  const value = fib(n)
  const ms = performance.now() - t0
  return { value, calls, ms, cacheSize: cache.size }
}

const NAIVE_COLOR = '#eb6834'
const MEMO_COLOR = '#2a78d6'

const translations = {
  pt: {
    title: 'Snippet: Memoization (memoize)',
    intro: (
      <>
        Memoization é cachear o resultado de uma função em cima dos seus
        argumentos: se ela já foi chamada com os mesmos valores, devolve o
        resultado guardado em vez de recalcular. É a base da programação
        dinâmica e de otimizações do dia a dia. O truque clássico é a sequência
        de Fibonacci — a recursão ingênua refaz os mesmos subproblemas
        exponencialmente, e um único cache a derruba para tempo linear.
      </>
    ),
    sourceTitle: 'Código-fonte',
    demoTitle: 'Benchmark: fib(n) ingênua vs. memoizada',
    demoIntro: (
      <>
        Escolha <Text code>n</Text> e compare os dois lados: além do tempo,
        mostramos quantas chamadas cada versão faz. A ingênua cresce como{' '}
        <Text code>O(2^n)</Text>; a memoizada, como <Text code>O(n)</Text>.
      </>
    ),
    nLabel: 'Valor de n',
    run: 'Rodar benchmark',
    bigWarning: 'Valores altos de n deixam a versão ingênua lenta de propósito — é o problema que a memoization resolve.',
    resultTitle: 'Resultado',
    time: 'Tempo',
    calls: 'Chamadas à função',
    cacheSize: 'Entradas no cache',
    value: 'fib(n)',
    speedup: 'Ganho',
    naiveLabel: 'Ingênua (sem cache)',
    memoLabel: 'Memoizada',
    ms: 'ms',
    pitfallsTitle: 'Quando (não) usar',
    pitfalls: [
      'Só vale a pena quando a função é pura — mesma entrada sempre dá a mesma saída — e cara o bastante. Cachear função barata só gasta memória.',
      'A chave precisa representar os argumentos de forma estável: dois objetos estruturalmente iguais são referências diferentes, então contam como chave nova a menos que você serialize.',
      'O cache cresce sem limite. Para séries longas, troque o Map por um LRU, um TTL ou um WeakMap (que libera a chave quando o objeto morre).',
      'Efeitos colaterais (I/O, logs, estado) não combinam: a segunda chamada não roda, então quem dependia do efeito se surpreende.',
      'No React, useMemo/useCallback são parentes, mas memoízam por dependências do render, não por argumentos da chamada.',
    ],
  },
  en: {
    title: 'Snippet: Memoization (memoize)',
    intro: (
      <>
        Memoization caches a function's result keyed by its arguments: if it was
        already called with the same values, it returns the stored result
        instead of recomputing. It's the backbone of dynamic programming and of
        everyday optimizations. The classic trick is Fibonacci — the naive
        recursion redoes the same subproblems exponentially, and a single cache
        drops it to linear time.
      </>
    ),
    sourceTitle: 'Source code',
    demoTitle: 'Benchmark: naive vs. memoized fib(n)',
    demoIntro: (
      <>
        Pick <Text code>n</Text> and compare both sides: besides the time we
        show how many calls each version makes. The naive one grows like{' '}
        <Text code>O(2^n)</Text>; the memoized one like <Text code>O(n)</Text>.
      </>
    ),
    nLabel: 'Value of n',
    run: 'Run benchmark',
    bigWarning: 'High values of n make the naive version deliberately slow — that is exactly the problem memoization solves.',
    resultTitle: 'Result',
    time: 'Time',
    calls: 'Function calls',
    cacheSize: 'Cache entries',
    value: 'fib(n)',
    speedup: 'Speedup',
    naiveLabel: 'Naive (no cache)',
    memoLabel: 'Memoized',
    ms: 'ms',
    pitfallsTitle: 'When (not) to use it',
    pitfalls: [
      'Worth it only when the function is pure — same input always yields the same output — and expensive enough. Caching a cheap function just wastes memory.',
      'The key must represent the arguments stably: two structurally equal objects are different references, so they count as a new key unless you serialize them.',
      'The cache grows unbounded. For long-running series, swap the Map for an LRU, a TTL, or a WeakMap (which releases the key when the object dies).',
      'Side effects (I/O, logging, state) do not fit: the second call never runs, so anything relying on the effect gets surprised.',
      'In React, useMemo/useCallback are relatives, but they memoize by render dependencies, not by call arguments.',
    ],
  },
}

function fmtMs(ms) {
  if (ms < 1) return '<1'
  return ms.toFixed(ms < 100 ? 1 : 0)
}

export default function MemoizeSnippetPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [n, setN] = useState(32)
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState(null)

  function run() {
    setRunning(true)
    setResult(null)
    // deixa o React pintar o estado de loading antes do cálculo pesado
    setTimeout(() => {
      const naive = runNaive(n)
      const memo = runMemo(n)
      setResult({ n, naive, memo })
      setRunning(false)
    }, 40)
  }

  const speedup =
    result && result.memo.ms > 0
      ? result.naive.ms / result.memo.ms
      : result
        ? Infinity
        : 0

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><ThunderboltOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card title={t.sourceTitle}>
        <pre style={{ margin: 0, overflowX: 'auto' }}>
          <code>{sourceCode}</code>
        </pre>
      </Card>

      <Card title={t.demoTitle}>
        <Paragraph type="secondary">{t.demoIntro}</Paragraph>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Space align="center" wrap>
            <Text type="secondary">{t.nLabel}: {n}</Text>
            <Slider
              min={20}
              max={38}
              value={n}
              onChange={setN}
              disabled={running}
              style={{ width: 240 }}
            />
            <Button type="primary" loading={running} onClick={run}>
              {t.run}
            </Button>
          </Space>

          {n >= 36 && <Alert type="info" showIcon message={t.bigWarning} />}

          {result && (
            <div>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12}>
                  <Card
                    size="small"
                    title={<Text style={{ color: NAIVE_COLOR }}>{t.naiveLabel}</Text>}
                  >
                    <Row gutter={8}>
                      <Col span={12}>
                        <Statistic title={t.time} value={fmtMs(result.naive.ms)} suffix={t.ms} />
                      </Col>
                      <Col span={12}>
                        <Statistic title={t.calls} value={result.naive.calls} />
                      </Col>
                    </Row>
                  </Card>
                </Col>
                <Col xs={24} sm={12}>
                  <Card
                    size="small"
                    title={<Text style={{ color: MEMO_COLOR }}>{t.memoLabel}</Text>}
                  >
                    <Row gutter={8}>
                      <Col span={8}>
                        <Statistic title={t.time} value={fmtMs(result.memo.ms)} suffix={t.ms} />
                      </Col>
                      <Col span={8}>
                        <Statistic title={t.calls} value={result.memo.calls} />
                      </Col>
                      <Col span={8}>
                        <Statistic title={t.cacheSize} value={result.memo.cacheSize} />
                      </Col>
                    </Row>
                  </Card>
                </Col>
              </Row>
              <Space size="large" wrap style={{ marginTop: 12 }}>
                <Text>
                  <Text strong>{t.value}:</Text> {result.memo.value}
                </Text>
                <Tag color="green">
                  {t.speedup}: {speedup === Infinity ? '∞' : `${speedup.toFixed(0)}x`}
                </Tag>
              </Space>
            </div>
          )}
        </Space>
      </Card>

      <Card title={t.pitfallsTitle}>
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          {t.pitfalls.map((p, i) => (
            <li key={i} style={{ marginBottom: 6 }}>
              <Text>{p}</Text>
            </li>
          ))}
        </ul>
      </Card>
    </Space>
  )
}
