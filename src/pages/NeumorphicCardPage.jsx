import React, { useState } from 'react'
import { Typography, Card, Space, Segmented } from 'antd'
import { BgColorsOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const translations = {
  pt: {
    title: 'Componente: Cartão Neumórfico (Soft UI)',
    intro: (
      <>
        Cartão e botão em estilo neumórfico: mesma cor de fundo do elemento e
        do container, com duas sombras opostas (uma clara, uma escura)
        simulando luz e profundidade sem borda nem gradiente visível. Funciona
        em modo claro ou escuro trocando só as cores das sombras.
      </>
    ),
    demoTitle: 'Demonstração',
    sourceTitle: 'Código-fonte',
    themeLabel: 'Tema',
    light: 'Claro',
    dark: 'Escuro',
    cardText: 'Este cartão "flutua" sobre o fundo usando só sombras.',
    button: 'Botão neumórfico',
  },
  en: {
    title: 'Component: Neumorphic Card (Soft UI)',
    intro: (
      <>
        A neumorphic-style card and button: the element shares the same
        background color as its container, with two opposing shadows (one
        light, one dark) simulating light and depth without a visible border
        or gradient. Works in light or dark mode by swapping only the shadow
        colors.
      </>
    ),
    demoTitle: 'Demo',
    sourceTitle: 'Source code',
    themeLabel: 'Theme',
    light: 'Light',
    dark: 'Dark',
    cardText: 'This card "floats" over the background using only shadows.',
    button: 'Neumorphic button',
  },
}

const styleTag = `
.neu-surface-light {
  background: #e0e5ec;
  border-radius: 16px;
}
.neu-surface-dark {
  background: #2b2f38;
  border-radius: 16px;
}
.neu-card-light {
  background: #e0e5ec;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 8px 8px 16px #b8bcc3, -8px -8px 16px #ffffff;
}
.neu-card-dark {
  background: #2b2f38;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 8px 8px 16px #1c1f26, -8px -8px 16px #3a3f4a;
  color: #e8e8e8;
}
.neu-btn-light {
  background: #e0e5ec;
  border: none;
  border-radius: 12px;
  padding: 10px 24px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 6px 6px 12px #b8bcc3, -6px -6px 12px #ffffff;
  transition: box-shadow 0.15s ease;
}
.neu-btn-light:active {
  box-shadow: inset 4px 4px 8px #b8bcc3, inset -4px -4px 8px #ffffff;
}
.neu-btn-dark {
  background: #2b2f38;
  border: none;
  border-radius: 12px;
  padding: 10px 24px;
  font-weight: 600;
  cursor: pointer;
  color: #e8e8e8;
  box-shadow: 6px 6px 12px #1c1f26, -6px -6px 12px #3a3f4a;
  transition: box-shadow 0.15s ease;
}
.neu-btn-dark:active {
  box-shadow: inset 4px 4px 8px #1c1f26, inset -4px -4px 8px #3a3f4a;
}
`

const sourceCode = `/* CSS — variante clara */
.neu-card {
  background: #e0e5ec;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 8px 8px 16px #b8bcc3, -8px -8px 16px #ffffff;
}

.neu-btn {
  background: #e0e5ec;
  border: none;
  border-radius: 12px;
  padding: 10px 24px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 6px 6px 12px #b8bcc3, -6px -6px 12px #ffffff;
  transition: box-shadow 0.15s ease;
}

/* estado pressionado: inverte pra sombra "inset" */
.neu-btn:active {
  box-shadow: inset 4px 4px 8px #b8bcc3, inset -4px -4px 8px #ffffff;
}

/* JSX */
<div className="neu-card">conteúdo</div>
<button className="neu-btn">clique</button>`

export default function NeumorphicCardPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [theme, setTheme] = useState('light')

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <style>{styleTag}</style>
      <Title level={2}><BgColorsOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card
        title={t.demoTitle}
        extra={(
          <Segmented
            value={theme}
            onChange={setTheme}
            options={[
              { label: t.light, value: 'light' },
              { label: t.dark, value: 'dark' },
            ]}
          />
        )}
      >
        <div className={theme === 'light' ? 'neu-surface-light' : 'neu-surface-dark'} style={{ padding: 40 }}>
          <Space size="large" align="center" wrap>
            <div className={theme === 'light' ? 'neu-card-light' : 'neu-card-dark'} style={{ width: 260 }}>
              <Text style={theme === 'dark' ? { color: '#e8e8e8' } : undefined}>{t.cardText}</Text>
            </div>
            <button className={theme === 'light' ? 'neu-btn-light' : 'neu-btn-dark'}>{t.button}</button>
          </Space>
        </div>
      </Card>

      <Card title={t.sourceTitle}>
        <pre style={{ margin: 0, overflowX: 'auto' }}>
          <code>{sourceCode}</code>
        </pre>
      </Card>
    </Space>
  )
}
