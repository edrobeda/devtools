/**
 * Calculadora de distância de edição de Levenshtein.
 *
 * Implementação clássica com programação dinâmica: d[i][j] é o menor número
 * de inserções, deleções e substituições para transformar os primeiros i
 * caracteres de `a` nos primeiros j caracteres de `b`.
 */

export const OPERATION = {
  MATCH: 'match',
  SUBSTITUTE: 'substitute',
  INSERT: 'insert',
  DELETE: 'delete',
}

export function buildMatrix(a, b) {
  const m = a.length
  const n = b.length
  const d = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0))

  for (let i = 0; i <= m; i += 1) d[i][0] = i
  for (let j = 0; j <= n; j += 1) d[0][j] = j

  for (let i = 1; i <= m; i += 1) {
    for (let j = 1; j <= n; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      d[i][j] = Math.min(
        d[i - 1][j] + 1,      // deleção
        d[i][j - 1] + 1,      // inserção
        d[i - 1][j - 1] + cost // substituição (ou match se cost === 0)
      )
    }
  }

  return d
}

export function levenshtein(a, b) {
  const matrix = buildMatrix(a, b)
  const distance = matrix[a.length][b.length]
  const operations = getOperations(matrix, a, b)
  return { distance, matrix, operations }
}

export function similarity(a, b) {
  if (a.length === 0 && b.length === 0) return 100
  const { distance } = levenshtein(a, b)
  const maxLen = Math.max(a.length, b.length)
  return ((maxLen - distance) / maxLen) * 100
}

export function getOperations(matrix, a, b) {
  const ops = []
  let i = a.length
  let j = b.length

  while (i > 0 || j > 0) {
    if (i === 0) {
      ops.push({ type: OPERATION.INSERT, char: b[j - 1], index: j - 1 })
      j -= 1
    } else if (j === 0) {
      ops.push({ type: OPERATION.DELETE, char: a[i - 1], index: i - 1 })
      i -= 1
    } else {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      const diag = matrix[i - 1][j - 1] + cost
      const up = matrix[i - 1][j] + 1
      const left = matrix[i][j - 1] + 1
      const min = Math.min(diag, up, left)

      if (min === diag) {
        ops.push({
          type: cost === 0 ? OPERATION.MATCH : OPERATION.SUBSTITUTE,
          from: a[i - 1],
          to: b[j - 1],
          index: i - 1,
        })
        i -= 1
        j -= 1
      } else if (min === up) {
        ops.push({ type: OPERATION.DELETE, char: a[i - 1], index: i - 1 })
        i -= 1
      } else {
        ops.push({ type: OPERATION.INSERT, char: b[j - 1], index: j - 1 })
        j -= 1
      }
    }
  }

  return ops.reverse()
}

export function formatOperations(ops) {
  return ops
    .map((op) => {
      switch (op.type) {
        case OPERATION.MATCH:
          return `${op.from}`
        case OPERATION.SUBSTITUTE:
          return `${op.from}→${op.to}`
        case OPERATION.INSERT:
          return `+${op.char}`
        case OPERATION.DELETE:
          return `-${op.char}`
        default:
          return '?'
      }
    })
    .join(' ')
}

export function countOperations(ops) {
  return ops.reduce(
    (acc, op) => {
      if (op.type === OPERATION.MATCH) acc.matches += 1
      if (op.type === OPERATION.SUBSTITUTE) acc.substitutions += 1
      if (op.type === OPERATION.INSERT) acc.insertions += 1
      if (op.type === OPERATION.DELETE) acc.deletions += 1
      return acc
    },
    { matches: 0, substitutions: 0, insertions: 0, deletions: 0 }
  )
}
