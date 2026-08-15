// Motor do Gerador de Diagrama de Sequência
// Parser de texto simples -> SVG com atores, lifelines, mensagens,
// ativações e notas. 100% client-side, sem dependências.

export const DEFAULT_SOURCE = `participant User
participant App
participant API
User -> App: clica em login
App -> API: POST /auth
API --> App: token JWT
App --> User: dashboard carregado
Note over App: valida sessão
API -> API: rotaciona secret
App -> API: GET /profile
API --> App: dados do usuário`

const MARGIN_X = 24
const MARGIN_Y = 24
const ACTOR_W = 120
const ACTOR_H = 44
const ACTOR_GAP = 80
const STEP_H = 56
const NOTE_W = 140
const NOTE_H = 44
const ARROW_HEAD_W = 8
const ARROW_HEAD_H = 6
const LIFELINE_PAD = 16

function parseLine(raw) {
  const line = raw.trim()
  if (!line || line.startsWith('//') || line.startsWith('#')) {
    return { type: 'comment', raw: line }
  }

  const lower = line.toLowerCase()

  // participant / actor
  const participantMatch = line.match(/^(participant|actor)\s+(.+)$/i)
  if (participantMatch) {
    return {
      type: 'participant',
      name: participantMatch[2].trim(),
      raw: line,
    }
  }

  // note over A or A,B
  const noteMatch = line.match(/^note\s+over\s+([^:]+)\s*:\s*(.+)$/i)
  if (noteMatch) {
    const targets = noteMatch[1].split(',').map((s) => s.trim()).filter(Boolean)
    return {
      type: 'note',
      targets,
      text: noteMatch[2].trim(),
      raw: line,
    }
  }

  // activate / deactivate
  const activateMatch = line.match(/^(activate|deactivate)\s+(.+)$/i)
  if (activateMatch) {
    return {
      type: activateMatch[1].toLowerCase(),
      target: activateMatch[2].trim(),
      raw: line,
    }
  }

  // message: A -> B: text
  const msgMatch = line.match(/^([^-]+?)(\s*-{1,3}\s*[>x])\s+([^:]+)\s*:\s*(.+)$/)
  if (msgMatch) {
    const from = msgMatch[1].trim()
    const arrowRaw = msgMatch[2].replace(/\s/g, '')
    const to = msgMatch[3].trim()
    const text = msgMatch[4].trim()
    const style = arrowRaw.includes('--') ? 'dashed' : 'solid'
    const head = arrowRaw.endsWith('x') ? 'x' : 'arrow'
    return {
      type: 'message',
      from,
      to,
      text,
      style,
      head,
      raw: line,
    }
  }

  return { type: 'unknown', raw: line }
}

export function parseSource(source) {
  const lines = source.split('\n')
  const events = []
  const declaredParticipants = []

  for (const raw of lines) {
    const ev = parseLine(raw)
    if (ev.type === 'comment' || ev.type === 'unknown') continue
    if (ev.type === 'participant') {
      declaredParticipants.push(ev.name)
      continue
    }
    events.push(ev)
  }

  // Coleta participantes usados nas mensagens/notas se não declarados.
  const autoParticipants = new Set()
  for (const ev of events) {
    if (ev.type === 'message') {
      autoParticipants.add(ev.from)
      autoParticipants.add(ev.to)
    } else if (ev.type === 'note') {
      ev.targets.forEach((t) => autoParticipants.add(t))
    } else if (ev.type === 'activate' || ev.type === 'deactivate') {
      autoParticipants.add(ev.target)
    }
  }

  const participants =
    declaredParticipants.length > 0
      ? declaredParticipants
      : [...autoParticipants]

  return { participants, events }
}

function measureText(text, fontSize = 13) {
  // Estimativa conservadora: ~0.6em por caractere.
  return { width: text.length * fontSize * 0.6, height: fontSize }
}

export function buildDiagram(source) {
  const { participants, events } = parseSource(source)
  if (participants.length === 0) {
    return { error: 'Nenhum participante encontrado. Declare com "participant Nome" ou envie uma mensagem.' }
  }

  const actorXs = []
  let x = MARGIN_X + ACTOR_W / 2
  for (let i = 0; i < participants.length; i++) {
    actorXs.push(x)
    x += ACTOR_W + ACTOR_GAP
  }

  const width = actorXs[actorXs.length - 1] + ACTOR_W / 2 + MARGIN_X
  const actorByName = Object.fromEntries(participants.map((p, i) => [p, { index: i, x: actorXs[i] }]))

  // Calcula altura percorrendo eventos e mantendo ativações.
  let y = MARGIN_Y + ACTOR_H
  const rows = []
  const active = Object.fromEntries(participants.map((p) => [p, { count: 0, startY: null }]))

  for (const ev of events) {
    if (ev.type === 'message') {
      const fromIdx = actorByName[ev.from]?.index ?? -1
      const toIdx = actorByName[ev.to]?.index ?? -1
      rows.push({ ...ev, y, fromIdx, toIdx })
      y += STEP_H
    } else if (ev.type === 'note') {
      const indices = ev.targets
        .map((t) => actorByName[t]?.index)
        .filter((i) => i !== undefined)
      rows.push({ ...ev, y, indices })
      y += STEP_H
    } else if (ev.type === 'activate') {
      const info = actorByName[ev.target]
      if (info && active[ev.target].count === 0) {
        active[ev.target].startY = y
      }
      if (info) active[ev.target].count += 1
      rows.push({ ...ev, y, idx: info?.index })
      y += STEP_H
    } else if (ev.type === 'deactivate') {
      const info = actorByName[ev.target]
      if (info && active[ev.target].count > 0) {
        active[ev.target].count -= 1
      }
      rows.push({ ...ev, y, idx: info?.index, startY: active[ev.target].count === 0 ? active[ev.target].startY : null })
      if (info && active[ev.target].count === 0) {
        active[ev.target].startY = null
      }
      y += STEP_H
    }
  }

  const height = y + LIFELINE_PAD + MARGIN_Y
  return {
    participants,
    actorXs,
    actorByName,
    rows,
    width,
    height,
  }
}

