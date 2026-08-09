import puppeteer from 'puppeteer'
const URL = 'https://devtools.eventifylab.com'
const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] })

async function open(path) {
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()) })
  await page.goto(URL + path, { waitUntil: 'networkidle2', timeout: 60000 })
  await new Promise(r => setTimeout(r, 900))
  return { page, errors }
}

const unitState = (page) => page.evaluate(() =>
  Array.from(document.querySelectorAll('.ant-row > .ant-col')).map((col) => {
    const code = col.querySelector('.ant-typography code')?.textContent || ''
    const inp = col.querySelector('input')
    return inp && { code, value: inp.value }
  }).filter(Boolean)
)

async function setByCode(page, code, text) {
  return page.evaluate((c, t) => {
    const cols = Array.from(document.querySelectorAll('.ant-row > .ant-col'))
    for (const col of cols) {
      const cc = col.querySelector('.ant-typography code')?.textContent
      const inp = col.querySelector('input')
      if (inp && cc === c) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
        setter.call(inp, t)
        inp.dispatchEvent(new Event('input', { bubbles: true }))
        return true
      }
    }
    return false
  }, code, text)
}

async function switchCat(page, label) {
  const items = await page.$$('.ant-segmented-item')
  for (const el of items) {
    const txt = (await el.evaluate(n => n.textContent)).trim()
    if (txt === label) { await el.click(); await new Promise(r => setTimeout(r, 350)); return true }
  }
  return false
}

const show = (st) => st.map(s => `${s.code}=${s.value}`).join(' | ')

const { page, errors } = await open('/tools/units-converter')
console.log('== /tools/units-converter ==')
console.log('h2:', (await page.$eval('h2', el => el.textContent.trim())).replace(/\s+/g,' '))

let st = await unitState(page)
console.log('units:', st.map(s => s.code).join(','))

await setByCode(page, 'cm', '2')
await new Promise(r => setTimeout(r, 250))
st = await unitState(page)
console.log('2 cm    ->', show(st))

await switchCat(page, 'Temperatura')
await setByCode(page, '°C', '32'); await new Promise(r => setTimeout(r, 250))
st = await unitState(page)
console.log('32 °C   ->', show(st))

await switchCat(page, 'Velocidade')
await setByCode(page, 'km/h', '100'); await new Promise(r => setTimeout(r, 250))
st = await unitState(page)
console.log('100 km/h->', show(st))

await switchCat(page, 'Dados')
st = await unitState(page)
console.log('data    ->', st.map(s => s.code).join(','))
await setByCode(page, 'GB', '500'); await new Promise(r => setTimeout(r, 250))
st = await unitState(page)
console.log('500 GB  ->', show(st))

await setByCode(page, 'B', 'abc'); await new Promise(r => setTimeout(r, 200))
st = await unitState(page)
console.log('"abc" in B ->', JSON.stringify(st.slice(0,4)))
const alertShown = await page.evaluate(() => !!document.querySelector('.ant-alert-error'))
console.log('error alert shown:', alertShown)

// copy button click on KiB field
const copyResult = await page.evaluate(() => {
  const cols = Array.from(document.querySelectorAll('.ant-row > .ant-col'))
  for (const col of cols) {
    const c = col.querySelector('.ant-typography code')?.textContent
    if (c === 'KiB') { const b = col.querySelector('.ant-input-suffix button'); if (b) { b.click(); return 'clicked' } }
  }
  return 'not found'
})
await new Promise(r => setTimeout(r, 200))
console.log('copy button on KiB:', copyResult)

console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'NO JS ERRORS')
await page.close()

const { page: hp, errors: he } = await open('/')
console.log('\n== / ==')
console.log('h2:', (await hp.$eval('h2', el => el.textContent.trim()).catch(() => 'N/A')).replace(/\s+/g,' '))
console.log(he.length ? 'ERRORS:\n' + he.join('\n') : 'NO JS ERRORS')
await hp.close()
await browser.close()
