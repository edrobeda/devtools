import React, { useState } from 'react'
import { Typography, Card, Space, Button, Tag, List, Alert, Input, InputNumber, Switch } from 'antd'
import { CodeOutlined, ReloadOutlined, PlayCircleOutlined } from '@ant-design/icons'
import useWhyDidYouUpdate from '../hooks/useWhyDidYouUpdate'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const sourceCode = `import { useEffect, useRef } from 'react'

export default function useWhyDidYouUpdate(name, props, onChange) {
  const previousProps = useRef()

  useEffect(() => {
    if (!previousProps.current) {
      previousProps.current = props
      return
    }

    const allKeys = Object.keys({ ...previousProps.current, ...props })
    const changes = {}

    allKeys.forEach((key) => {
      if (!Object.is(previousProps.current[key], props[key])) {
        changes[key] = {
          from: previousProps.current[key],
          to: props[key],
        }
      }
    })

    if (Object.keys(changes).length) {
      if (onChange) {
        onChange(changes)
      } else {
        console.log('[why-did-you-update]', name, changes)
      }
    }

    previousProps.current = props
  })
}`

const translations = {
  pt: {
    title: 'Snippet: useWhyDidYouUpdate',
    intro: (
      <>
        Hook de debug que descobre <em>por que</em> um componente React
        renderizou. A cada atualização ele compara as props atuais com as da
        renderização anterior e mostra exatamente quais valores mudaram — ideal
        para caçar re-renderizações desnecessárias.
      </>
    ),
    sourceTitle: 'Código-fonte',
    demoTitle: 'Demonstração',
    demoDesc: 'Altere as props abaixo e veja quais mudanças o hook detecta. A prop "timestamp" muda automaticamente a cada clique em "Forçar re-render".',
    forceRender: 'Forçar re-render',
    reset: 'Limpar histórico',
    nameLabel: 'Nome do componente',
    countLabel: 'Contador',
    activeLabel: 'Ativo',
    noChanges: 'Nenhuma mudança detectada',
    changedProps: 'Props alteradas',
    from: 'de',
    to: 'para',
    note: (
      <>
        A comparação usa <Text code>Object.is</Text>, que distingue{' '}
        <Text code>0</Text> de <Text code>-0</Text> e <Text code>NaN</Text> de{' '}
        <Text code>NaN</Text>. Sem o callback <Text code>onChange</Text> o hook
        loga o diff no console com a tag{' '}
        <Text code>[why-did-you-update]</Text>.
      </>
    ),
  },
  en: {
    title: 'Snippet: useWhyDidYouUpdate',
    intro: (
      <>
        A debugging hook that figures out <em>why</em> a React component
        re-rendered. On every update it compares the current props with the
        previous render and shows exactly which values changed — great for
        hunting unnecessary re-renders.
      </>
    ),
    sourceTitle: 'Source code',
    demoTitle: 'Demo',
    demoDesc: 'Change the props below and see which changes the hook detects. The "timestamp" prop changes automatically every time you click "Force re-render".',
    forceRender: 'Force re-render',
    reset: 'Clear history',
    nameLabel: 'Component name',
    countLabel: 'Counter',
    activeLabel: 'Active',
    noChanges: 'No changes detected',
    changedProps: 'Changed props',
    from: 'from',
    to: 'to',
    note: (
      <>
        The comparison uses <Text code>Object.is</Text>, which distinguishes{' '}
        <Text code>0</Text> from <Text code>-0</Text> and{' '}
        <Text code>NaN</Text> from <Text code>NaN</Text>. Without the{' '}
        <Text code>onChange</Text> callback the hook logs the diff to the
        console under the <Text code>[why-did-you-update]</Text> tag.
      </>
    ),
  },
}

function formatValue(value) {
  if (typeof value === 'string') return `"${value}"`
  if (typeof value === 'boolean') return String(value)
  if (typeof value === 'number') return String(value)
  if (value === undefined) return 'undefined'
  if (value === null) return 'null'
  return JSON.stringify(value)
}

function WatchedComponent({ name, count, active, timestamp, onChange, t }) {
  useWhyDidYouUpdate('WatchedComponent', { name, count, active, timestamp }, onChange)

  return (
    <Alert
      type="info"
      showIcon
      message={t.changedProps}
      description={
        <Space direction="vertical">
          <Text><Text strong>name:</Text> {name}</Text>
          <Text><Text strong>count:</Text> {count}</Text>
          <Text><Text strong>active:</Text> {String(active)}</Text>
          <Text><Text strong>timestamp:</Text> {timestamp}</Text>
        </Space>
      }
    />
  )
}

function DemoUsage({ t }) {
  const [name, setName] = useState('WatchedComponent')
  const [count, setCount] = useState(0)
  const [active, setActive] = useState(false)
  const [timestamp, setTimestamp] = useState(Date.now())
  const [logs, setLogs] = useState([])

  const handleChanges = (changes) => {
    setLogs((prev) => [
      ...prev,
      {
        key: `${Date.now()}-${Math.random()}`,
        changes,
        time: new Date().toLocaleTimeString(),
      },
    ])
  }

  const forceRender = () => setTimestamp(Date.now())

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Text type="secondary">{t.demoDesc}</Text>

      <Space wrap>
        <Button type="primary" icon={<PlayCircleOutlined />} onClick={forceRender}>
          {t.forceRender}
        </Button>
        <Button
          icon={<ReloadOutlined />}
          onClick={() => {
            setName('WatchedComponent')
            setCount(0)
            setActive(false)
            setTimestamp(Date.now())
            setLogs([])
          }}
        >
          {t.reset}
        </Button>
      </Space>

      <Space wrap align="start">
        <Space direction="vertical">
          <Text strong>{t.nameLabel}</Text>
          <Input value={name} onChange={(e) => setName(e.target.value)} style={{ width: 200 }} />
        </Space>
        <Space direction="vertical">
          <Text strong>{t.countLabel}</Text>
          <InputNumber value={count} onChange={(value) => setCount(value ?? 0)} style={{ width: 120 }} />
        </Space>
        <Space direction="vertical">
          <Text strong>{t.activeLabel}</Text>
          <Switch checked={active} onChange={setActive} />
        </Space>
      </Space>

      <WatchedComponent
        name={name}
        count={count}
        active={active}
        timestamp={timestamp}
        onChange={handleChanges}
        t={t}
      />

      <Alert type="info" showIcon message={t.note} />

      <List
        size="small"
        bordered
        dataSource={logs.slice().reverse()}
        renderItem={(item) => (
          <List.Item>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Space>
                <Tag color="blue">{t.changedProps}</Tag>
                <Text type="secondary">{item.time}</Text>
              </Space>
              <Space wrap>
                {Object.entries(item.changes).map(([key, { from, to }]) => (
                  <Tag key={key} color="green">
                    {key}: {formatValue(from)} → {formatValue(to)}
                  </Tag>
                ))}
              </Space>
            </Space>
          </List.Item>
        )}
        locale={{ emptyText: t.noChanges }}
        style={{ maxHeight: 320, overflow: 'auto' }}
      />
    </Space>
  )
}

export default function UseWhyDidYouUpdateSnippetPage() {
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
