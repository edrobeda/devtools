// Parser de EXIF do zero, 100% no navegador. Faz só o que o devtools precisa:
// lê APP1 do JPEG, segue o header TIFF little/big-endian, navega os IFDs
// (IFD0 + subIFDs Exif/GPS/Interop), decodifica tipos BYTE/ASCII/SHORT/LONG/
// RATIONAL/SLONG/SRATIONAL/UNDEFINED, e devolve um objeto agrupado por
// seção (camera/exposure/dimensions/datetime/gps/other) com valores já
// humanizados. Não tenta ler MakerNotes (vendor-specific, fora de escopo).
//
// Layout EXIF (resumo do spec):
//   JPEG:        FF D8 FF E1 [len:2] 'Exif\0\0' [tiffHeader] [IFD0] ...
//   TIFF header: byteOrder:2 ('II' ou 'MM') + 0x002A + offsetFirstIFD:4
//   IFD:         countEntries:2 + entry*12 + offsetNextIFD:4
//   Entry:       tag:2 + type:2 + count:4 + valueOrOffset:4
//                (se count*typeSize > 4, valueOrOffset é offset pro dado)
//
// Tipos suportados (EXIF 2.3 §4.6.2):
//   1 BYTE, 2 ASCII, 3 SHORT, 4 LONG, 5 RATIONAL,
//   7 UNDEFINED, 9 SLONG, 10 SRATIONAL
// Tamanhos: 1, 1, 2, 4, 8, 16 (?), 1, 4, 8 bytes por elemento.

const TYPE_SIZE = {
  1: 1,
  2: 1,
  3: 2,
  4: 4,
  5: 8,
  7: 1,
  9: 4,
  10: 8,
}

