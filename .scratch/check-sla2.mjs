import puppeteer from 'puppeteer'

const browser = await puppeteer.launch({
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
})
const page = await browser.newPage()
const jsErrors = []
page.on('pageerror', (err) => jsErrors.push(`pageerror: ${err.message}`))
page.on('response', (resp) => {
  if (resp.status() >= 400 && !resp.url().includes('favicon')) jsErrors.push(`${resp.status()} ${resp.url()}`)
})
await page.goto('https://devtools.eventifylab.com/devops/sla-calculator', {
  waitUntil: 'networkidle0',
  timeout: 60000,
})
await new Promise((r) => setTimeout(r, 1000))

// default: 99.9%, 30d -> 43.2 min
const rows0 = await page.evaluate(() => {
  return Array.from(document.querySelectorAll('.ant-descriptions-row')).map((r) => r.textContent.replace(/\s+/g, ' ').trim())
})
console.log('default rows:', rows0)

// click 99.99% preset
await page.evaluate(() => {
  const target = Array.from(document.querySelectorAll('.ant-tag')).find((t) => t.textContent.trim() === '99.99%')
  if (target) target.click()
})
await new Promise((r) => setTimeout(r, 400))
const rows1 = await page.evaluate(() => {
  return Array.from(document.querySelectorAll('.ant-descriptions-row')).map((r) => r.textContent.replace(/\s+/g, ' ').trim())
})
console.log('after 99.99% rows:', rows1)

// set first incident to 5 hours -> 300 min > budget ~4.3min -> exceeded
await page.evaluate(() => {
  const inputs = Array.from(document.querySelectorAll('.ant-input-number-input'))
  if (inputs[0]) {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
    setter.call(inputs[0], '5')
    inputs[0].dispatchEvent(new Event('input', { bubbles: true }))
    inputs[0].dispatchEvent(new Event('change', { bubbles: true }))
  }
})
await new Promise((r) => setTimeout(r, 500))
const rows2 = await page.evaluate(() => {
  return Array.from(document.querySelectorAll('.ant-descriptions-row')).map((r) => r.textContent.replace(/\s+/g, ' ').trim())
})
console.log('after 5h incident rows:', rows2)

console.log('js errors:', jsErrors.length ? jsErrors : 'none')
await browser.close()
process.exit(jsErrors.length ? 1 : 0)