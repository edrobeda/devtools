import puppeteer from 'puppeteer'

const base = 'https://devtools.eventifylab.com'
const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] })
const page = await browser.newPage()

const logs = []
page.on('pageerror', (e) => logs.push('PAGEERROR: ' + e.message))
page.on('console', (m) => {
  // "Failed to load resource" 404 vem do favicon.ico ausente (sempre existiu) —
  // não é erro de JS; o que derruba a página é PAGEERROR, tratado acima.
  if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) {
    logs.push('CONSOLE: ' + m.text())
  }
})

let ok = true
const fails = []
const assert = (c, m) => { if (!c) { fails.push(m); ok = false } }

// home
await page.goto(base + '/', { waitUntil: 'networkidle0', timeout: 90000 })
await new Promise((r) => setTimeout(r, 1000))
assert(logs.length === 0, 'HOME erro: ' + logs.join(' | '))

// rota nova
logs.length = 0
const resp = await page.goto(base + '/tools/html-to-markdown', { waitUntil: 'networkidle0', timeout: 90000 })
await new Promise((r) => setTimeout(r, 1000))
assert(resp.status() === 200, 'rota retornou ' + resp.status())
assert(logs.length === 0, 'rota nova erro: ' + logs.join(' | '))

// título e exemplo
const titleOk = await page.evaluate(() => document.body.innerText.includes('HTML → Markdown'))
assert(titleOk, 'título ausente')

await page.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find((x) => x.innerText.trim() === 'Tabela + lista')
  if (b) b.click()
})
await new Promise((r) => setTimeout(r, 500))
const hasTable = await page.evaluate(() => {
  const els = [...document.querySelectorAll('pre code')]
  const last = els[els.length - 1]
  return last ? last.textContent.includes('| --- | --- | --- |') : false
})
assert(hasTable, 'tabela não gerada')

// confere home continua ok depois das visitas
logs.length = 0
await page.goto(base + '/', { waitUntil: 'networkidle0', timeout: 60000 })
await new Promise((r) => setTimeout(r, 1000))
assert(logs.length === 0, 'home pós-rota erro: ' + logs.join(' | '))

await browser.close()
console.log(ok ? 'PRODUÇÃO OK — home e rota nova sem erros' : 'FALHAS:\n' + fails.join('\n'))
if (!ok) process.exit(1)