import puppeteer from 'puppeteer'

const url = process.env.BASE_URL || 'https://devtools.eventifylab.com'
const results = []

async function run(route, label, must) {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] })
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()) })
  try {
    await page.goto(url + route, { waitUntil: 'networkidle2', timeout: 30000 })
    await new Promise((r) => setTimeout(r, 400))
    let found = true
    if (must) {
      found = await page.evaluate(() => {
        const els = [...document.querySelectorAll('h2, h1, h3, textarea, pre')]
        return els.some((e) => { const tx = (e.textContent || '').toLowerCase(); return tx.includes('changelog') })
      })
    }
    results.push({ route, found, errors })
  } catch (e) {
    results.push({ route, found: false, errors: [e.message] })
  }
  await browser.close()
}

await run('/devops/changelog-generator', 'new page', true)
await run('/', 'home', true)

for (const r of results) {
  console.log(`\n=== ${r.route} ===`)
  console.log('found-content:', r.found)
  console.log('errors:', r.errors.length ? r.errors : 'none')
}
process.exit(0)