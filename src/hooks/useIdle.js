import { useCallback, useEffect, useRef, useState } from 'react'

const DEFAULT_EVENTS = [
  'mousemove',
  'mousedown',
  'keydown',
  'touchstart',
  'wheel',
  'scroll',
]

function now() {
  return typeof Date !== 'undefined' ? Date.now() : 0
}

export default function useIdle(options = {}) {
  const { delay = 5000, events = DEFAULT_EVENTS, initialIdle = false } = options

  const [state, setState] = useState(() => {
    if (typeof document === 'undefined') {
      return { isIdle: initialIdle, timeIdle: 0, lastActive: null }
    }
    return { isIdle: initialIdle, timeIdle: 0, lastActive: now() }
  })

  const timerRef = useRef(null)
  const lastActiveRef = useRef(state.lastActive || now())

  const markIdle = useCallback(() => {
    const t = now()
    lastActiveRef.current = t - delay
    setState({
      isIdle: true,
      timeIdle: delay,
      lastActive: lastActiveRef.current,
    })
  }, [delay])

  const startTimer = useCallback(() => {
    if (typeof window === 'undefined') return
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(markIdle, delay)
  }, [delay, markIdle])

  const handleActivity = useCallback(() => {
    const t = now()
    lastActiveRef.current = t
    setState((prev) =>
      prev.isIdle
        ? { isIdle: false, timeIdle: 0, lastActive: t }
        : { ...prev, isIdle: false, timeIdle: 0, lastActive: t }
    )
    startTimer()
  }, [startTimer])

  const reset = useCallback(() => {
    handleActivity()
  }, [handleActivity])

  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return

    const t = now()
    lastActiveRef.current = t
    setState((prev) => ({ ...prev, lastActive: t }))
    startTimer()

    events.forEach((event) => {
      document.addEventListener(event, handleActivity, { passive: true })
    })

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity, { passive: true })
      })
    }
  }, [events, handleActivity, startTimer])

  return { ...state, reset }
}
