import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import puppeteer from 'puppeteer'

const DIST = '/home/devtools-bot/devtools/dist'

const MIME = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
}

const server = createServer(async (req, res) => {
  try {
    let urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname)
    let file = join(DIST, normalize(urlPath))
    let body
    try {
      const st = await stat(file)
      if (st.isFile()) body = await readFile(file)
      else throw new Error('dir')
    } catch {
      body = await readFile(join(DIST, 'index.html'))
    }
    res.writeHead(200, { 'content-type': MIME[extname(file)] || 'text/html' })
    res.end(body)
  } catch (e) {
    res.writeHead(500)
    res.end(String(e))
  }
})

function normalizePath(p) {
  return p === '/' ? '/index.html' : p
}

await new Promise((r) => server.listen(0, '127.0.0.1', r))
const port = server.address().port
const base = `http://127.0.0.1:${port}`

const browser = await puppeteer.launch({
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
})
const page = await browser.newPage()

const errors = []
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message))
page.on('console', (m) => {
  if (m.type() === 'error') errors.push('CONSOLE: ' + m.text())
})

let ok = true
const fails = []
function assert(cond, msg) {
  if (!cond) {
    fails.push(msg)
    ok = false
  }
}

async function go(path) {
  await page.goto(base + path, { waitUntil: 'networkidle0', timeout: 60000 })
  // espera o AppLayout montar a página
  await new Promise((r) => setTimeout(r, 800))
}

async function clickByText(text) {
  await page.evaluate((txt) => {
    const btn = [...document.querySelectorAll('button')].find((x) => x.innerText.trim() === txt)
    if (btn) btn.click()
  }, text)
  await new Promise((r) => setTimeout(r, 400))
}

// 1) home deve carregar limpa
await go('/')
assert(errors.length === 0, 'home tem erros: ' + errors.join(' | '))

// 2) rota nova deve carregar limpa
errors.length = 0
await go('/tools/html-to-markdown')
assert(errors.length === 0, 'rota nova tem erros de console: ' + errors.join(' | '))

// 3) título presente
const title = await page.evaluate(() => document.body.innerText.includes('HTML → Markdown'))
assert(title, 'título da página não encontrado')

// 4) clica no exemplo de artigo e confere o markdown gerado
await clickByText('Artigo completo')
const output = await page.evaluate(() => {
  const els = [...document.querySelectorAll('pre code')]
  const last = els[els.length - 1]
  return last ? last.textContent : ''
})
console.log('---- OUTPUT (artigo) ----')
console.log(output)
assert(output.includes('# Guia rápido de deploy'), 'artigo: falta h1 com #')
assert(output.includes('**negrito**'), 'artigo: falta negrito')
assert(output.includes('[link clicável](https://example.com/post'), 'artigo: falta link')
assert(output.includes('![job de deploy concluído](/img/deploy.png)'), 'artigo: falta imagem')
assert(output.includes('3. Rodar o'), 'artigo: ol start=3 não preservado')
assert(output.includes('4. Reiniciar o'), 'artigo: ol itens errados')

// 5) exemplo de tabela + lista
await clickByText('Tabela + lista')
const out2 = await page.evaluate(() => {
  const els = [...document.querySelectorAll('pre code')]
  const last = els[els.length - 1]
  return last ? last.textContent : ''
})
console.log('--- OUTPUT (tabela) ---')
console.log('JSON:', JSON.stringify(out2))
console.log(out2)
assert(out2.includes('| Rodada | Item | Problema |'), 'tabela: cabeçalho')
assert(out2.includes('| --- | --- | --- |'), 'tabela: separator ---')
assert(out2.includes('| R1 | JWT decoder | nenhum |'), 'tabela: linha de dados')
assert(out2.includes('- rodar checagem'), 'lista: item simples')
assert(out2.includes('  - revisor 1'), 'lista: subitem aninhado')

// 6) citação + código
await clickByText('Citação + código')
const out3 = await page.evaluate(() => {
  const els = [...document.querySelectorAll('pre code')]
  const last = els[els.length - 1]
  return last ? last.textContent : ''
})
console.log('--- OUTPUT (citação) ---')
console.log(out3)
assert(out3.includes('> Deploy só na sexta'), 'citação: falta > prefixo')
assert(out3.includes('> *Regra de ouro*'), 'citação: ênfase dentro do >')
assert(out3.includes('```\nnpm install && npm test'), 'código: fence')

// 7) toggle PT/EN e título muda
await page.evaluate(() => {
  const seg = [...document.querySelectorAll('.ant-segmented-item')]
  const en = seg.find((s) => s.textContent.trim() === 'EN')
  if (en) en.click()
})
await new Promise((r) => setTimeout(r, 400))
const enTitle = await page.evaluate(() => document.body.innerText.includes('HTML → Markdown Converter'))
assert(enTitle, 'título EN não aparece após toggle')

if (errors.length) {
  console.log('ERROS de console na rota nova:', errors.join('\n'))
}

await browser.close()
server.close()

console.log('\n=== RESULTADO ===')
if (ok) console.log('TODOS OS CHECKS PASSARAM')
else {
  console.log('FALHAS:')
  fails.forEach((f) => console.log(' - ' + f))
  process.exit(1)
}