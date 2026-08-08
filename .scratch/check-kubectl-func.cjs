const puppeteer = require('puppeteer')

const URL = 'https://devtools.eventifylab.com/devops/kubectl-commands'

async function main() {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] })
  try {
    const page = await browser.newPage()
    const errors = []
    page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
    page.on('console', (m) => {
      if (m.type() === 'error' && !m.text().includes('404')) errors.push(`console.error: ${m.text()}`)
    })
    await page.goto(URL, { waitUntil: 'networkidle0', timeout: 60000 })
    await new Promise((r) => setTimeout(r, 1000))

    const listItems = await page.evaluate(() => document.querySelectorAll('.ant-list-item').length)
    console.log('list items rendered:', listItems)

    const inputs = await page.$$eval('input', (els) => els.map((e) => ({ placeholder: e.placeholder, type: e.type })))
    console.log('inputs:', JSON.stringify(inputs.slice(0, 4)))

    const searchInput = inputs.find((i) => i.placeholder)
    if (searchInput) {
      await page.type('input[placeholder]', 'rollout')
      await new Promise((r) => setTimeout(r, 400))
      const filtered = await page.evaluate(() => document.querySelectorAll('.ant-list-item').length)
      console.log('filter "rollout" -> items:', filtered)
    }

    // click a category radio
    await page.evaluate(() => {
      const btns = [...document.querySelectorAll('.ant-radio-button-wrapper')]
      const logs = btns.find((b) => b.textContent.includes('Logs'))
      if (logs) logs.click()
    })
    await new Promise((r) => setTimeout(r, 400))
    const catItems = await page.evaluate(() => document.querySelectorAll('.ant-list-item').length)
    console.log('category Logs -> items:', catItems)

    console.log('errors:', errors.length ? errors.join('\n') : 'NONE')
    if (errors.length) process.exit(1)
    console.log('OK')
  } finally {
    await browser.close()
  }
}
main().catch((e) => { console.error('runner error', e); process.exit(1) })