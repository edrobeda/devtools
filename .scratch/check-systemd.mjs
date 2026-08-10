import puppeteer from 'puppeteer'

const BASE = 'https://devtools.eventifylab.com'
const targets = [BASE + '/', BASE + '/references/systemd-commands']

const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] })

for (const url of targets) {
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', (err) => errors.push('pageerror: ' + err.message))
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push('console.error: ' + msg.text())
  })
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 })
  const title = await page.title().catch(() => '')
  // give client-rendered content a moment
  await new Promise((r) => setTimeout(r, 1500))
  const heading = await page.evaluate(() => {
    const h = document.querySelector('h2')
    return h ? h.textContent.trim() : null
  })
  const itemCount = await page.evaluate(() => document.querySelectorAll('.ant-list-item').length)
  console.log(JSON.stringify({ url, title, heading, itemCount, errors }))
  await page.close()
}

await browser.close()