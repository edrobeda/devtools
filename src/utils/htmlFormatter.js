// Formatador / minificador de HTML — 100% client-side, sem dependência.
//
// A técnica: DOMParser com MIME 'text/html' (o parser REAL do navegador)
// corrige HTML malformado como um browser faria, e a formatação é apenas
// re-serializar a árvore resultante. As regras:
//   - elementos "de linha" (span, a, strong, em...) ficam inline junto do
//     texto; elementos de bloco (div, p, ul, li, table...) ganham uma linha
//     própria por nível de indentação;
//   - elementos void (img, br, input, meta, link...) nunca têm fechamento;
//   - pre/textarea/style/script são preservados verbatim (espaços e quebras);
//   - o whitespace de texto é colapsado como o HTML renderiza (por isso uma
//     sequência de espaços vira um espaço, e whitespace entre blocos some);
//   - atributos booleanos (checked, disabled...) saem sem `=""`.

const INLINE_TAGS = new Set([
  'a', 'abbr', 'acronym', 'b', 'bdi', 'bdo', 'big', 'br', 'button', 'cite',
  'code', 'data', 'del', 'dfn', 'em', 'i', 'img', 'input', 'ins', 'kbd',
  'label', 'map', 'mark', 'meter', 'noscript', 'object', 'output', 'progress',
  'q', 'rp', 'rt', 'ruby', 's', 'samp', 'select', 'small', 'span', 'strong',
  'sub', 'sup', 'svg', 'template', 'textarea', 'time', 'tt', 'u', 'var', 'wbr',
])

const VOID_TAGS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta',
  'param', 'source', 'track', 'wbr',
  // folhas de SVG comuns (não têm conteúdo próprio no HTML)
  'circle', 'ellipse', 'image', 'line', 'path', 'polygon', 'polyline', 'rect', 'stop', 'use',
])

const PRESERVE_TAGS = new Set(['pre', 'textarea', 'style', 'script'])

const BOOLEAN_ATTRS = new Set([
  'allowfullscreen', 'async', 'autofocus', 'autoplay', 'checked', 'controls',
  'default', 'defer', 'disabled', 'download', 'formnovalidate', 'hidden',
  'ismap', 'itemscope', 'loop', 'multiple', 'muted', 'nomodule', 'novalidate',
  'open', 'playsinline', 'readonly', 'required', 'reversed', 'selected',
])

function attrsString(el) {
  let s = ''
  for (const a of el.attributes) {
    if (BOOLEAN_ATTRS.has(a.name) && (a.value === '' || a.value === a.name)) {
      s += ` ${a.name}`
    } else {
      s += ` ${a.name}="${a.value
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')}"`
    }
  }
  return s
}

function isInline(el) {
  return INLINE_TAGS.has(el.tagName.toLowerCase())
}

// Tem algum elemento de bloco na árvore abaixo de `el`? (o que decide se um
// elemento "parece inline" ainda precisa quebrar linha por dentro)
function hasBlockChild(el) {
  for (const c of el.childNodes) {
    if (c.nodeType === 1) {
      if (!isInline(c)) return true
      if (hasBlockChild(c)) return true
    }
  }
  return false
}

function collapseWs(s) {
  return s.replace(/\s+/g, ' ')
}

// Emite um nó em contexto inline (texto + elementos de linha, sem quebras).
function emitInline(node, opts) {
  if (node.nodeType === 3) return collapseWs(node.nodeValue)
  if (node.nodeType === 8) {
    return opts.minify && opts.removeComments ? '' : `<!--${node.nodeValue}-->`
  }
  const tag = node.tagName.toLowerCase()
  const open = `<${tag}${attrsString(node)}>`
  if (VOID_TAGS.has(tag)) return open
  if (PRESERVE_TAGS.has(tag)) return `${open}${node.innerHTML}</${tag}>`
  let inner = ''
  for (const c of node.childNodes) inner += emitInline(c, opts)
  inner = collapseWs(inner).trim()
  return inner ? `${open}${inner}</${tag}>` : `${open}</${tag}>`
}

