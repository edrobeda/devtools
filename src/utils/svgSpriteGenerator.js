/**
 * Motor do Gerador de SVG Sprite.
 *
 * Combina vários SVGs em um único arquivo de sprite usando <symbol>,
 * permitindo reuso via <use xlink:href="#id">. Tudo 100% client-side.
 */

export const DEFAULTS = {
  symbols: [],
  width: 24,
  height: 24,
  addTitle: true,
  addDesc: false,
  inlineStyles: false,
}

export const PRESETS = {
  ui: {
    label: { pt: 'Ícones de UI', en: 'UI Icons' },
    symbols: [
      {
        id: 'home',
        name: 'Home',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
  <polyline points="9 22 9 12 15 12 15 22"></polyline>
</svg>`,
      },
      {
        id: 'user',
        name: 'User',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
  <circle cx="12" cy="7" r="4"></circle>
</svg>`,
      },
      {
        id: 'settings',
        name: 'Settings',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <circle cx="12" cy="12" r="3"></circle>
  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
</svg>`,
      },
      {
        id: 'check',
        name: 'Check',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <polyline points="20 6 9 17 4 12"></polyline>
</svg>`,
      },
      {
        id: 'x',
        name: 'Close',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <line x1="18" y1="6" x2="6" y2="18"></line>
  <line x1="6" y1="6" x2="18" y2="18"></line>
</svg>`,
      },
    ],
  },
  social: {
    label: { pt: 'Redes Sociais', en: 'Social Icons' },
    symbols: [
      {
        id: 'github',
        name: 'GitHub',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
  <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.73.083-.73 1.205.085 1.84 1.237 1.84 1.237 1.07 1.835 2.809 1.305 3.495.998.108-.776.42-1.305.763-1.605-2.665-.3-5.467-1.334-5.467-5.93 0-1.31.468-2.382 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.838 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"></path>
</svg>`,
      },
      {
        id: 'twitter',
        name: 'X / Twitter',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
</svg>`,
      },
      {
        id: 'linkedin',
        name: 'LinkedIn',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"></path>
</svg>`,
      },
    ],
  },
  arrows: {
    label: { pt: 'Setas', en: 'Arrows' },
    symbols: [
      {
        id: 'arrow-up',
        name: 'Arrow Up',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <line x1="12" y1="19" x2="12" y2="5"></line>
  <polyline points="5 12 12 5 19 12"></polyline>
</svg>`,
      },
      {
        id: 'arrow-down',
        name: 'Arrow Down',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <line x1="12" y1="5" x2="12" y2="19"></line>
  <polyline points="19 12 12 19 5 12"></polyline>
</svg>`,
      },
      {
        id: 'arrow-left',
        name: 'Arrow Left',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <line x1="19" y1="12" x2="5" y2="12"></line>
  <polyline points="12 19 5 12 12 5"></polyline>
</svg>`,
      },
      {
        id: 'arrow-right',
        name: 'Arrow Right',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <line x1="5" y1="12" x2="19" y2="12"></line>
  <polyline points="12 5 19 12 12 19"></polyline>
</svg>`,
      },
    ],
  },
}

/**
 * Transforma uma string qualquer em um id válido para uso em <symbol id="...">.
 */
export function sanitizeId(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9_-]/g, '')
    .replace(/^[^a-z]+/, '')
    .slice(0, 64) || 'icon'
}

/**
 * Extrai atributos e conteúdo interno de uma string SVG usando o DOMParser.
 * Fallback por regex caso o ambiente não suporte DOMParser.
 */
