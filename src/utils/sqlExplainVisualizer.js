// PostgreSQL EXPLAIN output parser + visualizer helpers.
// Suporta os 3 formatos oficiais (FORMAT TEXT, FORMAT JSON, FORMAT YAML).
// Tudo client-side: parsing puro, zero chamada de rede.

const PROPERTY_RE = /^[A-Z][\w \-/]*:\s/
const TOP_STAT_RE = /^(Planning Time|Execution Time|Triggers):/
const HEADER_LINE_RE = /^-+$/
const QUERY_PLAN_RE = /QUERY PLAN/i
const ROWS_COUNT_RE = /^\(\d+ rows?\)$/

const COST_RE = /\(cost=([\d.]+)\.\.([\d.]+) rows=(\d+) width=(\d+)\)/
const ACTUAL_RE = /\(actual time=([\d.]+)\.\.([\d.]+) rows=(\d+) loops=(\d+)\)/
const NEVER_EXEC_RE = /\(never executed\)/
const PAREN_GROUP_RE = /\(([^()]*)\)/g

// Conhecidos para extrair properties do JSON limpo
const JSON_IGNORED_KEYS = new Set([
  'Node Type',
  'Relation Name',
  'Schema',
  'Alias',
  'Index Name',
  'Index Cond',
  'Recheck Cond',
  'Hash Cond',
  'Merge Cond',
  'Join Filter',
  'Filter',
  'Rows Removed by Filter',
  'Rows Removed by Index Recheck',
  'Output',
  'Sort Key',
  'Sort Method',
  'Sort Space Type',
  'Sort Space Used',
  'Strategy',
  'Storage',
  'Async Capable',
  'Workers Planned',
  'Workers Launched',
  'Single Copy',
  'Subplan Name',
  'CTE Name',
  'Function Call',
  'Function Name',
  'Table Function Call',
  'Cache Mode',
  'Cache Key',
  'Lossy pages',
  'Exact pages',
  'Heap Fetches',
  'I/O Timings',
  'Buffers',
  'Read',
  'Written',
  'Dirtied',
  'Hit',
  'Miss',
  'Evicted',
  'Reset',
  'Plans',
  'Plan',
  'Planning Time',
  'Execution Time',
  'Triggers',
  'Parent Relationship',
  'Startup Cost',
  'Total Cost',
  'Plan Rows',
  'Plan Width',
  'Actual Startup Time',
  'Actual Total Time',
  'Actual Rows',
  'Actual Loops',
  'Actual Block Reads',
  'Actual Block Writes',
  'Local Hit Blocks',
  'Local Read Blocks',
  'Local Dirtied Blocks',
  'Local Written Blocks',
  'Shared Hit Blocks',
  'Shared Read Blocks',
  'Shared Dirtied Blocks',
  'Shared Written Blocks',
  'Temp Read Blocks',
  'Temp Written Blocks',
  'I/O Read Time',
  'I/O Write Time',
  'Subplans Removed',
  'Time',
  'Calls',
  'Params',
  'Group Key',
  'Peak Memory Usage',
  'Disk Usage',
  'Memory Usage',
  'Buckets',
  'Batches',
  'Original Hash Buckets',
  'Original Hash Batches',
  'HashAgg Batches',
  'HashAgg Memory Usage',
  'Sample',
])

function countArrows(line) {
  // Cada "->  " na linha conta 1 nível de profundidade. As setas vêm
  // indentadas dentro da hierarquia visual do psql, então o match tolera
  // whitespace antes do primeiro "->".
  const m = line.match(/^(\s*->\s+)+/)
  if (!m) return 0
  return (m[0].match(/->/g) || []).length
}

function extractParenGroups(text) {
  // Extrai os grupos (...) top-level (não aninhados) na ordem em que aparecem.
  const groups = []
  let depth = 0
  let start = -1
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (c === '(') {
      if (depth === 0) start = i
      depth++
    } else if (c === ')') {
      depth--
      if (depth === 0) {
        groups.push(text.substring(start + 1, i))
      }
    }
  }
  return groups
}

