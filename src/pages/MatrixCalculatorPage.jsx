import React, { useMemo, useState } from 'react'
import {
  Typography,
  Card,
  Row,
  Col,
  Select,
  Input,
  Space,
  Button,
  Alert,
  Statistic,
  Tag,
  Divider,
  Collapse,
} from 'antd'
import { CalculatorOutlined, SwapOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  parseMatrix,
  add,
  subtract,
  multiply,
  scalarMultiply,
  transpose,
  determinant,
  inverse,
  trace,
  rank,
  formatNumber,
} from '../utils/matrixCalculator'

const { Title, Paragraph, Text } = Typography
const { Panel } = Collapse

const BINARY_OPS = ['add', 'subtract', 'multiply']
const UNARY_OPS = ['scalar', 'transpose', 'determinant', 'inverse', 'trace', 'rank']

const translations = {
  pt: {
    title: 'Calculadora de Matrizes',
    intro:
      'Operações de álgebra linear em matrizes de até 6×6 — soma, subtração, multiplicação, escalar, transposta, determinante, inversa, traço e posto. Tudo calculado localmente no navegador, nada sai daqui.',
    matrixA: 'Matriz A',
    matrixB: 'Matriz B',
    dimsLabel: 'Dimensões',
    rowsPlaceholder: 'uma linha por linha, valores separados por espaço',
    operation: 'Operação',
    target: 'Matriz-alvo',
    scalarLabel: 'Escalares k',
    result: 'Resultado',
    resultDims: 'Dimensão',
    presets: 'Exemplos rápidos',
    presetSum: 'Soma 2×2',
    presetProduct: 'Produto 2×3 por 3×2',
    presetInverse: 'Inversa 2×2',
    presetDet3: 'Determinante 3×3',
    presetRank4: 'Posto da identidade 4×4',
    swapHint: 'Troca os conteúdos de A e B',
    howTitle: 'Por que usar',
    howText:
      'Matrizes aparecem em transformações gráficas (rotação, escala, projeção), em machine learning, em sistemas de equações e em autômatos. A inversa existe apenas quando o determinante é diferente de zero; matrices "quase singulares" podem gerar números instáveis por causa da aritmética de ponto flutuante.',
    sourceTitle: 'Motor de cálculo',
    sourceIntro: 'Código-fonte do motor, 100% client-side em src/utils/matrixCalculator.js.',
    ops: {
      add: 'A + B (soma)',
      subtract: 'A − B (subtração)',
      multiply: 'A × B (multiplicação)',
      scalar: 'k × (escalar)',
      transpose: 'Transposta (ᵀ)',
      determinant: 'Determinante (det)',
      inverse: 'Inversa (⁻¹)',
      trace: 'Traço (tr)',
      rank: 'Posto (rank)',
    },
    opDesc: {
      add: 'Soma elemento a elemento: (A+B)[i][j] = A[i][j] + B[i][j].',
      subtract: 'Subtrai elemento a elemento: (A−B)[i][j] = A[i][j] − B[i][j].',
      multiply: 'Produto de matrizes: (A×B)[i][j] = Σₖ A[i][k]·B[k][j]. Exige colunas de A = linhas de B.',
      scalar: 'Multiplica cada elemento da matriz-alvo pela constante k.',
      transpose: 'Espelha na diagonal principal: as linhas viram colunas.',
      determinant: 'Valor escalar que indica se a matriz é invertível (det ≠ 0).',
      inverse: 'Matriz M tal que A·M = M·A = I. Existe só quando det ≠ 0.',
      trace: 'Soma dos elementos da diagonal principal.',
      rank: 'Número máximo de linhas (ou colunas) linearmente independentes.',
    },
    msg: {
      parseArows: 'Matriz A: esperava {expected} linha(s), mas encontrou {actual}.',
      parseBrows: 'Matriz B: esperava {expected} linha(s), mas encontrou {actual}.',
      parseAcols: 'Matriz A, linha {line}: esperava {expected} valor(es), mas encontrou {actual}.',
      parseBcols: 'Matriz B, linha {line}: esperava {expected} valor(es), mas encontrou {actual}.',
      parseAvalue: "Matriz A, linha {line}, coluna {col}: '{token}' não é um número.",
      parseBvalue: "Matriz B, linha {line}, coluna {col}: '{token}' não é um número.",
      dimsEqual: 'Para somar/subtrair, A e B precisam ter exatamente as mesmas dimensões.',
      dimsMult: 'Para multiplicar, o número de colunas de A ({colsA}) deve ser igual ao número de linhas de B ({rowsB}).',
      notSquare: 'Essa operação exige uma matriz quadrada (linhas = colunas).',
      singular: 'A matriz é singular (determinante ≈ 0) e não tem inversa.',
    },
  },
  en: {
    title: 'Matrix Calculator',
    intro:
      'Linear algebra operations on matrices up to 6×6 — addition, subtraction, multiplication, scalar, transpose, determinant, inverse, trace and rank. Everything is computed locally in the browser; nothing leaves here.',
    matrixA: 'Matrix A',
    matrixB: 'Matrix B',
    dimsLabel: 'Dimensions',
    rowsPlaceholder: 'one row per line, values separated by spaces',
    operation: 'Operation',
    target: 'Target matrix',
    scalarLabel: 'Scalar k',
    result: 'Result',
    resultDims: 'Dimension',
    presets: 'Quick examples',
    presetSum: 'Sum 2×2',
    presetProduct: 'Product 2×3 by 3×2',
    presetInverse: 'Inverse 2×2',
    presetDet3: 'Determinant 3×3',
    presetRank4: 'Rank of 4×4 identity',
    swapHint: 'Swaps the contents of A and B',
    howTitle: 'Why this matters',
    howText:
      'Matrices show up in graphics transforms (rotation, scaling, projection), machine learning, systems of equations and automata. The inverse only exists when the determinant is non-zero; “almost singular” matrices can produce unstable numbers due to floating-point arithmetic.',
    sourceTitle: 'Calculation engine',
    sourceIntro: 'Engine source code, 100% client-side in src/utils/matrixCalculator.js.',
    ops: {
      add: 'A + B (add)',
      subtract: 'A − B (subtract)',
      multiply: 'A × B (multiply)',
      scalar: 'k × (scalar)',
      transpose: 'Transpose (ᵀ)',
      determinant: 'Determinant (det)',
      inverse: 'Inverse (⁻¹)',
      trace: 'Trace (tr)',
      rank: 'Rank',
    },
    opDesc: {
      add: 'Element-wise addition: (A+B)[i][j] = A[i][j] + B[i][j].',
      subtract: 'Element-wise subtraction: (A−B)[i][j] = A[i][j] − B[i][j].',
      multiply: 'Matrix product: (A×B)[i][j] = Σₖ A[i][k]·B[k][j]. Requires columns of A = rows of B.',
      scalar: 'Multiplies every element of the target matrix by the constant k.',
      transpose: 'Mirrors across the main diagonal: rows become columns.',
      determinant: 'Scalar that tells whether the matrix is invertible (det ≠ 0).',
      inverse: 'Matrix M such that A·M = M·A = I. Only exists when det ≠ 0.',
      trace: 'Sum of the elements on the main diagonal.',
      rank: 'Maximum number of linearly independent rows (or columns).',
    },
    msg: {
      parseArows: 'Matrix A: expected {expected} row(s), found {actual}.',
      parseBrows: 'Matrix B: expected {expected} row(s), found {actual}.',
      parseAcols: 'Matrix A, line {line}: expected {expected} value(s), found {actual}.',
      parseBcols: 'Matrix B, line {line}: expected {expected} value(s), found {actual}.',
      parseAvalue: "Matrix A, line {line}, column {col}: '{token}' is not a number.",
      parseBvalue: "Matrix B, line {line}, column {col}: '{token}' is not a number.",
      dimsEqual: 'To add/subtract, A and B must have exactly the same dimensions.',
      dimsMult: 'To multiply, the number of columns of A ({colsA}) must equal the number of rows of B ({rowsB}).',
      notSquare: 'This operation requires a square matrix (rows = columns).',
      singular: 'The matrix is singular (determinant ≈ 0) and has no inverse.',
    },
  },
}

