import React, { useState } from 'react'
import { Typography, Card, Space, Button, Tag, Slider } from 'antd'
import { RetweetOutlined } from '@ant-design/icons'
import { fisherYatesShuffle, naiveSortShuffle } from '../utils/shuffle'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const sourceCode = `function fisherYatesShuffle(array) {
  const result = [...array]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

// NÃO faça isso — parece funcionar, mas é enviesado:
function naiveSortShuffle(array) {
  return [...array].sort(() => Math.random() - 0.5)
}`

const ITEMS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
const FY_COLOR = '#2a78d6'
const NAIVE_COLOR = '#eb6834'

const translations = {
  pt: {
    title: 'Snippet: Fisher-Yates Shuffle',
    intro: (
      <>
        Algoritmo pra embaralhar um array de verdade — cada uma das N!
        permutações possíveis tem exatamente a mesma probabilidade de
        acontecer. É comum ver gente usando{' '}
        <Text code>array.sort(() =&gt; Math.random() - 0.5)</Text> pra
        embaralhar; parece funcionar, mas é enviesado, porque o resultado
        depende de como o algoritmo de sort do motor JS compara os elementos
        (não é garantido nem estável entre navegadores). O Fisher-Yates
        resolve isso trocando cada posição, de trás pra frente, por uma
        posição aleatória dentro do que ainda não foi visitado.
      </>
    ),
    sourceTitle: 'Código-fonte',
    demoTitle: 'Demonstração: embaralhar cartas',
    shuffle: 'Embaralhar (Fisher-Yates)',
    biasTitle: 'Prova visual do viés',
    biasIntro: (
      <>
        Roda as duas versões N vezes e mede em quantas delas cada letra
        caiu na <Text code>posição 0</Text> depois de embaralhar. Com 8
        itens, o esperado é ~12,5% pra cada — o Fisher-Yates converge pra
        isso, o sort ingênuo não.
      </>
    ),
    runs: 'Rodadas',
    run: 'Rodar simulação',
    fyLabel: 'Fisher-Yates (correto)',
    naiveLabel: 'sort() ingênuo (enviesado)',
    position0: 'Frequência na posição 0 após embaralhar',
    hoverHint: 'Passe o mouse numa barra pra ver o valor exato',
  },
  en: {
    title: 'Snippet: Fisher-Yates Shuffle',
    intro: (
      <>
        The algorithm to actually shuffle an array uniformly at random —
        every one of the N! possible permutations has exactly the same
        probability. It's common to see people shuffle with{' '}
        <Text code>array.sort(() =&gt; Math.random() - 0.5)</Text>; it looks
        like it works, but it's biased, since the result depends on how the
        JS engine's sort algorithm compares elements (not even guaranteed to
        be stable across browsers). Fisher-Yates fixes this by walking
        backwards and swapping each position with a random position from
        what hasn't been visited yet.
      </>
    ),
    sourceTitle: 'Source code',
    demoTitle: 'Demo: shuffle cards',
    shuffle: 'Shuffle (Fisher-Yates)',
    biasTitle: 'Visual proof of the bias',
    biasIntro: (
      <>
        Runs both versions N times and measures how often each letter
        landed in <Text code>position 0</Text> after shuffling. With 8
        items the expected share is ~12.5% each — Fisher-Yates converges
        to that, the naive sort doesn't.
      </>
    ),
    runs: 'Runs',
    run: 'Run simulation',
    fyLabel: 'Fisher-Yates (correct)',
    naiveLabel: 'naive sort() (biased)',
    position0: 'Frequency landing in position 0 after shuffling',
    hoverHint: 'Hover a bar to see the exact value',
  },
}

