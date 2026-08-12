import express from 'express'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import db from './db.js'

const app = express()
app.use(cors())
app.use(express.json({ limit: '10kb' }))

const bugReportLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
})

// Bem mais permissivo que o de bugs — dispara em toda navegação de página,
// não só em uma ação explícita do usuário.
const visitLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
})

app.get('/api/items', (req, res) => {
  const items = db
    .prepare('SELECT key, title, created_at FROM items ORDER BY created_at DESC, id DESC')
    .all()
  res.json(items)
})

app.post('/api/bugs', bugReportLimiter, (req, res) => {
  const { item_key, description } = req.body || {}

  if (typeof item_key !== 'string' || !item_key.startsWith('/') || item_key.length > 200) {
    return res.status(400).json({ error: 'invalid item_key' })
  }
  if (typeof description !== 'string' || description.trim().length === 0 || description.length > 2000) {
    return res.status(400).json({ error: 'invalid description' })
  }

  const itemExists = db.prepare('SELECT 1 FROM items WHERE key = ?').get(item_key)
  if (!itemExists) {
    return res.status(404).json({ error: 'unknown item_key' })
  }

  db.prepare('INSERT INTO bugs (item_key, description) VALUES (?, ?)').run(
    item_key,
    description.trim()
  )
  res.status(201).json({ ok: true })
})

// Contador anônimo de visita por rota — sem IP, sem user-agent, só um
// incremento por chave. Alimenta a seção "ferramentas mais visitadas" de
// /bastidores.
app.post('/api/visits', visitLimiter, (req, res) => {
  const { key } = req.body || {}

  if (typeof key !== 'string' || !key.startsWith('/') || key.length > 200) {
    return res.status(400).json({ error: 'invalid key' })
  }

  db.prepare(
    `INSERT INTO visits (key, count, last_visited_at) VALUES (?, 1, datetime('now'))
     ON CONFLICT(key) DO UPDATE SET count = count + 1, last_visited_at = datetime('now')`
  ).run(key)
  res.status(204).end()
})

app.get('/api/visits', (req, res) => {
  const visits = db
    .prepare('SELECT key, count, last_visited_at FROM visits ORDER BY count DESC')
    .all()
  res.json(visits)
})

// Feed público de /bastidores — resumos escritos pelo agente noturno
// (bastidores-agent.sh, 00:00 BRT) sobre o que mudou no dia.
app.get('/api/bastidores', (req, res) => {
  const entries = db
    .prepare('SELECT id, summary, created_at FROM bastidores_entries ORDER BY created_at DESC, id DESC LIMIT 90')
    .all()
  res.json(entries)
})

app.get('/api/health', (req, res) => res.json({ ok: true }))

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`devtools-api listening on ${PORT}`)
})
