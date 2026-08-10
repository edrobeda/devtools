const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  page.on('pageerror', (e) => console.log('pageerror:', e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !m.text().includes('404')) console.log('console:', m.text()) });
  await page.goto('https://devtools.eventifylab.com/frontend/scrollbar-generator', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 600));

  const rail = await page.evaluate(() => {
    const el = document.querySelector('.ant-slider-rail');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height, cx: r.x + r.width / 2, cy: r.y + r.height / 2 };
  });
  console.log('rail rect:', JSON.stringify(rail));

  await page.mouse.click(rail.cx, rail.cy);
  await new Promise((r) => setTimeout(r, 300));
  const out = await page.evaluate(() => Array.from(document.querySelectorAll('pre')).map((p) => p.innerText)[0] || '');
  console.log('width line after rail click at 50%:', out.split('\n').find((l) => l.includes('width: ')));

  await browser.close();
})();