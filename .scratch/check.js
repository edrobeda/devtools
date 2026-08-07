import puppeteer from 'puppeteer'

const urls = [
  'https://devtools.eventifylab.com/',
  'https://devtools.eventifylab.com/references/http-methods',
]

const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] })
let failed = false
for (const url of urls) {
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push('console.error: ' + m.text())
  })
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 })
  await new Promise((r) => setTimeout(r, 800))
  const title = await page.title().catch(() => '')
  const bodyLen = await page.evaluate(() => document.body.innerText.length).catch(() => 0)
  console.log(`${url} | title=${JSON.stringify(title)} | bodyText=${bodyLen}px | errors=${errors.length}`)
  errors.forEach((e) => { console.log('  ' + e); failed = true })
  await page.close()
}
await browser.close()
process.exit(failed ? 1 : 0)
