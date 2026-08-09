import React, { useMemo, useState } from 'react'
import { Typography, Card, Input, Space, Button, Alert, Tag, message, Descriptions, Switch, Progress } from 'antd'
import { HistoryOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input

// ─── Fonte de verdade dos tipos ─────────────────────────────────────────────
const TYPE_ORDER = ['feat', 'fix', 'perf', 'refactor', 'docs', 'style', 'test', 'build', 'chore']

const TYPE_META = {
  feat: { pt: 'Funcionalidades', en: 'Features', color: 'green' },
  fix: { pt: 'Correções de bugs', en: 'Bug fixes', color: 'volcano' },
  perf: { pt: 'Performance', en: 'Performance', color: 'magenta' },
  refactor: { pt: 'Refatorações', en: 'Refactors', color: 'geekblue' },
  docs: { pt: 'Documentação', en: 'Documentation', color: 'cyan' },
  style: { pt: 'Estilo & formatação', en: 'Style & formatting', color: 'gold' },
  test: { pt: 'Testes', en: 'Tests', color: 'purple' },
  build: { pt: 'Build & CI', en: 'Build & CI', color: 'blue' },
  chore: { pt: 'Tarefas & manutenção', en: 'Chores & maintenance', color: 'default' },
}

// Alias que colapsam num tipo canônico.
const TYPE_ALIAS = {
  ci: 'build',
  deps: 'chore',
  revert: 'chore',
}

// Commit = <hash opcional> tipo(escopo)!: descrição
const COMMIT_RE = /^([a-zA-Z][\w-]*)(?:\(([^)]+)\))?(!)?:\s+(.+)$/
const HASH_PREFIX_RE = /^([0-9a-fA-F]{7,40})(?:\s+|$)/

const SNIPPET = `// parse:  <hash?7-40> tipo(escopo)!: descrição
const COMMIT_RE = /^([a-zA-Z][\\w-]*)(?:\\(([^)]+)\\))?(!)?:\\s+(.+)$/
const HASH_PREFIX_RE = /^([0-9a-fA-F]{7,40})(?:\\s+|$)/

function parseCommit(line) {
  const trimmed = line.trim()
  if (!trimmed) return null
  const h = trimmed.match(HASH_PREFIX_RE)
  const hash = h ? h[1] : ''
  const body = h ? trimmed.slice(h[0].length) : trimmed
  const m = body.match(COMMIT_RE)
  if (!m) return { type: 'other', scope: '', breaking: false, subject: trimmed, hash }
  return {
    type: TYPE_ALIAS[m[1].toLowerCase()] || m[1].toLowerCase(),
    scope: m[2] || '',
    breaking: !!m[3],
    subject: m[4].trim(),
    hash,
  }
}

// buildMarkdown: agrupa por tipo (ordem canônica), cada seção com o
// contador, e um bullet "- **escopo**: assunto (hash curto)" por commit.
function buildMarkdown(groups, keepHash) {
  const out = ['# Changelog', '']
  for (const g of groups) {
    out.push(\`## \${g.label} (\${g.items.length})\`, '')
    for (const c of g.items) {
      let line = '- '
      if (c.scope) line += \`**\${c.scope}**: \`
      line += c.subject
      if (c.breaking) line += ' 💥'
      if (keepHash && c.hash) line += \` (\\\`\${c.hash.slice(0, 7)}\\\`)\`
      out.push(line)
    }
    out.push('')
  }
  return out.join('\\n').trim()
}`

const SAMPLE = `abc1234 feat(auth): adiciona login por sessão
9f2e7d5 feat(api): expõe endpoint de health check
de00adf fix(api): trata timeout do rate limit
3b4c5d6 fix(db): corrige migração duplicada no boot
7a2e1b1 perf(router): memoiza a resolução de rotas
a1b2c3d refactor(db): extrai camada de repositório
8c9e0f1 docs: atualiza README com instruções de deploy
5d6e7f8 test(api): cobre o endpoint de logout
9a0b1c2d chore(deps): sobe eslint pra v9
e1f2a3b4 chore(ci): cacheia node_modules no workflow`

