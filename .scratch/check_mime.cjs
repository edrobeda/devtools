const puppeteer = require('puppeteer')

const URL = 'https://devtools.eventifylab.com'

async function check(page, path) {
  const errors = []
  const pageErrors = []
  const handler = (e) => errors.push(String(e))
  page.on('console', (msg) => { if (msg.type() === 'error') handler(`[console.error] ${msg.text()}`) })
  page.on('pageerror', (err) => pageErrors.push(String(err)))
  await page.goto(URL + path, { waitUntil: 'networkidle0', timeout: 45000 })
  await new Promise((r) => setTimeout(r, 800))
  const title = await page.title()
  // click the search input and type a query to exercise filtering
  try {
    const input = await page.$('input[placeholder*="MIME"], input[placeholder*="mime"], input[placeholder*="tipo MIME"]')
    if (input) {
      await input.click()
      await input.type('png')
      await new Promise((r) => setTimeout(r, 300))
    }
  } catch (e) { /* ignore */ }
  console.log(path, '->', 'title=' + JSON.stringify(title), 'consoleErrors=' + errors.length, 'pageErrors=' + pageErrors.length)
  if (errors.length) console.log('  CONSOLE:', errors.join(' | '))
  if (pageErrors.length) console.log('  PAGEERROR:', pageErrors.join(' | '))
  return errors.length === 0 && pageErrors.length === 0
}

;(async () => {
  let browser
  try {
    browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] })
    const page = await browser.newPage()
    const okMime = await check(page, '/network/mime-lookup')
    const okHome = await check(page, '/')
    await browser.close()
    process.exit(okMime && okHome ? 0 : 1)
  } catch (e) {
    console.error('FATAL', e)
    try { if (browser) await browser.close() } catch (_) {}
    process.exit(1)
  }
})()