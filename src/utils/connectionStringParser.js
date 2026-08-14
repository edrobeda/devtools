/**
 * Connection String Parser / Builder
 *
 * Analisa e monta strings de conexão de bancos de dados 100% no navegador.
 * Suporta os formatos URI mais comuns (PostgreSQL, MySQL, MongoDB, Redis,
 * SQLite, SQL Server, Oracle, JDBC) e strings chave=valor estilo ODBC/JDBC.
 *
 * Nenhum dado sai do navegador.
 */

export const SCHEMES = [
  'postgresql',
  'mysql',
  'mariadb',
  'mongodb',
  'mongodb+srv',
  'redis',
  'rediss',
  'sqlite',
  'mssql',
  'oracle',
  'jdbc',
  'odbc',
]

export const DEFAULT_PORTS = {
  postgresql: 5432,
  mysql: 3306,
  mariadb: 3306,
  mongodb: 27017,
  mongodbsrv: null, // SRV usa a porta descoberta via DNS
  redis: 6379,
  rediss: 6379,
  mssql: 1433,
  oracle: 1521,
}

export const SAMPLES = {
  postgresql:
    'postgresql://admin:p%40ss@db.example.com:5432/app?sslmode=require&connect_timeout=10',
  mysql: 'mysql://user:secret@localhost:3306/shop?charset=utf8mb4',
  mariadb: 'mariadb://user:secret@localhost:3306/shop?charset=utf8mb4',
  mongodb: 'mongodb://root:example@mongo1:27017,mongo2:27017/mydb?replicaSet=rs0',
  'mongodb+srv': 'mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/mydb?retryWrites=true',
  redis: 'redis://default:pass@cache.example.com:6379/0',
  rediss: 'rediss://default:pass@cache.example.com:6380/0',
  sqlite: 'sqlite:///home/user/app/data.db',
  mssql: 'mssql://sa:P@ssw0rd@sqlserver:1433/Northwind?encrypt=true',
  oracle: 'oracle://user:pass@oracle.example.com:1521/ORCLPDB1',
  jdbc: 'jdbc:postgresql://db.example.com:5432/app?sslmode=require',
  odbc:
    'Driver={ODBC Driver 17 for SQL Server};Server=tcp:sqlserver.database.windows.net,1433;Database=mydb;Uid=user;Pwd=secret;Encrypt=yes;TrustServerCertificate=no;',
}

const HOST_KEYS = ['host', 'server', 'servername', 'datasource', 'data source', 'addr', 'address']
const PORT_KEYS = ['port']
const USER_KEYS = ['user', 'username', 'uid', 'user id', 'userid']
const PASS_KEYS = ['password', 'pwd', 'pass', 'passwd']
const DB_KEYS = ['database', 'dbname', 'db', 'initial catalog']

function normalizeKey(key) {
  return String(key).toLowerCase().trim()
}

function findValue(pairs, keys) {
  for (const key of keys) {
    const value = pairs.get(normalizeKey(key))
    if (value !== undefined && value !== '') return value
  }
  return ''
}

function parseQueryParams(search) {
  const params = {}
  if (!search) return params
  const urlParams = new URLSearchParams(search)
  urlParams.forEach((value, key) => {
    params[key] = value
  })
  return params
}

function buildQueryParams(params) {
  if (!params || Object.keys(params).length === 0) return ''
  const urlParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (key && value !== undefined && value !== '') urlParams.append(key, value)
  })
  const query = urlParams.toString()
  return query ? `?${query}` : ''
}

