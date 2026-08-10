import puppeteer from 'puppeteer'

const BASE = 'https://devtools.eventifylab.com'

const EXPECT_MESSY_FORMAT = `<div class="hero">
  <h1>Olá, mundo!</h1>
  <p>Bem-vindo ao nosso <strong>site</strong> .</p>
  <ul>
    <li>Item 1</li>
    <li>Item 2</li>
    <li><a href="#">Item 3</a></li>
  </ul>
</div>
<section class="cards">
  <article>
    <h2>Título</h2>
    <p>Texto <em>com ênfase</em> e <code>código</code>.</p>
    <img src="a.png" alt="imagem"><br>
  </article>
</section>`

const browser = await puppeteer.launch({
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
})
const results = []

async function checkPage(path, label) {
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`))
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`console.error: ${msg.text()}`)
  })
  try {
    await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle0', timeout: 60000 })
    await new Promise((r) => setTimeout(r, 1200))
    const title = await page.evaluate(() => document.querySelector('h2')?.textContent || document.title)
    const ok = errors.length === 0
    results.push({ label, path, ok, title: title?.trim()?.slice(0, 60), errors })
    console.log(`${ok ? 'OK  ' : 'FAIL'} ${label} -> ${title?.trim()?.slice(0, 60)}`)
    errors.forEach((e) => console.log('     ' + e))
  } catch (err) {
    results.push({ label, path, ok: false, errors: [err.message] })
    console.log(`FAIL ${label} -> ${err.message}`)
  } finally {
    await page.close()
  }
}

async function clickByText(page, selector, text) {
  return page.evaluate((sel, txt) => {
    const btns = [...document.querySelectorAll(sel)]
    const b = btns.find((x) => x.textContent.trim() === txt)
    if (!b) return false
    b.click()
    return true
  }, selector, text)
}

async function checkFormatter() {
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`))
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`console.error: ${msg.text()}`)
  })
  try {
    await page.goto(`${BASE}/tools/html-formatter`, { waitUntil: 'networkidle0', timeout: 60000 })
    await new Promise((r) => setTimeout(r, 1200))

    // textarea preenchida com o sample messy (default) -> clicar Formatar
    const clicked = await clickByText(page, 'button', 'Formatar')
    await new Promise((r) => setTimeout(r, 500))
    const out1 = await page.evaluate(() => document.querySelector('pre code')?.textContent || '')
    const ok1 = out1 === EXPECT_MESSY_FORMAT
    console.log(`${ok1 ? 'OK  ' : 'FAIL'} formatter fmt messy sample (clicked=${clicked})`)
    if (!ok1) {
      console.log('     expected:\n' + JSON.stringify(EXPECT_MESSY_FORMAT))
      console.log('     got:\n' + JSON.stringify(out1))
    }
    if (out1 && out1.length) {
      const statsText = await page.evaluate(() =>
        [...document.querySelectorAll('.ant-descriptions-item-content')]
          .map((x) => x.textContent.trim().replace(/\s+/g, ' '))
          .join(' | ')
      )
      console.log('     stats:', statsText.slice(0, 120))
    }

    // Minificar -> deve virar uma linha só
    await clickByText(page, 'button', 'Minificar')
    await new Promise((r) => setTimeout(r, 500))
    const out2 = await page.evaluate(() => document.querySelector('pre code')?.textContent || '')
    const ok2 = !out2.includes('\n') && out2.includes('<div class="hero">') && out2.includes('</section>')
    console.log(`${ok2 ? 'OK  ' : 'FAIL'} formatter minify single-line (len=${out2.length})`)

    // Trocar idioma pra EN e conferir que os rótulos mudam sem quebrar
    await clickByText(page, '.ant-segmented-item', 'EN')
    await new Promise((r) => setTimeout(r, 400))
    const enTitle = await page.evaluate(() => document.querySelector('h2')?.textContent || '')
    console.log(`${enTitle.includes('HTML Formatter') ? 'OK  ' : 'FAIL'} i18n EN title -> ${enTitle.trim().slice(0, 40)}`)

    const pageOk = errors.length === 0
    results.push({ label: 'formatter-interaction', path: '/tools/html-formatter', ok: ok1 && ok2 && pageOk, errors })
    pageOk && console.log('OK  formatter-interaction no console/page errors')
    errors.forEach((e) => console.log('     ' + e))
  } catch (err) {
    results.push({ label: 'formatter-interaction', path: '/tools/html-formatter', ok: false, errors: [err.message] })
    console.log('FAIL formatter-interaction ->', err.message)
  } finally {
    await page.close()
  }
}

await checkPage('/', 'home')
await checkPage('/tools/html-formatter', 'html-formatter')
await checkPage('/tools/json-formatter', 'json-formatter (untouched page)')
await checkFormatter()

const allOk = results.every((r) => r.ok)
console.log('\n=== ' + (allOk ? 'ALL PASS' : 'SOME FAILED') + ' ===')
console.log(JSON.stringify(results.map((r) => ({ label: r.label, ok: r.ok })), null, 1))
await browser.close()
process.exit(allOk ? 0 : 1)