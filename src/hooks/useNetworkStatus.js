import { useCallback, useEffect, useState } from 'react'

function getConnection() {
  return navigator.connection || navigator.mozConnection || navigator.webkitConnection
}

function getNetworkInfo() {
  const conn = typeof navigator !== 'undefined' ? getConnection() : null
  return {
    online: typeof navigator !== 'undefined' ? navigator.onLine : true,
    effectiveType: conn?.effectiveType,
    downlink: conn?.downlink,
    rtt: conn?.rtt,
    saveData: conn?.saveData,
  }
}

export default function useNetworkStatus() {
  const [status, setStatus] = useState(getNetworkInfo)

  const update = useCallback(() => {
    setStatus(getNetworkInfo())
  }, [])

  useEffect(() => {
    window.addEventListener('online', update)
    window.addEventListener('offline', update)

    const conn = getConnection()
    if (conn) {
      conn.addEventListener('change', update)
    }

    return () => {
      window.removeEventListener('online', update)
      window.removeEventListener('offline', update)
      if (conn) {
        conn.removeEventListener('change', update)
      }
    }
  }, [update])

  return status
}
