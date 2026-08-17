/**
 * Database Storage Estimator
 * Estima o tamanho físico de tabelas e índices 100% no navegador.
 * Os valores são ordens de grandeza baseadas em documentação pública dos
 * principais engines (InnoDB, PostgreSQL heap, SQLite, SQL Server, MongoDB).
 */

export const ENGINES = {
  INNODB: 'innodb',
  POSTGRES: 'postgres',
  SQLITE: 'sqlite',
  SQLSERVER: 'sqlserver',
  MONGODB: 'mongodb',
}

export const ENGINE_LABELS = {
  [ENGINES.INNODB]: { pt: 'MySQL / MariaDB (InnoDB)', en: 'MySQL / MariaDB (InnoDB)' },
  [ENGINES.POSTGRES]: { pt: 'PostgreSQL (heap)', en: 'PostgreSQL (heap)' },
  [ENGINES.SQLITE]: { pt: 'SQLite', en: 'SQLite' },
  [ENGINES.SQLSERVER]: { pt: 'SQL Server', en: 'SQL Server' },
  [ENGINES.MONGODB]: { pt: 'MongoDB (BSON)', en: 'MongoDB (BSON)' },
}

// Overhead fixo por linha/doc (bytes) e multiplicador de página/overhead geral
export const ENGINE_OVERHEAD = {
  [ENGINES.INNODB]: { row: 27, pageFactor: 1.15, indexFactor: 1.5 },
  [ENGINES.POSTGRES]: { row: 23, pageFactor: 1.10, indexFactor: 1.4 },
  [ENGINES.SQLITE]: { row: 4, pageFactor: 1.05, indexFactor: 1.2 },
  [ENGINES.SQLSERVER]: { row: 7, pageFactor: 1.10, indexFactor: 1.3 },
  [ENGINES.MONGODB]: { row: 24, pageFactor: 1.10, indexFactor: 1.25 },
}

// Tipos de dados e tamanhos aproximados em bytes
// variable = true significa que o campo aceita tamanho extra (ex.: VARCHAR, TEXT)
export const DATA_TYPES = {
  BOOLEAN: { key: 'BOOLEAN', label: 'BOOLEAN / TINYINT', baseBytes: 1, variable: false },
  SMALLINT: { key: 'SMALLINT', label: 'SMALLINT', baseBytes: 2, variable: false },
  INTEGER: { key: 'INTEGER', label: 'INTEGER / INT', baseBytes: 4, variable: false },
  BIGINT: { key: 'BIGINT', label: 'BIGINT', baseBytes: 8, variable: false },
  REAL: { key: 'REAL', label: 'REAL / FLOAT', baseBytes: 4, variable: false },
  DOUBLE: { key: 'DOUBLE', label: 'DOUBLE / DOUBLE PRECISION', baseBytes: 8, variable: false },
  DECIMAL: { key: 'DECIMAL', label: 'DECIMAL / NUMERIC', baseBytes: 17, variable: false },
  DATE: { key: 'DATE', label: 'DATE', baseBytes: 4, variable: false },
  TIME: { key: 'TIME', label: 'TIME', baseBytes: 4, variable: false },
  DATETIME: { key: 'DATETIME', label: 'DATETIME / TIMESTAMP', baseBytes: 8, variable: false },
  CHAR: { key: 'CHAR', label: 'CHAR(n)', baseBytes: 1, variable: true, defaultVariableSize: 50 },
  VARCHAR: { key: 'VARCHAR', label: 'VARCHAR(n)', baseBytes: 1, variable: true, defaultVariableSize: 64 },
  TEXT: { key: 'TEXT', label: 'TEXT / CLOB', baseBytes: 16, variable: true, defaultVariableSize: 256 },
  BLOB: { key: 'BLOB', label: 'BLOB / BYTEA', baseBytes: 16, variable: true, defaultVariableSize: 256 },
  JSON: { key: 'JSON', label: 'JSON / JSONB', baseBytes: 16, variable: true, defaultVariableSize: 512 },
  UUID: { key: 'UUID', label: 'UUID', baseBytes: 16, variable: false },
  ENUM: { key: 'ENUM', label: 'ENUM / SET', baseBytes: 2, variable: false },
}

