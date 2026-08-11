const puppeteer = require('puppeteer')

const HOME = 'https://devtools.eventifylab.com/'
const PAGE = 'https://devtools.eventifylab.com/data/json-flatten'

async function check(url) {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] })
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`))
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`console.error: ${msg.text()}`)
  })
  await page.goto(url, { waitUntil: 'networkidle2' })
  const title = await page.title().catch(() => 'NO TITLE')
  await browser.close()
  return { title, errors }
}

;(async () => {
  const home = await check(HOME)
  const page = await check(PAGE)
  console.log('HOME:', home.title, 'errors:', home.errors.length)
  home.errors.forEach((e) => console.log('  ', e))
  console.log('PAGE:', page.title, 'errors:', page.errors.length)
  page.errors.forEach((e) => console.log('  ', e))
  if (home.errors.length || page.errors.length) {
    process.exit(1)
  }
})()
