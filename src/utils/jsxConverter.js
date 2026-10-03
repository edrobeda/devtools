/**
 * Motor de serialização markup -> JSX, compartilhado por
 * /tools/html-to-jsx-converter e /tools/svg-to-jsx-converter.
 *
 * Antes cada página mantinha uma cópia privada deste mesmo motor (camelCase,
 * splitStyle, styleToObject, buildAttrs, render) — duas implementações da mesma
 * arquitetura que já tinham divergido. Esta é a versão canônica: o superconjunto
 * das duas. O que realmente difere entre HTML e SVG vira parâmetro, não cópia:
 *
 *   - attrMap      o dicionário de atributos de cada lado (class/htmlFor no HTML,
 *                  stroke-width/fill-rule etc. no SVG)
 *   - parseMode    MIME type do DOMParser ('text/html' ou 'image/svg+xml')
 *   - root         raiz percorrida ('body' itera os filhos e embrulha em
 *                  fragmento quando há mais de um; 'documentElement' renderiza
 *                  o próprio elemento raiz, o <svg>)
 *
 * 100% client-side via DOMParser, sem dependências.
 */

/**
 * Tags sem conteúdo: sempre serializadas como <tag /> em JSX. Mesma lista de 15
 * tags nas duas cópias originais (area, base, br, col, embed, hr, img, input,
 * link, meta, param, source, track, wbr + entradas compartilhadas).
 */
export const VOID_ELEMENTS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link',
  'meta', 'param', 'source', 'track', 'wbr',
])

/**
 * Atributos que em JSX são props booleanas (valor vazio). Superconjunto das duas
 * cópias originais, que já divergiam: o lado HTML tinha `inert` e o lado SVG tinha
 * `noValidate`.
 */
export const BOOLEAN_ATTRS = new Set([
  'allowFullScreen', 'async', 'autoFocus', 'autoPlay', 'controls', 'default',
  'defer', 'disabled', 'formNoValidate', 'hidden', 'inert', 'loop', 'muted',
  'noModule', 'open', 'playsInline', 'readOnly', 'required', 'reversed',
  'selected', 'multiple', 'noValidate',
])

export function camelCase(prop) {
  if (prop.startsWith('-webkit-')) {
    return 'Webkit' + prop.slice(8).replace(/-([a-z])/g, (_, c) => c.toUpperCase())
  }
  if (prop.startsWith('-moz-')) {
    return 'Moz' + prop.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase())
  }
  if (prop.startsWith('-ms-')) {
    return 'ms' + prop.slice(4).replace(/-([a-z])/g, (_, c) => c.toUpperCase())
  }
  return prop.replace(/-([a-z])/g, (_, c) => c.toUpperCase()).replace(/-([A-Z])/g, (_, c) => c.toLowerCase())
}

export function escapeJSXString(s) {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
}

export function splitStyle(style) {
  const out = []
  let cur = ''
  let depth = 0
  for (const ch of style) {
    if (ch === '(') depth++
    else if (ch === ')') depth--
    if (ch === ';' && depth === 0) {
      out.push(cur)
      cur = ''
      continue
    }
    cur += ch
  }
  if (cur.trim()) out.push(cur)
  return out
}

export function styleToObject(style) {
  const parts = []
  for (const decl of splitStyle(style)) {
    const idx = decl.indexOf(':')
    if (idx === -1) continue
    const prop = camelCase(decl.slice(0, idx).trim())
    const val = decl.slice(idx + 1).trim()
    if (!prop) continue
    parts.push(prop + ": '" + escapeJSXString(val) + "'")
  }
  return parts.join(', ')
}

function buildAttrs(attrs, attrMap) {
  let out = ''
  for (const a of attrs) {
    const name = a.name
    const value = a.value

    // data-* and aria-* pass through unchanged
    if (name.startsWith('data-') || name.startsWith('aria-')) {
      if (value.indexOf('"') !== -1) {
        out += ' ' + name + "{'" + escapeJSXString(value) + "'}"
      } else {
        out += ' ' + name + '="' + value + '"'
      }
      continue
    }

    if (name === 'style') {
      out += ' style={{' + styleToObject(value) + '}}'
      continue
    }

    let jsxName = attrMap[name] || name

    // Fallback: if still has a dash (unlisted attribute), camelCase it
    if (jsxName.indexOf('-') !== -1 && !/^(data-|aria-)/.test(name)) {
      jsxName = camelCase(jsxName)
    }

    // Boolean attributes
    if (BOOLEAN_ATTRS.has(jsxName) && (value === '' || value.toLowerCase() === jsxName.toLowerCase())) {
      out += ' ' + jsxName
      continue
    }

    if (value.indexOf('"') !== -1) {
      out += ' ' + jsxName + "{'" + escapeJSXString(value) + "'}"
    } else {
      out += ' ' + jsxName + '="' + value + '"'
    }
  }
  return out
}

function render(node, depth, attrMap, voidElements) {
  const ind = '  '.repeat(depth)
  if (node.nodeType === 3) {
    const t = node.nodeValue
    if (!t || !t.trim()) return ''
    return ind + "{'" + escapeJSXString(t).replace(/\r\n|\r|\n/g, '\\n') + "'}"
  }
  if (node.nodeType === 8) {
    return ind + '{/* ' + node.nodeValue + ' */}'
  }
  if (node.nodeType !== 1) return ''

  const tag = node.tagName.toLowerCase()
  const attrs = buildAttrs(node.attributes, attrMap)

  if (voidElements.has(tag)) {
    return ind + '<' + tag + attrs + ' />'
  }

  const children = []
  for (const child of node.childNodes) {
    const s = render(child, depth + 1, attrMap, voidElements)
    if (s) children.push(s)
  }

  if (children.length === 0) {
    return ind + '<' + tag + attrs + ' />'
  }
  return ind + '<' + tag + attrs + '>\n' + children.join('\n') + '\n' + ind + '</' + tag + '>'
}

/**
 * Converte markup em JSX.
 *
 * @param {string} markup           HTML/SVG colado pelo usuário.
 * @param {object} [opts]
 * @param {object} [opts.attrMap]   mapa de atributo original -> prop JSX.
 * @param {Set}    [opts.voidElements] tags sem conteúdo.
 * @param {string} [opts.parseMode] MIME type do DOMParser.
 * @param {string} [opts.root]      'body' (fragmento quando >1 raiz) ou
 *                                  'documentElement' (um único elemento raiz).
 * @returns {string} JSX gerado, ou '' se não houver nada a serializar.
 */
export function convertMarkupToJsx(markup, opts = {}) {
  const {
    attrMap = {},
    voidElements = VOID_ELEMENTS,
    parseMode = 'text/html',
    root = 'body',
  } = opts

  const doc = new DOMParser().parseFromString(markup, parseMode)

  const parts = []

  if (root === 'documentElement') {
    const s = render(doc.documentElement, 0, attrMap, voidElements)
    if (s) parts.push(s)
  } else {
    for (const child of doc.body.childNodes) {
      const s = render(child, 0, attrMap, voidElements)
      if (s) parts.push(s)
    }
  }

  if (parts.length === 0) return ''
  if (parts.length === 1) return parts[0]

  // JSX exige uma única raiz: múltiplos elementos viram um fragmento <>
  return '<>\n' + parts.map((p) => '  ' + p).join('\n') + '\n</>'
}