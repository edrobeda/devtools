const puppeteer = require('/home/devtools-bot/devtools/node_modules/puppeteer')

const ROUTES = [
  '/',
  '/data/json-schema-validator',
  '/data/json-schema-generator',
  '/tools/json-formatter',
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
    let bodyLen = 0
    try { bodyLen = await page.evaluate(() => document.body.innerText.length) } catch {}
    console.log(`${route} bodyChars=${bodyLen} errors=${JSON.stringify(errs)}`)
    if (errs.length || bodyLen < 50) failed++
    await page.close()
  }

  // exercise the validator: click Validate on the pre-filled invalid sample
  const page = await browser.newPage()
  const pgErrs = []
  page.on('pageerror', (e) => pgErrs.push(e.message))
  await page.goto('https://devtools.eventifylab.com/data/json-schema-validator', { waitUntil: 'networkidle0' })
  await new Promise((r) => setTimeout(r, 600))
  const btns = await page.evaluate(() => Array.from(document.querySelectorAll('button')).map((b) => b.innerText.trim().slice(0, 24)))
  console.log('buttons:', JSON.stringify(btns))
  function clickByText(txt) {
    return page.evaluate((txt) => {
      const el = Array.from(document.querySelectorAll('button')).find((b) => b.innerText.trim().startsWith(txt))
      if (el) { el.click(); return true }
      return false
    }, txt)
  }
  const clicked = await clickByText('Validar')
  await new Promise((r) => setTimeout(r, 400))
  const viol = await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll('.ant-alert, .ant-tag'))
    return els.map((e) => e.innerText.trim().slice(0, 60)).slice(0, 10)
  })
  console.log('validate clicked=' + clicked + ' alerts/tags:', JSON.stringify(viol))
  const tableRows = await page.evaluate(() => document.querySelectorAll('.ant-table-tbody tr').length)
  console.log('tableRows=' + tableRows)
  if (pgErrs.length || tableRows < 3) failed++
  await page.close()

  // switch to EN and re-run validate
  const page2 = await browser.newPage()
  const pgErrs2 = []
  page2.on('pageerror', (e) => pgErrs2.push(e.message))
  await page2.goto('https://devtools.eventifylab.com/data/json-schema-validator', { waitUntil: 'networkidle0' })
  await new Promise((r) => setTimeout(r, 500))
  await page2.evaluate(() => {
    const seg = Array.from(document.querySelectorAll('.ant-segmented-item')).find((el) => el.innerText.trim() === 'EN')
    if (seg) seg.click()
  })
  await new Promise((r) => setTimeout(r, 300))
  await page2.evaluate(() => {
    const el = Array.from(document.querySelectorAll('button')).find((b) => b.innerText.trim().startsWith('Validate'))
    if (el) el.click()
  })
  await new Promise((r) => setTimeout(r, 400))
  const enText = await page2.evaluate(() => document.body.innerText.slice(0, 300))
  console.log('EN page head:', JSON.stringify(enText.slice(0, 150)))
  if (pgErrs2.length) failed++
  await page2.close()

  await browser.close()
  console.log(failed ? 'FAILED=' + failed : 'ALL OK')
  process.exit(failed ? 1 : 0)
}

main()
