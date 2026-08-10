import puppeteer from 'puppeteer'

const BASE = 'https://devtools.eventifylab.com'
const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'] })
const page = await browser.newPage()
const errors = []
page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`))
page.on('console', (msg) => { if (msg.type() === 'error') errors.push(`console.error: ${msg.text()}`) })
page.on('response', (resp) => { if (resp.status() >= 400 && !resp.url().includes('favicon')) errors.push(`${resp.status()} ${resp.url()}`) })

// Home first (shared bundle sanity)
await page.goto(`${BASE}/`, { waitUntil: 'networkidle0', timeout: 60000 })
await new Promise((r) => setTimeout(r, 800))
const homeTitle = await page.title()
const homeHasNew = await page.evaluate(() => Boolean(document.querySelector('.ant-tag-green')))

// New page
await page.goto(`${BASE}/apis/curl-to-code`, { waitUntil: 'networkidle0', timeout: 60000 })
await new Promise((r) => setTimeout(r, 800))
const title = await page.evaluate(() => document.title)
const hasHeading = await page.evaluate(() => Array.from(document.querySelectorAll('h2')).some((h) => h.textContent.includes('cURL')))
const hasCopy = await page.evaluate(() => Array.from(document.querySelectorAll('button')).some((b) => b.textContent.trim().toLowerCase().includes('copy')))
const hasPre = await page.evaluate(() => Boolean(document.querySelector('pre')))

// default sample = POST JSON -> check the generated fetch contains JSON.stringify
const pre0 = await page.evaluate(() => document.querySelector('pre')?.textContent || '')
const fetchOk = pre0.includes('fetch(') && pre0.includes('JSON.stringify') && pre0.includes('POST')

// switch to axios
await page.evaluate(() => {
  const seg = Array.from(document.querySelectorAll('.ant-segmented-item')).find((s) => s.textContent.trim() === 'axios')
  if (seg) seg.click()
})
await new Promise((r) => setTimeout(r, 400))
const pre1 = await page.evaluate(() => document.querySelector('pre')?.textContent || '')
const axiosOk = pre1.includes('axios.request') && pre1.includes('data:')

// switch to requests (python)
await page.evaluate(() => {
  const seg = Array.from(document.querySelectorAll('.ant-segmented-item')).find((s) => s.textContent.trim() === 'requests')
  if (seg) seg.click()
})
await new Promise((r) => setTimeout(r, 400))
const pre2 = await page.evaluate(() => document.querySelector('pre')?.textContent || '')
const pyOk = pre2.includes('import requests') && pre2.includes('json=')

console.log('home title:', homeTitle, '| hasNewTag:', homeHasNew)
console.log('page title:', title, '| heading:', hasHeading, '| copy btn:', hasCopy, '| has pre:', hasPre)
console.log('fetch output ok:', fetchOk)
console.log('axios output ok:', axiosOk)
console.log('python output ok:', pyOk)
console.log('ERRORS:', errors.length ? errors : 'none')

await browser.close()
process.exit(errors.length || !(hasHeading && hasCopy && hasPre && fetchOk && axiosOk && pyOk) ? 1 : 0)