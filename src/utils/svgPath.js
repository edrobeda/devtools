// Parser de paths SVG (`d` attribute) + geometria básica para visualização.
//
// Aceita o subconjunto de paths do SVG 1.1: M/L/H/V/C/S/Q/T/A/Z (maiúsculas
// = absolutas, minúsculas = relativas; após `M`, pares de coordenadas
// repetidos viram `L` implícito). Não processa os novos formatos de path
// do SVG 2.0 (B bùzier genérico com on/off-curves e marker-turns).
//
// Saída: array de comandos com `type`, `args` (originais, strings) e
// coordenadas absolutas calculadas, além dos pontos de controle implícitos
// (reflexão de C/S e Q/T). Para a visualização, cada comando carrega
// também `start` (ponto antes do comando) e `end` (ponto depois), e para
// arcos `center`/`radii`/`flags`.

const COMMAND_ARGS = {
  M: 2, L: 2, H: 1, V: 1, C: 6, S: 4, Q: 4, T: 2, A: 7, Z: 0,
}

const COMMAND_NAMES_PT = {
  M: 'Mover para',
  L: 'Linha para',
  H: 'Linha horizontal',
  V: 'Linha vertical',
  C: 'Bézier cúbica para',
  S: 'Bézier cúbica suave para',
  Q: 'Bézier quadrática para',
  T: 'Bézier quadrática suave para',
  A: 'Arco elíptico para',
  Z: 'Fechar caminho',
}

const COMMAND_NAMES_EN = {
  M: 'Move to',
  L: 'Line to',
  H: 'Horizontal line to',
  V: 'Vertical line to',
  C: 'Cubic Bézier to',
  S: 'Smooth cubic Bézier to',
  Q: 'Quadratic Bézier to',
  T: 'Smooth quadratic Bézier to',
  A: 'Elliptical arc to',
  Z: 'Close path',
}

export function commandName(cmd, lang = 'en') {
  return (lang === 'pt' ? COMMAND_NAMES_PT : COMMAND_NAMES_EN)[cmd] || cmd
}

export function argCount(cmd) {
  return COMMAND_ARGS[cmd]
}

// ─── Tokenização ────────────────────────────────────────────────────
// Quebra `d` em tokens: comandos (uma letra) e números (com sinal, vírgula
// como separador, expoente). Suporta `1e-3`, `.5`, `-.5`, `+1`, etc.
function tokenize(d) {
  const tokens = []
  const re = /([MmLlHhVvCcSsQqTtAaZz])|(-?\d*\.?\d+(?:[eE][+-]?\d+)?)/g
  let m
  while ((m = re.exec(d)) !== null) {
    if (m[1] !== undefined) {
      tokens.push({ type: 'cmd', value: m[1], index: m.index })
    } else if (m[2] !== undefined) {
      tokens.push({ type: 'num', value: m[2], index: m.index })
    }
  }
  return tokens
}

