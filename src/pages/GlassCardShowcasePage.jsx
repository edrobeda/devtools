import React from 'react'
import { Typography, Card, Space, Row, Col } from 'antd'
import { BgColorsOutlined, ThunderboltOutlined, CloudOutlined, RocketOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const glassCardStyle = {
  background: 'rgba(255, 255, 255, 0.12)',
  backdropFilter: 'blur(14px)',
  WebkitBackdropFilter: 'blur(14px)',
  border: '1px solid rgba(255, 255, 255, 0.25)',
  borderRadius: 16,
  padding: 24,
  color: '#fff',
  boxShadow: '0 8px 32px rgba(31, 38, 135, 0.25)',
}

const sourceCode = `const glassCardStyle = {
  background: 'rgba(255, 255, 255, 0.12)',
  backdropFilter: 'blur(14px)',
  WebkitBackdropFilter: 'blur(14px)',
  border: '1px solid rgba(255, 255, 255, 0.25)',
  borderRadius: 16,
  padding: 24,
  color: '#fff',
  boxShadow: '0 8px 32px rgba(31, 38, 135, 0.25)',
}

// needs a colored/gradient background behind it for the blur to show
<div style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', padding: 32 }}>
  <div style={glassCardStyle}>
    <ThunderboltOutlined /> Deploys today
    <div style={{ fontSize: 28, fontWeight: 700 }}>12</div>
  </div>
</div>`

const translations = {
  pt: {
    title: 'Estilo: Glass Card',
    intro: 'Cartão com efeito de vidro fosco (glassmorphism) — fundo translúcido com blur, borda sutil e sombra suave. Funciona melhor sobre um fundo com cor ou gradiente forte por trás, senão o blur não tem o que borrar.',
    sourceTitle: 'Código-fonte',
    stats: [
      { icon: <ThunderboltOutlined />, label: 'Deploys hoje', value: '12' },
      { icon: <CloudOutlined />, label: 'Uptime', value: '99.98%' },
      { icon: <RocketOutlined />, label: 'Builds na fila', value: '3' },
    ],
  },
  en: {
    title: 'Style: Glass Card',
    intro: 'A frosted-glass card (glassmorphism) — translucent background with blur, a subtle border and a soft shadow. Works best over a strong color or gradient background, otherwise there is nothing for the blur to blur.',
    sourceTitle: 'Source code',
    stats: [
      { icon: <ThunderboltOutlined />, label: 'Deploys today', value: '12' },
      { icon: <CloudOutlined />, label: 'Uptime', value: '99.98%' },
      { icon: <RocketOutlined />, label: 'Builds queued', value: '3' },
    ],
  },
}

export default function GlassCardShowcasePage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><BgColorsOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <div
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: 12,
          padding: 32,
        }}
      >
        <Row gutter={[16, 16]}>
          {t.stats.map((s) => (
            <Col xs={24} sm={8} key={s.label}>
              <div style={glassCardStyle}>
                <Space direction="vertical" size={4}>
                  <span style={{ fontSize: 20 }}>{s.icon}</span>
                  <Text style={{ color: 'rgba(255,255,255,0.85)' }}>{s.label}</Text>
                  <span style={{ fontSize: 28, fontWeight: 700 }}>{s.value}</span>
                </Space>
              </div>
            </Col>
          ))}
        </Row>
      </div>

      <Card title={t.sourceTitle}>
        <pre style={{ margin: 0, overflowX: 'auto' }}>
          <code>{sourceCode}</code>
        </pre>
      </Card>
    </Space>
  )
}