// Tags que conhecemos — chave é o tagId em hex, valor é { group, key, kind }.
// kind é como apresentamos:
//   'text'   : string pronta (datahora, make, model, software)
//   'single'  : BYTE único que vira char (GPS ref tipo 'N'/'S')
//   'ms'     : exposure time em ms
//   'fnumber': f/N
//   'mm'     : focal length em mm
//   'iso'    : ISO speed
//   'orient' : orientation em texto
//   'ratio'  : racional genérico (numerador/denominador + display)
//   'gps'    : tratado especialmente (3 racionais)
//   'raw'    : passa pelo formatador genérico
const TAG_DICT = {
  // IFD0 / geral
  '0x010f': { group: 'camera', key: 'make', kind: 'text' },
  '0x0110': { group: 'camera', key: 'model', kind: 'text' },
  '0x0131': { group: 'camera', key: 'software', kind: 'text' },
  '0x0132': { group: 'datetime', key: 'modifyDate', kind: 'text' },
  '0x013b': { group: 'camera', key: 'artist', kind: 'text' },
  '0x8298': { group: 'camera', key: 'copyright', kind: 'text' },
  '0x8769': { group: '__ptr__', key: 'exifIFD', kind: 'raw' },
  '0x8825': { group: '__ptr__', key: 'gpsIFD', kind: 'raw' },

  // Exif subIFD
  '0x829a': { group: 'exposure', key: 'exposureTime', kind: 'ms' },
  '0x829d': { group: 'exposure', key: 'fNumber', kind: 'fnumber' },
  '0x8827': { group: 'exposure', key: 'iso', kind: 'iso' },
  '0x9000': { group: 'exposure', key: 'exifVersion', kind: 'text' },
  '0x9003': { group: 'datetime', key: 'dateTimeOriginal', kind: 'text' },
  '0x9004': { group: 'datetime', key: 'dateTimeDigitized', kind: 'text' },
  '0x9201': { group: 'exposure', key: 'shutterSpeed', kind: 'ratio' },
  '0x9202': { group: 'exposure', key: 'aperture', kind: 'ratio' },
  '0x9203': { group: 'exposure', key: 'brightness', kind: 'ratio' },
  '0x9204': { group: 'exposure', key: 'exposureBias', kind: 'ratio' },
  '0x9205': { group: 'exposure', key: 'maxAperture', kind: 'ratio' },
  '0x9207': { group: 'exposure', key: 'meteringMode', kind: 'text' },
  '0x9208': { group: 'exposure', key: 'lightSource', kind: 'text' },
  '0x9209': { group: 'exposure', key: 'flash', kind: 'text' },
  '0x920a': { group: 'exposure', key: 'focalLength', kind: 'mm' },
  '0x927c': { group: '__skip__', key: 'makerNote', kind: 'raw' },
  '0x9286': { group: 'other', key: 'userComment', kind: 'text' },
  '0xa001': { group: 'other', key: 'colorSpace', kind: 'text' },
  '0xa002': { group: 'dimensions', key: 'pixelXDimension', kind: 'raw' },
  '0xa003': { group: 'dimensions', key: 'pixelYDimension', kind: 'raw' },
  '0xa20e': { group: 'exposure', key: 'focalLengthIn35mm', kind: 'mm' },
  '0xa420': { group: 'other', key: 'imageUniqueId', kind: 'text' },
  '0xa430': { group: 'camera', key: 'ownerName', kind: 'text' },
  '0xa431': { group: 'camera', key: 'bodySerialNumber', kind: 'text' },
  '0xa432': { group: 'exposure', key: 'lensSpec', kind: 'ratio' },
  '0xa433': { group: 'camera', key: 'lensMake', kind: 'text' },
  '0xa434': { group: 'camera', key: 'lensModel', kind: 'text' },
  '0xa435': { group: 'camera', key: 'lensSerialNumber', kind: 'text' },

  // GPS subIFD
  '0x0000': { group: 'gps', key: 'gpsVersionId', kind: 'gpsVersion' },
  '0x0001': { group: 'gps', key: 'gpsLatitudeRef', kind: 'single' },
  '0x0002': { group: '__skip__', key: 'gpsLatitude', kind: 'raw' },
  '0x0003': { group: 'gps', key: 'gpsLongitudeRef', kind: 'single' },
  '0x0004': { group: '__skip__', key: 'gpsLongitude', kind: 'raw' },
  '0x0005': { group: 'gps', key: 'gpsAltitudeRef', kind: 'single' },
  '0x0006': { group: '__skip__', key: 'gpsAltitude', kind: 'raw' },
  '0x0007': { group: '__skip__', key: 'gpsTimeStamp', kind: 'raw' },
  '0x0009': { group: 'gps', key: 'gpsStatus', kind: 'single' },
  '0x001d': { group: 'gps', key: 'gpsDateStamp', kind: 'text' },
}

const METERING_MODES = {
  0: 'Desconhecido',
  1: 'Média',
  2: 'Média central ponderada',
  3: 'Spot',
  4: 'Multispot',
  5: 'Padrão',
  6: 'Parcial',
  255: 'Outro',
}

const LIGHT_SOURCES = {
  0: 'Desconhecido',
  1: 'Luz do dia',
  2: 'Fluorescente',
  3: 'Tungstênio',
  4: 'Flash',
  9: 'Tempo bom',
  10: 'Tempo nublado',
  11: 'Sombra',
  255: 'Outro',
}

const FLASH_VALUES = {
  0x0000: 'Sem flash',
  0x0001: 'Flash disparado',
  0x0005: 'Flash disparado, sem retorno de luz',
  0x0007: 'Flash disparado, retorno de luz detectado',
  0x0009: 'Flash disparado, obrigatório',
  0x000d: 'Flash disparado, obrigatório, sem retorno',
  0x000f: 'Flash disparado, obrigatório, retorno detectado',
  0x0010: 'Flash desligado, obrigatório',
  0x0018: 'Flash desligado, automático',
  0x0019: 'Flash disparado, automático',
  0x001d: 'Flash disparado, automático, sem retorno',
  0x001f: 'Flash disparado, automático, retorno detectado',
  0x0020: 'Sem função de flash',
  0x0041: 'Flash disparado, red-eye reduction',
  0x0045: 'Flash disparado, red-eye reduction, sem retorno',
  0x0047: 'Flash disparado, red-eye reduction, retorno detectado',
  0x0049: 'Flash disparado, obrigatório, red-eye reduction',
  0x004d: 'Flash disparado, obrigatório, red-eye reduction, sem retorno',
  0x004f: 'Flash disparado, obrigatório, red-eye reduction, retorno detectado',
}

