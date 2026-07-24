import React from 'react'
import { Typography, Card, Space } from 'antd'
import { ToolOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph } = Typography

const translations = {
  pt: {
    body: (
      <>
        Espaço pra ferramentas internas de desenvolvimento. Adicione novas
        páginas em <code>src/pages/</code> e registre a rota em{' '}
        <code>src/routes.jsx</code> — se precisar de API, os endpoints
        entram no <code>manager-api</code> compartilhado, não aqui.
      </>
    ),
  },
  en: {
    body: (
      <>
        A space for internal development tools. Add new pages under{' '}
        <code>src/pages/</code> and register the route in{' '}
        <code>src/routes.jsx</code> — if an API is ever needed, endpoints
        go in the shared <code>manager-api</code>, not here.
      </>
    ),
  },
}

export default function HomePage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><ToolOutlined /> DevTools</Title>
      <Card>
        <Paragraph>{t.body}</Paragraph>
      </Card>
    </Space>
  )
}
