const puppeteer = require('puppeteer')
;(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] })
  const page = await browser.newPage()
  const errors = []
  const consoleErrs = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => { if (m.type() === 'error' && !m.text().includes('favicon')) consoleErrs.push(m.text()) })
  await page.goto('https://devtools.eventifylab.com/references/ascii-table', { waitUntil: 'networkidle2', timeout: 60000 })
  await new Promise((r) => setTimeout(r, 800))

  // total all = 128
  const total = await page.evaluate(() => {
    const it = document.querySelector('.ant-pagination-total-text')
    return it ? it.textContent : 'none'
  })
  console.log('total text:', total)

  // switch to EN via header Segmented, check letter name translated
  const h = await page.evaluateHandle(() => {
    const segs = [...document.querySelectorAll('.ant-segmented-item')]
    return segs.find((s) => s.textContent.includes('EN'))
  })
  const enEl = h.asElement()
  await enEl.click()
  await new Promise((r) => setTimeout(r, 600))
  const t = await page.evaluate(() => document.body.innerText)
  console.log('EN header present:', t.includes('ASCII Table'), '| EN intro ok:', t.includes('byte values'))
  console.log('127 control tag:', t.includes('0x7F'))

  // go back to PT, search '0x41' and check esc col for 65 (shows A)
  const pt = await page.evaluateHandle(() => {
    const segs = [...document.querySelectorAll('.ant-segmented-item')]
    return segs.find((s) => s.textContent.includes('PT'))
  })
  await pt.asElement().click()
  await new Promise((r) => setTimeout(r, 500))
  const input = await page.$('.ant-input')
  await input.click()
  await page.keyboard.type('65 ', { delay: 10 })
  await new Promise((r) => setTimeout(r, 400))
  const row = await page.evaluate(() => {
    const rows = [...document.querySelectorAll('.ant-table-tbody .ant-table-row')]
    return rows.map((r) => [...r.querySelectorAll('td')].map((td) => td.textContent.trim()))
  })
  console.log('row for 65:', JSON.stringify(row))
  console.log('PAGEERRORS:', errors.length ? errors : 'none')
  console.log('CONSOLE:', consoleErrs.length ? consoleErrs : 'none')

  // copy TSV click
  const btn = await page.evaluateHandle(() => {
    const b = [...document.querySelectorAll('button')].find((x) => x.textContent.includes('TSV'))
    return b
  })
  if (btn.asElement()) {
    await btn.asElement().click()
    await new Promise((r) => setTimeout(r, 500))
    console.log('copied toast shown:', (await page.evaluate(() => document.body.innerText)).includes('Copiado'))
  }
  await browser.close()
})().catch((e) => { console.error('FATAL', e.message); process.exit(1) })
