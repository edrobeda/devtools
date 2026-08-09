import puppeteer from 'puppeteer'

const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] })
const page = await browser.newPage()
await page.goto('https://devtools.eventifylab.com/frontend/meta-tags-generator', { waitUntil: 'networkidle0' })
await new Promise((r) => setTimeout(r, 800))

const info = await page.evaluate(() => {
  const checks = Array.from(document.querySelectorAll('input[type="checkbox"]'))
  return checks.map((c) => ({
    checked: c.checked,
    label: (c.closest('label') ? c.closest('label').innerText : (c.nextElementSibling && c.nextElementSibling.textContent) || '').slice(0, 60),
  }))
})
console.log(JSON.stringify(info, null, 2))
await browser.close()