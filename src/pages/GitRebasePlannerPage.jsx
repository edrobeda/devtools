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
  Select,
  Table,
  Collapse,
  Statistic,
  message,
} from 'antd'
import {
  OrderedListOutlined,
  CopyOutlined,
  DownloadOutlined,
  ThunderboltOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  DeleteOutlined,
  PlusOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import engineSource from '../utils/gitRebasePlanner.js?raw'
import {
  parseTodo,
  moveRow,
  autosquash,
  buildGroups,
  summarize,
  validate,
  buildTodoFile,
  TODO_ACTIONS,
} from '../utils/gitRebasePlanner'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input

const SAMPLE = [
  'a1b2c3d feat(checkout): add coupon field to order summary',
  'b2c3d4e fix(cart): handle empty cart without crashing',
  'c3d4e5f refactor(cart): extract calculateTotals()',
  'd4e5f6a test(cart): cover the coupon calculation',
  'e5f6a7b fixup! refactor(cart): extract calculateTotals()',
  'f6a7b8c fix(cart): round the discount down to cents',
  'a7b8c9d chore: bump dependencies',
  'b8c9d0e WIP experiment on the new totals',
  'c9d0e1f style: rename the helper',
].join('\n')

const ACTION_COLORS = {
  pick: 'default',
  reword: 'blue',
  edit: 'purple',
  squash: 'green',
  fixup: 'cyan',
  drop: 'red',
}

const ACTION_OPTIONS = TODO_ACTIONS.map((action) => ({ value: action, label: action }))

const EMPTY_PLAN = { rows: [], stats: { comments: 0, blanks: 0, unknown: 0, unknownSamples: [], format: 'empty', withAction: 0, bare: 0 } }

const TODO_COMMANDS = [
  { cmd: 'pick', what: { pt: 'aplica o commit. É a linha que o git escreve sozinho.', en: 'applies the commit. This is the line git writes by itself.' } },
  { cmd: 'reword', what: { pt: 'aplica o commit e abre o editor pra você reescrever a mensagem.', en: 'applies the commit and opens the editor to rewrite the message.' } },
  { cmd: 'edit', what: { pt: 'aplica o commit e para o rebase ali, pra você mexer no código e dar git rebase --continue.', en: 'applies the commit and stops the rebase there so you can change the code and run git rebase --continue.' } },
  { cmd: 'squash', what: { pt: 'aplica o commit e junta no anterior, abrindo o editor com as duas mensagens.', en: 'applies the commit and merges it into the previous one, opening the editor with both messages.' } },
  { cmd: 'fixup', what: { pt: 'igual ao squash, mas descarta a mensagem deste commit (só o conteúdo entra).', en: 'like squash, but this commit message is thrown away (only the content goes in).' } },
  { cmd: 'drop', what: { pt: 'remove o commit do histórico. A linha pode simplesmente ser apagada.', en: 'removes the commit from the history. The line can simply be deleted.' } },
  { cmd: 'exec', what: { pt: 'roda um comando do shell entre dois commits — o lugar classic de rodar os testes a cada passo.', en: 'runs a shell command between two commits — the classic place to run the tests at every step.' } },
  { cmd: 'break', what: { pt: 'para o rebase ali; você continua depois com git rebase --continue.', en: 'stops the rebase there; you continue later with git rebase --continue.' } },
  { cmd: 'label / reset', what: { pt: 'guarda um nome pra posição atual e volta pra ele — Together com exec, serve pra simular etapas.', en: 'stores a name for the current position and jumps back to it — together with exec it simulates steps.' } },
  { cmd: 'merge', what: { pt: 'cria um commit de merge, normalmente com -C pra reaproveitar a mensagem do merge original.', en: 'creates a merge commit, usually with -C to reuse the original merge message.' } },
]

const USEFUL_COMMANDS = [
  { cmd: 'git rebase -i HEAD~7', what: { pt: 'abre o editor com os 7 últimos commits.', en: 'opens the editor with the last 7 commits.' } },
  { cmd: 'git rebase -i --autosquash HEAD~7', what: { pt: 'o mesmo, mas já aplica o autosquash antes de abrir o editor.', en: 'same, but it already applies autosquash before opening the editor.' } },
  { cmd: 'git rebase -i --root', what: { pt: 'inclui todos os commits da branch, até o primeiro (cuidado se a branch já foi publicada).', en: 'includes every commit of the branch, down to the first one (be careful if the branch was already published).' } },
  { cmd: 'git rebase -i --keep-empty', what: { pt: 'mantém no plano os commits que ficaram vazios depois do squash.', en: 'keeps in the plan the commits that became empty after a squash.' } },
  { cmd: 'git rebase --onto main topic~3 topic', what: { pt: 'tira da topic os commits depois de topic~3 e reaplica em cima de main.', en: 'takes the topic commits after topic~3 and replays them on top of main.' } },
  { cmd: 'git rebase --exec "npm test" -i HEAD~7', what: { pt: 'adiciona uma linha exec npm test depois de cada commit.', en: 'adds an exec npm test line after every commit.' } },
  { cmd: "GIT_SEQUENCE_EDITOR='cp todo.txt' git rebase -i HEAD~7", what: { pt: 'pula o editor e usa o arquivo que você gerou aqui.', en: 'skips the editor and uses the file you generated here.' } },
  { cmd: "GIT_EDITOR=true git rebase -i HEAD~7", what: { pt: 'pula só o editor de mensagem — útil quando você já escreveu o arquivo todo à mão.', en: 'skips only the message editor — handy when you already wrote the whole file by hand.' } },
  { cmd: 'git commit --fixup=<sha>', what: { pt: 'cria um commit com mensagem fixup! <sha> — é o que o botão do PR faz e o que o --autosquash consome.', en: 'creates a commit with the message fixup! <sha> — what the PR button does and what --autosquash consumes.' } },
  { cmd: 'git rebase --continue', what: { pt: 'depois de resolver um conflito ou amendar num edit/break.', en: 'after resolving a conflict or amending at an edit/break.' } },
  { cmd: 'git rebase --skip', what: { pt: 'pula o commit atual (equivale a drop).', en: 'skips the current commit (same as drop).' } },
  { cmd: 'git rebase --abort', what: { pt: 'volta tudo ao estado antes do rebase.', en: 'rolls everything back to the state before the rebase.' } },
  { cmd: 'git reflog', what: { pt: 'se algo deu errado, é por aqui que se recupera o commit perdido.', en: 'if something went wrong, this is where the lost commit comes back from.' } },
  { cmd: 'git log --oneline --graph --decorate -20', what: { pt: 'o histórico com os shas que você vai colar aqui.', en: 'the history with the shas you are about to paste here.' } },
  { cmd: 'git branch backup/antes-do-rebase', what: { pt: 'cria uma referência do estado atual antes de mexer — barato e salva o dia.', en: 'creates a reference of the current state before you touch anything — cheap and saves the day.' } },
  { cmd: 'git cherry-pick <sha> / git revert <sha>', what: { pt: 'traz um commit de outro lugar, ou desfaz um commit que já foi publicado.', en: 'brings a commit from elsewhere, or undoes one that was already published.' } },
  { cmd: 'git diff upstream...HEAD', what: { pt: 'o que essa branch acrescenta em cima da base, com os três pontos.', en: 'what this branch adds on top of the base, with the three dots.' } },
]

const translations = {
  pt: {
    title: 'Planejador de git rebase -i',
    intro: 'Cole a lista de commits (a saída do git log --oneline, ou o próprio arquivo que o git abre no editor), reordene, escolha o que fazer com cada commit e monte o arquivo de rebase interativo pronto pra usar. 100% no navegador — nada sai daqui.',
    input: 'Commits para planejar',
    inputHint: 'Aceita a saída do git log --oneline (sha + mensagem), o arquivo de rebase inteiro — as linhas # de comentário são ignoradas — ou uma mistura dos dois. exec, break, label e reset também são reconhecidos.',
    placeholder: 'a1b2c3d feat(checkout): add coupon field\nb2c3d4e fix(cart): handle empty cart\n...',
    formatOneline: 'formato git log --oneline',
    formatTodo: 'arquivo de rebase',
    formatMixed: 'formato misto',
    formatEmpty: 'lista vazia',
    commitCount: '{n} commit(s)',
    commentsIgnored: '{n} comentário(s) ignorado(s)',
    linesIgnored: '{n} linha(s) não reconhecida(s)',
    ontoKeeps: 'aqui para: tudo abaixo de {0} fica de fora',
    loadSample: 'Carregar exemplo',
    clear: 'Limpar',
    plan: 'Plano do rebase',
    planHint: 'As linhas são executadas de cima pra baixo — é literalmente o arquivo .git/rebase-merge/git-rebase-todo. Use as setas pra reordenar e o seletor pra trocar a ação de cada commit.',
    bulk: 'Ações em lote',
    allPick: 'Tudo como pick',
    reverse: 'Inverter a ordem',
    resetPlan: 'Voltar ao que foi colado',
    autosquash: 'Aplicar autosquash',
    autosquashHint: 'Move cada commit fixup!/squash!/amend! pra logo depois do commit que ele corrige e troca a ação. É o mesmo que git rebase -i --autosquash faz por baixo dos panos.',
    autosquashMoved: '{n} commit(s) movido(s) para depois do alvo e marcados como fixup/squash.',
    autosquashUnmatched: 'Sem alvo na lista (ficaram como pick): {list}',
    autosquashNone: 'Nenhum commit com mensagem fixup!, squash! ou amend! nesta lista.',
    addExec: 'Linha exec',
    execPlaceholder: 'comando, ex.: npm test',
    add: 'Adicionar',
    checks: 'Verificações',
    allGood: 'Nenhum problema encontrado — o arquivo abaixo está pronto pra ser usado.',
    output: 'Arquivo git-rebase-todo',
    outputHint: 'Salve por cima de .git/rebase-merge/git-rebase-todo, ou use o comando GIT_SEQUENCE_EDITOR pra pular o editor de uma vez. O bloco de comentários no final é o mesmo que o git escreve.',
    copy: 'Copiar',
    download: 'Baixar',
    copied: 'Arquivo de rebase copiado!',
    downloadName: 'git-rebase-todo',
    upstream: 'Base do rebase',
    upstreamHint: 'É o commit a partir do qual o rebase começa (o que fica de fora). Em branco, a página usa HEAD~N com N igual ao número de commits da lista. Funciona igual com main, origin/main~3 ou um sha.',
    commandTitle: 'Comandos para rodar',
    rebaseCommand: 'git rebase -i {upstream}',
    sequenceEditor: "GIT_SEQUENCE_EDITOR='cp git-rebase-todo' git rebase -i {upstream}",
    historyWarning: 'rebase reescreve o histórico: se a branch já foi publicada, o push vai precisar de --force-with-lease (e o ideal é evitar).',
    keepGoing: 'git rebase --continue  ·  --skip  ·  --abort',
    resultTitle: 'O que o sequencer vai fazer',
    resultHint: 'Cada bloco é um commit no histórico final. O que aparece dentro do bloco é o que foi dobrado dentro dele; o que está riscado some.',
    removed: 'removido',
    orphan: 'sem commit anterior — o git rejeita esta linha',
    statBefore: 'commits na lista',
    statAfter: 'commits no resultado',
    statDropped: 'removidos',
    statFolded: 'dobrados',
    noSubject: '(sem mensagem)',
    execTag: 'exec',
    ontoTitle: 'git rebase --onto',
    ontoHint: 'O comando de sempre que é confuso: ele traz para {newbase} os commits que estão entre {upstream} e {branch} — e só eles. Os commits abaixo de {upstream} ficam para trás.',
    ontoBranch: 'branch (a que você quer mover)',
    ontoUpstream: 'de (fica de fora)',
    ontoNewbase: 'para (nova base)',
    ontoCopy: 'Copiar comando',
    ontoCommandCopied: 'Comando copiado!',
    ontoBefore: 'antes',
    ontoAfter: 'depois',
    refs: 'Referência rápida',
    commandsTable: 'Comandos do arquivo de rebase',
    usefulTable: 'Comandos úteis de rebase',
    source: 'Código-fonte do planejador',
    sourceHint: 'O mesmo arquivo que roda a página, importado como texto (import ... ?raw) — parse do todo, autosquash, agrupamento, validações e montagem do arquivo final.',
    moveUp: 'Subir',
    moveDown: 'Descer',
    remove: 'Remover linha',
    issues: {
      noRows: 'Nenhum commit na lista ainda. Cole o output do git log --oneline ou o arquivo de rebase acima.',
      firstSquash: 'A primeira linha é {0}: squash e fixup precisam de um commit antes para dobrar dentro. Reposicione o commit que vem depois do alvo.',
      duplicateSha: 'O mesmo commit aparece mais de uma vez: {0}. Cada linha do arquivo de rebase é um commit diferente — apague a duplicada.',
      badSha: 'Hash inválido ou ausente: {0}. O git precisa de pelo menos 4 caracteres hexadecimais do sha para achar o commit.',
      squashAfterDrop: 'A linha {0} é um squash/fixup e vem depois de {1}, que foi marcado como drop. Sem o commit anterior não há em que dobrar — o git aborta com cannot squash without a previous commit.',
      allDropped: 'Todas as linhas são drop: o rebase vai terminar sem nenhum commit novo nessa branch.',
      pendingFixup: 'Tem commit com mensagem fixup!/squash!/amend! ainda marcado como pick: {0}. Use o botão de autosquash, ou marque a linha de baixo como fixup.',
      unknownLines: '{n} linha(s) não pareciam commit nem comando do rebase e foram deixadas de fora: {0}',
    },
  },
  en: {
    title: 'git rebase -i Planner',
    intro: 'Paste the commit list (the output of git log --oneline, or the very file git opens in the editor), reorder it, choose what happens to each commit and build the interactive rebase file ready to use. 100% in the browser — nothing leaves here.',
    input: 'Commits to plan',
    inputHint: 'Accepts the output of git log --oneline (sha + message), a whole rebase file — the # comment lines are ignored — or a mix of both. exec, break, label and reset are recognized too.',
    placeholder: 'a1b2c3d feat(checkout): add coupon field\nb2c3d4e fix(cart): handle empty cart\n...',
    formatOneline: 'git log --oneline format',
    formatTodo: 'rebase file',
    formatMixed: 'mixed format',
    formatEmpty: 'empty list',
    commitCount: '{n} commit(s)',
    commentsIgnored: '{n} comment line(s) ignored',
    linesIgnored: '{n} unrecognized line(s)',
    ontoKeeps: 'stays here: everything below {0} is left out',
    loadSample: 'Load sample',
    clear: 'Clear',
    plan: 'Rebase plan',
    planHint: 'The lines run from top to bottom — this is literally the .git/rebase-merge/git-rebase-todo file. Use the arrows to reorder and the selector to change each commit action.',
    bulk: 'Bulk actions',
    allPick: 'All as pick',
    reverse: 'Reverse order',
    resetPlan: 'Back to what was pasted',
    autosquash: 'Apply autosquash',
    autosquashHint: 'Moves every fixup!/squash!/amend! commit right after the commit it fixes and flips the action. Same thing git rebase -i --autosquash does under the hood.',
    autosquashMoved: '{n} commit(s) moved right after their target and marked as fixup/squash.',
    autosquashUnmatched: 'No target in this list (left as pick): {list}',
    autosquashNone: 'No commit with a fixup!, squash! or amend! message in this list.',
    addExec: 'exec line',
    execPlaceholder: 'command, e.g. npm test',
    add: 'Add',
    checks: 'Checks',
    allGood: 'No problem found — the file below is ready to use.',
    output: 'git-rebase-todo file',
    outputHint: 'Save it over .git/rebase-merge/git-rebase-todo, or use the GIT_SEQUENCE_EDITOR command to skip the editor altogether. The comment block at the end is the one git itself writes.',
    copy: 'Copy',
    download: 'Download',
    copied: 'Rebase file copied!',
    downloadName: 'git-rebase-todo',
    upstream: 'Rebase base',
    upstreamHint: 'The commit the rebase starts from (what stays out of it). Left empty, the page uses HEAD~N with N equal to the number of commits in the list. main, origin/main~3 or a sha work just as well.',
    commandTitle: 'Commands to run',
    rebaseCommand: 'git rebase -i {upstream}',
    sequenceEditor: "GIT_SEQUENCE_EDITOR='cp git-rebase-todo' git rebase -i {upstream}",
    historyWarning: 'A rebase rewrites history: if the branch was already pushed, the push needs --force-with-lease (and avoiding that is better).',
    keepGoing: 'git rebase --continue  ·  --skip  ·  --abort',
    resultTitle: 'What the sequencer will do',
    resultHint: 'Each block is one commit in the final history. What is inside the block is what got folded into it; the struck-through ones disappear.',
    removed: 'removed',
    orphan: 'no previous commit — git rejects this line',
    statBefore: 'commits in the list',
    statAfter: 'commits in the result',
    statDropped: 'removed',
    statFolded: 'folded',
    noSubject: '(no message)',
    execTag: 'exec',
    ontoTitle: 'git rebase --onto',
    ontoHint: 'The command nobody reads right the first time: it brings to {newbase} the commits between {upstream} and {branch} — and only those. Everything below {upstream} stays behind.',
    ontoBranch: 'branch (the one you want to move)',
    ontoUpstream: 'from (stays out)',
    ontoNewbase: 'to (new base)',
    ontoCopy: 'Copy command',
    ontoCommandCopied: 'Command copied!',
    ontoBefore: 'before',
    ontoAfter: 'after',
    refs: 'Quick reference',
    commandsTable: 'Commands of the rebase file',
    usefulTable: 'Useful rebase commands',
    source: 'Planner source code',
    sourceHint: 'The very file that runs this page, imported as text (import ... ?raw) — todo parsing, autosquash, grouping, validation and the final file assembly.',
    moveUp: 'Move up',
    moveDown: 'Move down',
    remove: 'Remove line',
    issues: {
      noRows: 'No commit in the list yet. Paste the output of git log --oneline or the rebase file above.',
      firstSquash: 'The first line is {0}: squash and fixup need a commit before them to fold into. Move the commit that should come after the target.',
      duplicateSha: 'The same commit shows up more than once: {0}. Every line of the rebase file is a different commit — delete the duplicate.',
      badSha: 'Invalid or missing hash: {0}. Git needs at least 4 hex characters of the sha to find the commit.',
      squashAfterDrop: 'Line {0} is a squash/fixup and comes after {1}, which was marked as drop. With no previous commit there is nothing to fold into — git aborts with cannot squash without a previous commit.',
      allDropped: 'Every line is a drop: the rebase will end with no new commit on this branch at all.',
      pendingFixup: 'There are commits with a fixup!/squash!/amend! message still marked as pick: {0}. Use the autosquash button, or mark the line below as fixup.',
      unknownLines: '{n} line(s) looked like neither a commit nor a rebase command and were left out: {0}',
    },
  },
}

const BLOCK_STYLE = {
  margin: 0,
  maxHeight: 460,
  overflow: 'auto',
  fontFamily: 'monospace',
  fontSize: 13,
  background: '#fafafa',
  padding: 12,
  borderRadius: 6,
  whiteSpace: 'pre',
}

function OntoDiagram({ before, after }) {
  return (
    <Row gutter={[12, 12]}>
      <Col xs={24} md={11}>
        <div style={BLOCK_STYLE}>
          <Text type="secondary" style={{ fontFamily: 'monospace', fontSize: 12 }}>{before.title}</Text>
          {'\n' + before.lines.join('\n')}
        </div>
      </Col>
      <Col xs={24} md={2} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 22 }}>→</Text>
      </Col>
      <Col xs={24} md={11}>
        <div style={BLOCK_STYLE}>
          <Text type="secondary" style={{ fontFamily: 'monospace', fontSize: 12 }}>{after.title}</Text>
          {'\n' + after.lines.join('\n')}
        </div>
      </Col>
    </Row>
  )
}

