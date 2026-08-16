/**
 * Motor do Gerador de HTML5 Boilerplate.
 *
 * Gera um documento HTML5 completo a partir de opções configuráveis,
 * sempre 100% client-side. Não depende de API externa.
 */

export const DEFAULTS = {
  lang: 'pt-BR',
  charset: 'UTF-8',
  viewport: true,
  title: 'Minha Página',
  description: '',
  themeColor: '',
  favicon: '',
  canonical: '',
  author: '',
  robots: 'index, follow',
  openGraph: true,
  ogType: 'website',
  ogImage: '',
  ogSiteName: '',
  twitterCard: true,
  twitterSite: '',
  manifest: '',
  cssOption: 'link', // 'none' | 'link' | 'inline-reset' | 'inline-normalize'
  cssHref: 'styles.css',
  jsOption: 'link', // 'none' | 'link' | 'inline' | 'module' | 'defer'
  jsSrc: 'script.js',
  noscript: true,
  bodyContent: '<h1>Olá, mundo!</h1>\n<p>Edite este conteúdo.</p>',
  includeComments: true,
}

export const PRESETS = {
  minimal: {
    label: { pt: 'Mínimo', en: 'Minimal' },
    values: {
      ...DEFAULTS,
      title: 'Página Mínima',
      description: '',
      openGraph: false,
      twitterCard: false,
      cssOption: 'none',
      jsOption: 'none',
      noscript: false,
      bodyContent: '<h1>Olá, mundo!</h1>',
    },
  },
  landing: {
    label: { pt: 'Landing Page', en: 'Landing Page' },
    values: {
      ...DEFAULTS,
      title: 'Produto Incrível — Conheça agora',
      description: 'Uma landing page de exemplo com SEO e tags sociais configuradas.',
      themeColor: '#1677ff',
      favicon: '/favicon.ico',
      canonical: 'https://exemplo.com/',
      author: 'DevTools',
      ogType: 'website',
      ogImage: 'https://exemplo.com/og-image.png',
      ogSiteName: 'Produto Incrível',
      twitterSite: '@exemplo',
      manifest: '/manifest.json',
      cssOption: 'link',
      cssHref: '/styles.css',
      jsOption: 'defer',
      jsSrc: '/app.js',
      bodyContent:
        '<header>\n  <h1>Produto Incrível</h1>\n  <p>A solução que você procurava.</p>\n</header>\n<main>\n  <section>\n    <h2>Recursos</h2>\n    <p>Descreva aqui os diferenciais do seu produto.</p>\n  </section>\n</main>\n<footer>\n  <p>&copy; 2026 Exemplo. Todos os direitos reservados.</p>\n</footer>',
    },
  },
  blog: {
    label: { pt: 'Artigo de Blog', en: 'Blog Post' },
    values: {
      ...DEFAULTS,
      lang: 'pt-BR',
      title: 'Como construir um HTML5 semântico',
      description: 'Guia prático de estrutura HTML5 com boas práticas de SEO e acessibilidade.',
      favicon: '/favicon.ico',
      canonical: 'https://blog.exemplo.com/html5-semantico',
      author: 'Autor do Blog',
      ogType: 'article',
      ogImage: 'https://blog.exemplo.com/cover.png',
      ogSiteName: 'Blog de Exemplo',
      twitterSite: '@blogexemplo',
      cssOption: 'inline-reset',
      jsOption: 'none',
      bodyContent:
        '<article>\n  <header>\n    <h1>Como construir um HTML5 semântico</h1>\n    <p>Publicado em <time datetime="2026-08-15">15 de agosto de 2026</time></p>\n  </header>\n  <p>O HTML5 trouxe tags semânticas que melhoram a acessibilidade e o SEO.</p>\n</article>',
    },
  },
}

const CSS_RESET = `/* Reset mínimo */
*, *::before, *::after {
  box-sizing: border-box;
}
* {
  margin: 0;
}
body {
  line-height: 1.5;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
img, picture, video, canvas, svg {
  display: block;
  max-width: 100%;
}
input, button, textarea, select {
  font: inherit;
}`

const CSS_NORMALIZE = `/* Normalize simplificado */
html {
  line-height: 1.15;
  -webkit-text-size-adjust: 100%;
}
body {
  margin: 0;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
h1 {
  font-size: 2em;
  margin: 0.67em 0;
}
img {
  border-style: none;
  max-width: 100%;
}`

