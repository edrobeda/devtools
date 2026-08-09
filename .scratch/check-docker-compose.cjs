const puppeteer = require('puppeteer')

;(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] })
  const page = await browser.newPage()
  const errs = []
  const notFounds = []
  page.on('pageerror', (e) => errs.push(`PAGEERROR: ${e.message}`))
  page.on('console', (m) => { if (m.type() === 'error' && !m.text().includes('favicon')) errs.push(`CONSOLE.ERROR: ${m.text()}`) })
  page.on('response', (r) => { if (r.status() === 404) notFounds.push(r.url()) })

  const yamlText = async () => {
    return await page.evaluate(() => {
      const pres = [...document.querySelectorAll('pre code')]
      return pres.map((c) => c.textContent).find((x) => x.includes('services:')) || ''
    })
  }

  // home carrega sem erros
  await page.goto('https://devtools.eventifylab.com/', { waitUntil: 'networkidle0', timeout: 45000 })
  await new Promise((r) => setTimeout(r, 1200))
  const homeHasGrid = await page.evaluate(() => document.querySelectorAll('a').length > 0)
  console.log('home loads:', homeHasGrid ? 'OK' : 'FAIL')

  // página nova
  await page.goto('https://devtools.eventifylab.com/devops/docker-compose-generator', { waitUntil: 'networkidle0', timeout: 45000 })
  await new Promise((r) => setTimeout(r, 1200))

  // 1) output padrão (preset Node API + Postgres) ✓
  let txt = await yamlText()
  const checks = [
    ['services:', txt.includes('services:')],
    ['api service', txt.includes('api:')],
    ['db service', txt.includes('db:')],
    ['build context', txt.includes('build:') && txt.includes('context: ./api')],
    ['image postgres', txt.includes('image: "postgres:16-alpine"') || txt.includes('image: postgres:16-alpine')],
    ['port mapping', txt.includes('"3000:3000"')],
    ['env NODE_ENV', txt.includes('NODE_ENV: production')],
    ['depends_on', txt.includes('depends_on:') && txt.includes('- db')],
    ['networks', txt.includes('networks:') && txt.includes('- appnet')],
    ['named volume', txt.includes('volumes:') && txt.includes('pgdata:')],
  ]
  for (const [name, ok] of checks) console.log(`default: ${name}:`, ok ? 'OK' : 'FAIL')
  console.log('has image fallback placeholder:', txt.includes('<imagem>') ? 'FAIL (fallback in output)' : 'OK')

  // 2) clica preset full-stack
  await page.evaluate(() => {
    const seg = [...document.querySelectorAll('.ant-segmented-item')].find((x) => /Full-stack|web \+ api \+ db/.test(x.textContent))
    if (seg) seg.click()
  })
  await new Promise((r) => setTimeout(r, 600))
  txt = await yamlText()
  console.log('fullstack preset(3 services):', txt.includes('web:') && txt.includes('api:') && txt.includes('db:') ? 'OK' : 'FAIL')

  // 3) adiciona serviço novo e checa que aparece um card a mais
  const before = await page.evaluate(() => [...document.querySelectorAll('.ant-card')].length)
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find((b) => /Adicionar serviço|Add service/.test(b.textContent))
    if (btn) btn.click()
  })
  await new Promise((r) => setTimeout(r, 500))
  const after = await page.evaluate(() => [...document.querySelectorAll('.ant-card')].length)
  console.log('add service adds a card:', after > before ? 'OK' : 'FAIL')

  // 4) toggle EN
  await page.evaluate(() => {
    const seg = [...document.querySelectorAll('.ant-segmented-item')].find((x) => x.textContent.trim() === 'EN')
    if (seg) seg.click()
  })
  await new Promise((r) => setTimeout(r, 500))
  const h2 = await page.$eval('h2', (el) => el.textContent)
  console.log('EN title:', h2.includes('docker-compose.yml Generator') ? 'OK' : 'FAIL (' + h2 + ')')

  console.log('page errors:', errs.length ? JSON.stringify(errs) : 'none')
  console.log('404s:', notFounds.length ? JSON.stringify(notFounds) : 'none')
  await browser.close()
})()