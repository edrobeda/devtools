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

app.get('/api/health', (req, res) => res.json({ ok: true }))

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`devtools-api listening on ${PORT}`)
})
