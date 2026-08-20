import React, { useMemo, useState, useRef, useEffect } from 'react'
import { Typography, Card, Space, Input, Button, Checkbox, Select, Alert, Collapse, Tag, Row, Col, message, Tabs, Tooltip } from 'antd'
import { CodeOutlined, CopyOutlined, SafetyOutlined, ReadOutlined, DownloadOutlined, ReloadOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import { parseRegex, generateRailroadSvg, validateRegex, RAILROAD_PRESETS } from '../utils/regexRailroad'

const { Title, Paragraph, Text } = Typography
const { Panel } = Collapse
const { TabPane } = Tabs

const FLAG_OPTIONS = ['g', 'i', 'm', 's', 'u', 'y']

const SOURCE_SNIPPET = `// Simplified railroad diagram generator
// parseRegex: tokenizes regex into structured parts
// buildRailroadAst: builds AST for diagram rendering
// generateRailroadSvg: produces SVG railroad diagram

// The diagram shows regex as a syntax diagram (railroad diagram):
// - Rounded boxes = literals/terminals
// - Diamonds = alternation (choice)
// - Dashed boxes = lookahead/lookbehind
// - Green boxes = non-capturing groups
// - Blue boxes = capturing groups
// - Arrows = flow direction
// - Quantifiers appear as badges on elements`

const translations = {
  pt: {
    title: 'Regex Railroad Diagram',
    intro: (
      <>
        Visualize expressões regulares como <Text strong>diagramas de sintaxe (railroad diagrams)</Text>.
        Diferente da explicação textual, o diagrama mostra o <Text strong>fluxo de controle</Text> da regex:
        caminhos alternativos (|), grupos, quantificadores, lookaheads/lookbehinds.
        Útil para entender regex complexas de relance. 100% no navegador.
      </>
    ),
    patternLabel: 'Padrão',
    patternPlaceholder: 'Digite uma regex, ex: ^(\\d{4})-(\\d{2})-(\\d{2})$',
    flagsLabel: 'Flags',
    flagsHelp: 'g global · i ignora caixa · m multiline · s dotAll · u unicode · y sticky',
    presetsLabel: 'Exemplos prontos',
    copySvg: 'Copiar SVG',
    downloadSvg: 'Baixar SVG',
    copied: 'Copiado!',
    emptyPattern: 'Digite um padrão para ver o diagrama.',
    diagramTitle: 'Diagrama Railroad',
    legendTitle: 'Legenda',
    stats: (tokens, groups) => `${tokens} tokens · ${groups} grupo(s) de captura`,
    testTitle: 'Teste rápido',
    testPlaceholder: 'Texto para testar a regex...',
    matchesTitle: (n) => `Matches (${n})`,
    noMatches: 'Nenhuma correspondência.',
    invalidTitle: 'Regex inválida',
    howTitle: 'Como funciona',
    howBody: (
      <>
        O motor tokeniza a regex (mesmo parser do <Text strong>Regex Explainer</Text>)
        e constrói uma AST simplificada. O renderer SVG desenha:
        <br/>
        <Text strong>Retângulos arredondados</Text> = terminais (literais, classes, shorthands, âncoras, ponto)
        <br/>
        <Text strong>Losangos</Text> = alternância <Text code>|</Text> (escolha entre caminhos)
        <br/>
        <Text strong>Caixas tracejadas roxas</Text> = lookahead/lookbehind (assertions, não consomem)
        <br/>
        <Text strong>Caixas verdes</Text> = grupos não capturantes <Text code>(?:...)</Text>
        <br/>
        <Text strong>Caixas azuis</Text> = grupos capturantes <Text code>(...)</Text> ou <Text code>(?&lt;nome&gt;...)</Text>
        <br/>
        <Text strong>Badges rosas</Text> = quantificadores (<Text code>*</Text>, <Text code>+</Text>, <Text code>?</Text>, <Text code>{n,m}</Text>, lazy/possessive)
        <br/>
        Círculo verde = início, círculo vermelho duplo = fim.
      </>
    ),
    sourceTitle: 'Código-fonte',
    sourceBody: 'Motor em src/utils/regexRailroad.js: parseRegex (tokenização), buildRailroadAst (AST), generateRailroadSvg (render SVG). Reutiliza a mesma lógica de parsing do Regex Explainer.',
    tipTitle: 'Dica',
    tipBody: (
      <>
        O dialeto é <Text strong>JavaScript/ECMAScript</Text>. Alguns recursos (lookbehind,
        propriedades Unicode <Text code>\\p&#123;...&#125;</Text>) exigem a flag <Text code>u</Text>.
        Diagramas muito largos podem exigir scroll horizontal — use o botão "Baixar SVG"
        para salvar em arquivo e visualizar em editor de imagens.
      </>
    ),
    legend: {
      terminal: 'Terminal (literal, classe, shorthand, âncora, ponto)',
      choice: 'Alternância (|) — escolha um caminho',
      groupCapture: 'Grupo capturante ((...) ou (?&lt;nome&gt;...))',
      groupNonCapture: 'Grupo não capturante ((?:...))',
      lookaround: 'Lookahead/lookbehind ((?=...), (?!...), (?<=...), (?<!...))',
      quantifier: 'Quantificador (*, +, ?, {n,m}) — badge rosa no elemento',
      start: 'Início da regex',
      end: 'Fim da regex',
    },
    tokenTypes: {
      literal: 'Literal',
      charClass: 'Classe de caracteres',
      shorthand: 'Shorthand (\\d, \\w, \\s...)',
      anchorStart: 'Início (^)',
      anchorEnd: 'Fim ($)',
      anchorWord: 'Fronteira de palavra (\\b)',
      anchorNonWord: 'Não fronteira (\\B)',
      dot: 'Ponto (.)',
      alternation: 'Alternância (|)',
      groupCapture: 'Grupo capturante',
      groupNonCapture: 'Grupo não capturante',
      groupLookahead: 'Lookahead positivo',
      groupNegLookahead: 'Lookahead negativo',
      groupLookbehind: 'Lookbehind positivo',
      groupNegLookbehind: 'Lookbehind negativo',
      quantifier: 'Quantificador',
      backref: 'Backreference',
      unicodeProp: 'Propriedade Unicode',
      escape: 'Escape',
      error: 'Erro',
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
    title: 'Regex Railroad Diagram',
    intro: (
      <>
        Visualize regular expressions as <Text strong>syntax diagrams (railroad diagrams)</Text>.
        Unlike textual explanation, the diagram shows the regex's <Text strong>control flow</Text>:
        alternative paths (|), groups, quantifiers, lookaheads/lookbehinds.
        Useful for understanding complex regex at a glance. 100% in the browser.
      </>
    ),
    patternLabel: 'Pattern',
    patternPlaceholder: 'Type a regex, e.g.: ^(\\d{4})-(\\d{2})-(\\d{2})$',
    flagsLabel: 'Flags',
    flagsHelp: 'g global · i ignore case · m multiline · s dotAll · u unicode · y sticky',
    presetsLabel: 'Ready-made examples',
    copySvg: 'Copy SVG',
    downloadSvg: 'Download SVG',
    copied: 'Copied!',
    emptyPattern: 'Type a pattern to see the diagram.',
    diagramTitle: 'Railroad Diagram',
    legendTitle: 'Legend',
    stats: (tokens, groups) => `${tokens} tokens · ${groups} capturing group(s)`,
    testTitle: 'Quick test',
    testPlaceholder: 'Text to test the regex...',
    matchesTitle: (n) => `Matches (${n})`,
    noMatches: 'No matches found.',
    invalidTitle: 'Invalid regex',
    howTitle: 'How it works',
    howBody: (
      <>
        The engine tokenizes the regex (same parser as <Text strong>Regex Explainer</Text>)
        and builds a simplified AST. The SVG renderer draws:
        <br/>
        <Text strong>Rounded rectangles</Text> = terminals (literals, classes, shorthands, anchors, dot)
        <br/>
        <Text strong>Diamonds</Text> = alternation <Text code>|</Text> (choice between paths)
        <br/>
        <Text strong>Dashed purple boxes</Text> = lookahead/lookbehind (assertions, zero-width)
        <br/>
        <Text strong>Green boxes</Text> = non-capturing groups <Text code>(?:...)</Text>
        <br/>
        <Text strong>Blue boxes</Text> = capturing groups <Text code>(...)</Text> or <Text code>(?&lt;name&gt;...)</Text>
        <br/>
        <Text strong>Pink badges</Text> = quantifiers (<Text code>*</Text>, <Text code>+</Text>, <Text code>?</Text>, <Text code>{n,m}</Text>, lazy/possessive)
        <br/>
        Green circle = start, red double circle = end.
      </>
    ),
    sourceTitle: 'Source code',
    sourceBody: 'Engine in src/utils/regexRailroad.js: parseRegex (tokenization), buildRailroadAst (AST), generateRailroadSvg (SVG render). Reuses the same parsing logic as Regex Explainer.',
    tipTitle: 'Tip',
    tipBody: (
      <>
        The flavor is <Text strong>JavaScript/ECMAScript</Text>. Some features (lookbehind,
        Unicode properties <Text code>\\p&#123;...&#125;</Text>) require the <Text code>u</Text> flag.
        Very wide diagrams may need horizontal scroll — use "Download SVG" to save
        and view in an image editor.
      </>
    ),
    legend: {
      terminal: 'Terminal (literal, class, shorthand, anchor, dot)',
      choice: 'Alternation (|) — choose a path',
      groupCapture: 'Capturing group ((...) or (?&lt;name&gt;...))',
      groupNonCapture: 'Non-capturing group ((?:...))',
      lookaround: 'Lookahead/lookbehind ((?=...), (?!...), (?<=...), (?<!...))',
      quantifier: 'Quantifier (*, +, ?, {n,m}) — pink badge on element',
      start: 'Start of regex',
      end: 'End of regex',
    },
    tokenTypes: {
      literal: 'Literal',
      charClass: 'Character class',
      shorthand: 'Shorthand (\\d, \\w, \\s...)',
      anchorStart: 'Start (^)',
      anchorEnd: 'End ($)',
      anchorWord: 'Word boundary (\\b)',
      anchorNonWord: 'Non-word boundary (\\B)',
      dot: 'Dot (.)',
      alternation: 'Alternation (|)',
      groupCapture: 'Capturing group',
      groupNonCapture: 'Non-capturing group',
      groupLookahead: 'Positive lookahead',
      groupNegLookahead: 'Negative lookahead',
      groupLookbehind: 'Positive lookbehind',
      groupNegLookbehind: 'Negative lookbehind',
      quantifier: 'Quantifier',
      backref: 'Backreference',
      unicodeProp: 'Unicode property',
      escape: 'Escape',
      error: 'Error',
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

const LEGEND_ITEMS = [
  { key: 'terminal', color: '#1890ff', bg: '#f0f5ff' },
  { key: 'choice', color: '#faad14', bg: '#fffbe6' },
  { key: 'groupCapture', color: '#1890ff', bg: '#f0f5ff' },
  { key: 'groupNonCapture', color: '#52c41a', bg: '#f6ffed' },
  { key: 'lookaround', color: '#722ed1', bg: '#f9f0ff' },
  { key: 'quantifier', color: '#eb2f96', bg: '#fff0f6' },
  { key: 'start', color: '#52c41a', bg: '#f6ffed' },
  { key: 'end', color: '#ff4d4f', bg: '#fff1f0' },
]

function classMembers(data) {
  const out = []
  for (const [a, b] of data.ranges) out.push(a === b ? a : `${a}–${b}`)
  for (const s of data.singles) out.push(s)
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

export default function RegexRailroadPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [pattern, setPattern] = useState('^(\\d{4})-(\\d{2})-(\\d{2})$')
  const [flags, setFlags] = useState(['m'])
  const [testText, setTestText] = useState('2026-08-20\n2026-08-21\n2026-8-1')
  const [activeTab, setActiveTab] = useState('diagram')
  const svgRef = useRef(null)

  const flagStr = flags.join('')

  const { tokens } = useMemo(() => parseRegex(pattern), [pattern])

  const validation = useMemo(() => validateRegex(pattern, flagStr), [pattern, flagStr])

  const matches = useMemo(() => {
    if (!validation.valid || !testText) return { matches: [], error: null }
    try {
      const regex = new RegExp(pattern, flagStr)
      const result = [...testText.matchAll(regex)]
      return { matches: result, error: null }
    } catch (e) {
      return { matches: [], error: e.message }
    }
  }, [pattern, flagStr, testText, validation.valid])

  const numbering = useMemo(() => {
    let n = 0
    const map = {}
    tokens.forEach((p, i) => {
      if (p.type === 'group' && (p.data?.kind === 'capturing' || p.data?.kind === 'named')) {
        n++
        map[i] = n
      }
    })
    return { map, total: n }
  }, [tokens])

  const svgContent = useMemo(() => {
    if (!pattern.trim()) return null
    if (!validation.valid) return null
    return generateRailroadSvg(tokens)
  }, [tokens, pattern, validation.valid])

  const copySvg = async () => {
    if (!svgContent) return
    try {
      await navigator.clipboard.writeText(svgContent)
      message.success(t.copied)
    } catch {
      message.error('Falha ao copiar')
    }
  }

  const downloadSvg = () => {
    if (!svgContent) return
    const blob = new Blob([svgContent], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'regex-railroad.svg'
    a.click()
    URL.revokeObjectURL(url)
  }

  function applyPreset(key) {
    const preset = RAILROAD_PRESETS.find((p) => p.key === key)
    if (!preset) return
    setPattern(preset.pattern)
    setFlags(preset.flags.split(''))
    setTestText('')
  }

  const hasPattern = pattern.trim().length > 0

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
                options={RAILROAD_PRESETS.map((p) => ({ value: p.key, label: p.name }))}
              />
            </Col>
          </Row>
          <Space direction="vertical" size={4}>
            <Text type="secondary">{t.flagsLabel}</Text>
            <Checkbox.Group options={FLAG_OPTIONS} value={flags} onChange={setFlags} />
            <Text type="secondary" style={{ fontSize: 12 }}>{t.flagsHelp}</Text>
          </Space>
          <Space wrap>
            <Button icon={<ReloadOutlined />} onClick={() => { setPattern(''); setFlags(['m']); setTestText(''); }}>
              Limpar
            </Button>
            <Button icon={<CopyOutlined />} onClick={copySvg} disabled={!svgContent}>
              {t.copySvg}
            </Button>
            <Button icon={<DownloadOutlined />} onClick={downloadSvg} disabled={!svgContent}>
              {t.downloadSvg}
            </Button>
          </Space>
        </Space>
      </Card>

      {!validation.valid && hasPattern && (
        <Alert type="error" showIcon message={t.invalidTitle} description={validation.error} />
      )}

      <Tabs activeKey={activeTab} onChange={setActiveTab} style={{ width: '100%' }}>
        <TabPane tab={t.diagramTitle} key="diagram">
          {!hasPattern ? (
            <Alert type="info" showIcon message={t.emptyPattern} />
          ) : !validation.valid ? (
            <Alert type="error" showIcon message={t.invalidTitle} description={validation.error} />
          ) : (
            <Card style={{ overflow: 'auto', minHeight: 300, background: '#fafafa' }}>
              <div ref={svgRef} dangerouslySetInnerHTML={{ __html: svgContent }} />
            </Card>
          )}
        </TabPane>
        <TabPane tab={t.legendTitle} key="legend">
          <Card>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              {LEGEND_ITEMS.map((item) => (
                <Space key={item.key} align="center">
                  <div style={{
                    width: 24, height: 24, borderRadius: 4,
                    background: item.bg, border: `2px solid ${item.color}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {item.key === 'start' && <div style={{ width: 10, height: 10, borderRadius: '50%', background: item.color }} />}
                    {item.key === 'end' && (
                      <>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: item.color }} />
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'white', position: 'absolute' }} />
                      </>
                    )}
                    {item.key === 'choice' && <div style={{ width: 12, height: 12, transform: 'rotate(45deg)', border: `2px solid ${item.color}`, background: 'transparent' }} />}
                    {item.key === 'quantifier' && <Tag color="#eb2f96" style={{ fontSize: 10 }}>?*</Tag>}
                  </div>
                  <Text>{t.legend[item.key]}</Text>
                </Space>
              ))}
            </Space>
          </Card>
        </TabPane>
        <TabPane tab={t.testTitle} key="test">
          <Card>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Input.TextArea
                rows={5}
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                placeholder={t.testPlaceholder}
                style={{ fontFamily: 'monospace' }}
                disabled={!validation.valid}
              />
              {matches.error && (
                <Alert type="error" showIcon message={t.invalidTitle} description={matches.error} />
              )}
              {!matches.error && validation.valid && (
                <>
                  <Text strong>{t.matchesTitle(matches.matches.length)}</Text>
                  {!matches.matches.length && <Text type="secondary">{t.noMatches}</Text>}
                  <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'monospace', maxHeight: 200, overflow: 'auto' }}>
                    {(() => {
                      if (!testText || !matches.matches.length) return testText
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
                    })()}
                  </div>
                  {matches.matches.length > 0 && (
                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                      {matches.matches.map((m, i) => (
                        <div key={i}>
                          <Tag color="gold">{i + 1}</Tag>
                          <Text code>{m.text}</Text>
                          <div style={{ marginLeft: 24, marginTop: 4 }}>
                            {m.groups.map((g, gi) => (
                              <div key={gi}>
                                <Text type="secondary">Group {gi + 1}: </Text>
                                <Text code>{g === null ? '—' : g}</Text>
                              </div>
                            ))}
                            {m.groups && Object.entries(m.groups).map(([k, v]) => (
                              <div key={k}>
                                <Text type="secondary">Named {k}: </Text>
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
        </TabPane>
        <TabPane tab={t.howTitle} key="how">
          <Card>
            <Paragraph>{t.howBody}</Paragraph>
          </Card>
        </TabPane>
        <TabPane tab={t.sourceTitle} key="source">
          <Card>
            <Paragraph>{t.sourceBody}</Paragraph>
            <pre style={{ background: '#f6f6f6', padding: 12, borderRadius: 8, overflow: 'auto' }}>
              <code>{SOURCE_SNIPPET}</code>
            </pre>
          </Card>
        </TabPane>
      </Tabs>

      <Alert type="info" message={t.tipTitle} description={t.tipBody} />
    </Space>
  )
}