/**
 * Parser Markdown -> HTML minimalista, compartilhado por /tools/markdown-previewer
 * e /references/markdown-syntax. Antes cada página mantinha uma cópia privada
 * deste mesmo código — duas implementações da mesma arquitetura (split em linhas,
 * buffer de parágrafo, buffer de lista, flushParagraph/flushList) que já tinham
 * divergido. Esta é a versão canônica: o superconjunto das duas, com tabela,
 * heading Setext, riscado, task list, imagem, escape de caractere e inline
 * strong+em.
 *
 * Cobre o subconjunto mais comum do dia a dia (GitHub Flavored), não é
 * CommonMark completo. 100% client-side — nada sai do navegador.
 */

const ESCAPED = { '*': '&#42;', _: '&#95;', '#': '&#35;', '[': '&#91;', ']': '&#93;', '`': '&#96;', '~': '&#126;' }

export function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function inlineFormat(raw) {
  let out = escapeHtml(raw)
  out = out.replace(/\\([#*_*`[\]~-])/g, (m, c) => ESCAPED[c] || m)
  out = out.replace(/`([^`]+)`/g, '<code>$1</code>')
  out = out.replace(/!\[([^\]]*)\]\(([^\s)]+)\)/g, '<img src="$2" alt="$1" style="max-width:100%" />')
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>')
  out = out.replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>')
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  out = out.replace(/__([^_]+)__/g, '<strong>$1</strong>')
  out = out.replace(/\*([^*]+)\*/g, '<em>$1</em>')
  out = out.replace(/(?<!_)_([^_]+)_(?!_)/g, '<em>$1</em>')
  out = out.replace(/~~([^~]+)~~/g, '<del>$1</del>')
  return out
}

export function parseTable(lines, start) {
  const splitRow = (l) => l.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((s) => s.trim())
  const header = splitRow(lines[start])
  const seps = splitRow(lines[start + 1])
  const alig = seps.map((s) => (s.startsWith(':') && s.endsWith(':') ? 'center' : (s.endsWith(':') ? 'right' : 'left')))
  let end = start + 2
  while (end < lines.length && lines[end].trim() !== '' && lines[end].includes('|')) end += 1
  const cell = (c, k, tag) => `${tag} style="border:1px solid #d9d9d9;padding:2px 8px;text-align:${alig[k] || 'left'}">${inlineFormat(c)}</${tag}>`
  let out = '<table style="border-collapse:collapse"><thead><tr>'
  out += header.map((h, k) => cell(h, k, 'th')).join('')
  out += '</tr></thead><tbody>'
  for (let r = start + 2; r < end; r += 1) {
    out += `<tr>${splitRow(lines[r]).map((c, k) => cell(c, k, 'td')).join('')}</tr>`
  }
  out += '</tbody></table>'
  return { html: out, next: end }
}

export function isTableSep(l) {
  return /^\s*\|?[\s:|-]+-+[\s:|-]*\|?\s*$/.test(l) && l.includes('-')
}

export function markdownToHtml(md) {
  const lines = md.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
  const html = []
  let listBuffer = null
  let paragraphBuffer = []

  const flushParagraph = () => {
    if (paragraphBuffer.length) {
      html.push(`<p>${inlineFormat(paragraphBuffer.join(' '))}</p>`)
      paragraphBuffer = []
    }
  }

  const flushList = () => {
    if (!listBuffer) return
    const body = listBuffer.items
      .map((it) => {
        if (it.checked === null) return `<li>${inlineFormat(it.text)}</li>`
        const box = `<input type="checkbox" disabled ${it.checked ? 'checked' : ''} /> `
        return `<li style="list-style:none;">${box}${inlineFormat(it.text)}</li>`
      })
      .join('')
    html.push(`<${listBuffer.type}>${body}</${listBuffer.type}>`)
    listBuffer = null
  }

  let i = 0
  while (i < lines.length) {
    const line = lines[i]

    if (/^```/.test(line)) {
      flushParagraph()
      flushList()
      const code = []
      i += 1
      while (i < lines.length && !/^```/.test(lines[i])) {
        code.push(lines[i])
        i += 1
      }
      html.push(`<pre style="background:#f5f5f5;padding:8px;overflow:auto"><code>${escapeHtml(code.join('\n'))}</code></pre>`)
      i += 1
      continue
    }

    const heading = line.match(/^(#{1,6})\s+(.*)$/)
    if (heading) {
      flushParagraph()
      flushList()
      const level = heading[1].length
      html.push(`<h${level}>${inlineFormat(heading[2])}</h${level}>`)
      i += 1
      continue
    }

    const setext = line.match(/^\s*(=+|-+)\s*$/)
    if (setext && paragraphBuffer.length) {
      const level = setext[1][0] === '=' ? 1 : 2
      const text = paragraphBuffer.join(' ')
      paragraphBuffer = []
      flushList()
      html.push(`<h${level}>${inlineFormat(text)}</h${level}>`)
      i += 1
      continue
    }

    if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      flushParagraph()
      flushList()
      html.push('<hr style="border:none;border-top:1px solid #d9d9d9" />')
      i += 1
      continue
    }

    if (/^\s*>/.test(line)) {
      flushParagraph()
      flushList()
      const quote = []
      while (i < lines.length && /^\s*>/.test(lines[i])) {
        quote.push(lines[i].replace(/^\s*>\s?/, ''))
        i += 1
      }
      html.push(`<blockquote style="border-left:3px solid #d9d9d9;margin:0;padding-left:8px;color:#595959">${inlineFormat(quote.join(' '))}</blockquote>`)
      continue
    }

    if (line.includes('|') && i + 1 < lines.length && isTableSep(lines[i + 1])) {
      flushParagraph()
      flushList()
      const table = parseTable(lines, i)
      html.push(table.html)
      i = table.next
      continue
    }

    const ul = line.match(/^(\s*)[-*]\s+(.*)$/)
    const ol = line.match(/^(\s*)\d+\.\s+(.*)$/)
    if (ul || ol) {
      flushParagraph()
      const isOl = Boolean(ol)
      const text = (ol ? ol[2] : ul[2]).trim()
      if (!listBuffer || listBuffer.type !== (isOl ? 'ol' : 'ul')) {
        flushList()
        listBuffer = { type: isOl ? 'ol' : 'ul', items: [] }
      }
      const task = text.match(/^\[( |x|X)\]\s*(.*)$/)
      listBuffer.items.push({ text: task ? task[2] : text, checked: task ? task[1] : null })
      i += 1
      continue
    }

    if (line.trim() === '') {
      flushParagraph()
      flushList()
      i += 1
      continue
    }

    flushList()
    paragraphBuffer.push(line.trim())
    i += 1
  }

  flushParagraph()
  flushList()
  return html.join('\n')
}
