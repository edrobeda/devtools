import React, { useMemo, useState } from 'react'
import { Typography, Card, Space, Input, Button, Alert, Tag, Segmented, Collapse } from 'antd'
import { ApiOutlined, CopyOutlined, CheckOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input

// ─── Exemplos clicáveis ──────────────────────────────────────────────────
const SAMPLES = [
  {
    key: 'post',
    label: { pt: 'POST JSON', en: 'POST JSON' },
    value: `curl -X POST https://api.example.com/users \\
  -H 'Content-Type: application/json' \\
  -d '{"name":"Alice","role":"admin","active":true}'`,
  },
  {
    key: 'get',
    label: { pt: 'GET com query (-G)', en: 'GET with query (-G)' },
    value: `curl -G https://api.example.com/search \\
  -d 'q=devtools' \\
  -d 'page=2' \\
  -H 'Accept: application/json'`,
  },
  {
    key: 'auth',
    label: { pt: 'Basic auth (-u)', en: 'Basic auth (-u)' },
    value: `curl -u admin:secret https://api.example.com/me \\
  -H 'Accept: application/json'`,
  },
  {
    key: 'browser',
    label: { pt: 'Estilo "copy as cURL"', en: '"copy as cURL" style' },
    value: `curl 'https://app.example.com/dashboard' \\
  -H 'accept: application/json' \\
  -b 'session=abc123; theme=dark' \\
  -A 'Mozilla/5.0 (X11; Linux x86_64)' \\
  --compressed`,
  },
  {
    key: 'put',
    label: { pt: 'PUT com corpo', en: 'PUT with body' },
    value: `curl -X PUT 'https://api.example.com/notes/42' \\
  -H 'Content-Type: application/json' \\
  -H 'Authorization: Bearer token123' \\
  -d '{"title":"oi","tags":["a","b"]}'`,
  },
]

// ─── Tokenizer: quebra o comando em palavras respeitando aspas ──────────
// Suporta aspas simples e duplas (com escape `\"`), continuação de linha
// com `\`, e mantém `-d '{"a": 1}'` como tokens únicos.
function tokenize(input) {
  const pre = input.replace(/\\\r?\n/g, ' ')
  const tokens = []
  let cur = ''
  let i = 0
  const chars = pre
  while (i < chars.length) {
    const c = chars[i]
    if (/\s/.test(c)) {
      if (cur) { tokens.push(cur); cur = '' }
      i++
      continue
    }
    if (c === "'") {
      i++
      let buf = ''
      while (i < chars.length && chars[i] !== "'") { buf += chars[i]; i++ }
      i++ // pula a aspa de fechamento (se existir)
      cur += buf
      continue
    }
    if (c === '"') {
      i++
      let buf = ''
      while (i < chars.length && chars[i] !== '"') {
        if (chars[i] === '\\' && i + 1 < chars.length) {
          buf += chars[i + 1]
          i += 2
        } else {
          buf += chars[i]
          i++
        }
      }
      i++ // pula a aspa de fechamento
      cur += buf
      continue
    }
    if (c === '\\' && i + 1 < chars.length) {
      cur += chars[i + 1]
      i += 2
      continue
    }
    cur += c
    i++
  }
  if (cur) tokens.push(cur)
  return tokens
}

// ─── Parser de opções curl → requisição estruturada ──────────────────────
function parseCurl(input) {
  const tokens = tokenize(input)
  const req = {
    method: null,
    methodExplicit: false,
    url: '',
    headers: [],
    data: [],
    user: null,
    cookieText: '',
    userAgent: null,
    referer: null,
    get: false,
    compressed: false,
    insecure: false,
    multipart: false,
  }
  let i = tokens[0] === 'curl' || tokens[0] === 'curl.exe' ? 1 : 0

  while (i < tokens.length) {
    const tok = tokens[i]

    if (tok.startsWith('--')) {
      const eq = tok.indexOf('=')
      let name = tok.slice(2)
      let inlineVal = null
      if (eq !== -1) { name = tok.slice(2, eq); inlineVal = tok.slice(eq + 1) }
      const val = () => (inlineVal != null ? inlineVal : tokens[++i])
      switch (name) {
        case 'request':
          req.method = (val() || 'GET').toUpperCase()
          req.methodExplicit = true
          break
        case 'header': {
          const h = val()
          if (h) req.headers.push(h)
          break
        }
        case 'data':
        case 'data-raw':
        case 'data-binary':
        case 'data-ascii':
        case 'data-urlencode': {
          const d = val()
          if (d != null) req.data.push(d)
          break
        }
        case 'url':
          req.url = val() || ''
          break
        case 'user':
          req.user = val()
          break
        case 'cookie': {
          const c = val()
          if (c) req.cookieText = req.cookieText ? `${req.cookieText}; ${c}` : c
          break
        }
        case 'user-agent':
          req.userAgent = val()
          break
        case 'referer':
        case 'referrer':
          req.referer = val()
          break
        case 'get':
          req.get = true
          break
        case 'compressed':
          req.compressed = true
          break
        case 'insecure':
          req.insecure = true
          break
        // flags de I/O/saída — ignoradas, não afetam a requisição
        default:
          break
      }
      i++
      continue
    }

    if (tok.startsWith('-') && tok.length > 1) {
      const body = tok.slice(1)
      const take = (rest) => (rest ? rest : tokens[++i])
      let j = 0
      for (; j < body.length; j++) {
        const letter = body[j]
        switch (letter) {
          case 'X':
            req.method = (take(body.slice(j + 1)) || 'GET').toUpperCase()
            req.methodExplicit = true
            break
          case 'H': {
            const h = take(body.slice(j + 1))
            if (h) req.headers.push(h)
            break
          }
          case 'd': {
            const d = take(body.slice(j + 1))
            if (d != null) req.data.push(d)
            break
          }
          case 'u':
            req.user = take(body.slice(j + 1))
            break
          case 'b': {
            const c = take(body.slice(j + 1))
            if (c) req.cookieText = req.cookieText ? `${req.cookieText}; ${c}` : c
            break
          }
          case 'A':
            req.userAgent = take(body.slice(j + 1))
            break
          case 'e':
            req.referer = take(body.slice(j + 1))
            break
          case 'F':
            req.multipart = true
            take(body.slice(j + 1)) // consome o valor, não convertemos multipart
            break
          case 'G':
            req.get = true
            break
          case 'k':
            req.insecure = true
            break
          default:
            break
        }
        if ('XHdubAeF'.includes(letter)) break // option com valor consumiu o resto
      }
      i++
      continue
    }

    // argumento posicional: primeira URL ganha
    if (!req.url) req.url = tok
    i++
  }

  return req
}

// ─── Helpers ─────────────────────────────────────────────────────────────
function looksLikeJson(s) {
  if (!s || typeof s !== 'string') return false
  const t = s.trim()
  if (!t.startsWith('{') && !t.startsWith('[')) return false
  try { JSON.parse(t); return true } catch { return false }
}

function headerValue(headers, name) {
  const h = headers.find((x) => x.name.toLowerCase() === name.toLowerCase())
  return h ? h.value : null
}

function splitHeader(h) {
  const idx = h.indexOf(':')
  if (idx === -1) return { name: h.trim(), value: '' }
  return { name: h.slice(0, idx).trim(), value: h.slice(idx + 1).trim() }
}

function base64Utf8(s) {
  const bytes = new TextEncoder().encode(s)
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin)
}

