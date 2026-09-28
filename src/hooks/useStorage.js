import { useEffect, useState } from 'react'

export default function useStorage(key, initialValue, { session = false } = {}) {
  const [value, setValue] = useState(() => {
    try {
      const store = session ? window.sessionStorage : window.localStorage
      const stored = store.getItem(key)
      return stored !== null ? JSON.parse(stored) : initialValue
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    try {
      const store = session ? window.sessionStorage : window.localStorage
      store.setItem(key, JSON.stringify(value))
    } catch {
      // storage indisponível (modo privado, quota cheia etc.) — ignora
    }
  }, [key, value, session])

  return [value, setValue]
}

export function useLocalStorage(key, initialValue) {
  return useStorage(key, initialValue)
}

export function useSessionStorage(key, initialValue) {
  return useStorage(key, initialValue, { session: true })
}
