/**
 * Decodificador de JWT (JWS compacto `header.payload.signature`) compartilhado
 * por /tools/jwt-decoder e /tools/jwt-timeline. Antes cada página carregava uma
 * cópia própria, byte a byte idêntica, do mesmo base64url -> texto e do mesmo
 * parse do token — a única diferença era que a timeline ignorava o campo
 * `signature`. Esta é a versão canônica.
 *
 * A decodificação aqui é leniente de propósito: normaliza `-`/`_` para `+`/`/`,
 * re-padeia e devolve texto UTF-8, deixando o `atob` estourar o próprio erro
 * quando o segmento não é base64 válido. Não é o mesmo contrato do
 * `b64urlToBytes` de src/utils/jwtSignatureVerifier.js, que valida o alfabeto,
 * recusa `length % 4 === 1` e devolve bytes — trocar um pelo outro mudaria a
 * mensagem de erro exibida ao usuário nestas duas páginas. Unificar os dois
 * lados do Base64URL é trabalho para uma etapa própria.
 *
 * 100% client-side — nada sai do navegador.
 */

/**
 * Decodifica um segmento Base64URL (JWT) para string UTF-8.
 *
 * @param {string} segment segmento Base64URL sem padding
 * @returns {string} texto decodificado
 */
export function base64UrlDecode(segment) {
  const normalized = segment.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=')
  const binary = atob(padded)
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
  return new TextDecoder('utf-8').decode(bytes)
}

/**
 * Parseia um token JWS compacto e devolve header, payload e a assinatura crua
 * (não verificada — apenas decodificação, nenhuma validação de segredo).
 *
 * @param {string} token              token `header.payload.signature`
 * @param {string} parseErrorMessage  mensagem de erro exibida quando o token
 *        não tem exatamente 3 partes (vem do i18n da página)
 * @returns {{ header: object, payload: object, signature: string }}
 * @throws {Error} `parseErrorMessage` se não houver 3 partes; o erro nativo do
 *         `JSON.parse` se header/payload não forem JSON válido
 */
export function decodeJwt(token, parseErrorMessage) {
  const parts = token.trim().split('.')
  if (parts.length !== 3) {
    throw new Error(parseErrorMessage)
  }
  const [rawHeader, rawPayload, signature] = parts
  const header = JSON.parse(base64UrlDecode(rawHeader))
  const payload = JSON.parse(base64UrlDecode(rawPayload))
  return { header, payload, signature }
}