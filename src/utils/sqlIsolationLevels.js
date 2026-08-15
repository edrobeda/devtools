// Simulador educativo de níveis de isolamento de transações SQL.
// Não implementa locks reais nem MVCC completo: aplica regras simplificadas
// de visibilidade para demonstrar dirty read, non-repeatable read, phantom read
// e lost update em READ UNCOMMITTED, READ COMMITTED, REPEATABLE READ e
// SERIALIZABLE. Tudo roda 100% no navegador.

export const ISOLATION_LEVELS = [
  { key: 'read-uncommitted', name: 'READ UNCOMMITTED' },
  { key: 'read-committed', name: 'READ COMMITTED' },
  { key: 'repeatable-read', name: 'REPEATABLE READ' },
  { key: 'serializable', name: 'SERIALIZABLE' },
]

function clone(obj) {
  return JSON.parse(JSON.stringify(obj))
}

function getCommittedVersion(row, excludeTxId = null) {
  for (let i = row.versions.length - 1; i >= 0; i -= 1) {
    const v = row.versions[i]
    if (v.status === 'committed' && v.txId !== excludeTxId) return v
  }
  return null
}

function getLatestVersion(row, excludeTxId = null) {
  for (let i = row.versions.length - 1; i >= 0; i -= 1) {
    const v = row.versions[i]
    if (v.txId !== excludeTxId) return v
  }
  return null
}

function getOwnVersion(row, txId) {
  for (let i = row.versions.length - 1; i >= 0; i -= 1) {
    const v = row.versions[i]
    if (v.txId === txId && v.status === 'active') return v
  }
  return null
}

function isRowDeleted(row, txId, isolation) {
  // Uma linha é considerada deletada se a versão ativa mais recente for uma
  // marcação de delete da própria transação, ou se a versão commitada mais
  // recente for uma marcação de delete (e não houver versão ativa própria).
  const own = getOwnVersion(row, txId)
  if (own && own.deleted) return true
  const latest = getLatestVersion(row)
  if (isolation === 'read-uncommitted') {
    return latest ? latest.deleted : false
  }
  const committed = getCommittedVersion(row)
  if (own) return own.deleted
  return committed ? committed.deleted : false
}

function readRow(row, txId, isolation, snapshot) {
  if (isRowDeleted(row, txId, isolation)) return null

  if (isolation === 'read-uncommitted') {
    const latest = getLatestVersion(row)
    return latest ? latest.data : null
  }

  if (isolation === 'read-committed') {
    const own = getOwnVersion(row, txId)
    if (own) return own.deleted ? null : own.data
    const committed = getCommittedVersion(row)
    return committed ? (committed.deleted ? null : committed.data) : null
  }

  // REPEATABLE READ e SERIALIZABLE usam snapshot próprio.
  if (snapshot && snapshot.rows[row.id] !== undefined) {
    return snapshot.rows[row.id]
  }

  const own = getOwnVersion(row, txId)
  if (own) return own.deleted ? null : own.data
  const committed = getCommittedVersion(row)
  return committed ? (committed.deleted ? null : committed.data) : null
}

function buildInitialState(initialRows) {
  return {
    rows: initialRows.map((r) => ({
      id: r.id,
      versions: [
        {
          txId: null,
          data: clone(r),
          status: 'committed',
          deleted: false,
        },
      ],
    })),
    transactions: {},
    nextTxId: 1,
  }
}

function getOrCreateTx(state, txId) {
  if (!state.transactions[txId]) {
    state.transactions[txId] = {
      status: 'active',
      snapshot: null,
      ranges: [],
    }
  }
  return state.transactions[txId]
}

function ensureSnapshot(state, txId, isolation) {
  if (isolation === 'read-uncommitted' || isolation === 'read-committed') return null
  const tx = getOrCreateTx(state, txId)
  if (!tx.snapshot) {
    const snap = { rows: {} }
    state.rows.forEach((row) => {
      snap.rows[row.id] = readRow(row, txId, 'read-committed', null)
    })
    tx.snapshot = snap
  }
  return tx.snapshot
}

