const puppeteer = require('puppeteer')
const SAMPLE = `<!-- card -->
<div class="grid">
  <article class="card" id="c1" data-test="x">
    <img src="/img/a.png" alt="miniatura" />
    <input type="text" maxlength="20" disabled>
    <p style="color: #333; font-size: 14px; line-height: 1.5;">Olá, <strong>mundo</strong>!</p>
    <a href="a.html" data-x="1 & 2">link</a>
  </article>
</div>
<p>Segunda raiz!</p>`
;(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] })
  const page = await browser.newPage()
  await page.goto('https://devtools.eventifylab.com/tools/html-to-jsx-converter', { waitUntil: 'networkidle0', timeout: 60000 })
  await page.evaluate((val) => {
    const ta = document.querySelector('textarea')
    const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set
    setter.call(ta, val)
    ta.dispatchEvent(new Event('input', { bubbles: true }))
  }, SAMPLE)
  await new Promise((r) => setTimeout(r, 1500))
  const out = await page.evaluate(() => {
    const codes = document.querySelectorAll('pre code')
    return codes[0].textContent
  })
  console.log(out)
  await browser.close()
})()
