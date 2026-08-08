const puppeteer = require('/home/devtools-bot/devtools/node_modules/puppeteer')

const ROUTES = [
  '/',
  '/network/common-ports',
  '/network/mime-lookup',
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

  // exercise the new page: search, category filter, copy markdown, EN switch
  const page = await browser.newPage()
  const pgErrs = []
  page.on('pageerror', (e) => pgErrs.push('pageerror: ' + e.message))
  page.on('console', (m) => { if (m.type() === 'error') pgErrs.push('console: ' + m.text()) })
  await page.goto('https://devtools.eventifylab.com/network/common-ports', { waitUntil: 'networkidle0' })
  await new Promise((r) => setTimeout(r, 700))

  const itemsBefore = await page.evaluate(() => document.querySelectorAll('.ant-list-item').length)
  console.log('listItemCount(before):', itemsBefore)

  // search for "postgres"
  await page.type('.ant-input-affix-wrapper input, input.ant-input', 'postgres', { delay: 10 })
  await new Promise((r) => setTimeout(r, 400))
  const itemsPost = await page.evaluate(() => document.querySelectorAll('.ant-list-item').length)
  console.log('postgres items:', itemsPost)

  // clear and switch category via radio buttons
  await page.evaluate(() => {
    const btn = document.querySelector('.ant-input-clear-icon')
    if (btn) btn.click()
  })
  await new Promise((r) => setTimeout(r, 200))
  await page.evaluate(() => {
    const labels = Array.from(document.querySelectorAll('.ant-radio-button-wrapper'))
    const db = labels.find((el) => el.innerText.trim().startsWith('Banco de Dados'))
    if (db) db.click()
  })
  await new Promise((r) => setTimeout(r, 400))
  const itemsDb = await page.evaluate(() => document.querySelectorAll('.ant-list-item').length)
  console.log('db category items:', itemsDb)

  // markdown copy
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find((b) => b.innerText.includes('Markdown'))
    if (btn) btn.click()
  })
  await new Promise((r) => setTimeout(r, 400))

  // switch EN
  await page.evaluate(() => {
    const seg = Array.from(document.querySelectorAll('.ant-segmented-item')).find((el) => el.innerText.trim() === 'EN')
    if (seg) seg.click()
  })
  await new Promise((r) => setTimeout(r, 300))
  const enText = await page.evaluate(() => document.body.innerText.slice(0, 200))
  console.log('EN head:', JSON.stringify(enText.slice(0, 120)))
  console.log('all pgErrs:', JSON.stringify(pgErrs))
  if (pgErrs.length || itemsDb === 0) failed++
  await page.close()

  await browser.close()
  console.log(failed ? 'FAILED=' + failed : 'ALL OK')
  process.exit(failed ? 1 : 0)
}

main()