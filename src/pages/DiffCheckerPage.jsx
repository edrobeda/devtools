import React, { useMemo, useState } from 'react'
import { Typography, Card, Input, Space, Row, Col, Checkbox, Tag, Alert } from 'antd'
import { DiffOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input

const MAX_CELLS = 4_000_000 // n * m upper bound for the LCS table, protects the tab from freezing on huge pastes

function normalize(line, ignoreCase, ignoreWhitespace) {
  let out = line
  if (ignoreWhitespace) out = out.trim().replace(/\s+/g, ' ')
  if (ignoreCase) out = out.toLowerCase()
  return out
}

// Classic LCS-based line diff: builds the DP table backwards, then walks it
// forward picking "same" whenever both lines match, otherwise following
// whichever neighbor kept more of the longest common subsequence.
function computeLineDiff(linesA, linesB, ignoreCase, ignoreWhitespace) {
  const n = linesA.length
  const m = linesB.length
  const na = linesA.map((l) => normalize(l, ignoreCase, ignoreWhitespace))
  const nb = linesB.map((l) => normalize(l, ignoreCase, ignoreWhitespace))

  const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0))
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = na[i] === nb[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1])
    }
  }

  const result = []
  let i = 0
  let j = 0
  while (i < n && j < m) {
    if (na[i] === nb[j]) {
      result.push({ type: 'same', text: linesA[i] })
      i++
      j++
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      result.push({ type: 'removed', text: linesA[i] })
      i++
    } else {
      result.push({ type: 'added', text: linesB[j] })
      j++
    }
  }
  while (i < n) {
    result.push({ type: 'removed', text: linesA[i] })
    i++
  }
  while (j < m) {
    result.push({ type: 'added', text: linesB[j] })
    j++
  }
  return result
}

const LINE_STYLE = {
  same: { background: 'transparent', prefix: '  ' },
  added: { background: 'rgba(82, 196, 26, 0.15)', prefix: '+ ' },
  removed: { background: 'rgba(245, 34, 45, 0.15)', prefix: '- ' },
}

const translations = {
  pt: {
    title: 'Comparador de Texto (Diff)',
    intro: 'Compara duas versões de um texto linha a linha e destaca o que foi adicionado, removido ou permaneceu igual. Tudo roda no navegador, nada é enviado pra fora.',
    original: 'Original',
    modified: 'Modificado',
    placeholderA: 'Cole o texto original aqui...',
    placeholderB: 'Cole o texto modificado aqui...',
    ignoreCase: 'Ignorar maiúsculas/minúsculas',
    ignoreWhitespace: 'Ignorar espaços extras',
    result: 'Resultado',
    added: 'adicionadas',
    removed: 'removidas',
    unchanged: 'iguais',
    empty: 'Cole algo nos dois campos pra ver a comparação.',
    tooBig: 'Os textos são grandes demais pra comparar linha a linha no navegador sem travar a aba. Tente com um trecho menor.',
  },
  en: {
    title: 'Text Diff Checker',
    intro: 'Compares two versions of a text line by line and highlights what was added, removed, or stayed the same. Everything runs in the browser, nothing is sent out.',
    original: 'Original',
    modified: 'Modified',
    placeholderA: 'Paste the original text here...',
    placeholderB: 'Paste the modified text here...',
    ignoreCase: 'Ignore case',
    ignoreWhitespace: 'Ignore extra whitespace',
    result: 'Result',
    added: 'added',
    removed: 'removed',
    unchanged: 'unchanged',
    empty: 'Paste something in both fields to see the comparison.',
    tooBig: 'These texts are too large to diff line-by-line in the browser without freezing the tab. Try a smaller excerpt.',
  },
}

export default function DiffCheckerPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [textA, setTextA] = useState('')
  const [textB, setTextB] = useState('')
  const [ignoreCase, setIgnoreCase] = useState(false)
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(false)

  const linesA = useMemo(() => (textA === '' ? [] : textA.split('\n')), [textA])
  const linesB = useMemo(() => (textB === '' ? [] : textB.split('\n')), [textB])

  const tooBig = linesA.length * linesB.length > MAX_CELLS

  const diff = useMemo(() => {
    if (tooBig || (linesA.length === 0 && linesB.length === 0)) return []
    return computeLineDiff(linesA, linesB, ignoreCase, ignoreWhitespace)
  }, [linesA, linesB, ignoreCase, ignoreWhitespace, tooBig])

  const stats = useMemo(() => {
    const added = diff.filter((l) => l.type === 'added').length
    const removed = diff.filter((l) => l.type === 'removed').length
    const same = diff.filter((l) => l.type === 'same').length
    return { added, removed, same }
  }, [diff])

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><DiffOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Row gutter={16}>
        <Col span={12}>
          <Card title={t.original} size="small">
            <TextArea
              rows={10}
              value={textA}
              onChange={(e) => setTextA(e.target.value)}
              placeholder={t.placeholderA}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title={t.modified} size="small">
            <TextArea
              rows={10}
              value={textB}
              onChange={(e) => setTextB(e.target.value)}
              placeholder={t.placeholderB}
            />
          </Card>
        </Col>
      </Row>

      <Space>
        <Checkbox checked={ignoreCase} onChange={(e) => setIgnoreCase(e.target.checked)}>
          {t.ignoreCase}
        </Checkbox>
        <Checkbox checked={ignoreWhitespace} onChange={(e) => setIgnoreWhitespace(e.target.checked)}>
          {t.ignoreWhitespace}
        </Checkbox>
      </Space>

      {tooBig ? (
        <Alert type="warning" showIcon message={t.tooBig} />
      ) : diff.length === 0 ? (
        <Alert type="info" showIcon message={t.empty} />
      ) : (
        <Card
          title={t.result}
          extra={
            <Space>
              <Tag color="success">+{stats.added} {t.added}</Tag>
              <Tag color="error">-{stats.removed} {t.removed}</Tag>
              <Tag>{stats.same} {t.unchanged}</Tag>
            </Space>
          }
        >
          <pre style={{ margin: 0, overflowX: 'auto', fontFamily: 'monospace', fontSize: 13 }}>
            {diff.map((line, idx) => {
              const style = LINE_STYLE[line.type]
              return (
                <div key={idx} style={{ background: style.background, whiteSpace: 'pre-wrap' }}>
                  <Text style={{ userSelect: 'none', opacity: 0.6 }}>{style.prefix}</Text>
                  {line.text === '' ? ' ' : line.text}
                </div>
              )
            })}
          </pre>
        </Card>
      )}
    </Space>
  )
}
