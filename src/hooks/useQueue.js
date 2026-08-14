import { useCallback, useState } from 'react'

export default function useQueue(initialValue = []) {
  const [queue, setQueue] = useState(() => Array.from(initialValue))

  const enqueue = useCallback((value) => {
    setQueue((prev) => [...prev, value])
  }, [])

  const dequeue = useCallback(() => {
    let removed
    setQueue((prev) => {
      if (prev.length === 0) return prev
      removed = prev[0]
      return prev.slice(1)
    })
    return removed
  }, [])

  const peek = useCallback(() => queue[0], [queue])

  const clear = useCallback(() => {
    setQueue((prev) => (prev.length === 0 ? prev : []))
  }, [])

  const reset = useCallback(() => {
    setQueue(Array.from(initialValue))
  }, [initialValue])

  return {
    queue,           // array atual (readonly)
    size: queue.length,
    isEmpty: queue.length === 0,
    first: queue[0],
    last: queue[queue.length - 1],
    enqueue,
    dequeue,
    peek,
    clear,
    reset,
  }
}
