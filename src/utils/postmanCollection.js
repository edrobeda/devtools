// Utilitários para leitura e análise de coleções do Postman (schema v2.x).
// Tudo roda no navegador: nenhuma requisição é feita, nenhum dado sai da máquina.

export const COLLECTION_SCHEMA_RE = /schema\.getpostman\.com\/json\/collection\/(v[\d.]+)\/collection\.json/
export const VARIABLE_RE = /\{\{\s*([^{}]+?)\s*\}\}/g

// Variáveis dinâmicas que o próprio Postman resolve em tempo de execução
// ({{$timestamp}}, {{$guid}}, ...) — não precisam estar declaradas na coleção.
const DYNAMIC_PREFIX = '$'

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

export function parseCollection(text) {
  if (!text || !text.trim()) return { ok: false, error: 'Cole o JSON da coleção.' }
  let data
  try {
    data = JSON.parse(text)
  } catch (err) {
    return { ok: false, error: `JSON inválido: ${err.message}` }
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { ok: false, error: 'A coleção precisa ser um objeto JSON.' }
  }
  const info = data.info || {}
  if (!data.item && !Array.isArray(data.item)) {
    return { ok: false, error: 'A coleção não tem a propriedade "item".' }
  }
  return {
    ok: true,
    data,
    meta: {
      name: info.name || '',
      schemaId: info.schema || '',
      schemaVersion: (COLLECTION_SCHEMA_RE.exec(info.schema || '') || [])[1] || '',
      description: typeof info.description === 'string' ? info.description : info.description?.content || '',
    },
  }
}

export function collectVariables(value) {
  const found = []
  const walk = (input) => {
    if (typeof input === 'string') {
      VARIABLE_RE.lastIndex = 0
      let match = VARIABLE_RE.exec(input)
      while (match) {
        found.push(match[1])
        match = VARIABLE_RE.exec(input)
      }
    } else if (Array.isArray(input)) {
      input.forEach(walk)
    } else if (input && typeof input === 'object') {
      Object.values(input).forEach(walk)
    }
  }
  walk(value)
  return found
}

// ---------------------------------------------------------------------------
// Árvore (pastas + requisições), já com auth e eventos herdados resolvidos
// ---------------------------------------------------------------------------

function normalizeAuth(auth) {
  if (!auth || typeof auth !== 'object' || !auth.type) return null
  if (auth.type === 'noauth') return { type: 'noauth', params: [] }
  const params = Array.isArray(auth[auth.type]) ? auth[auth.type] : []
  return {
    type: auth.type,
    params: params
      .filter((p) => p && (p.key || p.keyHeader))
      .map((p) => ({ key: p.key || p.keyHeader, value: p.value || '', type: p.type || 'string', disabled: !p.disabled })),
  }
}

function countScripts(events) {
  let pre = 0
  let test = 0
  ;(events || []).forEach((event) => {
    if (event.disabled) return
    if (event.listen === 'prerequest') pre += 1
    else if (event.listen === 'test') test += 1
  })
  return { pre, test }
}

function eventKey(event) {
  const exec = Array.isArray(event?.script?.exec) ? event.script.exec.join('\n') : ''
  return `${event?.listen || ''}|${exec}`
}

/** Mesmos scripts herdados em várias requisições contam uma vez só. */
export function uniqueScripts(events) {
  const seen = new Map()
  ;(events || []).forEach((event) => {
    const key = eventKey(event)
    const entry = seen.get(key) || {
      listen: event.listen || 'test',
      lines: Array.isArray(event.script?.exec) ? event.script.exec : [],
      uses: 0,
    }
    entry.uses += 1
    seen.set(key, entry)
  })
  return Array.from(seen.values())
}

/** Scripts (prerequest/test) que valem para a requisição, já deduplicados. */
export function scriptLines(events) {
  return uniqueScripts(events).map((s) => ({ listen: s.listen, lines: s.lines, uses: s.uses }))
}

/**
 * Achata a coleção. Cada nó traz o caminho completo de pastas, a cadeia de auth
 * (coleção → pasta → requisição) e os scripts herdados das pastas + o próprio.
 * No schema v2.x o auth de pasta fica no item (`item.auth`) e o de requisição
 * dentro de `item.request.auth`.
 */
