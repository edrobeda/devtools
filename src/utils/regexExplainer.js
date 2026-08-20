// Explicador de regex — parseia uma expressão regular no dialeto JavaScript
// (ECMAScript) e devolve uma lista de "partes" (tokens) com tipo e dados
// estruturados, pra página poder traduzir cada pedaço pra linguagem natural.
// 100% client-side, sem depender de API externa.
//
// As descrições humanas ficam na página (bilíngue PT/EN); este motor é
// neutro de idioma e devolve apenas { type, text, depth, data }.

// ---------------------------------------------------------------- parseRegex

export function parseRegex(pattern) {
  const parts = []
  let depth = 0
  let i = 0
  const n = pattern.length

  const isAtom = (p) =>
    p &&
    ['literal', 'class', 'shorthand', 'escape', 'unicodeProp', 'backref', 'dot', 'groupEnd'].includes(
      p.type
    )

  while (i < n) {
    const c = pattern[i]

    if (c === '\\') {
      const r = parseEscape(pattern, i)
      if (r.error) {
        parts.push({ type: 'error', text: r.text, data: { message: r.error }, depth })
        i = r.end
        continue
      }
      const part = r.part
      part.depth = depth
      parts.push(part)
      i = r.end
    } else if (c === '[') {
      const r = parseClass(pattern, i)
      parts.push({ type: 'class', text: r.text, data: r.data, depth, unclosed: r.unclosed })
      i = r.end
    } else if (c === '(') {
      const r = parseGroupStart(pattern, i)
      if (r.comment) {
        parts.push({ type: 'group', text: r.text, data: { kind: 'comment' }, depth })
        i = r.end
        continue
      }
      parts.push({
        type: 'group',
        text: r.text,
        data: { kind: r.kind, name: r.name },
        depth,
        unclosed: r.unclosed,
      })
      if (!r.unclosed) depth++
      i = r.end
    } else if (c === ')') {
      parts.push({ type: 'groupEnd', text: ')', depth })
      if (depth > 0) depth--
      i++
    } else if (c === '|') {
      parts.push({ type: 'alternation', text: '|', depth })
      i++
    } else if (c === '^') {
      parts.push({ type: 'anchor', text: '^', data: { kind: 'start' }, depth })
      i++
    } else if (c === '$') {
      parts.push({ type: 'anchor', text: '$', data: { kind: 'end' }, depth })
      i++
    } else if (c === '.') {
      parts.push({ type: 'dot', text: '.', depth })
      i++
    } else if (c === '*' || c === '+' || c === '?' || c === '{') {
      const q = parseQuantifier(pattern, i)
      if (q && isAtom(parts[parts.length - 1])) {
        parts.push({ type: 'quantifier', text: q.text, data: q.data, depth })
        i = q.end
      } else if (c === '{') {
        // { no lugar inválido: trata como literal (pode ser texto comum)
        let j = i + 1
        while (j < n && pattern[j] !== '}') j++
        if (j < n) {
          parts.push({ type: 'literal', text: pattern.slice(i, j + 1), depth })
          i = j + 1
        } else {
          parts.push({ type: 'literal', text: '{', depth })
          i++
        }
      } else {
        // * + ? sem átomo antes: literal
        parts.push({ type: 'literal', text: c, depth })
        i++
      }
    } else {
      parts.push({ type: 'literal', text: c, depth })
      i++
    }
  }

  return { parts }
}

// ---------------------------------------------------------------- parseEscape

