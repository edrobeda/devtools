// Motor do "Pesquisar & Substituir" — 100% client-side.
// Monta a RegExp a partir das opções, encontra as ocorrências pra destacar
// e aplica a substituição expandindo `$1`/`$&`/`$$` no texto de reposição.

export function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Monta a expressão regular. `options`:
//   literal        true = o trecho de busca é texto puro (caracteres escapados)
//   caseSensitive  true = adiciona flag "i" quando false
//   wholeWord      true = envolve o padrão em \b(?:...)\b
//   multiline      true = flag "m" (^ e $ por linha)
//   dotAll         true = flag "s" (ponto casa com quebra de linha)
// Retorna um RegExp global, ou null quando a busca está vazia.
// Lança SyntaxError quando o padrão regex é inválido.
export function buildRegex(find, options = {}) {
  const {
    literal = false,
    caseSensitive = false,
    wholeWord = false,
    multiline = false,
    dotAll = false,
  } = options

  if (find === '') return null

  let pattern = literal ? escapeRegExp(find) : find
  if (wholeWord) pattern = `\\b(?:${pattern})\\b`

  let flags = 'g'
  if (!caseSensitive) flags += 'i'
  if (multiline) flags += 'm'
  if (dotAll) flags += 's'

  try {
    return new RegExp(pattern, flags)
  } catch (err) {
    throw new RangeError(`invalid regex: ${err.message}`)
  }
}

// Conta ocorrências sem travar em matches de comprimento zero.
export function countMatches(input, regex) {
  if (!input || !regex) return 0
  const re = new RegExp(regex.source, regex.flags)
  let count = 0
  let m
  while ((m = re.exec(input)) !== null) {
    count++
    if (m[0] === '') re.lastIndex++
  }
  return count
}

// Quebra o texto de entrada em segmentos { text, match } pra destacar
// as ocorrências no preview sem alterar os dados originais.
export function findSegments(input, regex) {
  if (!input || !regex) return [{ text: input || '', match: false }]
  const re = new RegExp(regex.source, regex.flags)
  const out = []
  let last = 0
  let m
  while ((m = re.exec(input)) !== null) {
    if (m.index > last) {
      out.push({ text: input.slice(last, m.index), match: false })
    }
    if (m[0].length > 0) {
      out.push({ text: m[0], match: true })
    }
    last = m.index + m[0].length
    if (m[0] === '') re.lastIndex++
  }
  if (last < input.length) {
    out.push({ text: input.slice(last), match: false })
  }
  return out
}

// Expande o texto de reposição: $$ → $ literal, $& → match inteiro,
// $0 → match inteiro, $1..$99 → grupo de captura.
export function expandReplacement(replacement, capture) {
  if (!replacement) return ''
  const groups = capture.slice(0, capture.length - 2)
  return replacement.replace(/\$(\$|&|0|[1-9]\d*)/g, (whole, tok) => {
    if (tok === '$') return '$'
    if (tok === '&') return groups[0]
    if (tok === '0') return groups[0]
    const idx = Number(tok)
    return groups[idx] !== undefined ? groups[idx] : ''
  })
}

// Aplica a substituição em todas as ocorrências (String.replace é exaustiva
// porque a regex é sempre global). Usa função de callback para que só os
// tokens $... que a própria UI suporta sejam expandidos.
export function replaceAllMatches(input, regex, replacement) {
  if (!input || !regex) return input || ''
  return input.replace(regex, (...args) => expandReplacement(replacement, args))
}