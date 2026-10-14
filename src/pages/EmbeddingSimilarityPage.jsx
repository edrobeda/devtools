import React, { useMemo, useState } from 'react'
import {
  Typography,
  Card,
  Input,
  Space,
  Button,
  Tag,
  Alert,
  Collapse,
  Statistic,
  Progress,
  Select,
  Empty,
  Row,
  Col,
  message,
} from 'antd'
import { ExperimentOutlined, CopyOutlined, ClearOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography
const { Panel } = Collapse
const { TextArea } = Input

const MAX_MATRIX = 30

const sourceCode = `// Similaridade de cosseno: cosseno do ângulo entre dois vetores.
// 1 = mesma direção, 0 = ortogonais, -1 = sentidos opostos.
// É a métrica padrão para comparar embeddings porque ignora o
// comprimento (norma) do vetor e olha só a direção/semântica.

function dot(a, b) {
  let s = 0
  for (let i = 0; i < a.length; i++) s += a[i] * b[i]
  return s
}

function norm(a) {
  return Math.sqrt(dot(a, a)) // norma L2
}

function cosineSimilarity(a, b) {
  const denom = norm(a) * norm(b)
  if (denom === 0) return null // vetor nulo => cosseno indefinido
  return dot(a, b) / denom
}

function euclidean(a, b) { // distância L2
  let s = 0
  for (let i = 0; i < a.length; i++) s += (a[i] - b[i]) ** 2
  return Math.sqrt(s)
}

function manhattan(a, b) { // distância L1
  let s = 0
  for (let i = 0; i < a.length; i++) s += Math.abs(a[i] - b[i])
  return s
}

// Ângulo em graus a partir da similaridade de cosseno
function angleDeg(a, b) {
  const c = cosineSimilarity(a, b)
  if (c === null) return null
  const clamped = Math.max(-1, Math.min(1, c))
  return (Math.acos(clamped) * 180) / Math.PI
}
`

function dot(a, b) {
  let s = 0
  for (let i = 0; i < a.length; i += 1) s += a[i] * b[i]
  return s
}

function norm(a) {
  return Math.sqrt(dot(a, a))
}

function cosineSimilarity(a, b) {
  const denom = norm(a) * norm(b)
  if (denom === 0) return null
  return dot(a, b) / denom
}

function euclidean(a, b) {
  let s = 0
  for (let i = 0; i < a.length; i += 1) s += (a[i] - b[i]) ** 2
  return Math.sqrt(s)
}

function manhattan(a, b) {
  let s = 0
  for (let i = 0; i < a.length; i += 1) s += Math.abs(a[i] - b[i])
  return s
}

function angleDeg(a, b) {
  const c = cosineSimilarity(a, b)
  if (c === null) return null
  const clamped = Math.max(-1, Math.min(1, c))
  return (Math.acos(clamped) * 180) / Math.PI
}

function parseEmbeddings(text) {
  const vectors = []
  const errors = []
  const lines = text.split(/\r?\n/)
  lines.forEach((raw, idx) => {
    const line = raw.trim()
    if (!line || line.startsWith('#')) return
    let label = ''
    let body = line
    const sep = line.search(/[:=]/)
    if (sep > 0) {
      const left = line.slice(0, sep).trim()
      const right = line.slice(sep + 1).trim()
      if (left && !/^[\s\d.,;eE+\-]+$/.test(left) && /\d/.test(right)) {
        label = left
        body = right
      }
    }
    const parts = body.split(/[\s,;]+/).filter(Boolean)
    const values = []
    let bad = false
    for (let i = 0; i < parts.length; i += 1) {
      const n = Number(parts[i])
      if (Number.isFinite(n)) values.push(n)
      else {
        bad = true
        break
      }
    }
    if (bad || values.length === 0) {
      errors.push({ line: idx + 1, raw: line })
      return
    }
    vectors.push({ label: label || `v${vectors.length + 1}`, values })
  })

  const dims = vectors.length ? vectors[0].values.length : 0
  const dimMismatch = vectors.some((v) => v.values.length !== dims)
  return { vectors, errors, dims, dimMismatch }
}

function fmt(n, digits = 4) {
  if (n === null || n === undefined || Number.isNaN(n)) return '—'
  return Number(n.toFixed(digits)).toString()
}

function simCellStyle(s) {
  if (s === null) return { background: '#f5f5f5', color: '#999' }
  if (s >= 0) {
    const a = 0.08 + Math.min(1, s) * 0.82
    return { background: `rgba(22, 119, 255, ${a})`, color: s > 0.5 ? '#fff' : '#111' }
  }
  const a = 0.08 + Math.min(1, -s) * 0.5
  return { background: `rgba(245, 34, 45, ${a})`, color: '#111' }
}

const EXAMPLE = `consulta       : 0.90, 0.10, 0.05, 0.20
sobre_caes     : 0.85, 0.15, 0.10, 0.25
sobre_gatos    : 0.80, 0.20, 0.12, 0.18
sobre_carros   : 0.10, 0.88, 0.20, 0.05
sobre_financas : 0.05, 0.15, 0.92, 0.10
sobre_esportes : 0.15, 0.10, 0.08, 0.90`

const translations = {
  pt: {
    title: 'Similaridade de Embeddings (Vetores)',
    intro: (
      <>
        Cole embeddings — os vetores que modelos de linguagem geram para palavras,
        frases, documentos ou imagens — e veja a semelhança entre eles. A métrica
        é a <Text code>similaridade de cosseno</Text>: o cosseno do ângulo entre dois
        vetores, de <Text code>-1</Text> (opostos) a <Text code>1</Text> (idênticos em
        direção). Ideal para depurar busca semântica e RAG: descubra qual trecho é o
        mais parecido com a sua pergunta. Tudo roda no navegador.
      </>
    ),
    inputLabel: 'Embeddings (um por linha)',
    inputHint: 'Uma linha por vetor. Use um rótulo opcional antes de ":" ou "=" (ex.: nome: 0.1, 0.2, 0.3). Vírgula, ponto e vírgula ou espaço separam os números. Linhas começando com # são ignoradas.',
    placeholder: 'consulta: 0.9, 0.1, 0.05, 0.2\nsobre_caes: 0.85, 0.15, 0.1, 0.25',
    loadExample: 'Carregar exemplo',
    clear: 'Limpar',
    copyMatrix: 'Copiar matriz',
    copied: 'Copiado',
    errorsTitle: 'Linhas não reconhecidas',
    errorLine: 'Linha {line}: "{raw}"',
    mismatchTitle: 'Dimensões diferentes',
    mismatchBody: 'Todos os vetores precisam ter a mesma quantidade de dimensões. Dimensões por vetor: {list}.',
    emptyTitle: 'Nenhum embedding ainda',
    emptyBody: 'Cole pelo menos dois vetores para comparar (um por linha) ou carregue o exemplo.',
    count: 'Vetores',
    dims: 'Dimensões',
    matrixTitle: 'Matriz de similaridade (cosseno)',
    matrixTooLarge: 'A matriz é exibida apenas para até {max} vetores. Você tem {n}.',
    legendLow: 'Opostos',
    legendHigh: 'Idênticos',
    rankingTitle: 'Busca semântica por similaridade',
    queryLabel: 'Vetor de consulta',
    rank: 'Ranking',
    rankLabel: 'Vetor',
    rankCos: 'Cosseno',
    rankDist: 'Distância L2',
    pairTitle: 'Comparação par a par',
    vecA: 'Vetor A',
    vecB: 'Vetor B',
    cosine: 'Similaridade (cosseno)',
    angle: 'Ângulo',
    dotProduct: 'Produto escalar',
    normA: 'Norma de A',
    normB: 'Norma de B',
    euclidean: 'Distância L2',
    manhattan: 'Distância L1',
    degrees: 'graus',
    explanationTitle: 'Por que cosseno?',
    explanation: (
      <>
        Em embeddings, o <Text strong>tamanho</Text> do vetor costuma carregar pouco
        significado (muitos modelos já devolvem vetores normalizados), então o que
        importa é a <Text strong>direção</Text>. A similaridade de cosseno divide o
        produto escalar pelo produto das normas, o que a torna invariante à escala:
        <br /><br />
        <Text code>cos(a, b) = (a · b) / (|a| · |b|)</Text>
        <br /><br />
        <ul style={{ marginBottom: 0 }}>
          <li><Text code>1</Text> — mesma direção (máxima similaridade).</li>
          <li><Text code>0</Text> — ortogonais (sem relação linear).</li>
          <li><Text code>-1</Text> — direções opostas.</li>
        </ul>
        A distância de cosseno é <Text code>1 - cos(a, b)</Text>; use-a quando precisar
        de uma “distância” (0 = idênticos). Para vetores de norma 1, a distância
        euclidiana e a de cosseno são monótonas entre si.
      </>
    ),
    sourceCode: 'Código-fonte do motor',
    warningNull: 'Vetores nulos (todos os componentes 0) não têm cosseno definido e aparecem como “—”.',
  },
  en: {
    title: 'Embedding Similarity (Vectors)',
    intro: (
      <>
        Paste embeddings — the vectors language models produce for words, sentences,
        documents or images — and see how alike they are. The metric is{' '}
        <Text code>cosine similarity</Text>: the cosine of the angle between two
        vectors, from <Text code>-1</Text> (opposite) to <Text code>1</Text> (same
        direction). Great for debugging semantic search and RAG: find which chunk is
        closest to your query. Everything runs in the browser.
      </>
    ),
    inputLabel: 'Embeddings (one per line)',
    inputHint: 'One line per vector. Optional label before ":" or "=" (e.g. name: 0.1, 0.2, 0.3). Comma, semicolon or whitespace separates the numbers. Lines starting with # are ignored.',
    placeholder: 'query: 0.9, 0.1, 0.05, 0.2\ndogs: 0.85, 0.15, 0.1, 0.25',
    loadExample: 'Load example',
    clear: 'Clear',
    copyMatrix: 'Copy matrix',
    copied: 'Copied',
    errorsTitle: 'Unrecognized lines',
    errorLine: 'Line {line}: "{raw}"',
    mismatchTitle: 'Different dimensions',
    mismatchBody: 'All vectors must have the same number of dimensions. Dimensions per vector: {list}.',
    emptyTitle: 'No embeddings yet',
    emptyBody: 'Paste at least two vectors to compare (one per line) or load the example.',
    count: 'Vectors',
    dims: 'Dimensions',
    matrixTitle: 'Similarity matrix (cosine)',
    matrixTooLarge: 'The matrix is shown only for up to {max} vectors. You have {n}.',
    legendLow: 'Opposite',
    legendHigh: 'Identical',
    rankingTitle: 'Semantic search by similarity',
    queryLabel: 'Query vector',
    rank: 'Ranking',
    rankLabel: 'Vector',
    rankCos: 'Cosine',
    rankDist: 'L2 distance',
    pairTitle: 'Pairwise comparison',
    vecA: 'Vector A',
    vecB: 'Vector B',
    cosine: 'Similarity (cosine)',
    angle: 'Angle',
    dotProduct: 'Dot product',
    normA: 'Norm of A',
    normB: 'Norm of B',
    euclidean: 'L2 distance',
    manhattan: 'L1 distance',
    degrees: 'degrees',
    explanationTitle: 'Why cosine?',
    explanation: (
      <>
        In embeddings, a vector&apos;s <Text strong>length</Text> usually carries little
        meaning (many models already return normalized vectors), so what matters is the{' '}
        <Text strong>direction</Text>. Cosine similarity divides the dot product by the
        product of the norms, which makes it scale-invariant:
        <br /><br />
        <Text code>cos(a, b) = (a · b) / (|a| · |b|)</Text>
        <br /><br />
        <ul style={{ marginBottom: 0 }}>
          <li><Text code>1</Text> — same direction (maximally similar).</li>
          <li><Text code>0</Text> — orthogonal (no linear relation).</li>
          <li><Text code>-1</Text> — opposite directions.</li>
        </ul>
        The cosine distance is <Text code>1 - cos(a, b)</Text>; use it when you need a
        “distance” (0 = identical). For unit-norm vectors, Euclidean and cosine
        distance are monotonic in one another.
      </>
    ),
    sourceCode: 'Engine source code',
    warningNull: 'Zero vectors (all components 0) have no defined cosine and show as “—”.',
  },
}

export default function EmbeddingSimilarityPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [raw, setRaw] = useState(EXAMPLE)
  const [queryIndex, setQueryIndex] = useState(0)
  const [pairA, setPairA] = useState(0)
  const [pairB, setPairB] = useState(1)

  const parsed = useMemo(() => parseEmbeddings(raw), [raw])
  const { vectors, errors, dims, dimMismatch } = parsed
  const usable = !dimMismatch && vectors.length >= 2

  const matrix = useMemo(() => {
    if (!usable) return []
    return vectors.map((a) => vectors.map((b) => cosineSimilarity(a.values, b.values)))
  }, [usable, vectors])

  const safeQuery = Math.min(queryIndex, Math.max(0, vectors.length - 1))
  const safeA = Math.min(pairA, Math.max(0, vectors.length - 1))
  const safeB = Math.min(pairB, Math.max(0, vectors.length - 1))

  const ranking = useMemo(() => {
    if (!usable) return []
    const q = vectors[safeQuery]
    return vectors
      .map((v, i) => ({
        index: i,
        label: v.label,
        cos: cosineSimilarity(q.values, v.values),
        dist: euclidean(q.values, v.values),
      }))
      .filter((r) => r.index !== safeQuery)
      .sort((x, y) => {
        if (x.cos === null) return 1
        if (y.cos === null) return -1
        return y.cos - x.cos
      })
  }, [usable, vectors, safeQuery])

  const pair = useMemo(() => {
    if (!usable) return null
    const a = vectors[safeA]
    const b = vectors[safeB]
    return {
      cosine: cosineSimilarity(a.values, b.values),
      angle: angleDeg(a.values, b.values),
      dot: dot(a.values, b.values),
      normA: norm(a.values),
      normB: norm(b.values),
      euclidean: euclidean(a.values, b.values),
      manhattan: manhattan(a.values, b.values),
    }
  }, [usable, vectors, safeA, safeB])

  const options = useMemo(
    () => vectors.map((v, i) => ({ value: i, label: `${v.label} (#${i + 1})` })),
    [vectors],
  )

  function copyMatrix() {
    if (!matrix.length) return
    const header = ['', ...vectors.map((v) => v.label)].join('\t')
    const body = matrix
      .map((row, i) => [vectors[i].label, ...row.map((c) => fmt(c, 4))].join('\t'))
      .join('\n')
    navigator.clipboard.writeText(`${header}\n${body}`)
    message.success(t.copied)
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><ExperimentOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text strong>{t.inputLabel}</Text>
          <TextArea
            rows={7}
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            placeholder={t.placeholder}
            spellCheck={false}
            style={{ fontFamily: 'monospace' }}
          />
          <Text type="secondary" style={{ fontSize: 12 }}>{t.inputHint}</Text>
          <Space wrap>
            <Button onClick={() => setRaw(EXAMPLE)}>{t.loadExample}</Button>
            <Button icon={<ClearOutlined />} onClick={() => setRaw('')}>{t.clear}</Button>
          </Space>
        </Space>
      </Card>

      {errors.length > 0 && (
        <Alert
          type="warning"
          showIcon
          message={t.errorsTitle}
          description={
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {errors.map((e, i) => (
                <li key={i}>
                  {t.errorLine.replace('{line}', String(e.line)).replace('{raw}', e.raw)}
                </li>
              ))}
            </ul>
          }
        />
      )}

      {dimMismatch && (
        <Alert
          type="error"
          showIcon
          message={t.mismatchTitle}
          description={t.mismatchBody.replace(
            '{list}',
            vectors.map((v) => `${v.label}=${v.values.length}`).join(', '),
          )}
        />
      )}

      {!usable && !dimMismatch && (
        <Card>
          <Empty description={<><Text strong>{t.emptyTitle}</Text><br /><Text type="secondary">{t.emptyBody}</Text></>} />
        </Card>
      )}

      {usable && (
        <>
          <Card>
            <Row gutter={[16, 16]}>
              <Col xs={12} sm={6}><Statistic title={t.count} value={vectors.length} /></Col>
              <Col xs={12} sm={6}><Statistic title={t.dims} value={dims} /></Col>
            </Row>
          </Card>

          <Card
            title={t.matrixTitle}
            extra={<Button size="small" icon={<CopyOutlined />} onClick={copyMatrix}>{t.copyMatrix}</Button>}
          >
            {vectors.length <= MAX_MATRIX ? (
              <>
                <div style={{ overflowX: 'auto' }}>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: `minmax(96px, max-content) repeat(${vectors.length}, minmax(56px, 1fr))`,
                      gap: 2,
                      minWidth: vectors.length * 58 + 100,
                    }}
                  >
                    <div />
                    {vectors.map((v, j) => (
                      <div
                        key={`h-${j}`}
                        style={{ fontSize: 11, fontWeight: 600, textAlign: 'center', padding: '4px 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                        title={v.label}
                      >
                        {v.label}
                      </div>
                    ))}
                    {vectors.map((rowVec, i) => (
                      <React.Fragment key={`r-${i}`}>
                        <div
                          style={{ fontSize: 11, fontWeight: 600, padding: '6px 6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                          title={rowVec.label}
                        >
                          {rowVec.label}
                        </div>
                        {matrix[i].map((c, j) => (
                          <div
                            key={`c-${i}-${j}`}
                            title={`${rowVec.label} × ${vectors[j].label}: ${fmt(c)}`}
                            style={{
                              ...simCellStyle(c),
                              fontFamily: 'monospace',
                              fontSize: 11,
                              textAlign: 'center',
                              padding: '6px 2px',
                              borderRadius: 4,
                              fontWeight: i === j ? 700 : 400,
                            }}
                          >
                            {fmt(c, 2)}
                          </div>
                        ))}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
                <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                  <Text type="secondary">{t.legendLow}</Text>
                  <div
                    style={{
                      flex: 1,
                      maxWidth: 220,
                      height: 10,
                      borderRadius: 5,
                      background: 'linear-gradient(90deg, rgba(245,34,45,0.5), #f5f5f5, rgba(22,119,255,0.9))',
                    }}
                  />
                  <Text type="secondary">{t.legendHigh}</Text>
                </div>
              </>
            ) : (
              <Alert
                type="info"
                showIcon
                message={t.matrixTooLarge.replace('{max}', String(MAX_MATRIX)).replace('{n}', String(vectors.length))}
              />
            )}
          </Card>

          <Card title={t.rankingTitle}>
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <Space wrap align="center">
                <Text strong>{t.queryLabel}:</Text>
                <Select
                  style={{ minWidth: 200 }}
                  value={safeQuery}
                  options={options}
                  onChange={setQueryIndex}
                />
              </Space>

              <div>
                <Text strong>{t.rank}</Text>
                <Row gutter={8} style={{ marginTop: 8, marginBottom: 4, fontSize: 12, color: '#888' }}>
                  <Col span={9}>{t.rankLabel}</Col>
                  <Col span={11} />
                  <Col span={4} style={{ textAlign: 'right' }}>{t.rankCos}</Col>
                </Row>
                {ranking.map((r) => {
                  const pct = r.cos === null ? 0 : Math.round(((r.cos + 1) / 2) * 100)
                  const stroke = r.cos === null ? '#d9d9d9' : r.cos >= 0 ? '#1677ff' : '#f5222d'
                  return (
                    <Row key={r.index} gutter={8} align="middle" style={{ padding: '4px 0' }}>
                      <Col span={9}>
                        <Text ellipsis style={{ maxWidth: '100%' }} title={r.label}>{r.label}</Text>
                      </Col>
                      <Col span={11}>
                        <Progress
                          percent={pct}
                          showInfo={false}
                          strokeColor={stroke}
                          size="small"
                          format={() => ''}
                        />
                      </Col>
                      <Col span={4} style={{ textAlign: 'right' }}>
                        <Text code>{fmt(r.cos)}</Text>
                      </Col>
                    </Row>
                  )
                })}
              </div>
            </Space>
          </Card>

          <Card title={t.pairTitle}>
            <Space wrap align="center" style={{ marginBottom: 16 }}>
              <Text strong>{t.vecA}:</Text>
              <Select style={{ minWidth: 180 }} value={safeA} options={options} onChange={setPairA} />
              <Text strong>{t.vecB}:</Text>
              <Select style={{ minWidth: 180 }} value={safeB} options={options} onChange={setPairB} />
            </Space>
            {pair && (
              <Row gutter={[16, 16]}>
                <Col xs={12} sm={8} md={6}>
                  <Statistic title={t.cosine} value={pair.cosine === null ? '—' : pair.cosine} precision={pair.cosine === null ? undefined : 4} />
                </Col>
                <Col xs={12} sm={8} md={6}>
                  <Statistic title={t.angle} value={pair.angle === null ? '—' : pair.angle} precision={pair.angle === null ? undefined : 2} suffix={pair.angle === null ? '' : ` ${t.degrees}`} />
                </Col>
                <Col xs={12} sm={8} md={6}>
                  <Statistic title={t.dotProduct} value={pair.dot} precision={4} />
                </Col>
                <Col xs={12} sm={8} md={6}>
                  <Statistic title={t.normA} value={pair.normA} precision={4} />
                </Col>
                <Col xs={12} sm={8} md={6}>
                  <Statistic title={t.normB} value={pair.normB} precision={4} />
                </Col>
                <Col xs={12} sm={8} md={6}>
                  <Statistic title={t.euclidean} value={pair.euclidean} precision={4} />
                </Col>
                <Col xs={12} sm={8} md={6}>
                  <Statistic title={t.manhattan} value={pair.manhattan} precision={4} />
                </Col>
              </Row>
            )}
          </Card>
        </>
      )}

      <Alert
        type="info"
        showIcon
        message={t.explanationTitle}
        description={t.explanation}
      />

      <Alert
        type="warning"
        showIcon
        message={t.warningNull}
      />

      <Collapse>
        <Panel header={t.sourceCode} key="source">
          <pre style={{ margin: 0, overflow: 'auto' }}>
            <code>{sourceCode}</code>
          </pre>
        </Panel>
      </Collapse>
    </Space>
  )
}
