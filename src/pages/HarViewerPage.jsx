import React, { useMemo, useState } from 'react'
import {
  Typography,
  Card,
  Space,
  Input,
  Button,
  Upload,
  Table,
  Tag,
  Statistic,
  Row,
  Col,
  Drawer,
  Descriptions,
  Tabs,
  Alert,
  Collapse,
  Select,
  message,
} from 'antd'
import {
  GlobalOutlined,
  UploadOutlined,
  FileTextOutlined,
  ClearOutlined,
  CopyOutlined,
  EyeOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import * as hv from '../utils/harViewer'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input
const { Option } = Select

const SOURCE_SNIPPET = Object.values(hv)
  .filter((f) => typeof f === 'function')
  .map((f) => f.toString())
  .join('\n\n')

function buildSampleHar() {
  return {
    log: {
      version: '1.2',
      creator: { name: 'DevTools HAR Viewer', version: '1.0' },
      entries: [
        {
          startedDateTime: '2024-01-15T10:00:00.000Z',
          time: 45,
          request: {
            method: 'GET',
            url: 'https://api.example.com/users',
            headers: [
              { name: 'Accept', value: 'application/json' },
              { name: 'Authorization', value: 'Bearer token123' },
            ],
            queryString: [{ name: 'limit', value: '10' }],
          },
          response: {
            status: 200,
            statusText: 'OK',
            headers: [{ name: 'Content-Type', value: 'application/json' }],
            content: {
              size: 256,
              mimeType: 'application/json',
              text: '{"users":[{"id":1,"name":"Ana"},{"id":2,"name":"Bruno"}]}',
            },
            bodySize: 256,
          },
        },
        {
          startedDateTime: '2024-01-15T10:00:00.050Z',
          time: 12,
          request: {
            method: 'GET',
            url: 'https://cdn.example.com/style.css',
            headers: [{ name: 'Accept', value: 'text/css' }],
            queryString: [],
          },
          response: {
            status: 200,
            statusText: 'OK',
            headers: [{ name: 'Content-Type', value: 'text/css' }],
            content: {
              size: 4096,
              mimeType: 'text/css',
              text: 'body { margin: 0; }',
            },
            bodySize: 4096,
          },
        },
        {
          startedDateTime: '2024-01-15T10:00:00.080Z',
          time: 78,
          request: {
            method: 'POST',
            url: 'https://api.example.com/login',
            headers: [{ name: 'Content-Type', value: 'application/json' }],
            queryString: [],
            postData: {
              mimeType: 'application/json',
              text: '{"email":"user@example.com","password":"***"}',
            },
          },
          response: {
            status: 401,
            statusText: 'Unauthorized',
            headers: [{ name: 'Content-Type', value: 'application/json' }],
            content: {
              size: 62,
              mimeType: 'application/json',
              text: '{"error":"invalid_credentials"}',
            },
            bodySize: 62,
          },
        },
        {
          startedDateTime: '2024-01-15T10:00:00.160Z',
          time: 5,
          request: {
            method: 'GET',
            url: 'https://www.google-analytics.com/collect?t=pageview',
            headers: [],
            queryString: [
              { name: 't', value: 'pageview' },
              { name: 'tid', value: 'UA-123456-1' },
            ],
          },
          response: {
            status: 204,
            statusText: 'No Content',
            headers: [],
            content: { size: 0, mimeType: 'image/gif' },
            bodySize: 0,
          },
        },
      ],
    },
  }
}

const EXAMPLE_HAR = JSON.stringify(buildSampleHar(), null, 2)

const translations = {
  pt: {
    title: 'Visualizador de HAR',
    intro: (
      <>
        Analise arquivos <Text code>HAR</Text> (HTTP Archive) gerados pelo Chrome DevTools,
        Firefox, Safari ou outras ferramentas — 100% no navegador. Veja estatísticas, filtre
        requisições, inspecione headers e visualize corpos de request/response. Nenhum dado
        sai do navegador.
      </>
    ),
    inputLabel: 'Cole o conteúdo HAR (JSON)',
    inputPlaceholder: '{ "log": { "entries": [...] } }',
    upload: 'Carregar arquivo .har',
    loadExample: 'Carregar exemplo',
    clear: 'Limpar',
    parseError: 'Erro ao ler HAR',
    totalRequests: 'Requisições',
    totalSize: 'Tamanho total',
    totalTime: 'Tempo total',
    domains: 'Domínios',
    filters: 'Filtros',
    filterSearch: 'Buscar URL, status...',
    filterMethod: 'Método',
    filterStatus: 'Status',
    filterType: 'Tipo MIME',
    filterDomain: 'Domínio',
    all: 'Todos',
    table: 'Requisições',
    columnMethod: 'Método',
    columnUrl: 'URL',
    columnStatus: 'Status',
    columnType: 'Tipo',
    columnSize: 'Tamanho',
    columnTime: 'Tempo',
    details: 'Detalhes da requisição',
    tabRequest: 'Request',
    tabResponse: 'Response',
    tabHeaders: 'Headers',
    tabQuery: 'Query params',
    noBody: 'Sem corpo',
    copy: 'Copiar',
    copied: 'Copiado!',
    sourceTitle: 'Algoritmo',
    sourceBody: 'O motor em src/utils/harViewer.js faz parsing do JSON, extrai métricas, domínios e status, aplica filtros e formata tamanhos/tempos. Tudo roda no cliente.',
    sourceTab: 'harViewer.js',
    largeFile: 'Arquivo grande detectado: exibindo as primeiras {count} requisições para manter a interface fluida.',
    noEntries: 'Nenhuma requisição encontrada com os filtros atuais.',
  },
  en: {
    title: 'HAR Viewer',
    intro: (
      <>
        Analyze <Text code>HAR</Text> (HTTP Archive) files exported from Chrome DevTools,
        Firefox, Safari or other tools — 100% in the browser. View statistics, filter requests,
        inspect headers and visualize request/response bodies. No data leaves the browser.
      </>
    ),
    inputLabel: 'Paste HAR content (JSON)',
    inputPlaceholder: '{ "log": { "entries": [...] } }',
    upload: 'Upload .har file',
    loadExample: 'Load example',
    clear: 'Clear',
    parseError: 'Error reading HAR',
    totalRequests: 'Requests',
    totalSize: 'Total size',
    totalTime: 'Total time',
    domains: 'Domains',
    filters: 'Filters',
    filterSearch: 'Search URL, status...',
    filterMethod: 'Method',
    filterStatus: 'Status',
    filterType: 'MIME type',
    filterDomain: 'Domain',
    all: 'All',
    table: 'Requests',
    columnMethod: 'Method',
    columnUrl: 'URL',
    columnStatus: 'Status',
    columnType: 'Type',
    columnSize: 'Size',
    columnTime: 'Time',
    details: 'Request details',
    tabRequest: 'Request',
    tabResponse: 'Response',
    tabHeaders: 'Headers',
    tabQuery: 'Query params',
    noBody: 'No body',
    copy: 'Copy',
    copied: 'Copied!',
    sourceTitle: 'Algorithm',
    sourceBody: 'The engine in src/utils/harViewer.js parses the JSON, extracts metrics, domains and statuses, applies filters and formats sizes/durations. Everything runs on the client.',
    sourceTab: 'harViewer.js',
    largeFile: 'Large file detected: showing the first {count} requests to keep the UI fluid.',
    noEntries: 'No requests found with the current filters.',
  },
}

const MAX_TABLE_ROWS = 500

export default function HarViewerPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [input, setInput] = useState(EXAMPLE_HAR)
  const [filters, setFilters] = useState({ search: '', method: '', status: '', type: '', domain: '' })
  const [selectedEntry, setSelectedEntry] = useState(null)

  const parsed = useMemo(() => hv.parseHar(input), [input])
  const summary = useMemo(
    () => (parsed.ok ? hv.summarizeHar(parsed.data) : null),
    [parsed]
  )

  const filtered = useMemo(() => {
    if (!parsed.ok) return []
    return hv.filterEntries(parsed.data, filters)
  }, [parsed, filters])

  const limited = useMemo(
    () => (filtered.length > MAX_TABLE_ROWS ? filtered.slice(0, MAX_TABLE_ROWS) : filtered),
    [filtered]
  )

  const methodOptions = useMemo(
    () => (summary ? Object.keys(summary.methods).sort() : []),
    [summary]
  )
  const typeOptions = useMemo(
    () => (summary ? Object.keys(summary.types).sort() : []),
    [summary]
  )
  const domainOptions = useMemo(
    () => (summary ? summary.domains : []),
    [summary]
  )

  function handleUpload({ file }) {
    const reader = new FileReader()
    reader.onload = (e) => setInput(e.target.result)
    reader.readAsText(file)
  }

  function copy(text) {
    navigator.clipboard.writeText(text)
    message.success(t.copied)
  }

  function renderBody(text, mime) {
    if (!text) return <Text type="secondary">{t.noBody}</Text>
    const json = hv.safeJsonParse(text)
    if (json.ok) {
      return (
        <pre style={{ margin: 0, overflowX: 'auto', fontFamily: 'monospace', fontSize: 12 }}>
          <code>{JSON.stringify(json.value, null, 2)}</code>
        </pre>
      )
    }
    return (
      <pre style={{ margin: 0, overflowX: 'auto', fontFamily: 'monospace', fontSize: 12, whiteSpace: 'pre-wrap' }}>
        <code>{text}</code>
      </pre>
    )
  }

  const columns = [
    {
      title: t.columnMethod,
      dataIndex: 'method',
      width: 90,
      render: (_, entry) => <Tag>{(entry.request?.method || 'GET').toUpperCase()}</Tag>,
    },
    {
      title: t.columnUrl,
      dataIndex: 'url',
      ellipsis: true,
      render: (_, entry) => (
        <Button
          type="link"
          style={{ padding: 0, whiteSpace: 'normal', textAlign: 'left', wordBreak: 'break-all' }}
          onClick={() => setSelectedEntry(entry)}
        >
          {hv.truncateUrl(entry.request?.url || '', 70)}
        </Button>
      ),
    },
    {
      title: t.columnStatus,
      dataIndex: 'status',
      width: 90,
      render: (_, entry) => {
        const status = entry.response?.status || 0
        return <Tag color={hv.getStatusColor(status)}>{status || '-'}</Tag>
      },
    },
    {
      title: t.columnType,
      dataIndex: 'type',
      width: 160,
      render: (_, entry) => {
        const mime = entry.response?.content?.mimeType || 'unknown'
        return <Text type="secondary">{mime.split(';')[0]}</Text>
      },
    },
    {
      title: t.columnSize,
      dataIndex: 'size',
      width: 100,
      render: (_, entry) => hv.formatBytes(entry.response?.bodySize ?? entry.response?._transferSize ?? 0),
    },
    {
      title: t.columnTime,
      dataIndex: 'time',
      width: 90,
      render: (_, entry) => hv.formatDuration(entry.time ?? 0),
    },
    {
      title: '',
      key: 'actions',
      width: 60,
      render: (_, entry) => (
        <Button icon={<EyeOutlined />} size="small" onClick={() => setSelectedEntry(entry)} />
      ),
    },
  ]

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><GlobalOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div>
            <Text strong>{t.inputLabel}</Text>
            <TextArea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t.inputPlaceholder}
              autoSize={{ minRows: 6, maxRows: 14 }}
              style={{ fontFamily: 'monospace' }}
              status={!parsed.ok && input.trim() ? 'error' : ''}
            />
          </div>

          <Space wrap>
            <Upload accept=".har,.json" showUploadList={false} beforeUpload={() => false} onChange={handleUpload}>
              <Button icon={<UploadOutlined />}>{t.upload}</Button>
            </Upload>
            <Button onClick={() => setInput(EXAMPLE_HAR)} icon={<FileTextOutlined />}>
              {t.loadExample}
            </Button>
            <Button icon={<ClearOutlined />} onClick={() => setInput('')}>
              {t.clear}
            </Button>
          </Space>

          {!parsed.ok && input.trim() && (
            <Alert type="error" showIcon message={`${t.parseError}: ${parsed.error}`} />
          )}
        </Space>
      </Card>

      {parsed.ok && summary && (
        <>
          <Row gutter={[16, 16]}>
            <Col xs={12} md={6}>
              <Card><Statistic title={t.totalRequests} value={summary.totalRequests} /></Card>
            </Col>
            <Col xs={12} md={6}>
              <Card><Statistic title={t.totalSize} value={hv.formatBytes(summary.totalSize)} /></Card>
            </Col>
            <Col xs={12} md={6}>
              <Card><Statistic title={t.totalTime} value={hv.formatDuration(summary.totalTime)} /></Card>
            </Col>
            <Col xs={12} md={6}>
              <Card><Statistic title={t.domains} value={summary.domains.length} /></Card>
            </Col>
          </Row>

          <Card title={t.filters} size="small">
            <Space wrap style={{ width: '100%' }}>
              <Input
                placeholder={t.filterSearch}
                value={filters.search}
                onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                allowClear
                style={{ width: 220 }}
              />
              <Select
                placeholder={t.filterMethod}
                allowClear
                value={filters.method || undefined}
                onChange={(v) => setFilters((f) => ({ ...f, method: v || '' }))}
                style={{ width: 120 }}
              >
                {methodOptions.map((m) => (
                  <Option key={m} value={m}>{m}</Option>
                ))}
              </Select>
              <Select
                placeholder={t.filterStatus}
                allowClear
                value={filters.status || undefined}
                onChange={(v) => setFilters((f) => ({ ...f, status: v || '' }))}
                style={{ width: 120 }}
              >
                {[200, 201, 204, 301, 302, 304, 400, 401, 403, 404, 500, 502, 503].map((s) => (
                  <Option key={s} value={String(s)}>{s}</Option>
                ))}
              </Select>
              <Select
                placeholder={t.filterType}
                allowClear
                value={filters.type || undefined}
                onChange={(v) => setFilters((f) => ({ ...f, type: v || '' }))}
                style={{ width: 180 }}
              >
                {typeOptions.map((ty) => (
                  <Option key={ty} value={ty}>{ty}</Option>
                ))}
              </Select>
              <Select
                placeholder={t.filterDomain}
                allowClear
                showSearch
                value={filters.domain || undefined}
                onChange={(v) => setFilters((f) => ({ ...f, domain: v || '' }))}
                style={{ width: 200 }}
              >
                {domainOptions.map((d) => (
                  <Option key={d} value={d}>{d}</Option>
                ))}
              </Select>
            </Space>
          </Card>

          <Card title={`${t.table} (${filtered.length})`}>
            {filtered.length > MAX_TABLE_ROWS && (
              <Alert
                type="info"
                showIcon
                message={t.largeFile.replace('{count}', MAX_TABLE_ROWS)}
                style={{ marginBottom: 16 }}
              />
            )}
            {filtered.length === 0 ? (
              <Alert type="info" showIcon message={t.noEntries} />
            ) : (
              <Table
                dataSource={limited}
                columns={columns}
                rowKey={(_, idx) => `row-${idx}`}
                pagination={{ pageSize: 10, showSizeChanger: true, pageSizeOptions: [10, 25, 50, 100] }}
                size="small"
                scroll={{ x: 800 }}
              />
            )}
          </Card>
        </>
      )}

      <Drawer
        title={t.details}
        width={720}
        open={!!selectedEntry}
        onClose={() => setSelectedEntry(null)}
        extra={
          <Button icon={<CopyOutlined />} onClick={() => copy(JSON.stringify(selectedEntry, null, 2))}>
            {t.copy}
          </Button>
        }
      >
        {selectedEntry && (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Descriptions bordered size="small" column={1}>
              <Descriptions.Item label={t.columnUrl}>
                <Text copyable>{selectedEntry.request?.url}</Text>
              </Descriptions.Item>
              <Descriptions.Item label={t.columnMethod}>
                {(selectedEntry.request?.method || 'GET').toUpperCase()}
              </Descriptions.Item>
              <Descriptions.Item label={t.columnStatus}>
                <Tag color={hv.getStatusColor(selectedEntry.response?.status)}>
                  {selectedEntry.response?.status} {selectedEntry.response?.statusText}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label={t.columnSize}>
                {hv.formatBytes(selectedEntry.response?.bodySize ?? 0)}
              </Descriptions.Item>
              <Descriptions.Item label={t.columnTime}>
                {hv.formatDuration(selectedEntry.time ?? 0)}
              </Descriptions.Item>
            </Descriptions>

            <Tabs
              items={[
                {
                  key: 'request',
                  label: t.tabRequest,
                  children: (
                    <>
                      {hv.getQueryParams(selectedEntry).length > 0 && (
                        <Card size="small" title={t.tabQuery} style={{ marginBottom: 16 }}>
                          <Descriptions bordered size="small" column={1}>
                            {hv.getQueryParams(selectedEntry).map((q, i) => (
                              <Descriptions.Item key={i} label={q.name}>{q.value}</Descriptions.Item>
                            ))}
                          </Descriptions>
                        </Card>
                      )}
                      <Card size="small" title={t.tabHeaders}>
                        <Descriptions bordered size="small" column={1}>
                          {hv.formatHeaders(selectedEntry.request?.headers).map((h, i) => (
                            <Descriptions.Item key={i} label={h.name}>
                              <Text code>{h.value}</Text>
                            </Descriptions.Item>
                          ))}
                        </Descriptions>
                      </Card>
                      {selectedEntry.request?.postData && (
                        <Card size="small" title={t.tabRequest} style={{ marginTop: 16 }}>
                          {renderBody(hv.getRequestBody(selectedEntry), selectedEntry.request?.postData?.mimeType)}
                        </Card>
                      )}
                    </>
                  ),
                },
                {
                  key: 'response',
                  label: t.tabResponse,
                  children: (
                    <>
                      <Card size="small" title={t.tabHeaders} style={{ marginBottom: 16 }}>
                        <Descriptions bordered size="small" column={1}>
                          {hv.formatHeaders(selectedEntry.response?.headers).map((h, i) => (
                            <Descriptions.Item key={i} label={h.name}>
                              <Text code>{h.value}</Text>
                            </Descriptions.Item>
                          ))}
                        </Descriptions>
                      </Card>
                      <Card size="small" title={t.tabResponse}>
                        {renderBody(hv.getResponseBody(selectedEntry), selectedEntry.response?.content?.mimeType)}
                      </Card>
                    </>
                  ),
                },
              ]}
            />
          </Space>
        )}
      </Drawer>

      <Card title={t.sourceTitle}>
        <Paragraph type="secondary">{t.sourceBody}</Paragraph>
        <Collapse
          items={[
            {
              key: 'src',
              label: <Text code>{t.sourceTab}</Text>,
              children: (
                <pre style={{ margin: 0, overflowX: 'auto', fontSize: 12, lineHeight: 1.6 }}>
                  <code>{SOURCE_SNIPPET}</code>
                </pre>
              ),
            },
          ]}
        />
      </Card>
    </Space>
  )
}