export function flattenCollection(collection) {
  const nodes = []
  let counter = 0

  const walk = (items, path, authChain, events, parentKey) => {
    if (!Array.isArray(items)) return
    items.forEach((item) => {
      if (!item || typeof item !== 'object') return
      const name = typeof item.name === 'string' && item.name ? item.name : '(sem nome)'
      const request = item.request && typeof item.request === 'object' ? item.request : null
      const isFolder = Array.isArray(item.item)
      const ownAuth = isFolder ? item.auth : request?.auth
      const chain = ownAuth ? authChain.concat([{ auth: ownAuth, source: name }]) : authChain
      const ownEvents = item.event ? events.concat(item.event) : events
      counter += 1
      const treeKey = parentKey ? `${parentKey}.${counter}` : String(counter)
      if (isFolder) {
        nodes.push({
          id: `n${counter}`,
          treeKey,
          kind: 'folder',
          name,
          path: path.join(' / '),
          authChain: chain,
          events: ownEvents,
          childCount: item.item.length,
        })
        walk(item.item, path.concat(name), chain, ownEvents, treeKey)
      } else {
        nodes.push({
          id: `n${counter}`,
          treeKey,
          kind: 'request',
          name,
          path: path.join(' / '),
          method: (request?.method || 'GET').toUpperCase(),
          request,
          authChain: chain,
          events: ownEvents,
          scripts: countScripts(uniqueScripts(ownEvents)),
        })
      }
    })
  }

  const collectionAuth = collection?.auth ? [{ auth: collection.auth, source: '(coleção)' }] : []
  walk(collection?.item, [], collectionAuth, Array.isArray(collection?.event) ? collection.event : [], '')
  return nodes
}

/** Árvore de pastas/requisições para o Tree do antd, montada sobre os nós achatados. */
export function buildTreeData(nodes) {
  const byKey = new Map()
  nodes.forEach((n) => {
    byKey.set(n.treeKey, { key: n.treeKey, name: n.name, kind: n.kind, method: n.method, children: [], data: n })
  })
  const roots = []
  nodes.forEach((n) => {
    const entry = byKey.get(n.treeKey)
    const parentKey = n.treeKey.split('.').slice(0, -1).join('.')
    const parent = parentKey ? byKey.get(parentKey) : null
    if (parent) parent.children.push(entry)
    else roots.push(entry)
  })
  return roots
}

export function effectiveAuth(node) {
  if (!node || !Array.isArray(node.authChain)) return { type: 'nenhuma', params: [], source: '' }
  for (let i = node.authChain.length - 1; i >= 0; i -= 1) {
    const normalized = normalizeAuth(node.authChain[i].auth)
    if (normalized) {
      return {
        type: normalized.type,
        params: normalized.params,
        source: normalized.type === 'noauth' ? 'none' : node.authChain[i].source,
      }
    }
  }
  return { type: 'nenhuma', params: [], source: '' }
}

// ---------------------------------------------------------------------------
// Requisição: URL, query, headers, body
// ---------------------------------------------------------------------------

export function rawUrl(request) {
  const url = request?.url
  if (!url) return ''
  if (typeof url === 'string') return url
  if (typeof url === 'object' && typeof url.raw === 'string' && url.raw) return url.raw
  const protocol = url.protocol ? `${url.protocol}://` : ''
  const host = Array.isArray(url.host) ? url.host.join('.') : url.host || ''
  const segments = Array.isArray(url.path) ? url.path : (url.path ? String(url.path).split('/') : [])
  const pathname = segments.filter((s) => s !== undefined && s !== null && s !== '').join('/')
  return `${protocol}${host}${pathname ? `/${pathname}` : ''}`
}

export function requestQuery(request) {
  const query = request?.url
  if (!query || typeof query !== 'object' || !Array.isArray(query.query)) return []
  return query.query
    .filter((q) => q && (q.key || q.disabled))
    .map((q) => ({
      key: q.key || '',
      value: q.value || '',
      disabled: !!q.disabled,
      description: typeof q.description === 'string' ? q.description : '',
    }))
}

export function requestHeaders(request) {
  const headers = Array.isArray(request?.header) ? request.header : []
  return headers
    .filter((h) => h && (h.key || h.disabled))
    .map((h) => ({
      key: h.key || '',
      value: h.value || '',
      disabled: !!h.disabled,
      description: typeof h.description === 'string' ? h.description : '',
    }))
}

