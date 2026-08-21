// Regex Railroad Diagram Generator
// Converts a JavaScript regex pattern to an SVG railroad (syntax) diagram

// Token types for the railroad diagram
const TOKEN_TYPES = {
  LITERAL: 'literal',
  CHAR_CLASS: 'charClass',
  SHORTHAND: 'shorthand',
  ANCHOR_START: 'anchorStart',
  ANCHOR_END: 'anchorEnd',
  ANCHOR_WORD: 'anchorWord',
  ANCHOR_NON_WORD: 'anchorNonWord',
  DOT: 'dot',
  ALTERNATION: 'alternation',
  GROUP_CAPTURE: 'groupCapture',
  GROUP_NON_CAPTURE: 'groupNonCapture',
  GROUP_LOOKAHEAD: 'groupLookahead',
  GROUP_NEG_LOOKAHEAD: 'groupNegLookahead',
  GROUP_LOOKBEHIND: 'groupLookbehind',
  GROUP_NEG_LOOKBEHIND: 'groupNegLookbehind',
  QUANTIFIER: 'quantifier',
  BACKREF: 'backref',
  UNICODE_PROP: 'unicodeProp',
  ESCAPE: 'escape',
  ERROR: 'error',
}

// Parse regex pattern into tokens
export function parseRegex(pattern) {
  const tokens = []
  let i = 0
  let groupNum = 0
  const groupNames = new Map()

  while (i < pattern.length) {
    const c = pattern[i]

    // Escape sequences
    if (c === '\\') {
      if (i + 1 >= pattern.length) {
        tokens.push({ type: TOKEN_TYPES.ERROR, text: '\\', raw: '\\', desc: 'Incomplete escape' })
        i++
        continue
      }
      const next = pattern[i + 1]
      const escapeResult = parseEscape(next, pattern, i)
      if (escapeResult) {
        tokens.push(escapeResult.token)
        i = escapeResult.nextIndex
        continue
      }
      // Unknown escape - treat as literal
      tokens.push({ type: TOKEN_TYPES.LITERAL, text: next, raw: '\\' + next, desc: `Literal "${next}"` })
      i += 2
      continue
    }

    // Character class
    if (c === '[') {
      const classResult = parseCharClass(pattern, i)
      tokens.push(classResult.token)
      i = classResult.nextIndex
      continue
    }

    // Groups
    if (c === '(') {
      const groupResult = parseGroup(pattern, i, groupNum, groupNames)
      if (groupResult.token.type === TOKEN_TYPES.GROUP_CAPTURE) groupNum++
      tokens.push(groupResult.token)
      i = groupResult.nextIndex
      continue
    }

    if (c === ')') {
      tokens.push({ type: TOKEN_TYPES.ERROR, text: ')', raw: ')', desc: 'Unmatched closing parenthesis' })
      i++
      continue
    }

    // Alternation
    if (c === '|') {
      tokens.push({ type: TOKEN_TYPES.ALTERNATION, text: '|', raw: '|', desc: 'Alternation (OR)' })
      i++
      continue
    }

    // Anchors
    if (c === '^') {
      tokens.push({ type: TOKEN_TYPES.ANCHOR_START, text: '^', raw: '^', desc: 'Start of string' })
      i++
      continue
    }
    if (c === '$') {
      tokens.push({ type: TOKEN_TYPES.ANCHOR_END, text: '$', raw: '$', desc: 'End of string' })
      i++
      continue
    }

    // Dot
    if (c === '.') {
      tokens.push({ type: TOKEN_TYPES.DOT, text: '.', raw: '.', desc: 'Any character (except newline)' })
      i++
      continue
    }

    // Quantifiers
    if (isQuantifierStart(c)) {
      const quantResult = parseQuantifier(pattern, i)
      tokens.push(quantResult.token)
      i = quantResult.nextIndex
      continue
    }

    // Regular literal
    tokens.push({ type: TOKEN_TYPES.LITERAL, text: c, raw: c, desc: `Literal "${c}"` })
    i++
  }

  return { tokens, groupCount: groupNum }
}