// ─── Parser principal ───────────────────────────────────────────────
export function parsePath(d) {
  const tokens = tokenize(d)
  const errors = []
  const commands = []
  if (tokens.length === 0) {
    return { commands: [], bbox: null, bboxFromControl: null, length: 0, subpathCount: 0, errors, raw: d }
  }

  let cursor = 0
  const cur = { x: 0, y: 0 }
  let startOfSubpath = { x: 0, y: 0 }
  let lastCtrlC = null  // último CP2 de C/S
  let lastCtrlQ = null  // último CP de Q/T
  let cmdUpper = ''
  let workingCmd = ''
  let workingRel = false
  let afterM = false  // 1º arg do M já foi consumido; grupos seguintes viram L
  let subpathIndex = 0

  function readArgs(count) {
    const out = []
    for (let i = 0; i < count; i++) {
      if (cursor >= tokens.length || tokens[cursor].type !== 'num') {
        return out
      }
      const v = parseFloat(tokens[cursor].value)
      if (!Number.isFinite(v)) {
        errors.push(`Invalid number "${tokens[cursor].value}" at position ${tokens[cursor].index}`)
        return out
      }
      out.push(v)
      cursor++
    }
    return out
  }

  while (cursor < tokens.length) {
    const tok = tokens[cursor]
    if (tok.type !== 'cmd') {
      errors.push(`Unexpected number "${tok.value}" at position ${tok.index}`)
      cursor++
      continue
    }
    const raw = tok.value
    cmdUpper = raw.toUpperCase()
    const isRel = raw !== cmdUpper
    if (!(cmdUpper in COMMAND_ARGS)) {
      errors.push(`Unknown command "${raw}" at position ${tok.index}`)
      cursor++
      continue
    }
    cursor++

    // 1º M abre um subpath novo; args repetidos viram L (mesma case de rel).
    workingCmd = cmdUpper
    workingRel = isRel
    afterM = false

    // processa o 1º args como M (ou H/V, etc.) e args seguintes como L
    while (true) {
      // Se o próximo token é um comando, não consumi-lo aqui — deixa o
      // while externo tratar (importante quando A vem logo após M).
      if (cursor < tokens.length && tokens[cursor].type === 'cmd') break
      const need = COMMAND_ARGS[workingCmd]
      const args = readArgs(need)
      if (args.length === 0) break
      if (args.length < need) {
        errors.push(`Command "${workingCmd}" needs ${need} arguments, got ${args.length}`)
        break
      }

      const startPt = { x: cur.x, y: cur.y }
      let endPt = { x: cur.x, y: cur.y }
      let control
      let arc

      if (workingCmd === 'M') {
        if (workingRel) { cur.x += args[0]; cur.y += args[1] } else { cur.x = args[0]; cur.y = args[1] }
        startOfSubpath = { x: cur.x, y: cur.y }
        lastCtrlC = null
        lastCtrlQ = null
        endPt = { x: cur.x, y: cur.y }
      } else if (workingCmd === 'L') {
        if (workingRel) { cur.x += args[0]; cur.y += args[1] } else { cur.x = args[0]; cur.y = args[1] }
        endPt = { x: cur.x, y: cur.y }
        lastCtrlC = null
        lastCtrlQ = null
      } else if (workingCmd === 'H') {
        if (workingRel) { cur.x += args[0] } else { cur.x = args[0] }
        endPt = { x: cur.x, y: cur.y }
        lastCtrlC = null
        lastCtrlQ = null
      } else if (workingCmd === 'V') {
        if (workingRel) { cur.y += args[0] } else { cur.y = args[0] }
        endPt = { x: cur.x, y: cur.y }
        lastCtrlC = null
        lastCtrlQ = null
      } else if (workingCmd === 'C') {
        let p1, p2, p
        if (workingRel) {
          p1 = { x: cur.x + args[0], y: cur.y + args[1] }
          p2 = { x: cur.x + args[2], y: cur.y + args[3] }
          p = { x: cur.x + args[4], y: cur.y + args[5] }
        } else {
          p1 = { x: args[0], y: args[1] }
          p2 = { x: args[2], y: args[3] }
          p = { x: args[4], y: args[5] }
        }
        control = [p1, p2]
        cur.x = p.x; cur.y = p.y
        endPt = { x: cur.x, y: cur.y }
        lastCtrlC = p2
        lastCtrlQ = null
      } else if (workingCmd === 'S') {
        let p2, p
        if (workingRel) {
          p2 = { x: cur.x + args[0], y: cur.y + args[1] }
          p = { x: cur.x + args[2], y: cur.y + args[3] }
        } else {
          p2 = { x: args[0], y: args[1] }
          p = { x: args[2], y: args[3] }
        }
        const reflected = lastCtrlC
          ? { x: 2 * cur.x - lastCtrlC.x, y: 2 * cur.y - lastCtrlC.y }
          : { x: cur.x, y: cur.y }
        control = [reflected, p2]
        cur.x = p.x; cur.y = p.y
        endPt = { x: cur.x, y: cur.y }
        lastCtrlC = p2
        lastCtrlQ = null
      } else if (workingCmd === 'Q') {
        let cp, p
        if (workingRel) {
          cp = { x: cur.x + args[0], y: cur.y + args[1] }
          p = { x: cur.x + args[2], y: cur.y + args[3] }
        } else {
          cp = { x: args[0], y: args[1] }
          p = { x: args[2], y: args[3] }
        }
        control = [cp]
        cur.x = p.x; cur.y = p.y
        endPt = { x: cur.x, y: cur.y }
        lastCtrlQ = cp
        lastCtrlC = null
      } else if (workingCmd === 'T') {
        let p
        if (workingRel) { p = { x: cur.x + args[0], y: cur.y + args[1] } }
        else { p = { x: args[0], y: args[1] } }
        const reflected = lastCtrlQ
          ? { x: 2 * cur.x - lastCtrlQ.x, y: 2 * cur.y - lastCtrlQ.y }
          : { x: cur.x, y: cur.y }
        control = [reflected]
        cur.x = p.x; cur.y = p.y
        endPt = { x: cur.x, y: cur.y }
        lastCtrlQ = reflected
        lastCtrlC = null
      } else if (workingCmd === 'A') {
        const rx = Math.abs(args[0])
        const ry = Math.abs(args[1])
        const xRotation = args[2]
        const largeArc = args[3] !== 0
        const sweep = args[4] !== 0
        let p
        if (workingRel) { p = { x: cur.x + args[5], y: cur.y + args[6] } }
        else { p = { x: args[5], y: args[6] } }
        const arcRes = computeArcCenter(cur, p, rx, ry, xRotation, largeArc, sweep)
        cur.x = p.x; cur.y = p.y
        endPt = { x: cur.x, y: cur.y }
        arc = {
          center: arcRes.center,
          rx,
          ry,
          xRotation,
          largeArc,
          sweep,
          valid: arcRes.valid,
        }
        lastCtrlC = null
        lastCtrlQ = null
      } else if (workingCmd === 'Z') {
        cur.x = startOfSubpath.x; cur.y = startOfSubpath.y
        endPt = { x: cur.x, y: cur.y }
        lastCtrlC = null
        lastCtrlQ = null
      }

      commands.push({
        cmd: workingCmd,
        rel: workingRel ? 'rel' : 'abs',
        args: args.map((n) => formatNumber(n)),
        start: startPt,
        end: endPt,
        control,
        arc,
        raw: `${raw}${args.map((n) => formatNumber(n)).join(' ')}`,
        index: commands.length,
        subpath: subpathIndex,
      })

      // Após M, args subsequentes viram L
      if (cmdUpper === 'M' && workingCmd === 'M' && !afterM) {
        workingCmd = 'L'
        afterM = true
      } else {
        break
      }
    }
    if (cmdUpper === 'M') subpathIndex++
  }

  // Calcula bbox a partir dos pontos end + start
  let bbox = null
  let bboxCtrl = null
  if (commands.length > 0) {
    const xs = []
    const ys = []
    const xc = []
    const yc = []
    for (const c of commands) {
      xs.push(c.end.x)
      ys.push(c.end.y)
      xs.push(c.start.x)
      ys.push(c.start.y)
      if (c.control) {
        for (const p of c.control) {
          xc.push(p.x)
          yc.push(p.y)
        }
      }
    }
    bbox = {
      minX: Math.min(...xs),
      minY: Math.min(...ys),
      maxX: Math.max(...xs),
      maxY: Math.max(...ys),
    }
    if (xc.length > 0) {
      bboxCtrl = {
        minX: Math.min(bbox.minX, ...xc),
        minY: Math.min(bbox.minY, ...yc),
        maxX: Math.max(bbox.maxX, ...xc),
        maxY: Math.max(bbox.maxY, ...yc),
      }
    } else {
      bboxCtrl = bbox
    }
  }

  // Comprimento aproximado (somatório dos rets em cada segmento; as curvas
  // são aproximadas por uma linha poligonal de 16 amostras).
  let length = 0
  for (let i = 0; i < commands.length; i++) {
    length += segmentLength(commands, i)
  }

  return {
    commands,
    bbox,
    bboxFromControl: bboxCtrl,
    length,
    subpathCount: subpathIndex,
    errors,
    raw: d,
  }
}

