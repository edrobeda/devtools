import React, { useState } from 'react'
import { Typography, Card, Space, Segmented } from 'antd'
import { LoadingOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const translations = {
  pt: {
    title: 'Componente: Loading de Dots Saltitantes',
    intro: (
      <>
        Três pontos que sobem e descem em sequência, com um pequeno atraso
        (<Text code>animation-delay</Text>) entre cada um — alternativa mais
        leve e "orgânica" a um spinner giratório, boa pra indicar "carregando"
        dentro de botões ou linhas de chat. Cor ajustável via variável CSS.
      </>
    ),
    demoTitle: 'Demonstração',
    sourceTitle: 'Código-fonte',
    colorLabel: 'Cor',
    sizeLabel: 'Tamanho',
    small: 'Pequeno',
    medium: 'Médio',
    large: 'Grande',
  },
  en: {
    title: 'Component: Bouncing Dots Loader',
    intro: (
      <>
        Three dots that rise and fall in sequence, with a small{' '}
        <Text code>animation-delay</Text> offset between each — a lighter,
        more "organic" alternative to a spinning loader, good for indicating
        "loading" inside buttons or chat rows. Color adjustable via a CSS
        variable.
      </>
    ),
    demoTitle: 'Demo',
    sourceTitle: 'Source code',
    colorLabel: 'Color',
    sizeLabel: 'Size',
    small: 'Small',
    medium: 'Medium',
    large: 'Large',
  },
}

const styleTag = `
@keyframes devtools-dot-bounce {
  0%, 80%, 100% { transform: translateY(0); opacity: 0.6; }
  40% { transform: translateY(-8px); opacity: 1; }
}
.bouncing-dots {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.bouncing-dots span {
  width: var(--dot-size, 10px);
  height: var(--dot-size, 10px);
  border-radius: 50%;
  background: var(--dot-color, #1677ff);
  animation: devtools-dot-bounce 1.2s ease-in-out infinite;
}
.bouncing-dots span:nth-child(2) { animation-delay: 0.15s; }
.bouncing-dots span:nth-child(3) { animation-delay: 0.3s; }
`

const sourceCode = `/* CSS */
@keyframes dot-bounce {
  0%, 80%, 100% { transform: translateY(0); opacity: 0.6; }
  40% { transform: translateY(-8px); opacity: 1; }
}
.bouncing-dots {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.bouncing-dots span {
  width: var(--dot-size, 10px);
  height: var(--dot-size, 10px);
  border-radius: 50%;
  background: var(--dot-color, #1677ff);
  animation: dot-bounce 1.2s ease-in-out infinite;
}
.bouncing-dots span:nth-child(2) { animation-delay: 0.15s; }
.bouncing-dots span:nth-child(3) { animation-delay: 0.3s; }

/* JSX */
<span className="bouncing-dots" style={{ '--dot-color': '#1677ff' }}>
  <span /><span /><span />
</span>`

const COLORS = ['#1677ff', '#52c41a', '#faad14', '#eb2f96', '#722ed1']
const SIZES = { small: 6, medium: 10, large: 16 }

export default function BouncingDotsLoaderPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [color, setColor] = useState(COLORS[0])
  const [size, setSize] = useState('medium')

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <style>{styleTag}</style>
      <Title level={2}><LoadingOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card title={t.demoTitle}>
        <Space direction="vertical" size="large">
          <Space wrap size="large">
            <Space direction="vertical" size={4}>
              <Text type="secondary">{t.colorLabel}</Text>
              <Space>
                {COLORS.map((c) => (
                  <div
                    key={c}
                    onClick={() => setColor(c)}
                    style={{
                      width: 22, height: 22, borderRadius: '50%', background: c, cursor: 'pointer',
                      outline: color === c ? '2px solid #333' : 'none', outlineOffset: 2,
                    }}
                  />
                ))}
              </Space>
            </Space>
            <Space direction="vertical" size={4}>
              <Text type="secondary">{t.sizeLabel}</Text>
              <Segmented
                value={size}
                onChange={setSize}
                options={[
                  { label: t.small, value: 'small' },
                  { label: t.medium, value: 'medium' },
                  { label: t.large, value: 'large' },
                ]}
              />
            </Space>
          </Space>

          <div style={{ padding: 32, display: 'flex', justifyContent: 'center' }}>
            <span
              className="bouncing-dots"
              style={{ '--dot-color': color, '--dot-size': `${SIZES[size]}px` }}
            >
              <span /><span /><span />
            </span>
          </div>
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
