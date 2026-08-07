const puppeteer = require('puppeteer')
;(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] })
  const page = await browser.newPage()
  const errs = []
  page.on('response', (r) => { if (r.status() === 404) errs.push('404: ' + r.url()) })
  await page.goto('https://devtools.eventifylab.com/', { waitUntil: 'networkidle0', timeout: 60000 })
  await new Promise((r) => setTimeout(r, 1500))
  console.log('404s:', errs.join(', ') || 'none')
  await browser.close()
})()