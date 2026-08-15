// Formatador, minificador e validador leve de consultas GraphQL.
// 100% client-side — nenhum dado sai do navegador.
//
// Não é um parser semântico completo: ele tokeniza a query, valida delimitadores
// balanceados e reconstrói o texto com indentação consistente. É suficiente
// para formatar a grande maioria das queries, mutations, subscriptions e
// fragmentos usados no dia a dia.

const PUNCTUATION = new Set(['{', '}', '(', ')', '[', ']', ':', ',', '=', '!', '@', '$', '.', '&'])
const SPREAD = '...'

function isNameStart(ch) {
  return /[a-zA-Z_]/.test(ch)
}

function isNameChar(ch) {
  return /[a-zA-Z0-9_]/.test(ch)
}

function isDigit(ch) {
  return /[0-9]/.test(ch)
}

function isWhitespace(ch) {
  return /\s/.test(ch)
}

export function tokenize(input) {
  const tokens = []
  let i = 0
  let line = 1
  let col = 1

  function advance() {
    if (i < input.length && input[i] === '\n') {
      line++
      col = 1
    } else {
      col++
    }
    i++
  }

  function push(type, value) {
    tokens.push({ type, value, line, col: col - value.length })
  }

  while (i < input.length) {
    const ch = input[i]

    if (isWhitespace(ch)) {
      let value = ''
      while (i < input.length && isWhitespace(input[i])) {
        value += input[i]
        advance()
      }
      push('WHITESPACE', value)
      continue
    }

    if (ch === '#') {
      let value = ''
      while (i < input.length && input[i] !== '\n') {
        value += input[i]
        advance()
      }
      push('COMMENT', value)
      continue
    }

    if (ch === '"' || ch === "'") {
      const quote = ch
      let value = quote
      advance()
      if (input.slice(i, i + 2) === quote + quote) {
        // Block string ("""...""" ou '''...''')
        value += quote + quote
        i += 2
        col += 2
        const end = input.slice(i).indexOf(quote + quote + quote)
        if (end === -1) {
          push('UNTERMINATED_STRING', value + input.slice(i))
          i = input.length
          break
        }
        value += input.slice(i, i + end + 3)
        i += end + 3
        col += end + 3
        push('BLOCK_STRING', value)
      } else {
        while (i < input.length && input[i] !== quote) {
          if (input[i] === '\\') {
            value += input[i]
            advance()
            if (i < input.length) {
              value += input[i]
              advance()
            }
          } else {
            value += input[i]
            advance()
          }
        }
        if (i < input.length && input[i] === quote) {
          value += quote
          advance()
          push('STRING', value)
        } else {
          push('UNTERMINATED_STRING', value)
        }
      }
      continue
    }

    if (isDigit(ch) || (ch === '-' && isDigit(input[i + 1]))) {
      let value = ''
      if (ch === '-') {
        value += ch
        advance()
      }
      while (i < input.length && (isDigit(input[i]) || input[i] === '.')) {
        value += input[i]
        advance()
      }
      push('NUMBER', value)
      continue
    }

    if (isNameStart(ch)) {
      let value = ''
      while (i < input.length && isNameChar(input[i])) {
        value += input[i]
        advance()
      }
      push('NAME', value)
      continue
    }

    if (input.slice(i, i + 3) === SPREAD) {
      push('SPREAD', SPREAD)
      i += 3
      col += 3
      continue
    }

    if (PUNCTUATION.has(ch)) {
      push('PUNCTUATION', ch)
      advance()
      continue
    }

    // Caractere inesperado: avança para não travar
    push('UNKNOWN', ch)
    advance()
  }

  return tokens
}

export function validateGraphql(input) {
  const errors = []
  const tokens = tokenize(input)
  const stack = []

  for (const t of tokens) {
    if (t.type === 'UNTERMINATED_STRING') {
      errors.push({ line: t.line, message: 'Unterminated string literal' })
    }
    if (t.type === 'UNKNOWN') {
      errors.push({ line: t.line, message: `Unexpected character: ${t.value}` })
    }
    if (t.value === '{' || t.value === '(' || t.value === '[') {
      stack.push({ char: t.value, line: t.line })
    }
    if (t.value === '}' || t.value === ')' || t.value === ']') {
      const expected = t.value === '}' ? '{' : t.value === ')' ? '(' : '['
      const last = stack.pop()
      if (!last || last.char !== expected) {
        errors.push({ line: t.line, message: `Unbalanced ${t.value}` })
      }
    }
  }

  while (stack.length) {
    const last = stack.pop()
    errors.push({ line: last.line, message: `Unclosed ${last.char}` })
  }

  return { valid: errors.length === 0, errors, tokens }
}

function isSignificant(token) {
  return token.type !== 'WHITESPACE' && token.type !== 'COMMENT'
}

function findOperations(tokens) {
  const ops = []
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i]
    if (t.type === 'NAME' && /^(query|mutation|subscription|fragment)$/.test(t.value)) {
      const next = tokens.slice(i + 1).find(isSignificant)
      ops.push({ type: t.value, name: next && next.type === 'NAME' ? next.value : null })
    } else if (t.type === 'PUNCTUATION' && t.value === '{' && ops.length === 0) {
      // Query encurtada sem palavra-chave
      ops.push({ type: 'query', name: null })
    }
  }
  return ops
}

