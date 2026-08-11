import puppeteer from 'puppeteer'

const BASE = 'https://devtools.eventifylab.com'
const urls = ['/references/redis-commands', '/']

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

  if (url === '/references/redis-commands') {
    const hasContent = bodyText.includes('ZADD') && bodyText.includes('INCR') && bodyText.includes('SCAN')
    const hasCategory = bodyText.includes('Sorted Sets') || bodyText.includes('Strings')
    console.log('has key redis content:', hasContent)
    console.log('has category labels:', hasCategory)
    if (!hasContent || !hasCategory) failed = true
    const count = await page.evaluate(() => document.querySelectorAll('.ant-list-item').length)
    console.log('list items rendered:', count)
    if (count < 10) failed = true
  } else {
    const hasMenu = bodyText.includes('Redis')
    console.log('home mentions Redis menu:', hasMenu)
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
    const hasEn = url === '/' ? enText.includes('Redis Commands') : enText.includes('Redis Cheat Sheet')
    console.log('EN label present:', hasEn)
    if (!hasEn) failed = true
  }

  // reset lang to pt for next URL
  const segPt = await page.evaluate(() => {
    const segButtons = [...document.querySelectorAll('.ant-segmented-item')]
    const pt = segButtons.find((b) => b.textContent.trim() === 'PT')
    if (pt) { pt.click(); return true }
    return false
  })
  if (segPt) await new Promise((r) => setTimeout(r, 400))

  await page.close()
}

await browser.close()
console.log(failed ? '\nFAIL' : '\nOK')
process.exit(failed ? 1 : 0)