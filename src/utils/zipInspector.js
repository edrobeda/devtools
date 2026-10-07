// Motor de inspeção de arquivos ZIP — 100% client-side, sem dependências.
//
// O formato ZIP guarda o sumário no FIM do arquivo (EOCD), então o parser
// caminha de trás pra frente até achar a assinatura 0x06054b50, lê o
// diretório central (uma entrada por arquivo) e daí devolve cada entrada
// com tamanho, método, CRC32, data e avisos. A extração de um arquivo
// individual relê o header local apontado pelo diretório central e, no
// caso de deflate, usa a DecompressionStream('deflate-raw') do navegador.
//
// Não escreve .zip: aqui é inspeção/leitura (o builder de amostra existe
// só pra página ter exemplos sem binário versionado no repo).

const SIG = {
  LOCAL: 0x04034b50,
  CENTRAL: 0x02014b50,
  EOCD: 0x06054b50,
  EOCD64: 0x06064b50,
  EOCD64_LOC: 0x07064b50,
}

export const METHOD_NAMES = {
  0: 'store',
  1: 'shrunk',
  6: 'imploded',
  8: 'deflate',
  9: 'deflate64',
  12: 'bzip2',
  14: 'lzma',
  93: 'zstd',
  95: 'xz',
  96: 'jpeg',
  97: 'wavpack',
  98: 'ppmd',
  99: 'aes',
}

export function methodLabel(method) {
  return METHOD_NAMES[method] || `method ${method}`
}

// Métodos que a página consegue extrair de verdade no navegador.
export const EXTRACTABLE_METHODS = new Set([0, 8])

let CRC_TABLE = null
function getCrcTable() {
  if (CRC_TABLE) return CRC_TABLE
  CRC_TABLE = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    CRC_TABLE[n] = c >>> 0
  }
  return CRC_TABLE
}

export function crc32(bytes) {
  const table = getCrcTable()
  let crc = 0xffffffff
  for (let i = 0; i < bytes.length; i++) {
    crc = table[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8)
  }
  return (crc ^ 0xffffffff) >>> 0
}

function toBytes(input) {
  if (input instanceof Uint8Array) return input
  if (input instanceof ArrayBuffer) return new Uint8Array(input)
  return new Uint8Array(input.buffer, input.byteOffset, input.byteLength)
}

function decodeText(bytes) {
  return new TextDecoder('utf-8', { fatal: false }).decode(bytes)
}

function decodeDosDate(dosDate, dosTime) {
  const year = 1980 + ((dosDate >> 9) & 0x7f)
  const month = (dosDate >> 5) & 0x0f
  const day = dosDate & 0x1f
  const hour = (dosTime >> 11) & 0x1f
  const min = (dosTime >> 5) & 0x3f
  const sec = (dosTime & 0x1f) * 2
  if (month < 1 || month > 12 || day < 1 || day > 31 || year < 1980) return null
  const ms = Date.UTC(year, month - 1, day, hour, min, sec)
  return Number.isNaN(ms) ? null : ms
}

function findEocd(dv, len) {
  const min = Math.max(0, len - 22 - 65535)
  // 1ª passada: assinatura cujo commentLen fecha exatamente com o fim do
  // arquivo (a checagem canônica — evita achar a assinatura dentro do lixo).
  for (let i = len - 22; i >= min; i--) {
    if (dv.getUint32(i, true) === SIG.EOCD) {
      const commentLen = dv.getUint16(i + 20, true)
      if (i + 22 + commentLen === len) return i
    }
  }
  // 2ª passada: aceita qualquer EOCD (arquivos com lixo depois do comentário).
  for (let i = len - 22; i >= min; i--) {
    if (dv.getUint32(i, true) === SIG.EOCD) return i
  }
  return -1
}

function isUnsafePath(name) {
  const norm = name.replace(/\\/g, '/')
  if (norm.startsWith('/')) return 'absolute'
  if (/^[A-Za-z]:/.test(name)) return 'absolute'
  const parts = norm.split('/')
  if (parts.includes('..')) return 'traversal'
  return null
}