function applySelect(state, step, isolation) {
  const tx = getOrCreateTx(state, step.tx)
  const snapshot = ensureSnapshot(state, step.tx, isolation)

  if (step.rowId !== undefined) {
    const row = state.rows.find((r) => r.id === step.rowId)
    const value = row ? readRow(row, step.tx, isolation, snapshot) : null
    return { value, valueType: 'single' }
  }

  if (step.predicate) {
    const results = state.rows
      .filter((row) => {
        const data = readRow(row, step.tx, isolation, snapshot)
        if (!data) return false
        return step.predicate(data)
      })
      .map((row) => readRow(row, step.tx, isolation, snapshot))

    if (isolation === 'serializable') {
      tx.ranges.push({ predicate: step.predicate, rows: clone(results) })
    }
    return { value: results, valueType: 'range' }
  }

  return { value: null }
}

function applyUpdate(state, step, isolation) {
  const tx = getOrCreateTx(state, step.tx)
  const row = state.rows.find((r) => r.id === step.rowId)
  if (!row) return { error: 'row not found' }

  // SERIALIZABLE: se outra transação já leu esse range/lida e ainda está ativa,
  // simulamos um conflito de serialização (simplificado).
  if (isolation === 'serializable') {
    for (const otherTxId of Object.keys(state.transactions)) {
      if (Number(otherTxId) === step.tx) continue
      const otherTx = state.transactions[otherTxId]
      if (otherTx.status !== 'active') continue
      const otherSnapshot = otherTx.snapshot
      if (otherSnapshot && otherSnapshot.rows[step.rowId] !== undefined) {
        return {
          serializationConflict: true,
          conflictTx: Number(otherTxId),
        }
      }
    }
  }

  const visible = readRow(row, step.tx, isolation, null)
  const nextData = visible ? clone(visible) : clone(row.versions[0].data)
  Object.assign(nextData, step.changes)

  // Remove versão ativa anterior da mesma transação, se houver.
  row.versions = row.versions.filter((v) => !(v.txId === step.tx && v.status === 'active'))
  row.versions.push({
    txId: step.tx,
    data: nextData,
    status: 'active',
    deleted: false,
  })
  return { value: nextData }
}

function applyInsert(state, step, isolation) {
  const tx = getOrCreateTx(state, step.tx)

  // SERIALIZABLE: se alguma transação ativa leu um range que incluiria essa
  // nova linha, simula conflito de serialização.
  if (isolation === 'serializable') {
    for (const otherTxId of Object.keys(state.transactions)) {
      if (Number(otherTxId) === step.tx) continue
      const otherTx = state.transactions[otherTxId]
      if (otherTx.status !== 'active') continue
      for (const range of otherTx.ranges) {
        if (range.predicate(step.data)) {
          return {
            serializationConflict: true,
            conflictTx: Number(otherTxId),
          }
        }
      }
    }
  }

  state.rows.push({
    id: step.data.id,
    versions: [
      {
        txId: step.tx,
        data: clone(step.data),
        status: 'active',
        deleted: false,
      },
    ],
  })
  return { value: clone(step.data) }
}

function applyDelete(state, step, isolation) {
  const row = state.rows.find((r) => r.id === step.rowId)
  if (!row) return { error: 'row not found' }

  if (isolation === 'serializable') {
    for (const otherTxId of Object.keys(state.transactions)) {
      if (Number(otherTxId) === step.tx) continue
      const otherTx = state.transactions[otherTxId]
      if (otherTx.status !== 'active') continue
      const otherSnapshot = otherTx.snapshot
      if (otherSnapshot && otherSnapshot.rows[step.rowId] !== undefined) {
        return {
          serializationConflict: true,
          conflictTx: Number(otherTxId),
        }
      }
    }
  }

  row.versions = row.versions.filter((v) => !(v.txId === step.tx && v.status === 'active'))
  const visible = readRow(row, step.tx, isolation, null)
  row.versions.push({
    txId: step.tx,
    data: visible ? clone(visible) : clone(row.versions[0].data),
    status: 'active',
    deleted: true,
  })
  return { value: null }
}

function applyCommit(state, step) {
  const tx = state.transactions[step.tx]
  if (tx) tx.status = 'committed'
  state.rows.forEach((row) => {
    row.versions.forEach((v) => {
      if (v.txId === step.tx && v.status === 'active') {
        v.status = 'committed'
      }
    })
  })
  return {}
}

