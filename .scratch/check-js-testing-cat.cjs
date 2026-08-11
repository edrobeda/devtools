const puppeteer = require('puppeteer')
const BASE = 'https://devtools.eventifylab.com'

async function main() {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] })
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message))
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push('CONSOLE: ' + msg.text()) })

  await page.goto(BASE + '/references/js-testing-cheatsheet', { waitUntil: 'networkidle0', timeout: 60000 })
  await new Promise((r) => setTimeout(r, 1200))
  const listCount = () => page.evaluate(() => document.querySelectorAll('.ant-list-item').length)
  console.log('initial:', await listCount())

  // native click on the "React & Testing Library" radio via puppeteer click
  const clicked = await page.evaluate(() => {
    const radios = Array.from(document.querySelectorAll('.ant-radio-button-wrapper'))
    const target = radios.find((r) => r.textContent.includes('Testing Library'))
    if (!target) return 'NOT FOUND'
    target.querySelector('input') && target.querySelector('input').click()
    return target.textContent.trim()
  })
  console.log('clicked:', clicked)
  await new Promise((r) => setTimeout(r, 600))
  console.log('after React filter:', await listCount())
  const sample = await page.evaluate(() => document.body.innerText.slice(0, 800))
  console.log('--- text sample ---')
  console.log(sample)

  if (errors.length) { console.log('ERRORS:'); errors.forEach((e) => console.log('  ', e)) }
  else console.log('no pageerror / console errors')

  await browser.close()
}
main().catch((e) => { console.error(e); process.exit(1) })