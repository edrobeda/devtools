/**
 * Gera hashes de Subresource Integrity (SRI) a partir de um ArrayBuffer.
 * O algoritmo pode ser SHA-256, SHA-384 ou SHA-512. O resultado segue o
 * formato `algo+base64`, pronto para uso em atributos `integrity` de
 * `<script>` ou `<link rel="stylesheet">`.
 *
 * Usa `crypto.subtle.digest`, disponível em contextos seguros (HTTPS ou
 * localhost). Nada é enviado para fora do navegador.
 */

export const SRI_ALGORITHMS = ['SHA-256', 'SHA-384', 'SHA-512']

/**
 * Converte um ArrayBuffer para string base64.
 */
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return typeof window !== 'undefined' && window.btoa
    ? window.btoa(binary)
    : Buffer.from(bytes).toString('base64')
}

/**
 * Calcula o digest do buffer para o algoritmo informado e retorna a string
 * SRI completa (`shaXXX-base64hash`).
 */
export async function computeSriHash(buffer, algorithm = 'SHA-384') {
  if (!SRI_ALGORITHMS.includes(algorithm)) {
    throw new Error(`Unsupported algorithm: ${algorithm}`)
  }
  if (!crypto || !crypto.subtle || typeof crypto.subtle.digest !== 'function') {
    throw new Error('Web Crypto API (crypto.subtle.digest) is not available.')
  }
  const digest = await crypto.subtle.digest(algorithm, buffer)
  const base64 = arrayBufferToBase64(digest)
  return `${algorithm.toLowerCase().replace('-', '')}-${base64}`
}

/**
 * Lê um File/Blob como ArrayBuffer.
 */
export function readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(reader.error)
    reader.readAsArrayBuffer(file)
  })
}

/**
 * Calcula os três hashes SRI para um arquivo e retorna metadados úteis.
 */
export async function computeSriForFile(file) {
  const buffer = await readFileAsArrayBuffer(file)
  const hashes = await Promise.all(
    SRI_ALGORITHMS.map((algo) => computeSriHash(buffer, algo))
  )
  return {
    name: file.name,
    size: file.size,
    type: file.type || 'application/octet-stream',
    hashes: Object.fromEntries(SRI_ALGORITHMS.map((algo, i) => [algo, hashes[i]])),
  }
}

/**
 * Monta a tag HTML de exemplo (script ou stylesheet) com o atributo integrity.
 */
export function buildSriTag(url, integrity, kind = 'script') {
  if (kind === 'script') {
    return `<script src="${url}" integrity="${integrity}" crossorigin="anonymous" referrerpolicy="no-referrer"></script>`
  }
  return `<link rel="stylesheet" href="${url}" integrity="${integrity}" crossorigin="anonymous" referrerpolicy="no-referrer">`
}
