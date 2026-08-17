// OpenTelemetry Collector YAML config generator — 100% client-side, no deps.

function isPlainString(v) {
  return typeof v === 'string' && v.trim() !== ''
}

function trimLines(s) {
  return s.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim()
}

const DEFAULT_RECEIVER = {
  enabled: false,
  grpcEndpoint: '0.0.0.0:4317',
  httpEndpoint: '0.0.0.0:4318',
  endpoint: '0.0.0.0:9411',
  config: `scrape_configs:
  - job_name: 'otel-collector'
    scrape_interval: 10s
    static_configs:
      - targets: ['localhost:8888']`,
}

const DEFAULT_PROCESSOR = {
  enabled: false,
  timeout: '1s',
  sendBatchSize: 1024,
  limitMiB: 512,
  spikeLimitMiB: 64,
  checkInterval: '5s',
  attributes: 'service.name: my-service\nhost.name: ${HOSTNAME}',
}

const DEFAULT_EXPORTER = {
  enabled: false,
  endpoint: '',
  headers: '',
  tlsInsecure: false,
  logLevel: 'info',
  verbosity: 'detailed',
}

const DEFAULT_EXTENSION = {
  enabled: false,
  endpoint: '',
}

const DEFAULT_PIPELINE = {
  enabled: false,
  receivers: [],
  processors: [],
  exporters: [],
}

export const DEFAULTS = {
  comments: true,
  receivers: {
    otlp: { ...DEFAULT_RECEIVER, enabled: true },
    prometheus: { ...DEFAULT_RECEIVER },
    zipkin: { ...DEFAULT_RECEIVER },
    jaeger: { ...DEFAULT_RECEIVER, grpcEndpoint: '0.0.0.0:14250', thriftHttpEndpoint: '0.0.0.0:14268', thriftBinaryEndpoint: '0.0.0.0:6832' },
  },
  processors: {
    batch: { ...DEFAULT_PROCESSOR, enabled: true },
    memoryLimiter: { ...DEFAULT_PROCESSOR },
    resource: { ...DEFAULT_PROCESSOR },
  },
  exporters: {
    otlp: { ...DEFAULT_EXPORTER },
    otlphttp: { ...DEFAULT_EXPORTER },
    prometheusremotewrite: { ...DEFAULT_EXPORTER },
    loki: { ...DEFAULT_EXPORTER, labels: '' },
    jaeger: { ...DEFAULT_EXPORTER },
    zipkin: { ...DEFAULT_EXPORTER },
    logging: { ...DEFAULT_EXPORTER, enabled: true },
  },
  extensions: {
    healthCheck: { ...DEFAULT_EXTENSION, enabled: true, endpoint: '0.0.0.0:13133' },
    pprof: { ...DEFAULT_EXTENSION, endpoint: '0.0.0.0:1777' },
    zpages: { ...DEFAULT_EXTENSION, endpoint: '0.0.0.0:55679' },
  },
  pipelines: {
    traces: { ...DEFAULT_PIPELINE, enabled: true, receivers: ['otlp'], processors: ['batch'], exporters: ['logging'] },
    metrics: { ...DEFAULT_PIPELINE, receivers: [], processors: ['batch'], exporters: ['logging'] },
    logs: { ...DEFAULT_PIPELINE, receivers: [], processors: ['batch'], exporters: ['logging'] },
  },
}

const PRESET_LABELS = {
  minimal: { pt: 'Mínimo', en: 'Minimal' },
  'kubernetes-agent': { pt: 'Agente Kubernetes', en: 'Kubernetes agent' },
  gateway: { pt: 'Gateway', en: 'Gateway' },
  'observability-stack': { pt: 'Stack de Observabilidade', en: 'Observability stack' },
}

function makePreset(base) {
  return {
    label: PRESET_LABELS[base.key],
    comments: true,
    ...base,
  }
}

