import { useCallback, useState } from 'react'

export default function useSet(initialValue = []) {
  const [set, setSet] = useState(() => new Set(initialValue))

  const add = useCallback((value) => {
    setSet((prev) => {
      if (prev.has(value)) return prev
      const next = new Set(prev)
      next.add(value)
      return next
    })
  }, [])

  const remove = useCallback((value) => {
    setSet((prev) => {
      if (!prev.has(value)) return prev
      const next = new Set(prev)
      next.delete(value)
      return next
    })
  }, [])

  const toggle = useCallback((value) => {
    setSet((prev) => {
      const next = new Set(prev)
      if (next.has(value)) {
        next.delete(value)
      } else {
        next.add(value)
      }
      return next
    })
  }, [])

  const clear = useCallback(() => {
    setSet((prev) => (prev.size === 0 ? prev : new Set()))
  }, [])

  const reset = useCallback(() => {
    setSet(new Set(initialValue))
  }, [initialValue])

  const has = useCallback((value) => set.has(value), [set])

  return {
    set,
    values: Array.from(set),
    size: set.size,
    add,
    remove,
    toggle,
    clear,
    reset,
    has,
  }
}
