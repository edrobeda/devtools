const puppeteer = require('puppeteer')

const ROUTES = ['/', '/references/bash-scripting']

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
    }))
    console.log(`${route} bodyChars=${info.bodyChars} listItems=${info.listItems} errors=${JSON.stringify(errs)}`)
    if (errs.length || info.bodyChars < 50) failed++
    if (route.includes('bash-scripting') && info.listItems < 58) failed++
    await page.close()
  }

  const page = await browser.newPage()
  const pgErrs = []
  page.on('pageerror', (e) => pgErrs.push('pageerror: ' + e.message))
  page.on('console', (m) => { if (m.type() === 'error') pgErrs.push('console: ' + m.text()) })
  await page.goto('https://devtools.eventifylab.com/references/bash-scripting', { waitUntil: 'networkidle0' })
  await new Promise((r) => setTimeout(r, 700))

  const itemsBefore = await page.evaluate(() => document.querySelectorAll('.ant-list-item').length)
  console.log('items(all):', itemsBefore)
  if (itemsBefore < 58) failed++

  // search filter (matches set -euo pipefail entry)
  await page.type('.ant-input-affix-wrapper input, input.ant-input', 'pipefail', { delay: 5 })
  await new Promise((r) => setTimeout(r, 300))
  const itemsSearch = await page.evaluate(() => document.querySelectorAll('.ant-list-item').length)
  console.log('items("pipefail"):', itemsSearch)
  if (itemsSearch < 1 || itemsSearch >= itemsBefore) failed++

  await page.evaluate(() => {
    const clear = document.querySelector('.ant-input-clear-icon')
    if (clear) clear.click()
  })
  await new Promise((r) => setTimeout(r, 250))

  // category filter -> Receitas / Everyday
  await page.evaluate(() => {
    const labels = Array.from(document.querySelectorAll('.ant-radio-button-wrapper'))
    const el = labels.find((x) => x.innerText.startsWith('Receitas') || x.innerText.startsWith('Everyday'))
    if (el) el.click()
  })
  await new Promise((r) => setTimeout(r, 300))
  const itemsCat = await page.evaluate(() => document.querySelectorAll('.ant-list-item').length)
  console.log('items(recipes):', itemsCat)
  if (itemsCat === 0 || itemsCat === itemsBefore) failed++

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
  console.log('EN contains "Bash Scripting Cheat Sheet":', enText.includes('Bash Scripting Cheat Sheet'))
  if (!enText.includes('Bash Scripting Cheat Sheet')) failed++

  // PT switch back, verify menu link exists in sider
  await page.evaluate(() => {
    const seg = Array.from(document.querySelectorAll('.ant-segmented-item')).find((el) => el.innerText.trim() === 'PT')
    if (seg) seg.click()
  })
  await new Promise((r) => setTimeout(r, 300))
  const ptText = await page.evaluate(() => document.querySelector('.ant-layout-sider')?.innerText)
  console.log('menu has bash-scripting:', ptText && ptText.includes('Scripts em Bash'))
  if (!ptText || !ptText.includes('Scripts em Bash')) failed++

  console.log('all pgErrs:', JSON.stringify(pgErrs))
  if (pgErrs.length) failed++
  await page.close()

  await browser.close()
  console.log(failed ? 'FAILED=' + failed : 'ALL OK')
  process.exit(failed ? 1 : 0)
}

main()