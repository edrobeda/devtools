// Decodificador de certificados X.509 (PEM/DER) — 100% client-side, sem
// dependência. Faz o parse da estrutura ASN.1 DER (TLV), extrai os campos
// do TBSCertificate, decodifica extensões comuns e calcula fingerprints de
// SHA-256/SHA-1 via Web Crypto. Também monta certificados de exemplo
// procedurais (self-signed) para a página demonstrar o parser.

// ─────────────────────────── OIDs conhecidos ───────────────────────────
const OID_NAMES = {
  // Algoritmos de chave pública / assinatura
  '1.2.840.113549.1.1.1': 'RSA (rsaEncryption)',
  '1.2.840.113549.1.1.5': 'sha1WithRSAEncryption',
  '1.2.840.113549.1.1.6': 'md5WithRSAEncryption',
  '1.2.840.113549.1.1.10': 'RSASSA-PSS',
  '1.2.840.113549.1.1.11': 'sha256WithRSAEncryption',
  '1.2.840.113549.1.1.12': 'sha384WithRSAEncryption',
  '1.2.840.113549.1.1.13': 'sha512WithRSAEncryption',
  '1.2.840.113549.1.1.14': 'sha224WithRSAEncryption',
  '1.2.840.10045.2.1': 'EC (ecPublicKey)',
  '1.2.840.10045.4.1': 'ecdsa-with-SHA1',
  '1.2.840.10045.4.3.1': 'ecdsa-with-SHA224',
  '1.2.840.10045.4.3.2': 'ecdsa-with-SHA256',
  '1.2.840.10045.4.3.3': 'ecdsa-with-SHA384',
  '1.2.840.10045.4.3.4': 'ecdsa-with-SHA512',
  '1.2.840.10045.3.1.7': 'prime256v1 (secp256r1 / P-256)',
  '1.3.132.0.34': 'secp384r1 (P-384)',
  '1.3.132.0.35': 'secp521r1 (P-521)',
  '1.3.101.110': 'X25519',
  '1.3.101.111': 'X448',
  '1.3.101.112': 'Ed25519',
  '1.3.101.113': 'Ed448',
  // Atributos de nome (RDN)
  '2.5.4.3': 'CN — Common Name',
  '2.5.4.4': 'SN — Surname',
  '2.5.4.5': 'SERIALNUMBER — Serial Number',
  '2.5.4.6': 'C — Country',
  '2.5.4.7': 'L — Locality',
  '2.5.4.8': 'ST — State/Province',
  '2.5.4.9': 'STREET — Street',
  '2.5.4.10': 'O — Organization',
  '2.5.4.11': 'OU — Organizational Unit',
  '2.5.4.12': 'T — Title',
  '2.5.4.13': 'Description',
  '2.5.4.15': 'Business Category',
  '2.5.4.17': 'Postal Code',
  '2.5.4.20': 'Phone Number',
  '1.2.840.113549.1.9.1': 'emailAddress',
  '0.9.2342.19200300.100.1.25': 'DC — Domain Component',
  '1.3.6.1.4.1.311.60.2.1.3': 'jurisdictionOfIncorporationCountryName',
  // Extensões (RFC 5280)
  '2.5.29.9': 'subjectDirectoryAttributes',
  '2.5.29.14': 'subjectKeyIdentifier',
  '2.5.29.15': 'keyUsage',
  '2.5.29.16': 'privateKeyUsagePeriod',
  '2.5.29.17': 'subjectAltName',
  '2.5.29.18': 'issuerAltName',
  '2.5.29.19': 'basicConstraints',
  '2.5.29.30': 'nameConstraints',
  '2.5.29.31': 'cRLDistributionPoints',
  '2.5.29.32': 'certificatePolicies',
  '2.5.29.35': 'authorityKeyIdentifier',
  '2.5.29.36': 'policyConstraints',
  '2.5.29.37': 'extendedKeyUsage',
  '2.5.29.46': 'freshestCRL',
  '1.3.6.1.5.5.7.1.1': 'authorityInfoAccess (AIA)',
  '1.3.6.1.5.5.7.3.1': 'TLS Web Server Authentication',
  '1.3.6.1.5.5.7.3.2': 'TLS Web Client Authentication',
  '1.3.6.1.5.5.7.3.3': 'Code Signing',
  '1.3.6.1.5.5.7.3.4': 'E-mail Protection',
  '1.3.6.1.5.5.7.3.8': 'Time Stamping',
  '1.3.6.1.5.5.7.3.9': 'OCSP Signing',
}

