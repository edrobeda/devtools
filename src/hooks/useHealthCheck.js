import { useQuery } from '@tanstack/react-query'
import api from '../services/api'

// Exemplo de hook — troque '/api/health' por um endpoint real do
// manager-api quando o devtools precisar de dados de verdade.
export function useHealthCheck() {
  return useQuery({
    queryKey: ['health'],
    queryFn: () => api.get('/api/health'),
    retry: 0,
  })
}
