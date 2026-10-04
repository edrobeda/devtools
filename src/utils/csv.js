/**
 * Parser/escritor CSV compartilhado por /data/csv-json-converter,
 * /data/csv-markdown-table e /database/csv-to-sql. Antes cada página mantinha
 * uma cópia privada deste mesmo código — três versões da mesma máquina de
 * estados (campos entre aspas, aspas escapadas "", delimitador e quebra de
 * linha dentro do campo) que já tinham começado a divergir: uma aceitava
 * aspas no meio do campo e ignorava \r sozinho, a outra só abria aspas no
 * início do campo e tratava \r como fim de linha. Esta é a versão canônica,
 * com essas diferenças explícitas em opções.
 *
 * Estilo RFC4180, 100% client-side — nada sai do navegador.
 */

/**
 * Quebra um texto delimitado (CSV/TSV) em linhas de campos.
 *
 * @param {string} text        conteúdo a parsear
 * @param {string} [delimiter] delimitador de campo (padrão ',')
 * @param {object} [options]
 * @param {boolean} [options.skipEmptyRows=true]          descarta linhas em branco no fim
 * @param {boolean} [options.quoteOnlyAtFieldStart=false]  só abre aspas no início do campo
 *        (false = RFC4180 estrito: uma aspa no meio do campo abre citação)
 * @param {boolean} [options.carriageReturnEndsRow=false]  trata \r solto como fim de linha
 *        (false = \r solto é ignorado e o \n seguinte fecha a linha)
 * @returns {string[][]} linhas de campos
 */
export function parseDelimited(text, delimiter = ',', options = {}) {
  const {
    skipEmptyRows = true,
    quoteOnlyAtFieldStart = false,
    carriageReturnEndsRow = false,
  } = options

  const rows = []
  let row = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const c = text[i]

    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += c
      }
      continue
    }

    if (c === '"' && (!quoteOnlyAtFieldStart || field === '')) {
      inQuotes = true
      continue
    }
    if (c === delimiter) {
      row.push(field)
      field = ''
      continue
    }
    if (c === '\n' || (c === '\r' && carriageReturnEndsRow)) {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(field)
      rows.push(row)
      row = []
      field = ''
      continue
    }
    if (c === '\r') continue // \r solto é ignorado; o \n seguinte fecha a linha

    field += c
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field)
    rows.push(row)
  }

  if (!skipEmptyRows) return rows
  return rows.filter((r) => !(r.length === 1 && r[0] === ''))
}

/**
 * Escapa um campo para escrita em CSV: entre aspas quando contém o
 * delimitador, aspas, \n ou \r; dentro daspas, " vira "".
 */
export function escapeCsvField(value, delimiter) {
  const s = value === null || value === undefined ? '' : String(value)
  if (s.includes(delimiter) || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}