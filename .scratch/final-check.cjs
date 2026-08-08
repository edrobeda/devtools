const puppeteer = require('puppeteer')
const ROUTES = [
  '/', '/tools/float-explorer', '/devops/ansi-colors', '/frontend/cubic-bezier-editor',
  '/references/markdown-syntax', '/devops/kubectl-commands', '/data/json-schema-validator',
  '/network/common-ports', '/devops/dockerfile-generator', '/frontend/svg-placeholder-generator',
  '/references/ascii-table',
]
;(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] })
  const page = await browser.newPage()
  let bad = 0
  for (const route of ROUTES) {
    const errors = []
    const errs = []
    page.on('pageerror', (e) => errors.push(e.message))
    page.on('console', (m) => { if (m.type() === 'error' && !m.text().includes('favicon')) errs.push(m.text()) })
    await page.goto('https://devtools.eventifylab.com' + route, { waitUntil: 'networkidle2', timeout: 60000 })
    await new Promise((r) => setTimeout(r, 700))
    if (errors.length || errs.length) {
      bad++
      console.log('FAIL', route, 'pageerrors:', errors, 'console:', errs)
    } else {
      console.log('OK  ', route)
    }
  }
  await browser.close()
  console.log(bad ? `\n${bad} FAILING` : '\nALL ROUTES CLEAN')
  process.exit(bad ? 1 : 0)
})().catch((e) => { console.error('FATAL', e.message); process.exit(1) })
