const puppeteer = require('puppeteer')

const BASE = 'https://devtools.eventifylab.com'
const ROUTES = ['/', '/devops/ansi-colors']

async function main() {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] })
  let failed = 0

  for (const route of ROUTES) {
    const page = await browser.newPage()
    const errs = []
    page.on('pageerror', (e) => errs.push('pageerror: ' + e.message))
    page.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text()) })
    await page.goto(BASE + route, { waitUntil: 'networkidle0' })
    await new Promise((r) => setTimeout(r, 800))
    const title = await page.evaluate(() => document.title)
    const bodyLen = await page.evaluate(() => document.body.innerText.length)
    console.log(`${route} title=${JSON.stringify(title)} bodyChars=${bodyLen} errors=${JSON.stringify(errs)}`)
    if (errs.length) failed++
    await page.close()
  }

  // exercise the ANSI page: click examples, verify preview + cleaned output
  const page = await browser.newPage()
  const pgErrs = []
  page.on('pageerror', (e) => pgErrs.push('pageerror: ' + e.message))
  page.on('console', (m) => { if (m.type() === 'error') pgErrs.push('console: ' + m.text()) })
  await page.goto(BASE + '/devops/ansi-colors', { waitUntil: 'networkidle0' })
  await new Promise((r) => setTimeout(r, 600))

  const stats0 = await page.evaluate(() => document.body.innerText.match(/sequências SGR|SGR sequences/))
  console.log('initial stats tag present:', !!stats0)

  const clickBtn = async (txt) => page.evaluate((txt) => {
    const el = Array.from(document.querySelectorAll('button')).find((b) => b.innerText.trim() === txt)
    if (el) { el.click(); return true }
    return false
  }, txt)

  for (const label of ['Log de deploy', 'Bala 256 cores', 'Truecolor RGB']) {
    const clicked = await clickBtn(label)
    await new Promise((r) => setTimeout(r, 300))
    const state = await page.evaluate(() => {
      const pre = document.querySelector('pre')
      const text = pre ? pre.innerText : ''
      return {
        preLen: text.length,
        hasColor: Array.from(document.querySelectorAll('span')).some((s) => s.style.color && s.style.color.indexOf('rgb') !== -1),
      }
    })
    console.log(`example "${label}" clicked=${clicked} coloredRuns=${state.hasColor} previewChars=${state.preLen}`)
    if (!clicked || !state.hasColor) failed++
  }

  const cleanText = await page.evaluate(() => {
    const pres = Array.from(document.querySelectorAll('pre'))
    return pres.length
  })
  console.log('num pre blocks (preview+clean):', cleanText)
  if (cleanText < 2) failed++

  // click a few palette swatches (copy may be blocked in headless, that is fine)
  const swatchHits = await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll('div')).filter((d) => d.title && d.title.indexOf('\\x1b[') !== -1)
    let count = 0
    for (let i = 0; i < els.length; i += 40) { els[i].click(); count++ }
    return count
  })
  console.log('swatches clicked:', swatchHits)
  if (swatchHits < 5) failed++
  await new Promise((r) => setTimeout(r, 400))

  // check PT/EN toggle renders both languages
  for (const seg of ['PT', 'EN']) {
    const ok = await page.evaluate((seg) => {
      const el = Array.from(document.querySelectorAll('*')).find((n) => n.textContent.trim() === seg && n.className && String(n.className).indexOf('ant-segmented') !== -1)
      return !!el
    }, seg)
    console.log('segmented ' + seg + ' found:', ok)
  }
  const enStates = await page.evaluate(() => window.languageState)
  console.log('ansipage pagErrors:', JSON.stringify(pgErrs))
  if (pgErrs.length) failed++

  await page.close()
  await browser.close()
  process.exit(failed ? 1 : 0)
}

main()