import { useCallback, useEffect, useState } from 'react'

export default function useWindowFocus() {
  const [focused, setFocused] = useState(() => {
    if (typeof document === 'undefined') return false
    return document.hasFocus()
  })

  const handleFocus = useCallback(() => setFocused(true), [])
  const handleBlur = useCallback(() => setFocused(false), [])

  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return

    setFocused(document.hasFocus())
    window.addEventListener('focus', handleFocus)
    window.addEventListener('blur', handleBlur)

    return () => {
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('blur', handleBlur)
    }
  }, [handleFocus, handleBlur])

  return focused
}
