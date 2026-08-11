const puppeteer = require('puppeteer')

const BASE = 'https://devtools.eventifylab.com'
const PATHS = ['/', '/frontend/css-triangle-generator']

async function run() {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] })
  const page = await browser.newPage()
  const errors = []

  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`))
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(`console.error: ${msg.text()}`)
    }
  })

  for (const path of PATHS) {
    errors.length = 0
    const url = `${BASE}${path}`
    console.log(`Navigating to ${url}...`)
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 })
    await new Promise((r) => setTimeout(r, 1000))

    const title = await page.title()
    const h2 = await page.$eval('h2', (el) => el.innerText).catch(() => 'no h2')
    console.log(`  title: ${title}`)
    console.log(`  h2: ${h2}`)

    if (errors.length) {
      console.error(`  JS errors on ${path}:`)
      errors.forEach((e) => console.error('   ', e))
      process.exitCode = 1
    } else {
      console.log(`  No JS errors on ${path}`)
    }
  }

  await browser.close()
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
