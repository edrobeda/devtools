import React from 'react'
import { Typography, Card, Space, Button, Switch, Tag } from 'antd'
import { CodeOutlined } from '@ant-design/icons'
import useToggle from '../hooks/useToggle'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const sourceCode = `import { useCallback, useState } from 'react'

export default function useToggle(initialValue = false) {
  const [value, setValue] = useState(initialValue)

  const toggle = useCallback((next) => {
    setValue((current) => (typeof next === 'boolean' ? next : !current))
  }, [])

  return [value, toggle]
}

// uso:
// const [isOpen, toggleOpen] = useToggle()
// toggleOpen()        // inverte
// toggleOpen(true)     // força true
// toggleOpen(false)    // força false`

const translations = {
  pt: {
    title: 'Snippet: useToggle',
    intro: (
      <>
        Hook pequeno pra estado booleano com toggle/set/reset num único
        lugar. A função retornada aceita um argumento opcional: sem
        argumento, inverte o valor atual; com <Text code>true</Text>/
        <Text code>false</Text>, força esse valor — útil pra abrir/fechar um
        modal a partir de handlers diferentes sem precisar de dois{' '}
        <Text code>setState</Text> separados.
      </>
    ),
    sourceTitle: 'Código-fonte',
    demoTitle: 'Demonstração',
    demoDesc: 'Alterna, força ligado ou força desligado:',
    on: 'Ligado',
    off: 'Desligado',
    toggle: 'Inverter',
    forceOn: 'Forçar ligado',
    forceOff: 'Forçar desligado',
  },
  en: {
    title: 'Snippet: useToggle',
    intro: (
      <>
        A small hook for boolean state with toggle/set/reset in one place.
        The returned function accepts an optional argument: with no
        argument, it flips the current value; with <Text code>true</Text>/
        <Text code>false</Text>, it forces that value — handy for
        opening/closing a modal from different handlers without juggling two
        separate <Text code>setState</Text> calls.
      </>
    ),
    sourceTitle: 'Source code',
    demoTitle: 'Demo',
    demoDesc: 'Toggle, force on, or force off:',
    on: 'On',
    off: 'Off',
    toggle: 'Toggle',
    forceOn: 'Force on',
    forceOff: 'Force off',
  },
}

function DemoUsage({ t }) {
  const [value, toggleValue] = useToggle(false)

  return (
    <Space direction="vertical">
      <Text type="secondary">{t.demoDesc}</Text>
      <Space>
        <Switch checked={value} onChange={() => toggleValue()} />
        <Tag color={value ? 'green' : 'default'}>{value ? t.on : t.off}</Tag>
      </Space>
      <Space wrap>
        <Button onClick={() => toggleValue()}>{t.toggle}</Button>
        <Button onClick={() => toggleValue(true)}>{t.forceOn}</Button>
        <Button onClick={() => toggleValue(false)}>{t.forceOff}</Button>
      </Space>
    </Space>
  )
}

export default function UseToggleSnippetPage() {
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
