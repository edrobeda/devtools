import React, { useEffect, useState } from 'react'
import { Typography, Card, Space, Button, Tag, List, Alert } from 'antd'
import { CodeOutlined, ReloadOutlined, PlayCircleOutlined } from '@ant-design/icons'
import useUpdateEffect from '../hooks/useUpdateEffect'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const sourceCode = `import { useEffect, useRef } from 'react'

export default function useUpdateEffect(effect, deps) {
  const mounted = useRef(false)

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true
      return undefined
    }

    return effect()
  }, deps)
}`

const translations = {
  pt: {
    title: 'Snippet: useUpdateEffect',
    intro: (
      <>
        Hook que funciona como o <Text code>useEffect</Text>, mas ignora a
        primeira renderização (montagem). Ele só dispara o efeito quando as
        dependências mudam <em>após</em> o componente estar montado — ideal pra
        sincronizar estado com query strings, disparar buscas quando filtros
        mudam ou reagir a props sem executar nada no mount.
      </>
    ),
    sourceTitle: 'Código-fonte',
    demoTitle: 'Demonstração',
    demoDesc: 'Clique em "Disparar re-render" várias vezes e compare: o efeito normal roda em toda renderização (incluindo a montagem), enquanto o useUpdateEffect pula a primeira.',
    trigger: 'Disparar re-render',
    reset: 'Limpar histórico',
    normalEffect: 'useEffect',
    updateEffect: 'useUpdateEffect',
    mountLabel: 'montagem',
    updateLabel: 'atualização #',
    note: (
      <>
        O segredo é a ref <Text code>mounted</Text>: ela começa como{' '}
        <Text code>false</Text>, então o primeiro efeito só marca o componente
        como montado. A partir daí, o comportamento é idêntico ao{' '}
        <Text code>useEffect</Text> padrão.
      </>
    ),
  },
  en: {
    title: 'Snippet: useUpdateEffect',
    intro: (
      <>
        A hook that works like <Text code>useEffect</Text> but skips the first
        render (mount). It only fires the effect when dependencies change{' '}
        <em>after</em> the component is mounted — great for syncing state with
        query strings, triggering searches when filters change, or reacting to
        props without running anything on mount.
      </>
    ),
    sourceTitle: 'Source code',
    demoTitle: 'Demo',
    demoDesc: 'Click "Trigger re-render" a few times and compare: the normal effect runs on every render (including mount), while useUpdateEffect skips the first one.',
    trigger: 'Trigger re-render',
    reset: 'Clear history',
    normalEffect: 'useEffect',
    updateEffect: 'useUpdateEffect',
    mountLabel: 'mount',
    updateLabel: 'update #',
    note: (
      <>
        The trick is the <Text code>mounted</Text> ref: it starts as{' '}
        <Text code>false</Text>, so the first effect only marks the component
        as mounted. From then on, the behavior is identical to the standard{' '}
        <Text code>useEffect</Text>.
      </>
    ),
  },
}

function DemoUsage({ t }) {
  const [count, setCount] = useState(0)
  const [logs, setLogs] = useState([])

  // Normal useEffect: runs on mount and on every count change.
  useEffect(() => {
    setLogs((prev) => [
      ...prev,
      {
        key: `${Date.now()}-normal`,
        type: 'normal',
        label: count === 0 ? t.mountLabel : `${t.updateLabel}${count}`,
        time: new Date().toLocaleTimeString(),
      },
    ])
    // We intentionally only want to log when `count` changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count])

  // useUpdateEffect: skips the first render, only reacts to updates.
  useUpdateEffect(() => {
    setLogs((prev) => [
      ...prev,
      {
        key: `${Date.now()}-update`,
        type: 'update',
        label: `${t.updateLabel}${count}`,
        time: new Date().toLocaleTimeString(),
      },
    ])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count])

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Text type="secondary">{t.demoDesc}</Text>

      <Space wrap>
        <Button
          type="primary"
          icon={<PlayCircleOutlined />}
          onClick={() => setCount((c) => c + 1)}
        >
          {t.trigger}
        </Button>
        <Button
          icon={<ReloadOutlined />}
          onClick={() => {
            setCount(0)
            setLogs([])
          }}
        >
          {t.reset}
        </Button>
      </Space>

      <Alert type="info" showIcon message={t.note} />

      <List
        size="small"
        bordered
        dataSource={logs.slice().reverse()}
        renderItem={(item) => (
          <List.Item>
            <Space>
              <Tag color={item.type === 'normal' ? 'blue' : 'green'}>
                {item.type === 'normal' ? t.normalEffect : t.updateEffect}
              </Tag>
              <Text>{item.label}</Text>
              <Text type="secondary">{item.time}</Text>
            </Space>
          </List.Item>
        )}
        locale={{ emptyText: '—' }}
        style={{ maxHeight: 320, overflow: 'auto' }}
      />
    </Space>
  )
}

export default function UseUpdateEffectSnippetPage() {
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
