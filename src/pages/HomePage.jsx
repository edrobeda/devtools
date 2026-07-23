import React from 'react'
import { Typography, Card, Space } from 'antd'
import { ToolOutlined } from '@ant-design/icons'

const { Title, Paragraph } = Typography

export default function HomePage() {
  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><ToolOutlined /> DevTools</Title>
      <Card>
        <Paragraph>
          Espaço pra ferramentas internas de desenvolvimento. Adicione novas
          páginas em <code>src/pages/</code> e registre a rota em{' '}
          <code>src/routes.jsx</code> — se precisar de API, os endpoints
          entram no <code>manager-api</code> compartilhado, não aqui.
        </Paragraph>
      </Card>
    </Space>
  )
}