function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function actorBox(x, y, name, theme) {
  const rx = 6
  return [
    `<rect x="${x - ACTOR_W / 2}" y="${y}" width="${ACTOR_W}" height="${ACTOR_H}" rx="${rx}" fill="${theme.actorFill}" stroke="${theme.actorStroke}" stroke-width="1.5"/>`,
    `<text x="${x}" y="${y + ACTOR_H / 2 + 5}" text-anchor="middle" font-size="13" fill="${theme.text}" font-family="sans-serif">${escapeXml(name)}</text>`,
  ].join('')
}

function lifeline(x, y1, y2, theme) {
  return `<line x1="${x}" y1="${y1}" x2="${x}" y2="${y2}" stroke="${theme.lifeline}" stroke-width="1" stroke-dasharray="4 4"/>`
}

function arrowHead(x, y, direction, style, head, theme) {
  // direction: 1 para direita, -1 para esquerda
  const tipX = direction === 1 ? x - ARROW_HEAD_W : x + ARROW_HEAD_W
  const backX = direction === 1 ? x - ARROW_HEAD_W * 2 : x + ARROW_HEAD_W * 2
  if (head === 'x') {
    return `<line x1="${backX}" y1="${y - ARROW_HEAD_H}" x2="${tipX}" y2="${y + ARROW_HEAD_H}" stroke="${theme.arrow}" stroke-width="1.5"/>
            <line x1="${backX}" y1="${y + ARROW_HEAD_H}" x2="${tipX}" y2="${y - ARROW_HEAD_H}" stroke="${theme.arrow}" stroke-width="1.5"/>`
  }
  return `<polygon points="${x},${y} ${backX},${y - ARROW_HEAD_H} ${backX},${y + ARROW_HEAD_H}" fill="${style === 'solid' ? theme.arrow : 'none'}" stroke="${theme.arrow}" stroke-width="1.5"/>`
}

function messageRow(row, theme) {
  const { fromIdx, toIdx, y, text, style, head } = row
  const x1 = actorXs[fromIdx]
  const x2 = actorXs[toIdx]
  const direction = x2 > x1 ? 1 : -1
  const startX = x1 + (direction === 1 ? 8 : -8)
  const endX = x2 - (direction === 1 ? 8 : -8)
  const strokeDash = style === 'dashed' ? ' stroke-dasharray="5 5"' : ''
  const labelX = (startX + endX) / 2
  const labelY = y - 8
  const textMetrics = measureText(text)
  const labelBgW = textMetrics.width + 16
  const labelBgH = textMetrics.height + 8

  const parts = []
  // Fundo branco do label para cobrir a linha (evita legibilidade ruim)
  parts.push(`<rect x="${labelX - labelBgW / 2}" y="${labelY - labelBgH / 2}" width="${labelBgW}" height="${labelBgH}" rx="4" fill="${theme.labelBg}" stroke="none"/>`)
  parts.push(`<line x1="${startX}" y1="${y}" x2="${endX}" y2="${y}" stroke="${theme.arrow}" stroke-width="1.5"${strokeDash}/>`)
  parts.push(arrowHead(endX, y, direction, style, head, theme))
  parts.push(`<text x="${labelX}" y="${labelY + 4}" text-anchor="middle" font-size="12" fill="${theme.text}" font-family="sans-serif">${escapeXml(text)}</text>`)
  return parts.join('')
}

