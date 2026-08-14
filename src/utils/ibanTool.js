/**
 * IBAN tool — 100% client-side utilities to generate, validate, normalize
 * and format International Bank Account Numbers (ISO 13616).
 *
 * Validation follows the standard mod-97 algorithm using chunked arithmetic
 * because IBANs can exceed JavaScript's safe integer range.
 */

// ISO 13616 IBAN lengths for selected countries (country code -> total length).
export const IBAN_LENGTHS = {
  AL: 28, AD: 24, AT: 20, AZ: 28, BH: 22, BE: 16, BA: 20, BR: 29,
  BG: 22, CR: 22, HR: 21, CY: 28, CZ: 24, DK: 18, DO: 28, EE: 20,
  FO: 18, FI: 18, FR: 27, GE: 22, DE: 22, GI: 23, GR: 27, GL: 18,
  GT: 28, HU: 28, IS: 26, IE: 22, IL: 23, IT: 27, JO: 30, KZ: 20,
  XK: 20, KW: 30, LV: 21, LB: 28, LI: 21, LT: 20, LU: 20, MK: 19,
  MT: 31, MR: 27, MU: 30, MC: 27, MD: 24, ME: 22, NL: 18, NO: 15,
  PK: 24, PS: 29, PL: 28, PT: 25, QA: 29, RO: 24, SM: 27, SA: 24,
  RS: 22, SK: 24, SI: 19, ES: 24, SE: 24, CH: 21, TN: 24, TR: 26,
  AE: 23, GB: 22, VG: 24,
}

// Countries offered in the generator with localised labels.
export const COUNTRY_PRESETS = [
  { code: 'DE', label: 'Germany', labelPt: 'Alemanha' },
  { code: 'GB', label: 'United Kingdom', labelPt: 'Reino Unido' },
  { code: 'FR', label: 'France', labelPt: 'França' },
  { code: 'ES', label: 'Spain', labelPt: 'Espanha' },
  { code: 'IT', label: 'Italy', labelPt: 'Itália' },
  { code: 'PT', label: 'Portugal', labelPt: 'Portugal' },
  { code: 'NL', label: 'Netherlands', labelPt: 'Países Baixos' },
  { code: 'BE', label: 'Belgium', labelPt: 'Bélgica' },
  { code: 'CH', label: 'Switzerland', labelPt: 'Suíça' },
  { code: 'AT', label: 'Austria', labelPt: 'Áustria' },
  { code: 'IE', label: 'Ireland', labelPt: 'Irlanda' },
  { code: 'SE', label: 'Sweden', labelPt: 'Suécia' },
  { code: 'DK', label: 'Denmark', labelPt: 'Dinamarca' },
  { code: 'NO', label: 'Norway', labelPt: 'Noruega' },
  { code: 'FI', label: 'Finland', labelPt: 'Finlândia' },
  { code: 'PL', label: 'Poland', labelPt: 'Polônia' },
  { code: 'BR', label: 'Brazil', labelPt: 'Brasil' },
]

export const FORMATS = {
  grouped: { id: 'grouped', label: 'Grouped (4 chars)', labelPt: 'Agrupado (4 caracteres)', example: 'GB82 WEST 1234 5698 7654 32' },
  compact: { id: 'compact', label: 'Compact', labelPt: 'Compacto', example: 'GB82WEST12345698765432' },
}

export function normalize(iban) {
  if (typeof iban !== 'string') return ''
  return iban.replace(/\s+/g, '').toUpperCase()
}

export function formatIban(iban, style = 'grouped') {
  const clean = normalize(iban)
  if (style === 'compact') return clean
  return clean.match(/.{1,4}/g)?.join(' ') || clean
}

// Convert letters A-Z to 10-35.
function charToNumber(char) {
  const code = char.charCodeAt(0)
  if (code >= 65 && code <= 90) return String(code - 55)
  if (code >= 48 && code <= 57) return char
  return ''
}

function ibanToNumeric(iban) {
  // Move the first four characters to the end, then replace letters.
  const rearranged = iban.slice(4) + iban.slice(0, 4)
  return rearranged.split('').map(charToNumber).join('')
}

// Compute mod-97 on a numeric string that may be longer than JS safe int.
function mod97(numericString) {
  let chunk = numericString.slice(0, 9)
  let remainder = parseInt(chunk, 10) % 97
  let pos = 9

  while (pos < numericString.length) {
    chunk = String(remainder) + numericString.slice(pos, pos + 7)
    remainder = parseInt(chunk, 10) % 97
    pos += 7
  }

  return remainder
}

export function calculateCheckDigits(countryCode, bban) {
  const temp = normalize(countryCode + '00' + bban)
  const numeric = ibanToNumeric(temp)
  const check = 98 - mod97(numeric)
  return String(check).padStart(2, '0')
}

export function isValid(iban) {
  const clean = normalize(iban)
  if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/.test(clean)) return false

  const country = clean.slice(0, 2)
  const expectedLength = IBAN_LENGTHS[country]
  if (!expectedLength) return false
  if (clean.length !== expectedLength) return false

  return mod97(ibanToNumeric(clean)) === 1
}

export function getIbanInfo(iban) {
  const clean = normalize(iban)
  const country = clean.slice(0, 2)
  const expectedLength = IBAN_LENGTHS[country]

  if (!expectedLength) {
    return { valid: false, clean, reason: 'unknownCountry' }
  }

  if (clean.length !== expectedLength) {
    return {
      valid: false,
      clean,
      reason: 'wrongLength',
      expectedLength,
      actualLength: clean.length,
    }
  }

  if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/.test(clean)) {
    return { valid: false, clean, reason: 'invalidChars' }
  }

  const remainder = mod97(ibanToNumeric(clean))
  if (remainder !== 1) {
    return {
      valid: false,
      clean,
      reason: 'checksum',
      remainder,
      expectedCheck: calculateCheckDigits(country, clean.slice(4)),
    }
  }

  return {
    valid: true,
    clean,
    country,
    checkDigits: clean.slice(2, 4),
    bban: clean.slice(4),
    length: clean.length,
    formatted: {
      grouped: formatIban(clean, 'grouped'),
      compact: formatIban(clean, 'compact'),
    },
  }
}

function randomNumericString(length) {
  let result = ''
  for (let i = 0; i < length; i += 1) {
    result += Math.floor(Math.random() * 10)
  }
  return result
}

function randomAlphanumericString(length) {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  let result = ''
  for (let i = 0; i < length; i += 1) {
    result += chars[Math.floor(Math.random() * chars.length)]
  }
  return result
}

export function generateIban({
  country = 'DE',
  format = 'grouped',
  numericOnly = false,
} = {}) {
  const length = IBAN_LENGTHS[country]
  if (!length) return null

  const bbanLength = length - 4
  // Most real-world BBANs are numeric; some countries use letters in parts of
  // the BBAN. For generated examples we keep them numeric-only unless the
  // caller wants alphanumeric, ensuring the checksum is always valid.
  const bban = numericOnly
    ? randomNumericString(bbanLength)
    : randomAlphanumericString(bbanLength)

  const checkDigits = calculateCheckDigits(country, bban)
  const iban = country + checkDigits + bban
  return formatIban(iban, format)
}

export function generateMultiple(count, options) {
  const ibans = new Set()
  let attempts = 0
  while (ibans.size < count && attempts < count * 100) {
    ibans.add(generateIban(options))
    attempts += 1
  }
  return Array.from(ibans)
}
