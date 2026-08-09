import puppeteer from 'puppeteer'

const base = 'https://devtools.eventifylab.com'
const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] })

let failed = false
const page = await browser.newPage()
const errors = []
page.on('pageerror', (err) => errors.push('pageerror: ' + err.message))
page.on('console', (msg) => { if (msg.type() === 'error' && !msg.text().includes('favicon')) errors.push('console.error: ' + msg.text()) })

// home: menu label visible
await page.goto(base + '/', { waitUntil: 'networkidle2', timeout: 60000 })
await new Promise((r) => setTimeout(r, 1500))
let txt = await page.evaluate(() => document.body.innerText)
console.log('home menu has keyframe label:', txt.includes('Gerador de Keyframes'))

// toggle EN, label switches
const seg = await page.$$('.ant-segmented-item')
for (const s of seg) {
  const l = await s.evaluate((el) => el.innerText)
  if (l.trim() === 'EN') { await s.click(); break }
}
await new Promise((r) => setTimeout(r, 600))
txt = await page.evaluate(() => document.body.innerText)
console.log('home menu EN label:', txt.includes('Keyframes Generator'))

// go to the page in EN and confirm it renders translated
await page.goto(base + '/frontend/keyframe-generator', { waitUntil: 'networkidle2', timeout: 60000 })
await new Promise((r) => setTimeout(r, 1200))
txt = await page.evaluate(() => document.body.innerText)
console.log('EN page title:', txt.includes('CSS Keyframes Builder'))
console.log('EN has Play button:', txt.includes('Play'))
console.log('output present:', txt.includes('animation: devtools-kf-anim'))

// back to PT, interact again quickly
await page.goto(base + '/frontend/keyframe-generator', { waitUntil: 'networkidle2', timeout: 60000 })
await new Promise((r) => setTimeout(r, 800))
const sw = await page.$('.ant-switch')
if (sw) await sw.click()
await new Promise((r) => setTimeout(r, 400))
const btns = await page.$$('button')
for (const b of btns) {
  const l = await b.evaluate((el) => el.innerText)
  if (l.includes('Adicionar frame')) { await b.click(); await new Promise((r) => setTimeout(r, 200)); }
  if (l.includes('Copiar')) { await b.click(); }
}
await new Promise((r) => setTimeout(r, 800))
txt = await page.evaluate(() => document.body.innerText)
console.log('copied toast / button ok, page alive:', txt.length > 100)

if (errors.length) { failed = true; console.log('ERRORS:'); errors.forEach((e) => console.log('  ' + e)) }
else console.log('no pageerror / console errors')

await browser.close()
if (failed) process.exit(1)
console.log('ALL OK')