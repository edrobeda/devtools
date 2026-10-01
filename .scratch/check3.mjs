import puppeteer from 'puppeteer'
const BASE = 'https://devtools.eventifylab.com'
const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] })
const page = await browser.newPage()
page.on('pageerror', (e) => console.log('pageerror', e.message))
await page.goto(`${BASE}/tools/hash-generator`, { waitUntil: 'networkidle2' })

await page.evaluate(() => {
  [...document.querySelectorAll('.ant-segmented-item')].find((el) => /arquivo|file/i.test(el.innerText))?.click()
})
await new Promise((r) => setTimeout(r, 700))
await page.evaluate(() => {
  [...document.querySelectorAll('.ant-checkbox-wrapper')].find((el) => /^(todos|all)$/i.test(el.innerText.trim()))?.click()
})
await new Promise((r) => setTimeout(r, 400))
const input = await page.$('input[type=file]')
await input.uploadFile('/home/devtools-bot/devtools/.scratch/sample.txt')
await new Promise((r) => setTimeout(r, 1000))
await page.evaluate(() => {
  [...document.querySelectorAll('button')].find((b) => /calcular|calculate/i.test(b.innerText))?.click()
})
await new Promise((r) => setTimeout(r, 2500))

const out = await page.evaluate(async () => {
  const inputs = [...document.querySelectorAll('input')]
  const phs = inputs.map((i) => i.placeholder)
  const inp = inputs.find((i) => /hash esperado|expected hash/i.test(i.placeholder || ''))
  if (!inp) return { phs, err: 'no verify input' }
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
  setter.call(inp, '6549db9d24c5e1fcfd8a0760c8ee27a0e7bc5246f3d99e36949bd552ea63fe82')
  inp.dispatchEvent(new Event('input', { bubbles: true }))
  await new Promise((r) => setTimeout(r, 1000))
  const tags = [...document.querySelectorAll('.ant-tag')].map((t) => t.innerText.trim())
  return { phs, tags }
})
console.log(JSON.stringify(out, null, 2))
await browser.close()