function parseExtra(dv, start, len, entry) {
  const list = []
  const end = start + len
  let p = start
  while (p + 4 <= end) {
    const id = dv.getUint16(p, true)
    const size = dv.getUint16(p + 2, true)
    const dataStart = p + 4
    const dataEnd = Math.min(dataStart + size, end)
    list.push({ id, size })
    if (id === 0x0001) {
      let q = dataStart
      if (entry.uncompressedSize === 0xffffffff && q + 8 <= dataEnd) {
        entry.uncompressedSize = Number(dv.getBigUint64(q, true))
        q += 8
      }
      if (entry.compressedSize === 0xffffffff && q + 8 <= dataEnd) {
        entry.compressedSize = Number(dv.getBigUint64(q, true))
        q += 8
      }
      if (entry.localOffset === 0xffffffff && q + 8 <= dataEnd) {
        entry.localOffset = Number(dv.getBigUint64(q, true))
        q += 8
      }
      entry.zip64 = true
    } else if (id === 0x5455 && dataEnd > dataStart) {
      const flags = dv.getUint8(dataStart)
      if ((flags & 1) && dataStart + 5 <= dataEnd) {
        entry.unixTime = dv.getUint32(dataStart + 1, true) * 1000
      }
    } else if (id === 0x000d && dataStart + 8 <= dataEnd) {
      // 0x000d (Unix extra, central directory): atime(4) + mtime(4)
      entry.unixTime = dv.getUint32(dataStart + 4, true) * 1000
    }
    const next = dataStart + size
    if (next <= p) break
    p = next
  }
  return list
}

function emptyStats() {
  return {
    entryCount: 0,
    fileCount: 0,
    dirCount: 0,
    totalCompressed: 0,
    totalUncompressed: 0,
    ratio: null,
    methods: [],
    minModified: null,
    maxModified: null,
    comment: '',
    zip64: false,
    largest: null,
  }
}

