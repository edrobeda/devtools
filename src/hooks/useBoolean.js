import { useCallback, useState } from 'react'

export default function useBoolean(initialValue = false) {
  const [value, setValue] = useState(!!initialValue)

  const setTrue = useCallback(() => setValue(true), [])
  const setFalse = useCallback(() => setValue(false), [])
  const toggle = useCallback(() => setValue((v) => !v), [])
  const reset = useCallback(() => setValue(!!initialValue), [initialValue])

  return { value, setValue, setTrue, setFalse, toggle, reset }
}
