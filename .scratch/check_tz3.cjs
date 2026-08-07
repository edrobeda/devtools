const puppeteer = require('puppeteer')
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

;(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] })
  const page = await browser.newPage()
  await page.goto('https://devtools.eventifylab.com/tools/timezone-converter', { waitUntil: 'networkidle0', timeout: 60000 })
  await sleep(2000)

  const bodyText = await page.evaluate(() => document.body.innerText)
  const checks = [
    ['title', bodyText.includes('Conversor de Fuso Horário') || bodyText.includes('Timezone Converter')],
    ['has UTC row', /UTC/.test(bodyText)],
    ['has Tokyo row', /Tóquio|Tokyo/.test(bodyText)],
    ['has offset tag', /UTC[+-]\d{2}:\d{2}/.test(bodyText)],
    ['has HH:MM:SS time', /\d{2}:\d{2}:\d{2}/.test(bodyText)],
    ['has source zone select', bodyText.includes('São Paulo')],
    ['has Agora/Now button', bodyText.includes('Agora') || bodyText.includes('Now')],
    ['has note alert', /horário de parede|wall time/.test(bodyText)],
  ]
  let ok = true
  for (const [name, pass] of checks) {
    console.log((pass ? 'PASS' : 'FAIL') + '  ' + name)
    if (!pass) ok = false
  }
  console.log('\nSnippet lines (5):')
  const snippet = await page.evaluate(() => {
    const pre = document.querySelector('pre')
    return pre ? pre.innerText.split('\n').slice(0, 5).join(' | ') : 'NO PRE'
  })
  console.log(snippet)
  process.exit(ok ? 0 : 1)
})()