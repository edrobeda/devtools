import React, { useMemo, useState } from 'react'
import {
  Typography, Card, Space, Input, Button, Select, Switch, Alert, Collapse,
  Segmented, Tabs, Tag, Empty, message,
} from 'antd'
import {
  CopyOutlined, CheckOutlined, PartitionOutlined, PlusOutlined,
  DeleteOutlined, ApartmentOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input

let nextId = 0
const uid = () => ++nextId

// ─── Catálogo de middlewares do Traefik v3 ──────────────────────────────────
// Cada tipo declara os campos que faz sentido pra ele. `dv` (default value)
// é o valor inicial do parâmetro; `ph` é só o placeholder do input.
// Chaves dos campos batem com as opções reais do middleware no YAML (file
// provider). Nos labels Docker tudo vira minúsculo — o parser de label do
// Traefik normaliza cada trecho do caminho, então `usersFile` → `usersfile`.
const MW_TYPES = [
  {
    value: 'redirectScheme',
    pt: 'Redirecionar esquema (HTTP → HTTPS)',
    en: 'Redirect scheme (HTTP → HTTPS)',
    fields: [
      { k: 'scheme', pt: 'Esquema de destino', en: 'Target scheme', dv: 'https', ph: 'https' },
      { k: 'permanent', pt: 'Redirecionamento permanente (308 em vez de 302)', en: 'Permanent redirect (308 instead of 302)', kind: 'bool', dv: true },
    ],
  },
  {
    value: 'stripPrefix',
    pt: 'Remover prefixo do caminho',
    en: 'Strip path prefix',
    fields: [{ k: 'prefixes', pt: 'Prefixos (separados por vírgula)', en: 'Prefixes (comma-separated)', dv: '/api', ph: '/api, /v1' }],
  },
  {
    value: 'stripPrefixRegex',
    pt: 'Remover prefixo por regex',
    en: 'Strip prefix by regex',
    fields: [{ k: 'regex', pt: 'Regex', dv: '^/api/v[0-9]+', ph: '^/api/v[0-9]+' }],
  },
  {
    value: 'addPrefix',
    pt: 'Adicionar prefixo ao caminho',
    en: 'Add path prefix',
    fields: [{ k: 'prefix', pt: 'Prefixo', dv: '/backend', ph: '/backend' }],
  },
  {
    value: 'replacePathRegex',
    pt: 'Substituir caminho por regex',
    en: 'Replace path by regex',
    fields: [
      { k: 'regex', pt: 'Regex', dv: '^/api/(.*)', ph: '^/api/(.*)' },
      { k: 'replacement', pt: 'Substituição', dv: '/v2/$1', ph: '/v2/$1' },
    ],
  },
  {
    value: 'customRequestHeaders',
    pt: 'Injetar headers no request',
    en: 'Inject request headers',
    fields: [{ k: 'headers', pt: 'Headers (um por linha, nome: valor)', en: 'Headers (one per line, name: value)', kind: 'area', dv: 'X-Source: traefik', ph: 'X-Source: traefik\nX-Env: prod' }],
  },
  {
    value: 'customResponseHeaders',
    pt: 'Injetar headers na resposta',
    en: 'Inject response headers',
    fields: [{ k: 'headers', pt: 'Headers (um por linha, nome: valor)', en: 'Headers (one per line, name: value)', kind: 'area', dv: 'X-Frame-Options: DENY', ph: 'X-Frame-Options: DENY\nReferrer-Policy: strict-origin-when-cross-origin' }],
  },
  {
    value: 'basicAuth',
    pt: 'Autenticação basic (htpasswd)',
    en: 'Basic auth (htpasswd)',
    fields: [
      { k: 'usersFile', pt: 'Caminho do arquivo', en: 'File path', dv: '/etc/traefik/.htpasswd', ph: '/etc/traefik/.htpasswd' },
      { k: 'realm', pt: 'Realm (opcional)', en: 'Realm (optional)', dv: 'Restricted', ph: 'Restricted' },
    ],
  },
  {
    value: 'digestAuth',
    pt: 'Autenticação digest (htpasswd)',
    en: 'Digest auth (htpasswd)',
    fields: [
      { k: 'usersFile', pt: 'Caminho do arquivo', en: 'File path', dv: '/etc/traefik/.htpasswd', ph: '/etc/traefik/.htpasswd' },
      { k: 'realm', pt: 'Realm (opcional)', en: 'Realm (optional)', dv: 'Restricted', ph: 'Restricted' },
    ],
  },
  {
    value: 'forwardAuth',
    pt: 'Autenticação delegada (forwardAuth)',
    en: 'Delegated auth (forwardAuth)',
    fields: [
      { k: 'address', pt: 'URL do serviço de auth', en: 'Auth service URL', dv: 'http://auth:8080/verify?rd=https://auth.example.com', ph: 'http://auth:8080/verify?rd=https://auth.example.com' },
      { k: 'trustForwardHeader', pt: 'Header com o usuário (opcional)', en: 'User header (optional)', dv: 'X-Forwarded-User', ph: 'X-Forwarded-User' },
    ],
  },
  {
    value: 'ipWhiteList',
    pt: 'Allowlist de IP',
    en: 'IP allowlist',
    fields: [{ k: 'sourceRange', pt: 'Redes CIDR (separadas por vírgula)', en: 'CIDR ranges (comma-separated)', dv: '10.0.0.0/8, 192.168.1.0/24', ph: '10.0.0.0/8, 192.168.1.0/24' }],
  },
  {
    value: 'rateLimit',
    pt: 'Rate limit',
    en: 'Rate limit',
    fields: [
      { k: 'average', pt: 'Média de requisições', en: 'Average requests', dv: '100' },
      { k: 'burst', pt: 'Burst', en: 'Burst', dv: '50' },
      { k: 'period', pt: 'Período', en: 'Period', dv: '1m', ph: '1m, 10s, 250ms' },
    ],
  },
  {
    value: 'retry',
    pt: 'Retry (reenvia pro próximo servidor)',
    en: 'Retry (resend to the next server)',
    fields: [{ k: 'attempts', pt: 'Tentativas', en: 'Attempts', dv: '3' }],
  },
  {
    value: 'circuitBreaker',
    pt: 'Circuit breaker',
    en: 'Circuit breaker',
    fields: [
      { k: 'expression', pt: 'Expressão (uma por linha)', en: 'Expression (one per line)', kind: 'area', dv: 'NetworkRatioRatio(http.request.duration, 0.3, 0.5, 0.9)\n> 0.5', ph: 'NetworkRatioRatio(http.request.duration, 0.3, 0.5, 0.9)\n> 0.5' },
      { k: 'maxRequests', pt: 'Máx. requisições em half-open', en: 'Max requests in half-open', dv: '10' },
      { k: 'retryInterval', pt: 'Intervalo de retentativa', en: 'Retry interval', dv: '10s', ph: '10s' },
    ],
  },
  {
    value: 'buffering',
    pt: 'Buffering',
    en: 'Buffering',
    fields: [
      { k: 'maxRequestBodyBytes', pt: 'Máx. body de request (bytes)', en: 'Max request body (bytes)', dv: '10485760' },
      { k: 'maxResponseBodyBytes', pt: 'Máx. body de response (bytes)', en: 'Max response body (bytes)', dv: '10485760' },
      { k: 'retryAfter', pt: 'Retry after', en: 'Retry after', dv: '1s', ph: '1s' },
    ],
  },
  {
    value: 'compress',
    pt: 'Compressão (gzip)',
    en: 'Compression (gzip)',
    fields: [],
  },
  {
    value: 'errorPages',
    pt: 'Páginas de erro customizadas',
    en: 'Custom error pages',
    fields: [
      { k: 'status', pt: 'Status (faixas separadas por vírgula)', en: 'Status (comma-separated ranges)', dv: '400-599', ph: '404, 500-599' },
      { k: 'query', pt: 'Query da requisição ao serviço', en: 'Query sent to the service', dv: '/errors.html', ph: '/errors.html' },
      { k: 'service', pt: 'Serviço de erro', en: 'Error service', dv: 'erros', ph: 'erros' },
    ],
  },
]

const mwDef = (type) => MW_TYPES.find((d) => d.value === type) || MW_TYPES[0]

function defaultParams(type) {
  const out = {}
  mwDef(type).fields.forEach((f) => {
    out[f.k] = f.kind === 'bool' ? true : String(f.dv == null ? '' : f.dv)
  })
  return out
}

// ─── Helpers de texto / YAML ────────────────────────────────────────────────
const q = (v) => JSON.stringify(String(v == null ? '' : v))

function numOr(v, d) {
  const s = String(v == null ? '' : v).trim()
  return /^-?\d+$/.test(s) ? s : d
}

function csv(v) {
  return String(v == null ? '' : v)
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean)
}

function nonEmptyLines(v) {
  return String(v == null ? '' : v)
    .split('\n')
    .map((x) => x.trim())
    .filter(Boolean)
}

function headerPairs(v) {
  const out = []
  nonEmptyLines(v).forEach((line) => {
    const i = line.indexOf(':')
    if (i <= 0) return
    const key = line.slice(0, i).trim()
    const val = line.slice(i + 1).trim()
    if (key) out.push([key, val])
  })
  return out
}

const flowList = (arr) => '[' + arr.map((x) => q(x)).join(', ') + ']'

function parseUrl(u) {
  const raw = String(u == null ? '' : u).trim()
  if (!raw) return { ok: false, scheme: '', host: '', port: '' }
  try {
    const parsed = new URL(raw)
    return { ok: true, scheme: parsed.protocol.replace(':', ''), host: parsed.hostname, port: parsed.port }
  } catch {
    return { ok: false, scheme: '', host: '', port: '' }
  }
}