// Emite uma lista de nós no nível `level` (filhos de um bloco ou do topo).
// Nós inline/texto são acumulados numa linha só; elementos de bloco viram
// linhas próprias. Retorna um array de linhas (no minify, sem indentação).
function emitChildren(nodes, level, opts) {
  const pad = opts.minify ? '' : ' '.repeat(opts.indent).repeat(level)
  const lines = []
  let run = []
  const flush = () => {
    if (!run.length) return
    const line = collapseWs(run.join(''))
    if (line.trim()) lines.push(`${pad}${line.trim()}`)
    run = []
  }
  for (const c of nodes) {
    if (c.nodeType === 3) {
      const t = collapseWs(c.nodeValue)
      if (t) run.push(t)
    } else if (c.nodeType === 8) {
      if (!(opts.minify && opts.removeComments)) run.push(`<!--${c.nodeValue}-->`)
    } else if (isInline(c) && !hasBlockChild(c)) {
      run.push(emitInline(c, opts))
    } else {
      flush()
      lines.push(emitBlock(c, level, opts))
    }
  }
  flush()
  return lines
}

// Emite um elemento de bloco (ou raiz de nível topo) inteiro.
function emitBlock(node, level, opts) {
  const pad = opts.minify ? '' : ' '.repeat(opts.indent).repeat(level)
  const tag = node.tagName.toLowerCase()
  const open = `<${tag}${attrsString(node)}>`
  if (VOID_TAGS.has(tag)) return `${pad}${open}`
  if (PRESERVE_TAGS.has(tag)) return `${pad}${open}${node.innerHTML}</${tag}>`
  const children = [...node.childNodes]
  const hasBlock = children.some((c) => c.nodeType === 1 && !isInline(c))
  if (!hasBlock) {
    let inner = ''
    for (const c of children) inner += emitInline(c, opts)
    inner = collapseWs(inner).trim()
    return `${pad}${open}${inner ? `${inner}</${tag}>` : `</${tag}>`}`
  }
  const body = emitChildren(children, level + 1, opts).join(opts.minify ? '' : '\n')
  if (opts.minify) return `${open}${body}</${tag}>`
  return `${pad}${open}\n${body}\n${pad}</${tag}>`
}

function countStats(doc) {
  const s = { elements: 0, attrs: 0, comments: 0 }
  const walk = (nodes) => {
    for (const n of nodes) {
      if (n.nodeType === 1) {
        s.elements++
        s.attrs += n.attributes.length
        walk(n.childNodes)
      } else if (n.nodeType === 8) {
        s.comments++
      }
    }
  }
  walk(doc.childNodes)
  return s
}

// `formatHtml(input, { minify, indent, removeComments })` -> { text, stats }
export function formatHtml(input, opts = {}) {
  const cfg = {
    minify: !!opts.minify,
    indent: opts.indent || 2,
    removeComments: opts.removeComments !== false,
  }
  const doc = new DOMParser().parseFromString(input, 'text/html')
  const isFullDoc = /<html[\s>]/i.test(input)
  const headKids = [...doc.head.childNodes].filter((n) =>
    n.nodeType === 3 ? !!n.nodeValue.trim() : true
  )

  let text
  if (isFullDoc) {
    const parts = []
    for (const n of doc.childNodes) {
      if (n.nodeType === 10) parts.push(`<!DOCTYPE ${n.name}>`)
      else if (n.nodeType === 1) parts.push(emitBlock(n, 0, cfg))
    }
    text = parts.join('\n')
  } else {
    // Fragmento: o parser coloca meta/link/style/title no <head> mesmo em
    // fragmento — juntamos head+body de volta pra nada sumir.
    const top = headKids.length ? [...headKids, ...doc.body.childNodes] : [...doc.body.childNodes]
    text = emitChildren(top, 0, cfg).join(cfg.minify ? '' : '\n')
  }

  return { text, stats: countStats(doc) }
}
