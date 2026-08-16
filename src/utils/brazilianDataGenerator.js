/**
 * Gerador de dados brasileiros fictícios 100% client-side.
 *
 * Gera CEP, telefones, placas (antiga e Mercosul), PIS/PASEP/NIT,
 * título de eleitor, RG e RENAVAM com dígitos verificadores matematicamente
 * válidos. Os números são aleatórios e não correspondem a pessoas, veículos
 * ou endereços reais — servem apenas para testes e formulários.
 */

const DDD_LIST = [
  11, 12, 13, 14, 15, 16, 17, 18, 19,
  21, 22, 24, 27, 28,
  31, 32, 33, 34, 35, 37, 38,
  41, 42, 43, 44, 45, 46, 47, 48, 49,
  51, 53, 54, 55,
  61, 62, 63, 64, 65, 66, 67, 68, 69,
  71, 73, 74, 75, 77, 79,
  81, 82, 83, 84, 85, 86, 87, 88, 89,
  91, 92, 93, 94, 95, 96, 97, 98, 99,
]

const UPPER_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

function randomDigit() {
  return Math.floor(Math.random() * 10)
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomLetter() {
  return UPPER_LETTERS[Math.floor(Math.random() * UPPER_LETTERS.length)]
}

function pick(array) {
  return array[Math.floor(Math.random() * array.length)]
}

function padLeft(value, length) {
  return String(value).padStart(length, '0')
}

/**
 * Módulo 11 comum com multiplicadores decrescentes (usado em CPF/CNPJ).
 */
export function mod11CheckDigit(digits) {
  let sum = 0
  let weight = digits.length + 1
  for (let i = 0; i < digits.length; i++) {
    sum += digits[i] * weight
    weight--
  }
  const rest = sum % 11
  return rest < 2 ? 0 : 11 - rest
}

/**
 * CEP: 8 dígitos aleatórios. Os primeiros 5 podem ser de 01000 a 99999.
 */
export function generateCep() {
  const prefix = randomInt(1000, 99999)
  const suffix = randomInt(0, 999)
  return `${padLeft(prefix, 5)}${padLeft(suffix, 3)}`
}

export function formatCep(raw) {
  return `${raw.slice(0, 5)}-${raw.slice(5, 8)}`
}

/**
 * Telefone fixo ou celular com DDD válido.
 */
export function generatePhone(type = 'any') {
  const ddd = pick(DDD_LIST)
  const kind = type === 'any' ? (Math.random() < 0.5 ? 'mobile' : 'landline') : type
  if (kind === 'mobile') {
    const prefix = randomInt(9000, 9999)
    const suffix = randomInt(0, 9999)
    return `${padLeft(ddd, 2)}9${padLeft(prefix, 4)}${padLeft(suffix, 4)}`
  }
  const prefix = randomInt(1000, 9999)
  const suffix = randomInt(0, 9999)
  return `${padLeft(ddd, 2)}${padLeft(prefix, 4)}${padLeft(suffix, 4)}`
}

export function formatPhone(raw) {
  const ddd = raw.slice(0, 2)
  if (raw.length === 11) {
    return `(${ddd}) ${raw.slice(2, 3)}${raw.slice(3, 7)}-${raw.slice(7, 11)}`
  }
  return `(${ddd}) ${raw.slice(2, 6)}-${raw.slice(6, 10)}`
}

/**
 * Placa no padrão antigo (LLL-NNNN).
 */
export function generateOldPlate() {
  const letters = Array.from({ length: 3 }, randomLetter).join('')
  const numbers = Array.from({ length: 4 }, randomDigit).join('')
  return `${letters}${numbers}`
}

export function formatOldPlate(raw) {
  return `${raw.slice(0, 3)}-${raw.slice(3, 7)}`
}

/**
 * Placa no padrão Mercosul (LLLNLNN).
 */
export function generateMercosulPlate() {
  const l1 = randomLetter()
  const l2 = randomLetter()
  const l3 = randomLetter()
  const n1 = randomDigit()
  const l4 = randomLetter()
  const n2 = randomDigit()
  const n3 = randomDigit()
  return `${l1}${l2}${l3}${n1}${l4}${n2}${n3}`
}

export function formatMercosulPlate(raw) {
  return `${raw.slice(0, 3)}${raw.slice(3, 4)}${raw.slice(4, 5)}${raw.slice(5, 7)}`
}

/**
 * PIS/PASEP/NIT: 11 dígitos com DV módulo 11.
 * Pesos: 3, 2, 9, 8, 7, 6, 5, 4, 3, 2.
 */
export function generatePis() {
  const base = Array.from({ length: 10 }, randomDigit)
  const weights = [3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  let sum = 0
  for (let i = 0; i < base.length; i++) {
    sum += base[i] * weights[i]
  }
  const rest = sum % 11
  const dv = rest < 2 ? 0 : 11 - rest
  return [...base, dv].join('')
}

export function formatPis(raw) {
  return `${raw.slice(0, 3)}.${raw.slice(3, 6)}.${raw.slice(6, 9)}.${raw.slice(9, 11)}`
}

/**
 * Título de eleitor: 12 dígitos.
 * - Os 2 últimos são a UF (01=SP, 02=MJ, ...).
 * - DV é calculado separadamente para os 8 primeiros dígitos e para os 3
 *   dígitos seguintes (sequencial dentro da UF), exceto SP e MG, que usam
 *   um ajuste no primeiro DV quando o resto é 0.
 */
const UF_CODES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28]

export function generateTituloEleitor() {
  const sequencial = Array.from({ length: 8 }, randomDigit)
  const uf = pick(UF_CODES)
  const ufDigits = [Math.floor(uf / 10), uf % 10]
  const sequentialUf = Array.from({ length: 3 }, randomDigit)

  function dv(digits, specialZero) {
    let sum = 0
    for (let i = 0; i < digits.length; i++) {
      sum += digits[i] * (i + 2)
    }
    const rest = sum % 11
    if (specialZero && rest === 0) return 1
    return rest === 10 ? 0 : rest
  }

  const dv1 = dv(sequencial, uf === 1 || uf === 2)
  const dv2 = dv([...sequentialUf, ...ufDigits], false)
  return [...sequencial, ...sequentialUf, ...ufDigits, dv1, dv2].join('')
}

export function formatTituloEleitor(raw) {
  return `${raw.slice(0, 4)} ${raw.slice(4, 8)} ${raw.slice(8, 12)} ${raw.slice(12, 14)}`
}

/**
 * RG: número fictício de 8 a 10 dígitos. O dígito verificador varia por
 * estado, então geramos apenas a numeração sem DV ou com DV genérico.
 */
export function generateRg() {
  const length = randomInt(8, 10)
  return Array.from({ length }, randomDigit).join('')
}

export function formatRg(raw) {
  if (raw.length === 9) {
    return `${raw.slice(0, 2)}.${raw.slice(2, 5)}.${raw.slice(5, 8)}-${raw.slice(8, 9)}`
  }
  if (raw.length === 10) {
    return `${raw.slice(0, 2)}.${raw.slice(2, 5)}.${raw.slice(5, 8)}.${raw.slice(8, 9)}-${raw.slice(9, 10)}`
  }
  return `${raw.slice(0, 1)}.${raw.slice(1, 4)}.${raw.slice(4, 7)}-${raw.slice(7, 8)}`
}

/**
 * RENAVAM: 11 dígitos. DV módulo 11 com pesos 3,2,9,8,7,6,5,4,3,2 sobre os
 * 10 primeiros dígitos; se o resto for 10, o DV passa a ser 0.
 */
export function generateRenavam() {
  const base = Array.from({ length: 10 }, randomDigit)
  const weights = [3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  let sum = 0
  for (let i = 0; i < base.length; i++) {
    sum += base[i] * weights[i]
  }
  const rest = sum % 11
  const dv = rest === 10 ? 0 : 11 - rest
  return [...base, dv].join('')
}

export function formatRenavam(raw) {
  return raw
}

/**
 * Objeto com todas as categorias disponíveis e seus geradores/formatadores.
 */
export const GENERATORS = {
  cep: { generate: generateCep, format: formatCep },
  phoneMobile: { generate: () => generatePhone('mobile'), format: formatPhone },
  phoneLandline: { generate: () => generatePhone('landline'), format: formatPhone },
  plateOld: { generate: generateOldPlate, format: formatOldPlate },
  plateMercosul: { generate: generateMercosulPlate, format: formatMercosulPlate },
  pis: { generate: generatePis, format: formatPis },
  tituloEleitor: { generate: generateTituloEleitor, format: formatTituloEleitor },
  rg: { generate: generateRg, format: formatRg },
  renavam: { generate: generateRenavam, format: formatRenavam },
}

/**
 * Código-fonte do motor para exibição na página.
 */
export const MOTOR_SOURCE = `const DDD_LIST = [11, 12, 13, ..., 99]
const UPPER_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

function randomDigit() { return Math.floor(Math.random() * 10) }
function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min }
function randomLetter() { return UPPER_LETTERS[Math.floor(Math.random() * 26)] }
function pick(array) { return array[Math.floor(Math.random() * array.length)] }
function padLeft(value, length) { return String(value).padStart(length, '0') }

// CEP
export function generateCep() {
  const prefix = randomInt(1000, 99999)
  const suffix = randomInt(0, 999)
  return padLeft(prefix, 5) + padLeft(suffix, 3)
}

// Telefone
export function generatePhone(type = 'any') {
  const ddd = pick(DDD_LIST)
  if (type === 'mobile') {
    const prefix = randomInt(9000, 9999)
    const suffix = randomInt(0, 9999)
    return padLeft(ddd, 2) + '9' + padLeft(prefix, 4) + padLeft(suffix, 4)
  }
  const prefix = randomInt(1000, 9999)
  const suffix = randomInt(0, 9999)
  return padLeft(ddd, 2) + padLeft(prefix, 4) + padLeft(suffix, 4)
}

// Placas
export function generateOldPlate() {
  const letters = Array.from({ length: 3 }, randomLetter).join('')
  const numbers = Array.from({ length: 4 }, randomDigit).join('')
  return letters + numbers
}

export function generateMercosulPlate() {
  return randomLetter() + randomLetter() + randomLetter() +
    randomDigit() + randomLetter() + randomDigit() + randomDigit()
}

// PIS/PASEP/NIT — módulo 11, pesos 3,2,9,8,7,6,5,4,3,2
export function generatePis() {
  const base = Array.from({ length: 10 }, randomDigit)
  const weights = [3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  let sum = 0
  for (let i = 0; i < base.length; i++) sum += base[i] * weights[i]
  const rest = sum % 11
  const dv = rest < 2 ? 0 : 11 - rest
  return [...base, dv].join('')
}

// Título de eleitor — DV separado para sequencial (8) e UF+ordem (3+2)
export function generateTituloEleitor() {
  const sequencial = Array.from({ length: 8 }, randomDigit)
  const uf = pick([1, 2, 3, ..., 28])
  const ufDigits = [Math.floor(uf / 10), uf % 10]
  const sequentialUf = Array.from({ length: 3 }, randomDigit)

  function dv(digits, specialZero) {
    let sum = 0
    for (let i = 0; i < digits.length; i++) sum += digits[i] * (i + 2)
    const rest = sum % 11
    if (specialZero && rest === 0) return 1
    return rest === 10 ? 0 : rest
  }

  const dv1 = dv(sequencial, uf === 1 || uf === 2) // SP ou MG
  const dv2 = dv([...sequentialUf, ...ufDigits], false)
  return [...sequencial, ...sequentialUf, ...ufDigits, dv1, dv2].join('')
}

// RG — sem DV específico (varia por estado)
export function generateRg() {
  return Array.from({ length: randomInt(8, 10) }, randomDigit).join('')
}

// RENAVAM — módulo 11, pesos 3,2,9,8,7,6,5,4,3,2
export function generateRenavam() {
  const base = Array.from({ length: 10 }, randomDigit)
  const weights = [3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  let sum = 0
  for (let i = 0; i < base.length; i++) sum += base[i] * weights[i]
  const rest = sum % 11
  const dv = rest === 10 ? 0 : 11 - rest
  return [...base, dv].join('')
}`
