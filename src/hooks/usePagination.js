import { useCallback, useMemo, useState } from 'react'

export default function usePagination(items, options = {}) {
  const { pageSize = 10, initialPage = 1 } = options

  const [page, setPage] = useState(initialPage)

  const totalItems = items.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))

  // Garante que a página atual nunca fique fora dos limites quando os dados
  // mudam (ex.: filtro reduzindo o total de itens).
  const safePage = Math.min(Math.max(1, page), totalPages)

  const startIndex = (safePage - 1) * pageSize

  const pageItems = useMemo(
    () => items.slice(startIndex, startIndex + pageSize),
    [items, startIndex, pageSize]
  )

  const canNext = safePage < totalPages
  const canPrev = safePage > 1

  const goTo = useCallback(
    (next) => {
      setPage((current) => {
        const resolved = typeof next === 'function' ? next(current) : next
        return Math.min(Math.max(1, resolved), totalPages)
      })
    },
    [totalPages]
  )

  const nextPage = useCallback(() => goTo((p) => p + 1), [goTo])
  const prevPage = useCallback(() => goTo((p) => p - 1), [goTo])
  const firstPage = useCallback(() => goTo(1), [goTo])
  const lastPage = useCallback(() => goTo(totalPages), [goTo, totalPages])

  return {
    page: safePage,
    pageSize,
    totalItems,
    totalPages,
    pageItems,
    canNext,
    canPrev,
    setPage: goTo,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
  }
}
