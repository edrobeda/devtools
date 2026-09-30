// Engine behind the "Planejador de git rebase -i" page.
//
// Everything here is pure: it takes the rows the user typed and returns the
// rows, the validations and the final todo file. No React, no DOM, so the
// same functions are exercised by the node test in .scratch/.

export const TODO_ACTIONS = ['pick', 'reword', 'edit', 'squash', 'fixup', 'drop']

// Single letter shorthands git accepts at the start of a todo line.
export const ACTION_ALIASES = { p: 'pick', r: 'reword', e: 'edit', s: 'squash', f: 'fixup', d: 'drop' }

// Every command git understands inside a todo file. The first six take a
// commit, the rest are standalone markers.
export const ALL_TODO_COMMANDS = [
  'pick',
  'reword',
  'edit',
  'squash',
  'fixup',
  'drop',
  'exec',
  'break',
  'label',
  'reset',
  'merge',
  'update-ref',
]

export const SHA_RE = /^[0-9a-f]{4,40}$/
export const FIXUP_SUBJECT_RE = /^(fixup|squash|amend)!\s*(.+)$/

// The comment block git itself writes at the bottom of the todo file. It is
// reproduced verbatim so the generated file can be pasted into the editor and
// still look like something git produced.
const TODO_COMMENT = [
  '#',
  '# Commands:',
  '# p, pick <commit> = use commit',
  '# r, reword <commit> = use commit, but edit the commit message',
  '# e, edit <commit> = use commit, but stop for amending',
  '# s, squash <commit> = use commit, but meld into previous commit',
  '# f, fixup [-C | -c] <commit> = like "squash" but keep only the previous',
  "#                    commit's log message, unless -C is used, in which case",
  '#                    keep only this commit\'s message; -c is same as -C',
  '#                    but opens the editor',
  '# x, exec <command> = run command (the rest of the line) using shell',
  "# b, break = stop here (continue rebase later with 'git rebase --continue')",
  '# d, drop <commit> = remove commit',
  '# l, label <label> = label current HEAD with a name',
  '# t, reset <label> = reset HEAD to a label',
  '# m, merge [-C <commit> | -c <commit>] <label> [# <oneline>]',
  '#         = create a merge commit using the original merge commit\'s',
  '#         message (or the oneline, if no original merge commit was',
  '#         specified); use -c <commit> to reword the commit message',
  '# u, update-ref <ref> = track a placeholder for the <ref> to be updated',
  '#         to this position in the new commits. The <ref> is updated at',
  '#         the end of the run',
  '#',
  '# These lines can be re-ordered; they are executed from top to bottom.',
  '#',
  '# If you remove a line here THAT COMMIT WILL BE LOST.',
  '#',
  '# However, if you change anything, you can just use',
  "# 'c' to abort the rebase.",
]

function normalizeAction(word) {
  const lower = word.toLowerCase()
  return ACTION_ALIASES[lower] || (ALL_TODO_COMMANDS.includes(lower) ? lower : null)
}

