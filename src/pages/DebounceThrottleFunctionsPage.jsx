import React, { useMemo, useState } from 'react'
import { Typography, Card, Space, Button, Tag } from 'antd'
import { FunctionOutlined } from '@ant-design/icons'
import { debounce, throttle } from '../utils/debounceThrottle'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const sourceCode = `export function debounce(fn, waitMs = 300) {
  let timer = null
  return function debounced(...args) {
    clearTimeout(timer)
    timer = setTimeout(() => fn.apply(this, args), waitMs)
  }
}

export function throttle(fn, limitMs = 300) {
  let lastRan = 0
  let timer = null
  return function throttled(...args) {
    const now = Date.now()
    const remaining = limitMs - (now - lastRan)
    if (remaining <= 0) {
      // já passou o intervalo mínimo: executa na hora
      clearTimeout(timer)
      timer = null
      lastRan = now
      fn.apply(this, args)
    } else {
      // ainda dentro da janela: agenda pra rodar assim que ela fechar,
      // garantindo a "trailing call" com o último argumento recebido
      clearTimeout(timer)
      timer = setTimeout(() => {
        lastRan = Date.now()
        timer = null
        fn.apply(this, args)
      }, remaining)
    }
  }
}`

const translations = {
  pt: {
    title: 'Snippet: debounce/throttle (função pura)',
    intro: (
      <>
        Implementação de <Text code>debounce</Text> e <Text code>throttle</Text> como
        funções puras de JavaScript, sem depender de React — úteis fora de
        componentes (listeners de DOM direto, workers, código de biblioteca).
        Complementam os hooks <Text code>useDebounce</Text> e{' '}
        <Text code>useThrottle</Text> já existentes, que resolvem o mesmo
        problema mas presos ao ciclo de vida de um componente React. Já estão
        em <Text code>src/utils/debounceThrottle.js</Text>, prontas pra
        importar em qualquer lugar. O <Text code>throttle</Text> aqui é
        "trailing": garante que a última chamada dentro da janela também
        executa, em vez de simplesmente descartá-la.
      </>
    ),
    sourceTitle: 'Código-fonte',
    demoTitle: 'Demonstração',
    demoDesc: 'Clique rápido nos botões — cada um usa sua própria instância de função memoizada com o intervalo escolhido:',
    rawLabel: 'Cliques brutos',
    debouncedLabel: 'Chamadas via debounce (300ms)',
    throttledLabel: 'Chamadas via throttle (300ms)',
    debounceButton: 'Clicar (debounce)',
    throttleButton: 'Clicar (throttle)',
    debounceHint: 'Só dispara depois que os cliques pararem por 300ms.',
    throttleHint: 'Dispara no máximo uma vez a cada 300ms, incluindo o último clique da rajada.',
  },
  en: {
    title: 'Snippet: debounce/throttle (plain functions)',
    intro: (
      <>
        A <Text code>debounce</Text> and <Text code>throttle</Text> implementation
        as plain JavaScript functions, with no React dependency — useful
        outside components (direct DOM listeners, workers, library code).
        They complement the existing <Text code>useDebounce</Text> and{' '}
        <Text code>useThrottle</Text> hooks, which solve the same problem but
        are tied to a React component's lifecycle. Already live in{' '}
        <Text code>src/utils/debounceThrottle.js</Text>, ready to import
        anywhere. The <Text code>throttle</Text> here is "trailing": it
        guarantees the last call within the window still fires, instead of
        just dropping it.
      </>
    ),
    sourceTitle: 'Source code',
    demoTitle: 'Demo',
    demoDesc: 'Click the buttons rapidly — each uses its own memoized function instance with the chosen interval:',
    rawLabel: 'Raw clicks',
    debouncedLabel: 'Debounced calls (300ms)',
    throttledLabel: 'Throttled calls (300ms)',
    debounceButton: 'Click (debounce)',
    throttleButton: 'Click (throttle)',
    debounceHint: 'Only fires once clicks stop for 300ms.',
    throttleHint: 'Fires at most once every 300ms, including the last click of a burst.',
  },
}

function DemoUsage({ t }) {
  const [rawDebounceClicks, setRawDebounceClicks] = useState(0)
  const [debouncedCalls, setDebouncedCalls] = useState(0)
  const [rawThrottleClicks, setRawThrottleClicks] = useState(0)
  const [throttledCalls, setThrottledCalls] = useState(0)

  const debouncedFn = useMemo(
    () => debounce(() => setDebouncedCalls((c) => c + 1), 300),
    [],
  )
  const throttledFn = useMemo(
    () => throttle(() => setThrottledCalls((c) => c + 1), 300),
    [],
  )

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Text type="secondary">{t.demoDesc}</Text>
      <Space size="large" wrap align="start">
        <Card size="small" style={{ width: 280 }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Button
              type="primary"
              block
              onClick={() => {
                setRawDebounceClicks((c) => c + 1)
                debouncedFn()
              }}
            >
              {t.debounceButton}
            </Button>
            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
              <Text type="secondary">{t.rawLabel}</Text>
              <Tag>{rawDebounceClicks}</Tag>
            </Space>
            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
              <Text type="secondary">{t.debouncedLabel}</Text>
              <Tag color="blue">{debouncedCalls}</Tag>
            </Space>
            <Text type="secondary" style={{ fontSize: 12 }}>{t.debounceHint}</Text>
          </Space>
        </Card>
        <Card size="small" style={{ width: 280 }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Button
              type="primary"
              block
              onClick={() => {
                setRawThrottleClicks((c) => c + 1)
                throttledFn()
              }}
            >
              {t.throttleButton}
            </Button>
            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
              <Text type="secondary">{t.rawLabel}</Text>
              <Tag>{rawThrottleClicks}</Tag>
            </Space>
            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
              <Text type="secondary">{t.throttledLabel}</Text>
              <Tag color="purple">{throttledCalls}</Tag>
            </Space>
            <Text type="secondary" style={{ fontSize: 12 }}>{t.throttleHint}</Text>
          </Space>
        </Card>
      </Space>
    </Space>
  )
}

export default function DebounceThrottleFunctionsPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><FunctionOutlined /> {t.title}</Title>
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
