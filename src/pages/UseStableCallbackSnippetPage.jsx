import React, { memo, useCallback, useRef, useState } from 'react'
import { Typography, Card, Space, Button, Tag, Alert, Input } from 'antd'
import { CodeOutlined, ReloadOutlined, ThunderboltOutlined } from '@ant-design/icons'
import useStableCallback from '../hooks/useStableCallback'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const sourceCode = `import { useCallback, useRef } from 'react'

export default function useStableCallback(callback) {
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  return useCallback((...args) => {
    return callbackRef.current(...args)
  }, [])
}

// uso:
// const handleClick = useStableCallback(() => {
//   console.log('valor atual:', value)
// })
// <MemoButton onClick={handleClick} /> // referência nunca muda, mas o valor atual é acessado`

const translations = {
  pt: {
    title: 'Snippet: useStableCallback',
    intro: (
      <>
        Hook que devolve uma callback com referência estável: a função retornada
        nunca muda entre renders, mas sempre executa a versão mais recente da
        callback passada. Útil para passar handlers a componentes filhos{' '}
        <Text code>memo</Text> sem quebrar a memoização e sem depender de arrays
        de dependência extensos.
      </>
    ),
    sourceTitle: 'Código-fonte',
    demoTitle: 'Demonstração',
    demoDesc:
      'Dois botões filhos idênticos e memoizados recebem callbacks diferentes. A cada re-render forçado no pai, apenas o filho com callback instável renderiza novamente:',
    unstableLabel: 'Callback instável',
    stableLabel: 'Callback estável',
    reRenders: 're-renders',
    forceParentRender: 'Forçar re-render do pai',
    reset: 'Resetar',
    action: 'Ação do filho',
    inputLabel: 'Texto do pai (não afeta a demo)',
    note: (
      <>
        Atenção: o hook não faz mágica — ele não substitui o{' '}
        <Text code>useCallback</Text> quando você precisa que efeitos ou
        memoizações superiores reajam a uma dependência. Ele é uma ferramenta
        para manter a referência estável de handlers passados para componentes
        memoizados, enquanto ainda lê o estado mais recente dentro da função.
      </>
    ),
  },
  en: {
    title: 'Snippet: useStableCallback',
    intro: (
      <>
        A hook that returns a callback with a stable reference: the returned
        function never changes between renders, yet it always executes the latest
        version of the passed callback. Useful for passing handlers to{' '}
        <Text code>memo</Text> children without breaking memoization and without
        maintaining large dependency arrays.
      </>
    ),
    sourceTitle: 'Source code',
    demoTitle: 'Demo',
    demoDesc:
      'Two identical memoized child buttons receive different callbacks. Every time the parent is forced to re-render, only the child with the unstable callback re-renders:',
    unstableLabel: 'Unstable callback',
    stableLabel: 'Stable callback',
    reRenders: 're-renders',
    forceParentRender: 'Force parent re-render',
    reset: 'Reset',
    action: 'Child action',
    inputLabel: 'Parent text (does not affect the demo)',
    note: (
      <>
        Note: this hook is not magic — it does not replace{' '}
        <Text code>useCallback</Text> when you need effects or upstream
        memoizations to react to a dependency. It is a tool for keeping handlers
        passed to memoized components stable while still reading the latest
        state inside the function.
      </>
    ),
  },
}

const MemoChild = memo(function MemoChild({ label, variant, onAction, actionCount }) {
  const renderCountRef = useRef(0)
  renderCountRef.current += 1

  return (
    <Card size="small" title={label} style={{ flex: 1, minWidth: 240 }}>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Tag color={variant === 'unstable' ? 'warning' : 'success'}>
          {renderCountRef.current} {label.includes('instável') || variant === 'unstable' ? '(instável)' : '(estável)'}
        </Tag>
        <Button icon={<ThunderboltOutlined />} onClick={onAction}>
          {variant === 'unstable' ? 'Unstable action' : 'Stable action'}
        </Button>
        <Text type="secondary">
          {label.includes('instável') || variant === 'unstable' ? 'actionCount' : 'actionCount'}: {actionCount}
        </Text>
      </Space>
    </Card>
  )
})

function DemoUsage({ t }) {
  const [noise, setNoise] = useState(0)
  const [unstableActionCount, setUnstableActionCount] = useState(0)
  const [stableActionCount, setStableActionCount] = useState(0)
  const [text, setText] = useState('')

  // Callback instável: muda toda vez que o pai re-renderiza por causa de `noise`,
  // forçando o filho memoizado a renderizar novamente.
  const unstableAction = useCallback(() => {
    setUnstableActionCount((c) => c + 1)
  }, [noise])

  // Callback estável: referência fixa, mas ainda acessa o estado mais recente.
  const stableAction = useStableCallback(() => {
    setStableActionCount((c) => c + 1)
  })

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Text type="secondary">{t.demoDesc}</Text>

      <Space wrap>
        <Button type="primary" icon={<ReloadOutlined />} onClick={() => setNoise((n) => n + 1)}>
          {t.forceParentRender}
        </Button>
        <Button
          icon={<ReloadOutlined />}
          onClick={() => {
            setNoise(0)
            setUnstableActionCount(0)
            setStableActionCount(0)
            setText('')
          }}
        >
          {t.reset}
        </Button>
      </Space>

      <Input
        placeholder={t.inputLabel}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <MemoChild
          label={t.unstableLabel}
          variant="unstable"
          onAction={unstableAction}
          actionCount={unstableActionCount}
        />
        <MemoChild
          label={t.stableLabel}
          variant="stable"
          onAction={stableAction}
          actionCount={stableActionCount}
        />
      </div>

      <Alert type="info" showIcon message={t.note} />
    </Space>
  )
}

export default function UseStableCallbackSnippetPage() {
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
