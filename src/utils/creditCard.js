// Utilitários de cartão de crédito — validação Luhn (módulo 10), detecção de
// bandeira por faixas de IIN (primeiros dígitos) e geração de números de
// teste com dígito verificador correto. 100% client-side, nada sai do
// navegador. Números gerados aqui são apenas sequências que passam no
// checksum; não correspondem a cartões reais.

export function onlyDigits(value) {
  return String(value ?? '').replace(/\D/g, '')
}

// Validação Luhn: da direita pra esquerda, dobra cada segundo dígito
// (soma dos dígitos do dobro quando > 9) e o total precisa ser múltiplo de 10.
export function luhnCheck(number) {
  const digits = onlyDigits(number)
  if (digits.length < 2) return false
  let sum = 0
  const parity = digits.length % 2
  for (let i = 0; i < digits.length; i++) {
    let d = digits.charCodeAt(i) - 48
    if (i % 2 === parity) {
      d *= 2
      if (d > 9) d -= 9
    }
    sum += d
  }
  return sum % 10 === 0
}

// Dígito verificador que torna `partial` um número Luhn-válido. Testa com um
// "0" no lugar do verificador e calcula quanto falta pra fechar a soma em 10.
export function luhnCheckDigit(partial) {
  const digits = onlyDigits(partial)
  const probe = digits + '0'
  let sum = 0
  const parity = probe.length % 2
  for (let i = 0; i < probe.length; i++) {
    let d = probe.charCodeAt(i) - 48
    if (i % 2 === parity) {
      d *= 2
      if (d > 9) d -= 9
    }
    sum += d
  }
  return (10 - (sum % 10)) % 10
}

// Passo a passo do Luhn, pra exibir na página (qual dígito foi dobrado e o
// valor efetivamente somado) junto da soma total e do veredito.
export function luhnTrace(number) {
  const digits = onlyDigits(number)
  const parity = digits.length % 2
  let sum = 0
  const steps = digits.split('').map((ch, i) => {
    const original = ch.charCodeAt(0) - 48
    const doubled = i % 2 === parity
    const value = doubled ? (original * 2 > 9 ? original * 2 - 9 : original * 2) : original
    sum += value
    return { index: i, original, doubled, value }
  })
  return { steps, sum, valid: sum % 10 === 0 }
}