function parseEscape(c, pattern, startIndex) {
  const escapes = {
    'n': { type: TOKEN_TYPES.ESCAPE, text: '\\n', raw: '\\n', desc: 'Newline (LF)' },
    'r': { type: TOKEN_TYPES.ESCAPE, text: '\\r', raw: '\\r', desc: 'Carriage return (CR)' },
    't': { type: TOKEN_TYPES.ESCAPE, text: '\\t', raw: '\\t', desc: 'Tab' },
    'f': { type: TOKEN_TYPES.ESCAPE, text: '\\f', raw: '\\f', desc: 'Form feed' },
    'v': { type: TOKEN_TYPES.ESCAPE, text: '\\v', raw: '\\v', desc: 'Vertical tab' },
    '0': { type: TOKEN_TYPES.ESCAPE, text: '\\0', raw: '\\0', desc: 'Null character' },
    'c': { type: TOKEN_TYPES.ESCAPE, text: '', raw: '', desc: 'Control char', parseCtrl: true },
    'x': { type: TOKEN_TYPES.ESCAPE, text: '', raw: '', desc: 'Hex char', parseHex: true },
    'u': { type: TOKEN_TYPES.ESCAPE, text: '', raw: '', desc: 'Unicode', parseUni: true },
    'd': { type: TOKEN_TYPES.SHORTHAND, text: '\\d', raw: '\\d', desc: 'Digit (0-9)' },
    'D': { type: TOKEN_TYPES.SHORTHAND, text: '\\D', raw: '\\D', desc: 'Non-digit' },
    'w': { type: TOKEN_TYPES.SHORTHAND, text: '\\w', raw: '\\w', desc: 'Word character' },
    'W': { type: TOKEN_TYPES.SHORTHAND, text: '\\W', raw: '\\W', desc: 'Non-word character' },
    's': { type: TOKEN_TYPES.SHORTHAND, text: '\\s', raw: '\\s', desc: 'Whitespace' },
    'S': { type: TOKEN_TYPES.SHORTHAND, text: '\\S', raw: '\\S', desc: 'Non-whitespace' },
    'b': { type: TOKEN_TYPES.ANCHOR_WORD, text: '\\b', raw: '\\b', desc: 'Word boundary' },
    'B': { type: TOKEN_TYPES.ANCHOR_NON_WORD, text: '\\B', raw: '\\B', desc: 'Non-word boundary' },
  }

  const esc = escapes[c]
  if (!esc) return null

  let nextIndex = startIndex + 2
  let text = esc.text
  let raw = esc.raw
  let desc = esc.desc

  if (esc.parseCtrl) {
    if (startIndex + 2 >= pattern.length) {
      return { token: { type: TOKEN_TYPES.ERROR, text: '\\c', raw: '\\c', desc: 'Incomplete control escape' }, nextIndex: startIndex + 2 }
    }
    const ctrlChar = pattern[startIndex + 2]
    text = `\\c${ctrlChar}`
    raw = `\\c${ctrlChar}`
    desc = `Control character ^${ctrlChar.toUpperCase()}`
    nextIndex = startIndex + 3
  } else if (esc.parseHex) {
    if (startIndex + 3 >= pattern.length) {
      return { token: { type: TOKEN_TYPES.ERROR, text: '\\x', raw: '\\x', desc: 'Incomplete hex escape' }, nextIndex: startIndex + 2 }
    }
    const hex = pattern.slice(startIndex + 2, startIndex + 4)
    if (!/^[0-9a-fA-F]{2}$/.test(hex)) {
      return { token: { type: TOKEN_TYPES.ERROR, text: `\\x${hex}`, raw: `\\x${hex}`, desc: 'Invalid hex escape' }, nextIndex: startIndex + 4 }
    }
    text = `\\x${hex}`
    raw = `\\x${hex}`
    desc = `Hex character 0x${hex}`
    nextIndex = startIndex + 4
  } else if (esc.parseUni) {
    if (startIndex + 2 >= pattern.length) {
      return { token: { type: TOKEN_TYPES.ERROR, text: '\\u', raw: '\\u', desc: 'Incomplete unicode escape' }, nextIndex: startIndex + 2 }
    }
    if (pattern[startIndex + 2] === '{') {
      // \u{...}
      let end = pattern.indexOf('}', startIndex + 3)
      if (end === -1) {
        return { token: { type: TOKEN_TYPES.ERROR, text: '\\u{...', raw: '\\u{...', desc: 'Unclosed unicode escape' }, nextIndex: pattern.length }
      }
      const code = pattern.slice(startIndex + 3, end)
      if (!/^[0-9a-fA-F]{1,6}$/.test(code) || parseInt(code, 16) > 0x10FFFF) {
        return { token: { type: TOKEN_TYPES.ERROR, text: `\\u{${code}}`, raw: `\\u{${code}}`, desc: 'Invalid unicode code point' }, nextIndex: end + 1 }
      }
      text = `\\u{${code}}`
      raw = `\\u{${code}}`
      desc = `Unicode code point U+${parseInt(code, 16).toString(16).toUpperCase().padStart(4, '0')}`
      nextIndex = end + 1
    } else {
      // \uHHHH
      if (startIndex + 5 >= pattern.length) {
        return { token: { type: TOKEN_TYPES.ERROR, text: '\\u', raw: '\\u', desc: 'Incomplete unicode escape' }, nextIndex: startIndex + 2 }
      }
      const hex = pattern.slice(startIndex + 2, startIndex + 6)
      if (!/^[0-9a-fA-F]{4}$/.test(hex)) {
        return { token: { type: TOKEN_TYPES.ERROR, text: `\\u${hex}`, raw: `\\u${hex}`, desc: 'Invalid unicode escape' }, nextIndex: startIndex + 6 }
      }
      text = `\\u${hex}`
      raw = `\\u${hex}`
      desc = `Unicode code point U+${hex.toUpperCase()}`
      nextIndex = startIndex + 6
    }
  }

  return { token: { type: esc.type, text, raw, desc }, nextIndex }
}

