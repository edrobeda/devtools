/**
 * Motor do conversor CSV → SQL.
 * Parser RFC 4180-ish, inferência de tipos por coluna e geração de
 * CREATE TABLE + INSERT para PostgreSQL, MySQL, SQLite e SQL Server.
 * Tudo roda no navegador — nenhum dado sai daqui.
 */

export const DIALECTS = ['postgres', 'mysql', 'sqlite', 'sqlserver']

export const COMMON_TYPES = [
  'TEXT',
  'VARCHAR',
  'INTEGER',
  'BIGINT',
  'REAL',
  'NUMERIC',
  'DECIMAL',
  'BOOLEAN',
  'DATE',
  'TIMESTAMP',
  'DATETIME',
  'JSON',
  'BLOB',
]

const TYPE_MAP = {
  postgres: {
    TEXT: 'TEXT',
    VARCHAR: 'VARCHAR',
    INTEGER: 'INTEGER',
    BIGINT: 'BIGINT',
    REAL: 'REAL',
    NUMERIC: 'NUMERIC',
    DECIMAL: 'NUMERIC',
    BOOLEAN: 'BOOLEAN',
    DATE: 'DATE',
    TIMESTAMP: 'TIMESTAMP',
    DATETIME: 'TIMESTAMP',
    JSON: 'JSONB',
    BLOB: 'BYTEA',
  },
  mysql: {
    TEXT: 'TEXT',
    VARCHAR: 'VARCHAR',
    INTEGER: 'INT',
    BIGINT: 'BIGINT',
    REAL: 'DOUBLE',
    NUMERIC: 'DECIMAL',
    DECIMAL: 'DECIMAL(19,4)',
    BOOLEAN: 'TINYINT(1)',
    DATE: 'DATE',
    TIMESTAMP: 'TIMESTAMP',
    DATETIME: 'DATETIME',
    JSON: 'JSON',
    BLOB: 'BLOB',
  },
  sqlite: {
    TEXT: 'TEXT',
    VARCHAR: 'TEXT',
    INTEGER: 'INTEGER',
    BIGINT: 'INTEGER',
    REAL: 'REAL',
    NUMERIC: 'NUMERIC',
    DECIMAL: 'NUMERIC',
    BOOLEAN: 'INTEGER',
    DATE: 'TEXT',
    TIMESTAMP: 'TEXT',
    DATETIME: 'TEXT',
    JSON: 'TEXT',
    BLOB: 'BLOB',
  },
  sqlserver: {
    TEXT: 'NVARCHAR(MAX)',
    VARCHAR: 'NVARCHAR',
    INTEGER: 'INT',
    BIGINT: 'BIGINT',
    REAL: 'FLOAT',
    NUMERIC: 'NUMERIC',
    DECIMAL: 'DECIMAL(19,4)',
    BOOLEAN: 'BIT',
    DATE: 'DATE',
    TIMESTAMP: 'DATETIME2',
    DATETIME: 'DATETIME2',
    JSON: 'NVARCHAR(MAX)',
    BLOB: 'VARBINARY(MAX)',
  },
}

/**
 * Parser CSV simples e robusto: lida com campos entre aspas, aspas
 * escapadas ("") e quebras de linha dentro de campos.
 */
export function parseCsv(text, delimiter = ',') {
  const rows = []
  let row = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += c
      }
    } else if (c === '"') {
      inQuotes = true
    } else if (c === delimiter) {
      row.push(field)
      field = ''
    } else if (c === '\n') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else if (c === '\r') {
      // ignora; o \n seguinte fecha a linha
    } else {
      field += c
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field)
    rows.push(row)
  }
  return rows.filter((r) => !(r.length === 1 && r[0] === ''))
}

function normalizeHeader(name) {
  // remove acentos comuns e caracteres estranhos
  const cleaned = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase()
  if (!cleaned) return 'col'
  if (/^\d/.test(cleaned)) return '_' + cleaned
  return cleaned
}

function inferType(values) {
  if (values.length === 0) return 'TEXT'

  const boolRe = /^(true|false|1|0|yes|no)$/i
  if (values.every((v) => boolRe.test(v))) return 'BOOLEAN'

  if (values.every((v) => /^-?\d+$/.test(v))) {
    const nums = values.map(Number)
    if (nums.every((n) => Number.isSafeInteger(n))) return 'INTEGER'
    return 'BIGINT'
  }

  if (
    values.every(
      (v) =>
        /^-?\d+\.\d+$/.test(v) ||
        /^-?\d+\.\d+[eE][+-]?\d+$/.test(v) ||
        /^-?\d+[eE][+-]?\d+$/.test(v)
    )
  ) {
    return 'REAL'
  }

  if (values.every((v) => /^\d{4}-\d{2}-\d{2}$/.test(v))) return 'DATE'
  if (
    values.every((v) => /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:?\d{2})?$/.test(v))
  ) {
    return 'TIMESTAMP'
  }

  if (
    values.every((v) => {
      try {
        JSON.parse(v)
        return true
      } catch {
        return false
      }
    })
  ) {
    return 'JSON'
  }

  return 'TEXT'
}

