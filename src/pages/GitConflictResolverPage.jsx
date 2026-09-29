import React, { useCallback, useMemo, useState } from 'react'
import {
  Typography,
  Card,
  Input,
  Space,
  Row,
  Col,
  Tag,
  Alert,
  Button,
  Segmented,
  Table,
  Collapse,
  message,
} from 'antd'
import { MergeCellsOutlined, CopyOutlined, DownloadOutlined, ThunderboltOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input

const START_RE = /^<{7}[ \t]*(.*)$/
const BASE_RE = /^\|{7}[ \t]*(.*)$/
const SEP_RE = /^={7}[ \t]*$/
const END_RE = /^>{7}[ \t]*(.*)$/

// Walks the file once, collecting every "<<<<<<< ... >>>>>>>" region into a
// block. A block keeps the untouched text that came before it (head) so the
// output can be rebuilt by concatenation. Blocks without a closing ">>>>>>>"
// are flagged as malformed and swallowed to the end of the file.
function parseConflicts(text) {
  const lines = text.split('\n').map((l) => (l.endsWith('\r') ? l.slice(0, -1) : l))
  const blocks = []
  let cursor = 0
  let i = 0

  while (i < lines.length) {
    if (!START_RE.test(lines[i])) {
      i += 1
      continue
    }

    const start = i
    const startLabel = lines[i].match(START_RE)[1].trim()
    let ours = []
    let base = []
    let theirs = []
    let phase = 'ours'
    let hasSeparator = false
    let end = -1
    let endLabel = ''
    let j = i + 1

    while (j < lines.length) {
      const line = lines[j]
      if (BASE_RE.test(line)) {
        phase = 'base'
        j += 1
        continue
      }
      if (SEP_RE.test(line)) {
        phase = 'theirs'
        hasSeparator = true
        j += 1
        continue
      }
      const endMatch = line.match(END_RE)
      if (endMatch) {
        end = j
        endLabel = endMatch[1].trim()
        break
      }
      if (phase === 'ours') ours.push(line)
      else if (phase === 'base') base.push(line)
      else theirs.push(line)
      j += 1
    }

    const common = {
      start,
      ours,
      base,
      theirs,
      hasBase: base.length > 0,
      hasSeparator,
      startLabel,
      endLabel,
      oursLabel: startLabel,
      theirsLabel: endLabel,
    }

    if (end === -1) {
      blocks.push({
        ...common,
        malformed: true,
        end: lines.length,
        head: lines.slice(cursor, start),
        raw: lines.slice(start),
      })
      cursor = lines.length
      break
    }

    blocks.push({
      ...common,
      malformed: false,
      end,
      head: lines.slice(cursor, start),
      raw: lines.slice(start, end + 1),
    })
    cursor = end + 1
    i = end + 1
  }

  return { lines, blocks, tail: lines.slice(cursor) }
}

const SAMPLE = [
  'export function formatPrice(value, currency = "BRL") {',
  '<<<<<<< HEAD',
  '  const formatted = value.toFixed(2)',
  '  return `${currency} ${formatted}`',
  '||||||| merged common ancestors',
  '  return currency + " " + value.toFixed(2)',
  '=======',
  '  return new Intl.NumberFormat("pt-BR", {',
  '    style: "currency",',
  '    currency,',
  '  }).format(value)',
  '>>>>>>> feature/intl-prices',
  '}',
  '',
  'const total = formatPrice(1234.5)',
  '<<<<<<< HEAD',
  'console.log("total:", total)',
  '=======',
  'console.log(`total = ${total}`)',
  '>>>>>>> feature/intl-prices',
  '',
].join('\n')

const SIDE_COLORS = {
  base: { background: 'rgba(128, 128, 128, 0.12)', border: '#8c8c8c', labelKey: 'base' },
  ours: { background: 'rgba(22, 119, 255, 0.12)', border: '#1677ff', labelKey: 'ours' },
  theirs: { background: 'rgba(82, 196, 26, 0.14)', border: '#52c41a', labelKey: 'theirs' },
}

function SideBlock({ side, lines, label, picked, onPick, t }) {
  const color = SIDE_COLORS[side]
  return (
    <Col xs={24} md={8}>
      <div
        style={{
          border: `1px solid ${picked ? color.border : '#f0f0f0'}`,
          borderTop: `3px solid ${picked ? color.border : '#d9d9d9'}`,
          background: picked ? color.background : 'transparent',
          borderRadius: 6,
          height: '100%',
        }}
      >
        <div style={{ padding: '4px 8px', borderBottom: '1px solid #f0f0f0' }}>
          <Text strong style={{ fontSize: 12 }}>{label}</Text>
          <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
            {lines.length} {lines.length === 1 ? t.line : t.lines}
          </Text>
          {!picked && onPick && (
            <Button size="small" type="link" style={{ float: 'right', padding: 0 }} onClick={onPick}>
              {t.use}
            </Button>
          )}
        </div>
        <pre
          style={{
            margin: 0,
            padding: 8,
            minHeight: 40,
            maxHeight: 220,
            overflow: 'auto',
            fontFamily: 'monospace',
            fontSize: 12,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {lines.length === 0 ? ' ' : lines.join('\n')}
        </pre>
      </div>
    </Col>
  )
}

const translations = {
  pt: {
    title: 'Resolvedor de Conflitos de Merge',
    intro: 'Cole um arquivo com marcadores de conflito do Git e resolva bloco por bloco: veja o lado de cada branch, escolha o que fica (HEAD, incoming, os dois ou uma versão manual), copie o arquivo resolvido e baixe. 100% no navegador — o código nunca sai daqui.',
    input: 'Arquivo com conflito',
    inputHint: 'Cole o conteúdo do arquivo exatamente como o git deixou, com os marcadores <<<<<<<, ======= e >>>>>>>. O formato diff3 (com a linha |||||||) também é reconhecido.',
    placeholder: 'Cole aqui o arquivo com marcadores de conflito...',
    loadSample: 'Carregar exemplo',
    clear: 'Limpar',
    conflictsFound: 'conflito(s) encontrado(s)',
    noConflicts: 'Nenhum marcador de conflito encontrado — o texto abaixo sai como está, sem alterações.',
    references: 'Marcadores e comandos do Git',
    markers: 'O que cada marcador significa',
    markerDesc: 'Na maioria das vezes a ordem é HEAD (sua branch) primeiro, e o lado que está sendo mergeado depois. Se você colou o arquivo na ordem inversa, é só inverter as escolhas.',
    commands: 'Comandos úteis do terminal',
    resolved: 'Resolvido',
    unresolved: 'não resolvido(s)',
    ours: 'HEAD',
    theirs: 'incoming',
    both: 'ambos',
    base: 'base',
    manual: 'manual',
    lines: 'linhas',
    line: 'linha',
    use: 'usar',
    conflictAt: 'linhas',
    malformedTag: 'marcadores incompletos',
    noSeparatorTag: 'sem =======',
    colMarker: 'marcador',
    colCommand: 'comando',
    select: 'Escolha o que fica neste conflito',
    editManual: 'Editar manualmente',
    bulk: 'Decidir todos de uma vez',
    keepAllOurs: 'Manter tudo do HEAD',
    keepAllTheirs: 'Manter tudo do incoming',
    keepAllBase: 'Manter a base (diff3)',
    resetChoices: 'Limpar decisões',
    result: 'Arquivo resolvido',
    resultHint: 'O arquivo final sai em ordem: é só salvar por cima do original e finalizar com git add + commit (ou git rebase --continue).',
    stillUnresolved: 'Ainda há conflito(s) sem escolha. Eles foram mantidos com os marcadores originais — resolva todos antes de commitar.',
    malformed: 'Marcadores incompletos: um <<<<<<< não tem >>>>>>> correspondente. O trecho foi mantido intacto.',
    noSeparator: 'Falta a linha ======= separando os dois lados — o lado do incoming foi considerado vazio.',
    copied: 'Arquivo resolvido copiado!',
    downloadName: 'resolved.txt',
    download: 'Baixar arquivo',
    copy: 'Copiar',
    empty: 'A saída aparece aqui depois que você colar um arquivo com conflitos.',
  },
  en: {
    title: 'Git Merge Conflict Resolver',
    intro: 'Paste a file with Git conflict markers and resolve it block by block: see each side of the branch, pick what stays (HEAD, incoming, both or a manual version), then copy or download the resolved file. 100% in the browser — the code never leaves here.',
    input: 'File with conflicts',
    inputHint: 'Paste the file content exactly as git left it, with the <<<<<<<, ======= and >>>>>>> markers. The diff3 format (with the ||||||| line) is recognized too.',
    placeholder: 'Paste the file with conflict markers here...',
    loadSample: 'Load sample',
    clear: 'Clear',
    conflictsFound: 'conflict(s) found',
    noConflicts: 'No conflict markers found — the text below is returned as is, unchanged.',
    references: 'Git markers and commands',
    markers: 'What each marker means',
    markerDesc: 'Most of the time the order is HEAD (your branch) first and the side being merged in after it. If you pasted the file in the opposite order, just flip the choices.',
    commands: 'Useful terminal commands',
    resolved: 'resolved',
    unresolved: 'unresolved',
    ours: 'HEAD',
    theirs: 'incoming',
    both: 'both',
    base: 'base',
    manual: 'manual',
    lines: 'lines',
    line: 'line',
    use: 'use',
    conflictAt: 'lines',
    malformedTag: 'incomplete markers',
    noSeparatorTag: 'no =======',
    colMarker: 'marker',
    colCommand: 'command',
    select: 'Pick what stays in this conflict',
    editManual: 'Edit manually',
    bulk: 'Decide all at once',
    keepAllOurs: 'Keep all from HEAD',
    keepAllTheirs: 'Keep all from incoming',
    keepAllBase: 'Keep the base (diff3)',
    resetChoices: 'Clear choices',
    result: 'Resolved file',
    resultHint: 'The final file comes out in order: just save it over the original and finish with git add + commit (or git rebase --continue).',
    stillUnresolved: 'There are still conflict(s) with no choice. They were kept with the original markers — resolve all of them before committing.',
    malformed: 'Incomplete markers: a <<<<<<< has no matching >>>>>>>. The section was kept untouched.',
    noSeparator: 'The ======= line separating both sides is missing — the incoming side was treated as empty.',
    copied: 'Resolved file copied!',
    downloadName: 'resolved.txt',
    download: 'Download file',
    copy: 'Copy',
    empty: 'The output shows up here once you paste a file with conflicts.',
  },
}

const GIT_COMMANDS = [
  { cmd: 'git status', what: { pt: 'mostra quais arquivos ainda estão em conflito', en: 'shows which files are still conflicted' } },
  { cmd: 'git diff', what: { pt: 'mostra o conflito com contexto (basta o diff normal, sem diff3)', en: 'shows the conflict with context (plain diff, no diff3)' } },
  { cmd: 'git diff --check', what: { pt: 'acha marcadores de conflito que sobraram por engano', en: 'finds conflict markers left behind by accident' } },
  { cmd: 'git checkout --ours arquivo', what: { pt: 'descarta a versão do outro lado e fica com a sua', en: 'drops the other side and keeps yours' } },
  { cmd: 'git checkout --theirs arquivo', what: { pt: 'fica com a versão que está sendo mergeada', en: 'keeps the version being merged in' } },
  { cmd: 'git mergetool arquivo', what: { pt: 'abre o editor de merge configurado no git', en: 'opens the merge editor configured in git' } },
  { cmd: 'git checkout -m arquivo', what: { pt: 're-faz o conflito sem descartar nada, útil pra replays', en: 're-creates the conflict without discarding, useful for replays' } },
]

export default function GitConflictResolverPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [text, setText] = useState('')
  const [choices, setChoices] = useState({})
  const [manuals, setManuals] = useState({})

  const { blocks, tail } = useMemo(() => parseConflicts(text), [text])

  const choose = useCallback((index, value) => {
    setChoices((prev) => ({ ...prev, [index]: value }))
    if (value === 'manual') {
      setManuals((prev) => {
        if (prev[index] !== undefined) return prev
        const block = blocks[index]
        return { ...prev, [index]: block ? block.ours.join('\n') : '' }
      })
    }
  }, [blocks])

  const setAll = useCallback((value) => {
    setChoices(Object.fromEntries(blocks.map((_, i) => [i, value])))
  }, [blocks])

  const resetChoices = useCallback(() => {
    setChoices({})
    setManuals({})
  }, [])

  const loadSample = useCallback(() => {
    setText(SAMPLE)
    setChoices({})
    setManuals({})
  }, [])

  const clearAll = useCallback(() => {
    setText('')
    setChoices({})
    setManuals({})
  }, [])

  const result = useMemo(() => {
    const segments = []
    const stats = { ours: 0, theirs: 0, both: 0, base: 0, manual: 0, unresolved: 0, malformed: 0 }

    blocks.forEach((block, i) => {
      segments.push(block.head)
      if (block.malformed) {
        stats.unresolved += 1
        stats.malformed += 1
        segments.push(block.raw)
        return
      }
      const choice = choices[i]
      if (choice === 'ours') {
        stats.ours += 1
        segments.push(block.ours)
      } else if (choice === 'theirs') {
        stats.theirs += 1
        segments.push(block.theirs)
      } else if (choice === 'both') {
        stats.both += 1
        segments.push([...block.ours, ...block.theirs])
      } else if (choice === 'base' && block.hasBase) {
        stats.base += 1
        segments.push(block.base)
      } else if (choice === 'manual') {
        stats.manual += 1
        segments.push(String(manuals[i] ?? '').split('\n'))
      } else {
        stats.unresolved += 1
        segments.push(block.raw)
      }
    })
    segments.push(tail)

    return { output: segments.flat().join('\n'), stats }
  }, [blocks, tail, choices, manuals])

  const copyOutput = useCallback(() => {
    navigator.clipboard.writeText(result.output)
    message.success(t.copied)
  }, [result.output, t.copied])

  const downloadOutput = useCallback(() => {
    const blob = new Blob([result.output], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = t.downloadName
    a.click()
    URL.revokeObjectURL(url)
  }, [result.output, t.downloadName])

  const markerRows = useMemo(
    () => [
      { key: 'start', marker: '<<<<<<< HEAD', meaning: { pt: 'começa o conflito; depois do nome vem o label do lado esquerdo (a sua branch, HEAD).', en: 'conflict starts; the trailing name is the label of the left side (your branch, HEAD).' } },
      { key: 'base', marker: '||||||| ...ancestors', meaning: { pt: 'só aparece no formato diff3 (git merge --diff3): é a versão comum ancestral da qual os dois lados partiram.', en: 'only shows in diff3 format (git merge --diff3): the common ancestral version both sides came from.' } },
      { key: 'sep', marker: '=======', meaning: { pt: 'separa o lado esquerdo do lado direito. Todo conflito tem essa linha.', en: 'separates the left side from the right side. Every conflict has this line.' } },
      { key: 'end', marker: '>>>>>>> branch', meaning: { pt: 'fecha o conflito; o nome é o label do lado direito (a branch que está sendo mergeada).', en: 'closes the conflict; the name is the label of the right side (the branch being merged in).' } },
    ],
    []
  )

  const commandRows = useMemo(
    () => GIT_COMMANDS.map((c) => ({ key: c.cmd, cmd: c.cmd, what: c.what[lang] })),
    [lang]
  )

  const hasText = text.trim() !== ''

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><MergeCellsOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card
        title={t.input}
        extra={
          <Space>
            <Button size="small" icon={<ThunderboltOutlined />} onClick={loadSample}>{t.loadSample}</Button>
            <Button size="small" onClick={clearAll}>{t.clear}</Button>
          </Space>
        }
      >
        <Paragraph type="secondary" style={{ marginTop: 0 }}>{t.inputHint}</Paragraph>
        <TextArea
          rows={10}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t.placeholder}
          style={{ fontFamily: 'monospace', fontSize: 13 }}
        />
      </Card>

      {!hasText ? (
        <Alert type="info" showIcon message={t.empty} />
      ) : (
        <>
          <Space wrap>
            <Tag color={blocks.length > 0 ? 'processing' : 'default'}>
              {blocks.length} {t.conflictsFound}
            </Tag>
            <Tag color={result.stats.unresolved === 0 ? 'success' : 'error'}>
              {result.stats.unresolved === 0 ? t.resolved : `${result.stats.unresolved} ${t.unresolved}`}
            </Tag>
            {result.stats.ours > 0 && <Tag color="blue">{t.ours}: {result.stats.ours}</Tag>}
            {result.stats.theirs > 0 && <Tag color="green">{t.theirs}: {result.stats.theirs}</Tag>}
            {result.stats.both > 0 && <Tag color="cyan">{t.both}: {result.stats.both}</Tag>}
            {result.stats.base > 0 && <Tag>{t.base}: {result.stats.base}</Tag>}
            {result.stats.manual > 0 && <Tag color="purple">{t.manual}: {result.stats.manual}</Tag>}
          </Space>

          {blocks.length === 0 && <Alert type="success" showIcon message={t.noConflicts} />}

          {blocks.length > 0 && (
            <Card
              title={t.bulk}
              size="small"
              extra={
                <Space wrap>
                  <Button size="small" onClick={() => setAll('ours')}>{t.keepAllOurs}</Button>
                  <Button size="small" onClick={() => setAll('theirs')}>{t.keepAllTheirs}</Button>
                  {blocks.some((b) => b.hasBase) && (
                    <Button size="small" onClick={() => setAll('base')}>{t.keepAllBase}</Button>
                  )}
                  <Button size="small" onClick={resetChoices}>{t.resetChoices}</Button>
                </Space>
              }
            >
              <Text type="secondary">
                {t.markerDesc}
              </Text>
            </Card>
          )}

          {blocks.map((block, i) => {
            const choice = choices[i] || null
            const options = [
              { label: t.ours, value: 'ours' },
              { label: t.theirs, value: 'theirs' },
              { label: `${t.both}`, value: 'both' },
            ]
            if (block.hasBase) options.splice(2, 0, { label: t.base, value: 'base' })
            options.push({ label: t.editManual, value: 'manual' })

            return (
              <Card
                key={i}
                size="small"
                title={
                  <Space wrap>
                    <Text strong>#{i + 1}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {t.conflictAt} {block.start + 1}–{block.end + 1}
                    </Text>
                    {choice === null ? (
                      <Tag color="error">{t.unresolved}</Tag>
                    ) : (
                      <Tag color="success">{t.resolved}</Tag>
                    )}
                    {block.malformed && <Tag color="volcano">{t.malformedTag}</Tag>}
                    {!block.malformed && !block.hasSeparator && <Tag color="orange">{t.noSeparatorTag}</Tag>}
                  </Space>
                }
              >
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  {block.malformed ? (
                    <Alert type="error" showIcon message={t.malformed} />
                  ) : (
                    <Row gutter={[8, 8]}>
                      {block.hasBase && (
                        <SideBlock
                          side="base"
                          lines={block.base}
                          label={t.base}
                          picked={choice === 'base'}
                          onPick={() => choose(i, 'base')}
                          t={t}
                        />
                      )}
                      <SideBlock
                        side="ours"
                        lines={block.ours}
                        label={`${t.ours}${block.oursLabel && block.oursLabel !== 'HEAD' ? ` (${block.oursLabel})` : ''}`}
                        picked={choice === 'ours'}
                        onPick={() => choose(i, 'ours')}
                        t={t}
                      />
                      <SideBlock
                        side="theirs"
                        lines={block.theirs}
                        label={`${t.theirs}${block.theirsLabel ? ` (${block.theirsLabel})` : ''}`}
                        picked={choice === 'theirs'}
                        onPick={() => choose(i, 'theirs')}
                        t={t}
                      />
                    </Row>
                  )}

                  <div>
                    <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                      {t.select}
                    </Text>
                    <Segmented
                      value={choice}
                      onChange={(value) => choose(i, value)}
                      options={options}
                    />
                  </div>

                  {choice === 'manual' && (
                    <div>
                      <TextArea
                        rows={Math.min(12, Math.max(3, (manuals[i] ?? '').split('\n').length))}
                        value={manuals[i] ?? ''}
                        onChange={(e) => setManuals((prev) => ({ ...prev, [i]: e.target.value }))}
                        style={{ fontFamily: 'monospace', fontSize: 13 }}
                      />
                    </div>
                  )}
                </Space>
              </Card>
            )
          })}

          <Card
            title={t.result}
            extra={
              <Space>
                <Button size="small" icon={<CopyOutlined />} onClick={copyOutput}>{t.copy}</Button>
                <Button size="small" icon={<DownloadOutlined />} onClick={downloadOutput}>{t.download}</Button>
              </Space>
            }
          >
            <Paragraph type="secondary" style={{ marginTop: 0 }}>{t.resultHint}</Paragraph>
            {result.stats.unresolved > 0 && <Alert type="warning" showIcon message={t.stillUnresolved} style={{ marginBottom: 12 }} />}
            <pre
              style={{
                margin: 0,
                maxHeight: 420,
                overflow: 'auto',
                fontFamily: 'monospace',
                fontSize: 13,
                background: '#fafafa',
                padding: 12,
                borderRadius: 6,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {result.output === '' ? ' ' : result.output}
            </pre>
          </Card>
        </>
      )}

      <Collapse
        items={[
          {
            key: 'markers',
            label: t.markers,
            children: (
              <Table
                size="small"
                pagination={false}
                rowKey="key"
                dataSource={markerRows}
                columns={[
                  {
                    title: t.colMarker,
                    dataIndex: 'marker',
                    render: (v) => <Text code>{v}</Text>,
                  },
                  { title: '', dataIndex: 'meaning', render: (v) => v[lang] },
                ]}
              />
            ),
          },
          {
            key: 'commands',
            label: t.commands,
            children: (
              <Table
                size="small"
                pagination={false}
                rowKey="key"
                dataSource={commandRows}
                columns={[
                  { title: t.colCommand, dataIndex: 'cmd', render: (v) => <Text code>{v}</Text> },
                  { title: '', dataIndex: 'what' },
                ]}
              />
            ),
          },
        ]}
      />
    </Space>
  )
}