const COLOR_SPACES = {
  1: 'sRGB',
  65535: 'Não sRGB (geralmente Adobe RGB)',
  2: 'Adobe RGB',
  3: 'Wide Gamut',
  4: 'ICC Profile',
  5: 'ProPhoto',
}

const ORIENTATIONS = {
  1: 'Normal',
  2: 'Espelhado horizontal',
  3: 'Rotacionado 180°',
  4: 'Espelhado vertical',
  5: 'Rotacionado 90° + espelhado horizontal',
  6: 'Rotacionado 90° (sentido horário)',
  7: 'Rotacionado 90° + espelhado vertical',
  8: 'Rotacionado 270° (anti-horário)',
}

// Localiza o offset do APP1 (FF E1) Exif dentro do buffer JPEG.
// Aceita segmentos adicionais entre SOI e APP1 (raro, mas acontece com
// arquivos que adicionaram comentário APP0/APP1 antes).
function findExifSegment(buffer) {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) {
    return null
  }
  let offset = 2
  while (offset < buffer.length - 1) {
    if (buffer[offset] !== 0xff) return null
    const marker = buffer[offset + 1]
    if (marker === 0xe1) {
      const segLen = (buffer[offset + 2] << 8) | buffer[offset + 3]
      // Confirma "Exif\0\0" logo após o tamanho.
      if (
        buffer[offset + 4] === 0x45 && // E
        buffer[offset + 5] === 0x78 && // x
        buffer[offset + 6] === 0x69 && // i
        buffer[offset + 7] === 0x66 && // f
        buffer[offset + 8] === 0x00 &&
        buffer[offset + 9] === 0x00
      ) {
        return { tiffOffset: offset + 10, segLen }
      }
      return null
    }
    if (marker === 0xda) return null // SOS = fim dos metadados
    // pula segmento atual: marker (2) + length (2) + payload (length-2)
    if (offset + 4 > buffer.length) return null
    const segLen = (buffer[offset + 2] << 8) | buffer[offset + 3]
    offset += 2 + segLen
  }
  return null
}

function readEndianness(buffer, tiffOffset) {
  const b1 = buffer[tiffOffset]
  const b2 = buffer[tiffOffset + 1]
  if (b1 === 0x49 && b2 === 0x49) return 'le'
  if (b1 === 0x4d && b2 === 0x4d) return 'be'
  return null
}

// GPSRef (N/S/E/W) e AltitudeRef vêm como type=2 ASCII com 1 caractere;
// o parser devolve uma string, mas alguns arquivos gravam como BYTE (type=1)
// e viram array. Esse helper normaliza os dois.
function charFromRaw(raw) {
  if (raw == null) return ''
  if (Array.isArray(raw)) return raw.length > 0 ? String.fromCharCode(raw[0]) : ''
  if (typeof raw === 'string') return raw.length > 0 ? raw[0] : ''
  return ''
}

function read16(buffer, offset, endian) {
  if (endian === 'le') return buffer[offset] | (buffer[offset + 1] << 8)
  return (buffer[offset] << 8) | buffer[offset + 1]
}

function read32(buffer, offset, endian) {
  if (endian === 'le') {
    return (
      buffer[offset] |
      (buffer[offset + 1] << 8) |
      (buffer[offset + 2] << 16) |
      (buffer[offset + 3] << 24)
    )
  }
  return (
    ((buffer[offset] << 24) >>> 0) |
    (buffer[offset + 1] << 16) |
    (buffer[offset + 2] << 8) |
    buffer[offset + 3]
  )
}

