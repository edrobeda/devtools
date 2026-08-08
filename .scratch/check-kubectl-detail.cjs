const puppeteer = require('puppeteer')

const URL = 'https://devtools.eventifylab.com'

async function check(path) {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] })
  try {
    const page = await browser.newPage()
    const errors = []
    const notFound = []
    page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(`console.error: ${m.text()}`)
    })
    page.on('response', (res) => {
      if (res.status() === 404) notFound.push(`${res.status()} ${res.url()}`)
    })
    await page.goto(URL + path, { waitUntil: 'networkidle0', timeout: 60000 })
    await new Promise((r) => setTimeout(r, 1500))
    console.log(`--- ${path} ---`)
    console.log('pageerrors:', errors.length ? errors.join('\n') : 'NONE')
    console.log('404 responses:')
    console.log(notFound.length ? notFound.join('\n') : 'NONE')
    const hasTitle = await page.evaluate(() => document.querySelector('.ant-layout-content') ? true : false)
    const h2 = await page.evaluate(() => {
      const els = document.querySelectorAll('h2')
      return [...els].map((e) => e.textContent)
    })
    console.log('h2 found:', JSON.stringify(h2))
    const searchInput = await page.evaluate(() => {
      const input = document.querySelector('input')
      return input && input.placeholder
    })
    console.log('search input placeholder:', searchInput)
    console.log('content rendered:', hasTitle)
    return errors
  } finally {
    await browser.close()
  }
}

async function main() {
  await check('/devops/kubectl-commands')
}
main().catch((e) => { console.error('runner error', e); process.exit(1) })