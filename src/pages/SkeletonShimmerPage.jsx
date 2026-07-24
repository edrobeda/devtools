import React, { useState } from 'react'
import { Typography, Card, Space, Switch, Avatar } from 'antd'
import { BgColorsOutlined, UserOutlined } from '@ant-design/icons'

const { Title, Paragraph, Text } = Typography

const shimmerStyle = {
  background: 'linear-gradient(90deg, #eee 25%, #f5f5f5 37%, #eee 63%)',
  backgroundSize: '400% 100%',
  animation: 'devtools-shimmer 1.4s ease infinite',
  borderRadius: 6,
}

function ShimmerBlock({ width, height }) {
  return <div style={{ ...shimmerStyle, width, height }} />
}

function SkeletonCard() {
  return (
    <Space align="start">
      <div style={{ ...shimmerStyle, width: 48, height: 48, borderRadius: '50%' }} />
      <Space direction="vertical" size={8}>
        <ShimmerBlock width={160} height={16} />
        <ShimmerBlock width={220} height={12} />
      </Space>
    </Space>
  )
}

function LoadedCard() {
  return (
    <Space align="start">
      <Avatar size={48} icon={<UserOutlined />} />
      <Space direction="vertical" size={4}>
        <Text strong>Rodrigo Alves</Text>
        <Text type="secondary">Atualizou o deploy há 2 minutos</Text>
      </Space>
    </Space>
  )
}

const sourceCode = `const shimmerStyle = {
  background: 'linear-gradient(90deg, #eee 25%, #f5f5f5 37%, #eee 63%)',
  backgroundSize: '400% 100%',
  animation: 'devtools-shimmer 1.4s ease infinite',
  borderRadius: 6,
}

/* @keyframes devtools-shimmer {
     0%   { background-position: 100% 0; }
     100% { background-position: 0 0; }
   } */

function ShimmerBlock({ width, height }) {
  return <div style={{ ...shimmerStyle, width, height }} />
}`

export default function SkeletonShimmerPage() {
  const [loading, setLoading] = useState(true)

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <style>{`
        @keyframes devtools-shimmer {
          0% { background-position: 100% 0; }
          100% { background-position: 0 0; }
        }
      `}</style>
      <Title level={2}><BgColorsOutlined /> Estilo: Skeleton Shimmer</Title>
      <Paragraph type="secondary">
        Placeholder de carregamento com um brilho animado atravessando a
        área (efeito "shimmer"), feito só com gradiente CSS e{' '}
        <Text code>@keyframes</Text> — sem lib de animação. Alternativa mais
        viva ao <Text code>Skeleton</Text> padrão do Ant Design.
      </Paragraph>

      <Card
        title="Demonstração"
        extra={
          <Space>
            <Text type="secondary">Carregando</Text>
            <Switch checked={loading} onChange={setLoading} />
          </Space>
        }
      >
        {loading ? <SkeletonCard /> : <LoadedCard />}
      </Card>

      <Card title="Código-fonte">
        <pre style={{ margin: 0, overflowX: 'auto' }}>
          <code>{sourceCode}</code>
        </pre>
      </Card>
    </Space>
  )
}
