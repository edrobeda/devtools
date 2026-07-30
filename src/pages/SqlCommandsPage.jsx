import React, { useMemo, useState } from 'react'
import { Typography, Card, Space, Input, List, Tag } from 'antd'
import { ReadOutlined, SearchOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const COMMANDS = [
  { cmd: 'SELECT col1, col2 FROM tabela;', pt: 'Busca colunas específicas de uma tabela', en: 'Fetches specific columns from a table', cat: 'query' },
  { cmd: 'SELECT * FROM tabela WHERE col = valor;', pt: 'Filtra linhas por uma condição', en: 'Filters rows by a condition', cat: 'query' },
  { cmd: 'SELECT DISTINCT col FROM tabela;', pt: 'Retorna valores únicos de uma coluna', en: 'Returns unique values from a column', cat: 'query' },
  { cmd: 'SELECT * FROM tabela ORDER BY col DESC;', pt: 'Ordena o resultado (ASC padrão, DESC decrescente)', en: 'Orders the result (ASC by default, DESC descending)', cat: 'query' },
  { cmd: 'SELECT * FROM tabela LIMIT 10 OFFSET 20;', pt: 'Limita o número de linhas e pula as N primeiras (paginação)', en: 'Limits the number of rows and skips the first N (pagination)', cat: 'query' },
  { cmd: "SELECT * FROM tabela WHERE col LIKE 'a%';", pt: 'Filtra por padrão de texto (% = qualquer sequência, _ = um caractere)', en: 'Filters by text pattern (% = any sequence, _ = one character)', cat: 'query' },
  { cmd: 'SELECT * FROM tabela WHERE col IN (1, 2, 3);', pt: 'Filtra linhas cujo valor está numa lista', en: 'Filters rows whose value is in a list', cat: 'query' },
  { cmd: 'SELECT * FROM tabela WHERE col BETWEEN 1 AND 10;', pt: 'Filtra por intervalo inclusivo', en: 'Filters by an inclusive range', cat: 'query' },
  { cmd: 'SELECT * FROM tabela WHERE col IS NULL;', pt: 'Filtra linhas com valor nulo (não use = NULL)', en: 'Filters rows with a null value (don\'t use = NULL)', cat: 'query' },
  { cmd: 'SELECT COUNT(*), AVG(col), SUM(col), MIN(col), MAX(col) FROM tabela;', pt: 'Funções de agregação sobre todas as linhas (ou do grupo, com GROUP BY)', en: 'Aggregate functions over all rows (or per group, with GROUP BY)', cat: 'aggregate' },
  { cmd: 'SELECT col, COUNT(*) FROM tabela GROUP BY col;', pt: 'Agrupa linhas por valores iguais de uma coluna', en: 'Groups rows by equal values of a column', cat: 'aggregate' },
  { cmd: 'SELECT col, COUNT(*) FROM tabela GROUP BY col HAVING COUNT(*) > 5;', pt: 'Filtra grupos após o GROUP BY (WHERE não pode usar agregações)', en: 'Filters groups after GROUP BY (WHERE cannot use aggregations)', cat: 'aggregate' },
  { cmd: 'SELECT a.*, b.* FROM a INNER JOIN b ON a.id = b.a_id;', pt: 'Retorna só linhas com correspondência em ambas as tabelas', en: 'Returns only rows matching in both tables', cat: 'join' },
  { cmd: 'SELECT a.*, b.* FROM a LEFT JOIN b ON a.id = b.a_id;', pt: 'Retorna todas as linhas de a, com colunas de b nulas quando não há match', en: 'Returns all rows from a, with b columns null when there is no match', cat: 'join' },
  { cmd: 'SELECT a.*, b.* FROM a RIGHT JOIN b ON a.id = b.a_id;', pt: 'Retorna todas as linhas de b, com colunas de a nulas quando não há match', en: 'Returns all rows from b, with a columns null when there is no match', cat: 'join' },
  { cmd: 'SELECT a.*, b.* FROM a FULL OUTER JOIN b ON a.id = b.a_id;', pt: 'Retorna todas as linhas de a e b, nulo do lado sem correspondência (nem todo banco suporta, ex. MySQL não)', en: 'Returns all rows from a and b, null on the unmatched side (not every database supports it, e.g. MySQL doesn\'t)', cat: 'join' },
  { cmd: 'SELECT a.*, b.* FROM a CROSS JOIN b;', pt: 'Produto cartesiano — cada linha de a com cada linha de b', en: 'Cartesian product — every row of a with every row of b', cat: 'join' },
  { cmd: 'SELECT * FROM a WHERE EXISTS (SELECT 1 FROM b WHERE b.a_id = a.id);', pt: 'Subquery de existência — mais eficiente que IN em muitos casos', en: 'Existence subquery — often more efficient than IN', cat: 'join' },
  { cmd: 'INSERT INTO tabela (col1, col2) VALUES (v1, v2);', pt: 'Insere uma linha nova', en: 'Inserts a new row', cat: 'write' },
  { cmd: 'INSERT INTO tabela (col1) VALUES (v1), (v2), (v3);', pt: 'Insere múltiplas linhas numa única instrução', en: 'Inserts multiple rows in a single statement', cat: 'write' },
  { cmd: 'UPDATE tabela SET col = valor WHERE id = 1;', pt: 'Atualiza linhas que casam a condição (sem WHERE, atualiza a tabela inteira!)', en: 'Updates rows matching the condition (without WHERE, updates the whole table!)', cat: 'write' },
  { cmd: 'DELETE FROM tabela WHERE id = 1;', pt: 'Remove linhas que casam a condição (sem WHERE, apaga a tabela inteira!)', en: 'Removes rows matching the condition (without WHERE, deletes the whole table!)', cat: 'write' },
  { cmd: 'TRUNCATE TABLE tabela;', pt: 'Remove todas as linhas rapidamente, resetando auto-incremento (sem log linha a linha, difícil reverter)', en: 'Quickly removes all rows, resetting auto-increment (no per-row log, hard to roll back)', cat: 'write' },
  { cmd: 'CREATE TABLE tabela (id INT PRIMARY KEY, nome VARCHAR(100) NOT NULL);', pt: 'Cria uma tabela nova com colunas e restrições', en: 'Creates a new table with columns and constraints', cat: 'ddl' },
  { cmd: 'ALTER TABLE tabela ADD COLUMN col INT;', pt: 'Adiciona uma coluna a uma tabela existente', en: 'Adds a column to an existing table', cat: 'ddl' },
  { cmd: 'ALTER TABLE tabela DROP COLUMN col;', pt: 'Remove uma coluna existente', en: 'Removes an existing column', cat: 'ddl' },
  { cmd: 'ALTER TABLE tabela RENAME COLUMN a TO b;', pt: 'Renomeia uma coluna', en: 'Renames a column', cat: 'ddl' },
  { cmd: 'DROP TABLE tabela;', pt: 'Apaga a tabela inteira, estrutura e dados (irreversível)', en: 'Drops the whole table, structure and data (irreversible)', cat: 'ddl' },
  { cmd: 'CREATE INDEX idx_nome ON tabela (col);', pt: 'Cria um índice pra acelerar buscas/joins por essa coluna', en: 'Creates an index to speed up searches/joins on that column', cat: 'ddl' },
  { cmd: 'CREATE UNIQUE INDEX idx_nome ON tabela (col);', pt: 'Índice que também garante unicidade dos valores', en: 'Index that also enforces uniqueness of values', cat: 'ddl' },
  { cmd: 'BEGIN; ... COMMIT;', pt: 'Inicia uma transação e confirma as mudanças ao final', en: 'Starts a transaction and confirms the changes at the end', cat: 'transaction' },
  { cmd: 'ROLLBACK;', pt: 'Desfaz as mudanças da transação atual', en: 'Undoes the changes of the current transaction', cat: 'transaction' },
  { cmd: 'SAVEPOINT ponto1;', pt: 'Marca um ponto intermediário na transação pra reverter parcialmente depois', en: 'Marks a checkpoint in the transaction to partially roll back later', cat: 'transaction' },
  { cmd: 'SELECT * FROM tabela WHERE id = 1 FOR UPDATE;', pt: 'Trava a linha selecionada até o fim da transação (lock pessimista)', en: 'Locks the selected row until the end of the transaction (pessimistic lock)', cat: 'transaction' },
  { cmd: 'WITH totais AS (SELECT col, COUNT(*) c FROM tabela GROUP BY col) SELECT * FROM totais WHERE c > 1;', pt: 'CTE (Common Table Expression) — subquery nomeada, reutilizável na query principal', en: 'CTE (Common Table Expression) — named subquery, reusable in the main query', cat: 'advanced' },
  { cmd: 'SELECT col, ROW_NUMBER() OVER (PARTITION BY col2 ORDER BY col) FROM tabela;', pt: 'Window function — numera linhas dentro de cada grupo sem colapsar o resultado', en: 'Window function — numbers rows within each group without collapsing the result', cat: 'advanced' },
  { cmd: 'SELECT col, RANK() OVER (ORDER BY col DESC) FROM tabela;', pt: 'Window function de ranking, com empates recebendo a mesma posição', en: 'Ranking window function, with ties receiving the same position', cat: 'advanced' },
  { cmd: "SELECT CASE WHEN col > 10 THEN 'alto' ELSE 'baixo' END FROM tabela;", pt: 'Lógica condicional inline dentro do SELECT', en: 'Inline conditional logic inside SELECT', cat: 'advanced' },
  { cmd: 'EXPLAIN ANALYZE SELECT * FROM tabela WHERE col = 1;', pt: 'Mostra o plano de execução real da query, útil pra achar gargalos', en: 'Shows the query\'s actual execution plan, useful for finding bottlenecks', cat: 'advanced' },
]

const CATEGORY_LABELS = {
  pt: { query: 'consulta', aggregate: 'agregação', join: 'join', write: 'escrita', ddl: 'DDL', transaction: 'transação', advanced: 'avançado' },
  en: { query: 'query', aggregate: 'aggregate', join: 'join', write: 'write', ddl: 'DDL', transaction: 'transaction', advanced: 'advanced' },
}

const translations = {
  pt: {
    title: 'Comandos SQL Essenciais',
    intro: 'Referência rápida e pesquisável dos comandos SQL mais usados no dia a dia — sintaxe padrão ANSI, compatível com PostgreSQL/MySQL/SQLite na maioria dos casos (algumas features avançadas variam por banco).',
    search: 'Buscar comando ou descrição...',
    empty: 'Nenhum comando encontrado.',
  },
  en: {
    title: 'Essential SQL Commands',
    intro: 'A quick, searchable reference of the most commonly used SQL commands — standard ANSI syntax, compatible with PostgreSQL/MySQL/SQLite in most cases (some advanced features vary by database).',
    search: 'Search command or description...',
    empty: 'No command found.',
  },
}

export default function SqlCommandsPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return COMMANDS
    return COMMANDS.filter((c) => c.cmd.toLowerCase().includes(q) || c[lang].toLowerCase().includes(q))
  }, [query, lang])

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><ReadOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Input
        prefix={<SearchOutlined />}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t.search}
        allowClear
      />

      <Card>
        <List
          dataSource={filtered}
          locale={{ emptyText: t.empty }}
          renderItem={(item) => (
            <List.Item>
              <Space direction="vertical" size={2} style={{ width: '100%' }}>
                <Space wrap>
                  <Text code style={{ fontSize: 14 }}>{item.cmd}</Text>
                  <Tag>{CATEGORY_LABELS[lang][item.cat]}</Tag>
                </Space>
                <Text type="secondary">{item[lang]}</Text>
              </Space>
            </List.Item>
          )}
        />
      </Card>
    </Space>
  )
}
