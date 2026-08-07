const puppeteer = require('puppeteer')
;(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] })
  const page = await browser.newPage()
  const bad = []
  page.on('response', (r) => {
    if (r.status() >= 400) bad.push(r.status() + ' ' + r.url())
  })
  await page.goto('https://devtools.eventifylab.com/extras/sorting-visualizer', { waitUntil: 'networkidle0', timeout: 60000 })
  await new Promise((r) => setTimeout(r, 2000))
  console.log(bad.join('\n') || 'no 4xx/5xx')
  await browser.close()
})()