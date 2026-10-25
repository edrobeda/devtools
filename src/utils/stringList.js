// Utilitarios compartilhados para listas de texto separadas por virgula,
// usadas pelas paginas de gerador de /devops/ (eslint, tsconfig, renovate)
// para converter o texto digitado em array e o array de volta em texto.

// Quebra um texto separado por virgula em um array de itens trimados.
// `separator` permite que a pagina aceite tambem quebra de linha.
export function commaStringToArray(value, separator = ',') {
  if (!value || typeof value !== 'string') return []
  return value
    .split(separator)
    .map((s) => s.trim())
    .filter(Boolean)
}

// Junta um array em uma unica string separada por virgula.
export function arrayToCommaString(arr) {
  if (!Array.isArray(arr)) return ''
  return arr.join(', ')
}