// ─── Configuração estática (traefik.yml) ────────────────────────────────────
function buildStaticYAML(s) {
  const out = []
  const p = (n, str) => out.push('  '.repeat(n) + str)
  const c = (txt) => out.push('# ' + txt)

  c('traefik.yml — configuração estática (v3), monte com --configFile=traefik.yml')
  p(0, 'global:')
  p(1, 'checkNewVersion: true')
  p(1, 'sendAnonymousUsage: false')
  out.push('')
  p(0, 'log:')
  p(1, 'level: ' + q(s.logLevel))
  if (s.accessLog) {
    out.push('')
    p(0, 'accessLog:')
    p(1, 'format: json')
    p(1, 'filters:')
    p(2, 'statusCodes: ' + flowList(csv(s.accessLogStatus)))
  }
  if (s.dashboard) {
    out.push('')
    p(0, 'api:')
    p(1, 'dashboard: true')
  }
  out.push('')
  p(0, 'ping:')
  p(1, 'entryPoint: traefik')
  out.push('')
  p(0, 'entryPoints:')
  p(1, 'web:')
  p(2, 'address: ' + q(':' + s.httpPort))
  p(1, 'websecure:')
  p(2, 'address: ' + q(':' + s.httpsPort))
  p(2, 'http:')
  p(3, 'tls:')
  p(4, 'certResolver: letsencrypt')
  p(1, 'traefik:')
  p(2, 'address: ' + q(':' + s.adminPort))
  out.push('')
  p(0, 'providers:')
  if (s.provider === 'docker' || s.provider === 'both') {
    p(1, 'docker:')
    p(2, 'endpoint: ' + q('unix:///var/run/docker.sock'))
    p(2, 'network: ' + q(s.dockerNetwork || 'traefik'))
    p(2, 'exposedByDefault: ' + String(Boolean(s.exposedByDefault)))
    p(2, 'watch: true')
  }
  if (s.provider === 'file' || s.provider === 'both') {
    p(1, 'file:')
    p(2, 'directory: ' + q('/etc/traefik/dynamic'))
    p(2, 'watch: true')
  }
  if (s.provider === 'kubernetesCRD') {
    p(1, 'kubernetesCRD:')
    p(2, 'endpoint: ' + q('https://kubernetes.default.svc'))
    p(2, 'watch: true')
  }
  out.push('')
  c('ACME — o acme.json é criado pelo Traefik e precisa ficar com permissão 600')
  p(0, 'certificatesResolvers:')
  p(1, 'letsencrypt:')
  p(2, 'acme:')
  p(3, 'email: ' + q(s.acmeEmail))
  p(3, 'storage: ' + q(s.acmeStorage))
  if (s.acmeChallenge === 'tls') {
    p(3, 'tlsChallenge: true')
  } else {
    p(3, 'httpChallenge:')
    p(4, 'entryPoint: web')
  }
  return out.join('\n')
}

// ─── Configuração dinâmica (dynamic.yml — file provider) ───────────────────
function buildDynamicYAML(s) {
  if (!s.routers.length && !s.services.length && !s.middlewares.length) return ''
  const out = []
  const p = (n, str) => out.push('  '.repeat(n) + str)

  out.push('# dynamic.yml — configuração dinâmica (file provider), recarrega sem restart')
  p(0, 'http:')

  if (s.routers.length) {
    p(1, 'routers:')
    s.routers.forEach((r) => {
      p(2, r.name + ':')
      p(3, 'rule: ' + q(r.rule))
      p(3, 'entryPoints: ' + flowList(r.entryPoints))
      p(3, 'service: ' + q(r.service))
      if (r.middlewares.length) p(3, 'middlewares: ' + flowList(r.middlewares))
      if (r.tls) p(3, 'tls: {}')
    })
  }

  if (s.services.length) {
    if (out.length > 2) out.push('')
    p(1, 'services:')
    s.services.forEach((svc) => {
      p(2, svc.name + ':')
      p(3, 'loadBalancer:')
      // a lista de servers precisa ser mais indentada que as chaves irmãs de
      // loadBalancer — no mesmo nível o YAML não parseia (sequence vs map).
      p(4, 'servers:')
      nonEmptyLines(svc.servers).forEach((url) => p(5, '- url: ' + q(url)))
      if (svc.strategy) p(4, 'strategy: ' + svc.strategy)
      if (svc.hc) {
        p(4, 'healthCheck:')
        p(5, 'path: ' + q(svc.hcPath))
        p(5, 'interval: ' + q(svc.hcInterval))
      }
      if (svc.sticky) {
        p(4, 'sticky:')
        p(5, 'cookie: {}')
      }
      if (svc.retry) {
        p(4, 'retry:')
        p(5, 'attempts: ' + numOr(svc.retryAttempts, '3'))
      }
    })
  }

  if (s.middlewares.length) {
    if (out.length > 2) out.push('')
    p(1, 'middlewares:')
    s.middlewares.forEach((mw) => {
      const v = mw.params || {}
      // compress não tem sub-opções: é só um mapa vazio no YAML
      if (mw.type === 'compress') {
        p(2, mw.name + ': {}')
        return
      }
      p(2, mw.name + ':')
      p(3, mw.type + ':')
      switch (mw.type) {
        case 'redirectScheme':
          p(4, 'scheme: ' + (v.scheme === 'http' ? 'http' : 'https'))
          if (v.permanent) p(4, 'permanent: true')
          break
        case 'stripPrefix':
          p(4, 'prefixes:')
          csv(v.prefixes).forEach((x) => p(5, '- ' + q(x)))
          break
        case 'stripPrefixRegex':
          p(4, 'regex: ' + q(v.regex))
          break
        case 'addPrefix':
          p(4, 'prefix: ' + q(v.prefix))
          break
        case 'replacePathRegex':
          p(4, 'regex: ' + q(v.regex))
          p(4, 'replacement: ' + q(v.replacement))
          break
        case 'customRequestHeaders':
        case 'customResponseHeaders':
          p(4, 'headers:')
          headerPairs(v.headers).forEach(([k, val]) => p(5, q(k) + ': ' + q(val)))
          break
        case 'basicAuth':
        case 'digestAuth':
          p(4, 'usersFile: ' + q(v.usersFile))
          if (v.realm) p(4, 'realm: ' + q(v.realm))
          break
        case 'forwardAuth':
          p(4, 'address: ' + q(v.address))
          if (v.trustForwardHeader) p(4, 'trustForwardHeader: ' + q(v.trustForwardHeader))
          break
        case 'ipWhiteList':
          p(4, 'sourceRange:')
          csv(v.sourceRange).forEach((x) => p(5, '- ' + q(x)))
          break
        case 'rateLimit':
          p(4, 'average: ' + numOr(v.average, '100'))
          p(4, 'burst: ' + numOr(v.burst, '50'))
          p(4, 'period: ' + q(v.period))
          break
        case 'retry':
          p(4, 'attempts: ' + numOr(v.attempts, '3'))
          break
        case 'circuitBreaker': {
          const expr = nonEmptyLines(v.expression)
          if (expr.length) {
            p(4, 'expression: |')
            expr.forEach((line) => p(5, line))
          } else {
            p(4, 'expression: ' + q(''))
          }
          p(4, 'maxRequests: ' + numOr(v.maxRequests, '10'))
          if (v.retryInterval) p(4, 'retryInterval: ' + q(v.retryInterval))
          break
        }
        case 'buffering':
          p(4, 'maxRequestBodyBytes: ' + numOr(v.maxRequestBodyBytes, '10485760'))
          p(4, 'maxResponseBodyBytes: ' + numOr(v.maxResponseBodyBytes, '10485760'))
          if (v.retryAfter) p(4, 'retryAfter: ' + q(v.retryAfter))
          break
        case 'errorPages':
          p(4, 'status: ' + flowList(csv(v.status)))
          p(4, 'query: ' + q(v.query))
          p(4, 'service: ' + q(v.service))
          break
        default:
          break
      }
    })
  }

  return out.join('\n')
}

