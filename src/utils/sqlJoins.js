// Motor de JOINs SQL 100% client-side.
// Reproduz o comportamento relacional básico de INNER, LEFT, RIGHT,
// FULL OUTER, CROSS e SELF JOIN usando arrays de objetos em memória.

export const JOIN_TYPES = [
  { key: 'inner', labelPt: 'INNER JOIN', labelEn: 'INNER JOIN' },
  { key: 'left', labelPt: 'LEFT JOIN', labelEn: 'LEFT JOIN' },
  { key: 'right', labelPt: 'RIGHT JOIN', labelEn: 'RIGHT JOIN' },
  { key: 'full', labelPt: 'FULL OUTER JOIN', labelEn: 'FULL OUTER JOIN' },
  { key: 'cross', labelPt: 'CROSS JOIN', labelEn: 'CROSS JOIN' },
  { key: 'self', labelPt: 'SELF JOIN', labelEn: 'SELF JOIN' },
]

// Tabelas de exemplo usadas na demonstração visual.
export const DEFAULT_EMPLOYEES = [
  { id: 1, name: 'Alice', department_id: 1, manager_id: null },
  { id: 2, name: 'Bob', department_id: 2, manager_id: 1 },
  { id: 3, name: 'Carol', department_id: 2, manager_id: 1 },
  { id: 4, name: 'Dave', department_id: null, manager_id: 2 },
]

export const DEFAULT_DEPARTMENTS = [
  { id: 1, name: 'Engineering' },
  { id: 2, name: 'Marketing' },
  { id: 3, name: 'Sales' },
]

function matches(aVal, bVal) {
  // SQL: NULL = NULL é UNKNOWN (não faz match).
  if (aVal == null || bVal == null) return false
  return aVal === bVal
}

function getValue(row, key) {
  return row == null ? null : row[key]
}

function cloneWithPrefix(row, prefix) {
  if (row == null) return null
  const out = {}
  for (const [k, v] of Object.entries(row)) {
    out[`${prefix}.${k}`] = v
  }
  return out
}

function merge(leftRow, rightRow, leftPrefix, rightPrefix) {
  return {
    ...cloneWithPrefix(leftRow, leftPrefix),
    ...cloneWithPrefix(rightRow, rightPrefix),
  }
}

export function innerJoin(a, b, leftKey, rightKey) {
  const out = []
  for (const left of a) {
    const aVal = getValue(left, leftKey)
    for (const right of b) {
      const bVal = getValue(right, rightKey)
      if (matches(aVal, bVal)) {
        out.push(merge(left, right, 'e', 'd'))
      }
    }
  }
  return out
}

export function leftJoin(a, b, leftKey, rightKey) {
  const out = []
  for (const left of a) {
    const aVal = getValue(left, leftKey)
    let matched = false
    for (const right of b) {
      const bVal = getValue(right, rightKey)
      if (matches(aVal, bVal)) {
        out.push(merge(left, right, 'e', 'd'))
        matched = true
      }
    }
    if (!matched) {
      out.push(merge(left, null, 'e', 'd'))
    }
  }
  return out
}

export function rightJoin(a, b, leftKey, rightKey) {
  // Implementado como left join invertido para reaproveitar a lógica.
  return leftJoin(b, a, rightKey, leftKey).map((row) => {
    // Trocar os prefixos de volta: o lado direito original vira 'e' e o
    // lado esquerdo original vira 'd'.
    const flipped = {}
    for (const [k, v] of Object.entries(row)) {
      if (k.startsWith('e.')) flipped[`d.${k.slice(2)}`] = v
      else if (k.startsWith('d.')) flipped[`e.${k.slice(2)}`] = v
      else flipped[k] = v
    }
    return flipped
  })
}

export function fullOuterJoin(a, b, leftKey, rightKey) {
  // LEFT JOIN + linhas de B que não casaram com nenhuma de A.
  const left = leftJoin(a, b, leftKey, rightKey)
  const matchedRight = new Set()

  for (const leftRow of left) {
    for (const key of Object.keys(leftRow)) {
      if (key.startsWith('d.')) {
        // Marcar que essa linha de B foi usada.
        // Usamos o índice implícito da tabela B: procuramos o objeto original.
      }
    }
  }

  // Reconstruir índices de B que casaram.
  for (const leftRow of left) {
    for (const [i, right] of b.entries()) {
      let allMatch = true
      for (const k of Object.keys(right)) {
        if (leftRow[`d.${k}`] !== right[k]) {
          allMatch = false
          break
        }
      }
      if (allMatch) matchedRight.add(i)
    }
  }

  const out = [...left]
  for (const [i, right] of b.entries()) {
    if (!matchedRight.has(i)) {
      out.push(merge(null, right, 'e', 'd'))
    }
  }
  return out
}

