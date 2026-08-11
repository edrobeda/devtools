import puppeteer from 'puppeteer'

const BASE = 'https://devtools.eventifylab.com'
const targets = [
  BASE + '/',
  BASE + '/references/github-actions-cheatsheet',
  BASE + '/tools/credit-card-tool',
]

const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] })

let failed = false

for (const url of targets) {
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', (err) => errors.push('pageerror: ' + err.message))
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push('console.error: ' + msg.text())
  })
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 })
  await new Promise((r) => setTimeout(r, 1500))
  const info = await page.evaluate(() => {
    const items = document.querySelectorAll('.ant-list-item').length
    const title = document.querySelector('h2')
    return {
      items,
      heading: title ? title.textContent.trim() : null,
      radioButtons: document.querySelectorAll('.ant-radio-button-wrapper').length,
    }
  })
  if (errors.length || (!url.endsWith('github-actions-cheatsheet') && url !== BASE + '/')) {
    failed = failed || errors.length > 0
  }
  console.log(JSON.stringify({ url, ...info, errors }))
  await page.close()
}

await browser.close()
process.exit(failed ? 1 : 0)