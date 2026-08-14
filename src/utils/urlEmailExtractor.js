/**
 * Extrator de URLs e e-mails — 100% client-side.
 *
 * Usa regexes simples e seguras para identificar endereços de e-mail e
 * links HTTP/HTTPS dentro de qualquer texto, sem depender de APIs.
 */

const URL_RE = /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi
const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g

function dedupe(values) {
  return Array.from(new Set(values))
}

function sort(values, mode = 'default') {
  const copy = [...values]
  if (mode === 'length') return copy.sort((a, b) => a.length - b.length)
  if (mode === 'domain') {
    return copy.sort((a, b) => {
      const da = a.replace(/^https?:\/\//i, '').split('/')[0]
      const db = b.replace(/^https?:\/\//i, '').split('/')[0]
      return da.localeCompare(db)
    })
  }
  return copy.sort((a, b) => a.localeCompare(b))
}

export function extractUrls(text) {
  if (!text) return []
  return Array.from(text.matchAll(URL_RE), (m) => m[0])
}

export function extractEmails(text) {
  if (!text) return []
  return Array.from(text.matchAll(EMAIL_RE), (m) => m[0])
}

export function extractAll(text) {
  return [...extractUrls(text), ...extractEmails(text)]
}

export function processExtraction({ text, mode, deduplicate, sortMode }) {
  let values = []
  if (mode === 'urls') values = extractUrls(text)
  else if (mode === 'emails') values = extractEmails(text)
  else values = extractAll(text)

  if (deduplicate) values = dedupe(values)
  if (sortMode && sortMode !== 'none') values = sort(values, sortMode)

  return values
}

export function buildMarkdownList(values, mode) {
  if (values.length === 0) return ''
  const label = mode === 'urls' ? 'Links' : mode === 'emails' ? 'E-mails' : 'Itens'
  return [`## ${label} (${values.length})`, '', ...values.map((v) => `- ${v}`)].join('\n')
}

export function buildCsv(values) {
  if (values.length === 0) return ''
  return ['value', ...values].join('\n')
}

export function buildOnePerLine(values) {
  return values.join('\n')
}

export const SAMPLE_TEXT = `Relatório de contatos — Q3 2026

Para dúvidas sobre o projeto, envie um e-mail para equipe@eventifylab.com
ou fale diretamente com o suporte em suporte@eventifylab.com.

Documentação:
- API pública: https://api.eventifylab.com/docs
- Dashboard: https://dashboard.eventifylab.com/login
- Blog: https://eventifylab.com/blog/como-escalar-saas
- Repositório: https://github.com/eventifylab/devtools
- Status page: https://status.eventifylab.com

Contatos individuais:
Ana Silva — ana.silva@eventifylab.com
Bruno Costa — bruno.costa+dev@eventifylab.co.uk
Carla Dias — carla_dias@eventifylab.io

Links repetidos aparecem de propósito:
https://api.eventifylab.com/docs
https://api.eventifylab.com/docs

Aviso: nao-use@exemplo (inválido) e ftp://ftp.eventifylab.com/pub (não é HTTP/HTTPS).
`
