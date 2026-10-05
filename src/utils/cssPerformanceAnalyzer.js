// ─────────────────────────────────────────────────────────────
// CSS Performance Analyzer — 100% client-side, zero dependências.
//
// Analisa um CSS colado e aponta coisas que afetam performance
// (parse, cascade, paint, network):
//   - Tamanho, contagem de regras, declarações e at-rules
//   - Especificidade: distribuição e regras mais específicas
//   - !important (count + onde)
//   - Seletor universal * fora do padrão box-sizing
//   - @import síncrono (bloqueia o anti-blocking pipeline)
//   - :has(), :not(), :nth-*() — caros no matching
//   - Seletores com profundidade > 3 e > 5
//   - @font-face — pode precisar de preload
//   - Propriedades redundantes (mesma prop declarada N+ vezes)
//
// O parser é caseiro mas decente: lida com comentários, strings
// (com escapes), parens aninhados (calc(), :is(), :has(), etc.),
// bloco de regras aninhado em @media/@supports/@container, e
// comentários. Não tenta ser um parser consoante com a spec —
// só o que essa análise precisa.
// ─────────────────────────────────────────────────────────────

const AT_RULES_WITH_BLOCK = new Set([
  'media', 'supports', 'container', 'document',
  'font-face', 'keyframes', '-webkit-keyframes', 'counter-style',
  'property', 'layer', 'scope', 'page',
])

const AT_RULES_NO_BLOCK = new Set([
  'import', 'charset', 'namespace', 'viewport',
])

const PSEUDO_ELEMENTS = new Set([
  'before', 'after', 'first-line', 'first-letter', 'placeholder',
  'selection', 'marker', 'backdrop', 'file-selector-button', 'cue',
])

