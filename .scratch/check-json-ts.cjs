const puppeteer = require('puppeteer')

const BASE = 'https://devtools.eventifylab.com'
const ROUTES = [
  '/',
  '/data/json-to-typescript',
]

async function run() {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] })
  let failures = 0
  for (const route of ROUTES) {
    const page = await browser.newPage()
    const errors = []
    const consoleErrors = []
    page.on('pageerror', (err) => errors.push(String(err)))
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text())
    })
    await page.goto(BASE + route, { waitUntil: 'networkidle2', timeout: 60000 })
    await new Promise((r) => setTimeout(r, 1500))
    const status = await page.evaluate(() => document.querySelector('h2, h1')?.textContent || '')
    const hasMenu = await page.evaluate(() => !!document.querySelector('.ant-menu'))
    const ok = errors.length === 0 && consoleErrors.length === 0
    if (!ok) failures++
    console.log(`[${ok ? 'OK' : 'FAIL'}] ${route} | title=${status.slice(0, 60)} | menu=${hasMenu}`)
    for (const e of errors) console.log('   pageerror:', e.slice(0, 300))
    for (const e of consoleErrors) console.log('   console.error:', e.slice(0, 300))

    if (route === '/data/json-to-typescript') {
      const output = await page.evaluate(() => document.querySelector('pre code')?.textContent || '')
      console.log('   sample output starts:', JSON.stringify(output.slice(0, 60)))

      // clicka os outros exemplos e checa re-render sem erro
      for (const tagTxt of ['Lista de produtos', 'Products', 'Payload', 'Nested', 'Usuário', 'User']) {
        const clicked = await page.evaluate((txt) => {
          const els = Array.from(document.querySelectorAll('.ant-tag'))
          const el = els.find((t) => t.textContent.trim() === txt)
          if (!el) return false
          el.click()
          return true
        }, tagTxt)
        await new Promise((r) => setTimeout(r, 400))
      }

      // alterna pra inglês e verifica que continua renderizando
      const seg = await page.evaluate(() => {
        const segs = Array.from(document.querySelectorAll('.ant-segmented-item'))
        const en = segs.find((s) => s.textContent.trim() === 'EN')
        if (en) en.click()
        return !!en
      })
      await new Promise((r) => setTimeout(r, 600))
      const after = await page.evaluate(() => ({
        hasOutput: !!document.querySelector('pre code'),
        text: document.querySelector('h2')?.textContent || '',
      }))
      console.log('   lang toggle:', seg ? `ok -> ${after.text.trim().slice(0, 40)}` : 'not found', '| hasOutput', after.hasOutput)
    }
    await page.close()
  }
  await browser.close()
  process.exit(failures ? 1 : 0)
}

run().catch((err) => { console.error(err); process.exit(1) })
