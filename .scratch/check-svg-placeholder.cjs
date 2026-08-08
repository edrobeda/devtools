const puppeteer = require('puppeteer')

;(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] })
  const page = await browser.newPage()
  const errs = []
  page.on('pageerror', (e) => errs.push(`PAGEERROR: ${e.message}`))
  page.on('console', (m) => { if (m.type() === 'error' && !m.text().includes('favicon')) errs.push(`CONSOLE.ERROR: ${m.text()}`) })
  await page.goto('https://devtools.eventifylab.com/frontend/svg-placeholder-generator', { waitUntil: 'networkidle0', timeout: 45000 })
  await new Promise((r) => setTimeout(r, 1200))

  // 1) preview img é data URI válida
  const previewSrc = await page.$eval('.ant-card img', (el) => el.src)
  const uriEncodedOk = previewSrc.startsWith('data:image/svg+xml;charset=utf-8,') && decodeURIComponent(previewSrc.split(',')[1]).includes('320 × 240')
  console.log('preview data-uri:', uriEncodedOk ? 'OK' : 'FAIL')

  // 2) base64 decode round-trip dentro do navegador
  const b64 = await page.evaluate(() => {
    const pre = [...document.querySelectorAll('pre code')].map((c) => c.textContent)
    const b = pre.find((x) => x.startsWith('data:image/svg+xml;base64,'))
    const bytes = atob(b.split(',')[1])
    let s = ''
    for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i])
    return s
  })
  console.log('base64 round-trip svg:', b64.includes('<svg') && b64.includes('</svg>') ? 'OK' : 'FAIL')

  // 3) troca para Sólido e muda texto -> preview reflete
  await page.evaluate(() => {
    const seg = [...document.querySelectorAll('.ant-segmented-item')].find((x) => x.textContent === 'Sólido' || x.textContent === 'Solid')
    seg.click()
  })
  await new Promise((r) => setTimeout(r, 300))
  await page.evaluate(() => {
    const inp = document.querySelector('.ant-input')
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
    setter.call(inp, 'ola mundo')
    inp.dispatchEvent(new Event('input', { bubbles: true }))
  })
  await new Promise((r) => setTimeout(r, 300))
  const scr2 = await page.$eval('.ant-card img', (el) => el.src)
  const containsText = decodeURIComponent(scr2.split(',')[1]).includes('ola mundo')
  const noGradient = !decodeURIComponent(scr2.split(',')[1]).includes('linearGradient')
  console.log('solid+text update:', containsText && noGradient ? 'OK' : 'FAIL')

  // 4) botão copiar solta message (sem erro)
  await page.evaluate(() => { const btns = [...document.querySelectorAll('.ant-btn')].filter((b) => /Copiar|Copy/.test(b.textContent)); if (btns[0]) btns[0].click() })
  await new Promise((r) => setTimeout(r, 400))
  console.log('copy click:', errs.length ? 'ERRORS' : 'OK')

  // 5) toggle EN
  await page.evaluate(() => {
    const seg = [...document.querySelectorAll('.ant-segmented-item')].find((x) => x.textContent.trim() === 'EN')
    seg.click()
  })
  await new Promise((r) => setTimeout(r, 400))
  const h2 = await page.$eval('h2', (el) => el.textContent)
  console.log('EN toggle title:', h2.includes('SVG Placeholder Generator') ? 'OK' : 'FAIL (' + h2 + ')')
  console.log('page errors:', errs.length ? JSON.stringify(errs) : 'none')
  await browser.close()
})()