import React, { useMemo, useState } from 'react'
import {
  Typography,
  Card,
  Space,
  Input,
  Button,
  Tag,
  Descriptions,
  Table,
  Alert,
  Collapse,
  Statistic,
  Row,
  Col,
  message,
} from 'antd'
import {
  FieldTimeOutlined,
  ThunderboltOutlined,
  CopyOutlined,
  ClearOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  analyzeCache,
  formatDuration,
  generateMarkdownSummary,
  PRESETS,
} from '../utils/httpCacheAnalyzer'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input
const { Panel } = Collapse

const DEFAULT_HEADERS = `HTTP/1.1 200 OK
Cache-Control: public, max-age=3600, s-maxage=7200, stale-while-revalidate=86400
ETag: "abc123"
Last-Modified: Sun, 16 Aug 2026 10:00:00 GMT
Vary: Accept-Encoding
Content-Type: text/html`

const SOURCE_SNIPPET = `// 1. Faz parse do bloco de cabeçalhos e, se houver, da status line.
// 2. Agrupa cabeçalhos repetidos e localiza Cache-Control, Expires,
//    Date, Age, ETag, Last-Modified, Vary, Set-Cookie e Authorization.
// 3. Tokeniza Cache-Control em diretivas com tipo (flag/seconds).
// 4. Calcula TTL efetivo: max-age vence Expires; s-maxage vence em
//    caches compartilhados; Age desconta do tempo restante.
// 5. Classifica cacheabilidade e gera alertas de conflitos clássicos
//    (no-store + max-age, private + s-maxage, Age > TTL etc).`

const translations = {
  pt: {
    title: 'Analisador de Cache HTTP',
    intro: 'Cole os cabeçalhos de uma resposta HTTP e entenda em segundos se ela é cacheável, por quanto tempo, em qual escopo e quais armadilhas esconde — tudo no navegador, sem enviar nada para a rede.',
    inputLabel: 'Cabeçalhos HTTP',
    inputPlaceholder: 'Cole aqui a resposta HTTP crua ou apenas os cabeçalhos...',
    presets: 'Cenários rápidos',
    clear: 'Limpar',
    summary: 'Resumo',
    directives: 'Diretivas Cache-Control',
    otherHeaders: 'Outros cabeçalhos relevantes',
    warnings: 'Alertas',
    bestPractices: 'Boas práticas',
    cacheable: 'Cacheável',
    notCacheable: 'Não cacheável',
    scope: 'Escopo',
    scopePublic: 'público',
    scopePrivate: 'privado',
    effectiveTtl: 'TTL efetivo',
    sharedTtl: 'TTL em cache compartilhado',
    ttlSource: 'Fonte do TTL',
    currentAge: 'Idade atual',
    remainingTtl: 'Tempo restante',
    status: 'Status',
    reason: 'Motivo',
    directive: 'Diretiva',
    value: 'Valor',
    meaning: 'Significado',
    header: 'Cabeçalho',
    headerValue: 'Valor',
    noWarnings: 'Nenhum conflito detectado.',
    noDirectives: 'Nenhuma diretiva Cache-Control encontrada.',
    copySummary: 'Copiar resumo',
    copied: 'Resumo copiado',
    copyError: 'Erro ao copiar',
    sourceTitle: 'Como funciona',
    bpTitle: 'Checklist rápido',
    bpList: [
      'Use Cache-Control em vez de Expires/Pragma — é o padrão moderno.',
      'Assets versionados podem usar immutable + max-age longo (1 ano).',
      'Respostas autenticadas: use private ou no-store; nunca public com Set-Cookie.',
      's-maxage só faz sentido sem private — senão é ignorado por proxies.',
      'Vary: * impede cache compartilhado; liste apenas cabeçalhos realmente relevantes.',
      'stale-while-revalidate melhora a percepção de velocidade sem perder frescor.',
    ],
  },
  en: {
    title: 'HTTP Cache Analyzer',
    intro: 'Paste an HTTP response header block and instantly understand whether it is cacheable, for how long, in what scope, and what pitfalls it hides — all in the browser, nothing is sent over the network.',
    inputLabel: 'HTTP headers',
    inputPlaceholder: 'Paste the raw HTTP response or just the headers here...',
    presets: 'Quick scenarios',
    clear: 'Clear',
    summary: 'Summary',
    directives: 'Cache-Control directives',
    otherHeaders: 'Other relevant headers',
    warnings: 'Warnings',
    bestPractices: 'Best practices',
    cacheable: 'Cacheable',
    notCacheable: 'Not cacheable',
    scope: 'Scope',
    scopePublic: 'public',
    scopePrivate: 'private',
    effectiveTtl: 'Effective TTL',
    sharedTtl: 'Shared cache TTL',
    ttlSource: 'TTL source',
    currentAge: 'Current age',
    remainingTtl: 'Remaining time',
    status: 'Status',
    reason: 'Reason',
    directive: 'Directive',
    value: 'Value',
    meaning: 'Meaning',
    header: 'Header',
    headerValue: 'Value',
    noWarnings: 'No conflicts detected.',
    noDirectives: 'No Cache-Control directives found.',
    copySummary: 'Copy summary',
    copied: 'Summary copied',
    copyError: 'Copy failed',
    sourceTitle: 'Under the hood',
    bpTitle: 'Quick checklist',
    bpList: [
      'Prefer Cache-Control over Expires/Pragma — it is the modern standard.',
      'Versioned assets can use immutable + a long max-age (1 year).',
      'Authenticated responses should use private or no-store; never public with Set-Cookie.',
      's-maxage only makes sense without private — otherwise proxies ignore it.',
      'Vary: * blocks shared caching; list only headers that really matter.',
      'stale-while-revalidate improves perceived speed without losing freshness.',
    ],
  },
}