const KEY_USAGE_BITS = [
  'digitalSignature',
  'nonRepudiation',
  'keyEncipherment',
  'dataEncipherment',
  'keyAgreement',
  'keyCertSign',
  'cRLSign',
  'encipherOnly',
  'decipherOnly',
]

// ───────────────────────────── base64 ─────────────────────────────
const B64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

function base64ToBytes(str) {
  const clean = String(str).replace(/\s+/g, '')
  if (!clean) throw new Error('empty')
  // URL-safe variante
  const b64 = clean.replace(/-/g, '+').replace(/_/g, '/')
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(b64)) throw new Error('base64')
  let buffer = ''
  for (let i = 0; i < b64.length; i += 4) {
    const chunk = b64.slice(i, i + 4)
    const pad = chunk.replace(/=+$/, '').length
    let bin = 0
    for (let j = 0; j < 4; j++) {
      const c = chunk[j]
      bin <<= 6
      if (c && c !== '=') bin |= B64_CHARS.indexOf(c)
    }
    buffer += String.fromCharCode(
      (bin >> 16) & 0xff,
      pad > 1 ? (bin >> 8) & 0xff : NaN,
      pad > 2 ? bin & 0xff : NaN
    )
  }
  const out = new Uint8Array(buffer.length)
  for (let i = 0; i < buffer.length; i++) out[i] = buffer.charCodeAt(i)
  return out
}

function bytesToBase64(bytes) {
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  let out = ''
  for (let i = 0; i < bin.length; i += 3) {
    const c1 = bin.charCodeAt(i)
    const c2 = i + 1 < bin.length ? bin.charCodeAt(i + 1) : NaN
    const c3 = i + 2 < bin.length ? bin.charCodeAt(i + 2) : NaN
    out += B64_CHARS[c1 >> 2]
    out += B64_CHARS[((c1 & 3) << 4) | (isNaN(c2) ? 0 : c2 >> 4)]
    out += isNaN(c2) ? '=' : B64_CHARS[((c2 & 15) << 2) | (isNaN(c3) ? 0 : c3 >> 6)]
    out += isNaN(c3) ? '=' : B64_CHARS[c3 & 63]
  }
  return out
}

function hex(bytes) {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

function bytesToBigInt(b) {
  let v = 0n
  for (const x of b) v = v * 256n + BigInt(x)
  return v
}

function bnToHex(v) {
  let s = v.toString(16)
  if (s.length % 2) s = '0' + s
  return s
}

// ─────────────────────── leitor ASN.1 DER (TLV) ───────────────────────
function readTLV(bytes, offset) {
  const start = offset
  const tagByte = bytes[offset]
  if (tagByte === undefined) throw new Error('DER truncado no byte de tag')
  offset++
  const tagClass = tagByte >> 6
  const constructed = (tagByte & 0x20) !== 0
  let tagNum = tagByte & 0x1f
  if (tagNum === 0x1f) {
    tagNum = 0
    let b
    do {
      b = bytes[offset]
      if (b === undefined) throw new Error('DER truncado no tag high-number')
      offset++
      tagNum = tagNum * 128 + (b & 0x7f)
    } while (b & 0x80)
  }
  const firstLen = bytes[offset]
  if (firstLen === undefined) throw new Error('DER truncado no comprimento')
  offset++
  let length
  if ((firstLen & 0x80) === 0) {
    length = firstLen
  } else {
    const n = firstLen & 0x7f
    if (n === 0) throw new Error('Comprimento indefinido não é DER')
    length = 0
    for (let i = 0; i < n; i++) {
      const b = bytes[offset]
      if (b === undefined) throw new Error('DER truncado no comprimento longo')
      offset++
      length = length * 256 + b
    }
  }
  const contentStart = offset
  const contentEnd = contentStart + length
  if (contentEnd > bytes.length) throw new Error('DER truncado no conteúdo')
  return { start, tagClass, constructed, tagNum, contentStart, contentEnd, end: contentEnd }
}

function children(bytes, start, end) {
  const out = []
  let off = start
  while (off < end) {
    const tlv = readTLV(bytes, off)
    if (tlv.end > end) throw new Error('Estrutura ASN.1 desbalanceada')
    out.push(tlv)
    off = tlv.end
  }
  return out
}

// ─────────────────────────── helpers de decode ───────────────────────────
function oidFromBytes(b) {
  if (!b.length) return ''
  const parts = [Math.floor(b[0] / 40), b[0] % 40]
  let x = 0
  for (let i = 1; i < b.length; i++) {
    x = x * 128 + (b[i] & 0x7f)
    if (!(b[i] & 0x80)) {
      parts.push(x)
      x = 0
    }
  }
  return parts.join('.')
}

function decodeString(bytes, tlv) {
  const v = bytes.subarray(tlv.contentStart, tlv.contentEnd)
  if (tlv.tagNum === 0x0c) return new TextDecoder('utf-8').decode(v)
  if (tlv.tagNum === 0x1e) {
    let s = ''
    for (let i = 0; i + 1 < v.length; i += 2) {
      s += String.fromCharCode((v[i] << 8) | v[i + 1])
    }
    return s
  }
  return String.fromCharCode(...Array.from(v))
}

function parseName(bytes, seq) {
  const items = []
  for (const set of children(bytes, seq.contentStart, seq.contentEnd)) {
    for (const av of children(bytes, set.contentStart, set.contentEnd)) {
      const pair = children(bytes, av.contentStart, av.contentEnd)
      if (pair.length < 2) continue
      const oid = oidFromBytes(bytes.subarray(pair[0].contentStart, pair[0].contentEnd))
      const value = decodeString(bytes, pair[1])
      items.push({ oid, oidName: OID_NAMES[oid] || `OID ${oid}`, value })
    }
  }
  return items
}

function nameToLabel(item) {
  return `${item.oidName} = ${item.value}`
}

function parseTime(bytes, tlv) {
  const raw = decodeString(bytes, tlv)
  if (tlv.tagNum === 0x17) {
    const m = raw.match(/^(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})Z$/)
    if (m) {
      const yy = Number(m[1])
      const year = yy >= 50 ? 1900 + yy : 2000 + yy
      const date = new Date(Date.UTC(year, Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5]), Number(m[6])))
      return date.getTime() === date.getTime() ? { raw, date } : { raw }
    }
    return { raw }
  }
  if (tlv.tagNum === 0x18) {
    const m = raw.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(?:\.(\d+))?Z$/)
    if (m) {
      const ms = m[7] ? Math.round(parseFloat('0.' + m[7]) * 1000) : 0
      const date = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5]), Number(m[6]), ms))
      return date.getTime() === date.getTime() ? { raw, date } : { raw }
    }
    return { raw }
  }
  return { raw }
}

