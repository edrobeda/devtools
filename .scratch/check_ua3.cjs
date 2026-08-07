const puppeteer = require('puppeteer')
const BASE = 'https://devtools.eventifylab.com'
;(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] })
  const page = await browser.newPage()
  const errs = []
  page.on('pageerror', (e) => errs.push(e.message))
  await page.goto(BASE + '/network/user-agent-parser', { waitUntil: 'networkidle2', timeout: 60000 })
  // click "Use my browser" button (PT)
  const btns = await page.$$('button')
  for (const b of btns) {
    const txt = await b.evaluate((el) => el.textContent)
    if (txt && txt.includes('meu navegador')) { await b.click(); break }
  }
  await new Promise((r) => setTimeout(r, 800))
  const body = await page.evaluate(() => document.body.innerText)
  console.log('has ChromeTag?', /Chrome|Firefox|Safari|Edge|Desconhecido/.test(body))
  console.log('pageErrors:', JSON.stringify(errs))
  await browser.close()
  process.exit(errs.length ? 1 : 0)
})()