function parseCharClass(pattern, startIndex) {
  let i = startIndex + 1
  let negated = false
  const ranges = []
  const singles = []
  let lastChar = null
  let inRange = false

  if (i < pattern.length && pattern[i] === '^') {
    negated = true
    i++
  }
  if (i < pattern.length && pattern[i] === ']') {
    singles.push(']')
    i++
  }

  while (i < pattern.length && pattern[i] !== ']') {
    const c = pattern[i]
    if (c === '\\' && i + 1 < pattern.length) {
      const next = pattern[i + 1]
      if (next === 'b') {
        singles.push('\\b')
        i += 2
        continue
      }
      const escResult = parseEscape(next, pattern, i)
      if (escResult) {
        singles.push(escResult.token.text)
        i = escResult.nextIndex
        continue
      }
      singles.push(next)
      i += 2
      continue
    }
    if (c === '-' && lastChar !== null && i + 1 < pattern.length && pattern[i + 1] !== ']') {
      inRange = true
      i++
      continue
    }
    if (inRange) {
      ranges.push([lastChar, c])
      inRange = false
      lastChar = null
      i++
      continue
    }
    lastChar = c
    i++
  }

  if (inRange && lastChar !== null) {
    singles.push(lastChar)
    singles.push('-')
  } else if (lastChar !== null) {
    singles.push(lastChar)
  }

  const unclosed = i >= pattern.length
  if (!unclosed) i++ // skip closing ]

  const display = `[${negated ? '^' : ''}${formatCharClass(ranges, singles)}]`
  return {
    token: {
      type: TOKEN_TYPES.CHAR_CLASS,
      text: display,
      raw: pattern.slice(startIndex, i),
      desc: negated ? `Character NOT in [${formatCharClass(ranges, singles)}]` : `Character in [${formatCharClass(ranges, singles)}]`,
      negated,
      ranges,
      singles,
      unclosed,
    },
    nextIndex: i,
  }
}

function formatCharClass(ranges, singles) {
  const parts = [...singles]
  for (const [a, b] of ranges) {
    parts.push(`${a}-${b}`)
  }
  return parts.join('')
}

