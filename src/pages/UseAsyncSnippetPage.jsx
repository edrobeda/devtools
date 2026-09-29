import React, { useCallback, useRef, useState } from 'react'
import { Typography, Card, Space, Button, Tag, Alert } from 'antd'
import {
  CodeOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  PlayCircleOutlined,
  StopOutlined,
} from '@ant-design/icons'
import useAsync from '../hooks/useAsync'
import useFetch from '../hooks/useFetch'
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

const fetchSourceCode = `import { useCallback, useEffect, useRef } from 'react'
import useAsync from './useAsync'

// Receita: o useAsync + três acréscimos para requisições HTTP.
// - AbortController: cancela a requisição anterior e a que estiver pendente no unmount
// - content-type: lê json ou text conforme o header da resposta
// - response.ok falso vira Error, caem no mesmo tratamento do useAsync
export default function useFetch(url, options = {}) {
  const { immediate = true } = options

  // options é um objeto novo a cada render; guardar em ref evita refazer a requisição
  const optionsRef = useRef(options)
  optionsRef.current = options

  const controllerRef = useRef(null)

  const request = useCallback(
    async (target = url) => {
      controllerRef.current?.abort()
      const controller = new AbortController()
      controllerRef.current = controller

      const { fetcher = fetch, immediate: _immediate, ...init } = optionsRef.current
      const response = await fetcher(target, { ...init, signal: controller.signal })

      if (controller.signal.aborted) {
        const aborted = new Error('Request aborted')
        aborted.name = 'AbortError'
        throw aborted
      }

      const contentType = response.headers.get('content-type') || ''
      const data = contentType.includes('application/json')
        ? await response.json()
        : await response.text()

      if (!response.ok) {
        throw new Error(response.statusText || 'HTTP ' + response.status)
      }

      return data
    },
    [url]
  )

  const { execute, reset, status, data, error, loading } = useAsync(request, { immediate })

  const abort = useCallback(() => {
    controllerRef.current?.abort()
  }, [])

  useEffect(() => () => controllerRef.current?.abort(), [])

  return { execute, abort, reset, status, data, error, loading }
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
        <Text code>reset()</Text> para limpar o estado. Abaixo, na receita, o
        mesmo hook vira um <Text code>useFetch</Text> completo.
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
    recipeTitle: 'Receita: requisição HTTP com fetch',
    recipeDesc: (
      <>
        O <Text code>useFetch</Text> é o <Text code>useAsync</Text> com três
        acréscimos e nada mais: <Text code>AbortController</Text> (cancela a
        requisição anterior e a que estiver pendente no unmount), leitura do{' '}
        <Text code>content-type</Text> (json ou text) e{' '}
        <Text code>throw</Text> quando <Text code>response.ok</Text> é falso.
        Estado, <Text code>status</Text>, <Text code>loading</Text>,{' '}
        <Text code>execute</Text> e <Text code>reset</Text> continuam vindo do{' '}
        <Text code>useAsync</Text>. O hook está em{' '}
        <Text code>src/hooks/useFetch.js</Text>, pronto pra importar.
      </>
    ),
    recipeDemoTitle: 'Demonstração da receita',
    recipeDemoDesc:
      'A demo abaixo usa um fetch simulado (mock) — não depende de rede externa. Clique para carregar com sucesso, forçar um erro ou cancelar a requisição em andamento:',
    load: 'Carregar com sucesso',
    reload: 'Recarregar',
    abort: 'Cancelar requisição',
    loaded: 'Dados carregados',
    failed: 'Falha simulada',
    cancelled: 'Requisição cancelada (AbortError) — a resposta que chegou tarde foi descartada',
    manualNote:
      'A demonstração roda com immediate: false para você controlar quando executar.',
    recipeNote: (
      <>
        Tudo que não for <Text code>immediate</Text> ou <Text code>fetcher</Text>{' '}
        vai direto pro <Text code>fetch</Text> como init (headers, method, body).
        Passando <Text code>fetcher</Text> você injeta um mock e testa o hook sem
        rede.
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
        <Text code>reset()</Text> to clear the state. In the recipe below the
        very same hook becomes a complete <Text code>useFetch</Text>.
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
    recipeTitle: 'Recipe: HTTP request with fetch',
    recipeDesc: (
      <>
        <Text code>useFetch</Text> is <Text code>useAsync</Text> plus three
        additions and nothing else: <Text code>AbortController</Text> (cancels
        the previous request and the pending one on unmount),{' '}
        <Text code>content-type</Text> parsing (json or text) and a{' '}
        <Text code>throw</Text> when <Text code>response.ok</Text> is false.{' '}
        State, <Text code>status</Text>, <Text code>loading</Text>,{' '}
        <Text code>execute</Text> and <Text code>reset</Text> still come from{' '}
        <Text code>useAsync</Text>. The hook lives in{' '}
        <Text code>src/hooks/useFetch.js</Text>, ready to import.
      </>
    ),
    recipeDemoTitle: 'Recipe demo',
    recipeDemoDesc:
      'The demo below uses a simulated (mock) fetch — no external network required. Click to load successfully, force an error or cancel the in-flight request:',
    load: 'Load successfully',
    reload: 'Reload',
    abort: 'Cancel request',
    loaded: 'Data loaded',
    failed: 'Simulated failure',
    cancelled:
      'Request cancelled (AbortError) — the late response was discarded',
    manualNote:
      'The demo runs with immediate: false so you control when to execute.',
    recipeNote: (
      <>
        Anything that is not <Text code>immediate</Text> or{' '}
        <Text code>fetcher</Text> goes straight to <Text code>fetch</Text> as
        init (headers, method, body). Pass a <Text code>fetcher</Text> to inject
        a mock and test the hook without network.
      </>
    ),
  },
}

const STATUS_COLORS = {
  idle: 'default',
  pending: 'processing',
  success: 'success',
  error: 'error',
}

function DemoUsage({ t }) {
  const shouldFailRef = useRef(false)

  const simulateRequest = useCallback(async () => {
    await new Promise((resolve) => setTimeout(resolve, 1200))
    if (shouldFailRef.current) {
      throw new Error(t.errorMsg)
    }
    return { ok: true, at: new Date().toLocaleTimeString() }
  }, [t.errorMsg])

  const { execute, reset, status, data, error, loading } = useAsync(simulateRequest, { immediate: false })

  const run = (shouldFail) => {
    shouldFailRef.current = shouldFail
    execute().catch(() => {})
  }

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Text type="secondary">{t.demoDesc}</Text>

      <Space wrap>
        <Button
          type="primary"
          icon={<CheckCircleOutlined />}
          loading={loading}
          onClick={() => run(false)}
        >
          {t.runSuccess}
        </Button>
        <Button
          danger
          icon={<CloseCircleOutlined />}
          loading={loading}
          onClick={() => run(true)}
        >
          {t.runError}
        </Button>
        <Button icon={<ReloadOutlined />} onClick={reset} disabled={loading}>
          {t.reset}
        </Button>
      </Space>

      <Space>
        <Text type="secondary">{t.status}:</Text>
        <Tag color={STATUS_COLORS[status]} style={{ textTransform: 'capitalize' }}>
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
        statusText: 'OK',
        headers: { get: () => 'application/json' },
        json: () =>
          Promise.resolve({
            id: 42,
            title: 'Mock task',
            completed: false,
            tags: ['react', 'hooks'],
          }),
        text: () => Promise.resolve('plain text response'),
      })
    }, 1200)
  })
}

function FetchRecipeDemo({ t }) {
  const shouldFailRef = useRef(false)

  const fetcher = useCallback(() => mockFetch({ shouldFail: shouldFailRef.current }), [])

  const { execute, abort, status, data, error, loading } = useFetch('/api/tasks/1', {
    immediate: false,
    fetcher,
  })

  const run = (shouldFail) => {
    shouldFailRef.current = shouldFail
    execute().catch(() => {})
  }

  const wasAborted = Boolean(error && error.name === 'AbortError')

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Text type="secondary">{t.recipeDemoDesc}</Text>
      <Alert type="info" showIcon message={t.manualNote} />

      <Space wrap>
        <Button
          type="primary"
          icon={<PlayCircleOutlined />}
          loading={loading}
          onClick={() => run(false)}
        >
          {t.load}
        </Button>
        <Button
          danger
          icon={<CloseCircleOutlined />}
          loading={loading}
          onClick={() => run(true)}
        >
          {t.runError}
        </Button>
        <Button icon={<ReloadOutlined />} onClick={() => run(false)} disabled={loading}>
          {t.reload}
        </Button>
        <Button icon={<StopOutlined />} onClick={abort} disabled={!loading}>
          {t.abort}
        </Button>
      </Space>

      <Space>
        <Text type="secondary">{t.status}:</Text>
        <Tag color={STATUS_COLORS[status]} style={{ textTransform: 'capitalize' }}>
          {t[status] || status}
        </Tag>
      </Space>

      {status === 'success' && (
        <Card size="small" title={<Tag color="green">{t.loaded}</Tag>}>
          <pre style={{ margin: 0, overflowX: 'auto' }}>
            <code>{JSON.stringify(data, null, 2)}</code>
          </pre>
        </Card>
      )}

      {status === 'error' && error && !wasAborted && (
        <Alert type="error" showIcon message={t.failed} description={error.message} />
      )}

      {wasAborted && <Alert type="warning" showIcon message={t.cancelled} />}

      <Paragraph type="secondary" style={{ marginBottom: 0 }}>
        {t.recipeNote}
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

      <Card title={t.recipeTitle}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Paragraph type="secondary" style={{ marginBottom: 0 }}>
            {t.recipeDesc}
          </Paragraph>
          <pre style={{ margin: 0, overflowX: 'auto' }}>
            <code>{fetchSourceCode}</code>
          </pre>
        </Space>
      </Card>

      <Card title={t.recipeDemoTitle}>
        <FetchRecipeDemo t={t} />
      </Card>
    </Space>
  )
}