export const DATA_TYPE_KEYS = Object.keys(DATA_TYPES)

export const INDEX_TYPES = {
  BTREE: { key: 'BTREE', label: 'B-tree' },
  HASH: { key: 'HASH', label: 'Hash' },
  FULLTEXT: { key: 'FULLTEXT', label: 'Full-text' },
  GIN: { key: 'GIN', label: 'GIN' },
  GIST: { key: 'GIST', label: 'GiST' },
}

export const INDEX_TYPE_KEYS = Object.keys(INDEX_TYPES)

export const PRESETS = [
  {
    key: 'users',
    label: { pt: 'Tabela de usuários', en: 'Users table' },
    engine: ENGINES.INNODB,
    rows: 1_000_000,
    growth: 20,
    tables: [
      {
        name: 'users',
        rows: 1_000_000,
        columns: [
          { name: 'id', type: 'BIGINT', size: 0, nullable: false },
          { name: 'email', type: 'VARCHAR', size: 120, nullable: false },
          { name: 'name', type: 'VARCHAR', size: 120, nullable: true },
          { name: 'active', type: 'BOOLEAN', size: 0, nullable: false },
          { name: 'created_at', type: 'DATETIME', size: 0, nullable: false },
        ],
        indexes: [
          { name: 'PRIMARY', type: 'BTREE', columns: ['id'] },
          { name: 'idx_email', type: 'BTREE', columns: ['email'] },
        ],
      },
    ],
  },
  {
    key: 'ecommerce',
    label: { pt: 'E-commerce mínimo', en: 'Minimal e-commerce' },
    engine: ENGINES.POSTGRES,
    rows: null,
    growth: 35,
    tables: [
      {
        name: 'products',
        rows: 50_000,
        columns: [
          { name: 'id', type: 'BIGINT', size: 0, nullable: false },
          { name: 'sku', type: 'VARCHAR', size: 40, nullable: false },
          { name: 'name', type: 'VARCHAR', size: 200, nullable: false },
          { name: 'description', type: 'TEXT', size: 1500, nullable: true },
          { name: 'price', type: 'DECIMAL', size: 0, nullable: false },
          { name: 'stock', type: 'INTEGER', size: 0, nullable: false },
          { name: 'active', type: 'BOOLEAN', size: 0, nullable: false },
        ],
        indexes: [
          { name: 'PRIMARY', type: 'BTREE', columns: ['id'] },
          { name: 'idx_sku', type: 'BTREE', columns: ['sku'] },
        ],
      },
      {
        name: 'orders',
        rows: 500_000,
        columns: [
          { name: 'id', type: 'BIGINT', size: 0, nullable: false },
          { name: 'user_id', type: 'BIGINT', size: 0, nullable: false },
          { name: 'total', type: 'DECIMAL', size: 0, nullable: false },
          { name: 'status', type: 'ENUM', size: 0, nullable: false },
          { name: 'created_at', type: 'DATETIME', size: 0, nullable: false },
        ],
        indexes: [
          { name: 'PRIMARY', type: 'BTREE', columns: ['id'] },
          { name: 'idx_user_created', type: 'BTREE', columns: ['user_id', 'created_at'] },
        ],
      },
    ],
  },
  {
    key: 'logs',
    label: { pt: 'Tabela de logs', en: 'Log table' },
    engine: ENGINES.MONGODB,
    rows: null,
    growth: 100,
    tables: [
      {
        name: 'events',
        rows: 10_000_000,
        columns: [
          { name: '_id', type: 'UUID', size: 0, nullable: false },
          { name: 'level', type: 'VARCHAR', size: 10, nullable: false },
          { name: 'message', type: 'TEXT', size: 400, nullable: true },
          { name: 'metadata', type: 'JSON', size: 600, nullable: true },
          { name: 'timestamp', type: 'DATETIME', size: 0, nullable: false },
        ],
        indexes: [
          { name: '_id_', type: 'BTREE', columns: ['_id'] },
          { name: 'idx_timestamp', type: 'BTREE', columns: ['timestamp'] },
          { name: 'idx_level', type: 'BTREE', columns: ['level'] },
        ],
      },
    ],
  },
  {
    key: 'blog',
    label: { pt: 'Blog simples', en: 'Simple blog' },
    engine: ENGINES.INNODB,
    rows: null,
    growth: 15,
    tables: [
      {
        name: 'posts',
        rows: 10_000,
        columns: [
          { name: 'id', type: 'BIGINT', size: 0, nullable: false },
          { name: 'slug', type: 'VARCHAR', size: 120, nullable: false },
          { name: 'title', type: 'VARCHAR', size: 200, nullable: false },
          { name: 'body', type: 'TEXT', size: 8_000, nullable: true },
          { name: 'published', type: 'BOOLEAN', size: 0, nullable: false },
          { name: 'published_at', type: 'DATETIME', size: 0, nullable: true },
        ],
        indexes: [
          { name: 'PRIMARY', type: 'BTREE', columns: ['id'] },
          { name: 'idx_slug', type: 'BTREE', columns: ['slug'] },
          { name: 'idx_published_at', type: 'BTREE', columns: ['published_at'] },
        ],
      },
    ],
  },
  {
    key: 'saas',
    label: { pt: 'SaaS multi-tenant', en: 'Multi-tenant SaaS' },
    engine: ENGINES.POSTGRES,
    rows: null,
    growth: 50,
    tables: [
      {
        name: 'tenants',
        rows: 5_000,
        columns: [
          { name: 'id', type: 'UUID', size: 0, nullable: false },
          { name: 'name', type: 'VARCHAR', size: 120, nullable: false },
          { name: 'plan', type: 'ENUM', size: 0, nullable: false },
          { name: 'created_at', type: 'DATETIME', size: 0, nullable: false },
        ],
        indexes: [{ name: 'PRIMARY', type: 'BTREE', columns: ['id'] }],
      },
      {
        name: 'resources',
        rows: 50_000_000,
        columns: [
          { name: 'id', type: 'BIGINT', size: 0, nullable: false },
          { name: 'tenant_id', type: 'UUID', size: 0, nullable: false },
          { name: 'data', type: 'JSON', size: 2_000, nullable: true },
          { name: 'created_at', type: 'DATETIME', size: 0, nullable: false },
        ],
        indexes: [
          { name: 'PRIMARY', type: 'BTREE', columns: ['id'] },
          { name: 'idx_tenant_created', type: 'BTREE', columns: ['tenant_id', 'created_at'] },
        ],
      },
    ],
  },
]

