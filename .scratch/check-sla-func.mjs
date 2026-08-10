import puppeteer from 'puppeteer'

const browser = await puppeteer.launch({
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
})
const page = await browser.newPage()
const jsErrors = []
page.on('pageerror', (err) => jsErrors.push(`pageerror: ${err.message}`))
page.on('console', (msg) => {
  if (msg.type() === 'error' && !msg.text().includes('favicon.ico')) jsErrors.push(`console: ${msg.text()}`)
})
await page.goto('https://devtools.eventifylab.com/devops/sla-calculator', {
  waitUntil: 'networkidle0',
  timeout: 60000,
})
await new Promise((r) => setTimeout(r, 1000))

// 1. Verify budget renders (default 99.9% / 30 days = 43m12s)
const budgetText = await page.evaluate(() => {
  const items = Array.from(document.querySelectorAll('.ant-descriptions-item-label'))
  const allowed = items.find((i) => i.textContent.includes('Downtime permitido') || i.textContent.includes('Allowed downtime'))
  return allowed ? allowed.parentElement.textContent : null
})
console.log('budget row:', budgetText ? budgetText.replace(/\s+/g, ' ').slice(-60) : 'NOT FOUND')

// 2. Click preset tag "99.99%"
const clicked = await page.evaluate(() => {
  const tags = Array.from(document.querySelectorAll('.ant-tag'))
  const target = tags.find((t) => t.textContent.trim() === '99.99%')
  if (!target) return false
  target.click()
  return true
})
console.log('preset 99.99% clicked:', clicked)
await new Promise((r) => setTimeout(r, 400))

// 3. Add an incident and change unit to hours
const addBtn = await page.evaluate(() => {
  const btn = Array.from(document.querySelectorAll('button')).find((b) => b.textContent.includes('Adicionar incidente') || b.textContent.includes('Add incident'))
  if (!btn) return false
  btn.click()
  return true
})
console.log('add incident clicked:', addBtn)
await new Promise((r) => setTimeout(r, 400))

const incidentRows = await page.evaluate(() => document.querySelectorAll('.ant-list-item').length)
console.log('incident rows:', incidentRows)

const statusText = await page.evaluate(() => {
  const items = Array.from(document.querySelectorAll('.ant-descriptions-item'))
  const s = items.find((i) => i.textContent.includes('Status') || i.textContent.includes('Estourou') || i.textContent.includes('Dentro'))
  return s ? s.textContent.replace(/\s+/g, ' ').slice(0, 120) : 'NOT FOUND'
})
console.log('status:', statusText)

console.log('js errors:', jsErrors.length ? jsErrors : 'none')
await browser.close()
process.exit(jsErrors.length ? 1 : 0)