// Accepts both shapes people paste:
//   * a real todo file (with the git comment block and the action words)
//   * the output of `git log --oneline` (just "sha subject" per line)
export function parseTodo(text) {
  const rows = []
  const unknownSamples = []
  let comments = 0
  let blanks = 0
  let unknown = 0
  let withAction = 0
  let bare = 0

  const lines = String(text || '').split('\n').map((line) => (line.endsWith('\r') ? line.slice(0, -1) : line))

  lines.forEach((rawLine) => {
    const line = rawLine.trim()
    if (line === '') {
      blanks += 1
      return
    }
    if (line.startsWith('#')) {
      comments += 1
      return
    }

    const execMatch = line.match(/^exec\s+(\S.*)$/i)
    if (execMatch) {
      rows.push({
        id: 'row-' + rows.length,
        kind: 'exec',
        action: 'exec',
        sha: '',
        subject: execMatch[1].trim(),
        emit: 'exec ' + execMatch[1].trim(),
      })
      return
    }

    const loneCommand = line.match(/^([a-zA-Z]+)$/)
    if (loneCommand && (loneCommand[1] === 'break' || loneCommand[1] === 'noop')) {
      rows.push({ id: 'row-' + rows.length, kind: 'exec', action: loneCommand[1], sha: '', subject: line, emit: line })
      return
    }

    const actionMatch = line.match(/^([a-zA-Z]+)\s+(\S+)\s*(.*)$/)
    const action = actionMatch ? normalizeAction(actionMatch[1]) : null
    if (actionMatch && action) {
      if (['break', 'label', 'reset', 'merge', 'update-ref'].indexOf(action) !== -1) {
        rows.push({ id: 'row-' + rows.length, kind: 'exec', action, sha: '', subject: line, emit: line })
        return
      }
      rows.push({
        id: 'row-' + rows.length,
        kind: 'commit',
        action,
        sha: actionMatch[2].toLowerCase(),
        subject: actionMatch[3].trim(),
      })
      withAction += 1
      return
    }

    const bareMatch = line.match(/^([0-9a-fA-F]{4,40})\s+(\S.*)$/)
    if (bareMatch) {
      rows.push({
        id: 'row-' + rows.length,
        kind: 'commit',
        action: 'pick',
        sha: bareMatch[1].toLowerCase(),
        subject: bareMatch[2].trim(),
      })
      bare += 1
      return
    }

    // A line with nothing but the hash: valid in a todo file, degenerate in a
    // log, but better kept than silently dropped.
    const shaOnly = line.match(/^([0-9a-fA-F]{4,40})$/)
    if (shaOnly) {
      rows.push({ id: 'row-' + rows.length, kind: 'commit', action: 'pick', sha: shaOnly[1].toLowerCase(), subject: '' })
      bare += 1
      return
    }

    // A "fixup! ..." / "squash! ..." line with no sha at all: it is still a
    // commit, just one the user typed without the hash.
    if (FIXUP_SUBJECT_RE.test(line)) {
      rows.push({ id: 'row-' + rows.length, kind: 'commit', action: 'pick', sha: '', subject: line })
      bare += 1
      return
    }

    unknown += 1
    if (unknownSamples.length < 4) unknownSamples.push(line)
  })

  let format = 'empty'
  if (withAction > 0 && bare > 0) format = 'mixed'
  else if (withAction > 0) format = 'todo'
  else if (bare > 0) format = 'oneline'

  return {
    rows,
    stats: { comments, blanks, unknown, unknownSamples, format, withAction, bare },
  }
}

export function moveRow(rows, from, to) {
  if (from === to || from < 0 || to < 0 || from >= rows.length || to >= rows.length) return rows
  const next = rows.slice()
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved)
  return next
}

// Same as what `git rebase -i --autosquash` does: a commit whose message is
// "fixup! <target>" / "squash! <target>" is moved right after <target> and
// gets the fixup/squash action. The target is matched by sha prefix when the
// suffix looks like a sha, otherwise by the log message of the closest commit
// above. Works on ids (not indexes) so an already moved row is never handled
// twice.
export function autosquash(rows) {
  const byId = new Map(rows.map((row) => [row.id, row]))
  const list = rows.map((row) => row.id)
  const moved = []
  const unmatched = []
  const actions = new Map()

  const candidates = rows
    .filter((row) => row.kind === 'commit' && FIXUP_SUBJECT_RE.test(row.subject))
    .map((row) => row.id)
    .reverse()

  candidates.forEach((id) => {
    const at = list.indexOf(id)
    if (at < 0) return
    const row = byId.get(id)
    const match = row.subject.match(FIXUP_SUBJECT_RE)
    const action = match[1] === 'squash' ? 'squash' : 'fixup'
    const target = match[2].trim()

    let targetAt = -1
    if (SHA_RE.test(target)) {
      for (let j = 0; j < at; j += 1) {
        const candidate = byId.get(list[j])
        if (candidate.kind === 'commit' && candidate.sha && candidate.sha.startsWith(target)) {
          targetAt = j
          break
        }
      }
    }
    if (targetAt === -1) {
      for (let j = at - 1; j >= 0; j -= 1) {
        const candidate = byId.get(list[j])
        if (candidate.kind === 'commit' && candidate.subject === target) {
          targetAt = j
          break
        }
      }
    }

    if (targetAt === -1) {
      unmatched.push(row.subject)
      return
    }

    list.splice(at, 1)
    list.splice(targetAt + 1, 0, id)
    actions.set(id, action)
    moved.push({ subject: row.subject, target, action })
  })

  return {
    rows: list.map((id) => {
      const row = byId.get(id)
      const action = actions.get(id)
      return action ? { ...row, action } : row
    }),
    moved,
    unmatched,
  }
}

