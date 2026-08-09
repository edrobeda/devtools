import puppeteer from 'puppeteer'

const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] })
const page = await browser.newPage()
page.on('requestfailed', (req) => console.log('reqfailed:', req.url(), req.failure()?.errorText))
page.on('response', (res) => {
  if (res.status() >= 400) console.log(`HTTP ${res.status()}`, res.url())
})
await page.goto('https://devtools.eventifylab.com/', { waitUntil: 'networkidle0' })
await new Promise((r) => setTimeout(r, 1200))
await browser.close()
console.log('done')