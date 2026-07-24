import { useEffect, useState } from 'react'

export default function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches)

  useEffect(() => {
    const mediaQueryList = window.matchMedia(query)
    const listener = (event) => setMatches(event.matches)

    mediaQueryList.addEventListener('change', listener)
    setMatches(mediaQueryList.matches)

    return () => mediaQueryList.removeEventListener('change', listener)
  }, [query])

  return matches
}