function parseAlgorithmIdentifier(bytes, tlv) {
  const kids = children(bytes, tlv.contentStart, tlv.contentEnd)
  if (!kids.length) return { oid: '', name: 'unknown' }
  const oid = oidFromBytes(bytes.subarray(kids[0].contentStart, kids[0].contentEnd))
  let params = null
  if (kids.length > 1) {
    const p = kids[1]
    if (p.tagNum === 0x06) params = OID_NAMES[oidFromBytes(bytes.subarray(p.contentStart, p.contentEnd))] || null
    else if (p.tagNum === 0x05) params = null
  }
  return { oid, name: OID_NAMES[oid] || `OID ${oid}`, params }
}

function parseIpAddress(v) {
  if (v.length === 4) return `${v[0]}.${v[1]}.${v[2]}.${v[3]}`
  if (v.length === 16) {
    const parts = []
    for (let i = 0; i < 16; i += 2) parts.push(((v[i] << 8) | v[i + 1]).toString(16))
    return parts.join(':')
  }
  return hex(v)
}

function parseExtensionValue(oid, bytes, valueTlv) {
  const raw = bytes.subarray(valueTlv.contentStart, valueTlv.contentEnd)
  const base = { oid, name: OID_NAMES[oid] || `OID ${oid}` }

  // extnValue guarda o DER do tipo do valor. Se o tipo for uma SEQUENCE de
  // topo (SAN, basicConstraints, EKU, AKI…), desempacota essa camada para
  // acessar os filhos reais.
  function unwrap(tlv) {
    const outer = children(bytes, tlv.contentStart, tlv.contentEnd)
    if (outer.length === 1 && outer[0].tagClass === 0 && outer[0].tagNum === 0x10) {
      return outer[0]
    }
    return tlv
  }

  try {
    if (oid === '2.5.29.17') {
      const inner = unwrap(valueTlv)
      const names = []
      for (const g of children(bytes, inner.contentStart, inner.contentEnd)) {
        if (g.tagClass !== 2) continue
        const val = bytes.subarray(g.contentStart, g.contentEnd)
        if (g.tagNum === 2) names.push({ type: 'DNS', value: String.fromCharCode(...Array.from(val)) })
        else if (g.tagNum === 1) names.push({ type: 'Email', value: String.fromCharCode(...Array.from(val)) })
        else if (g.tagNum === 6) names.push({ type: 'URI', value: String.fromCharCode(...Array.from(val)) })
        else if (g.tagNum === 7) names.push({ type: 'IP', value: parseIpAddress(val) })
        else if (g.tagNum === 0) names.push({ type: 'OtherName', value: hex(val.slice(0, 16)) + (val.length > 16 ? '…' : '') })
        else if (g.tagNum === 4) names.push({ type: 'DirectoryName', value: '(CN …)' })
        else if (g.tagNum === 8) names.push({ type: 'RegisteredID', value: oidFromBytes(val) })
        else names.push({ type: `[${g.tagNum}]`, value: hex(val.slice(0, 16)) })
      }
      return { ...base, kind: 'altNames', altNames: names }
    }
    if (oid === '2.5.29.19') {
      const inner = children(bytes, unwrap(valueTlv).contentStart, unwrap(valueTlv).contentEnd)
      const cA = inner.some((x) => x.tagClass === 0 && x.tagNum === 1 && bytes[x.contentStart] === 0xff)
      const path = inner.find((x) => x.tagClass === 0 && x.tagNum === 2)
      return {
        ...base,
        kind: 'basicConstraints',
        cA,
        pathLen: path ? Number(bytesToBigInt(bytes.subarray(path.contentStart, path.contentEnd))) : null,
      }
    }
    if (oid === '2.5.29.15') {
      const first = children(bytes, valueTlv.contentStart, valueTlv.contentEnd)[0]
      const v = first && first.tagNum === 0x03
        ? bytes.subarray(first.contentStart, first.contentEnd)
        : raw
      const unused = v[0] || 0
      const bits = v.subarray(1)
      const usages = []
      for (let i = 0; i < bits.length; i++) {
        for (let bit = 0; bit < 8; bit++) {
          if (bits[i] & (0x80 >> bit)) {
            const idx = i * 8 + bit
            if (!(i === bits.length - 1 && bit >= 8 - unused)) usages.push(KEY_USAGE_BITS[idx] || `bit ${idx}`)
          }
        }
      }
      return { ...base, kind: 'keyUsage', usages, unused }
    }
    if (oid === '2.5.29.37') {
      const inner = unwrap(valueTlv)
      const oids = children(bytes, inner.contentStart, inner.contentEnd).map((k) => {
        const o = oidFromBytes(bytes.subarray(k.contentStart, k.contentEnd))
        return OID_NAMES[o] || `OID ${o}`
      })
      return { ...base, kind: 'eku', eku: oids }
    }
    if (oid === '2.5.29.14') {
      const first = children(bytes, valueTlv.contentStart, valueTlv.contentEnd)[0]
      const content = first && first.tagNum === 0x04
        ? bytes.subarray(first.contentStart, first.contentEnd)
        : raw
      return { ...base, kind: 'hex', value: hex(content) }
    }
    if (oid === '2.5.29.35') {
      const inner = children(bytes, unwrap(valueTlv).contentStart, unwrap(valueTlv).contentEnd)
      const kid = inner.find((x) => x.tagClass === 2 && x.tagNum === 0)
      return {
        ...base,
        kind: 'authorityKeyIdentifier',
        keyId: kid ? hex(bytes.subarray(kid.contentStart, kid.contentEnd)) : null,
      }
    }
    if (oid === '2.5.29.32') {
      return { ...base, kind: 'policies', count: children(bytes, unwrap(valueTlv).contentStart, unwrap(valueTlv).contentEnd).length }
    }
    return { ...base, kind: 'hex', value: hex(raw.slice(0, 32)) + (raw.length > 32 ? '…' : '') }
  } catch (e) {
    return { ...base, kind: 'hex', value: hex(raw.slice(0, 32)) }
  }
}

