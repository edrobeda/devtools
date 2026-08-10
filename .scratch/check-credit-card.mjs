import puppeteer from 'puppeteer'

const BASE = 'https://devtools.eventifylab.com'

;(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] })
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push('console.error: ' + msg.text())
  })

  // 1) New page
  await page.goto(BASE + '/tools/credit-card-tool', { waitUntil: 'networkidle0', timeout: 60000 })
  await new Promise((r) => setTimeout(r, 1200))

  const h2 = await page.evaluate(() => Array.from(document.querySelectorAll('h2')).map((e) => e.textContent.trim()))
  console.log('H2s:', JSON.stringify(h2))

  // default input is 4242424242424242 -> should show Válido/Valid green and Visa
  const tags = await page.evaluate(() => Array.from(document.querySelectorAll('.ant-tag')).map((t) => t.textContent.trim()))
  console.log('Tags on load:', JSON.stringify(tags))
  const des = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('.ant-descriptions-item'))
    return rows.map((r) => r.textContent.trim()).filter(Boolean)
  })
  console.log('Descriptions:', JSON.stringify(des))

  // trace boxes count should equal 16
  const traceCount = await page.evaluate(() => document.querySelectorAll('[style*="padding"] .ant-space').length)
  const traceDot = await page.evaluate(() => {
    const txt = document.body.innerText
    const m = txt.match(/Soma|Sum[:\s]*(\d+)/)
    return m ? m[1] : 'NA'
  })
  console.log('traceDot:', traceDot)

  // 2) generate mode
  const segItems = await page.evaluate(() => Array.from(document.querySelectorAll('.ant-segmented-item')).map((s) => s.textContent.trim()))
  console.log('Segmented:', JSON.stringify(segItems))
  await page.evaluate(() => {
    const seg = Array.from(document.querySelectorAll('.ant-segmented-item'))
    const target = seg.find((s) => /Gerar|Generate/.test(s.textContent))
    if (target) target.click()
  })
  await new Promise((r) => setTimeout(r, 500))
  const pageText = await page.evaluate(() => document.querySelector('.ant-card-body')?.innerText.slice(0, 120))
  await page.evaluate(() => {
    const b = Array.from(document.querySelectorAll('button')).find((x) => /Gerar|Generate/.test(x.textContent))
    if (b) b.click()
  })
  await new Promise((r) => setTimeout(r, 600))
  const results = await page.evaluate(() => {
    const codes = Array.from(document.querySelectorAll('code')).map((c) => c.textContent.trim())
    return codes.filter((s) => /^[\d ]+$/.test(s))
  })
  console.log('Generated lint item count:', results.length, 'first:', results[0])

  // 3) source Collapse present and expands
  await page.evaluate(() => {
    const c = document.querySelector('.ant-collapse-header')
    if (c) c.click()
  })
  await new Promise((r) => setTimeout(r, 400))
  const hasLuhn = await page.evaluate(() => (document.body.innerText.includes('function luhnCheck') && document.body.innerText.includes('detectBrand')) || 'no')
  console.log('source has functions:', hasLuhn)

  // 4) Home page
  await page.goto(BASE + '/', { waitUntil: 'networkidle0', timeout: 60000 })
  await new Promise((r) => setTimeout(r, 1200))
  const homeHas = await page.evaluate(() => document.body.innerText.includes('Credit Card') || document.body.innerText.includes('Cartão'))
  console.log('Home shows the new item:', homeHas)

  // 5) another shared-bundle page for sanity
  await page.goto(BASE + '/devops/sla-calculator', { waitUntil: 'networkidle0', timeout: 60000 })
  await new Promise((r) => setTimeout(r, 900))
  const slaOk = await page.evaluate(() => document.querySelectorAll('h2').length > 0)
  console.log('SLA page rendered:', slaOk)

  await browser.close()
  console.log('ERRORS:', errors.length ? JSON.stringify(errors, null, 2) : 'none')
})().catch((e) => { console.error('FATAL', e); process.exit(1) })