export function parseSvg(svgText) {
  const text = String(svgText || '').trim()
  if (!text) return null

  let viewBox = ''
  let content = ''
  let width = ''
  let height = ''

  if (typeof DOMParser !== 'undefined') {
    try {
      const parser = new DOMParser()
      const doc = parser.parseFromString(text, 'image/svg+xml')
      const svg = doc.querySelector('svg')
      if (svg) {
        viewBox = svg.getAttribute('viewBox') || ''
        width = svg.getAttribute('width') || ''
        height = svg.getAttribute('height') || ''
        // Remove o próprio <svg> e mantém apenas os filhos
        content = svg.innerHTML
      }
    } catch (e) {
      // fallback abaixo
    }
  }

  if (!content) {
    // Fallback por regex: captura viewBox e o conteúdo entre <svg ...> e </svg>
    const viewBoxMatch = text.match(/viewBox=["']([^"']+)["']/i)
    if (viewBoxMatch) viewBox = viewBoxMatch[1]
    const widthMatch = text.match(/\swidth=["']([^"']+)["']/i)
    if (widthMatch) width = widthMatch[1]
    const heightMatch = text.match(/\sheight=["']([^"']+)["']/i)
    if (heightMatch) height = heightMatch[1]
    const contentMatch = text.match(/<svg[^>]*>([\s\S]*)<\/svg>/i)
    if (contentMatch) content = contentMatch[1].trim()
  }

  if (!content && !viewBox) return null

  return {
    viewBox: viewBox || '0 0 24 24',
    content,
    width,
    height,
  }
}

/**
 * Adiciona atributos aria opcionais ao <symbol>.
 */
function buildSymbolTag(id, viewBox, title, desc) {
  let attrs = `id="${escapeAttr(id)}" viewBox="${escapeAttr(viewBox)}"`
  if (title) attrs += ` aria-labelledby="title-${id}${desc ? ` desc-${id}` : ''}"`
  let tag = `<symbol ${attrs}>\n`
  if (title) tag += `    <title id="title-${id}">${escapeXml(title)}</title>\n`
  if (desc) tag += `    <desc id="desc-${id}">${escapeXml(desc)}</desc>\n`
  return tag
}

/**
 * Gera o sprite completo a partir de uma lista de símbolos.
 */
export function buildSprite({ symbols, addTitle, addDesc, inlineStyles }) {
  const usedIds = new Set()
  const uniqueSymbols = symbols.map((s, index) => {
    const parsed = parseSvg(s.svg)
    if (!parsed) return null
    let id = sanitizeId(s.id)
    if (!id || usedIds.has(id)) {
      id = `${id || 'icon'}-${index + 1}`
    }
    usedIds.add(id)
    return {
      id,
      name: s.name || id,
      ...parsed,
    }
  }).filter(Boolean)

  if (uniqueSymbols.length === 0) return ''

  let styleAttr = inlineStyles ? ' style="display: none;"' : ''
  let sprite = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"${styleAttr}>\n`

  uniqueSymbols.forEach((s) => {
    sprite += `  ${buildSymbolTag(s.id, s.viewBox, addTitle ? s.name : '', addDesc ? s.name : '')}`
    sprite += s.content
      .split('\n')
      .map((line) => (line.trim() ? `    ${line}` : ''))
      .join('\n')
      .trim()
    sprite += `\n  </symbol>\n`
  })

  sprite += '</svg>'
  return sprite
}

/**
 * Gera um snippet HTML de uso dos símbolos.
 */
export function buildUsageHtml(ids, { width = 24, height = 24, color = 'currentColor', className = 'icon' } = {}) {
  if (!ids || ids.length === 0) return ''
  const cls = className ? ` class="${escapeAttr(className)}"` : ''
  const style = color && color !== 'currentColor' ? ` style="color: ${escapeAttr(color)}"` : ''
  return ids
    .map((id) => `<svg${cls} width="${width}" height="${height}"${style} aria-hidden="true">\n  <use xlink:href="#${escapeAttr(id)}" href="#${escapeAttr(id)}"></use>\n</svg>`)
    .join('\n')
}

/**
 * Gera um exemplo de CSS para estilizar os ícones.
 */
export function buildIconCss(className = 'icon') {
  return `.${className} {
  display: inline-block;
  width: 1em;
  height: 1em;
  vertical-align: middle;
  fill: currentColor;
  pointer-events: none;
}`
}

function escapeAttr(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
