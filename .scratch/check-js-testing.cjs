const puppeteer = require('puppeteer')

const BASE = 'https://devtools.eventifylab.com'

async function main() {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] })
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message))
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push('CONSOLE: ' + msg.text())
  })

  for (const path of ['/', '/references/js-testing-cheatsheet', '/references/typescript-cheatsheet']) {
    errors.length = 0
    await page.goto(BASE + path, { waitUntil: 'networkidle0', timeout: 60000 })
    await new Promise((r) => setTimeout(r, 1500))
    const text = await page.evaluate(() => document.body.innerText)
    const count = await page.evaluate(() => {
      const el = document.querySelector('.ant-list')
      return el ? el.querySelectorAll('.ant-list-item').length : 0
    })
    console.log(`\n== ${path} ==`)
    console.log('list items rendered:', count)
    console.log('has title:', /Testing|Testes|DevTools/i.test(text.slice(0, 300)))
    if (errors.length) {
      console.log('ERRORS:')
      errors.forEach((e) => console.log('  ', e))
    } else {
      console.log('no pageerror / console errors')
    }
  }

  await browser.close()
}

main().catch((e) => { console.error(e); process.exit(1) })