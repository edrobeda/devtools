// ─────────────────────────────────────────────────────────────
// YAML Formatter / Minifier / Validator — 100% client-side.
// Parser próprio e simplificado, à base de indentação (o mesmo
// modelo do conversor de configs), que cobre o dia a dia: mapas e
// sequências em bloco, aninhamento, coleções em fluxo [ ] / { },
// strings com aspas e block scalars (| >). Detecta os erros mais
// comuns com posição (linha/coluna): tab na indentação, coleção
// de fluxo sem fechamento, indentação órfã e marcadores de
// documento no meio do arquivo. O re-emitidor reconstrói a árvore
// do zero, então a saída sai limpa mesmo com entrada bagunçada.
// ─────────────────────────────────────────────────────────────

class YamlError extends Error {
  constructor(key, line) {
    super(key)
    this.key = key
    this.line = line
    this.col = 1
  }
}

function makeErr(key, line, col) {
  return { ok: false, error: key, line, col }
}

function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v)
}

function isScalar(v) {
  return v === null || typeof v !== 'object'
}

function isSeqItem(content) {
  return /^-(?:\s|$)/.test(content.trimStart())
}

// ─── Helpers de string (mesmos critérios do configConverter) ──

function yamlNeedsQuotes(s) {
  if (typeof s !== 'string') return false
  if (s === '') return true
  if (/^\s|\s$/.test(s)) return true
  if (/[\x00-\x08\x0A-\x1F\x7F]/.test(s)) return true
  if (s.includes('\n')) return true
  if (/^[\-\?:,\[\]{}#&*!|>'"%@`]/.test(s)) return true
  if (/#(\s|$)|:(\s|$)/.test(s)) return true
  if (/^[-+]?[0-9]/.test(s)) return true
  if (/^(true|True|TRUE|false|False|FALSE|null|Null|NULL|~|yes|Yes|YES|no|No|NO|on|On|ON|off|Off|OFF)$/.test(s)) return true
  return false
}

// Nós também protegemos valores que, no formato bloco, usariam um
// caractere de coleção em fluxo (vimariam ambíguos na releitura).
function yamlQuote(s) {
  return yamlNeedsQuotes(s) || /[\[\]{},]/.test(s) ? JSON.stringify(s) : s
}

function yamlScalar(v) {
  if (v === null) return 'null'
  if (typeof v === 'boolean') return v ? 'true' : 'false'
  if (typeof v === 'number') {
    const s = String(v)
    if (!Number.isFinite(v)) return JSON.stringify(s)
    return /^[0-9.eE+-]+$/.test(s) ? s : JSON.stringify(s)
  }
  return yamlQuote(v)
}

function scalarKey(k) {
  return yamlQuote(String(k))
}

function unquoteYaml(s) {
  s = s.trim()
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    const q = s[0]
    const inner = s.slice(1, -1)
    if (q === "'") return inner.replace(/''/g, "'")
    return inner
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '\t')
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\')
  }
  return s
}

function parseYamlScalar(s) {
  s = s.trim()
  if (s === '' || s === '~' || s === 'null' || s === 'Null' || s === 'NULL') return null
  if (/^(true|True|TRUE|yes|Yes|YES|on|On|ON)$/.test(s)) return true
  if (/^(false|False|FALSE|no|No|NO|off|Off|OFF)$/.test(s)) return false
  if (/^[-+]?\d+$/.test(s)) return Number(s)
  if (/^[-+]?(\d+\.\d*|\.\d+|\d+)([eE][-+]?\d+)?$/.test(s)) return Number(s)
  return unquoteYaml(s)
}

function findUnquotedColon(s) {
  let inQuotes = false
  let quoteChar = null
  for (let i = 0; i < s.length; i++) {
    const c = s[i]
    if (inQuotes) {
      if (c === quoteChar && s[i - 1] !== '\\') inQuotes = false
    } else if (c === '"' || c === "'") {
      inQuotes = true
      quoteChar = c
    } else if (c === ':') {
      return i
    }
  }
  return -1
}

function splitTopLevel(text, delimiter) {
  const parts = []
  let current = ''
  let depth = 0
  let inQuotes = false
  let quoteChar = null
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === quoteChar && text[i - 1] !== '\\') inQuotes = false
      current += c
    } else if (c === '"' || c === "'") {
      inQuotes = true
      quoteChar = c
      current += c
    } else if (c === '[' || c === '{' || c === '(') {
      depth++
      current += c
    } else if (c === ']' || c === '}' || c === ')') {
      depth--
      current += c
    } else if (c === delimiter && depth === 0) {
      parts.push(current.trim())
      current = ''
    } else {
      current += c
    }
  }
  if (current.trim() !== '') parts.push(current.trim())
  return parts
}