// ─── Configuração dinâmica em labels Docker ─────────────────────────────────
// Regra real do Traefik: no docker provider o serviço só declara a PORTA — o
// host é o próprio container. Então os routers do serviço são emitidos no
// bloco do serviço correspondente, junto dos middlewares que ele referencia.
function buildDockerLabels(s) {
  const out = []
  const p = (str) => out.push(str)
  p('# Labels Docker — cole no serviço correspondente do seu docker-compose.yml.')
  p('# Só a porta é usada: o host vem do próprio container na rede do Compose.')

  const mwLabels = (mw) => {
    const base = 'traefik.http.middlewares.' + mw.name + '.' + mw.type.toLowerCase() + '.'
    const v = mw.params || {}
    const acc = []
    const add = (k, val) => acc.push(q(base + k.toLowerCase() + '=' + val))
    switch (mw.type) {
      case 'redirectScheme':
        add('scheme', v.scheme === 'http' ? 'http' : 'https')
        if (v.permanent) add('permanent', 'true')
        break
      case 'stripPrefix':
        add('prefixes', csv(v.prefixes).join(','))
        break
      case 'stripPrefixRegex':
        add('regex', v.regex)
        break
      case 'addPrefix':
        add('prefix', v.prefix)
        break
      case 'replacePathRegex':
        add('regex', v.regex)
        add('replacement', v.replacement)
        break
      case 'customRequestHeaders':
      case 'customResponseHeaders':
        headerPairs(v.headers).forEach(([k, val]) => acc.push(q(base + 'headers.' + k + '=' + val)))
        break
      case 'basicAuth':
      case 'digestAuth':
        add('usersFile', v.usersFile)
        if (v.realm) add('realm', v.realm)
        break
      case 'forwardAuth':
        add('address', v.address)
        if (v.trustForwardHeader) add('trustForwardHeader', v.trustForwardHeader)
        break
      case 'ipWhiteList':
        add('sourceRange', csv(v.sourceRange).join(','))
        break
      case 'rateLimit':
        add('average', v.average)
        add('burst', v.burst)
        add('period', v.period)
        break
      case 'retry':
        add('attempts', v.attempts)
        break
      case 'circuitBreaker':
        add('expression', nonEmptyLines(v.expression).join(' '))
        add('maxRequests', v.maxRequests)
        if (v.retryInterval) add('retryInterval', v.retryInterval)
        break
      case 'buffering':
        add('maxRequestBodyBytes', v.maxRequestBodyBytes)
        add('maxResponseBodyBytes', v.maxResponseBodyBytes)
        if (v.retryAfter) add('retryAfter', v.retryAfter)
        break
      case 'compress':
        acc.push(q('traefik.http.middlewares.' + mw.name + '.compress=true'))
        break
      case 'errorPages':
        add('status', csv(v.status).join(','))
        add('query', v.query)
        add('service', v.service)
        break
      default:
        break
    }
    return acc
  }

  s.services.forEach((svc) => {
    const urls = nonEmptyLines(svc.servers)
    const first = parseUrl(urls[0])
    p('')
    p('  ' + svc.name + ':')
    p('    image: seu-registry/' + svc.name + ':latest')
    p('    labels:')
    p('      - ' + q('traefik.enable=true'))
    const svcBase = 'traefik.http.services.' + svc.name + '.loadbalancer.'
    if (first.port) p('      - ' + q(svcBase + 'server.port=' + first.port))
    if (first.scheme) p('      - ' + q(svcBase + 'server.scheme=' + first.scheme))
    if (svc.strategy) p('      - ' + q(svcBase + 'strategy=' + svc.strategy))
    if (svc.hc) {
      p('      - ' + q(svcBase + 'healthcheck.path=' + svc.hcPath))
      p('      - ' + q(svcBase + 'healthcheck.interval=' + svc.hcInterval))
    }
    if (svc.sticky) p('      - ' + q(svcBase + 'sticky.cookie=true'))
    if (svc.retry) p('      - ' + q(svcBase + 'retry.attempts=' + numOr(svc.retryAttempts, '3')))

    const routers = s.routers.filter((r) => r.service === svc.name)
    routers.forEach((r) => {
      const base = 'traefik.http.routers.' + r.name + '.'
      p('      - ' + q(base + 'rule=' + r.rule))
      p('      - ' + q(base + 'entrypoints=' + r.entryPoints.join(',')))
      p('      - ' + q(base + 'service=' + svc.name))
      if (r.middlewares.length) {
        p('      - ' + q(base + 'middlewares=' + r.middlewares.map((m) => m + '@docker').join(',')))
      }
      if (r.tls) p('      - ' + q(base + 'tls=true'))
    })

    const names = new Set()
    routers.forEach((r) => r.middlewares.forEach((m) => names.add(m)))
    s.middlewares.filter((mw) => names.has(mw.name)).forEach((mw) => {
      mwLabels(mw).forEach((line) => p('      - ' + line))
    })
  })

  const orphan = s.routers.filter((r) => !s.services.some((svc) => svc.name === r.service))
  if (orphan.length) {
    p('')
    p('# Roteadores sem serviço correspondente: ' + orphan.map((r) => r.name).join(', '))
  }

  return out.join('\n')
}

// ─── Validação ──────────────────────────────────────────────────────────────
function validate(s) {
  const errs = []
  const warns = []

  const svcNames = new Set(s.services.map((x) => x.name))
  const mwNames = new Set(s.middlewares.map((x) => x.name))
  const usedMw = new Set()
  const dup = (arr) => new Set(arr).size !== arr.length

  if (!s.routers.length) errs.push('noRouters')
  if (!s.services.length) errs.push('noServices')
  if (dup(s.services.map((x) => x.name))) errs.push('svcDupName')

  s.services.forEach((svc) => {
    if (!svc.name.trim()) errs.push('svcNoName')
    if (!nonEmptyLines(svc.servers).length) errs.push('svcNoServer')
    nonEmptyLines(svc.servers).forEach((url) => {
      const parsed = parseUrl(url)
      if (!parsed.ok) errs.push('svcBadUrl')
      else if (!parsed.port && s.outMode === 'docker') warns.push('svcNoPort')
    })
    if (s.outMode === 'docker' && nonEmptyLines(svc.servers).length > 1) warns.push('dockerMultiServer')
  })

  s.middlewares.forEach((mw) => {
    if (!mw.name.trim()) errs.push('mwNoName')
    if (/\s|\./.test(mw.name)) errs.push('mwBadName')
    if (mw.type === 'basicAuth' || mw.type === 'digestAuth') {
      if (!String(mw.params.usersFile || '').trim()) errs.push('mwNoUsersFile')
    }
    if (mw.type === 'forwardAuth' && !String(mw.params.address || '').trim()) errs.push('mwNoAuthAddress')
  })

  const seenRules = new Map()
  s.routers.forEach((r) => {
    if (!r.rule.trim()) errs.push('routerNoRule')
    if (!r.name.trim()) errs.push('routerNoName')
    if (!r.entryPoints.length) errs.push('routerNoEntryPoint')
    if (!svcNames.has(r.service)) errs.push('routerBadService')
    r.middlewares.forEach((m) => {
      usedMw.add(m)
      if (!mwNames.has(m)) errs.push('routerBadMiddleware')
    })
    // Empate de tamanho só é problema quando os dois routers disputam o mesmo
    // entryPoint — a mesma rule em :80 e :443 (redirect + tls) é o padrão.
    const len = r.rule.trim().length
    const scope = r.entryPoints.slice().sort().join('|')
    if (r.rule.trim() && seenRules.has(scope + ':' + len)) warns.push('priorityTie')
    seenRules.set(scope + ':' + len, r.name)
    if (r.tls && r.entryPoints.length && !r.entryPoints.includes('websecure')) warns.push('tlsNotWebsecure')
    if (r.tls && !String(s.acmeEmail || '').includes('@')) warns.push('noAcmeEmail')
  })

  s.middlewares.forEach((mw) => {
    if (mw.name && !usedMw.has(mw.name)) warns.push('mwUnused')
  })

  if (s.provider === 'file' && s.outMode !== 'file') warns.push('fileProviderNoDynamic')
  if (s.outMode === 'file' && s.provider === 'docker') warns.push('dockerProviderIgnored')

  return Array.from(new Set(errs)).concat(Array.from(new Set(warns)))
}

// ─── Presets ────────────────────────────────────────────────────────────────
const mkRouter = (o) => ({ id: uid(), name: '', rule: '', entryPoints: ['websecure'], service: '', middlewares: [], tls: true, ...o })
const mkService = (o) => ({ id: uid(), name: '', servers: '', strategy: '', hc: false, hcPath: '/healthz', hcInterval: '10s', sticky: false, retry: false, retryAttempts: '3', ...o })
const mkMw = (name, type, extra) => ({ id: uid(), name, type, params: { ...defaultParams(type), ...(extra || {}) } })

const PRESETS = {
  dockerLabels: {
    label: { pt: 'SPA + API (labels Docker)', en: 'SPA + API (Docker labels)' },
    values: {
      outMode: 'docker',
      provider: 'docker',
      routers: [
        mkRouter({ name: 'web', rule: 'Host(`app.example.com`) && PathPrefix(`/`)', service: 'web', middlewares: ['seguranca'] }),
        mkRouter({ name: 'api', rule: 'Host(`api.example.com`)', service: 'api', middlewares: ['tira-api', 'seguranca', 'limite'] }),
      ],
      services: [
        mkService({ name: 'web', servers: 'http://web:3000' }),
        mkService({ name: 'api', servers: 'http://api:8080', strategy: 'roundRobin', hc: true, retry: true }),
      ],
      middlewares: [
        mkMw('seguranca', 'customResponseHeaders', {
          headers: 'X-Frame-Options: DENY\nX-Content-Type-Options: nosniff\nReferrer-Policy: strict-origin-when-cross-origin',
        }),
        mkMw('tira-api', 'stripPrefix', { prefixes: '/api' }),
        mkMw('limite', 'rateLimit', { average: '100', burst: '50', period: '1m' }),
      ],
    },
  },
  fileYaml: {
    label: { pt: 'dynamic.yml com middlewares', en: 'dynamic.yml with middlewares' },
    values: {
      outMode: 'file',
      provider: 'file',
      routers: [
        mkRouter({
          name: 'painel',
          rule: 'Host(`app.example.com`) && PathPrefix(`/`)',
          entryPoints: ['websecure'],
          service: 'web',
          middlewares: ['compress', 'autentica', 'renova'],
        }),
        mkRouter({
          name: 'api',
          rule: 'Host(`api.example.com`) && PathPrefix(`/v2`)',
          entryPoints: ['websecure'],
          service: 'api',
          middlewares: ['renova-v2', 'limite', 'quebra-circuito'],
        }),
      ],
      services: [
        mkService({ name: 'web', servers: 'http://web-1:3000\nhttp://web-2:3000', sticky: true }),
        mkService({ name: 'api', servers: 'http://api-1:8080\nhttp://api-2:8080', strategy: 'leastRequest', hc: true, hcPath: '/healthz', hcInterval: '10s', retry: true }),
      ],
      middlewares: [
        mkMw('compress', 'compress'),
        mkMw('autentica', 'basicAuth', { usersFile: '/etc/traefik/.htpasswd', realm: 'Area restrita' }),
        mkMw('renova', 'replacePathRegex', { regex: '^/(.*)', replacement: '/index.html' }),
        mkMw('renova-v2', 'stripPrefixRegex', { regex: '^/v2' }),
        mkMw('limite', 'rateLimit', { average: '200', burst: '100', period: '1m' }),
        mkMw('quebra-circuito', 'circuitBreaker', {}),
      ],
    },
  },
  tlsOnly: {
    label: { pt: 'Só TLS + redirecionamento', en: 'TLS + redirect only' },
    values: {
      outMode: 'file',
      provider: 'file',
      routers: [
        mkRouter({
          name: 'http-para-https',
          rule: 'Host(`app.example.com`)',
          entryPoints: ['web'],
          service: 'web',
          middlewares: ['forca-https'],
          tls: false,
        }),
        mkRouter({ name: 'https', rule: 'Host(`app.example.com`)', service: 'web', middlewares: ['forca-https'] }),
      ],
      services: [mkService({ name: 'web', servers: 'http://web:3000' })],
      middlewares: [mkMw('forca-https', 'redirectScheme', { scheme: 'https', permanent: true })],
    },
  },
}

