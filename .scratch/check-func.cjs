const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !m.text().includes('favicon')) errs.push('console: ' + m.text()); });
  await page.goto('https://devtools.eventifylab.com/frontend/css-filter-generator', { waitUntil: 'networkidle2', timeout: 60000 });

  // initial output should be filter: none;
  let css = await page.evaluate(() => document.querySelector('pre') ? document.querySelector('pre').innerText.trim() : '(none)');
  console.log('initial output:', css);

  // click "Noir (P&B)" preset button
  const buttons = await page.evaluate(() => Array.from(document.querySelectorAll('button')).map((b) => b.innerText.trim()));
  console.log('buttons:', buttons.join(' | '));
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const b = btns.find((x) => x.innerText.includes('Noir'));
    if (b) b.click();
  });
  await new Promise((r) => setTimeout(r, 800));
  css = await page.evaluate(() => document.querySelector('pre').innerText.trim());
  console.log('after Noir preset:', css);

  // toggle drop-shadow switch (first antd switch)
  await page.evaluate(() => { const sw = document.querySelector('.ant-switch'); if (sw) sw.click(); });
  await new Promise((r) => setTimeout(r, 800));
  css = await page.evaluate(() => document.querySelector('pre').innerText.trim());
  console.log('after drop-shadow on:', css);

  // reset
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const b = btns.find((x) => x.innerText.includes('Restaurar') || x.innerText.includes('Reset'));
    if (b) b.click();
  });
  await new Promise((r) => setTimeout(r, 800));
  css = await page.evaluate(() => document.querySelector('pre').innerText.trim());
  console.log('after reset:', css);

  console.log('errors:', errs.length ? errs : 'none');
  await browser.close();
  if (errs.length) process.exit(1);
  console.log('FUNC OK');
})();
