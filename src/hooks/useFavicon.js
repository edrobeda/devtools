import { useCallback, useEffect, useRef } from 'react'

function getIconLink() {
  return (
    document.querySelector("link[rel='shortcut icon']") ||
    document.querySelector("link[rel='icon']") ||
    null
  )
}

function createIconLink() {
  const link = document.createElement('link')
  link.rel = 'icon'
  link.type = 'image/png'
  document.head.appendChild(link)
  return link
}

function renderEmojiFavicon(emoji, options = {}) {
  const size = options.size || 64
  const bgColor = options.bgColor || 'transparent'
  const color = options.color || '#000000'

  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size

  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  if (bgColor !== 'transparent') {
    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, size, size)
  }

  ctx.font = `${Math.round(size * 0.75)}px serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = color
  ctx.fillText(emoji, size / 2, size / 2 + size * 0.05)

  return canvas.toDataURL('image/png')
}

function resolveHref(href, options) {
  if (typeof href !== 'string') return null
  const trimmed = href.trim()
  if (!trimmed) return null

  if (trimmed.startsWith('emoji:')) {
    const emoji = trimmed.slice(6).trim() || '⭐'
    return renderEmojiFavicon(emoji, options)
  }

  return trimmed
}

export default function useFavicon(initialHref, options = {}) {
  const originalHrefRef = useRef(null)
  const optionsRef = useRef(options)
  optionsRef.current = options

  const setFavicon = useCallback((href) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return

    const resolved = resolveHref(href, optionsRef.current)
    if (!resolved) return

    let link = getIconLink()
    if (!link) {
      link = createIconLink()
    }
    link.href = resolved
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return undefined

    const link = getIconLink()
    originalHrefRef.current = link?.href || ''

    if (initialHref) {
      setFavicon(initialHref)
    }

    return () => {
      const current = getIconLink()
      if (!current) return
      if (originalHrefRef.current) {
        current.href = originalHrefRef.current
      } else {
        current.remove()
      }
    }
  }, [initialHref, setFavicon])

  return setFavicon
}
