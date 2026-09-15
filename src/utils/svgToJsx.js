/**
 * SVG → JSX converter engine.
 * Parses SVG via DOMParser (text/xml), walks the tree and serialises each node
 * with React-compatible attribute names. 100 % client-side, no dependencies.
 */

const SVG_ATTR_MAP = {
  'alignment-baseline': 'alignmentBaseline',
  'baseline-shift': 'baselineShift',
  'class': 'className',
  'clip-path': 'clipPath',
  'clip-rule': 'clipRule',
  'color-interpolation': 'colorInterpolation',
  'color-interpolation-filters': 'colorInterpolationFilters',
  'color-profile': 'colorProfile',
  'color-rendering': 'colorRendering',
  'dominant-baseline': 'dominantBaseline',
  'enable-background': 'enableBackground',
  'fill-opacity': 'fillOpacity',
  'fill-rule': 'fillRule',
  'flood-color': 'floodColor',
  'flood-opacity': 'floodOpacity',
  'font-family': 'fontFamily',
  'font-size': 'fontSize',
  'font-size-adjust': 'fontSizeAdjust',
  'font-stretch': 'fontStretch',
  'font-style': 'fontStyle',
  'font-variant': 'fontVariant',
  'font-weight': 'fontWeight',
  'glyph-name': 'glyphName',
  'glyph-orientation-horizontal': 'glyphOrientationHorizontal',
  'glyph-orientation-vertical': 'glyphOrientationVertical',
  'horiz-adv-x': 'horizAdvX',
  'horiz-origin-x': 'horizOriginX',
  'image-rendering': 'imageRendering',
  'letter-spacing': 'letterSpacing',
  'lighting-color': 'lightingColor',
  'marker-end': 'markerEnd',
  'marker-mid': 'markerMid',
  'marker-start': 'markerStart',
  'overline-position': 'overlinePosition',
  'overline-thickness': 'overlineThickness',
  'paint-order': 'paintOrder',
  'pointer-events': 'pointerEvents',
  'rendering-intent': 'renderingIntent',
  'shape-rendering': 'shapeRendering',
  'stop-color': 'stopColor',
  'stop-opacity': 'stopOpacity',
  'strikethrough-position': 'strikethroughPosition',
  'strikethrough-thickness': 'strikethroughThickness',
  'stroke-dasharray': 'strokeDasharray',
  'stroke-dashoffset': 'strokeDashoffset',
  'stroke-linecap': 'strokeLinecap',
  'stroke-linejoin': 'strokeLinejoin',
  'stroke-miterlimit': 'strokeMiterlimit',
  'stroke-opacity': 'strokeOpacity',
  'stroke-width': 'strokeWidth',
  'text-anchor': 'textAnchor',
  'text-decoration': 'textDecoration',
  'text-rendering': 'textRendering',
  'underline-position': 'underlinePosition',
  'underline-thickness': 'underlineThickness',
  'unicode-bidi': 'unicodeBidi',
  'unicode-range': 'unicodeRange',
  'units-per-em': 'unitsPerEm',
  'v-alphabetic': 'vAlphabetic',
  'v-hanging': 'vHanging',
  'v-ideographic': 'vIdeographic',
  'v-mathematical': 'vMathematical',
  'vector-effect': 'vectorEffect',
  'vert-adv-y': 'vertAdvY',
  'vert-origin-x': 'vertOriginX',
  'vert-origin-y': 'vertOriginY',
  'word-spacing': 'wordSpacing',
  'writing-mode': 'writingMode',
  'x-height': 'xHeight',
  'x-channel-selector': 'xChannelSelector',
  'y-channel-selector': 'yChannelSelector',
  'z': 'z',
  // HTML-transported in SVG (e.g. <foreignObject>)
  'accesskey': 'accessKey',
  'autocomplete': 'autoComplete',
  'autoplay': 'autoPlay',
  'cellpadding': 'cellPadding',
  'cellspacing': 'cellSpacing',
  'colspan': 'colSpan',
  'contenteditable': 'contentEditable',
  'crossorigin': 'crossOrigin',
  'datetime': 'dateTime',
  'enctype': 'encType',
  'formaction': 'formAction',
  'formenctype': 'formEncType',
  'formmethod': 'formMethod',
  'formnovalidate': 'formNoValidate',
  'formtarget': 'formTarget',
  'frameborder': 'frameBorder',
  'hreflang': 'hrefLang',
  'inputmode': 'inputMode',
  'maxlength': 'maxLength',
  'minlength': 'minLength',
  'nomodule': 'noModule',
  'novalidate': 'noValidate',
  'playsinline': 'playsInline',
  'readonly': 'readOnly',
  'referrerpolicy': 'referrerPolicy',
  'rowspan': 'rowSpan',
  'spellcheck': 'spellCheck',
  'srcdoc': 'srcDoc',
  'srclang': 'srcLang',
  'srcset': 'srcSet',
  'tabindex': 'tabIndex',
  'usemap': 'useMap',
  'crossorigin': 'crossOrigin',
  'allowfullscreen': 'allowFullScreen',
}

const BOOLEAN_ATTRS = new Set([
  'allowFullScreen', 'async', 'autoFocus', 'autoPlay', 'controls', 'default',
  'defer', 'disabled', 'formNoValidate', 'hidden', 'loop', 'muted',
  'noModule', 'open', 'playsInline', 'readOnly', 'required', 'reversed',
  'selected', 'multiple', 'noValidate',
])

const SVG_VOID_ELEMENTS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link',
  'meta', 'param', 'source', 'track', 'wbr',
])

function camelCase(prop) {
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

function escapeJSXString(s) {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
}

function splitStyle(style) {
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

function styleToObject(style) {
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

function buildAttrs(attrs) {
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

    let jsxName = SVG_ATTR_MAP[name] || name

    // Fallback: if still has a dash (unknown SVG attribute), camelCase it
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

function render(node, depth) {
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
  const attrs = buildAttrs(node.attributes)

  if (SVG_VOID_ELEMENTS.has(tag)) {
    return ind + '<' + tag + attrs + ' />'
  }

  const children = []
  for (const child of node.childNodes) {
    const s = render(child, depth + 1)
    if (s) children.push(s)
  }

  if (children.length === 0) {
    return ind + '<' + tag + attrs + ' />'
  }
  return ind + '<' + tag + attrs + '>\n' + children.join('\n') + '\n' + ind + '</' + tag + '>'
}

export function convertSvgToJsx(svg) {
  // Strip XML declaration if present (<?xml ...?>)
  const cleaned = svg.replace(/<\?xml[^?]*\?>/gi, '').trim()

  const parser = new DOMParser()
  const doc = parser.parseFromString(cleaned, 'image/svg+xml')

  const parseError = doc.querySelector('parsererror')
  if (parseError) {
    return { jsx: '', error: parseError.textContent || 'Invalid SVG', elements: 0, chars: 0 }
  }

  const root = doc.documentElement
  const parts = []

  // Process the root <svg> element
  const s = render(root, 0)
  if (s) parts.push(s)

  if (parts.length === 0) return { jsx: '', error: '', elements: 0, chars: 0 }

  const jsx = parts.join('\n')
  return {
    jsx,
    error: '',
    elements: (jsx.match(/<[a-z]/g) || []).length,
    chars: jsx.length,
  }
}

export const SVG_SAMPLE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
  stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M12 2L2 7l10 5 10-5-10-5z" fill-rule="evenodd" />
  <path d="M2 17l10 5 10-5" />
  <path d="M2 12l10 5 10-5" />
</svg>`
