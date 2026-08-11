// Matcher de globs no dialeto do .gitignore (o mesmo dialeto usado por
// .dockerignore, .editorconfig, arquivos .npmignore e pelo `paths:`/`files:`
// do GitHub Actions).
//
// Regras implementadas:
//   - `*` casa qualquer sequência de caracteres, mas NUNCA `/`
//   - `?` casa exatamente UM caractere, mas nunca `/`
//   - `**` como um segmento inteiro casa zero ou mais diretórios
//   - `[...]` classe de caracteres (`[!a]` é a negação)
//   - `{a,b}` alternação (expandida antes de montar a regex)
//   - padrão SEM `/` no meio casa em qualquer profundidade; com `/` no meio
//     (ou começando com `/`) é ancorado na raiz
//   - `/` no final marca "só diretório" (exclui o diretório e tudo que está
//     dentro; um arquivo com o mesmo nome do diretório não é excluído)
//   - `!` no início nega (re-inclui); a última linha que casa decide, e um
//     `!` NÃO consegue re-incluir um arquivo dentro de um diretório já
//     excluído (regra do gitignore)
//   - `**` fora de um segmento inteiro vira `*` (spec do gitignore)

function escapeRe(c) {
  return /[\\^$.*+?()[\]{}|]/.test(c) ? '\\' + c : c
}

// Expande `{a,b}` (aninhados) em todas as variantes. "{x}" sem fechamento
// vira literal. Funciona num trecho que pode conter `/`.
export function expandBraces(seg) {
  const first = seg.indexOf('{')
  if (first === -1) return [seg]
  let depth = 0
  let close = -1
  for (let i = first; i < seg.length; i++) {
    if (seg[i] === '{') depth++
    else if (seg[i] === '}') {
      depth--
      if (depth === 0) {
        close = i
        break
      }
    }
  }
  if (close === -1) return [seg]
  const content = seg.slice(first + 1, close)
  const alts = []
  let cur = ''
  let d = 0
  for (let i = 0; i < content.length; i++) {
    const ch = content[i]
    if (ch === '{') d++
    else if (ch === '}') d--
    if (ch === ',' && d === 0) {
      alts.push(cur)
      cur = ''
    } else cur += ch
  }
  alts.push(cur)
  const prefix = seg.slice(0, first)
  const suffix = seg.slice(close + 1)
  const out = []
  for (const a of alts) {
    for (const r of expandBraces(prefix + a + suffix)) out.push(r)
  }
  return out.length ? out : [seg]
}

// Transpõe UM segmento (sem `/`) em fragmento de regex.
function transpose(seg) {
  let out = ''
  let i = 0
  while (i < seg.length) {
    const c = seg[i]
    if (c === '*') {
      while (seg[i] === '*') i++
      out += '[^/]*'
    } else if (c === '?') {
      out += '[^/]'
      i++
    } else if (c === '[') {
      let j = i + 1
      let neg = false
      if (seg[j] === '!' || seg[j] === '^') {
        neg = true
        j++
      }
      let cls = ''
      let closed = false
      while (j < seg.length) {
        const ch = seg[j]
        if (ch === ']') {
          closed = true
          j++
          break
        }
        cls += ch === '\\' ? '\\\\' : ch
        j++
      }
      if (closed) {
        out += '[' + (neg ? '^' : '') + (cls || '^/') + ']'
        i = j
      } else {
        out += '\\['
        i++
      }
    } else if (c === '\\') {
      out += i + 1 < seg.length ? escapeRe(seg[i + 1]) : '\\\\'
      i += 2
    } else {
      out += escapeRe(c)
      i++
    }
  }
  return out
}

// Converte um corpo de padrão (sem `!`, sem `/` inicial/final) em regex.
function bodyToRegex(body) {
  if (body === '**') return '.*'
  const segs = body.split('/')
  let out = ''
  let prevEndsSlash = false
  for (let i = 0; i < segs.length; i++) {
    const s = segs[i]
    if (s === '**') {
      if (i === 0) {
        out += '(?:[^/]+/)*'
        prevEndsSlash = true
      } else if (i === segs.length - 1) {
        out += '(?:/.*)?'
        prevEndsSlash = false
      } else {
        out += '(/(?:[^/]+))*/'
        prevEndsSlash = true
      }
      continue
    }
    const frag = transpose(s)
    out += prevEndsSlash ? frag : out === '' ? frag : '/' + frag
    prevEndsSlash = false
  }
  return out
}

