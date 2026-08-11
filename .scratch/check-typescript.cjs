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

  for (const path of ['/', '/references/typescript-cheatsheet', '/references/javascript-cheatsheet']) {
    errors.length = 0
    await page.goto(BASE + path, { waitUntil: 'networkidle0', timeout: 60000 })
    await new Promise((r) => setTimeout(r, 1500))
    const text = await page.evaluate(() => document.body.innerText)
    const count = await page.evaluate(() => {
      const el = document.querySelector('.ant-list')
      return el ? el.querySelectorAll('.ant-list-item').length : 0
    })
    console.log(`\n== ${path} ==`)
    console.log('items rendered:', count)
    console.log('has title:', /TypeScript|DevTools/i.test(text.slice(0, 200)))
    if (errors.length) {
      console.log('ERRORS:')
      errors.forEach((e) => console.log('  ', e))
    } else {
      console.log('no pageerror / console errors')
    }
  }

  // interação: busca filtra e categoria filtra
  const page2 = await browser.newPage()
  const errs = []
  page2.on('pageerror', (e) => errs.push('PAGEERROR: ' + e.message))
  page2.on('console', (m) => { if (m.type() === 'error') errs.push('CONSOLE: ' + m.text()) })
  await page2.goto(BASE + '/references/typescript-cheatsheet', { waitUntil: 'networkidle0', timeout: 60000 })
  await page2.type('.ant-input', 'keyof')
  await new Promise((r) => setTimeout(r, 800))
  let count = await page2.evaluate(() => document.querySelectorAll('.ant-list-item').length)
  console.log('\nafter search "keyof": items =', count)
  await page2.click('.ant-input-clear-icon')
  await new Promise((r) => setTimeout(r, 500))
  const radioButtons = await page2.$$('.ant-radio-button-wrapper')
  console.log('radio buttons:', radioButtons.length)
  await radioButtons[radioButtons.length - 1].click() // gotchas (last)
  await new Promise((r) => setTimeout(r, 800))
  count = await page2.evaluate(() => document.querySelectorAll('.ant-list-item').length)
  console.log('after gotchas filter: items =', count)
  console.log('interaction errors:', errs.length ? errs : 'none')

  await browser.close()
}

main().catch((e) => { console.error('FATAL', e); process.exit(1) })