function parseGroup(pattern, startIndex, groupNum, groupNames) {
  let i = startIndex + 1
  if (i >= pattern.length) {
    return { token: { type: TOKEN_TYPES.ERROR, text: '(', raw: '(', desc: 'Unclosed group' }, nextIndex: i }
  }

  const c = pattern[i]

  // Named group (?<name>...)
  if (c === '?' && i + 1 < pattern.length && pattern[i + 1] === '<') {
    let end = pattern.indexOf('>', i + 2)
    if (end === -1) {
      return { token: { type: TOKEN_TYPES.ERROR, text: '(?<...', raw: '(?<...', desc: 'Unclosed named group' }, nextIndex: pattern.length }
    }
    const name = pattern.slice(i + 2, end)
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
      return { token: { type: TOKEN_TYPES.ERROR, text: `(?<${name}>)`, raw: `(?<${name}>)`, desc: 'Invalid group name' }, nextIndex: end + 1 }
    }
    groupNum++
    groupNames.set(groupNum, name)
    return {
      token: {
        type: TOKEN_TYPES.GROUP_CAPTURE,
        text: `(?<${name}>`,
        raw: `(?<${name}>`,
        desc: `Named capturing group "${name}"`,
        name,
        groupNum,
      },
      nextIndex: end + 1,
    }
  }

  // Non-capturing, lookahead, lookbehind (?: ...), (?= ...), (?! ...), (?<= ...), (?<! ...)
  if (c === '?') {
    if (i + 1 < pattern.length) {
      const next = pattern[i + 1]
      if (next === ':') {
        return { token: { type: TOKEN_TYPES.GROUP_NON_CAPTURE, text: '(?:', raw: '(?:', desc: 'Non-capturing group' }, nextIndex: i + 2 }
      }
      if (next === '=') {
        return { token: { type: TOKEN_TYPES.GROUP_LOOKAHEAD, text: '(?=', raw: '(?=', desc: 'Positive lookahead' }, nextIndex: i + 2 }
      }
      if (next === '!') {
        return { token: { type: TOKEN_TYPES.GROUP_NEG_LOOKAHEAD, text: '(?!', raw: '(?!', desc: 'Negative lookahead' }, nextIndex: i + 2 }
      }
      if (next === '<') {
        if (i + 2 < pattern.length) {
          const after = pattern[i + 2]
          if (after === '=') {
            return { token: { type: TOKEN_TYPES.GROUP_LOOKBEHIND, text: '(?<=', raw: '(?<=', desc: 'Positive lookbehind' }, nextIndex: i + 3 }
          }
          if (after === '!') {
            return { token: { type: TOKEN_TYPES.GROUP_NEG_LOOKBEHIND, text: '(?<!', raw: '(?<!', desc: 'Negative lookbehind' }, nextIndex: i + 3 }
          }
        }
      }
      if (next === '#') {
        let end = pattern.indexOf(')', i + 2)
        if (end === -1) {
          return { token: { type: TOKEN_TYPES.ERROR, text: '(?#...', raw: '(?#...', desc: 'Unclosed comment group' }, nextIndex: pattern.length }
        }
        const comment = pattern.slice(i + 2, end)
        return { token: { type: TOKEN_TYPES.GROUP_NON_CAPTURE, text: `(?#${comment})`, raw: `(?#${comment})`, desc: `Comment: ${comment}` }, nextIndex: end + 1 }
      }
    }
  }

  // Regular capturing group
  groupNum++
  return { token: { type: TOKEN_TYPES.GROUP_CAPTURE, text: '(', raw: '(', desc: `Capturing group ${groupNum}`, groupNum }, nextIndex: i }
}

function isQuantifierStart(c) {
  return c === '*' || c === '+' || c === '?' || c === '{'
}

