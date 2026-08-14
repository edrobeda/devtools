import { useEffect, useState } from 'react'

export default function useSessionStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = window.sessionStorage.getItem(key)
      return stored !== null ? JSON.parse(stored) : initialValue
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    try {
      window.sessionStorage.setItem(key, JSON.stringify(value))
    } catch {
      // storage indisponível (modo privado, quota cheia etc.) — ignora
    }
  }, [key, value])

  return [value, setValue]
}
