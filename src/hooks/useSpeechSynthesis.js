import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

function getSynth() {
  return typeof window !== 'undefined' && window.speechSynthesis
    ? window.speechSynthesis
    : null
}

function isSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

export default function useSpeechSynthesis() {
  const synth = useRef(getSynth())
  const utteranceRef = useRef(null)

  const [voices, setVoices] = useState(() => (isSupported() ? synth.current.getVoices() : []))
  const [selectedVoiceURI, setSelectedVoiceURI] = useState('')
  const [rate, setRate] = useState(1)
  const [pitch, setPitch] = useState(1)
  const [volume, setVolume] = useState(1)
  const [status, setStatus] = useState({
    speaking: false,
    paused: false,
    pending: false,
  })

  const selectedVoice = useMemo(
    () => voices.find((v) => v.voiceURI === selectedVoiceURI) || voices[0] || null,
    [voices, selectedVoiceURI]
  )

  const refreshVoices = useCallback(() => {
    if (!synth.current) return
    const next = synth.current.getVoices()
    setVoices(next)
    if (!selectedVoiceURI && next.length > 0) {
      const defaultVoice = next.find((v) => v.default) || next[0]
      setSelectedVoiceURI(defaultVoice.voiceURI)
    }
  }, [selectedVoiceURI])

  useEffect(() => {
    if (!synth.current) return
    refreshVoices()
    if (synth.current.onvoiceschanged !== undefined) {
      synth.current.onvoiceschanged = refreshVoices
    }
    return () => {
      if (synth.current && synth.current.onvoiceschanged !== undefined) {
        synth.current.onvoiceschanged = null
      }
    }
  }, [refreshVoices])

  const updateStatus = useCallback(() => {
    if (!synth.current) return
    setStatus({
      speaking: synth.current.speaking,
      paused: synth.current.paused,
      pending: synth.current.pending,
    })
  }, [])

  const cancel = useCallback(() => {
    if (!synth.current) return
    synth.current.cancel()
    updateStatus()
  }, [updateStatus])

  const pause = useCallback(() => {
    if (!synth.current) return
    synth.current.pause()
    updateStatus()
  }, [updateStatus])

  const resume = useCallback(() => {
    if (!synth.current) return
    synth.current.resume()
    updateStatus()
  }, [updateStatus])

  const speak = useCallback(
    (text, options = {}) => {
      if (!synth.current || !text) return

      synth.current.cancel()

      const utter = new SpeechSynthesisUtterance(text)
      utter.rate = options.rate ?? rate
      utter.pitch = options.pitch ?? pitch
      utter.volume = options.volume ?? volume

      const voice = options.voice || selectedVoice
      if (voice) utter.voice = voice

      utter.onstart = () => updateStatus()
      utter.onend = () => updateStatus()
      utter.onpause = () => updateStatus()
      utter.onresume = () => updateStatus()
      utter.onerror = () => updateStatus()
      utter.onboundary = () => updateStatus()

      utteranceRef.current = utter
      synth.current.speak(utter)
      updateStatus()
    },
    [pitch, rate, selectedVoice, updateStatus, volume]
  )

  useEffect(() => {
    return () => {
      if (synth.current) {
        synth.current.cancel()
      }
    }
  }, [])

  return {
    supported: isSupported(),
    voices,
    selectedVoice,
    selectedVoiceURI,
    setVoice: setSelectedVoiceURI,
    rate,
    setRate,
    pitch,
    setPitch,
    volume,
    setVolume,
    speaking: status.speaking,
    paused: status.paused,
    pending: status.pending,
    speak,
    cancel,
    pause,
    resume,
  }
}