function parseQuantifier(pattern, startIndex) {
  const c = pattern[startIndex]
  let i = startIndex + 1
  let lazy = false
  let possessive = false
  let min, max

  if (c === '*') { min = 0; max = Infinity }
  else if (c === '+') { min = 1; max = Infinity }
  else if (c === '?') { min = 0; max = 1 }
  else if (c === '{') {
    // {n}, {n,}, {n,m}
    let end = pattern.indexOf('}', i)
    if (end === -1) {
      // Treat as literal
      return { token: { type: TOKEN_TYPES.LITERAL, text: '{', raw: '{', desc: 'Literal "{"' }, nextIndex: startIndex + 1 }
    }
    const content = pattern.slice(i, end)
    const parts = content.split(',')
    if (parts.length === 1) {
      const n = parseInt(parts[0], 10)
      if (isNaN(n)) {
        return { token: { type: TOKEN_TYPES.ERROR, text: `{${content}}`, raw: `{${content}}`, desc: 'Invalid quantifier' }, nextIndex: end + 1 }
      }
      min = max = n
    } else if (parts.length === 2) {
      const n = parseInt(parts[0], 10)
      if (isNaN(n)) {
        return { token: { type: TOKEN_TYPES.ERROR, text: `{${content}}`, raw: `{${content}}`, desc: 'Invalid quantifier' }, nextIndex: end + 1 }
      }
      min = n
      if (parts[1] === '') {
        max = Infinity
      } else {
        const m = parseInt(parts[1], 10)
        if (isNaN(m) || m < n) {
          return { token: { type: TOKEN_TYPES.ERROR, text: `{${content}}`, raw: `{${content}}`, desc: 'Invalid quantifier range' }, nextIndex: end + 1 }
        }
        max = m
      }
    } else {
      return { token: { type: TOKEN_TYPES.ERROR, text: `{${content}}`, raw: `{${content}}`, desc: 'Invalid quantifier' }, nextIndex: end + 1 }
    }
    i = end + 1
  } else {
    return { token: { type: TOKEN_TYPES.LITERAL, text: c, raw: c, desc: `Literal "${c}"` }, nextIndex: i }
  }

  // Check for lazy (?), possessive (+)
  if (i < pattern.length) {
    if (pattern[i] === '?') { lazy = true; i++ }
    else if (pattern[i] === '+') { possessive = true; i++ }
  }

  let text = c === '{' ? pattern.slice(startIndex, i - (lazy || possessive ? 1 : 0)) : c
  if (lazy) text += '?'
  if (possessive) text += '+'

  return {
    token: {
      type: TOKEN_TYPES.QUANTIFIER,
      text,
      raw: pattern.slice(startIndex, i),
      desc: formatQuantifierDesc(min, max, lazy, possessive),
      data: { min, max, lazy, possessive },
    },
    nextIndex: i,
  }
}

function formatQuantifierDesc(min, max, lazy, possessive) {
  let base
  if (min === 0 && max === Infinity) base = '0 or more times'
  else if (min === 1 && max === Infinity) base = '1 or more times'
  else if (min === 0 && max === 1) base = 'Optional (0 or 1)'
  else if (max === min) base = `Exactly ${min} times`
  else if (max === Infinity) base = `${min} or more times`
  else base = `${min} to ${max} times`
  if (lazy) base += ' (lazy)'
  if (possessive) base += ' (possessive)'
  return base
}

// Build railroad diagram from tokens
// Returns an AST-like structure representing the diagram
export function buildRailroadAst(tokens) {
  // This builds a simplified AST for railroad diagram rendering
  // Each node: { type: 'sequence' | 'choice' | 'terminal' | 'nonterminal' | 'group', children: [], ... }
  let index = 0
  const groups = []

  function parseSequence(stopAt) {
    const children = []
    while (index < tokens.length) {
      const token = tokens[index]
      if (stopAt && stopAt.includes(token.type)) break

      if (token.type === TOKEN_TYPES.ALTERNATION) {
        // Handled at choice level
        break
      }

      if (token.type === TOKEN_TYPES.GROUP_CAPTURE ||
          token.type === TOKEN_TYPES.GROUP_NON_CAPTURE ||
          token.type === TOKEN_TYPES.GROUP_LOOKAHEAD ||
          token.type === TOKEN_TYPES.GROUP_NEG_LOOKAHEAD ||
          token.type === TOKEN_TYPES.GROUP_LOOKBEHIND ||
          token.type === TOKEN_TYPES.GROUP_NEG_LOOKBEHIND) {
        const groupToken = token
        index++
        const groupChildren = parseSequence([TOKEN_TYPES.GROUP_CAPTURE, TOKEN_TYPES.GROUP_NON_CAPTURE,
          TOKEN_TYPES.GROUP_LOOKAHEAD, TOKEN_TYPES.GROUP_NEG_LOOKAHEAD,
          TOKEN_TYPES.GROUP_LOOKBEHIND, TOKEN_TYPES.GROUP_NEG_LOOKBEHIND])
        // Find matching group end
        groups.push({ token: groupToken, children })
        children.push({ type: 'group', groupToken, children: groupChildren })
        continue
      }

      if (token.type === TOKEN_TYPES.QUANTIFIER) {
        // Quantifier applies to previous element
        if (children.length > 0) {
          const prev = children[children.length - 1]
          prev.quantifier = token
        } else {
          children.push({ type: 'terminal', token })
        }
        index++
        continue
      }

      children.push({ type: 'terminal', token })
      index++
    }
    return children
  }

  function parseChoice() {
    const alternatives = []
    let currentAlt = parseSequence([TOKEN_TYPES.ALTERNATION])
    alternatives.push(currentAlt)

    while (index < tokens.length && tokens[index].type === TOKEN_TYPES.ALTERNATION) {
      index++ // skip |
      currentAlt = parseSequence([TOKEN_TYPES.ALTERNATION])
      alternatives.push(currentAlt)
    }

    if (alternatives.length === 1) {
      return alternatives[0]
    }
    return { type: 'choice', alternatives }
  }

  const ast = parseChoice()
  return { ast, groups }
}