const jsStr = (s) => JSON.stringify(String(s))

function buildHeadersObj(headers, indent) {
  if (!headers.length) return '{}'
  const pad = ' '.repeat(indent)
  const lines = headers.map((h) => `${pad}${jsStr(h.name)}: ${jsStr(h.value)},`)
  return `{\n${lines.join('\n')}\n${' '.repeat(indent - 2)}}`
}

function pyLiteral(v) {
  if (v === null) return 'None'
  if (v === true) return 'True'
  if (v === false) return 'False'
  if (typeof v === 'number') return Number.isFinite(v) ? String(v) : `'${v}'`
  if (typeof v === 'string') return JSON.stringify(v)
  if (Array.isArray(v)) return '[' + v.map(pyLiteral).join(', ') + ']'
  const keys = Object.keys(v)
  return '{' + keys.map((k) => `${JSON.stringify(k)}: ${pyLiteral(v[k])}`).join(', ') + '}'
}

// ─── Normalização: método padrão, query, headers finais, corpo ──────────
function normalize(req) {
  // -d sem -X => curl envia POST por padrão (a menos que -G)
  let method = req.method || 'GET'
  if (!req.methodExplicit && !req.get && req.data.length && method === 'GET') method = 'POST'
  if (req.get && !req.methodExplicit) method = 'GET'

  // query string: -G move os -d para a URL
  let url = req.url
  if (req.get && req.data.length) {
    const usp = new URLSearchParams()
    for (const d of req.data) {
      const eq = d.indexOf('=')
      if (eq === -1) usp.append(d, '')
      else usp.append(d.slice(0, eq), d.slice(eq + 1))
    }
    const qs = usp.toString()
    if (qs) url += (url.includes('?') ? '&' : '?') + qs
  }

  // headers do usuário (preserva ordem, última vence em duplicatas)
  const final = []
  const names = new Set()
  for (const h of req.headers) {
    const { name, value } = splitHeader(h)
    if (!name) continue
    final.push({ name, value })
    names.add(name.toLowerCase())
  }

  // corpo
  let body = null // { kind: 'json', value, raw } | { kind: 'text', raw }
  if (!req.get && req.data.length) {
    const raw = req.data.join('&')
    const ct = headerValue(final, 'content-type') || ''
    if (/json/i.test(ct) || looksLikeJson(raw)) {
      try {
        const parsed = JSON.parse(raw)
        body = { kind: 'json', value: parsed, raw: JSON.stringify(parsed, null, 2) }
        if (!names.has('content-type')) {
          final.push({ name: 'Content-Type', value: 'application/json' })
          names.add('content-type')
        }
      } catch {
        body = { kind: 'text', raw }
      }
    } else {
      body = { kind: 'text', raw }
    }
  }

  if (body && body.kind === 'json' && names.has('content-type')) {
    // garante application/json quando o usuário pôs um content-type parecido mas não exato
    const idx = final.findIndex((h) => h.name.toLowerCase() === 'content-type')
    if (idx !== -1 && !/json/i.test(final[idx].value)) final[idx].value = 'application/json'
  }

  if (req.user && !names.has('authorization')) {
    const parts = String(req.user).split(':')
    const user = parts[0] || ''
    const pass = parts.slice(1).join(':')
    final.push({ name: 'Authorization', value: `Basic ${base64Utf8(`${user}:${pass}`)}` })
    names.add('authorization')
  }
  if (req.cookieText && !names.has('cookie')) {
    final.push({ name: 'Cookie', value: req.cookieText })
    names.add('cookie')
  }
  if (req.userAgent && !names.has('user-agent')) {
    final.push({ name: 'User-Agent', value: req.userAgent })
    names.add('user-agent')
  }
  if (req.referer && !names.has('referer')) {
    final.push({ name: 'Referer', value: req.referer })
    names.add('referer')
  }

  return {
    method,
    url,
    headers: final,
    body,
    user: req.user ? String(req.user).split(/:(.*)/s).filter(Boolean) : null,
    flags: {
      compressed: req.compressed,
      insecure: req.insecure,
      multipart: req.multipart,
    },
  }
}

