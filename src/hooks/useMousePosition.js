import { useEffect, useRef, useState } from 'react'

export default function useMousePosition(ref) {
  const internalRef = useRef(null)
  const targetRef = ref || internalRef
  const [position, setPosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const node = targetRef.current

    const handleMove = (event) => {
      if (node) {
        const rect = node.getBoundingClientRect()
        setPosition({
          x: Math.round(event.clientX - rect.left),
          y: Math.round(event.clientY - rect.top),
        })
      } else {
        setPosition({
          x: event.clientX,
          y: event.clientY,
        })
      }
    }

    window.addEventListener('mousemove', handleMove)

    return () => {
      window.removeEventListener('mousemove', handleMove)
    }
  }, [targetRef])

  return [targetRef, position]
}
