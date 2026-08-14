import { useEffect, useRef } from 'react'

export default function useBeforeUnload(enabled, message = '') {
  const enabledRef = useRef(enabled)

  useEffect(() => {
    enabledRef.current = enabled
  }, [enabled])

  useEffect(() => {
    const isBrowser = typeof window !== 'undefined'
    if (!isBrowser) return

    const handler = (event) => {
      const isEnabled = typeof enabledRef.current === 'function'
        ? enabledRef.current()
        : enabledRef.current

      if (!isEnabled) return

      event.preventDefault()
      // Navegadores modernos ignoram a mensagem customizada, mas ainda
      // exigem returnValue (ou o retorno da função) para mostrar o diálogo.
      if (message) {
        event.returnValue = message
      }
      return message
    }

    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [message])
}
