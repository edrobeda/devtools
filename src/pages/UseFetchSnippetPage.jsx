import React, { useCallback, useState } from 'react'
import { Typography, Card, Space, Button, Alert, Spin, Tag } from 'antd'
import { CodeOutlined, PlayCircleOutlined, ReloadOutlined, CloseCircleOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import useFetch from '../hooks/useFetch'

const { Title, Paragraph, Text } = Typography

const sourceCode = `import { useCallback, useEffect, useRef, useState } from 'react'

export default function useFetch(url, options = {}) {
  const [state, setState] = useState({
    data: null,
    error: null,
    loading: false,
  })

  const abortControllerRef = useRef(null)

  const execute = useCallback(
    async (overrideOptions = {}) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      abortControllerRef.current = new AbortController()

      setState((s) => ({ ...s, loading: true, error: null }))

      try {
        const mergedOptions = {
          ...options,
          ...overrideOptions,
          signal: abortControllerRef.current.signal,
        }
        const fetcher = mergedOptions.fetcher || fetch
        delete mergedOptions.fetcher
        delete mergedOptions.manual

        const response = await fetcher(url, mergedOptions)

        let data
        const contentType = response.headers.get('content-type') || ''
        if (contentType.includes('application/json')) {
          data = await response.json()
        } else {
          data = await response.text()
        }

        if (!response.ok) {
          throw new Error(response.statusText || 'HTTP ' + response.status)
        }

        setState({ data, error: null, loading: false })
        return { data, error: null }
      } catch (error) {
        if (error.name === 'AbortError') {
          return { data: null, error: null }
        }
        setState({ data: null, error, loading: false })
        return { data: null, error }
      }
    },
    [url, options]
  )

  useEffect(() => {
    if (options.manual) return undefined

    execute()

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [execute, options.manual])

  return {
    ...state,
    execute,
    abort: () => {
      abortControllerRef.current?.abort()
    },
  }
}`

const translations = {
  pt: {
    title: 'Snippet: useFetch',
    intro: (
      <>
        Hook declarativo para requisições HTTP com <Text code>fetch</Text>.
        Recebe uma URL e opções, mantém os estados{' '}
        <Text code>data</Text>, <Text code>error</Text> e{' '}
        <Text code>loading</Text>, executa automaticamente na montagem (a
        menos que <Text code>options.manual</Text> seja <Text code>true</Text>)
        e expõe a função <Text code>execute()</Text> para disparar novamente
        sob demanda. Usa <Text code>AbortController</Text> para cancelar
        requisições pendentes ao desmontar ou ao reexecutar, evitando
        vazamentos e estados obsoletos. Já está em{' '}
        <Text code>src/hooks/useFetch.js</Text>, pronto pra importar.
      </>
    ),
    sourceTitle: 'Código-fonte',
    demoTitle: 'Demonstração',
    demoDesc:
      'A demo abaixo usa um fetch simulado (mock) — não depende de rede externa. Clique para carregar com sucesso ou forçar um erro:',
    success: 'Carregar com sucesso',
    error: 'Forçar erro',
    reload: 'Recarregar',
    loading: 'Carregando...',
    loaded: 'Dados carregados',
    failed: 'Falha simulada',
    manualNote:
      'A demonstração roda em modo manual (options.manual) para você controlar quando executar.',
  },
  en: {
    title: 'Snippet: useFetch',
    intro: (
      <>
        Declarative HTTP request hook using <Text code>fetch</Text>. It takes
        a URL and options, keeps <Text code>data</Text>,{' '}
        <Text code>error</Text> and <Text code>loading</Text> states, runs
        automatically on mount (unless <Text code>options.manual</Text> is{' '}
        <Text code>true</Text>) and exposes an <Text code>execute()</Text>{' '}
        function to trigger it again on demand. Uses{' '}
        <Text code>AbortController</Text> to cancel pending requests when
        unmounting or re-executing, preventing leaks and stale state. Already
        lives in <Text code>src/hooks/useFetch.js</Text>, ready to import.
      </>
    ),
    sourceTitle: 'Source code',
    demoTitle: 'Demo',
    demoDesc:
      'The demo below uses a simulated (mock) fetch — no external network required. Click to load successfully or force an error:',
    success: 'Load successfully',
    error: 'Force error',
    reload: 'Reload',
    loading: 'Loading...',
    loaded: 'Data loaded',
    failed: 'Simulated failure',
    manualNote:
      'The demo runs in manual mode (options.manual) so you control when to execute.',
  },
}

function mockFetch({ shouldFail = false } = {}) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (shouldFail) {
        reject(new Error('Network error (simulated)'))
        return
      }
      resolve({
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: () =>
          Promise.resolve({
            id: 42,
            title: 'Mock task',
            completed: false,
            tags: ['react', 'hooks'],
          }),
      })
    }, 1200)
  })
}

function DemoUsage({ t }) {
  const [failNext, setFailNext] = useState(false)

  const fetcher = useCallback(
    () => mockFetch({ shouldFail: failNext }),
    [failNext]
  )

  const { data, error, loading, execute } = useFetch(null, {
    manual: true,
    fetcher,
  })

  const runSuccess = () => {
    setFailNext(false)
    execute()
  }

  const runError = () => {
    setFailNext(true)
    execute()
  }

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Text type="secondary">{t.demoDesc}</Text>
      <Alert type="info" showIcon message={t.manualNote} />

      <Space wrap>
        <Button
          type="primary"
          icon={<PlayCircleOutlined />}
          onClick={runSuccess}
          loading={loading}
        >
          {t.success}
        </Button>
        <Button
          danger
          icon={<CloseCircleOutlined />}
          onClick={runError}
          loading={loading}
        >
          {t.error}
        </Button>
        <Button icon={<ReloadOutlined />} onClick={runSuccess} disabled={loading}>
          {t.reload}
        </Button>
      </Space>

      {loading && (
        <div style={{ padding: '16px 0' }}>
          <Spin tip={t.loading} />
        </div>
      )}

      {!loading && data && (
        <Card size="small" title={<Tag color="green">{t.loaded}</Tag>}>
          <pre style={{ margin: 0, overflowX: 'auto' }}>
            <code>{JSON.stringify(data, null, 2)}</code>
          </pre>
        </Card>
      )}

      {!loading && error && (
        <Alert type="error" showIcon message={t.failed} description={error.message} />
      )}
    </Space>
  )
}

export default function UseFetchSnippetPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}>
        <CodeOutlined /> {t.title}
      </Title>
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
