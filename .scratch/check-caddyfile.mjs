import puppeteer from 'puppeteer'

const BASE = 'https://devtools.eventifylab.com'

function check(url, label) {
  return new Promise(async (resolve) => {
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })
    const page = await browser.newPage()
    const errors = []
    page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push('console.error: ' + msg.text())
    })
    try {
      await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 })
      await new Promise((r) => setTimeout(r, 1500))
      const content = await page.evaluate(() => document.body ? document.body.innerText.slice(0, 300) : 'NO BODY')
      console.log(`[${label}] errors=${errors.length ? JSON.stringify(errors) : 'NONE'} :: ${content.replace(/\n+/g, ' | ')}`)
    } catch (e) {
      console.log(`[${label}] NAV ERR: ${e.message}; errors=${JSON.stringify(errors)}`)
    }
    await browser.close()
    resolve()
  })
}

check('https://devtools.eventifylab.com/', 'HOME').then(() =>
  check('https://devtools.eventifylab.com/devops/caddyfile-generator', 'CADDYFILE')
)