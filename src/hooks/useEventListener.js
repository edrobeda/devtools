import { useEffect, useRef } from 'react'

export default function useEventListener(eventName, handler, target) {
  const savedHandler = useRef(handler)

  useEffect(() => {
    savedHandler.current = handler
  }, [handler])

  useEffect(() => {
    const node = target?.current ?? target ?? window
    if (!node?.addEventListener) return undefined

    const listener = (event) => savedHandler.current(event)
    node.addEventListener(eventName, listener)
    return () => node.removeEventListener(eventName, listener)
  }, [eventName, target])
}