// ─── Flow collections (inline) ────────────────────────────────

function parseYamlInline(text) {
  const t = text.trim()
  if (t.startsWith('[')) return parseYamlInlineArray(t)
  if (t.startsWith('{')) return parseYamlInlineObject(t)
  return parseYamlScalar(t)
}

function parseYamlInlineArray(text) {
  const inner = text.trim().slice(1, -1).trim()
  if (!inner) return []
  return splitTopLevel(inner, ',').map((p) => parseYamlInline(p))
}

function parseYamlInlineObject(text) {
  const inner = text.trim().slice(1, -1).trim()
  if (!inner) return {}
  const obj = {}
  const parts = splitTopLevel(inner, ',')
  for (const part of parts) {
    const colonIdx = part.indexOf(':')
    if (colonIdx > 0) {
      const key = unquoteYaml(part.slice(0, colonIdx).trim())
      obj[key] = parseYamlInline(part.slice(colonIdx + 1).trim())
    }
  }
  return obj
}

function flowQuote(s) {
  // no contexto de fluxo, vírgula e colchetes simples quebram o item
  return yamlNeedsQuotes(s) || /[,:\[\]{}]/.test(s) ? JSON.stringify(s) : s
}

function flowValue(v) {
  if (v === null) return 'null'
  if (typeof v === 'boolean') return v ? 'true' : 'false'
  if (typeof v === 'number') return yamlScalar(v)
  if (typeof v === 'string') return flowQuote(v)
  if (Array.isArray(v)) return '[' + v.map(flowValue).join(', ') + ']'
  return (
    '{ ' +
    Object.keys(v)
      .map((k) => flowQuote(String(k)) + ': ' + flowValue(v[k]))
      .join(', ') +
    ' }'
  )
}

// ─── Tokenizer ─────────────────────────────────────────────────

function stripComment(raw) {
  let inQuotes = false
  let quoteChar = null
  for (let i = 0; i < raw.length; i++) {
    const c = raw[i]
    if (!inQuotes && (c === '"' || c === "'")) {
      inQuotes = true
      quoteChar = c
    } else if (inQuotes && c === quoteChar && raw[i - 1] !== '\\') {
      inQuotes = false
    } else if (!inQuotes && c === '#') {
      return raw.slice(0, i)
    }
  }
  return raw
}

function flowBalance(text) {
  let bal = 0
  let inQuotes = false
  let quoteChar = null
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === quoteChar && text[i - 1] !== '\\') inQuotes = false
      continue
    }
    if (c === '"' || c === "'") {
      inQuotes = true
      quoteChar = c
      continue
    }
    if (c === '[' || c === '{') bal++
    else if (c === ']' || c === '}') bal--
  }
  return bal
}

function isBlockScalarHeader(content) {
  const trimmed = content.trim()
  let value = null
  if (findUnquotedColon(trimmed) > 0) {
    value = trimmed.slice(findUnquotedColon(trimmed) + 1).trim()
  } else if (trimmed === '-' || /^-\s+/.test(trimmed)) {
    value = trimmed.slice(1).trim()
  }
  return value !== null && /^[|>][+-]?\d*$/.test(value)
}

