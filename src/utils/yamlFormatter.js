// ─────────────────────────────────────────────────────────────
// YAML Formatter / Minifier / Validator — 100% client-side.
//
// Um parser de blocos YAML (mappings, sequences, flow, scalars,
// block scalars |/>, âncoras & e aliases *) + um re-emissor que
// reconstrói o documento a partir da árvore. Assim indentação,
// alinhamento e comentários são normalizados de forma consistente
// e o interior de strings/quoted nunca é tocado.
//
// Saídas por modo:
//   'format'   → YAML normalizado (indent 2/4, comentários opcionais)
//   'minify'   → remove comentários e linhas em branco
//   'validate' → roda o parser e devolve apenas diagnóstico
//   'json'     → converte a árvore em JSON (merge keys <<: expandidos)
//
// Tipagem YAML 1.1 de scalars simples: null/~, true/false e
// yes/no/on/off (com aviso), inteiros (dec/hex/oct/bin com _),
// floats (incl. .inf/.nan); o resto vira string. Datas continuam
// como string (fiel ao texto original).
// ─────────────────────────────────────────────────────────────

const N = { null: 'null', bool: 'boolean', int: 'int', float: 'float', string: 'string' }

const NULL_RE = /^(?:null|Null|NULL|~)$/
const BOOL_RE = /^(?:true|True|TRUE|false|False|FALSE)$/
const BOOL11_RE = /^(?:yes|Yes|YES|no|No|NO|on|On|ON|off|Off|OFF)$/
const INT_RE = /^[-+]?[0-9](?:_?[0-9])*$/
const HEX_RE = /^0x[0-9a-fA-F](?:_?[0-9a-fA-F])*$/
const OCT_RE = /^0o[0-7](?:_?[0-7])*$/
const BIN_RE = /^0b[01](?:_?[01])*$/
const FLOAT_RE =
  /^[-+]?(?:(?:[0-9](?:_?[0-9])*\.[0-9](?:_?[0-9])*(?:[eE][-+]?[0-9](?:_?[0-9])*)?)|(?:[0-9](?:_?[0-9])*[eE][-+]?[0-9](?:_?[0-9])*)|(?:\.inf|\.Inf|\.INF|\.nan|\.NaN|\.NAN))$/
