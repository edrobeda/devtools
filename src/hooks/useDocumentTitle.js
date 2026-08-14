import { useCallback, useEffect, useRef } from 'react'

export default function useDocumentTitle(initialTitle) {
  const originalTitleRef = useRef('')

  const setTitle = useCallback((title) => {
    if (typeof document === 'undefined') return
    document.title = title
  }, [])

  useEffect(() => {
    if (typeof document === 'undefined') return undefined

    originalTitleRef.current = document.title

    if (initialTitle) {
      setTitle(initialTitle)
    }

    return () => {
      if (originalTitleRef.current) {
        document.title = originalTitleRef.current
      }
    }
  }, [initialTitle, setTitle])

  return setTitle
}

// uso:
// const setTitle = useDocumentTitle('Página inicial')
// setTitle('Nova aba')
