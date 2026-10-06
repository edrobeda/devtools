// Motor do Visualizador de Diagrama ER
// Parser de DDL SQL (CREATE TABLE / ALTER TABLE ... ADD CONSTRAINT) ->
// modelo de tabelas + relacionamentos, layout em camadas (PK no topo,
// cylic seguro) e geometria das arestas pro SVG. 100% client-side.

export const HEADER_H = 30
export const ROW_H = 21
const PAD = 30
const H_GAP = 96
const V_GAP = 70
const MIN_TABLE_W = 210
const MAX_TYPE_CHARS = 26
const CHAR_W = 7.2
const HEADER_CHAR_W = 8.4
const BADGE_AREA = 62
const BADGE_PK_W = 26
const BADGE_FK_W = 26
const BADGE_GAP = 4
export const BADGE_X = 8
export const NAME_X = 66

function maskStrings(s) {
  let out = ''
  let quote = null
  for (let i = 0; i < s.length; i++) {
    const c = s[i]
    if (quote) {
      out += ' '
      if (c === quote) {
        if (s[i + 1] === quote) {
          out += ' '
          i += 1
        } else {
          quote = null
        }
      }
      continue
    }
    if (c === "'" || c === '"' || c === '`') {
      quote = c
      out += ' '
      continue
    }
    out += c
  }
  return out
}

function stripComments(sql) {
  let out = ''
  let i = 0
  const n = sql.length
  let quote = null
  while (i < n) {
    const c = sql[i]
    if (quote) {
      out += c
      if (c === quote) {
        if (sql[i + 1] === quote) {
          out += sql[i + 1]
          i += 2
          continue
        }
        quote = null
      }
      i += 1
      continue
    }
    if (c === "'" || c === '"' || c === '`') {
      quote = c
      out += c
      i += 1
      continue
    }
    if (c === '[') {
      const end = sql.indexOf(']', i)
      if (end === -1) {
        out += c
        i += 1
        continue
      }
      out += sql.slice(i, end + 1)
      i = end + 1
      continue
    }
    if (c === '-' && sql[i + 1] === '-') {
      while (i < n && sql[i] !== '\n') i += 1
      continue
    }
    if (c === '#') {
      while (i < n && sql[i] !== '\n') i += 1
      continue
    }
    if (c === '/' && sql[i + 1] === '*') {
      const end = sql.indexOf('*/', i + 2)
      i = end === -1 ? n : end + 2
      out += ' '
      continue
    }
    out += c
    i += 1
  }
  return out
}

function splitTopLevel(text, sep) {
  const parts = []
  let depth = 0
  let quote = null
  let start = 0
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (quote) {
      if (c === quote) {
        if (text[i + 1] === quote) i += 1
        else quote = null
      }
      continue
    }
    if (c === "'" || c === '"' || c === '`') {
      quote = c
      continue
    }
    if (c === '[') {
      const end = text.indexOf(']', i)
      if (end !== -1) i = end
      continue
    }
    if (c === '(') depth += 1
    else if (c === ')') depth -= 1
    else if (c === sep && depth === 0) {
      parts.push(text.slice(start, i))
      start = i + 1
    }
  }
  parts.push(text.slice(start))
  return parts
}

const IDENT_START = /[A-Za-z0-9_$\u0080-\uffff]/

function skipWs(text, i) {
  while (i < text.length && /\s/.test(text[i])) i += 1
  return i
}

function readOneIdent(text, start) {
  let i = skipWs(text, start)
  let name = ''
  if (text[i] === '"' || text[i] === '`') {
    const q = text[i]
    i += 1
    while (i < text.length) {
      if (text[i] === q) {
        if (text[i + 1] === q) {
          name += q
          i += 2
        } else {
          i += 1
          break
        }
      } else {
        name += text[i]
        i += 1
      }
    }
  } else if (text[i] === '[') {
    const end = text.indexOf(']', i)
    if (end === -1) return null
    name = text.slice(i + 1, end)
    i = end + 1
  } else {
    const begin = i
    while (i < text.length && IDENT_START.test(text[i])) i += 1
    if (i === begin) return null
    name = text.slice(begin, i)
  }
  return { name, next: i }
}

function readIdentifier(text, start) {
  let cur = readOneIdent(text, start)
  if (!cur) return null
  let name = cur.name
  let i = cur.next
  for (;;) {
    let j = skipWs(text, i)
    if (text[j] !== '.') break
    const seg = readOneIdent(text, j + 1)
    if (!seg) break
    name += '.' + seg.name
    i = seg.next
  }
  return { name: name.trim(), next: i }
}

