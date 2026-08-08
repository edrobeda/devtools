// ─────────────────────────────────────────────────────────────
// CSS Formatter / Minifier — 100% client-side, zero dependências.
// Um tokenizer próprio (strings, comentários, parens, colchetes)
// + um parser em escopos indentados; a formatação re-emite os
// tokens a partir das posições originais, então strings, URLs e
// comentários nunca são tocados por dentro.
// ─────────────────────────────────────────────────────────────

// Erros detectados pelo tokenizer — os code são traduzidos na página.
export function tokenizeCss(css) {
  const tokens = []
  let i = 0
  const n = css.length
  let paren = 0
  let gap = false

  while (i < n) {
    const c = css[i]

    if (/\s/.test(c)) {
      let j = i
      while (j < n && /\s/.test(css[j])) j++
      gap = tokens.length > 0
      i = j
      continue
    }

    if (c === '/' && css[i + 1] === '*') {
      const end = css.indexOf('*/', i + 2)
      if (end === -1) return { errorKey: 'commentUnclosed', pos: i }
      tokens.push({ type: 'comment', text: css.slice(i, end + 2), paren, gap })
      gap = false
      i = end + 2
      continue
    }

    if (c === '"' || c === "'") {
      let j = i + 1
      let closed = false
      while (j < n) {
        if (css[j] === '\\') {
          j += 2
          continue
        }
        if (css[j] === c) {
          closed = true
          j++
          break
        }
        j++
      }
      if (!closed) return { errorKey: 'stringUnclosed', pos: i }
      tokens.push({ type: 'string', text: css.slice(i, j), paren, gap })
      gap = false
      i = j
      continue
    }

    if (c === '{' || c === '}') {
      tokens.push({ type: 'brace', text: c, paren, gap })
      gap = false
      i++
      continue
    }

    if (c === ';' || c === ',') {
      tokens.push({ type: c === ';' ? 'sc' : 'comma', text: c, paren, gap })
      gap = false
      i++
      continue
    }

    let j = i
    while (j < n) {
      const ch = css[j]
      if (ch === '"' || ch === "'" || ch === ';' || ch === ',') break
      if (ch === '{' || ch === '}') break
      if (ch === '/' && css[j + 1] === '*') break
      if (ch === '/' && css[j + 1] !== '*') {
        // barra sozinha (divisão tipo `16 / 9` ou `/` em url)
        j++
        break
      }
      if (/\s/.test(ch)) break
      j++
    }
    const text = css.slice(i, j)
    let opens = 0
    let closes = 0
    for (let k = 0; k < text.length; k++) {
      if (text[k] === '(') opens++
      else if (text[k] === ')') closes++
    }
    tokens.push({ type: 'word', text, paren, gap })
    gap = false
    paren += opens - closes
    if (paren < 0) return { errorKey: 'parenClose', pos: i }
    i = j
  }

  if (paren !== 0) return { errorKey: 'parenOpen', pos: i }
  return { tokens, errorKey: null, pos: -1 }
}

// Checa balanço de chaves (só as que estão fora de parênteses contam).
function braceBalance(tokens) {
  let depth = 0
  let firstBad = -1
  for (const t of tokens) {
    if (t.type !== 'brace' || t.paren !== 0) continue
    depth += t.text === '{' ? 1 : -1
    if (depth < 0) {
      firstBad = firstBad === -1 ? -1 : firstBad
      depth = 0
    }
  }
  return depth
}

function hasUnbalancedClose(tokens) {
  let depth = 0
  for (const t of tokens) {
    if (t.type !== 'brace' || t.paren !== 0) continue
    depth += t.text === '{' ? 1 : -1
    if (depth < 0) return true
  }
  return false
}

function extract(tokens, idx) {
  // tokens[idx] é '{'. Devolve o corpo até o '}' correspondente e o índice
  // logo após o fechamento (ou tokens.length se não fechar).
  const body = []
  let depth = 1 // a chave em idx já foi consumida
  let k = idx + 1
  for (; k < tokens.length; k++) {
    const t = tokens[k]
    if (t.type === 'brace' && t.paren === 0) {
      depth += t.text === '{' ? 1 : -1
      if (depth === 0) {
        k++
        break
      }
    }
    body.push(t)
  }
  return { body, end: k }
}

