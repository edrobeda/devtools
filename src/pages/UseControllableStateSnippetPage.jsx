import React, { useState } from 'react'
import { Typography, Card, Space, Button, Switch, Tag, InputNumber } from 'antd'
import { CodeOutlined, MinusOutlined, PlusOutlined, RedoOutlined } from '@ant-design/icons'
import useControllableState from '../hooks/useControllableState'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const sourceCode = `import { useCallback, useRef, useState } from 'react'

export default function useControllableState({ value, defaultValue, onChange }) {
  const isControlled = value !== undefined
  const [internalValue, setInternalValue] = useState(defaultValue)

  // Mantém os valores atualizados sem recriar a referência de setValue.
  const stateRef = useRef({ isControlled, value, internalValue, onChange })
  stateRef.current = { isControlled, value, internalValue, onChange }

  const setValue = useCallback((next) => {
    const { isControlled, value, internalValue, onChange } = stateRef.current
    const currentValue = isControlled ? value : internalValue
    const nextValue = typeof next === 'function'
      ? next(currentValue)
      : next

    if (!isControlled) {
      setInternalValue(nextValue)
    }

    onChange?.(nextValue)
  }, [])

  const currentValue = isControlled ? value : internalValue

  return [currentValue, setValue, isControlled]
}

// uso num componente que aceita ambos os modos:
// function Counter({ value, defaultValue, onChange }) {
//   const [count, setCount] = useControllableState({ value, defaultValue, onChange })
//   return <button onClick={() => setCount((c) => c + 1)}>{count}</button>
// }`

const translations = {
  pt: {
    title: 'Snippet: useControllableState',
    intro: (
      <>
        Hook para criar componentes que funcionam tanto no modo{' '}
        <Text code>controlado</Text> quanto no modo{' '}
        <Text code>não controlado</Text>, como inputs nativos do React. Se{' '}
        <Text code>value</Text> for passado, o componente respeita o valor
        externo e só notifica via <Text code>onChange</Text>. Se{' '}
        <Text code>value</Text> for <Text code>undefined</Text>, o estado é
        gerenciado internamente a partir de <Text code>defaultValue</Text>.
      </>
    ),
    sourceTitle: 'Código-fonte',
    demoTitle: 'Demonstração',
    demoDesc: 'O contador abaixo pode ser controlado pelo estado da página ou gerenciar seu próprio estado:',
    controlled: 'Modo controlado',
    controlledTag: 'controlado',
    uncontrolledTag: 'não controlado',
    externalValue: 'Valor externo (pai)',
    internalValue: 'Valor interno (componente)',
    increment: 'Incrementar',
    decrement: 'Decrementar',
    reset: 'Reset',
    setExternal: 'Definir valor externo',
  },
  en: {
    title: 'Snippet: useControllableState',
    intro: (
      <>
        A hook for building components that work both in{' '}
        <Text code>controlled</Text> and <Text code>uncontrolled</Text> mode,
        just like React native inputs. If <Text code>value</Text> is provided,
        the component respects the external value and only notifies via{' '}
        <Text code>onChange</Text>. If <Text code>value</Text> is{' '}
        <Text code>undefined</Text>, state is managed internally from{' '}
        <Text code>defaultValue</Text>.
      </>
    ),
    sourceTitle: 'Source code',
    demoTitle: 'Demo',
    demoDesc: 'The counter below can be controlled by the page state or manage its own state:',
    controlled: 'Controlled mode',
    controlledTag: 'controlled',
    uncontrolledTag: 'uncontrolled',
    externalValue: 'External value (parent)',
    internalValue: 'Internal value (component)',
    increment: 'Increment',
    decrement: 'Decrement',
    reset: 'Reset',
    setExternal: 'Set external value',
  },
}

function DemoCounter({ value, defaultValue, onChange, t }) {
  const [count, setCount, isControlled] = useControllableState({
    value,
    defaultValue,
    onChange,
  })

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Space>
        <Tag color={isControlled ? 'blue' : 'default'}>
          {isControlled ? t.controlledTag : t.uncontrolledTag}
        </Tag>
        <Text type="secondary">
          {isControlled ? t.externalValue : t.internalValue}
        </Text>
      </Space>
      <Space>
        <Button icon={<MinusOutlined />} onClick={() => setCount((c) => (c || 0) - 1)}>
          {t.decrement}
        </Button>
        <Text strong style={{ fontSize: 18, minWidth: 40, textAlign: 'center' }}>
          {count ?? 0}
        </Text>
        <Button icon={<PlusOutlined />} onClick={() => setCount((c) => (c || 0) + 1)}>
          {t.increment}
        </Button>
        <Button icon={<RedoOutlined />} onClick={() => setCount(defaultValue ?? 0)}>
          {t.reset}
        </Button>
      </Space>
    </Space>
  )
}

function DemoUsage({ t }) {
  const [controlled, setControlled] = useState(false)
  const [externalValue, setExternalValue] = useState(10)

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Text type="secondary">{t.demoDesc}</Text>

      <Space>
        <Switch checked={controlled} onChange={setControlled} />
        <Text>{t.controlled}</Text>
      </Space>

      {controlled && (
        <Space>
          <InputNumber
            value={externalValue}
            onChange={(v) => setExternalValue(v ?? 0)}
            style={{ width: 120 }}
          />
          <Button onClick={() => setExternalValue(10)}>{t.setExternal}</Button>
        </Space>
      )}

      <DemoCounter
        value={controlled ? externalValue : undefined}
        defaultValue={0}
        onChange={(v) => {
          if (controlled) setExternalValue(v)
        }}
        t={t}
      />
    </Space>
  )
}

export default function UseControllableStateSnippetPage() {
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
