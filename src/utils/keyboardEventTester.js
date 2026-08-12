/**
 * Motor do Testador de Eventos de Teclado.
 * Tudo roda no cliente — nenhuma chamada de rede.
 */

export const LOCATION_LABELS = {
  pt: ['Padrão', 'Esquerda', 'Direita', 'Teclado numérico'],
  en: ['Standard', 'Left', 'Right', 'Numpad'],
}

export function getLocationLabel(location, lang = 'en') {
  const labels = LOCATION_LABELS[lang] || LOCATION_LABELS.en
  return labels[location] ?? `location:${location}`
}

export function escapeKey(key) {
  if (key === "'") return "\\'"
  if (key === '\\') return '\\\\'
  if (key === '\n') return '\\n'
  if (key === '\t') return '\\t'
  if (key === '\r') return '\\r'
  return key
}

export function buildEventSnippet(event) {
  if (!event) return ''
  const key = escapeKey(event.key)
  return `document.addEventListener('keydown', (event) => {
  if (event.key === '${key}' && event.code === '${event.code}') {
    event.preventDefault();
    // your code here
  }
});`
}

export function formatEvent(event) {
  return {
    id: `${event.code}-${event.timeStamp}`,
    key: event.key,
    code: event.code,
    keyCode: event.keyCode,
    which: event.which,
    location: event.location,
    ctrlKey: event.ctrlKey,
    altKey: event.altKey,
    shiftKey: event.shiftKey,
    metaKey: event.metaKey,
    repeat: event.repeat,
    composed: event.composed,
    timestamp: Date.now(),
  }
}

export function keyDisplayName(key) {
  if (key === ' ') return 'Space'
  if (key === '\n') return 'Enter'
  if (key === '\t') return 'Tab'
  if (key === '\r') return 'Return'
  if (key.length === 0) return '(empty)'
  return key
}