export function inferColumns(rows) {
  if (!rows || rows.length === 0) return []
  const header = rows[0]
  const dataRows = rows.slice(1)

  return header.map((h, idx) => {
    const values = dataRows.map((r) => (r[idx] ?? '').trim()).filter((v) => v !== '')
    const type = inferType(values)
    const maxLength = values.reduce((max, v) => Math.max(max, v.length), 0)
    return {
      originalName: h,
      name: normalizeHeader(h),
      type,
      nullable: true,
      primaryKey: false,
      maxLength,
      index: idx,
    }
  })
}

export function quoteId(name, dialect) {
  if (dialect === 'mysql') return `\`${name}\``
  if (dialect === 'sqlserver') return `[${name.replace(/]/g, ']]')}]`
  return `"${name.replace(/"/g, '""')}"`
}

export function sqlType(type, dialect, maxLength) {
  const mapped = TYPE_MAP[dialect]?.[type] ?? 'TEXT'

  if (type === 'VARCHAR') {
    if (dialect === 'sqlserver') {
      const len = Math.max(maxLength || 0, 50)
      return `NVARCHAR(${len})`
    }
    const len = Math.max(maxLength || 0, 50)
    return `VARCHAR(${len})`
  }

  return mapped
}

function quoteString(v) {
  return `'${String(v).replace(/'/g, "''")}'`
}

function serializeValue(raw, col, dialect) {
  const v = raw === undefined || raw === null ? '' : String(raw).trim()

  if (v === '') {
    if (col.type === 'BOOLEAN') {
      return dialect === 'postgres' || dialect === 'sqlite' ? 'FALSE' : '0'
    }
    return col.nullable ? 'NULL' : quoteString('')
  }

  if (col.type === 'BOOLEAN') {
    const truthy = /^(true|1|yes)$/i.test(v)
    if (dialect === 'postgres' || dialect === 'sqlite') return truthy ? 'TRUE' : 'FALSE'
    return truthy ? '1' : '0'
  }

  if (['INTEGER', 'BIGINT', 'REAL', 'NUMERIC', 'DECIMAL'].includes(col.type)) {
    const n = Number(v)
    if (Number.isFinite(n)) return String(n)
    return col.nullable ? 'NULL' : quoteString(v)
  }

  return quoteString(v)
}

export function generateCreateTable(tableName, columns, dialect, opts = {}) {
  const { includeCreate = true, ifNotExists = false, dropTable = false } = opts
  if (!includeCreate) return ''

  const qid = (n) => quoteId(n, dialect)
  const lines = []
  if (dropTable) lines.push(`DROP TABLE IF EXISTS ${qid(tableName)};`)

  const defs = columns.map((col) => {
    let def = `${qid(col.name)} ${sqlType(col.type, dialect, col.maxLength)}`
    if (!col.nullable) def += ' NOT NULL'
    if (col.primaryKey) def += ' PRIMARY KEY'
    return `  ${def}`
  })

  let stmt
  if (dialect === 'sqlserver' && ifNotExists) {
    const escaped = tableName.replace(/'/g, "''")
    stmt = `IF OBJECT_ID('${escaped}', 'U') IS NULL\nCREATE TABLE ${qid(tableName)} (\n${defs.join(',\n')}\n);`
  } else {
    const ifClause = ifNotExists ? 'IF NOT EXISTS ' : ''
    stmt = `CREATE TABLE ${ifClause}${qid(tableName)} (\n${defs.join(',\n')}\n);`
  }

  if (lines.length) {
    lines.push(stmt)
    return lines.join('\n')
  }
  return stmt
}

export function generateInsert(tableName, columns, rows, dialect, batchSize = 0) {
  if (!rows || rows.length <= 1) return ''

  const dataRows = rows.slice(1)
  const qid = (n) => quoteId(n, dialect)
  const colNames = columns.map((c) => qid(c.name)).join(', ')
  const header = `INSERT INTO ${qid(tableName)} (${colNames}) VALUES`
  const size = batchSize > 0 ? batchSize : dataRows.length

  const batches = []
  for (let i = 0; i < dataRows.length; i += size) {
    batches.push(dataRows.slice(i, i + size))
  }

  return batches
    .map((batch) => {
      const values = batch
        .map((r) => {
          const vals = columns.map((c) => serializeValue(r[c.index] ?? '', c, dialect))
          return `  (${vals.join(', ')})`
        })
        .join(',\n')
      return `${header}\n${values};`
    })
    .join('\n\n')
}