// Lê um valor de entry EXIF. Quando o count*size do tipo cabe nos 4 bytes do
// próprio entry, lê inline; senão segue o offset pro bloco no TIFF.
// Fallback: alguns writers gravam dados pequenos como offset em vez de inline
// (válido pela spec). Detecta isso verificando se o inline veio vazio/zeros
// e o offset aponta pra dentro do TIFF.
function readValue(buffer, tiffOffset, entryOffset, endian) {
  const type = read16(buffer, entryOffset + 2, endian)
  const count = read32(buffer, entryOffset + 4, endian)
  const sizePer = TYPE_SIZE[type]
  if (!sizePer) {
    return null
  }
  const total = sizePer * count
  const offsetField = read32(buffer, entryOffset + 8, endian)
  let dataOffset
  if (total > 4) {
    dataOffset = tiffOffset + offsetField
  } else {
    dataOffset = entryOffset + 8
    // Tenta inline primeiro; se vier vazio (ASCII NUL) e o "offset" apontar
    // pra dentro do TIFF, usa o offset. Cobre writers que armazenaram offset
    // mesmo quando caberia inline.
    if (offsetField > 0 && offsetField < buffer.length - tiffOffset) {
      const inlineBytes = []
      for (let i = 0; i < total; i++) inlineBytes.push(buffer[dataOffset + i])
      if (inlineBytes.every((b) => b === 0)) {
        const candidate = tiffOffset + offsetField
        if (candidate >= 0 && candidate + total <= buffer.length) {
          dataOffset = candidate
        }
      }
    }
  }
  if (dataOffset < 0 || dataOffset + total > buffer.length) return null

  switch (type) {
    case 1:
      return Array.from(buffer.slice(dataOffset, dataOffset + count))
    case 2: {
      // ASCII: termina com \0 (count inclui o terminador).
      const end = dataOffset + count
      let realEnd = end
      for (let i = dataOffset; i < end; i++) {
        if (buffer[i] === 0x00) {
          realEnd = i
          break
        }
      }
      const sub = new Uint8Array(realEnd - dataOffset)
      for (let i = 0; i < sub.length; i++) sub[i] = buffer[dataOffset + i]
      return new TextDecoder('utf-8').decode(sub)
    }
    case 3: {
      const out = new Array(count)
      for (let i = 0; i < count; i++) out[i] = read16(buffer, dataOffset + i * 2, endian)
      return out
    }
    case 4: {
      const out = new Array(count)
      for (let i = 0; i < count; i++) out[i] = read32(buffer, dataOffset + i * 4, endian)
      return out
    }
    case 5: {
      const out = new Array(count)
      for (let i = 0; i < count; i++) {
        const num = read32(buffer, dataOffset + i * 8, endian)
        const den = read32(buffer, dataOffset + i * 8 + 4, endian)
        out[i] = { num, den }
      }
      return out
    }
    case 7:
      return Array.from(buffer.slice(dataOffset, dataOffset + count))
    case 9: {
      const out = new Array(count)
      for (let i = 0; i < count; i++) {
        let v = read32(buffer, dataOffset + i * 4, endian)
        // signed
        if (v >= 0x80000000) v -= 0x100000000
        out[i] = v
      }
      return out
    }
    case 10: {
      const out = new Array(count)
      for (let i = 0; i < count; i++) {
        const num = read32(buffer, dataOffset + i * 8, endian)
        const den = read32(buffer, dataOffset + i * 8 + 4, endian)
        let signedNum = num
        if (num >= 0x80000000) signedNum -= 0x100000000
        out[i] = { num: signedNum, den }
      }
      return out
    }
    default:
      return null
  }
}

// Decide se o valor inline lido de 4 bytes parece ser apenas padding
// (todos zeros) — nesse caso prefere a interpretação como offset.
// (Mantida para extensão futura; hoje a lógica está inline em readValue.)
function isSuspiciousInline(bytes) {
  if (bytes.length === 0) return true
  return bytes.every((b) => b === 0)
}

function readIFD(buffer, tiffOffset, ifdOffset, endian) {
  const start = tiffOffset + ifdOffset
  if (start < 0 || start + 2 > buffer.length) return { entries: [], next: 0 }
  const count = read16(buffer, start, endian)
  const entries = []
  for (let i = 0; i < count; i++) {
    const entryOffset = start + 2 + i * 12
    if (entryOffset + 12 > buffer.length) break
    const tag = read16(buffer, entryOffset, endian)
    const type = read16(buffer, entryOffset + 2, endian)
    const entryCount = read32(buffer, entryOffset + 4, endian)
    const raw = readValue(buffer, tiffOffset, entryOffset, endian)
    entries.push({ tag, type, count: entryCount, raw })
  }
  const nextOffsetPos = start + 2 + count * 12
  const next = nextOffsetPos + 4 <= buffer.length ? read32(buffer, nextOffsetPos, endian) : 0
  return { entries, next }
}

