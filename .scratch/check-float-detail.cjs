const puppeteer = require('puppeteer')

async function main() {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] })
  const page = await browser.newPage()
  const errs = []
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message))
  page.on('console', (m) => { if (m.type() === 'error' && !/404/.test(m.text())) errs.push('console: ' + m.text()) })
  await page.goto('https://devtools.eventifylab.com/tools/float-explorer', { waitUntil: 'networkidle0' })
  await new Promise((r) => setTimeout(r, 1500))
  const bodyText = await page.evaluate(() => document.body.innerText)

  const assert = (name, cond) => {
    console.log((cond ? 'PASS ' : 'FAIL ') + name)
    if (!cond) process.exitCode = 1
  }

  assert('title', /Explorador de Float/.test(bodyText))
  assert('exact 0.1 double', bodyText.includes('0.1000000000000000055511151231257827021181583404541015625'))
  assert('hex 0x3fb999999999999a', bodyText.includes('0x3fb999999999999a'))
  assert('mantissa fragment', bodyText.includes('100110011001'))
  assert('neighbors of 0.1', bodyText.includes('0.09999999999999999') && bodyText.includes('0.10000000000000002'))
  assert('classic alert', bodyText.includes('0.30000000000000004'))
  assert('float32 note', /float32/i.test(bodyText))
  assert('no js errors', errs.length === 0)

  // click an example: 2^53
  const tags = await page.$$('.ant-tag')
  for (const t of tags) {
    const txt = await page.evaluate((el) => el.textContent, t)
    if (txt && txt.includes('2^53')) { await t.click(); break }
  }
  await new Promise((r) => setTimeout(r, 600))
  const after = await page.evaluate(() => document.body.innerText)
  assert('2^53 exact', after.includes('9007199254740992'))
  console.log('errors:', JSON.stringify(errs))
  await browser.close()
}
main()