// Motor de otimização de SVG — 100% client-side.
// Abordagem segura por DOM (DOMParser + XMLSerializer), não por regex no
// documento inteiro: parseia o XML, remove o que é seguro remover e
// re-serializa. Nunca toca no conteúdo de `<text>`/`<title>`/`<desc>`
// (texto renderizado, whitespace importa) nem de `<style>`/`<script>`.

const EDITOR_NAMESPACES = new Set([
  'http://sodipodi.sourceforge.net/DTD/sodipodi-0.0.dtd',
  'http://inkscape.sourceforge.net/DTD/sodipodi-0.0.dtd',
  'http://www.inkscape.org/namespaces/inkscape',
  'http://ns.adobe.com/AdobeIllustrator/10.0/',
  'http://ns.adobe.com/Extensibility/1.0/',
  'http://ns.adobe.com/Flows/1.0/',
  'http://ns.adobe.com/AdobeSVGViewerExtensions/3.0/',
])

// Elementos cujo conteúdo de texto é renderizado — whitespace neles importa.
const TEXT_BEARING = new Set(['text', 'tspan', 'textPath', 'altGlyph', 'title', 'desc'])

// Elementos cujo conteúdo é código (espaços podem ser significativos).
const RAW_TEXT = new Set(['style', 'script'])

// Atributos de geometria/coordenadas (números puros).
const NUMERIC_ATTRS = new Set([
  'x', 'y', 'x1', 'y1', 'x2', 'y2', 'dx', 'dy', 'cx', 'cy', 'r', 'rx', 'ry',
  'width', 'height', 'd', 'points', 'viewBox',
])

// Atributos de apresentação numéricos (podem ter unidade: %, px, em...).
const PRESENTATION_NUMERIC_ATTRS = new Set([
  'stroke-width', 'stroke-dashoffset', 'stroke-dasharray', 'stroke-miterlimit',
  'opacity', 'fill-opacity', 'stroke-opacity', 'stop-opacity', 'flood-opacity',
  'font-size', 'offset',
])

// Atributos com listas de números separadas (transform...).
const TRANSFORM_ATTRS = new Set(['transform', 'gradientTransform', 'patternTransform'])

function roundStringNumber(token, precision) {
  if (precision < 0) return token
  if (/[eE]/.test(token)) return token
  const base = parseFloat(token)
  if (!Number.isFinite(base)) return token
  const fixed = base.toFixed(precision)
  let out = fixed.indexOf('.') !== -1 ? fixed.replace(/\.?0+$/, '') : fixed
  if (out === '-0') out = '0'
  if (out === '') out = '0'
  return out
}

// Re-escritor de sequências numéricas à prova de fusão de números.
// P/ `d` (keepLetters=true) comandos saem intactos; p/ os demais
// (keepLetters=false) letras viram unidades (`%`, `px`) preservadas.
// Entre dois números que encostariam (ex.: `10.55.5` → `11.5` no round)
// insere um espaço, mantendo a gramática válida.
function reflowNumbers(str, precision, keepLetters) {
  if (!str) return str
  const out = []
  let prevChar = ''
  let i = 0
  while (i < str.length) {
    const ch = str[i]
    const m = /^-?(?:\d+\.?\d*|\.\d+)/.exec(str.slice(i))
    if (m) {
      const raw = m[0]
      const rounded = roundStringNumber(raw, precision)
      if (rounded && prevChar >= '0' && prevChar <= '9' && /[0-9]/.test(rounded[0])) {
        out.push(' ')
      }
      out.push(rounded)
      prevChar = rounded ? rounded[rounded.length - 1] : prevChar
      i += raw.length
      continue
    }
    if (ch === ',') {
      if (out.length && prevChar !== ' ' && prevChar !== '') out.push(' ')
      prevChar = ' '
      i += 1
      continue
    }
    if (keepLetters || /[a-zA-Z%]/.test(ch)) {
      out.push(ch)
      prevChar = ch
      i += 1
      continue
    }
    if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') {
      if (out.length && prevChar !== ' ') out.push(' ')
      prevChar = ' '
      i += 1
      continue
    }
    out.push(ch)
    prevChar = ch
    i += 1
  }
  return out.join('').trim()
}

function minifyStyleAttr(value) {
  if (!value) return value
  return value
    .replace(/\s+/g, ' ')
    .replace(/\s*:\s*/g, ':')
    .replace(/\s*;\s*/g, ';')
    .replace(/;\s*$/g, '')
    .trim()
}

function isWhitespaceOnly(node) {
  return (node.nodeValue || '').trim() === ''
}

function byteLength(str) {
  return new TextEncoder().encode(str).length
}

