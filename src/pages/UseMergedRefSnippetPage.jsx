import React, { useRef, useState } from 'react'
import {
  Typography, Card, Space, Tag, Alert, Button,
} from 'antd'
import { CodeOutlined } from '@ant-design/icons'
import useMergedRef from '../hooks/useMergedRef'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const sourceCode = `import { useCallback, useRef } from 'react'

function setRef(ref, value) {
  if (typeof ref === 'function') {
    ref(value)
  } else if (ref != null && typeof ref === 'object') {
    ref.current = value
  }
}

export default function useMergedRef(...refs) {
  const refsRef = useRef(refs)
  refsRef.current = refs

  return useCallback((node) => {
    refsRef.current.forEach((ref) => setRef(ref, node))
  }, [])
}

// uso:
// const internalRef = useRef(null)
// const [callbackRef, setNode] = useState(null)
// const mergedRef = useMergedRef(internalRef, callbackRef, forwardedRef)
// <input ref={mergedRef} />`

const translations = {
  pt: {
    title: 'Snippet: useMergedRef',
    intro: (
      <>
        Hook que combina múltiplas refs —{' '}
        <Text code>useRef</Text>, callback refs e refs encaminhadas via{' '}
        <Text code>forwardRef</Text> — em uma única ref callback. Ideal quando
        um componente precisa expor um elemento <em>e</em> ainda reagir a ele
        internamente (medir tamanho, aplicar foco, integrar com bibliotecas de
        terceiros etc.).
      </>
    ),
    sourceTitle: 'Código-fonte',
    demoTitle: 'Demonstração',
    demoDesc: 'O input abaixo é atribuído a três refs simultaneamente:',
    ref1: 'useRef para focar',
    ref2: 'callback ref para ler nodeName',
    ref3: 'useRef para ler value',
    focus: 'Focar input',
    readValue: 'Ler valor',
    nodeName: 'nodeName da callback ref',
    valueLabel: 'valor do terceiro ref',
    placeholder: 'Digite algo...',
    note: (
      <>
        A ref devolvida é uma callback ref estável. Cada ref da lista recebe o
        mesmo nó DOM, então callbacks são chamadas e refs mutáveis têm seu{' '}
        <Text code>current</Text> atualizado automaticamente.
      </>
    ),
  },
  en: {
    title: 'Snippet: useMergedRef',
    intro: (
      <>
        A hook that merges multiple refs — <Text code>useRef</Text>, callback
        refs and refs forwarded via <Text code>forwardRef</Text> — into a
        single callback ref. Useful when a component needs to expose an element
        <em>and</em> still react to it internally (measure size, focus,
        integrate with third-party libraries, etc.).
      </>
    ),
    sourceTitle: 'Source code',
    demoTitle: 'Demo',
    demoDesc: 'The input below is assigned to three refs at the same time:',
    ref1: 'useRef to focus',
    ref2: 'callback ref to read nodeName',
    ref3: 'useRef to read value',
    focus: 'Focus input',
    readValue: 'Read value',
    nodeName: 'nodeName from callback ref',
    valueLabel: 'value from third ref',
    placeholder: 'Type something...',
    note: (
      <>
        The returned ref is a stable callback ref. Every ref in the list receives
        the same DOM node, so callbacks are invoked and mutable refs have their{' '}
        <Text code>current</Text> updated automatically.
      </>
    ),
  },
}

function DemoUsage({ t }) {
  const focusRef = useRef(null)
  const valueRef = useRef(null)
  const [callbackNode, setCallbackNode] = useState(null)

  const mergedRef = useMergedRef(focusRef, setCallbackNode, valueRef)

  const handleFocus = () => {
    focusRef.current?.focus()
  }

  const handleReadValue = () => {
    if (valueRef.current) {
      // eslint-disable-next-line no-alert
      alert(valueRef.current.value)
    }
  }

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Text type="secondary">{t.demoDesc}</Text>

      <Space wrap>
        <Tag color="blue">{t.ref1}</Tag>
        <Tag color="green">{t.ref2}</Tag>
        <Tag color="purple">{t.ref3}</Tag>
      </Space>

      <input
        ref={mergedRef}
        placeholder={t.placeholder}
        style={{
          maxWidth: 320,
          padding: '8px 12px',
          borderRadius: 6,
          border: '1px solid #d9d9d9',
          fontSize: 14,
          width: '100%',
        }}
      />

      <Space wrap>
        <Button type="primary" onClick={handleFocus}>
          {t.focus}
        </Button>
        <Button onClick={handleReadValue}>
          {t.readValue}
        </Button>
      </Space>

      <Space direction="vertical" size="small">
        <Text>
          <Text strong>{t.nodeName}:</Text>{' '}
          <Tag color={callbackNode ? 'success' : 'default'}>
            {callbackNode ? callbackNode.nodeName : '—'}
          </Tag>
        </Text>
        <Text>
          <Text strong>{t.valueLabel}:</Text>{' '}
          <Tag color={valueRef.current ? 'success' : 'default'}>
            {valueRef.current ? valueRef.current.value || '(empty)' : '—'}
          </Tag>
        </Text>
      </Space>

      <Alert type="info" showIcon message={t.note} />
    </Space>
  )
}

export default function UseMergedRefSnippetPage() {
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
