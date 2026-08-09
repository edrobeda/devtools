import puppeteer from 'puppeteer'

const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] })
const page = await browser.newPage()
const errors = []
page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`))
page.on('console', (msg) => { if (msg.type() === 'error' && !msg.text().includes('404')) errors.push(`console.error: ${msg.text()}`) })
await page.goto('https://devtools.eventifylab.com/frontend/meta-tags-generator', { waitUntil: 'networkidle0' })
await new Promise((r) => setTimeout(r, 800))

// click "Artigo de blog" preset
await page.evaluate(() => {
  const btn = Array.from(document.querySelectorAll('button')).find((b) => b.innerText.includes('Artigo'))
  if (btn) btn.click()
})
await new Promise((r) => setTimeout(r, 500))

const code = await page.evaluate(() => document.querySelector('pre code').innerText)
console.log('article preset has article:published_time:', code.includes('article:published_time'))
console.log('article preset has og:type article:', code.includes('og:type" content="article"'))
console.log('author inserted:', code.includes('article:author'))

// toggle twitter off via checkbox
await page.evaluate(() => {
  const checks = Array.from(document.querySelectorAll('input[type="checkbox"]'))
  const tb = checks.find((c) => c.nextSibling && c.nextSibling.textContent && c.nextSibling.textContent.includes('Twitter'))
  if (tb) tb.click()
})
await new Promise((r) => setTimeout(r, 500))
const code2 = await page.evaluate(() => document.querySelector('pre code').innerText)
console.log('twitter removed after uncheck:', !code2.includes('twitter:card'))

console.log(errors.length ? 'ERRORS: ' + errors.join(' | ') : 'NO JS ERRORS')
await browser.close()