function rationalToFloat(r) {
  if (!r) return NaN
  if (r.den === 0) return NaN
  return r.num / r.den
}

function formatExposureTime(rs) {
  if (!rs || !rs[0]) return null
  const r = rs[0]
  if (r.den === 0) return null
  if (r.num >= r.den) return `${(r.num / r.den).toFixed(1)}s`
  // < 1s ? fração tipo 1/250 (legível, padrão de mercado)
  return `1/${Math.round(r.den / r.num)}s`
}

function formatFNumber(rs) {
  const v = rationalToFloat(rs && rs[0])
  if (!isFinite(v)) return null
  return `f/${v.toFixed(1)}`
}

function formatFocal(rs) {
  const v = rationalToFloat(rs && rs[0])
  if (!isFinite(v)) return null
  return `${v.toFixed(1)} mm`
}

function formatRational(rs) {
  const r = rs && rs[0]
  if (!r) return null
  const v = rationalToFloat(r)
  if (!isFinite(v)) return null
  // Mostra fração crua + decimal quando for racional "limpo" (den != 0 e não zero).
  if (r.den === 0) return null
  return `${r.num}/${r.den} (${v.toFixed(4)})`
}

function formatGpsCoord(rs, ref) {
  if (!rs || rs.length < 3) return null
  const [d, m, s] = rs.map(rationalToFloat)
  if (![d, m, s].every(isFinite)) return null
  let decimal = d + m / 60 + s / 3600
  if (ref === 'S' || ref === 'W') decimal = -decimal
  return { decimal, dms: `${Math.trunc(d)}° ${Math.trunc(m)}' ${s.toFixed(2)}" ${ref || ''}`.trim() }
}

function formatOrientation(n) {
  return ORIENTATIONS[n] || null
}

// Decodifica o "UserComment" do EXIF: começa com 8 bytes de character code
// (ASCII "ASCII\0\0\0" ou "UNICODE\0"), depois o comentário real.
function decodeUserComment(bytes) {
  if (!bytes || bytes.length < 8) return null
  const prefixBytes = new Uint8Array(8)
  for (let i = 0; i < 8; i++) prefixBytes[i] = bytes[i]
  const prefix = new TextDecoder('ascii').decode(prefixBytes)
  const rest = new Uint8Array(bytes.length - 8)
  for (let i = 0; i < rest.length; i++) rest[i] = bytes[8 + i]
  if (prefix.startsWith('UNICODE')) {
    return new TextDecoder('utf-16be').decode(rest).replace(/\0+$/, '')
  }
  // ASCII ou undefined — descarta o prefixo.
  return new TextDecoder('utf-8').decode(rest).replace(/\0+$/, '')
}

// Converte "YYYY:MM:DD HH:MM:SS" do EXIF em ISO local-friendly.
function reformatExifDateTime(s) {
  if (!s) return null
  const m = /^(\d{4}):(\d{2}):(\d{2})[ \t](\d{2}):(\d{2}):(\d{2})$/.exec(s)
  if (!m) return s
  return `${m[1]}-${m[2]}-${m[3]} ${m[4]}:${m[5]}:${m[6]}`
}

