// Conversor CSS ↔ objeto de estilo JS (React inline style) — 100% client-side,
// sem nenhuma dependência.
//
// Duas direções:
//   1. `cssToJs`: cola declarações CSS (`prop: value;`) ou um bloco de regra
//      (`seletor { ... }`, inclusive vários) e ganha o objeto de estilo pronto
//      pra `style={...}` — propriedades em camelCase, prefixos de vendor
//      capitalizados no padrão do React, `px` virado número, `!important`
//      detectado (e removido: a style prop do React não suporta) e
//      propriedades custom `--x` preservadas.
//   2. `jsToCss`: cola um objeto literal (ou JSON) e ganha de volta o CSS —
//      camelCase → kebab-case, prefixo `Webkit*`/`ms*`/`Moz*`/`O*` devolvido
//      pra forma com hífen, e números vão pra `px`, exceto as dezenas de
//      propriedades "unitless" que o React trata como número puro (zIndex,
//      flex, opacity, fontWeight, lineHeight...).

const UNITLESS_CSS_PROPS = new Set([
  'animation-iteration-count', 'aspect-ratio', 'border-image-outset',
  'border-image-slice', 'border-image-width', 'box-flex', 'box-flex-group',
  'box-ordinal-group', 'column-count', 'columns', 'flex', 'flex-grow',
  'flex-positive', 'flex-shrink', 'flex-negative', 'flex-order', 'font-weight',
  'grid-area', 'grid-row', 'grid-row-end', 'grid-row-span', 'grid-row-start',
  'grid-column', 'grid-column-end', 'grid-column-span', 'grid-column-start',
  'line-clamp', 'line-height', 'opacity', 'order', 'orphans', 'tab-size',
  'widows', 'z-index', 'zoom', 'fill-opacity', 'flood-opacity', 'stop-opacity',
  'stroke-dasharray', 'stroke-dashoffset', 'stroke-miterlimit',
  'stroke-opacity', 'stroke-width',
])

const PROP_TOKEN_RE = /^-{0,2}[A-Za-z_][\w-]*$/
const PX_NUMBER_RE = /^-?(?:\d+\.?\d*|\.\d+)px$/
const NUMBER_ONLY_RE = /^-?(?:\d+\.?\d*|\.\d+)$/
const NUMERIC_UNIT_RE = /^-?(?:\d+\.?\d*|\.\d+)(?:em|rem|%|vh|vw|vmin|vmax|ch|ex|pt|pc|cm|mm|in|s|ms|hz|khz|dpi|dpcm|fr)$/i

// --- CSS → JS ----------------------------------------------------------------

// cameliza a propriedade CSS pra chave da style prop do React:
//   font-size -> fontSize, float -> cssFloat, --accent -> --accent,
//   -webkit-mask-image -> WebkitMaskImage, -ms-high-contrast -> msHighContrast
export function styleKey(cssProp) {
  if (cssProp === 'float') return 'cssFloat'
  if (cssProp.startsWith('--')) return cssProp
  const parts = cssProp.split('-').filter(Boolean)
  if (!parts.length) return cssProp
  let head = parts[0]
  const rest = parts.slice(1)
  if (head === 'webkit' || head === 'moz' || head === 'o') {
    head = head.charAt(0).toUpperCase() + head.slice(1)
  } else if (head === 'ms') {
    head = 'ms'
  }
  return head + rest.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join('')
}

// Remove comentários `/* */` respeitando strings. O comprimento da string
// muda, mas isso não importa pros usos seguintes.
function stripComments(css) {
  let out = ''
  let inComment = false
  let quote = null
  for (let i = 0; i < css.length; i++) {
    const c = css[i]
    if (inComment) {
      if (c === '*' && css[i + 1] === '/') {
        out += '  '
        inComment = false
        i++
      } else {
        out += ' '
      }
      continue
    }
    if (quote) {
      out += c
      if (c === '\\') {
        out += css[i + 1] || ''
        i++
      } else if (c === quote) {
        quote = null
      }
      continue
    }
    if (c === '"' || c === "'") {
      quote = c
      out += c
      continue
    }
    if (c === '/' && css[i + 1] === '*') {
      inComment = true
      out += '  '
      i++
      continue
    }
    out += c
  }
  return out
}

