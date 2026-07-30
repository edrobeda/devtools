import { useEffect, useState } from 'react'

export default function useKeyPress(targetKey) {
  const [isPressed, setIsPressed] = useState(false)

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === targetKey) setIsPressed(true)
    }
    function handleKeyUp(e) {
      if (e.key === targetKey) setIsPressed(false)
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [targetKey])

  return isPressed
}
