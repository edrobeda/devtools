const puppeteer = require('puppeteer')
;(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] })
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto('https://devtools.eventifylab.com/references/ascii-table', { waitUntil: 'networkidle2', timeout: 60000 })
  await new Promise((r) => setTimeout(r, 800))
  const evalBtnRanges = async () => page.evaluate(() => {
    const btns = [...document.querySelectorAll('.ant-radio-button-wrapper')]
    return btns.map((b) => b.textContent.trim())
  })
  console.log('radio buttons:', await evalBtnRanges())
  const clickByText = async (txt) => {
    const h = await page.evaluateHandle((txt) => {
      const els = [...document.querySelectorAll('.ant-radio-button-wrapper')]
      return els.find((e) => e.textContent.trim() === txt) || null
    }, txt)
    const el = h.asElement()
    if (!el) return false
    await el.click()
    return true
  }
  await clickByText('Controles')
  await new Promise((r) => setTimeout(r, 400))
  const rc = await page.evaluate(() => document.querySelectorAll('.ant-table-tbody .ant-table-row').length)
  console.log('Controles rendered rows:', rc)
  // check first 3 rows dec values via first col
  const decs = await page.evaluate(() => {
    return [...document.querySelectorAll('.ant-table-tbody .ant-table-row')].slice(0,4).map((row) => row.querySelector('td').textContent.trim())
  })
  console.log('first decs:', decs)
  // pagination info
  const pageInfo = await page.evaluate(() => {
    const t = document.querySelector('.ant-pagination-total-text')
    return t ? t.textContent : 'no-total'
  })
  console.log('pageSize / total text:', pageInfo)
  console.log('PAGEERRORS:', errors)
  await browser.close()
})().catch((e) => { console.error('FATAL', e.message); process.exit(1) })
