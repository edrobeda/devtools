/**
 * Motor do Visualizador de Chunking RAG.
 * Divide um texto em chunks do jeito que pipelines de RAG fazem antes de
 * embeddar — três estratégias, todas 100% no navegador.
 *
 * - `chunkFixed`   : janelas fixas por posição, sem sobreposição.
 * - `chunkOverlap` : janelas fixas com overlap entre chunks vizinhos.
 * - `chunkRecursive`: estilo LangChain RecursiveCharacterTextSplitter —
 *   desce pelos separadores em ordem de prioridade (parágrafo, linha, espaço,
 *   string vazia) e junta os pedaços até o limite de tamanho, recortando o
 *   overhead; folhas que ainda estouram o limite são serradas em fatias.
 */

export const DEFAULT_SEPARATORS = ['\n\n', '\n', ' ', '']

export const SEPARATOR_OPTIONS = [
  { key: 'double-newline', value: '\n\n' },
  { key: 'newline', value: '\n' },
  { key: 'tab', value: '\t' },
  { key: 'space', value: ' ' },
]

// Mesmo critério conservador do token-counter: latim ~1 token a cada 4
// caracteres; script de alta densidade (CJK/emoji) ~1 token por caractere.
const CJK_RE = /[\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af\u3400-\u4dbf\u{20000}-\u{2A6DF}\uf900-\ufaff\u{1F300}-\u{1FAFF}]/u
const WS_RE = /\s/

export function estimateTokens(text) {
  if (!text) return 0
  let latin = 0
  let cjk = 0
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (CJK_RE.test(ch)) {
      cjk++
      continue
    }
    if (!WS_RE.test(ch)) latin++
  }
  return Math.max(1, Math.ceil(latin / 4) + cjk)
}

export function makeLenFn(unit) {
  return unit === 'tokens' ? estimateTokens : (s) => s.length
}

// Converte um tamanho/overlap informado em tokens para caracteres
// aproximados (a regra do token-counter é ~4 chars/token).
export function toChars(amount, unit) {
  return unit === 'tokens' ? Math.max(1, amount * 4) : amount
}

const clampOverlap = (size, overlap) => Math.max(0, Math.min(overlap, Math.max(0, size - 1)))

// Janela fixa por posição: chunk i cobre [i*size, (i+1)*size).
export function chunkFixed(text, size) {
  const chunks = []
  const n = text.length
  let start = 0
  while (start < n) {
    const end = Math.min(n, start + size)
    chunks.push({ start, end, text: text.slice(start, end) })
    start = end
  }
  return chunks
}

// Janela fixa com overlap: chunk i começa em i*(size - overlap).
export function chunkOverlap(text, size, overlap) {
  const chunks = []
  const n = text.length
  if (n === 0) return chunks
  const ov = clampOverlap(size, overlap)
  const step = Math.max(1, size - ov)
  let start = 0
  while (start < n) {
    const end = Math.min(n, start + size)
    chunks.push({ start, end, text: text.slice(start, end) })
    if (end >= n) break
    start += step
    if (start >= n) break
  }
  return chunks
}

// Serraria uma string longa demais em fatias de ~size unidades (sem perder
// overlap). `ratio` = caracteres por unidade de tamanho, estimado do próprio
// texto, pra respeitar a unidade tokens quando Início/fim forem aproximados.
function hardCut(s, size, overlap, lenFn) {
  const units = Math.max(1, lenFn(s))
  const ratio = s.length / units
  const charSlot = Math.max(1, Math.round(size * ratio))
  const charOv = clampOverlap(charSlot, Math.round(overlap * ratio))
  const step = Math.max(1, charSlot - charOv)
  const pieces = []
  let start = 0
  while (start < s.length) {
    const end = Math.min(s.length, start + charSlot)
    pieces.push(s.slice(start, end))
    if (end >= s.length) break
    start += step
  }
  return pieces
}

