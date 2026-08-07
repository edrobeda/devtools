const puppeteer = require('puppeteer')
;(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] })
  const page = await browser.newPage()
  page.on('response', r => { if (r.status() === 404) console.log('404:', r.url()) })
  await page.goto('https://devtools.eventifylab.com/tools/number-to-words', { waitUntil: 'networkidle0' })
  await new Promise(r => setTimeout(r, 1200))
  await browser.close()
})()