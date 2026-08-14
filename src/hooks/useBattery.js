import { useEffect, useState } from 'react'

function readBattery(battery) {
  return {
    supported: true,
    loading: false,
    level: battery.level,
    charging: battery.charging,
    chargingTime: battery.chargingTime,
    dischargingTime: battery.dischargingTime,
  }
}

export default function useBattery() {
  const [state, setState] = useState(() => ({
    supported: typeof navigator !== 'undefined' && 'getBattery' in navigator,
    loading: typeof navigator !== 'undefined' && 'getBattery' in navigator,
    level: null,
    charging: null,
    chargingTime: null,
    dischargingTime: null,
  }))

  useEffect(() => {
    let battery = null
    let removed = false

    if (!('getBattery' in navigator)) {
      setState((s) => ({ ...s, loading: false }))
      return
    }

    const update = () => {
      if (!battery) return
      setState(readBattery(battery))
    }

    navigator.getBattery().then((bat) => {
      if (removed) return
      battery = bat
      update()
      battery.addEventListener('levelchange', update)
      battery.addEventListener('chargingchange', update)
      battery.addEventListener('chargingtimechange', update)
      battery.addEventListener('dischargingtimechange', update)
    })

    return () => {
      removed = true
      if (!battery) return
      battery.removeEventListener('levelchange', update)
      battery.removeEventListener('chargingchange', update)
      battery.removeEventListener('chargingtimechange', update)
      battery.removeEventListener('dischargingtimechange', update)
    }
  }, [])

  return state
}
