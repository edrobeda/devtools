// Conversor de números romanos — 100% client-side.
// Suporta o intervalo clássico de 1 a 3999 (sistema de numeração romana
// subtrativo moderno, sem vinculum/overline).

export const ROMAN_MAP = [
  { value: 1000, symbol: 'M' },
  { value: 900, symbol: 'CM' },
  { value: 500, symbol: 'D' },
  { value: 400, symbol: 'CD' },
  { value: 100, symbol: 'C' },
  { value: 90, symbol: 'XC' },
  { value: 50, symbol: 'L' },
  { value: 40, symbol: 'XL' },
  { value: 10, symbol: 'X' },
  { value: 9, symbol: 'IX' },
  { value: 5, symbol: 'V' },
  { value: 4, symbol: 'IV' },
  { value: 1, symbol: 'I' },
]

const VALID_ROMAN_RE = /^M{0,3}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/
const ROMAN_DIGIT_RE = /[MDCLXVI]/g

/**
 * Converte um número decimal (1–3999) para romano.
 * @param {number} n
 * @returns {string}
 */
export function toRoman(n) {
  const num = Number(n)
  if (!Number.isInteger(num) || num < 1 || num > 3999) {
    throw new Error('Fora do intervalo válido (1–3999)')
  }

  let remaining = num
  let result = ''
  for (const { value, symbol } of ROMAN_MAP) {
    while (remaining >= value) {
      result += symbol
      remaining -= value
    }
  }
  return result
}

/**
 * Converte um numeral romano válido para decimal.
 * @param {string} roman
 * @returns {number}
 */
export function fromRoman(roman) {
  const input = String(roman).trim().toUpperCase()
  if (!input) return 0

  if (!VALID_ROMAN_RE.test(input)) {
    throw new Error('Numeral romano inválido')
  }

  let total = 0
  let i = 0
  while (i < input.length) {
    const current = input[i]
    const next = input[i + 1]
    const currentValue = valueOf(current)
    const nextValue = next ? valueOf(next) : 0

    if (nextValue > currentValue) {
      total += nextValue - currentValue
      i += 2
    } else {
      total += currentValue
      i += 1
    }
  }
  return total
}

function valueOf(symbol) {
  const found = ROMAN_MAP.find((item) => item.symbol === symbol)
  return found ? found.value : 0
}

/**
 * Verifica se uma string é um numeral romano válido (1–3999).
 * @param {string} roman
 * @returns {boolean}
 */
export function isValidRoman(roman) {
  if (typeof roman !== 'string') return false
  const input = roman.trim().toUpperCase()
  if (!input) return false
  if (!VALID_ROMAN_RE.test(input)) return false
  try {
    return fromRoman(input) > 0
  } catch {
    return false
  }
}

/**
 * Retorna um array com a decomposição passo a passo da conversão
 * decimal → romano. Útil para explicar o algoritmo na interface.
 * @param {number} n
 * @returns {Array<{value: number, symbol: string, remaining: number}>}
 */
export function explainRoman(n) {
  const num = Number(n)
  if (!Number.isInteger(num) || num < 1 || num > 3999) return []

  const steps = []
  let remaining = num
  for (const { value, symbol } of ROMAN_MAP) {
    while (remaining >= value) {
      steps.push({ value, symbol, remaining: remaining - value })
      remaining -= value
    }
  }
  return steps
}

/**
 * Extrai todos os numerais romanos encontrados em um texto.
 * @param {string} text
 * @returns {string[]}
 */
export function extractRomans(text) {
  if (typeof text !== 'string') return []
  const matches = text.toUpperCase().match(ROMAN_DIGIT_RE)
  if (!matches) return []
  const candidates = matches.join('')
  const result = []
  for (let i = 0; i < candidates.length; i++) {
    for (let j = Math.min(candidates.length, i + 15); j > i; j--) {
      const slice = candidates.slice(i, j)
      if (isValidRoman(slice)) {
        result.push(slice)
        break
      }
    }
  }
  return [...new Set(result)].sort((a, b) => a.length - b.length || a.localeCompare(b))
}
