import puppeteer from 'puppeteer'
const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] })
const page = await browser.newPage()
page.on('response', (r) => { if (r.status() >= 400) console.log('HTTP', r.status(), r.url()) })
await page.goto('https://devtools.eventifylab.com/', { waitUntil: 'networkidle0', timeout: 90000 })
await new Promise((r) => setTimeout(r, 1500))
await browser.close()