// :has, :is, :not, :where, :nth-* — caros no engine de matching
const FUNCTIONAL_EXPENSIVE = [
  { re: /:has\(/gi, name: ':has()', severity: 'info', note: 'pode ser caro em DOM grande; nativos modernos' },
  { re: /:is\(/gi,  name: ':is()',  severity: 'info', note: 'especificidade = argumento mais específico' },
  { re: /:where\(/gi, name: ':where()', severity: 'info', note: 'especificidade zero (não pesa no cascade)' },
  { re: /:not\(/gi, name: ':not()',  severity: 'info', note: 'especificidade = argumento mais específico' },
  { re: /:nth-(?:child|last-child|of-type|last-of-type)\(/gi, name: ':nth-*()', severity: 'info', note: 'pseudoclasse posicional, simples mas custosa em listas grandes' },
]

// ── helpers de especificidade (mesma lógica da CssSpecificityCalculator) ──

function unwrapFunctionalPseudos(selector) {
  let s = selector
  for (let i = 0; i < 6; i++) {
    const next = s.replace(/:(?:where|is|not|matches)\(([^()]*)\)/gi, ' $1 ')
    if (next === s) break
    s = next
  }
  // desembrulha :has() recursivamente até não mudar (limite seguro de 8)
  for (let i = 0; i < 8; i++) {
    const next = s.replace(/:has\(([^()]*(?:\([^()]*\)[^()]*)*)\)/gi, ' $1 ')
    if (next === s) break
    s = next
  }
  return s
}

function computeSpecificity(rawSelector) {
  let s = unwrapFunctionalPseudos(rawSelector.trim())
  let a = 0, b = 0, c = 0

  // pseudo-elementos
  s = s.replace(/::?([a-zA-Z-]+)/g, (m, name) => {
    if (m.startsWith('::') || PSEUDO_ELEMENTS.has(name.toLowerCase())) {
      c += 1
      return ' '
    }
    return m
  })
  // IDs
  s = s.replace(/#[a-zA-Z_-][\w-]*/g, () => { a += 1; return ' ' })
  // atributos
  s = s.replace(/\[[^\]]*\]/g, () => { b += 1; return ' ' })
  // classes
  s = s.replace(/\.[a-zA-Z_-][\w-]*/g, () => { b += 1; return ' ' })
  // pseudo-classes restantes
  s = s.replace(/:[a-zA-Z-]+(\([^()]*\))?/g, () => { b += 1; return ' ' })
  // tags (sobra)
  const rest = s.split(/[\s>+~,]+/).filter(Boolean)
  rest.forEach((token) => {
    if (token === '*' || token === '&') return
    if (/^[a-zA-Z][\w-]*$/.test(token)) c += 1
  })

  return { a, b, c }
}

function specificityNumber({ a, b, c }) {
  return a * 1_000_000 + b * 1_000 + c
}

function specificityLabel({ a, b, c }) {
  return `(${a},${b},${c})`
}

// profundidade do seletor — conta combinadores (espaço, >, +, ~)
function selectorDepth(selector) {
  const unwrapped = unwrapFunctionalPseudos(selector)
  // quebras por combinadores (com cuidado pra não contar parens)
  const tokens = []
  let depth = 0
  let buf = ''
  for (let i = 0; i < unwrapped.length; i++) {
    const ch = unwrapped[i]
    if (ch === '(') depth++
    else if (ch === ')') depth--
    else if (depth === 0 && /\s/.test(ch)) {
      if (buf) tokens.push(buf)
      buf = ''
      // pula espaço; o próximo é o combinador ou outro token
      while (i + 1 < unwrapped.length && /[\s>+~]/.test(unwrapped[i + 1])) i++
      tokens.push(' ')
    } else {
      buf += ch
    }
  }
  if (buf) tokens.push(buf)
  // conta segmentos "separados por espaço" + > + ~ + +
  const segments = []
  let seg = ''
  for (const tk of tokens) {
    if (tk === ' ' || tk === '>' || tk === '+' || tk === '~') {
      if (seg.trim()) segments.push(seg.trim())
      seg = ''
    } else {
      seg += tk
    }
  }
  if (seg.trim()) segments.push(seg.trim())
  return segments.length
}

// ── tokenizer: devolve top-level rules + at-rules + tokens balance ──

function preprocess(css) {
  let out = ''
  let i = 0
  const n = css.length
  while (i < n) {
    const c = css[i]
    if (c === '/' && css[i + 1] === '*') {
      const end = css.indexOf('*/', i + 2)
      if (end === -1) return out + css.slice(i).replace(/[^\n]/g, ' ')
      out += ' '.repeat(end + 2 - i)
      i = end + 2
      continue
    }
    if (c === '"' || c === "'") {
      let j = i + 1
      while (j < n) {
        if (css[j] === '\\') { j += 2; continue }
        if (css[j] === c) { j++; break }
        j++
      }
      out += css.slice(i, j)
      i = j
      continue
    }
    out += c
    i++
  }
  return out
}

// encontra o próximo `{` ou `;` no nível de parens=0
function findNextBoundary(text, from) {
  let paren = 0
  for (let i = from; i < text.length; i++) {
    const c = text[i]
    if (c === '(') paren++
    else if (c === ')') paren--
    else if (paren === 0 && (c === '{' || c === ';' || c === '}')) return false
  }
  return false
}

// retorna [atName, prelude, kind] onde kind = 'block' | 'simple'
function matchAtRule(text, from) {
  if (text[from] !== '@') return null
  const m = text.slice(from).match(/^@([a-zA-Z-]+)/)
  if (!m) return null
  const atName = m[1].toLowerCase()
  const nameEnd = from + m[0].length
  return { atName, nameEnd }
}

// split top-level de uma string respeitando {} e ()
function splitTopLevelCommas(text) {
  const out = []
  let buf = ''
  let depthBrace = 0
  let depthParen = 0
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (c === '{') depthBrace++
    else if (c === '}') depthBrace--
    else if (c === '(') depthParen++
    else if (c === ')') depthParen--
    else if (c === ',' && depthBrace === 0 && depthParen === 0) {
      out.push(buf)
      buf = ''
      continue
    }
    buf += c
  }
  if (buf.trim()) out.push(buf)
  return out
}

// extrai blocos com chaves balanceadas a partir de `from`
// devolve { endIndex, bodyStart, bodyEnd } ou null se não encontrar `{`
function consumeBlock(text, from) {
  if (text[from] !== '{') return null
  let depth = 1
  let i = from + 1
  while (i < text.length) {
    const c = text[i]
    if (c === '{') depth++
    else if (c === '}') {
      depth--
      if (depth === 0) return { bodyStart: from, bodyEnd: i, end: i + 1 }
    }
    i++
  }
  return null
}

// ── split de declarations: pega o corpo de uma regra e devolve array de decl ──

function splitDeclarations(body) {
  const decls = []
  let buf = ''
  let i = 0
  const n = body.length
  while (i < n) {
    const c = body[i]
    if (c === '/' && body[i + 1] === '*') {
      const end = body.indexOf('*/', i + 2)
      if (end === -1) { buf += ' '.repeat(n - i); break }
      buf += ' '.repeat(end + 2 - i)
      i = end + 2
      continue
    }
    if (c === '"' || c === "'") {
      let j = i + 1
      while (j < n) {
        if (body[j] === '\\') { j += 2; continue }
        if (body[j] === c) { j++; break }
        j++
      }
      buf += body.slice(i, j)
      i = j
      continue
    }
    if (c === ';') {
      decls.push(buf)
      buf = ''
      i++
      continue
    }
    buf += c
    i++
  }
  if (buf.trim()) decls.push(buf)
  return decls.filter((d) => d.trim())
}

function declProperty(decl) {
  const idx = decl.indexOf(':')
  if (idx === -1) return null
  return decl.slice(0, idx).trim()
}

function declHasImportant(decl) {
  return /!\s*important\b/i.test(decl)
}

// ── top-level parser: extrai at-rules e regras (incluindo @media @supports...) ──

function parseTopLevel(text) {
  const items = []
  let i = 0
  const n = text.length

  while (i < n) {
    // pula whitespace
    while (i < n && /\s/.test(text[i])) i++
    if (i >= n) break

    if (text[i] === '@') {
      const m = matchAtRule(text, i)
      if (!m) {
        i++
        continue
      }
      const { atName, nameEnd } = m

      // pula whitespace após o nome
      let j = nameEnd
      while (j < n && /\s/.test(text[j])) j++

      // Acha o próximo ; ou { no nível de parens=0 (limite real do at-rule)
      let boundaryIdx = -1
      let parenDepth = 0
      for (let k = j; k < n; k++) {
        const c = text[k]
        if (c === '(') parenDepth++
        else if (c === ')') parenDepth--
        else if (parenDepth === 0 && (c === ';' || c === '{')) {
          boundaryIdx = k
          break
        }
      }

      if (boundaryIdx === -1) {
        // malformado — aborta a partir daqui
        i = n
        break
      }

      if (atName === 'charset') {
        items.push({ kind: 'at-charset', name: atName })
        i = boundaryIdx + 1
        continue
      }

      if (text[boundaryIdx] === ';') {
        // at-rule sem bloco (ex: @import url(...);)
        const prelude = text.slice(j, boundaryIdx).trim()
        const kind = atName === 'import' ? 'at-import' : 'at-simple'
        items.push({ kind, name: atName, prelude: prelude.replace(/;$/, '') })
        i = boundaryIdx + 1
        continue
      }

      // text[boundaryIdx] === '{' — at-rule com bloco
      {
        const block = consumeBlock(text, boundaryIdx)
        if (!block) {
          i = n
          break
        }
        const prelude = text.slice(nameEnd, boundaryIdx).trim()

        if (atName === 'import') {
          items.push({ kind: 'at-import', name: atName, prelude: prelude.replace(/;$/, '') })
        } else if (atName === 'font-face') {
          items.push({
            kind: 'at-font-face',
            name: atName,
            declarations: splitDeclarations(text.slice(block.bodyStart + 1, block.bodyEnd)),
          })
        } else if (AT_RULES_WITH_BLOCK.has(atName)) {
          // @media, @supports, @container, @keyframes etc — recursão
          const nested = parseTopLevel(text.slice(block.bodyStart + 1, block.bodyEnd))
          items.push({
            kind: 'at-block',
            name: atName,
            prelude,
            children: nested,
          })
        } else {
          // at-rule desconhecida com bloco — guarda o conteúdo como children
          const nested = parseTopLevel(text.slice(block.bodyStart + 1, block.bodyEnd))
          items.push({
            kind: 'at-block',
            name: atName,
            prelude,
            children: nested,
          })
        }
        i = block.end
        continue
      }
    }

    // selector { ... }
    // acha o `{` no nível 0 de parens
    let depth = 0
    let k = i
    while (k < n) {
      const c = text[k]
      if (c === '(') depth++
      else if (c === ')') depth--
      else if (c === '{' && depth === 0) break
      else if (c === ';' && depth === 0) {
        // seletor malformado — descarta
        k++
        i = k
        break
      }
      k++
    }
    if (k >= n) break
    if (text[k] !== '{') continue
    const selectorText = text.slice(i, k)
    const block = consumeBlock(text, k)
    if (!block) break

    // selectorText pode ter múltiplos seletores separados por vírgula no top-level
    const selectors = splitTopLevelCommas(selectorText)
    const declarations = splitDeclarations(text.slice(block.bodyStart + 1, block.bodyEnd))

    selectors.forEach((sel, idx) => {
      const trimmed = sel.trim()
      if (!trimmed) return
      items.push({
        kind: 'rule',
        selector: trimmed,
        declarations,
        isLastInGroup: idx === selectors.length - 1,
        parentAtRule: null,
      })
    })

    i = block.end
  }

  return items
}

// ── walk recursivo: coleta regras (com prefixo de at-rule pai) ──

function walk(items, prefix, parentAt, accum) {
  for (const item of items) {
    if (item.kind === 'rule') {
      accum.push({
        selector: item.selector,
        declarations: item.declarations,
        parentAt: parentAt,
        wrappedIn: prefix.length ? prefix : null,
      })
    } else if (item.kind === 'at-block') {
      const nextPrefix = [...prefix, `${item.name} ${item.prelude}`.trim()]
      walk(item.children, nextPrefix, item.name, accum)
    }
  }
}

function collectRules(tree) {
  const out = []
  walk(tree, [], null, out)
  return out
}

// ── análise ──

function analyzeCss(rawCss) {
  const css = preprocess(rawCss)
  const size = rawCss.length
  const tree = parseTopLevel(css)

  const rules = collectRules(tree)

  // conta regras considerando comma-separated groups como N
  const totalSelectors = rules.length
  const totalDeclarations = rules.reduce((s, r) => s + r.declarations.length, 0)

  // specificity
  const enriched = rules.map((r) => {
    const spec = computeSpecificity(r.selector)
    return {
      ...r,
      specificity: spec,
      specNum: specificityNumber(spec),
      depth: selectorDepth(r.selector),
    }
  })

  // histogramas
  const specBuckets = { '(0,0,1)': 0, '(0,1,0)': 0, '(0,2,0)': 0, '(1,0,0)': 0, '(1,1,0)': 0, '(2,0,0)': 0, high: 0 }
  enriched.forEach((r) => {
    const k = specificityLabel(r.specificity)
    if (k in specBuckets) specBuckets[k]++
    else specBuckets.high++
  })

  const sumSpecNum = enriched.reduce((s, r) => s + r.specNum, 0)
  const avgSpecNum = enriched.length ? sumSpecNum / enriched.length : 0
  const maxSpec = enriched.reduce((m, r) => (r.specNum > m.specNum ? r : m), { specNum: -1, selector: '', wrappedIn: null })

  // propriedades (histograma) + !important + universal selector
  const propCounts = {}
  let importantCount = 0
  const importantRules = [] // { selector, property }
  let universalCount = 0
  const universalSelectors = []
  // profundidade
  let depthOver3 = 0
  let depthOver5 = 0
  const expensiveUses = {} // { name: count }
  const expensiveRules = [] // { selector, name }
  const depthLongRules = [] // { selector, depth }

  enriched.forEach((r) => {
    r.declarations.forEach((d) => {
      const prop = declProperty(d)
      if (prop) {
        propCounts[prop] = (propCounts[prop] || 0) + 1
      }
      if (declHasImportant(d)) {
        importantCount++
        importantRules.push({ selector: r.selector, property: prop || '?' })
      }
    })
    if (/^\s*\*\s*(?:\.|,|$|\s)/.test(r.selector) || r.selector.trim() === '*') {
      universalCount++
      if (universalSelectors.length < 5) universalSelectors.push(r.selector)
    }
    if (r.depth > 5) {
      depthOver5++
      if (depthLongRules.length < 10) depthLongRules.push({ selector: r.selector, depth: r.depth })
    } else if (r.depth > 3) {
      depthOver3++
    }
    FUNCTIONAL_EXPENSIVE.forEach((p) => {
      const m = r.selector.match(p.re)
      if (m) {
        // conta matches únicos por tipo
        const found = new Set(m.map((x) => p.name))
        found.forEach((name) => {
          expensiveUses[name] = (expensiveUses[name] || 0) + 1
        })
        expensiveRules.push({ selector: r.selector, name: p.name, note: p.note })
      }
    })
  })

  const topProps = Object.entries(propCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)

  // top rules por specificity
  const topSpecific = enriched
    .slice()
    .sort((a, b) => b.specNum - a.specNum)
    .slice(0, 10)

  // @imports (síncronos) e @font-face
  const imports = []
  const fontFaces = []
  function pickAt(tree) {
    for (const item of tree) {
      if (item.kind === 'at-import') {
        const hasMedia = /\b(?:media|supports|layer|container)\b/i.test(item.prelude)
        const urlMatch = item.prelude.match(/url\(\s*['"]?([^'")]+)['"]?\s*\)|['"]([^'"]+)['"]/)
        imports.push({
          url: urlMatch ? (urlMatch[1] || urlMatch[2]) : item.prelude,
          full: item.prelude,
          hasNonBlockingHint: hasMedia,
        })
      } else if (item.kind === 'at-font-face') {
        const familyDecl = item.declarations.find((d) => /font-family\s*:/i.test(d.trim()))
        const family = familyDecl
          ? familyDecl.replace(/^[\s\n]+/, '').replace(/^font-family\s*:\s*/i, '').replace(/;$/, '').trim()
          : '?'
        fontFaces.push({
          family: family.replace(/^['"]|['"]$/g, ''),
          declarations: item.declarations,
        })
      } else if (item.kind === 'at-block') {
        pickAt(item.children)
      }
    }
  }
  pickAt(tree)

  // ── issues ──
  const issues = []

  // !important
  if (importantCount === 1) {
    issues.push({
      severity: 'info',
      title: '1 uso de !important',
      detail: 'Geralmente sinal de override a force bruta; considere revisar a especificidade.',
    })
  } else if (importantCount > 1 && importantCount <= 10) {
    issues.push({
      severity: 'warning',
      title: `${importantCount} usos de !important`,
      detail: 'Cada !important vence todas as regras de especificidade normal. Use como último recurso.',
    })
  } else if (importantCount > 10) {
    issues.push({
      severity: 'error',
      title: `${importantCount} usos de !important`,
      detail: 'Volume alto de !important geralmente indica cascade quebrada — refatore ou reestruture com cascaded layers.',
    })
  }

  // universal selector
  if (universalCount > 0) {
    const okBoxSizing = universalSelectors.every((s) => /\*\s*,\s*\*::?(?:before|after)\s*\{\s*box-sizing/i.test(s + '{}') || /box-sizing/i.test(rules.find((r) => r.selector === s)?.declarations.join(';') || ''))
    issues.push({
      severity: okBoxSizing ? 'info' : 'warning',
      title: `${universalCount} regra(s) com seletor universal (*) `,
      detail: okBoxSizing
        ? 'Parece estar usando o padrão clássico * { box-sizing: border-box } — ok.'
        : 'Universal (*) casa com cada elemento do DOM. Use com escopo específico (ex.: *, *::before, *::after) ou um reset library.',
    })
  }

  // @import
  if (imports.length > 0) {
    const sync = imports.filter((i) => !i.hasNonBlockingHint)
    if (sync.length > 0) {
      issues.push({
        severity: 'warning',
        title: `${sync.length} @import síncrono(s)`,
        detail: '@import sem media/supports/layer/container força o navegador a pausar o parse até o arquivo ser baixado. Use <link rel="stylesheet"> ou aninhe @import dentro de uma camada (@layer).',
      })
    }
  }

  // profundidade de seletores
  if (depthOver5 > 0) {
    issues.push({
      severity: 'error',
      title: `${depthOver5} seletor(es) com profundidade > 5`,
      detail: 'Cadeias muito profundas são frágeis e lentas no matching. Refatore para classes semânticas ou containers.',
    })
  } else if (depthOver3 > 0) {
    issues.push({
      severity: 'warning',
      title: `${depthOver3} seletor(es) com profundidade > 3`,
      detail: 'Cadeias longas casam devagar e reagem a qualquer mudança estrutural. Limite a 2–3 níveis.',
    })
  }

  // propriedades redundantes
  const redundant = Object.entries(propCounts).filter(([, c]) => c >= 8).sort((a, b) => b[1] - a[1])
  if (redundant.length > 0) {
    const top = redundant.slice(0, 3).map(([p, c]) => `${p} (${c}×)`).join(', ')
    issues.push({
      severity: 'info',
      title: 'Propriedades muito repetidas',
      detail: `Top: ${top}. Pode ser candidato a classe utilitária, custom property ou design token.`,
    })
  }

  // @font-face
  if (fontFaces.length > 4) {
    issues.push({
      severity: 'info',
      title: `${fontFaces.length} @font-face declarados`,
      detail: 'Muitas famílias/pesos podem atrasar o primeiro paint. Considere subset, preload dos pesos críticos e font-display: swap.',
    })
  } else if (fontFaces.length > 0) {
    issues.push({
      severity: 'info',
      title: `${fontFaces.length} @font-face declarado(s)`,
      detail: 'Confirme que cada peso/estilo é realmente usado. Para pesos críticos, considere <link rel="preload">.',
    })
  }

  // tamanho
  if (size > 100_000) {
    issues.push({
      severity: 'warning',
      title: `Arquivo grande: ${(size / 1024).toFixed(1)} KB`,
      detail: 'Considere code-splitting por rota, PurgeCSS/UnCSS para remover regras não usadas, ou mover para <link> por página.',
    })
  }

  return {
    size,
    gzippedEstimate: Math.round(size * 0.22), // ~22% é típico para CSS
    totalRules: rules.length,
    totalDeclarations,
    enriched,
    specBuckets,
    avgSpecNum,
    maxSpecificity: { selector: maxSpec.selector || '', num: Math.max(0, maxSpec.specNum) },
    topSpecific,
    importantCount,
    importantRules: importantRules.slice(0, 10),
    universalCount,
    universalSelectors,
    depthOver3,
    depthOver5,
    depthLongRules,
    expensiveUses,
    expensiveRules: expensiveRules.slice(0, 12),
    propCounts,
    topProps,
    redundant,
    imports,
    fontFaces,
    issues,
  }
}

export {
  analyzeCss,
  computeSpecificity,
  specificityLabel,
  specificityNumber,
  selectorDepth,
}

export default analyzeCss