import { useCallback, useRef } from 'react'

/**
 * Retorna uma callback com referência estável que sempre executa a versão
 * mais recente da função passada. Útil para passar handlers para componentes
 * filhos memoizados sem quebrar a memoização nem precisar declarar arrays de
 * dependência extensos com useCallback.
 *
 * @template {(...args: any[]) => any} T
 * @param {T} callback
 * @returns {T}
 */
export default function useStableCallback(callback) {
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  return useCallback((...args) => callbackRef.current(...args), [])
}
