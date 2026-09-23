// Motor 100% client-side de operacoes com matrizes (algebra linear).
// Nao envia dados para lugar nenhum.

const EPS = 1e-9

/**
 * Converte o texto de uma matriz em um array de arrays de numeros.
 * Cada linha do texto e uma linha da matriz; celulas separadas por
 * espaco, virgula, ponto-e-virgula ou tab.
 * @param {string} text
 * @param {number} rows - numero esperado de linhas
 * @param {number} cols - numero esperado de colunas
 * @returns {{ok:boolean, matrix?:number[][], code?:string, expected?:number, actual?:number, line?:number, col?:number, token?:string}}
 */
export function parseMatrix(text, rows, cols) {
  const lines = String(text || '')
    .replace(/\r/g, '')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0)

  if (lines.length !== rows) {
    return { ok: false, code: 'rows', expected: rows, actual: lines.length }
  }

  const matrix = []
  for (let i = 0; i < lines.length; i++) {
    const cells = lines[i].split(/[\s,;\t]+/).filter((c) => c.length > 0)
    if (cells.length !== cols) {
      return { ok: false, code: 'cols', line: i + 1, expected: cols, actual: cells.length }
    }
    const row = []
    for (let j = 0; j < cells.length; j++) {
      const v = Number(cells[j])
      if (!Number.isFinite(v)) {
        return { ok: false, code: 'value', line: i + 1, col: j + 1, token: cells[j] }
      }
      row.push(v)
    }
    matrix.push(row)
  }
  return { ok: true, matrix }
}

export function add(A, B) {
  return A.map((r, i) => r.map((v, j) => v + B[i][j]))
}

export function subtract(A, B) {
  return A.map((r, i) => r.map((v, j) => v - B[i][j]))
}

export function multiply(A, B) {
  const C = Array.from({ length: A.length }, () => Array(B[0].length).fill(0))
  for (let i = 0; i < A.length; i++) {
    for (let j = 0; j < B[0].length; j++) {
      let s = 0
      for (let k = 0; k < B.length; k++) s += A[i][k] * B[k][j]
      C[i][j] = s
    }
  }
  return C
}

export function scalarMultiply(A, s) {
  return A.map((r) => r.map((v) => v * s))
}

export function transpose(A) {
  return A[0].map((_, j) => A.map((r) => r[j]))
}

export function trace(A) {
  return A.reduce((s, r, i) => s + r[i], 0)
}

/**
 * Eliminacao gaussiana com pivotamento parcial. Retorna a matriz
 * escalonada e o numero de trocas de linhas (para o sinal do det).
 */
function gaussianElim(A) {
  const M = A.map((r) => r.slice())
  const n = M.length
  let swaps = 0
  for (let c = 0; c < n; c++) {
    let piv = c
    for (let r = c + 1; r < n; r++) {
      if (Math.abs(M[r][c]) > Math.abs(M[piv][c])) piv = r
    }
    if (Math.abs(M[piv][c]) < EPS) continue
    if (piv !== c) {
      const tmp = M[c]
      M[c] = M[piv]
      M[piv] = tmp
      swaps++
    }
    const pivVal = M[c][c]
    for (let r = c + 1; r < n; r++) {
      const f = M[r][c] / pivVal
      for (let k = c; k < n; k++) M[r][k] -= f * M[c][k]
    }
  }
  return { M, swaps }
}

export function determinant(A) {
  const { M, swaps } = gaussianElim(A)
  let det = swaps % 2 === 0 ? 1 : -1
  for (let i = 0; i < M.length; i++) det *= M[i][i]
  return det
}

export function rank(A) {
  const M = A.map((r) => r.slice())
  const rows = M.length
  const cols = M[0].length
  let r = 0
  for (let c = 0; c < cols && r < rows; c++) {
    let piv = r
    for (let i = r + 1; i < rows; i++) {
      if (Math.abs(M[i][c]) > Math.abs(M[piv][c])) piv = i
    }
    if (Math.abs(M[piv][c]) < EPS) continue
    const tmp = M[r]
    M[r] = M[piv]
    M[piv] = tmp
    const pivVal = M[r][c]
    for (let i = r + 1; i < rows; i++) {
      const f = M[i][c] / pivVal
      for (let k = c; k < cols; k++) M[i][k] -= f * M[r][k]
    }
    r++
  }
  return r
}

/**
 * Inversa por Gauss-Jordan sobre a matriz aumentada [A | I].
 * Retorna null quando A e singular (nao invertivel).
 */
export function inverse(A) {
  const n = A.length
  const M = A.map((r, i) => r.concat(Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))))
  for (let c = 0; c < n; c++) {
    let piv = c
    for (let r = c + 1; r < n; r++) {
      if (Math.abs(M[r][c]) > Math.abs(M[piv][c])) piv = r
    }
    if (Math.abs(M[piv][c]) < EPS) return null
    if (piv !== c) {
      const tmp = M[c]
      M[c] = M[piv]
      M[piv] = tmp
    }
    const pivVal = M[c][c]
    for (let r = 0; r < n; r++) {
      if (r === c) continue
      const f = M[r][c] / pivVal
      for (let k = 0; k < 2 * n; k++) M[r][k] -= f * M[c][k]
    }
  }
  for (let i = 0; i < n; i++) {
    const pivVal = M[i][i]
    for (let k = 0; k < 2 * n; k++) M[i][k] /= pivVal
  }
  return M.map((r) => r.slice(n))
}

/**
 * Formata um numero pra exibicao: corta ruido de ponto flutuante
 * (0.30000000000000004 -> 0.3) e usa notacao cientifica para valores
 * muito grandes ou muito pequenos.
 */
export function formatNumber(x) {
  if (!Number.isFinite(x)) return String(x)
  if (x === 0) return '0'
  const v = Number(x.toPrecision(10))
  if (Math.abs(v) >= 1e7 || (Math.abs(v) > 0 && Math.abs(v) < 1e-6)) return v.toExponential(4)
  return String(v)
}