import puppeteer from 'puppeteer'
const url = process.env.BASE_URL || 'https://devtools.eventifylab.com'
const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] })
const page = await browser.newPage()
const errs = []
page.on('pageerror', (e) => errs.push('pageerror: ' + e.message))
page.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text()) })

await page.goto(url + '/devops/changelog-generator', { waitUntil: 'networkidle2', timeout: 30000 })
await new Promise((r) => setTimeout(r, 400))

const input = [
  'abc1234 feat(auth)!: adiciona login por sessão',   // breaking + scope
  '9f2e7d5 fix: corrige crash no startup',            // no scope
  'linha aleatória que não é commit',                 // other
  'docs: atualiza README',                            // no hash
].join('\n')
await page.evaluate((v) => {
  const ta = document.querySelector('textarea')
  const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set
  setter.call(ta, v)
  ta.dispatchEvent(new Event('input', { bubbles: true }))
}, input)
await new Promise((r) => setTimeout(r, 400))

const mdPt = await page.evaluate(() => {
  const pres = [...document.querySelectorAll('pre code')].map((e) => e.textContent)
  return pres.filter((p) => p.startsWith('# Changelog'))[0]
})
console.log('=== PT (hashes on, breaking) ===')
console.log(mdPt)

// switch to EN
const seg = await page.evaluateHandle(() => {
  return [...document.querySelectorAll('.ant-segmented-item')].find((el) => el.textContent.trim() === 'EN')
})
if (seg) await seg.asElement().click()
await new Promise((r) => setTimeout(r, 400))

// toggle hash switch off
const sw = await page.evaluateHandle(() => document.querySelector('.ant-switch'))
if (sw) await sw.asElement().click()
await new Promise((r) => setTimeout(r, 300))

const mdEn = await page.evaluate(() => {
  const pres = [...document.querySelectorAll('pre code')].map((e) => e.textContent)
  return pres.filter((p) => p.startsWith('# Changelog'))[0] || ''
})
console.log('--- EN result (hash off) ---')
console.log(mdEn)
console.log('ERRORS:', errs.length ? errs.filter((e) => !e.includes('favicon')).slice(0,5) : 'none')
await browser.close()
process.exit(0)