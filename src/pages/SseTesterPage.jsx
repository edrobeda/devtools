import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  Typography, Card, Space, Input, Button, Tag, Alert, Badge,
  List, Switch, Collapse, Segmented, message,
} from 'antd'
import {
  ApiOutlined, PlayCircleOutlined, DisconnectOutlined, ClearOutlined,
  CodeOutlined, LinkOutlined, ThunderboltOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  formatBytes, parseSSEFrame, createSSEParser, createDemoStream,
} from '../utils/sseTester'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input
const { Panel } = Collapse

const translations = {
  pt: {
    title: 'Testador de SSE (Server-Sent Events)',
    intro:
      'Conecte-se a um endpoint Server-Sent Events (EventSource) e veja os eventos chegando ao vivo, com o framing do protocolo decodificado campo a campo. Inclui um simulador local que gera o stream sem nenhuma rede — mesmo caminho de parsing de um endpoint real.',
    demoLabel: 'Simulador local',
    urlLabel: 'URL real (HTTP)',
    demoHint: 'O simulador gera frames na própria página (comentário, data, event, id, retry e data multilinha, inclusive um frame entregue "quebrado" no meio) — ideal pra ver o parser funcionando offline, sem depender de serviço externo.',
    urlPlaceholder: 'https://exemplo.com/eventos',
    methodLabel: 'Método',
    headersLabel: 'Cabeçalhos (opcional)',
    headersPlaceholder: 'Name: value, um por linha',
    inlineExample: 'Linha única',
    multiExample: 'Multilinha',
    startDemo: 'Iniciar demo',
    connect: 'Conectar',
    stop: 'Parar',
    clearLog: 'Limpar histórico',
    status: 'Status',
    events: 'Eventos',
    bytes: 'bytes',
    noLog: 'Nenhum evento ainda. Inicie a demo ou conecte em uma URL.',
    system: 'sistema',
    connecting: 'Conectando em',
    demoStart: 'Iniciando stream de demonstração local…',
    streamOpen: 'Stream aberto',
    httpError: 'Resposta HTTP não-2xx:',
    noBody: 'A resposta não tem corpo de streaming.',
    serverClosed: 'Stream encerrado (o servidor fechou a conexão).',
    stoppedLocally: 'Parado localmente.',
    error: 'Erro:',
    invalidUrl: 'URL inválida (use uma URL http/https completa).',
    formatJson: 'Formatar data quando for JSON',
    statusIdle: 'ocioso',
    statusConnecting: 'conectando',
    statusOpen: 'transmitindo',
    statusClosed: 'fechado',
    statusError: 'erro',
    whatIs: 'O que é SSE?',
    whatIsBody: (() => (
      <Paragraph style={{ marginBottom: 0 }}>
        <Text strong>SSE</Text> (Server-Sent Events) é a forma de o servidor
        empurrar dados ao navegador por <Text code>HTTP</Text> num stream de
        texto unidirecional que fica aberto. Enquanto o WebSocket é um canal
        bidirecional próprio (ws/wss), o SSE reutiliza HTTP puro — manda (
        <Text code>event:</Text>, <Text code>data:</Text>,{' '}
        <Text code>id:</Text>, <Text code>retry:</Text> e comentários{' '}
        <Text code>:</Text>) e encerra cada evento com uma linha vazia. Múltiplas
        linhas <Text code>data:</Text> viram um único payload separado por{' '}
        <Text code>{'\n'}</Text>. Adjetivos práticos: reconexão automática (
        <Text code>EventSource</Text> reenvia <Text code>Last-Event-ID</Text>),
        funciona por HTTP simples, e é o padrão ideal pra feeds, notificações e
        logs ao vivo.
      </Paragraph>
    ))(),
    howItWorks: 'Como o parser funciona',
    howItWorksBody: 'O logger abaixo é alimentado por um parser incremental: cada chunk de bytes é decodificado e acumulado num buffer; quando um frame completo fecha (linha vazia), os campos são lidos e o evento é disparado. O mesmo parser roda para o simulador local e para a URL real (via fetch + response.body.getReader()). Frames sem data (comentários) são ignorados pela spec, mas contam nos bytes recebidos.',
    sourceTitle: 'Código-fonte do motor',
    sourceIntro: 'O motor vive em src/utils/sseTester.js — 100% client-side: parseSSEFrame (campos de um frame), createSSEParser (buffer incremental) e createDemoStream (o "servidor" local).',
    corsNote: 'Para testar uma URL real, o endpoint precisa liberar CORS (*) e servir text/event-stream; quebra de conexão por CORS aparece como erro abaixo.',
    time: 'hora',
    bytesIn: 'recebidos',
    demoFinishedNote: 'O simulador termina sozinho depois de alguns segundos — aperte Iniciar demo de novo para repetir.',
  },
  en: {
    title: 'SSE Tester (Server-Sent Events)',
    intro:
      'Connect to a Server-Sent Events (EventSource) endpoint and watch events arrive live, with the protocol framing decoded field by field. Includes a local simulator that generates the stream with no network — parsed by the exact same code path as a real endpoint.',
    demoLabel: 'Local simulator',
    urlLabel: 'Real URL (HTTP)',
    demoHint: 'The simulator generates frames right on the page (comment, data, event, id, retry and multiline data, including one frame delivered "split" mid-way) — great for watching the parser work offline, with no external service.',
    urlPlaceholder: 'https://example.com/events',
    methodLabel: 'Method',
    headersLabel: 'Headers (optional)',
    headersPlaceholder: 'Name: value, one per line',
    inlineExample: 'Single line',
    multiExample: 'Multiline',
    startDemo: 'Start demo',
    connect: 'Connect',
    stop: 'Stop',
    clearLog: 'Clear history',
    status: 'Status',
    events: 'Events',
    bytes: 'bytes',
    noLog: 'No events yet. Start the demo or connect to a URL.',
    system: 'system',
    connecting: 'Connecting to',
    demoStart: 'Starting local demo stream…',
    streamOpen: 'Stream open',
    httpError: 'Non-2xx HTTP response:',
    noBody: 'The response has no streaming body.',
    serverClosed: 'Stream ended (server closed the connection).',
    stoppedLocally: 'Stopped locally.',
    error: 'Error:',
    invalidUrl: 'Invalid URL (use a full http/https URL).',
    formatJson: 'Format data when it is JSON',
    statusIdle: 'idle',
    statusConnecting: 'connecting',
    statusOpen: 'streaming',
    statusClosed: 'closed',
    statusError: 'error',
    whatIs: 'What is SSE?',
    whatIsBody: (() => (
      <Paragraph style={{ marginBottom: 0 }}>
        <Text strong>SSE</Text> (Server-Sent Events) is how a server pushes data
        to the browser over plain <Text code>HTTP</Text>, in a one-way text
        stream that stays open. While WebSocket is a dedicated bidirectional
        channel (ws/wss), SSE reuses plain HTTP — frames carry{' '}
        <Text code>event:</Text>, <Text code>data:</Text>, <Text code>id:</Text>,{' '}
        <Text code>retry:</Text> and <Text code>:</Text> comments, and each
        event ends with a blank line. Multiple <Text code>data:</Text> lines
        become a single payload joined by <Text code>{'\n'}</Text>. Practical
        perks: auto-reconnect (<Text code>EventSource</Text> resent its{' '}
        <Text code>Last-Event-ID</Text>), works over plain HTTP, and is the go-to
        for feeds, notifications and live logs.
      </Paragraph>
    ))(),
    howItWorks: 'How the parser works',
    howItWorksBody: 'The logger below is fed by an incremental parser: each byte chunk is decoded and accumulated in a buffer; when a complete frame closes (blank line) the fields are read and the event fires. The same parser runs for both the local simulator and a real URL (via fetch + response.body.getReader()). Frames with no data (comments) are ignored by the spec but still count toward received bytes.',
    sourceTitle: 'Engine source code',
    sourceIntro: 'The engine lives in src/utils/sseTester.js — 100% client-side: parseSSEFrame (fields of a single frame), createSSEParser (incremental buffering) and createDemoStream (the local "server").',
    corsNote: 'To test a real URL the endpoint must allow CORS (*) and serve text/event-stream; CORS failures surface as an error below.',
    time: 'time',
    bytesIn: 'received',
    demoFinishedNote: 'The simulator ends by itself after a few seconds — press Start demo again to replay.',
  },
}

