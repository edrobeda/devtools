import puppeteer from 'puppeteer'

const BASE = 'https://devtools.eventifylab.com'
const routes = [
  '/',
  '/tools/hash-generator',
  '/security/sri-hash-generator',
]

const browser = await puppeteer.launch({
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
})
let failed = false

for (const route of routes) {
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`console: ${m.text()}`)
  })
  page.on('requestfailed', (r) => errors.push(`reqfail: ${r.url()} ${r.failure()?.errorText}`))

  await page.goto(BASE + route, { waitUntil: 'networkidle2', timeout: 60000 })
  await new Promise((r) => setTimeout(r, 2500))
  const info = await page.evaluate(() => ({
    url: location.pathname,
    h2: document.querySelector('h2')?.innerText || null,
    body: document.body.innerText.slice(0, 200),
  }))
  console.log(`\n=== ${route} -> ${info.url} | h2=${JSON.stringify(info.h2)}`)
  if (errors.length) {
    failed = true
    console.log('  ERRORS:')
    errors.forEach((e) => console.log('   -', e))
  } else {
    console.log('  no pageerror/console errors')
  }
  await page.close()
}

// Deep test: file mode + SRI on hash-generator
const page = await browser.newPage()
const errors = []
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`) })
await page.goto(`${BASE}/tools/hash-generator`, { waitUntil: 'networkidle2' })

// switch to File mode
await page.evaluate(() => {
  const items = [...document.querySelectorAll('.ant-segmented-item')]
  items.find((el) => /arquivo|file/i.test(el.innerText))?.click()
})
await new Promise((r) => setTimeout(r, 800))

// select all algorithms
await page.evaluate(() => {
  const cb = [...document.querySelectorAll('.ant-checkbox-wrapper')]
  cb.find((el) => /^(todos|all)$/i.test(el.innerText.trim()))?.click()
})
await new Promise((r) => setTimeout(r, 500))

// attach a file
const input = await page.$('input[type=file]')
await input.uploadFile('/home/devtools-bot/devtools/.scratch/sample.txt')
await new Promise((r) => setTimeout(r, 1500))

await page.evaluate(() => {
  const btns = [...document.querySelectorAll('button')]
  btns.find((b) => /calcular|calculate/i.test(b.innerText))?.click()
})
await new Promise((r) => setTimeout(r, 3000))

const sriText = await page.evaluate(() => {
  const txt = document.body.innerText
  return txt.includes('Subresource Integrity (SRI)')
})
console.log('\n=== file-mode SRI block present:', sriText)

const base64 = await page.evaluate(() => {
  const m = document.body.innerText.match(/sha(?:256|384|512)-[A-Za-z0-9+/=]{20,}/g)
  return m
})
console.log('=== base64 SRI strings found:', base64 && base64.length, base64 && base64.slice(0, 3))

// fill CDN url -> tag
await page.evaluate(() => {
  const inp = [...document.querySelectorAll('input')].find((i) => /cdn\.(exemplo|example)\.com/.test(i.placeholder || ''))
  console.log('=== sri url input found:', !!inp, inp?.placeholder)
  if (inp) {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
    setter.call(inp, 'https://cdn.example.com/lib/app.min.js')
    inp.dispatchEvent(new Event('input', { bubbles: true }))
  }
})
await new Promise((r) => setTimeout(r, 1500))
const tag = await page.evaluate(() => {
  const all = [...document.querySelectorAll('pre')]
  const hit = all.map((p) => p.innerText).find((x) => x.includes('<script src=') || x.includes('<link rel="stylesheet"'))
  return hit || null
})
console.log('=== generated tag:', tag)

console.log('\n=== deep-test errors:', errors.length ? errors : 'none')
if (errors.length || !sriText || !base64 || base64.length < 3 || !tag) failed = true

await browser.close()
console.log(failed ? '\nRESULT: FAIL' : '\nRESULT: PASS')
process.exit(failed ? 1 : 0)