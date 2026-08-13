import React from 'react'
import { Typography, Card, Space, Tag, Alert } from 'antd'
import { CodeOutlined } from '@ant-design/icons'
import useHover from '../hooks/useHover'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const sourceCode = `import { useCallback, useState } from 'react'

export default function useHover() {
  const [isHovered, setIsHovered] = useState(false)

  const onMouseEnter = useCallback(() => setIsHovered(true), [])
  const onMouseLeave = useCallback(() => setIsHovered(false), [])

  const ref = useCallback((node) => {
    if (!node) return

    node.addEventListener('mouseenter', onMouseEnter)
    node.addEventListener('mouseleave', onMouseLeave)

    return () => {
      node.removeEventListener('mouseenter', onMouseEnter)
      node.removeEventListener('mouseleave', onMouseLeave)
    }
  }, [onMouseEnter, onMouseLeave])

  return [ref, isHovered]
}

// uso:
// const [hoverRef, isHovered] = useHover()
// <div ref={hoverRef} style={{ background: isHovered ? '#e6f7ff' : '#fff' }}>
//   Passe o mouse aqui
// </div>`

const translations = {
  pt: {
    title: 'Snippet: useHover',
    intro: (
      <>
        Hook que detecta quando o cursor entra e sai de um elemento. Retorna
        uma <Text code>ref</Text> callback e um booleano{' '}
        <Text code>isHovered</Text>. Útil para tooltips customizados, previews
        interativos, cards com efeito de elevação e qualquer microinteração
        baseada em mouse.
      </>
    ),
    sourceTitle: 'Código-fonte',
    demoTitle: 'Demonstração',
    demoDesc: 'Passe o mouse sobre as áreas abaixo para ver o estado mudar:',
    hovered: 'Hover ativo',
    notHovered: 'Hover inativo',
    card1: 'Card interativo',
    card2: 'Botão customizado',
    note: (
      <>
        A ref é uma callback ref, então ela funciona tanto com elementos
        nativos quanto com componentes que encaminham refs via{' '}
        <Text code>React.forwardRef</Text>. A limpeza remove os listeners
        automaticamente quando o elemento é desmontado ou trocado.
      </>
    ),
  },
  en: {
    title: 'Snippet: useHover',
    intro: (
      <>
        A hook that detects when the cursor enters and leaves an element.
        Returns a callback <Text code>ref</Text> and a{' '}
        <Text code>isHovered</Text> boolean. Useful for custom tooltips,
        interactive previews, elevated cards, and any mouse-driven
        microinteraction.
      </>
    ),
    sourceTitle: 'Source code',
    demoTitle: 'Demo',
    demoDesc: 'Hover over the areas below to watch the state change:',
    hovered: 'Hover active',
    notHovered: 'Hover inactive',
    card1: 'Interactive card',
    card2: 'Custom button',
    note: (
      <>
        The ref is a callback ref, so it works with native elements as well
        as components that forward refs via{' '}
        <Text code>React.forwardRef</Text>. Cleanup removes the listeners
        automatically when the element is unmounted or swapped.
      </>
    ),
  },
}

function DemoUsage({ t }) {
  const [cardRef, isCardHovered] = useHover()
  const [buttonRef, isButtonHovered] = useHover()

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Text type="secondary">{t.demoDesc}</Text>

      <Space wrap align="start">
        <div
          ref={cardRef}
          style={{
            width: 220,
            padding: 24,
            borderRadius: 12,
            border: '2px solid',
            borderColor: isCardHovered ? '#1677ff' : '#d9d9d9',
            background: isCardHovered ? '#e6f7ff' : '#fafafa',
            boxShadow: isCardHovered ? '0 8px 24px rgba(22, 119, 255, 0.18)' : 'none',
            transform: isCardHovered ? 'translateY(-4px)' : 'translateY(0)',
            transition: 'all 0.2s ease',
            cursor: 'default',
          }}
        >
          <Text strong style={{ display: 'block', marginBottom: 8 }}>
            {t.card1}
          </Text>
          <Tag color={isCardHovered ? 'blue' : 'default'}>
            {isCardHovered ? t.hovered : t.notHovered}
          </Tag>
        </div>

        <button
          ref={buttonRef}
          type="button"
          style={{
            padding: '12px 24px',
            borderRadius: 8,
            border: 'none',
            fontSize: 15,
            fontWeight: 600,
            cursor: 'pointer',
            color: '#fff',
            background: isButtonHovered ? '#52c41a' : '#1677ff',
            boxShadow: isButtonHovered ? '0 6px 16px rgba(82, 196, 26, 0.28)' : '0 2px 8px rgba(0, 0, 0, 0.09)',
            transform: isButtonHovered ? 'scale(1.05)' : 'scale(1)',
            transition: 'all 0.15s ease',
          }}
        >
          {t.card2}
          {' '}
          <Tag color={isButtonHovered ? 'green' : 'default'} style={{ marginLeft: 8 }}>
            {isButtonHovered ? t.hovered : t.notHovered}
          </Tag>
        </button>
      </Space>

      <Alert type="info" showIcon message={t.note} />
    </Space>
  )
}

export default function UseHoverSnippetPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><CodeOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card title={t.sourceTitle}>
        <pre style={{ margin: 0, overflowX: 'auto' }}>
          <code>{sourceCode}</code>
        </pre>
      </Card>

      <Card title={t.demoTitle}>
        <DemoUsage t={t} />
      </Card>
    </Space>
  )
}