function parseScope(tokens) {
  // Converte uma sequência de tokens em: declarações (até ';') e regras
  // (header até '{' + corpo recursivo). Comentários que acabam sozinhos
  // viram itens tipo comment.
  const items = []
  let i = 0
  const n = tokens.length

  while (i < n) {
    let j = i
    while (j < n) {
      const t = tokens[j]
      if (t.type === 'sc' && t.paren === 0) break
      if (t.type === 'brace' && t.paren === 0) break
      j++
    }
    const toks = tokens.slice(i, j)
    const t = tokens[j]

    if (!t) {
      if (toks.length) items.push({ type: 'decl', toks })
      break
    }
    if (t.type === 'sc') {
      if (toks.length) items.push({ type: 'decl', toks })
      i = j + 1
      continue
    }
    if (t.text === '{') {
      const { body, end } = extract(tokens, j)
      items.push({ type: 'rule', header: toks, body: parseScope(body) })
      i = end
      continue
    }
    // '}' órfão — validação prévia já barra, mas defende aqui:
    if (toks.length) items.push({ type: 'decl', toks })
    i = j + 1
  }
  return items
}

const wordLike = (t) => t.type === 'word' || t.type === 'string' || t.type === 'comment'
const IDENT_END = /[a-zA-Z0-9_%-]$/
const IDENT_START = /[a-zA-Z0-9_]/

// Reconstrói os tokens em texto. 'pretty' respeita os espaços originais do
// autor e só acrescenta espaço entre palavras que ficaram coladas; 'min'
// remove espaços, conservando apenas aquele que evita fundir dois
// identificadores de verdade. Strings, comentários e url(...) passam
// intactos porque são tokens únicos.
function reconstruct(toks, mode) {
  let out = ''
  let prev = null
  for (const t of toks) {
    const wl = wordLike(t)
    if (out && prev) {
      const aEnd = prev.text.slice(-1)
      const bStart = t.text[0]
      if (mode === 'min') {
        if (wl && wordLike(prev)) {
          // palavra + '(' precisa de espaço (e.g. `and (`, `@media (`) —
          // e ')' + palavra também (`url(x)no-repeat` vira um token só).
          if (bStart === '(' || (aEnd === ')' && IDENT_START.test(bStart))) out += ' '
          else if (IDENT_END.test(aEnd) && IDENT_START.test(bStart)) out += ' '
        }
      } else if (t.gap || (wl && wordLike(prev) && aEnd === ')')) {
        out += ' '
      }
    }
    out += t.text
    prev = t
  }
  return out
}

// Acha o ':' que separa propriedade de valor — só o primeiro em profundidade
// de parêntese zero, então `url(data:image/...)` não engana o split.
function splitDecl(toks) {
  for (let i = 0; i < toks.length; i++) {
    const t = toks[i]
    if (t.paren !== 0 || t.type !== 'word') continue
    const idx = t.text.indexOf(':')
    if (idx !== -1) {
      const head = toks.slice(0, i).concat(
        idx > 0 ? [{ ...t, text: t.text.slice(0, idx) }] : []
      )
      const tail = [
        { ...t, text: t.text.slice(idx + 1), gap: true },
        ...toks.slice(i + 1),
      ]
      return { prop: head, value: tail }
    }
  }
  return null
}

function isCommentOnly(toks) {
  return toks.length > 0 && toks.every((t) => t.type === 'comment')
}

function renderDecl(toks, mode, opts) {
  if (isCommentOnly(toks)) {
    const text = reconstruct(toks, 'pretty')
    return { kind: 'comment', text, hasSemi: false }
  }
  let work = toks
  if (mode === 'min' && !opts.minifyKeepComments && work.some((t) => t.type === 'comment')) {
    work = work.filter((t) => t.type !== 'comment')
    if (work.length === 0) return { kind: 'comment', text: '', hasSemi: false }
  }
  const split = mode === 'pretty' ? splitDecl(work) : null
  if (split) {
    const prop = reconstruct(split.prop, 'pretty')
    const value = reconstruct(split.value, mode)
    if (!value) return { kind: 'decl', text: prop, hasSemi: true }
    return { kind: 'decl', text: `${prop}: ${value}`, hasSemi: true }
  }
  return { kind: 'decl', text: reconstruct(work, mode), hasSemi: true }
}

