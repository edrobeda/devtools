// Gerador de especificação OpenAPI 3.0.0
// 100% client-side: monta specs YAML/JSON editáveis sem chamadas de rede.

export const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options']

export const PARAM_IN_OPTIONS = [
  { value: 'query', label: { pt: 'Query', en: 'Query' } },
  { value: 'path', label: { pt: 'Path', en: 'Path' } },
  { value: 'header', label: { pt: 'Header', en: 'Header' } },
]

export const SCHEMA_TYPES = [
  { value: 'string', label: 'string' },
  { value: 'integer', label: 'integer' },
  { value: 'number', label: 'number' },
  { value: 'boolean', label: 'boolean' },
  { value: 'array', label: 'array' },
  { value: 'object', label: 'object' },
]

export const CONTENT_TYPES = [
  { value: 'application/json', label: 'application/json' },
  { value: 'application/x-www-form-urlencoded', label: 'application/x-www-form-urlencoded' },
  { value: 'multipart/form-data', label: 'multipart/form-data' },
  { value: 'text/plain', label: 'text/plain' },
]

export function emptyParameter() {
  return {
    name: '',
    in: 'query',
    required: false,
    type: 'string',
    description: '',
  }
}

export function emptyResponse() {
  return {
    code: '200',
    description: 'OK',
    schemaType: 'object',
  }
}

export function emptyRequestBody() {
  return {
    required: true,
    contentType: 'application/json',
    schemaType: 'object',
    example: '',
  }
}

export function emptyPath() {
  return {
    path: '/users',
    method: 'get',
    summary: '',
    operationId: '',
    tags: '',
    parameters: [],
    hasRequestBody: false,
    requestBody: emptyRequestBody(),
    responses: [emptyResponse()],
  }
}

