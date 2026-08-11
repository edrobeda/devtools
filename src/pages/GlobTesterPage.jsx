import React, { useMemo, useState } from 'react'
import { Typography, Card, Space, Input, Segmented, Alert, Button, Tag, Collapse, message } from 'antd'
import { SearchOutlined, CopyOutlined, CheckOutlined, ClearOutlined, ThunderboltOutlined, FileDoneOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import { evaluate } from '../utils/globMatcher'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input

// Padrão de exemplo: dialeto .gitignore, com um `!` que FUNCIONA (*.log ->
// !app.log) e um que NÃO funciona (coverage/ -> !coverage/.gitkeep) — o
// segundo só funciona se o diretório também for re-incluído.
const SAMPLE_PATTERNS = `node_modules/
dist/
build/
*.log
!app.log
.env
.env.*
coverage/
!coverage/.gitkeep
src/**/*.test.ts`

const SAMPLE_TREE = `app.log
README.md
package.json
tsconfig.json
vite.config.ts
.env
.env.example
public/favicon.ico
docs/architecture.md
src/api.ts
src/main.tsx
src/utils/format.ts
src/utils/format.test.ts
src/components/Button.tsx
src/components/Button.test.tsx
tests/unit/helpers.test.ts
node_modules/.cache/eslint.json
node_modules/left-pad/index.js
dist/index.html
dist/assets/app.js
build/report.html
coverage/lcov.info
coverage/.gitkeep
npm-debug.log`

// Padrões do GitHub Actions (`paths:`/`files:` usam globs estilo gitignore).
const SAMPLE_PATTERNS_ACTIONS = `src/**
tests/**
**/*.yml
!src/ignored.js
*.md
docs/**/!*.bak
{src,tests}/**/*.test.ts`

// Algoritmo, em resumo legível (o código completo vive em src/utils/globMatcher.js).
const SOURCE_SNIPPET = `// globMatcher.js — matcher de globs estilo .gitignore:
//   1. compileGlob() transcreve cada linha em RegExp:
//      - * -> [^/]*  e  ? -> [^/] (nunca cruzam a barra);
//      - ** como segmento inteiro vira (?:[^/]+/)* (começo/meio) ou
//        (?:/.*)? (fim);
//      - padrão com '/' no meio (ou '/foo' no começo) é ancorado na raiz;
//        sem '/' no meio, ganha o prefixo (?:.*/)? de "qualquer profundidade";
//      - '/' no fim vira "só diretório": casa o diretório e /.* abaixo;
//      - chaves {a,b} são expandidas antes (expandBraces);
//   2. matchFile() aplica a regra do gitignore:
//      - a ÚLTIMA linha que casa decide (a negação ! vira a última);
//      - um '!' NÃO re-inclui arquivo dentro de diretório já excluído:
//        se a própria linha não exclui, varre os diretórios pais e, se um
//        deles estiver excluído, o arquivo continua ignorado;
//      - os padrões que "decidiram" algum resultado alimentam a lista de
//        "sem efeito" (nunca decisivos).`

const translations = {
  pt: {
    title: 'Glob Pattern Tester (gitignore)',
    intro: (
      <>
        Escreve os padrões e confere, arquivo a arquivo, o que casa — no
        dialeto do <Text code>.gitignore</Text>, o mesmo usado por{' '}
        <Text code>.dockerignore</Text>, <Text code>.npmignore</Text>,{' '}
        <Text code>.editorconfig</Text> e pelo <Text code>paths:</Text> do
        GitHub Actions. Cada arquivo mostra qual linha decidiu (a última que
        casa), e os padrões que não tiveram efeito nenhum são sinalizados.
        100% no navegador.
      </>
    ),
    patterns: 'Padrões (um por linha)',
    patternsPlaceholder: `node_modules/\n*.log\n!app.log\nsrc/**/*.test.ts`,
    tree: 'Árvore de arquivos (um caminho por linha)',
    treePlaceholder: `src/api.ts\nsrc/utils/format.ts\nnode_modules/x/index.js`,
    sampleGitignore: 'Gitignore típico',
    sampleActions: 'GitHub Actions paths',
    sampleTree: 'Exemplo',
    clear: 'Limpar',
    statsFiles: 'Arquivos',
    statsIgnored: 'Ignorados',
    statsKept: 'Mantidos',
    statsPatterns: 'Padrões',
    statsNoEffect: 'sem efeito',
    statsInvalid: 'inválidos',
    filterAll: 'Todos',
    filterKept: 'Mantidos',
    filterIgnored: 'Ignorados',
    copyIgnored: 'Copiar ignorados',
    copied: 'Copiado!',
    emptyHint: 'Digite ou cole os padrões e os caminhos acima — o resultado roda na hora.',
    keptTag: 'Mantido',
    ignoredTag: 'Ignorado',
    matchedBy: 'decidido por',
    alertTitle: 'Globs de .gitignore — as pegadinhas',
    alertBody: (
      <>
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          <li>
            <Text code>*</Text> casa qualquer sequência, mas <Text>nunca</Text>{' '}
            cruza a barra <Text code>/</Text> — é o <Text code>**</Text>{' '}
            (segmento inteiro) que cruza diretórios:{' '}
            <Text code>src/**/*.test.ts</Text> pega o arquivo de teste a
            qualquer profundidade dentro de <Text code>src/</Text>.
          </li>
          <li>
            Padrão sem <Text code>/</Text> no meio casa em qualquer
            profundidade (<Text code>*.log</Text> pega{' '}
            <Text code>src/deep/app.log</Text>); com <Text code>/</Text> no
            meio — ou começando com <Text code>/</Text> — é ancorado na raiz
            ({<Text code>build/</Text>} pega <Text code>build/</Text> mas não{' '}
            <Text code>src/build/</Text>).
          </li>
          <li>
            <Text code>/</Text> no final significa "só diretório": exclui o
            diretório e tudo que está dentro — mas um arquivo com o mesmo
            nome (um arquivo chamado <Text code>dist</Text>) continua{' '}
            <Text>fora</Text> do padrão.
          </li>
          <li>
            A última linha que casa decide, e o <Text code>!</Text> nega —{' '}
            <Text>mas não re-inclui dentro de diretório já excluído</Text>.
            No exemplo ao lado, <Text code>!coverage/.gitkeep</Text> não
            surte efeito porque <Text code>coverage/</Text> está excluído; pra
            funcionar, precisa de <Text code>!coverage/</Text> antes (o padrão
            aparece na lista "sem efeito").
          </li>
          <li>
            Classes <Text code>[abc]</Text>/<Text code>[!abc]</Text> e chaves{' '}
            <Text code>{'{a,b}'}</Text> funcionam por segmento; um{' '}
            <Text code>**</Text> que não seja um segmento inteiro (ex.:{' '}
            <Text code>a**b</Text>) vira <Text code>*</Text> normal, como manda
            a spec.
          </li>
        </ul>
      </>
    ),
    sourceTitle: 'Como funciona (algoritmo)',
  },
  en: {
    title: 'Glob Pattern Tester (gitignore)',
    intro: (
      <>
        Write the patterns and check, file by file, what matches — using the{' '}
        <Text code>.gitignore</Text> dialect, the same one used by{' '}
        <Text code>.dockerignore</Text>, <Text code>.npmignore</Text>,{' '}
        <Text code>.editorconfig</Text> and GitHub Actions{' '}
        <Text code>paths:</Text>. Each file shows which line decided (the last
        one that matches), and patterns that had no effect at all are
        flagged. 100% in the browser.
      </>
    ),
    patterns: 'Patterns (one per line)',
    patternsPlaceholder: `node_modules/\n*.log\n!app.log\nsrc/**/*.test.ts`,
    tree: 'File tree (one path per line)',
    treePlaceholder: `src/api.ts\nsrc/utils/format.ts\nnode_modules/x/index.js`,
    sampleGitignore: 'Typical gitignore',
    sampleActions: 'GitHub Actions paths',
    sampleTree: 'Sample',
    clear: 'Clear',
    statsFiles: 'Files',
    statsIgnored: 'Ignored',
    statsKept: 'Kept',
    statsPatterns: 'Patterns',
    statsNoEffect: 'no effect',
    statsInvalid: 'invalid',
    filterAll: 'All',
    filterKept: 'Kept',
    filterIgnored: 'Ignored',
    copyIgnored: 'Copy ignored',
    copied: 'Copied!',
    emptyHint: 'Type or paste the patterns and the paths above — results run live.',
    keptTag: 'Kept',
    ignoredTag: 'Ignored',
    matchedBy: 'decided by',
    alertTitle: '.gitignore globs — the gotchas',
    alertBody: (
      <>
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          <li>
            <Text code>*</Text> matches any sequence but{' '}
            <Text>never</Text> crosses the slash <Text code>/</Text> — it's{' '}
            <Text code>**</Text> (a full segment) that crosses directories:{' '}
            <Text code>src/**/*.test.ts</Text> catches the test file at any
            depth inside <Text code>src/</Text>.
          </li>
          <li>
            A pattern with no <Text code>/</Text> in the middle matches at any
            depth (<Text code>*.log</Text> catches{' '}
            <Text code>src/deep/app.log</Text>); with <Text code>/</Text> in
            the middle — or starting with <Text code>/</Text> — it is anchored
            to the root ({<Text code>build/</Text>} matches{' '}
            <Text code>build/</Text> but not <Text code>src/build/</Text>).
          </li>
          <li>
            A trailing <Text code>/</Text> means "directory only": it excludes
            the directory and everything inside it — but a file named like the
            directory (a file called <Text code>dist</Text>) stays{' '}
            <Text>out</Text> of the pattern.
          </li>
          <li>
            The last matching line wins, and <Text code>!</Text> negates —{' '}
            <Text>but it cannot re-include inside an already-excluded
            directory</Text>. In the sample,{' '}
            <Text code>!coverage/.gitkeep</Text> has no effect because{' '}
            <Text code>coverage/</Text> is excluded; to make it work you need{' '}
            <Text code>!coverage/</Text> first (the pattern shows up in the
            "no effect" list).
          </li>
          <li>
            Character classes <Text code>[abc]</Text>/<Text code>[!abc]</Text>{' '}
            and braces <Text code>{'{a,b}'}</Text> work per segment; a{' '}
            <Text code>**</Text> that isn't a full segment (e.g.{' '}
            <Text code>a**b</Text>) behaves like <Text code>*</Text>, per the
            spec.
          </li>
        </ul>
      </>
    ),
    sourceTitle: 'Under the hood (algorithm)',
  },
}

