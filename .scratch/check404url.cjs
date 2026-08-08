const puppeteer = require('puppeteer')
;(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] })
  const page = await browser.newPage()
  const failed = []
  page.on('response', (res) => { if (res.status() >= 400) failed.push(res.status() + ' ' + res.url()) })
  await page.goto('https://devtools.eventifylab.com/', { waitUntil: 'networkidle2', timeout: 60000 })
  await new Promise((r) => setTimeout(r, 800))
  console.log('FAILED REQUESTS on /:')
  failed.forEach((f) => console.log('  ', f))
  await browser.close()
})()