const translations = {
  pt: {
    title: 'Gerador de Changelog',
    intro: (
      <>
        Cola a saída do <Text code>git log</Text> ou de um PR e transforma
        em um changelog Markdown agrupado por tipo — pronto pra colar em
        release notes ou README. Commits que seguem{' '}
        <Text code>conventional commits</Text> são classificados por tipo; os
        demais caem no grupo <Text code>other</Text>. 100% client-side.
      </>
    ),
    placeholder: 'Cole os commits aqui, um por linha:\n\nabc1234 feat(auth): adiciona login por sessão\n9f2e7d5 fix(api): trata timeout do rate limit\nde00ad refactor(db): extrai camada de repositório\ndocs: atualiza README',
    sample: 'Usar exemplo',
    clear: 'Limpar',
    empty: 'Cole uma lista de commits pra começar.',
    resultTitle: 'Markdown gerado',
    copy: 'Copiar',
    copied: 'Copiado!',
    copyError: 'Não foi possível copiar',
    keepHash: 'Incluir hash curto',
    notesTitle: 'Como a classificação funciona',
    notesBody: (
      <>
        Cada linha é lida como <Text code>tipo(escopo)!: descrição</Text> — o
        prefixo de hash (7 a 40 hex, com espaço depois) é ignorado no parse e
        só reaparece como <Text code>(abc1234)</Text> se você deixar a opção
        ligada. O tipo é normalizado (ex.: <Text code>ci</Text> conta como{' '}
        <Text code>build</Text>, <Text code>deps</Text>/<Text code>revert</Text>{' '}
        como <Text code>chore</Text>); um <Text code>!</Text> marca o commit
        como breaking change (💥). Linhas que não casam o formato viram{' '}
        <Text code>other</Text>. Nada sai do navegador.
      </>
    ),
    sourceTitle: 'Algoritmo-fonte',
    breakdown: 'Distribuição por tipo',
    commits: 'Commits',
    breaking: 'Breaking 💥',
    others: 'Outros',
  },
  en: {
    title: 'Changelog Generator',
    intro: (
      <>
        Paste the output of <Text code>git log</Text> or a PR and turn it
        into a Markdown changelog grouped by type — ready for release notes
        or a README. Commits following{' '}
        <Text code>conventional commits</Text> are classified by type; the
        rest fall into <Text code>other</Text>. 100% client-side.
      </>
    ),
    placeholder: 'Paste commits here, one per line:\n\nabc1234 feat(auth): adiciona login por sessão\nfix(api): trata-timeout do rate\nrefactor(db): extrai camada de repositório\ndocs: atualiza README',
    sample: 'Use sample',
    clear: 'Clear',
    empty: 'Paste a list of commits to get started.',
    resultTitle: 'Generated Markdown',
    copy: 'Copy',
    copied: 'Copied!',
    copyError: 'Could not copy',
    keepHash: 'Include short hash',
    notesTitle: 'How classification works',
    notesBody: (
      <>
        Each line is parsed as <Text code>type(scope)!: subject</Text> — a
        leading hash (7–40 hex chars followed by a space) is stripped and
        only reappears as <Text code>(abc1234)</Text> when the option is on.
        Types are normalized (e.g. <Text code>ci</Text> counts as{' '}
        <Text code>build</Text>, <Text code>deps</Text>/<Text code>revert</Text>{' '}
        as <Text code>chore</Text>); a <Text code>!</Text> marks a breaking
        change (💥). Lines that don't match land in <Text code>other</Text>.
        Nothing leaves the browser.
      </>
    ),
    sourceTitle: 'Source algorithm',
    breakdown: 'Breakdown by type',
    commits: 'Commits',
    breaking: 'Breaking 💥',
    others: 'Others',
  },
}

function labelOf(type, lang) {
  const meta = TYPE_META[type]
  return meta ? meta[lang] : type
}

