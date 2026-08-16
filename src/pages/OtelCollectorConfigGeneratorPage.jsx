import React, { useMemo, useState } from 'react'
import {
  Typography,
  Card,
  Space,
  Input,
  Select,
  Switch,
  Button,
  Alert,
  Collapse,
  Row,
  Col,
  Segmented,
  message,
} from 'antd'
import {
  ContainerOutlined,
  CopyOutlined,
  CheckOutlined,
  DownloadOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  PRESETS,
  DEFAULTS,
  buildOtelConfig,
  validateOtelConfig,
} from '../utils/otelCollectorConfigGenerator'
import sourceCode from '../utils/otelCollectorConfigGenerator.js?raw'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input
const { Panel } = Collapse

const translations = {
  pt: {
    title: 'Gerador de Configuração do OpenTelemetry Collector',
    intro: (
      <>
        Monte arquivos <Text code>otel-collector-config.yaml</Text> com receivers, processors,
        exporters, extensions e pipelines. Tudo no navegador — nenhuma configuração sai da
        máquina.
      </>
    ),
    presetsTitle: 'Modelo',
    presetsHint: 'Escolha um ponto de partida e edite à vontade.',
    receiversSection: 'Receivers',
    processorsSection: 'Processors',
    exportersSection: 'Exporters',
    extensionsSection: 'Extensions',
    pipelinesSection: 'Pipelines',
    otlpLabel: 'OTLP',
    otlpGrpcEndpoint: 'Endpoint gRPC',
    otlpHttpEndpoint: 'Endpoint HTTP',
    prometheusLabel: 'Prometheus (scraping)',
    prometheusConfig: 'Configuração de scrape (YAML)',
    zipkinLabel: 'Zipkin',
    zipkinEndpoint: 'Endpoint',
    jaegerLabel: 'Jaeger',
    jaegerGrpcEndpoint: 'Endpoint gRPC',
    jaegerThriftHttpEndpoint: 'Endpoint Thrift HTTP',
    jaegerThriftBinaryEndpoint: 'Endpoint Thrift binary',
    batchLabel: 'Batch',
    batchTimeout: 'Timeout',
    batchSendBatchSize: 'Tamanho do lote (send_batch_size)',
    memoryLimiterLabel: 'Memory limiter',
    memoryLimiterLimit: 'Limite (MiB)',
    memoryLimiterSpike: 'Spike limit (MiB)',
    memoryLimiterCheckInterval: 'Intervalo de checagem',
    resourceLabel: 'Resource attributes',
    resourceAttributes: 'Atributos (um por linha, chave: valor)',
    exporterOtlpLabel: 'OTLP (gRPC)',
    exporterOtlphttpLabel: 'OTLP/HTTP',
    exporterPrometheusremotewriteLabel: 'Prometheus remote write',
    exporterLokiLabel: 'Loki',
    exporterJaegerLabel: 'Jaeger (gRPC)',
    exporterZipkinLabel: 'Zipkin',
    exporterLoggingLabel: 'Logging',
    endpointLabel: 'Endpoint',
    headersLabel: 'Headers (um por linha, chave: valor)',
    labelsLabel: 'Labels (um por linha, chave: valor)',
    tlsInsecureLabel: 'TLS inseguro',
    logLevelLabel: 'Log level',
    verbosityLabel: 'Verbosity',
    healthCheckLabel: 'Health check',
    pprofLabel: 'pprof',
    zpagesLabel: 'zpages',
    tracesPipeline: 'Traces',
    metricsPipeline: 'Metrics',
    logsPipeline: 'Logs',
    pipelineReceivers: 'Receivers',
    pipelineProcessors: 'Processors',
    pipelineExporters: 'Exporters',
    commentsLabel: 'Incluir comentários no YAML',
    outTitle: 'Configuração gerada',
    copy: 'Copiar',
    copied: 'Copiado!',
    copyErr: 'Não foi possível copiar',
    download: 'Baixar',
    stats: (lines, bytes) => `${lines} ${lines === 1 ? 'linha' : 'linhas'} · ${bytes} ${bytes === 1 ? 'byte' : 'bytes'}`,
    warningsTitle: 'Avisos — confira antes de usar:',
    warningsNone: 'Nenhum aviso. Valide com o collector antes de subir.',
    wNoReceiver: 'Nenhum receiver ativo.',
    wNoExporter: 'Nenhum exporter ativo.',
    wPipelineEmpty: 'Pipeline {pipeline} não possui receiver.',
    wPipelineEmptyExporter: 'Pipeline {pipeline} não possui exporter.',
    tipTitle: 'Dicas de uso',
    tipBody: (
      <>
        Salve o arquivo como <Text code>otel-collector-config.yaml</Text> e valide antes de subir:
        <pre style={{ margin: '8px 0', fontSize: 12, lineHeight: 1.6 }}>{'otelcol --config=otel-collector-config.yaml --dry-run'}</pre>
        Em containers, monte o arquivo como volume em <Text code>/etc/otelcol-config.yaml</Text>.
      </>
    ),
    howTitle: 'Como funciona — algoritmo-fonte',
    howDesc: 'O builder varre as seções habilitadas e monta o YAML linha a linha, incluindo apenas diretivas preenchidas. O validador alerta sobre receivers/exporters ausentes e pipelines vazios.',
  },
  en: {
    title: 'OpenTelemetry Collector Config Generator',
    intro: (
      <>
        Build <Text code>otel-collector-config.yaml</Text> files with receivers, processors,
        exporters, extensions and pipelines. All in the browser — no configuration leaves the
        machine.
      </>
    ),
    presetsTitle: 'Template',
    presetsHint: 'Pick a starting point and edit freely.',
    receiversSection: 'Receivers',
    processorsSection: 'Processors',
    exportersSection: 'Exporters',
    extensionsSection: 'Extensions',
    pipelinesSection: 'Pipelines',
    otlpLabel: 'OTLP',
    otlpGrpcEndpoint: 'gRPC endpoint',
    otlpHttpEndpoint: 'HTTP endpoint',
    prometheusLabel: 'Prometheus (scraping)',
    prometheusConfig: 'Scrape config (YAML)',
    zipkinLabel: 'Zipkin',
    zipkinEndpoint: 'Endpoint',
    jaegerLabel: 'Jaeger',
    jaegerGrpcEndpoint: 'gRPC endpoint',
    jaegerThriftHttpEndpoint: 'Thrift HTTP endpoint',
    jaegerThriftBinaryEndpoint: 'Thrift binary endpoint',
    batchLabel: 'Batch',
    batchTimeout: 'Timeout',
    batchSendBatchSize: 'Batch size (send_batch_size)',
    memoryLimiterLabel: 'Memory limiter',
    memoryLimiterLimit: 'Limit (MiB)',
    memoryLimiterSpike: 'Spike limit (MiB)',
    memoryLimiterCheckInterval: 'Check interval',
    resourceLabel: 'Resource attributes',
    resourceAttributes: 'Attributes (one per line, key: value)',
    exporterOtlpLabel: 'OTLP (gRPC)',
    exporterOtlphttpLabel: 'OTLP/HTTP',
    exporterPrometheusremotewriteLabel: 'Prometheus remote write',
    exporterLokiLabel: 'Loki',
    exporterJaegerLabel: 'Jaeger (gRPC)',
    exporterZipkinLabel: 'Zipkin',
    exporterLoggingLabel: 'Logging',
    endpointLabel: 'Endpoint',
    headersLabel: 'Headers (one per line, key: value)',
    labelsLabel: 'Labels (one per line, key: value)',
    tlsInsecureLabel: 'Insecure TLS',
    logLevelLabel: 'Log level',
    verbosityLabel: 'Verbosity',
    healthCheckLabel: 'Health check',
    pprofLabel: 'pprof',
    zpagesLabel: 'zpages',
    tracesPipeline: 'Traces',
    metricsPipeline: 'Metrics',
    logsPipeline: 'Logs',
    pipelineReceivers: 'Receivers',
    pipelineProcessors: 'Processors',
    pipelineExporters: 'Exporters',
    commentsLabel: 'Include comments in YAML',
    outTitle: 'Generated config',
    copy: 'Copy',
    copied: 'Copied!',
    copyErr: 'Could not copy',
    download: 'Download',
    stats: (lines, bytes) => `${lines} ${lines === 1 ? 'line' : 'lines'} · ${bytes} ${bytes === 1 ? 'byte' : 'bytes'}`,
    warningsTitle: 'Warnings — review before using:',
    warningsNone: 'No warnings. Validate with the collector before deploying.',
    wNoReceiver: 'No active receiver.',
    wNoExporter: 'No active exporter.',
    wPipelineEmpty: 'Pipeline {pipeline} has no receiver.',
    wPipelineEmptyExporter: 'Pipeline {pipeline} has no exporter.',
    tipTitle: 'Usage tips',
    tipBody: (
      <>
        Save the file as <Text code>otel-collector-config.yaml</Text> and validate before deploying:
        <pre style={{ margin: '8px 0', fontSize: 12, lineHeight: 1.6 }}>{'otelcol --config=otel-collector-config.yaml --dry-run'}</pre>
        In containers, mount the file as a volume at <Text code>/etc/otelcol-config.yaml</Text>.
      </>
    ),
    howTitle: 'How it works — source code',
    howDesc: 'The builder scans enabled sections and assembles YAML line by line, including only filled directives. The validator warns about missing receivers/exporters and empty pipelines.',
  },
}