function columnSize(col) {
  const type = DATA_TYPES[col.type]
  if (!type) return 0
  if (type.variable) {
    // baseBytes geralmente represente o overhead do campo + tamanho variável
    return type.baseBytes + (Number(col.size) || type.defaultVariableSize)
  }
  return type.baseBytes
}

function estimateIndexSize(index, tableColumns, rows, engine) {
  if (!index || !index.columns || index.columns.length === 0) return 0
  const overhead = ENGINE_OVERHEAD[engine] || ENGINE_OVERHEAD[ENGINES.INNODB]
  const indexableColumns = tableColumns.filter((c) => index.columns.includes(c.name))
  const keySize = indexableColumns.reduce((sum, c) => sum + columnSize(c), 0) || 8

  let factor = overhead.indexFactor
  if (index.type === 'FULLTEXT') {
    // full-text costuma ocupar ~30% do texto indexado; usamos tamanho médio
    // das colunas textuais multiplicado pelas linhas
    const textColumns = tableColumns.filter((c) => {
      const t = DATA_TYPES[c.type]
      return t && (t.key === 'TEXT' || t.key === 'VARCHAR')
    })
    const avgText = textColumns.reduce((sum, c) => sum + columnSize(c), 0) || 64
    return avgText * rows * 0.3
  }
  if (index.type === 'GIN' || index.type === 'GIST') {
    factor = 2.0
  }
  if (index.type === 'HASH') {
    factor = 1.1
  }

  // Cada entrada de índice ~ keySize * factor + row pointer overhead
  return rows * (keySize * factor + 6)
}