function formatNumber(n) {
  if (!Number.isFinite(n)) return String(n)
  const s = n.toFixed(4)
  const cleaned = s.replace(/0+$/, '').replace(/\.$/, '')
  return cleaned === '-0' ? '0' : cleaned
}

function segmentLength(commands, i) {
  const c = commands[i]
  if (c.cmd === 'Z') {
    return Math.hypot(c.end.x - c.start.x, c.end.y - c.start.y)
  }
  if (c.cmd === 'C') {
    return bezierLength(c.start, c.control[0], c.control[1], c.end, 16)
  }
  if (c.cmd === 'Q') {
    return quadBezierLength(c.start, c.control[0], c.end, 16)
  }
  if (c.cmd === 'A' && c.arc) {
    return arcLength(c.arc)
  }
  return Math.hypot(c.end.x - c.start.x, c.end.y - c.start.y)
}

function bezierLength(p0, p1, p2, p3, samples) {
  let len = 0
  let prev = { x: p0.x, y: p0.y }
  for (let i = 1; i <= samples; i++) {
    const t = i / samples
    const u = 1 - t
    const x = u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x
    const y = u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y
    len += Math.hypot(x - prev.x, y - prev.y)
    prev = { x, y }
  }
  return len
}

function quadBezierLength(p0, p1, p2, samples) {
  let len = 0
  let prev = { x: p0.x, y: p0.y }
  for (let i = 1; i <= samples; i++) {
    const t = i / samples
    const u = 1 - t
    const x = u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x
    const y = u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y
    len += Math.hypot(x - prev.x, y - prev.y)
    prev = { x, y }
  }
  return len
}

