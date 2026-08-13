import { useEffect, useRef } from 'react'

/**
 * Like React's useEffect, but skips the first render (mount).
 * Useful when you only want to react to prop/state *updates*, not
 * the initial mount.
 */
export default function useUpdateEffect(effect, deps) {
  const mounted = useRef(false)

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true
      return undefined
    }

    return effect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}
