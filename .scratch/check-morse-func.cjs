const puppeteer = require('puppeteer')

const BASE = 'https://devtools.eventifylab.com/tools/morse-code-converter'
const HELLO = '.... . .-.. .-.. --- / .-- --- .-. .-.. -..'

;(async () => {
  const browser = await puppeteer.launch({
    headless: 'shell',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--autoplay-policy=no-user-gesture-required'],
  })
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', (err) => errors.push(`PAGEERROR: ${err.message}`))
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(`CONSOLE: ${msg.text()}`) })

  await page.goto(BASE, { waitUntil: 'networkidle2', timeout: 60000 })
  await new Promise((r) => setTimeout(r, 1000))

  // ENCODE: type SOS in encode pane textarea
  const encTa = await page.$('#rc-tabs-0-panel-encode textarea')
  await encTa.click()
  await encTa.type('SOS')
  await new Promise((r) => setTimeout(r, 400))
  const encoded = await page.$eval('#rc-tabs-0-panel-encode pre', (p) => p.innerText)
  console.log('encode SOS ->', JSON.stringify(encoded))
  const encodeOk = encoded === '... --- ...'

  // DECODE: activate tab, click the HELLO example
  const tabs = await page.$$('.ant-tabs-tab')
  await tabs[1].click()
  await new Promise((r) => setTimeout(r, 400))
  const idx = await page.evaluate((ex) => {
    const tags = Array.from(document.querySelectorAll('#rc-tabs-0-panel-decode .ant-tag'))
    return tags.findIndex((t) => t.innerText === ex)
  }, HELLO)
  const tags = await page.$$('#rc-tabs-0-panel-decode .ant-tag')
  await tags[idx].click()
  await new Promise((r) => setTimeout(r, 400))
  const decoded = await page.$eval('#rc-tabs-0-panel-decode .ant-typography strong', (s) => s.innerText)
  console.log('decode HELLO ->', JSON.stringify(decoded))
  const decodeOk = decoded === 'HELLO WORLD'

  // PLAYBACK on decode output: click Play, let run, expect lamp/play state, then stopped
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find((b) => /Ouvir|Play/.test(b.innerText.trim()))
    btn.click()
  })
  await new Promise((r) => setTimeout(r, 2000))
  const noise = errors.length
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find((b) => /Parar|Stop/.test(b.innerText.trim()))
    if (btn) btn.click()
  })
  console.log('errors during playback+stop:', noise)

  const stats = await page.evaluate(() => {
    const pane = document.querySelector('#rc-tabs-0-panel-decode')
    return { tags: Array.from(pane.querySelectorAll('.ant-tag')).map((x) => x.innerText).slice(0, 8) }
  })
  console.log('decode stats tags:', JSON.stringify(stats.tags))

  await browser.close()
  const ok = encodeOk && decodeOk && errors.length === 0
  console.log(ok ? 'FUNCTIONAL PASS' : 'FUNCTIONAL FAIL')
  process.exit(ok ? 0 : 1)
})()