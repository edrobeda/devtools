// Validador de Content-Security-Policy — 100% client-side.
//
// Entrada: texto colado (header `Content-Security-Policy: ...`, header
// `Content-Security-Policy-Report-Only: ...`, tag <meta http-equiv=...>,
// ou a política "crua" sem prefixo).
//
// Saída de validateCsp():
//   {
//     policies: [{ mode, source, directives: [{ name, raw, values }] }],
//     findings: [{ severity: 'error'|'warning'|'info', code, directive, ctx }],
//     summary:  { policies, directives, sources, errors, warnings, infos,
//                 mode, source }
//   }
//
// Os achados saem como { severity, code, directive, ctx } — a mensagem
// (PT/EN) fica na página, no mapa PROBLEMS, mesmo padrão do validador de
// manifestos Kubernetes.

const KNOWN_DIRECTIVES = new Set([
  // fetch
  'default-src', 'child-src', 'connect-src', 'font-src', 'frame-src',
  'img-src', 'manifest-src', 'media-src', 'object-src', 'script-src',
  'script-src-elem', 'script-src-attr', 'style-src', 'style-src-elem',
  'style-src-attr', 'worker-src',
  // navegação
  'base-uri', 'form-action', 'frame-ancestors', 'sandbox', 'navigate-to',
  // report
  'report-uri', 'report-to',
  // diversos
  'upgrade-insecure-requests', 'trusted-types', 'require-trusted-types-for',
  // obsoletas (conhecidas, mas removidas/deprecadas)
  'block-all-mixed-content', 'plugin-types', 'referrer', 'require-sri-for',
  'prefetch-src', 'disown-opener',
])

const KNOWN_KEYWORDS = new Set([
  "'self'", "'none'", "'unsafe-inline'", "'unsafe-eval'", "'strict-dynamic'",
  "'unsafe-hashes'", "'wasm-unsafe-eval'", "'inline-speculation-rules'",
  "'report-sample'", "'unsafe-allow-redirects'",
])

// Diretivas que precisam de pelo menos um valor pra fazer sentido.
const NEEDS_VALUES = new Set([
  'default-src', 'child-src', 'connect-src', 'font-src', 'frame-src',
  'img-src', 'manifest-src', 'media-src', 'object-src', 'script-src',
  'script-src-elem', 'script-src-attr', 'style-src', 'style-src-elem',
  'style-src-attr', 'worker-src', 'base-uri', 'form-action',
  'frame-ancestors', 'report-uri', 'report-to', 'navigate-to',
  'plugin-types', 'require-sri-for',
])

// Diretivas de script: onde 'unsafe-inline'/'unsafe-eval'/data:/curinga
// são críticos.
const SCRIPT_DIRECTIVES = new Set([
  'script-src', 'script-src-elem', 'script-src-attr',
])

// Diretivas que NUNCA caem no default-src (navegação/report).
const NO_FALLBACK = new Set(['base-uri', 'form-action', 'frame-ancestors', 'sandbox', 'report-uri', 'report-to', 'upgrade-insecure-requests'])

// Cadeia de fallback de cada diretiva de fetch (CSP3 §6.7.1).
const FALLBACK = {
  'script-src-elem': ['script-src', 'default-src'],
  'script-src-attr': ['script-src', 'default-src'],
  'style-src-elem': ['style-src', 'default-src'],
  'style-src-attr': ['style-src', 'default-src'],
  'worker-src': ['child-src', 'script-src', 'default-src'],
  'frame-src': ['child-src', 'default-src'],
  'child-src': ['default-src'],
  'connect-src': ['default-src'],
  'font-src': ['default-src'],
  'img-src': ['default-src'],
  'manifest-src': ['default-src'],
  'media-src': ['default-src'],
  'object-src': ['default-src'],
  'script-src': ['default-src'],
  'style-src': ['default-src'],
  'base-uri': [],
  'form-action': [],
  'frame-ancestors': [],
  'sandbox': [],
}

