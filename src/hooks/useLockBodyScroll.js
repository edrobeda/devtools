import { useCallback, useEffect, useRef } from 'react'

function getScrollbarWidth() {
  return window.innerWidth - document.documentElement.clientWidth
}

export default function useLockBodyScroll() {
  const originalStylesRef = useRef(null)

  const lock = useCallback(() => {
    if (originalStylesRef.current !== null) return

    const scrollbarWidth = getScrollbarWidth()
    const { overflow, paddingRight } = document.body.style

    originalStylesRef.current = { overflow, paddingRight }

    document.body.style.overflow = 'hidden'
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`
    }
  }, [])

  const unlock = useCallback(() => {
    if (originalStylesRef.current === null) return

    const { overflow, paddingRight } = originalStylesRef.current
    document.body.style.overflow = overflow
    document.body.style.paddingRight = paddingRight

    originalStylesRef.current = null
  }, [])

  useEffect(() => {
    return () => {
      // Garante que o scroll seja restaurado se o componente desmontar
      // enquanto o body ainda estiver bloqueado.
      if (originalStylesRef.current !== null) {
        unlock()
      }
    }
  }, [unlock])

  return { lock, unlock }
}
