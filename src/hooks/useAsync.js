import { useCallback, useEffect, useRef, useState } from 'react'

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
}
