// Pós-build de SEO: gera sitemap.xml, robots.txt e um index.html por rota
// (título, descrição, canonical, Open Graph e JSON-LD próprios + texto de
// fallback), a partir do manifest.xml que os agentes já mantêm atualizado.
//
// O site é uma SPA: sem isto, todo URL devolve o mesmo HTML vazio e o Google
// (e o AdSense) só enxergam o conteúdo depois de rodar o JavaScript. O React
// substitui o conteúdo de #root ao montar, então o texto abaixo só aparece
// para quem não executa JS (robôs, pré-visualização de links).
//
// Uso: node scripts/build-seo.mjs [pasta-dist] [manifest.xml]
import fs from 'node:fs'
import path from 'node:path'

const SITE = 'https://devtools.eventifylab.com'
const DIST = path.resolve(process.argv[2] || 'dist')
const MANIFEST = path.resolve(process.argv[3] || 'manifest.xml')

const HOME_TITLE = 'DevTools — ferramentas online para desenvolvedores'
const HOME_DESC =
  'Mais de 500 ferramentas gratuitas para desenvolvedores: geradores, conversores, formatadores, validadores, cheat sheets e calculadoras. Tudo roda no seu navegador.'

const CATEGORIAS = {
  ai: 'IA', apis: 'APIs', cloud: 'Nuvem', data: 'Dados', devops: 'DevOps', frontend: 'Front-end',
  network: 'Redes', security: 'Segurança', tools: 'Ferramentas', references: 'Referências',
  snippets: 'Snippets', database: 'Banco de dados', extras: 'Extras', backend: 'Back-end',
}

const decodificar = (s) =>
  s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const rotuloCategoria = (c) => CATEGORIAS[c] || c.charAt(0).toUpperCase() + c.slice(1)

/** Descrição curta para o <meta>: até ~155 caracteres, sem cortar palavra. */
function curta(texto, max = 155) {
  const limpo = texto.replace(/\s+/g, ' ').replace(/\.{3}$|…$/, '').trim()
  if (limpo.length <= max) return limpo
  const corte = limpo.slice(0, max)
  return `${corte.slice(0, Math.max(corte.lastIndexOf(' '), 60)).replace(/[,;:\-–—(]$/, '').trim()}…`
}

function lerManifest() {
  const xml = fs.readFileSync(MANIFEST, 'utf8')
  const geradoEm = (xml.match(/generated_at="([^"]+)"/) || [])[1] || new Date().toISOString()
  const paginas = []
  const re = /<page route="([^"]+)" category="([^"]*)" title="([^"]*)">([\s\S]*?)<\/page>/g
  let m
  while ((m = re.exec(xml))) {
    const route = decodificar(m[1])
    if (!/^\/[A-Za-z0-9_\-/]+$/.test(route) || route.includes('//')) continue
    paginas.push({
      route,
      category: decodificar(m[2]),
      title: decodificar(m[3]).trim(),
      description: decodificar(m[4]).replace(/\s+/g, ' ').trim(),
    })
  }
  return { geradoEm, paginas }
}