// Cada bandeira: nome PT/EN, cor da Tag, comprimentos válidos, comprimento
// usado na geração e faixas de prefixo (IIN) como [menor, maior] — um range
// como ['2221', '2720'] significa "número que começa com qualquer valor
// inteiro entre 2221 e 2720". A ordem importa: bandeiras mais específicas
// (faixas longas) vêm antes das genéricas (Ex.: Discover 622126–622925 antes
// do UnionPay "62", que englobaria). A Elo vem ANTES da Visa porque várias
// faixas dela começam com "4" (401178…, 431274…, 4576…) e o "4" genérico da
// Visa engoliria essas faixas — sem isso, cartões Elo reais liam como Visa.
export const BRANDS = [
  {
    id: 'elo',
    name: { pt: 'Elo', en: 'Elo' },
    color: 'purple',
    lengths: [16],
    genLength: 16,
    ranges: [
      ['401178', '401179'], ['431274', '431274'], ['438935', '438935'],
      ['451416', '451416'], ['457393', '457393'], ['457631', '457632'],
      ['504175', '504175'], ['506699', '506778'], ['509000', '509999'],
      ['627780', '627780'], ['636297', '636297'], ['636368', '636368'],
      ['650031', '650051'], ['650485', '650500'],
    ],
    example: '6362970000457013',
  },
  {
    id: 'visa',
    name: { pt: 'Visa', en: 'Visa' },
    color: 'blue',
    lengths: [16, 13, 19],
    genLength: 16,
    ranges: [['4', '4']],
    example: '4242424242424242',
  },
  {
    id: 'mastercard',
    name: { pt: 'Mastercard', en: 'Mastercard' },
    color: 'orange',
    lengths: [16],
    genLength: 16,
    ranges: [['51', '55'], ['2221', '2720']],
    example: '5555555555554444',
  },
  {
    id: 'amex',
    name: { pt: 'American Express', en: 'American Express' },
    color: 'cyan',
    lengths: [15],
    genLength: 15,
    ranges: [['34', '34'], ['37', '37']],
    example: '378282246310005',
  },
  {
    id: 'discover',
    name: { pt: 'Discover', en: 'Discover' },
    color: 'volcano',
    lengths: [16, 17, 18, 19],
    genLength: 16,
    ranges: [['6011', '6011'], ['622126', '622925'], ['644', '649'], ['65', '65']],
    example: '6011111111111117',
  },
  {
    id: 'hipercard',
    name: { pt: 'Hipercard', en: 'Hipercard' },
    color: 'red',
    lengths: [16],
    genLength: 16,
    ranges: [['606282', '606282'], ['637095', '637095'], ['637568', '637568'], ['637599', '637599'], ['637609', '637609'], ['637612', '637612']],
    example: '6062825624254001',
  },
  {
    id: 'diners',
    name: { pt: 'Diners Club', en: 'Diners Club' },
    color: 'gold',
    lengths: [14],
    genLength: 14,
    ranges: [['300', '305'], ['36', '36'], ['38', '38']],
    example: '30569309025904',
  },
  {
    id: 'jcb',
    name: { pt: 'JCB', en: 'JCB' },
    color: 'geekblue',
    lengths: [16, 17, 18, 19],
    genLength: 16,
    ranges: [['3528', '3589']],
    example: '3530111333300000',
  },
  {
    id: 'unionpay',
    name: { pt: 'UnionPay', en: 'UnionPay' },
    color: 'lime',
    lengths: [16, 17, 18, 19],
    genLength: 16,
    ranges: [['62', '62']],
    example: '6250941006528599',
  },
  {
    id: 'maestro',
    name: { pt: 'Maestro', en: 'Maestro' },
    color: 'cyan',
    lengths: [12, 13, 14, 15, 16, 17, 18, 19],
    genLength: 16,
    ranges: [['5018', '5018'], ['5020', '5020'], ['5038', '5038'], ['5893', '5893'], ['6304', '6304'], ['6759', '6763']],
    example: '6304000000000000',
  },
]

function rangeMatch(digits, range) {
  const [lo, hi] = range
  const prefix = digits.slice(0, lo.length)
  if (prefix.length < lo.length) return false
  const n = Number(prefix)
  return n >= Number(lo) && n <= Number(hi)
}

export function detectBrand(number) {
  const digits = onlyDigits(number)
  if (!digits) return null
  for (const brand of BRANDS) {
    if (brand.ranges.some((r) => rangeMatch(digits, r))) return brand
  }
  return null
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// Gera um número de teste Luhn-válido pra uma bandeira: sorteia uma faixa de
// prefixo (IIN) da banda, preenche os dígitos do meio e fecha com o dígito
// verificador calculado. `length` opcional (padrão: o genLength da bandeira).
export function generateCardNumber(brandId, length) {
  const brand = BRANDS.find((b) => b.id === brandId) || BRANDS[0]
  const len = length || brand.genLength
  const range = brand.ranges[randomInt(0, brand.ranges.length - 1)]
  const lo = Number(range[0])
  const hi = Number(range[1])
  let body = String(randomInt(lo, hi)).padStart(range[0].length, '0')
  while (body.length < len - 1) body += randomInt(0, 9)
  const candidate = body + luhnCheckDigit(body)
  // Algumas faixas de IIN se sobrepõem entre bandeiras (ex.: os co-branded
  // 622126–622925 são Discover, não UnionPay). Re-tenta até o número "ler"
  // como a bandeira pedida, pra geração nunca devolver um resultado confuso.
  if (detectBrand(candidate)?.id === brand.id) return candidate
  return generateCardNumber(brandId, len)
}

// Formata em grupos de 4; Amex (15 dígitos) usa o layout próprio 4-6-5.
export function formatDigits(number) {
  const digits = onlyDigits(number)
  if (digits.length === 15) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 10)} ${digits.slice(10)}`
  }
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ')
}