import { useCallback, useEffect, useState } from 'react'
import useInterval from './useInterval'

export default function useCountdown(initialSeconds = 60) {
  const [duration, setDuration] = useState(Math.max(0, Math.floor(initialSeconds)))
  const [secondsLeft, setSecondsLeft] = useState(duration)
  const [isRunning, setIsRunning] = useState(false)

  const start = useCallback(() => setIsRunning(true), [])
  const pause = useCallback(() => setIsRunning(false), [])
  const reset = useCallback(() => {
    setIsRunning(false)
    setSecondsLeft(duration)
  }, [duration])

  const restart = useCallback(
    (newDuration) => {
      const next = Math.max(0, Math.floor(newDuration ?? duration))
      setDuration(next)
      setSecondsLeft(next)
      setIsRunning(false)
    },
    [duration]
  )

  useInterval(
    () => setSecondsLeft((s) => Math.max(0, s - 1)),
    isRunning && secondsLeft > 0 ? 1000 : null
  )

  useEffect(() => {
    if (secondsLeft === 0) {
      setIsRunning(false)
    }
  }, [secondsLeft])

  const progress = duration > 0 ? 1 - secondsLeft / duration : 0

  return {
    secondsLeft,
    duration,
    isRunning,
    progress,
    start,
    pause,
    reset,
    restart,
  }
}

export function formatTime(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds))
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}
