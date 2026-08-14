/**
 * Calculadora de compressão de payload — 100% client-side.
 *
 * Usa a CompressionStream API nativa do navegador para medir o tamanho
 * real (em bytes) de um texto antes e depois da compressão gzip e brotli.
 * Nenhum dado sai do dispositivo.
 */

const encoder = new TextEncoder()

export function getByteSize(text) {
  return encoder.encode(text).length
}

export function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  const value = parseFloat((bytes / k ** i).toFixed(decimals))
  return `${value} ${sizes[i]}`
}

export function formatPercent(value, decimals = 1) {
  return `${value.toFixed(decimals)}%`
}

export function calculateReduction(original, compressed) {
  if (!original) return { ratio: 1, reduction: 0, saved: 0 }
  const ratio = compressed / original
  const reduction = (1 - ratio) * 100
  const saved = original - compressed
  return { ratio, reduction, saved }
}

export function isCompressionSupported(format = 'gzip') {
  try {
    // eslint-disable-next-line no-new
    new CompressionStream(format)
    return true
  } catch {
    return false
  }
}

async function compressWith(text, format) {
  if (!isCompressionSupported(format)) {
    throw new Error(`CompressionStream("${format}") não é suportado neste navegador.`)
  }
  const input = new Blob([text])
  const stream = input.stream().pipeThrough(new CompressionStream(format))
  const response = new Response(stream)
  const blob = await response.blob()
  return blob.size
}

export async function compressGzip(text) {
  return compressWith(text, 'gzip')
}

export async function compressBrotli(text) {
  return compressWith(text, 'br')
}

export async function compressDeflate(text) {
  return compressWith(text, 'deflate')
}

export async function analyzePayload(text) {
  const original = getByteSize(text)
  const [gzip, brotli, deflate] = await Promise.all([
    compressGzip(text).catch(() => null),
    compressBrotli(text).catch(() => null),
    compressDeflate(text).catch(() => null),
  ])

  return {
    original,
    gzip,
    brotli,
    deflate,
    gzipStats: calculateReduction(original, gzip ?? original),
    brotliStats: calculateReduction(original, brotli ?? original),
    deflateStats: calculateReduction(original, deflate ?? original),
  }
}

export const SAMPLES = {
  json: `{
  "users": [
    {"id":1,"name":"Alice Silva","email":"alice@example.com","active":true,"roles":["admin","editor"]},
    {"id":2,"name":"Bruno Costa","email":"bruno@example.com","active":false,"roles":["viewer"]},
    {"id":3,"name":"Carla Dias","email":"carla@example.com","active":true,"roles":["editor","viewer"]}
  ],
  "meta": {"page":1,"per_page":20,"total":3,"generated_at":"2026-08-13T12:00:00Z"}
}`,
  html: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Exemplo de Página</title>
  <link rel="stylesheet" href="/styles.css">
</head>
<body>
  <header class="site-header">
    <nav>
      <a href="/">Home</a>
      <a href="/sobre">Sobre</a>
      <a href="/contato">Contato</a>
    </nav>
  </header>
  <main>
    <h1>Bem-vindo ao exemplo</h1>
    <p>Este é um parágrafo de exemplo usado para demonstrar a compressão de HTML.</p>
    <button id="acao">Clique aqui</button>
  </main>
  <script src="/app.js"></script>
</body>
</html>`,
  css: `:root {
  --primary: #1677ff;
  --success: #52c41a;
  --warning: #faad14;
  --danger: #ff4d4f;
  --text: rgba(0, 0, 0, 0.88);
  --bg: #ffffff;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  color: var(--text);
  background: var(--bg);
  line-height: 1.6;
}

.card {
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  background: var(--primary);
  color: #fff;
  cursor: pointer;
}

.btn:hover {
  opacity: 0.85;
}`,
  js: `function optimizePayload(data) {
  const seen = new Set();
  const unique = data.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });

  return unique.map((item) => ({
    id: item.id,
    name: item.name.trim(),
    email: item.email.toLowerCase(),
    active: Boolean(item.active),
    roles: Array.from(new Set(item.roles || [])),
  }));
}

const payload = optimizePayload([
  { id: 1, name: "  Alice  ", email: "ALICE@EXAMPLE.COM", active: 1, roles: ["admin", "admin"] },
  { id: 2, name: "Bruno", email: "bruno@example.com", active: 0, roles: ["viewer"] },
  { id: 3, name: "Carla", email: "carla@example.com", active: 1, roles: ["editor", "viewer"] },
]);

console.log("Payload otimizado:", JSON.stringify(payload, null, 2));`,
}
