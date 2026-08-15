// Motor JSON → Zod Schema — 100% client-side.
// Recebe um valor JSON já parseado e devolve uma string de código Zod
// equivalente. Nenhum dado sai do navegador.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const UUID_RE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?)?$/
const URL_RE = /^https?:\/\/[^\s/$.?#].[^\s]*$/i
const IDENT_RE = /^[A-Za-z_$][A-Za-z0-9_$]*$/
const RESERVED = new Set([
  'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger', 'default',
  'delete', 'do', 'else', 'enum', 'export', 'extends', 'false', 'finally', 'for',
  'function', 'if', 'import', 'in', 'instanceof', 'new', 'null', 'return',
  'super', 'switch', 'this', 'throw', 'true', 'try', 'typeof', 'var', 'void',
  'while', 'with', 'yield', 'let', 'static', 'implements', 'interface',
  'package', 'private', 'protected', 'public',
])

export function isIdent(k) {
  return IDENT_RE.test(k) && !RESERVED.has(k)
}

export function camelize(key) {
  return key
    .replace(/[\s_-]+([a-zA-Z0-9])/g, (_, c) => c.toUpperCase())
    .replace(/^[0-9_]+/, '')
}

export function pascalName(key) {
  const input = key || ''
  if (!input) return 'Root'
  let clean = input.replace(/[\s_-]+([a-zA-Z0-9])/g, (_, c) => c.toUpperCase())
  let ident = clean.replace(/[^A-Za-z0-9_$]/g, '')
  ident = ident.charAt(0).toUpperCase() + ident.slice(1)
  if (!ident) return 'Root'
  if (/^[0-9]/.test(ident)) ident = 'T' + ident
  return ident
}

function singular(base) {
  const lower = base.toLowerCase()
  if (base.length > 3 && lower.endsWith('ies')) return base.slice(0, -3) + 'y'
  if (base.length > 2 && lower.endsWith('es')) return base.slice(0, -2)
  if (base.length > 2 && lower.endsWith('s')) return base.slice(0, -1)
  return base
}

function formatKey(key, camelKeys) {
  const k = camelKeys ? camelize(key) : key
  return isIdent(k) ? k : JSON.stringify(k)
}

function detectStringSchema(str) {
  if (UUID_RE.test(str)) return "z.string().uuid()"
  if (EMAIL_RE.test(str)) return "z.string().email()"
  if (URL_RE.test(str)) return "z.string().url()"
  if (ISO_DATE_RE.test(str)) return "z.string().datetime()"
  return "z.string()"
}

function shapeSig(node) {
  if (node === null || node === undefined) return 'null'
  if (typeof node === 'boolean') return 'bool'
  if (typeof node === 'number') return Number.isInteger(node) ? 'int' : 'num'
  if (typeof node === 'string') return 'str'
  if (Array.isArray(node)) {
    if (node.length === 0) return '[]'
    const sigs = node.map(shapeSig)
    return '[' + Array.from(new Set(sigs)).sort().join(',') + ']'
  }
  const keys = Object.keys(node).sort()
  return '{' + keys.map((k) => k + ':' + shapeSig(node[k])).join(',') + '}'
}

function sortedUnion(types) {
  // Mantém ordem estável mas remove duplicatas vizinhas após sort.
  const unique = Array.from(new Set(types))
  if (unique.length === 1) return unique[0]
  if (unique.length === 2 && unique.includes('z.string()') && unique.includes('z.null()')) {
    // z.string().nullable() é mais idiomático que z.union([z.string(), z.null()])
    const other = unique.find((t) => t !== 'z.null()')
    return `${other}.nullable()`
  }
  return `z.union([${unique.join(', ')}])`
}

export function buildZodSchema(value, opts = {}) {
  const {
    rootName = 'Root',
    camelKeys = false,
    strictObjects = false,
    nullAsOptional = false,
    detectFormats = true,
    exportPrefix = true,
  } = opts

  const used = new Set()
  const memo = new Map()
  const defs = [] // { name, body }

  const rootBase = pascalName(rootName)
  const isRootObject = value !== null && typeof value === 'object' && !Array.isArray(value)
  if (!isRootObject) used.add(rootBase)

  function uniqueName(base) {
    let name = base
    let i = 2
    while (used.has(name)) {
      name = base + i
      i += 1
    }
    used.add(name)
    return name
  }

  function schemaOf(node, baseName) {
    if (node === null || node === undefined) {
      return nullAsOptional ? 'z.optional(z.any())' : 'z.null()'
    }

    if (typeof node === 'boolean') return 'z.boolean()'

    if (typeof node === 'number') {
      return Number.isInteger(node) ? 'z.number().int()' : 'z.number()'
    }

    if (typeof node === 'string') {
      return detectFormats ? detectStringSchema(node) : 'z.string()'
    }

    if (Array.isArray(node)) {
      if (node.length === 0) return 'z.array(z.unknown())'
      const elementBase = singular(pascalName(baseName) || 'Root') + 'Item'
      const childSchemas = node.map((el) => schemaOf(el, elementBase))
      const child = sortedUnion(childSchemas)
      return `z.array(${child})`
    }

    if (typeof node === 'object') {
      const sig = shapeSig(node)
      if (memo.has(sig)) return memo.get(sig)

      const name = uniqueName(pascalName(baseName) || 'Root')
      memo.set(sig, name)

      const entries = Object.entries(node).map(([k, v]) => {
        const key = formatKey(k, camelKeys)
        const childName = pascalName(k)
        const childSchema = schemaOf(v, childName)
        return `  ${key}: ${childSchema},`
      })

      const body = entries.length
        ? `z.object({\n${entries.join('\n')}\n})${strictObjects ? '.strict()' : ''}`
        : `z.object({})${strictObjects ? '.strict()' : ''}`

      defs.push({ name, body })
      return name
    }

    return 'z.any()'
  }

  const rootSchema = schemaOf(value, rootBase)

  // Se a raiz for um objeto, o nome da interface raiz é o schema em si;
  // caso contrário criamos um alias `const Root = ...`.
  const exports = []
  const others = defs.filter((d) => d.name !== rootBase)

  others.forEach((d) => {
    exports.push(`export const ${d.name} = ${d.body};`)
  })

  if (isRootObject) {
    const rootDef = defs.find((d) => d.name === rootBase)
    const prefix = exportPrefix ? 'export ' : ''
    exports.push(`${prefix}const ${rootBase} = ${rootDef.body};`)
    exports.push(`${prefix}type ${rootBase} = z.infer<typeof ${rootBase}>;`)
  } else {
    const prefix = exportPrefix ? 'export ' : ''
    exports.push(`${prefix}const ${rootBase} = ${rootSchema};`)
    exports.push(`${prefix}type ${rootBase} = z.infer<typeof ${rootBase}>;`)
  }

  return exports.join('\n\n') + '\n'
}
