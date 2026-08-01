import React, { useState } from 'react'
import { Typography, Card, Space } from 'antd'
import { BgColorsOutlined, SunOutlined, MoonOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const styleTag = `
.devtools-dark-toggle {
  position: relative;
  display: inline-block;
  width: 64px;
  height: 32px;
  cursor: pointer;
}
.devtools-dark-toggle input {
  opacity: 0;
  width: 0;
  height: 0;
}
.devtools-dark-toggle .track {
  position: absolute;
  inset: 0;
  border-radius: 999px;
  background: linear-gradient(90deg, #7ec8f2, #ffe29a);
  overflow: hidden;
  transition: background 400ms ease;
}
.devtools-dark-toggle input:checked + .track {
  background: linear-gradient(90deg, #232946, #0f1024);
}
.devtools-dark-toggle .stars {
  position: absolute;
  inset: 0;
  opacity: 0;
  transition: opacity 400ms ease;
}
.devtools-dark-toggle input:checked + .track .stars {
  opacity: 1;
}
.devtools-dark-toggle .stars::before,
.devtools-dark-toggle .stars::after {
  content: '';
  position: absolute;
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 0 2px #fff;
}
.devtools-dark-toggle .stars::before { top: 7px; left: 10px; }
.devtools-dark-toggle .stars::after { top: 18px; left: 18px; }
.devtools-dark-toggle .thumb {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #f5a623;
  font-size: 15px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.35);
  transform: translateX(0) rotate(0deg);
  transition: transform 400ms cubic-bezier(0.34, 1.56, 0.64, 1), color 400ms ease, background 400ms ease;
}
.devtools-dark-toggle input:checked + .track .thumb {
  transform: translateX(32px) rotate(360deg);
  background: #2b2d42;
  color: #ffe29a;
}
.devtools-dark-toggle input:focus-visible + .track {
  outline: 2px solid #1677ff;
  outline-offset: 2px;
}
`

const sourceCode = `/* CSS */
.dark-toggle { position: relative; display: inline-block; width: 64px; height: 32px; }
.dark-toggle input { opacity: 0; width: 0; height: 0; }
.dark-toggle .track {
  position: absolute; inset: 0;
  border-radius: 999px;
  background: linear-gradient(90deg, #7ec8f2, #ffe29a);
  overflow: hidden;
  transition: background 400ms ease;
}
.dark-toggle input:checked + .track { background: linear-gradient(90deg, #232946, #0f1024); }
.dark-toggle .thumb {
  position: absolute; top: 3px; left: 3px;
  width: 26px; height: 26px;
  border-radius: 50%;
  background: #fff;
  display: flex; align-items: center; justify-content: center;
  color: #f5a623;
  box-shadow: 0 1px 3px rgba(0,0,0,.35);
  transform: translateX(0) rotate(0deg);
  transition: transform 400ms cubic-bezier(.34,1.56,.64,1), color 400ms ease, background 400ms ease;
}
.dark-toggle input:checked + .track .thumb {
  transform: translateX(32px) rotate(360deg);
  background: #2b2d42;
  color: #ffe29a;
}

<!-- HTML -->
<label class="dark-toggle">
  <input type="checkbox" />
  <span class="track">
    <span class="stars"></span>
    <span class="thumb">☀ / ☾</span>
  </span>
</label>

// React
function DarkModeToggle({ checked, onChange }) {
  return (
    <label className="dark-toggle">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="track">
        <span className="stars" />
        <span className="thumb">{checked ? <MoonOutlined /> : <SunOutlined />}</span>
      </span>
    </label>
  )
}`

const translations = {
  pt: {
    title: 'Componente: Dark Mode Toggle Animado',
    intro: (
      <>
        Switch sol/lua construído sobre o mesmo padrão de{' '}
        <Text code>{'<input type="checkbox">'}</Text> visualmente escondido
        usado no switch estilo iOS — aqui a trilha troca de gradiente
        claro→escuro, um par de estrelinhas surge via <Text code>opacity</Text>{' '}
        e a bolinha desliza com <Text code>translateX</Text> girando 360° em{' '}
        <Text code>cubic-bezier</Text> enquanto troca o ícone e a cor de fundo.
        Tudo em CSS puro, sem biblioteca de animação.
      </>
    ),
    demoTitle: 'Demonstração',
    sourceTitle: 'Código-fonte',
    stateLabel: (checked) => (checked ? 'Modo escuro' : 'Modo claro'),
  },
  en: {
    title: 'Component: Animated Dark Mode Toggle',
    intro: (
      <>
        A sun/moon switch built on the same visually-hidden{' '}
        <Text code>{'<input type="checkbox">'}</Text> pattern used in the
        iOS-style switch — here the track crossfades between a light→dark
        gradient, a pair of tiny stars fades in via <Text code>opacity</Text>,
        and the thumb slides with <Text code>translateX</Text> while rotating
        360° on a <Text code>cubic-bezier</Text> curve, swapping icon and
        background color along the way. All pure CSS, no animation library.
      </>
    ),
    demoTitle: 'Demo',
    sourceTitle: 'Source code',
    stateLabel: (checked) => (checked ? 'Dark mode' : 'Light mode'),
  },
}

function DarkModeToggle({ checked, onChange }) {
  return (
    <label className="devtools-dark-toggle">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="track">
        <span className="stars" />
        <span className="thumb">{checked ? <MoonOutlined /> : <SunOutlined />}</span>
      </span>
    </label>
  )
}

export default function DarkModeTogglePage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [checked, setChecked] = useState(false)

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <style>{styleTag}</style>
      <Title level={2}><BgColorsOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card title={t.demoTitle}>
        <Space direction="vertical" size="middle" align="center" style={{ width: '100%', padding: '24px 0' }}>
          <DarkModeToggle checked={checked} onChange={setChecked} />
          <Text type="secondary">{t.stateLabel(checked)}</Text>
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