// Tabela exibida na página: diretivas de fetch + as de navegação que não
// caem no default-src (essa distinção é justamente uma das coisas que a
// página ensina).
export const POLICY_TABLE_DIRECTIVES = [
  'default-src', 'script-src', 'script-src-elem', 'script-src-attr',
  'style-src', 'style-src-elem', 'style-src-attr', 'img-src', 'font-src',
  'connect-src', 'media-src', 'frame-src', 'child-src', 'worker-src',
  'object-src', 'manifest-src', 'base-uri', 'form-action', 'frame-ancestors',
]

const DEPRECATED = new Set([
  'block-all-mixed-content', 'plugin-types', 'referrer',
  'require-sri-for', 'prefetch-src', 'disown-opener',
])

// ─── Parsing ─────────────────────────────────────────────────────

function decodeEntities(s) {
  return s
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
}

export function parsePolicies(text) {
  const input = String(text || '')
  const policies = []

  const prefixRe = /content-security-policy(-report-only)?\s*:/gi
  const matches = [...input.matchAll(prefixRe)]
  if (matches.length > 0) {
    for (let i = 0; i < matches.length; i++) {
      const start = matches[i].index + matches[i][0].length
      const end = i + 1 < matches.length ? matches[i + 1].index : input.length
      policies.push({
        mode: matches[i][1] ? 'report-only' : 'enforced',
        source: 'header',
        body: input.slice(start, end),
      })
    }
    return policies
  }

  const metaTag = input.match(/<meta[^>]*>/i)
  if (metaTag && /http-equiv\s*=\s*["']content-security-policy["']/i.test(metaTag[0])) {
    const contentMatch = metaTag[0].match(/content\s*=\s*(?:"([^"]*)"|'([^']*)')/i)
    const body = contentMatch ? decodeEntities(contentMatch[1] ?? contentMatch[2] ?? '') : ''
    return [{ mode: 'enforced', source: 'meta', body }]
  }

  return [{ mode: 'enforced', source: 'header', body: input }]
}

export function parseDirectives(body) {
  const flat = String(body || '').replace(/[\r\n]+/g, ' ')
  const directives = []
  for (const seg of flat.split(';')) {
    const s = seg.trim()
    if (!s) continue
    const parts = s.split(/\s+/).filter(Boolean)
    if (parts.length === 0) continue
    directives.push({
      name: parts[0].toLowerCase(),
      raw: parts[0],
      values: parts.slice(1),
    })
  }
  return directives
}

// ─── Classificação de tokens de origem ───────────────────────────

export function classifyToken(tok) {
  const t = String(tok || '').trim()
  if (!t) return { type: 'empty' }
  const lower = t.toLowerCase()

  if (lower === '*') return { type: 'wildcard' }
  if (KNOWN_KEYWORDS.has(lower)) return { type: 'keyword', kw: lower }
  if (/^'(nonce|sha256|sha384|sha512)-[a-z0-9+/=_-]+'$/i.test(t)) {
    return { type: lower.startsWith("'nonce") ? 'nonce' : 'hash' }
  }
  if (t.startsWith("'")) return { type: 'unknown-keyword' }
  if (/^[a-z][a-z0-9+.-]*:$/i.test(t)) return { type: 'scheme', scheme: lower.slice(0, -1) }

  // host-source: com ou sem esquema, com ou sem //, com curinga no
  // começo do host (*.exemplo.com), com porta e/ou caminho.
  return { type: 'host', problem: hostProblem(t) }
}

function hostProblem(tok) {
  const quotes = (tok.match(/'/g) || []).length
  if (quotes % 2 !== 0) return 'quote'
  if (/["><\\]/.test(tok)) return 'chars'
  const stripped = tok.replace(/^[a-z][a-z0-9+.-]*:/i, '').replace(/^\/\//, '')
  if (stripped.includes('*') && stripped !== '*' && !stripped.startsWith('*.')) {
    return 'wildcard-pos'
  }
  return null
}

// ─── Motor de validação ──────────────────────────────────────────

export function validateCsp(raw) {
  const policies = parsePolicies(raw)
  const findings = []
  const add = (severity, code, directive, ctx) => {
    findings.push({ severity, code, directive: directive || '', ctx: ctx || '' })
  }

  if (policies.length > 1) {
    add('info', 'multiPolicy', '', String(policies.length))
  }

  let directiveTotal = 0
  let sourceTotal = 0

  policies.forEach((policy) => {
    const dirs = parseDirectives(policy.body)
    const byName = new Map()
    dirs.forEach((d) => {
      if (!byName.has(d.name)) byName.set(d.name, d)
    })

    if (dirs.length === 0) {
      add('error', 'empty', '', '')
      return
    }

    directiveTotal += dirs.length
    dirs.forEach((d) => { sourceTotal += d.values.length })

    const has = (name) => byName.has(name)
    const get = (name) => byName.get(name)
    const isMeta = policy.source === 'meta'

    // ── checagens por diretiva (duplicadas / desconhecidas / vazias)
    const seen = new Set()
    for (const d of dirs) {
      if (seen.has(d.name)) add('warning', 'dupDirective', d.name, d.name)
      seen.add(d.name)
      if (!KNOWN_DIRECTIVES.has(d.name)) add('warning', 'unknownDirective', d.name, d.name)
      else if (NEEDS_VALUES.has(d.name) && d.values.length === 0) {
        add('warning', 'directiveNoValues', d.name, d.name)
      }
      if (DEPRECATED.has(d.name)) add('warning', 'deprecatedDirective', d.name, d.name)
      if (d.name === 'report-uri') add('warning', 'reportUriDeprecated', 'report-uri', 'report-uri')
    }

    const scriptFallsBackToDefault = !['script-src', 'script-src-elem', 'script-src-attr'].some((n) => has(n))
    const styleFallsBackToDefault = !['style-src', 'style-src-elem', 'style-src-attr'].some((n) => has(n))

    // ── checagens por token ──────────────────────────────────────
    for (const d of dirs) {
      const kinds = d.values.map(classifyToken)
      const hasNonceOrHash = kinds.some((k) => k.type === 'nonce' || k.type === 'hash')
      const hasStrictDynamic = d.values.some((v) => v.toLowerCase() === "'strict-dynamic'")
      const relaxesUnsafeInline = hasNonceOrHash || hasStrictDynamic

      const isScriptCtx =
        SCRIPT_DIRECTIVES.has(d.name) ||
        (d.name === 'default-src' && scriptFallsBackToDefault)
      const isStyleCtx =
        ['style-src', 'style-src-elem', 'style-src-attr'].includes(d.name) ||
        (d.name === 'default-src' && styleFallsBackToDefault)

      d.values.forEach((tok, i) => {
        const k = kinds[i]

        // require-trusted-types-for aceita nomes de sink entre aspas
        // ('script', 'eval', ...) — não são keywords de origem.
        if (d.name === 'require-trusted-types-for' && /^'[a-zA-Z0-9_-]+'$/.test(tok)) return
        // trusted-types aceita `*` (qualquer policy) e allow-duplicates —
        // não são curingas de origem; a checagem fica em ttPermissive.
        if (d.name === 'trusted-types' && (tok === '*' || tok.toLowerCase() === 'allow-duplicates')) return
        if (d.name === 'report-to') return

        if (k.type === 'unknown-keyword') {
          add('error', 'unknownKeyword', d.name, tok)
          return
        }
        if (k.type === 'host' && k.problem) {
          add('error', 'invalidToken', d.name, tok)
          return
        }

        if (k.type === 'keyword' && k.kw === "'unsafe-inline'") {
          if (isScriptCtx) {
            if (relaxesUnsafeInline) add('info', 'unsafeInlineIgnored', d.name, d.name)
            else add('error', 'unsafeInlineScript', d.name, d.name)
          } else if (isStyleCtx) {
            add('info', 'unsafeInlineStyle', d.name, d.name)
          }
        }

        if (k.type === 'keyword' && k.kw === "'unsafe-eval'" && isScriptCtx) {
          add('error', 'unsafeEval', d.name, d.name)
        }

        if (k.type === 'scheme' && k.scheme === 'data' && isScriptCtx) {
          add('error', 'dataScript', d.name, d.name)
        }

        if (k.type === 'scheme' && k.scheme === 'http') {
          add('warning', 'httpSource', d.name, tok)
        }
        if (k.type === 'host' && /^http:\/\//i.test(tok)) {
          add('warning', 'httpSource', d.name, tok)
        }

        if (k.type === 'wildcard') {
          if (isScriptCtx) add('error', 'wildcardScript', d.name, d.name)
          else if (['frame-ancestors', 'base-uri', 'form-action'].includes(d.name)) {
            add('error', 'wildcardSensitive', d.name, d.name)
          } else if (d.name === 'default-src') {
            add('warning', 'wildcardOther', 'default-src', 'default-src')
          } else {
            add('warning', 'wildcardOther', d.name, d.name)
          }
        }

        if (k.type === 'host' && k.problem === null && /^\*\.|:\/\/\*\./i.test(tok)) {
          add('info', 'wildcardSubdomain', d.name, tok)
        }

        if (
          k.type === 'scheme' &&
          d.name === 'frame-ancestors' &&
          k.scheme !== 'data'
        ) {
          add('warning', 'frameAncestorsBroad', 'frame-ancestors', tok)
        }
      })

      // ── checagens por diretiva (nível lista) ───────────────────
      const nonNone = d.values.filter((v) => v.toLowerCase() !== "'none'")
      if (d.values.some((v) => v.toLowerCase() === "'none'") && nonNone.length > 0) {
        add('warning', 'noneWithOthers', d.name, d.name)
      }

      if (hasStrictDynamic) {
        const hostSources = d.values.filter((v) => {
          const k = classifyToken(v)
          return k.type === 'host' || k.type === 'wildcard' || k.type === 'scheme'
        })
        if (hostSources.length > 0) add('info', 'strictDynamicHosts', d.name, d.name)
      }
    }

    // ── diretivas ausentes ───────────────────────────────────────
    if (!has('default-src')) add('warning', 'noDefaultSrc', '', '')

    const objFallback = has('object-src') ? 'own' : (has('default-src') ? 'default-src' : 'none')
    if (objFallback === 'none') add('warning', 'missingObjectSrc', '', '')
    else if (objFallback === 'default-src') {
      const dv = get('default-src').values.map((v) => v.toLowerCase())
      if (!dv.includes("'none'")) add('info', 'missingObjectSrcFallback', '', '')
    } else if (!get('object-src').values.some((v) => v.toLowerCase() === "'none'")) {
      add('info', 'objectSrcNotNone', 'object-src', get('object-src').values.join(' '))
    }

    // base-uri / form-action / frame-ancestors NÃO caem no default-src.
    if (!has('base-uri')) add('warning', 'noBaseUri', '', '')
    if (!has('form-action')) add('info', 'noFormAction', '', '')
    if (!has('frame-ancestors') && !isMeta) add('warning', 'noFrameAncestors', '', '')
    if (!has('upgrade-insecure-requests')) add('info', 'noUpgrade', '', '')

    // ── report ───────────────────────────────────────────────────
    const hasReporting = has('report-uri') || has('report-to')
    if (policy.mode === 'report-only' && !hasReporting) {
      add('warning', 'reportOnlyNoReport', '', '')
    } else if (!hasReporting) {
      add('info', 'noReporting', '', '')
    }

    // ── trusted types ────────────────────────────────────────────
    if (has('trusted-types') && !has('require-trusted-types-for')) {
      add('info', 'ttNoRequire', 'trusted-types', '')
    }
    if (has('require-trusted-types-for') && !has('trusted-types')) {
      add('warning', 'ttNoPolicy', 'require-trusted-types-for', '')
    }
    if (has('trusted-types')) {
      for (const v of get('trusted-types').values) {
        if (v === '*' || v.toLowerCase() === 'allow-duplicates') {
          add('warning', 'ttPermissive', 'trusted-types', v)
        }
      }
    }

    // ── sandbox ──────────────────────────────────────────────────
    if (has('sandbox') && get('sandbox').values.length === 0) {
      add('info', 'sandboxEmpty', 'sandbox', '')
    }

    // ── limitações da tag <meta> ─────────────────────────────────
    if (isMeta) {
      add('info', 'metaLimits', '', '')
      for (const name of ['frame-ancestors', 'report-uri', 'sandbox']) {
        if (has(name)) add('warning', 'metaIgnored', name, name)
      }
      for (const d of dirs) {
        if (!SCRIPT_DIRECTIVES.has(d.name) && !['style-src', 'style-src-elem'].includes(d.name)) continue
        if (d.values.some((v) => {
          const k = classifyToken(v)
          return k.type === 'nonce' || k.type === 'hash'
        })) {
          add('warning', 'metaNonce', d.name, d.name)
        }
      }
    }
  })

  // dedupe: mesmo achado (severidade + código + diretiva + contexto)
  // não deve aparecer duas vezes (ex.: token repetido na mesma lista)
  const uniq = []
  const seenKeys = new Set()
  for (const f of findings) {
    const key = `${f.severity}|${f.code}|${f.directive}|${f.ctx}`
    if (seenKeys.has(key)) continue
    seenKeys.add(key)
    uniq.push(f)
  }
  findings.length = 0
  findings.push(...uniq)

  const order = { error: 0, warning: 1, info: 2 }
  findings.sort((a, b) => {
    if (order[a.severity] !== order[b.severity]) return order[a.severity] - order[b.severity]
    if (a.directive !== b.directive) return a.directive.localeCompare(b.directive)
    return a.code.localeCompare(b.code)
  })

  const summary = {
    policies: policies.length,
    directives: directiveTotal,
    sources: sourceTotal,
    errors: findings.filter((f) => f.severity === 'error').length,
    warnings: findings.filter((f) => f.severity === 'warning').length,
    infos: findings.filter((f) => f.severity === 'info').length,
    mode: policies[0] ? policies[0].mode : 'enforced',
    source: policies[0] ? policies[0].source : 'header',
  }

  return { policies, findings, summary }
}

// ─── Tabela "política efetiva" ───────────────────────────────────
//
// Resolve, pra cada diretiva, de onde vêm os valores: da própria
// diretiva, da cadeia de fallback (ex.: worker-src → child-src →
// script-src → default-src) ou de "livre" (sem restrição — inclusive
// pra base-uri/form-action/frame-ancestors, que nunca caem no
// default-src).
export function effectivePolicy(directives) {
  const byName = new Map()
  for (const d of directives) if (!byName.has(d.name)) byName.set(d.name, d)

  return POLICY_TABLE_DIRECTIVES.map((name) => {
    const chain = FALLBACK[name] ?? ['default-src']
    if (byName.has(name)) {
      return {
        name,
        declared: byName.get(name).values,
        origin: 'own',
        originFrom: '',
        effective: byName.get(name).values,
        free: false,
        noFallback: NO_FALLBACK.has(name),
      }
    }
    if (NO_FALLBACK.has(name) || chain.length === 0) {
      return {
        name, declared: null, origin: 'none', originFrom: '',
        effective: [], free: true, noFallback: NO_FALLBACK.has(name),
      }
    }
    for (const fb of chain) {
      if (byName.has(fb)) {
        return {
          name,
          declared: null,
          origin: 'fallback',
          originFrom: fb,
          effective: byName.get(fb).values,
          free: false,
          noFallback: NO_FALLBACK.has(name),
        }
      }
    }
    return {
      name, declared: null, origin: 'none', originFrom: '',
      effective: [], free: true, noFallback: NO_FALLBACK.has(name),
    }
  })
}