export function describeBody(postData) {
  if (!postData || typeof postData !== 'object') {
    return { mode: 'none', label: 'sem corpo', text: '', params: [], valid: true, issues: [] }
  }
  const mode = postData.mode || 'raw'
  if (mode === 'raw') {
    const language = postData.options?.raw?.language || 'text'
    const text = typeof postData.raw === 'string' ? postData.raw : ''
    const valid = language === 'json' && text.trim() ? jsonIsValid(text) : true
    return { mode, language, label: `raw (${language})`, text, params: [], valid, issues: valid ? [] : ['json-invalido'] }
  }
  if (mode === 'urlencoded' || mode === 'formdata') {
    const params = (Array.isArray(postData[mode]) ? postData[mode] : [])
      .filter((p) => p && (p.key || p.src || p.disabled))
      .map((p) => ({
        key: p.key || p.keyHeader || '',
        value: p.type === 'file' ? p.src || '' : p.value || '',
        type: p.type || 'text',
        disabled: !!p.disabled,
      }))
    return { mode, label: mode === 'urlencoded' ? 'x-www-form-urlencoded' : 'form-data', text: '', params, valid: true, issues: [] }
  }
  if (mode === 'graphql') {
    const graphql = postData.graphql || {}
    const query = typeof graphql.query === 'string' ? graphql.query : ''
    const variables = typeof graphql.variables === 'string' ? graphql.variables : ''
    const text = variables ? `${query}\n\n# variables\n${variables}` : query
    const valid = variables ? jsonIsValid(variables) : true
    return { mode, label: 'graphql', text, params: [], valid, issues: valid ? [] : ['json-invalido'] }
  }
  if (mode === 'file') {
    const file = postData.file || {}
    return { mode, label: 'file', text: file.src || '', params: [], valid: true, issues: [] }
  }
  return { mode, label: mode, text: '', params: [], valid: true, issues: [] }
}

function jsonIsValid(text) {
  try {
    JSON.parse(text)
    return true
  } catch {
    return false
  }
}

export function mergeQuery(base, query) {
  const enabled = query.filter((q) => !q.disabled && q.key)
  if (!enabled.length) return base
  const hasQuery = base.includes('?')
  const pairs = enabled.map((q) => `${encodeURIComponent(q.key)}=${encodeURIComponent(q.value || '')}`)
  const separator = hasQuery ? '&' : '?'
  return `${base}${separator}${pairs.join('&')}`
}

/** URL final da requisição (host/path + query habilitada), sem resolver variáveis. */
export function buildUrl(request, { includeQuery = true } = {}) {
  const base = rawUrl(request)
  return includeQuery ? mergeQuery(base, requestQuery(request)) : base
}

// ---------------------------------------------------------------------------
// Variáveis da coleção
// ---------------------------------------------------------------------------

export function declaredVariables(collection) {
  const vars = Array.isArray(collection?.variable) ? collection.variable : []
  return vars
    .filter((v) => v && v.key)
    .map((v) => ({
      name: v.key,
      value: v.value === undefined || v.value === null ? '' : String(v.value),
      type: v.type || 'string',
      disabled: !!v.disabled,
    }))
}

const DYNAMIC_RESOLVERS = {
  '$timestamp': () => String(Math.floor(Date.now() / 1000)),
  '$isoTimestamp': () => new Date().toISOString(),
  '$guid': () => '00000000-0000-4000-8000-000000000000',
}

/**
 * Substitui {{var}} pelo valor da coleção. Devolve o texto resolvido e a lista
 * de variáveis que não têm valor disponível (normalmente vêm do environment).
 */
export function resolveTemplate(text, variables = {}) {
  const missing = []
  const out = String(text ?? '').replace(/\{\{\s*([^{}]+?)\s*\}\}/g, (full, rawName) => {
    const name = rawName.trim()
    if (Object.prototype.hasOwnProperty.call(variables, name)) {
      const value = variables[name]
      return value === undefined || value === null ? full : String(value)
    }
    if (Object.prototype.hasOwnProperty.call(DYNAMIC_RESOLVERS, name)) return DYNAMIC_RESOLVERS[name]()
    if (name.startsWith(DYNAMIC_PREFIX)) return full
    missing.push(name)
    return full
  })
  return { text: out, missing: Array.from(new Set(missing)) }
}

