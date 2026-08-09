import puppeteer from 'puppeteer'

const base = 'https://devtools.eventifylab.com'
const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] })

let failed = false
const page = await browser.newPage()
await page.setViewport({ width: 1280, height: 900 })
const errors = []
page.on('pageerror', (err) => errors.push('pageerror: ' + err.message))
page.on('console', (msg) => { if (msg.type() === 'error' && !msg.text().includes('favicon')) errors.push('console.error: ' + msg.text()) })

// new page in PT
await page.goto(base + '/frontend/clip-path-generator', { waitUntil: 'networkidle2', timeout: 60000 })
await new Promise((r) => setTimeout(r, 1500))
let txt = await page.evaluate(() => document.body.innerText)
console.log('PT title:', txt.includes('Gerador de clip-path'))
console.log('output present:', txt.includes('clip-path: polygon('))

// interact: switch a preset, drag is hard to simulate — check preset button works
const buttons = await page.$$('button')
for (const b of buttons) {
  const label = await b.evaluate((el) => el.innerText)
  if (label.includes('Estrela')) { await b.click(); await new Promise((r) => setTimeout(r, 300)); break }
}
txt = await page.evaluate(() => document.body.innerText)
console.log('star preset applied (14 vertices):', txt.includes('(14)') || txt.includes('14 v'))

// add vertex
for (const b of await page.$$('button')) {
  const label = await b.evaluate((el) => el.innerText)
  if (label.includes('maior aresta')) { await b.click(); await new Promise((r) => setTimeout(r, 300)); break }
}

// flip vertical
for (const b of await page.$$('button')) {
  const label = await b.evaluate((el) => el.innerText)
  if (label.includes('Espelhar vertical')) { await b.click(); await new Promise((r) => setTimeout(r, 300)); break }
}

txt = await page.evaluate(() => document.body.innerText)
console.log('page alive after interactions:', txt.length > 200)

// toggle EN
const seg = await page.$$('.ant-segmented-item')
for (const s of seg) {
  const l = await s.evaluate((el) => el.innerText)
  if (l.trim() === 'EN') { await s.click(); break }
}
await new Promise((r) => setTimeout(r, 800))
txt = await page.evaluate(() => document.body.innerText)
console.log('EN title:', txt.includes('clip-path Generator'))
console.log('EN copy button:', txt.includes('Copy'))

// home still healthy
await page.goto(base + '/', { waitUntil: 'networkidle2', timeout: 60000 })
await new Promise((r) => setTimeout(r, 1200))
txt = await page.evaluate(() => document.body.innerText)
console.log('home alive:', txt.length > 300)

if (errors.length) { failed = true; console.log('ERRORS:'); errors.forEach((e) => console.log('  ' + e)) }
else console.log('no pageerror / console errors')

await browser.close()
if (failed) process.exit(1)
console.log('ALL OK')