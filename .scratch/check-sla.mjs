import puppeteer from 'puppeteer'

const BASE = 'https://devtools.eventifylab.com'

async function check(path, label) {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  })
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`))
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`console.error: ${msg.text()}`)
  })
  try {
    await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle0', timeout: 60000 })
    await new Promise((r) => setTimeout(r, 1500))
    const h1 = await page.evaluate(() => document.querySelector('h2')?.textContent || document.title)
    console.log(`--- ${label} (${path}) ---`)
    console.log('H2/title:', h1.trim().slice(0, 80))
    if (errors.length) {
      console.log('ERRORS:')
      errors.forEach((e) => console.log('  ' + e))
      return { label, path, ok: false, errors }
    }
    console.log('OK: no pageerror / console error')
    return { label, path, ok: true, errors }
  } catch (err) {
    console.log('NAV FAIL:', err.message)
    return { label, path, ok: false, errors: [err.message] }
  } finally {
    await browser.close()
  }
}

const results = []
results.push(await check('/', 'home'))
results.push(await check('/devops/sla-calculator', 'sla-calculator'))

const allOk = results.every((r) => r.ok)
console.log('\n=== SUMMARY ===')
results.forEach((r) => console.log(`${r.ok ? 'PASS' : 'FAIL'} ${r.label} ${r.path}`))
process.exit(allOk ? 0 : 1)