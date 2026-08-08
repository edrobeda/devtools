// ─────────────────────────────────────────────────────────────
// SQL Formatter / Minifier — 100% client-side, sem dependências externas.
// Tokenizer próprio (strings, identificadores entre aspas/backtick/colchetes,
// comentários de linha e bloco, números, operadores) + re-emissor com regras
// determinísticas: uma cláusula por linha, item de lista por linha, marcação
// de parêntese de bloco (subquery / CREATE TABLE) para indentação extra.
// ─────────────────────────────────────────────────────────────

const NEWLINE_CLAUSES = new Set([
  'SELECT', 'FROM', 'WHERE', 'HAVING', 'GROUP', 'ORDER', 'LIMIT', 'OFFSET',
  'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'ALTER', 'DROP', 'TRUNCATE',
  'WITH', 'UNION', 'EXPLAIN', 'BEGIN', 'COMMIT', 'ROLLBACK', 'GRANT',
  'REVOKE', 'SET', 'VALUES', 'RETURNING',
])

// Cláusulas cujo conteúdo entra na linha seguinte, indentado +1, com
// quebras em vírgula (um item por linha).
const LIST_CLAUSES = new Set([
  'SELECT', 'FROM', 'WHERE', 'HAVING', 'VALUES', 'RETURNING', 'SET',
])

const AND_OR = new Set(['AND', 'OR'])

const ALL_KEYWORDS = new Set([
  ...NEWLINE_CLAUSES,
  ...LIST_CLAUSES,
  'ON', 'AS', 'INTO', 'TABLE', 'INDEX', 'VIEW', 'TEMP', 'TEMPORARY', 'IF',
  'EXISTS', 'NOT', 'NULL', 'IS', 'IN', 'BETWEEN', 'LIKE', 'DISTINCT',
  'ALL', 'ASC', 'DESC', 'ADD', 'COLUMN', 'CONSTRAINT', 'PRIMARY', 'KEY',
  'FOREIGN', 'REFERENCES', 'DEFAULT', 'UNIQUE', 'CHECK', 'CASE', 'WHEN',
  'THEN', 'ELSE', 'END',
])

const up = (v) => (typeof v === 'string' ? v.toUpperCase() : '')

function isKeyword(t) {
  return t.type === 'word' && ALL_KEYWORDS.has(up(t.value))
}

function renderToken(t, upperKeywords) {
  if (t.type !== 'word') return t.value
  return isKeyword(t) && upperKeywords ? up(t.value) : t.value
}

// ────────────────────────────── tokenizer ──────────────────────────────

