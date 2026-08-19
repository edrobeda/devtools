import React, { useMemo, useState, useCallback } from 'react'
import { Typography, Card, Space, Input, List, Tag, Radio, Alert, Button, message, Collapse } from 'antd'
import { CodeOutlined, SearchOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const CATEGORIES = [
  'cli',
  'ddl',
  'dml',
  'query',
  'user',
  'index',
  'admin',
  'gotchas',
]

const CATEGORY_COLOR = {
  cli: 'geekblue',
  ddl: 'purple',
  dml: 'green',
  query: 'cyan',
  user: 'blue',
  index: 'gold',
  admin: 'red',
  gotchas: 'volcano',
}

const labelOf = {
  cli: { pt: 'CLI & client mysql', en: 'CLI & the mysql client' },
  ddl: { pt: 'DDL & tipos', en: 'DDL & types' },
  dml: { pt: 'DML & upsert', en: 'DML & upsert' },
  query: { pt: 'Consultas & funções', en: 'Queries & functions' },
  user: { pt: 'Usuários & permissões', en: 'Users & permissions' },
  index: { pt: 'Índices & performance', en: 'Indexes & performance' },
  admin: { pt: 'Administração & backup', en: 'Admin & backup' },
  gotchas: { pt: 'Gotchas & dicas', en: 'Gotchas & tips' },
}

const COMMANDS = [
  // ─── CLI & client mysql ───────────────────────────────────────────────────
  { cmd: 'mysql -u root -p', cat: 'cli', pt: 'Conecta como root (prompte a senha)', en: 'Connects as root (prompts for the password)' },
  { cmd: 'mysql -h dbhost -P 3306 -u app -p minha_base', cat: 'cli', pt: 'Conecta em host/porta/base específicos', en: 'Connects to a specific host/port/database' },
  { cmd: 'mysql -e "SHOW DATABASES;"', cat: 'cli', pt: 'Executa SQL pela linha de comando e sai do client', en: 'Runs SQL from the command line and exits' },
  { cmd: 'mysql -t -e "SELECT * FROM users;"', cat: 'cli', pt: 'Saída em formato de tabela com cabeçalho', en: 'Table-formatted output with headers' },
  { cmd: 'mysql app < dump.sql', cat: 'cli', pt: 'Importa um arquivo SQL direto na base', en: 'Imports an SQL file straight into the database' },
  { cmd: 'mysql --default-character-set=utf8mb4', cat: 'cli', pt: 'Força a codificação de caracteres da conexão', en: 'Forces the connection character set' },
  { cmd: 'SHOW DATABASES;', cat: 'cli', pt: 'Lista as bases', en: 'Lists the databases' },
  { cmd: 'USE minha_base;', cat: 'cli', pt: 'Seleciona a base de trabalho atual', en: 'Selects the current database' },
  { cmd: 'SHOW TABLES;', cat: 'cli', pt: 'Lista as tabelas da base atual', en: 'Lists the tables in the current database' },
  { cmd: 'DESCRIBE users;  -- ou DESC users', cat: 'cli', pt: 'Colunas, tipos e chaves de uma tabela', en: 'Columns, types and keys of a table' },
  { cmd: 'SHOW CREATE TABLE users;', cat: 'cli', pt: 'Mostra o CREATE TABLE completo da tabela', en: 'Shows the full CREATE TABLE of a table' },
  { cmd: 'SHOW CREATE DATABASE minha_base;', cat: 'cli', pt: 'Mostra o CREATE DATABASE com charset/collation', en: 'Shows the CREATE DATABASE with charset/collation' },
  { cmd: 'SHOW WARNINGS;', cat: 'cli', pt: 'Avisos da última instrução (ex.: precisões truncadas)', en: 'Warnings from the last statement (e.g. truncated values)' },
  { cmd: 'SELECT VERSION();', cat: 'cli', pt: 'Versão do servidor (MariaDB responde ex.: 10.11.x)', en: 'Server version (MariaDB reports e.g. 10.11.x)' },
  { cmd: '\\q  -- ou exit', cat: 'cli', pt: 'Sai do client mysql', en: 'Exits the mysql client' },

  // ─── DDL & tipos ──────────────────────────────────────────────────────────
  { cmd: 'CREATE DATABASE app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;', cat: 'ddl', pt: 'Cria uma base com charset utf8mb4 e unicode_ci', en: 'Creates a database with utf8mb4 and unicode_ci' },
  { cmd: 'CREATE TABLE users (id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, email VARCHAR(255) NOT NULL UNIQUE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);', cat: 'ddl', pt: 'Tabela padrão: PK auto-increment, email único e timestamp automático', en: 'Standard table: auto-increment PK, unique email and an automatic timestamp' },
  { cmd: 'AUTO_INCREMENT', cat: 'ddl', pt: 'Só funciona em coluna de chave — gera 1, 2, 3... sem correr de novo', en: 'Works on key columns only — keeps counting up, never reuses' },
  { cmd: 'ENGINE=InnoDB', cat: 'ddl', pt: 'Motor padrão: transações (ACID), FKs e row-level locks', en: 'Default engine: transactions (ACID), FKs, row-level locks' },
  { cmd: 'VARCHAR(255) / CHAR(10)', cat: 'ddl', pt: 'VARCHAR é variável (255 = máx. de chars); CHAR é fixo, acolchoado com espaços', en: 'VARCHAR is variable-length; CHAR is fixed-length, space-padded' },
  { cmd: 'TEXT / BLOB', cat: 'ddl', pt: 'Tipos grandes: TEXT para texto (TINY/MEDIUM/LONG), BLOB para binário', en: 'Big types: TEXT for text (TINY/MEDIUM/LONG), BLOB for binary' },
  { cmd: 'DECIMAL(10,2)', cat: 'ddl', pt: 'Decimal exato para dinheiro — nunca use FLOAT pra valor monetário', en: 'Exact decimal for money — never use FLOAT for currency' },
  { cmd: 'DATETIME vs TIMESTAMP', cat: 'ddl', pt: 'DATETIME vai de 1000 a 9999; TIMESTAMP vira int (1970–2038) e se ajusta ao fuso da sessão', en: 'DATETIME spans 1000–9999; TIMESTAMP is an int (1970–2038) and follows the session timezone' },
  { cmd: 'BOOLEAN', cat: 'ddl', pt: 'Na prática é TINYINT(1) — aceita 0/1 (TRUE/FALSE viram 1/0)', en: 'Practically a TINYINT(1) — accepts 0/1 (TRUE/FALSE become 1/0)' },
  { cmd: 'ENUM(\'novo\', \'ativo\', \'bloqueado\')', cat: 'ddl', pt: 'Coluna restrita a valores da lista (cuidado ao adicionar valores)', en: 'Column restricted to the listed values (careful when adding values)' },
  { cmd: 'SET(\'a\',\'b\',\'c\')', cat: 'ddl', pt: 'Sob conjunto de bandeiras; armazena combinações separadas por vírgula', en: 'Flags as a set; stores comma-separated combinations' },
  { cmd: 'JSON', cat: 'ddl', pt: 'Coluna nativa JSON (5.7+) — validada e armazenada em binário', en: 'Native JSON column (5.7+) — validated and stored in binary form' },
  { cmd: "ALTER TABLE users ADD COLUMN age INT UNSIGNED AFTER email;", cat: 'ddl', pt: 'Adiciona coluna em posição específica (AFTER nome_coluna)', en: 'Adds a column at a specific position (AFTER column_name)' },
  { cmd: "ALTER TABLE users MODIFY COLUMN email VARCHAR(320) NOT NULL;", cat: 'ddl', pt: 'Redefine o tipo/restrições de uma coluna existente', en: 'Redefines the type/constraints of an existing column' },
  { cmd: 'ALTER TABLE users DROP COLUMN age;', cat: 'ddl', pt: 'Remove uma coluna', en: 'Drops a column' },
  { cmd: 'ALTER TABLE users RENAME COLUMN a TO b;', cat: 'ddl', pt: 'Renomeia uma coluna (8.0+/MariaDB)', en: 'Renames a column (8.0+/MariaDB)' },
  { cmd: 'ALTER TABLE users RENAME TO contas;', cat: 'ddl', pt: 'Renomeia a tabela inteira', en: 'Renames the whole table' },
  { cmd: 'DROP TABLE users;', cat: 'ddl', pt: 'Apaga tabela e dados (irreversível)', en: 'Drops the table and its data (irreversible)' },
  { cmd: 'TRUNCATE TABLE users;', cat: 'ddl', pt: 'Apaga todas as linhas de uma vez, quebrando o AUTO_INCREMENT', en: 'Clears all rows at once, resetting AUTO_INCREMENT' },

  // ─── DML & upsert ─────────────────────────────────────────────────────────
  { cmd: 'INSERT INTO users (email, age) VALUES (\'a@b.com\', 30);', cat: 'dml', pt: 'Insere uma linha', en: 'Inserts a row' },
  { cmd: "INSERT INTO users (email) VALUES ('a@b.com'), ('c@d.com'), ('e@f.com');", cat: 'dml', pt: 'Multi-insert numa única instrução', en: 'Multi-row insert in a single statement' },
  { cmd: "INSERT INTO log_tmp SELECT * FROM log;", cat: 'dml', pt: 'Insere a partir de um SELECT', en: 'Inserts from a SELECT' },
  { cmd: "INSERT INTO users (id, email) VALUES (1, 'novo@b.com') ON DUPLICATE KEY UPDATE email = VALUES(email);", cat: 'dml', pt: 'Upsert clássico — atualiza em conflito de PK/UNIQUE', en: 'Classic upsert — updates on PK/UNIQUE conflict' },
  { cmd: "INSERT INTO users (id, email) AS nova VALUES (1, 'x@b.com') ON DUPLICATE KEY UPDATE email = nova.email;", cat: 'dml', pt: 'Upsert moderno com alias (8.0.20+ — substitui o VALUES() obsoleto)', en: 'Modern aliased upsert (8.0.20+ — replaces the deprecated VALUES())' },
  { cmd: "INSERT IGNORE INTO users (email) VALUES ('a@b.com');", cat: 'dml', pt: 'Ignora silenciosamente linhas com conflito', en: 'Silently skips rows that conflict' },
  { cmd: "REPLACE INTO users (id, email) VALUES (1, 'x@b.com');", cat: 'dml', pt: 'Deleta a linha conflitante e insere de novo (cuidado: muda o id!)', en: 'Deletes the conflicting row and re-inserts (careful: changes the id!)' },
  { cmd: 'UPDATE users SET age = 31 WHERE id = 5;', cat: 'dml', pt: 'Atualiza linhas que casam o WHERE (sem WHERE, atualiza todas!)', en: 'Updates rows matching the WHERE (no WHERE = updates everything!)' },
  { cmd: 'UPDATE users SET age = age + 1 WHERE id IN (1, 2, 3);', cat: 'dml', pt: 'Atualização incremental com IN', en: 'Incremental update with IN' },
  { cmd: 'UPDATE users SET age = 40 WHERE id = 5 LIMIT 1;', cat: 'dml', pt: 'MySQL aceita LIMIT em UPDATE (MariaDB não)', en: 'MySQL allows LIMIT on UPDATE (MariaDB doesn\'t)' },
  { cmd: 'DELETE FROM users WHERE id = 5;', cat: 'dml', pt: 'Apaga linhas que casam o WHERE', en: 'Deletes rows matching the WHERE' },
  { cmd: 'DELETE FROM users WHERE id > 100 LIMIT 10;', cat: 'dml', pt: 'Apaga em lote limitado — útil pra não travar a tabela', en: 'Batched delete — handy to avoid locking the table' },
  { cmd: 'SELECT LAST_INSERT_ID();', cat: 'dml', pt: 'Id gerado pelo AUTO_INCREMENT da última INSERT na conexão', en: 'The AUTO_INCREMENT id from the last INSERT on this connection' },

  // ─── Consultas & funções ──────────────────────────────────────────────────
  { cmd: 'SELECT * FROM users ORDER BY created_at DESC LIMIT 10 OFFSET 20;', cat: 'query', pt: 'Paginação com LIMIT/OFFSET (OFFSET pula linhas)', en: 'Pagination with LIMIT/OFFSET (OFFSET skips rows)' },
  { cmd: 'SELECT GROUP_CONCAT(email ORDER BY email SEPARATOR \';\') FROM users;', cat: 'query', pt: 'Junta strings de um grupo em uma célula', en: 'Joins strings from a group into one cell' },
  { cmd: "SELECT DATE_FORMAT(created_at, '%Y-%m') AS mes, COUNT(*) FROM users GROUP BY mes;", cat: 'query', pt: 'Agrupa por mês formatado do timestamp', en: 'Groups by the formatted month of the timestamp' },
  { cmd: 'SELECT NOW(), CURDATE(), CURTIME();', cat: 'query', pt: 'Data/hora atuais (NOW inclui hora)', en: 'Current date/time (NOW includes the time)' },
  { cmd: "SELECT DATE_ADD(created_at, INTERVAL 7 DAY) FROM users;", cat: 'query', pt: 'Soma intervalo de tempo (DAY/MONTH/YEAR/HOUR...)', en: 'Adds a time interval (DAY/MONTH/YEAR/HOUR...)' },
  { cmd: 'SELECT DATEDIFF(NOW(), created_at) AS dias_desde;', cat: 'query', pt: 'Diferença em dias entre duas datas', en: 'Difference in days between two dates' },
  { cmd: 'SELECT TIMESTAMPDIFF(MINUTE, created_at, NOW()) FROM users;', cat: 'query', pt: 'Diferença em unidade específica (SECOND/MINUTE/HOUR/...)', en: 'Difference in a specific unit (SECOND/MINUTE/HOUR/...)' },
  { cmd: "SELECT UNIX_TIMESTAMP(created_at) FROM users;", cat: 'query', pt: 'Converte a data em epoch (segundos)', en: 'Converts the date to epoch (seconds)' },
  { cmd: "SELECT STR_TO_DATE('01/08/2026', '%d/%m/%Y');", cat: 'query', pt: 'Parse de data a partir de texto no formato dado', en: 'Parses a date from text using the given format' },
  { cmd: 'SELECT IF(age >= 18, \'maior\', \'menor\') FROM users;', cat: 'query', pt: 'Condicional inline (equivalente ao ternário)', en: 'Inline conditional (ternary equivalent)' },
  { cmd: 'SELECT IFNULL(phone, \'sem telefone\') FROM users;', cat: 'query', pt: 'Retorna o segundo valor se o primeiro for NULL', en: 'Returns the second value if the first is NULL' },
  { cmd: 'SELECT COALESCE(phone, email, \'sem contato\') FROM users;', cat: 'query', pt: 'Primeiro valor não-NULL da lista', en: 'First non-NULL value from the list' },
  { cmd: "SELECT * FROM users WHERE email REGEXP '^a.+@b\\\\.com$';", cat: 'query', pt: 'Regex por linha (RLIKE é alias) — cuidado com o escape da barra', en: 'Per-row regex (RLIKE is an alias) — mind the backslash escaping' },
  { cmd: "SELECT JSON_EXTRACT(prefs, '$.theme') FROM users;  -- também: prefs->'$.theme'", cat: 'query', pt: 'Extrai campo de uma coluna JSON (o operador -> é atalho)', en: 'Extracts a field from a JSON column (the -> operator is shorthand)' },
  { cmd: "SELECT prefs->>'$.theme' FROM users;", cat: 'query', pt: 'Extrai JSON como string pura, sem aspas', en: 'Extracts JSON as a plain string, without quotes' },
  { cmd: 'SELECT CHAR_LENGTH(nome) FROM users;', cat: 'query', pt: 'Tamanho em caracteres (LENGTH conta bytes — pega multibyte)', en: 'Length in characters (LENGTH counts bytes — bites on multibyte)' },
  { cmd: 'SELECT CONCAT_WS(\' - \', nome, email) FROM users;', cat: 'query', pt: 'Concatena ignorando qualquer valor NULL', en: 'Concatenates while skipping NULL values' },
  { cmd: 'SELECT id FROM users WHERE id = 1 FOR UPDATE;', cat: 'query', pt: 'Trava as linhas até o fim da transação (lock pessimista)', en: 'Locks the rows until the transaction ends (pessimistic lock)' },

  // ─── Usuários & permissões ────────────────────────────────────────────────
  { cmd: "CREATE USER 'app'@'%' IDENTIFIED BY 's3nh4-forte';", cat: 'user', pt: 'Cria usuário (8.0+: caching_sha2_password por padrão)', en: 'Creates a user (8.0+: caching_sha2_password by default)' },
  { cmd: "ALTER USER 'app'@'%' IDENTIFIED BY 'nova-senha';", cat: 'user', pt: 'Troca a senha de um usuário', en: 'Changes a user\'s password' },
  { cmd: "GRANT SELECT, INSERT, UPDATE, DELETE ON app.* TO 'app'@'%';", cat: 'user', pt: 'Permissões de banco por tabela/base (* = todas)', en: 'Database privileges per table/schema (* = all)' },
  { cmd: "GRANT ALL PRIVILEGES ON app.* TO 'app'@'%';", cat: 'user', pt: 'Todos os privilégios na base app', en: 'All privileges on the app database' },
  { cmd: "GRANT SELECT ON app.* TO 'leitor'@'%' WITH GRANT OPTION;", cat: 'user', pt: 'Dá permissão de repassar o privilégio adiante', en: 'Allows the privilege to be granted onwards' },
  { cmd: "SHOW GRANTS FOR 'app'@'%';", cat: 'user', pt: 'Lista os privilégios de um usuário', en: 'Lists the privileges of a user' },
  { cmd: "REVOKE DELETE ON app.* FROM 'app'@'%';", cat: 'user', pt: 'Remove um privilégio específico', en: 'Removes a specific privilege' },
  { cmd: "DROP USER 'app_antigo'@'%';", cat: 'user', pt: 'Remove o usuário', en: 'Removes the user' },
  { cmd: "CREATE USER 'leitor'@'localhost' IDENTIFIED BY 'x';", cat: 'user', pt: '\'localhost\' só aceita conexão via socket/loopback — não confunda com \'%\'', en: '\'localhost\' only allows socket/loopback connections — not the same as \'%\'' },
  { cmd: "SELECT user, host, plugin FROM mysql.user;", cat: 'user', pt: 'Inspeciona usuários e o plugin de autenticação de cada um', en: 'Inspects users and each one\'s authentication plugin' },

  // ─── Índices & performance ────────────────────────────────────────────────
  { cmd: 'EXPLAIN SELECT * FROM users WHERE email = \'a@b.com\';', cat: 'index', pt: 'Plano de execução: vê se usa índice (type/rows/key)', en: 'Execution plan: check for index usage (type/rows/key)' },
  { cmd: 'EXPLAIN FORMAT=JSON SELECT ...;', cat: 'index', pt: 'Plano detalhado em JSON (custo por passo)', en: 'Detailed JSON plan (cost per step)' },
  { cmd: 'SHOW INDEX FROM users;', cat: 'index', pt: 'Índices, cardinalidade e colunas de uma tabela', en: 'Indexes, cardinality and columns of a table' },
  { cmd: 'CREATE INDEX idx_email ON users (email);', cat: 'index', pt: 'Índice simples para acelerar buscas pelo email', en: 'Plain index to speed up email lookups' },
  { cmd: 'CREATE UNIQUE INDEX idx_email ON users (email);', cat: 'index', pt: 'Índice que também garante unicidade', en: 'Index that also enforces uniqueness' },
  { cmd: 'CREATE INDEX idx_estado_cidade ON users (estado, cidade);', cat: 'index', pt: 'Índice composto — serve estado, estado+cidade (prefixo à esquerda)', en: 'Composite index — serves estado, estado+cidade (leftmost prefix)' },
  { cmd: "CREATE FULLTEXT INDEX ft_post ON posts (titulo, corpo);", cat: 'index', pt: 'Busca full-text (MATCH AGAINST) em colunas TEXT', en: 'Full-text search (MATCH AGAINST) over TEXT columns' },
  { cmd: "SELECT * FROM posts WHERE MATCH (titulo, corpo) AGAINST ('mysql' IN NATURAL LANGUAGE MODE);", cat: 'index', pt: 'Consulta usando o índice FULLTEXT', en: 'Query using the FULLTEXT index' },
  { cmd: 'ANALYZE TABLE users;', cat: 'index', pt: 'Reconta a cardinalidade — o planner escolhe melhor os índices', en: 'Recounts cardinality — helps the planner pick indexes' },
  { cmd: 'SHOW PROCESSLIST;', cat: 'index', pt: 'Queries rodando agora (para achar consultas travadas/lentas)', en: 'Running queries right now (find slow/stuck ones)' },
  { cmd: "KILL 1234;", cat: 'index', pt: 'Mata a conexão/query pelo id do PROCESSLIST', en: 'Kills the connection/query by its PROCESSLIST id' },
  { cmd: 'SET profiling = 1; SHOW PROFILES;', cat: 'index', pt: 'Mede o tempo real de cada query da sessão', en: 'Times each query executed in the session' },

  // ─── Administração & backup ───────────────────────────────────────────────
  { cmd: 'SHOW GLOBAL STATUS LIKE \'Threads_connected\';', cat: 'admin', pt: 'Métricas em tempo real (conexões ativas etc.)', en: 'Real-time metrics (active connections, etc.)' },
  { cmd: 'SHOW VARIABLES LIKE \'%timeout%\';', cat: 'admin', pt: 'Variáveis de configuração do servidor (wait_timeout, ...)', en: 'Server configuration variables (wait_timeout, ...)' },
  { cmd: 'SHOW ENGINE INNODB STATUS;', cat: 'admin', pt: 'Diagnóstico interno do InnoDB (locks, transações)', en: 'InnoDB internals (locks, transactions)' },
  { cmd: 'mysqldump -u root -p app > app.sql', cat: 'admin', pt: 'Dump lógico da base app', en: 'Logical dump of the app database' },
  { cmd: 'mysqldump --single-transaction -u root -p app > app.sql', cat: 'admin', pt: 'Dump consistente em InnoDB sem travar escrita (sem LOCK TABLES)', en: 'Consistent InnoDB dump without blocking writes (no LOCK TABLES)' },
  { cmd: 'mysqldump --routines --triggers --events -u root -p app > app.sql', cat: 'admin', pt: 'Inclui procedures/functions, triggers e eventos', en: 'Includes stored routines, triggers and events' },
  { cmd: 'mysql -u root -p app < app.sql', cat: 'admin', pt: 'Restaura o dump (rodar na base de destino)', en: 'Restores the dump (run inside the target database)' },
  { cmd: 'mysqladmin -u root -p ping', cat: 'admin', pt: 'Verifica se o servidor está de pé (mysqld is alive)', en: 'Checks whether the server is up (mysqld is alive)' },
  { cmd: 'OPTIMIZE TABLE users;', cat: 'admin', pt: 'Desfragmenta e reconstrói a tabela (análogo ao VACUUM)', en: 'Defragments and rebuilds the table (the VACUUM analog)' },
  { cmd: 'SET GLOBAL connect_timeout = 30;', cat: 'admin', pt: 'Ajusta variável em runtime (global = novas conexões)', en: 'Tweaks a variable at runtime (global = new connections)' },

  // ─── Gotchas & dicas ──────────────────────────────────────────────────────
  { cmd: 'WHERE idade = NULL', cat: 'gotchas', pt: 'Nunca casa — use IS NULL. Igualdade com NULL retorna NULL (falso)', en: 'Never matches — use IS NULL. Equality with NULL is NULL (falsy)' },
  { cmd: 'utf8', cat: 'gotchas', pt: 'utf8 do MySQL é utf8mb3 (3 bytes) — emoji/acentos raros quebram; use utf8mb4', en: 'MySQL utf8 is utf8mb3 (3 bytes) — emoji/rare accents break; use utf8mb4' },
  { cmd: 'SELECT nome, COUNT(*) FROM grupo GROUP BY nome;', cat: 'gotchas', pt: 'ONLY_FULL_GROUP_BY (padrão 5.7+/8): coluna fora do GROUP BY dá erro', en: 'ONLY_FULL_GROUP_BY (default 5.7+/8): columns outside GROUP BY error out' },
  { cmd: 'ALTER TABLE t ADD COLUMN c JSON DEFAULT ...', cat: 'gotchas', pt: 'Coluna JSON não aceita valor padrão (o DEFAULT de JSON é desligado)', en: 'JSON columns cannot have a default value' },
  { cmd: 'TIMESTAMP', cat: 'gotchas', pt: 'TIMESTAMP vira int: alcance 1970–2038 e range vira quack em 2038', en: 'TIMESTAMP is an int: 1970–2038 range — the 2038 problem' },
  { cmd: '`user`.`email` = \'a@b.com\'', cat: 'gotchas', pt: 'Backticks são para identificadores; strings usam aspas simples', en: 'Backticks are for identifiers; strings use single quotes' },
  { cmd: 'AUTO_INCREMENT', cat: 'gotchas', pt: 'Não reutiliza ids — uma INSERT que deu erro de PK ainda consome o próximo valor', en: 'Never reuses ids — a failed PK insert still consumes the next value' },
  { cmd: "CREATE USER 'app'@'%' ...", cat: 'gotchas', pt: 'Pode vir o erro "User does not exist": usuários são \'user\'@\'host\', não só o nome', en: 'You may see "User does not exist": users are \'user\'@\'host\', not just the name' },
  { cmd: 'ORDER BY RAND()', cat: 'gotchas', pt: 'Lentíssimo em tabelas grandes — sorteia tudo; para amostras use tabelas auxiliares', en: 'Very slow on big tables — sorts everything; for samples use helper tables' },
  { cmd: 'SELECT 1/0;', cat: 'gotchas', pt: 'Divisão por zero retorna NULL por padrão (SQL_MODE), não erro', en: 'Division by zero returns NULL by default (SQL_MODE), not an error' },
]

const translations = {
  pt: {
    title: 'Cheat Sheet de MySQL / MariaDB',
    intro: (
      <>
        Referência pesquisável dos bancos relacionais mais populares, 100%
        no navegador. Cobre o client <Text code>mysql</Text> e os comandos{' '}
        <Text code>SHOW</Text>/<Text code>DESC</Text>, DDL & tipos especiais
        (utf8mb4, <Text code>AUTO_INCREMENT</Text>,{' '}
        <Text code>ONLY_FULL_GROUP_BY</Text>, <Text code>JSON</Text>,{' '}
        <Text code>DATETIME</Text> vs <Text code>TIMESTAMP</Text>), DML com
        upsert (<Text code>ON DUPLICATE KEY UPDATE</Text>,{' '}
        <Text code>INSERT IGNORE</Text>, <Text code>REPLACE</Text>),
        consultas & funções de data/string/JSON, usuários & permissões (
        <Text code>CREATE USER</Text>/<Text code>GRANT</Text> e o caso{' '}
        <Text code>'user'@'host'</Text>), índices &{' '}
        <Text code>EXPLAIN</Text>/<Text code>SHOW PROCESSLIST</Text>,
        administração & backup com <Text code>mysqldump</Text> e os gotchas
        clássicos (NULL, utf8mb3, 2038, group-by). Tudo só texto — nada sai
        do navegador.
      </>
    ),
    tipTitle: 'Dicas rápidas',
    tipBody: (
      <>
        Sempre <Text code>utf8mb4</Text> (o <Text code>utf8</Text> não
        aguenta emoji). Use <Text code>DECIMAL</Text> para dinheiro.{' '}
        <Text code>ON DUPLICATE KEY UPDATE</Text> é o upsert; prefira o alias
        nova sintaxe (8.0.20+) ao <Text code>VALUES()</Text> obsoleto. Confira
        se a query usa índice com <Text code>EXPLAIN</Text>. Usuários são{' '}
        <Text code>'usuario'@'host'</Text>. MySQL 8 usa{' '}
        <Text code>caching_sha2_password</Text> — clientes antigos precisam
        trocar o plugin.
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
    title: 'MySQL / MariaDB Cheat Sheet',
    intro: (
      <>
        A searchable reference for the world\'s most popular relational
        databases, 100% in the browser. Covers the <Text code>mysql</Text>{' '}
        client and its <Text code>SHOW</Text>/<Text code>DESC</Text>
        commands, DDL & special types (utf8mb4,{' '}
        <Text code>AUTO_INCREMENT</Text>, <Text code>JSON</Text>,{' '}
        <Text code>DATETIME</Text> vs <Text code>TIMESTAMP</Text>), DML with
        upserts (<Text code>ON DUPLICATE KEY UPDATE</Text>,{' '}
        <Text code>INSERT IGNORE</Text>, <Text code>REPLACE</Text>), query
        functions (date/string/JSON), users & privileges (
        <Text code>CREATE USER</Text>/<Text code>GRANT</Text> and the{' '}
        <Text code>'user'@'host'</Text> gotcha), indexes &{' '}
        <Text code>EXPLAIN</Text>/<Text code>SHOW PROCESSLIST</Text>, admin &
        backup with <Text code>mysqldump</Text> and the classic gotchas
        (NULL, utf8mb3, 2038, group-by). Text only — nothing leaves your
        browser.
      </>
    ),
    tipTitle: 'Quick tips',
    tipBody: (
      <>
        Always use <Text code>utf8mb4</Text> (<Text code>utf8</Text> does not
        handle emoji). Use <Text code>DECIMAL</Text> for money.{' '}
        <Text code>ON DUPLICATE KEY UPDATE</Text> is the upsert; prefer the
        aliased syntax (8.0.20+) over the deprecated{' '}
        <Text code>VALUES()</Text>. Verify index usage with{' '}
        <Text code>EXPLAIN</Text>. Users are{' '}
        <Text code>'user'@'host'</Text>. MySQL 8 defaults to{' '}
        <Text code>caching_sha2_password</Text> — older clients may need a
        plugin change.
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

export default function MysqlCheatsheetPage() {
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