// Compila uma linha de padrão. Devolve objeto compilado ou null se inválida.
export function compileGlob(raw) {
  const line = String(raw || '').trim()
  if (!line || line.startsWith('#')) return null
  const negated = line.startsWith('!')
  const p = (negated ? line.slice(1) : line).trim()
  if (!p || p.startsWith('#') || p === '/') return null
  const dirOnly = p.endsWith('/')
  let body = dirOnly ? p.slice(0, -1) : p
  const leadingRoot = body.startsWith('/')
  if (leadingRoot) body = body.slice(1)
  if (!body) return null
  const anchored = leadingRoot || body.includes('/')

  const variants = expandBraces(body)
  const inners = []
  for (let k = 0; k < variants.length; k++) {
    const inner = bodyToRegex(variants[k])
    if (inner) inners.push(inner)
  }
  if (!inners.length) return null
  const group = inners.length > 1 ? '(?:' + inners.join('|') + ')' : inners[0]
  const head = anchored ? '^' : '^(?:.*/)?'
  let full = null
  let content = null
  try {
    full = new RegExp(head + group + (dirOnly ? '(?:/.*)?' : '') + '$')
    if (dirOnly) content = new RegExp(head + group + '/.*$')
  } catch (e) {
    return null
  }
  return { raw: line, negated, dirOnly, full, content, anchored }
}

// Índice da ÚLTIMA linha que casa com o caminho (`asFile` troca o teste de
// padrão de diretório: contra um arquivo ele só casa conteúdo, nunca o
// diretório em si).
function lastMatch(patterns, path, asFile) {
  let last = null
  for (let k = 0; k < patterns.length; k++) {
    const g = patterns[k]
    if (asFile && g.dirOnly) {
      if (g.content.test(path)) last = k
    } else if (g.full.test(path)) {
      last = k
    }
  }
  return last
}

// Avalia um caminho contra a lista de padrões. `used` (opcional) é um array
// de booleanos por índice — marca os padrões que decidiram o resultado final
// de algum caminho (a "última linha que casa"), o que alimenta a lista de
// "padrões sem efeito" da página.
export function matchFile(path, patterns, used) {
  const parts = path.split('/')
  const leaf = lastMatch(patterns, path, true)
  const leafExcludes = leaf !== null && !patterns[leaf].negated

  let ancestor = null
  if (!leafExcludes) {
    for (let i = parts.length - 1; i >= 1; i--) {
      const dir = parts.slice(0, i).join('/')
      const dl = lastMatch(patterns, dir, false)
      if (dl !== null && !patterns[dl].negated) {
        ancestor = dl
        break
      }
    }
  }

  const ignored = leafExcludes || ancestor !== null
  let deciding = null
  if (leafExcludes) deciding = leaf
  else if (ancestor !== null) deciding = ancestor
  else if (leaf !== null && patterns[leaf].negated) deciding = leaf
  if (used && deciding !== null && patterns[deciding]) used[deciding] = true
  return { ignored, pattern: deciding }
}

// API de alto nível: recebe as linhas de padrão e os caminhos de arquivo
// (TextArea do usuário) e devolve o relatório completo.
export function evaluate(files, patternLines) {
  const patterns = []
  let invalidCount = 0
  ;(patternLines || []).forEach((line) => {
    const raw = String(line || '')
    const g = compileGlob(raw)
    if (g) patterns.push(g)
    else if (raw.trim() && !raw.trim().startsWith('#')) invalidCount++
  })

  const used = new Array(patterns.length).fill(false)
  const results = []
  const paths = []
  ;(files || []).forEach((raw) => {
    const line = String(raw || '').trim()
    if (!line || line.startsWith('#')) return
    paths.push(line)
    results.push({ path: line, ...matchFile(line, patterns, used) })
  })

  const ignoredCount = results.filter((r) => r.ignored).length
  const keptCount = results.length - ignoredCount
  const usedIndexes = []
  const unusedIndexes = []
  patterns.forEach((g, i) => {
    if (used[i]) usedIndexes.push(i)
    else unusedIndexes.push(i)
  })

  return {
    patterns,
    results,
    fileCount: paths.length,
    ignoredCount,
    keptCount,
    usedIndexes,
    unusedIndexes,
    invalidCount,
    ignoredPatterns: results
      .filter((r) => r.ignored && r.pattern !== null)
      .reduce((acc, r) => acc.add((patterns[r.pattern] || {}).raw || ''), new Set()),
  }
}