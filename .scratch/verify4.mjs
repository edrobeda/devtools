import puppeteer from 'puppeteer'

const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] })
const page = await browser.newPage()
const errors = []
page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`))
await page.goto('https://devtools.eventifylab.com/frontend/meta-tags-generator', { waitUntil: 'networkidle0' })
await new Promise((r) => setTimeout(r, 800))

const before = await page.evaluate(() => document.querySelector('pre code').innerText)
console.log('before has twitter:', before.includes('twitter:card'))

await page.evaluate(() => {
  const checks = Array.from(document.querySelectorAll('input[type="checkbox"]'))
  checks.find((c) => (c.closest('label') || {}).innerText && c.closest('label').innerText.includes('Twitter')).click()
})
await new Promise((r) => setTimeout(r, 500))
const after = await page.evaluate(() => document.querySelector('pre code').innerText)
console.log('after uncheck has twitter:', after.includes('twitter:card'))

// re-enable, switch card to summary
await page.evaluate(() => {
  const checks = Array.from(document.querySelectorAll('input[type="checkbox"]'))
  checks.find((c) => c.closest('label').innerText.includes('Twitter')).click()
})
await new Promise((r) => setTimeout(r, 400))
console.log('errors:', errors.length ? errors.join(' | ') : 'none')
await browser.close()