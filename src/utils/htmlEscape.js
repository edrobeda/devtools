// Escape de HTML compartilhado entre os geradores de componente CSS.
//
// Bloco canônico (antes copiado byte-a-byte em 18 utils de gerador CSS, com
// cópias que divergiam: algumas não escapavam aspas). Escapa & < > " e ' para
// uso seguro em HTML e atributos, evitando XSS no preview gerado.

const HTML_NAMED = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (ch) => HTML_NAMED[ch])
}
