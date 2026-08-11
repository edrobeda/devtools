import puppeteer from 'puppeteer'

const BASE = 'https://devtools.eventifylab.com'
const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] })
const page = await browser.newPage()
const errors = []
page.on('pageerror', (e) => errors.push(`PAGEERROR: ${e.message}`))
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(`CONSOLE: ${msg.text()}`)
})
await page.goto(BASE + '/references/gh-cli-cheatsheet', { waitUntil: 'networkidle0', timeout: 60000 })
await new Promise((r) => setTimeout(r, 1000))

let failed = false

// type a search query
await page.type('input.ant-input', 'merge')
await new Promise((r) => setTimeout(r, 500))
let count = await page.evaluate(() => document.querySelectorAll('.ant-list-item').length)
let txt = await page.evaluate(() => document.body.innerText)
console.log('results after "merge":', count)
if (count < 1 || !txt.includes('gh pr merge')) failed = true

// clear via keyboard (select all + delete)
await page.click('input.ant-input')
await page.keyboard.down('Control')
await page.keyboard.press('KeyA')
await page.keyboard.up('Control')
await page.keyboard.press('Backspace')
await new Promise((r) => setTimeout(r, 500))
count = await page.evaluate(() => document.querySelectorAll('.ant-list-item').length)
console.log('results after clear:', count)
if (count !== 81) failed = true

// pick the "api" category radio
const clicked = await page.evaluate(() => {
  const radios = [...document.querySelectorAll('.ant-radio-button-wrapper')]
  const api = radios.find((r) => r.textContent.includes('gh api') || r.textContent.includes('automação'))
  if (api) { api.click(); return true }
  return false
})
await new Promise((r) => setTimeout(r, 500))
count = await page.evaluate(() => document.querySelectorAll('.ant-list-item').length)
console.log('category api clicked:', clicked, '| results:', count)
if (!clicked || count < 10) failed = true

console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'no page/console errors')
if (errors.length) failed = true

await browser.close()
console.log(failed ? '\nFAIL' : '\nOK')
process.exit(failed ? 1 : 0)