export function crossJoin(a, b) {
  const out = []
  for (const left of a) {
    for (const right of b) {
      out.push(merge(left, right, 'e', 'd'))
    }
  }
  return out
}

export function selfJoin(rows, childKey, parentKey) {
  const out = []
  for (const child of rows) {
    const childVal = getValue(child, childKey)
    for (const parent of rows) {
      const parentVal = getValue(parent, parentKey)
      if (matches(childVal, parentVal)) {
        out.push(merge(child, parent, 'emp', 'mgr'))
      }
    }
  }
  return out
}

export function executeJoin(type, employees, departments) {
  switch (type) {
    case 'inner':
      return innerJoin(employees, departments, 'department_id', 'id')
    case 'left':
      return leftJoin(employees, departments, 'department_id', 'id')
    case 'right':
      return rightJoin(employees, departments, 'department_id', 'id')
    case 'full':
      return fullOuterJoin(employees, departments, 'department_id', 'id')
    case 'cross':
      return crossJoin(employees, departments)
    case 'self':
      return selfJoin(employees, 'manager_id', 'id')
    default:
      return []
  }
}

export function buildSql(type) {
  switch (type) {
    case 'inner':
      return 'SELECT e.name, d.name\nFROM employees e\nINNER JOIN departments d\n  ON e.department_id = d.id;'
    case 'left':
      return 'SELECT e.name, d.name\nFROM employees e\nLEFT JOIN departments d\n  ON e.department_id = d.id;'
    case 'right':
      return 'SELECT e.name, d.name\nFROM employees e\nRIGHT JOIN departments d\n  ON e.department_id = d.id;'
    case 'full':
      return 'SELECT e.name, d.name\nFROM employees e\nFULL OUTER JOIN departments d\n  ON e.department_id = d.id;'
    case 'cross':
      return 'SELECT e.name, d.name\nFROM employees e\nCROSS JOIN departments d;'
    case 'self':
      return 'SELECT emp.name AS employee, mgr.name AS manager\nFROM employees emp\nINNER JOIN employees mgr\n  ON emp.manager_id = mgr.id;'
    default:
      return ''
  }
}

export function getJoinDescription(type, lang = 'pt') {
  const descriptions = {
    inner: {
      pt: 'Retorna apenas as linhas que possuem correspondência em ambas as tabelas. Registros sem match são descartados dos dois lados.',
      en: 'Returns only rows that have a match in both tables. Unmatched rows from either side are discarded.',
    },
    left: {
      pt: 'Retorna todas as linhas da tabela da esquerda (employees), preenchendo com NULL quando não há correspondência na tabela da direita.',
      en: 'Returns all rows from the left table (employees), filling with NULL when there is no match in the right table.',
    },
    right: {
      pt: 'Retorna todas as linhas da tabela da direita (departments), preenchendo com NULL quando não há correspondência na tabela da esquerda.',
      en: 'Returns all rows from the right table (departments), filling with NULL when there is no match in the left table.',
    },
    full: {
      pt: 'Retorna todas as linhas de ambas as tabelas. Quando há correspondência, combina os dados; quando não há, preenche o lado faltante com NULL.',
      en: 'Returns all rows from both tables. Where they match, data is combined; where they do not, the missing side is filled with NULL.',
    },
    cross: {
      pt: 'Produto cartesiano: cada linha da tabela A é combinada com cada linha da tabela B. Não usa condição ON.',
      en: 'Cartesian product: every row from table A is combined with every row from table B. No ON condition is used.',
    },
    self: {
      pt: 'Uma tabela é unida a ela mesma. Útil para modelar relacionamentos hierárquicos, como funcionário → gerente.',
      en: 'A table is joined to itself. Useful for hierarchical relationships, such as employee → manager.',
    },
  }
  return descriptions[type]?.[lang] || ''
}
