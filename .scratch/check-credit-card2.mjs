import puppeteer from 'puppeteer'

const BASE = 'https://devtools.eventifylab.com'

;(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] })
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push('console.error: ' + msg.text()) })
  page.on('response', (res) => {
    if (res.status() === 404) errors.push('HTTP404: ' + res.url())
  })

  await page.goto(BASE + '/tools/credit-card-tool', { waitUntil: 'networkidle0', timeout: 60000 })
  await new Promise((r) => setTimeout(r, 1200))

  const trace = await page.evaluate(() => {
    const boxes = Array.from(document.querySelectorAll('div[style*="border-radius: 6px"]'))
    const digits = boxes.map((b) => b.textContent.trim()).filter(Boolean).slice(0, 8)
    return digits
  })
  console.log('trace boxes sample:', JSON.stringify(trace))

  const sumLine = await page.evaluate(() => {
    const el = Array.from(document.querySelectorAll('.ant-space-item')).map((s) => s.textContent.trim()).filter((x) => x.includes('80') || x.includes('Soma') || x.includes('Sum'))
    return el[0] || 'NA'
  })
  console.log('sum/check line:', sumLine)

  const collapse = await page.evaluate(() => {
    const heads = Array.from(document.querySelectorAll('.ant-collapse-header'))
    return heads.map((h) => h.textContent.trim())
  })
  console.log('collapse headers:', JSON.stringify(collapse))

  await page.evaluate(() => {
    const h = document.querySelector('.ant-collapse-header')
    if (h) h.click()
  })
  await new Promise((r) => setTimeout(r, 700))
  const preText = await page.evaluate(() => {
    const pres = Array.from(document.querySelectorAll('.ant-collapse pre'))
    return pres.map((p) => p.innerText.slice(0, 60))
  })
  console.log('collapse pre prefix:', JSON.stringify(preText))

  await browser.close()
  console.log('ERRORS:', errors.length ? JSON.stringify(errors, null, 2) : 'none')
})().catch((e) => { console.error('FATAL', e); process.exit(1) })