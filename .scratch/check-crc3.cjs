const puppeteer = require('puppeteer')

async function run() {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] })
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', (err) => errors.push(String(err)))
  await page.goto('https://devtools.eventifylab.com/tools/crc-calculator', { waitUntil: 'networkidle2', timeout: 60000 })

  const clickedHex = await page.evaluate(() => {
    const buttons = [...document.querySelectorAll('button')]
    const b = buttons.find((x) => x.textContent.trim() === '48 65 6c 6c 6f')
    if (!b) return false
    b.click()
    return true
  })
  console.log('hex sample clicked:', clickedHex)
  await new Promise((r) => setTimeout(r, 800))

  const data = await page.evaluate(() => {
    const tag = [...document.querySelectorAll('.ant-tag')].map((x) => x.textContent.trim())
    const byteCount = tag.find((x) => x.endsWith('bytes'))
    const crc32row = null
    for (const tr of document.querySelectorAll('.ant-table-tbody tr')) {
      if ((tr.querySelector('strong') || {}).textContent === 'CRC-32') {
        return {
          byteCount,
          hex: tr.querySelectorAll('td')[1].textContent.trim(),
          check: tr.querySelectorAll('td')[3].querySelector('code')?.textContent.trim(),
        }
      }
    }
    return { byteCount, hex: crsrow }
  })
  console.log('byte label:', data.byteCount, '| CRC-32 (hex):', data.hex, '| expect bytes=5, hex=0xF7D18982')
  console.log('pageerror:', errors.length)
  if (errors.length) console.log(errors[0].slice(0, 400))
  await browser.close()
  const pass = clickedHex && data.byteCount === '5 bytes' && data.hex === '0xF7D18982' && errors.length === 0
  console.log(pass ? 'ALL GOOD' : 'CHECK FAILED')
  process.exit(pass ? 0 : 1)
}

run().catch((err) => { console.error(err); process.exit(1) })