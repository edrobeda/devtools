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

  await page.goto(BASE + '/references/regex-cheatsheet', { waitUntil: 'networkidle0', timeout: 60000 })
  await new Promise((r) => setTimeout(r, 1500))
  const title = await page.title()
  const h2 = await page.$eval('h2', (el) => el.textContent).catch(() => '')
  const radios = await page.$$eval('.ant-radio-button-wrapper', (els) => els.map((e) => e.textContent.trim()))
  const listItems = await page.$$eval('.ant-list-items li', (els) => els.length)
  const sample = await page.$eval('.ant-list-items li', (el) => el.textContent.replace(/\s+/g, ' ').slice(0, 160)).catch(() => '')
  const radBtns = await page.$$('.ant-radio-button-wrapper')
  for (const b of radBtns) {
    const txt = await b.evaluate((el) => el.textContent.trim())
    if (txt.includes('Receitas') || txt.includes('Ready-made')) { await b.click(); break }
  }
  await new Promise((r) => setTimeout(r, 600))
  const recipesCount = await page.$$eval('.ant-list-items li', (els) => els.length)

  const search = await page.$('.ant-input')
  if (search) {
    await search.type('lookahead')
    await new Promise((r) => setTimeout(r, 500))
  }
  const searched = await page.$$eval('.ant-list-items li', (els) => els.map((e) => e.textContent.replace(/\s+/g, ' ').trim().slice(0, 60)))
  await search.evaluate((el) => { el.value = '' })
  if (search) {
    await search.type('\\d+')
    await new Promise((r) => setTimeout(r, 400))
    const searched2 = await page.$$eval('.ant-list-items li', (els) => els.length)
    console.log('Search "\\\\d+" result count:', searched2)
  }

  console.log('TITLE:', title)
  console.log('H2:', h2)
  console.log('Radios:', radios.join(' | '))
  console.log('List items (all):', listItems)
  console.log('First item:', sample)
  console.log('Recipes count after filter:', recipesCount)
  console.log('Search "lookahead" results:', searched.slice(0, 6))
  console.log('Errors on new page:', errors.length ? errors : 'none')

  await browser.close()
  if (errors.length) process.exit(1)
}

main().catch((e) => { console.error(e); process.exit(1) })