const puppeteer = require('puppeteer')

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function check(url) {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] })
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push('console.error: ' + m.text())
  })
  try {
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 })
    await sleep(2500)
  } catch (e) {
    errors.push('goto: ' + e.message)
  }
  await browser.close()
  return errors
}

;(async () => {
  const targets = [
    'https://devtools.eventifylab.com/',
    'https://devtools.eventifylab.com/tools/timezone-converter',
  ]
  let failed = false
  for (const url of targets) {
    const errors = await check(url)
    console.log(url, errors.length === 0 ? 'OK' : 'ERRORS: ' + JSON.stringify(errors))
    if (errors.length > 0) failed = true
  }
  process.exit(failed ? 1 : 0)
})()