function noteRow(row, theme) {
  const { indices, y, text } = row
  const xs = indices.map((i) => actorXs[i])
  const centerX = xs.length > 1 ? (Math.min(...xs) + Math.max(...xs)) / 2 : xs[0]
  const metrics = measureText(text, 12)
  const w = Math.max(NOTE_W, metrics.width + 24)
  const h = Math.max(NOTE_H, metrics.height + 18)
  const x = centerX - w / 2
  const yPos = y - h / 2
  const fold = 10
  return [
    `<rect x="${x}" y="${yPos}" width="${w - fold}" height="${h}" rx="4" fill="${theme.noteFill}" stroke="${theme.noteStroke}" stroke-width="1.5"/>`,
    `<polygon points="${x + w - fold},${yPos} ${x + w},${yPos + fold} ${x + w - fold},${yPos + fold}" fill="${theme.noteFill}" stroke="${theme.noteStroke}" stroke-width="1.5"/>`,
    `<line x1="${x + w - fold}" y1="${yPos}" x2="${x + w - fold}" y2="${yPos + fold}" stroke="${theme.noteStroke}" stroke-width="1.5"/>`,
    `<line x1="${x + w - fold}" y1="${yPos + fold}" x2="${x + w}" y2="${yPos + fold}" stroke="${theme.noteStroke}" stroke-width="1.5"/>`,
    `<text x="${x + (w - fold) / 2}" y="${yPos + h / 2 + 4}" text-anchor="middle" font-size="12" fill="${theme.text}" font-family="sans-serif">${escapeXml(text)}</text>`,
  ].join('')
}

function activationRect(x, y1, y2, theme) {
  const width = 14
  return `<rect x="${x - width / 2}" y="${y1}" width="${width}" height="${Math.max(10, y2 - y1)}" rx="2" fill="${theme.activationFill}" stroke="${theme.activationStroke}" stroke-width="1"/>`
}

let actorXs = []

export function buildSvg(source, theme = {}) {
  const palette = {
    actorFill: '#f6ffed',
    actorStroke: '#52c41a',
    lifeline: '#d9d9d9',
    arrow: '#595959',
    text: '#262626',
    labelBg: '#ffffff',
    noteFill: '#fffbe6',
    noteStroke: '#faad14',
    activationFill: '#e6f4ff',
    activationStroke: '#1677ff',
    ...theme,
  }

  const diagram = buildDiagram(source)
  if (diagram.error) {
    return { error: diagram.error, svg: null }
  }

  actorXs = diagram.actorXs
  const { participants, rows, width, height } = diagram

  const parts = []
  parts.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="Sequence diagram">`)
  parts.push(`<rect width="100%" height="100%" fill="${palette.labelBg}"/>`)

  const bottomY = height - MARGIN_Y

  // Lifelines
  for (let i = 0; i < participants.length; i++) {
    parts.push(lifeline(actorXs[i], MARGIN_Y + ACTOR_H, bottomY, palette))
  }

  // Ativações (precisam ficar atrás das mensagens)
  const activations = []
  for (const row of rows) {
    if (row.type === 'activate') {
      const stack = activations.filter((a) => a.name === row.target && a.end === null)
      if (stack.length === 0) {
        activations.push({ name: row.target, start: row.y, end: null })
      }
    } else if (row.type === 'deactivate') {
      let open = null
      for (let k = activations.length - 1; k >= 0; k--) {
        const a = activations[k]
        if (a.name === row.target && a.end === null) {
          open = a
          break
        }
      }
      if (open) {
        open.end = row.y
      }
    }
  }
  for (const a of activations) {
    if (a.end === null) a.end = bottomY - LIFELINE_PAD
    const info = diagram.actorByName[a.name]
    if (info) {
      parts.push(activationRect(actorXs[info.index], a.start, a.end, palette))
    }
  }

  // Caixas de atores
  for (let i = 0; i < participants.length; i++) {
    parts.push(actorBox(actorXs[i], MARGIN_Y, participants[i], palette))
  }

  // Eventos
  for (const row of rows) {
    if (row.type === 'message') {
      parts.push(messageRow(row, palette))
    } else if (row.type === 'note') {
      parts.push(noteRow(row, palette))
    }
  }

  parts.push('</svg>')
  const svg = parts.join('\n')
  return { svg, width, height, participants, rows }
}

export const PRESETS = {
  'simple-auth': {
    label: 'Login simples',
    enLabel: 'Simple login',
    source: DEFAULT_SOURCE,
  },
  'api-crud': {
    label: 'CRUD via API',
    enLabel: 'API CRUD',
    source: `participant Client
participant API
participant DB
Client -> API: GET /users
API -> DB: SELECT * FROM users
DB --> API: rows
API --> Client: 200 OK JSON

Client -> API: POST /users
API -> API: valida payload
API -> DB: INSERT ... RETURNING id
DB --> API: new user
API --> Client: 201 Created`,
  },
  'error-flow': {
    label: 'Fluxo de erro',
    enLabel: 'Error flow',
    source: `participant User
participant Service
participant Cache
User -> Service: busca pedido #123
Service -> Cache: get(123)
Cache --> Service: miss
Service -> Service: consulta DB
Service -> Cache: set(123, data)
Service x-- User: 404 Not Found`,
  },
  'activation': {
    label: 'Ativação / método',
    enLabel: 'Activation / method',
    source: `participant A
participant B
A -> B: chama process()
activate B
B -> B: valida
B -> A: callback
A --> B: ok
deactivate B`,
  },
}