export function formatGraphql(input, options = {}) {
  const { indent = 2, lineEnding = '\n' } = options
  const { valid, errors, tokens } = validateGraphql(input)
  if (!valid) {
    return { ok: false, error: errors[0].message, line: errors[0].line, value: input }
  }

  const significant = tokens.filter(isSignificant)
  let output = ''
  let depth = 0
  const spaces = ' '.repeat(indent)

  for (let idx = 0; idx < significant.length; idx++) {
    const t = significant[idx]
    const prev = significant[idx - 1]
    const next = significant[idx + 1]

    if (t.type === 'SPREAD') {
      if (output && !output.endsWith(lineEnding) && !output.endsWith(' ') && !output.endsWith('(')) {
        output += ' '
      }
      output += spaces.repeat(depth) + t.value
      if (next && next.value !== '{' && next.value !== '(' && next.value !== '}' && next.value !== ']') {
        output += lineEnding
      }
      continue
    }

    if (t.value === '{') {
      if (prev && (prev.value === ')' || prev.type === 'NAME' || prev.value === '}' || prev.value === ']')) {
        output += ' ' + t.value
      } else {
        if (output && !output.endsWith(lineEnding)) output += lineEnding
        output += spaces.repeat(depth) + t.value
      }
      depth++
      output += lineEnding
      continue
    }

    if (t.value === '}') {
      depth = Math.max(0, depth - 1)
      output += spaces.repeat(depth) + t.value
      if (next && next.value !== '}' && next.value !== ']' && next.value !== ',' && next.value !== ')') {
        output += lineEnding
      }
      continue
    }

    if (t.value === '(') {
      output += t.value
      continue
    }

    if (t.value === ')') {
      output += t.value
      if (next && next.value === '{') {
        output += ' '
      } else if (next && next.value !== '}' && next.value !== ']' && next.value !== ',') {
        output += lineEnding
      }
      continue
    }

    if (t.value === '[') {
      output += t.value
      continue
    }

    if (t.value === ']') {
      output += t.value
      continue
    }

    if (t.value === ',') {
      output += t.value
      // Vírgula dentro de argumentos: mantém na mesma linha; fora, quebra
      if (next && ![')', ']'].includes(next.value) && (!prev || !['(', '['].includes(prev.value))) {
        const inArgs = depthOfContext(significant, idx) > 0
        if (!inArgs) output += lineEnding
        else output += ' '
      }
      continue
    }

    if (t.type === 'NAME' || t.type === 'STRING' || t.type === 'BLOCK_STRING' || t.type === 'NUMBER') {
      if (output && !output.endsWith(lineEnding) && !output.endsWith(' ') && !output.endsWith('(') && !output.endsWith('[') && !output.endsWith(',')) {
        output += ' '
      }
      output += t.value
      continue
    }

    // Pontuação restante (:, =, !, @, $, ., &)
    if (t.value === ':' && prev && (prev.type === 'NAME' || prev.value === '$')) {
      output += t.value + ' '
    } else if (t.value === ':' && next && next.value === ' ') {
      output += t.value
    } else {
      output += t.value
    }
  }

  // Remove linhas vazias múltiplas e espaços em branco no final
  const cleaned = output
    .split(lineEnding)
    .map((l) => l.replace(/\s+$/, ''))
    .join(lineEnding)
    .replace(new RegExp(`(${lineEnding}){3,}`, 'g'), lineEnding + lineEnding)
    .trim()

  return { ok: true, value: cleaned, operations: findOperations(tokens), tokenCount: tokens.length }
}

// Retorna quantos níveis de argumentos estamos aninhados a partir do índice do token
function depthOfContext(significant, idx) {
  let d = 0
  for (let i = 0; i <= idx; i++) {
    if (significant[i].value === '(') d++
    if (significant[i].value === ')') d = Math.max(0, d - 1)
  }
  return d
}

export function minifyGraphql(input) {
  const { valid, errors, tokens } = validateGraphql(input)
  if (!valid) {
    return { ok: false, error: errors[0].message, line: errors[0].line, value: input }
  }
  const significant = tokens.filter(isSignificant)
  let out = ''
  for (let i = 0; i < significant.length; i++) {
    const t = significant[i]
    const prev = significant[i - 1]

    if (t.value === '}' && prev && prev.value === '{') {
      // {} vazio
      out += '{}'
      continue
    }

    if (prev) {
      const needSpace =
        (prev.type === 'NAME' || prev.type === 'STRING' || prev.type === 'BLOCK_STRING' || prev.type === 'NUMBER') &&
        (t.type === 'NAME' || t.type === 'STRING' || t.type === 'BLOCK_STRING' || t.type === 'NUMBER')
      const needNoSpace =
        prev.value === '(' || t.value === ')' || t.value === ',' || t.value === ':' || prev.value === ':' ||
        t.value === '!' || t.value === ']' || prev.value === '[' || t.value === '{' || prev.value === '{' ||
        t.value === '}' || prev.value === '}'
      if (needSpace) out += ' '
      else if (!needNoSpace && prev.value !== '(') out += ' '
    }

    out += t.value
  }
  return { ok: true, value: out, tokenCount: tokens.length }
}
