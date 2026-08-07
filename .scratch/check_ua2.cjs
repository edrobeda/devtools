const puppeteer = require('puppeteer')

const BASE = 'https://devtools.eventifylab.com'

async function check(url, selector, text) {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] })
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push('console: ' + m.text())
  })
  page.on('response', (res) => {
    if (res.status() >= 400) errors.push('HTTP ' + res.status() + ' ' + res.url())
  })
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 })
  await new Promise((r) => setTimeout(r, 1200))
  const found = await page.evaluate((sel) => {
    const el = document.querySelector(sel)
    return el ? el.textContent.slice(0, 120) : null
  }, selector)
  console.log('URL:', url)
  console.log('  content[' + selector + ']:', found)
  console.log('  pageErrors:', JSON.stringify(errors.filter((e) => e.startsWith('pageerror')), null, 2))
  console.log('  httpErrs:', JSON.stringify(errors.filter((e) => e.startsWith('HTTP')), null, 2))
  await browser.close()
  return errors.filter((e) => e.startsWith('pageerror'))
}

;(async () => {
  let failed = false
  const home = await check(BASE + '/', 'h1, h2', null)
  const ua = await check(BASE + '/network/user-agent-parser', 'h2', null)
  failed = home.length || ua.length
  console.log(failed ? 'FAILED' : 'OK')
  process.exit(failed ? 1 : 0)
})()
