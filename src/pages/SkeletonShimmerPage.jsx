import React, { useState } from 'react'
import { Typography, Card, Space, Switch, Avatar } from 'antd'
import { BgColorsOutlined, UserOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

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

function LoadedCard({ name, description }) {
  return (
    <Space align="start">
      <Avatar size={48} icon={<UserOutlined />} />
      <Space direction="vertical" size={4}>
        <Text strong>{name}</Text>
        <Text type="secondary">{description}</Text>
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

const translations = {
  pt: {
    title: 'Estilo: Skeleton Shimmer',
    intro: (
      <>
        Placeholder de carregamento com um brilho animado atravessando a
        área (efeito "shimmer"), feito só com gradiente CSS e{' '}
        <Text code>@keyframes</Text> — sem lib de animação. Alternativa mais
        viva ao <Text code>Skeleton</Text> padrão do Ant Design.
      </>
    ),
    demoTitle: 'Demonstração',
    loading: 'Carregando',
    sourceTitle: 'Código-fonte',
    userName: 'Rodrigo Alves',
    userDescription: 'Atualizou o deploy há 2 minutos',
  },
  en: {
    title: 'Style: Skeleton Shimmer',
    intro: (
      <>
        A loading placeholder with an animated glow sweeping across the
        area (the "shimmer" effect), built with only a CSS gradient and{' '}
        <Text code>@keyframes</Text> — no animation library. A livelier
        alternative to Ant Design's default <Text code>Skeleton</Text>.
      </>
    ),
    demoTitle: 'Demo',
    loading: 'Loading',
    sourceTitle: 'Source code',
    userName: 'Rodrigo Alves',
    userDescription: 'Updated the deploy 2 minutes ago',
  },
}

export default function SkeletonShimmerPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [loading, setLoading] = useState(true)

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <style>{`
        @keyframes devtools-shimmer {
          0% { background-position: 100% 0; }
          100% { background-position: 0 0; }
        }
      `}</style>
      <Title level={2}><BgColorsOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card
        title={t.demoTitle}
        extra={
          <Space>
            <Text type="secondary">{t.loading}</Text>
            <Switch checked={loading} onChange={setLoading} />
          </Space>
        }
      >
        {loading ? <SkeletonCard /> : <LoadedCard name={t.userName} description={t.userDescription} />}
      </Card>

      <Card title={t.sourceTitle}>
        <pre style={{ margin: 0, overflowX: 'auto' }}>
          <code>{sourceCode}</code>
        </pre>
      </Card>
    </Space>
  )
}
