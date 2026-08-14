import { useCallback, useEffect, useRef, useState } from 'react'

const EASINGS = {
  linear: (t) => t,
  easeInQuad: (t) => t * t,
  easeOutQuad: (t) => t * (2 - t),
  easeInOutQuad: (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  easeInCubic: (t) => t * t * t,
  easeOutCubic: (t) => --t * t * t + 1,
  easeInOutCubic: (t) =>
    t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
}

export function getEasing(name) {
  return EASINGS[name] || EASINGS.linear
}

export function formatCountUp(
  value,
  { decimals = 0, separator = '', prefix = '', suffix = '' } = {}
) {
  const fixed = Number(value).toFixed(Math.max(0, Math.min(20, decimals)))
  const [intPart, decPart] = fixed.split('.')
  const formattedInt = separator
    ? intPart.replace(/\B(?=(\d{3})+(?!\d))/g, separator)
    : intPart
  return `${prefix}${formattedInt}${decPart ? `.${decPart}` : ''}${suffix}`
}

export default function useCountUp(end, options = {}) {
  const {
    start: startValue = 0,
    duration = 2000,
    delay = 0,
    easing = 'linear',
    decimals = 0,
    separator = '',
    prefix = '',
    suffix = '',
    startOnMount = true,
    onStart,
    onUpdate,
    onComplete,
    onReset,
  } = options

  const [value, setValue] = useState(startValue)
  const [isRunning, setIsRunning] = useState(false)

  const rafRef = useRef(null)
  const delayTimeoutRef = useRef(null)
  const startTimeRef = useRef(null)
  const elapsedBeforePauseRef = useRef(0)

  const onStartRef = useRef(onStart)
  const onUpdateRef = useRef(onUpdate)
  const onCompleteRef = useRef(onComplete)
  const onResetRef = useRef(onReset)

  useEffect(() => {
    onStartRef.current = onStart
  }, [onStart])
  useEffect(() => {
    onUpdateRef.current = onUpdate
  }, [onUpdate])
  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])
  useEffect(() => {
    onResetRef.current = onReset
  }, [onReset])

  const clearTimers = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    if (delayTimeoutRef.current) {
      clearTimeout(delayTimeoutRef.current)
      delayTimeoutRef.current = null
    }
  }, [])

  const tick = useCallback(
    (timestamp) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp - elapsedBeforePauseRef.current
      }

      const elapsed = timestamp - startTimeRef.current
      const progress = Math.min(elapsed / duration, 1)
      const eased = getEasing(easing)(progress)
      const current = startValue + (end - startValue) * eased

      setValue(current)
      onUpdateRef.current?.(current)

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        setIsRunning(false)
        setValue(end)
        onCompleteRef.current?.(end)
      }
    },
    [startValue, end, duration, easing]
  )

  const start = useCallback(() => {
    clearTimers()
    elapsedBeforePauseRef.current = 0
    startTimeRef.current = null
    setValue(startValue)
    setIsRunning(true)
    onStartRef.current?.()

    if (delay > 0) {
      delayTimeoutRef.current = setTimeout(() => {
        rafRef.current = requestAnimationFrame(tick)
      }, delay)
    } else {
      rafRef.current = requestAnimationFrame(tick)
    }
  }, [clearTimers, delay, startValue, tick])

  const pause = useCallback(() => {
    clearTimers()
    if (startTimeRef.current !== null) {
      elapsedBeforePauseRef.current = performance.now() - startTimeRef.current
    }
    setIsRunning(false)
  }, [clearTimers])

  const resume = useCallback(() => {
    if (isRunning) return
    clearTimers()
    setIsRunning(true)
    startTimeRef.current = null
    rafRef.current = requestAnimationFrame(tick)
  }, [isRunning, clearTimers, tick])

  const reset = useCallback(() => {
    clearTimers()
    elapsedBeforePauseRef.current = 0
    startTimeRef.current = null
    setIsRunning(false)
    setValue(startValue)
    onResetRef.current?.(startValue)
  }, [clearTimers, startValue])

  useEffect(() => {
    if (startOnMount) {
      start()
    }
    return () => clearTimers()
  }, [])

  return {
    value,
    formatted: formatCountUp(value, { decimals, separator, prefix, suffix }),
    isRunning,
    start,
    pause,
    resume,
    reset,
  }
}