const STATIC_DEFAULTS = {
  httpPort: '80',
  httpsPort: '443',
  adminPort: '8082',
  acmeEmail: 'admin@example.com',
  acmeStorage: '/letsencrypt/acme.json',
  acmeChallenge: 'tls',
  dashboard: true,
  accessLog: true,
  accessLogStatus: '400-499, 500-599',
  logLevel: 'INFO',
  provider: 'docker',
  dockerNetwork: 'traefik',
  exposedByDefault: false,
}

// ─── Algoritmo-fonte exibido na própria página ─────────────────────────────
const SOURCE = `
// ---- configuração estática: traefik.yml ------------------------------
function buildStaticYAML(s) {
  const out = []
  const p = (n, str) => out.push('  '.repeat(n) + str)

  p(0, 'entryPoints:')
  p(1, 'web:')
  p(2, 'address: ' + q(':' + s.httpPort))
  p(1, 'websecure:')
  p(2, 'address: ' + q(':' + s.httpsPort))
  p(2, 'http:')
  p(3, 'tls:')
  p(4, 'certResolver: letsencrypt')

  p(0, 'providers:')
  p(1, 'docker:')
  p(2, 'network: ' + q(s.dockerNetwork))
  p(2, 'exposedByDefault: false')

  p(0, 'certificatesResolvers:')
  p(1, 'letsencrypt:')
  p(2, 'acme:')
  p(3, 'email: ' + q(s.acmeEmail))
  p(3, 'storage: ' + q(s.acmeStorage))
  p(3, 'tlsChallenge: true')
  return out.join('\\n')
}

// ---- configuração dinâmica: dynamic.yml (file provider) ----------------
function buildDynamicYAML(s) {
  const out = []
  const p = (n, str) => out.push('  '.repeat(n) + str)
  p(0, 'http:')

  // routers: rule (string com crase do Traefik v3), entryPoints, service,
  // middlewares na ordem em que serão aplicados e tls
  s.routers.forEach((r) => {
    p(2, r.name + ':')
    p(3, 'rule: ' + q(r.rule))
    p(3, 'entryPoints: ' + flowList(r.entryPoints))
    p(3, 'service: ' + q(r.service))
    if (r.middlewares.length) p(3, 'middlewares: ' + flowList(r.middlewares))
    if (r.tls) p(3, 'tls: {}')
  })

  // services: loadBalancer com a lista de servers, strategy, healthCheck,
  // sticky e retry — todos dentro do mesmo bloco
  s.services.forEach((svc) => {
    p(2, svc.name + ':')
    p(3, 'loadBalancer:')
    nonEmptyLines(svc.servers).forEach((url) => p(4, '- url: ' + q(url)))
    if (svc.strategy) p(4, 'strategy: ' + svc.strategy)
  })

  return out.join('\\n')
}

// ---- o mesmo dynamic em labels Docker ---------------------------------
// No docker provider o serviço só declara a PORTA (o host é o próprio
// container), e os middlewares precisam do sufixo @docker:
'      - ' + q('traefik.http.routers.api.rule=Host(EXEMPLO) && PathPrefix(/api)')
'      - ' + q('traefik.http.routers.api.entrypoints=websecure')
'      - ' + q('traefik.http.routers.api.service=api')
'      - ' + q('traefik.http.routers.api.middlewares=tira-api@docker')
'      - ' + q('traefik.http.routers.api.tls=true')
'      - ' + q('traefik.http.services.api.loadbalancer.server.port=8080')

// ---- por que JSON.stringify serve de aspas YAML -------------------------
// q = (v) => JSON.stringify(String(v))
// A regra do Traefik v3 carrega crases e parenteses (Host(\`app.com\`)); um
// escalar YAML solto quebraria a linha, e a string containdo ": " viraria
// mapa. O estilo de aspas duplas do YAML aceita os mesmos escapes do JSON,
// então reaproveitar o JSON.stringify resolve as duas coisas de uma vez.
`.trim()

