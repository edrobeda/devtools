import React from 'react'
import { Typography, Card, Space, Tag } from 'antd'
import { CodeOutlined, AimOutlined } from '@ant-design/icons'
import useMousePosition from '../hooks/useMousePosition'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const sourceCode = `import { useEffect, useRef, useState } from 'react'

export default function useMousePosition(ref) {
  const internalRef = useRef(null)
  const targetRef = ref || internalRef
  const [position, setPosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const node = targetRef.current

    const handleMove = (event) => {
      if (node) {
        const rect = node.getBoundingClientRect()
        setPosition({
          x: Math.round(event.clientX - rect.left),
          y: Math.round(event.clientY - rect.top),
        })
      } else {
        setPosition({
          x: event.clientX,
          y: event.clientY,
        })
      }
    }

    window.addEventListener('mousemove', handleMove)

    return () => {
      window.removeEventListener('mousemove', handleMove)
    }
  }, [targetRef])

  return [targetRef, position]
}

// uso na viewport:
// const [ref, { x, y }] = useMousePosition()
// <p>Mouse: {x}, {y}</p>

// uso relativo a um elemento:
// const [ref, { x, y }] = useMousePosition(elementRef)
// <div ref={ref}>Local: {x}, {y}</div>`

const translations = {
  pt: {
    title: 'Snippet: useMousePosition',
    intro: (
      <>
        Hook que acompanha a posição do cursor do mouse. Sem argumentos, retorna
        as coordenadas <Text code>{'{ x, y }'}</Text> relativas à viewport. Se você
        passar uma ref, ele passa a medir a posição em relação àquele elemento.
        Útil para previews interativos, tooltips que seguem o cursor, efeitos de
        parallax, desenho em canvas ou qualquer UI que reaja à posição do mouse.
      </>
    ),
    sourceTitle: 'Código-fonte',
    demoTitle: 'Demonstração',
    demoDesc: 'Mova o mouse sobre a área abaixo — e sobre a página toda — para ver as coordenadas:',
    viewportLabel: 'Viewport',
    localLabel: 'Relativo à área',
    liveTag: 'atualização ao vivo',
    note: (
      <>
        O listener é registrado em <Text code>window</Text>, então o hook continua
        funcionando mesmo quando o cursor sai do elemento de referência; nesse
        caso as coordenadas relativas podem ficar negativas ou maiores que as
        dimensões do elemento.
      </>
    ),
  },
  en: {
    title: 'Snippet: useMousePosition',
    intro: (
      <>
        A hook that tracks the mouse cursor position. With no arguments, it
        returns <Text code>{'{ x, y }'}</Text> coordinates relative to the
        viewport. If you pass a ref, it measures the position relative to that
        element instead. Useful for interactive previews, cursor-following
        tooltips, parallax effects, canvas drawing, or any UI that reacts to
        mouse position.
      </>
    ),
    sourceTitle: 'Source code',
    demoTitle: 'Demo',
    demoDesc: 'Move the mouse over the area below — and anywhere on the page — to see the coordinates:',
    viewportLabel: 'Viewport',
    localLabel: 'Relative to area',
    liveTag: 'live update',
    note: (
      <>
        The listener is attached to <Text code>window</Text>, so the hook keeps
        working even when the cursor leaves the reference element; relative
        coordinates may then become negative or larger than the element's
        dimensions.
      </>
    ),
  },
}

function DemoUsage({ t }) {
  const [, viewportPos] = useMousePosition()
  const [areaRef, areaPos] = useMousePosition()

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Text type="secondary">{t.demoDesc}</Text>

      <Space wrap>
        <Tag icon={<AimOutlined />} color="blue">
          {t.viewportLabel}: {viewportPos.x}px × {viewportPos.y}px
        </Tag>
        <Tag color="green">{t.liveTag}</Tag>
      </Space>

      <div
        ref={areaRef}
        style={{
          height: 180,
          maxWidth: '100%',
          border: '1px dashed #d9d9d9',
          borderRadius: 8,
          padding: 16,
          background: '#fafafa',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'crosshair',
        }}
      >
        <Tag icon={<AimOutlined />} color="purple" style={{ fontSize: 14 }}>
          {t.localLabel}: {areaPos.x}px × {areaPos.y}px
        </Tag>
      </div>

      <Paragraph type="secondary" style={{ marginBottom: 0 }}>
        {t.note}
      </Paragraph>
    </Space>
  )
}

export default function UseMousePositionSnippetPage() {
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
