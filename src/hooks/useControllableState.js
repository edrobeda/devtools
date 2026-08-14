import { useCallback, useRef, useState } from 'react'

/**
 * Hook para criar componentes que podem ser usados tanto no modo
 * controlado (valor gerenciado externamente) quanto no modo não controlado
 * (valor gerenciado internamente), como inputs nativos do React.
 *
 * @param {object} options
 * @param {*} options.value - Valor no modo controlado. Se undefined, o
 *   componente passa a ser não controlado.
 * @param {*} options.defaultValue - Valor inicial no modo não controlado.
 * @param {Function} options.onChange - Callback disparado em toda mudança.
 * @returns {[*, Function, boolean]} - [currentValue, setValue, isControlled]
 */
export default function useControllableState({ value, defaultValue, onChange }) {
  const isControlled = value !== undefined
  const [internalValue, setInternalValue] = useState(defaultValue)

  // Mantém os valores mais recentes acessíveis dentro do callback sem
  // recriar a referência de setValue a cada render.
  const stateRef = useRef({
    isControlled,
    value,
    internalValue,
    onChange,
  })

  stateRef.current = { isControlled, value, internalValue, onChange }

  const setValue = useCallback((next) => {
    const { isControlled, value, internalValue, onChange } = stateRef.current
    const currentValue = isControlled ? value : internalValue
    const nextValue = typeof next === 'function'
      ? next(currentValue)
      : next

    if (!isControlled) {
      setInternalValue(nextValue)
    }

    onChange?.(nextValue)
  }, [])

  const currentValue = isControlled ? value : internalValue

  return [currentValue, setValue, isControlled]
}
