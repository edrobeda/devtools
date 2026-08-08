const puppeteer = require('puppeteer')

const URL = 'https://devtools.eventifylab.com'

async function check(path) {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] })
  try {
    const page = await browser.newPage()
    const errors = []
    page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(`console.error: ${m.text()}`)
    })
    await page.goto(URL + path, { waitUntil: 'networkidle0', timeout: 60000 })
    await new Promise((r) => setTimeout(r, 1500))
    const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 400))
    console.log(`--- ${path} ---`)
    console.log('errors:', errors.length ? errors.join('\n') : 'NONE')
    console.log('body preview:', bodyText.replace(/\n+/g, ' | ').slice(0, 220))
    return errors
  } finally {
    await browser.close()
  }
}

async function main() {
  const allErrors = []
  allErrors.push(...await check('/devops/kubectl-commands'))
  allErrors.push(...await check('/'))
  if (allErrors.length) {
    console.log('\nFAIL: JS errors found.')
    process.exit(1)
  }
  console.log('\nOK: no page errors on new page and home.')
}

main().catch((e) => { console.error('runner error', e); process.exit(1) })