import puppeteer from 'puppeteer'

const URL = 'https://devtools.eventifylab.com/tools/qr-code-generator'
const HOME = 'https://devtools.eventifylab.com/'

function listener(results, label) {
  return (msg) => {
    const t = msg.type()
    if (t === 'error') {
      results.push(`[${label}] console.error: ${msg.text()}`)
    }
  }
}

const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] })
const results = []

// 1) Página nova
const page = await browser.newPage()
page.on('pageerror', (err) => results.push(`[qr] pageerror: ${err.message}`))
page.on('console', listener(results, 'qr'))
await page.goto(URL, { waitUntil: 'networkidle2', timeout: 60000 })
await page.waitForSelector('svg[role="img"][aria-label="QR Code"]', { timeout: 15000 })

const stats = {}
stats.title = await page.title()
stats.hasTextarea = await page.evaluate(() => !!document.querySelector('textarea'))
stats.svgCount = await page.evaluate(() => document.querySelectorAll('svg[aria-label="QR Code"]').length)
stats.bodyHasTitle = await page.evaluate(() => document.body.innerText.includes('QR Code'))
const svg0 = await page.evaluate(() => document.querySelector('svg[aria-label="QR Code"]')?.outerHTML.length || 0)

// alterna exemplo WIFI (mais dados → matriz maior)
const wifiTag = await page.evaluate(() => {
  const tags = [...document.querySelectorAll('.ant-tag')]
  const w = tags.find((t) => t.textContent.includes('WIFI'))
  if (w) { w.click(); return true }
  return false
})
stats.wifiClicked = wifiTag
await new Promise((r) => setTimeout(r, 800))
const svgWifi = await page.evaluate(() => document.querySelector('svg[aria-label="QR Code"]')?.outerHTML.length || 0)
stats.svgGrewOnWifi = svgWifi > svg0

// alterna ECC pra H
const eccClicked = await page.evaluate(() => {
  const btns = [...document.querySelectorAll('.ant-segmented-item')]
  const h = btns.find((b) => b.textContent.includes('H'))
  if (h) { h.click(); return true }
  return false
})
stats.eccClicked = eccClicked
await new Promise((r) => setTimeout(r, 800))
const errAfter = await page.evaluate(() => !!document.querySelector('.ant-alert-error'))
stats.alertAfterEccH = errAfter

// output pre bloqueado? (nenhum .ant-alert-error)
const hasErrorAlert = await page.evaluate(() => !!document.querySelector('.ant-alert-error'))
stats.hasErrorAlert = hasErrorAlert

await page.close()

// 2) Home
const home = await browser.newPage()
home.on('pageerror', (err) => results.push(`[home] pageerror: ${err.message}`))
home.on('console', listener(results, 'home'))
await home.goto(HOME, { waitUntil: 'networkidle2', timeout: 60000 })
await new Promise((r) => setTimeout(r, 1500))
stats.homeLoaded = await home.evaluate(() => document.body.innerText.includes('DevTools'))
stats.homeHasQrLink = await home.evaluate(() => document.body.innerText.includes('QR Code'))
await home.close()

console.log(JSON.stringify(stats, null, 2))
console.log(results.length ? 'ISSUES:\n' + results.join('\n') : 'NO_CONSOLE_OR_PAGE_ERRORS')
await browser.close()
process.exit(results.length ? 1 : 0)