export function tokenizeYaml(text) {
  const srcLines = String(text).replace(/\r\n?/g, '\n').split('\n')
  const tokens = []
  let flowDepth = 0
  let flowOpen = 0
  let blockIndent = -1
  let docStart = false

  for (let ln = 0; ln < srcLines.length; ln++) {
    const lineNo = ln + 1
    const rawLine = srcLines[ln]

    if (blockIndent >= 0) {
      if (rawLine.trim() === '') {
        tokens.push({ type: 'blocktext', raw: '', indent: blockIndent + 1, line: lineNo })
        continue
      }
      const ind = rawLine.search(/\S/)
      if (ind > blockIndent) {
        tokens.push({ type: 'blocktext', raw: rawLine, indent: ind, line: lineNo })
        continue
      }
      blockIndent = -1
    }

    const trimmed = rawLine.trim()
    if (trimmed === '') continue

    const tabIdx = rawLine.indexOf('\t')
    if (tabIdx >= 0 && rawLine.slice(0, tabIdx).trim() === '') {
      return makeErr('tabIndent', lineNo, tabIdx + 1)
    }

    const ind = rawLine.search(/\S/)

    if ((trimmed === '---' || trimmed === '...') && ind === 0) {
      if (trimmed === '---' && !docStart && tokens.length === 0) {
        docStart = true
        continue
      }
      return makeErr('multiDoc', lineNo, 1)
    }

    const content = stripComment(rawLine).trimEnd()
    if (content.trim() === '') continue

    const bal = flowBalance(content)
    if (bal !== 0) {
      const net = flowDepth + bal
      if (net < 0) return makeErr('unclosedFlow', lineNo, 1)
      if (flowDepth === 0 && bal > 0) flowOpen = lineNo
      flowDepth = net
    }

    tokens.push({ type: 'line', indent: ind, content, line: lineNo })
    if (isBlockScalarHeader(content)) blockIndent = ind
  }

  if (flowDepth !== 0) return makeErr('unclosedFlow', flowOpen || 1, 1)
  return { ok: true, tokens, docStart }
}

// ─── Block scalars ─────────────────────────────────────────────

function blockMarker(value) {
  const trailing = value.match(/\n*$/)[0].length
  if (trailing === 0) return { marker: '|-', body: value }
  if (trailing === 1) return { marker: '|', body: value.slice(0, value.length - 1) }
  return { marker: '|+', body: value }
}

// Emite um block scalar. base = coluna da linha do marcador;
// prefix = texto à esquerda do marcador nessa mesma linha (ex.:
// "chave: " ou "- "); contentPad = indentação dos conteúdos.
function appendBlockScalar(value, base, prefix, contentPad, lines) {
  const { marker, body } = blockMarker(value)
  const bodyLines = body.split('\n')
  let min = Infinity
  for (const l of bodyLines) if (l.trim() !== '') min = Math.min(min, l.search(/\S/))
  if (!Number.isFinite(min)) min = 0
  lines.push(' '.repeat(base) + prefix + marker)
  for (const l of bodyLines) lines.push(l === '' ? contentPad : contentPad + l.slice(min))
}

// lê o conteúdo de um block scalar iniciado no token idx (header).
// baseIndent é a coluna do nó pai (chave ou traço da sequência).
function parseBlockScalar(tokens, idx, baseIndent) {
  const header = tokens[idx]
  const marker = header.content.match(/[|>][+-]?\d*/)[0]
  const literal = marker[0] === '|'
  const match = marker.match(/\d+/)
  const explicit = match ? parseInt(match[0], 10) : -1
  const lines = []
  let i = idx + 1
  while (i < tokens.length && tokens[i].type === 'blocktext') {
    lines.push(tokens[i])
    i++
  }
  // sem indicador de indentação, o conteúdo começa na primeira linha
  // não vazia (mais funda que o nó pai)
  let contentIndent = explicit
  if (contentIndent === -1) {
    for (const t of lines) {
      const s = t.raw !== '' ? t.raw.search(/\S/) : -1
      if (s > baseIndent) {
        contentIndent = s
        break
      }
    }
  }
  if (contentIndent === -1) contentIndent = baseIndent + 1
  let value
  if (literal) {
    value = lines
      .map((t) => (t.raw === '' ? '' : t.raw.slice(Math.min(contentIndent, t.indent))))
      .join('\n')
  } else {
    const acc = []
    for (const t of lines) {
      const l = t.raw === '' ? '' : t.raw.slice(Math.min(contentIndent, t.indent))
      if (l === '') acc.push('\n')
      else if (acc.length === 0 || acc[acc.length - 1] === '\n') acc.push(l)
      else acc[acc.length - 1] += ' ' + l
    }
    value = acc.join('')
  }
  if (marker.endsWith('-')) value = value.replace(/\n+$/, '')
  return { value, nextIdx: i }
}

// para { flow: [x] } os marcadores doc-junto não se aplicam; aqui
// testamos coleções de fluxo fechadas na própria linha
function isClosedFlow(content) {
  const c = content.trim()
  return (c.startsWith('[') || c.startsWith('{')) && flowBalance(c) === 0
}

// ─── Parser ────────────────────────────────────────────────────