function applyRollback(state, step) {
  const tx = state.transactions[step.tx]
  if (tx) tx.status = 'aborted'
  state.rows.forEach((row) => {
    row.versions.forEach((v) => {
      if (v.txId === step.tx && v.status === 'active') {
        v.status = 'aborted'
      }
    })
  })
  return {}
}

function applyStep(state, step, isolation) {
  switch (step.op) {
    case 'begin':
      getOrCreateTx(state, step.tx)
      return { opResult: null }
    case 'select':
      return { opResult: applySelect(state, step, isolation) }
    case 'update':
      return { opResult: applyUpdate(state, step, isolation) }
    case 'insert':
      return { opResult: applyInsert(state, step, isolation) }
    case 'delete':
      return { opResult: applyDelete(state, step, isolation) }
    case 'commit':
      return { opResult: applyCommit(state, step) }
    case 'rollback':
      return { opResult: applyRollback(state, step) }
    default:
      return { opResult: null }
  }
}

function detectAnomaly(history, isolation) {
  // Analisa o histórico executado e aponta qual anomalia ocorreu, se houver.
  const reads = []
  history.forEach((h, idx) => {
    if (h.step.op === 'select') {
      reads.push({ idx, tx: h.step.tx, rowId: h.step.rowId, value: h.opResult.value })
    }
  })

  // Dirty read: tx B leu valor escrito por tx A e A deu rollback depois.
  for (let i = 0; i < reads.length; i += 1) {
    const r = reads[i]
    if (r.value === null || r.rowId === undefined) continue
    // Valor veio de uma transação que mais tarde abortou?
    const sourceTx = history.find(
      (h, idx) =>
        idx < r.idx &&
        h.step.op === 'update' &&
        h.step.tx !== r.tx &&
        h.step.rowId === r.rowId &&
        h.opResult.value &&
        JSON.stringify(h.opResult.value) === JSON.stringify(r.value),
    )
    if (sourceTx) {
      const rolledBack = history.some(
        (h, idx) => idx > r.idx && h.step.op === 'rollback' && h.step.tx === sourceTx.step.tx,
      )
      if (rolledBack) return 'dirty-read'
    }
  }

  // Non-repeatable read: mesma tx leu a mesma linha duas vezes com valores
  // diferentes sem ter escrito ela no meio.
  const readsByTxRow = {}
  reads.forEach((r) => {
    if (r.rowId === undefined) return
    const key = `${r.tx}-${r.rowId}`
    if (!readsByTxRow[key]) readsByTxRow[key] = []
    readsByTxRow[key].push(r)
  })
  for (const key of Object.keys(readsByTxRow)) {
    const list = readsByTxRow[key]
    for (let i = 1; i < list.length; i += 1) {
      if (JSON.stringify(list[i - 1].value) !== JSON.stringify(list[i].value)) {
        const txId = list[i].tx
        const wroteBetween = history.some(
          (h, idx) =>
            idx > list[i - 1].idx &&
            idx < list[i].idx &&
            h.step.op === 'update' &&
            h.step.tx === txId &&
            h.step.rowId === list[i].rowId,
        )
        if (!wroteBetween) return 'non-repeatable-read'
      }
    }
  }

  // Phantom read: mesma tx leu um range duas vezes e o conjunto mudou.
  const rangeReads = history.filter((h) => h.step.op === 'select' && h.step.predicate)
  for (let i = 0; i < rangeReads.length; i += 1) {
    const first = rangeReads[i]
    for (let j = i + 1; j < rangeReads.length; j += 1) {
      const second = rangeReads[j]
      if (first.step.tx === second.step.tx) {
        const a = JSON.stringify(first.opResult.value)
        const b = JSON.stringify(second.opResult.value)
        if (a !== b) return 'phantom-read'
      }
    }
  }

  // Lost update: duas txs leem, atualizam e a segunda sobrescreve a primeira.
  const updates = history
    .map((h, idx) => (h.step.op === 'update' ? { ...h, idx } : null))
    .filter(Boolean)
  for (let i = 0; i < updates.length; i += 1) {
    for (let j = i + 1; j < updates.length; j += 1) {
      if (
        updates[i].step.tx !== updates[j].step.tx &&
        updates[i].step.rowId === updates[j].step.rowId
      ) {
        return 'lost-update'
      }
    }
  }

  return null
}

