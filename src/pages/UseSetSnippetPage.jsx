import React from 'react'
import { Typography, Card, Space, Button, Tag, Alert } from 'antd'
import { CodeOutlined, RedoOutlined, ClearOutlined } from '@ant-design/icons'
import useSet from '../hooks/useSet'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const sourceCode = `import { useCallback, useState } from 'react'

export default function useSet(initialValue = []) {
  const [set, setSet] = useState(() => new Set(initialValue))

  const add = useCallback((value) => {
    setSet((prev) => {
      if (prev.has(value)) return prev
      const next = new Set(prev)
      next.add(value)
      return next
    })
  }, [])

  const remove = useCallback((value) => {
    setSet((prev) => {
      if (!prev.has(value)) return prev
      const next = new Set(prev)
      next.delete(value)
      return next
    })
  }, [])

  const toggle = useCallback((value) => {
    setSet((prev) => {
      const next = new Set(prev)
      if (next.has(value)) {
        next.delete(value)
      } else {
        next.add(value)
      }
      return next
    })
  }, [])

  const clear = useCallback(() => {
    setSet((prev) => (prev.size === 0 ? prev : new Set()))
  }, [])

  const reset = useCallback(() => {
    setSet(new Set(initialValue))
  }, [initialValue])

  const has = useCallback((value) => set.has(value), [set])

  return {
    set,                // Set original (readonly)
    values,             // Array.from(set)
    size,               // set.size
    add,
    remove,
    toggle,
    clear,
    reset,
    has,
  }
}

// uso:
// const { values, toggle, has, clear, reset, size } = useSet(['js'])
// toggle('ts')  // adiciona ou remove
// has('js')     // boolean`

const OPTIONS = {
  pt: ['JavaScript', 'TypeScript', 'Python', 'Go', 'Rust', 'Ruby'],
  en: ['JavaScript', 'TypeScript', 'Python', 'Go', 'Rust', 'Ruby'],
}

const translations = {
  pt: {
    title: 'Snippet: useSet',
    intro: (
      <>
        Hook utilitário que encapsula um{' '}
        <Text code>Set</Text> do JavaScript de forma reativa. Ideal para
        seleção múltipla, tags, filtros e qualquer estado que precise de
        adicionar/remover/verificar existência sem duplicatas. A API expõe{' '}
        <Text code>add</Text>, <Text code>remove</Text>,{' '}
        <Text code>toggle</Text>, <Text code>clear</Text>,{' '}
        <Text code>reset</Text> e <Text code>has</Text>, além de{' '}
        <Text code>values</Text> (array) e <Text code>size</Text>.
      </>
    ),
    sourceTitle: 'Código-fonte',
    demoTitle: 'Demonstração',
    demoDesc: 'Clique nas linguagens para selecioná-las/desselecioná-las:',
    selected: 'Selecionadas',
    empty: 'nenhuma',
    clear: 'Limpar',
    reset: 'Reset',
    note: (
      <>
        As funções <Text code>add</Text>, <Text code>remove</Text> e{' '}
        <Text code>toggle</Text> usam o updater do <Text code>useState</Text> e
        só criam um novo <Text code>Set</Text> quando o valor realmente muda,
        preservando a referência em renders consecutivos sem alteração.
      </>
    ),
  },
  en: {
    title: 'Snippet: useSet',
    intro: (
      <>
        A utility hook that wraps a JavaScript{' '}
        <Text code>Set</Text> in a reactive React state. Great for multi-select,
        tags, filters, and any state that needs add/remove/existence checks
        without duplicates. The API exposes <Text code>add</Text>,{' '}
        <Text code>remove</Text>, <Text code>toggle</Text>,{' '}
        <Text code>clear</Text>, <Text code>reset</Text> and{' '}
        <Text code>has</Text>, plus <Text code>values</Text> (array) and{' '}
        <Text code>size</Text>.
      </>
    ),
    sourceTitle: 'Source code',
    demoTitle: 'Demo',
    demoDesc: 'Click the languages to select/deselect them:',
    selected: 'Selected',
    empty: 'none',
    clear: 'Clear',
    reset: 'Reset',
    note: (
      <>
        The <Text code>add</Text>, <Text code>remove</Text> and{' '}
        <Text code>toggle</Text> functions use the <Text code>useState</Text>{' '}
        updater and only create a new <Text code>Set</Text> when the value
        actually changes, keeping the reference stable across unchanged renders.
      </>
    ),
  },
}

function DemoUsage({ t }) {
  const { lang } = useLanguage()
  const { values, toggle, has, clear, reset, size } = useSet([OPTIONS[lang][0]])

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Text type="secondary">{t.demoDesc}</Text>
      <Space wrap>
        {OPTIONS[lang].map((option) => (
          <Button
            key={option}
            type={has(option) ? 'primary' : 'default'}
            onClick={() => toggle(option)}
          >
            {option}
          </Button>
        ))}
      </Space>
      <Space wrap>
        <Button icon={<ClearOutlined />} onClick={clear}>
          {t.clear}
        </Button>
        <Button icon={<RedoOutlined />} onClick={reset}>
          {t.reset}
        </Button>
      </Space>
      <Alert
        type="info"
        showIcon
        message={
          <Space>
            <span>{t.selected}:</span>
            {size === 0 ? (
              <Text type="secondary">{t.empty}</Text>
            ) : (
              values.map((value) => (
                <Tag key={value} color="blue">
                  {value}
                </Tag>
              ))
            )}
          </Space>
        }
        description={
          <Text type="secondary">
            size: <Text code>{size}</Text>
          </Text>
        }
      />
      <Alert type="info" showIcon message={t.note} />
    </Space>
  )
}

export default function UseSetSnippetPage() {
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
