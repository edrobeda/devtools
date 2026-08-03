import { useCallback, useState } from 'react'

export default function useUndo(initialValue) {
  const [state, setState] = useState({
    past: [],
    present: initialValue,
    future: [],
  })

  const canUndo = state.past.length > 0
  const canRedo = state.future.length > 0

  const set = useCallback((value) => {
    setState((s) => {
      const nextValue = typeof value === 'function' ? value(s.present) : value
      if (nextValue === s.present) return s
      return {
        past: [...s.past, s.present],
        present: nextValue,
        future: [],
      }
    })
  }, [])

  const undo = useCallback(() => {
    setState((s) => {
      if (s.past.length === 0) return s
      const previous = s.past[s.past.length - 1]
      return {
        past: s.past.slice(0, -1),
        present: previous,
        future: [s.present, ...s.future],
      }
    })
  }, [])

  const redo = useCallback(() => {
    setState((s) => {
      if (s.future.length === 0) return s
      const next = s.future[0]
      return {
        past: [...s.past, s.present],
        present: next,
        future: s.future.slice(1),
      }
    })
  }, [])

  const reset = useCallback((value) => {
    setState({ past: [], present: value, future: [] })
  }, [])

  return { value: state.present, set, undo, redo, canUndo, canRedo, reset }
}