export default function GlobTesterPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [messageApi, messageContextHolder] = message.useMessage()
  const [patterns, setPatterns] = useState(SAMPLE_PATTERNS)
  const [tree, setTree] = useState(SAMPLE_TREE)
  const [filter, setFilter] = useState('all')
  const [copied, setCopied] = useState(false)

  const report = useMemo(
    () => evaluate(tree.split('\n'), patterns.split('\n')),
    [patterns, tree],
  )

  const filtered = report.results.filter((r) => {
    if (filter === 'kept') return !r.ignored
    if (filter === 'ignored') return r.ignored
    return true
  })

  function copyIgnored() {
    const list = report.results
      .filter((r) => r.ignored)
      .map((r) => r.path)
      .join('\n')
    if (!list) return
    navigator.clipboard
      .writeText(list)
      .then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      })
      .catch(() => messageApi.warning(t.emptyHint))
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {messageContextHolder}
      <Title level={2}><SearchOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card title={t.patterns}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <TextArea
            rows={5}
            value={patterns}
            onChange={(e) => setPatterns(e.target.value)}
            placeholder={t.patternsPlaceholder}
            spellCheck={false}
            style={{ fontFamily: 'monospace', fontSize: 13 }}
          />
          <Space wrap>
            <Button size="small" icon={<ThunderboltOutlined />} onClick={() => setPatterns(SAMPLE_PATTERNS)}>
              {t.sampleGitignore}
            </Button>
            <Button size="small" icon={<FileDoneOutlined />} onClick={() => setPatterns(SAMPLE_PATTERNS_ACTIONS)}>
              {t.sampleActions}
            </Button>
            <Button size="small" danger icon={<ClearOutlined />} disabled={!patterns} onClick={() => setPatterns('')}>
              {t.clear}
            </Button>
          </Space>
        </Space>
      </Card>

      <Card title={t.tree}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <TextArea
            rows={8}
            value={tree}
            onChange={(e) => setTree(e.target.value)}
            placeholder={t.treePlaceholder}
            spellCheck={false}
            style={{ fontFamily: 'monospace', fontSize: 13 }}
          />
          <Space wrap>
            <Button size="small" icon={<ThunderboltOutlined />} onClick={() => setTree(SAMPLE_TREE)}>
              {t.sampleTree}
            </Button>
            <Button size="small" danger icon={<ClearOutlined />} disabled={!tree} onClick={() => setTree('')}>
              {t.clear}
            </Button>
          </Space>
        </Space>
      </Card>

      <Card
        title={
          <Space size={12} wrap>
            <span>{t.statsFiles}: <Tag color="blue">{report.fileCount}</Tag></span>
            <span>{t.statsIgnored}: <Tag color="red">{report.ignoredCount}</Tag></span>
            <span>{t.statsKept}: <Tag color="green">{report.keptCount}</Tag></span>
            <span>
              {t.statsPatterns}: <Tag color="purple">{report.usedIndexes.length + report.unusedIndexes.length}</Tag>
            </span>
            {report.unusedIndexes.length > 0 && (
              <Tag color="orange" style={{ maxWidth: 420, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                {t.statsNoEffect}: {report.unusedIndexes.map((i) => report.patterns[i].raw).join(', ')}
              </Tag>
            )}
            {report.invalidCount > 0 && (
              <Tag color="red">{t.statsInvalid}: {report.invalidCount}</Tag>
            )}
          </Space>
        }
        extra={
          report.ignoredCount > 0 && (
            <Button
              size="small"
              icon={copied ? <CheckOutlined /> : <CopyOutlined />}
              onClick={copyIgnored}
            >
              {copied ? t.copied : t.copyIgnored}
            </Button>
          )
        }
      >
        {report.results.length === 0 ? (
          <Text type="secondary">{t.emptyHint}</Text>
        ) : (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Segmented
              value={filter}
              onChange={setFilter}
              options={[
                { label: `${t.filterAll} (${report.results.length})`, value: 'all' },
                { label: `${t.filterKept} (${report.keptCount})`, value: 'kept' },
                { label: `${t.filterIgnored} (${report.ignoredCount})`, value: 'ignored' },
              ]}
            />
            <div style={{ maxHeight: 360, overflowY: 'auto', width: '100%' }}>
              {filtered.map((r) => (
                <div
                  key={r.path}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '4px 8px',
                    borderRadius: 6,
                    background: r.ignored ? 'rgba(255, 77, 79, 0.06)' : 'transparent',
                    flexWrap: 'wrap',
                  }}
                >
                  <Tag color={r.ignored ? 'red' : 'green'} style={{ margin: 0 }}>
                    {r.ignored ? t.ignoredTag : t.keptTag}
                  </Tag>
                  <Text code style={{ fontSize: 12.5, wordBreak: 'break-all' }}>{r.path}</Text>
                  {r.ignored && r.pattern !== null && (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {t.matchedBy} <Text code style={{ fontSize: 11.5 }}>{report.patterns[r.pattern].raw}</Text>
                    </Text>
                  )}
                </div>
              ))}
            </div>
          </Space>
        )}
      </Card>

      <Alert type="info" showIcon message={t.alertTitle} description={t.alertBody} />

      <Collapse
        items={[
          {
            key: 'src',
            label: t.sourceTitle,
            children: <pre style={{ margin: 0, fontSize: 12.5, lineHeight: 1.6, background: '#f5f5f5', padding: 12, borderRadius: 6, overflowX: 'auto' }}>{SOURCE_SNIPPET}</pre>,
          },
        ]}
      />
    </Space>
  )
}