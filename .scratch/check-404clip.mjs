import puppeteer from 'puppeteer'

const base = 'https://devtools.eventifylab.com'
const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] })
const page = await browser.newPage()

page.on('response', (res) => {
  if (res.status() >= 400) console.log('HTTP', res.status(), '->', res.url())
})
page.on('requestfailed', (req) => console.log('FAILED', req.url(), req.failure()?.errorText))

await page.goto(base + '/frontend/clip-path-generator', { waitUntil: 'networkidle2', timeout: 60000 })
await new Promise((r) => setTimeout(r, 1500))
await browser.close()
console.log('done')