function reflect(value, width) {
  let r = 0
  for (let i = 0; i < width; i++) {
    r = (r << 1) | (value & 1)
    value >>>= 1
  }
  return r >>> 0
}

function makeTable(alg) {
  const w = alg.bits
  const mask = w === 32 ? 0xffffffff : (1 << w) - 1
  const poly = (alg.refin ? reflect(alg.poly, w) : alg.poly) >>> 0
  const table = new Array(256)
  for (let i = 0; i < 256; i++) {
    let crc = alg.refin ? i : (i << (w - 8))
    for (let j = 0; j < 8; j++) {
      if (alg.refin) {
        crc = crc & 1 ? ((crc >>> 1) ^ poly) : (crc >>> 1)
      } else {
        const topMask = w === 32 ? 0x80000000 : (1 << (w - 1))
        crc = crc & topMask ? ((crc << 1) ^ poly) : (crc << 1)
        crc &= mask
      }
      crc >>>= 0
    }
    table[i] = crc >>> 0
  }
  return { table, mask }
}

function crcBytes(alg, bytes) {
  const w = alg.bits
  const { table, mask } = makeTable(alg)
  let crc = alg.init >>> 0
  if (alg.refin) {
    for (const byte of bytes) crc = (crc >>> 8) ^ table[(crc ^ byte) & 0xff]
  } else {
    for (const byte of bytes) {
      crc = (((crc << 8) & mask) ^ table[((((crc >>> (w - 8)) & 0xff) ^ byte) & 0xff)]) >>> 0
    }
  }
  crc ^= alg.xorout
  if (alg.refout !== alg.refin) crc = reflect(crc, w)
  return crc >>> 0
}

function hex(v, width) {
  return v.toString(16).padStart(width / 4, '0').toUpperCase()
}

const ALGOS = [
  { key: 'crc8', name: 'CRC-8', bits: 8, poly: 0x07, init: 0x00, refin: false, refout: false, xorout: 0x00, check: 'F4' },
  { key: 'crc8maxim', name: 'CRC-8/MAXIM', bits: 8, poly: 0x31, init: 0x00, refin: true, refout: true, xorout: 0x00, check: 'A1' },
  { key: 'crc16modbus', name: 'CRC-16/MODBUS', bits: 16, poly: 0x8005, init: 0xffff, refin: true, refout: true, xorout: 0x0000, check: '4B37' },
  { key: 'crc16ccittf', name: 'CRC-16/CCITT-FALSE', bits: 16, poly: 0x1021, init: 0xffff, refin: false, refout: false, xorout: 0x0000, check: '29B1' },
  { key: 'crc16xmodem', name: 'CRC-16/XMODEM', bits: 16, poly: 0x1021, init: 0x0000, refin: false, refout: false, xorout: 0x0000, check: '31C3' },
  { key: 'crc16kermit', name: 'CRC-16/KERMIT', bits: 16, poly: 0x1021, init: 0x0000, refin: true, refout: true, xorout: 0x0000, check: '2189' },
  { key: 'crc32', name: 'CRC-32 (ISO-HDLC)', bits: 32, poly: 0x04c11db7, init: 0xffffffff, refin: true, refout: true, xorout: 0xffffffff, check: 'CBF43926' },
  { key: 'crc32c', name: 'CRC-32/C (Castagnoli)', bits: 32, poly: 0x1edc6f41, init: 0xffffffff, refin: true, refout: true, xorout: 0xffffffff, check: 'E3069283' },
  { key: 'crc32mpeg2', name: 'CRC-32/MPEG-2', bits: 32, poly: 0x04c11db7, init: 0xffffffff, refin: false, refout: false, xorout: 0x00000000, check: '0376E6E7' },
]

const bytes = new TextEncoder().encode('123456789')
let failures = 0
for (const alg of ALGOS) {
  const got = hex(crcBytes(alg, bytes), alg.bits)
  const ok = got === alg.check
  if (!ok) failures++
  console.log(`${ok ? 'PASS' : 'FAIL'} ${alg.name.padEnd(20)} expected=${alg.check} got=${got}`)
}
console.log('empty CRC-32 =', hex(crcBytes(ALGOS[6], new Uint8Array()), 32), '(expect 00000000)')
process.exit(failures ? 1 : 0)