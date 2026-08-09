// ─────────────────────────────────────────────────────────────
// TOML Formatter / Minifier / Validator — 100% client-side.
// Um tokenizer (strings simples/literais/multilinha, comentários)
// + um parser de statements (tabelas, arrays de tabelas, pares
// chave = valor com valores escalares, arrays e inline tables).
// O re-emitidor é independente das posições do texto original,
// então strings, comentários e números nunca são tocados por dentro.
// ─────────────────────────────────────────────────────────────

const KEY_SEGMENT = /^[A-Za-z0-9_-]+$/
const DEC_INT = /^[+-]?(?:0|[1-9](?:_?\d)*)$/
const HEX_INT = /^0x[0-9A-Fa-f](?:_?[0-9A-Fa-f])*$/
const OCT_INT = /^0o[0-7](?:_?[0-7])*$/
const BIN_INT = /^0b[01](?:_?[01])*$/
const FLOAT_RE =
  /^[+-]?(?:(?:\d(?:_?\d)*\.\d(?:_?\d)*(?:[eE][+-]?\d(?:_?\d)*)?)|(?:\d(?:_?\d)*[eE][+-]?\d(?:_?\d)*)|(?:inf|nan))$/
const LOCAL_DATE = /^\d{4}-\d{2}-\d{2}$/
const LOCAL_TIME = /^(?:\d{2}:)?\d{2}:\d{2}(?:\.\d+)?$/
const DATETIME =
  /^\d{4}-\d{2}-\d{2}[Tt ]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:[Zz]|[+-]\d{2}:\d{2})?$/

function isScalar(text) {
  if (text === 'true' || text === 'false') return true
  if (DEC_INT.test(text) || HEX_INT.test(text) || OCT_INT.test(text) || BIN_INT.test(text)) return true
  if (FLOAT_RE.test(text)) return true
  if (LOCAL_DATE.test(text)) return true
  if (LOCAL_TIME.test(text)) return true
  if (DATETIME.test(text)) return true
  return false
}

