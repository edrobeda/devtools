import React from 'react'
import { Typography, Card, Space } from 'antd'
import { BgColorsOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const translations = {
  pt: {
    title: 'Componente: Botão com Borda Gradiente Animada',
    intro: (
      <>
        Botão cujo contorno é um gradiente cônico que gira continuamente,
        criado com um pseudo-elemento posicionado atrás do conteúdo e{' '}
        <Text code>@keyframes</Text> rotacionando o ângulo do{' '}
        <Text code>conic-gradient</Text>. Sem biblioteca de animação, só CSS.
      </>
    ),
    demoTitle: 'Demonstração',
    sourceTitle: 'Código-fonte',
    button1: 'Passe o mouse',
    button2: 'Clique aqui',
  },
  en: {
    title: 'Component: Animated Gradient Border Button',
    intro: (
      <>
        A button whose outline is a conic gradient spinning continuously,
        built with a pseudo-element positioned behind the content and{' '}
        <Text code>@keyframes</Text> rotating the <Text code>conic-gradient</Text>{' '}
        angle. No animation library, pure CSS.
      </>
    ),
    demoTitle: 'Demo',
    sourceTitle: 'Source code',
    button1: 'Hover me',
    button2: 'Click here',
  },
}

const styleTag = `
@keyframes gradient-border-spin {
  to { --gradient-angle: 360deg; }
}

.gradient-border-btn {
  --gradient-angle: 0deg;
  position: relative;
  padding: 10px 24px;
  border-radius: 8px;
  border: none;
  background: #141414;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
  z-index: 0;
}

.gradient-border-btn::before {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: 10px;
  z-index: -1;
  background: conic-gradient(
    from var(--gradient-angle),
    #ff4d4f, #faad14, #52c41a, #1677ff, #722ed1, #ff4d4f
  );
  animation: gradient-border-spin 3s linear infinite;
}

.gradient-border-btn::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 8px;
  background: #141414;
  z-index: -1;
}
`

const sourceCode = `/* CSS */
@keyframes gradient-border-spin {
  to { --gradient-angle: 360deg; }
}

.gradient-border-btn {
  --gradient-angle: 0deg;
  position: relative;
  padding: 10px 24px;
  border-radius: 8px;
  border: none;
  background: #141414;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
  z-index: 0;
}

.gradient-border-btn::before {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: 10px;
  z-index: -1;
  background: conic-gradient(
    from var(--gradient-angle),
    #ff4d4f, #faad14, #52c41a, #1677ff, #722ed1, #ff4d4f
  );
  animation: gradient-border-spin 3s linear infinite;
}

.gradient-border-btn::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 8px;
  background: #141414;
  z-index: -1;
}

/* JSX */
<button className="gradient-border-btn">Click here</button>`

export default function GradientBorderButtonPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <style>{styleTag}</style>
      <Title level={2}><BgColorsOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card title={t.demoTitle}>
        <Space size="large" style={{ padding: 24 }}>
          <button className="gradient-border-btn">{t.button1}</button>
          <button className="gradient-border-btn">{t.button2}</button>
        </Space>
      </Card>

      <Card title={t.sourceTitle}>
        <pre style={{ margin: 0, overflowX: 'auto' }}>
          <code>{sourceCode}</code>
        </pre>
      </Card>
    </Space>
  )
}
