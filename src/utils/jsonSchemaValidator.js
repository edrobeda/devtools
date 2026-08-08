// Validador de JSON Schema (subconjunto draft-07) 100% client-side.
// Dado um schema (objeto já parseado) e uma instância, devolve
// { valid } ou { valid:false, errors: [{path, code, message}] },
// onde message já vem em neutro (os parâmetros em params) e a página
// traduz por idioma usando `toMessage(code, params, t)`.
//
// Subconjunto suportado:
//   - type (com união ["string","null"]), enum, const
//   - properties / required / additionalProperties / patternProperties /
//     minProperties / maxProperties
//   - items (objeto ou array), prefixItems/additionalItems, minItems,
//     maxItems, uniqueItems, contains
//   - minLength / maxLength / pattern / format (um subconjunto leve)
//   - minimum / maximum / exclusiveMinimum / exclusiveMaximum (forma
//     numérica do draft-07) / multipleOf
//   - anyOf / oneOf / allOf / not
//   - $ref para referências locais ('#/definitions/...', '#/$defs/...' e
//     alias de definições), com limite de profundidade pra não travar em
//     $ref circular infinito
// Não suporta: $recursiveRef, $dynamicRef e transformações — keywords
// desconhecidas são ignoradas (spec: devem ser).

const MAX_DEPTH = 60

function typeOf(v) {
  if (v === null) return 'null'
  if (Array.isArray(v)) return 'array'
  return typeof v
}

function hasOwn(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key)
}

function isPlainObject(v) {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function matchesType(value, types) {
  return types.some((t) => {
    switch (t) {
      case 'object': return isPlainObject(value)
      case 'array': return Array.isArray(value)
      case 'integer': return typeof value === 'number' && Number.isInteger(value) && !Number.isNaN(value)
      case 'number': return typeof value === 'number' && !Number.isNaN(value)
      case 'string': return typeof value === 'string'
      case 'boolean': return typeof value === 'boolean'
      case 'null': return value === null
      default: return true // tipo desconhecido: aceita
    }
  })
}

// Comparação profunda simples (ordem de chaves ignorada) pra enum/const/uniqueItems
function deepEqual(a, b) {
  if (a === b) return true
  if (typeof a !== typeof b) return false
  if (typeof a !== 'object' || a === null || b === null) return false
  const aArr = Array.isArray(a)
  const bArr = Array.isArray(b)
  if (aArr !== bArr) return false
  if (aArr) {
    if (a.length !== b.length) return false
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false
    }
    return true
  }
  const aKeys = Object.keys(a).sort()
  const bKeys = Object.keys(b).sort()
  if (aKeys.length !== bKeys.length) return false
  for (let i = 0; i < aKeys.length; i++) {
    if (aKeys[i] !== bKeys[i]) return false
    if (!deepEqual(a[aKeys[i]], b[aKeys[i]])) return false
  }
  return true
}

function resolveRef(root, ref) {
  if (typeof ref !== 'string' || !ref.startsWith('#/')) return null
  const parts = ref.slice(2).split('/').map((p) => p.replace(/~1/g, '/').replace(/~0/g, '~'))
  let node = root
  for (const part of parts) {
    if (node === null || typeof node !== 'object') return null
    if (!hasOwn(node, part)) return null
    node = node[part]
  }
  return node
}

// Subset das "formats" mais comuns do draft-07
const FORMATS = {
  email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
  uri: (v) => /^[a-z][a-z0-9+.-]*:\/\/\S+$/i.test(v),
  url: (v) => /^https?:\/\/\S+$/i.test(v),
  date: (v) => /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v)),
  'date-time': (v) => !Number.isNaN(Date.parse(v)),
  time: (v) => /^\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?$/.test(v),
  ipv4: (v) => /^(\d{1,3}\.){3}\d{1,3}$/.test(v) && v.split('.').every((o) => Number(o) <= 255),
  hostname: (v) => /^([a-z0-9]([a-z0-9-]*[a-z0-9])?)(\.([a-z0-9]([a-z0-9-]*[a-z0-9])?))*$/i.test(v) && v.length <= 253,
  uuid: (v) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v),
  'json-pointer': () => true,
  'relative-json-pointer': () => true,
  regex: (v) => { try { new RegExp(v); return true } catch { return false } },
}

