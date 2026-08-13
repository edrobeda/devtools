import { useCallback, useState } from 'react'

export default function useCounter(initialValue = 0, options = {}) {
  const { min, max, step = 1 } = options
  const [count, setCount] = useState(initialValue)

  const clamp = useCallback(
    (value) => {
      let next = Number(value)
      if (Number.isNaN(next)) return count
      if (min !== undefined) next = Math.max(next, min)
      if (max !== undefined) next = Math.min(next, max)
      return next
    },
    [min, max, count]
  )

  const set = useCallback(
    (value) => {
      setCount((prev) => clamp(typeof value === 'function' ? value(prev) : value))
    },
    [clamp]
  )

  const increment = useCallback(() => set((c) => c + step), [set, step])
  const decrement = useCallback(() => set((c) => c - step), [set, step])
  const reset = useCallback(() => set(initialValue), [initialValue, set])

  return { count, set, increment, decrement, reset }
}
