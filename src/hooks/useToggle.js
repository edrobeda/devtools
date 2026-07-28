import { useCallback, useState } from 'react'

export default function useToggle(initialValue = false) {
  const [value, setValue] = useState(initialValue)

  const toggle = useCallback((next) => {
    setValue((current) => (typeof next === 'boolean' ? next : !current))
  }, [])

  return [value, toggle]
}
