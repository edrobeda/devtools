import puppeteer from 'puppeteer'
const URL = 'https://devtools.eventifylab.com'
const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] })
const page = await browser.newPage()
const fails = []
page.on('response', (r) => { if (r.status() >= 400) fails.push(r.status() + ' ' + r.url()) })
await page.goto(URL + '/tools/units-converter', { waitUntil: 'networkidle2', timeout: 60000 })
await new Promise(r => setTimeout(r, 800))
console.log('non-2xx responses:')
console.log(fails.join('\n') || 'none')
await browser.close()
