import React from 'react'
import { Typography, Card, Space, Tag } from 'antd'
import { EyeOutlined } from '@ant-design/icons'
import useOnScreen from '../hooks/useOnScreen'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const sourceCode = `import { useEffect, useRef, useState } from 'react'

export default function useOnScreen(options = {}) {
  const ref = useRef(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return undefined

    const observer = new IntersectionObserver(([entry]) => {
      setIsVisible(entry.isIntersecting)
    }, options)

    observer.observe(node)
    return () => observer.disconnect()
  }, [options.threshold, options.root, options.rootMargin])

  return [ref, isVisible]
}

// uso:
// const [ref, isVisible] = useOnScreen({ threshold: 0.5 })
// <div ref={ref}>{isVisible ? 'visível' : 'fora da tela'}</div>`

const translations = {
  pt: {
    title: 'Snippet: useOnScreen',
    intro: (
      <>
        Hook que usa <Text code>IntersectionObserver</Text> pra saber se um
        elemento está visível na viewport (ou dentro de um container com
        scroll), sem precisar calcular posições manualmente em cada evento de{' '}
        <Text code>scroll</Text>. Útil pra lazy-load de imagens, animações de
        "revelar ao rolar" ou infinite scroll.
      </>
    ),
    sourceTitle: 'Código-fonte',
    demoTitle: 'Demonstração',
    demoDesc: 'Role a caixa abaixo até o alvo entrar na área visível:',
    visible: 'Visível',
    hidden: 'Fora da tela',
    target: 'Elemento observado',
  },
  en: {
    title: 'Snippet: useOnScreen',
    intro: (
      <>
        A hook that uses <Text code>IntersectionObserver</Text> to know
        whether an element is visible in the viewport (or inside a scrolling
        container), without manually calculating positions on every{' '}
        <Text code>scroll</Text> event. Handy for image lazy-loading,
        "reveal on scroll" animations, or infinite scroll.
      </>
    ),
    sourceTitle: 'Source code',
    demoTitle: 'Demo',
    demoDesc: 'Scroll the box below until the target enters the visible area:',
    visible: 'Visible',
    hidden: 'Off screen',
    target: 'Observed element',
  },
}

function DemoUsage({ t }) {
  const [ref, isVisible] = useOnScreen({ threshold: 0.6 })

  return (
    <Space direction="vertical">
      <Space>
        <Text type="secondary">{t.demoDesc}</Text>
        <Tag color={isVisible ? 'green' : 'default'}>{isVisible ? t.visible : t.hidden}</Tag>
      </Space>
      <div style={{
        height: 200,
        overflowY: 'auto',
        border: '1px solid #d9d9d9',
        borderRadius: 8,
        padding: '0 16px',
      }}
      >
        <div style={{ height: 260, display: 'flex', alignItems: 'flex-end', color: '#999' }}>
          <Text type="secondary">↓ scroll ↓</Text>
        </div>
        <div
          ref={ref}
          style={{
            height: 80,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 8,
            marginBottom: 16,
            background: isVisible ? '#f6ffed' : '#fafafa',
            border: `1px dashed ${isVisible ? '#52c41a' : '#d9d9d9'}`,
            transition: 'all 0.2s ease',
          }}
        >
          {t.target}
        </div>
        <div style={{ height: 260 }} />
      </div>
    </Space>
  )
}

export default function UseOnScreenSnippetPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><EyeOutlined /> {t.title}</Title>
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