export function parseZip(input) {
  const bytes = toBytes(input)
  const warnings = []
  const add = (severity, code, ctx) => warnings.push({ severity, code, ctx: ctx || {} })

  if (bytes.length < 22) {
    return { ok: false, error: 'too-small', entries: [], warnings, stats: emptyStats() }
  }
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const eocdOff = findEocd(dv, bytes.length)
  if (eocdOff < 0) {
    return { ok: false, error: 'no-eocd', entries: [], warnings, stats: emptyStats() }
  }

  let entryCount = dv.getUint16(eocdOff + 10, true)
  let cdSize = dv.getUint32(eocdOff + 12, true)
  let cdOffset = dv.getUint32(eocdOff + 16, true)
  const commentLen = dv.getUint16(eocdOff + 20, true)
  const comment = commentLen > 0 && eocdOff + 22 + commentLen <= bytes.length
    ? decodeText(bytes.subarray(eocdOff + 22, eocdOff + 22 + commentLen))
    : ''

  let zip64 = false
  if (entryCount === 0xffff || cdSize === 0xffffffff || cdOffset === 0xffffffff) {
    const locOff = eocdOff - 20
    if (locOff >= 0 && dv.getUint32(locOff, true) === SIG.EOCD64_LOC) {
      const z64Off = Number(dv.getBigUint64(locOff + 8, true))
      if (z64Off >= 0 && z64Off + 56 <= bytes.length && dv.getUint32(z64Off, true) === SIG.EOCD64) {
        zip64 = true
        entryCount = Number(dv.getBigUint64(z64Off + 32, true))
        cdSize = Number(dv.getBigUint64(z64Off + 40, true))
        cdOffset = Number(dv.getBigUint64(z64Off + 48, true))
      }
    }
    if (!zip64) add('warning', 'zip64-unparsed', {})
  }
  if (zip64) add('info', 'zip64', {})

  if (!Number.isFinite(cdOffset) || cdOffset < 0 || cdOffset + 46 > bytes.length) {
    return {
      ok: false,
      error: 'bad-central',
      entries: [],
      warnings,
      stats: { ...emptyStats(), comment, zip64 },
    }
  }

  const entries = []
  const seen = new Map()
  let p = cdOffset
  for (let i = 0; i < entryCount; i++) {
    if (p + 46 > bytes.length) {
      add('error', 'truncated-central', { index: entries.length })
      break
    }
    if (dv.getUint32(p, true) !== SIG.CENTRAL) {
      add('error', 'bad-central-signature', { index: entries.length })
      break
    }
    const versionMadeBy = dv.getUint16(p + 4, true)
    const flags = dv.getUint16(p + 8, true)
    const method = dv.getUint16(p + 10, true)
    const dosTime = dv.getUint16(p + 12, true)
    const dosDate = dv.getUint16(p + 14, true)
    const nameLen = dv.getUint16(p + 28, true)
    const extraLen = dv.getUint16(p + 30, true)
    const recCommentLen = dv.getUint16(p + 32, true)
    const externalAttrs = dv.getUint32(p + 38, true)

    const nameStart = p + 46
    const extraStart = nameStart + nameLen
    const recCommentStart = extraStart + extraLen
    if (recCommentStart + recCommentLen > bytes.length) {
      add('error', 'truncated-central', { index: entries.length })
      break
    }

    const rawName = bytes.subarray(nameStart, extraStart)
    const utf8Flag = (flags & 0x800) !== 0
    const name = decodeText(rawName)
    const suspectEncoding = !utf8Flag && name.includes('�')

    const entry = {
      index: entries.length,
      name,
      isDir:
        name.endsWith('/') ||
        name.endsWith('\\') ||
        (externalAttrs & 0x10) !== 0 ||
        ((externalAttrs >>> 16) & 0xf000) === 0x4000,
      flags,
      encrypted: (flags & 0x1) !== 0 || (flags & 0x40) !== 0,
      dataDescriptor: (flags & 0x8) !== 0,
      utf8: utf8Flag,
      method,
      crc32: dv.getUint32(p + 16, true),
      compressedSize: dv.getUint32(p + 20, true),
      uncompressedSize: dv.getUint32(p + 24, true),
      localOffset: dv.getUint32(p + 42, true),
      diskStart: dv.getUint16(p + 34, true),
      internalAttrs: dv.getUint16(p + 36, true),
      externalAttrs,
      hostSystem: (versionMadeBy >> 8) & 0xff,
      versionMadeBy: versionMadeBy & 0xff,
      versionNeeded: dv.getUint16(p + 6, true),
      modified: decodeDosDate(dosDate, dosTime),
      dosDate,
      dosTime,
      comment: recCommentLen > 0 ? decodeText(bytes.subarray(recCommentStart, recCommentStart + recCommentLen)) : '',
      extra: [],
      zip64: false,
      suspectEncoding,
    }
    entry.extra = parseExtra(dv, extraStart, extraLen, entry)
    entry.ratio =
      entry.compressedSize > 0 && entry.uncompressedSize > 0
        ? entry.uncompressedSize / entry.compressedSize
        : null

    if (entry.suspectEncoding) add('info', 'non-utf8-name', { name })
    if (entry.encrypted) add('warning', 'encrypted', { name })
    if (entry.dataDescriptor) add('info', 'data-descriptor', { name })
    if (!EXTRACTABLE_METHODS.has(entry.method) && !entry.isDir) {
      add('info', 'unsupported-method', { name, method: methodLabel(entry.method) })
    }
    const unsafe = isUnsafePath(name)
    if (unsafe === 'traversal') add('error', 'path-traversal', { name })
    else if (unsafe === 'absolute') add('error', 'absolute-path', { name })
    if (name.includes('\\') && !name.includes('/')) add('info', 'backslash-path', { name })
    if (entry.ratio !== null && !entry.isDir) {
      if (entry.ratio >= 500) add('error', 'bomb-ratio', { name, ratio: entry.ratio })
      else if (entry.ratio >= 100) add('warning', 'high-ratio', { name, ratio: entry.ratio })
    }
    const prev = seen.get(name)
    if (prev === undefined) seen.set(name, entries.length)
    else add('warning', 'duplicate-name', { name, first: prev + 1 })

    entries.push(entry)
    p = recCommentStart + recCommentLen
  }

  const stats = emptyStats()
  stats.comment = comment
  stats.zip64 = zip64
  stats.entryCount = entries.length
  const methodMap = new Map()
  for (const e of entries) {
    if (e.isDir) {
      stats.dirCount++
    } else {
      stats.fileCount++
      stats.totalCompressed += e.compressedSize
      stats.totalUncompressed += e.uncompressedSize
      if (!stats.largest || e.uncompressedSize > stats.largest.uncompressedSize) {
        stats.largest = { name: e.name, uncompressedSize: e.uncompressedSize }
      }
    }
    methodMap.set(e.method, (methodMap.get(e.method) || 0) + 1)
    if (e.unixTime != null && !e.modified) e.modified = e.unixTime
    if (e.modified != null) {
      if (stats.minModified === null || e.modified < stats.minModified) stats.minModified = e.modified
      if (stats.maxModified === null || e.modified > stats.maxModified) stats.maxModified = e.modified
    }
  }
  stats.methods = [...methodMap.entries()]
    .map(([method, count]) => ({ method, count }))
    .sort((a, b) => b.count - a.count)
  stats.ratio =
    stats.totalCompressed > 0 && stats.totalUncompressed > 0
      ? stats.totalUncompressed / stats.totalCompressed
      : null
  if (entries.length === 0) add('info', 'empty-archive', {})

  warnings.sort((a, b) => {
    const rank = { error: 0, warning: 1, info: 2 }
    return rank[a.severity] - rank[b.severity]
  })

  return { ok: true, error: null, entries, warnings, stats }
}

