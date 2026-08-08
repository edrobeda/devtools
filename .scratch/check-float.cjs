const puppeteer = require('puppeteer')

const ROUTES = ['/', '/tools/float-explorer']

async function main() {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] })
  let failed = 0
  for (const route of ROUTES) {
    const page = await browser.newPage()
    const errs = []
    page.on('pageerror', (e) => errs.push('pageerror: ' + e.message))
    page.on('console', (m) => { if (m.type() === 'error' && !/404/.test(m.text())) errs.push('console: ' + m.text()) })
    await page.goto('https://devtools.eventifylab.com' + route, { waitUntil: 'networkidle0' })
    await new Promise((r) => setTimeout(r, 1200))
    const title = await page.evaluate(() => document.title)
    const bodyText = await page.evaluate(() => document.body.innerText)
    const hasFloat = /IEEE-754|0\.1000000000000000055511/.test(bodyText)
    console.log(`${route} -> title=${JSON.stringify(title)} hasFloat=${hasFloat} errors=${JSON.stringify(errs)}`)
    if (errs.length || !hasFloat) failed++
    await page.close()
  }
  await browser.close()
  process.exit(failed ? 1 : 0)
}
main()