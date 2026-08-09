import puppeteer from 'puppeteer'

const URL = 'https://devtools.eventifylab.com'

async function check(path) {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] })
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()) })
  await page.goto(URL + path, { waitUntil: 'networkidle2', timeout: 60000 })
  await new Promise(r => setTimeout(r, 800))
  const title = await page.title()
  const heading = await page.$eval('h2', el => el?.textContent?.trim() || '').catch(() => 'N/A')
  console.log(`\n== ${path} ==`)
  console.log('title:', title)
  console.log('h2:', heading)
  console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'NO JS ERRORS')
  await browser.close()
}

await check('/data/json-to-yaml')
await check('/')
