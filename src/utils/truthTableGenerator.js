// Gerador de Tabela Verdade — parser e avaliador de expressões booleanas.
// Suporta variáveis (letras), NOT, AND, OR, XOR, IMPLIES e BICONDICIONAL.
// 100% client-side, sem dependências externas.

const OPERATORS = {
  '!': { prec: 5, arity: 1, name: 'NOT', assoc: 'right' },
  '~': { prec: 5, arity: 1, name: 'NOT', assoc: 'right' },
  '&&': { prec: 4, arity: 2, name: 'AND', assoc: 'left' },
  '&': { prec: 4, arity: 2, name: 'AND', assoc: 'left' },
  '||': { prec: 3, arity: 2, name: 'OR', assoc: 'left' },
  '|': { prec: 3, arity: 2, name: 'OR', assoc: 'left' },
  '^': { prec: 3, arity: 2, name: 'XOR', assoc: 'left' },
  '=>': { prec: 2, arity: 2, name: 'IMPLIES', assoc: 'right' },
  '->': { prec: 2, arity: 2, name: 'IMPLIES', assoc: 'right' },
  '<=>': { prec: 1, arity: 2, name: 'IFF', assoc: 'left' },
  '<->': { prec: 1, arity: 2, name: 'IFF', assoc: 'left' },
}

function normalize(input) {
  // Remove espaços e converte símbolos alternativos para os tokens canônicos.
  return input
    .replace(/\s+/g, '')
    .replace(/→/g, '=>')
    .replace(/⇒/g, '=>')
    .replace(/↔/g, '<=>')
    .replace(/⇔/g, '<=>')
    .replace(/¬/g, '!')
    .replace(/∧/g, '&&')
    .replace(/∨/g, '||')
    .replace(/⊕/g, '^')
}

function tokenize(expr) {
  const tokens = []
  let i = 0
  while (i < expr.length) {
    const ch = expr[i]

    // operadores de 3 caracteres
    if (expr.substring(i, i + 3) === '<=>') {
      tokens.push('<=>')
      i += 3
      continue
    }
    if (expr.substring(i, i + 3) === '<->') {
      tokens.push('<=>')
      i += 3
      continue
    }
    // operadores de 2 caracteres
    if (expr.substring(i, i + 2) === '&&' || expr.substring(i, i + 2) === '||' ||
        expr.substring(i, i + 2) === '=>' || expr.substring(i, i + 2) === '->') {
      tokens.push(expr.substring(i, i + 2))
      i += 2
      continue
    }
    // operadores de 1 caractere
    if (ch in OPERATORS || ch === '(' || ch === ')') {
      tokens.push(ch)
      i += 1
      continue
    }
    // variáveis: letras ou underscore
    if (/[a-zA-Z_]/.test(ch)) {
      let j = i
      while (j < expr.length && /[a-zA-Z0-9_]/.test(expr[j])) j += 1
      tokens.push(expr.substring(i, j))
      i = j
      continue
    }
    throw new Error(`Caractere inesperado "${ch}" na posição ${i}`)
  }
  return tokens
}

// Conversão infixa → pós-fixa (shunting-yard) para facilitar avaliação.
function toPostfix(tokens) {
  const output = []
  const stack = []

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]
    if (isVariable(token)) {
      output.push(token)
      continue
    }
    if (token in OPERATORS) {
      const op = OPERATORS[token]
      while (stack.length) {
        const top = stack[stack.length - 1]
        if (!(top in OPERATORS)) break
        const topOp = OPERATORS[top]
        if ((op.assoc === 'left' && op.prec <= topOp.prec) ||
            (op.assoc === 'right' && op.prec < topOp.prec)) {
          output.push(stack.pop())
        } else {
          break
        }
      }
      stack.push(token)
      continue
    }
    if (token === '(') {
      stack.push(token)
      continue
    }
    if (token === ')') {
      let found = false
      while (stack.length) {
        const top = stack.pop()
        if (top === '(') {
          found = true
          break
        }
        output.push(top)
      }
      if (!found) throw new Error('Parêntese fechando sem abertura correspondente')
      continue
    }
    throw new Error(`Token inesperado: ${token}`)
  }

  while (stack.length) {
    const top = stack.pop()
    if (top === '(' || top === ')') throw new Error('Parênteses desbalanceados')
    output.push(top)
  }

  return output
}

