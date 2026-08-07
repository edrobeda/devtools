const puppeteer = require('puppeteer')

async function check(url) {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] })
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()) })
  await page.goto(url, { waitUntil: 'networkidle0' })
  await new Promise(r => setTimeout(r, 1500))
  console.log(url, 'errors=', JSON.stringify(errors))
  await browser.close()
  return errors
}

;(async () => {
  let failed = false
  failed |= await check('https://devtools.eventifylab.com/')
  failed |= await check('https://devtools.eventifylab.com/tools/number-to-words')

  // functional check of the fix: BRL mode in English should say "reais", not "dollars"
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] })
  const page = await browser.newPage()
  await page.goto('https://devtools.eventifylab.com/tools/number-to-words', { waitUntil: 'networkidle0' })
  await new Promise(r => setTimeout(r, 1000))
  // switch to English
  const enBtn = await page.evaluate(async () => {
    const els = [...document.querySelectorAll('button')]
    const btn = els.find(b => b.textContent.trim() === 'English' || b.textContent.includes('English'))
    if (btn) btn.click()
    return !!btn
  })
  await new Promise(r => setTimeout(r, 800))
  // click BRL Real mode
  await page.evaluate(() => {
    const els = [...document.querySelectorAll('.ant-segmented-item, .ant-segmented-item-label')]
    const b = els.find(x => x.textContent.includes('Real'))
    if (b) b.click()
  })
  await new Promise(r => setTimeout(r, 500))
  await page.evaluate(() => {
    const inp = document.querySelector('input')
    if (inp) { inp.value = '5.50'; inp.dispatchEvent(new Event('input', { bubbles: true })) }
  })
  await new Promise(r => setTimeout(r, 800))
  const body = await page.evaluate(() => document.body.innerText)
  console.log('has dollars:', /dollars?/.test(body))
  console.log('has reais:', /reais/.test(body))
  console.log('BRL-excerpt:', body.split('\n').filter(l => /reais|dollars/i.test(l)).slice(0,3).join(' | '))
  await browser.close()
  if (failed.length) process.exit(1)
})()