export const PRESETS = {
  'users-crud': {
    label: { pt: 'CRUD de usuários', en: 'Users CRUD' },
    title: 'Users API',
    version: '1.0.0',
    description: 'API RESTful para gerenciamento de usuários.',
    serverUrl: 'https://api.example.com/v1',
    paths: [
      {
        path: '/users',
        method: 'get',
        summary: 'Lista usuários',
        operationId: 'listUsers',
        tags: 'users',
        parameters: [
          { name: 'page', in: 'query', required: false, type: 'integer', description: 'Página de resultados' },
          { name: 'limit', in: 'query', required: false, type: 'integer', description: 'Itens por página' },
        ],
        hasRequestBody: false,
        requestBody: emptyRequestBody(),
        responses: [
          { code: '200', description: 'Lista paginada de usuários', schemaType: 'array' },
          { code: '400', description: 'Parâmetros inválidos', schemaType: 'object' },
        ],
      },
      {
        path: '/users',
        method: 'post',
        summary: 'Cria um usuário',
        operationId: 'createUser',
        tags: 'users',
        parameters: [],
        hasRequestBody: true,
        requestBody: {
          required: true,
          contentType: 'application/json',
          schemaType: 'object',
          example: '{\n  "name": "Ada Lovelace",\n  "email": "ada@example.com"\n}',
        },
        responses: [
          { code: '201', description: 'Usuário criado', schemaType: 'object' },
          { code: '422', description: 'Dados inválidos', schemaType: 'object' },
        ],
      },
      {
        path: '/users/{id}',
        method: 'get',
        summary: 'Busca usuário por ID',
        operationId: 'getUserById',
        tags: 'users',
        parameters: [
          { name: 'id', in: 'path', required: true, type: 'integer', description: 'ID do usuário' },
        ],
        hasRequestBody: false,
        requestBody: emptyRequestBody(),
        responses: [
          { code: '200', description: 'Detalhes do usuário', schemaType: 'object' },
          { code: '404', description: 'Usuário não encontrado', schemaType: 'object' },
        ],
      },
      {
        path: '/users/{id}',
        method: 'delete',
        summary: 'Remove um usuário',
        operationId: 'deleteUser',
        tags: 'users',
        parameters: [
          { name: 'id', in: 'path', required: true, type: 'integer', description: 'ID do usuário' },
        ],
        hasRequestBody: false,
        requestBody: emptyRequestBody(),
        responses: [
          { code: '204', description: 'Removido com sucesso', schemaType: 'object' },
          { code: '404', description: 'Usuário não encontrado', schemaType: 'object' },
        ],
      },
    ],
  },
  'products-api': {
    label: { pt: 'API de produtos', en: 'Products API' },
    title: 'Products API',
    version: '1.0.0',
    description: 'Catálogo e estoque de produtos.',
    serverUrl: 'https://api.example.com/v1',
    paths: [
      {
        path: '/products',
        method: 'get',
        summary: 'Lista produtos',
        operationId: 'listProducts',
        tags: 'products',
        parameters: [
          { name: 'category', in: 'query', required: false, type: 'string', description: 'Categoria' },
          { name: 'inStock', in: 'query', required: false, type: 'boolean', description: 'Apenas em estoque' },
        ],
        hasRequestBody: false,
        requestBody: emptyRequestBody(),
        responses: [
          { code: '200', description: 'Lista de produtos', schemaType: 'array' },
        ],
      },
      {
        path: '/products/{id}',
        method: 'get',
        summary: 'Busca produto por ID',
        operationId: 'getProductById',
        tags: 'products',
        parameters: [
          { name: 'id', in: 'path', required: true, type: 'string', description: 'SKU ou ID do produto' },
        ],
        hasRequestBody: false,
        requestBody: emptyRequestBody(),
        responses: [
          { code: '200', description: 'Detalhes do produto', schemaType: 'object' },
          { code: '404', description: 'Produto não encontrado', schemaType: 'object' },
        ],
      },
      {
        path: '/products/{id}/stock',
        method: 'patch',
        summary: 'Atualiza estoque',
        operationId: 'updateStock',
        tags: 'products',
        parameters: [
          { name: 'id', in: 'path', required: true, type: 'string', description: 'ID do produto' },
        ],
        hasRequestBody: true,
        requestBody: {
          required: true,
          contentType: 'application/json',
          schemaType: 'object',
          example: '{\n  "quantity": 42\n}',
        },
        responses: [
          { code: '200', description: 'Estoque atualizado', schemaType: 'object' },
          { code: '422', description: 'Quantidade inválida', schemaType: 'object' },
        ],
      },
    ],
  },
  'auth-api': {
    label: { pt: 'API de autenticação', en: 'Auth API' },
    title: 'Auth API',
    version: '1.0.0',
    description: 'Endpoints de autenticação e autorização.',
    serverUrl: 'https://auth.example.com',
    paths: [
      {
        path: '/auth/login',
        method: 'post',
        summary: 'Autentica um usuário',
        operationId: 'login',
        tags: 'auth',
        parameters: [],
        hasRequestBody: true,
        requestBody: {
          required: true,
          contentType: 'application/json',
          schemaType: 'object',
          example: '{\n  "email": "user@example.com",\n  "password": "secret"\n}',
        },
        responses: [
          { code: '200', description: 'Tokens de acesso', schemaType: 'object' },
          { code: '401', description: 'Credenciais inválidas', schemaType: 'object' },
        ],
      },
      {
        path: '/auth/refresh',
        method: 'post',
        summary: 'Renova o token de acesso',
        operationId: 'refreshToken',
        tags: 'auth',
        parameters: [],
        hasRequestBody: true,
        requestBody: {
          required: true,
          contentType: 'application/json',
          schemaType: 'object',
          example: '{\n  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."\n}',
        },
        responses: [
          { code: '200', description: 'Novo token de acesso', schemaType: 'object' },
          { code: '403', description: 'Refresh token inválido', schemaType: 'object' },
        ],
      },
      {
        path: '/auth/me',
        method: 'get',
        summary: 'Retorna o usuário autenticado',
        operationId: 'getMe',
        tags: 'auth',
        parameters: [
          { name: 'Authorization', in: 'header', required: true, type: 'string', description: 'Bearer token' },
        ],
        hasRequestBody: false,
        requestBody: emptyRequestBody(),
        responses: [
          { code: '200', description: 'Perfil do usuário', schemaType: 'object' },
          { code: '401', description: 'Não autorizado', schemaType: 'object' },
        ],
      },
    ],
  },
  minimal: {
    label: { pt: 'Mínimo', en: 'Minimal' },
    title: 'My API',
    version: '1.0.0',
    description: 'Descrição da API.',
    serverUrl: 'https://api.example.com',
    paths: [emptyPath()],
  },
}

function buildSchema(type, withExample) {
  switch (type) {
    case 'array':
      return { type: 'array', items: { type: 'object' } }
    case 'object':
      return withExample ? { type: 'object', example: {} } : { type: 'object' }
    default:
      return { type }
  }
}

