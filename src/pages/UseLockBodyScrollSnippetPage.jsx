import React, { useEffect, useState } from 'react'
import {
  Typography,
  Card,
  Space,
  Button,
  Tag,
  Alert,
  Row,
  Col,
} from 'antd'
import {
  CodeOutlined,
  LockOutlined,
  UnlockOutlined,
} from '@ant-design/icons'
import useLockBodyScroll from '../hooks/useLockBodyScroll'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const sourceCode = [
  "import { useCallback, useEffect, useRef } from 'react'",
  '',
  'function getScrollbarWidth() {',
  '  return window.innerWidth - document.documentElement.clientWidth',
  '}',
  '',
  'export default function useLockBodyScroll() {',
  '  const originalStylesRef = useRef(null)',
  '',
  '  const lock = useCallback(() => {',
  '    if (originalStylesRef.current !== null) return',
  '',
  '    const scrollbarWidth = getScrollbarWidth()',
  '    const { overflow, paddingRight } = document.body.style',
  '',
  '    originalStylesRef.current = { overflow, paddingRight }',
  '',
  "    document.body.style.overflow = 'hidden'",
  '    if (scrollbarWidth > 0) {',
  "      document.body.style.paddingRight = `${scrollbarWidth}px`",
  '    }',
  '  }, [])',
  '',
  '  const unlock = useCallback(() => {',
  '    if (originalStylesRef.current === null) return',
  '',
  '    const { overflow, paddingRight } = originalStylesRef.current',
  '    document.body.style.overflow = overflow',
  '    document.body.style.paddingRight = paddingRight',
  '',
  '    originalStylesRef.current = null',
  '  }, [])',
  '',
  '  useEffect(() => {',
  '    return () => {',
  '      if (originalStylesRef.current !== null) {',
  '        unlock()',
  '      }',
  '    }',
  '  }, [unlock])',
  '',
  '  return { lock, unlock }',
  '}',
].join('\n')

const translations = {
  pt: {
    title: 'Snippet: useLockBodyScroll',
    intro: (
      <>
        Hook utilitário para travar o scroll da página quando um modal,
        drawer ou lightbox estiver aberto. Ele guarda os estilos originais do{' '}
        <Text code>body</Text>, aplica <Text code>overflow: hidden</Text> e
        compensa a largura da scrollbar com{' '}
        <Text code>padding-right</Text>, evitando aquele deslocamento visual
        irritante do layout. Na desmontagem do componente, o scroll é
        restaurado automaticamente.
      </>
    ),
    sourceTitle: 'Código-fonte',
    demoTitle: 'Demonstração',
    openModal: 'Abrir modal (lock)',
    closeModal: 'Fechar modal (unlock)',
    bodyState: 'Estilo atual do body',
    overflow: 'overflow',
    paddingRight: 'padding-right',
    scrollLabel: 'scroll-y',
    scrollLocked: 'bloqueado',
    scrollFree: 'liberado',
    note: 'Role a página antes de abrir o modal para sentir a diferença. A barra de rolagem some, mas o conteúdo não pula.',
  },
  en: {
    title: 'Snippet: useLockBodyScroll',
    intro: (
      <>
        A utility hook that locks page scrolling when a modal, drawer or
        lightbox is open. It stores the original <Text code>body</Text> styles,
        applies <Text code>overflow: hidden</Text> and compensates for the
        scrollbar width with <Text code>padding-right</Text>, preventing the
        annoying layout shift. When the component unmounts, scrolling is
        automatically restored.
      </>
    ),
    sourceTitle: 'Source code',
    demoTitle: 'Demo',
    openModal: 'Open modal (lock)',
    closeModal: 'Close modal (unlock)',
    bodyState: 'Current body style',
    overflow: 'overflow',
    paddingRight: 'padding-right',
    scrollLabel: 'scroll-y',
    scrollLocked: 'locked',
    scrollFree: 'free',
    note: 'Scroll the page before opening the modal to feel the difference. The scrollbar disappears, but the content does not jump.',
  },
}

function DemoUsage({ t }) {
  const { lock, unlock } = useLockBodyScroll()
  const [open, setOpen] = useState(false)

  const handleOpen = () => {
    setOpen(true)
    lock()
  }

  const handleClose = () => {
    setOpen(false)
    unlock()
  }

  const overflow = document.body.style.overflow || 'unset'
  const paddingRight = document.body.style.paddingRight || '0px'
  const isLocked = overflow === 'hidden'

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12}>
          <Card size="small" title={t.bodyState}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text code>{t.overflow}</Text>: <Text strong>{overflow}</Text>
              </div>
              <div>
                <Text code>{t.paddingRight}</Text>:{' '}
                <Text strong>{paddingRight}</Text>
              </div>
              <div>
                <Text code>{t.scrollLabel}</Text>:{' '}
                {isLocked ? (
                  <Tag icon={<LockOutlined />} color="red">
                    {t.scrollLocked}
                  </Tag>
                ) : (
                  <Tag icon={<UnlockOutlined />} color="green">
                    {t.scrollFree}
                  </Tag>
                )}
              </div>
            </Space>
          </Card>
        </Col>
        <Col xs={24} sm={12}>
          <Space wrap style={{ height: '100%', alignItems: 'center' }}>
            {!open ? (
              <Button type="primary" icon={<LockOutlined />} onClick={handleOpen}>
                {t.openModal}
              </Button>
            ) : (
              <Button type="primary" danger icon={<UnlockOutlined />} onClick={handleClose}>
                {t.closeModal}
              </Button>
            )}
          </Space>
        </Col>
      </Row>

      {open && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.45)',
          }}
          onClick={handleClose}
        >
          <Card
            title="Modal de exemplo"
            style={{ width: 420, maxWidth: '90vw' }}
            onClick={(e) => e.stopPropagation()}
          >
            <Paragraph>
              O scroll da página está bloqueado. Tente rolar a página por baixo
              deste modal — não vai rolar. A barra de rolagem sumiu, mas o
              layout não pulou porque o hook compensou a largura da scrollbar.
            </Paragraph>
            <Button type="primary" icon={<UnlockOutlined />} onClick={handleClose}>
              {t.closeModal}
            </Button>
          </Card>
        </div>
      )}

      <Alert message={t.note} type="info" showIcon />
    </Space>
  )
}

export default function UseLockBodyScrollSnippetPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}>
        <CodeOutlined /> {t.title}
      </Title>
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
