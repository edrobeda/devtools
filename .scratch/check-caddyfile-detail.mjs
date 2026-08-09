import puppeteer from 'puppeteer'

const BASE = 'https://devtools.eventifylab.com'

;(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] })
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push('console.error: ' + msg.text()) })

  await page.goto(BASE + '/devops/caddyfile-generator', { waitUntil: 'networkidle0', timeout: 60000 })
  await new Promise((r) => setTimeout(r, 1500))

  // 1) title present
  const title = await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll('h2'))
    return els.map((e) => e.textContent.trim())
  })
  console.log('H2s:', JSON.stringify(title))

  // 2) verify the "Copied!" button exists
  const copyBtn = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button')).map((b) => b.textContent.trim())
    return btns.filter((b) => /Copiar|Copy/.test(b))
  })
  console.log('Copy buttons:', JSON.stringify(copyBtn))

  // 3) pre block has caddy content
  const preContent = await page.evaluate(() => {
    const pre = document.querySelector('pre code')
    return pre ? pre.textContent : 'NONE'
  })
  console.log('Generated Caddyfile:\n' + preContent)

  // 4) click a preset button to exercise interaction
  await page.evaluate(() => {
    const seg = Array.from(document.querySelectorAll('.ant-segmented-item'))
    const target = seg.find((s) => s.textContent.includes('Estático'))
    if (target) target.click()
  })
  await new Promise((r) => setTimeout(r, 500))
  const updated = await page.evaluate(() => {
    const pre = document.querySelector('pre code')
    return pre ? pre.textContent : 'NONE'
  })
  console.log('After preset click:\n' + updated)

  console.log('JS errors:', errors.length ? JSON.stringify(errors) : 'NONE')
  await browser.close()
})().catch((e) => { console.error('FATAL', e); process.exit(1) })