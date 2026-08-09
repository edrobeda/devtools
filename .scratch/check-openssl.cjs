const puppeteer = require('puppeteer')
const BASE = 'https://devtools.eventifylab.com'

async function checkPage(browser, path, label) {
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message))
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push('CONSOLE: ' + m.text())
  })
  await page.goto(BASE + path, { waitUntil: 'networkidle0', timeout: 30000 })
  const title = await page.title().catch(() => '?')
  const bodyText = await page.evaluate(() => document.body.innerText.length)
  await new Promise(r => setTimeout(r, 1500))
  await page.close()
  console.log(`[${label}] title="${title}" bodyLen=${bodyText} errors=${errors.length}`)
  errors.forEach((e) => console.log('   ' + e))
  return errors.length
}

;(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] })
  let failed = 0
  failed += await checkPage(browser, '/devops/openssl-commands', 'openssl')
  failed += await checkPage(browser, '/', 'home')
  await browser.close()
  console.log(failed === 0 ? 'ALL OK' : 'FAILURES: ' + failed)
  process.exit(failed === 0 ? 0 : 1)
})()
