import React, { useCallback, useState } from 'react'
import { Typography, Card, Space, Button, Tag, Alert } from 'antd'
import { CodeOutlined, ReloadOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons'
import useAsync from '../hooks/useAsync'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const sourceCode = `import { useCallback, useEffect, useRef, useState } from 'react'

export default function useAsync(fn, options = {}) {
  const { immediate = true } = options

  const [status, setStatus] = useState('idle')
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  const fnRef = useRef(fn)
  fnRef.current = fn

  const execute = useCallback(async (...args) => {
    setStatus('pending')
    setData(null)
    setError(null)

    try {
      const result = await fnRef.current(...args)
      setData(result)
      setStatus('success')
      return result
    } catch (err) {
      const normalized = err instanceof Error ? err : new Error(String(err))
      setError(normalized)
      setStatus('error')
      throw normalized
    }
  }, [])

  const reset = useCallback(() => {
    setStatus('idle')
    setData(null)
    setError(null)
  }, [])

  useEffect(() => {
    if (immediate) {
      execute()
    }
  }, [immediate, execute])

  const loading = status === 'pending'

  return {
    execute,
    reset,
    status,
    data,
    error,
    loading,
  }
}`

const translations = {
  pt: {
    title: 'Snippet: useAsync',
    intro: (
      <>
        Hook genérico para qualquer operação assíncrona. Mantém os estados{' '}
        <Text code>status</Text>, <Text code>data</Text>, <Text code>error</Text>{' '}
        e <Text code>loading</Text>; executa a função automaticamente na montagem
        (a menos que <Text code>immediate: false</Text>); expõe{' '}
        <Text code>execute(...args)</Text> para disparar sob demanda e{' '}
        <Text code>reset()</Text> para limpar o estado.
      </>
    ),
    sourceTitle: 'Código-fonte',
    demoTitle: 'Demonstração',
    demoDesc: 'A função abaixo simula uma chamada assíncrona. Você pode forçar sucesso, erro ou resetar o estado:',
    runSuccess: 'Executar sucesso',
    runError: 'Forçar erro',
    reset: 'Resetar',
    status: 'Status',
    idle: 'idle',
    pending: 'pending',
    success: 'success',
    error: 'error',
    result: 'Resultado',
    errorMsg: 'Mensagem de erro',
    note: (
      <>
        Dica: passe <Text code>immediate: false</Text> no segundo argumento quando
        quiser disparar a operação só via botão/formulário. O <Text code>execute</Text>{' '}
        aceita argumentos e repassa para a função original.
      </>
    ),
  },
  en: {
    title: 'Snippet: useAsync',
    intro: (
      <>
        A generic hook for any async operation. It keeps{' '}
        <Text code>status</Text>, <Text code>data</Text>, <Text code>error</Text>{' '}
        and <Text code>loading</Text>; runs the function automatically on mount
        unless <Text code>immediate: false</Text>; exposes{' '}
        <Text code>execute(...args)</Text> to trigger on demand and{' '}
        <Text code>reset()</Text> to clear the state.
      </>
    ),
    sourceTitle: 'Source code',
    demoTitle: 'Demo',
    demoDesc: 'The function below simulates an async call. You can force success, error or reset the state:',
    runSuccess: 'Run success',
    runError: 'Force error',
    reset: 'Reset',
    status: 'Status',
    idle: 'idle',
    pending: 'pending',
    success: 'success',
    error: 'error',
    result: 'Result',
    errorMsg: 'Error message',
    note: (
      <>
        Tip: pass <Text code>immediate: false</Text> as the second argument when
        you only want to trigger the operation via button/form.{' '}
        <Text code>execute</Text> accepts arguments and forwards them to the
        original function.
      </>
    ),
  },
}

function DemoUsage({ t }) {
  const [shouldFail, setShouldFail] = useState(false)

  const simulateRequest = useCallback(async () => {
    await new Promise((resolve) => setTimeout(resolve, 1200))
    if (shouldFail) {
      throw new Error(t.errorMsg)
    }
    return { ok: true, at: new Date().toLocaleTimeString() }
  }, [shouldFail, t.errorMsg])

  const { execute, reset, status, data, error, loading } = useAsync(simulateRequest, { immediate: false })

  const statusColor = {
    idle: 'default',
    pending: 'processing',
    success: 'success',
    error: 'error',
  }[status]

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Text type="secondary">{t.demoDesc}</Text>

      <Space wrap>
        <Button
          type="primary"
          icon={<CheckCircleOutlined />}
          loading={loading}
          onClick={() => {
            setShouldFail(false)
            execute()
          }}
        >
          {t.runSuccess}
        </Button>
        <Button
          danger
          icon={<CloseCircleOutlined />}
          loading={loading}
          onClick={() => {
            setShouldFail(true)
            execute()
          }}
        >
          {t.runError}
        </Button>
        <Button icon={<ReloadOutlined />} onClick={reset} disabled={loading}>
          {t.reset}
        </Button>
      </Space>

      <Space>
        <Text type="secondary">{t.status}:</Text>
        <Tag color={statusColor} style={{ textTransform: 'capitalize' }}>
          {t[status] || status}
        </Tag>
      </Space>

      {status === 'success' && (
        <Alert type="success" showIcon message={`${t.result}: ${JSON.stringify(data)}`} />
      )}

      {status === 'error' && error && (
        <Alert type="error" showIcon message={error.message} />
      )}

      <Paragraph type="secondary" style={{ marginBottom: 0 }}>
        {t.note}
      </Paragraph>
    </Space>
  )
}

export default function UseAsyncSnippetPage() {
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
