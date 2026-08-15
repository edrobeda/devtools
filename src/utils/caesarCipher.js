// Cifra de César / ROT13 / ROT47 — motor 100% client-side.
// A clássica Cifra de César opera apenas sobre A-Z (case opcionalmente preservado).
// ROT13 é César com shift 13 no alfabeto inglês.
// ROT47 opera sobre o bloco ASCII imprimível 33–126 (!–~).

const A_UPPER = 'A'.charCodeAt(0)
const A_LOWER = 'a'.charCodeAt(0)
const ALPHABET_SIZE = 26

const ROT47_START = 33 // '!'
const ROT47_END = 126 // '~'
const ROT47_SIZE = ROT47_END - ROT47_START + 1 // 94

function shiftChar(ch, shift) {
  const code = ch.charCodeAt(0)
  if (code >= A_UPPER && code < A_UPPER + ALPHABET_SIZE) {
    return String.fromCharCode(A_UPPER + ((code - A_UPPER + shift) % ALPHABET_SIZE + ALPHABET_SIZE) % ALPHABET_SIZE)
  }
  if (code >= A_LOWER && code < A_LOWER + ALPHABET_SIZE) {
    return String.fromCharCode(A_LOWER + ((code - A_LOWER + shift) % ALPHABET_SIZE + ALPHABET_SIZE) % ALPHABET_SIZE)
  }
  return ch
}

function transform(text, shift) {
  let out = ''
  for (const ch of text) {
    out += shiftChar(ch, shift)
  }
  return out
}

export function caesarEncrypt(text, shift) {
  return transform(text, shift)
}

export function caesarDecrypt(text, shift) {
  return transform(text, -shift)
}

export function rot13(text) {
  return transform(text, 13)
}

export function rot47(text) {
  let out = ''
  for (const ch of text) {
    const code = ch.charCodeAt(0)
    if (code >= ROT47_START && code <= ROT47_END) {
      out += String.fromCharCode(ROT47_START + ((code - ROT47_START + 47) % ROT47_SIZE))
    } else {
      out += ch
    }
  }
  return out
}

// Tenta todos os deslocamentos 1–25 e retorna array com { shift, text }.
// Útil para decodificar quando o shift é desconhecido.
export function bruteForceCaesar(text) {
  const results = []
  for (let shift = 1; shift <= 25; shift += 1) {
    results.push({ shift, text: caesarDecrypt(text, shift) })
  }
  return results
}

// Alfabeto rotacionado para exibir na tabela de referência.
export function rotatedAlphabet(shift, uppercase = true) {
  const base = uppercase ? A_UPPER : A_LOWER
  const out = []
  for (let i = 0; i < ALPHABET_SIZE; i += 1) {
    out.push(String.fromCharCode(base + ((i + shift) % ALPHABET_SIZE)))
  }
  return out
}

// Estatísticas rápidas: quantos caracteres foram transformados (A-Z/a-z),
// quantos permaneceram inalterados e comprimento total.
export function caesarStats(text) {
  let transformed = 0
  let unchanged = 0
  for (const ch of text) {
    const code = ch.charCodeAt(0)
    if ((code >= A_UPPER && code < A_UPPER + ALPHABET_SIZE) || (code >= A_LOWER && code < A_LOWER + ALPHABET_SIZE)) {
      transformed += 1
    } else {
      unchanged += 1
    }
  }
  return { length: text.length, transformed, unchanged }
}

// Estatísticas para ROT47.
export function rot47Stats(text) {
  let transformed = 0
  let unchanged = 0
  for (const ch of text) {
    const code = ch.charCodeAt(0)
    if (code >= ROT47_START && code <= ROT47_END) {
      transformed += 1
    } else {
      unchanged += 1
    }
  }
  return { length: text.length, transformed, unchanged }
}
