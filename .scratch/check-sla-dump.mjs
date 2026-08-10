import puppeteer from 'puppeteer'

const browser = await puppeteer.launch({
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
})
const page = await browser.newPage()
const jsErrors = []
page.on('pageerror', (err) => jsErrors.push(`pageerror: ${err.message}`))
page.on('response', (resp) => {
  if (resp.status() >= 400) jsErrors.push(`${resp.status()} ${resp.url()}`)
})
await page.goto('https://devtools.eventifylab.com/devops/sla-calculator', {
  waitUntil: 'networkidle0',
  timeout: 60000,
})
await new Promise((r) => setTimeout(r, 1000))

// click 99.99% preset
await page.evaluate(() => {
  const tags = Array.from(document.querySelectorAll('.ant-tag'))
  const target = tags.find((t) => t.textContent.trim() === '99.99%')
  if (target) target.click()
})
await new Promise((r) => setTimeout(r, 300))

// set first incident value stays 30 min, add a longer one? Instead change first incident to 5 hours value
await page.evaluate(() => {
  const inputs = Array.from(document.querySelectorAll('.ant-input-number-input'))
  if (inputs[1]) {
    // second row value input (first row's unit select is first input+select... check)
  }
})

// dump all descriptions content
const dump = await page.evaluate(() => {
  const items = Array.from(document.querySelectorAll('.ant-descriptions-item'))
  return items.map((i) => i.textContent.replace(/\s+/g, ' ').trim())
})
console.log('descriptions items:')
dump.forEach((d) => console.log(' -', d.slice(0, 110)))

console.log('progress:', await page.evaluate(() => {
  const p = document.querySelector('.ant-progress-text')
  return p ? p.textContent : 'na'
}))

console.log('js errors:', jsErrors.length ? jsErrors : 'none')
await browser.close()
process.exit(jsErrors.length ? 1 : 0)