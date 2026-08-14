import { useEffect, useState } from 'react'

function getPreferredColorScheme() {
  if (typeof window === 'undefined') return 'no-preference'
  const darkQuery = window.matchMedia('(prefers-color-scheme: dark)')
  const lightQuery = window.matchMedia('(prefers-color-scheme: light)')
  if (darkQuery.matches) return 'dark'
  if (lightQuery.matches) return 'light'
  return 'no-preference'
}

export default function usePreferredColorScheme() {
  const [scheme, setScheme] = useState(getPreferredColorScheme)

  useEffect(() => {
    const darkQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const lightQuery = window.matchMedia('(prefers-color-scheme: light)')

    const handler = () => setScheme(getPreferredColorScheme())

    darkQuery.addEventListener('change', handler)
    lightQuery.addEventListener('change', handler)

    return () => {
      darkQuery.removeEventListener('change', handler)
      lightQuery.removeEventListener('change', handler)
    }
  }, [])

  return scheme
}
