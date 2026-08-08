const puppeteer = require('puppeteer')

const ROUTES = [
  '/',
  '/tools/css-formatter',
  '/tools/json-formatter',
  '/tools/number-to-words',
  '/data/json-schema-generator',
  '/styles/otp-input',
  '/extras/sorting-visualizer',
]

async function main() {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] })
  let failed = 0
  for (const route of ROUTES) {
    const page = await browser.newPage()
    const errs = []
    page.on('pageerror', (e) => errs.push('pageerror: ' + e.message))
    page.on('console', (m) => { if (m.type() === 'error' && !/404/.test(m.text())) errs.push('console: ' + m.text()) })
    await page.goto('https://devtools.eventifylab.com' + route, { waitUntil: 'networkidle0' })
    await new Promise((r) => setTimeout(r, 1000))
    const h = await page.evaluate(() => document.title)
    console.log(`${route} -> title=${JSON.stringify(h)} errors=${JSON.stringify(errs)}`)
    if (errs.length) failed++
    await page.close()
  }
  await browser.close()
  process.exit(failed ? 1 : 0)
}

main()