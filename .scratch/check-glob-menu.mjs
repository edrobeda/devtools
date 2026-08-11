import puppeteer from 'puppeteer'
const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] })
const page = await browser.newPage()
const errs = []
page.on('pageerror', (e) => errs.push(e.message))
await page.goto('https://devtools.eventifylab.com/', { waitUntil: 'networkidle0', timeout: 60000 })
await new Promise((r) => setTimeout(r, 1500))
const body = await page.evaluate(() => document.body.innerText)
const inMenu = body.includes('Glob Pattern Tester (gitignore)')
console.log('menu label present:', inMenu)
console.log('pageerrors:', errs.length ? errs : 'none')
await browser.close()
process.exit(inMenu && !errs.length ? 0 : 1)