function parseEscape(pattern, i) {
  const n = pattern.length
  const start = i
  i++ // consome a barra invertida
  if (i >= n) return { text: '\\', end: n, error: 'dangling backslash' }
  const ch = pattern[i]

  // classes curtas \d \D \w \W \s \S
  if (/[dDwWsS]/.test(ch)) {
    return {
      text: pattern.slice(start, i + 1),
      end: i + 1,
      part: {
        type: 'shorthand',
        text: pattern.slice(start, i + 1),
        data: { name: '\\' + ch, negated: ch === ch.toUpperCase() },
      },
    }
  }

  // âncoras \b \B
  if (ch === 'b' || ch === 'B') {
    return {
      text: pattern.slice(start, i + 1),
      end: i + 1,
      part: { type: 'anchor', text: pattern.slice(start, i + 1), data: { kind: ch === 'b' ? 'word' : 'nonword' } },
    }
  }

  // escapes de caracteres comuns
  if ('nrtfvae0'.includes(ch)) {
    return {
      text: pattern.slice(start, i + 1),
      end: i + 1,
      part: { type: 'escape', text: pattern.slice(start, i + 1), data: { name: '\\' + ch } },
    }
  }

  // \xHH
  if (ch === 'x') {
    const hex = pattern.slice(i + 1, i + 3)
    if (/^[0-9a-fA-F]{2}$/.test(hex)) {
      return {
        text: pattern.slice(start, i + 3),
        end: i + 3,
        part: { type: 'escape', text: pattern.slice(start, i + 3), data: { name: '\\xHH', value: hex } },
      }
    }
    return { text: '\\x', end: i + 1, part: { type: 'escape', text: '\\x', data: { name: '\\x' } } }
  }

  // \uHHHH e \u{...}
  if (ch === 'u') {
    if (pattern[i + 1] === '{') {
      const close = pattern.indexOf('}', i + 2)
      if (close !== -1) {
        const hex = pattern.slice(i + 2, close)
        if (/^[0-9a-fA-F]{1,6}$/.test(hex)) {
          return {
            text: pattern.slice(start, close + 1),
            end: close + 1,
            part: { type: 'escape', text: pattern.slice(start, close + 1), data: { name: '\\u{...}', value: hex } },
          }
        }
      }
    }
    const hex = pattern.slice(i + 1, i + 5)
    if (/^[0-9a-fA-F]{4}$/.test(hex)) {
      return {
        text: pattern.slice(start, i + 5),
        end: i + 5,
        part: { type: 'escape', text: pattern.slice(start, i + 5), data: { name: '\\uHHHH', value: hex } },
      }
    }
    return { text: '\\u', end: i + 1, part: { type: 'escape', text: '\\u', data: { name: '\\u' } } }
  }

  // \p{...} / \P{...} (propriedade Unicode)
  if (ch === 'p' || ch === 'P') {
    if (pattern[i + 1] === '{') {
      const close = pattern.indexOf('}', i + 2)
      if (close !== -1) {
        const name = pattern.slice(i + 2, close)
        return {
          text: pattern.slice(start, close + 1),
          end: close + 1,
          part: { type: 'unicodeProp', text: pattern.slice(start, close + 1), data: { name, negated: ch === 'P' } },
        }
      }
    }
    return { text: '\\' + ch, end: i + 1, part: { type: 'error', text: '\\' + ch, data: { message: '\\p precisa de {..}' } } }
  }

  // \cX (controle)
  if (ch === 'c') {
    if (/[a-zA-Z]/.test(pattern[i + 1] || '')) {
      return {
        text: pattern.slice(start, i + 2),
        end: i + 2,
        part: { type: 'escape', text: pattern.slice(start, i + 2), data: { name: '\\cX' } },
      }
    }
    return { text: '\\c', end: i + 1, part: { type: 'escape', text: '\\c', data: { name: '\\c' } } }
  }

  // \k<name> (backreference nomeada)
  if (ch === 'k') {
    if (pattern[i + 1] === '<') {
      const close = pattern.indexOf('>', i + 2)
      if (close !== -1) {
        const name = pattern.slice(i + 2, close)
        return {
          text: pattern.slice(start, close + 1),
          end: close + 1,
          part: { type: 'backref', text: pattern.slice(start, close + 1), data: { name, named: true } },
        }
      }
    }
    return { text: '\\k', end: i + 1, part: { type: 'error', text: '\\k', data: { message: '\\k<name> precisa de um nome' } } }
  }

  // \1 .. \9 (backreference numérica)
  if (/[1-9]/.test(ch)) {
    return {
      text: pattern.slice(start, i + 1),
      end: i + 1,
      part: { type: 'backref', text: pattern.slice(start, i + 1), data: { name: pattern.slice(start, i + 1) } },
    }
  }

  // qualquer outra coisa: literal escapado (\., \*, \\, \( ...)
  return {
    text: pattern.slice(start, i + 1),
    end: i + 1,
    part: { type: 'literal', text: pattern.slice(start, i + 1), data: { escaped: true } },
  }
}

// ---------------------------------------------------------------- parseClass

function parseClass(pattern, i) {
  const n = pattern.length
  const start = i
  let j = i + 1
  let negated = false
  if (pattern[j] === '^') {
    negated = true
    j++
  }
  const ranges = [] // [inicio, fim]
  const singles = []
  const shorthands = []
  let closed = false

  while (j < n && !closed) {
    const c = pattern[j]
    // primeiro ']' depois de '[' (ou '[^') é literal membro; o seguinte fecha
    const minJ = i + (negated ? 2 : 1)
    if (c === ']' && j > minJ) {
      closed = true
      j++
      break
    }
    if (c === '\\') {
      const e = pattern[j + 1]
      if (/[dDwWsS]/.test(e || '')) {
        shorthands.push('\\' + e)
        j += 2
        continue
      }
      if (e === 'b') {
        shorthands.push('\\b')
        j += 2
        continue
      }
      if ('nrtfvae0'.includes(e || '')) {
        singles.push('\\' + e)
        j += 2
        continue
      }
      singles.push('\\' + (e == null ? '' : e))
      j += 2
      continue
    }
    // intervalo a-z
    if (pattern[j + 1] === '-' && pattern[j + 2] !== undefined && pattern[j + 2] !== ']') {
      ranges.push([c, pattern[j + 2]])
      j += 3
      continue
    }
    singles.push(c)
    j++
  }

  return {
    text: pattern.slice(start, j),
    end: j,
    data: { negated, ranges, singles, shorthands },
    unclosed: !closed,
  }
}

