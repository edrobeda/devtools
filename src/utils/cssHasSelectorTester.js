/**
 * Motor do testador de seletores CSS :has().
 * Tudo roda 100% client-side; não há comunicação com servidor.
 */

export const DEFAULT_HTML = `<article class="card">
  <h2>Título do card</h2>
  <p>Descrição sem link.</p>
</article>

<article class="card">
  <h2>Outro card</h2>
  <p>Descrição com <a href="#">link</a>.</p>
</article>

<ul class="list">
  <li>Item sem destaque</li>
  <li><strong>Item forte</strong></li>
  <li>Item com <span class="tag">tag</span></li>
</ul>`

export const DEFAULT_SELECTOR = '.card:has(a)'

export const PRESETS = [
  {
    key: 'has-link',
    labelKey: 'presetHasLink',
    selector: '.card:has(a)',
    html: DEFAULT_HTML,
  },
  {
    key: 'has-image',
    labelKey: 'presetHasImage',
    selector: 'figure:has(img)',
    html: `<section class="gallery">
  <figure>
    <figcaption>Sem imagem</figcaption>
  </figure>
  <figure>
    <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'/%3E" alt="exemplo">
    <figcaption>Com imagem</figcaption>
  </figure>
</section>`,
  },
  {
    key: 'not-has',
    labelKey: 'presetNotHas',
    selector: '.field:not(:has(label))',
    html: `<form>
  <div class="field">
    <label for="nome">Nome</label>
    <input id="nome" type="text">
  </div>
  <div class="field">
    <input type="text" placeholder="sem label">
  </div>
</form>`,
  },
  {
    key: 'has-combinator',
    labelKey: 'presetHasCombinator',
    selector: 'li:has(> .tag)',
    html: DEFAULT_HTML,
  },
  {
    key: 'adjacent-sibling',
    labelKey: 'presetAdjacentSibling',
    selector: 'h2:has(+ p)',
    html: DEFAULT_HTML,
  },
]

export function isBrowserSupported() {
  if (typeof window === 'undefined' || !window.CSS || typeof window.CSS.supports !== 'function') {
    return false
  }
  return window.CSS.supports('selector(:has(*))')
}

export function isValidSelector(selector) {
  const trimmed = (selector || '').trim()
  if (!trimmed) return false
  if (typeof window === 'undefined' || !window.CSS || typeof window.CSS.supports !== 'function') {
    return true
  }
  try {
    return window.CSS.supports('selector', trimmed)
  } catch {
    return false
  }
}

export function buildPreviewDocument(html, selector, highlightRule) {
  const safeHtml = (html || '').trim() || '<p>Adicione HTML para visualizar</p>'
  const rule = (highlightRule || '').trim()
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  body {
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    padding: 1.5rem;
    line-height: 1.5;
    color: #111;
    background: #fff;
  }
  .card, .field, figure, li {
    border: 1px solid #d9d9d9;
    border-radius: 8px;
    padding: 1rem;
    margin: 0 0 1rem 0;
  }
  .gallery {
    display: flex;
    gap: 1rem;
  }
  figure {
    margin: 0;
    flex: 1;
  }
  img {
    max-width: 100%;
    height: auto;
    display: block;
    margin-bottom: 0.5rem;
  }
  ul {
    padding-left: 1.5rem;
  }
  li {
    margin-bottom: 0.5rem;
  }
  .tag {
    display: inline-block;
    background: #f0f0f0;
    padding: 0.125rem 0.5rem;
    border-radius: 4px;
    font-size: 0.875rem;
  }
${rule ? `  ${rule}` : ''}
</style>
</head>
<body>
${safeHtml}
</body>
</html>`
}

export function buildHighlightRule(selector, valid) {
  if (!valid) return ''
  const trimmed = (selector || '').trim()
  if (!trimmed) return ''
  return `${trimmed} {
  outline: 3px solid #1677ff !important;
  background: rgba(22, 119, 255, 0.12) !important;
  border-radius: 4px !important;
}`
}

export function buildCssOutput(selector, declarations) {
  const trimmed = (selector || '').trim()
  if (!trimmed) return ''
  const body = (declarations || '/* estilos para elementos combinados */\n  outline: 2px solid #1677ff;\n  background: rgba(22, 119, 255, 0.08);').trim()
  return `${trimmed} {\n${body.split('\n').map((line) => (line.trim() ? `  ${line}` : line)).join('\n')}\n}`
}

export function countMatches(html, selector) {
  if (typeof window === 'undefined' || !window.DOMParser) return null
  const trimmed = (selector || '').trim()
  if (!trimmed) return null
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(`<!DOCTYPE html><html><body>${html}</body></html>`, 'text/html')
    return doc.querySelectorAll(trimmed).length
  } catch {
    return null
  }
}

export function getSelectorSummary(selector, valid, supported, matches) {
  return {
    selector: (selector || '').trim(),
    valid,
    supported,
    matches: matches == null ? null : matches,
  }
}
