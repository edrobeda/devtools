import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Hook React que encapsula a MutationObserver API.
 *
 * Retorna uma callback ref e o array de mutações observadas no elemento
 * referenciado. Também expõe uma função `clear` para limpar o histórico.
 *
 * Uso:
 *   const [ref, records, clear] = useMutationObserver({
 *     childList: true,
 *     attributes: true,
 *     subtree: false,
 *   })
 *
 *   return <div ref={ref}>{records.length} mutações</div>
 */
export default function useMutationObserver(options = {}) {
  const [records, setRecords] = useState([])
  const observerRef = useRef(null)
  const nodeRef = useRef(null)
  const optionsRef = useRef(options)

  const connect = useCallback((node) => {
    if (
      typeof window === 'undefined' ||
      typeof MutationObserver === 'undefined' ||
      !node
    ) {
      return
    }

    if (observerRef.current) {
      observerRef.current.disconnect()
      observerRef.current = null
    }

    observerRef.current = new MutationObserver((mutations) => {
      const stamped = mutations.map((m) => ({
        ...m,
        timeStamp: Date.now(),
      }))
      setRecords((prev) => [...stamped, ...prev].slice(0, 100))
    })

    observerRef.current.observe(node, optionsRef.current)
    nodeRef.current = node
  }, [])

  const ref = useCallback(
    (node) => {
      connect(node)
    },
    [connect]
  )

  // Atualiza as opções em tempo real e reconecta ao alvo atual.
  // As opções do MutationObserver só contêm valores serializáveis,
  // então JSON.stringify é uma dependência estável e segura aqui.
  useEffect(() => {
    optionsRef.current = options
    if (nodeRef.current) {
      connect(nodeRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(options), connect])

  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
        observerRef.current = null
      }
    }
  }, [])

  const clear = useCallback(() => setRecords([]), [])

  return [ref, records, clear]
}
