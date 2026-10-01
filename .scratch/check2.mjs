import puppeteer from 'puppeteer'

const BASE = 'https://devtools.eventifylab.com'
const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] })

// confirm /api/visits abort is pre-existing on an untouched page
const p0 = await browser.newPage()
const e0 = []
p0.on('requestfailed', (r) => { if (r.url().includes('/api/visits')) e0.push(r.failure()?.errorText) })
await p0.goto(`${BASE}/tools/uuid-v7-tool`, { waitUntil: 'networkidle2' })
console.log('untouched page /api/visits aborts:', e0.length, '(pre-existing if > 0)')
await p0.close()

const page = await browser.newPage()
const errors = []
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`) })
await page.goto(`${BASE}/tools/hash-generator`, { waitUntil: 'networkidle2' })

await page.evaluate(() => {
  [...document.querySelectorAll('.ant-segmented-item')].find((el) => /arquivo|file/i.test(el.innerText))?.click()
})
await new Promise((r) => setTimeout(r, 800))

// select ALL
await page.evaluate(() => {
  [...document.querySelectorAll('.ant-checkbox-wrapper')].find((el) => /^(todos|all)$/i.test(el.innerText.trim()))?.click()
})
await new Promise((r) => setTimeout(r, 400))
const input = await page.$('input[type=file]')
await input.uploadFile('/home/devtools-bot/devtools/.scratch/sample.txt')
await new Promise((r) => setTimeout(r, 1200))
await page.evaluate(() => {
  [...document.querySelectorAll('button')].find((b) => /calcular|calculate/i.test(b.innerText))?.click()
})
await new Promise((r) => setTimeout(r, 3000))

// toggle to Stylesheet + set URL
await page.evaluate(() => {
  [...document.querySelectorAll('.ant-radio-button-wrapper')].find((el) => /stylesheet/i.test(el.innerText))?.click()
  const inp = [...document.querySelectorAll('input')].find((i) => /cdn\.(exemplo|example)\.com/.test(i.placeholder || ''))
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
  setter.call(inp, 'https://cdn.example.com/a.css')
  inp.dispatchEvent(new Event('input', { bubbles: true }))
})
await new Promise((r) => setTimeout(r, 1200))
const linkTag = await page.evaluate(() =>
  [...document.querySelectorAll('pre')].map((p) => p.innerText).find((x) => x.includes('<link rel="stylesheet"')))
console.log('stylesheet tag ok:', !!linkTag)

// verify-field still works (exclusivity)
const verified = await page.evaluate(async () => {
  const inp = [...document.querySelectorAll('input')].find((i) => /hash esperado|expected hash/i.test(i.placeholder || ''))
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
  setter.call(inp, 'ZUNBNSTF4FZ9IGDGYO4NOOE8UKBZ2Z42LJWVUUPJ/OI=')
  inp.dispatchEvent(new Event('input', { bubbles: true }))
  await new Promise((r) => setTimeout(r, 800))
  return document.body.innerText.includes('Bate SHA-256') || /match sha-256/i.test(document.body.innerText)
})
console.log('verify field (MD5/verify exclusive feature) works:', verified)

const md5 = await page.evaluate(() => /^[0-9a-f]{32}$/m.test(document.body.innerText))
console.log('MD5 (exclusive) still present:', md5)

console.log('errors:', errors.length ? errors : 'none')
await browser.close()