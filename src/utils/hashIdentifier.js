/**
 * Hash Identifier — identifica algoritmos de hash/derivacao de senha a partir
 * do padrao textual, 100% client-side. Nao faz ataques reais, apenas olha o
 * formato (comprimento, prefixos, alfabeto).
 */

export const HASH_CATEGORIES = {
  hex: 'hex',
  password: 'password',
  checksum: 'checksum',
  crypt: 'crypt',
  unknown: 'unknown',
}

// Cada entrada descreve um formato reconhecido.
// `test` recebe o input limpo (sem espacos extras) e deve retornar true/false.
export const ALGORITHMS = [
  // Hashes hex comuns — comprimento e apenas hexa
  {
    id: 'crc32',
    name: 'CRC-32',
    namePt: 'CRC-32',
    category: HASH_CATEGORIES.checksum,
    bits: 32,
    hexLength: 8,
    test: (clean) => clean.length === 8 && /^[0-9a-f]+$/.test(clean),
  },
  {
    id: 'adler32',
    name: 'Adler-32',
    namePt: 'Adler-32',
    category: HASH_CATEGORIES.checksum,
    bits: 32,
    hexLength: 8,
    test: (clean) => clean.length === 8 && /^[0-9a-f]+$/.test(clean),
  },
  {
    id: 'md5',
    name: 'MD5',
    namePt: 'MD5',
    category: HASH_CATEGORIES.hex,
    bits: 128,
    hexLength: 32,
    test: (clean) => clean.length === 32 && /^[0-9a-f]+$/.test(clean),
  },
  {
    id: 'md5-half',
    name: 'MD5 (half)',
    namePt: 'MD5 (metade)',
    category: HASH_CATEGORIES.hex,
    bits: 64,
    hexLength: 16,
    test: (clean) => clean.length === 16 && /^[0-9a-f]+$/.test(clean),
  },
  {
    id: 'sha1',
    name: 'SHA-1',
    namePt: 'SHA-1',
    category: HASH_CATEGORIES.hex,
    bits: 160,
    hexLength: 40,
    test: (clean) => clean.length === 40 && /^[0-9a-f]+$/.test(clean),
  },
  {
    id: 'ripemd160',
    name: 'RIPEMD-160',
    namePt: 'RIPEMD-160',
    category: HASH_CATEGORIES.hex,
    bits: 160,
    hexLength: 40,
    test: (clean) => clean.length === 40 && /^[0-9a-f]+$/.test(clean),
  },
  {
    id: 'sha224',
    name: 'SHA-224',
    namePt: 'SHA-224',
    category: HASH_CATEGORIES.hex,
    bits: 224,
    hexLength: 56,
    test: (clean) => clean.length === 56 && /^[0-9a-f]+$/.test(clean),
  },
  {
    id: 'sha256',
    name: 'SHA-256',
    namePt: 'SHA-256',
    category: HASH_CATEGORIES.hex,
    bits: 256,
    hexLength: 64,
    test: (clean) => clean.length === 64 && /^[0-9a-f]+$/.test(clean),
  },
  {
    id: 'sha3-256',
    name: 'SHA3-256',
    namePt: 'SHA3-256',
    category: HASH_CATEGORIES.hex,
    bits: 256,
    hexLength: 64,
    test: (clean) => clean.length === 64 && /^[0-9a-f]+$/.test(clean),
  },
  {
    id: 'keccak256',
    name: 'Keccak-256 (Ethereum)',
    namePt: 'Keccak-256 (Ethereum)',
    category: HASH_CATEGORIES.hex,
    bits: 256,
    hexLength: 64,
    test: (clean) => clean.length === 64 && /^[0-9a-f]+$/.test(clean),
  },
  {
    id: 'sha384',
    name: 'SHA-384',
    namePt: 'SHA-384',
    category: HASH_CATEGORIES.hex,
    bits: 384,
    hexLength: 96,
    test: (clean) => clean.length === 96 && /^[0-9a-f]+$/.test(clean),
  },
  {
    id: 'sha512',
    name: 'SHA-512',
    namePt: 'SHA-512',
    category: HASH_CATEGORIES.hex,
    bits: 512,
    hexLength: 128,
    test: (clean) => clean.length === 128 && /^[0-9a-f]+$/.test(clean),
  },
  {
    id: 'sha3-512',
    name: 'SHA3-512',
    namePt: 'SHA3-512',
    category: HASH_CATEGORIES.hex,
    bits: 512,
    hexLength: 128,
    test: (clean) => clean.length === 128 && /^[0-9a-f]+$/.test(clean),
  },
  {
    id: 'whirlpool',
    name: 'Whirlpool',
    namePt: 'Whirlpool',
    category: HASH_CATEGORIES.hex,
    bits: 512,
    hexLength: 128,
    test: (clean) => clean.length === 128 && /^[0-9a-f]+$/.test(clean),
  },
  {
    id: 'tiger192',
    name: 'Tiger (192 bits)',
    namePt: 'Tiger (192 bits)',
    category: HASH_CATEGORIES.hex,
    bits: 192,
    hexLength: 48,
    test: (clean) => clean.length === 48 && /^[0-9a-f]+$/.test(clean),
  },

  // Formas compactas / base64 nao analisadas aqui, mas detectamos que eh base64.
  {
    id: 'base64-hash',
    name: 'Base64-encoded digest',
    namePt: 'Digest codificado em Base64',
    category: HASH_CATEGORIES.unknown,
    bits: null,
    hexLength: null,
    test: (clean, raw) => /^[A-Za-z0-9+/=]+$/.test(raw) && raw.length % 4 === 0 && !/^[0-9a-f]+$/i.test(raw),
  },

  // Unix crypt
  {
    id: 'crypt-md5',
    name: 'Unix crypt MD5 ($1$)',
    namePt: 'Unix crypt MD5 ($1$)',
    category: HASH_CATEGORIES.crypt,
    bits: null,
    hexLength: null,
    test: (_, raw) => /^\$1\$[^$]+\$[./0-9A-Za-z]{22}$/.test(raw),
  },
  {
    id: 'crypt-sha256',
    name: 'Unix crypt SHA-256 ($5$)',
    namePt: 'Unix crypt SHA-256 ($5$)',
    category: HASH_CATEGORIES.crypt,
    bits: 256,
    hexLength: null,
    test: (_, raw) => /^\$5\$[^$]+\$[./0-9A-Za-z]{43}$/.test(raw),
  },
  {
    id: 'crypt-sha512',
    name: 'Unix crypt SHA-512 ($6$)',
    namePt: 'Unix crypt SHA-512 ($6$)',
    category: HASH_CATEGORIES.crypt,
    bits: 512,
    hexLength: null,
    test: (_, raw) => /^\$6\$[^$]+\$[./0-9A-Za-z]{86}$/.test(raw),
  },
  {
    id: 'crypt-bcrypt',
    name: 'bcrypt ($2a$/$2b$/$2y$)',
    namePt: 'bcrypt ($2a$/$2b$/$2y$)',
    category: HASH_CATEGORIES.password,
    bits: 184,
    hexLength: null,
    test: (_, raw) => /^\$2[aby]\$\d{2}\$[./0-9A-Za-z]{53}$/.test(raw),
  },
  {
    id: 'crypt-yescrypt',
    name: 'yescrypt ($y$)',
    namePt: 'yescrypt ($y$)',
    category: HASH_CATEGORIES.password,
    bits: null,
    hexLength: null,
    test: (_, raw) => /^\$y\$[^$]*\$[./0-9A-Za-z]+$/.test(raw),
  },
  {
    id: 'crypt-gost',
    name: 'gost-yescrypt ($gy$)',
    namePt: 'gost-yescrypt ($gy$)',
    category: HASH_CATEGORIES.password,
    bits: null,
    hexLength: null,
    test: (_, raw) => /^\$gy\$[^$]*\$[./0-9A-Za-z]+$/.test(raw),
  },

  // Password-hashing modernos
  {
    id: 'argon2id',
    name: 'Argon2id',
    namePt: 'Argon2id',
    category: HASH_CATEGORIES.password,
    bits: null,
    hexLength: null,
    test: (_, raw) => /^\$argon2id\$v=\d+\$m=\d+,t=\d+,p=\d+\$[A-Za-z0-9+/=]+\$[A-Za-z0-9+/=]+$/.test(raw),
  },
  {
    id: 'argon2i',
    name: 'Argon2i',
    namePt: 'Argon2i',
    category: HASH_CATEGORIES.password,
    bits: null,
    hexLength: null,
    test: (_, raw) => /^\$argon2i\$v=\d+\$m=\d+,t=\d+,p=\d+\$[A-Za-z0-9+/=]+\$[A-Za-z0-9+/=]+$/.test(raw),
  },
  {
    id: 'argon2d',
    name: 'Argon2d',
    namePt: 'Argon2d',
    category: HASH_CATEGORIES.password,
    bits: null,
    hexLength: null,
    test: (_, raw) => /^\$argon2d\$v=\d+\$m=\d+,t=\d+,p=\d+\$[A-Za-z0-9+/=]+\$[A-Za-z0-9+/=]+$/.test(raw),
  },
  {
    id: 'scrypt',
    name: 'scrypt',
    namePt: 'scrypt',
    category: HASH_CATEGORIES.password,
    bits: null,
    hexLength: null,
    test: (_, raw) => /^\$scrypt\$N=\d+,r=\d+,p=\d+\$[A-Za-z0-9+/=]+\$[A-Za-z0-9+/=]+$/.test(raw),
  },
  {
    id: 'pbkdf2-sha256',
    name: 'PBKDF2-HMAC-SHA256',
    namePt: 'PBKDF2-HMAC-SHA256',
    category: HASH_CATEGORIES.password,
    bits: 256,
    hexLength: null,
    test: (_, raw) => /^\$pbkdf2-sha256\$\d+\$[A-Za-z0-9+/=]+\$[A-Za-z0-9+/=]+$/.test(raw),
  },
  {
    id: 'pbkdf2-sha512',
    name: 'PBKDF2-HMAC-SHA512',
    namePt: 'PBKDF2-HMAC-SHA512',
    category: HASH_CATEGORIES.password,
    bits: 512,
    hexLength: null,
    test: (_, raw) => /^\$pbkdf2-sha512\$\d+\$[A-Za-z0-9+/=]+\$[A-Za-z0-9+/=]+$/.test(raw),
  },
  {
    id: 'django-pbkdf2',
    name: 'Django PBKDF2 (pbkdf2_sha256$)',
    namePt: 'Django PBKDF2 (pbkdf2_sha256$)',
    category: HASH_CATEGORIES.password,
    bits: 256,
    hexLength: null,
    test: (_, raw) => /^pbkdf2_sha256\$\d+\$[A-Za-z0-9+/=]+\$[A-Za-z0-9+/=]+$/.test(raw),
  },
]

