const puppeteer = require('puppeteer')

;(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] })
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`))

  await page.goto('https://devtools.eventifylab.com/', { waitUntil: 'networkidle2', timeout: 60000 })
  await new Promise((r) => setTimeout(r, 2500))

  const badge = await page.evaluate(() => {
    const text = document.body.innerText
    return { hasNovo: text.includes('Novo'), hasHtmlCheatsheet: text.includes('Cheat Sheet de HTML') }
  })
  console.log(JSON.stringify(badge))
  console.log('ERRORS:', errors.length ? errors : 'none')
  await browser.close()
  process.exit(errors.length ? 1 : 0)
})()
