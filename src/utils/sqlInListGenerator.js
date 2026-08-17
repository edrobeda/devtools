/**
 * Motor do Gerador de Cláusula SQL IN.
 * Converte uma lista de valores em uma expressão `IN` ou `NOT IN` pronta para SQL,
 * 100% no navegador. Nenhum dado sai do navegador.
 */

export const DATA_TYPES = ['string', 'number', 'integer', 'date', 'raw']

export const DATA_TYPE_LABELS = {
  pt: {
    string: 'Texto (string)',
    number: 'Número decimal',
    integer: 'Inteiro',
    date: 'Data/hora (string)',
    raw: 'Identificador/raw (sem aspas)',
  },
  en: {
    string: 'Text (string)',
    number: 'Decimal number',
    integer: 'Integer',
    date: 'Date/time (string)',
    raw: 'Identifier/raw (no quotes)',
  },
}

export const QUOTES = ["'", '"', '`']

export const NULL_BEHAVIORS = ['omit', 'null', 'emptyAsNull']

export const NULL_BEHAVIOR_LABELS = {
  pt: {
    omit: 'Ignorar vazios/NULL',
    null: 'Manter NULL literal',
    emptyAsNull: 'Vazio vira NULL',
  },
  en: {
    omit: 'Skip empty/NULL',
    null: 'Keep NULL literal',
    emptyAsNull: 'Empty becomes NULL',
  },
}

export const SORTS = ['none', 'asc', 'desc']

export const SORT_LABELS = {
  pt: {
    none: 'Manter ordem original',
    asc: 'Crescente',
    desc: 'Decrescente',
  },
  en: {
    none: 'Keep original order',
    asc: 'Ascending',
    desc: 'Descending',
  },
}

export const OUTPUT_MODES = ['values', 'where', 'notWhere']

export const OUTPUT_MODE_LABELS = {
  pt: {
    values: 'Apenas a lista de valores',
    where: 'WHERE coluna IN (...)',
    notWhere: 'WHERE coluna NOT IN (...)',
  },
  en: {
    values: 'Value list only',
    where: 'WHERE column IN (...)',
    notWhere: 'WHERE column NOT IN (...)',
  },
}

export const CHUNK_SIZES = [0, 100, 500, 1000, 2500]

