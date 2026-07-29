import React, { useState } from 'react'
import { Typography, Card, Space, Segmented } from 'antd'
import { ThunderboltOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const styleTag = `
.devtools-ripple-btn {
  position: relative;
  overflow: hidden;
  border: none;
  border-radius: 8px;
  padding: 10px 24px;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  background: var(--ripple-bg, #1677ff);
  cursor: pointer;
}
.devtools-ripple-btn .ripple {
  position: absolute;
  border-radius: 50%;
  transform: scale(0);
  animation: devtools-ripple-anim 600ms ease-out;
  background: rgba(255, 255, 255, 0.55);
  pointer-events: none;
}
@keyframes devtools-ripple-anim {
  to {
    transform: scale(2.5);
    opacity: 0;
  }
}
`

const sourceCode = `/* CSS */
.ripple-btn {
  position: relative;
  overflow: hidden;
  border: none;
  border-radius: 8px;
  padding: 10px 24px;
  color: #fff;
  background: #1677ff;
  cursor: pointer;
}
.ripple-btn .ripple {
  position: absolute;
  border-radius: 50%;
  transform: scale(0);
  animation: ripple-anim 600ms ease-out;
  background: rgba(255, 255, 255, 0.55);
  pointer-events: none;
}
@keyframes ripple-anim {
  to { transform: scale(2.5); opacity: 0; }
}

// JSX — cria o círculo no ponto do clique e remove após a animação
function RippleButton({ children, onClick, ...props }) {
  function handleClick(e) {
    const btn = e.currentTarget
    const rect = btn.getBoundingClientRect()
    const size = Math.max(rect.width, rect.height)
    const span = document.createElement('span')
    span.className = 'ripple'
    span.style.width = span.style.height = size + 'px'
    span.style.left = e.clientX - rect.left - size / 2 + 'px'
    span.style.top = e.clientY - rect.top - size / 2 + 'px'
    btn.appendChild(span)
    span.addEventListener('animationend', () => span.remove())
    onClick?.(e)
  }

  return (
    <button className="ripple-btn" onClick={handleClick} {...props}>
      {children}
    </button>
  )
}`

const translations = {
  pt: {
    title: 'Componente: Botão com Efeito Ripple',
    intro: (
      <>
        Ao clicar, cria dinamicamente um <Text code>{'<span>'}</Text> circular
        na posição exata do clique (via <Text code>getBoundingClientRect</Text>{' '}
        e coordenadas do evento) e o anima crescendo/desaparecendo com{' '}
        <Text code>@keyframes</Text>; o elemento se remove sozinho ao fim da
        animação (<Text code>animationend</Text>), sem acumular nós no DOM.
        Sem biblioteca — só CSS e um handler de clique.
      </>
    ),
    demoTitle: 'Demonstração (clique no botão)',
    sourceTitle: 'Código-fonte',
    colorLabel: 'Cor',
  },
  en: {
    title: 'Component: Ripple Effect Button',
    intro: (
      <>
        On click, it dynamically creates a circular{' '}
        <Text code>{'<span>'}</Text> at the exact click position (via{' '}
        <Text code>getBoundingClientRect</Text> and the event's coordinates)
        and animates it growing/fading with <Text code>@keyframes</Text>; the
        element removes itself once the animation ends (
        <Text code>animationend</Text>), so nodes never pile up in the DOM.
        No library — just CSS and a click handler.
      </>
    ),
    demoTitle: 'Demo (click the button)',
    sourceTitle: 'Source code',
    colorLabel: 'Color',
  },
}

const COLORS = ['#1677ff', '#52c41a', '#faad14', '#eb2f96', '#722ed1']

function RippleButton({ children, color }) {
  function handleClick(e) {
    const btn = e.currentTarget
    const rect = btn.getBoundingClientRect()
    const size = Math.max(rect.width, rect.height)
    const span = document.createElement('span')
    span.className = 'ripple'
    span.style.width = `${size}px`
    span.style.height = `${size}px`
    span.style.left = `${e.clientX - rect.left - size / 2}px`
    span.style.top = `${e.clientY - rect.top - size / 2}px`
    btn.appendChild(span)
    span.addEventListener('animationend', () => span.remove())
  }

  return (
    <button
      className="devtools-ripple-btn"
      style={{ '--ripple-bg': color }}
      onClick={handleClick}
    >
      {children}
    </button>
  )
}

export default function RippleButtonPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [color, setColor] = useState(COLORS[0])

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <style>{styleTag}</style>
      <Title level={2}><ThunderboltOutlined /> {t.title}</Title>
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
                label: (
                  <div style={{ width: 18, height: 18, borderRadius: '50%', background: c }} />
                ),
              }))}
            />
          </Space>
          <div style={{ padding: 32, display: 'flex', justifyContent: 'center' }}>
            <RippleButton color={color}>Click me</RippleButton>
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