// Aproximação do comprimento de um arco elíptico (Ramanujan II) × fração
// do ângulo (1 ou 1/2 conforme large-arc).
function arcLength(arc) {
  if (!arc.valid) return 0
  const perimeter = ellipsePerimeter(arc.rx, arc.ry)
  return perimeter * (arc.largeArc ? 1 : 0.5)
}

function ellipsePerimeter(a, b) {
  const a2 = a * a
  const b2 = b * b
  const h = ((a - b) * (a - b)) / ((a + b) * (a + b))
  return Math.PI * (a + b) * (1 + (3 * h) / (10 + Math.sqrt(4 - 3 * h)))
}

// Implementação simplificada da seção F.6.4 da SVG 1.1 para achar o centro
// de um arco a partir dos endpoints, raios, rotação e flags.
function computeArcCenter(start, end, rxIn, ryIn, xRotation, largeArc, sweepFlag) {
  const rx = rxIn
  const ry = ryIn
  if (rx === 0 || ry === 0) {
    return { center: { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 }, valid: false }
  }
  const phi = (xRotation * Math.PI) / 180
  const cosPhi = Math.cos(phi)
  const sinPhi = Math.sin(phi)
  const dx2 = (start.x - end.x) / 2
  const dy2 = (start.y - end.y) / 2
  const x1p = cosPhi * dx2 + sinPhi * dy2
  const y1p = -sinPhi * dx2 + cosPhi * dy2
  const rxSq = rx * rx
  const rySq = ry * ry
  const x1pSq = x1p * x1p
  const y1pSq = y1p * y1p
  const lambda = x1pSq / rxSq + y1pSq / rySq
  if (lambda > 1) {
    // Raios insuficientes para ligar os pontos: a SVG 1.1 manda escalonar
    // rx/ry; sinalizamos como inválido para não mostrar um centro falso.
    return { center: { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 }, valid: false }
  }
  const num = Math.max(0, rxSq * rySq - rxSq * y1pSq - rySq * x1pSq)
  const den = rxSq * y1pSq + rySq * x1pSq
  const sq = den === 0 ? 0 : num / den
  const coef = (largeArc === sweepFlag ? -1 : 1) * Math.sqrt(sq)
  const cxp = (coef * (rx * y1p)) / ry
  const cyp = (coef * -(ry * x1p)) / rx
  const cx = cosPhi * cxp - sinPhi * cyp + (start.x + end.x) / 2
  const cy = sinPhi * cxp + cosPhi * cyp + (start.y + end.y) / 2
  return { center: { x: cx, y: cy }, valid: true }
}

// Auto-viewBox com base no bbox + padding (5%)
export function autoViewBox(bbox, padding = 0.05) {
  const w = bbox.maxX - bbox.minX
  const h = bbox.maxY - bbox.minY
  const padX = w * padding || 1
  const padY = h * padding || 1
  const x = bbox.minX - padX
  const y = bbox.minY - padY
  const width = w + 2 * padX || 2
  const height = h + 2 * padY || 2
  return `${trim(x)} ${trim(y)} ${trim(width)} ${trim(height)}`
}

function trim(n) {
  return parseFloat(n.toFixed(4)).toString()
}

