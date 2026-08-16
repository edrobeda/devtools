import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  Typography, Card, Space, Input, Button, Tag, Alert, Badge,
  List, Switch, Collapse, message,
} from 'antd'
import {
  ApiOutlined, LinkOutlined, SendOutlined,
  DisconnectOutlined, ClearOutlined, CodeOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  DEFAULT_ECHO_URL, tryFormatPayload,
  buildMessageRecord, formatBytes,
} from '../utils/websocketTester'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input
const { Panel } = Collapse

const sourceCode = [
  'import { DEFAULT_ECHO_URL, buildMessageRecord } from',
  '  "../utils/websocketTester"',
  '',
  '// Abre uma conexão WebSocket 100% no navegador',
  'const ws = new WebSocket(DEFAULT_ECHO_URL)',
  '',
  'ws.onopen = () => {',
  '  console.log("conectado")',
  '  ws.send(JSON.stringify({ hello: "world" }))',
  '}',
  '',
  'ws.onmessage = (event) => {',
  '  console.log("recebido:", event.data)',
  '}',
  '',
  'ws.onclose = (event) => {',
  '  console.log("fechado:", event.code, event.reason)',
  '}',
].join('\n')

const translations = {
  pt: {
    title: 'Testador de WebSocket',
    intro: (
      <>
        Conecte-se a qualquer servidor WebSocket direto do navegador, envie
        mensagens e acompanhe a conversa em tempo real. Útil para debugar
        APIs, bots e serviços em tempo real. Nenhuma mensagem passa pelo nosso
        backend.
      </>
    ),
    urlLabel: 'URL do WebSocket',
    protocolsLabel: 'Subprotocolos (opcional)',
    protocolsHelp: 'Separados por vírgula, ex: chat, json',
    echoExample: 'Usar echo público',
    connect: 'Conectar',
    disconnect: 'Desconectar',
    status: 'Status',
    messageLabel: 'Mensagem',
    send: 'Enviar',
    formatJson: 'Formatar JSON recebido',
    clearLog: 'Limpar histórico',
    noMessages: 'Nenhuma mensagem ainda. Conecte e envie algo.',
    connecting: 'Conectando em',
    connected: 'Conexão aberta.',
    connectionError: 'Erro na conexão WebSocket.',
    disconnected: 'Conexão fechada',
    notConnected: 'Não há conexão aberta.',
    invalidUrl: 'URL de WebSocket inválida.',
    sent: 'Enviadas',
    received: 'Recebidas',
    bytes: 'bytes',
    system: 'sistema',
    examples: 'Exemplos rápidos',
    jsonExample: 'JSON',
    textExample: 'Texto',
    pingExample: 'Ping',
    sourceTitle: 'Código-fonte do motor',
    sourceIntro: 'O motor usa a API nativa WebSocket do navegador; nenhum dado sai da máquina.',
  },
  en: {
    title: 'WebSocket Tester',
    intro: (
      <>
        Connect to any WebSocket server straight from the browser, send messages
        and watch the conversation in real time. Great for debugging APIs,
        bots and real-time services. No message goes through our backend.
      </>
    ),
    urlLabel: 'WebSocket URL',
    protocolsLabel: 'Subprotocols (optional)',
    protocolsHelp: 'Comma separated, e.g. chat, json',
    echoExample: 'Use public echo',
    connect: 'Connect',
    disconnect: 'Disconnect',
    status: 'Status',
    messageLabel: 'Message',
    send: 'Send',
    formatJson: 'Format received JSON',
    clearLog: 'Clear history',
    noMessages: 'No messages yet. Connect and send something.',
    connecting: 'Connecting to',
    connected: 'Connection open.',
    connectionError: 'WebSocket connection error.',
    disconnected: 'Connection closed',
    notConnected: 'No open connection.',
    invalidUrl: 'Invalid WebSocket URL.',
    sent: 'Sent',
    received: 'Received',
    bytes: 'bytes',
    system: 'system',
    examples: 'Quick examples',
    jsonExample: 'JSON',
    textExample: 'Text',
    pingExample: 'Ping',
    sourceTitle: 'Engine source code',
    sourceIntro: 'The engine uses the browser native WebSocket API; no data leaves your machine.',
  },
}