export async function extractEntry(input, entry) {
  const bytes = toBytes(input)
  if (entry.isDir) throw new Error('is-dir')
  if (entry.encrypted) throw new Error('encrypted')
  if (!EXTRACTABLE_METHODS.has(entry.method)) throw new Error('unsupported-method')
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const off = entry.localOffset
  if (off < 0 || off + 30 > bytes.length) throw new Error('bad-local-header')
  if (dv.getUint32(off, true) !== SIG.LOCAL) throw new Error('bad-local-header')
  const nameLen = dv.getUint16(off + 26, true)
  const extraLen = dv.getUint16(off + 28, true)
  const dataStart = off + 30 + nameLen + extraLen
  const dataEnd = dataStart + entry.compressedSize
  if (dataEnd > bytes.length) throw new Error('truncated-data')
  const data = bytes.subarray(dataStart, dataEnd)

  if (entry.method === 0) return data.slice()

  if (typeof DecompressionStream === 'undefined') throw new Error('no-decompression-stream')
  const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'))
  const out = await new Response(stream).arrayBuffer()
  return new Uint8Array(out)
}

function toDos(date) {
  const year = date.getUTCFullYear()
  const dosDate = (((year - 1980) & 0x7f) << 9) | ((date.getUTCMonth() + 1) << 5) | date.getUTCDate()
  const dosTime =
    (date.getUTCHours() << 11) | (date.getUTCMinutes() << 5) | (date.getUTCSeconds() >> 1)
  return { dosDate, dosTime }
}

function concat(parts) {
  let total = 0
  for (const p of parts) total += p.length
  const out = new Uint8Array(total)
  let o = 0
  for (const p of parts) {
    out.set(p, o)
    o += p.length
  }
  return out
}

async function deflateRaw(bytes) {
  if (typeof CompressionStream === 'undefined') return null
  try {
    const stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate-raw'))
    return new Uint8Array(await new Response(stream).arrayBuffer())
  } catch {
    return null
  }
}

function buildZipBytes(entries) {
  const enc = new TextEncoder()
  const localParts = []
  const centralParts = []
  let offset = 0

  for (const e of entries) {
    const nameBytes = enc.encode(e.name)
    const data = e.data
    const raw = e.raw || data
    const crc = crc32(raw)
    const { dosDate, dosTime } = toDos(e.date)
    const flags = e.flags || 0

    const local = new Uint8Array(30 + nameBytes.length + data.length)
    const lv = new DataView(local.buffer)
    lv.setUint32(0, SIG.LOCAL, true)
    lv.setUint16(4, 20, true)
    lv.setUint16(6, flags, true)
    lv.setUint16(8, e.method, true)
    lv.setUint16(10, dosTime, true)
    lv.setUint16(12, dosDate, true)
    lv.setUint32(14, crc, true)
    lv.setUint32(18, data.length, true)
    lv.setUint32(22, raw.length, true)
    lv.setUint16(26, nameBytes.length, true)
    lv.setUint16(28, 0, true)
    local.set(nameBytes, 30)
    local.set(data, 30 + nameBytes.length)
    localParts.push(local)

    const central = new Uint8Array(46 + nameBytes.length)
    const cv = new DataView(central.buffer)
    cv.setUint32(0, SIG.CENTRAL, true)
    cv.setUint16(4, (3 << 8) | 20, true) // host unix + spec 2.0
    cv.setUint16(6, 20, true)
    cv.setUint16(8, flags, true)
    cv.setUint16(10, e.method, true)
    cv.setUint16(12, dosTime, true)
    cv.setUint16(14, dosDate, true)
    cv.setUint32(16, crc, true)
    cv.setUint32(20, data.length, true)
    cv.setUint32(24, raw.length, true)
    cv.setUint16(28, nameBytes.length, true)
    cv.setUint16(30, 0, true)
    cv.setUint16(32, 0, true)
    cv.setUint16(34, 0, true)
    cv.setUint16(36, 0, true)
    const mode = e.isDir ? 0o40755 : 0o100644
    cv.setUint32(38, (((mode << 16) | (e.isDir ? 0x10 : 0)) >>> 0), true)
    cv.setUint32(42, offset, true)
    central.set(nameBytes, 46)
    centralParts.push(central)

    offset += local.length
  }

  const cdBytes = concat(centralParts)
  const eocd = new Uint8Array(22)
  const ev = new DataView(eocd.buffer)
  ev.setUint32(0, SIG.EOCD, true)
  ev.setUint16(4, 0, true)
  ev.setUint16(6, 0, true)
  ev.setUint16(8, entries.length, true)
  ev.setUint16(10, entries.length, true)
  ev.setUint32(12, cdBytes.length, true)
  ev.setUint32(16, offset, true)
  ev.setUint16(20, 0, true)

  return concat([...localParts, cdBytes, eocd])
}

