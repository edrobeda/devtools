const puppeteer = require('puppeteer')
const URL = 'https://devtools.eventifylab.com'
;(async () => {
  let browser
  try {
    browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] })
    const page = await browser.newPage()
    const failed = []
    page.on('requestfailed', (req) => failed.push('FAILED ' + req.url() + ' ' + req.failure().errorText))
    page.on('response', (res) => { if (res.status() >= 400) failed.push(res.status() + ' ' + res.url()) })
    page.on('console', (msg) => { if (msg.type() === 'error') failed.push('[console] ' + msg.text()) })
    await page.goto(URL + '/network/mime-lookup', { waitUntil: 'networkidle0', timeout: 45000 })
    await new Promise((r) => setTimeout(r, 600))
    console.log('issues:', failed.length)
    failed.forEach((f) => console.log(' -', f))
    await browser.close()
    process.exit(0)
  } catch (e) {
    console.error('FATAL', e)
    try { if (browser) await browser.close() } catch (_) {}
    process.exit(1)
  }
})()