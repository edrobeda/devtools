const puppeteer = require('/tmp/pup/node_modules/puppeteer')

async function checkPage(url, label) {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] })
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()) })
  await page.goto(url, { waitUntil: 'networkidle0' })
  await new Promise((r) => setTimeout(r, 1500))
  console.log(label, url, 'errors=', JSON.stringify(errors))
  await browser.close()
  return errors
}

;(async () => {
  let anyError = false
  anyError |= (await checkPage('https://devtools.eventifylab.com/', 'home')).length > 0
  anyError |= (await checkPage('https://devtools.eventifylab.com/data/json-schema-generator', 'json-schema-gen')).length > 0
  anyError |= (await checkPage('https://devtools.eventifylab.com/data/json-diff', 'json-diff')).length > 0

  // Functional check: default sample should produce a schema with "properties"
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] })
  const page = await browser.newPage()
  await page.goto('https://devtools.eventifylab.com/data/json-schema-generator', { waitUntil: 'networkidle0' })
  await new Promise((r) => setTimeout(r, 1000))
  const body = await page.evaluate(() => document.body.innerText)
  const hasTitle = body.includes('Gerador de JSON Schema')
  const hasProp = body.includes('"properties"')
  const hasRequired = body.includes('"required"')
  console.log('title shown:', hasTitle, '| properties:', hasProp, '| required:', hasRequired)

  await browser.close()
  if (anyError) process.exit(1)
  console.log('OK')
  process.exit(0)
})()