export function buildOpenApiSpec(options) {
  const spec = {
    openapi: '3.0.0',
    info: {
      title: options.title || 'API',
      version: options.version || '1.0.0',
      description: options.description || '',
    },
    servers: [{ url: options.serverUrl || 'https://api.example.com' }],
    paths: {},
  }

  const tagsSet = new Set()

  ;(options.paths || []).forEach((p) => {
    if (!p.path || !p.method) return
    const pathKey = p.path.startsWith('/') ? p.path : `/${p.path}`
    if (!spec.paths[pathKey]) spec.paths[pathKey] = {}

    const operation = {
      summary: p.summary || `${p.method.toUpperCase()} ${pathKey}`,
      operationId: p.operationId || `${p.method}${pathKey.replace(/[^a-zA-Z0-9]/g, '')}`,
      tags: p.tags ? p.tags.split(',').map((s) => s.trim()).filter(Boolean) : [],
    }

    operation.tags.forEach((tag) => tagsSet.add(tag))

    if (Array.isArray(p.parameters) && p.parameters.length) {
      operation.parameters = p.parameters
        .filter((param) => param.name)
        .map((param) => ({
          name: param.name,
          in: param.in || 'query',
          required: Boolean(param.required),
          description: param.description || '',
          schema: { type: param.type || 'string' },
        }))
    }

    if (p.hasRequestBody && p.requestBody) {
      const rb = p.requestBody
      const content = {}
      const schema = buildSchema(rb.schemaType || 'object', false)
      if (rb.example) {
        try {
          schema.example = JSON.parse(rb.example)
        } catch {
          schema.example = rb.example
        }
      }
      content[rb.contentType || 'application/json'] = { schema }
      operation.requestBody = {
        required: Boolean(rb.required),
        description: rb.description || '',
        content,
      }
    }

    operation.responses = {}
    ;(p.responses || []).forEach((r) => {
      if (!r.code) return
      const content = {}
      content['application/json'] = { schema: buildSchema(r.schemaType || 'object', false) }
      operation.responses[r.code] = {
        description: r.description || '',
        content,
      }
    })

    spec.paths[pathKey][p.method.toLowerCase()] = operation
  })

  if (tagsSet.size) {
    spec.tags = Array.from(tagsSet).map((name) => ({ name }))
  }

  return spec
}

function yamlStringify(obj, indent = 0) {
  const spaces = '  '.repeat(indent)
  let lines = []

  if (obj === null || obj === undefined) return `${spaces}null`
  if (typeof obj === 'string') {
    if (obj.includes('\n') || obj.includes(':') || obj.includes('#') || obj.trim() === '') {
      return `${spaces}"""\n${obj.split('\n').map((l) => `${spaces}  ${l}`).join('\n')}\n${spaces}"""`
    }
    return `${spaces}${obj}`
  }
  if (typeof obj === 'number' || typeof obj === 'boolean') return `${spaces}${obj}`
  if (Array.isArray(obj)) {
    if (obj.length === 0) return `${spaces}[]`
    obj.forEach((item) => {
      if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
        const keys = Object.keys(item)
        const first = keys[0]
        lines.push(`${spaces}- ${first}: ${yamlPrimitive(item[first])}`)
        keys.slice(1).forEach((k) => {
          lines.push(yamlStringify({ [k]: item[k] }, indent + 1))
        })
      } else {
        lines.push(`${spaces}- ${yamlPrimitive(item)}`)
      }
    })
    return lines.join('\n')
  }

  const entries = Object.entries(obj)
  entries.forEach(([k, v]) => {
    if (typeof v === 'object' && v !== null && !Array.isArray(v) && Object.keys(v).length) {
      lines.push(`${spaces}${k}:`)
      lines.push(yamlStringify(v, indent + 1))
    } else if (Array.isArray(v) && v.length) {
      lines.push(`${spaces}${k}:`)
      lines.push(yamlStringify(v, indent + 1))
    } else if (v !== undefined && v !== null && v !== '') {
      lines.push(`${spaces}${k}: ${yamlPrimitive(v)}`)
    } else if (v === '') {
      lines.push(`${spaces}${k}: ""`)
    }
  })
  return lines.join('\n')
}

function yamlPrimitive(v) {
  if (v === null || v === undefined) return 'null'
  if (typeof v === 'boolean') return v ? 'true' : 'false'
  if (typeof v === 'number') return String(v)
  if (typeof v === 'string') {
    if (v.includes(':') || v.includes('#') || v.includes('\n') || v.includes(',') || v.trim() === '') {
      return `"${v.replace(/"/g, '\\"')}"`
    }
    return v
  }
  return ''
}

export function toYaml(spec) {
  return `openapi: "3.0.0"\n${yamlStringify({ info: spec.info, servers: spec.servers, tags: spec.tags, paths: spec.paths })}`
}

export function toJson(spec) {
  return JSON.stringify(spec, null, 2)
}

export function statsFor(specText) {
  return {
    lines: specText.split('\n').length,
    bytes: new Blob([specText]).size,
    paths: (specText.match(/\n  \/[^:]/g) || []).length,
  }
}
