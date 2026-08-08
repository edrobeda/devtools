const puppeteer = require('puppeteer')

const BASE = 'https://devtools.eventifylab.com'
const ROUTES = [
  '/',
  '/tools/crc-calculator',
]

async function run() {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] })
  let failures = 0
  for (const route of ROUTES) {
    const page = await browser.newPage()
    const errors = []
    const consoleErrors = []
    page.on('pageerror', (err) => errors.push(String(err)))
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text())
    })
    await page.goto(BASE + route, { waitUntil: 'networkidle2', timeout: 60000 })
    await new Promise((r) => setTimeout(r, 1500))
    const status = await page.evaluate(() => document.querySelector('h2, h1')?.textContent || '')
    const hasMenu = await page.evaluate(() => !!document.querySelector('.ant-menu'))
    const ok = errors.length === 0 && consoleErrors.length === 0
    if (!ok) failures++
    console.log(`[${ok ? 'OK' : 'FAIL'}] ${route} | title=${status.slice(0, 60)} | menu=${hasMenu}`)
    for (const e of errors) console.log('   pageerror:', e.slice(0, 300))
    for (const e of consoleErrors) console.log('   console.error:', e.slice(0, 300))
    await page.close()
  }
  await browser.close()
  process.exit(failures ? 1 : 0)
}

run().catch((err) => { console.error(err); process.exit(1) })