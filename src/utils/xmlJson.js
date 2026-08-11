function escapeXml(str, inAttr = false) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, inAttr ? '&quot;' : '&quot;')
}

function isEmptyObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 0
}

// ─────────────────────────────────────────────────────────────────────────
// XML → JSON
// ─────────────────────────────────────────────────────────────────────────
function collectChildren(node, opts) {
  const out = {}
  const textChunks = []

  for (const child of node.childNodes) {
    if (child.nodeType === Node.TEXT_NODE || child.nodeType === Node.CDATA_SECTION_NODE) {
      const value = child.nodeValue || ''
      if (opts.trimText) {
        if (value.trim()) textChunks.push(value)
      } else {
        textChunks.push(value)
      }
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      const childName = child.nodeName
      const converted = convertNode(child, opts)
      if (Object.prototype.hasOwnProperty.call(out, childName)) {
        if (!Array.isArray(out[childName])) out[childName] = [out[childName]]
        out[childName].push(converted)
      } else {
        out[childName] = converted
      }
    }
  }

  return { children: out, text: textChunks.join('') }
}

function convertNode(node, opts) {
  const atPrefix = opts.attrPrefix || '@'
  const textKey = opts.textKey || '#text'

  // Atributos
  const attrs = {}
  if (node.attributes) {
    for (const attr of node.attributes) {
      attrs[`${atPrefix}${attr.name}`] = attr.value
    }
  }

  const { children, text } = collectChildren(node, opts)

  // Só texto puro (sem atributos e sem elementos filhos)
  if (Object.keys(children).length === 0 && Object.keys(attrs).length === 0) {
    return text
  }

  // Só texto puro com atributos
  if (Object.keys(children).length === 0 && Object.keys(attrs).length > 0) {
    const result = { ...attrs }
    if (text) result[textKey] = text
    return result
  }

  // Mistura de elementos e texto solto entre eles
  const result = { ...attrs, ...children }
  if (text) result[textKey] = text
  return result
}

export function xmlToJson(xmlString, options = {}) {
  const opts = {
    attrPrefix: '@',
    textKey: '#text',
    trimText: true,
    alwaysArray: false,
    ...options,
  }

  const parser = new DOMParser()
  const doc = parser.parseFromString(xmlString, 'application/xml')
  const parserError = doc.querySelector('parsererror')
  if (parserError) {
    const text = parserError.textContent || ''
    throw new Error(text.split('\n')[0] || 'XML parse error')
  }

  const root = doc.documentElement
  if (!root) throw new Error('No root element found')

  const converted = convertNode(root, opts)
  if (typeof converted === 'string') {
    return { [root.nodeName]: { [opts.textKey]: converted } }
  }
  return { [root.nodeName]: converted }
}

// ─────────────────────────────────────────────────────────────────────────
// JSON → XML
// ─────────────────────────────────────────────────────────────────────────
function jsonToXmlValue(value, name, opts, depth) {
  const indent = opts.indent ? '\n' + ' '.repeat(depth * opts.indent) : ''
  const nextIndent = opts.indent ? '\n' + ' '.repeat((depth + 1) * opts.indent) : ''

  if (value === null || value === undefined) {
    return `${indent}<${name} />`
  }

  if (typeof value === 'boolean' || typeof value === 'number') {
    return `${indent}<${name}>${String(value)}</${name}>`
  }

  if (typeof value === 'string') {
    return `${indent}<${name}>${escapeXml(value)}</${name}>`
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => jsonToXmlValue(item, name, opts, depth))
      .join('')
  }

  // Objeto: atributos, texto, elementos
  const atPrefix = opts.attrPrefix || '@'
  const textKey = opts.textKey || '#text'
  const attrs = []
  const entries = Object.entries(value)
  let bodyText = ''
  const childLines = []

  for (const [k, v] of entries) {
    if (k.startsWith(atPrefix)) {
      const attrName = k.slice(atPrefix.length)
      attrs.push(`${attrName}="${escapeXml(String(v), true)}"`)
    } else if (k === textKey) {
      bodyText = escapeXml(String(v))
    } else {
      childLines.push(jsonToXmlValue(v, k, opts, depth + 1))
    }
  }

  const openTag = attrs.length
    ? `${indent}<${name} ${attrs.join(' ')}`
    : `${indent}<${name}`

  if (childLines.length === 0 && bodyText === '') {
    return `${openTag} />`
  }

  if (childLines.length === 0) {
    return `${openTag}>${bodyText}</${name}>`
  }

  const inner = childLines.join('') + (opts.indent ? indent : '')
  return `${openTag}>${bodyText ? bodyText + inner : inner}</${name}>`
}

export function jsonToXml(value, options = {}) {
  const opts = {
    attrPrefix: '@',
    textKey: '#text',
    declaration: true,
    indent: 2,
    rootName: null,
    ...options,
  }

  if (value === null || typeof value !== 'object') {
    throw new Error('Root JSON value must be an object')
  }

  let rootName = opts.rootName
  let rootValue = value

  if (Array.isArray(value)) {
    rootName = rootName || 'root'
    rootValue = { [rootName]: value }
  } else if (!rootName) {
    const keys = Object.keys(value)
    if (keys.length !== 1) {
      throw new Error('Root object must have exactly one key (or set rootName)')
    }
    rootName = keys[0]
    rootValue = value[rootName]
  } else {
    rootValue = value
  }

  const body = jsonToXmlValue(rootValue, rootName, opts, 0)
  const declaration = opts.declaration ? '<?xml version="1.0" encoding="UTF-8"?>' : ''
  return declaration + (declaration && opts.indent ? '\n' : '') + body
}

export function formatXml(xmlString, indent = 2) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xmlString, 'application/xml')
  const parserError = doc.querySelector('parsererror')
  if (parserError) throw new Error('Invalid XML')

  function walk(node, depth) {
    const pad = ' '.repeat(depth * indent)
    if (node.nodeType === Node.TEXT_NODE || node.nodeType === Node.CDATA_SECTION_NODE) {
      const text = node.nodeValue || ''
      return text.trim() ? pad + escapeXml(text) : ''
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return ''

    const attrs = []
    for (const attr of node.attributes) {
      attrs.push(`${attr.name}="${escapeXml(attr.value, true)}"`)
    }
    const open = attrs.length ? `<${node.nodeName} ${attrs.join(' ')}>` : `<${node.nodeName}>`

    const children = Array.from(node.childNodes).filter(
      (n) => n.nodeType === Node.ELEMENT_NODE || (n.nodeType === Node.TEXT_NODE && (n.nodeValue || '').trim()),
    )

    if (children.length === 0) {
      return `${pad}${open}</${node.nodeName}>`
    }

    const inner = children
      .map((child) => walk(child, depth + 1))
      .filter(Boolean)
      .join('\n')
    return `${pad}${open}\n${inner}\n${pad}</${node.nodeName}>`
  }

  return walk(doc.documentElement, 0)
}
