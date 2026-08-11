const puppeteer = require('puppeteer')

const BASE = 'https://devtools.eventifylab.com'
const routes = ['/', '/tools/morse-code-converter']

;(async () => {
  const results = []
  for (const route of routes) {
    const browser = await puppeteer.launch({
      headless: 'shell',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--autoplay-policy=no-user-gesture-required'],
    })
    const page = await browser.newPage()
    const errors = []
    page.on('pageerror', (err) => errors.push(`PAGEERROR: ${err.message}`))
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(`CONSOLE: ${msg.text()}`)
    })
    try {
      await page.goto(BASE + route, { waitUntil: 'networkidle2', timeout: 60000 })
      await new Promise((r) => setTimeout(r, 1500))
      const text = await page.evaluate(() => document.body.innerText)
      results.push({ route, errors, hasText: text.length })
    } catch (e) {
      results.push({ route, errors: [...errors, `NAV: ${e.message}`], hasText: -1 })
    }
    await browser.close()
  }

  for (const r of results) {
    console.log(`\n=== ${r.route} === bodyChars=${r.hasText}`)
    if (r.errors.length === 0) console.log('OK: no pageerror / console error')
    else r.errors.forEach((e) => console.log('ERROR:', e))
  }

  const anyError = results.some((r) => r.errors.length > 0 || r.hasText <= 0)
  console.log(`\n${anyError ? 'FAIL' : 'ALL PASS'}`)
  process.exit(anyError ? 1 : 0)
})()