// ─────────────────────────────────────────────────────────────────────────
// Otimização principal
// ─────────────────────────────────────────────────────────────────────────
export function optimizeSvg(input, options = {}) {
  const opts = {
    removeComments: true,
    removeWhitespace: true,
    removeEditor: true,
    removeEmpty: true,
    unwrapGroups: true,
    roundPrecision: 2,
    ...options,
  }

  const stats = {
    comments: 0,
    whitespace: 0,
    editor: 0,
    empty: 0,
    unwrapped: 0,
    rounded: 0,
  }

  const source = String(input || '').trim()
  if (!source) throw new Error('empty')

  const doc = new DOMParser().parseFromString(source, 'image/svg+xml')
  const parserError = doc.querySelector('parsererror')
  if (parserError) {
    const text = parserError.textContent || 'XML parse error'
    throw new Error(text.split('\n')[0] || 'XML parse error')
  }

  const root = doc.documentElement
  if (!root || root.localName.toLowerCase() !== 'svg') {
    throw new Error('not-svg')
  }

  // 1) Comentários
  if (opts.removeComments) {
    const walker = doc.createTreeWalker(doc, NodeFilter.SHOW_COMMENT)
    const nodes = []
    while (walker.nextNode()) nodes.push(walker.currentNode)
    for (const n of nodes) {
      if (n.parentNode) n.parentNode.removeChild(n)
      stats.comments += 1
    }
  }

  // 2) Whitespace e elementos de editor/metadata
  if (opts.removeWhitespace) {
    const walker = doc.createTreeWalker(doc, NodeFilter.SHOW_TEXT)
    const nodes = []
    while (walker.nextNode()) nodes.push(walker.currentNode)
    for (const node of nodes) {
      const parent = node.parentNode
      if (!parent || parent.nodeType !== Node.ELEMENT_NODE) continue
      if (RAW_TEXT.has(parent.localName)) continue
      if (TEXT_BEARING.has(parent.localName)) continue
      if (!isWhitespaceOnly(node)) continue
      parent.removeChild(node)
      stats.whitespace += 1
    }
  }

  if (opts.removeEditor) {
    const all = Array.from(doc.querySelectorAll('*'))
    for (const el of all) {
      const editor =
        el.localName === 'metadata' ||
        el.localName === 'namedview' ||
        (el.namespaceURI && EDITOR_NAMESPACES.has(el.namespaceURI))
      if (editor) {
        if (el.parentNode) el.parentNode.removeChild(el)
        stats.editor += 1
      }
    }

    // Remove declarações xmlns:* de editor que sobraram sem ninguém usando
    // (o XMLSerializer não poda namespace não utilizado por conta própria).
    const remaining = Array.from(doc.querySelectorAll('*'))
    const usedNs = new Set()
    for (const el of remaining) {
      if (el.namespaceURI) usedNs.add(el.namespaceURI)
      for (const attr of Array.from(el.attributes)) {
        if (attr.namespaceURI) usedNs.add(attr.namespaceURI)
      }
    }
    for (const el of remaining) {
      for (const attr of Array.from(el.attributes)) {
        if (
          attr.name.startsWith('xmlns:') &&
          EDITOR_NAMESPACES.has(attr.value) &&
          !usedNs.has(attr.value)
        ) {
          el.removeAttribute(attr.name)
        }
      }
    }
  }

  // 3) Elementos vazios (sem atributos, sem conteúdo, sem filhos) — pós-ordem
  const postOrder = []
  const walk = (el) => {
    Array.from(el.children).forEach((child) => walk(child))
    postOrder.push(el)
  }
  walk(root)

  for (const el of postOrder) {
    if (el === root) continue
    if (el.attributes.length > 0) continue
    const hasContent = Array.from(el.childNodes).some((c) => {
      if (c.nodeType === Node.ELEMENT_NODE) return true
      if (c.nodeType === Node.TEXT_NODE || c.nodeType === Node.CDATA_SECTION_NODE) {
        return (c.nodeValue || '').trim() !== ''
      }
      return false
    })
    if (hasContent) continue
    if (el.parentNode) el.parentNode.removeChild(el)
    stats.empty += 1
  }

  // 4) Desembrulhar <g> sem atributos (filhos sobem sem mudar a renderização)
  if (opts.unwrapGroups) {
    const groups = Array.from(doc.querySelectorAll('g'))
    for (const g of groups) {
      if (g === root) continue
      if (g.attributes.length > 0) continue
      const parent = g.parentNode
      if (!parent) continue
      const children = Array.from(g.childNodes)
      for (const child of children) parent.insertBefore(child, g)
      parent.removeChild(g)
      stats.unwrapped += 1
    }
  }

  // 5) Precisão: arredonda números em atributos de geometria/apresentação
  if (opts.roundPrecision >= 0) {
    const all = Array.from(doc.querySelectorAll('*'))
    for (const el of all) {
      for (const attr of Array.from(el.attributes)) {
        const isGeom = NUMERIC_ATTRS.has(attr.name)
        const isPres = PRESENTATION_NUMERIC_ATTRS.has(attr.name)
        const isTransform = TRANSFORM_ATTRS.has(attr.name)
        if (!isGeom && !isPres && !isTransform) continue
        const normalized =
          attr.name === 'd'
            ? reflowNumbers(attr.value, opts.roundPrecision, true)
            : reflowNumbers(attr.value, opts.roundPrecision, false)
        if (normalized !== attr.value) {
          el.setAttribute(attr.name, normalized)
          stats.rounded += 1
        }
      }
    }
  }

  // 6) Minifica o atributo style (espaços redundantes)
  if (opts.removeWhitespace) {
    const all = Array.from(doc.querySelectorAll('*'))
    for (const el of all) {
      if (!el.hasAttribute('style')) continue
      const cleaned = minifyStyleAttr(el.getAttribute('style'))
      if (cleaned !== el.getAttribute('style')) el.setAttribute('style', cleaned)
    }
  }

  const svg = new XMLSerializer().serializeToString(root)

  return {
    svg,
    sizeBefore: byteLength(source),
    sizeAfter: byteLength(svg),
    stats,
  }
}