function parseYamlNode(tokens, idx, baseIndent) {
  const token = tokens[idx]
  if (!token) return { value: null, nextIdx: idx }

  // block scalar como nó raiz (raro, mas possível)
  if (token.indent === baseIndent && /^[|>][+-]?\d*$/.test(token.content)) {
    const bs = parseBlockScalar(tokens, idx, baseIndent)
    return { value: bs.value, nextIdx: bs.nextIdx }
  }

  // documento inteiro em flow: { ... } / [ ... ]
  if (token.indent === baseIndent && isClosedFlow(token.content)) {
    const c = token.content.trim()
    const value = c.startsWith('{') ? parseYamlInlineObject(c) : parseYamlInlineArray(c)
    return { value, nextIdx: idx + 1 }
  }

  // sequência em bloco
  if (isSeqItem(token.content)) {
    return parseSeq(tokens, idx)
  }

  // mapa em bloco
  if (findUnquotedColon(token.content) >= 0) {
    return parseObject(tokens, idx, baseIndent)
  }

  // scalar puro
  return { value: parseYamlScalar(token.content), nextIdx: idx + 1 }
}

function parseObject(tokens, idx, baseIndent) {
  const obj = {}
  let i = idx
  while (i < tokens.length && tokens[i].type === 'line' && tokens[i].indent === baseIndent) {
    const cur = tokens[i]
    if (isSeqItem(cur.content)) break
    const colonIdx = findUnquotedColon(cur.content)
    if (colonIdx < 0) break
    const rawKey = cur.content.slice(0, colonIdx).trim()
    if (rawKey === '') throw new YamlError('badKey', cur.line)
    const key = unquoteYaml(rawKey)
    const after = cur.content.slice(colonIdx + 1).trim()

    if (after === '') {
      const next = tokens[i + 1]
      if (next && next.type === 'line') {
        const childIndent = next.indent
        const isSeqAtSameLevel = childIndent === baseIndent && isSeqItem(next.content)
        if (childIndent > baseIndent || isSeqAtSameLevel) {
          const child = parseYamlNode(tokens, i + 1, childIndent)
          obj[key] = child.value
          i = child.nextIdx
          continue
        }
      }
      obj[key] = null
      i++
    } else if (/^[|>][+-]?\d*$/.test(after)) {
      const bs = parseBlockScalar(tokens, i, baseIndent)
      obj[key] = bs.value
      i = bs.nextIdx
    } else if (/^[\[\{]/.test(after)) {
      obj[key] = parseYamlInline(after)
      i++
    } else {
      obj[key] = parseYamlScalar(after)
      i++
    }
  }
  if (tokens[i] && tokens[i].type === 'line' && tokens[i].indent > baseIndent) {
    throw new YamlError('orphanIndent', tokens[i].line)
  }
  return { value: obj, nextIdx: i }
}

function parseSeq(tokens, idx) {
  const arr = []
  let i = idx
  const arrayIndent = tokens[idx].indent
  while (i < tokens.length && tokens[i].type === 'line' && tokens[i].indent === arrayIndent && isSeqItem(tokens[i].content)) {
    const item = parseSeqItem(tokens, i, arrayIndent)
    arr.push(item.value)
    i = item.nextIdx
  }
  if (tokens[i] && tokens[i].type === 'line' && tokens[i].indent > arrayIndent && !isSeqItem(tokens[i].content)) {
    throw new YamlError('orphanIndent', tokens[i].line)
  }
  return { value: arr, nextIdx: i }
}

// entrada: o índice de um item "- ..." dentro de uma sequência.
// Lida com os casos de item que é um mapa com várias chaves.
function parseSeqItem(tokens, i, arrayIndent) {
  const cur = tokens[i]
  const rest = cur.content.trimStart().slice(1).trim()
  const itemIndent = arrayIndent + 2

  // item vazio "- "
  if (rest === '') {
    const next = tokens[i + 1]
    if (next && next.type === 'line' && next.indent > arrayIndent) {
      const child = parseYamlNode(tokens, i + 1, next.indent)
      return { value: child.value, nextIdx: child.nextIdx }
    }
    return { value: null, nextIdx: i + 1 }
  }

  // item que é um mapa: "- chave:" ou "- chave: valor" (e talvez irmãs)
  const colonIdx = findUnquotedColon(rest)
  if (colonIdx > 0) {
    const key = unquoteYaml(rest.slice(0, colonIdx).trim())
    const after = rest.slice(colonIdx + 1).trim()
    let value
    let i2 = i + 1
    if (after === '') {
      const next = tokens[i2]
      if (next && next.type === 'line' && next.indent > arrayIndent && !(next.indent === itemIndent && findUnquotedColon(next.content) > 0)) {
        const child = parseYamlNode(tokens, i2, next.indent)
        value = child.value
        i2 = child.nextIdx
      } else {
        value = null
      }
    } else if (/^[|>][+-]?\d*$/.test(after)) {
      const bs = parseBlockScalar(tokens, i, arrayIndent)
      value = bs.value
      i2 = bs.nextIdx
    } else if (/^[\[\{]/.test(after)) {
      value = parseYamlInline(after)
      i2 = i + 1
    } else {
      value = parseYamlScalar(after)
      i2 = i + 1
    }
    const item = { [key]: value }

    // chaves irmãs do mesmo item: linhas mais fundas que o traço
    const next = tokens[i2]
    if (next && next.type === 'line' && next.indent > arrayIndent && !isSeqItem(next.content) && findUnquotedColon(next.content) > 0) {
      const child = parseYamlNode(tokens, i2, next.indent)
      if (child.value && typeof child.value === 'object' && !Array.isArray(child.value)) {
        Object.assign(item, child.value)
        i2 = child.nextIdx
      } else {
        i2 = child.nextIdx
      }
    }
    return { value: item, nextIdx: i2 }
  }

  // item com chave nua: "- foo" vira mapa quando uma chave irmã
  // (mais funda que o traço) existe logo abaixo; caso contrário é
  // um scalar (ex.: "- a", "- \"80:80\"", "- noite na colina").
  if (isBlockScalarHeader(cur.content)) {
    const bs = parseBlockScalar(tokens, i, arrayIndent)
    return { value: bs.value, nextIdx: bs.nextIdx }
  }

  if (/^[\[\{]/.test(rest)) {
    return { value: parseYamlInline(rest), nextIdx: i + 1 }
  }

  // item que é uma sequência aninhada: "- - 1" / "  - 2"
  if (/^-(?:\s|$)/.test(rest)) {
    const nestedIndent = arrayIndent + 2
    const nestedTokens = [
      { type: 'line', indent: nestedIndent, content: rest, line: cur.line },
      ...tokens.slice(i + 1),
    ]
    const child = parseSeq(nestedTokens, 0)
    return { value: child.value, nextIdx: i + child.nextIdx }
  }

  const next = tokens[i + 1]
  const isContinuation =
    next && next.type === 'line' && next.indent > arrayIndent && findUnquotedColon(next.content) > 0 && !isSeqItem(next.content)
  if (!isContinuation) {
    return { value: parseYamlScalar(rest), nextIdx: i + 1 }
  }

  const key = unquoteYaml(rest)
  const item = { [key]: null }
  const child = parseYamlNode(tokens, i + 1, next.indent)
  if (child.value && typeof child.value === 'object' && !Array.isArray(child.value)) {
    Object.assign(item, child.value)
  } else {
    item[key] = child.value
  }
  return { value: item, nextIdx: child.nextIdx }
}

// ─── API pública ───────────────────────────────────────────────

export function parseYaml(text) {
  if (!String(text).trim()) return { ok: true, value: null, docStart: false }
  const tok = tokenizeYaml(text)
  if (!tok.ok) return tok
  try {
    const res = parseYamlNode(tok.tokens, 0, tok.tokens[0].indent)
    if (res.nextIdx !== tok.tokens.length) {
      return { ok: false, error: 'orphanIndent', line: tok.tokens[res.nextIdx].line, col: 1 }
    }
    return { ok: true, value: res.value, docStart: tok.docStart }
  } catch (e) {
    if (e instanceof YamlError) return { ok: false, error: e.key, line: e.line, col: e.col }
    throw e
  }
}

let INDENT_UNIT = '  '

function renderPretty(value, opts) {
  const lines = []
  if (opts.docStart) lines.push('---')

  function emitObject(obj, col) {
    const keys = Object.keys(obj)
    if (keys.length === 0) {
      lines.push(' '.repeat(col) + '{}')
      return
    }
    for (const k of keys) {
      const v = obj[k]
      const head = ' '.repeat(col) + scalarKey(k) + ':'
      if (isScalar(v)) {
        if (typeof v === 'string' && v.includes('\n')) {
          appendBlockScalar(v, col, scalarKey(k) + ': ', ' '.repeat(col + INDENT_UNIT.length), lines)
        } else {
          lines.push(head + ' ' + yamlScalar(v))
        }
      } else if (Array.isArray(v)) {
        if (v.length === 0) lines.push(head + ' []')
        else {
          lines.push(head)
          emitArray(v, col + INDENT_UNIT.length)
        }
      } else {
        if (Object.keys(v).length === 0) lines.push(head + ' {}')
        else {
          lines.push(head)
          emitObject(v, col + INDENT_UNIT.length)
        }
      }
    }
  }

  function emitArray(arr, col) {
    if (arr.length === 0) {
      lines.push(' '.repeat(col) + '[]')
      return
    }
    for (const item of arr) {
      if (isScalar(item)) {
        if (typeof item === 'string' && item.includes('\n')) {
          appendBlockScalar(item, col, '- ', ' '.repeat(col + INDENT_UNIT.length), lines)
        } else {
          lines.push(' '.repeat(col) + '- ' + yamlScalar(item))
        }
      } else if (Array.isArray(item)) {
        if (item.length === 0) lines.push(' '.repeat(col) + '- []')
        else {
          lines.push(' '.repeat(col) + '-')
          emitArray(item, col + INDENT_UNIT.length)
        }
      } else if (Object.keys(item).length === 0) {
        lines.push(' '.repeat(col) + '- {}')
      } else {
        emitObjectAsListItem(item, col)
      }
    }
  }

  function emitObjectAsListItem(obj, col) {
    const keys = Object.keys(obj)
    keys.forEach((k, i) => {
      const v = obj[k]
      const pre = i === 0 ? ' '.repeat(col) + '- ' : ' '.repeat(col + 2)
      if (isScalar(v)) {
        if (typeof v === 'string' && v.includes('\n')) {
          const prefix = (i === 0 ? '- ' : '  ') + scalarKey(k) + ': '
          appendBlockScalar(v, col, prefix, ' '.repeat(col + 2 + INDENT_UNIT.length), lines)
        } else {
          lines.push(pre + scalarKey(k) + ': ' + yamlScalar(v))
        }
      } else if (Array.isArray(v)) {
        if (v.length === 0) lines.push(pre + scalarKey(k) + ': []')
        else {
          lines.push(pre + scalarKey(k) + ':')
          emitArray(v, col + 2 + INDENT_UNIT.length)
        }
      } else {
        if (Object.keys(v).length === 0) lines.push(pre + scalarKey(k) + ': {}')
        else {
          lines.push(pre + scalarKey(k) + ':')
          emitObject(v, col + 2 + INDENT_UNIT.length)
        }
      }
    })
  }

  if (Array.isArray(value)) emitArray(value, 0)
  else if (isPlainObject(value)) emitObject(value, 0)
  else lines.push(yamlScalar(value))

  return lines.join('\n').trimEnd()
}

function renderMin(value) {
  if (value === null) return 'null'
  if (isScalar(value)) return yamlScalar(value)
  return flowValue(value)
}

export function formatYaml(input, opts = {}) {
  INDENT_UNIT = opts.indent === 4 ? '    ' : '  '
  const parsed = parseYaml(input)
  if (!parsed.ok) return { ok: false, error: parsed.error, line: parsed.line, col: parsed.col, text: '' }
  const mode = opts.mode === 'min' ? 'min' : 'pretty'
  const text = mode === 'min' ? renderMin(parsed.value) : renderPretty(parsed.value, { docStart: parsed.docStart })
  return { ok: true, text, tree: parsed.value }
}

export function yamlStats(tree, input, output) {
  const enc = new TextEncoder()
  let keys = 0
  let lists = 0
  let depth = 0
  const walk = (v, d) => {
    if (d > depth) depth = d
    if (Array.isArray(v)) {
      lists++
      for (const it of v) walk(it, d + 1)
    } else if (isPlainObject(v)) {
      keys += Object.keys(v).length
      for (const k of Object.keys(v)) walk(v[k], d + 1)
    }
  }
  walk(tree, 1)
  return {
    keys,
    lists,
    depth,
    bytesIn: enc.encode(input).length,
    bytesOut: enc.encode(output).length,
  }
}