const puppeteer = require('puppeteer')

const ROUTES = ['/', '/references/ssh-cheatsheet']

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
    if (route.includes('ssh-cheatsheet') && info.listItems < 30) failed++
    await page.close()
  }

  const page = await browser.newPage()
  const pgErrs = []
  page.on('pageerror', (e) => pgErrs.push('pageerror: ' + e.message))
  page.on('console', (m) => { if (m.type() === 'error') pgErrs.push('console: ' + m.text()) })
  await page.goto('https://devtools.eventifylab.com/references/ssh-cheatsheet', { waitUntil: 'networkidle0' })
  await new Promise((r) => setTimeout(r, 700))

  // search filter
  await page.type('.ant-input-affix-wrapper input, input.ant-input', 'ssh-add', { delay: 10 })
  await new Promise((r) => setTimeout(r, 300))
  const itemsSearch = await page.evaluate(() => document.querySelectorAll('.ant-list-item').length)
  console.log('items("ssh-add"):', itemsSearch)
  if (itemsSearch === 0 || itemsSearch > 15) failed++

  // clear search, filter by category "Túneis"
  await page.evaluate(() => { const c = document.querySelector('.ant-input-clear-icon'); if (c) c.click() })
  await new Promise((r) => setTimeout(r, 200))
  await page.evaluate(() => {
    const labels = Array.from(document.querySelectorAll('.ant-radio-button-wrapper'))
    const arr = labels.find((el) => el.innerText.startsWith('T\u00faneis'))
    if (arr) arr.click()
  })
  await new Promise((r) => setTimeout(r, 300))
  const itemsCat = await page.evaluate(() => document.querySelectorAll('.ant-list-item').length)
  console.log('items(Tunels):', itemsCat)
  const touched = await page.evaluate(() => Array.from(document.querySelectorAll('.ant-list-item')).some((el) => el.innerText.includes('-L') || el.innerText.includes('-D')))
  console.log('tunnel rows visible:', touched)
  if (itemsCat === 0 || !touched) failed++

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
  console.log('EN title shows "SSH Cheat Sheet":', enText.includes('SSH Cheat Sheet'))
  if (!enText.includes('SSH Cheat Sheet')) failed++

  console.log('all pgErrs:', JSON.stringify(pgErrs))
  if (pgErrs.length) failed++
  await page.close()

  await browser.close()
  console.log(failed ? 'FAILED=' + failed : 'ALL OK')
  process.exit(failed ? 1 : 0)
}

main()