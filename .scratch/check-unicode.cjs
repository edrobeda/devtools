const puppeteer = require('puppeteer')

const routes = [
  '/',
  '/tools/unicode-inspector',
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

    if (route === '/tools/unicode-inspector') {
      // Interage: digita texto de exemplo e confere que a tabela renderiza
      const sample = 'a ç é 👋🏽\u200B\u200C zero'
      await page.waitForSelector('textarea')
      await page.type('textarea', sample, { delay: 5 })
      await new Promise((r) => setTimeout(r, 800))
      const rows = await page.$$eval('.ant-table-row', (els) => els.length)
      const hasWarning = await page.evaluate(() =>
        !!document.querySelector('.ant-alert-warning')
      )
      console.log('table rows:', rows, 'warning alert:', hasWarning)
      if (rows === 0 || !hasWarning) {
        failures++
        console.log('FAIL interaction check')
      }
    }

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