function CardsDemo({ t }) {
  const [cards, setCards] = useState(ITEMS)

  return (
    <Space direction="vertical" size="middle">
      <Space size={8} wrap>
        {cards.map((c) => (
          <div
            key={c}
            style={{
              width: 44,
              height: 60,
              borderRadius: 8,
              background: '#fafafa',
              border: '1px solid #d9d9d9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              fontWeight: 700,
              transition: 'transform 0.2s ease',
            }}
          >
            {c}
          </div>
        ))}
      </Space>
      <Button icon={<RetweetOutlined />} onClick={() => setCards(fisherYatesShuffle(cards))}>
        {t.shuffle}
      </Button>
    </Space>
  )
}

function BiasDemo({ t }) {
  const [runs, setRuns] = useState(2000)
  const [result, setResult] = useState(null)

  function simulate() {
    const fyCounts = new Array(ITEMS.length).fill(0)
    const naiveCounts = new Array(ITEMS.length).fill(0)
    for (let i = 0; i < runs; i++) {
      const fy = fisherYatesShuffle(ITEMS)
      const naive = naiveSortShuffle(ITEMS)
      fyCounts[ITEMS.indexOf(fy[0])] += 1
      naiveCounts[ITEMS.indexOf(naive[0])] += 1
    }
    setResult({
      fy: fyCounts.map((c) => (c / runs) * 100),
      naive: naiveCounts.map((c) => (c / runs) * 100),
    })
  }

  const maxPct = result ? Math.max(...result.fy, ...result.naive, 12.5) : 12.5

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Space align="center" wrap>
        <Text type="secondary">{t.runs}: {runs}</Text>
        <Slider min={200} max={5000} step={200} value={runs} onChange={setRuns} style={{ width: 200 }} />
        <Button type="primary" onClick={simulate}>{t.run}</Button>
      </Space>

      {result && (
        <div>
          <Space size={16} style={{ marginBottom: 8 }}>
            <Space size={6}><span style={{ width: 10, height: 10, borderRadius: 2, background: FY_COLOR, display: 'inline-block' }} /><Text style={{ fontSize: 12 }}>{t.fyLabel}</Text></Space>
            <Space size={6}><span style={{ width: 10, height: 10, borderRadius: 2, background: NAIVE_COLOR, display: 'inline-block' }} /><Text style={{ fontSize: 12 }}>{t.naiveLabel}</Text></Space>
          </Space>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 160, borderBottom: '1px solid #c3c2b7', paddingBottom: 2 }}>
            {ITEMS.map((letter, idx) => (
              <div key={letter} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 140 }}>
                  <div
                    title={`${t.fyLabel}: ${result.fy[idx].toFixed(1)}%`}
                    style={{
                      width: 14,
                      height: `${(result.fy[idx] / maxPct) * 140}px`,
                      background: FY_COLOR,
                      borderRadius: '4px 4px 0 0',
                    }}
                  />
                  <div
                    title={`${t.naiveLabel}: ${result.naive[idx].toFixed(1)}%`}
                    style={{
                      width: 14,
                      height: `${(result.naive[idx] / maxPct) * 140}px`,
                      background: NAIVE_COLOR,
                      borderRadius: '4px 4px 0 0',
                    }}
                  />
                </div>
                <Text style={{ fontSize: 12 }}>{letter}</Text>
              </div>
            ))}
          </div>
          <Text type="secondary" style={{ fontSize: 12 }}>{t.hoverHint}</Text>
        </div>
      )}
    </Space>
  )
}

export default function FisherYatesShufflePage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><RetweetOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card title={t.sourceTitle}>
        <pre style={{ margin: 0, overflowX: 'auto' }}>
          <code>{sourceCode}</code>
        </pre>
      </Card>

      <Card title={t.demoTitle}>
        <CardsDemo t={t} />
      </Card>

      <Card title={t.biasTitle}>
        <Paragraph type="secondary">{t.biasIntro}</Paragraph>
        <Text strong style={{ display: 'block', marginBottom: 8 }}>{t.position0}</Text>
        <BiasDemo t={t} />
      </Card>
    </Space>
  )
}
