import React from 'react'
import { Typography, Card, Space, Button, Switch, Tag } from 'antd'
import { CodeOutlined, RedoOutlined } from '@ant-design/icons'
import useBoolean from '../hooks/useBoolean'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const sourceCode = `import { useCallback, useState } from 'react'

export default function useBoolean(initialValue = false) {
  const [value, setValue] = useState(!!initialValue)

  const setTrue = useCallback(() => setValue(true), [])
  const setFalse = useCallback(() => setValue(false), [])
  const toggle = useCallback(() => setValue((v) => !v), [])
  const reset = useCallback(() => setValue(!!initialValue), [initialValue])

  return { value, setValue, setTrue, setFalse, toggle, reset }
}

// uso:
// const { value, setTrue, setFalse, toggle, reset } = useBoolean(false)
// setTrue()   // true
// setFalse()  // false
// toggle()    // inverte
// reset()     // volta ao initialValue`

const translations = {
  pt: {
    title: 'Snippet: useBoolean',
    intro: (
      <>
        Hook utilitário para estados booleanos com uma API semântica. Em vez
        de chamar <Text code>setState(true)</Text> ou{' '}
        <Text code>setState(false)</Text> espalhados pelo componente, você usa{' '}
        <Text code>setTrue</Text>, <Text code>setFalse</Text>,{' '}
        <Text code>toggle</Text> e <Text code>reset</Text>. O valor inicial é
        preservado no reset, e <Text code>setValue</Text> continua exposto pra
        casos especiais.
      </>
    ),
    sourceTitle: 'Código-fonte',
    demoTitle: 'Demonstração',
    demoDesc: 'Mude o estado com ações nomeadas:',
    on: 'Ligado',
    off: 'Desligado',
    setTrue: 'Ligar',
    setFalse: 'Desligar',
    toggle: 'Inverter',
    reset: 'Reset',
  },
  en: {
    title: 'Snippet: useBoolean',
    intro: (
      <>
        A utility hook for boolean state with a semantic API. Instead of
        scattering <Text code>setState(true)</Text> or{' '}
        <Text code>setState(false)</Text> around the component, you use{' '}
        <Text code>setTrue</Text>, <Text code>setFalse</Text>,{' '}
        <Text code>toggle</Text> and <Text code>reset</Text>. The initial value
        is kept for reset, and <Text code>setValue</Text> is still exposed for
        special cases.
      </>
    ),
    sourceTitle: 'Source code',
    demoTitle: 'Demo',
    demoDesc: 'Change the state with named actions:',
    on: 'On',
    off: 'Off',
    setTrue: 'Set true',
    setFalse: 'Set false',
    toggle: 'Toggle',
    reset: 'Reset',
  },
}

function DemoUsage({ t }) {
  const { value, setTrue, setFalse, toggle, reset } = useBoolean(false)

  return (
    <Space direction="vertical">
      <Text type="secondary">{t.demoDesc}</Text>
      <Space>
        <Switch checked={value} onChange={toggle} />
        <Tag color={value ? 'green' : 'default'}>{value ? t.on : t.off}</Tag>
      </Space>
      <Space wrap>
        <Button onClick={setTrue}>{t.setTrue}</Button>
        <Button onClick={setFalse}>{t.setFalse}</Button>
        <Button onClick={toggle}>{t.toggle}</Button>
        <Button icon={<RedoOutlined />} onClick={reset}>{t.reset}</Button>
      </Space>
    </Space>
  )
}

export default function UseBooleanSnippetPage() {
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
