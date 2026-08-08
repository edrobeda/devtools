const puppeteer = require('puppeteer')
function clickByText(selector, txt) {
  return this.evaluateHandle((sel, txt) => {
    const els = [...document.querySelectorAll(sel)]
    return els.find((e) => e.textContent.trim() === txt) || els.find((e) => e.textContent.includes(txt))
  }, selector, txt).then((h) => {
    const el = h.asElement()
    if (!el) return false
    return el.click().then(() => true)
  })
}
;(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] })
  const page = await browser.newPage()
  page.clickByText = clickByText
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto('https://devtools.eventifylab.com/references/ascii-table', { waitUntil: 'networkidle2', timeout: 60000 })
  await new Promise((r) => setTimeout(r, 800))
  const rows = () => page.evaluate(() => document.querySelectorAll('.ant-table-tbody .ant-table-row').length)
  const text = () => page.evaluate(() => document.body.innerText)

  // Controls category
  await page.clickByText('.ant-radio-button-wrapper', 'Controles')
  await new Promise((r) => setTimeout(r, 400))
  console.log('Controles rows:', await rows(), '(expect 33)')

  // Digits
  await page.clickByText('.ant-radio-button-wrapper', 'Dígitos')
  await new Promise((r) => setTimeout(r, 300))
  console.log('Dígitos rows:', await rows(), '(expect 10)')

  // Letters
  await page.clickByText('.ant-radio-button-wrapper', 'Letras')
  await new Promise((r) => setTimeout(r, 300))
  console.log('Letras rows:', await rows(), '(expect 52)')

  // Symbols
  await page.clickByText('.ant-radio-button-wrapper', 'Símbolos')
  await new Promise((r) => setTimeout(r, 300))
  console.log('Símbolos rows:', await rows(), '(expect 32)')

  // Latin-1 toggle + category
  await page.evaluate(() => {
    const sw = document.querySelector('.ant-switch'); sw.click()
  })
  await new Promise((r) => setTimeout(r, 400))
  const t = await text()
  console.log('Latin-1 radio visible after toggle:', t.includes('Latin-1'))
  await page.clickByText('.ant-radio-button-wrapper', 'Latin-1')
  await new Promise((r) => setTimeout(r, 300))
  console.log('Latin-1 rows:', await rows(), '(expect 0 since filter, check)' , 'or expect 96 if it works')
  // check specific: search 0xE9 -> é (233)
  const input = await page.$('.ant-input')
  await input.click()
  await page.keyboard.type('0xE9', { delay: 15 })
  await new Promise((r) => setTimeout(r, 400))
  const t2 = await text()
  console.log('search 0xE9 found é:', /233/.test(t2) && /é/.test(t2))
  console.log('rows after 0xE9 search:', await rows())
  console.log('PAGEERRORS:', errors.length ? errors : 'none')
  // check the é row content
  const t3 = await text()
  console.log('has é char:', t3.includes('é'))
  await browser.close()
})().catch((e) => { console.error('FATAL', e.message); process.exit(1) })
