import React, { useState, useMemo } from 'react'
import { Typography, Card, Space, Input, Descriptions, Alert, Table, Button } from 'antd'
import { MobileOutlined, ExportOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const translations = {
  pt: {
    title: 'Testador de Deep Link',
    intro: (
      <>
        Cola uma URL ou deep link (esquema customizado como{' '}
        <Text code>meuapp://</Text> ou universal link <Text code>https://</Text>)
        e vê o esquema, host, path e query params decompostos — parseado
        localmente via <Text code>URL</Text> do navegador.
      </>
    ),
    placeholder: 'meuapp://produto/123?ref=email&utm_source=campanha',
    scheme: 'Esquema',
    host: 'Host',
    path: 'Path',
    params: 'Query params',
    paramKey: 'Chave',
    paramValue: 'Valor',
    noParams: 'Sem query params',
    invalid: 'Não foi possível parsear essa URL/deep link.',
    tryOpen: 'Tentar abrir',
    tryOpenNote: 'Abre o link no navegador — funciona pra esquemas registrados no seu sistema (ex: apps instalados); a maioria dos navegadores bloqueia esquemas desconhecidos silenciosamente.',
  },
  en: {
    title: 'Deep Link Tester',
    intro: (
      <>
        Paste a URL or deep link (custom scheme like{' '}
        <Text code>myapp://</Text> or a universal link{' '}
        <Text code>https://</Text>) and see the scheme, host, path and
        query params broken down — parsed locally via the browser's{' '}
        <Text code>URL</Text>.
      </>
    ),
    placeholder: 'myapp://product/123?ref=email&utm_source=campaign',
    scheme: 'Scheme',
    host: 'Host',
    path: 'Path',
    params: 'Query params',
    paramKey: 'Key',
    paramValue: 'Value',
    noParams: 'No query params',
    invalid: 'Could not parse this URL/deep link.',
    tryOpen: 'Try opening',
    tryOpenNote: "Opens the link in the browser — works for schemes registered on your system (e.g. installed apps); most browsers silently block unknown schemes.",
  },
}

function parseDeepLink(raw) {
  const trimmed = raw.trim()
  if (!trimmed) return null
  try {
    const url = new URL(trimmed)
    const params = [...url.searchParams.entries()].map(([key, value]) => ({ key, value }))
    return {
      scheme: url.protocol.replace(':', ''),
      host: url.host || url.hostname || '',
      path: url.pathname || (url.host ? '' : trimmed.split('?')[0].split('://')[1]?.split('/').slice(1).join('/') || ''),
      params,
    }
  } catch {
    return null
  }
}

export default function DeepLinkTesterPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [input, setInput] = useState('myapp://product/123?ref=email&utm_source=campaign')

  const result = useMemo(() => parseDeepLink(input), [input])

  const columns = [
    { title: t.paramKey, dataIndex: 'key', key: 'key' },
    { title: t.paramValue, dataIndex: 'value', key: 'value' },
  ]

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><MobileOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card>
        <Space.Compact style={{ width: '100%' }}>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t.placeholder}
            style={{ fontFamily: 'monospace' }}
          />
          <Button icon={<ExportOutlined />} onClick={() => window.open(input, '_self')} disabled={!result}>
            {t.tryOpen}
          </Button>
        </Space.Compact>
      </Card>

      {input.trim() && !result && <Alert type="error" showIcon message={t.invalid} />}

      {result && (
        <>
          <Card>
            <Descriptions bordered size="small" column={1}>
              <Descriptions.Item label={t.scheme}><Text code>{result.scheme}</Text></Descriptions.Item>
              <Descriptions.Item label={t.host}><Text code>{result.host || '—'}</Text></Descriptions.Item>
              <Descriptions.Item label={t.path}><Text code>{result.path || '/'}</Text></Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title={t.params}>
            {result.params.length > 0 ? (
              <Table dataSource={result.params} columns={columns} rowKey="key" pagination={false} size="small" />
            ) : (
              <Text type="secondary">{t.noParams}</Text>
            )}
          </Card>

          <Paragraph type="secondary" style={{ fontSize: 12 }}>{t.tryOpenNote}</Paragraph>
        </>
      )}
    </Space>
  )
}