export const PRESETS = {
  minimal: makePreset({
    key: 'minimal',
    receivers: {
      otlp: { ...DEFAULT_RECEIVER, enabled: true },
      prometheus: { ...DEFAULT_RECEIVER },
      zipkin: { ...DEFAULT_RECEIVER },
      jaeger: { ...DEFAULT_RECEIVER, grpcEndpoint: '0.0.0.0:14250', thriftHttpEndpoint: '0.0.0.0:14268', thriftBinaryEndpoint: '0.0.0.0:6832' },
    },
    processors: {
      batch: { ...DEFAULT_PROCESSOR, enabled: true },
      memoryLimiter: { ...DEFAULT_PROCESSOR },
      resource: { ...DEFAULT_PROCESSOR },
    },
    exporters: {
      otlp: { ...DEFAULT_EXPORTER },
      otlphttp: { ...DEFAULT_EXPORTER },
      prometheusremotewrite: { ...DEFAULT_EXPORTER },
      loki: { ...DEFAULT_EXPORTER, labels: '' },
      jaeger: { ...DEFAULT_EXPORTER },
      zipkin: { ...DEFAULT_EXPORTER },
      logging: { ...DEFAULT_EXPORTER, enabled: true },
    },
    extensions: {
      healthCheck: { ...DEFAULT_EXTENSION },
      pprof: { ...DEFAULT_EXTENSION },
      zpages: { ...DEFAULT_EXTENSION },
    },
    pipelines: {
      traces: { ...DEFAULT_PIPELINE, enabled: true, receivers: ['otlp'], processors: ['batch'], exporters: ['logging'] },
      metrics: { ...DEFAULT_PIPELINE },
      logs: { ...DEFAULT_PIPELINE },
    },
  }),
  'kubernetes-agent': makePreset({
    key: 'kubernetes-agent',
    receivers: {
      otlp: { ...DEFAULT_RECEIVER, enabled: true },
      prometheus: { ...DEFAULT_RECEIVER, enabled: true },
      zipkin: { ...DEFAULT_RECEIVER },
      jaeger: { ...DEFAULT_RECEIVER, grpcEndpoint: '0.0.0.0:14250', thriftHttpEndpoint: '0.0.0.0:14268', thriftBinaryEndpoint: '0.0.0.0:6832' },
    },
    processors: {
      batch: { ...DEFAULT_PROCESSOR, enabled: true },
      memoryLimiter: { ...DEFAULT_PROCESSOR, enabled: true },
      resource: { ...DEFAULT_PROCESSOR, enabled: true, attributes: 'k8s.cluster.name: ${K8S_CLUSTER_NAME}\nk8s.namespace.name: ${K8S_NAMESPACE}' },
    },
    exporters: {
      otlp: { ...DEFAULT_EXPORTER, enabled: true, endpoint: 'otel-gateway:4317', tlsInsecure: true },
      otlphttp: { ...DEFAULT_EXPORTER },
      prometheusremotewrite: { ...DEFAULT_EXPORTER },
      loki: { ...DEFAULT_EXPORTER, labels: '' },
      jaeger: { ...DEFAULT_EXPORTER },
      zipkin: { ...DEFAULT_EXPORTER },
      logging: { ...DEFAULT_EXPORTER, enabled: false },
    },
    extensions: {
      healthCheck: { ...DEFAULT_EXTENSION, enabled: true, endpoint: '0.0.0.0:13133' },
      pprof: { ...DEFAULT_EXTENSION, enabled: true, endpoint: '0.0.0.0:1777' },
      zpages: { ...DEFAULT_EXTENSION },
    },
    pipelines: {
      traces: { ...DEFAULT_PIPELINE, enabled: true, receivers: ['otlp'], processors: ['memory_limiter', 'batch', 'resource'], exporters: ['otlp'] },
      metrics: { ...DEFAULT_PIPELINE, enabled: true, receivers: ['otlp', 'prometheus'], processors: ['memory_limiter', 'batch', 'resource'], exporters: ['otlp'] },
      logs: { ...DEFAULT_PIPELINE, enabled: true, receivers: ['otlp'], processors: ['memory_limiter', 'batch', 'resource'], exporters: ['otlp'] },
    },
  }),
  gateway: makePreset({
    key: 'gateway',
    receivers: {
      otlp: { ...DEFAULT_RECEIVER, enabled: true },
      prometheus: { ...DEFAULT_RECEIVER },
      zipkin: { ...DEFAULT_RECEIVER },
      jaeger: { ...DEFAULT_RECEIVER, grpcEndpoint: '0.0.0.0:14250', thriftHttpEndpoint: '0.0.0.0:14268', thriftBinaryEndpoint: '0.0.0.0:6832' },
    },
    processors: {
      batch: { ...DEFAULT_PROCESSOR, enabled: true },
      memoryLimiter: { ...DEFAULT_PROCESSOR, enabled: true },
      resource: { ...DEFAULT_PROCESSOR },
    },
    exporters: {
      otlp: { ...DEFAULT_EXPORTER, enabled: true, endpoint: 'jaeger:4317', tlsInsecure: true },
      otlphttp: { ...DEFAULT_EXPORTER },
      prometheusremotewrite: { ...DEFAULT_EXPORTER, enabled: true, endpoint: 'http://prometheus:9090/api/v1/write' },
      loki: { ...DEFAULT_EXPORTER, enabled: true, endpoint: 'http://loki:3100/loki/api/v1/push' },
      jaeger: { ...DEFAULT_EXPORTER },
      zipkin: { ...DEFAULT_EXPORTER },
      logging: { ...DEFAULT_EXPORTER, enabled: false },
    },
    extensions: {
      healthCheck: { ...DEFAULT_EXTENSION, enabled: true, endpoint: '0.0.0.0:13133' },
      pprof: { ...DEFAULT_EXTENSION, enabled: true, endpoint: '0.0.0.0:1777' },
      zpages: { ...DEFAULT_EXTENSION, enabled: true, endpoint: '0.0.0.0:55679' },
    },
    pipelines: {
      traces: { ...DEFAULT_PIPELINE, enabled: true, receivers: ['otlp', 'zipkin', 'jaeger'], processors: ['memory_limiter', 'batch'], exporters: ['otlp'] },
      metrics: { ...DEFAULT_PIPELINE, enabled: true, receivers: ['otlp'], processors: ['memory_limiter', 'batch'], exporters: ['prometheusremotewrite'] },
      logs: { ...DEFAULT_PIPELINE, enabled: true, receivers: ['otlp'], processors: ['memory_limiter', 'batch'], exporters: ['loki'] },
    },
  }),
  'observability-stack': makePreset({
    key: 'observability-stack',
    receivers: {
      otlp: { ...DEFAULT_RECEIVER, enabled: true },
      prometheus: { ...DEFAULT_RECEIVER, enabled: true },
      zipkin: { ...DEFAULT_RECEIVER },
      jaeger: { ...DEFAULT_RECEIVER, grpcEndpoint: '0.0.0.0:14250', thriftHttpEndpoint: '0.0.0.0:14268', thriftBinaryEndpoint: '0.0.0.0:6832' },
    },
    processors: {
      batch: { ...DEFAULT_PROCESSOR, enabled: true },
      memoryLimiter: { ...DEFAULT_PROCESSOR, enabled: true },
      resource: { ...DEFAULT_PROCESSOR, enabled: true, attributes: 'deployment.environment: production\nhost.name: ${HOSTNAME}' },
    },
    exporters: {
      otlp: { ...DEFAULT_EXPORTER },
      otlphttp: { ...DEFAULT_EXPORTER },
      prometheusremotewrite: { ...DEFAULT_EXPORTER, enabled: true, endpoint: 'http://prometheus:9090/api/v1/write' },
      loki: { ...DEFAULT_EXPORTER, enabled: true, endpoint: 'http://loki:3100/loki/api/v1/push', labels: 'job: otel-collector' },
      jaeger: { ...DEFAULT_EXPORTER, enabled: true, endpoint: 'jaeger:14250', tlsInsecure: true },
      zipkin: { ...DEFAULT_EXPORTER },
      logging: { ...DEFAULT_EXPORTER, enabled: true },
    },
    extensions: {
      healthCheck: { ...DEFAULT_EXTENSION, enabled: true, endpoint: '0.0.0.0:13133' },
      pprof: { ...DEFAULT_EXTENSION, enabled: true, endpoint: '0.0.0.0:1777' },
      zpages: { ...DEFAULT_EXTENSION },
    },
    pipelines: {
      traces: { ...DEFAULT_PIPELINE, enabled: true, receivers: ['otlp', 'jaeger'], processors: ['memory_limiter', 'batch', 'resource'], exporters: ['jaeger', 'logging'] },
      metrics: { ...DEFAULT_PIPELINE, enabled: true, receivers: ['otlp', 'prometheus'], processors: ['memory_limiter', 'batch', 'resource'], exporters: ['prometheusremotewrite', 'logging'] },
      logs: { ...DEFAULT_PIPELINE, enabled: true, receivers: ['otlp'], processors: ['memory_limiter', 'batch', 'resource'], exporters: ['loki', 'logging'] },
    },
  }),
}