// Generate SVG railroad diagram
export function generateRailroadSvg(tokens, options = {}) {
  const { ast, groups } = buildRailroadAst(tokens)
  const { width = 800, height = 200, fontSize = 14, padding = 20 } = options

  // Simple railroad diagram renderer
  // This is a simplified implementation - a full implementation would be more complex
  const nodeWidth = 100
  const nodeHeight = 40
  const arrowSize = 10
  const spacing = 30

  let x = padding
  let y = padding + nodeHeight
  let maxY = y
  const elements = []

  function drawTerminal(token, cx, cy, w, h) {
    const el = []
    // Rounded rectangle
    el.push(`<rect x="${cx}" y="${cy}" width="${w}" height="${h}" rx="6" ry="6" fill="#f0f5ff" stroke="#1890ff" stroke-width="2"/>`)
    // Text
    const displayText = token.text.length > 20 ? token.text.slice(0, 18) + '…' : token.text
    el.push(`<text x="${cx + w/2}" y="${cy + h/2 + fontSize/3}" text-anchor="middle" font-family="monospace" font-size="${fontSize}" fill="#1d2129">${escapeXml(displayText)}</text>`)
    // Quantifier badge
    if (token.quantifier) {
      const q = token.quantifier
      el.push(`<rect x="${cx + w - 24}" y="${cy - 18}" width="22" height="16" rx="3" ry="3" fill="#eb2f96" stroke="#eb2f96" stroke-width="1"/>`)
      el.push(`<text x="${cx + w - 13}" y="${cy - 6}" text-anchor="middle" font-family="monospace" font-size="10" fill="white">${escapeXml(q.text)}</text>`)
    }
    return { elements: el, width: w, height: h }
  }

  function drawChoice(alternatives, cx, cy) {
    // Draw diamond-like choice
    const altHeight = 60
    const totalHeight = alternatives.length * altHeight
    const startY = cy - totalHeight / 2

    const el = []
    // Choice diamond
    const diamondSize = 20
    el.push(`<path d="M ${cx} ${startY - diamondSize} L ${cx + diamondSize} ${startY} L ${cx} ${startY + totalHeight + diamondSize} L ${cx - diamondSize} ${startY} Z" fill="#fffbe6" stroke="#faad14" stroke-width="2"/>`)

    let altY = startY
    for (let i = 0; i < alternatives.length; i++) {
      const alt = alternatives[i]
      const altEl = drawSequence(alt, cx + diamondSize + spacing, altY + altHeight / 2)
      el.push(...altEl.elements)
      // Connector line
      el.push(`<line x1="${cx}" y1="${altY + altHeight / 2}" x2="${cx + diamondSize}" y2="${altY + altHeight / 2}" stroke="#faad14" stroke-width="2" marker-end="url(#arrow)"/>`)
      altY += altHeight
    }
    return { elements: el, width: diamondSize * 2 + spacing + Math.max(...alternatives.map(a => a.width || 0)), height: totalHeight + diamondSize * 2 }
  }

  function drawSequence(seq, cx, cy) {
    const el = []
    let curX = cx
    let curY = cy
    let maxH = 0

    for (let i = 0; i < seq.length; i++) {
      const node = seq[i]
      if (node.type === 'terminal') {
        const w = Math.max(nodeWidth, fontSize * (node.token.text.length + 2))
        const drawn = drawTerminal(node.token, curX, curY - nodeHeight/2, w, nodeHeight)
        el.push(...drawn.elements)
        if (i < seq.length - 1) {
          // Arrow to next
          el.push(`<line x1="${curX + w}" y1="${curY}" x2="${curX + w + spacing}" y2="${curY}" stroke="#1890ff" stroke-width="2" marker-end="url(#arrow)"/>`)
        }
        curX += w + spacing
        maxH = Math.max(maxH, nodeHeight)
      } else if (node.type === 'group') {
        const groupBox = drawGroup(node, curX, curY)
        el.push(...groupBox.elements)
        if (i < seq.length - 1) {
          el.push(`<line x1="${curX + groupBox.width}" y1="${curY}" x2="${curX + groupBox.width + spacing}" y2="${curY}" stroke="#1890ff" stroke-width="2" marker-end="url(#arrow)"/>`)
        }
        curX += groupBox.width + spacing
        maxH = Math.max(maxH, groupBox.height)
      } else if (node.type === 'choice') {
        const choiceBox = drawChoice(node.alternatives, curX, curY)
        el.push(...choiceBox.elements)
        if (i < seq.length - 1) {
          el.push(`<line x1="${curX + choiceBox.width}" y1="${curY}" x2="${curX + choiceBox.width + spacing}" y2="${curY}" stroke="#1890ff" stroke-width="2" marker-end="url(#arrow)"/>`)
        }
        curX += choiceBox.width + spacing
        maxH = Math.max(maxH, choiceBox.height)
      }
    }

    return { elements: el, width: curX - cx - spacing, height: maxH }
  }

  function drawGroup(node, cx, cy) {
    const { groupToken, children } = node
    const isLookahead = groupToken.type === TOKEN_TYPES.GROUP_LOOKAHEAD || groupToken.type === TOKEN_TYPES.GROUP_NEG_LOOKAHEAD
    const isLookbehind = groupToken.type === TOKEN_TYPES.GROUP_LOOKBEHIND || groupToken.type === TOKEN_TYPES.GROUP_NEG_LOOKBEHIND
    const isNonCapture = groupToken.type === TOKEN_TYPES.GROUP_NON_CAPTURE

    const el = []
    const inner = drawSequence(children, cx + 40, cy)
    const boxWidth = inner.width + 80
    const boxHeight = Math.max(inner.height + 40, 80)

    // Group box
    const strokeColor = isLookahead || isLookbehind ? '#722ed1' : (isNonCapture ? '#52c41a' : '#1890ff')
    const fillColor = isLookahead || isLookbehind ? '#f9f0ff' : (isNonCapture ? '#f6ffed' : '#f0f5ff')

    el.push(`<rect x="${cx}" y="${cy - boxHeight/2}" width="${boxWidth}" height="${boxHeight}" rx="8" ry="8" fill="${fillColor}" stroke="${strokeColor}" stroke-width="2" stroke-dasharray="${isLookahead || isLookbehind ? '5,5' : 'none'}"/>`)
    // Group label
    const label = groupToken.text
    el.push(`<text x="${cx + 10}" y="${cy - boxHeight/2 + 20}" font-family="monospace" font-size="12" fill="${strokeColor}" font-weight="bold">${escapeXml(label)}</text>`)
    // Inner content
    el.push(...inner.elements)

    // Quantifier on group
    if (groupToken.quantifier) {
      const q = groupToken.quantifier
      el.push(`<rect x="${cx + boxWidth - 30}" y="${cy - boxHeight/2 - 22}" width="28" height="18" rx="3" ry="3" fill="#eb2f96" stroke="#eb2f96" stroke-width="1"/>`)
      el.push(`<text x="${cx + boxWidth - 16}" y="${cy - boxHeight/2 - 8}" text-anchor="middle" font-family="monospace" font-size="10" fill="white">${escapeXml(q.text)}</text>`)
    }

    return { elements: el, width: boxWidth, height: boxHeight }
  }

  // Start/end markers
  const startX = padding
  const startY = padding + nodeHeight
  elements.push(`<circle cx="${startX}" cy="${startY}" r="8" fill="#52c41a" stroke="#389e0d" stroke-width="2"/>`)
  elements.push(`<line x1="${startX + 8}" y1="${startY}" x2="${startX + spacing}" y2="${startY}" stroke="#1890ff" stroke-width="2" marker-end="url(#arrow)"/>`)

  const mainSeq = drawSequence(ast, startX + spacing, startY)

  elements.push(...mainSeq.elements)

  const endX = startX + spacing + mainSeq.width + spacing
  elements.push(`<line x1="${endX - spacing}" y1="${startY}" x2="${endX}" y2="${startY}" stroke="#1890ff" stroke-width="2" marker-end="url(#arrow)"/>`)
  elements.push(`<circle cx="${endX + 8}" cy="${startY}" r="8" fill="#ff4d4f" stroke="#cf1322" stroke-width="2"/>`)
  elements.push(`<circle cx="${endX + 8}" cy="${startY}" r="4" fill="white"/>`)

  const totalWidth = endX + 16 + padding
  const totalHeight = Math.max(height, mainSeq.height + padding * 2 + 40)

  // Arrow marker definition
  const defs = `
    <defs>
      <marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
        <path d="M0,0 L0,6 L9,3 z" fill="#1890ff" />
      </marker>
    </defs>
  `

  return `
    <svg width="${totalWidth}" height="${totalHeight}" viewBox="0 0 ${totalWidth} ${totalHeight}" xmlns="http://www.w3.org/2000/svg">
      ${defs}
      <rect width="100%" height="100%" fill="white"/>
      ${elements.join('\n')}
    </svg>
  `
}