const SAMPLE_DATE = new Date(Date.UTC(2026, 0, 15, 10, 30, 0))

const NORMAL_CONTENT = [
  {
    name: 'README.md',
    text: `# Meu Projeto

Projeto de exemplo usado pelo Inspetor de ZIP.

## Instalação

\`\`\`bash
npm install
npm run dev
\`\`\`

## Estrutura

- \`src/\` — código
- \`docs/\` — documentação
`,
  },
  {
    name: 'package.json',
    text: `{\n  "name": "amostra",\n  "version": "1.4.2",\n  "private": true\n}\n`,
  },
  { name: 'src/index.js', text: `import { run } from './utils/helpers.js'\n\nrun()\n` },
  {
    name: 'src/utils/helpers.js',
    text: `export function run() {\n  console.log('hello from the sample zip')\n}\n`,
  },
  {
    name: 'assets/logo.svg',
    text: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="#1677ff"/><path d="M20 40l12-16 12 16z" fill="#fff"/></svg>\n`,
  },
  {
    name: 'docs/guide.md',
    text: `# Guia\n\nComo usar a amostra.\n\n1. Abra o ZIP no inspetor\n2. Clique numa entrada\n3. Veja o preview\n`,
  },
]

const PROBLEM_EXTRA = [
  { name: '../evil.sh', text: '#!/bin/sh\necho "zip-slip"\n' },
  { name: '/etc/passwd', text: 'root:x:0:0:root:/root:/bin/bash\n' },
  { name: 'C:\\windows\\system32\\evil.dll', text: 'MZ\x90\x00 fake dll payload\n' },
]

// Monta um .zip válido em memória. `kind`:
//  - 'normal'   → 7 entradas saudáveis em pastas aninhadas (deflate onde dá)
//  - 'problems' → entradas propositalmente ruins pra acender os avisos
export async function buildSampleZip(kind = 'normal') {
  const enc = new TextEncoder()
  const date = SAMPLE_DATE
  const entries = []

  const pushFile = async (name, text, opts = {}) => {
    const raw = enc.encode(text)
    let data = raw
    let method = 0
    if (!opts.store) {
      const z = await deflateRaw(raw)
      if (z && z.length < raw.length) {
        data = z
        method = 8
      }
    }
    entries.push({ name, raw, data, method, flags: opts.flags || 0, isDir: false, date })
  }

  if (kind === 'problems') {
    await pushFile('README.md', '# Exemplo com problemas\n\nAmostra gerada pra acender avisos.\n')
    await pushFile('README.md', '# Exemplo com problemas (duplicado)\n')
    for (const p of PROBLEM_EXTRA) await pushFile(p.name, p.text)
    // 200 KB de "A" com deflate: razão ~900× (clássica zip bomb)
    await pushFile('bomb.txt', 'A'.repeat(200000))
    const filler = enc.encode('payload criptografado de mentira'.repeat(4))
    entries.push({ name: 'encrypted.dat', raw: filler, data: filler, method: 0, flags: 0x1, isDir: false, date })
    entries.push({ name: 'legacy.lzh', raw: filler, data: filler, method: 14, flags: 0, isDir: false, date })
    entries.push({ name: 'docs/', data: new Uint8Array(0), method: 0, flags: 0, isDir: true, date })
    return buildZipBytes(entries)
  }

  entries.push({ name: 'docs/', data: new Uint8Array(0), method: 0, flags: 0, isDir: true, date })
  for (const f of NORMAL_CONTENT) await pushFile(f.name, f.text)
  return buildZipBytes(entries)
}
