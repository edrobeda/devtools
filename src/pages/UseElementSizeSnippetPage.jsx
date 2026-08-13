import React from 'react'
import { Typography, Card, Space, Tag } from 'antd'
import { CodeOutlined, ColumnWidthOutlined } from '@ant-design/icons'
import useElementSize from '../hooks/useElementSize'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const sourceCode = `import { useEffect, useRef, useState } from 'react'

export default function useElementSize() {
  const ref = useRef(null)
  const [size, setSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const node = ref.current
    if (!node) return undefined

    const update = () => {
      const rect = node.getBoundingClientRect()
      setSize({
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      })
    }

    update()

    let observer = null
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver((entries) => {
        const entry = entries[0]
        if (entry?.contentRect) {
          const { width, height } = entry.contentRect
          setSize({
            width: Math.round(width),
            height: Math.round(height),
          })
        } else {
          update()
        }
      })
      observer.observe(node)
    } else {
      window.addEventListener('resize', update)
    }

    return () => {
      if (observer) {
        observer.disconnect()
      } else {
        window.removeEventListener('resize', update)
      }
    }
  }, [])

  return [ref, size]
}

// uso:
// const [ref, { width, height }] = useElementSize()
// <div ref={ref}>{width} x {height}</div>`

const translations = {
  pt: {
    title: 'Snippet: useElementSize',
    intro: (
      <>
        Hook que observa as dimensões de um elemento em tempo real usando{' '}
        <Text code>ResizeObserver</Text> (com fallback para o evento{' '}
        <Text code>resize</Text> de janela). Retorna uma ref e um objeto{' '}
        <Text code>{'{ width, height }'}</Text>. Útil para redimensionar
        canvas, ajustar layouts baseados no espaço disponível, criar gráficos
        responsivos ou qualquer componente que precise saber o tamanho do próprio
        container.
      </>
    ),
    sourceTitle: 'Código-fonte',
    demoTitle: 'Demonstração',
    demoDesc: 'Arraste o canto inferior-direito da caixa para redimensioná-la:',
    sizeLabel: 'Dimensões atuais',
    liveTag: 'atualização ao vivo',
    fallbackNote: (
      <>
        O fallback via <Text code>window.addEventListener('resize')</Text> só
        reage às mudanças de tamanho da janela; para redimensionamentos internos
        (ex.: splitters, flexbox mudando), prefira navegadores com suporte a{' '}
        <Text code>ResizeObserver</Text>.
      </>
    ),
  },
  en: {
    title: 'Snippet: useElementSize',
    intro: (
      <>
        A hook that observes an element's dimensions in real time using{' '}
        <Text code>ResizeObserver</Text> (with a fallback to the window{' '}
        <Text code>resize</Text> event). It returns a ref and a{' '}
        <Text code>{'{ width, height }'}</Text> object. Useful for resizing
        canvases, adjusting layouts based on available space, building responsive
        charts, or any component that needs to know its container size.
      </>
    ),
    sourceTitle: 'Source code',
    demoTitle: 'Demo',
    demoDesc: 'Drag the bottom-right corner of the box to resize it:',
    sizeLabel: 'Current dimensions',
    liveTag: 'live update',
    fallbackNote: (
      <>
        The <Text code>window.addEventListener('resize')</Text> fallback only
        reacts to window size changes; for internal resizes (e.g. splitters,
        flexbox shifts), prefer browsers that support{' '}
        <Text code>ResizeObserver</Text>.
      </>
    ),
  },
}

function DemoUsage({ t }) {
  const [ref, { width, height }] = useElementSize()

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Text type="secondary">{t.demoDesc}</Text>
      <div
        ref={ref}
        style={{
          resize: 'both',
          overflow: 'auto',
          minWidth: 160,
          minHeight: 100,
          maxWidth: '100%',
          border: '1px solid #d9d9d9',
          borderRadius: 8,
          padding: 16,
          background: '#fafafa',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
        }}
      >
        <ColumnWidthOutlined style={{ color: '#8c8c8c' }} />
        <Text strong>
          {width}px × {height}px
        </Text>
      </div>
      <Space>
        <Tag color="blue">{t.sizeLabel}</Tag>
        <Tag color="green">{t.liveTag}</Tag>
      </Space>
      <Paragraph type="secondary" style={{ marginBottom: 0 }}>
        {t.fallbackNote}
      </Paragraph>
    </Space>
  )
}

export default function UseElementSizeSnippetPage() {
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
