// Parser/validador de arquivo .env — puro, sem dependência de React.
// Cobre o subconjunto prático do formato dotenv:
//   - linhas em branco e comentários (#)
//   - prefixo opcional "export "
//   - valores com aspas simples, aspas duplas ou sem aspas
//   - comentário inline (# ...) apenas em valores SEM aspas
//   - chaves válidas devem começar com letra ou "_" e conter letras/dígitos/"_"
// Também detecta problemas comuns:
//   - chave duplicada
//   - chave sem valor
//   - nome de chave inválido
//   - linha sem '='
//   - referência a variável indefinida em valores ($NAME / ${NAME})
//
// Retorna { entries, issues, counts }.

const KEY_RE = /^[A-Za-z_][A-Za-z0-9_]*$/
const REF_RE = /\$(\{[A-Za-z_][A-Za-z0-9_]*\}|[A-Za-z_][A-Za-z0-9_]*)/g

function stripInlineComment(value) {
  // Remove comentário inline (#) respeitando escapes simples de '\#'.
  let result = ''
  for (let i = 0; i < value.length; i++) {
    if (value[i] === '\\' && value[i + 1] === '#') {
      result += '#'
      i++
      continue
    }
    if (value[i] === '#') break
    result += value[i]
  }
  return result.replace(/\s+$/, '')
}

export function parseEnv(input) {
  const text = String(input || '').replace(/^\uFEFF/, '')
  const lines = text.split(/\r?\n/)

  const entries = [] // cada chave válida parseada
  const issues = [] // erros (impedem aquele uso do valor)
  const warnings = [] // avisos (duplicada, ref. indefinida)
  const seen = {}

  lines.forEach((raw, idx) => {
    const lineNo = idx + 1
    let line = raw.trimStart()

    // Remove um prefixo "export " presente.
    if (/^export\s+/.test(line)) line = line.replace(/^export\s+/, '')

    // Linha em branco ou comentário.
    if (!line || line.startsWith('#')) return

    const eq = line.indexOf('=')
    if (eq === -1) {
      issues.push({ line: lineNo, code: 'no-equals', raw })
      return
    }

    const key = line.slice(0, eq).trim()
    let value = line.slice(eq + 1)

    if (!key) {
      issues.push({ line: lineNo, code: 'empty-key', raw })
      return
    }

    if (!KEY_RE.test(key)) {
      issues.push({ line: lineNo, code: 'invalid-key', raw, key })
      return
    }

    // Valor: remove apenas o espaço em branco inicial.
    value = value.replace(/^\s+/, '')

    let quote = null // null | "'" | '"'
    let finalValue = value

    if (value.startsWith('"')) {
      if (value.endsWith('"') && value.length >= 2) {
        quote = '"'
        finalValue = value.slice(1, -1)
      } else {
        issues.push({ line: lineNo, code: 'unclosed-quote', raw, key })
        return
      }
    } else if (value.startsWith("'")) {
      if (value.endsWith("'") && value.length >= 2) {
        quote = "'"
        finalValue = value.slice(1, -1)
      } else {
        issues.push({ line: lineNo, code: 'unclosed-quote', raw, key })
        return
      }
    } else {
      // Sem aspas: remove comentário inline e espaço do final.
      finalValue = stripInlineComment(value)
    }

    if (seen[key] !== undefined) {
      warnings.push({
        line: lineNo,
        code: 'duplicate',
        key,
        raw,
        previousLine: seen[key],
      })
    }
    seen[key] = lineNo

    entries.push({ key, value: finalValue, quote, line: lineNo, raw })
  })

  const defined = new Map(entries.map((e) => [e.key, e]))

  // Varredura de referências ($NAME / ${NAME}) nos valores definidos.
  entries.forEach((e) => {
    REF_RE.lastIndex = 0
    let m
    while ((m = REF_RE.exec(e.value)) !== null) {
      const name = m[1].replace(/[{}]/g, '')
      if (!defined.has(name)) {
        warnings.push({
          line: e.line,
          code: 'undefined-ref',
          ref: m[0],
          key: e.key,
        })
      }
    }
  })

  return { entries, issues, warnings }
}