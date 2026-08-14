import { useEffect, useRef } from 'react'

const KEY_ALIASES = {
  cmd: 'meta',
  command: 'meta',
  win: 'meta',
  option: 'alt',
  opt: 'alt',
  escape: 'escape',
  esc: 'escape',
  space: ' ',
  spacebar: ' ',
  up: 'arrowup',
  down: 'arrowdown',
  left: 'arrowleft',
  right: 'arrowright',
  enter: 'enter',
  return: 'enter',
  tab: 'tab',
}

function normalizeKey(key) {
  const k = key.trim().toLowerCase()
  return KEY_ALIASES[k] ?? k
}

function parseHotkey(hotkey) {
  const raw = hotkey.split('+').map((k) => normalizeKey(k))
  return {
    key: raw[raw.length - 1],
    ctrl: raw.includes('ctrl') || raw.includes('control'),
    alt: raw.includes('alt'),
    shift: raw.includes('shift'),
    meta: raw.includes('meta'),
  }
}

function eventMatches(event, combo) {
  if (normalizeKey(event.key) !== combo.key) return false
  if (event.ctrlKey !== combo.ctrl) return false
  if (event.altKey !== combo.alt) return false
  if (event.shiftKey !== combo.shift) return false
  if (event.metaKey !== combo.meta) return false
  return true
}

/**
 * Registers global (or scoped) keyboard shortcuts in React.
 *
 * @param {Array<{ keys: string, callback: (e: KeyboardEvent) => void, preventDefault?: boolean }>} hotkeys
 * @param {{ target?: React.RefObject<HTMLElement>, preventDefault?: boolean, enabled?: boolean }} options
 *
 * @example
 * useHotkeys([
 *   { keys: 'ctrl+k', callback: () => setOpen(true) },
 *   { keys: 'cmd+shift+s', callback: () => saveAll() },
 *   { keys: 'esc', callback: () => setOpen(false), preventDefault: false },
 * ])
 */
export default function useHotkeys(hotkeys, options = {}) {
  const { target, enabled = true } = options
  const hotkeysRef = useRef(hotkeys)

  useEffect(() => {
    hotkeysRef.current = hotkeys
  })

  useEffect(() => {
    if (!enabled) return undefined

    const element = target?.current ?? window

    function handleKeyDown(event) {
      for (const item of hotkeysRef.current) {
        const combo = parseHotkey(item.keys)
        if (eventMatches(event, combo)) {
          if (item.preventDefault !== false) {
            event.preventDefault()
          }
          item.callback(event)
          break
        }
      }
    }

    element.addEventListener('keydown', handleKeyDown)
    return () => element.removeEventListener('keydown', handleKeyDown)
  }, [target, enabled])
}
