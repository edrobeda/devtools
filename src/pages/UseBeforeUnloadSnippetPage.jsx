import React, { useState } from 'react'
import { Typography, Card, Space, Switch, Input, Alert, Button } from 'antd'
import { CodeOutlined, WarningOutlined } from '@ant-design/icons'
import useBeforeUnload from '../hooks/useBeforeUnload'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const sourceCode = `import { useEffect, useRef } from 'react'

export default function useBeforeUnload(enabled, message = '') {
  const enabledRef = useRef(enabled)

  useEffect(() => {
    enabledRef.current = enabled
  }, [enabled])

  useEffect(() => {
    const isBrowser = typeof window !== 'undefined'
    if (!isBrowser) return

    const handler = (event) => {
      const isEnabled = typeof enabledRef.current === 'function'
        ? enabledRef.current()
        : enabledRef.current

      if (!isEnabled) return

      event.preventDefault()
      // Navegadores modernos ignoram a mensagem customizada,
      // mas ainda exigem returnValue para mostrar o diálogo.
      if (message) {
        event.returnValue = message
      }
      return message
    }

    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [message])
}`

const translations = {
  pt: {
    title: 'Snippet: useBeforeUnload',
    intro: (
      <>
        Hook que registra o evento <Text code>beforeunload</Text> para alertar o
        usuário quando ele tenta fechar ou recarregar a aba com mudanças não
        salvas. Aceita um booleano ou uma função que retorna booleano, e uma
        mensagem opcional. Útil para formulários, editores de texto e qualquer
        fluxo onde dados possam ser perdidos.
      </>
    ),
    sourceTitle: 'Código-fonte',
    demoTitle: 'Demonstração',
    alertTitle: 'Atenção',
    alertDescription: 'Ative o switch abaixo e tente recarregar a aba. O navegador deve exibir um diálogo de confirmação antes de sair.',
    enabledLabel: 'Proteger contra saída acidental',
    messageLabel: 'Mensagem do diálogo (navegadores modernos a mostram padrão)',
    dirtyLabel: 'Marcar como "com alterações não salvas"',
    dirtyHint: 'Quando ativo, o hook considera o formulário sujo mesmo que o switch geral esteja desligado — simula uma regra real de negócio.',
    resetButton: 'Limpar e desativar proteção',
    statusProtected: 'Proteção ativa',
    statusUnprotected: 'Proteção inativa',
    tryReload: 'Tente recarregar a página agora',
  },
  en: {
    title: 'Snippet: useBeforeUnload',
    intro: (
      <>
        A hook that registers the <Text code>beforeunload</Text> event to warn
        the user when they try to close or reload the tab with unsaved changes.
        Accepts a boolean or a function that returns a boolean, plus an optional
        message. Useful for forms, text editors, and any flow where data could
        be lost.
      </>
    ),
    sourceTitle: 'Source code',
    demoTitle: 'Demo',
    alertTitle: 'Warning',
    alertDescription: 'Enable the switch below and try to reload the tab. The browser should show a confirmation dialog before leaving.',
    enabledLabel: 'Protect against accidental leave',
    messageLabel: 'Dialog message (modern browsers show a default message)',
    dirtyLabel: 'Mark as "unsaved changes"',
    dirtyHint: 'When on, the hook treats the form as dirty even if the main switch is off — simulates a real business rule.',
    resetButton: 'Clear and disable protection',
    statusProtected: 'Protection active',
    statusUnprotected: 'Protection inactive',
    tryReload: 'Try reloading the page now',
  },
}

function DemoUsage({ t }) {
  const [enabled, setEnabled] = useState(false)
  const [message, setMessage] = useState('')
  const [isDirty, setIsDirty] = useState(false)
  const [draft, setDraft] = useState('')

  const shouldProtect = () => enabled || isDirty || draft.trim().length > 0

  useBeforeUnload(shouldProtect, message || undefined)

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Alert
        type="warning"
        showIcon
        icon={<WarningOutlined />}
        message={t.alertTitle}
        description={t.alertDescription}
      />

      <Card size="small">
        <Space direction="vertical" style={{ width: '100%' }}>
          <Space>
            <Switch
              checked={enabled}
              onChange={setEnabled}
              checkedChildren={t.statusProtected}
              unCheckedChildren={t.statusUnprotected}
            />
            <Text>{t.enabledLabel}</Text>
          </Space>

          <Space>
            <Switch checked={isDirty} onChange={setIsDirty} />
            <Text>{t.dirtyLabel}</Text>
          </Space>
          <Text type="secondary">{t.dirtyHint}</Text>

          <Input.TextArea
            rows={4}
            placeholder="Digite um rascunho... / Type a draft..."
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />

          <Input
            placeholder={t.messageLabel}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />

          <Button
            onClick={() => {
              setEnabled(false)
              setIsDirty(false)
              setDraft('')
              setMessage('')
            }}
          >
            {t.resetButton}
          </Button>
        </Space>
      </Card>

      <Text type={shouldProtect() ? 'danger' : 'secondary'}>
        {shouldProtect() ? `⚠ ${t.tryReload}` : '—'}
      </Text>
    </Space>
  )
}

export default function UseBeforeUnloadSnippetPage() {
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