function renderYamlValue(value, indent) {
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (typeof value === 'number') return String(value)
  if (typeof value === 'string' && value.includes('\n')) {
    const pad = '  '.repeat(indent)
    return '|\n' + value.split('\n').map((line) => pad + '  ' + line).join('\n')
  }
  return String(value)
}

function renderBlock(obj, indent) {
  const pad = '  '.repeat(indent)
  const lines = []
  for (const [key, value] of Object.entries(obj)) {
    if (value == null) continue
    if (Array.isArray(value)) {
      if (value.length === 0) continue
      lines.push(`${pad}${key}:`)
      value.forEach((item) => {
        if (item && typeof item === 'object') {
          const ks = Object.keys(item)
          if (ks.length === 0) return
          lines.push(`${pad}  - ${ks[0]}: ${renderYamlValue(item[ks[0]], indent + 1)}`)
          ks.slice(1).forEach((k) => lines.push(`${pad}    ${k}: ${renderYamlValue(item[k], indent + 1)}`))
        } else {
          lines.push(`${pad}  - ${renderYamlValue(item, indent)}`)
        }
      })
    } else if (typeof value === 'object') {
      const inner = renderBlock(value, indent + 1)
      if (inner) {
        lines.push(`${pad}${key}:`)
        lines.push(inner)
      }
    } else {
      lines.push(`${pad}${key}: ${renderYamlValue(value, indent)}`)
    }
  }
  return lines.join('\n')
}

