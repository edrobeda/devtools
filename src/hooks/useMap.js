import { useCallback, useState } from 'react'

export default function useMap(initialValue = []) {
  const [map, setMap] = useState(() => new Map(initialValue))

  const set = useCallback((key, value) => {
    setMap((prev) => {
      if (prev.has(key) && Object.is(prev.get(key), value)) return prev
      const next = new Map(prev)
      next.set(key, value)
      return next
    })
  }, [])

  const setAll = useCallback((entries) => {
    setMap(new Map(entries))
  }, [])

  const remove = useCallback((key) => {
    setMap((prev) => {
      if (!prev.has(key)) return prev
      const next = new Map(prev)
      next.delete(key)
      return next
    })
  }, [])

  const clear = useCallback(() => {
    setMap((prev) => (prev.size === 0 ? prev : new Map()))
  }, [])

  const reset = useCallback(() => {
    setMap(new Map(initialValue))
  }, [initialValue])

  const has = useCallback((key) => map.has(key), [map])

  const get = useCallback((key) => map.get(key), [map])

  return {
    map,
    entries: Array.from(map.entries()),
    keys: Array.from(map.keys()),
    values: Array.from(map.values()),
    size: map.size,
    set,
    setAll,
    remove,
    clear,
    reset,
    has,
    get,
  }
}
