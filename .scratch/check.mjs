import puppeteer from 'puppeteer'

const urls = [
  'https://devtools.eventifylab.com/',
  'https://devtools.eventifylab.com/frontend/meta-tags-generator',
]

const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] })
let failed = false

for (const url of urls) {
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`))
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`console.error: ${msg.text()}`)
  })
  try {
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 })
    await new Promise((r) => setTimeout(r, 1500))
    const title = await page.title()
    console.log(`OK ${url} — title="${title}"`)
    if (errors.length) {
      failed = true
      console.log(`  ERRORS on ${url}:`)
      errors.forEach((e) => console.log('   ' + e))
    }
  } catch (e) {
    failed = true
    console.log(`FAIL ${url}: ${e.message}`)
  }
  await page.close()
}

await browser.close()
console.log(failed ? 'CHECK FAILED' : 'ALL PAGES CLEAN')
process.exit(failed ? 1 : 0)