// Junta pedaços (strings) em "-- pedaços de até `size` unidades, mantendo
// `overlap` unidades do chunk anterior como "gancho" no próximo.
function mergeSplits(splits, size, overlap, lenFn) {
  const out = []
  let cur = []
  let total = 0
  for (const d of splits) {
    const ld = lenFn(d)
    if (total + ld > size && cur.length) {
      const doc = cur.join('')
      if (doc !== '') out.push(doc)
      while (total > overlap && cur.length) {
        total -= lenFn(cur[0])
        cur.shift()
        if (total < 0) break
      }
    }
    cur.push(d)
    total += ld
  }
  if (cur.length) {
    const doc = cur.join('')
    if (doc !== '') out.push(doc)
  }
  return out
}

// Splitter recursivo estilo LangChain: escolhe o primeiro separador presente
// no texto, divide, e devolve o que ainda for grande demais para a próxima
// etapa de separadores — até a string vazia (fallback). Folhas que ainda
// estouram o limite são serradas em fatias (`hardCut`).
export function chunkRecursive(textInput, size, overlap, separators, lenFn) {
  const seps = separators && separators.length ? separators : DEFAULT_SEPARATORS
  const out = []

  function splitRec(t, sepList) {
    if (!t) return
    let sep = ''
    let childSeps = []
    for (let i = 0; i < sepList.length; i++) {
      if (sepList[i] === '') {
        sep = ''
        childSeps = []
        break
      }
      if (t.includes(sepList[i])) {
        sep = sepList[i]
        childSeps = sepList.slice(i + 1)
        break
      }
    }
    const splits = sep === '' ? [t] : t.split(sep).filter((s) => s !== '')
    const goodSplits = []
    for (const s of splits) {
      if (lenFn(s) < size) {
        goodSplits.push(s)
      } else {
        if (goodSplits.length) {
          out.push(...mergeSplits(goodSplits, size, overlap, lenFn))
          goodSplits.length = 0
        }
        if (childSeps.length === 0) {
          out.push(...hardCut(s, size, overlap, lenFn))
        } else {
          splitRec(s, childSeps)
        }
      }
    }
    if (goodSplits.length) out.push(...mergeSplits(goodSplits, size, overlap, lenFn))
  }

  splitRec(textInput, seps)
  return out
}

// Atribui posições aproximadas [start, end) a cada chunk produzido por
// `chunkRecursive` (os separadores são removidos, então os trechos não são
// contíguos no texto original — as posições são uma referência visual).
export function toChunkObjects(text, strings) {
  const chunks = []
  let cursor = 0
  for (const s of strings) {
    const idx = text.indexOf(s, cursor)
    if (idx === -1) {
      chunks.push({ start: cursor, end: Math.min(text.length, cursor + s.length), text: s })
    } else {
      chunks.push({ start: idx, end: idx + s.length, text: s })
      cursor = idx + s.length
    }
  }
  return chunks
}

// Ponto de entrada único usado pela página: combina estratégia + unidade e
// devolve uma lista de chunks com posição, texto, chars e tokens estimados.
// `method`: 'fixed' | 'overlap' | 'recursive'
export function chunkText(text, { method, size, overlap, separators, unit }) {
  const n = text.length
  if (n === 0) return []

  let chunks
  if (method === 'recursive') {
    const lenFn = makeLenFn(unit)
    const strings = chunkRecursive(text, size, overlap, separators, lenFn)
    chunks = toChunkObjects(text, strings)
  } else {
    const charSize = toChars(size, unit)
    chunks = method === 'overlap'
      ? chunkOverlap(text, charSize, toChars(overlap, unit))
      : chunkFixed(text, charSize)
  }

  return chunks.map((c, i) => {
    const prevEnd = i === 0 ? c.start : chunks[i - 1].end
    return {
      ...c,
      chars: c.text.length,
      tokens: estimateTokens(c.text),
      dup: i === 0 ? 0 : Math.max(0, prevEnd - c.start),
    }
  })
}