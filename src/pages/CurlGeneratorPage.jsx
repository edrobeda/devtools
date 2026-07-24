import React, { useState, useMemo } from 'react'
import { Typography, Card, Space, Input, Select, Button, message, Table } from 'antd'
import { ApiOutlined, CopyOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input

const translations = {
  pt: {
    title: 'Gerador de comando cURL',
    intro: (
      <>
        Monta um comando <Text code>curl</Text> a partir de método, URL,
        headers e corpo — sem disparar nenhuma requisição de verdade, só
        gera o texto do comando. Tudo local.
      </>
    ),
    method: 'Método',
    url: 'URL',
    urlPlaceholder: 'https://api.exemplo.com/v1/recurso',
    headers: 'Headers',
    headerKey: 'Nome',
    headerValue: 'Valor',
    addHeader: 'Adicionar header',
    body: 'Corpo (JSON ou texto)',
    bodyPlaceholder: '{"chave": "valor"}',
    result: 'Comando gerado',
    copy: 'Copiar',
    copied: 'Copiado',
  },
  en: {
    title: 'cURL Command Generator',
    intro: (
      <>
        Builds a <Text code>curl</Text> command from method, URL, headers
        and body — never fires a real request, just generates the command
        text. All local.
      </>
    ),
    method: 'Method',
    url: 'URL',
    urlPlaceholder: 'https://api.example.com/v1/resource',
    headers: 'Headers',
    headerKey: 'Name',
    headerValue: 'Value',
    addHeader: 'Add header',
    body: 'Body (JSON or text)',
    bodyPlaceholder: '{"key": "value"}',
    result: 'Generated command',
    copy: 'Copy',
    copied: 'Copied',
  },
}

function shellEscape(str) {
  return `'${String(str).replace(/'/g, `'\\''`)}'`
}

export default function CurlGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [method, setMethod] = useState('GET')
  const [url, setUrl] = useState('')
  const [headers, setHeaders] = useState([{ key: 'Content-Type', value: 'application/json' }])
  const [body, setBody] = useState('')

  function updateHeader(index, field, value) {
    setHeaders((prev) => prev.map((h, i) => (i === index ? { ...h, [field]: value } : h)))
  }

  function addHeader() {
    setHeaders((prev) => [...prev, { key: '', value: '' }])
  }

  function removeHeader(index) {
    setHeaders((prev) => prev.filter((_, i) => i !== index))
  }

  const command = useMemo(() => {
    const parts = ['curl', '-X', method]
    headers.forEach(({ key, value }) => {
      if (key.trim()) parts.push('-H', shellEscape(`${key}: ${value}`))
    })
    if (body.trim() && method !== 'GET') {
      parts.push('-d', shellEscape(body))
    }
    parts.push(shellEscape(url || ''))
    return parts.join(' \\\n  ')
  }, [method, url, headers, body])

  function handleCopy() {
    navigator.clipboard.writeText(command)
    message.success(t.copied)
  }

  const columns = [
    {
      title: t.headerKey,
      dataIndex: 'key',
      render: (_, __, index) => (
        <Input value={headers[index].key} onChange={(e) => updateHeader(index, 'key', e.target.value)} />
      ),
    },
    {
      title: t.headerValue,
      dataIndex: 'value',
      render: (_, __, index) => (
        <Input value={headers[index].value} onChange={(e) => updateHeader(index, 'value', e.target.value)} />
      ),
    },
    {
      title: '',
      width: 48,
      render: (_, __, index) => (
        <Button danger type="text" icon={<DeleteOutlined />} onClick={() => removeHeader(index)} />
      ),
    },
  ]

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><ApiOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card>
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Space.Compact style={{ width: '100%' }}>
            <Select
              value={method}
              onChange={setMethod}
              style={{ width: 120 }}
              options={['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'].map((m) => ({ value: m, label: m }))}
            />
            <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder={t.urlPlaceholder} />
          </Space.Compact>

          <div>
            <Text strong>{t.headers}</Text>
            <Table
              style={{ marginTop: 8 }}
              size="small"
              pagination={false}
              rowKey={(_, index) => index}
              dataSource={headers}
              columns={columns}
            />
            <Button style={{ marginTop: 8 }} icon={<PlusOutlined />} onClick={addHeader}>{t.addHeader}</Button>
          </div>

          {method !== 'GET' && (
            <div>
              <Text strong>{t.body}</Text>
              <TextArea
                style={{ marginTop: 8, fontFamily: 'monospace' }}
                rows={4}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={t.bodyPlaceholder}
              />
            </div>
          )}
        </Space>
      </Card>

      <Card
        title={t.result}
        extra={<Button size="small" icon={<CopyOutlined />} onClick={handleCopy}>{t.copy}</Button>}
      >
        <pre style={{ margin: 0, overflowX: 'auto' }}>
          <code>{command}</code>
        </pre>
      </Card>
    </Space>
  )
}