export function simulateScenario(scenario, isolationLevel) {
  const state = buildInitialState(scenario.initialRows)
  const history = []
  let serializationError = null

  for (let i = 0; i < scenario.steps.length; i += 1) {
    const step = scenario.steps[i]
    const stepState = clone(state)
    const { opResult } = applyStep(stepState, step, isolationLevel)

    if (opResult && opResult.serializationConflict) {
      serializationError = {
        stepIndex: i,
        conflictTx: opResult.conflictTx,
      }
      history.push({
        step,
        state: clone(state),
        opResult: { serializationConflict: true, conflictTx: opResult.conflictTx },
      })
      break
    }

    // Aplica a mudança no estado real.
    Object.assign(state, stepState)

    history.push({
      step,
      state: clone(state),
      opResult,
    })
  }

  const anomaly = detectAnomaly(history, isolationLevel)
  const finalState = clone(state)

  return {
    scenario,
    isolationLevel,
    history,
    anomaly,
    serializationError,
    finalState,
  }
}

export const SCENARIOS = {
  'dirty-read': {
    key: 'dirty-read',
    label: {
      pt: 'Dirty Read (leitura suja)',
      en: 'Dirty Read',
    },
    description: {
      pt:
        'T1 altera um saldo, mas ainda não confirmou. T2 lê esse valor provisório. Em seguida T1 desfaz a alteração. Se T2 tomou decisões com base no valor lido, elas estão inconsistentes.',
      en:
        'T1 changes a balance but has not committed yet. T2 reads that provisional value. Then T1 rolls back. If T2 made decisions based on the read value, they are inconsistent.',
    },
    initialRows: [
      { id: 1, name: 'Alice', balance: 1000 },
      { id: 2, name: 'Bob', balance: 500 },
    ],
    steps: [
      { tx: 1, op: 'begin' },
      { tx: 1, op: 'update', rowId: 1, changes: { balance: 900 } },
      { tx: 2, op: 'begin' },
      { tx: 2, op: 'select', rowId: 1 },
      { tx: 1, op: 'rollback' },
      { tx: 2, op: 'commit' },
    ],
  },
  'non-repeatable-read': {
    key: 'non-repeatable-read',
    label: {
      pt: 'Non-repeatable Read (leitura não repetível)',
      en: 'Non-repeatable Read',
    },
    description: {
      pt:
        'T1 lê um saldo, T2 atualiza e confirma o mesmo saldo, e T1 lê novamente dentro da mesma transação obtendo um valor diferente.',
      en:
        'T1 reads a balance, T2 updates and commits the same balance, and T1 reads it again within the same transaction getting a different value.',
    },
    initialRows: [
      { id: 1, name: 'Alice', balance: 1000 },
      { id: 2, name: 'Bob', balance: 500 },
    ],
    steps: [
      { tx: 1, op: 'begin' },
      { tx: 1, op: 'select', rowId: 1 },
      { tx: 2, op: 'begin' },
      { tx: 2, op: 'update', rowId: 1, changes: { balance: 800 } },
      { tx: 2, op: 'commit' },
      { tx: 1, op: 'select', rowId: 1 },
      { tx: 1, op: 'commit' },
    ],
  },
  'phantom-read': {
    key: 'phantom-read',
    label: {
      pt: 'Phantom Read (leitura fantasma)',
      en: 'Phantom Read',
    },
    description: {
      pt:
        'T1 lê todas as contas com saldo maior que 600. T2 insere uma nova conta com saldo 900 e confirma. Quando T1 repete a consulta, aparece uma linha “fantasma”.',
      en:
        'T1 reads all accounts with balance greater than 600. T2 inserts a new account with balance 900 and commits. When T1 repeats the query, a "phantom" row appears.',
    },
    initialRows: [
      { id: 1, name: 'Alice', balance: 1000 },
      { id: 2, name: 'Bob', balance: 500 },
    ],
    steps: [
      { tx: 1, op: 'begin' },
      { tx: 1, op: 'select', predicate: (row) => row.balance > 600 },
      { tx: 2, op: 'begin' },
      { tx: 2, op: 'insert', data: { id: 3, name: 'Carol', balance: 900 } },
      { tx: 2, op: 'commit' },
      { tx: 1, op: 'select', predicate: (row) => row.balance > 600 },
      { tx: 1, op: 'commit' },
    ],
  },
  'lost-update': {
    key: 'lost-update',
    label: {
      pt: 'Lost Update (atualização perdida)',
      en: 'Lost Update',
    },
    description: {
      pt:
        'T1 e T2 leem o mesmo saldo, atualizam com base nesse valor e confirmam. A atualização de T1 é sobrescrita pela de T2, perdendo a primeira alteração.',
      en:
        'T1 and T2 read the same balance, update it based on that value and commit. T1\'s update is overwritten by T2\'s, losing the first change.',
    },
    initialRows: [{ id: 1, name: 'Alice', balance: 1000 }],
    steps: [
      { tx: 1, op: 'begin' },
      { tx: 2, op: 'begin' },
      { tx: 1, op: 'select', rowId: 1 },
      { tx: 2, op: 'select', rowId: 1 },
      { tx: 1, op: 'update', rowId: 1, changes: { balance: 1100 } },
      { tx: 2, op: 'update', rowId: 1, changes: { balance: 900 } },
      { tx: 1, op: 'commit' },
      { tx: 2, op: 'commit' },
    ],
  },
}