function cabecalho({ title, description, url, tipo }) {
  const jsonld = {
    '@context': 'https://schema.org',
    '@type': tipo === 'home' ? 'WebSite' : 'WebApplication',
    name: title,
    url,
    description,
    inLanguage: 'pt-BR',
    ...(tipo === 'home'
      ? {}
      : { applicationCategory: 'DeveloperApplication', operatingSystem: 'Any', offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' } }),
  }
  return [
    `<meta name="description" content="${esc(description)}" />`,
    `<link rel="canonical" href="${esc(url)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="DevTools" />`,
    `<meta property="og:locale" content="pt_BR" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
    `<meta property="og:url" content="${esc(url)}" />`,
    `<meta property="og:image" content="${SITE}/icons/apple-touch-icon.png" />`,
    `<meta name="twitter:card" content="summary" />`,
    `<meta name="twitter:title" content="${esc(title)}" />`,
    `<meta name="twitter:description" content="${esc(description)}" />`,
    `<script type="application/ld+json">${JSON.stringify(jsonld).replace(/</g, '\\u003c')}</script>`,
  ].join('\n    ')
}

const ESTILO_FALLBACK =
  'max-width:760px;margin:0 auto;padding:24px 16px;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;line-height:1.5'

function aplicar(base, { title, description, url, tipo, corpo }) {
  let html = base
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`)
  html = html.replace(/\s*<meta name="description"[^>]*>/, '')
  html = html.replace('</head>', `    ${cabecalho({ title, description, url, tipo })}\n  </head>`)
  html = html.replace('<div id="root"></div>', `<div id="root">${corpo}</div>`)
  return html
}

function main() {
  const baseFile = path.join(DIST, 'index.html')
  if (!fs.existsSync(baseFile)) throw new Error(`não achei ${baseFile} (rode o vite build antes)`)
  const base = fs.readFileSync(baseFile, 'utf8')
  const { geradoEm, paginas } = lerManifest()
  if (!paginas.length) throw new Error('manifest.xml sem páginas')
  const dia = geradoEm.slice(0, 10)

  // Páginas por categoria: lista de links na home (descoberta de URLs).
  const porCategoria = new Map()
  for (const p of paginas) {
    if (!porCategoria.has(p.category)) porCategoria.set(p.category, [])
    porCategoria.get(p.category).push(p)
  }
  const navHome = [...porCategoria.entries()]
    .sort((a, b) => rotuloCategoria(a[0]).localeCompare(rotuloCategoria(b[0]), 'pt-BR'))
    .map(
      ([cat, lista]) =>
        `<h2>${esc(rotuloCategoria(cat))}</h2><ul>${lista
          .sort((a, b) => a.title.localeCompare(b.title, 'pt-BR'))
          .map((p) => `<li><a href="${esc(p.route)}">${esc(p.title)}</a></li>`)
          .join('')}</ul>`
    )
    .join('')

  // Home: reescreve o próprio index.html (continua sendo o fallback da SPA).
  const home = aplicar(base, {
    title: HOME_TITLE,
    description: HOME_DESC,
    url: `${SITE}/`,
    tipo: 'home',
    corpo: `<main style="${ESTILO_FALLBACK}"><h1>DevTools</h1><p>${esc(HOME_DESC)}</p><nav>${navHome}</nav></main>`,
  })
  fs.writeFileSync(baseFile, home)

  let n = 0
  for (const p of paginas) {
    const url = `${SITE}${p.route}`
    const desc = curta(p.description || HOME_DESC)
    const html = aplicar(base, {
      title: `${p.title} — DevTools`,
      description: desc,
      url,
      tipo: 'pagina',
      corpo:
        `<main style="${ESTILO_FALLBACK}"><p><a href="/">DevTools</a> › ${esc(rotuloCategoria(p.category))}</p>` +
        `<h1>${esc(p.title)}</h1><p>${esc(p.description)}</p>` +
        `<p>Ferramenta gratuita que roda direto no navegador. Ative o JavaScript para usar.</p></main>`,
    })
    const dir = path.join(DIST, p.route)
    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(path.join(dir, 'index.html'), html)
    n += 1
  }

  const urls = [`${SITE}/`, ...paginas.map((p) => `${SITE}${p.route}`)]
  const sitemap =
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map((u) => `  <url><loc>${esc(u)}</loc><lastmod>${dia}</lastmod></url>`).join('\n') +
    `\n</urlset>\n`
  fs.writeFileSync(path.join(DIST, 'sitemap.xml'), sitemap)
  fs.writeFileSync(
    path.join(DIST, 'robots.txt'),
    `User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${SITE}/sitemap.xml\n`
  )
  console.log(`[seo] ${n} páginas, sitemap com ${urls.length} URLs, robots.txt`)
}

main()
