import React, { useMemo, useState, useCallback } from 'react'
import { Typography, Card, Space, Input, List, Tag, Radio, Alert, Button, message, Collapse } from 'antd'
import { TableOutlined, SearchOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const CATEGORIES = [
  'syntax',
  'ranking',
  'aggregates',
  'peers',
  'frames',
  'dist',
  'gotchas',
]

const CATEGORY_COLOR = {
  syntax: 'geekblue',
  ranking: 'cyan',
  aggregates: 'green',
  peers: 'volcano',
  frames: 'purple',
  dist: 'orange',
  gotchas: 'red',
}

const labelOf = {
  syntax: { pt: 'Sintaxe & OVER()', en: 'Syntax & OVER()' },
  ranking: { pt: 'Funções de ranking', en: 'Ranking functions' },
  aggregates: { pt: 'Agregações como janela', en: 'Aggregates as window' },
  peers: { pt: 'Acesso a linhas vizinhas', en: 'Row access (LAG/LEAD/…)' },
  frames: { pt: 'Frames & limites', en: 'Frames & boundaries' },
  dist: { pt: 'Percentis & distribuição', en: 'Percentiles & distribution' },
  gotchas: { pt: 'Gotchas clássicos', en: 'Classic gotchas' },
}

const COMMANDS = [
  // ─── Sintaxe & OVER() ─────────────────────────────────────────────────────
  { cmd: 'SELECT SUM(vendas) OVER () FROM vendas', cat: 'syntax', pt: 'Janela = tabela inteira; devolve o mesmo total em todas as linhas (sem agrupamento)', en: 'Window = the whole table; returns the same total on every row (no grouping)' },
  { cmd: 'SELECT nome, salario, SUM(salario) OVER () FROM emp', cat: 'syntax', pt: 'Agregado como janela convive com colunas comuns do SELECT — diferente do GROUP BY', en: 'Window aggregate coexists with plain SELECT columns — unlike GROUP BY' },
  { cmd: 'SUM(v) OVER (PARTITION BY depto)', cat: 'syntax', pt: 'Janela por partição: recalcula o agregado a cada grupo/departamento', en: 'Window per partition: recomputes the aggregate for each group/department' },
  { cmd: 'AVG(v) OVER (ORDER BY data)', cat: 'syntax', pt: 'Ordena dentro da janela — muda frames e transforma o agregado em acumulado', en: 'Orders within the window — changes frames and turns the aggregate into a running one' },
  { cmd: 'SUM(v) OVER (PARTITION BY depto ORDER BY data)', cat: 'syntax', pt: 'Partição e ordenação combinadas: acumulado POR departamento', en: 'Partition and order combined: running total PER department' },
  { cmd: 'WINDOW w AS (PARTITION BY depto ORDER BY data)\n... OVER w', cat: 'syntax', pt: 'Define uma janela nomeada no final do SELECT e reutiliza com OVER w (padrão SQL:2003, Postgres/MySQL 8+)', en: 'Defines a named window at the end of the SELECT and reuses it with OVER w (SQL:2003, Postgres/MySQL 8+)' },
  { cmd: 'SELECT *, ROW_NUMBER() OVER (ORDER BY id) FROM t ORDER BY saida', cat: 'syntax', pt: 'O ORDER BY do OVER NÃO reordena o resultado final — ele só define a janela; o ORDER BY de fora comanda a saída', en: 'The OVER ORDER BY does NOT reorder the final result — it only defines the window; the outer ORDER BY drives the output' },
  { cmd: 'WHERE ... GROUP BY ... HAVING ... FUNC() OVER (...)', cat: 'syntax', pt: 'Janelas rodam DEPOIS de WHERE/GROUP BY/HAVING — sobre o resultado já filtrado/agregado', en: 'Windows run AFTER WHERE/GROUP BY/HAVING — on the already filtered/aggregated result' },
  { cmd: 'SELECT depto, SUM(v) OVER () FROM t GROUP BY depto', cat: 'syntax', pt: 'Combinar GROUP BY com OVER() é válido — a janela enxerga as linhas JÁ agregadas', en: 'Mixing GROUP BY with OVER() is valid — the window sees the ALREADY aggregated rows' },
  { cmd: 'SUM(DISTINCT v) OVER ()', cat: 'syntax', pt: 'DISTINCT dentro do OVER() não é aceito nos principais bancos (Postgres, MySQL, SQL Server) — dedupe antes com subquery', en: 'DISTINCT inside OVER() is not accepted in the main engines (Postgres, MySQL, SQL Server) — dedupe beforehand with a subquery' },

  // ─── Funções de ranking ───────────────────────────────────────────────────
  { cmd: 'ROW_NUMBER() OVER (ORDER BY salario DESC)', cat: 'ranking', pt: 'Número sequencial único; empates são resolvidos em ordem não garantida', en: 'Unique sequential number; ties are broken in no guaranteed order' },
  { cmd: 'RANK() OVER (ORDER BY salario DESC)', cat: 'ranking', pt: 'Posição com empates que PULAM: 1, 1, 3', en: 'Rank with ties that SKIP: 1, 1, 3' },
  { cmd: 'DENSE_RANK() OVER (ORDER BY salario DESC)', cat: 'ranking', pt: 'Posição com empates SEM pular: 1, 1, 2', en: 'Rank with ties WITHOUT skipping: 1, 1, 2' },
  { cmd: 'NTILE(4) OVER (ORDER BY id)', cat: 'ranking', pt: 'Divide o resultado em N buckets balanceados (quartis/decis), cada linha recebe o número 1..N', en: 'Splits the result into N balanced buckets (quartiles/deciles); each row gets a number 1..N' },
  { cmd: 'SELECT * FROM (\n  SELECT t.*, ROW_NUMBER() OVER (PARTITION BY depto ORDER BY data DESC) rn FROM t\n) x WHERE rn = 1', cat: 'ranking', pt: '"Top N por grupo" clássico: rn=1 pega o registro mais novo de cada departamento (filtro fora, via subquery/CTE)', en: 'The classic "top N per group": rn=1 grabs the newest record per department (filter outside, via subquery/CTE)' },
  { cmd: 'ROW_NUMBER() OVER (ORDER BY RANDOM())', cat: 'ranking', pt: 'Numeração aleatória — amostragem ou dedup não determinístico', en: 'Random numbering — non-deterministic sampling or dedup' },
  { cmd: 'RANK() / DENSE_RANK() / ROW_NUMBER()', cat: 'ranking', pt: 'Os três diferem SÓ no tratamento de empates: salta / não salta / nunca empata', en: 'The three differ ONLY on tie handling: skip / no skip / never ties' },

  // ─── Agregações como janela ───────────────────────────────────────────────
  { cmd: 'SUM(v) OVER (ORDER BY data)', cat: 'aggregates', pt: 'Total acumulado (running total): a janela cresce até a linha atual', en: 'Running total: the window grows up to the current row' },
  { cmd: 'AVG(v) OVER (PARTITION BY depto)', cat: 'aggregates', pt: 'Média por grupo repetida em cada linha (fácil de comparar linha vs grupo)', en: 'Per-group average repeated on each row (easy row-vs-group comparison)' },
  { cmd: 'MAX(v) OVER ()', cat: 'aggregates', pt: 'Máximo global colocado lado a lado com cada linha', en: 'Global maximum placed next to every row' },
  { cmd: 'COUNT(v) OVER (PARTITION BY status)', cat: 'aggregates', pt: 'Conta valores não-NULL por grupo/status em cada linha', en: 'Counts non-NULL values per group/status on each row' },
  { cmd: 'AVG(v) OVER (ORDER BY data ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)', cat: 'aggregates', pt: 'Janela móvel de 7 períodos = média móvel (moving average)', en: '7-period sliding window = moving average' },
  { cmd: 'SELECT nome, v,\n  v / SUM(v) OVER (PARTITION BY depto) AS share\nFROM t', cat: 'aggregates', pt: 'Razão valor/partição — participação de cada linha no grupo', en: 'Value-to-partition ratio — each row\'s share within the group' },
  { cmd: 'SUM / AVG / COUNT / MIN / MAX () OVER ()', cat: 'aggregates', pt: 'Todos os agregados padrão funcionam como função de janela', en: 'All standard aggregates work as window functions' },

  // ─── Acesso a linhas vizinhas ─────────────────────────────────────────────
  { cmd: 'LAG(v, 1) OVER (ORDER BY data)', cat: 'peers', pt: 'Valor da linha ANTERIOR (offset padrão é 1)', en: 'Value of the PREVIOUS row (default offset is 1)' },
  { cmd: 'LEAD(v, 1) OVER (ORDER BY data)', cat: 'peers', pt: 'Valor da PRÓXIMA linha', en: 'Value of the NEXT row' },
  { cmd: 'LAG(v, 2) OVER (ORDER BY data)', cat: 'peers', pt: 'Duas linhas atrás — offset/deslocamento configurável', en: 'Two rows back — offset is configurable' },
  { cmd: 'LAG(v, 1, 0) OVER (ORDER BY data)', cat: 'peers', pt: 'Terceiro argumento = valor padrão quando a linha anterior não existe (em vez de NULL)', en: 'Third argument = default value when the previous row does not exist (instead of NULL)' },
  { cmd: 'LAG(v) OVER (ORDER BY data) IS NULL', cat: 'peers', pt: 'Detecta a PRIMEIRA linha de cada partição', en: 'Detects the FIRST row of each partition' },
  { cmd: 'v - LAG(v, 1) OVER (ORDER BY data)', cat: 'peers', pt: 'Diferença linha a linha (delta entre registros consecutivos)', en: 'Row-over-row difference (delta between consecutive records)' },
  { cmd: "FIRST_VALUE(v) OVER (PARTITION BY depto ORDER BY data)", cat: 'peers', pt: 'Primeiro valor da partição de acordo com o ORDER BY', en: 'First value of the partition per the ORDER BY' },
  { cmd: "LAST_VALUE(v) OVER (PARTITION BY depto ORDER BY data ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING)", cat: 'peers', pt: 'Último valor da partição — SEM frame completo retorna a LINHA ATUAL, não o último (gotcha clássico)', en: 'Last value of the partition — WITHOUT a full frame it returns the CURRENT row, not the last one (classic gotcha)' },
  { cmd: 'NTH_VALUE(v, 3) OVER (ORDER BY data)', cat: 'peers', pt: 'Enésimo valor da janela (aqui, o 3º)', en: 'The Nth value in the window (here, the 3rd)' },
  { cmd: 'LEAD(v) OVER (PARTITION BY depto ORDER BY data)', cat: 'peers', pt: 'Próximo registro DENTRO do mesmo grupo (partição)', en: 'Next record WITHIN the same group (partition)' },

  // ─── Frames & limites ─────────────────────────────────────────────────────
  { cmd: 'ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW', cat: 'frames', pt: 'Frame do início da partição até a linha atual (equivalente ao "running")', en: 'Frame from the partition start up to the current row (the "running" behaviour)' },
  { cmd: 'ROWS BETWEEN CURRENT ROW AND UNBOUNDED FOLLOWING', cat: 'frames', pt: 'Da linha atual até o fim da partição', en: 'From the current row to the end of the partition' },
  { cmd: 'ROWS BETWEEN 2 PRECEDING AND 2 FOLLOWING', cat: 'frames', pt: 'Janela centrada de 5 linhas (linha atual ± 2)', en: 'Centred window of 5 rows (current ± 2)' },
  { cmd: "RANGE BETWEEN INTERVAL '7 days' PRECEDING AND CURRENT ROW", cat: 'frames', pt: "Frame por VALOR (PostgreSQL): linhas dentro de 7 dias; linhas com o MESMO valor do ORDER BY caem juntas (peers)", en: "Value-based frame (PostgreSQL): rows within 7 days; rows with the SAME ORDER BY value fall together (peers)" },
  { cmd: 'ROWS vs RANGE', cat: 'frames', pt: 'ROWS = N linhas exatas; RANGE = por valor do ORDER BY, agrupando iguais como peers', en: 'ROWS = N exact rows; RANGE = by ORDER BY value, grouping equals as peers' },
  { cmd: 'GROUPS BETWEEN 1 PRECEDING AND CURRENT ROW', cat: 'frames', pt: 'Frame por grupos de peers (SQL:2011; Postgres 10+ e MySQL 8 suportam)', en: 'Frame by groups of peers (SQL:2011; Postgres 10+ and MySQL 8 support it)' },
  { cmd: 'frame padrão = RANGE UNBOUNDED PRECEDING … CURRENT ROW', cat: 'frames', pt: 'Sem frame explícito, o default é RANGE até a linha atual — é por isso que agregado com ORDER BY vira acumulado', en: 'Without an explicit frame, the default is RANGE up to the current row — that\'s why an aggregate with ORDER BY becomes a running one' },

  // ─── Percentis & distribuição ─────────────────────────────────────────────
  { cmd: 'PERCENT_RANK() OVER (ORDER BY v)', cat: 'dist', pt: 'Posição relativa normalizada entre 0 e 1 (rank/(linhas-1))', en: 'Normalised relative position between 0 and 1 (rank/(rows-1))' },
  { cmd: 'CUME_DIST() OVER (ORDER BY v)', cat: 'dist', pt: 'Distribuição acumulada: fração de linhas com valor <= à atual', en: 'Cumulative distribution: fraction of rows with value <= the current one' },
  { cmd: "PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY v) OVER ()", cat: 'dist', pt: 'Mediana/percentil CONTÍNUO — interpola entre valores quando necessário', en: 'CONTinuous percentile — interpolates between values when needed' },
  { cmd: "PERCENTILE_DISC(0.5) WITHIN GROUP (ORDER BY v) OVER ()", cat: 'dist', pt: 'Percentil DISCRETO — devolve sempre um valor real que existe na tabela', en: 'DISCrete percentile — always returns an actual value present in the table' },
  { cmd: 'PERCENTILE_CONT(0.5) vs PERCENTILE_DISC(0.5)', cat: 'dist', pt: 'CONT interpola quando a posição cai entre dois valores; DISC escolhe o valor existente mais próximo', en: 'CONT interpolates when the position falls between two values; DISC picks the closest existing value' },

  // ─── Gotchas clássicos ────────────────────────────────────────────────────
  { cmd: 'SELECT * FROM t WHERE v > AVG(v) OVER ()', cat: 'gotchas', pt: 'NÃO funciona: janelas rodam depois do WHERE — filtre com uma subquery/CTE por fora', en: 'Does NOT work: windows run after WHERE — filter with an outer subquery/CTE' },
  { cmd: 'SELECT * FROM (SELECT ..., ROW_NUMBER() OVER (...) rn FROM t) x WHERE x.rn = 1', cat: 'gotchas', pt: 'Para filtrar o resultado de uma janela, sempre embrulhe em subquery/CTE', en: 'To filter on a window result, always wrap it in a subquery/CTE' },
  { cmd: 'AVG(v) OVER (ORDER BY data)', cat: 'gotchas', pt: 'Sem frame explícito vira média ACUMULADA, não o valor "da linha" — se quer fixa, use OVER (PARTITION BY)', en: 'Without an explicit frame it becomes a RUNNING average, not the "flat" value — for a fixed one use OVER (PARTITION BY)' },
  { cmd: 'LAST_VALUE(v) OVER (ORDER BY data)', cat: 'gotchas', pt: 'Com o frame padrão, retorna a LINHA ATUAL (frame para em CURRENT ROW) — exija o frame completo para pegar o último', en: 'With the default frame it returns the CURRENT row (the frame stops at CURRENT ROW) — require the full frame to get the last one' },
  { cmd: 'ROW_NUMBER() OVER (ORDER BY score)', cat: 'gotchas', pt: 'Sem um critério determinístico de desempate, a ordem entre iguais pode variar entre execuções', en: 'Without a deterministic tie-breaker, the order among equals may vary between executions' },
  { cmd: 'MAX(v) OVER () -- partição vazia', cat: 'gotchas', pt: 'Janela vazia retorna NULL, como qualquer agregado', en: 'An empty window returns NULL, like any aggregate' },
  { cmd: 'SUM(v) OVER (ORDER BY data DESC)', cat: 'gotchas', pt: 'O acumulado vai do MAIS NOVO para o MAIS ANTIGO', en: 'The running total goes from NEWEST to OLDEST' },
  { cmd: 'OVER (PARTITION BY depto ORDER BY ...)', cat: 'gotchas', pt: 'Cada partição é ordenada separadamente — em tabelas grandes isso é um sort custoso por partição', en: 'Each partition is sorted separately — on large tables this is an expensive sort per partition' },
  { cmd: 'SELECT DISTINCT nome, SUM(v) OVER (PARTITION BY depto) FROM t', cat: 'gotchas', pt: 'A janela calcula ANTES do DISTINCT do SELECT — linhas duplicadas contam na agregação da janela', en: 'The window computes BEFORE the SELECT DISTINCT — duplicated rows still count in the window aggregate' },
  { cmd: 'PARTITION BY col WITH NULLs', cat: 'gotchas', pt: 'NULLs formam sua própria partição (e.g. NULL e não-NULL ficam separados no PARTITION BY)', en: 'NULLs form their own partition (e.g. NULL and non-NULL end up separate in PARTITION BY)' },

]

const translations = {
  pt: {
    title: 'Funções de Janela SQL (OVER)',
    intro: (
      <>
        Referência pesquisável das funções de janela (window functions) do SQL
        — a famigerada cláusula <Text code>OVER()</Text> que calcula sobre um
        conjunto de linhas sem colapsar o resultado como o{' '}
        <Text code>GROUP BY</Text>: ranking, totais acumulados, médias móveis,
        acesso a linhas vizinhas, frames e percentis. Compatível com
        PostgreSQL, MySQL 8+, SQL Server e SQLite 3.25+. Complementa o{' '}
        <Text code>sql-commands</Text> e o <Text code>sql-joins</Text> — este
        é o primeiro item do projeto dedicado às janelas. Tudo 100%
        client-side (texto de referência).
      </>
    ),
    tipTitle: 'Regras de ouro',
    tipBody: (
      <>
        Janela <Text code>=</Text> agregado <Text code>+</Text> contexto:{' '}
        <Text code>OVER ()</Text> é a tabela toda,{' '}
        <Text code>OVER (PARTITION BY g)</Text> é por grupo, e{' '}
        <Text code>OVER (ORDER BY c)</Text> vira <b>acumulado</b> por causa do
        frame padrão. Agregado com <Text code>ORDER BY</Text> = running; sem{' '}
        <Text code>ORDER BY</Text> = valor fixo por partição. Janelas rodam{' '}
        <b>depois</b> de <Text code>WHERE</Text>/<Text code>GROUP BY</Text>,
        então filtrar o resultado delas exige subquery/CTE. O{' '}
        <Text code>ORDER BY</Text> do <Text code>OVER</Text> não reordena a
        saída. E lembre: <Text code>LAST_VALUE</Text> sozinho com frame padrão
        devolve a linha atual — use o frame completo.
      </>
    ),
    search: 'Buscar SQL ou descrição...',
    all: 'Todos',
    empty: 'Nenhum item encontrado. Tente outra busca ou categoria.',
    resultsOne: 'item encontrado',
    resultsMany: 'itens encontrados',
    copy: 'Copiar como Markdown',
    copied: 'Tabela Markdown copiada',
    copiedError: 'Não foi possível copiar',
    source: 'Fonte de dados (JSON)',
  },
  en: {
    title: 'SQL Window Functions (OVER)',
    intro: (
      <>
        A searchable reference for SQL window functions — the infamous{' '}
        <Text code>OVER()</Text> clause that computes over a set of rows
        without collapsing the result like <Text code>GROUP BY</Text>: ranking,
        running totals, moving averages, access to neighbouring rows, frames
        and percentiles. Works on PostgreSQL, MySQL 8+, SQL Server and SQLite
        3.25+. Complements <Text code>sql-commands</Text> and{' '}
        <Text code>sql-joins</Text> — this is the project\'s first item
        dedicated to windows. 100% client-side (reference text only).
      </>
    ),
    tipTitle: 'Golden rules',
    tipBody: (
      <>
        Window <Text code>=</Text> aggregate <Text code>+</Text> context:{' '}
        <Text code>OVER ()</Text> is the whole table,{' '}
        <Text code>OVER (PARTITION BY g)</Text> is per group, and{' '}
        <Text code>OVER (ORDER BY c)</Text> becomes a <b>running</b> value
        because of the default frame. Aggregate with{' '}
        <Text code>ORDER BY</Text> = rolling; without it = fixed value per
        partition. Windows run <b>after</b>{' '}
        <Text code>WHERE</Text>/<Text code>GROUP BY</Text>, so filtering their
        result needs a subquery/CTE. The <Text code>OVER</Text> ORDER BY does
        not reorder the output. And remember:{' '}
        <Text code>LAST_VALUE</Text> alone with the default frame returns the
        current row — use the full frame.
      </>
    ),
    search: 'Search SQL or description...',
    all: 'All',
    empty: 'No matches found. Try another search or category.',
    resultsOne: 'item found',
    resultsMany: 'items found',
    copy: 'Copy as Markdown',
    copied: 'Markdown table copied',
    copiedError: 'Could not copy',
    source: 'Data source (JSON)',
  },
}

export default function SqlWindowFunctionsPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [category, setCategory] = useState('all')
  const [query, setQuery] = useState('')
  const [messageApi, messageContextHolder] = message.useMessage()

  const normalized = useCallback((s) => String(s).trim().toLowerCase(), [])

  const filtered = useMemo(() => {
    const q = normalized(query)
    return COMMANDS.filter((c) => {
      if (category !== 'all' && c.cat !== category) return false
      if (!q) return true
      return (
        c.cmd.toLowerCase().includes(q) ||
        (c[lang] || '').toLowerCase().includes(q) ||
        labelOf[c.cat][lang].toLowerCase().includes(q)
      )
    })
  }, [category, query, lang, normalized])

  const mdTable = useMemo(() => {
    const head = '| SQL | Category | Description |\n|---|---|---|\n'
    const rows = filtered.map((c) =>
      `| \`${c.cmd.replace(/\|/g, '\\|').replace(/\n/g, '\\n')}\` | ${labelOf[c.cat][lang]} | ${(c[lang] || '').replace(/\|/g, '\\|')} |`
    )
    return head + rows.join('\n')
  }, [filtered, lang])

  const copyText = useCallback(
    async (text, okMsg) => {
      try {
        await navigator.clipboard.writeText(text)
        messageApi.success(okMsg || t.copied)
      } catch {
        messageApi.error(t.copiedError || 'Error')
      }
    },
    [t, messageApi]
  )

  const resultLabel = filtered.length === 1 ? t.resultsOne : t.resultsMany

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {messageContextHolder}
      <Title level={2}><TableOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Alert type="info" showIcon icon={<TableOutlined />} message={t.tipTitle} description={t.tipBody} />

      <Space direction="vertical" style={{ width: '100%' }}>
        <Input
          prefix={<SearchOutlined />}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.search}
          allowClear
        />
        <Radio.Group value={category} onChange={(e) => setCategory(e.target.value)} optionType="button">
          <Radio.Button value="all">{t.all}</Radio.Button>
          {CATEGORIES.map((cat) => (
            <Radio.Button key={cat} value={cat}>{labelOf[cat][lang]}</Radio.Button>
          ))}
        </Radio.Group>
      </Space>

      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
        <Text type="secondary">
          {filtered.length} {resultLabel}
        </Text>
        {filtered.length > 0 && (
          <Button size="small" icon={<CopyOutlined />} onClick={() => copyText(mdTable)}>
            {t.copy}
          </Button>
        )}
      </Space>

      <Card>
        <List
          dataSource={filtered}
          locale={{ emptyText: t.empty }}
          renderItem={(item) => (
            <List.Item key={item.cmd}>
              <Space direction="vertical" size={6} style={{ width: '100%' }}>
                <Space wrap style={{ rowGap: 6 }}>
                  <Text code style={{ fontSize: 13 }}>{item.cmd}</Text>
                  <Tag color={CATEGORY_COLOR[item.cat]}>{labelOf[item.cat][lang]}</Tag>
                  <Button size="small" type="text" icon={<CopyOutlined />} onClick={() => copyText(item.cmd)} />
                </Space>
                <Text type="secondary">{item[lang]}</Text>
              </Space>
            </List.Item>
          )}
        />
      </Card>

      <Collapse items={[
        {
          key: 'source',
          label: t.source,
          children: (
            <pre style={{ margin: 0, overflow: 'auto', fontSize: 12 }}>
              <code>{JSON.stringify(COMMANDS, null, 2)}</code>
            </pre>
          ),
        },
      ]} />
    </Space>
  )
}