// Transforma entrada crua do IFD num par (groupKey, formattedValue) pronto
// pra UI, usando o dicionário e os formatadores acima.
function formatEntry(entry) {
  const tagId = '0x' + entry.tag.toString(16).padStart(4, '0')
  const def = TAG_DICT[tagId]
  if (!def || def.group === '__skip__' || def.group === '__ptr__') {
    return null // ponteiro pra subIFD tratado fora; MakerNote pulado
  }
  const { group, key: fieldKey, kind } = def
  const raw = entry.raw
  if (raw === null) return { group, key: fieldKey, value: null }

  switch (kind) {
    case 'text':
      if (Array.isArray(raw)) {
        // ExifVersion vem como [48,50,51,49] = ['0','2','3','1'] em ASCII.
        if (fieldKey === 'exifVersion') return { group, key: fieldKey, value: raw.map((b) => String.fromCharCode(b)).join('') }
        return { group, key: fieldKey, value: raw.join(', ') }
      }
      return { group, key: fieldKey, value: String(raw) }
    case 'single': {
      // GPS ref (N/S/E/W) e altitude ref vêm como tipo 2 (ASCII) com 1 char
      // — o parser lê isso como string. Pode vir como [byte] se por acaso
      // vier em outro tipo. Ambos os formatos desembarcam aqui.
      if (Array.isArray(raw) && raw.length > 0) {
        return { group, key: fieldKey, value: String.fromCharCode(raw[0]) }
      }
      if (typeof raw === 'string' && raw.length > 0) {
        return { group, key: fieldKey, value: raw[0] }
      }
      return { group, key: fieldKey, value: null }
    }
    case 'gpsVersion': {
      // GPSVersionID = 4 bytes BYTE = "2.3.0.0" tipicamente.
      const bytes = Array.isArray(raw) ? raw : (typeof raw === 'string' ? Array.from(raw).map((c) => c.charCodeAt(0)) : [])
      if (bytes.length === 0) return { group, key: fieldKey, value: null }
      return { group, key: fieldKey, value: bytes.join('.') }
    }
    case 'ms':
      return { group, key: fieldKey, value: formatExposureTime(raw) }
    case 'fnumber':
      return { group, key: fieldKey, value: formatFNumber(raw) }
    case 'mm':
      return { group, key: fieldKey, value: formatFocal(raw) }
    case 'iso': {
      const v = Array.isArray(raw) ? raw[0] : raw
      return { group, key: fieldKey, value: typeof v === 'number' ? `ISO ${v}` : null }
    }
    case 'orient': {
      const v = Array.isArray(raw) ? raw[0] : raw
      return { group, key: fieldKey, value: formatOrientation(v) }
    }
    case 'ratio':
      return { group, key: fieldKey, value: formatRational(raw) }
    case 'gps': {
      // GPS lat/lon precisa do ref (N/S) que vem em outro tag — devolvido em
      // chamada separada abaixo. Mantém cru aqui.
      return { group, key: fieldKey, value: raw }
    }
    case 'raw': {
      if (Array.isArray(raw)) {
        if (raw.length === 1) return { group, key: fieldKey, value: raw[0] }
        return { group, key: fieldKey, value: raw.join(', ') }
      }
      return { group, key: fieldKey, value: raw }
    }
    default:
      return null
  }
}

