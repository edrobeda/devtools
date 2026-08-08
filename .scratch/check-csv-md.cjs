const puppeteer = require('puppeteer')

const ROUTES = [
  '/',
  '/data/csv-markdown-table',
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
    await new Promise((r) => setTimeout(r, 1200))
    const title = await page.evaluate(() => document.title)
    let bodyText = ''
    if (route === '/data/csv-markdown-table') {
      bodyText = await page.evaluate(() => document.body.innerText.slice(0, 400))
      // click sample button then read markdown output
      await page.evaluate(() => {
        const btns = [...document.querySelectorAll('button')]
        const target = btns.find((b) => b.innerText.includes('Sample') || b.innerText.includes('Exemplo'))
        if (target) target.click()
      })
      await new Promise((r) => setTimeout(r, 500))
      const preText = await page.evaluate(() => [...document.querySelectorAll('pre')].map((p) => p.innerText))
      console.log(`${route} -> title=${JSON.stringify(title)} errors=${JSON.stringify(errs)}`)
      console.log('  first pre snippet:', JSON.stringify(preText[0] ? preText[0].slice(0, 300) : 'NONE'))
    } else {
      console.log(`${route} -> title=${JSON.stringify(title)} errors=${JSON.stringify(errs)}`)
    }
    if (errs.length) failed++
    await page.close()
  }
  await browser.close()
  process.exit(failed ? 1 : 0)
}

main().catch((e) => { console.error(e); process.exit(1) })