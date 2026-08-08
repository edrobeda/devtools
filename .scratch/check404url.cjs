const puppeteer = require('puppeteer')
async function main() {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] })
  const page = await browser.newPage()
  page.on('response', (r) => { if (r.status() >= 400) console.log('HTTP', r.status(), r.url()) })
  page.on('console', (m) => { if (m.type() === 'error') console.log('console.error:', m.text()) })
  await page.goto('https://devtools.eventifylab.com/', { waitUntil: 'networkidle0' })
  await new Promise((r) => setTimeout(r, 2000))
  await browser.close()
}
main().catch((e) => { console.error(e); process.exit(1) })
