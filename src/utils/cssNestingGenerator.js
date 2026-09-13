export const TAB = '  '

export function indent(text, prefix) {
  const pad = prefix || TAB
  return String(text || '')
    .trim()
    .split('\n')
    .map((line) => (line ? pad + line : ''))
    .join('\n')
}

export function buildRule(selector, declarations) {
  const decls = indent(declarations, TAB)
  return `${selector} {\n${decls ? decls + '\n' : ''}}`
}

// Expande o seletor de uma regra aninhada pro modo "achatado": troca cada
// `&` pelo seletor do pai; sem `&`, vira descendência implícita (`.card a`).
export function expandChildSelector(parent, selector) {
  const sel = (selector || '').trim()
  if (!sel) return ''
  if (sel.charAt(0) === '@') return sel
  const p = (parent || '').trim()
  if (!p) return ''
  return sel.includes('&')
    ? sel.split('&').join(p)
    : `${p} ${sel}`
}

// CSS nativo (aninhado): os seletores filhos ficam dentro do bloco do pai.
export function buildNestedCss(parent, parentDecls, children) {
  const parentSel = (parent || '').trim()
  if (!parentSel) return ''
  const blocks = []
  const p = (parentDecls || '').trim()
  if (p) blocks.push(indent(p, TAB))
  ;(children || []).forEach((child) => {
    const sel = (child.selector || '').trim()
    if (!sel) return
    const decls = indent(child.declarations || '', TAB.repeat(2))
    blocks.push(`${TAB}${sel} {\n${decls ? decls + '\n' : ''}${TAB}}`)
  })
  return `${parentSel} {\n${blocks.join('\n')}\n}`
}

// Equivalente "achatado" (sem aninhamento) — o que o pré-processador faria.
export function buildFlatCss(parent, parentDecls, children) {
  const parentSel = (parent || '').trim()
  if (!parentSel) return ''
  const rules = [buildRule(parentSel, parentDecls)]
  ;(children || []).forEach((child) => {
    const sel = (child.selector || '').trim()
    if (!sel) return
    if (sel.charAt(0) === '@') {
      // Regra @media aninhada: envolve o pai na media query.
      rules.push(`${sel} {\n${indent(buildRule(parentSel, child.declarations), TAB)}\n}`)
    } else {
      rules.push(buildRule(expandChildSelector(parentSel, sel), child.declarations))
    }
  })
  return rules.join('\n\n')
}

export function supportsNesting() {
  if (typeof document === 'undefined') return false
  try {
    const style = document.createElement('style')
    const sheet = style.sheet
    if (!sheet) return false
    sheet.insertRule('.nt-test { & .nt-inner { color: #f00 } }')
    return true
  } catch {
    return false
  }
}

export function buildPreviewDoc(html, css, baseCss) {
  const body = (html || '').trim() || '<p>…</p>'
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  /* base */
${baseCss || ''}
  /* gerado */
${css || ''}
</style>
</head>
<body>
${body}
</body>
</html>`
}

const rules = (arr) =>
  arr.map((r) => ({ selector: r[0], declarations: r[1] }))

export const PRESETS = [
  {
    key: 'card',
    parent: '.card',
    parentDecls: `border: 1px solid #e2e2e2;
border-radius: 12px;
background: #fff;
padding: 16px;
max-width: 320px;
font-family: sans-serif;`,
    children: rules([
      ['&__title', `font-size: 18px;
font-weight: 700;
margin-bottom: 8px;
color: #222;`],
      ['&__cover', `height: 120px;
border-radius: 8px;
margin-bottom: 12px;
background: linear-gradient(135deg, #1677ff, #69c0ff);`],
      ['&__body', `color: #666;
line-height: 1.5;`],
      ['&:hover', `box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
transform: translateY(-2px);`],
    ]),
    previewHtml: `<div class="card">
  <div class="card__cover"></div>
  <h3 class="card__title">Card heading</h3>
  <p class="card__body">This card is styled by a single nested block.</p>
</div>`,
    baseCss: `body { background: #f5f6f8; padding: 16px; display: flex; }`,
  },
  {
    key: 'btn',
    parent: '.btn',
    parentDecls: `display: inline-block;
padding: 10px 18px;
border: none;
border-radius: 10px;
background: #1677ff;
color: #fff;
font-size: 14px;
cursor: pointer;`,
    children: rules([
      ['&:hover', `background: #0958d9;`],
      ['&:focus-visible', `outline: 3px solid rgba(22, 119, 255, 0.35);
outline-offset: 2px;`],
      ['&:active', `transform: translateY(1px);`],
      ['&[data-variant="ghost"]', `background: transparent;
color: #1677ff;
border: 1px solid #1677ff;`],
      ['&[data-variant="ghost"]:hover', `background: #e6f4ff;`],
    ]),
    previewHtml: `<div style="display:flex; gap:12px;">
  <button class="btn">Primary</button>
  <button class="btn" data-variant="ghost">Ghost</button>
</div>`,
    baseCss: `body { background: #fff; padding: 16px; font-family: sans-serif; }`,
  },
  {
    key: 'nav',
    parent: '.nav',
    parentDecls: `display: flex;
gap: 4px;
padding: 0;
margin: 0;
list-style: none;
font-family: sans-serif;`,
    children: rules([
      ['& > li', `margin: 0;`],
      ['& a', `display: block;
color: #1677ff;
text-decoration: none;
padding: 6px 10px;
border-radius: 6px;`],
      ['& a:hover', `background: #e6f4ff;`],
      ['& > li.active > a', `background: #1677ff;
color: #fff;`],
    ]),
    previewHtml: `<ul class="nav">
  <li><a href="#home">Home</a></li>
  <li class="active"><a href="#docs">Docs</a></li>
  <li><a href="#about">About</a></li>
</ul>`,
    baseCss: `body { background: #fff; padding: 16px; }`,
  },
  {
    key: 'grid',
    parent: '.grid',
    parentDecls: `display: grid;
grid-template-columns: 1fr;
gap: 12px;
font-family: sans-serif;`,
    children: rules([
      ['& > div', `background: #f0f3f7;
border-radius: 8px;
padding: 18px;
text-align: center;
font-size: 15px;`],
      ['@media (min-width: 420px)', `grid-template-columns: 1fr 1fr 1fr;`],
    ]),
    previewHtml: `<div class="grid">
  <div>Item A</div>
  <div>Item B</div>
  <div>Item C</div>
</div>`,
    baseCss: `body { background: #fff; padding: 16px; }
.grid > div { color: #333; }`,
  },
]