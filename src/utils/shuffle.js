// Fisher-Yates (Knuth) shuffle: percorre o array de trás pra frente e troca
// cada posição por uma posição aleatória dentro do que ainda não foi
// visitado. Cada uma das N! permutações tem a mesma probabilidade — ao
// contrário de `array.sort(() => Math.random() - 0.5)`, que é enviesado
// porque depende da ordem de comparações do algoritmo de sort do motor JS.
export function fisherYatesShuffle(array) {
  const result = [...array]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

// Implementação clássica (e enviesada) que muita gente usa por engano.
export function naiveSortShuffle(array) {
  return [...array].sort(() => Math.random() - 0.5)
}