const STATUS_COLORS = {
  CONNECTING: 'orange',
  OPEN: 'green',
  CLOSING: 'gold',
  CLOSED: 'red',
  DISCONNECTED: 'default',
  ERROR: 'red',
}

export default function WebsocketTesterPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [url, setUrl] = useState(DEFAULT_ECHO_URL)
  const [protocols, setProtocols] = useState('')
  const [message, setMessage] = useState('')
  const [log, setLog] = useState([])
  const [status, setStatus] = useState('DISCONNECTED')
  const [formatJson, setFormatJson] = useState(true)
  const wsRef = useRef(null)
  const listEndRef = useRef(null)

  const isConnected = status === 'OPEN'
  const isConnecting = status === 'CONNECTING'

  const stats = useMemo(() => {
    const sent = log.filter((m) => m.direction === 'out').length
    const received = log.filter((m) => m.direction === 'in').length
    const sentBytes = log
      .filter((m) => m.direction === 'out')
      .reduce((sum, m) => sum + m.bytes, 0)
    const receivedBytes = log
      .filter((m) => m.direction === 'in')
      .reduce((sum, m) => sum + m.bytes, 0)
    return { sent, received, sentBytes, receivedBytes }
  }, [log])

  const append = (record) => {
    setLog((prev) => [...prev, record])
  }

  const closeConnection = () => {
    if (wsRef.current) {
      try {
        wsRef.current.close()
      } catch {
        // ignore
      }
      wsRef.current = null
    }
  }

  const connect = () => {
    closeConnection()
    setLog([])

    const protoList = protocols
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean)

    try {
      const ws = new WebSocket(url, protoList.length ? protoList : undefined)
      wsRef.current = ws
      setStatus('CONNECTING')
      append(buildMessageRecord(`${t.connecting} ${url}`, 'system', 'system'))

      ws.onopen = () => {
        setStatus('OPEN')
        append(buildMessageRecord(t.connected, 'system', 'system'))
      }

      ws.onmessage = (event) => {
        const payload = typeof event.data === 'string'
          ? event.data
          : '[binary data]'
        append(buildMessageRecord(payload, 'in', typeof event.data === 'string' ? 'text' : 'binary'))
      }

      ws.onerror = () => {
        setStatus('ERROR')
        append(buildMessageRecord(t.connectionError, 'system', 'system'))
      }

      ws.onclose = (event) => {
        setStatus('CLOSED')
        const reason = event.reason ? `: ${event.reason}` : ''
        append(buildMessageRecord(`${t.disconnected} (${event.code}${reason})`, 'system', 'system'))
        if (wsRef.current === ws) {
          wsRef.current = null
        }
      }
    } catch {
      message.error(t.invalidUrl)
      setStatus('DISCONNECTED')
    }
  }

  const sendMessage = () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      message.warning(t.notConnected)
      return
    }
    wsRef.current.send(message)
    append(buildMessageRecord(message, 'out', 'text'))
    setMessage('')
  }

  const sendExample = (text) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      message.warning(t.notConnected)
      return
    }
    wsRef.current.send(text)
    append(buildMessageRecord(text, 'out', 'text'))
  }

  useEffect(() => {
    return () => closeConnection()
  }, [])

  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [log])

  const displayPayload = (payload, type) => {
    if (type === 'binary') return '[binary data]'
    if (formatJson) return tryFormatPayload(payload)
    return payload
  }

  const directionTag = (direction) => {
    if (direction === 'out') return <Tag color="blue">{t.sent}</Tag>
    if (direction === 'in') return <Tag color="cyan">{t.received}</Tag>
    return <Tag>{t.system}</Tag>
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><ApiOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Alert
        type="info"
        showIcon
        message={
          lang === 'pt'
            ? 'Dica: servidores de echo públicos podem estar indisíveis. Em produção, use a URL do seu próprio backend.'
            : 'Tip: public echo servers may be unavailable. In production, use your own backend URL.'
        }
      />

      <Card title={t.urlLabel}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={DEFAULT_ECHO_URL}
            prefix={<LinkOutlined />}
            disabled={isConnecting || isConnected}
            style={{ fontFamily: 'monospace' }}
          />
          <Input
            value={protocols}
            onChange={(e) => setProtocols(e.target.value)}
            placeholder={t.protocolsHelp}
            disabled={isConnecting || isConnected}
            style={{ fontFamily: 'monospace' }}
          />
          <Space wrap>
            <Button
              type="primary"
              icon={<ApiOutlined />}
              onClick={connect}
              disabled={isConnecting || isConnected || !url.trim()}
              loading={isConnecting}
            >
              {t.connect}
            </Button>
            <Button
              danger
              icon={<DisconnectOutlined />}
              onClick={closeConnection}
              disabled={!isConnecting && !isConnected}
            >
              {t.disconnect}
            </Button>
            <Button
              size="small"
              onClick={() => setUrl(DEFAULT_ECHO_URL)}
              disabled={isConnecting || isConnected}
            >
              {t.echoExample}
            </Button>
          </Space>
        </Space>
      </Card>

      <Card>
        <Space size="large" wrap>
          <span>
            <Text type="secondary">{t.status}: </Text>
            <Badge color={STATUS_COLORS[status] || 'default'} text={<Text strong>{status}</Text>} />
          </span>
          <span>
            <Text type="secondary">{t.sent}: </Text>
            <Text strong>{stats.sent}</Text> <Text type="secondary">({stats.sentBytes} {t.bytes})</Text>
          </span>
          <span>
            <Text type="secondary">{t.received}: </Text>
            <Text strong>{stats.received}</Text>{' '}
            <Text type="secondary">({stats.receivedBytes} {t.bytes})</Text>
          </span>
        </Space>
      </Card>

      <Card title={t.messageLabel}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <TextArea
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder='{ "hello": "world" }'
            style={{ fontFamily: 'monospace' }}
          />
          <Space wrap>
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={sendMessage}
              disabled={!isConnected || !message}
            >
              {t.send}
            </Button>
            <Switch
              checked={formatJson}
              onChange={setFormatJson}
              checkedChildren="JSON"
              unCheckedChildren="raw"
            />
            <Text type="secondary">{t.formatJson}</Text>
          </Space>

          <div>
            <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
              {t.examples}
            </Text>
            <Space wrap>
              <Button size="small" onClick={() => setMessage('Hello WebSocket!')}>
                {t.textExample}
              </Button>
              <Button size="small" onClick={() => setMessage(JSON.stringify({ type: 'ping', ts: Date.now() }, null, 2))}>
                {t.jsonExample}
              </Button>
              <Button size="small" onClick={() => setMessage('ping')}>
                {t.pingExample}
              </Button>
            </Space>
          </div>
        </Space>
      </Card>

      <Card
        title={lang === 'pt' ? 'Histórico de mensagens' : 'Message log'}
        extra={
          <Button
            size="small"
            icon={<ClearOutlined />}
            onClick={() => setLog([])}
            disabled={log.length === 0}
          >
            {t.clearLog}
          </Button>
        }
      >
        {log.length === 0 ? (
          <Text type="secondary">{t.noMessages}</Text>
        ) : (
          <div style={{ maxHeight: 420, overflow: 'auto' }}>
            <List
              size="small"
              dataSource={log}
              renderItem={(item) => (
                <List.Item style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <Space>
                      {directionTag(item.direction)}
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
                        background: item.direction === 'system' ? '#fffbe6' : '#f6ffed',
                        borderRadius: 6,
                        fontFamily: 'monospace',
                        fontSize: 12,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                      }}
                    >
                      <code>{displayPayload(item.payload, item.type)}</code>
                    </pre>
                  </Space>
                </List.Item>
              )}
            />
            <div ref={listEndRef} />
          </div>
        )}
      </Card>

      <Card title={<span><CodeOutlined /> {t.sourceTitle}</span>}>
        <Paragraph>{t.sourceIntro}</Paragraph>
        <pre style={{
          margin: 0,
          overflowX: 'auto',
          fontFamily: 'monospace',
          fontSize: 13,
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
