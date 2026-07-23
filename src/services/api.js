// Base da API compartilhada (manager-api) — endpoints específicos do
// devtools, se algum dia precisar, entram lá dentro, não aqui.
const API_URL = import.meta.env.VITE_API_URL || 'https://manager.eventifylab.com'

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  if (!res.ok) throw new Error(`Erro ${res.status} em ${path}`)
  return res.json()
}

export default { get: (path) => request(path), post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }) }
