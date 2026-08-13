import React, { useState } from 'react'
import { Typography, Card, Space, Button, InputNumber, Tag, Row, Col } from 'antd'
import { CodeOutlined, MinusOutlined, PlusOutlined, RedoOutlined } from '@ant-design/icons'
import useCounter from '../hooks/useCounter'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const sourceCode = [
  "import { useCallback, useState } from 'react'",
  '',
  'export default function useCounter(initialValue = 0, options = {}) {',
  "  const { min, max, step = 1 } = options",
  '  const [count, setCount] = useState(initialValue)',
  '',
  '  const clamp = useCallback(',
  '    (value) => {',
  '      let next = Number(value)',
  '      if (Number.isNaN(next)) return count',
  '      if (min !== undefined) next = Math.max(next, min)',
  '      if (max !== undefined) next = Math.min(next, max)',
  '      return next',
  '    },',
  '    [min, max, count]',
  '  )',
  '',
  '  const set = useCallback(',
  '    (value) => {',
  "      setCount((prev) => clamp(typeof value === 'function' ? value(prev) : value))",
  '    },',
  '    [clamp]',
  '  )',
  '',
  '  const increment = useCallback(() => set((c) => c + step), [set, step])',
  '  const decrement = useCallback(() => set((c) => c - step), [set, step])',
  '  const reset = useCallback(() => set(initialValue), [initialValue, set])',
  '',
  '  return { count, set, increment, decrement, reset }',
  '}',
  '',
  '// uso:',
  '// const { count, increment, decrement, reset, set } = useCounter(0, { min: 0, max: 10, step: 2 })',
  '// increment() // 2',
  '// decrement() // 0',
  "// set(15)     // 10 (clampado pelo max)",
  '// reset()     // 0',
].join('\n')

const translations = {
  pt: {
    title: 'Snippet: useCounter',
    intro: (
      <>
        Hook utilitário para contadores numéricos no React. Ele encapsula{' '}
        <Text code>useState</Text> com limites mínimo/máximo, step e funções
        semânticas de incremento/decremento. Ideal para paginação, quantidade
        de itens, votos, likes ou qualquer controle numérico repetitivo.
      </>
    ),
    sourceTitle: 'Código-fonte',
    demoTitle: 'Demonstração',
    configTitle: 'Configuração ao vivo',
    min: 'Mínimo',
    max: 'Máximo',
    step: 'Step',
    initialValue: 'Valor inicial',
    value: 'Valor atual',
    increment: 'Incrementar',
    decrement: 'Decrementar',
    reset: 'Reset',
    setDirectly: 'Definir diretamente',
    clampNotice: 'Valores fora dos limites são automaticamente clampados.',
  },
  en: {
    title: 'Snippet: useCounter',
    intro: (
      <>
        A utility hook for numeric counters in React. It wraps{' '}
        <Text code>useState</Text> with optional min/max bounds, step size and
        semantic increment/decrement functions. Great for pagination, item
        quantities, votes, likes or any repetitive numeric control.
      </>
    ),
    sourceTitle: 'Source code',
    demoTitle: 'Demo',
    configTitle: 'Live configuration',
    min: 'Minimum',
    max: 'Maximum',
    step: 'Step',
    initialValue: 'Initial value',
    value: 'Current value',
    increment: 'Increment',
    decrement: 'Decrement',
    reset: 'Reset',
    setDirectly: 'Set directly',
    clampNotice: 'Values outside bounds are automatically clamped.',
  },
}

function DemoUsage({ t }) {
  const [min, setMin] = useState(0)
  const [max, setMax] = useState(100)
  const [step, setStep] = useState(5)
  const [initialValue, setInitialValue] = useState(10)
  const [directValue, setDirectValue] = useState(42)

  const { count, increment, decrement, reset, set } = useCounter(initialValue, {
    min,
    max,
    step,
  })

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Text type="secondary">{t.min}</Text>
          <InputNumber style={{ width: '100%' }} value={min} onChange={(v) => setMin(v ?? undefined)} />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Text type="secondary">{t.max}</Text>
          <InputNumber style={{ width: '100%' }} value={max} onChange={(v) => setMax(v ?? undefined)} />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Text type="secondary">{t.step}</Text>
          <InputNumber min={1} style={{ width: '100%' }} value={step} onChange={(v) => setStep(v ?? 1)} />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Text type="secondary">{t.initialValue}</Text>
          <InputNumber style={{ width: '100%' }} value={initialValue} onChange={(v) => setInitialValue(v ?? 0)} />
        </Col>
      </Row>

      <Card size="small" title={t.value}>
        <Space>
          <Title level={2} style={{ margin: 0 }}>{count}</Title>
          <Tag color="blue">min: {min ?? '—'}</Tag>
          <Tag color="blue">max: {max ?? '—'}</Tag>
          <Tag color="blue">step: {step}</Tag>
        </Space>
      </Card>

      <Space wrap>
        <Button type="primary" icon={<PlusOutlined />} onClick={increment}>
          {t.increment}
        </Button>
        <Button icon={<MinusOutlined />} onClick={decrement}>
          {t.decrement}
        </Button>
        <Button icon={<RedoOutlined />} onClick={reset}>
          {t.reset}
        </Button>
      </Space>

      <Space>
        <Text type="secondary">{t.setDirectly}:</Text>
        <InputNumber value={directValue} onChange={(v) => setDirectValue(v ?? 0)} />
        <Button onClick={() => set(directValue)}>{t.setDirectly}</Button>
      </Space>

      <Paragraph type="secondary" style={{ margin: 0 }}>
        {t.clampNotice}
      </Paragraph>
    </Space>
  )
}

export default function UseCounterSnippetPage() {
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
