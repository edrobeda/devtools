import puppeteer from 'puppeteer'
const browser = await puppeteer.launch({ args: ['--no-sandbox'] })
const page = await browser.newPage()
page.on('requestfailed', (r) => console.log('FAILED', r.url(), r.failure()?.errorText))
page.on('response', (r) => { if (r.status() >= 400) console.log('HTTP', r.status(), r.url()) })
await page.goto('https://devtools.eventifylab.com/', { waitUntil: 'networkidle2', timeout: 30000 })
await new Promise((r) => setTimeout(r, 1500))
await browser.close()
