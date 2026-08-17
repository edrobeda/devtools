import React, { useMemo, useState, useCallback } from 'react'
import { Typography, Card, Space, Input, List, Tag, Radio, Alert, Button, message, Collapse } from 'antd'
import { CodeOutlined, SearchOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const CATEGORIES = [
  'cli',
  'opening',
  'ddl',
  'dml',
  'query',
  'pragma',
  'functions',
  'indexes',
  'fts',
  'backup',
  'gotchas',
]

const CATEGORY_COLOR = {
  cli: 'geekblue',
  opening: 'blue',
  ddl: 'purple',
  dml: 'green',
  query: 'cyan',
  pragma: 'orange',
  functions: 'magenta',
  indexes: 'gold',
  fts: 'lime',
  backup: 'red',
  gotchas: 'volcano',
}

const labelOf = {
  cli: { pt: 'CLI & dot-commands (sqlite3)', en: 'CLI & dot-commands (sqlite3)' },
  opening: { pt: 'Abrir & gerenciar bancos', en: 'Opening & managing databases' },
  ddl: { pt: 'DDL & tipos', en: 'DDL & types' },
  dml: { pt: 'DML & upsert', en: 'DML & upsert' },
  query: { pt: 'Consultas', en: 'Queries' },
  pragma: { pt: 'PRAGMAs', en: 'PRAGMAs' },
  functions: { pt: 'Funções', en: 'Functions' },
  indexes: { pt: 'Índices & performance', en: 'Indexes & performance' },
  fts: { pt: 'Full-text search (FTS5)', en: 'Full-text search (FTS5)' },
  backup: { pt: 'Backup & manutenção', en: 'Backup & maintenance' },
  gotchas: { pt: 'Gotchas & dicas', en: 'Gotchas & tips' },
}

const COMMANDS = [
  // ─── CLI & dot-commands (sqlite3) ────────────────────────────────────────
  { cmd: 'sqlite3 app.db', cat: 'cli', pt: 'Abre (ou cria) o banco no shell interativo', en: 'Opens (or creates) the database in the interactive shell' },
  { cmd: "sqlite3 app.db \"SELECT 1;\"", cat: 'cli', pt: 'Executa SQL direto pela linha de comando e sai', en: 'Runs SQL from the command line and exits' },
  { cmd: '.open app.db', cat: 'cli', pt: 'Abre outro banco dentro do shell', en: 'Opens another database inside the shell' },
  { cmd: '.tables', cat: 'cli', pt: 'Lista as tabelas do banco', en: 'Lists the tables in the database' },
  { cmd: '.schema', cat: 'cli', pt: 'Mostra o CREATE TABLE de tudo', en: 'Shows the CREATE TABLE of everything' },
  { cmd: '.schema users', cat: 'cli', pt: 'Esquema de uma tabela específica', en: 'Schema of a single table' },
  { cmd: '.headers on', cat: 'cli', pt: 'Exibe o cabeçalho (nomes das colunas)', en: 'Shows the header (column names)' },
  { cmd: '.mode box', cat: 'cli', pt: 'Tabela com bordas (modo bonito para consultas)', en: 'Bordered table (pretty query output)' },
  { cmd: '.mode column', cat: 'cli', pt: 'Modo colunas clássico', en: 'Classic column mode' },
  { cmd: '.mode csv', cat: 'cli', pt: 'Saída em CSV', en: 'CSV output' },
  { cmd: '.mode json', cat: 'cli', pt: 'Saída em JSON', en: 'JSON output' },
  { cmd: '.mode insert desktop', cat: 'cli', pt: 'Saída como INSERTs (para backup de uma tabela)', en: 'Output as INSERT statements (table backup)' },
  { cmd: '.output out.csv', cat: 'cli', pt: 'Direciona a saída do próximo comando para um arquivo', en: 'Sends the next command output to a file' },
  { cmd: '.import data.csv users', cat: 'cli', pt: 'Importa um CSV para uma tabela existente', en: 'Imports a CSV file into an existing table' },
  { cmd: '.read script.sql', cat: 'cli', pt: 'Executa um arquivo SQL', en: 'Runs an SQL file' },
  { cmd: '.timer on', cat: 'cli', pt: 'Mostra o tempo de cada consulta', en: 'Shows the time of each query' },
  { cmd: '.indices users', cat: 'cli', pt: 'Lista os índices de uma tabela', en: 'Lists the indexes of a table' },
  { cmd: '.nullvalue NULL', cat: 'cli', pt: 'Como exibir valores NULL no console', en: 'How to display NULLs in the console' },
  { cmd: '.quit', cat: 'cli', pt: 'Sai do shell', en: 'Exits the shell' },

  // ─── Abrir & gerenciar bancos ─────────────────────────────────────────────
  { cmd: 'sqlite3 :memory:', cat: 'opening', pt: 'Banco 100% em memória (some ao fechar)', en: 'Fully in-memory database (gone on close)' },
  { cmd: "sqlite3 'file:app.db?mode=ro'", cat: 'opening', pt: 'Abre somente leitura (URI filename)', en: 'Opens read-only (URI filename)' },
  { cmd: "sqlite3 'file:app.db?cache=shared'", cat: 'opening', pt: 'Cache compartilhado entre conexões', en: 'Shared cache across connections' },
  { cmd: "ATTACH DATABASE 'other.db' AS aux;", cat: 'opening', pt: 'Anexa outro banco para consultas cruzadas (ex.: aux.tabela)', en: 'Attaches another database for cross queries (e.g. aux.table)' },
  { cmd: 'DETACH DATABASE aux;', cat: 'opening', pt: 'Desanexa um banco anexado', en: 'Detaches an attached database' },
  { cmd: 'PRAGMA database_list;', cat: 'opening', pt: 'Lista os bancos anexados e seus arquivos', en: 'Lists attached databases and their files' },
  { cmd: 'SELECT * FROM main.sqlite_master;', cat: 'opening', pt: 'Catálogo interno de objetos do banco', en: 'Internal catalog of database objects' },

  // ─── DDL & tipos ──────────────────────────────────────────────────────────
  { cmd: 'CREATE TABLE t (id INTEGER PRIMARY KEY, nome TEXT);', cat: 'ddl', pt: 'Tabela simples — INTEGER PRIMARY KEY é alias da rowid', en: 'Simple table — INTEGER PRIMARY KEY aliases the rowid' },
  { cmd: 'TEXT / INTEGER / REAL / BLOB / NULL', cat: 'ddl', pt: 'Os 5 tipos de storage; o resto é "affinity" (coerção flexível)', en: 'The 5 storage types; everything else is "affinity" (flexible coercion)' },
  { cmd: 'CREATE TABLE t (id INTEGER PRIMARY KEY, preço REAL) STRICT;', cat: 'ddl', pt: 'STRICT (3.37+) impõe os 5 tipos sem coerção de affinity', en: 'STRICT (3.37+) enforces the 5 types with no affinity coercion' },
  { cmd: 'CREATE TABLE t (a INT, b INT, s TEXT GENERATED ALWAYS AS (a + b) STORED);', cat: 'ddl', pt: 'Coluna gerada calculada automaticamente', en: 'Generated column computed automatically' },
  { cmd: 'CREATE TABLE t ... WITHOUT ROWID;', cat: 'ddl', pt: 'Organiza a tabela como B-tree da PK explícita (menor, mais rápida)', en: 'Stores the table as a B-tree of the explicit PK (smaller, faster)' },
  { cmd: 'ALTER TABLE t ADD COLUMN c TEXT;', cat: 'ddl', pt: 'Adiciona coluna (a forma estável aceita só ADD COLUMN ...)', en: 'Adds a column (stable SQLite mostly supports ADD COLUMN ...)' },
  { cmd: 'ALTER TABLE t DROP COLUMN c;', cat: 'ddl', pt: 'Remove coluna (3.35+; não remove PK nem com UNIQUE strict)', en: 'Drops a column (3.35+; not on PK or strict UNIQUE)' },
  { cmd: 'ALTER TABLE t RENAME TO t2;', cat: 'ddl', pt: 'Renomeia uma tabela', en: 'Renames a table' },
  { cmd: 'DROP TABLE t;', cat: 'ddl', pt: 'Apaga a tabela — o arquivo só encolhe com VACUUM', en: 'Drops the table — the file only shrinks with VACUUM' },
  { cmd: 'CREATE TEMP TABLE t (...);', cat: 'ddl', pt: 'Tabela temporária, privada da conexão', en: 'Temp table, private to the connection' },
  { cmd: 'CREATE VIEW v AS SELECT ...;', cat: 'ddl', pt: 'Cria uma view (consulta salva)', en: 'Creates a view (saved query)' },

  // ─── DML & upsert ─────────────────────────────────────────────────────────
  { cmd: 'INSERT INTO t (a, b) VALUES (1, 2);', cat: 'dml', pt: 'Insere uma linha', en: 'Inserts one row' },
  { cmd: 'INSERT INTO t (a, b) VALUES (1, 2), (3, 4);', cat: 'dml', pt: 'Multi-insert em uma única instrução', en: 'Multi-row insert in a single statement' },
  { cmd: 'INSERT INTO t (a) SELECT x FROM o;', cat: 'dml', pt: 'Insere linhas a partir de uma consulta', en: 'Inserts rows from a query' },
  { cmd: 'INSERT OR REPLACE INTO t (id, a) VALUES (1, 9);', cat: 'dml', pt: 'Apaga a linha conflitante e insere a nova', en: 'Deletes the conflicting row then inserts' },
  { cmd: 'INSERT OR IGNORE INTO t (id) VALUES (1);', cat: 'dml', pt: 'Ignora silenciosamente conflitos de constraint', en: 'Silently ignores constraint conflicts' },
  { cmd: 'INSERT INTO t (id, a) VALUES (1, 9) ON CONFLICT(id) DO UPDATE SET a = excluded.a;', cat: 'dml', pt: 'Upsert — atualiza a linha em conflito usando excluded', en: 'Upsert — updates the conflicting row via excluded' },
  { cmd: 'INSERT INTO t (id, a) VALUES (1, 9) ON CONFLICT(id) DO NOTHING;', cat: 'dml', pt: 'Upsert que não faz nada em conflito', en: 'Upsert that does nothing on conflict' },
  { cmd: 'INSERT ... ON CONFLICT (a, b) DO UPDATE ...;', cat: 'dml', pt: 'Conflito sobre constraints compostas', en: 'Conflict on a composite constraint' },
  { cmd: "UPDATE t SET a = 1 WHERE id = 5;", cat: 'dml', pt: 'Atualiza linhas que casam o WHERE', en: 'Updates rows matching the WHERE' },
  { cmd: 'UPDATE t SET total = (SELECT SUM(x) FROM o WHERE o.id = t.id);', cat: 'dml', pt: 'UPDATE com subconsulta por linha', en: 'Update using a correlated subquery' },
  { cmd: 'DELETE FROM t WHERE id = 5;', cat: 'dml', pt: 'Apaga linhas que casam o WHERE', en: 'Deletes rows matching the WHERE' },
  { cmd: 'DELETE FROM t;', cat: 'dml', pt: 'Apaga todas as linhas (sem WHERE)', en: 'Deletes all rows (no WHERE)' },
  { cmd: 'INSERT ... RETURNING id;', cat: 'dml', pt: 'Devolve as linhas afetadas (INSERT/UPDATE/DELETE; 3.35+)', en: 'Returns the affected rows (INSERT/UPDATE/DELETE; 3.35+)' },

  // ─── Consultas ────────────────────────────────────────────────────────────
  { cmd: 'SELECT DISTINCT cidade FROM c;', cat: 'query', pt: 'Valores únicos de uma coluna', en: 'Unique values of a column' },
  { cmd: "WITH RECURSIVE seq(x) AS (SELECT 1 UNION ALL SELECT x + 1 FROM seq WHERE x < 10) SELECT * FROM seq;", cat: 'query', pt: 'CTE recursiva que gera 1..10', en: 'Recursive CTE generating 1..10' },
  { cmd: 'WITH cte AS (SELECT ...) SELECT * FROM cte;', cat: 'query', pt: 'Common Table Expression (consulta nomeada)', en: 'Common Table Expression (named query)' },
  { cmd: "SELECT x, row_number() OVER (ORDER BY x) AS rn FROM t;", cat: 'query', pt: 'Window function — numera as linhas por ordem', en: 'Window function — numbers the rows by order' },
  { cmd: "SELECT strftime('%Y', criado) AS ano, COUNT(*) FROM t GROUP BY ano;", cat: 'query', pt: 'Agrupa por ano extraído do timestamp', en: 'Groups by the year extracted from the timestamp' },
  { cmd: 'SELECT * FROM t ORDER BY x DESC LIMIT 10 OFFSET 20;', cat: 'query', pt: 'Paginação com LIMIT/OFFSET', en: 'Pagination with LIMIT/OFFSET' },
  { cmd: "SELECT * FROM t WHERE c LIKE 'a%' ESCAPE '\\';", cat: 'query', pt: 'LIKE case-insensitive para ASCII (FTS5 para o resto)', en: 'LIKE is case-insensitive for ASCII (use FTS5 otherwise)' },
  { cmd: 'SELECT * FROM t WHERE x BETWEEN 1 AND 5;', cat: 'query', pt: 'Intervalo inclusivo', en: 'Inclusive range' },
  { cmd: 'SELECT * FROM a JOIN b ON a.id = b.id;', cat: 'query', pt: 'INNER JOIN (= JOIN puro)', en: 'INNER JOIN (plain JOIN)' },
  { cmd: 'SELECT * FROM a LEFT JOIN b ON a.id = b.id;', cat: 'query', pt: 'LEFT OUTER JOIN — preserva a da esquerda', en: 'LEFT OUTER JOIN — keeps every left row' },
  { cmd: 'SELECT cidade, COUNT(*) FROM c GROUP BY cidade HAVING COUNT(*) > 1;', cat: 'query', pt: 'Filtra grupos depois da agregação', en: 'Filters groups after aggregation' },
  { cmd: 'SELECT * FROM a WHERE EXISTS (SELECT 1 FROM b WHERE b.a_id = a.id);', cat: 'query', pt: 'Subconsulta existencial (boa com índices)', en: 'Existential subquery (index-friendly)' },

  // ─── PRAGMAs ──────────────────────────────────────────────────────────────
  { cmd: 'PRAGMA journal_mode = WAL;', cat: 'pragma', pt: 'Modo WAL — leituras não bloqueiam escritas', en: 'WAL mode — readers never block writers' },
  { cmd: 'PRAGMA foreign_keys = ON;', cat: 'pragma', pt: 'Ativa FOREIGN KEY — vem desligado por conexão!', en: 'Turns on FOREIGN KEY — off by default per connection!' },
  { cmd: 'PRAGMA user_version = 1;', cat: 'pragma', pt: 'Versão de schema para migrações (usado com application_id)', en: 'Schema version for migrations (paired with application_id)' },
  { cmd: 'PRAGMA integrity_check;', cat: 'pragma', pt: 'Verifica corrupção do arquivo (retorna ok)', en: 'Checks file corruption (returns ok)' },
  { cmd: 'PRAGMA quick_check;', cat: 'pragma', pt: 'Verificação mais rápida (1 passada)', en: 'Faster 1-pass integrity check' },
  { cmd: 'PRAGMA busy_timeout = 5000;', cat: 'pragma', pt: 'Ms a esperar por lock antes de "database is locked"', en: 'Ms to wait for a lock before "database is locked"' },
  { cmd: 'PRAGMA cache_size = -64000;', cat: 'pragma', pt: 'Cache de página em KB (por isso o sinal negativo)', en: 'Per-connection page cache in KB (hence the minus sign)' },
  { cmd: 'PRAGMA synchronous = NORMAL;', cat: 'pragma', pt: 'Bom equilíbrio durabilidade/velocidade (ideal em WAL)', en: 'Good durability/speed balance (ideal in WAL)' },
  { cmd: 'PRAGMA table_info(users);', cat: 'pragma', pt: 'Colunas, tipos e constraints de uma tabela', en: 'Columns, types and constraints of a table' },
  { cmd: 'PRAGMA index_list(users);', cat: 'pragma', pt: 'Lista os índices de uma tabela', en: 'Lists the indexes of a table' },
  { cmd: 'PRAGMA auto_vacuum = INCREMENTAL;', cat: 'pragma', pt: 'Habilita vacúo incremental (junto de VACUUM / incremental_vacuum)', en: 'Enables incremental vacuuming (with VACUUM/incremental_vacuum)' },
  { cmd: 'PRAGMA locking_mode = EXCLUSIVE;', cat: 'pragma', pt: 'Segura o lock da conexão (útil em leitura massiva)', en: 'Holds the connection lock (useful for bulk reads)' },
  { cmd: 'PRAGMA temp_store = MEMORY;', cat: 'pragma', pt: 'Tabelas temp em memória', en: 'Temp tables in memory' },

  // ─── Funções ──────────────────────────────────────────────────────────────
  { cmd: "SELECT date('now'), datetime('now'), time('now');", cat: 'functions', pt: 'Data/hora atuais em UTC (o padrão do SQLite)', en: 'Current date/time in UTC (SQLite default)' },
  { cmd: "SELECT datetime('now', 'localtime');", cat: 'functions', pt: 'Hora local ajustada', en: 'Local time adjusted' },
  { cmd: "SELECT strftime('%Y-%m-%d %H:%M:%S', 'now');", cat: 'functions', pt: 'Formata data/hora num formato livre', en: 'Formats date/time with a free format' },
  { cmd: "SELECT date('now', '-1 month', '+7 days');", cat: 'functions', pt: 'Modificadores: soma/subtrai unidades de tempo', en: 'Modifiers: adds/subtracts time units' },
  { cmd: "SELECT unixepoch('now');", cat: 'functions', pt: 'Unix epoch em segundos (3.38+)', en: 'Unix epoch in seconds (3.38+)' },
  { cmd: "SELECT strftime('%s', 'now');", cat: 'functions', pt: 'Epoch também funciona assim em versões antigas', en: 'Epoch also works like this on older versions' },
  { cmd: "SELECT substr('abcde', 2, 3), upper('oi'), length('abc');", cat: 'functions', pt: 'String: substr, upper/lower, length', en: 'String: substr, upper/lower, length' },
  { cmd: "SELECT trim('  x  '), replace('banana', 'na', 'X');", cat: 'functions', pt: 'String: trim e replace', en: 'String: trim and replace' },
  { cmd: "SELECT printf('%.2f', 3.14159);", cat: 'functions', pt: 'Formata número (mesmo estilo do printf C)', en: 'Formats a number (C printf style)' },
  { cmd: 'SELECT ROUND(3.14159, 2), ABS(-4), MAX(1, 9);', cat: 'functions', pt: 'Números: round, abs, min/max', en: 'Numbers: round, abs, min/max' },
  { cmd: "SELECT GROUP_CONCAT(nome, ', ') FROM c;", cat: 'functions', pt: 'Agrega strings em uma linha só', en: 'Concatenates strings into one row' },
  { cmd: 'SELECT COUNT(*), SUM(x), AVG(x), MIN(x), MAX(x) FROM t;', cat: 'functions', pt: 'Agregados clássicos', en: 'Classic aggregates' },
  { cmd: "SELECT json_extract(data, '$.nome') FROM t;", cat: 'functions', pt: 'Extrai um valor de uma coluna JSON', en: 'Extracts a value from a JSON column' },
  { cmd: "SELECT * FROM json_each('[1, 2, 3]');", cat: 'functions', pt: 'Expande um JSON em linhas (value, key, ...)', en: 'Expands JSON into rows (value, key, ...)' },
  { cmd: "SELECT json_object('a', 1, 'b', 2);", cat: 'functions', pt: 'Monta um objeto JSON', en: 'Builds a JSON object' },
  { cmd: "SELECT CAST('42' AS INTEGER), CAST(x AS TEXT);", cat: 'functions', pt: 'Conversão explícita de tipo', en: 'Explicit type conversion' },

  // ─── Índices & performance ────────────────────────────────────────────────
  { cmd: 'CREATE INDEX idx_x ON t (col);', cat: 'indexes', pt: 'Índice simples', en: 'Plain index' },
  { cmd: 'CREATE INDEX idx_ab ON t (a, b);', cat: 'indexes', pt: 'Índice composto — a ordem importa (prefixo à esquerda)', en: 'Composite index — column order matters (leftmost prefix)' },
  { cmd: 'CREATE UNIQUE INDEX idx_u ON t (col);', cat: 'indexes', pt: 'Índice que garante unicidade', en: 'Index that enforces uniqueness' },
  { cmd: 'CREATE INDEX idx_p ON t (col) WHERE ativo = 1;', cat: 'indexes', pt: 'Índice parcial — só as linhas do filtro', en: 'Partial index — only the filtered rows' },
  { cmd: 'CREATE INDEX idx_d ON t (col DESC);', cat: 'indexes', pt: 'Índice com ordenação descendente', en: 'Descending index' },
  { cmd: 'EXPLAIN QUERY PLAN SELECT ...;', cat: 'indexes', pt: 'Mostra se a query usa índice ou varredura', en: 'Shows whether the query uses an index or a scan' },
  { cmd: 'ANALYZE;', cat: 'indexes', pt: 'Coleta estatísticas para o planificador', en: 'Collects statistics for the planner' },
  { cmd: 'SELECT a, b FROM t WHERE a = 1;', cat: 'indexes', pt: 'Índice de cobertura: só colunas do índice evita ler a linha', en: 'Covering index: only index columns avoids reading the row' },
  { cmd: 'PRAGMA index_info(idx_x);', cat: 'indexes', pt: 'Colunas que compõem um índice', en: 'Columns that make up an index' },
  { cmd: 'SELECT ... FROM t INDEXED BY idx_x WHERE ...;', cat: 'indexes', pt: 'Força o uso manual de um índice (debug)', en: 'Manually forces an index (debugging)' },

  // ─── Full-text search (FTS5) ──────────────────────────────────────────────
  { cmd: 'CREATE VIRTUAL TABLE posts USING fts5(title, body);', cat: 'fts', pt: 'Tabela virtual de busca full-text', en: 'Virtual table for full-text search' },
  { cmd: "SELECT * FROM posts WHERE posts MATCH 'sqlite';", cat: 'fts', pt: 'Busca o termo nas colunas indexadas', en: 'Searches the indexed columns for the term' },
  { cmd: "SELECT * FROM posts WHERE posts MATCH 'sqlite AND database' OR posts MATCH 'journal';", cat: 'fts', pt: 'Operadores booleanos AND/OR dentro do MATCH', en: 'Boolean AND/OR operators inside MATCH' },
  { cmd: "SELECT * FROM posts WHERE posts MATCH 'sqlit*';", cat: 'fts', pt: 'Prefixos com *', en: 'Prefix matching with *' },
  { cmd: 'SELECT *, bm25(posts) FROM posts WHERE posts MATCH ... ORDER BY bm25(posts);', cat: 'fts', pt: 'Ranking — bm25 menor é melhor', en: 'Ranking — lower bm25 is better' },
  { cmd: "SELECT snippet(posts, 0, '<b>', '</b>', '…', 12) ...;", cat: 'fts', pt: 'Trecho resumido com os termos em destaque', en: 'Summarized snippet highlighting the matches' },
  { cmd: 'CREATE VIRTUAL TABLE posts USING fts5(title, tokenize = "porter");', cat: 'fts', pt: 'Stemming com o tokenizer porter', en: 'Stemming with the porter tokenizer' },
  { cmd: 'CREATE VIRTUAL TABLE posts USING fts5(content, content_rowid = "id", content = "t");', cat: 'fts', pt: 'External content — índice separado do texto original', en: 'External content — index separate from the source table' },
  { cmd: 'INSERT INTO posts(posts) VALUES (\'rebuild\');', cat: 'fts', pt: 'Reconstrói o índice full-text', en: 'Rebuilds the full-text index' },

  // ─── Backup & manutenção ──────────────────────────────────────────────────
  { cmd: '.backup backup.db', cat: 'backup', pt: 'Copia o banco de forma consistente (API de backup)', en: 'Consistently copies the database (backup API)' },
  { cmd: 'sqlite3 app.db ".dump" > backup.sql', cat: 'backup', pt: 'Exporta o banco inteiro como SQL', en: 'Exports the whole database as SQL' },
  { cmd: 'sqlite3 app.db ".dump" | sqlite3 new.db', cat: 'backup', pt: 'Restaura o dump num banco novo', en: 'Restores the dump into a new database' },
  { cmd: 'VACUUM;', cat: 'backup', pt: 'Recompacta o arquivo e reduz espaço desperdiçado', en: 'Rebuilds the file, reclaiming wasted space' },
  { cmd: "VACUUM INTO 'out.db';", cat: 'backup', pt: 'Copia o banco já compactado para outro arquivo (3.27+)', en: 'Copies the compacted database to another file (3.27+)' },
  { cmd: 'PRAGMA incremental_vacuum;', cat: 'backup', pt: 'Vacúo em pedaços (requer auto_vacuum=INCREMENTAL)', en: 'Vacuuming in pieces (needs auto_vacuum=INCREMENTAL)' },
  { cmd: 'PRAGMA application_id = 1234567;', cat: 'backup', pt: 'Assina o arquivo com um ID (migrations / APPID em hex)', en: 'Signs the file with an app ID (migrations / APPID hex)' },

  // ─── Gotchas & dicas ──────────────────────────────────────────────────────
  { cmd: "CREATE TABLE t (v VARCHAR(255));", cat: 'gotchas', pt: 'VARCHAR(255) não limita nada — sem o STRICT há só "affinity"', en: 'VARCHAR(255) enforces nothing — without STRICT there is only affinity' },
  { cmd: 'CREATE TABLE t (nick TEXT UNIQUE); INSERT ... VALUES (NULL), (NULL);', cat: 'gotchas', pt: 'NULL ignora UNIQUE — múltiplos NULLs coexistem', en: 'NULL ignores UNIQUE — multiple NULLs can coexist' },
  { cmd: 'INSERT INTO t (x) VALUES (5); SELECT last_insert_rowid();', cat: 'gotchas', pt: 'rowid/alias gerado automaticamente a cada linha', en: 'rowid/alias auto-generated per row' },
  { cmd: "SELECT x FROM t WHERE x = NULL;  -- nunca casa!", cat: 'gotchas', pt: 'Igualdade com NULL não funciona — use IS NULL', en: 'Equality with NULL never matches — use IS NULL' },
  { cmd: 'PRAGMA foreign_keys = ON;  -- repetir em CADA conexão', cat: 'gotchas', pt: 'FK fica desligada em conexões novas — ligue sempre', en: 'FKs are off in new connections — always enable it' },
  { cmd: "SELECT * FROM t WHERE datetime(t) = '2020-01-01 00:00:00';", cat: 'gotchas', pt: 'Datas são TEXT — normalize para ISO 8601 para comparar', en: 'Dates are TEXT — normalize to ISO 8601 to compare' },
  { cmd: "CREATE TABLE t (id INTEGER PRIMARY KEY AUTOINCREMENT);", cat: 'gotchas', pt: 'AUTOINCREMENT quase nunca é preciso — evita só reuso de rowid', en: 'AUTOINCREMENT is rarely needed — it only forbids rowid reuse' },
  { cmd: 'DELETE FROM t WHERE ...;  -- + VACUUM', cat: 'gotchas', pt: 'DELETE não encolhe o arquivo — só o VACUUM recompacta', en: 'DELETE does not shrink the file — only VACUUM does' },
  { cmd: '== é igual a = ; por exemplo col = 1 e col == 1', cat: 'gotchas', pt: 'Em SQLite, = e == são equivalentes', en: 'In SQLite, = and == are equivalent' },
]

const translations = {
  pt: {
    title: 'Cheat Sheet de SQLite',
    intro: (
      <>
        Referência pesquisável do SQLite — o banco embarcado mais usado do
        mundo. Cobrem o CLI <Text code>sqlite3</Text> e seus respectivos
        dot-commands, abertura de bancos (arquivo, <Text code>:memory:</Text>,
        somente leitura, attach), DDL & tipos (incluindo tabelas{' '}
        <Text code>STRICT</Text> e <Text code>WITHOUT ROWID</Text>), DML com
        upsert (<Text code>ON CONFLICT</Text>) e <Text code>RETURNING</Text>,
        consultas (CTEs recursivas e window functions), PRAGMAs (
        <Text code>WAL</Text>, <Text code>foreign_keys</Text>,{' '}
        <Text code>busy_timeout</Text>), funções de data/string/JSON,
        índices parciais e <Text code>EXPLAIN QUERY PLAN</Text>, busca
        full-text com FTS5, backup/manutenção com{' '}
        <Text code>VACUUM</Text> e os gotchas clássicos. Tudo 100%
        client-side (só texto de referência).
      </>
    ),
    tipTitle: 'Dicas rápidas',
    tipBody: (
      <>
        Habilite <Text code>PRAGMA foreign_keys = ON</Text> em toda conexão
        nova (o padrão é desligado!). Para escrita/leitura concorrente use{' '}
        <Text code>PRAGMA journal_mode = WAL</Text>.{' '}
        <Text code>INTEGER PRIMARY KEY</Text> é um alias da{' '}
        <Text code>rowid</Text>. Datas são TEXT em ISO 8601 (modifier{' '}
        <Text code>localtime</Text> converte). Crítica:{' '}
        <Text code>VARCHAR(255)</Text> não impõe limite — somente tabelas{' '}
        <Text code>STRICT</Text> forçam os tipos. Comparações de NULL só
        funcionam com <Text code>IS NULL</Text>.
      </>
    ),
    search: 'Buscar snippet ou descrição...',
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
    title: 'SQLite Cheat Sheet',
    intro: (
      <>
        A searchable reference for SQLite — the world\'s most used embedded
        database. Covers the <Text code>sqlite3</Text> CLI and its
        dot-commands, opening databases (file, <Text code>:memory:</Text>,
        read-only, attach), DDL & types (including{' '}
        <Text code>STRICT</Text> and <Text code>WITHOUT ROWID</Text> tables),
        DML with upserts (<Text code>ON CONFLICT</Text>) and{' '}
        <Text code>RETURNING</Text>, queries (recursive CTEs and window
        functions), PRAGMAs (<Text code>WAL</Text>,{' '}
        <Text code>foreign_keys</Text>, <Text code>busy_timeout</Text>),
        date/string/JSON functions, partial indexes and{' '}
        <Text code>EXPLAIN QUERY PLAN</Text>, FTS5 full-text search,
        backup/maintenance with <Text code>VACUUM</Text> and the classic
        gotchas. 100% client-side (reference text only).
      </>
    ),
    tipTitle: 'Quick tips',
    tipBody: (
      <>
        Enable <Text code>PRAGMA foreign_keys = ON</Text> on every new
        connection (it is off by default!). For concurrent reads/writes use{' '}
        <Text code>PRAGMA journal_mode = WAL</Text>.{' '}
        <Text code>INTEGER PRIMARY KEY</Text> is an alias for the{' '}
        <Text code>rowid</Text>. Dates are ISO 8601 TEXT. Key gotcha:{' '}
        <Text code>VARCHAR(255)</Text> is not enforced — only{' '}
        <Text code>STRICT</Text> tables pin types. NULL comparisons only work
        with <Text code>IS NULL</Text>.
      </>
    ),
    search: 'Search a snippet or description...',
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

export default function SqliteCheatsheetPage() {
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
    const head = '| Command | Category | Description |\n|---|---|---|\n'
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
      <Title level={2}><CodeOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Alert type="info" showIcon icon={<CodeOutlined />} message={t.tipTitle} description={t.tipBody} />

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