function formatHeaderDate(date) {
  if (!date) return '—'
  try {
    return date.toUTCString()
  } catch {
    return '—'
  }
}

export default function HttpCacheAnalyzerPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [messageApi, messageContextHolder] = message.useMessage()
  const [raw, setRaw] = useState(DEFAULT_HEADERS)

  const analysis = useMemo(() => analyzeCache(raw), [raw])
  const presets = PRESETS[lang]

  async function copySummary() {
    try {
      await navigator.clipboard.writeText(generateMarkdownSummary(analysis, lang))
      messageApi.success(t.copied)
    } catch {
      messageApi.error(t.copyError)
    }
  }

  const otherHeaders = [
    { key: 'expires', label: 'Expires', value: formatHeaderDate(analysis.expires) },
    { key: 'date', label: 'Date', value: formatHeaderDate(analysis.date) },
    { key: 'age', label: 'Age', value: analysis.age !== null ? `${analysis.age}s` : '—' },
    { key: 'etag', label: 'ETag', value: analysis.etag || '—' },
    { key: 'lastModified', label: 'Last-Modified', value: formatHeaderDate(analysis.lastModified) },
    { key: 'vary', label: 'Vary', value: analysis.vary || '—' },
  ]

  const cacheableColor = analysis.cacheable ? 'green' : 'red'
  const scopeColor = analysis.scope === 'public' ? 'blue' : 'orange'

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {messageContextHolder}
      <Title level={2}><FieldTimeOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card title={t.inputLabel}>
        <TextArea
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          placeholder={t.inputPlaceholder}
          autoSize={{ minRows: 8, maxRows: 16 }}
          spellCheck={false}
          style={{ fontFamily: 'monospace' }}
        />
        <Space wrap style={{ marginTop: 12 }}>
          {presets.map((p) => (
            <Button key={p.key} size="small" icon={<ThunderboltOutlined />} onClick={() => setRaw(p.raw)}>
              {p.label}
            </Button>
          ))}
          <Button
            size="small"
            danger
            icon={<ClearOutlined />}
            onClick={() => setRaw('')}
          >
            {t.clear}
          </Button>
        </Space>
      </Card>

      <Card title={t.summary} extra={<Button size="small" icon={<CopyOutlined />} onClick={copySummary}>{t.copySummary}</Button>}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8}>
            <Statistic title={t.status} value={`${analysis.statusLine.status} ${analysis.statusLine.reason}`} />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <div style={{ marginBottom: 8 }}>
              <Text type="secondary">{t.cacheable}</Text>
            </div>
            <Tag color={cacheableColor}>
              {analysis.cacheable ? t.cacheable : t.notCacheable}
            </Tag>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <div style={{ marginBottom: 8 }}>
              <Text type="secondary">{t.scope}</Text>
            </div>
            <Tag color={scopeColor}>
              {analysis.scope === 'public' ? t.scopePublic : t.scopePrivate}
            </Tag>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Statistic
              title={t.effectiveTtl}
              value={analysis.effectiveTtl !== null ? formatDuration(analysis.effectiveTtl) : '—'}
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Statistic
              title={t.sharedTtl}
              value={analysis.sharedTtl !== null ? formatDuration(analysis.sharedTtl) : '—'}
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Statistic title={t.ttlSource} value={analysis.ttlSource || '—'} />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Statistic
              title={t.currentAge}
              value={analysis.currentAge ? formatDuration(analysis.currentAge) : '—'}
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Statistic
              title={t.remainingTtl}
              value={analysis.remainingTtl !== null ? formatDuration(analysis.remainingTtl) : '—'}
            />
          </Col>
          <Col xs={24} sm={24} md={8}>
            <div style={{ marginBottom: 8 }}>
              <Text type="secondary">{t.reason}</Text>
            </div>
            <Text>{analysis.reason || '—'}</Text>
          </Col>
        </Row>
      </Card>

      <Card title={t.directives}>
        {analysis.directives.length === 0 ? (
          <Text type="secondary">{t.noDirectives}</Text>
        ) : (
          <Table
            dataSource={analysis.directives.map((d, idx) => ({
              key: idx,
              name: d.name,
              value: d.value === null ? <Text type="secondary">flag</Text> : <Text code>{String(d.value)}</Text>,
              meaning: d.definition ? (d.definition[lang] || d.definition.en || d.name) : d.name,
            }))}
            columns={[
              { title: t.directive, dataIndex: 'name', render: (v) => <Text code>{v}</Text> },
              { title: t.value, dataIndex: 'value' },
              { title: t.meaning, dataIndex: 'meaning' },
            ]}
            pagination={false}
            size="small"
            bordered
          />
        )}
      </Card>

      <Card title={t.otherHeaders}>
        <Descriptions bordered size="small" column={{ xs: 1, sm: 2, md: 3 }}>
          {otherHeaders.map((h) => (
            <Descriptions.Item key={h.key} label={h.label}>
              <Text style={{ wordBreak: 'break-all' }}>{h.value}</Text>
            </Descriptions.Item>
          ))}
        </Descriptions>
      </Card>

      {analysis.warnings.length > 0 && (
        <Alert
          type="warning"
          showIcon
          icon={<WarningOutlined />}
          message={t.warnings}
          description={
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {analysis.warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          }
        />
      )}

      {analysis.warnings.length === 0 && analysis.directives.length > 0 && (
        <Alert type="success" showIcon message={t.noWarnings} />
      )}

      <Card title={t.bpTitle}>
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          {t.bpList.map((item, i) => (
            <li key={i}><Text>{item}</Text></li>
          ))}
        </ul>
      </Card>

      <Collapse>
        <Panel header={t.sourceTitle} key="source">
          <pre
            style={{
              margin: 0,
              fontSize: 12.5,
              lineHeight: 1.6,
              background: '#f5f5f5',
              padding: 12,
              borderRadius: 6,
              overflowX: 'auto',
              fontFamily: 'monospace',
            }}
          >
            {SOURCE_SNIPPET}
          </pre>
        </Panel>
      </Collapse>
    </Space>
  )
}
