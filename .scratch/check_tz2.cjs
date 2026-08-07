const puppeteer = require('puppeteer')
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function check(url) {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] })
  const page = await browser.newPage()
  const errors = []
  const badReqs = []
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push('console.error: ' + m.text())
  })
  page.on('requestfailed', (r) => badReqs.push('failed: ' + r.url()))
  page.on('response', (r) => { if (r.status() >= 400) badReqs.push(r.status() + ': ' + r.url()) })
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 })
  await sleep(2500)
  await browser.close()
  return { errors, badReqs }
}

;(async () => {
  for (const url of [
    'https://devtools.eventifylab.com/',
    'https://devtools.eventifylab.com/tools/timezone-converter',
  ]) {
    const { errors, badReqs } = await check(url)
    console.log('\nURL:', url)
    console.log('JS errors:', errors.length ? JSON.stringify(errors) : 'none')
    console.log('bad responses:', badReqs.length ? JSON.stringify([...new Set(badReqs)]) : 'none')
  }
  process.exit(0)
})()