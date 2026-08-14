import { useCallback, useRef } from 'react'

function setRef(ref, value) {
  if (typeof ref === 'function') {
    ref(value)
  } else if (ref != null && typeof ref === 'object') {
    ref.current = value
  }
}

export default function useMergedRef(...refs) {
  const refsRef = useRef(refs)
  refsRef.current = refs

  return useCallback((node) => {
    refsRef.current.forEach((ref) => setRef(ref, node))
  }, [])
}
