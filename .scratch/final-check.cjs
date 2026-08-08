const puppeteer = require('puppeteer')

;(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] })
  const page = await browser.newPage()
  const errs = []
  page.on('pageerror', (e) => errs.push(`PAGEERROR: ${e.message}`))
  page.on('console', (m) => { if (m.type() === 'error' && !m.text().includes('404')) errs.push(`CONSOLE.ERROR: ${m.text()}`) })
  for (const path of ['/', '/frontend/svg-placeholder-generator', '/tools/float-explorer']) {
    await page.goto('https://devtools.eventifylab.com' + path, { waitUntil: 'networkidle0', timeout: 45000 })
    await new Promise((r) => setTimeout(r, 800))
  }
  await page.goto('https://devtools.eventifylab.com/frontend/svg-placeholder-generator', { waitUntil: 'networkidle0', timeout: 45000 })
  await new Promise((r) => setTimeout(r, 1000))
  const ok = await page.evaluate(() => {
    const pre = [...document.querySelectorAll('pre code')].map((c) => c.textContent)
    const b = pre.find((x) => x.startsWith('data:image/svg+xml;base64,'))
    const raw = atob(b.split(',')[1])
    const dec = pre.find((x) => x.startsWith('data:image/svg+xml;charset=utf-8,'))
    const inflated = decodeURIComponent(dec.split(',')[1])
    return raw.includes('</svg>') && inflated.includes('</svg>')
  })
  console.log('cross-page load + round-trip:', ok ? 'OK' : 'FAIL')
  console.log('JS pageerrors:', errs.length ? JSON.stringify(errs) : 'none')
  await browser.close()
})()