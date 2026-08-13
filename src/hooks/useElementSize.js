import { useEffect, useRef, useState } from 'react'

export default function useElementSize() {
  const ref = useRef(null)
  const [size, setSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const node = ref.current
    if (!node) return undefined

    const update = () => {
      const rect = node.getBoundingClientRect()
      setSize({
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      })
    }

    update()

    let observer = null
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver((entries) => {
        const entry = entries[0]
        if (entry?.contentRect) {
          const { width, height } = entry.contentRect
          setSize({
            width: Math.round(width),
            height: Math.round(height),
          })
        } else {
          update()
        }
      })
      observer.observe(node)
    } else {
      window.addEventListener('resize', update)
    }

    return () => {
      if (observer) {
        observer.disconnect()
      } else {
        window.removeEventListener('resize', update)
      }
    }
  }, [])

  return [ref, size]
}