export function tokenizeSql(sql) {
  const tokens = []
  let i = 0
  const n = sql.length

  while (i < n) {
    const ch = sql[i]
    const spBefore = i > 0 && /\s/.test(sql[i - 1])

    if (/\s/.test(ch)) {
      i++
      continue
    }

    if (ch === '-' && sql[i + 1] === '-') {
      let end = sql.indexOf('\n', i)
      if (end === -1) end = n
      tokens.push({ type: 'comment', value: sql.slice(i, end), spBefore })
      i = end
      continue
    }

    if (ch === '/' && sql[i + 1] === '*') {
      const end = sql.indexOf('*/', i + 2)
      if (end === -1) {
        tokens.push({ type: 'comment', value: sql.slice(i), unclosed: true })
        break
      }
      tokens.push({ type: 'comment', value: sql.slice(i, end + 2), spBefore })
      i = end + 2
      continue
    }

    // string '...' com '' escapado
    if (ch === "'") {
      let j = i + 1
      let body = ''
      let closed = false
      while (j < n) {
        if (sql[j] === "'" && sql[j + 1] === "'") {
          body += "''"
          j += 2
        } else if (sql[j] === "'") {
          body += "'"
          j++
          closed = true
          break
        } else {
          body += sql[j]
          j++
        }
      }
      tokens.push({ type: 'string', value: "'" + body, unclosed: !closed, spBefore })
      i = j
      continue
    }

    // identificador "..." / `...` / [ ... ]
    if (ch === '"' || ch === '`' || ch === '[') {
      const close = ch === '[' ? ']' : ch
      let j = i + 1
      let value = ch
      let closed = false
      while (j < n) {
        if (sql[j] === close && sql[j + 1] === close) {
          value += close + close
          j += 2
        } else if (sql[j] === close) {
          value += close
          j++
          closed = true
          break
        } else {
          value += sql[j]
          j++
        }
      }
      tokens.push({ type: 'ident', value, unclosed: !closed, spBefore })
      i = j
      continue
    }

    // números (decimal, float, notação e/E, hex)
    if (/[0-9]/.test(ch)) {
      let j = i
      if (ch === '0' && (sql[i + 1] === 'x' || sql[i + 1] === 'X')) {
        j += 2
        while (j < n && /[0-9a-fA-F]/.test(sql[j])) j++
      } else {
        while (j < n && /[0-9]/.test(sql[j])) j++
        if (sql[j] === '.' && /[0-9]/.test(sql[j + 1])) {
          j++
          while (j < n && /[0-9]/.test(sql[j])) j++
        }
        if (sql[j] === 'e' || sql[j] === 'E') {
          j++
          if (sql[j] === '+' || sql[j] === '-') j++
          while (j < n && /[0-9]/.test(sql[j])) j++
        }
      }
      tokens.push({ type: 'number', value: sql.slice(i, j), spBefore })
      i = j
      continue
    }

    // palavra / identificador simples (inclui string com prefixo E'...'/N'...')
    if (/[A-Za-z_]/.test(ch)) {
      let j = i
      while (j < n && /[A-Za-z0-9_$]/.test(sql[j])) j++
      if (j < n && sql[j] === "'") {
        let k = j + 1
        let body = ''
        let closed = false
        while (k < n) {
          if (sql[k] === "'" && sql[k + 1] === "'") {
            body += "''"
            k += 2
          } else if (sql[k] === "'") {
            body += "'"
            k++
            closed = true
            break
          } else {
            body += sql[k]
            k++
          }
        }
        tokens.push({
          type: 'string',
          value: sql.slice(i, j) + "'" + body,
          unclosed: !closed,
          spBefore,
        })
        i = k
        continue
      }
      tokens.push({ type: 'word', value: sql.slice(i, j), spBefore })
      i = j
      continue
    }

    const two = sql.slice(i, i + 2)
    if (['<=', '>=', '!=', '<>', '||', '::', '->', '<-', '<=>'].includes(two)) {
      tokens.push({ type: 'op', value: two, spBefore })
      i += 2
      continue
    }

    if ('(),.;'.includes(ch)) {
      tokens.push({ type: 'punc', value: ch, spBefore })
      i++
      continue
    }

    tokens.push({ type: 'op', value: ch, spBefore })
    i++
  }

  return tokens
}

// Próximo token significativo (ignora comentários) a partir de fromIdx.
function nextSignificant(tokens, fromIdx) {
  for (let j = fromIdx; j < tokens.length; j++) {
    if (tokens[j].type !== 'comment') return j
  }
  return null
}

// ────────────────────────────── formatter ──────────────────────────────

