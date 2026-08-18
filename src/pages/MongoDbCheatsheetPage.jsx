import React, { useCallback, useMemo, useState } from 'react'
import { Typography, Card, Space, Input, List, Tag, Radio, Alert, Button, message } from 'antd'
import { ReadOutlined, SearchOutlined, CodeOutlined, CopyOutlined, DatabaseOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const CATEGORIES = ['cli', 'crd', 'query', 'upd', 'agg', 'idx', 'data', 'tools']

const CATEGORY_COLOR = {
  cli: 'geekblue',
  crd: 'green',
  query: 'blue',
  upd: 'cyan',
  agg: 'purple',
  idx: 'magenta',
  data: 'gold',
  tools: 'volcano',
}

const labelOf = {
  cli: { pt: 'mongosh & conexão', en: 'mongosh & connection' },
  crd: { pt: 'CRUD', en: 'CRUD' },
  query: { pt: 'Consultas & operadores de query', en: 'Queries & query operators' },
  upd: { pt: 'Operadores de update', en: 'Update operators' },
  agg: { pt: 'Aggregation pipeline', en: 'Aggregation pipeline' },
  idx: { pt: 'Índices & performance', en: 'Indexes & performance' },
  data: { pt: 'Tipos, _id & datas', en: 'Types, _id & dates' },
  tools: { pt: 'Backup, scripting & tools', en: 'Backup, scripting & tools' },
}

const ITEMS = [
  // ─── mongosh & conexão ──────────────────────────────────────────────
  { code: 'mongosh', cat: 'cli',
    pt: 'Abre o shell interativo no servidor padrão `localhost:27017`. É o sucessor do antigo `mongo` — o cliente oficial para CRUD, aggregation e admin.',
    en: 'Opens the interactive shell on the default server `localhost:27017`. The successor to the old `mongo` — the official client for CRUD, aggregation and admin.' },
  { code: 'mongosh "mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/app"', cat: 'cli',
    pt: 'Connection string do Atlas (SRV): usuário, senha e cluster. O `/app` já define o banco default; sem ele você entra no `test`.',
    en: 'Atlas SRV connection string: user, password and cluster. The `/app` sets the default database; without it you land in `test`.' },
  { code: 'mongosh "mongodb://localhost:27017/mydb?authSource=admin"', cat: 'cli',
    pt: 'URI local com banco explícito e `authSource`, o banco onde o usuário está cadastrado — parâmetro que pega todo mundo que esquece.',
    en: 'Local URI with an explicit database and `authSource`, the DB where the user is stored — the parameter everyone forgets.' },
  { code: 'show dbs\nuse mydb\nshow collections\ndb', cat: 'cli',
    pt: 'Navegação padrão: lista bancos, vai pro banco, lista coleções e mostra o banco atual. Note que `show dbs` só lista bancos com dados.',
    en: 'Standard navigation: list databases, switch to one, list collections and show the current DB. Note `show dbs` only lists databases that hold data.' },
  { code: 'mongosh mydb --eval "db.users.countDocuments({active:true})"', cat: 'cli',
    pt: 'Roda um comando único sem entrar no modo interativo — perfeito pra scripts e cron sem ficar "preso" no shell.',
    en: 'Runs a single command without entering interactive mode — perfect for scripts and cron without getting "stuck" in the shell.' },
  { code: 'mongosh mydb --file queries.js', cat: 'cli',
    pt: 'Executa um arquivo `.js` de scripts no shell — o jeito de manter consultas complexas e rotinas versionadas em vez de colar no terminal.',
    en: 'Runs a `.js` script file in the shell — the way to keep complex queries and routines version-controlled instead of pasting them in the terminal.' },
  { code: 'db.help()\ndb.users.help()', cat: 'cli',
    pt: 'Ajuda embutida do shell: métodos de banco e de coleção listados na hora — o aviso rápido quando a sintaxe escapa.',
    en: 'Built-in shell help: database and collection methods listed on the spot — the quick hint when the syntax escapes you.' },
  { code: 'mongosh --host host1 --port 27017 --username u --password p mydb', cat: 'cli',
    pt: 'Conexão com flags separadas (host/porta/credenciais) — alternativa legível à URI quando você prefere não montar a string gigante.',
    en: 'Connection with separate flags (host/port/credentials) — a readable alternative to the URI when you prefer not to build the giant string.' },

  // ─── CRUD ───────────────────────────────────────────────────────────
  { code: 'db.users.insertOne({ name: "Ana", age: 30, tags: ["dev"] })', cat: 'crd',
    pt: 'Insere UM documento; `_id` é gerado automaticamente (ObjectId) se você não passar. O retorno traz o `insertedId`.',
    en: 'Inserts ONE document; `_id` is auto-generated (ObjectId) if you don\'t pass it. The return includes `insertedId`.' },
  { code: 'db.users.insertMany([{ name: "Bia" }, { name: "Caio" }])', cat: 'crd',
    pt: 'Insere uma lista de documentos de uma vez. Se um falhar por duplicação, os anteriores ficam gravados (a menos de `ordered: false`).',
    en: 'Inserts a list of documents at once. If one fails on duplication, the previous ones remain written (unless `ordered: false`).' },
  { code: 'db.users.find()\ndb.users.find().pretty()', cat: 'crd',
    pt: '`find()` retorna um CURSOR, não um array — ele é consumido aos poucos. `pretty()` formata a saída multilinha pra leitura humana.',
    en: '`find()` returns a CURSOR, not an array — it is consumed lazily. `pretty()` formats multiline output for human reading.' },
  { code: "db.users.findOne({ _id: ObjectId('65f0a1b2c3d4e5f6a7b8c9d0') })", cat: 'crd',
    pt: 'Busca o primeiro documento que casa — com `_id` construído como ObjectId (objeto, não string). Retorna o doc ou `null`.',
    en: 'Finds the first matching document — with an `_id` built as an ObjectId (object, not string). Returns the doc or `null`.' },
  { code: 'db.users.find({ age: { $gte: 18, $lt: 30 } })', cat: 'crd',
    pt: 'Query com faixa de valores: `$gte`/`$lt` combinados num único campo — o equivalente ao `BETWEEN` dos bancos SQL.',
    en: 'Range query: `$gte`/`$lt` combined on a single field — the equivalent of `BETWEEN` in SQL databases.' },
  { code: "db.users.updateOne({ _id: ObjectId('...') }, { $set: { age: 31 } })", cat: 'crd',
    pt: 'Atualiza o PRIMEIRO documento que casa usando operadores (`$set`). O segundo parâmetro com operadores NÃO substitui o documento inteiro.',
    en: 'Updates the FIRST matching document using operators (`$set`). A second argument with operators does NOT replace the whole document.' },
  { code: 'db.users.updateMany({ status: "inactive" }, { $set: { active: false } })', cat: 'crd',
    pt: 'Atualiza TODOS os documentos que casam. Sem o `multi` do driver antigo: `updateMany` é explícito. Retorna `matchedCount`/`modifiedCount`.',
    en: 'Updates ALL matching documents. No magic `multi` like old drivers: `updateMany` is explicit. Returns `matchedCount`/`modifiedCount`.' },
  { code: "db.users.replaceOne({ _id: ObjectId('...') }, { name: 'Ana', age: 31 })", cat: 'crd',
    pt: 'SUBSTITUI o documento inteiro (sem operadores `$`): os campos que sumirem do objeto serão removidos do documento. Use com cuidado.',
    en: 'REPLACES the whole document (no `$` operators): any field missing from the object is removed from the document. Use with care.' },
  { code: "db.users.deleteOne({ _id: ObjectId('...') })", cat: 'crd',
    pt: 'Apaga UM documento (o primeiro que casar). Errar com `deleteMany` aqui é apagar a coleção inteira de candidatos.',
    en: 'Deletes ONE document (the first match). Getting this wrong with `deleteMany` here is wiping the entire pool.' },
  { code: 'db.users.deleteMany({})', cat: 'crd',
    pt: 'Apaga TODOS os documentos da coleção (mas mantém a coleção e os índices). O `{}` vazio é o "drop tudo".',
    en: 'Deletes ALL documents in the collection (but keeps the collection and its indexes). The empty `{}` is the "drop everything".' },
  { code: 'db.users.countDocuments({ active: true })', cat: 'crd',
    pt: 'Contagem PRECISA respeitando o filtro (varre matching). `estimatedDocumentCount()` é o instantâneo do metadata — rápido, mas sem filtro.',
    en: 'ACCURATE count honoring the filter (scans matches). `estimatedDocumentCount()` is the fast metadata snapshot — but without a filter.' },

  // ─── Consultas & operadores de query ────────────────────────────────
  { code: 'db.users.find({ $or: [{ age: { $lt: 12 } }, { role: "admin" }] })', cat: 'query',
    pt: '`$or` une condições em campos DIFERENTES. Pro mesmo campo, prefera `$in` — o servidor otimiza melhor.',
    en: '`$or` joins conditions on DIFFERENT fields. For the same field, prefer `$in` — the server optimizes it better.' },
  { code: 'db.users.find({ name: { $in: ["Ana", "Bia", "Caio"] } })', cat: 'query',
    pt: '`$in` casa o campo com QUALQUER valor da lista — o "is one of" do MongoDB. `$nin` é a negação.',
    en: '`$in` matches the field against ANY value in the list — Mongo\'s "is one of". `$nin` is the negation.' },
  { code: "db.users.find({ 'address.city': 'SP', 'address.zip': /^01/ })", cat: 'query',
    pt: 'Notação com ponto acessa campos EMBUTIDOS (`address.city`). Sempre aspas por causa do `.` — objeto aninhado, não subdocumento plano.',
    en: 'Dot notation reaches EMBEDDED fields (`address.city`). Always quote because of the `.` — nested object, not a flat subdocument.' },
  { code: 'db.users.find({ tags: "node" })', cat: 'query',
    pt: 'Array contém o valor: casa se QUALQUER elemento do array for igual. O básico do matching de tags/id de referência.',
    en: 'Array contains the value: matches if ANY element of the array is equal. The basics of tag/reference-id matching.' },
  { code: 'db.users.find({ tags: { $all: ["node", "react"] } })', cat: 'query',
    pt: '`$all` exige que o array contenha TODOS os valores listados — o "e" de arrays, ao contrário do `$in` (qualquer).',
    en: '`$all` requires the array to contain EVERY listed value — the "and" of arrays, unlike `$in` (any).' },
  { code: 'db.users.find({ tags: { $size: 3 } })', cat: 'query',
    pt: '`$size` casa arrays com exatamente N elementos. Cuidado: não combina com `$gt` no mesmo campo — meça com `$expr` se precisar.',
    en: '`$size` matches arrays with exactly N elements. Caveat: it doesn\'t combine with `$gt` on the same field — use `$expr` if you need ranges.' },
  { code: "db.users.find({ items: { $elemMatch: { sku: 'x', qty: { $gt: 2 } } } })", cat: 'query',
    pt: '`$elemMatch` exige que o MESMO elemento do array satisfaça TODAS as condições — sem ele, as condições podem casar em elementos diferentes.',
    en: '`$elemMatch` requires the SAME array element to satisfy ALL conditions — without it, conditions can match different elements.' },
  { code: "db.users.find({ name: { $regex: /^ana/i } })", cat: 'query',
    pt: 'Regex por prefixo ÂNCORADO (`^`) e case-insensitive (`i`) consegue usar índice. `$regex` solto no meio da string faz COLLSCAN.',
    en: 'An ANCHORED prefix regex (`^`) with the case-insensitive `i` flag can use an index. An unanchored `$regex` in the middle does a COLLSCAN.' },
  { code: 'db.users.find({ deletedAt: { $exists: false } })', cat: 'query',
    pt: '`$exists: false` acha documentos onde o campo NÃO existe — o padrão soft-delete "não marcado pra apagar".',
    en: '`$exists: false` finds documents where the field does NOT exist — the soft-delete "not flagged" pattern.' },
  { code: 'db.users.find({}, { name: 1, age: 1, _id: 0 })', cat: 'query',
    pt: 'Projeção: `1` inclui, `0` exclui. Regra: você não pode misturar `1` e `0` (exceto o `_id`) — só "quero 3 campos" ou "quero tudo menos este".',
    en: 'Projection: `1` includes, `0` excludes. Rule: you can\'t mix `1` and `0` (except `_id`) — either "want 3 fields" or "everything but this one".' },
  { code: 'db.users.find({}).sort({ age: -1 }).limit(10).skip(20)', cat: 'query',
    pt: 'Paginação clássica: `sort` antes de `limit`/`skip` no encadeamento. A ordem NAO importa no objeto encadeado, mas índices adoram sort+limit.',
    en: 'Classic pagination: chain `sort` then `limit`/`skip`. The order of chaining doesn\'t matter, but indexes love sort+limit.' },
  { code: 'db.users.distinct("role")', cat: 'query',
    pt: 'Lista os valores ÚNICOS de um campo na coleção — o equivalente ao `SELECT DISTINCT role`. Retorna um array simples.',
    en: 'Lists the UNIQUE values of a field across the collection — the equivalent of `SELECT DISTINCT role`. Returns a plain array.' },
  { code: 'db.users.find({ age: { $gt: 18 }, $and: [ { city: "SP" }, { active: true } ] })', cat: 'query',
    pt: 'Combinação explícita com `$and` quando o mesmo campo aparece em múltiplas condições — evita o erro de chave duplicada no objeto.',
    en: 'Explicit `$and` when the same field appears in multiple conditions — avoids the duplicate-key error in an object literal.' },

  // ─── Operadores de update ───────────────────────────────────────────
  { code: 'db.users.updateOne({ _id }, { $unset: { oldField: "" } })', cat: 'upd',
    pt: '`$unset` REMOVE o campo do documento. O valor (`""`) é ignorado — o que importa é a chave.',
    en: '`$unset` REMOVES the field from the document. The value (`""`) is ignored — the key is what matters.' },
  { code: 'db.users.updateOne({ _id }, { $inc: { points: 100, attempts: -1 } })', cat: 'upd',
    pt: '`$inc` incrementa/decrementa ATÔMICAMENTE — a operação clássica de contador que não depende de ler antes pra escrever depois.',
    en: '`$inc` increments/decrements ATOMICALLY — the classic counter op that doesn\'t rely on read-then-write.' },
  { code: 'db.users.updateOne({ _id }, { $push: { logs: "2026-08-18 login" } })', cat: 'upd',
    pt: '`$push` adiciona um elemento ao FINAL do array — cria o array se não existir. O par de `$pull`, que remove.',
    en: '`$push` appends an element to the END of the array — creating the array if it doesn\'t exist. The counterpart to `$pull`, which removes.' },
  { code: 'db.users.updateOne({ _id }, { $push: { logs: { $each: ["a", "b"], $slice: -10 } } })', cat: 'upd',
    pt: 'Push de vários com `$each` + `$slice` limitando o array aos últimos 10 — o pattern de "log rotativo" banido de arrays infinitos.',
    en: 'Multi-push with `$each` + `$slice` capping the array to the last 10 — the rotating-log pattern that bans unbounded arrays.' },
  { code: 'db.users.updateOne({ _id }, { $addToSet: { tags: "dev" } })', cat: 'upd',
    pt: '`$addToSet` adiciona o valor SÓ se ele ainda não estiver no array — o push seguro contra duplicatas.',
    en: '`$addToSet` adds the value ONLY if it is not already in the array — the duplicate-safe push.' },
  { code: 'db.users.updateOne({ _id }, { $pull: { tags: "legacy" } })', cat: 'upd',
    pt: '`$pull` remove TODAS as ocorrências do valor do array — diferente do `$pop` (primeiro/último) e do `$pullAll` (lista).',
    en: '`$pull` removes ALL occurrences of the value from the array — unlike `$pop` (first/last) and `$pullAll` (a list).' },
  { code: 'db.users.updateOne({ _id }, { $pop: { logs: 1 } })', cat: 'upd',
    pt: '`$pop` remove 1 elemento: `1` do final, `-1` do começo. Útil pra filas pequenas e triagem FIFO/LIFO.',
    en: '`$pop` removes 1 element: `1` from the end, `-1` from the start. Useful for small queues and FIFO/LIFO processing.' },
  { code: 'db.users.updateOne({ email: "a@x.com" }, { $set: { city: "SP" } }, { upsert: true })', cat: 'upd',
    pt: '`upsert: true` INSERE o documento se nada casar — e `$setOnInsert` permite semear campos só na criação. O "get or create" do MongoDB.',
    en: '`upsert: true` INSERTS the document if nothing matches — and `$setOnInsert` lets you seed fields only on creation. Mongo\'s "get or create".' },
  { code: 'db.users.updateOne({ _id }, { $mul: { score: 2 }, $rename: { city: "cidade" } })', cat: 'upd',
    pt: '`$mul` multiplica o campo por um fator; `$rename` renomeia a chave. Multi-operator num único update é permitido e mais eficiente.',
    en: '`$mul` multiplies the field by a factor; `$rename` renames the key. Multi-operator on a single update is allowed and more efficient.' },

  // ─── Aggregation pipeline ───────────────────────────────────────────
  { code: 'db.orders.aggregate([\n  { $match: { status: "paid" } },\n  { $group: { _id: "$customerId", total: { $sum: "$amount" } } }\n])', cat: 'agg',
    pt: 'Pipeline por etapas: `$match` filtra logo (usa índices), `$group` agrupa e acumula com `$sum`. `$`prefixo do campo no expression.',
    en: 'Pipeline by stages: `$match` filters early (uses indexes), `$group` groups and accumulates with `$sum`. The `$`prefix references a field in expressions.' },
  { code: 'db.orders.aggregate([\n  { $match: { status: "paid" } },\n  { $group: { _id: null, total: { $sum: "$amount" }, avg: { $avg: "$amount" }, min: { $min: "$amount" }, max: { $max: "$amount" } } }\n])', cat: 'agg',
    pt: 'Totais globais com `_id: null`: soma, média, mínimo e máximo da coleção inteira num único estágio.',
    en: 'Global totals with `_id: null`: sum, average, min and max over the whole collection in a single stage.' },
  { code: 'db.users.aggregate([\n  { $project: { name: 1, city: "$address.city", upper: { $toUpper: "$name" } } }\n])', cat: 'agg',
    pt: '`$project` seleciona/renomeia/cria campos — inclusive puxando o valor embutido pra o topo e computando com operadores de expressão.',
    en: '`$project` selects/renames/creates fields — including pulling an embedded value to the top and computing with expression operators.' },
  { code: 'db.sales.aggregate([\n  { $match: { year: 2026 } },\n  { $sort: { total: -1 } },\n  { $limit: 5 }\n])', cat: 'agg',
    pt: 'Top N: `$match` → `$sort` → `$limit` — a ordem importa MUITO para performance e para o resultado.',
    en: 'Top N: `$match` → `$sort` → `$limit` — the order matters a LOT for performance and for the result.' },
  { code: 'db.users.aggregate([\n  { $unwind: "$tags" },\n  { $group: { _id: "$tags", count: { $sum: 1 } } }\n])', cat: 'agg',
    pt: '`$unwind` "desdobra" cada elemento do array em um documento próprio — o passo pras agregações por item interno (tags, itens de pedido...).',
    en: '`$unwind` "flattens" each array element into its own document — the step for per-inner-item aggregations (tags, order items...).' },
  { code: 'db.orders.aggregate([\n  { $lookup: {\n    from: "customers",\n    localField: "customerId",\n    foreignField: "_id",\n    as: "customer"\n  } }\n])', cat: 'agg',
    pt: '`$lookup` é o LEFT JOIN do SQL: junta cada pedido com o cliente. O resultado vira um array `customer` (com 0 ou 1 elemento, aqui).',
    en: '`$lookup` is the SQL LEFT JOIN: joins each order with its customer. The result becomes a `customer` array (with 0 or 1 element here).' },
  { code: 'db.orders.aggregate([\n  { $addFields: { totalWithTax: { $multiply: ["$total", 1.1] } } }\n])', cat: 'agg',
    pt: '`$addFields` ADICIONA campos calculados sem esconder os originais — o `$project` sem o risco de derrubar dados.',
    en: '`$addFields` ADDS computed fields without hiding the originals — `$project` without the risk of dropping data.' },
  { code: 'db.orders.aggregate([\n  { $match: { status: "paid" } },\n  { $count: "paidOrders" }\n])', cat: 'agg',
    pt: '`$count` conta os documentos que passaram até aquele ponto do pipeline — o `countDocuments` respeitando as etapas anteriores.',
    en: '`$count` counts the documents that reached that point in the pipeline — `countDocuments` honoring the previous stages.' },
  { code: "db.users.aggregate([ { $sortByCount: '$role' } ])", cat: 'agg',
    pt: 'Atalho de `$group` + `$sort` decrecente: agrupa por campo e já devolve ordenado pela contagem — o "top de papéis" em uma linha.',
    en: 'Shortcut for `$group` + `$sort` descending: groups by field and returns sorted by count — the "top roles" in one line.' },
  { code: 'db.orders.aggregate([\n  { $facet: {\n    byStatus: [{ $group: { _id: "$status", n: { $sum: 1 } } }],\n    topCustomers: [{ $sort: { total: -1 } }, { $limit: 3 }]\n  } }\n])', cat: 'agg',
    pt: '`$facet` roda MÚLTIPLAS pipelines em paralelo no mesmo conjunto — um único round trip pra vários recortes do resultado.',
    en: '`$facet` runs MULTIPLE pipelines in parallel on the same set — a single round trip for several cuts of the result.' },

  // ─── Índices & performance ──────────────────────────────────────────
  { code: 'db.users.createIndex({ email: 1 }, { unique: true })', cat: 'idx',
    pt: 'Índice ÚNICO em `email`: o servidor rejeita duplicatas (com erro `E11000`!). É a constraint de unicidade do Mongo.',
    en: 'UNIQUE index on `email`: the server rejects duplicates (with `E11000`!). It\'s Mongo\'s uniqueness constraint.' },
  { code: 'db.users.createIndex({ status: 1, createdAt: -1 })', cat: 'idx',
    pt: 'Índice COMPOSTO: `status` asc + `createdAt` desc. Cobre queries `status: X` e também `status: X ORDER BY createdAt`.',
    en: 'COMPOUND index: `status` asc + `createdAt` desc. Covers `status: X` queries AND `status: X ORDER BY createdAt`.' },
  { code: 'db.sessions.createIndex({ expireAt: 1 }, { expireAfterSeconds: 0 })', cat: 'idx',
    pt: 'TTL index apaga automaticamente docs quando `expireAt` passa. O worker roda a cada ~60s — expiração NÃO é em tempo real.',
    en: 'TTL index auto-deletes docs once `expireAt` passes. The worker runs every ~60s — expiration is NOT real-time.' },
  { code: 'db.users.createIndex({ email: 1 }, { partialFilterExpression: { active: true } })', cat: 'idx',
    pt: 'Índice PARCIAL: só indexa os docs que casam o filtro — menor, mais rápido de manter, ideal pra campos esparsos.',
    en: 'PARTIAL index: only indexes docs matching the filter — smaller, cheaper to maintain, ideal for sparse fields.' },
  { code: 'db.articles.createIndex({ title: "text", body: "text" })\ndb.articles.find({ $text: { $search: "mongodb indexing" } })', cat: 'idx',
    pt: 'Índice TEXT habilita busca full-text com `$text: $search` e ranking por relevância. Só pode haver UM índice text por coleção.',
    en: 'TEXT index enables full-text search with `$text: $search` and relevance ranking. Only ONE text index is allowed per collection.' },
  { code: 'db.users.getIndexes()\ndb.users.dropIndex("email_1")', cat: 'idx',
    pt: '`getIndexes()` lista os índices (nome e spec). `dropIndex()` remove pelo nome — que é `campo_direção` por padrão.',
    en: '`getIndexes()` lists the indexes (name and spec). `dropIndex()` removes by name — which defaults to `field_direction`.' },
  { code: 'db.users.find({ email: "a@x.com" }).explain("executionStats")', cat: 'idx',
    pt: '`explain` mostra se usou COLLSCAN ou IXSCAN, quantos docs leu e quanto tempo levou — o primeiro passo de todo debug de query lenta.',
    en: '`explain` shows whether it used COLLSCAN or IXSCAN, how many docs it read and how long it took — the first step of any slow-query debug.' },
  { code: "db.users.find({ role: 'admin' }).hint({ role: 1 })", cat: 'idx',
    pt: '`hint()` FORÇA um índice específico — o "se eu sei que o planner está escolhendo errado" do dia a dia.',
    en: '`hint()` FORCES a specific index — the "I know the planner is choosing wrong" day-to-day escape hatch.' },

  // ─── Tipos, _id & datas ─────────────────────────────────────────────
  { code: "ObjectId('65f0a1b2c3d4e5f6a7b8c9d0').getTimestamp()", cat: 'data',
    pt: 'ObjectId carrega um carimbo de tempo embutido: o `.getTimestamp()` extrai a data de criação sem precisar de um campo separado.',
    en: 'An ObjectId carries an embedded timestamp: `.getTimestamp()` extracts the creation time without needing a separate field.' },
  { code: 'new Date()\ndb.logs.insertOne({ at: ISODate("2026-08-18T10:00:00Z") })', cat: 'data',
    pt: 'Datas são `Date` nativos, sempre em UTC internamente. `ISODate()` no shell cria o mesmo objeto de forma legível.',
    en: 'Dates are native `Date` objects, always UTC internally. `ISODate()` in the shell builds the same object readably.' },
  { code: 'db.values.insertOne({ big: NumberLong("9007199254740993"), dec: NumberDecimal("0.1") })', cat: 'data',
    pt: '`NumberLong` para inteiros > 2^53 (sempre como STRING no driver) e `NumberDecimal` para dinheiro — float64 simplesmente não dá.',
    en: '`NumberLong` for integers > 2^53 (always as a STRING in the driver) and `NumberDecimal` for money — plain float64 doesn\'t cut it.' },
  { code: "db.users.find({ _id: ObjectId('...') })\ndb.users.find({ created: ISODate('2026-08-01') })", cat: 'data',
    pt: 'Casamento por tipo importa: `ObjectId(...)` e `ISODate(...)` buscam por objetos, não strings — comparar tipos diferentes não casa.',
    en: 'Type matching matters: `ObjectId(...)` and `ISODate(...)` search by real objects, not strings — comparing different types never matches.' },
  { code: 'db.users.find({}).toArray()\ndb.users.find({}).forEach(u => print(u.name))', cat: 'data',
    pt: 'Cursor → container de dados: `.toArray()` materializa tudo em memória; `.forEach()` itera sem estourar a RAM.',
    en: 'Cursor → data container: `.toArray()` materializes everything in memory; `.forEach()` iterates without blowing up RAM.' },
  { code: 'db.items.insertOne({ _id: "sku-123", qty: 5 })', cat: 'data',
    pt: 'Você pode usar `_id` CUSTOM (string, número...) quando o valor de negócio já é único — evita o ObjectId "aleatório".',
    en: 'You can use a CUSTOM `_id` (string, number...) when the business value is already unique — avoids the "random" ObjectId.' },

  // ─── Backup, scripting & tools ──────────────────────────────────────
  { code: 'mongodump --uri "mongodb://localhost:27017" --db mydb --out ./backup', cat: 'tools',
    pt: 'Backup BSON binário da base (metadados + dados, restauráveis literalmente). O snapshot físico, não um dump de texto.',
    en: 'Binary BSON backup of the database (metadata + data, restorable literally). The physical snapshot, not a text dump.' },
  { code: 'mongorestore --uri "mongodb://localhost:27017" --drop ./backup/mydb', cat: 'tools',
    pt: 'Restaura o BSON de volta. `--drop` apaga a coleção antes de importar — evita duplicação com o que já existe.',
    en: 'Restores the BSON back. `--drop` drops the collection before importing — avoids duplication with what already exists.' },
  { code: 'mongoexport --db mydb --collection users --type json --out users.json', cat: 'tools',
    pt: 'Exporta em JSON (ou CSV) legível pra análise/import em outra ferramenta — o oposto do binário do `mongodump`.',
    en: 'Exports to readable JSON (or CSV) for analysis/import into other tools — the opposite of `mongodump`\'s binary.' },
  { code: 'mongoimport --db mydb --collection users --file users.json --jsonArray', cat: 'tools',
    pt: 'Importa um arquivo JSON. `--jsonArray` indica que o arquivo é UM array de docs; sem ele, espera-se um doc por linha.',
    en: 'Imports a JSON file. `--jsonArray` tells it the file is ONE array of docs; without it, it expects one doc per line.' },
  { code: 'mongosh mydb --eval "db.runCommand({ serverStatus: 1 })"', cat: 'tools',
    pt: '`serverStatus` é o painel do servidor: conexões, memória, opcounters e uptime num JSON só — o `df/core` do Mongo.',
    en: '`serverStatus` is the server dashboard: connections, memory, opcounters and uptime in one JSON — Mongo\'s `df/core`.' },
  { code: 'const session = db.getMongo().startSession()\nsession.withTransaction(() => {\n  db.accounts.updateOne({ _id: 1 }, { $inc: { balance: -10 } })\n  db.accounts.updateOne({ _id: 2 }, { $inc: { balance: +10 } })\n})', cat: 'tools',
    pt: 'Transação: as operações só confirmam juntas (ou tudo volta). Com ACID se todas as coleções forem replicadas no cluster.',
    en: 'Transaction: the ops only commit together (or all roll back). ACID as long as all involved collections are replicated on the cluster.' },
  { code: 'db.users.bulkWrite([\n  { updateOne: { filter: { _id: 1 }, update: { $set: { v: 1 } } } },\n  { deleteOne: { filter: { _id: 2 } } },\n  { insertOne: { document: { _id: 3 } } }\n])', cat: 'tools',
    pt: '`bulkWrite` empacota várias operações de tipos diferentes num round trip — a forma de reduzir latência em massa.',
    en: '`bulkWrite` packs several operations of different types into one round trip — the way to cut latency in mass jobs.' },
  { code: 'const cs = db.users.watch()\ncs.next()', cat: 'tools',
    pt: 'Change Streams: observa mudanças na coleção em tempo real (insert/update/delete). O motor atrás de "sync/notificação" com Mongo.',
    en: 'Change Streams: watches the collection for changes in real time (insert/update/delete). The engine behind Mongo-driven "sync/notify".' },
]

const translations = {
  pt: {
    title: 'Cheat Sheet de MongoDB',
    intro: (
      <>
        O <Text code>MongoDB</Text> — banco de documentos NoSQL que todo dev
        de backend acaba encarando. Do <Text code>mongosh</Text> ao{' '}
        <Text code>aggregation pipeline</Text>, passando por índices, TTL e
        transações: nada de decorar sintaxe na hora do incidente.
      </>
    ),
    search: 'Buscar por comando ou descrição...',
    all: 'Todas',
    empty: 'Nenhuma entrada encontrada. Tente outra busca ou categoria.',
    tipTitle: 'O que mais pega no MongoDB',
    tipBody: (
      <>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong><Text code>find()</Text> devolve cursor, não array.</Text>{' '}
          Encadeie <Text code>.sort()</Text>/<Text code>.limit()</Text> no
          próprio cursor e use <Text code>.toArray()</Text> ou{' '}
          <Text code>.forEach()</Text> quando quiser consumir — depois da
          iteração o cursor morre.
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>Update sem operador <Text code>$</Text> substitui.</Text>{' '}
          <Text code>updateOne({'{'} _id {'}'}, {'{'} name: 'X' {'}'})</Text>{' '}
          substitui o documento inteiro. Se você só quer trocar um campo,
          é <Text code>{'{'} $set {'}'}</Text>. Regex não âncora e{' '}
          <Text code>$regex</Text> no meio da string derrubam o uso de índice
          (COLLSCAN).
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>Projeção não mistura <Text code>1</Text> e{' '}
            <Text code>0</Text>.</Text> Ou você lista os campos que quer
          incluir, ou os que quer excluir (a exceção é o{' '}
          <Text code>_id</Text>). Tentar misturar dá erro de validação.
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>TTL não é em tempo real.</Text> O worker de expiração
          roda a cada ~60s; o documento some depois disso, não no segundo
          exato. E a operação do TTL conta no <Text code>opcounters</Text>{' '}
          do servidor.
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>Tipos têm que casar.</Text>{' '}
          <Text code>ObjectId(...)</Text> e <Text code>ISODate(...)</Text>{' '}
          buscam por objetos. Comparar com a string crua não casa — e o
          <Text code>_id</Text> como string comprando com ObjectId é o erro
          #1 de "não acho meu registro".
        </Paragraph>
        <Paragraph style={{ marginBottom: 0 }}>
          <Text strong>Índice SÓ ajuda se for usado.</Text> Query por{' '}
          <Text code>email</Text> precisa de índice em{' '}
          <Text code>email</Text>; agregação precisa do{' '}
          <Text code>$match</Text> logo e depois do índice. Confirme sempre
          com <Text code>.explain()</Text> antes de apostar que está rápido.
        </Paragraph>
      </>
    ),
    resultsOne: 'entrada encontrada',
    resultsMany: 'entradas encontradas',
    copy: 'Copiar como Markdown',
    copyCode: 'Copiar comando',
    copiedCode: 'Comando copiado',
    copiedList: 'Lista Markdown copiada',
    copyError: 'Não foi possível copiar',
  },
  en: {
    title: 'MongoDB Cheat Sheet',
    intro: (
      <>
        <Text code>MongoDB</Text> — the NoSQL document database every backend
        dev ends up facing. From <Text code>mongosh</Text> to the{' '}
        <Text code>aggregation pipeline</Text>, plus indexes, TTL and
        transactions: no more memorizing syntax mid-incident.
      </>
    ),
    search: 'Search by command or description...',
    all: 'All',
    empty: 'No entry found. Try a different search or category.',
    tipTitle: 'What trips people up the most',
    tipBody: (
      <>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong><Text code>find()</Text> returns a cursor, not an
            array.</Text> Chain <Text code>.sort()</Text>/
          <Text code>.limit()</Text> on the cursor itself and use{' '}
          <Text code>.toArray()</Text> or <Text code>.forEach()</Text> to
          consume it — after iteration the cursor is exhausted.
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>Update without a <Text code>$</Text> operator
            replaces.</Text>{' '}
          <Text code>updateOne({'{'} _id {'}'}, {'{'} name: 'X' {'}'})</Text>{' '}
          replaces the entire document. To change just one field, use{' '}
          <Text code>{'{'} $set {'}'}</Text>. Unanchored{' '}
          <Text code>$regex</Text> that search mid-string kill index usage
          (COLLSCAN).
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>Projections don&apos;t mix <Text code>1</Text> and{' '}
            <Text code>0</Text>.</Text> Either list the fields you want to
          include or the ones you want to exclude (the exception is{' '}
          <Text code>_id</Text>). Mixing them is a validation error.
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>TTL is not real-time.</Text> The expiry worker runs
          every ~60s; the document disappears after that, not at the exact
          second. And TTL deletions count in the server&apos;s{' '}
          <Text code>opcounters</Text>.
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>Types must match.</Text>{' '}
          <Text code>ObjectId(...)</Text> and <Text code>ISODate(...)</Text>{' '}
          query by real objects. Comparing with the raw string never matches —
          and casing a string <Text code>_id</Text> against an ObjectId is
          mistake #1 for "I can&apos;t find my record".
        </Paragraph>
        <Paragraph style={{ marginBottom: 0 }}>
          <Text strong>An index only helps if it is used.</Text> Querying by{' '}
          <Text code>email</Text> needs an index on{' '}
          <Text code>email</Text>; aggregations want an early{' '}
          <Text code>$match</Text> backed by an index. Always confirm with{' '}
          <Text code>.explain()</Text> before betting a query is fast.
        </Paragraph>
      </>
    ),
    resultsOne: 'entry found',
    resultsMany: 'entries found',
    copy: 'Copy as Markdown',
    copyCode: 'Copy command',
    copiedCode: 'Command copied',
    copiedList: 'Markdown list copied',
    copyError: 'Could not copy',
  },
}

export default function MongoDbCheatsheetPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [messageApi, messageContextHolder] = message.useMessage()

  const normalized = useCallback((s) => String(s).trim().toLowerCase(), [])

  const catCounts = useMemo(() => {
    const counts = { all: ITEMS.length }
    for (const cat of CATEGORIES) {
      counts[cat] = ITEMS.filter((it) => it.cat === cat).length
    }
    return counts
  }, [])

  const filtered = useMemo(() => {
    const q = normalized(query)
    return ITEMS.filter((it) => {
      if (category !== 'all' && it.cat !== category) return false
      if (!q) return true
      return (
        it.code.toLowerCase().includes(q) ||
        (it[lang] || '').toLowerCase().includes(q)
      )
    })
  }, [query, category, lang, normalized])

  const mdList = useMemo(() => {
    const header = '# MongoDB (cheat sheet)\n\n'
    const body = filtered
      .map((it) =>
        [
          `### ${labelOf[it.cat][lang]}`,
          '',
          '```',
          it.code,
          '```',
          '',
          it[lang],
        ].join('\n')
      )
      .join('\n\n---\n\n')
    return header + body
  }, [filtered, lang])

  const copyCode = useCallback(
    async (code) => {
      try {
        await navigator.clipboard.writeText(code)
        messageApi.success(t.copiedCode)
      } catch {
        messageApi.error(t.copyError)
      }
    },
    [messageApi, t]
  )

  const copyMarkdown = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(mdList)
      messageApi.success(t.copiedList)
    } catch {
      messageApi.error(t.copyError)
    }
  }, [mdList, messageApi, t])

  const resultLabel = filtered.length === 1 ? t.resultsOne : t.resultsMany

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {messageContextHolder}
      <Title level={2}><DatabaseOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Alert
        type="warning"
        showIcon
        icon={<CodeOutlined />}
        message={t.tipTitle}
        description={t.tipBody}
      />

      <Space direction="vertical" style={{ width: '100%' }}>
        <Input
          prefix={<SearchOutlined />}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.search}
          allowClear
        />
        <Radio.Group value={category} onChange={(e) => setCategory(e.target.value)} optionType="button">
          <Radio.Button value="all">{t.all} ({catCounts.all})</Radio.Button>
          {CATEGORIES.map((cat) => (
            <Radio.Button key={cat} value={cat}>
              {labelOf[cat][lang]} ({catCounts[cat]})
            </Radio.Button>
          ))}
        </Radio.Group>
      </Space>

      <Space style={{ width: '100%', justifyContent: 'space-between', flexWrap: 'wrap', rowGap: 8 }}>
        <Text type="secondary">
          {filtered.length} {resultLabel}
        </Text>
        {filtered.length > 0 && (
          <Button size="small" icon={<CopyOutlined />} onClick={copyMarkdown}>
            {t.copy}
          </Button>
        )}
      </Space>

      <Card>
        <List
          dataSource={filtered}
          locale={{ emptyText: t.empty }}
          renderItem={(item) => (
            <List.Item key={`${item.cat}-${item.code}`}>
              <Space direction="vertical" size={6} style={{ width: '100%' }}>
                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                  <Tag color={CATEGORY_COLOR[item.cat]}>{labelOf[item.cat][lang]}</Tag>
                  <Button
                    size="small"
                    type="text"
                    icon={<CopyOutlined />}
                    title={t.copyCode}
                    onClick={() => copyCode(item.code)}
                  />
                </Space>
                <pre
                  style={{
                    margin: 0,
                    padding: '8px 12px',
                    background: '#f5f5f5',
                    borderRadius: 6,
                    fontSize: 12.5,
                    lineHeight: 1.65,
                    overflowX: 'auto',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    color: '#262626',
                  }}
                >
                  {item.code}
                </pre>
                <Text type="secondary">{item[lang]}</Text>
              </Space>
            </List.Item>
          )}
        />
      </Card>
    </Space>
  )
}