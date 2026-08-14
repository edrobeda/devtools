import { useCallback, useState } from 'react'

export default function useList(initialValue = []) {
  const [list, setList] = useState(initialValue)

  const set = useCallback((value) => {
    setList(value)
  }, [])

  const push = useCallback((value) => {
    setList((prev) => [...prev, value])
  }, [])

  const unshift = useCallback((value) => {
    setList((prev) => [value, ...prev])
  }, [])

  const insertAt = useCallback((index, value) => {
    setList((prev) => {
      const next = [...prev]
      next.splice(index, 0, value)
      return next
    })
  }, [])

  const updateAt = useCallback((index, value) => {
    setList((prev) => {
      if (index < 0 || index >= prev.length) return prev
      if (prev[index] === value) return prev
      const next = [...prev]
      next[index] = value
      return next
    })
  }, [])

  const removeAt = useCallback((index) => {
    setList((prev) => {
      if (index < 0 || index >= prev.length) return prev
      return [...prev.slice(0, index), ...prev.slice(index + 1)]
    })
  }, [])

  const remove = useCallback((value) => {
    setList((prev) => prev.filter((item) => item !== value))
  }, [])

  const move = useCallback((from, to) => {
    setList((prev) => {
      if (from < 0 || from >= prev.length || to < 0 || to >= prev.length || from === to) {
        return prev
      }
      const next = [...prev]
      const [item] = next.splice(from, 1)
      next.splice(to, 0, item)
      return next
    })
  }, [])

  const swap = useCallback((indexA, indexB) => {
    setList((prev) => {
      if (
        indexA < 0 || indexA >= prev.length ||
        indexB < 0 || indexB >= prev.length ||
        indexA === indexB
      ) {
        return prev
      }
      const next = [...prev]
      ;[next[indexA], next[indexB]] = [next[indexB], next[indexA]]
      return next
    })
  }, [])

  const filter = useCallback((predicate) => {
    setList((prev) => prev.filter(predicate))
  }, [])

  const sort = useCallback((compareFn) => {
    setList((prev) => [...prev].sort(compareFn))
  }, [])

  const reverse = useCallback(() => {
    setList((prev) => [...prev].reverse())
  }, [])

  const clear = useCallback(() => {
    setList([])
  }, [])

  const reset = useCallback(() => {
    setList(initialValue)
  }, [initialValue])

  return {
    list,
    set,
    push,
    unshift,
    insertAt,
    updateAt,
    removeAt,
    remove,
    move,
    swap,
    filter,
    sort,
    reverse,
    clear,
    reset,
  }
}
