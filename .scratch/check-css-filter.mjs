import puppeteer from 'puppeteer'

const base = 'https://devtools.eventifylab.com'
const pages = [base + '/', base + '/frontend/css-filter-generator']

const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] })

let failed = false
for (const url of pages) {
  console.log('--- checking', url)
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', (err) => errors.push('pageerror: ' + err.message))
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push('console.error: ' + msg.text())
  })
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 })
  await new Promise((r) => setTimeout(r, 1500))

  const title = await page.title().catch(() => '(no title)')
  const bodyText = await page.evaluate(() => (document.body ? document.body.innerText.slice(0, 300) : ''))
  console.log('title:', title)
  console.log('body (first 300):', bodyText.replace(/\n+/g, ' | ').slice(0, 300))

  if (errors.length) {
    failed = true
    console.log('ERRORS:')
    errors.forEach((e) => console.log('  ' + e))
  } else {
    console.log('no pageerror / console errors')
  }
  await page.close()
}

await browser.close()
if (failed) process.exit(1)
console.log('ALL OK')