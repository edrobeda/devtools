const puppeteer = require('puppeteer')

;(async () => {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1280, height: 900 },
  })
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`))
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`console.error: ${msg.text()}`)
  })

  // Home
  await page.goto('https://devtools.eventifylab.com/', { waitUntil: 'networkidle2', timeout: 60000 })
  await new Promise((r) => setTimeout(r, 1500))
  const homeTitle = await page.title()
  const homeHasSearch = await page.evaluate(() => !!document.querySelector('input[placeholder*="Buscar"], input[placeholder*="Search"]'))
  console.log('HOME title:', homeTitle, '| search box:', homeHasSearch)

  // New page
  await page.goto('https://devtools.eventifylab.com/references/html-cheatsheet', { waitUntil: 'networkidle2', timeout: 60000 })
  await new Promise((r) => setTimeout(r, 2000))
  const h1 = await page.evaluate(() => document.querySelector('h1,h2')?.textContent)
  const bodyText = await page.evaluate(() => document.body.innerText)
  const checks = {
    h1: h1,
    hasTitle: bodyText.includes('Cheat Sheet de Elementos HTML'),
    hasSearch: await page.evaluate(() => !!document.querySelector('input[placeholder*="Buscar"], input[placeholder*="Search"]')),
    hasElement: bodyText.includes('<div>') || bodyText.includes('<img>'),
    hasVoidTag: bodyText.includes('void'),
    hasAlert: bodyText.includes('O essencial do HTML') || bodyText.includes('HTML essentials'),
    itemCount: (bodyText.match(/<[a-z]/gi) || []).length,
  }
  console.log('HTML CHEATSHEET page:', JSON.stringify(checks, null, 2))

  // Filter interaction: click "Tabelas" category radio
  const btns = await page.$$('label.ant-radio-button-wrapper')
  for (const b of btns) {
    const txt = await b.evaluate((el) => el.textContent.trim())
    if (txt.includes('Tabelas')) {
      await b.click()
      break
    }
  }
  await new Promise((r) => setTimeout(r, 800))
  const afterFilter = await page.evaluate(() => document.body.innerText)
  console.log('After "Tabelas" filter -> has <table>:', afterFilter.includes('<table>'), '| has <div>:', afterFilter.includes('<div>'))

  // Search interaction
  await page.type('input[placeholder*="Buscar"], input[placeholder*="Search"]', 'link')
  await new Promise((r) => setTimeout(r, 800))
  const afterSearch = await page.evaluate(() => document.body.innerText)
  console.log('After search "link" -> has <link>:', afterSearch.includes('<link>'))

  // Language toggle EN
  const segs = await page.$$('.ant-segmented-item')
  for (const s of segs) {
    const txt = await s.evaluate((el) => el.textContent.trim())
    if (txt === 'EN') { await s.click(); break }
  }
  await new Promise((r) => setTimeout(r, 800))
  const enBody = await page.evaluate(() => document.body.innerText)
  console.log('EN toggle -> has "HTML Elements Cheat Sheet":', enBody.includes('HTML Elements Cheat Sheet'))

  console.log('\nERRORS:', errors.length ? errors : 'none')
  await browser.close()
  process.exit(errors.length ? 1 : 0)
})()