const STATUS_META = {
  IDLE: { color: 'default', labelKey: 'statusIdle' },
  CONNECTING: { color: 'orange', labelKey: 'statusConnecting' },
  OPEN: { color: 'green', labelKey: 'statusOpen' },
  CLOSED: { color: 'red', labelKey: 'statusClosed' },
  ERROR: { color: 'magenta', labelKey: 'statusError' },
}

const EVENT_COLORS = {
  message: 'blue',
  ping: 'gold',
  notification: 'purple',
  feedback: 'green',
}

const sourceCode = [
  '// src/utils/sseTester.js',
  '',
  parseSSEFrame.toString(),
  '',
  createSSEParser.toString(),
  '',
  createDemoStream.toString(),
].join('\n\n')

function prettyPayload(data, formatJson) {
  if (formatJson) {
    try {
      return JSON.stringify(JSON.parse(data), null, 2)
    } catch {
      // não é JSON
    }
  }
  return data
}

export default function SseTesterPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [mode, setMode] = useState('demo')
  const [url, setUrl] = useState('')
  const [method, setMethod] = useState('GET')
  const [headersText, setHeadersText] = useState('')
  const [status, setStatus] = useState('IDLE')
  const [log, setLog] = useState([])
  const [bytes, setBytes] = useState(0)
  const [formatJson, setFormatJson] = useState(true)

  const sessionRef = useRef(null)
  const keyRef = useRef(0)
  const listEndRef = useRef(null)

  const isActive = status === 'CONNECTING' || status === 'OPEN'

  const stats = useMemo(() => {
    const events = log.filter((item) => item.kind === 'event').length
    return { events, bytes }
  }, [log, bytes])

  const append = (record) => {
    setLog((prev) => [...prev, record])
  }

  const appendSystem = (data) => {
    append({ key: (keyRef.current += 1), time: Date.now(), kind: 'system', data })
  }

  const addEventRecord = (ev) => {
    append({
      key: (keyRef.current += 1),
      time: Date.now(),
      kind: 'event',
      eventName: ev.event || 'message',
      id: ev.id || null,
      retry: ev.retry || null,
      data: ev.data,
      bytes: ev.bytes,
    })
  }

  const beginSession = () => {
    if (sessionRef.current) sessionRef.current.abort()
    const controller = new AbortController()
    sessionRef.current = controller
    return controller.signal
  }

  const stopSession = () => {
    if (sessionRef.current) sessionRef.current.abort()
  }

  const runStream = async (body, signal) => {
    const reader = body.getReader()
    const decoder = new TextDecoder()
    const parser = createSSEParser(addEventRecord)
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      if (value && value.byteLength > 0) {
        setBytes((prev) => prev + value.byteLength)
        parser(decoder.decode(value, { stream: true }))
      }
    }
    if (!signal.aborted) {
      setStatus('CLOSED')
      appendSystem(t.serverClosed)
    }
  }

  const wrapStream = async (body, signal) => {
    try {
      await runStream(body, signal)
    } catch (err) {
      if (err && err.name === 'AbortError') {
        setStatus('CLOSED')
        appendSystem(t.stoppedLocally)
      } else {
        setStatus('ERROR')
        appendSystem(t.error + ' ' + (err && err.message ? err.message : String(err)))
      }
    }
  }

  const startDemo = () => {
    const signal = beginSession()
    setLog([])
    setBytes(0)
    setStatus('CONNECTING')
    appendSystem(t.demoStart)
    wrapStream(createDemoStream(signal), signal)
  }

  const connectUrl = () => {
    let parsedUrl
    try {
      parsedUrl = new URL(url.trim())
    } catch {
      message.error(t.invalidUrl)
      return
    }
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      message.error(t.invalidUrl)
      return
    }
    const signal = beginSession()
    setLog([])
    setBytes(0)
    setStatus('CONNECTING')
    appendSystem(t.connecting + ' ' + parsedUrl.toString())

    const headers = {}
    headersText.split(/\r?\n/).forEach((line) => {
      const idx = line.indexOf(':')
      if (idx === -1) return
      const name = line.slice(0, idx).trim()
      if (!name) return
      headers[name] = line.slice(idx + 1).trim()
    })

    fetch(parsedUrl.toString(), { method, headers, signal })
      .then((res) => {
        if (!res.ok) {
          setStatus('ERROR')
          appendSystem(t.httpError + ' ' + res.status + ' ' + (res.statusText || ''))
          return null
        }
        if (!res.body) {
          setStatus('CLOSED')
          appendSystem(t.noBody)
          return null
        }
        setStatus('OPEN')
        appendSystem(t.streamOpen + ' (' + res.status + ' ' + (res.statusText || '') + ')')
        return res.body
      })
      .then((body) => {
        if (body) return wrapStream(body, signal)
        return undefined
      })
      .catch((err) => {
        if (err && err.name === 'AbortError') {
          setStatus('CLOSED')
          appendSystem(t.stoppedLocally)
        } else {
          setStatus('ERROR')
          appendSystem(t.error + ' ' + (err && err.message ? err.message : String(err)))
        }
      })
  }

  const stop = () => {
    stopSession()
  }

  useEffect(() => {
    return () => stopSession()
  }, [])

  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [log])

  const isDemo = mode === 'demo'
  const meta = STATUS_META[status] || STATUS_META.IDLE

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><ApiOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Segmented
            options={[
              { label: t.demoLabel, value: 'demo' },
              { label: t.urlLabel, value: 'url' },
            ]}
            value={mode}
            onChange={setMode}
          />

          {isDemo ? (
            <Alert type="success" showIcon message={t.demoHint} />
          ) : (
            <>
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <Alert type="info" showIcon message={t.corsNote} />
                <Space wrap>
                  <Segmented
                    options={[{ label: 'GET', value: 'GET' }, { label: 'POST', value: 'POST' }]}
                    value={method}
                    onChange={setMethod}
                    disabled={isActive}
                  />
                  <Input
                    style={{ fontFamily: 'monospace', minWidth: 360 }}
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder={t.urlPlaceholder}
                    prefix={<LinkOutlined />}
                    disabled={isActive}
                  />
                </Space>
                <TextArea
                  rows={2}
                  value={headersText}
                  onChange={(e) => setHeadersText(e.target.value)}
                  placeholder={t.headersPlaceholder}
                  style={{ fontFamily: 'monospace' }}
                  disabled={isActive}
                />
              </Space>
            </>
          )}

          <Space wrap>
            <Button
              type="primary"
              icon={isDemo ? <PlayCircleOutlined /> : <ApiOutlined />}
              onClick={isDemo ? startDemo : connectUrl}
              disabled={isActive || (!isDemo && !url.trim())}
              loading={status === 'CONNECTING'}
            >
              {isDemo ? t.startDemo : t.connect}
            </Button>
            <Button
              danger
              icon={<DisconnectOutlined />}
              onClick={stop}
              disabled={!isActive}
            >
              {t.stop}
            </Button>
            <Button
              size="small"
              icon={<ClearOutlined />}
              onClick={() => { setLog([]); setBytes(0) }}
              disabled={log.length === 0}
            >
              {t.clearLog}
            </Button>
          </Space>
        </Space>
      </Card>

      <Card>
        <Space size="large" wrap>
          <span>
            <Text type="secondary">{t.status}: </Text>
            <Badge color={meta.color} text={t[meta.labelKey]} />
          </span>
          <span>
            <Text type="secondary">{t.events}: </Text>
            <Text strong>{stats.events}</Text>
          </span>
          <span>
            <Text type="secondary">{t.bytesIn}: </Text>
            <Text strong>{formatBytes(stats.bytes)}</Text>{' '}
            <Text type="secondary">({stats.bytes} {t.bytes})</Text>
          </span>
          {isDemo && status === 'CLOSED' && (
            <Text type="secondary" style={{ fontSize: 12 }}>— {t.demoFinishedNote}</Text>
          )}
        </Space>
      </Card>

      <Card
        title={lang === 'pt' ? 'Eventos recebidos' : 'Received events'}
        extra={
          <Switch
            checked={formatJson}
            onChange={setFormatJson}
            checkedChildren="JSON"
            unCheckedChildren="raw"
            size="small"
          />
        }
      >
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <Text type="secondary">{t.formatJson}</Text>
          {log.length === 0 ? (
            <Text type="secondary">{t.noLog}</Text>
          ) : (
            <div style={{ maxHeight: 420, overflow: 'auto' }}>
              <List
                size="small"
                dataSource={log}
                renderItem={(item) => (
                  <List.Item style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                    {item.kind === 'system' ? (
                      <Space>
                        <Tag>{t.system}</Tag>
                        <Text type="secondary" style={{ fontSize: 12, fontFamily: 'monospace' }}>
                          {new Date(item.time).toLocaleTimeString()}
                        </Text>
                        <Text type="secondary">{item.data}</Text>
                      </Space>
                    ) : (
                      <Space direction="vertical" size="small" style={{ width: '100%' }}>
                        <Space wrap>
                          <Tag color={EVENT_COLORS[item.eventName] || 'cyan'}>
                            {item.eventName === 'message' ? 'message' : item.eventName}
                          </Tag>
                          {item.id && <Tag color="blue">{'id: ' + item.id}</Tag>}
                          {item.retry != null && <Tag color="orange">{'retry: ' + item.retry + 'ms'}</Tag>}
                          <Text type="secondary" style={{ fontSize: 12, fontFamily: 'monospace' }}>
                            {new Date(item.time).toLocaleTimeString()}
                          </Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {item.bytes} {t.bytes}
                          </Text>
                        </Space>
                        <pre
                          style={{
                            margin: 0,
                            padding: 8,
                            background: '#f6ffed',
                            borderRadius: 6,
                            fontFamily: 'monospace',
                            fontSize: 12,
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                          }}
                        >
                          <code>{prettyPayload(item.data, formatJson)}</code>
                        </pre>
                      </Space>
                    )}
                  </List.Item>
                )}
              />
              <div ref={listEndRef} />
            </div>
          )}
        </Space>
      </Card>

      <Collapse defaultActiveKey={['how']}>
        <Panel header={t.whatIs} key="what">
          {t.whatIsBody}
        </Panel>
        <Panel header={t.howItWorks} key="how">
          <Paragraph type="secondary">{t.howItWorksBody}</Paragraph>
        </Panel>
      </Collapse>

      <Card title={<span><CodeOutlined /> {t.sourceTitle}</span>}>
        <Paragraph type="secondary">{t.sourceIntro}</Paragraph>
        <pre style={{
          margin: 0,
          overflowX: 'auto',
          fontFamily: 'monospace',
          fontSize: 12,
          background: '#f6ffed',
          padding: 16,
          borderRadius: 8,
        }}>
          <code>{sourceCode}</code>
        </pre>
      </Card>
    </Space>
  )
}