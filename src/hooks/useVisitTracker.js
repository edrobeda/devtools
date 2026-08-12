import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

// Registra 1 visita anônima por troca de rota (POST /api/visits, key =
// pathname). Fire-and-forget: falha de rede não deve incomodar o usuário
// nem aparecer no console. Usado só por AppLayout.jsx, 1x pro app inteiro.
export default function useVisitTracker() {
  const location = useLocation()

  useEffect(() => {
    fetch('/api/visits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: location.pathname }),
    }).catch(() => {})
  }, [location.pathname])
}