// ─── Exemplos pré-prontos ───────────────────────────────────────────
export const EXAMPLES = [
  {
    key: 'heart',
    label: { pt: 'Coração', en: 'Heart' },
    d: 'M50,80 C50,80 15,55 15,35 C15,20 25,10 38,10 C45,10 50,15 50,15 C50,15 55,10 62,10 C75,10 85,20 85,35 C85,55 50,80 50,80 Z',
  },
  {
    key: 'star',
    label: { pt: 'Estrela (5 pontas)', en: '5-pointed star' },
    d: 'M50,5 L61,38 L96,38 L67,57 L78,90 L50,70 L22,90 L33,57 L4,38 L39,38 Z',
  },
  {
    key: 'triangle',
    label: { pt: 'Triângulo', en: 'Triangle' },
    d: 'M50,10 L90,90 L10,90 Z',
  },
  {
    key: 'infinity',
    label: { pt: 'Loop (8)', en: 'Loop (figure-8)' },
    d: 'M50,30 C50,10 80,10 80,30 C80,50 50,50 50,70 C50,90 20,90 20,70 C20,50 50,50 50,30 Z',
  },
  {
    key: 'wave',
    label: { pt: 'Onda senoidal', en: 'Sine wave' },
    d: 'M5,40 Q22.5,10 40,40 T75,40 T110,40 T145,40',
  },
  {
    key: 'arc',
    label: { pt: 'Meia-lua (Arco A)', en: 'Crescent moon (Arc)' },
    d: 'M50,10 A40,40 0 1,0 50,90 A30,50 0 1,1 50,10 Z',
  },
  {
    key: 'check',
    label: { pt: 'Visto (check)', en: 'Check mark' },
    d: 'M10,50 L40,80 L90,10',
  },
  {
    key: 'leaf',
    label: { pt: 'Folha com curvas Q', en: 'Leaf with Q curves' },
    d: 'M50,10 Q90,50 50,90 Q10,50 50,10 Z',
  },
  {
    key: 'smooth-cubic',
    label: { pt: 'Curva S suave (C+S+S)', en: 'Smooth S (C+S+S)' },
    d: 'M10,80 C10,20 40,20 50,50 C60,80 90,80 90,20',
  },
  {
    key: 'speech-bubble',
    label: { pt: 'Balão de fala', en: 'Speech bubble' },
    d: 'M10,10 L90,10 Q100,10 100,20 L100,60 Q100,70 90,70 L40,70 L25,85 L30,70 L10,70 Q0,70 0,60 L0,20 Q0,10 10,10 Z',
  },
  {
    key: 'rounded-rect',
    label: { pt: 'Retângulo arredondado', en: 'Rounded rectangle' },
    d: 'M20,5 L80,5 Q95,5 95,20 L95,80 Q95,95 80,95 L20,95 Q5,95 5,80 L5,20 Q5,5 20,5 Z',
  },
  {
    key: 'arrow-loop',
    label: { pt: 'Laço duplo', en: 'Double loop' },
    d: 'M50,20 C70,20 70,50 50,50 C30,50 30,20 50,20 Z M50,50 C70,50 70,80 50,80 C30,80 30,50 50,50 Z',
  },
]

// ─── Resumo do comando para a tabela ───────────────────────────────
export function summarize(c, lang = 'en') {
  const r = (n) => formatNumber(n)
  if (c.cmd === 'M') return lang === 'pt' ? `Move a caneta para (${r(c.end.x)}, ${r(c.end.y)})` : `Move pen to (${r(c.end.x)}, ${r(c.end.y)})`
  if (c.cmd === 'L') return lang === 'pt' ? `Linha até (${r(c.end.x)}, ${r(c.end.y)})` : `Draw line to (${r(c.end.x)}, ${r(c.end.y)})`
  if (c.cmd === 'H') return lang === 'pt' ? `Linha horizontal até x=${r(c.end.x)}` : `Draw horizontal line to x=${r(c.end.x)}`
  if (c.cmd === 'V') return lang === 'pt' ? `Linha vertical até y=${r(c.end.y)}` : `Draw vertical line to y=${r(c.end.y)}`
  if (c.cmd === 'C') return lang === 'pt'
    ? `Bézier cúbica via (${r(c.control[0].x)}, ${r(c.control[0].y)}) e (${r(c.control[1].x)}, ${r(c.control[1].y)}) até (${r(c.end.x)}, ${r(c.end.y)})`
    : `Cubic Bézier via (${r(c.control[0].x)}, ${r(c.control[0].y)}) & (${r(c.control[1].x)}, ${r(c.control[1].y)}) to (${r(c.end.x)}, ${r(c.end.y)})`
  if (c.cmd === 'S') return lang === 'pt'
    ? `Bézier cúbica suave com controle (${r(c.control[1].x)}, ${r(c.control[1].y)}) até (${r(c.end.x)}, ${r(c.end.y)}); 1º controle é refletido`
    : `Smooth cubic Bézier with control (${r(c.control[1].x)}, ${r(c.control[1].y)}) to (${r(c.end.x)}, ${r(c.end.y)}); first control is reflected`
  if (c.cmd === 'Q') return lang === 'pt'
    ? `Bézier quadrática via (${r(c.control[0].x)}, ${r(c.control[0].y)}) até (${r(c.end.x)}, ${r(c.end.y)})`
    : `Quadratic Bézier via (${r(c.control[0].x)}, ${r(c.control[0].y)}) to (${r(c.end.x)}, ${r(c.end.y)})`
  if (c.cmd === 'T') return lang === 'pt'
    ? `Quadrática suave até (${r(c.end.x)}, ${r(c.end.y)}); controle é refletido`
    : `Smooth quadratic to (${r(c.end.x)}, ${r(c.end.y)}); control is reflected`
  if (c.cmd === 'A') return lang === 'pt'
    ? `Arco elíptico até (${r(c.end.x)}, ${r(c.end.y)})`
    : `Elliptical arc to (${r(c.end.x)}, ${r(c.end.y)})`
  if (c.cmd === 'Z') return lang === 'pt' ? `Fecha o caminho (volta ao início do subpath)` : `Close path back to start of subpath`
  return c.cmd
}

