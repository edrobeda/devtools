const puppeteer = require('puppeteer')
async function main() {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] })
  const page = await browser.newPage()
  const errs = []
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message))
  page.on('console', (m) => { if (m.type() === 'error' && !m.text().includes('favicon')) errs.push('console: ' + m.text()) })
  await page.goto('https://devtools.eventifylab.com/references/markdown-syntax', { waitUntil: 'networkidle0' })
  await new Promise((r) => setTimeout(r, 1800))

  const t1 = await page.evaluate(() => {
    const txt = document.body.innerText
    return { hasPTTitle: txt.includes('Sintaxe Markdown'), hasPTCat: txt.includes('Títulos'), hasPTIntro: txt.includes('cheat sheet') || txt.includes('Cheat sheet') }
  })

  // toggle to EN via the header Segmented
  await page.evaluate(() => {
    const seg = [...document.querySelectorAll('.ant-segmented-item')].find((s) => s.innerText.trim() === 'EN')
    if (seg) seg.click()
  })
  await new Promise((r) => setTimeout(r, 500))
  const t2 = await page.evaluate(() => {
    const txt = document.body.innerText
    return { hasENTitle: txt.includes('Markdown Syntax'), hasENCat: txt.includes('Headings'), hasENSearch: txt.includes('Search by name') }
  })

  console.log('PT:', JSON.stringify(t1))
  console.log('EN:', JSON.stringify(t2))
  console.log('errors:', JSON.stringify(errs))

  // sanity: every card must have rendered a preview (no 'undefined' leaked)
  const leak = await page.evaluate(() => {
    const bad = [...document.querySelectorAll('pre, code, li')].filter((el) => el.textContent.includes('undefined')).length
    return bad
  })
  console.log('undefined-leak nodes:', leak)

  await browser.close()
  process.exit(errs.length ? 1 : 0)
}
main().catch((e) => { console.error(e); process.exit(1) })