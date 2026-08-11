import puppeteer from 'puppeteer'

const BASE = 'https://devtools.eventifylab.com'
const urls = ['/references/nginx-cheatsheet', '/']

const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] })

let failed = false
for (const url of urls) {
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(`PAGEERROR: ${e.message}`))
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`CONSOLE: ${msg.text()}`)
  })
  await page.goto(BASE + url, { waitUntil: 'networkidle0', timeout: 60000 })
  await new Promise((r) => setTimeout(r, 1200))

  const bodyText = await page.evaluate(() => document.body.innerText)
  const title = await page.evaluate(() => document.querySelector('h2')?.innerText || '')

  console.log(`\n=== ${url} ===`)
  console.log('title:', title)

  if (url === '/references/nginx-cheatsheet') {
    const hasNginx = bodyText.includes('proxy_pass')
    const hasLocation = bodyText.includes('location')
    const hasRootAlias = bodyText.includes('alias')
    console.log('has proxy_pass content:', hasNginx)
    console.log('has location content:', hasLocation)
    console.log('has alias content:', hasRootAlias)
    if (!hasNginx || !hasLocation || !hasRootAlias) failed = true
  } else {
    const hasMenu = bodyText.includes('Nginx')
    console.log('home mentions Nginx menu:', hasMenu)
    if (!hasMenu) failed = true
  }

  if (errors.length) {
    failed = true
    console.log('ERRORS:')
    errors.forEach((e) => console.log('  ' + e))
  } else {
    console.log('no page/console errors')
  }

  // toggle language to en
  const seg = await page.evaluate(() => {
    const segButtons = [...document.querySelectorAll('.ant-segmented-item')]
    const en = segButtons.find((b) => b.textContent.trim() === 'EN')
    if (en) { en.click(); return true }
    return false
  })
  if (seg) {
    await new Promise((r) => setTimeout(r, 800))
    const enText = await page.evaluate(() => document.body.innerText)
    const hasEn = url === '/' ? enText.includes('Nginx Cheat Sheet') : enText.includes('Nginx Cheat Sheet')
    console.log('EN label present:', hasEn)
    if (!hasEn) failed = true
  }

  await page.close()
}

await browser.close()
console.log(failed ? '\nFAIL' : '\nOK')
process.exit(failed ? 1 : 0)
