import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  Typography, Card, Space, Input, Button, Select, Tag, Alert, message,
} from 'antd'
import {
  ApiOutlined, SendOutlined, StopOutlined, DeleteOutlined, PlusOutlined,
  CopyOutlined, LinkOutlined, ThunderboltOutlined, CodeOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']

const STATUS_TEXT = {
  200: 'OK', 201: 'Created', 202: 'Accepted', 204: 'No Content',
  301: 'Moved Permanently', 302: 'Found', 304: 'Not Modified',
  400: 'Bad Request', 401: 'Unauthorized', 403: 'Forbidden',
  404: 'Not Found', 405: 'Method Not Allowed', 408: 'Request Timeout',
  409: 'Conflict', 410: 'Gone', 413: 'Payload Too Large', 418: "I'm a teapot",
  422: 'Unprocessable Entity', 429: 'Too Many Requests',
  500: 'Internal Server Error', 502: 'Bad Gateway', 503: 'Service Unavailable',
  504: 'Gateway Timeout',
}

const ENGINE_SOURCE = `// Motor: uma única chamada fetch do navegador.
// A requisição parte do seu browser direto para o alvo — respeitando
// as regras de CORS do servidor de destino.
const res = await fetch(url, {
  method,
  headers,
  body,          // string (ou undefined quando não há corpo)
  signal,        // AbortController para o botão "Parar"
})
const bodyText = await res.text()
const durationMs = performance.now() - start
const headers = []
res.headers.forEach((value, key) => headers.push([key, value]))
console.log(res.status, res.statusText, headers, bodyText, durationMs)`

function shellQuote(s) {
  if (!s) return "''"
  if (/^[A-Za-z0-9_./:()@+=,\\-]+$/.test(s)) return s
  return "'" + s.replace(/'/g, "'\\''") + "'"
}

function formatBytes(n) {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / 1024 / 1024).toFixed(2)} MB`
}

function prettify(bodyText, lang) {
  if (lang === 'empty') return '(vazio / empty)'
  if (lang === 'json') {
    try {
      return JSON.stringify(JSON.parse(bodyText), null, 2)
    } catch {
      return bodyText
    }
  }
  return bodyText
}

function statusColor(status) {
  if (status < 300) return 'green'
  if (status < 400) return 'blue'
  if (status < 500) return 'orange'
  return 'red'
}

const translations = {
  pt: {
    title: 'Cliente HTTP / REST',
    intro: (
      <>
        Monte uma requisição HTTP — método, URL, cabeçalhos e corpo — e envie
        direto do navegador com <Text code>fetch</Text>, sem um backend no meio.
        A resposta aparece com status, tempo, headers e corpo formatado, junto
        com o código <Text code>fetch</Text> e o comando <Text code>curl</Text>{' '}
        equivalentes pra reusar. Complementa o{' '}
        gerador de cURL (que só monta texto) e o conversor cURL → código: aqui
        a requisição sai de verdade.
      </>
    ),
    corsWarning: (
      <>
        As requisições saem do seu navegador direto para o alvo e estão sujeitas
        às regras de CORS do servidor de destino. Endpoints públicos que enviam
        <Text code>Access-Control-Allow-Origin: *</Text> (ex.: httpbin,
        jsonplaceholder) funcionam sem configurar nada; APIs internas que não
        liberam CORS aparecerão como erro de rede mesmo respondendo corretamente.
      </>
    ),
    method: 'Método',
    urlLabel: 'URL',
    urlPlaceholder: 'https://api.exemplo.com/v1/recurso',
    headersLabel: 'Cabeçalhos',
    addHeader: 'Adicionar cabeçalho',
    headerKeyPh: 'Nome (ex.: Content-Type)',
    headerValuePh: 'Valor',
    bodyLabel: 'Corpo (body)',
    bodyPlaceholder: '{"campo": "valor"}',
    formatJson: 'Formatar JSON',
    send: 'Enviar',
    stop: 'Parar',
    examples: 'Exemplos',
    get: 'GET',
    post: 'POST',
    status500: 'Status 500',
    todo: 'Todo fake',
    github: 'GitHub API',
    responseTitle: 'Resposta',
    noResponse: 'Envie uma requisição para ver a resposta aqui.',
    status: 'Status',
    duration: 'Duração',
    size: 'Tamanho',
    responseHeaders: 'Cabeçalhos da resposta',
    responseBody: 'Corpo da resposta',
    copyBody: 'Copiar corpo',
    copy: 'Copiar',
    copied: 'Copiado!',
    invalidUrl: 'URL inválida — use http:// ou https://',
    emptyUrl: 'Digite uma URL para enviar.',
    reqError: 'Erro na requisição.',
    abortMsg: 'Requisição cancelada.',
    generated: 'Código gerado do request',
    fetchSnippet: 'fetch (JS)',
    curlSnippet: 'curl',
    codeIntro: (
      <>
        O código abaixo replica exatamente o request atual — útil pra colar num
        script, num teste ou num CLI.
      </>
    ),
    sourceTitle: 'Código-fonte do motor',
    sourceIntro:
      'O motor é a fetch API nativa do navegador: nenhuma requisição passa pelo nosso backend.',
  },
  en: {
    title: 'HTTP Request / REST Client',
    intro: (
      <>
        Build an HTTP request — method, URL, headers and body — and send it
        straight from the browser with <Text code>fetch</Text>, no backend in
        between. The response shows status, time, headers and a formatted body,
        plus the equivalent <Text code>fetch</Text> code and <Text code>curl</Text>{' '}
        command to reuse. Complements the cURL generator (which only builds
        text) and the cURL → code converter: here the request really goes out.
      </>
    ),
    corsWarning: (
      <>
        Requests leave your browser straight to the target and are subject to the
        destination's CORS rules. Public endpoints that send
        <Text code>Access-Control-Allow-Origin: *</Text> (e.g. httpbin,
        jsonplaceholder) work out of the box; internal APIs that don't allow CORS
        will surface as a network error even when they respond correctly.
      </>
    ),
    method: 'Method',
    urlLabel: 'URL',
    urlPlaceholder: 'https://api.example.com/v1/resource',
    headersLabel: 'Headers',
    addHeader: 'Add header',
    headerKeyPh: 'Name (e.g. Content-Type)',
    headerValuePh: 'Value',
    bodyLabel: 'Body',
    bodyPlaceholder: '{"field": "value"}',
    formatJson: 'Format JSON',
    send: 'Send',
    stop: 'Stop',
    examples: 'Examples',
    get: 'GET',
    post: 'POST',
    status500: 'Status 500',
    todo: 'Fake todo',
    github: 'GitHub API',
    responseTitle: 'Response',
    noResponse: 'Send a request to see the response here.',
    status: 'Status',
    duration: 'Duration',
    size: 'Size',
    responseHeaders: 'Response headers',
    responseBody: 'Response body',
    copyBody: 'Copy body',
    copy: 'Copy',
    copied: 'Copied!',
    invalidUrl: 'Invalid URL — use http:// or https://',
    emptyUrl: 'Type a URL to send.',
    reqError: 'Request error.',
    abortMsg: 'Request aborted.',
    generated: 'Generated request code',
    fetchSnippet: 'fetch (JS)',
    curlSnippet: 'curl',
    codeIntro: (
      <>
        The code below replicates the exact current request — handy to paste
        into a script, a test or a CLI.
      </>
    ),
    sourceTitle: 'Engine source code',
    sourceIntro:
      'The engine is the browser native fetch API: no request goes through our backend.',
  },
}

const EXAMPLES = [
  { key: 'get', method: 'GET', url: 'https://httpbin.org/get', headers: [], body: '' },
  { key: 'post', method: 'POST', url: 'https://httpbin.org/post', headers: [{ key: 'Content-Type', value: 'application/json' }], body: '{\n  "hello": "world"\n}' },
  { key: 'status500', method: 'GET', url: 'https://httpbin.org/status/500', headers: [], body: '' },
  { key: 'todo', method: 'GET', url: 'https://jsonplaceholder.typicode.com/todos/1', headers: [], body: '' },
  { key: 'github', method: 'GET', url: 'https://api.github.com', headers: [], body: '' },
]

let idCounter = 0
const nextId = () => ++idCounter

const DEFAULT_HEADERS = [{ id: nextId(), key: '', value: '' }]

export default function HttpRequestToolPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [method, setMethod] = useState('GET')
  const [url, setUrl] = useState('')
  const [headerRows, setHeaderRows] = useState(DEFAULT_HEADERS)
  const [bodyText, setBodyText] = useState('')
  const [running, setRunning] = useState(false)
  const [error, setError] = useState(null)
  const [response, setResponse] = useState(null)
  const abortRef = useRef(null)

  useEffect(() => {
    return () => abortRef.current?.abort()
  }, [])

  const displayBody = useMemo(
    () => (response ? prettify(response.bodyText, response.lang) : ''),
    [response]
  )

  const snippets = useMemo(() => {
    const trimmedUrl = url.trim()
    if (!trimmedUrl) return null
    const hdrs = headerRows.filter((r) => r.key.trim())
    const noBodyMethods = ['GET', 'HEAD']
    const hasBody = !noBodyMethods.includes(method) && bodyText.trim() !== ''

    const fetchLines = [`fetch("${trimmedUrl}", {`, `  method: "${method}",`]
    if (hdrs.length > 0) {
      fetchLines.push('  headers: {')
      hdrs.forEach((r) => {
        fetchLines.push(`    "${r.key.trim()}": ${JSON.stringify(r.value)},`)
      })
      fetchLines.push('  },')
    }
    if (hasBody) {
      fetchLines.push(`  body: ${JSON.stringify(bodyText)},`)
    }
    fetchLines.push('})')

    const curlParts = ['curl']
    curlParts.push('-X', method)
    curlParts.push('--url', shellQuote(trimmedUrl))
    hdrs.forEach((r) => curlParts.push('-H', shellQuote(`${r.key.trim()}: ${r.value}`)))
    if (hasBody) curlParts.push('--data-raw', shellQuote(bodyText))

    return { fetch: fetchLines.join('\n'), curl: curlParts.join(' ') }
  }, [method, url, bodyText, headerRows])

  const updateHeader = (id, field, value) => {
    setHeaderRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    )
  }

  const removeHeader = (id) => {
    setHeaderRows((prev) => prev.filter((r) => r.id !== id))
  }

  const addHeader = () => {
    setHeaderRows((prev) => [...prev, { id: nextId(), key: '', value: '' }])
  }

  const formatBodyJson = () => {
    try {
      const parsed = JSON.parse(bodyText)
      setBodyText(JSON.stringify(parsed, null, 2))
    } catch {
      message.warning(lang === 'pt' ? 'Não é um JSON válido.' : 'Not valid JSON.')
    }
  }

  const applyExample = (ex) => {
    setMethod(ex.method)
    setUrl(ex.url)
    setHeaderRows(
      ex.headers.length > 0
        ? ex.headers.map((h) => ({ id: nextId(), key: h.key, value: h.value }))
        : [{ id: nextId(), key: '', value: '' }]
    )
    setBodyText(ex.body)
    setResponse(null)
    setError(null)
  }

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      message.success(t.copied)
    })
  }

  const run = async () => {
    const trimmedUrl = url.trim()
    if (!trimmedUrl) {
      message.warning(t.emptyUrl)
      return
    }
    let parsed
    try {
      parsed = new URL(trimmedUrl)
    } catch {
      message.error(t.invalidUrl)
      return
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      message.error(t.invalidUrl)
      return
    }

    const headersObj = {}
    headerRows
      .filter((r) => r.key.trim())
      .forEach((r) => {
        headersObj[r.key.trim()] = r.value
      })

    const noBodyMethods = ['GET', 'HEAD']
    const hasBody = !noBodyMethods.includes(method) && bodyText.trim() !== ''

    const controller = new AbortController()
    abortRef.current = controller
    setRunning(true)
    setError(null)

    const start = performance.now()
    try {
      const res = await fetch(parsed.toString(), {
        method,
        headers: headersObj,
        body: hasBody ? bodyText : undefined,
        signal: controller.signal,
      })
      const body = await res.text()
      const durationMs = Math.round((performance.now() - start) * 10) / 10
      const sizeBytes = new TextEncoder().encode(body).length
      const respHeaders = []
      res.headers.forEach((value, key) => respHeaders.push([key, value]))
      let bodyLang = 'text'
      if (!body) bodyLang = 'empty'
      else {
        try {
          JSON.parse(body)
          bodyLang = 'json'
        } catch {
          // keep text
        }
      }
      setResponse({
        status: res.status,
        statusText: res.statusText || STATUS_TEXT[res.status] || '',
        headers: respHeaders,
        bodyText: body,
        durationMs,
        sizeBytes,
        lang: bodyLang,
      })
    } catch (err) {
      if (err && err.name === 'AbortError') {
        setError(t.abortMsg)
      } else {
        const detail = err && err.message ? err.message : ''
        message.error(`${t.reqError} ${detail}`)
      }
    } finally {
      setRunning(false)
      abortRef.current = null
    }
  }

  const stop = () => {
    abortRef.current?.abort()
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}>
        <ApiOutlined style={{ marginRight: 8 }} />
        {t.title}
      </Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Alert type="warning" showIcon message={t.corsWarning} />

      <Card
        title={
          <Space>
            <ThunderboltOutlined />
            {t.examples}
          </Space>
        }
      >
        <Space wrap>
          {EXAMPLES.map((ex) => (
            <Button key={ex.key} size="small" onClick={() => applyExample(ex)}>
              {t[ex.key]}
            </Button>
          ))}
        </Space>
      </Card>

      <Card>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Space.Compact style={{ width: '100%' }} block>
            <Select
              value={method}
              onChange={setMethod}
              style={{ width: 130 }}
              options={METHODS.map((m) => ({ value: m, label: m }))}
              disabled={running}
            />
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={t.urlPlaceholder}
              prefix={<LinkOutlined />}
              disabled={running}
              style={{ fontFamily: 'monospace' }}
            />
          </Space.Compact>

          <div>
            <Text strong>{t.headersLabel}</Text>
            <Button
              type="link"
              size="small"
              icon={<PlusOutlined />}
              onClick={addHeader}
              style={{ padding: 0, marginLeft: 8 }}
            >
              {t.addHeader}
            </Button>
          </div>

          {headerRows.map((row, index) => (
            <Space.Compact key={row.id} style={{ width: '100%' }} block>
              <Input
                value={row.key}
                onChange={(e) => updateHeader(row.id, 'key', e.target.value)}
                placeholder={t.headerKeyPh}
                disabled={running}
                style={{ width: '40%', fontFamily: 'monospace' }}
              />
              <Input
                value={row.value}
                onChange={(e) => updateHeader(row.id, 'value', e.target.value)}
                placeholder={t.headerValuePh}
                disabled={running}
                style={{ fontFamily: 'monospace' }}
              />
              <Button
                icon={<DeleteOutlined />}
                onClick={() => removeHeader(row.id)}
                disabled={running || headerRows.length === 1}
                aria-label="remove-header"
              />
            </Space.Compact>
          ))}

          <div>
            <Text strong>{t.bodyLabel}</Text>
            <Button
              type="link"
              size="small"
              icon={<CodeOutlined />}
              onClick={formatBodyJson}
              style={{ padding: 0, marginLeft: 8 }}
            >
              {t.formatJson}
            </Button>
          </div>
          <TextArea
            rows={5}
            value={bodyText}
            onChange={(e) => setBodyText(e.target.value)}
            placeholder={t.bodyPlaceholder}
            disabled={running}
            style={{ fontFamily: 'monospace' }}
          />

          <Space wrap>
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={run}
              loading={running}
              disabled={!url.trim()}
            >
              {t.send}
            </Button>
            {running && (
              <Button icon={<StopOutlined />} onClick={stop}>
                {t.stop}
              </Button>
            )}
          </Space>
        </Space>
      </Card>

      {response || error ? (
        <Card
          title={
            <Space>
              <ApiOutlined />
              {t.responseTitle}
            </Space>
          }
        >
          {error && (
            <Alert
              type="info"
              showIcon
              message={error}
              style={{ marginBottom: 16 }}
              closable
              onClose={() => setError(null)}
            />
          )}

          {response && (
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Space wrap>
                <Tag color={statusColor(response.status)} style={{ fontSize: 14, padding: '2px 10px' }}>
                  {response.status} {response.statusText}
                </Tag>
                <Text type="secondary">
                  {t.duration}: <Text strong>{response.durationMs} ms</Text>
                </Text>
                <Text type="secondary">
                  {t.size}: <Text strong>{formatBytes(response.sizeBytes)}</Text>
                </Text>
              </Space>

              <div>
                <Text strong style={{ display: 'block', marginBottom: 4 }}>
                  {t.responseHeaders}
                </Text>
                <div
                  style={{
                    background: '#fafafa',
                    borderRadius: 6,
                    padding: '8px 12px',
                    maxHeight: 180,
                    overflow: 'auto',
                  }}
                >
                  {response.headers.length === 0 && (
                    <Text type="secondary">—</Text>
                  )}
                  {response.headers.map(([k, v], i) => (
                    <div
                      key={i}
                      style={{
                        fontFamily: 'monospace',
                        fontSize: 12,
                        display: 'flex',
                        gap: 8,
                        padding: '2px 0',
                        wordBreak: 'break-word',
                      }}
                    >
                      <Text type="secondary" style={{ whiteSpace: 'nowrap' }}>
                        {k}:
                      </Text>
                      <span>{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                  <Text strong>{t.responseBody}</Text>
                  <Button
                    size="small"
                    icon={<CopyOutlined />}
                    onClick={() => handleCopy(response.bodyText)}
                  >
                    {t.copyBody}
                  </Button>
                </Space>
                <pre
                  style={{
                    margin: '8px 0 0',
                    padding: 12,
                    background: '#1e1e1e',
                    color: '#d4d4d4',
                    borderRadius: 8,
                    overflow: 'auto',
                    maxHeight: 420,
                    fontSize: 13,
                    fontFamily: "ui-monospace, 'SF Mono', 'Fira Code', 'Consolas', monospace",
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {displayBody}
                </pre>
              </div>
            </Space>
          )}

          {!response && !error && <Text type="secondary">{t.noResponse}</Text>}
        </Card>
      ) : (
        <Card>
          <Text type="secondary">{t.noResponse}</Text>
        </Card>
      )}

      {snippets && (
        <Card title={<span><CodeOutlined /> {t.generated}</span>}>
          <Paragraph type="secondary">{t.codeIntro}</Paragraph>

          <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text strong>{t.fetchSnippet}</Text>
            <Button size="small" icon={<CopyOutlined />} onClick={() => handleCopy(snippets.fetch)}>
              {t.copy}
            </Button>
          </Space>
          <pre
            style={{
              margin: 0,
              padding: 12,
              background: '#1e1e1e',
              color: '#d4d4d4',
              borderRadius: 8,
              overflow: 'auto',
              fontSize: 13,
              fontFamily: "ui-monospace, 'SF Mono', 'Fira Code', 'Consolas', monospace",
            }}
          >
            {snippets.fetch}
          </pre>

          <Space style={{ width: '100%', justifyContent: 'space-between', margin: '16px 0 8px' }}>
            <Text strong>{t.curlSnippet}</Text>
            <Button size="small" icon={<CopyOutlined />} onClick={() => handleCopy(snippets.curl)}>
              {t.copy}
            </Button>
          </Space>
          <pre
            style={{
              margin: 0,
              padding: 12,
              background: '#1e1e1e',
              color: '#d4d4d4',
              borderRadius: 8,
              overflow: 'auto',
              fontSize: 13,
              fontFamily: "ui-monospace, 'SF Mono', 'Fira Code', 'Consolas', monospace",
            }}
          >
            {snippets.curl}
          </pre>
        </Card>
      )}

      <Card title={<span><CodeOutlined /> {t.sourceTitle}</span>}>
        <Paragraph type="secondary">{t.sourceIntro}</Paragraph>
        <pre
          style={{
            margin: 0,
            overflowX: 'auto',
            fontFamily: 'monospace',
            fontSize: 13,
            background: '#f6ffed',
            padding: 16,
            borderRadius: 8,
          }}
        >
          <code>{ENGINE_SOURCE}</code>
        </pre>
      </Card>
    </Space>
  )
}