// Para cada seção entre `{ ... }` do CSS, coleta as declarações internas.
// Retorna também o texto de fora dos blocos (declarações "soltas").
function collectBlocks(css) {
  const blocks = []
  let bare = ''
  let depth = 0
  let start = -1
  let quote = null
  let comment = false
  for (let i = 0; i < css.length; i++) {
    const c = css[i]
    if (comment) {
      if (c === '*' && css[i + 1] === '/') { comment = false; i++ }
      continue
    }
    if (quote) {
      if (c === '\\') i++
      else if (c === quote) quote = null
      continue
    }
    if (c === '"' || c === "'") { quote = c; continue }
    if (c === '/' && css[i + 1] === '*') { comment = true; i++; continue }
    if (c === '{') {
      if (depth === 0) start = i + 1
      depth++
      continue
    }
    if (c === '}') {
      depth = Math.max(0, depth - 1)
      if (depth === 0 && start !== -1) {
        blocks.push({ start, end: i })
        start = -1
      }
      continue
    }
    if (depth === 0) bare += c
  }
  return { blocks, bare }
}

// Separa um trecho de declarações em pares {prop, value}. Suporta comentários
// já removidos e valores com parêntese/aspas (url(...), strings).
function parseDeclarations(text) {
  const decls = []
  let i = 0
  const n = text.length
  while (i < n) {
    while (i < n && /\s/.test(text[i])) i++
    if (i >= n) break
    let j = i
    while (j < n && /[-_A-Za-z0-9]/.test(text[j])) j++
    if (j === i) { i++; continue }
    const prop = text.slice(i, j)
    while (j < n && /\s/.test(text[j])) j++
    if (text[j] !== ':') { i = j; continue }
    j++
    let value = ''
    let depth = 0
    let quote = null
    let k = j
    for (; k < n; k++) {
      const c = text[k]
      if (quote) {
        value += c
        if (c === '\\') { value += text[k + 1] || ''; k++ }
        else if (c === quote) quote = null
        continue
      }
      if (c === '"' || c === "'") { quote = c; value += c; continue }
      if (c === '(') { depth++; value += c; continue }
      if (c === ')') { depth = Math.max(0, depth - 1); value += c; continue }
      if (c === ';' && depth === 0) break
      value += c
    }
    i = k + 1
    if (PROP_TOKEN_RE.test(prop)) decls.push({ prop, value: value.trim() })
  }
  return decls
}

function serializeJsString(raw) {
  const s = String(raw)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
  return `'${s}'`
}

// Normaliza o valor CSS pro valor da style prop: `px` vira número, `0` vira
// número, `!important` é detectado para o Alert (e removido — a style prop não
// aceita). Qualquer outra coisa vira string.
function normalizeValue(value) {
  const v = value.trim()
  let important = false
  let clean = v
  const impMatch = /!\s*important$/i.exec(clean)
  if (impMatch) {
    important = true
    clean = clean.slice(0, impMatch.index).trim()
  }
  if (PX_NUMBER_RE.test(clean) || NUMBER_ONLY_RE.test(clean)) {
    return { value: parseFloat(clean), important }
  }
  return { value: clean, important }
}

function uniqueLast(decls) {
  const map = new Map()
  for (const d of decls) map.set(d.prop, d.value)
  return [...map.entries()].map(([prop, value]) => ({ prop, value }))
}

// CSS → objeto de estilo JS. `quotedKeys` emite chaves com aspas (JSON-style).
export function cssToJs(css, { quotedKeys = false } = {}) {
  const src = stripComments(css || '')
  const { blocks, bare } = collectBlocks(src)
  let decls = []
  if (blocks.length) {
    // Entrada em formato de regra (`seletor { ... }`): as declarações vivem
    // só dentro das chaves — o texto de fora é seletor, não propriedade.
    for (const b of blocks) decls = decls.concat(parseDeclarations(src.slice(b.start, b.end)))
  } else {
    // Entrada sem chaves: lista de declarações soltas.
    decls = parseDeclarations(bare)
  }
  decls = uniqueLast(decls)

  let importantCount = 0
  const lines = decls.map(({ prop, value }) => {
    const key = styleKey(prop)
    const norm = normalizeValue(value)
    if (norm.important) importantCount++
    let rendered
    if (typeof norm.value === 'number') {
      rendered = String(norm.value)
    } else {
      rendered = quotedKeys ? JSON.stringify(String(norm.value)) : serializeJsString(norm.value)
    }
    return `${quotedKeys ? JSON.stringify(key) : key}: ${rendered},`
  })

  const output = lines.length ? `{\n${lines.map((l) => `  ${l}`).join('\n')}\n}` : '{}'
  return { output, count: decls.length, important: importantCount }
}

// --- JS → CSS ----------------------------------------------------------------

