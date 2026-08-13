import { useCallback, useRef, useState } from 'react'

/**
 * Hook que detecta um pressionamento longo (long press) em um elemento,
 * funcionando tanto com mouse quanto com touch.
 *
 * @param {object} options
 * @param {number} [options.threshold=500] - Tempo mínimo em ms para considerar long press.
 * @param {(event?: Event) => void} [options.onLongPress] - Chamado quando o long press é confirmado.
 * @param {(event?: Event) => void} [options.onPressStart] - Chamado no início do pressionamento.
 * @param {(event?: Event) => void} [options.onPressEnd] - Chamado ao final de qualquer pressionamento.
 * @param {(event?: Event) => void} [options.onCancel] - Chamado quando o pressionamento termina antes do threshold.
 * @returns {[React.RefCallback<HTMLElement>, boolean, boolean]} - [ref, isPressed, wasLongPress]
 */
export default function useLongPress(options = {}) {
  const [isPressed, setIsPressed] = useState(false)
  const [wasLongPress, setWasLongPress] = useState(false)
  const timerRef = useRef(null)
  const triggeredRef = useRef(false)
  const optionsRef = useRef(options)
  optionsRef.current = options

  const start = useCallback((e) => {
    const { threshold = 500, onPressStart } = optionsRef.current
    setIsPressed(true)
    setWasLongPress(false)
    triggeredRef.current = false
    onPressStart?.(e)

    timerRef.current = window.setTimeout(() => {
      triggeredRef.current = true
      setWasLongPress(true)
      optionsRef.current.onLongPress?.(e)
    }, threshold)
  }, [])

  const cancel = useCallback((e) => {
    const { onPressEnd, onCancel } = optionsRef.current
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    setIsPressed(false)
    onPressEnd?.(e)
    if (!triggeredRef.current) {
      onCancel?.(e)
    }
    triggeredRef.current = false
  }, [])

  const ref = useCallback((node) => {
    if (!node) return

    node.addEventListener('mousedown', start)
    node.addEventListener('touchstart', start, { passive: true })
    node.addEventListener('mouseup', cancel)
    node.addEventListener('mouseleave', cancel)
    node.addEventListener('touchend', cancel)

    return () => {
      node.removeEventListener('mousedown', start)
      node.removeEventListener('touchstart', start)
      node.removeEventListener('mouseup', cancel)
      node.removeEventListener('mouseleave', cancel)
      node.removeEventListener('touchend', cancel)
    }
  }, [start, cancel])

  return [ref, isPressed, wasLongPress]
}