function parseOperationHeader(header) {
  // "Seq Scan on users u" / "Index Scan using users_pkey on users" /
  // "Hash Join" / "FunctionCall on public.do_thing" / "CTE Scan c1"
  let text = header.trim().replace(/\s{2,}/g, ' ')

  // Pega a primeira palavra como "op" (até pegar em espaço).
  // Mas algumas operações têm espaço: "Hash Join", "Nested Loop",
  // "Index Only Scan", "Merge Join", "Bitmap Heap Scan", "GroupAggregate",
  // "Incremental Sort", "Limit", etc. — a heurística é: pegue até `on ` ou
  // `using ` (caso tenha relação) OU até o primeiro ` (cost=` (sem relação)
  // OU até o fim (sem cost).
  let op = ''
  let rest = ''
  const onMatch = text.match(/^(.+?)\s+on\s+(.+)/i)
  const usingMatch = !onMatch && text.match(/^(.+?)\s+using\s+([\w_$\-"'.]+)\s+on\s+(.+)/i)
  if (usingMatch) {
    op = `${usingMatch[1].trim()} using`
    rest = `${usingMatch[2]} on ${usingMatch[3]}`
  } else if (onMatch) {
    op = onMatch[1].trim()
    rest = onMatch[2]
  } else {
    op = text.trim()
    rest = ''
  }

  let relation = ''
  let alias = ''
  let indexName = ''
  let schema = ''

  if (rest) {
    // "users" / "users u_alias" / "schema.table" / "schema.table alias"
    // Schema.table com alias: tenta quebrar nos espaços.
    const parts = rest.trim().split(/\s+/)
    if (parts.length >= 1) {
      const firstToken = parts[0]
      const dotParts = firstToken.split('.')
      if (dotParts.length === 2) {
        schema = dotParts[0]
        relation = dotParts[1]
      } else {
        relation = firstToken
      }
    }
    if (parts.length >= 2) {
      alias = parts[1]
    }
  }

  // indexName já está embutido no `op` (no caso do usingMatch)
  if (usingMatch) {
    indexName = usingMatch[2]
  }

  return { operation: op, relation, alias, schema, indexName }
}

function parseCostGroup(groupStr) {
  const m = groupStr.match(/^cost=([\d.]+)\.\.([\d.]+) rows=(\d+) width=(\d+)$/)
  if (!m) return null
  return {
    startCost: parseFloat(m[1]),
    totalCost: parseFloat(m[2]),
    planRows: parseInt(m[3], 10),
    planWidth: parseInt(m[4], 10),
  }
}

function parseActualGroup(groupStr) {
  const m = groupStr.match(/^actual time=([\d.]+)\.\.([\d.]+) rows=(\d+) loops=(\d+)$/)
  if (!m) return null
  return {
    actualStartTime: parseFloat(m[1]),
    actualTotalTime: parseFloat(m[2]),
    actualRows: parseInt(m[3], 10),
    actualLoops: parseInt(m[4], 10),
  }
}

function parseNodeLine(line) {
  // Remove (never executed) sentinel, processa o resto
  let rest = line.trim()
  let neverExecuted = false
  if (NEVER_EXEC_RE.test(rest)) {
    neverExecuted = true
    rest = rest.replace(NEVER_EXEC_RE, '').trim()
  }

  // Achar a posição do primeiro (cost=...) ou do fim
  const costMatch = rest.match(/\(cost=([\d.]+)\.\.([\d.]+) rows=(\d+) width=(\d+)\)/)
  const actualMatch = rest.match(/\(actual time=/)

  // O cabeçalho da operação vai até o primeiro "(cost=" ou "("
  let header = ''
  let costIdx = costMatch ? rest.indexOf(costMatch[0]) : -1
  let firstParen = rest.indexOf('(')
  if (costIdx >= 0) {
    header = rest.substring(0, costIdx)
  } else if (firstParen >= 0) {
    header = rest.substring(0, firstParen)
  } else {
    header = rest
  }
  header = header.trim()

  const parsedHeader = parseOperationHeader(header)

  // Pega todos os grupos (...) na linha
  const groups = extractParenGroups(rest)

  let cost = null
  let actual = null
  for (const g of groups) {
    const c = parseCostGroup(g)
    if (c) {
      cost = c
      continue
    }
    const a = parseActualGroup(g)
    if (a) {
      actual = a
      continue
    }
  }

  return {
    ...parsedHeader,
    startCost: cost ? cost.startCost : null,
    totalCost: cost ? cost.totalCost : null,
    planRows: cost ? cost.planRows : null,
    planWidth: cost ? cost.planWidth : null,
    actualStartTime: actual ? actual.actualStartTime : null,
    actualTotalTime: actual ? actual.actualTotalTime : null,
    actualRows: actual ? actual.actualRows : null,
    actualLoops: actual ? actual.actualLoops : null,
    neverExecuted,
  }
}

function makeEmptyNode(overrides = {}) {
  return {
    operation: '',
    relation: '',
    alias: '',
    schema: '',
    indexName: '',
    startCost: null,
    totalCost: null,
    planRows: null,
    planWidth: null,
    actualStartTime: null,
    actualTotalTime: null,
    actualRows: null,
    actualLoops: null,
    neverExecuted: false,
    children: [],
    properties: [],
    ...overrides,
  }
}

// =============================================================================
// TEXT PARSER
// =============================================================================

export function parseTextPlan(text) {
  const lines = text.split('\n')
  const dataLines = []
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i]
    const t = l.trim()
    if (!t) continue
    if (QUERY_PLAN_RE.test(t)) continue
    if (HEADER_LINE_RE.test(t)) continue
    if (ROWS_COUNT_RE.test(t)) continue
    dataLines.push(l)
  }

  if (dataLines.length === 0) {
    return { ok: false, error: 'empty', message: 'Nenhuma linha para analisar.' }
  }

  const root = makeEmptyNode({ operation: '__root__' })
  const stack = [root]
  const topStats = []

  for (const rawLine of dataLines) {
    const arrows = countArrows(rawLine)
    const content = rawLine.replace(/^(\s*->\s+)+\s*/, '').trim()
    if (!content) continue

    const isTopStat = TOP_STAT_RE.test(content)
    const isProperty = !isTopStat && PROPERTY_RE.test(content)

    // Top-level stats primeiro — "Planning Time" / "Execution Time" também
    // casam PROPERTY_RE (começam com maiúscula, dois pontos depois), e
    // queremos eles em topStats, não como filho do nó anterior.
    if (isTopStat) {
      topStats.push(content)
      continue
    }

    // Properties ligam ao nó mais recente sem mexer no stack — psql
    // indenta propriedades embaixo do nó pai sem desenhar `->`, então
    // contar `->` como profundidade engana: uma linha `         Filter:`
    // (depth 0 arrows) é filha do último nó (Seq Scan com 1 arrow), não
    // da raiz. Stack stays put.
    if (isProperty) {
      const parent = stack[stack.length - 1]
      if (parent) parent.properties.push(content)
      continue
    }

    // É um nó novo: ajusta o stack para o nível certo.
    while (stack.length > arrows + 1) stack.pop()
    if (stack.length < arrows + 1) {
      // Defesa contra input malformado (setas a mais sem níveis no meio).
      // Criamos orphan fillers para não perder a estrutura.
      while (stack.length < arrows + 1) {
        const orphan = makeEmptyNode({ operation: '__orphan__' })
        const p = stack[stack.length - 1]
        p.children.push(orphan)
        stack.push(orphan)
      }
    }

    const parent = stack[stack.length - 1]
    const node = makeEmptyNode()
    const parsed = parseNodeLine(content)
    Object.assign(node, parsed)
    node.children = []
    node.properties = []

    parent.children.push(node)
    stack.push(node)
  }

  const realChildren = root.children.filter((c) => c.operation !== '__orphan__')
  if (realChildren.length === 0) {
    return { ok: false, error: 'no-nodes', message: 'Nenhum nó de plano encontrado.' }
  }

  if (realChildren.length > 1) {
    return {
      ok: false,
      error: 'multiple-roots',
      message: 'Encontradas múltiplas raízes no plano — verifique se colou só uma saída EXPLAIN.',
    }
  }

  const plan = realChildren[0]
  const totals = computeTotals(plan, topStats)

  return { ok: true, format: 'text', root: plan, topStats, totals }
}

// =============================================================================
// JSON PARSER
// =============================================================================

export function parseJsonPlan(jsonText) {
  let data
  try {
    data = JSON.parse(jsonText)
  } catch (e) {
    return { ok: false, error: 'json-parse', message: `JSON inválido: ${e.message}` }
  }

  const arr = Array.isArray(data) ? data : [data]
  if (arr.length === 0) {
    return { ok: false, error: 'empty', message: 'JSON vazio.' }
  }
  if (arr.length > 1) {
    return {
      ok: false,
      error: 'multiple-roots',
      message: 'O JSON tem mais de um plano (vetor de planos). Cole apenas um.',
    }
  }

  const rootObj = arr[0]
  if (!rootObj || !rootObj.Plan) {
    return {
      ok: false,
      error: 'no-plan',
      message: 'JSON não tem a chave "Plan" no nível raiz.',
    }
  }

  const plan = convertJsonNode(rootObj.Plan)
  const topStats = []
  if (rootObj['Planning Time'] !== undefined) {
    topStats.push(`Planning Time: ${rootObj['Planning Time']} ms`)
  }
  if (rootObj['Execution Time'] !== undefined) {
    topStats.push(`Execution Time: ${rootObj['Execution Time']} ms`)
  }
  if (rootObj['Triggers']) {
    topStats.push(`Triggers: ${JSON.stringify(rootObj['Triggers'])}`)
  }

  const totals = computeTotals(plan, topStats)

  return { ok: true, format: 'json', root: plan, topStats, totals }
}

function convertJsonNode(json) {
  const node = makeEmptyNode()
  node.operation = json['Node Type'] || ''
  node.relation = json['Relation Name'] || ''
  node.alias = json['Alias'] || ''
  node.schema = json['Schema'] || ''
  node.indexName = json['Index Name'] || ''
  node.startCost = json['Startup Cost']
  node.totalCost = json['Total Cost']
  node.planRows = json['Plan Rows']
  node.planWidth = json['Plan Width']
  node.actualStartTime = json['Actual Startup Time']
  node.actualTotalTime = json['Actual Total Time']
  node.actualRows = json['Actual Rows']
  node.actualLoops = json['Actual Loops']
  node.neverExecuted = json['Actual Rows'] === 0 && json['Actual Loops'] === 0

  // Properties = todas as chaves não-especiais
  for (const [k, v] of Object.entries(json)) {
    if (JSON_IGNORED_KEYS.has(k)) continue
    if (k === 'Plans') continue
    let valStr
    if (typeof v === 'string') {
      valStr = v
    } else {
      valStr = JSON.stringify(v)
    }
    node.properties.push(`${k}: ${valStr}`)
  }

  // Sub-plans recursivos
  if (Array.isArray(json['Plans'])) {
    node.children = json['Plans'].map(convertJsonNode)
  } else {
    node.children = []
  }

  return node
}

// =============================================================================
// YAML PARSER (formato `EXPLAIN (FORMAT YAML)` do PostgreSQL)
// O YAML do EXPLAIN é simples: aninhamento por indentação, escalares chatos.
// Implementamos só o subconjunto que o EXPLAIN realmente emite:
// - mapas com `chave: valor`
// - listas com `- item`
// - strings com aspas (simples ou duplas)
// - números
// - booleanos null true false
// =============================================================================

export function parseYamlPlan(yamlText) {
  let json
  try {
    json = yamlToJson(yamlText)
  } catch (e) {
    return { ok: false, error: 'yaml-parse', message: `YAML inválido: ${e.message}` }
  }

  // O YAML do EXPLAIN é um único mapa-raiz com "Plan" no topo
  if (!json || typeof json !== 'object' || Array.isArray(json)) {
    return { ok: false, error: 'yaml-shape', message: 'Formato YAML não reconhecido.' }
  }

  if (!json.Plan) {
    return {
      ok: false,
      error: 'no-plan',
      message: 'YAML não tem a chave "Plan" no nível raiz.',
    }
  }

  // O Plan pode vir como { Plan: { ... } } ou { Plan: [ { ... } ] }
  let planJson
  if (Array.isArray(json.Plan)) {
    planJson = json.Plan[0]
  } else {
    planJson = json.Plan
  }
  if (!planJson) {
    return { ok: false, error: 'empty', message: 'YAML vazio.' }
  }

  // Embrulha em { Plan: planJson } e reusa o parser JSON
  const wrapped = { Plan: planJson }
  if (json['Planning Time'] !== undefined) wrapped['Planning Time'] = json['Planning Time']
  if (json['Execution Time'] !== undefined) wrapped['Execution Time'] = json['Execution Time']
  if (json['Triggers']) wrapped['Triggers'] = json['Triggers']

  return parseJsonPlan(JSON.stringify(wrapped))
}

function yamlToJson(text) {
  // Parser minimalista: tokens por linha, indentação = nível, lista começa em `-`
  // Suporta o subconjunto suficiente pro EXPLAIN.
  const lines = text.split('\n').map((l) => l.replace(/\s+$/, ''))
  const tokens = []
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (!line.trim() || line.trim().startsWith('#')) continue
    const indent = line.match(/^(\s*)/)[1].length
    tokens.push({ indent, content: line.trim(), line: i })
  }

  let pos = 0

  function parseBlock(minIndent) {
    // Parseia um bloco até a indentação cair abaixo de minIndent
    // Se a primeira linha começar com "- ", é uma lista
    if (pos >= tokens.length) return null
    const first = tokens[pos]
    if (first.indent < minIndent) return null

    if (first.content.startsWith('- ')) {
      const arr = []
      while (pos < tokens.length && tokens[pos].indent === first.indent && tokens[pos].content.startsWith('- ')) {
        // Cada item pode ser:
        //   - key: value  (item de mapa)
        //   - key:\n       (item com sub-bloco)
        //     subkey: ...
        //   - value          (item escalar)
        const itemLine = tokens[pos].content.substring(2).trim()
        // Caso "key: value"
        const kvMatch = itemLine.match(/^([\w "'.+-]+):\s*(.*)$/)
        if (kvMatch) {
          const key = unquoteYamlString(kvMatch[1])
          const inlineVal = kvMatch[2].trim()
          if (inlineVal === '') {
            // Próximo token tem indent > tokens[pos].indent → sub-bloco do mapa
            pos++
            const childIndent = tokens[pos] ? tokens[pos].indent : first.indent + 2
            const sub = parseBlock(childIndent)
            arr.push({ [key]: sub })
          } else if (inlineVal === '|') {
            pos++
            arr.push({ [key]: parseYamlMultiline(first.indent + 2) })
          } else if (inlineVal === '>') {
            pos++
            arr.push({ [key]: parseYamlFolded(first.indent + 2) })
          } else {
            arr.push({ [key]: unquoteYamlValue(inlineVal) })
            pos++
          }
        } else {
          // Item escalar puro
          arr.push(unquoteYamlValue(itemLine))
          pos++
        }
      }
      return arr
    }

    // Mapa
    const obj = {}
    while (pos < tokens.length && tokens[pos].indent >= minIndent && !tokens[pos].content.startsWith('- ')) {
      const line = tokens[pos]
      const kvMatch = line.content.match(/^([\w "'.+-]+):\s*(.*)$/)
      if (!kvMatch) {
        pos++
        continue
      }
      const key = unquoteYamlString(kvMatch[1])
      const inlineVal = kvMatch[2].trim()
      if (inlineVal === '') {
        pos++
        // Próximo token tem indent > line.indent?
        const childIndent = tokens[pos] ? tokens[pos].indent : line.indent + 2
        if (tokens[pos] && childIndent > line.indent) {
          const sub = parseBlock(childIndent)
          obj[key] = sub
        } else {
          obj[key] = null
        }
      } else if (inlineVal === '|') {
        pos++
        obj[key] = parseYamlMultiline(line.indent + 2)
      } else if (inlineVal === '>') {
        pos++
        obj[key] = parseYamlFolded(line.indent + 2)
      } else {
        obj[key] = unquoteYamlValue(inlineVal)
        pos++
      }
    }
    return obj
  }

  return parseBlock(0)
}

function unquoteYamlString(s) {
  s = s.trim()
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.substring(1, s.length - 1)
  }
  return s
}

function unquoteYamlValue(s) {
  s = s.trim()
  if (s === 'null' || s === '~') return null
  if (s === 'true') return true
  if (s === 'false') return false
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.substring(1, s.length - 1)
  }
  if (/^-?\d+$/.test(s)) return parseInt(s, 10)
  if (/^-?\d+\.\d+$/.test(s)) return parseFloat(s)
  return s
}

function parseYamlMultiline(minIndent) {
  const buf = []
  while (pos < tokens.length && tokens[pos].indent >= minIndent) {
    buf.push(tokens[pos].content.substring(minIndent))
    pos++
  }
  return buf.join('\n').replace(/\n+$/, '')
}

function parseYamlFolded(minIndent) {
  const buf = []
  while (pos < tokens.length && tokens[pos].indent >= minIndent) {
    buf.push(tokens[pos].content.substring(minIndent))
    pos++
  }
  return buf.join(' ').trim()
}

// =============================================================================
// FORMAT DETECTION
// =============================================================================

export function detectFormat(text) {
  const trimmed = text.trim()
  if (!trimmed) return 'text'

  // JSON: começa com { ou [ após whitespace. Mesmo se o parse falhar,
  // devolvemos 'json' pro usuário ter uma mensagem de erro específica em
  // vez do text-parser aceitar lixo como se fosse plano.
  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed)
      if (Array.isArray(parsed)) {
        return parsed.length > 0 && parsed[0].Plan ? 'json' : 'text'
      }
      if (typeof parsed === 'object' && parsed !== null) {
        return parsed.Plan ? 'json' : 'text'
      }
      return 'text'
    } catch (e) {
      return 'json'
    }
  }

  // YAML: começa com "- " ou chave: valor na linha 0 sem indentação
  const firstLine = trimmed.split('\n')[0].trim()
  if (firstLine.startsWith('- ')) {
    return 'yaml'
  }
  if (/^[A-Za-z][\w "'.+-]*:\s/.test(firstLine) && !firstLine.startsWith('->') && !firstLine.includes('(cost=')) {
    const lines = trimmed.split('\n').slice(0, 10)
    const hasYamlIndent = lines.some((l, i) => i > 0 && /^\s{2,}/.test(l) && /^[A-Za-z][\w ]*:\s/.test(l.trim()))
    if (hasYamlIndent) return 'yaml'
  }

  return 'text'
}

// =============================================================================
// TOTALS / STATISTICS
// =============================================================================

function computeTotals(root, topStats) {
  // Soma maxCost (custo total do nó raiz), maxTime (tempo total se ANALYZE),
  // e percorre a árvore para encontrar:
  //   - maxCost (maior Total Cost)
  //   - maxTime (maior Actual Total Time)
  //   - planRowsTotal (maior Plan Rows × Actual Loops)
  //   - nodeCount (número total de nós)
  //   - maxDepth (profundidade da árvore)
  let maxCost = 0
  let maxTime = 0
  let planRowsTotal = 0
  let actualRowsTotal = 0
  let nodeCount = 0
  let maxDepth = 0
  let bottleneckByCost = null
  let bottleneckByTime = null

  function walk(node, depth) {
    nodeCount++
    if (depth > maxDepth) maxDepth = depth
    if (node.totalCost != null && node.totalCost > maxCost) maxCost = node.totalCost
    if (node.actualTotalTime != null && node.actualTotalTime > maxTime) maxTime = node.actualTotalTime
    if (node.planRows != null) {
      const loops = node.actualLoops || 1
      planRowsTotal = Math.max(planRowsTotal, node.planRows * loops)
    }
    if (node.actualRows != null) {
      actualRowsTotal = Math.max(actualRowsTotal, node.actualRows * (node.actualLoops || 1))
    }
    if (
      node.totalCost != null &&
      (!bottleneckByCost || node.totalCost > bottleneckByCost.totalCost)
    ) {
      bottleneckByCost = node
    }
    if (
      node.actualTotalTime != null &&
      (!bottleneckByTime || node.actualTotalTime > bottleneckByTime.actualTotalTime)
    ) {
      bottleneckByTime = node
    }
    for (const child of node.children || []) {
      walk(child, depth + 1)
    }
  }

  walk(root, 0)

  // Planning Time / Execution Time dos topStats
  let planningTime = null
  let executionTime = null
  for (const s of topStats) {
    const planMatch = s.match(/^Planning Time:\s*([\d.]+)/)
    const execMatch = s.match(/^Execution Time:\s*([\d.]+)/)
    if (planMatch) planningTime = parseFloat(planMatch[1])
    if (execMatch) executionTime = parseFloat(execMatch[1])
  }

  return {
    maxCost,
    maxTime,
    planRowsTotal,
    actualRowsTotal,
    nodeCount,
    maxDepth,
    bottleneckByCost,
    bottleneckByTime,
    planningTime,
    executionTime,
  }
}

// =============================================================================
// SAMPLES
// =============================================================================

export const SAMPLES = [
  {
    key: 'simple-index',
    label: { pt: 'Index Scan simples', en: 'Simple Index Scan' },
    value: ` Index Scan using users_pkey on users  (cost=0.43..8.45 rows=1 width=42)
   Index Cond: (id = 1)
`,
  },
  {
    key: 'nested-loop-analyze',
    label: { pt: 'Nested Loop + ANALYZE', en: 'Nested Loop + ANALYZE' },
    value: ` Nested Loop  (cost=0.00..1502.50 rows=5000 width=84) (actual time=0.123..50.456 rows=4800 loops=1)
   ->  Seq Scan on users u  (cost=0.00..125.00 rows=5000 width=42) (actual time=0.045..12.345 rows=5000 loops=1)
         Filter: (active = true)
         Rows Removed by Filter: 200
   ->  Hash  (cost=20.00..20.00 rows=1000 width=8) (actual time=0.025..0.025 rows=1000 loops=1)
         Buckets: 1024  Batches: 1  Memory Usage: 25kB
         ->  Seq Scan on teams t  (cost=20.00..20.00 rows=1000 width=8) (actual time=0.015..0.015 rows=1000 loops=1)
 Planning Time: 0.150 ms
 Execution Time: 50.456 ms
`,
  },
  {
    key: 'hash-join',
    label: { pt: 'Hash Join com filtro', en: 'Hash Join with filter' },
    value: ` Hash Join  (cost=30.50..350.50 rows=1000 width=50) (actual time=0.123..45.678 rows=4800 loops=1)
   Hash Cond: (u.team_id = t.id)
   ->  Seq Scan on users u  (cost=0.00..125.00 rows=5000 width=42) (actual time=0.012..12.345 rows=5000 loops=1)
         Filter: (active = true)
         Rows Removed by Filter: 200
   ->  Hash  (cost=20.00..20.00 rows=1000 width=8) (actual time=0.025..0.025 rows=1000 loops=1)
         Buckets: 1024  Batches: 1  Memory Usage: 25kB
         ->  Seq Scan on teams t  (cost=20.00..20.00 rows=1000 width=8) (actual time=0.015..0.015 rows=1000 loops=1)
 Planning Time: 0.150 ms
 Execution Time: 50.456 ms
`,
  },
  {
    key: 'json-format',
    label: { pt: 'JSON format', en: 'JSON format' },
    value: `[
  {
    "Plan": {
      "Node Type": "Hash Join",
      "Join Type": "Inner",
      "Startup Cost": 30.50,
      "Total Cost": 350.50,
      "Plan Rows": 1000,
      "Plan Width": 50,
      "Actual Startup Time": 0.123,
      "Actual Total Time": 45.678,
      "Actual Rows": 4800,
      "Actual Loops": 1,
      "Hash Cond": "(u.team_id = t.id)",
      "Plans": [
        {
          "Node Type": "Seq Scan",
          "Relation Name": "users",
          "Alias": "u",
          "Startup Cost": 0.00,
          "Total Cost": 125.00,
          "Plan Rows": 5000,
          "Plan Width": 42,
          "Filter": "(active = true)",
          "Rows Removed by Filter": 200
        },
        {
          "Node Type": "Hash",
          "Startup Cost": 20.00,
          "Total Cost": 20.00,
          "Plan Rows": 1000,
          "Plan Width": 8,
          "Plans": [
            {
              "Node Type": "Seq Scan",
              "Relation Name": "teams",
              "Alias": "t",
              "Startup Cost": 20.00,
              "Total Cost": 20.00,
              "Plan Rows": 1000,
              "Plan Width": 8
            }
          ]
        }
      ]
    },
    "Planning Time": 0.150,
    "Execution Time": 50.456
  }
]`,
  },
]

// =============================================================================
// OPERATION CATEGORY (para coloração)
// =============================================================================

const OPERATION_KIND = {
  SCAN: [
    'Seq Scan',
    'Index Scan',
    'Index Only Scan',
    'Bitmap Heap Scan',
    'Bitmap Index Scan',
    'CTE Scan',
    'Function Scan',
    'Subquery Scan',
    'Values Scan',
    'Sample Scan',
    'Custom Scan',
    'Foreign Scan',
    'Gather',
    'Gather Merge',
  ],
  JOIN: ['Nested Loop', 'Hash Join', 'Merge Join'],
  AGGREGATE: ['Aggregate', 'GroupAggregate', 'HashAggregate', 'MixedAggregate', 'WindowAgg'],
  SORT: ['Sort', 'Incremental Sort', 'Materialize'],
  LIMIT: ['Limit'],
  RESULT: ['Result'],
  OTHER: ['Append', 'MergeAppend', 'Unique', 'SetOp', 'Hash', 'BitmapAnd', 'BitmapOrInit', 'LockRows', 'ModifyTable', 'Insert', 'Update', 'Delete'],
}

export function operationKind(op) {
  if (!op) return 'OTHER'
  for (const [kind, ops] of Object.entries(OPERATION_KIND)) {
    if (ops.includes(op)) return kind
  }
  // Heurística: qualquer coisa com "Scan" → SCAN, "Join" → JOIN, "Agg" → AGGREGATE
  if (/scan$/i.test(op)) return 'SCAN'
  if (/join/i.test(op)) return 'JOIN'
  if (/aggregate/i.test(op)) return 'AGGREGATE'
  if (/sort/i.test(op)) return 'SORT'
  return 'OTHER'
}

export const KIND_COLORS = {
  SCAN: '#1677ff',
  JOIN: '#722ed1',
  AGGREGATE: '#13c2c2',
  SORT: '#fa8c16',
  LIMIT: '#52c41a',
  RESULT: '#bfbfbf',
  OTHER: '#8c8c8c',
}

export const KIND_LABEL = {
  pt: {
    SCAN: 'Leitura',
    JOIN: 'Junção',
    AGGREGATE: 'Agregação',
    SORT: 'Ordenação',
    LIMIT: 'Limite',
    RESULT: 'Resultado',
    OTHER: 'Outro',
  },
  en: {
    SCAN: 'Scan',
    JOIN: 'Join',
    AGGREGATE: 'Aggregate',
    SORT: 'Sort',
    LIMIT: 'Limit',
    RESULT: 'Result',
    OTHER: 'Other',
  },
}

// =============================================================================
// ENGINE SOURCE (para mostrar como funciona)
// =============================================================================

export const ENGINE_SOURCE = `// parser mínimo de EXPLAIN text format (~40 linhas reais)
const ARROW = /^(\\s*->\\s+)+\\s*/;
const PROP = /^[A-Z][\\w \\-/]*:\\s/;   // "Filter:", "Hash Cond:"

function parseTextPlan(text) {
  const root = { children: [], properties: [] };
  const stack = [root];                  // ancestrais mais recentes por depth
  for (const raw of text.split('\\n')) {
    if (!raw.trim() || /^-+$/.test(raw.trim())) continue;
    if (/QUERY PLAN/i.test(raw)) continue;
    const arrows = (raw.match(ARROW)?.[0].match(/->/g) || []).length;
    const content = raw.replace(ARROW, '').trim();
    while (stack.length > arrows + 1) stack.pop();     // sobe para o pai certo
    const parent = stack[stack.length - 1];
    if (PROP.test(content)) {
      parent.properties.push(content);   // propriedade do nó anterior
    } else if (/^Planning Time|^Execution Time/.test(content)) {
      /* stats top-level, ignoradas aqui */
    } else {
      const node = parseNodeText(content);
      parent.children.push(node);
      stack.push(node);
    }
  }
  return root.children[0];
}`