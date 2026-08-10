const puppeteer = require('puppeteer');

async function main() {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] })
  let failed = 0

  for (const route of ['/', '/frontend/scrollbar-generator']) {
    const page = await browser.newPage()
    await page.setViewport({ width: 1280, height: 900 })
    const errs = []
    page.on('pageerror', (e) => errs.push('pageerror: ' + e.message))
    page.on('console', (m) => { if (m.type() === 'error' && !m.text().includes('Failed to load resource')) errs.push('console: ' + m.text()) })
    await page.goto('https://devtools.eventifylab.com' + route, { waitUntil: 'networkidle0' })
    await new Promise((r) => setTimeout(r, 800))
    const info = await page.evaluate(() => {
      const styleText = Array.from(document.querySelectorAll('style')).map((s) => s.innerHTML).join('')
      return {
        bodyChars: document.body.innerText.length,
        inputs: document.querySelectorAll('.ant-slider').length,
        pre: document.querySelectorAll('pre').length,
        scrollbarRule: styleText.includes('::-webkit-scrollbar'),
      }
    })
    console.log(`${route} bodyChars=${info.bodyChars} sliders=${info.inputs} pre=${info.pre} webkitRule=${info.scrollbarRule} errors=${JSON.stringify(errs)}`)
    if (errs.length || info.bodyChars < 50) failed++
    if (route.includes('scrollbar-generator') && (info.sliders < 4 || !info.scrollbarRule)) failed++
    await page.close()
  }

  const page = await browser.newPage()
  await page.setViewport({ width: 1280, height: 900 })
  const pgErrs = []
  page.on('pageerror', (e) => pgErrs.push('pageerror: ' + e.message))
  page.on('console', (m) => { if (m.type() === 'error') pgErrs.push('console: ' + m.text()) })
  await page.goto('https://devtools.eventifylab.com/frontend/scrollbar-generator', { waitUntil: 'networkidle0' })
  await new Promise((r) => setTimeout(r, 700))

  const cssBefore = await page.evaluate(() => {
    const ps = Array.from(document.querySelectorAll('pre')).map((p) => p.innerText)
    return ps[0] || ''
  })
  console.log('cssBefore has scrollbar-width:', cssBefore.includes('scrollbar-width'))
  if (!cssBefore.includes('scrollbar-width') || !cssBefore.includes('::-webkit-scrollbar-thumb')) failed++

  // rola o primeiro slider pra visível e arrasta o handle pra direita
  const moved = await page.evaluate(() => {
    const el = document.querySelector('.ant-slider')
    if (!el) return false
    el.scrollIntoView({ block: 'center' })
    return true
  })
  await new Promise((r) => setTimeout(r, 300))
  const handle = await page.$('.ant-slider-handle')
  let dragWorked = false
  if (handle) {
    const box = await handle.boundingBox()
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.mouse.down()
    await page.mouse.move(box.x + box.width / 2 + 80, box.y + box.height / 2, { steps: 12 })
    await page.mouse.up()
    await new Promise((r) => setTimeout(r, 300))
    dragWorked = await page.evaluate(() => {
      const ps = Array.from(document.querySelectorAll('pre')).map((p) => p.innerText)
      const w = (ps[0] || '').match(/width: (\d+)px/)
      return w ? Number(w[1]) > 12 : false
    })
  }
  console.log(`slider scrollIntoView=${moved} drag updated output:`, dragWorked)
  if (!dragWorked) failed++

  await page.evaluate(() => {
    const seg = Array.from(document.querySelectorAll('.ant-segmented-item')).find((el) => el.innerText.trim() === 'EN')
    if (seg) seg.click()
  })
  await new Promise((r) => setTimeout(r, 300))
  const enText = await page.evaluate(() => document.body.innerText)
  console.log('EN contains "CSS Scrollbar Generator":', enText.includes('CSS Scrollbar Generator'))
  if (!enText.includes('CSS Scrollbar Generator')) failed++

  await page.evaluate(() => {
    const seg = Array.from(document.querySelectorAll('.ant-segmented-item')).find((el) => el.innerText.trim() === 'PT')
    if (seg) seg.click()
  })
  await new Promise((r) => setTimeout(r, 300))
  const ptText = await page.evaluate(() => document.querySelector('.ant-layout-sider')?.innerText)
  console.log('menu has scrollbar:', ptText && ptText.includes('Scrollbar'))
  if (!ptText || !ptText.includes('Scrollbar')) failed++

  console.log('all pgErrs:', JSON.stringify(pgErrs))
  if (pgErrs.length) failed++
  await page.close()

  await browser.close()
  console.log(failed ? 'FAILED=' + failed : 'ALL OK')
  process.exit(failed ? 1 : 0)
}

main()