export default function ChangelogGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [input, setInput] = useState('')
  const [keepHash, setKeepHash] = useState(true)
  const [messageApi, messageContextHolder] = message.useMessage()

  const parseCommit = useMemo(
    () => (line) => {
      const trimmed = String(line).trim()
      if (!trimmed) return null
      const h = trimmed.match(HASH_PREFIX_RE)
      const hash = h ? h[1] : ''
      const body = h ? trimmed.slice(h[0].length) : trimmed
      const m = body.match(COMMIT_RE)
      if (!m) return { type: 'other', scope: '', breaking: false, subject: trimmed, hash }
      return {
        type: TYPE_ALIAS[m[1].toLowerCase()] || m[1].toLowerCase(),
        scope: m[2] || '',
        breaking: !!m[3],
        subject: m[4].trim(),
        hash,
      }
    },
    []
  )

  const commits = useMemo(() => {
    if (!input.trim()) return []
    return input
      .split(/\r?\n/)
      .map((l) => parseCommit(l))
      .filter(Boolean)
  }, [input, parseCommit])

  const groups = useMemo(() => {
    const map = {}
    for (const c of commits) {
      const t2 = c.type === 'other' || TYPE_ORDER.includes(c.type) ? c.type : 'other'
      if (!map[t2]) map[t2] = []
      map[t2].push(c)
    }
    const order = [...TYPE_ORDER, 'other']
    return order
      .filter((t2) => map[t2] && map[t2].length)
      .map((t2) => ({ type: t2, label: t2 === 'other' ? t.others : labelOf(t2, lang), items: map[t2] }))
  }, [commits, lang, t])

  const markdown = useMemo(() => {
    if (!groups.length) return ''
    const out = ['# Changelog', '']
    for (const g of groups) {
      out.push(`## ${g.label} (${g.items.length})`, '')
      for (const c of g.items) {
        let line = '- '
        if (c.scope) line += `**${c.scope}**: `
        line += c.subject
        if (c.breaking) line += ' 💥'
        if (keepHash && c.hash) line += ` (\`${c.hash.slice(0, 7)}\`)`
        out.push(line)
      }
      out.push('')
    }
    return out.join('\n').trim()
  }, [groups, keepHash])

  const breakingCount = useMemo(() => commits.filter((c) => c.breaking).length, [commits])
  const otherCount = useMemo(() => commits.filter((c) => c.type === 'other').length, [commits])

  function handleCopy() {
    if (!markdown) return
    navigator.clipboard.writeText(markdown)
    messageApi.success(t.copied)
  }

  const hasOutput = markdown.length > 0

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {messageContextHolder}
      <Title level={2}><HistoryOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card>
        <TextArea
          rows={10}
          placeholder={t.placeholder}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          style={{ fontFamily: 'monospace' }}
        />
        <Space style={{ marginTop: 12 }} wrap>
          <Button onClick={() => setInput(SAMPLE)}>{t.sample}</Button>
          <Button disabled={!input} onClick={() => setInput('')}>{t.clear}</Button>
          <Switch checked={keepHash} onChange={setKeepHash} />
          <Text type="secondary">{t.keepHash}</Text>
        </Space>
      </Card>

      {commits.length > 0 && (
        <>
          <Descriptions size="small" column={3}>
            <Descriptions.Item label={t.commits}>{commits.length}</Descriptions.Item>
            <Descriptions.Item label={t.breaking}>{breakingCount}</Descriptions.Item>
            <Descriptions.Item label={t.others}>{otherCount}</Descriptions.Item>
          </Descriptions>

          <Card size="small" title={t.breakdown}>
            <Space wrap>
              {groups.map((g) => (
                <Tag key={g.type} color={g.type === 'other' ? 'default' : 'blue'}>
                  {g.label}: {g.items.length}
                </Tag>
              ))}
            </Space>
          </Card>
        </>
      )}

      {hasOutput ? (
        <Card
          title={t.resultTitle}
          extra={<Button type="primary" size="small" icon={<CopyOutlined />} onClick={handleCopy}>{t.copy}</Button>}
        >
          <pre style={{ margin: 0, maxHeight: 420, overflow: 'auto' }}>
            <code>{markdown}</code>
          </pre>
        </Card>
      ) : (
        <Alert type="info" showIcon message={t.empty} />
      )}

      <Alert type="info" message={t.notesTitle} description={t.notesBody} showIcon />

      <Card title={t.sourceTitle}>
        <pre style={{ margin: 0, overflowX: 'auto' }}>
          <code>{SNIPPET}</code>
        </pre>
      </Card>
    </Space>
  )
}