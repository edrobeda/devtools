import { readFileSync } from 'fs'
import puppeteer from 'puppeteer'

const util = readFileSync('/home/devtools-bot/devtools/src/utils/htmlFormatter.js', 'utf8')
  .replace(/export function /g, 'function ')
  .replace(/^\/\/.*$/gm, '')

const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'] })
const page = await browser.newPage()
await page.setContent('<div id="out"></div>')
await page.evaluate(`(() => {
  window.__f = (function(){ let m={}; let exp={exports:m}; const module=exp, exports=m;
    ${util}
    return formatHtml;
  })();
})()`)

const tests = [
  { name: 'messy-fragment', opts: { minify: false, indent: 2, removeComments: true },
    input: '<div   class="hero"><h1>Olá,  mundo!  </h1><p>Bem-vindo   ao nosso <strong>site</strong> . </p><ul><li>Item 1</li>  <li>Item   2</li><li><a href="#">Item 3</a></li></ul></div>',
    expect: '<div class="hero">\n  <h1>Olá, mundo!</h1>\n  <p>Bem-vindo ao nosso <strong>site</strong> .</p>\n  <ul>\n    <li>Item 1</li>\n    <li>Item 2</li>\n    <li><a href="#">Item 3</a></li>\n  </ul>\n</div>' },
  { name: 'full-doc', opts: { minify: false, indent: 2, removeComments: true },
    input: '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Minha página</title><style>body { margin: 0; }</style></head><body><header><h1>Título</h1><nav><ul><li><a href="/">Home</a></li><li><a href="/sobre">Sobre</a></li></ul></nav></header><main><table><tr><th>Nome</th><th>Idade</th></tr><tr><td>Ana</td><td>30</td></tr></table></main></body></html>',
    expect: `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Minha página</title>
    <style>body { margin: 0; }</style>
  </head>
  <body>
    <header>
      <h1>Título</h1>
      <nav>
        <ul>
          <li><a href="/">Home</a></li>
          <li><a href="/sobre">Sobre</a></li>
        </ul>
      </nav>
    </header>
    <main>
      <table>
        <tbody>
          <tr>
            <th>Nome</th>
            <th>Idade</th>
          </tr>
          <tr>
            <td>Ana</td>
            <td>30</td>
          </tr>
        </tbody>
      </table>
    </main>
  </body>
</html>` },
  { name: 'minify', opts: { minify: true, indent: 2, removeComments: true },
    input: '<div>\n  <ul>\n    <li>a</li>\n    <li>b</li>\n  </ul>\n  <p>x <b>y</b> z</p>\n</div>',
    expect: '<div><ul><li>a</li><li>b</li></ul><p>x <b>y</b> z</p></div>' },
  { name: 'bool-attrs', opts: { minify: false, indent: 2, removeComments: true },
    input: '<input type="checkbox" checked="checked" disabled=""><input type="text" disabled="disabled">',
    expect: '<input type="checkbox" checked disabled><input type="text" disabled>' },
  { name: 'preserve-pre', opts: { minify: false, indent: 2, removeComments: true },
    input: '<pre>  linha um\n    linha dois\n  </pre><code>a   b</code>',
    expect: '<pre>  linha um\n    linha dois\n  </pre>\n<code>a b</code>' },
  { name: 'comment-line', opts: { minify: false, indent: 2, removeComments: true },
    input: '<div>a</div><!-- c --><div>b</div>',
    expect: '<div>a</div>\n<!-- c -->\n<div>b</div>' },
  { name: 'head-hoist', opts: { minify: false, indent: 2, removeComments: true },
    input: '<style>.a{}</style><div>oi</div>',
    expect: '<style>.a{}</style>\n<div>oi</div>' },
  { name: 'minify-keep-comments', opts: { minify: true, indent: 2, removeComments: false },
    input: '<p>a<!-- c -->b</p>',
    expect: '<p>a<!-- c -->b</p>' },
  { name: 'minify-drop-comments', opts: { minify: true, indent: 2, removeComments: true },
    input: '<p>a<!-- c -->b</p>',
    expect: '<p>ab</p>' },
  { name: 'indent-4', opts: { minify: false, indent: 4, removeComments: true },
    input: '<div><ul><li>x</li></ul></div>',
    expect: '<div>\n    <ul>\n        <li>x</li>\n    </ul>\n</div>' },
]

let allOk = true
for (const tt of tests) {
  const res = await page.evaluate(([inp, opts]) => {
    const r = window.__f(inp, opts)
    return r.text
  }, [tt.input, tt.opts])
  const ok = res === tt.expect
  if (!ok) {
    allOk = false
    console.log('FAIL', tt.name)
    console.log('  expect: ' + JSON.stringify(tt.expect))
    console.log('  got:    ' + JSON.stringify(res))
  } else {
    console.log('ok  ', tt.name)
  }
}
console.log(allOk ? 'ALL PASS' : 'SOME FAILED')
await browser.close()
process.exit(allOk ? 0 : 1)