export function variablesToMap(collection) {
  const map = {}
  declaredVariables(collection).forEach((v) => {
    if (!v.disabled) map[v.name] = v.value
  })
  return map
}

/**Onde cada variável é usada — alimenta a aba de variáveis da página. */
export function analyzeVariables(collection, nodes) {
  const declared = declaredVariables(collection)
  const declaredNames = new Set(declared.map((v) => v.name))
  const usage = new Map()

  const record = (names, where) => {
    names.forEach((name) => {
      const key = name.trim()
      if (!key) return
      const entry = usage.get(key) || { name: key, count: 0, places: [], dynamic: key.startsWith(DYNAMIC_PREFIX) }
      entry.count += 1
      if (entry.places.length < 4) entry.places.push(where)
      usage.set(key, entry)
    })
  }

  nodes.forEach((node) => {
    if (node.kind !== 'request') return
    const request = node.request || {}
    const where = node.path ? `${node.path} / ${node.name}` : node.name
    record(collectVariables(rawUrl(request)), `${where} — url`)
    requestHeaders(request).forEach((h) => record(collectVariables(h.value), `${where} — header ${h.key}`))
    requestQuery(request).forEach((q) => record(collectVariables(q.value), `${where} — query ${q.key}`))
    const body = describeBody(request.body)
    if (body.text) record(collectVariables(body.text), `${where} — body`)
    body.params.forEach((p) => record(collectVariables(p.value), `${where} — body ${p.key}`))
    const auth = effectiveAuth(node)
    auth.params.forEach((p) => record(collectVariables(p.value), `${where} — auth ${auth.type}`))
  })

  const all = Array.from(usage.values()).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
  return {
    declared,
    usage: all,
    dynamic: all.filter((u) => u.dynamic),
    missing: all.filter((u) => !u.dynamic && !declaredNames.has(u.name)),
    unused: declared.filter((v) => !usage.has(v.name)),
  }
}

// ---------------------------------------------------------------------------
// Resumo
// ---------------------------------------------------------------------------

export function summarizeCollection(collection, nodes) {
  const requests = nodes.filter((n) => n.kind === 'request')
  const folders = nodes.filter((n) => n.kind === 'folder')
  const methods = {}
  const bodyModes = {}
  const authTypes = {}
  const scripts = uniqueScripts(nodes.flatMap((n) => n.events || []))
  let requestsWithScripts = 0
  let requestsWithBody = 0

  requests.forEach((node) => {
    methods[node.method] = (methods[node.method] || 0) + 1
    if ((node.events || []).length > 0) requestsWithScripts += 1
    const body = describeBody(node.request?.body)
    if (body.mode !== 'none') {
      requestsWithBody += 1
      bodyModes[body.mode] = (bodyModes[body.mode] || 0) + 1
    }
    const auth = effectiveAuth(node)
    authTypes[auth.type] = (authTypes[auth.type] || 0) + 1
  })

  return {
    requests: requests.length,
    folders: folders.length,
    methods,
    bodyModes,
    authTypes,
    preScripts: scripts.filter((s) => s.listen === 'prerequest').length,
    testScripts: scripts.filter((s) => s.listen === 'test').length,
    requestsWithScripts,
    requestsWithBody,
    variables: declaredVariables(collection).length,
    nodes: requests.concat(folders),
  }
}

// ---------------------------------------------------------------------------
// Lint / laudo
// ---------------------------------------------------------------------------

const CREDENTIAL_KEY_RE = /(authorization|api[-_]?key|apikey|access[-_]?token|secret|password|passwd|pwd|client[-_]?secret|bearer)/i
const URL_CREDENTIAL_RE = /[?&](api[-_]?key|access[-_]?token|token|key|secret|password|sig)=([^\s&]+)/i

