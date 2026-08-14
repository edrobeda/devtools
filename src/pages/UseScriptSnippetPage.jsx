import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Typography, Card, Space, Button, Tag, Alert, Input } from 'antd'
import { CodeOutlined, ReloadOutlined, DeleteOutlined, CloseCircleOutlined } from '@ant-design/icons'
import useScript from '../hooks/useScript'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input

const sourceCode = `import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

export default function useScript(src, options = {}) {
  const { attrs = {}, removeOnUnmount = true } = options
  const [status, setStatus] = useState(src ? 'loading' : 'idle')
  const [error, setError] = useState(null)

  const attrsRef = useRef(attrs)
  attrsRef.current = attrs

  // Chave estável para detectar mudanças reais nos atributos sem disparar o
  // efeito quando um objeto igual é recriado a cada render.
  const attrsKey = useMemo(() => JSON.stringify(attrs), [attrs])

  const reload = useCallback(() => {
    if (!src) return
    const escaped = src.replace(/"/g, '\\"')
    const existing = document.querySelector('script[data-use-script="' + escaped + '"]')
    if (existing) {
      existing.remove()
    }
    setStatus('loading')
    setError(null)
  }, [src])

  useEffect(() => {
    if (!src) {
      setStatus('idle')
      setError(null)
      return
    }

    setStatus('loading')
    setError(null)

    const escaped = src.replace(/"/g, '\\"')
    let script = document.querySelector('script[data-use-script="' + escaped + '"]')
    let created = false

    if (!script) {
      script = document.createElement('script')
      script.src = src
      script.async = true
      script.dataset.useScript = src
      Object.entries(attrsRef.current).forEach(([key, value]) => {
        if (key === 'async' || key === 'defer') {
          script[key] = value
        } else {
          script.setAttribute(key, value)
        }
      })
      document.head.appendChild(script)
      created = true
    }

    if (script.dataset.useScriptReady === 'true') {
      setStatus('ready')
      return
    }

    const handleLoad = () => {
      script.dataset.useScriptReady = 'true'
      setStatus('ready')
      setError(null)
    }

    const handleError = () => {
      script.dataset.useScriptReady = 'error'
      const err = new Error(\`Failed to load script: \${src}\`)
      setStatus('error')
      setError(err)
    }

    script.addEventListener('load', handleLoad)
    script.addEventListener('error', handleError)

    return () => {
      script.removeEventListener('load', handleLoad)
      script.removeEventListener('error', handleError)
      if (removeOnUnmount && created) {
        script.remove()
      }
    }
  }, [src, removeOnUnmount, attrsKey])

  return {
    loading: status === 'loading',
    ready: status === 'ready',
    error,
    status,
    reload,
  }
}`

const DEFAULT_SCRIPT = `window.demoUseScriptGreet = function(name) {
  return 'Hello, ' + name + '!';
};`

const translations = {
  pt: {
    title: 'Snippet: useScript',
    intro: (
      <>
        Hook para carregar scripts externos dinamicamente no React (Google Maps,
        Stripe, analytics, widgets de chat etc.). Ele insere uma tag{' '}
        <Text code>{'<script>'}</Text>, escuta os eventos <Text code>load</Text>{' '}
        e <Text code>error</Text>, devolve estados de carregamento/erro/pronto
        e remove a tag automaticamente na desmontagem. Já está em{' '}
        <Text code>src/hooks/useScript.js</Text>, pronto pra importar.
      </>
    ),
    sourceTitle: 'Código-fonte',
    demoTitle: 'Demonstração',
    demoDesc: (
      <>
        O demo abaixo cria um script via <Text code>Blob URL</Text>, carrega ele
        com o hook e executa uma função que o script exporta para o{' '}
        <Text code>window</Text>:
      </>
    ),
    scriptLabel: 'Conteúdo do script a carregar',
    loadButton: 'Carregar script',
    reloadButton: 'Recarregar',
    removeButton: 'Remover',
    invalidButton: 'Script inválido',
    status: 'Status',
    idle: 'idle',
    loading: 'loading',
    ready: 'ready',
    error: 'error',
    result: 'Resultado da função carregada',
    errorMessage: 'Falha ao carregar o script',
    note: (
      <>
        Dica: passe <Text code>removeOnUnmount: false</Text> quando o script
        precisar permanecer no DOM mesmo depois do componente desmontar (ex.:
        bibliotecas globais carregadas uma única vez).
      </>
    ),
  },
  en: {
    title: 'Snippet: useScript',
    intro: (
      <>
        A hook to dynamically load external scripts in React (Google Maps,
        Stripe, analytics, chat widgets, etc.). It injects a{' '}
        <Text code>{'<script>'}</Text> tag, listens to <Text code>load</Text>{' '}
        and <Text code>error</Text> events, returns loading/error/ready states
        and removes the tag on unmount. It already lives in{' '}
        <Text code>src/hooks/useScript.js</Text>, ready to import.
      </>
    ),
    sourceTitle: 'Source code',
    demoTitle: 'Demo',
    demoDesc: (
      <>
        The demo below creates a script via <Text code>Blob URL</Text>, loads it
        with the hook and calls a function the script exposes on{' '}
        <Text code>window</Text>:
      </>
    ),
    scriptLabel: 'Script content to load',
    loadButton: 'Load script',
    reloadButton: 'Reload',
    removeButton: 'Remove',
    invalidButton: 'Invalid script',
    status: 'Status',
    idle: 'idle',
    loading: 'loading',
    ready: 'ready',
    error: 'error',
    result: 'Result from the loaded function',
    errorMessage: 'Failed to load the script',
    note: (
      <>
        Tip: pass <Text code>removeOnUnmount: false</Text> when the script must
        stay in the DOM even after the component unmounts (e.g. globally loaded
        libraries).
      </>
    ),
  },
}

