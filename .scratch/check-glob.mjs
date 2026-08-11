import puppeteer from 'puppeteer'

const BASE = 'https://devtools.eventifylab.com'

const results = { pageErrors: [], consoleErrors: [], ok: true }

async function checkPage(browser, path, label, fn) {
  const page = await browser.newPage()
  page.on('pageerror', (e) => results.pageErrors.push(`${label}: ${e.message}`))
  page.on('console', (m) => {
    if (m.type() === 'error') results.consoleErrors.push(`${label}: ${m.text()}`)
  })
  await page.goto(BASE + path, { waitUntil: 'networkidle0', timeout: 60000 })
  await new Promise((r) => setTimeout(r, 1200))
  if (fn) await fn(page)
  await page.close()
}

const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] })

// 1) Home
await checkPage(browser, '/', 'home', async (page) => {
  const body = await page.evaluate(() => document.body.innerText)
  if (!body.includes('DevTools')) throw new Error('home: title missing')
})

// 2) New page — content + interaction
await checkPage(browser, '/tools/glob-tester', 'glob-tester', async (page) => {
  const body = await page.evaluate(() => document.body.innerText)

  // title
  if (!body.includes('Glob Pattern Tester')) throw new Error('title missing')

  // default sample tree/patters must produce ignored+kept counts in the card
  const hasIgnoredTag = body.includes('Ignorados:')
  if (!hasIgnoredTag) throw new Error('stats card missing')

  // default report: with SAMPLE_PATTERNS/SAMPLE_TREE expect some Ignorado tags in the list
  const ignoradoCount = (body.match(/Ignorado/g) || []).length
  if (ignoradoCount < 2) throw new Error(`expected several ignored rows, got ${ignoradoCount}`)

  // the deciding-pattern annotation must appear
  if (!body.includes('decidido por')) throw new Error('deciding pattern text missing')

  // no-effect flag should be present (coverage/.gitkeep negation is neutralized)
  if (!body.includes('sem efeito')) throw new Error('no-effect tag missing')

  // toggle filter to "Mantidos" and ensure only kept rows shown
  await page.evaluate(() => {
    const btns = [...document.querySelectorAll('.ant-segmented-item')]
    const kept = btns.find((b) => b.textContent.includes('Mantidos'))
    if (kept) kept.click()
  })
  await new Promise((r) => setTimeout(r, 400))
  const keptBody = await page.evaluate(() => document.body.innerText)
  const keptCount = (keptBody.match(/Mantido(?!s)/g) || []).length
  const stillIgnored = (keptBody.match(/Ignorado(?!s)/g) || []).length
  if (stillIgnored > 0) throw new Error(`filter kept still shows ${stillIgnored} ignored rows`)

  // PT/EN toggle: switch to EN and expect English labels
  await page.evaluate(() => {
    const segs = [...document.querySelectorAll('.ant-segmented-item')]
    const en = segs.find((b) => b.textContent.trim() === 'EN')
    if (en) en.click()
  })
  await new Promise((r) => setTimeout(r, 400))
  const enBody = await page.evaluate(() => document.body.innerText)
  if (!enBody.includes('Patterns (one per line)')) throw new Error('EN labels missing')
  if (!enBody.includes('no effect')) throw new Error('EN no-effect missing')
})

await browser.close()

if (results.pageErrors.length || results.consoleErrors.length) {
  results.ok = false
}
console.log('pageErrors:', results.pageErrors.length ? results.pageErrors : 'none')
console.log('consoleErrors:', results.consoleErrors.length ? results.consoleErrors : 'none')
console.log(results.ok ? 'ALL CHECKS PASSED' : 'CHECKS FAILED')
process.exit(results.ok ? 0 : 1)