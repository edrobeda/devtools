const puppeteer = require('puppeteer')

;(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] })
  const page = await browser.newPage()
  await page.goto('https://devtools.eventifylab.com/frontend/svg-placeholder-generator', { waitUntil: 'networkidle0', timeout: 45000 })
  await new Promise((r) => setTimeout(r, 1200))
  const res = await page.evaluate(() => {
    const pres = [...document.querySelectorAll('pre code')].map((c, i) => ({ i, head: c.textContent.slice(0, 45) }))
    const all = pres.map((p) => p.head)
    const b = ([...document.querySelectorAll('pre code')].find((c) => c.textContent.startsWith('data:image/svg+xml;base64,')))
    if (!b) return { all, found: false }
    const raw = atob(b.textContent.split(',')[1])
    return { all, found: true, len: raw.length, hasOpen: raw.includes('<svg'), hasClose: raw.includes('</svg>'), head: raw.slice(0, 60) }
  })
  console.log(JSON.stringify(res, null, 2))
  await browser.close()
})()