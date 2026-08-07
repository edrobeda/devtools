const puppeteer = require('puppeteer')

;(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] })
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message))
  page.on('console', (m) => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()) })
  await page.goto('https://devtools.eventifylab.com/tools/cron-builder', { waitUntil: 'networkidle0', timeout: 60000 })
  await new Promise((r) => setTimeout(r, 1200))

  // Switch 'dow' field to 'Specific' and pick Monday, then check a run tag appears.
  const segs = await page.$$('.ant-segmented')
  const dowSeg = segs[segs.length - 1]
  await dowSeg.click()
  await new Promise((r) => setTimeout(r, 300))
  const segItems = await dowSeg.$$('.ant-segmented-item')
  await segItems[segItems.length - 1].click() // last = "Specific"
  await new Promise((r) => setTimeout(r, 300))

  const exp = await page.evaluate(() => document.body.innerText.includes('* * * * *'))
  const body = await page.evaluate(() => {
    const mon = [...document.querySelectorAll('.ant-tag-checkable')].find((el) => el.textContent.trim().startsWith('1'))
    if (mon) mon.click()
  })
  await new Promise((r) => setTimeout(r, 600))
  const runs = await page.$('.ant-list')
  const hasRuns = !!runs
  const text = await page.$eval('.ant-list', (el) => el.innerText).catch(() => '')
  console.log('has runs list:', hasRuns, text.slice(0, 80))

  if (errors.length) errors.forEach((e) => console.log('  ' + e))
  console.log(errors.length ? 'FAIL' : 'OK')
  await browser.close()
})()