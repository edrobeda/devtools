// Simulador de MapReduce — 100% client-side.
// Demonstra o fluxo clássico split -> map -> shuffle/sort -> reduce -> output
// usando funcoes puras executadas localmente no navegador.

export const PRESETS = {
  pt: [
    {
      key: 'word-count',
      label: 'Contagem de palavras',
      description: 'Conta quantas vezes cada palavra aparece no texto.',
    },
    {
      key: 'line-length',
      label: 'Comprimento de linhas',
      description: 'Mapeia cada linha para seu comprimento em caracteres.',
    },
    {
      key: 'char-count',
      label: 'Contagem de letras',
      description: 'Conta a ocorrencia de cada letra (ignora espacos e pontuacao).',
    },
    {
      key: 'filter-lines',
      label: 'Filtrar linhas',
      description: 'Retorna apenas linhas que contem uma substring escolhida.',
    },
    {
      key: 'word-length',
      label: 'Tamanho medio de palavras',
      description: 'Agrupa palavras pelo tamanho e conta quantas ha em cada grupo.',
    },
  ],
  en: [
    {
      key: 'word-count',
      label: 'Word count',
      description: 'Counts how many times each word appears in the text.',
    },
    {
      key: 'line-length',
      label: 'Line lengths',
      description: 'Maps each input line to its length in characters.',
    },
    {
      key: 'char-count',
      label: 'Character count',
      description: 'Counts the occurrence of each letter (ignores spaces and punctuation).',
    },
    {
      key: 'filter-lines',
      label: 'Filter lines',
      description: 'Returns only lines containing a chosen substring.',
    },
    {
      key: 'word-length',
      label: 'Average word size groups',
      description: 'Groups words by length and counts how many fall into each group.',
    },
  ],
}

function normalizeWord(word) {
  return word.toLowerCase().replace(/[^a-z0-9\u00C0-\u00FF]+/g, '')
}

function tokenizeLine(line) {
  return line
    .split(/\s+/)
    .map(normalizeWord)
    .filter((w) => w.length > 0)
}

export function splitInput(text) {
  if (!text || text.trim().length === 0) return []
  return text
    .split('\n')
    .map((line, index) => ({ key: index + 1, value: line }))
    .filter((record) => record.value.length > 0)
}

export function runMap(records, presetKey, options = {}) {
  if (!records || records.length === 0) return []

  switch (presetKey) {
    case 'word-count': {
      return records.flatMap((record) =>
        tokenizeLine(record.value).map((word) => ({ key: word, value: 1 }))
      )
    }
    case 'line-length': {
      return records.map((record) => ({
        key: `line_${record.key}`,
        value: record.value.length,
      }))
    }
    case 'char-count': {
      return records.flatMap((record) =>
        record.value
          .toLowerCase()
          .split('')
          .filter((ch) => /[a-z0-9\u00C0-\u00FF]/.test(ch))
          .map((ch) => ({ key: ch, value: 1 }))
      )
    }
    case 'filter-lines': {
      const needle = (options.filterText || '').toLowerCase()
      return records
        .filter((record) => record.value.toLowerCase().includes(needle))
        .map((record) => ({ key: 'matched', value: record.value }))
    }
    case 'word-length': {
      return records.flatMap((record) =>
        tokenizeLine(record.value).map((word) => ({
          key: `${word.length}_chars`,
          value: 1,
        }))
      )
    }
    default:
      return []
  }
}

export function runShuffle(mapped) {
  const groups = new Map()
  for (const record of mapped) {
    if (!groups.has(record.key)) {
      groups.set(record.key, [])
    }
    groups.get(record.key).push(record.value)
  }
  return Array.from(groups.entries())
    .map(([key, values]) => ({ key, values }))
    .sort((a, b) => String(a.key).localeCompare(String(b.key)))
}

export function runReduce(grouped, presetKey) {
  if (!grouped || grouped.length === 0) return []

  switch (presetKey) {
    case 'word-count':
    case 'char-count':
    case 'word-length': {
      return grouped.map((group) => ({
        key: group.key,
        value: group.values.reduce((sum, v) => sum + (Number(v) || 0), 0),
      }))
    }
    case 'line-length': {
      return grouped.map((group) => ({
        key: group.key,
        value: group.values[0],
      }))
    }
    case 'filter-lines': {
      return grouped.map((group) => ({
        key: group.key,
        value: group.values,
      }))
    }
    default:
      return []
  }
}

export function runJob(text, presetKey, options = {}) {
  const inputRecords = splitInput(text)
  const mapped = runMap(inputRecords, presetKey, options)
  const grouped = runShuffle(mapped)
  const output = runReduce(grouped, presetKey)

  return {
    inputRecords,
    mapped,
    grouped,
    output,
    stats: {
      inputRecords: inputRecords.length,
      mappedRecords: mapped.length,
      groups: grouped.length,
      outputRecords: output.length,
      uniqueKeys: grouped.length,
    },
  }
}

export function sourceCode() {
  return `// Motor do simulador de MapReduce

export function splitInput(text) {
  if (!text || text.trim().length === 0) return []
  return text
    .split('\\n')
    .map((line, index) => ({ key: index + 1, value: line }))
    .filter((record) => record.value.length > 0)
}

export function runMap(records, presetKey) {
  switch (presetKey) {
    case 'word-count':
      return records.flatMap((record) =>
        record.value
          .split(/\\s+/)
          .map((w) => w.toLowerCase().replace(/[^a-z0-9]+/g, ''))
          .filter((w) => w)
          .map((word) => ({ key: word, value: 1 }))
      )
    case 'line-length':
      return records.map((record) => ({
        key: \`line_\${record.key}\`,
        value: record.value.length,
      }))
    // ... outros presets no util completo
  }
}

export function runShuffle(mapped) {
  const groups = new Map()
  for (const record of mapped) {
    if (!groups.has(record.key)) groups.set(record.key, [])
    groups.get(record.key).push(record.value)
  }
  return Array.from(groups.entries())
    .map(([key, values]) => ({ key, values }))
    .sort((a, b) => String(a.key).localeCompare(String(b.key)))
}

export function runReduce(grouped, presetKey) {
  switch (presetKey) {
    case 'word-count':
      return grouped.map((g) => ({
        key: g.key,
        value: g.values.reduce((sum, v) => sum + v, 0),
      }))
    // ... outros presets no util completo
  }
}

export function runJob(text, presetKey) {
  const inputRecords = splitInput(text)
  const mapped = runMap(inputRecords, presetKey)
  const grouped = runShuffle(mapped)
  const output = runReduce(grouped, presetKey)
  return { inputRecords, mapped, grouped, output }
}

// Conceito: split -> map -> shuffle/sort -> reduce -> output.
// Cada "map" roda em paralelo sobre uma fatia da entrada e emite (key, value).
// O shuffle agrupa todos os valores com a mesma chave para um reducer.
`
}