// Envolve os formatadores por tag — alguns precisam de campos relacionados
// (orientation é 0x0112, dimensions 0x0100/0x0101, datetime 0x0132).
function specialEntries(entries) {
  const byTag = Object.fromEntries(entries.map((e) => [e.tag, e]))
  const out = []

  // Orientation (0x0112) — não tem entry no dicionário, é ad-hoc
  const orient = byTag[0x0112]
  if (orient) {
    const v = Array.isArray(orient.raw) ? orient.raw[0] : orient.raw
    const label = formatOrientation(v)
    if (label) out.push({ group: 'dimensions', key: 'orientation', value: `${label} (#${v})` })
  }

  // ImageWidth/Height (0x0100/0x0101) — para casos antigos em que dimensões
  // estão no IFD0 (muitos editores ainda usam isso).
  const w = byTag[0x0100]
  const h = byTag[0x0101]
  if (w) {
    const v = Array.isArray(w.raw) ? w.raw[0] : w.raw
    if (typeof v === 'number' && v > 0) {
      out.push({ group: 'dimensions', key: 'imageWidth', value: `${v} px` })
    }
  }
  if (h) {
    const v = Array.isArray(h.raw) ? h.raw[0] : h.raw
    if (typeof v === 'number' && v > 0) {
      out.push({ group: 'dimensions', key: 'imageHeight', value: `${v} px` })
    }
  }

  // Re-decodifica datetime com formato amigável (era passado cru em 'text').
  for (const e of out) {
    if (e.key === 'modifyDate' || e.key === 'dateTimeOriginal' || e.key === 'dateTimeDigitized') {
      e.value = reformatExifDateTime(e.value)
    }
  }

  // UserComment com character code prefix
  const userComment = byTag[0x9286]
  if (userComment) {
    const txt = decodeUserComment(userComment.raw)
    if (txt) out.push({ group: 'other', key: 'userComment', value: txt })
  }

  // Metering mode / light source / flash: dicionários numéricos
  const m = byTag[0x9207]
  if (m) {
    const v = Array.isArray(m.raw) ? m.raw[0] : m.raw
    if (typeof v === 'number') out.push({ group: 'exposure', key: 'meteringMode', value: METERING_MODES[v] || `Modo ${v}` })
  }
  const l = byTag[0x9208]
  if (l) {
    const v = Array.isArray(l.raw) ? l.raw[0] : l.raw
    if (typeof v === 'number') out.push({ group: 'exposure', key: 'lightSource', value: LIGHT_SOURCES[v] || `Fonte ${v}` })
  }
  const f = byTag[0x9209]
  if (f) {
    const v = Array.isArray(f.raw) ? f.raw[0] : f.raw
    if (typeof v === 'number') out.push({ group: 'exposure', key: 'flash', value: FLASH_VALUES[v] || `0x${v.toString(16).padStart(4, '0')}` })
  }
  const cs = byTag[0xa001]
  if (cs) {
    const v = Array.isArray(cs.raw) ? cs.raw[0] : cs.raw
    if (typeof v === 'number') out.push({ group: 'other', key: 'colorSpace', value: COLOR_SPACES[v] || `ColorSpace ${v}` })
  }

  // GPS lat/lon combinando ref + racionais
  const lat = byTag[0x0002]
  const latRef = byTag[0x0001]
  if (lat) {
    const ref = latRef ? charFromRaw(latRef.raw) : ''
    const fmt = formatGpsCoord(lat.raw, ref)
    if (fmt) out.push({ group: 'gps', key: 'gpsLatitude', value: fmt.dms, decimal: fmt.decimal })
  }
  const lon = byTag[0x0004]
  const lonRef = byTag[0x0003]
  if (lon) {
    const ref = lonRef ? charFromRaw(lonRef.raw) : ''
    const fmt = formatGpsCoord(lon.raw, ref)
    if (fmt) out.push({ group: 'gps', key: 'gpsLongitude', value: fmt.dms, decimal: fmt.decimal })
  }
  const alt = byTag[0x0006]
  const altRef = byTag[0x0005]
  if (alt) {
    const v = rationalToFloat(alt.raw && alt.raw[0])
    if (isFinite(v)) {
      const altRefByte = altRef ? (Array.isArray(altRef.raw) ? altRef.raw[0] : null) : null
      const sign = altRefByte === 1 ? -1 : 1
      out.push({ group: 'gps', key: 'gpsAltitude', value: `${(sign * v).toFixed(1)} m` })
    }
  }
  const ts = byTag[0x0007]
  if (ts) {
    const h = rationalToFloat(ts.raw && ts.raw[0])
    const m = rationalToFloat(ts.raw && ts.raw[1])
    const s = rationalToFloat(ts.raw && ts.raw[2])
    if ([h, m, s].every(isFinite)) {
      const hh = Math.trunc(h).toString().padStart(2, '0')
      const mm = Math.trunc(m).toString().padStart(2, '0')
      const ss = Math.trunc(s).toString().padStart(2, '0')
      out.push({ group: 'gps', key: 'gpsTimeStamp', value: `${hh}:${mm}:${ss} UTC` })
    }
  }
  const ds = byTag[0x001d]
  if (ds) {
    out.push({
      group: 'gps',
      key: 'gpsDateStamp',
      value: reformatExifDateTime(String(ds.raw).replace(/:/g, '-')),
    })
  }

  return out
}

