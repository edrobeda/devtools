const puppeteer = require('puppeteer')

const HOME = 'https://devtools.eventifylab.com/'
const PAGE = 'https://devtools.eventifylab.com/tools/css-selector-tester'

;(async () => {
  const errors = []
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] })
  const page = await browser.newPage()

  page.on('pageerror', (err) => {
    errors.push({ type: 'pageerror', message: err.message })
  })

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push({ type: 'console.error', message: msg.text() })
    }
  })

  // 1. Home
  await page.goto(HOME, { waitUntil: 'networkidle2', timeout: 60000 })
  await page.waitForSelector('h2', { timeout: 10000 })

  // 2. Nova página
  await page.goto(PAGE, { waitUntil: 'networkidle2', timeout: 60000 })
  await page.waitForSelector('h2', { timeout: 10000 })

  const title = await page.$eval('h2', (el) => el.textContent.trim())
  if (!/selector|seletores/i.test(title)) {
    errors.push({ type: 'assert', message: `Unexpected title: ${title}` })
  }

  // Clica no primeiro exemplo ("Seletores comuns" / "Common selectors")
  const exampleBtn = await page.$('button span', (el) => el.textContent)
  const buttons = await page.$$('button')
  let clicked = false
  for (const btn of buttons) {
    const text = await btn.evaluate((el) => el.textContent.trim())
    if (/Seletores comuns|Common selectors/.test(text)) {
      await btn.click()
      clicked = true
      break
    }
  }

  if (!clicked) {
    errors.push({ type: 'assert', message: 'Example button not found' })
  } else {
    // Aguarda o iframe recarregar e a tabela preencher
    await new Promise((r) => setTimeout(r, 800))
    const rows = await page.$$('table tbody tr')
    if (rows.length === 0) {
      errors.push({ type: 'assert', message: 'No match rows rendered' })
    }
  }

  await browser.close()

  if (errors.length) {
    console.error('FAIL')
    for (const e of errors) console.error(e)
    process.exit(1)
  }

  console.log('OK — home and /tools/css-selector-tester loaded without JS errors')
})().catch((err) => {
  console.error('CRASH', err)
  process.exit(1)
})