function parseExtensions(bytes, seq) {
  const out = []
  for (const ext of children(bytes, seq.contentStart, seq.contentEnd)) {
    const kids = children(bytes, ext.contentStart, ext.contentEnd)
    if (!kids.length) continue
    const oid = oidFromBytes(bytes.subarray(kids[0].contentStart, kids[0].contentEnd))
    let critical = false
    let valueTlv = kids[1]
    if (kids.length > 2 && kids[1].tagClass === 0 && kids[1].tagNum === 1) {
      critical = bytes[kids[1].contentStart] === 0xff
      valueTlv = kids[2]
    }
    if (valueTlv && valueTlv.tagNum === 0x04) {
      out.push({ critical, ...parseExtensionValue(oid, bytes, valueTlv) })
    }
  }
  return out
}

// ─────────────────────────────── parse X.509 ───────────────────────────────
function parseCertificate(bytes) {
  const root = readTLV(bytes, 0)
  if (root.tagClass !== 0 || root.tagNum !== 0x10) {
    throw new Error('O DER não começa com uma SEQUENCE (não parece um certificado X.509).')
  }
  const top = children(bytes, root.contentStart, root.contentEnd)
  if (top.length < 3) throw new Error('Estrutura de certificado incompleta.')

  const tbs = top[0]
  const tbsKids = children(bytes, tbs.contentStart, tbs.contentEnd)

  let idx = 0
  let version = 1n
  if (tbsKids[0].tagClass === 2 && tbsKids[0].tagNum === 0) {
    const verInner = children(bytes, tbsKids[0].contentStart, tbsKids[0].contentEnd)
    version = bytesToBigInt(bytes.subarray(verInner[0].contentStart, verInner[0].contentEnd)) + 1n
    idx = 1
  }
  const serialTlv = tbsKids[idx]
  const signatureAlgTlv = tbsKids[idx + 1]
  const issuerTlv = tbsKids[idx + 2]
  const validityTlv = tbsKids[idx + 3]
  const subjectTlv = tbsKids[idx + 4]
  const spkiTlv = tbsKids[idx + 5]

  const serial = bytesToBigInt(bytes.subarray(serialTlv.contentStart, serialTlv.contentEnd))
  const signatureAlgorithm = parseAlgorithmIdentifier(bytes, signatureAlgTlv)
  const issuer = parseName(bytes, issuerTlv)
  const subject = parseName(bytes, subjectTlv)

  const validityKids = children(bytes, validityTlv.contentStart, validityTlv.contentEnd)
  const notBefore = parseTime(bytes, validityKids[0])
  const notAfter = parseTime(bytes, validityKids[1])
  const now = Date.now()
  let status = 'unknown'
  if (notBefore.date && notAfter.date) {
    if (now < notBefore.date.getTime()) status = 'notYetValid'
    else if (now > notAfter.date.getTime()) status = 'expired'
    else status = 'valid'
  }

  // subjectPublicKeyInfo
  const spkiKids = children(bytes, spkiTlv.contentStart, spkiTlv.contentEnd)
  const pubAlg = parseAlgorithmIdentifier(bytes, spkiKids[0])
  const pubKey = {
    algorithm: pubAlg.name,
    oid: pubAlg.oid,
    params: pubAlg.params,
  }
  if (spkiKids.length > 1) {
    const bitTlv = spkiKids[1]
    const bitBytes = bytes.subarray(bitTlv.contentStart, bitTlv.contentEnd)
    const keyData = bitBytes.subarray(1)
    if (pubAlg.oid === '1.2.840.113549.1.1.1' && keyData.length && keyData[0] === 0x30) {
      const rsa = readTLV(keyData, 0)
      const rkids = children(keyData, rsa.contentStart, rsa.contentEnd)
      if (rkids.length >= 2) {
        const modulus = bytesToBigInt(keyData.subarray(rkids[0].contentStart, rkids[0].contentEnd))
        const exp = bytesToBigInt(keyData.subarray(rkids[1].contentStart, rkids[1].contentEnd))
        pubKey.modulus = bnToHex(modulus).toUpperCase()
        pubKey.bits = modulus.toString(2).length
        pubKey.exponent = Number(exp)
      }
    } else if (pubAlg.oid === '1.2.840.10045.2.1' && keyData.length && keyData[0] === 0x04) {
      pubKey.bits = Math.floor((keyData.length - 1) / 2) * 8
      pubKey.curve = pubAlg.params
    } else if (['1.3.101.112', '1.3.101.110', '1.3.101.111', '1.3.101.113'].includes(pubAlg.oid)) {
      pubKey.bits = keyData.length * 8
    } else {
      pubKey.bits = keyData.length * 8
    }
  }

  let extensions = []
  for (let i = idx + 6; i < tbsKids.length; i++) {
    const k = tbsKids[i]
    if (k.tagClass === 2 && k.tagNum === 3) {
      const seq = children(bytes, k.contentStart, k.contentEnd)[0]
      extensions = parseExtensions(bytes, seq)
      break
    }
  }

  const outerSigAlg = parseAlgorithmIdentifier(bytes, top[1])
  const sigBit = bytes.subarray(top[2].contentStart, top[2].contentEnd)
  const signatureHex = hex(sigBit.subarray(1)).toUpperCase()

  return {
    version: Number(version),
    serialHex: bnToHex(serial).toUpperCase(),
    serialDec: serial.toString(10),
    signatureAlgorithm: outerSigAlg.name,
    issuer,
    subject,
    notBefore: notBefore.raw,
    notAfter: notAfter.raw,
    notBeforeDate: notBefore.date,
    notAfterDate: notAfter.date,
    validityStatus: status,
    publicKey: pubKey,
    extensions,
    signatureHex,
    derBytes: bytes.length,
  }
}