// Folds the flat list into what the sequencer will actually do: one entry per
// surviving commit, with its squash/fixup children attached, plus the exec
// markers that run in between.
export function buildGroups(rows) {
  const groups = []
  let current = null

  rows.forEach((row) => {
    if (row.kind === 'exec') {
      groups.push({ type: 'exec', row })
      return
    }
    if (row.action === 'squash' || row.action === 'fixup') {
      if (current && !current.dropped) {
        current.children.push(row)
      } else {
        groups.push({ type: 'orphan', row })
      }
      return
    }
    current = { type: 'commit', row, children: [], dropped: row.action === 'drop' }
    groups.push(current)
  })

  return groups
}

export function summarize(rows, groups) {
  const commits = rows.filter((row) => row.kind === 'commit')
  const dropped = groups.filter((group) => group.type === 'commit' && group.dropped)
  const kept = groups.filter((group) => group.type === 'commit' && !group.dropped)
  const folded = kept.reduce((total, group) => total + group.children.length, 0)
  return {
    input: commits.length,
    kept: kept.length,
    dropped: dropped.length,
    folded,
    exec: rows.filter((row) => row.kind === 'exec').length,
    result: kept.length,
  }
}

// Same checks the sequencer does, in the same spirit: a squash with nothing to
// squash into, duplicated shas, shas that are not hex, everything dropped and
// leftover fixup! subjects that nobody squashed yet.
export function validate(rows, stats) {
  const issues = []
  const commits = rows.filter((row) => row.kind === 'commit')

  if (commits.length === 0) {
    issues.push({ level: 'info', code: 'noRows', values: [] })
    return issues
  }

  const first = rows[0]
  if (first && first.kind === 'commit' && (first.action === 'squash' || first.action === 'fixup')) {
    issues.push({ level: 'error', code: 'firstSquash', values: [first.sha] })
  }

  const seen = new Map()
  commits.forEach((row) => {
    if (!row.sha) return
    seen.set(row.sha, (seen.get(row.sha) || 0) + 1)
  })
  const duplicated = []
  seen.forEach((count, sha) => {
    if (count > 1) duplicated.push(sha)
  })
  if (duplicated.length > 0) {
    issues.push({ level: 'error', code: 'duplicateSha', values: duplicated })
  }

  const badSha = []
  commits.forEach((row) => {
    if (!row.sha) {
      if (badSha.indexOf(row.subject) === -1) badSha.push(row.subject)
      return
    }
    if (!SHA_RE.test(row.sha) && badSha.indexOf(row.sha) === -1) badSha.push(row.sha)
  })
  if (badSha.length > 0) {
    issues.push({ level: 'warning', code: 'badSha', values: badSha })
  }

  let droppedAbove = null
  rows.forEach((row) => {
    if (row.kind !== 'commit') return
    if (row.action === 'drop') {
      droppedAbove = row
      return
    }
    if ((row.action === 'squash' || row.action === 'fixup') && droppedAbove) {
      issues.push({ level: 'error', code: 'squashAfterDrop', values: [row.sha, droppedAbove.sha] })
    }
    droppedAbove = null
  })

  if (commits.every((row) => row.action === 'drop')) {
    issues.push({ level: 'warning', code: 'allDropped', values: [] })
  }

  const pending = commits
    .filter((row) => row.action === 'pick' && FIXUP_SUBJECT_RE.test(row.subject))
    .map((row) => row.subject)
  if (pending.length > 0) {
    issues.push({ level: 'info', code: 'pendingFixup', values: pending })
  }

  if (stats && stats.unknown > 0) {
    issues.push({ level: 'warning', code: 'unknownLines', values: stats.unknownSamples })
  }

  return issues
}

export function buildTodoFile(rows, meta) {
  const commands = rows.map((row) => {
    if (row.kind === 'exec') return row.emit || 'exec ' + row.subject
    return [row.action, row.sha, row.subject].filter(Boolean).join(' ')
  })
  const count = commands.length
  const range = meta && meta.range ? meta.range : 'HEAD~' + Math.max(count, 1)
  const head = meta && meta.head ? meta.head : 'HEAD'
  const onto = meta && meta.onto ? meta.onto : range
  const header = [
    '# Rebase ' + range + '..' + head + ' onto ' + onto + ' (' + count + (count === 1 ? ' command' : ' commands') + ')',
  ].concat(TODO_COMMENT)
  return commands.join('\n') + '\n\n' + header.join('\n') + '\n'
}