// kebab-case reverso: chave da style prop -> propriedade CSS.
//   backgroundColor -> background-color, cssFloat -> float,
//   WebkitMaskImage -> -webkit-mask-image, msHighContrast -> -ms-high-contrast
export function cssProperty(jsKey) {
  if (jsKey === 'cssFloat') return 'float'
  if (jsKey.startsWith('--')) return jsKey
  let out = String(jsKey)
    .replace(/([A-Z])/g, '-$1')
    .toLowerCase()
  if (out === 'webkit' || out.startsWith('webkit-')) out = `-${out}`
  else if (out === 'moz' || out.startsWith('moz-')) out = `-${out}`
  else if (out === 'o' || out.startsWith('o-')) out = `-${out}`
  else if (out === 'ms' || out.startsWith('ms-')) out = `-${out}`
  return out
}

function unquoteToken(raw) {
  const t = raw.trim()
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
    return t.slice(1, -1).replace(/\\(['"])/g, '$1').replace(/\\\\/g, '\\')
  }
  return t
}

// Simplifica comentários `//` e `/* */` fora de strings.
function stripJsComments(text) {
  let out = ''
  let quote = null
  let i = 0
  const n = text.length
  while (i < n) {
    const c = text[i]
    if (quote) {
      out += c
      if (c === '\\') { out += text[i + 1] || ''; i++ }
      else if (c === quote) quote = null
      i++
      continue
    }
    if (c === '"' || c === "'") { quote = c; out += c; i++; continue }
    if (c === '/' && text[i + 1] === '/') {
      while (i < n && text[i] !== '\n') i++
      out += ' '
      continue
    }
    if (c === '/' && text[i + 1] === '*') {
      i += 2
      while (i < n && !(text[i] === '*' && text[i + 1] === '/')) i++
      i += 2
      out += ' '
      continue
    }
    out += c
    i++
  }
  return out
}

// Divide um objeto JS em membros de nível superior, respeitando strings e
// aninhamento (pares chave: valor separados por vírgula na profundidade 0).
function splitTopMembers(text) {
  const members = []
  let depth = 0
  let quote = null
  let cur = ''
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (quote) {
      cur += c
      if (c === '\\') { cur += text[i + 1] || ''; i++ }
      else if (c === quote) quote = null
      continue
    }
    if (c === '"' || c === "'") { quote = c; cur += c; continue }
    if (c === '{') { depth++; cur += c; continue }
    if (c === '}') { if (depth > 0) depth--; cur += c; continue }
    if (c === ',' && depth === 0) {
      if (cur.trim()) members.push(cur.trim())
      cur = ''
      continue
    }
    cur += c
  }
  if (cur.trim()) members.push(cur.trim())
  return members
}

// Objeto de estilo JS (literal ou JSON) → CSS. Números viram `px`, exceto nas
// propriedades unitless do React (set no topo do arquivo).
export function jsToCss(text) {
  const cleaned = stripJsComments((text || '').trim())
  if (!cleaned) return { output: '', count: 0, skipped: 0, error: null }
  const inner = cleaned.startsWith('{')
    ? cleaned.slice(1, cleaned.lastIndexOf('}') > -1 ? cleaned.lastIndexOf('}') : undefined)
    : cleaned
  const members = splitTopMembers(inner)

  const lines = []
  let skipped = 0
  for (const raw of members) {
    let depth = 0
    let colonAt = -1
    let quote = null
    let braceDepth = 0
    for (let i = 0; i < raw.length; i++) {
      const c = raw[i]
      if (quote) {
        if (c === '\\') i++
        else if (c === quote) quote = null
        continue
      }
      if (c === '"' || c === "'") { quote = c; continue }
      if (c === '(') depth++
      if (c === ')') depth = Math.max(0, depth - 1)
      if (c === '{') braceDepth++
      if (c === '}') braceDepth = Math.max(0, braceDepth - 1)
      if (c === ':' && depth === 0 && colonAt === -1 && braceDepth === 0) {
        colonAt = i
        break
      }
    }
    if (colonAt === -1) continue
    const keyToken = unquoteToken(raw.slice(0, colonAt))
    let valueToken = raw.slice(colonAt + 1).trim().replace(/,$/, '').trim()
    if (!keyToken) continue
    if (valueToken.startsWith('{') || valueToken.startsWith('[')) {
      skipped++
      continue
    }
    const prop = cssProperty(keyToken)
    let rendered
    if (NUMBER_ONLY_RE.test(valueToken)) {
      const num = Number(valueToken)
      rendered = UNITLESS_CSS_PROPS.has(prop) ? String(num) : `${num}px`
    } else {
      rendered = unquoteToken(valueToken)
    }
    lines.push(`  ${prop}: ${rendered};`)
  }

  return {
    output: lines.length ? `.style {\n${lines.join('\n')}\n}` : '',
    count: lines.length,
    skipped,
    error: null,
  }
}