const puppeteer = require('puppeteer')
async function main() {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] })
  const page = await browser.newPage()
  const req404 = []
  page.on('response', (r) => { if (r.status() >= 400) req404.push(r.status() + ' ' + r.url()) })
  await page.goto('https://devtools.eventifylab.com/frontend/svg-wave-generator', { waitUntil: 'networkidle0', timeout: 60000 })
  await new Promise((r) => setTimeout(r, 1200))
  console.log('4xx/5xx responses:', req404)
  await browser.close()
}
main().catch((e) => { console.error(e); process.exit(1) })