const puppeteer = require('puppeteer')
const BASE = 'https://devtools.eventifylab.com'
;(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] })
  const page = await browser.newPage()
  const res404 = []
  page.on('response', (r) => { if (r.status() === 404) res404.push(r.url()) })
  const errors = []
  page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message))
  page.on('console', (m) => { if (m.type() === 'error' && !m.text().includes('404')) errors.push('CONSOLE: ' + m.text()) })
  await page.goto(BASE + '/devops/openssl-commands', { waitUntil: 'networkidle0', timeout: 30000 })
  await new Promise(r => setTimeout(r, 1500))
  const hasTitle = await page.evaluate(() => !!document.querySelector('h2'))
  const h2 = await page.evaluate(() => document.querySelector('h2')?.innerText || '')
  console.log('h2:', h2, '| 404s:', JSON.stringify(res404), '| jsErrors:', errors.length)
  errors.forEach((e) => console.log('  ' + e))
  await browser.close()
})()
