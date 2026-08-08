const puppeteer = require('puppeteer')

;(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] })
  const page = await browser.newPage()
  const errs = []
  const notFounds = []
  page.on('pageerror', (e) => errs.push(`PAGEERROR: ${e.message}`))
  page.on('console', (m) => { if (m.type() === 'error' && !m.text().includes('favicon')) errs.push(`CONSOLE.ERROR: ${m.text()}`) })
  page.on('response', (r) => { if (r.status() === 404) notFounds.push(r.url()) })

  const dockerfileText = async () => {
    return await page.evaluate(() => {
      const pres = [...document.querySelectorAll('pre code')]
      return pres.map((c) => c.textContent).find((x) => x.includes('FROM')) || ''
    })
  }

  // home carrega sem erros
  await page.goto('https://devtools.eventifylab.com/', { waitUntil: 'networkidle0', timeout: 45000 })
  await new Promise((r) => setTimeout(r, 1200))
  const homeHasGrid = await page.evaluate(() => document.querySelectorAll('.ant-menu-item, a').length > 0)
  console.log('home loads:', homeHasGrid ? 'OK' : 'FAIL')

  // página nova
  await page.goto('https://devtools.eventifylab.com/devops/dockerfile-generator', { waitUntil: 'networkidle0', timeout: 45000 })
  await new Promise((r) => setTimeout(r, 1200))

  // 1) output padrão (stack node): FROM + CMD exec JSON + RUN + COPY + ENV + EXPOSE
  let txt = await dockerfileText()
  const checks = [
    ['FROM node', txt.includes('FROM node:22-alpine')],
    ['WORKDIR', txt.includes('WORKDIR /app')],
    ['ENV', txt.includes('ENV NODE_ENV=production')],
    ['COPY', txt.includes('COPY package.json ./') && txt.includes('COPY . .')],
    ['RUN', txt.includes('RUN npm ci --omit=dev')],
    ['EXPOSE', txt.includes('EXPOSE 3000')],
    ['CMD exec json', txt.includes('CMD ["npm","start"]')],
  ]
  for (const [name, ok] of checks) console.log(`node default: ${name}:`, ok ? 'OK' : 'FAIL')
  const pre = txt.split('\n').length
  console.log('lines count:', pre, pre >= 10 ? 'OK' : 'FAIL')

  // 2) clica no stack Python
  await page.evaluate(() => {
    const seg = [...document.querySelectorAll('.ant-segmented-item')].find((x) => /Python/.test(x.textContent))
    seg.click()
  })
  await new Promise((r) => setTimeout(r, 500))
  txt = await dockerfileText()
  console.log('python stack:', txt.includes('FROM python:3.12-slim') && txt.includes('RUN pip install --no-cache-dir -r requirements.txt') ? 'OK' : 'FAIL')

  // 3) CMD vai pra shell form (segmented do CMD = o último da página)
  await page.evaluate(() => {
    const sels = document.querySelectorAll('.ant-segmented')
    const cmdSeg = sels[sels.length - 1]
    const shell = [...cmdSeg.querySelectorAll('.ant-segmented-item')].find((x) => x.textContent.trim() === 'shell')
    if (shell) shell.click()
  })
  await new Promise((r) => setTimeout(r, 400))
  txt = await dockerfileText()
  console.log('cmd shell mode:', /CMD\s+gunicorn/s.test(txt) && !/CMD \[/.test(txt) ? 'OK' : 'FAIL')

  // volta exec + preenche CMD manual pra validar exec presence
  await page.evaluate(() => {
    const sels = document.querySelectorAll('.ant-segmented')
    const cmdSeg = sels[sels.length - 1]
    const execItem = [...cmdSeg.querySelectorAll('.ant-segmented-item')].find((x) => x.textContent.trim() === 'exec')
    if (execItem) execItem.click()
  })
  await new Promise((r) => setTimeout(r, 300))
  await page.evaluate(() => {
    const inputs = [...document.querySelectorAll('.ant-input')]
    const target = inputs[inputs.length - 1] // CMD input após clicar exec
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
    if (target) { setter.call(target, 'gunicorn app:app -b 0.0.0.0:8080'); target.dispatchEvent(new Event('input', { bubbles: true })) }
  })
  await new Promise((r) => setTimeout(r, 400))
  txt = await dockerfileText()
  console.log('cmd exec after edit:', txt.includes('CMD ["gunicorn","app:app","-b","0.0.0.0:8080"]') ? 'OK' : 'FAIL')

  // 4) avisos: EXPOSE inteiro inválido gera alert warning
  await page.evaluate(() => {
    const inputs = [...document.querySelectorAll('.ant-input')]
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
    const port = inputs.find((x) => x.placeholder.includes('3000'))
    if (port) { setter.call(port, '80 abc'); port.dispatchEvent(new Event('input', { bubbles: true })) }
  })
  await new Promise((r) => setTimeout(r, 400))
  const hasWarning = await page.evaluate(() => /Avisos|Warnings/.test(document.body.textContent))
  console.log('port warning alert:', hasWarning ? 'OK' : 'FAIL')

  // 5) toggle EN
  await page.evaluate(() => {
    const seg = [...document.querySelectorAll('.ant-segmented-item')].find((x) => x.textContent.trim() === 'EN')
    seg.click()
  })
  await new Promise((r) => setTimeout(r, 400))
  const h2 = await page.$eval('h2', (el) => el.textContent)
  console.log('EN title:', h2.includes('Dockerfile Generator') ? 'OK' : 'FAIL (' + h2 + ')')

  console.log('page errors:', errs.length ? JSON.stringify(errs) : 'none')
  console.log('404s:', notFounds.length ? JSON.stringify(notFounds) : 'none')
  await browser.close()
})()