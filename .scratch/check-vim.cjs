const puppeteer = require('puppeteer')

const ROUTES = ['/', '/references/vim-cheatsheet']

async function main() {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] })
  let failed = 0
  for (const route of ROUTES) {
    const page = await browser.newPage()
    const errs = []
    page.on('pageerror', (e) => errs.push('pageerror: ' + e.message))
    page.on('console', (m) => { if (m.type() === 'error' && !m.text().includes('Failed to load resource')) errs.push('console: ' + m.text()) })
    await page.goto('https://devtools.eventifylab.com' + route, { waitUntil: 'networkidle0' })
    await new Promise((r) => setTimeout(r, 800))
    const info = await page.evaluate(() => ({
      bodyChars: document.body.innerText.length,
      listItems: document.querySelectorAll('.ant-list-item').length,
      title: (document.querySelector('h2') || {}).innerText || '',
    }))
    console.log(`${route} bodyChars=${info.bodyChars} listItems=${info.listItems} title=${info.title} errors=${JSON.stringify(errs)}`)
    if (errs.length || info.bodyChars < 50) failed++
    if (route.includes('vim-cheatsheet') && info.listItems < 10) failed++
    await page.close()
  }

  // exercise the new page: search, category filter, copy, EN switch
  const page = await browser.newPage()
  const pgErrs = []
  page.on('pageerror', (e) => pgErrs.push('pageerror: ' + e.message))
  page.on('console', (m) => { if (m.type() === 'error') pgErrs.push('console: ' + m.text()) })
  await page.goto('https://devtools.eventifylab.com/references/vim-cheatsheet', { waitUntil: 'networkidle0' })
  await new Promise((r) => setTimeout(r, 700))

  // search filter
  await page.type('.ant-input-affix-wrapper input, input.ant-input', 'dd', { delay: 10 })
  await new Promise((r) => setTimeout(r, 300))
  const itemsSearch = await page.evaluate(() => document.querySelectorAll('.ant-list-item').length)
  console.log('items("dd"):', itemsSearch)
  if (itemsSearch === 0 || itemsSearch > 15) failed++

  // clear search, filter by category "Movimento"
  await page.evaluate(() => { const c = document.querySelector('.ant-input-clear-icon'); if (c) c.click() })
  await new Promise((r) => setTimeout(r, 200))
  await page.evaluate(() => {
    const labels = Array.from(document.querySelectorAll('.ant-radio-button-wrapper'))
    const arr = labels.find((el) => el.innerText.startsWith('Movimento'))
    if (arr) arr.click()
  })
  await new Promise((r) => setTimeout(r, 300))
  const itemsCat = await page.evaluate(() => document.querySelectorAll('.ant-list-item').length)
  console.log('items(Movimento):', itemsCat)
  if (itemsCat === 0 || itemsCat > 20) failed++

  // back to all, copy a single command via its row button
  await page.evaluate(() => {
    const labels = Array.from(document.querySelectorAll('.ant-radio-button-wrapper'))
    const all = labels.find((el) => el.innerText.trim() === 'Todos')
    if (all) all.click()
  })
  await new Promise((r) => setTimeout(r, 300))
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('.ant-list-item button'))
    if (btns[0]) btns[0].click()
  })
  await new Promise((r) => setTimeout(r, 300))

  // copy as markdown
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find((b) => b.innerText.includes('Markdown'))
    if (btn) btn.click()
  })
  await new Promise((r) => setTimeout(r, 300))

  // EN switch
  await page.evaluate(() => {
    const seg = Array.from(document.querySelectorAll('.ant-segmented-item')).find((el) => el.innerText.trim() === 'EN')
    if (seg) seg.click()
  })
  await new Promise((r) => setTimeout(r, 300))
  const enText = await page.evaluate(() => document.body.innerText)
  console.log('EN title shows "Vim Commands":', enText.includes('Vim Commands'))
  if (!enText.includes('Vim Commands')) failed++

  console.log('all pgErrs:', JSON.stringify(pgErrs))
  if (pgErrs.length) failed++
  await page.close()

  await browser.close()
  console.log(failed ? 'FAILED=' + failed : 'ALL OK')
  process.exit(failed ? 1 : 0)
}

main()