function isVariable(token) {
  return token && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(token) && !(token in OPERATORS)
}

function applyOp(op, a, b) {
  switch (op) {
    case '!': return !a
    case '~': return !a
    case '&&': return a && b
    case '&': return a && b
    case '||': return a || b
    case '|': return a || b
    case '^': return a !== b
    case '=>': return !a || b
    case '->': return !a || b
    case '<=>': return a === b
    case '<->': return a === b
    default: throw new Error(`Operador desconhecido: ${op}`)
  }
}

function evaluatePostfix(postfix, values) {
  const stack = []
  for (const token of postfix) {
    if (isVariable(token)) {
      if (!(token in values)) throw new Error(`Variável não definida: ${token}`)
      stack.push(values[token])
    } else if (token in OPERATORS) {
      const op = OPERATORS[token]
      if (op.arity === 1) {
        if (stack.length < 1) throw new Error(`Operador "${token}" sem operando`)
        const a = stack.pop()
        stack.push(applyOp(token, a))
      } else {
        if (stack.length < 2) throw new Error(`Operador "${token}" sem operandos suficientes`)
        const b = stack.pop()
        const a = stack.pop()
        stack.push(applyOp(token, a, b))
      }
    } else {
      throw new Error(`Token inválido na avaliação: ${token}`)
    }
  }
  if (stack.length !== 1) throw new Error('Expressão malformada')
  return stack[0]
}

export function parseExpression(input) {
  const normalized = normalize(input)
  if (!normalized) throw new Error('Digite uma expressão')
  const tokens = tokenize(normalized)
  if (!tokens.length) throw new Error('Expressão vazia')
  const postfix = toPostfix(tokens)

  // Determina variáveis em ordem de aparição.
  const vars = []
  const seen = new Set()
  for (const token of tokens) {
    if (isVariable(token) && !seen.has(token)) {
      seen.add(token)
      vars.push(token)
    }
  }
  if (vars.length === 0) throw new Error('Nenhuma variável encontrada na expressão')
  if (vars.length > 10) throw new Error('Máximo de 10 variáveis suportado')

  return { tokens, postfix, variables: vars }
}

export function generateTruthTable(input) {
  const parsed = parseExpression(input)
  const { postfix, variables } = parsed
  const rows = []
  const total = 1 << variables.length

  for (let i = 0; i < total; i++) {
    const values = {}
    for (let v = 0; v < variables.length; v++) {
      values[variables[v]] = Boolean((i >> (variables.length - 1 - v)) & 1)
    }
    const result = evaluatePostfix(postfix, values)
    rows.push({ values: { ...values }, result })
  }

  return {
    variables,
    rows,
    total,
    expression: normalize(input),
    isTautology: rows.every((r) => r.result),
    isContradiction: rows.every((r) => !r.result),
  }
}

export function formatExpression(input) {
  // Reinsere espaços em volta dos operadores binários para leitura.
  return normalize(input)
    .replace(/<=>/g, ' ⇔ ')
    .replace(/=>/g, ' ⇒ ')
    .replace(/\^/g, ' ⊕ ')
    .replace(/\|\|/g, ' ∨ ')
    .replace(/&&/g, ' ∧ ')
    .replace(/!/g, '¬')
    .trim()
}

export const EXAMPLES = [
  { key: 'and', pt: 'A && B', en: 'A && B', expression: 'A && B' },
  { key: 'or', pt: 'A || B', en: 'A || B', expression: 'A || B' },
  { key: 'xor', pt: 'A ⊕ B', en: 'A ⊕ B', expression: 'A ^ B' },
  { key: 'implies', pt: 'A ⇒ B', en: 'A ⇒ B', expression: 'A => B' },
  { key: 'iff', pt: 'A ⇔ B', en: 'A ⇔ B', expression: 'A <=> B' },
  { key: 'demorgan', pt: '¬(A || B) ⇔ (¬A && ¬B)', en: '¬(A || B) ⇔ (¬A && ¬B)', expression: '!(A || B) <=> (!A && !B)' },
  { key: 'majority', pt: 'Maioria de A, B, C', en: 'Majority of A, B, C', expression: '(A && B) || (A && C) || (B && C)' },
]
