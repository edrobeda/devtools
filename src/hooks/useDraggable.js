import { useCallback, useEffect, useRef, useState } from 'react'

const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

/**
 * Hook que torna um elemento arrastável usando Pointer Events — um único
 * conjunto de eventos pra mouse, touch e caneta, sem duplicar lógica de
 * mousemove/touchmove.
 *
 * A posição é aplicada como `translate3d` a partir do layout original do
 * elemento: mover o item não altera `top`/`left` nem empurra os vizinhos.
 *
 * @param {object} [options]
 * @param {'both'|'x'|'y'} [options.axis='both'] - Eixos em que o arrasto vale.
 * @param {React.RefObject<HTMLElement>} [options.boundsRef] - Container que
 *   limita o arrasto (medido uma única vez no pointerdown). `null` = livre.
 * @param {number} [options.grid=0] - Passo de snap em px (0 = desligado).
 * @param {{x: number, y: number}} [options.initial] - Posição inicial do translate.
 * @param {boolean} [options.disabled=false] - Ignora o pointerdown.
 * @param {(info: {x: number, y: number, event: PointerEvent}) => void} [options.onDragStart]
 * @param {(info: {x: number, y: number, event: PointerEvent}) => void} [options.onDrag]
 * @param {(info: {x: number, y: number, cancelled: boolean, event: PointerEvent|null}) => void} [options.onDragEnd]
 * @returns {{ref: React.RefCallback<HTMLElement>, x: number, y: number,
 *   isDragging: boolean, setPosition: (p: {x: number, y: number}) => void}}
 */
