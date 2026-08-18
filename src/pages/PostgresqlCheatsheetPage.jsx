import React, { useMemo, useState, useCallback } from 'react'
import { Typography, Card, Space, Input, List, Tag, Radio, Alert, Button, message, Collapse } from 'antd'
import { DatabaseOutlined, SearchOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const CATEGORIES = [
  'cli',
  'basics',
  'select',
  'types',
  'json',
  'funcs',
  'window',
  'index',
  'tx',
  'schema',
  'admin',
]

const CATEGORY_COLOR = {
  cli: 'geekblue',
  basics: 'green',
  select: 'gold',
  types: 'purple',
  json: 'volcano',
  funcs: 'lime',
  window: 'magenta',
  index: 'cyan',
  tx: 'red',
  schema: 'orange',
  admin: 'blue',
}

const labelOf = {
  cli: { pt: 'psql (linha de comando)', en: 'psql (command line)' },
  basics: { pt: 'DDL & DML básico', en: 'Basic DDL & DML' },
  select: { pt: 'Consultas SELECT', en: 'SELECT queries' },
  types: { pt: 'Tipos de dados', en: 'Data types' },
  json: { pt: 'JSON & JSONB', en: 'JSON & JSONB' },
  funcs: { pt: 'Funções & agregações', en: 'Functions & aggregates' },
  window: { pt: 'Window functions', en: 'Window functions' },
  index: { pt: 'Índices & performance', en: 'Indexes & performance' },
  tx: { pt: 'Transações & locking', en: 'Transactions & locking' },
  schema: { pt: 'Constraints & schema', en: 'Constraints & schema' },
  admin: { pt: 'Admin & manutenção', en: 'Admin & maintenance' },
}

const COMMANDS = [
  // ─── psql (linha de comando) ─────────────────────────────────────────────
  { cmd: 'psql -U app -d mydb -h localhost', cat: 'cli', pt: 'Conecta ao banco com usuário, banco e host', en: 'Connects with user, database and host' },
  { cmd: 'psql postgresql://app:senha@host:5432/db', cat: 'cli', pt: 'Conecta via connection string (URI)', en: 'Connects via a connection string (URI)' },
  { cmd: 'psql -c "SELECT count(*) FROM users;"', cat: 'cli', pt: 'Executa um único comando e sai', en: 'Runs a single command and exits' },
  { cmd: 'psql -f script.sql', cat: 'cli', pt: 'Roda um arquivo .sql', en: 'Runs a .sql file' },
  { cmd: 'SELECT version();', cat: 'cli', pt: 'Versão do servidor e compiladores', en: 'Server version and build info' },
  { cmd: '\\l', cat: 'cli', pt: 'Lista bancos de dados', en: 'Lists databases' },
  { cmd: '\\dt', cat: 'cli', pt: 'Lista tabelas do schema atual', en: 'Lists tables in the current schema' },
  { cmd: '\\d tabela', cat: 'cli', pt: 'Descreve a tabela: colunas, índices, FKs, constraints', en: 'Describes a table: columns, indexes, FKs, constraints' },
  { cmd: '\\d+ tabela', cat: 'cli', pt: 'Descrição detalhada, com tamanhos e comentários', en: 'Detailed description with sizes and comments' },
  { cmd: '\\di', cat: 'cli', pt: 'Lista índices', en: 'Lists indexes' },
  { cmd: '\\dn', cat: 'cli', pt: 'Lista schemas', en: 'Lists schemas' },
  { cmd: '\\du', cat: 'cli', pt: 'Lista papéis (roles)', en: 'Lists roles' },
  { cmd: '\\df', cat: 'cli', pt: 'Lista funções', en: 'Lists functions' },
  { cmd: '\\dv', cat: 'cli', pt: 'Lista views', en: 'Lists views' },
  { cmd: '\\timing on', cat: 'cli', pt: 'Mostra o tempo de cada query executada', en: 'Shows timing for every executed query' },
  { cmd: '\\x', cat: 'cli', pt: 'Alterna a saída para modo expandido/vertical', en: 'Toggles expanded (vertical) display' },
  { cmd: '\\e', cat: 'cli', pt: 'Abre a última query no editor de texto', en: 'Opens the last query in a text editor' },
  { cmd: '\\q', cat: 'cli', pt: 'Sai do psql', en: 'Quits psql' },
  { cmd: '\\password app', cat: 'cli', pt: 'Altera a senha do usuário dentro do client', en: 'Changes a user password inside the client' },
  { cmd: "\\copy (SELECT * FROM t) TO '/tmp/out.csv' CSV HEADER", cat: 'cli', pt: 'Exporta o resultado de uma query para CSV (lado cliente)', en: 'Exports a query result to CSV (client side)' },
  { cmd: '\\copy t FROM \'/tmp/in.csv\' CSV HEADER', cat: 'cli', pt: 'Importa um CSV para uma tabela (lado cliente)', en: 'Imports a CSV into a table (client side)' },
  { cmd: '\\gexec', cat: 'cli', pt: 'Executa cada linha do resultado como se fosse SQL', en: 'Executes each result row as SQL' },
  { cmd: '\\encoding UTF8', cat: 'cli', pt: 'Define o encoding do client', en: 'Sets the client encoding' },

  // ─── DDL & DML básico ─────────────────────────────────────────────────────
  { cmd: 'CREATE DATABASE app;', cat: 'basics', pt: 'Cria um banco', en: 'Creates a database' },
  { cmd: 'CREATE SCHEMA IF NOT EXISTS app;', cat: 'basics', pt: 'Cria um schema (namespace de objetos)', en: 'Creates a schema (object namespace)' },
  { cmd: 'CREATE TABLE users (id serial PRIMARY KEY, email text NOT NULL UNIQUE, created_at timestamptz DEFAULT now());', cat: 'basics', pt: 'Constrói a tabela canônica com PK, unique e timestamp', en: 'Builds the canonical table with PK, unique and timestamp' },
  { cmd: 'CREATE TABLE t (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY);', cat: 'basics', pt: 'Identidade por coluna identity (recomendado sobre serial)', en: 'Identity column (preferred over serial)' },
  { cmd: 'ALTER TABLE users ADD COLUMN age int;', cat: 'basics', pt: 'Adiciona uma coluna (lock leve, sem reescrever a tabela)', en: 'Adds a column (light lock, no table rewrite)' },
  { cmd: 'ALTER TABLE users RENAME COLUMN age TO idade;', cat: 'basics', pt: 'Renomeia uma coluna', en: 'Renames a column' },
  { cmd: 'ALTER TABLE users DROP COLUMN age;', cat: 'basics', pt: 'Remove uma coluna', en: 'Drops a column' },
  { cmd: 'ALTER TABLE orders ADD CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id);', cat: 'basics', pt: 'Adiciona uma constraint de chave estrangeira', en: 'Adds a foreign key constraint' },
  { cmd: 'DROP TABLE IF EXISTS users;', cat: 'basics', pt: 'Remove a tabela', en: 'Drops the table' },
  { cmd: 'TRUNCATE TABLE users;', cat: 'basics', pt: 'Remove todos os dados sem varrer a tabela (sem WHERE)', en: 'Removes all rows without scanning (no WHERE)' },
  { cmd: "INSERT INTO users (email) VALUES ('a@b.com') ON CONFLICT (email) DO NOTHING;", cat: 'basics', pt: 'Inserção que ignora conflito de unique', en: 'Insert that ignores a unique conflict' },
  { cmd: "INSERT INTO users (email) VALUES ('a@b.com') ON CONFLICT (email) DO UPDATE SET updated_at = now();", cat: 'basics', pt: 'Upsert: insere ou atualiza em conflito', en: 'Upsert: insert or update on conflict' },
  { cmd: 'UPDATE users SET age = age + 1 WHERE id = 1;', cat: 'basics', pt: 'Atualiza linhas com expressão', en: 'Updates rows with an expression' },
  { cmd: 'DELETE FROM users WHERE id = 1;', cat: 'basics', pt: 'Remove linhas específicas', en: 'Deletes specific rows' },
  { cmd: 'INSERT INTO users (email) VALUES (\'x\') RETURNING id, created_at;', cat: 'basics', pt: 'RETURNING devolve a linha afetada (muito útil com upsert)', en: 'RETURNING returns the affected row (great with upsert)' },
  { cmd: 'CREATE TEMP TABLE tmp_spam AS SELECT * FROM users WHERE spam;', cat: 'basics', pt: 'Tabela temporária, visível só na sessão', en: 'Temp table, visible only in the session' },
  { cmd: 'SELECT setval(\'users_id_seq\', 500, true);', cat: 'basics', pt: 'Ajusta a sequência após import de dados', en: 'Resets a sequence after data import' },

  // ─── Consultas SELECT ─────────────────────────────────────────────────────
  { cmd: 'SELECT * FROM users LIMIT 10 OFFSET 20;', cat: 'select', pt: 'Paginação — cuidado: OFFSET alto é caro', en: 'Pagination — note: large OFFSET is expensive' },
  { cmd: 'SELECT DISTINCT country FROM users;', cat: 'select', pt: 'Valores distintos de uma coluna', en: 'Distinct values of a column' },
  { cmd: 'SELECT count(*) FROM users;', cat: 'select', pt: 'Conta linhas (mais rápido que count(1) na prática)', en: 'Counts rows (practically faster than count(1))' },
  { cmd: "SELECT * FROM users WHERE email ILIKE '%@gmail.com';", cat: 'select', pt: 'Busca case-insensitive com LIKE', en: 'Case-insensitive LIKE search' },
  { cmd: "SELECT * FROM users WHERE created_at >= now() - interval '7 days';", cat: 'select', pt: 'Filtro por intervalo de tempo relativo', en: 'Relative time window filter' },
  { cmd: 'SELECT * FROM users ORDER BY id DESC NULLS LAST;', cat: 'select', pt: 'NULLS FIRST/LAST controla onde nulls aparecem', en: 'NULLS FIRST/LAST controls where nulls sort' },
  { cmd: 'SELECT country, count(*) FROM users GROUP BY country HAVING count(*) > 100;', cat: 'select', pt: 'HAVING filtra o resultado do GROUP BY', en: 'HAVING filters the GROUP BY result' },
  { cmd: 'SELECT coalesce(age, 18) FROM users;', cat: 'select', pt: 'coalesce — primeiro valor não-nulo', en: 'coalesce — first non-null value' },
  { cmd: 'SELECT u.id, o.total FROM users u JOIN orders o ON o.user_id = u.id;', cat: 'select', pt: 'INNER JOIN explícito', en: 'Explicit INNER JOIN' },
  { cmd: 'SELECT u.id, o.total FROM users u LEFT JOIN orders o ON o.user_id = u.id;', cat: 'select', pt: 'LEFT JOIN mantém linhas sem match (nulls à direita)', en: 'LEFT JOIN keeps unmatched rows (nulls on the right)' },
  { cmd: 'SELECT (users.*) FROM users;', cat: 'select', pt: 'Usa a linha inteira como um valor composto', en: 'Uses the whole row as a composite value' },
  { cmd: 'SELECT * FROM a UNION SELECT * FROM b;', cat: 'select', pt: 'UNION deduplica; UNION ALL não (mais rápido)', en: 'UNION dedupes; UNION ALL does not (faster)' },
  { cmd: 'SELECT * FROM users u WHERE EXISTS (SELECT 1 FROM orders o WHERE o.user_id = u.id);', cat: 'select', pt: 'EXISTS para semijoin sem duplicar linhas', en: 'EXISTS for a semi-join without duplicate rows' },
  { cmd: 'SELECT country, count(*) FILTER (WHERE age > 30) FROM users GROUP BY country;', cat: 'select', pt: 'Agregação com filtro parcial (sem CASE)', en: 'Aggregate with a partial filter (no CASE needed)' },
  { cmd: 'SELECT DISTINCT ON (user_id) * FROM orders ORDER BY user_id, created_at DESC;', cat: 'select', pt: 'Pega a linha mais recente de cada grupo', en: 'Gets the latest row of each group' },
  { cmd: 'SELECT score FROM t ORDER BY score NULLS FIRST;', cat: 'select', pt: 'Nulls primeiro em ordenação', en: 'nulls first in ordering' },

  // ─── Tipos de dados ───────────────────────────────────────────────────────
  { cmd: 'numeric(10,2)', cat: 'types', pt: 'Decimal exato para dinheiro — nunca float', en: 'Exact decimal for money — never float' },
  { cmd: 'text', cat: 'types', pt: 'Sem limite de tamanho; prefira a varchar(n)', en: 'Unbounded text; usually preferable to varchar(n)' },
  { cmd: "varchar(255)", cat: 'types', pt: 'Texto com limite definido na criação; prefira text a menos que precise do limite', en: 'Text with a declared limit; prefer text unless the limit matters' },
  { cmd: 'timestamptz', cat: 'types', pt: 'Timestamp armazenado em UTC com zona de exibição', en: 'Timestamp stored in UTC, displayed in session tz' },
  { cmd: 'timestamp', cat: 'types', pt: 'Timestamp sem zona — só use se a semântica não precisar de tz', en: 'Timestamp without zone — only if tz doesn\'t matter' },
  { cmd: 'date', cat: 'types', pt: 'Dia (sem hora)', en: 'A day (no time)' },
  { cmd: 'interval', cat: 'types', pt: 'Intervalo de tempo (ex.: interval \'2 days\')', en: 'Time interval (e.g. interval \'2 days\')' },
  { cmd: 'uuid', cat: 'types', pt: 'UUID — valor default: gen_random_uuid()', en: 'UUID — default is gen_random_uuid()' },
  { cmd: 'boolean', cat: 'types', pt: 'true/false (aceita also 1/0, yes/no, on/off)', en: 'true/false (also accepts 1/0, yes/no, on/off)' },
  { cmd: 'jsonb', cat: 'types', pt: 'JSON binário, indexável e com operadores — prefira ao json', en: 'Binary JSON, indexable and with operators — prefer over json' },
  { cmd: 'bytea', cat: 'types', pt: 'Blob binário', en: 'Binary blob' },
  { cmd: 'text[]', cat: 'types', pt: 'Array (qualquer tipo suporta []; ex.: text[], int[])', en: 'Array (any type supports []; e.g. text[], int[])' },
  { cmd: 'inet', cat: 'types', pt: 'Endereço IPv4/IPv6 com operadores de rede', en: 'IPv4/IPv6 address with network operators' },
  { cmd: 'serial / bigserial', cat: 'types', pt: 'Pseudo-tipo: integer + sequence (prefira identity)', en: 'Pseudo-type: integer + sequence (prefer identity)' },
  { cmd: 'gen_random_uuid()', cat: 'types', pt: 'Gera UUID v4 aleatório (default de colunas uuid)', en: 'Generates a random UUID v4 (uuid column default)' },
  { cmd: 'CREATE TYPE mood AS ENUM (\'sad\', \'ok\', \'happy\');', cat: 'types', pt: 'Tipo enum próprio', en: 'Custom enum type' },

  // ─── JSON & JSONB ─────────────────────────────────────────────────────────
  { cmd: "SELECT docs->'user' FROM t;", cat: 'json', pt: 'Extrai um campo como JSON', en: 'Extracts a field as JSON' },
  { cmd: "SELECT docs->>'email' FROM t;", cat: 'json', pt: 'Extrai um campo como texto', en: 'Extracts a field as text' },
  { cmd: "SELECT docs#>>'{a,b}' FROM t;", cat: 'json', pt: 'Extrai via caminho (path) como texto', en: 'Extracts via path as text' },
  { cmd: "SELECT docs#>'{a,0}' FROM t;", cat: 'json', pt: 'Extrai via caminho como JSON', en: 'Extracts via path as JSON' },
  { cmd: "SELECT jsonb_set(data, '{a}', '\"x\"') FROM t;", cat: 'json', pt: 'Altera um valor em profundidade (função pura)', en: 'Deeply sets a value (pure function)' },
  { cmd: "SELECT data || '{\"k\": 1}'::jsonb FROM t;", cat: 'json', pt: 'Merge/concatenação de jsonb', en: 'jsonb merge/concatenation' },
  { cmd: 'SELECT jsonb_pretty(data) FROM t;', cat: 'json', pt: 'Formata jsonb com indentação para leitura', en: 'Pretty-prints jsonb for reading' },
  { cmd: 'SELECT jsonb_array_elements(arr) FROM t;', cat: 'json', pt: 'Expande um array json em uma linha por elemento', en: 'Expands a JSON array into one row per element' },
  { cmd: "SELECT * FROM t WHERE data @> '{\"status\":\"active\"}';", cat: 'json', pt: 'Containment: o documento contém o valor (usável com GIN)', en: 'Containment: document contains the value (GIN-friendly)' },
  { cmd: "SELECT * FROM t WHERE data ?| '{a, b}';", cat: 'json', pt: 'Alguma das chaves existe? (?, ?|, ?&)', en: 'Do any of the keys exist? (?, ?|, ?&)' },
  { cmd: 'SELECT row_to_json(u) FROM users u;', cat: 'json', pt: 'Serializa uma linha como objeto JSON', en: 'Serializes a row as a JSON object' },
  { cmd: 'SELECT to_jsonb(u.*) FROM users u;', cat: 'json', pt: 'Converte a linha em jsonb', en: 'Converts a row to jsonb' },
  { cmd: 'CREATE INDEX idx_docs ON t USING GIN (data);', cat: 'json', pt: 'Índice GIN que torna @> e ? rápidos em jsonb', en: 'GIN index that makes @> and ? fast on jsonb' },
  { cmd: "SELECT * FROM t WHERE data @? '$.user.email ? (@ like_regex \".*gmail\")';", cat: 'json', pt: 'JSONPath (Postgres 12+) com expressões', en: 'JSONPath (Postgres 12+) with expressions' },

  // ─── Funções & agregações ─────────────────────────────────────────────────
  { cmd: 'SELECT sum(total), avg(total), min(total), max(total) FROM orders;', cat: 'funcs', pt: 'Agregações clássicas', en: 'Classic aggregates' },
  { cmd: "SELECT string_agg(nome, ', ' ORDER BY nome) FROM users;", cat: 'funcs', pt: 'Concatena valores com ordem (separador editável)', en: 'Concatenates values with order (editable separator)' },
  { cmd: 'SELECT array_agg(id) FROM users;', cat: 'funcs', pt: 'Agrega em um array', en: 'Aggregates into an array' },
  { cmd: "SELECT date_trunc('month', created_at) FROM users;", cat: 'funcs', pt: 'Trunca para início do período (day, week, month, quarter, year...)', en: 'Truncates to the period start (day, week, month, quarter, year...)' },
  { cmd: "SELECT extract(year FROM created_at) FROM users;", cat: 'funcs', pt: 'Extrai parte de uma data', en: 'Extracts a part of a date' },
  { cmd: "SELECT to_char(created_at, 'DD/MM/YYYY HH24:MI:SS') FROM users;", cat: 'funcs', pt: 'Formata data como texto (notação de máscara própria)', en: 'Formats a date as text (own mask notation)' },
  { cmd: "SELECT age(created_at) FROM users;", cat: 'funcs', pt: 'Intervalo desde a data até agora', en: 'Interval from the date until now' },
  { cmd: "SELECT generate_series('2024-01-01'::date, '2024-01-31'::date, '1 day');", cat: 'funcs', pt: 'Gera linhas de datas (ótimo para preencher lacunas)', en: 'Generates date rows (great for filling gaps)' },
  { cmd: 'SELECT generate_series(1, 10);', cat: 'funcs', pt: 'Gera números de 1 a 10', en: 'Generates numbers 1 through 10' },
  { cmd: "SELECT split_part('a,b,c', ',', 2);", cat: 'funcs', pt: 'Pega o enésimo pedaço de uma string separada', en: 'Gets the nth piece of a delimited string' },
  { cmd: "SELECT regexp_replace('abc123', '[0-9]', '', 'g');", cat: 'funcs', pt: 'Substituição com regex (flag g = todas as ocorrências)', en: 'Regex replace (g flag = every occurrence)' },
  { cmd: "SELECT upper(name), lower(email), length(name) FROM users;", cat: 'funcs', pt: 'Transformações básicas de string', en: 'Basic string transformations' },
  { cmd: 'SELECT greatest(a, b), least(a, b) FROM t;', cat: 'funcs', pt: 'Maior/menor entre vários argumentos', en: 'Largest/smallest among several arguments' },
  { cmd: "SELECT encode(sha256(x::bytea), 'hex') FROM t;", cat: 'funcs', pt: 'Hashes — md5, sha224..., encode para hex', en: 'Hashes — md5, sha224..., encode to hex' },
  { cmd: 'SELECT random();', cat: 'funcs', pt: 'Número aleatório entre 0 e 1', en: 'Random number between 0 and 1' },
  { cmd: 'SELECT round(avg(score), 2) FROM t;', cat: 'funcs', pt: 'Arredonda com casas decimais', en: 'Rounds with decimal places' },
  { cmd: 'SELECT unnest(ARRAY[1, 2, 3]);', cat: 'funcs', pt: 'Expande um array em linhas', en: 'Expands an array into rows' },
  { cmd: "SELECT to_timestamp(1700000000);", cat: 'funcs', pt: 'Converte epoch para timestamptz', en: 'Converts epoch to timestamptz' },

  // ─── Window functions ─────────────────────────────────────────────────────
  { cmd: 'SELECT name, salary, rank() OVER (ORDER BY salary DESC) FROM emp;', cat: 'window', pt: 'rank() por uma ordenação global', en: 'rank() over a global ordering' },
  { cmd: 'SELECT id, user_id, row_number() OVER (PARTITION BY user_id ORDER BY created_at DESC) rn FROM logs;', cat: 'window', pt: 'Numera por partição — o dedupe clássico (rn = 1)', en: 'Numbers per partition — the classic dedupe (rn = 1)' },
  { cmd: 'SELECT id, amount, lag(amount, 1) OVER (ORDER BY id) AS prev FROM t;', cat: 'window', pt: 'lag/lead acessam a linha vizinha', en: 'lag/lead access the neighboring row' },
  { cmd: 'SELECT user_id, total, sum(total) OVER (PARTITION BY user_id ORDER BY created_at) AS running FROM orders;', cat: 'window', pt: 'Total acumulado dentro da partição', en: 'Running total within the partition' },
  { cmd: 'SELECT sum(total) OVER () FROM orders;', cat: 'window', pt: 'OVER () sem partição = toda a tabela', en: 'OVER () without partition = the whole table' },
  { cmd: 'SELECT first_value(name) OVER (ORDER BY salary DESC) FROM emp;', cat: 'window', pt: 'Primeiro/último valor da janela', en: 'First/last value of the window' },
  { cmd: 'SELECT sum(total) OVER (ORDER BY id ROWS BETWEEN 2 PRECEDING AND CURRENT ROW) FROM t;', cat: 'window', pt: 'Frame customizado com ROWS/RANGE/GROUPS', en: 'Custom frame with ROWS/RANGE/GROUPS' },

  // ─── Índices & performance ────────────────────────────────────────────────
  { cmd: 'CREATE INDEX idx_users_email ON users (email);', cat: 'index', pt: 'Índice B-tree padrão para equality/range', en: 'Default B-tree index for equality/range' },
  { cmd: 'CREATE UNIQUE INDEX idx ON t (col);', cat: 'index', pt: 'Índice com constraint de unicidade inline', en: 'Index with an inline uniqueness constraint' },
  { cmd: 'CREATE INDEX idx ON t USING GIN (data);', cat: 'index', pt: 'GIN para jsonb, arrays, texto full-text', en: 'GIN for jsonb, arrays, full-text' },
  { cmd: 'CREATE INDEX idx ON t ((lower(email)));', cat: 'index', pt: 'Índice de expressão — combine com query equivalente', en: 'Expression index — match with the equivalent query' },
  { cmd: 'CREATE INDEX idx ON t (a, b);', cat: 'index', pt: 'Índice composto — lembre da regra da coluna mais à esquerda', en: 'Composite index — mind the leftmost-column rule' },
  { cmd: 'CREATE INDEX idx ON t (active) WHERE active;', cat: 'index', pt: 'Índice parcial compacto para subconjunto comum', en: 'Compact partial index for a common subset' },
  { cmd: 'CREATE INDEX CONCURRENTLY idx ON t (col);', cat: 'index', pt: 'Cria sem bloquear escritas (não pode rodar em transação)', en: 'Creates without blocking writes (cannot run in a txn)' },
  { cmd: 'DROP INDEX CONCURRENTLY idx;', cat: 'index', pt: 'Remove sem bloquear escritas', en: 'Drops without blocking writes' },
  { cmd: 'EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM t WHERE x = 1;', cat: 'index', pt: 'Plano real de execução com tempos e buffers', en: 'Real execution plan with timings and buffers' },
  { cmd: 'SET enable_seqscan = off;', cat: 'index', pt: 'Diagnóstico: força o planner a evitar seq scan', en: 'Diagnostic: forces the planner to avoid seq scans' },
  { cmd: 'SELECT pg_size_pretty(pg_total_relation_size(\'users\'));', cat: 'index', pt: 'Tamanho total da tabela + índices + toast', en: 'Total size of table + indexes + TOAST' },
  { cmd: 'ANALYZE users;', cat: 'index', pt: 'Atualiza as estatísticas que o planner usa', en: 'Refreshes the statistics the planner uses' },

  // ─── Transações & locking ─────────────────────────────────────────────────
  { cmd: 'BEGIN; ... COMMIT;', cat: 'tx', pt: 'Bloco transacional explícito', en: 'Explicit transactional block' },
  { cmd: 'ROLLBACK;', cat: 'tx', pt: 'Desfaz a transação corrente', en: 'Aborts the current transaction' },
  { cmd: 'SAVEPOINT sp; ... ROLLBACK TO sp;', cat: 'tx', pt: 'Ponto de restauração parcial dentro da transação', en: 'Partial rollback point inside the transaction' },
  { cmd: 'SELECT * FROM contas WHERE id = 1 FOR UPDATE;', cat: 'tx', pt: 'Trava as linhas lidas para escrita (também FOR SHARE, NOWAIT)', en: 'Locks the read rows for writing (also FOR SHARE, NOWAIT)' },
  { cmd: 'SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;', cat: 'tx', pt: 'Read Committed (padrão) / Repeatable Read / Serializable', en: 'Read Committed (default) / Repeatable Read / Serializable' },
  { cmd: 'SELECT pid, state, query FROM pg_stat_activity;', cat: 'tx', pt: 'Queries em execução e estado de cada backend', en: 'Running queries and the state of each backend' },
  { cmd: "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'active' AND pid <> pg_backend_pid();", cat: 'tx', pt: 'Mata uma query/sessão travada', en: 'Kills a stuck query/session' },
  { cmd: "SET statement_timeout = '30s';", cat: 'tx', pt: 'Timeout por statement da sessão', en: 'Per-statement timeout for the session' },
  { cmd: 'SELECT pg_advisory_lock(42);', cat: 'tx', pt: 'Lock de aplicação próprio (também pg_try_advisory_lock)', en: 'Application-level lock (also pg_try_advisory_lock)' },
  { cmd: 'LOCK TABLE orders IN ACCESS EXCLUSIVE MODE;', cat: 'tx', pt: 'Trava a tabela inteira (modos do nível do MVCC)', en: 'Locks the whole table (MVCC lock modes)' },

  // ─── Constraints & schema ─────────────────────────────────────────────────
  { cmd: 'CREATE TABLE t (id int, CHECK (id > 0));', cat: 'schema', pt: 'CHECK valida o valor na escrita', en: 'CHECK validates the value on write' },
  { cmd: 'CREATE TABLE o (uid int REFERENCES users(id) ON DELETE CASCADE);', cat: 'schema', pt: 'FK com cascade — também SET NULL, SET DEFAULT, RESTRICT', en: 'FK with cascade — also SET NULL, SET DEFAULT, RESTRICT' },
  { cmd: 'ALTER TABLE t ADD CONSTRAINT c UNIQUE (a, b) DEFERRABLE INITIALLY DEFERRED;', cat: 'schema', pt: 'Constraint verificada só no COMMIT (útil para trocas cíclicas)', en: 'Constraint checked only at COMMIT (handy for circular swaps)' },
  { cmd: 'ALTER TABLE t ADD CONSTRAINT c CHECK (total >= 0) NOT VALID; ALTER TABLE t VALIDATE CONSTRAINT c;', cat: 'schema', pt: 'Adiciona constraint sem varrer a tabela, valida depois', en: 'Adds a constraint without a scan, validates later' },
  { cmd: "COMMENT ON TABLE users IS 'Contas da aplicação';", cat: 'schema', pt: 'Documenta a tabela no próprio banco', en: 'Documents the table in the database itself' },
  { cmd: 'SET search_path TO app, public;', cat: 'schema', pt: 'Resolve nomes sem qualificar o schema (cuidado com segurança)', en: 'Resolves names without qualifying the schema (mind security)' },
  { cmd: 'ALTER TABLE users ENABLE ROW LEVEL SECURITY;', cat: 'schema', pt: 'RLS: filtra linhas por política (sem WHERE no app)', en: 'RLS: filters rows by policy (no WHERE in the app)' },
  { cmd: 'CREATE POLICY p ON users USING (tenant_id = current_setting(\'app.tenant\'));', cat: 'schema', pt: 'Política de segurança por linha no RLS', en: 'Per-row security policy for RLS' },

  // ─── Admin & manutenção ───────────────────────────────────────────────────
  { cmd: "CREATE ROLE app LOGIN PASSWORD 'segredo';", cat: 'admin', pt: 'Cria papel com login (CREATE USER é sinônimo com LOGIN)', en: 'Creates a role with login (CREATE USER is synonym with LOGIN)' },
  { cmd: 'ALTER ROLE app WITH SUPERUSER CREATEDB REPLICATION;', cat: 'admin', pt: 'Concede atributos a um papel', en: 'Grants attributes to a role' },
  { cmd: 'GRANT SELECT, INSERT ON users TO app;', cat: 'admin', pt: 'Concede permissões em um objeto', en: 'Grants permissions on an object' },
  { cmd: 'GRANT SELECT ON ALL TABLES IN SCHEMA public TO app;', cat: 'admin', pt: 'Concede em todas as tabelas do schema', en: 'Grants on all tables in the schema' },
  { cmd: 'GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app;', cat: 'admin', pt: 'Sequências precisam USAGE/SELECT separados para INSERT', en: 'Sequences need separate USAGE/SELECT for INSERT' },
  { cmd: "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO app;", cat: 'admin', pt: 'Padrão para objetos criados daqui em diante', en: 'Default for objects created from now on' },
  { cmd: 'REVOKE ALL ON users FROM app;', cat: 'admin', pt: 'Revoga permissões', en: 'Revokes permissions' },
  { cmd: 'VACUUM (ANALYZE) users;', cat: 'admin', pt: 'Reutiliza espaço morto e atualiza estatísticas', en: 'Reclaims dead space and refreshes statistics' },
  { cmd: 'VACUUM FULL users;', cat: 'admin', pt: 'Reescreve a tabela compactando (precisa de lock exclusivo)', en: 'Rewrites the table to shrink it (needs exclusive lock)' },
  { cmd: 'ANALYZE;', cat: 'admin', pt: 'Só atualiza estatísticas', en: 'Refreshes statistics only' },
  { cmd: 'CHECKPOINT;', cat: 'admin', pt: 'Força o flush dos buffers sujos para o disco', en: 'Forces dirty buffers to be flushed to disk' },
  { cmd: 'SELECT pg_reload_conf();', cat: 'admin', pt: 'Recarrega postgresql.conf sem reiniciar', en: 'Reloads postgresql.conf without a restart' },
  { cmd: "SELECT setting FROM pg_settings WHERE name = 'max_connections';", cat: 'admin', pt: 'Lê parâmetros de configuração', en: 'Reads configuration parameters' },
  { cmd: 'pg_dump -U app -d mydb -F c -f backup.dump', cat: 'admin', pt: 'Backup lógico em formato custom', en: 'Logical backup in custom format' },
  { cmd: 'pg_dump -U app -d mydb --schema-only -f schema.sql', cat: 'admin', pt: 'Backup só do schema (sem dados)', en: 'Schema-only backup (no data)' },
  { cmd: 'pg_restore -U app -d mydb -j 4 backup.dump', cat: 'admin', pt: 'Restaura em paralelo com -j', en: 'Restores in parallel with -j' },
  { cmd: 'SELECT cron.schedule(...);', cat: 'admin', pt: 'Agendar jobs exige a extensão pg_cron (não é nativo)', en: 'Scheduling jobs requires the pg_cron extension (not native)' },
  { cmd: 'CREATE EXTENSION IF NOT EXISTS pgcrypto;', cat: 'admin', pt: 'Habilita uma extensão (pgcrypto, pg_stat_statements, citext...)', en: 'Enables an extension (pgcrypto, pg_stat_statements, citext...)' },
]

const translations = {
  pt: {
    title: 'Cheat Sheet de PostgreSQL',
    intro: (
      <>
        Referência pesquisável do PostgreSQL — o client{' '}
        <Text code>psql</Text>, DDL & DML, consultas <Text code>SELECT</Text>,
        tipos de dados, operadores de JSONB, funções e agregações, window
        functions, índices e <Text code>EXPLAIN</Text>, transações &
        locking, constraints & schema e administração/backup. Complementa o{' '}
        <Text code>/references/sql-commands</Text> (SQL genérico) e o{' '}
        <Text code>/database/sql-isolation-levels</Text>. Tudo 100%
        client-side (só texto de referência).
      </>
    ),
    tipTitle: 'Dicas rápidas',
    tipBody: (
      <>
        Prefira <Text code>timestamptz</Text> e{' '}
        <Text code>numeric</Text> para dinheiro. Para deduplicar, use{' '}
        <Text code>ROW_NUMBER() OVER (PARTITION BY ...)</Text> filtrando{' '}
        <Text code>rn = 1</Text>. Índices compostos seguem a regra da
        coluna mais à esquerda e{' '}
        <Text code>CREATE INDEX CONCURRENTLY</Text> não bloqueia escrita.
        Sempre rode <Text code>EXPLAIN (ANALYZE)</Text> antes de "otimizar",
        deixe o autovacuum trabalhar e mantenha o {`VACUUM (ANALYZE)`} em
        tabelas de alta rotatividade.
      </>
    ),
    search: 'Buscar comando ou descrição...',
    all: 'Todos',
    empty: 'Nenhum comando encontrado. Tente outra busca ou categoria.',
    resultsOne: 'comando encontrado',
    resultsMany: 'comandos encontrados',
    copy: 'Copiar como Markdown',
    copied: 'Tabela Markdown copiada',
    copiedError: 'Não foi possível copiar',
    source: 'Fonte de dados (JSON)',
  },
  en: {
    title: 'PostgreSQL Cheat Sheet',
    intro: (
      <>
        A searchable PostgreSQL reference — the{' '}
        <Text code>psql</Text> client, DDL & DML, <Text code>SELECT</Text>{' '}
        queries, data types, JSONB operators, functions & aggregates,
        window functions, indexes & <Text code>EXPLAIN</Text>, transactions
        & locking, constraints & schema, and administration/backup.
        Complements <Text code>/references/sql-commands</Text> (generic SQL)
        and <Text code>/database/sql-isolation-levels</Text>. 100%
        client-side (reference text only).
      </>
    ),
    tipTitle: 'Quick tips',
    tipBody: (
      <>
        Prefer <Text code>timestamptz</Text> and{' '}
        <Text code>numeric</Text> for money. To deduplicate, use{' '}
        <Text code>ROW_NUMBER() OVER (PARTITION BY ...)</Text> filtering{' '}
        <Text code>rn = 1</Text>. Composite indexes obey the leftmost-column
        rule and <Text code>CREATE INDEX CONCURRENTLY</Text> does not block
        writes. Always run <Text code>EXPLAIN (ANALYZE)</Text> before
        "optimizing", let autovacuum do its job and keep{' '}
        {`VACUUM (ANALYZE)`} on high-churn tables.
      </>
    ),
    search: 'Search a command or description...',
    all: 'All',
    empty: 'No commands found. Try another search or category.',
    resultsOne: 'command found',
    resultsMany: 'commands found',
    copy: 'Copy as Markdown',
    copied: 'Markdown table copied',
    copiedError: 'Could not copy',
    source: 'Data source (JSON)',
  },
}

export default function PostgresqlCheatsheetPage() {
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
      `| \`${c.cmd.replace(/\\|/g, '\\\\|').replace(/\n/g, '\\n')}\` | ${labelOf[c.cat][lang]} | ${(c[lang] || '').replace(/\\|/g, '\\\\|')} |`
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
      <Title level={2}><DatabaseOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Alert type="info" showIcon icon={<DatabaseOutlined />} message={t.tipTitle} description={t.tipBody} />

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