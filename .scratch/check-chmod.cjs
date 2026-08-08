const puppeteer = require('/tmp/pup/node_modules/puppeteer')

async function checkPage(url, label) {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] })
  const page = await browser.newPage()
  const errors = []
  const bad404s = []
  page.on('response', (r) => { if (r.status() === 404 && !r.url().includes('favicon.ico')) bad404s.push(r.url()) })
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()) })
  await page.goto(url, { waitUntil: 'networkidle0' })
  await new Promise((r) => setTimeout(r, 1500))
  const filtered = errors.filter((e) => !e.includes('Failed to load resource') || bad404s.length > 0)
  console.log(label, url, 'errors=', JSON.stringify(filtered), 'bad404=', JSON.stringify(bad404s))
  await browser.close()
  return filtered.concat(bad404s)
}

;(async () => {
  let anyError = false
  anyError |= (await checkPage('https://devtools.eventifylab.com/', 'home')).length > 0
  anyError |= (await checkPage('https://devtools.eventifylab.com/devops/chmod-calculator', 'chmod')).length > 0

  // Functional check: default 755 should render rwxr-xr-x; toggling bits works
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] })
  const page = await browser.newPage()
  await page.goto('https://devtools.eventifylab.com/devops/chmod-calculator', { waitUntil: 'networkidle0' })
  await new Promise((r) => setTimeout(r, 1000))
  const body = await page.evaluate(() => document.body.innerText)
  const hasTitle = body.includes('Calculadora de Permissões')
  const hasRwx = body.includes('rwxr-xr-x')
  const hasCmd = body.includes('chmod 755')
  console.log('title:', hasTitle, '| rwxr-xr-x:', hasRwx, '| chmod 755 cmd:', hasCmd)

  // toggle setuid special bit -> expect 4755 and rws
  const r = await page.evaluate(() => {
    const checkboxes = Array.from(document.querySelectorAll('input[type="checkbox"]'))
    // last 3 are the special bits (suid/sgid/sticky); first is suid
    const suid = checkboxes[checkboxes.length - 3]
    suid.click()
    return null
  })
  await new Promise((r) => setTimeout(r, 400))
  const body2 = await page.evaluate(() => document.body.innerText)
  const hasSuid = body2.includes('4755')
  const hasRws = body2.includes('rwsr-xr-x')
  console.log('after suid -> 4755:', hasSuid, '| rws:', hasRws)

  await browser.close()
  if (anyError || !hasTitle || !hasRwx || !hasCmd) { console.log('FAIL'); process.exit(1) }
  console.log('OK')
  process.exit(0)
})()