function toNumber(v) {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

function parseHeaders(headers) {
  if (!isPlainString(headers)) return null
  const out = {}
  headers.split('\n').forEach((line) => {
    const idx = line.indexOf(':')
    if (idx > 0) out[line.slice(0, idx).trim()] = line.slice(idx + 1).trim()
  })
  return Object.keys(out).length ? out : null
}

function buildReceivers(o) {
  const r = o.receivers
  const out = []
  if (r.otlp?.enabled) {
    const otlp = { protocols: {} }
    if (isPlainString(r.otlp.grpcEndpoint)) otlp.protocols.grpc = { endpoint: r.otlp.grpcEndpoint.trim() }
    if (isPlainString(r.otlp.httpEndpoint)) otlp.protocols.http = { endpoint: r.otlp.httpEndpoint.trim() }
    if (Object.keys(otlp.protocols).length) out.push({ key: 'otlp', value: otlp })
  }
  if (r.prometheus?.enabled && isPlainString(r.prometheus.config)) {
    out.push({ key: 'prometheus', value: { config: r.prometheus.config.trim() } })
  }
  if (r.zipkin?.enabled && isPlainString(r.zipkin.endpoint)) {
    out.push({ key: 'zipkin', value: { endpoint: r.zipkin.endpoint.trim() } })
  }
  if (r.jaeger?.enabled) {
    const jaeger = { protocols: {} }
    if (isPlainString(r.jaeger.grpcEndpoint)) jaeger.protocols.grpc = { endpoint: r.jaeger.grpcEndpoint.trim() }
    if (isPlainString(r.jaeger.thriftHttpEndpoint)) jaeger.protocols.thrift_http = { endpoint: r.jaeger.thriftHttpEndpoint.trim() }
    if (isPlainString(r.jaeger.thriftBinaryEndpoint)) jaeger.protocols.thrift_binary = { endpoint: r.jaeger.thriftBinaryEndpoint.trim() }
    if (Object.keys(jaeger.protocols).length) out.push({ key: 'jaeger', value: jaeger })
  }
  return out
}

function buildProcessors(o) {
  const p = o.processors
  const out = []
  if (p.batch?.enabled) {
    const batch = {}
    if (isPlainString(p.batch.timeout)) batch.timeout = p.batch.timeout.trim()
    const sendBatchSize = toNumber(p.batch.sendBatchSize)
    if (sendBatchSize > 0) batch.send_batch_size = sendBatchSize
    out.push({ key: 'batch', value: batch })
  }
  if (p.memoryLimiter?.enabled) {
    const ml = {}
    const limitMiB = toNumber(p.memoryLimiter.limitMiB)
    const spikeLimitMiB = toNumber(p.memoryLimiter.spikeLimitMiB)
    if (limitMiB > 0) ml.limit_mib = limitMiB
    if (spikeLimitMiB > 0) ml.spike_limit_mib = spikeLimitMiB
    if (isPlainString(p.memoryLimiter.checkInterval)) ml.check_interval = p.memoryLimiter.checkInterval.trim()
    out.push({ key: 'memory_limiter', value: ml })
  }
  if (p.resource?.enabled && isPlainString(p.resource.attributes)) {
    const attrs = p.resource.attributes.split('\n').map((l) => l.trim()).filter(Boolean).map((l) => {
      const idx = l.indexOf(':')
      return idx > 0 ? { key: l.slice(0, idx).trim(), value: l.slice(idx + 1).trim() } : null
    }).filter(Boolean)
    if (attrs.length) out.push({ key: 'resource', value: { attributes: attrs } })
  }
  return out
}

function buildExporters(o) {
  const e = o.exporters
  const out = []
  if (e.otlp?.enabled && isPlainString(e.otlp.endpoint)) {
    const obj = { endpoint: e.otlp.endpoint.trim() }
    if (e.otlp.tlsInsecure) obj.tls = { insecure: true }
    const headers = parseHeaders(e.otlp.headers)
    if (headers) obj.headers = headers
    out.push({ key: 'otlp', value: obj })
  }
  if (e.otlphttp?.enabled && isPlainString(e.otlphttp.endpoint)) {
    const obj = { endpoint: e.otlphttp.endpoint.trim() }
    const headers = parseHeaders(e.otlphttp.headers)
    if (headers) obj.headers = headers
    out.push({ key: 'otlphttp', value: obj })
  }
  if (e.prometheusremotewrite?.enabled && isPlainString(e.prometheusremotewrite.endpoint)) {
    const obj = { endpoint: e.prometheusremotewrite.endpoint.trim() }
    const headers = parseHeaders(e.prometheusremotewrite.headers)
    if (headers) obj.headers = headers
    out.push({ key: 'prometheusremotewrite', value: obj })
  }
  if (e.loki?.enabled && isPlainString(e.loki.endpoint)) {
    const obj = { endpoint: e.loki.endpoint.trim() }
    const headers = parseHeaders(e.loki.headers)
    if (headers) obj.headers = headers
    if (isPlainString(e.loki.labels)) {
      obj.labels = {}
      e.loki.labels.split('\n').forEach((line) => {
        const idx = line.indexOf(':')
        if (idx > 0) obj.labels[line.slice(0, idx).trim()] = line.slice(idx + 1).trim()
      })
    }
    out.push({ key: 'loki', value: obj })
  }
  if (e.jaeger?.enabled && isPlainString(e.jaeger.endpoint)) {
    const obj = { endpoint: e.jaeger.endpoint.trim() }
    if (e.jaeger.tlsInsecure) obj.tls = { insecure: true }
    out.push({ key: 'jaeger', value: obj })
  }
  if (e.zipkin?.enabled && isPlainString(e.zipkin.endpoint)) {
    out.push({ key: 'zipkin', value: { endpoint: e.zipkin.endpoint.trim() } })
  }
  if (e.logging?.enabled) {
    const obj = {}
    if (isPlainString(e.logging.logLevel)) obj.loglevel = e.logging.logLevel.trim()
    if (isPlainString(e.logging.verbosity)) obj.verbosity = e.logging.verbosity.trim()
    out.push({ key: 'logging', value: obj })
  }
  return out
}

function buildExtensions(o) {
  const ex = o.extensions
  const out = []
  if (ex.healthCheck?.enabled) {
    const obj = {}
    if (isPlainString(ex.healthCheck.endpoint)) obj.endpoint = ex.healthCheck.endpoint.trim()
    out.push({ key: 'health_check', value: obj })
  }
  if (ex.pprof?.enabled) {
    const obj = {}
    if (isPlainString(ex.pprof.endpoint)) obj.endpoint = ex.pprof.endpoint.trim()
    out.push({ key: 'pprof', value: obj })
  }
  if (ex.zpages?.enabled) {
    const obj = {}
    if (isPlainString(ex.zpages.endpoint)) obj.endpoint = ex.zpages.endpoint.trim()
    out.push({ key: 'zpages', value: obj })
  }
  return out
}

function buildPipelines(o, activeReceivers, activeProcessors, activeExporters) {
  const receiverKeys = new Set(activeReceivers.map((r) => r.key))
  const processorKeys = new Set(activeProcessors.map((p) => p.key))
  const exporterKeys = new Set(activeExporters.map((e) => e.key))
  const out = {}
  ;['traces', 'metrics', 'logs'].forEach((kind) => {
    const p = o.pipelines[kind]
    if (!p?.enabled) return
    const recs = (p.receivers || []).filter((k) => receiverKeys.has(k))
    const procs = (p.processors || []).filter((k) => processorKeys.has(k))
    const exps = (p.exporters || []).filter((k) => exporterKeys.has(k))
    if (recs.length || procs.length || exps.length) {
      out[kind] = { receivers: recs, processors: procs, exporters: exps }
    }
  })
  return out
}

export function buildOtelConfig(o) {
  const lines = []
  const comments = !!o.comments

  const activeReceivers = buildReceivers(o)
  const activeProcessors = buildProcessors(o)
  const activeExporters = buildExporters(o)
  const activeExtensions = buildExtensions(o)
  const pipelines = buildPipelines(o, activeReceivers, activeProcessors, activeExporters)

  const pushSection = (title, items, comment) => {
    if (!items.length) return
    if (comments && comment) lines.push(`# ${comment}`)
    lines.push(`${title}:`)
    items.forEach((item) => {
      const block = renderBlock(item.value, 2)
      lines.push(`  ${item.key}:`)
      if (block) lines.push(block)
    })
    lines.push('')
  }

  pushSection('receivers', activeReceivers, 'Receivers: where telemetry data enters the collector.')
  pushSection('processors', activeProcessors, 'Processors: transform, batch or filter telemetry.')
  pushSection('exporters', activeExporters, 'Exporters: where telemetry data leaves the collector.')
  pushSection('extensions', activeExtensions, 'Extensions: observability and management endpoints.')

  if (Object.keys(pipelines).length) {
    if (comments) lines.push('# Pipelines: connect receivers, processors and exporters.')
    lines.push('service:')
    lines.push('  pipelines:')
    for (const [kind, p] of Object.entries(pipelines)) {
      lines.push(`    ${kind}:`)
      ;['receivers', 'processors', 'exporters'].forEach((section) => {
        const arr = p[section]
        if (arr && arr.length) {
          lines.push(`      ${section}:`)
          arr.forEach((item) => lines.push(`        - ${item}`))
        }
      })
    }
    if (activeExtensions.length) {
      lines.push('  extensions:')
      activeExtensions.forEach((e) => lines.push(`    - ${e.key}`))
    }
    lines.push('')
  }

  return { text: trimLines(lines.join('\n')), fileName: 'otel-collector-config.yaml' }
}

export function validateOtelConfig(o, t) {
  const warnings = []
  const activeReceivers = buildReceivers(o)
  const activeExporters = buildExporters(o)

  if (activeReceivers.length === 0) warnings.push(t.wNoReceiver || 'No active receiver.')
  if (activeExporters.length === 0) warnings.push(t.wNoExporter || 'No active exporter.')

  ;['traces', 'metrics', 'logs'].forEach((kind) => {
    const p = o.pipelines[kind]
    if (!p?.enabled) return
    const name = kind
    if (!p.receivers || p.receivers.length === 0) {
      warnings.push((t.wPipelineEmpty || 'Pipeline {pipeline} has no receiver.').replace('{pipeline}', name))
    }
    if (!p.exporters || p.exporters.length === 0) {
      warnings.push((t.wPipelineEmptyExporter || 'Pipeline {pipeline} has no exporter.').replace('{pipeline}', name))
    }
  })

  return warnings
}