export function normalizeInput(input) {
  return (input || '').trim()
}

export function cleanHex(input) {
  return input.toLowerCase().replace(/[^0-9a-f]/g, '')
}

function looksLikeBase64(str) {
  return /^[A-Za-z0-9+/=]+$/.test(str) && str.length % 4 === 0 && str.length > 0
}

function looksLikeHex(str) {
  return /^[0-9a-f]+$/i.test(str)
}

export function identifyHash(input) {
  const raw = normalizeInput(input)
  if (!raw) return { raw: '', clean: '', candidates: [], isHex: false, isBase64: false, length: 0 }

  const clean = cleanHex(raw)
  const isHex = looksLikeHex(raw)
  const isBase64 = looksLikeBase64(raw) && !isHex

  const candidates = ALGORITHMS.filter((alg) => alg.test(clean, raw)).map((alg) => {
    // Calcula confianca heuristica.
    let confidence = 'medium'
    if (alg.category === HASH_CATEGORIES.password || alg.category === HASH_CATEGORIES.crypt) {
      confidence = 'high'
    } else if (alg.hexLength && clean.length === alg.hexLength && isHex) {
      // Apenas hexa do tamanho exato = alta, mas varios algs podem compartilhar
      // o mesmo tamanho, entao mantemos medium a menos que seja o unico.
      confidence = 'medium'
    }
    return { ...alg, confidence }
  })

  // Se houver apenas um candidato hex do tamanho exato, sobe para alta.
  const hexExact = candidates.filter((c) => c.hexLength && clean.length === c.hexLength)
  if (hexExact.length === 1 && isHex) {
    hexExact[0].confidence = 'high'
  }

  // Ordena: alta confianca primeiro, depois bits decrescentes.
  candidates.sort((a, b) => {
    const score = (c) => (c.confidence === 'high' ? 2 : c.confidence === 'medium' ? 1 : 0)
    if (score(b) !== score(a)) return score(b) - score(a)
    return (b.bits || 0) - (a.bits || 0)
  })

  return {
    raw,
    clean,
    length: raw.length,
    hexLength: clean.length,
    isHex,
    isBase64,
    candidates,
  }
}

export function getConfidenceColor(confidence) {
  switch (confidence) {
    case 'high': return 'green'
    case 'medium': return 'orange'
    default: return 'default'
  }
}

export const QUICK_EXAMPLES = {
  md5: '5d41402abc4b2a76b9719d911017c592',
  sha1: 'aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d',
  sha256: '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824',
  bcrypt: '$2b$12$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW',
  argon2id: '$argon2id$v=19$m=65536,t=3,p=4$c29tZXNhbHRzb21lc2FsdA$RdescudvJCsgp3ZSGzFqLpSnFSmHe5WlnOvW+aSYYY0',
  scrypt: '$scrypt$N=16384,r=8,p=1$c29tZXNhbHQ$2bpPSWb2jZ5x9iP1e8vRwN2L8dAqtfE2uG7ArB6+qgM',
  pbkdf2: '$pbkdf2-sha256$29000$N2YMIWQsZWwNwdgbQwhhzA$1t8iyhBHS6q2g0mm8ZF02X7Lc4T0Ldb1ZmJaLJOeBcw',
  crc32: 'cbf43926',
}