function matchParen(text, openIdx) {
  let depth = 0
  let quote = null
  for (let i = openIdx; i < text.length; i++) {
    const c = text[i]
    if (quote) {
      if (c === quote) {
        if (text[i + 1] === quote) i += 1
        else quote = null
      }
      continue
    }
    if (c === "'" || c === '"' || c === '`') {
      quote = c
      continue
    }
    if (c === '(') depth += 1
    else if (c === ')') {
      depth -= 1
      if (depth === 0) return i
    }
  }
  return -1
}

function parenList(text, openIdx) {
  const close = matchParen(text, openIdx)
  if (close === -1) return null
  return { inner: text.slice(openIdx + 1, close), next: close + 1 }
}

function identList(inner) {
  return splitTopLevel(inner, ',')
    .map((s) => {
      const id = readIdentifier(s, 0)
      return id ? id.name : ''
    })
    .filter(Boolean)
}

const STOP_KEYWORDS = [
  'NOT NULL',
  'CHARACTER SET',
  'AUTO_INCREMENT',
  'AUTOINCREMENT',
  'DEFAULT',
  'PRIMARY',
  'UNIQUE',
  'REFERENCES',
  'CHECK',
  'COLLATE',
  'COMMENT',
  'GENERATED',
  'IDENTITY',
  'CONSTRAINT',
  'NULL',
]