export function getScenarioList() {
  return Object.values(SCENARIOS).map((s) => ({
    key: s.key,
    label: s.label,
    description: s.description,
  }))
}

export function getScenario(key) {
  return SCENARIOS[key]
}

export const ANOMALY_INFO = {
  'dirty-read': {
    pt: {
      name: 'Dirty Read',
      explanation:
        'Ocorre quando uma transação lê dados que ainda não foram confirmados por outra transação. Se a outra transação desfizer, o valor lido nunca existiu de fato.',
      preventedBy: ['read-committed', 'repeatable-read', 'serializable'],
    },
    en: {
      name: 'Dirty Read',
      explanation:
        'Happens when a transaction reads data that has not been committed by another transaction yet. If the other transaction rolls back, the read value never actually existed.',
      preventedBy: ['read-committed', 'repeatable-read', 'serializable'],
    },
  },
  'non-repeatable-read': {
    pt: {
      name: 'Non-repeatable Read',
      explanation:
        'Ocorre quando uma transação lê a mesma linha duas vezes e encontra valores diferentes, porque outra transação alterou e confirmou a linha no meio do caminho.',
      preventedBy: ['repeatable-read', 'serializable'],
    },
    en: {
      name: 'Non-repeatable Read',
      explanation:
        'Happens when a transaction reads the same row twice and finds different values, because another transaction changed and committed the row in between.',
      preventedBy: ['repeatable-read', 'serializable'],
    },
  },
  'phantom-read': {
    pt: {
      name: 'Phantom Read',
      explanation:
        'Ocorre quando uma transação executa a mesma consulta de range duas vezes e o conjunto de linhas retornado muda, porque outra transação inseriu ou removeu linhas que satisfazem a condição.',
      preventedBy: ['serializable'],
    },
    en: {
      name: 'Phantom Read',
      explanation:
        'Happens when a transaction runs the same range query twice and the returned set of rows changes, because another transaction inserted or deleted rows matching the condition.',
      preventedBy: ['serializable'],
    },
  },
  'lost-update': {
    pt: {
      name: 'Lost Update',
      explanation:
        'Ocorre quando duas transações leem o mesmo valor, o alteram independentemente e confirmam. A segunda confirmação sobrescreve a primeira, perdendo sua atualização.',
      preventedBy: ['serializable'],
    },
    en: {
      name: 'Lost Update',
      explanation:
        'Happens when two transactions read the same value, modify it independently and commit. The second commit overwrites the first, losing its update.',
      preventedBy: ['serializable'],
    },
  },
}