// ─────────────────────── entrada PEM / DER ───────────────────────
function extractPemBlocks(input) {
  const cleaned = String(input || '').trim()
  if (!cleaned) return { blocks: [] }
  const blocks = []
  const re = /-----BEGIN ([A-Z0-9 ]+)-----([\s\S]*?)-----END [A-Z0-9 ]+-----/g
  let m
  while ((m = re.exec(cleaned))) {
    const label = m[1].trim()
    const body = m[2].replace(/\s+/g, '').replace(/-{5,}/g, '')
    if (!body) continue
    try {
      blocks.push({ label, der: base64ToBytes(body) })
    } catch (e) {
      // ignorar bloco com base64 inválido; reportado na validação
      blocks.push({ label, der: null })
    }
  }
  if (blocks.length) return { blocks }
  // Sem marcadores PEM: tenta DER puro (base64)
  try {
    const der = base64ToBytes(cleaned)
    return { blocks: [{ label: 'DER', der }] }
  } catch (e) {
    return { blocks: [] }
  }
}

async function fingerprint(bytes, alg) {
  try {
    const buf = await crypto.subtle.digest(alg, bytes)
    return hex(new Uint8Array(buf)).toUpperCase().replace(/(.{2})/g, '$1:').replace(/:$/, '')
  } catch (e) {
    return null
  }
}