function typeEndIndex(rest) {
  let depth = 0
  let quote = null
  for (let i = 0; i < rest.length; i++) {
    const c = rest[i]
    if (quote) {
      if (c === quote) {
        if (rest[i + 1] === quote) i += 1
        else quote = null
      }
      continue
    }
    if (c === "'" || c === '"' || c === '`') {
      quote = c
      continue
    }
    if (c === '(') {
      depth += 1
      continue
    }
    if (c === ')') {
      depth -= 1
      continue
    }
    if (depth !== 0) continue
    if (i > 0 && !/[\s(]/.test(rest[i - 1])) continue
    const up = rest.slice(i).toUpperCase()
    for (const kw of STOP_KEYWORDS) {
      if (!up.startsWith(kw)) continue
      const after = rest[i + kw.length]
      if (after === undefined || /[\s(]/.test(after)) return i
    }
  }
  return rest.length
}

function parseColumnDef(rest) {
  const end = typeEndIndex(rest)
  const type = rest.slice(0, end).trim().replace(/\s+/g, ' ') || '?'
  const flags = rest.slice(end)
  const masked = maskStrings(flags)
  const pk = /\bPRIMARY\s+KEY\b/i.test(masked)
  const unique = /\bUNIQUE\b/i.test(masked)
  const auto = /\bAUTO_INCREMENT\b|\bAUTOINCREMENT\b|\bGENERATED\b/i.test(masked)
  let ref = null
  const refIdx = masked.search(/REFERENCES/i)
  if (refIdx !== -1) {
    const ident = readIdentifier(flags, refIdx + 'REFERENCES'.length)
    if (ident && ident.name) {
      let refCols = null
      const after = skipWs(flags, ident.next)
      if (flags[after] === '(') {
        const list = parenList(flags, after)
        if (list) refCols = identList(list.inner)
      }
      ref = { table: ident.name, cols: refCols }
    }
  }
  return { type, pk, unique, auto, ref }
}

function stripConstraintPrefix(item) {
  const m = /^CONSTRAINT\s+((?:"[^"]+"|`[^`]+`|\[[^\]]+\]|[A-Za-z0-9_$]+))\s+/i.exec(item)
  if (!m) return { item, name: null }
  return { item: item.slice(m[0].length), name: m[1] }
}

function parseTableItem(rawItem) {
  let item = rawItem.trim()
  if (!item) return null
  const stripped = stripConstraintPrefix(item)
  item = stripped.item
  const constraintName = stripped.name

  if (/^PRIMARY\s+KEY\s*\(/i.test(item)) {
    const open = item.indexOf('(')
    const list = parenList(item, open)
    if (!list) return { kind: 'invalid', raw: rawItem }
    return { kind: 'pk', cols: identList(list.inner), constraintName }
  }

  if (/^FOREIGN\s+KEY\s*\(/i.test(item)) {
    const m = /^FOREIGN\s+KEY\s*\(/i.exec(item)
    const open = m.index + m[0].length - 1
    const list = parenList(item, open)
    if (!list) return { kind: 'invalid', raw: rawItem }
    const cols = identList(list.inner)
    const rest = item.slice(list.next)
    const rm = /^\s*REFERENCES\s+/i.exec(rest)
    if (!rm) return { kind: 'invalid', raw: rawItem }
    const ident = readIdentifier(rest, rm[0].length)
    if (!ident || !ident.name) return { kind: 'invalid', raw: rawItem }
    let refCols = null
    const after = skipWs(rest, ident.next)
    if (rest[after] === '(') {
      const rl = parenList(rest, after)
      if (rl) refCols = identList(rl.inner)
    }
    return { kind: 'fk', cols, refTable: ident.name, refCols, constraintName }
  }

  if (/^(UNIQUE|CHECK|KEY|INDEX|EXCLUDE)\b/i.test(item)) {
    return { kind: 'ignore' }
  }

  item = item.replace(/^COLUMN\s+/i, '')
  const ident = readIdentifier(item, 0)
  if (!ident || !ident.name) return { kind: 'invalid', raw: rawItem }
  const def = parseColumnDef(item.slice(ident.next))
  return { kind: 'column', name: ident.name, def, constraintName }
}

function normalizeKey(name) {
  return name.replace(/\s*\.\s*/g, '.').toLowerCase()
}

function bareKey(key) {
  const idx = key.lastIndexOf('.')
  return idx === -1 ? key : key.slice(idx + 1)
}

export function parseSql(sql) {
  const tables = []
  const rels = []
  const warnings = []
  const idCounts = new Map()

  const text = stripComments(sql)
  const statements = splitTopLevel(text, ';').map((s) => s.trim()).filter(Boolean)

  const findTable = (name) => {
    const key = normalizeKey(name)
    for (const t of tables) if (t.key === key) return t
    const bare = bareKey(key)
    for (const t of tables) if (bareKey(t.key) === bare) return t
    return null
  }

  const addWarning = (code, a, b, c) => warnings.push({ code, a, b, c })

  const applyItem = (table, item) => {
    if (!item || item.kind === 'ignore') return
    if (item.kind === 'invalid') {
      addWarning('badItem', table ? table.name : '?', (item.raw || '').slice(0, 48))
      return
    }
    if (item.kind === 'column' && table) {
      table.columns.push({
        name: item.name,
        type: item.def.type,
        pk: item.def.pk,
        unique: item.def.unique,
        auto: item.def.auto,
        isFk: false,
      })
      if (item.def.pk) {
        if (!table.pkCols.includes(item.name)) table.pkCols.push(item.name)
      }
      if (item.def.ref) {
        table.pendingFks.push({
          cols: [item.name],
          refTable: item.def.ref.table,
          refCols: item.def.ref.cols,
        })
      }
      return
    }
    if (item.kind === 'pk' && table) {
      for (const col of item.cols) {
        if (!table.pkCols.includes(col)) table.pkCols.push(col)
      }
      return
    }
    if (item.kind === 'fk') {
      if (!table) return
      table.pendingFks.push({
        cols: item.cols,
        refTable: item.refTable,
        refCols: item.refCols,
      })
    }
  }

  for (const stmt of statements) {
    if (/^CREATE\s+TABLE\b/i.test(stmt)) {
      const head = /^CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?/i.exec(stmt)
      const nameR = readIdentifier(stmt, head[0].length)
      if (!nameR || !nameR.name) {
        addWarning('badCreate', stmt.slice(0, 48))
        continue
      }
      const open = stmt.indexOf('(', nameR.next)
      if (open === -1) {
        addWarning('badCreate', nameR.name)
        continue
      }
      const close = matchParen(stmt, open)
      if (close === -1) {
        addWarning('badCreate', nameR.name)
        continue
      }
      const display = nameR.name
      const key = normalizeKey(display)
      const count = (idCounts.get(key) || 0) + 1
      idCounts.set(key, count)
      const table = {
        id: count === 1 ? key : `${key}#${count}`,
        name: display,
        key,
        columns: [],
        pkCols: [],
        pendingFks: [],
      }
      tables.push(table)
      if (count > 1) addWarning('dupTable', display)
      for (const part of splitTopLevel(stmt.slice(open + 1, close), ',')) {
        applyItem(table, parseTableItem(part))
      }
      continue
    }
    if (/^ALTER\s+TABLE\b/i.test(stmt)) {
      const head = /^ALTER\s+TABLE\s+/i.exec(stmt)
      const nameR = readIdentifier(stmt, head[0].length)
      if (!nameR || !nameR.name) {
        addWarning('badCreate', stmt.slice(0, 48))
        continue
      }
      const table = findTable(nameR.name)
      if (!table) {
        addWarning('alterTarget', nameR.name)
        continue
      }
      const rest = stmt.slice(nameR.next)
      for (const part of splitTopLevel(rest, ',')) {
        let clause = part.trim()
        const addm = /^ADD\s+/i.exec(clause)
        if (addm) {
          clause = clause.slice(addm[0].length)
        } else if (/^(MODIFY|CHANGE|DROP|RENAME|ALTER|SET|ENABLE|DISABLE|COMMENT)\b/i.test(clause)) {
          continue
        }
        applyItem(table, parseTableItem(clause))
      }
      continue
    }
  }

  for (const t of tables) {
    for (const col of t.columns) {
      if (col.pk && !t.pkCols.includes(col.name)) t.pkCols.push(col.name)
    }
    for (const pkName of t.pkCols) {
      if (!t.columns.some((c) => c.name === pkName)) {
        addWarning('missingPkColumn', t.name, pkName)
      }
    }
  }

  const pending = []
  for (const t of tables) {
    for (const fk of t.pendingFks) pending.push({ from: t, ...fk })
  }

  pending.forEach((fk, index) => {
    for (const col of fk.cols) {
      if (!fk.from.columns.some((c) => c.name === col)) {
        addWarning('missingFkColumn', fk.from.name, col)
      }
    }
    const target = findTable(fk.refTable)
    if (!target) {
      addWarning('missingTable', fk.from.name, fk.refTable)
      return
    }
    let toCols = fk.refCols
    if (!toCols || toCols.length === 0) {
      toCols = target.pkCols.length ? [...target.pkCols] : target.columns.length ? [target.columns[0].name] : []
    } else {
      for (const col of toCols) {
        if (!target.columns.some((c) => c.name === col)) {
          addWarning('missingRefColumn', target.name, col, fk.from.name)
        }
      }
    }
    if (toCols.length === 0) return
    if (toCols.length !== fk.cols.length) {
      addWarning('fkArity', fk.from.name, String(fk.cols.length), String(toCols.length))
    }
    for (const col of fk.cols) {
      const c = fk.from.columns.find((x) => x.name === col)
      if (c && !c.isFk) c.isFk = true
    }
    rels.push({
      id: `r${index}`,
      fromId: fk.from.id,
      toId: target.id,
      fromName: fk.from.name,
      toName: target.name,
      fromCols: fk.cols,
      toCols,
    })
  })

  for (const t of tables) {
    delete t.pendingFks
    if (t.pkCols.length === 0) addWarning('noPk', t.name)
  }

  return { tables, rels, warnings }
}

export function tableSize(t) {
  const nameW = t.name.length * HEADER_CHAR_W + 30
  const badge = t.columns.some((c) => c.pk || c.isFk)
  const badgeW = badge ? BADGE_AREA : 14
  let maxName = 0
  let maxType = 0
  for (const c of t.columns) {
    if (c.name.length > maxName) maxName = c.name.length
    const len = Math.min(c.type.length, MAX_TYPE_CHARS)
    if (len > maxType) maxType = len
  }
  const w = Math.max(MIN_TABLE_W, nameW, badgeW + maxName * CHAR_W + 16 + maxType * CHAR_W + 16)
  const h = HEADER_H + Math.max(t.columns.length, 1) * ROW_H + 2
  return { w, h }
}

export function layoutDiagram(tables, rels) {
  const byIdObj = {}
  for (const t of tables) {
    const { w, h } = tableSize(t)
    byIdObj[t.id] = { x: 0, y: 0, w, h }
  }

  const targets = new Map()
  for (const r of rels) {
    if (!byIdObj[r.fromId] || !byIdObj[r.toId]) continue
    if (!targets.has(r.fromId)) targets.set(r.fromId, [])
    targets.get(r.fromId).push(r.toId)
  }

  const depth = new Map()
  const visiting = new Set()
  const computeDepth = (id) => {
    if (depth.has(id)) return depth.get(id)
    if (visiting.has(id)) return -1
    visiting.add(id)
    let d = 0
    for (const target of targets.get(id) || []) {
      const td = computeDepth(target)
      if (td >= 0 && td + 1 > d) d = td + 1
    }
    visiting.delete(id)
    depth.set(id, d)
    return d
  }
  for (const t of tables) computeDepth(t.id)

  const rows = new Map()
  tables.forEach((t) => {
    const d = depth.get(t.id) || 0
    if (!rows.has(d)) rows.set(d, [])
    rows.get(d).push(t)
  })

  const depths = [...rows.keys()].sort((a, b) => a - b)
  let maxRowW = 0
  for (const d of depths) {
    const row = rows.get(d)
    let w = 0
    for (const t of row) w += byIdObj[t.id].w
    w += H_GAP * Math.max(row.length - 1, 0)
    if (w > maxRowW) maxRowW = w
  }

  let y = PAD
  for (const d of depths) {
    const row = rows.get(d)
    let rowW = 0
    for (const t of row) rowW += byIdObj[t.id].w
    rowW += H_GAP * Math.max(row.length - 1, 0)
    let x = PAD + (maxRowW - rowW) / 2
    let rowH = 0
    for (const t of row) {
      const pos = byIdObj[t.id]
      pos.x = Math.round(x)
      pos.y = Math.round(y)
      x += pos.w + H_GAP
      if (pos.h > rowH) rowH = pos.h
    }
    y += rowH + V_GAP
  }

  const width = Math.round(maxRowW + PAD * 2)
  const height = Math.round(y - V_GAP + PAD)
  const sig =
    tables.map((t) => `${t.id}:${t.name}:${t.columns.length}`).join('|') + `#${rels.length}`

  return { byId: byIdObj, width, height, sig }
}

export function columnAnchorY(pos, table, colName) {
  const idx = table.columns.findIndex((c) => c.name === colName)
  if (idx < 0) return pos.y + HEADER_H / 2
  return pos.y + HEADER_H + idx * ROW_H + ROW_H / 2 + 1
}

export function buildEdge(a, ay, b, by, bend = 0) {
  if (!a || !b) return null
  if (a === b) {
    const sx = a.x + a.w
    const tx = a.x + a.w
    const off = 54 + Math.abs(bend) * 10
    const dir = bend >= 0 ? 1 : -1
    const d = `M ${sx} ${ay} C ${sx + off} ${ay}, ${tx + off} ${by}, ${tx} ${by}`
    return {
      d,
      side: 'self',
      sx,
      sy: ay,
      tx,
      ty: by,
      nX: sx + 14,
      nY: ay - 5,
      nAnchor: 'start',
      oneX: tx + 14,
      oneY: by + 12,
      oneAnchor: 'start',
      dir,
    }
  }
  const ac = a.x + a.w / 2
  const bc = b.x + b.w / 2
  const goRight = bc >= ac
  const sx = goRight ? a.x + a.w : a.x
  const tx = goRight ? b.x : b.x + b.w
  const dx = tx - sx
  const bow = bend * 16
  const d = `M ${sx} ${ay} C ${sx + dx * 0.42} ${ay + bow}, ${tx - dx * 0.42} ${by + bow}, ${tx} ${by}`
  return {
    d,
    side: goRight ? 'r' : 'l',
    sx,
    sy: ay,
    tx,
    ty: by,
    nX: sx + (goRight ? -8 : 8),
    nY: ay - 6,
    nAnchor: goRight ? 'end' : 'start',
    oneX: tx + (goRight ? -8 : 8),
    oneY: by + 14,
    oneAnchor: goRight ? 'end' : 'start',
    dir: goRight ? 1 : -1,
  }
}

const SAMPLE_ECOMMERCE = `-- Loja virtual: usuários, produtos e pedidos
CREATE TABLE users (
  id          BIGINT PRIMARY KEY AUTO_INCREMENT,
  email       VARCHAR(255) NOT NULL UNIQUE,
  name        VARCHAR(120) NOT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE addresses (
  id          BIGINT PRIMARY KEY,
  user_id     BIGINT NOT NULL REFERENCES users(id),
  street      VARCHAR(160) NOT NULL,
  city        VARCHAR(80) NOT NULL,
  country     CHAR(2) NOT NULL
);

CREATE TABLE categories (
  id        SERIAL PRIMARY KEY,
  name      VARCHAR(80) NOT NULL,
  parent_id BIGINT REFERENCES categories(id)
);

CREATE TABLE products (
  id          BIGINT PRIMARY KEY,
  title       VARCHAR(160) NOT NULL,
  price_cents INTEGER NOT NULL,
  stock       INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE orders (
  id          BIGINT PRIMARY KEY,
  status      VARCHAR(20) NOT NULL DEFAULT 'pending',
  total_cents INTEGER NOT NULL
);

CREATE TABLE order_items (
  id         BIGINT PRIMARY KEY,
  quantity   INTEGER NOT NULL,
  unit_price INTEGER NOT NULL
);

ALTER TABLE products MODIFY id BIGINT NOT NULL;
ALTER TABLE products ADD COLUMN category_id BIGINT;
ALTER TABLE products ADD CONSTRAINT fk_products_category
  FOREIGN KEY (category_id) REFERENCES categories(id);
ALTER TABLE orders ADD COLUMN user_id BIGINT NOT NULL;
ALTER TABLE orders ADD FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE order_items ADD COLUMN order_id BIGINT NOT NULL;
ALTER TABLE order_items ADD FOREIGN KEY (order_id) REFERENCES orders(id);
ALTER TABLE order_items ADD COLUMN product_id BIGINT NOT NULL;
ALTER TABLE order_items ADD FOREIGN KEY (product_id) REFERENCES products(id);
ALTER TABLE addresses ADD COLUMN complement VARCHAR(120);`

const SAMPLE_BLOG = `CREATE TABLE "users" (
  "id" UUID PRIMARY KEY,
  "username" VARCHAR(40) NOT NULL,
  "bio" TEXT
);

CREATE TABLE posts (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  published_at TIMESTAMP
);

CREATE TABLE tags (
  id SERIAL PRIMARY KEY,
  label VARCHAR(40) NOT NULL UNIQUE
);

CREATE TABLE posts_tags (
  post_id UUID NOT NULL,
  tag_id BIGINT NOT NULL,
  added_at TIMESTAMP NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, tag_id)
);

CREATE TABLE comments (
  id BIGINT PRIMARY KEY,
  post_id UUID NOT NULL,
  parent_id BIGINT,
  body TEXT NOT NULL,
  FOREIGN KEY (post_id) REFERENCES posts(id),
  FOREIGN KEY (parent_id) REFERENCES comments(id)
);

ALTER TABLE posts ADD COLUMN author_id UUID NOT NULL;
ALTER TABLE posts ADD FOREIGN KEY (author_id) REFERENCES "users"("id");
ALTER TABLE posts_tags ADD FOREIGN KEY (post_id) REFERENCES posts(id);
ALTER TABLE posts_tags ADD FOREIGN KEY (tag_id) REFERENCES tags(id);`

const SAMPLE_COMPANY = `-- Ciclo departments <-> employees + auto-referência em manager_id
CREATE TABLE departments (
  id SERIAL PRIMARY KEY,
  name VARCHAR(80) NOT NULL,
  head_id BIGINT
);

CREATE TABLE employees (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  hired_on DATE NOT NULL
);

CREATE TABLE projects (
  id SERIAL PRIMARY KEY,
  code VARCHAR(16) NOT NULL UNIQUE,
  budget_cents BIGINT
);

CREATE TABLE project_members (
  project_id BIGINT NOT NULL,
  employee_id BIGINT NOT NULL,
  role VARCHAR(30) NOT NULL,
  PRIMARY KEY (project_id, employee_id)
);

ALTER TABLE departments ADD FOREIGN KEY (head_id) REFERENCES employees(id);
ALTER TABLE employees ADD COLUMN department_id BIGINT NOT NULL;
ALTER TABLE employees ADD FOREIGN KEY (department_id) REFERENCES departments(id);
ALTER TABLE employees ADD COLUMN manager_id BIGINT;
ALTER TABLE employees ADD FOREIGN KEY (manager_id) REFERENCES employees(id);
ALTER TABLE project_members ADD FOREIGN KEY (project_id) REFERENCES projects(id);
ALTER TABLE project_members ADD FOREIGN KEY (employee_id) REFERENCES employees(id);`

export const SAMPLES = [
  { key: 'shop', label: 'Loja virtual', enLabel: 'E-commerce', sql: SAMPLE_ECOMMERCE },
  { key: 'blog', label: 'Blog', enLabel: 'Blog', sql: SAMPLE_BLOG },
  { key: 'company', label: 'Empresa (ciclo + auto-ref)', enLabel: 'Company (cycle + self-ref)', sql: SAMPLE_COMPANY },
]