const translations = {
  pt: {
    title: 'Gerador de Configuração Traefik',
    intro: (
      <>
        Monta a configuração do <Text code>Traefik</Text> — o reverse proxy que
        é o padrão em stack containerizada, porque descobre containers no
        Docker automaticamente e recarrega a configuração sem restart. Gera o{' '}
        <Text code>traefik.yml</Text> estático (entryPoints, providers, ACME) e
        a parte dinâmica em dois formatos: o <Text code>dynamic.yml</Text> do{' '}
        <Text code>file provider</Text> ou <Text code>labels Docker</Text> para
        colar no <Text code>docker-compose.yml</Text>. Tudo client-side, nada
        sai do navegador.
      </>
    ),
    presetsTitle: 'Modelo',
    presetsHint: 'Um clique aplica um exemplo — depois é só ajustar.',
    outTitle: 'Formato da configuração dinâmica',
    outHint: 'O Treafik tem duas formas de declarar a parte dinâmica — elas valem para v3.',
    outFile: 'dynamic.yml (file provider)',
    outDocker: 'Labels Docker',
    outFileHint: 'Routers, services e middlewares num YAML só — bom quando a config vive num volume montado.',
    outDockerHint: 'Labels coladas no serviço do Compose — o Traefik lê do próprio container, sem arquivo.',
    staticTitle: 'Configuração estática — traefik.yml',
    httpPortLabel: 'Porta HTTP',
    httpsPortLabel: 'Porta HTTPS',
    adminPortLabel: 'Porta do painel',
    acmeEmailLabel: 'E-mail do ACME',
    acmeStorageLabel: 'Arquivo de storage',
    acmeChallengeLabel: 'Desafio ACME',
    challengeTls: 'tlsChallenge (porta 443)',
    challengeHttp: 'httpChallenge (porta 80)',
    providerLabel: 'Provider',
    providerDocker: 'docker',
    providerFile: 'file',
    providerBoth: 'docker + file',
    providerK8s: 'kubernetesCRD',
    networkLabel: 'Rede Docker',
    logLevelLabel: 'Nível de log',
    dashboardLabel: 'Painel (api.dashboard)',
    accessLogLabel: 'Access log',
    accessLogStatusLabel: 'Status no access log',
    optAccess: 'Access log',
    optDashboard: 'Painel (api.dashboard)',
    optExposed: 'exposedByDefault',
    optExposedHint: 'Com ligado, TODO container da rede ganha router — quase nunca é o que você quer.',
    routersTitle: 'Routers',
    routersHint: 'A rule decide o que casa: Host, PathPrefix, PathRegexp, HeaderRegexp, Method, ClientIP — combinado com && e ||. Regra maior = prioridade maior no Traefik.',
    addRouter: 'Adicionar router',
    routerName: 'Nome',
    routerRule: 'Rule',
    routerRulePh: 'Host(`app.example.com`) && PathPrefix(`/api`)',
    routerEntryPoints: 'EntryPoints',
    routerService: 'Service',
    routerMiddlewares: 'Middlewares (ordem de aplicação)',
    routerTls: 'TLS',
    servicesTitle: 'Services',
    servicesHint: 'O load balancer. No file provider você informa a URL completa de cada servidor; nos labels Docker só a porta.',
    addService: 'Adicionar service',
    svcName: 'Nome',
    svcServers: 'Servers (um por linha)',
    svcServersPh: 'http://api-1:8080\nhttp://api-2:8080',
    svcStrategy: 'Estratégia',
    strategyDefault: 'padrão (wlc)',
    svcHc: 'Health check',
    svcHcPath: 'Path',
    svcHcInterval: 'Intervalo',
    svcSticky: 'Sessão sticky (cookie)',
    svcRetry: 'Retry',
    svcAttempts: 'Tentativas',
    mwsTitle: 'Middlewares',
    mwsHint: 'A cadeia de transformation que roda entre o router e o service, na ordem em que aparece no router.',
    addMw: 'Adicionar middleware',
    mwName: 'Nome',
    mwType: 'Tipo',
    outLabel: 'Saída',
    copy: 'Copiar',
    copied: 'Copiado!',
    copyErr: 'Não foi possível copiar',
    staticOutTitle: 'traefik.yml (estático)',
    dynOutTitle: 'dynamic.yml (file provider)',
    labelsOutTitle: 'docker-compose.yml (labels)',
    stats: (lines, bytes) => `${lines} ${lines === 1 ? 'linha' : 'linhas'} · ${bytes} ${bytes === 1 ? 'byte' : 'bytes'}`,
    emptyDyn: 'Nada para gerar ainda — adicione um router ou um service acima.',
    flowTitle: 'Fluxo das requisições',
    flowHint: 'Como o Traefik monta cada resposta: rule casa → entryPoint → cadeia de middlewares → service.',
    flowNoRouters: 'Nenhum router definido.',
    flowService: 'service',
    flowEntry: 'entryPoint',
    prioTitle: 'Ordem de avaliação dos routers',
    prioHint: 'O Traefik não tem campo priority: ele ordena os routers pelo tamanho da rule (maior primeiro). Empate de tamanho = ordem alfabética, que quase nunca é a que você quer.',
    prioCol: 'Posição',
    prioRule: 'Rule',
    prioRouter: 'Router',
    prioChars: 'Caracteres',
    prioEmpty: 'Nenhum router para ordenar.',
    problemsTitle: 'Problemas que impedem o Traefik de subir a configuração',
    warningsTitle: 'Avisos — a config sai, mas confira:',
    allGood: 'Tudo certo. Valide de verdade rodando o Traefik com --configFile antes de aplicar em produção.',
    e_noRouters: 'Nenhum router — sem router o Traefik não responde a nada.',
    e_noServices: 'Nenhum service — todo router aponta pra algum service.',
    e_routerNoRule: 'Router sem rule: ele nunca casa com nenhuma requisição.',
    e_routerNoName: 'Router sem nome — o Traefik usa a chave do YAML, então precisa existir.',
    e_routerNoEntryPoint: 'Router sem entryPoint — ele nunca é avaliado.',
    e_routerBadService: 'Router aponta pra um service que não existe.',
    e_routerBadMiddleware: 'Router referencia um middleware que não existe.',
    e_svcNoName: 'Service sem nome.',
    e_svcDupName: 'Nome de service duplicado — o último sobrescreve o anterior.',
    e_svcNoServer: 'Service sem nenhum server: o load balancer não tem para onde mandar.',
    e_svcBadUrl: 'URL de server inválida — use o formato http://host:porta.',
    e_mwNoName: 'Middleware sem nome.',
    e_mwBadName: 'Nome de middleware com espaço ou ponto: o parser de label do Docker trata ponto como separador de caminho e quebra.',
    e_mwNoUsersFile: 'basicAuth/digestAuth sem usersFile — aponte um .htpasswd montado no container.',
    e_mwNoAuthAddress: 'forwardAuth sem address — nada é chamado para validar a requisição.',
    w_svcNoPort: 'URL sem porta explícita: nos labels Docker não dá pra inferir a porta.',
    w_dockerMultiServer: 'Mais de um server: o docker provider só aceita uma porta por service — separe em services distintos.',
    w_priorityTie: 'Dois routers com rule do mesmo tamanho vão desempatar por ordem alfabética.',
    w_tlsNotWebsecure: 'Router com TLS mas sem o entryPoint websecure: o tls não será aplicado.',
    w_noAcmeEmail: 'Certificado TLS sem e-mail de ACME válido — o Let\'s Encrypt não consegue avisar de expiração.',
    w_mwUnused: 'Middleware definido mas não usado por nenhum router: ele sai no arquivo e não faz nada.',
    w_fileProviderNoDynamic: 'Provider file sem dynamic.yml: se você montou ele, confira o diretório no volume.',
    w_dockerProviderIgnored: 'Provider docker ativo mas a saída é dynamic.yml — a descoberta de containers não vai encontrar nada sem labels.',
    tipTitle: 'Entendendo o resultado',
    tipBody: (
      <>
        O Traefik separa a configuração em dois arquivos por um motivo
        concreto: a parte estática (<Text code>traefik.yml</Text>) define{' '}
        <Text code>entryPoints</Text>, <Text code>providers</Text> e o
        <Text code>certificatesResolvers</Text> — o que muda exige reiniciar o
        processo. A parte dinâmica define <Text code>routers</Text>,{' '}
        <Text code>services</Text> e <Text code>middlewares</Text>, e é
        recarregada em tempo real quando o arquivo muda (é por isso que{' '}
        <Text code>watch: true</Text> importa).
        <pre style={{ margin: '8px 0', fontSize: 12, lineHeight: 1.6 }}>{'Client --(443)--> websecure --rule Host(`api.com`)--> tira-api (stripPrefix) --> limite (rateLimit) --> api-svc (loadBalancer) --> http://api:8080'}</pre>
        A <Text code>rule</Text> é a parte que mais trava iniciante: no v3
        ela usa <Text code>crase</Text> em volta do valor —{' '}
        <Text code>Path(`/api`)</Text>, e não as aspas do{' '}
        <Text code>Host(&quot;api.com&quot;)</Text> que circulavam em exemplos
        antigos. Regras se combinam com <Text code>&amp;&amp;</Text> (e) e{' '}
        <Text code>||</Text> (ou), e cada matcher tem seu inverso:{' '}
        <Text code>!Host</Text>, <Text code>!PathPrefix</Text>. Um router sem{' '}
        <Text code>entryPoints</Text> nunca é avaliado — não existe fallback
        automático.
        <br />
        <br />
        <Text strong>Duas pegadinhas que custam horas:</Text>
        <br />1) <Text strong>Prioridade é pelo tamanho da rule</Text>. Não
        existe campo <Text code>priority</Text>. O Traefik ordena os routers
        pelo número de caracteres da rule, do maior pro menor —{' '}
        <Text code>Host(`a.com`) &amp;&amp; Path(`/x/y/z`)</Text> sempre ganha
        de <Text code>Host(`a.com`)</Text>. Empate de tamanho desempata por
        ordem alfabética do nome.
        <br />2) <Text strong>No docker provider o service só declara a
        porta.</Text> O host vem do próprio container:{' '}
        <Text code>traefik.http.services.api.loadbalancer.server.port=8080</Text>{' '}
        (não <Text code>server.url</Text>). E um middleware referenciado por
        um router do provider Docker precisa do sufixo{' '}
        <Text code>@docker</Text> — sem ele o Traefik procura no provider
        errado e o router fica sem os middlewares, silenciosamente.
        <br />
        <br />
        Vale registrar o plano: um <Text code>docker-compose</Text> gerado sem
        <Text code>traefik.enable=true</Text> no serviço não é publicado,{' '}
        <Text code>exposedByDefault</Text> ligado publica tudo sem querer (por
        isso a recommendation é deixar desligado), e o painel vive no
        entryPoint interno <Text code>traefik</Text> — se você quer enxergá-lo
        de fora, crie um router pra ele com <Text code>basicAuth</Text> em vez
        de expor a porta no host.
      </>
    ),
    howItWorks: 'Como funciona — algoritmo-fonte',
    howItWorksDesc:
      'O gerador tem três emissores independentes e um validador. O estático monta o traefik.yml com indentação de 2 espaços (entradaPoints, providers conforme a seleção, certificatesResolvers com o desafio escolhido). O dinâmico em YAML percorre routers, services e middlewares na ordem do bloco http:, e cada middleware tem um switch que escreve só as chaves do seu tipo — lista para prefixes e sourceRange, mapa para headers, block scalar | para a expressão multilinha do circuit breaker. O emissor de labels percorre os services e, para cada um, anexa os routers que apontam pra ele mais os middlewares que esses routers usam, com as chaves em minúsculas e o sufixo @docker. Todo valor passa por q(), que é JSON.stringify: a regra do v3 tem crases e parênteses, que quebrariam um escalar YAML solto, e o estilo de aspas duplas do YAML aceita os mesmos escapes do JSON.',
  },
  en: {
    title: 'Traefik Config Generator',
    intro: (
      <>
        Builds the <Text code>Traefik</Text> config — the reverse proxy that
        became the default in containerized stacks because it discovers Docker
        containers automatically and hot-reloads its configuration. It emits
        the static <Text code>traefik.yml</Text> (entryPoints, providers, ACME)
        and the dynamic part in two formats: the <Text code>dynamic.yml</Text>{' '}
        of the <Text code>file provider</Text>, or Docker{' '}
        <Text code>labels</Text> to paste into your{' '}
        <Text code>docker-compose.yml</Text>. Fully client-side, nothing leaves
        the browser.
      </>
    ),
    presetsTitle: 'Template',
    presetsHint: 'One click applies a sample — tweak afterwards.',
    outTitle: 'Dynamic configuration format',
    outHint: 'Traefik has two ways to declare the dynamic part — both valid on v3.',
    outFile: 'dynamic.yml (file provider)',
    outDocker: 'Docker labels',
    outFileHint: 'Routers, services and middlewares in one YAML file — good when the config lives on a mounted volume.',
    outDockerHint: 'Labels pasted on the Compose service — Traefik reads them from the container itself, no file.',
    staticTitle: 'Static config — traefik.yml',
    httpPortLabel: 'HTTP port',
    httpsPortLabel: 'HTTPS port',
    adminPortLabel: 'Dashboard port',
    acmeEmailLabel: 'ACME email',
    acmeStorageLabel: 'Storage file',
    acmeChallengeLabel: 'ACME challenge',
    challengeTls: 'tlsChallenge (port 443)',
    challengeHttp: 'httpChallenge (port 80)',
    providerLabel: 'Provider',
    providerDocker: 'docker',
    providerFile: 'file',
    providerBoth: 'docker + file',
    providerK8s: 'kubernetesCRD',
    networkLabel: 'Docker network',
    logLevelLabel: 'Log level',
    dashboardLabel: 'Dashboard (api.dashboard)',
    accessLogLabel: 'Access log',
    accessLogStatusLabel: 'Statuses in access log',
    optAccess: 'Access log',
    optDashboard: 'Dashboard (api.dashboard)',
    optExposed: 'exposedByDefault',
    optExposedHint: 'When on, EVERY container on the network gets a router — almost never what you want.',
    routersTitle: 'Routers',
    routersHint: 'The rule decides what matches: Host, PathPrefix, PathRegexp, HeaderRegexp, Method, ClientIP — combined with && and ||. Longer rule = higher priority in Traefik.',
    addRouter: 'Add router',
    routerName: 'Name',
    routerRule: 'Rule',
    routerRulePh: 'Host(`app.example.com`) && PathPrefix(`/api`)',
    routerEntryPoints: 'EntryPoints',
    routerService: 'Service',
    routerMiddlewares: 'Middlewares (application order)',
    routerTls: 'TLS',
    servicesTitle: 'Services',
    servicesHint: 'The load balancer. With the file provider you give the full URL of each server; with Docker labels only the port.',
    addService: 'Add service',
    svcName: 'Name',
    svcServers: 'Servers (one per line)',
    svcServersPh: 'http://api-1:8080\nhttp://api-2:8080',
    svcStrategy: 'Strategy',
    strategyDefault: 'default (wlc)',
    svcHc: 'Health check',
    svcHcPath: 'Path',
    svcHcInterval: 'Interval',
    svcSticky: 'Sticky session (cookie)',
    svcRetry: 'Retry',
    svcAttempts: 'Attempts',
    mwsTitle: 'Middlewares',
    mwsHint: 'The transformation chain that runs between the router and the service, in the order it appears on the router.',
    addMw: 'Add middleware',
    mwName: 'Name',
    mwType: 'Type',
    outLabel: 'Output',
    copy: 'Copy',
    copied: 'Copied!',
    copyErr: 'Could not copy',
    staticOutTitle: 'traefik.yml (static)',
    dynOutTitle: 'dynamic.yml (file provider)',
    labelsOutTitle: 'docker-compose.yml (labels)',
    stats: (lines, bytes) => `${lines} ${lines === 1 ? 'line' : 'lines'} · ${bytes} ${bytes === 1 ? 'byte' : 'bytes'}`,
    emptyDyn: 'Nothing to generate yet — add a router or a service above.',
    flowTitle: 'Request flow',
    flowHint: 'How Traefik builds each response: rule matches → entryPoint → middleware chain → service.',
    flowNoRouters: 'No router defined.',
    flowService: 'service',
    flowEntry: 'entryPoint',
    prioTitle: 'Router evaluation order',
    prioHint: 'Traefik has no priority field: it sorts routers by rule length (longest first). A tie on length falls back to alphabetical order, which is rarely the one you meant.',
    prioCol: 'Position',
    prioRule: 'Rule',
    prioRouter: 'Router',
    prioChars: 'Characters',
    prioEmpty: 'No router to sort.',
    problemsTitle: 'Problems that stop Traefik from loading the config',
    warningsTitle: 'Warnings — the config still generates, but check:',
    allGood: 'All good. Really validate it by running Traefik with --configFile before applying to production.',
    e_noRouters: 'No router — without one Traefik answers nothing.',
    e_noServices: 'No service — every router points at some service.',
    e_routerNoRule: 'Router without a rule: it never matches any request.',
    e_routerNoName: 'Router without a name — Traefik uses the YAML key, so it has to exist.',
    e_routerNoEntryPoint: 'Router without an entryPoint — it is never evaluated.',
    e_routerBadService: 'Router points at a service that does not exist.',
    e_routerBadMiddleware: 'Router references a middleware that does not exist.',
    e_svcNoName: 'Service without a name.',
    e_svcDupName: 'Duplicate service name — the last one silently wins.',
    e_svcNoServer: 'Service without any server: the load balancer has nowhere to send traffic.',
    e_svcBadUrl: 'Invalid server URL — use the http://host:port format.',
    e_mwNoName: 'Middleware without a name.',
    e_mwBadName: 'Middleware name with a space or a dot: the Docker label parser treats dots as path separators and breaks.',
    e_mwNoUsersFile: 'basicAuth/digestAuth without usersFile — point at a .htpasswd mounted into the container.',
    e_mwNoAuthAddress: 'forwardAuth without address — nothing gets called to validate the request.',
    w_svcNoPort: 'URL without an explicit port: the port cannot be inferred for Docker labels.',
    w_dockerMultiServer: 'More than one server: the docker provider only accepts one port per service — split into distinct services.',
    w_priorityTie: 'Two routers with rules of the same length tie-break alphabetically.',
    w_tlsNotWebsecure: 'Router with TLS but without the websecure entryPoint: the tls block will not apply.',
    w_noAcmeEmail: 'TLS certificate without a valid ACME email — Let\'s Encrypt cannot warn you about expiry.',
    w_mwUnused: 'Middleware defined but not used by any router: it ends up in the file doing nothing.',
    w_fileProviderNoDynamic: 'file provider without dynamic.yml: if you mounted one, double-check the volume directory.',
    w_dockerProviderIgnored: 'docker provider is on but the output is dynamic.yml — container discovery will find nothing without labels.',
    tipTitle: 'Understanding the output',
    tipBody: (
      <>
        Traefik splits its config in two files for a concrete reason: the
        static part (<Text code>traefik.yml</Text>) defines{' '}
        <Text code>entryPoints</Text>, <Text code>providers</Text> and the{' '}
        <Text code>certificatesResolvers</Text> — changing any of it requires
        a process restart. The dynamic part defines <Text code>routers</Text>,{' '}
        <Text code>services</Text> and <Text code>middlewares</Text>, and is
        reloaded live when the file changes (that's why{' '}
        <Text code>watch: true</Text> matters).
        <pre style={{ margin: '8px 0', fontSize: 12, lineHeight: 1.6 }}>{'Client --(443)--> websecure --rule Host(`api.com`)--> tira-api (stripPrefix) --> limite (rateLimit) --> api-svc (loadBalancer) --> http://api:8080'}</pre>
        The <Text code>rule</Text> is what trips up beginners most: on v3 it
        wraps the value in <Text code>backticks</Text> —{' '}
        <Text code>Path(`/api`)</Text> — not the double quotes from{' '}
        <Text code>Host(&quot;api.com&quot;)</Text> that show up in older
        examples. Rules combine with <Text code>&amp;&amp;</Text> (and) and{' '}
        <Text code>||</Text> (or), and every matcher has an inverse:{' '}
        <Text code>!Host</Text>, <Text code>!PathPrefix</Text>. A router
        without <Text code>entryPoints</Text> is never evaluated — there is no
        automatic fallback.
        <br />
        <br />
        <Text strong>Two traps that cost hours:</Text>
        <br />1) <Text strong>Priority is the rule length.</Text> There is no{' '}
        <Text code>priority</Text> field. Traefik orders routers by rule
        character count, longest first —{' '}
        <Text code>Host(`a.com`) &amp;&amp; Path(`/x/y/z`)</Text> always beats{' '}
        <Text code>Host(`a.com`)</Text>. Ties fall back to the router name
        alphabetically.
        <br />2) <Text strong>On the docker provider a service only declares
        the port.</Text> The host comes from the container itself:{' '}
        <Text code>traefik.http.services.api.loadbalancer.server.port=8080</Text>{' '}
        (not <Text code>server.url</Text>). And a middleware referenced by a
        router from the Docker provider needs the{' '}
        <Text code>@docker</Text> suffix — without it Traefik looks in the
        wrong provider and the router silently ends up with no middleware.
        <br />
        <br />
        Also worth registering: a <Text code>docker-compose</Text> service
        generated without <Text code>traefik.enable=true</Text> is never
        published, <Text code>exposedByDefault</Text> on publishes everything
        by accident (which is why leaving it off is the recommended default),
        and the dashboard lives on the internal <Text code>traefik</Text>{' '}
        entryPoint — if you want to reach it from outside, add a router for it
        with <Text code>basicAuth</Text> instead of exposing the port on the
        host.
      </>
    ),
    howItWorks: 'How it works — source algorithm',
    howItWorksDesc:
      'The generator has three independent emitters plus a validator. The static one builds traefik.yml with 2-space indentation (entryPoints, providers per the selection, certificatesResolvers with the chosen challenge). The dynamic YAML one walks routers, services and middlewares in http: block order, and each middleware has a switch that writes only the keys of its own type — lists for prefixes and sourceRange, a map for headers, a | block scalar for the multi-line circuit breaker expression. The label emitter walks the services and, for each one, attaches the routers pointing at it plus the middlewares those routers use, keys lowercased and suffixed with @docker. Every value goes through q(), which is JSON.stringify: a v3 rule carries backticks and parentheses, which would break a bare YAML scalar, and YAML double-quoted style accepts the same escapes JSON does.',
  },
}

