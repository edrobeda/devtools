const puppeteer = require('puppeteer')

;(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] })
  const page = await browser.newPage()
  const errs = []
  page.on('pageerror', (e) => errs.push(e.message))
  page.on('console', (m) => { if (m.type() === 'error' && !/404/.test(m.text())) errs.push('console: ' + m.text()) })
  await page.goto('https://devtools.eventifylab.com/tools/css-formatter', { waitUntil: 'networkidle0' })
  await new Promise((r) => setTimeout(r, 1200))

  const clickBtn = (prefix) => page.evaluate((p) => {
    const b = [...document.querySelectorAll('button')].find((x) => x.textContent.trim().startsWith(p))
    if (b) { b.click(); return true }
    return false
  }, prefix)
  const setInput = (v) => page.evaluate((val) => {
    const ta = document.querySelector('textarea')
    const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set
    setter.call(ta, val)
    ta.dispatchEvent(new Event('input', { bubbles: true }))
  }, v)
  const resultText = () => page.evaluate(() => {
    const pres = [...document.querySelectorAll('pre')]
    return pres.length ? pres[0].innerText : null
  })

  // 1) Format the default pretty sample
  await clickBtn('Format')
  await new Promise((r) => setTimeout(r, 900))
  const pretty = await resultText()
  const r1 = pretty ? /^:root \{\n  --brand: #4f46e5;/.test(pretty) : false
  const r2 = pretty ? /\n\s*\.btn,\n\s*\.btn\.primary \{/.test(pretty) : false

  // 2) minified sample -> Format
  await setInput(':root{--brand:#4f46e5}.btn{color:red}@media screen and (min-width:720px){.hero{background-image:url("data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=")}}')
  await new Promise((r) => setTimeout(r, 300))
  await clickBtn('Format')
  await new Promise((r) => setTimeout(r, 800))
  const fmt = await resultText()
  const r3 = fmt ? /@media screen and \(min-width:720px\) \{\n\s*\.hero \{/.test(fmt) : false

  // 3) Minify data-uri stays intact and comments stripped
  await setInput('/* x */.a{color:red;background:url(data:image/png;base64,AAA) no-repeat}')
  await new Promise((r) => setTimeout(r, 300))
  await clickBtn('Minif')
  await new Promise((r) => setTimeout(r, 800))
  const min = await resultText()
  const r4 = min ? /^\.a\{color:red;background:url\(data:image\/png;base64,AAA\) no-repeat;?\}$/.test(min) : false
  const r5 = min ? !/\/\*/.test(min) : false

  // 4) invalid CSS -> alert
  await setInput('.x { color: red;')
  await new Promise((r) => setTimeout(r, 300))
  await clickBtn('Format')
  await new Promise((r) => setTimeout(r, 800))
  const r6 = await page.evaluate(() => !!document.querySelector('.ant-alert-error'))

  const results = { r1, r2, r3, r4, r5, r6 }
  console.log('pretty excerpt:', JSON.stringify((pretty || '').slice(0, 70)))
  console.log('fmt excerpt:', JSON.stringify((fmt || '').slice(0, 70)))
  console.log('min full:', JSON.stringify(min || ''))
  console.log(JSON.stringify(results, null, 2))
  console.log('errors:', JSON.stringify(errs))
  await browser.close()
  process.exit(Object.values(results).every(Boolean) && errs.length === 0 ? 0 : 1)
})()