// ─── Emissores de código ────────────────────────────────────────────────
function buildFetch(r) {
  const lines = []
  lines.push(`fetch(${jsStr(r.url)}, {`)
  lines.push(`  method: ${jsStr(r.method)},`)
  if (r.headers.length) lines.push(`  headers: ${buildHeadersObj(r.headers, 4)},`)
  if (r.body) {
    if (r.body.kind === 'json') lines.push(`  body: JSON.stringify(${r.body.raw.replace(/\n/g, '\n    ')}, null, 2),`)
    else lines.push(`  body: ${jsStr(r.body.raw)},`)
  }
  lines.push('});')
  return lines.join('\n')
}

function buildAxios(r) {
  const lines = []
  lines.push('axios.request({')
  lines.push(`  method: ${jsStr(r.method)},`)
  lines.push(`  url: ${jsStr(r.url)},`)
  if (r.headers.length) lines.push(`  headers: ${buildHeadersObj(r.headers, 4)},`)
  if (r.body) {
    if (r.body.kind === 'json') lines.push(`  data: ${r.body.raw.replace(/\n/g, '\n    ')},`)
    else lines.push(`  data: ${jsStr(r.body.raw)},`)
  }
  lines.push('});')
  return lines.join('\n')
}

function buildPython(r) {
  const lines = []
  lines.push('import requests')
  lines.push('')
  lines.push(`resp = requests.request(`)
  lines.push(`    ${jsStr(r.method)},`)
  lines.push(`    ${jsStr(r.url)},`)
  if (r.headers.length) lines.push(`    headers=${buildHeadersObj(r.headers, 8)},`)
  if (r.user) {
    lines.push(`    auth=${JSON.stringify(r.user)},`)
  }
  if (r.body) {
    if (r.body.kind === 'json') lines.push(`    json=${pyLiteral(r.body.value)},`)
    else lines.push(`    data=${jsStr(r.body.raw)},`)
  }
  lines.push(')')
  lines.push('')
  lines.push('print(resp.status_code)')
  return lines.join('\n')
}

