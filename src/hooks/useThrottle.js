import { useEffect, useRef, useState } from 'react'

export default function useThrottle(value, limitMs = 300) {
  const [throttled, setThrottled] = useState(value)
  const lastRan = useRef(Date.now())

  useEffect(() => {
    const remaining = limitMs - (Date.now() - lastRan.current)
    const handler = setTimeout(() => {
      setThrottled(value)
      lastRan.current = Date.now()
    }, Math.max(remaining, 0))

    return () => clearTimeout(handler)
  }, [value, limitMs])

  return throttled
}
