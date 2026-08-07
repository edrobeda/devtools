const puppeteer = require('puppeteer')
const URL = 'https://devtools.eventifylab.com'
;(async () => {
  let browser
  try {
    browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] })
    const page = await browser.newPage()
    await page.goto(URL + '/network/mime-lookup', { waitUntil: 'networkidle0', timeout: 45000 })
    await new Promise((r) => setTimeout(r, 500))
    const body = await page.evaluate(() => document.body.innerText)
    console.log('has title:', body.includes('Lookup de MIME Types'))
    console.log('has application/json:', body.includes('application/json'))
    console.log('has image/jpeg:', body.includes('image/jpeg'))
    // type into search
    const input = await page.$('input[placeholder*="MIME"], input[placeholder*="mime"], input[placeholder*="tipo MIME"]')
    await input.focus()
    await input.type('png')
    await new Promise((r) => setTimeout(r, 400))
    const after = await page.evaluate(() => document.body.innerText)
    console.log('filtered to image/png:', after.includes('image/png'))
    console.log('filtered out application/json:', !after.includes('application/json'))
    // toggle EN
    const seg = await page.evaluate(() => {
      const btns = [...document.querySelectorAll('.ant-segmented-item')]
      const en = btns.find((b) => b.innerText.trim() === 'EN')
      if (en) { en.click(); return true }
      return false
    })
    await new Promise((r) => setTimeout(r, 400))
    const enBody = await page.evaluate(() => document.body.innerText)
    console.log('EN title:', enBody.includes('MIME Types Lookup'))
    await browser.close()
    process.exit(0)
  } catch (e) {
    console.error('FATAL', e)
    try { if (browser) await browser.close() } catch (_) {}
    process.exit(1)
  }
})()