function compilePattern(p) {
  try {
    return new RegExp(p)
  } catch {
    return null
  }
}

export function validateSchema(root, instance) {
  const errors = []
  const walk = (schema, node, path, depth) => {
    if (schema === true || schema === undefined) return
    if (schema === false) {
      errors.push({ path, code: 'false_schema', params: {} })
      return
    }
    if (!isPlainObject(schema)) return
    if (depth > MAX_DEPTH) return

    if (hasOwn(schema, '$ref')) {
      const target = resolveRef(root, schema.$ref)
      if (target === null) {
        errors.push({ path, code: 'bad_ref', params: { ref: schema.$ref } })
        return
      }
      walk(target, node, path, depth + 1)
      return
    }

    if (hasOwn(schema, 'type')) {
      const types = Array.isArray(schema.type) ? schema.type : [schema.type]
      if (!matchesType(node, types)) {
        errors.push({ path, code: 'type', params: { expected: types.map(String).join(' | '), got: typeOf(node) } })
      }
    }
    if (hasOwn(schema, 'enum') && Array.isArray(schema.enum) && !schema.enum.some((e) => deepEqual(e, node))) {
      errors.push({ path, code: 'enum', params: { count: schema.enum.length } })
    }
    if (hasOwn(schema, 'const') && !deepEqual(schema.const, node)) {
      errors.push({ path, code: 'const', params: {} })
    }

    if (typeof node === 'string') {
      if (hasOwn(schema, 'minLength') && node.length < schema.minLength) errors.push({ path, code: 'min_length', params: { n: schema.minLength } })
      if (hasOwn(schema, 'maxLength') && node.length > schema.maxLength) errors.push({ path, code: 'max_length', params: { n: schema.maxLength } })
      if (hasOwn(schema, 'pattern')) {
        const re = compilePattern(schema.pattern)
        if (re && !re.test(node)) errors.push({ path, code: 'pattern', params: { pattern: schema.pattern } })
      }
      if (hasOwn(schema, 'format') && hasOwn(FORMATS, schema.format) && !FORMATS[schema.format](node)) {
        errors.push({ path, code: 'format', params: { format: schema.format } })
      }
    }

    if (typeof node === 'number' && !Number.isNaN(node)) {
      if (hasOwn(schema, 'minimum') && node < schema.minimum) errors.push({ path, code: 'minimum', params: { n: schema.minimum } })
      if (hasOwn(schema, 'maximum') && node > schema.maximum) errors.push({ path, code: 'maximum', params: { n: schema.maximum } })
      if (hasOwn(schema, 'exclusiveMinimum') && typeof schema.exclusiveMinimum === 'number' && node <= schema.exclusiveMinimum) {
        errors.push({ path, code: 'exclusive_minimum', params: { n: schema.exclusiveMinimum } })
      }
      if (hasOwn(schema, 'exclusiveMaximum') && typeof schema.exclusiveMaximum === 'number' && node >= schema.exclusiveMaximum) {
        errors.push({ path, code: 'exclusive_maximum', params: { n: schema.exclusiveMaximum } })
      }
      if (hasOwn(schema, 'multipleOf') && schema.multipleOf > 0) {
        const ratio = node / schema.multipleOf
        if (Math.abs(ratio - Math.round(ratio)) > 1e-9) {
          errors.push({ path, code: 'multiple_of', params: { n: schema.multipleOf } })
        }
      }
    }

    if (Array.isArray(node)) {
      if (hasOwn(schema, 'minItems') && node.length < schema.minItems) errors.push({ path, code: 'min_items', params: { n: schema.minItems } })
      if (hasOwn(schema, 'maxItems') && node.length > schema.maxItems) errors.push({ path, code: 'max_items', params: { n: schema.maxItems } })
      if (schema.uniqueItems === true) {
        for (let i = 0; i < node.length; i++) {
          for (let j = i + 1; j < node.length; j++) {
            if (deepEqual(node[i], node[j])) {
              errors.push({ path: `${path}[${i}]`, code: 'duplicate', params: { other: j } })
              break
            }
          }
        }
      }
      if (Array.isArray(schema.items)) {
        for (let i = 0; i < node.length; i++) {
          if (i < schema.items.length) walk(schema.items[i], node[i], `${path}[${i}]`, depth)
          else if (hasOwn(schema, 'additionalItems')) {
            if (schema.additionalItems === false) errors.push({ path: `${path}[${i}]`, code: 'additional_items', params: {} })
            else if (isPlainObject(schema.additionalItems)) walk(schema.additionalItems, node[i], `${path}[${i}]`, depth)
          }
        }
      } else if (isPlainObject(schema.items)) {
        for (let i = 0; i < node.length; i++) walk(schema.items, node[i], `${path}[${i}]`, depth)
      }
      if (isPlainObject(schema.contains)) {
        let any = false
        for (let i = 0; i < node.length; i++) {
          const before = errors.length
          walk(schema.contains, node[i], `${path}[${i}]`, depth)
          if (errors.length === before) { any = true; break }
          errors.length = before
        }
        if (!any) errors.push({ path, code: 'contains', params: {} })
      }
    }

    if (isPlainObject(node)) {
      const keys = Object.keys(node)
      if (hasOwn(schema, 'minProperties') && keys.length < schema.minProperties) errors.push({ path, code: 'min_properties', params: { n: schema.minProperties } })
      if (hasOwn(schema, 'maxProperties') && keys.length > schema.maxProperties) errors.push({ path, code: 'max_properties', params: { n: schema.maxProperties } })
      const req = Array.isArray(schema.required) ? schema.required : []
      for (const k of req) {
        if (!hasOwn(node, k)) errors.push({ path, code: 'required', params: { key: k } })
      }
      const propSchemas = isPlainObject(schema.properties) ? schema.properties : {}
      const validated = new Set()
      for (const k of Object.keys(propSchemas)) {
        if (hasOwn(node, k)) {
          validated.add(k)
          walk(propSchemas[k], node[k], `${path}${path ? '.' : ''}${k}`, depth)
        }
      }
      if (isPlainObject(schema.patternProperties)) {
        for (const [reStr, sub] of Object.entries(schema.patternProperties)) {
          const re = compilePattern(reStr)
          if (!re) continue
          for (const k of keys) {
            if (re.test(k)) {
              validated.add(k)
              walk(sub, node[k], `${path}${path ? '.' : ''}${k}`, depth)
            }
          }
        }
      }
      if (hasOwn(schema, 'additionalProperties')) {
        for (const k of keys) {
          if (validated.has(k)) continue
          if (schema.additionalProperties === false) {
            errors.push({ path, code: 'additional_properties', params: { key: k } })
          } else if (isPlainObject(schema.additionalProperties)) {
            walk(schema.additionalProperties, node[k], `${path}${path ? '.' : ''}${k}`, depth)
          }
        }
      }
    }

    if (Array.isArray(schema.anyOf)) {
      let passes = false
      for (const sub of schema.anyOf) {
        const before = errors.length
        walk(sub, node, path, depth)
        if (errors.length === before) { passes = true; break }
        errors.length = before
      }
      if (!passes) errors.push({ path, code: 'anyOf', params: { n: schema.anyOf.length } })
    }
    if (Array.isArray(schema.oneOf)) {
      let passes = 0
      for (const sub of schema.oneOf) {
        const before = errors.length
        walk(sub, node, path, depth)
        const failed = errors.length > before
        errors.length = before
        if (!failed) passes++
      }
      if (passes !== 1) errors.push({ path, code: 'oneOf', params: { count: schema.oneOf.length, passes } })
    }
    if (Array.isArray(schema.allOf)) {
      for (const sub of schema.allOf) walk(sub, node, path, depth)
    }
    if (hasOwn(schema, 'not') && (schema.not === true || isPlainObject(schema.not))) {
      const before = errors.length
      walk(schema.not, node, path, depth)
      if (errors.length === before) errors.push({ path, code: 'not', params: {} })
      else errors.length = before
    }
  }

  walk(root, instance, '$', 0)
  return { valid: errors.length === 0, errors }
}

export default validateSchema