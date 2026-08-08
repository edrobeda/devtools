const puppeteer = require('puppeteer')

const ROUTES = [
  '/',
  '/references/markdown-syntax',
]

async function main() {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] })
  let failed = 0
  for (const route of ROUTES) {
    const page = await browser.newPage()
    const errs = []
    page.on('pageerror', (e) => errs.push('pageerror: ' + e.message))
    page.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text()) })
    await page.goto('https://devtools.eventifylab.com' + route, { waitUntil: 'networkidle0' })
    await new Promise((r) => setTimeout(r, 1500))
    console.log(`${route} -> errors=${JSON.stringify(errs)}`)

    if (route === '/references/markdown-syntax') {
      const info = await page.evaluate(() => {
        const cards = [...document.querySelectorAll('.ant-card')]
        const previews = [...document.querySelectorAll('.ant-card pre')].length
        const renderedImgs = [...document.querySelectorAll('.ant-card img')].length
        const renderedTables = [...document.querySelectorAll('.ant-card table')].length
        const checkbox = [...document.querySelectorAll('.ant-card input[type=checkbox]')].length
        const text = document.body.innerText
        return {
          cards: cards.length,
          previews,
          renderedImgs,
          renderedTables,
          checkbox,
          hasTitle: text.includes('Markdown Syntax'),
        }
      })
      console.log('  page info:', JSON.stringify(info))
      if (info.cards === 0 || !info.hasTitle) {
        errs.push('page did not render expected content')
        failed++
      }
      if (errs.length) failed++
    } else if (errs.length) {
      failed++
    }
    await page.close()
  }
  await browser.close()
  process.exit(failed ? 1 : 0)
}

main().catch((e) => { console.error(e); process.exit(1) })
