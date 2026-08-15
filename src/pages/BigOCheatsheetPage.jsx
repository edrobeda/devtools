import React, { useMemo, useState } from 'react'
import { Typography, Card, Space, Input, Radio, Table, Tag, Alert, Slider, Row, Col } from 'antd'
import { ReadOutlined, SearchOutlined, LineChartOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const COMPLEXITY_ORDER = ['O(1)', 'O(log n)', 'O(√n)', 'O(n)', 'O(n log n)', 'O(n²)', 'O(n³)', 'O(2ⁿ)', 'O(n!)']

const COMPLEXITY_META = {
  'O(1)': { color: 'green', rank: 1, pt: 'Tempo constante — não depende do tamanho da entrada.', en: 'Constant time — does not depend on input size.' },
  'O(log n)': { color: 'cyan', rank: 2, pt: 'Logarítmico — dobra o input e só aumenta uma etapa.', en: 'Logarithmic — doubling the input only adds one step.' },
  'O(√n)': { color: 'blue', rank: 3, pt: 'Raiz quadrada — mais lento que log, mas ainda escalável.', en: 'Square root — slower than log, but still scalable.' },
  'O(n)': { color: 'geekblue', rank: 4, pt: 'Linear — cresce na mesma proporção do input.', en: 'Linear — grows in direct proportion to the input.' },
  'O(n log n)': { color: 'purple', rank: 5, pt: 'Linearítmico — típico de ordenações eficientes.', en: 'Linearithmic — typical of efficient sorting algorithms.' },
  'O(n²)': { color: 'orange', rank: 6, pt: 'Quadrático — loops aninhados; fica ruim rápido.', en: 'Quadratic — nested loops; gets bad quickly.' },
  'O(n³)': { color: 'volcano', rank: 7, pt: 'Cúbico — três loops aninhados; raramente aceitável.', en: 'Cubic — three nested loops; rarely acceptable.' },
  'O(2ⁿ)': { color: 'red', rank: 8, pt: 'Exponencial — cada item dobra o trabalho.', en: 'Exponential — each item doubles the work.' },
  'O(n!)': { color: 'magenta', rank: 9, pt: 'Fatorial — impraticável exceto para entradas minúsculas.', en: 'Factorial — impractical except for tiny inputs.' },
}

const NOTATIONS = [
  { notation: 'O(1)', pt: 'Limite superior apertado — pior caso.', en: 'Tight upper bound — worst case.' },
  { notation: 'Ω(1)', pt: 'Limite inferior apertado — melhor caso.', en: 'Tight lower bound — best case.' },
  { notation: 'Θ(1)', pt: 'Limite apertado tanto por cima quanto por baixo.', en: 'Tight bound from above and below.' },
  { notation: 'o(1)', pt: 'Limite superior solto (estritamente menor).', en: 'Loose upper bound (strictly smaller).' },
  { notation: 'ω(1)', pt: 'Limite inferior solto (estritamente maior).', en: 'Loose lower bound (strictly larger).' },
]

const SORTING = [
  { name: 'Quick Sort', best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n²)', space: 'O(log n)', stable: false, pt: 'Divide em partições ao redor de um pivô.', en: 'Divides into partitions around a pivot.' },
  { name: 'Merge Sort', best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n log n)', space: 'O(n)', stable: true, pt: 'Divide e conquista com intercalação garantida.', en: 'Divide-and-conquer with guaranteed merging.' },
  { name: 'Heap Sort', best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n log n)', space: 'O(1)', stable: false, pt: 'Usa heap binária para ordenar no lugar.', en: 'Uses a binary heap to sort in-place.' },
  { name: 'Tim Sort', best: 'O(n)', average: 'O(n log n)', worst: 'O(n log n)', space: 'O(n)', stable: true, pt: 'Híbrido de Merge + Insertion usado pelo Python/Java.', en: 'Merge + Insertion hybrid used by Python/Java.' },
  { name: 'Insertion Sort', best: 'O(n)', average: 'O(n²)', worst: 'O(n²)', space: 'O(1)', stable: true, pt: 'Bom para arrays pequenos ou quase ordenados.', en: 'Good for small or nearly sorted arrays.' },
  { name: 'Selection Sort', best: 'O(n²)', average: 'O(n²)', worst: 'O(n²)', space: 'O(1)', stable: false, pt: 'Sempre seleciona o próximo menor elemento.', en: 'Always selects the next smallest element.' },
  { name: 'Bubble Sort', best: 'O(n)', average: 'O(n²)', worst: 'O(n²)', space: 'O(1)', stable: true, pt: 'Comparações adjacentes; mais didático que útil.', en: 'Adjacent comparisons; more educational than useful.' },
  { name: 'Counting Sort', best: 'O(n + k)', average: 'O(n + k)', worst: 'O(n + k)', space: 'O(k)', stable: true, pt: 'Conta frequências; requer range conhecido de inteiros.', en: 'Counts frequencies; requires known integer range.' },
  { name: 'Radix Sort', best: 'O(nk)', average: 'O(nk)', worst: 'O(nk)', space: 'O(n + k)', stable: true, pt: 'Ordena dígito a dígito; k = número de dígitos.', en: 'Sorts digit by digit; k = number of digits.' },
  { name: 'Bucket Sort', best: 'O(n + k)', average: 'O(n + k)', worst: 'O(n²)', space: 'O(n + k)', stable: true, pt: 'Distribui em buckets e ordena cada um.', en: 'Distributes into buckets and sorts each bucket.' },
]

const SEARCH = [
  { name: 'Linear Search', best: 'O(1)', average: 'O(n)', worst: 'O(n)', space: 'O(1)', pt: 'Percorre elemento por elemento.', en: 'Checks element by element.' },
  { name: 'Binary Search', best: 'O(1)', average: 'O(log n)', worst: 'O(log n)', space: 'O(1)', pt: 'Requer array ordenado; divide ao meio.', en: 'Requires sorted array; halves the search space.' },
  { name: 'DFS (Graph)', best: 'O(V + E)', average: 'O(V + E)', worst: 'O(V + E)', space: 'O(V)', pt: 'Busca em profundidade em grafos/árvores.', en: 'Depth-first search on graphs/trees.' },
  { name: 'BFS (Graph)', best: 'O(V + E)', average: 'O(V + E)', worst: 'O(V + E)', space: 'O(V)', pt: 'Busca em largura em grafos/árvores.', en: 'Breadth-first search on graphs/trees.' },
  { name: 'Dijkstra', best: 'O((V + E) log V)', average: 'O((V + E) log V)', worst: 'O((V + E) log V)', space: 'O(V)', pt: 'Menor caminho sem pesos negativos.', en: 'Shortest path without negative weights.' },
  { name: 'A* Search', best: 'O(E)', average: 'O(E)', worst: 'O(V!)', space: 'O(V)', pt: 'Heurística informada para pathfinding.', en: 'Informed heuristic for pathfinding.' },
]

const DATA_STRUCTURES = [
  { name: 'Array', access: 'O(1)', search: 'O(n)', insert: 'O(n)', delete: 'O(n)', space: 'O(n)', pt: 'Acesso rápido por índice, inserção/deleção custosa.', en: 'Fast index access, costly insert/delete.' },
  { name: 'Dynamic Array', access: 'O(1)', search: 'O(n)', insert: 'O(1) amortized', delete: 'O(n)', space: 'O(n)', pt: 'Array que redimensiona automaticamente.', en: 'Array that automatically resizes.' },
  { name: 'Linked List', access: 'O(n)', search: 'O(n)', insert: 'O(1)', delete: 'O(1)', space: 'O(n)', pt: 'Inserção/deleção rápida, acesso sequencial.', en: 'Fast insert/delete, sequential access.' },
  { name: 'Stack', access: 'O(n)', search: 'O(n)', insert: 'O(1)', delete: 'O(1)', space: 'O(n)', pt: 'LIFO — último a entrar, primeiro a sair.', en: 'LIFO — last in, first out.' },
  { name: 'Queue', access: 'O(n)', search: 'O(n)', insert: 'O(1)', delete: 'O(1)', space: 'O(n)', pt: 'FIFO — primeiro a entrar, primeiro a sair.', en: 'FIFO — first in, first out.' },
  { name: 'Hash Table', access: 'N/A', search: 'O(1) average', insert: 'O(1) average', delete: 'O(1) average', space: 'O(n)', pt: 'Mapeamento chave-valor com hash.', en: 'Key-value mapping using hashing.' },
  { name: 'Binary Search Tree', access: 'O(log n)', search: 'O(log n)', insert: 'O(log n)', delete: 'O(log n)', space: 'O(n)', pt: 'Árvore ordenada; balanceada assume log.', en: 'Ordered tree; assumes balanced for log.' },
  { name: 'AVL Tree', access: 'O(log n)', search: 'O(log n)', insert: 'O(log n)', delete: 'O(log n)', space: 'O(n)', pt: 'Árvore binária auto-balanceada.', en: 'Self-balancing binary search tree.' },
  { name: 'Red-Black Tree', access: 'O(log n)', search: 'O(log n)', insert: 'O(log n)', delete: 'O(log n)', space: 'O(n)', pt: 'Árvore balanceada com regras de cor.', en: 'Balanced tree with color rules.' },
  { name: 'Heap (Binary)', access: 'O(n)', search: 'O(n)', insert: 'O(log n)', delete: 'O(log n)', space: 'O(n)', pt: 'Eficiente para filas de prioridade.', en: 'Efficient for priority queues.' },
  { name: 'B-Tree', access: 'O(log n)', search: 'O(log n)', insert: 'O(log n)', delete: 'O(log n)', space: 'O(n)', pt: 'Otimizado para leitura/escrita em disco.', en: 'Optimized for disk read/write.' },
  { name: 'Trie', access: 'O(L)', search: 'O(L)', insert: 'O(L)', delete: 'O(L)', space: 'O(ALPHABET × L)', pt: 'Árvore de prefixos; L = comprimento da chave.', en: 'Prefix tree; L = key length.' },
  { name: 'Graph (Adj. List)', access: 'O(1)', search: 'O(V + E)', insert: 'O(1)', delete: 'O(V + E)', space: 'O(V + E)', pt: 'Representação esparsa de grafos.', en: 'Sparse graph representation.' },
  { name: 'Graph (Adj. Matrix)', access: 'O(1)', search: 'O(V²)', insert: 'O(1)', delete: 'O(1)', space: 'O(V²)', pt: 'Representação densa de grafos.', en: 'Dense graph representation.' },
]

function rankOf(value) {
  return COMPLEXITY_META[value]?.rank ?? 99
}

function ComplexityTag({ value }) {
  const meta = COMPLEXITY_META[value]
  return <Tag color={meta?.color || 'default'}>{value}</Tag>
}

function growthPoints(selectedN) {
  const values = [1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024]
  const result = []
  for (const n of values) {
    if (n > selectedN) break
    result.push({ n, 'O(1)': 1, 'O(log n)': Math.log2(n) || 0.1, 'O(n)': n, 'O(n log n)': n * (Math.log2(n) || 1), 'O(n²)': n * n })
  }
  return result
}

const translations = {
  pt: {
    title: 'Cheat Sheet de Big-O',
    intro: 'Referência rápida de complexidade de algoritmos e estruturas de dados. Use a busca para filtrar, ajuste o tamanho da entrada no gráfico e consulte as tabelas antes de escolher uma solução.',
    search: 'Buscar algoritmo, estrutura ou complexidade...',
    all: 'Tudo',
    sorting: 'Ordenação',
    searchTab: 'Busca',
    structures: 'Estruturas de Dados',
    notation: 'Notações',
    empty: 'Nenhum resultado encontrado.',
    best: 'Melhor',
    average: 'Médio',
    worst: 'Pior',
    space: 'Espaço',
    stable: 'Estável',
    access: 'Acesso',
    insert: 'Inserção',
    delete: 'Remoção',
    name: 'Nome',
    description: 'Descrição',
    true: 'Sim',
    false: 'Não',
    chartTitle: 'Crescimento por tamanho da entrada',
    chartN: 'Tamanho da entrada (n)',
    chartIntro: 'Compare visualmente como O(1), O(log n), O(n), O(n log n) e O(n²) se comportam à medida que n cresce. Escalas logarítmicas evidenciam a diferença.',
    notationTitle: 'Notações assintóticas',
    notationIntro: 'Big-O é o mais usado, mas existem outras letras gregas para descrever limites superiores, inferiores e apertados.',
    complexityTitle: 'O que cada classe significa',
    tableSort: 'Algoritmos de Ordenação',
    tableSearch: 'Algoritmos de Busca',
    tableDs: 'Estruturas de Dados',
    tipTitle: 'Como interpretar',
    tipBody: 'Big-O descreve o crescimento do tempo/espaço quando a entrada tende ao infinito. Constantes e fatores de baixa ordem são ignorados. Na prática, prefira a menor complexidade que resolva o problema, mas lembre-se do overhead constante e das restrições de memória.',
  },
  en: {
    title: 'Big-O Cheat Sheet',
    intro: 'Quick reference for algorithm and data-structure complexity. Use the search to filter, adjust the input size in the chart, and check the tables before choosing a solution.',
    search: 'Search algorithm, structure or complexity...',
    all: 'All',
    sorting: 'Sorting',
    searchTab: 'Search',
    structures: 'Data Structures',
    notation: 'Notations',
    empty: 'No results found.',
    best: 'Best',
    average: 'Average',
    worst: 'Worst',
    space: 'Space',
    stable: 'Stable',
    access: 'Access',
    insert: 'Insert',
    delete: 'Delete',
    name: 'Name',
    description: 'Description',
    true: 'Yes',
    false: 'No',
    chartTitle: 'Growth by input size',
    chartN: 'Input size (n)',
    chartIntro: 'Visually compare how O(1), O(log n), O(n), O(n log n) and O(n²) behave as n grows. Logarithmic scales make the difference clear.',
    notationTitle: 'Asymptotic notations',
    notationIntro: 'Big-O is the most common, but other Greek letters describe upper, lower and tight bounds.',
    complexityTitle: 'What each class means',
    tableSort: 'Sorting Algorithms',
    tableSearch: 'Search Algorithms',
    tableDs: 'Data Structures',
    tipTitle: 'How to read it',
    tipBody: 'Big-O describes how time/space grows as the input approaches infinity. Constants and lower-order factors are ignored. In practice, prefer the lowest complexity that solves the problem, but remember constant overhead and memory constraints.',
  },
}

export default function BigOCheatsheetPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState('sorting')
  const [n, setN] = useState(128)

  const q = useMemo(() => query.trim().toLowerCase(), [query])

  const matches = (item) => {
    if (!q) return true
    return (
      item.name.toLowerCase().includes(q) ||
      (item[lang] || '').toLowerCase().includes(q) ||
      Object.values(item).some((v) => typeof v === 'string' && v.toLowerCase().includes(q))
    )
  }

  const filteredSort = useMemo(() => SORTING.filter(matches), [q, lang])
  const filteredSearch = useMemo(() => SEARCH.filter(matches), [q, lang])
  const filteredDs = useMemo(() => DATA_STRUCTURES.filter(matches), [q, lang])

  const sortColumns = useMemo(() => [
    { title: t.name, dataIndex: 'name', key: 'name', render: (v) => <Text strong>{v}</Text> },
    { title: t.best, dataIndex: 'best', key: 'best', render: (v) => <ComplexityTag value={v} />, sorter: (a, b) => rankOf(a.best) - rankOf(b.best) },
    { title: t.average, dataIndex: 'average', key: 'average', render: (v) => <ComplexityTag value={v} />, sorter: (a, b) => rankOf(a.average) - rankOf(b.average) },
    { title: t.worst, dataIndex: 'worst', key: 'worst', render: (v) => <ComplexityTag value={v} />, sorter: (a, b) => rankOf(a.worst) - rankOf(b.worst) },
    { title: t.space, dataIndex: 'space', key: 'space', render: (v) => <ComplexityTag value={v} /> },
    { title: t.stable, dataIndex: 'stable', key: 'stable', render: (v) => <Tag color={v ? 'green' : 'default'}>{v ? t.true : t.false}</Tag> },
    { title: t.description, dataIndex: lang, key: 'desc' },
  ], [lang, t])

  const searchColumns = useMemo(() => [
    { title: t.name, dataIndex: 'name', key: 'name', render: (v) => <Text strong>{v}</Text> },
    { title: t.best, dataIndex: 'best', key: 'best', render: (v) => <ComplexityTag value={v} /> },
    { title: t.average, dataIndex: 'average', key: 'average', render: (v) => <ComplexityTag value={v} /> },
    { title: t.worst, dataIndex: 'worst', key: 'worst', render: (v) => <ComplexityTag value={v} /> },
    { title: t.space, dataIndex: 'space', key: 'space', render: (v) => <ComplexityTag value={v} /> },
    { title: t.description, dataIndex: lang, key: 'desc' },
  ], [lang, t])

  const dsColumns = useMemo(() => [
    { title: t.name, dataIndex: 'name', key: 'name', render: (v) => <Text strong>{v}</Text> },
    { title: t.access, dataIndex: 'access', key: 'access', render: (v) => <ComplexityTag value={v} /> },
    { title: t.search, dataIndex: 'search', key: 'search', render: (v) => <ComplexityTag value={v} /> },
    { title: t.insert, dataIndex: 'insert', key: 'insert', render: (v) => <ComplexityTag value={v} /> },
    { title: t.delete, dataIndex: 'delete', key: 'delete', render: (v) => <ComplexityTag value={v} /> },
    { title: t.space, dataIndex: 'space', key: 'space', render: (v) => <ComplexityTag value={v} /> },
    { title: t.description, dataIndex: lang, key: 'desc' },
  ], [lang, t])

  const points = useMemo(() => growthPoints(n), [n])
  const maxY = Math.max(...points.map((p) => p['O(n²)']))

  const chartHeight = 240
  const chartPadding = 32
  const innerHeight = chartHeight - chartPadding * 2
  const innerWidth = 640

  const xFor = (index) => chartPadding + (index / (points.length - 1)) * (innerWidth - chartPadding * 2)
  const yFor = (value) => chartHeight - chartPadding - (Math.log10(value + 1) / Math.log10(maxY + 1)) * innerHeight

  const series = useMemo(() => [
    { key: 'O(1)', color: COMPLEXITY_META['O(1)'].color },
    { key: 'O(log n)', color: COMPLEXITY_META['O(log n)'].color },
    { key: 'O(n)', color: COMPLEXITY_META['O(n)'].color },
    { key: 'O(n log n)', color: COMPLEXITY_META['O(n log n)'].color },
    { key: 'O(n²)', color: COMPLEXITY_META['O(n²)'].color },
  ], [])

  const pathFor = (key) => {
    return points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xFor(i)} ${yFor(p[key])}`)
      .join(' ')
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><ReadOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Alert type="info" showIcon icon={<LineChartOutlined />} message={t.tipTitle} description={t.tipBody} />

      <Space direction="vertical" style={{ width: '100%' }}>
        <Input
          prefix={<SearchOutlined />}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.search}
          allowClear
        />
        <Radio.Group value={tab} onChange={(e) => setTab(e.target.value)} optionType="button">
          <Radio.Button value="sorting">{t.sorting}</Radio.Button>
          <Radio.Button value="search">{t.searchTab}</Radio.Button>
          <Radio.Button value="structures">{t.structures}</Radio.Button>
          <Radio.Button value="notation">{t.notation}</Radio.Button>
        </Radio.Group>
      </Space>

      {tab === 'sorting' && (
        <Card title={t.tableSort}>
          <Table
            dataSource={filteredSort}
            columns={sortColumns}
            rowKey="name"
            pagination={false}
            size="small"
            locale={{ emptyText: t.empty }}
          />
        </Card>
      )}

      {tab === 'search' && (
        <Card title={t.tableSearch}>
          <Table
            dataSource={filteredSearch}
            columns={searchColumns}
            rowKey="name"
            pagination={false}
            size="small"
            locale={{ emptyText: t.empty }}
          />
        </Card>
      )}

      {tab === 'structures' && (
        <Card title={t.tableDs}>
          <Table
            dataSource={filteredDs}
            columns={dsColumns}
            rowKey="name"
            pagination={false}
            size="small"
            locale={{ emptyText: t.empty }}
          />
        </Card>
      )}

      {tab === 'notation' && (
        <>
          <Card title={t.notationTitle}>
            <Paragraph>{t.notationIntro}</Paragraph>
            <Table
              dataSource={NOTATIONS}
              columns={[
                { title: 'Notation', dataIndex: 'notation', key: 'notation', render: (v) => <Text code strong>{v}</Text> },
                { title: t.description, dataIndex: lang, key: 'desc' },
              ]}
              rowKey="notation"
              pagination={false}
              size="small"
            />
          </Card>
          <Card title={t.complexityTitle}>
            <Table
              dataSource={COMPLEXITY_ORDER.map((c) => ({ complexity: c, ...COMPLEXITY_META[c] }))}
              columns={[
                { title: 'Big-O', dataIndex: 'complexity', key: 'complexity', render: (v) => <ComplexityTag value={v} /> },
                { title: t.description, dataIndex: lang, key: 'desc' },
              ]}
              rowKey="complexity"
              pagination={false}
              size="small"
            />
          </Card>
        </>
      )}

      <Card title={t.chartTitle}>
        <Paragraph type="secondary">{t.chartIntro}</Paragraph>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={18}>
            <svg viewBox={`0 0 ${innerWidth} ${chartHeight}`} style={{ width: '100%', height: chartHeight }}>
              {points.map((p, i) => (
                <text key={i} x={xFor(i)} y={chartHeight - 8} textAnchor="middle" fontSize={10} fill="#888">
                  {p.n}
                </text>
              ))}
              <text x={innerWidth / 2} y={chartHeight - 8} textAnchor="middle" fontSize={11} fill="#666">{t.chartN}</text>
              {series.map((s) => (
                <path key={s.key} d={pathFor(s.key)} fill="none" stroke={s.color} strokeWidth={2} />
              ))}
            </svg>
          </Col>
          <Col xs={24} md={6}>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Text strong>{t.chartN}: {n}</Text>
              <Slider min={8} max={1024} step={8} value={n} onChange={setN} />
              {series.map((s) => (
                <Space key={s.key} size="small">
                  <span style={{ width: 12, height: 12, borderRadius: '50%', background: s.color, display: 'inline-block' }} />
                  <Text>{s.key}</Text>
                </Space>
              ))}
            </Space>
          </Col>
        </Row>
      </Card>
    </Space>
  )
}
