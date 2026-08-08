const puppeteer = require('puppeteer')

;(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] })
  const page = await browser.newPage()
  const errs = []
  page.on('pageerror', (e) => errs.push(`PAGEERROR: ${e.message}`))
  page.on('console', (m) => { if (m.type() === 'error' && !m.text().includes('favicon')) errs.push(`CONSOLE.ERROR: ${m.text()}`) })

  // ── home ──
  await page.goto('https://devtools.eventifylab.com/', { waitUntil: 'networkidle0', timeout: 45000 })
  await new Promise((r) => setTimeout(r, 800))
  console.log('home errors:', errs.length ? JSON.stringify(errs) : 'none')

  // ── nova página ──
  await page.goto('https://devtools.eventifylab.com/frontend/cubic-bezier-editor', { waitUntil: 'networkidle0', timeout: 45000 })
  await new Promise((r) => setTimeout(r, 900))

  const h2 = await page.$eval('h2', (el) => el.textContent)
  console.log('title:', h2.includes('Editor de Curva') ? 'OK' : `FAIL (${h2})`)

  // curva drawn (path no svg)
  const curveLen = await page.evaluate(() => {
    const path = document.querySelector('.ant-card svg path')
    return path ? path.getAttribute('d').length : 0
  })
  console.log('curve path drawn:', curveLen > 30 ? 'OK' : 'FAIL')

  // valor CSS inicial
  const cssPre = await page.evaluate(() => {
    const codes = [...document.querySelectorAll('code')].map((c) => c.textContent)
    return codes.find((x) => /^cubic-bezier\([0-9]/.test(x))
  })
  console.log('initial cssValue:', cssPre === 'cubic-bezier(0.42, 0, 0.58, 1)' ? 'OK' : `FAIL (${cssPre})`)

  // clique num preset (ease-out) muda o valor
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('.ant-btn')].find((b) => b.textContent.trim() === 'ease-out')
    if (btn) btn.click()
  })
  await new Promise((r) => setTimeout(r, 500))
  const cssAfter = await page.evaluate(() => {
    const codes = [...document.querySelectorAll('code')].map((c) => c.textContent)
    return codes.find((x) => /^cubic-bezier\([0-9]/.test(x))
  })
  console.log('preset ease-out:', cssAfter === 'cubic-bezier(0, 0, 0.58, 1)' ? 'OK' : `FAIL (${cssAfter})`)

  // input numbers sync ao preset
  const nums = await page.evaluate(() => [...document.querySelectorAll('.ant-input-number-input')].map((i) => i.value))
  console.log('inputs sync:', JSON.stringify(nums))

  // play: o preview movimenta (box muda de left)
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('.ant-btn')].find((b) => /Rodar|Play/.test(b.textContent.trim()))
    if (btn) btn.click()
  })
  await new Promise((r) => setTimeout(r, 400))
  const leftA = await page.evaluate(() => {
    const boxes = [...document.querySelectorAll('div[style*="position: absolute"]')]
    return boxes.map((b) => b.style.left || '')
  })
  await new Promise((r) => setTimeout(r, 400))
  const leftB = await page.evaluate(() => {
    const boxes = [...document.querySelectorAll('div[style*="position: absolute"]')]
    return boxes.map((b) => b.style.left || '')
  })
  const moved = leftA.some((l, i) => l && l !== leftB[i])
  console.log('preview animates:', moved ? 'OK' : 'FAIL')

  // marcador svg aparece
  const marker = await page.evaluate(() => {
    const c = [...document.querySelectorAll('.ant-card svg circle')].find((c) => c.getAttribute('fill') === '#f5222d')
    return c ? c.getAttribute('cx') + ',' + c.getAttribute('cy') : null
  })
  console.log('marker svg:', marker ? 'OK' : 'FAIL')

  // EN toggle
  await page.evaluate(() => {
    const seg = [...document.querySelectorAll('.ant-segmented-item')].find((x) => x.textContent.trim() === 'EN')
    seg.click()
  })
  await new Promise((r) => setTimeout(r, 500))
  const h2en = await page.$eval('h2', (el) => el.textContent)
  console.log('EN title:', h2en.includes('Cubic Bézier Easing Editor') ? 'OK' : `FAIL (${h2en})`)

  console.log('page errors:', errs.length ? JSON.stringify(errs) : 'none')
  await browser.close()
})().catch((e) => { console.error('CHECK CRASHED', e); process.exit(1) })