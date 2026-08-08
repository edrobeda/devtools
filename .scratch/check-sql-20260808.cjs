const puppeteer = require('puppeteer')

const ROUTES = [
  '/',
  '/database/sql-formatter',
  '/tools/css-formatter',
  '/tools/xml-formatter',
  '/database/json-to-sql',
  '/text/lines-tool',
]

async function main() {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] })
  let failed = 0
  for (const route of ROUTES) {
    const page = await browser.newPage()
    const errs = []
    page.on('pageerror', (e) => errs.push('pageerror: ' + e.message))
    page.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text()) })
    await page.goto('https://devtools.eventifylab.com' + route, { waitUntil: 'networkidle0' })
    await new Promise((r) => setTimeout(r, 800))
    const title = await page.evaluate(() => document.title)
    let bodyLen = 0
    try { bodyLen = await page.evaluate(() => document.body.innerText.length) } catch {}
    console.log(`${route} title=${JSON.stringify(title)} bodyChars=${bodyLen} errors=${JSON.stringify(errs)}`)
    if (errs.length) failed++
    await page.close()
  }

  // exercise the formatter itself: click format & minify, read output
  const page = await browser.newPage()
  const pgErrs = []
  page.on('pageerror', (e) => pgErrs.push(e.message))
  await page.goto('https://devtools.eventifylab.com/database/sql-formatter', { waitUntil: 'networkidle0' })
  await new Promise((r) => setTimeout(r, 600))
  const btns = await page.evaluate(() => Array.from(document.querySelectorAll('button')).map((b) => b.innerText.trim().slice(0, 20)))
  console.log('buttons:', JSON.stringify(btns))
  function clickByText(txt) {
    return page.evaluate((txt) => {
      const el = Array.from(document.querySelectorAll('button')).find((b) => b.innerText.trim() === txt)
      if (el) { el.click(); return true }
      return false
    }, txt)
  }
  const clicked = await clickByText('Minificar')
  await new Promise((r) => setTimeout(r, 300))
  const pre = await page.evaluate(() => document.querySelector('pre') ? document.querySelector('pre').innerText.slice(0, 200) : '(none)')
  console.log('after minify clicked=' + clicked + ' pre=', JSON.stringify(pre))
  const clicked2 = await clickByText('Formatar')
  await new Promise((r) => setTimeout(r, 300))
  const pre2 = await page.evaluate(() => document.querySelector('pre') ? document.querySelector('pre').innerText.slice(0, 300) : '(none)')
  console.log('after format clicked=' + clicked2 + ' pre=', JSON.stringify(pre2))
  console.log('formatter page errors:', JSON.stringify(pgErrs))
  if (pgErrs.length) failed++
  await page.close()

  await browser.close()
  process.exit(failed ? 1 : 0)
}

main()