// ─── Descrição longa de cada comando (pt/en) para o painel de referência ───
export const COMMAND_HELP = {
  M: {
    pt: 'Move a caneta para as coordenadas dadas sem desenhar nada. Cada path começa com um M (ou m). Após um M, pares adicionais de coordenadas são interpretados como L (linhas).',
    en: 'Moves the pen to the given coordinates without drawing. Every path starts with an M (or m). After an M, additional coordinate pairs are interpreted as L (lines).',
  },
  L: {
    pt: 'Desenha uma linha reta do ponto atual até as coordenadas.',
    en: 'Draws a straight line from the current point to the given coordinates.',
  },
  H: {
    pt: 'Linha horizontal até o x dado (mantém o y atual). Útil para economizar bytes em linhas horizontais.',
    en: 'Horizontal line to the given x (keeps current y). Saves bytes on horizontal strokes.',
  },
  V: {
    pt: 'Linha vertical até o y dado (mantém o x atual).',
    en: 'Vertical line to the given y (keeps current x).',
  },
  C: {
    pt: 'Curva de Bézier cúbica: dois pontos de controle e um ponto final. Os pontos de controle "puxam" a curva na direção que apontam, dando controle total sobre o formato.',
    en: 'Cubic Bézier curve: two control points and an end point. The control points "pull" the curve in the direction they indicate, giving full shape control.',
  },
  S: {
    pt: 'Bézier cúbica "suave": o primeiro ponto de controle é refletido do último C/S anterior. Encadeia naturalmente curvas contínuas sem precisar recalcular o ponto.',
    en: 'Smooth cubic Bézier: the first control point is reflected from the previous C/S. Naturally chains continuous curves without recomputing the point.',
  },
  Q: {
    pt: 'Curva de Bézier quadrática: um único ponto de controle e um ponto final. Mais simples que a cúbica, mas menos flexível.',
    en: 'Quadratic Bézier curve: one control point and one end point. Simpler than cubic, but less flexible.',
  },
  T: {
    pt: 'Quadrática "suave": o ponto de controle é refletido do último Q/T anterior.',
    en: 'Smooth quadratic: the control point is reflected from the previous Q/T.',
  },
  A: {
    pt: 'Arco elíptico: raio rx/ry, rotação x-axis-rotation, flags large-arc-flag e sweep-flag, mais o ponto final. Os flags escolhem entre os 4 arcos possíveis.',
    en: 'Elliptical arc: rx/ry radii, x-axis-rotation, large-arc-flag and sweep-flag, plus the end point. The flags choose among the 4 possible arcs.',
  },
  Z: {
    pt: 'Fecha o subpath atual: desenha uma reta até o ponto onde o último M foi dado (ou até o início se for o início do path) e marca o path como fechado (importante para fill em SVG).',
    en: 'Closes the current subpath: draws a straight line to the last M point (or the start, if at the start of the path) and marks the path as closed (important for fill in SVG).',
  },
}