export function lintCollection(collection, nodes, meta = {}) {
  const issues = []
  const add = (severity, rule, where, message, detail) => {
    issues.push({ severity, rule, where, message, detail: detail || '' })
  }

  if (!meta.schemaId) {
    add('warn', 'schema', 'coleção', 'info.schema ausente — o Postman assume a versão mais recente ao salvar')
  } else if (!meta.schemaVersion || !meta.schemaVersion.startsWith('v2')) {
    add('warn', 'schema', 'coleção', `schema fora da família v2: ${meta.schemaId}`, meta.schemaId)
  }
  if (!meta.name) add('warn', 'info-name', 'coleção', 'coleção sem nome em info.name')
  if (!collection.info?._postman_id) add('info', 'postman-id', 'coleção', 'info._postman_id ausente (o Postman sempre gera)')
  if (!nodes.some((n) => n.kind === 'request')) add('warn', 'empty', 'coleção', 'nenhuma requisição encontrada')

  const seen = new Map()
  nodes.forEach((node) => {
    if (node.kind !== 'request') return
    const where = node.path ? `${node.path} / ${node.name}` : node.name
    const request = node.request || {}

    if (!request.url) {
      add('error', 'url-missing', where, 'requisição sem url')
    } else {
      const url = rawUrl(request)
      if (!url.trim()) add('error', 'url-missing', where, 'url vazia')
      else if (!/^https?:\/\//i.test(url) && !url.trim().startsWith('{{')) {
        add('warn', 'url-invalid', where, `url não começa com http(s): ${url.slice(0, 80)}`)
      }
      const cred = URL_CREDENTIAL_RE.exec(url)
      if (cred && !cred[2].startsWith('{{')) {
        add('warn', 'hardcoded-credential', where, `credencial no query string: ${cred[1]}=${cred[2].slice(0, 6)}…`, url)
      }
    }

    requestHeaders(request).forEach((h) => {
      if (h.disabled) return
      if (CREDENTIAL_KEY_RE.test(h.key) && h.value && !h.value.includes('{{') && !/^\s*(basic|bearer)\s+\{\{/.test(h.value.trim())) {
        add('warn', 'hardcoded-credential', where, `header ${h.key} com valor literal — prefira {{var}} ou auth`, `${h.key}: ${h.value.slice(0, 40)}`)
      }
    })

    const body = describeBody(request.body)
    if (!body.valid) add('error', 'invalid-json', where, `body ${body.label} não é um JSON válido`, body.text.slice(0, 200))
    if (body.text && body.mode === 'raw' && CREDENTIAL_KEY_RE.test(body.text) && !body.text.includes('{{')) {
      add('warn', 'hardcoded-credential', where, 'body parece conter credencial em texto literal', body.text.slice(0, 120))
    }
    if (body.text.includes('-----BEGIN')) {
      add('error', 'private-key', where, 'chave privada embutida no body da requisição', body.text.slice(0, 80))
    }

    requestQuery(request).forEach((q) => {
      if (q.disabled) add('info', 'disabled-query', where, `query param desabilitado: ${q.key}`, `${q.key}=${q.value}`)
    })

    const auth = effectiveAuth(node)
    if (auth.type !== 'nenhuma' && auth.type !== 'noauth') {
      auth.params.forEach((p) => {
        if (p.value && CREDENTIAL_KEY_RE.test(p.key) && !p.value.includes('{{')) {
          add('warn', 'hardcoded-credential', where, `auth ${auth.type}: ${p.key} com valor literal`, `${p.key}: ${p.value.slice(0, 30)}`)
        }
      })
    }

    const key = `${node.path}::${node.name}`
    const seenTimes = (seen.get(key) || 0) + 1
    seen.set(key, seenTimes)
    if (seenTimes > 1) {
      add('info', 'duplicate-name', where, `nome repetido dentro da mesma pasta (${seenTimes}ª ocorrência)`, '')
    }
  })

  const order = { error: 0, warn: 1, info: 2 }
  issues.sort((a, b) => order[a.severity] - order[b.severity] || a.where.localeCompare(b.where))
  return issues
}

export function countBySeverity(issues) {
  const counts = { error: 0, warn: 0, info: 0 }
  issues.forEach((i) => {
    if (counts[i.severity] !== undefined) counts[i.severity] += 1
  })
  return counts
}

// ---------------------------------------------------------------------------
// Geração de código (curl / fetch / Python requests)
// ---------------------------------------------------------------------------

export function bodyToFormEntries(body, variables, resolve) {
  if (body.mode === 'raw') {
    if (!body.text) return []
    return [[
      body.language === 'json' && !resolve ? 'application/json' : `application/${body.language === 'json' ? 'json' : body.language}`,
      resolve ? resolveTemplate(body.text, variables).text : body.text,
    ]]
  }
  if (body.mode === 'urlencoded' || body.mode === 'formdata') {
    return body.params
      .filter((p) => !p.disabled && p.key)
      .map((p) => [p.key, resolve ? resolveTemplate(p.value, variables).text : p.value, p.type])
  }
  return []
}

export function toCurl(node, options = {}) {
  const { variables = {}, resolve = true } = options
  const request = node.request || {}
  const resolveText = (text) => (resolve ? resolveTemplate(text, variables).text : text)
  const url = resolveText(buildUrl(request))
  const parts = [`curl -X ${node.method} '${url.replace(/'/g, "'\\''")}'`]

  requestHeaders(request).forEach((h) => {
    if (h.disabled || !h.key) return
    parts.push(`  -H '${resolveText(String(h.key) + ': ' + h.value).replace(/'/g, "'\\''")}'`)
  })

  const body = describeBody(request.body)
  if (body.mode === 'graphql') {
    parts.push(`  --data-raw '${resolveText(body.text).replace(/'/g, "'\\''")}'`)
  } else if (body.mode === 'file') {
    parts.push(`  --upload-file '${resolveText(body.text)}'`)
  } else if (body.mode === 'formdata') {
    body.params.filter((p) => !p.disabled && p.key).forEach((p) => {
      if (p.type === 'file') parts.push(`  -F '${p.key}=@${resolveText(p.value)}'`)
      else parts.push(`  -F '${p.key}=${resolveText(p.value).replace(/'/g, "'\\''")}'`)
    })
  } else if (body.mode === 'urlencoded') {
    const pairs = body.params
      .filter((p) => !p.disabled && p.key)
      .map((p) => `${p.key}=${resolveText(p.value)}`)
    if (pairs.length) parts.push(`  --data-urlencode ${JSON.stringify(pairs.join('&'))}`)
  } else if (body.mode === 'raw' && body.text) {
    const contentType = body.language === 'json' ? 'application/json' : `application/${body.language}`
    if (!requestHeaders(request).some((h) => !h.disabled && h.key.toLowerCase() === 'content-type')) {
      parts.push(`  -H 'Content-Type: ${contentType}'`)
    }
    parts.push(`  -d '${resolveText(body.text).replace(/'/g, "'\\''")}'`)
  }

  return parts.join(' \\\n')
}

export function toFetch(node, options = {}) {
  const { variables = {}, resolve = true } = options
  const request = node.request || {}
  const resolveText = (text) => (resolve ? resolveTemplate(text, variables).text : text)
  const url = resolveText(buildUrl(request))

  const headers = requestHeaders(request)
    .filter((h) => !h.disabled && h.key)
    .map((h) => `    "${h.key}": ${JSON.stringify(resolveText(h.value))}`)
  const body = describeBody(request.body)
  let bodyLine = '  // sem corpo'
  if (body.mode === 'raw' && body.text) {
    const language = resolve ? resolveText(body.text) : body.text
    bodyLine = body.language === 'json'
      ? `  body: ${JSON.stringify(language)}`
      : `  body: ${JSON.stringify(language)}`
  } else if (body.mode === 'graphql' && body.text) {
    bodyLine = `  body: ${JSON.stringify(resolveText(body.text))}`
  } else if (body.mode === 'urlencoded' || body.mode === 'formdata') {
    const pairs = body.params
      .filter((p) => !p.disabled && p.key)
      .map((p) => [p.key, resolveText(p.value)])
    bodyLine = `  body: new URLSearchParams(${JSON.stringify(pairs)})`
  } else if (body.mode === 'file' && body.text) {
    bodyLine = `  body: formData // arquivo: ${resolveText(body.text)}`
  }

  return [
    `const res = await fetch(${JSON.stringify(url)}, {`,
    `  method: ${JSON.stringify(node.method)},`,
    `  headers: {`,
    headers.length ? headers.join(',\n') : '    // sem headers',
    `  },`,
    bodyLine,
    `})`,
    ``,
    `const data = await res.json()`,
    `console.log(res.status, data)`,
  ].join('\n')
}

function pythonLiteral(value, indent = 0) {
  const pad = ' '.repeat(indent)
  const padInner = ' '.repeat(indent + 4)
  if (value === null || value === undefined) return 'None'
  if (typeof value === 'boolean') return value ? 'True' : 'False'
  if (typeof value === 'number') return String(value)
  if (typeof value === 'string') return JSON.stringify(value)
  if (Array.isArray(value)) {
    if (!value.length) return '[]'
    return `[\n${value.map((v) => padInner + pythonLiteral(v, indent + 4)).join(',\n')}\n${pad}]`
  }
  const entries = Object.entries(value)
  if (!entries.length) return '{}'
  return `{\n${entries.map(([k, v]) => `${padInner}${JSON.stringify(k)}: ${pythonLiteral(v, indent + 4)}`).join(',\n')}\n${pad}}`
}

export function toPython(node, options = {}) {
  const { variables = {}, resolve = true } = options
  const request = node.request || {}
  const resolveText = (text) => (resolve ? resolveTemplate(text, variables).text : text)
  const url = resolveText(buildUrl(request))
  const method = node.method.toLowerCase()
  const fn = method === 'get' ? 'requests.get' : `requests.${method}`

  const headers = requestHeaders(request)
    .filter((h) => !h.disabled && h.key)
    .map((h) => `    ${JSON.stringify(h.key)}: ${JSON.stringify(resolveText(h.value))}`)

  const body = describeBody(request.body)
  let bodyArg = ''
  if (body.mode === 'raw' && body.text) {
    const text = resolveText(body.text)
    if (body.language === 'json' && jsonIsValid(text)) {
      bodyArg = `,\n    json=${pythonLiteral(JSON.parse(text), 4)}`
    } else {
      bodyArg = `,\n    data=${JSON.stringify(text)}`
    }
  } else if (body.mode === 'graphql' && body.text) {
    bodyArg = `,\n    data=${JSON.stringify(resolveText(body.text))}`
  } else if (body.mode === 'urlencoded' || body.mode === 'formdata') {
    const pairs = {}
    body.params.filter((p) => !p.disabled && p.key).forEach((p) => {
      pairs[p.key] = resolveText(p.value)
    })
    bodyArg = `,\n    data=${pythonLiteral(pairs, 4)}`
  }

  return [
    'import requests',
    '',
    `resp = ${fn}(`,
    `    ${JSON.stringify(url)},`,
    headers.length ? `    headers={\n${headers.join(',\n')}\n    },` : '    headers={},',
    bodyArg.replace(/^,/, ''),
    ')',
    '',
    'print(resp.status_code, resp.text)',
  ]
    .filter((line, index, arr) => !(line === '' && index === arr.length - 1))
    .join('\n')
}

export function toHttpFile(node, options = {}) {
  const request = node.request || {}
  const body = describeBody(request.body)
  const lines = [`${node.method} ${buildUrl(request, { includeQuery: false })} HTTP/1.1`]
  const headers = requestHeaders(request).filter((h) => !h.disabled && h.key)
  const hasHost = headers.some((h) => h.key.toLowerCase() === 'host')
  if (!hasHost) {
    try {
      lines.push(`Host: ${new URL(rawUrl(request)).host}`)
    } catch {
      /* url inválida: mantém só o que veio da coleção */
    }
  }
  headers.forEach((h) => lines.push(`${h.key}: ${h.value}`))
  if (body.mode === 'raw' && body.text) {
    const contentType = body.language === 'json' ? 'application/json' : `application/${body.language}`
    if (!headers.some((h) => h.key.toLowerCase() === 'content-type')) lines.push(`Content-Type: ${contentType}`)
    lines.push('', body.text)
  } else if (body.mode === 'graphql' && body.text) {
    lines.push('Content-Type: application/json', '', body.text)
  } else if ((body.mode === 'urlencoded' || body.mode === 'formdata') && body.params.length) {
    if (!headers.some((h) => h.key.toLowerCase() === 'content-type')) {
      lines.push(`Content-Type: ${body.mode === 'formdata' ? 'multipart/form-data' : 'application/x-www-form-urlencoded'}`)
    }
    lines.push(
      '',
      body.params
        .filter((p) => !p.disabled && p.key)
        .map((p) => `${p.key}=${p.value}`)
        .join('&')
    )
  }
  return lines.join('\n')
}