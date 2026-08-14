import { useCallback, useRef, useState } from 'react'

const defaultCapacity = 50

function isEqual(a, b) {
  return Object.is(a, b)
}

export default function useStateWithHistory(initialValue, options = {}) {
  const { capacity = defaultCapacity, compare = isEqual } = options

  const [state, setState] = useState({
    history: [initialValue],
    pointer: 0,
  })

  const capacityRef = useRef(capacity)
  capacityRef.current = capacity

  const compareRef = useRef(compare)
  compareRef.current = compare

  const value = state.history[state.pointer]

  const set = useCallback((next, options = {}) => {
    const { overwrite = false, silent = false } = options
    setState((current) => {
      const resolved = typeof next === 'function'
        ? next(current.history[current.pointer])
        : next

      if (!silent && compareRef.current(current.history[current.pointer], resolved)) {
        return current
      }

      let nextHistory
      if (overwrite) {
        nextHistory = [...current.history.slice(0, current.pointer), resolved]
      } else {
        nextHistory = [...current.history.slice(0, current.pointer + 1), resolved]
      }

      if (capacityRef.current > 0 && nextHistory.length > capacityRef.current) {
        const overflow = nextHistory.length - capacityRef.current
        nextHistory = nextHistory.slice(overflow)
      }

      const nextPointer = nextHistory.length - 1
      return { history: nextHistory, pointer: nextPointer }
    })
  }, [])

  const go = useCallback((index) => {
    setState((current) => {
      const target = Math.min(Math.max(index, 0), current.history.length - 1)
      if (target === current.pointer) return current
      return { ...current, pointer: target }
    })
  }, [])

  const back = useCallback((steps = 1) => {
    setState((current) => {
      const target = Math.max(current.pointer - steps, 0)
      if (target === current.pointer) return current
      return { ...current, pointer: target }
    })
  }, [])

  const forward = useCallback((steps = 1) => {
    setState((current) => {
      const target = Math.min(current.pointer + steps, current.history.length - 1)
      if (target === current.pointer) return current
      return { ...current, pointer: target }
    })
  }, [])

  const undo = useCallback(() => back(1), [back])
  const redo = useCallback(() => forward(1), [forward])

  const reset = useCallback((newInitialValue, options = {}) => {
    const { keepHistory = false } = options
    if (keepHistory) {
      setState((current) => ({
        history: [...current.history.slice(0, current.pointer + 1), newInitialValue],
        pointer: current.pointer + 1,
      }))
    } else {
      setState({ history: [newInitialValue], pointer: 0 })
    }
  }, [])

  const clearHistory = useCallback((newValue) => {
    const nextValue = newValue !== undefined ? newValue : value
    setState({ history: [nextValue], pointer: 0 })
  }, [value])

  return {
    value,
    set,
    history: state.history,
    pointer: state.pointer,
    canUndo: state.pointer > 0,
    canRedo: state.pointer < state.history.length - 1,
    go,
    back,
    forward,
    undo,
    redo,
    reset,
    clearHistory,
  }
}