function escapeXml(str) {
  return str
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, '&apos;')
}

// Validate regex pattern
export function validateRegex(pattern, flags = '') {
  try {
    new RegExp(pattern, flags)
    return { valid: true }
  } catch (e) {
    return { valid: false, error: e.message }
  }
}

// Presets for the railroad diagram
export const RAILROAD_PRESETS = [
  {
    key: 'isoDate',
    name: 'ISO Date',
    pattern: '^(\\d{4})-(\\d{2})-(\\d{2})$',
    flags: 'm',
    description: 'Matches ISO date format YYYY-MM-DD',
  },
  {
    key: 'email',
    name: 'E-mail',
    pattern: '^[\\w.+-]+@[\\w-]+(?:\\.[\\w-]+)+$',
    flags: 'i',
    description: 'Simple email validation',
  },
  {
    key: 'ipv4',
    name: 'IPv4 Address',
    pattern: '^(?:(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)\\.){3}(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)$',
    flags: 'm',
    description: 'Matches valid IPv4 addresses',
  },
  {
    key: 'hexColor',
    name: 'Hex Color',
    pattern: '^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$',
    flags: 'm',
    description: '3 or 6 digit hex colors',
  },
  {
    key: 'slug',
    name: 'URL Slug',
    pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$',
    flags: 'm',
    description: 'Lowercase alphanumeric with hyphens',
  },
  {
    key: 'password',
    name: 'Strong Password',
    pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[A-Za-z\\d@$!%*?&]{8,}$',
    flags: 'm',
    description: 'Min 8 chars, upper, lower, digit, special',
  },
  {
    key: 'dateTime',
    name: 'ISO 8601 DateTime',
    pattern: '\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(?:\\.\\d+)?(?:Z|[+-]\\d{2}:\\d{2})?',
    flags: 'g',
    description: 'ISO 8601 datetime with timezone',
  },
  {
    key: 'url',
    name: 'URL',
    pattern: '^https?://(?:[\\w-]+\\.)+[\\w-]+(?:/[\\w./?%&=-]*)?$',
    flags: 'i',
    description: 'HTTP/HTTPS URL',
  },
  {
    key: 'quotedString',
    name: 'Quoted String',
    pattern: '"(?:[^"\\\\]|\\\\.)*"',
    flags: 'g',
    description: 'Double-quoted string with escapes',
  },
  {
    key: 'csvField',
    name: 'CSV Field',
    pattern: '(?:[^,\\n\\r"]|"(?:[^"]|"")*")+',
    flags: 'g',
    description: 'CSV field (quoted or unquoted)',
  },
]