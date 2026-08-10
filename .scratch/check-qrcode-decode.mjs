import puppeteer from 'puppeteer'
import jsQR from 'jsqr'

// Desenha o SVG do preview (já no DOM) num canvas e decodifica com jsQR —
// se a string decodificada bater com a de entrada, o QR é escaneável.
async function decodePreview(page, expected) {
  const res = await page.evaluate(() => {
    const el = document.querySelector('svg[aria-label="QR Code"]')
    if (!el) return { error: 'no svg el' }
    const markup = el.outerHTML
    return new Promise((resolve) => {
      const blob = new Blob([markup], { type: 'image/svg+xml;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const img = new Image()
      img.onload = () => {
        try {
          if (!img.width || !img.height) {
            resolve({ error: 'svg rasterized to 0 size' })
            return
          }
          const size = 1024
          const canvas = document.createElement('canvas')
          canvas.width = size
          canvas.height = size
          const ctx = canvas.getContext('2d')
          ctx.fillStyle = '#ffffff'
          ctx.fillRect(0, 0, size, size)
          ctx.drawImage(img, 0, 0, size, size)
          const d = ctx.getImageData(0, 0, size, size)
          resolve({ data: Array.from(d.data), width: size, height: size })
        } catch (e) {
          resolve({ error: 'drawImage: ' + e.message })
        }
      }
      img.onerror = () => resolve({ error: 'image onerror' })
      img.src = url
    })
  })
  if (res.error) return { ok: false, reason: res.error, expected }
  const code = jsQR(new Uint8ClampedArray(res.data), res.width, res.height)
  return { ok: !!code, decoded: code ? code.data : null, expected }
}

const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] })
const page = await browser.newPage()
const errors = []
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()) })

await page.goto('https://devtools.eventifylab.com/tools/qr-code-generator', { waitUntil: 'networkidle2' })
await page.waitForSelector('svg[aria-label="QR Code"]', { timeout: 15000 })

const out = []
out.push(await decodePreview(page, 'https://devtools.eventifylab.com'))

await page.evaluate(() => {
  const tags = [...document.querySelectorAll('.ant-tag')]
  tags.find((t) => t.textContent.includes('WIFI')).click()
})
await new Promise((r) => setTimeout(r, 600))
out.push(await decodePreview(page, 'WIFI:T:WPA;S:Escritorio;P:senha123;;'))

await page.evaluate(() => {
  const tags = [...document.querySelectorAll('.ant-tag')]
  tags.find((t) => t.textContent.includes('JSON')).click()
})
await new Promise((r) => setTimeout(r, 600))
out.push(await decodePreview(page, '{"url":"https://api.eventifylab.com/v1/demo","method":"POST","ttl":300}'))

console.log(JSON.stringify(out, null, 2))
const prior404 = errors.filter((e) => e.includes('favicon'))
const real = errors.filter((e) => !e.includes('favicon'))
console.log(real.length ? 'REAL ISSUES:\n' + real.join('\n') : 'NO_REAL_PAGE_ERRORS')
await browser.close()
const allOk = out.every((o) => o.ok && o.decoded === o.expected) && real.length === 0
process.exit(allOk ? 0 : 1)