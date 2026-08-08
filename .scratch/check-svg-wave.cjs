const puppeteer = require('puppeteer')

async function main() {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] })
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push('console.error: ' + msg.text())
  })

  const BASE = 'https://devtools.eventifylab.com'

  // Nova página
  await page.goto(BASE + '/frontend/svg-wave-generator', { waitUntil: 'networkidle0', timeout: 60000 })
  await new Promise((r) => setTimeout(r, 1500))
  const title = await page.title()
  const h2 = await page.$eval('h2', (el) => el.textContent).catch(() => '')
  const svgs = await page.$$eval('svg path', (els) => els.length)
  const layers = await page.$$eval('.ant-card .ant-card-head-title', (els) => els.map((e) => e.textContent).join('|'))
  const btn = await page.$$eval('button', (els) => els.map((e) => e.textContent).join('|'))
  console.log('TITLE:', title)
  console.log('H2:', h2)
  console.log('SVG paths rendered:', svgs)
  console.log('Cards:', layers)
  console.log('Buttons sample:', btn.slice(0, 200))
  console.log('Errors on new page:', errors.length ? errors : 'none')

  // interage: muda largura e clica em preset para exercitar estado
  await page.evaluate(() => {
    const inputs = document.querySelectorAll('.ant-input-number input')
    if (inputs[0]) inputs[0].focus()
  })
  const btns = await page.$$('button')
  for (const b of btns) {
    const txt = await b.evaluate((el) => el.textContent)
    if (txt.includes('Oceano') || txt.includes('Ocean')) { await b.click(); break }
  }
  await new Promise((r) => setTimeout(r, 600))
  const svgs2 = await page.$$eval('svg path', (els) => els.length)
  console.log('SVG paths after preset click:', svgs2)

  // Home
  await page.goto(BASE + '/', { waitUntil: 'networkidle0', timeout: 60000 })
  await new Promise((r) => setTimeout(r, 1500))
  const homeH2 = await page.$eval('h2', (el) => el.textContent).catch(() => '')
  console.log('Home H2:', homeH2)
  console.log('Errors on home:', errors.length ? errors : 'none')

  await browser.close()
  if (errors.length) process.exit(1)
}

main().catch((e) => { console.error(e); process.exit(1) })
