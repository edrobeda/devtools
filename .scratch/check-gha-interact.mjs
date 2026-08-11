import puppeteer from 'puppeteer'

const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] })
const page = await browser.newPage()
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
await page.goto('https://devtools.eventifylab.com/references/github-actions-cheatsheet', { waitUntil: 'networkidle2' })
await new Promise((r) => setTimeout(r, 1000))

// search filter
await page.evaluate(async () => {
  const input = document.querySelector('input[placeholder]')
  const setVal = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
  setVal.call(input, 'checkout')
  input.dispatchEvent(new Event('input', { bubbles: true }))
  await new Promise((r) => setTimeout(r, 400))
})
const afterSearch = await page.evaluate(() => document.querySelectorAll('.ant-list-item').length)

// clear + category filter on 'steps'
await page.evaluate(async () => {
  const input = document.querySelector('input[placeholder]')
  const setVal = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
  setVal.call(input, '')
  input.dispatchEvent(new Event('input', { bubbles: true }))
  await new Promise((r) => setTimeout(r, 300))
  const radios = [...document.querySelectorAll('.ant-radio-button-wrapper')]
  const steps = radios.find((b) => b.textContent.includes('Steps'))
  steps.click()
  await new Promise((r) => setTimeout(r, 400))
})
const afterCat = await page.evaluate(() => document.querySelectorAll('.ant-list-item').length)

// toggle language to EN and check heading still renders
await page.evaluate(() => {
  const seg = [...document.querySelectorAll('.ant-segmented-item')].find((b) => b.textContent.trim() === 'EN')
  seg.click()
  return new Promise((r) => setTimeout(r, 400))
})
const enHeading = await page.evaluate(() => document.querySelector('h2')?.textContent.trim())

console.log(JSON.stringify({ afterSearch, afterCat, enHeading, errors }))
await browser.close()