const LEADING_CHARS = /^[\s\-?:,\[\]{}#&*!|>'"%@`]/
const COLON_SPACE = /:[\s\u00a0]/ // ': ' no meio de um scalar simples

function classifyScalar(raw) {
  if (raw === '') return { type: N.string }
  if (NULL_RE.test(raw)) return { type: N.null }
  if (BOOL_RE.test(raw)) return { type: N.bool }
  if (BOOL11_RE.test(raw)) return { type: N.bool, yaml11: true }
  if (INT_RE.test(raw)) return { type: N.int }
  if (HEX_RE.test(raw)) return { type: N.int }
  if (OCT_RE.test(raw)) return { type: N.int }
  if (BIN_RE.test(raw)) return { type: N.int }
  if (FLOAT_RE.test(raw)) return { type: N.float }
  return { type: N.string }
}

function scalarToJs(node) {
  if (!node) return null
  if (node.kind === 'map') {
    const out = {}
    for (const e of node.entries) {
      if (e.key === '<<') {
        const m = node.anchorRef && node.anchorRef.anchor ? null : e.value
        if (e.value && e.value.anchorRef && e.value.anchorRef.value) {
          const merged = scalarToJs(e.value.anchorRef.value)
          if (merged && typeof merged === 'object' && !Array.isArray(merged)) Object.assign(out, merged)
        }
        if (e.value && e.value.kind === 'map') {
          const merged = scalarToJs(e.value)
          if (merged && typeof merged === 'object' && !Array.isArray(merged)) Object.assign(out, merged)
        }
        void m
        continue
      }
      out[e.key] = scalarToJs(e.value)
    }
    return out
  }
  if (node.kind === 'seq') {
    return node.items.map((it) => scalarToJs(it.value))
  }
  if (node.kind === 'alias') {
    if (node.anchorRef && node.anchorRef.value) return scalarToJs(node.anchorRef.value)
    return null
  }
  if (node.kind === 'blockScalar') return node.text
  if (node.kind !== 'scalar') return null
  const raw = node.raw || ''
  if (node.type === N.null) return null
  if (node.type === N.bool) {
    return raw === 'true' || raw === 'True' || raw === 'TRUE' || raw === 'yes' || raw === 'Yes' || raw === 'YES' || raw === 'on' || raw === 'On' || raw === 'ON'
  }
  if (node.type === N.int) {
    const clean = raw.replace(/_/g, '')
    if (/^0[xX]/.test(clean)) return parseInt(clean.slice(2), 16)
    if (/^0[oO]/.test(clean)) return parseInt(clean.slice(2), 8)
    if (/^0[bB]/.test(clean)) return parseInt(clean.slice(2), 2)
    return parseInt(clean, 10)
  }
  if (node.type === N.float) {
    const clean = raw.replace(/_/g, '')
    if (/\.inf/i.test(clean)) return Infinity
    if (/\.nan/i.test(clean)) return NaN
    return parseFloat(clean)
  }
  return node.text !== undefined ? node.text : raw
}

function quoteString(raw) {
  if (raw.indexOf("'") === -1 && raw.indexOf('"') === -1 && !/[\n\r\t]/.test(raw)) {
    return `'${raw}'`
  }
  if (raw.indexOf('"') === -1 && !/[\n\r\t\\]/.test(raw)) {
    return `"${raw}"`
  }
  let out = '"'
  for (const ch of raw) {
    if (ch === '"') out += '\\"'
    else if (ch === '\\') out += '\\\\'
    else if (ch === '\n') out += '\\n'
    else if (ch === '\r') out += '\\r'
    else if (ch === '\t') out += '\\t'
    else if (ch.charCodeAt(0) < 0x20) out += `\\x${ch.charCodeAt(0).toString(16).padStart(2, '0')}`
    else out += ch
  }
  return out + '"'
}

function needsQuotes(node) {
  const raw = node.raw || ''
  if (/[\n\r]/.test(raw)) return true
  if (LEADING_CHARS.test(raw)) return true
  if (COLON_SPACE.test(raw) || /#\s/.test(raw) || /[ \t]$/.test(raw)) return true
  if (classifyScalar(raw).type !== N.string) return true
  return false
}

// ─── parseYaml: constrói a árvore ────────────────────────────

export function parseYaml(input) {
  const src = String(input ?? '').replace(/\r\n?/g, '\n')
  const lines = src.split('\n')
  const L = lines.length
  const warnings = []

  const state = { lines, L, i: 0, anchors: {}, warnings, trailingComments: [] }

  const readLine = (k) => lines[k] || ''

  function analyze(k) {
    const line = readLine(k)
    const m = /^( *)(.*)$/.exec(line)
    const ws = m[1]
    const body = m[2]
    if (body === '') return { kind: 'blank', indent: ws.length, raw: line }
    if (body[0] === '#') return { kind: 'comment', indent: ws.length, raw: line, text: body.slice(1) }
    if (ws.indexOf('\t') !== -1 || body[0] === '\t') return { kind: 'tab-error', line: k + 1 }
    return { kind: 'content', indent: ws.length, body, raw: line }
  }

  function advance(nodeIndent) {
    const comments = []
    let k = state.i + 1
    while (k < L) {
      const a = analyze(k)
      if (a.kind === 'blank') { k++; continue }
      if (a.kind === 'comment') {
        if (a.indent < nodeIndent) break
        comments.push(a.text)
        k++
        continue
      }
      if (a.kind === 'tab-error') return { error: { key: 'tabIndent', line: a.line }, idx: -1, comments }
      if (a.indent < nodeIndent) return { idx: -1, comments }
      if (a.indent > nodeIndent) return { error: { key: 'strayIndent', line: k + 1 }, idx: -1, comments }
      return { idx: k, comments }
    }
    return { idx: -1, comments }
  }

  function popAnchorAndAlias(text) {
    let rest = text
    let anchor = null
    for (;;) {
      const t = rest.trimStart()
      if (t[0] === '&') {
        const m = /^&([A-Za-z0-9_-]+)(?:\s|$)/.exec(t)
        if (!m) throw { key: 'badAnchor', line: 0 }
        anchor = m[1]
        rest = t.slice(m[0].length).trimStart()
        continue
      }
      if (t[0] === '*') {
        const m = /^\*([A-Za-z0-9_-]+)(?:\s|$)/.exec(t)
        if (!m) throw { key: 'badAlias', line: 0 }
        return { text: t.slice(m[0].length).trimStart(), anchor, alias: m[1] }
      }
      return { text: rest, anchor, alias: null }
    }
  }

  function parseDoubleQuoted(s) {
    let out = ''
    let i = 1
    while (i < s.length) {
      const c = s[i]
      if (c === '"') return { value: out, rest: s.slice(i + 1), ok: true }
      if (c === '\\') {
        const e = s[i + 1]
        if (e === undefined) return { error: 'unclosedDouble' }
        const map = { n: '\n', t: '\t', r: '\r', '"': '"', '\\': '\\', '/': '/', 0: '\0', a: '\u0007', b: '\b', f: '\f', v: '\v', e: '\u001b', ' ': ' ' }
        if (e in map) { out += map[e]; i += 2; continue }
        if (e === 'x' && /^[0-9a-fA-F]{2}/.test(s.slice(i + 2))) { out += String.fromCharCode(parseInt(s.slice(i + 2, i + 4), 16)); i += 4; continue }
        if (e === 'u' && /^[0-9a-fA-F]{4}/.test(s.slice(i + 2))) { out += String.fromCharCode(parseInt(s.slice(i + 2, i + 6), 16)); i += 6; continue }
        return { error: 'badEscape' }
      }
      out += c
      i++
    }
    return { error: 'unclosedDouble' }
  }

  function parseSingleQuoted(s) {
    let out = ''
    let i = 1
    while (i < s.length) {
      const c = s[i]
      if (c === "'") {
        if (s[i + 1] === "'") { out += "'"; i += 2; continue }
        return { value: out, rest: s.slice(i + 1), ok: true }
      }
      out += c
      i++
    }
    return { error: 'unclosedSingle' }
  }

  function collectFlow(text, idx) {
    let joined = text
    let cur = idx + 1
    let balance = 0
    let q = null
    const scanSegment = (seg) => {
      for (let j = 0; j < seg.length; j++) {
        const c = seg[j]
        if (q === '"') { if (c === '\\') j++; else if (c === '"') q = null; continue }
        if (q === "'") { if (c === "'" && seg[j + 1] === "'") j++; else if (c === "'") q = null; continue }
        if (c === '"' || c === "'") { q = c; continue }
        if (c === '[' || c === '{') balance++
        else if (c === ']' || c === '}') balance--
      }
    }
    scanSegment(text)
    while (balance > 0 && cur < L) {
      const line = readLine(cur)
      joined += '\n' + line
      scanSegment(line)
      cur++
    }
    return { text: joined, closed: balance <= 0, endIdx: cur - 1 }
  }

  function parseFlow(text, lineNo) {
    let i = 0
    const s = text
    const len = s.length
    let error = null

    const skipWs = () => { while (i < len && (s[i] === ' ' || s[i] === '\t' || s[i] === '\n')) i++ }

    const parseQuoted = () => {
      if (i >= len) return null
      if (s[i] === '"') {
        const r = parseDoubleQuoted(s.slice(i))
        if (r.error) { error = { key: r.error, line: lineNo }; return null }
        i = s.length - r.rest.length
        return { kind: 'scalar', type: N.string, text: r.value, raw: r.value, quoted: '"', line: lineNo }
      }
      if (s[i] === "'") {
        const r = parseSingleQuoted(s.slice(i))
        if (r.error) { error = { key: r.error, line: lineNo }; return null }
        i = s.length - r.rest.length
        return { kind: 'scalar', type: N.string, text: r.value, raw: r.value, quoted: "'", line: lineNo }
      }
      return null
    }

    const parsePlain = () => {
      let j = i
      let depth = 0
      while (j < len) {
        const c = s[j]
        if (depth === 0) {
          if (c === ',' || c === ']' || c === '}') break
          if (c === '#' && (j === i || s[j - 1] === ' ' || s[j - 1] === '\t')) break
        }
        if (c === '"' || c === "'") {
          if (c === '"') { j += skipDouble(s, j) - j } else { j += skipSingle(s, j) - j }
          continue
        }
        if (c === '[' || c === '{') depth++
        if (c === ']' || c === '}') depth--
        j++
      }
      const token = s.slice(i, j).trim()
      i = j
      if (token === '') return null
      const cls = classifyScalar(token)
      const node = { kind: 'scalar', type: cls.type, raw: token, text: token, line: lineNo }
      if (cls.yaml11) warnings.push({ key: 'bool11', line: lineNo, detail: token })
      return node
    }

    const skipDouble = (str, start) => {
      let k = start + 1
      while (k < str.length) {
        if (str[k] === '\\') { k += 2; continue }
        if (str[k] === '"') return k + 1
        k++
      }
      return k
    }
    const skipSingle = (str, start) => {
      let k = start + 1
      while (k < str.length) {
        if (str[k] === "'") {
          if (str[k + 1] === "'") { k += 2; continue }
          return k + 1
        }
        k++
      }
      return k
    }

    const parseValue = () => {
      skipWs()
      if (i >= len) return { value: null, has: false }
      const c = s[i]
      if (c === '[') return { value: parseArray(), has: true }
      if (c === '{') return { value: parseObject(), has: true }
      if (c === '"' || c === "'") {
        const q = parseQuoted()
        return q ? { value: q, has: true } : { value: null, has: false }
      }
      const p = parsePlain()
      return p ? { value: p, has: true } : { value: null, has: false }
    }

    const parseArray = () => {
      i++ // [
      const items = []
      skipWs()
      if (s[i] === ']') { i++; return { kind: 'seq', items } }
      for (;;) {
        const v = parseValue()
        if (error) return { kind: 'seq', items }
        items.push(v)
        skipWs()
        if (s[i] === ',') { i++; skipWs(); if (s[i] === ']') break; continue }
        if (s[i] === ']') { i++; break }
        error = { key: 'flowComma', line: lineNo }
        break
      }
      return { kind: 'seq', items }
    }

    const parseObject = () => {
      i++ // {
      const entries = []
      skipWs()
      if (s[i] === '}') { i++; return { kind: 'map', entries } }
      for (;;) {
        skipWs()
        let key
        if (s[i] === '"' || s[i] === "'") {
          const k = parseQuoted()
          if (error) return { kind: 'map', entries }
          key = k.text
        } else {
          let j = i
          while (j < len && !':,}['.includes(s[j])) j++
          key = s.slice(i, j).trim()
          i = j
          if (key === '') { error = { key: 'emptyKey', line: lineNo }; return { kind: 'map', entries } }
        }
        skipWs()
        if (s[i] !== ':') { error = { key: 'flowColon', line: lineNo }; return { kind: 'map', entries } }
        i++
        const v = parseValue()
        if (error) return { kind: 'map', entries }
        entries.push({ key, value: v.value, line: lineNo })
        skipWs()
        if (s[i] === ',') { i++; skipWs(); if (s[i] === '}') break; continue }
        if (s[i] === '}') { i++; break }
        error = { key: 'flowComma', line: lineNo }
        break
      }
      return { kind: 'map', entries }
    }

    const result = parseValue()
    if (error) return { error }
    skipWs()
    if (i < len && s[i] !== ',') return { error: { key: 'flowGarbage', line: lineNo } }
    return { node: result.value }
  }

  function plainScalarNode(token, lineNo) {
    const cls = classifyScalar(token)
    const node = { kind: 'scalar', type: cls.type, raw: token, text: token, line: lineNo }
    if (cls.yaml11) warnings.push({ key: 'bool11', line: lineNo, detail: token })
    return node
  }

  // sequência cujo(s) marcador(es) '-' começam inline na linha atual
  // (ex.: '- - 1' dentro de uma lista) e continuam em linhas mais profundas.
  function parseInlineSeq(content, nodeIndent, lineNo) {
    const node = { kind: 'seq', items: [], line: lineNo }

    const itemFromContent = (c2, baseIndent, lineNo) => {
      const trailSplit = splitTrailingComment(c2)
      const inner = trailSplit.content.trim()
      if (inner === '') {
        let m = state.i + 1
        let fc = -1
        while (m < L) {
          const bb = analyze(m)
          if (bb.kind === 'tab-error') throw { key: 'tabIndent', line: bb.line }
          if (bb.kind === 'blank' || bb.kind === 'comment') { m++; continue }
          if (bb.indent > baseIndent) { fc = m; break }
          break
        }
        if (fc === -1) return { kind: 'scalar', type: N.null, raw: 'null', text: 'null', line: lineNo }
        return parseBlock(analyze(fc).indent)
      }
      if (inner === '-' || inner.startsWith('- ')) return parseInlineSeq(inner, baseIndent, lineNo)
      return parseValue(inner, baseIndent, lineNo).node
    }

    node.items.push({ value: itemFromContent(content.slice(1), nodeIndent + 2, lineNo), preComments: [], trailComment: null })
    let k = state.i + 1
    while (k < L) {
      const a = analyze(k)
      const sc = splitTrailingComment(a.kind === 'content' ? a.body : '')
      if (a.kind === 'blank') { k++; continue }
      if (a.kind === 'comment') { k++; continue }
      if (a.kind === 'tab-error') throw { key: 'tabIndent', line: a.line }
      if (a.indent <= nodeIndent) break
      if (!(a.body === '-' || a.body.startsWith('- '))) break
      state.i = k
      const afterk = a.body.slice(1).replace(/^ /, '')
      node.items.push({ value: itemFromContent(afterk, a.indent + 2, k + 1), preComments: [], trailComment: sc.comment || null })
      k = state.i + 1
    }
    state.i = k - 1
    return node
  }

  function parseBlockScalar(head, nodeIndent, lineNo) {
    let rest = head.slice(1)
    let chomp = ''
    if (rest[0] === '+' || rest[0] === '-') { chomp = rest[0]; rest = rest.slice(1) }
    let explicit = null
    if (/^[1-9]$/.test(rest[0] || '')) { explicit = parseInt(rest[0], 10); rest = rest.slice(1) }
    if ((rest[0] === '+' || rest[0] === '-') && !chomp) { chomp = rest[0]; rest = rest.slice(1) }
    if (rest.trim() !== '') {
      // se sobrou algo, provavelmente um comentário depois (ex.: '| # keep') — aceita
      return { error: { key: 'badBlockScalar', line: lineNo } }
    }
    const style = head[0]

    const pieces = []
    let k = state.i + 1
    let blockIndent = explicit !== null ? nodeIndent + explicit : null
    while (k < L) {
      const line = readLine(k)
      const m = /^( *)(.*)$/.exec(line)
      const ws = m[1]
      const body = m[2]
      if (body === '') { pieces.push({ blank: true, text: '' }); k++; continue }
      if (blockIndent === null) blockIndent = ws.length
      if (blockIndent !== null && ws.length < blockIndent) break
      if (ws.indexOf('\t') !== -1) return { error: { key: 'tabIndent', line: k + 1 } }
      pieces.push({ blank: false, text: (ws.length > blockIndent ? ' '.repeat(ws.length - blockIndent) : '') + body })
      k++
    }
    state.i = k - 1

    const text = foldBlock(pieces, style)
    let final = text
    if (chomp === '-') final = text.replace(/\n+$/, '')
    else if (chomp === '+') final = text
    else final = text.replace(/\n+$/, '') + '\n'

    return { node: { kind: 'blockScalar', style, chomp, text: final, pieces, line: lineNo } }
  }

  function foldBlock(pieces, style) {
    if (style === '|') return pieces.map((p) => (p.blank ? '' : p.text)).join('\n')
    let out = ''
    let lineStart = true
    for (const p of pieces) {
      if (p.blank) { out += '\n'; lineStart = true; continue }
      if (lineStart) { out += p.text; lineStart = false } else { out += ' ' + p.text }
    }
    return out
  }

  function splitTrailingComment(s) {
    let inS = false, inD = false, depth = 0
    for (let i = 0; i < s.length; i++) {
      const c = s[i]
      if (inD) {
        if (c === '\\') i++
        else if (c === '"') inD = false
      } else if (inS) {
        if (c === "'" && s[i + 1] === "'") i++
        else if (c === "'") inS = false
      } else if (c === '"') inD = true
      else if (c === "'") inS = true
      else if (c === '[' || c === '{') depth++
      else if (c === ']' || c === '}') depth--
      else if (c === '#' && depth === 0 && (i === 0 || s[i - 1] === ' ' || s[i - 1] === '\t')) {
        return { content: s.slice(0, i).trimEnd(), comment: s.slice(i).trimEnd() }
      }
    }
    return { content: s, comment: null }
  }

  function findTopColon(s) {
    let inS = false, inD = false, depth = 0
    for (let i = 0; i < s.length; i++) {
      const c = s[i]
      if (inD) { if (c === '\\') i++; else if (c === '"') inD = false }
      else if (inS) { if (c === "'" && s[i + 1] === "'") i++; else if (c === "'") inS = false }
      else if (c === '"') inD = true
      else if (c === "'") inS = true
      else if (c === '[' || c === '{') depth++
      else if (c === ']' || c === '}') depth--
      else if (c === ':' && depth === 0) {
        const next = s[i + 1]
        if (next === undefined || next === ' ' || next === '\t') return i
      }
    }
    return -1
  }

  function parseKey(keyText, lineNo) {
    const t = keyText.trim()
    if (t[0] === '"') {
      const r = parseDoubleQuoted(t)
      if (r.error) throw { key: r.error, line: lineNo }
      if (r.rest.trim() !== '') throw { key: 'badKey', line: lineNo }
      return { key: r.value, quoted: '"' }
    }
    if (t[0] === "'") {
      const r = parseSingleQuoted(t)
      if (r.error) throw { key: r.error, line: lineNo }
      if (r.rest.trim() !== '') throw { key: 'badKey', line: lineNo }
      return { key: r.value, quoted: "'" }
    }
    if (t === '') throw { key: 'emptyKey', line: lineNo }
    if (COLON_SPACE.test(t) || /[ \t]$/.test(t)) throw { key: 'badKey', line: lineNo }
    return { key: t, quoted: null }
  }

  // parse de um valor — reutilizado para valores de mapping, itens de
  // sequence, âncoras etc. Consome linhas via state.i quando necessário.
  function parseValue(valueText, nodeIndent, lineBlock) {
    // âncora/alias primeiro (podem envolver qualquer outro valor)
    const t0 = valueText.trimStart()
    if (t0[0] === '&' || t0[0] === '*') {
      const pa = popAnchorAndAlias(t0)
      if (pa.alias) {
        const ref = state.anchors[pa.alias]
        if (!ref) throw { key: 'unknownAlias', line: lineBlock, detail: pa.alias }
        const node = { kind: 'alias', name: pa.alias, anchorRef: ref, line: lineBlock }
        if (pa.anchor) {
          node.anchorName = pa.anchor
          const ref2 = { anchor: pa.anchor, value: node }
          state.anchors[pa.anchor] = ref2
          node.anchorRef = ref2
        }
        return { node }
      }
      const anchorName = pa.anchor
      if (pa.text === '') {
        // âncora sem valor na linha → bloco aninhado abaixo
        let k = state.i + 1
        let firstContent = -1
        while (k < L) {
          const a = analyze(k)
          if (a.kind === 'tab-error') throw { key: 'tabIndent', line: a.line }
          if (a.kind === 'blank' || a.kind === 'comment') { k++; continue }
          if (a.indent > nodeIndent) { firstContent = k; break }
          break
        }
        let inner
        if (firstContent === -1) {
          inner = { kind: 'scalar', type: N.null, raw: 'null', text: 'null', line: lineBlock }
        } else {
          inner = parseBlock(analyze(firstContent).indent)
        }
        const ref = { anchor: anchorName, value: inner }
        state.anchors[anchorName] = ref
        inner.anchorRef = ref
        inner.anchorName = anchorName
        return { node: inner }
      }
      const sub = parseValue(pa.text, nodeIndent, lineBlock)
      const ref = { anchor: anchorName, value: sub.node }
      state.anchors[anchorName] = ref
      sub.node.anchorRef = ref
      sub.node.anchorName = anchorName
      return { node: sub.node }
    }

    if (valueText === '') {
      let k = state.i + 1
      let firstContent = -1
      while (k < L) {
        const a = analyze(k)
        if (a.kind === 'tab-error') throw { key: 'tabIndent', line: a.line }
        if (a.kind === 'blank' || a.kind === 'comment') { k++; continue }
        if (a.indent > nodeIndent) { firstContent = k; break }
        break
      }
      if (firstContent === -1) {
        return { node: { kind: 'scalar', type: N.null, raw: 'null', text: 'null', line: lineBlock } }
      }
      const nextIndent = analyze(firstContent).indent
      return { node: parseBlock(nextIndent) }
    }

    const vt = valueText.trim()
    if (vt === '') throw { key: 'valueExpected', line: lineBlock }

    if (vt[0] === '|' || vt[0] === '>') {
      const r = parseBlockScalar(vt, nodeIndent, lineBlock)
      if (r.error) throw r.error
      return { node: r.node }
    }

    if (vt[0] === '[' || vt[0] === '{') {
      const coll = collectFlow(vt, state.i)
      if (!coll.closed) throw { key: 'unclosedFlow', line: lineBlock }
      state.i = coll.endIdx
      const res = parseFlow(' ' + coll.text, lineBlock)
      if (res.error) throw res.error
      const node = res.node
      if (node) node.line = lineBlock
      return { node: node || { kind: 'scalar', type: N.null, raw: 'null', text: 'null', line: lineBlock } }
    }

    if (vt[0] === '"') {
      const r = parseDoubleQuoted(vt)
      if (r.error) throw { key: r.error, line: lineBlock }
      if (r.rest.trim() !== '') throw { key: 'trailingAfterString', line: lineBlock }
      return { node: { kind: 'scalar', type: N.string, text: r.value, raw: r.value, quoted: '"', line: lineBlock } }
    }
    if (vt[0] === "'") {
      const r = parseSingleQuoted(vt)
      if (r.error) throw { key: r.error, line: lineBlock }
      if (r.rest.trim() !== '') throw { key: 'trailingAfterString', line: lineBlock }
      return { node: { kind: 'scalar', type: N.string, text: r.value, raw: r.value, quoted: "'", line: lineBlock } }
    }

    if (vt === '-' || vt.startsWith('- ')) {
      const inner = parseInlineSeq(vt, nodeIndent, lineBlock)
      return { node: inner }
    }

    if (COLON_SPACE.test(vt)) throw { key: 'plainColonSpace', line: lineBlock }

    const node = plainScalarNode(vt, lineBlock)
    // continuação foldada de plain scalar (linhas seguintes com indent maior,
    // sem ':' e sem marcador de sequence)
    let k = state.i + 1
    let folded = false
    while (k < L) {
      const a = analyze(k)
      if (a.kind === 'blank' || a.kind === 'comment') break
      if (a.kind === 'tab-error') break
      if (a.indent <= nodeIndent) break
      if (a.body === '-' || a.body.startsWith('- ')) break
      if (findTopColon(a.body) !== -1) break
      node.text += ' ' + a.body.trim()
      node.raw = node.text
      folded = true
      k++
    }
    if (folded) state.i = k - 1
    const cls = classifyScalar(node.text)
    node.type = cls.type
    if (cls.yaml11) warnings.push({ key: 'bool11', line: lineBlock, detail: node.text })
    return { node }
  }

  function parseBlock(nodeIndent) {
    const at = analyze(state.i + 1)
    if (at.kind === 'content' && at.indent === nodeIndent && (at.body === '-' || at.body.startsWith('- '))) {
      return parseSequence(nodeIndent)
    }
    return parseMapping(nodeIndent)
  }

  function parseMapping(nodeIndent) {
    const node = { kind: 'map', entries: [], line: state.i + 1 }
    const pending = []

    const addEntry = (entry) => {
      const dup = node.entries.find((e) => e.key === entry.key)
      if (dup) warnings.push({ key: 'duplicateKey', line: entry.line, detail: entry.key })
      node.entries.push(entry)
    }

    for (;;) {
      const res = advance(nodeIndent)
      if (res.error) throw res.error
      pending.length = 0
      pending.push(...res.comments)
      const idx = res.idx
      if (idx === -1) break
      const a = analyze(idx)
      state.i = idx
      if (a.body === '...' && a.indent === nodeIndent) break

      const sel = splitTrailingComment(a.body)
      const colon = findTopColon(sel.content)
      if (colon === -1) {
        if (a.body === '-' || a.body.startsWith('- ')) throw { key: 'expectInMap', line: idx + 1 }
        throw { key: 'expectColon', line: idx + 1 }
      }
      const keyText = sel.content.slice(0, colon)
      const kv = parseKey(keyText, idx + 1)
      const keyStr = kv.key
      const keyQuoted = kv.quoted

      const restRaw = sel.content.slice(colon + 1)
      const trailSplit = splitTrailingComment(restRaw)
      const value = parseValue(trailSplit.content, nodeIndent, idx + 1)

      const entry = {
        key: keyStr,
        keyQuoted,
        value: value.node,
        line: idx + 1,
        preComments: [...pending],
        trailComment: trailSplit.comment || null,
      }
      addEntry(entry)
      pending.length = 0
    }
    return node
  }

  function parseSequence(nodeIndent) {
    const node = { kind: 'seq', items: [], line: state.i + 1 }

    for (;;) {
      const res = advance(nodeIndent)
      if (res.error) throw res.error
      const comments = res.comments
      const idx = res.idx
      if (idx === -1) break
      const a = analyze(idx)
      if (a.body === '...' && a.indent === nodeIndent) break
      if (!(a.body === '-' || a.body.startsWith('- '))) {
        throw { key: 'notInSequence', line: idx + 1 }
      }
      state.i = idx
      let after = a.body.slice(1)
      if (after[0] === ' ') after = after.slice(1)
      const itemLine = idx + 1
      const itemTrail = splitTrailingComment(after)
      const content = itemTrail.content.trim()

      let value
      if (content === '') {
        let k = state.i + 1
        let firstContent = -1
        while (k < L) {
          const aa = analyze(k)
          if (aa.kind === 'tab-error') throw { key: 'tabIndent', line: aa.line }
          if (aa.kind === 'blank' || aa.kind === 'comment') { k++; continue }
          if (aa.indent > nodeIndent) { firstContent = k; break }
          break
        }
        if (firstContent === -1) {
          value = { kind: 'scalar', type: N.null, raw: 'null', text: 'null', line: itemLine }
        } else {
          value = parseBlock(analyze(firstContent).indent)
        }
        node.items.push({ value, preComments: [...comments], trailComment: itemTrail.comment || null })
        comments.length = 0
        continue
      }

      const colon = findTopColon(content)
      if (colon !== -1) {
        // item começa com "chave: valor" → é um mapping
        const kv = parseKey(content.slice(0, colon), itemLine)
        const restRaw = content.slice(colon + 1)
        const trailSplit = splitTrailingComment(restRaw)
        const map = { kind: 'map', entries: [], line: itemLine }
        const entry = {
          key: kv.key,
          keyQuoted: kv.quoted,
          line: itemLine,
          preComments: [...comments],
          trailComment: trailSplit.comment || null,
        }
        entry.value = parseValue(trailSplit.content, nodeIndent, itemLine).node
        map.entries.push(entry)
        comments.length = 0
        parseMappingContinuation(map, nodeIndent)
        value = map
      } else {
        value = parseValue(content, nodeIndent, itemLine).node
      }

      node.items.push({ value, preComments: [...comments], trailComment: itemTrail.comment || null })
      comments.length = 0
    }
    return node
  }

  function parseMappingContinuation(map, parentIndent) {
    for (;;) {
      let k = state.i + 1
      const pre = []
      let subIndent = -1
      while (k < L) {
        const aa = analyze(k)
        if (aa.kind === 'blank') { k++; continue }
        if (aa.kind === 'comment') { pre.push(aa.text); k++; continue }
        if (aa.kind === 'tab-error') throw { key: 'tabIndent', line: aa.line }
        if (aa.indent > parentIndent) { subIndent = aa.indent; break }
        break
      }
      if (subIndent === -1) break
      state.i = k
      const a = analyze(k)
      if (a.body === '...') break
      const sel = splitTrailingComment(a.body)
      const colon = findTopColon(sel.content)
      if (colon === -1) {
        if (a.body === '-' || a.body.startsWith('- ')) break
        throw { key: 'expectColon', line: k + 1 }
      }
      const kv = parseKey(sel.content.slice(0, colon), k + 1)
      const restRaw = sel.content.slice(colon + 1)
      const trailSplit = splitTrailingComment(restRaw)
      const entry = {
        key: kv.key,
        keyQuoted: kv.quoted,
        line: k + 1,
        preComments: pre,
        trailComment: trailSplit.comment || null,
      }
      entry.value = parseValue(trailSplit.content, subIndent, k + 1).node
      const dup = map.entries.find((e) => e.key === entry.key)
      if (dup) warnings.push({ key: 'duplicateKey', line: entry.line, detail: entry.key })
      map.entries.push(entry)
    }
  }

  // ── peeling de marcadores de documento no topo ──
  for (;;) {
    const a = analyze(state.i)
    if (a.kind === 'blank' || a.kind === 'comment') { state.i++; continue }
    if (a.kind === 'content' && a.indent === 0 && (a.body === '---' || a.body === '...')) { state.i++; continue }
    if (a.kind === 'tab-error') return { ok: false, error: { key: 'tabIndent', line: a.line }, warnings }
    break
  }

  // múltiplos documentos = erro claro
  let docs = 0
  for (let k = 0; k < L; k++) {
    const a = analyze(k)
    if (a.kind === 'content' && a.indent === 0 && a.body === '---') docs++
  }
  if (docs > 1) {
    for (let k = 1; k < L; k++) {
      const a = analyze(k)
      if (a.kind === 'content' && a.indent === 0 && a.body === '---') {
        return { ok: false, error: { key: 'multipleDocs', line: k + 1 }, warnings }
      }
    }
  }

  if (state.i >= L) {
    return { ok: true, root: null, warnings }
  }
  const rootAt = analyze(state.i)
  if (rootAt.kind !== 'content') {
    return { ok: true, root: null, warnings }
  }

  let root = null
  try {
    const rootLine = state.i
    const body = rootAt.body
    let rootScalarTrail = null
    if (body === '-' || body.startsWith('- ')) {
      state.i = rootLine - 1
      root = parseSequence(rootAt.indent)
    } else if (findTopColon(body) !== -1) {
      state.i = rootLine - 1
      root = parseMapping(rootAt.indent)
    } else {
      const sc = splitTrailingComment(body)
      rootScalarTrail = sc.comment
      root = parseValue(sc.content, rootAt.indent, rootLine + 1).node
    }
    const tail = []
    if (rootScalarTrail) tail.push(rootScalarTrail.slice(1).trimStart())
    let k = state.i + 1
    while (k < L) {
      const aa = analyze(k)
      if (aa.kind === 'blank') { k++; continue }
      if (aa.kind === 'comment') { tail.push(aa.text); k++; continue }
      if (aa.kind === 'content' && aa.indent === 0 && aa.body === '...') { k++; continue }
      if (aa.kind === 'tab-error') throw { key: 'tabIndent', line: aa.line }
      throw { key: 'strayIndent', line: aa.line }
    }
    state.i = k - 1
    state.trailingComments = tail
  } catch (e) {
    if (e && e.key) return { ok: false, error: { key: e.key, line: e.line || 1, detail: e.detail }, warnings }
    return { ok: false, error: { key: 'generic', line: 1 }, warnings }
  }

  return { ok: true, root, warnings, trailingComments: state.trailingComments }
}

// ─── Re-emissão ──────────────────────────────────────────────

function anchorText(node) {
  if (node && node.anchorName) return `&${node.anchorName} `
  return ''
}

function keyText(entry) {
  if (entry.keyQuoted === "'") return `'${entry.key.replace(/'/g, "''")}'`
  if (entry.keyQuoted === '"') return quoteString(entry.key)
  return entry.key
}

function emitScalar(node, pad, inSeq) {
  if (!node) return 'null'
  const prefix = inSeq ? anchorText(node) : ''
  if (node.kind === 'blockScalar') {
    return blockScalarText(node, pad)
  }
  if (node.kind === 'alias') {
    return `${prefix}*${node.name}`
  }
  let text
  if (node.type === N.string) {
    const raw = node.raw || ''
    if (node.quoted) text = node.quoted === '"' ? quoteString(raw) : `'${raw.replace(/'/g, "''")}'`
    else text = needsQuotes(node) ? quoteString(raw) : raw
  } else {
    text = node.raw || node.text || 'null'
  }
  return prefix + text
}

function blockScalarText(node, pad) {
  const marker = node.style + (node.chomp || '')
  const linesOut = node.pieces.map((p) => (p.blank ? '' : pad + p.text))
  return `${pad}${marker}\n${linesOut.join('\n')}`
}

function emitComments(pre, pad, minify) {
  let out = ''
  if (!minify) {
    for (const c of pre || []) out += `${pad}#${c}\n`
  }
  return out
}

function emitMap(node, indent, minify) {
  let out = ''
  const pad = ' '.repeat(indent)
  for (const e of node.entries) {
    out += emitComments(e.preComments, pad, minify)
    const key = keyText(e)
    const v = e.value
    const trail = e.trailComment && !minify ? ` #${e.trailComment}` : ''
    if (v && v.kind === 'blockScalar') {
      const mark = v.style + (v.chomp || '')
      out += `${pad}${key}: ${anchorText(v)}${mark}${trail}\n`
      out += emitBlockLines(v, pad + '  ')
      continue
    }
    if (v && v.kind === 'map') {
      if (v.entries.length === 0) {
        out += `${pad}${key}:{}${trail}\n`
      } else {
        const a = v.anchorName ? ` &${v.anchorName}` : ''
        out += `${pad}${key}:${a}${trail}\n`
        out += emitMap(v, indent + 2, minify)
      }
      continue
    }
    if (v && v.kind === 'seq') {
      if (v.items.length === 0) {
        out += `${pad}${key}:[]${trail}\n`
      } else {
        const a = v.anchorName ? ` &${v.anchorName}` : ''
        out += `${pad}${key}:${a}${trail}\n`
        out += emitSeq(v, indent + 2, minify)
      }
      continue
    }
    out += `${pad}${key}: ${anchorText(v)}${emitScalar(v, pad, false)}${trail}\n`
  }
  return out
}

function emitSeq(node, indent, minify) {
  let out = ''
  const pad = ' '.repeat(indent)
  for (const it of node.items) {
    const v = it.value
    if (v && v.kind === 'blockScalar') {
      out += emitComments(it.preComments, pad, minify)
      const mark = v.style + (v.chomp || '')
      out += `${pad}- ${anchorText(v)}${mark}${it.trailComment && !minify ? ` #${it.trailComment}` : ''}\n`
      out += emitBlockLines(v, pad + '  ')
      continue
    }
    out += emitComments(it.preComments, pad, minify)
    const trail = it.trailComment && !minify ? ` #${it.trailComment}` : ''
    if (v && (v.kind === 'map' || v.kind === 'seq')) {
      out += `${pad}-${v.anchorName ? ` &${v.anchorName}` : ''}${trail}\n`
      out += emitSeqBody(v, indent + 2, minify)
      continue
    }
    out += `${pad}- ${emitScalar(v, pad, true)}${trail}\n`
  }
  return out
}

function emitBlockLines(v, childPad) {
  let b = ''
  for (const p of v.pieces) b += (p.blank ? '' : childPad + p.text) + '\n'
  return b
}

function emitSeqBody(v, indent, minify) {
  if (v.kind === 'seq') return emitSeq(v, indent, minify)
  let out = ''
  const pad = ' '.repeat(indent)
  for (let k = 0; k < v.entries.length; k++) {
    const e = v.entries[k]
    out += emitComments(e.preComments, pad, minify)
    const key = keyText(e)
    const ev = e.value
    const trail = e.trailComment && !minify ? ` #${e.trailComment}` : ''
    const lead = k === 0 ? '- ' : ''
    if (ev && ev.kind === 'blockScalar') {
      const mark = ev.style + (ev.chomp || '')
      out += `${pad}${lead}${key}: ${mark}\n`
      out += emitBlockLines(ev, pad + '  ')
      continue
    }
    if (ev && ev.kind === 'map') {
      if (ev.entries.length === 0) {
        out += `${pad}${lead}${key}:{}${trail}\n`
      } else {
        const a = ev.anchorName ? ` &${ev.anchorName}` : ''
        out += `${pad}${lead}${key}:${a}${trail}\n`
        out += emitMap(ev, indent + 2, minify)
      }
      continue
    }
    if (ev && ev.kind === 'seq') {
      if (ev.items.length === 0) {
        out += `${pad}${lead}${key}:[]${trail}\n`
      } else {
        const a = ev.anchorName ? ` &${ev.anchorName}` : ''
        out += `${pad}${lead}${key}:${a}${trail}\n`
        out += emitSeq(ev, indent + 2, minify)
      }
      continue
    }
    out += `${pad}${lead}${key}: ${anchorText(ev)}${emitScalar(ev, pad, true)}${trail}\n`
  }
  return out
}

export function countNodes(node) {
  const c = { keys: 0, items: 0, scalars: 0, blocks: 0 }
  const walk = (n) => {
    if (!n) return
    if (n.kind === 'map') {
      c.blocks++
      for (const e of n.entries) { c.keys++; walk(e.value) }
    } else if (n.kind === 'seq') {
      c.blocks++
      for (const it of n.items) { c.items++; walk(it.value) }
    } else {
      c.scalars++
    }
  }
  walk(node)
  return c
}

export function processYaml(input, options = {}) {
  const mode = options.mode || 'format'
  const indent = options.indent || 2
  const minify = mode === 'minify'
  const res = parseYaml(input)

  if (!res.ok) {
    return { ok: false, error: res.error, warnings: res.warnings, output: '', stats: null }
  }
  const warnings = res.warnings

  let output = ''
  let stats = null
  if (mode === 'validate') {
    output = ''
  } else if (mode === 'json') {
    const js = res.root ? scalarToJs(res.root) : null
    output = js === null || js === undefined ? 'null' : JSON.stringify(js, null, 2)
  } else {
    if (res.root) {
      const body = emitInnerByKind(res.root, minify ? 1 : 0, minify)
      output = body
    }
    if (res.trailingComments && res.trailingComments.length && !minify) {
      output += output.endsWith('\n') ? '' : '\n'
      output += res.trailingComments.map((c) => `#${c}`).join('\n')
    }
  }

  output = output
    .split('\n')
    .map((l) => l.replace(/[ \t]+$/, ''))
    .join('\n')
  if (!minify && mode !== 'json') {
    output = output.replace(/\n+$/, '\n')
  }

  const counts = res.root ? countNodes(res.root) : { keys: 0, items: 0, scalars: 0, blocks: 0 }
  stats = {
    ...counts,
    bytesIn: String(input ?? '').length,
    bytesOut: output.length,
  }
  if (minify && stats.bytesIn > 0 && stats.bytesOut < stats.bytesIn) {
    stats.saved = Math.round(((stats.bytesIn - stats.bytesOut) / stats.bytesIn) * 1000) / 10
  }
  return { ok: true, output, warnings, stats, root: res.root }
}

function emitInnerByKind(node, indent, minify) {
  if (node.kind === 'map') return emitMap(node, indent, minify)
  if (node.kind === 'seq') return emitSeq(node, indent, minify)
  // root scalar
  if (node.type === N.null) return ''
  const pad = ' '.repeat(indent)
  const v = emitScalar(node, pad, false)
  return `${pad}${v}\n`
}