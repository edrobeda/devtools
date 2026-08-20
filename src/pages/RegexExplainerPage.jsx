import React, { useMemo, useState } from 'react'
import { Typography, Card, Space, Input, Button, Checkbox, Select, Alert, Collapse, Tag, Row, Col, message } from 'antd'
import { CodeOutlined, CopyOutlined, SafetyOutlined, ReadOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import { parseRegex, findMatches, tryCompile } from '../utils/regexExplainer'

const { Title, Paragraph, Text } = Typography
const { Panel } = Collapse

const FLAG_OPTIONS = ['g', 'i', 'm', 's', 'u', 'y']

const SOURCE_SNIPPET = `// parseia a regex e devolve tokens { type, text, depth, data }
export function parseRegex(pattern) {
  const parts = []
  let depth = 0
  let i = 0
  while (i < pattern.length) {
    const c = pattern[i]
    if (c === '\\\\')      { parts.push(parseEscape(pattern, i));  i = ... }
    else if (c === '[')    { parts.push(parseClass(pattern, i));   i = ... }
    else if (c === '(')    { parts.push(groupOpener(pattern, i));  depth++; }
    else if (c === ')')    { parts.push({ type: 'groupEnd' });     depth--; }
    else if (c === '|')    { parts.push({ type: 'alternation' }); }
    else if (c === '^')    { parts.push(anchor('start')); }
    else if (c === '$')    { parts.push(anchor('end')); }
    else if (c === '.')    { parts.push({ type: 'dot' }); }
    else if (isQuant(c)) {
      const q = parseQuantifier(pattern, i)   // * + ? {n,m}
      if (q && lastIsAtom(parts)) parts.push(q)   // aplica ao átomo anterior
      else parts.push({ type: 'literal', text: c })
    }
    else parts.push({ type: 'literal', text: c })
  }
  return { parts }
}
// cada token vira uma frase em linguagem natural na página (PT/EN)`

const translations = {
  pt: {
    title: 'Regex Explainer',
    intro: (
      <>
        Cola uma expressão regular e recebe a explicação <Text strong>token a
        token</Text> em linguagem natural, com um resumo em texto e um{' '}
        <Text strong>teste ao vivo</Text> com os matches destacados. Parseia o
        dialeto JavaScript (ECMAScript): grupos, lookaheads, classes,
        quantificadores, propriedades Unicode, backreferences. 100% no
        navegador.
      </>
    ),
    patternLabel: 'Padrão',
    patternPlaceholder: 'Digite uma regex, ex: ^(\\d{4})-(\\d{2})-(\\d{2})$',
    flagsLabel: 'Flags',
    flagsHelp: 'g global · i ignora caixa · m multiline · s dotAll · u unicode · y sticky',
    presetsLabel: 'Exemplos prontos',
    copyPattern: 'Copiar padrão',
    copyBreakdown: 'Copiar explicação',
    copied: 'Copiado!',
    emptyPattern: 'Digite um padrão para ver a explicação.',
    summaryTitle: 'Resumo em linguagem natural',
    breakdownTitle: 'Explicação token a token',
    legendTitle: 'Legenda',
    stats: (tokens, groups) => `${tokens} tokens · ${groups} grupo(s) de captura`,
    testTitle: 'Teste ao vivo',
    testPlaceholder: 'Texto de teste — as correspondências aparecem destacadas...',
    matchesTitle: (n) => `Correspondências (${n})`,
    noMatches: 'Nenhuma correspondência encontrada.',
    matchTag: 'match',
    groupTag: 'grupo',
    namedTag: 'grupo nomeado',
    invalidTitle: 'Regex inválida',
    copyAlt: 'Copiar',
    howTitle: 'Como funciona',
    howBody: (
      <>
        O motor percorre o padrão caractere a caractere e divide a expressão
        em <Text strong>tokens</Text>: literais, classes{' '}
        <Text code>[…]</Text>, shorthands (<Text code>\d</Text>,{' '}
        <Text code>\w</Text>…), grupos (capturantes, nomeados, lookaheads,
        lookbehinds), quantificadores (<Text code>*</Text>,{' '}
        <Text code>+</Text>, <Text code>?</Text>, <Text code>{'{n,m}'}</Text>),
        âncoras, alternância e backreferences. Cada token ganha uma cor e uma
        frase em linguagem natural; grupos aninham o texto com indentação. O
        teste ao vivo compila a mesma regex com{' '}
        <Text code>String.matchAll</Text>. Expressões que o navegador não
        aceita são reportadas num alerta (ex.: lookbehind com flag{' '}
        <Text code>u</Text> inválido, ou <Text code>\p{'{...}'}</Text> sem{' '}
        <Text code>u</Text>).
      </>
    ),
    sourceTitle: 'Código-fonte',
    sourceBody: 'Motor 100% client-side em src/utils/regexExplainer.js: parseRegex faz a varredura recursiva (parseEscape, parseClass, parseGroupStart, parseQuantifier), findMatches compila com matchAll e devolve índice/grupos/nomeados, tryCompile valida o padrão isolado.',
    tipTitle: 'Dica',
    tipBody: (
      <>
        O dialeto aqui é o do <Text strong>JavaScript</Text>. Expressões
        perfeitamente válidas em outras engines podem não funcionar (ex.:{' '}
        <Text code>\p{'{L}'}</Text> sem flag <Text code>u</Text>, lookbehind
        sem suporte em engines antigas, <Text code>\d</Text> que não casa só
        com 0–9 quando a flag <Text code>u</Text> está ligada). O alerta de
        regex inválida espelha exatamente o erro do{' '}
        <Text code>new RegExp</Text>.
      </>
    ),
    lit: (s) => `Corresponde ao literal "${s}"`,
    litEscaped: (s) => `Literal escapado — corresponde ao caractere ${s.slice(1)}`,
    dot: 'Qualquer caractere, exceto quebra de linha',
    dotAll: 'Qualquer caractere, inclusive quebra de linha (flag s)',
    sh: (name) => ({
      '\\d': 'Um dígito (0–9)',
      '\\D': 'Qualquer caractere que NÃO é dígito',
      '\\w': 'Caractere de palavra (letras, dígitos e _)',
      '\\W': 'Qualquer caractere que NÃO é de palavra',
      '\\s': 'Espaço em branco (espaço, tab, quebra de linha...)',
      '\\S': 'Qualquer caractere que NÃO é espaço em branco',
    })[name],
    escName: {
      '\\n': 'Quebra de linha (LF)',
      '\\r': 'Retorno de carro (CR)',
      '\\t': 'Tabulação (tab)',
      '\\f': 'Form feed (FF)',
      '\\v': 'Tabulação vertical (VT)',
      '\\a': 'Bell (BEL)',
      '\\e': 'Escape (ESC)',
      '\\0': 'Caractere nulo (NUL)',
    },
    escHex: (v) => `Caractere hexadecimal 0x${v}`,
    escUni4: (v) => `Code point Unicode U+${v.toUpperCase()}`,
    escUniBrace: (v) => `Code point Unicode U+${parseInt(v, 16).toString(16).toUpperCase().padStart(4, '0')}`,
    escCtrl: 'Caractere de controle',
    groupCap: (n) => `Grupo de captura ${n} — a parte que casar fica no grupo ${n}`,
    groupNamed: (name) => `Grupo de captura nomeado "${name}"`,
    groupNoncap: 'Grupo não capturante — agrupa sem guardar a parte',
    groupLookahead: 'Lookahead positivo — exige que o que segue case com o conteúdo',
    groupNegLookahead: 'Lookahead negativo — exige que o que segue NÃO case com o conteúdo',
    groupLookbehind: 'Lookbehind positivo — exige que o que precede case com o conteúdo',
    groupNegLookbehind: 'Lookbehind negativo — exige que o que precede NÃO case com o conteúdo',
    groupComment: 'Comentário (?# ...) — ignorado na busca',
    groupUnknown: 'Sintaxe de grupo não reconhecida no dialeto JS',
    groupEnd: 'Fecha o grupo aberto acima',
    quant: (q) => {
      const d = q.data
      const min = d.min
      const max = d.max
      let base
      if (min === 0 && max === Infinity) base = 'Repete 0 ou mais vezes'
      else if (min === 1 && max === Infinity) base = 'Repete 1 ou mais vezes'
      else if (min === 0 && max === 1) base = 'Opcional — 0 ou 1 vez'
      else if (max === min) base = `Exatamente ${min} vezes`
      else if (max === Infinity) base = `${min} ou mais vezes`
      else base = `Entre ${min} e ${max} vezes`
      if (d.lazy) base += ' — o mínimo de repetições possível (lazy)'
      if (d.possessive) base += ' — sem backtracking (possessive)'
      return base
    },
    anchorStart: 'Âncora: início da string',
    anchorStartM: 'Âncora: início da string (e de cada linha, com flag m)',
    anchorEnd: 'Âncora: fim da string',
    anchorEndM: 'Âncora: fim da string (e de cada linha, com flag m)',
    anchorWord: 'Fronteira de palavra (transição entre letra e não-letra)',
    anchorNonWord: 'Posição que NÃO é fronteira de palavra',
    alternation: 'Alternância — casa o lado esquerdo OU o direito',
    backrefNamed: (name) => `Backreference — repete o que o grupo "${name}" capturou`,
    backrefNum: (num) => `Backreference — repete o que o grupo ${num} capturou`,
    unicodeProp: (name) => `Caractere da propriedade Unicode ${name}`,
    unicodePropNeg: (name) => `Caractere que NÃO é da propriedade Unicode ${name}`,
    error: 'Trecho não reconhecido — confira a sintaxe',
    legend: {
      literal: 'Literal',
      class: 'Classe',
      shorthand: 'Shorthand',
      escape: 'Escape',
      unicodeProp: 'Unicode',
      group: 'Grupo',
      quantifier: 'Quantificador',
      anchor: 'Âncora',
      alternation: 'Alternância',
      dot: 'Ponto',
      backref: 'Backref',
      error: 'Inválido',
    },
    summaryLit: (s) => `literal "${s}"`,
    summaryDot: 'qualquer caractere',
    summarySh: (name) => ({
      '\\d': 'um dígito',
      '\\D': 'um não-dígito',
      '\\w': 'um caractere de palavra',
      '\\W': 'um caractere não-de-palavra',
      '\\s': 'um espaço em branco',
      '\\S': 'um caractere que não é espaço',
    })[name],
    summaryClass: (negated, members) =>
      negated ? `um caractere fora de [${members}]` : `um caractere de [${members}]`,
    summaryAnchor: (kind, m) => {
      if (kind === 'start') return m ? 'início da string ou linha' : 'início da string'
      if (kind === 'end') return m ? 'fim da string ou linha' : 'fim da string'
      if (kind === 'word') return 'fronteira de palavra'
      return 'não-fronteira de palavra'
    },
    summaryGroup: (kind, name) => {
      if (kind === 'capturing') return 'grupo de captura'
      if (kind === 'named') return `grupo nomeado "${name}"`
      if (kind === 'noncapturing') return 'grupo não capturante'
      if (kind === 'lookahead') return 'lookahead positivo'
      if (kind === 'negLookahead') return 'lookahead negativo'
      if (kind === 'lookbehind') return 'lookbehind positivo'
      if (kind === 'negLookbehind') return 'lookbehind negativo'
      return 'comentário'
    },
    summaryQuant: (q) => {
      const { min, max, lazy, possessive } = q.data
      let s
      if (min === 0 && max === Infinity) s = '0+ vezes'
      else if (min === 1 && max === Infinity) s = '1+ vezes'
      else if (min === 0 && max === 1) s = 'opcional'
      else if (max === min) s = `${min} vezes`
      else if (max === Infinity) s = `${min}+ vezes`
      else s = `${min} a ${max} vezes`
      if (lazy) s += ' (mínimo)'
      if (possessive) s += ' (sem backtracking)'
      return s
    },
    summaryAlt: 'OU',
    summaryBackref: (label) => `repetição do que o ${label} capturou`,
    summaryUnicode: (name, negated) => (negated ? `não-${name}` : name),
    summarySep: ', ',
  },
  en: {
    title: 'Regex Explainer',
    intro: (
      <>
        Paste a regular expression and get a <Text strong>token-by-token</Text>{' '}
        explanation in plain language, plus a text summary and a{' '}
        <Text strong>live test</Text> with highlighted matches. Parses the
        JavaScript (ECMAScript) flavor: groups, lookaheads, character classes,
        quantifiers, Unicode properties, backreferences. 100% in the browser.
      </>
    ),
    patternLabel: 'Pattern',
    patternPlaceholder: 'Type a regex, e.g.: ^(\\d{4})-(\\d{2})-(\\d{2})$',
    flagsLabel: 'Flags',
    flagsHelp: 'g global · i ignore case · m multiline · s dotAll · u unicode · y sticky',
    presetsLabel: 'Ready-made examples',
    copyPattern: 'Copy pattern',
    copyBreakdown: 'Copy explanation',
    copied: 'Copied!',
    emptyPattern: 'Type a pattern to see the explanation.',
    summaryTitle: 'Plain-language summary',
    breakdownTitle: 'Token-by-token breakdown',
    legendTitle: 'Legend',
    stats: (tokens, groups) => `${tokens} tokens · ${groups} capturing group(s)`,
    testTitle: 'Live test',
    testPlaceholder: 'Test text — matches are highlighted...',
    matchesTitle: (n) => `Matches (${n})`,
    noMatches: 'No matches found.',
    matchTag: 'match',
    groupTag: 'group',
    namedTag: 'named group',
    invalidTitle: 'Invalid regex',
    copyAlt: 'Copy',
    howTitle: 'How it works',
    howBody: (
      <>
        The engine walks the pattern character by character and splits it into{' '}
        <Text strong>tokens</Text>: literals, character classes{' '}
        <Text code>[…]</Text>, shorthands (<Text code>\d</Text>,{' '}
        <Text code>\w</Text>…), groups (capturing, named, lookaheads,
        lookbehinds), quantifiers (<Text code>*</Text>, <Text code>+</Text>,{' '}
        <Text code>?</Text>, <Text code>{'{n,m}'}</Text>), anchors,
        alternation and backreferences. Each token gets a color and a
        plain-language phrase; nested groups are indented. The live test
        compiles the same regex with <Text code>String.matchAll</Text>.
        Expressions the browser rejects are reported in an alert (e.g. invalid
        lookbehind with the <Text code>u</Text> flag, or{' '}
        <Text code>\p{'{...}'}</Text> without <Text code>u</Text>).
      </>
    ),
    sourceTitle: 'Source code',
    sourceBody: '100% client-side engine in src/utils/regexExplainer.js: parseRegex does the recursive scan (parseEscape, parseClass, parseGroupStart, parseQuantifier), findMatches compiles with matchAll and returns index/groups/named groups, tryCompile validates the pattern alone.',
    tipTitle: 'Tip',
    tipBody: (
      <>
        The flavor here is <Text strong>JavaScript</Text>. Patterns that are
        perfectly valid in other engines may fail (e.g.{' '}
        <Text code>\p{'{L}'}</Text> without the <Text code>u</Text> flag,
        lookbehind unsupported in older engines, or <Text code>\d</Text> only
        matching 0–9 when the <Text code>u</Text> flag is on). The invalid
        regex alert mirrors exactly the <Text code>new RegExp</Text> error.
      </>
    ),
    lit: (s) => `Matches the literal "${s}"`,
    litEscaped: (s) => `Escaped literal — matches the character ${s.slice(1)}`,
    dot: 'Any character except a newline',
    dotAll: 'Any character, including newlines (s flag)',
    sh: (name) => ({
      '\\d': 'A digit (0–9)',
      '\\D': 'Any character that is NOT a digit',
      '\\w': 'A word character (letters, digits and _)',
      '\\W': 'Any character that is NOT a word character',
      '\\s': 'Whitespace (space, tab, newline...)',
      '\\S': 'Any character that is NOT whitespace',
    })[name],
    escName: {
      '\\n': 'Line feed (LF)',
      '\\r': 'Carriage return (CR)',
      '\\t': 'Tab',
      '\\f': 'Form feed (FF)',
      '\\v': 'Vertical tab (VT)',
      '\\a': 'Bell (BEL)',
      '\\e': 'Escape (ESC)',
      '\\0': 'Null character (NUL)',
    },
    escHex: (v) => `Hex character 0x${v}`,
    escUni4: (v) => `Unicode code point U+${v.toUpperCase()}`,
    escUniBrace: (v) => `Unicode code point U+${parseInt(v, 16).toString(16).toUpperCase().padStart(4, '0')}`,
    escCtrl: 'Control character',
    groupCap: (n) => `Capturing group ${n} — the matched part is available as group ${n}`,
    groupNamed: (name) => `Named capturing group "${name}"`,
    groupNoncap: 'Non-capturing group — groups without storing',
    groupLookahead: 'Positive lookahead — requires what follows to match the content',
    groupNegLookahead: 'Negative lookahead — requires what follows NOT to match the content',
    groupLookbehind: 'Positive lookbehind — requires what precedes to match the content',
    groupNegLookbehind: 'Negative lookbehind — requires what precedes NOT to match the content',
    groupComment: 'Comment (?# ...) — ignored while matching',
    groupUnknown: 'Group syntax not recognized in the JS flavor',
    groupEnd: 'Closes the group opened above',
    quant: (q) => {
      const d = q.data
      const min = d.min
      const max = d.max
      let base
      if (min === 0 && max === Infinity) base = 'Repeats 0 or more times'
      else if (min === 1 && max === Infinity) base = 'Repeats 1 or more times'
      else if (min === 0 && max === 1) base = 'Optional — 0 or 1 time'
      else if (max === min) base = `Exactly ${min} times`
      else if (max === Infinity) base = `${min} or more times`
      else base = `Between ${min} and ${max} times`
      if (d.lazy) base += ' — as few repetitions as possible (lazy)'
      if (d.possessive) base += ' — no backtracking (possessive)'
      return base
    },
    anchorStart: 'Anchor: start of the string',
    anchorStartM: 'Anchor: start of the string (and of each line, with m flag)',
    anchorEnd: 'Anchor: end of the string',
    anchorEndM: 'Anchor: end of the string (and of each line, with m flag)',
    anchorWord: 'Word boundary (transition between a word char and a non-word char)',
    anchorNonWord: 'Position that is NOT a word boundary',
    alternation: 'Alternation — matches the left side OR the right side',
    backrefNamed: (name) => `Backreference — repeats what group "${name}" captured`,
    backrefNum: (num) => `Backreference — repeats what group ${num} captured`,
    unicodeProp: (name) => `A character with Unicode property ${name}`,
    unicodePropNeg: (name) => `A character WITHOUT the Unicode property ${name}`,
    error: 'Unrecognized fragment — check the syntax',
    legend: {
      literal: 'Literal',
      class: 'Class',
      shorthand: 'Shorthand',
      escape: 'Escape',
      unicodeProp: 'Unicode',
      group: 'Group',
      quantifier: 'Quantifier',
      anchor: 'Anchor',
      alternation: 'Alternation',
      dot: 'Dot',
      backref: 'Backref',
      error: 'Invalid',
    },
    summaryLit: (s) => `literal "${s}"`,
    summaryDot: 'any character',
    summarySh: (name) => ({
      '\\d': 'a digit',
      '\\D': 'a non-digit',
      '\\w': 'a word character',
      '\\W': 'a non-word character',
      '\\s': 'a whitespace',
      '\\S': 'a non-whitespace character',
    })[name],
    summaryClass: (negated, members) =>
      negated ? `a character outside [${members}]` : `a character from [${members}]`,
    summaryAnchor: (kind, m) => {
      if (kind === 'start') return m ? 'start of string or line' : 'start of string'
      if (kind === 'end') return m ? 'end of string or line' : 'end of string'
      if (kind === 'word') return 'word boundary'
      return 'non-word boundary'
    },
    summaryGroup: (kind, name) => {
      if (kind === 'capturing') return 'capturing group'
      if (kind === 'named') return `named group "${name}"`
      if (kind === 'noncapturing') return 'non-capturing group'
      if (kind === 'lookahead') return 'positive lookahead'
      if (kind === 'negLookahead') return 'negative lookahead'
      if (kind === 'lookbehind') return 'positive lookbehind'
      if (kind === 'negLookbehind') return 'negative lookbehind'
      return 'comment'
    },
    summaryQuant: (q) => {
      const { min, max, lazy, possessive } = q.data
      let s
      if (min === 0 && max === Infinity) s = '0+ times'
      else if (min === 1 && max === Infinity) s = '1+ times'
      else if (min === 0 && max === 1) s = 'optional'
      else if (max === min) s = `${min} times`
      else if (max === Infinity) s = `${min}+ times`
      else s = `${min} to ${max} times`
      if (lazy) s += ' (minimum)'
      if (possessive) s += ' (no backtracking)'
      return s
    },
    summaryAlt: 'OR',
    summaryBackref: (label) => `repeat of what ${label} captured`,
    summaryUnicode: (name, negated) => (negated ? `non-${name}` : name),
    summarySep: ', ',
  },
}

const PART_COLORS = {
  literal: 'blue',
  class: 'green',
  shorthand: 'cyan',
  escape: 'purple',
  unicodeProp: 'cyan',
  group: 'volcano',
  groupEnd: 'default',
  quantifier: 'magenta',
  anchor: 'geekblue',
  alternation: 'gold',
  dot: 'lime',
  backref: 'orange',
  error: 'red',
}

const PRESETS = [
  {
    key: 'isoDate',
    name: 'ISO date',
    pattern: '^(\\d{4})-(\\d{2})-(\\d{2})$',
    flags: ['m'],
    test: '2026-08-20\n2026-08-21\n2026-8-1',
  },
  {
    key: 'email',
    name: 'E-mail',
    pattern: '^[\\w.+-]+@[\\w-]+(?:\\.[\\w-]+)+$',
    flags: ['i'],
    test: 'ana@example.com\njoao@empresa.com.br\ninvalido@',
  },
  {
    key: 'ipv4',
    name: 'IPv4 address',
    pattern: '^(?:(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)\\.){3}(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)$',
    flags: ['m'],
    test: '192.168.0.1\n10.0.0.255\n256.1.1.1',
  },
  {
    key: 'hexColor',
    name: 'Hex color',
    pattern: '^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$',
    flags: ['m'],
    test: '#fff\n#FF8800\n#abc\nred',
  },
  {
    key: 'slug',
    name: 'URL slug',
    pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$',
    flags: ['m'],
    test: 'meu-post-incrivel\nMeu Post!',
  },
  {
    key: 'password',
    name: 'Strong password',
    pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[A-Za-z\\d@$!%*?&]{8,}$',
    flags: ['m'],
    test: 'abc123\nABCdef456\nP@ssw0rdX',
  },
  {
    key: 'dateTime',
    name: 'ISO 8601 datetime',
    pattern: '\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(?:\\.\\d+)?(?:Z|[+-]\\d{2}:\\d{2})?',
    flags: ['g'],
    test: 'Inicio: 2026-08-20T14:30:00Z fim: 2026-08-20T15:00:00-03:00',
  },
]

function classMembers(data) {
  const out = []
  for (const [a, b] of data.ranges) out.push(a === b ? a : `${a}–${b}`)
  for (const s of data.singles) out.push(s)
  for (const s of data.shorthands) out.push(s)
  return out
}

function describePart(p, t, flags, groupNum) {
  const d = p.data || {}
  switch (p.type) {
    case 'literal':
      return d.escaped ? t.litEscaped(p.text) : t.lit(p.text)
    case 'dot':
      return flags.includes('s') ? t.dotAll : t.dot
    case 'shorthand':
      return t.sh(d.name)
    case 'escape':
      if (d.name === '\\xHH') return t.escHex(d.value)
      if (d.name === '\\uHHHH') return t.escUni4(d.value)
      if (d.name === '\\u{...}') return t.escUniBrace(d.value)
      if (d.name === '\\cX') return t.escCtrl
      return t.escName[d.name] || t.error
    case 'unicodeProp': {
      const neg = d.negated ? t.unicodePropNeg(d.name) : t.unicodeProp(d.name)
      return neg + (flags.includes('u') ? '' : ' · requer flag u')
    }
    case 'group':
      if (d.kind === 'capturing') return t.groupCap(groupNum)
      if (d.kind === 'named') return t.groupNamed(d.name)
      if (d.kind === 'noncapturing') return t.groupNoncap
      if (d.kind === 'lookahead') return t.groupLookahead
      if (d.kind === 'negLookahead') return t.groupNegLookahead
      if (d.kind === 'lookbehind') return t.groupLookbehind
      if (d.kind === 'negLookbehind') return t.groupNegLookbehind
      if (d.kind === 'comment') return t.groupComment
      return t.groupUnknown
    case 'groupEnd':
      return t.groupEnd
    case 'quantifier':
      return t.quant(p)
    case 'anchor':
      if (d.kind === 'start') return flags.includes('m') ? t.anchorStartM : t.anchorStart
      if (d.kind === 'end') return flags.includes('m') ? t.anchorEndM : t.anchorEnd
      if (d.kind === 'word') return t.anchorWord
      return t.anchorNonWord
    case 'alternation':
      return t.alternation
    case 'backref':
      if (d.named) return t.backrefNamed(d.name)
      return t.backrefNum(parseInt(d.name.slice(1), 10))
    case 'error':
      return t.error
    default:
      return p.type
  }
}

function buildSummary(parts, t, flags) {
  const frags = []
  for (const p of parts) {
    const d = p.data || {}
    if (p.type === 'quantifier') {
      if (frags.length > 0) frags[frags.length - 1] += ' ' + t.summaryQuant(p)
      continue
    }
    if (p.type === 'groupEnd') continue
    if (p.type === 'group') {
      frags.push(t.summaryGroup(d.kind, d.name))
      continue
    }
    switch (p.type) {
      case 'literal':
        frags.push(t.summaryLit(p.text))
        break
      case 'dot':
        frags.push(t.summaryDot)
        break
      case 'shorthand':
        frags.push(t.summarySh(d.name))
        break
      case 'class':
        frags.push(t.summaryClass(d.negated, classMembers(d).join('') || '∅'))
        break
      case 'anchor':
        frags.push(t.summaryAnchor(d.kind, flags.includes('m')))
        break
      case 'alternation':
        frags.push(t.summaryAlt)
        break
      case 'backref':
        frags.push(t.summaryBackref(d.named ? `"${d.name}"` : `grupo ${parseInt(d.name.slice(1), 10)}`))
        break
      case 'unicodeProp':
        frags.push(t.summaryUnicode(d.name, d.negated))
        break
      case 'error':
        frags.push(t.error)
        break
      default:
        break
    }
  }
  return frags.join(t.summarySep)
}

function plainBreakdown(parts, t, flags) {
  let groupNum = 0
  return parts
    .map((p) => {
      if (p.type === 'group' && (p.data.kind === 'capturing' || p.data.kind === 'named')) groupNum++
      const num = p.type === 'group' && p.data.kind === 'capturing' ? groupNum : null
      return `${'  '.repeat(p.depth)}${p.text || ' '} — ${describePart(p, t, flags, num)}`
    })
    .join('\n')
}

export default function RegexExplainerPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [pattern, setPattern] = useState('^(\\d{4})-(\\d{2})-(\\d{2})$')
  const [flags, setFlags] = useState(['m'])
  const [testText, setTestText] = useState('2026-08-20\n2026-08-21\n2026-8-1')

  const flagStr = flags.join('')

  const { parts } = useMemo(() => parseRegex(pattern), [pattern])

  const compile = useMemo(() => tryCompile(pattern, flagStr), [pattern, flagStr])

  const matches = useMemo(() => {
    const res = findMatches(pattern, flagStr, testText)
    return res
  }, [pattern, flagStr, testText])

  const numbering = useMemo(() => {
    let n = 0
    const map = {}
    parts.forEach((p, i) => {
      if (p.type === 'group' && (p.data.kind === 'capturing' || p.data.kind === 'named')) {
        n++
        map[i] = n
      }
    })
    return { map, total: n }
  }, [parts])

  const summary = useMemo(() => buildSummary(parts, t, flags), [parts, t, flags])

  const highlighted = useMemo(() => {
    if (!testText || matches.error) return null
    if (!matches.matches.length) return testText
    const nodes = []
    let lastIndex = 0
    matches.matches.forEach((m, i) => {
      if (m.index > lastIndex) nodes.push(<span key={`t-${i}`}>{testText.slice(lastIndex, m.index)}</span>)
      nodes.push(
        <mark key={`m-${i}`} style={{ background: '#ffe58f', padding: '0 1px', borderRadius: 2 }}>
          {m.text}
        </mark>
      )
      lastIndex = m.index + m.text.length
    })
    if (lastIndex < testText.length) nodes.push(<span key="tail">{testText.slice(lastIndex)}</span>)
    return nodes
  }, [matches, testText])

  const copy = async (value) => {
    if (!value) return
    try {
      await navigator.clipboard.writeText(value)
      message.success(t.copied)
    } catch {
      // fallback silencioso
    }
  }

  function applyPreset(key) {
    const preset = PRESETS.find((p) => p.key === key)
    if (!preset) return
    setPattern(preset.pattern)
    setFlags(preset.flags)
    setTestText(preset.test)
  }

  const hasParts = pattern.trim().length > 0

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><SafetyOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card title={t.patternLabel}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={14}>
              <Input
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                placeholder={t.patternPlaceholder}
                style={{ fontFamily: 'monospace' }}
                addonBefore="/"
                addonAfter={flagStr || ' '}
              />
            </Col>
            <Col xs={24} md={10}>
              <Select
                style={{ width: '100%' }}
                placeholder={t.presetsLabel}
                allowClear
                onChange={applyPreset}
                options={PRESETS.map((p) => ({ value: p.key, label: p.name }))}
              />
            </Col>
          </Row>
          <Space direction="vertical" size={4}>
            <Text type="secondary">{t.flagsLabel}</Text>
            <Checkbox.Group options={FLAG_OPTIONS} value={flags} onChange={setFlags} />
            <Text type="secondary" style={{ fontSize: 12 }}>{t.flagsHelp}</Text>
          </Space>
          <Space wrap>
            <Button icon={<CopyOutlined />} onClick={() => copy(pattern)} disabled={!pattern}>
              {t.copyPattern}
            </Button>
            <Button icon={<ReadOutlined />} onClick={() => copy(hasParts ? plainBreakdown(parts, t, flags) : '')} disabled={!hasParts}>
              {t.copyBreakdown}
            </Button>
          </Space>
        </Space>
      </Card>

      {compile.error && (
        <Alert type="error" showIcon message={t.invalidTitle} description={compile.error} />
      )}

      {hasParts && !compile.error && (
        <>
          <Card title={t.summaryTitle} extra={<Tag>{t.stats(parts.length, numbering.total)}</Tag>}>
            <Paragraph style={{ marginBottom: 0 }}>{summary}</Paragraph>
          </Card>

          <Card
            title={t.breakdownTitle}
            extra={
              <Space wrap size={4} style={{ maxWidth: 420 }}>
                {Object.entries(PART_COLORS).map(([type, color]) => (
                  <Tag key={type} color={color} style={{ marginInlineEnd: 0 }}>{t.legend[type]}</Tag>
                ))}
              </Space>
            }
          >
            <Space direction="vertical" size={0} style={{ width: '100%' }}>
              {parts.map((p, i) => (
                <div key={i} style={{ marginLeft: p.depth * 20, padding: '2px 0' }}>
                  <Space align="baseline" wrap>
                    <Tag color={PART_COLORS[p.type] || 'default'} style={{ fontFamily: 'monospace' }}>
                      {p.text || ' '}
                    </Tag>
                    <Text type="secondary">
                      {describePart(p, t, flags, numbering.map[i])}
                      {p.unclosed ? ' ⚠' : ''}
                    </Text>
                  </Space>
                </div>
              ))}
            </Space>
          </Card>
        </>
      )}

      {!hasParts && (
        <Alert type="info" showIcon message={t.emptyPattern} />
      )}

      <Card title={t.testTitle}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Input.TextArea
            rows={5}
            value={testText}
            onChange={(e) => setTestText(e.target.value)}
            placeholder={t.testPlaceholder}
            style={{ fontFamily: 'monospace' }}
          />
          {matches.error && (
            <Alert type="error" showIcon message={t.invalidTitle} description={matches.error} />
          )}
          {!matches.error && (
            <>
              <Text strong>{t.matchesTitle(matches.matches.length)}</Text>
              {!matches.matches.length && <Text type="secondary">{t.noMatches}</Text>}
              <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'monospace' }}>
                {highlighted}
              </div>
              {matches.matches.length > 0 && (
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  {matches.matches.map((m, i) => (
                    <div key={i}>
                      <Tag color="gold">{t.matchTag} {i + 1}</Tag>
                      <Text code>{m.text}</Text>
                      <div style={{ marginLeft: 24, marginTop: 4 }}>
                        {m.groups.map((g, gi) => (
                          <div key={gi}>
                            <Text type="secondary">{t.groupTag} {gi + 1}: </Text>
                            <Text code>{g === null ? '—' : g}</Text>
                          </div>
                        ))}
                        {m.named && Object.entries(m.named).map(([k, v]) => (
                          <div key={k}>
                            <Text type="secondary">{t.namedTag} {k}: </Text>
                            <Text code>{v === null ? '—' : v}</Text>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </Space>
              )}
            </>
          )}
        </Space>
      </Card>

      <Alert type="info" message={t.tipTitle} description={t.tipBody} />

      <Collapse>
        <Panel header={t.howTitle} key="how">
          <Paragraph>{t.howBody}</Paragraph>
        </Panel>
        <Panel header={t.sourceTitle} key="source">
          <Paragraph>{t.sourceBody}</Paragraph>
          <pre style={{ background: '#f6f6f6', padding: 12, borderRadius: 8, overflow: 'auto' }}>
            <code>{SOURCE_SNIPPET}</code>
          </pre>
        </Panel>
      </Collapse>
    </Space>
  )
}
