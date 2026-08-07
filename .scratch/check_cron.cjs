const puppeteer = require('puppeteer')

const routes = [
  '/',
  '/tools/cron-builder',
]

;(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] })
  let failures = 0
  for (const route of routes) {
    const page = await browser.newPage()
    const errors = []
    page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message))
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push('CONSOLE: ' + m.text())
    })
    await page.goto('https://devtools.eventifylab.com' + route, { waitUntil: 'networkidle0', timeout: 60000 })
    await new Promise((r) => setTimeout(r, 1500))
    if (errors.length) {
      failures++
      console.log('FAIL ' + route)
      errors.forEach((e) => console.log('  ' + e))
    } else {
      console.log('OK   ' + route)
    }
    await page.close()
  }
  await browser.close()
  process.exit(failures ? 1 : 0)
})()