// ─────────────────────── API pública ───────────────────────
export async function decodeCertificate(input) {
  const { blocks } = extractPemBlocks(input)
  if (!blocks.length) {
    return { ok: false, error: 'noBlocks' }
  }
  const certs = []
  const skipped = []
  for (let i = 0; i < blocks.length; i++) {
    const { label, der } = blocks[i]
    if (!der) {
      skipped.push(label)
      continue
    }
    const isCert = /CERTIFICATE/.test(label)
    try {
      const parsed = parseCertificate(der)
      if (!isCert && parsed.derBytes && /PRIVATE KEY/.test(label)) {
        skipped.push(label)
        continue
      }
      const sha256 = await fingerprint(der, 'SHA-256')
      const sha1 = await fingerprint(der, 'SHA-1')
      certs.push({ ...parsed, label, sha256, sha1 })
    } catch (e) {
      if (/CERTIFICATE/.test(label) || label === 'DER') {
        skipped.push(label)
      }
    }
  }
  if (!certs.length) {
    if (skipped.length) return { ok: false, error: 'notCert', skipped }
    return { ok: false, error: 'noBlocks' }
  }
  return { ok: true, certs, skipped }
}

export function getEngineSource() {
  return [
    '// Núcleo: leitor ASN.1 DER (TLV) + extração de campos X.509.',
    '// Encoder DER usado só para gerar os certificados de exemplo.',
    '',
    'function readTLV(bytes, offset) {',
    '  const tagByte = bytes[offset++]',
    '  const tagClass = tagByte >> 6',
    '  const constructed = (tagByte & 0x20) !== 0',
    '  let tagNum = tagByte & 0x1f',
    '  if (tagNum === 0x1f) { /* high-tag form */ }',
    '  let firstLen = bytes[offset++]',
    '  let length = (firstLen & 0x80) === 0',
    '    ? firstLen',
    '    : /* long form: bytes de comprimento seguintes */ 0',
    '  const contentStart = offset',
    '  const contentEnd = contentStart + length',
    '  return { tagClass, constructed, tagNum, contentStart, contentEnd }',
    '}',
    '',
    'export function decodeCertificate(input) {',
    '  // 1) extrai blocos PEM (-----BEGIN CERTIFICATE----- … )',
    '  //    ou trata a entrada como DER base64 puro',
    '  // 2) para cada bloco: parseCertificate(der)',
    '  // 3) fingerprints SHA-256/SHA-1 via crypto.subtle.digest',
    '}',
    '',
    '// Seções extraídas do TBSCertificate:',
    '//   version (contexto [0] ~ INTEGER explícito)',
    '//   serialNumber (INTEGER → hex + decimal)',
    '//   signatureAlgorithm + issuer + validity (UTCTime/GeneralizedTime)',
    '//   subjectPublicKeyInfo (RSA: modulus/exponent via TLV aninhado; EC: ponto 0x04)',
    '//   extensions: SAN, basicConstraints, keyUsage, extKeyUsage, SKI, AKI',
    '// OIDs conhecidos mapeados em OID_NAMES (RSA, EC, curvas, RDNs, extensões).',
  ].join('\n')
}