// ------------------------------------------------------------- parseGroupStart

function parseGroupStart(pattern, i) {
  const n = pattern.length
  const start = i
  if (pattern[i + 1] !== '?') {
    return { kind: 'capturing', text: '(', end: i + 1 }
  }
  const c2 = pattern[i + 2]
  if (c2 === ':') return { kind: 'noncapturing', text: '(?:', end: i + 3 }
  if (c2 === '=') return { kind: 'lookahead', text: '(?=', end: i + 3 }
  if (c2 === '!') return { kind: 'negLookahead', text: '(?!', end: i + 3 }
  if (c2 === '<') {
    const c3 = pattern[i + 3]
    if (c3 === '=') return { kind: 'lookbehind', text: '(?<=', end: i + 4 }
    if (c3 === '!') return { kind: 'negLookbehind', text: '(?<!', end: i + 4 }
    const close = pattern.indexOf('>', i + 3)
    if (close !== -1) {
      return {
        kind: 'named',
        text: pattern.slice(start, close + 1),
        name: pattern.slice(i + 3, close),
        end: close + 1,
      }
    }
    return { kind: 'named', text: pattern.slice(start), name: '', end: n, unclosed: true }
  }
  if (c2 === '#') {
    const close = pattern.indexOf(')', i + 3)
    const end = close === -1 ? n : close + 1
    return { kind: 'comment', text: pattern.slice(start, end), comment: true, end }
  }
  return { kind: 'unknown', text: '(?', end: i + 2 }
}

// ------------------------------------------------------------ parseQuantifier

function parseQuantifier(pattern, i) {
  const n = pattern.length
  const c = pattern[i]
  let data
  let text

  if (c === '*') {
    data = { min: 0, max: Infinity }
    text = '*'
  } else if (c === '+') {
    data = { min: 1, max: Infinity }
    text = '+'
  } else if (c === '?') {
    data = { min: 0, max: 1 }
    text = '?'
  } else if (c === '{') {
    const close = pattern.indexOf('}', i + 1)
    if (close === -1) return null
    const body = pattern.slice(i + 1, close)
    const m = /^(\d+)(?:,(\d*))?$/.exec(body)
    if (!m) return null
    const min = parseInt(m[1], 10)
    let max
    if (m[2] === undefined) max = min
    else if (m[2] === '') max = Infinity
    else max = parseInt(m[2], 10)
    if (max < min) return null
    data = { min, max }
    text = pattern.slice(i, close + 1)
  } else {
    return null
  }

  // sufixo lazy/possessive: *? *+ {n,m}? ...
  let end = i + text.length
  if (pattern[end] === '?') {
    data.lazy = true
    end++
  } else if (pattern[end] === '+') {
    data.possessive = true
    end++
  }
  return { text: pattern.slice(i, end), data, end }
}

// -------------------------------------------------------------- findMatches

// Compila o padrão com as flags dadas (garantindo 'g' pra matchAll) e lista
// as correspondências com índice, grupos e grupos nomeados. Retorna error em
// caso de regex inválida, pra página exibir um alerta.
export function findMatches(pattern, flags, text) {
  if (!pattern) return { matches: [], error: null }
  let flagStr = flags || ''
  if (!flagStr.includes('g')) flagStr += 'g'
  let regex
  try {
    regex = new RegExp(pattern, flagStr)
  } catch (err) {
    return { matches: [], error: err.message }
  }
  if (!text) return { matches: [], error: null }
  try {
    const matches = [...text.matchAll(regex)].map((m) => ({
      text: m[0],
      index: m.index,
      groups: m.slice(1).map((g) => (g === undefined ? null : g)),
      named: m.groups && Object.keys(m.groups).length ? { ...m.groups } : null,
    }))
    return { matches, error: null }
  } catch (err) {
    return { matches: [], error: err.message }
  }
}

// Compila sem exigir texto — útil só pra validar o padrão.
export function tryCompile(pattern, flags) {
  if (!pattern) return { regex: null, error: null }
  try {
    return { regex: new RegExp(pattern, flags || ''), error: null }
  } catch (err) {
    return { regex: null, error: err.message }
  }
}
