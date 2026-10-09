import React, { useMemo, useState, useRef } from 'react'
import { Typography, Card, Space, Input, Button, Alert, Tag, message, Tabs } from 'antd'
import { CopyOutlined, SafetyOutlined, DownloadOutlined, ReloadOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import { parseRegex, generateRailroadSvg, validateRegex, RAILROAD_PRESETS } from '../utils/regexRailroad'
import { findMatches } from '../utils/regexExplainer'
import { DEFAULT_REGEX_PATTERN, DEFAULT_REGEX_FLAGS, DEFAULT_REGEX_TEST_TEXT } from '../utils/regexShared'
import RegexPatternBar from '../components/RegexPatternBar'
import RegexHighlightedMatches from '../components/RegexHighlightedMatches'

const { Title, Paragraph, Text } = Typography
const { TabPane } = Tabs

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
        O motor tokeniza a regex com um parser próprio do dialeto ECMAScript
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
        <Text strong>Badges rosas</Text> = quantificadores (<Text code>*</Text>, <Text code>+</Text>, <Text code>?</Text>, <Text code>{'{n,m}'}</Text>, lazy/possessive)
        <br/>
        Círculo verde = início, círculo vermelho duplo = fim.
      </>
    ),
    sourceTitle: 'Código-fonte',
    sourceBody: 'Motor em src/utils/regexRailroad.js: parseRegex (tokenização própria do dialeto ECMAScript), buildRailroadAst (AST), generateRailroadSvg (render SVG). Este diagrama tem parser próprio, independente do Regex Explainer — as duas páginas só compartilham constantes e helpers genéricos (src/utils/regexShared.js).',
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
        The engine tokenizes the regex with its own ECMAScript parser
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
        <Text strong>Pink badges</Text> = quantifiers (<Text code>*</Text>, <Text code>+</Text>, <Text code>?</Text>, <Text code>{'{n,m}'}</Text>, lazy/possessive)
        <br/>
        Green circle = start, red double circle = end.
      </>
    ),
    sourceTitle: 'Source code',
    sourceBody: 'Engine in src/utils/regexRailroad.js: parseRegex (its own ECMAScript tokenizer), buildRailroadAst (AST), generateRailroadSvg (SVG render). This diagram has its own parser, independent from Regex Explainer — the two pages only share constants and generic helpers (src/utils/regexShared.js).',
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

export default function RegexRailroadPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [pattern, setPattern] = useState(DEFAULT_REGEX_PATTERN)
  const [flags, setFlags] = useState(DEFAULT_REGEX_FLAGS)
  const [testText, setTestText] = useState(DEFAULT_REGEX_TEST_TEXT)
  const [activeTab, setActiveTab] = useState('diagram')
  const svgRef = useRef(null)

  const flagStr = flags.join('')

  const { tokens } = useMemo(() => parseRegex(pattern), [pattern])

  const validation = useMemo(() => validateRegex(pattern, flagStr), [pattern, flagStr])

  const matches = useMemo(
    () => (validation.valid ? findMatches(pattern, flagStr, testText) : { matches: [], error: null }),
    [pattern, flagStr, testText, validation.valid]
  )

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

      <RegexPatternBar
        title={t.patternLabel}
        pattern={pattern}
        onPatternChange={setPattern}
        placeholder={t.patternPlaceholder}
        flagStr={flagStr}
        flags={flags}
        onFlagsChange={setFlags}
        flagsLabel={t.flagsLabel}
        flagsHelp={t.flagsHelp}
        presetsLabel={t.presetsLabel}
        presetOptions={RAILROAD_PRESETS.map((p) => ({ value: p.key, label: p.name }))}
        onPresetChange={applyPreset}
      >
        <Button icon={<ReloadOutlined />} onClick={() => { setPattern(''); setFlags(DEFAULT_REGEX_FLAGS); setTestText(''); }}>
          Limpar
        </Button>
        <Button icon={<CopyOutlined />} onClick={copySvg} disabled={!svgContent}>
          {t.copySvg}
        </Button>
        <Button icon={<DownloadOutlined />} onClick={downloadSvg} disabled={!svgContent}>
          {t.downloadSvg}
        </Button>
      </RegexPatternBar>

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
                    <RegexHighlightedMatches text={testText} matches={matches.matches} />
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
                            {m.named && Object.entries(m.named).map(([k, v]) => (
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