export default function useDraggable(options = {}) {
  const [position, setPositionState] = useState(() => ({
    x: options.initial?.x ?? 0,
    y: options.initial?.y ?? 0,
  }))
  const [isDragging, setIsDragging] = useState(false)

  // As opções mudam a cada render (controles da UI), mas os handlers de
  // pointer nascem uma vez só — optionsRef mantém tudo sempre atualizado
  // sem precisar desinscrever/inscrever listener a cada render.
  const optionsRef = useRef(options)
  optionsRef.current = options

  // Espelho síncrono de `position`: os handlers leem a posição atual direto
  // daqui, nunca do closure da renderização em que foram criados.
  const positionRef = useRef(position)
  const nodeRef = useRef(null)
  const dragRef = useRef(null)
  const listenersRef = useRef(null)
  const touchActionRef = useRef('')

  const setPosition = useCallback((next) => {
    const value = { x: next?.x ?? 0, y: next?.y ?? 0 }
    positionRef.current = value
    setPositionState(value)
  }, [])

  const removeWindowListeners = useCallback(() => {
    const listeners = listenersRef.current
    if (!listeners) return
    window.removeEventListener('pointermove', listeners.move)
    window.removeEventListener('pointerup', listeners.up)
    window.removeEventListener('pointercancel', listeners.up)
    listenersRef.current = null
  }, [])

  const handleMove = useCallback((event) => {
    const drag = dragRef.current
    if (!drag || event.pointerId !== drag.pointerId) return

    const opts = optionsRef.current
    const axis = opts.axis ?? 'both'

    let x = drag.startX + (event.clientX - drag.startClientX)
    let y = drag.startY + (event.clientY - drag.startClientY)

    if (axis === 'x') y = drag.startY
    else if (axis === 'y') x = drag.startX

    x = clamp(x, drag.minX, drag.maxX)
    y = clamp(y, drag.minY, drag.maxY)

    const grid = opts.grid || 0
    if (grid > 0) {
      x = clamp(Math.round(x / grid) * grid, drag.minX, drag.maxX)
      y = clamp(Math.round(y / grid) * grid, drag.minY, drag.maxY)
    }

    // Estado só muda quando a posição realmente muda: arrastar sem andar
    // (ou soltar no mesmo pixel) não dispara render desnecessário.
    if (x === positionRef.current.x && y === positionRef.current.y) return
    positionRef.current = { x, y }
    setPositionState(positionRef.current)
    opts.onDrag?.({ x, y, event })
  }, [])

  const endDrag = useCallback((event, cancelled) => {
    const drag = dragRef.current
    if (!drag) return
    if (event && event.pointerId !== drag.pointerId) return
    dragRef.current = null
    removeWindowListeners()

    const node = nodeRef.current
    if (node && event) {
      try {
        node.releasePointerCapture(drag.pointerId)
      } catch {
        // o navegador já soltou a captura (ex.: pointercancel)
      }
    }

    setIsDragging(false)
    const opts = optionsRef.current
    const { x, y } = positionRef.current
    opts.onDragEnd?.({ x, y, cancelled, event: event ?? null })
  }, [removeWindowListeners])

  const handleDown = useCallback((event) => {
    const opts = optionsRef.current
    if (opts.disabled) return
    if (dragRef.current) return // já arrastando (segundo dedo / clique duplo)
    if (event.button !== undefined && event.button !== 0) return

    const node = event.currentTarget
    const boundsEl = opts.boundsRef?.current ?? null
    const rect = node.getBoundingClientRect()
    // Limites usam a área de conteúdo do container (fora da borda), não o
    // border box: assim o elemento arrastado nunca para em cima da borda do
    // próprio container.
    let boundsRect = null
    if (boundsEl) {
      const containerRect = boundsEl.getBoundingClientRect()
      const left = containerRect.left + boundsEl.clientLeft
      const top = containerRect.top + boundsEl.clientTop
      boundsRect = {
        left,
        top,
        right: left + boundsEl.clientWidth,
        bottom: top + boundsEl.clientHeight,
      }
    }

    const startX = positionRef.current.x
    const startY = positionRef.current.y

    // Limites calculados uma única vez, no momento do pointerdown: o rect
    // medido já inclui o translate atual, então o intervalo válido é
    // startX + (borda do container − borda do elemento).
    dragRef.current = {
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startX,
      startY,
      minX: boundsRect ? startX + (boundsRect.left - rect.left) : -Infinity,
      maxX: boundsRect ? startX + (boundsRect.right - rect.right) : Infinity,
      minY: boundsRect ? startY + (boundsRect.top - rect.top) : -Infinity,
      maxY: boundsRect ? startY + (boundsRect.bottom - rect.bottom) : Infinity,
    }

    try {
      node.setPointerCapture(event.pointerId)
    } catch {
      // pointer já inativo — os listeners da janela ainda dão conta
    }

    listenersRef.current = {
      move: handleMove,
      up: (e) => endDrag(e, e.type === 'pointercancel'),
    }
    window.addEventListener('pointermove', listenersRef.current.move)
    window.addEventListener('pointerup', listenersRef.current.up)
    window.addEventListener('pointercancel', listenersRef.current.up)

    setIsDragging(true)
    opts.onDragStart?.({ x: startX, y: startY, event })
    event.preventDefault()
  }, [handleMove, endDrag])

  const ref = useCallback((node) => {
    const previous = nodeRef.current
    if (previous) {
      previous.removeEventListener('pointerdown', handleDown)
      previous.style.touchAction = touchActionRef.current
      nodeRef.current = null
    }
    if (!node) return

    node.addEventListener('pointerdown', handleDown)
    // touch-action: none é o que permite arrastar no touch sem brigar com o
    // scroll da página — o valor anterior é restaurado na desmontagem.
    touchActionRef.current = node.style.touchAction
    node.style.touchAction = 'none'
    nodeRef.current = node
  }, [handleDown])

  // Desmontagem no meio de um arrasto: solta os listeners da janela sem
  // setState (o componente já está sumindo).
  useEffect(() => {
    return () => {
      const drag = dragRef.current
      dragRef.current = null
      removeWindowListeners()
      if (drag && nodeRef.current) {
        try {
          nodeRef.current.releasePointerCapture(drag.pointerId)
        } catch {
          // já liberado
        }
      }
    }
  }, [removeWindowListeners])

  return {
    ref,
    x: position.x,
    y: position.y,
    isDragging,
    setPosition,
  }
}
