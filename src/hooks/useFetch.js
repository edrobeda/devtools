import { useCallback, useEffect, useRef, useState } from 'react'

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
}