function escapeQuotes(value, quote) {
  if (quote === "'") return value.replace(/'/g, "''")
  if (quote === '"') return value.replace(/"/g, '""')
  if (quote === '`') return value.replace(/`/g, '``')
  return value
}

function looksLikeNull(s) {
  return s === '' || /^NULL$/i.test(s)
}

function parseValue(raw, dataType) {
  const value = raw.trim()
  if (dataType === 'number') {
    if (value === '' || isNaN(Number(value))) return { ok: false, error: `not a number: ${JSON.stringify(raw)}` }
    return { ok: true, value, sortKey: Number(value) }
  }
  if (dataType === 'integer') {
    if (!/^-?\d+$/.test(value)) return { ok: false, error: `not an integer: ${JSON.stringify(raw)}` }
    return { ok: true, value, sortKey: Number(value) }
  }
  if (dataType === 'date') {
    return { ok: true, value, sortKey: value }
  }
  if (dataType === 'raw') {
    return { ok: true, value, sortKey: value }
  }
  // string
  return { ok: true, value, sortKey: value }
}

export function generateInList(input, options) {
  const {
    dataType = 'string',
    quote = "'",
    nullBehavior = 'omit',
    dedupe = true,
    caseInsensitive = false,
    sort = 'none',
    chunkSize = 1000,
    outputMode = 'values',
    columnName = 'id',
    wrapInParentheses = true,
  } = options

  const rawLines = input.split(/\r?\n/)
  const items = []
  const invalid = []

  for (const raw of rawLines) {
    if (looksLikeNull(raw)) {
      if (nullBehavior === 'null' || nullBehavior === 'emptyAsNull') {
        items.push({ type: 'null', raw: 'NULL', sortKey: null })
      }
      continue
    }

    const parsed = parseValue(raw, dataType)
    if (!parsed.ok) {
      invalid.push(parsed.error)
      continue
    }

    items.push({
      type: 'value',
      raw: parsed.value,
      sortKey: parsed.sortKey,
    })
  }

  const totalParsed = items.length
  const totalInputLines = rawLines.length

  // dedupe
  const seen = new Set()
  const uniqueItems = []
  for (const item of items) {
    const key = item.type === 'null' ? '\0NULL' : caseInsensitive ? String(item.sortKey).toLowerCase() : String(item.sortKey)
    if (!seen.has(key)) {
      seen.add(key)
      uniqueItems.push(item)
    }
  }

  // sort
  let sortedItems = uniqueItems
  if (sort === 'asc') {
    sortedItems = [...uniqueItems].sort((a, b) => {
      if (a.type === 'null') return -1
      if (b.type === 'null') return 1
      if (typeof a.sortKey === 'number' && typeof b.sortKey === 'number') return a.sortKey - b.sortKey
      return String(a.sortKey).localeCompare(String(b.sortKey))
    })
  } else if (sort === 'desc') {
    sortedItems = [...uniqueItems].sort((a, b) => {
      if (a.type === 'null') return 1
      if (b.type === 'null') return -1
      if (typeof a.sortKey === 'number' && typeof b.sortKey === 'number') return b.sortKey - a.sortKey
      return String(b.sortKey).localeCompare(String(a.sortKey))
    })
  }

  function formatItem(item) {
    if (item.type === 'null') return 'NULL'
    if (dataType === 'number' || dataType === 'integer' || dataType === 'raw') return item.raw
    return `${quote}${escapeQuotes(item.raw, quote)}${quote}`
  }

  const maxChunk = chunkSize > 0 ? chunkSize : Infinity
  const chunks = []
  for (let i = 0; i < sortedItems.length; i += maxChunk) {
    chunks.push(sortedItems.slice(i, i + maxChunk))
  }
  if (chunks.length === 0) chunks.push([])

  const formattedChunks = chunks.map((chunk) => chunk.map(formatItem).join(', '))

  let text = ''
  if (outputMode === 'values') {
    if (formattedChunks.length === 1) {
      text = wrapInParentheses ? `(${formattedChunks[0]})` : formattedChunks[0]
    } else {
      text = formattedChunks.map((c) => (wrapInParentheses ? `(${c})` : c)).join('\n')
    }
  } else {
    const operator = outputMode === 'notWhere' ? 'NOT IN' : 'IN'
    const logical = outputMode === 'notWhere' ? 'AND' : 'OR'
    const expressions = formattedChunks.map((c) => `${columnName} ${operator} (${c})`)
    if (expressions.length === 1) {
      text = `WHERE ${expressions[0]}`
    } else {
      text = `WHERE (${expressions.join(` ${logical} `)})`
    }
  }

  return {
    text,
    totalInputLines,
    totalParsed,
    uniqueCount: uniqueItems.length,
    invalidCount: invalid.length,
    invalid,
    chunks: formattedChunks.length,
  }
}

export const SOURCE_SNIPPET = `function generateInList(input, options) {
  const { dataType, quote, nullBehavior, dedupe, sort, chunkSize, outputMode, columnName } = options

  const lines = input.split(/\\r?\\n/)
  const items = []

  for (const raw of lines) {
    const trimmed = raw.trim()
    if (!trimmed || /^NULL$/i.test(trimmed)) {
      if (nullBehavior !== 'omit') items.push({ type: 'null' })
      continue
    }

    if (dataType === 'number' && isNaN(Number(trimmed))) continue
    if (dataType === 'integer' && !/^-?\\d+$/.test(trimmed)) continue

    items.push({ type: 'value', raw: trimmed })
  }

  // dedupe
  const seen = new Set()
  const unique = items.filter((it) => {
    if (it.type === 'null') return !seen.has('NULL') && seen.add('NULL')
    const key = dedupe ? it.raw : Math.random()
    return !seen.has(key) && seen.add(key)
  })

  // sort
  const sorted = sort === 'none' ? unique : [...unique].sort(/* ... */)

  // chunk and format
  const chunks = []
  for (let i = 0; i < sorted.length; i += chunkSize || sorted.length) {
    chunks.push(sorted.slice(i, i + (chunkSize || sorted.length)))
  }

  return chunks.map((chunk) =>
    chunk.map((it) => {
      if (it.type === 'null') return 'NULL'
      if (dataType === 'string' || dataType === 'date') return quote + it.raw.replace(new RegExp(quote, 'g'), quote + quote) + quote
      return it.raw
    }).join(', ')
  )
}`