export function estimateTable(table, engine) {
  const rows = Math.max(0, Number(table.rows) || 0)
  const columns = Array.isArray(table.columns) ? table.columns : []
  const indexes = Array.isArray(table.indexes) ? table.indexes : []
  const overhead = ENGINE_OVERHEAD[engine] || ENGINE_OVERHEAD[ENGINES.INNODB]

  // Tamanho bruto dos dados
  const rawDataSize = columns.reduce((sum, col) => sum + columnSize(col), 0)

  // Tamanho da linha com overhead de engine
  const rowSize = rawDataSize + overhead.row

  // Tamanho da tabela (dados) com overhead de página
  const tableDataSize = rows * rowSize * overhead.pageFactor

  // Tamanho dos índices
  const indexSize = indexes.reduce(
    (sum, idx) => sum + estimateIndexSize(idx, columns, rows, engine),
    0
  )

  // MongoDB armazena _id implícito se não houver; já cobrimos via colunas.
  // Adiciona pequeno overhead de nome de campo para BSON (~1 byte por campo por doc)
  let bsonFieldOverhead = 0
  if (engine === ENGINES.MONGODB) {
    bsonFieldOverhead = rows * columns.length * 1.5
  }

  const totalSize = tableDataSize + indexSize + bsonFieldOverhead

  return {
    rowSize: Math.round(rowSize),
    rawDataSize: Math.round(rawDataSize),
    tableDataSize: Math.round(tableDataSize),
    indexSize: Math.round(indexSize),
    bsonFieldOverhead: Math.round(bsonFieldOverhead),
    totalSize: Math.round(totalSize),
    rows,
  }
}

export function estimateDatabase({ engine, growth, tables }) {
  const cleanTables = Array.isArray(tables) ? tables : []
  const growthRate = Math.max(0, Number(growth) || 0) / 100

  const tableEstimates = cleanTables.map((table) => ({
    name: table.name || (engine === ENGINES.MONGODB ? 'collection' : 'table'),
    ...estimateTable(table, engine),
  }))

  const totalNow = tableEstimates.reduce((sum, t) => sum + t.totalSize, 0)
  const totalData = tableEstimates.reduce((sum, t) => sum + t.tableDataSize, 0)
  const totalIndexes = tableEstimates.reduce((sum, t) => sum + t.indexSize, 0)
  const totalRows = tableEstimates.reduce((sum, t) => sum + t.rows, 0)

  // Projeções de crescimento (1, 3 e 5 anos)
  const projected1y = totalNow * (1 + growthRate) ** 1
  const projected3y = totalNow * (1 + growthRate) ** 3
  const projected5y = totalNow * (1 + growthRate) ** 5

  return {
    engine,
    growthRate,
    totalNow: Math.round(totalNow),
    totalData: Math.round(totalData),
    totalIndexes: Math.round(totalIndexes),
    totalRows: Math.round(totalRows),
    projected1y: Math.round(projected1y),
    projected3y: Math.round(projected3y),
    projected5y: Math.round(projected5y),
    tables: tableEstimates,
  }
}

export function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  const value = bytes / k ** i
  return `${value.toFixed(decimals)} ${sizes[i]}`
}

export function createEmptyColumn() {
  return {
    name: '',
    type: 'VARCHAR',
    size: 64,
    nullable: false,
  }
}

export function createEmptyIndex() {
  return {
    name: '',
    type: 'BTREE',
    columns: [],
  }
}

export function createEmptyTable() {
  return {
    name: '',
    rows: 10000,
    columns: [
      { name: 'id', type: 'BIGINT', size: 0, nullable: false },
      { name: 'created_at', type: 'DATETIME', size: 0, nullable: false },
    ],
    indexes: [{ name: 'PRIMARY', type: 'BTREE', columns: ['id'] }],
  }
}