const BUILDERS = { fetch: buildFetch, axios: buildAxios, python: buildPython }

const METHOD_COLOR = {
  GET: 'green', POST: 'blue', PUT: 'orange', PATCH: 'gold',
  DELETE: 'red', HEAD: 'cyan', OPTIONS: 'purple',
}

const SOURCE_SNIPPET = `// cURL → requisição estruturada.
// 1) tokenize() quebra o comando em palavras respeitando aspas simples/duplas
//    e continuação de linha com \\.
// 2) O parser caminha os tokens: '--' e '-' viram opções (com valor inline
//    quando há '=' ou anexado tipo -XPOST), o primeiro argumento posicional
//    é a URL.
// 3) normalize() decide o que vira de verdade na requisição:
//    -d sem -X => POST (curl faz isso); -G move os -d pra query string;
//    corpo que parece JSON chama JSON.parse e é emitido embelezado;
//    -u vira Authorization: Basic base64; -b vira header Cookie.
function convert(curl) {
  const req = parseCurl(curl)          // { method, url, headers, data, ... }
  const r = normalize(req)             // método padrão + query + headers finais
  return buildFetch(r)                 // ou buildAxios(r) / buildPython(r)
}`

const translations = {
  pt: {
    title: 'cURL → Código',
    intro: (
      <>
        Cola um comando <Text code>curl</Text> — vindo do “copy as cURL” do
        browser, de uma doc, de um log — e gera o equivalente em{' '}
        <Text code>fetch</Text> (JS), <Text code>axios</Text> (JS) ou{' '}
        <Text code>requests</Text> (Python). O parser reconhece{' '}
        <Text code>-X/--request</Text>, <Text code>-H</Text>,{' '}
        <Text code>-d/--data</Text> (JSON detectado e embelezado),{' '}
        <Text code>-G</Text> de query string, <Text code>-u</Text> basic auth,{' '}
        <Text code>-b</Text> de cookies, <Text code>-A</Text>,{' '}
        <Text code>--compressed</Text> e <Text code>-k</Text>. Nada sai do
        navegador.
      </>
    ),
    input: 'Comando curl',
    sampleLabel: 'Exemplos:',
    placeholder: 'curl -X POST https://api.example.com/users ...',
    target: 'Gerar código para:',
    resultTitle: 'Código gerado',
    emptyHint: 'Cole um comando curl acima pra gerar o código.',
    noUrl: 'Não encontrei uma URL no comando — confira se você colou o comando inteiro.',
    copy: 'Copiar',
    copied: 'Copiado!',
    method: 'Método',
    headersCount: (n) => `${n} ${n === 1 ? 'header' : 'headers'}`,
    bodyKind: {
      json: 'corpo JSON',
      text: 'corpo texto',
      none: 'sem corpo',
      query: 'query string',
    },
    flagsLabel: 'Flags reconhecidas:',
    compressed: '--compressed',
    insecure: '-k (inseguro)',
    multipart: '-F (multipart)',
    alertTitle: 'O que o parser entende (e o que ele ignora)',
    alertBody: (
      <>
        Entende <Text code>-X</Text>, <Text code>-H</Text>,{' '}
        <Text code>-d/--data/--data-raw/--data-binary/--data-urlencode</Text>,{' '}
        <Text code>-G</Text> (dados viram query string), <Text code>-u</Text>{' '}
        <Text code>user:pass</Text> (vira <Text code>Authorization: Basic</Text>),{' '}
        <Text code>-b</Text>/<Text code>--cookie</Text>, <Text code>-A</Text>,{' '}
        <Text code>-e</Text>. Ignora flags de I/O e transporte ({' '}
        <Text code>-s</Text>, <Text code>-L</Text>, <Text code>-o</Text>,{' '}
        <Text code>--max-time</Text>, <Text code>-v</Text>…). Dois avisos
        importantes: <Text code>--compressed</Text> e <Text code>-k</Text> são{' '}
        <em>apenas sinalizados</em>, não recriados no código (o{' '}
        <Text code>fetch</Text> do browser descomprime e ignora TLS sozinho;
        no Python você precisaria de <Text code>verify=False</Text>), e{' '}
        <Text code>-F</Text> (multipart) não é convertido — o valor é consumido
        e ignorado. Múltiplos <Text code>-d</Text> são unidos com{' '}
        <Text code>&</Text>, como o curl faz.
      </>
    ),
    algoTitle: 'Como funciona (algoritmo)',
    algoDesc:
      'Tokenizer respeitando aspas + parser de opções curtas/longas + normalização do método/query/headers + um emissor por alvo. O corpo que casa JSON.parse é emitido como objeto embelezado (JSON.stringify no fetch, literal em axios/python).',
  },
  en: {
    title: 'cURL → Code',
    intro: (
      <>
        Paste a <Text code>curl</Text> command — from the browser's “copy as
        cURL”, a doc or a log — and get the equivalent as{' '}
        <Text code>fetch</Text> (JS), <Text code>axios</Text> (JS) or{' '}
        <Text code>requests</Text> (Python). The parser understands{' '}
        <Text code>-X/--request</Text>, <Text code>-H</Text>,{' '}
        <Text code>-d/--data</Text> (JSON detected and pretty-printed),{' '}
        <Text code>-G</Text> query strings, <Text code>-u</Text> basic auth,{' '}
        <Text code>-b</Text> cookies, <Text code>-A</Text>,{' '}
        <Text code>--compressed</Text> and <Text code>-k</Text>. Nothing
        leaves the browser.
      </>
    ),
    input: 'curl command',
    sampleLabel: 'Samples:',
    placeholder: 'curl -X POST https://api.example.com/users ...',
    target: 'Generate code for:',
    resultTitle: 'Generated code',
    emptyHint: 'Paste a curl command above to generate code.',
    noUrl: 'No URL found in the command — check that you pasted the whole command.',
    copy: 'Copy',
    copied: 'Copied!',
    method: 'Method',
    headersCount: (n) => `${n} ${n === 1 ? 'header' : 'headers'}`,
    bodyKind: {
      json: 'JSON body',
      text: 'text body',
      none: 'no body',
      query: 'query string',
    },
    flagsLabel: 'Detected flags:',
    compressed: '--compressed',
    insecure: '-k (insecure)',
    multipart: '-F (multipart)',
    alertTitle: 'What the parser understands (and ignores)',
    alertBody: (
      <>
        Understands <Text code>-X</Text>, <Text code>-H</Text>,{' '}
        <Text code>-d/--data/--data-raw/--data-binary/--data-urlencode</Text>,{' '}
        <Text code>-G</Text> (data becomes query string), <Text code>-u</Text>{' '}
        <Text code>user:pass</Text> (becomes <Text code>Authorization: Basic</Text>),{' '}
        <Text code>-b</Text>/<Text code>--cookie</Text>, <Text code>-A</Text>,{' '}
        <Text code>-e</Text>. Ignores I/O and transport flags ({' '}
        <Text code>-s</Text>, <Text code>-L</Text>, <Text code>-o</Text>,{' '}
        <Text code>--max-time</Text>, <Text code>-v</Text>…). Two important
        notes: <Text code>--compressed</Text> and <Text code>-k</Text> are{' '}
        <em>only flagged</em>, not recreated in the code (browser{' '}
        <Text code>fetch</Text> decompresses and skips TLS checks on its own;
        in Python you would need <Text code>verify=False</Text>), and{' '}
        <Text code>-F</Text> (multipart) is not converted — its value is
        consumed and ignored. Multiple <Text code>-d</Text> are joined with{' '}
        <Text code>&</Text>, as curl does.
      </>
    ),
    algoTitle: 'How it works (algorithm)',
    algoDesc:
      'Quote-aware tokenizer + short/long option parser + normalization of method/query/headers + one emitter per target. Body that passes JSON.parse is emitted as a pretty object (JSON.stringify in fetch, a literal in axios/python).',
  },
}