// ───────────────── Encode DER (certificados de exemplo) ─────────────────
function lenBytes(n) {
  if (n < 128) return [n]
  const out = []
  let x = n
  while (x) {
    out.unshift(x & 0xff)
    x = Math.floor(x / 256)
  }
  return [0x80 | out.length, ...out]
}

function tlv(tag, content) {
  return Uint8Array.from([tag, ...lenBytes(content.length), ...content])
}

function concat(...arrays) {
  let len = 0
  for (const a of arrays) len += a.length
  const out = new Uint8Array(len)
  let p = 0
  for (const a of arrays) {
    out.set(a, p)
    p += a.length
  }
  return out
}

function seq(...items) {
  return tlv(0x30, concat(...items))
}

function setOf(...items) {
  return tlv(0x31, concat(...items))
}

function ascii(s) {
  return Uint8Array.from(Array.from(s, (c) => c.charCodeAt(0)))
}

function utf8Bytes(s) {
  return new TextEncoder().encode(s)
}

function printing(s) {
  return tlv(0x13, ascii(s))
}

function utf8String(s) {
  return tlv(0x0c, utf8Bytes(s))
}

function oidTlv(oidString) {
  const parts = oidString.split('.').map(Number)
  let first = parts[0] * 40 + parts[1]
  const bytes = [first]
  for (let i = 2; i < parts.length; i++) {
    let x = parts[i]
    const stack = []
    stack.unshift(x & 0x7f)
    x = Math.floor(x / 128)
    while (x > 0) {
      stack.unshift((x & 0x7f) | 0x80)
      x = Math.floor(x / 128)
    }
    bytes.push(...stack)
  }
  return tlv(0x06, Uint8Array.from(bytes))
}

function bitString(unusedBits, content) {
  return tlv(0x03, Uint8Array.from([unusedBits, ...content]))
}

function octetString(content) {
  return tlv(0x04, content)
}

function integerBigInt(v) {
  let bytes = []
  let x = v
  while (x > 0n) {
    bytes.unshift(Number(x & 0xffn))
    x >>= 8n
  }
  if (!bytes.length) bytes = [0]
  if (bytes[0] & 0x80) bytes.unshift(0)
  return tlv(0x02, Uint8Array.from(bytes))
}

function bool(b) {
  return tlv(0x01, Uint8Array.from([b ? 0xff : 0x00]))
}

function utcTime(date) {
  const p = (n) => String(n).padStart(2, '0')
  const s = `${p(date.getUTCFullYear() % 100)}${p(date.getUTCMonth() + 1)}${p(date.getUTCDate())}${p(date.getUTCHours())}${p(date.getUTCMinutes())}${p(date.getUTCSeconds())}Z`
  return tlv(0x17, ascii(s))
}

function ctxExplicit(n, inner) {
  return tlv(0xa0 | n, inner)
}

function ctxPrimitive(n, content) {
  return tlv(0x80 | n, content)
}

const SAMPLE_MODULUS = BigInt(
  '0xcd3f8f2930b0a1c2d3e4f50617283940abcdef0123456789fedcba9876543210' +
    'fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210' +
    'fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210' +
    'fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210' +
    'fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210'
)

function rsaSpki() {
  const rsaPub = seq(integerBigInt(SAMPLE_MODULUS), integerBigInt(65537n))
  const algId = seq(oidTlv('1.2.840.113549.1.1.1'), tlv(0x05, []))
  return seq(algId, bitString(0, rsaPub))
}

function rdn(typeOid, valueBytes) {
  return setOf(seq(oidTlv(typeOid), valueBytes))
}

function name(...rdns) {
  return seq(...rdns)
}

const EXT_OIDS = {
  basicConstraints: '2.5.29.19',
  keyUsage: '2.5.29.15',
  subjectKeyIdentifier: '2.5.29.14',
  authorityKeyIdentifier: '2.5.29.35',
  subjectAltName: '2.5.29.17',
  extendedKeyUsage: '2.5.29.37',
}

function extension(oid, critical, innerDer) {
  let seqItems = critical ? [oidTlv(oid), bool(true), octetString(innerDer)] : [oidTlv(oid), octetString(innerDer)]
  return seq(...seqItems)
}

