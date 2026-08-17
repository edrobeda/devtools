// Motor 100% client-side para gerar configurações CORS em vários formatos.

export const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']

export const PRESETS = {
  permissive: {
    label: { pt: 'Permissivo (desenvolvimento)', en: 'Permissive (development)' },
    origins: ['*'],
    methods: [...HTTP_METHODS],
    headers: ['*'],
    exposedHeaders: [],
    credentials: false,
    maxAge: 86400,
  },
  apiPublic: {
    label: { pt: 'API pública', en: 'Public API' },
    origins: ['*'],
    methods: ['GET', 'POST'],
    headers: ['Content-Type'],
    exposedHeaders: ['X-Total-Count'],
    credentials: false,
    maxAge: 600,
  },
  spaWithCredentials: {
    label: { pt: 'SPA com cookies/credentials', en: 'SPA with cookies/credentials' },
    origins: ['https://app.example.com'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    headers: ['Content-Type', 'Authorization'],
    exposedHeaders: ['X-Total-Count', 'X-Request-Id'],
    credentials: true,
    maxAge: 7200,
  },
  strict: {
    label: { pt: 'Estrito (origens fixas)', en: 'Strict (fixed origins)' },
    origins: ['https://app.example.com', 'https://admin.example.com'],
    methods: ['GET', 'POST'],
    headers: ['Content-Type', 'Authorization', 'X-Request-Id'],
    exposedHeaders: ['X-Request-Id'],
    credentials: true,
    maxAge: 300,
  },
}

export function normalizeOptions(raw) {
  const origins = Array.isArray(raw.origins) ? raw.origins.filter(Boolean) : []
  const methods = Array.isArray(raw.methods) ? raw.methods : []
  const headers = Array.isArray(raw.headers) ? raw.headers.filter(Boolean) : []
  const exposedHeaders = Array.isArray(raw.exposedHeaders) ? raw.exposedHeaders.filter(Boolean) : []
  const credentials = !!raw.credentials
  const maxAge = Number.isFinite(raw.maxAge) ? raw.maxAge : 86400

  const warnings = []
  if (credentials && origins.includes('*')) {
    warnings.push({
      pt: 'Com credentials=true, Access-Control-Allow-Origin não pode ser *. Use uma origem específica.',
      en: 'With credentials=true, Access-Control-Allow-Origin cannot be *. Use a specific origin.',
    })
  }
  if (methods.length === 0) {
    warnings.push({
      pt: 'Pelo menos um método HTTP deve ser permitido.',
      en: 'At least one HTTP method must be allowed.',
    })
  }
  if (origins.length === 0) {
    warnings.push({
      pt: 'Pelo menos uma origem deve ser permitida.',
      en: 'At least one origin must be allowed.',
    })
  }

  return { origins, methods, headers, exposedHeaders, credentials, maxAge, warnings }
}

function joinMethods(methods) {
  return methods.join(', ')
}

function joinHeaders(headers) {
  return headers.join(', ')
}

export function generateNginx(options) {
  const { origins, methods, headers, exposedHeaders, credentials, maxAge } = options
  const lines = []
  lines.push('location / {')
  if (origins.includes('*') && !credentials) {
    lines.push('    add_header Access-Control-Allow-Origin * always;')
  } else if (origins.length === 1) {
    lines.push(`    add_header Access-Control-Allow-Origin "${origins[0]}" always;`)
  } else if (origins.length > 1) {
    lines.push('    # Verifica se a origem da requisição está na lista permitida')
    lines.push('    set $cors_origin "";')
    origins.forEach((o) => {
      lines.push(`    if ($http_origin ~* ^${escapeRegex(o)}$) {`)
      lines.push(`        set $cors_origin "${o}";`)
      lines.push('    }')
    })
    lines.push('    add_header Access-Control-Allow-Origin $cors_origin always;')
  }
  lines.push(`    add_header Access-Control-Allow-Methods "${joinMethods(methods)}" always;`)
  if (headers.length > 0) {
    lines.push(`    add_header Access-Control-Allow-Headers "${joinHeaders(headers)}" always;`)
  }
  if (exposedHeaders.length > 0) {
    lines.push(`    add_header Access-Control-Expose-Headers "${joinHeaders(exposedHeaders)}" always;`)
  }
  if (credentials) {
    lines.push('    add_header Access-Control-Allow-Credentials "true" always;')
  }
  if (maxAge > 0) {
    lines.push(`    add_header Access-Control-Max-Age "${maxAge}" always;`)
  }
  lines.push('}')
  return lines.join('\n')
}

export function generateApache(options) {
  const { origins, methods, headers, exposedHeaders, credentials, maxAge } = options
  const lines = []
  lines.push('<IfModule mod_headers.c>')
  if (origins.includes('*') && !credentials) {
    lines.push('    Header set Access-Control-Allow-Origin "*"')
  } else if (origins.length === 1) {
    lines.push(`    SetEnvIf Origin "^${escapeRegex(origins[0])}$" ACAO=$0`)
    lines.push('    Header set Access-Control-Allow-Origin "%{ACAO}e" env=ACAO')
  } else if (origins.length > 1) {
    const pattern = origins.map(escapeRegex).join('|')
    lines.push(`    SetEnvIf Origin "^(${pattern})$" ACAO=$0`)
    lines.push('    Header set Access-Control-Allow-Origin "%{ACAO}e" env=ACAO')
  }
  lines.push(`    Header set Access-Control-Allow-Methods "${joinMethods(methods)}"`)
  if (headers.length > 0) {
    lines.push(`    Header set Access-Control-Allow-Headers "${joinHeaders(headers)}"`)
  }
  if (exposedHeaders.length > 0) {
    lines.push(`    Header set Access-Control-Expose-Headers "${joinHeaders(exposedHeaders)}"`)
  }
  if (credentials) {
    lines.push('    Header set Access-Control-Allow-Credentials "true"')
  }
  if (maxAge > 0) {
    lines.push(`    Header set Access-Control-Max-Age "${maxAge}"`)
  }
  lines.push('</IfModule>')
  return lines.join('\n')
}

export function generateExpress(options) {
  const { origins, methods, headers, exposedHeaders, credentials, maxAge } = options
  const lines = []
  lines.push('const cors = require(\'cors\');')
  lines.push('')
  lines.push('const corsOptions = {')
  if (origins.includes('*') && !credentials) {
    lines.push('  origin: \'*\',')
  } else if (origins.length === 1) {
    lines.push(`  origin: '${origins[0]}',`)
  } else {
    lines.push('  origin: [')
    origins.forEach((o) => lines.push(`    '${o}',`))
    lines.push('  ],')
  }
  lines.push(`  methods: '${joinMethods(methods)}',`)
  if (headers.length > 0) {
    lines.push(`  allowedHeaders: '${joinHeaders(headers)}',`)
  }
  if (exposedHeaders.length > 0) {
    lines.push(`  exposedHeaders: '${joinHeaders(exposedHeaders)}',`)
  }
  if (credentials) {
    lines.push('  credentials: true,')
  }
  if (maxAge > 0) {
    lines.push(`  maxAge: ${maxAge},`)
  }
  lines.push('  optionsSuccessStatus: 204,')
  lines.push('};')
  lines.push('')
  lines.push('app.use(cors(corsOptions));')
  return lines.join('\n')
}

export function generateFastAPI(options) {
  const { origins, methods, headers, exposedHeaders, credentials, maxAge } = options
  const lines = []
  lines.push('from fastapi.middleware.cors import CORSMiddleware')
  lines.push('')
  lines.push('app.add_middleware(')
  lines.push('    CORSMiddleware,')
  if (origins.includes('*') && !credentials) {
    lines.push('    allow_origins=["*"],')
  } else {
    lines.push('    allow_origins=[')
    origins.forEach((o) => lines.push(`        "${o}",`))
    lines.push('    ],')
  }
  lines.push(`    allow_methods=[${methods.map((m) => `"${m}"`).join(', ')}],`)
  if (headers.length > 0) {
    lines.push(`    allow_headers=[${headers.map((h) => `"${h}"`).join(', ')}],`)
  }
  if (exposedHeaders.length > 0) {
    lines.push(`    expose_headers=[${exposedHeaders.map((h) => `"${h}"`).join(', ')}],`)
  }
  lines.push(`    allow_credentials=${credentials ? 'True' : 'False'},`)
  if (maxAge > 0) {
    lines.push(`    max_age=${maxAge},`)
  }
  lines.push(')')
  return lines.join('\n')
}

export function generateSpring(options) {
  const { origins, methods, headers, exposedHeaders, credentials, maxAge } = options
  const lines = []
  lines.push('@Configuration')
  lines.push('public class CorsConfig implements WebMvcConfigurer {')
  lines.push('')
  lines.push('    @Override')
  lines.push('    public void addCorsMappings(CorsRegistry registry) {')
  const originPattern = origins.includes('*') && !credentials ? '"*"' : `[${origins.map((o) => `"${o}"`).join(', ')}]`
  lines.push(`        registry.addMapping("/**")`)
  lines.push(`            .allowedOrigins(${originPattern})`)
  lines.push(`            .allowedMethods(${methods.map((m) => `"${m}"`).join(', ')})`)
  if (headers.length > 0) {
    lines.push(`            .allowedHeaders(${headers.map((h) => `"${h}"`).join(', ')})`)
  }
  if (exposedHeaders.length > 0) {
    lines.push(`            .exposedHeaders(${exposedHeaders.map((h) => `"${h}"`).join(', ')})`)
  }
  lines.push(`            .allowCredentials(${credentials ? 'true' : 'false'})`)
  if (maxAge > 0) {
    lines.push(`            .maxAge(${maxAge})`)
  }
  lines.push('        ;')
  lines.push('    }')
  lines.push('}')
  return lines.join('\n')
}

export function generateAspNetCore(options) {
  const { origins, methods, headers, exposedHeaders, credentials, maxAge } = options
  const lines = []
  lines.push('var builder = WebApplication.CreateBuilder(args);')
  lines.push('')
  lines.push('builder.Services.AddCors(options =>')
  lines.push('{')
  lines.push('    options.AddPolicy("DevToolsCors", policy =>')
  lines.push('    {')
  const policyLines = []
  if (origins.includes('*') && !credentials) {
    policyLines.push('        policy.AllowAnyOrigin();')
  } else {
    policyLines.push(`        policy.WithOrigins(${origins.map((o) => `"${o}"`).join(', ')});`)
  }
  if (methods.length === HTTP_METHODS.length) {
    policyLines.push('        policy.AllowAnyMethod();')
  } else {
    policyLines.push(`        policy.WithMethods(${methods.map((m) => `"${m}"`).join(', ')});`)
  }
  if (headers.length > 0) {
    policyLines.push(`        policy.WithHeaders(${headers.map((h) => `"${h}"`).join(', ')});`)
  }
  if (exposedHeaders.length > 0) {
    policyLines.push(`        policy.WithExposedHeaders(${exposedHeaders.map((h) => `"${h}"`).join(', ')});`)
  }
  if (credentials) {
    policyLines.push('        policy.AllowCredentials();')
  }
  lines.push(...policyLines)
  lines.push('    });')
  lines.push('});')
  lines.push('')
  lines.push('var app = builder.Build();')
  lines.push('app.UseCors("DevToolsCors");')
  if (maxAge > 0) {
    lines.push('')
    lines.push('// No ASP.NET Core o MaxAge costuma ser configurado no policy via SetPreflightMaxAge:')
    lines.push(`// policy.SetPreflightMaxAge(TimeSpan.FromSeconds(${maxAge}));`)
  }
  return lines.join('\n')
}

export function generateRawHeaders(options) {
  const { origins, methods, headers, exposedHeaders, credentials, maxAge } = options
  const lines = []
  if (origins.includes('*') && !credentials) {
    lines.push('Access-Control-Allow-Origin: *')
  } else if (origins.length === 1) {
    lines.push(`Access-Control-Allow-Origin: ${origins[0]}`)
  } else {
    lines.push('# O navegador só lê UMA origem. Use a origem da requisição quando estiver na lista:')
    origins.forEach((o) => lines.push(`# ${o}`))
    lines.push('Access-Control-Allow-Origin: <origem-da-requisicao>')
  }
  lines.push(`Access-Control-Allow-Methods: ${joinMethods(methods)}`)
  if (headers.length > 0) {
    lines.push(`Access-Control-Allow-Headers: ${joinHeaders(headers)}`)
  }
  if (exposedHeaders.length > 0) {
    lines.push(`Access-Control-Expose-Headers: ${joinHeaders(exposedHeaders)}`)
  }
  if (credentials) {
    lines.push('Access-Control-Allow-Credentials: true')
  }
  if (maxAge > 0) {
    lines.push(`Access-Control-Max-Age: ${maxAge}`)
  }
  return lines.join('\n')
}

export function generateAll(options) {
  const normalized = normalizeOptions(options)
  return {
    normalized,
    outputs: {
      nginx: generateNginx(normalized),
      apache: generateApache(normalized),
      express: generateExpress(normalized),
      fastapi: generateFastAPI(normalized),
      spring: generateSpring(normalized),
      aspnet: generateAspNetCore(normalized),
      headers: generateRawHeaders(normalized),
    },
  }
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
