import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

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
      const err = new Error(`Failed to load script: ${src}`)
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
}
