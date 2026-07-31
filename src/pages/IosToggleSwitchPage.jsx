import React, { useState } from 'react'
import { Typography, Card, Space, Segmented } from 'antd'
import { SwapOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const styleTag = `
.devtools-ios-switch {
  position: relative;
  display: inline-block;
  width: 52px;
  height: 30px;
}
.devtools-ios-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}
.devtools-ios-switch .track {
  position: absolute;
  inset: 0;
  background: #d9d9d9;
  border-radius: 999px;
  cursor: pointer;
  transition: background-color 200ms ease;
}
.devtools-ios-switch .track::before {
  content: '';
  position: absolute;
  width: 24px;
  height: 24px;
  left: 3px;
  top: 3px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.35);
  transition: transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1);
}
.devtools-ios-switch input:checked + .track {
  background: var(--switch-on, #34c759);
}
.devtools-ios-switch input:checked + .track::before {
  transform: translateX(22px);
}
.devtools-ios-switch input:disabled + .track {
  opacity: 0.5;
  cursor: not-allowed;
}
.devtools-ios-switch input:focus-visible + .track {
  outline: 2px solid var(--switch-on, #34c759);
  outline-offset: 2px;
}
`

const sourceCode = `/* CSS */
.ios-switch { position: relative; display: inline-block; width: 52px; height: 30px; }
.ios-switch input { opacity: 0; width: 0; height: 0; }
.ios-switch .track {
  position: absolute; inset: 0;
  background: #d9d9d9;
  border-radius: 999px;
  cursor: pointer;
  transition: background-color 200ms ease;
}
.ios-switch .track::before {
  content: '';
  position: absolute;
  width: 24px; height: 24px;
  left: 3px; top: 3px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0,0,0,.35);
  transition: transform 200ms cubic-bezier(.34,1.56,.64,1);
}
.ios-switch input:checked + .track { background: #34c759; }
.ios-switch input:checked + .track::before { transform: translateX(22px); }

<!-- HTML -->
<label class="ios-switch">
  <input type="checkbox" />
  <span class="track"></span>
</label>

// React
function IosSwitch({ checked, onChange, color }) {
  return (
    <label className="ios-switch" style={{ '--switch-on': color }}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="track" />
    </label>
  )
}`

const translations = {
  pt: {
    title: 'Componente: Switch Estilo iOS',
    intro: (
      <>
        Um <Text code>{'<input type="checkbox">'}</Text> visualmente
        escondido (mas ainda acessível via teclado/leitor de tela) controla
        um <Text code>{'<span class="track">'}</Text> ao lado, cuja bolinha é
        posicionada com <Text code>::before</Text> e desliza via{' '}
        <Text code>transform: translateX</Text> numa curva{' '}
        <Text code>cubic-bezier</Text> com leve "overshoot", imitando o
        switch nativo do iOS. Cor de "ligado" configurável por variável CSS.
      </>
    ),
    demoTitle: 'Demonstração',
    sourceTitle: 'Código-fonte',
    colorLabel: 'Cor (ligado)',
    disabledLabel: 'Desabilitado',
  },
  en: {
    title: 'Component: iOS-style Switch',
    intro: (
      <>
        A visually hidden <Text code>{'<input type="checkbox">'}</Text> (still
        keyboard/screen-reader accessible) drives a{' '}
        <Text code>{'<span class="track">'}</Text> next to it, whose thumb is
        positioned with <Text code>::before</Text> and slides via{' '}
        <Text code>transform: translateX</Text> on a{' '}
        <Text code>cubic-bezier</Text> curve with a slight overshoot,
        mimicking iOS's native switch. The "on" color is configurable via a
        CSS variable.
      </>
    ),
    demoTitle: 'Demo',
    sourceTitle: 'Source code',
    colorLabel: 'Color (on)',
    disabledLabel: 'Disabled',
  },
}

const COLORS = ['#34c759', '#1677ff', '#faad14', '#eb2f96', '#722ed1']

function IosSwitch({ checked, onChange, color, disabled }) {
  return (
    <label className="devtools-ios-switch" style={{ '--switch-on': color }}>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      <span className="track" />
    </label>
  )
}

export default function IosToggleSwitchPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [color, setColor] = useState(COLORS[0])
  const [checked1, setChecked1] = useState(true)
  const [checked2, setChecked2] = useState(false)

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <style>{styleTag}</style>
      <Title level={2}><SwapOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card title={t.demoTitle}>
        <Space direction="vertical" size="large">
          <Space direction="vertical" size={4}>
            <Text type="secondary">{t.colorLabel}</Text>
            <Segmented
              value={color}
              onChange={setColor}
              options={COLORS.map((c) => ({
                value: c,
                label: <div style={{ width: 18, height: 18, borderRadius: '50%', background: c }} />,
              }))}
            />
          </Space>
          <Space size="large" style={{ padding: 24 }}>
            <IosSwitch checked={checked1} onChange={setChecked1} color={color} />
            <IosSwitch checked={checked2} onChange={setChecked2} color={color} />
            <Space direction="vertical" size={0} align="center">
              <IosSwitch checked disabled onChange={() => {}} color={color} />
              <Text type="secondary" style={{ fontSize: 12 }}>{t.disabledLabel}</Text>
            </Space>
          </Space>
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