export default function GitRebasePlannerPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [text, setText] = useState('')
  const [plan, setPlan] = useState(EMPTY_PLAN)
  const [upstream, setUpstream] = useState('')
  const [execCommand, setExecCommand] = useState('')
  const [autoNote, setAutoNote] = useState(null)
  const [ontoBranch, setOntoBranch] = useState('topic')
  const [ontoUpstream, setOntoUpstream] = useState('main')
  const [ontoNewbase, setOntoNewbase] = useState('main')

  const { rows } = plan

  const handleTextChange = useCallback((value) => {
    setText(value)
    setPlan(parseTodo(value))
    setAutoNote(null)
  }, [])

  const loadSample = useCallback(() => {
    setText(SAMPLE)
    setPlan(parseTodo(SAMPLE))
    setAutoNote(null)
  }, [])

  const clearAll = useCallback(() => {
    setText('')
    setPlan(EMPTY_PLAN)
    setAutoNote(null)
  }, [])

  const setAction = useCallback((id, action) => {
    setPlan((prev) => ({ ...prev, rows: prev.rows.map((row) => (row.id === id && row.kind === 'commit' ? { ...row, action } : row)) }))
    setAutoNote(null)
  }, [])

  const move = useCallback((index, delta) => {
    setPlan((prev) => ({ ...prev, rows: moveRow(prev.rows, index, index + delta) }))
    setAutoNote(null)
  }, [])

  const removeRow = useCallback((id) => {
    setPlan((prev) => ({ ...prev, rows: prev.rows.filter((row) => row.id !== id) }))
    setAutoNote(null)
  }, [])

  const allPick = useCallback(() => {
    setPlan((prev) => ({
      ...prev,
      rows: prev.rows.map((row) => (row.kind === 'commit' ? { ...row, action: 'pick' } : row)),
    }))
    setAutoNote(null)
  }, [])

  const reverseOrder = useCallback(() => {
    setPlan((prev) => ({ ...prev, rows: prev.rows.slice().reverse() }))
    setAutoNote(null)
  }, [])

  const resetPlan = useCallback(() => {
    setPlan(parseTodo(text))
    setAutoNote(null)
  }, [text])

  const addExec = useCallback(() => {
    const command = execCommand.trim()
    if (!command) return
    setPlan((prev) => ({
      ...prev,
      rows: prev.rows.concat([{ id: 'row-exec-' + prev.rows.length + '-' + command, kind: 'exec', action: 'exec', sha: '', subject: command, emit: 'exec ' + command }]),
    }))
    setExecCommand('')
    setAutoNote(null)
  }, [execCommand])

  const applyAutosquash = useCallback(() => {
    const result = autosquash(rows)
    setPlan((prev) => ({ ...prev, rows: result.rows }))
    setAutoNote({ moved: result.moved.length, unmatched: result.unmatched })
    if (result.moved.length === 0 && result.unmatched.length === 0) {
      message.info(t.autosquashNone)
    } else {
      message.success(t.autosquashMoved.replace('{n}', result.moved.length))
    }
  }, [rows, t])

  const groups = useMemo(() => buildGroups(rows), [rows])
  const summary = useMemo(() => summarize(rows, groups), [rows, groups])
  const issues = useMemo(() => validate(rows, plan.stats), [rows, plan.stats])

  const baseCommit = useMemo(() => {
    const commits = rows.filter((row) => row.kind === 'commit')
    return commits.length > 0 ? commits[commits.length - 1].sha : ''
  }, [rows])

  const effectiveUpstream = useMemo(() => {
    const value = upstream.trim()
    return value === '' ? 'HEAD~' + Math.max(summary.input, 1) : value
  }, [upstream, summary.input])

  const todoText = useMemo(
    () => buildTodoFile(rows, { range: effectiveUpstream, head: baseCommit || 'HEAD', onto: effectiveUpstream }),
    [rows, effectiveUpstream, baseCommit]
  )

  const copyTodo = useCallback(() => {
    navigator.clipboard.writeText(todoText)
    message.success(t.copied)
  }, [todoText, t.copied])

  const downloadTodo = useCallback(() => {
    const blob = new Blob([todoText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = t.downloadName
    link.click()
    URL.revokeObjectURL(url)
  }, [todoText, t.downloadName])

  const rebaseCommand = t.rebaseCommand.replace('{upstream}', effectiveUpstream)
  const sequenceEditorCommand = t.sequenceEditor.replace('{upstream}', effectiveUpstream)

  const copyCommand = useCallback((command) => {
    navigator.clipboard.writeText(command)
    message.success(t.ontoCommandCopied)
  }, [t.ontoCommandCopied])

  const ontoCommand = useMemo(() => {
    const branch = ontoBranch.trim()
    const from = ontoUpstream.trim()
    const to = ontoNewbase.trim()
    if (branch === '' || from === '' || to === '') return ''
    return 'git rebase --onto ' + to + ' ' + from + ' ' + branch
  }, [ontoBranch, ontoUpstream, ontoNewbase])

  const ontoHint = useMemo(
    () => t.ontoHint.replace('{newbase}', ontoNewbase.trim() || '...').replace('{upstream}', ontoUpstream.trim() || '...').replace('{branch}', ontoBranch.trim() || '...'),
    [t.ontoHint, ontoBranch, ontoUpstream, ontoNewbase]
  )

  const ontoDiagram = useMemo(() => {
    const branch = ontoBranch.trim() || 'topic'
    const from = ontoUpstream.trim() || 'main'
    const to = ontoNewbase.trim() || 'main'
    const moved = Math.max(summary.input, 3)
    const before = ['* T' + moved + '   (' + branch + ')']
    for (let i = moved - 1; i >= 1; i -= 1) before.push('* T' + i)
    before.push('|  ' + t.ontoKeeps.replace('{0}', from))
    before.push('* M3   (' + to + ')')
    const after = ['* T' + moved + "'  (' + branch + ')"]
    for (let i = moved - 1; i >= 1; i -= 1) after.push("* T" + i + "'")
    after.push('* M3   (' + to + ')')
    return {
      before: { title: t.ontoBefore, lines: before },
      after: { title: t.ontoAfter, lines: after },
    }
  }, [ontoBranch, ontoUpstream, ontoNewbase, summary.input, t.ontoBefore, t.ontoAfter, t.ontoKeeps])

  const todoCommandRows = useMemo(
    () => TODO_COMMANDS.map((entry) => ({ key: entry.cmd, cmd: entry.cmd, what: entry.what[lang] })),
    [lang]
  )

  const usefulCommandRows = useMemo(
    () => USEFUL_COMMANDS.map((entry) => ({ key: entry.cmd, cmd: entry.cmd, what: entry.what[lang] })),
    [lang]
  )

  const issueRows = useMemo(
    () =>
      issues.map((issue) => {
        const template = t.issues[issue.code] || ''
        const values = issue.code === 'unknownLines' ? [issue.values.join(' · ')] : issue.values
        const text = template
          .replace('{n}', issue.code === 'unknownLines' ? plan.stats.unknown : values.length)
          .replace('{0}', values[0] || '')
          .replace('{1}', values[1] || '')
          .replace('{list}', values.join(', '))
        return { key: issue.code + issue.values.join(','), level: issue.level, text }
      }),
    [issues, t.issues, plan.stats.unknown]
  )

  const formatTags = {
    oneline: <Tag color="blue">{t.formatOneline}</Tag>,
    todo: <Tag color="purple">{t.formatTodo}</Tag>,
    mixed: <Tag color="geekblue">{t.formatMixed}</Tag>,
    empty: <Tag>{t.formatEmpty}</Tag>,
  }

  const levelToType = { error: 'error', warning: 'warning', info: 'info' }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><OrderedListOutlined /> {t.title}</Title>
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
          rows={9}
          value={text}
          onChange={(event) => handleTextChange(event.target.value)}
          placeholder={t.placeholder}
          style={{ fontFamily: 'monospace', fontSize: 13 }}
        />
        <Space wrap style={{ marginTop: 12 }}>
          {formatTags[plan.stats.format]}
          <Tag color="processing">{t.commitCount.replace('{n}', summary.input)}</Tag>
          {plan.stats.comments > 0 && <Tag>{t.commentsIgnored.replace('{n}', plan.stats.comments)}</Tag>}
          {plan.stats.unknown > 0 && <Tag color="orange">{t.linesIgnored.replace('{n}', plan.stats.unknown)}</Tag>}
        </Space>
      </Card>

      {rows.length === 0 ? (
        <Alert type="info" showIcon message={t.issues.noRows} />
      ) : (
        <>
          <Card
            title={t.plan}
            extra={
              <Space wrap>
                <Button size="small" onClick={allPick}>{t.allPick}</Button>
                <Button size="small" onClick={reverseOrder}>{t.reverse}</Button>
                <Button size="small" onClick={resetPlan}>{t.resetPlan}</Button>
                <Button size="small" type="primary" icon={<ThunderboltOutlined />} onClick={applyAutosquash}>{t.autosquash}</Button>
              </Space>
            }
          >
            <Paragraph type="secondary" style={{ marginTop: 0 }}>{t.planHint}</Paragraph>

            <Space direction="vertical" size={6} style={{ width: '100%', marginBottom: 12 }}>
              {rows.map((row, index) => (
                <div
                  key={row.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '4px 8px',
                    border: '1px solid #f0f0f0',
                    borderRadius: 6,
                    background: row.kind === 'exec' ? '#fafafa' : 'transparent',
                  }}
                >
                  <Text type="secondary" style={{ width: 22, fontFamily: 'monospace', fontSize: 12 }}>{index + 1}</Text>
                  {row.kind === 'commit' ? (
                    <>
                      <Text code style={{ minWidth: 84 }}>{row.sha || '—'}</Text>
                      <Text
                        style={{
                          flex: 1,
                          minWidth: 0,
                          textDecoration: row.action === 'drop' ? 'line-through' : 'none',
                          opacity: row.action === 'drop' ? 0.55 : 1,
                        }}
                        ellipsis
                      >
                        {row.subject === '' ? t.noSubject : row.subject}
                      </Text>
                      <Select
                        size="small"
                        value={row.action}
                        onChange={(value) => setAction(row.id, value)}
                        options={ACTION_OPTIONS}
                        style={{ width: 108, fontFamily: 'monospace' }}
                      />
                    </>
                  ) : (
                    <>
                      <Tag style={{ minWidth: 84, textAlign: 'center', fontFamily: 'monospace' }}>{row.action === 'exec' ? t.execTag : row.action}</Tag>
                      <Text style={{ flex: 1, minWidth: 0, fontFamily: 'monospace', fontSize: 13 }} ellipsis>
                        {row.emit}
                      </Text>
                    </>
                  )}
                  <Button size="small" icon={<ArrowUpOutlined />} title={t.moveUp} aria-label={t.moveUp} disabled={index === 0} onClick={() => move(index, -1)} />
                  <Button size="small" icon={<ArrowDownOutlined />} title={t.moveDown} aria-label={t.moveDown} disabled={index === rows.length - 1} onClick={() => move(index, 1)} />
                  <Button size="small" icon={<DeleteOutlined />} title={t.remove} aria-label={t.remove} onClick={() => removeRow(row.id)} />
                </div>
              ))}
            </Space>

            <Space wrap style={{ width: '100%' }}>
              <Input
                size="small"
                value={execCommand}
                onChange={(event) => setExecCommand(event.target.value)}
                onPressEnter={addExec}
                placeholder={t.execPlaceholder}
                style={{ width: 240, fontFamily: 'monospace' }}
              />
              <Button size="small" icon={<PlusOutlined />} onClick={addExec} disabled={execCommand.trim() === ''}>{t.add} {t.execTag}</Button>
            </Space>

            {autoNote && (
              <div style={{ marginTop: 12 }}>
                {autoNote.moved > 0 && (
                  <Alert
                    type="success"
                    showIcon
                    closable
                    onClose={() => setAutoNote(null)}
                    message={t.autosquashMoved.replace('{n}', autoNote.moved)}
                    style={{ marginBottom: 8 }}
                  />
                )}
                {autoNote.unmatched.length > 0 && (
                  <Alert
                    type="warning"
                    showIcon
                    closable
                    onClose={() => setAutoNote(null)}
                    message={t.autosquashUnmatched.replace('{list}', autoNote.unmatched.join(', '))}
                  />
                )}
              </div>
            )}
          </Card>

          <Card title={t.checks} size="small">
            {issueRows.length === 0 ? (
              <Alert type="success" showIcon message={t.allGood} />
            ) : (
              <Space direction="vertical" size={8} style={{ width: '100%' }}>
                {issueRows.map((issue) => (
                  <Alert key={issue.key} type={levelToType[issue.level]} showIcon message={issue.text} />
                ))}
              </Space>
            )}
          </Card>

          <Card
            title={t.output}
            extra={
              <Space>
                <Button size="small" icon={<CopyOutlined />} onClick={copyTodo}>{t.copy}</Button>
                <Button size="small" icon={<DownloadOutlined />} onClick={downloadTodo}>{t.download}</Button>
              </Space>
            }
          >
            <Paragraph type="secondary" style={{ marginTop: 0 }}>{t.outputHint}</Paragraph>
            <pre style={BLOCK_STYLE}>{todoText === '' ? ' ' : todoText}</pre>
          </Card>

          <Card title={t.commandTitle}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>{t.upstream}</Text>
                <Input
                  value={upstream}
                  onChange={(event) => setUpstream(event.target.value)}
                  placeholder={'HEAD~' + Math.max(summary.input, 1)}
                  style={{ fontFamily: 'monospace', maxWidth: 420 }}
                />
                <Paragraph type="secondary" style={{ marginTop: 6, marginBottom: 0, fontSize: 12 }}>{t.upstreamHint}</Paragraph>
              </div>
              <div>
                <pre style={{ ...BLOCK_STYLE, maxHeight: 120 }}>{rebaseCommand + '\n' + sequenceEditorCommand}</pre>
              </div>
              <Space wrap>
                <Button size="small" icon={<CopyOutlined />} onClick={() => copyCommand(rebaseCommand + '\n' + sequenceEditorCommand)}>{t.copy}</Button>
                <Text type="secondary" style={{ fontFamily: 'monospace', fontSize: 12 }}>{t.keepGoing}</Text>
              </Space>
              <Alert type="warning" showIcon message={t.historyWarning} />
            </Space>
          </Card>

          <Card title={t.resultTitle}>
            <Paragraph type="secondary" style={{ marginTop: 0 }}>{t.resultHint}</Paragraph>
            <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
              <Col xs={12} md={6}><Statistic title={t.statBefore} value={summary.input} /></Col>
              <Col xs={12} md={6}><Statistic title={t.statAfter} value={summary.result} valueStyle={{ color: '#52c41a' }} /></Col>
              <Col xs={12} md={6}><Statistic title={t.statDropped} value={summary.dropped} valueStyle={{ color: summary.dropped > 0 ? '#ff4d4f' : undefined }} /></Col>
              <Col xs={12} md={6}><Statistic title={t.statFolded} value={summary.folded} /></Col>
            </Row>
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              {groups.map((group, index) => {
                if (group.type === 'exec') {
                  return (
                    <div key={'exec-' + index} style={{ borderLeft: '3px dashed #d9d9d9', padding: '4px 0 4px 10px' }}>
                      <Text style={{ fontFamily: 'monospace', fontSize: 13 }}>{group.row.emit}</Text>
                    </div>
                  )
                }
                if (group.type === 'orphan') {
                  return (
                    <div key={'orphan-' + index} style={{ borderLeft: '3px solid #ff4d4f', padding: '4px 0 4px 10px' }}>
                      <Space wrap>
                        <Tag color="red">{t.orphan}</Tag>
                        <Text code>{group.row.sha || '—'}</Text>
                        <Text>{group.row.subject}</Text>
                      </Space>
                    </div>
                  )
                }
                return (
                  <div key={'commit-' + group.row.id} style={{ borderLeft: '3px solid ' + (group.dropped ? '#ffccc7' : '#d9d9d9'), padding: '4px 0 4px 10px' }}>
                    <Space wrap>
                      <Tag color={ACTION_COLORS[group.row.action]}>{group.row.action}</Tag>
                      <Text code>{group.row.sha || '—'}</Text>
                      <Text
                        style={{
                          textDecoration: group.dropped ? 'line-through' : 'none',
                          opacity: group.dropped ? 0.55 : 1,
                        }}
                      >
                        {group.row.subject === '' ? t.noSubject : group.row.subject}
                      </Text>
                      {group.dropped && <Tag color="red">{t.removed}</Tag>}
                    </Space>
                    {group.children.length > 0 && (
                      <div style={{ borderLeft: '2px solid #d9f7d0', marginTop: 6, paddingLeft: 10 }}>
                        {group.children.map((child) => (
                          <div key={child.id} style={{ padding: '2px 0' }}>
                            <Space wrap size={8}>
                              <Tag color={ACTION_COLORS[child.action]}>{child.action}</Tag>
                              <Text code>{child.sha || '—'}</Text>
                              <Text type="secondary" style={{ fontSize: 13 }}>{child.subject === '' ? t.noSubject : child.subject}</Text>
                            </Space>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </Space>
          </Card>
        </>
      )}

      <Card title={t.ontoTitle}>
        <Paragraph type="secondary" style={{ marginTop: 0 }}>{ontoHint}</Paragraph>
        <Row gutter={[12, 12]}>
          <Col xs={24} md={8}>
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>{t.ontoBranch}</Text>
            <Input value={ontoBranch} onChange={(event) => setOntoBranch(event.target.value)} style={{ fontFamily: 'monospace' }} />
          </Col>
          <Col xs={24} md={8}>
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>{t.ontoUpstream}</Text>
            <Input value={ontoUpstream} onChange={(event) => setOntoUpstream(event.target.value)} style={{ fontFamily: 'monospace' }} />
          </Col>
          <Col xs={24} md={8}>
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>{t.ontoNewbase}</Text>
            <Input value={ontoNewbase} onChange={(event) => setOntoNewbase(event.target.value)} style={{ fontFamily: 'monospace' }} />
          </Col>
        </Row>
        <div style={{ marginTop: 12, marginBottom: 12 }}>
          <pre style={{ ...BLOCK_STYLE, maxHeight: 80 }}>{ontoCommand === '' ? ' ' : ontoCommand}</pre>
        </div>
        <Space>
          <Button size="small" icon={<CopyOutlined />} disabled={ontoCommand === ''} onClick={() => copyCommand(ontoCommand)}>{t.ontoCopy}</Button>
        </Space>
        <div style={{ marginTop: 12 }}>
          <OntoDiagram before={ontoDiagram.before} after={ontoDiagram.after} />
        </div>
      </Card>

      <Collapse
        items={[
          {
            key: 'todo-commands',
            label: t.commandsTable,
            children: (
              <Table
                size="small"
                pagination={false}
                rowKey="key"
                dataSource={todoCommandRows}
                columns={[
                  { title: '', dataIndex: 'cmd', render: (value) => <Text code>{value}</Text>, width: 150 },
                  { title: '', dataIndex: 'what' },
                ]}
              />
            ),
          },
          {
            key: 'useful-commands',
            label: t.usefulTable,
            children: (
              <Table
                size="small"
                pagination={false}
                rowKey="key"
                dataSource={usefulCommandRows}
                columns={[
                  { title: '', dataIndex: 'cmd', render: (value) => <Text code>{value}</Text>, width: 340 },
                  { title: '', dataIndex: 'what' },
                ]}
              />
            ),
          },
          {
            key: 'source',
            label: t.source,
            children: (
              <div>
                <Paragraph type="secondary" style={{ marginTop: 0 }}>{t.sourceHint}</Paragraph>
                <pre style={{ ...BLOCK_STYLE, maxHeight: 520, whiteSpace: 'pre-wrap' }}>{engineSource}</pre>
              </div>
            ),
          },
        ]}
      />
    </Space>
  )
}