function escapeAttr(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function indent(level) {
  return '  '.repeat(level)
}

/**
 * Gera o HTML5 boilerplate completo.
 * @param {Object} options
 * @returns {string}
 */
export function buildBoilerplate(options = {}) {
  const o = { ...DEFAULTS, ...options }
  const comment = (text, level = 1) => (o.includeComments ? `${indent(level)}<!-- ${text} -->\n` : '')

  let head = ''
  head += `${indent(1)}<meta charset="${escapeAttr(o.charset)}">\n`
  if (o.viewport) {
    head += `${indent(1)}<meta name="viewport" content="width=device-width, initial-scale=1.0">\n`
  }
  head += `${indent(1)}<title>${escapeAttr(o.title)}</title>\n`

  if (o.description) {
    head += `${indent(1)}<meta name="description" content="${escapeAttr(o.description)}">\n`
  }
  if (o.author) {
    head += `${indent(1)}<meta name="author" content="${escapeAttr(o.author)}">\n`
  }
  if (o.robots) {
    head += `${indent(1)}<meta name="robots" content="${escapeAttr(o.robots)}">\n`
  }
  if (o.themeColor) {
    head += `${indent(1)}<meta name="theme-color" content="${escapeAttr(o.themeColor)}">\n`
  }
  if (o.favicon) {
    head += `${indent(1)}<link rel="icon" href="${escapeAttr(o.favicon)}">\n`
  }
  if (o.canonical) {
    head += `${indent(1)}<link rel="canonical" href="${escapeAttr(o.canonical)}">\n`
  }
  if (o.manifest) {
    head += `${indent(1)}<link rel="manifest" href="${escapeAttr(o.manifest)}">\n`
  }

  if (o.openGraph) {
    head += comment('Open Graph / Facebook', 1)
    head += `${indent(1)}<meta property="og:type" content="${escapeAttr(o.ogType)}">\n`
    head += `${indent(1)}<meta property="og:title" content="${escapeAttr(o.title)}">\n`
    if (o.description) {
      head += `${indent(1)}<meta property="og:description" content="${escapeAttr(o.description)}">\n`
    }
    if (o.canonical) {
      head += `${indent(1)}<meta property="og:url" content="${escapeAttr(o.canonical)}">\n`
    }
    if (o.ogImage) {
      head += `${indent(1)}<meta property="og:image" content="${escapeAttr(o.ogImage)}">\n`
    }
    if (o.ogSiteName) {
      head += `${indent(1)}<meta property="og:site_name" content="${escapeAttr(o.ogSiteName)}">\n`
    }
  }

  if (o.twitterCard) {
    head += comment('Twitter Card', 1)
    head += `${indent(1)}<meta name="twitter:card" content="${o.ogImage ? 'summary_large_image' : 'summary'}">\n`
    if (o.twitterSite) {
      head += `${indent(1)}<meta name="twitter:site" content="${escapeAttr(o.twitterSite)}">\n`
    }
    head += `${indent(1)}<meta name="twitter:title" content="${escapeAttr(o.title)}">\n`
    if (o.description) {
      head += `${indent(1)}<meta name="twitter:description" content="${escapeAttr(o.description)}">\n`
    }
    if (o.ogImage) {
      head += `${indent(1)}<meta name="twitter:image" content="${escapeAttr(o.ogImage)}">\n`
    }
  }

  if (o.cssOption === 'link' && o.cssHref) {
    head += `${indent(1)}<link rel="stylesheet" href="${escapeAttr(o.cssHref)}">\n`
  } else if (o.cssOption === 'inline-reset') {
    head += `${indent(1)}<style>\n${CSS_RESET.split('\n').map((l) => `${indent(2)}${l}`).join('\n')}\n${indent(1)}</style>\n`
  } else if (o.cssOption === 'inline-normalize') {
    head += `${indent(1)}<style>\n${CSS_NORMALIZE.split('\n').map((l) => `${indent(2)}${l}`).join('\n')}\n${indent(1)}</style>\n`
  }

  if (o.jsOption === 'link' && o.jsSrc) {
    head += `${indent(1)}<script src="${escapeAttr(o.jsSrc)}"></script>\n`
  }

  let body = ''
  if (o.noscript) {
    body += `${indent(1)}<noscript>\n${indent(2)}<p>JavaScript precisa estar habilitado para uma experiência completa.</p>\n${indent(1)}</noscript>\n`
  }

  if (o.jsOption === 'inline') {
    body += `${indent(1)}<script>\n${indent(2)}console.log('Página carregada');\n${indent(1)}</script>\n`
  } else if (o.jsOption === 'module') {
    body += `${indent(1)}<script type="module" src="${escapeAttr(o.jsSrc)}"></script>\n`
  } else if (o.jsOption === 'defer') {
    body += `${indent(1)}<script src="${escapeAttr(o.jsSrc)}" defer></script>\n`
  }

  const bodyContentLines = o.bodyContent
    ? o.bodyContent.split('\n').map((line) => `${indent(1)}${line}`).join('\n')
    : ''

  let html = `<!DOCTYPE html>\n`
  html += `<html lang="${escapeAttr(o.lang)}">\n`
  html += `<head>\n`
  if (o.includeComments) {
    html += `${indent(1)}<!-- Metadados básicos -->\n`
  }
  html += head
  html += `</head>\n`
  html += `<body>\n`
  if (bodyContentLines) {
    html += bodyContentLines + '\n'
  }
  if (body) {
    html += body
  }
  html += `</body>\n`
  html += `</html>`

  return html
}

/**
 * Valida campos obrigatórios do boilerplate.
 * @param {Object} options
 * @returns {Array<{field: string, message: string}>}
 */
export function validateBoilerplate(options = {}) {
  const errors = []
  const o = { ...DEFAULTS, ...options }
  if (!o.title.trim()) {
    errors.push({ field: 'title', message: 'title é obrigatório' })
  }
  if (o.cssOption === 'link' && !o.cssHref.trim()) {
    errors.push({ field: 'cssHref', message: 'cssHref é obrigatório quando CSS externo está ativo' })
  }
  if ((o.jsOption === 'link' || o.jsOption === 'module' || o.jsOption === 'defer') && !o.jsSrc.trim()) {
    errors.push({ field: 'jsSrc', message: 'jsSrc é obrigatório quando JS externo/defer/module está ativo' })
  }
  return errors
}
