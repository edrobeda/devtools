import puppeteer from 'puppeteer'

const browser = await puppeteer.launch({
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
})
const page = await browser.newPage()
page.on('response', (resp) => {
  if (resp.status() >= 400) {
    console.log(`${resp.status()} ${resp.url()}`)
  }
})
await page.goto('https://devtools.eventifylab.com/devops/sla-calculator', {
  waitUntil: 'networkidle0',
  timeout: 60000,
})
await browser.close()