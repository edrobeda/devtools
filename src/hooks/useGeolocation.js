import { useEffect, useRef, useState } from 'react'

function readPosition(position) {
  const { latitude, longitude, accuracy, altitude, altitudeAccuracy, heading, speed } = position.coords
  return {
    supported: true,
    loading: false,
    error: null,
    coords: {
      latitude,
      longitude,
      accuracy,
      altitude: altitude ?? null,
      altitudeAccuracy: altitudeAccuracy ?? null,
      heading: heading ?? null,
      speed: speed ?? null,
    },
    timestamp: position.timestamp,
  }
}

function errorState(error) {
  return {
    supported: true,
    loading: false,
    error: {
      code: error.code,
      message: error.message,
      // 1 = PERMISSION_DENIED, 2 = POSITION_UNAVAILABLE, 3 = TIMEOUT
      type: ['permission_denied', 'position_unavailable', 'timeout'][error.code - 1] || 'unknown',
    },
    coords: null,
    timestamp: null,
  }
}

const noopOptions = {}

export default function useGeolocation(options = noopOptions) {
  const [state, setState] = useState(() => ({
    supported: typeof navigator !== 'undefined' && 'geolocation' in navigator,
    loading: false,
    error: null,
    coords: null,
    timestamp: null,
  }))

  // Guarda as opções mais recentes sem recriar o efeito a cada render.
  const optionsRef = useRef(options)
  useEffect(() => {
    optionsRef.current = options
  }, [options])

  useEffect(() => {
    let watchId = null
    let cancelled = false

    if (!('geolocation' in navigator)) {
      setState((s) => ({ ...s, supported: false, loading: false }))
      return
    }

    setState((s) => ({ ...s, loading: true }))

    const handleSuccess = (position) => {
      if (cancelled) return
      setState(readPosition(position))
    }

    const handleError = (error) => {
      if (cancelled) return
      setState(errorState(error))
    }

    watchId = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      optionsRef.current
    )

    return () => {
      cancelled = true
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId)
      }
    }
  }, [])

  return state
}
