import React, { useMemo, useState } from 'react'
import { Typography, Card, Space, Input, List, Tag, Radio } from 'antd'
import { ReadOutlined, SearchOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const CODES = [
  { code: 100, cat: '1xx', pt: 'Continue — o cliente pode continuar enviando o corpo da requisição', en: 'Continue — the client can keep sending the request body' },
  { code: 101, cat: '1xx', pt: 'Switching Protocols — servidor aceita trocar de protocolo (ex. para WebSocket)', en: 'Switching Protocols — server agrees to switch protocols (e.g. to WebSocket)' },
  { code: 200, cat: '2xx', pt: 'OK — requisição bem-sucedida', en: 'OK — request succeeded' },
  { code: 201, cat: '2xx', pt: 'Created — recurso criado com sucesso', en: 'Created — resource created successfully' },
  { code: 202, cat: '2xx', pt: 'Accepted — requisição aceita, processamento ainda não concluído', en: 'Accepted — request accepted, processing not yet complete' },
  { code: 204, cat: '2xx', pt: 'No Content — sucesso, sem corpo de resposta', en: 'No Content — success, no response body' },
  { code: 206, cat: '2xx', pt: 'Partial Content — resposta parcial (ex. range de download)', en: 'Partial Content — partial response (e.g. download range)' },
  { code: 300, cat: '3xx', pt: 'Multiple Choices — várias opções de recurso possíveis', en: 'Multiple Choices — several possible resource options' },
  { code: 301, cat: '3xx', pt: 'Moved Permanently — recurso movido pra sempre, atualize o link', en: 'Moved Permanently — resource moved for good, update the link' },
  { code: 302, cat: '3xx', pt: 'Found — redirecionamento temporário', en: 'Found — temporary redirect' },
  { code: 304, cat: '3xx', pt: 'Not Modified — versão em cache ainda é válida', en: 'Not Modified — cached version is still valid' },
  { code: 307, cat: '3xx', pt: 'Temporary Redirect — redireciona mantendo o método HTTP original', en: 'Temporary Redirect — redirects while preserving the original HTTP method' },
  { code: 308, cat: '3xx', pt: 'Permanent Redirect — igual ao 301, mas preserva o método HTTP', en: 'Permanent Redirect — like 301, but preserves the HTTP method' },
  { code: 400, cat: '4xx', pt: 'Bad Request — requisição malformada ou inválida', en: 'Bad Request — malformed or invalid request' },
  { code: 401, cat: '4xx', pt: 'Unauthorized — falta autenticação (ou é inválida)', en: 'Unauthorized — authentication missing or invalid' },
  { code: 403, cat: '4xx', pt: 'Forbidden — autenticado, mas sem permissão pro recurso', en: 'Forbidden — authenticated, but no permission for the resource' },
  { code: 404, cat: '4xx', pt: 'Not Found — recurso não existe', en: 'Not Found — resource does not exist' },
  { code: 405, cat: '4xx', pt: 'Method Not Allowed — método HTTP não suportado nesse recurso', en: 'Method Not Allowed — HTTP method not supported on this resource' },
  { code: 408, cat: '4xx', pt: 'Request Timeout — servidor esperou demais pela requisição', en: 'Request Timeout — server waited too long for the request' },
  { code: 409, cat: '4xx', pt: 'Conflict — conflito com o estado atual do recurso', en: 'Conflict — conflicts with the current state of the resource' },
  { code: 410, cat: '4xx', pt: 'Gone — recurso existiu, mas foi removido permanentemente', en: 'Gone — resource used to exist but was permanently removed' },
  { code: 415, cat: '4xx', pt: 'Unsupported Media Type — Content-Type do corpo não é aceito', en: 'Unsupported Media Type — request body Content-Type not accepted' },
  { code: 422, cat: '4xx', pt: 'Unprocessable Entity — sintaxe ok, mas dados semanticamente inválidos', en: 'Unprocessable Entity — syntax ok, but data is semantically invalid' },
  { code: 429, cat: '4xx', pt: 'Too Many Requests — rate limit excedido', en: 'Too Many Requests — rate limit exceeded' },
  { code: 500, cat: '5xx', pt: 'Internal Server Error — erro genérico não tratado no servidor', en: 'Internal Server Error — generic unhandled server error' },
  { code: 501, cat: '5xx', pt: 'Not Implemented — servidor não suporta essa funcionalidade', en: 'Not Implemented — server does not support this functionality' },
  { code: 502, cat: '5xx', pt: 'Bad Gateway — resposta inválida de um servidor upstream', en: 'Bad Gateway — invalid response from an upstream server' },
  { code: 503, cat: '5xx', pt: 'Service Unavailable — servidor temporariamente indisponível (sobrecarga/manutenção)', en: 'Service Unavailable — server temporarily unavailable (overload/maintenance)' },
  { code: 504, cat: '5xx', pt: 'Gateway Timeout — servidor upstream não respondeu a tempo', en: 'Gateway Timeout — upstream server did not respond in time' },
]

const CATEGORY_COLOR = { '1xx': 'blue', '2xx': 'green', '3xx': 'gold', '4xx': 'orange', '5xx': 'red' }

const translations = {
  pt: {
    title: 'Referência de HTTP Status Codes',
    intro: 'Cheat sheet pesquisável e filtrável por categoria dos códigos de status HTTP mais usados no dia a dia.',
    search: 'Buscar código ou descrição...',
    all: 'Todos',
    empty: 'Nenhum código encontrado.',
  },
  en: {
    title: 'HTTP Status Codes Reference',
    intro: 'A searchable, category-filterable cheat sheet of the HTTP status codes used most often in day-to-day work.',
    search: 'Search code or description...',
    all: 'All',
    empty: 'No code found.',
  },
}

export default function HttpStatusCodesPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return CODES.filter((c) => {
      if (category !== 'all' && c.cat !== category) return false
      if (!q) return true
      return String(c.code).includes(q) || c[lang].toLowerCase().includes(q)
    })
  }, [query, category, lang])

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><ReadOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Space direction="vertical" style={{ width: '100%' }}>
        <Input
          prefix={<SearchOutlined />}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.search}
          allowClear
        />
        <Radio.Group value={category} onChange={(e) => setCategory(e.target.value)} optionType="button">
          <Radio.Button value="all">{t.all}</Radio.Button>
          {Object.keys(CATEGORY_COLOR).map((cat) => (
            <Radio.Button key={cat} value={cat}>{cat}</Radio.Button>
          ))}
        </Radio.Group>
      </Space>

      <Card>
        <List
          dataSource={filtered}
          locale={{ emptyText: t.empty }}
          renderItem={(item) => (
            <List.Item>
              <Space direction="vertical" size={2} style={{ width: '100%' }}>
                <Space>
                  <Text code style={{ fontSize: 14 }}>{item.code}</Text>
                  <Tag color={CATEGORY_COLOR[item.cat]}>{item.cat}</Tag>
                </Space>
                <Text type="secondary">{item[lang]}</Text>
              </Space>
            </List.Item>
          )}
        />
      </Card>
    </Space>
  )
}