function DemoUsage({ t }) {
  const [code, setCode] = useState(DEFAULT_SCRIPT)
  const [src, setSrc] = useState(null)
  const [result, setResult] = useState(null)
  const blobUrlRef = useRef(null)

  const { loading, ready, error, status, reload } = useScript(src, { removeOnUnmount: true })

  const cleanupPrevious = useCallback(() => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current)
      blobUrlRef.current = null
    }
    delete window.demoUseScriptGreet
  }, [])

  const loadScript = useCallback(() => {
    cleanupPrevious()
    blobUrlRef.current = URL.createObjectURL(new Blob([code], { type: 'application/javascript' }))
    setSrc(blobUrlRef.current)
    setResult(null)
  }, [code, cleanupPrevious])

  const removeScript = useCallback(() => {
    cleanupPrevious()
    setSrc(null)
    setResult(null)
  }, [cleanupPrevious])

  const loadInvalid = useCallback(() => {
    cleanupPrevious()
    setSrc(`${window.location.origin}/__fake-script-${Date.now()}.js`)
    setResult(null)
  }, [cleanupPrevious])

  useEffect(() => {
    if (ready && typeof window.demoUseScriptGreet === 'function') {
      setResult(window.demoUseScriptGreet('DevTools'))
    }
  }, [ready])

  useEffect(() => {
    return () => {
      cleanupPrevious()
    }
  }, [cleanupPrevious])

  const statusColor = {
    idle: 'default',
    loading: 'processing',
    ready: 'success',
    error: 'error',
  }[status]

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Text type="secondary">{t.demoDesc}</Text>

      <div>
        <Text type="secondary">{t.scriptLabel}</Text>
        <TextArea
          rows={4}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          style={{ marginTop: 8, fontFamily: 'monospace' }}
        />
      </div>

      <Space wrap>
        <Button type="primary" onClick={loadScript} disabled={loading || !code.trim()}>
          {t.loadButton}
        </Button>
        <Button icon={<ReloadOutlined />} onClick={reload} disabled={!src || loading}>
          {t.reloadButton}
        </Button>
        <Button icon={<DeleteOutlined />} onClick={removeScript} disabled={!src}>
          {t.removeButton}
        </Button>
        <Button icon={<CloseCircleOutlined />} danger onClick={loadInvalid} disabled={loading}>
          {t.invalidButton}
        </Button>
      </Space>

      <Space>
        <Text type="secondary">{t.status}:</Text>
        <Tag color={statusColor}>{t[status] || status}</Tag>
      </Space>

      {ready && result !== null && (
        <Alert type="success" showIcon message={`${t.result}: ${result}`} />
      )}

      {error && (
        <Alert type="error" showIcon message={t.errorMessage} description={error.message} />
      )}

      <Paragraph type="secondary" style={{ marginBottom: 0 }}>
        {t.note}
      </Paragraph>
    </Space>
  )
}

export default function UseScriptSnippetPage() {
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
