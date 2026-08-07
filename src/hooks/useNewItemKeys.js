import { useEffect, useReducer } from 'react'
import { useQuery } from '@tanstack/react-query'
import { NEW_ITEM_KEYS } from '../newItems'

async function fetchItems() {
  const res = await fetch('/api/items')
  if (!res.ok) throw new Error('failed to fetch items')
  return res.json()
}

// Busca o catálogo de itens (GET /api/items, com created_at de cada um) e
// mantém `NEW_ITEM_KEYS` — o mesmo array mutável que `AppLayout.jsx` já lia
// pra decidir o badge "Novo"/"New" — com as chaves dos 24 itens mais
// recentes. O badge deixa de ser "resetado 1x/dia" e passa a ser uma janela
// deslizante por quantidade de itens, sempre os últimos 24 no tempo.
//
// O array é mutado in-place (NEW_ITEM_KEYS.length = 0; push(...)), não
// reatribuído — então quem só faz `NEW_ITEM_KEYS.includes(key)` dentro de um
// render continua funcionando sem mudar de import. Mas mutar um array não
// dispara re-render sozinho: qualquer `useMemo` que precise recalcular
// depois que os dados chegarem deve incluir o `version` retornado aqui na
// sua lista de dependências.
export function useNewItemKeys() {
  const { data } = useQuery({
    queryKey: ['devtools-items'],
    queryFn: fetchItems,
    staleTime: 5 * 60 * 1000,
  })
  const [version, bump] = useReducer((c) => c + 1, 0)

  useEffect(() => {
    if (!data) return
    const latest24 = [...data]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 24)
      .map((item) => item.key)
    NEW_ITEM_KEYS.length = 0
    NEW_ITEM_KEYS.push(...latest24)
    bump()
  }, [data])

  return version
}
