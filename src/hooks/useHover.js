import { useCallback, useState } from 'react'

/**
 * Hook que detecta quando o mouse entra e sai de um elemento.
 * Retorna uma callback ref e um booleano indicando se o cursor está sobre
 * o elemento no momento.
 *
 * @returns {[React.RefCallback<HTMLElement>, boolean]}
 */
export default function useHover() {
  const [isHovered, setIsHovered] = useState(false)

  const onMouseEnter = useCallback(() => setIsHovered(true), [])
  const onMouseLeave = useCallback(() => setIsHovered(false), [])

  const ref = useCallback(
    (node) => {
      if (!node) return

      node.addEventListener('mouseenter', onMouseEnter)
      node.addEventListener('mouseleave', onMouseLeave)

      return () => {
        node.removeEventListener('mouseenter', onMouseEnter)
        node.removeEventListener('mouseleave', onMouseLeave)
      }
    },
    [onMouseEnter, onMouseLeave]
  )

  return [ref, isHovered]
}