function renderHeader(toks, mode, opts) {
  // Comentários à frente do seletor viram linhas próprias no pretty e somem
  // no minify (a menos que minifyKeepComments). `pre` = comentários soltos,
  // `headers` = o seletor/at-rule em si.
  let work = toks
  if (mode === 'min' && !opts.minifyKeepComments) {
    work = work.filter((t) => t.type !== 'comment')
  }
  const pre = []
  while (work.length && work[0].type === 'comment') {
    pre.push(reconstruct([work[0]], 'pretty').trim())
    work = work.slice(1)
  }
  const headers = []
  if (mode === 'pretty') {
    let cur = []
    for (const t of work) {
      if (t.type === 'comma' && t.paren === 0) {
        const s = reconstruct(cur, 'pretty').trim()
        if (s) headers.push(s)
        cur = []
      } else {
        cur.push(t)
      }
    }
    const s = reconstruct(cur, 'pretty').trim()
    if (s) headers.push(s)
  } else {
    const s = reconstruct(work, 'min').trim()
    if (s) headers.push(s)
  }
  return { pre, headers }
}

export function renderItems(items, depth, mode, opts) {
  const ind = '  '.repeat(depth)
  const parts = []
  const pushPre = (pre) => {
    for (const p of pre) parts.push({ type: 'line', value: `${ind}${p}` })
  }
  for (const it of items) {
    if (it.type === 'decl') {
      const { text, hasSemi } = renderDecl(it.toks, mode, opts)
      if (mode === 'min') {
        if (isCommentOnly(it.toks)) {
          if (!opts.minifyKeepComments) continue
          parts.push({ type: 'text', value: text })
        } else {
          parts.push({ type: 'text', value: text + ';' })
        }
      } else {
        parts.push({ type: 'line', value: `${ind}${text}${hasSemi ? ';' : ''}` })
      }
    } else {
      const { headers, pre } = renderHeader(it.header, mode, opts)
      const inner = renderItems(it.body, depth + 1, mode, opts)
      const empty = it.body.length === 0
      if (mode === 'min') {
        if (headers.length === 0) {
          if (pre.length && opts.minifyKeepComments) {
            parts.push({ type: 'text', value: pre.join(' ') })
          }
          continue
        }
        if (pre.length && opts.minifyKeepComments) {
          parts.push({ type: 'text', value: `${pre.join(' ')}${headers[0]}{${empty ? '' : inner.text}}` })
        } else {
          parts.push({ type: 'text', value: `${headers[0]}{${empty ? '' : inner.text}}` })
        }
      } else if (empty) {
        pushPre(pre)
        if (headers.length) parts.push({ type: 'line', value: `${ind}${headers[0]} {}` })
      } else {
        pushPre(pre)
        if (headers.length) {
          const headBlock =
            headers.length === 1
              ? `${ind}${headers[0]}`
              : headers.map((h) => `${ind}${h}`).join(',\n')
          parts.push({
            type: 'block',
            value: `${headBlock} {\n${inner.text}\n${ind}}`,
          })
        }
      }
    }
  }

  if (mode === 'min') {
    return { text: parts.map((p) => p.value).join(''), empty: items.length === 0 }
  }

  // pretty — entre regras-raiz entra uma linha em branco pra separar visualmente
  let chunks = []
  let i = 0
  while (i < parts.length) {
    const p = parts[i]
    if (depth === 0 && p.type === 'block' && i + 1 < parts.length) {
      chunks.push(p.value)
      chunks.push('')
    } else {
      chunks.push(p.value)
    }
    i++
  }
  return { text: chunks.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd(), empty: parts.length === 0 }
}

// Ponto de entrada: formata (pretty) ou minifica (min) um CSS.
export function formatCss(css, mode = 'pretty', opts = {}) {
  const { tokens, errorKey, pos } = tokenizeCss(css)
  if (errorKey) return { ok: false, error: errorKey, pos }
  if (hasUnbalancedClose(tokens)) {
    return { ok: false, error: 'braceExtra', pos: -1 }
  }
  const balance = braceBalance(tokens)
  if (balance !== 0) return { ok: false, error: 'braceUnclosed', pos: -1 }
  const root = parseScope(tokens)
  const out = renderItems(root, 0, mode, opts)
  return { ok: true, text: out.text, tree: root }
}

export function countStats(tree) {
  let rules = 0
  let decls = 0
  let comments = 0
  const walk = (items) => {
    for (const it of items) {
      if (it.type === 'decl') {
        if (isCommentOnly(it.toks)) comments++
        else decls++
      } else {
        rules++
        walk(it.body)
      }
    }
  }
  walk(tree)
  return { rules, decls, comments }
}