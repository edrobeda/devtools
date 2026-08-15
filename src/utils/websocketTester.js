/**
 * WebSocket Tester helpers
 *
 * Funções utilitárias 100% client-side para o testador de WebSocket.
 * Nenhuma mensagem sai do navegador além da conexão WebSocket escolhida
 * pelo próprio usuário.
 */

export const READY_STATES = {
  0: { label: 'CONNECTING', color: 'orange' },
  1: { label: 'OPEN', color: 'green' },
  2: { label: 'CLOSING', color: 'gold' },
  3: { label: 'CLOSED', color: 'red' },
}

export const DEFAULT_ECHO_URL = 'wss://echo.websocket.org/'

export function getReadyState(ws) {
  if (!ws) return { label: 'DISCONNECTED', color: 'default' }
  return READY_STATES[ws.readyState] || { label: 'UNKNOWN', color: 'default' }
}

export function formatBytes(text) {
  if (text === null || text === undefined) return 0
  return new Blob([String(text)]).size
}

export function truncate(text, max = 500) {
  const str = String(text)
  if (str.length <= max) return str
  return str.slice(0, max) + '…'
}

export function tryFormatPayload(payload) {
  const str = String(payload)
  try {
    const parsed = JSON.parse(str)
    return JSON.stringify(parsed, null, 2)
  } catch {
    return str
  }
}

export function buildMessageRecord(payload, direction, type = 'text') {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    time: Date.now(),
    direction, // 'out' | 'in' | 'system'
    type, // 'text' | 'binary' | 'system'
    payload,
    bytes: formatBytes(payload),
  }
}
