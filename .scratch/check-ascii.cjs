const puppeteer = require('puppeteer')

const BASE = 'https://devtools.eventifylab.com'
const PAGES = [
  '/',
  '/references/ascii-table',
  '/references/ascii-table?lang=x',
]

async function check(page, url) {
  const errors = []
  const consoleErrs = []
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrs.push(m.text())
  })
  await page.goto(BASE + url, { waitUntil: 'networkidle2', timeout: 60000 })
  await new Promise((r) => setTimeout(r, 1200))
  console.log(`\n===== ${url} =====`)
  if (errors.length) console.log('PAGEERRORS:', errors)
  if (consoleErrs.length) console.log('CONSOLE ERRORS:', consoleErrs)

  if (url === '/references/ascii-table') {
    // basic verification of rendered content
    const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 400))
    console.log('BODY[0:400]:', JSON.stringify(bodyText.replace(/\s+/g, ' ')))
    const rowCount = await page.evaluate(() =>
      document.querySelectorAll('.ant-table-tbody .ant-table-row').length)
    console.log('TABLE ROWS on load:', rowCount)
    // search for 0x41 'A'
    await page.click('.ant-input')
    await page.keyboard.type('0x41')
    await new Promise((r) => setTimeout(r, 400))
    const searchRows = await page.evaluate(() =>
      document.querySelectorAll('.ant-table-tbody .ant-table-row').length)
    console.log('ROWS after searching 0x41:', searchRows)
    const searchText = await page.evaluate(() => document.body.innerText)
    console.log('Has A at 65:', searchText.includes('65') && searchText.includes('Letter A'))
  }
  return { errors, consoleErrs }
}

;(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })
  const page = await browser.newPage()
  let fail = 0
  for (const url of PAGES) {
    const r = await check(page, url)
    if (r.errors.length || r.consoleErrs.length) fail++
  }
  await browser.close()
  process.exit(fail ? 1 : 0)
})()