export default function TraefikConfigGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [preset, setPreset] = useState('dockerLabels')
  const [cfg, setCfg] = useState({ ...STATIC_DEFAULTS, ...PRESETS.dockerLabels.values })
  const [copied, setCopied] = useState(null)

  const setField = (k, v) => setCfg((c) => ({ ...c, [k]: v }))

  const applyPreset = (key) => {
    setPreset(key)
    setCfg({ ...STATIC_DEFAULTS, ...PRESETS[key].values })
    setCopied(null)
  }

  const updateRouter = (id, patch) =>
    setCfg((c) => ({ ...c, routers: c.routers.map((r) => (r.id === id ? { ...r, ...patch } : r)) }))
  const updateService = (id, patch) =>
    setCfg((c) => ({ ...c, services: c.services.map((s) => (s.id === id ? { ...s, ...patch } : s)) }))
  const updateMw = (id, patch) =>
    setCfg((c) => ({ ...c, middlewares: c.middlewares.map((m) => (m.id === id ? { ...m, ...patch } : m)) }))

  const result = useMemo(() => {
    const staticYaml = buildStaticYAML(cfg)
    const dyn = cfg.outMode === 'file' ? buildDynamicYAML(cfg) : buildDockerLabels(cfg)
    const problems = validate(cfg)
    const errs = problems.filter((p) => p.startsWith('e_'))
    const warns = problems.filter((p) => p.startsWith('w_'))
    const priority = cfg.routers
      .map((r) => ({ name: r.name, rule: r.rule, len: r.rule.trim().length }))
      .sort((a, b) => b.len - a.len || a.name.localeCompare(b.name))
    return { staticYaml, dyn, errs, warns, priority }
  }, [cfg])

  const { staticYaml, dyn, errs, warns, priority } = result
  const svcOptions = useMemo(() => cfg.services.map((s) => ({ value: s.name, label: s.name || '—' })), [cfg.services])
  const mwOptions = useMemo(() => cfg.middlewares.map((m) => ({ value: m.name, label: m.name || '—' })), [cfg.middlewares])
  const mwByName = useMemo(() => {
    const map = {}
    cfg.middlewares.forEach((m) => { map[m.name] = m })
    return map
  }, [cfg.middlewares])

  const meta = (text) => {
    const lines = text.split('\n').length
    const bytes = new TextEncoder().encode(text).length
    return t.stats(lines, bytes)
  }

  async function copy(which, text) {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(which)
      setTimeout(() => setCopied((c) => (c === which ? null : c)), 1500)
    } catch {
      message.error(t.copyErr)
    }
  }

  function copyBtn(which, text) {
    return (
      <Button
        type="primary"
        icon={copied === which ? <CheckOutlined /> : <CopyOutlined />}
        onClick={() => copy(which, text)}
      >
        {copied === which ? t.copied : t.copy}
      </Button>
    )
  }

  const preStyle = { margin: 0, fontSize: 12, lineHeight: 1.6, background: '#fafafa', padding: 12, borderRadius: 6, overflowX: 'auto' }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}>
        <PartitionOutlined /> {t.title}
      </Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card title={t.presetsTitle} extra={<Text type="secondary" style={{ fontSize: 12 }}>{t.presetsHint}</Text>}>
        <Segmented
          value={preset}
          onChange={applyPreset}
          options={Object.keys(PRESETS).map((k) => ({ label: PRESETS[k].label[lang], value: k }))}
        />
      </Card>

      <Card title={t.outTitle} extra={<Text type="secondary" style={{ fontSize: 12 }}>{t.outHint}</Text>}>
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <Segmented
            value={cfg.outMode}
            onChange={(v) => setField('outMode', v)}
            options={[
              { label: t.outFile, value: 'file' },
              { label: t.outDocker, value: 'docker' },
            ]}
          />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {cfg.outMode === 'file' ? t.outFileHint : t.outDockerHint}
          </Text>
        </Space>
      </Card>

      <Card title={t.staticTitle}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Space wrap size="small">
            <Text type="secondary">{t.httpPortLabel}</Text>
            <Input value={cfg.httpPort} onChange={(e) => setField('httpPort', e.target.value)} style={{ width: 80 }} />
            <Text type="secondary">{t.httpsPortLabel}</Text>
            <Input value={cfg.httpsPort} onChange={(e) => setField('httpsPort', e.target.value)} style={{ width: 80 }} />
            <Text type="secondary">{t.adminPortLabel}</Text>
            <Input value={cfg.adminPort} onChange={(e) => setField('adminPort', e.target.value)} style={{ width: 80 }} />
            <Text type="secondary">{t.providerLabel}</Text>
            <Select
              value={cfg.provider}
              onChange={(v) => setField('provider', v)}
              style={{ width: 190 }}
              options={[
                { value: 'docker', label: t.providerDocker },
                { value: 'file', label: t.providerFile },
                { value: 'both', label: t.providerBoth },
                { value: 'kubernetesCRD', label: t.providerK8s },
              ]}
            />
            <Text type="secondary">{t.networkLabel}</Text>
            <Input
              value={cfg.dockerNetwork}
              onChange={(e) => setField('dockerNetwork', e.target.value)}
              disabled={cfg.provider === 'file' || cfg.provider === 'kubernetesCRD'}
              style={{ width: 130, fontFamily: 'monospace', fontSize: 12 }}
            />
          </Space>
          <Space wrap size="small">
            <Text type="secondary">{t.acmeEmailLabel}</Text>
            <Input value={cfg.acmeEmail} onChange={(e) => setField('acmeEmail', e.target.value)} style={{ width: 230 }} />
            <Text type="secondary">{t.acmeStorageLabel}</Text>
            <Input
              value={cfg.acmeStorage}
              onChange={(e) => setField('acmeStorage', e.target.value)}
              style={{ width: 230, fontFamily: 'monospace', fontSize: 12 }}
            />
            <Text type="secondary">{t.acmeChallengeLabel}</Text>
            <Select
              value={cfg.acmeChallenge}
              onChange={(v) => setField('acmeChallenge', v)}
              style={{ width: 200 }}
              options={[
                { value: 'tls', label: t.challengeTls },
                { value: 'http', label: t.challengeHttp },
              ]}
            />
            <Text type="secondary">{t.logLevelLabel}</Text>
            <Select
              value={cfg.logLevel}
              onChange={(v) => setField('logLevel', v)}
              style={{ width: 120 }}
              options={['DEBUG', 'INFO', 'WARN', 'ERROR'].map((x) => ({ value: x, label: x }))}
            />
          </Space>
          <Space wrap size="large">
            <Space size="small">
              <Text type="secondary">{t.optAccess}</Text>
              <Switch checked={cfg.accessLog} onChange={(v) => setField('accessLog', v)} />
              {cfg.accessLog && (
                <>
                  <Text type="secondary" style={{ fontSize: 12 }}>{t.accessLogStatusLabel}</Text>
                  <Input
                    value={cfg.accessLogStatus}
                    onChange={(e) => setField('accessLogStatus', e.target.value)}
                    style={{ width: 220, fontFamily: 'monospace', fontSize: 12 }}
                  />
                </>
              )}
            </Space>
            <Space size="small">
              <Text type="secondary">{t.optDashboard}</Text>
              <Switch checked={cfg.dashboard} onChange={(v) => setField('dashboard', v)} />
            </Space>
            <Space size="small">
              <Text type="secondary">{t.optExposed}</Text>
              <Switch checked={cfg.exposedByDefault} onChange={(v) => setField('exposedByDefault', v)} />
              <Text type="secondary" style={{ fontSize: 12 }}>{t.optExposedHint}</Text>
            </Space>
          </Space>
        </Space>
      </Card>

      <Card title={t.routersTitle} extra={<Text type="secondary" style={{ fontSize: 12 }}>{t.routersHint}</Text>}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          {cfg.routers.map((r) => (
            <Card
              key={r.id}
              size="small"
              extra={<Button size="small" danger icon={<DeleteOutlined />} onClick={() => setCfg((c) => ({ ...c, routers: c.routers.filter((x) => x.id !== r.id) }))} />}
            >
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <Space wrap size="small">
                  <Text type="secondary">{t.routerName}</Text>
                  <Input
                    value={r.name}
                    onChange={(e) => updateRouter(r.id, { name: e.target.value })}
                    placeholder="api"
                    style={{ width: 150, fontFamily: 'monospace', fontSize: 12 }}
                  />
                  <Text type="secondary">{t.routerEntryPoints}</Text>
                  <Select
                    mode="multiple"
                    value={r.entryPoints}
                    onChange={(v) => updateRouter(r.id, { entryPoints: v })}
                    style={{ minWidth: 240 }}
                    maxTagCount="responsive"
                    options={[
                      { value: 'web', label: 'web (:' + cfg.httpPort + ')' },
                      { value: 'websecure', label: 'websecure (:' + cfg.httpsPort + ')' },
                      { value: 'traefik', label: 'traefik (:' + cfg.adminPort + ')' },
                    ]}
                  />
                  <Text type="secondary">{t.routerTls}</Text>
                  <Switch checked={r.tls} onChange={(v) => updateRouter(r.id, { tls: v })} />
                </Space>
                <Input
                  value={r.rule}
                  onChange={(e) => updateRouter(r.id, { rule: e.target.value })}
                  placeholder={t.routerRulePh}
                  style={{ fontFamily: 'monospace', fontSize: 12 }}
                />
                <Space wrap size="small">
                  <Text type="secondary">{t.routerService}</Text>
                  <Select
                    value={r.service || undefined}
                    onChange={(v) => updateRouter(r.id, { service: v })}
                    placeholder="—"
                    style={{ width: 180 }}
                    options={svcOptions}
                  />
                  <Text type="secondary">{t.routerMiddlewares}</Text>
                  <Select
                    mode="multiple"
                    value={r.middlewares}
                    onChange={(v) => updateRouter(r.id, { middlewares: v })}
                    placeholder="—"
                    style={{ minWidth: 320 }}
                    maxTagCount="responsive"
                    options={mwOptions}
                  />
                </Space>
              </Space>
            </Card>
          ))}
          <Button
            icon={<PlusOutlined />}
            onClick={() => setCfg((c) => ({
              ...c,
              routers: [...c.routers, mkRouter({ name: '', service: c.services[0] ? c.services[0].name : '', middlewares: [] })],
            }))}
          >
            {t.addRouter}
          </Button>
        </Space>
      </Card>

      <Card title={t.servicesTitle} extra={<Text type="secondary" style={{ fontSize: 12 }}>{t.servicesHint}</Text>}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          {cfg.services.map((svc) => (
            <Card
              key={svc.id}
              size="small"
              extra={<Button size="small" danger icon={<DeleteOutlined />} onClick={() => setCfg((c) => ({ ...c, services: c.services.filter((x) => x.id !== svc.id) }))} />}
            >
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <Space wrap size="small">
                  <Text type="secondary">{t.svcName}</Text>
                  <Input
                    value={svc.name}
                    onChange={(e) => updateService(svc.id, { name: e.target.value })}
                    placeholder="api"
                    style={{ width: 150, fontFamily: 'monospace', fontSize: 12 }}
                  />
                  <Text type="secondary">{t.svcStrategy}</Text>
                  <Select
                    value={svc.strategy}
                    onChange={(v) => updateService(svc.id, { strategy: v })}
                    style={{ width: 180 }}
                    options={[
                      { value: '', label: t.strategyDefault },
                      { value: 'roundRobin', label: 'roundRobin' },
                      { value: 'leastRequest', label: 'leastRequest' },
                      { value: 'first', label: 'first' },
                    ]}
                  />
                  <Text type="secondary">{t.svcRetry}</Text>
                  <Switch checked={svc.retry} onChange={(v) => updateService(svc.id, { retry: v })} />
                  {svc.retry && (
                    <>
                      <Text type="secondary" style={{ fontSize: 12 }}>{t.svcAttempts}</Text>
                      <Input
                        value={svc.retryAttempts}
                        onChange={(e) => updateService(svc.id, { retryAttempts: e.target.value })}
                        style={{ width: 70, fontFamily: 'monospace', fontSize: 12 }}
                      />
                    </>
                  )}
                  <Text type="secondary">{t.svcSticky}</Text>
                  <Switch checked={svc.sticky} onChange={(v) => updateService(svc.id, { sticky: v })} />
                </Space>
                <TextArea
                  value={svc.servers}
                  onChange={(e) => updateService(svc.id, { servers: e.target.value })}
                  placeholder={t.svcServersPh}
                  rows={2}
                  style={{ fontFamily: 'monospace', fontSize: 12 }}
                />
                <Space wrap size="small">
                  <Text type="secondary">{t.svcHc}</Text>
                  <Switch checked={svc.hc} onChange={(v) => updateService(svc.id, { hc: v })} />
                  {svc.hc && (
                    <>
                      <Text type="secondary" style={{ fontSize: 12 }}>{t.svcHcPath}</Text>
                      <Input
                        value={svc.hcPath}
                        onChange={(e) => updateService(svc.id, { hcPath: e.target.value })}
                        style={{ width: 150, fontFamily: 'monospace', fontSize: 12 }}
                      />
                      <Text type="secondary" style={{ fontSize: 12 }}>{t.svcHcInterval}</Text>
                      <Input
                        value={svc.hcInterval}
                        onChange={(e) => updateService(svc.id, { hcInterval: e.target.value })}
                        style={{ width: 90, fontFamily: 'monospace', fontSize: 12 }}
                      />
                    </>
                  )}
                </Space>
              </Space>
            </Card>
          ))}
          <Button icon={<PlusOutlined />} onClick={() => setCfg((c) => ({ ...c, services: [...c.services, mkService({})] }))}>
            {t.addService}
          </Button>
        </Space>
      </Card>

      <Card title={t.mwsTitle} extra={<Text type="secondary" style={{ fontSize: 12 }}>{t.mwsHint}</Text>}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          {cfg.middlewares.map((mw) => {
            const def = mwDef(mw.type)
            return (
              <Card
                key={mw.id}
                size="small"
                extra={<Button size="small" danger icon={<DeleteOutlined />} onClick={() => setCfg((c) => ({ ...c, middlewares: c.middlewares.filter((x) => x.id !== mw.id) }))} />}
              >
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <Space wrap size="small">
                    <Text type="secondary">{t.mwName}</Text>
                    <Input
                      value={mw.name}
                      onChange={(e) => updateMw(mw.id, { name: e.target.value })}
                      placeholder="tira-api"
                      style={{ width: 150, fontFamily: 'monospace', fontSize: 12 }}
                    />
                    <Text type="secondary">{t.mwType}</Text>
                    <Select
                      value={mw.type}
                      onChange={(v) => updateMw(mw.id, { type: v, params: defaultParams(v) })}
                      style={{ minWidth: 320 }}
                      options={MW_TYPES.map((d) => ({ value: d.value, label: d[lang] }))}
                    />
                  </Space>
                  <Space wrap size="small">
                    {def.fields.map((f) => {
                      const label = f[lang]
                      if (f.kind === 'bool') {
                        return (
                          <Space key={f.k} size="small">
                            <Text type="secondary" style={{ fontSize: 12 }}>{label}</Text>
                            <Switch
                              checked={Boolean(mw.params[f.k])}
                              onChange={(v) => updateMw(mw.id, { params: { ...mw.params, [f.k]: v } })}
                            />
                          </Space>
                        )
                      }
                      if (f.kind === 'area') {
                        return (
                          <Space key={f.k} direction="vertical" size={0} style={{ width: '100%' }}>
                            <Text type="secondary" style={{ fontSize: 12 }}>{label}</Text>
                            <TextArea
                              value={mw.params[f.k] || ''}
                              onChange={(e) => updateMw(mw.id, { params: { ...mw.params, [f.k]: e.target.value } })}
                              placeholder={f.ph}
                              rows={2}
                              style={{ fontFamily: 'monospace', fontSize: 12, maxWidth: 560 }}
                            />
                          </Space>
                        )
                      }
                      return (
                        <Space key={f.k} size="small">
                          <Text type="secondary" style={{ fontSize: 12 }}>{label}</Text>
                          <Input
                            value={mw.params[f.k] || ''}
                            onChange={(e) => updateMw(mw.id, { params: { ...mw.params, [f.k]: e.target.value } })}
                            placeholder={f.ph}
                            style={{ width: 230, fontFamily: 'monospace', fontSize: 12 }}
                          />
                        </Space>
                      )
                    })}
                  </Space>
                </Space>
              </Card>
            )
          })}
          <Button icon={<PlusOutlined />} onClick={() => setCfg((c) => ({ ...c, middlewares: [...c.middlewares, mkMw('', 'compress')] }))}>
            {t.addMw}
          </Button>
        </Space>
      </Card>

      <Card title={t.outLabel}>
        <Tabs
          items={[
            {
              key: 'static',
              label: t.staticOutTitle,
              children: (
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  <pre style={preStyle}><code>{staticYaml}</code></pre>
                  <Text type="secondary" style={{ fontSize: 12 }}>{meta(staticYaml)}</Text>
                  {copyBtn('static', staticYaml)}
                </Space>
              ),
            },
            {
              key: 'dyn',
              label: cfg.outMode === 'file' ? t.dynOutTitle : t.labelsOutTitle,
              children: (
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  {dyn ? (
                    <>
                      <pre style={preStyle}><code>{dyn}</code></pre>
                      <Text type="secondary" style={{ fontSize: 12 }}>{meta(dyn)}</Text>
                    </>
                  ) : (
                    <Empty description={t.emptyDyn} />
                  )}
                  {dyn && copyBtn('dyn', dyn)}
                </Space>
              ),
            },
          ]}
        />
      </Card>

      <Card
        title={<><ApartmentOutlined /> {t.flowTitle}</>}
        extra={<Text type="secondary" style={{ fontSize: 12 }}>{t.flowHint}</Text>}
      >
        {cfg.routers.length === 0 ? (
          <Text type="secondary">{t.flowNoRouters}</Text>
        ) : (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            {cfg.routers.map((r) => (
              <div key={r.id}>
                <Space wrap size={[6, 6]} align="center">
                  <Tag color="blue" style={{ fontFamily: 'monospace' }}>{r.rule || '—'}</Tag>
                  <Text type="secondary">→</Text>
                  <Tag>{t.flowEntry}: {r.entryPoints.join(', ') || '—'}</Tag>
                  <Text type="secondary">→</Text>
                  {r.middlewares.length === 0 ? (
                    <Tag>—</Tag>
                  ) : (
                    r.middlewares.map((name, i) => (
                      <React.Fragment key={name + i}>
                        <Tag
                          color="gold"
                          title={mwByName[name] ? mwDef(mwByName[name].type)[lang] : undefined}
                          style={{ fontFamily: 'monospace' }}
                        >
                          {name}
                        </Tag>
                        <Text type="secondary">→</Text>
                      </React.Fragment>
                    ))
                  )}
                  <Tag color="green" style={{ fontFamily: 'monospace' }}>
                    {r.service || '—'}
                  </Tag>
                </Space>
              </div>
            ))}
          </Space>
        )}
      </Card>

      <Card title={t.prioTitle} extra={<Text type="secondary" style={{ fontSize: 12 }}>{t.prioHint}</Text>}>
        {priority.length === 0 ? (
          <Text type="secondary">{t.prioEmpty}</Text>
        ) : (
          <Space direction="vertical" size={4} style={{ width: '100%' }}>
            {priority.map((r, i) => (
              <Space key={r.name + i} wrap align="center" size={[8, 4]}>
                <Tag color={i === 0 ? 'green' : 'default'}>{i + 1}</Tag>
                <Text style={{ fontFamily: 'monospace', fontSize: 12 }}>{r.rule || '—'}</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {r.name} · {r.len} {lang === 'pt' ? 'caracteres' : 'characters'}
                </Text>
              </Space>
            ))}
          </Space>
        )}
      </Card>

      <Card title={t.problemsTitle}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Alert
            type={errs.length ? 'error' : 'success'}
            showIcon
            message={errs.length ? `${errs.length} ${lang === 'pt' ? 'problema(s) bloqueiam a configuração' : 'problem(s) block the config'}` : t.allGood}
            description={
              errs.length ? (
                <Space direction="vertical" size={0}>
                  {errs.map((k) => (
                    <Text key={k} style={{ fontSize: 12 }}>· {t[k]}</Text>
                  ))}
                </Space>
              ) : null
            }
          />
          <Alert
            type={warns.length ? 'warning' : 'info'}
            showIcon
            message={warns.length ? t.warningsTitle : (lang === 'pt' ? 'Nenhum aviso.' : 'No warnings.')}
            description={
              warns.length ? (
                <Space direction="vertical" size={0}>
                  {warns.map((k) => (
                    <Text key={k} style={{ fontSize: 12 }}>· {t[k]}</Text>
                  ))}
                </Space>
              ) : null
            }
          />
        </Space>
      </Card>

      <Card title={t.tipTitle}>
        <Paragraph style={{ marginBottom: 0 }}>{t.tipBody}</Paragraph>
      </Card>

      <Card title={t.howItWorks}>
        <Paragraph type="secondary">{t.howItWorksDesc}</Paragraph>
        <Collapse
          items={[
            {
              key: 'src',
              label: <Text code>traefik-builder.js</Text>,
              children: <pre style={{ margin: 0, fontSize: 12, lineHeight: 1.6 }}>{SOURCE}</pre>,
            },
          ]}
        />
      </Card>
    </Space>
  )
}