export function sourceCode() {
  return `// Motor simplificado de níveis de isolamento SQL.
// Regras de visibilidade usadas na simulação:
//
// READ UNCOMMITTED: SELECT vê a versão mais recente, commitada ou não.
// READ COMMITTED:   SELECT vê apenas versões commitadas (ou as próprias
//                   alterações não commitadas da transação).
// REPEATABLE READ:  O primeiro SELECT de cada transação cria um snapshot;
//                   leituras subsequentes reutilizam esse snapshot.
// SERIALIZABLE:     Igual ao REPEATABLE READ, mas UPDATE/INSERT/DELETE de
//                   outras transações que conflitem com leituras ativas
//                   geram erro de serialização (simplificado aqui).

export const ISOLATION_LEVELS = [
  { key: 'read-uncommitted', name: 'READ UNCOMMITTED' },
  { key: 'read-committed', name: 'READ COMMITTED' },
  { key: 'repeatable-read', name: 'REPEATABLE READ' },
  { key: 'serializable', name: 'SERIALIZABLE' },
]

function clone(obj) { return JSON.parse(JSON.stringify(obj)) }

function readRow(row, txId, isolation, snapshot) {
  const latest = row.versions[row.versions.length - 1]
  const own = row.versions.findLast(v => v.txId === txId && v.status === 'active')
  const committed = row.versions.findLast(v => v.status === 'committed')

  if (isolation === 'read-uncommitted') {
    return latest.deleted ? null : latest.data
  }

  if (isolation === 'read-committed') {
    if (own) return own.deleted ? null : own.data
    return committed ? (committed.deleted ? null : committed.data) : null
  }

  // REPEATABLE READ / SERIALIZABLE usam snapshot.
  if (snapshot && snapshot.rows[row.id] !== undefined) {
    return snapshot.rows[row.id]
  }
  if (own) return own.deleted ? null : own.data
  return committed ? (committed.deleted ? null : committed.data) : null
}

function ensureSnapshot(state, txId) {
  const tx = state.transactions[txId]
  if (tx.snapshot) return tx.snapshot
  const snap = { rows: {} }
  state.rows.forEach(row => {
    snap.rows[row.id] = readRow(row, txId, 'read-committed', null)
  })
  tx.snapshot = snap
  return snap
}

function applyStep(state, step, isolation) {
  const tx = state.transactions[step.tx] || { status: 'active', snapshot: null, ranges: [] }
  state.transactions[step.tx] = tx

  switch (step.op) {
    case 'begin':
      return null
    case 'select': {
      const snapshot = ensureSnapshot(state, step.tx)
      if (step.rowId !== undefined) {
        const row = state.rows.find(r => r.id === step.rowId)
        return row ? readRow(row, step.tx, isolation, snapshot) : null
      }
      if (step.predicate) {
        const result = state.rows
          .map(r => readRow(r, step.tx, isolation, snapshot))
          .filter(Boolean)
          .filter(step.predicate)
        if (isolation === 'serializable') tx.ranges.push(step.predicate)
        return result
      }
      return null
    }
    case 'update': {
      const row = state.rows.find(r => r.id === step.rowId)
      const visible = readRow(row, step.tx, isolation, null)
      const next = visible ? clone(visible) : clone(row.versions[0].data)
      Object.assign(next, step.changes)
      row.versions = row.versions.filter(v => !(v.txId === step.tx && v.status === 'active'))
      row.versions.push({ txId: step.tx, data: next, status: 'active', deleted: false })
      return next
    }
    case 'insert': {
      state.rows.push({
        id: step.data.id,
        versions: [{ txId: step.tx, data: clone(step.data), status: 'active', deleted: false }],
      })
      return step.data
    }
    case 'commit':
      tx.status = 'committed'
      state.rows.forEach(row => {
        row.versions.forEach(v => {
          if (v.txId === step.tx && v.status === 'active') v.status = 'committed'
        })
      })
      return null
    case 'rollback':
      tx.status = 'aborted'
      state.rows.forEach(row => {
        row.versions.forEach(v => {
          if (v.txId === step.tx && v.status === 'active') v.status = 'aborted'
        })
      })
      return null
  }
}

export function simulateScenario(scenario, isolationLevel) {
  const state = {
    rows: scenario.initialRows.map(r => ({
      id: r.id,
      versions: [{ txId: null, data: clone(r), status: 'committed', deleted: false }],
    })),
    transactions: {},
  }
  const history = scenario.steps.map(step => {
    const opResult = applyStep(state, step, isolationLevel)
    return { step, state: clone(state), opResult }
  })
  return { scenario, isolationLevel, history, finalState: clone(state) }
}
`
}