export default function CurlToCodePage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [input, setInput] = useState(SAMPLES[0].value)
  const [target, setTarget] = useState('fetch')
  const [copied, setCopied] = useState(false)

  const parsed = useMemo(() => {
    if (!input.trim()) return { ok: false, reason: 'empty' }
    const req = parseCurl(input)
    if (!req.url) return { ok: false, reason: 'nourl' }
    return { ok: true, req: normalize(req) }
  }, [input])

  const output = useMemo(() => {
    if (!parsed.ok) return ''
    return BUILDERS[target](parsed.req)
  }, [parsed, target])

  const bodyKind = useMemo(() => {
    if (!parsed.ok) return 'none'
    const { req } = parsed
    if (req.body) return req.body.kind
    if (req.url.includes('?')) return 'query'
    return 'none'
  }, [parsed])

  async function handleCopy() {
    if (!output) return
    try {
      await navigator.clipboard.writeText(output)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><ApiOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card title={t.input}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Space wrap>
            <Text type="secondary">{t.sampleLabel}</Text>
            {SAMPLES.map((s) => (
              <Tag
                key={s.key}
                color="blue"
                style={{ cursor: 'pointer' }}
                onClick={() => setInput(s.value)}
              >
                {s.label[lang]}
              </Tag>
            ))}
          </Space>
          <TextArea
            rows={7}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t.placeholder}
            spellCheck={false}
            style={{ fontFamily: 'monospace', fontSize: 13 }}
          />
        </Space>
      </Card>

      {parsed.ok ? (
        <>
          <Card size="small">
            <Space wrap size={8}>
              <Tag color={METHOD_COLOR[parsed.req.method] || 'default'} style={{ fontWeight: 600 }}>
                {parsed.req.method}
              </Tag>
              <Text code style={{ fontSize: 12 }}>{parsed.req.url}</Text>
              <Tag>{t.headersCount(parsed.req.headers.length)}</Tag>
              <Tag color={bodyKind === 'json' ? 'geekblue' : bodyKind === 'query' ? 'cyan' : 'default'}>
                {t.bodyKind[bodyKind]}
              </Tag>
              {[
                ['compressed', t.compressed],
                ['insecure', t.insecure],
                ['multipart', t.multipart],
              ]
                .filter(([flag]) => parsed.req.flags[flag])
                .map(([, label]) => (
                  <Tag key={label} color="volcano">{label}</Tag>
                ))}
            </Space>
          </Card>

          <Card
            title={
              <Space size={12}>
                <span>{t.resultTitle}</span>
                <Segmented
                  value={target}
                  onChange={setTarget}
                  options={[
                    { label: 'fetch', value: 'fetch' },
                    { label: 'axios', value: 'axios' },
                    { label: 'requests', value: 'python' },
                  ]}
                />
              </Space>
            }
            extra={
              <Button
                type="primary"
                size="small"
                icon={copied ? <CheckOutlined /> : <CopyOutlined />}
                onClick={handleCopy}
              >
                {copied ? t.copied : t.copy}
              </Button>
            }
          >
            <pre style={{ margin: 0, overflowX: 'auto', fontFamily: 'monospace', fontSize: 13 }}>
              <code>{output}</code>
            </pre>
          </Card>
        </>
      ) : (
        <Alert
          type={parsed.reason === 'empty' ? 'info' : 'error'}
          showIcon
          message={parsed.reason === 'empty' ? t.emptyHint : t.noUrl}
        />
      )}

      <Alert type="info" showIcon message={t.alertTitle} description={t.alertBody} />

      <Card title={t.algoTitle}>
        <Paragraph type="secondary">{t.algoDesc}</Paragraph>
        <Collapse
          items={[
            {
              key: 'src',
              label: <Text code>tokenize + parseCurl + normalize + emiters</Text>,
              children: (
                <pre style={{ margin: 0, overflowX: 'auto', fontSize: 12, lineHeight: 1.6 }}>{SOURCE_SNIPPET}</pre>
              ),
            },
          ]}
        />
      </Card>
    </Space>
  )
}