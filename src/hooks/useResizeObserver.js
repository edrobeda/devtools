import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Hook React que encapsula a ResizeObserver API.
 *
 * Retorna uma callback ref e o último ResizeObserverEntry capturado para o
 * elemento referenciado. Também aceita um callback `onResize` opcional que
 * recebe o array de entries toda vez que o tamanho mudar.
 *
 * Uso:
 *   const [ref, entry] = useResizeObserver({ box: 'content-box' })
 *
 *   return (
 *     <div ref={ref}>
 *       {entry?.contentRect.width.toFixed(0)} x {entry?.contentRect.height.toFixed(0)}
 *     </div>
 *   )
 */
export default function useResizeObserver(options = {}, onResize) {
  const [entry, setEntry] = useState(null)
  const observerRef = useRef(null)
  const nodeRef = useRef(null)
  const optionsRef = useRef(options)
  const onResizeRef = useRef(onResize)

  // Mantém o callback mais recente sem recriar o observer.
  useEffect(() => {
    onResizeRef.current = onResize
  }, [onResize])

  const connect = useCallback((node) => {
    if (
      typeof window === 'undefined' ||
      typeof ResizeObserver === 'undefined' ||
      !node
    ) {
      return
    }

    if (observerRef.current) {
      observerRef.current.disconnect()
      observerRef.current = null
    }

    observerRef.current = new ResizeObserver((entries) => {
      const last = entries[entries.length - 1] || null
      setEntry(last)
      if (typeof onResizeRef.current === 'function') {
        onResizeRef.current(entries)
      }
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
  // As opções do ResizeObserver só contêm valores serializáveis,
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

  return [ref, entry]
}
