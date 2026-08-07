const puppeteer = require('puppeteer')

const BASE = 'https://devtools.eventifylab.com'

async function check(url) {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] })
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push('console: ' + m.text())
  })
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 })
  await new Promise((r) => setTimeout(r, 1500))
  const title = await page.title()
  console.log('URL:', url, '| title:', title, '| errors:', errors.length ? JSON.stringify(errors, null, 2) : 'none')
  await browser.close()
  return errors
}

;(async () => {
  let failed = false
  const home = await check(BASE + '/')
  if (home.length) failed = true
  const ua = await check(BASE + '/network/user-agent-parser')
  if (ua.length) failed = true
  process.exit(failed ? 1 : 0)
})()
