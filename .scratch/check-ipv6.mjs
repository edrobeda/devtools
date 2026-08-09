import puppeteer from 'puppeteer'

const base = 'https://devtools.eventifylab.com'
const pages = [base + '/', base + '/network/ipv6-explorer']

const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] })

let failed = false
for (const url of pages) {
  console.log('--- checking', url)
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', (err) => errors.push('pageerror: ' + err.message))
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push('console.error: ' + msg.text())
  })
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 })
  await new Promise((r) => setTimeout(r, 1500))

  const title = await page.title().catch(() => '(no title)')
  const bodyText = await page.evaluate(() => (document.body ? document.body.innerText.slice(0, 400) : ''))
  console.log('title:', title)
  console.log('body (first 400):', bodyText.replace(/\n+/g, ' | ').slice(0, 400))

  if (url.includes('ipv6-explorer')) {
    // interaction: type a NAT64 address and confirm the result updates
    const input = await page.$('input[value="2001:db8:85a3::8a2e:370:7334/64"]')
    if (input) {
      await page.evaluate((el) => {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
        setter.call(el, '64:ff9b::7f00:1')
        el.dispatchEvent(new Event('input', { bubbles: true }))
      }, input)
      await new Promise((r) => setTimeout(r, 800))
      const text = await page.evaluate(() => document.body.innerText)
      console.log('after typing NAT64, contains 64:ff9b::7f00:1:', text.includes('64:ff9b::7f00:1'))
      console.log('after typing NAT64, type shown:', /NAT64/.test(text))
      // error tag should be absent
      console.log('no error banner:', !/Invalid address|Endereço inválido/.test(text))
    } else {
      errors.push('input not found')
    }
  }

  if (errors.length) {
    failed = true
    console.log('ERRORS:')
    errors.forEach((e) => console.log('  ' + e))
  } else {
    console.log('no pageerror / console errors')
  }
  await page.close()
}

await browser.close()
if (failed) process.exit(1)
console.log('ALL OK')