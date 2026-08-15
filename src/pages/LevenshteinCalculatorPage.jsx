import React, { useMemo, useState } from 'react'
import {
  Typography,
  Card,
  Input,
  Space,
  Button,
  Table,
  Tag,
  Alert,
  Collapse,
  Statistic,
  Row,
  Col,
  message,
} from 'antd'
import { CalculatorOutlined, CopyOutlined, SwapOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  levenshtein,
  similarity,
  formatOperations,
  countOperations,
  OPERATION,
} from '../utils/levenshteinCalculator'

const { Title, Paragraph, Text } = Typography
const { Panel } = Collapse
const { TextArea } = Input

const sourceCode = `import {
  levenshtein,
  similarity,
  formatOperations,
  countOperations,
} from '../utils/levenshteinCalculator'

// Distância mínima de edição
const result = levenshtein('kitten', 'sitting')
console.log(result.distance) // 2

// Similaridade percentual
console.log(similarity('kitten', 'sitting')) // ~72.22

// Operações realizadas no alinhamento ótimo
console.log(formatOperations(result.operations))
// "k→s i t t e n +i +n -# g"
`

const translations = {
  pt: {
    title: 'Calculadora de Distância de Edição',
    intro: (
      <>
        Calcule a distância de Levenshtein entre duas strings: o número mínimo de
        inserções, deleções e substituições necessárias para transformar uma
        string na outra. Útil para fuzzy matching, correção ortográfica,
        diff de nomes e agrupamento de dados.
      </>
    ),
    sourceLabel: 'String original (A)',
    targetLabel: 'String alvo (B)',
    sourcePlaceholder: 'Digite a primeira string...',
    targetPlaceholder: 'Digite a segunda string...',
    swap: 'Trocar',
    examples: 'Exemplos',
    example1: 'kitten → sitting',
    example2: 'sábado → domingo',
    example3: 'react → angular',
    distance: 'Distância',
    similarity: 'Similaridade',
    operations: 'Operações no alinhamento',
    matches: 'Matches',
    substitutions: 'Substituições',
    insertions: 'Inserções',
    deletions: 'Deleções',
    matrixTitle: 'Matriz de programação dinâmica',
    matrixTooLarge: 'Matriz omitida porque uma das strings tem mais de {max} caracteres.',
    copyOperations: 'Copiar operações',
    copied: 'Copiado',
    explanationTitle: 'Como funciona?',
    explanation: (
      <>
        A distância de Levenshtein é calculada preenchendo uma matriz onde cada
        célula <Text code>d[i][j]</Text> representa o custo mínimo para transformar os
        primeiros <Text code>i</Text> caracteres de A nos primeiros <Text code>j</Text> caracteres de B.
        <br /><br />
        Transições:
        <ul style={{ marginBottom: 0 }}>
          <li><Text strong>Match/substituição:</Text> mover na diagonal (custo 0 ou 1).</li>
          <li><Text strong>Deleção:</Text> mover para cima (custo 1).</li>
          <li><Text strong>Inserção:</Text> mover para a esquerda (custo 1).</li>
        </ul>
      </>
    ),
    sourceCode: 'Código-fonte do motor',
    resultTitle: 'Resultado',
  },
  en: {
    title: 'Edit Distance Calculator',
    intro: (
      <>
        Calculate the Levenshtein distance between two strings: the minimum
        number of insertions, deletions and substitutions required to turn one
        string into the other. Useful for fuzzy matching, spell checking, name
        diffs and data clustering.
      </>
    ),
    sourceLabel: 'Source string (A)',
    targetLabel: 'Target string (B)',
    sourcePlaceholder: 'Type the first string...',
    targetPlaceholder: 'Type the second string...',
    swap: 'Swap',
    examples: 'Examples',
    example1: 'kitten → sitting',
    example2: 'sábado → domingo',
    example3: 'react → angular',
    distance: 'Distance',
    similarity: 'Similarity',
    operations: 'Alignment operations',
    matches: 'Matches',
    substitutions: 'Substitutions',
    insertions: 'Insertions',
    deletions: 'Deletions',
    matrixTitle: 'Dynamic programming matrix',
    matrixTooLarge: 'Matrix hidden because one of the strings has more than {max} characters.',
    copyOperations: 'Copy operations',
    copied: 'Copied',
    explanationTitle: 'How it works',
    explanation: (
      <>
        The Levenshtein distance is computed by filling a matrix where each cell
        <Text code>d[i][j]</Text> holds the minimum cost to transform the first <Text code>i</Text>
        characters of A into the first <Text code>j</Text> characters of B.
        <br /><br />
        Transitions:
        <ul style={{ marginBottom: 0 }}>
          <li><Text strong>Match/substitution:</Text> move diagonally (cost 0 or 1).</li>
          <li><Text strong>Deletion:</Text> move up (cost 1).</li>
          <li><Text strong>Insertion:</Text> move left (cost 1).</li>
        </ul>
      </>
    ),
    sourceCode: 'Engine source code',
    resultTitle: 'Result',
  },
}

const MAX_MATRIX_SIZE = 15

function getTagColor(type) {
  switch (type) {
    case OPERATION.MATCH:
      return 'green'
    case OPERATION.SUBSTITUTE:
      return 'orange'
    case OPERATION.INSERT:
      return 'blue'
    case OPERATION.DELETE:
      return 'red'
    default:
      return 'default'
  }
}