// caracteres que interrompem uma "palavra" (não fazem parte de valores bare)
const STRUCT = /[\s=\[\]{},"'#]/

// ─── Tokenizer ────────────────────────────────────────────────

export function tokenizeToml(input) {
  const tokens = []
  let i = 0
  const n = input.length
  let line = 1
  let col = 1

  const push = (type, text) => {
    tokens.push({ type, text, line, col })
  }
  const step = (count) => {
    const chunk = input.slice(i, i + count)
    i += count
    for (let k = 0; k < chunk.length; k++) {
      if (chunk[k] === '\n') {
        line++
        col = 1
      } else {
        col++
      }
    }
  }
  const err = (key, l, c) => ({ errorKey: key, line: l, col: c })

  while (i < n) {
    const c = input[i]

    if (c === '\r') {
      step(1)
      continue
    }
    if (c === '\n') {
      push('nl', '\n')
      step(1)
      continue
    }
    if (c === ' ' || c === '\t') {
      step(1)
      continue
    }

    if (c === '#') {
      const start = input.indexOf('\n', i)
      const end = start === -1 ? n : start
      push('comment', input.slice(i, end))
      step(end - i)
      continue
    }

    if (input.startsWith('"""', i)) {
      let j = i + 3
      let closed = false
      while (j < n) {
        if (input[j] === '\\') {
          j += 2
          continue
        }
        if (input.startsWith('"""', j)) {
          closed = true
          j += 3
          break
        }
        j++
      }
      if (!closed) return err('stringMultiline', line, col)
      const l = line
      const c0 = col
      push('str', input.slice(i, j))
      tokens[tokens.length - 1].line = l
      tokens[tokens.length - 1].col = c0
      step(j - i)
      continue
    }

    if (input.startsWith("'''", i)) {
      const end = input.indexOf("'''", i + 3)
      if (end === -1) return err('stringMultiline', line, col)
      const j = end + 3
      const l = line
      const c0 = col
      push('str', input.slice(i, j))
      tokens[tokens.length - 1].line = l
      tokens[tokens.length - 1].col = c0
      step(j - i)
      continue
    }

    if (c === '"' || c === "'") {
      let j = i + 1
      let closed = false
      while (j < n) {
        if (c === '"' && input[j] === '\\') {
          j += 2
          continue
        }
        if (input[j] === c) {
          closed = true
          j++
          break
        }
        if (input[j] === '\n') break
        j++
      }
      if (!closed) return err(c === '"' ? 'stringBasic' : 'stringLiteral', line, col)
      const l = line
      const c0 = col
      push('str', input.slice(i, j))
      tokens[tokens.length - 1].line = l
      tokens[tokens.length - 1].col = c0
      step(j - i)
      continue
    }

    if (c === '=' || c === '[' || c === ']' || c === '{' || c === '}' || c === ',') {
      const typeMap = { '=': 'eq', '[': 'lsb', ']': 'rsb', '{': 'lcb', '}': 'rcb', ',': 'comma' }
      push(typeMap[c], c)
      step(1)
      continue
    }

    // Palavra: qualquer coisa que não é estrutura/aspa/espaço. Inclui '.', ':', '-', '+'.
    let j = i
    while (j < n && !/\s/.test(input[j]) && !STRUCT.test(input[j])) j++
    if (j === i) {
      // caractere desconhecido isolado — não deveria acontecer, mas defende
      return err('invalidChar', line, col)
    }
    const text = input.slice(i, j)
    push('word', text)
    step(j - i)
  }

  return { tokens, errorKey: null }
}

// ─── Parser ────────────────────────────────────────────────────

function fail(token, message) {
  return { ok: false, error: message, line: token ? token.line : 1, col: token ? token.col : 1 }
}

function parseValue(tokens, idx) {
  const t = tokens[idx]
  if (!t) return { err: fail({ line: 1, col: 1 }, 'valueExpected') }

  if (t.type === 'str') return { value: { type: 'str', text: t.text }, next: idx + 1 }

  if (t.type === 'word') {
    if (!isScalar(t.text)) return { err: fail(t, 'invalidValue') }
    return { value: { type: 'scalar', text: t.text }, next: idx + 1 }
  }

  if (t.type === 'lcb') {
    const entries = []
    let i = idx + 1
    let multiline = false
    while (i < tokens.length && tokens[i].type !== 'rcb') {
      const cur = tokens[i]
      if (cur.type === 'comma') {
        i++
        continue
      }
      if (cur.type === 'nl') {
        multiline = true
        i++
        continue
      }
      if (cur.type === 'comment') {
        i++
        continue
      }
      if (cur.type !== 'word' && cur.type !== 'str') return { err: fail(cur, 'badKey') }
      const k = cur
      let j = i + 1
      if (tokens[j] && tokens[j].type === 'eq') {
        const val = parseValue(tokens, j + 1)
        if (val.err) return val
        entries.push({ key: k.text, value: val.value })
        i = val.next
        if (tokens[i] && tokens[i].type === 'comma') i++
        if (tokens[i] && tokens[i].type === 'nl') {
          multiline = true
          i++
        }
      } else {
        return fail(tokens[j], 'missingEqual')
      }
    }
    if (i >= tokens.length) return { err: fail(t, 'unclosedInline') }
    return { value: { type: 'inline', entries, multiline }, next: i + 1 }
  }

  if (t.type === 'lsb') {
    const items = []
    let i = idx + 1
    let multiline = false
    while (i < tokens.length && tokens[i].type !== 'rsb') {
      const cur = tokens[i]
      if (cur.type === 'comma') {
        i++
        continue
      }
      if (cur.type === 'nl') {
        multiline = true
        i++
        continue
      }
      if (cur.type === 'comment') {
        multiline = true
        i++
        continue
      }
      const valRes = parseValue(tokens, i)
      if (valRes.err) return valRes
      items.push(valRes.value)
      i = valRes.next
      if (tokens[i] && (tokens[i].type === 'comma')) i++
      if (tokens[i] && tokens[i].type === 'nl') multiline = true
    }
    if (i >= tokens.length) return { err: fail(t, 'unclosedArray') }
    return { value: { type: 'array', items, multiline }, next: i + 1 }
  }

  return { err: fail(t, 'valueExpected') }
}

function parseStatement(tokens, idx) {
  const t = tokens[idx]

  // Header de tabela: [a.b] ou [[a.b]]
  if (t.type === 'lsb') {
    let isArray = false
    let p = idx
    if (tokens[p + 1] && tokens[p + 1].type === 'lsb') {
      isArray = true
      p++
    }
    p++
    const parts = []
    while (p < tokens.length && tokens[p].type !== 'rsb') {
      const cur = tokens[p]
      if (cur.type === 'word') {
        for (const piece of cur.text.split('.')) {
          if (!KEY_SEGMENT.test(piece)) return fail(cur, 'badTableKey')
        }
        parts.push(cur)
        p++
      } else if (cur.type === 'str') {
        parts.push(cur)
        p++
      } else if (cur.type === 'nl') {
        return fail(cur, 'newlineInHeader')
      } else if (cur.type === 'comment') {
        p++
      } else {
        return fail(cur, 'badTableKey')
      }
    }
    if (p >= tokens.length) return fail(t, 'unclosedHeader')
    if (isArray) {
      if (!(tokens[p + 1] && tokens[p + 1].type === 'rsb')) {
        return fail(tokens[p], 'arrayTableClose')
      }
      p += 2
    } else {
      p += 1
    }
    return {
      ok: true,
      stmt: { type: 'table', isArray, parts },
      idx: p,
    }
  }

  // Chave = valor
  const keyParts = []
  while (idx < tokens.length) {
    const cur = tokens[idx]
    if (cur.type === 'eq') break
    if (cur.type === 'word') {
      for (const piece of cur.text.split('.')) {
        if (!KEY_SEGMENT.test(piece)) return fail(cur, 'badKey')
      }
      keyParts.push(cur.text)
      idx++
    } else if (cur.type === 'str') {
      keyParts.push(cur.text)
      idx++
    } else {
      return fail(cur, 'badKey')
    }
  }
  if (keyParts.length === 0) return fail(t, 'badKey')
  if (idx >= tokens.length) return fail(t, 'missingEqual')
  const key = keyParts.join('.')

  const valRes = parseValue(tokens, idx + 1)
  if (valRes.err) return valRes.err
  const { value, next } = valRes

  let end = next
  let inlineComment = null
  if (end < tokens.length && tokens[end].type === 'comment') {
    inlineComment = tokens[end]
    end++
  }
  return {
    ok: true,
    stmt: { type: 'assign', key, value, inlineComment },
    idx: end,
  }
}

function parseDoc(tokens) {
  const stmts = []
  let idx = 0
  while (idx < tokens.length) {
    const t = tokens[idx]
    if (t.type === 'nl') {
      // marca fim de statement para o tokenizer de comentários
      idx++
      continue
    }
    if (t.type === 'comment') {
      // comentário solto em linha própria
      const next = tokens[idx + 1]
      if (next && next.type === 'nl') {
        stmts.push({ type: 'standaloneComment', text: t.text })
        idx++
        continue
      }
      // comentário vestigial: sozinho no fim do arquivo sem nl seguinte
      const last = stmts.length ? stmts[stmts.length - 1] : null
      if (last && (last.type === 'assign') && !last.inlineComment) {
        last.inlineComment = t
      } else {
        stmts.push({ type: 'standaloneComment', text: t.text })
      }
      idx++
      continue
    }

    const res = parseStatement(tokens, idx)
    if (!res.ok) return res
    if (res.stmt) stmts.push(res.stmt)
    idx = res.idx
  }
  return { ok: true, stmts }
}

// ─── Re-emissão ─────────────────────────────────────────────────

let INDENT_UNIT = '  '

function renderValuePretty(v, depth) {
  const ind = INDENT_UNIT.repeat(depth)
  if (v.type === 'str') return v.text
  if (v.type === 'scalar') return v.text
  if (v.type === 'inline') {
    const parts = v.entries.map((e) => `${e.key} = ${renderValuePretty(e.value, depth + 1)}`)
    return `{ ${parts.join(', ')} }`
  }
  if (v.type === 'array') {
    if (v.multiline) {
      const inner = []
      for (const it of v.items) {
        inner.push(`${ind}${INDENT_UNIT}${renderValuePretty(it, depth + 1)}`)
      }
      return `[\n${inner.join(',\n')}\n${ind}]`
    }
    const parts = v.items.map((it) => renderValuePretty(it, depth + 1))
    return `[${parts.join(', ')}]`
  }
  return ''
}

function renderValueMin(v) {
  if (v.type === 'str') return v.text
  if (v.type === 'scalar') return v.text
  if (v.type === 'inline') {
    const parts = v.entries.map((e) => `${e.key}=${renderValueMin(e.value)}`)
    return `{${parts.join(',')}}`
  }
  if (v.type === 'array') {
    const parts = v.items.map(renderValueMin)
    return `[${parts.join(',')}]`
  }
  return ''
}

function renderStatements(stmts, opts) {
  const mode = opts.mode || 'pretty'

  if (mode === 'min') {
    const lines = []
    for (const s of stmts) {
      if (s.type === 'standaloneComment') {
        if (opts.keepComments) lines.push(s.text.trim())
        continue
      }
      if (s.type === 'table') {
        const inner = s.parts.map((p) => p.text).join('.')
        lines.push(`${s.isArray ? '[[' : '['}${inner}${s.isArray ? ']]' : ']'}`)
        continue
      }
      if (s.type === 'assign') {
        lines.push(`${s.key}=${renderValueMin(s.value)}`)
        continue
      }
    }
    return lines.join('\n')
  }

  const lines = []
  let prevTablePath = null

  for (const s of stmts) {
    if (s.type === 'standaloneComment') {
      // comentário solto: linha própria, sem espaçar demais
      if (lines.length && lines[lines.length - 1] !== '') lines.push('')
      lines.push(s.text.trim())
      prevTablePath = 'comment'
      continue
    }
    if (s.type === 'table') {
      const inner = s.parts.map((p) => p.text).join('.')
      const bracket = `${s.isArray ? '[[' : '['}${inner}${s.isArray ? ']]' : ']'}`
      // linha em branco antes de cada tabela nova (não a primeira nem após
      // uma linha em branco de um comentário já separando)
      const last = lines[lines.length - 1]
      if (last !== '' && lines.length > 0 && inner !== prevTablePath) {
        lines.push('')
      }
      lines.push(bracket)
      prevTablePath = inner
      continue
    }
    if (s.type === 'assign') {
      const base = `${s.key} = ${renderValuePretty(s.value, 0)}`
      lines.push(base)
      if (s.inlineComment) lines.push(`  ${s.inlineComment.text.trim()}`)
      prevTablePath = null
      continue
    }
  }

  // junta mantendo a concatenação limpa (sem fins duplicados)
  let out = lines.join('\n')
  out = out.replace(/\n{3,}/g, '\n\n')
  return out.trim()
}

// ─── API pública ────────────────────────────────────────────────

// Formata (pretty) ou minifica (min) um TOML. Em erro devolve
// { ok:false, error:chave, line, col } — a página traduz as chaves.
export function formatToml(input, opts = {}) {
  INDENT_UNIT = (opts.indent === 4 ? '    ' : '  ')
  const { tokens, errorKey, line, col } = tokenizeToml(input)
  if (errorKey) return { ok: false, error: errorKey, line, col, text: '' }
  const doc = parseDoc(tokens)
  if (!doc.ok) return { ok: false, error: doc.error, line: doc.line, col: doc.col, text: '' }
  const text = renderStatements(doc.stmts, { mode: opts.mode || 'pretty', keepComments: !!opts.keepComments })
  return { ok: true, text, tree: doc.stmts }
}

export function tomlStats(tree, input, output) {
  const enc = new TextEncoder()
  let tables = 0
  let assigns = 0
  let standaloneComments = 0
  let inlineTables = 0
  let arrays = 0
  const walkVal = (v) => {
    if (!v) return
    if (v.type === 'inline') {
      inlineTables++
      v.entries.forEach((e) => walkVal(e.value))
    } else if (v.type === 'array') {
      arrays++
      v.items.forEach(walkVal)
    }
  }
  for (const s of tree || []) {
    if (!s) continue
    if (s.type === 'table') tables++
    else if (s.type === 'assign') {
      assigns++
      walkVal(s.value)
    } else if (s.type === 'standaloneComment') standaloneComments++
  }
  return {
    tables,
    assigns,
    standaloneComments,
    inlineTables,
    arrays,
    bytesIn: enc.encode(input).length,
    bytesOut: enc.encode(output).length,
  }
}