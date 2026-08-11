const puppeteer = require('puppeteer')

;(async () => {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1280, height: 900 },
  })
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`))
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(`console.error: ${msg.text()}`) })

  await page.goto('https://devtools.eventifylab.com/references/html-cheatsheet', { waitUntil: 'networkidle2', timeout: 60000 })
  await new Promise((r) => setTimeout(r, 2000))

  // count all visible list items
  const countAll = await page.evaluate(() => document.querySelectorAll('.ant-list-item').length)
  console.log('List items on "all":', countAll)

  // Search for a tag that only exists in one category
  await page.type('input[placeholder*="Buscar"], input[placeholder*="Search"]', 'details')
  await new Promise((r) => setTimeout(r, 800))
  const countDetails = await page.evaluate(() => document.querySelectorAll('.ant-list-item').length)
  const bodyAfter = await page.evaluate(() => document.body.innerText)
  console.log('After search "details" items:', countDetails, '| has <details>:', bodyAfter.includes('<details>'), '| has <div>:', bodyAfter.includes('<div>'))

  // clear via the input clear (select all + delete)
  await page.click('input[placeholder*="Buscar"], input[placeholder*="Search"]')
  await page.keyboard.down('Control'); await page.keyboard.press('KeyA'); await page.keyboard.up('Control')
  await page.keyboard.press('Backspace')
  await new Promise((r) => setTimeout(r, 500))
  const countCleared = await page.evaluate(() => document.querySelectorAll('.ant-list-item').length)
  console.log('After clearing search items:', countCleared)

  console.log('\nERRORS:', errors.length ? errors : 'none')
  await browser.close()
  process.exit(errors.length ? 1 : 0)
})()
