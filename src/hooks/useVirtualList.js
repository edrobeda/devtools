import { useCallback, useLayoutEffect, useRef, useState } from 'react'

/**
 * useVirtualList — virtualização de lista (windowing) para altura fixa.
 *
 * De uma lista de N itens mantém no DOM só a janela visível mais o
 * "overscan" (buffer) em cada lado, então 100.000 linhas custam os mesmos
 * ~25 nós de DOM que 30 linhas. O cálculo é O(1) por scroll: não mede
 * nenhum filho, só faz aritmética com scrollTop, clientHeight e o tamanho
 * fixo da linha.
 *
 * Uso:
 *   const list = useVirtualList({ count: rows.length, itemHeight: 36, overscan: 6 })
 *
 *   <div ref={list.containerRef} style={{ height: 420, overflowY: 'auto' }}>
 *     <div style={{ height: list.totalHeight, position: 'relative' }}>
 *       <div style={{ transform: \`translateY(${list.offsetY}px)\` }}>
 *         {rows.slice(list.start, list.end).map((row, i) => (
 *           <div key={list.start + i} style={{ height: 36 }}>{row}</div>
 *         ))}
 *       </div>
 *     </div>
 *   </div>
 *
 *   list.scrollToIndex(99999)        // rola até o índice (clamp nos limites)
 *   list.scrollToIndex(500, 'center') // alinha o item no meio do viewport
 *
 * Retorno: containerRef, start/end da janela, offsetY (deslocamento do
 * bloco renderizado), totalHeight (altura do spacer), renderedCount e
 * scrollToIndex.
 *
 * Detalhes que importam:
 * - O estado guarda SÓ a janela { start, end }. Um scroll que não muda a
 *   janela chama setRange com o mesmo objeto e o React faz bail-out —
 *   nenhum re-render acontece, então arrastar a barra de scroll dentro da
 *   mesma janela é de graça.
 * - O primeiro cálculo roda em useLayoutEffect, antes da pintura — sem
 *   isso a lista abriria vazia por um frame.
 * - As dependências são só primitivos (count, itemHeight, overscan), então
 *   passar o objeto literal direto na chamada não recria efeito em loop.
 * - A janela recalcula no scroll (listener passive), no resize do próprio
 *   container (ResizeObserver, com fallback pra window.resize) e quando
 *   qualquer uma das três opções muda.
 *
 * Limitação documentada: altura fixa. Linhas de altura variável precisariam
 * de medida/estimativa por item — fora do escopo deste snippet.
 */
export default function useVirtualList({ count = 0, itemHeight = 32, overscan = 6 } = {}) {
  const containerRef = useRef(null)
  const [range, setRange] = useState({ start: 0, end: 0 })

  const total = Math.max(0, Math.floor(Number(count) || 0))
  const rowHeight = Number(itemHeight) > 0 ? Number(itemHeight) : 32
  const buffer = Math.max(0, Math.floor(Number(overscan) || 0))

  const recompute = useCallback(() => {
    const el = containerRef.current
    if (!el || total === 0) {
      setRange((prev) => (prev.start === 0 && prev.end === 0 ? prev : { start: 0, end: 0 }))
      return
    }
    const firstVisible = Math.floor(el.scrollTop / rowHeight)
    const visibleCount = Math.ceil(el.clientHeight / rowHeight) + 1
    // start é limitado a total - 1: mesmo com um scrollTop "fora" do
    // conteúdo (transição logo após encolher a lista) a janela nunca fica
    // com start > end nem vazia sem necessidade.
    const start = Math.min(Math.max(0, firstVisible - buffer), total - 1)
    const end = Math.min(total, Math.max(start, firstVisible + visibleCount + buffer))
    setRange((prev) => (prev.start === start && prev.end === end ? prev : { start, end }))
  }, [total, rowHeight, buffer])

  useLayoutEffect(() => {
    recompute()
    const el = containerRef.current
    if (!el) return undefined

    const onScroll = () => recompute()
    el.addEventListener('scroll', onScroll, { passive: true })

    let resizeObserver
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(onScroll)
      resizeObserver.observe(el)
    } else {
      window.addEventListener('resize', onScroll)
    }

    return () => {
      el.removeEventListener('scroll', onScroll)
      if (resizeObserver) resizeObserver.disconnect()
      else window.removeEventListener('resize', onScroll)
    }
  }, [recompute])

  const scrollToIndex = useCallback(
    (index, align = 'start') => {
      const el = containerRef.current
      if (!el || total === 0) return
      const clamped = Math.min(total - 1, Math.max(0, Math.floor(Number(index) || 0)))
      let top = clamped * rowHeight
      if (align === 'center') top -= (el.clientHeight - rowHeight) / 2
      el.scrollTop = Math.max(0, top)
      // O próprio scrollTop dispara o listener, mas recalcular aqui também
      // cobre o caso de o valor não mudar (ex.: pedir o índice que já está
      // na tela com o conteúdo encolhido).
      recompute()
    },
    [total, rowHeight, recompute]
  )

  return {
    containerRef,
    start: range.start,
    end: range.end,
    offsetY: range.start * rowHeight,
    totalHeight: total * rowHeight,
    renderedCount: Math.max(0, range.end - range.start),
    scrollToIndex,
  }
}
