const puppeteer = require('puppeteer')

;(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] })
  const page = await browser.newPage()
  page.on('console', (m) => {
    if (m.type() === 'error') console.log('CONSOLE: ' + m.text())
  })
  await page.goto('https://devtools.eventifylab.com/', { waitUntil: 'networkidle0', timeout: 60000 })
  await new Promise((r) => setTimeout(r, 1500))
  await browser.close()
})()