export default function OtelCollectorConfigGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [options, setOptions] = useState(DEFAULTS)
  const [selectedPreset, setSelectedPreset] = useState('minimal')
  const [copied, setCopied] = useState(false)

  const setPath = (path, value) => {
    setOptions((prev) => {
      const next = { ...prev }
      let cur = next
      for (let i = 0; i < path.length - 1; i++) {
        cur[path[i]] = { ...cur[path[i]] }
        cur = cur[path[i]]
      }
      cur[path[path.length - 1]] = value
      return next
    })
  }

  const applyPreset = (key) => {
    setSelectedPreset(key)
    setOptions({ ...PRESETS[key] })
  }

  const presetOptions = useMemo(
    () => Object.keys(PRESETS).map((k) => ({ label: PRESETS[k].label[lang], value: k })),
    [lang]
  )

  const receiverOptions = useMemo(() => {
    const r = options.receivers
    const opts = []
    if (r.otlp.enabled) opts.push({ value: 'otlp', label: 'OTLP' })
    if (r.prometheus.enabled) opts.push({ value: 'prometheus', label: 'Prometheus' })
    if (r.zipkin.enabled) opts.push({ value: 'zipkin', label: 'Zipkin' })
    if (r.jaeger.enabled) opts.push({ value: 'jaeger', label: 'Jaeger' })
    return opts
  }, [options.receivers])

  const processorOptions = useMemo(() => {
    const p = options.processors
    const opts = []
    if (p.batch.enabled) opts.push({ value: 'batch', label: 'Batch' })
    if (p.memoryLimiter.enabled) opts.push({ value: 'memory_limiter', label: 'Memory limiter' })
    if (p.resource.enabled) opts.push({ value: 'resource', label: 'Resource' })
    return opts
  }, [options.processors])

  const exporterOptions = useMemo(() => {
    const e = options.exporters
    const opts = []
    if (e.otlp.enabled) opts.push({ value: 'otlp', label: 'OTLP (gRPC)' })
    if (e.otlphttp.enabled) opts.push({ value: 'otlphttp', label: 'OTLP/HTTP' })
    if (e.prometheusremotewrite.enabled) opts.push({ value: 'prometheusremotewrite', label: 'Prometheus remote write' })
    if (e.loki.enabled) opts.push({ value: 'loki', label: 'Loki' })
    if (e.jaeger.enabled) opts.push({ value: 'jaeger', label: 'Jaeger (gRPC)' })
    if (e.zipkin.enabled) opts.push({ value: 'zipkin', label: 'Zipkin' })
    if (e.logging.enabled) opts.push({ value: 'logging', label: 'Logging' })
    return opts
  }, [options.exporters])

  const output = useMemo(() => {
    const { text, fileName } = buildOtelConfig(options)
    const warnings = validateOtelConfig(options, t)
    const lines = text ? text.split('\n').length : 0
    const bytes = new TextEncoder().encode(text).length
    return { text, fileName, warnings, lines, bytes }
  }, [options, t])

  const copy = () => {
    navigator.clipboard.writeText(output.text).then(
      () => {
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      },
      () => message.error(t.copyErr)
    )
  }

  const download = () => {
    const blob = new Blob([output.text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = output.fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const PipelineBlock = ({ kind }) => {
    const p = options.pipelines[kind]
    return (
      <Card size="small" title={t[`${kind}Pipeline`]} style={{ marginBottom: 12 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Space>
            <Switch checked={p.enabled} onChange={(v) => setPath(['pipelines', kind, 'enabled'], v)} />
            <Text>{t[`${kind}Pipeline`]}</Text>
          </Space>
          {p.enabled && (
            <Row gutter={[16, 16]}>
              <Col xs={24} md={8}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Text strong>{t.pipelineReceivers}</Text>
                  <Select
                    mode="multiple"
                    allowClear
                    placeholder={t.pipelineReceivers}
                    value={p.receivers}
                    options={receiverOptions}
                    onChange={(v) => setPath(['pipelines', kind, 'receivers'], v)}
                    style={{ width: '100%' }}
                  />
                </Space>
              </Col>
              <Col xs={24} md={8}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Text strong>{t.pipelineProcessors}</Text>
                  <Select
                    mode="multiple"
                    allowClear
                    placeholder={t.pipelineProcessors}
                    value={p.processors}
                    options={processorOptions}
                    onChange={(v) => setPath(['pipelines', kind, 'processors'], v)}
                    style={{ width: '100%' }}
                  />
                </Space>
              </Col>
              <Col xs={24} md={8}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Text strong>{t.pipelineExporters}</Text>
                  <Select
                    mode="multiple"
                    allowClear
                    placeholder={t.pipelineExporters}
                    value={p.exporters}
                    options={exporterOptions}
                    onChange={(v) => setPath(['pipelines', kind, 'exporters'], v)}
                    style={{ width: '100%' }}
                  />
                </Space>
              </Col>
            </Row>
          )}
        </Space>
      </Card>
    )
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><ContainerOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card title={t.presetsTitle} extra={<Text type="secondary" style={{ fontSize: 12 }}>{t.presetsHint}</Text>}>
        <Segmented
          value={selectedPreset}
          onChange={applyPreset}
          options={presetOptions}
        />
      </Card>

      <Card title={t.receiversSection}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Card size="small" title={t.otlpLabel}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Space>
                <Switch checked={options.receivers.otlp.enabled} onChange={(v) => setPath(['receivers', 'otlp', 'enabled'], v)} />
                <Text>{t.otlpLabel}</Text>
              </Space>
              {options.receivers.otlp.enabled && (
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12}>
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Text strong>{t.otlpGrpcEndpoint}</Text>
                      <Input
                        value={options.receivers.otlp.grpcEndpoint}
                        onChange={(e) => setPath(['receivers', 'otlp', 'grpcEndpoint'], e.target.value)}
                      />
                    </Space>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Text strong>{t.otlpHttpEndpoint}</Text>
                      <Input
                        value={options.receivers.otlp.httpEndpoint}
                        onChange={(e) => setPath(['receivers', 'otlp', 'httpEndpoint'], e.target.value)}
                      />
                    </Space>
                  </Col>
                </Row>
              )}
            </Space>
          </Card>

          <Card size="small" title={t.prometheusLabel}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Space>
                <Switch checked={options.receivers.prometheus.enabled} onChange={(v) => setPath(['receivers', 'prometheus', 'enabled'], v)} />
                <Text>{t.prometheusLabel}</Text>
              </Space>
              {options.receivers.prometheus.enabled && (
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Text strong>{t.prometheusConfig}</Text>
                  <TextArea
                    value={options.receivers.prometheus.config}
                    onChange={(e) => setPath(['receivers', 'prometheus', 'config'], e.target.value)}
                    rows={4}
                    style={{ fontFamily: 'monospace', fontSize: 12 }}
                  />
                </Space>
              )}
            </Space>
          </Card>

          <Card size="small" title={t.zipkinLabel}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Space>
                <Switch checked={options.receivers.zipkin.enabled} onChange={(v) => setPath(['receivers', 'zipkin', 'enabled'], v)} />
                <Text>{t.zipkinLabel}</Text>
              </Space>
              {options.receivers.zipkin.enabled && (
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Text strong>{t.zipkinEndpoint}</Text>
                  <Input
                    value={options.receivers.zipkin.endpoint}
                    onChange={(e) => setPath(['receivers', 'zipkin', 'endpoint'], e.target.value)}
                  />
                </Space>
              )}
            </Space>
          </Card>

          <Card size="small" title={t.jaegerLabel}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Space>
                <Switch checked={options.receivers.jaeger.enabled} onChange={(v) => setPath(['receivers', 'jaeger', 'enabled'], v)} />
                <Text>{t.jaegerLabel}</Text>
              </Space>
              {options.receivers.jaeger.enabled && (
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={8}>
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Text strong>{t.jaegerGrpcEndpoint}</Text>
                      <Input
                        value={options.receivers.jaeger.grpcEndpoint}
                        onChange={(e) => setPath(['receivers', 'jaeger', 'grpcEndpoint'], e.target.value)}
                      />
                    </Space>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Text strong>{t.jaegerThriftHttpEndpoint}</Text>
                      <Input
                        value={options.receivers.jaeger.thriftHttpEndpoint}
                        onChange={(e) => setPath(['receivers', 'jaeger', 'thriftHttpEndpoint'], e.target.value)}
                      />
                    </Space>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Text strong>{t.jaegerThriftBinaryEndpoint}</Text>
                      <Input
                        value={options.receivers.jaeger.thriftBinaryEndpoint}
                        onChange={(e) => setPath(['receivers', 'jaeger', 'thriftBinaryEndpoint'], e.target.value)}
                      />
                    </Space>
                  </Col>
                </Row>
              )}
            </Space>
          </Card>
        </Space>
      </Card>

      <Card title={t.processorsSection}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Card size="small" title={t.batchLabel}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Space>
                <Switch checked={options.processors.batch.enabled} onChange={(v) => setPath(['processors', 'batch', 'enabled'], v)} />
                <Text>{t.batchLabel}</Text>
              </Space>
              {options.processors.batch.enabled && (
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12}>
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Text strong>{t.batchTimeout}</Text>
                      <Input
                        value={options.processors.batch.timeout}
                        onChange={(e) => setPath(['processors', 'batch', 'timeout'], e.target.value)}
                      />
                    </Space>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Text strong>{t.batchSendBatchSize}</Text>
                      <Input
                        type="number"
                        min={1}
                        value={options.processors.batch.sendBatchSize}
                        onChange={(e) => setPath(['processors', 'batch', 'sendBatchSize'], Number(e.target.value))}
                      />
                    </Space>
                  </Col>
                </Row>
              )}
            </Space>
          </Card>

          <Card size="small" title={t.memoryLimiterLabel}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Space>
                <Switch checked={options.processors.memoryLimiter.enabled} onChange={(v) => setPath(['processors', 'memoryLimiter', 'enabled'], v)} />
                <Text>{t.memoryLimiterLabel}</Text>
              </Space>
              {options.processors.memoryLimiter.enabled && (
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={8}>
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Text strong>{t.memoryLimiterLimit}</Text>
                      <Input
                        type="number"
                        min={1}
                        value={options.processors.memoryLimiter.limitMiB}
                        onChange={(e) => setPath(['processors', 'memoryLimiter', 'limitMiB'], Number(e.target.value))}
                      />
                    </Space>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Text strong>{t.memoryLimiterSpike}</Text>
                      <Input
                        type="number"
                        min={1}
                        value={options.processors.memoryLimiter.spikeLimitMiB}
                        onChange={(e) => setPath(['processors', 'memoryLimiter', 'spikeLimitMiB'], Number(e.target.value))}
                      />
                    </Space>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Text strong>{t.memoryLimiterCheckInterval}</Text>
                      <Input
                        value={options.processors.memoryLimiter.checkInterval}
                        onChange={(e) => setPath(['processors', 'memoryLimiter', 'checkInterval'], e.target.value)}
                      />
                    </Space>
                  </Col>
                </Row>
              )}
            </Space>
          </Card>

          <Card size="small" title={t.resourceLabel}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Space>
                <Switch checked={options.processors.resource.enabled} onChange={(v) => setPath(['processors', 'resource', 'enabled'], v)} />
                <Text>{t.resourceLabel}</Text>
              </Space>
              {options.processors.resource.enabled && (
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Text strong>{t.resourceAttributes}</Text>
                  <TextArea
                    value={options.processors.resource.attributes}
                    onChange={(e) => setPath(['processors', 'resource', 'attributes'], e.target.value)}
                    rows={3}
                    style={{ fontFamily: 'monospace', fontSize: 12 }}
                  />
                </Space>
              )}
            </Space>
          </Card>
        </Space>
      </Card>

      <Card title={t.exportersSection}>
        <Space direction="vertical" style={{ width: '100%' }}>
          {[
            { key: 'otlp', label: t.exporterOtlpLabel, tls: true },
            { key: 'otlphttp', label: t.exporterOtlphttpLabel, tls: false },
            { key: 'prometheusremotewrite', label: t.exporterPrometheusremotewriteLabel, tls: false },
            { key: 'loki', label: t.exporterLokiLabel, tls: false, labels: true },
            { key: 'jaeger', label: t.exporterJaegerLabel, tls: true },
            { key: 'zipkin', label: t.exporterZipkinLabel, tls: false },
            { key: 'logging', label: t.exporterLoggingLabel, tls: false, logging: true },
          ].map((exp) => (
            <Card size="small" title={exp.label} key={exp.key}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Space>
                  <Switch checked={options.exporters[exp.key].enabled} onChange={(v) => setPath(['exporters', exp.key, 'enabled'], v)} />
                  <Text>{exp.label}</Text>
                </Space>
                {options.exporters[exp.key].enabled && (
                  <Row gutter={[16, 16]}>
                    {!exp.logging && (
                      <Col xs={24} sm={exp.labels || exp.tls ? 12 : 24}>
                        <Space direction="vertical" style={{ width: '100%' }}>
                          <Text strong>{t.endpointLabel}</Text>
                          <Input
                            value={options.exporters[exp.key].endpoint}
                            onChange={(e) => setPath(['exporters', exp.key, 'endpoint'], e.target.value)}
                          />
                        </Space>
                      </Col>
                    )}
                    {exp.tls && (
                      <Col xs={24} sm={12}>
                        <Space>
                          <Switch checked={options.exporters[exp.key].tlsInsecure} onChange={(v) => setPath(['exporters', exp.key, 'tlsInsecure'], v)} />
                          <Text>{t.tlsInsecureLabel}</Text>
                        </Space>
                      </Col>
                    )}
                    {!exp.logging && (
                      <Col xs={24}>
                        <Space direction="vertical" style={{ width: '100%' }}>
                          <Text strong>{t.headersLabel}</Text>
                          <TextArea
                            value={options.exporters[exp.key].headers}
                            onChange={(e) => setPath(['exporters', exp.key, 'headers'], e.target.value)}
                            rows={2}
                            style={{ fontFamily: 'monospace', fontSize: 12 }}
                          />
                        </Space>
                      </Col>
                    )}
                    {exp.labels && (
                      <Col xs={24}>
                        <Space direction="vertical" style={{ width: '100%' }}>
                          <Text strong>{t.labelsLabel}</Text>
                          <TextArea
                            value={options.exporters[exp.key].labels}
                            onChange={(e) => setPath(['exporters', exp.key, 'labels'], e.target.value)}
                            rows={2}
                            style={{ fontFamily: 'monospace', fontSize: 12 }}
                          />
                        </Space>
                      </Col>
                    )}
                    {exp.logging && (
                      <>
                        <Col xs={24} sm={12}>
                          <Space direction="vertical" style={{ width: '100%' }}>
                            <Text strong>{t.logLevelLabel}</Text>
                            <Input
                              value={options.exporters[exp.key].logLevel}
                              onChange={(e) => setPath(['exporters', exp.key, 'logLevel'], e.target.value)}
                            />
                          </Space>
                        </Col>
                        <Col xs={24} sm={12}>
                          <Space direction="vertical" style={{ width: '100%' }}>
                            <Text strong>{t.verbosityLabel}</Text>
                            <Input
                              value={options.exporters[exp.key].verbosity}
                              onChange={(e) => setPath(['exporters', exp.key, 'verbosity'], e.target.value)}
                            />
                          </Space>
                        </Col>
                      </>
                    )}
                  </Row>
                )}
              </Space>
            </Card>
          ))}
        </Space>
      </Card>

      <Card title={t.extensionsSection}>
        <Space direction="vertical" style={{ width: '100%' }}>
          {[
            { key: 'healthCheck', label: t.healthCheckLabel },
            { key: 'pprof', label: t.pprofLabel },
            { key: 'zpages', label: t.zpagesLabel },
          ].map((ext) => (
            <Card size="small" title={ext.label} key={ext.key}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Space>
                  <Switch checked={options.extensions[ext.key].enabled} onChange={(v) => setPath(['extensions', ext.key, 'enabled'], v)} />
                  <Text>{ext.label}</Text>
                </Space>
                {options.extensions[ext.key].enabled && (
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Text strong>{t.endpointLabel}</Text>
                    <Input
                      value={options.extensions[ext.key].endpoint}
                      onChange={(e) => setPath(['extensions', ext.key, 'endpoint'], e.target.value)}
                    />
                  </Space>
                )}
              </Space>
            </Card>
          ))}
        </Space>
      </Card>

      <Card title={t.pipelinesSection}>
        <PipelineBlock kind="traces" />
        <PipelineBlock kind="metrics" />
        <PipelineBlock kind="logs" />
      </Card>

      <Card>
        <Space>
          <Switch checked={options.comments} onChange={(v) => setPath(['comments'], v)} />
          <Text>{t.commentsLabel}</Text>
        </Space>
      </Card>

      <Card
        title={
          <Space>
            {t.outTitle}
            <Text type="secondary" style={{ fontSize: 12 }}>{output.fileName}</Text>
          </Space>
        }
      >
        {output.warnings.length > 0 && (
          <Alert
            type="warning"
            showIcon
            message={t.warningsTitle}
            description={
              <ul style={{ margin: 0, paddingLeft: 16 }}>
                {output.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            }
            style={{ marginBottom: 16 }}
          />
        )}
        {output.warnings.length === 0 && (
          <Alert
            type="info"
            showIcon
            message={t.warningsNone}
            style={{ marginBottom: 16 }}
          />
        )}
        <TextArea
          readOnly
          value={output.text}
          rows={16}
          style={{ fontFamily: 'monospace', marginBottom: 12 }}
        />
        <Space wrap>
          <Button icon={copied ? <CheckOutlined /> : <CopyOutlined />} onClick={copy}>
            {copied ? t.copied : t.copy}
          </Button>
          <Button icon={<DownloadOutlined />} onClick={download}>
            {t.download}
          </Button>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {t.stats(output.lines, output.bytes)}
          </Text>
        </Space>
      </Card>

      <Card title={t.tipTitle}>
        <Paragraph style={{ marginBottom: 0 }}>{t.tipBody}</Paragraph>
      </Card>

      <Collapse>
        <Panel header={t.howTitle} key="source">
          <Paragraph>{t.howDesc}</Paragraph>
          <pre style={{ margin: 0, overflowX: 'auto', fontSize: 12, lineHeight: 1.6 }}>
            <code>{sourceCode}</code>
          </pre>
        </Panel>
      </Collapse>
    </Space>
  )
}
