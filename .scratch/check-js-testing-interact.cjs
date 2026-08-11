const puppeteer = require('puppeteer')

const BASE = 'https://devtools.eventifylab.com'

async function main() {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] })
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message))
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push('CONSOLE: ' + msg.text())
  })

  await page.goto(BASE + '/references/js-testing-cheatsheet', { waitUntil: 'networkidle0', timeout: 60000 })
  await new Promise((r) => setTimeout(r, 1200))

  const listCount = () => page.evaluate(() => document.querySelectorAll('.ant-list-item').length)

  const initial = await listCount()
  console.log('initial:', initial)

  await page.type('.ant-input', 'vi.fn')
  await new Promise((r) => setTimeout(r, 500))
  console.log('after search "vi.fn":', await listCount())

  const errs = await page.evaluate(() => {
    const el = document.querySelector('.ant-list')
    return el.textContent.includes('vi.fn') ? 'contains vi.fn' : 'MISSING vi.fn text'
  })
  console.log('check:', errs)

  await page.evaluate(() => { const b = document.querySelector('.ant-input'); b.value = ''; b.dispatchEvent(new Event('input', { bubbles: true })) })
  await new Promise((r) => setTimeout(r, 400))

  const buttons = await page.evaluate(() => {
    const radios = Array.from(document.querySelectorAll('.ant-radio-button-wrapper'))
    return radios.map((r) => r.textContent.trim())
  })
  console.log('category buttons:', buttons)

  await page.evaluate(() => {
    const radios = Array.from(document.querySelectorAll('.ant-radio-button-wrapper'))
    const target = radios.find((r) => r.textContent.includes('React') || r.textContent.includes('Testing Library'))
    target.click()
  })
  await new Promise((r) => setTimeout(r, 500))
  console.log('after React filter:', await listCount())

  if (errors.length) {
    console.log('ERRORS:')
    errors.forEach((e) => console.log('  ', e))
  } else {
    console.log('no pageerror / console errors')
  }

  await browser.close()
}

main().catch((e) => { console.error(e); process.exit(1) })