export function formatSql(sql, opts = {}) {
  const upperKeywords = opts.upperKeywords !== false
  const indentUnit = opts.indent === 4 ? 4 : 2

  const tokens = tokenizeSql(sql)
  const nonEmpty = tokens.length > 0

  for (const t of tokens) {
    if (t.unclosed) {
      return {
        ok: false,
        error: t.type === 'comment' ? 'commentUnclosed' : 'quoteUnclosed',
        text: '',
      }
    }
  }

  const lines = []
  let curText = ''
  let curIndent = 0
  let scopeBase = 0
  let contentIndent = scopeBase + 1
  let hold = false
  let condMode = false
  let wantBy = false
  let afterCreate = false
  let ddlPending = false
  let openParens = 0
  let glueNext = false // próximo token cola sem espaço (após . :: -> ( )
  let doChain = false // ON CONFLICT DO UPDATE/SET: fica inline até o ;
  const stack = [] // {kind:'block'|'inline', base, restoreScope}

  const pad = (l) => ' '.repeat(l * indentUnit)
  const topIsInline = () => {
    const f = stack[stack.length - 1]
    return !!f && f.kind === 'inline'
  }

  function line() {
    if (curText) lines.push(pad(curIndent) + curText)
    curText = ''
  }

  function lineAt(level) {
    line()
    curIndent = level
    glueNext = false
  }

  function emit(text, noSpace) {
    if (!text) return
    if (curText) {
      const addSpace = !noSpace && !glueNext && !/[ \t]$/.test(curText)
      curText += (addSpace ? ' ' : '') + text
    } else {
      curText = text
    }
    glueNext = false
  }

  function openBlock() {
    stack.push({ kind: 'block', base: curIndent, restoreScope: scopeBase })
    scopeBase = curIndent + 1
    contentIndent = scopeBase
    openParens++
    emit('(')
    hold = true
    glueNext = true
  }

  function closeBlock() {
    const f = stack.pop()
    if (f && f.kind === 'block') {
      lineAt(f.base)
      scopeBase = f.restoreScope
      contentIndent = scopeBase + 1
    }
    openParens--
    emit(')', true)
  }

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i]

    // ── comentário: linha própria no indent atual ──
    if (t.type === 'comment') {
      if (curText) lineAt(curIndent)
      emit(t.value)
      continue
    }

    // ── pontuação ──
    if (t.type === 'punc') {
      if (t.value === '(') {
        const next = nextSignificant(tokens, i + 1)
        const nw = next !== null && tokens[next].type === 'word' ? up(tokens[next].value) : ''
        const isSub = next !== null && tokens[next].type === 'word' &&
          ['SELECT', 'WITH', 'INSERT', 'UPDATE', 'VALUES', 'CREATE'].includes(nw)
        if (isSub || ddlPending) {
          ddlPending = false
          openBlock()
        } else {
          if (hold) {
            lineAt(contentIndent)
            hold = false
          }
          const glued = !t.spBefore && i > 0 &&
            (tokens[i - 1].type === 'word' || tokens[i - 1].type === 'ident' ||
              tokens[i - 1].type === 'number' || tokens[i - 1].type === 'punc')
          stack.push({ kind: 'inline', base: curIndent })
          openParens++
          emit('(', glued)
          glueNext = true
        }
        continue
      }
      if (t.value === ')') {
        closeBlock()
        continue
      }
      if (t.value === ',') {
        emit(',', true)
        if (!topIsInline()) {
          lineAt(contentIndent)
          hold = false
        }
        continue
      }
      if (t.value === '.') {
        emit('.', true)
        glueNext = true
        continue
      }
      if (t.value === ';') {
        emit(';', true)
        lineAt(0)
        scopeBase = 0
        contentIndent = 1
        condMode = false
        wantBy = false
        hold = false
        doChain = false
        stack.length = 0
        openParens = 0
        continue
      }
    }

    // ── palavra ──
    if (t.type === 'word') {
      const upw = up(t.value)

      // GROUP BY / ORDER BY: o "BY" emenda e o resto vira lista
      if (upw === 'BY' && wantBy) {
        emit(renderToken(t, upperKeywords))
        wantBy = false
        hold = true
        contentIndent = scopeBase + 1
        continue
      }

      // AND / OR dentro de WHERE/HAVING/ON quebram linha
      if (AND_OR.has(upw)) {
        if (condMode && !topIsInline() && curText) {
          lineAt(contentIndent)
        }
        emit(renderToken(t, upperKeywords))
        continue
      }

      // palavra-chave de cláusula: linha própria no indent-base do escopo
      if (NEWLINE_CLAUSES.has(upw)) {
        // ON CONFLICT DO UPDATE/SET: mantém inline até o próximo `;`
        if (doChain && (upw === 'UPDATE' || upw === 'SET' || upw === 'INSERT' || upw === 'VALUES')) {
          emit(renderToken(t, upperKeywords))
          condMode = false
          continue
        }
        wantBy = false
        condMode = upw === 'WHERE' || upw === 'HAVING'
        lineAt(scopeBase)
        emit(renderToken(t, upperKeywords))
        if (upw === 'CREATE') {
          afterCreate = true
          continue
        }
        afterCreate = false
        if (upw === 'GROUP' || upw === 'ORDER') {
          wantBy = true
          continue
        }
        if (!LIST_CLAUSES.has(upw)) {
          continue // INSERT/UPDATE/LIMIT/etc.: conteúdo continua na linha
        }
        // SELECT DISTINCT/ALL ficam inline antes de quebrar o conteúdo
        if (upw === 'SELECT') {
          let j = i + 1
          let nxt = nextSignificant(tokens, j)
          while (nxt !== null && tokens[nxt].type === 'word' &&
            (up(tokens[nxt].value) === 'DISTINCT' || up(tokens[nxt].value) === 'ALL')) {
            emit(renderToken(tokens[nxt], upperKeywords))
            j = nxt + 1
            nxt = nextSignificant(tokens, j)
          }
          i = j - 1
        }
        hold = true
        contentIndent = scopeBase + 1
        continue
      }

      // CREATE ... TABLE -> o próximo parêntese é bloco de colunas
      if (afterCreate && upw === 'TABLE') {
        ddlPending = true
        afterCreate = false
      } else {
        afterCreate = false
      }

      // palavra normal / identificador
      if (upw === 'ON') condMode = true
      if (upw === 'DO') doChain = true
      if (hold) {
        lineAt(contentIndent)
        hold = false
      }
      emit(renderToken(t, upperKeywords))
      continue
    }

    // ── número / string / identificador / operador ──
    if (hold) {
      lineAt(contentIndent)
      hold = false
    }
    if (t.type === 'op' && ['::', '->', '#>', '@>'].includes(t.value)) {
      emit(t.value, true)
      glueNext = true
    } else {
      emit(t.value)
    }
  }

  if (nonEmpty) {
    if (curText) lines.push(pad(curIndent) + curText)
    if (openParens > 0) {
      return { ok: false, error: 'parenUnbalanced', text: '' }
    }
  }

  return { ok: true, text: lines.join('\n') }
}

// ────────────────────────────── minifier ──────────────────────────────

export function minifySql(sql) {
  const tokens = tokenizeSql(sql).filter((t) => t.type !== 'comment')
  let out = ''
  for (let i = 0; i < tokens.length; i++) {
    const v = tokens[i].value
    const prev = i > 0 ? tokens[i - 1].value : ''
    const prevBound = /[A-Za-z0-9_$"')\]]$/.test(prev) || prev === '*'
    const curBound = /[A-Za-z0-9_$"'[\*]/.test(v)
    const needSpace = i > 0 && prevBound && curBound
    out += (needSpace ? ' ' : '') + v
  }
  return out
}

// ────────────────────────────── stats ──────────────────────────────

export function sqlStats(sql) {
  const tokens = tokenizeSql(sql)
  if (tokens.length === 0) return { statements: 0, tokens: 0 }
  const semis = tokens.filter((t) => t.type === 'punc' && t.value === ';').length
  const last = tokens[tokens.length - 1]
  const endsWithSemi = last.type === 'punc' && last.value === ';'
  return {
    statements: endsWithSemi ? semis : semis + 1,
    tokens: tokens.length,
  }
}