// Aplica o dicionário de tags + as transformações especiais ao conjunto
// de entries de um IFD, devolvendo os pares (group, key, value) prontos.
// Usa um Map por chave pra specialEntries sobrescrever formatEntry em vez
// de duplicar (alguns campos precisam de múltiplos tags irmãos — GPS lat +
// ref, UserComment com prefixo, ColorSpace com dicionário, etc).
function processEntries(entries) {
  const map = new Map()
  for (const e of entries) {
    const formatted = formatEntry(e)
    if (formatted) map.set(formatted.key, formatted)
  }
  for (const e of specialEntries(entries)) {
    map.set(e.key, e)
  }
  // Ordem final: respeita a ordem do TAG_DICT para ficar estável.
  const order = Object.values(TAG_DICT).map((t) => t.key)
  const out = []
  for (const key of order) {
    if (map.has(key)) out.push(map.get(key))
  }
  // Inclui keys gerados em specialEntries que não estão no dicionário
  // (orientation, imageWidth/Height) no fim, na ordem em que apareceram.
  for (const [k, v] of map) {
    if (!order.includes(k)) out.push(v)
  }
  return out
}

// API pública. Recebe um ArrayBuffer de JPEG e devolve { ok, error?, groups }.
// groups: { camera:[], exposure:[], dimensions:[], datetime:[], gps:[], other:[] }
export function parseExif(arrayBuffer) {
  const buffer = new Uint8Array(arrayBuffer)
  const seg = findExifSegment(buffer)
  if (!seg) {
    return { ok: false, error: 'no_exif' }
  }
  const tiffOffset = seg.tiffOffset
  // Endian vem da byte order word ('II' = LE, 'MM' = BE) — literal ASCII,
  // não é afetada pelo próprio endian. Confere o valor 0x002A no endian
  // declarado pra detectar arquivos malformados.
  const byteOrder = readEndianness(buffer, tiffOffset)
  if (!byteOrder) return { ok: false, error: 'bad_endian' }
  const magic = read16(buffer, tiffOffset + 2, byteOrder)
  if (magic !== 42) return { ok: false, error: 'bad_magic' }
  const endian = byteOrder

  const ifd0Offset = read32(buffer, tiffOffset + 4, endian)
  const ifd0 = readIFD(buffer, tiffOffset, ifd0Offset, endian)

  // Coleta pointers pra subIFDs
  const pointers = {}
  for (const e of ifd0.entries) {
    if (e.tag === 0x8769) pointers.exif = Array.isArray(e.raw) ? e.raw[0] : e.raw
    if (e.tag === 0x8825) pointers.gps = Array.isArray(e.raw) ? e.raw[0] : e.raw
  }

  // Lê Exif subIFD e seu Interop subIFD
  let exifEntries = []
  let interopEntries = []
  if (pointers.exif !== undefined) {
    const exifIFD = readIFD(buffer, tiffOffset, pointers.exif, endian)
    exifEntries = exifIFD.entries
    for (const e of exifIFD.entries) {
      if (e.tag === 0xa005) {
        const interopIFD = readIFD(buffer, tiffOffset, e.raw[0], endian)
        interopEntries = interopIFD.entries
        break
      }
    }
  }

  // Lê GPS subIFD
  let gpsEntries = []
  if (pointers.gps !== undefined) {
    const gpsIFD = readIFD(buffer, tiffOffset, pointers.gps, endian)
    gpsEntries = gpsIFD.entries
  }

  // Combina tudo
  const allEntries = [...ifd0.entries, ...exifEntries, ...gpsEntries, ...interopEntries]
  const formatted = processEntries(allEntries)

  const groups = {
    camera: [],
    exposure: [],
    dimensions: [],
    datetime: [],
    gps: [],
    other: [],
  }
  for (const f of formatted) {
    if (groups[f.group]) groups[f.group].push(f)
  }

  // Conta total pra relatório
  return {
    ok: true,
    groups,
    totalFields: formatted.length,
    totalEntries: allEntries.length,
  }
}

// Helper: devolve um objeto "flat" chave->valor pra exportar como JSON.
export function exifToFlat(groups) {
  const out = {}
  for (const [, entries] of Object.entries(groups)) {
    for (const { key, value } of entries) {
      out[key] = value
    }
  }
  return out
}