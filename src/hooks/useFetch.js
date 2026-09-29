import { useCallback, useEffect, useRef } from 'react'
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
}