function OperationTag({ op }) {
  let label
  switch (op.type) {
    case OPERATION.MATCH:
      label = op.from
      break
    case OPERATION.SUBSTITUTE:
      label = `${op.from}→${op.to}`
      break
    case OPERATION.INSERT:
      label = `+${op.char}`
      break
    case OPERATION.DELETE:
      label = `-${op.char}`
      break
    default:
      label = '?'
  }
  return <Tag color={getTagColor(op.type)}>{label}</Tag>
}

export default function LevenshteinCalculatorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [source, setSource] = useState('kitten')
  const [target, setTarget] = useState('sitting')

  const result = useMemo(() => levenshtein(source, target), [source, target])
  const sim = useMemo(() => similarity(source, target), [source, target])
  const counts = useMemo(() => countOperations(result.operations), [result.operations])
  const formattedOps = useMemo(() => formatOperations(result.operations), [result.operations])

  const showMatrix = source.length <= MAX_MATRIX_SIZE && target.length <= MAX_MATRIX_SIZE

  function copyOperationsText() {
    navigator.clipboard.writeText(formattedOps)
    message.success(t.copied)
  }

  function applyExample(a, b) {
    setSource(a)
    setTarget(b)
  }

  const matrixColumns = useMemo(() => {
    if (!showMatrix) return []
    return [
      {
        title: '',
        dataIndex: 'label',
        key: 'label',
        fixed: 'left',
        render: (text) => <Text strong code>{text}</Text>,
      },
      ...Array.from({ length: target.length + 1 }, (_, j) => ({
        title: j === 0 ? '∅' : target[j - 1],
        dataIndex: j,
        key: j,
        align: 'center',
        render: (value, record) => {
          const isPath = record.onPath && record.onPath.includes(j)
          return (
            <Text
              style={{
                fontFamily: 'monospace',
                background: isPath ? '#1890ff22' : 'transparent',
                padding: '2px 6px',
                borderRadius: 4,
              }}
            >
              {value}
            </Text>
          )
        },
      })),
    ]
  }, [target, showMatrix])

  const matrixData = useMemo(() => {
    if (!showMatrix) return []
    const { matrix, operations } = result
    const path = new Set()
    let i = source.length
    let j = target.length
    while (i >= 0 && j >= 0) {
      path.add(`${i},${j}`)
      if (i === 0 && j === 0) break
      if (i === 0) {
        j -= 1
      } else if (j === 0) {
        i -= 1
      } else {
        const cost = source[i - 1] === target[j - 1] ? 0 : 1
        const diag = matrix[i - 1][j - 1] + cost
        const up = matrix[i - 1][j] + 1
        const left = matrix[i][j - 1] + 1
        const min = Math.min(diag, up, left)
        if (min === diag) {
          i -= 1
          j -= 1
        } else if (min === up) {
          i -= 1
        } else {
          j -= 1
        }
      }
    }

    return matrix.map((row, idx) => {
      const label = idx === 0 ? '∅' : source[idx - 1]
      const onPath = row
        .map((_, j) => j)
        .filter((j) => path.has(`${idx},${j}`))
      return { key: idx, label, onPath, ...row }
    })
  }, [result, source, target, showMatrix])

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><CalculatorOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={11}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>{t.sourceLabel}</Text>
              <TextArea
                rows={3}
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder={t.sourcePlaceholder}
              />
            </Space>
          </Col>
          <Col xs={24} md={2} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Button
              icon={<SwapOutlined />}
              onClick={() => { setSource(target); setTarget(source) }}
              title={t.swap}
            />
          </Col>
          <Col xs={24} md={11}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>{t.targetLabel}</Text>
              <TextArea
                rows={3}
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder={t.targetPlaceholder}
              />
            </Space>
          </Col>
        </Row>

        <div style={{ marginTop: 16 }}>
          <Text strong>{t.examples}: </Text>
          <Space size={[8, 8]} wrap>
            <Button size="small" onClick={() => applyExample('kitten', 'sitting')}>{t.example1}</Button>
            <Button size="small" onClick={() => applyExample('sábado', 'domingo')}>{t.example2}</Button>
            <Button size="small" onClick={() => applyExample('react', 'angular')}>{t.example3}</Button>
          </Space>
        </div>
      </Card>

      <Card title={t.resultTitle}>
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={6}>
            <Statistic title={t.distance} value={result.distance} />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic
              title={t.similarity}
              value={sim}
              precision={2}
              suffix="%"
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic title={t.matches} value={counts.matches} />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic title={t.substitutions} value={counts.substitutions} />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic title={t.insertions} value={counts.insertions} />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic title={t.deletions} value={counts.deletions} />
          </Col>
        </Row>

        <div style={{ marginTop: 24 }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Space>
              <Text strong>{t.operations}</Text>
              <Button size="small" icon={<CopyOutlined />} onClick={copyOperationsText}>
                {t.copyOperations}
              </Button>
            </Space>
            <Space size={[4, 8]} wrap>
              {result.operations.map((op, idx) => (
                <OperationTag key={idx} op={op} />
              ))}
            </Space>
          </Space>
        </div>
      </Card>

      {showMatrix ? (
        <Card title={t.matrixTitle}>
          <Table
            dataSource={matrixData}
            columns={matrixColumns}
            pagination={false}
            size="small"
            scroll={{ x: true }}
          />
        </Card>
      ) : (
        <Alert
          type="info"
          showIcon
          message={t.matrixTitle}
          description={t.matrixTooLarge.replace('{max}', String(MAX_MATRIX_SIZE))}
        />
      )}

      <Alert
        type="info"
        showIcon
        message={t.explanationTitle}
        description={t.explanation}
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
