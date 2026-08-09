import puppeteer from 'puppeteer'

const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] })
const page = await browser.newPage()
const errors = []
page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`))
page.on('console', (msg) => { if (msg.type() === 'error' && !msg.text().includes('favicon')) errors.push(`console.error: ${msg.text()}`) })
await page.goto('https://devtools.eventifylab.com/frontend/meta-tags-generator', { waitUntil: 'networkidle0' })
await new Promise((r) => setTimeout(r, 1200))

const body = await page.evaluate(() => document.body.innerText)
const checks = ['Gerador de Meta Tags', 'og:title', 'twitter:card', 'canonical', 'theme-color', 'HTML gerado']
for (const c of checks) console.log((body.includes(c) ? 'FOUND   ' : 'MISSING ') + c)

const html = await page.evaluate(() => document.querySelector('pre code').innerText)
console.log('--- generated head sample ---')
console.log(html.split('\n')[0])
console.log(html.split('\n')[2])

// toggle preset + copy button presence
const btns = await page.evaluate(() => Array.from(document.querySelectorAll('button')).map((b) => b.innerText).filter(Boolean))
console.log('buttons:', btns.join(' | ').slice(0, 200))

console.log(errors.length ? 'ERROS: ' + errors.join(' | ') : 'NO ERRORS')
await browser.close()