function dimsOptions() {
  return [1, 2, 3, 4, 5, 6].map((n) => ({ value: n, label: String(n) }))
}

function MatrixGrid({ data }) {
  return (
    <div
      style={{
        display: 'inline-block',
        borderLeft: '3px solid currentColor',
        borderRight: '3px solid currentColor',
        padding: '10px 16px',
        backgroundColor: 'rgba(0,0,0,0.02)',
        borderRadius: 2,
      }}
    >
      <table style={{ borderCollapse: 'collapse' }}>
        <tbody>
          {data.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td
                  key={j}
                  style={{
                    padding: '4px 10px',
                    textAlign: 'center',
                    fontFamily: 'monospace',
                    fontSize: 14,
                    minWidth: 48,
                  }}
                >
                  {formatNumber(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const sourceCode = `// src/utils/matrixCalculator.js (resumo)
const EPS = 1e-9

// "1 2\\n3 4" -> [[1,2],[3,4]]; valida linhas, colunas e numeros
export function parseMatrix(text, rows, cols) {
  const lines = String(text || '').replace(/\\r/g, '')
    .split('\\n').map((l) => l.trim()).filter((l) => l.length > 0)
  if (lines.length !== rows) return { ok: false, code: 'rows' }
  const matrix = []
  for (let i = 0; i < lines.length; i++) {
    const cells = lines[i].split(/[\\s,;\\t]+/).filter((c) => c.length > 0)
    if (cells.length !== cols) return { ok: false, code: 'cols', line: i + 1 }
    const row = cells.map((c) => Number(c))
    if (row.some((v) => !Number.isFinite(v))) return { ok: false, code: 'value', line: i + 1 }
    matrix.push(row)
  }
  return { ok: true, matrix }
}

// Determinante: escalonamento por eliminacao gaussiana com pivotamento
export function determinant(A) {
  const M = A.map((r) => r.slice())
  const n = M.length
  let sign = 1
  for (let c = 0; c < n; c++) {
    let piv = c
    for (let r = c + 1; r < n; r++)
      if (Math.abs(M[r][c]) > Math.abs(M[piv][c])) piv = r
    if (Math.abs(M[piv][c]) < EPS) return 0
    if (piv !== c) { const t = M[c]; M[c] = M[piv]; M[piv] = t; sign = -sign }
    for (let r = c + 1; r < n; r++) {
      const f = M[r][c] / M[c][c]
      for (let k = c; k < n; k++) M[r][k] -= f * M[c][k]
    }
  }
  let det = sign
  for (let i = 0; i < n; i++) det *= M[i][i]
  return det
}

// Inversa por Gauss-Jordan sobre [A | I]; null se singular
export function inverse(A) {
  const n = A.length
  const M = A.map((r, i) => r.concat(Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))))
  for (let c = 0; c < n; c++) {
    let piv = c
    for (let r = c + 1; r < n; r++)
      if (Math.abs(M[r][c]) > Math.abs(M[piv][c])) piv = r
    if (Math.abs(M[piv][c]) < EPS) return null
    if (piv !== c) { const t = M[c]; M[c] = M[piv]; M[piv] = t }
    for (let r = 0; r < n; r++) {
      if (r === c) continue
      const f = M[r][c] / M[c][c]
      for (let k = 0; k < 2 * n; k++) M[r][k] -= f * M[c][k]
    }
  }
  for (let i = 0; i < n; i++)
    for (let k = 0; k < 2 * n; k++) M[i][k] /= M[i][i]
  return M.map((r) => r.slice(n))
}

export function formatNumber(x) {
  const v = Number(x.toPrecision(10))
  if (Math.abs(v) >= 1e7 || (Math.abs(v) > 0 && Math.abs(v) < 1e-6)) return v.toExponential(4)
  return String(v)
}`

export default function MatrixCalculatorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [rowsA, setRowsA] = useState(2)
  const [colsA, setColsA] = useState(2)
  const [textA, setTextA] = useState('1 2\n3 4')

  const [rowsB, setRowsB] = useState(2)
  const [colsB, setColsB] = useState(2)
  const [textB, setTextB] = useState('5 6\n7 8')

  const [op, setOp] = useState('add')
  const [target, setTarget] = useState('A')
  const [scalar, setScalar] = useState(2)

  const parsedA = useMemo(() => parseMatrix(textA, rowsA, colsA), [textA, rowsA, colsA])
  const parsedB = useMemo(() => parseMatrix(textB, rowsB, colsB), [textB, rowsB, colsB])

  const isBinary = BINARY_OPS.includes(op)

  const binaryDisabled = useMemo(
    () => ({
      add: rowsA !== rowsB || colsA !== colsB,
      subtract: rowsA !== rowsB || colsA !== colsB,
      multiply: colsA !== rowsB,
    }),
    [rowsA, colsA, rowsB, colsB]
  )

  const mathResult = useMemo(() => {
    if (!parsedA.ok) {
      return { ok: false, msg: { key: 'parseA', detail: parsedA } }
    }
    if (op === 'add' || op === 'subtract') {
      if (!parsedB.ok) return { ok: false, msg: { key: 'parseB', detail: parsedB } }
      if (rowsA !== rowsB || colsA !== colsB) return { ok: false, msg: { key: 'dimsEqual' } }
      const data = op === 'add' ? add(parsedA.matrix, parsedB.matrix) : subtract(parsedA.matrix, parsedB.matrix)
      return { ok: true, kind: 'matrix', data }
    }
    if (op === 'multiply') {
      if (!parsedB.ok) return { ok: false, msg: { key: 'parseB', detail: parsedB } }
      if (colsA !== rowsB) return { ok: false, msg: { key: 'dimsMult', colsA, rowsB } }
      return { ok: true, kind: 'matrix', data: multiply(parsedA.matrix, parsedB.matrix) }
    }
    const tgt = target === 'A' ? parsedA : parsedB
    if (!tgt.ok) return { ok: false, msg: { key: target === 'A' ? 'parseA' : 'parseB', detail: tgt } }
    const M = tgt.matrix
    if (op === 'scalar') return { ok: true, kind: 'matrix', data: scalarMultiply(M, scalar) }
    if (op === 'transpose') return { ok: true, kind: 'matrix', data: transpose(M) }
    if (M.length !== M[0].length) return { ok: false, msg: { key: 'notSquare' } }
    if (op === 'determinant') return { ok: true, kind: 'scalar', data: determinant(M) }
    if (op === 'inverse') {
      const inv = inverse(M)
      if (!inv) return { ok: false, msg: { key: 'singular' } }
      return { ok: true, kind: 'matrix', data: inv }
    }
    if (op === 'trace') return { ok: true, kind: 'scalar', data: trace(M) }
    return { ok: true, kind: 'scalar', data: rank(M) }
  }, [parsedA, parsedB, rowsA, colsA, rowsB, colsB, op, target, scalar])

  const errorText = useMemo(() => {
    if (mathResult.ok) return null
    const m = mathResult.msg
    const d = m.detail || {}
    if (m.key === 'parseA' || m.key === 'parseB') {
      const name = m.key === 'parseA' ? 'A' : 'B'
      const suffix = d.code === 'rows' ? 'rows' : d.code === 'cols' ? 'cols' : 'value'
      let tmpl = t.msg[`parse${name}${suffix}`]
      if (d.code === 'rows') tmpl = tmpl.replace('{expected}', String(d.expected)).replace('{actual}', String(d.actual))
      if (d.code === 'cols') tmpl = tmpl.replace('{line}', String(d.line)).replace('{expected}', String(d.expected)).replace('{actual}', String(d.actual))
      if (d.code === 'value') tmpl = tmpl.replace('{line}', String(d.line)).replace('{col}', String(d.col)).replace('{token}', d.token)
      return tmpl
    }
    if (m.key === 'dimsMult') {
      return t.msg.dimsMult.replace('{colsA}', String(m.colsA)).replace('{rowsB}', String(m.rowsB))
    }
    return t.msg[m.key]
  }, [mathResult, t.msg])

  const swap = () => {
    setTextA(textB)
    setTextB(textA)
    setRowsA(rowsB)
    setColsA(colsB)
    setRowsB(rowsA)
    setColsB(colsA)
  }

  const applyPreset = (p) => {
    setRowsA(p.rowsA)
    setColsA(p.colsA)
    setTextA(p.textA)
    setRowsB(p.rowsB)
    setColsB(p.colsB)
    setTextB(p.textB)
    setOp(p.op)
    setTarget(p.target || 'A')
  }

  const presets = [
    { key: 'sum', label: t.presetSum, rowsA: 2, colsA: 2, textA: '1 2\n3 4', rowsB: 2, colsB: 2, textB: '6 7\n8 9', op: 'add' },
    { key: 'product', label: t.presetProduct, rowsA: 2, colsA: 3, textA: '1 2 3\n4 5 6', rowsB: 3, colsB: 2, textB: '7 8\n9 10\n11 12', op: 'multiply' },
    { key: 'inverse', label: t.presetInverse, rowsA: 2, colsA: 2, textA: '4 7\n2 6', rowsB: 2, colsB: 2, textB: '5 6\n7 8', op: 'inverse', target: 'A' },
    { key: 'det3', label: t.presetDet3, rowsA: 3, colsA: 3, textA: '1 2 3\n4 5 6\n7 8 10', rowsB: 2, colsB: 2, textB: '5 6\n7 8', op: 'determinant', target: 'A' },
    { key: 'rank4', label: t.presetRank4, rowsA: 4, colsA: 4, textA: '1 0 0 0\n0 1 0 0\n0 0 1 0\n0 0 0 1', rowsB: 2, colsB: 2, textB: '5 6\n7 8', op: 'rank', target: 'A' },
  ]

  const opOptions = [
    { value: 'add', label: t.ops.add, disabled: binaryDisabled.add },
    { value: 'subtract', label: t.ops.subtract, disabled: binaryDisabled.subtract },
    { value: 'multiply', label: t.ops.multiply, disabled: binaryDisabled.multiply },
    { value: 'scalar', label: t.ops.scalar },
    { value: 'transpose', label: t.ops.transpose },
    { value: 'determinant', label: t.ops.determinant },
    { value: 'inverse', label: t.ops.inverse },
    { value: 'trace', label: t.ops.trace },
    { value: 'rank', label: t.ops.rank },
  ]

  const renderMatrixInput = (name, rows, cols, setRows, setCols, text, setText, parsed) => (
    <Card
      title={name}
      size="small"
      extra={
        <Space size="small">
          <Text type="secondary">{t.dimsLabel}</Text>
          <Select size="small" style={{ width: 56 }} value={rows} options={dimsOptions()} onChange={setRows} />
          <Text type="secondary">×</Text>
          <Select size="small" style={{ width: 56 }} value={cols} options={dimsOptions()} onChange={setCols} />
        </Space>
      }
    >
      <Input.TextArea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={t.rowsPlaceholder}
        rows={Math.min(6, Math.max(2, rows))}
        style={{ fontFamily: 'monospace' }}
        status={parsed.ok ? '' : 'error'}
      />
    </Card>
  )

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      <Title level={2}>
        <CalculatorOutlined style={{ marginRight: 12 }} />
        {t.title}
      </Title>
      <Paragraph>{t.intro}</Paragraph>

      <Alert
        type="info"
        showIcon
        message={t.howTitle}
        description={t.howText}
        style={{ marginBottom: 16 }}
      />

      <Row gutter={[16, 16]} align="stretch">
        <Col xs={24} md={11}>
          {renderMatrixInput(t.matrixA, rowsA, colsA, setRowsA, setColsA, textA, setTextA, parsedA)}
        </Col>
        <Col xs={24} md={2} style={{ display: 'flex', alignItems: 'stretch', justifyContent: 'center' }}>
          <Button
            icon={<SwapOutlined />}
            title={t.swapHint}
            aria-label={t.swapHint}
            style={{ height: '100%', minHeight: 40 }}
            onClick={swap}
          />
        </Col>
        <Col xs={24} md={11}>
          {renderMatrixInput(t.matrixB, rowsB, colsB, setRowsB, setColsB, textB, setTextB, parsedB)}
        </Col>
      </Row>

      <Card style={{ marginTop: 16 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={8}>
            <Text strong>{t.operation}</Text>
            <Select
              style={{ width: '100%', marginTop: 4 }}
              value={op}
              options={opOptions}
              onChange={setOp}
            />
            <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
              {t.opDesc[op]}
            </Text>
          </Col>
          {isBinary ? (
            <Col xs={24} md={6}>
              <Text type="secondary">
                A = {rowsA}×{colsA} · B = {rowsB}×{colsB}
              </Text>
            </Col>
          ) : (
            <Col xs={24} md={6}>
              <Text strong>{t.target}</Text>
              <Select
                style={{ width: '100%', marginTop: 4 }}
                value={target}
                options={[
                  { value: 'A', label: t.matrixA },
                  { value: 'B', label: t.matrixB },
                ]}
                onChange={setTarget}
              />
            </Col>
          )}
          {op === 'scalar' && (
            <Col xs={24} md={6}>
              <Text strong>{t.scalarLabel}</Text>
              <Input
                type="number"
                step="any"
                style={{ width: '100%', marginTop: 4, fontFamily: 'monospace' }}
                value={String(scalar)}
                onChange={(e) => setScalar(e.target.value === '' ? 0 : Number(e.target.value))}
              />
            </Col>
          )}
          <Col xs={24} md={isBinary ? 10 : 6}>
            <Space style={{ marginTop: 4 }} wrap>
              <Text type="secondary">{t.presets}:</Text>
              {presets.map((p) => (
                <Button key={p.key} size="small" onClick={() => applyPreset(p)}>
                  {p.label}
                </Button>
              ))}
            </Space>
          </Col>
        </Row>
      </Card>

      <Card title={t.result} style={{ marginTop: 16 }}>
        {errorText ? (
          <Alert type="error" showIcon message={errorText} />
        ) : mathResult.ok && mathResult.kind === 'matrix' ? (
          <Space direction="vertical" size="small">
            <Tag color="geekblue">
              {t.resultDims}: {mathResult.data.length} × {mathResult.data[0].length}
            </Tag>
            <MatrixGrid data={mathResult.data} />
          </Space>
        ) : (
          <Space direction="vertical" size="small">
            <Tag color="geekblue">{t.ops[op]}</Tag>
            <Statistic value={formatNumber(mathResult.data)} />
          </Space>
        )}
        <Divider style={{ margin: '16px 0' }} />
        <Text type="secondary">{t.opDesc[op]}</Text>
      </Card>

      <Collapse style={{ marginTop: 24 }}>
        <Panel header={t.sourceTitle} key="source">
          <Paragraph>{t.sourceIntro}</Paragraph>
          <pre style={{ background: '#f6ffed', padding: 16, borderRadius: 8, overflow: 'auto' }}>
            <code>{sourceCode}</code>
          </pre>
        </Panel>
      </Collapse>
    </div>
  )
}