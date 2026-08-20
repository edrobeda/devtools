// Classifica o User-Agent de uma requisição sem persistir o UA/IP cru em
// lugar nenhum — só o resultado (human | bot | ai) sai desta função e vira
// um contador agregado em `visits`.

// Crawlers/agentes de IA conhecidos que buscam ou navegam conteúdo pra
// treinar, indexar ou responder com RAG (não motores de busca tradicionais).
const AI_PATTERNS = [
  'gptbot', 'chatgpt-user', 'oai-searchbot',
  'claudebot', 'claude-web', 'claude-searchbot', 'anthropic-ai',
  'perplexitybot', 'perplexity-user',
  'google-extended',
  'bytespider', 'ccbot', 'cohere-ai', 'youbot',
  'amazonbot', 'meta-externalagent', 'facebookbot',
  'diffbot', 'omgili', 'timpibot',
]

// Bots "clássicos": motores de busca, monitoramento, scrapers de SEO,
// clientes HTTP genéricos e headless browsers automatizados.
const GENERIC_BOT_PATTERNS = [
  'googlebot', 'bingbot', 'duckduckbot', 'yandexbot', 'baiduspider', 'slurp',
  'mj12bot', 'ahrefsbot', 'semrushbot', 'dotbot', 'petalbot', 'seznambot',
  'sogou', 'exabot', 'ia_archiver', 'archive.org_bot',
  'uptimerobot', 'pingdom', 'statuscake',
  'curl/', 'wget/', 'python-requests', 'go-http-client', 'axios/', 'node-fetch',
  'headlesschrome', 'phantomjs', 'selenium', 'puppeteer', 'playwright',
  'bot', 'spider', 'crawler', 'scraper',
]

export function classifyUserAgent(userAgent) {
  const ua = (userAgent || '').toLowerCase()
  if (!ua) return 'bot'
  if (AI_PATTERNS.some((p) => ua.includes(p))) return 'ai'
  if (GENERIC_BOT_PATTERNS.some((p) => ua.includes(p))) return 'bot'
  return 'human'
}