function sampleCert(opts) {
  const { cn, org, isCa, altNames, notAfter, keyId } = opts
  const version = ctxExplicit(0, integerBigInt(2n))
  const serial = integerBigInt(opts.serial || 0x1111n)
  const sigAlg = seq(oidTlv('1.2.840.113549.1.1.11'), tlv(0x05, []))
  const issuerName = name(
    rdn('2.5.4.6', printing('BR')),
    rdn('2.5.4.8', printing('Sao Paulo')),
    rdn('2.5.4.10', printing(org)),
    rdn('2.5.4.3', printing(org + ' Root CA'))
  )
  const subjectName = name(
    rdn('2.5.4.6', printing('BR')),
    rdn('2.5.4.8', printing('Sao Paulo')),
    rdn('2.5.4.10', printing(org)),
    rdn('2.5.4.3', printing(cn))
  )
  const notBefore = new Date(Date.now() - 365 * 86400000)
  const validity = seq(utcTime(notBefore), utcTime(notAfter))

  const exts = []
  if (isCa) {
    exts.push(extension(EXT_OIDS.basicConstraints, true, seq(bool(true))))
    exts.push(
      extension(
        EXT_OIDS.keyUsage,
        true,
        bitString(5, [0x80 | 0x20 | 0x08]) // digitalSignature | keyCertSign | cRLSign
      )
    )
  } else {
    exts.push(extension(EXT_OIDS.basicConstraints, true, seq(bool(false))))
    exts.push(
      extension(
        EXT_OIDS.keyUsage,
        false,
        bitString(5, [0x80 | 0x20]) // digitalSignature | keyEncipherment
      )
    )
    if (altNames && altNames.length) {
      const gs = altNames.map((a) => {
        if (a.type === 'DNS') return ctxPrimitive(2, ascii(a.value))
        if (a.type === 'IP') return ctxPrimitive(7, Uint8Array.from(a.value.split('.').map(Number)))
        return ctxPrimitive(2, ascii(a.value))
      })
      exts.push(extension(EXT_OIDS.subjectAltName, false, seq(...gs)))
    }
    exts.push(
      extension(EXT_OIDS.extendedKeyUsage, false, seq(oidTlv('1.3.6.1.5.5.7.3.1'), oidTlv('1.3.6.1.5.5.7.3.2')))
    )
  }
  const kid = new Uint8Array(20)
  for (let i = 0; i < 20; i++) kid[i] = (keyId.charCodeAt(i % keyId.length) + i) & 0xff
  exts.push(extension(EXT_OIDS.subjectKeyIdentifier, false, tlv(0x04, kid)))
  if (!isCa) {
    exts.push(extension(EXT_OIDS.authorityKeyIdentifier, false, seq(ctxPrimitive(0, kid))))
  }

  const spki = rsaSpki()
  const extBytes = tlv(0xa3, seq(...exts))
  const tbs = seq(version, serial, sigAlg, issuerName, validity, subjectName, spki, extBytes)
  // assinatura apenas ilustrativa — o parser não valida a assinatura
  const fakeSig = new Uint8Array(256)
  for (let i = 0; i < 256; i++) fakeSig[i] = (i * 7 + 3) & 0xff
  const cert = seq(tbs, sigAlg, bitString(8, fakeSig))
  return cert
}

function derToPem(der, label) {
  const b64 = bytesToBase64(der)
  const lines = []
  for (let i = 0; i < b64.length; i += 64) lines.push(b64.slice(i, i + 64))
  return `-----BEGIN ${label}-----\n${lines.join('\n')}\n-----END ${label}-----`
}

let cachedSamples = null

export function getSampleCertificates() {
  if (cachedSamples) return cachedSamples
  const root = sampleCert({
    cn: 'DevTools Sample Root CA',
    org: 'DevTools Lab',
    isCa: true,
    notAfter: new Date(Date.now() + 3650 * 86400000),
    serial: 0x1000n,
    keyId: 'devtools-root-2026',
  })
  const leaf = sampleCert({
    cn: 'www.example.com',
    org: 'Example Inc',
    isCa: false,
    notAfter: new Date(Date.now() + 90 * 86400000),
    serial: 0xe1e2e3e4n,
    keyId: 'devtools-leaf-2026',
    altNames: [
      { type: 'DNS', value: 'example.com' },
      { type: 'DNS', value: 'www.example.com' },
      { type: 'IP', value: '192.0.2.10' },
    ],
  })
  const expired = sampleCert({
    cn: 'old-service.internal',
    org: 'Retired Labs',
    isCa: false,
    notAfter: new Date(Date.now() - 30 * 86400000),
    serial: 0x4d2an,
    keyId: 'old-key-2024',
    altNames: [{ type: 'DNS', value: 'old-service.internal' }],
  })
  cachedSamples = [
    { label: 'Root CA (self-signed)', pem: derToPem(root, 'CERTIFICATE') },
    { label: 'Leaf with SAN (valid)', pem: derToPem(leaf, 'CERTIFICATE') },
    { label: 'Expired leaf', pem: derToPem(expired, 'CERTIFICATE') },
  ]
  return cachedSamples
}