// Gerador de padrões regex para validações comuns — 100% client-side.
// Os padrões são armazenados como strings para facilitar a cópia e a
// exibição; a função buildRegex() transforma uma string em RegExp real.

export const CATEGORIES = [
  { key: 'web', pt: 'Web', en: 'Web' },
  { key: 'identifiers', pt: 'Identificadores', en: 'Identifiers' },
  { key: 'brazil', pt: 'Brasil', en: 'Brazil' },
  { key: 'numbers', pt: 'Números', en: 'Numbers' },
  { key: 'dateTime', pt: 'Data e Hora', en: 'Date and Time' },
  { key: 'network', pt: 'Rede', en: 'Network' },
  { key: 'text', pt: 'Texto', en: 'Text' },
]

export const PATTERNS = [
  {
    id: 'email',
    category: 'web',
    name: { pt: 'E-mail', en: 'E-mail' },
    regex: String.raw`^[a-zA-Z0-9.!#$%&'*+/=?^_\x60{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$`,
    flags: '',
    description: {
      pt: 'Endereço de e-mail compatível com a especificação HTML5. Aceita a maioria dos caracteres válidos no local-part, mas não exige que o domínio exista de verdade.',
      en: 'E-mail address compatible with the HTML5 spec. Accepts most valid local-part characters, but does not verify that the domain actually exists.',
    },
    valid: ['hello@example.com', 'user.name+tag@sub.domain.co.uk'],
    invalid: ['plainaddress', '@missinglocal.com', 'missing@domain'],
  },
  {
    id: 'url',
    category: 'web',
    name: { pt: 'URL (http/https/ftp)', en: 'URL (http/https/ftp)' },
    regex: String.raw`^https?:\/\/(?:[\w-]+(?:(?:\.[\w-]+)+)|localhost)(?::\d{2,5})?(?:\/\S*)?$`,
    flags: '',
    description: {
      pt: 'URL com protocolo http ou https (ou ftp simples, se adaptado). Valida domínio, porta opcional e caminho. Não aceita URLs sem protocolo.',
      en: 'URL with http or https protocol (or simple ftp if adapted). Validates domain, optional port and path. Does not accept protocol-relative URLs.',
    },
    valid: ['https://example.com', 'http://localhost:3000/api/v1'],
    invalid: ['example.com', 'ftp://missing-dot-com'],
  },
  {
    id: 'slug',
    category: 'web',
    name: { pt: 'Slug (URL amigável)', en: 'URL-friendly slug' },
    regex: String.raw`^[a-z0-9]+(?:-[a-z0-9]+)*$`,
    flags: '',
    description: {
      pt: 'Slug minúsculo separado por hífens, sem espaços nem caracteres especiais. Útil para URLs de posts e produtos.',
      en: 'Lowercase hyphen-separated slug, no spaces or special characters. Useful for post and product URLs.',
    },
    valid: ['hello-world', 'product-123'],
    invalid: ['Hello World', 'double--hyphen', 'trailing-'],
  },
  {
    id: 'uuid',
    category: 'identifiers',
    name: { pt: 'UUID v4', en: 'UUID v4' },
    regex: String.raw`^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$`,
    flags: '',
    description: {
      pt: 'UUID versão 4 no formato canônico 8-4-4-4-12. Exige que a versão seja 4 e o variant byte esteja no intervalo 8/9/a/b.',
      en: 'Version 4 UUID in canonical 8-4-4-4-12 format. Requires version 4 and the variant byte in the 8/9/a/b range.',
    },
    valid: ['550e8400-e29b-41d4-a716-446655440000'],
    invalid: ['550e8400-e29b-11d4-a716-446655440000', 'not-a-uuid'],
  },
  {
    id: 'uuid-generic',
    category: 'identifiers',
    name: { pt: 'UUID (qualquer versão)', en: 'UUID (any version)' },
    regex: String.raw`^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$`,
    flags: '',
    description: {
      pt: 'Qualquer UUID no formato canônico, sem verificar a versão. Útil quando você só precisa do formato.',
      en: 'Any UUID in canonical format, without version checks. Useful when you only need the shape.',
    },
    valid: ['550e8400-e29b-41d4-a716-446655440000'],
    invalid: ['550e8400e29b41d4a716446655440000'],
  },
  {
    id: 'hex-color',
    category: 'identifiers',
    name: { pt: 'Cor Hexadecimal (#RGB ou #RRGGBB)', en: 'Hex color (#RGB or #RRGGBB)' },
    regex: String.raw`^#(?:[0-9a-fA-F]{3}){1,2}$`,
    flags: '',
    description: {
      pt: 'Cores CSS hexadecimais de 3 ou 6 dígitos, com # obrigatório. Não aceita alpha (#RRGGBBAA) nem nomes de cor.',
      en: 'CSS hexadecimal colors with 3 or 6 digits, # required. Does not accept alpha (#RRGGBBAA) or color names.',
    },
    valid: ['#ff5733', '#F0F'],
    invalid: ['ff5733', '#gggggg'],
  },
  {
    id: 'semver',
    category: 'identifiers',
    name: { pt: 'SemVer', en: 'SemVer' },
    regex: String.raw`^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$`,
    flags: '',
    description: {
      pt: 'Versionamento SemVer 2.0.0 completo: MAJOR.MINOR.PATCH, pre-release e build metadata opcionais. Não permite zeros à esquerda.',
      en: 'Full SemVer 2.0.0: MAJOR.MINOR.PATCH, optional pre-release and build metadata. No leading zeros.',
    },
    valid: ['1.2.3', '0.0.1-alpha.1+exp.sha.5114f85'],
    invalid: ['1.2', '01.2.3', '1.2.3-'],
  },
  {
    id: 'cpf',
    category: 'brazil',
    name: { pt: 'CPF (formato)', en: 'CPF (format)' },
    regex: String.raw`^\d{3}\.\d{3}\.\d{3}-\d{2}$`,
    flags: '',
    description: {
      pt: 'Formato brasileiro de CPF: 000.000.000-00. Valida apenas a máscara; use a ferramenta de CPF/CNPJ para conferir os dígitos verificadores.',
      en: 'Brazilian CPF format: 000.000.000-00. Validates only the mask; use the CPF/CNPJ tool to check the verification digits.',
    },
    valid: ['123.456.789-09'],
    invalid: ['12345678909', '123.456.789-0'],
  },
  {
    id: 'cnpj',
    category: 'brazil',
    name: { pt: 'CNPJ (formato)', en: 'CNPJ (format)' },
    regex: String.raw`^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$`,
    flags: '',
    description: {
      pt: 'Formato brasileiro de CNPJ: 00.000.000/0000-00. Valida apenas a máscara.',
      en: 'Brazilian CNPJ format: 00.000.000/0000-00. Validates only the mask.',
    },
    valid: ['12.345.678/0001-95'],
    invalid: ['12345678000195', '12.345.678/0001-9'],
  },
  {
    id: 'cep',
    category: 'brazil',
    name: { pt: 'CEP', en: 'Brazilian ZIP (CEP)' },
    regex: String.raw`^\d{5}-?\d{3}$`,
    flags: '',
    description: {
      pt: 'CEP brasileiro com ou sem hífen: 00000-000 ou 00000000.',
      en: 'Brazilian ZIP code with or without hyphen: 00000-000 or 00000000.',
    },
    valid: ['01310-100', '01310100'],
    invalid: ['01310-10', 'abcdefgh'],
  },
  {
    id: 'br-phone',
    category: 'brazil',
    name: { pt: 'Telefone brasileiro', en: 'Brazilian phone number' },
    regex: String.raw`^(?:\(?\d{2}\)?\s?)?(?:9\d{4}-?\d{4}|\d{4}-?\d{4})$`,
    flags: '',
    description: {
      pt: 'Número de telefone/celular brasileiro com DDD opcional. Aceita com ou sem parênteses, espaço e hífen.',
      en: 'Brazilian landline/mobile number with optional area code. Accepts parentheses, spaces and hyphens.',
    },
    valid: ['(11) 91234-5678', '11912345678', '1234-5678'],
    invalid: ['12345', '11 1234-567'],
  },
  {
    id: 'credit-card',
    category: 'numbers',
    name: { pt: 'Cartão de crédito', en: 'Credit card' },
    regex: String.raw`^(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|6(?:011|5[0-9]{2})[0-9]{12}|(?:2131|1800|35\d{3})\d{11})$`,
    flags: '',
    description: {
      pt: 'Formato de cartão das principais bandeiras (Visa, Mastercard, Amex, Diners, Discover, JCB). Não valida o algoritmo de Luhn.',
      en: 'Card format for major brands (Visa, Mastercard, Amex, Diners, Discover, JCB). Does not validate the Luhn algorithm.',
    },
    valid: ['4111111111111111', '5500000000000004'],
    invalid: ['1234567890123456', '4111-1111-1111-1111'],
  },
  {
    id: 'integer',
    category: 'numbers',
    name: { pt: 'Inteiro', en: 'Integer' },
    regex: String.raw`^-?\d+$`,
    flags: '',
    description: {
      pt: 'Número inteiro com sinal opcional. Não aceita casas decimais, separadores de milhar ou expoentes.',
      en: 'Signed integer. No decimals, thousands separators or exponents.',
    },
    valid: ['-42', '0', '123456'],
    invalid: ['3.14', '1,000', '12e3'],
  },
  {
    id: 'positive-integer',
    category: 'numbers',
    name: { pt: 'Inteiro positivo', en: 'Positive integer' },
    regex: String.raw`^[1-9]\d*$`,
    flags: '',
    description: {
      pt: 'Inteiro maior que zero. Zeros à esquerda e o próprio zero são rejeitados.',
      en: 'Integer greater than zero. Leading zeros and zero itself are rejected.',
    },
    valid: ['1', '42', '1000'],
    invalid: ['0', '007', '-3'],
  },
  {
    id: 'decimal',
    category: 'numbers',
    name: { pt: 'Decimal', en: 'Decimal' },
    regex: String.raw`^-?\d+(?:\.\d+)?$`,
    flags: '',
    description: {
      pt: 'Número decimal com ponto como separador. Aceita parte fracionária opcional, mas não ponto isolado.',
      en: 'Decimal number with dot separator. Optional fractional part, no lone dot.',
    },
    valid: ['3.14', '-0.5', '42'],
    invalid: ['.', '3.', '-'],
  },
  {
    id: 'date-iso',
    category: 'dateTime',
    name: { pt: 'Data ISO 8601', en: 'ISO 8601 date' },
    regex: String.raw`^\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])$`,
    flags: '',
    description: {
      pt: 'Data no formato ISO 8601 (YYYY-MM-DD). Valida meses e dias básicos, mas não anos bissextos.',
      en: 'Date in ISO 8601 format (YYYY-MM-DD). Validates basic month/day ranges, not leap years.',
    },
    valid: ['2024-02-29', '1999-12-31'],
    invalid: ['31/12/1999', '2024-13-01', '2024-00-10'],
  },
  {
    id: 'date-br',
    category: 'dateTime',
    name: { pt: 'Data brasileira (DD/MM/YYYY)', en: 'Brazilian date (DD/MM/YYYY)' },
    regex: String.raw`^(?:0[1-9]|[12]\d|3[01])\/(?:0[1-9]|1[0-2])\/\d{4}$`,
    flags: '',
    description: {
      pt: 'Data no formato brasileiro DD/MM/YYYY. Não valida meses de 30/31 dias nem anos bissextos.',
      en: 'Date in Brazilian format DD/MM/YYYY. Does not validate 30/31-day months or leap years.',
    },
    valid: ['29/02/2024', '31/12/1999'],
    invalid: ['1999-12-31', '32/01/2024'],
  },
  {
    id: 'time-24h',
    category: 'dateTime',
    name: { pt: 'Horário 24h', en: '24-hour time' },
    regex: String.raw`^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$`,
    flags: '',
    description: {
      pt: 'Horário no formato HH:MM ou HH:MM:SS, de 00:00:00 a 23:59:59.',
      en: 'Time in HH:MM or HH:MM:SS format, from 00:00:00 to 23:59:59.',
    },
    valid: ['14:30', '23:59:59', '00:00'],
    invalid: ['24:00', '12:60', '9:00'],
  },
  {
    id: 'ipv4',
    category: 'network',
    name: { pt: 'IPv4', en: 'IPv4' },
    regex: String.raw`^(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$`,
    flags: '',
    description: {
      pt: 'Endereço IPv4 com quatro octetos de 0 a 255 separados por pontos. Não aceita prefixos CIDR.',
      en: 'IPv4 address with four 0-255 octets separated by dots. Does not accept CIDR prefixes.',
    },
    valid: ['192.168.0.1', '255.255.255.0', '8.8.8.8'],
    invalid: ['256.1.1.1', '192.168.0', '192.168.0.1/24'],
  },
  {
    id: 'ipv6',
    category: 'network',
    name: { pt: 'IPv6', en: 'IPv6' },
    regex: String.raw`^(?:(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|(?:[0-9a-fA-F]{1,4}:){1,7}:|(?:[0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|(?:[0-9a-fA-F]{1,4}:){1,5}(?::[0-9a-fA-F]{1,4}){1,2}|(?:[0-9a-fA-F]{1,4}:){1,4}(?::[0-9a-fA-F]{1,4}){1,3}|(?:[0-9a-fA-F]{1,4}:){1,3}(?::[0-9a-fA-F]{1,4}){1,4}|(?:[0-9a-fA-F]{1,4}:){1,2}(?::[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:(?:(?::[0-9a-fA-F]{1,4}){1,6})|:(?:(?::[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(?::[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(?:ffff(?::0{1,4}){0,1}:){0,1}(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)|(?:[0-9a-fA-F]{1,4}:){1,4}:(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d))$`,
    flags: '',
    description: {
      pt: 'Endereço IPv6 completo, incluindo notação compacta (::), IPv4-mapped e link-local com zone index.',
      en: 'Full IPv6 address, including compressed notation (::), IPv4-mapped and link-local with zone index.',
    },
    valid: ['2001:0db8:85a3:0000:0000:8a2e:0370:7334', '::1', 'fe80::1%eth0'],
    invalid: ['1200::AB00:1234::2552:7777:1313', '::g'], // IPv6 repetido :: é inválido
  },
  {
    id: 'mac-address',
    category: 'network',
    name: { pt: 'Endereço MAC', en: 'MAC address' },
    regex: String.raw`^(?:[0-9a-fA-F]{2}[:-]){5}[0-9a-fA-F]{2}$`,
    flags: '',
    description: {
      pt: 'Endereço MAC de 48 bits separado por dois pontos ou hífens.',
      en: '48-bit MAC address separated by colons or hyphens.',
    },
    valid: ['00:1B:44:11:3A:B7', '00-1B-44-11-3A-B7'],
    invalid: ['001B44113AB7', '00:1B:44:11:3A:G7'],
  },
  {
    id: 'strong-password',
    category: 'text',
    name: { pt: 'Senha forte', en: 'Strong password' },
    regex: String.raw`^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$`,
    flags: '',
    description: {
      pt: 'Mínimo 8 caracteres, pelo menos uma letra minúscula, uma maiúscula, um dígito e um caractere especial. Ajuste conforme sua política de segurança.',
      en: 'At least 8 characters, one lowercase, one uppercase, one digit and one special character. Adjust to your security policy.',
    },
    valid: ['P@ssw0rd', 'Complex#123'],
    invalid: ['password', '12345678', 'Password1'],
  },
  {
    id: 'youtube-url',
    category: 'web',
    name: { pt: 'URL do YouTube', en: 'YouTube URL' },
    regex: String.raw`^(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)[a-zA-Z0-9_-]{11}`,
    flags: '',
    description: {
      pt: 'Link de vídeo do YouTube (youtube.com/watch, /embed, /shorts ou youtu.be). Captura o ID de 11 caracteres no início do caminho/query.',
      en: 'YouTube video link (youtube.com/watch, /embed, /shorts or youtu.be). Captures the 11-character ID from path/query.',
    },
    valid: ['https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'https://youtu.be/dQw4w9WgXcQ'],
    invalid: ['https://youtube.com', 'https://youtu.be/short'],
  },
  {
    id: 'twitter-handle',
    category: 'web',
    name: { pt: 'Handle do X/Twitter', en: 'X/Twitter handle' },
    regex: String.raw`^@?[a-zA-Z0-9_]{1,15}$`,
    flags: '',
    description: {
      pt: 'Nome de usuário do X/Twitter com @ opcional. Máximo 15 caracteres, apenas letras, números e underscore.',
      en: 'X/Twitter username with optional @. Max 15 characters, letters, numbers and underscores only.',
    },
    valid: ['@jack', 'eventifylab'],
    invalid: ['@user-name', '@verylonghandle123456'],
  },
]

export function getPatternById(id) {
  return PATTERNS.find((p) => p.id === id) || null
}

export function getPatternsByCategory(categoryKey) {
  return PATTERNS.filter((p) => p.category === categoryKey)
}

export function buildRegex(pattern, flags = pattern.flags) {
  try {
    return new RegExp(pattern.regex, flags)
  } catch (err) {
    return null
  }
}

export function testPattern(pattern, input, flags = pattern.flags) {
  const re = buildRegex(pattern, flags)
  if (!re) return false
  return re.test(String(input ?? ''))
}

export function findMatches(pattern, input, flags = pattern.flags) {
  const re = buildRegex(pattern, flags.includes('g') ? flags : `${flags}g`)
  if (!re) return []
  return Array.from(String(input ?? '').matchAll(re)).map((m) => ({
    match: m[0],
    index: m.index,
    groups: m.groups || {},
  }))
}

export function snippetJs(pattern, flags = pattern.flags) {
  return `const regex = /${pattern.regex}/${flags};
const isValid = regex.test(value);`
}

export function snippetPython(pattern, flags = pattern.flags) {
  const pyFlags = []
  if (flags.includes('i')) pyFlags.push('re.IGNORECASE')
  if (flags.includes('m')) pyFlags.push('re.MULTILINE')
  if (flags.includes('s')) pyFlags.push('re.DOTALL')
  if (flags.includes('x')) pyFlags.push('re.VERBOSE')
  const flagArg = pyFlags.length ? `, ${pyFlags.join(' | ')}` : ''
  return `import re
regex = re.compile(r"""${pattern.regex}"""${flagArg})
is_valid = bool(regex.match(value))`
}
