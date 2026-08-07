import React, { useMemo, useState } from 'react'
import { Typography, Card, Space, Button, Slider, InputNumber, Table, Tag, Descriptions } from 'antd'
import { ExperimentOutlined, ThunderboltOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

// Núcleo do simulador — a matemática do paradoxo do aniversário aplicada a
// um espaço de M valores (UUID v4 => 2^122). Ver página.
const SNIPPET = `const M = 2 ** 122            // espaço de um UUID v4 (122 bits aleatórios)

// P(>= 1 colisão) após gerar n IDs — aproximação clássica,
// exata demais quando n << M:
function collisionProb(n, M) {
  return 1 - Math.exp(-(n * (n - 1)) / (2 * M))
}

// Número esperado de pares que colidem (paradoxo do aniversário):
function expectedCollisions(n, M) {
  return (n * (n - 1)) / (2 * M)
}

// N onde a chance de colisão cruza 50%: n ~= sqrt(2 * M * ln 2)`

const UUID_BITS = 122

// n fixos pra tabela de referência do UUID v4.
const REF_N = [1e3, 1e6, 1e9, 1e12, 1e15, 1e18]

function sci(x) {
  if (!isFinite(x)) return String(x)
  if (x === 0) return '0'
  if (Math.abs(x) >= 1e6 || (Math.abs(x) > 0 && Math.abs(x) < 1e-3)) {
    const [mant, exp] = x.toExponential(2).split('e')
    return `${mant} × 10^${parseInt(exp, 10)}`
  }
  return x.toLocaleString(undefined, { maximumFractionDigits: 4 })
}

const translations = {
  pt: {
    title: 'Simulador de Colisão de UUID',
    intro: (
      <>
        Todo mundo sabe que "colisão de UUID é praticamente impossível" — mas
        <Text strong> quão</Text> impossível? Esta página aplica o{' '}
        <Text code>paradoxo do aniversário</Text> (o mesmo efeito que faz duas
        pessoas na mesma sala terem boas chances de aniversariar no mesmo dia)
        ao espaço de um UUID v4, mostra a matemática e permite{' '}
        <Text strong>simular de verdade</Text> com espaços menores — reduzindo
        a entropia, as colisões acontecem e você vê o modelo teórico bater com
        o observado. Complementa o gerador de UUID e o de NanoID, que só geram
        IDs.
      </>
    ),
    mathTitle: 'A matemática',
    mathIntro: (
      <>
        Um UUID v4 tem <Text code>122 bits</Text> de entropia, ou seja, um
        espaço de <Text code>M = 2^122 ≈ 5,32 × 10^36</Text> valores possíveis.
        Gerar <Text code>n</Text> IDs sorteados uniformemente é o mesmo que
        jogar <Text code>n</Text> bolinhas em <Text code>M</Text> caixas: a
        chance de <Text strong>pelo menos uma</Text> caixa receber duas
        bolinhas cresce bem mais rápido do que a intuição sugere.
      </>
    ),
    halfLife: 'Para chegar a 50% de chance de colisão você precisaria gerar ~',
    halfLifeNote: (
      <>
        IDs. Mesmo gerando <Text code>1 bilhão de IDs por segundo</Text> em
        todas as máquinas do planeta, passar disso levaria séculos — por isso
        na prática UUIDv4 não colide. Mas com pouca entropia (ex.: IDs curtos,
        emoji, timestamps de ms) o problema fica real.
      </>
    ),
    refTitle: 'Probabilidade de colisão em UUID v4 (122 bits)',
    refNote: (
      <>
        Cuidado com a notação: <Text code>× 10^-12</Text> é{' '}
        <Text code>0,000000000001</Text>. Só a partir da casa de{' '}
        <Text code>10^15</Text> IDs a chance deixa de ser desprezível.
      </>
    ),
    refN: 'IDs gerados (n)',
    refSpace: 'Espaço (M = 2^122)',
    refProb: 'P(≥ 1 colisão)',
    refExp: 'Colisões esperadas',
    refHalf: '50% de chance em n ≈',
    simTitle: 'Simulação com entropia reduzida',
    simIntro: (
      <>
        Os números de 122 bits são grandes demais pra simular no navegador.
        Abaixo o espaço é encolhido (deslize <Text code>bits</Text>) até as
        colisões ficarem observáveis — e o resultado confere com a fórmula.
        Rode várias vezes: o observado oscila em volta do esperado.
      </>
    ),
    bits: 'Bits de entropia',
    bitsNote: 'Um UUID v4 real usa 122 bits — acima é só pra simular.',
    nLabel: 'IDs gerados (n)',
    run: 'Simular sorteio',
    runMany: 'Rodar 20 vezes',
    expected: 'Colisões esperadas (teórico)',
    observed: 'Colisões observadas',
    distinct: 'IDs distintos',
    match: 'Teórico vs. observado',
    matchNote: 'Barras lado a lado: o esperado pela fórmula (azul) contra a média do que a simulação observou (laranja).',
    lastRun: 'Última rodada',
    avg: 'Média das 20 rodadas',
    pObserved: 'Colisão observada?',
    yes: 'Sim',
    no: 'Não',
    noRunYet: 'Rode a simulação pra ver o resultado.',
    formulaTitle: 'A fórmula (código)',
    sourceTitle: 'Como funciona',
    sourceIntro: (
      <>
        A aproximação <Text code>P ≈ 1 − e^(−n²/2M)</Text> vem de considerar
        cada par de IDs como um evento independente e raro. Vale enquanto{' '}
        <Text code>n ≪ M</Text> — que é exatamente o regime real dos UUIDs.
      </>
    ),
    stats: 'Números de referência (UUID v4)',
  },
  en: {
    title: 'UUID Collision Simulator',
    intro: (
      <>
        Everyone knows "UUID collisions basically never happen" — but{' '}
        <Text strong>how</Text> impossible? This page applies the{' '}
        <Text code>birthday paradox</Text> (the same effect that makes two
        people in a room likely to share a birthday) to the UUID v4 space,
        shows the math, and lets you{' '}
        <Text strong>actually simulate</Text> it with smaller spaces — by
        shrinking the entropy, collisions start happening and you watch the
        theoretical model match the observed results. Complements the UUID
        and NanoID generators, which only produce IDs.
      </>
    ),
    mathTitle: 'The math',
    mathIntro: (
      <>
        A UUID v4 has <Text code>122 bits</Text> of entropy, i.e. a space of{' '}
        <Text code>M = 2^122 ≈ 5.32 × 10^36</Text> possible values. Drawing{' '}
        <Text code>n</Text> uniformly random IDs is the same as throwing{' '}
        <Text code>n</Text> balls into <Text code>M</Text> bins: the chance of{' '}
        <Text strong>at least one</Text> bin getting two balls grows far
        faster than intuition suggests.
      </>
    ),
    halfLife: 'To reach a 50% chance of collision you would need to generate ~',
    halfLifeNote: (
      <>
        IDs. Even generating <Text code>1 billion IDs per second</Text> on
        every machine on the planet, getting there would take centuries —
        which is why UUIDv4 never collides in practice. But with low entropy
        (short IDs, emoji, millisecond timestamps) the problem gets real.
      </>
    ),
    refTitle: 'Collision probability in UUID v4 (122 bits)',
    refNote: (
      <>
        Mind the notation: <Text code>× 10^-12</Text> is{' '}
        <Text code>0.000000000001</Text>. Only past the{' '}
        <Text code>10^15</Text> IDs mark does the chance stop being negligible.
      </>
    ),
    refN: 'IDs generated (n)',
    refSpace: 'Space (M = 2^122)',
    refProb: 'P(≥ 1 collision)',
    refExp: 'Expected collisions',
    refHalf: '50% chance at n ≈',
    simTitle: 'Simulation with reduced entropy',
    simIntro: (
      <>
        122-bit numbers are far too big to simulate in the browser. Below the
        space is shrunk (drag <Text code>bits</Text>) until collisions become
        observable — and the result matches the formula. Run it a few times:
        the observed value oscillates around the expected one.
      </>
    ),
    bits: 'Entropy bits',
    bitsNote: 'A real UUID v4 uses 122 bits — the above is just for simulation.',
    nLabel: 'IDs generated (n)',
    run: 'Run draw',
    runMany: 'Run 20 times',
    expected: 'Expected collisions (theoretical)',
    observed: 'Observed collisions',
    distinct: 'Distinct IDs',
    match: 'Theoretical vs. observed',
    matchNote: 'Side-by-side bars: what the formula predicts (blue) against the average of what the simulation observed (orange).',
    lastRun: 'Last run',
    avg: 'Average of 20 runs',
    pObserved: 'Collision observed?',
    yes: 'Yes',
    no: 'No',
    noRunYet: 'Run the simulation to see the result.',
    formulaTitle: 'The formula (code)',
    sourceTitle: 'How it works',
    sourceIntro: (
      <>
        The approximation <Text code>P ≈ 1 − e^(−n²/2M)</Text> comes from
        treating each pair of IDs as an independent, rare event. It holds
        while <Text code>n ≪ M</Text> — exactly the regime real UUIDs live in.
      </>
    ),
    stats: 'Reference numbers (UUID v4)',
  },
}

const EXPECTED_COLOR = '#2a78d6'
const OBSERVED_COLOR = '#eb6834'

function runOnce(bits, n) {
  const m = 2 ** bits
  const seen = new Set()
  for (let i = 0; i < n; i++) {
    seen.add(Math.floor(Math.random() * m))
  }
  return { m, distinct: seen.size, observed: n - seen.size }
}

export default function UuidCollisionSimulatorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [bits, setBits] = useState(20)
  const [n, setN] = useState(200000)
  const [lastResult, setLastResult] = useState(null)
  const [avgResult, setAvgResult] = useState(null)

  const M = 2 ** bits
  const expected = useMemo(() => (n * (n - 1)) / (2 * M), [n, M])
  const prob = useMemo(() => 1 - Math.exp(-(n * (n - 1)) / (2 * M)), [n, M])

  const uuidStats = useMemo(() => {
    const m = 2 ** UUID_BITS
    const half = Math.sqrt(2 * m * Math.LN2)
    const rows = REF_N.map((cnt) => {
      const pair = (cnt * (cnt - 1)) / (2 * m)
      return {
        key: sci(cnt),
        n: sci(cnt),
        space: sci(m),
        prob: sci(1 - Math.exp(-pair)),
        exp: sci(pair),
      }
    })
    return { m, half, rows }
  }, [])

  const halfLifeLabel = useMemo(
    () => (
      <>
        {t.halfLife}{' '}
        <Text code>{sci(uuidStats.half)}</Text> {t.halfLifeNote}
      </>
    ),
    [t, uuidStats.half],
  )

  function handleRun() {
    const r = runOnce(bits, n)
    setLastResult(r)
  }

  function handleRunMany() {
    const total = 20
    let sumObserved = 0
    let sumDistinct = 0
    let sawCollision = false
    for (let i = 0; i < total; i++) {
      const r = runOnce(bits, n)
      sumObserved += r.observed
      sumDistinct += r.distinct
      if (r.observed > 0) sawCollision = true
    }
    setLastResult(null)
    setAvgResult({
      observed: sumObserved / total,
      distinct: Math.round(sumDistinct / total),
      sawCollision,
      expected,
    })
  }

  const barMax = Math.max(expected, avgResult?.observed || 0, 1)

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><ExperimentOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card title={t.mathTitle}>
        <Paragraph type="secondary">{t.mathIntro}</Paragraph>
        <Descriptions size="small" column={1} style={{ marginBottom: 12 }}>
          <Descriptions.Item label={t.refSpace}>
            <Text code>M = 2^122 ≈ {sci(uuidStats.m)}</Text>
          </Descriptions.Item>
          <Descriptions.Item label={t.refHalf}>
            <Text code>{sci(uuidStats.half)}</Text>
          </Descriptions.Item>
        </Descriptions>
        <Paragraph>{halfLifeLabel}</Paragraph>
      </Card>

      <Card title={t.refTitle}>
        <Paragraph type="secondary">{t.refNote}</Paragraph>
        <Table
          size="small"
          pagination={false}
          dataSource={uuidStats.rows}
          columns={[
            { title: t.refN, dataIndex: 'n', align: 'right' },
            { title: t.refProb, dataIndex: 'prob', align: 'right' },
            { title: t.refExp, dataIndex: 'exp', align: 'right' },
          ]}
        />
      </Card>

      <Card title={t.simTitle}>
        <Paragraph type="secondary">{t.simIntro}</Paragraph>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Space wrap align="center">
            <Space direction="vertical" size={4}>
              <Text type="secondary">{t.bits}: {bits}</Text>
              <Slider min={8} max={28} value={bits} onChange={setBits} style={{ width: 220 }} />
            </Space>
            <Space direction="vertical" size={4}>
              <Text type="secondary">{t.nLabel}</Text>
              <InputNumber min={1000} max={1000000} step={1000} value={n} onChange={(v) => setN(v ?? 0)} />
            </Space>
          </Space>
          <Space wrap>
            <Button type="primary" icon={<ThunderboltOutlined />} onClick={handleRun}>{t.run}</Button>
            <Button onClick={handleRunMany}>{t.runMany}</Button>
          </Space>
          <Tag>{t.bitsNote}</Tag>

          <Descriptions size="small" column={3}>
            <Descriptions.Item label={t.refSpace}>
              <Text code>2^{bits} ≈ {sci(M)}</Text>
            </Descriptions.Item>
            <Descriptions.Item label={t.expected}>{sci(expected)}</Descriptions.Item>
            <Descriptions.Item label={t.refProb}>{sci(prob)}</Descriptions.Item>
          </Descriptions>

          {lastResult && (
            <Card size="small" type="inner" title={t.lastRun}>
              <Descriptions size="small" column={3}>
                <Descriptions.Item label={t.distinct}>{lastResult.distinct.toLocaleString()}</Descriptions.Item>
                <Descriptions.Item label={t.expected}>{sci(expected)}</Descriptions.Item>
                <Descriptions.Item label={t.observed}>
                  {lastResult.observed} {lastResult.observed > 0 ? <Tag color="red">{t.yes}</Tag> : <Tag color="green">{t.no}</Tag>}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          )}

          {avgResult && (
            <Card size="small" type="inner" title={t.avg}>
              <Descriptions size="small" column={3}>
                <Descriptions.Item label={t.distinct}>{avgResult.distinct.toLocaleString()}</Descriptions.Item>
                <Descriptions.Item label={t.expected}>{sci(expected)}</Descriptions.Item>
                <Descriptions.Item label={t.observed}>
                  {sci(avgResult.observed)}{' '}
                  {avgResult.sawCollision ? <Tag color="red">{t.yes}</Tag> : <Tag color="green">{t.no}</Tag>}
                </Descriptions.Item>
              </Descriptions>

              <Text strong style={{ display: 'block', margin: '16px 0 8px' }}>{t.match}</Text>
              <Paragraph type="secondary" style={{ marginBottom: 8 }}>{t.matchNote}</Paragraph>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 24, height: 120 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{ height: `${(expected / barMax) * 100}px`, width: 40, background: EXPECTED_COLOR, borderRadius: '4px 4px 0 0' }} />
                  <Text style={{ fontSize: 12 }}>{sci(expected)}</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>{t.expected}</Text>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{ height: `${(avgResult.observed / barMax) * 100}px`, width: 40, background: OBSERVED_COLOR, borderRadius: '4px 4px 0 0' }} />
                  <Text style={{ fontSize: 12 }}>{sci(avgResult.observed)}</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>{t.observed}</Text>
                </div>
              </div>
            </Card>
          )}

          {!lastResult && !avgResult && <Text type="secondary">{t.noRunYet}</Text>}
        </Space>
      </Card>

      <Card title={t.sourceTitle}>
        <Paragraph type="secondary">{t.sourceIntro}</Paragraph>
        <pre style={{ margin: 0, overflowX: 'auto' }}>
          <code>{SNIPPET}</code>
        </pre>
      </Card>
    </Space>
  )
}
