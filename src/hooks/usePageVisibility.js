import { useEffect, useState } from 'react'

function getVisible() {
  if (typeof document === 'undefined') return true
  return !document.hidden
}

export default function usePageVisibility() {
  const [visible, setVisible] = useState(getVisible)

  useEffect(() => {
    const handle = () => setVisible(getVisible())
    document.addEventListener('visibilitychange', handle)
    return () => document.removeEventListener('visibilitychange', handle)
  }, [])

  return visible
}
