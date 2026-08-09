const puppeteer = require('puppeteer')
const BASE = 'https://devtools.eventifylab.com'
;(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] })
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message))
  await page.goto(BASE + '/devops/openssl-commands', { waitUntil: 'networkidle0', timeout: 30000 })
  await new Promise(r => setTimeout(r, 1000))
  // switch to EN
  await page.evaluate(() => {
    const segs = [...document.querySelectorAll('.ant-segmented-item')]
    const en = segs.find(s => s.innerText.trim() === 'EN')
    en && en.click()
  })
  await new Promise(r => setTimeout(r, 800))
  const h2 = await page.evaluate(() => document.querySelector('h2')?.innerText || '')
  // search 'verify'
  await page.evaluate(() => {
    const input = document.querySelector('.ant-input')
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
    setter.call(input, 'verify')
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
  await new Promise(r => setTimeout(r, 800))
  const count = await page.evaluate(() => document.querySelectorAll('.ant-list-item').length)
  const searchPh = await page.evaluate(() => document.querySelector('input')?.placeholder || '')
  console.log('h2:', h2, '| searchResults:', count, '| placeholder:', searchPh)
  console.log(errors.length ? errors.join('\n') : 'no page errors')
  await browser.close()
})()
