import puppeteer from 'puppeteer'

const base = 'https://devtools.eventifylab.com'
const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] })
const page = await browser.newPage()
await page.setViewport({ width: 1280, height: 900 })
const errors = []
page.on('pageerror', (err) => errors.push('pageerror: ' + err.message))
page.on('console', (msg) => {
  if (msg.type() === 'error' && !msg.text().includes('favicon') && !msg.text().includes('status of 404')) errors.push('console.error: ' + msg.text())
})

await page.goto(base + '/frontend/clip-path-generator', { waitUntil: 'networkidle2', timeout: 60000 })
await new Promise((r) => setTimeout(r, 1500))

const before = await page.evaluate(() => document.querySelector('pre code')?.innerText)
console.log('output before drag:', before)

const canvas = await page.$('div[ref=canvasRef]').catch(() => null)
// find canvas: the element with touchAction none; use the marker first element
const canvasBox = await page.evaluate(() => {
  const el = [...document.querySelectorAll('div')].find((d) => d.style && d.style.touchAction === 'none')
  if (!el) return null
  const r = el.getBoundingClientRect()
  return { x: r.x, y: r.y, w: r.width, h: r.height }
})
console.log('canvas box:', canvasBox)
if (canvasBox) {
  // first marker is at (0%,0%) -> top-left corner of canvas
  const sx = canvasBox.x + 2
  const sy = canvasBox.y + 2
  const mx = canvasBox.x + canvasBox.w * 0.6
  const my = canvasBox.y + canvasBox.h * 0.4
  await page.mouse.move(sx, sy)
  await page.mouse.down()
  await page.mouse.move(mx, my, { steps: 8 })
  await page.mouse.up()
  await new Promise((r) => setTimeout(r, 400))
}
const after = await page.evaluate(() => document.querySelector('pre code')?.innerText)
console.log('output after drag:', after)

const changed = before !== after && /polygon\(60% 40%/.test(after || '')
console.log('drag moved first vertex to ~(60%,40%):', changed)

if (errors.length) { console.log('ERRORS:'); errors.forEach((e) => console.log('  ' + e)); }
else console.log('no pageerror / console errors')

await browser.close()
if (!changed || errors.length) process.exit(1)
console.log('ALL OK')