function safeDecode(value) {
  if (value == null) return ''
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

/**
 * Tenta detectar o scheme de uma connection string.
 */
export function detectScheme(str) {
  if (!str) return ''
  const trimmed = String(str).trim()

  // JDBC prefixado
  if (trimmed.toLowerCase().startsWith('jdbc:')) {
    const rest = trimmed.slice(5)
    const match = rest.match(/^([a-zA-Z0-9+]+):\/\//)
    if (match) return `jdbc:${match[1].toLowerCase()}`
    return 'jdbc'
  }

  // URI scheme
  const uriMatch = trimmed.match(/^([a-zA-Z][a-zA-Z0-9+.-]*):\/\//)
  if (uriMatch) {
    const scheme = uriMatch[1].toLowerCase()
    if (SCHEMES.includes(scheme) || SCHEMES.includes(scheme.replace(/srv$/, '+srv'))) {
      return scheme
    }
    return scheme
  }

  // SQLite sem scheme
  if (/^sqlite[:_]/i.test(trimmed) || /\.db(\?.*)?$/i.test(trimmed)) return 'sqlite'

  // ODBC key=value
  if (/Driver\s*=|Server\s*=|Database\s*=|Uid\s*=|Pwd\s*=/i.test(trimmed)) return 'odbc'

  // Oracle TNS estilo key=value
  if (/\bHOST\s*=|SERVICE_NAME\s*=|SID\s*=/i.test(trimmed)) return 'oracle'

  return ''
}

/**
 * Analisa uma connection string e retorna os componentes normalizados.
 */
export function parseConnectionString(str) {
  const result = {
    scheme: '',
    driver: '',
    user: '',
    password: '',
    host: '',
    port: '',
    portNumber: null,
    database: '',
    path: '',
    params: {},
    raw: str || '',
    hosts: [], // MongoDB pode ter múltiplos hosts
    errors: [],
    warnings: [],
  }

  if (!str || !String(str).trim()) return result

  const trimmed = String(str).trim()
  result.scheme = detectScheme(trimmed)

  // Caso especial: key=value (ODBC / Oracle TNS / ConnectionString do .NET)
  if (result.scheme === 'odbc' || /;/.test(trimmed) && !/:\/\//.test(trimmed)) {
    return parseKeyValueString(trimmed, result)
  }

  // SQLite especial
  if (result.scheme === 'sqlite') {
    return parseSQLiteString(trimmed, result)
  }

  // MongoDB com múltiplos hosts: parse manual para não depender do URL()
  if (result.scheme === 'mongodb' && /,/.test(trimmed)) {
    return parseMongoMultiHost(trimmed, result)
  }

  // JDBC: remove o prefixo jdbc: para usar URL()
  let urlString = trimmed
  if (trimmed.toLowerCase().startsWith('jdbc:')) {
    urlString = trimmed.slice(5)
    result.scheme = `jdbc:${detectScheme(urlString) || 'unknown'}`
  }

  try {
    const url = new URL(urlString)
    result.scheme = result.scheme || url.protocol.replace(/:$/, '')
    result.user = safeDecode(url.username)
    result.password = safeDecode(url.password)
    result.host = url.hostname
    result.port = url.port || ''
    result.portNumber = url.port ? Number(url.port) : null
    result.path = url.pathname
    result.params = parseQueryParams(url.search)

    // Database: remove a barra inicial
    result.database = url.pathname.replace(/^\//, '')

    // Redis: o path pode ser o índice do banco (/0, /1)
    if ((result.scheme === 'redis' || result.scheme === 'rediss') && /^\/\d+$/.test(url.pathname)) {
      result.database = url.pathname.replace(/^\//, '')
    }

    // Driver para JDBC
    if (result.scheme.startsWith('jdbc:')) {
      const inner = result.scheme.replace('jdbc:', '')
      result.driver = inner === 'unknown' ? '' : inner
    }
  } catch (err) {
    result.errors.push(`Não foi possível analisar como URI: ${err.message}`)
    result.warnings.push('A string não parece ser uma URI válida; tente o modo chave=valor.')
  }

  return result
}

/**
 * Faz parse manual de connection strings MongoDB com múltiplos hosts.
 * Formato: mongodb://[user[:pass]@]host1:port1,host2:port2[/db][?options]
 */
function parseMongoMultiHost(str, result) {
  const match = str.match(
    /^(mongodb:\/\/)(?:([^@:]+)(?::([^@]*))?@)?([^\/\?]+)(\/[^\?]*)?(\?.*)?$/i
  )
  if (!match) {
    result.errors.push('Formato MongoDB com múltiplos hosts não reconhecido')
    return result
  }

  const [, , user, password, hostsPart, path, query] = match
  result.user = safeDecode(user || '')
  result.password = safeDecode(password || '')

  result.hosts = hostsPart.split(',').map((h) => {
    const [host, port] = h.split(':')
    return { host: host.trim(), port: port ? port.trim() : '' }
  })
  result.host = result.hosts.map((h) => h.host).join(', ')
  result.port = result.hosts.map((h) => h.port || '').join(', ')
  result.portNumber = null

  result.path = path || ''
  result.database = path ? path.replace(/^\//, '') : ''
  result.params = parseQueryParams(query ? query.slice(1) : '')

  return result
}

function parseSQLiteString(str, result) {
  const match = str.match(/^sqlite:(?:\/\/)?(.+)$/i)
  if (match) {
    result.path = safeDecode(match[1])
    result.database = result.path
  } else {
    result.path = str
    result.database = str
  }
  return result
}

function parseKeyValueString(str, result) {
  const pairs = new Map()
  // Separa por ; ou por & (algumas libs usam &)
  const separator = /;/.test(str) ? ';' : '&'
  str.split(separator).forEach((part) => {
    const idx = part.indexOf('=')
    if (idx === -1) return
    const key = part.slice(0, idx).trim()
    let value = part.slice(idx + 1).trim()
    // Remove chaves do driver: {ODBC Driver 17 for SQL Server}
    if (value.startsWith('{') && value.endsWith('}')) {
      value = value.slice(1, -1)
    }
    pairs.set(normalizeKey(key), value)
  })

  result.driver = findValue(pairs, ['driver'])
  result.user = safeDecode(findValue(pairs, USER_KEYS))
  result.password = safeDecode(findValue(pairs, PASS_KEYS))
  result.host = findValue(pairs, HOST_KEYS)
  result.port = findValue(pairs, PORT_KEYS)

  // SQL Server Azure costuma vir como Server=tcp:host.database.windows.net,1433
  if (!result.port && /,\d+$/.test(result.host)) {
    const idx = result.host.lastIndexOf(',')
    result.port = result.host.slice(idx + 1)
    result.host = result.host.slice(0, idx)
  }

  result.portNumber = result.port ? Number(result.port) : null
  result.database = findValue(pairs, DB_KEYS)
  result.params = Object.fromEntries(pairs)

  // Tenta inferir scheme pelo driver
  if (result.driver) {
    const driverLower = result.driver.toLowerCase()
    if (driverLower.includes('postgres')) result.scheme = 'odbc:postgresql'
    else if (driverLower.includes('mysql')) result.scheme = 'odbc:mysql'
    else if (driverLower.includes('sqlite')) result.scheme = 'odbc:sqlite'
    else if (driverLower.includes('sql server') || driverLower.includes('mssql')) result.scheme = 'odbc:mssql'
    else if (driverLower.includes('oracle')) result.scheme = 'odbc:oracle'
    else result.scheme = 'odbc'
  }

  return result
}

/**
 * Monta uma connection string a partir de campos editáveis.
 */
export function buildConnectionString(fields) {
  const scheme = normalizeKey(fields.scheme || '')
  const user = fields.user || ''
  const password = fields.password || ''
  const host = fields.host || ''
  const port = fields.port || ''
  const database = fields.database || ''
  const path = fields.path || ''
  const params = fields.params || {}
  const driver = fields.driver || ''

  if (scheme === 'odbc' || scheme.startsWith('odbc:')) {
    let server = host
    let serverPort = port
    // SQL Server Azure aceita Server=tcp:host,1433
    if (!serverPort && /,\d+$/.test(server)) {
      const idx = server.lastIndexOf(',')
      serverPort = server.slice(idx + 1)
      server = server.slice(0, idx)
    }

    const parts = []
    if (driver) parts.push(`Driver={${driver}}`)
    if (server) parts.push(`Server=${server}`)
    if (serverPort) parts.push(`Port=${serverPort}`)
    if (database) parts.push(`Database=${database}`)
    if (user) parts.push(`Uid=${user}`)
    if (password) parts.push(`Pwd=${password}`)
    Object.entries(params).forEach(([key, value]) => {
      if (!['driver', 'server', 'port', 'database', 'uid', 'pwd'].includes(normalizeKey(key))) {
        parts.push(`${key}=${value}`)
      }
    })
    return parts.join(';')
  }

  if (scheme === 'sqlite') {
    return `sqlite://${path || database || ':memory:'}`
  }

  // URI schemes
  let authority = ''
  if (user || password) {
    authority += encodeURIComponent(user)
    if (password) authority += `:${encodeURIComponent(password)}`
    authority += '@'
  }
  authority += host
  if (port) authority += `:${port}`

  let pathname = database || path || ''
  if (pathname && !pathname.startsWith('/')) pathname = `/${pathname}`

  let prefix = scheme
  if (prefix.startsWith('jdbc:')) prefix = prefix.replace('jdbc:', '')
  if (prefix && !prefix.includes(':')) prefix += ':'
  if (!prefix.endsWith('://')) prefix += '//'

  const query = buildQueryParams(params)
  return `${prefix}${authority}${pathname}${query}`
}

/**
 * Retorna uma descrição amigável do scheme.
 */
export function schemeLabel(scheme) {
  const map = {
    postgresql: 'PostgreSQL',
    mysql: 'MySQL',
    mariadb: 'MariaDB',
    mongodb: 'MongoDB',
    'mongodb+srv': 'MongoDB Atlas (SRV)',
    redis: 'Redis',
    rediss: 'Redis (TLS)',
    sqlite: 'SQLite',
    mssql: 'SQL Server',
    oracle: 'Oracle',
    jdbc: 'JDBC',
    odbc: 'ODBC',
  }
  return map[scheme] || scheme || 'Desconhecido'
}

/**
 * Indica se um campo é sensível e deve ser mascarado na UI.
 */
export function isSensitiveField(field) {
  return ['password', 'pwd', 'pass', 'secret', 'token', 'key'].includes(normalizeKey(field))
}
