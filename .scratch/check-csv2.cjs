const puppeteer = require('puppeteer')

async function main() {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] })
  const page = await browser.newPage()
  const req404 = []
  page.on('response', (r) => { if (r.status() === 404) req404.push(r.url()) })
  await page.goto('https://devtools.eventifylab.com/', { waitUntil: 'networkidle0' })
  console.log('404s on home:', JSON.stringify(req404.map((u) => u.split('/').pop())))

  // alignment center -> sep row should have :---:
  await page.goto('https://devtools.eventifylab.com/data/csv-markdown-table', { waitUntil: 'networkidle0' })
  await new Promise((r) => setTimeout(r, 800))
  await page.evaluate(() => {
    const btns = [...document.querySelectorAll('button')]
    const t = btns.find((b) => b.innerText.includes('Sample') || b.innerText.includes('Exemplo'))
    if (t) t.click()
  })
  await new Promise((r) => setTimeout(r, 400))
  const before = await page.evaluate(() => document.querySelectorAll('pre')[0].innerText.split('\n')[1])
  // click "Center"
  await page.evaluate(() => {
    const els = [...document.querySelectorAll('.ant-segmented-item')]
    const t = els.find((e) => (e.innerText || '').trim() === 'Center' || (e.innerText || '').trim() === 'Centro')
    if (t) t.click()
  })
  await new Promise((r) => setTimeout(r, 400))
  const after = await page.evaluate(() => document.querySelectorAll('pre')[0].innerText.split('\n')[1])
  console.log('sep default :', JSON.stringify(before.split('|')))
  console.log('sep centered:', JSON.stringify(after.split('|')))
  await browser.close()
}

main().catch((e) => { console.error(e); process.exit(1) })